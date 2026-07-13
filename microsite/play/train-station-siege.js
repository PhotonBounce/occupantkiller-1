/* ───────────────────────────────────────────────────────────────────────────
   train-station-siege.js — Train Station Siege FPS Module
   API: window.TrainStationSiege = { init, update, reset }
   Activation: T then S within 400ms
   Controls:
     T + S (400ms window)   → activate module
     W / A / S / D          → move
     Mouse                  → look / aim
     Left Click             → shoot
     E (hold)               → interact (free hostage 2s, defuse bomb 8s)
     Space                  → jump (cross platform gap to moving train)
   ─────────────────────────────────────────────────────────────────────────── */

window.TrainStationSiege = (function () {
  'use strict';

  /* ── Constants ──────────────────────────────────────────────────────────── */
  var ACTIVATE_WINDOW        = 0.4;    // seconds
  var DEPARTURE_TIMER        = 120;    // 2 minutes until train departs
  var PLAYER_HP              = 100;
  var PLAYER_SPEED           = 6.5;
  var PLAYER_HEIGHT          = 1.75;
  var SHOOT_RANGE            = 55;
  var SHOOT_DAMAGE           = 28;
  var INTERACT_RANGE         = 2.8;
  var FREE_TIME              = 2.0;    // seconds to free each hostage
  var DEFUSE_TIME            = 8.0;    // seconds to defuse bomb
  var TOTAL_TERRORISTS       = 14;
  var TOTAL_SNIPERS          = 5;
  var TOTAL_HOSTAGES         = 6;
  var TERRORIST_HP           = 80;
  var SNIPER_HP              = 95;
  var BOSS_HP                = 510;
  var BOSS_TRIGGER_FRACTION  = 0.5;    // boss appears at half mission time
  var BOSS_BOMB_THRESHOLD    = 0.3;    // Vasil triggers bomb at 30% HP
  var TRAIN_MOVE_SPEED       = 3.2;    // units per second
  var TRAIN_DEPART_SPEED     = 28.0;   // exit speed when timer hits 0
  var GRAVITY                = -18;
  var JUMP_SPEED             = 9;
  var PLATFORM_Y             = 0.0;
  var PLAYER_FLOOR_Y         = PLATFORM_Y + PLAYER_HEIGHT;

  /* ── Colors ─────────────────────────────────────────────────────────────── */
  var COL_FLOOR              = 0x888077;
  var COL_WALL               = 0xAA9988;
  var COL_CEILING            = 0x998877;
  var COL_PLATFORM           = 0x776655;
  var COL_TRAIN_CAR          = 0x334455;
  var COL_TRAIN_ROOF         = 0x223344;
  var COL_WHEEL              = 0x111111;
  var COL_RAIL               = 0x555555;
  var COL_SLEEPER            = 0x5C4033;
  var COL_TERRORIST          = 0x443322;
  var COL_SNIPER             = 0x332211;
  var COL_BOSS               = 0x221100;
  var COL_HOSTAGE            = 0x997755;
  var COL_SKIN               = 0xDDAA88;
  var COL_GUN                = 0x1A1A1A;
  var COL_KIOSK              = 0x997766;
  var COL_BENCH              = 0x7A5C3A;
  var COL_CLOCK_FACE         = 0xEEEEDD;
  var COL_CLOCK_RIM          = 0x554433;
  var COL_DEPARTURE_BRD      = 0x111122;
  var COL_LUGGAGE_CAR        = 0x445566;
  var COL_BOMB               = 0xCC2200;
  var COL_CONTROL_TOWER      = 0x556677;
  var COL_SUPPORT            = 0x998877;
  var COL_PILLAR             = 0xBBAA99;
  var COL_ARCH               = 0xCCBBAA;
  var COL_TUNNEL_WALL        = 0x445544;
  var COL_SIGN               = 0x334455;
  var COL_TURNSTILE          = 0x888888;
  var COL_SKYLIGHT           = 0x88AACC;

  /* ── Module state ───────────────────────────────────────────────────────── */
  var _active                = false;
  var _gameOver              = false;
  var _won                   = false;
  var _lastTime              = 0;
  var _keysAdded             = false;
  var _mouseAdded            = false;
  var _keys                  = {};
  var _keyPressTime          = { T: 0, S: 0 };
  var _mouseLocked           = false;
  var _scene                 = null;
  var _camera                = null;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _playerPos             = null;
  var _playerHP              = PLAYER_HP;
  var _yaw                   = 0;
  var _pitch                 = 0;
  var _velY                  = 0;
  var _onGround              = true;
  var _interactHeld          = 0;    // seconds E held
  var _interactTarget        = null; // current interact target object
  var _interactType          = '';   // 'hostage' | 'bomb'
  var _shootCooldown         = 0;

  /* ── Departure timer & mission state ───────────────────────────────────── */
  var _departureTimer        = DEPARTURE_TIMER;
  var _trainDeparted         = false;
  var _bossSpawned           = false;
  var _bossAlive             = false;
  var _bombDefused           = false;
  var _bombTriggered         = false;
  var _bombTriggerWarned     = false;
  var _hostagesFreed         = 0;
  var _defuseProgress        = 0;    // 0..1

  /* ── Scene objects ──────────────────────────────────────────────────────── */
  var _sceneRoot             = null;
  var _trainRoot             = null;
  var _trainX                = 0;    // moving train X offset
  var _trainSpeed            = 0;    // current movement speed

  var _terrorists            = [];
  var _snipers               = [];
  var _boss                  = null;
  var _hostages              = [];
  var _bombMesh              = null;
  var _bombWorldPos          = null;  // THREE.Vector3
  var _luggageCarGroup       = null;

  /* ── Platform geometry helpers ─────────────────────────────────────────── */
  var _platforms             = [];   // { minX, maxX, minZ, maxZ, y } walkable zones
  var _trainPlatformX        = 18;   // moving train platform X
  var _trainBoardX           = 14;   // near edge of moving train

  /* ── HUD elements ───────────────────────────────────────────────────────── */
  var _hud                   = null;
  var _hudMsg                = null;
  var _hudMsgTimer           = 0;

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
    return new THREE.Mesh(geo, makeMat(color, opts));
  }

  function cyl(rT, rB, h, segs, color, opts) {
    var geo = new THREE.CylinderGeometry(rT, rB, h, segs);
    return new THREE.Mesh(geo, makeMat(color, opts));
  }

  function sph(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    return new THREE.Mesh(geo, makeMat(color));
  }

  function cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    return new THREE.Mesh(geo, makeMat(color));
  }

  function lines(pts, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function formatTime(secs) {
    var s = Math.max(0, Math.floor(secs));
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tss-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:8px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.78)', 'color:#00ffcc',
      'font:bold 13px/1.5 monospace',
      'padding:6px 16px', 'border:1px solid #00ffcc',
      'border-radius:4px', 'white-space:nowrap',
      'pointer-events:none', 'z-index:9999', 'display:none'
    ].join(';');
    document.body.appendChild(_hud);

    _hudMsg = document.createElement('div');
    _hudMsg.id = 'tss-msg';
    _hudMsg.style.cssText = [
      'position:fixed', 'top:52px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)', 'color:#ffdd00',
      'font:bold 15px/1.5 monospace',
      'padding:8px 20px', 'border:2px solid #ffdd00',
      'border-radius:5px', 'text-align:center',
      'pointer-events:none', 'z-index:10000', 'display:none'
    ].join(';');
    document.body.appendChild(_hudMsg);
  }

  function updateHUD() {
    if (!_hud) return;
    var bombStr = _bombDefused ? 'DEFUSED' :
                  _bombTriggered ? 'DETONATING!' :
                  (_interactType === 'bomb' ? 'DEFUSING ' + Math.round(_defuseProgress * 100) + '%' : 'ACTIVE');
    var vasilStr = !_bossSpawned ? 'EN ROUTE' : (_bossAlive ? 'HP:' + Math.round(_boss ? _boss.hp : 0) : 'ELIMINATED');
    var timerColor = _departureTimer < 30 ? '#ff4444' : '#00ffcc';
    _hud.innerHTML =
      '<span style="color:' + timerColor + '">DEPARTURE: ' + formatTime(_departureTimer) + '</span>' +
      '  |  HOSTAGES: ' + _hostagesFreed + '/' + TOTAL_HOSTAGES +
      '  |  BOMB: ' + bombStr +
      '  |  VASIL: ' + vasilStr +
      '  |  HP: ' + Math.max(0, Math.round(_playerHP));
  }

  function showMsg(text, dur) {
    if (!_hudMsg) return;
    _hudMsg.textContent = text;
    _hudMsg.style.display = 'block';
    _hudMsgTimer = dur !== undefined ? dur : 2.5;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENVIRONMENT BUILDING
  ══════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    var scene = getScene();
    if (!scene) return;

    _sceneRoot = new THREE.Group();
    _sceneRoot.name = 'tss_root';
    scene.add(_sceneRoot);

    buildGrandHall();
    buildPlatforms();
    buildTicketingHall();
    buildUndergroundPassage();
    buildControlTower();
    buildDepartureBoard();
    buildStaticTrains();
    buildMovingTrainTrack();
    addLighting(scene);
  }

  /* ── Grand Station Hall ─────────────────────────────────────────────────── */
  function buildGrandHall() {
    var g = new THREE.Group();
    g.name = 'tss_hall';
    _sceneRoot.add(g);

    /* Floor */
    var floor = box(60, 0.4, 80, COL_FLOOR);
    floor.position.set(0, -0.2, 0);
    g.add(floor);

    /* Main walls */
    var wallN = box(60, 22, 0.6, COL_WALL);
    wallN.position.set(0, 11, -40);
    g.add(wallN);

    var wallS = box(60, 22, 0.6, COL_WALL);
    wallS.position.set(0, 11, 40);
    g.add(wallS);

    var wallW = box(0.6, 22, 80, COL_WALL);
    wallW.position.set(-30, 11, 0);
    g.add(wallW);

    var wallE = box(0.6, 22, 80, COL_WALL);
    wallE.position.set(30, 11, 0);
    g.add(wallE);

    /* Arched ceiling — flat top + arch segments */
    var ceilFlat = box(60, 0.6, 80, COL_CEILING);
    ceilFlat.position.set(0, 22.3, 0);
    g.add(ceilFlat);

    /* Arch ribs across the ceiling */
    var i;
    for (i = 0; i < 7; i++) {
      var archZ = -30 + i * 10;
      var arch = box(60, 1.2, 0.8, COL_ARCH);
      arch.position.set(0, 21.5, archZ);
      g.add(arch);
      /* Side drops */
      var dropL = box(0.8, 5, 0.8, COL_ARCH);
      dropL.position.set(-29, 19, archZ);
      g.add(dropL);
      var dropR = box(0.8, 5, 0.8, COL_ARCH);
      dropR.position.set(29, 19, archZ);
      g.add(dropR);
    }

    /* Skylights (translucent boxes along the roof) */
    for (i = 0; i < 3; i++) {
      var sky = box(14, 0.4, 8, COL_SKYLIGHT, { transparent: true, opacity: 0.4 });
      sky.position.set(-14 + i * 14, 22, -10 + i * 5);
      g.add(sky);
    }

    /* Pillars */
    var pillarPositions = [
      [-12, -20], [-12, -5], [-12, 10], [-12, 25],
      [ 12, -20], [ 12, -5], [ 12, 10], [ 12, 25]
    ];
    for (i = 0; i < pillarPositions.length; i++) {
      var px = pillarPositions[i][0];
      var pz = pillarPositions[i][1];
      var pillar = cyl(0.7, 0.8, 20, 8, COL_PILLAR);
      pillar.position.set(px, 10, pz);
      g.add(pillar);
      /* Cap */
      var cap = box(2, 0.5, 2, COL_ARCH);
      cap.position.set(px, 20.25, pz);
      g.add(cap);
    }

    /* Ornate clock at north wall */
    buildClock(g, 0, 14, -39.5);

    /* Benches in the hall (hostages hide under/behind) */
    buildBenches(g);
  }

  function buildClock(parent, cx, cy, cz) {
    /* Clock face */
    var face = cyl(2.5, 2.5, 0.3, 20, COL_CLOCK_FACE);
    face.rotation.x = Math.PI / 2;
    face.position.set(cx, cy, cz);
    parent.add(face);

    /* Clock rim */
    var rim = cyl(2.7, 2.7, 0.2, 20, COL_CLOCK_RIM);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(cx, cy, cz - 0.1);
    parent.add(rim);

    /* Clock hands as LineSegments */
    var handPts = [
      cx, cy, cz + 0.25,   cx, cy + 1.8, cz + 0.25,  /* hour hand up */
      cx, cy, cz + 0.25,   cx + 1.4, cy, cz + 0.25,  /* minute hand right */
      cx, cy, cz + 0.25,   cx - 0.5, cy + 0.6, cz + 0.25  /* second hand */
    ];
    var handLine = lines(handPts, 0x111111);
    parent.add(handLine);

    /* Tick marks around face */
    var tickPts = [];
    var t;
    for (t = 0; t < 12; t++) {
      var ang = (t / 12) * Math.PI * 2;
      var ir = 2.0, or = 2.4;
      tickPts.push(
        cx + Math.sin(ang) * ir, cy + Math.cos(ang) * ir, cz + 0.26,
        cx + Math.sin(ang) * or, cy + Math.cos(ang) * or, cz + 0.26
      );
    }
    var tickLine = lines(tickPts, 0x333333);
    parent.add(tickLine);
  }

  function buildBenches(parent) {
    var benchPositions = [
      [-20, -15], [-20, 0], [-20, 15],
      [20, -15],  [20, 0],  [20, 15],
      [0, -25],   [0, 25]
    ];
    var i;
    for (i = 0; i < benchPositions.length; i++) {
      var bx = benchPositions[i][0];
      var bz = benchPositions[i][1];
      var seat = box(4, 0.2, 0.9, COL_BENCH);
      seat.position.set(bx, 0.45, bz);
      parent.add(seat);
      var back = box(4, 0.8, 0.15, COL_BENCH);
      back.position.set(bx, 0.9, bz - 0.5);
      parent.add(back);
      /* Legs */
      var legL = box(0.12, 0.45, 0.9, COL_BENCH);
      legL.position.set(bx - 1.7, 0.2, bz);
      parent.add(legL);
      var legR = box(0.12, 0.45, 0.9, COL_BENCH);
      legR.position.set(bx + 1.7, 0.2, bz);
      parent.add(legR);
    }
  }

  /* ── Platforms ─────────────────────────────────────────────────────────── */
  function buildPlatforms() {
    var g = new THREE.Group();
    g.name = 'tss_platforms';
    _sceneRoot.add(g);

    var i;
    /* 3 parallel platforms, extending south from the hall */
    var platformDefs = [
      { x: -20, z: 55, len: 80 },
      { x:   0, z: 55, len: 80 },
      { x:  20, z: 55, len: 80 }
    ];

    for (i = 0; i < platformDefs.length; i++) {
      var pd = platformDefs[i];
      var plat = box(6, 0.8, pd.len, COL_PLATFORM);
      plat.position.set(pd.x, -0.4 + 0.8, pd.z);
      g.add(plat);

      /* Register as walkable */
      _platforms.push({
        minX: pd.x - 3, maxX: pd.x + 3,
        minZ: pd.z - pd.len / 2, maxZ: pd.z + pd.len / 2,
        y: 0.8
      });

      /* Platform edge markings */
      var edgeL = box(0.15, 0.05, pd.len, 0xEEDD00);
      edgeL.position.set(pd.x - 2.7, 0.85, pd.z);
      g.add(edgeL);
      var edgeR = box(0.15, 0.05, pd.len, 0xEEDD00);
      edgeR.position.set(pd.x + 2.7, 0.85, pd.z);
      g.add(edgeR);

      /* Roof canopy over platform */
      var canopy = box(7, 0.3, pd.len, 0x776655);
      canopy.position.set(pd.x, 9, pd.z);
      g.add(canopy);

      /* Support columns */
      var j;
      for (j = 0; j < 6; j++) {
        var col = cyl(0.18, 0.2, 8.5, 6, COL_SUPPORT);
        col.position.set(pd.x, 4.25, pd.z - 35 + j * 14);
        g.add(col);
      }

      /* Build static train cars on platforms 0 and 1 (not the moving one) */
      if (i < 2) {
        buildStaticTrainCars(g, pd.x, pd.z);
      }
    }

    /* Rails in the gaps between platforms */
    buildRails(g);

    /* Register hall floor as walkable */
    _platforms.push({ minX: -29, maxX: 29, minZ: -39, maxZ: 39, y: 0 });
  }

  function buildRails(parent) {
    var railDefs = [
      { x: -10 }, { x: 10 }
    ];
    var i;
    for (i = 0; i < railDefs.length; i++) {
      var rx = railDefs[i].x;
      /* Rail bed */
      var bed = box(8, 0.3, 160, 0x554433);
      bed.position.set(rx, -0.15, 55);
      parent.add(bed);

      /* Two steel rails */
      var r1 = box(0.2, 0.15, 160, COL_RAIL);
      r1.position.set(rx - 0.8, 0.15, 55);
      parent.add(r1);
      var r2 = box(0.2, 0.15, 160, COL_RAIL);
      r2.position.set(rx + 0.8, 0.15, 55);
      parent.add(r2);

      /* Sleepers */
      var j;
      for (j = 0; j < 30; j++) {
        var sl = box(6, 0.1, 0.3, COL_SLEEPER);
        sl.position.set(rx, 0.07, 55 - 75 + j * 5);
        parent.add(sl);
      }
    }
  }

  function buildStaticTrainCars(parent, platX, platZ) {
    var i;
    var numCars = 5;
    var carLen = 14;
    for (i = 0; i < numCars; i++) {
      var cz = platZ - 30 + i * (carLen + 1);
      var side = (platX < 0) ? 1 : -1; /* train is beside the platform */
      var carX = platX + side * 5;

      /* Car body */
      var carBody = box(3.5, 3.2, carLen, COL_TRAIN_CAR);
      carBody.position.set(carX, 1.6, cz);
      parent.add(carBody);

      /* Roof */
      var carRoof = box(3.7, 0.3, carLen, COL_TRAIN_ROOF);
      carRoof.position.set(carX, 3.35, cz);
      parent.add(carRoof);

      /* Windows via LineSegments */
      var winPts = [];
      var wj;
      for (wj = 0; wj < 4; wj++) {
        var wz = cz - 5 + wj * 3.3;
        /* Left side window */
        winPts.push(
          carX - 1.76, 1.4, wz - 0.7,  carX - 1.76, 2.6, wz - 0.7,
          carX - 1.76, 2.6, wz - 0.7,  carX - 1.76, 2.6, wz + 0.7,
          carX - 1.76, 2.6, wz + 0.7,  carX - 1.76, 1.4, wz + 0.7,
          carX - 1.76, 1.4, wz + 0.7,  carX - 1.76, 1.4, wz - 0.7
        );
      }
      var winLine = lines(winPts, 0x88AACC);
      parent.add(winLine);

      /* Wheels */
      var wxi;
      for (wxi = 0; wxi < 2; wxi++) {
        var wz2 = cz - carLen / 2 + 2 + wxi * (carLen - 4);
        var wL = cyl(0.45, 0.45, 0.25, 10, COL_WHEEL);
        wL.rotation.z = Math.PI / 2;
        wL.position.set(carX - 1.9, -0.2, wz2);
        parent.add(wL);
        var wR = cyl(0.45, 0.45, 0.25, 10, COL_WHEEL);
        wR.rotation.z = Math.PI / 2;
        wR.position.set(carX + 1.9, -0.2, wz2);
        parent.add(wR);
      }

      /* Door gap indicator */
      var door = box(1.0, 2.0, 0.1, 0x334455);
      door.position.set(carX + side * 1.76, 1.0, cz + 3);
      parent.add(door);
    }
  }

  /* ── Ticketing Hall ─────────────────────────────────────────────────────── */
  function buildTicketingHall() {
    var g = new THREE.Group();
    g.name = 'tss_ticketing';
    _sceneRoot.add(g);

    /* Ticketing hall is to the west */
    var hallFloor = box(25, 0.4, 40, COL_FLOOR);
    hallFloor.position.set(-42, -0.2, 0);
    g.add(hallFloor);

    var hallWallN = box(25, 12, 0.5, COL_WALL);
    hallWallN.position.set(-42, 6, -20);
    g.add(hallWallN);

    var hallWallS = box(25, 12, 0.5, COL_WALL);
    hallWallS.position.set(-42, 6, 20);
    g.add(hallWallS);

    var hallWallW = box(0.5, 12, 40, COL_WALL);
    hallWallW.position.set(-54.5, 6, 0);
    g.add(hallWallW);

    var hallCeil = box(25, 0.4, 40, 0x887766);
    hallCeil.position.set(-42, 12, 0);
    g.add(hallCeil);

    /* Register ticketing hall as walkable */
    _platforms.push({ minX: -54, maxX: -30, minZ: -19, maxZ: 19, y: 0 });

    /* Vending kiosks in rows */
    var kioskPositions = [
      [-36, -12], [-36, -6], [-36, 0], [-36, 6], [-36, 12],
      [-42, -12], [-42, -6], [-42, 0], [-42, 6], [-42, 12],
      [-48, -12], [-48, -6], [-48, 0], [-48, 6], [-48, 12]
    ];
    var i;
    for (i = 0; i < kioskPositions.length; i++) {
      var kx = kioskPositions[i][0];
      var kz = kioskPositions[i][1];
      var kiosk = box(1.5, 2.0, 0.9, COL_KIOSK);
      kiosk.position.set(kx, 1.0, kz);
      g.add(kiosk);
      /* Screen */
      var screen = box(1.0, 0.8, 0.06, 0x224466);
      screen.position.set(kx, 1.4, kz + 0.48);
      g.add(screen);
      /* Screen lines */
      var screenLines = lines([
        kx - 0.4, 1.1, kz + 0.52,   kx + 0.4, 1.1, kz + 0.52,
        kx - 0.4, 1.4, kz + 0.52,   kx + 0.4, 1.4, kz + 0.52,
        kx - 0.4, 1.7, kz + 0.52,   kx + 0.4, 1.7, kz + 0.52
      ], 0x00ccff);
      g.add(screenLines);
    }

    /* Turnstiles using LineSegments */
    var turnstileX = -31;
    var tj;
    for (tj = 0; tj < 5; tj++) {
      var tz = -10 + tj * 5;
      var tsBase = box(0.3, 1.0, 0.3, 0x555555);
      tsBase.position.set(turnstileX, 0.5, tz);
      g.add(tsBase);
      /* Rotating bar lines */
      var barPts = [
        turnstileX, 1.1, tz,   turnstileX + 0.8, 1.1, tz,
        turnstileX, 1.1, tz,   turnstileX, 1.1, tz + 0.8,
        turnstileX, 1.1, tz,   turnstileX - 0.8, 1.1, tz
      ];
      var tsLine = lines(barPts, COL_TURNSTILE);
      g.add(tsLine);
    }

    /* Connection doorway to main hall (just an opening, no mesh needed) */
  }

  /* ── Underground Passage ────────────────────────────────────────────────── */
  function buildUndergroundPassage() {
    var g = new THREE.Group();
    g.name = 'tss_tunnel';
    _sceneRoot.add(g);

    /* Low ceiling tunnel connecting the three platform zones */
    /* Tunnel at Y = -3, connecting X from -23 to 23 */
    var tunFloor = box(50, 0.3, 10, COL_TUNNEL_WALL);
    tunFloor.position.set(0, -3.15, 60);
    g.add(tunFloor);

    var tunCeil = box(50, 0.3, 10, 0x333333);
    tunCeil.position.set(0, -0.85, 60);
    g.add(tunCeil);

    var tunWallN = box(50, 2.3, 0.4, COL_TUNNEL_WALL);
    tunWallN.position.set(0, -2, 65);
    g.add(tunWallN);

    var tunWallS = box(50, 2.3, 0.4, COL_TUNNEL_WALL);
    tunWallS.position.set(0, -2, 55);
    g.add(tunWallS);

    /* Register tunnel as walkable */
    _platforms.push({ minX: -24, maxX: 24, minZ: 55, maxZ: 65, y: -3 });

    /* Staircase down from main hall */
    var stairDefs = [
      { x: -15, zStart: 39 }, { x: 0, zStart: 39 }, { x: 15, zStart: 39 }
    ];
    var i, s;
    for (i = 0; i < stairDefs.length; i++) {
      var sd = stairDefs[i];
      for (s = 0; s < 6; s++) {
        var stair = box(3, 0.3, 1.5, COL_FLOOR);
        stair.position.set(sd.x, -s * 0.5, sd.zStart + s * 1.5 + 2);
        g.add(stair);
      }
    }

    /* Emergency lighting lines along ceiling */
    var lightPts = [];
    var lx;
    for (lx = -22; lx <= 22; lx += 8) {
      lightPts.push(lx, -1.0, 56,   lx, -1.0, 64);
    }
    var lightLine = lines(lightPts, 0xFFCC44);
    g.add(lightLine);
  }

  /* ── Control Tower ──────────────────────────────────────────────────────── */
  function buildControlTower() {
    var g = new THREE.Group();
    g.name = 'tss_tower';
    _sceneRoot.add(g);

    /* Tower base */
    var towerBase = box(5, 8, 5, COL_CONTROL_TOWER);
    towerBase.position.set(25, 4, 20);
    g.add(towerBase);

    /* Elevated booth */
    var booth = box(6, 3.5, 6, COL_CONTROL_TOWER);
    booth.position.set(25, 10, 20);
    g.add(booth);

    /* Booth windows as box strips */
    var w1 = box(5.8, 1.5, 0.15, COL_SKYLIGHT, { transparent: true, opacity: 0.5 });
    w1.position.set(25, 10.5, 23.08);
    g.add(w1);
    var w2 = box(0.15, 1.5, 5.8, COL_SKYLIGHT, { transparent: true, opacity: 0.5 });
    w2.position.set(28.08, 10.5, 20);
    g.add(w2);
    var w3 = box(0.15, 1.5, 5.8, COL_SKYLIGHT, { transparent: true, opacity: 0.5 });
    w3.position.set(21.92, 10.5, 20);
    g.add(w3);

    /* Tower roof */
    var towerRoof = box(6.5, 0.4, 6.5, 0x334455);
    towerRoof.position.set(25, 12, 20);
    g.add(towerRoof);

    /* Access ladder lines */
    var ladderPts = [];
    var li;
    for (li = 0; li < 8; li++) {
      ladderPts.push(
        23.8, li, 17.5,   24.2, li, 17.5,
        23.8, li, 17.5,   23.8, li + 1, 17.5
      );
    }
    var ladder = lines(ladderPts, COL_SUPPORT);
    g.add(ladder);

    /* Register tower booth as walkable */
    _platforms.push({ minX: 22, maxX: 28, minZ: 17, maxZ: 23, y: 8.75 });
  }

  /* ── Departure Board ────────────────────────────────────────────────────── */
  function buildDepartureBoard() {
    var g = new THREE.Group();
    g.name = 'tss_board';
    _sceneRoot.add(g);

    /* Large flat panel */
    var board = box(18, 6, 0.4, COL_DEPARTURE_BRD);
    board.position.set(0, 16, -38);
    g.add(board);

    /* Grid of lines simulating text rows */
    var gridPts = [];
    var ri, ci;
    for (ri = 0; ri < 8; ri++) {
      var ry = 13.5 + ri * 0.7;
      gridPts.push(-8.5, ry, -37.7,   8.5, ry, -37.7);
    }
    for (ci = 0; ci < 5; ci++) {
      var cx2 = -7 + ci * 3.5;
      gridPts.push(cx2, 13.5, -37.7,   cx2, 18.5, -37.7);
    }
    var gridLine = lines(gridPts, 0x00FFAA);
    g.add(gridLine);

    /* Border */
    var borderPts = [
      -9, 13, -37.6,   9, 13, -37.6,
       9, 13, -37.6,   9, 19, -37.6,
       9, 19, -37.6,  -9, 19, -37.6,
      -9, 19, -37.6,  -9, 13, -37.6
    ];
    var borderLine = lines(borderPts, 0x00FFAA);
    g.add(borderLine);

    /* Support struts */
    var strut1 = box(0.4, 3, 0.4, COL_SUPPORT);
    strut1.position.set(-7, 12.5, -38);
    g.add(strut1);
    var strut2 = box(0.4, 3, 0.4, COL_SUPPORT);
    strut2.position.set(7, 12.5, -38);
    g.add(strut2);
  }

  /* ── Static Train arrangement ───────────────────────────────────────────── */
  function buildStaticTrains() {
    /* Already built in buildStaticTrainCars during platform build */
  }

  /* ── Moving Train Track ─────────────────────────────────────────────────── */
  function buildMovingTrainTrack() {
    /* The moving train runs along the easternmost track at X = +28 */
    var g = new THREE.Group();
    g.name = 'tss_moving_track';
    _sceneRoot.add(g);

    /* Rail bed */
    var bed = box(5, 0.3, 200, 0x554433);
    bed.position.set(_trainPlatformX, -0.15, 55);
    g.add(bed);

    var r1 = box(0.2, 0.15, 200, COL_RAIL);
    r1.position.set(_trainPlatformX - 0.8, 0.15, 55);
    g.add(r1);
    var r2 = box(0.2, 0.15, 200, COL_RAIL);
    r2.position.set(_trainPlatformX + 0.8, 0.15, 55);
    g.add(r2);

    var i;
    for (i = 0; i < 40; i++) {
      var sl = box(3.5, 0.1, 0.3, COL_SLEEPER);
      sl.position.set(_trainPlatformX, 0.07, 55 - 95 + i * 5);
      g.add(sl);
    }
  }

  /* ── Moving Train Build ─────────────────────────────────────────────────── */
  function buildMovingTrain() {
    _trainRoot = new THREE.Group();
    _trainRoot.name = 'tss_moving_train';
    _trainX = _trainPlatformX;
    _trainRoot.position.set(_trainX, 0, 55);

    var scene = getScene();
    if (!scene) return;
    scene.add(_trainRoot);

    /* 4 train cars: engine + 2 passenger + luggage */
    buildTrainCar(_trainRoot, 0, 'engine');
    buildTrainCar(_trainRoot, 1, 'passenger');
    buildTrainCar(_trainRoot, 2, 'passenger');
    buildTrainCar(_trainRoot, 3, 'luggage');

    /* Place bomb in luggage car */
    placeBomb();
  }

  function buildTrainCar(parent, idx, type) {
    var carZ = -idx * 15;
    var carColor = type === 'engine' ? 0x334455 : type === 'luggage' ? COL_LUGGAGE_CAR : COL_TRAIN_CAR;

    /* Body */
    var carBody = box(3.5, 3.2, 14, carColor);
    carBody.position.set(0, 1.6, carZ);
    parent.add(carBody);

    /* Roof */
    var carRoof = box(3.7, 0.3, 14.2, COL_TRAIN_ROOF);
    carRoof.position.set(0, 3.35, carZ);
    parent.add(carRoof);

    /* Undercarriage */
    var undercarriage = box(3.3, 0.5, 13.8, 0x222233);
    undercarriage.position.set(0, -0.25, carZ);
    parent.add(undercarriage);

    /* Wheels */
    var wi;
    for (wi = 0; wi < 2; wi++) {
      var wz = carZ - 5 + wi * 10;
      var wheelL = cyl(0.45, 0.45, 0.25, 10, COL_WHEEL);
      wheelL.rotation.z = Math.PI / 2;
      wheelL.position.set(-1.9, -0.2, wz);
      parent.add(wheelL);
      var wheelR = cyl(0.45, 0.45, 0.25, 10, COL_WHEEL);
      wheelR.rotation.z = Math.PI / 2;
      wheelR.position.set(1.9, -0.2, wz);
      parent.add(wheelR);
    }

    /* Windows */
    var winPts = [];
    var wj;
    for (wj = 0; wj < 3; wj++) {
      var wz2 = carZ - 4 + wj * 4;
      winPts.push(
        -1.76, 1.4, wz2 - 0.6,   -1.76, 2.5, wz2 - 0.6,
        -1.76, 2.5, wz2 - 0.6,   -1.76, 2.5, wz2 + 0.6,
        -1.76, 2.5, wz2 + 0.6,   -1.76, 1.4, wz2 + 0.6,
        -1.76, 1.4, wz2 + 0.6,   -1.76, 1.4, wz2 - 0.6
      );
    }
    var winLine = lines(winPts, 0x88AACC);
    parent.add(winLine);

    /* Engine front detail */
    if (type === 'engine') {
      var nose = box(3.5, 2.5, 2.5, 0x223344);
      nose.position.set(0, 1.25, carZ + 8.25);
      parent.add(nose);
      var headlight1 = cyl(0.2, 0.2, 0.1, 8, 0xFFFFAA);
      headlight1.rotation.x = Math.PI / 2;
      headlight1.position.set(-0.8, 1.5, carZ + 9.55);
      parent.add(headlight1);
      var headlight2 = cyl(0.2, 0.2, 0.1, 8, 0xFFFFAA);
      headlight2.rotation.x = Math.PI / 2;
      headlight2.position.set(0.8, 1.5, carZ + 9.55);
      parent.add(headlight2);
    }

    /* Luggage car — boxes inside */
    if (type === 'luggage') {
      var li;
      for (li = 0; li < 5; li++) {
        var lug = box(rnd(0.5, 0.9), rnd(0.4, 0.7), rnd(0.4, 0.6), 0x887755);
        lug.position.set(rnd(-1.2, 1.2), 0.4, carZ + rnd(-5, 5));
        parent.add(lug);
      }
    }
  }

  function placeBomb() {
    if (!_trainRoot) return;
    /* Bomb is in luggage car (idx 3), Z offset = -45 relative to train root */
    _bombMesh = box(0.7, 0.7, 0.7, COL_BOMB);
    _bombMesh.position.set(0, 0.75, -45);
    _trainRoot.add(_bombMesh);

    /* Bomb timer display lines */
    var bombLines = lines([
      -0.3, 1.2, -45 - 0.36,   0.3, 1.2, -45 - 0.36,
       0.3, 1.2, -45 - 0.36,   0.3, 1.5, -45 - 0.36,
       0.3, 1.5, -45 - 0.36,  -0.3, 1.5, -45 - 0.36,
      -0.3, 1.5, -45 - 0.36,  -0.3, 1.2, -45 - 0.36,
      /* segments */
      -0.25, 1.35, -45 - 0.37,  0.25, 1.35, -45 - 0.37
    ], 0xFF0000);
    _trainRoot.add(bombLines);
    _bombWorldPos = new THREE.Vector3();
  }

  /* ── Lighting ────────────────────────────────────────────────────────────── */
  function addLighting(scene) {
    var amb = new THREE.AmbientLight(0xffffff, 0.5);
    amb.name = 'tss_ambient';
    scene.add(amb);

    var sun = new THREE.DirectionalLight(0xFFF5DD, 0.9);
    sun.position.set(40, 80, -30);
    sun.name = 'tss_sun';
    scene.add(sun);

    var fillLight = new THREE.PointLight(0x8899AA, 0.6, 80);
    fillLight.position.set(0, 18, 0);
    fillLight.name = 'tss_fill';
    scene.add(fillLight);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY MESH BUILDERS
  ══════════════════════════════════════════════════════════════════════════ */

  function buildTerroristMesh(color) {
    var g = new THREE.Group();
    var body = box(0.6, 1.0, 0.4, color);
    body.position.y = 0.5;
    g.add(body);
    var head = sph(0.22, 7, COL_SKIN);
    head.position.y = 1.22;
    g.add(head);
    var legL = box(0.22, 0.5, 0.22, color);
    legL.position.set(-0.17, 0.0, 0);
    g.add(legL);
    var legR = box(0.22, 0.5, 0.22, color);
    legR.position.set(0.17, 0.0, 0);
    g.add(legR);
    var armL = box(0.18, 0.5, 0.18, color);
    armL.position.set(-0.42, 0.55, 0);
    g.add(armL);
    var armR = box(0.18, 0.5, 0.18, color);
    armR.position.set(0.42, 0.55, 0);
    g.add(armR);
    /* Rifle */
    var rifleBody = box(0.08, 0.08, 0.7, COL_GUN);
    rifleBody.position.set(0.42, 0.7, 0.35);
    g.add(rifleBody);
    return g;
  }

  function buildSniperMesh() {
    var g = buildTerroristMesh(COL_SNIPER);
    /* Sniper has a longer rifle barrel */
    var barrel = box(0.06, 0.06, 1.1, COL_GUN);
    barrel.position.set(0.42, 0.72, 0.55);
    g.add(barrel);
    /* Scope */
    var scope = cyl(0.05, 0.05, 0.25, 6, 0x222222);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0.42, 0.82, 0.35);
    g.add(scope);
    /* Ghillie bump */
    var bump = box(0.65, 0.3, 0.45, 0x334422);
    bump.position.set(0, 0.85, 0);
    g.add(bump);
    return g;
  }

  function buildBossMesh() {
    var g = buildTerroristMesh(COL_BOSS);
    /* Tactical vest */
    var vest = box(0.66, 0.6, 0.14, 0x111111);
    vest.position.set(0, 0.7, 0.22);
    g.add(vest);
    /* Explosives bandolier lines */
    var bandPts = [
      -0.3, 0.55, 0.23,   0.3, 0.55, 0.23,
      -0.3, 0.7,  0.23,   0.3, 0.7,  0.23,
      -0.3, 0.85, 0.23,   0.3, 0.85, 0.23
    ];
    var band = lines(bandPts, 0xCC4400);
    g.add(band);
    /* Larger head — boss */
    return g;
  }

  function buildHostageMesh() {
    var g = new THREE.Group();
    var body = box(0.5, 0.85, 0.35, COL_HOSTAGE);
    body.position.y = 0.42;
    g.add(body);
    var head = sph(0.2, 7, COL_SKIN);
    head.position.y = 1.05;
    g.add(head);
    /* Crouching arms */
    var armL = box(0.15, 0.4, 0.15, COL_HOSTAGE);
    armL.position.set(-0.35, 0.5, 0.08);
    armL.rotation.z = 0.5;
    g.add(armL);
    var armR = box(0.15, 0.4, 0.15, COL_HOSTAGE);
    armR.position.set(0.35, 0.5, 0.08);
    armR.rotation.z = -0.5;
    g.add(armR);
    return g;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY SPAWNING
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnTerrorists() {
    var scene = getScene();
    if (!scene) return;

    /* Spawn positions: across platforms, hall, and ticketing area */
    var tPositions = [
      /* Grand hall */
      { x: -8, y: 0, z: -20 }, { x: 8, y: 0, z: -20 },
      { x: -15, y: 0, z: 10 }, { x: 15, y: 0, z: 10 },
      { x: 0, y: 0, z: -30 },  { x: -5, y: 0, z: 30 },
      /* Platform 1 */
      { x: -20, y: 0.8, z: 40 }, { x: -20, y: 0.8, z: 60 },
      { x: -20, y: 0.8, z: 80 },
      /* Platform 2 */
      { x: 0, y: 0.8, z: 45 }, { x: 0, y: 0.8, z: 70 },
      /* Ticketing hall */
      { x: -38, y: 0, z: -8 }, { x: -45, y: 0, z: 5 },
      { x: -50, y: 0, z: -10 }
    ];

    var i;
    for (i = 0; i < tPositions.length && i < TOTAL_TERRORISTS; i++) {
      var tp = tPositions[i];
      var mesh = buildTerroristMesh(COL_TERRORIST);
      mesh.position.set(tp.x, tp.y, tp.z);
      scene.add(mesh);
      _terrorists.push({
        mesh: mesh,
        pos: new THREE.Vector3(tp.x, tp.y, tp.z),
        hp: TERRORIST_HP,
        alive: true,
        alertState: false,
        alertTimer: 0,
        patrolDir: rnd(-1, 1) > 0 ? 1 : -1,
        patrolTimer: rnd(1.5, 3.5),
        shootTimer: rnd(0.8, 2.2),
        floorY: tp.y
      });
    }
  }

  function spawnSnipers() {
    var scene = getScene();
    if (!scene) return;

    /* Snipers: 2 in control tower booth, 3 on train car roofs */
    var sPositions = [
      /* Control tower */
      { x: 24, y: 9.25, z: 18 },
      { x: 26, y: 9.25, z: 22 },
      /* Train car roofs — static trains */
      { x: -25, y: 3.65, z: 45 },
      { x: -25, y: 3.65, z: 65 },
      { x: 5,   y: 3.65, z: 55 }
    ];

    var i;
    for (i = 0; i < sPositions.length && i < TOTAL_SNIPERS; i++) {
      var sp = sPositions[i];
      var mesh = buildSniperMesh();
      mesh.position.set(sp.x, sp.y, sp.z);
      var scene2 = getScene();
      if (scene2) scene2.add(mesh);
      _snipers.push({
        mesh: mesh,
        pos: new THREE.Vector3(sp.x, sp.y, sp.z),
        hp: SNIPER_HP,
        alive: true,
        alertTimer: 0,
        alertState: false,
        shootTimer: rnd(1.5, 3.5),
        floorY: sp.y,
        rotateDir: rnd(-1, 1) > 0 ? 1 : -1,
        rotateTimer: 0
      });
    }
  }

  function spawnHostages() {
    var scene = getScene();
    if (!scene) return;

    /* 6 hostages hiding under benches and in service rooms */
    var hPositions = [
      /* Under benches in grand hall */
      { x: -20, y: 0.15, z: -15, note: 'bench' },
      { x: 20,  y: 0.15, z: 0,   note: 'bench' },
      { x: 0,   y: 0.15, z: -25, note: 'bench' },
      /* In the ticketing hall (service room) */
      { x: -52, y: 0, z: -15, note: 'service' },
      { x: -52, y: 0, z: 10,  note: 'service' },
      /* Under a bench near platform */
      { x: -20, y: 0.8, z: 50, note: 'platform' }
    ];

    var i;
    for (i = 0; i < hPositions.length && i < TOTAL_HOSTAGES; i++) {
      var hp2 = hPositions[i];
      var mesh = buildHostageMesh();
      mesh.position.set(hp2.x, hp2.y, hp2.z);
      var scene2 = getScene();
      if (scene2) scene2.add(mesh);
      _hostages.push({
        mesh: mesh,
        pos: new THREE.Vector3(hp2.x, hp2.y, hp2.z),
        freed: false,
        note: hp2.note
      });
    }
  }

  function spawnBoss() {
    var scene = getScene();
    if (!scene) return;

    /* Boss spawns on the moving train */
    var mesh = buildBossMesh();
    /* Position on top of luggage car, relative to train root */
    /* Will be added to _trainRoot and position tracked separately */
    mesh.position.set(0, 3.65, -45);  /* on roof of luggage car */

    if (_trainRoot) {
      _trainRoot.add(mesh);
    } else {
      scene.add(mesh);
    }

    _boss = {
      mesh: mesh,
      hp: BOSS_HP,
      maxHp: BOSS_HP,
      alive: true,
      alertState: true,
      alertTimer: 30,
      shootTimer: 1.5,
      onTrain: true,
      bombTriggering: false,
      bombTriggerTimer: 5.0  /* seconds after reaching 30% HP before bomb detonates */
    };

    _bossAlive = true;
    _bossSpawned = true;
    showMsg('WARNING: Terror Leader Vasil has appeared on the train!', 4);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;
    var now = performance.now() / 1000;
    if (e.code === 'KeyT') { _keyPressTime.T = now; }
    if (e.code === 'KeyS') { _keyPressTime.S = now; }

    if (!_active) {
      if (_keys['KeyT'] && _keys['KeyS'] &&
          Math.abs(_keyPressTime.T - _keyPressTime.S) < ACTIVATE_WINDOW) {
        activateModule();
      }
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!_active || !_mouseLocked) return;
    _yaw   -= (e.movementX || 0) * 0.002;
    _pitch -= (e.movementY || 0) * 0.002;
    _pitch  = clamp(_pitch, -Math.PI / 3, Math.PI / 3);
  }

  function onMouseDown(e) {
    if (!_active || _gameOver) return;
    if (e.button === 0) { doShoot(); }
  }

  function onPointerLockChange() {
    _mouseLocked = document.pointerLockElement === document.body;
  }

  function setupInput() {
    if (_keysAdded) return;
    _keysAdded = true;
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function setupMouse() {
    if (_mouseAdded) return;
    _mouseAdded = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('click', function () {
      if (_active && document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ══════════════════════════════════════════════════════════════════════════ */

  function activateModule() {
    if (_active) return;
    _active = true;

    var scene  = getScene();
    var camera = getCamera();
    if (!scene || !camera) { _active = false; return; }
    _scene  = scene;
    _camera = camera;

    resetState();
    buildEnvironment();
    buildMovingTrain();
    spawnTerrorists();
    spawnSnipers();
    spawnHostages();
    buildHUD();

    _playerPos = new THREE.Vector3(0, PLAYER_FLOOR_Y, -10);
    _playerHP  = PLAYER_HP;
    _yaw       = 0;
    _pitch     = 0;
    _velY      = 0;
    _onGround  = true;
    _lastTime  = performance.now() / 1000;

    camera.position.copy(_playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, 0, 0);

    if (_hud) _hud.style.display = 'block';

    document.body.requestPointerLock();
    showMsg('TRAIN STATION SIEGE — Clear terrorists, free hostages, defuse bomb before departure!', 5);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function doShoot() {
    if (!_active || _gameOver || _shootCooldown > 0) return;
    _shootCooldown = 0.15;

    var camera = getCamera();
    if (!camera || !_playerPos) return;

    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    dir.normalize();

    /* Recoil */
    _pitch += 0.012;
    _pitch = clamp(_pitch, -Math.PI / 3, Math.PI / 3);

    /* Check terrorists */
    var i, t, d, toT, dot;
    var best = null, bestDist = SHOOT_RANGE;
    var camPos = camera.position;

    for (i = 0; i < _terrorists.length; i++) {
      t = _terrorists[i];
      if (!t.alive) continue;
      toT = t.pos.clone().sub(camPos);
      d = toT.length();
      if (d > SHOOT_RANGE) continue;
      dot = toT.normalize().dot(dir);
      if (dot > 0.96 && d < bestDist) { bestDist = d; best = { type: 'terrorist', idx: i }; }
    }
    for (i = 0; i < _snipers.length; i++) {
      t = _snipers[i];
      if (!t.alive) continue;
      toT = t.pos.clone().sub(camPos);
      d = toT.length();
      if (d > SHOOT_RANGE) continue;
      dot = toT.normalize().dot(dir);
      if (dot > 0.96 && d < bestDist) { bestDist = d; best = { type: 'sniper', idx: i }; }
    }
    if (_boss && _boss.alive) {
      var bossWorldPos = new THREE.Vector3();
      _boss.mesh.getWorldPosition(bossWorldPos);
      toT = bossWorldPos.clone().sub(camPos);
      d = toT.length();
      if (d <= SHOOT_RANGE) {
        dot = toT.normalize().dot(dir);
        if (dot > 0.96 && d < bestDist) { bestDist = d; best = { type: 'boss' }; }
      }
    }

    if (!best) return;

    var hitTarget, dmg;
    if (best.type === 'terrorist') {
      hitTarget = _terrorists[best.idx];
      dmg = SHOOT_DAMAGE;
      hitTarget.hp -= dmg;
      hitTarget.alertState = true;
      hitTarget.alertTimer = 12;
      alertNearbyTerrorists(hitTarget.pos, 15);
      if (hitTarget.hp <= 0) { killEnemy(hitTarget); }
    } else if (best.type === 'sniper') {
      hitTarget = _snipers[best.idx];
      dmg = SHOOT_DAMAGE;
      hitTarget.hp -= dmg;
      if (hitTarget.hp <= 0) { killEnemy(hitTarget); }
    } else if (best.type === 'boss') {
      dmg = SHOOT_DAMAGE;
      _boss.hp -= dmg;
      showMsg('Hit Vasil! HP: ' + Math.round(_boss.hp), 1.0);
      if (_boss.hp <= BOSS_HP * BOSS_BOMB_THRESHOLD && !_boss.bombTriggering && !_bombDefused) {
        _boss.bombTriggering = true;
        showMsg('VASIL IS TRIGGERING THE BOMB! DEFUSE NOW OR KILL HIM!', 4);
      }
      if (_boss.hp <= 0) {
        _boss.alive = false;
        _bossAlive = false;
        _boss.mesh.visible = false;
        _boss.bombTriggering = false;
        showMsg('Terror Leader Vasil ELIMINATED! Now defuse the bomb!', 4);
        checkWinCondition();
      }
    }
  }

  function killEnemy(enemy) {
    enemy.alive = false;
    enemy.mesh.visible = false;
  }

  function alertNearbyTerrorists(pos, radius) {
    var i;
    for (i = 0; i < _terrorists.length; i++) {
      var t = _terrorists[i];
      if (!t.alive) continue;
      if (dist3(t.pos, pos) < radius) {
        t.alertState = true;
        t.alertTimer = Math.max(t.alertTimer, 10);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var camera = getCamera();
    if (!camera || !_playerPos) return;

    /* Build movement direction */
    var fwd = new THREE.Vector3(-Math.sin(_yaw), 0, -Math.cos(_yaw));
    var right = new THREE.Vector3(Math.cos(_yaw), 0, -Math.sin(_yaw));
    var moveX = 0, moveZ = 0;

    if (_keys['KeyW'] || _keys['ArrowUp'])    moveZ = 1;
    if (_keys['KeyS'] || _keys['ArrowDown'])  moveZ = -1;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  moveX = -1;
    if (_keys['KeyD'] || _keys['ArrowRight']) moveX = 1;

    _playerPos.addScaledVector(fwd, moveZ * PLAYER_SPEED * dt);
    _playerPos.addScaledVector(right, moveX * PLAYER_SPEED * dt);

    /* Jump */
    if (_keys['Space'] && _onGround) {
      _velY = JUMP_SPEED;
      _onGround = false;
    }

    /* Gravity */
    _velY += GRAVITY * dt;
    _playerPos.y += _velY * dt;

    /* Floor detection — find correct floor Y */
    var floorY = getFloorY(_playerPos);
    if (_playerPos.y <= floorY + PLAYER_HEIGHT) {
      _playerPos.y = floorY + PLAYER_HEIGHT;
      _velY = 0;
      _onGround = true;
    }

    /* On the moving train? */
    if (_trainRoot && !_trainDeparted) {
      var trainWorldX = _trainRoot.position.x;
      var trainWorldZ = _trainRoot.position.z;
      var relX = _playerPos.x - trainWorldX;
      var relZ = _playerPos.z - trainWorldZ;
      /* Check if within any car of the moving train */
      var inMovingTrain = (relX > -1.8 && relX < 1.8 && relZ > -50 && relZ < 10);
      if (inMovingTrain && _playerPos.y < trainWorldZ + PLAYER_HEIGHT + 0.85) {
        /* Snap to train car roof or floor level */
        var trainFloor = 3.2 + PLAYER_HEIGHT; /* standing on roof */
        if (_playerPos.y < 0.85 + PLAYER_HEIGHT) {
          /* inside */
        } else {
          _playerPos.y = Math.max(_playerPos.y, trainFloor);
          _onGround = true;
          _velY = 0;
        }
      }
    }

    /* Apply camera */
    camera.position.copy(_playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = _yaw;
    camera.rotation.x = _pitch;

    /* Interact: hold E */
    if (_keys['KeyE']) {
      _interactHeld += dt;
      handleInteract(dt);
    } else {
      _interactHeld = 0;
      _interactTarget = null;
      _interactType = '';
      _defuseProgress = 0;
    }

    /* Shoot cooldown */
    if (_shootCooldown > 0) { _shootCooldown -= dt; }
  }

  function getFloorY(pos) {
    /* Find which platform/floor surface is under the player */
    var best = -5; /* below all geometry = fail-safe fall */
    var i;
    for (i = 0; i < _platforms.length; i++) {
      var p = _platforms[i];
      if (pos.x >= p.minX && pos.x <= p.maxX &&
          pos.z >= p.minZ && pos.z <= p.maxZ) {
        if (p.y > best) { best = p.y; }
      }
    }
    return best;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTERACT
  ══════════════════════════════════════════════════════════════════════════ */

  function handleInteract(dt) {
    if (!_playerPos) return;

    /* Hostage freeing */
    if (_interactType === '' || _interactType === 'hostage') {
      var i;
      for (i = 0; i < _hostages.length; i++) {
        var h = _hostages[i];
        if (h.freed) continue;
        var dh = dist3(_playerPos, h.pos);
        if (dh < INTERACT_RANGE) {
          if (_interactType === '') {
            _interactType = 'hostage';
            _interactTarget = h;
            showMsg('Freeing hostage... hold E', 1.0);
          }
          if (_interactTarget === h) {
            _interactHeld += 0; /* already incremented above */
            if (_interactHeld >= FREE_TIME) {
              h.freed = true;
              h.mesh.visible = false;
              _hostagesFreed++;
              showMsg('Hostage freed! (' + _hostagesFreed + '/' + TOTAL_HOSTAGES + ')', 2);
              _interactHeld = 0;
              _interactTarget = null;
              _interactType = '';
              checkWinCondition();
            }
          }
          return;
        }
      }
    }

    /* Bomb defusal */
    if (!_bombDefused && _bombMesh && _trainRoot) {
      _bombMesh.getWorldPosition(_bombWorldPos);
      var db = dist3(_playerPos, _bombWorldPos);
      if (db < INTERACT_RANGE + 1.5) {
        if (_interactType === '' || _interactType === 'bomb') {
          _interactType = 'bomb';
          _defuseProgress = clamp(_interactHeld / DEFUSE_TIME, 0, 1);
          showMsg('Defusing bomb... ' + Math.round(_defuseProgress * 100) + '% (hold E ' + DEFUSE_TIME + 's)', 0.5);
          if (_interactHeld >= DEFUSE_TIME) {
            _bombDefused = true;
            if (_bombMesh) _bombMesh.material.color.setHex(0x00AA44);
            showMsg('BOMB DEFUSED! Now eliminate Vasil and free all hostages!', 4);
            _boss && (_boss.bombTriggering = false);
            checkWinCondition();
          }
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ══════════════════════════════════════════════════════════════════════════ */

  function updateTerrorists(dt) {
    if (!_playerPos) return;
    var i, t, toP, d, dz, dmg;
    for (i = 0; i < _terrorists.length; i++) {
      t = _terrorists[i];
      if (!t.alive) continue;

      d = dist3(_playerPos, t.pos);

      /* Line of sight detection */
      if (d < 18) {
        t.alertState = true;
        t.alertTimer = Math.max(t.alertTimer, 8);
      }
      if (t.alertTimer > 0) { t.alertTimer -= dt; }
      if (t.alertTimer <= 0) { t.alertState = false; }

      if (t.alertState) {
        /* Chase player */
        toP = new THREE.Vector3(_playerPos.x - t.pos.x, 0, _playerPos.z - t.pos.z);
        if (toP.length() > 0.5) {
          toP.normalize();
          t.pos.x += toP.x * 3.0 * dt;
          t.pos.z += toP.z * 3.0 * dt;
        }
        /* Face player */
        t.mesh.rotation.y = Math.atan2(_playerPos.x - t.pos.x, _playerPos.z - t.pos.z);

        /* Shoot */
        t.shootTimer -= dt;
        if (t.shootTimer <= 0) {
          t.shootTimer = rnd(1.0, 2.0);
          if (d < SHOOT_RANGE) {
            var hitChance = d < 5 ? 0.6 : d < 12 ? 0.35 : 0.18;
            if (Math.random() < hitChance) {
              dmg = 8 + Math.round(Math.random() * 6);
              _playerHP -= dmg;
              if (_playerHP <= 0) { triggerGameOver('AGENT DOWN! Mission failed.'); }
            }
          }
        }
      } else {
        /* Patrol */
        t.patrolTimer -= dt;
        if (t.patrolTimer <= 0) {
          t.patrolDir *= -1;
          t.patrolTimer = rnd(1.5, 3.5);
        }
        t.pos.z += t.patrolDir * 1.8 * dt;
        t.mesh.rotation.y += 0.01;
      }

      t.mesh.position.copy(t.pos);
    }
  }

  function updateSnipers(dt) {
    if (!_playerPos) return;
    var i, s, d, dmg;
    for (i = 0; i < _snipers.length; i++) {
      s = _snipers[i];
      if (!s.alive) continue;

      d = dist3(_playerPos, s.pos);

      /* Snipers stay in place, scan left/right */
      s.rotateTimer += dt;
      s.mesh.rotation.y += s.rotateDir * 0.4 * dt;
      if (s.rotateTimer > 3.5) {
        s.rotateTimer = 0;
        s.rotateDir *= -1;
      }

      /* Detect player at long range */
      if (d < SHOOT_RANGE) {
        s.alertState = true;
        s.alertTimer = Math.max(s.alertTimer || 0, 5);
      }
      if (s.alertTimer > 0) { s.alertTimer -= dt; }
      if (s.alertTimer <= 0) { s.alertState = false; }

      if (s.alertState) {
        s.mesh.rotation.y = Math.atan2(_playerPos.x - s.pos.x, _playerPos.z - s.pos.z);
        s.shootTimer -= dt;
        if (s.shootTimer <= 0) {
          s.shootTimer = rnd(2.0, 4.0);
          if (d < SHOOT_RANGE) {
            var hitChance = d < 20 ? 0.5 : d < 40 ? 0.35 : 0.2;
            if (Math.random() < hitChance) {
              dmg = 14 + Math.round(Math.random() * 8);
              _playerHP -= dmg;
              showMsg('Sniper fire! -' + dmg + ' HP', 1.0);
              if (_playerHP <= 0) { triggerGameOver('AGENT DOWN! Mission failed.'); }
            }
          }
        }
      }
    }
  }

  function updateBoss(dt) {
    if (!_boss || !_boss.alive) return;
    if (!_playerPos || !_trainRoot) return;

    /* Boss moves with train — position is relative to _trainRoot */
    /* Get boss world position */
    var bossWorldPos = new THREE.Vector3();
    _boss.mesh.getWorldPosition(bossWorldPos);

    var d = dist3(_playerPos, bossWorldPos);

    /* Face player */
    _boss.mesh.rotation.y = Math.atan2(
      _playerPos.x - bossWorldPos.x,
      _playerPos.z - bossWorldPos.z
    );

    /* Alert always if player is in range */
    if (d < SHOOT_RANGE) {
      _boss.alertState = true;
      _boss.alertTimer = 5;
    }
    if (_boss.alertTimer > 0) { _boss.alertTimer -= dt; }

    /* Shooting */
    _boss.shootTimer -= dt;
    if (_boss.shootTimer <= 0) {
      _boss.shootTimer = rnd(0.7, 1.4);
      if (d < SHOOT_RANGE * 1.2 && _boss.alertState) {
        var hitChance = d < 8 ? 0.55 : d < 20 ? 0.38 : 0.2;
        if (Math.random() < hitChance) {
          var dmg2 = 16 + Math.round(Math.random() * 10);
          _playerHP -= dmg2;
          if (_playerHP <= 0) { triggerGameOver('AGENT DOWN! Mission failed.'); }
        }
      }
    }

    /* Boss triggering bomb at 30% HP */
    if (_boss.bombTriggering && !_bombDefused) {
      _boss.bombTriggerTimer -= dt;
      if (!_bombTriggerWarned && _boss.bombTriggerTimer < 3.5) {
        _bombTriggerWarned = true;
      }
      if (_boss.bombTriggerTimer <= 0) {
        _bombTriggered = true;
        _bombDefused = false;
        triggerGameOver('VASIL DETONATED THE BOMB! Station destroyed — mission failed!');
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MOVING TRAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateMovingTrain(dt) {
    if (!_trainRoot) return;

    /* Gradually increase speed */
    if (_departureTimer > 30) {
      _trainSpeed = TRAIN_MOVE_SPEED;
    } else if (_departureTimer > 0) {
      /* Speeding up in final 30s */
      _trainSpeed = TRAIN_MOVE_SPEED + (30 - _departureTimer) / 30 * (TRAIN_DEPART_SPEED - TRAIN_MOVE_SPEED);
    } else {
      /* Timer expired — departure speed */
      _trainSpeed = TRAIN_DEPART_SPEED;
      if (!_trainDeparted) {
        _trainDeparted = true;
        if (!_bombDefused) {
          triggerGameOver('Train departed with the bomb! Station lost — mission failed!');
        }
      }
    }

    /* Move train along Z axis (forward motion of the train going south) */
    _trainRoot.position.z += _trainSpeed * dt;

    /* Update bomb world position */
    if (_bombMesh) {
      _bombMesh.getWorldPosition(_bombWorldPos);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DEPARTURE TIMER
  ══════════════════════════════════════════════════════════════════════════ */

  function updateDepartureTimer(dt) {
    if (_gameOver) return;
    _departureTimer -= dt;

    /* Spawn boss at halfway point */
    if (!_bossSpawned && _departureTimer <= DEPARTURE_TIMER * BOSS_TRIGGER_FRACTION) {
      spawnBoss();
    }

    /* Warning alerts */
    if (_departureTimer <= 60 && _departureTimer > 59) {
      showMsg('1 MINUTE until train departs! Defuse the bomb!', 3);
    }
    if (_departureTimer <= 30 && _departureTimer > 29) {
      showMsg('30 SECONDS — TRAIN ACCELERATING!', 3);
    }
    if (_departureTimer <= 10 && _departureTimer > 9) {
      showMsg('10 SECONDS! FINAL WARNING!', 3);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     WIN / LOSE CONDITIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function checkWinCondition() {
    if (_gameOver) return;
    if (_bombDefused && !_bossAlive && _hostagesFreed >= TOTAL_HOSTAGES) {
      _gameOver = true;
      _won = true;
      showMsg(
        'MISSION COMPLETE!\n' +
        'All ' + TOTAL_HOSTAGES + ' hostages freed!\n' +
        'Bomb defused! Vasil eliminated!\n' +
        'Train station secured!', 0
      );
    } else if (_bombDefused && !_bossAlive) {
      showMsg(
        'Bomb defused & Vasil eliminated!\nFree remaining ' +
        (TOTAL_HOSTAGES - _hostagesFreed) + ' hostage(s)!', 3
      );
    } else if (_bombDefused && _hostagesFreed >= TOTAL_HOSTAGES) {
      showMsg('Bomb defused & all hostages freed! Now eliminate Vasil!', 3);
    } else if (!_bossAlive && _hostagesFreed >= TOTAL_HOSTAGES) {
      showMsg('Vasil down & all hostages freed! Defuse the bomb!', 3);
    }
  }

  function triggerGameOver(msg) {
    if (_gameOver) return;
    _gameOver = true;
    _won = false;
    showMsg('MISSION FAILED — ' + msg, 0);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function update() {
    if (!_active) return;

    var now = performance.now() / 1000;
    var dt = Math.min(now - _lastTime, 0.1);
    _lastTime = now;

    if (_gameOver) {
      updateHUD();
      if (_hudMsgTimer > 0) { _hudMsgTimer -= dt; }
      return;
    }

    updateDepartureTimer(dt);
    updatePlayer(dt);
    updateTerrorists(dt);
    updateSnipers(dt);
    updateBoss(dt);
    updateMovingTrain(dt);

    /* Transient message timer */
    if (_hudMsgTimer > 0) {
      _hudMsgTimer -= dt;
      if (_hudMsgTimer <= 0 && _hudMsg) { _hudMsg.style.display = 'none'; }
    }

    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════════════════════ */

  function resetState() {
    var scene = getScene();

    if (_sceneRoot && scene) { scene.remove(_sceneRoot); _sceneRoot = null; }
    if (_trainRoot && scene) { scene.remove(_trainRoot); _trainRoot = null; }

    /* Remove any lighting added by this module */
    if (scene) {
      var oldAmb = scene.getObjectByName('tss_ambient');
      var oldSun = scene.getObjectByName('tss_sun');
      var oldFill = scene.getObjectByName('tss_fill');
      if (oldAmb) scene.remove(oldAmb);
      if (oldSun) scene.remove(oldSun);
      if (oldFill) scene.remove(oldFill);
    }

    _terrorists    = [];
    _snipers       = [];
    _hostages      = [];
    _platforms     = [];
    _boss          = null;
    _bombMesh      = null;
    _luggageCarGroup = null;
    _bombWorldPos  = new THREE.Vector3();

    _departureTimer     = DEPARTURE_TIMER;
    _trainDeparted      = false;
    _bossSpawned        = false;
    _bossAlive          = false;
    _bombDefused        = false;
    _bombTriggered      = false;
    _bombTriggerWarned  = false;
    _hostagesFreed      = 0;
    _defuseProgress     = 0;
    _trainX             = 0;
    _trainSpeed         = TRAIN_MOVE_SPEED;
    _gameOver           = false;
    _won                = false;
    _interactHeld       = 0;
    _interactTarget     = null;
    _interactType       = '';
    _shootCooldown      = 0;
    _velY               = 0;
    _onGround           = true;
  }

  function reset() {
    _active = false;
    resetState();

    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }
    if (_hudMsg && _hudMsg.parentNode) { _hudMsg.parentNode.removeChild(_hudMsg); _hudMsg = null; }
    if (document.exitPointerLock) { document.exitPointerLock(); }

    _keys       = {};
    _playerPos  = null;
    _yaw        = 0;
    _pitch      = 0;
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

  /* ── Public API ────────────────────────────────────────────────────────── */
  return { init: init, update: update, reset: reset };

}());
