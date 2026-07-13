// night-market-raid.js — Night Market Raid FPS Module for OccupantKiller
// IIFE pattern, all var (no let/const), pure browser JS, THREE global
//
// Activation: N then M within 400ms
//
// Public API:
//   NightMarketRaid.init(scene, camera, renderer, options)
//   NightMarketRaid.update(dt)
//   NightMarketRaid.reset()

window.NightMarketRaid = (function () {
  'use strict';

  // ─────────────────────────────────────────────── CONSTANTS

  var MARKET_HALF        = 80;
  var STALL_ROWS         = 4;
  var STALLS_PER_ROW     = 5;
  var ALLEY_WIDTH        = 6;
  var STALL_W            = 8;
  var STALL_D            = 6;
  var STALL_H            = 3.5;
  var POLE_H             = 3.0;

  var PLAYER_SPEED       = 7;
  var PLAYER_SPEED_SMOKE = 3.5;
  var PLAYER_MAX_HP      = 100;
  var PLAYER_START_X     = 0;
  var PLAYER_START_Y     = 1.7;
  var PLAYER_START_Z     = 75;

  var GUARD_HP           = 75;
  var ENFORCER_HP        = 105;
  var BOSS_HP            = 460;
  var BOSS_PHASE2_THRESH = 0.40;   // 40% HP retreats to truck

  var GUARD_COLOR        = 0x443322;
  var ENFORCER_COLOR     = 0x221133;
  var BOSS_COLOR         = 0x332211;

  var GUARD_COUNT        = 14;
  var ENFORCER_COUNT     = 5;

  var CRATE_HP           = 3;
  var CRATE_COUNT        = 6;
  var CRATE_SCORE        = 300;

  var SMOKE_DURATION     = 6.0;
  var SMOKE_RADIUS       = 8;
  var SMOKE_VIS_DIST     = 4;

  var NEON_FLICKER_TIME  = 3.0;
  var NEON_ALERT_RADIUS  = 18;

  var SHOOT_DMG_GUARD    = 35;
  var SHOOT_DMG_ENFORCER = 28;
  var SHOOT_DMG_BOSS     = 22;
  var MELEE_RANGE        = 2.2;

  var GUARD_DETECT_RANGE   = 14;
  var GUARD_SHOOT_RANGE    = 10;
  var GUARD_SHOOT_INTERVAL = 1.8;
  var GUARD_SHOOT_DMG      = 12;

  var ENFORCER_DETECT_RANGE   = 18;
  var ENFORCER_SHOOT_RANGE    = 15;
  var ENFORCER_SHOOT_INTERVAL = 1.4;
  var ENFORCER_SHOOT_DMG      = 18;

  var BOSS_SHOOT_RANGE    = 20;
  var BOSS_SHOOT_INTERVAL = 1.2;
  var BOSS_SHOOT_DMG      = 20;
  var BOSS_SMOKE_INTERVAL = 12.0;

  var EXTRACTION_Z       = -MARKET_HALF + 4;
  var EXTRACTION_RADIUS  = 8;

  var KEY_N = 78;
  var KEY_M = 77;
  var KEY_W = 87;
  var KEY_S = 83;
  var KEY_A = 65;
  var KEY_D = 68;
  var KEY_E = 69;
  var KEY_R = 82;
  var KEY_F = 70;
  var KEY_ESC = 27;
  var KEY_UP    = 38;
  var KEY_DOWN  = 40;
  var KEY_LEFT  = 37;
  var KEY_RIGHT = 39;

  // ─────────────────────────────────────────────── STATE

  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _active      = false;
  var _initialized = false;

  var _player = {
    mesh:      null,
    hp:        PLAYER_MAX_HP,
    pos:       { x: PLAYER_START_X, y: PLAYER_START_Y, z: PLAYER_START_Z },
    yaw:       Math.PI,
    pitch:     0,
    score:     0,
    dead:      false,
    inSmoke:   false,
    shootTimer: 0
  };

  var _guards    = [];
  var _enforcers = [];
  var _boss      = null;

  var _stalls    = [];   // { mesh, canopy, poles[], pos, neonSign, neonColor, neonFlicker, neonFlickerTimer }
  var _crates    = [];   // contraband crates in warehouse
  var _trucks    = [];   // 3 trucks near warehouse
  var _fountain  = null;

  var _neonSigns  = [];  // { lines, color, flicker, flickerTimer, alertSent, pos }
  var _smokeSpheres = []; // { mesh, timer, pos }

  var _cratesDestroyed  = 0;
  var _dealerCaptured   = false;
  var _dealerDefeated   = false;
  var _missionComplete  = false;
  var _missionFailed    = false;
  var _gameOver         = false;
  var _gameOverMsg      = '';
  var _win              = false;
  var _playerEscaped    = false;

  var _ambientLight   = null;
  var _groundMesh     = null;
  var _warehouseMesh  = null;
  var _extractionMarker = null;

  var _hudEl     = null;
  var _overlayEl = null;

  var _keys      = {};
  var _nKeyTime  = 0;
  var _mKeyTime  = 0;
  var _mouse     = { dx: 0, dy: 0, locked: false };

  var _totalTime = 0;

  var _flashlightMesh = null;
  var _muzzleFlashTimer = 0;

  var _bossPhase2     = false;     // boss retreated to truck
  var _bossSmokeCooldown = 0;
  var _bossRetreated  = false;
  var _bossTruckIndex = 0;         // which truck boss uses

  // ─────────────────────────────────────────────── HELPERS

  function _dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = (a.z !== undefined ? a.z : 0) - (b.z !== undefined ? b.z : 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _makeBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function _makeCyl(rt, rb, h, color, x, y, z, segs) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function _makeSphere(r, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, 10, 8);
    var mat  = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.35 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || r, z || 0);
    return mesh;
  }

  function _makeCone(rb, h, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(rb, h, 6);
    var mat  = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function _makeLineSegmentsRect(x, y, z, w, h, color) {
    var hw = w / 2;
    var hh = h / 2;
    var verts = new Float32Array([
      -hw,  hh, 0,   hw,  hh, 0,
       hw,  hh, 0,   hw, -hh, 0,
       hw, -hh, 0,  -hw, -hh, 0,
      -hw, -hh, 0,  -hw,  hh, 0
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geo, mat);
    line.position.set(x, y, z);
    return line;
  }

  function _clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function _moveToward(pos, target, speed, dt) {
    var dx = target.x - pos.x;
    var dz = target.z - pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.1) return;
    var step = speed * dt;
    if (step > d) step = d;
    pos.x += (dx / d) * step;
    pos.z += (dz / d) * step;
  }

  function _syncMesh(mesh, pos) {
    if (mesh) mesh.position.set(pos.x, pos.y !== undefined ? pos.y : mesh.position.y, pos.z);
  }

  // ─────────────────────────────────────────────── SCENE BUILDING

  function _buildScene() {
    _scene.background = new THREE.Color(0x050508);
    _scene.fog = new THREE.FogExp2(0x080810, 0.018);

    // Dark ambient — nighttime market
    _ambientLight = new THREE.AmbientLight(0x112244, 0.7);
    _scene.add(_ambientLight);

    // Faint moonlight
    var moon = new THREE.DirectionalLight(0x334466, 0.4);
    moon.position.set(-20, 60, -40);
    _scene.add(moon);

    // Ground
    _groundMesh = _makeBox(MARKET_HALF * 2, 0.25, MARKET_HALF * 2, 0x1a1a14, 0, -0.125, 0);
    _scene.add(_groundMesh);

    _buildMarketStalls();
    _buildCentralSquare();
    _buildWarehouse();
    _buildTrucks();
    _buildExtractionZone();
    _spawnGuards();
    _spawnEnforcers();
    _spawnBoss();
    _buildPlayer();
    _buildHUD();
  }

  function _buildMarketStalls() {
    // Lay out stalls in a grid with alleys between rows
    // Rows go along Z axis, columns along X
    var neonColors = [0xff2244, 0x22ffcc, 0xffaa00, 0x44aaff, 0xff44aa, 0x88ff22];
    var stallIndex = 0;

    for (var row = 0; row < STALL_ROWS; row++) {
      for (var col = 0; col < STALLS_PER_ROW; col++) {
        var sx = -((STALLS_PER_ROW - 1) * (STALL_W + ALLEY_WIDTH) / 2) + col * (STALL_W + ALLEY_WIDTH);
        var sz = -30 + row * (STALL_D + ALLEY_WIDTH);
        _buildSingleStall(sx, sz, neonColors[stallIndex % neonColors.length], stallIndex);
        stallIndex++;
      }
    }
  }

  function _buildSingleStall(sx, sz, neonColor, idx) {
    // Canopy (flat-ish box roof)
    var canopy = _makeBox(STALL_W, 0.3, STALL_D, 0x2a1a0a, sx, STALL_H + 0.15, sz);
    _scene.add(canopy);

    // Canopy underside tint
    var underside = _makeBox(STALL_W - 0.2, 0.1, STALL_D - 0.2, 0x1a0f05, sx, STALL_H - 0.05, sz);
    _scene.add(underside);

    // 4 pole supports
    var hw = STALL_W / 2 - 0.3;
    var hd = STALL_D / 2 - 0.3;
    var polePositions = [
      { x: sx - hw, z: sz - hd },
      { x: sx + hw, z: sz - hd },
      { x: sx - hw, z: sz + hd },
      { x: sx + hw, z: sz + hd }
    ];
    var poles = [];
    for (var p = 0; p < 4; p++) {
      var pole = _makeBox(0.18, POLE_H, 0.18, 0x3a2808, polePositions[p].x, POLE_H / 2, polePositions[p].z);
      _scene.add(pole);
      poles.push(pole);
    }

    // 2-3 crates/boxes inside stall
    var numCrates = 2 + (idx % 2);
    for (var c = 0; c < numCrates; c++) {
      var cw = 0.6 + Math.random() * 0.6;
      var ch = 0.5 + Math.random() * 0.5;
      var cd = 0.6 + Math.random() * 0.5;
      var cx = sx + (Math.random() - 0.5) * (STALL_W - 1.5);
      var cz = sz + (Math.random() - 0.5) * (STALL_D - 1.2);
      var crate = _makeBox(cw, ch, cd, 0x4a3010, cx, ch / 2, cz);
      _scene.add(crate);
    }

    // Back wall of stall
    var backWall = _makeBox(STALL_W, STALL_H, 0.2, 0x251508, sx, STALL_H / 2, sz - STALL_D / 2 + 0.1);
    _scene.add(backWall);

    // Neon sign above entrance (front of stall)
    var signY = STALL_H + 0.5;
    var signZ = sz + STALL_D / 2 + 0.05;
    var neonLine = _makeLineSegmentsRect(sx, signY, signZ, STALL_W - 1.2, 1.0, neonColor);
    _scene.add(neonLine);

    // Small point light from neon (dim)
    var neonPt = new THREE.PointLight(neonColor, 0.4, 10);
    neonPt.position.set(sx, signY, signZ);
    _scene.add(neonPt);

    var stallData = {
      canopy:     canopy,
      poles:      poles,
      pos:        { x: sx, y: 0, z: sz },
      neonSign:   neonLine,
      neonLight:  neonPt,
      neonColor:  neonColor,
      neonFlicker: false,
      neonFlickerTimer: 0,
      neonAlerted: false
    };
    _stalls.push(stallData);
    _neonSigns.push({
      lines:        neonLine,
      light:        neonPt,
      color:        neonColor,
      flicker:      false,
      flickerTimer: 0,
      alertSent:    false,
      pos:          { x: sx, y: signY, z: signZ }
    });
  }

  function _buildCentralSquare() {
    // Open paved area in center
    var plaza = _makeBox(20, 0.1, 20, 0x222222, 0, 0.05, 10);
    _scene.add(plaza);

    // Fountain basin (CylinderGeometry)
    var basin = _makeCyl(4.5, 4.5, 0.8, 0x334455, 0, 0.4, 10);
    _scene.add(basin);

    // Fountain pillar (thin CylinderGeometry)
    var pillar = _makeCyl(0.25, 0.3, 3.5, 0x445566, 0, 1.75, 10);
    _scene.add(pillar);

    // Fountain top bowl
    var topBowl = _makeCyl(1.2, 1.2, 0.4, 0x334455, 0, 3.9, 10);
    _scene.add(topBowl);

    // Water sphere hint
    var waterSphere = _makeSphere(0.9, 0x2244aa, 0, 4.5, 10);
    _scene.add(waterSphere);

    // Fountain ambient light
    var fountainLight = new THREE.PointLight(0x3355aa, 0.8, 18);
    fountainLight.position.set(0, 4, 10);
    _scene.add(fountainLight);

    _fountain = { basin: basin, pillar: pillar, pos: { x: 0, z: 10 } };
  }

  function _buildWarehouse() {
    // Large warehouse at back of market
    var whW = 38;
    var whH = 8;
    var whD = 18;
    var whZ = -62;

    _warehouseMesh = _makeBox(whW, whH, whD, 0x1a1a1a, 0, whH / 2, whZ);
    _scene.add(_warehouseMesh);

    // Warehouse roof detail
    var roof = _makeBox(whW, 0.5, whD, 0x111111, 0, whH + 0.25, whZ);
    _scene.add(roof);

    // Warehouse door (large, looks locked with box)
    var doorFrame = _makeBox(5, 7, 0.3, 0x2a2a2a, 0, 3.5, whZ + whD / 2 + 0.15);
    _scene.add(doorFrame);

    var doorLock = _makeBox(0.5, 0.5, 0.4, 0x886622, 0, 2.5, whZ + whD / 2 + 0.3);
    _scene.add(doorLock);

    // Interior - contraband crates (6 skull+crossbones crates)
    var cratePositions = [
      { x: -12, z: -66 }, { x: -6,  z: -66 }, { x:  0,  z: -66 },
      { x: -12, z: -60 }, { x: -6,  z: -60 }, { x:  0,  z: -60 }
    ];

    for (var i = 0; i < CRATE_COUNT; i++) {
      var cp = cratePositions[i];
      var crateBody = _makeBox(2.2, 2.2, 2.2, 0x1e0a0a, cp.x, 1.1, cp.z);
      crateBody.userData.isContraband = true;
      crateBody.userData.hp = CRATE_HP;
      crateBody.userData.index = i;
      _scene.add(crateBody);

      // Skull crossbones effect — small cone on top
      var skullMark = _makeCone(0.5, 0.5, 0xcc0000, cp.x, 2.5, cp.z);
      _scene.add(skullMark);

      // Red light for each crate
      var crateLight = new THREE.PointLight(0x880000, 0.5, 6);
      crateLight.position.set(cp.x, 2.5, cp.z);
      _scene.add(crateLight);

      _crates.push({
        mesh:      crateBody,
        skull:     skullMark,
        light:     crateLight,
        hp:        CRATE_HP,
        destroyed: false,
        pos:       { x: cp.x, y: 1.1, z: cp.z },
        index:     i
      });
    }

    // Interior warehouse lights (red-orange)
    var wh1 = new THREE.PointLight(0x441100, 0.7, 22);
    wh1.position.set(-8, 6, whZ);
    _scene.add(wh1);
    var wh2 = new THREE.PointLight(0x441100, 0.7, 22);
    wh2.position.set(8, 6, whZ);
    _scene.add(wh2);
  }

  function _buildTrucks() {
    // 3 trucks at loading dock (south side of warehouse)
    var truckDefs = [
      { x: -20, z: -50 },
      { x: -13, z: -50 },
      { x: -6,  z: -50 }
    ];

    for (var i = 0; i < 3; i++) {
      var td = truckDefs[i];

      // Truck body
      var body = _makeBox(4, 2.2, 8, 0x1c2c1c, td.x, 1.6, td.z);
      _scene.add(body);

      // Truck cab
      var cab = _makeBox(3.8, 1.8, 3, 0x1a2a1a, td.x, 2.8, td.z - 2.5);
      _scene.add(cab);

      // Windshield
      var wind = _makeBox(3.4, 1.0, 0.1, 0x223322, td.x, 3.0, td.z - 4.05);
      _scene.add(wind);

      // 4 wheels (CylinderGeometry)
      var wheelOffsets = [
        { x: -2.1, z: -2.5 }, { x: 2.1, z: -2.5 },
        { x: -2.1, z:  2.0 }, { x: 2.1, z:  2.0 }
      ];
      for (var w = 0; w < 4; w++) {
        var wo = wheelOffsets[w];
        var wheel = _makeCyl(0.7, 0.7, 0.5, 0x111111, td.x + wo.x, 0.7, td.z + wo.z, 8);
        wheel.rotation.z = Math.PI / 2;
        _scene.add(wheel);
      }

      _trucks.push({
        body: body,
        cab:  cab,
        pos:  { x: td.x, y: 1.6, z: td.z },
        index: i
      });
    }
  }

  function _buildExtractionZone() {
    // North edge extraction point
    var exZ = EXTRACTION_Z;
    var extractFloor = _makeBox(16, 0.1, 16, 0x223344, 0, 0.05, exZ);
    _scene.add(extractFloor);

    // Marker lines
    var verts = new Float32Array([
      -8, 0.12, exZ - 8,   8, 0.12, exZ - 8,
       8, 0.12, exZ - 8,   8, 0.12, exZ + 8,
       8, 0.12, exZ + 8,  -8, 0.12, exZ + 8,
      -8, 0.12, exZ + 8,  -8, 0.12, exZ - 8
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0x00ffcc });
    _extractionMarker = new THREE.LineSegments(geo, mat);
    _scene.add(_extractionMarker);

    // Pulsing light at extraction
    var extLight = new THREE.PointLight(0x00ffcc, 0.8, 20);
    extLight.position.set(0, 2, exZ);
    _scene.add(extLight);
  }

  // ─────────────────────────────────────────────── ENEMY SPAWNING

  function _spawnGuards() {
    // 14 market guards hide/patrol near stalls
    var guardPatrolDefs = [
      { x: -36, z: -18, patrol: [{ x: -36, z: -18 }, { x: -28, z: -18 }, { x: -28, z: -12 }] },
      { x: -20, z: -18, patrol: [{ x: -20, z: -18 }, { x: -12, z: -18 }] },
      { x: -4,  z: -18, patrol: [{ x: -4, z: -18 }, { x: 4, z: -18 }, { x: 4, z: -12 }] },
      { x: 12,  z: -18, patrol: [{ x: 12, z: -18 }, { x: 20, z: -18 }] },
      { x: 28,  z: -18, patrol: [{ x: 28, z: -18 }, { x: 36, z: -18 }, { x: 36, z: -12 }] },
      { x: -36, z: -6,  patrol: [{ x: -36, z: -6 }, { x: -30, z: -6 }] },
      { x: -20, z: -6,  patrol: [{ x: -20, z: -6 }, { x: -14, z: -6 }] },
      { x: 4,   z: -6,  patrol: [{ x: 4, z: -6 }, { x: 10, z: -6 }] },
      { x: 20,  z: -6,  patrol: [{ x: 20, z: -6 }, { x: 26, z: -6 }] },
      { x: 36,  z: -6,  patrol: [{ x: 36, z: -6 }, { x: 30, z: -6 }] },
      { x: -36, z: 6,   patrol: [{ x: -36, z: 6 }, { x: -28, z: 6 }] },
      { x: -20, z: 6,   patrol: [{ x: -20, z: 6 }, { x: -12, z: 6 }] },
      { x: 12,  z: 6,   patrol: [{ x: 12, z: 6 }, { x: 20, z: 6 }] },
      { x: 28,  z: 6,   patrol: [{ x: 28, z: 6 }, { x: 36, z: 6 }, { x: 36, z: 0 }] }
    ];

    for (var i = 0; i < GUARD_COUNT; i++) {
      var def = guardPatrolDefs[i % guardPatrolDefs.length];
      var mesh = _makeBox(0.7, 1.8, 0.5, GUARD_COLOR, def.x, 0.9, def.z);
      _scene.add(mesh);

      // Flashlight (PointLight attached concept)
      var fl = new THREE.PointLight(0xffee88, 0.6, 8);
      fl.position.set(def.x, 1.6, def.z);
      _scene.add(fl);

      _guards.push({
        mesh:          mesh,
        flashlight:    fl,
        pos:           { x: def.x, y: 0.9, z: def.z },
        hp:            GUARD_HP,
        maxHp:         GUARD_HP,
        state:         'patrol',   // patrol|alerted|combat|popshot|dead
        patrolIndex:   0,
        patrolPath:    def.patrol,
        shootTimer:    0,
        popTimer:      0,
        popActive:     false,
        alertRadius:   GUARD_DETECT_RANGE,
        id:            i,
        type:          'guard'
      });
    }
  }

  function _spawnEnforcers() {
    // 5 cartel enforcers — roam between stalls in pairs
    var enfDefs = [
      { x: -30, z: -4,  roamA: { x: -30, z: -4 }, roamB: { x: -20, z: -4 } },
      { x: -22, z: -4,  roamA: { x: -30, z: -4 }, roamB: { x: -20, z: -4 } },
      { x:  10, z: -8,  roamA: { x: 10, z: -8 }, roamB: { x: 22, z: -8 } },
      { x:  22, z: -8,  roamA: { x: 10, z: -8 }, roamB: { x: 22, z: -8 } },
      { x:   0, z: -24, roamA: { x: -10, z: -24 }, roamB: { x: 10, z: -24 } }
    ];

    for (var i = 0; i < ENFORCER_COUNT; i++) {
      var def = enfDefs[i];
      var mesh = _makeBox(0.8, 1.9, 0.55, ENFORCER_COLOR, def.x, 0.95, def.z);
      _scene.add(mesh);

      var fl = new THREE.PointLight(0xffdd66, 0.7, 10);
      fl.position.set(def.x, 1.7, def.z);
      _scene.add(fl);

      _enforcers.push({
        mesh:       mesh,
        flashlight: fl,
        pos:        { x: def.x, y: 0.95, z: def.z },
        hp:         ENFORCER_HP,
        maxHp:      ENFORCER_HP,
        state:      'roam',   // roam|combat|dead
        roamA:      def.roamA,
        roamB:      def.roamB,
        roamTarget: 0,        // 0=A, 1=B
        shootTimer: 0,
        id:         i,
        type:       'enforcer'
      });
    }
  }

  function _spawnBoss() {
    // Boss "El Mercader" starts in warehouse area
    var bossX = 8;
    var bossZ = -62;

    var mesh = _makeBox(0.9, 1.95, 0.6, BOSS_COLOR, bossX, 0.975, bossZ);
    _scene.add(mesh);

    // Boss has cone hat for identification
    var hat = _makeCone(0.35, 0.7, 0x661100, bossX, 2.3, bossZ);
    _scene.add(hat);

    var fl = new THREE.PointLight(0xff8800, 0.9, 12);
    fl.position.set(bossX, 1.8, bossZ);
    _scene.add(fl);

    _boss = {
      mesh:          mesh,
      hat:           hat,
      flashlight:    fl,
      pos:           { x: bossX, y: 0.975, z: bossZ },
      hp:            BOSS_HP,
      maxHp:         BOSS_HP,
      state:         'idle',   // idle|combat|retreat|truckfight|dead
      shootTimer:    0,
      smokeTimer:    BOSS_SMOKE_INTERVAL,
      retreated:     false,
      id:            0,
      type:          'boss'
    };
  }

  function _buildPlayer() {
    var mesh = _makeBox(0.6, 1.8, 0.4, 0x223322, PLAYER_START_X, 0.9, PLAYER_START_Z);
    mesh.visible = false;
    _player.mesh = mesh;
    _scene.add(mesh);

    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.order = 'YXZ';

    // Flashlight mesh on camera
    _flashlightMesh = _makeBox(0.08, 0.08, 0.25, 0xffffcc, 0.2, -0.15, -0.4);
    _camera.add(_flashlightMesh);

    // Player spotlight
    var spot = new THREE.SpotLight(0xffffcc, 2.2, 24, Math.PI / 7, 0.35);
    spot.position.set(0, 0, 0);
    _camera.add(spot);
    _player.spotLight = spot;
  }

  function _buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'nmr-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)',
      'color:#ffcc44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 16px',
      'border:1px solid #884400',
      'border-radius:3px',
      'z-index:9999',
      'white-space:nowrap',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_hudEl);

    // Crosshair
    var xh = document.createElement('div');
    xh.id = 'nmr-xh';
    xh.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:14px',
      'height:14px',
      'border:1px solid rgba(255,180,0,0.6)',
      'border-radius:50%',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(xh);

    // Overlay
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'nmr-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#ffcc44',
      'font-family:monospace',
      'font-size:22px',
      'padding:28px 46px',
      'border:2px solid #884400',
      'border-radius:6px',
      'z-index:10000',
      'display:none',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(_overlayEl);

    // Smoke overlay
    var smokeOvl = document.createElement('div');
    smokeOvl.id = 'nmr-smoke-ovl';
    smokeOvl.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0','bottom:0',
      'background:rgba(160,160,160,0.55)',
      'pointer-events:none',
      'z-index:9990',
      'display:none'
    ].join(';');
    document.body.appendChild(smokeOvl);
  }

  // ─────────────────────────────────────────────── INPUT

  function _onKeyDown(e) {
    _keys[e.keyCode] = true;

    // Activation check: N then M within 400ms
    if (e.keyCode === KEY_N) { _nKeyTime = Date.now(); }
    if (e.keyCode === KEY_M) { _mKeyTime = Date.now(); }
    if (e.keyCode === KEY_N || e.keyCode === KEY_M) {
      if (_nKeyTime > 0 && _mKeyTime > 0 && Math.abs(_nKeyTime - _mKeyTime) < 400) {
        _nKeyTime = 0;
        _mKeyTime = 0;
        if (!_active) { _startGame(); }
        return;
      }
    }

    if (!_active) return;

    // F key: shoot neon sign in crosshair (treated as alt-fire / interaction)
    if (e.keyCode === KEY_F) {
      _interactNeonSign();
    }

    // ESC = exit
    if (e.keyCode === KEY_ESC) {
      _deactivate();
    }
  }

  function _onKeyUp(e) {
    _keys[e.keyCode] = false;
  }

  function _onMouseMove(e) {
    if (!_active || !_mouse.locked) return;
    var sens = 0.002;
    _player.yaw   -= e.movementX * sens;
    _player.pitch -= e.movementY * sens;
    _player.pitch  = _clamp(_player.pitch, -Math.PI / 2.2, Math.PI / 2.2);
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

  // ─────────────────────────────────────────────── SHOOTING

  function _shoot() {
    if (_gameOver || _player.dead) return;
    if (_player.shootTimer > 0) return;
    _player.shootTimer = 0.12;

    // Muzzle flash
    _muzzleFlashTimer = 0.06;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(_camera.quaternion);
    var ray = new THREE.Raycaster(_camera.position.clone(), dir, 0, 80);

    // Build target list
    var targets = [];
    var i;

    for (i = 0; i < _guards.length; i++) {
      if (_guards[i].state !== 'dead') targets.push(_guards[i].mesh);
    }
    for (i = 0; i < _enforcers.length; i++) {
      if (_enforcers[i].state !== 'dead') targets.push(_enforcers[i].mesh);
    }
    if (_boss && _boss.state !== 'dead') {
      targets.push(_boss.mesh);
      targets.push(_boss.hat);
    }
    for (i = 0; i < _crates.length; i++) {
      if (!_crates[i].destroyed) targets.push(_crates[i].mesh);
    }
    // Neon signs (shooting them triggers flicker)
    for (i = 0; i < _neonSigns.length; i++) {
      targets.push(_neonSigns[i].lines);
    }

    var hits = ray.intersectObjects(targets);
    if (hits.length === 0) return;

    var hitObj = hits[0].object;
    _processShot(hitObj);
  }

  function _processShot(obj) {
    var i;

    // Guard hit
    for (i = 0; i < _guards.length; i++) {
      if (_guards[i].mesh === obj) {
        _damageEnemy(_guards[i], SHOOT_DMG_GUARD);
        return;
      }
    }

    // Enforcer hit
    for (i = 0; i < _enforcers.length; i++) {
      if (_enforcers[i].mesh === obj) {
        _damageEnemy(_enforcers[i], SHOOT_DMG_ENFORCER);
        return;
      }
    }

    // Boss hit
    if (_boss && (_boss.mesh === obj || _boss.hat === obj)) {
      _damageBoss(SHOOT_DMG_BOSS);
      return;
    }

    // Contraband crate hit
    for (i = 0; i < _crates.length; i++) {
      if (_crates[i].mesh === obj && !_crates[i].destroyed) {
        _hitCrate(_crates[i]);
        return;
      }
    }

    // Neon sign hit
    for (i = 0; i < _neonSigns.length; i++) {
      if (_neonSigns[i].lines === obj) {
        _shootNeonSign(i);
        return;
      }
    }
  }

  function _damageEnemy(enemy, dmg) {
    if (enemy.state === 'dead') return;
    enemy.hp -= dmg;
    if (enemy.hp <= 0) {
      enemy.hp    = 0;
      enemy.state = 'dead';
      if (enemy.mesh) enemy.mesh.material.color.setHex(0x1a0808);
      if (enemy.mesh) enemy.mesh.position.y = 0.2;
      if (enemy.hat)  enemy.hat.position.y  = 0.3;
      if (enemy.flashlight) enemy.flashlight.intensity = 0;
      _player.score += (enemy.type === 'guard' ? 100 : 200);
      _alertNearbyEnemies(enemy.pos, 16);
    } else {
      if (enemy.state === 'patrol' || enemy.state === 'roam') {
        enemy.state = 'combat';
      }
      _alertNearbyEnemies(enemy.pos, 14);
    }
  }

  function _damageBoss(dmg) {
    if (!_boss || _boss.state === 'dead') return;
    _boss.hp -= dmg;
    if (_boss.hp <= 0) {
      _boss.hp    = 0;
      _boss.state = 'dead';
      _boss.mesh.material.color.setHex(0x1a0808);
      _boss.hat.material.color.setHex(0x1a0808);
      _boss.mesh.position.y = 0.25;
      _boss.hat.position.y  = 0.4;
      _boss.flashlight.intensity = 0;
      _dealerDefeated = true;
      _dealerCaptured = true;
      _player.score  += 1500;
    } else if (!_boss.retreated && _boss.hp / _boss.maxHp <= BOSS_PHASE2_THRESH) {
      _boss.retreated = true;
      _boss.state     = 'retreat';
      _bossPhase2     = true;
    } else if (_boss.state === 'idle') {
      _boss.state = 'combat';
    }
  }

  function _hitCrate(crate) {
    if (crate.destroyed) return;
    crate.hp--;
    if (crate.hp <= 0) {
      crate.destroyed = true;
      _cratesDestroyed++;
      crate.mesh.material.color.setHex(0x440000);
      crate.mesh.position.y = 0.2;
      if (crate.skull) {
        _scene.remove(crate.skull);
        crate.skull = null;
      }
      if (crate.light) crate.light.intensity = 0;
      _player.score += CRATE_SCORE;
    } else {
      // Damaged — darken
      var shade = 0x1e0a0a + (crate.hp * 0x080000);
      crate.mesh.material.color.setHex(shade);
    }
  }

  function _shootNeonSign(idx) {
    var sign = _neonSigns[idx];
    if (sign.flicker) return; // already flickering
    sign.flicker      = true;
    sign.flickerTimer = NEON_FLICKER_TIME;
    _player.score    += 10;

    // Spark color flash
    if (sign.lines) sign.lines.material.color.setHex(0xffffff);
    if (sign.light) sign.light.color.setHex(0xffffff);
    if (sign.light) sign.light.intensity = 1.2;

    // Alert nearby enemies if not already alerted
    if (!sign.alertSent) {
      sign.alertSent = true;
      _alertNearbyEnemies(sign.pos, NEON_ALERT_RADIUS);
    }
  }

  function _interactNeonSign() {
    // Shoot the nearest visible neon sign within range
    var bestIdx = -1;
    var bestD   = 12;
    for (var i = 0; i < _neonSigns.length; i++) {
      var d = _dist3D(_player.pos, _neonSigns[i].pos);
      if (d < bestD) {
        bestD   = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      _shootNeonSign(bestIdx);
    }
  }

  function _alertNearbyEnemies(pos, radius) {
    var i;
    for (i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.state === 'dead') continue;
      if (_dist2D(pos, g.pos) <= radius) {
        g.state = 'combat';
      }
    }
    for (i = 0; i < _enforcers.length; i++) {
      var en = _enforcers[i];
      if (en.state === 'dead') continue;
      if (_dist2D(pos, en.pos) <= radius) {
        en.state = 'combat';
      }
    }
    if (_boss && _boss.state !== 'dead' && _boss.state !== 'retreat') {
      if (_dist2D(pos, _boss.pos) <= radius) {
        _boss.state = 'combat';
      }
    }
  }

  // ─────────────────────────────────────────────── SMOKE GRENADES

  function _bossThrowSmoke() {
    // Boss throws a smoke grenade — spawn smoke sphere near player
    var sx = _player.pos.x + (Math.random() - 0.5) * 8;
    var sz = _player.pos.z + (Math.random() - 0.5) * 8;
    var smMesh = _makeSphere(SMOKE_RADIUS, 0xaaaaaa, sx, SMOKE_RADIUS * 0.5, sz);
    smMesh.material.opacity = 0.45;
    _scene.add(smMesh);
    _smokeSpheres.push({
      mesh:  smMesh,
      timer: SMOKE_DURATION,
      pos:   { x: sx, z: sz }
    });
  }

  function _updateSmoke(dt) {
    var smokeEl = document.getElementById('nmr-smoke-ovl');
    var playerInSmoke = false;

    for (var i = _smokeSpheres.length - 1; i >= 0; i--) {
      var sm = _smokeSpheres[i];
      sm.timer -= dt;
      if (sm.timer <= 0) {
        _scene.remove(sm.mesh);
        _smokeSpheres.splice(i, 1);
        continue;
      }
      // Fade out toward end
      var fade = sm.timer / SMOKE_DURATION;
      sm.mesh.material.opacity = 0.45 * fade;

      // Check if player inside smoke sphere
      if (_dist2D(_player.pos, sm.pos) < SMOKE_RADIUS) {
        playerInSmoke = true;
      }
    }

    _player.inSmoke = playerInSmoke;
    if (smokeEl) smokeEl.style.display = playerInSmoke ? 'block' : 'none';
  }

  // ─────────────────────────────────────────────── NEON UPDATE

  function _updateNeons(dt) {
    for (var i = 0; i < _neonSigns.length; i++) {
      var sign = _neonSigns[i];
      if (!sign.flicker) continue;

      sign.flickerTimer -= dt;
      if (sign.flickerTimer <= 0) {
        // Stop flicker, restore color
        sign.flicker = false;
        if (sign.lines) sign.lines.material.color.setHex(sign.color);
        if (sign.light) sign.light.color.setHex(sign.color);
        if (sign.light) sign.light.intensity = 0.4;
      } else {
        // Flicker effect — alternate color
        var on = (Math.floor(sign.flickerTimer * 12) % 2 === 0);
        if (sign.lines) sign.lines.material.color.setHex(on ? sign.color : 0x111111);
        if (sign.light) sign.light.intensity = on ? 1.0 : 0.05;
      }
    }
  }

  // ─────────────────────────────────────────────── AI UPDATE

  function _updateGuards(dt) {
    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.state === 'dead') continue;

      var distToPlayer = _dist2D(g.pos, _player.pos);

      // Detection
      if (g.state === 'patrol') {
        var detectRange = _player.inSmoke ? GUARD_DETECT_RANGE * 0.4 : GUARD_DETECT_RANGE;
        if (distToPlayer < detectRange) {
          g.state = 'popshot';
          g.popTimer = 1.2 + Math.random() * 0.8;
        } else {
          // Patrol movement
          if (g.patrolPath && g.patrolPath.length > 0) {
            var pt = g.patrolPath[g.patrolIndex];
            var pd = _dist2D(g.pos, pt);
            if (pd < 0.8) {
              g.patrolIndex = (g.patrolIndex + 1) % g.patrolPath.length;
            } else {
              _moveToward(g.pos, pt, 3.0, dt);
            }
          }
        }
      }

      // Pop-up shooting mechanic — guard hides then pops up
      if (g.state === 'popshot') {
        g.popTimer -= dt;
        if (g.popTimer <= 0) {
          // Pop up and shoot
          g.popActive = !g.popActive;
          g.popTimer  = g.popActive ? 0.6 : 1.4 + Math.random();
          if (g.popActive) {
            _guardShootPlayer(g, GUARD_SHOOT_DMG);
          }
        }

        // If player gets close, switch to combat
        if (distToPlayer < 6) {
          g.state = 'combat';
        }
      }

      // Combat — move toward player and shoot
      if (g.state === 'combat' || g.state === 'alerted') {
        if (distToPlayer > GUARD_SHOOT_RANGE) {
          _moveToward(g.pos, _player.pos, 3.5, dt);
        }
        g.shootTimer -= dt;
        if (g.shootTimer <= 0 && distToPlayer <= GUARD_SHOOT_RANGE) {
          g.shootTimer = GUARD_SHOOT_INTERVAL + Math.random() * 0.6;
          _guardShootPlayer(g, GUARD_SHOOT_DMG);
        }
      }

      // Sync mesh and flashlight
      _syncMesh(g.mesh, g.pos);
      if (g.flashlight) g.flashlight.position.set(g.pos.x, g.pos.y + 0.7, g.pos.z);
    }
  }

  function _updateEnforcers(dt) {
    for (var i = 0; i < _enforcers.length; i++) {
      var en = _enforcers[i];
      if (en.state === 'dead') continue;

      var distToPlayer = _dist2D(en.pos, _player.pos);

      if (en.state === 'roam') {
        var detectRange = _player.inSmoke ? ENFORCER_DETECT_RANGE * 0.4 : ENFORCER_DETECT_RANGE;
        if (distToPlayer < detectRange) {
          en.state = 'combat';
        } else {
          // Roam between A and B
          var roamTarget = en.roamTarget === 0 ? en.roamA : en.roamB;
          var rd = _dist2D(en.pos, roamTarget);
          if (rd < 1.0) {
            en.roamTarget = 1 - en.roamTarget;
          } else {
            _moveToward(en.pos, roamTarget, 3.5, dt);
          }
        }
      }

      if (en.state === 'combat') {
        if (distToPlayer > ENFORCER_SHOOT_RANGE * 0.7) {
          _moveToward(en.pos, _player.pos, 4.2, dt);
        }
        en.shootTimer -= dt;
        if (en.shootTimer <= 0 && distToPlayer <= ENFORCER_SHOOT_RANGE) {
          en.shootTimer = ENFORCER_SHOOT_INTERVAL + Math.random() * 0.5;
          _guardShootPlayer(en, ENFORCER_SHOOT_DMG);
        }
      }

      _syncMesh(en.mesh, en.pos);
      if (en.flashlight) en.flashlight.position.set(en.pos.x, en.pos.y + 0.75, en.pos.z);
    }
  }

  function _updateBoss(dt) {
    if (!_boss || _boss.state === 'dead') return;

    var distToPlayer = _dist2D(_boss.pos, _player.pos);

    if (_boss.state === 'idle') {
      // Activate when player gets within 35 units of warehouse
      if (_dist2D(_player.pos, { x: 0, z: -62 }) < 35) {
        _boss.state = 'combat';
      }
    }

    if (_boss.state === 'combat') {
      if (distToPlayer > BOSS_SHOOT_RANGE * 0.6) {
        _moveToward(_boss.pos, _player.pos, 4.0, dt);
      }

      _boss.shootTimer -= dt;
      if (_boss.shootTimer <= 0 && distToPlayer <= BOSS_SHOOT_RANGE) {
        _boss.shootTimer = BOSS_SHOOT_INTERVAL + Math.random() * 0.4;
        _guardShootPlayer(_boss, BOSS_SHOOT_DMG);
      }

      // Smoke grenade cooldown
      _boss.smokeTimer -= dt;
      if (_boss.smokeTimer <= 0 && distToPlayer < 20) {
        _boss.smokeTimer = BOSS_SMOKE_INTERVAL;
        _bossThrowSmoke();
      }
    }

    if (_boss.state === 'retreat') {
      // Retreat to nearest truck
      var truckTarget = _trucks[_bossTruckIndex].pos;
      var retDist = _dist2D(_boss.pos, truckTarget);
      if (retDist > 1.5) {
        _moveToward(_boss.pos, truckTarget, 6.0, dt);
      } else {
        _boss.state  = 'truckfight';
        _bossRetreated = true;
      }
    }

    if (_boss.state === 'truckfight') {
      // Mobile fight from truck area — boss stays near truck but shoots
      var tk = _trucks[_bossTruckIndex].pos;
      var td = _dist2D(_boss.pos, tk);
      if (td > 3) {
        _moveToward(_boss.pos, tk, 4.0, dt);
      }

      _boss.shootTimer -= dt;
      if (_boss.shootTimer <= 0 && distToPlayer <= BOSS_SHOOT_RANGE * 1.3) {
        _boss.shootTimer = BOSS_SHOOT_INTERVAL * 0.85 + Math.random() * 0.3;
        _guardShootPlayer(_boss, BOSS_SHOOT_DMG + 4);
      }

      _boss.smokeTimer -= dt;
      if (_boss.smokeTimer <= 0 && distToPlayer < 25) {
        _boss.smokeTimer = BOSS_SMOKE_INTERVAL * 0.7;
        _bossThrowSmoke();
      }
    }

    _syncMesh(_boss.mesh, _boss.pos);
    _boss.hat.position.set(_boss.pos.x, _boss.pos.y + 1.35, _boss.pos.z);
    if (_boss.flashlight) _boss.flashlight.position.set(_boss.pos.x, _boss.pos.y + 0.85, _boss.pos.z);
  }

  function _guardShootPlayer(enemy, dmg) {
    if (_player.dead || _gameOver) return;
    // Apply smoke penalty — enemy misses more often
    if (_player.inSmoke && Math.random() < 0.55) return;
    _player.hp -= dmg;
    if (_player.hp <= 0) {
      _player.hp   = 0;
      _player.dead = true;
      _endGame(false, 'YOU WERE KILLED\nMISSION FAILED');
    }
  }

  // ─────────────────────────────────────────────── PLAYER UPDATE

  function _updatePlayer(dt) {
    if (_player.dead || _gameOver) return;

    // Movement
    var spd = _player.inSmoke ? PLAYER_SPEED_SMOKE : PLAYER_SPEED;
    var dx  = 0;
    var dz  = 0;

    if (_keys[KEY_W] || _keys[KEY_UP])    { dz -= 1; }
    if (_keys[KEY_S] || _keys[KEY_DOWN])  { dz += 1; }
    if (_keys[KEY_A] || _keys[KEY_LEFT])  { dx -= 1; }
    if (_keys[KEY_D] || _keys[KEY_RIGHT]) { dx += 1; }

    if (dx !== 0 || dz !== 0) {
      var cos = Math.cos(_player.yaw);
      var sin = Math.sin(_player.yaw);
      var mx  = (cos * dx - sin * dz) * spd * dt;
      var mz  = (sin * dx + cos * dz) * spd * dt;
      _player.pos.x = _clamp(_player.pos.x + mx, -MARKET_HALF + 1, MARKET_HALF - 1);
      _player.pos.z = _clamp(_player.pos.z + mz, -MARKET_HALF + 1, MARKET_HALF - 1);
    }

    // Camera
    _camera.position.set(_player.pos.x, _player.pos.y, _player.pos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _player.yaw;
    _camera.rotation.x     = _player.pitch;

    // Shoot timer cooldown
    if (_player.shootTimer > 0) _player.shootTimer -= dt;

    // Muzzle flash
    if (_muzzleFlashTimer > 0) {
      _muzzleFlashTimer -= dt;
      if (_player.spotLight) _player.spotLight.intensity = 6;
    } else {
      if (_player.spotLight) _player.spotLight.intensity = 2.2;
    }

    // Check win condition
    _checkWinCondition();
  }

  function _checkWinCondition() {
    if (_gameOver) return;

    var allCratesDestroyed = (_cratesDestroyed >= CRATE_COUNT);
    var dealerDown         = _dealerCaptured || _dealerDefeated;

    // Check extraction
    if (allCratesDestroyed && dealerDown) {
      var distToExtract = _dist2D(_player.pos, { x: 0, z: EXTRACTION_Z });
      if (distToExtract <= EXTRACTION_RADIUS) {
        _playerEscaped = true;
        _endGame(true, 'MISSION COMPLETE\nNIGHT MARKET RAIDED\nSCORE: ' + _player.score);
      }
    }
  }

  function _endGame(win, msg) {
    if (_gameOver) return;
    _gameOver    = true;
    _win         = win;
    _gameOverMsg = msg;
    _missionComplete = win;
    _missionFailed   = !win;

    if (_overlayEl) {
      var lines = _gameOverMsg.split('\n');
      _overlayEl.innerHTML = lines.join('<br>') +
        '<br><br><span style="font-size:14px">Press N then M to restart</span>';
      _overlayEl.style.display = 'block';
    }
    document.exitPointerLock();
  }

  // ─────────────────────────────────────────────── HUD UPDATE

  function _updateHUD() {
    if (!_hudEl || !_active) return;

    var guardsAlive = 0;
    var i;
    for (i = 0; i < _guards.length; i++) {
      if (_guards[i].state !== 'dead') guardsAlive++;
    }
    for (i = 0; i < _enforcers.length; i++) {
      if (_enforcers[i].state !== 'dead') guardsAlive++;
    }

    var dealerStatus = 'AT LARGE';
    if (_boss) {
      if (_boss.state === 'dead')        dealerStatus = 'CAPTURED';
      else if (_bossPhase2)              dealerStatus = 'TRUCK FIGHT';
      else if (_boss.state === 'combat') dealerStatus = 'ENGAGED';
    }

    var smokeStr = _player.inSmoke ? ' [SMOKE!]' : '';
    var hpStr    = 'HP:' + Math.max(0, Math.round(_player.hp));
    var crateStr = 'CONTRABAND:' + _cratesDestroyed + '/' + CRATE_COUNT;
    var dealerStr = 'DEALER:' + dealerStatus;
    var guardsStr = 'GUARDS:' + guardsAlive;
    var scoreStr  = 'SCR:' + _player.score;

    var extractHint = '';
    if (_cratesDestroyed >= CRATE_COUNT && (_dealerCaptured || _dealerDefeated)) {
      extractHint = ' [HEAD NORTH TO EXTRACT]';
    }

    _hudEl.textContent = 'NIGHT MARKET RAID | ' + crateStr + ' | ' + dealerStr +
      ' | ' + guardsStr + ' | ' + hpStr + ' | ' + scoreStr + smokeStr + extractHint;
  }

  // ─────────────────────────────────────────────── GAME START / RESET

  function _startGame() {
    if (!_initialized) {
      _buildScene();
      _initialized = true;
    } else {
      _doReset();
    }
    _active      = true;
    _gameOver    = false;
    _gameOverMsg = '';
    _win         = false;
    _missionComplete = false;
    _missionFailed   = false;
    _playerEscaped   = false;

    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_hudEl)     _hudEl.style.display = 'block';

    document.body.requestPointerLock();
  }

  function _doReset() {
    var i;

    // Reset player
    _player.pos       = { x: PLAYER_START_X, y: PLAYER_START_Y, z: PLAYER_START_Z };
    _player.hp        = PLAYER_MAX_HP;
    _player.yaw       = Math.PI;
    _player.pitch     = 0;
    _player.score     = 0;
    _player.dead      = false;
    _player.inSmoke   = false;
    _player.shootTimer = 0;

    // Reset guards
    var guardPatrolDefs = [
      { x: -36, z: -18, patrol: [{ x: -36, z: -18 }, { x: -28, z: -18 }, { x: -28, z: -12 }] },
      { x: -20, z: -18, patrol: [{ x: -20, z: -18 }, { x: -12, z: -18 }] },
      { x: -4,  z: -18, patrol: [{ x: -4, z: -18 }, { x: 4, z: -18 }, { x: 4, z: -12 }] },
      { x: 12,  z: -18, patrol: [{ x: 12, z: -18 }, { x: 20, z: -18 }] },
      { x: 28,  z: -18, patrol: [{ x: 28, z: -18 }, { x: 36, z: -18 }, { x: 36, z: -12 }] },
      { x: -36, z: -6,  patrol: [{ x: -36, z: -6 }, { x: -30, z: -6 }] },
      { x: -20, z: -6,  patrol: [{ x: -20, z: -6 }, { x: -14, z: -6 }] },
      { x: 4,   z: -6,  patrol: [{ x: 4, z: -6 }, { x: 10, z: -6 }] },
      { x: 20,  z: -6,  patrol: [{ x: 20, z: -6 }, { x: 26, z: -6 }] },
      { x: 36,  z: -6,  patrol: [{ x: 36, z: -6 }, { x: 30, z: -6 }] },
      { x: -36, z: 6,   patrol: [{ x: -36, z: 6 }, { x: -28, z: 6 }] },
      { x: -20, z: 6,   patrol: [{ x: -20, z: 6 }, { x: -12, z: 6 }] },
      { x: 12,  z: 6,   patrol: [{ x: 12, z: 6 }, { x: 20, z: 6 }] },
      { x: 28,  z: 6,   patrol: [{ x: 28, z: 6 }, { x: 36, z: 6 }, { x: 36, z: 0 }] }
    ];

    for (i = 0; i < _guards.length; i++) {
      var g    = _guards[i];
      var gdef = guardPatrolDefs[i % guardPatrolDefs.length];
      g.hp         = GUARD_HP;
      g.state      = 'patrol';
      g.pos        = { x: gdef.x, y: 0.9, z: gdef.z };
      g.patrolIndex = 0;
      g.patrolPath  = gdef.patrol;
      g.shootTimer  = 0;
      g.popTimer    = 0;
      g.popActive   = false;
      if (g.mesh) {
        g.mesh.material.color.setHex(GUARD_COLOR);
        g.mesh.position.set(g.pos.x, g.pos.y, g.pos.z);
      }
      if (g.flashlight) g.flashlight.intensity = 0.6;
    }

    // Reset enforcers
    var enfDefs = [
      { x: -30, z: -4,  roamA: { x: -30, z: -4 }, roamB: { x: -20, z: -4 } },
      { x: -22, z: -4,  roamA: { x: -30, z: -4 }, roamB: { x: -20, z: -4 } },
      { x:  10, z: -8,  roamA: { x: 10, z: -8 }, roamB: { x: 22, z: -8 } },
      { x:  22, z: -8,  roamA: { x: 10, z: -8 }, roamB: { x: 22, z: -8 } },
      { x:   0, z: -24, roamA: { x: -10, z: -24 }, roamB: { x: 10, z: -24 } }
    ];
    for (i = 0; i < _enforcers.length; i++) {
      var en   = _enforcers[i];
      var edef = enfDefs[i % enfDefs.length];
      en.hp         = ENFORCER_HP;
      en.state      = 'roam';
      en.pos        = { x: edef.x, y: 0.95, z: edef.z };
      en.roamA      = edef.roamA;
      en.roamB      = edef.roamB;
      en.roamTarget = 0;
      en.shootTimer = 0;
      if (en.mesh) {
        en.mesh.material.color.setHex(ENFORCER_COLOR);
        en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
      }
      if (en.flashlight) en.flashlight.intensity = 0.7;
    }

    // Reset boss
    if (_boss) {
      _boss.hp        = BOSS_HP;
      _boss.state     = 'idle';
      _boss.pos       = { x: 8, y: 0.975, z: -62 };
      _boss.shootTimer = 0;
      _boss.smokeTimer = BOSS_SMOKE_INTERVAL;
      _boss.retreated  = false;
      if (_boss.mesh) {
        _boss.mesh.material.color.setHex(BOSS_COLOR);
        _boss.mesh.position.set(_boss.pos.x, _boss.pos.y, _boss.pos.z);
      }
      if (_boss.hat) {
        _boss.hat.material.color.setHex(0x661100);
        _boss.hat.position.set(_boss.pos.x, _boss.pos.y + 1.35, _boss.pos.z);
      }
      if (_boss.flashlight) _boss.flashlight.intensity = 0.9;
    }

    // Reset crates
    for (i = 0; i < _crates.length; i++) {
      var crate = _crates[i];
      crate.hp        = CRATE_HP;
      crate.destroyed = false;
      if (crate.mesh) {
        crate.mesh.material.color.setHex(0x1e0a0a);
        crate.mesh.position.y = 1.1;
      }
      if (crate.light) crate.light.intensity = 0.5;
    }

    // Clear smoke
    for (i = 0; i < _smokeSpheres.length; i++) {
      _scene.remove(_smokeSpheres[i].mesh);
    }
    _smokeSpheres.length = 0;

    // Reset neons
    for (i = 0; i < _neonSigns.length; i++) {
      var sign = _neonSigns[i];
      sign.flicker      = false;
      sign.flickerTimer = 0;
      sign.alertSent    = false;
      if (sign.lines) sign.lines.material.color.setHex(sign.color);
      if (sign.light) {
        sign.light.color.setHex(sign.color);
        sign.light.intensity = 0.4;
      }
    }

    _cratesDestroyed = 0;
    _dealerCaptured  = false;
    _dealerDefeated  = false;
    _bossPhase2      = false;
    _bossRetreated   = false;
    _totalTime       = 0;
  }

  function _deactivate() {
    _active = false;
    if (_hudEl)     _hudEl.style.display = 'none';
    if (_overlayEl) _overlayEl.style.display = 'none';
    var smokeOvl = document.getElementById('nmr-smoke-ovl');
    if (smokeOvl) smokeOvl.style.display = 'none';
    document.exitPointerLock();
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
    if (!_active) return;
    _totalTime += dt;

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateEnforcers(dt);
    _updateBoss(dt);
    _updateSmoke(dt);
    _updateNeons(dt);
    _updateHUD();
  }

  function reset() {
    _active = false;
    _gameOver = false;
    _win = false;

    if (_hudEl)     _hudEl.style.display = 'none';
    if (_overlayEl) _overlayEl.style.display = 'none';

    var smokeOvl = document.getElementById('nmr-smoke-ovl');
    if (smokeOvl) smokeOvl.style.display = 'none';

    document.exitPointerLock();
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
