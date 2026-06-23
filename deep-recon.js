// deep-recon.js — Deep Reconnaissance Patrol & Intel Gathering module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Public API:
//   DeepRecon.init(scene, camera, renderer)
//   DeepRecon.update(delta)
//   DeepRecon.reset()
//
// Start mission: press D + R simultaneously

window.DeepRecon = (function () {
  'use strict';

  // ─────────────────────────────────────── constants

  var OBJECTIVE_COUNT        = 5;
  var OBSERVE_RADIUS         = 3;          // units — must be within this to observe
  var PHOTO_MAX_DIST         = 60;         // units — max photo distance
  var PHOTO_ARC_DEG          = 80;         // degrees — target must be within this arc
  var CAMERA_FOV_NORMAL      = 75;
  var CAMERA_FOV_ZOOM        = 20;
  var PATROL_MARKER_MAX      = 8;
  var DETECTION_DECAY        = 3;          // % per second decay
  var DETECTION_WALK         = 4;          // % per second base walk noise
  var DETECTION_RUN          = 10;         // % per second run noise
  var DETECTION_SHOOT        = 60;         // % instant jump if shooting
  var DETECTION_SIGHT_MULT   = 2.5;        // multiplier when in enemy sight cone
  var ENEMY_SIGHT_RANGE      = 18;         // units
  var ENEMY_SIGHT_CONE       = 45;         // degrees half-angle
  var ENEMY_PATROL_SPEED     = 2.5;        // units/sec
  var PLAYER_WALK_SPEED      = 4.0;
  var PLAYER_RUN_SPEED       = 8.0;
  var OP_OBSERVE_DURATION    = 10;         // seconds player must stay still
  var OP_REPORT_DURATION     = 20;         // seconds enemy observation window
  var EXTRACT_TIME_LIMIT     = 300;        // seconds (5 minutes)
  var EXTRACT_RADIUS         = 4;

  // Ring geometry
  var RING_OUTER             = 4;
  var RING_INNER             = 3.6;
  var RING_HEIGHT            = 0.3;

  // Colors
  var COLOR_OBJECTIVE        = 0xFFAA00;
  var COLOR_EXTRACTION       = 0x00FF88;
  var COLOR_ROUTE_MARKER     = 0xFFFF00;
  var COLOR_CAMERA_BODY      = 0x222222;
  var COLOR_OP_MARKER        = 0x00AAFF;
  var COLOR_ENEMY            = 0xCC2200;
  var COLOR_ENEMY_HQ         = 0x882200;
  var COLOR_AA               = 0x666600;
  var COLOR_FUEL             = 0x884400;
  var COLOR_BRIDGE           = 0x555566;
  var COLOR_COMMS            = 0x224488;

  // Target types
  var TARGET_TYPES = [
    'Enemy HQ',
    'AA Battery',
    'Fuel Depot',
    'Bridge',
    'Communications Tower'
  ];

  var STRIKE_OPTIONS = [
    'Recommend air strike — high priority',
    'Recommend artillery barrage',
    'Recommend sabotage team insertion',
    'Recommend cruise missile strike',
    'Recommend electronic warfare disruption'
  ];

  // ─────────────────────────────────────── state

  var scene, camera, renderer;
  var active    = false;
  var started   = false;
  var missionOver = false;
  var missionSuccess = false;

  // Player
  var player = {
    pos:       { x: 0, y: 1, z: 0 },
    yaw:       0,
    mesh:      null,
    moving:    false,
    running:   false,
    detection: 0
  };

  // Keys
  var keys = {};

  // Objectives
  var objectives      = [];   // { pos, type, ringMesh, structMesh, observed, photographed }
  var objectivesObs   = 0;
  var objectivesPhoto = 0;

  // Intel log
  var intelLog = [];   // { type, strength, grid, strike }

  // Patrol route markers
  var routeMarkers    = [];   // THREE.Mesh
  var routePositions  = [];   // { x, y, z }

  // Enemies
  var enemies = [];   // { pos, dir, patrolPts, ptIdx, mesh, sightConeMesh, garrison(obj idx) }

  // Camera (observer kit)
  var cameraMesh  = null;     // visible in scene (HUD proxy)
  var zoomMode    = false;

  // Crosshair overlay
  var crosshairEl = null;

  // OP site
  var opActive    = false;
  var opTimer     = 0;
  var opMesh      = null;
  var opTargetIdx = -1;
  var opReportReady = false;

  // Extraction
  var extractionActive = false;
  var extractionMesh   = null;
  var extractionTimer  = EXTRACT_TIME_LIMIT;

  // HUD
  var hudEl       = null;
  var intelPanel  = null;
  var intelPanelVisible = false;
  var opReportEl  = null;
  var opReports   = [];

  // Clock / timing
  var clock = null;

  // Minimap
  var minimapEl = null;

  // ─────────────────────────────────────── init

  function init(sc, cam, ren) {
    scene    = sc;
    camera   = cam;
    renderer = ren;
    clock    = new THREE.Clock(false);

    _buildHUD();
    _buildCrosshair();
    _buildMinimapEl();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup',   _onKeyUp);

    active = true;
  }

  // ─────────────────────────────────────── public update

  function update(delta) {
    if (!active || !started || missionOver) return;

    _handleMovement(delta);
    _updateEnemies(delta);
    _checkObjectiveObserve();
    _updateDetection(delta);
    _updateOP(delta);
    _checkExtraction(delta);
    _updateHUD();
    _updateMinimap();
  }

  // ─────────────────────────────────────── public reset

  function reset() {
    _teardown();
    active  = true;
    started = false;
    missionOver = false;
    missionSuccess = false;
    _buildHUD();
  }

  // ─────────────────────────────────────── key handlers

  function _onKeyDown(e) {
    keys[e.code] = true;

    if (!started) {
      if (keys['KeyD'] && keys['KeyR']) {
        _startMission();
      }
      return;
    }

    if (missionOver) return;

    switch (e.code) {
      case 'KeyZ':
        _toggleZoom();
        break;
      case 'Space':
        if (zoomMode) { _takePhoto(); }
        break;
      case 'KeyI':
        _toggleIntelPanel();
        break;
      case 'KeyL':
        _dropRouteMarker();
        break;
      case 'KeyO':
        _startOP();
        break;
      case 'KeyE':
        if (objectivesPhoto >= OBJECTIVE_COUNT && !extractionActive) {
          _callExtraction();
        }
        break;
      default:
        break;
    }
  }

  function _onKeyUp(e) {
    keys[e.code] = false;
  }

  // ─────────────────────────────────────── mission start

  function _startMission() {
    started = true;
    clock.start();

    // Player starting mesh
    var pgeo  = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    var pmat  = new THREE.MeshLambertMaterial({ color: 0x2a5c1e });
    player.mesh = new THREE.Mesh(pgeo, pmat);
    player.mesh.position.set(0, 0.9, 0);
    scene.add(player.mesh);

    // Observer kit camera mesh (carried near player)
    var cgeo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
    var cmat = new THREE.MeshLambertMaterial({ color: COLOR_CAMERA_BODY });
    cameraMesh = new THREE.Mesh(cgeo, cmat);
    cameraMesh.position.set(0.6, 0.6, -0.8);
    player.mesh.add(cameraMesh);

    _placeObjectives();
    _spawnEnemies();
    _showHUD();
    _showMessage('DEEP RECON MISSION START — Photograph all 5 objectives undetected');
  }

  // ─────────────────────────────────────── objectives

  function _placeObjectives() {
    var angleStep = (Math.PI * 2) / OBJECTIVE_COUNT;

    for (var i = 0; i < OBJECTIVE_COUNT; i++) {
      var angle = angleStep * i + Math.random() * 0.4;
      var dist  = 30 + Math.random() * 50;    // 30-80 units from origin
      var ox    = Math.cos(angle) * dist;
      var oz    = Math.sin(angle) * dist;
      var oy    = 0;

      // Objective ring (CylinderGeometry)
      var rgeo = new THREE.CylinderGeometry(RING_OUTER, RING_OUTER, RING_HEIGHT, 32, 1, true);
      var rmat = new THREE.MeshLambertMaterial({ color: COLOR_OBJECTIVE, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
      var ringMesh = new THREE.Mesh(rgeo, rmat);
      ringMesh.position.set(ox, oy + RING_HEIGHT / 2, oz);
      scene.add(ringMesh);

      // Inner fill ring
      var rfgeo = new THREE.CylinderGeometry(RING_INNER, RING_INNER, RING_HEIGHT, 32, 1, true);
      var rfmat = new THREE.MeshLambertMaterial({ color: COLOR_OBJECTIVE, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
      var ringFill = new THREE.Mesh(rfgeo, rfmat);
      ringFill.position.set(ox, oy + RING_HEIGHT / 2, oz);
      scene.add(ringFill);

      // Target structure
      var structMesh = _buildTargetStructure(TARGET_TYPES[i], ox, oy, oz);
      scene.add(structMesh);

      objectives.push({
        pos:         { x: ox, y: oy, z: oz },
        type:        TARGET_TYPES[i],
        ringMesh:    ringMesh,
        structMesh:  structMesh,
        observed:    false,
        photographed: false
      });
    }
  }

  function _buildTargetStructure(type, ox, oy, oz) {
    var geo, mat, mesh;

    switch (type) {
      case 'Enemy HQ':
        geo  = new THREE.BoxGeometry(8, 4, 6);
        mat  = new THREE.MeshLambertMaterial({ color: COLOR_ENEMY_HQ });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 2, oz);
        break;
      case 'AA Battery':
        geo  = new THREE.CylinderGeometry(0.3, 0.5, 5, 8);
        mat  = new THREE.MeshLambertMaterial({ color: COLOR_AA });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 2.5, oz);
        break;
      case 'Fuel Depot':
        geo  = new THREE.CylinderGeometry(2, 2, 4, 12);
        mat  = new THREE.MeshLambertMaterial({ color: COLOR_FUEL });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 2, oz);
        break;
      case 'Bridge':
        geo  = new THREE.BoxGeometry(12, 0.5, 3);
        mat  = new THREE.MeshLambertMaterial({ color: COLOR_BRIDGE });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 1.5, oz);
        break;
      case 'Communications Tower':
        geo  = new THREE.CylinderGeometry(0.2, 0.8, 10, 6);
        mat  = new THREE.MeshLambertMaterial({ color: COLOR_COMMS });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 5, oz);
        break;
      default:
        geo  = new THREE.BoxGeometry(4, 3, 4);
        mat  = new THREE.MeshLambertMaterial({ color: 0x888888 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy + 1.5, oz);
        break;
    }

    return mesh;
  }

  // ─────────────────────────────────────── enemies

  function _spawnEnemies() {
    for (var i = 0; i < objectives.length; i++) {
      var obj    = objectives[i];
      var count  = 2 + Math.floor(Math.random() * 3);  // 2-4 guards

      for (var g = 0; g < count; g++) {
        var angle  = (Math.PI * 2 / count) * g;
        var radius = 6 + Math.random() * 4;
        var ex     = obj.pos.x + Math.cos(angle) * radius;
        var ez     = obj.pos.z + Math.sin(angle) * radius;

        var egeo = new THREE.BoxGeometry(0.5, 1.6, 0.5);
        var emat = new THREE.MeshLambertMaterial({ color: COLOR_ENEMY });
        var emesh = new THREE.Mesh(egeo, emat);
        emesh.position.set(ex, 0.8, ez);
        scene.add(emesh);

        // Patrol route — 3 waypoints around objective
        var pts = [];
        for (var p = 0; p < 3; p++) {
          var pa = angle + (Math.PI * 2 / 3) * p;
          var pr = 5 + Math.random() * 6;
          pts.push({ x: obj.pos.x + Math.cos(pa) * pr, z: obj.pos.z + Math.sin(pa) * pr });
        }

        enemies.push({
          pos:        { x: ex, y: 0.8, z: ez },
          dir:        { x: Math.cos(angle + Math.PI / 2), z: Math.sin(angle + Math.PI / 2) },
          patrolPts:  pts,
          ptIdx:      0,
          mesh:       emesh,
          garrison:   i,
          alertTimer: 0
        });
      }
    }
  }

  // ─────────────────────────────────────── movement

  function _handleMovement(delta) {
    var speed   = 0;
    var moveX   = 0;
    var moveZ   = 0;
    var running = keys['ShiftLeft'] || keys['ShiftRight'];

    speed = running ? PLAYER_RUN_SPEED : PLAYER_WALK_SPEED;

    if (keys['KeyW'] || keys['ArrowUp'])    { moveZ -= 1; }
    if (keys['KeyS'] || keys['ArrowDown'])  { moveZ += 1; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { moveX -= 1; }
    if (keys['KeyD'] || keys['ArrowRight']) { moveX += 1; }

    // Rotation
    if (keys['KeyQ']) { player.yaw += 1.5 * delta; }
    if (keys['KeyE'] && !extractionActive) { player.yaw -= 1.5 * delta; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
      var cos = Math.cos(player.yaw);
      var sin = Math.sin(player.yaw);
      var wx  = (cos * moveX - sin * moveZ) * speed * delta;
      var wz  = (sin * moveX + cos * moveZ) * speed * delta;
      player.pos.x  += wx;
      player.pos.z  += wz;
      player.moving  = true;
      player.running = running;
    } else {
      player.moving  = false;
      player.running = false;
    }

    // OP — player must stay immobile
    if (opActive && player.moving) {
      _cancelOP();
    }

    if (player.mesh) {
      player.mesh.position.set(player.pos.x, player.pos.y, player.pos.z);
      player.mesh.rotation.y = player.yaw;
    }

    // Camera follow
    if (camera) {
      camera.position.set(
        player.pos.x - Math.sin(player.yaw) * 8,
        player.pos.y + 5,
        player.pos.z - Math.cos(player.yaw) * 8
      );
      camera.lookAt(player.pos.x, player.pos.y + 1, player.pos.z);
    }
  }

  // ─────────────────────────────────────── enemy AI

  function _updateEnemies(delta) {
    for (var i = 0; i < enemies.length; i++) {
      var en  = enemies[i];
      var tgt = en.patrolPts[en.ptIdx];
      var dx  = tgt.x - en.pos.x;
      var dz  = tgt.z - en.pos.z;
      var dd  = Math.sqrt(dx * dx + dz * dz);

      if (dd < 0.5) {
        en.ptIdx = (en.ptIdx + 1) % en.patrolPts.length;
      } else {
        var nx = dx / dd;
        var nz = dz / dd;
        en.pos.x   += nx * ENEMY_PATROL_SPEED * delta;
        en.pos.z   += nz * ENEMY_PATROL_SPEED * delta;
        en.dir.x    = nx;
        en.dir.z    = nz;
      }

      if (en.mesh) {
        en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        var faceAngle = Math.atan2(en.dir.x, en.dir.z);
        en.mesh.rotation.y = faceAngle;
      }
    }
  }

  // ─────────────────────────────────────── detection

  function _updateDetection(delta) {
    var inCone  = _playerInAnySightCone();
    var noiseRate = 0;

    if (player.moving) {
      noiseRate = player.running ? DETECTION_RUN : DETECTION_WALK;
    }

    if (inCone) {
      noiseRate *= DETECTION_SIGHT_MULT;
      if (!player.moving) { noiseRate = DETECTION_WALK * DETECTION_SIGHT_MULT; }
    }

    if (noiseRate > 0) {
      player.detection += noiseRate * delta;
    } else {
      player.detection -= DETECTION_DECAY * delta;
    }

    player.detection = Math.max(0, Math.min(100, player.detection));

    if (player.detection >= 100) {
      _missionFail('COMPROMISED — Enemy detection reached 100%');
    }
  }

  function _playerInAnySightCone() {
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      var dx = player.pos.x - en.pos.x;
      var dz = player.pos.z - en.pos.z;
      var dd = Math.sqrt(dx * dx + dz * dz);
      if (dd > ENEMY_SIGHT_RANGE) continue;

      var angleToPlayer = Math.atan2(dx, dz);
      var enemyFacing   = Math.atan2(en.dir.x, en.dir.z);
      var diff          = Math.abs(_angleDiff(angleToPlayer, enemyFacing));
      var halfCone      = (ENEMY_SIGHT_CONE * Math.PI) / 180;
      if (diff < halfCone) { return true; }
    }
    return false;
  }

  function _angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI)  { d -= Math.PI * 2; }
    while (d < -Math.PI) { d += Math.PI * 2; }
    return d;
  }

  // ─────────────────────────────────────── objective observe

  function _checkObjectiveObserve() {
    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      if (obj.observed) continue;
      var dx  = player.pos.x - obj.pos.x;
      var dz  = player.pos.z - obj.pos.z;
      var dd  = Math.sqrt(dx * dx + dz * dz);
      if (dd <= OBSERVE_RADIUS) {
        obj.observed = true;
        objectivesObs++;
        _showMessage('Objective observed: ' + obj.type + ' [' + objectivesObs + '/' + OBJECTIVE_COUNT + ']');
        if (obj.ringMesh) {
          obj.ringMesh.material.color.setHex(0x00FF44);
        }
      }
    }
  }

  // ─────────────────────────────────────── zoom / camera

  function _toggleZoom() {
    zoomMode = !zoomMode;
    if (camera) {
      camera.fov = zoomMode ? CAMERA_FOV_ZOOM : CAMERA_FOV_NORMAL;
      camera.updateProjectionMatrix();
    }
    if (crosshairEl) {
      crosshairEl.style.display = zoomMode ? 'block' : 'none';
    }
    _showMessage(zoomMode ? 'Camera: ZOOM x6 active — Space to photograph' : 'Camera: ZOOM off');
  }

  // ─────────────────────────────────────── photo

  function _takePhoto() {
    // Find nearest observable objective within arc and range
    var bestIdx  = -1;
    var bestDist = Infinity;

    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      if (obj.photographed) continue;

      var dx   = obj.pos.x - player.pos.x;
      var dz   = obj.pos.z - player.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > PHOTO_MAX_DIST) continue;

      // Check arc — angle between player facing and direction to target
      var angleToObj = Math.atan2(dx, dz);
      var playerFacing = player.yaw;
      var diff = Math.abs(_angleDiff(angleToObj, playerFacing));
      var halfArc = (PHOTO_ARC_DEG / 2) * Math.PI / 180;
      if (diff > halfArc) continue;

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx  = i;
      }
    }

    if (bestIdx === -1) {
      _showMessage('No valid target in frame — reposition camera');
      return;
    }

    var obj      = objectives[bestIdx];
    obj.photographed = true;
    objectivesPhoto++;

    // Generate intel entry
    var grid   = _makeGridCoord(obj.pos);
    var strength = 20 + Math.floor(Math.random() * 181);
    var strike   = STRIKE_OPTIONS[bestIdx % STRIKE_OPTIONS.length];
    var entry    = { type: obj.type, strength: strength, grid: grid, strike: strike };
    intelLog.push(entry);

    _showMessage('PHOTO CAPTURED: ' + obj.type + ' [' + objectivesPhoto + '/' + OBJECTIVE_COUNT + ' photos]');

    if (objectivesPhoto >= OBJECTIVE_COUNT) {
      _showMessage('All objectives photographed — press E to call extraction!');
    }
  }

  function _makeGridCoord(pos) {
    var gx = 400 + Math.floor(pos.x);
    var gz = 400 + Math.floor(pos.z);
    return 'GR ' + gx + '-' + gz;
  }

  // ─────────────────────────────────────── intel panel

  function _toggleIntelPanel() {
    intelPanelVisible = !intelPanelVisible;
    if (!intelPanel) return;
    intelPanel.style.display = intelPanelVisible ? 'block' : 'none';
    _refreshIntelPanel();
  }

  function _refreshIntelPanel() {
    if (!intelPanel) return;
    var html = '<h3 style="margin:0 0 8px;color:#FFD700;font-size:14px;letter-spacing:2px;">INTEL LOG</h3>';
    if (intelLog.length === 0) {
      html += '<p style="color:#aaa;font-size:11px;">No intel gathered yet.</p>';
    } else {
      for (var i = 0; i < intelLog.length; i++) {
        var e = intelLog[i];
        html += '<div style="border-bottom:1px solid #333;padding:6px 0;font-size:11px;">';
        html += '<b style="color:#FFAA00;">' + (i + 1) + '. ' + e.type + '</b><br>';
        html += 'Est. Strength: <b>' + e.strength + '</b> personnel<br>';
        html += 'Grid: <b>' + e.grid + '</b><br>';
        html += '<i style="color:#88FF88;">' + e.strike + '</i>';
        html += '</div>';
      }
    }
    if (opReports.length > 0) {
      html += '<h3 style="margin:8px 0;color:#00CCFF;font-size:12px;letter-spacing:1px;">OP REPORTS</h3>';
      for (var j = 0; j < opReports.length; j++) {
        var r = opReports[j];
        html += '<div style="border-bottom:1px solid #224;padding:6px 0;font-size:10px;color:#ccc;">';
        html += '<b style="color:#00CCFF;">OP Report — ' + r.type + '</b><br>';
        html += 'Guard count: <b>' + r.guardCount + '</b> | Vehicles: <b>' + r.vehicleCount + '</b><br>';
        html += 'Patrol schedule: ' + r.patrolSchedule + '<br>';
        html += 'Best infiltration window: ' + r.window;
        html += '</div>';
      }
    }
    intelPanel.innerHTML = html;
  }

  // ─────────────────────────────────────── route markers

  function _dropRouteMarker() {
    if (routeMarkers.length >= PATROL_MARKER_MAX) {
      _showMessage('Max patrol markers placed (' + PATROL_MARKER_MAX + ')');
      return;
    }
    var geo  = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_ROUTE_MARKER });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(player.pos.x, player.pos.y - 0.75, player.pos.z);
    scene.add(mesh);
    routeMarkers.push(mesh);
    routePositions.push({ x: player.pos.x, y: player.pos.y, z: player.pos.z });
    _showMessage('Route marker dropped [' + routeMarkers.length + '/' + PATROL_MARKER_MAX + ']');
  }

  // ─────────────────────────────────────── OP site

  function _startOP() {
    if (opActive) {
      _showMessage('OP already active — stay still');
      return;
    }

    // Find nearest unobserved objective within 20 units
    var bestIdx  = -1;
    var bestDist = 20;
    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      var dx  = player.pos.x - obj.pos.x;
      var dz  = player.pos.z - obj.pos.z;
      var dd  = Math.sqrt(dx * dx + dz * dz);
      if (dd < bestDist) {
        bestDist = dd;
        bestIdx  = i;
      }
    }

    if (bestIdx === -1) {
      _showMessage('No objective within OP range (20 units)');
      return;
    }

    opActive    = true;
    opTimer     = 0;
    opTargetIdx = bestIdx;
    opReportReady = false;

    // Plant OP marker
    var geo  = new THREE.BoxGeometry(0.4, 0.8, 0.4);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_OP_MARKER });
    opMesh   = new THREE.Mesh(geo, mat);
    opMesh.position.set(player.pos.x, player.pos.y - 0.5, player.pos.z);
    scene.add(opMesh);

    _showMessage('OP ESTABLISHED — Stay still for ' + OP_OBSERVE_DURATION + 's');
  }

  function _cancelOP() {
    if (!opActive) return;
    opActive = false;
    opTimer  = 0;
    if (opMesh) { scene.remove(opMesh); opMesh = null; }
    _showMessage('OP cancelled — player moved');
  }

  function _updateOP(delta) {
    if (!opActive) return;

    opTimer += delta;

    if (opTimer >= OP_OBSERVE_DURATION && !opReportReady) {
      opReportReady = true;
      _showMessage('Observing enemy garrison for ' + OP_REPORT_DURATION + 's...');
    }

    if (opTimer >= OP_OBSERVE_DURATION + OP_REPORT_DURATION) {
      _generateOPReport();
      opActive = false;
      if (opMesh) { scene.remove(opMesh); opMesh = null; }
    }
  }

  function _generateOPReport() {
    var obj = objectives[opTargetIdx];
    if (!obj) return;

    // Count garrison
    var guardCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].garrison === opTargetIdx) { guardCount++; }
    }

    var vehicleCount     = Math.floor(Math.random() * 4);
    var patrolSchedule   = _makePatrolSchedule();
    var window           = _makeInfWindow();

    var report = {
      type:           obj.type,
      guardCount:     guardCount,
      vehicleCount:   vehicleCount,
      patrolSchedule: patrolSchedule,
      window:         window
    };

    opReports.push(report);
    _showMessage('OP REPORT generated for ' + obj.type + ' — Press I to view intel');
  }

  function _makePatrolSchedule() {
    var schedules = [
      '4-man rotation, 15-min intervals',
      '2-man sweep, clockwise every 10 min',
      'Static post + roving 3-man patrol',
      '5-min overlapping coverage pattern',
      'Irregular patrol, no fixed schedule'
    ];
    return schedules[Math.floor(Math.random() * schedules.length)];
  }

  function _makeInfWindow() {
    var windows = [
      '03:00-03:15 local — guard rotation gap',
      '22:45-23:00 — shift change blind spot',
      '01:30-01:45 — northwest approach clear',
      'No consistent window — high vigilance',
      '04:10-04:25 — reduced visibility + fatigue'
    ];
    return windows[Math.floor(Math.random() * windows.length)];
  }

  // ─────────────────────────────────────── extraction

  function _callExtraction() {
    extractionActive = true;
    extractionTimer  = EXTRACT_TIME_LIMIT;

    // Spawn extraction zone 40-60 units from player in opposite direction from center
    var ex  = player.pos.x * -0.5 + (Math.random() - 0.5) * 20;
    var ez  = player.pos.z * -0.5 + (Math.random() - 0.5) * 20;
    var dist = Math.sqrt(ex * ex + ez * ez);
    if (dist < 20) { ex *= 20 / dist; ez *= 20 / dist; }

    var geo  = new THREE.CylinderGeometry(EXTRACT_RADIUS, EXTRACT_RADIUS, 0.3, 32);
    var mat  = new THREE.MeshLambertMaterial({ color: COLOR_EXTRACTION, transparent: true, opacity: 0.7 });
    extractionMesh = new THREE.Mesh(geo, mat);
    extractionMesh.position.set(ex, 0.15, ez);
    scene.add(extractionMesh);

    _showMessage('EXTRACTION CALLED — Reach LZ within 5 minutes!');
  }

  function _checkExtraction(delta) {
    if (!extractionActive) return;

    extractionTimer -= delta;
    if (extractionTimer <= 0) {
      _missionFail('EXTRACTION MISSED — Time expired');
      return;
    }

    // Pulse extraction zone
    if (extractionMesh) {
      extractionMesh.rotation.y += delta * 1.5;
    }

    // Check if player reached extraction
    if (extractionMesh) {
      var dx   = player.pos.x - extractionMesh.position.x;
      var dz   = player.pos.z - extractionMesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= EXTRACT_RADIUS) {
        _missionSuccess();
      }
    }
  }

  // ─────────────────────────────────────── mission end

  function _missionSuccess() {
    missionOver    = true;
    missionSuccess = true;
    _showMessage('MISSION COMPLETE — All objectives photographed, extraction successful!');
    if (hudEl) {
      hudEl.innerHTML = '<div style="color:#00FF88;font-size:18px;font-weight:bold;">MISSION COMPLETE — DEEP RECON SUCCESS</div>';
    }
  }

  function _missionFail(reason) {
    missionOver    = true;
    missionSuccess = false;
    _showMessage('MISSION FAILED: ' + reason);
    if (hudEl) {
      hudEl.innerHTML = '<div style="color:#FF3333;font-size:18px;font-weight:bold;">MISSION FAILED — ' + reason + '</div>';
    }
  }

  // ─────────────────────────────────────── HUD

  function _buildHUD() {
    if (hudEl) return;

    hudEl = document.createElement('div');
    hudEl.id = 'deep-recon-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:18px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#FFDD55',
      'font-family:monospace',
      'font-size:13px',
      'padding:7px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9000',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);

    // Intel panel
    intelPanel = document.createElement('div');
    intelPanel.id = 'deep-recon-intel-panel';
    intelPanel.style.cssText = [
      'position:fixed',
      'top:60px',
      'right:20px',
      'width:280px',
      'max-height:500px',
      'overflow-y:auto',
      'background:rgba(0,0,0,0.88)',
      'color:#ddd',
      'font-family:monospace',
      'font-size:11px',
      'padding:12px',
      'border:1px solid #444',
      'border-radius:4px',
      'z-index:9001',
      'display:none'
    ].join(';');
    document.body.appendChild(intelPanel);

    // Message banner
    if (!document.getElementById('deep-recon-msg')) {
      var msgEl = document.createElement('div');
      msgEl.id  = 'deep-recon-msg';
      msgEl.style.cssText = [
        'position:fixed',
        'top:24px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#FFFF44',
        'font-family:monospace',
        'font-size:12px',
        'padding:5px 14px',
        'border-radius:3px',
        'z-index:9002',
        'display:none',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(msgEl);
    }
  }

  function _showHUD() {
    if (hudEl) { hudEl.style.display = 'block'; }
  }

  function _updateHUD() {
    if (!hudEl || !started) return;
    var pct    = Math.round(player.detection);
    var photos = objectivesPhoto;
    var total  = OBJECTIVE_COUNT;
    var exStr  = '';

    if (extractionActive) {
      var mins = Math.floor(extractionTimer / 60);
      var secs = Math.floor(extractionTimer % 60);
      exStr = ' | EXTRACT IN: ' + _pad(mins) + ':' + _pad(secs);
    }

    hudEl.textContent = 'DEEP RECON [OBJ: ' + objectivesObs + '/' + total + '] [DETECTION: ' + pct + '%] [INTEL: ' + photos + ' PHOTOS]' + exStr;
  }

  function _pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function _showMessage(text) {
    var el = document.getElementById('deep-recon-msg');
    if (!el) return;
    el.textContent  = text;
    el.style.display = 'block';
    // Auto-hide after 3s
    if (el._hideTimer) { clearTimeout(el._hideTimer); }
    el._hideTimer = setTimeout(function () {
      el.style.display = 'none';
    }, 3000);
  }

  // ─────────────────────────────────────── crosshair

  function _buildCrosshair() {
    if (crosshairEl) return;
    crosshairEl = document.createElement('div');
    crosshairEl.id = 'deep-recon-crosshair';
    crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:40px',
      'height:40px',
      'pointer-events:none',
      'z-index:9003',
      'display:none'
    ].join(';');
    crosshairEl.innerHTML =
      '<div style="position:absolute;top:50%;left:0;width:100%;height:1px;background:#FFFF00;transform:translateY(-50%);"></div>' +
      '<div style="position:absolute;left:50%;top:0;height:100%;width:1px;background:#FFFF00;transform:translateX(-50%);"></div>' +
      '<div style="position:absolute;top:50%;left:50%;width:8px;height:8px;border:1px solid #FFFF00;border-radius:50%;transform:translate(-50%,-50%);"></div>';
    document.body.appendChild(crosshairEl);
  }

  // ─────────────────────────────────────── minimap

  function _buildMinimapEl() {
    if (minimapEl) return;
    var canvas = document.createElement('canvas');
    canvas.id     = 'deep-recon-minimap';
    canvas.width  = 160;
    canvas.height = 160;
    canvas.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:16px',
      'border:1px solid #555',
      'background:rgba(0,0,0,0.6)',
      'z-index:9000',
      'display:none'
    ].join(';');
    document.body.appendChild(canvas);
    minimapEl = canvas;
  }

  function _updateMinimap() {
    if (!minimapEl || !started) return;
    if (minimapEl.style.display === 'none') { minimapEl.style.display = 'block'; }

    var ctx = minimapEl.getContext('2d');
    var W   = minimapEl.width;
    var H   = minimapEl.height;
    var scale = W / 200;     // 200 unit world radius maps to minimap

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,10,0,0.7)';
    ctx.fillRect(0, 0, W, H);

    function wx(x) { return W / 2 + x * scale; }
    function wy(z) { return H / 2 + z * scale; }

    // Objectives
    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      ctx.beginPath();
      ctx.arc(wx(obj.pos.x), wy(obj.pos.z), 4, 0, Math.PI * 2);
      ctx.fillStyle = obj.photographed ? '#00FF44' : '#FFAA00';
      ctx.fill();
    }

    // Route markers
    ctx.fillStyle = '#FFFF00';
    for (var j = 0; j < routePositions.length; j++) {
      var rp = routePositions[j];
      ctx.fillRect(wx(rp.x) - 2, wy(rp.z) - 2, 4, 4);
    }

    // Enemies
    ctx.fillStyle = '#CC2200';
    for (var k = 0; k < enemies.length; k++) {
      var en = enemies[k];
      ctx.beginPath();
      ctx.arc(wx(en.pos.x), wy(en.pos.z), 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Extraction
    if (extractionActive && extractionMesh) {
      ctx.beginPath();
      ctx.arc(wx(extractionMesh.position.x), wy(extractionMesh.position.z), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00FF88';
      ctx.fill();
    }

    // Player
    ctx.save();
    ctx.translate(wx(player.pos.x), wy(player.pos.z));
    ctx.rotate(-player.yaw);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#44DDFF';
    ctx.fill();
    ctx.restore();

    // Detection ring
    var detR = (player.detection / 100) * 8;
    ctx.beginPath();
    ctx.arc(wx(player.pos.x), wy(player.pos.z), detR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,50,50,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ─────────────────────────────────────── teardown

  function _teardown() {
    // Remove scene objects
    if (player.mesh) { scene.remove(player.mesh); player.mesh = null; }
    if (cameraMesh)  { player.mesh && player.mesh.remove(cameraMesh); scene.remove(cameraMesh); cameraMesh = null; }
    if (opMesh)      { scene.remove(opMesh); opMesh = null; }
    if (extractionMesh) { scene.remove(extractionMesh); extractionMesh = null; }

    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      if (obj.ringMesh)   { scene.remove(obj.ringMesh); }
      if (obj.structMesh) { scene.remove(obj.structMesh); }
    }
    objectives    = [];
    objectivesObs = 0;
    objectivesPhoto = 0;

    for (var j = 0; j < enemies.length; j++) {
      if (enemies[j].mesh) { scene.remove(enemies[j].mesh); }
    }
    enemies = [];

    for (var k = 0; k < routeMarkers.length; k++) {
      scene.remove(routeMarkers[k]);
    }
    routeMarkers   = [];
    routePositions = [];

    intelLog    = [];
    opReports   = [];
    zoomMode    = false;
    opActive    = false;
    opTimer     = 0;
    opTargetIdx = -1;
    opReportReady = false;
    extractionActive = false;
    extractionTimer  = EXTRACT_TIME_LIMIT;
    intelPanelVisible = false;

    // Reset camera FOV
    if (camera) {
      camera.fov = CAMERA_FOV_NORMAL;
      camera.updateProjectionMatrix();
    }

    // Remove HUD elements
    var ids = ['deep-recon-hud', 'deep-recon-intel-panel', 'deep-recon-msg', 'deep-recon-crosshair', 'deep-recon-minimap'];
    for (var m = 0; m < ids.length; m++) {
      var el = document.getElementById(ids[m]);
      if (el && el.parentNode) { el.parentNode.removeChild(el); }
    }
    hudEl        = null;
    intelPanel   = null;
    crosshairEl  = null;
    minimapEl    = null;

    // Reset player
    player.pos       = { x: 0, y: 1, z: 0 };
    player.yaw       = 0;
    player.detection = 0;
    player.moving    = false;
    player.running   = false;

    keys = {};
  }

  // ─────────────────────────────────────── public API

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
