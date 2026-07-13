// spy-satellite.js — Spy Satellite infiltration module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, Three.js as global THREE
//
// Activation: S+S double-tap (two S keypresses within 400ms)
//
// Public API:
//   SpySatellite.init(scene, camera)
//   SpySatellite.update(delta)
//   SpySatellite.reset()

window.SpySatellite = (function () {
  'use strict';

  // ─────────────────────────────────────────────── constants

  var ACTIVATION_WINDOW       = 400;      // ms between S presses

  // Facility colors
  var COL_CONTROL_BLDG        = 0x445544;
  var COL_SERVER_ROOM         = 0x334455;
  var COL_CHECKPOINT          = 0x334444;
  var COL_BARRACKS            = 0x445544;
  var COL_DISH                = 0x556655;
  var COL_RADAR               = 0x334455;
  var COL_GROUND              = 0xBB9933;

  // Enemy colors
  var COL_GUARD               = 0x445544;
  var COL_TECH                = 0x667755;
  var COL_COMMANDER           = 0x334433;
  var COL_HELI                = 0x445544;

  // Gadget colors
  var COL_EMP                 = 0x4488FF;
  var COL_LASER               = 0xFFFF00;
  var COL_DISGUISE            = 0xFFFFCC;

  // HP values
  var HP_GUARD                = 80;
  var HP_COMMANDER            = 200;

  // Counts
  var GUARD_COUNT             = 18;
  var TECH_COUNT              = 3;
  var TOWER_COUNT             = 3;

  // Timing
  var TOWER_PLANT_TIME        = 5.0;     // seconds hold E at base
  var VIRUS_UPLOAD_TIME       = 8.0;     // seconds hold E at terminal
  var VIRUS_COUNTDOWN         = 60.0;    // seconds countdown after upload
  var DISGUISE_DURATION       = 90.0;   // seconds disguise active
  var EMP_DURATION            = 15.0;   // seconds bots disabled
  var EMP_RADIUS              = 8.0;    // units
  var HELI_CYCLE              = 90.0;   // seconds per heli orbit
  var SEARCHLIGHT_RANGE       = 25.0;   // units
  var GUARD_SPEED             = 3.5;
  var GUARD_SIGHT             = 20.0;
  var RADAR_ROT_SPEED         = 0.8;    // rad/s

  // IDs
  var HUD_ID                  = 'spy-satellite-hud';
  var BANNER_ID               = 'spy-satellite-banner';

  // ─────────────────────────────────────────────── state

  var _scene          = null;
  var _camera         = null;
  var _active         = false;
  var _keysBound      = false;

  // activation
  var _lastSPress     = 0;
  var _sPressCount    = 0;

  // mission state
  var _radarDisabled  = false;
  var _hasAccessCard  = false;
  var _hasDisguise    = false;
  var _disguiseTimer  = 0;
  var _hasFence       = true;
  var _virusState     = 'NONE';          // NONE | UPLOADING | COMPLETE
  var _virusProgress  = 0;              // 0-1
  var _virusHoldTimer = 0;
  var _uploadLocked   = false;          // player can't move during upload
  var _virusCountdown = 0;
  var _missionWon     = false;
  var _missionLost    = false;
  var _heliSpotCount  = 0;              // max 3 before lose

  // tower state
  var _towers         = [];
  // each: { mesh, poleMesh, dishMesh, hasExplosive, destroyed, plantTimer, holdingE, pos }

  // guards
  var _guards         = [];
  // each: { mesh, hp, alive, state, patrol, patrolIdx, patrolDir, alertTarget, type, empStunned, empTimer, fleeTimer }

  // commander
  var _commander      = null;
  // { mesh, hp, alive, pos, patrolPoints, patrolIdx, patrolDir }

  // technicians
  var _technicians    = [];
  // each: { mesh, alive, fleeing, fleeTarget, alertCooldown }

  // helicopter
  var _heliMesh       = null;
  var _heliRotorMesh  = null;
  var _heliOrbitAngle = 0;
  var _heliOrbitRadius= 55;
  var _heliHeight     = 18;
  var _searchLight    = null;
  var _heliSpotTimer  = 0;
  var _heliSpotted    = false;

  // scene meshes
  var _controlBldg    = null;
  var _serverRoom     = null;
  var _serverTerminal = null;
  var _checkpoint     = null;
  var _barracks       = null;
  var _radarMesh      = null;
  var _radarPivot     = null;
  var _groundMesh     = null;
  var _fenceMesh      = null;
  var _disguiseMesh   = null;  // in barracks
  var _cardScannerMesh= null;  // door scanner
  var _doorMesh       = null;

  // gadget inventory
  var _empAvail       = true;
  var _grappleActive  = false;
  var _grappleTimer   = 0;
  var _grappleTower   = null;
  var _laserUsed      = false;

  // interaction hold tracking
  var _eHeld          = false;
  var _eHoldTarget    = null;   // 'tower0','tower1','tower2','upload','card'
  var _eHoldTimer     = 0;

  // detonation ready
  var _explosivesPlanted = 0;
  var _towersDestroyed   = 0;

  // HUD elements
  var _hudEl          = null;
  var _bannerEl       = null;
  var _bannerTimer    = null;

  // scrambled guards (extra from heli spot)
  var _scrambledGuards = [];

  // ─────────────────────────────────────────────── helpers

  function _clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function _dist2(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _playerPos() {
    return _camera ? _camera.position : new THREE.Vector3();
  }

  function _playerForward() {
    var fwd = new THREE.Vector3(0, 0, -1);
    if (_camera) fwd.applyQuaternion(_camera.quaternion);
    return fwd;
  }

  // ─────────────────────────────────────────────── HUD

  function _buildHUD() {
    if (document.getElementById(HUD_ID)) {
      _hudEl    = document.getElementById(HUD_ID);
      _bannerEl = document.getElementById(BANNER_ID);
      return;
    }

    _hudEl = document.createElement('div');
    _hudEl.id = HUD_ID;
    _hudEl.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'width:100%',
      'pointer-events:none',
      'z-index:700',
      'font-family:monospace',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    var bar = document.createElement('div');
    bar.id = HUD_ID + '-bar';
    bar.style.cssText = [
      'position:absolute',
      'bottom:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#aaffaa',
      'font-size:11px',
      'background:rgba(0,0,0,0.8)',
      'border:1px solid rgba(100,200,100,0.4)',
      'border-radius:4px',
      'padding:5px 14px',
      'letter-spacing:1px',
      'white-space:nowrap',
      'user-select:none'
    ].join(';');
    bar.textContent = 'SPY SATELLITE';
    _hudEl.appendChild(bar);

    _bannerEl = document.createElement('div');
    _bannerEl.id = BANNER_ID;
    _bannerEl.style.cssText = [
      'position:absolute',
      'bottom:52px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffffff',
      'font-size:14px',
      'font-weight:bold',
      'letter-spacing:2px',
      'background:rgba(0,0,0,0.8)',
      'border-radius:4px',
      'padding:5px 18px',
      'display:none',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    _hudEl.appendChild(_bannerEl);
  }

  function _showBanner(text, color, secs) {
    if (!_bannerEl) return;
    if (_bannerTimer) clearTimeout(_bannerTimer);
    _bannerEl.textContent = text;
    _bannerEl.style.color = color || '#ffffff';
    _bannerEl.style.display = 'block';
    _bannerTimer = setTimeout(function () {
      if (_bannerEl) _bannerEl.style.display = 'none';
    }, (secs || 2) * 1000);
  }

  function _updateHUD() {
    var bar = document.getElementById(HUD_ID + '-bar');
    if (!bar) return;

    var radarStr   = _radarDisabled ? 'OFF' : 'ON';
    var towersStr  = _towersDestroyed + '/3 DESTROYED';
    var cardStr    = _hasAccessCard ? 'YES' : 'NO';
    var virusStr;
    if (_virusState === 'NONE') {
      virusStr = 'NOT UPLOADED';
    } else if (_virusState === 'UPLOADING') {
      virusStr = 'UPLOADING ' + Math.floor(_virusProgress * 100) + '%';
    } else {
      virusStr = 'COMPLETE';
    }

    var guardsAlive = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].alive) guardsAlive++;
    }
    if (_commander && _commander.alive) guardsAlive++;

    var heliStr = Math.ceil(_heliSpotTimer > 0 ? _heliSpotTimer : _heliOrbitAngle > 0
      ? (HELI_CYCLE - (_heliOrbitAngle / (Math.PI * 2)) * HELI_CYCLE) : HELI_CYCLE) + 's';

    var disguiseStr = _hasDisguise && _disguiseTimer > 0
      ? ' [DISGUISE: ' + Math.ceil(_disguiseTimer) + 's]' : '';

    bar.textContent =
      'SPY SATELLITE' +
      ' [RADAR: ' + radarStr + ']' +
      ' [TOWERS: ' + towersStr + ']' +
      ' [ACCESS CARD: ' + cardStr + ']' +
      ' [VIRUS: ' + virusStr + ']' +
      disguiseStr +
      ' | GUARDS: ' + guardsAlive +
      ' HELI: ' + heliStr;

    if (_virusState === 'COMPLETE') {
      bar.style.color = '#ffff44';
    } else if (_radarDisabled) {
      bar.style.color = '#aaffaa';
    } else {
      bar.style.color = '#aaffaa';
    }
  }

  // ─────────────────────────────────────────────── scene construction

  function _buildScene() {
    if (!_scene) return;

    // Background & fog
    _scene.background = new THREE.Color(0xCC9944);
    _scene.fog = new THREE.FogExp2(0xBB8833, 0.01);

    // Ambient light
    var ambient = new THREE.AmbientLight(0xffeedd, 0.6);
    _scene.add(ambient);

    // Sun
    var sun = new THREE.DirectionalLight(0xfff0cc, 1.0);
    sun.position.set(50, 80, 30);
    _scene.add(sun);

    // Ground
    var groundGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshPhongMaterial({ color: COL_GROUND });
    _groundMesh = new THREE.Mesh(groundGeo, groundMat);
    _groundMesh.position.set(0, -0.25, 0);
    _scene.add(_groundMesh);

    // Perimeter fence — LineSegments rectangle
    var fencePoints = [];
    var FX = 60, FZ = 50;
    var corners = [
      new THREE.Vector3(-FX, 0,  FZ),
      new THREE.Vector3( FX, 0,  FZ),
      new THREE.Vector3( FX, 0, -FZ),
      new THREE.Vector3(-FX, 0, -FZ),
      new THREE.Vector3(-FX, 0,  FZ)
    ];
    for (var ci = 0; ci < corners.length - 1; ci++) {
      // post segments bottom to top
      var p0 = corners[ci].clone(); p0.y = 0;
      var p1 = corners[ci].clone(); p1.y = 3;
      fencePoints.push(p0); fencePoints.push(p1);
      // top rail
      var t0 = corners[ci].clone(); t0.y = 3;
      var t1 = corners[ci + 1].clone(); t1.y = 3;
      fencePoints.push(t0); fencePoints.push(t1);
      // bottom rail
      var b0 = corners[ci].clone(); b0.y = 0;
      var b1 = corners[ci + 1].clone(); b1.y = 0;
      fencePoints.push(b0); fencePoints.push(b1);
    }
    var fenceGeo = new THREE.BufferGeometry().setFromPoints(fencePoints);
    var fenceMat = new THREE.LineBasicMaterial({ color: 0x888855 });
    _fenceMesh = new THREE.LineSegments(fenceGeo, fenceMat);
    _scene.add(_fenceMesh);

    // ── Control building: 30x6x20 ───────────────────────────────────
    var ctrlGeo = new THREE.BoxGeometry(30, 6, 20);
    var ctrlMat = new THREE.MeshPhongMaterial({ color: COL_CONTROL_BLDG });
    _controlBldg = new THREE.Mesh(ctrlGeo, ctrlMat);
    _controlBldg.position.set(0, 3, -10);
    _scene.add(_controlBldg);

    // Door scanner (BoxGeometry at entrance)
    var scannerGeo = new THREE.BoxGeometry(1.5, 3, 0.5);
    var scannerMat = new THREE.MeshPhongMaterial({ color: 0x2266aa, emissive: 0x001133 });
    _cardScannerMesh = new THREE.Mesh(scannerGeo, scannerMat);
    _cardScannerMesh.position.set(0, 1.5, -0.5);
    _scene.add(_cardScannerMesh);

    // Door
    var doorGeo = new THREE.BoxGeometry(3, 4, 0.3);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x223322 });
    _doorMesh = new THREE.Mesh(doorGeo, doorMat);
    _doorMesh.position.set(0, 2, 0);
    _scene.add(_doorMesh);

    // ── Server room: 15x4x12 ────────────────────────────────────────
    var srvGeo = new THREE.BoxGeometry(15, 4, 12);
    var srvMat = new THREE.MeshPhongMaterial({ color: COL_SERVER_ROOM });
    _serverRoom = new THREE.Mesh(srvGeo, srvMat);
    _serverRoom.position.set(0, 2, -10);
    _scene.add(_serverRoom);

    // Server terminal
    var termGeo = new THREE.BoxGeometry(2, 1.5, 0.8);
    var termMat = new THREE.MeshPhongMaterial({ color: 0x1133aa, emissive: 0x000833 });
    _serverTerminal = new THREE.Mesh(termGeo, termMat);
    _serverTerminal.position.set(0, 2.75, -15);
    _scene.add(_serverTerminal);

    // Terminal screen glow
    var screenLight = new THREE.PointLight(0x3355ff, 0.6, 6);
    screenLight.position.copy(_serverTerminal.position);
    screenLight.position.y += 1;
    _scene.add(screenLight);

    // ── Security checkpoint: 8x4x6 ──────────────────────────────────
    var chkGeo = new THREE.BoxGeometry(8, 4, 6);
    var chkMat = new THREE.MeshPhongMaterial({ color: COL_CHECKPOINT });
    _checkpoint = new THREE.Mesh(chkGeo, chkMat);
    _checkpoint.position.set(-25, 2, 15);
    _scene.add(_checkpoint);

    // ── Guard barracks: 20x4x10 ─────────────────────────────────────
    var barrGeo = new THREE.BoxGeometry(20, 4, 10);
    var barrMat = new THREE.MeshPhongMaterial({ color: COL_BARRACKS });
    _barracks = new THREE.Mesh(barrGeo, barrMat);
    _barracks.position.set(25, 2, 20);
    _scene.add(_barracks);

    // Disguise kit in barracks
    var disgGeo = new THREE.BoxGeometry(1, 0.5, 0.5);
    var disgMat = new THREE.MeshPhongMaterial({ color: COL_DISGUISE, emissive: 0x888866 });
    _disguiseMesh = new THREE.Mesh(disgGeo, disgMat);
    _disguiseMesh.position.set(25, 4.25, 20);
    _scene.add(_disguiseMesh);

    // ── 3 Satellite dish towers ──────────────────────────────────────
    _towers = [];
    var towerPositions = [
      new THREE.Vector3(-40, 0, -20),
      new THREE.Vector3(0,   0, -35),
      new THREE.Vector3(40,  0, -20)
    ];
    for (var ti = 0; ti < TOWER_COUNT; ti++) {
      var tp = towerPositions[ti];

      // Pole: CylinderGeometry h=15
      var poleGeo = new THREE.CylinderGeometry(0.4, 0.6, 15, 8);
      var poleMat = new THREE.MeshPhongMaterial({ color: 0x778877 });
      var poleMesh = new THREE.Mesh(poleGeo, poleMat);
      poleMesh.position.set(tp.x, 7.5, tp.z);
      _scene.add(poleMesh);

      // Dish: BoxGeometry
      var dishGeo = new THREE.BoxGeometry(5, 0.4, 5);
      var dishMat = new THREE.MeshPhongMaterial({ color: COL_DISH });
      var dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.position.set(tp.x, 16, tp.z);
      dishMesh.rotation.x = 0.4;
      _scene.add(dishMesh);

      // Tower base platform
      var baseGeo = new THREE.BoxGeometry(3, 0.5, 3);
      var baseMat = new THREE.MeshPhongMaterial({ color: 0x445544 });
      var baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(tp.x, 0.25, tp.z);
      _scene.add(baseMesh);

      // Uplink signal light
      var signalGeo = new THREE.SphereGeometry(0.3, 6, 6);
      var signalMat = new THREE.MeshPhongMaterial({ color: 0x00ff44, emissive: 0x00aa22 });
      var signalMesh = new THREE.Mesh(signalGeo, signalMat);
      signalMesh.position.set(tp.x, 16.5, tp.z);
      _scene.add(signalMesh);

      _towers.push({
        poleMesh:      poleMesh,
        dishMesh:      dishMesh,
        signalMesh:    signalMesh,
        baseMesh:      baseMesh,
        pos:           tp.clone(),
        hasExplosive:  false,
        destroyed:     false,
        plantTimer:    0,
        holdingE:      false
      });
    }

    // ── Radar array: CylinderGeometry rotating ───────────────────────
    _radarPivot = new THREE.Object3D();
    _radarPivot.position.set(20, 0, 10);
    _scene.add(_radarPivot);

    var radarBaseGeo = new THREE.CylinderGeometry(1.5, 2, 2, 12);
    var radarBaseMat = new THREE.MeshPhongMaterial({ color: COL_RADAR });
    var radarBase = new THREE.Mesh(radarBaseGeo, radarBaseMat);
    radarBase.position.y = 1;
    _radarPivot.add(radarBase);

    var radarArmGeo = new THREE.BoxGeometry(8, 0.3, 0.5);
    var radarArmMat = new THREE.MeshPhongMaterial({ color: 0x557755 });
    _radarMesh = new THREE.Mesh(radarArmGeo, radarArmMat);
    _radarMesh.position.set(0, 2.5, 0);
    _radarPivot.add(_radarMesh);

    var radarLight = new THREE.PointLight(0x00ff44, 0.4, 10);
    radarLight.position.set(0, 3, 0);
    _radarPivot.add(radarLight);

    // ── Helicopter ───────────────────────────────────────────────────
    var heliBodyGeo = new THREE.BoxGeometry(6, 2, 3);
    var heliMat = new THREE.MeshPhongMaterial({ color: COL_HELI });
    _heliMesh = new THREE.Mesh(heliBodyGeo, heliMat);
    _scene.add(_heliMesh);

    // Rotor: CylinderGeometry (thin disc)
    var rotorGeo = new THREE.CylinderGeometry(4, 4, 0.15, 8);
    var rotorMat = new THREE.MeshPhongMaterial({ color: 0x334444, transparent: true, opacity: 0.6 });
    _heliRotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
    _heliRotorMesh.position.y = 1.2;
    _heliMesh.add(_heliRotorMesh);

    // Searchlight
    _searchLight = new THREE.PointLight(0xFFFFAA, 0, SEARCHLIGHT_RANGE);
    _searchLight.position.set(0, -2, 0);
    _heliMesh.add(_searchLight);

    // Init heli position
    _heliOrbitAngle = 0;
    _updateHeliPosition();

    // ── Guards ───────────────────────────────────────────────────────
    _buildGuards();

    // ── Commander ────────────────────────────────────────────────────
    _buildCommander();

    // ── Technicians ──────────────────────────────────────────────────
    _buildTechnicians();
  }

  function _buildGuards() {
    _guards = [];
    var patrolConfigs = [
      // around perimeter and buildings
      { x: -30, z: 10  }, { x: -20, z: 25  }, { x: 0,   z: 30  },
      { x: 20,  z: 25  }, { x: 30,  z: 10  }, { x: 30,  z: -10 },
      { x: 20,  z: -25 }, { x: 0,   z: -40 }, { x: -20, z: -25 },
      { x: -30, z: -10 }, { x: -10, z: 0   }, { x: 10,  z: 0   },
      { x: -5,  z: 15  }, { x: 5,   z: -15 }, { x: -40, z: 0   },
      { x: 40,  z: 0   }, { x: 0,   z: 20  }, { x: 0,   z: -20 }
    ];

    for (var i = 0; i < GUARD_COUNT; i++) {
      var cfg = patrolConfigs[i % patrolConfigs.length];
      var gGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var gMat = new THREE.MeshPhongMaterial({ color: COL_GUARD });
      var gMesh = new THREE.Mesh(gGeo, gMat);
      gMesh.position.set(cfg.x, 0.9, cfg.z);
      _scene.add(gMesh);

      var px = cfg.x;
      var pz = cfg.z;
      _guards.push({
        mesh:        gMesh,
        hp:          HP_GUARD,
        alive:       true,
        type:        'GUARD',
        state:       'PATROL',
        patrol:      [
          new THREE.Vector3(px - 5, 0.9, pz),
          new THREE.Vector3(px + 5, 0.9, pz),
          new THREE.Vector3(px + 5, 0.9, pz + 5),
          new THREE.Vector3(px - 5, 0.9, pz + 5)
        ],
        patrolIdx:   0,
        patrolDir:   1,
        alertTarget: null,
        empStunned:  false,
        empTimer:    0
      });
    }
  }

  function _buildCommander() {
    var cGeo = new THREE.BoxGeometry(0.9, 2.0, 0.6);
    var cMat = new THREE.MeshPhongMaterial({ color: COL_COMMANDER });
    var cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.set(-25, 1.0, 15);
    _scene.add(cMesh);

    // Rank indicator (cone on top)
    var rankGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
    var rankMat = new THREE.MeshPhongMaterial({ color: 0x886622 });
    var rankMesh = new THREE.Mesh(rankGeo, rankMat);
    rankMesh.position.y = 1.3;
    cMesh.add(rankMesh);

    _commander = {
      mesh:        cMesh,
      hp:          HP_COMMANDER,
      alive:       true,
      type:        'COMMANDER',
      state:       'PATROL',
      patrol:      [
        new THREE.Vector3(-25, 1.0, 12),
        new THREE.Vector3(-20, 1.0, 12),
        new THREE.Vector3(-20, 1.0, 18),
        new THREE.Vector3(-25, 1.0, 18)
      ],
      patrolIdx:   0,
      patrolDir:   1,
      alertTarget: null,
      empStunned:  false,
      empTimer:    0
    };
  }

  function _buildTechnicians() {
    _technicians = [];
    var techPositions = [
      new THREE.Vector3(5,  0.9, -12),
      new THREE.Vector3(-5, 0.9, -8),
      new THREE.Vector3(2,  0.9, -14)
    ];
    for (var i = 0; i < TECH_COUNT; i++) {
      var tGeo = new THREE.BoxGeometry(0.7, 1.7, 0.4);
      var tMat = new THREE.MeshPhongMaterial({ color: COL_TECH });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.copy(techPositions[i]);
      _scene.add(tMesh);

      _technicians.push({
        mesh:         tMesh,
        alive:        true,
        fleeing:      false,
        fleeTarget:   new THREE.Vector3(30, 0.9, 30),
        alertCooldown: 0,
        witnessedAttack: false
      });
    }
  }

  // ─────────────────────────────────────────────── heli position

  function _updateHeliPosition() {
    if (!_heliMesh) return;
    var x = Math.cos(_heliOrbitAngle) * _heliOrbitRadius;
    var z = Math.sin(_heliOrbitAngle) * _heliOrbitRadius;
    _heliMesh.position.set(x, _heliHeight, z);
    // face direction of travel
    _heliMesh.rotation.y = -_heliOrbitAngle + Math.PI * 0.5;
  }

  // ─────────────────────────────────────────────── combat / shooting

  function _shootAt(pos) {
    // Try commander first
    if (_commander && _commander.alive) {
      var d = _dist3(_commander.mesh.position, pos);
      if (d < 30) {
        _commander.hp -= 20;
        if (_commander.hp <= 0) {
          _killEnemy(_commander);
          if (!_hasAccessCard) {
            _hasAccessCard = true;
            _showBanner('ACCESS CARD OBTAINED FROM COMMANDER!', '#44ffcc', 3);
          }
        }
        return;
      }
    }
    // Try guards
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var gd = _dist3(g.mesh.position, pos);
      if (gd < 30) {
        g.hp -= 20;
        if (g.hp <= 0) {
          _killEnemy(g);
        } else {
          g.state = 'ALERT';
          g.alertTarget = _playerPos().clone();
        }
        // alert nearby technicians
        _alertTechniciansNearby(g.mesh.position, 15);
        return;
      }
    }
    // Try radar
    if (!_radarDisabled && _radarPivot) {
      var rd = _dist3(_radarPivot.position, pos);
      if (rd < 20) {
        _radarDisabled = true;
        _showBanner('RADAR ARRAY DISABLED!', '#ffff44', 3);
        return;
      }
    }
  }

  function _killEnemy(e) {
    e.alive = false;
    e.mesh.rotation.z = Math.PI / 2;
    e.mesh.position.y = 0.25;
  }

  function _alertTechniciansNearby(pos, radius) {
    for (var i = 0; i < _technicians.length; i++) {
      var t = _technicians[i];
      if (!t.alive) continue;
      var d = _dist3(t.mesh.position, pos);
      if (d < radius) {
        t.witnessedAttack = true;
        t.fleeing = true;
        // If tech escapes (later check) = alert cooldown calls for help
        t.alertCooldown = 20;
      }
    }
  }

  // ─────────────────────────────────────────────── gadgets

  function _useEMP() {
    if (!_empAvail) {
      _showBanner('EMP ALREADY USED', '#ff8888', 1.5);
      return;
    }
    _empAvail = false;
    var pp = _playerPos();
    _showBanner('EMP DETONATED — SECURITY-BOTS DISABLED 15s', '#4488FF', 3);

    // Stun guards within EMP_RADIUS (only 'GUARD' type, simulating bots)
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;
      var d = _dist3(g.mesh.position, pp);
      if (d <= EMP_RADIUS) {
        g.empStunned = true;
        g.empTimer = EMP_DURATION;
        g.state = 'STUNNED';
      }
    }
  }

  function _useGrapple() {
    // Find nearest tower within 15 units
    var pp = _playerPos();
    var nearest = null;
    var nearestDist = 15;
    for (var i = 0; i < _towers.length; i++) {
      var t = _towers[i];
      if (t.destroyed) continue;
      var d = _dist2(pp, t.pos);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = t;
      }
    }
    if (!nearest) {
      _showBanner('NO TOWER IN GRAPPLE RANGE (15u)', '#ff8888', 2);
      return;
    }
    _grappleActive = true;
    _grappleTimer  = 2.5;
    _grappleTower  = nearest;
    _showBanner('GRAPPLE HOOK — ASCENDING TOWER...', '#aaffcc', 2.5);
  }

  function _useLaserCutter() {
    if (_laserUsed) {
      _showBanner('LASER CUTTER ALREADY USED', '#ff8888', 1.5);
      return;
    }
    _laserUsed = true;
    _hasFence  = false;
    // Remove fence mesh
    if (_fenceMesh && _scene) {
      _scene.remove(_fenceMesh);
      _fenceMesh = null;
    }
    _showBanner('FENCE CUT — SHORTCUT CREATED!', '#FFFF00', 3);
  }

  function _tryPickupDisguise() {
    if (!_disguiseMesh || !_disguiseMesh.visible) return false;
    var pp = _playerPos();
    var d = _dist3(pp, _disguiseMesh.position);
    if (d < 4) {
      _hasDisguise = true;
      _disguiseTimer = DISGUISE_DURATION;
      _disguiseMesh.visible = false;
      _showBanner('DISGUISE KIT — TECHNICIAN OUTFIT (90s)', '#FFFFCC', 3);
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────── interaction (E key)

  function _onEPress() {
    if (!_active) return;
    var pp = _playerPos();

    // Disguise pickup check
    if (_tryPickupDisguise()) return;

    // Check door scanner (enter control building with card)
    if (_cardScannerMesh) {
      var scanDist = _dist3(pp, _cardScannerMesh.position);
      if (scanDist < 4) {
        if (!_hasAccessCard) {
          _showBanner('ACCESS CARD REQUIRED — FIND COMMANDER', '#ff8888', 2);
          return;
        }
        _showBanner('ACCESS GRANTED — ENTERING CONTROL BUILDING', '#44ffcc', 2);
        return;
      }
    }

    // Towers: start planting explosive
    for (var i = 0; i < _towers.length; i++) {
      var t = _towers[i];
      if (t.destroyed) continue;
      var td = _dist2(pp, t.pos);
      if (td < 5) {
        if (t.hasExplosive) {
          _showBanner('EXPLOSIVE ALREADY PLANTED ON TOWER ' + (i + 1) + ' — PRESS F TO DETONATE', '#ffdd44', 2);
          return;
        }
        _eHeld = true;
        _eHoldTarget = 'tower' + i;
        _eHoldTimer  = 0;
        _showBanner('PLANTING EXPLOSIVE... HOLD E (5s)', '#ffaa44', 1);
        return;
      }
    }

    // Virus upload terminal
    if (_serverTerminal) {
      var termDist = _dist3(pp, _serverTerminal.position);
      if (termDist < 5) {
        if (_towersDestroyed < TOWER_COUNT) {
          _showBanner('DESTROY ALL 3 UPLINK TOWERS FIRST!', '#ff8888', 2);
          return;
        }
        if (_virusState === 'COMPLETE') {
          _showBanner('VIRUS ALREADY UPLOADED', '#44ffcc', 2);
          return;
        }
        if (_virusState === 'UPLOADING') return;
        _eHeld = true;
        _eHoldTarget = 'upload';
        _eHoldTimer  = 0;
        _showBanner('UPLOADING VIRUS... HOLD E (8s)', '#4488ff', 1);
        return;
      }
    }

    _eHeld = false;
    _eHoldTarget = null;
    _eHoldTimer  = 0;
  }

  function _onERelease() {
    if (_eHeld) {
      _eHeld = false;
      if (_eHoldTarget && _eHoldTarget !== 'upload') {
        _showBanner('HOLD E FOR FULL DURATION TO PLANT EXPLOSIVE', '#ffaa44', 1.5);
      } else if (_eHoldTarget === 'upload' && _virusState !== 'UPLOADING') {
        _showBanner('HOLD E FOR FULL 8s TO UPLOAD', '#4488ff', 1.5);
      }
      _eHoldTarget = null;
      _eHoldTimer  = 0;
    }
    _uploadLocked = false;
  }

  function _updateEHold(delta) {
    if (!_eHeld || !_eHoldTarget) return;

    _eHoldTimer += delta;

    if (_eHoldTarget.indexOf('tower') === 0) {
      var tIdx = parseInt(_eHoldTarget.replace('tower', ''), 10);
      var tower = _towers[tIdx];
      if (!tower) return;
      var pct = Math.floor((_eHoldTimer / TOWER_PLANT_TIME) * 100);
      _showBanner('PLANTING... ' + _clamp(pct, 0, 100) + '%', '#ffaa44', 0.3);
      if (_eHoldTimer >= TOWER_PLANT_TIME) {
        tower.hasExplosive = true;
        _explosivesPlanted++;
        _eHeld = false;
        _eHoldTarget = null;
        _eHoldTimer  = 0;
        _showBanner('EXPLOSIVE PLANTED ON TOWER ' + (tIdx + 1) + ' — PRESS F TO DETONATE', '#ffdd44', 3);
      }
    } else if (_eHoldTarget === 'upload') {
      if (_virusState !== 'UPLOADING') {
        _virusState   = 'UPLOADING';
        _virusProgress = 0;
      }
      _virusProgress = _eHoldTimer / VIRUS_UPLOAD_TIME;
      _uploadLocked  = true;
      var vpct = Math.floor(_virusProgress * 100);
      _showBanner('UPLOADING VIRUS ' + _clamp(vpct, 0, 100) + '%', '#4488ff', 0.3);
      // Guards slowly converge during upload
      if (Math.floor(_eHoldTimer) !== Math.floor(_eHoldTimer - delta)) {
        _alertAllGuardsToTerminal();
      }
      if (_eHoldTimer >= VIRUS_UPLOAD_TIME) {
        _virusState    = 'COMPLETE';
        _virusProgress  = 1;
        _uploadLocked  = false;
        _eHeld         = false;
        _eHoldTarget   = null;
        _eHoldTimer    = 0;
        _virusCountdown = VIRUS_COUNTDOWN;
        _showBanner('VIRUS UPLOADED — SATELLITE CRASH IN 60s!', '#ffff44', 5);
      }
    }
  }

  function _alertAllGuardsToTerminal() {
    if (!_serverTerminal) return;
    var tp = _serverTerminal.position;
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive || g.empStunned) continue;
      // Slowly move toward terminal with increasing priority
      g.state = 'ALERT';
      g.alertTarget = tp.clone();
    }
  }

  // ─────────────────────────────────────────────── detonation

  function _detonateExplosives() {
    var detonated = false;
    for (var i = 0; i < _towers.length; i++) {
      var t = _towers[i];
      if (t.hasExplosive && !t.destroyed) {
        t.destroyed = true;
        t.hasExplosive = false;
        _towersDestroyed++;
        detonated = true;
        // Visual: hide signal, tilt dish
        t.signalMesh.visible = false;
        t.dishMesh.rotation.z = 0.8;
        t.poleMesh.rotation.z = 0.3;
        // Explosion light briefly
        var expLight = new THREE.PointLight(0xff6600, 4, 30);
        expLight.position.copy(t.pos);
        expLight.position.y = 8;
        _scene.add(expLight);
        (function (el) {
          setTimeout(function () {
            if (_scene) _scene.remove(el);
          }, 800);
        })(expLight);
      }
    }
    if (detonated) {
      _showBanner('UPLINK TOWER DESTROYED! [' + _towersDestroyed + '/3]', '#ff6600', 3);
    } else {
      _showBanner('NO ARMED EXPLOSIVE — HOLD E AT TOWER BASE FIRST', '#ff8888', 2);
    }
  }

  // ─────────────────────────────────────────────── helicopter AI

  function _updateHelicopter(delta) {
    if (!_heliMesh) return;

    // Orbit facility
    _heliOrbitAngle += (Math.PI * 2 / HELI_CYCLE) * delta;
    if (_heliOrbitAngle > Math.PI * 2) _heliOrbitAngle -= Math.PI * 2;
    _updateHeliPosition();

    // Spin rotor
    if (_heliRotorMesh) {
      _heliRotorMesh.rotation.y += delta * 8;
    }

    // Searchlight: pulse intensity
    if (_searchLight) {
      _searchLight.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.3;
    }

    // Check if searchlight hits player
    var pp = _playerPos();
    var heliPos = _heliMesh.position;
    var distToPlayer = _dist3(heliPos, pp);

    // Helicopter is overhead-ish if within orbit ± and player is exposed
    if (distToPlayer < SEARCHLIGHT_RANGE && !_hasDisguise) {
      _heliSpotTimer += delta;
      if (_heliSpotTimer >= 3.0 && !_heliSpotted) {
        // Spotted
        _heliSpotted = true;
        _heliSpotCount++;
        _showBanner('!! HELICOPTER SPOTTED YOU! [' + _heliSpotCount + '/3] — +4 GUARDS SCRAMBLED', '#ff2222', 4);
        _scrambleGuards(4);
        if (_heliSpotCount >= 3) {
          _missionLost = true;
          _showBanner('MISSION FAILED — SPOTTED BY HELICOPTER 3 TIMES', '#ff2222', 6);
        }
      }
    } else {
      if (_heliSpotted) _heliSpotted = false;
      if (_heliSpotTimer > 0) _heliSpotTimer = Math.max(0, _heliSpotTimer - delta * 2);
    }
  }

  function _scrambleGuards(count) {
    var pp = _playerPos();
    // Spawn extra guard meshes
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 2;
      var spawnX = pp.x + Math.cos(angle) * 30;
      var spawnZ = pp.z + Math.sin(angle) * 30;

      var gGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var gMat = new THREE.MeshPhongMaterial({ color: 0x223322 });
      var gMesh = new THREE.Mesh(gGeo, gMat);
      gMesh.position.set(spawnX, 0.9, spawnZ);
      _scene.add(gMesh);

      var scrambled = {
        mesh:        gMesh,
        hp:          HP_GUARD,
        alive:       true,
        type:        'GUARD',
        state:       'ALERT',
        patrol:      [],
        patrolIdx:   0,
        patrolDir:   1,
        alertTarget: pp.clone(),
        empStunned:  false,
        empTimer:    0
      };
      _guards.push(scrambled);
      _scrambledGuards.push(scrambled);
    }
  }

  // ─────────────────────────────────────────────── guard AI

  function _updateGuards(delta) {
    var pp = _playerPos();
    var inDisguise = _hasDisguise && _disguiseTimer > 0;

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (!g.alive) continue;

      // EMP stun tick
      if (g.empStunned) {
        g.empTimer -= delta;
        if (g.empTimer <= 0) {
          g.empStunned = false;
          g.empTimer   = 0;
          g.state      = 'PATROL';
        }
        continue;
      }

      // sight check: if not disguised and close
      if (!inDisguise) {
        var gd = _dist3(g.mesh.position, pp);
        if (gd < GUARD_SIGHT && g.state !== 'ALERT') {
          // Simple forward-cone check
          var gFwd = new THREE.Vector3(0, 0, -1);
          gFwd.applyEuler(g.mesh.rotation);
          var toPlayer = new THREE.Vector3(
            pp.x - g.mesh.position.x, 0, pp.z - g.mesh.position.z
          ).normalize();
          var dot = gFwd.dot(toPlayer);
          if (dot > 0.4 || gd < 6) {
            g.state = 'ALERT';
            g.alertTarget = pp.clone();
          }
        }
      } else if (inDisguise) {
        // Don't attack when disguised (unless too close they see through it)
        if (_dist3(g.mesh.position, pp) < 3) {
          g.state = 'ALERT';
          g.alertTarget = pp.clone();
          _showBanner('DISGUISE BLOWN — TOO CLOSE!', '#ff4444', 2);
          _disguiseTimer = 0;
        }
      }

      if (g.state === 'PATROL' && g.patrol.length > 0) {
        _doGuardPatrol(g, delta);
      } else if (g.state === 'ALERT' && g.alertTarget) {
        var distToTarget = _dist3(g.mesh.position, g.alertTarget);
        if (distToTarget > 1) {
          var dir = new THREE.Vector3(
            g.alertTarget.x - g.mesh.position.x,
            0,
            g.alertTarget.z - g.mesh.position.z
          ).normalize();
          g.mesh.position.x += dir.x * GUARD_SPEED * delta;
          g.mesh.position.z += dir.z * GUARD_SPEED * delta;
          g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
        // Update alert target to follow player
        if (_dist3(g.mesh.position, pp) < GUARD_SIGHT && !inDisguise) {
          g.alertTarget = pp.clone();
        }
      } else if (g.state === 'STUNNED') {
        // handled by empStunned above
        g.state = 'PATROL';
      }
    }

    // Commander AI
    _updateCommander(delta, pp, inDisguise);
  }

  function _doGuardPatrol(g, delta) {
    var target = g.patrol[g.patrolIdx];
    if (!target) return;
    var d = _dist2(g.mesh.position, target);
    if (d < 0.5) {
      g.patrolIdx += g.patrolDir;
      if (g.patrolIdx >= g.patrol.length || g.patrolIdx < 0) {
        g.patrolDir *= -1;
        g.patrolIdx += g.patrolDir;
      }
    } else {
      var dir = new THREE.Vector3(
        target.x - g.mesh.position.x,
        0,
        target.z - g.mesh.position.z
      ).normalize();
      g.mesh.position.x += dir.x * GUARD_SPEED * delta;
      g.mesh.position.z += dir.z * GUARD_SPEED * delta;
      g.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  function _updateCommander(delta, pp, inDisguise) {
    if (!_commander || !_commander.alive) return;

    if (!inDisguise) {
      var cd = _dist3(_commander.mesh.position, pp);
      if (cd < GUARD_SIGHT) {
        _commander.state = 'ALERT';
        _commander.alertTarget = pp.clone();
      }
    }

    if (_commander.state === 'PATROL' && _commander.patrol.length > 0) {
      _doGuardPatrol(_commander, delta);
    } else if (_commander.state === 'ALERT' && _commander.alertTarget) {
      var distC = _dist3(_commander.mesh.position, _commander.alertTarget);
      if (distC > 1) {
        var dirC = new THREE.Vector3(
          _commander.alertTarget.x - _commander.mesh.position.x,
          0,
          _commander.alertTarget.z - _commander.mesh.position.z
        ).normalize();
        _commander.mesh.position.x += dirC.x * GUARD_SPEED * 0.8 * delta;
        _commander.mesh.position.z += dirC.z * GUARD_SPEED * 0.8 * delta;
        _commander.mesh.rotation.y = Math.atan2(dirC.x, dirC.z);
      }
      if (!inDisguise && _dist3(_commander.mesh.position, pp) < GUARD_SIGHT) {
        _commander.alertTarget = pp.clone();
      }
    }
  }

  // ─────────────────────────────────────────────── technician AI

  function _updateTechnicians(delta) {
    for (var i = 0; i < _technicians.length; i++) {
      var t = _technicians[i];
      if (!t.alive) continue;

      if (t.fleeing) {
        var d = _dist3(t.mesh.position, t.fleeTarget);
        if (d > 1) {
          var dir = new THREE.Vector3(
            t.fleeTarget.x - t.mesh.position.x,
            0,
            t.fleeTarget.z - t.mesh.position.z
          ).normalize();
          t.mesh.position.x += dir.x * 4 * delta;
          t.mesh.position.z += dir.z * 4 * delta;
        } else {
          // Tech escaped — call for help
          if (t.witnessedAttack && t.alertCooldown > 0) {
            t.alertCooldown -= delta;
          } else if (t.witnessedAttack && t.alertCooldown <= 0) {
            t.witnessedAttack = false;
            _showBanner('TECHNICIAN CALLED FOR BACKUP — 2 GUARDS ARRIVING', '#ff8888', 3);
            _scrambleGuards(2);
          }
        }
      }
    }
  }

  // ─────────────────────────────────────────────── radar

  function _updateRadar(delta) {
    if (!_radarPivot) return;
    if (!_radarDisabled) {
      _radarPivot.rotation.y += RADAR_ROT_SPEED * delta;
    }
  }

  // ─────────────────────────────────────────────── grapple

  function _updateGrapple(delta) {
    if (!_grappleActive || !_grappleTower) return;
    _grappleTimer -= delta;
    if (_grappleTimer <= 0) {
      // Teleport player to tower top
      if (_camera) {
        _camera.position.set(_grappleTower.pos.x, 16, _grappleTower.pos.z);
      }
      _grappleActive = false;
      _grappleTower  = null;
      _showBanner('REACHED TOWER TOP — HOLD E TO PLANT EXPLOSIVE', '#aaffcc', 3);
    }
  }

  // ─────────────────────────────────────────────── disguise timer

  function _updateDisguise(delta) {
    if (!_hasDisguise || _disguiseTimer <= 0) return;
    _disguiseTimer -= delta;
    if (_disguiseTimer <= 0) {
      _disguiseTimer = 0;
      _showBanner('DISGUISE WORN OFF!', '#ff8888', 2);
    }
  }

  // ─────────────────────────────────────────────── virus countdown

  function _updateVirusCountdown(delta) {
    if (_virusState !== 'COMPLETE') return;
    if (_missionWon) return;
    _virusCountdown -= delta;
    if (_virusCountdown <= 30 && Math.floor(_virusCountdown) !== Math.floor(_virusCountdown + delta)) {
      _showBanner('SATELLITE CRASH IN ' + Math.ceil(_virusCountdown) + 's', '#ffff44', 1.5);
    }
    if (_virusCountdown <= 0) {
      _missionWon = true;
      _showBanner('MISSION COMPLETE — SATELLITE DESTROYED! NETWORK DOWN!', '#44ffcc', 8);
    }
  }

  // ─────────────────────────────────────────────── key handling

  function _onKeyDown(e) {
    var key = e.key.toUpperCase();

    // Activation: double-tap S
    if (key === 'S') {
      var now = Date.now();
      if (now - _lastSPress < ACTIVATION_WINDOW && !_active) {
        _activateModule();
      }
      _lastSPress = now;
    }

    if (!_active) return;

    // Shoot: left-click is not a key, map to F for testing; actual shoot on mouse
    // G = EMP grenade
    if (key === 'G') {
      e.preventDefault();
      _useEMP();
    }
    // T = grapple hook
    if (key === 'T') {
      e.preventDefault();
      _useGrapple();
    }
    // L = laser cutter
    if (key === 'L') {
      e.preventDefault();
      _useLaserCutter();
    }
    // E = interact (press to start hold)
    if (key === 'E') {
      e.preventDefault();
      _onEPress();
    }
    // F = detonate explosives
    if (key === 'F') {
      e.preventDefault();
      _detonateExplosives();
    }
  }

  function _onKeyUp(e) {
    var key = e.key.toUpperCase();
    if (key === 'E') {
      _onERelease();
    }
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      // Left click = shoot at crosshair
      if (!_camera) return;
      var fwd = _playerForward();
      var shootPos = _camera.position.clone().addScaledVector(fwd, 25);
      _shootAt(shootPos);
    }
  }

  function _bindKeys() {
    if (_keysBound) return;
    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('keyup',   _onKeyUp,   false);
    document.addEventListener('mousedown', _onMouseDown, false);
    _keysBound = true;
  }

  // ─────────────────────────────────────────────── activation

  function _activateModule() {
    _active = true;

    // Reset mission state
    _radarDisabled     = false;
    _hasAccessCard     = false;
    _hasDisguise       = false;
    _disguiseTimer     = 0;
    _hasFence          = true;
    _virusState        = 'NONE';
    _virusProgress     = 0;
    _virusHoldTimer    = 0;
    _uploadLocked      = false;
    _virusCountdown    = 0;
    _missionWon        = false;
    _missionLost       = false;
    _heliSpotCount     = 0;
    _heliOrbitAngle    = 0;
    _heliSpotTimer     = 0;
    _heliSpotted       = false;
    _explosivesPlanted = 0;
    _towersDestroyed   = 0;
    _empAvail          = true;
    _grappleActive     = false;
    _grappleTimer      = 0;
    _grappleTower      = null;
    _laserUsed         = false;
    _eHeld             = false;
    _eHoldTarget       = null;
    _eHoldTimer        = 0;
    _lastSPress        = 0;
    _scrambledGuards   = [];

    if (_hudEl) _hudEl.style.display = 'block';
    _showBanner('SPY SATELLITE — INFILTRATE GROUND CONTROL FACILITY', '#aaffaa', 4);

    if (!_groundMesh && _scene && _camera) {
      _buildScene();
    }
  }

  // ─────────────────────────────────────────────── dish pulse

  function _updateDishPulse(delta) {
    var t = Date.now() * 0.002;
    for (var i = 0; i < _towers.length; i++) {
      var tower = _towers[i];
      if (tower.destroyed) continue;
      if (tower.signalMesh) {
        var s = 1 + Math.sin(t + i * 1.5) * 0.2;
        tower.signalMesh.scale.set(s, s, s);
      }
    }
  }

  // ─────────────────────────────────────────────── public API

  function init(scene, camera) {
    _scene       = scene;
    _camera      = camera;
    _active      = false;
    _lastSPress  = 0;
    _sPressCount = 0;
    _keysBound   = false;

    // Reset all state
    _radarDisabled     = false;
    _hasAccessCard     = false;
    _hasDisguise       = false;
    _disguiseTimer     = 0;
    _hasFence          = true;
    _virusState        = 'NONE';
    _virusProgress     = 0;
    _virusHoldTimer    = 0;
    _uploadLocked      = false;
    _virusCountdown    = 0;
    _missionWon        = false;
    _missionLost       = false;
    _heliSpotCount     = 0;
    _heliOrbitAngle    = 0;
    _heliSpotTimer     = 0;
    _heliSpotted       = false;
    _explosivesPlanted = 0;
    _towersDestroyed   = 0;
    _empAvail          = true;
    _grappleActive     = false;
    _grappleTimer      = 0;
    _grappleTower      = null;
    _laserUsed         = false;
    _eHeld             = false;
    _eHoldTarget       = null;
    _eHoldTimer        = 0;
    _scrambledGuards   = [];
    _guards            = [];
    _technicians       = [];
    _towers            = [];
    _commander         = null;

    _buildHUD();
    _bindKeys();
  }

  function update(delta) {
    if (!_scene || !_camera) return;
    if (!_active) return;
    if (_missionWon || _missionLost) {
      _updateHUD();
      return;
    }

    _updateRadar(delta);
    _updateHelicopter(delta);
    _updateGuards(delta);
    _updateTechnicians(delta);
    _updateEHold(delta);
    _updateGrapple(delta);
    _updateDisguise(delta);
    _updateVirusCountdown(delta);
    _updateDishPulse(delta);
    _updateHUD();
  }

  function reset() {
    _active            = false;
    _radarDisabled     = false;
    _hasAccessCard     = false;
    _hasDisguise       = false;
    _disguiseTimer     = 0;
    _hasFence          = true;
    _virusState        = 'NONE';
    _virusProgress     = 0;
    _uploadLocked      = false;
    _virusCountdown    = 0;
    _missionWon        = false;
    _missionLost       = false;
    _heliSpotCount     = 0;
    _heliOrbitAngle    = 0;
    _heliSpotTimer     = 0;
    _heliSpotted       = false;
    _explosivesPlanted = 0;
    _towersDestroyed   = 0;
    _empAvail          = true;
    _grappleActive     = false;
    _grappleTimer      = 0;
    _grappleTower      = null;
    _laserUsed         = false;
    _eHeld             = false;
    _eHoldTarget       = null;
    _eHoldTimer        = 0;
    _lastSPress        = 0;
    _scrambledGuards   = [];

    // Remove scene objects
    if (_scene) {
      if (_groundMesh)      _scene.remove(_groundMesh);
      if (_fenceMesh)       _scene.remove(_fenceMesh);
      if (_controlBldg)     _scene.remove(_controlBldg);
      if (_serverRoom)      _scene.remove(_serverRoom);
      if (_serverTerminal)  _scene.remove(_serverTerminal);
      if (_checkpoint)      _scene.remove(_checkpoint);
      if (_barracks)        _scene.remove(_barracks);
      if (_radarPivot)      _scene.remove(_radarPivot);
      if (_heliMesh)        _scene.remove(_heliMesh);
      if (_cardScannerMesh) _scene.remove(_cardScannerMesh);
      if (_doorMesh)        _scene.remove(_doorMesh);
      if (_disguiseMesh)    _scene.remove(_disguiseMesh);
    }

    for (var ti = 0; ti < _towers.length; ti++) {
      var tw = _towers[ti];
      if (_scene) {
        if (tw.poleMesh)   _scene.remove(tw.poleMesh);
        if (tw.dishMesh)   _scene.remove(tw.dishMesh);
        if (tw.signalMesh) _scene.remove(tw.signalMesh);
        if (tw.baseMesh)   _scene.remove(tw.baseMesh);
      }
    }
    _towers = [];

    for (var gi = 0; gi < _guards.length; gi++) {
      if (_scene && _guards[gi].mesh) _scene.remove(_guards[gi].mesh);
    }
    _guards = [];

    if (_commander && _scene) _scene.remove(_commander.mesh);
    _commander = null;

    for (var tti = 0; tti < _technicians.length; tti++) {
      if (_scene && _technicians[tti].mesh) _scene.remove(_technicians[tti].mesh);
    }
    _technicians = [];

    _groundMesh      = null;
    _fenceMesh       = null;
    _controlBldg     = null;
    _serverRoom      = null;
    _serverTerminal  = null;
    _checkpoint      = null;
    _barracks        = null;
    _radarPivot      = null;
    _radarMesh       = null;
    _heliMesh        = null;
    _heliRotorMesh   = null;
    _searchLight     = null;
    _cardScannerMesh = null;
    _doorMesh        = null;
    _disguiseMesh    = null;

    if (_hudEl) _hudEl.style.display = 'none';
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
