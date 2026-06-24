window.RomanConquest = (function () {
  'use strict';

  // ── Activation key tracking (R+C within 400ms) ───────────────────────────
  var _keyTimes = {};
  var _ACTIVATION_WINDOW = 400;
  var _active = false;

  // ── Three.js handles ─────────────────────────────────────────────────────
  var _scene = null;
  var _camera = null;
  var _renderer = null;
  var _animId = null;

  // ── Clock ─────────────────────────────────────────────────────────────────
  var _lastTime = 0;

  // ── Keys ──────────────────────────────────────────────────────────────────
  var _keys = {};

  // ── Player state ──────────────────────────────────────────────────────────
  var _playerHP = 200;
  var _playerMaxHP = 200;
  var _playerPos = { x: -60, y: 1.0, z: 0 };
  var _playerVelX = 0;
  var _playerVelZ = 0;
  var _playerYaw = 0;
  var _playerPitch = 0;
  var _playerDead = false;
  var _piliumCount = 5;
  var _attackCooldown = 0;
  var _throwCooldown = 0;
  var _blockCooldown = 0;
  var _playerMesh = null;

  // ── Formation / soldier state ─────────────────────────────────────────────
  var _legionaries = [];          // { mesh, shield, hp, pos, vel, state, formOffset }
  var _testudoActive = false;
  var _chargeActive = false;
  var _chargeTimer = 0;

  // ── Enemy state ───────────────────────────────────────────────────────────
  var _enemies = [];              // { mesh, hp, maxHp, type, pos, vel, state, attackCooldown, enraged, arrowTimer }
  var _arrows = [];               // { mesh, vel, life, fromPlayer }
  var _pilia = [];                // { mesh, vel, life }
  var _chieftain = null;          // { mesh, hammer, hp, pos, state, attackCooldown, phase2 }

  // ── Gate / fort state ─────────────────────────────────────────────────────
  var _gateHP = 100;
  var _gateBreached = false;
  var _gateMesh = null;
  var _gateLineMesh = null;
  var _ramTimer = 0;
  var _ramCooldown = 0;
  var _ramGroup = null;
  var _ramCarrying = false;
  var _ramProgress = 0;

  // ── Wave state ────────────────────────────────────────────────────────────
  var _wave = 0;
  var _waveActive = false;
  var _waveTransTimer = 0;
  var _gameOver = false;
  var _gameWon = false;
  var _victoryTimer = 0;
  var _chieftainDefeated = false;
  var _holdTimer = 0;
  var _holdRequired = 30;
  var _playerInHall = false;

  // ── HUD ───────────────────────────────────────────────────────────────────
  var _hudEl = null;
  var _msgEl = null;

  // ── Audio ─────────────────────────────────────────────────────────────────
  var _audioCtx = null;

  // ── Environment refs ──────────────────────────────────────────────────────
  var _firepitLight = null;
  var _chieftainHallPos = { x: 90, y: 0, z: 0 };

  // ─────────────────────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function dist3d(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(randRange(a, b + 1)); }

  function playBeep(freq, dur, vol, type) {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.type = type || 'square';
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.08, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
      osc.start();
      osc.stop(_audioCtx.currentTime + dur);
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  HUD
  // ─────────────────────────────────────────────────────────────────────────
  function buildHUD() {
    _hudEl = document.createElement('div');
    _hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'padding:6px 10px', 'background:rgba(0,0,0,0.65)',
      'color:#FFDD88', 'font:bold 13px/1.4 monospace',
      'z-index:9999', 'pointer-events:none', 'text-align:center'
    ].join(';');
    document.body.appendChild(_hudEl);

    _msgEl = document.createElement('div');
    _msgEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFD700', 'font:bold 28px monospace',
      'text-shadow:2px 2px 4px #000',
      'z-index:10000', 'pointer-events:none',
      'opacity:0', 'transition:opacity 0.4s', 'text-align:center'
    ].join(';');
    document.body.appendChild(_msgEl);
  }

  function updateHUD() {
    if (!_hudEl) return;
    var alive = 0;
    var i;
    for (i = 0; i < _legionaries.length; i++) {
      if (_legionaries[i].hp > 0) alive++;
    }
    var liveEnemies = 0;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].hp > 0) liveEnemies++;
    }
    if (_chieftain && _chieftain.hp > 0) liveEnemies++;
    var chieftainStr = _chieftainDefeated ? 'DEFEATED' : 'ALIVE';
    var gateStr = _gateBreached ? '100% BREACHED' : Math.round(_ramProgress * 100) + '% BREACHED';
    var waveStr = _wave + '/3';
    _hudEl.textContent =
      'ROMAN CONQUEST' +
      ' [WAVE: ' + waveStr + ']' +
      ' [LEGIONARIES: ' + alive + '/20]' +
      ' [CHIEFTAIN: ' + chieftainStr + ']' +
      ' [GATE: ' + gateStr + ']' +
      ' [BARBARIANS: ' + liveEnemies + ']' +
      ' [HP: ' + Math.ceil(_playerHP) + ']' +
      ' [PILIA: ' + _piliumCount + ']' +
      (_testudoActive ? ' [TESTUDO]' : '') +
      (_chargeActive ? ' [CHARGE!]' : '') +
      (_holdTimer > 0 && _holdTimer < _holdRequired ? ' [HOLD: ' + Math.ceil(_holdRequired - _holdTimer) + 's]' : '');
  }

  function showMsg(txt, dur) {
    if (!_msgEl) return;
    _msgEl.innerHTML = txt;
    _msgEl.style.opacity = '1';
    if (dur) {
      setTimeout(function () { if (_msgEl) _msgEl.style.opacity = '0'; }, dur * 1000);
    }
  }

  function hideMsg() {
    if (_msgEl) _msgEl.style.opacity = '0';
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  SCENE BUILD
  // ─────────────────────────────────────────────────────────────────────────
  function buildScene() {
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x9ABACC);
    _scene.fog = new THREE.Fog(0x9ABACC, 60, 200);

    var ambient = new THREE.AmbientLight(0xDDCCAA, 0.5);
    _scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFEEBB, 1.1);
    sun.position.set(30, 60, -20);
    _scene.add(sun);

    buildTerrain();
    buildRomanCamp();
    buildOpenField();
    buildHillFort();
    buildChieftainHall();
    buildRam();
    buildBallista();
    buildPlayerMesh();
    buildLegionaries();
  }

  // ── Terrain ───────────────────────────────────────────────────────────────
  function buildTerrain() {
    // Main ground
    var groundGeo = new THREE.BoxGeometry(300, 1, 120);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x557744 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(10, -0.5, 0);
    _scene.add(ground);

    // Rolling hills (terrain bumps)
    var hillMat = new THREE.MeshLambertMaterial({ color: 0x4D6B3C });
    var i, hx, hz, hw, hd, hh;
    var hillData = [
      [-10, -30, 20, 18, 4],
      [20, 25, 18, 14, 3],
      [50, -20, 22, 16, 5],
      [70, 30, 16, 12, 4],
      [30, -40, 14, 12, 3]
    ];
    for (i = 0; i < hillData.length; i++) {
      hx = hillData[i][0]; hz = hillData[i][1];
      hw = hillData[i][2]; hd = hillData[i][3]; hh = hillData[i][4];
      var hillGeo = new THREE.BoxGeometry(hw, hh, hd);
      var hill = new THREE.Mesh(hillGeo, hillMat);
      hill.position.set(hx, hh * 0.5 - 0.5, hz);
      _scene.add(hill);
    }

    // Scattered boulders in open field
    var boulderMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var boulderPositions = [
      [10, 15], [25, -18], [35, 22], [15, -30], [45, 10],
      [5, 35], [55, -25], [40, -12], [60, 18], [20, -8]
    ];
    for (i = 0; i < boulderPositions.length; i++) {
      var br = randRange(0.8, 2.0);
      var boulderGeo = new THREE.SphereGeometry(br, 6, 5);
      var boulder = new THREE.Mesh(boulderGeo, boulderMat);
      boulder.position.set(boulderPositions[i][0], br * 0.5, boulderPositions[i][1]);
      _scene.add(boulder);
    }
  }

  // ── Roman Camp ───────────────────────────────────────────────────────────
  function buildRomanCamp() {
    var campMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var tentMat = new THREE.MeshLambertMaterial({ color: 0x997755 });
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var eagleMat = new THREE.MeshLambertMaterial({ color: 0xCCAA44 });

    // Camp wall/fortification perimeter (4 sides)
    var wallData = [
      // [x, y, z, w, h, d]
      [-70, 2, 0, 1.5, 4, 50],   // left wall
      [-50, 2, 0, 1.5, 4, 50],   // right wall
      [-60, 2, 25, 50, 4, 1.5],  // front wall
      [-60, 2, -25, 50, 4, 1.5]  // back wall
    ];
    var i;
    for (i = 0; i < wallData.length; i++) {
      var wd = wallData[i];
      var wg = new THREE.BoxGeometry(wd[3], wd[4], wd[5]);
      var wm = new THREE.Mesh(wg, campMat);
      wm.position.set(wd[0], wd[1], wd[2]);
      _scene.add(wm);
    }

    // Tents (ConeGeometry)
    var tentPositions = [
      [-65, -15], [-65, 0], [-65, 15],
      [-58, -10], [-58, 5], [-55, -20]
    ];
    for (i = 0; i < tentPositions.length; i++) {
      var tg = new THREE.ConeGeometry(3, 4, 6);
      var tent = new THREE.Mesh(tg, tentMat);
      tent.position.set(tentPositions[i][0], 2, tentPositions[i][1]);
      _scene.add(tent);
      // Tent base
      var tbg = new THREE.BoxGeometry(5, 1.5, 5);
      var tb = new THREE.Mesh(tbg, campMat);
      tb.position.set(tentPositions[i][0], 0.75, tentPositions[i][1]);
      _scene.add(tb);
    }

    // Roman standard (pole + eagle)
    var poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 8, 6);
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-60, 4, -20);
    _scene.add(pole);

    // Eagle head (box)
    var eagleGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
    var eagle = new THREE.Mesh(eagleGeo, eagleMat);
    eagle.position.set(-60, 8.3, -20);
    _scene.add(eagle);

    // Eagle wings (LineSegments)
    var eagleWingPts = new Float32Array([
      -0.4, 0, 0,  -1.5, 0.3, 0,
       0.4, 0, 0,   1.5, 0.3, 0,
      -0.4, 0, 0,  -1.0, -0.3, 0,
       0.4, 0, 0,   1.0, -0.3, 0
    ]);
    var ewGeo = new THREE.BufferGeometry();
    ewGeo.setAttribute('position', new THREE.BufferAttribute(eagleWingPts, 3));
    var ewLine = new THREE.LineSegments(ewGeo, new THREE.LineBasicMaterial({ color: 0xCCAA44 }));
    ewLine.position.set(-60, 8.3, -20);
    _scene.add(ewLine);

    // Standard cross-bars (LineSegments)
    var standardPts = new Float32Array([
      -0.6, 6.5, 0,  0.6, 6.5, 0,
      -0.5, 5.5, 0,  0.5, 5.5, 0
    ]);
    var stdGeo = new THREE.BufferGeometry();
    stdGeo.setAttribute('position', new THREE.BufferAttribute(standardPts, 3));
    var stdLine = new THREE.LineSegments(stdGeo, new THREE.LineBasicMaterial({ color: 0xCC4422 }));
    stdLine.position.set(-60, 2, -20);
    _scene.add(stdLine);
  }

  // ── Open Field ────────────────────────────────────────────────────────────
  function buildOpenField() {
    // Slightly differentiated field patch
    var fieldGeo = new THREE.BoxGeometry(80, 0.3, 80);
    var fieldMat = new THREE.MeshLambertMaterial({ color: 0x667755 });
    var field = new THREE.Mesh(fieldGeo, fieldMat);
    field.position.set(10, -0.15, 0);
    _scene.add(field);
  }

  // ── Hill Fort ────────────────────────────────────────────────────────────
  function buildHillFort() {
    var rampartMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x665544 });

    // Raised hill base
    var hillGeo = new THREE.BoxGeometry(80, 6, 80);
    var hillMat = new THREE.MeshLambertMaterial({ color: 0x6B7755 });
    var hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(80, 3, 0);
    _scene.add(hill);

    // Rampart walls: 3×8×60
    // Front rampart (facing player approach)
    var frontRamGeo = new THREE.BoxGeometry(3, 8, 60);
    var frontRam = new THREE.Mesh(frontRamGeo, rampartMat);
    frontRam.position.set(50, 10, 0);
    _scene.add(frontRam);

    // Back rampart
    var backRam = new THREE.Mesh(frontRamGeo.clone(), rampartMat);
    backRam.position.set(110, 10, 0);
    _scene.add(backRam);

    // Side ramparts
    var sideRamGeo = new THREE.BoxGeometry(60, 8, 3);
    var leftRam = new THREE.Mesh(sideRamGeo, rampartMat);
    leftRam.position.set(80, 10, 30);
    _scene.add(leftRam);

    var rightRam = new THREE.Mesh(sideRamGeo.clone(), rampartMat);
    rightRam.position.set(80, 10, -30);
    _scene.add(rightRam);

    // Watchtowers at corners
    var towerPositions = [
      [50, 30], [50, -30],
      [110, 30], [110, -30]
    ];
    var i;
    for (i = 0; i < towerPositions.length; i++) {
      var tg = new THREE.BoxGeometry(6, 12, 6);
      var tower = new THREE.Mesh(tg, towerMat);
      tower.position.set(towerPositions[i][0], 12, towerPositions[i][1]);
      _scene.add(tower);
      // Tower top platform
      var topGeo = new THREE.BoxGeometry(7, 0.8, 7);
      var top = new THREE.Mesh(topGeo, rampartMat);
      top.position.set(towerPositions[i][0], 18.4, towerPositions[i][1]);
      _scene.add(top);
    }

    // Wooden gate (LineSegments frame)
    var gatePts = new Float32Array([
      // Gate frame outline
      -3, 0, 0,  -3, 8, 0,    // left post
       3, 0, 0,   3, 8, 0,    // right post
      -3, 8, 0,   3, 8, 0,    // top bar
      // Cross braces
      -3, 3, 0,   3, 6, 0,
       3, 3, 0,  -3, 6, 0,
      // Bottom threshold
      -3, 0, 0,   3, 0, 0
    ]);
    var gateLineGeo = new THREE.BufferGeometry();
    gateLineGeo.setAttribute('position', new THREE.BufferAttribute(gatePts, 3));
    _gateLineMesh = new THREE.LineSegments(gateLineGeo, new THREE.LineBasicMaterial({ color: 0x885533, linewidth: 2 }));
    _gateLineMesh.position.set(50, 6, 0);
    _scene.add(_gateLineMesh);

    // Gate solid mesh (destructible)
    var gateGeo = new THREE.BoxGeometry(6, 8, 0.5);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x8B6030 });
    _gateMesh = new THREE.Mesh(gateGeo, gateMat);
    _gateMesh.position.set(50, 10, 0);
    _scene.add(_gateMesh);
  }

  // ── Chieftain's Hall ─────────────────────────────────────────────────────
  function buildChieftainHall() {
    var hallMat = new THREE.MeshLambertMaterial({ color: 0x775544 });
    var hallGeo = new THREE.BoxGeometry(25, 6, 20);
    var hall = new THREE.Mesh(hallGeo, hallMat);
    hall.position.set(_chieftainHallPos.x, 9, _chieftainHallPos.z);
    _scene.add(hall);

    // Hall roof
    var roofGeo = new THREE.BoxGeometry(26, 1, 21);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(_chieftainHallPos.x, 12.5, _chieftainHallPos.z);
    _scene.add(roof);

    // Hall entrance
    var doorGeo = new THREE.BoxGeometry(4, 5, 0.4);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(_chieftainHallPos.x - 12.5, 8.5, _chieftainHallPos.z);
    _scene.add(door);

    // Firepit (CylinderGeometry)
    var fireGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.5, 8);
    var fireMat = new THREE.MeshLambertMaterial({ color: 0x333222 });
    var fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(_chieftainHallPos.x, 6.25, _chieftainHallPos.z);
    _scene.add(fire);

    // Firepit flame visual
    var flameGeo = new THREE.CylinderGeometry(0.3, 1.0, 1.5, 6);
    var flameMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF2200, emissiveIntensity: 0.6 });
    var flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(_chieftainHallPos.x, 7.3, _chieftainHallPos.z);
    _scene.add(flame);

    // Firepit PointLight
    _firepitLight = new THREE.PointLight(0xFF4400, 1.5, 18);
    _firepitLight.position.set(_chieftainHallPos.x, 8, _chieftainHallPos.z);
    _scene.add(_firepitLight);
  }

  // ── Battering Ram ─────────────────────────────────────────────────────────
  function buildRam() {
    _ramGroup = new THREE.Group();

    // Log
    var logGeo = new THREE.BoxGeometry(8, 0.8, 0.8);
    var logMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var log = new THREE.Mesh(logGeo, logMat);
    log.position.set(0, 0, 0);
    _ramGroup.add(log);

    // Iron head
    var headGeo = new THREE.BoxGeometry(1, 1.2, 1.2);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x666677 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(4, 0, 0);
    _ramGroup.add(head);

    // Support handles
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
    var h1g = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var h1 = new THREE.Mesh(h1g, handleMat);
    h1.position.set(-2, 0.9, 0);
    _ramGroup.add(h1);
    var h2 = new THREE.Mesh(h1g.clone(), handleMat);
    h2.position.set(1, 0.9, 0);
    _ramGroup.add(h2);

    _ramGroup.position.set(-55, 1, 5);
    _scene.add(_ramGroup);
  }

  // ── Ballista ──────────────────────────────────────────────────────────────
  function buildBallista() {
    var frameMat = new THREE.MeshLambertMaterial({ color: 0x776644 });
    var boltMat = new THREE.MeshLambertMaterial({ color: 0x887755 });

    // Frame
    var fBase = new THREE.BoxGeometry(3, 0.5, 3);
    var base = new THREE.Mesh(fBase, frameMat);
    base.position.set(-56, 0.25, -18);
    _scene.add(base);

    var fArm = new THREE.BoxGeometry(0.3, 0.3, 4);
    var arm = new THREE.Mesh(fArm, frameMat);
    arm.position.set(-56, 1.2, -18);
    arm.rotation.y = Math.PI / 2;
    _scene.add(arm);

    var fUpright = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var upright = new THREE.Mesh(fUpright, frameMat);
    upright.position.set(-56, 1.0, -18);
    _scene.add(upright);

    // Bolt (CylinderGeometry)
    var boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
    var bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(-56, 1.4, -18);
    bolt.rotation.z = Math.PI / 2;
    _scene.add(bolt);

    // Frame braces (LineSegments)
    var bPts = new Float32Array([
      -1.5, 0, -1.5,  -1.5, 1.2, 0,
       1.5, 0, -1.5,   1.5, 1.2, 0,
      -1.5, 0,  1.5,  -1.5, 1.2, 0,
       1.5, 0,  1.5,   1.5, 1.2, 0
    ]);
    var bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.BufferAttribute(bPts, 3));
    var bLines = new THREE.LineSegments(bGeo, new THREE.LineBasicMaterial({ color: 0x554422 }));
    bLines.position.set(-56, 0.25, -18);
    _scene.add(bLines);
  }

  // ── Player Mesh ───────────────────────────────────────────────────────────
  function buildPlayerMesh() {
    var armorMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
    var crestMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });

    _playerMesh = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.2, 0.4);
    var body = new THREE.Mesh(bodyGeo, armorMat);
    body.position.set(0, 0, 0);
    _playerMesh.add(body);

    // Head/helmet
    var helmGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    var helm = new THREE.Mesh(helmGeo, armorMat);
    helm.position.set(0, 0.9, 0);
    _playerMesh.add(helm);

    // Crest
    var crestGeo = new THREE.BoxGeometry(0.1, 0.4, 0.5);
    var crest = new THREE.Mesh(crestGeo, crestMat);
    crest.position.set(0, 1.3, 0);
    _playerMesh.add(crest);

    // Sword (LineSegments)
    var swPts = new Float32Array([
      0, 0, 0,  0, 0.8, 0,   // blade
      0, 0, 0, -0.2, 0, 0,   // guard
      0, 0, 0,  0.2, 0, 0
    ]);
    var swGeo = new THREE.BufferGeometry();
    swGeo.setAttribute('position', new THREE.BufferAttribute(swPts, 3));
    var sword = new THREE.LineSegments(swGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC }));
    sword.position.set(0.5, 0, 0.2);
    _playerMesh.add(sword);

    // Shield
    var shieldGeo = new THREE.BoxGeometry(0.1, 0.9, 0.6);
    var shieldMat = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
    var shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(-0.5, 0, 0.2);
    _playerMesh.add(shield);

    _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    _scene.add(_playerMesh);
  }

  // ── Legionaries ──────────────────────────────────────────────────────────
  function buildLegionaries() {
    var armorMat = new THREE.MeshLambertMaterial({ color: 0x887744 });
    var shieldMat = new THREE.MeshLambertMaterial({ color: 0xAA3311 });
    var i;
    for (i = 0; i < 20; i++) {
      var group = new THREE.Group();

      // Body
      var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.35);
      var body = new THREE.Mesh(bodyGeo, armorMat);
      body.position.set(0, 0, 0);
      group.add(body);

      // Head
      var helmGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      var helm = new THREE.Mesh(helmGeo, armorMat);
      helm.position.set(0, 0.73, 0);
      group.add(helm);

      // Shield (held in front - vertical)
      var shieldGeo = new THREE.BoxGeometry(0.08, 0.8, 0.5);
      var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.position.set(-0.4, 0, 0.2);
      group.add(shieldMesh);

      // Testudo overhead shield (horizontal, hidden initially)
      var overheadShieldGeo = new THREE.BoxGeometry(0.6, 0.06, 0.6);
      var overheadShield = new THREE.Mesh(overheadShieldGeo, shieldMat);
      overheadShield.position.set(0, 1.1, 0);
      overheadShield.visible = false;
      group.add(overheadShield);

      var col = i % 4;
      var row = Math.floor(i / 4);
      var ox = -(row + 1) * 2.0;
      var oz = (col - 1.5) * 1.5;

      group.position.set(_playerPos.x + ox, _playerPos.y, _playerPos.z + oz);
      _scene.add(group);

      _legionaries.push({
        mesh: group,
        overheadShield: overheadShield,
        hp: 100,
        maxHp: 100,
        pos: { x: _playerPos.x + ox, y: _playerPos.y, z: _playerPos.z + oz },
        vel: { x: 0, z: 0 },
        state: 'follow',
        formOffset: { x: ox, z: oz },
        attackCooldown: 0
      });
    }
  }

  // ── Spawn Enemies ─────────────────────────────────────────────────────────
  function spawnWave(waveNum) {
    var i;
    if (waveNum === 1) {
      // 20 barbarian warriors
      for (i = 0; i < 20; i++) {
        spawnBarbarian(randRange(45, 55), randRange(-25, 25), 'warrior');
      }
    } else if (waveNum === 2) {
      // 30 warriors + 5 archers
      for (i = 0; i < 30; i++) {
        spawnBarbarian(randRange(45, 80), randRange(-25, 25), 'warrior');
      }
      for (i = 0; i < 5; i++) {
        spawnBarbarian(55 + i * 4, 25 + Math.random() * 6, 'archer');
      }
    } else if (waveNum === 3) {
      // 25 elite berserkers
      for (i = 0; i < 25; i++) {
        spawnBarbarian(randRange(55, 100), randRange(-20, 20), 'berserker');
      }
      // Spawn chieftain
      spawnChieftain();
    }
    _waveActive = true;
    showMsg('WAVE ' + waveNum + ' — ' + waveLabel(waveNum), 3);
    playBeep(440, 0.3, 0.1);
    playBeep(330, 0.5, 0.1);
  }

  function waveLabel(n) {
    if (n === 1) return 'BARBARIAN HORDE ATTACKS!';
    if (n === 2) return 'ARCHERS ON THE WALLS!';
    if (n === 3) return 'ELITE BERSERKERS! THE CHIEFTAIN AWAKENS!';
    return '';
  }

  function spawnBarbarian(x, z, type) {
    var col = 0x775544;
    var hp = 80;
    var w = 0.6, h = 1.0;
    if (type === 'archer') { col = 0x664433; hp = 60; }
    if (type === 'berserker') { col = 0x553322; hp = 150; w = 0.7; h = 1.1; }

    var mat = new THREE.MeshLambertMaterial({ color: col });
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(w, h, w * 0.6);
    var body = new THREE.Mesh(bodyGeo, mat);
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(w * 0.7, w * 0.7, w * 0.7);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xAA8866 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0.8, 0);
    group.add(headMesh);

    // Weapon (LineSegments axe)
    var axePts = new Float32Array([
      0, -0.4, 0,  0, 0.4, 0,   // handle
      0, 0.3, 0,   0.3, 0.5, 0, // blade upper
      0, 0.3, 0,   0.3, 0.1, 0  // blade lower
    ]);
    var axeGeo = new THREE.BufferGeometry();
    axeGeo.setAttribute('position', new THREE.BufferAttribute(axePts, 3));
    var axeLine = new THREE.LineSegments(axeGeo, new THREE.LineBasicMaterial({ color: 0x888888 }));
    axeLine.position.set(0.5, 0, 0.2);
    group.add(axeLine);

    group.position.set(x, 6.5, z);
    _scene.add(group);

    _enemies.push({
      mesh: group,
      hp: hp,
      maxHp: hp,
      type: type,
      pos: { x: x, y: 6.5, z: z },
      vel: { x: 0, z: 0 },
      state: 'patrol',
      attackCooldown: 0,
      arrowTimer: randRange(2, 5),
      enraged: false,
      enrageTriggered: false
    });
  }

  function spawnChieftain() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x443311 });
    var group = new THREE.Group();

    // Large body
    var bodyGeo = new THREE.BoxGeometry(1.2, 1.8, 0.7);
    var body = new THREE.Mesh(bodyGeo, mat);
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x775544 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.35, 0);
    group.add(headMesh);

    // Warhammer handle (CylinderGeometry)
    var handleGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    var handleMat = new THREE.MeshLambertMaterial({ color: 0x665533 });
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0.8, 0.3, 0);
    handle.rotation.z = Math.PI / 3;
    group.add(handle);

    // Warhammer head (BoxGeometry)
    var hammerGeo = new THREE.BoxGeometry(0.4, 0.4, 0.5);
    var hammerMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
    var hammer = new THREE.Mesh(hammerGeo, hammerMat);
    hammer.position.set(1.4, 0.9, 0);
    group.add(hammer);

    group.position.set(_chieftainHallPos.x, 8.0, _chieftainHallPos.z);
    _scene.add(group);

    _chieftain = {
      mesh: group,
      hp: 500,
      maxHp: 500,
      pos: { x: _chieftainHallPos.x, y: 8.0, z: _chieftainHallPos.z },
      vel: { x: 0, z: 0 },
      state: 'idle',
      attackCooldown: 0,
      phase2: false
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  UPDATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  function countAliveEnemies() {
    var n = 0, i;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].hp > 0) n++;
    }
    if (_chieftain && _chieftain.hp > 0) n++;
    return n;
  }

  function countAliveLegionaries() {
    var n = 0, i;
    for (i = 0; i < _legionaries.length; i++) {
      if (_legionaries[i].hp > 0) n++;
    }
    return n;
  }

  function getNearestEnemy(pos) {
    var best = null, bestD = Infinity, i, e, d;
    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (e.hp <= 0) continue;
      d = dist2d(pos, e.pos);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (_chieftain && _chieftain.hp > 0) {
      d = dist2d(pos, _chieftain.pos);
      if (d < bestD) { best = _chieftain; }
    }
    return best;
  }

  function damageEnemy(enemy, dmg) {
    if (!enemy || enemy.hp <= 0) return;
    enemy.hp -= dmg;
    playBeep(200, 0.08, 0.06);
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      if (enemy.mesh) { _scene.remove(enemy.mesh); enemy.mesh = null; }
    }
  }

  function damageLegionary(leg, dmg) {
    if (!leg || leg.hp <= 0) return;
    // Testudo reduces arrow damage
    var effective = _testudoActive ? dmg * 0.2 : dmg;
    leg.hp -= effective;
    if (leg.hp <= 0) {
      leg.hp = 0;
      if (leg.mesh) { _scene.remove(leg.mesh); leg.mesh = null; }
    }
  }

  function damagePlayer(dmg) {
    var effective = dmg;
    if (_keys['mouse2']) effective *= 0.5; // blocking
    _playerHP -= effective;
    playBeep(150, 0.1, 0.08);
    if (_playerHP <= 0) {
      _playerHP = 0;
      _playerDead = true;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PLAYER UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (_playerDead) return;

    // Movement
    var speed = 8.0;
    var fwd = { x: Math.sin(_playerYaw), z: Math.cos(_playerYaw) };
    var right = { x: fwd.z, z: -fwd.x };

    _playerVelX = 0; _playerVelZ = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    { _playerVelX += fwd.x;   _playerVelZ += fwd.z; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { _playerVelX -= fwd.x;   _playerVelZ -= fwd.z; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { _playerVelX -= right.x; _playerVelZ -= right.z; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { _playerVelX += right.x; _playerVelZ += right.z; }

    var len = Math.sqrt(_playerVelX * _playerVelX + _playerVelZ * _playerVelZ);
    if (len > 0) { _playerVelX /= len; _playerVelZ /= len; }

    _playerPos.x += _playerVelX * speed * dt;
    _playerPos.z += _playerVelZ * speed * dt;

    // Clamp to map
    _playerPos.x = clamp(_playerPos.x, -75, 115);
    _playerPos.z = clamp(_playerPos.z, -55, 55);

    // Gate collision — can't pass if not breached
    if (!_gateBreached && _playerPos.x > 47 && _playerPos.x < 53 && _playerPos.z > -5 && _playerPos.z < 5) {
      _playerPos.x = 47;
    }

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      _playerMesh.rotation.y = _playerYaw;
    }

    // Attack cooldowns
    if (_attackCooldown > 0) _attackCooldown -= dt;
    if (_throwCooldown > 0) _throwCooldown -= dt;

    // Melee attack (F key or left mouse)
    if ((_keys['KeyF'] || _keys['mouse1']) && _attackCooldown <= 0) {
      _attackCooldown = 0.5;
      var i;
      for (i = 0; i < _enemies.length; i++) {
        var e = _enemies[i];
        if (e.hp > 0 && dist2d(_playerPos, e.pos) < 3.5) {
          damageEnemy(e, 25);
        }
      }
      if (_chieftain && _chieftain.hp > 0 && dist2d(_playerPos, _chieftain.pos) < 4.5) {
        damageEnemy(_chieftain, 25);
      }
      playBeep(350, 0.1, 0.08, 'sawtooth');
    }

    // Throw pilum (E key)
    if (_keys['KeyE'] && _throwCooldown <= 0 && _piliumCount > 0) {
      _throwCooldown = 1.0;
      _piliumCount--;
      throwPilum();
    }

    // Check in chieftain hall
    _playerInHall = (Math.abs(_playerPos.x - _chieftainHallPos.x) < 13 &&
                     Math.abs(_playerPos.z - _chieftainHallPos.z) < 11);

    // Check near ram
    if (_ramGroup && !_gateBreached && _ramCarrying) {
      _ramGroup.position.set(_playerPos.x + 3, 1, _playerPos.z);
    }
  }

  function throwPilum() {
    var dir = { x: Math.sin(_playerYaw), z: Math.cos(_playerYaw) };
    var pGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 5);
    var pMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var mesh = new THREE.Mesh(pGeo, pMat);
    mesh.position.set(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
    mesh.rotation.z = Math.PI / 2;
    _scene.add(mesh);
    _pilia.push({
      mesh: mesh,
      vel: { x: dir.x * 30, y: 0, z: dir.z * 30 },
      life: 3.0,
      pos: { x: _playerPos.x, y: _playerPos.y + 0.5, z: _playerPos.z }
    });
    playBeep(500, 0.15, 0.07, 'sawtooth');
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  LEGIONARY UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateLegionaries(dt) {
    var i, leg, target, dx, dz, dist, speed;

    for (i = 0; i < _legionaries.length; i++) {
      leg = _legionaries[i];
      if (leg.hp <= 0 || !leg.mesh) continue;

      // Update overhead shield visibility (testudo)
      if (leg.overheadShield) {
        leg.overheadShield.visible = _testudoActive;
      }

      // Attack cooldown
      if (leg.attackCooldown > 0) leg.attackCooldown -= dt;

      if (_testudoActive) {
        // Testudo: cluster around player
        var tx = _playerPos.x + leg.formOffset.x * 0.4;
        var tz = _playerPos.z + leg.formOffset.z * 0.4;
        dx = tx - leg.pos.x; dz = tz - leg.pos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        speed = 5.0;
        if (dist > 0.3) {
          leg.pos.x += (dx / dist) * speed * dt;
          leg.pos.z += (dz / dist) * speed * dt;
        }
      } else if (_chargeActive) {
        // Charge: sprint toward nearest enemy
        target = getNearestEnemy(leg.pos);
        if (target) {
          dx = target.pos.x - leg.pos.x;
          dz = target.pos.z - leg.pos.z;
          dist = Math.sqrt(dx * dx + dz * dz);
          speed = 12.0;
          if (dist > 1.5) {
            leg.pos.x += (dx / dist) * speed * dt;
            leg.pos.z += (dz / dist) * speed * dt;
          } else if (leg.attackCooldown <= 0) {
            // Melee hit
            damageEnemy(target, 20);
            leg.attackCooldown = 0.8;
          }
        }
      } else {
        // Follow player in formation
        var fx = _playerPos.x + leg.formOffset.x;
        var fz = _playerPos.z + leg.formOffset.z;
        dx = fx - leg.pos.x; dz = fz - leg.pos.z;
        dist = Math.sqrt(dx * dx + dz * dz);
        speed = 7.0;
        if (dist > 1.0) {
          leg.pos.x += (dx / dist) * speed * dt;
          leg.pos.z += (dz / dist) * speed * dt;
        }

        // Auto-attack nearby enemies
        target = getNearestEnemy(leg.pos);
        if (target && dist2d(leg.pos, target.pos) < 2.5 && leg.attackCooldown <= 0) {
          damageEnemy(target, 15);
          leg.attackCooldown = 1.0;
        }
      }

      // Sync mesh position
      leg.mesh.position.set(leg.pos.x, leg.pos.y, leg.pos.z);
      leg.mesh.rotation.y = _playerYaw;
    }

    // Charge timer
    if (_chargeActive) {
      _chargeTimer -= dt;
      if (_chargeTimer <= 0) {
        _chargeActive = false;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  ENEMY UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    var i, e, dx, dz, dist, speed;

    for (i = 0; i < _enemies.length; i++) {
      e = _enemies[i];
      if (e.hp <= 0 || !e.mesh) continue;

      // Berserker enrage at 50% HP
      if (e.type === 'berserker' && !e.enrageTriggered && e.hp <= e.maxHp * 0.5) {
        e.enrageTriggered = true;
        e.enraged = true;
        if (e.mesh) e.mesh.children[0].material.color.setHex(0xFF3300);
      }

      speed = e.type === 'berserker' ? (e.enraged ? 9 : 6) : (e.type === 'archer' ? 2 : 5);

      if (e.type === 'archer') {
        // Archers stay on rampart, fire arrows at player/legionaries
        e.arrowTimer -= dt;
        if (e.arrowTimer <= 0) {
          e.arrowTimer = randRange(2.5, 5.0);
          fireArrowAt(e.pos, _playerPos);
          // Also target nearby legionaries
          var j;
          for (j = 0; j < _legionaries.length; j++) {
            if (_legionaries[j].hp > 0 && dist2d(e.pos, _legionaries[j].pos) < 50) {
              fireArrowAt(e.pos, _legionaries[j].pos);
              break;
            }
          }
        }
      } else {
        // Melee — charge at player
        var nearestLeg = null, nearestLegDist = Infinity, j2;
        for (j2 = 0; j2 < _legionaries.length; j2++) {
          if (_legionaries[j2].hp > 0) {
            var ld = dist2d(e.pos, _legionaries[j2].pos);
            if (ld < nearestLegDist) { nearestLegDist = ld; nearestLeg = _legionaries[j2]; }
          }
        }
        var targetPos = _playerPos;
        if (nearestLeg && nearestLegDist < dist2d(e.pos, _playerPos) * 0.8) {
          targetPos = nearestLeg.pos;
        }

        dx = targetPos.x - e.pos.x;
        dz = targetPos.z - e.pos.z;
        dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1.5) {
          e.pos.x += (dx / dist) * speed * dt;
          e.pos.z += (dz / dist) * speed * dt;
          e.mesh.rotation.y = Math.atan2(dx, dz);
        } else {
          // Attack
          if (e.attackCooldown <= 0) {
            var dmg = e.type === 'berserker' ? (e.enraged ? 30 : 18) : 12;
            if (targetPos === _playerPos) {
              damagePlayer(dmg);
            } else if (nearestLeg) {
              damageLegionary(nearestLeg, dmg);
            }
            e.attackCooldown = e.enraged ? 0.5 : 1.2;
          }
        }

        if (e.attackCooldown > 0) e.attackCooldown -= dt;
        e.mesh.position.set(e.pos.x, e.pos.y, e.pos.z);
      }
    }

    // Chieftain update
    if (_chieftain && _chieftain.hp > 0) {
      updateChieftain(dt);
    }
  }

  function updateChieftain(dt) {
    var c = _chieftain;
    if (!c || c.hp <= 0 || !c.mesh) return;

    // Phase 2 at 50%
    if (!c.phase2 && c.hp <= c.maxHp * 0.5) {
      c.phase2 = true;
      c.mesh.children[0].material.color.setHex(0xFF2200);
      showMsg('CHIEFTAIN ENRAGED!', 2);
    }

    var speed = c.phase2 ? 7 : 4;
    var dx = _playerPos.x - c.pos.x;
    var dz = _playerPos.z - c.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 3) {
      c.pos.x += (dx / dist) * speed * dt;
      c.pos.z += (dz / dist) * speed * dt;
    } else {
      if (c.attackCooldown <= 0) {
        var dmg = c.phase2 ? 55 : 35;
        damagePlayer(dmg);
        c.attackCooldown = c.phase2 ? 0.7 : 1.5;
        playBeep(100, 0.2, 0.1);
      }
    }
    if (c.attackCooldown > 0) c.attackCooldown -= dt;
    c.mesh.position.set(c.pos.x, c.pos.y, c.pos.z);
    c.mesh.rotation.y = Math.atan2(dx, dz);

    // Check legionary attacks on chieftain
    var j;
    for (j = 0; j < _legionaries.length; j++) {
      var leg = _legionaries[j];
      if (leg.hp > 0 && dist2d(leg.pos, c.pos) < 3 && leg.attackCooldown <= 0) {
        damageEnemy(c, 12);
        leg.attackCooldown = 1.0;
      }
    }

    if (c.hp <= 0) {
      c.hp = 0;
      _chieftainDefeated = true;
      if (c.mesh) { _scene.remove(c.mesh); c.mesh = null; }
      showMsg('CHIEFTAIN SLAIN!<br>HOLD THE HALL FOR ' + _holdRequired + ' SECONDS!', 4);
      playBeep(880, 0.5, 0.12, 'sawtooth');
    }
  }

  function fireArrowAt(from, to) {
    var dx = to.x - from.x;
    var dy = (to.y || 1) - (from.y || 6);
    var dz = to.z - from.z;
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 1) return;

    var arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5);
    var arrowMat = new THREE.MeshLambertMaterial({ color: 0x886633 });
    var mesh = new THREE.Mesh(arrowGeo, arrowMat);
    mesh.position.set(from.x, from.y || 6, from.z);
    _scene.add(mesh);

    var spd = 18;
    _arrows.push({
      mesh: mesh,
      vel: { x: (dx / dist) * spd, y: (dy / dist) * spd, z: (dz / dist) * spd },
      pos: { x: from.x, y: from.y || 6, z: from.z },
      life: 4.0,
      fromPlayer: false
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PROJECTILE UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    var i, a;

    // Arrows
    for (i = _arrows.length - 1; i >= 0; i--) {
      a = _arrows[i];
      a.life -= dt;
      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt - 4.9 * dt * dt; // mild gravity
      a.pos.z += a.vel.z * dt;
      a.mesh.position.set(a.pos.x, a.pos.y, a.pos.z);

      var hit = false;
      // Check player hit
      if (!a.fromPlayer && dist3d(a.pos, { x: _playerPos.x, y: _playerPos.y + 0.5, z: _playerPos.z }) < 1.2) {
        var arrowDmg = _testudoActive ? 4 : 15;
        if (_keys['mouse2']) arrowDmg *= 0.5;
        damagePlayer(arrowDmg);
        hit = true;
      }
      // Check legionary hits
      if (!a.fromPlayer) {
        var j;
        for (j = 0; j < _legionaries.length; j++) {
          var leg = _legionaries[j];
          if (leg.hp > 0 && dist3d(a.pos, { x: leg.pos.x, y: leg.pos.y + 0.5, z: leg.pos.z }) < 1.0) {
            damageLegionary(leg, _testudoActive ? 2 : 12);
            hit = true;
            break;
          }
        }
      }

      if (hit || a.life <= 0 || a.pos.y < 0) {
        _scene.remove(a.mesh);
        _arrows.splice(i, 1);
      }
    }

    // Pilia (javelins)
    for (i = _pilia.length - 1; i >= 0; i--) {
      var p = _pilia[i];
      p.life -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.pos.z += p.vel.z * dt;
      p.mesh.position.set(p.pos.x, p.pos.y, p.pos.z);

      var phit = false;
      var j3;
      for (j3 = 0; j3 < _enemies.length; j3++) {
        var enemy = _enemies[j3];
        if (enemy.hp > 0 && dist3d(p.pos, { x: enemy.pos.x, y: enemy.pos.y, z: enemy.pos.z }) < 1.2) {
          damageEnemy(enemy, 60);
          phit = true;
          break;
        }
      }
      if (!phit && _chieftain && _chieftain.hp > 0 && dist3d(p.pos, _chieftain.pos) < 1.8) {
        damageEnemy(_chieftain, 60);
        phit = true;
      }

      if (phit || p.life <= 0 || p.pos.y < -2) {
        _scene.remove(p.mesh);
        _pilia.splice(i, 1);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RAM UPDATE
  // ─────────────────────────────────────────────────────────────────────────
  function updateRam(dt) {
    if (_gateBreached || !_ramGroup) return;

    // Player picks up/drops ram with R (not activation key context — just proximity)
    if (_ramCooldown > 0) _ramCooldown -= dt;

    if (!_ramCarrying) {
      var ramPos = _ramGroup.position;
      if (dist2d({ x: _playerPos.x, y: 0, z: _playerPos.z },
                  { x: ramPos.x, y: 0, z: ramPos.z }) < 4 && _keys['KeyG']) {
        _ramCarrying = true;
        showMsg('CARRYING BATTERING RAM — advance to the gate!', 2);
      }
    } else {
      // Carry ram with player
      _ramGroup.position.set(_playerPos.x + 4, 1, _playerPos.z);

      // Check proximity to gate
      if (_playerPos.x > 43 && _playerPos.x < 49 && Math.abs(_playerPos.z) < 6) {
        if (_ramTimer <= 0) {
          _ramTimer = 1.2;
          _ramProgress = Math.min(1.0, _ramProgress + 0.2);
          showMsg('RAMMING GATE! ' + Math.round(_ramProgress * 100) + '% BREACHED', 1.2);
          playBeep(180, 0.25, 0.12, 'sawtooth');
          // Shake gate mesh
          if (_gateMesh) _gateMesh.position.x = 50 + (Math.random() - 0.5) * 0.3;

          if (_ramProgress >= 1.0) {
            breachGate();
          }
        }
      }
      if (_ramTimer > 0) _ramTimer -= dt;

      // Put down ram with G
      if (_keys['KeyG'] && _ramCooldown <= 0) {
        _ramCarrying = false;
        _ramCooldown = 0.5;
      }
    }
  }

  function breachGate() {
    _gateBreached = true;
    if (_gateMesh) { _scene.remove(_gateMesh); _gateMesh = null; }
    if (_gateLineMesh) { _scene.remove(_gateLineMesh); _gateLineMesh = null; }
    _ramCarrying = false;
    showMsg('GATE BREACHED! STORM THE FORT!', 3);
    playBeep(660, 0.4, 0.12);
    playBeep(880, 0.4, 0.12);

    if (_wave < 3) {
      _wave = 3;
      spawnWave(3);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  WAVE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────
  function updateWaves(dt) {
    if (_wave === 0) {
      _wave = 1;
      spawnWave(1);
      return;
    }

    if (!_waveActive) return;

    var aliveCount = 0;
    var i;
    for (i = 0; i < _enemies.length; i++) {
      if (_enemies[i].hp > 0) aliveCount++;
    }

    // Wave 1 done: start wave 2 (enemies reduced by half)
    if (_wave === 1 && aliveCount < 5 && !_waveTransTimer) {
      _waveTransTimer = 4;
    }
    // Wave 2 done: wave 3 spawns after gate breach (handled in breachGate)
    if (_wave === 2 && aliveCount < 5 && _gateBreached && !_waveTransTimer) {
      _waveTransTimer = 3;
    }

    if (_waveTransTimer > 0) {
      _waveTransTimer -= dt;
      if (_waveTransTimer <= 0) {
        _waveTransTimer = 0;
        if (_wave === 1) {
          _wave = 2;
          spawnWave(2);
        }
      }
    }

    // Victory check
    if (_chieftainDefeated && _playerInHall && !_gameWon) {
      _holdTimer += dt;
      if (_holdTimer >= _holdRequired) {
        _gameWon = true;
        endGame(true);
      }
    } else if (!_playerInHall && _holdTimer > 0 && !_gameWon) {
      // Player left hall, stop timer
      // (don't reset, just pause)
    }

    // Defeat check
    if (countAliveLegionaries() === 0 || _playerDead) {
      if (!_gameOver) {
        _gameOver = true;
        endGame(false);
      }
    }
  }

  function endGame(won) {
    if (won) {
      showMsg('VICTORIA!<br>ROME CONQUERS ALL!', 0);
      playBeep(880, 0.3, 0.12);
      playBeep(1100, 0.3, 0.12);
      playBeep(1320, 0.5, 0.15);
    } else {
      showMsg('THE LEGION FALLS...<br>FOR ROME!', 0);
      playBeep(220, 0.6, 0.1);
      playBeep(165, 0.8, 0.1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  FIREPIT FLICKER
  // ─────────────────────────────────────────────────────────────────────────
  function updateFirepit(dt) {
    if (_firepitLight) {
      _firepitLight.intensity = 1.0 + Math.sin(Date.now() * 0.008) * 0.4 + Math.random() * 0.2;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  CAMERA
  // ─────────────────────────────────────────────────────────────────────────
  function updateCamera() {
    var eyeH = 1.65;
    _camera.position.set(_playerPos.x, _playerPos.y + eyeH, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _playerYaw;
    _camera.rotation.x = _playerPitch;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN LOOP
  // ─────────────────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!_active) return;
    _animId = requestAnimationFrame(loop);

    var dt = Math.min((ts - _lastTime) / 1000, 0.05);
    _lastTime = ts;

    if (!_gameOver && !_gameWon) {
      updatePlayer(dt);
      updateLegionaries(dt);
      updateEnemies(dt);
      updateProjectiles(dt);
      updateRam(dt);
      updateWaves(dt);
      updateFirepit(dt);
    }

    updateCamera();
    updateHUD();
    _renderer.render(_scene, _camera);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  INPUT
  // ─────────────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    _keys[e.code] = true;

    if (!_active) {
      // Activation: R+C within 400ms
      if (e.code === 'KeyR' || e.code === 'KeyC') {
        _keyTimes[e.code] = Date.now();
        var other = e.code === 'KeyR' ? 'KeyC' : 'KeyR';
        if (_keyTimes[other] && (Date.now() - _keyTimes[other]) < _ACTIVATION_WINDOW) {
          activate();
        }
      }
      return;
    }

    // Testudo (T)
    if (e.code === 'KeyT') {
      _testudoActive = !_testudoActive;
      _chargeActive = false;
      showMsg(_testudoActive ? 'TESTUDO FORMATION!' : 'FORMATION BROKEN', 1.5);
    }

    // Charge (C — but only when active, not activation)
    if (e.code === 'KeyC' && _active) {
      _chargeActive = true;
      _testudoActive = false;
      _chargeTimer = 6.0;
      showMsg('CHARGE! FOR ROME!', 1.5);
      playBeep(660, 0.2, 0.1, 'sawtooth');
    }

    // Prevent arrow key scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) !== -1) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    var sens = 0.002;
    _playerYaw -= e.movementX * sens;
    _playerPitch -= e.movementY * sens;
    _playerPitch = clamp(_playerPitch, -Math.PI * 0.4, Math.PI * 0.4);
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _keys['mouse1'] = true;
    if (e.button === 2) _keys['mouse2'] = true;
    // Request pointer lock on click
    if (document.pointerLockElement !== _renderer.domElement) {
      _renderer.domElement.requestPointerLock();
    }
  }

  function onMouseUp(e) {
    if (e.button === 0) _keys['mouse1'] = false;
    if (e.button === 2) _keys['mouse2'] = false;
  }

  function onContextMenu(e) { if (_active) e.preventDefault(); }

  function onResize() {
    if (!_active) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  ACTIVATE / DEACTIVATE
  // ─────────────────────────────────────────────────────────────────────────
  function activate() {
    if (_active) return;
    _active = true;
    _keyTimes = {};

    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}

    // Renderer
    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(_renderer.domElement);
    _renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';

    // Camera (FPS)
    _camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);

    buildScene();
    buildHUD();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('resize', onResize);

    _lastTime = performance.now();
    showMsg('ROMAN CONQUEST<br><small>WASD: Move | F/Click: Gladius | E: Pilum | T: Testudo | C: Charge | G: Ram | RMB: Block</small>', 5);

    _animId = requestAnimationFrame(loop);
  }

  function deactivate() {
    if (!_active) return;
    _active = false;
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (_renderer) { document.body.removeChild(_renderer.domElement); _renderer.dispose(); _renderer = null; }
    if (_hudEl) { document.body.removeChild(_hudEl); _hudEl = null; }
    if (_msgEl) { document.body.removeChild(_msgEl); _msgEl = null; }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('resize', onResize);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────
  function init() {
    window.addEventListener('keydown', onKeyDown);
  }

  function update() {}

  function reset() {
    deactivate();
    // Reset all state
    _playerHP = 200;
    _playerMaxHP = 200;
    _playerPos = { x: -60, y: 1.0, z: 0 };
    _playerVelX = 0; _playerVelZ = 0;
    _playerYaw = 0; _playerPitch = 0;
    _playerDead = false;
    _piliumCount = 5;
    _attackCooldown = 0; _throwCooldown = 0; _blockCooldown = 0;
    _playerMesh = null;
    _legionaries = [];
    _testudoActive = false; _chargeActive = false; _chargeTimer = 0;
    _enemies = [];
    _arrows = []; _pilia = [];
    _chieftain = null;
    _gateHP = 100; _gateBreached = false;
    _gateMesh = null; _gateLineMesh = null;
    _ramTimer = 0; _ramCooldown = 0; _ramGroup = null;
    _ramCarrying = false; _ramProgress = 0;
    _wave = 0; _waveActive = false; _waveTransTimer = 0;
    _gameOver = false; _gameWon = false;
    _victoryTimer = 0; _chieftainDefeated = false;
    _holdTimer = 0; _playerInHall = false;
    _firepitLight = null;
    _scene = null; _camera = null; _renderer = null; _animId = null;
    _keys = {}; _keyTimes = {};
  }

  init();

  return { init: init, update: update, reset: reset };
}());
