/* ───────────────────────────────────────────────────────────────────────────
   train-robbery.js — Train Robbery Mini-Game
   API: window.TrainRobbery = { init, update, reset }
   Controls:
     T + R (simultaneous, 400ms window) → activate module
     W / S                              → move forward / backward along train
     A / D                              → strafe left / right
     Space                              → jump between cars / getaway leap
     G                                  → grapple rope swing between cars
     D key                              → place dynamite on car coupling
     E                                  → interact (pick up gold / keycard)
     Mouse                              → look / aim
   ─────────────────────────────────────────────────────────────────────────── */
window.TrainRobbery = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active         = false;
  var _keyPressTime   = { T: 0, R: 0 };
  var ACTIVATE_WINDOW = 0.4; // seconds

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;
  var _clock    = 0;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys        = {};
  var _mouseX      = 0;
  var _mouseY      = 0;
  var _yaw         = 0;
  var _pitch       = 0;
  var _mouseDown   = false;

  /* ── Train state ───────────────────────────────────────────────────────── */
  var _trainGroup  = null;
  var _trainZ      = 0;
  var _trainSpeed  = 12.0;     // u/s, base speed
  var TRAIN_LOOP   = 200;      // loop after 200 units

  /* ── Car definitions ───────────────────────────────────────────────────── */
  // 8 cars: ENGINE(0), COAL(1), PASSENGER(2), CARGO(3), PASSENGER(4), COAL(5), CARGO(6), CABOOSE(7)
  var CAR_COUNT   = 8;
  var CAR_LEN     = 8;         // BoxGeometry length
  var CAR_GAP     = 6;         // gap between cars (for jumping)
  var CAR_SPACING = CAR_LEN + CAR_GAP; // 14 units center-to-center

  var _cars = [];              // { group, type, localZ, windows:[], couplingDynamic:null }

  /* ── Gold vault / inventory ────────────────────────────────────────────── */
  var _goldBars        = [];   // { mesh, inCargo, carried, delivered }
  var _goldCarried     = false;
  var _goldDelivered   = 0;
  var GOLD_TOTAL       = 3;
  var _hasKeycard      = false;
  var _cargoUnlocked   = false;
  var _vaultMesh       = null;
  var _keycardMesh     = null;
  var _saddlebagMesh   = null;
  var _getawayLoaded   = false;

  /* ── Guards ────────────────────────────────────────────────────────────── */
  var _guards      = [];       // { group, hp, alive, carIdx, patrolDir, patrolTimer, alertTimer }
  var GUARD_TOTAL  = 12;
  var _allAlerted  = false;
  var _alertTimer  = 0;

  /* ── Sheriff ───────────────────────────────────────────────────────────── */
  var _sheriff     = null;     // { group, hp, alive }
  var SHERIFF_HP   = 300;

  /* ── Horse riders ──────────────────────────────────────────────────────── */
  var _horses      = [];       // { group, riderGroup, shootTimer }
  var _horsesActive = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerGroup   = null;
  var _playerPos     = { x: 0, y: 0, z: 0 };
  var _playerVel     = { x: 0, y: 0, z: 0 };
  var _playerHP      = 100;
  var _playerCarIdx  = 7;      // start at caboose (rear)
  var _playerOnRoof  = true;
  var _playerOnTrain = true;
  var _fallTimer     = 0;

  /* ── Grapple rope ──────────────────────────────────────────────────────── */
  var _ropeGroup      = null;
  var _ropeActive     = false;
  var _ropeSwingAngle = 0;
  var _ropeSwingVel   = 0;
  var _ropePivotX     = 0;
  var _ropePivotY     = 0;
  var _ropePivotZ     = 0;
  var ROPE_LEN        = 6;

  /* ── Dynamite ──────────────────────────────────────────────────────────── */
  var _dynamites    = [];      // { mesh, carIdx, timer, blown }
  var _dynHasBlink  = [];
  var DYN_FUSE      = 3.0;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Phase / outcome ───────────────────────────────────────────────────── */
  var _phase   = 'ROBBERY';   // ROBBERY, GETAWAY, COMPLETE
  var _outcome = '';

  /* ── Smoke particles (engine) ──────────────────────────────────────────── */
  var _smokeLight  = null;
  var _smokeTimer  = 0;

  /* ── Wind ──────────────────────────────────────────────────────────────── */
  var WIND_BASE = 0.4;         // aiming offset at 12 u/s

  /* ════════════════════════════════════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMat(color, emissive) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000
    });
  }

  function rnd(min, max) { return min + Math.random() * (max - min); }

  function carWorldZ(idx) {
    // Car 0 is engine at front (highest Z), cars go back from there
    return _trainGroup ? _trainGroup.position.z + _cars[idx].localZ : _cars[idx].localZ;
  }

  function carLocalZ(idx) {
    // Rear of train starts at localZ = 0 (caboose), engine at front
    // Car spacing: 14 per slot; caboose = index 7, engine = index 0
    return (CAR_COUNT - 1 - idx) * CAR_SPACING;
  }

  function roofY() { return 3.5; }       // top of car + player center offset
  function interiorY() { return 1.0; }   // floor of car interior + player center

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildEngine(localZ) {
    var g = new THREE.Group();

    // Main body — darker weathered color
    var bodyGeo = new THREE.BoxGeometry(4, 3, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x443322));
    body.position.set(0, 1.5, 0);
    g.add(body);

    // Boiler (cylinder on top-front)
    var boilerGeo = new THREE.CylinderGeometry(1.1, 1.1, 5, 10);
    var boiler    = new THREE.Mesh(boilerGeo, makeMat(0x332211));
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 2.2, 1.5);
    g.add(boiler);

    // Smokestack — CylinderGeometry
    var stackGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.0, 8);
    var stack    = new THREE.Mesh(stackGeo, makeMat(0x222222));
    stack.position.set(0, 4.5, 2.5);
    g.add(stack);

    // PointLight smoke effect
    _smokeLight = new THREE.PointLight(0x444444, 0.8, 12);
    _smokeLight.position.set(0, 6, 2.5);
    g.add(_smokeLight);

    // Cowcatcher
    var cowGeo = new THREE.BoxGeometry(4.2, 0.4, 1.6);
    var cow    = new THREE.Mesh(cowGeo, makeMat(0x333333));
    cow.position.set(0, 0.4, 4.4);
    g.add(cow);

    // Cab
    var cabGeo = new THREE.BoxGeometry(3.2, 2, 2.5);
    var cab    = new THREE.Mesh(cabGeo, makeMat(0x443322));
    cab.position.set(0, 3.5, -2);
    g.add(cab);

    // Wheels
    var wGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.5, 10);
    var wMat = makeMat(0x111111);
    var wheelPos = [
      { x: -2.1, z: -2.5 }, { x: 2.1, z: -2.5 },
      { x: -2.1, z:  0.0 }, { x: 2.1, z:  0.0 },
      { x: -2.1, z:  2.5 }, { x: 2.1, z:  2.5 }
    ];
    for (var wi = 0; wi < wheelPos.length; wi++) {
      var wm = new THREE.Mesh(wGeo, wMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wheelPos[wi].x, -0.2, wheelPos[wi].z);
      g.add(wm);
    }

    g.position.set(0, 0, localZ);
    _trainGroup.add(g);
    return g;
  }

  function buildCoalCar(localZ) {
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(4, 3, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x663322));
    body.position.set(0, 1.5, 0);
    g.add(body);

    // Coal heap
    var coalGeo = new THREE.BoxGeometry(3.2, 1.2, 6.5);
    var coal    = new THREE.Mesh(coalGeo, makeMat(0x111111));
    coal.position.set(0, 3.6, 0);
    g.add(coal);

    addWheels(g);
    g.position.set(0, 0, localZ);
    _trainGroup.add(g);
    return g;
  }

  function buildPassengerCar(localZ) {
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(4, 3, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x663322));
    body.position.set(0, 1.5, 0);
    g.add(body);

    // Windows — LineSegments on both sides
    var winPts = [];
    var winZPositions = [-2.5, 0.0, 2.5];
    var sides = [-2.05, 2.05];
    for (var si = 0; si < sides.length; si++) {
      var sx = sides[si];
      for (var wi = 0; wi < winZPositions.length; wi++) {
        var wz = winZPositions[wi];
        // window rectangle
        winPts.push(new THREE.Vector3(sx, 1.8, wz - 0.55));
        winPts.push(new THREE.Vector3(sx, 1.8, wz + 0.55));
        winPts.push(new THREE.Vector3(sx, 1.8, wz + 0.55));
        winPts.push(new THREE.Vector3(sx, 2.8, wz + 0.55));
        winPts.push(new THREE.Vector3(sx, 2.8, wz + 0.55));
        winPts.push(new THREE.Vector3(sx, 2.8, wz - 0.55));
        winPts.push(new THREE.Vector3(sx, 2.8, wz - 0.55));
        winPts.push(new THREE.Vector3(sx, 1.8, wz - 0.55));
      }
    }
    var winBuf = new THREE.BufferGeometry().setFromPoints(winPts);
    var winLine = new THREE.LineSegments(winBuf, new THREE.LineBasicMaterial({ color: 0x88AACC }));
    g.add(winLine);

    addWheels(g);
    g.position.set(0, 0, localZ);
    _trainGroup.add(g);
    return g;
  }

  function buildCargoCar(localZ, isGoldCar) {
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(4, 3, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x663322));
    body.position.set(0, 1.5, 0);
    g.add(body);

    // Roof boards
    var roofGeo = new THREE.BoxGeometry(4, 0.2, 8);
    var roofM   = new THREE.Mesh(roofGeo, makeMat(0x552211));
    roofM.position.set(0, 3.1, 0);
    g.add(roofM);

    if (isGoldCar) {
      // Gold vault inside (visible through scene)
      var vaultGeo = new THREE.BoxGeometry(2, 2, 2);
      var vaultM   = new THREE.Mesh(vaultGeo, makeMat(0xFFD700, 0x554400));
      vaultM.position.set(0, 2.0, 0);
      g.add(vaultM);
      _vaultMesh = vaultM;

      // 3 individual gold bars
      for (var bi = 0; bi < GOLD_TOTAL; bi++) {
        var barGeo = new THREE.BoxGeometry(0.4, 0.25, 0.8);
        var barM   = new THREE.Mesh(barGeo, makeMat(0xFFD700, 0x443300));
        barM.position.set((bi - 1) * 0.6, 2.0, 0);
        g.add(barM);
        _goldBars.push({ mesh: barM, carGroup: g, inCargo: true, carried: false, delivered: false, localOffset: { x: (bi - 1) * 0.6, y: 2.0, z: 0 } });
      }
    }

    addWheels(g);
    g.position.set(0, 0, localZ);
    _trainGroup.add(g);
    return g;
  }

  function buildCaboose(localZ) {
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(4, 3, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x663322));
    body.position.set(0, 1.5, 0);
    g.add(body);

    // Cupola on top
    var cupolaGeo = new THREE.BoxGeometry(2.5, 1.5, 3);
    var cupola    = new THREE.Mesh(cupolaGeo, makeMat(0x552211));
    cupola.position.set(0, 4.0, 0);
    g.add(cupola);

    // Saddlebag / getaway bag at rear of last car
    var bagGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var bagM   = new THREE.Mesh(bagGeo, makeMat(0x885522));
    bagM.position.set(0, 1.5, -3.8);
    g.add(bagM);
    _saddlebagMesh = bagM;

    addWheels(g);
    g.position.set(0, 0, localZ);
    _trainGroup.add(g);
    return g;
  }

  function addWheels(g) {
    var wGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 8);
    var wMat = makeMat(0x111111);
    var offsets = [
      { x: -2.1, z: -2.5 }, { x: 2.1, z: -2.5 },
      { x: -2.1, z:  2.5 }, { x: 2.1, z:  2.5 }
    ];
    for (var i = 0; i < offsets.length; i++) {
      var wm = new THREE.Mesh(wGeo, wMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(offsets[i].x, -0.2, offsets[i].z);
      g.add(wm);
    }
  }

  function addCoupling(g, localZ, frontOrRear) {
    // Simple coupling bar at front or rear of car
    var coupGeo = new THREE.BoxGeometry(0.6, 0.4, 1.2);
    var coupM   = new THREE.Mesh(coupGeo, makeMat(0x444444));
    coupM.position.set(0, 0.5, frontOrRear > 0 ? 4.2 : -4.2);
    g.add(coupM);
    return coupM;
  }

  function buildGuard(carIdx) {
    var g = new THREE.Group();

    // Body — CylinderGeometry marshal blue
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x334455));
    body.position.set(0, 0.6, 0);
    g.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.45, 0);
    g.add(head);

    // Hat
    var hatGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.4, 8);
    var hat    = new THREE.Mesh(hatGeo, makeMat(0x222233));
    hat.position.set(0, 1.75, 0);
    g.add(hat);

    var cz = _cars[carIdx].localZ;
    g.position.set(rnd(-1.2, 1.2), 3.1, cz + rnd(-2.5, 2.5)); // on roof

    _trainGroup.add(g);
    _guards.push({
      group: g,
      hp: 100,
      alive: true,
      carIdx: carIdx,
      patrolDir: (Math.random() > 0.5 ? 1 : -1),
      patrolTimer: rnd(0, 3),
      alertTimer: 0
    });
  }

  function buildSheriff() {
    var g = new THREE.Group();

    // Scaled-up CylinderGeometry body (1.2x scale) in sheriff blue
    var bodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.44, 8);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x2244AA));
    body.position.set(0, 0.72, 0);
    g.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.54, 0.54, 0.54);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.74, 0);
    g.add(head);

    // Star badge
    var badgeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    var badge    = new THREE.Mesh(badgeGeo, makeMat(0xFFDD00, 0x886600));
    badge.position.set(0.38, 1.0, 0);
    g.add(badge);

    // Keycard (attached to sheriff)
    var kcGeo = new THREE.BoxGeometry(0.3, 0.2, 0.05);
    var kcM   = new THREE.Mesh(kcGeo, makeMat(0xFFAA00, 0x664400));
    kcM.position.set(-0.38, 1.0, 0);
    g.add(kcM);
    _keycardMesh = kcM;

    // Sheriff is in passenger car (car index 2, localZ)
    var passCar = _cars[2];
    g.position.set(0.5, interiorY(), passCar.localZ);
    _trainGroup.add(g);

    _sheriff = { group: g, hp: SHERIFF_HP, alive: true };
  }

  function buildHorseRiders() {
    for (var hi = 0; hi < 4; hi++) {
      var hg = new THREE.Group();

      // Horse body — BoxGeometry 0xAA8855
      var horseGeo = new THREE.BoxGeometry(3, 1.5, 3);
      var horse    = new THREE.Mesh(horseGeo, makeMat(0xAA8855));
      horse.position.set(0, 0.75, 0);
      hg.add(horse);

      // Horse legs (4 boxes)
      var legGeo = new THREE.BoxGeometry(0.3, 1.0, 0.3);
      var legMat = makeMat(0x996644);
      var legOffsets = [
        { x: -0.8, z: -0.9 }, { x: 0.8, z: -0.9 },
        { x: -0.8, z:  0.9 }, { x: 0.8, z:  0.9 }
      ];
      for (var li = 0; li < legOffsets.length; li++) {
        var leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(legOffsets[li].x, -0.25, legOffsets[li].z);
        hg.add(leg);
      }

      // Horse head
      var hhGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
      var hh    = new THREE.Mesh(hhGeo, makeMat(0xAA8855));
      hh.position.set(0, 1.6, 1.4);
      hg.add(hh);

      // Rider — simple capsule (CylinderGeometry)
      var rGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.1, 8);
      var rM   = new THREE.Mesh(rGeo, makeMat(0x553322));
      rM.position.set(0, 2.3, 0);
      hg.add(rM);

      // Rider head
      var rhGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
      var rh    = new THREE.Mesh(rhGeo, makeMat(0x8B7355));
      rh.position.set(0, 3.1, 0);
      hg.add(rh);

      // Position alongside train, alternating sides
      var side   = (hi % 2 === 0) ? -6.5 : 6.5;
      var zOff   = ((hi >> 1) * CAR_SPACING * 2);
      hg.position.set(side, -0.5, _cars[6].localZ - zOff);
      _trainGroup.add(hg);

      _horses.push({ group: hg, shootTimer: rnd(1, 3) });
    }
  }

  function buildGround() {
    // Ground plane
    var groundGeo = new THREE.BoxGeometry(80, 0.5, 800);
    var groundM   = new THREE.Mesh(groundGeo, makeMat(0x7A6030));
    groundM.position.set(0, -1.0, 200);
    _scene.add(groundM);

    // Rails
    var railGeo = new THREE.BoxGeometry(0.15, 0.15, 800);
    var railMat = makeMat(0x888888);
    var railL   = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-1.0, -0.4, 200);
    _scene.add(railL);
    var railR   = new THREE.Mesh(railGeo, railMat);
    railR.position.set( 1.0, -0.4, 200);
    _scene.add(railR);

    // Ties
    var tieGeo = new THREE.BoxGeometry(2.8, 0.1, 0.5);
    var tieMat = makeMat(0x5C3A1A);
    for (var ti = 0; ti < 100; ti++) {
      var tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, -0.45, ti * 8 + 4);
      _scene.add(tie);
    }
  }

  function buildPlayer() {
    _playerGroup = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var body    = new THREE.Mesh(bodyGeo, makeMat(0x664422));
    body.position.set(0, 0.5, 0);
    _playerGroup.add(body);

    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var head    = new THREE.Mesh(headGeo, makeMat(0x8B7355));
    head.position.set(0, 1.2, 0);
    _playerGroup.add(head);

    // Cowboy hat
    var hatGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.35, 8);
    var hat    = new THREE.Mesh(hatGeo, makeMat(0x442211));
    hat.position.set(0, 1.55, 0);
    _playerGroup.add(hat);

    _scene.add(_playerGroup);

    // Start on roof of caboose
    var cabooseZ = _trainGroup.position.z + _cars[7].localZ;
    _playerPos.x = 0;
    _playerPos.y = roofY();
    _playerPos.z = cabooseZ;
    _playerCarIdx  = 7;
    _playerOnRoof  = true;
    _playerOnTrain = true;
  }

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'tr-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 18px',
      'border:1px solid #FFCC4444',
      'letter-spacing:1px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);
  }

  function updateHUD() {
    if (!_hud || !_active) return;
    var guardsAlive = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      if (_guards[gi].alive) guardsAlive++;
    }
    var speed = _trainSpeed.toFixed(0);
    var getaway = _getawayLoaded ? 'LOADED' : (_goldDelivered + '/' + GOLD_TOTAL + ' BARS');
    var horsePart = _horsesActive ? ' [HORSE RIDERS: 4]' : '';
    _hud.textContent = 'TRAIN ROBBERY [SPEED: ' + speed + 'm/s] [GOLD: ' + _goldDelivered + '/' + GOLD_TOTAL + '] ' +
      '[GUARDS: ' + guardsAlive + ']' + horsePart + ' | GETAWAY: ' + getaway;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function buildScene() {
    var ambient = new THREE.AmbientLight(0x664422, 0.7);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFDDAA, 1.1);
    sun.position.set(30, 50, 20);
    _scene.add(sun);

    buildGround();

    _trainGroup = new THREE.Group();
    _trainGroup.position.set(0, 0, 0);
    _scene.add(_trainGroup);

    // Build 8 cars in order; caboose at localZ=0 (rear), engine at front
    // localZ increases toward engine so engine has highest z
    for (var ci = 0; ci < CAR_COUNT; ci++) {
      var lz = carLocalZ(ci);
      var cGroup = null;
      var carType = '';

      if (ci === 0) {
        carType = 'ENGINE';
        cGroup  = buildEngine(lz);
      } else if (ci === 1) {
        carType = 'COAL';
        cGroup  = buildCoalCar(lz);
      } else if (ci === 2) {
        carType = 'PASSENGER';
        cGroup  = buildPassengerCar(lz);
      } else if (ci === 3) {
        carType = 'CARGO_GOLD';
        cGroup  = buildCargoCar(lz, true);
      } else if (ci === 4) {
        carType = 'PASSENGER';
        cGroup  = buildPassengerCar(lz);
      } else if (ci === 5) {
        carType = 'COAL';
        cGroup  = buildCoalCar(lz);
      } else if (ci === 6) {
        carType = 'CARGO';
        cGroup  = buildCargoCar(lz, false);
      } else {
        carType = 'CABOOSE';
        cGroup  = buildCaboose(lz);
      }

      // Coupling at front of each car except engine
      var coupMesh = null;
      if (ci > 0) {
        coupMesh = addCoupling(cGroup, lz, 1);
      }

      _cars.push({ group: cGroup, type: carType, localZ: lz, couplingMesh: coupMesh });
    }

    // Spawn guards spread across all 8 cars (12 total)
    var guardDist = [2, 1, 2, 1, 1, 1, 2, 2];
    for (var gci = 0; gci < CAR_COUNT; gci++) {
      for (var gg = 0; gg < guardDist[gci]; gg++) {
        buildGuard(gci);
      }
    }

    buildSheriff();
    buildPlayer();
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    var k = e.key.toUpperCase();
    if (!_keys[k]) {
      _keys[k] = true;
      _keyPressTime[k] = _clock;
      checkActivation(k);
    }
    // Prevent space scrolling
    if (k === ' ') e.preventDefault();
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY = Math.max(-0.7, Math.min(0.7, _mouseY));
  }

  function onMouseDown() { _mouseDown = true; }

  function checkActivation(k) {
    if (_active) return;
    if (k === 'T' || k === 'R') {
      var other = (k === 'T') ? 'R' : 'T';
      if (_keys[other] && _keyPressTime[other] > 0) {
        var diff = Math.abs(_clock - _keyPressTime[other]);
        if (diff < ACTIVATE_WINDOW) {
          activate();
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) return;
    _active = true;
    buildScene();
    buildHUD();

    _camera.position.set(0, roofY() + 5, _cars[7].localZ - 8);
    _camera.lookAt(0, roofY(), _cars[7].localZ);
  }

  /* ════════════════════════════════════════════════════════════════════════
     TRAIN MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updateTrain(dt) {
    // Speed increases at 3min and 5min
    if (_clock >= 300) {
      _trainSpeed = 18.0;
    } else if (_clock >= 180) {
      _trainSpeed = 15.0;
    } else {
      _trainSpeed = 12.0;
    }

    _trainZ += _trainSpeed * dt;

    // Loop train after 200 units
    if (_trainZ > TRAIN_LOOP) {
      _trainZ -= TRAIN_LOOP;
    }

    _trainGroup.position.z = _trainZ;

    // Animate smoke light flicker
    if (_smokeLight) {
      _smokeTimer += dt;
      _smokeLight.intensity = 0.6 + 0.4 * Math.sin(_smokeTimer * 7);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_phase !== 'ROBBERY' && _phase !== 'GETAWAY') return;

    _yaw   = _mouseX;
    _pitch = _mouseY;

    var speed = 6.0;
    var fdx = 0, fdz = 0;
    if (_keys['W']) fdz += 1;
    if (_keys['S']) fdz -= 1;
    if (_keys['A']) fdx -= 1;
    if (_keys['D']) fdx += 1;

    var sy = Math.sin(_yaw), cy = Math.cos(_yaw);
    var moveDX = fdx * cy + fdz * sy;
    var moveDZ = fdz * cy - fdx * sy;

    // Wind effect on aiming (cosmetic: offset relative to speed factor)
    var windFactor = (_trainSpeed / 12.0) * WIND_BASE;
    if (_playerOnRoof) {
      moveDX += windFactor * 0.15 * dt;
    }

    if (!_ropeActive) {
      _playerPos.x += moveDX * speed * dt;
      _playerPos.z += moveDZ * speed * dt;
      // Train carries player forward (local space)
      _playerPos.z += _trainSpeed * dt;

      // Gravity
      _playerVel.y -= 20 * dt;
      _playerPos.y += _playerVel.y * dt;
    } else {
      // Rope swing physics
      updateRopeSwing(dt);
    }

    // Determine what the player is standing on
    resolvePlayerFloor();

    // Jump
    if ((_keys[' '] || _keys['SPACE']) && _playerOnTrain && _playerVel.y <= 0.05) {
      _playerVel.y = 9.0;
    }

    // Fall off train → damage + respawn
    if (_playerPos.y < -4 || _fallTimer > 3.0) {
      respawn();
    }

    // Clamp X within world
    _playerPos.x = Math.max(-14, Math.min(14, _playerPos.x));

    // Update mesh
    _playerGroup.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _playerGroup.rotation.y = _yaw;

    // Camera third-person follow
    var camBackX = -Math.sin(_yaw) * 5;
    var camBackZ = -Math.cos(_yaw) * 5;
    _camera.position.set(
      _playerPos.x + camBackX,
      _playerPos.y + 3.5,
      _playerPos.z + camBackZ
    );
    _camera.lookAt(_playerPos.x, _playerPos.y + 0.8, _playerPos.z);
  }

  function resolvePlayerFloor() {
    var roofFloorY     = roofY();
    var interiorFloorY = interiorY();
    var bestCar        = getNearestCar();

    if (bestCar < 0) {
      _fallTimer += 0.016;
      _playerOnRoof  = false;
      _playerOnTrain = false;
      return;
    }

    _playerCarIdx = bestCar;
    var trainLX = _playerPos.x - _trainGroup.position.x;
    var inWidth = (Math.abs(trainLX) < 2.2);

    if (inWidth && _playerPos.y <= roofFloorY && _playerVel.y <= 0) {
      if (_playerPos.y >= interiorFloorY - 0.1) {
        // On roof
        _playerPos.y  = roofFloorY;
        _playerVel.y  = 0;
        _playerOnRoof  = true;
        _playerOnTrain = true;
        _fallTimer     = 0;
      }
    } else if (inWidth && _playerPos.y <= interiorFloorY && _playerVel.y <= 0) {
      // Interior (fell inside?)
      _playerPos.y  = interiorFloorY;
      _playerVel.y  = 0;
      _playerOnRoof  = false;
      _playerOnTrain = true;
      _fallTimer     = 0;
    } else if (_playerPos.y > roofFloorY) {
      _playerOnRoof  = false;
      _playerOnTrain = false;
      _fallTimer     = 0;
    } else {
      _fallTimer += 0.016;
      _playerOnRoof  = false;
      if (_fallTimer > 0.3) _playerOnTrain = false;
    }
  }

  function getNearestCar() {
    var trainLZ = _playerPos.z - _trainGroup.position.z;
    var best = -1, bestDist = 999;
    for (var ci = 0; ci < _cars.length; ci++) {
      var d = Math.abs(trainLZ - _cars[ci].localZ);
      if (d < bestDist) {
        bestDist = d;
        best = ci;
      }
    }
    return (bestDist < CAR_LEN * 0.6) ? best : -1;
  }

  function respawn() {
    _playerHP     = Math.max(10, _playerHP - 25);
    _playerCarIdx = 7;
    _playerPos.x  = 0;
    _playerPos.y  = roofY();
    _playerPos.z  = _trainGroup.position.z + _cars[7].localZ;
    _playerVel    = { x: 0, y: 0, z: 0 };
    _fallTimer    = 0;
    _playerOnRoof  = true;
    _playerOnTrain = true;
    // Drop gold if carrying
    if (_goldCarried) dropGold();
  }

  /* ════════════════════════════════════════════════════════════════════════
     ROPE SWING (G key)
  ════════════════════════════════════════════════════════════════════════ */

  var _gKeyWasDown = false;

  function tryGrapple() {
    var gDown    = !!_keys['G'];
    var gPressed = gDown && !_gKeyWasDown;
    _gKeyWasDown = gDown;
    if (!gPressed) return;

    if (_ropeActive) {
      // Release rope
      releaseRope();
      return;
    }

    // Find a gap between the current car and the one in front
    var ci = _playerCarIdx;
    if (ci <= 0) return; // no car in front of engine

    // Pivot point: midpoint of gap between ci and ci-1
    var gapLZ = (_cars[ci].localZ + _cars[ci - 1].localZ) * 0.5;
    _ropePivotX = _playerPos.x;
    _ropePivotY = roofY() + ROPE_LEN + 1; // attach above roof
    _ropePivotZ = _trainGroup.position.z + gapLZ;

    _ropeActive     = true;
    _ropeSwingAngle = -0.4; // start swinging from behind
    _ropeSwingVel   = 2.0;  // initial swing toward next car

    // Visual rope
    buildRopeMesh();
  }

  function buildRopeMesh() {
    if (_ropeGroup) { _scene.remove(_ropeGroup); _ropeGroup = null; }
    var pts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -ROPE_LEN, 0)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xCCBB88 });
    _ropeGroup = new THREE.LineSegments(geo, mat);
    _scene.add(_ropeGroup);
  }

  function updateRopeSwing(dt) {
    // Pendulum physics
    var g = 18.0;
    _ropeSwingVel += (-g / ROPE_LEN) * Math.sin(_ropeSwingAngle) * dt;
    _ropeSwingVel *= 0.995; // damping
    _ropeSwingAngle += _ropeSwingVel * dt;

    // Update player position from pendulum
    _playerPos.x = _ropePivotX + Math.sin(_ropeSwingAngle) * ROPE_LEN;
    _playerPos.y = _ropePivotY - Math.cos(_ropeSwingAngle) * ROPE_LEN;
    _playerPos.z = _ropePivotZ;

    // Pivot travels with train
    _ropePivotZ += _trainSpeed * dt;

    // Update rope mesh
    if (_ropeGroup) {
      _ropeGroup.position.set(_ropePivotX, _ropePivotY, _ropePivotZ);
      var pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.sin(_ropeSwingAngle) * ROPE_LEN,
          -Math.cos(_ropeSwingAngle) * ROPE_LEN,
          0
        )
      ];
      _ropeGroup.geometry.setFromPoints(pts);
    }

    // Release if rope brings player to a car surface or angle too large
    if (Math.abs(_ropeSwingAngle) > 1.1 || _ropeSwingVel < -1.0) {
      releaseRope();
    }
  }

  function releaseRope() {
    if (!_ropeActive) return;
    _ropeActive = false;
    // Give the player some velocity from swing
    _playerVel.x = Math.sin(_ropeSwingAngle) * 5;
    _playerVel.y = 4.0;
    if (_ropeGroup) { _scene.remove(_ropeGroup); _ropeGroup = null; }
  }

  /* ════════════════════════════════════════════════════════════════════════
     DYNAMITE (D key)
  ════════════════════════════════════════════════════════════════════════ */

  var _dKeyWasDown = false;

  function tryPlaceDynamite() {
    var dDown    = !!_keys['D'];
    var dPressed = dDown && !_dKeyWasDown;
    _dKeyWasDown = dDown;
    if (!dPressed) return;

    if (_phase !== 'ROBBERY') return;

    // Place dynamite at nearest coupling (front of current car)
    var ci = _playerCarIdx;
    if (ci <= 0) return;

    var coupLZ = _cars[ci].localZ + (CAR_LEN / 2 + CAR_GAP / 2);
    var dynGeo  = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    var dynMat  = makeMat(0xFF4400, 0x441100);
    var dynM    = new THREE.Mesh(dynGeo, dynMat);
    dynM.position.set(0, 3.3, _cars[ci].localZ + 4.4);
    _trainGroup.add(dynM);

    _dynamites.push({ mesh: dynM, carIdx: ci, timer: DYN_FUSE, blown: false, blinkState: false });

    // Alert all guards for 30s due to loud noise
    _allAlerted = true;
    _alertTimer = 30.0;
  }

  function updateDynamite(dt) {
    for (var di = _dynamites.length - 1; di >= 0; di--) {
      var d = _dynamites[di];
      if (d.blown) { _dynamites.splice(di, 1); continue; }

      d.timer -= dt;

      // Blink effect
      d.blinkState = (Math.floor(d.timer * 4) % 2 === 0);
      d.mesh.visible = d.blinkState || d.timer > 0.5;

      if (d.timer <= 0) {
        // Explode — blow open locked cargo car / door near coupling
        _cargoUnlocked = true;
        // Flash
        spawnFlash(d.mesh.position, _trainGroup);

        _trainGroup.remove(d.mesh);
        d.blown = true;

        // All guards alerted if not already
        _allAlerted = true;
        _alertTimer = 30.0;
      }
    }
  }

  function spawnFlash(localPos, parent) {
    var fGeo = new THREE.SphereGeometry(0.6, 6, 4);
    var fMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF3300 });
    var fM   = new THREE.Mesh(fGeo, fMat);
    fM.position.copy(localPos);
    parent.add(fM);
    fM.userData.deathTimer = 0.4;
    if (!parent.userData.flashes) parent.userData.flashes = [];
    parent.userData.flashes.push(fM);
  }

  function updateFlashes(dt) {
    var parents = [_trainGroup, _scene];
    for (var pi = 0; pi < parents.length; pi++) {
      var p = parents[pi];
      if (!p || !p.userData || !p.userData.flashes) continue;
      var arr = p.userData.flashes;
      for (var fi = arr.length - 1; fi >= 0; fi--) {
        arr[fi].userData.deathTimer -= dt;
        if (arr[fi].userData.deathTimer <= 0) {
          p.remove(arr[fi]);
          arr.splice(fi, 1);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARD AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    if (_alertTimer > 0) { _alertTimer -= dt; }
    if (_alertTimer <= 0) { _allAlerted = false; }

    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;

      // Patrol on car roof
      g.patrolTimer += dt;
      var patrolPeriod = _allAlerted ? 1.5 : 3.0;
      if (g.patrolTimer > patrolPeriod) {
        g.patrolDir = -g.patrolDir;
        g.patrolTimer = 0;
      }

      var targetLZ = _cars[g.carIdx].localZ + g.patrolDir * 3;
      g.group.position.z += (targetLZ - g.group.position.z) * dt * 2;
      g.group.rotation.y = g.patrolDir > 0 ? Math.PI : 0;

      // Check if player is nearby — attack
      var gwp = new THREE.Vector3();
      g.group.getWorldPosition(gwp);
      var pp3 = new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);
      var distG = gwp.distanceTo(pp3);

      var alertRange = _allAlerted ? 20 : 8;
      if (distG < alertRange) {
        g.alertTimer += dt;
        if (g.alertTimer > 1.0) {
          // Shoot player
          _playerHP -= 6 * dt;
          if (_playerHP <= 0) { respawn(); _playerHP = 80; }
        }
      } else {
        g.alertTimer = Math.max(0, g.alertTimer - dt * 0.5);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHERIFF AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateSheriff(dt) {
    if (!_sheriff || !_sheriff.alive) return;
    // Pace in passenger car
    var sheriffLZ = _cars[2].localZ;
    _sheriff.group.position.z = sheriffLZ + Math.sin(_clock * 0.6) * 2.5;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HORSE RIDERS
  ════════════════════════════════════════════════════════════════════════ */

  function updateHorses(dt) {
    if (!_horsesActive) {
      // Spawn at T=120s
      if (_clock >= 120 && _horses.length === 0) {
        buildHorseRiders();
        _horsesActive = true;
      }
      return;
    }

    for (var hi = 0; hi < _horses.length; hi++) {
      var h = _horses[hi];
      // Gallop alongside train — same speed
      // They are children of trainGroup so they ride automatically

      // Animated gallop (bob up/down)
      h.group.position.y = -0.5 + Math.abs(Math.sin(_clock * 6 + hi)) * 0.25;

      // Shoot at player
      h.shootTimer -= dt;
      if (h.shootTimer <= 0) {
        h.shootTimer = rnd(1.5, 3.5);
        // Wind makes aiming worse — just deal damage with accuracy check
        var windPenalty = _trainSpeed / 18.0;
        var hitChance = 0.35 * (1 - windPenalty * 0.4);
        if (Math.random() < hitChance) {
          _playerHP -= 12;
          if (_playerHP <= 0) { respawn(); _playerHP = 80; }
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTIONS (E key / clicks)
  ════════════════════════════════════════════════════════════════════════ */

  var _eKeyWasDown = false;

  function updateInteractions() {
    var eDown    = !!_keys['E'];
    var ePressed = eDown && !_eKeyWasDown;
    _eKeyWasDown = eDown;

    var clickPressed = _mouseDown;
    _mouseDown = false;

    if (!ePressed && !clickPressed) return;

    var pp3 = new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);

    // --- SHOOT at nearest guard in aim direction ---
    if (clickPressed) {
      shootAtNearestTarget(pp3);
      return;
    }

    if (!ePressed) return;

    // Pick up keycard from sheriff (must defeat or be adjacent)
    if (!_hasKeycard && _sheriff && _sheriff.alive) {
      var swp = new THREE.Vector3();
      _sheriff.group.getWorldPosition(swp);
      if (pp3.distanceTo(swp) < 3.0) {
        // Attack sheriff
        _sheriff.hp -= 60;
        if (_sheriff.hp <= 0) {
          killSheriff();
        }
        return;
      }
    }

    if (!_hasKeycard && _sheriff && !_sheriff.alive && _keycardMesh) {
      var kwp = new THREE.Vector3();
      _keycardMesh.getWorldPosition(kwp);
      if (pp3.distanceTo(kwp) < 3.0) {
        pickupKeycard();
        return;
      }
    }

    // Unlock cargo car with keycard
    if (_hasKeycard && !_cargoUnlocked && _playerCarIdx === 3) {
      _cargoUnlocked = true;
      if (_vaultMesh) {
        _vaultMesh.material = makeMat(0xFFD700, 0x887700);
      }
      return;
    }

    // Pick up a gold bar (one at a time, must have cargo unlocked or dynamited)
    if (!_goldCarried && _cargoUnlocked) {
      for (var bi = 0; bi < _goldBars.length; bi++) {
        var bar = _goldBars[bi];
        if (bar.delivered || bar.carried) continue;
        var bwp = new THREE.Vector3();
        bar.mesh.getWorldPosition(bwp);
        if (pp3.distanceTo(bwp) < 3.5) {
          pickupGold(bi);
          return;
        }
      }
    }

    // Drop gold into saddlebag at caboose
    if (_goldCarried && _saddlebagMesh) {
      var sbwp = new THREE.Vector3();
      _saddlebagMesh.getWorldPosition(sbwp);
      if (pp3.distanceTo(sbwp) < 4.0) {
        deliverGold();
        return;
      }
    }

    // Getaway leap when all gold loaded and on caboose
    if (_getawayLoaded && _playerCarIdx === 7) {
      if ((_keys[' '] || _keys['SPACE'])) {
        _phase   = 'GETAWAY';
        _outcome = 'SUCCESS';
        updateHUD();
        return;
      }
    }
  }

  function pickupKeycard() {
    _hasKeycard = true;
    if (_keycardMesh) {
      _trainGroup.remove(_keycardMesh);
      _keycardMesh = null;
    }
  }

  function pickupGold(idx) {
    var bar     = _goldBars[idx];
    bar.carried = true;
    _goldCarried = true;
    // Attach to player group visually
    _trainGroup.remove(bar.mesh); // remove from car
    bar.mesh.position.set(0.5, 1.6, 0.3);
    _playerGroup.add(bar.mesh);
  }

  function dropGold() {
    for (var bi = 0; bi < _goldBars.length; bi++) {
      var bar = _goldBars[bi];
      if (bar.carried && !bar.delivered) {
        bar.carried = false;
        _goldCarried = false;
        // Drop to train roof below player
        _playerGroup.remove(bar.mesh);
        bar.mesh.position.set(_playerPos.x, roofY(), _playerPos.z);
        _scene.add(bar.mesh);
        return;
      }
    }
  }

  function deliverGold() {
    for (var bi = 0; bi < _goldBars.length; bi++) {
      var bar = _goldBars[bi];
      if (bar.carried && !bar.delivered) {
        bar.delivered = true;
        bar.carried   = false;
        _goldCarried  = false;
        _goldDelivered++;
        _playerGroup.remove(bar.mesh);
        // Show in saddlebag area
        bar.mesh.position.set(_goldDelivered * 0.5 - 1.0, 1.6, _cars[7].localZ - 3.8);
        _trainGroup.add(bar.mesh);

        if (_goldDelivered >= GOLD_TOTAL) {
          _getawayLoaded = true;
        }
        return;
      }
    }
  }

  function killSheriff() {
    if (!_sheriff || !_sheriff.alive) return;
    _sheriff.alive = false;
    _sheriff.group.rotation.z = Math.PI / 2;
    _sheriff.group.position.y -= 0.5;
    // Keycard stays at sheriffs fallen position (already attached to group)
  }

  function shootAtNearestTarget(pp3) {
    var aimDir = new THREE.Vector3(-Math.sin(_yaw), Math.sin(_pitch), Math.cos(_yaw));
    // Wind penalty on aim
    var windOffset = (_trainSpeed / 12.0) * WIND_BASE * 0.05;
    aimDir.x += rnd(-windOffset, windOffset);

    // Check guards
    var best = -1, bestScore = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;
      var gwp = new THREE.Vector3();
      g.group.getWorldPosition(gwp);
      var toG  = gwp.clone().sub(pp3).normalize();
      var dot  = aimDir.dot(toG);
      var dist = gwp.distanceTo(pp3);
      if (dot > 0.82 && dist < 22) {
        var score = dot / (dist + 1);
        if (score > bestScore) { bestScore = score; best = gi; }
      }
    }
    if (best >= 0) {
      _guards[best].hp -= 40;
      if (_guards[best].hp <= 0) killGuard(best);
      return;
    }

    // Check sheriff
    if (_sheriff && _sheriff.alive) {
      var swp2 = new THREE.Vector3();
      _sheriff.group.getWorldPosition(swp2);
      var toS = swp2.clone().sub(pp3).normalize();
      if (aimDir.dot(toS) > 0.82 && swp2.distanceTo(pp3) < 22) {
        _sheriff.hp -= 30;
        if (_sheriff.hp <= 0) killSheriff();
        return;
      }
    }

    // Check horse riders
    for (var hi = 0; hi < _horses.length; hi++) {
      var hwp = new THREE.Vector3();
      _horses[hi].group.getWorldPosition(hwp);
      var toH = hwp.clone().sub(pp3).normalize();
      if (aimDir.dot(toH) > 0.80 && hwp.distanceTo(pp3) < 18) {
        // Hit a rider — stun their shooting
        _horses[hi].shootTimer += 2.0;
        return;
      }
    }
  }

  function killGuard(idx) {
    var g = _guards[idx];
    if (!g.alive) return;
    g.alive = false;
    g.group.rotation.z = Math.PI / 2;
    g.group.position.y -= 0.5;
  }

  /* ════════════════════════════════════════════════════════════════════════
     GETAWAY (SPACE on loaded caboose)
  ════════════════════════════════════════════════════════════════════════ */

  function updateGetaway(dt) {
    if (_phase !== 'GETAWAY') return;
    // Player leaps off train
    _playerVel.y += 5 * dt;
    _playerPos.y += _playerVel.y * dt;
    _playerPos.z -= _trainSpeed * dt * 0.5; // train continues, player falls behind
    _playerGroup.position.set(_playerPos.x, _playerPos.y, _playerPos.z);

    if (_clock > (_clock - dt + 3)) {
      // Mission complete after 3 seconds
      _phase   = 'COMPLETE';
      _outcome = 'SUCCESS';
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    _lastTime = performance.now() / 1000;
    _clock    = 0;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
  }

  function update(timestamp) {
    var now = timestamp / 1000;
    var dt  = Math.min(now - _lastTime, 0.05);
    _lastTime = now;

    if (!_active) {
      _clock += dt;
      return;
    }

    _clock += dt;

    updateTrain(dt);
    updatePlayer(dt);
    updateGuards(dt);
    updateSheriff(dt);
    updateHorses(dt);
    updateDynamite(dt);
    updateFlashes(dt);
    updateGetaway(dt);

    tryGrapple();
    tryPlaceDynamite();
    updateInteractions();

    updateHUD();
  }

  function reset() {
    _active        = false;
    _clock         = 0;
    _trainZ        = 0;
    _trainSpeed    = 12.0;
    _playerHP      = 100;
    _playerCarIdx  = 7;
    _playerOnRoof  = true;
    _playerOnTrain = true;
    _fallTimer     = 0;
    _playerPos     = { x: 0, y: 0, z: 0 };
    _playerVel     = { x: 0, y: 0, z: 0 };
    _goldCarried   = false;
    _goldDelivered = 0;
    _hasKeycard    = false;
    _cargoUnlocked = false;
    _getawayLoaded = false;
    _horsesActive  = false;
    _allAlerted    = false;
    _alertTimer    = 0;
    _ropeActive    = false;
    _ropeSwingAngle = 0;
    _ropeSwingVel   = 0;
    _phase         = 'ROBBERY';
    _outcome       = '';
    _mouseX        = 0;
    _mouseY        = 0;
    _yaw           = 0;
    _pitch         = 0;
    _mouseDown     = false;
    _keyPressTime  = { T: 0, R: 0 };
    _keys          = {};
    _eKeyWasDown   = false;
    _dKeyWasDown   = false;
    _gKeyWasDown   = false;
    _smokeTimer    = 0;

    // Remove scene objects
    if (_trainGroup)  { _scene.remove(_trainGroup);  _trainGroup  = null; }
    if (_playerGroup) { _scene.remove(_playerGroup); _playerGroup = null; }
    if (_ropeGroup)   { _scene.remove(_ropeGroup);   _ropeGroup   = null; }
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }

    // Clear flash objects on scene
    if (_scene && _scene.userData && _scene.userData.flashes) {
      for (var fi = 0; fi < _scene.userData.flashes.length; fi++) {
        _scene.remove(_scene.userData.flashes[fi]);
      }
      _scene.userData.flashes = [];
    }

    _cars        = [];
    _guards      = [];
    _horses      = [];
    _goldBars    = [];
    _dynamites   = [];
    _sheriff     = null;
    _vaultMesh   = null;
    _keycardMesh = null;
    _saddlebagMesh = null;
    _smokeLight  = null;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };
}());
