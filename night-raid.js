// night-raid.js — SEAL Team 6 Night Raid FPS Module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, THREE global
//
// Activation: N + R simultaneous keypress within 400ms
//
// Public API:
//   NightRaid.init(scene, camera, renderer, options)
//   NightRaid.update(dt)
//   NightRaid.reset()

window.NightRaid = (function () {
  'use strict';

  // ─────────────────────────────────────────────── CONSTANTS

  var COMPOUND_CENTER_X    = 0;
  var COMPOUND_CENTER_Z    = 0;
  var WALL_HALF            = 60;
  var LZ_Z                 = -120;       // 60u north of compound

  var DETECT_RANGE_DARK    = 6;
  var DETECT_RANGE_NVG     = 12;
  var DETECT_RANGE_FLASH   = 14;
  var SUPPRESSOR_RANGE     = 8;
  var ALERT_RANGE_UNSUP    = 20;
  var DOG_BARK_RANGE       = 5;

  var HVI_HP               = 100;
  var GUARD_HP             = 80;
  var SLEEPING_HP          = 40;

  var HVI_ESCAPE_TIME      = 120;   // seconds before HVI calls vehicle
  var RADIO_EXTRACT_TIME   = 90;    // seconds for helo arrival
  var SLEEP_WAKE_TIME      = 4;     // seconds for sleeping guard to wake

  var KEY_N = 78;
  var KEY_R = 82;
  var KEY_E = 69;
  var KEY_Q = 81;
  var KEY_1 = 49;
  var KEY_2 = 50;
  var KEY_3 = 51;

  // ─────────────────────────────────────────────── STATE

  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _active      = false;
  var _initialized = false;

  // Player state
  var _player = {
    mesh: null,
    hp: 100,
    pos: { x: 0, y: 1.7, z: 90 },
    yaw: 0,
    pitch: 0,
    speed: 8,
    nvgOn: false,
    flashlightOn: true,
    suppressed: true,
    score: 0,
    carryingHVI: false,
    holdingE: false,
    holdETimer: 0,
    dead: false
  };

  // Squad
  var _squad = [];    // 2 SEAL teammates
  var _squadCommand = 'follow';   // 'follow'|'breach1'|'perimeter'|'secureHVI'

  // Guards array
  var _guards = [];

  // Dogs
  var _dogs = [];

  // HVI
  var _hvi = {
    mesh: null,
    hp: HVI_HP,
    pos: { x: 25, y: 6, z: -10 },
    state: 'idle',    // 'idle'|'alerted'|'fleeing'|'downed'|'captured'|'extracted'
    aliveTimer: 0,
    vehicleEscapeStarted: false,
    captured: false,
    dead: false
  };

  // Compound objects
  var _buildings   = [];
  var _gates       = [];   // 3 gate padlocks
  var _vehicles    = [];
  var _generator   = { mesh: null, hp: 60, alive: true, pos: { x: -35, y: 0, z: -25 } };
  var _phone       = { mesh: null, cloned: false, pos: { x: 25, y: 7.5, z: -10 } };
  var _documents   = [];   // 3 hidden docs
  var _revealedDocs = 0;

  // Lights
  var _ambientLight   = null;
  var _nvgLight       = null;
  var _buildingLights = [];
  var _generatorOn    = true;

  // HUD element
  var _hudEl = null;

  // Fog
  var _fog = null;

  // Noise & alert state
  var _noiseLevel = 0;    // 0=silent 1=elevated 2=compromised
  var _alertedGuards = 0;

  // Extraction
  var _lzMesh        = null;
  var _radioActive   = false;
  var _radioTimer    = 0;
  var _extracting    = false;
  var _gameOver      = false;
  var _gameOverMsg   = '';
  var _win           = false;

  // Input
  var _keys = {};
  var _nKeyTime = 0;
  var _rKeyTime = 0;
  var _mouse = { dx: 0, dy: 0, locked: false };

  // Clock
  var _clock = null;
  var _totalTime = 0;

  // ─────────────────────────────────────────────── HELPERS

  function _v3(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _makeMesh(geom, color, y, wireframe) {
    var mat = wireframe
      ? new THREE.MeshBasicMaterial({ color: color, wireframe: true })
      : new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    if (y !== undefined) mesh.position.y = y;
    return mesh;
  }

  function _setPos(mesh, x, y, z) {
    mesh.position.set(x, y, z);
  }

  // ─────────────────────────────────────────────── SCENE BUILDING

  function _buildScene() {
    // Background & fog
    _scene.background = new THREE.Color(0x000011);
    _fog = new THREE.FogExp2(0x000022, 0.015);
    _scene.fog = _fog;

    // Ambient
    _ambientLight = new THREE.AmbientLight(0x111122, 1.0);
    _scene.add(_ambientLight);

    // NVG boost light (starts off)
    _nvgLight = new THREE.PointLight(0x00ff44, 0, 80);
    _nvgLight.position.set(0, 20, 0);
    _scene.add(_nvgLight);

    // Ground plane
    var groundGeo  = new THREE.BoxGeometry(400, 0.2, 400);
    var groundMesh = _makeMesh(groundGeo, 0x1a2a1a, 0);
    _scene.add(groundMesh);

    // ── OUTER WALL ──────────────────────────────────────────────
    _buildWalls();

    // ── BUILDINGS ───────────────────────────────────────────────
    _buildBuilding1();
    _buildBuilding2();
    _buildBuilding3();

    // ── VEHICLE LOT ─────────────────────────────────────────────
    _buildVehicles();

    // ── GENERATOR ───────────────────────────────────────────────
    _buildGenerator();

    // ── DOG KENNEL ──────────────────────────────────────────────
    _buildDogs();

    // ── GUARDS ──────────────────────────────────────────────────
    _spawnGuards();

    // ── HVI ─────────────────────────────────────────────────────
    _spawnHVI();

    // ── INTEL ITEMS ─────────────────────────────────────────────
    _spawnIntel();

    // ── SQUAD ───────────────────────────────────────────────────
    _spawnSquad();

    // ── EXTRACTION LZ ───────────────────────────────────────────
    _buildLZ();

    // ── PLAYER MESH ─────────────────────────────────────────────
    _buildPlayer();

    // ── HUD ─────────────────────────────────────────────────────
    _buildHUD();
  }

  function _buildWalls() {
    var wallH   = 3;
    var wallT   = 0.6;
    var wallCol = 0x334433;

    // North wall segments (3 segments with gaps for gates)
    var wallDefs = [
      // South wall
      { w: 120, d: wallT, x: 0,        y: wallH / 2, z:  WALL_HALF },
      // North wall
      { w: 120, d: wallT, x: 0,        y: wallH / 2, z: -WALL_HALF },
      // West wall
      { w: wallT, d: 120, x: -WALL_HALF, y: wallH / 2, z: 0 },
      // East wall
      { w: wallT, d: 120, x:  WALL_HALF, y: wallH / 2, z: 0 }
    ];

    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var geo = new THREE.BoxGeometry(wd.w, wallH, wd.d);
      var mesh = _makeMesh(geo, wallCol, 0);
      _setPos(mesh, wd.x, wd.y, wd.z);
      _scene.add(mesh);
    }

    // LineSegments outline for outer wall
    var pts = [
      -WALL_HALF, wallH, -WALL_HALF,
       WALL_HALF, wallH, -WALL_HALF,
       WALL_HALF, wallH,  WALL_HALF,
      -WALL_HALF, wallH,  WALL_HALF,
      -WALL_HALF, wallH, -WALL_HALF
    ];
    var lineGeo  = new THREE.BufferGeometry();
    var lineVerts = new Float32Array(pts);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(lineVerts, 3));
    var lineMat  = new THREE.LineBasicMaterial({ color: 0x22aa22 });
    var lineSegs = new THREE.Line(lineGeo, lineMat);
    _scene.add(lineSegs);

    // 3 Gates — padlocks as BoxGeometry (shoot to open)
    var gatePositions = [
      { x: 0,           z:  WALL_HALF, axis: 'z' },   // south gate
      { x: -WALL_HALF,  z: 0,          axis: 'x' },   // west gate
      { x:  WALL_HALF,  z: 0,          axis: 'x' }    // east gate
    ];
    for (var g = 0; g < gatePositions.length; g++) {
      var gp   = gatePositions[g];
      var pGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var pMesh = _makeMesh(pGeo, 0x886622, 0);
      _setPos(pMesh, gp.x, 1.5, gp.z);
      pMesh.userData.isGate    = true;
      pMesh.userData.gateIndex = g;
      pMesh.userData.open      = false;
      pMesh.userData.hp        = 1;
      _scene.add(pMesh);
      _gates.push(pMesh);
    }
  }

  function _buildBuilding1() {
    // Guard barracks — 15×5×10
    var geo  = new THREE.BoxGeometry(15, 5, 10);
    var mesh = _makeMesh(geo, 0x3A4A3A, 0);
    _setPos(mesh, -20, 2.5, 20);
    _scene.add(mesh);
    _buildings.push({ mesh: mesh, id: 1, pos: { x: -20, y: 2.5, z: 20 }, w: 15, h: 5, d: 10 });

    // Interior dim light
    var bLight = new THREE.PointLight(0x332211, 0.4, 12);
    bLight.position.set(-20, 4, 20);
    _scene.add(bLight);
    _buildingLights.push(bLight);
  }

  function _buildBuilding2() {
    // Weapons cache — 12×5×8
    var geo  = new THREE.BoxGeometry(12, 5, 8);
    var mesh = _makeMesh(geo, 0x3A4A3A, 0);
    _setPos(mesh, 20, 2.5, 20);
    mesh.userData.isBuilding2 = true;
    mesh.userData.iedTriggered = false;
    _scene.add(mesh);
    _buildings.push({ mesh: mesh, id: 2, pos: { x: 20, y: 2.5, z: 20 }, w: 12, h: 5, d: 8 });

    var bLight = new THREE.PointLight(0x332211, 0.4, 10);
    bLight.position.set(20, 4, 20);
    _scene.add(bLight);
    _buildingLights.push(bLight);
  }

  function _buildBuilding3() {
    // HVI building — 20×8×15, 2-story
    var geo  = new THREE.BoxGeometry(20, 8, 15);
    var mesh = _makeMesh(geo, 0x3A4A3A, 0);
    _setPos(mesh, 25, 4, -10);
    _scene.add(mesh);
    _buildings.push({ mesh: mesh, id: 3, pos: { x: 25, y: 4, z: -10 }, w: 20, h: 8, d: 15 });

    // 2nd floor floor separator (visual)
    var floorGeo  = new THREE.BoxGeometry(20, 0.3, 15);
    var floorMesh = _makeMesh(floorGeo, 0x2A3A2A, 0);
    _setPos(floorMesh, 25, 4.15, -10);
    _scene.add(floorMesh);

    var bLight = new THREE.PointLight(0x332211, 0.5, 18);
    bLight.position.set(25, 6, -10);
    _scene.add(bLight);
    _buildingLights.push(bLight);
  }

  function _buildVehicles() {
    // 2 pickup trucks
    var truckPositions = [
      { x: -35, z: 35 },
      { x: -25, z: 35 }
    ];
    for (var i = 0; i < truckPositions.length; i++) {
      var tp = truckPositions[i];
      // Body
      var bodyGeo  = new THREE.BoxGeometry(4, 1.4, 7);
      var bodyMesh = _makeMesh(bodyGeo, 0x664422, 0);
      _setPos(bodyMesh, tp.x, 1.2, tp.z);
      _scene.add(bodyMesh);
      // Cab
      var cabGeo  = new THREE.BoxGeometry(3.6, 1.2, 3.5);
      var cabMesh = _makeMesh(cabGeo, 0x554422, 0);
      _setPos(cabMesh, tp.x, 2.4, tp.z - 1.2);
      _scene.add(cabMesh);
      _vehicles.push({ body: bodyMesh, cab: cabMesh, pos: { x: tp.x, z: tp.z }, hp: 80 });
    }
  }

  function _buildGenerator() {
    var geo  = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 8);
    var mesh = _makeMesh(geo, 0x555544, 0);
    _setPos(mesh, _generator.pos.x, 0.9, _generator.pos.z);
    mesh.userData.isGenerator = true;
    mesh.userData.hp          = _generator.hp;
    _generator.mesh = mesh;
    _scene.add(mesh);
  }

  function _buildDogs() {
    var dogPositions = [
      { x: -40, z: -20 },
      { x: -40, z: -10 }
    ];
    for (var i = 0; i < dogPositions.length; i++) {
      var dp  = dogPositions[i];
      var geo = new THREE.CylinderGeometry(0.3, 0.3, 0.7, 6);
      var mesh = _makeMesh(geo, 0x885533, 0);
      _setPos(mesh, dp.x, 0.35, dp.z);
      _scene.add(mesh);
      _dogs.push({
        mesh: mesh,
        pos:  { x: dp.x, z: dp.z },
        barked: false,
        hp: 20
      });
    }

    // Kennel box
    var kennelGeo  = new THREE.BoxGeometry(5, 2, 3);
    var kennelMesh = _makeMesh(kennelGeo, 0x443322, 0);
    _setPos(kennelMesh, -40, 1, -15);
    _scene.add(kennelMesh);
  }

  function _spawnGuards() {
    // 6 sleeping guards in building 1
    var sleepPositions = [
      { x: -22, y: 0.5, z: 19, sleeping: true },
      { x: -20, y: 0.5, z: 19, sleeping: true },
      { x: -18, y: 0.5, z: 19, sleeping: true },
      { x: -22, y: 0.5, z: 21, sleeping: true },
      { x: -20, y: 0.5, z: 21, sleeping: true },
      { x: -18, y: 0.5, z: 21, sleeping: true }
    ];

    for (var i = 0; i < sleepPositions.length; i++) {
      var sp  = sleepPositions[i];
      var geo = new THREE.BoxGeometry(0.6, 0.4, 1.5);
      var mesh = _makeMesh(geo, 0x334433, 0);
      _setPos(mesh, sp.x, sp.y, sp.z);
      _scene.add(mesh);
      _guards.push({
        mesh:     mesh,
        pos:      { x: sp.x, y: sp.y, z: sp.z },
        hp:       SLEEPING_HP,
        maxHp:    SLEEPING_HP,
        state:    'sleeping',   // 'sleeping'|'patrol'|'alert'|'combat'|'dead'
        wakeTimer: 0,
        alertRadius: 6,
        patrolIndex: 0,
        patrolPath:  [],
        detectedPlayer: false,
        building:  1,
        sleeping:  true,
        revealedPath: false,
        id: i
      });
    }

    // 6 patrol guards outside / in other buildings
    var patrolDefs = [
      { x:  0,  y: 1, z:  30, path: [{ x:  0, z: 30 }, { x: 30, z: 30 }, { x: 30, z: 0 }, { x: 0, z: 0 }] },
      { x: -30, y: 1, z:  0,  path: [{ x: -30, z: 0 }, { x: -30, z: -40 }, { x: 0, z: -40 }] },
      { x:  10, y: 1, z:  20, path: [{ x: 10, z: 20 }, { x: 30, z: 20 }, { x: 30, z: 40 }] },
      { x:  25, y: 1, z: -25, path: [{ x: 25, z: -25 }, { x: 40, z: -25 }, { x: 40, z: 10 }] },
      { x: -10, y: 1, z: -30, path: [{ x: -10, z: -30 }, { x: -40, z: -30 }, { x: -40, z: 0 }] },
      { x:  0,  y: 1, z: -50, path: [{ x: 0, z: -50 }, { x: 50, z: -50 }, { x: 50, z: -20 }] }
    ];

    for (var j = 0; j < patrolDefs.length; j++) {
      var pd   = patrolDefs[j];
      var geo2 = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var mesh2 = _makeMesh(geo2, 0x334433, 0);
      _setPos(mesh2, pd.x, pd.y, pd.z);
      _scene.add(mesh2);
      _guards.push({
        mesh:     mesh2,
        pos:      { x: pd.x, y: pd.y, z: pd.z },
        hp:       GUARD_HP,
        maxHp:    GUARD_HP,
        state:    'patrol',
        wakeTimer: 0,
        alertRadius: DETECT_RANGE_DARK,
        patrolIndex: 0,
        patrolPath:  pd.path,
        detectedPlayer: false,
        building:  0,
        sleeping:  false,
        revealedPath: false,
        id: 6 + j
      });
    }
  }

  function _spawnHVI() {
    var geo  = new THREE.BoxGeometry(0.8, 1.8, 0.5);
    var mesh = _makeMesh(geo, 0x553322, 0);
    _setPos(mesh, _hvi.pos.x, _hvi.pos.y, _hvi.pos.z);
    _hvi.mesh = mesh;
    _scene.add(mesh);
  }

  function _spawnIntel() {
    // Phone in HVI room
    var pGeo  = new THREE.BoxGeometry(0.15, 0.02, 0.3);
    var pMesh = _makeMesh(pGeo, 0xCCCCCC, 0);
    _setPos(pMesh, _phone.pos.x, _phone.pos.y, _phone.pos.z);
    _phone.mesh = pMesh;
    _scene.add(pMesh);

    // 3 Documents
    var docPositions = [
      { x: -5,  y: 0.1, z:  40 },
      { x:  15, y: 0.1, z:  25 },
      { x: -30, y: 0.1, z: -35 }
    ];
    for (var i = 0; i < docPositions.length; i++) {
      var dp   = docPositions[i];
      var dGeo = new THREE.BoxGeometry(0.4, 0.02, 0.5);
      var dMesh = _makeMesh(dGeo, 0xEEEECC, 0);
      _setPos(dMesh, dp.x, dp.y, dp.z);
      dMesh.userData.docIndex  = i;
      dMesh.userData.collected = false;
      _scene.add(dMesh);
      _documents.push({ mesh: dMesh, pos: dp, collected: false, index: i });
    }
  }

  function _spawnSquad() {
    var squadColors = [0x445544, 0x445544];
    var startZ      = [92, 88];
    for (var i = 0; i < 2; i++) {
      var geo  = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var mesh = _makeMesh(geo, squadColors[i], 0);
      _setPos(mesh, i === 0 ? -2 : 2, 1, startZ[i]);
      _scene.add(mesh);
      _squad.push({
        mesh:   mesh,
        pos:    { x: i === 0 ? -2 : 2, y: 1, z: startZ[i] },
        hp:     100,
        alive:  true,
        state:  'follow',
        target: null,
        id:     i
      });
    }
  }

  function _buildLZ() {
    var geo  = new THREE.PlaneGeometry(20, 20);
    var mat  = new THREE.MeshLambertMaterial({ color: 0x334433, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    _lzMesh  = new THREE.Mesh(geo, mat);
    _lzMesh.rotation.x = -Math.PI / 2;
    _lzMesh.position.set(0, 0.05, LZ_Z);
    _scene.add(_lzMesh);

    // LZ marker lines
    var lzLineGeo = new THREE.BufferGeometry();
    var lzVerts   = new Float32Array([
      -10, 0.1, LZ_Z - 10,  10, 0.1, LZ_Z - 10,
       10, 0.1, LZ_Z - 10,  10, 0.1, LZ_Z + 10,
       10, 0.1, LZ_Z + 10, -10, 0.1, LZ_Z + 10,
      -10, 0.1, LZ_Z + 10, -10, 0.1, LZ_Z - 10
    ]);
    lzLineGeo.setAttribute('position', new THREE.BufferAttribute(lzVerts, 3));
    var lzLineMat = new THREE.LineBasicMaterial({ color: 0x00ff44 });
    var lzLine    = new THREE.LineSegments(lzLineGeo, lzLineMat);
    _scene.add(lzLine);
  }

  function _buildPlayer() {
    // Player capsule visual (hidden in FPS — camera IS the player)
    var geo  = new THREE.BoxGeometry(0.6, 1.8, 0.3);
    var mesh = _makeMesh(geo, 0x223322, 0);
    _setPos(mesh, _player.pos.x, _player.pos.y - 0.9, _player.pos.z);
    mesh.visible = false;
    _player.mesh = mesh;
    _scene.add(mesh);

    // Attach camera to player
    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.set(0, 0, 0);

    // Flashlight
    var flashGeo  = new THREE.BoxGeometry(0.1, 0.1, 0.3);
    var flashMesh = _makeMesh(flashGeo, 0xFFFFCC, 0);
    flashMesh.position.set(0.2, -0.15, -0.4);
    _camera.add(flashMesh);
    _player.flashMesh = flashMesh;

    // Spot light for flashlight
    var spotLight = new THREE.SpotLight(0xFFFFCC, 2, 20, Math.PI / 8, 0.4);
    spotLight.position.set(0, 0, 0);
    _camera.add(spotLight);
    _player.spotLight = spotLight;
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'night-raid-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00aa22',
      'border-radius:3px',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Crosshair
    var xhEl = document.createElement('div');
    xhEl.id  = 'night-raid-xh';
    xhEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:12px',
      'height:12px',
      'border:1px solid rgba(0,255,68,0.6)',
      'border-radius:50%',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(xhEl);

    // Game over overlay
    var goEl = document.createElement('div');
    goEl.id  = 'night-raid-go';
    goEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:24px',
      'padding:30px 50px',
      'border:2px solid #00aa22',
      'border-radius:6px',
      'z-index:10000',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(goEl);
    _hudEl.gameOverEl = goEl;
  }

  // ─────────────────────────────────────────────── INPUT

  function _onKeyDown(e) {
    if (!_active) {
      _keys[e.keyCode] = true;
      _checkActivation(e.keyCode);
      return;
    }
    _keys[e.keyCode] = true;

    // NVG toggle
    if (e.keyCode === KEY_N) {
      _toggleNVG();
    }

    // Squad commands
    if (e.keyCode === KEY_1) { _squadCommand = 'breach1';    _orderSquad('breach1'); }
    if (e.keyCode === KEY_2) { _squadCommand = 'perimeter';  _orderSquad('perimeter'); }
    if (e.keyCode === KEY_3) { _squadCommand = 'secureHVI';  _orderSquad('secureHVI'); }

    // Radio extract
    if (e.keyCode === KEY_R && !_radioActive) {
      _callExtract();
    }

    // Q = knife kill
    if (e.keyCode === KEY_Q) {
      _knifeKill();
    }

    // E hold — start HVI carry / phone clone / doc pickup
    if (e.keyCode === KEY_E) {
      _player.holdingE = true;
    }
  }

  function _onKeyUp(e) {
    _keys[e.keyCode] = false;
    if (e.keyCode === KEY_E) {
      _player.holdingE  = false;
      _player.holdETimer = 0;
    }
  }

  function _onMouseMove(e) {
    if (!_active || !_mouse.locked) return;
    var sens = 0.002;
    _player.yaw   -= e.movementX * sens;
    _player.pitch -= e.movementY * sens;
    _player.pitch  = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _player.pitch));
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      _shoot();
    }
    if (!_mouse.locked) {
      document.body.requestPointerLock();
    }
  }

  function _onPointerLockChange() {
    _mouse.locked = (document.pointerLockElement === document.body);
  }

  function _checkActivation(keyCode) {
    var now = Date.now();
    if (keyCode === KEY_N) { _nKeyTime = now; }
    if (keyCode === KEY_R) { _rKeyTime = now; }
    if (Math.abs(_nKeyTime - _rKeyTime) < 400 && _nKeyTime > 0 && _rKeyTime > 0) {
      _nKeyTime = 0;
      _rKeyTime = 0;
      if (!_active) {
        _startGame();
      }
    }
  }

  // ─────────────────────────────────────────────── GAME START / RESET

  function _startGame() {
    if (!_initialized) {
      _buildScene();
      _initialized = true;
    } else {
      _resetState();
    }
    _active     = true;
    _gameOver   = false;
    _gameOverMsg = '';
    _win        = false;
    if (_hudEl && _hudEl.gameOverEl) {
      _hudEl.gameOverEl.style.display = 'none';
    }
    if (_hudEl) _hudEl.style.display = 'block';
    document.body.requestPointerLock();
  }

  function _resetState() {
    // Reset player position
    _player.pos      = { x: 0, y: 1.7, z: 90 };
    _player.hp       = 100;
    _player.nvgOn    = false;
    _player.score    = 0;
    _player.carryingHVI = false;
    _player.holdETimer  = 0;
    _player.dead        = false;

    // Reset HVI
    _hvi.hp               = HVI_HP;
    _hvi.state            = 'idle';
    _hvi.aliveTimer       = 0;
    _hvi.vehicleEscapeStarted = false;
    _hvi.captured         = false;
    _hvi.dead             = false;
    if (_hvi.mesh) _setPos(_hvi.mesh, _hvi.pos.x, _hvi.pos.y, _hvi.pos.z);

    _noiseLevel    = 0;
    _alertedGuards = 0;
    _radioActive   = false;
    _radioTimer    = 0;
    _extracting    = false;
    _generatorOn   = true;
    _totalTime     = 0;

    // Reset guards
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      g.hp    = g.sleeping ? SLEEPING_HP : GUARD_HP;
      g.state = g.sleeping ? 'sleeping' : 'patrol';
      g.detectedPlayer = false;
      g.wakeTimer = 0;
    }

    // Reset squad
    for (var j = 0; j < _squad.length; j++) {
      _squad[j].hp    = 100;
      _squad[j].alive = true;
      _squad[j].state = 'follow';
    }

    // Reset phone / docs
    _phone.cloned = false;
    _revealedDocs = 0;
    for (var k = 0; k < _documents.length; k++) {
      _documents[k].collected = false;
      if (_documents[k].mesh) _documents[k].mesh.visible = true;
    }
    _generator.hp    = 60;
    _generator.alive = true;
    if (_generator.mesh) _generator.mesh.visible = true;
    for (var l = 0; l < _buildingLights.length; l++) {
      _buildingLights[l].intensity = 0.4;
    }
  }

  // ─────────────────────────────────────────────── MECHANICS

  function _toggleNVG() {
    _player.nvgOn = !_player.nvgOn;
    if (_player.nvgOn) {
      _nvgLight.intensity  = 3;
      _scene.background    = new THREE.Color(0x001100);
      _ambientLight.color.setHex(0x224422);
      _ambientLight.intensity = 2;
    } else {
      _nvgLight.intensity  = 0;
      _scene.background    = new THREE.Color(0x000011);
      _ambientLight.color.setHex(0x111122);
      _ambientLight.intensity = 1;
    }
  }

  function _getDetectRange() {
    var range = DETECT_RANGE_DARK;
    if (_player.nvgOn)      range = DETECT_RANGE_NVG;
    if (_player.flashlightOn) range = Math.max(range, DETECT_RANGE_FLASH);
    return range;
  }

  function _shoot() {
    if (!_active || _gameOver || _player.dead) return;

    // Raycast from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    var ray = new THREE.Raycaster(_camera.position.clone(), dir, 0, 60);

    // Collect all shootable objects
    var targets = [];
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].mesh && _guards[i].state !== 'dead') targets.push(_guards[i].mesh);
    }
    if (_hvi.mesh && _hvi.state !== 'extracted') targets.push(_hvi.mesh);
    if (_generator.mesh && _generator.alive) targets.push(_generator.mesh);
    for (var g = 0; g < _gates.length; g++) {
      if (!_gates[g].userData.open) targets.push(_gates[g]);
    }
    for (var v = 0; v < _vehicles.length; v++) {
      targets.push(_vehicles[v].body);
    }

    var hits = ray.intersectObjects(targets);
    if (hits.length > 0) {
      var hit = hits[0];
      _processHit(hit.object);
    }

    // Noise alert
    if (_player.suppressed) {
      _alertNearbyGuards(_player.pos, SUPPRESSOR_RANGE, 'shot');
    } else {
      _alertNearbyGuards(_player.pos, ALERT_RANGE_UNSUP, 'shot');
      _noiseLevel = Math.min(2, _noiseLevel + 1);
    }

    // Visual flash
    _createMuzzleFlash();
  }

  function _processHit(obj) {
    // Check guard
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].mesh === obj) {
        _damageGuard(_guards[i], 35);
        return;
      }
    }
    // HVI
    if (_hvi.mesh === obj) {
      _damageHVI(25);
      return;
    }
    // Generator
    if (_generator.mesh === obj) {
      _generator.hp -= 30;
      if (_generator.hp <= 0) _destroyGenerator();
      return;
    }
    // Gate padlock
    if (obj.userData.isGate && !obj.userData.open) {
      obj.userData.open = true;
      obj.visible       = false;
      return;
    }
    // Vehicles
    for (var v = 0; v < _vehicles.length; v++) {
      if (_vehicles[v].body === obj) {
        _vehicles[v].hp -= 30;
        if (_vehicles[v].hp <= 0) {
          _vehicles[v].body.material.color.setHex(0x331100);
        }
        return;
      }
    }
  }

  function _damageGuard(guard, dmg) {
    if (guard.state === 'dead') return;
    guard.hp -= dmg;
    if (guard.hp <= 0) {
      guard.state = 'dead';
      guard.mesh.material.color.setHex(0x112211);
      guard.mesh.position.y = 0.15;
    } else if (guard.state === 'sleeping') {
      guard.state     = 'alert';
      guard.wakeTimer = 0;
    } else {
      guard.state = 'combat';
    }
  }

  function _damageHVI(dmg) {
    if (_hvi.dead || _hvi.state === 'extracted') return;
    _hvi.hp -= dmg;
    if (_hvi.hp <= 0) {
      _hvi.dead  = true;
      _hvi.state = 'downed';
      _hvi.mesh.material.color.setHex(0x331100);
      _hvi.mesh.position.y = 0.5;
    } else {
      if (_hvi.state === 'idle') {
        _hvi.state = 'fleeing';
        _alertNearbyGuards(_hvi.pos, ALERT_RANGE_UNSUP, 'hvi_shot');
      }
    }
  }

  function _knifeKill() {
    if (!_active || _gameOver || _player.dead) return;
    // Silent kill within 2 units
    var closest  = null;
    var closestD = 9999;
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.state === 'dead') continue;
      var d = _dist3D(_player.pos, g.pos);
      if (d < 2.5 && d < closestD) {
        closestD = d;
        closest  = g;
      }
    }
    if (closest) {
      _damageGuard(closest, 999);  // instant kill
      // Silent — no noise event
    }
    // Can also knife HVI to down
    if (_hvi.state !== 'downed' && _hvi.state !== 'extracted') {
      var hd = _dist3D(_player.pos, _hvi.pos);
      if (hd < 2.5) {
        _damageHVI(999);
      }
    }
  }

  function _destroyGenerator() {
    _generatorOn = false;
    _generator.alive = false;
    _generator.mesh.material.color.setHex(0x221100);
    // Kill building lights
    for (var i = 0; i < _buildingLights.length; i++) {
      _buildingLights[i].intensity = 0;
    }
    // Enemy detection halved
    for (var j = 0; j < _guards.length; j++) {
      _guards[j].alertRadius = _guards[j].alertRadius * 0.5;
    }
  }

  function _alertNearbyGuards(pos, radius, reason) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.state === 'dead') continue;
      var d = _dist2D(pos, g.pos);
      if (d <= radius) {
        if (g.state === 'sleeping') {
          g.wakeTimer = SLEEP_WAKE_TIME;
          g.state     = 'waking';
        } else if (g.state === 'patrol') {
          g.state = 'alert';
          g.detectedPlayer = false;
        }
        _alertedGuards++;
      }
    }
    if (reason === 'shot' && !_player.suppressed) {
      _noiseLevel = 2;
    }
  }

  function _callExtract() {
    _radioActive = true;
    _radioTimer  = RADIO_EXTRACT_TIME;
  }

  function _createMuzzleFlash() {
    // Quick brightness pulse on flashlight
    var origIntensity = _player.spotLight ? _player.spotLight.intensity : 0;
    if (_player.spotLight) {
      _player.spotLight.intensity = 8;
      setTimeout(function () {
        if (_player.spotLight) _player.spotLight.intensity = origIntensity;
      }, 60);
    }
  }

  function _orderSquad(command) {
    for (var i = 0; i < _squad.length; i++) {
      if (!_squad[i].alive) continue;
      _squad[i].state = command;
      if (command === 'breach1') {
        _squad[i].target = { x: -20, y: 1, z: 20 };
      } else if (command === 'perimeter') {
        _squad[i].target = i === 0
          ? { x: -WALL_HALF + 5, y: 1, z: 0 }
          : { x:  WALL_HALF - 5, y: 1, z: 0 };
      } else if (command === 'secureHVI') {
        _squad[i].target = { x: _hvi.pos.x, y: 1, z: _hvi.pos.z };
      }
    }
  }

  // ─────────────────────────────────────────────── UPDATE

  function _updatePlayer(dt) {
    if (_player.dead || _gameOver) return;

    // Movement
    var spd   = _player.speed;
    var moved = false;
    var dx    = 0;
    var dz    = 0;

    if (_keys[87] || _keys[38]) { dz -= 1; moved = true; }   // W / Up
    if (_keys[83] || _keys[40]) { dz += 1; moved = true; }   // S / Down
    if (_keys[65] || _keys[37]) { dx -= 1; moved = true; }   // A / Left
    if (_keys[68] || _keys[39]) { dx += 1; moved = true; }   // D / Right

    if (moved) {
      var cos = Math.cos(_player.yaw);
      var sin = Math.sin(_player.yaw);
      var mx  = (cos * dx - sin * dz) * spd * dt;
      var mz  = (sin * dx + cos * dz) * spd * dt;
      _player.pos.x += mx;
      _player.pos.z += mz;

      // Clamp to world bounds
      _player.pos.x = Math.max(-200, Math.min(200, _player.pos.x));
      _player.pos.z = Math.max(-200, Math.min(200, _player.pos.z));
    }

    // Camera
    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _player.yaw;
    _camera.rotation.x     = _player.pitch;

    // E hold — carry HVI or clone phone or collect doc
    if (_player.holdingE) {
      _player.holdETimer += dt;

      // Phone clone (instant tap, in HVI room)
      var phoneDist = _dist3D(_player.pos, _phone.pos);
      if (phoneDist < 2 && !_phone.cloned) {
        _phone.cloned = true;
        _player.score += 500;
        if (_phone.mesh) _phone.mesh.material.color.setHex(0x00ff88);
      }

      // Document pickup
      for (var d = 0; d < _documents.length; d++) {
        var doc = _documents[d];
        if (doc.collected) continue;
        var docDist = _dist3D(_player.pos, doc.pos);
        if (docDist < 2) {
          doc.collected = true;
          _revealedDocs++;
          _player.score += 250;
          if (doc.mesh) doc.mesh.visible = false;
          // Reveal a guard's patrol path (visual feedback via console)
        }
      }

      // HVI carry — 3 second hold on downed HVI
      if (_hvi.state === 'downed' && _player.holdETimer >= 3) {
        _player.carryingHVI = true;
        _hvi.state          = 'captured';
        _player.holdETimer  = 0;
        _player.score       += 1000;
      }
    }

    // If carrying HVI, move HVI with player
    if (_player.carryingHVI && _hvi.mesh) {
      _setPos(_hvi.mesh, _player.pos.x + 0.5, _player.pos.y - 0.9, _player.pos.z);
      _hvi.pos.x = _player.pos.x + 0.5;
      _hvi.pos.z = _player.pos.z;
    }

    // Check if at LZ
    var lzDist = _dist2D(_player.pos, { x: 0, z: LZ_Z });
    if (lzDist < 12 && (_player.carryingHVI || _hvi.dead || _hvi.state === 'captured')) {
      if (!_extracting) {
        _extracting  = true;
        _hvi.state   = 'extracted';
        _win         = true;
        _gameOver    = true;
        _gameOverMsg = 'MISSION COMPLETE\nHVI EXTRACTED\nSCORE: ' + _player.score;
        _showGameOver();
      }
    }

    // Check if at LZ when radio extract arrives
    if (_radioActive && _radioTimer <= 0 && lzDist < 12) {
      _extracting  = true;
      _win         = true;
      _gameOver    = true;
      _gameOverMsg = 'MISSION COMPLETE\nEXFIL COMPLETE\nSCORE: ' + _player.score;
      _showGameOver();
    }

    // Building 2 IED
    _checkIED();

    // Dog detection
    _updateDogs(dt);
  }

  function _checkIED() {
    var b2 = _buildings[1];
    if (!b2) return;
    var dx = Math.abs(_player.pos.x - b2.pos.x);
    var dz = Math.abs(_player.pos.z - b2.pos.z);
    if (dx < b2.w / 2 && dz < b2.d / 2) {
      if (!b2.mesh.userData.iedTriggered) {
        b2.mesh.userData.iedTriggered = true;
        _player.hp -= 40;
        _noiseLevel = 2;
        _alertNearbyGuards(_player.pos, ALERT_RANGE_UNSUP, 'explosion');
        if (_player.hp <= 0) {
          _player.dead   = true;
          _gameOver      = true;
          _gameOverMsg   = 'OPERATOR DOWN\nIED TRIGGERED\nSCORE: ' + _player.score;
          _showGameOver();
        }
      }
    }
  }

  function _updateDogs(dt) {
    for (var i = 0; i < _dogs.length; i++) {
      var dog  = _dogs[i];
      var dist = _dist2D(_player.pos, dog.pos);
      if (dist < DOG_BARK_RANGE && !dog.barked) {
        dog.barked = true;
        _noiseLevel = Math.min(2, _noiseLevel + 1);
        _alertNearbyGuards(dog.pos, 15, 'bark');
      }
    }
  }

  function _updateGuards(dt) {
    var detectR = _getDetectRange();

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.state === 'dead') continue;

      // Waking up
      if (g.state === 'waking') {
        g.wakeTimer -= dt;
        if (g.wakeTimer <= 0) {
          g.state = 'alert';
        }
        continue;
      }

      // Patrol movement
      if (g.state === 'patrol' && g.patrolPath.length > 0) {
        var target = g.patrolPath[g.patrolIndex];
        var d2     = _dist2D(g.pos, target);
        if (d2 < 1) {
          g.patrolIndex = (g.patrolIndex + 1) % g.patrolPath.length;
        } else {
          var spd  = 3 * dt;
          var dx2  = target.x - g.pos.x;
          var dz2  = target.z - g.pos.z;
          var len  = Math.sqrt(dx2 * dx2 + dz2 * dz2);
          g.pos.x += (dx2 / len) * spd;
          g.pos.z += (dz2 / len) * spd;
          if (g.mesh) _setPos(g.mesh, g.pos.x, g.pos.y, g.pos.z);
        }
      }

      // Detection check
      var distToPlayer = _dist2D(g.pos, _player.pos);
      var canDetect    = distToPlayer <= detectR;

      if (g.state === 'patrol' && canDetect) {
        g.state = 'combat';
        g.detectedPlayer = true;
        _noiseLevel      = Math.min(2, _noiseLevel + 1);
        _alertedGuards++;
      }

      // Combat — move toward player and deal damage
      if (g.state === 'combat' || g.state === 'alert') {
        if (distToPlayer > 2) {
          var spd2  = 4 * dt;
          var dx3   = _player.pos.x - g.pos.x;
          var dz3   = _player.pos.z - g.pos.z;
          var len2  = Math.sqrt(dx3 * dx3 + dz3 * dz3);
          if (len2 > 0) {
            g.pos.x += (dx3 / len2) * spd2;
            g.pos.z += (dz3 / len2) * spd2;
            if (g.mesh) _setPos(g.mesh, g.pos.x, g.pos.y, g.pos.z);
          }
        } else {
          // Attack player
          g.attackTimer = (g.attackTimer || 0) + dt;
          if (g.attackTimer >= 1.5) {
            g.attackTimer = 0;
            _player.hp   -= 15;
            if (_player.hp <= 0) {
              _player.dead   = true;
              _gameOver      = true;
              _gameOverMsg   = 'OPERATOR DOWN\nKIA\nSCORE: ' + _player.score;
              _showGameOver();
            }
          }
        }
      }
    }
  }

  function _updateSquad(dt) {
    var aliveCount = 0;
    for (var i = 0; i < _squad.length; i++) {
      var s = _squad[i];
      if (!s.alive) continue;
      aliveCount++;

      var targetPos = null;
      if (s.state === 'follow' || !s.target) {
        // Follow player with offset
        targetPos = {
          x: _player.pos.x + (i === 0 ? -1.5 : 1.5),
          y: 1,
          z: _player.pos.z + 2
        };
      } else {
        targetPos = s.target;
      }

      // Move squad member toward target
      var dx = targetPos.x - s.pos.x;
      var dz = targetPos.z - s.pos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d > 1.5) {
        var spd  = 5 * dt;
        s.pos.x += (dx / d) * spd;
        s.pos.z += (dz / d) * spd;
        if (s.mesh) _setPos(s.mesh, s.pos.x, s.pos.y, s.pos.z);
      }

      // Squad auto-engages nearby enemies
      for (var j = 0; j < _guards.length; j++) {
        var g = _guards[j];
        if (g.state === 'dead') continue;
        var sd = _dist2D(s.pos, g.pos);
        if (sd < 8) {
          s.fireTimer = (s.fireTimer || 0) + dt;
          if (s.fireTimer >= 1.2) {
            s.fireTimer = 0;
            _damageGuard(g, 30);
          }
          break;
        }
      }
    }

    // Check if all squad KIA
    if (aliveCount === 0 && _squad.length > 0) {
      // Squad down — player can still continue solo
    }
  }

  function _updateHVI(dt) {
    if (_hvi.dead || _hvi.state === 'extracted' || _hvi.state === 'downed' || _hvi.state === 'captured') return;

    _hvi.aliveTimer += dt;

    // HVI starts fleeing toward vehicle lot if alerted
    if (_noiseLevel >= 1 && _hvi.state === 'idle') {
      _hvi.state = 'fleeing';
    }

    if (_hvi.state === 'fleeing') {
      var vehicleTarget = { x: -30, z: 35 };
      var dx = vehicleTarget.x - _hvi.pos.x;
      var dz = vehicleTarget.z - _hvi.pos.z;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d > 1) {
        var spd  = 6 * dt;
        _hvi.pos.x += (dx / d) * spd;
        _hvi.pos.z += (dz / d) * spd;
        if (_hvi.mesh) _setPos(_hvi.mesh, _hvi.pos.x, _hvi.pos.y, _hvi.pos.z);
      } else {
        // HVI reached vehicle — starts escape
        _hvi.vehicleEscapeStarted = true;
      }
    }

    // Vehicle escape after 2 minutes
    if (_hvi.aliveTimer >= HVI_ESCAPE_TIME && !_hvi.vehicleEscapeStarted) {
      _hvi.state = 'fleeing';
    }

    if (_hvi.vehicleEscapeStarted) {
      // HVI escapes — game over
      _gameOver    = true;
      _win         = false;
      _gameOverMsg = 'MISSION FAILED\nHVI ESCAPED BY VEHICLE\nSCORE: ' + _player.score;
      _showGameOver();
    }
  }

  function _updateRadio(dt) {
    if (!_radioActive) return;
    _radioTimer -= dt;
    if (_radioTimer < 0) _radioTimer = 0;
  }

  function _updateHUD() {
    if (!_hudEl || !_active) return;

    var hviStatus = 'AT LARGE';
    if (_hvi.dead || _hvi.state === 'downed')  hviStatus = 'DOWNED';
    if (_hvi.state === 'captured')              hviStatus = 'CAPTURED';
    if (_hvi.state === 'extracted')             hviStatus = 'EXTRACTED';
    if (_hvi.vehicleEscapeStarted)              hviStatus = 'ESCAPING';

    var guardsAlive = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i].state !== 'dead') guardsAlive++;
    }

    var squadAlive = 0;
    for (var j = 0; j < _squad.length; j++) {
      if (_squad[j].alive) squadAlive++;
    }

    var noiseStr = 'SILENT';
    if (_noiseLevel === 1) noiseStr = 'ELEVATED';
    if (_noiseLevel === 2) noiseStr = 'COMPROMISED';

    var nvgStr     = _player.nvgOn ? 'ON' : 'OFF';
    var extractStr = _radioActive ? Math.ceil(_radioTimer) + 's' : 'STANDBY';

    var hpStr    = 'HP:' + Math.max(0, _player.hp);
    var scoreStr = 'SCR:' + _player.score;
    var docsStr  = 'DOCS:' + _revealedDocs + '/3';
    var phoneStr = _phone.cloned ? ' [INTEL:CLONED]' : '';

    _hudEl.textContent = 'NIGHT RAID [HVI:' + hviStatus + '] [GUARDS:' + guardsAlive + '] [SQUAD:' + squadAlive + '/2] [NOISE:' + noiseStr + '] | NVG:' + nvgStr + ' EXTRACT:' + extractStr + ' | ' + hpStr + ' ' + scoreStr + ' ' + docsStr + phoneStr;

    // NVG green tint overlay
    var tintEl = document.getElementById('night-raid-nvg-tint');
    if (_player.nvgOn && !tintEl) {
      tintEl = document.createElement('div');
      tintEl.id = 'night-raid-nvg-tint';
      tintEl.style.cssText = [
        'position:fixed',
        'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:rgba(0,60,0,0.18)',
        'pointer-events:none',
        'z-index:9990'
      ].join(';');
      document.body.appendChild(tintEl);
    } else if (!_player.nvgOn && tintEl) {
      tintEl.parentNode.removeChild(tintEl);
    }
  }

  function _showGameOver() {
    if (!_hudEl || !_hudEl.gameOverEl) return;
    var goEl    = _hudEl.gameOverEl;
    goEl.style.display = 'block';
    var lines   = _gameOverMsg.split('\n');
    goEl.innerHTML     = lines.join('<br>') + '<br><br><span style="font-size:14px">Press N+R to restart</span>';
    document.exitPointerLock();
  }

  function _updateNoiseDecay(dt) {
    // Noise level slowly decays
    if (_noiseLevel > 0) {
      _player._noiseDecayTimer = (_player._noiseDecayTimer || 0) + dt;
      if (_player._noiseDecayTimer > 30) {
        _player._noiseDecayTimer = 0;
        _noiseLevel = Math.max(0, _noiseLevel - 1);
      }
    }
  }

  // ─────────────────────────────────────────────── PUBLIC API

  function init(scene, camera, renderer, options) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;
    _clock    = new THREE.Clock();

    document.addEventListener('keydown',          _onKeyDown);
    document.addEventListener('keyup',            _onKeyUp);
    document.addEventListener('mousemove',        _onMouseMove);
    document.addEventListener('mousedown',        _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
  }

  function update(dt) {
    if (!_active || _gameOver) return;
    _totalTime += dt;

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateSquad(dt);
    _updateHVI(dt);
    _updateRadio(dt);
    _updateNoiseDecay(dt);
    _updateHUD();
  }

  function reset() {
    _active = false;
    if (_hudEl) _hudEl.style.display = 'none';
    var tintEl = document.getElementById('night-raid-nvg-tint');
    if (tintEl) tintEl.parentNode.removeChild(tintEl);
    _gameOver = false;
    _win      = false;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
