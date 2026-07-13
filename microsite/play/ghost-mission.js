// ghost-mission.js — Ghost Mission stealth module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Activation: G+M simultaneous keypress (both keys within 400ms)
//
// Public API:
//   GhostMission.init(scene, camera)
//   GhostMission.update(delta)
//   GhostMission.reset()
//   GhostMission.getScore()
//   GhostMission.isActive()

window.GhostMission = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  // Building layout
  var BUILDING_W           = 25;
  var BUILDING_H           = 16;
  var BUILDING_D           = 20;
  var BUILDING_COLOR       = 0x667788;
  var FLOOR_HEIGHT         = 4;
  var FLOOR_COUNT          = 4;

  // Server room (level 3)
  var SERVER_W             = 10;
  var SERVER_H             = 3;
  var SERVER_D             = 8;
  var SERVER_LEVEL         = 3;

  // Executive suite (level 4)
  var EXEC_W               = 12;
  var EXEC_H               = 4;
  var EXEC_D               = 10;
  var EXEC_LEVEL           = 4;

  // USB drive target
  var USB_COLOR            = 0x44AAFF;

  // Extraction point
  var EXTRACT_COLOR        = 0x00FF44;

  // Guard
  var GUARD_COUNT          = 10;
  var GUARD_COLOR          = 0x334488;
  var GUARD_CONE_HALF      = 25;          // degrees half-angle (50° total)
  var GUARD_RANGE_LIT      = 45;          // units in bright areas
  var GUARD_RANGE_SHADOW   = 15;          // units in shadow
  var GUARD_INVESTIGATE_DUR = 20;         // seconds before giving up
  var GUARD_MOVE_SPEED     = 2.5;

  // Guard dog
  var DOG_COLOR            = 0x8B6914;
  var DOG_SMELL_RANGE      = 8;           // units

  // Lights per floor
  var LIGHTS_PER_FLOOR     = 3;

  // Noise ranges (units)
  var NOISE_RUN            = 20;
  var NOISE_WALK           = 5;
  var NOISE_CRAWL          = 2;
  var NOISE_THROW          = 15;
  var NOISE_COIN           = 20;
  var NOISE_PANEL          = 10;

  // Knockout / body
  var TRANQ_STUN_DURATION  = 90;          // seconds
  var LOCKER_COLOR         = 0x334455;

  // Power box blackout
  var BLACKOUT_DURATION    = 60;          // seconds

  // Coin distraction
  var COIN_COLOR           = 0xFFDD00;
  var PANEL_BUZZ_DUR       = 10;          // seconds

  // Activation timing
  var ACTIVATION_WINDOW    = 400;         // ms

  // Scoring
  var SCORE_GHOST_RATING   = 3000;
  var SCORE_PER_KNOCKOUT   = -50;
  var SCORE_PER_ALARM      = -500;
  var TIME_BONUS_THRESHOLD = 300;         // 5 minutes in seconds

  // HUD IDs
  var HUD_ROOT_ID          = 'ghost-mission-hud';
  var HUD_BAR_ID           = 'ghost-mission-bar';
  var BANNER_ID            = 'ghost-mission-banner';

  // Movement modes
  var MOVE_RUN             = 'RUN';
  var MOVE_WALK            = 'WALK';
  var MOVE_CRAWL           = 'CRAWL';

  // ─────────────────────────────────────────────── state

  var _scene               = null;
  var _camera              = null;
  var _active              = false;

  // Key activation tracking
  var _gPressTime          = 0;
  var _mPressTime          = 0;
  var _keysDown            = {};

  // Building meshes
  var _buildingMesh        = null;
  var _serverRoomMesh      = null;
  var _execSuiteMesh       = null;
  var _elevatorMesh        = null;
  var _extractMesh         = null;
  var _usbMesh             = null;
  var _floorMeshes         = [];
  var _stairMeshes         = [];
  var _lockerMeshes        = [];

  // Lights
  var _floorLights         = [];          // array of arrays per floor [floor][light_idx]
  var _lightStates         = [];          // true = on, false = off (shadow zone)
  var _blackoutFloor       = -1;
  var _blackoutTimer       = 0;

  // Guards
  var _guards              = [];
  // Each guard: {mesh, dogMesh, floor, alive, stunned, stunTimer, carrying,
  //              patrolPoints, patrolIdx, patrolDir, state, investigateTarget,
  //              investigateTimer, hasDog}

  // Player state
  var _playerFloor         = 1;
  var _moveMode            = MOVE_WALK;
  var _inShadow            = false;
  var _hasUSB              = false;

  // Mission stats
  var _knockouts           = 0;
  var _detections          = 0;           // alarms triggered
  var _missionStartTime    = 0;
  var _missionActive       = false;

  // Carried body
  var _carriedGuard        = null;

  // Noise events: array of {pos, radius, timer}
  var _noiseEvents         = [];

  // Panel buzz events: array of {timer}
  var _panelBuzzEvents     = [];

  // Coins: array of {mesh, pos}
  var _coins               = [];

  // HUD elements
  var _hudRoot             = null;
  var _hudBar              = null;
  var _bannerEl            = null;
  var _bannerTimer         = null;

  var _keysBound           = false;

  // ─────────────────────────────────────────────── helpers

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _vecDist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _vec2Dist(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _floorY(floor) {
    return (floor - 1) * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.5;
  }

  function _playerPos() {
    if (_camera) return _camera.position;
    return new THREE.Vector3(0, 0, 0);
  }

  // ─────────────────────────────────────────────── HUD

  function _buildHUD() {
    if (document.getElementById(HUD_ROOT_ID)) {
      _hudRoot  = document.getElementById(HUD_ROOT_ID);
      _hudBar   = document.getElementById(HUD_BAR_ID);
      _bannerEl = document.getElementById(BANNER_ID);
      return;
    }

    _hudRoot = document.createElement('div');
    _hudRoot.id = HUD_ROOT_ID;
    _hudRoot.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'width:100%',
      'pointer-events:none',
      'z-index:600',
      'font-family:monospace',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudRoot);

    _hudBar = document.createElement('div');
    _hudBar.id = HUD_BAR_ID;
    _hudBar.style.cssText = [
      'position:absolute',
      'bottom:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00ffcc',
      'font-size:12px',
      'background:rgba(0,0,0,0.75)',
      'border:1px solid rgba(0,255,150,0.35)',
      'border-radius:4px',
      'padding:5px 14px',
      'letter-spacing:1px',
      'white-space:nowrap',
      'user-select:none'
    ].join(';');
    _hudBar.textContent = 'GHOST [FLOOR: 1] [DETECTIONS: 0] [KNOCKOUTS: 0] [DRIVE: NOT TAKEN] | GHOST RATING: PERFECT';
    _hudRoot.appendChild(_hudBar);

    _bannerEl = document.createElement('div');
    _bannerEl.id = BANNER_ID;
    _bannerEl.style.cssText = [
      'position:absolute',
      'bottom:50px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffffff',
      'font-size:15px',
      'font-weight:bold',
      'letter-spacing:3px',
      'background:rgba(0,0,0,0.75)',
      'border-radius:4px',
      'padding:5px 20px',
      'display:none',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    _hudRoot.appendChild(_bannerEl);
  }

  function _showBanner(text, color, duration) {
    if (!_bannerEl) return;
    if (_bannerTimer) clearTimeout(_bannerTimer);
    _bannerEl.textContent = text;
    _bannerEl.style.color = color || '#ffffff';
    _bannerEl.style.display = 'block';
    _bannerTimer = setTimeout(function () {
      if (_bannerEl) _bannerEl.style.display = 'none';
    }, (duration || 2) * 1000);
  }

  function _updateHUD() {
    if (!_hudBar) return;

    var driveStatus = _hasUSB ? 'ACQUIRED' : 'NOT TAKEN';
    var allAlive = _allGuardsAlive();
    var ratingStr = _calcRatingLabel();

    _hudBar.textContent =
      'GHOST' +
      ' [FLOOR: ' + _playerFloor + ']' +
      ' [DETECTIONS: ' + _detections + ']' +
      ' [KNOCKOUTS: ' + _knockouts + ']' +
      ' [DRIVE: ' + driveStatus + ']' +
      ' | GHOST RATING: ' + ratingStr;

    // Color: perfect = cyan, degraded = yellow, alarmed = red
    if (ratingStr === 'PERFECT') {
      _hudBar.style.color = '#00ffcc';
      _hudBar.style.borderColor = 'rgba(0,255,150,0.35)';
    } else if (_detections > 0) {
      _hudBar.style.color = '#ff4444';
      _hudBar.style.borderColor = 'rgba(255,80,80,0.4)';
    } else {
      _hudBar.style.color = '#ffdd44';
      _hudBar.style.borderColor = 'rgba(255,220,60,0.35)';
    }
  }

  function _allGuardsAlive() {
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i] && !_guards[i].alive) return false;
    }
    return true;
  }

  function _calcRatingLabel() {
    if (_detections === 0 && _allGuardsAlive()) return 'PERFECT';
    if (_detections === 0) return 'GHOST';
    if (_detections < 3) return 'SHADOW';
    return 'COMPROMISED';
  }

  // ─────────────────────────────────────────────── scene construction

  function _buildScene() {
    if (!_scene) return;

    // ── Main building shell ──────────────────────────────────────────
    var buildGeo = new THREE.BoxGeometry(BUILDING_W, BUILDING_H, BUILDING_D);
    var buildMat = new THREE.MeshPhongMaterial({
      color: BUILDING_COLOR,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      depthWrite: false
    });
    _buildingMesh = new THREE.Mesh(buildGeo, buildMat);
    _buildingMesh.position.set(0, BUILDING_H * 0.5, 0);
    _scene.add(_buildingMesh);

    // ── Floor slabs ─────────────────────────────────────────────────
    _floorMeshes = [];
    for (var f = 0; f < FLOOR_COUNT; f++) {
      var floorGeo = new THREE.BoxGeometry(BUILDING_W, 0.25, BUILDING_D);
      var floorMat = new THREE.MeshPhongMaterial({ color: 0x445566 });
      var floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, f * FLOOR_HEIGHT, 0);
      _scene.add(floorMesh);
      _floorMeshes.push(floorMesh);
    }

    // ── Elevator shaft ───────────────────────────────────────────────
    var elevGeo = new THREE.CylinderGeometry(0.8, 0.8, BUILDING_H, 8);
    var elevMat = new THREE.MeshPhongMaterial({ color: 0x223344, transparent: true, opacity: 0.5 });
    _elevatorMesh = new THREE.Mesh(elevGeo, elevMat);
    _elevatorMesh.position.set(BUILDING_W * 0.4, BUILDING_H * 0.5, 0);
    _scene.add(_elevatorMesh);

    // ── Stairwells (one per floor transition) ───────────────────────
    _stairMeshes = [];
    for (var s = 0; s < FLOOR_COUNT - 1; s++) {
      var stairGeo = new THREE.BoxGeometry(2, FLOOR_HEIGHT, 3);
      var stairMat = new THREE.MeshPhongMaterial({ color: 0x334455 });
      var stairMesh = new THREE.Mesh(stairGeo, stairMat);
      stairMesh.position.set(-BUILDING_W * 0.4, s * FLOOR_HEIGHT + FLOOR_HEIGHT * 0.5, -BUILDING_D * 0.35);
      _scene.add(stairMesh);
      _stairMeshes.push(stairMesh);
    }

    // ── Server room (level 3) ────────────────────────────────────────
    var serverGeo = new THREE.BoxGeometry(SERVER_W, SERVER_H, SERVER_D);
    var serverMat = new THREE.MeshPhongMaterial({ color: 0x1a2a3a, emissive: 0x001122 });
    _serverRoomMesh = new THREE.Mesh(serverGeo, serverMat);
    _serverRoomMesh.position.set(4, _floorY(SERVER_LEVEL), 3);
    _scene.add(_serverRoomMesh);

    // ── Executive suite (level 4) ────────────────────────────────────
    var execGeo = new THREE.BoxGeometry(EXEC_W, EXEC_H, EXEC_D);
    var execMat = new THREE.MeshPhongMaterial({ color: 0x2a1a0a, emissive: 0x110800 });
    _execSuiteMesh = new THREE.Mesh(execGeo, execMat);
    _execSuiteMesh.position.set(-2, _floorY(EXEC_LEVEL), -2);
    _scene.add(_execSuiteMesh);

    // ── USB drive on executive desk ──────────────────────────────────
    var usbGeo = new THREE.BoxGeometry(0.3, 0.1, 0.15);
    var usbMat = new THREE.MeshPhongMaterial({ color: USB_COLOR, emissive: 0x1133aa });
    _usbMesh = new THREE.Mesh(usbGeo, usbMat);
    _usbMesh.position.set(-2, _floorY(EXEC_LEVEL) + 0.55, -2);
    _scene.add(_usbMesh);

    // ── Extraction point (level 1) ───────────────────────────────────
    var extractGeo = new THREE.BoxGeometry(3, 0.1, 3);
    var extractMat = new THREE.MeshPhongMaterial({ color: EXTRACT_COLOR, emissive: 0x00aa22 });
    _extractMesh = new THREE.Mesh(extractGeo, extractMat);
    _extractMesh.position.set(8, 0.05, 7);
    _scene.add(_extractMesh);

    // ── Lockers (scattered on each floor) ────────────────────────────
    _lockerMeshes = [];
    var lockerPositions = [
      new THREE.Vector3(-9, _floorY(1), 6),
      new THREE.Vector3(-9, _floorY(2), 6),
      new THREE.Vector3(-9, _floorY(3), 6),
      new THREE.Vector3(-9, _floorY(4), 6),
      new THREE.Vector3(9,  _floorY(1), -6),
      new THREE.Vector3(9,  _floorY(2), -6)
    ];
    for (var lk = 0; lk < lockerPositions.length; lk++) {
      var lockerGeo = new THREE.BoxGeometry(1.2, 2.2, 0.6);
      var lockerMat = new THREE.MeshPhongMaterial({ color: LOCKER_COLOR });
      var lockerMesh = new THREE.Mesh(lockerGeo, lockerMat);
      lockerMesh.position.copy(lockerPositions[lk]);
      _scene.add(lockerMesh);
      _lockerMeshes.push({ mesh: lockerMesh, occupant: null });
    }

    // ── Floor lights ─────────────────────────────────────────────────
    _floorLights = [];
    _lightStates = [];
    for (var fl = 0; fl < FLOOR_COUNT; fl++) {
      var floorLightArr = [];
      var lightStateArr = [];
      var y = fl * FLOOR_HEIGHT + FLOOR_HEIGHT - 0.5;
      for (var li = 0; li < LIGHTS_PER_FLOOR; li++) {
        var xOff = (li - 1) * (BUILDING_W / (LIGHTS_PER_FLOOR + 1));
        var pt = new THREE.PointLight(0xffffff, 1.2, 18);
        pt.position.set(xOff, y, 0);
        _scene.add(pt);

        // small bulb mesh
        var bulbGeo = new THREE.SphereGeometry(0.18, 6, 6);
        var bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        var bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
        pt.add(bulbMesh);

        floorLightArr.push(pt);
        lightStateArr.push(true);
      }
      _floorLights.push(floorLightArr);
      _lightStates.push(lightStateArr);
    }
  }

  // ─────────────────────────────────────────────── guard construction

  function _makePatrolPoints(floor, idx) {
    var y = _floorY(floor);
    var baseX = ((idx % 3) - 1) * 6;
    var baseZ = (Math.floor(idx / 3) % 2 === 0) ? 4 : -4;
    return [
      new THREE.Vector3(baseX - 4, y, baseZ),
      new THREE.Vector3(baseX + 4, y, baseZ),
      new THREE.Vector3(baseX + 4, y, -baseZ),
      new THREE.Vector3(baseX - 4, y, -baseZ)
    ];
  }

  function _buildGuards() {
    _guards = [];
    for (var i = 0; i < GUARD_COUNT; i++) {
      var floor = (i % FLOOR_COUNT) + 1;
      var y = _floorY(floor);
      var startX = ((i % 5) - 2) * 4;

      // Guard body
      var guardGeo = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var guardMat = new THREE.MeshPhongMaterial({ color: GUARD_COLOR });
      var guardMesh = new THREE.Mesh(guardGeo, guardMat);
      guardMesh.position.set(startX, y, 0);
      _scene.add(guardMesh);

      // Vision cone using LineSegments
      var coneLines = _buildVisionCone();
      coneLines.visible = true;
      guardMesh.add(coneLines);

      // Optional guard dog (every 3rd guard)
      var dogMesh = null;
      var hasDog = (i % 3 === 0);
      if (hasDog) {
        var dogGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.5, 8);
        var dogMat = new THREE.MeshPhongMaterial({ color: DOG_COLOR });
        dogMesh = new THREE.Mesh(dogGeo, dogMat);
        dogMesh.position.set(startX + 1, y - 0.65, 0.5);
        _scene.add(dogMesh);
      }

      _guards.push({
        mesh:             guardMesh,
        coneLine:         coneLines,
        dogMesh:          dogMesh,
        hasDog:           hasDog,
        floor:            floor,
        alive:            true,
        stunned:          false,
        stunTimer:        0,
        carrying:         false,
        patrolPoints:     _makePatrolPoints(floor, i),
        patrolIdx:        0,
        patrolDir:        1,
        state:            'PATROL',      // PATROL | INVESTIGATE | ALERT
        investigateTarget: null,
        investigateTimer: 0,
        hiddenInLocker:   false
      });
    }
  }

  function _buildVisionCone() {
    var points = [];
    var halfRad = GUARD_CONE_HALF * Math.PI / 180;
    var range = GUARD_RANGE_LIT;
    var segments = 8;
    // origin lines fanning out
    for (var s = 0; s <= segments; s++) {
      var angle = -halfRad + (s / segments) * halfRad * 2;
      points.push(new THREE.Vector3(0, 0, 0));
      points.push(new THREE.Vector3(
        Math.sin(angle) * range,
        0,
        -Math.cos(angle) * range
      ));
    }
    // arc at tip
    for (var a = 0; a < segments; a++) {
      var a1 = -halfRad + (a / segments) * halfRad * 2;
      var a2 = -halfRad + ((a + 1) / segments) * halfRad * 2;
      points.push(new THREE.Vector3(Math.sin(a1) * range, 0, -Math.cos(a1) * range));
      points.push(new THREE.Vector3(Math.sin(a2) * range, 0, -Math.cos(a2) * range));
    }

    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.25 });
    return new THREE.LineSegments(geo, mat);
  }

  // ─────────────────────────────────────────────── light / shadow logic

  function _shootLight(lightIdx, floor) {
    var fi = floor - 1;
    if (fi < 0 || fi >= _floorLights.length) return;
    var li = lightIdx % LIGHTS_PER_FLOOR;
    _floorLights[fi][li].intensity = 0;
    _lightStates[fi][li] = false;
    _showBanner('LIGHT SHOT OUT — SHADOW ZONE', '#88ffcc', 2);
  }

  function _triggerBlackout(floor) {
    var fi = floor - 1;
    if (fi < 0 || fi >= _floorLights.length) return;
    _blackoutFloor = floor;
    _blackoutTimer = BLACKOUT_DURATION;
    for (var li = 0; li < _floorLights[fi].length; li++) {
      _floorLights[fi][li].intensity = 0;
      _lightStates[fi][li] = false;
    }
    _showBanner('FLOOR ' + floor + ' BLACKOUT — 60s', '#ffdd00', 3);

    // Guards on this floor switch to INVESTIGATE
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (g && g.alive && !g.stunned && g.floor === floor) {
        g.state = 'INVESTIGATE';
        g.investigateTimer = GUARD_INVESTIGATE_DUR;
        g.investigateTarget = g.mesh.position.clone();
      }
    }
  }

  function _updateBlackout(delta) {
    if (_blackoutFloor < 1) return;
    _blackoutTimer -= delta;
    if (_blackoutTimer <= 0) {
      // restore lights
      var fi = _blackoutFloor - 1;
      for (var li = 0; li < _floorLights[fi].length; li++) {
        _floorLights[fi][li].intensity = 1.2;
        _lightStates[fi][li] = true;
      }
      _blackoutFloor = -1;
      _blackoutTimer = 0;
      _showBanner('POWER RESTORED — FLOOR LIGHTS BACK', '#ffaaaa', 2);
    }
  }

  function _isPlayerInShadow() {
    if (!_camera) return false;
    var pos = _camera.position;
    var floor = _playerFloor;
    var fi = floor - 1;
    if (fi < 0 || fi >= _floorLights.length) return true;

    // If entire floor is blacked out: shadow
    var anyOn = false;
    for (var li = 0; li < _floorLights[fi].length; li++) {
      if (_lightStates[fi][li]) {
        anyOn = true;
        // Check distance to this light
        var light = _floorLights[fi][li];
        var d = _vec2Dist(pos, light.position);
        if (d < 7) return false; // within lit radius
      }
    }
    return !anyOn || true; // if no lights on, in shadow; otherwise depends on proximity
  }

  // ─────────────────────────────────────────────── noise system

  function _emitNoise(position, radius) {
    _noiseEvents.push({ pos: position.clone(), radius: radius, timer: 3.0 });

    // Guards within radius investigate
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g || !g.alive || g.stunned || g.hiddenInLocker) continue;
      var dist = _vecDist(g.mesh.position, position);
      if (dist <= radius) {
        g.state = 'INVESTIGATE';
        g.investigateTarget = position.clone();
        g.investigateTimer = GUARD_INVESTIGATE_DUR;
      }
    }
  }

  function _updateNoise(delta) {
    for (var i = _noiseEvents.length - 1; i >= 0; i--) {
      _noiseEvents[i].timer -= delta;
      if (_noiseEvents[i].timer <= 0) {
        _noiseEvents.splice(i, 1);
      }
    }
  }

  function _getNoiseRadius() {
    switch (_moveMode) {
      case MOVE_RUN:   return NOISE_RUN;
      case MOVE_CRAWL: return NOISE_CRAWL;
      default:         return NOISE_WALK;
    }
  }

  // ─────────────────────────────────────────────── guard AI

  function _updateGuards(delta) {
    if (!_camera) return;
    var playerPos = _camera.position;

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.alive || g.hiddenInLocker) continue;

      // If stunned, tick stun timer
      if (g.stunned) {
        g.stunTimer -= delta;
        if (g.stunTimer <= 0) {
          g.stunned = false;
          g.stunTimer = 0;
          g.state = 'PATROL';
          _showBanner('GUARD WOKE UP!', '#ff6666', 2);
        }
        continue;
      }

      // Dog smell check
      if (g.hasDog && g.dogMesh) {
        var dogDist = _vecDist(g.dogMesh.position, playerPos);
        if (dogDist <= DOG_SMELL_RANGE) {
          if (g.state !== 'ALERT') {
            g.state = 'ALERT';
            _triggerDetection();
          }
        }
        // sync dog to guard
        g.dogMesh.position.set(
          g.mesh.position.x + 1,
          g.mesh.position.y - 0.65,
          g.mesh.position.z + 0.5
        );
      }

      _updateGuardState(g, delta, playerPos);
    }
  }

  function _updateGuardState(g, delta, playerPos) {
    if (g.state === 'PATROL') {
      _doPatrol(g, delta);
      _doVisionCheck(g, playerPos);
    } else if (g.state === 'INVESTIGATE') {
      _doInvestigate(g, delta, playerPos);
    } else if (g.state === 'ALERT') {
      _doAlert(g, delta, playerPos);
    }
  }

  function _doPatrol(g, delta) {
    var target = g.patrolPoints[g.patrolIdx];
    if (!target) return;
    var dist = _vec2Dist(g.mesh.position, target);
    if (dist < 0.5) {
      // advance patrol
      g.patrolIdx += g.patrolDir;
      if (g.patrolIdx >= g.patrolPoints.length || g.patrolIdx < 0) {
        g.patrolDir *= -1;
        g.patrolIdx += g.patrolDir;
      }
    } else {
      var dir = new THREE.Vector3(
        target.x - g.mesh.position.x,
        0,
        target.z - g.mesh.position.z
      ).normalize();
      var step = GUARD_MOVE_SPEED * delta;
      g.mesh.position.x += dir.x * step;
      g.mesh.position.z += dir.z * step;
      g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  function _doInvestigate(g, delta, playerPos) {
    g.investigateTimer -= delta;
    if (g.investigateTimer <= 0) {
      // Give up
      g.state = 'PATROL';
      g.investigateTarget = null;
    } else if (g.investigateTarget) {
      var dist = _vec2Dist(g.mesh.position, g.investigateTarget);
      if (dist < 0.5) {
        // Reached investigate point — look around, then give up after timer
        _doVisionCheck(g, playerPos);
      } else {
        var dir = new THREE.Vector3(
          g.investigateTarget.x - g.mesh.position.x,
          0,
          g.investigateTarget.z - g.mesh.position.z
        ).normalize();
        var step = GUARD_MOVE_SPEED * 1.5 * delta;
        g.mesh.position.x += dir.x * step;
        g.mesh.position.z += dir.z * step;
        g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        _doVisionCheck(g, playerPos);
      }
    }
  }

  function _doAlert(g, delta, playerPos) {
    // Move toward player aggressively
    var dist = _vec2Dist(g.mesh.position, playerPos);
    if (dist > 0.8) {
      var dir = new THREE.Vector3(
        playerPos.x - g.mesh.position.x,
        0,
        playerPos.z - g.mesh.position.z
      ).normalize();
      var step = GUARD_MOVE_SPEED * 2.5 * delta;
      g.mesh.position.x += dir.x * step;
      g.mesh.position.z += dir.z * step;
      g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    // Check if player still visible; if not after some time, switch to investigate
    _doVisionCheck(g, playerPos);
  }

  function _doVisionCheck(g, playerPos) {
    // Determine vision range based on shadow
    var gInShadow = _isInShadowAtFloor(g.mesh.position, g.floor);
    var playerInShadow = _inShadow;

    var range = GUARD_RANGE_LIT;
    if (gInShadow || playerInShadow) {
      range = GUARD_RANGE_SHADOW;
    }

    var dist = _vecDist(g.mesh.position, playerPos);
    if (dist > range) return;

    // Check if player is in cone
    var fwd = new THREE.Vector3(0, 0, -1).applyEuler(g.mesh.rotation);
    var toPlayer = new THREE.Vector3(
      playerPos.x - g.mesh.position.x,
      0,
      playerPos.z - g.mesh.position.z
    ).normalize();
    var dot = fwd.dot(toPlayer);
    var angleDeg = Math.acos(_clamp(dot, -1, 1)) * 180 / Math.PI;

    if (angleDeg <= GUARD_CONE_HALF) {
      // Seen — trigger detection/alert
      if (g.state !== 'ALERT') {
        g.state = 'ALERT';
        _triggerDetection();
      }
    }
  }

  function _isInShadowAtFloor(pos, floor) {
    var fi = floor - 1;
    if (fi < 0 || fi >= _floorLights.length) return true;
    for (var li = 0; li < _floorLights[fi].length; li++) {
      if (_lightStates[fi][li]) {
        var light = _floorLights[fi][li];
        var d = _vec2Dist(pos, light.position);
        if (d < 7) return false;
      }
    }
    return true;
  }

  function _triggerDetection() {
    _detections++;
    _showBanner('!! GUARD ALARM — DETECTION ' + _detections + ' !!', '#ff2222', 3);
  }

  // ─────────────────────────────────────────────── tranq / knockout

  function _fireTransqDart() {
    if (!_camera) return;
    var playerPos = _camera.position;
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    var bestGuard = null;
    var bestDist = 999;

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.alive || g.stunned || g.hiddenInLocker) continue;
      var dist = _vecDist(g.mesh.position, playerPos);
      if (dist > GUARD_RANGE_LIT) continue;
      var toGuard = new THREE.Vector3(
        g.mesh.position.x - playerPos.x,
        0,
        g.mesh.position.z - playerPos.z
      ).normalize();
      var dot = fwd.dot(toGuard);
      if (dot < 0.5) continue; // not in front
      if (dist < bestDist) {
        bestDist = dist;
        bestGuard = g;
      }
    }

    if (bestGuard) {
      bestGuard.stunned = true;
      bestGuard.stunTimer = TRANQ_STUN_DURATION;
      bestGuard.state = 'PATROL';
      // visually show guard prone
      bestGuard.mesh.rotation.z = Math.PI / 2;
      _knockouts++;
      _showBanner('GUARD TRANQUILIZED — STUNNED 90s', '#88ffcc', 2);
    } else {
      // Shoot out nearest light on player's floor
      var fi = _playerFloor - 1;
      if (fi >= 0 && fi < _floorLights.length) {
        // find closest lit light in forward direction
        for (var li = 0; li < _floorLights[fi].length; li++) {
          if (_lightStates[fi][li]) {
            _shootLight(li, _playerFloor);
            break;
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────── body drag / locker

  function _tryPickupBody() {
    if (!_camera) return;
    if (_carriedGuard) {
      _depositBodyInLocker();
      return;
    }
    var playerPos = _camera.position;
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g || !g.alive || !g.stunned || g.hiddenInLocker) continue;
      var dist = _vecDist(g.mesh.position, playerPos);
      if (dist < 2.5) {
        _carriedGuard = g;
        _showBanner('CARRYING BODY — MOVE TO LOCKER (E)', '#aaffcc', 2);
        return;
      }
    }
    // Try power box for floor blackout
    _triggerBlackout(_playerFloor);
  }

  function _depositBodyInLocker() {
    if (!_carriedGuard || !_camera) return;
    var playerPos = _camera.position;
    var nearest = null;
    var nearestDist = 999;

    for (var lk = 0; lk < _lockerMeshes.length; lk++) {
      var locker = _lockerMeshes[lk];
      if (locker.occupant) continue;
      var dist = _vecDist(locker.mesh.position, playerPos);
      if (dist < 3 && dist < nearestDist) {
        nearestDist = dist;
        nearest = locker;
      }
    }

    if (nearest) {
      nearest.occupant = _carriedGuard;
      _carriedGuard.hiddenInLocker = true;
      _carriedGuard.mesh.visible = false;
      if (_carriedGuard.dogMesh) _carriedGuard.dogMesh.visible = false;
      _showBanner('BODY HIDDEN IN LOCKER', '#00ffcc', 2);
      _carriedGuard = null;
    } else {
      _showBanner('NO EMPTY LOCKER NEARBY', '#ffaaaa', 1.5);
    }
  }

  // ─────────────────────────────────────────────── carried body follow

  function _updateCarriedBody() {
    if (!_carriedGuard || !_camera) return;
    _carriedGuard.mesh.position.set(
      _camera.position.x + 1,
      _camera.position.y - 0.5,
      _camera.position.z - 1
    );
  }

  // ─────────────────────────────────────────────── coin distraction

  function _throwCoin() {
    if (!_camera) return;
    var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion);
    var throwPos = _camera.position.clone().addScaledVector(fwd, 10);

    var coinGeo = new THREE.BoxGeometry(0.15, 0.05, 0.15);
    var coinMat = new THREE.MeshPhongMaterial({ color: COIN_COLOR, emissive: 0x886600 });
    var coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinMesh.position.copy(throwPos);
    _scene.add(coinMesh);
    _coins.push({ mesh: coinMesh, life: 5 });

    _emitNoise(throwPos, NOISE_COIN);
    _showBanner('COIN THROWN — NOISE LURE ACTIVE', '#ffdd44', 1.5);
  }

  function _updateCoins(delta) {
    for (var i = _coins.length - 1; i >= 0; i--) {
      _coins[i].life -= delta;
      if (_coins[i].life <= 0) {
        _scene.remove(_coins[i].mesh);
        _coins.splice(i, 1);
      }
    }
  }

  // ─────────────────────────────────────────────── access panel buzz

  function _triggerAccessPanel() {
    if (!_camera) return;
    var buzzPos = _camera.position.clone();
    buzzPos.x += 2;
    _panelBuzzEvents.push({ timer: PANEL_BUZZ_DUR, pos: buzzPos.clone() });
    _emitNoise(buzzPos, NOISE_PANEL);
    _showBanner('ACCESS PANEL — ELECTRICAL BUZZ 10s', '#aaddff', 1.5);
  }

  function _updatePanelBuzz(delta) {
    for (var i = _panelBuzzEvents.length - 1; i >= 0; i--) {
      _panelBuzzEvents[i].timer -= delta;
      if (_panelBuzzEvents[i].timer <= 0) {
        _panelBuzzEvents.splice(i, 1);
      } else {
        // Re-emit noise every 2 seconds to keep guards investigating
        if (Math.floor(_panelBuzzEvents[i].timer * 0.5) !== Math.floor((_panelBuzzEvents[i].timer + delta) * 0.5)) {
          _emitNoise(_panelBuzzEvents[i].pos, NOISE_PANEL);
        }
      }
    }
  }

  // ─────────────────────────────────────────────── USB pickup & extraction

  function _tryInteractE() {
    if (!_camera) return;
    var playerPos = _camera.position;

    // Try USB drive pickup
    if (!_hasUSB && _usbMesh && _usbMesh.visible) {
      var usbDist = _vecDist(playerPos, _usbMesh.position);
      if (usbDist < 1.5) {
        _hasUSB = true;
        _usbMesh.visible = false;
        _showBanner('USB DRIVE ACQUIRED — REACH EXTRACTION', '#44aaff', 3);
        return;
      }
    }

    // Try extraction
    if (_hasUSB && _extractMesh) {
      var extDist = _vecDist(playerPos, _extractMesh.position);
      if (extDist < 2.5) {
        _completeMission();
        return;
      }
    }

    // Try pick up / deposit body
    _tryPickupBody();
  }

  function _completeMission() {
    _missionActive = false;
    var elapsed = (Date.now() - _missionStartTime) / 1000;
    var score = SCORE_GHOST_RATING;
    score += _knockouts * SCORE_PER_KNOCKOUT;
    score += _detections * SCORE_PER_ALARM;
    if (elapsed < TIME_BONUS_THRESHOLD) {
      var timeBonus = Math.floor((TIME_BONUS_THRESHOLD - elapsed) * 5);
      score += timeBonus;
    }

    var perfect = (_detections === 0 && _allGuardsAlive());
    var msg = perfect
      ? 'GHOST MISSION COMPLETE — PERFECT! SCORE: ' + score
      : 'MISSION COMPLETE — SCORE: ' + score + ' (' + _detections + ' alarms, ' + _knockouts + ' KOs)';

    _showBanner(msg, perfect ? '#00ffcc' : '#ffdd44', 6);
    window._ghostMissionScore = score;
    window._ghostMissionPerfect = perfect;
  }

  // ─────────────────────────────────────────────── player floor tracking

  function _updatePlayerFloor() {
    if (!_camera) return;
    var y = _camera.position.y;
    var floor = Math.round(y / FLOOR_HEIGHT) + 1;
    _playerFloor = _clamp(floor, 1, FLOOR_COUNT);
  }

  // ─────────────────────────────────────────────── USB pulse animation

  function _updateUSBPulse(delta) {
    if (!_usbMesh || !_usbMesh.visible) return;
    var t = Date.now() * 0.003;
    _usbMesh.position.y = _floorY(EXEC_LEVEL) + 0.55 + Math.sin(t) * 0.05;
    _usbMesh.rotation.y += delta * 1.5;
  }

  // ─────────────────────────────────────────────── extraction pulse

  function _updateExtractPulse(delta) {
    if (!_extractMesh) return;
    var t = Date.now() * 0.002;
    var s = 1 + Math.sin(t) * 0.08;
    _extractMesh.scale.set(s, 1, s);
  }

  // ─────────────────────────────────────────────── keybindings

  function _onKeyDown(e) {
    var key = e.key;
    _keysDown[key] = Date.now();

    // Track G and M for simultaneous activation
    if (key === 'g' || key === 'G') {
      _gPressTime = Date.now();
      _checkActivation();
    }
    if (key === 'm' || key === 'M') {
      _mPressTime = Date.now();
      _checkActivation();
    }

    if (!_active) return;

    // Q — tranq dart (also shoots lights if no guard in range)
    if (key === 'q' || key === 'Q') {
      e.preventDefault();
      _fireTransqDart();
    }

    // E — interact (pickup USB, extraction, body carry/deposit, power box)
    if (key === 'e' || key === 'E') {
      e.preventDefault();
      _tryInteractE();
    }

    // C — throw coin
    if (key === 'c' || key === 'C') {
      e.preventDefault();
      _throwCoin();
    }

    // R — run mode
    if (key === 'r' || key === 'R') {
      _moveMode = (_moveMode === MOVE_RUN) ? MOVE_WALK : MOVE_RUN;
      _showBanner('MODE: ' + _moveMode, '#aaaaaa', 1);
    }

    // Z — crawl mode
    if (key === 'z' || key === 'Z') {
      _moveMode = (_moveMode === MOVE_CRAWL) ? MOVE_WALK : MOVE_CRAWL;
      _showBanner('MODE: ' + _moveMode, '#aaaaaa', 1);
    }

    // P — access panel buzz
    if (key === 'p' || key === 'P') {
      e.preventDefault();
      _triggerAccessPanel();
    }
  }

  function _onKeyUp(e) {
    delete _keysDown[e.key];
  }

  function _checkActivation() {
    if (_active) return;
    var now = Date.now();
    var gAge = now - _gPressTime;
    var mAge = now - _mPressTime;
    if (_gPressTime > 0 && _mPressTime > 0 && gAge < ACTIVATION_WINDOW && mAge < ACTIVATION_WINDOW) {
      _activateModule();
    }
  }

  function _activateModule() {
    _active = true;
    _missionActive = true;
    _missionStartTime = Date.now();
    _knockouts = 0;
    _detections = 0;
    _hasUSB = false;
    _carriedGuard = null;
    _moveMode = MOVE_WALK;

    if (_hudRoot) _hudRoot.style.display = 'block';
    _showBanner('GHOST MISSION ACTIVATED — G+M', '#00ffcc', 3);

    if (!_buildingMesh && _scene && _camera) {
      _buildScene();
      _buildGuards();
    }
  }

  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup', _onKeyUp, false);
    _keysBound = true;
  }

  // ─────────────────────────────────────────────── footstep noise emission

  var _noiseEmitTimer = 0;

  function _updateFootstepNoise(delta) {
    if (!_missionActive || !_camera) return;
    _noiseEmitTimer -= delta;
    if (_noiseEmitTimer > 0) return;

    switch (_moveMode) {
      case MOVE_RUN:   _noiseEmitTimer = 0.25; break;
      case MOVE_WALK:  _noiseEmitTimer = 0.5;  break;
      case MOVE_CRAWL: _noiseEmitTimer = 1.5;  break;
      default:         _noiseEmitTimer = 0.5;  break;
    }

    _emitNoise(_camera.position, _getNoiseRadius());
  }

  // ─────────────────────────────────────────────── public API

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _active        = false;
    _missionActive = false;
    _gPressTime    = 0;
    _mPressTime    = 0;
    _keysDown      = {};
    _knockouts     = 0;
    _detections    = 0;
    _hasUSB        = false;
    _carriedGuard  = null;
    _moveMode      = MOVE_WALK;
    _blackoutFloor = -1;
    _blackoutTimer = 0;
    _noiseEvents   = [];
    _coins         = [];
    _panelBuzzEvents = [];
    _guards        = [];
    _noiseEmitTimer = 0;

    _buildHUD();
    _bindKeys();

    window._ghostMissionScore   = 0;
    window._ghostMissionPerfect = false;
    window._ghostMissionActive  = false;
  }

  function update(delta) {
    if (!_scene || !_camera) return;

    window._ghostMissionActive = _active;

    if (!_active) return;

    _updatePlayerFloor();
    _inShadow = _isPlayerInShadow();

    _updateBlackout(delta);
    _updateNoise(delta);
    _updateFootstepNoise(delta);
    _updateGuards(delta);
    _updateCarriedBody();
    _updateCoins(delta);
    _updatePanelBuzz(delta);
    _updateUSBPulse(delta);
    _updateExtractPulse(delta);
    _updateHUD();
  }

  function reset() {
    _active         = false;
    _missionActive  = false;
    _gPressTime     = 0;
    _mPressTime     = 0;
    _keysDown       = {};
    _knockouts      = 0;
    _detections     = 0;
    _hasUSB         = false;
    _carriedGuard   = null;
    _moveMode       = MOVE_WALK;
    _blackoutFloor  = -1;
    _blackoutTimer  = 0;
    _noiseEvents    = [];
    _panelBuzzEvents = [];
    _noiseEmitTimer = 0;
    _inShadow       = false;

    // Remove coins
    for (var ci = 0; ci < _coins.length; ci++) {
      if (_scene) _scene.remove(_coins[ci].mesh);
    }
    _coins = [];

    // Remove guards
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (g) {
        if (_scene && g.mesh) _scene.remove(g.mesh);
        if (_scene && g.dogMesh) _scene.remove(g.dogMesh);
      }
    }
    _guards = [];

    // Remove building objects
    if (_scene) {
      if (_buildingMesh) _scene.remove(_buildingMesh);
      if (_serverRoomMesh) _scene.remove(_serverRoomMesh);
      if (_execSuiteMesh) _scene.remove(_execSuiteMesh);
      if (_elevatorMesh)  _scene.remove(_elevatorMesh);
      if (_extractMesh)   _scene.remove(_extractMesh);
      if (_usbMesh)       _scene.remove(_usbMesh);
    }
    for (var fi = 0; fi < _floorLights.length; fi++) {
      for (var li = 0; li < _floorLights[fi].length; li++) {
        if (_scene) _scene.remove(_floorLights[fi][li]);
      }
    }
    _floorLights  = [];
    _lightStates  = [];
    _floorMeshes  = [];
    _stairMeshes  = [];
    _lockerMeshes = [];

    _buildingMesh   = null;
    _serverRoomMesh = null;
    _execSuiteMesh  = null;
    _elevatorMesh   = null;
    _extractMesh    = null;
    _usbMesh        = null;

    if (_hudRoot) _hudRoot.style.display = 'none';

    window._ghostMissionScore   = 0;
    window._ghostMissionPerfect = false;
    window._ghostMissionActive  = false;
  }

  function getScore() {
    return window._ghostMissionScore || 0;
  }

  function isActive() {
    return _active;
  }

  return {
    init:     init,
    update:   update,
    reset:    reset,
    getScore: getScore,
    isActive: isActive
  };

})();
