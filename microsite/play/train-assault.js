/* ───────────────────────────────────────────────────────────────────────────
   train-assault.js — Train Assault Mini-Game
   API: window.TrainAssault = { init, update, reset }
   Controls:
     T + A (simultaneous, 400ms window) → activate module
     W / S                              → move forward / backward along train
     A / D                              → strafe / lean left / right
     Space                              → jump (between carriages / to roof)
     E                                  → interact (board rope / free hostage / plant C4 / breach door)
     G                                  → throw grenade (physics arc)
     Mouse                              → look / aim
   ─────────────────────────────────────────────────────────────────────────── */
window.TrainAssault = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active          = false;
  var _keyPressTime    = { T: 0, A: 0 };
  var ACTIVATE_WINDOW  = 0.4; // seconds

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _phase          = 'HELO';   // HELO, RAPPEL, TRAIN, EXFIL, COMPLETE
  var _trainSpeed     = 8.0;      // u/s
  var _trainStopping  = false;
  var _trainStopTimer = 0;
  var _trainGroup     = null;
  var _carriages      = [];       // { group, doors:[], windows:[], interior }
  var _trainZ         = 0;        // how far train has moved

  /* ── Helicopter ────────────────────────────────────────────────────────── */
  var _heloGroup      = null;
  var _heloAltitude   = 18;
  var _rappelRope     = null;
  var _rappelY        = _heloAltitude;
  var _rappelling     = false;
  var _rappelDone     = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerGroup    = null;
  var _playerPos      = { x: 0, y: 0, z: 0 };
  var _playerVel      = { x: 0, y: 0, z: 0 };
  var _playerOnRoof   = false;
  var _playerCarriage = 2;        // 0=engine, 4=rear
  var _playerHP       = 100;
  var _playerOnTrain  = false;
  var _fallTimer      = 0;

  /* ── Camera / look ─────────────────────────────────────────────────────── */
  var _yaw   = 0;
  var _pitch = 0;
  var _mouseX = 0;
  var _mouseY = 0;

  /* ── Guards ────────────────────────────────────────────────────────────── */
  var _guards      = [];  // { mesh, group, hp, alive, carriageIndex, patrolDir, patrolTimer, alertTimer }
  var _guardsTotal = 12;

  /* ── HVT (commander) ───────────────────────────────────────────────────── */
  var _hvt         = null;  // { mesh, group, hp, alive }
  var HVT_HP       = 300;

  /* ── Hostages ──────────────────────────────────────────────────────────── */
  var _hostages     = [];  // { mesh, group, carriageIndex, freed, following }
  var _hostageFreeCount = 0;

  /* ── Doors ─────────────────────────────────────────────────────────────── */
  var _doors = [];   // { mesh, carriageIndex, hp, breached, side }

  /* ── Grenades ──────────────────────────────────────────────────────────── */
  var _grenades     = [];  // { mesh, vel, fuse, exploded }
  var _grEnergy     = 3;   // max grenades

  /* ── C4 ────────────────────────────────────────────────────────────────── */
  var _c4Planted     = false;
  var _c4Detonating  = false;
  var _c4Timer       = 0;
  var _c4HasItem     = true;

  /* ── Slow motion ───────────────────────────────────────────────────────── */
  var _slowMoTimer   = 0;
  var _slowMoActive  = false;

  /* ── Air vents (roof cover) ────────────────────────────────────────────── */
  var _vents = [];

  /* ── Wind ──────────────────────────────────────────────────────────────── */
  var WIND_FORCE = 0.3; // u/s sideways

  /* ── Exfil ─────────────────────────────────────────────────────────────── */
  var _exfilActive  = false;
  var _exfilTimer   = 0;
  var _exfilRope    = null;
  var _hvtKilled    = false;
  var _missionClear = false;

  /* ── HUD ───────────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Input ─────────────────────────────────────────────────────────────── */
  var _keys = {};

  /* ── Timing ─────────────────────────────────────────────────────────────── */
  var _lastTime = 0;
  var _clock    = 0;

  /* ── Map boundary ──────────────────────────────────────────────────────── */
  var MAP_LENGTH = 600;

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

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function carriageWorldZ(idx) {
    // Engine is carriage 0 at front (lowest Z relative to group)
    // carriages spaced 9 units apart
    return _trainGroup ? _trainGroup.position.z - idx * 9 : -idx * 9;
  }

  /* ════════════════════════════════════════════════════════════════════════
     MESH BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildCarriage(idx) {
    var cGroup = new THREE.Group();
    // Local Z = 0 (relative to trainGroup), offset applied by trainGroup child positions
    var localZ = -idx * 9;

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(4, 4, 8);
    var bodyMat = makeMat(0x8B1A1A);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 2, localZ);
    cGroup.add(body);

    /* Undercarriage */
    var underGeo = new THREE.BoxGeometry(3.6, 0.6, 7.8);
    var underMat = makeMat(0x222222);
    var under    = new THREE.Mesh(underGeo, underMat);
    under.position.set(0, -0.3, localZ);
    cGroup.add(under);

    /* Wheels - simple cylinders */
    var wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 8);
    var wheelMat = makeMat(0x111111);
    var wheelOffsets = [
      { x: -2.1, z: localZ - 2.5 },
      { x:  2.1, z: localZ - 2.5 },
      { x: -2.1, z: localZ + 2.5 },
      { x:  2.1, z: localZ + 2.5 }
    ];
    for (var wi = 0; wi < wheelOffsets.length; wi++) {
      var wm = new THREE.Mesh(wheelGeo, wheelMat);
      wm.rotation.z = Math.PI / 2;
      wm.position.set(wheelOffsets[wi].x, -0.7, wheelOffsets[wi].z);
      cGroup.add(wm);
    }

    /* Connector platform to next carriage (except rear) */
    if (idx < 4) {
      var connGeo = new THREE.BoxGeometry(1.2, 0.2, 1.2);
      var connMat = makeMat(0x555555);
      var conn    = new THREE.Mesh(connGeo, connMat);
      conn.position.set(0, 0.1, localZ - 4.1);
      cGroup.add(conn);
    }

    /* Windows — LineSegments on each side */
    var windowsArr = [];
    var winPositions = [-2, 2]; // two windows per side
    for (var ws = 0; ws < 2; ws++) {  // sides: left (-x) and right (+x)
      var sideX = ws === 0 ? -2.05 : 2.05;
      for (var ww = 0; ww < 2; ww++) {
        var wz = localZ + winPositions[ww];
        var winPts = [
          new THREE.Vector3(sideX, 2.2, wz - 0.6),
          new THREE.Vector3(sideX, 2.2, wz + 0.6),
          new THREE.Vector3(sideX, 2.2, wz + 0.6),
          new THREE.Vector3(sideX, 3.4, wz + 0.6),
          new THREE.Vector3(sideX, 3.4, wz + 0.6),
          new THREE.Vector3(sideX, 3.4, wz - 0.6),
          new THREE.Vector3(sideX, 3.4, wz - 0.6),
          new THREE.Vector3(sideX, 2.2, wz - 0.6)
        ];
        var winBuf = new THREE.BufferGeometry().setFromPoints(winPts);
        var winMat = new THREE.LineBasicMaterial({ color: 0x88AACC });
        var winLine = new THREE.LineSegments(winBuf, winMat);
        cGroup.add(winLine);
        windowsArr.push(winLine);
      }
    }

    /* Door panel on front and rear of each carriage */
    var doorArr = [];
    var doorSides = [-3.95, 3.95]; // front/rear of carriage in local space
    for (var ds = 0; ds < 2; ds++) {
      var doorGeo = new THREE.BoxGeometry(1.2, 2.4, 0.1);
      var doorMat = makeMat(0x8B1A1A);
      var door    = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(0, 1.2, localZ + doorSides[ds]);
      cGroup.add(door);
      var doorObj = { mesh: door, carriageIndex: idx, hp: 3, breached: false, side: ds };
      doorArr.push(doorObj);
      _doors.push(doorObj);
    }

    /* Roof air vents */
    var ventGeo = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    var ventMat = makeMat(0x666666);
    var ventOffsets = [-2, 0, 2];
    for (var vi = 0; vi < ventOffsets.length; vi++) {
      var vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(ventOffsets[vi], 4.2, localZ);
      cGroup.add(vent);
      _vents.push({ mesh: vent, cGroup: cGroup });
    }

    _scene.add(cGroup);
    _carriages.push({ group: cGroup, doors: doorArr, windows: windowsArr, localZ: localZ });
    return cGroup;
  }

  function buildEngine() {
    var eGroup = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(4.2, 4.5, 8.5);
    var bodyMat = makeMat(0x6B0A0A);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 2.25, 0);
    eGroup.add(body);

    /* Smokestack */
    var stackGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
    var stackMat = makeMat(0x111111);
    var stack    = new THREE.Mesh(stackGeo, stackMat);
    stack.position.set(0.5, 5.2, 2);
    eGroup.add(stack);

    /* Cowcatcher */
    var cowGeo = new THREE.BoxGeometry(4.2, 0.5, 1.5);
    var cowMat = makeMat(0x333333);
    var cow    = new THREE.Mesh(cowGeo, cowMat);
    cow.position.set(0, 0.5, 4.8);
    eGroup.add(cow);

    /* Control panel */
    var cpGeo = new THREE.BoxGeometry(1.5, 1.0, 0.4);
    var cpMat = makeMat(0x334433, 0x002200);
    var cp    = new THREE.Mesh(cpGeo, cpMat);
    cp.position.set(0, 2.0, 3.5);
    eGroup.add(cp);
    eGroup.userData.controlPanel = cp;

    /* Wheels */
    var wGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.5, 10);
    var wMat = makeMat(0x111111);
    var engineWheelPos = [
      { x: -2.3, z: -2 }, { x: 2.3, z: -2 },
      { x: -2.3, z:  0 }, { x: 2.3, z:  0 },
      { x: -2.3, z:  2 }, { x: 2.3, z:  2 }
    ];
    for (var ewi = 0; ewi < engineWheelPos.length; ewi++) {
      var ew = new THREE.Mesh(wGeo, wMat);
      ew.rotation.z = Math.PI / 2;
      ew.position.set(engineWheelPos[ewi].x, -0.9, engineWheelPos[ewi].z);
      eGroup.add(ew);
    }

    eGroup.position.set(0, 0, 36); // engine is at front (highest Z in train group)
    _trainGroup.add(eGroup);
    _trainGroup.userData.engineGroup = eGroup;
  }

  function buildGuard(carriageIndex) {
    var gGroup = new THREE.Group();
    var localZ = -carriageIndex * 9;

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.5);
    var bodyMat = makeMat(0x222222);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.6, 0);
    gGroup.add(body);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var headMat = makeMat(0x8B7355);
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.45, 0);
    gGroup.add(head);

    /* Helmet */
    var helmGeo = new THREE.BoxGeometry(0.55, 0.3, 0.55);
    var helmMat = makeMat(0x111111);
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 1.75, 0);
    gGroup.add(helm);

    /* Arms */
    var armGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    var armMat = makeMat(0x222222);
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.5, 0.6, 0);
    gGroup.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.5, 0.6, 0);
    gGroup.add(armR);

    var spawnX = rnd(-1.2, 1.2);
    gGroup.position.set(spawnX, 0, localZ + rnd(-2, 2));

    _trainGroup.add(gGroup);
    _guards.push({
      mesh: gGroup,
      group: gGroup,
      hp: 100,
      alive: true,
      carriageIndex: carriageIndex,
      patrolDir: 1,
      patrolTimer: 0,
      alertTimer: 0,
      localZ: localZ
    });
  }

  function buildHVT() {
    var hGroup = new THREE.Group();
    var rearLocalZ = -4 * 9; // rear carriage index 4

    /* Scaled-up body */
    var bodyGeo = new THREE.BoxGeometry(0.9, 1.56, 0.65);
    var bodyMat = makeMat(0x222266);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.78, 0);
    hGroup.add(body);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    var headMat = makeMat(0x8B7355);
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.885, 0);
    hGroup.add(head);

    /* Helmet */
    var helmGeo = new THREE.BoxGeometry(0.72, 0.39, 0.72);
    var helmMat = makeMat(0x222266);
    var helm    = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 2.275, 0);
    hGroup.add(helm);

    /* Arms */
    var armGeo = new THREE.BoxGeometry(0.26, 1.17, 0.26);
    var armMat = makeMat(0x222266);
    var armL   = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.65, 0.78, 0);
    hGroup.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.65, 0.78, 0);
    hGroup.add(armR);

    hGroup.position.set(0.5, 0, rearLocalZ + 1);
    _trainGroup.add(hGroup);

    _hvt = {
      mesh: hGroup,
      group: hGroup,
      hp: HVT_HP,
      alive: true,
      carriageIndex: 4
    };
  }

  function buildHostage(carriageIndex) {
    var hGroup = new THREE.Group();
    var localZ = -carriageIndex * 9;

    /* Seated cylinder body */
    var bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.9, 8);
    var bodyMat = makeMat(0xBBAA88);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.45, 0);
    hGroup.add(body);

    /* Head */
    var headGeo = new THREE.SphereGeometry(0.25, 8, 6);
    var headMat = makeMat(0xCC9966);
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.15, 0);
    hGroup.add(head);

    var spawnX = rnd(-1.0, 1.0);
    hGroup.position.set(spawnX, 0, localZ + rnd(-1.5, 1.5));
    _trainGroup.add(hGroup);

    _hostages.push({
      mesh: hGroup,
      group: hGroup,
      carriageIndex: carriageIndex,
      freed: false,
      following: false,
      localZ: localZ
    });
  }

  function buildHelicopter() {
    _heloGroup = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(3, 1.2, 6);
    var bodyMat = makeMat(0x556677);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0);
    _heloGroup.add(body);

    /* Tail boom */
    var tailGeo = new THREE.BoxGeometry(0.6, 0.6, 3.5);
    var tailMat = makeMat(0x445566);
    var tail    = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.2, -4.5);
    _heloGroup.add(tail);

    /* Rotor disk (flat box) */
    var rotorGeo = new THREE.BoxGeometry(8, 0.05, 0.4);
    var rotorMat = makeMat(0x334455);
    var rotor    = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(0, 0.7, 0);
    _heloGroup.add(rotor);
    _heloGroup.userData.rotor = rotor;

    /* Skids */
    var skidGeo = new THREE.BoxGeometry(0.2, 0.2, 5);
    var skidMat = makeMat(0x334455);
    var skidL   = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(-1.2, -0.8, 0);
    _heloGroup.add(skidL);
    var skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(1.2, -0.8, 0);
    _heloGroup.add(skidR);

    _heloGroup.position.set(0, _heloAltitude, 10);
    _scene.add(_heloGroup);
  }

  function buildRappelRope(fromY, toY, worldX, worldZ) {
    if (_rappelRope) {
      _scene.remove(_rappelRope);
      _rappelRope = null;
    }
    var pts = [
      new THREE.Vector3(worldX, fromY, worldZ),
      new THREE.Vector3(worldX, toY,   worldZ)
    ];
    var geo  = new THREE.BufferGeometry().setFromPoints(pts);
    var mat  = new THREE.LineBasicMaterial({ color: 0xCCBB88 });
    _rappelRope = new THREE.LineSegments(geo, mat);
    _scene.add(_rappelRope);
  }

  function buildPlayer() {
    _playerGroup = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var bodyMat = makeMat(0x446644);
    var body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.5, 0);
    _playerGroup.add(body);

    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMat = makeMat(0x8B7355);
    var head    = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.2, 0);
    _playerGroup.add(head);

    _playerGroup.position.set(0, _heloAltitude - 1, 10);
    _scene.add(_playerGroup);

    _playerPos.x = 0;
    _playerPos.y = _heloAltitude - 1;
    _playerPos.z = 10;
  }

  function buildGround() {
    /* Track rails */
    var railGeo = new THREE.BoxGeometry(0.15, 0.15, MAP_LENGTH);
    var railMat = makeMat(0x888888);
    var railL   = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-1, -0.5, MAP_LENGTH / 2);
    _scene.add(railL);
    var railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(1, -0.5, MAP_LENGTH / 2);
    _scene.add(railR);

    /* Ground plane */
    var groundGeo = new THREE.BoxGeometry(80, 0.5, MAP_LENGTH);
    var groundMat = makeMat(0x3A5C2A);
    var ground    = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -1, MAP_LENGTH / 2);
    _scene.add(ground);

    /* Tie sleepers every 2 units */
    var tieGeo = new THREE.BoxGeometry(2.8, 0.1, 0.5);
    var tieMat = makeMat(0x5C3A1A);
    for (var ti = 0; ti < 100; ti++) {
      var tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, -0.45, ti * 6 + 3);
      _scene.add(tie);
    }
  }

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'ta-hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.72)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:13px',
      'padding:8px 16px',
      'border:1px solid #00FF8844',
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
    var hvtStatus = (_hvt && _hvt.alive) ? 'ALIVE' : 'NEUTRALIZED';
    var carDisp   = (_playerCarriage + 1) + '/5';
    var speed     = _trainStopping ? Math.max(0, _trainSpeed).toFixed(1) : _trainSpeed.toFixed(1);
    var phaseMsg  = '';
    if (_phase === 'HELO')   phaseMsg = ' | BOARDING PHASE';
    if (_phase === 'RAPPEL') phaseMsg = ' | RAPPELLING';
    if (_phase === 'EXFIL')  phaseMsg = ' | EXFIL: ' + Math.ceil(_exfilTimer) + 's';
    if (_missionClear)       phaseMsg = ' | MISSION COMPLETE';
    _hud.textContent = 'TRAIN OPS [CARRIAGE: ' + carDisp + '] [GUARDS: ' + guardsAlive + '] ' +
      '[HOSTAGES: ' + _hostageFreeCount + '/6] [HVT: ' + hvtStatus + '] | TRAIN SPD: ' + speed + ' m/s' + phaseMsg;
  }

  /* ════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
  ════════════════════════════════════════════════════════════════════════ */

  function buildScene() {
    /* Ambient and directional lighting */
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFEEBB, 1.0);
    sun.position.set(20, 40, 10);
    _scene.add(sun);

    buildGround();

    /* Train group — moves forward (increasing Z) */
    _trainGroup = new THREE.Group();
    _trainGroup.position.set(0, 0, 0);
    _scene.add(_trainGroup);

    /* Build engine at front then 4 carriages behind */
    buildEngine();
    for (var ci = 0; ci < 5; ci++) {
      buildCarriage(ci);
    }

    /* Spawn guards: 2-3 per carriage */
    var guardCounts = [2, 3, 2, 3, 2];
    for (var gci = 0; gci < 5; gci++) {
      for (var gg = 0; gg < guardCounts[gci]; gg++) {
        buildGuard(gci);
      }
    }

    /* HVT in rear carriage */
    buildHVT();

    /* Hostages: carriage indices 0..4, 6 total spread across middle carriages */
    var hostagePlacement = [0, 1, 1, 2, 3, 4];
    for (var hi = 0; hi < 6; hi++) {
      buildHostage(hostagePlacement[hi]);
    }

    buildHelicopter();
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
  }

  function onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
  }

  function onMouseMove(e) {
    _mouseX += e.movementX * 0.002;
    _mouseY += e.movementY * 0.002;
    _mouseY = Math.max(-0.8, Math.min(0.8, _mouseY));
  }

  function checkActivation(k) {
    if (!_active && (k === 'T' || k === 'A')) {
      var other = k === 'T' ? 'A' : 'T';
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
    _phase  = 'HELO';
    buildScene();
    buildHUD();

    _camera.position.set(0, _heloAltitude + 4, -10);
    _camera.lookAt(0, _heloAltitude, 10);
  }

  /* ════════════════════════════════════════════════════════════════════════
     GAME LOGIC — TRAIN MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updateTrain(dt) {
    if (_trainStopping) {
      _trainStopTimer += dt;
      _trainSpeed = Math.max(0, 8.0 * (1 - _trainStopTimer / 10));
    }
    _trainZ += _trainSpeed * dt;
    if (_trainGroup) {
      _trainGroup.position.z = _trainZ;
    }
    /* Spin wheels roughly */
    if (_trainGroup && _trainGroup.userData.engineGroup) {
      /* simple visual: rotate engine group children tagged as wheels */
    }
    /* Rotate helo rotor */
    if (_heloGroup && _heloGroup.userData.rotor) {
      _heloGroup.userData.rotor.rotation.y += dt * 8;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HELICOPTER PHASE
  ════════════════════════════════════════════════════════════════════════ */

  function updateHelo(dt) {
    if (_phase !== 'HELO' && _phase !== 'RAPPEL') return;

    /* Helo tracks above train engine */
    var targetZ = _trainZ + 36 + 5;
    _heloGroup.position.z += (targetZ - _heloGroup.position.z) * dt * 2;
    _heloGroup.position.x += (0 - _heloGroup.position.x) * dt * 1.5;

    /* Bob gently */
    _heloGroup.position.y = _heloAltitude + Math.sin(_clock * 1.5) * 0.3;

    if (_phase === 'HELO' && _keys['E']) {
      _phase = 'RAPPEL';
      _rappelY = _heloGroup.position.y - 1;
      _rappelling = true;
    }

    if (_phase === 'RAPPEL') {
      _rappelY -= dt * 4;
      var roofY = 4.0;
      buildRappelRope(_heloGroup.position.y - 1, _rappelY, _heloGroup.position.x, _heloGroup.position.z);

      _playerGroup.position.set(_heloGroup.position.x, _rappelY, _heloGroup.position.z);
      _playerPos.x = _playerGroup.position.x;
      _playerPos.y = _rappelY;
      _playerPos.z = _playerGroup.position.z;

      if (_rappelY <= roofY + 1) {
        /* Land on roof of engine car */
        _phase = 'TRAIN';
        _playerOnTrain = true;
        _playerOnRoof  = true;
        _playerCarriage = 0;
        _playerPos.x = 0;
        _playerPos.y = roofY + 1;
        _playerPos.z = _trainZ + 36;
        if (_rappelRope) {
          _scene.remove(_rappelRope);
          _rappelRope = null;
        }
        _rappelling = false;
        _rappelDone = true;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    if (_phase !== 'TRAIN' && _phase !== 'EXFIL') return;

    var slowScale = _slowMoActive ? 0.3 : 1.0;
    var efDt = dt * slowScale;

    /* Yaw and pitch from mouse */
    _yaw   = _mouseX;
    _pitch = _mouseY;

    var speed = 6.0;
    var dx = 0, dz = 0;

    if (_keys['W']) dz += 1;
    if (_keys['S']) dz -= 1;
    if (_keys['A']) dx -= 1;
    if (_keys['D']) dx += 1;

    /* Move relative to yaw */
    var sy = Math.sin(_yaw), cy = Math.cos(_yaw);
    var worldDX = dx * cy + dz * sy;
    var worldDZ = dz * cy - dx * sy;

    /* Wind on roof */
    if (_playerOnRoof) {
      worldDX += WIND_FORCE;
    }

    _playerPos.x += worldDX * speed * efDt;
    _playerPos.z += worldDZ * speed * efDt;

    /* Train carries player forward */
    _playerPos.z += _trainSpeed * efDt;

    /* Gravity / jump */
    _playerVel.y -= 18 * efDt;
    _playerPos.y += _playerVel.y * efDt;

    /* Floor height: roof = 4.0 + 1 (player center), interior = 0 + 1 */
    var roofFloorY    = 5.0;
    var interiorFloorY = 1.0;
    var trainLocalX   = _playerPos.x - _trainGroup.position.x;
    var onRoof        = false;
    var onInterior    = false;

    /* Determine which carriage player is over */
    updatePlayerCarriage();

    /* Clamp X within train width (carriage width = 4) */
    var inCarriage = (_playerCarriage >= 0 && _playerCarriage < 5);
    if (inCarriage) {
      var carriageWorldZCenter = _trainZ + _carriages[_playerCarriage].localZ;
      /* Check if above carriage */
      if (Math.abs(trainLocalX) < 2.4) {
        if (_playerPos.y >= roofFloorY - 0.3) {
          onRoof = true;
        } else if (_playerPos.y < roofFloorY && _playerPos.y >= interiorFloorY - 0.3) {
          onInterior = true;
        }
      }
    }

    if (onRoof && _playerVel.y <= 0) {
      _playerPos.y = roofFloorY;
      _playerVel.y = 0;
      _playerOnRoof = true;
      _playerOnTrain = true;
      _fallTimer = 0;
    } else if (onInterior && _playerVel.y <= 0) {
      _playerPos.y = interiorFloorY;
      _playerVel.y = 0;
      _playerOnRoof = false;
      _playerOnTrain = true;
      _fallTimer = 0;
    } else {
      _playerOnRoof = false;
      if (!inCarriage || Math.abs(trainLocalX) >= 2.4) {
        _playerOnTrain = false;
        _fallTimer += dt;
      }
    }

    /* Jump */
    if (_keys['SPACE'] && (_playerOnRoof || _playerOnTrain) && _playerVel.y <= 0.01) {
      _playerVel.y = 8;
    }

    /* Fall off train → respawn at rear */
    if (_playerPos.y < -3 || _fallTimer > 2.5) {
      respawnAtRear();
    }

    /* Clamp side to avoid going too far */
    _playerPos.x = Math.max(-12, Math.min(12, _playerPos.x));

    /* Update player mesh */
    _playerGroup.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _playerGroup.rotation.y = _yaw;

    /* Camera follows player */
    var camOffset = new THREE.Vector3(
      -Math.sin(_yaw) * 5,
      2.5,
      -Math.cos(_yaw) * 5
    );
    _camera.position.set(
      _playerPos.x + camOffset.x,
      _playerPos.y + camOffset.y,
      _playerPos.z + camOffset.z
    );
    _camera.lookAt(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
  }

  function updatePlayerCarriage() {
    /* Determine carriage index from world Z relative to trainGroup */
    var localZ = _playerPos.z - _trainGroup.position.z;
    /* Carriages: index 0 localZ=0 (engine area = localZ ~32-36), carriages localZ 0 to -36 */
    /* Engine: localZ +36; carriage 0: localZ 0; carriage 4: localZ -36 */
    /* Actually engine is separate; carriages 0-4 have localZ = -idx*9 */
    var best = -1, bestDist = 999;
    for (var ci = 0; ci < _carriages.length; ci++) {
      var cz = _carriages[ci].localZ;
      var dist = Math.abs(localZ - cz);
      if (dist < bestDist) {
        bestDist = dist;
        best = ci;
      }
    }
    if (bestDist < 5) {
      _playerCarriage = best;
    }
  }

  function respawnAtRear() {
    _playerCarriage = 4;
    _playerPos.x = 0;
    _playerPos.y = 5.0;
    _playerPos.z = _trainGroup.position.z + _carriages[4].localZ;
    _playerVel.y = 0;
    _playerHP = Math.max(10, _playerHP - 20);
    _fallTimer = 0;
    _playerOnTrain = true;
    _playerOnRoof  = true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARDS AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    var slowScale = _slowMoActive ? 0.3 : 1.0;
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;

      /* Patrol back and forth in carriage */
      g.patrolTimer += dt * slowScale;
      if (g.patrolTimer > 3) {
        g.patrolDir = -g.patrolDir;
        g.patrolTimer = 0;
      }

      var localZ = g.localZ;
      var currentZ = g.group.position.z;
      var targetZ  = localZ + g.patrolDir * 3;
      g.group.position.z += (targetZ - currentZ) * dt * 1.5 * slowScale;
      g.group.rotation.y = g.patrolDir > 0 ? Math.PI : 0;

      /* Alert if player nearby */
      var gWorldPos = new THREE.Vector3();
      g.group.getWorldPosition(gWorldPos);
      var playerWorldPos = new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);
      var distToPlayer = gWorldPos.distanceTo(playerWorldPos);

      if (distToPlayer < 8 && _phase === 'TRAIN') {
        g.alertTimer += dt;
        if (g.alertTimer > 1.5) {
          /* Guard fires at player */
          _playerHP -= 5 * dt;
          if (_playerHP <= 0) {
            respawnAtRear();
            _playerHP = 100;
          }
        }
      } else {
        g.alertTimer = Math.max(0, g.alertTimer - dt);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HVT AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateHVT(dt) {
    if (!_hvt || !_hvt.alive) return;
    var slowScale = _slowMoActive ? 0.3 : 1.0;
    /* Pace back and forth in rear carriage */
    _hvt.group.position.z += Math.sin(_clock * 0.5) * dt * 1.0 * slowScale;
  }

  /* ════════════════════════════════════════════════════════════════════════
     GRENADES
  ════════════════════════════════════════════════════════════════════════ */

  function throwGrenade() {
    if (_grEnergy <= 0) return;
    _grEnergy--;

    var geo = new THREE.SphereGeometry(0.18, 6, 4);
    var mat = makeMat(0x33AA33);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
    _scene.add(mesh);

    var throwDir = new THREE.Vector3(-Math.sin(_yaw), 0.5, Math.cos(_yaw));
    throwDir.normalize().multiplyScalar(8);

    _grenades.push({
      mesh: mesh,
      vel: { x: throwDir.x, y: throwDir.y + _trainSpeed, z: throwDir.z },
      fuse: 2.0,
      exploded: false
    });
  }

  function updateGrenades(dt) {
    var slowScale = _slowMoActive ? 0.3 : 1.0;
    for (var gi = _grenades.length - 1; gi >= 0; gi--) {
      var g = _grenades[gi];
      if (g.exploded) {
        _grenades.splice(gi, 1);
        continue;
      }
      g.fuse -= dt * slowScale;

      /* Physics */
      g.vel.y -= 18 * dt * slowScale;
      g.mesh.position.x += g.vel.x * dt * slowScale;
      g.mesh.position.y += g.vel.y * dt * slowScale;
      g.mesh.position.z += g.vel.z * dt * slowScale;

      /* Bounce on floor */
      var floorY = 1.1;
      if (g.mesh.position.y < floorY) {
        g.mesh.position.y = floorY;
        g.vel.y *= -0.3;
        g.vel.x *= 0.6;
        g.vel.z *= 0.6;
      }

      /* Scatter nearby guards */
      if (g.fuse < 0.5) {
        for (var gdi = 0; gdi < _guards.length; gdi++) {
          var guard = _guards[gdi];
          if (!guard.alive) continue;
          var gwp = new THREE.Vector3();
          guard.group.getWorldPosition(gwp);
          if (gwp.distanceTo(g.mesh.position) < 4) {
            guard.group.position.x += rnd(-1, 1);
            guard.group.position.z += rnd(-1, 1);
          }
        }
      }

      /* Explode */
      if (g.fuse <= 0) {
        explodeAt(g.mesh.position, 4.5, 60);
        _scene.remove(g.mesh);
        g.exploded = true;
      }
    }
  }

  function explodeAt(pos, radius, damage) {
    /* Damage guards in radius */
    for (var gi = 0; gi < _guards.length; gi++) {
      var guard = _guards[gi];
      if (!guard.alive) continue;
      var gwp = new THREE.Vector3();
      guard.group.getWorldPosition(gwp);
      if (gwp.distanceTo(pos) < radius) {
        guard.hp -= damage;
        if (guard.hp <= 0) killGuard(gi);
      }
    }
    /* Damage HVT */
    if (_hvt && _hvt.alive) {
      var hvtWP = new THREE.Vector3();
      _hvt.group.getWorldPosition(hvtWP);
      if (hvtWP.distanceTo(pos) < radius) {
        _hvt.hp -= damage * 0.5;
        if (_hvt.hp <= 0) killHVT();
      }
    }
    /* Damage doors */
    for (var di = 0; di < _doors.length; di++) {
      var door = _doors[di];
      if (door.breached) continue;
      var dwp = new THREE.Vector3();
      door.mesh.getWorldPosition(dwp);
      if (dwp.distanceTo(pos) < radius) {
        breachDoor(di);
      }
    }
    /* Brief flash */
    var flashGeo = new THREE.SphereGeometry(0.8, 6, 4);
    var flashMat = new THREE.MeshLambertMaterial({ color: 0xFF8800, emissive: 0xFF4400, emissiveIntensity: 2 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    _scene.add(flash);
    /* Remove after 0.3s — handled via userData */
    flash.userData.deathTimer = 0.3;
    _scene.userData = _scene.userData || {};
    if (!_scene.userData.flashes) _scene.userData.flashes = [];
    _scene.userData.flashes.push(flash);
  }

  function updateFlashes(dt) {
    if (!_scene.userData || !_scene.userData.flashes) return;
    var arr = _scene.userData.flashes;
    for (var fi = arr.length - 1; fi >= 0; fi--) {
      arr[fi].userData.deathTimer -= dt;
      if (arr[fi].userData.deathTimer <= 0) {
        _scene.remove(arr[fi]);
        arr.splice(fi, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTIONS (E KEY)
  ════════════════════════════════════════════════════════════════════════ */

  var _eKeyWasDown = false;
  var _gKeyWasDown = false;

  function updateInteractions() {
    var eDown = _keys['E'];
    var gDown = _keys['G'];
    var ePressed = eDown && !_eKeyWasDown;
    var gPressed = gDown && !_gKeyWasDown;
    _eKeyWasDown = !!eDown;
    _gKeyWasDown = !!gDown;

    if (!ePressed && !gPressed) return;

    var playerPos3 = new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);

    if (ePressed) {
      /* Free hostages */
      for (var hi = 0; hi < _hostages.length; hi++) {
        var hst = _hostages[hi];
        if (hst.freed) continue;
        var hwp = new THREE.Vector3();
        hst.group.getWorldPosition(hwp);
        if (hwp.distanceTo(playerPos3) < 2.5) {
          freeHostage(hi);
          return;
        }
      }

      /* Breach doors */
      for (var di = 0; di < _doors.length; di++) {
        var door = _doors[di];
        if (door.breached) continue;
        var dwp = new THREE.Vector3();
        door.mesh.getWorldPosition(dwp);
        if (dwp.distanceTo(playerPos3) < 2.0) {
          if (_c4HasItem) {
            breachDoor(di);
          } else {
            door.hp -= 1;
            if (door.hp <= 0) breachDoor(di);
          }
          return;
        }
      }

      /* Attack guards */
      for (var gi = 0; gi < _guards.length; gi++) {
        var guard = _guards[gi];
        if (!guard.alive) continue;
        var gwp = new THREE.Vector3();
        guard.group.getWorldPosition(gwp);
        if (gwp.distanceTo(playerPos3) < 2.0) {
          guard.hp -= 50;
          if (guard.hp <= 0) killGuard(gi);
          return;
        }
      }

      /* Attack HVT */
      if (_hvt && _hvt.alive) {
        var hvtWP = new THREE.Vector3();
        _hvt.group.getWorldPosition(hvtWP);
        if (hvtWP.distanceTo(playerPos3) < 2.5) {
          _hvt.hp -= 50;
          if (_hvt.hp <= 0) killHVT();
          return;
        }
      }

      /* Plant C4 at control panel */
      if (_c4HasItem && !_c4Planted && _playerCarriage === 0) {
        var engineGroup = _trainGroup.userData.engineGroup;
        if (engineGroup && engineGroup.userData.controlPanel) {
          var cpWP = new THREE.Vector3();
          engineGroup.userData.controlPanel.getWorldPosition(cpWP);
          if (cpWP.distanceTo(playerPos3) < 3.5) {
            plantC4();
            return;
          }
        }
      }

      /* Exfil via rope */
      if (_phase === 'EXFIL') {
        _missionClear = true;
        _phase = 'COMPLETE';
      }
    }

    if (gPressed) {
      throwGrenade();
    }
  }

  function freeHostage(idx) {
    var hst = _hostages[idx];
    hst.freed    = true;
    hst.following = true;
    _hostageFreeCount++;
    /* Visual: tint freed hostage green */
    hst.group.children[0].material = makeMat(0x88CC88);
    checkExfilCondition();
  }

  function breachDoor(idx) {
    var door = _doors[idx];
    if (door.breached) return;
    door.breached = true;
    door.mesh.material = makeMat(0x332211);
    door.mesh.scale.y  = 0.1;
    /* Trigger slow-mo */
    _slowMoActive = true;
    _slowMoTimer  = 2.0;
  }

  function killGuard(idx) {
    var g = _guards[idx];
    if (!g.alive) return;
    g.alive = false;
    g.group.rotation.z = Math.PI / 2;
    g.group.position.y -= 0.5;
  }

  function killHVT() {
    if (!_hvt || !_hvt.alive) return;
    _hvt.alive = false;
    _hvt.group.rotation.z = Math.PI / 2;
    _hvt.group.position.y -= 0.5;
    _hvtKilled = true;
    checkExfilCondition();
  }

  function plantC4() {
    _c4Planted  = true;
    _c4HasItem  = false;
    _c4Timer    = 5.0; // 5s fuse before detonation
    /* Small C4 block visual */
    var c4Geo = new THREE.BoxGeometry(0.4, 0.25, 0.15);
    var c4Mat = makeMat(0xFFFF00, 0xAA8800);
    var c4Mesh = new THREE.Mesh(c4Geo, c4Mat);
    var engineGroup = _trainGroup.userData.engineGroup;
    engineGroup.userData.controlPanel.add(c4Mesh);
    c4Mesh.position.set(0, 0.3, 0);
  }

  function checkExfilCondition() {
    if (_hvtKilled && _hostageFreeCount >= 4 && _phase === 'TRAIN') {
      _phase = 'EXFIL';
      _exfilTimer = 20.0;
      /* Bring helo back */
      _heloGroup.position.z = _trainZ + 36 + 5;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     C4 LOGIC
  ════════════════════════════════════════════════════════════════════════ */

  function updateC4(dt) {
    if (!_c4Planted || _c4Detonating) return;
    _c4Timer -= dt;
    if (_c4Timer <= 0) {
      _c4Detonating = true;
      _trainStopping = true;
      /* Explosion at engine */
      var engineGroup = _trainGroup.userData.engineGroup;
      var epWP = new THREE.Vector3();
      engineGroup.getWorldPosition(epWP);
      explodeAt(epWP, 5, 80);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SLOW MOTION
  ════════════════════════════════════════════════════════════════════════ */

  function updateSlowMo(dt) {
    if (!_slowMoActive) return;
    _slowMoTimer -= dt;
    if (_slowMoTimer <= 0) {
      _slowMoActive = false;
      _slowMoTimer  = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXFIL
  ════════════════════════════════════════════════════════════════════════ */

  function updateExfil(dt) {
    if (_phase !== 'EXFIL') return;
    _exfilTimer -= dt;

    /* Helo moves alongside train */
    var targetZ = _trainZ + 36 + 5;
    _heloGroup.position.z += (targetZ - _heloGroup.position.z) * dt * 1.5;
    _heloGroup.position.x += (0 - _heloGroup.position.x) * dt * 1.5;
    _heloGroup.position.y = _heloAltitude + Math.sin(_clock * 1.5) * 0.3;

    /* Show exfil rope */
    buildRappelRope(_heloGroup.position.y - 1, 4.0, _heloGroup.position.x, _heloGroup.position.z);

    if (_exfilTimer <= 0) {
      /* Time's up — player didn't exfil; train exits map */
      _phase = 'COMPLETE';
      _missionClear = false;
    }

    /* Check if train too far */
    if (_trainZ > MAP_LENGTH) {
      _phase = 'COMPLETE';
      _missionClear = false;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     HOSTAGE FOLLOW
  ════════════════════════════════════════════════════════════════════════ */

  function updateHostageFollow(dt) {
    for (var hi = 0; hi < _hostages.length; hi++) {
      var hst = _hostages[hi];
      if (!hst.following) continue;
      /* Hostage group is child of trainGroup, so we need local position */
      var targetLocalX = _playerPos.x - _trainGroup.position.x;
      var targetLocalZ = _playerPos.z - _trainGroup.position.z - 1.5;
      hst.group.position.x += (targetLocalX - hst.group.position.x) * dt * 2;
      hst.group.position.z += (targetLocalZ - hst.group.position.z) * dt * 2;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOT (left click)
  ════════════════════════════════════════════════════════════════════════ */

  var _mouseWasDown = false;

  function onMouseDown() { _mouseWasDown = true; }

  function processShooting() {
    if (!_mouseWasDown || _phase !== 'TRAIN') return;
    _mouseWasDown = false;

    var playerPos3 = new THREE.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);
    var aimDir     = new THREE.Vector3(-Math.sin(_yaw), Math.sin(_pitch), Math.cos(_yaw));

    /* Raycast-style: check nearest guard in aim cone */
    var bestGuard = -1, bestScore = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      var guard = _guards[gi];
      if (!guard.alive) continue;
      var gwp = new THREE.Vector3();
      guard.group.getWorldPosition(gwp);
      var toGuard = gwp.clone().sub(playerPos3).normalize();
      var dot = aimDir.dot(toGuard);
      var dist = gwp.distanceTo(playerPos3);
      if (dot > 0.85 && dist < 20) {
        var score = dot / (dist + 1);
        if (score > bestScore) {
          bestScore = score;
          bestGuard = gi;
        }
      }
    }
    if (bestGuard >= 0) {
      _guards[bestGuard].hp -= 35;
      if (_guards[bestGuard].hp <= 0) killGuard(bestGuard);
      return;
    }

    /* Check HVT */
    if (_hvt && _hvt.alive) {
      var hvtWP = new THREE.Vector3();
      _hvt.group.getWorldPosition(hvtWP);
      var toHVT = hvtWP.clone().sub(playerPos3).normalize();
      var hvtDot = aimDir.dot(toHVT);
      if (hvtDot > 0.85 && hvtWP.distanceTo(playerPos3) < 25) {
        _hvt.hp -= 25;
        if (_hvt.hp <= 0) killHVT();
        return;
      }
    }

    /* Check doors */
    for (var di = 0; di < _doors.length; di++) {
      var door = _doors[di];
      if (door.breached) continue;
      var dwp = new THREE.Vector3();
      door.mesh.getWorldPosition(dwp);
      var toDoor = dwp.clone().sub(playerPos3).normalize();
      var doorDot = aimDir.dot(toDoor);
      if (doorDot > 0.85 && dwp.distanceTo(playerPos3) < 6) {
        door.hp -= 1;
        door.mesh.material = makeMat(0xAA3300);
        if (door.hp <= 0) breachDoor(di);
        return;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
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
    updateHelo(dt);
    updateSlowMo(dt);
    updateC4(dt);
    updatePlayer(dt);
    updateGuards(dt);
    updateHVT(dt);
    updateGrenades(dt);
    updateFlashes(dt);
    updateHostageFollow(dt);
    updateExfil(dt);
    processShooting();
    updateInteractions();
    updateHUD();
  }

  function reset() {
    _active         = false;
    _phase          = 'HELO';
    _trainSpeed     = 8.0;
    _trainStopping  = false;
    _trainStopTimer = 0;
    _trainZ         = 0;
    _playerHP       = 100;
    _playerOnRoof   = false;
    _playerOnTrain  = false;
    _playerCarriage = 2;
    _hostageFreeCount = 0;
    _hvtKilled      = false;
    _missionClear   = false;
    _exfilActive    = false;
    _exfilTimer     = 0;
    _rappelling     = false;
    _rappelDone     = false;
    _c4Planted      = false;
    _c4Detonating   = false;
    _c4HasItem      = true;
    _c4Timer        = 0;
    _slowMoActive   = false;
    _slowMoTimer    = 0;
    _grEnergy       = 3;
    _mouseWasDown   = false;
    _eKeyWasDown    = false;
    _gKeyWasDown    = false;
    _mouseX         = 0;
    _mouseY         = 0;
    _yaw            = 0;
    _pitch          = 0;
    _playerVel      = { x: 0, y: 0, z: 0 };
    _playerPos      = { x: 0, y: 0, z: 0 };
    _fallTimer      = 0;
    _keyPressTime   = { T: 0, A: 0 };
    _keys           = {};

    /* Remove scene objects */
    if (_trainGroup)  { _scene.remove(_trainGroup); _trainGroup = null; }
    if (_heloGroup)   { _scene.remove(_heloGroup);  _heloGroup  = null; }
    if (_playerGroup) { _scene.remove(_playerGroup); _playerGroup = null; }
    if (_rappelRope)  { _scene.remove(_rappelRope); _rappelRope = null; }
    if (_exfilRope)   { _scene.remove(_exfilRope);  _exfilRope  = null; }
    if (_hud && _hud.parentNode) { _hud.parentNode.removeChild(_hud); _hud = null; }

    /* Clear flash objects */
    if (_scene && _scene.userData && _scene.userData.flashes) {
      for (var fi = 0; fi < _scene.userData.flashes.length; fi++) {
        _scene.remove(_scene.userData.flashes[fi]);
      }
      _scene.userData.flashes = [];
    }

    _guards   = [];
    _hostages = [];
    _doors    = [];
    _grenades = [];
    _vents    = [];
    _carriages = [];
    _hvt      = null;
    _heloAltitude = 18;
    _rappelY  = 18;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };
}());
