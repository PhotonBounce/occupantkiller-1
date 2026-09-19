window.Jailbreak = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _clock;
  var _active = false;
  var _container;

  // Key chord tracking J+B within 400ms
  var _keysDown = {};
  var _jTime = 0;
  var _bTime = 0;

  // Player
  var _player;
  var _playerHP = 100;
  var _playerSpeed = 8;
  var _cameraAngle = 0;
  var _cameraDistance = 22;
  var _cameraHeight = 16;

  // Timer
  var _timeRemaining = 480; // 8 minutes
  var _gameOver = false;
  var _gameWon = false;

  // Alarms
  var _alarmCount = 0;
  var _extraGuardsSpawned = [0, 0, 0]; // per alarm level

  // Power
  var _powerOn = true;
  var _generators = [];
  var _generatorsDestroyed = 0;
  var _fenceElectrified = true;
  var _floodlights = [];
  var _stealthBonus = 1.0; // detection range multiplier

  // Inmates
  var _inmates = [];          // all 50 inmate meshes
  var _followingInmates = []; // currently following (max 15)
  var _escapedCount = 0;
  var _gatherPoint = null;
  var _inmateScatterTimer = 0;
  var _inmatesScattered = false;

  // Cell blocks
  var _cellLocksA = [];  // 5 lock meshes for block A
  var _cellLocksB = null; // single master-lock for block B
  var _blockBUnlocked = false;

  // Items / inventory
  var _hasMasterKey = false;
  var _hasBoltCutters = false;
  var _hasRope = false;
  var _tearGasCount = 0;
  var _hasUniform = false;
  var _uniformActive = false;
  var _uniformTimer = 0;
  var _shivCount = 0;

  // Warden
  var _warden = null;
  var _wardenHP = 250;
  var _wardenDead = false;
  var _wardenHelicopterTimer = 300; // 5 minutes
  var _helicopter = null;
  var _helicopterSearchlight = null;
  var _helicopterActive = false;

  // Guards
  var _guards = [];        // patrol guards
  var _towerGuards = [];   // 4 tower guards
  var _allGuardsList = []; // combined for iteration

  // Gate
  var _gateMesh = null;
  var _gateCut = false;
  var _cuttingGate = false;
  var _cutTimer = 0;

  // Shooting
  var _bullets = [];
  var _canShoot = true;
  var _shootCooldown = 0;
  var _shootPressed = false;

  // Tear gas
  var _tearGasObjects = [];

  // Rope grapple
  var _ropeActive = false;
  var _ropeTimer = 0;
  var _onRoof = false;

  // HUD
  var _hud = null;
  var _promptEl = null;
  var _promptTimer = 0;

  // Audio
  var _audioCtx = null;

  // Mouse aim
  var _mouseX = 0;
  var _mouseY = 0;
  var _aimAngle = 0;

  // ── Geometry helpers ──────────────────────────────────────────────────────────
  function _box(w, h, d, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), mat);
  }

  function _sphere(r, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.SphereGeometry(r, segs || 8, segs || 8), mat);
  }

  function _cone(r, h, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs || 8), mat);
  }

  function _lineSegs(pts, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < pts.length; i++) {
      verts.push(pts[i].x, pts[i].y, pts[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
  }

  function _beep(freq, dur, vol, type) {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq || 440;
      osc.type = type || 'square';
      gain.gain.setValueAtTime(vol || 0.1, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + (dur || 0.15));
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + (dur || 0.15));
    } catch (e) { /* silence */ }
  }

  // ── Build world ───────────────────────────────────────────────────────────────
  function _buildWorld() {
    // Ground
    var ground = _box(200, 0.2, 200, 0x333322);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // ── YARD PlaneGeometry 40x40 (0x444433) ──────────────────────────────────
    var geo = new THREE.PlaneGeometry(40, 40);
    var mat = new THREE.MeshLambertMaterial({ color: 0x444433 });
    var yard = new THREE.Mesh(geo, mat);
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0, 0.01, 0);
    _scene.add(yard);

    // ── FENCE perimeter LineSegments 60x60 ───────────────────────────────────
    _buildFence();

    // ── CELL BLOCK A BoxGeometry 30x4x20 (0x555555) ──────────────────────────
    var blockA = _box(30, 4, 20, 0x555555);
    blockA.position.set(-15, 2, -20);
    _scene.add(blockA);
    _buildCellsA();

    // ── CELL BLOCK B BoxGeometry 30x4x20 (0x555555) ──────────────────────────
    var blockB = _box(30, 4, 20, 0x555555);
    blockB.position.set(-15, 2, 10);
    _scene.add(blockB);
    _buildCellsB();

    // ── WARDEN'S OFFICE BoxGeometry 10x4x8 (0x334455) ────────────────────────
    var wardenOffice = _box(10, 4, 8, 0x334455);
    wardenOffice.position.set(22, 2, -22);
    _scene.add(wardenOffice);
    _buildWardenOffice(22, 2, -22);

    // ── POWER STATION BoxGeometry 8x4x6 (0x334433) ───────────────────────────
    var powerStn = _box(8, 4, 6, 0x334433);
    powerStn.position.set(22, 2, 15);
    _scene.add(powerStn);
    _buildPowerStation(22, 2, 15);

    // ── GUARD ARMORY BoxGeometry 6x4x6 (0x334444) ────────────────────────────
    var armory = _box(6, 4, 6, 0x334444);
    armory.position.set(-24, 2, 22);
    _scene.add(armory);
    // Shotgun pickup
    var shotgun = _box(1.5, 0.2, 0.2, 0x888888);
    shotgun.position.set(-24, 1.2, 22);
    shotgun.userData = { type: 'pickup', name: 'shiv', count: 3 };
    _scene.add(shotgun);

    // Tear gas canister CylinderGeometry in armory
    var tgCan = _cyl(0.2, 0.2, 0.5, 8, 0x44AA44);
    tgCan.position.set(-23, 1.25, 21);
    tgCan.userData = { type: 'pickup', name: 'teargas', count: 3 };
    _scene.add(tgCan);

    // ── INFIRMARY BoxGeometry 15x4x10 (0x445544) ─────────────────────────────
    var infirmary = _box(15, 4, 10, 0x445544);
    infirmary.position.set(12, 2, -5);
    _scene.add(infirmary);
    // Medical kit
    var medkit = _box(0.6, 0.6, 0.6, 0xFF4444);
    medkit.position.set(12, 1.3, -5);
    medkit.userData = { type: 'pickup', name: 'medkit', count: 1 };
    _scene.add(medkit);

    // ── MAINTENANCE SHED BoxGeometry (0x556633) with bolt cutters ────────────
    var shed = _box(6, 3, 5, 0x556633);
    shed.position.set(-24, 1.5, -5);
    _scene.add(shed);
    var boltCutters = _box(1.0, 0.2, 0.3, 0xAAAAAA);
    boltCutters.position.set(-24, 1.5, -5);
    boltCutters.userData = { type: 'pickup', name: 'boltcutters', count: 1 };
    _scene.add(boltCutters);

    // ── GUARD TOWERS 8× CylinderGeometry (0x445544) ──────────────────────────
    var towerPos = [
      { x: -30, z: -30 }, { x: 0, z: -30 }, { x: 30, z: -30 }, { x: -30, z: 0 },
      { x: 30, z: 0 },    { x: -30, z: 30 }, { x: 0, z: 30 },  { x: 30, z: 30 }
    ];
    for (var ti = 0; ti < towerPos.length; ti++) {
      var tp = towerPos[ti];
      var tower = _cyl(1.5, 1.5, 8, 8, 0x445544);
      tower.position.set(tp.x, 4, tp.z);
      _scene.add(tower);
      // Platform top
      var platform = _box(4, 0.3, 4, 0x445544);
      platform.position.set(tp.x, 8.15, tp.z);
      _scene.add(platform);

      // Only 4 get tower guards (corners)
      if (ti === 0 || ti === 2 || ti === 5 || ti === 7) {
        var tg = _box(0.8, 1.8, 0.8, 0x334455);
        tg.position.set(tp.x, 9, tp.z);
        tg.userData = {
          type: 'towerGuard',
          hp: 100,
          dead: false,
          post: { x: tp.x, z: tp.z },
          scanAngle: Math.atan2(-tp.x, -tp.z),
          scanSpeed: 0.35,
          detectionRange: 30,
          alertTimer: 0
        };
        _scene.add(tg);
        _towerGuards.push(tg);
        _allGuardsList.push(tg);
      }
    }

    // ── GATHERING POINT BoxGeometry (0xFFCC00) ────────────────────────────────
    _gatherPoint = _box(4, 0.2, 4, 0xFFCC00);
    _gatherPoint.position.set(0, 0.1, 5);
    _scene.add(_gatherPoint);

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x202030, 0.9);
    _scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0x8899AA, 0.7);
    dirLight.position.set(10, 30, 10);
    _scene.add(dirLight);
  }

  function _buildFence() {
    // Perimeter 60x60, LineSegments, exit gap at north (z=-30, x from -5 to 5)
    var pts = [];
    var h0 = 0, h1 = 3;
    var step = 5;

    // South wall x: -30 to 30 at z=30
    for (var x = -30; x < 30; x += step) {
      pts.push({ x: x, y: h0, z: 30 }); pts.push({ x: x + step, y: h0, z: 30 });
      pts.push({ x: x, y: h1, z: 30 }); pts.push({ x: x + step, y: h1, z: 30 });
      pts.push({ x: x, y: h0, z: 30 }); pts.push({ x: x, y: h1, z: 30 });
    }
    pts.push({ x: 30, y: h0, z: 30 }); pts.push({ x: 30, y: h1, z: 30 });

    // East wall z: 30 to -30 at x=30
    for (var z = 30; z > -30; z -= step) {
      pts.push({ x: 30, y: h0, z: z }); pts.push({ x: 30, y: h0, z: z - step });
      pts.push({ x: 30, y: h1, z: z }); pts.push({ x: 30, y: h1, z: z - step });
      pts.push({ x: 30, y: h0, z: z }); pts.push({ x: 30, y: h1, z: z });
    }

    // North wall x: 30 to 5 (gap from -5 to 5)
    for (var xn = 30; xn > 5; xn -= step) {
      pts.push({ x: xn, y: h0, z: -30 }); pts.push({ x: xn - step, y: h0, z: -30 });
      pts.push({ x: xn, y: h1, z: -30 }); pts.push({ x: xn - step, y: h1, z: -30 });
      pts.push({ x: xn, y: h0, z: -30 }); pts.push({ x: xn, y: h1, z: -30 });
    }
    // North wall x: -5 to -30
    for (var xn2 = -5; xn2 > -30; xn2 -= step) {
      pts.push({ x: xn2, y: h0, z: -30 }); pts.push({ x: xn2 - step, y: h0, z: -30 });
      pts.push({ x: xn2, y: h1, z: -30 }); pts.push({ x: xn2 - step, y: h1, z: -30 });
      pts.push({ x: xn2, y: h0, z: -30 }); pts.push({ x: xn2, y: h1, z: -30 });
    }
    pts.push({ x: -30, y: h0, z: -30 }); pts.push({ x: -30, y: h1, z: -30 });

    // West wall z: -30 to 30 at x=-30
    for (var zw = -30; zw < 30; zw += step) {
      pts.push({ x: -30, y: h0, z: zw }); pts.push({ x: -30, y: h0, z: zw + step });
      pts.push({ x: -30, y: h1, z: zw }); pts.push({ x: -30, y: h1, z: zw + step });
      pts.push({ x: -30, y: h0, z: zw }); pts.push({ x: -30, y: h1, z: zw });
    }

    var fence = _lineSegs(pts, 0x888888);
    fence.userData = { type: 'fence' };
    _scene.add(fence);

    // Gate BoxGeometry at north gap
    _gateMesh = _box(10, 3, 0.3, 0x666666);
    _gateMesh.position.set(0, 1.5, -30);
    _gateMesh.userData = { type: 'gate' };
    _scene.add(_gateMesh);
  }

  function _buildCellsA() {
    // 20 cells in block A (5 cols × 4 rows), with bars LineSegments
    // 25 inmates total across cells A
    var startX = -28, startZ = -28;
    var cellW = 3, cellD = 3;
    var inmatePer = Math.ceil(25 / 20);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 5; col++) {
        var ci = row * 5 + col;
        var cx = startX + col * 6;
        var cz = startZ + row * 3.5;

        // Cell walls
        var cell = _box(cellW, 2.5, cellD, 0x444444);
        cell.position.set(cx, 1.25, cz);
        _scene.add(cell);

        // Bars (LineSegments)
        var barPts = [];
        for (var b = 0; b < 4; b++) {
          var bx = cx - 1.5 + b * 1.0;
          barPts.push({ x: bx, y: 0, z: cz + 1.5 });
          barPts.push({ x: bx, y: 2.5, z: cz + 1.5 });
        }
        var bars = _lineSegs(barPts, 0x999999);
        _scene.add(bars);

        // Lock BoxGeometry (0x888888)
        var lock = _box(0.3, 0.3, 0.15, 0x888888);
        lock.position.set(cx + 0.5, 1.2, cz + 1.5);
        lock.userData = {
          type: 'cellLock',
          block: 'A',
          cellIndex: ci,
          broken: false,
          cx: cx,
          cz: cz
        };
        _scene.add(lock);
        _cellLocksA.push(lock);

        // Inmates inside (hidden until freed, max 2 per cell to make 25)
        var numInmates = (ci < 5) ? 2 : 1; // 5 cells × 2 + 15 cells × 1 = 25
        for (var im = 0; im < numInmates; im++) {
          var inmate = _box(0.5, 1.4, 0.5, 0xAA8844);
          inmate.position.set(cx + (im * 0.6 - 0.3), 0.7, cz - 0.5);
          inmate.userData = {
            type: 'inmate',
            free: false,
            following: false,
            waitingAtGather: false,
            escaped: false,
            block: 'A',
            cellIndex: ci,
            scatterDir: { x: 0, z: 0 },
            scatterTimer: 0,
            followOffset: { x: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 5 },
            speed: 5 + Math.random() * 2
          };
          inmate.visible = true;
          _scene.add(inmate);
          _inmates.push(inmate);
        }
      }
    }
  }

  function _buildCellsB() {
    // Block B — 25 inmates, locked, need master key
    var startX = -28, startZ = 12;
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 5; col++) {
        var ci = row * 5 + col;
        var cx = startX + col * 6;
        var cz = startZ + row * 3.5;

        var cell = _box(3, 2.5, 3, 0x444444);
        cell.position.set(cx, 1.25, cz);
        _scene.add(cell);

        // Bars
        var barPts = [];
        for (var b = 0; b < 4; b++) {
          var bx = cx - 1.5 + b * 1.0;
          barPts.push({ x: bx, y: 0, z: cz + 1.5 });
          barPts.push({ x: bx, y: 2.5, z: cz + 1.5 });
        }
        _scene.add(_lineSegs(barPts, 0x999999));

        // Inmates
        var numInmates = (ci < 5) ? 2 : 1;
        for (var im = 0; im < numInmates; im++) {
          var inmate = _box(0.5, 1.4, 0.5, 0x886644);
          inmate.position.set(cx + (im * 0.6 - 0.3), 0.7, cz - 0.5);
          inmate.userData = {
            type: 'inmate',
            free: false,
            following: false,
            waitingAtGather: false,
            escaped: false,
            block: 'B',
            cellIndex: ci,
            scatterDir: { x: 0, z: 0 },
            scatterTimer: 0,
            followOffset: { x: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 5 },
            speed: 5 + Math.random() * 2
          };
          _scene.add(inmate);
          _inmates.push(inmate);
        }
      }
    }

    // Single master lock for block B (in center)
    _cellLocksB = _box(0.5, 0.5, 0.3, 0xFFAA00);
    _cellLocksB.position.set(-15, 2, 10);
    _cellLocksB.userData = { type: 'masterLock', broken: false };
    _scene.add(_cellLocksB);
  }

  function _buildWardenOffice(ox, oy, oz) {
    // Warden NPC
    _warden = _box(1, 1.8, 1, 0x223344);
    _warden.position.set(ox + 2, oy + 0.9, oz);
    _warden.userData = {
      type: 'warden',
      hp: 250,
      dead: false,
      patrolAngle: 0,
      baseX: ox + 2,
      baseZ: oz,
      alertTimer: 0,
      calledBackup: false
    };
    _scene.add(_warden);

    // Master key BoxGeometry (0xFFCC00)
    var mk = _box(0.4, 0.15, 0.7, 0xFFCC00);
    mk.position.set(ox - 2, oy + 1.2, oz + 1);
    mk.userData = { type: 'pickup', name: 'masterkey', count: 1 };
    _scene.add(mk);

    // Guard uniform pickup
    var uni = _box(0.7, 0.9, 0.3, 0x334455);
    uni.position.set(ox + 2, oy + 1.3, oz + 2);
    uni.userData = { type: 'pickup', name: 'uniform', count: 1 };
    _scene.add(uni);
  }

  function _buildPowerStation(px, py, pz) {
    // 3 generators BoxGeometry (0x555533)
    var genOffsets = [{ x: -2, z: 0 }, { x: 0, z: 0 }, { x: 2, z: 0 }];
    for (var gi = 0; gi < 3; gi++) {
      var gen = _box(1.2, 1.5, 1.2, 0x555533);
      gen.position.set(px + genOffsets[gi].x, py - 0.25, pz + genOffsets[gi].z);
      gen.userData = { type: 'generator', destroyed: false, index: gi };
      _scene.add(gen);
      _generators.push(gen);
    }

    // Rope pickup on rooftop shortcut
    var rope = _box(0.4, 0.1, 0.4, 0x886633);
    rope.position.set(px, py + 2.1, pz - 2);
    rope.userData = { type: 'pickup', name: 'rope', count: 1 };
    _scene.add(rope);
  }

  function _buildGuards() {
    // 15 patrol guards BoxGeometry (0x334455): 80HP
    var routes = [
      [{ x: -20, z: 5 }, { x: 10, z: 5 }, { x: 10, z: -5 }, { x: -20, z: -5 }],
      [{ x: -25, z: -10 }, { x: -10, z: -10 }, { x: -10, z: -25 }, { x: -25, z: -25 }],
      [{ x: -10, z: -25 }, { x: 5, z: -25 }, { x: 5, z: -15 }, { x: -10, z: -15 }],
      [{ x: 5, z: -25 }, { x: 20, z: -25 }, { x: 20, z: -15 }, { x: 5, z: -15 }],
      [{ x: 15, z: -15 }, { x: 28, z: -15 }, { x: 28, z: -5 }, { x: 15, z: -5 }],
      [{ x: 15, z: -5 }, { x: 28, z: -5 }, { x: 28, z: 10 }, { x: 15, z: 10 }],
      [{ x: 5, z: 5 }, { x: 20, z: 5 }, { x: 20, z: 25 }, { x: 5, z: 25 }],
      [{ x: -10, z: 10 }, { x: 5, z: 10 }, { x: 5, z: 25 }, { x: -10, z: 25 }],
      [{ x: -25, z: 5 }, { x: -10, z: 5 }, { x: -10, z: 25 }, { x: -25, z: 25 }],
      [{ x: -28, z: -15 }, { x: -15, z: -15 }, { x: -15, z: -28 }, { x: -28, z: -28 }],
      [{ x: 0, z: -10 }, { x: 10, z: -10 }, { x: 10, z: -20 }, { x: 0, z: -20 }],
      [{ x: -5, z: 0 }, { x: 15, z: 0 }, { x: 15, z: 8 }, { x: -5, z: 8 }],
      [{ x: -20, z: 20 }, { x: 0, z: 20 }, { x: 0, z: 28 }, { x: -20, z: 28 }],
      [{ x: 0, z: 20 }, { x: 25, z: 20 }, { x: 25, z: 28 }, { x: 0, z: 28 }],
      [{ x: 20, z: 0 }, { x: 28, z: 0 }, { x: 28, z: 15 }, { x: 20, z: 15 }]
    ];

    for (var i = 0; i < 15; i++) {
      var sp = routes[i][0];
      var g = _box(0.8, 1.8, 0.8, 0x334455);
      g.position.set(sp.x, 0.9, sp.z);
      g.userData = {
        type: 'guard',
        hp: 80,
        dead: false,
        route: routes[i],
        routeIdx: 0,
        speed: 4,
        alertTimer: 0,
        alerted: false,
        alertPos: null,
        hasRadio: true,
        batonDamage: 40,
        batonTimer: 0,
        extraGuard: false
      };
      _scene.add(g);
      _guards.push(g);
      _allGuardsList.push(g);
    }
  }

  function _buildPlayer() {
    _player = _cyl(0.4, 0.4, 1.6, 8, 0x2244CC);
    _player.position.set(0, 0.8, 20);
    _player.userData = { type: 'player' };
    _scene.add(_player);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    _hud = document.createElement('div');
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 14px',
      'border:1px solid #00FF88',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    _promptEl = document.createElement('div');
    _promptEl.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FFFF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 14px',
      'border:1px solid #FFFF44',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function _updateHUD() {
    if (!_hud) return;
    var mins = Math.floor(_timeRemaining / 60);
    var secs = Math.floor(_timeRemaining % 60);
    var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;
    _hud.textContent =
      'JAILBREAK' +
      ' [INMATES ESCAPED: ' + _escapedCount + '/50]' +
      ' [FOLLOWING: ' + _followingInmates.length + ']' +
      ' [LOCKDOWN: ' + timeStr + ']' +
      ' [ALARMS: ' + _alarmCount + '/3]' +
      ' | POWER: ' + (_powerOn ? 'ON' : 'OFF') +
      ' FENCE: ' + (_fenceElectrified ? 'HOT' : 'OFF') +
      ' HP: ' + Math.max(0, Math.round(_playerHP));
  }

  function _showPrompt(text, dur) {
    if (!_promptEl) return;
    _promptEl.textContent = text;
    _promptEl.style.display = 'block';
    _promptTimer = dur || 3;
  }

  // ── Alarm escalation ──────────────────────────────────────────────────────────
  function _triggerAlarm(level) {
    if (_alarmCount >= 3) return;
    if (level <= _alarmCount) return;
    _alarmCount = level;
    _beep(440, 0.5, 0.2, 'sawtooth');

    if (level === 1) {
      _showPrompt('!! ALARM 1: 3 extra guards called in — gates locking !!', 5);
      _spawnExtraGuards(3, 1);
    }
    if (level === 2) {
      _showPrompt('!! ALARM 2: 6 extra guards, yard floodlights ON !!', 5);
      _spawnExtraGuards(6, 2);
      _activateFloodlights();
    }
    if (level === 3) {
      _showPrompt('!! ALARM 3: FULL LOCKDOWN — helicopter active !!', 6);
      _spawnExtraGuards(6, 3);
      _activateHelicopter();
    }

    // Alert all living guards
    for (var i = 0; i < _allGuardsList.length; i++) {
      var g = _allGuardsList[i];
      if (!g.userData.dead) {
        g.userData.alerted = true;
        g.userData.alertPos = { x: _player.position.x, z: _player.position.z };
        g.userData.alertTimer = 30;
      }
    }
  }

  function _spawnExtraGuards(count, alarmLevel) {
    if (_extraGuardsSpawned[alarmLevel - 1] > 0) return;
    _extraGuardsSpawned[alarmLevel - 1] = count;
    var spawnPts = [
      { x: -28, z: 28 }, { x: 28, z: 28 }, { x: 28, z: -28 },
      { x: -28, z: -28 }, { x: 0, z: 28 }, { x: 28, z: 0 }
    ];
    for (var i = 0; i < count; i++) {
      var sp = spawnPts[i % spawnPts.length];
      var g = _box(0.8, 1.8, 0.8, 0x334455);
      g.position.set(sp.x + (Math.random() - 0.5) * 4, 0.9, sp.z + (Math.random() - 0.5) * 4);
      g.userData = {
        type: 'guard',
        hp: 80,
        dead: false,
        route: [sp, { x: -sp.x * 0.5, z: -sp.z * 0.5 }],
        routeIdx: 0,
        speed: 5,
        alertTimer: 60,
        alerted: true,
        alertPos: { x: _player.position.x, z: _player.position.z },
        hasRadio: true,
        batonDamage: 40,
        batonTimer: 0,
        extraGuard: true
      };
      _scene.add(g);
      _guards.push(g);
      _allGuardsList.push(g);
    }
  }

  function _activateFloodlights() {
    var floodPositions = [
      { x: -20, z: -20 }, { x: 0, z: -20 }, { x: 20, z: -20 },
      { x: -20, z: 0 },   { x: 20, z: 0 },
      { x: -20, z: 20 },  { x: 0, z: 20 },  { x: 20, z: 20 }
    ];
    for (var fi = 0; fi < 8; fi++) {
      var fl = new THREE.PointLight(0xFFFFAA, 2.0, 25);
      fl.position.set(floodPositions[fi].x, 8, floodPositions[fi].z);
      _scene.add(fl);
      _floodlights.push(fl);
    }
    _stealthBonus = 0.6; // guards see farther in floodlight
  }

  function _activateHelicopter() {
    if (_helicopterActive) return;
    _helicopterActive = true;
    _helicopter = _box(3, 1, 2, 0x334455);
    _helicopter.position.set(0, 20, 0);
    _helicopter.userData = {
      type: 'helicopter',
      angle: 0,
      orbitRadius: 20,
      speed: 0.5
    };
    _scene.add(_helicopter);

    _helicopterSearchlight = new THREE.PointLight(0xFFFFAA, 3.0, 30);
    _helicopterSearchlight.position.copy(_helicopter.position);
    _helicopterSearchlight.position.y = 2;
    _scene.add(_helicopterSearchlight);
  }

  // ── Power station ─────────────────────────────────────────────────────────────
  function _destroyGenerator(gen) {
    if (gen.userData.destroyed) return;
    gen.userData.destroyed = true;
    gen.material.color.setHex(0x333322);
    _generatorsDestroyed++;
    _beep(200, 0.4, 0.2, 'sawtooth');
    _showPrompt('Generator destroyed! (' + _generatorsDestroyed + '/3)', 2);

    if (_generatorsDestroyed >= 3) {
      _powerOn = false;
      _fenceElectrified = false;
      _stealthBonus = Math.min(_stealthBonus, 0.75); // dim lights = stealth bonus
      // Dim scene
      _scene.fog = new THREE.Fog(0x040608, 30, 80);
      var ambients = [];
      _scene.traverse(function (obj) {
        if (obj instanceof THREE.AmbientLight) ambients.push(obj);
      });
      for (var ai = 0; ai < ambients.length; ai++) {
        ambients[ai].intensity = 0.25;
      }
      _showPrompt('POWER DOWN! Fence OFF, lights dimmed — stealth bonus active!', 5);
      _beep(110, 1.0, 0.25, 'sine');
    }
  }

  // ── Inmate management ─────────────────────────────────────────────────────────
  function _freeInmatesInCell(cellIndex, block) {
    var count = 0;
    for (var i = 0; i < _inmates.length; i++) {
      var inmate = _inmates[i];
      if (inmate.userData.block === block && inmate.userData.cellIndex === cellIndex && !inmate.userData.free) {
        inmate.userData.free = true;
        count++;
        // Try to add to following group
        if (_followingInmates.length < 15) {
          inmate.userData.following = true;
          _followingInmates.push(inmate);
        } else {
          inmate.userData.waitingAtGather = true;
          // Move toward gather point
          inmate.position.set(
            _gatherPoint.position.x + (Math.random() - 0.5) * 4,
            0.7,
            _gatherPoint.position.z + (Math.random() - 0.5) * 4
          );
        }
      }
    }
    return count;
  }

  function _freeAllBlockB() {
    var count = 0;
    for (var i = 0; i < _inmates.length; i++) {
      var inmate = _inmates[i];
      if (inmate.userData.block === 'B' && !inmate.userData.free) {
        inmate.userData.free = true;
        count++;
        if (_followingInmates.length < 15) {
          inmate.userData.following = true;
          _followingInmates.push(inmate);
        } else {
          inmate.userData.waitingAtGather = true;
          inmate.position.set(
            _gatherPoint.position.x + (Math.random() - 0.5) * 4,
            0.7,
            _gatherPoint.position.z + (Math.random() - 0.5) * 4
          );
        }
      }
    }
    return count;
  }

  function _scatterInmates() {
    _inmatesScattered = true;
    _inmateScatterTimer = 10;
    for (var i = 0; i < _followingInmates.length; i++) {
      var inmate = _followingInmates[i];
      var angle = Math.random() * Math.PI * 2;
      inmate.userData.scatterDir = { x: Math.sin(angle), z: Math.cos(angle) };
      inmate.userData.scatterTimer = 10;
      inmate.userData.following = false;
    }
    _followingInmates = [];
    _showPrompt('Guards spotted! Inmates scattering — regroup in 10s!', 4);
  }

  function _regroupInmates() {
    _inmatesScattered = false;
    for (var i = 0; i < _inmates.length; i++) {
      var inmate = _inmates[i];
      if (inmate.userData.free && !inmate.userData.escaped && !inmate.userData.following) {
        if (_followingInmates.length < 15) {
          inmate.userData.following = true;
          inmate.userData.waitingAtGather = false;
          _followingInmates.push(inmate);
        } else {
          inmate.userData.waitingAtGather = true;
        }
      }
    }
    _showPrompt('Inmates regrouped — lead them to freedom!', 3);
  }

  function _updateInmates(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;

    if (_inmatesScattered) {
      _inmateScatterTimer -= dt;
      if (_inmateScatterTimer <= 0) {
        _regroupInmates();
      }
    }

    for (var i = 0; i < _inmates.length; i++) {
      var inmate = _inmates[i];
      if (!inmate.userData.free || inmate.userData.escaped) continue;

      if (inmate.userData.scatterTimer > 0) {
        inmate.userData.scatterTimer -= dt;
        // Move in scatter direction
        inmate.position.x += inmate.userData.scatterDir.x * inmate.userData.speed * dt;
        inmate.position.z += inmate.userData.scatterDir.z * inmate.userData.speed * dt;
        inmate.position.x = Math.max(-35, Math.min(35, inmate.position.x));
        inmate.position.z = Math.max(-35, Math.min(35, inmate.position.z));
        continue;
      }

      if (inmate.userData.following) {
        // Follow player in crowd formation
        var targetX = px + inmate.userData.followOffset.x;
        var targetZ = pz + inmate.userData.followOffset.z;
        var dx = targetX - inmate.position.x;
        var dz = targetZ - inmate.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.5) {
          inmate.position.x += (dx / dist) * inmate.userData.speed * dt;
          inmate.position.z += (dz / dist) * inmate.userData.speed * dt;
        }
      } else if (inmate.userData.waitingAtGather) {
        // Stay near gather point
        var gx = _gatherPoint.position.x + (Math.random() - 0.5) * 0.1;
        var gz = _gatherPoint.position.z + (Math.random() - 0.5) * 0.1;
        var dgx = gx - inmate.position.x;
        var dgz = gz - inmate.position.z;
        var dg = Math.sqrt(dgx * dgx + dgz * dgz);
        if (dg > 1) {
          inmate.position.x += (dgx / dg) * inmate.userData.speed * 0.5 * dt;
          inmate.position.z += (dgz / dg) * inmate.userData.speed * 0.5 * dt;
        }
        // Try to join following group if there's room
        if (_followingInmates.length < 15 && !_inmatesScattered) {
          inmate.userData.waitingAtGather = false;
          inmate.userData.following = true;
          _followingInmates.push(inmate);
        }
      }

      // Check if inmate reaches north gap (freedom zone)
      if (inmate.position.z < -31 && Math.abs(inmate.position.x) < 7 && _gateCut) {
        inmate.userData.escaped = true;
        inmate.userData.following = false;
        _escapedCount++;
        // Remove from following list
        for (var fi = _followingInmates.length - 1; fi >= 0; fi--) {
          if (_followingInmates[fi] === inmate) {
            _followingInmates.splice(fi, 1);
          }
        }
        inmate.visible = false;
        _beep(880, 0.08, 0.08);
        if (_escapedCount >= 50) {
          _triggerWin();
        }
      }

      // Fence electrocution for inmates (not player — player is checked separately)
      if (_fenceElectrified) {
        var nearFence = (Math.abs(inmate.position.x) > 29 || Math.abs(inmate.position.z) > 29);
        if (nearFence) {
          inmate.position.x *= 0.95;
          inmate.position.z *= 0.95;
        }
      }
    }
  }

  // ── Shooting ──────────────────────────────────────────────────────────────────
  function _shoot() {
    if (!_canShoot) return;
    _canShoot = false;
    _shootCooldown = 0.25;

    // Direction: toward crosshair (use player facing for simplicity)
    var angle = _player.rotation.y;
    var bullet = _sphere(0.12, 4, 0xFFFF44);
    bullet.position.set(
      _player.position.x + Math.sin(angle) * 1.2,
      1.0,
      _player.position.z + Math.cos(angle) * 1.2
    );
    bullet.userData = {
      type: 'bullet',
      dir: { x: Math.sin(angle), z: Math.cos(angle) },
      speed: 30,
      life: 1.5,
      damage: 35
    };
    _scene.add(bullet);
    _bullets.push(bullet);
    _beep(900, 0.05, 0.15, 'square');
  }

  function _shootShiv() {
    if (_shivCount <= 0) return;
    _shivCount--;
    // Shiv: silent, melee only — damage nearby guard
    for (var i = 0; i < _allGuardsList.length; i++) {
      var g = _allGuardsList[i];
      if (g.userData.dead) continue;
      var d = _dist2(_player.position, g.position);
      if (d < 2.5) {
        g.userData.hp -= 60;
        g.material.color.setHex(0x884444);
        if (g.userData.hp <= 0) {
          _killGuard(g, true); // silent = no radio call
        }
        _beep(200, 0.1, 0.08, 'sine');
        break;
      }
    }
  }

  function _throwTearGas() {
    if (_tearGasCount <= 0) return;
    _tearGasCount--;
    var angle = _player.rotation.y;
    var tg = _cyl(0.15, 0.15, 0.4, 6, 0x44AA44);
    tg.position.set(
      _player.position.x + Math.sin(angle) * 2,
      0.5,
      _player.position.z + Math.cos(angle) * 2
    );
    tg.userData = {
      type: 'teargas',
      life: 10,
      radius: 6,
      distracted: []
    };
    _scene.add(tg);
    _tearGasObjects.push(tg);
    _beep(300, 0.2, 0.1, 'sine');
    _showPrompt('Tear gas deployed — guards distracted 10s!', 2);
  }

  function _updateBullets(dt) {
    for (var i = _bullets.length - 1; i >= 0; i--) {
      var b = _bullets[i];
      b.position.x += b.userData.dir.x * b.userData.speed * dt;
      b.position.z += b.userData.dir.z * b.userData.speed * dt;
      b.userData.life -= dt;

      if (b.userData.life <= 0) {
        _scene.remove(b);
        _bullets.splice(i, 1);
        continue;
      }

      // Hit guards
      var hit = false;
      for (var gi = 0; gi < _allGuardsList.length; gi++) {
        var g = _allGuardsList[gi];
        if (g.userData.dead) continue;
        if (_dist3(b.position, g.position) < 1.2) {
          g.userData.hp -= b.userData.damage;
          g.material.color.setHex(0x884444);
          if (g.userData.hp <= 0) {
            _killGuard(g, false);
          } else {
            // Radio call = alarm
            if (g.userData.hasRadio) _triggerAlarm(Math.min(3, _alarmCount + 1));
          }
          _scene.remove(b);
          _bullets.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Hit warden
      if (_warden && !_warden.userData.dead) {
        if (_dist3(b.position, _warden.position) < 1.2) {
          _warden.userData.hp -= b.userData.damage;
          _warden.material.color.setHex(0x664422);
          if (_warden.userData.hp <= 0) {
            _warden.userData.dead = true;
            _wardenDead = true;
            _warden.rotation.z = Math.PI / 2;
            _showPrompt('Warden down! No helicopter backup!', 4);
            _beep(150, 0.6, 0.2, 'sawtooth');
          } else {
            _triggerAlarm(Math.min(3, _alarmCount + 1));
          }
          _scene.remove(b);
          _bullets.splice(i, 1);
          continue;
        }
      }

      // Hit generators
      for (var geni = 0; geni < _generators.length; geni++) {
        var gen = _generators[geni];
        if (gen.userData.destroyed) continue;
        if (_dist3(b.position, gen.position) < 1.0) {
          _destroyGenerator(gen);
          _scene.remove(b);
          _bullets.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Hit cell locks (block A)
      for (var li = 0; li < _cellLocksA.length; li++) {
        var lock = _cellLocksA[li];
        if (lock.userData.broken) continue;
        if (_dist3(b.position, lock.position) < 0.8) {
          lock.userData.broken = true;
          _scene.remove(lock);
          _cellLocksA.splice(li, 1);
          var freed = _freeInmatesInCell(lock.userData.cellIndex, 'A');
          _showPrompt('Cell A-' + (lock.userData.cellIndex + 1) + ' open! ' + freed + ' inmates freed!', 3);
          _scene.remove(b);
          _bullets.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Hit block B master lock
      if (_cellLocksB && !_cellLocksB.userData.broken) {
        if (_dist3(b.position, _cellLocksB.position) < 1.0) {
          if (_hasMasterKey) {
            _cellLocksB.userData.broken = true;
            _scene.remove(_cellLocksB);
            _cellLocksB = null;
            _blockBUnlocked = true;
            var freedB = _freeAllBlockB();
            _showPrompt('Block B UNLOCKED! ' + freedB + ' inmates freed!', 4);
            _beep(660, 0.3, 0.2);
          } else {
            _showPrompt('Need master key to open Block B! Check warden\'s office.', 3);
          }
          _scene.remove(b);
          _bullets.splice(i, 1);
        }
      }
    }
  }

  function _updateTearGas(dt) {
    for (var i = _tearGasObjects.length - 1; i >= 0; i--) {
      var tg = _tearGasObjects[i];
      tg.userData.life -= dt;
      // Pulse visual
      tg.scale.set(
        1 + 0.3 * Math.sin(Date.now() * 0.01),
        1,
        1 + 0.3 * Math.sin(Date.now() * 0.01)
      );

      if (tg.userData.life <= 0) {
        // Undistracts guards
        for (var gi = 0; gi < tg.userData.distracted.length; gi++) {
          var g = tg.userData.distracted[gi];
          if (!g.userData.dead) {
            g.userData.distracted = false;
          }
        }
        _scene.remove(tg);
        _tearGasObjects.splice(i, 1);
        continue;
      }

      // Distract nearby guards
      for (var gj = 0; gj < _allGuardsList.length; gj++) {
        var g2 = _allGuardsList[gj];
        if (g2.userData.dead || g2.userData.distracted) continue;
        if (_dist2(tg.position, g2.position) < tg.userData.radius) {
          g2.userData.distracted = true;
          g2.userData.distractedTimer = 10;
          tg.userData.distracted.push(g2);
        }
      }
    }
  }

  function _killGuard(g, silent) {
    g.userData.dead = true;
    g.userData.hp = 0;
    g.rotation.z = Math.PI / 2;
    g.position.y = 0.4;
    g.material.color.setHex(0x552222);
    if (!silent && g.userData.hasRadio) {
      _triggerAlarm(Math.min(3, _alarmCount + 1));
    }
    // Scatter inmates on guard death if they were nearby
    if (_dist2(_player.position, g.position) < 8 && !silent) {
      if (_followingInmates.length > 0) {
        _scatterInmates();
      }
    }
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;

    for (var i = 0; i < _allGuardsList.length; i++) {
      var g = _allGuardsList[i];
      if (g.userData.dead) continue;

      var gx = g.position.x, gz = g.position.z;
      var dx = px - gx, dz = pz - gz;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Distracted by tear gas
      if (g.userData.distracted) {
        g.userData.distractedTimer -= dt;
        if (g.userData.distractedTimer <= 0) {
          g.userData.distracted = false;
        }
        // Wander
        g.position.x += Math.sin(Date.now() * 0.001 + i) * 2 * dt;
        g.position.z += Math.cos(Date.now() * 0.001 + i) * 2 * dt;
        continue;
      }

      // Alert cooldown
      if (g.userData.alertTimer > 0) {
        g.userData.alertTimer -= dt;
        if (g.userData.alertTimer <= 0) {
          g.userData.alerted = false;
          g.userData.alertPos = null;
        }
      }

      // Movement
      if (g.userData.alerted && g.userData.alertPos) {
        // Chase player last known
        var tgt = g.userData.alertPos;
        var tdx = tgt.x - gx, tdz = tgt.z - gz;
        var td = Math.sqrt(tdx * tdx + tdz * tdz);
        if (td > 1) {
          var spd = (g.userData.type === 'towerGuard') ? 0 : g.userData.speed * 1.5;
          g.position.x += (tdx / td) * spd * dt;
          g.position.z += (tdz / td) * spd * dt;
          g.rotation.y = Math.atan2(tdx, tdz);
        }
        // Melee attack if close
        if (dist < 1.8 && g.userData.type !== 'towerGuard') {
          g.userData.batonTimer -= dt;
          if (g.userData.batonTimer <= 0) {
            _playerHP -= g.userData.batonDamage;
            g.userData.batonTimer = 1.5;
            _beep(150, 0.15, 0.2, 'sawtooth');
            if (_playerHP <= 0) _triggerLose('You were subdued by guards!');
          }
        }
      } else {
        // Patrol
        if (g.userData.type === 'towerGuard') {
          // Scan in place
          g.userData.scanAngle += g.userData.scanSpeed * dt;
          g.rotation.y = g.userData.scanAngle;
        } else {
          var route = g.userData.route;
          if (route && route.length > 0) {
            var rtgt = route[g.userData.routeIdx];
            var rdx = rtgt.x - gx, rdz = rtgt.z - gz;
            var rd = Math.sqrt(rdx * rdx + rdz * rdz);
            if (rd < 0.8) {
              g.userData.routeIdx = (g.userData.routeIdx + 1) % route.length;
            } else {
              g.position.x += (rdx / rd) * g.userData.speed * dt;
              g.position.z += (rdz / rd) * g.userData.speed * dt;
              g.rotation.y = Math.atan2(rdx, rdz);
            }
          }
        }
      }

      // Detection
      var range = (g.userData.type === 'towerGuard') ? g.userData.detectionRange : 12;
      range *= _stealthBonus;

      // Uniform disguise
      if (_uniformActive) range *= 0.25;

      // Line-of-sight via facing direction
      var fwd = { x: Math.sin(g.rotation.y), z: Math.cos(g.rotation.y) };
      var toPlayer = dist > 0.01 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
      var dot = fwd.x * toPlayer.x + fwd.z * toPlayer.z;
      var fovThresh = Math.cos(Math.PI / 3); // 60 deg FOV
      var detected = (dot > fovThresh && dist < range) || (dist < 2.5 && !_uniformActive);

      if (detected) {
        g.userData.alertTimer = 20;
        g.userData.alerted = true;
        g.userData.alertPos = { x: px, z: pz };

        // Uniform blown if too close
        if (_uniformActive && dist < 2.5) {
          _uniformActive = false;
          _showPrompt('DISGUISE BLOWN — too close to guard!', 3);
          _triggerAlarm(Math.min(3, _alarmCount + 1));
        }

        if (!_uniformActive && !g.userData.alerted) {
          _triggerAlarm(Math.min(3, _alarmCount + 1));
        }

        // Scatter inmates on detection
        if (_followingInmates.length > 0 && !_inmatesScattered) {
          _scatterInmates();
        }
      }
    }

    // Warden AI
    if (_warden && !_warden.userData.dead) {
      _warden.userData.patrolAngle += dt * 0.5;
      _warden.position.x = _warden.userData.baseX + Math.cos(_warden.userData.patrolAngle) * 3;
      _warden.position.z = _warden.userData.baseZ + Math.sin(_warden.userData.patrolAngle) * 3;
      _warden.rotation.y = _warden.userData.patrolAngle + Math.PI / 2;

      // Warden helicopter call
      if (!_warden.userData.calledBackup) {
        _wardenHelicopterTimer -= dt;
        if (_wardenHelicopterTimer <= 0) {
          _warden.userData.calledBackup = true;
          _triggerAlarm(3);
          _showPrompt('Warden called helicopter backup!', 5);
        }
      }
    }

    // Helicopter
    if (_helicopterActive && _helicopter) {
      _helicopter.userData.angle += _helicopter.userData.speed * dt;
      var ha = _helicopter.userData.angle;
      var hr = _helicopter.userData.orbitRadius;
      _helicopter.position.x = Math.cos(ha) * hr;
      _helicopter.position.z = Math.sin(ha) * hr;
      _helicopter.position.y = 18 + Math.sin(ha * 2) * 2;

      if (_helicopterSearchlight) {
        _helicopterSearchlight.position.set(
          _helicopter.position.x,
          _helicopter.position.y - 4,
          _helicopter.position.z
        );
      }

      // Helicopter detection
      var hd = _dist2(_helicopter.position, _player.position);
      if (hd < 15) {
        if (_followingInmates.length > 0 && !_inmatesScattered) {
          _scatterInmates();
        }
        // Instant alert to all guards
        for (var ghi = 0; ghi < _allGuardsList.length; ghi++) {
          var gh = _allGuardsList[ghi];
          if (!gh.userData.dead) {
            gh.userData.alerted = true;
            gh.userData.alertPos = { x: px, z: pz };
            gh.userData.alertTimer = 15;
          }
        }
      }
    }
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    if (_gameOver || _gameWon) return;

    var mx = 0, mz = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) mz -= 1;
    if (_keysDown['KeyS'] || _keysDown['ArrowDown']) mz += 1;
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) mx -= 1;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) mx += 1;
    if (_keysDown['KeyQ']) _cameraAngle -= 1.5 * dt;
    if (_keysDown['KeyZ']) _cameraAngle += 1.5 * dt;

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      mx /= len; mz /= len;
      var ca = _cameraAngle;
      var rx = mx * Math.cos(ca) + mz * Math.sin(ca);
      var rz = -mx * Math.sin(ca) + mz * Math.cos(ca);
      _player.position.x += rx * _playerSpeed * dt;
      _player.position.z += rz * _playerSpeed * dt;
      _player.rotation.y = Math.atan2(rx, rz);
    }

    // Clamp to world bounds
    _player.position.x = Math.max(-34, Math.min(34, _player.position.x));
    _player.position.z = Math.max(-34, Math.min(34, _player.position.z));

    // Electrified fence damage
    if (_fenceElectrified) {
      var nearFenceX = Math.abs(_player.position.x) > 29;
      var nearFenceZ = Math.abs(_player.position.z) > 29;
      if (nearFenceX || nearFenceZ) {
        _playerHP -= 20 * dt;
        _beep(50 + Math.random() * 100, 0.05, 0.15, 'sawtooth');
        if (_playerHP <= 0) _triggerLose('Electrocuted by the fence!');
      }
    }

    // Shoot cooldown
    if (!_canShoot) {
      _shootCooldown -= dt;
      if (_shootCooldown <= 0) _canShoot = true;
    }

    // Uniform timer
    if (_uniformActive) {
      _uniformTimer -= dt;
      if (_uniformTimer <= 0) {
        _uniformActive = false;
        _player.material.color.setHex(0x2244CC);
        _showPrompt('Disguise expired!', 3);
      }
    }

    // Rope grapple
    if (_ropeActive) {
      _ropeTimer -= dt;
      if (_ropeTimer <= 0) {
        _ropeActive = false;
        _onRoof = true;
        _player.position.y = 4.5;
        _showPrompt('On roof — shortcut to power station!', 3);
      }
    }

    // Camera follow
    _camera.position.x = _player.position.x + Math.sin(_cameraAngle) * _cameraDistance;
    _camera.position.z = _player.position.z + Math.cos(_cameraAngle) * _cameraDistance;
    _camera.position.y = _cameraHeight + (_onRoof ? 3 : 0);
    _camera.lookAt(new THREE.Vector3(_player.position.x, 1, _player.position.z));
  }

  // ── Interactions ──────────────────────────────────────────────────────────────
  function _checkInteractions() {
    var px = _player.position.x, pz = _player.position.z;
    var ePressed = _keysDown['_e_pressed'];
    _keysDown['_e_pressed'] = false;

    // Pick up items
    _scene.traverse(function (obj) {
      if (!obj.userData || obj.userData.type !== 'pickup') return;
      if (obj.userData.collected) return;
      var d = _dist2({ x: px, z: pz }, obj.position);
      if (d < 2.5) {
        _showPrompt('[E] Pick up ' + obj.userData.name, 0.5);
        if (ePressed) {
          obj.userData.collected = true;
          _scene.remove(obj);
          _beep(660, 0.1, 0.1);

          if (obj.userData.name === 'masterkey') {
            _hasMasterKey = true;
            _showPrompt('Master key obtained! Now open Block B!', 4);
          } else if (obj.userData.name === 'boltcutters') {
            _hasBoltCutters = true;
            _showPrompt('Bolt cutters! Hold E at north gate to cut fence (5s)!', 4);
          } else if (obj.userData.name === 'rope') {
            _hasRope = true;
            _showPrompt('Rope obtained! Press T near wall to grapple!', 3);
          } else if (obj.userData.name === 'teargas') {
            _tearGasCount += obj.userData.count;
            _showPrompt('Tear gas ×' + obj.userData.count + ' (G to throw)', 3);
          } else if (obj.userData.name === 'shiv') {
            _shivCount += obj.userData.count;
            _showPrompt('Shiv ×' + obj.userData.count + ' (V for silent kill)', 3);
          } else if (obj.userData.name === 'uniform') {
            _hasUniform = true;
            _showPrompt('Guard uniform! Press U to wear (60s disguise)', 3);
          } else if (obj.userData.name === 'medkit') {
            _playerHP = Math.min(100, _playerHP + 50);
            _showPrompt('Med kit used! HP restored!', 2);
          }
        }
      }
    });

    // Gate cutting
    var gateDist = _dist2({ x: px, z: pz }, { x: 0, z: -30 });
    if (gateDist < 4 && !_gateCut) {
      if (_hasBoltCutters) {
        _showPrompt('[Hold E] Cut gate (' + Math.round(5 - _cutTimer) + 's)...', 0.5);
        if (ePressed || _keysDown['KeyE']) {
          _cuttingGate = true;
          _cutTimer += 0.05; // approximate per frame
          if (_cutTimer >= 5) {
            _gateCut = true;
            _cuttingGate = false;
            _scene.remove(_gateMesh);
            _showPrompt('GATE CUT! Lead inmates through the north fence gap!', 6);
            _beep(440, 0.3, 0.2);
            _beep(660, 0.3, 0.2);
          }
        } else {
          _cuttingGate = false;
          _cutTimer = Math.max(0, _cutTimer - 0.1);
        }
      } else {
        _showPrompt('Need bolt cutters! Check maintenance shed.', 1);
      }
    } else {
      if (!_keysDown['KeyE']) {
        _cuttingGate = false;
        _cutTimer = Math.max(0, _cutTimer - 0.1);
      }
    }

    // Gate panel override (if alarm 1+)
    if (_alarmCount >= 1 && gateDist < 4 && !_gateCut) {
      _showPrompt('[E] Shoot gate panel to override lock', 0.5);
    }

    // Rope grapple
    if (_hasRope && !_ropeActive && !_onRoof) {
      var wallDist = Math.min(
        _dist2({ x: px, z: pz }, { x: 22, z: 15 }), // power station
        _dist2({ x: px, z: pz }, { x: 22, z: -22 })  // warden office
      );
      if (wallDist < 4) {
        _showPrompt('[T] Grapple rope to roof', 1);
      }
    }

    // Block B master lock interaction
    if (_cellLocksB && !_cellLocksB.userData.broken) {
      var lockDist = _dist2({ x: px, z: pz }, _cellLocksB.position);
      if (lockDist < 4) {
        if (_hasMasterKey) {
          _showPrompt('[E] Use master key to open Block B!', 1);
          if (ePressed) {
            _cellLocksB.userData.broken = true;
            _scene.remove(_cellLocksB);
            _cellLocksB = null;
            _blockBUnlocked = true;
            var freedB2 = _freeAllBlockB();
            _showPrompt('Block B OPEN! ' + freedB2 + ' more inmates freed!', 4);
            _beep(660, 0.3, 0.2);
          }
        } else {
          _showPrompt('Block B needs master key — get it from warden\'s office!', 1);
        }
      }
    }

    // Wear uniform
    if (_hasUniform && !_uniformActive) {
      _showPrompt('[U] Wear guard uniform', 0.5);
    }
  }

  // ── Pickups spin ──────────────────────────────────────────────────────────────
  function _animatePickups(dt) {
    _scene.traverse(function (obj) {
      if (obj.userData && obj.userData.type === 'pickup' && !obj.userData.collected) {
        obj.rotation.y += dt * 1.5;
        obj.position.y = obj.userData._baseY !== undefined
          ? obj.userData._baseY + 0.15 * Math.sin(Date.now() * 0.003)
          : obj.position.y;
        if (obj.userData._baseY === undefined) {
          obj.userData._baseY = obj.position.y;
        }
      }
    });

    // Gather point pulse
    if (_gatherPoint) {
      _gatherPoint.material.color.setHex(
        (_escapedCount >= 30) ? 0x00FF44 : 0xFFCC00
      );
    }
  }

  // ── Win / Lose ────────────────────────────────────────────────────────────────
  function _triggerWin() {
    if (_gameWon || _gameOver) return;
    _gameWon = true;
    _showPrompt(
      'JAILBREAK COMPLETE! All 50 inmates freed! FREEDOM! Press ESC.',
      30
    );
    _beep(440, 0.3, 0.2);
    setTimeout(function () { if (_active) _beep(550, 0.3, 0.2); }, 200);
    setTimeout(function () { if (_active) _beep(660, 0.5, 0.25); }, 400);
    setTimeout(function () { if (_active) _beep(880, 0.6, 0.3); }, 700);
  }

  function _triggerLose(reason) {
    if (_gameWon || _gameOver) return;
    _gameOver = true;
    _showPrompt(
      'JAILBREAK FAILED! ' + reason + ' Escaped: ' + _escapedCount + '/50. ESC to quit.',
      30
    );
    _beep(200, 0.5, 0.2, 'sawtooth');
    setTimeout(function () { if (_active) _beep(150, 0.8, 0.2, 'sawtooth'); }, 400);
  }

  function _checkWinLose() {
    if (_gameOver || _gameWon) return;

    // Win: 30+ escaped before timer hits 0
    if (_escapedCount >= 30 && _timeRemaining > 0) {
      _triggerWin();
      return;
    }

    // Lose: timer hits 0
    if (_timeRemaining <= 0) {
      if (_escapedCount >= 30) {
        _triggerWin();
      } else {
        _triggerLose('Lockdown complete — only ' + _escapedCount + ' escaped!');
      }
      return;
    }

    // Lose: helicopter catches you (in spotlight with alarm 3)
    if (_helicopterActive && _alarmCount >= 3 && _warden && !_warden.userData.dead) {
      if (_helicopter) {
        var hd2 = _dist2(_helicopter.position, _player.position);
        if (hd2 < 6) {
          _triggerLose('Caught in helicopter spotlight!');
        }
      }
    }
  }

  // ── Main loop ─────────────────────────────────────────────────────────────────
  function _loop() {
    if (!_active) return;
    requestAnimationFrame(_loop);

    var dt = Math.min(_clock.getDelta(), 0.05);

    if (!_gameOver && !_gameWon) {
      _timeRemaining -= dt;
    }

    _updatePlayer(dt);
    _updateGuards(dt);
    _updateInmates(dt);
    _updateBullets(dt);
    _updateTearGas(dt);
    _checkInteractions();
    _animatePickups(dt);
    _checkWinLose();
    _updateHUD();

    // Prompt timer
    if (_promptTimer > 0) {
      _promptTimer -= dt;
      if (_promptTimer <= 0 && _promptEl) _promptEl.style.display = 'none';
    }

    _renderer.render(_scene, _camera);
  }

  // ── Key events ────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    if (e.code === 'KeyJ') _jTime = Date.now();
    if (e.code === 'KeyB') _bTime = Date.now();

    if (!_active) {
      if (_keysDown['KeyJ'] && _keysDown['KeyB']) {
        if (Math.abs(_jTime - _bTime) < 400) _init();
      }
      return;
    }

    if (e.code === 'KeyE') _keysDown['_e_pressed'] = true;

    if (e.code === 'Space' || e.code === 'KeyF') {
      e.preventDefault();
      _shoot();
    }

    if (e.code === 'KeyG') _throwTearGas();
    if (e.code === 'KeyV') _shootShiv();

    if (e.code === 'KeyT' && _hasRope && !_ropeActive && !_onRoof) {
      _ropeActive = true;
      _ropeTimer = 2;
      _showPrompt('Grappling to roof...', 2);
    }

    if (e.code === 'KeyU' && _hasUniform && !_uniformActive) {
      _uniformActive = true;
      _uniformTimer = 60;
      _player.material.color.setHex(0x334455);
      _showPrompt('Guard disguise ACTIVE — 60 seconds!', 3);
    }

    if (e.code === 'Escape') reset();
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
  }

  function _onResize() {
    if (!_active) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function _init() {
    if (_active) return;
    _active = true;

    // Reset all state
    _playerHP = 100;
    _timeRemaining = 480;
    _gameOver = false;
    _gameWon = false;
    _alarmCount = 0;
    _extraGuardsSpawned = [0, 0, 0];
    _powerOn = true;
    _generators = [];
    _generatorsDestroyed = 0;
    _fenceElectrified = true;
    _floodlights = [];
    _stealthBonus = 1.0;
    _inmates = [];
    _followingInmates = [];
    _escapedCount = 0;
    _gatherPoint = null;
    _inmateScatterTimer = 0;
    _inmatesScattered = false;
    _cellLocksA = [];
    _cellLocksB = null;
    _blockBUnlocked = false;
    _hasMasterKey = false;
    _hasBoltCutters = false;
    _hasRope = false;
    _tearGasCount = 0;
    _hasUniform = false;
    _uniformActive = false;
    _uniformTimer = 0;
    _shivCount = 0;
    _warden = null;
    _wardenHP = 250;
    _wardenDead = false;
    _wardenHelicopterTimer = 300;
    _helicopter = null;
    _helicopterSearchlight = null;
    _helicopterActive = false;
    _guards = [];
    _towerGuards = [];
    _allGuardsList = [];
    _bullets = [];
    _canShoot = true;
    _shootCooldown = 0;
    _tearGasObjects = [];
    _ropeActive = false;
    _ropeTimer = 0;
    _onRoof = false;
    _gateMesh = null;
    _gateCut = false;
    _cuttingGate = false;
    _cutTimer = 0;
    _keysDown = {};
    _jTime = 0;
    _bTime = 0;
    _cameraAngle = 0;

    _container = document.createElement('div');
    _container.id = 'jailbreak-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x060A0C);
    _scene.fog = new THREE.Fog(0x060A0C, 60, 150);

    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
    _camera.position.set(0, _cameraHeight, 20 + _cameraDistance);

    _clock = new THREE.Clock();

    _initAudio();
    _buildWorld();
    _buildGuards();
    _buildPlayer();
    _buildHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('resize', _onResize);

    _showPrompt(
      'JAILBREAK — WASD:move  F/Space:shoot  E:interact  G:tear gas  V:shiv  T:grapple  U:uniform  Q/Z:camera  ESC:quit',
      12
    );

    _loop();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */
 _init(); }

  function update(dt) { /* external hook — loop is self-driven */ }

  function reset() {
    _active = false;

    window.removeEventListener('keydown', _onKeyDown);
    window.removeEventListener('keyup', _onKeyUp);
    window.removeEventListener('resize', _onResize);

    if (_renderer) { _renderer.dispose(); _renderer = null; }
    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
      _container = null;
    }
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_promptEl && _promptEl.parentNode) {
      _promptEl.parentNode.removeChild(_promptEl);
      _promptEl = null;
    }
    if (_audioCtx) {
      try { _audioCtx.close(); } catch (e) { /* silence */ }
      _audioCtx = null;
    }

    _scene = null;
    _camera = null;
    _clock = null;
    _guards = [];
    _towerGuards = [];
    _allGuardsList = [];
    _inmates = [];
    _followingInmates = [];
    _bullets = [];
    _generators = [];
    _floodlights = [];
    _tearGasObjects = [];
    _cellLocksA = [];
    _cellLocksB = null;
    _gateMesh = null;
    _gatherPoint = null;
    _warden = null;
    _helicopter = null;
    _helicopterSearchlight = null;
    _keysDown = {};
  }

  return { init: init, update: update, reset: reset };

})();
