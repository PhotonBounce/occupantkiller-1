window.PrisonEscape = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _clock;
  var _active = false;
  var _container;

  // Key tracking for P+E chord (both within 400ms)
  var _keysDown = {};
  var _pTime = 0;
  var _eTime = 0;

  // Player
  var _player;
  var _playerSpeed = 7;
  var _cameraAngle = 0;
  var _cameraDistance = 20;
  var _cameraHeight = 14;
  var _playerHP = 100;
  var _stunTimer = 0;
  var _crouching = false;
  var _inSolitary = false;
  var _solitaryTimer = 0;

  // Timer (12 minutes = 720 seconds)
  var _gameTimer = 720;
  var _gameOver = false;
  var _escaped = false;

  // Suspicion / alert
  var _suspicion = 0;         // 0-100
  var _alertState = 'LOW';   // LOW / MED / HIGH / ALARM
  var _alarmActive = false;
  var _lockdownActive = false;

  // Riot distraction
  var _riotActive = true;
  var _riotTimer = 360;       // 6 minutes riot window
  var _riotLight = null;
  var _riotLightPulse = 0;

  // Escape route
  var _selectedRoute = 'UNSELECTED';

  // Route progress
  var _tunnelProgress = 0;     // 0–20s
  var _diggingTunnel = false;
  var _tunnelDone = false;

  var _hasRope = false;
  var _ropeThrown = false;
  var _ropeClimbing = false;
  var _ropeClimbProgress = 0;

  var _hasVan = false;
  var _vanObj = null;
  var _ramming = false;
  var _ramProgress = 0;

  var _hasRadio = false;
  var _atRoof = false;
  var _heliSignalled = false;
  var _heliObj = null;
  var _heliArrived = false;

  // Contraband / tools
  var _tools = [];           // list of string names in inventory
  var _contrabandItems = []; // scene objects to pick up
  var _disguised = false;
  var _uniformFound = false;

  // Pat-down zones
  var _patdownZones = [];
  var _patdownActive = false;
  var _patdownTimer = 0;
  var _patdownCaught = false;

  // Guards (20 guards + warden)
  var _guards = [];
  var _warden = null;
  var _wardenHP = 250;
  var _wardenDefeated = false;
  var _masterKeycard = false;
  var _guardsRedirectedToRiot = 0;

  // World objects (refs)
  var _cellBlock = null;
  var _yard = null;
  var _adminBuilding = null;
  var _kitchen = null;
  var _infirmary = null;
  var _perimeterWalls = [];
  var _shadowZones = [];
  var _tunnelEntrance = null;
  var _perimeterGate = null;
  var _motorPool = null;
  var _adminRoof = null;

  // Shadow zone check
  var _inShadow = false;

  // HUD
  var _hud = null;
  var _promptEl = null;
  var _promptTimer = 0;

  // Audio
  var _audioCtx = null;

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
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────────
  function _initAudio() {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { _audioCtx = null; }
  }

  function _beep(freq, dur, vol) {
    if (!_audioCtx) return;
    try {
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.frequency.value = freq || 440;
      osc.type = 'square';
      gain.gain.setValueAtTime(vol || 0.1, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + (dur || 0.15));
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + (dur || 0.15));
    } catch (e) { /* silence */ }
  }

  function _alarm() {
    _beep(880, 0.15, 0.18);
    setTimeout(function () { if (_active) _beep(660, 0.15, 0.18); }, 200);
  }

  // ── Build world ───────────────────────────────────────────────────────────────
  function _buildWorld() {
    // Ground
    var ground = _box(300, 0.2, 300, 0x334422);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // ── CELL BLOCK A: BoxGeometry 30×10×60 (0x556655) ─────────────────────────
    _cellBlock = _box(30, 10, 60, 0x556655);
    _cellBlock.position.set(-40, 5, 0);
    _scene.add(_cellBlock);

    // 3-tier cell bars (LineSegments)
    var barColors = [0x445544, 0x3d4d3d, 0x334433];
    for (var tier = 0; tier < 3; tier++) {
      var ty = 1.5 + tier * 3;
      for (var bi = 0; bi < 8; bi++) {
        var bx = -52 + bi * 2;
        var bars = _lineSegs([
          { x: bx, y: ty, z: -25 }, { x: bx, y: ty + 2.5, z: -25 },
          { x: bx, y: ty, z: 25 },  { x: bx, y: ty + 2.5, z: 25 }
        ], barColors[tier % 3]);
        _scene.add(bars);
      }
    }

    // Guard catwalk above cell block
    var catwalk = _box(30, 0.5, 60, 0x445544);
    catwalk.position.set(-40, 10.25, 0);
    _scene.add(catwalk);

    // Catwalk railing (LineSegments)
    var catRail = _lineSegs([
      { x: -55, y: 11, z: -30 }, { x: -25, y: 11, z: -30 },
      { x: -55, y: 11, z: 30 },  { x: -25, y: 11, z: 30 },
      { x: -55, y: 11, z: -30 }, { x: -55, y: 11, z: 30 },
      { x: -25, y: 11, z: -30 }, { x: -25, y: 11, z: 30 }
    ], 0x667766);
    _scene.add(catRail);

    // ── YARD: BoxGeometry 50×1×50 (0x665544) ──────────────────────────────────
    _yard = _box(50, 1, 50, 0x665544);
    _yard.position.set(0, 0.5, 0);
    _scene.add(_yard);

    // Guard towers at yard corners (CylinderGeometry)
    var towerPositions = [
      { x: -25, z: -25 }, { x: 25, z: -25 },
      { x: -25, z: 25 },  { x: 25, z: 25 }
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tp = towerPositions[ti];
      var tower = _cyl(2.5, 2.5, 14, 8, 0x556655);
      tower.position.set(tp.x, 7, tp.z);
      _scene.add(tower);
      var towerTop = _box(6, 0.5, 6, 0x445544);
      towerTop.position.set(tp.x, 14.25, tp.z);
      _scene.add(towerTop);
    }

    // 6 yard guards (built in _buildGuards)

    // ── ADMIN BUILDING: BoxGeometry 25×8×20 (0x445566) ───────────────────────
    _adminBuilding = _box(25, 8, 20, 0x445566);
    _adminBuilding.position.set(35, 4, -30);
    _scene.add(_adminBuilding);

    // Warden's office door (BoxGeometry 0x334455)
    var wardenDoor = _box(2, 4, 0.3, 0x334455);
    wardenDoor.position.set(30, 2, -21);
    wardenDoor.userData = { type: 'wardenDoor' };
    _scene.add(wardenDoor);

    // Keycard room (smaller box inside admin)
    var keycardRoom = _box(8, 6, 8, 0x334466);
    keycardRoom.position.set(42, 3, -30);
    keycardRoom.userData = { type: 'keycardRoom' };
    _scene.add(keycardRoom);

    // Admin roof marker (flat box, reachable via ladder)
    _adminRoof = _box(24, 0.3, 19, 0x334455);
    _adminRoof.position.set(35, 8.15, -30);
    _adminRoof.userData = { type: 'adminRoof' };
    _scene.add(_adminRoof);

    // ── KITCHEN: BoxGeometry 20×5×25 (0x556644) ───────────────────────────────
    _kitchen = _box(20, 5, 25, 0x556644);
    _kitchen.position.set(35, 2.5, 20);
    _scene.add(_kitchen);

    // Kitchen knives rack (LineSegments)
    for (var ki = 0; ki < 5; ki++) {
      var knifeLines = _lineSegs([
        { x: 27 + ki, y: 4, z: 10 }, { x: 27 + ki, y: 5.5, z: 10 }
      ], 0xcccccc);
      _scene.add(knifeLines);
    }

    // Service tunnel access (dark hole in kitchen floor)
    _tunnelEntrance = _box(3, 0.3, 3, 0x222222);
    _tunnelEntrance.position.set(35, 0.15, 22);
    _tunnelEntrance.userData = { type: 'tunnelEntrance' };
    _scene.add(_tunnelEntrance);

    // ── INFIRMARY: BoxGeometry 15×5×12 (0x556655) ─────────────────────────────
    var infirmary = _box(15, 5, 12, 0x556655);
    infirmary.position.set(-15, 2.5, -30);
    infirmary.userData = { type: 'infirmary' };
    _scene.add(infirmary);

    // Medical cabinet (locked, LineSegments)
    var medCabinet = _lineSegs([
      { x: -20, y: 0.5, z: -35 }, { x: -20, y: 4.5, z: -35 },
      { x: -16, y: 0.5, z: -35 }, { x: -16, y: 4.5, z: -35 },
      { x: -20, y: 0.5, z: -35 }, { x: -16, y: 0.5, z: -35 },
      { x: -20, y: 4.5, z: -35 }, { x: -16, y: 4.5, z: -35 },
      { x: -20, y: 2.5, z: -35 }, { x: -16, y: 2.5, z: -35 }
    ], 0x778877);
    medCabinet.userData = { type: 'medCabinet' };
    _scene.add(medCabinet);

    // ── PERIMETER WALL: BoxGeometry 2×8 perimeter (0x667766) ──────────────────
    // North wall
    var wN = _box(200, 8, 2, 0x667766);
    wN.position.set(0, 4, -70);
    _scene.add(wN);
    _perimeterWalls.push(wN);

    // South wall
    var wS = _box(200, 8, 2, 0x667766);
    wS.position.set(0, 4, 70);
    _scene.add(wS);
    _perimeterWalls.push(wS);

    // East wall
    var wE = _box(2, 8, 140, 0x667766);
    wE.position.set(100, 4, 0);
    _scene.add(wE);
    _perimeterWalls.push(wE);

    // West wall
    var wW = _box(2, 8, 140, 0x667766);
    wW.position.set(-100, 4, 0);
    _scene.add(wW);
    _perimeterWalls.push(wW);

    // Main gate (can be rammed)
    _perimeterGate = _box(8, 8, 2, 0x778866);
    _perimeterGate.position.set(0, 4, 70);
    _perimeterGate.userData = { type: 'gate' };
    _scene.add(_perimeterGate);

    // Electrified fence (LineSegments along inside of perimeter)
    var fenceLines = [];
    for (var fi = -95; fi <= 95; fi += 5) {
      fenceLines.push({ x: fi, y: 6, z: -69 });
      fenceLines.push({ x: fi + 5, y: 6, z: -69 });
      fenceLines.push({ x: fi, y: 8, z: -69 });
      fenceLines.push({ x: fi + 5, y: 8, z: -69 });
    }
    for (var fi2 = -65; fi2 <= 65; fi2 += 5) {
      fenceLines.push({ x: 99, y: 6, z: fi2 });
      fenceLines.push({ x: 99, y: 6, z: fi2 + 5 });
    }
    var fence = _lineSegs(fenceLines, 0xaaff44);
    fence.userData = { type: 'electricFence' };
    _scene.add(fence);

    // Watchtowers on perimeter corners
    var wTowers = [
      { x: -100, z: -70 }, { x: 100, z: -70 },
      { x: -100, z: 70 },  { x: 100, z: 70 }
    ];
    for (var wti = 0; wti < 4; wti++) {
      var wt = _cyl(3, 3, 16, 8, 0x556655);
      wt.position.set(wTowers[wti].x, 8, wTowers[wti].z);
      _scene.add(wt);
      var searchLight = _cone(2, 4, 8, 0xffff88);
      searchLight.position.set(wTowers[wti].x, 17, wTowers[wti].z);
      searchLight.userData = { type: 'searchlight', angle: Math.random() * Math.PI * 2 };
      _scene.add(searchLight);
    }

    // ── LAUNDRY (BoxGeometry 0x334455 locker with uniform) ────────────────────
    var laundry = _box(10, 4, 8, 0x445544);
    laundry.position.set(-30, 2, 30);
    laundry.userData = { type: 'laundry' };
    _scene.add(laundry);

    // Uniform locker inside laundry
    var uniformLocker = _box(1.5, 3, 1.5, 0x334455);
    uniformLocker.position.set(-27, 1.5, 28);
    uniformLocker.userData = { type: 'uniformLocker' };
    _scene.add(uniformLocker);

    // ── MOTOR POOL: guard vans ─────────────────────────────────────────────────
    _motorPool = _box(20, 3, 15, 0x334433);
    _motorPool.position.set(70, 1.5, 50);
    _scene.add(_motorPool);

    // Guard van (stealable)
    _vanObj = _box(5, 3, 8, 0x445566);
    _vanObj.position.set(68, 1.5, 48);
    _vanObj.userData = { type: 'van', stolen: false };
    _scene.add(_vanObj);

    // ── SHADOW ZONES: dark BoxGeometry 0x222222 areas ─────────────────────────
    var shadowPositions = [
      { x: -45, z: 10 }, { x: -45, z: -10 },
      { x: 0, z: -10 }, { x: 0, z: 10 },
      { x: -20, z: 0 },  { x: 20, z: -15 },
      { x: -30, z: -50 }, { x: 40, z: 40 }
    ];
    for (var si = 0; si < shadowPositions.length; si++) {
      var sp = shadowPositions[si];
      var shadow = _box(8, 0.1, 6, 0x222222);
      shadow.position.set(sp.x, 0.05, sp.z);
      shadow.userData = { type: 'shadowZone' };
      _scene.add(shadow);
      _shadowZones.push(shadow);
    }

    // ── RIOT in cellblock B (PointLight 0xFF4400) ──────────────────────────────
    _riotLight = new THREE.PointLight(0xFF4400, 3, 40);
    _riotLight.position.set(-40, 8, 30);
    _scene.add(_riotLight);

    // Riot smoke column
    var riotSmoke = _cyl(1, 3, 12, 6, 0x553322);
    riotSmoke.position.set(-40, 10, 30);
    riotSmoke.userData = { type: 'riotSmoke' };
    _scene.add(riotSmoke);

    // ── CONTRABAND ITEMS ──────────────────────────────────────────────────────
    _buildContraband();

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x202830, 0.6);
    _scene.add(ambient);
    var moonLight = new THREE.DirectionalLight(0x8899aa, 0.5);
    moonLight.position.set(-10, 40, 20);
    _scene.add(moonLight);

    // Security floodlights
    var flood1 = new THREE.PointLight(0xffee88, 1.5, 60);
    flood1.position.set(0, 12, 0);
    _scene.add(flood1);
    var flood2 = new THREE.PointLight(0xffee88, 1.2, 50);
    flood2.position.set(35, 10, -30);
    _scene.add(flood2);
  }

  function _buildContraband() {
    // shiv - infirmary floor
    var shiv = _box(0.5, 0.1, 0.15, 0xcccccc);
    shiv.position.set(-17, 0.5, -28);
    shiv.userData = { type: 'contraband', name: 'shiv', collected: false };
    _scene.add(shiv);
    _contrabandItems.push(shiv);

    // rope - laundry room
    var ropePts = [];
    for (var ri = 0; ri < 20; ri++) {
      var a = ri * 0.8;
      ropePts.push({ x: -28 + Math.cos(a) * 0.4, y: 0.5 + ri * 0.08, z: 29 + Math.sin(a) * 0.4 });
      if (ri < 19) {
        ropePts.push({ x: -28 + Math.cos(a + 0.8) * 0.4, y: 0.5 + (ri + 1) * 0.08, z: 29 + Math.sin(a + 0.8) * 0.4 });
      }
    }
    var ropeItem = _lineSegs(ropePts, 0x885533);
    ropeItem.userData = { type: 'contraband', name: 'rope', collected: false };
    _scene.add(ropeItem);
    _contrabandItems.push(ropeItem);

    // radio - warden's office (admin building)
    var radio = _box(0.6, 0.4, 0.4, 0x334455);
    radio.position.set(33, 1.5, -28);
    radio.userData = { type: 'contraband', name: 'radio', collected: false };
    _scene.add(radio);
    _contrabandItems.push(radio);

    // wire cutters - yard (hidden near perimeter)
    var wireCutters = _box(0.5, 0.2, 0.3, 0x886644);
    wireCutters.position.set(-22, 0.5, -20);
    wireCutters.userData = { type: 'contraband', name: 'wire_cutters', collected: false };
    _scene.add(wireCutters);
    _contrabandItems.push(wireCutters);

    // digging tool - infirmary cabinet
    var digTool = _box(0.8, 0.15, 0.15, 0x998877);
    digTool.position.set(-18, 0.5, -33);
    digTool.userData = { type: 'contraband', name: 'digging_tool', collected: false, requiresCabinet: true };
    _scene.add(digTool);
    _contrabandItems.push(digTool);
  }

  // ── Build guards ──────────────────────────────────────────────────────────────
  function _buildGuards() {
    // 20 patrol guards (BoxGeometry 0x334455)
    var routes = [
      // Yard guards (6 of them):
      [{ x: -20, z: -20 }, { x: 20, z: -20 }],
      [{ x: 20, z: -20 }, { x: 20, z: 20 }],
      [{ x: 20, z: 20 }, { x: -20, z: 20 }],
      [{ x: -20, z: 20 }, { x: -20, z: -20 }],
      [{ x: 0, z: -20 }, { x: 0, z: 20 }],
      [{ x: -20, z: 0 }, { x: 20, z: 0 }],
      // Admin building guards:
      [{ x: 25, z: -35 }, { x: 45, z: -35 }],
      [{ x: 35, z: -40 }, { x: 35, z: -20 }],
      // Cell block guards:
      [{ x: -55, z: -25 }, { x: -25, z: -25 }],
      [{ x: -55, z: 25 }, { x: -25, z: 25 }],
      [{ x: -55, z: 0 }, { x: -25, z: 0 }],
      // Kitchen guards:
      [{ x: 28, z: 12 }, { x: 44, z: 12 }],
      [{ x: 28, z: 28 }, { x: 44, z: 28 }],
      // Perimeter guards:
      [{ x: -80, z: -60 }, { x: 80, z: -60 }],
      [{ x: 80, z: -60 }, { x: 80, z: 60 }],
      [{ x: 80, z: 60 }, { x: -80, z: 60 }],
      [{ x: -80, z: 60 }, { x: -80, z: -60 }],
      // Motor pool:
      [{ x: 60, z: 45 }, { x: 80, z: 55 }],
      // Infirmary:
      [{ x: -22, z: -35 }, { x: -8, z: -25 }],
      // Roving guard:
      [{ x: 0, z: -50 }, { x: 0, z: 50 }, { x: 50, z: 50 }, { x: 50, z: -50 }]
    ];

    for (var i = 0; i < 20; i++) {
      var route = routes[i];
      var g = _box(1, 1.8, 1, 0x334455);
      g.position.set(route[0].x, 0.9, route[0].z);
      g.userData = {
        type: 'guard',
        hp: 80,
        route: route,
        routeIdx: 0,
        speed: 4,
        facing: 0,
        spotTimer: 0,
        downed: false,
        alertedPos: null,
        riotDiverted: false,
        stunned: false,
        stunTimer: 0,
        patrolPause: 0
      };
      // Attach vision indicator
      var visionLine = _lineSegs([
        { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: -10 }
      ], 0xff4444);
      visionLine.userData = { type: 'visionLine' };
      g.userData.visionLine = visionLine;
      _scene.add(visionLine);
      _scene.add(g);
      _guards.push(g);
    }

    // 8 of 20 guards redirected to riot at game start
    for (var ri = 0; ri < 8; ri++) {
      _guards[ri].userData.riotDiverted = true;
    }

    // Warden: BoxGeometry (0x223344), 250HP, in admin building
    _warden = _box(1.2, 2, 1.2, 0x223344);
    _warden.position.set(35, 1, -28);
    _warden.userData = {
      type: 'warden',
      hp: 250,
      patrolAngle: 0,
      patrolCenter: { x: 35, z: -28 },
      radius: 5,
      downed: false
    };
    _scene.add(_warden);
  }

  // ── Build player ──────────────────────────────────────────────────────────────
  function _buildPlayer() {
    _player = _cyl(0.45, 0.45, 1.8, 8, 0x2244AA);
    _player.position.set(-40, 0.9, 0);
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
      'padding:6px 14px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(_hud);

    _promptEl = document.createElement('div');
    _promptEl.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.90)',
      'color:#FFFF44',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 16px',
      'border:1px solid #FFFF44',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'max-width:90vw',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function _updateHUD() {
    if (!_hud) return;
    var mins = Math.floor(_gameTimer / 60);
    var secs = Math.floor(_gameTimer % 60);
    var secStr = secs < 10 ? '0' + secs : '' + secs;
    var toolStr = _tools.length > 0 ? _tools.join(',') : 'NONE';
    var activeGuards = 0;
    for (var i = 0; i < _guards.length; i++) {
      if (!_guards[i].userData.downed) activeGuards++;
    }
    if (_warden && !_wardenDefeated) activeGuards++;

    var susColor = '#00FF88';
    if (_alertState === 'MED') susColor = '#FFAA00';
    if (_alertState === 'HIGH') susColor = '#FF6600';
    if (_alertState === 'ALARM') susColor = '#FF2200';

    _hud.style.color = susColor;
    _hud.style.borderColor = susColor;
    _hud.innerHTML =
      'PRISON ESCAPE' +
      ' [ROUTE: ' + _selectedRoute + ']' +
      ' [TIMER: ' + mins + ':' + secStr + ']' +
      ' [SUSPICION: ' + _alertState + ']' +
      ' [TOOLS: ' + toolStr + ']' +
      ' [GUARDS: ' + activeGuards + ']';
  }

  function _showPrompt(text, dur) {
    if (!_promptEl) return;
    _promptEl.textContent = text;
    _promptEl.style.display = 'block';
    _promptTimer = dur || 3;
  }

  // ── Suspicion / Alert ─────────────────────────────────────────────────────────
  function _addSuspicion(amount) {
    if (_inShadow && _crouching) amount *= 0.2;
    else if (_inShadow) amount *= 0.5;
    else if (_crouching) amount *= 0.6;
    if (_disguised) amount *= 0.4;

    _suspicion += amount;
    if (_suspicion > 100) _suspicion = 100;
    if (_suspicion < 0) _suspicion = 0;

    var newState = 'LOW';
    if (_suspicion >= 25) newState = 'MED';
    if (_suspicion >= 60) newState = 'HIGH';
    if (_suspicion >= 90) newState = 'ALARM';

    if (newState !== _alertState) {
      _alertState = newState;
      if (_alertState === 'ALARM') _triggerLockdown();
      else if (_alertState === 'HIGH') _showPrompt('!! SUSPICION HIGH — guards converging !!', 3);
      else if (_alertState === 'MED') _showPrompt('Guards are watchful — stay out of sight', 2);
    }
  }

  function _triggerLockdown() {
    if (_alarmActive) return;
    _alarmActive = true;
    _lockdownActive = true;
    _showPrompt('!! ALARM !! LOCKDOWN — all doors sealed — find another way!', 6);
    _alarm();
    // All guards go alert
    for (var i = 0; i < _guards.length; i++) {
      _guards[i].userData.alertedPos = {
        x: _player.position.x,
        z: _player.position.z
      };
    }
  }

  // ── Pat-down zones ────────────────────────────────────────────────────────────
  function _checkPatdownZones(dt) {
    // Admin building and kitchen are pat-down zones
    var zones = [
      { x: 35, z: -30, r: 15 },  // admin
      { x: 35, z: 20, r: 14 }    // kitchen
    ];

    var inZone = false;
    for (var zi = 0; zi < zones.length; zi++) {
      var zd = _dist2(_player.position, zones[zi]);
      if (zd < zones[zi].r) { inZone = true; break; }
    }

    if (inZone && !_patdownActive && !_disguised) {
      _patdownActive = true;
      _patdownTimer = 3;
      _showPrompt('PAT-DOWN — stand still... (' + Math.ceil(_patdownTimer) + 's)', 0.5);
    }

    if (_patdownActive) {
      _patdownTimer -= dt;
      _showPrompt('PAT-DOWN check... ' + Math.ceil(_patdownTimer) + 's', 0.5);
      if (_patdownTimer <= 0) {
        _patdownActive = false;
        // Check if carrying contraband without disguise
        if (_tools.length > 0 && !_disguised) {
          _showPrompt('CAUGHT with contraband! Thrown in solitary (60s penalty)!', 5);
          _addSuspicion(30);
          _goSolitary();
        } else {
          _showPrompt('Pat-down clear.', 2);
        }
      }
    }
  }

  function _goSolitary() {
    _inSolitary = true;
    _solitaryTimer = 60;
    _player.position.set(-55, 0.9, -20);
    _showPrompt('SOLITARY CONFINEMENT — wait 60 seconds...', 4);
    _beep(200, 1, 0.2);
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.userData.downed) continue;

      // Handle stun
      if (g.userData.stunned) {
        g.userData.stunTimer -= dt;
        if (g.userData.stunTimer <= 0) {
          g.userData.stunned = false;
        }
        continue;
      }

      var gx = g.position.x, gz = g.position.z;
      var dx = px - gx, dz = pz - gz;
      var dist = Math.sqrt(dx * dx + dz * dz);

      // Riot diversion: send guard toward riot area
      if (_riotActive && g.userData.riotDiverted && !g.userData.alertedPos) {
        var riotTarget = { x: -40, z: 30 };
        var rtdx = riotTarget.x - gx, rtdz = riotTarget.z - gz;
        var rtd = Math.sqrt(rtdx * rtdx + rtdz * rtdz);
        if (rtd > 1.5) {
          g.position.x += (rtdx / rtd) * g.userData.speed * dt;
          g.position.z += (rtdz / rtd) * g.userData.speed * dt;
          g.rotation.y = Math.atan2(rtdx, rtdz);
          g.userData.facing = g.rotation.y;
        }
      } else if (g.userData.alertedPos) {
        // Converge on alerted position
        var apx = g.userData.alertedPos.x, apz = g.userData.alertedPos.z;
        var adx = apx - gx, adz = apz - gz;
        var ad = Math.sqrt(adx * adx + adz * adz);
        if (ad > 1) {
          g.position.x += (adx / ad) * g.userData.speed * 1.6 * dt;
          g.position.z += (adz / ad) * g.userData.speed * 1.6 * dt;
          g.rotation.y = Math.atan2(adx, adz);
          g.userData.facing = g.rotation.y;
        }
      } else {
        // Normal patrol
        var route = g.userData.route;
        var rtgt = route[g.userData.routeIdx];
        var rdx = rtgt.x - gx, rdz = rtgt.z - gz;
        var rd = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rd < 0.8) {
          g.userData.routeIdx = (g.userData.routeIdx + 1) % route.length;
          g.userData.patrolPause = 0.5;
        } else if (g.userData.patrolPause > 0) {
          g.userData.patrolPause -= dt;
        } else {
          g.position.x += (rdx / rd) * g.userData.speed * dt;
          g.position.z += (rdz / rd) * g.userData.speed * dt;
          g.rotation.y = Math.atan2(rdx, rdz);
          g.userData.facing = g.rotation.y;
        }
      }

      // Update vision line
      if (g.userData.visionLine) {
        g.userData.visionLine.position.set(g.position.x, 0, g.position.z);
        g.userData.visionLine.rotation.y = g.rotation.y;
      }

      // Detection
      var detRange = 12;
      var fovDot = Math.cos(Math.PI / 3); // 60 deg half-angle
      var fwd = { x: Math.sin(g.userData.facing), z: Math.cos(g.userData.facing) };
      var toP = dist > 0.01 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
      var dot = fwd.x * toP.x + fwd.z * toP.z;
      var inFOV = (dot > fovDot && dist < detRange) || dist < 2;

      if (inFOV) {
        var detectRate = 20; // sus per second at full detection
        if (_disguised) detectRate = 5;
        if (_inShadow && _crouching) detectRate = 1;
        else if (_inShadow) detectRate = 5;
        else if (_crouching) detectRate = 8;
        _addSuspicion(detectRate * dt);
        g.userData.spotTimer += dt;

        if (g.userData.spotTimer > 1.5) {
          // Guard sees player - taser effect if close
          if (dist < 4 && !_stunTimer) {
            _showPrompt('TASER! Stunned for 3 seconds!', 3);
            _stunTimer = 3;
            _addSuspicion(25);
            _alarm();
            _beep(400, 0.3, 0.2);
          }
          g.userData.alertedPos = { x: px, z: pz };
          // Alert nearby guards
          for (var aj = 0; aj < _guards.length; aj++) {
            if (aj !== i && !_guards[aj].userData.downed) {
              var agd = _dist2(g.position, _guards[aj].position);
              if (agd < 25) {
                _guards[aj].userData.alertedPos = { x: px, z: pz };
              }
            }
          }
        }
      } else {
        g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 0.5);
        // Decay alerted pos if no longer seeing player
        if (g.userData.alertedPos && !_alarmActive) {
          var apd = _dist2(g.position, g.userData.alertedPos);
          if (apd < 2) {
            g.userData.alertedPos = null;
          }
        }
      }
    }

    // Warden patrol
    if (_warden && !_wardenDefeated) {
      _warden.userData.patrolAngle += dt * 0.6;
      var wa = _warden.userData.patrolAngle;
      var wc = _warden.userData.patrolCenter;
      _warden.position.x = wc.x + Math.cos(wa) * _warden.userData.radius;
      _warden.position.z = wc.z + Math.sin(wa) * _warden.userData.radius;
      _warden.rotation.y = wa + Math.PI / 2;
    }
  }

  // ── Shadow zone check ─────────────────────────────────────────────────────────
  function _checkShadow() {
    _inShadow = false;
    for (var si = 0; si < _shadowZones.length; si++) {
      var sz = _shadowZones[si];
      var sd = _dist2(_player.position, sz.position);
      if (sd < 5) { _inShadow = true; break; }
    }
  }

  // ── Suspicion decay ───────────────────────────────────────────────────────────
  function _decaySuspicion(dt) {
    // Suspicion decays when not in guard view
    var decayRate = 3;
    if (_inShadow) decayRate = 8;
    if (_crouching) decayRate = 5;
    if (_alarmActive) decayRate = 0;
    _suspicion = Math.max(0, _suspicion - decayRate * dt);

    // Reset alarm state if suspicion drops enough
    if (_alarmActive && _suspicion < 20) {
      _alarmActive = false;
      _lockdownActive = false;
      _alertState = 'LOW';
      _showPrompt('Lockdown lifted — guards standing down', 3);
      for (var i = 0; i < _guards.length; i++) {
        _guards[i].userData.alertedPos = null;
      }
    }
  }

  // ── Riot management ───────────────────────────────────────────────────────────
  function _updateRiot(dt) {
    if (!_riotActive) return;
    _riotTimer -= dt;

    // Riot light pulse
    _riotLightPulse += dt * 5;
    if (_riotLight) {
      _riotLight.intensity = 2 + 1.5 * Math.abs(Math.sin(_riotLightPulse));
    }

    if (_riotTimer <= 0) {
      _riotActive = false;
      if (_riotLight) {
        _riotLight.intensity = 0;
      }
      _showPrompt('Riot suppressed — all guards returning to posts', 4);
      // Guards return from riot
      for (var i = 0; i < 8; i++) {
        _guards[i].userData.riotDiverted = false;
      }
      _beep(440, 0.4, 0.12);
    }

    // 6-minute warning
    if (_riotTimer > 0 && _riotTimer < 5 && Math.floor(_riotTimer) === 4) {
      _showPrompt('RIOT WINDOW CLOSING in 6 seconds!', 6);
    }
  }

  // ── Player movement ───────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    // Stun check
    if (_stunTimer > 0) {
      _stunTimer -= dt;
      return;
    }

    // Solitary
    if (_inSolitary) {
      _solitaryTimer -= dt;
      if (_solitaryTimer <= 0) {
        _inSolitary = false;
        _showPrompt('Released from solitary.', 3);
      }
      return;
    }

    var mx = 0, mz = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp']) mz -= 1;
    if (_keysDown['KeyS'] || _keysDown['ArrowDown']) mz += 1;
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft']) mx -= 1;
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) mx += 1;
    if (_keysDown['KeyQ']) _cameraAngle -= 1.2 * dt;
    if (_keysDown['KeyZ']) _cameraAngle += 1.2 * dt;

    _crouching = !!_keysDown['KeyC'];
    var speed = _playerSpeed;
    if (_crouching) speed = 2.5;

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      mx /= len; mz /= len;
      var ca = _cameraAngle;
      var rx = mx * Math.cos(ca) + mz * Math.sin(ca);
      var rz = -mx * Math.sin(ca) + mz * Math.cos(ca);
      _player.position.x += rx * speed * dt;
      _player.position.z += rz * speed * dt;
      _player.rotation.y = Math.atan2(rx, rz);

      if (!_crouching && !_inShadow) {
        _addSuspicion(0.5 * dt); // moving while exposed adds tiny suspicion
      }
    }

    // Clamp to world
    _player.position.x = Math.max(-110, Math.min(110, _player.position.x));
    _player.position.z = Math.max(-80, Math.min(80, _player.position.z));

    // Camera follow
    _camera.position.x = _player.position.x + Math.sin(_cameraAngle) * _cameraDistance;
    _camera.position.z = _player.position.z + Math.cos(_cameraAngle) * _cameraDistance;
    _camera.position.y = _cameraHeight;
    _camera.lookAt(new THREE.Vector3(_player.position.x, 1, _player.position.z));

    // Visual: crouch scale
    _player.scale.y = _crouching ? 0.55 : 1;
    _player.position.y = _crouching ? 0.5 : 0.9;
  }

  // ── Interactions (E key) ──────────────────────────────────────────────────────
  function _checkInteractions(dt) {
    var px = _player.position.x, pz = _player.position.z;
    var eHeld = !!_keysDown['KeyE'];
    var ePulse = !!_keysDown['_ePulse'];

    // Spin & hover contraband
    for (var ci = 0; ci < _contrabandItems.length; ci++) {
      var item = _contrabandItems[ci];
      if (item.userData.collected) continue;
      item.rotation.y += dt * 2.5;
      item.position.y = 0.5 + 0.12 * Math.sin(Date.now() * 0.003 + ci);

      var id = _dist2({ x: px, z: pz }, item.position);
      if (id < 3) {
        if (item.userData.requiresCabinet && !_masterKeycard) {
          _showPrompt('[E] Locked cabinet — need master keycard from warden', 0.5);
          continue;
        }
        _showPrompt('[E] Pick up ' + item.userData.name.replace(/_/g, ' '), 0.5);
        if (ePulse) {
          item.userData.collected = true;
          _scene.remove(item);
          _tools.push(item.userData.name);
          _showPrompt('Picked up: ' + item.userData.name.replace(/_/g, ' '), 2);
          if (item.userData.name === 'rope') _hasRope = true;
          if (item.userData.name === 'radio') _hasRadio = true;
          _keysDown['_ePulse'] = false;
          _beep(660, 0.1, 0.1);
          break;
        }
      }
    }

    // Guard uniform in laundry
    if (!_uniformFound) {
      var ld = _dist2({ x: px, z: pz }, { x: -27, z: 28 });
      if (ld < 4) {
        _showPrompt('[E] Take guard uniform from locker', 0.5);
        if (ePulse) {
          _uniformFound = true;
          _keysDown['_ePulse'] = false;
          _showPrompt('Guard uniform obtained! Press [G] to wear it (reduces suspicion)', 4);
          _beep(660, 0.1, 0.1);
        }
      }
    }

    // Wear uniform
    if (_uniformFound && !_disguised) {
      if (_keysDown['KeyG']) {
        _disguised = true;
        _player.material.color.setHex(0x334455);
        _showPrompt('Disguise ON — pass as a guard (suspicion reduced)', 3);
        _keysDown['KeyG'] = false;
      }
    }

    // Warden encounter
    if (_warden && !_wardenDefeated) {
      var wd = _dist2({ x: px, z: pz }, _warden.position);
      if (wd < 4) {
        _showPrompt('[E] Hold to overpower warden (3s) — get master keycard', 0.5);
        if (eHeld) {
          _warden.userData.overpowerTimer = (_warden.userData.overpowerTimer || 0) + dt;
          _showPrompt('Overpowering warden... ' + Math.ceil(3 - _warden.userData.overpowerTimer) + 's', 0.5);
          if (_warden.userData.overpowerTimer >= 3) {
            _wardenDefeated = true;
            _masterKeycard = true;
            _warden.rotation.z = Math.PI / 2;
            _warden.position.y = 0;
            if (!_tools.includes('master_keycard')) _tools.push('master_keycard');
            _showPrompt('Warden incapacitated! Master keycard obtained!', 5);
            _beep(880, 0.3, 0.2);
          }
        } else {
          _warden.userData.overpowerTimer = Math.max(0, (_warden.userData.overpowerTimer || 0) - dt * 2);
        }
      }
    }

    // ── ROUTE 1: TUNNEL ──────────────────────────────────────────────────────
    var hasDig = _tools.indexOf('digging_tool') >= 0;
    var td = _dist2({ x: px, z: pz }, { x: 35, z: 22 });
    if (td < 4 && hasDig) {
      if (_selectedRoute === 'UNSELECTED' || _selectedRoute === 'TUNNEL') {
        _selectedRoute = 'TUNNEL';
        _showPrompt('[E] Hold to dig tunnel (' + Math.ceil(20 - _tunnelProgress) + 's remaining)', 0.5);
        if (eHeld && !_tunnelDone) {
          _diggingTunnel = true;
          _tunnelProgress += dt;
          _showPrompt('Digging... ' + Math.ceil(20 - _tunnelProgress) + 's', 0.5);
          if (_tunnelProgress >= 20) {
            _tunnelDone = true;
            _diggingTunnel = false;
            // Create tunnel exit object
            var tunnelExit = _box(3, 0.3, 3, 0x333322);
            tunnelExit.position.set(35, 0.15, 78);
            _scene.add(tunnelExit);
            _showPrompt('TUNNEL DUG! Crawl to outside — move to kitchen then north past wall!', 6);
            _beep(660, 0.2, 0.15);
          }
        } else {
          _diggingTunnel = false;
        }
      }
    }
    if (_tunnelDone) {
      var crawlD = _dist2({ x: px, z: pz }, { x: 35, z: 76 });
      if (crawlD < 5 && pz > 70) {
        _triggerWin('TUNNEL escape — crawled under the perimeter wall!');
      }
    }

    // ── ROUTE 2: WALL CLIMB ──────────────────────────────────────────────────
    if (_hasRope) {
      var wallD = _dist2({ x: px, z: pz }, { x: px, z: -69 });
      if (Math.abs(pz - (-66)) < 6) {
        if (_selectedRoute === 'UNSELECTED' || _selectedRoute === 'WALL') {
          _selectedRoute = 'WALL';
          _showPrompt('[E] Throw rope hook over north perimeter wall', 0.5);
          if (ePulse && !_ropeThrown) {
            _ropeThrown = true;
            // Draw rope LineSegments
            var ropeSegs = _lineSegs([
              { x: px, y: 0, z: pz }, { x: px, y: 8, z: -69 }
            ], 0x885533);
            _scene.add(ropeSegs);
            _showPrompt('Rope thrown! [E] Hold to climb (8s)', 3);
            _keysDown['_ePulse'] = false;
          }
        }
        if (_ropeThrown && !_ropeClimbing) {
          _showPrompt('[E] Hold to climb rope (' + Math.ceil(8 - _ropeClimbProgress) + 's)', 0.5);
        }
        if (_ropeThrown && eHeld) {
          _ropeClimbing = true;
          _ropeClimbProgress += dt;
          _showPrompt('Climbing... ' + Math.ceil(8 - _ropeClimbProgress) + 's', 0.5);
          _player.position.y = 0.9 + (_ropeClimbProgress / 8) * 10;
          if (_ropeClimbProgress >= 8) {
            _ropeClimbing = false;
            _player.position.set(px, 0.9, -78);
            _player.position.y = 0.9;
            _triggerWin('WALL CLIMB — over the north perimeter fence!');
          }
        } else {
          _ropeClimbing = false;
        }
      }
    }

    // ── ROUTE 3: VEHICLE ─────────────────────────────────────────────────────
    var vanD = _dist2({ x: px, z: pz }, _vanObj.position);
    if (vanD < 5 && !_hasVan) {
      _showPrompt('[E] Steal guard van — ram the main gate', 0.5);
      if (ePulse) {
        _hasVan = true;
        _selectedRoute = 'VEHICLE';
        _vanObj.material.color.setHex(0x223344);
        _keysDown['_ePulse'] = false;
        _showPrompt('Van stolen! Drive to main gate (south, Z=70) and hold [E] to RAM', 4);
        _beep(440, 0.3, 0.12);
      }
    }
    if (_hasVan && _playerHP > 0) {
      // Move van with player
      _vanObj.position.set(px, 1.5, pz + 4);
      if (_selectedRoute === 'UNSELECTED') _selectedRoute = 'VEHICLE';
      // Near main gate
      var gateD = _dist2({ x: px, z: pz }, { x: 0, z: 68 });
      if (gateD < 10) {
        _showPrompt('[E] RAM the main gate! (' + _playerHP + 'HP — risk of injury)', 0.5);
        if (eHeld) {
          _ramming = true;
          _ramProgress += dt;
          _showPrompt('Ramming gate... ' + Math.ceil(2 - _ramProgress) + 's', 0.5);
          if (_ramProgress >= 2) {
            _ramProgress = 0;
            _playerHP -= 20;
            _beep(200, 0.4, 0.2);
            if (_playerHP <= 0) {
              _showPrompt('VAN DESTROYED — you were incapacitated!', 5);
              _triggerLose('Vehicle rammed out but you were too injured to escape!');
            } else {
              // Gate demolished
              _scene.remove(_perimeterGate);
              _player.position.z = 80;
              _triggerWin('VEHICLE escape — rammed the gate and drove to freedom!');
            }
          }
        } else {
          _ramming = false;
        }
      }
    }

    // ── ROUTE 4: HELICOPTER ─────────────────────────────────────────────────
    if (_hasRadio) {
      var roofD = _dist3(_player.position, { x: 35, y: 8.5, z: -30 });
      if (roofD < 8) {
        _atRoof = true;
        if (_selectedRoute === 'UNSELECTED' || _selectedRoute === 'HELICOPTER') {
          _selectedRoute = 'HELICOPTER';
          var heliTime = _gameTimer;
          if (heliTime > 120) {
            _showPrompt('Signal helicopter at 2:00 remaining (now: ' + Math.floor(heliTime / 60) + ':' + (Math.floor(heliTime % 60) < 10 ? '0' : '') + Math.floor(heliTime % 60) + ')', 1);
          } else {
            _showPrompt('[E] Signal ally helicopter!', 0.5);
            if (ePulse && !_heliSignalled) {
              _heliSignalled = true;
              _keysDown['_ePulse'] = false;
              _showPrompt('Signal sent! Helicopter inbound — hold position!', 5);
              _beep(880, 0.2, 0.15);
              // Spawn heli
              _heliObj = _box(8, 2, 6, 0x334455);
              _heliObj.position.set(35, 30, -30);
              _scene.add(_heliObj);
              // Rotor (LineSegments)
              var rotor = _lineSegs([
                { x: 31, y: 32, z: -30 }, { x: 39, y: 32, z: -30 },
                { x: 35, y: 32, z: -34 }, { x: 35, y: 32, z: -26 }
              ], 0x556677);
              _scene.add(rotor);
            }
          }
        }
      } else {
        _atRoof = false;
      }
    }

    if (_heliSignalled && _heliObj && !_heliArrived) {
      // Heli descends
      _heliObj.position.y -= dt * 3;
      _heliObj.rotation.y += dt * 2;
      if (_heliObj.position.y <= 12) {
        _heliArrived = true;
        _showPrompt('HELICOPTER HERE! [E] to board!', 5);
      }
    }
    if (_heliArrived) {
      var heliD = _dist3(_player.position, _heliObj.position);
      if (heliD < 10 && ePulse) {
        _triggerWin('HELICOPTER extract — ally helo lifted you out!');
      }
    }
  }

  // ── Win / Lose ────────────────────────────────────────────────────────────────
  function _triggerWin(msg) {
    if (_gameOver) return;
    _gameOver = true;
    _escaped = true;
    _showPrompt('*** ESCAPED! *** ' + msg + ' | YOU ARE FREE!', 20);
    _beep(880, 0.3, 0.2);
    setTimeout(function () { if (_active) _beep(1100, 0.3, 0.2); }, 250);
    setTimeout(function () { if (_active) _beep(1320, 0.5, 0.2); }, 500);
    setTimeout(function () { if (_active) _beep(1760, 0.8, 0.2); }, 800);
  }

  function _triggerLose(msg) {
    if (_gameOver) return;
    _gameOver = true;
    _escaped = false;
    _showPrompt('ESCAPE FAILED — ' + msg, 12);
    _beep(200, 0.5, 0.2);
    setTimeout(function () { if (_active) _beep(150, 0.8, 0.2); }, 400);
  }

  // ── Animations ────────────────────────────────────────────────────────────────
  function _animateWorld(dt) {
    // Riot light pulse handled in _updateRiot

    // Suspicious suspicion decay
    _decaySuspicion(dt);

    // Van follow
    if (_hasVan && _vanObj) {
      _vanObj.position.set(_player.position.x, 1.5, _player.position.z + 4);
    }
  }

  // ── Main loop ─────────────────────────────────────────────────────────────────
  function _loop() {
    if (!_active) return;
    requestAnimationFrame(_loop);

    var dt = Math.min(_clock.getDelta(), 0.05);

    if (!_gameOver) {
      _gameTimer -= dt;
      if (_gameTimer <= 0) {
        _gameTimer = 0;
        _triggerLose('Timer expired — lockdown ended, all escape windows closed!');
      }

      // 2 minute helicopter window reminder
      if (_gameTimer <= 120 && _gameTimer > 118) {
        if (_hasRadio && _selectedRoute !== 'HELICOPTER') {
          _showPrompt('2-MINUTE MARK — helicopter window open if you have radio and reach admin roof!', 5);
        }
      }
    }

    _checkShadow();
    _updateRiot(dt);
    _updatePlayer(dt);
    _updateGuards(dt);
    _checkInteractions(dt);
    _checkPatdownZones(dt);
    _animateWorld(dt);
    _updateHUD();

    if (_promptTimer > 0) {
      _promptTimer -= dt;
      if (_promptTimer <= 0 && _promptEl) _promptEl.style.display = 'none';
    }

    _renderer.render(_scene, _camera);
  }

  // ── Key events ────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    _keysDown[e.code] = true;

    if (e.code === 'KeyP') _pTime = Date.now();
    if (e.code === 'KeyE') {
      _eTime = Date.now();
      _keysDown['_ePulse'] = true;
    }

    if (!_active) {
      // Check P+E chord (both within 400ms)
      if (_keysDown['KeyP'] && _keysDown['KeyE']) {
        if (Math.abs(_pTime - _eTime) < 400) _init();
      }
      return;
    }

    if (e.code === 'Escape') reset();
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    if (e.code === 'KeyE') _keysDown['_ePulse'] = false;
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
    _pTime = 0;
    _eTime = 0;
    _keysDown = {};
    _cameraAngle = 0;
    _playerHP = 100;
    _stunTimer = 0;
    _crouching = false;
    _inSolitary = false;
    _solitaryTimer = 0;
    _gameTimer = 720;
    _gameOver = false;
    _escaped = false;
    _suspicion = 0;
    _alertState = 'LOW';
    _alarmActive = false;
    _lockdownActive = false;
    _riotActive = true;
    _riotTimer = 360;
    _riotLight = null;
    _riotLightPulse = 0;
    _selectedRoute = 'UNSELECTED';
    _tunnelProgress = 0;
    _diggingTunnel = false;
    _tunnelDone = false;
    _hasRope = false;
    _ropeThrown = false;
    _ropeClimbing = false;
    _ropeClimbProgress = 0;
    _hasVan = false;
    _vanObj = null;
    _ramming = false;
    _ramProgress = 0;
    _hasRadio = false;
    _atRoof = false;
    _heliSignalled = false;
    _heliObj = null;
    _heliArrived = false;
    _tools = [];
    _contrabandItems = [];
    _disguised = false;
    _uniformFound = false;
    _patdownActive = false;
    _patdownTimer = 0;
    _patdownCaught = false;
    _guards = [];
    _warden = null;
    _wardenHP = 250;
    _wardenDefeated = false;
    _masterKeycard = false;
    _perimeterWalls = [];
    _shadowZones = [];
    _tunnelEntrance = null;
    _perimeterGate = null;
    _motorPool = null;
    _adminRoof = null;
    _inShadow = false;
    _guardsRedirectedToRiot = 0;

    _container = document.createElement('div');
    _container.id = 'prison-escape-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x050a0e);
    _scene.fog = new THREE.FogExp2(0x080e12, 0.008);

    _camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 500);
    _camera.position.set(-40, _cameraHeight, _cameraDistance);

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
      'PRISON ESCAPE — WASD:move  C:crouch  E:interact/hold  G:wear uniform' +
      '  Q/Z:camera  ESC:quit  |  ROUTES: Tunnel / Wall Climb / Vehicle / Helicopter',
      10
    );

    _loop();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init() { _init(); }

  function update(dt) { /* loop is self-driven via requestAnimationFrame */ }

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
    _warden = null;
    _contrabandItems = [];
    _perimeterWalls = [];
    _shadowZones = [];
    _riotLight = null;
    _heliObj = null;
    _vanObj = null;
    _tunnelEntrance = null;
    _perimeterGate = null;
    _tools = [];
    _keysDown = {};
  }

  return { init: init, update: update, reset: reset };

})();
