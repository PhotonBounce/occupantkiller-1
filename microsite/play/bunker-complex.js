/* ───────────────────────────────────────────────────────────────────────────
   bunker-complex.js — Doomsday Cult Bunker Complex Module
   API: window.BunkerComplex = { init, update, reset }
   Controls:
     B then C (within 400ms)  → toggle module on/off
     WASD                     → move player
     Mouse                    → look/aim
     Left Click               → shoot
     E (near elevator)        → call elevator / ride to next floor
   Floors:
     Floor 1 (y=0)   — Armory
     Floor 2 (y=10)  — Barracks
     Floor 3 (y=20)  — Shrine Room
     Floor 4 (y=30)  — Leader's Penthouse
   ─────────────────────────────────────────────────────────────────────────── */
window.BunkerComplex = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene   = null;
  var _camera  = null;

  /* ── Activation ────────────────────────────────────────────────────────── */
  var _active     = false;
  var _lastBKey   = 0;
  var _keys       = {};
  var _mouse      = { x: 0, y: 0, leftDown: false };
  var _yaw        = 0;
  var _pitch      = 0;
  var _prevEKey   = false;
  var _prevClick  = false;
  var _shootCd    = 0;

  /* ── Floor data ────────────────────────────────────────────────────────── */
  var FLOOR_Y     = [0, 10, 20, 30];
  var FLOOR_NAMES = ['ARMORY', 'BARRACKS', 'SHRINE', 'PENTHOUSE'];
  var currentFloor = 0;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos  = { x: 0, y: 1.7, z: 8 };
  var _playerHP   = 100;

  /* ── Elevator ──────────────────────────────────────────────────────────── */
  var _elevator       = null;
  var _elevatorY      = 0.25;
  var _elevatorTarget = 0.25;
  var _elevatorMoving = false;
  var _elevatorFloor  = 0;

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _enemies     = [];
  var _leaderAlive = true;

  /* ── Scene objects for cleanup ─────────────────────────────────────────── */
  var _objects = [];

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hudEl = null;

  /* ── Candle flicker timer ──────────────────────────────────────────────── */
  var _flickerTime = 0;
  var _candles     = [];

  /* =========================================================================
     MATERIAL / GEOMETRY HELPERS
     ========================================================================= */

  function _mat(color, opacity) {
    var opts = { color: color };
    if (opacity !== undefined && opacity < 1) {
      opts.transparent = true;
      opts.opacity = opacity;
    }
    return new THREE.MeshLambertMaterial(opts);
  }

  function _addObj(mesh) {
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _box(w, h, d, color, x, y, z, opacity) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, _mat(color, opacity));
    mesh.position.set(x, y, z);
    return _addObj(mesh);
  }

  function _cyl(rt, rb, h, segs, color, x, y, z) {
    var geo  = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mesh = new THREE.Mesh(geo, _mat(color));
    mesh.position.set(x, y, z);
    return _addObj(mesh);
  }

  function _cone(r, h, segs, color, x, y, z) {
    var geo  = new THREE.ConeGeometry(r, h, segs);
    var mesh = new THREE.Mesh(geo, _mat(color));
    mesh.position.set(x, y, z);
    return _addObj(mesh);
  }

  function _sphere(r, segs, color, x, y, z) {
    var geo  = new THREE.SphereGeometry(r, segs, segs);
    var mesh = new THREE.Mesh(geo, _mat(color));
    mesh.position.set(x, y, z);
    return _addObj(mesh);
  }

  /* Build a wireframe-style box overlay using LineSegments */
  function _lineBox(w, h, d, color, x, y, z) {
    var geo  = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat  = new THREE.LineBasicMaterial({ color: color });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.set(x, y, z);
    return _addObj(lines);
  }

  /* =========================================================================
     HUD
     ========================================================================= */

  function _createHUD() {
    _hudEl = document.createElement('div');
    _hudEl.id = 'bunker-complex-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00ff88',
      'font:bold 13px/1.5 monospace',
      'padding:8px 18px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:pre',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var leaderStr = _leaderAlive ? '<span style="color:#ff4444">ALIVE</span>' : '<span style="color:#00ff88">ELIMINATED</span>';
    _hudEl.innerHTML = [
      'BUNKER COMPLEX',
      'FLOOR: ' + (currentFloor + 1) + '/4  [' + FLOOR_NAMES[currentFloor] + ']',
      'LEADER: ' + (_leaderAlive ? 'ALIVE' : 'ELIMINATED'),
      'HP: ' + _playerHP + '  |  E=ELEVATOR'
    ].join('\n');
    /* color leader text */
    _hudEl.childNodes[2] && void 0;
    _hudEl.innerHTML =
      'BUNKER COMPLEX\n' +
      'FLOOR: ' + (currentFloor + 1) + '/4  [' + FLOOR_NAMES[currentFloor] + ']\n' +
      'LEADER: ' + (_leaderAlive ? '<span style="color:#ff3333">ALIVE</span>' : '<span style="color:#00ff88">ELIMINATED</span>') + '\n' +
      'HP: ' + _playerHP + '   E=ELEVATOR   LMB=SHOOT';
  }

  function _showNotif(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#ffcc00',
      'font:bold 15px monospace',
      'padding:8px 22px',
      'border:1px solid #ffcc00',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2500);
  }

  /* =========================================================================
     WORLD BUILDING
     ========================================================================= */

  /* ── Ambient / directional light ──────────────────────────────────────── */
  function _buildLighting() {
    var ambient = new THREE.AmbientLight(0x334433, 0.8);
    _scene.add(ambient);
    _objects.push(ambient);

    var dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 20, 5);
    _scene.add(dir);
    _objects.push(dir);
  }

  /* ── Ceiling for each floor ───────────────────────────────────────────── */
  function _buildFloorPlatform(floorIdx) {
    var fy = FLOOR_Y[floorIdx];
    /* Floor slab */
    _box(40, 0.5, 40, 0x4a4a4a, 0, fy - 0.25, 0);
    /* Ceiling for floors 1-3 (floor above acts as ceiling) */
    if (floorIdx < 3) {
      _box(40, 0.5, 40, 0x3a3a3a, 0, fy + 9.75, 0);
    }
    /* Perimeter walls */
    _box(40, 10, 0.5, 0x555555, 0,  fy + 5, -20);   /* north wall */
    _box(40, 10, 0.5, 0x555555, 0,  fy + 5,  20);   /* south wall */
    _box(0.5, 10, 40, 0x555555, -20, fy + 5, 0);    /* west wall  */
    _box(0.5, 10, 40, 0x555555,  20, fy + 5, 0);    /* east wall  */
  }

  /* ── Concrete pillars at corners of each floor ───────────────────────── */
  function _buildPillars(floorIdx) {
    var fy  = FLOOR_Y[floorIdx];
    var cx  = [-15, 15];
    var cz  = [-15, 15];
    var i, j;
    for (i = 0; i < 2; i++) {
      for (j = 0; j < 2; j++) {
        _cyl(0.6, 0.6, 9.5, 8, 0x5a5a5a, cx[i], fy + 4.75, cz[j]);
      }
    }
  }

  /* ── Blast door with LineSegments grid overlay ───────────────────────── */
  function _buildBlastDoor(x, y, z, rotY) {
    var door = _box(6, 4, 0.3, 0x2a3a2a, x, y, z);
    door.rotation.y = rotY || 0;
    /* Grid overlay */
    var lines = _lineBox(6, 4, 0.35, 0x44ff44, x, y, z);
    lines.rotation.y = rotY || 0;
    return door;
  }

  /* ── Elevator shaft and platform ─────────────────────────────────────── */
  function _buildElevator() {
    /* Shaft walls — thin strips on north/south sides */
    _box(3, 32, 0.15, 0x333333, -12, 16, -8.9);
    _box(3, 32, 0.15, 0x333333, -12, 16, -6.1);
    _box(0.15, 32, 3,  0x333333, -13.4, 16, -7.5);
    _box(0.15, 32, 3,  0x333333, -10.6, 16, -7.5);

    /* LineSegments shaft guide rails */
    _lineBox(3, 32, 3, 0x226622, -12, 16, -7.5);

    /* Elevator platform itself */
    var geo  = new THREE.BoxGeometry(2.5, 0.25, 2.5);
    var mesh = new THREE.Mesh(geo, _mat(0x556655));
    mesh.position.set(-12, 0.25, -7.5);
    _scene.add(mesh);
    _objects.push(mesh);
    _elevator = mesh;
    _elevatorY      = 0.25;
    _elevatorTarget = 0.25;
    _elevatorFloor  = 0;
  }

  /* ── FLOOR 1: Armory ─────────────────────────────────────────────────── */
  function _buildArmory() {
    var fy = FLOOR_Y[0];
    /* Weapon racks — box frame + LineSegments */
    var rackPositions = [
      [5, 0], [5, 5], [5, -5],
      [-5, 0], [-5, 5]
    ];
    var i;
    for (i = 0; i < rackPositions.length; i++) {
      var rx = rackPositions[i][0];
      var rz = rackPositions[i][1];
      /* Back panel */
      _box(2.5, 2.2, 0.15, 0x443322, rx, fy + 1.5, rz);
      /* Top / bottom rails */
      _box(2.5, 0.1, 0.3, 0x6a5533, rx, fy + 2.55, rz);
      _box(2.5, 0.1, 0.3, 0x6a5533, rx, fy + 0.45, rz);
      /* Side uprights */
      _box(0.1, 2.2, 0.3, 0x6a5533, rx - 1.2, fy + 1.5, rz);
      _box(0.1, 2.2, 0.3, 0x6a5533, rx + 1.2, fy + 1.5, rz);
      /* LineSegments wire overlay to suggest rifles */
      _lineBox(2.5, 2.2, 0.4, 0xaa8844, rx, fy + 1.5, rz);
      /* Fake rifle stubs — thin cylinders */
      _cyl(0.04, 0.04, 1.8, 5, 0x222222, rx - 0.5, fy + 1.5, rz - 0.1);
      _cyl(0.04, 0.04, 1.8, 5, 0x222222, rx,       fy + 1.5, rz - 0.1);
      _cyl(0.04, 0.04, 1.8, 5, 0x222222, rx + 0.5, fy + 1.5, rz - 0.1);
    }
    /* Ammo crates */
    _box(1.2, 0.8, 0.8, 0x334422, 8,  fy + 0.4, 5);
    _box(1.2, 0.8, 0.8, 0x334422, 8,  fy + 1.2, 5);
    _box(1.2, 0.8, 0.8, 0x334422, 9.4,fy + 0.4, 5);
    /* Blast door at armory entrance */
    _buildBlastDoor(0, fy + 2.5, -18, 0);
  }

  /* ── FLOOR 2: Barracks ───────────────────────────────────────────────── */
  function _buildBarracks() {
    var fy = FLOOR_Y[1];
    /* Bunk beds in rows */
    var bunks = [
      [-8, -10], [-8, -5], [-8, 0], [-8, 5], [-8, 10],
      [ 5, -10], [ 5, -5], [ 5, 0], [ 5, 5], [ 5, 10]
    ];
    var i;
    for (i = 0; i < bunks.length; i++) {
      var bx = bunks[i][0];
      var bz = bunks[i][1];
      /* Lower bunk frame */
      _box(2, 0.12, 0.9, 0x5a3a1a, bx, fy + 0.56, bz);
      /* Lower bunk mattress */
      _box(1.9, 0.1, 0.8, 0xccbbaa, bx, fy + 0.67, bz);
      /* Upper bunk frame */
      _box(2, 0.12, 0.9, 0x5a3a1a, bx, fy + 1.56, bz);
      /* Upper bunk mattress */
      _box(1.9, 0.1, 0.8, 0xccbbaa, bx, fy + 1.67, bz);
      /* Side legs */
      _box(0.08, 1.7, 0.08, 0x5a3a1a, bx - 0.96, fy + 0.85, bz - 0.41);
      _box(0.08, 1.7, 0.08, 0x5a3a1a, bx + 0.96, fy + 0.85, bz - 0.41);
      _box(0.08, 1.7, 0.08, 0x5a3a1a, bx - 0.96, fy + 0.85, bz + 0.41);
      _box(0.08, 1.7, 0.08, 0x5a3a1a, bx + 0.96, fy + 0.85, bz + 0.41);
    }
    /* Lockers along east wall */
    var lz;
    for (lz = -12; lz <= 12; lz += 3) {
      _box(0.9, 2.1, 0.6, 0x3a4a3a, 17, fy + 1.05, lz);
      _lineBox(0.9, 2.1, 0.62, 0x558855, 17, fy + 1.05, lz);
    }
    /* Blast door */
    _buildBlastDoor(0, fy + 2.5, -18, 0);
    /* Intercom / notice board */
    _box(2, 1.2, 0.1, 0x223322, -18, fy + 3, 0);
    _lineBox(2, 1.2, 0.15, 0x44ff44, -18, fy + 3, 0);
  }

  /* ── FLOOR 3: Shrine Room ────────────────────────────────────────────── */
  function _buildShrine() {
    var fy = FLOOR_Y[2];
    /* Dark stone floor accent */
    _box(16, 0.06, 16, 0x221122, 0, fy + 0.03, 0);
    /* Central altar — stepped box */
    _box(3.5, 0.5, 2.5, 0x2a1a2a, 0, fy + 0.25, 0);
    _box(2.5, 0.5, 1.8, 0x3a1a3a, 0, fy + 0.75, 0);
    _box(1.5, 0.4, 1.2, 0x4a1a4a, 0, fy + 1.2,  0);
    /* Altar cloth draping — thin flat box */
    _box(2.8, 0.05, 2, 0x660066, 0, fy + 1.45, 0);
    /* Altar symbol — sphere + cross-lines */
    _sphere(0.3, 8, 0xdd00dd, 0, fy + 1.7, 0);
    _box(0.06, 0.8, 0.06, 0xaa00aa, 0, fy + 1.9, 0);
    _box(0.06, 0.06, 0.8, 0xaa00aa, 0, fy + 2.2, 0);
    /* Candles around altar */
    var candleOffsets = [
      [-2, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5],
      [0, -2.5],  [0,  2.5]
    ];
    var i;
    for (i = 0; i < candleOffsets.length; i++) {
      var cx = candleOffsets[i][0];
      var cz = candleOffsets[i][1];
      /* Candle body */
      var body = _cyl(0.08, 0.08, 0.4, 6, 0xffeecc, cx, fy + 0.2, cz);
      /* Flame — cone */
      var flame = _cone(0.06, 0.18, 6, 0xff8800, cx, fy + 0.49, cz);
      /* Small glow sphere */
      var glow = _sphere(0.05, 4, 0xffcc00, cx, fy + 0.49, cz);
      _candles.push({ flame: flame, glow: glow, base: fy + 0.49, cx: cx, cz: cz });
    }
    /* Tall candelabras */
    _cyl(0.05, 0.1, 2.2, 6, 0x888866, -6, fy + 1.1, -6);
    _cyl(0.12, 0.12, 0.15, 6, 0xffeecc, -6, fy + 2.28, -6);
    _cone(0.07, 0.2, 6, 0xff6600, -6, fy + 2.47, -6);
    _cyl(0.05, 0.1, 2.2, 6, 0x888866,  6, fy + 1.1, -6);
    _cyl(0.12, 0.12, 0.15, 6, 0xffeecc,  6, fy + 2.28, -6);
    _cone(0.07, 0.2, 6, 0xff6600,  6, fy + 2.47, -6);
    /* Tapestry banners on walls */
    _box(0.08, 4, 2.5, 0x550055, -19.7, fy + 5, -5);
    _box(0.08, 4, 2.5, 0x550055, -19.7, fy + 5,  5);
    _box(0.08, 4, 2.5, 0x550055,  19.7, fy + 5, -5);
    _box(0.08, 4, 2.5, 0x550055,  19.7, fy + 5,  5);
    /* Pews */
    var pz;
    for (pz = -14; pz <= 14; pz += 4) {
      _box(3, 0.25, 0.8, 0x3a2215, -5,  fy + 0.5, pz);
      _box(3, 0.25, 0.8, 0x3a2215,  5,  fy + 0.5, pz);
      /* Pew back */
      _box(3, 0.6, 0.1, 0x3a2215, -5,  fy + 0.75, pz - 0.35);
      _box(3, 0.6, 0.1, 0x3a2215,  5,  fy + 0.75, pz - 0.35);
    }
    /* Blast door */
    _buildBlastDoor(0, fy + 2.5, -18, 0);
    /* Ritual fire pit */
    _cyl(0.8, 1.0, 0.3, 10, 0x333333, 0, fy + 0.15, 10);
    _cyl(0.5, 0.6, 0.2, 10, 0x111111, 0, fy + 0.35, 10);
    _sphere(0.35, 6, 0xff4400, 0, fy + 0.55, 10);
  }

  /* ── FLOOR 4: Leader's Penthouse ─────────────────────────────────────── */
  function _buildPenthouse() {
    var fy = FLOOR_Y[3];
    /* Nicer floor — carpet */
    _box(38, 0.06, 38, 0x4a1a0a, 0, fy + 0.03, 0);
    /* Leader's throne / desk area */
    _box(3, 0.5, 1.8, 0x5a2a05, 0, fy + 0.25, -14);
    _box(2.6, 0.08, 1.5, 0xcc9944, 0, fy + 0.54, -14); /* desk top */
    /* Chair */
    _box(0.8, 0.4, 0.8, 0x440000, 0, fy + 0.45, -12.8);
    _box(0.8, 1.2, 0.1, 0x440000, 0, fy + 1.0,  -12.4);
    /* Bookshelf wall unit */
    var sx;
    for (sx = -8; sx <= 8; sx += 2) {
      _box(1.8, 3, 0.5, 0x3a2010, sx, fy + 1.5, -19.5);
      /* Book stubs */
      _box(0.18, 0.55, 0.35, 0x882222, sx - 0.6, fy + 0.9, -19.3);
      _box(0.18, 0.7,  0.35, 0x224488, sx - 0.3, fy + 0.9, -19.3);
      _box(0.18, 0.6,  0.35, 0x228844, sx,       fy + 0.9, -19.3);
      _box(0.18, 0.65, 0.35, 0x996633, sx + 0.3, fy + 0.9, -19.3);
      _box(0.18, 0.5,  0.35, 0x333333, sx + 0.6, fy + 0.9, -19.3);
      /* Upper shelf books */
      _box(0.18, 0.55, 0.35, 0xaa3344, sx - 0.5, fy + 1.8, -19.3);
      _box(0.18, 0.7,  0.35, 0x3355aa, sx,       fy + 1.8, -19.3);
      _box(0.18, 0.6,  0.35, 0x55aa33, sx + 0.5, fy + 1.8, -19.3);
    }
    /* Ornate couch */
    _box(3.5, 0.5, 1.2, 0x660000, 8, fy + 0.25, -5);
    _box(3.5, 0.7, 0.2, 0x660000, 8, fy + 0.6,  -4.5);
    _box(0.2, 0.7, 1.2, 0x660000, 6.4, fy + 0.6, -5);
    _box(0.2, 0.7, 1.2, 0x660000, 9.6, fy + 0.6, -5);
    /* Coffee table */
    _box(1.5, 0.08, 0.8, 0xcc9944, 8, fy + 0.5, -3);
    _box(0.06, 0.5, 0.06, 0x886622, 7.4, fy + 0.25, -2.7);
    _box(0.06, 0.5, 0.06, 0x886622, 8.6, fy + 0.25, -2.7);
    _box(0.06, 0.5, 0.06, 0x886622, 7.4, fy + 0.25, -3.3);
    _box(0.06, 0.5, 0.06, 0x886622, 8.6, fy + 0.25, -3.3);
    /* Propaganda portrait on wall */
    _box(0.06, 2.5, 1.8, 0xcc9900, -19.7, fy + 4, 0);
    _lineBox(0.1, 2.6, 1.9, 0xffcc00, -19.7, fy + 4, 0);
    /* Safe behind desk */
    _box(0.6, 0.8, 0.6, 0x334433, 2, fy + 0.9, -19.5);
    _lineBox(0.62, 0.82, 0.62, 0x44ff44, 2, fy + 0.9, -19.5);
    /* Ceiling light fixture */
    _box(0.5, 0.1, 0.5, 0xffffcc, 0, fy + 9.5, 0);
    _sphere(0.25, 6, 0xffffee, 0, fy + 9.2, 0);
    /* Point light for penthouse */
    var pLight = new THREE.PointLight(0xffddbb, 1.2, 20);
    pLight.position.set(0, fy + 8, 0);
    _scene.add(pLight);
    _objects.push(pLight);
    /* Roof platform (top of building) */
    _box(40, 0.5, 40, 0x3a3a3a, 0, fy + 9.75, 0);
  }

  /* =========================================================================
     ENEMY SPAWNING
     ========================================================================= */

  /* Create a humanoid figure mesh group at given position */
  function _makeFigure(bodyColor, headColor, x, y, z) {
    var group = new THREE.Group();
    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    var bodyMesh = new THREE.Mesh(bodyGeo, _mat(bodyColor));
    bodyMesh.position.set(0, 0, 0);
    group.add(bodyMesh);
    /* Head */
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var headMesh = new THREE.Mesh(headGeo, _mat(headColor));
    headMesh.position.set(0, 0.575, 0);
    group.add(headMesh);
    /* Arms */
    var armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    var armL = new THREE.Mesh(armGeo, _mat(bodyColor));
    armL.position.set(-0.325, -0.05, 0);
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, _mat(bodyColor));
    armR.position.set(0.325, -0.05, 0);
    group.add(armR);
    /* Legs */
    var legGeo = new THREE.BoxGeometry(0.18, 0.7, 0.2);
    var legL = new THREE.Mesh(legGeo, _mat(bodyColor));
    legL.position.set(-0.14, -0.75, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, _mat(bodyColor));
    legR.position.set(0.14, -0.75, 0);
    group.add(legR);
    group.position.set(x, y, z);
    _scene.add(group);
    _objects.push(group);
    return group;
  }

  function _spawnEnemies() {
    var i, e, mesh;

    /* ── Floor 1 — Armed guards in armory (tan/green fatigues) ── */
    var armoryGuards = [
      [3, FLOOR_Y[0] + 1.15, -5],
      [-3, FLOOR_Y[0] + 1.15, 3],
      [8, FLOOR_Y[0] + 1.15, -10]
    ];
    for (i = 0; i < armoryGuards.length; i++) {
      mesh = _makeFigure(0x556644, 0xccaa88,
        armoryGuards[i][0], armoryGuards[i][1], armoryGuards[i][2]);
      e = {
        mesh: mesh,
        hp: 60,
        floor: 0,
        alive: true,
        type: 'guard',
        patrol: true,
        patrolDir: (Math.random() > 0.5) ? 1 : -1,
        patrolRange: 4,
        patrolOrigin: armoryGuards[i][2],
        shootCd: Math.random() * 2,
        alertRange: 12,
        damage: 10
      };
      _enemies.push(e);
    }

    /* ── Floor 2 — Sleeping cult followers + 2 guards ── */
    var barrackFollowers = [
      [-8, FLOOR_Y[1] + 1.15, -10],
      [-8, FLOOR_Y[1] + 1.15, -5],
      [-8, FLOOR_Y[1] + 1.15, 0],
      [ 5, FLOOR_Y[1] + 1.15, 5],
      [ 5, FLOOR_Y[1] + 1.15, -8]
    ];
    for (i = 0; i < barrackFollowers.length; i++) {
      mesh = _makeFigure(0xddddcc, 0xffddcc,
        barrackFollowers[i][0], barrackFollowers[i][1], barrackFollowers[i][2]);
      /* Sleeping — lay them on their side */
      mesh.rotation.z = Math.PI * 0.5;
      mesh.position.y = FLOOR_Y[1] + 0.4;
      e = {
        mesh: mesh,
        hp: 30,
        floor: 1,
        alive: true,
        type: 'follower',
        patrol: false,
        patrolDir: 0,
        patrolRange: 0,
        patrolOrigin: barrackFollowers[i][2],
        shootCd: 3,
        alertRange: 6,
        damage: 5,
        sleeping: true
      };
      _enemies.push(e);
    }
    var barrackGuards = [
      [0, FLOOR_Y[1] + 1.15, 10],
      [10, FLOOR_Y[1] + 1.15, -5]
    ];
    for (i = 0; i < barrackGuards.length; i++) {
      mesh = _makeFigure(0x556644, 0xccaa88,
        barrackGuards[i][0], barrackGuards[i][1], barrackGuards[i][2]);
      e = {
        mesh: mesh,
        hp: 60,
        floor: 1,
        alive: true,
        type: 'guard',
        patrol: true,
        patrolDir: 1,
        patrolRange: 5,
        patrolOrigin: barrackGuards[i][2],
        shootCd: Math.random() * 2,
        alertRange: 12,
        damage: 10
      };
      _enemies.push(e);
    }

    /* ── Floor 3 — Praying followers + shrine guards ── */
    var shrineFollowers = [
      [-5, FLOOR_Y[2] + 1.15, -6],
      [ 5, FLOOR_Y[2] + 1.15, -6],
      [-5, FLOOR_Y[2] + 1.15, -2],
      [ 5, FLOOR_Y[2] + 1.15, -2],
      [ 0, FLOOR_Y[2] + 1.15,  8]
    ];
    for (i = 0; i < shrineFollowers.length; i++) {
      mesh = _makeFigure(0xffffff, 0xffddcc,
        shrineFollowers[i][0], shrineFollowers[i][1], shrineFollowers[i][2]);
      /* Bowing / praying — rotate forward */
      mesh.rotation.x = -0.4;
      e = {
        mesh: mesh,
        hp: 25,
        floor: 2,
        alive: true,
        type: 'follower',
        patrol: false,
        patrolDir: 0,
        patrolRange: 2,
        patrolOrigin: shrineFollowers[i][2],
        shootCd: 4,
        alertRange: 8,
        damage: 5,
        praying: true
      };
      _enemies.push(e);
    }
    var shrineGuards = [
      [-10, FLOOR_Y[2] + 1.15, 0],
      [ 10, FLOOR_Y[2] + 1.15, 0]
    ];
    for (i = 0; i < shrineGuards.length; i++) {
      mesh = _makeFigure(0x220022, 0xccaa88,
        shrineGuards[i][0], shrineGuards[i][1], shrineGuards[i][2]);
      e = {
        mesh: mesh,
        hp: 80,
        floor: 2,
        alive: true,
        type: 'elite',
        patrol: true,
        patrolDir: 1,
        patrolRange: 6,
        patrolOrigin: shrineGuards[i][2],
        shootCd: 1.5,
        alertRange: 15,
        damage: 15
      };
      _enemies.push(e);
    }

    /* ── Floor 4 — Leader's guards + The Leader ── */
    var penthouseGuards = [
      [-5, FLOOR_Y[3] + 1.15, -10],
      [ 5, FLOOR_Y[3] + 1.15, -10],
      [-8, FLOOR_Y[3] + 1.15, 5]
    ];
    for (i = 0; i < penthouseGuards.length; i++) {
      mesh = _makeFigure(0x111111, 0xccaa88,
        penthouseGuards[i][0], penthouseGuards[i][1], penthouseGuards[i][2]);
      e = {
        mesh: mesh,
        hp: 100,
        floor: 3,
        alive: true,
        type: 'elite',
        patrol: true,
        patrolDir: 1,
        patrolRange: 4,
        patrolOrigin: penthouseGuards[i][2],
        shootCd: 1.0,
        alertRange: 18,
        damage: 20
      };
      _enemies.push(e);
    }

    /* The Cult Leader — gold robe, larger */
    var leader = _makeFigure(0xcc9900, 0xffcc88, 0, FLOOR_Y[3] + 1.4, -14);
    leader.scale.set(1.3, 1.3, 1.3);
    /* Crown */
    var crownGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.2, 6);
    var crownMesh = new THREE.Mesh(crownGeo, _mat(0xffdd00));
    crownMesh.position.set(0, 0.75, 0);
    leader.add(crownMesh);
    e = {
      mesh: leader,
      hp: 250,
      floor: 3,
      alive: true,
      type: 'leader',
      patrol: true,
      patrolDir: 1,
      patrolRange: 3,
      patrolOrigin: -14,
      shootCd: 2.0,
      alertRange: 20,
      damage: 25,
      isLeader: true
    };
    _enemies.push(e);
  }

  /* =========================================================================
     INPUT HANDLERS
     ========================================================================= */

  function _onKeyDown(e) {
    _keys[e.code] = true;
    if (e.code === 'KeyB') {
      _lastBKey = performance.now();
    }
    if (e.code === 'KeyC') {
      if (performance.now() - _lastBKey < 400) {
        _toggle();
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    _yaw   -= e.movementX * 0.002;
    _pitch -= e.movementY * 0.002;
    _pitch  = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, _pitch));
  }

  function _onMouseDown(e) {
    if (e.button === 0) _mouse.leftDown = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouse.leftDown = false;
  }

  function _onPointerLock() {
    /* no-op; handled by main game */
  }

  /* =========================================================================
     TOGGLE
     ========================================================================= */

  function _toggle() {
    _active = !_active;
    _showNotif(_active ? 'BUNKER COMPLEX: ONLINE' : 'BUNKER COMPLEX: OFFLINE');
    if (_hudEl) {
      _hudEl.style.display = _active ? 'block' : 'none';
    }
  }

  /* =========================================================================
     ELEVATOR LOGIC
     ========================================================================= */

  function _isNearElevator() {
    if (!_elevator) return false;
    var ep = _elevator.position;
    var dx = _playerPos.x - ep.x;
    var dz = _playerPos.z - ep.z;
    return Math.sqrt(dx * dx + dz * dz) < 3.0;
  }

  function _activateElevator() {
    if (_elevatorMoving) return;
    /* Send to next floor up, wrapping around */
    _elevatorFloor = (_elevatorFloor + 1) % 4;
    _elevatorTarget = FLOOR_Y[_elevatorFloor] + 0.25;
    _elevatorMoving = true;
    _showNotif('ELEVATOR → FLOOR ' + (_elevatorFloor + 1) + ' [' + FLOOR_NAMES[_elevatorFloor] + ']');
  }

  function _updateElevator(delta) {
    if (!_elevator) return;
    if (!_elevatorMoving) return;
    var speed = 6;
    var diff  = _elevatorTarget - _elevatorY;
    if (Math.abs(diff) < 0.05) {
      _elevatorY = _elevatorTarget;
      _elevator.position.y = _elevatorY;
      _elevatorMoving = false;
    } else {
      _elevatorY += (diff > 0 ? 1 : -1) * speed * delta;
      _elevator.position.y = _elevatorY;
      /* If player is on elevator, move them with it */
      if (_isNearElevator() && Math.abs(_playerPos.x - _elevator.position.x) < 1.5 &&
          Math.abs(_playerPos.z - _elevator.position.z) < 1.5) {
        _playerPos.y = _elevatorY + 1.45;
      }
    }
  }

  /* =========================================================================
     SHOOTING
     ========================================================================= */

  function _shoot() {
    /* Simple raycast-style check against all alive enemies */
    var i, e, em, dx, dy, dz, dist;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;
      em = e.mesh;
      dx = em.position.x - _playerPos.x;
      dy = em.position.y - _playerPos.y;
      dz = em.position.z - _playerPos.z;
      dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 20) continue;
      /* Check if roughly in line of sight (dot product with camera direction) */
      var camDirX = -Math.sin(_yaw) * Math.cos(_pitch);
      var camDirY =  Math.sin(_pitch);
      var camDirZ = -Math.cos(_yaw) * Math.cos(_pitch);
      var ex = dx / dist, ey = dy / dist, ez = dz / dist;
      var dot = camDirX * ex + camDirY * ey + camDirZ * ez;
      if (dot < 0.92) continue; /* ~23 degree cone */
      /* Hit! */
      e.hp -= 35;
      if (e.hp <= 0) {
        e.alive = false;
        /* Drop mesh to floor */
        em.rotation.z = Math.PI * 0.5;
        em.position.y -= 0.5;
        if (e.isLeader) {
          _leaderAlive = false;
          _showNotif('TARGET ELIMINATED — MISSION COMPLETE');
        }
      }
      break; /* only hit one enemy per shot */
    }
  }

  /* =========================================================================
     ENEMY AI UPDATE
     ========================================================================= */

  function _updateEnemies(delta) {
    var i, e, em, dx, dz, dist, speed;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (!e.alive) continue;
      em = e.mesh;

      /* Only enemies on current floor are active */
      if (e.floor !== currentFloor) continue;

      /* Patrol movement — simple back-and-forth on Z axis */
      if (e.patrol) {
        speed = (e.type === 'elite' || e.type === 'leader') ? 1.5 : 1.0;
        if (e.sleeping) speed = 0;
        em.position.z += e.patrolDir * speed * delta;
        if (em.position.z > e.patrolOrigin + e.patrolRange) {
          e.patrolDir = -1;
          em.rotation.y = Math.PI;
        }
        if (em.position.z < e.patrolOrigin - e.patrolRange) {
          e.patrolDir = 1;
          em.rotation.y = 0;
        }
      }

      /* Shoot at player if close enough */
      dx = _playerPos.x - em.position.x;
      dz = _playerPos.z - em.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < e.alertRange) {
        e.shootCd -= delta;
        if (e.shootCd <= 0) {
          e.shootCd = 1.5 + Math.random();
          /* Wake sleeping followers */
          if (e.sleeping) {
            e.sleeping = false;
            em.rotation.z = 0;
            em.position.y = e.floor < 4 ? FLOOR_Y[e.floor] + 1.15 : em.position.y;
            e.patrol = true;
          }
          /* Deal damage */
          _playerHP -= e.damage;
          if (_playerHP < 0) _playerHP = 0;
        }
      }
    }
  }

  /* =========================================================================
     FLOOR DETECTION
     ========================================================================= */

  function _detectFloor() {
    var py  = _playerPos.y;
    var best = 0;
    var bestDist = Math.abs(py - (FLOOR_Y[0] + 1.7));
    var i, d;
    for (i = 1; i < FLOOR_Y.length; i++) {
      d = Math.abs(py - (FLOOR_Y[i] + 1.7));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    currentFloor = best;
  }

  /* =========================================================================
     CANDLE FLICKER
     ========================================================================= */

  function _updateCandles(delta) {
    _flickerTime += delta;
    var i, c, flicker;
    for (i = 0; i < _candles.length; i++) {
      c = _candles[i];
      if (!c.flame) continue;
      flicker = 0.85 + Math.sin(_flickerTime * 8 + i * 1.3) * 0.15;
      c.flame.scale.set(flicker, flicker, flicker);
      if (c.glow) {
        c.glow.scale.set(flicker, flicker, flicker);
      }
    }
  }

  /* =========================================================================
     PLAYER MOVEMENT
     ========================================================================= */

  function _updatePlayer(delta) {
    var speed = 8;
    var dx = 0, dz = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    dz -= 1;
    if (_keys['KeyS'] || _keys['ArrowDown'])  dz += 1;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  dx -= 1;
    if (_keys['KeyD'] || _keys['ArrowRight']) dx += 1;

    var sinY = Math.sin(_yaw);
    var cosY = Math.cos(_yaw);
    _playerPos.x += (cosY * dx - sinY * dz) * speed * delta;
    _playerPos.z += (sinY * dx + cosY * dz) * speed * delta;

    /* Clamp to arena bounds */
    _playerPos.x = Math.max(-19, Math.min(19, _playerPos.x));
    _playerPos.z = Math.max(-19, Math.min(19, _playerPos.z));

    /* Apply to camera */
    _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  /* =========================================================================
     PUBLIC API
     ========================================================================= */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    _buildLighting();

    /* Build all 4 floors */
    var i;
    for (i = 0; i < 4; i++) {
      _buildFloorPlatform(i);
      _buildPillars(i);
    }

    _buildArmory();
    _buildBarracks();
    _buildShrine();
    _buildPenthouse();
    _buildElevator();
    _spawnEnemies();
    _createHUD();

    /* Set initial player position — floor 1, south side */
    _playerPos.x = 0;
    _playerPos.y = FLOOR_Y[0] + 1.7;
    _playerPos.z = 8;
    _yaw   = Math.PI; /* facing north */
    _pitch = 0;

    /* Input listeners */
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('mouseup',   _onMouseUp);

    _showNotif('B+C to toggle BUNKER COMPLEX');
  }

  function update(delta) {
    if (!_active) return;

    /* E key — elevator */
    var eDown = !!(_keys['KeyE']);
    if (eDown && !_prevEKey) {
      if (_isNearElevator()) {
        _activateElevator();
      }
    }
    _prevEKey = eDown;

    /* Shoot on click */
    _shootCd -= delta;
    if (_mouse.leftDown && !_prevClick) {
      if (_shootCd <= 0) {
        _shoot();
        _shootCd = 0.25;
      }
    }
    _prevClick = _mouse.leftDown;

    _updatePlayer(delta);
    _updateElevator(delta);
    _updateEnemies(delta);
    _updateCandles(delta);
    _detectFloor();
    _updateHUD();
  }

  function reset() {
    /* Remove all owned scene objects */
    var i, obj;
    for (i = 0; i < _objects.length; i++) {
      obj = _objects[i];
      if (obj && _scene) {
        _scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            var m;
            for (m = 0; m < obj.material.length; m++) {
              obj.material[m].dispose();
            }
          } else {
            obj.material.dispose();
          }
        }
      }
    }
    _objects  = [];
    _enemies  = [];
    _candles  = [];

    /* Remove HUD */
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl = null;

    /* Remove input listeners */
    document.removeEventListener('keydown',   _onKeyDown);
    document.removeEventListener('keyup',     _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mousedown', _onMouseDown);
    document.removeEventListener('mouseup',   _onMouseUp);

    /* Reset state */
    _active      = false;
    _keys        = {};
    _mouse       = { x: 0, y: 0, leftDown: false };
    _yaw         = 0;
    _pitch       = 0;
    _prevEKey    = false;
    _prevClick   = false;
    _shootCd     = 0;
    _playerHP    = 100;
    _playerPos   = { x: 0, y: 1.7, z: 8 };
    currentFloor = 0;
    _elevatorY      = 0.25;
    _elevatorTarget = 0.25;
    _elevatorMoving = false;
    _elevatorFloor  = 0;
    _elevator    = null;
    _leaderAlive = true;
    _lastBKey    = 0;
    _flickerTime = 0;
    _scene       = null;
    _camera      = null;
  }

  return { init: init, update: update, reset: reset };

}());
