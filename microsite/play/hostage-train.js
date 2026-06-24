/* ───────────────────────────────────────────────────────────────────────────
   hostage-train.js — Hostage Train FPS Module
   API: window.HostageTrain = { init, update, reset }
   Controls:
     H + T (simultaneous, 400ms window) → activate module
     W / S                              → move forward / backward along train
     A / D                              → strafe left / right
     Mouse                              → look / aim
     Left Click                         → shoot
     E                                  → interact (free hostage / disarm detonator / pull brake lever)
     G                                  → throw grenade
   ─────────────────────────────────────────────────────────────────────────── */

window.HostageTrain = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var ACTIVATE_WINDOW     = 0.4;      // seconds
  var MISSION_TIME        = 360;      // 6 minutes in seconds
  var CAR_WIDTH           = 3;
  var CAR_HEIGHT          = 3;
  var CAR_LENGTH          = 12;
  var CAR_SPACING         = 13;       // gap between car centres
  var NUM_CARS            = 8;
  var TOTAL_HOSTAGES      = 40;
  var HOSTAGES_REQUIRED   = 30;
  var TOTAL_TERRORISTS    = 28;
  var BOSS_HP             = 350;
  var TERRORIST_HP        = 70;
  var ELITE_HP            = 130;
  var PLAYER_HP           = 100;
  var PLAYER_SPEED        = 6;
  var PLAYER_HEIGHT       = 1.7;
  var SHOOT_RANGE         = 40;
  var SHOOT_DAMAGE        = 25;
  var INTERACT_RANGE      = 2.5;
  var FREE_TIME           = 1.5;      // seconds to free a hostage
  var DISARM_TIME         = 4.0;      // seconds to disarm detonator
  var SPEED_BASE          = 300;      // km/h base train speed
  var SPEED_BOOST         = 320;      // km/h at 3 min mark
  var SPEED_SLOW          = 210;      // km/h after emergency brake
  var EXECUTE_INTERVAL    = 180;      // 3 minutes between executions
  var TREE_COUNT          = 80;
  var SCROLL_RATE         = 0.05;     // track scroll per frame
  var GRENADE_FUSE        = 2.5;
  var GRENADE_DAMAGE      = 60;
  var GRENADE_RADIUS      = 5;

  /* ── Colors ─────────────────────────────────────────────────────────────── */
  var COL_CAR_EXT         = 0x334455;
  var COL_CAR_INT         = 0x445566;
  var COL_WINDOW          = 0x88AACC;
  var COL_TERRORIST       = 0x442222;
  var COL_ELITE           = 0x221111;
  var COL_BOSS            = 0x332211;
  var COL_HOSTAGE         = 0x886644;
  var COL_WOOD            = 0x8B6914;
  var COL_METAL           = 0x778899;
  var COL_TRACK           = 0x444444;
  var COL_GROUND          = 0x3A5230;
  var COL_SKY             = 0x87CEEB;
  var COL_TREE_TRUNK      = 0x5C4033;
  var COL_TREE_LEAF       = 0x2D6A2D;
  var COL_CONNECTOR       = 0x223344;
  var COL_FUEL_TANK       = 0x556677;
  var COL_DETONATOR       = 0x883300;
  var COL_SKIN            = 0xE8C090;
  var COL_GUN             = 0x1A1A1A;
  var COL_DOOR            = 0x2A3A4A;
  var COL_SEAT            = 0x6B4226;
  var COL_TABLE           = 0x7A5C3A;

  /* ── Activation keys ────────────────────────────────────────────────────── */
  var _keyPressTime       = { H: 0, T: 0 };
  var _keys               = {};
  var _keysAdded          = false;
  var _mouseX             = 0;
  var _mouseY             = 0;
  var _mouseLocked        = false;
  var _mouseAdded         = false;

  /* ── Scene refs ─────────────────────────────────────────────────────────── */
  var _scene              = null;
  var _camera             = null;

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _active             = false;
  var _gameOver           = false;
  var _won                = false;
  var _timer              = MISSION_TIME;
  var _lastTime           = 0;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerPos          = null;   // THREE.Vector3
  var _playerHP           = PLAYER_HP;
  var _yaw                = 0;
  var _pitch              = 0;
  var _currentCar         = 0;      // 0-indexed, 0=front engine
  var _freeing            = false;
  var _freeTarget         = null;
  var _freeTimer          = 0;
  var _disarming          = false;
  var _disarmTimer        = 0;
  var _brakeUsed          = false;
  var _brakeActive        = false;

  /* ── Train ──────────────────────────────────────────────────────────────── */
  var _trainRoot          = null;   // THREE.Group containing all cars
  var _trainSpeed         = SPEED_BASE;
  var _trackOffset        = 0;
  var _rails              = [];     // meshes for rail scrolling
  var _trees              = [];     // { mesh, side, z } for scrolling
  var _sceneryRoot        = null;

  /* ── Cars ───────────────────────────────────────────────────────────────── */
  var _cars               = [];     // per-car data objects
  /*
    Each car: {
      index, type, group,
      doors: [mesh,...],
      doorLocked: bool,
      hostages: [],
      terrorists: [],
      props: []
    }
  */

  /* ── Terrorists ─────────────────────────────────────────────────────────── */
  var _terrorists         = [];
  /*
    Each: {
      mesh, group, hp, alive, carIndex, isElite, isBoss,
      patrolDir, patrolTimer, alertTimer, alertState,
      pos: THREE.Vector3, vel: THREE.Vector3
    }
  */
  var _bossAlive          = true;
  var _bossDetonating     = false;
  var _bossDetonateTimer  = 0;

  /* ── Hostages ───────────────────────────────────────────────────────────── */
  var _hostages           = [];
  /*
    Each: {
      mesh, group, pos: THREE.Vector3, freed, executed, carIndex
    }
  */
  var _hostageFreeCount   = 0;
  var _executeTimer       = EXECUTE_INTERVAL;

  /* ── Doors ──────────────────────────────────────────────────────────────── */
  var _doors              = [];     // { mesh, carIndex, locked }

  /* ── Grenades ───────────────────────────────────────────────────────────── */
  var _grenades           = [];     // { mesh, vel, fuse, exploded }
  var _grenadeCount       = 4;

  /* ── HUD ─────────────────────────────────────────────────────────────────── */
  var _hud                = null;
  var _hudMsg             = null;   // transient message overlay
  var _hudMsgTimer        = 0;

  /* ── Crosshair flash ───────────────────────────────────────────────────── */
  var _hitFlash           = 0;

  /* ══════════════════════════════════════════════════════════════════════════
     UTILITY
  ══════════════════════════════════════════════════════════════════════════ */

  function getScene() {
    return _scene ||
      (window.GameManager && window.GameManager.scene) ||
      window.scene || null;
  }

  function getCamera() {
    return _camera ||
      (window.GameManager && window.GameManager.camera) ||
      window.camera || null;
  }

  function makeMat(color, opts) {
    var p = { color: color };
    if (opts) { for (var k in opts) { p[k] = opts[k]; } }
    return new THREE.MeshLambertMaterial(p);
  }

  function box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function cyl(rT, rB, h, segs, color, opts) {
    var geo = new THREE.CylinderGeometry(rT, rB, h, segs);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function sph(r, segs, color, opts) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function carCentreZ(carIdx) {
    // Car 0 (engine front) is at z=0; cars extend in -Z direction
    return -carIdx * CAR_SPACING;
  }

  function worldPos(carIdx, lx, ly, lz) {
    // Position relative to train root
    return new THREE.Vector3(lx, ly, carCentreZ(carIdx) + lz);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RIFLE (LineSegments barrel decoration on terrorists)
  ══════════════════════════════════════════════════════════════════════════ */

  function buildRifleLines() {
    var pts = [];
    // barrel
    pts.push(0, 0.1, 0,    0, 0.1, 0.8);
    // stock
    pts.push(0, 0.0, -0.1, 0, 0.1, 0.0);
    // grip
    pts.push(0, 0.0, 0.2,  0, -0.2, 0.2);

    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(pts);
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    var mat = new THREE.LineBasicMaterial({ color: COL_GUN });
    return new THREE.LineSegments(geo, mat);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TERRORIST MESH
  ══════════════════════════════════════════════════════════════════════════ */

  function buildTerroristMesh(isElite, isBoss) {
    var g = new THREE.Group();
    var col = isBoss ? COL_BOSS : isElite ? COL_ELITE : COL_TERRORIST;

    // Body
    var body = box(0.6, 1.0, 0.4, col);
    body.position.y = 0.5;
    g.add(body);

    // Head
    var head = sph(0.22, 8, COL_SKIN);
    head.position.y = 1.25;
    g.add(head);

    // Legs
    var legL = box(0.22, 0.5, 0.22, col);
    legL.position.set(-0.17, 0.0, 0);
    g.add(legL);
    var legR = box(0.22, 0.5, 0.22, col);
    legR.position.set(0.17, 0.0, 0);
    g.add(legR);

    // Arms
    var armL = box(0.18, 0.5, 0.18, col);
    armL.position.set(-0.42, 0.55, 0);
    g.add(armL);
    var armR = box(0.18, 0.5, 0.18, col);
    armR.position.set(0.42, 0.55, 0);
    g.add(armR);

    // Rifle
    var rifle = buildRifleLines();
    rifle.position.set(0.42, 0.65, 0.2);
    g.add(rifle);

    if (isBoss) {
      // Grenade launcher — fat cylinder barrel
      var glBarrel = cyl(0.07, 0.07, 0.9, 8, 0x556677);
      glBarrel.rotation.x = Math.PI / 2;
      glBarrel.position.set(-0.42, 0.65, 0.45);
      g.add(glBarrel);
    }

    if (isElite) {
      // Body armor plate
      var armor = box(0.65, 0.55, 0.12, 0x111122);
      armor.position.set(0, 0.7, 0.21);
      g.add(armor);
    }

    return g;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HOSTAGE MESH
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHostageMesh() {
    var g = new THREE.Group();

    var body = box(0.5, 0.9, 0.35, COL_HOSTAGE);
    body.position.y = 0.45;
    g.add(body);

    var head = sph(0.2, 8, COL_SKIN);
    head.position.y = 1.1;
    g.add(head);

    // Huddled arms
    var armL = box(0.15, 0.35, 0.15, COL_HOSTAGE);
    armL.position.set(-0.35, 0.5, 0.1);
    armL.rotation.z = 0.4;
    g.add(armL);

    var armR = box(0.15, 0.35, 0.15, COL_HOSTAGE);
    armR.position.set(0.35, 0.5, 0.1);
    armR.rotation.z = -0.4;
    g.add(armR);

    return g;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CAR BUILDERS
  ══════════════════════════════════════════════════════════════════════════ */

  function buildCarShell(carIdx, type) {
    var g = new THREE.Group();
    var cz = carCentreZ(carIdx);

    // Floor
    var floor = box(CAR_WIDTH, 0.15, CAR_LENGTH, COL_CAR_INT);
    floor.position.set(0, 0.075, cz);
    g.add(floor);

    // Ceiling
    var ceil = box(CAR_WIDTH, 0.15, CAR_LENGTH, COL_CAR_EXT);
    ceil.position.set(0, CAR_HEIGHT + 0.075, cz);
    g.add(ceil);

    // Left wall panels (with window gaps)
    var wallH = CAR_HEIGHT;
    // bottom strip
    var lwB = box(0.15, 0.8, CAR_LENGTH, COL_CAR_EXT);
    lwB.position.set(-CAR_WIDTH / 2, 0.4, cz);
    g.add(lwB);
    // top strip
    var lwT = box(0.15, 0.5, CAR_LENGTH, COL_CAR_EXT);
    lwT.position.set(-CAR_WIDTH / 2, wallH - 0.25, cz);
    g.add(lwT);

    // Right wall panels
    var rwB = box(0.15, 0.8, CAR_LENGTH, COL_CAR_EXT);
    rwB.position.set(CAR_WIDTH / 2, 0.4, cz);
    g.add(rwB);
    var rwT = box(0.15, 0.5, CAR_LENGTH, COL_CAR_EXT);
    rwT.position.set(CAR_WIDTH / 2, wallH - 0.25, cz);
    g.add(rwT);

    // Windows — every 2 units along the car length
    var wStartZ = cz - CAR_LENGTH / 2 + 1.5;
    for (var wi = 0; wi < 4; wi++) {
      var wz = wStartZ + wi * 2.8;
      // Left window
      var lwWin = box(0.08, 0.9, 1.4, COL_WINDOW, { transparent: true, opacity: 0.5 });
      lwWin.position.set(-CAR_WIDTH / 2, wallH * 0.55, wz);
      g.add(lwWin);
      // Right window
      var rwWin = box(0.08, 0.9, 1.4, COL_WINDOW, { transparent: true, opacity: 0.5 });
      rwWin.position.set(CAR_WIDTH / 2, wallH * 0.55, wz);
      g.add(rwWin);
    }

    // Front/back inner walls with door gaps
    var fWall = box(CAR_WIDTH, CAR_HEIGHT, 0.15, COL_CAR_INT);
    fWall.position.set(0, CAR_HEIGHT / 2, cz + CAR_LENGTH / 2 - 0.075);
    g.add(fWall);

    var bWall = box(CAR_WIDTH, CAR_HEIGHT, 0.15, COL_CAR_INT);
    bWall.position.set(0, CAR_HEIGHT / 2, cz - CAR_LENGTH / 2 + 0.075);
    g.add(bWall);

    // Door gap cut: replace front/back wall mid section
    // Left column of front wall
    var fWallL = box(0.9, CAR_HEIGHT, 0.15, COL_CAR_INT);
    fWallL.position.set(-CAR_WIDTH / 2 + 0.45, CAR_HEIGHT / 2, cz + CAR_LENGTH / 2);
    g.add(fWallL);
    var fWallR = box(0.9, CAR_HEIGHT, 0.15, COL_CAR_INT);
    fWallR.position.set(CAR_WIDTH / 2 - 0.45, CAR_HEIGHT / 2, cz + CAR_LENGTH / 2);
    g.add(fWallR);
    var fWallTop = box(CAR_WIDTH, 0.6, 0.15, COL_CAR_INT);
    fWallTop.position.set(0, CAR_HEIGHT - 0.3, cz + CAR_LENGTH / 2);
    g.add(fWallTop);

    var bWallL = box(0.9, CAR_HEIGHT, 0.15, COL_CAR_INT);
    bWallL.position.set(-CAR_WIDTH / 2 + 0.45, CAR_HEIGHT / 2, cz - CAR_LENGTH / 2);
    g.add(bWallL);
    var bWallR = box(0.9, CAR_HEIGHT, 0.15, COL_CAR_INT);
    bWallR.position.set(CAR_WIDTH / 2 - 0.45, CAR_HEIGHT / 2, cz - CAR_LENGTH / 2);
    g.add(bWallR);
    var bWallTop = box(CAR_WIDTH, 0.6, 0.15, COL_CAR_INT);
    bWallTop.position.set(0, CAR_HEIGHT - 0.3, cz - CAR_LENGTH / 2);
    g.add(bWallTop);

    // Exterior shell
    var extTop = box(CAR_WIDTH + 0.2, 0.2, CAR_LENGTH + 0.1, COL_CAR_EXT);
    extTop.position.set(0, CAR_HEIGHT + 0.2, cz);
    g.add(extTop);

    // Undercarriage
    var undercar = box(CAR_WIDTH - 0.1, 0.3, CAR_LENGTH - 0.2, 0x222233);
    undercar.position.set(0, -0.15, cz);
    g.add(undercar);

    // Wheels
    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 10);
    var wheelMat = makeMat(0x111111);
    var wXs = [-CAR_WIDTH / 2 - 0.12, CAR_WIDTH / 2 + 0.12];
    var wZs = [cz - CAR_LENGTH / 2 + 1.5, cz + CAR_LENGTH / 2 - 1.5];
    for (var wxi = 0; wxi < 2; wxi++) {
      for (var wzi = 0; wzi < 2; wzi++) {
        var wm = new THREE.Mesh(wheelGeo, wheelMat);
        wm.rotation.z = Math.PI / 2;
        wm.position.set(wXs[wxi], -0.25, wZs[wzi]);
        g.add(wm);
      }
    }

    return g;
  }

  function addDoor(g, carIdx, side) {
    var cz = carCentreZ(carIdx);
    var dz = side === 'front' ? cz + CAR_LENGTH / 2 : cz - CAR_LENGTH / 2;
    var dm = box(1.2, 2.0, 0.1, COL_DOOR);
    dm.position.set(0, 1.0, dz);
    g.add(dm);
    _doors.push({ mesh: dm, carIndex: carIdx, locked: false, side: side });
    return dm;
  }

  function addConnector(g, carIdx) {
    // Connector passage between car carIdx and carIdx+1
    var cz = carCentreZ(carIdx) - CAR_LENGTH / 2 - 0.5;
    var conn = box(1.0, 2.0, 1.0, COL_CONNECTOR);
    conn.position.set(0, 1.0, cz);
    g.add(conn);
  }

  function addSeats(g, carIdx, rows, cols) {
    var cz = carCentreZ(carIdx);
    var startZ = cz - CAR_LENGTH / 2 + 1.5;
    var stepZ  = (CAR_LENGTH - 3) / Math.max(rows - 1, 1);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var sx = (c === 0) ? -0.9 : 0.9;
        var seat = box(0.55, 0.35, 0.55, COL_SEAT);
        seat.position.set(sx, 0.3, startZ + r * stepZ);
        g.add(seat);
        var back = box(0.55, 0.6, 0.1, COL_SEAT);
        back.position.set(sx, 0.72, startZ + r * stepZ - 0.28);
        g.add(back);
      }
    }
  }

  function addLuggage(g, carIdx, count) {
    var cz = carCentreZ(carIdx);
    for (var i = 0; i < count; i++) {
      var lx = rnd(-1.0, 1.0);
      var lz = cz + rnd(-CAR_LENGTH / 2 + 1, CAR_LENGTH / 2 - 1);
      var lug = box(rnd(0.4, 0.7), rnd(0.3, 0.55), rnd(0.3, 0.5), COL_WOOD);
      lug.position.set(lx, 0.25, lz);
      g.add(lug);
    }
  }

  function addTables(g, carIdx, count) {
    var cz = carCentreZ(carIdx);
    for (var i = 0; i < count; i++) {
      var tx = (i % 2 === 0) ? -0.7 : 0.7;
      var tz = cz - CAR_LENGTH / 2 + 1.5 + i * 2.2;
      var top = box(0.8, 0.08, 0.8, COL_TABLE);
      top.position.set(tx, 0.72, tz);
      g.add(top);
      var leg = cyl(0.05, 0.05, 0.7, 6, COL_TABLE);
      leg.position.set(tx, 0.36, tz);
      g.add(leg);
    }
  }

  function addKitchen(g, carIdx) {
    var cz = carCentreZ(carIdx);
    var counter = box(0.7, 0.85, CAR_LENGTH * 0.4, COL_METAL);
    counter.position.set(-1.1, 0.425, cz + 1);
    g.add(counter);
    // Stovetop rings
    for (var i = 0; i < 2; i++) {
      var ring = cyl(0.15, 0.15, 0.05, 8, 0x333333);
      ring.position.set(-1.1, 0.87, cz + 0.4 + i * 0.7);
      g.add(ring);
    }
  }

  function addCrates(g, carIdx, count) {
    var cz = carCentreZ(carIdx);
    for (var i = 0; i < count; i++) {
      var cx = rnd(-0.9, 0.9);
      var czz = cz + rnd(-CAR_LENGTH / 2 + 1, CAR_LENGTH / 2 - 1);
      var cr = box(0.6, 0.6, 0.6, COL_WOOD);
      cr.position.set(cx, 0.3, czz);
      g.add(cr);
    }
  }

  function addFuelTank(g, carIdx) {
    var cz = carCentreZ(carIdx);
    var ft = cyl(0.5, 0.5, 2.5, 10, COL_FUEL_TANK);
    ft.rotation.z = Math.PI / 2;
    ft.position.set(0.5, 0.55, cz - 2);
    g.add(ft);
  }

  function addDetonatorConsole(g, carIdx) {
    var cz = carCentreZ(carIdx);
    var base = box(0.8, 0.7, 0.5, COL_METAL);
    base.position.set(0, 0.35, cz - CAR_LENGTH / 2 + 2);
    g.add(base);
    var screen = box(0.6, 0.4, 0.05, COL_DETONATOR);
    screen.position.set(0, 0.65, cz - CAR_LENGTH / 2 + 2.25);
    g.add(screen);
    // Mark it for interact detection
    screen.userData.isDetonator = true;
    _detonatorMesh = screen;
  }

  function addBrakeLever(g, carIdx) {
    var cz = carCentreZ(carIdx);
    var lever = box(0.1, 0.6, 0.1, COL_METAL);
    lever.position.set(-1.3, 0.9, cz + CAR_LENGTH / 2 - 1.0);
    g.add(lever);
    lever.userData.isBrakeLever = true;
    _brakeLeverMesh = lever;
  }

  /* ── Detonator + brake references ─────────────────────────────────────── */
  var _detonatorMesh  = null;
  var _brakeLeverMesh = null;

  /* ══════════════════════════════════════════════════════════════════════════
     SPAWN HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnTerrorist(carIdx, isElite, isBoss) {
    var cz = carCentreZ(carIdx);
    var g = buildTerroristMesh(isElite, isBoss);
    var px = rnd(-0.8, 0.8);
    var pz = cz + rnd(-CAR_LENGTH / 2 + 1.5, CAR_LENGTH / 2 - 1.5);
    g.position.set(px, 0, pz);
    _trainRoot.add(g);

    var hp = isBoss ? BOSS_HP : isElite ? ELITE_HP : TERRORIST_HP;

    var t = {
      group: g,
      hp: hp,
      alive: true,
      carIndex: carIdx,
      isElite: isElite,
      isBoss: isBoss,
      patrolDir: rnd(-1, 1) > 0 ? 1 : -1,
      patrolTimer: rnd(1.5, 3.0),
      alertTimer: 0,
      alertState: false,
      pos: new THREE.Vector3(px, 0, pz),
      vel: new THREE.Vector3(0, 0, 0),
      shootTimer: rnd(1.0, 2.5)
    };
    _terrorists.push(t);
    return t;
  }

  function spawnHostage(carIdx, localX, localZ) {
    var cz = carCentreZ(carIdx);
    var g = buildHostageMesh();
    var wx = localX;
    var wz = cz + localZ;
    g.position.set(wx, 0, wz);
    _trainRoot.add(g);

    var h = {
      group: g,
      pos: new THREE.Vector3(wx, 0, wz),
      freed: false,
      executed: false,
      carIndex: carIdx
    };
    _hostages.push(h);
    return h;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCENERY: TRACK & COUNTRYSIDE
  ══════════════════════════════════════════════════════════════════════════ */

  function buildTrack(scene) {
    _sceneryRoot = new THREE.Group();
    scene.add(_sceneryRoot);

    // Ground plane
    var gndGeo = new THREE.BoxGeometry(60, 0.3, 600);
    var gndMat = makeMat(COL_GROUND);
    var gnd = new THREE.Mesh(gndGeo, gndMat);
    gnd.position.set(0, -0.8, -(NUM_CARS * CAR_SPACING) / 2);
    _sceneryRoot.add(gnd);

    // Rails — two long cylinders
    for (var ri = 0; ri < 2; ri++) {
      var rx = ri === 0 ? -0.75 : 0.75;
      var rail = cyl(0.08, 0.08, 600, 8, COL_TRACK);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(rx, -0.5, -(NUM_CARS * CAR_SPACING) / 2);
      _sceneryRoot.add(rail);
      _rails.push(rail);
    }

    // Sleepers (cross ties)
    for (var si = 0; si < 80; si++) {
      var slp = box(2.0, 0.12, 0.22, 0x5C4033);
      slp.position.set(0, -0.6, -si * 7.5);
      slp.userData.isSleeper = true;
      slp.userData.baseZ = -si * 7.5;
      _sceneryRoot.add(slp);
    }

    // Trees
    for (var ti = 0; ti < TREE_COUNT; ti++) {
      var side = ti % 2 === 0 ? -1 : 1;
      var tx = side * rnd(8, 20);
      var tz = rnd(-300, 0);
      var treeH = rnd(3, 6);

      var trunk = cyl(0.2, 0.3, treeH, 6, COL_TREE_TRUNK);
      trunk.position.set(tx, treeH / 2 - 0.5, tz);
      _sceneryRoot.add(trunk);

      var foliage = cyl(0, rnd(1.2, 2.2), rnd(2.5, 4.0), 7, COL_TREE_LEAF);
      foliage.position.set(tx, treeH + 0.5, tz);
      _sceneryRoot.add(foliage);

      _trees.push({ trunk: trunk, foliage: foliage, side: side, baseZ: tz });
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD ALL CARS
  ══════════════════════════════════════════════════════════════════════════ */

  function buildTrain(scene) {
    _trainRoot = new THREE.Group();
    scene.add(_trainRoot);

    var i;

    /* ── Car 0 (index 0): Engine Front ── */
    var c0 = buildCarShell(0, 'engine');
    addDoor(_trainRoot, 0, 'front');
    addBrakeLever(_trainRoot, 0);
    // Driver's cab
    var cab = box(2.0, CAR_HEIGHT - 0.2, 1.5, 0x223344);
    cab.position.set(0, CAR_HEIGHT / 2, carCentreZ(0) + CAR_LENGTH / 2 - 0.75);
    _trainRoot.add(cab);
    var panel = box(1.5, 0.8, 0.1, COL_METAL);
    panel.position.set(0, 1.5, carCentreZ(0) + CAR_LENGTH / 2 - 0.5);
    _trainRoot.add(panel);
    _trainRoot.add(c0);
    addConnector(_trainRoot, 0);
    _cars.push({ index: 0, type: 'engine', cleared: false });

    // Car 0 occupants: 2 terrorists
    spawnTerrorist(0, false, false);
    spawnTerrorist(0, false, false);
    // Car 0: Driver hostage (civilian held at gunpoint)
    spawnHostage(0, 0, carCentreZ(0) + 4.5 - carCentreZ(0));

    /* ── Cars 1-2 (index 1,2): First Class ── */
    for (i = 1; i <= 2; i++) {
      var ci = buildCarShell(i, 'firstclass');
      addLuggage(_trainRoot, i, 5);
      addSeats(_trainRoot, i, 4, 2);
      _trainRoot.add(ci);
      addConnector(_trainRoot, i);
      _cars.push({ index: i, type: 'firstclass', cleared: false });

      // 5 hostages per car
      var hStepZ = (CAR_LENGTH - 3) / 4;
      for (var hi = 0; hi < 5; hi++) {
        var hx = (hi % 2 === 0) ? -0.8 : 0.8;
        var hz = -CAR_LENGTH / 2 + 1.5 + hi * hStepZ;
        spawnHostage(i, hx, hz);
      }

      // 3-4 terrorists
      var tCount = (i === 1) ? 3 : 4;
      for (var ti2 = 0; ti2 < tCount; ti2++) {
        spawnTerrorist(i, false, false);
      }
    }

    /* ── Cars 3-4 (index 3,4): Economy Class ── */
    for (i = 3; i <= 4; i++) {
      var cec = buildCarShell(i, 'economy');
      addSeats(_trainRoot, i, 6, 2);
      _trainRoot.add(cec);
      addConnector(_trainRoot, i);
      _cars.push({ index: i, type: 'economy', cleared: false });

      // 8 hostages
      var eStepZ = (CAR_LENGTH - 3) / 7;
      for (var ehi = 0; ehi < 8; ehi++) {
        var ehx = (ehi % 2 === 0) ? -0.8 : 0.8;
        var ehz = -CAR_LENGTH / 2 + 1.5 + ehi * eStepZ;
        spawnHostage(i, ehx, ehz);
      }

      // 5 terrorists
      for (var eti = 0; eti < 5; eti++) {
        spawnTerrorist(i, false, false);
      }
    }

    /* ── Car 5 (index 5): Dining Car ── */
    var cd = buildCarShell(5, 'dining');
    addTables(_trainRoot, 5, 4);
    addKitchen(_trainRoot, 5);
    _trainRoot.add(cd);
    addConnector(_trainRoot, 5);
    _cars.push({ index: 5, type: 'dining', cleared: false });

    // 4 hostages
    var dStepZ = (CAR_LENGTH - 3) / 3;
    for (var dhi = 0; dhi < 4; dhi++) {
      var dhx = (dhi % 2 === 0) ? -0.7 : 0.7;
      var dhz = -CAR_LENGTH / 2 + 1.5 + dhi * dStepZ;
      spawnHostage(5, dhx, dhz);
    }

    // 4 terrorists
    for (var dti = 0; dti < 4; dti++) {
      spawnTerrorist(5, false, false);
    }

    /* ── Car 6 (index 6): Cargo Car ── */
    var cc = buildCarShell(6, 'cargo');
    addCrates(_trainRoot, 6, 8);
    addFuelTank(_trainRoot, 6);
    _trainRoot.add(cc);
    addConnector(_trainRoot, 6);
    _cars.push({ index: 6, type: 'cargo', cleared: false });

    // 6 terrorists, no hostages
    for (var cti = 0; cti < 6; cti++) {
      spawnTerrorist(6, false, false);
    }

    /* ── Car 7 (index 7): Rear Locomotive (Boss Car) ── */
    var cl = buildCarShell(7, 'rear-loco');
    addDetonatorConsole(_trainRoot, 7);
    _trainRoot.add(cl);
    _cars.push({ index: 7, type: 'rear-loco', cleared: false });

    // Boss
    var boss = spawnTerrorist(7, false, true);

    // 4 elite guards
    for (var eli = 0; eli < 4; eli++) {
      spawnTerrorist(7, true, false);
    }

    // Rear engine cowling
    var cowl = box(CAR_WIDTH + 0.2, CAR_HEIGHT + 0.3, 1.5, 0x223344);
    cowl.position.set(0, CAR_HEIGHT / 2, carCentreZ(7) - CAR_LENGTH / 2 + 0.75);
    _trainRoot.add(cowl);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'ht-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'white-space:nowrap',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_hud);

    _hudMsg = document.createElement('div');
    _hudMsg.id = 'ht-msg';
    _hudMsg.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#ffdd00',
      'font-family:monospace',
      'font-size:22px',
      'padding:18px 32px',
      'border:2px solid #ffdd00',
      'border-radius:6px',
      'text-align:center',
      'pointer-events:none',
      'z-index:10000',
      'display:none'
    ].join(';');
    document.body.appendChild(_hudMsg);
  }

  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateHUD() {
    if (!_hud) return;
    var carsCleared = 0;
    for (var i = 0; i < _cars.length; i++) {
      if (_cars[i].cleared) carsCleared++;
    }
    var bombStatus = _bossAlive ? 'ACTIVE' : 'ELIMINATED';
    _hud.textContent = 'HOSTAGE TRAIN' +
      '  [CARS CLEARED: ' + carsCleared + '/' + NUM_CARS + ']' +
      '  [HOSTAGES: ' + _hostageFreeCount + '/' + TOTAL_HOSTAGES + ' RESCUED]' +
      '  [TIMER: ' + formatTime(_timer) + ']' +
      '  [SPEED: ' + Math.round(_trainSpeed) + ' km/h]' +
      '  [BOMB-MAKER: ' + bombStatus + ']' +
      '  [HP: ' + Math.max(0, Math.round(_playerHP)) + ']';
  }

  function showMsg(text, dur) {
    if (!_hudMsg) return;
    _hudMsg.textContent = text;
    _hudMsg.style.display = 'block';
    _hudMsgTimer = dur || 2.5;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT SETUP
  ══════════════════════════════════════════════════════════════════════════ */

  function setupInput() {
    if (_keysAdded) return;
    _keysAdded = true;

    document.addEventListener('keydown', function (e) {
      _keys[e.code] = true;

      if (e.code === 'KeyH') { _keyPressTime.H = performance.now(); }
      if (e.code === 'KeyT') { _keyPressTime.T = performance.now(); }

      // Check activation
      if (!_active) {
        var diff = Math.abs(_keyPressTime.H - _keyPressTime.T);
        if (_keys['KeyH'] && _keys['KeyT'] && diff < ACTIVATE_WINDOW * 1000) {
          activateModule();
        }
      }
    });

    document.addEventListener('keyup', function (e) {
      _keys[e.code] = false;
    });
  }

  function setupMouse() {
    if (_mouseAdded) return;
    _mouseAdded = true;

    document.addEventListener('mousemove', function (e) {
      if (!_active || !_mouseLocked) return;
      _yaw   -= e.movementX * 0.002;
      _pitch -= e.movementY * 0.002;
      _pitch  = clamp(_pitch, -Math.PI / 3, Math.PI / 3);
    });

    document.addEventListener('mousedown', function (e) {
      if (!_active) return;
      if (e.button === 0) {
        doShoot();
      }
    });

    document.addEventListener('click', function () {
      if (_active && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', function () {
      _mouseLocked = document.pointerLockElement === document.body;
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATE
  ══════════════════════════════════════════════════════════════════════════ */

  function activateModule() {
    if (_active) return;
    _active = true;

    var scene  = getScene();
    var camera = getCamera();
    if (!scene || !camera) {
      _active = false;
      return;
    }
    _scene  = scene;
    _camera = camera;

    // Clear any old scene objects
    resetScene();

    buildTrack(scene);
    buildTrain(scene);
    buildHUD();

    // Position player at front of car 0
    _playerPos = new THREE.Vector3(0, PLAYER_HEIGHT, carCentreZ(0) + CAR_LENGTH / 2 - 2);
    _currentCar = 0;
    _playerHP = PLAYER_HP;
    _timer = MISSION_TIME;
    _trainSpeed = SPEED_BASE;
    _gameOver = false;
    _won = false;
    _bossAlive = true;
    _bossDetonating = false;
    _hostageFreeCount = 0;
    _executeTimer = EXECUTE_INTERVAL;
    _grenadeCount = 4;
    _freeing = false;
    _disarming = false;
    _brakeUsed = false;

    _lastTime = performance.now();

    if (_hud) _hud.style.display = 'block';

    // Set up lighting
    if (!scene.getObjectByName('ht-ambient')) {
      var amb = new THREE.AmbientLight(0xffffff, 0.55);
      amb.name = 'ht-ambient';
      scene.add(amb);

      var sun = new THREE.DirectionalLight(0xfff5cc, 0.9);
      sun.name = 'ht-sun';
      sun.position.set(30, 60, -40);
      scene.add(sun);
    }

    document.body.requestPointerLock();

    showMsg('HOSTAGE TRAIN\nH+T to activate — already active!\nObjective: Rescue 30+ hostages & eliminate bomb-maker!', 3.5);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function doShoot() {
    if (!_active || _gameOver) return;
    var camera = getCamera();
    if (!camera) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);

    var best = null;
    var bestDist = SHOOT_RANGE;

    for (var i = 0; i < _terrorists.length; i++) {
      var t = _terrorists[i];
      if (!t.alive) continue;
      var toT = t.pos.clone().sub(camera.position);
      var dot = toT.normalize().dot(dir);
      if (dot < 0.95) continue;
      var d = dist3(camera.position, t.pos);
      if (d < bestDist) {
        bestDist = d;
        best = t;
      }
    }

    if (best) {
      best.hp -= SHOOT_DAMAGE;
      _hitFlash = 0.15;
      if (best.hp <= 0) {
        killTerrorist(best);
      } else {
        // Alert on hit
        best.alertState = true;
        best.alertTimer = 15;
        triggerAlert(best.carIndex);
      }
    }
  }

  function killTerrorist(t) {
    t.alive = false;
    t.group.visible = false;
    if (t.isBoss) {
      _bossAlive = false;
      _bossDetonating = false;
      showMsg('BOMB-MAKER ELIMINATED!\nNow rescue ' + HOSTAGES_REQUIRED + '+ hostages!', 3);
    }
    checkCarCleared(t.carIndex);
  }

  function triggerAlert(carIdx) {
    for (var i = 0; i < _terrorists.length; i++) {
      if (_terrorists[i].carIndex === carIdx && _terrorists[i].alive) {
        _terrorists[i].alertState = true;
        _terrorists[i].alertTimer = 20;
      }
    }
    // Lock doors in this car
    for (var d = 0; d < _doors.length; d++) {
      if (_doors[d].carIndex === carIdx) {
        _doors[d].locked = true;
        _doors[d].mesh.material.color.setHex(0x880000);
      }
    }
  }

  function checkCarCleared(carIdx) {
    var alive = 0;
    for (var i = 0; i < _terrorists.length; i++) {
      if (_terrorists[i].carIndex === carIdx && _terrorists[i].alive) alive++;
    }
    if (alive === 0) {
      for (var c = 0; c < _cars.length; c++) {
        if (_cars[c].index === carIdx && !_cars[c].cleared) {
          _cars[c].cleared = true;
          showMsg('CAR ' + (carIdx + 1) + ' CLEARED!', 1.5);
          // Unlock doors
          for (var d = 0; d < _doors.length; d++) {
            if (_doors[d].carIndex === carIdx) {
              _doors[d].locked = false;
              _doors[d].mesh.material.color.setHex(COL_DOOR);
            }
          }
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GRENADES
  ══════════════════════════════════════════════════════════════════════════ */

  function throwGrenade() {
    if (!_active || _gameOver || _grenadeCount <= 0) return;
    var camera = getCamera();
    if (!camera) return;

    _grenadeCount--;
    var scene = getScene();

    var gm = sph(0.12, 6, 0x445511);
    var startPos = camera.position.clone();
    startPos.y -= 0.1;
    gm.position.copy(startPos);
    scene.add(gm);

    var dir = new THREE.Vector3(0, 0.2, -1);
    dir.applyQuaternion(camera.quaternion);
    dir.multiplyScalar(12);

    _grenades.push({
      mesh: gm,
      vel: dir,
      fuse: GRENADE_FUSE,
      exploded: false
    });
  }

  function updateGrenades(dt) {
    var gravity = -9.8;
    for (var i = _grenades.length - 1; i >= 0; i--) {
      var gr = _grenades[i];
      if (gr.exploded) { _grenades.splice(i, 1); continue; }

      gr.fuse -= dt;
      gr.vel.y += gravity * dt;
      gr.mesh.position.x += gr.vel.x * dt;
      gr.mesh.position.y += gr.vel.y * dt;
      gr.mesh.position.z += gr.vel.z * dt;

      // Bounce on floor
      if (gr.mesh.position.y < 0.12) {
        gr.mesh.position.y = 0.12;
        gr.vel.y = Math.abs(gr.vel.y) * 0.3;
        gr.vel.x *= 0.6;
        gr.vel.z *= 0.6;
      }

      if (gr.fuse <= 0) {
        explodeGrenade(gr);
        _grenades.splice(i, 1);
      }
    }
  }

  function explodeGrenade(gr) {
    gr.exploded = true;
    var scene = getScene();
    if (scene) scene.remove(gr.mesh);

    var ep = gr.mesh.position;

    // Damage terrorists
    for (var i = 0; i < _terrorists.length; i++) {
      var t = _terrorists[i];
      if (!t.alive) continue;
      var d = dist3(ep, t.pos);
      if (d < GRENADE_RADIUS) {
        var dmg = GRENADE_DAMAGE * (1 - d / GRENADE_RADIUS);
        t.hp -= dmg;
        if (t.hp <= 0) killTerrorist(t);
      }
    }

    // Player splash damage
    if (_playerPos) {
      var pd = dist3(ep, _playerPos);
      if (pd < GRENADE_RADIUS) {
        _playerHP -= GRENADE_DAMAGE * (1 - pd / GRENADE_RADIUS) * 0.5;
      }
    }

    // Flash effect
    _hitFlash = 0.3;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ══════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var camera = getCamera();
    if (!camera || !_playerPos) return;

    var speed = PLAYER_SPEED;
    if (_trainSpeed >= SPEED_BOOST) speed *= 1.2; // turbulence speed boost

    // Gun sway (apply to pitch noise)
    var swayAmp = _trainSpeed >= SPEED_BOOST ? 0.008 : 0.003;
    _pitch += (Math.random() - 0.5) * swayAmp;
    _pitch  = clamp(_pitch, -Math.PI / 3, Math.PI / 3);

    // Build movement vector from WASD
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(new THREE.Euler(0, _yaw, 0));
    var right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, _yaw, 0));

    var moveZ = 0, moveX = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    moveZ -= 1;
    if (_keys['KeyS'] || _keys['ArrowDown'])  moveZ += 1;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  moveX -= 1;
    if (_keys['KeyD'] || _keys['ArrowRight']) moveX += 1;

    _playerPos.addScaledVector(fwd, -moveZ * speed * dt);
    _playerPos.addScaledVector(right, moveX * speed * dt);

    // Clamp player inside train corridor
    _playerPos.x = clamp(_playerPos.x, -CAR_WIDTH / 2 + 0.3, CAR_WIDTH / 2 - 0.3);

    // Determine current car from Z position
    var totalLen = NUM_CARS * CAR_SPACING;
    var relZ = _playerPos.z;
    // Car 0 front edge: CAR_LENGTH/2, Car N-1 rear: -(N-1)*CAR_SPACING - CAR_LENGTH/2
    for (var ci = 0; ci < NUM_CARS; ci++) {
      var czz = carCentreZ(ci);
      if (relZ >= czz - CAR_LENGTH / 2 && relZ <= czz + CAR_LENGTH / 2) {
        _currentCar = ci;
        break;
      }
    }

    // Clamp to train bounds
    var frontZ = carCentreZ(0) + CAR_LENGTH / 2 - 0.3;
    var rearZ  = carCentreZ(NUM_CARS - 1) - CAR_LENGTH / 2 + 0.3;
    _playerPos.z = clamp(_playerPos.z, rearZ, frontZ);
    _playerPos.y = PLAYER_HEIGHT;

    // Apply to camera
    camera.position.copy(_playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = _yaw;
    camera.rotation.x = _pitch;

    // Grenade
    if (_keys['KeyG'] && !_keys['_gPrev']) {
      throwGrenade();
    }
    _keys['_gPrev'] = _keys['KeyG'];

    // Interact (E)
    if (_keys['KeyE']) {
      handleInteract(dt);
    } else {
      _freeing = false;
      _disarming = false;
    }
  }

  function handleInteract(dt) {
    if (!_playerPos) return;

    // Check hostage freeing
    if (!_freeing) {
      for (var hi = 0; hi < _hostages.length; hi++) {
        var h = _hostages[hi];
        if (h.freed || h.executed) continue;
        var d = dist3(_playerPos, h.pos);
        if (d < INTERACT_RANGE) {
          _freeing = true;
          _freeTarget = h;
          _freeTimer = 0;
          showMsg('Freeing hostage...', FREE_TIME);
          break;
        }
      }
    }

    if (_freeing && _freeTarget) {
      _freeTimer += dt;
      if (_freeTimer >= FREE_TIME) {
        _freeTarget.freed = true;
        _freeTarget.group.visible = false; // runs to safe car (simplified)
        _hostageFreeCount++;
        showMsg('Hostage freed! (' + _hostageFreeCount + '/' + TOTAL_HOSTAGES + ')', 1.5);
        _freeing = false;
        _freeTarget = null;
        checkWinCondition();
      }
      return;
    }

    // Check detonator disarming
    if (_detonatorMesh && !_bossAlive && !_disarming) {
      var dd = dist3(_playerPos, _detonatorMesh.getWorldPosition(new THREE.Vector3()));
      if (dd < INTERACT_RANGE * 2) {
        _disarming = true;
        _disarmTimer = 0;
        showMsg('Disarming detonator... hold E', DISARM_TIME);
      }
    }

    if (_disarming) {
      _disarmTimer += dt;
      if (_disarmTimer >= DISARM_TIME) {
        _disarming = false;
        showMsg('DETONATOR DISARMED!', 2.5);
        if (_detonatorMesh) _detonatorMesh.material.color.setHex(0x00aa44);
        checkWinCondition();
      }
    }

    // Emergency brake lever
    if (_brakeLeverMesh && !_brakeUsed) {
      var bl = dist3(_playerPos, _brakeLeverMesh.getWorldPosition(new THREE.Vector3()));
      if (bl < INTERACT_RANGE) {
        _brakeUsed = true;
        _brakeActive = true;
        showMsg('EMERGENCY BRAKE ENGAGED!\n+90 seconds added!', 3);
        _timer += 90;
        _trainSpeed = SPEED_SLOW;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TERRORIST AI
  ══════════════════════════════════════════════════════════════════════════ */

  function updateTerrorists(dt) {
    var playerPos = _playerPos;
    if (!playerPos) return;

    for (var i = 0; i < _terrorists.length; i++) {
      var t = _terrorists[i];
      if (!t.alive) continue;

      var dToPlayer = dist3(playerPos, t.pos);

      // Alert detection
      if (dToPlayer < 10) {
        t.alertState = true;
        t.alertTimer = Math.max(t.alertTimer, 8);
      }

      if (t.alertTimer > 0) {
        t.alertTimer -= dt;
        if (t.alertTimer <= 0) t.alertState = false;
      }

      if (t.alertState) {
        // Chase player (within car boundaries)
        var dir = new THREE.Vector3(
          playerPos.x - t.pos.x,
          0,
          playerPos.z - t.pos.z
        );
        if (dir.length() > 0.1) dir.normalize();
        var tSpeed = t.isElite ? 4.0 : t.isBoss ? 2.5 : 3.0;
        t.pos.x += dir.x * tSpeed * dt;
        t.pos.z += dir.z * tSpeed * dt;

        // Shoot at player
        t.shootTimer -= dt;
        if (t.shootTimer <= 0) {
          t.shootTimer = t.isBoss ? 0.8 : t.isElite ? 1.0 : 1.5;
          if (dToPlayer < SHOOT_RANGE) {
            var dmg = t.isBoss ? 18 : t.isElite ? 14 : 10;
            // Accuracy falloff
            if (dToPlayer < 5 || Math.random() < 0.45) {
              _playerHP -= dmg;
            }
          }
        }
      } else {
        // Patrol
        t.patrolTimer -= dt;
        if (t.patrolTimer <= 0) {
          t.patrolDir *= -1;
          t.patrolTimer = rnd(1.5, 3.5);
        }
        var czCar = carCentreZ(t.carIndex);
        t.pos.z += t.patrolDir * 1.8 * dt;
        // Clamp patrol inside car
        t.pos.z = clamp(t.pos.z,
          czCar - CAR_LENGTH / 2 + 0.5,
          czCar + CAR_LENGTH / 2 - 0.5);
      }

      // Clamp X inside car
      t.pos.x = clamp(t.pos.x, -CAR_WIDTH / 2 + 0.35, CAR_WIDTH / 2 - 0.35);

      t.group.position.set(t.pos.x, 0, t.pos.z);
      // Face player
      if (t.alertState) {
        var angle = Math.atan2(playerPos.x - t.pos.x, playerPos.z - t.pos.z);
        t.group.rotation.y = angle;
      }
    }

    // Boss detonation sequence
    if (!_bossAlive) return;
    var boss = null;
    for (var bi = 0; bi < _terrorists.length; bi++) {
      if (_terrorists[bi].isBoss && _terrorists[bi].alive) {
        boss = _terrorists[bi];
        break;
      }
    }
    if (boss && _timer <= 60 && !_bossDetonating) {
      _bossDetonating = true;
      showMsg('BOMB-MAKER ACTIVATING MANUAL DETONATION!\nKILL HIM NOW!', 3);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HOSTAGE EXECUTION PRESSURE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateHostageExecutions(dt) {
    _executeTimer -= dt;
    if (_executeTimer <= 0) {
      _executeTimer = EXECUTE_INTERVAL;

      // Find a live non-freed hostage
      var candidates = [];
      for (var i = 0; i < _hostages.length; i++) {
        if (!_hostages[i].freed && !_hostages[i].executed) {
          candidates.push(i);
        }
      }
      if (candidates.length > 0) {
        var idx = candidates[Math.floor(Math.random() * candidates.length)];
        var h = _hostages[idx];
        h.executed = true;
        h.group.visible = false;
        showMsg('A HOSTAGE HAS BEEN EXECUTED!', 3);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCENERY SCROLL
  ══════════════════════════════════════════════════════════════════════════ */

  function updateScenery(dt) {
    // Scroll trees and sleepers to simulate train movement
    var scrollSpeed = (_trainSpeed / 3.6) * dt; // convert km/h to m/s

    if (!_sceneryRoot) return;
    _sceneryRoot.traverse(function (obj) {
      if (obj.userData && obj.userData.isSleeper) {
        obj.position.z += scrollSpeed;
        if (obj.position.z > 50) {
          obj.position.z -= 600;
        }
      }
    });

    for (var i = 0; i < _trees.length; i++) {
      var t = _trees[i];
      t.trunk.position.z += scrollSpeed;
      t.foliage.position.z += scrollSpeed;
      if (t.trunk.position.z > 80) {
        t.trunk.position.z -= 380;
        t.foliage.position.z -= 380;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     WIN / LOSE CHECK
  ══════════════════════════════════════════════════════════════════════════ */

  function checkWinCondition() {
    if (_gameOver) return;
    if (!_bossAlive && _hostageFreeCount >= HOSTAGES_REQUIRED) {
      _gameOver = true;
      _won = true;
      showMsg('MISSION COMPLETE!\nBomb-maker eliminated!\n' + _hostageFreeCount + ' hostages rescued!\nTrain secured!', 0);
    }
  }

  function checkLoseCondition() {
    if (_gameOver) return;
    if (_timer <= 0) {
      _gameOver = true;
      _won = false;
      var msg;
      if (_hostageFreeCount >= HOSTAGES_REQUIRED && !_bossAlive) {
        // Timer ran out but conditions met
        _won = true;
        msg = 'MISSION COMPLETE (last second)!\n' + _hostageFreeCount + ' hostages rescued!';
      } else {
        msg = 'MISSION FAILED!\nThe train reached the tunnel.\n' +
          _hostageFreeCount + ' hostages rescued — needed ' + HOSTAGES_REQUIRED + '.';
      }
      showMsg(msg, 0);
    }
    if (_playerHP <= 0) {
      _gameOver = true;
      _won = false;
      showMsg('AGENT DOWN!\nMISSION FAILED.', 0);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function update() {
    if (!_active) return;

    var now = performance.now();
    var dt  = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    if (_gameOver) {
      // Still update HUD
      updateHUD();
      if (_hudMsgTimer > 0) { _hudMsgTimer -= dt; }
      return;
    }

    // Countdown timer
    _timer -= dt;

    // Speed increase at 3-minute mark
    if (_timer <= 180 && _trainSpeed < SPEED_BOOST && !_brakeActive) {
      _trainSpeed = SPEED_BOOST;
      showMsg('TRAIN ACCELERATING TO ' + SPEED_BOOST + ' km/h!\nTurbulence increasing!', 2.5);
    }

    // Update systems
    updatePlayer(dt);
    updateTerrorists(dt);
    updateGrenades(dt);
    updateHostageExecutions(dt);
    updateScenery(dt);

    // Hit flash fade
    if (_hitFlash > 0) _hitFlash = Math.max(0, _hitFlash - dt);

    // Transient message timer
    if (_hudMsgTimer > 0) {
      _hudMsgTimer -= dt;
      if (_hudMsgTimer <= 0) {
        if (_hudMsg) _hudMsg.style.display = 'none';
      }
    }

    checkLoseCondition();
    checkWinCondition();
    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RESET / CLEANUP
  ══════════════════════════════════════════════════════════════════════════ */

  function resetScene() {
    var scene = getScene();
    if (!scene) return;

    if (_trainRoot) { scene.remove(_trainRoot); _trainRoot = null; }
    if (_sceneryRoot) { scene.remove(_sceneryRoot); _sceneryRoot = null; }

    // Remove old lighting added by this module
    var oldAmb = scene.getObjectByName('ht-ambient');
    var oldSun = scene.getObjectByName('ht-sun');
    if (oldAmb) scene.remove(oldAmb);
    if (oldSun) scene.remove(oldSun);

    _terrorists = [];
    _hostages   = [];
    _doors      = [];
    _cars       = [];
    _grenades   = [];
    _trees      = [];
    _rails      = [];
    _detonatorMesh = null;
    _brakeLeverMesh = null;
  }

  function reset() {
    _active = false;
    _gameOver = false;
    _won = false;

    resetScene();

    if (_hud) {
      _hud.style.display = 'none';
      document.body.removeChild(_hud);
      _hud = null;
    }
    if (_hudMsg) {
      _hudMsg.style.display = 'none';
      document.body.removeChild(_hudMsg);
      _hudMsg = null;
    }

    if (document.exitPointerLock) document.exitPointerLock();

    _keys = {};
    _playerPos = null;
    _yaw = 0;
    _pitch = 0;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene  || null;
    _camera = camera || null;
    setupInput();
    setupMouse();
  }

  /* ── Public API ──────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
