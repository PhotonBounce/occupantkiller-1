window.BlackSite = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── State ─────────────────────────────────────────────────────────────────────
  var _scene, _camera, _renderer, _clock;
  var _active = false;
  var _container;

  // Key tracking for B+S chord (both within 400ms)
  var _keysDown = {};
  var _bTime = 0;
  var _sTime = 0;

  // Player
  var _player;
  var _playerSpeed = 8;
  var _cameraAngle = 0;
  var _cameraDistance = 26;
  var _cameraHeight = 18;

  // ── Mission state ─────────────────────────────────────────────────────────────
  var _cellsOpen = [];          // array of 9 booleans (3 blocks × 3 cells)
  var _cellKeypads = [];        // keypad meshes
  var _cellDoors = [];          // door meshes
  var _cellCodes = [];          // correct 4-digit codes per cell
  var _clipboards = [];         // guard clipboard meshes
  var _wrongAttempts = [];      // wrong attempt count per cell
  var _hackingCell = -1;        // index of cell being hacked
  var _hackTimer = 0;
  var _interactTimer = 0;
  var _interactTarget = null;

  // Guards
  var _guards = [];             // 16 total patrol guards
  var _shiftTimer = 0;         // rotating shifts every 4 minutes (240s)
  var _shiftWindow = false;    // true during 30s low-presence window
  var _shiftWindowTimer = 0;

  // Cameras & motion detectors
  var _surveillanceCams = [];
  var _motionDetectors = [];

  // Target prisoner (in solitary, deepest cell)
  var _targetPrisoner = null;
  var _targetFound = false;
  var _targetCarried = false;
  var _targetIncapacitated = false;
  var _targetCellIdx = 8;      // last cell = solitary

  // Witness prisoners (2 others)
  var _witnesses = [];
  var _witnessesFreed = 0;
  var _witnessCarried = [];

  // Hard drives (evidence)
  var _hardDrives = [];
  var _drivesDestroyed = 0;
  var _destroyingDrive = -1;
  var _destroyTimer = 0;

  // Extraction
  var _extractionVan = null;
  var _missionDone = false;
  var _missionVariant = '';

  // Alarm / ghost
  var _alarmCount = 0;
  var _killCount = 0;
  var _ghostRating = true;     // becomes false on first alarm or kill
  var _alarmActive = false;
  var _alarmTimer = 0;

  // Score
  var _score = 0;

  // HUD
  var _hud = null;
  var _compass = null;
  var _promptEl = null;
  var _promptTimer = 0;

  // Audio
  var _audioCtx = null;

  // Building refs
  var _serverRoom = null;
  var _interrogationRoom = null;
  var _guardStation = null;
  var _cellBlocks = [];
  var _facility = null;

  // ── Geometry helpers ──────────────────────────────────────────────────────────
  function _box(w, h, d, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function _cyl(rt, rb, h, segs, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), mat);
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
      gain.gain.setValueAtTime(vol || 0.08, _audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + (dur || 0.15));
      osc.start(_audioCtx.currentTime);
      osc.stop(_audioCtx.currentTime + (dur || 0.15));
    } catch (e) { /* silence */ }
  }

  function _alarmBeep() {
    _beep(880, 0.15, 0.18, 'sawtooth');
    setTimeout(function () { if (_active) _beep(660, 0.15, 0.18, 'sawtooth'); }, 200);
  }

  // ── Build world ───────────────────────────────────────────────────────────────
  function _buildFacility() {
    // Ground
    var ground = _box(200, 0.2, 200, 0x222222);
    ground.position.set(0, -0.1, 0);
    _scene.add(ground);

    // Main facility shell BoxGeometry 30x6x20 (0x334433)
    _facility = _box(30, 6, 20, 0x334433);
    _facility.position.set(0, 3, 0);
    _scene.add(_facility);

    // Loading dock area (exterior)
    var dock = _box(14, 0.3, 10, 0x222833);
    dock.position.set(0, 0.15, 18);
    _scene.add(dock);

    // Extraction van BoxGeometry 6x2.5x2.5 (0x334422) in loading dock
    _extractionVan = _box(6, 2.5, 2.5, 0x334422);
    _extractionVan.position.set(0, 1.25, 22);
    _extractionVan.userData = { type: 'extractionVan' };
    _scene.add(_extractionVan);

    // Van label mesh (small marker on top)
    var vanMarker = _box(0.5, 0.3, 0.5, 0x00FF88);
    vanMarker.position.set(0, 2.5, 22);
    vanMarker.userData = { type: 'vanMarker' };
    _scene.add(vanMarker);

    // ── 3 Cell blocks BoxGeometry 12x3x8 (0x443322) ─────────────────────────────
    // Block A: left side
    // Block B: center (deeper)
    // Block C: right side (deepest = solitary)
    var blockPositions = [
      { x: -8, z: -4 },
      { x: 0,  z: -8 },
      { x: 8,  z: -4 }
    ];
    for (var bi = 0; bi < 3; bi++) {
      var bp = blockPositions[bi];
      var block = _box(12, 3, 8, 0x443322);
      block.position.set(bp.x, 1.5, bp.z);
      block.userData = { type: 'cellBlock', blockIdx: bi };
      _scene.add(block);
      _cellBlocks.push(block);

      // 3 cells per block BoxGeometry (0x334422)
      for (var ci = 0; ci < 3; ci++) {
        var cellIdx = bi * 3 + ci;
        var cx = bp.x - 4 + ci * 4;
        var cz = bp.z;
        var cellW = 3.2, cellH = 2.6, cellD = 3.0;

        var cell = _box(cellW, cellH, cellD, 0x334422);
        cell.position.set(cx, cellH / 2, cz);
        cell.userData = { type: 'cell', cellIdx: cellIdx };
        _scene.add(cell);

        // Cell door (colored indicator)
        var door = _box(0.2, 2.2, 0.8, 0x556644);
        door.position.set(cx + cellW / 2, cellH / 2, cz);
        door.userData = { type: 'cellDoor', cellIdx: cellIdx, open: false };
        _scene.add(door);
        _cellDoors.push(door);

        // Keypad BoxGeometry (0x44FF00)
        var keypad = _box(0.3, 0.4, 0.2, 0x44FF00);
        keypad.position.set(cx + cellW / 2 + 0.25, cellH / 2 + 0.3, cz + 0.3);
        keypad.userData = { type: 'keypad', cellIdx: cellIdx };
        _scene.add(keypad);
        _cellKeypads.push(keypad);

        // Assign 4-digit codes
        _cellCodes.push(1000 + Math.floor(Math.random() * 8999));
        _wrongAttempts.push(0);
        _cellsOpen.push(false);
      }
    }

    // Place target prisoner in solitary (cell index 8 = block C, cell 2 deepest)
    var solCell = _cellBlocks[2];
    var solX = solCell.position.x + 4;
    var solZ = solCell.position.z;
    _targetPrisoner = _box(0.8, 1.6, 0.8, 0xFFDDCC);
    _targetPrisoner.position.set(solX, 0.8, solZ);
    _targetPrisoner.userData = {
      type: 'targetPrisoner',
      carried: false,
      incapacitated: false,
      speed: 0.5          // weakened: 50% of base movement
    };
    _scene.add(_targetPrisoner);

    // Place 2 witness prisoners in cells 0 and 4
    var witnessCells = [
      { x: _cellBlocks[0].position.x - 4, z: _cellBlocks[0].position.z },
      { x: _cellBlocks[1].position.x,     z: _cellBlocks[1].position.z }
    ];
    for (var wi = 0; wi < 2; wi++) {
      var wc = witnessCells[wi];
      var witness = _box(0.8, 1.6, 0.8, 0xFFCCBB);
      witness.position.set(wc.x, 0.8, wc.z);
      witness.userData = {
        type: 'witness',
        witnessIdx: wi,
        freed: false,
        carried: false,
        cellIdx: wi === 0 ? 0 : 4
      };
      _scene.add(witness);
      _witnesses.push(witness);
      _witnessCarried.push(false);
    }

    // ── Interrogation room BoxGeometry 8x3x6 (0x223322) ──────────────────────────
    _interrogationRoom = _box(8, 3, 6, 0x223322);
    _interrogationRoom.position.set(-10, 1.5, 2);
    _interrogationRoom.userData = { type: 'interrogationRoom' };
    _scene.add(_interrogationRoom);

    // Interrogation camera CylinderGeometry (0x334455) — ceiling mounted
    var intCam = _cyl(0.15, 0.25, 0.6, 6, 0x334455);
    intCam.position.set(-10, 4.2, 2);
    intCam.userData = { type: 'surveillanceCam', angle: 0, sweepSpeed: 0.6, range: 8 };
    _scene.add(intCam);
    _surveillanceCams.push(intCam);

    // ── Guard station BoxGeometry 6x3x4 (0x445544) ────────────────────────────────
    _guardStation = _box(6, 3, 4, 0x445544);
    _guardStation.position.set(10, 1.5, 4);
    _guardStation.userData = { type: 'guardStation' };
    _scene.add(_guardStation);

    // ── Server room BoxGeometry 10x4x8 (0x334455) ────────────────────────────────
    _serverRoom = _box(10, 4, 8, 0x334455);
    _serverRoom.position.set(8, 2, -8);
    _serverRoom.userData = { type: 'serverRoom' };
    _scene.add(_serverRoom);

    // 3 hard drives BoxGeometry (0x334455) in server room
    for (var di = 0; di < 3; di++) {
      var driveX = 6 + di * 2;
      var drive = _box(0.6, 0.15, 1.0, 0x334455);
      drive.position.set(driveX, 4.1, -8);
      drive.userData = { type: 'hardDrive', driveIdx: di, destroyed: false };
      _scene.add(drive);
      _hardDrives.push(drive);
    }

    // ── Surveillance cameras (5 more around facility) ─────────────────────────────
    var camPositions = [
      { x: -14, y: 5.8, z: -8, sp: 0.4 },
      { x: 14,  y: 5.8, z: -8, sp: 0.5 },
      { x: 0,   y: 5.8, z: 8,  sp: 0.35 },
      { x: -14, y: 5.8, z: 5,  sp: 0.55 },
      { x: 14,  y: 5.8, z: 5,  sp: 0.45 }
    ];
    for (var cami = 0; cami < camPositions.length; cami++) {
      var cp = camPositions[cami];
      var cam = _cyl(0.12, 0.22, 0.5, 6, 0x334455);
      cam.position.set(cp.x, cp.y, cp.z);
      cam.userData = { type: 'surveillanceCam', angle: Math.random() * Math.PI * 2, sweepSpeed: cp.sp, range: 10 };
      _scene.add(cam);
      _surveillanceCams.push(cam);
    }

    // ── Motion detectors BoxGeometry (0x445522) ───────────────────────────────────
    var motPos = [
      { x: -6, y: 0.6, z: 0 },
      { x: 6,  y: 0.6, z: 0 },
      { x: 0,  y: 0.6, z: -6 },
      { x: -8, y: 0.6, z: -10 },
      { x: 8,  y: 0.6, z: -10 }
    ];
    for (var mi = 0; mi < motPos.length; mi++) {
      var mp = motPos[mi];
      var md = _box(0.3, 0.4, 0.3, 0x445522);
      md.position.set(mp.x, mp.y, mp.z);
      md.userData = { type: 'motionDetector', triggered: false, cooldown: 0 };
      _scene.add(md);
      _motionDetectors.push(md);
    }

    // ── Guard clipboards BoxGeometry (0xFFFFAA) on guards (spawned with guards) ──
    // Clipboards placed at guard station and patrol points
    var clipPositions = [
      { x: 10, y: 1.5, z: 3 },
      { x: 12, y: 1.5, z: 4 },
      { x: -10, y: 1.5, z: 1 }
    ];
    for (var ki = 0; ki < 3; ki++) {
      var kp = clipPositions[ki];
      var clip = _box(0.4, 0.05, 0.5, 0xFFFFAA);
      clip.position.set(kp.x, kp.y, kp.z);
      // Store a visible cell index so player can find code
      clip.userData = { type: 'clipboard', cellIdx: ki * 3, codeRevealed: false };
      _scene.add(clip);
      _clipboards.push(clip);
    }

    // ── Lighting ──────────────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x0a1010, 0.6);
    _scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0x889966, 0.5);
    dirLight.position.set(5, 20, 10);
    _scene.add(dirLight);

    // Red emergency lights (off by default, enabled on alarm)
    var ptLight = new THREE.PointLight(0x001a00, 0.8, 40);
    ptLight.position.set(0, 5, 0);
    ptLight.userData = { type: 'facilityLight' };
    _scene.add(ptLight);
  }

  // ── Build guards ──────────────────────────────────────────────────────────────
  function _buildGuards() {
    // 16 guards: BoxGeometry (0x334433) with patrol routes and shift posts
    var routes = [
      // Block A perimeter
      [{ x: -14, z: -8 }, { x: -2, z: -8 }, { x: -2, z: 0 }, { x: -14, z: 0 }],
      [{ x: -14, z: 0 },  { x: -2, z: 0 },  { x: -2, z: 8 }, { x: -14, z: 8 }],
      // Block B perimeter
      [{ x: -4, z: -12 }, { x: 4, z: -12 }, { x: 4, z: -4 }, { x: -4, z: -4 }],
      [{ x: -4, z: -4 },  { x: 4, z: -4 },  { x: 4, z: 4 },  { x: -4, z: 4 }],
      // Block C perimeter (solitary)
      [{ x: 2, z: -8 }, { x: 14, z: -8 }, { x: 14, z: 0 }, { x: 2, z: 0 }],
      [{ x: 2, z: 0 },  { x: 14, z: 0 },  { x: 14, z: 8 }, { x: 2, z: 8 }],
      // Server room
      [{ x: 4, z: -12 }, { x: 14, z: -12 }, { x: 14, z: -4 }, { x: 4, z: -4 }],
      [{ x: 4, z: -4 },  { x: 14, z: -4 },  { x: 14, z: 2 },  { x: 4, z: 2 }],
      // Interrogation + guard station area
      [{ x: -14, z: -2 }, { x: -6, z: -2 }, { x: -6, z: 6 }, { x: -14, z: 6 }],
      [{ x: 6, z: 2 },    { x: 14, z: 2 },  { x: 14, z: 8 }, { x: 6, z: 8 }],
      // Outer perimeter / loading dock
      [{ x: -8, z: 10 }, { x: 8, z: 10 },  { x: 8, z: 18 }, { x: -8, z: 18 }],
      [{ x: -8, z: 14 }, { x: 0, z: 14 },  { x: 0, z: 20 }, { x: -8, z: 20 }],
      // Roving guards
      [{ x: -12, z: -6 }, { x: 0, z: -6 }, { x: 0, z: 6 },  { x: -12, z: 6 }],
      [{ x: 0, z: -6 },   { x: 12, z: -6 }, { x: 12, z: 6 }, { x: 0, z: 6 }],
      [{ x: -6, z: -14 }, { x: 6, z: -14 }, { x: 6, z: -6 }, { x: -6, z: -6 }],
      [{ x: -8, z: 6 },   { x: 8, z: 6 },   { x: 8, z: 14 }, { x: -8, z: 14 }]
    ];

    for (var i = 0; i < 16; i++) {
      var g = _box(0.8, 1.8, 0.8, 0x334433);
      var sp = routes[i][0];
      g.position.set(sp.x, 0.9, sp.z);
      g.userData = {
        type: 'guard',
        route: routes[i],
        routeIdx: 0,
        baseSpeed: 3.5,
        speed: 3.5,
        facing: 0,
        spotTimer: 0,
        downed: false,
        alerted: false,
        alertedPos: null,
        shiftPost: { x: sp.x, z: sp.z },
        onBreak: false      // during shift window, some guards pause
      };

      // Clipboard attached to every 3rd guard (visible on their position)
      if (i % 3 === 0) {
        var clip = _box(0.35, 0.05, 0.45, 0xFFFFAA);
        clip.position.set(0, 0.8, 0.5);
        clip.userData = { type: 'clipboardOnGuard', cellIdx: (i / 3) * 3 };
        g.add(clip);
      }

      _scene.add(g);
      _guards.push(g);
    }
  }

  // ── Build player ──────────────────────────────────────────────────────────────
  function _buildPlayer() {
    _player = _cyl(0.4, 0.4, 1.8, 8, 0x2244AA);
    _player.position.set(0, 0.9, 20);
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
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(_hud);

    // Compass (target direction indicator)
    _compass = document.createElement('div');
    _compass.style.cssText = [
      'position:fixed', 'top:50px', 'right:20px',
      'background:rgba(0,0,0,0.80)',
      'color:#FFAA00',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 12px',
      'border:1px solid #FFAA00',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'text-align:center',
      'min-width:80px'
    ].join(';');
    document.body.appendChild(_compass);

    _promptEl = document.createElement('div');
    _promptEl.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.88)',
      'color:#FFFF00',
      'font-family:monospace',
      'font-size:13px',
      'padding:5px 16px',
      'border:1px solid #FFFF00',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function _updateHUD() {
    if (!_hud) return;

    var cellsOpen = 0;
    for (var ci = 0; ci < _cellsOpen.length; ci++) {
      if (_cellsOpen[ci]) cellsOpen++;
    }

    var guardsUp = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      if (!_guards[gi].userData.downed) guardsUp++;
    }

    var targetStr = _targetCarried ? 'EXTRACTED' : (_targetFound ? 'FOUND/ESCORTING' : 'NOT FOUND');
    var ghostStr = (_alarmCount === 0 && _killCount === 0) ? 'YES' : 'COMPROMISED';

    _hud.textContent =
      'BLACK SITE' +
      ' [CELLS: ' + cellsOpen + '/9]' +
      ' [GUARDS: ' + guardsUp + ']' +
      ' [TARGET: ' + targetStr + ']' +
      ' [EVIDENCE: ' + _drivesDestroyed + '/3 DESTROYED]' +
      ' | GHOST: ' + ghostStr;

    // Compass: point toward target if not yet found/carrying
    if (_compass) {
      if (_missionDone) {
        _compass.innerHTML = 'MISSION<br>COMPLETE';
        _compass.style.color = '#00FF88';
      } else if (_targetCarried || _targetFound) {
        // Point to extraction van
        var dx = _extractionVan.position.x - _player.position.x;
        var dz = _extractionVan.position.z - _player.position.z;
        var ang = Math.atan2(dx, -dz) - _cameraAngle;
        var arr = _compassArrow(ang);
        _compass.innerHTML = 'VAN<br>' + arr;
        _compass.style.color = '#00FF88';
      } else {
        // Point to solitary cell
        var sdx = _cellBlocks[2].position.x + 4 - _player.position.x;
        var sdz = _cellBlocks[2].position.z - _player.position.z;
        var sang = Math.atan2(sdx, -sdz) - _cameraAngle;
        var sarr = _compassArrow(sang);
        _compass.innerHTML = 'TARGET<br>' + sarr;
        _compass.style.color = '#FFAA00';
      }
    }
  }

  function _compassArrow(angle) {
    var normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    var idx = Math.round(normalized / (Math.PI / 4)) % 8;
    return dirs[idx];
  }

  function _showPrompt(text, dur) {
    if (!_promptEl) return;
    _promptEl.textContent = text;
    _promptEl.style.display = 'block';
    _promptTimer = dur || 3;
  }

  // ── Alarm system ──────────────────────────────────────────────────────────────
  function _triggerAlarm(reason) {
    _alarmCount++;
    _ghostRating = false;
    _alarmActive = true;
    _alarmTimer = 30;
    _score -= 300;
    _showPrompt('!! ALARM: ' + (reason || 'Security Breach') + ' !! [SCORE -300]', 5);
    _alarmBeep();
    // Alert all guards
    for (var i = 0; i < _guards.length; i++) {
      if (!_guards[i].userData.downed) {
        _guards[i].userData.alerted = true;
        _guards[i].userData.alertedPos = {
          x: _player.position.x,
          z: _player.position.z
        };
      }
    }
  }

  // ── Guard AI ──────────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;

    // Rotating shifts every 4 minutes (240s), 30s reduced-presence window
    _shiftTimer += dt;
    if (_shiftTimer >= 240) {
      _shiftTimer = 0;
      _shiftWindow = true;
      _shiftWindowTimer = 30;
      _showPrompt('Guard shift change — reduced presence for 30s', 4);
      _beep(440, 0.2, 0.06, 'sine');
    }
    if (_shiftWindow) {
      _shiftWindowTimer -= dt;
      if (_shiftWindowTimer <= 0) {
        _shiftWindow = false;
        // Guards return to full speed
        for (var ri = 0; ri < _guards.length; ri++) {
          _guards[ri].userData.onBreak = false;
          _guards[ri].userData.speed = _guards[ri].userData.baseSpeed;
        }
      } else {
        // During shift: every other guard pauses at current post
        for (var si = 0; si < _guards.length; si++) {
          if (si % 2 === 1) {
            _guards[si].userData.onBreak = true;
            _guards[si].userData.speed = 0;
          }
        }
      }
    }

    // Alarm fade
    if (_alarmActive) {
      _alarmTimer -= dt;
      if (_alarmTimer <= 0) {
        _alarmActive = false;
        for (var ai = 0; ai < _guards.length; ai++) {
          _guards[ai].userData.alerted = false;
          _guards[ai].userData.alertedPos = null;
        }
      }
    }

    for (var i = 0; i < _guards.length; i++) {
      var g = _guards[i];
      if (g.userData.downed) continue;
      if (g.userData.onBreak && !g.userData.alerted) continue;

      var gx = g.position.x, gz = g.position.z;
      var dx = px - gx, dz = pz - gz;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (g.userData.alerted && g.userData.alertedPos) {
        // Move toward last known player position
        var tgt = g.userData.alertedPos;
        var tdx = tgt.x - gx, tdz = tgt.z - gz;
        var td = Math.sqrt(tdx * tdx + tdz * tdz);
        if (td > 1) {
          var gs = g.userData.baseSpeed * 1.6 * dt;
          g.position.x += (tdx / td) * gs;
          g.position.z += (tdz / td) * gs;
          g.rotation.y = Math.atan2(tdx, tdz);
          g.userData.facing = g.rotation.y;
        } else {
          // Reached last known — scan area
          g.userData.alertedPos = null;
        }
      } else {
        // Normal patrol
        var route = g.userData.route;
        var rtgt = route[g.userData.routeIdx];
        var rdx = rtgt.x - gx, rdz = rtgt.z - gz;
        var rd = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rd < 0.5) {
          g.userData.routeIdx = (g.userData.routeIdx + 1) % route.length;
        } else {
          var spd = (g.userData.speed || g.userData.baseSpeed) * dt;
          g.position.x += (rdx / rd) * spd;
          g.position.z += (rdz / rd) * spd;
          g.rotation.y = Math.atan2(rdx, rdz);
          g.userData.facing = g.rotation.y;
        }
      }

      // Detection: 50-deg FOV, range 14
      var fwd = { x: Math.sin(g.userData.facing), z: Math.cos(g.userData.facing) };
      var toPlayer = dist > 0.01 ? { x: dx / dist, z: dz / dist } : { x: 0, z: 1 };
      var dot = fwd.x * toPlayer.x + fwd.z * toPlayer.z;
      var fovHalf = Math.cos(Math.PI * 50 / 360);
      var range = 14;
      var detected = (dot > fovHalf && dist < range) || (dist < 2.5);

      if (detected) {
        g.userData.spotTimer += dt;
        if (g.userData.spotTimer > 1.5) {
          _triggerAlarm('Guard spotted player');
          g.userData.alertedPos = { x: px, z: pz };
        }
      } else {
        g.userData.spotTimer = Math.max(0, g.userData.spotTimer - dt * 0.5);
      }
    }

    // Surveillance cameras sweep
    for (var ci = 0; ci < _surveillanceCams.length; ci++) {
      var cam = _surveillanceCams[ci];
      cam.userData.angle += cam.userData.sweepSpeed * dt;
      cam.rotation.y = cam.userData.angle;

      // Check if player in camera arc
      var camX = cam.position.x, camZ = cam.position.z;
      var pdx = px - camX, pdz = pz - camZ;
      var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pdist < cam.userData.range) {
        var cfwd = { x: Math.sin(cam.userData.angle), z: Math.cos(cam.userData.angle) };
        var cToP = pdist > 0.01 ? { x: pdx / pdist, z: pdz / pdist } : { x: 0, z: 1 };
        var cdot = cfwd.x * cToP.x + cfwd.z * cToP.z;
        if (cdot > Math.cos(Math.PI / 4)) {
          _triggerAlarm('Camera detected movement');
        }
      }
    }

    // Motion detectors
    for (var mdi = 0; mdi < _motionDetectors.length; mdi++) {
      var md = _motionDetectors[mdi];
      if (md.userData.cooldown > 0) {
        md.userData.cooldown -= dt;
        continue;
      }
      var mdd = _dist2(md.position, _player.position);
      if (mdd < 3) {
        md.userData.triggered = true;
        md.userData.cooldown = 10;
        _triggerAlarm('Motion detector triggered');
      }
    }
  }

  // ── Player movement ────────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    var moved = false;
    var spd = _playerSpeed * dt;

    // Carrying target or witness reduces speed
    if (_targetCarried) spd *= 0.6;
    if (_witnessCarried[0] || _witnessCarried[1]) spd *= 0.8;

    // Drag incapacitated target with E+move at 0.4x
    var dragging = _targetIncapacitated && _targetFound && _keysDown['KeyE'];
    if (dragging) spd *= 0.4;

    var fx = Math.sin(_cameraAngle);
    var fz = Math.cos(_cameraAngle);
    var rx = Math.sin(_cameraAngle + Math.PI / 2);
    var rz = Math.cos(_cameraAngle + Math.PI / 2);

    var moveX = 0, moveZ = 0;
    if (_keysDown['KeyW'] || _keysDown['ArrowUp'])    { moveX -= fx; moveZ -= fz; moved = true; }
    if (_keysDown['KeyS'] || _keysDown['ArrowDown'])  { moveX += fx; moveZ += fz; moved = true; }
    if (_keysDown['KeyA'] || _keysDown['ArrowLeft'])  { moveX -= rx; moveZ -= rz; moved = true; }
    if (_keysDown['KeyD'] || _keysDown['ArrowRight']) { moveX += rx; moveZ += rz; moved = true; }

    if (moved) {
      var ml = Math.sqrt(moveX * moveX + moveZ * moveZ);
      _player.position.x += (moveX / ml) * spd;
      _player.position.z += (moveZ / ml) * spd;
      _player.rotation.y = Math.atan2(moveX, moveZ);
    }

    // Camera orbit
    if (_keysDown['KeyQ']) _cameraAngle -= dt * 1.2;
    if (_keysDown['KeyZ']) _cameraAngle += dt * 1.2;

    _camera.position.x = _player.position.x + Math.sin(_cameraAngle) * _cameraDistance;
    _camera.position.z = _player.position.z + Math.cos(_cameraAngle) * _cameraDistance;
    _camera.position.y = _cameraHeight;
    _camera.lookAt(_player.position.x, 1, _player.position.z);

    // Carry target along
    if (_targetCarried && _targetPrisoner) {
      _targetPrisoner.position.x = _player.position.x + 1.0;
      _targetPrisoner.position.z = _player.position.z;
      _targetPrisoner.position.y = 0.8;
    }
    if (dragging && _targetPrisoner) {
      _targetPrisoner.position.x = _player.position.x + 1.2;
      _targetPrisoner.position.z = _player.position.z;
    }
    // Carry witnesses
    for (var wi = 0; wi < 2; wi++) {
      if (_witnessCarried[wi] && _witnesses[wi]) {
        _witnesses[wi].position.x = _player.position.x - 1.0 - wi * 1.0;
        _witnesses[wi].position.z = _player.position.z;
        _witnesses[wi].position.y = 0.8;
      }
    }
  }

  // ── Interactions ──────────────────────────────────────────────────────────────
  function _checkInteractions(dt) {
    var px = _player.position.x;
    var pz = _player.position.z;
    var py = _player.position.y;

    // Press E to interact
    var eHeld = _keysDown['KeyE'];
    var ePressed = _keysDown['_e_just'];

    // ── Clipboard pickup (read cell code) ──────────────────────────────────────
    for (var ki = 0; ki < _clipboards.length; ki++) {
      var clip = _clipboards[ki];
      if (clip.userData.codeRevealed) continue;
      if (_dist2({ x: px, z: pz }, clip.position) < 2.5) {
        if (ePressed) {
          clip.userData.codeRevealed = true;
          var cidx = clip.userData.cellIdx;
          _showPrompt('Clipboard: Cell ' + (cidx + 1) + ' code = ' + _cellCodes[cidx], 6);
          _beep(660, 0.1, 0.07, 'sine');
        } else {
          _showPrompt('E: Read clipboard (cell code)', 0.5);
        }
      }
    }

    // Clipboard on guards
    for (var gi = 0; gi < _guards.length; gi++) {
      var gu = _guards[gi];
      if (gu.userData.downed && _dist2({ x: px, z: pz }, gu.position) < 2) {
        if (ePressed) {
          var gcidx = (Math.floor(gi / 3)) * 3;
          if (gcidx < 9) {
            _showPrompt('Guard clipboard: Cell ' + (gcidx + 1) + ' code = ' + _cellCodes[gcidx], 6);
            _beep(660, 0.1, 0.07, 'sine');
          }
        } else {
          _showPrompt('E: Search downed guard for clipboard', 0.5);
        }
      }
    }

    // ── Cell keypads ──────────────────────────────────────────────────────────
    for (var ci = 0; ci < _cellKeypads.length; ci++) {
      var kp = _cellKeypads[ci];
      if (_cellsOpen[ci]) continue;
      if (_dist2({ x: px, z: pz }, kp.position) < 2.5) {
        if (_hackingCell === ci) {
          // Continue hacking
          _hackTimer += dt;
          _showPrompt('Hacking keypad... ' + (_hackTimer).toFixed(1) + '/12s [E: hold]', 0.5);
          if (_hackTimer >= 12) {
            _openCell(ci, 'Hacked');
            _hackingCell = -1;
            _hackTimer = 0;
          }
        } else if (eHeld) {
          // Start hack (no code)
          _hackingCell = ci;
          _hackTimer = 0;
          _showPrompt('Hacking keypad — hold E for 12s...', 0.5);
        } else if (ePressed) {
          // Try code (simulate: ask for last clipboard-revealed code match)
          var found = false;
          for (var ki2 = 0; ki2 < _clipboards.length; ki2++) {
            if (_clipboards[ki2].userData.codeRevealed &&
                _clipboards[ki2].userData.cellIdx === ci) {
              found = true;
              break;
            }
          }
          if (found) {
            _openCell(ci, 'Code entered');
            _wrongAttempts[ci] = 0;
          } else {
            _wrongAttempts[ci]++;
            _showPrompt('Wrong code! Attempt ' + _wrongAttempts[ci] + '/3', 3);
            _beep(220, 0.2, 0.1, 'sawtooth');
            if (_wrongAttempts[ci] >= 3) {
              _triggerAlarm('Wrong keypad code 3x — alarm!');
            }
          }
        } else {
          _showPrompt('E: Try code (read clipboard first) | E-hold: Hack (12s)', 0.5);
        }
        // Break out of hack if E released
        if (!eHeld && _hackingCell === ci) {
          _hackingCell = -1;
          _hackTimer = 0;
        }
      }
    }
    // Cancel hack if moved away
    if (_hackingCell >= 0) {
      var hkp = _cellKeypads[_hackingCell];
      if (_dist2({ x: px, z: pz }, hkp.position) >= 2.5) {
        _hackingCell = -1;
        _hackTimer = 0;
      }
    }

    // ── Target prisoner pickup ────────────────────────────────────────────────
    if (_targetPrisoner && !_targetCarried) {
      var td = _dist2({ x: px, z: pz }, _targetPrisoner.position);
      if (td < 2.5 && _cellsOpen[_targetCellIdx]) {
        if (!_targetFound) {
          _targetFound = true;
          _showPrompt('TARGET FOUND — prisoner is weakened! E: Carry', 5);
          _beep(880, 0.3, 0.1, 'sine');
        }
        if (ePressed) {
          _targetCarried = true;
          _showPrompt('Carrying target prisoner to extraction van!', 4);
        } else if (!_targetIncapacitated) {
          _showPrompt('E: Carry target prisoner | [WEAKENED — 50% speed]', 0.5);
        } else {
          _showPrompt('E+MOVE: Drag incapacitated prisoner (0.4x speed)', 0.5);
        }
      }
    }
    if (_targetCarried && ePressed) {
      // Put down
      _targetCarried = false;
      _showPrompt('Set down prisoner', 2);
    }

    // ── Witness prisoners ─────────────────────────────────────────────────────
    for (var wi2 = 0; wi2 < 2; wi2++) {
      var wpr = _witnesses[wi2];
      if (!wpr || wpr.userData.freed) continue;
      var wCellIdx = wpr.userData.cellIdx;
      if (!_cellsOpen[wCellIdx]) continue;
      var wd = _dist2({ x: px, z: pz }, wpr.position);
      if (wd < 2.5) {
        if (ePressed && !_witnessCarried[wi2]) {
          wpr.userData.freed = true;
          _witnessCarried[wi2] = true;
          _witnessesFreed++;
          _showPrompt('Witness prisoner freed! Escort to van (+500 bonus). Harder to manage 3!', 5);
          _beep(660, 0.2, 0.08, 'sine');
        } else if (!_witnessCarried[wi2]) {
          _showPrompt('E: Free witness prisoner (they will testify, +500)', 0.5);
        }
      }
    }
    for (var wi3 = 0; wi3 < 2; wi3++) {
      if (_witnessCarried[wi3] && ePressed) {
        // Put down
        _witnessCarried[wi3] = false;
        _witnesses[wi3].userData.freed = true;
        _showPrompt('Set down witness', 2);
      }
    }

    // ── Hard drive destruction ────────────────────────────────────────────────
    for (var di = 0; di < _hardDrives.length; di++) {
      var drv = _hardDrives[di];
      if (drv.userData.destroyed) continue;
      if (_dist3({ x: px, y: py, z: pz }, drv.position) < 3) {
        if (_destroyingDrive === di) {
          _destroyTimer += dt;
          _showPrompt('Smashing drive ' + (di + 1) + '... ' + _destroyTimer.toFixed(1) + '/3s', 0.5);
          if (_destroyTimer >= 3) {
            _destroyDrive(di);
            _destroyingDrive = -1;
            _destroyTimer = 0;
          }
        } else if (eHeld) {
          _destroyingDrive = di;
          _destroyTimer = 0;
        } else {
          _showPrompt('E-hold: Smash hard drive (3s) to destroy evidence | Or shoot it', 0.5);
        }
        if (!eHeld && _destroyingDrive === di) {
          _destroyingDrive = -1;
          _destroyTimer = 0;
        }
      }
    }
    if (_destroyingDrive >= 0) {
      var ddrv = _hardDrives[_destroyingDrive];
      if (_dist3({ x: px, y: py, z: pz }, ddrv.position) >= 3) {
        _destroyingDrive = -1;
        _destroyTimer = 0;
      }
    }

    // ── Shoot hard drive (F key) ──────────────────────────────────────────────
    if (_keysDown['_f_just']) {
      for (var dsi = 0; dsi < _hardDrives.length; dsi++) {
        var dsrv = _hardDrives[dsi];
        if (!dsrv.userData.destroyed && _dist3({ x: px, y: py, z: pz }, dsrv.position) < 5) {
          _destroyDrive(dsi);
          _triggerAlarm('Gunshot in server room');
          _killCount++;
          _score -= 100;
          break;
        }
      }
    }

    // ── Extraction van ─────────────────────────────────────────────────────────
    if (_extractionVan && !_missionDone) {
      var vd = _dist2({ x: px, z: pz }, _extractionVan.position);
      if (vd < 4) {
        if (_targetCarried || (_targetFound && _targetIncapacitated)) {
          _completeMission();
        } else if (_targetFound) {
          _showPrompt('Carry target to van! (E: pick up)', 0.5);
        } else {
          _showPrompt('Reach target prisoner first — use compass', 0.5);
        }
      }
    }

    // ── Guard knockout (F key while adjacent) ────────────────────────────────
    if (_keysDown['_f_just']) {
      for (var gki = 0; gki < _guards.length; gki++) {
        var gk = _guards[gki];
        if (!gk.userData.downed && _dist2({ x: px, z: pz }, gk.position) < 2) {
          gk.userData.downed = true;
          gk.position.y = 0.2;
          gk.rotation.z = Math.PI / 2;
          _killCount++;
          _ghostRating = false;
          _score -= 100;
          _showPrompt('Guard neutralized [GHOST: COMPROMISED] [SCORE -100]', 3);
          _beep(200, 0.25, 0.1, 'sawtooth');
          break;
        }
      }
    }
  }

  function _openCell(cellIdx, method) {
    _cellsOpen[cellIdx] = true;
    if (_cellDoors[cellIdx]) {
      _cellDoors[cellIdx].position.y = 3.5;
      _cellDoors[cellIdx].material.color.setHex(0x22AA44);
    }
    _showPrompt('Cell ' + (cellIdx + 1) + ' open! (' + method + ')', 4);
    _beep(880, 0.1, 0.08, 'sine');
  }

  function _destroyDrive(driveIdx) {
    var drv = _hardDrives[driveIdx];
    drv.userData.destroyed = true;
    drv.material.color.setHex(0x111111);
    drv.position.y -= 0.1;
    _drivesDestroyed++;
    _showPrompt('Hard drive ' + (driveIdx + 1) + ' DESTROYED! [' + _drivesDestroyed + '/3]', 4);
    _beep(330, 0.3, 0.1, 'sawtooth');
    if (_drivesDestroyed >= 3) {
      _showPrompt('ALL EVIDENCE DESTROYED! Files gone. Mission success variant available!', 6);
      _beep(660, 0.4, 0.12, 'sine');
      setTimeout(function () { if (_active) _beep(880, 0.4, 0.12, 'sine'); }, 300);
    }
  }

  function _completeMission() {
    _missionDone = true;
    var baseScore = 2000;

    // Ghost bonus
    if (_alarmCount === 0 && _killCount === 0) {
      baseScore += 3000;
      _missionVariant = 'GHOST (+3000)';
    } else {
      baseScore -= _alarmCount * 300;
      baseScore -= _killCount * 100;
      _missionVariant = 'COMPROMISED';
    }

    // Evidence bonus
    if (_drivesDestroyed >= 3) baseScore += 1000;

    // Witness bonus
    var witBonus = 0;
    for (var wi = 0; wi < 2; wi++) {
      if (_witnessCarried[wi] || (_witnesses[wi] && _witnesses[wi].userData.freed)) {
        witBonus += 500;
      }
    }
    baseScore += witBonus;

    _score = baseScore;

    var msg = 'TARGET EXTRACTED! Score: ' + _score +
      ' | ' + _missionVariant +
      (witBonus > 0 ? ' | WITNESSES: +' + witBonus : '') +
      (_drivesDestroyed >= 3 ? ' | EVIDENCE DESTROYED' : '') +
      ' | ESC to exit';
    _showPrompt(msg, 20);
    _updateHUD();
    _beep(880, 0.5, 0.15, 'sine');
    setTimeout(function () { if (_active) _beep(1100, 0.4, 0.15, 'sine'); }, 400);
    setTimeout(function () { if (_active) _beep(1320, 0.6, 0.15, 'sine'); }, 800);

    // Evidence-only success variant (even if extraction fails = already at van here)
    if (_drivesDestroyed >= 3 && _missionVariant === 'COMPROMISED') {
      setTimeout(function () {
        if (_active) _showPrompt('EVIDENCE DESTROYED — alternate mission success!', 10);
      }, 2000);
    }
  }

  // ── Animate items ─────────────────────────────────────────────────────────────
  function _animateItems(dt) {
    var t = Date.now() * 0.001;
    // Bob keypads
    for (var ki = 0; ki < _cellKeypads.length; ki++) {
      if (!_cellsOpen[ki]) {
        _cellKeypads[ki].material.color.setHex(0x44FF00);
      } else {
        _cellKeypads[ki].material.color.setHex(0x006600);
      }
    }
    // Rotate extraction van marker
    if (_extractionVan) {
      var marker = _scene.getObjectByProperty
        ? null : null; // skip — we animate it in _buildFacility's ref
    }
    // Pulse hard drives
    for (var di = 0; di < _hardDrives.length; di++) {
      if (!_hardDrives[di].userData.destroyed) {
        var pulse = 0.5 + 0.5 * Math.sin(t * 3 + di);
        _hardDrives[di].material.color.setHex(
          new THREE.Color(0, 0.1 + pulse * 0.3, 0.5 + pulse * 0.2).getHex()
        );
      }
    }
  }

  // ── Main loop ─────────────────────────────────────────────────────────────────
  function _loop() {
    if (!_active) return;
    requestAnimationFrame(_loop);

    var dt = Math.min(_clock.getDelta(), 0.05);

    _updatePlayer(dt);
    _updateGuards(dt);
    _checkInteractions(dt);
    _animateItems(dt);
    _updateHUD();

    // Prompt fade
    if (_promptTimer > 0) {
      _promptTimer -= dt;
      if (_promptTimer <= 0 && _promptEl) _promptEl.style.display = 'none';
    }

    // Reset one-shot keys
    _keysDown['_e_just'] = false;
    _keysDown['_f_just'] = false;

    _renderer.render(_scene, _camera);
  }

  // ── Key events ────────────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (_keysDown[e.code]) return; // already held

    _keysDown[e.code] = true;

    if (e.code === 'KeyB') _bTime = Date.now();
    if (e.code === 'KeyS') _sTime = Date.now();

    if (!_active) {
      // Check B+S chord
      if (_keysDown['KeyB'] && _keysDown['KeyS']) {
        if (Math.abs(_bTime - _sTime) < 400) _init();
      }
      return;
    }

    if (e.code === 'KeyE') _keysDown['_e_just'] = true;
    if (e.code === 'KeyF') _keysDown['_f_just'] = true;
    if (e.code === 'Escape') reset();
  }

  function _onKeyUp(e) {
    _keysDown[e.code] = false;
    if (e.code === 'KeyE') _keysDown['_e_just'] = false;
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

    // Reset state
    _cellsOpen = [];
    _cellKeypads = [];
    _cellDoors = [];
    _cellCodes = [];
    _clipboards = [];
    _wrongAttempts = [];
    _hackingCell = -1;
    _hackTimer = 0;
    _interactTimer = 0;
    _interactTarget = null;
    _guards = [];
    _shiftTimer = 0;
    _shiftWindow = false;
    _shiftWindowTimer = 0;
    _surveillanceCams = [];
    _motionDetectors = [];
    _targetPrisoner = null;
    _targetFound = false;
    _targetCarried = false;
    _targetIncapacitated = false;
    _witnesses = [];
    _witnessesFreed = 0;
    _witnessCarried = [false, false];
    _hardDrives = [];
    _drivesDestroyed = 0;
    _destroyingDrive = -1;
    _destroyTimer = 0;
    _extractionVan = null;
    _missionDone = false;
    _missionVariant = '';
    _alarmCount = 0;
    _killCount = 0;
    _ghostRating = true;
    _alarmActive = false;
    _alarmTimer = 0;
    _score = 0;
    _keysDown = {};
    _bTime = 0;
    _sTime = 0;
    _cameraAngle = 0;
    _cellBlocks = [];
    _facility = null;
    _serverRoom = null;
    _interrogationRoom = null;
    _guardStation = null;

    _container = document.createElement('div');
    _container.id = 'black-site-container';
    _container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#000;';
    document.body.appendChild(_container);

    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _container.appendChild(_renderer.domElement);

    _scene = new THREE.Scene();
    _scene.background = new THREE.Color(0x050a05);
    _scene.fog = new THREE.Fog(0x050a05, 40, 120);

    _camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    _camera.position.set(0, _cameraHeight, 20 + _cameraDistance);

    _clock = new THREE.Clock();

    _initAudio();
    _buildFacility();
    _buildGuards();
    _buildPlayer();
    _buildHUD();

    window.addEventListener('keydown', _onKeyDown);
    window.addEventListener('keyup', _onKeyUp);
    window.addEventListener('resize', _onResize);

    _showPrompt(
      'BLACK SITE — WASD:move  E:interact/carry  E-hold:hack/smash  F:shoot/knockout  Q/Z:camera  ESC:quit' +
      ' | Reach solitary cell (compass), free target, extract to van',
      10
    );

    _loop();
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */
 _init(); }

  function update() { /* loop is self-driven */ }

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
    if (_compass && _compass.parentNode) {
      _compass.parentNode.removeChild(_compass);
      _compass = null;
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
    _surveillanceCams = [];
    _motionDetectors = [];
    _cellKeypads = [];
    _cellDoors = [];
    _cellCodes = [];
    _clipboards = [];
    _hardDrives = [];
    _witnesses = [];
    _witnessCarried = [false, false];
    _cellsOpen = [];
    _wrongAttempts = [];
    _cellBlocks = [];
    _targetPrisoner = null;
    _extractionVan = null;
    _keysDown = {};
  }

  return { init: init, update: update, reset: reset };

})();
