// midnight-coup.js — Midnight Coup FPS Module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, THREE global
//
// Activation: M + I simultaneous keypress within 400ms
//
// Public API:
//   MidnightCoup.init(scene, camera, renderer, options)
//   MidnightCoup.update(dt)
//   MidnightCoup.reset()

window.MidnightCoup = (function () {
  'use strict';

  // ─────────────────────────────────────────────── CONSTANTS

  var TOTAL_TIME          = 600;   // 10 minutes in seconds
  var NVG_BATTERY_TIME    = 180;   // 3 minutes NVG battery
  var AIRSTRIKE_INTERVAL  = 90;    // Vega calls airstrike every 90s
  var VEGA_HP             = 450;
  var BODYGUARD_HP        = 150;
  var SOLDIER_HP          = 80;
  var SNIPER_HP           = 120;
  var APC_HP              = 200;

  var DETECT_RANGE_DAY    = 20;
  var DETECT_RANGE_NIGHT  = 8;
  var DETECT_RANGE_NVG    = 14;
  var ATTACK_RANGE        = 2.5;
  var TRANSMITTER_HOLD    = 4.0;   // seconds to destroy transmitter

  var PALACE_X            = 0;
  var PALACE_Z            = -80;
  var TOWER_X             = 60;
  var TOWER_Z             = 20;

  var KEY_M = 77;
  var KEY_I = 73;
  var KEY_E = 69;
  var KEY_N = 78;
  var KEY_W = 87;
  var KEY_S = 83;
  var KEY_A = 65;
  var KEY_D = 68;

  // ─────────────────────────────────────────────── STATE

  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _active      = false;
  var _initialized = false;
  var _gameOver    = false;
  var _win         = false;
  var _gameOverMsg = '';
  var _totalTime   = TOTAL_TIME;

  // Input
  var _keys   = {};
  var _mKeyTime = 0;
  var _iKeyTime = 0;
  var _mouse  = { dx: 0, dy: 0, locked: false };

  // Player state
  var _player = {
    mesh:        null,
    hp:          100,
    pos:         { x: 0, y: 1.7, z: 120 },
    yaw:         0,
    pitch:       0,
    speed:       8,
    dead:        false,
    holdingE:    false,
    holdETimer:  0,
    nvgOn:       false,
    nvgBattery:  NVG_BATTERY_TIME,
    nvgDead:     false,
    spotLight:   null,
    flashMesh:   null
  };

  // Objectives
  var _obj = {
    transmitterDestroyed: false,   // obj 1
    radioDestroyed:       false,   // obj 2
    officersRescued:      0,       // obj 3 (need 3)
    vegaEliminated:       false    // obj 4
  };

  // Environment
  var _ambientLight    = null;
  var _nvgLight        = null;
  var _moonLight       = null;
  var _buildingLights  = [];

  // Soldiers (35 coup forces)
  var _soldiers = [];

  // Snipers (3)
  var _snipers  = [];

  // APCs (2)
  var _apcs     = [];

  // General Vega
  var _vega = {
    mesh:           null,
    hp:             VEGA_HP,
    pos:            { x: PALACE_X, y: 22, z: PALACE_Z - 2 },
    state:          'locked',   // 'locked'|'active'|'eliminated'
    airstrikeTimer: AIRSTRIKE_INTERVAL,
    airstrikeActive: false
  };

  // Bodyguards (4)
  var _bodyguards = [];

  // Transmitter on broadcast tower
  var _transmitter = {
    mesh:      null,
    hp:        80,
    pos:       { x: TOWER_X, y: 31, z: TOWER_Z },
    destroyed: false,
    holdTimer: 0
  };

  // Palace radio
  var _palaceRadio = {
    mesh:      null,
    hp:        40,
    pos:       { x: PALACE_X + 2, y: 0.5, z: PALACE_Z + 16 },
    destroyed: false
  };

  // Loyal officers in palace basement
  var _officers = [];

  // NVG crate
  var _nvgCrate = {
    mesh:     null,
    pos:      { x: 8, y: 0.5, z: 100 },
    collected: false
  };

  // Blast door to command room
  var _blastDoor = {
    mesh:   null,
    open:   false,
    pos:    { x: PALACE_X, y: 19, z: PALACE_Z - 6 }
  };

  // Flashlight beams for patrols
  var _patrolLights = [];

  // HUD
  var _hudEl = null;

  // ─────────────────────────────────────────────── HELPERS

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

  function _makeMesh(geom, color, wireframe) {
    var mat = wireframe
      ? new THREE.MeshBasicMaterial({ color: color, wireframe: true })
      : new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geom, mat);
  }

  function _setPos(mesh, x, y, z) {
    mesh.position.set(x, y, z);
  }

  function _lineseg(verts, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function _addLine(verts, color) {
    var ls = _lineseg(verts, color);
    _scene.add(ls);
    return ls;
  }

  function _fmtTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function _countObjectives() {
    var n = 0;
    if (_obj.transmitterDestroyed) n++;
    if (_obj.radioDestroyed)       n++;
    if (_obj.officersRescued >= 3) n++;
    if (_obj.vegaEliminated)       n++;
    return n;
  }

  // ─────────────────────────────────────────────── SCENE BUILD

  function _buildScene() {
    _scene.background = new THREE.Color(0x000811);
    _scene.fog = new THREE.FogExp2(0x000811, 0.008);

    // Moonlight — dim ambient PointLight
    _ambientLight = new THREE.AmbientLight(0x112233, 0.6);
    _scene.add(_ambientLight);

    _moonLight = new THREE.PointLight(0x334466, 0.8, 400);
    _moonLight.position.set(-50, 120, -50);
    _scene.add(_moonLight);

    // NVG green fill (starts off)
    _nvgLight = new THREE.PointLight(0x44FF44, 0, 300);
    _nvgLight.position.set(0, 30, 0);
    _scene.add(_nvgLight);

    _buildGround();
    _buildStreetGrid();
    _buildBuildings();
    _buildPalace();
    _buildBroadcastTower();
    _buildBarricades();
    _buildAPCs();
    _spawnSoldiers();
    _spawnSnipers();
    _spawnVega();
    _buildNVGCrate();
    _buildPlayer();
    _buildHUD();
  }

  function _buildGround() {
    var geo  = new THREE.BoxGeometry(500, 0.3, 500);
    var mesh = _makeMesh(geo, 0x1a1a1a, false);
    _setPos(mesh, 0, -0.15, 0);
    _scene.add(mesh);
  }

  function _buildStreetGrid() {
    // Main boulevard north-south
    var roadGeo = new THREE.BoxGeometry(18, 0.1, 400);
    var road    = _makeMesh(roadGeo, 0x333333, false);
    _setPos(road, 0, 0.05, 0);
    _scene.add(road);

    // Cross street east-west
    var cross = new THREE.BoxGeometry(400, 0.1, 18);
    var crossMesh = _makeMesh(cross, 0x333333, false);
    _setPos(crossMesh, 0, 0.05, 0);
    _scene.add(crossMesh);

    // Side street west of palace
    var side1 = new THREE.BoxGeometry(12, 0.1, 200);
    var sideMesh1 = _makeMesh(side1, 0x333333, false);
    _setPos(sideMesh1, -40, 0.05, -20);
    _scene.add(sideMesh1);

    // Side street east
    var side2 = new THREE.BoxGeometry(12, 0.1, 200);
    var sideMesh2 = _makeMesh(side2, 0x333333, false);
    _setPos(sideMesh2, 40, 0.05, -20);
    _scene.add(sideMesh2);

    // Road line markings using LineSegments
    _addLine([
      0, 0.2, -200, 0, 0.2, 200
    ], 0x555544);

    // Tower road east
    var towerRoad = new THREE.BoxGeometry(12, 0.1, 150);
    var towerRoadMesh = _makeMesh(towerRoad, 0x333333, false);
    _setPos(towerRoadMesh, 60, 0.05, 60);
    _scene.add(towerRoadMesh);
  }

  function _buildBuildings() {
    // City buildings flanking main boulevard
    var buildingDefs = [
      // West side
      { x: -28, z:  80, w: 18, h: 12, d: 14 },
      { x: -28, z:  50, w: 14, h:  8, d: 12 },
      { x: -28, z:  20, w: 16, h: 16, d: 14 },
      { x: -28, z: -10, w: 20, h: 10, d: 15 },
      { x: -28, z: -40, w: 15, h: 14, d: 12 },
      { x: -55, z:  60, w: 20, h: 18, d: 20 },
      { x: -55, z:  20, w: 18, h: 10, d: 16 },
      { x: -55, z: -30, w: 22, h: 20, d: 18 },
      // East side
      { x:  28, z:  80, w: 18, h:  9, d: 14 },
      { x:  28, z:  50, w: 16, h: 12, d: 13 },
      { x:  28, z:  20, w: 14, h: 18, d: 14 },
      { x:  28, z: -10, w: 18, h: 11, d: 15 },
      { x:  28, z: -40, w: 16, h: 15, d: 12 },
      { x:  55, z:  50, w: 22, h: 14, d: 20 },
      { x:  55, z:  10, w: 18, h: 22, d: 18 },
      { x:  55, z: -30, w: 20, h: 16, d: 18 }
    ];

    for (var i = 0; i < buildingDefs.length; i++) {
      var bd   = buildingDefs[i];
      var geo  = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
      var mesh = _makeMesh(geo, 0x334455, false);
      _setPos(mesh, bd.x, bd.h / 2, bd.z);
      _scene.add(mesh);

      // Dim window lights
      var bLight = new THREE.PointLight(0x443322, 0.3, 15);
      bLight.position.set(bd.x, bd.h * 0.7, bd.z);
      _scene.add(bLight);
      _buildingLights.push(bLight);
    }
  }

  function _buildPalace() {
    // Main palace body: 40×8×30
    var palaceGeo  = new THREE.BoxGeometry(40, 8, 30);
    var palaceMesh = _makeMesh(palaceGeo, 0x445566, false);
    _setPos(palaceMesh, PALACE_X, 4, PALACE_Z);
    _scene.add(palaceMesh);

    // 2nd floor
    var floor2Geo  = new THREE.BoxGeometry(36, 6, 26);
    var floor2Mesh = _makeMesh(floor2Geo, 0x445577, false);
    _setPos(floor2Mesh, PALACE_X, 11, PALACE_Z);
    _scene.add(floor2Mesh);

    // 3rd floor / command room
    var floor3Geo  = new THREE.BoxGeometry(28, 5, 20);
    var floor3Mesh = _makeMesh(floor3Geo, 0x445588, false);
    _setPos(floor3Mesh, PALACE_X, 16, PALACE_Z);
    _scene.add(floor3Mesh);

    // Blast door to command room
    var bdGeo  = new THREE.BoxGeometry(4, 3, 0.5);
    var bdMesh = _makeMesh(bdGeo, 0x223344, false);
    _setPos(bdMesh, _blastDoor.pos.x, _blastDoor.pos.y, _blastDoor.pos.z);
    _blastDoor.mesh = bdMesh;
    _scene.add(bdMesh);

    // Basement outline (visual — underground)
    var basGeo  = new THREE.BoxGeometry(38, 3, 28);
    var basMesh = _makeMesh(basGeo, 0x334455, false);
    _setPos(basMesh, PALACE_X, -1.5, PALACE_Z);
    _scene.add(basMesh);

    // Palace gate (guarded)
    var gateGeo  = new THREE.BoxGeometry(8, 4, 0.6);
    var gateMesh = _makeMesh(gateGeo, 0x223333, false);
    _setPos(gateMesh, PALACE_X, 2, PALACE_Z + 15.3);
    gateMesh.userData.isPalaceGate = true;
    gateMesh.userData.hp           = 60;
    _scene.add(gateMesh);

    // Gate pillars
    var pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 5, 8);
    var p1 = _makeMesh(pillarGeo, 0x445566, false);
    _setPos(p1, PALACE_X - 5, 2.5, PALACE_Z + 15);
    _scene.add(p1);
    var p2 = _makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 5, 8), 0x445566, false);
    _setPos(p2, PALACE_X + 5, 2.5, PALACE_Z + 15);
    _scene.add(p2);

    // Palace radio/antenna at base
    var antennaGeo  = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
    var antennaMesh = _makeMesh(antennaGeo, 0x667788, false);
    _setPos(antennaMesh, PALACE_X + 2, 11, PALACE_Z - 16);
    _scene.add(antennaMesh);

    // Palace radio (shootable)
    var radioGeo  = new THREE.BoxGeometry(0.8, 0.5, 0.6);
    var radioMesh = _makeMesh(radioGeo, 0x445566, false);
    _setPos(radioMesh, _palaceRadio.pos.x, _palaceRadio.pos.y, _palaceRadio.pos.z);
    radioMesh.userData.isPalaceRadio = true;
    _palaceRadio.mesh = radioMesh;
    _scene.add(radioMesh);

    // Loyal officers in basement (3)
    var officerPositions = [
      { x: PALACE_X - 12, y: -1.5, z: PALACE_Z - 8 },
      { x: PALACE_X,      y: -1.5, z: PALACE_Z - 8 },
      { x: PALACE_X + 12, y: -1.5, z: PALACE_Z - 8 }
    ];
    for (var i = 0; i < officerPositions.length; i++) {
      var op  = officerPositions[i];
      var oGeo  = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var oMesh = _makeMesh(oGeo, 0x4455aa, false);
      _setPos(oMesh, op.x, op.y, op.z);
      _scene.add(oMesh);
      _officers.push({
        mesh:    oMesh,
        pos:     { x: op.x, y: op.y, z: op.z },
        rescued: false,
        index:   i
      });
    }

    // Palace interior lights
    var pLight1 = new THREE.PointLight(0x334455, 0.5, 30);
    pLight1.position.set(PALACE_X, 8, PALACE_Z);
    _scene.add(pLight1);
    _buildingLights.push(pLight1);

    var pLight2 = new THREE.PointLight(0x445566, 0.4, 20);
    pLight2.position.set(PALACE_X, 18, PALACE_Z);
    _scene.add(pLight2);
    _buildingLights.push(pLight2);
  }

  function _buildBroadcastTower() {
    // Main tower cylinder: r=2 h=30
    var towerGeo  = new THREE.CylinderGeometry(2, 2.5, 30, 10);
    var towerMesh = _makeMesh(towerGeo, 0x445577, false);
    _setPos(towerMesh, TOWER_X, 15, TOWER_Z);
    _scene.add(towerMesh);

    // Tower base building
    var baseGeo  = new THREE.BoxGeometry(14, 5, 14);
    var baseMesh = _makeMesh(baseGeo, 0x334455, false);
    _setPos(baseMesh, TOWER_X, 2.5, TOWER_Z);
    _scene.add(baseMesh);

    // Dish (partial SphereGeometry) on top
    var dishGeo  = new THREE.SphereGeometry(3, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var dishMesh = _makeMesh(dishGeo, 0x556677, false);
    dishMesh.rotation.x = Math.PI;
    _setPos(dishMesh, TOWER_X, 31.5, TOWER_Z);
    _scene.add(dishMesh);

    // Transmitter box (E-hold 4s to destroy)
    var txGeo  = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var txMesh = _makeMesh(txGeo, 0x889900, false);
    _setPos(txMesh, TOWER_X, 31, TOWER_Z);
    txMesh.userData.isTransmitter = true;
    _transmitter.mesh = txMesh;
    _scene.add(txMesh);

    // Tower brace lines
    _addLine([
      TOWER_X - 2, 0, TOWER_Z - 2,
      TOWER_X, 30, TOWER_Z,
      TOWER_X + 2, 0, TOWER_Z + 2,
      TOWER_X, 30, TOWER_Z,
      TOWER_X - 2, 0, TOWER_Z + 2,
      TOWER_X, 30, TOWER_Z,
      TOWER_X + 2, 0, TOWER_Z - 2,
      TOWER_X, 30, TOWER_Z
    ], 0x445566);

    // Tower red warning light
    var wLight = new THREE.PointLight(0xFF2200, 1.5, 15);
    wLight.position.set(TOWER_X, 32, TOWER_Z);
    _scene.add(wLight);
  }

  function _buildBarricades() {
    // Checkpoint barricades on main boulevard
    var barricadeDefs = [
      // North checkpoint approaching from start
      { x: -4, z: 60 }, { x: 4, z: 60 }, { x: 0, z: 62 },
      // Mid-city checkpoint
      { x: -4, z: 10 }, { x: 4, z: 10 },
      // Palace approach
      { x: -5, z: -50 }, { x: 5, z: -50 }, { x: 0, z: -48 },
      // Tower approach
      { x: 50, z: 30 }, { x: 50, z: 22 }
    ];

    for (var i = 0; i < barricadeDefs.length; i++) {
      var bd  = barricadeDefs[i];
      var geo = new THREE.BoxGeometry(3, 1.2, 0.8);
      var mesh = _makeMesh(geo, 0x445544, false);
      _setPos(mesh, bd.x, 0.6, bd.z);
      _scene.add(mesh);

      // Sandbag stack (small boxes)
      for (var s = 0; s < 2; s++) {
        var sbGeo  = new THREE.BoxGeometry(1.2, 0.6, 0.7);
        var sbMesh = _makeMesh(sbGeo, 0x665533, false);
        _setPos(sbMesh, bd.x + (s === 0 ? -0.8 : 0.8), 1.5, bd.z);
        _scene.add(sbMesh);
      }
    }
  }

  function _buildAPCs() {
    var apcPositions = [
      { x: -3, z: 30 },
      { x:  3, z: 30 }
    ];

    for (var i = 0; i < apcPositions.length; i++) {
      var ap = apcPositions[i];

      // APC body
      var bodyGeo  = new THREE.BoxGeometry(4, 2.5, 8);
      var bodyMesh = _makeMesh(bodyGeo, 0x334433, false);
      _setPos(bodyMesh, ap.x, 1.25, ap.z);
      _scene.add(bodyMesh);

      // Turret
      var turretGeo  = new THREE.BoxGeometry(2, 1, 2);
      var turretMesh = _makeMesh(turretGeo, 0x334433, false);
      _setPos(turretMesh, ap.x, 3, ap.z - 1);
      _scene.add(turretMesh);

      // Gun barrel (CylinderGeometry)
      var barrelGeo  = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
      var barrelMesh = _makeMesh(barrelGeo, 0x223322, false);
      barrelMesh.rotation.z = Math.PI / 2;
      _setPos(barrelMesh, ap.x - 1.5, 3, ap.z - 1);
      _scene.add(barrelMesh);

      // Wheels (flat boxes)
      for (var w = 0; w < 4; w++) {
        var wx   = ap.x + (w < 2 ? -2.1 : 2.1);
        var wz   = ap.z + (w % 2 === 0 ? -2.5 : 2.5);
        var wGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8);
        var wMesh = _makeMesh(wGeo, 0x222222, false);
        wMesh.rotation.z = Math.PI / 2;
        _setPos(wMesh, wx, 0.8, wz);
        _scene.add(wMesh);
      }

      _apcs.push({
        body:     bodyMesh,
        turret:   turretMesh,
        barrel:   barrelMesh,
        pos:      { x: ap.x, y: 1.25, z: ap.z },
        hp:       APC_HP,
        alive:    true,
        fireTimer: 0,
        index:    i
      });
    }
  }

  function _spawnSoldiers() {
    // 35 coup soldiers patrolling — BoxGeometry 0x334433, 80HP
    var soldierDefs = [
      // Boulevard patrols (10 soldiers)
      { x:  0, y: 1, z:  70, path: [{ x: 0, z: 70 }, { x: 0, z: 40 }] },
      { x:  2, y: 1, z:  65, path: [{ x: 2, z: 65 }, { x: -2, z: 45 }] },
      { x:  0, y: 1, z:  45, path: [{ x: 0, z: 45 }, { x: 0, z: 20 }] },
      { x: -2, y: 1, z:  35, path: [{ x: -2, z: 35 }, { x: 2, z: 15 }] },
      { x:  0, y: 1, z:  15, path: [{ x: 0, z: 15 }, { x: 0, z: -10 }] },
      { x:  2, y: 1, z:   5, path: [{ x: 2, z: 5 }, { x: -2, z: -15 }] },
      { x:  0, y: 1, z: -15, path: [{ x: 0, z: -15 }, { x: 0, z: -40 }] },
      { x: -2, y: 1, z: -25, path: [{ x: -2, z: -25 }, { x: 2, z: -45 }] },
      { x:  0, y: 1, z: -45, path: [{ x: 0, z: -45 }, { x: 0, z: -65 }] },
      { x:  2, y: 1, z: -55, path: [{ x: 2, z: -55 }, { x: -2, z: -70 }] },
      // Palace grounds (12 soldiers)
      { x: PALACE_X - 18, y: 1, z: PALACE_Z + 20, path: [{ x: PALACE_X - 18, z: PALACE_Z + 20 }, { x: PALACE_X - 18, z: PALACE_Z - 20 }] },
      { x: PALACE_X + 18, y: 1, z: PALACE_Z + 20, path: [{ x: PALACE_X + 18, z: PALACE_Z + 20 }, { x: PALACE_X + 18, z: PALACE_Z - 20 }] },
      { x: PALACE_X - 10, y: 1, z: PALACE_Z + 18, path: [{ x: PALACE_X - 10, z: PALACE_Z + 18 }, { x: PALACE_X + 10, z: PALACE_Z + 18 }] },
      { x: PALACE_X + 10, y: 1, z: PALACE_Z + 18, path: [{ x: PALACE_X + 10, z: PALACE_Z + 18 }, { x: PALACE_X - 10, z: PALACE_Z + 18 }] },
      { x: PALACE_X - 15, y: 1, z: PALACE_Z - 18, path: [{ x: PALACE_X - 15, z: PALACE_Z - 18 }, { x: PALACE_X + 15, z: PALACE_Z - 18 }] },
      { x: PALACE_X + 15, y: 1, z: PALACE_Z - 18, path: [{ x: PALACE_X + 15, z: PALACE_Z - 18 }, { x: PALACE_X - 15, z: PALACE_Z - 18 }] },
      { x: PALACE_X - 22, y: 1, z: PALACE_Z,      path: [{ x: PALACE_X - 22, z: PALACE_Z - 15 }, { x: PALACE_X - 22, z: PALACE_Z + 15 }] },
      { x: PALACE_X + 22, y: 1, z: PALACE_Z,      path: [{ x: PALACE_X + 22, z: PALACE_Z - 15 }, { x: PALACE_X + 22, z: PALACE_Z + 15 }] },
      { x: PALACE_X - 5,  y: 1, z: PALACE_Z + 12, path: [{ x: PALACE_X - 5, z: PALACE_Z + 12 }, { x: PALACE_X + 5, z: PALACE_Z + 12 }] },
      { x: PALACE_X + 5,  y: 1, z: PALACE_Z - 12, path: [{ x: PALACE_X + 5, z: PALACE_Z - 12 }, { x: PALACE_X - 5, z: PALACE_Z - 12 }] },
      { x: PALACE_X,      y: 7, z: PALACE_Z,       path: [{ x: PALACE_X - 8, z: PALACE_Z }, { x: PALACE_X + 8, z: PALACE_Z }] },
      { x: PALACE_X,      y: 13, z: PALACE_Z - 2,  path: [{ x: PALACE_X - 5, z: PALACE_Z - 2 }, { x: PALACE_X + 5, z: PALACE_Z - 2 }] },
      // Tower area (8 soldiers)
      { x: TOWER_X - 8,  y: 1, z: TOWER_Z + 10, path: [{ x: TOWER_X - 8, z: TOWER_Z + 10 }, { x: TOWER_X - 8, z: TOWER_Z - 10 }] },
      { x: TOWER_X + 8,  y: 1, z: TOWER_Z + 10, path: [{ x: TOWER_X + 8, z: TOWER_Z + 10 }, { x: TOWER_X + 8, z: TOWER_Z - 10 }] },
      { x: TOWER_X,      y: 1, z: TOWER_Z + 12, path: [{ x: TOWER_X - 6, z: TOWER_Z + 12 }, { x: TOWER_X + 6, z: TOWER_Z + 12 }] },
      { x: TOWER_X,      y: 1, z: TOWER_Z - 12, path: [{ x: TOWER_X - 6, z: TOWER_Z - 12 }, { x: TOWER_X + 6, z: TOWER_Z - 12 }] },
      { x: TOWER_X - 5,  y: 1, z: TOWER_Z,      path: [{ x: TOWER_X - 5, z: TOWER_Z - 8 }, { x: TOWER_X - 5, z: TOWER_Z + 8 }] },
      { x: TOWER_X + 5,  y: 1, z: TOWER_Z,      path: [{ x: TOWER_X + 5, z: TOWER_Z - 8 }, { x: TOWER_X + 5, z: TOWER_Z + 8 }] },
      { x: TOWER_X - 3,  y: 5, z: TOWER_Z - 3,  path: [{ x: TOWER_X - 3, z: TOWER_Z - 3 }, { x: TOWER_X + 3, z: TOWER_Z - 3 }] },
      { x: TOWER_X + 3,  y: 5, z: TOWER_Z + 3,  path: [{ x: TOWER_X + 3, z: TOWER_Z + 3 }, { x: TOWER_X - 3, z: TOWER_Z + 3 }] },
      // City stragglers (5 soldiers)
      { x: -40, y: 1, z:  50, path: [{ x: -40, z: 50 }, { x: -40, z: 20 }] },
      { x:  40, y: 1, z:  50, path: [{ x: 40, z: 50 }, { x: 40, z: 20 }] },
      { x: -40, y: 1, z: -30, path: [{ x: -40, z: -30 }, { x: -40, z: -60 }] },
      { x:  40, y: 1, z: -30, path: [{ x: 40, z: -30 }, { x: 40, z: -60 }] },
      { x:   0, y: 1, z: -70, path: [{ x: -10, z: -70 }, { x: 10, z: -70 }] }
    ];

    for (var i = 0; i < soldierDefs.length; i++) {
      var sd   = soldierDefs[i];
      var geo  = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var mesh = _makeMesh(geo, 0x334433, false);
      _setPos(mesh, sd.x, sd.y, sd.z);
      _scene.add(mesh);

      // Patrol flashlight (PointLight white)
      var pLight = new THREE.PointLight(0xFFFFCC, 0.8, 12);
      pLight.position.set(sd.x, sd.y + 0.5, sd.z);
      _scene.add(pLight);
      _patrolLights.push({ light: pLight, soldierIndex: i });

      _soldiers.push({
        mesh:        mesh,
        light:       pLight,
        pos:         { x: sd.x, y: sd.y, z: sd.z },
        hp:          SOLDIER_HP,
        maxHp:       SOLDIER_HP,
        state:       'patrol',   // 'patrol'|'alert'|'combat'|'dead'
        patrolIndex: 0,
        patrolPath:  sd.path,
        fireTimer:   0,
        index:       i,
        glowing:     false
      });
    }
  }

  function _spawnSnipers() {
    // 3 elevated sniper nests
    var snipDefs = [
      { x: -55, platformY: 20, z:  20 },
      { x:  55, platformY: 22, z: -30 },
      { x:   0, platformY: 16, z: -90 }
    ];

    for (var i = 0; i < snipDefs.length; i++) {
      var sd = snipDefs[i];

      // Platform (BoxGeometry)
      var platGeo  = new THREE.BoxGeometry(5, 0.5, 5);
      var platMesh = _makeMesh(platGeo, 0x445544, false);
      _setPos(platMesh, sd.x, sd.platformY, sd.z);
      _scene.add(platMesh);

      // Platform support post
      var postGeo  = new THREE.CylinderGeometry(0.3, 0.3, sd.platformY, 6);
      var postMesh = _makeMesh(postGeo, 0x334433, false);
      _setPos(postMesh, sd.x, sd.platformY / 2, sd.z);
      _scene.add(postMesh);

      // Sandbag wall on platform
      var sbGeo  = new THREE.BoxGeometry(4, 0.8, 0.6);
      var sbMesh = _makeMesh(sbGeo, 0x665533, false);
      _setPos(sbMesh, sd.x, sd.platformY + 0.65, sd.z - 2);
      _scene.add(sbMesh);

      // Sniper figure
      var sGeo  = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var sMesh = _makeMesh(sGeo, 0x334433, false);
      _setPos(sMesh, sd.x, sd.platformY + 1.15, sd.z);
      _scene.add(sMesh);

      // Sniper spotlight (looks down the boulevard)
      var snipLight = new THREE.PointLight(0xFFFFAA, 1.2, 25);
      snipLight.position.set(sd.x, sd.platformY + 2, sd.z);
      _scene.add(snipLight);

      _snipers.push({
        mesh:      sMesh,
        light:     snipLight,
        platMesh:  platMesh,
        pos:       { x: sd.x, y: sd.platformY + 1.15, z: sd.z },
        hp:        SNIPER_HP,
        state:     'active',   // 'active'|'dead'
        fireTimer: 0,
        index:     i
      });
    }
  }

  function _spawnVega() {
    // General Vega in palace command room (3rd floor)
    var geo  = new THREE.BoxGeometry(0.9, 1.9, 0.6);
    var mesh = _makeMesh(geo, 0x443322, false);
    _setPos(mesh, _vega.pos.x, _vega.pos.y, _vega.pos.z);
    _vega.mesh = mesh;
    _scene.add(mesh);

    // Rank insignia (CylinderGeometry on shoulders)
    var insigGeo  = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 6);
    var insig1    = _makeMesh(insigGeo, 0xCCA820, false);
    _setPos(insig1, _vega.pos.x - 0.5, _vega.pos.y + 0.7, _vega.pos.z);
    _scene.add(insig1);
    var insig2 = _makeMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 6), 0xCCA820, false);
    _setPos(insig2, _vega.pos.x + 0.5, _vega.pos.y + 0.7, _vega.pos.z);
    _scene.add(insig2);

    // Vega command light (red)
    var cmdLight = new THREE.PointLight(0xFF2200, 0.6, 10);
    cmdLight.position.set(_vega.pos.x, _vega.pos.y + 2, _vega.pos.z);
    _scene.add(cmdLight);
    _vega.cmdLight = cmdLight;

    // 4 Elite bodyguards around Vega
    var bgOffsets = [
      { dx: -2, dz:  1.5 },
      { dx:  2, dz:  1.5 },
      { dx: -2, dz: -1.5 },
      { dx:  2, dz: -1.5 }
    ];
    for (var i = 0; i < bgOffsets.length; i++) {
      var off  = bgOffsets[i];
      var bgGeo  = new THREE.BoxGeometry(0.8, 1.9, 0.55);
      var bgMesh = _makeMesh(bgGeo, 0x443311, false);
      _setPos(bgMesh, _vega.pos.x + off.dx, _vega.pos.y, _vega.pos.z + off.dz);
      _scene.add(bgMesh);

      // Body armor plates
      var armorGeo  = new THREE.BoxGeometry(0.75, 0.8, 0.15);
      var armorMesh = _makeMesh(armorGeo, 0x223322, false);
      _setPos(armorMesh, _vega.pos.x + off.dx, _vega.pos.y + 0.1, _vega.pos.z + off.dz - 0.35);
      _scene.add(armorMesh);

      _bodyguards.push({
        mesh:      bgMesh,
        armorMesh: armorMesh,
        pos:       { x: _vega.pos.x + off.dx, y: _vega.pos.y, z: _vega.pos.z + off.dz },
        hp:        BODYGUARD_HP,
        state:     'guard',   // 'guard'|'combat'|'dead'
        fireTimer: 0,
        index:     i
      });
    }
  }

  function _buildNVGCrate() {
    // NVG crate near player start
    var geo  = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var mesh = _makeMesh(geo, 0x445533, false);
    _setPos(mesh, _nvgCrate.pos.x, _nvgCrate.pos.y, _nvgCrate.pos.z);
    mesh.userData.isNVGCrate = true;
    _nvgCrate.mesh = mesh;
    _scene.add(mesh);

    // Label lines
    _addLine([
      _nvgCrate.pos.x - 0.6, 0.9, _nvgCrate.pos.z,
      _nvgCrate.pos.x + 0.6, 0.9, _nvgCrate.pos.z
    ], 0x44FF44);

    // Small crate highlight light
    var crateLight = new THREE.PointLight(0x44FF44, 0.6, 5);
    crateLight.position.set(_nvgCrate.pos.x, 2, _nvgCrate.pos.z);
    _scene.add(crateLight);
  }

  function _buildPlayer() {
    var geo  = new THREE.BoxGeometry(0.6, 1.8, 0.3);
    var mesh = _makeMesh(geo, 0x223322, false);
    _setPos(mesh, _player.pos.x, _player.pos.y - 0.9, _player.pos.z);
    mesh.visible  = false;
    _player.mesh  = mesh;
    _scene.add(mesh);

    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.set(0, Math.PI, 0);

    // NVG headlamp (BoxGeometry visual + PointLight)
    var lampGeo  = new THREE.BoxGeometry(0.15, 0.08, 0.2);
    var lampMesh = _makeMesh(lampGeo, 0x88CC88, false);
    lampMesh.position.set(0, 0.05, -0.3);
    _camera.add(lampMesh);
    _player.flashMesh = lampMesh;
    lampMesh.visible  = false;

    // NVG headlamp point light
    var nvgHeadLight = new THREE.PointLight(0x44FF44, 0, 18);
    nvgHeadLight.position.set(0, 0, -1);
    _camera.add(nvgHeadLight);
    _player.nvgHeadLight = nvgHeadLight;

    // Standard flashlight spot
    var spotLight = new THREE.PointLight(0xFFFFCC, 1.5, 22);
    spotLight.position.set(0, 0, -1);
    _camera.add(spotLight);
    _player.spotLight = spotLight;
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'midnight-coup-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.82)',
      'color:#88CCFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #334466',
      'border-radius:3px',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Crosshair
    var xhEl = document.createElement('div');
    xhEl.id  = 'midnight-coup-xh';
    xhEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:10px',
      'height:10px',
      'border:1px solid rgba(136,204,255,0.7)',
      'border-radius:50%',
      'z-index:9999',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(xhEl);
    _hudEl.xhEl = xhEl;

    // Game over overlay
    var goEl = document.createElement('div');
    goEl.id  = 'midnight-coup-go';
    goEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#88CCFF',
      'font-family:monospace',
      'font-size:22px',
      'padding:30px 55px',
      'border:2px solid #334466',
      'border-radius:6px',
      'z-index:10000',
      'display:none',
      'text-align:center',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(goEl);
    _hudEl.goEl = goEl;

    // Objective flash message
    var msgEl = document.createElement('div');
    msgEl.id  = 'midnight-coup-msg';
    msgEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.75)',
      'color:#AAFFCC',
      'font-family:monospace',
      'font-size:14px',
      'padding:5px 18px',
      'border:1px solid #334466',
      'border-radius:3px',
      'z-index:9999',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(msgEl);
    _hudEl.msgEl    = msgEl;
    _hudEl.msgTimer = 0;

    // Hold progress bar
    var holdEl = document.createElement('div');
    holdEl.id  = 'midnight-coup-hold';
    holdEl.style.cssText = [
      'position:fixed',
      'bottom:90px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:200px',
      'height:8px',
      'background:#112233',
      'border:1px solid #334466',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'display:none'
    ].join(';');
    var holdBarEl = document.createElement('div');
    holdBarEl.style.cssText = 'width:0%;height:100%;background:#44AAFF;border-radius:4px;';
    holdEl.appendChild(holdBarEl);
    document.body.appendChild(holdEl);
    _hudEl.holdEl    = holdEl;
    _hudEl.holdBarEl = holdBarEl;
  }

  // ─────────────────────────────────────────────── INPUT

  function _onKeyDown(e) {
    _keys[e.keyCode] = true;

    if (!_active) {
      _checkActivation(e.keyCode);
      return;
    }

    if (e.keyCode === KEY_N) {
      _toggleNVG();
    }

    if (e.keyCode === KEY_E) {
      _player.holdingE = true;
    }
  }

  function _onKeyUp(e) {
    _keys[e.keyCode] = false;
    if (e.keyCode === KEY_E) {
      _player.holdingE   = false;
      _player.holdETimer = 0;
      _transmitter.holdTimer = 0;
      if (_hudEl && _hudEl.holdEl) _hudEl.holdEl.style.display = 'none';
    }
  }

  function _onMouseMove(e) {
    if (!_active || !_mouse.locked) return;
    var sens = 0.002;
    _player.yaw   -= e.movementX * sens;
    _player.pitch -= e.movementY * sens;
    _player.pitch  = Math.max(-1.2, Math.min(1.2, _player.pitch));
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _shoot();
    if (!_mouse.locked) document.body.requestPointerLock();
  }

  function _onPointerLockChange() {
    _mouse.locked = (document.pointerLockElement === document.body);
  }

  function _checkActivation(keyCode) {
    var now = Date.now();
    if (keyCode === KEY_M) { _mKeyTime = now; }
    if (keyCode === KEY_I) { _iKeyTime = now; }
    if (Math.abs(_mKeyTime - _iKeyTime) < 400 && _mKeyTime > 0 && _iKeyTime > 0) {
      _mKeyTime = 0;
      _iKeyTime = 0;
      _startGame();
    }
  }

  // ─────────────────────────────────────────────── GAME START / RESET

  function _startGame() {
    if (!_initialized) {
      _buildScene();
      _initialized = true;
    } else {
      _resetGameState();
    }
    _active      = true;
    _gameOver    = false;
    _win         = false;
    _gameOverMsg = '';
    _totalTime   = TOTAL_TIME;
    if (_hudEl) {
      _hudEl.style.display = 'block';
      if (_hudEl.xhEl) _hudEl.xhEl.style.display = 'block';
      if (_hudEl.goEl) _hudEl.goEl.style.display = 'none';
    }
    document.body.requestPointerLock();
  }

  function _resetGameState() {
    _player.pos       = { x: 0, y: 1.7, z: 120 };
    _player.hp        = 100;
    _player.dead      = false;
    _player.nvgOn     = false;
    _player.nvgBattery = NVG_BATTERY_TIME;
    _player.nvgDead   = false;
    _player.holdETimer = 0;
    _player.holdingE  = false;

    _obj.transmitterDestroyed = false;
    _obj.radioDestroyed       = false;
    _obj.officersRescued      = 0;
    _obj.vegaEliminated       = false;

    _totalTime = TOTAL_TIME;

    // Reset transmitter
    _transmitter.hp        = 80;
    _transmitter.destroyed = false;
    _transmitter.holdTimer = 0;
    if (_transmitter.mesh) {
      _transmitter.mesh.visible = true;
      _transmitter.mesh.material.color.setHex(0x889900);
    }

    // Reset palace radio
    _palaceRadio.hp        = 40;
    _palaceRadio.destroyed = false;
    if (_palaceRadio.mesh) {
      _palaceRadio.mesh.visible = true;
      _palaceRadio.mesh.material.color.setHex(0x445566);
    }

    // Reset officers
    for (var i = 0; i < _officers.length; i++) {
      _officers[i].rescued = false;
      if (_officers[i].mesh) _officers[i].mesh.visible = true;
    }

    // Reset NVG crate
    _nvgCrate.collected = false;
    if (_nvgCrate.mesh) _nvgCrate.mesh.visible = true;

    // Reset soldiers
    for (var j = 0; j < _soldiers.length; j++) {
      var sol = _soldiers[j];
      sol.hp       = SOLDIER_HP;
      sol.state    = 'patrol';
      sol.fireTimer = 0;
      sol.patrolIndex = 0;
      if (sol.mesh) {
        sol.mesh.visible = true;
        sol.mesh.material.color.setHex(0x334433);
      }
      if (sol.light) sol.light.intensity = 0.8;
    }

    // Reset snipers
    for (var k = 0; k < _snipers.length; k++) {
      _snipers[k].hp    = SNIPER_HP;
      _snipers[k].state = 'active';
      _snipers[k].fireTimer = 0;
      if (_snipers[k].mesh) _snipers[k].mesh.visible = true;
      if (_snipers[k].light) _snipers[k].light.intensity = 1.2;
    }

    // Reset APCs
    for (var l = 0; l < _apcs.length; l++) {
      _apcs[l].hp    = APC_HP;
      _apcs[l].alive = true;
      _apcs[l].fireTimer = 0;
      if (_apcs[l].body) _apcs[l].body.material.color.setHex(0x334433);
    }

    // Reset Vega
    _vega.hp             = VEGA_HP;
    _vega.state          = 'locked';
    _vega.airstrikeTimer = AIRSTRIKE_INTERVAL;
    _vega.airstrikeActive = false;
    if (_vega.mesh) {
      _vega.mesh.visible = true;
      _vega.mesh.material.color.setHex(0x443322);
    }

    // Reset bodyguards
    for (var m = 0; m < _bodyguards.length; m++) {
      _bodyguards[m].hp    = BODYGUARD_HP;
      _bodyguards[m].state = 'guard';
      _bodyguards[m].fireTimer = 0;
      if (_bodyguards[m].mesh) {
        _bodyguards[m].mesh.visible = true;
        _bodyguards[m].mesh.material.color.setHex(0x443311);
      }
    }

    // Reset blast door
    _blastDoor.open = false;
    if (_blastDoor.mesh) _blastDoor.mesh.visible = true;

    // Reset lights
    if (_nvgLight) _nvgLight.intensity = 0;
    if (_ambientLight) {
      _ambientLight.color.setHex(0x112233);
      _ambientLight.intensity = 0.6;
    }
    if (_player.nvgHeadLight) _player.nvgHeadLight.intensity = 0;
    if (_player.flashMesh) _player.flashMesh.visible = false;
  }

  // ─────────────────────────────────────────────── MECHANICS

  function _toggleNVG() {
    if (_player.nvgDead) {
      _showMsg('NVG BATTERY DEAD');
      return;
    }
    _player.nvgOn = !_player.nvgOn;
    if (_player.nvgOn) {
      _nvgLight.intensity            = 1.2;
      _ambientLight.color.setHex(0x224422);
      _ambientLight.intensity        = 1.0;
      _scene.background              = new THREE.Color(0x001100);
      if (_player.nvgHeadLight) _player.nvgHeadLight.intensity = 2.5;
      if (_player.flashMesh) _player.flashMesh.visible = true;
      if (_player.spotLight) _player.spotLight.intensity = 0;
      // Enemies glow brighter under NVG
      for (var i = 0; i < _soldiers.length; i++) {
        if (_soldiers[i].state !== 'dead' && _soldiers[i].light) {
          _soldiers[i].light.intensity = 2.2;
          _soldiers[i].glowing = true;
        }
      }
    } else {
      _nvgLight.intensity            = 0;
      _ambientLight.color.setHex(0x112233);
      _ambientLight.intensity        = 0.6;
      _scene.background              = new THREE.Color(0x000811);
      if (_player.nvgHeadLight) _player.nvgHeadLight.intensity = 0;
      if (_player.flashMesh) _player.flashMesh.visible = false;
      if (_player.spotLight) _player.spotLight.intensity = 1.5;
      for (var j = 0; j < _soldiers.length; j++) {
        if (_soldiers[j].state !== 'dead' && _soldiers[j].light) {
          _soldiers[j].light.intensity = 0.8;
          _soldiers[j].glowing = false;
        }
      }
    }
  }

  function _shoot() {
    if (!_active || _gameOver || _player.dead) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    var ray = new THREE.Raycaster(_camera.position.clone(), dir, 0, 80);

    var targets = [];
    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].state !== 'dead' && _soldiers[i].mesh) targets.push(_soldiers[i].mesh);
    }
    for (var j = 0; j < _snipers.length; j++) {
      if (_snipers[j].state === 'active' && _snipers[j].mesh) targets.push(_snipers[j].mesh);
    }
    for (var k = 0; k < _bodyguards.length; k++) {
      if (_bodyguards[k].state !== 'dead' && _bodyguards[k].mesh) targets.push(_bodyguards[k].mesh);
    }
    if (_vega.mesh && _vega.state === 'active') targets.push(_vega.mesh);
    if (_palaceRadio.mesh && !_palaceRadio.destroyed) targets.push(_palaceRadio.mesh);
    for (var l = 0; l < _apcs.length; l++) {
      if (_apcs[l].alive && _apcs[l].body) targets.push(_apcs[l].body);
    }

    var hits = ray.intersectObjects(targets);
    if (hits.length > 0) {
      _processHit(hits[0].object);
    }

    // Muzzle flash
    if (_player.spotLight) {
      var orig = _player.spotLight.intensity;
      _player.spotLight.intensity = 6;
      setTimeout(function () { if (_player.spotLight) _player.spotLight.intensity = orig; }, 60);
    }
  }

  function _processHit(obj) {
    // Check soldiers
    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].mesh === obj) {
        _damageSoldier(_soldiers[i], 35);
        return;
      }
    }
    // Check snipers
    for (var j = 0; j < _snipers.length; j++) {
      if (_snipers[j].mesh === obj) {
        _damageSniper(_snipers[j], 40);
        return;
      }
    }
    // Check bodyguards
    for (var k = 0; k < _bodyguards.length; k++) {
      if (_bodyguards[k].mesh === obj) {
        _damageBodyguard(_bodyguards[k], 30);
        return;
      }
    }
    // Check Vega
    if (_vega.mesh === obj) {
      _damageVega(40);
      return;
    }
    // Check palace radio
    if (_palaceRadio.mesh === obj) {
      _destroyPalaceRadio();
      return;
    }
    // Check APCs
    for (var l = 0; l < _apcs.length; l++) {
      if (_apcs[l].body === obj) {
        _damageAPC(_apcs[l], 50);
        return;
      }
    }
  }

  function _damageSoldier(sol, dmg) {
    if (sol.state === 'dead') return;
    sol.hp -= dmg;
    if (sol.hp <= 0) {
      sol.state = 'dead';
      if (sol.mesh) {
        sol.mesh.material.color.setHex(0x111111);
        sol.mesh.position.y = 0.1;
      }
      if (sol.light) sol.light.intensity = 0;
    } else {
      sol.state = 'combat';
    }
  }

  function _damageSniper(sniper, dmg) {
    if (sniper.state === 'dead') return;
    sniper.hp -= dmg;
    if (sniper.hp <= 0) {
      sniper.state = 'dead';
      if (sniper.mesh) {
        sniper.mesh.material.color.setHex(0x111111);
        sniper.mesh.position.y -= 0.8;
      }
      if (sniper.light) sniper.light.intensity = 0;
    }
  }

  function _damageBodyguard(bg, dmg) {
    if (bg.state === 'dead') return;
    bg.hp -= dmg;
    if (bg.hp <= 0) {
      bg.state = 'dead';
      if (bg.mesh) {
        bg.mesh.material.color.setHex(0x111111);
        bg.mesh.position.y -= 0.5;
      }
      if (bg.armorMesh) bg.armorMesh.visible = false;
    } else {
      bg.state = 'combat';
    }
  }

  function _damageVega(dmg) {
    if (_vega.state !== 'active') {
      _showMsg('BLAST DOOR LOCKED - Destroy transmitter first');
      return;
    }
    _vega.hp -= dmg;
    if (_vega.hp <= 0) {
      _vega.state = 'eliminated';
      if (_vega.mesh) {
        _vega.mesh.material.color.setHex(0x221100);
        _vega.mesh.position.y -= 0.5;
      }
      if (_vega.cmdLight) _vega.cmdLight.color.setHex(0x002200);
      _obj.vegaEliminated = true;
      _showMsg('GENERAL VEGA ELIMINATED');
      _checkWin();
    }
  }

  function _damageAPC(apc, dmg) {
    if (!apc.alive) return;
    apc.hp -= dmg;
    if (apc.hp <= 0) {
      apc.alive = false;
      if (apc.body)   apc.body.material.color.setHex(0x221100);
      if (apc.turret) apc.turret.material.color.setHex(0x221100);
    }
  }

  function _destroyPalaceRadio() {
    if (_palaceRadio.destroyed) return;
    _palaceRadio.destroyed = true;
    _obj.radioDestroyed    = true;
    if (_palaceRadio.mesh) {
      _palaceRadio.mesh.material.color.setHex(0x221100);
    }
    _showMsg('OBJECTIVE 2: PALACE RADIO DESTROYED - Airstrike calls cut off!');
    _vega.airstrikeTimer = 9999;
    _checkWin();
  }

  function _destroyTransmitter() {
    if (_transmitter.destroyed) return;
    _transmitter.destroyed      = true;
    _obj.transmitterDestroyed   = true;
    if (_transmitter.mesh) {
      _transmitter.mesh.material.color.setHex(0x221100);
    }
    // Open blast door
    _blastDoor.open = true;
    if (_blastDoor.mesh) _blastDoor.mesh.visible = false;
    _vega.state = 'active';
    _showMsg('OBJECTIVE 1: TRANSMITTER DESTROYED - Blast door opened! General Vega active!');
    _checkWin();
  }

  function _checkWin() {
    if (_countObjectives() === 4) {
      _gameOver    = true;
      _win         = true;
      _gameOverMsg = 'MISSION COMPLETE\nCOUP DEFEATED\nAll 4 objectives complete\nGeneral Vega eliminated\nPress M+I to restart';
      _showGameOver();
    }
  }

  function _showMsg(text) {
    if (!_hudEl || !_hudEl.msgEl) return;
    _hudEl.msgEl.textContent = text;
    _hudEl.msgEl.style.display = 'block';
    _hudEl.msgTimer = 3.5;
  }

  function _showGameOver() {
    if (!_hudEl || !_hudEl.goEl) return;
    _hudEl.goEl.innerHTML = _gameOverMsg.replace(/\n/g, '<br>');
    _hudEl.goEl.style.display = 'block';
    if (_win) {
      _hudEl.goEl.style.color = '#AAFFAA';
      _hudEl.goEl.style.borderColor = '#22AA44';
    } else {
      _hudEl.goEl.style.color = '#FF8888';
      _hudEl.goEl.style.borderColor = '#AA2222';
    }
    document.exitPointerLock();
  }

  // ─────────────────────────────────────────────── UPDATE

  function _updatePlayer(dt) {
    if (_player.dead || _gameOver) return;

    // Movement
    var spd = _player.speed;
    var dx  = 0;
    var dz  = 0;
    if (_keys[KEY_W] || _keys[38]) { dz -= 1; }
    if (_keys[KEY_S] || _keys[40]) { dz += 1; }
    if (_keys[KEY_A] || _keys[37]) { dx -= 1; }
    if (_keys[KEY_D] || _keys[39]) { dx += 1; }

    if (dx !== 0 || dz !== 0) {
      var cos = Math.cos(_player.yaw);
      var sin = Math.sin(_player.yaw);
      _player.pos.x += (cos * dx - sin * dz) * spd * dt;
      _player.pos.z += (sin * dx + cos * dz) * spd * dt;
      _player.pos.x  = Math.max(-250, Math.min(250, _player.pos.x));
      _player.pos.z  = Math.max(-250, Math.min(250, _player.pos.z));
    }

    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _player.yaw;
    _camera.rotation.x     = _player.pitch;

    // NVG crate pickup
    if (!_nvgCrate.collected && _nvgCrate.mesh) {
      var crateDist = _dist3D(_player.pos, _nvgCrate.pos);
      if (crateDist < 2.5) {
        _nvgCrate.collected = true;
        _nvgCrate.mesh.visible = false;
        _showMsg('NVG GOGGLES picked up — press N to toggle (3 min battery)');
      }
    }

    // E hold interactions
    if (_player.holdingE) {
      _player.holdETimer += dt;
      var showHold = false;

      // Check transmitter hold (4s)
      if (!_transmitter.destroyed && _transmitter.mesh) {
        var txDist = _dist3D(_player.pos, _transmitter.pos);
        if (txDist < 6) {
          _transmitter.holdTimer += dt;
          showHold = true;
          if (_hudEl && _hudEl.holdEl) {
            _hudEl.holdEl.style.display = 'block';
            _hudEl.holdBarEl.style.width = Math.min(100, (_transmitter.holdTimer / TRANSMITTER_HOLD) * 100) + '%';
          }
          if (_transmitter.holdTimer >= TRANSMITTER_HOLD) {
            _destroyTransmitter();
            _transmitter.holdTimer = 0;
          }
        }
      }

      // Check officer rescue
      for (var i = 0; i < _officers.length; i++) {
        var officer = _officers[i];
        if (officer.rescued) continue;
        var oDist = _dist3D(_player.pos, officer.pos);
        if (oDist < 3) {
          officer.rescued = true;
          if (officer.mesh) officer.mesh.visible = false;
          _obj.officersRescued++;
          _showMsg('OFFICER ' + (_obj.officersRescued) + '/3 RESCUED');
          if (_obj.officersRescued >= 3) {
            _showMsg('OBJECTIVE 3: All loyal officers rescued!');
            _checkWin();
          }
        }
      }

      if (!showHold && _hudEl && _hudEl.holdEl) {
        _hudEl.holdEl.style.display = 'none';
      }
    } else {
      if (_hudEl && _hudEl.holdEl) _hudEl.holdEl.style.display = 'none';
    }
  }

  function _updateNVG(dt) {
    if (!_player.nvgOn || _player.nvgDead) return;
    _player.nvgBattery -= dt;
    if (_player.nvgBattery <= 0) {
      _player.nvgBattery = 0;
      _player.nvgDead    = true;
      // Flicker off
      _player.nvgOn = false;
      _nvgLight.intensity = 0;
      _ambientLight.color.setHex(0x112233);
      _ambientLight.intensity = 0.6;
      _scene.background = new THREE.Color(0x000811);
      if (_player.nvgHeadLight) _player.nvgHeadLight.intensity = 0;
      if (_player.flashMesh) _player.flashMesh.visible = false;
      if (_player.spotLight) _player.spotLight.intensity = 1.5;
      for (var i = 0; i < _soldiers.length; i++) {
        if (_soldiers[i].state !== 'dead' && _soldiers[i].light) {
          _soldiers[i].light.intensity = 0.8;
          _soldiers[i].glowing = false;
        }
      }
      _showMsg('NVG BATTERY DEAD');
    } else if (_player.nvgBattery < 15) {
      // Flicker effect
      _nvgLight.intensity = (Math.sin(Date.now() * 0.02) > 0) ? 1.2 : 0;
    }
  }

  function _updateSoldiers(dt) {
    var detectR = _player.nvgOn ? DETECT_RANGE_NVG : DETECT_RANGE_NIGHT;

    for (var i = 0; i < _soldiers.length; i++) {
      var sol = _soldiers[i];
      if (sol.state === 'dead') continue;

      // Patrol movement
      if (sol.state === 'patrol' && sol.patrolPath && sol.patrolPath.length > 0) {
        var target = sol.patrolPath[sol.patrolIndex];
        var pd     = _dist2D(sol.pos, target);
        if (pd < 1.5) {
          sol.patrolIndex = (sol.patrolIndex + 1) % sol.patrolPath.length;
        } else {
          var pspd = 2.5 * dt;
          var pdx  = target.x - sol.pos.x;
          var pdz  = target.z - sol.pos.z;
          var plen = Math.sqrt(pdx * pdx + pdz * pdz);
          sol.pos.x += (pdx / plen) * pspd;
          sol.pos.z += (pdz / plen) * pspd;
          if (sol.mesh) _setPos(sol.mesh, sol.pos.x, sol.pos.y, sol.pos.z);
          if (sol.light) sol.light.position.set(sol.pos.x, sol.pos.y + 0.5, sol.pos.z);
        }
      }

      // Detection
      var distP = _dist2D(sol.pos, _player.pos);
      var heightDiff = Math.abs(sol.pos.y - _player.pos.y);
      if (heightDiff < 5 && distP <= detectR) {
        if (sol.state === 'patrol') {
          sol.state = 'combat';
        }
      }

      // Combat
      if (sol.state === 'combat') {
        if (distP > 2.5) {
          var cspd = 3.5 * dt;
          var cdx  = _player.pos.x - sol.pos.x;
          var cdz  = _player.pos.z - sol.pos.z;
          var clen = Math.sqrt(cdx * cdx + cdz * cdz);
          if (clen > 0) {
            sol.pos.x += (cdx / clen) * cspd;
            sol.pos.z += (cdz / clen) * cspd;
            if (sol.mesh) _setPos(sol.mesh, sol.pos.x, sol.pos.y, sol.pos.z);
            if (sol.light) sol.light.position.set(sol.pos.x, sol.pos.y + 0.5, sol.pos.z);
          }
        }
        sol.fireTimer += dt;
        if (sol.fireTimer >= 1.8 && distP < 20) {
          sol.fireTimer = 0;
          _player.hp -= 12;
          if (_player.hp <= 0) {
            _player.dead   = true;
            _gameOver      = true;
            _gameOverMsg   = 'MISSION FAILED\nOPERATOR DOWN\nTimer: ' + _fmtTime(_totalTime) + '\nPress M+I to restart';
            _showGameOver();
          }
        }
      }
    }
  }

  function _updateSnipers(dt) {
    for (var i = 0; i < _snipers.length; i++) {
      var snp = _snipers[i];
      if (snp.state === 'dead') continue;

      var distP = _dist3D(snp.pos, _player.pos);
      snp.fireTimer += dt;

      if (distP < 60 && snp.fireTimer >= 4.0) {
        snp.fireTimer = 0;
        _player.hp -= 25;
        if (_player.hp <= 0) {
          _player.dead   = true;
          _gameOver      = true;
          _gameOverMsg   = 'MISSION FAILED\nOPERATOR DOWN - SNIPER\nPress M+I to restart';
          _showGameOver();
        }
      }
    }
  }

  function _updateAPCs(dt) {
    for (var i = 0; i < _apcs.length; i++) {
      var apc = _apcs[i];
      if (!apc.alive) continue;

      var distP = _dist2D(apc.pos, _player.pos);
      apc.fireTimer += dt;
      if (distP < 30 && apc.fireTimer >= 2.5) {
        apc.fireTimer = 0;
        _player.hp -= 20;
        if (_player.hp <= 0) {
          _player.dead   = true;
          _gameOver      = true;
          _gameOverMsg   = 'MISSION FAILED\nOPERATOR DOWN - APC GUN\nPress M+I to restart';
          _showGameOver();
        }
      }
    }
  }

  function _updateVega(dt) {
    if (_vega.state !== 'active') return;

    // Bodyguard combat support
    for (var i = 0; i < _bodyguards.length; i++) {
      var bg = _bodyguards[i];
      if (bg.state === 'dead') continue;
      var bgDist = _dist3D(bg.pos, _player.pos);

      if (bgDist > 3) {
        var bspd = 4 * dt;
        var bdx  = _player.pos.x - bg.pos.x;
        var bdz  = _player.pos.z - bg.pos.z;
        var blen = Math.sqrt(bdx * bdx + bdz * bdz);
        if (blen > 0) {
          bg.pos.x += (bdx / blen) * bspd;
          bg.pos.z += (bdz / blen) * bspd;
          if (bg.mesh) _setPos(bg.mesh, bg.pos.x, bg.pos.y, bg.pos.z);
        }
      }

      bg.fireTimer += dt;
      if (bgDist < 20 && bg.fireTimer >= 1.5) {
        bg.fireTimer = 0;
        _player.hp -= 18;
        if (_player.hp <= 0) {
          _player.dead   = true;
          _gameOver      = true;
          _gameOverMsg   = 'MISSION FAILED\nTAKEN DOWN BY BODYGUARD\nPress M+I to restart';
          _showGameOver();
        }
      }
    }

    // Vega airstrike timer (only if radio NOT destroyed)
    if (!_obj.radioDestroyed) {
      _vega.airstrikeTimer -= dt;
      if (_vega.airstrikeTimer <= 0) {
        _vega.airstrikeTimer  = AIRSTRIKE_INTERVAL;
        _vega.airstrikeActive = true;
        _triggerAirstrike();
      }
    }
  }

  function _triggerAirstrike() {
    // Airstrike damages player if in exposed area
    var inPalace = _dist2D(_player.pos, { x: PALACE_X, z: PALACE_Z }) < 30;
    if (!inPalace) {
      _player.hp -= 35;
      _showMsg('AIRSTRIKE! Take cover!');
      if (_player.hp <= 0) {
        _player.dead   = true;
        _gameOver      = true;
        _gameOverMsg   = 'MISSION FAILED\nKILLED IN AIRSTRIKE\nDestroy the radio tower to stop airstrikes!\nPress M+I to restart';
        _showGameOver();
      }
    }
  }

  function _updateTimer(dt) {
    _totalTime -= dt;
    if (_totalTime <= 0) {
      _totalTime = 0;
      if (!_obj.vegaEliminated) {
        _gameOver    = true;
        _win         = false;
        _gameOverMsg = 'MISSION FAILED\nTIMER EXPIRED\nGeneral Vega retains power\nPress M+I to restart';
        _showGameOver();
      }
    }
  }

  function _updateHUD(dt) {
    if (!_hudEl || !_active) return;

    // Flash message timer
    if (_hudEl.msgTimer > 0) {
      _hudEl.msgTimer -= dt;
      if (_hudEl.msgTimer <= 0 && _hudEl.msgEl) {
        _hudEl.msgEl.style.display = 'none';
      }
    }

    var guardsAlive = 0;
    for (var i = 0; i < _soldiers.length; i++) {
      if (_soldiers[i].state !== 'dead') guardsAlive++;
    }
    for (var j = 0; j < _snipers.length; j++) {
      if (_snipers[j].state !== 'dead') guardsAlive++;
    }

    var vegaStatus = 'LOCKED';
    if (_vega.state === 'active')     vegaStatus = 'ACTIVE';
    if (_vega.state === 'eliminated') vegaStatus = 'ELIMINATED';

    var nvgStr;
    if (_player.nvgDead) {
      nvgStr = 'DEAD';
    } else if (_player.nvgOn) {
      nvgStr = 'ON(' + Math.ceil(_player.nvgBattery) + 's)';
    } else {
      nvgStr = _nvgCrate.collected ? 'OFF' : 'NO GOGGLES';
    }

    var timerStr = _fmtTime(Math.max(0, _totalTime));
    var objStr   = _countObjectives() + '/4';
    var hpStr    = 'HP:' + Math.max(0, Math.floor(_player.hp));

    _hudEl.textContent = 'MIDNIGHT COUP [OBJECTIVES: ' + objStr + '] [TIMER: ' + timerStr + '] [GUARDS: ' + guardsAlive + '] [GENERAL: ' + vegaStatus + '] [NVG: ' + nvgStr + '] | ' + hpStr;

    // NVG tint overlay
    var tintEl = document.getElementById('midnight-coup-nvg-tint');
    if (_player.nvgOn && !_player.nvgDead) {
      if (!tintEl) {
        tintEl = document.createElement('div');
        tintEl.id = 'midnight-coup-nvg-tint';
        tintEl.style.cssText = [
          'position:fixed',
          'top:0', 'left:0', 'right:0', 'bottom:0',
          'background:rgba(0,70,0,0.22)',
          'pointer-events:none',
          'z-index:9990'
        ].join(';');
        document.body.appendChild(tintEl);
      }
    } else if (tintEl) {
      tintEl.parentNode.removeChild(tintEl);
    }
  }

  // ─────────────────────────────────────────────── PUBLIC API

  function init(scene, camera, renderer, options) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    document.addEventListener('keydown',           _onKeyDown);
    document.addEventListener('keyup',             _onKeyUp);
    document.addEventListener('mousemove',         _onMouseMove);
    document.addEventListener('mousedown',         _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
  }

  function update(dt) {
    if (!_active || _gameOver) return;

    _updateTimer(dt);
    _updatePlayer(dt);
    _updateNVG(dt);
    _updateSoldiers(dt);
    _updateSnipers(dt);
    _updateAPCs(dt);
    _updateVega(dt);
    _updateHUD(dt);
  }

  function reset() {
    _active   = false;
    _gameOver = false;
    _win      = false;
    if (_hudEl) {
      _hudEl.style.display = 'none';
      if (_hudEl.xhEl) _hudEl.xhEl.style.display = 'none';
      if (_hudEl.goEl) _hudEl.goEl.style.display = 'none';
      if (_hudEl.msgEl) _hudEl.msgEl.style.display = 'none';
      if (_hudEl.holdEl) _hudEl.holdEl.style.display = 'none';
    }
    var tintEl = document.getElementById('midnight-coup-nvg-tint');
    if (tintEl) tintEl.parentNode.removeChild(tintEl);
    document.exitPointerLock();
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
