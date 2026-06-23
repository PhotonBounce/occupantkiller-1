// urban-patrol.js — Urban Patrol Mechanics for OccupantKiller
// Route assignment, sector coverage, contact reports, patrol base operations.
// IIFE pattern, var throughout — no let/const.

window.UrbanPatrol = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var WAYPOINT_MIN         = 4;
  var WAYPOINT_MAX         = 6;
  var WAYPOINT_RADIUS      = 0.4;
  var WAYPOINT_COLOR       = 0x00FFFF;
  var OVERWATCH_COLOR      = 0xFF8800;
  var OVERWATCH_DURATION   = 30;       // seconds buddy halts at overwatch post
  var PATROL_SPEED         = 3.5;      // units/sec buddy walk speed
  var SECTOR_GRID          = 5;        // 5×5 grid
  var SECTOR_PATROL_TTL    = 300;      // 5 min = green
  var SECTOR_AGING_TTL     = 150;      // 2.5 min = yellow threshold
  var PATROL_BASE_RADIUS   = 4;
  var PATROL_BASE_WALLS    = 6;
  var SANDBAG_COLOR        = 0xC2B280;
  var HEAL_RATE            = 5;        // HP per minute inside base
  var IED_CHANCE           = 0.20;     // 20% per sweep
  var IED_DAMAGE           = 50;
  var TOTAL_SWEEPS_TARGET  = 5;
  var MAP_WORLD_SIZE       = 200;      // world units total map size (assumed square)
  var SECTOR_WORLD_SIZE    = MAP_WORLD_SIZE / SECTOR_GRID; // units per sector cell
  var COMPASS_CANVAS_SIZE  = 80;
  var HUD_UPDATE_INTERVAL  = 0.25;     // seconds between HUD refresh

  // ── State ──────────────────────────────────────────────────────────────────
  var _scene         = null;
  var _camera        = null;
  var _player        = null;    // { position: THREE.Vector3, hp: number }
  var _enemies       = [];      // array of { mesh, position }

  // Route planning
  var _routePlanMode = false;
  var _waypoints     = [];      // [{ position, mesh, isOverwatch, overwatchLeft }]
  var _routeLine     = null;    // THREE.LineSegments
  var _routeAssigned = false;

  // Buddy AI patrol state
  var _buddy         = null;    // { mesh, position, hp } or null
  var _buddyWpIdx    = 0;
  var _buddySweeps   = 0;
  var _buddyOverwatchTimer = 0; // counts down when halted at overwatch
  var _buddyPaused   = false;

  // Patrol base
  var _patrolBase    = null;    // THREE.Group or null
  var _patrolBasePos = null;    // THREE.Vector3
  var _insideBase    = false;

  // Sector grid  [row][col] = { lastPatrolled: timestamp or -1 }
  var _sectorGrid    = [];

  // Contact reports
  var _contactReports = [];
  var _reportVisible  = false;
  var _reportTimer    = 0;
  var _reportDuration = 8; // seconds

  // Scores
  var _areaScore      = 0;
  var _contactScore   = 0;
  var _sweepScore     = 0;

  // IED per-sweep flag
  var _iedTriggeredThisSweep = false;

  // HUD elements
  var _hudPanel       = null;
  var _contactHud     = null;
  var _compassCanvas  = null;
  var _compassCtx     = null;
  var _waypointArrowEl = null;

  // Timer for HUD updates
  var _hudTimer       = 0;

  // Key tracking
  var _keysDown       = {};

  // raycaster for click-to-place waypoints
  var _raycaster      = new THREE.Raycaster();
  var _mouse          = new THREE.Vector2();

  // Game time (approximate wall-clock minutes:seconds for SALUTE)
  var _gameSeconds    = 0;

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(scene, camera, playerObj) {
    _scene   = scene;
    _camera  = camera;
    _player  = playerObj || { position: new THREE.Vector3(0, 0, 0), hp: 100 };
    _enemies = [];

    _initSectorGrid();
    _buildHUD();
    _buildCompass();
    _attachInputListeners();

    console.log('[UrbanPatrol] Initialized. P+R = route plan, P+B = patrol base.');
  }

  function _initSectorGrid() {
    _sectorGrid = [];
    var r, c;
    for (r = 0; r < SECTOR_GRID; r++) {
      _sectorGrid[r] = [];
      for (c = 0; c < SECTOR_GRID; c++) {
        _sectorGrid[r][c] = { lastPatrolled: -1 };
      }
    }
  }

  // ── Update (call every frame with delta in seconds) ────────────────────────
  function update(delta) {
    if (!_scene) { return; }

    _gameSeconds += delta;

    _updateBuddyPatrol(delta);
    _updatePatrolBase(delta);
    _updateSectorGrid();
    _updateContactReport(delta);
    _checkEnemyContact();

    _hudTimer += delta;
    if (_hudTimer >= HUD_UPDATE_INTERVAL) {
      _hudTimer = 0;
      _updateHUD();
      _drawCompass();
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    _routePlanMode  = false;
    _waypoints      = [];
    _routeAssigned  = false;
    _buddyWpIdx     = 0;
    _buddySweeps    = 0;
    _buddyPaused    = false;
    _buddyOverwatchTimer = 0;
    _iedTriggeredThisSweep = false;
    _areaScore      = 0;
    _contactScore   = 0;
    _sweepScore     = 0;
    _contactReports = [];
    _insideBase     = false;
    _gameSeconds    = 0;

    if (_routeLine) { _scene.remove(_routeLine); _routeLine = null; }
    var i;
    for (i = 0; i < _waypoints.length; i++) {
      if (_waypoints[i].mesh) { _scene.remove(_waypoints[i].mesh); }
    }
    _waypoints = [];

    if (_patrolBase) { _scene.remove(_patrolBase); _patrolBase = null; _patrolBasePos = null; }

    _initSectorGrid();
    if (_hudPanel)  { _hudPanel.style.display = 'none'; }
    if (_contactHud){ _contactHud.style.display = 'none'; }
  }

  // ── Patrol Route ───────────────────────────────────────────────────────────
  function _enterRoutePlanMode() {
    if (_routeAssigned) {
      _showToast('Route already assigned. Reset to re-plan.');
      return;
    }
    _routePlanMode = true;
    _waypoints = [];
    if (_routeLine) { _scene.remove(_routeLine); _routeLine = null; }
    _showToast('ROUTE PLAN: Click to place waypoints (4-6). Right-click = Overwatch. Enter = Assign.');
  }

  function _placeWaypoint(event) {
    if (!_routePlanMode) { return; }
    if (_waypoints.length >= WAYPOINT_MAX) {
      _showToast('Maximum ' + WAYPOINT_MAX + ' waypoints reached. Press Enter to assign.');
      return;
    }

    var isOverwatch = (event.button === 2);
    _mouse.x = (event.clientX / window.innerWidth)  * 2 - 1;
    _mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    _raycaster.setFromCamera(_mouse, _camera);

    // Raycast against a ground plane at y=0
    var groundNormal = new THREE.Vector3(0, 1, 0);
    var groundPlane  = new THREE.Plane(groundNormal, 0);
    var hitPoint     = new THREE.Vector3();
    _raycaster.ray.intersectPlane(groundPlane, hitPoint);

    if (!hitPoint) { return; }

    var color  = isOverwatch ? OVERWATCH_COLOR : WAYPOINT_COLOR;
    var geo    = new THREE.SphereGeometry(WAYPOINT_RADIUS, 8, 8);
    var mat    = new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.4 });
    var sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(hitPoint);
    sphere.position.y = WAYPOINT_RADIUS;
    _scene.add(sphere);

    var wpLabel = _waypoints.length;
    _waypoints.push({
      position:   sphere.position.clone(),
      mesh:       sphere,
      isOverwatch: isOverwatch,
      overwatchLeft: isOverwatch ? OVERWATCH_DURATION : 0,
      index:      wpLabel
    });

    _rebuildRouteLine();

    var typeLabel = isOverwatch ? ' [OVERWATCH]' : '';
    _showToast('WP ' + (_waypoints.length) + typeLabel + ' placed. (' + _waypoints.length + '/' + WAYPOINT_MAX + ')');
  }

  function _rebuildRouteLine() {
    if (_routeLine) { _scene.remove(_routeLine); _routeLine = null; }
    if (_waypoints.length < 2) { return; }

    var positions = [];
    var i;
    for (i = 0; i < _waypoints.length - 1; i++) {
      positions.push(_waypoints[i].position.x, _waypoints[i].position.y + 0.1, _waypoints[i].position.z);
      positions.push(_waypoints[i + 1].position.x, _waypoints[i + 1].position.y + 0.1, _waypoints[i + 1].position.z);
    }
    // Close loop back to start
    var last = _waypoints[_waypoints.length - 1];
    var first = _waypoints[0];
    positions.push(last.position.x, last.position.y + 0.1, last.position.z);
    positions.push(first.position.x, first.position.y + 0.1, first.position.z);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineBasicMaterial({ color: WAYPOINT_COLOR, linewidth: 2 });
    _routeLine = new THREE.LineSegments(geo, mat);
    _scene.add(_routeLine);
  }

  function _assignRoute() {
    if (!_routePlanMode) { return; }
    if (_waypoints.length < WAYPOINT_MIN) {
      _showToast('Need at least ' + WAYPOINT_MIN + ' waypoints! Only ' + _waypoints.length + ' placed.');
      return;
    }

    _routePlanMode  = false;
    _routeAssigned  = true;
    _buddyWpIdx     = 0;
    _buddySweeps    = 0;
    _iedTriggeredThisSweep = false;

    // Assign buddy — use ChainOfCommand BRAVO-1 if available
    if (window.ChainOfCommand && typeof window.ChainOfCommand.assignPatrolRoute === 'function') {
      window.ChainOfCommand.assignPatrolRoute('BRAVO-1', _waypoints);
    }

    // Spawn a local buddy mesh if no external buddy exists
    if (!_buddy) {
      _buddy = _spawnPatrolBuddy();
    }

    _showToast('Route assigned to BRAVO-1. ' + _waypoints.length + ' waypoints. Sweeps: 0/' + TOTAL_SWEEPS_TARGET);
  }

  // ── Buddy Patrol Mesh ──────────────────────────────────────────────────────
  function _spawnPatrolBuddy() {
    var group   = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.9, 0.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a7a3a });
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.07;
    group.add(head);

    var helmetGeo = new THREE.SphereGeometry(0.22, 6, 6);
    var helmetMat = new THREE.MeshLambertMaterial({ color: 0x3a5a2a });
    var helmet    = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.y = 1.25;
    group.add(helmet);

    // Start near first waypoint
    var startPos = (_waypoints.length > 0) ? _waypoints[0].position.clone() : new THREE.Vector3(0, 0, 0);
    group.position.copy(startPos);

    _scene.add(group);

    return {
      mesh:     group,
      position: group.position,
      hp:       100
    };
  }

  // ── Buddy Patrol Update ────────────────────────────────────────────────────
  function _updateBuddyPatrol(delta) {
    if (!_routeAssigned || !_buddy || _waypoints.length === 0) { return; }

    // Overwatch halt
    if (_buddyPaused) {
      _buddyOverwatchTimer -= delta;
      if (_buddyOverwatchTimer <= 0) {
        _buddyPaused = false;
        _buddyWpIdx  = (_buddyWpIdx + 1) % _waypoints.length;
      }
      return;
    }

    var targetWp  = _waypoints[_buddyWpIdx];
    var targetPos = targetWp.position.clone();
    targetPos.y   = _buddy.position.y;

    var dir  = new THREE.Vector3().subVectors(targetPos, _buddy.position);
    var dist = dir.length();

    if (dist < 1.0) {
      // Arrived at waypoint
      _markSectorPatrolled(_buddy.position);

      if (targetWp.isOverwatch) {
        _buddyPaused = true;
        _buddyOverwatchTimer = OVERWATCH_DURATION;
        _showToast('BRAVO-1 taking overwatch at WP' + (_buddyWpIdx + 1) + ' for ' + OVERWATCH_DURATION + 's');
        return;
      }

      // Advance to next waypoint
      _buddyWpIdx = (_buddyWpIdx + 1) % _waypoints.length;

      // Check if completed a sweep
      if (_buddyWpIdx === 0) {
        _buddySweeps++;
        _sweepScore = _buddySweeps;
        _showToast('SWEEP ' + _buddySweeps + '/' + TOTAL_SWEEPS_TARGET + ' complete!');
        _checkIED();
        _iedTriggeredThisSweep = false;
      }
    } else {
      dir.normalize();
      _buddy.position.addScaledVector(dir, PATROL_SPEED * delta);
      _buddy.mesh.position.copy(_buddy.position);
      // Face direction of travel
      _buddy.mesh.lookAt(_buddy.position.clone().add(dir));
    }
  }

  // ── Sector Grid ────────────────────────────────────────────────────────────
  function _worldToSector(pos) {
    var halfMap = MAP_WORLD_SIZE / 2;
    var col = Math.floor((pos.x + halfMap) / SECTOR_WORLD_SIZE);
    var row = Math.floor((pos.z + halfMap) / SECTOR_WORLD_SIZE);
    col = Math.max(0, Math.min(SECTOR_GRID - 1, col));
    row = Math.max(0, Math.min(SECTOR_GRID - 1, row));
    return { row: row, col: col };
  }

  function _markSectorPatrolled(pos) {
    var sec = _worldToSector(pos);
    _sectorGrid[sec.row][sec.col].lastPatrolled = _gameSeconds;
  }

  function _updateSectorGrid() {
    // Mark player's current sector
    if (_player && _player.position) {
      _markSectorPatrolled(_player.position);
    }

    // Recompute area coverage score
    var cleared = 0;
    var r, c;
    for (r = 0; r < SECTOR_GRID; r++) {
      for (c = 0; c < SECTOR_GRID; c++) {
        var age = _gameSeconds - _sectorGrid[r][c].lastPatrolled;
        if (_sectorGrid[r][c].lastPatrolled >= 0 && age < SECTOR_PATROL_TTL) {
          cleared++;
        }
      }
    }
    _areaScore = Math.round((cleared / (SECTOR_GRID * SECTOR_GRID)) * 100);
  }

  // Public: get sector status color for minimap
  function getSectorColor(row, col) {
    if (row < 0 || row >= SECTOR_GRID || col < 0 || col >= SECTOR_GRID) { return '#333'; }
    var cell = _sectorGrid[row][col];
    if (cell.lastPatrolled < 0) { return '#cc2222'; }
    var age = _gameSeconds - cell.lastPatrolled;
    if (age < SECTOR_AGING_TTL)  { return '#22cc44'; }
    if (age < SECTOR_PATROL_TTL) { return '#ccaa22'; }
    return '#cc2222';
  }

  // ── Patrol Base ────────────────────────────────────────────────────────────
  function _establishPatrolBase() {
    if (_patrolBase) {
      _showToast('Patrol base already established.');
      return;
    }

    _patrolBasePos = _player.position.clone();
    _patrolBase    = new THREE.Group();

    var i, angle;
    for (i = 0; i < PATROL_BASE_WALLS; i++) {
      angle = (i / PATROL_BASE_WALLS) * Math.PI * 2;
      var wallGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 6);
      var wallMat = new THREE.MeshLambertMaterial({ color: SANDBAG_COLOR });
      var wall    = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(
        _patrolBasePos.x + Math.cos(angle) * PATROL_BASE_RADIUS,
        _patrolBasePos.y + 0.3,
        _patrolBasePos.z + Math.sin(angle) * PATROL_BASE_RADIUS
      );
      // Stack a second sandbag layer
      var wall2Geo = new THREE.CylinderGeometry(0.22, 0.28, 0.55, 6);
      var wall2    = new THREE.Mesh(wall2Geo, wallMat);
      wall2.position.copy(wall.position);
      wall2.position.y += 0.55;
      _patrolBase.add(wall);
      _patrolBase.add(wall2);
    }

    // Center marker
    var centerGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12);
    var centerMat = new THREE.MeshLambertMaterial({ color: 0x888800 });
    var center    = new THREE.Mesh(centerGeo, centerMat);
    center.position.copy(_patrolBasePos);
    center.position.y += 0.02;
    _patrolBase.add(center);

    _scene.add(_patrolBase);
    _showToast('PATROL BASE established. Heal +' + HEAL_RATE + 'HP/min inside perimeter.');
  }

  function _updatePatrolBase(delta) {
    if (!_patrolBase || !_patrolBasePos || !_player) { return; }
    var dist = _player.position.distanceTo(_patrolBasePos);
    _insideBase = dist <= PATROL_BASE_RADIUS;

    if (_insideBase) {
      // Heal 5HP/min = 5/60 HP per second
      var healAmount = (HEAL_RATE / 60) * delta;
      _player.hp = Math.min(100, (_player.hp || 100) + healAmount);
      if (window._playerHP !== undefined) {
        window._playerHP = Math.min(100, (window._playerHP || 100) + healAmount);
      }
    }
  }

  // ── IED Check ─────────────────────────────────────────────────────────────
  function _checkIED() {
    if (_iedTriggeredThisSweep) { return; }
    if (Math.random() > IED_CHANCE) { return; }

    _iedTriggeredThisSweep = true;
    _showToast('⚠ IED DETONATION! BRAVO-1 reports contact!');

    if (window.ExplosiveOrdnance && typeof window.ExplosiveOrdnance.triggerIED === 'function') {
      window.ExplosiveOrdnance.triggerIED(_buddy ? _buddy.position : _player.position);
    } else {
      // Simulated damage
      if (_player) {
        _player.hp = Math.max(0, (_player.hp || 100) - IED_DAMAGE);
      }
      if (window._playerHP !== undefined) {
        window._playerHP = Math.max(0, (window._playerHP || 100) - IED_DAMAGE);
      }
      _showToast('IED! -' + IED_DAMAGE + 'HP. Watch your sectors!');
    }
  }

  // ── Contact Reports (SALUTE) ───────────────────────────────────────────────
  function _checkEnemyContact() {
    if (!_buddy || !_enemies || _enemies.length === 0) { return; }

    var i, enemy, dist;
    for (i = 0; i < _enemies.length; i++) {
      enemy = _enemies[i];
      if (!enemy || !enemy.position) { continue; }
      dist  = _buddy.position.distanceTo(enemy.position);
      if (dist < 30) {
        _fileContactReport(enemy);
        break; // one report per frame
      }
    }
  }

  function _fileContactReport(enemy) {
    // Avoid spam — only file if last report was >10s ago
    var now = _gameSeconds;
    if (_contactReports.length > 0) {
      var lastReport = _contactReports[_contactReports.length - 1];
      if (now - lastReport.time < 10) { return; }
    }

    var pos    = enemy.position || new THREE.Vector3(0, 0, 0);
    var gridX  = Math.floor((pos.x + MAP_WORLD_SIZE / 2) * (1000 / MAP_WORLD_SIZE));
    var gridZ  = Math.floor((pos.z + MAP_WORLD_SIZE / 2) * (1000 / MAP_WORLD_SIZE));
    var totalMins = Math.floor(_gameSeconds / 60);
    var secs      = Math.floor(_gameSeconds % 60);
    var timeStr   = _pad2(totalMins) + ':' + _pad2(secs);

    var activities = ['Moving', 'Stationary', 'Setting up', 'Retreating', 'Assaulting'];
    var equipment  = ['AK Rifles', 'RPG + AK', 'Sniper + AK', 'PKM MG', 'IEDs + AKs'];
    var sizes      = [1, 2, 3, 4, 5, 6, 8];

    var report = {
      size:     sizes[Math.floor(Math.random() * sizes.length)],
      activity: activities[Math.floor(Math.random() * activities.length)],
      locX:     gridX,
      locZ:     gridZ,
      unit:     'Infantry',
      time:     timeStr,
      equip:    equipment[Math.floor(Math.random() * equipment.length)],
      time:     timeStr
    };
    _contactReports.push({ report: report, time: now });
    _contactScore++;

    _displayContactReport(report);
  }

  function _displayContactReport(rep) {
    if (!_contactHud) { return; }
    _contactHud.innerHTML =
      '<div style="font-size:11px;color:#FF4444;font-weight:bold;margin-bottom:4px;">⚑ SALUTE REPORT</div>' +
      '<span style="color:#aaa">SIZE:</span> ' + rep.size + '<br>' +
      '<span style="color:#aaa">ACTIVITY:</span> ' + rep.activity + '<br>' +
      '<span style="color:#aaa">LOCATION:</span> Grid ' + _pad3(rep.locX) + '-' + _pad3(rep.locZ) + '<br>' +
      '<span style="color:#aaa">UNIT:</span> ' + rep.unit + '<br>' +
      '<span style="color:#aaa">TIME:</span> ' + rep.time + '<br>' +
      '<span style="color:#aaa">EQUIP:</span> ' + rep.equip;
    _contactHud.style.display = 'block';
    _reportVisible = true;
    _reportTimer   = _reportDuration;
  }

  function _updateContactReport(delta) {
    if (!_reportVisible) { return; }
    _reportTimer -= delta;
    if (_reportTimer <= 0) {
      _reportVisible = false;
      if (_contactHud) { _contactHud.style.display = 'none'; }
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    // Patrol status panel (top-center)
    _hudPanel = document.createElement('div');
    _hudPanel.id = 'urban-patrol-hud';
    _hudPanel.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:12px',
      'padding:6px 14px',
      'border:1px solid #00FFCC',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:900',
      'min-width:280px',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudPanel);

    // SALUTE contact report (left side)
    _contactHud = document.createElement('div');
    _contactHud.id = 'urban-patrol-contact';
    _contactHud.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:14px',
      'background:rgba(0,0,0,0.82)',
      'color:#FFCC00',
      'font-family:monospace',
      'font-size:12px',
      'padding:8px 12px',
      'border:1px solid #FF4444',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:900',
      'display:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(_contactHud);

    // Waypoint arrow (bottom-center)
    _waypointArrowEl = document.createElement('div');
    _waypointArrowEl.id = 'urban-patrol-arrow';
    _waypointArrowEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.6)',
      'color:#00FFFF',
      'font-family:monospace',
      'font-size:11px',
      'padding:4px 10px',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:900',
      'display:none'
    ].join(';');
    document.body.appendChild(_waypointArrowEl);

    // Mode indicator (route plan mode)
    var modeBanner = document.createElement('div');
    modeBanner.id  = 'urban-patrol-mode';
    modeBanner.style.cssText = [
      'position:fixed',
      'bottom:100px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,80,0,0.85)',
      'color:#00FF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 14px',
      'border:1px solid #00FF44',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:910',
      'display:none'
    ].join(';');
    modeBanner.id = 'urban-patrol-mode-banner';
    document.body.appendChild(modeBanner);
  }

  function _buildCompass() {
    var wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:14px',
      'z-index:900',
      'pointer-events:none'
    ].join(';');

    _compassCanvas = document.createElement('canvas');
    _compassCanvas.width  = COMPASS_CANVAS_SIZE;
    _compassCanvas.height = COMPASS_CANVAS_SIZE;
    _compassCanvas.style.display = 'block';
    _compassCtx = _compassCanvas.getContext('2d');
    wrap.appendChild(_compassCanvas);

    // Patrol effectiveness panel below compass
    var effPanel = document.createElement('div');
    effPanel.id  = 'urban-patrol-eff';
    effPanel.style.cssText = [
      'background:rgba(0,0,0,0.7)',
      'color:#aaffaa',
      'font-family:monospace',
      'font-size:10px',
      'padding:4px 6px',
      'border:1px solid #446644',
      'border-radius:3px',
      'margin-top:4px',
      'text-align:center'
    ].join(';');
    effPanel.id = 'urban-patrol-eff-panel';
    wrap.appendChild(effPanel);

    document.body.appendChild(wrap);
  }

  function _drawCompass() {
    if (!_compassCtx || !_camera) { return; }
    var ctx  = _compassCtx;
    var cx   = COMPASS_CANVAS_SIZE / 2;
    var cy   = COMPASS_CANVAS_SIZE / 2;
    var r    = cx - 4;

    ctx.clearRect(0, 0, COMPASS_CANVAS_SIZE, COMPASS_CANVAS_SIZE);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle   = 'rgba(0,0,0,0.55)';
    ctx.fill();

    // Get camera yaw
    var euler = new THREE.Euler();
    euler.setFromQuaternion(_camera.quaternion, 'YXZ');
    var yaw   = -euler.y; // radians, 0 = north

    // Cardinal labels
    var cardinals = [
      { label: 'N', angle: 0 },
      { label: 'E', angle: Math.PI / 2 },
      { label: 'S', angle: Math.PI },
      { label: 'W', angle: -Math.PI / 2 }
    ];
    var ci, ca, cx2, cy2;
    ctx.font      = 'bold 9px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (ci = 0; ci < cardinals.length; ci++) {
      ca  = cardinals[ci].angle + yaw;
      cx2 = cx + Math.sin(ca) * (r - 8);
      cy2 = cy - Math.cos(ca) * (r - 8);
      ctx.fillText(cardinals[ci].label, cx2, cy2);
    }

    // North needle (red)
    var needleAngle = yaw;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(needleAngle);
    ctx.beginPath();
    ctx.moveTo(0, -(r - 14));
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fillStyle = '#FF3333';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, r - 14);
    ctx.lineTo(3, 0);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fillStyle = '#CCCCCC';
    ctx.fill();
    ctx.restore();

    // Waypoint arrow (cyan dot)
    if (_routeAssigned && _waypoints.length > 0 && _buddy) {
      var wp   = _waypoints[_buddyWpIdx] || _waypoints[0];
      var dx   = wp.position.x - _player.position.x;
      var dz   = wp.position.z - _player.position.z;
      var wpAng = Math.atan2(dx, -dz) + yaw;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(wpAng) * (r - 16), cy - Math.cos(wpAng) * (r - 16), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#00FFFF';
      ctx.fill();
    }

    // Update effectiveness panel
    var effEl = document.getElementById('urban-patrol-eff-panel');
    if (effEl) {
      effEl.innerHTML =
        'AREA: ' + _areaScore + '%<br>' +
        'CONTACTS: ' + _contactScore + '<br>' +
        'SWEEPS: ' + _buddySweeps;
    }
  }

  function _updateHUD() {
    if (!_hudPanel) { return; }

    var statusLine = 'PATROL STATUS: ';
    if (!_routeAssigned) {
      statusLine += 'NO ROUTE (P+R to plan)';
    } else {
      statusLine += 'SWEEP ' + _buddySweeps + ' | ';
      if (_buddy && _waypoints.length > 0) {
        var wp   = _waypoints[_buddyWpIdx] || _waypoints[0];
        var dx   = wp.position.x - _player.position.x;
        var dz   = wp.position.z - _player.position.z;
        var dist = Math.round(Math.sqrt(dx * dx + dz * dz));
        statusLine += 'NEXT WP: ' + dist + 'm';
        if (wp.isOverwatch) { statusLine += ' [OW]'; }
      }
      if (_buddyPaused) { statusLine += ' [OVERWATCH ' + Math.ceil(_buddyOverwatchTimer) + 's]'; }
    }
    if (_insideBase) { statusLine += ' | <span style="color:#88FF88">BASE +HP</span>'; }

    _hudPanel.innerHTML = statusLine +
      '<br><span style="color:#AAFFAA;font-size:10px">' +
      'SWEEP ' + _buddySweeps + '/' + TOTAL_SWEEPS_TARGET +
      ' | COVERAGE: ' + _areaScore + '%' +
      '</span>';

    // Waypoint arrow
    if (_routeAssigned && _waypoints.length > 0 && _buddy && _waypointArrowEl) {
      var wpTgt = _waypoints[_buddyWpIdx] || _waypoints[0];
      var dx2   = wpTgt.position.x - _player.position.x;
      var dz2   = wpTgt.position.z - _player.position.z;
      var dist2 = Math.round(Math.sqrt(dx2 * dx2 + dz2 * dz2));
      _waypointArrowEl.innerHTML = '&#8593; NEXT WP: ' + dist2 + 'm';
      _waypointArrowEl.style.display = 'block';
    } else if (_waypointArrowEl) {
      _waypointArrowEl.style.display = 'none';
    }

    // Route plan mode banner
    var modeBanner = document.getElementById('urban-patrol-mode-banner');
    if (modeBanner) {
      if (_routePlanMode) {
        modeBanner.style.display = 'block';
        modeBanner.textContent   = 'ROUTE PLAN MODE — WP: ' + _waypoints.length + '/' + WAYPOINT_MAX + ' | Enter = Assign | RClick = Overwatch';
      } else {
        modeBanner.style.display = 'none';
      }
    }
  }

  // ── Toast notification ─────────────────────────────────────────────────────
  function _showToast(msg) {
    var el = document.getElementById('urban-patrol-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'urban-patrol-toast';
      el.style.cssText = [
        'position:fixed',
        'bottom:140px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.8)',
        'color:#FFFF88',
        'font-family:monospace',
        'font-size:12px',
        'padding:5px 14px',
        'border-radius:3px',
        'pointer-events:none',
        'z-index:950',
        'transition:opacity 0.4s'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () {
      el.style.opacity = '0';
    }, 3500);
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  function _attachInputListeners() {
    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);
    window.addEventListener('mousedown', _onMouseDown);
  }

  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    // P+R: enter route planning mode
    if (e.code === 'KeyR' && _keysDown['KeyP']) {
      _enterRoutePlanMode();
    }

    // P+B: establish patrol base
    if (e.code === 'KeyB' && _keysDown['KeyP']) {
      _establishPatrolBase();
    }

    // Enter: assign route
    if (e.code === 'Enter' && _routePlanMode) {
      e.preventDefault();
      _assignRoute();
    }
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  function _onMouseDown(e) {
    if (!_routePlanMode) { return; }
    e.preventDefault();
    _placeWaypoint(e);
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _pad3(n) {
    if (n < 10)  { return '00' + n; }
    if (n < 100) { return '0' + n; }
    return '' + n;
  }

  // ── Public API helpers ─────────────────────────────────────────────────────
  function setEnemies(enemyList) {
    _enemies = enemyList || [];
  }

  function getPatrolStats() {
    return {
      sweeps:   _buddySweeps,
      area:     _areaScore,
      contacts: _contactScore,
      inBase:   _insideBase
    };
  }

  // ── Expose ─────────────────────────────────────────────────────────────────
  return {
    init:           init,
    update:         update,
    reset:          reset,
    setEnemies:     setEnemies,
    getSectorColor: getSectorColor,
    getPatrolStats: getPatrolStats
  };

}());
