// ============================================================
//  football-stadium.js — Football Stadium Bomb Defuse Module
//  Features:
//    1. F+S simultaneous keypress (both within 400ms) to activate
//    2. Football stadium with field, concourses, tunnels, control room
//    3. 4 bombs planted by terrorist cell — 8-minute countdown
//    4. 12 disguised terrorists (stadium staff vests), 1 leader
//    5. 200 panicking civilians with crowd physics
//    6. Bomb disarm: hold E 8s near each bomb
//    7. Terrorist identification by behavior (approaching bomb / radioing)
//    8. Detonator: shoot out of leader's hand OR reach in 5s
//    9. Control room terminal: E 4s to disable remaining bombs
//   10. Emergency PA panels to evacuate sections
//   11. HUD: STADIUM [BOMBS: N/4] [TIMER: MM:SS] [TERRORISTS: N]
//           [LEADER: ACTIVE/DEAD] [CIVILIANS: N SAFE]
//  Public API: { init(scene, camera, renderer), update(delta), reset() }
// ============================================================
window.FootballStadium = (function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────
  var ACTIVATION_WINDOW   = 0.4;   // seconds between F and S keypresses
  var MISSION_TIME        = 480;   // 8 minutes in seconds
  var BOMB_DISARM_TIME    = 8.0;   // seconds E must be held
  var TERMINAL_USE_TIME   = 4.0;   // seconds E at control room terminal
  var PA_PANEL_TIME       = 2.0;   // seconds E at PA panel
  var INTERACT_RANGE      = 3.0;   // interaction distance
  var SHOOT_RANGE         = 25.0;  // shooting range
  var LEADER_DETONATOR_TIME = 5.0; // seconds after last bomb to reach leader
  var CIVILIAN_PENALTY    = -500;  // score penalty per civilian shot
  var SCORE_BOMB_DISARMED = 1000;
  var SCORE_TERRORIST_DOWN= 300;
  var SCORE_LEADER_DOWN   = 1500;
  var SCORE_WIN           = 5000;

  var NUM_TERRORISTS      = 12;
  var NUM_CIVILIANS       = 200;
  var TERRORIST_HP        = 70;
  var LEADER_HP           = 300;
  var CIVILIANS_SAFE_START= 60000; // 60,000-seat stadium

  // Colors
  var COLOR_TURF          = 0x226622;
  var COLOR_LOWER         = 0x665555;
  var COLOR_UPPER         = 0x665544;
  var COLOR_TUNNEL        = 0x445544;
  var COLOR_CONTROL       = 0x445566;
  var COLOR_BOMB          = 0xFF2200;
  var COLOR_TERRORIST     = 0x446644;
  var COLOR_LEADER        = 0x332211;
  var COLOR_CIVILIAN      = 0x886655;
  var COLOR_CROWD         = 0x888866;
  var COLOR_GOALPOST      = 0xCCAA00;
  var COLOR_CONCOURSE     = 0x554444;
  var COLOR_STALL         = 0x998877;
  var COLOR_GLASS         = 0x88AACC;
  var COLOR_KEY           = 0xFFDD00;
  var COLOR_DETONATOR     = 0xFF2200;
  var COLOR_PA_PANEL      = 0x3366FF;
  var COLOR_TERMINAL      = 0x334466;
  var COLOR_TRUCK         = 0x444444;
  var COLOR_DISH          = 0x888888;
  var COLOR_SEAT_BLOCK    = 0x334477;
  var COLOR_SEAT_LOWER    = 0x553322;

  // ── State ───────────────────────────────────────────────────
  var _scene              = null;
  var _camera             = null;
  var _renderer           = null;
  var _active             = false;
  var _inited             = false;
  var _addedKeys          = false;

  // Activation timing
  var _fPressTime         = -999;
  var _sPressTime         = -999;

  // Mission state
  var _missionTime        = MISSION_TIME;
  var _gameOver           = false;
  var _gameWon            = false;
  var _score              = 0;
  var _civiliansAlive     = CIVILIANS_SAFE_START;

  // Bombs
  var _bombs              = [];
  var _bombsDisarmed      = 0;
  var _bombsExploded      = 0;

  // Terrorists
  var _terrorists         = [];
  var _terroristCount     = 0;
  var _leader             = null;
  var _leaderDead         = false;
  var _leaderDetonating   = false;
  var _leaderDetonateTimer= 0;
  var _lastBombDisarmedTime = 0;
  var _allBombsJustDisarmed = false;

  // Crowd
  var _crowdObjects       = [];
  var _panicZones         = [];  // {x, z, radius, time}
  var _sectionEvacuated   = [false, false, false, false]; // N,S,E,W sections

  // Interactables
  var _paPanel            = null;
  var _terminal           = null;
  var _keyItem            = null;
  var _keyPickedUp        = false;
  var _detonatorObj       = null;
  var _detonatorShot      = false;

  // Locks
  var _bomb2Locked        = true;

  // Player interaction
  var _eDown              = false;
  var _eHeldTime          = 0;
  var _eTarget            = null;  // current interaction target

  // Input
  var _keys               = {};
  var _mouseDown          = false;
  var _lastShotTime       = -999;
  var _shootCooldown      = 0.25;

  // Three.js objects
  var _group              = null;
  var _hudEl              = null;
  var _overlayEl          = null;
  var _interactPromptEl   = null;
  var _progressEl         = null;
  var _progressBarEl      = null;

  // ── Audio helpers ───────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { window._audioCtx = new Ctx(); return window._audioCtx; }
    } catch (e) {}
    return null;
  }

  function _playTone(freq, duration, type, volume) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (e) {}
  }

  function _playBeep() { _playTone(880, 0.08, 'square', 0.18); }

  function _playAlarm() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.41);
    } catch (e) {}
  }

  function _playExplosion() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = ctx.sampleRate * 1.5;
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 2.0;
      src.start();
    } catch (e) {}
  }

  function _playGunshot() {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var bufLen = Math.floor(ctx.sampleRate * 0.15);
      var buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3) * 1.5;
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var gain = ctx.createGain();
      src.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 1.0;
      src.start();
    } catch (e) {}
  }

  function _playSuccess() {
    var notes = [523, 659, 784, 1047];
    for (var n = 0; n < notes.length; n++) {
      (function (freq, delay) {
        var ctx = _getAudioCtx();
        if (!ctx) return;
        try {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.31);
        } catch (e) {}
      }(notes[n], n * 0.15));
    }
  }

  // ── HUD ─────────────────────────────────────────────────────
  function _ensureHUD() {
    if (document.getElementById('fs-hud')) return;

    _hudEl = document.createElement('div');
    _hudEl.id = 'fs-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:14px',
      'font-weight:bold',
      'color:#00FF88',
      'text-shadow:0 0 8px #00FF88,0 0 2px #000',
      'z-index:3000',
      'pointer-events:none',
      'user-select:none',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 14px',
      'border:1px solid #00FF88',
      'border-radius:4px',
      'white-space:nowrap',
      'display:none',
    ].join(';');
    document.body.appendChild(_hudEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'fs-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'color:#ffffff',
      'text-shadow:0 0 20px #FF2200',
      'z-index:4000',
      'pointer-events:none',
      'text-align:center',
      'display:none',
    ].join(';');
    document.body.appendChild(_overlayEl);

    _interactPromptEl = document.createElement('div');
    _interactPromptEl.id = 'fs-interact';
    _interactPromptEl.style.cssText = [
      'position:fixed',
      'bottom:120px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'color:#FFE566',
      'text-shadow:0 0 6px #FFE566',
      'z-index:3000',
      'pointer-events:none',
      'display:none',
    ].join(';');
    document.body.appendChild(_interactPromptEl);

    _progressEl = document.createElement('div');
    _progressEl.id = 'fs-progress-wrap';
    _progressEl.style.cssText = [
      'position:fixed',
      'bottom:95px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:220px',
      'z-index:3000',
      'pointer-events:none',
      'display:none',
    ].join(';');
    var progressLabel = document.createElement('div');
    progressLabel.style.cssText = 'font-family:monospace;font-size:12px;color:#FFE566;text-align:center;margin-bottom:3px;';
    progressLabel.id = 'fs-progress-label';
    _progressEl.appendChild(progressLabel);
    var progressTrack = document.createElement('div');
    progressTrack.style.cssText = 'background:rgba(255,255,255,0.2);height:10px;border-radius:5px;overflow:hidden;';
    _progressBarEl = document.createElement('div');
    _progressBarEl.style.cssText = 'height:100%;background:#00FF88;width:0%;transition:width 0.05s;';
    progressTrack.appendChild(_progressBarEl);
    _progressEl.appendChild(progressTrack);
    document.body.appendChild(_progressEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;
    var mins = Math.floor(_missionTime / 60);
    var secs = Math.floor(_missionTime % 60);
    var timerStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var timerColor = _missionTime < 60 ? '#FF2200' : (_missionTime < 120 ? '#FFAA00' : '#00FF88');
    _hudEl.style.color = timerColor;
    _hudEl.style.textShadow = '0 0 8px ' + timerColor;
    _hudEl.style.borderColor = timerColor;
    var leaderStatus = _leaderDead ? 'DEAD' : (_leaderDetonating ? '<span style="color:#FF2200">DETONATING!</span>' : 'ACTIVE');
    _hudEl.innerHTML = 'STADIUM  [BOMBS: ' + _bombsDisarmed + '/4 DISARMED]' +
      '  [TIMER: ' + timerStr + ']' +
      '  [TERRORISTS: ' + _terroristCount + ']' +
      '  [LEADER: ' + leaderStatus + ']' +
      '  [CIVILIANS: ' + _civiliansAlive + ' SAFE]';
  }

  function _showOverlay(msg, color) {
    if (!_overlayEl) return;
    _overlayEl.style.color = color || '#ffffff';
    _overlayEl.style.textShadow = '0 0 20px ' + (color || '#ffffff');
    _overlayEl.innerHTML = msg;
    _overlayEl.style.display = 'block';
  }

  function _hideOverlay() {
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  function _showPrompt(msg) {
    if (!_interactPromptEl) return;
    if (msg) {
      _interactPromptEl.textContent = msg;
      _interactPromptEl.style.display = 'block';
    } else {
      _interactPromptEl.style.display = 'none';
    }
  }

  function _showProgress(label, pct) {
    if (!_progressEl) return;
    if (label !== null) {
      document.getElementById('fs-progress-label').textContent = label;
      _progressBarEl.style.width = (pct * 100) + '%';
      _progressEl.style.display = 'block';
    } else {
      _progressEl.style.display = 'none';
    }
  }

  // ── Geometry helpers ────────────────────────────────────────
  function _box(w, h, d, color, x, y, z, rx, ry, rz) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    return mesh;
  }

  function _cylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _sphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _cone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    return mesh;
  }

  function _lineSegments(points, color) {
    var positions = [];
    for (var i = 0; i < points.length; i++) {
      positions.push(points[i][0], points[i][1], points[i][2]);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    var mat = new THREE.LineSegmentsGeometry
      ? new THREE.LineSegmentsGeometry()
      : null;
    // Fallback: use LineSegments with LineBasicMaterial
    var lineMat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, lineMat);
  }

  // ── Bomb mesh builder ───────────────────────────────────────
  function _buildBomb(wx, wy, wz) {
    var grp = new THREE.Group();
    var body = _box(0.6, 0.4, 0.4, COLOR_BOMB, 0, 0, 0);
    grp.add(body);
    // LED indicator (small box on top)
    var led = _box(0.1, 0.08, 0.1, 0xFFFFFF, 0, 0.24, 0);
    led.name = 'led';
    grp.add(led);
    // Wire bundle
    var wire = _box(0.5, 0.04, 0.04, 0x222222, 0, -0.1, 0.22);
    grp.add(wire);
    // Point light
    var light = new THREE.PointLight(COLOR_BOMB, 1.5, 4);
    light.name = 'bombLight';
    grp.add(light);
    grp.position.set(wx, wy, wz);
    return grp;
  }

  // ── Stadium builder ─────────────────────────────────────────
  function _buildStadium() {
    _group = new THREE.Group();

    // ── Field level ────────────────────────────────────────
    // Turf 80x1x50
    var turf = _box(80, 1, 50, COLOR_TURF, 0, -0.5, 0);
    _group.add(turf);

    // Field lines (lighter green stripes)
    for (var ln = -3; ln <= 3; ln++) {
      var line = _box(80, 1.01, 0.15, 0x33AA33, 0, -0.5, ln * 7);
      _group.add(line);
    }

    // Goalposts (north and south)
    // South goalpost
    var gpBaseS = _cylinder(0.15, 0.15, 2.5, 8, COLOR_GOALPOST, 0, 0.75, -25);
    _group.add(gpBaseS);
    var gpLeftS = _cylinder(0.1, 0.1, 4, 8, COLOR_GOALPOST, -1.85, 3.75, -25);
    _group.add(gpLeftS);
    var gpRightS = _cylinder(0.1, 0.1, 4, 8, COLOR_GOALPOST, 1.85, 3.75, -25);
    _group.add(gpRightS);
    // Crossbar LineSegments
    var crossbarS = _lineSegments([
      [-1.85, 3.75, -25], [1.85, 3.75, -25]
    ], COLOR_GOALPOST);
    _group.add(crossbarS);

    // North goalpost
    var gpBaseN = _cylinder(0.15, 0.15, 2.5, 8, COLOR_GOALPOST, 0, 0.75, 25);
    _group.add(gpBaseN);
    var gpLeftN = _cylinder(0.1, 0.1, 4, 8, COLOR_GOALPOST, -1.85, 3.75, 25);
    _group.add(gpLeftN);
    var gpRightN = _cylinder(0.1, 0.1, 4, 8, COLOR_GOALPOST, 1.85, 3.75, 25);
    _group.add(gpRightN);
    var crossbarN = _lineSegments([
      [-1.85, 3.75, 25], [1.85, 3.75, 25]
    ], COLOR_GOALPOST);
    _group.add(crossbarN);

    // Player bench areas
    var benchEast = _box(12, 0.3, 2, 0x554433, 10, 0.15, 0);
    _group.add(benchEast);
    var benchWest = _box(12, 0.3, 2, 0x554433, -10, 0.15, 0);
    _group.add(benchWest);

    // ── Stands / seat blocks ───────────────────────────────
    // Lower seating tiers (ring around field)
    var lowerStandN = _box(90, 6, 10, COLOR_SEAT_LOWER, 0, 2, -35);
    _group.add(lowerStandN);
    var lowerStandS = _box(90, 6, 10, COLOR_SEAT_LOWER, 0, 2, 35);
    _group.add(lowerStandS);
    var lowerStandE = _box(10, 6, 50, COLOR_SEAT_LOWER, 50, 2, 0);
    _group.add(lowerStandE);
    var lowerStandW = _box(10, 6, 50, COLOR_SEAT_LOWER, -50, 2, 0);
    _group.add(lowerStandW);

    // Upper seating tiers
    var upperStandN = _box(95, 8, 12, COLOR_SEAT_BLOCK, 0, 11, -42);
    _group.add(upperStandN);
    var upperStandS = _box(95, 8, 12, COLOR_SEAT_BLOCK, 0, 11, 42);
    _group.add(upperStandS);
    var upperStandE = _box(14, 8, 54, COLOR_SEAT_BLOCK, 56, 11, 0);
    _group.add(upperStandE);
    var upperStandW = _box(14, 8, 54, COLOR_SEAT_BLOCK, -56, 11, 0);
    _group.add(upperStandW);

    // ── Lower concourse ────────────────────────────────────
    // Ring corridor at field level behind lower stands
    var lcN = _box(90, 4, 8, COLOR_LOWER, 0, 1.5, -31);
    _group.add(lcN);
    var lcS = _box(90, 4, 8, COLOR_LOWER, 0, 1.5, 31);
    _group.add(lcS);
    var lcE = _box(8, 4, 46, COLOR_LOWER, 47, 1.5, 0);
    _group.add(lcE);
    var lcW = _box(8, 4, 46, COLOR_LOWER, -47, 1.5, 0);
    _group.add(lcW);

    // Concession stalls (south lower)
    var stall1 = _box(3, 2.5, 2, COLOR_STALL, -15, 2.25, 29);
    _group.add(stall1);
    var stall2 = _box(3, 2.5, 2, COLOR_STALL, -8, 2.25, 29);
    _group.add(stall2);
    var stall3 = _box(3, 2.5, 2, COLOR_STALL, 0, 2.25, 29);
    _group.add(stall3);
    var stall4 = _box(3, 2.5, 2, COLOR_STALL, 8, 2.25, 29);
    _group.add(stall4);
    var stall5 = _box(3, 2.5, 2, COLOR_STALL, 15, 2.25, 29);
    _group.add(stall5);

    // North lower concourse stalls / equipment room
    var stallN1 = _box(3, 2.5, 2, COLOR_STALL, -10, 2.25, -29);
    _group.add(stallN1);
    var stallN2 = _box(3, 2.5, 2, COLOR_STALL, -3, 2.25, -29);
    _group.add(stallN2);
    var stallN3 = _box(3, 2.5, 2, COLOR_STALL, 4, 2.25, -29);
    _group.add(stallN3);
    // Equipment room (locked)
    var equipRoom = _box(5, 3, 4, 0x443333, 20, 2.5, -29);
    _group.add(equipRoom);
    var equipDoor = _box(1.5, 2.5, 0.2, 0x332222, 20, 2.25, -27.1);
    equipDoor.name = 'equipDoor';
    _group.add(equipDoor);

    // ── Upper concourse ────────────────────────────────────
    // Elevated walkway level (y=10)
    var ucFloorN = _box(90, 1, 8, COLOR_UPPER, 0, 9.5, -42);
    _group.add(ucFloorN);
    var ucFloorS = _box(90, 1, 8, COLOR_UPPER, 0, 9.5, 42);
    _group.add(ucFloorS);
    var ucFloorE = _box(8, 1, 54, COLOR_UPPER, 55, 9.5, 0);
    _group.add(ucFloorE);
    var ucFloorW = _box(8, 1, 54, COLOR_UPPER, -55, 9.5, 0);
    _group.add(ucFloorW);

    // Press box (east upper, glass panels)
    var pressBox = _box(8, 4, 10, COLOR_UPPER, 54, 12, -10);
    _group.add(pressBox);
    var glassPanel1 = _box(0.1, 3, 8, COLOR_GLASS, 50.1, 12, -10);
    _group.add(glassPanel1);
    var glassPanel2 = _box(6, 3, 0.1, COLOR_GLASS, 52, 12, -14.1);
    _group.add(glassPanel2);
    var glassPanel3 = _box(6, 3, 0.1, COLOR_GLASS, 52, 12, -5.9);
    _group.add(glassPanel3);

    // Broadcast TV truck (near press box)
    var truck = _box(4, 2.5, 7, COLOR_TRUCK, 50, 11.25, -5);
    _group.add(truck);
    // Satellite dish (CylinderGeometry)
    var dishBase = _cylinder(0.1, 0.1, 1.5, 6, COLOR_DISH, 50, 13.25, -5);
    _group.add(dishBase);
    var dish = _cylinder(1.2, 0.1, 0.3, 12, COLOR_DISH, 50, 14.15, -5);
    _group.add(dish);
    dish.rotation.x = Math.PI / 4;

    // ── Maintenance tunnel ─────────────────────────────────
    // Underground corridor 2x3x80
    var tunnel = _box(80, 3, 2, COLOR_TUNNEL, 0, -4, 0);
    _group.add(tunnel);
    // Tunnel junction (crossing)
    var tunnelCross = _box(2, 3, 40, COLOR_TUNNEL, 0, -4, 0);
    _group.add(tunnelCross);
    // Tunnel ceiling
    var tunnelCeil = _box(80, 0.2, 2, 0x333333, 0, -2.4, 0);
    _group.add(tunnelCeil);
    var tunnelCeilC = _box(2, 0.2, 40, 0x333333, 0, -2.4, 0);
    _group.add(tunnelCeilC);
    // Access stairs (north)
    var stairN = _box(2, 3, 2, 0x444444, 0, -1, -27);
    _group.add(stairN);
    // Access stairs (south)
    var stairS = _box(2, 3, 2, 0x444444, 0, -1, 27);
    _group.add(stairS);

    // ── Control room ───────────────────────────────────────
    // BoxGeometry 10x4x8 (0x445566)
    var ctrlRoom = _box(10, 4, 8, COLOR_CONTROL, -52, -3, 0);
    _group.add(ctrlRoom);
    var ctrlDoor = _box(2, 3, 0.2, 0x334455, -47.1, -3, 0);
    _group.add(ctrlDoor);
    // Control room terminal
    _terminal = _box(1.5, 1.5, 0.5, COLOR_TERMINAL, -50, -2.5, 0);
    _terminal.name = 'terminal';
    _group.add(_terminal);
    var termScreen = _box(1.2, 0.8, 0.1, 0x3399FF, -50, -2, 0.3);
    _group.add(termScreen);

    // ── PA panels (emergency evacuation) ──────────────────
    _paPanel = _box(0.8, 1.2, 0.2, COLOR_PA_PANEL, 0, 2.5, 27.5);
    _paPanel.name = 'paPanel';
    _group.add(_paPanel);
    // Additional PA panels around stadium
    var paPanel2 = _box(0.8, 1.2, 0.2, COLOR_PA_PANEL, -44, 2.5, 0);
    paPanel2.name = 'paPanel2';
    _group.add(paPanel2);

    // ── Ambient lighting ───────────────────────────────────
    var ambient = new THREE.AmbientLight(0x888888, 0.5);
    _group.add(ambient);

    // Stadium floodlights (4 corners)
    var fl1 = new THREE.PointLight(0xFFFFEE, 1.2, 80);
    fl1.position.set(40, 20, 30);
    _group.add(fl1);
    var fl2 = new THREE.PointLight(0xFFFFEE, 1.2, 80);
    fl2.position.set(-40, 20, 30);
    _group.add(fl2);
    var fl3 = new THREE.PointLight(0xFFFFEE, 1.2, 80);
    fl3.position.set(40, 20, -30);
    _group.add(fl3);
    var fl4 = new THREE.PointLight(0xFFFFEE, 1.2, 80);
    fl4.position.set(-40, 20, -30);
    _group.add(fl4);

    _scene.add(_group);
  }

  // ── Bomb placement ──────────────────────────────────────────
  function _placeBombs() {
    _bombs = [];

    // Bomb 1: behind concession stand lower south (z=28, x=-15, y=0.7)
    var b1 = {
      mesh: _buildBomb(-17, 0.7, 28),
      disarmed: false,
      exploded: false,
      label: 'BOMB-1: Lower South Concession',
      blinkTimer: 0,
      lightOn: true,
      locked: false
    };
    _group.add(b1.mesh);
    _bombs.push(b1);

    // Bomb 2: equipment room lower north (locked — need key)
    var b2 = {
      mesh: _buildBomb(20, 0.7, -30),
      disarmed: false,
      exploded: false,
      label: 'BOMB-2: Equipment Room (LOCKED)',
      blinkTimer: 0,
      lightOn: true,
      locked: true
    };
    _group.add(b2.mesh);
    _bombs.push(b2);

    // Bomb 3: press box upper east near TV truck
    var b3 = {
      mesh: _buildBomb(52, 11.5, -8),
      disarmed: false,
      exploded: false,
      label: 'BOMB-3: Press Box / Broadcast Truck',
      blinkTimer: 0,
      lightOn: true,
      locked: false
    };
    _group.add(b3.mesh);
    _bombs.push(b3);

    // Bomb 4: maintenance tunnel junction
    var b4 = {
      mesh: _buildBomb(0, -4.8, 0),
      disarmed: false,
      exploded: false,
      label: 'BOMB-4: Tunnel Junction',
      blinkTimer: 0,
      lightOn: true,
      locked: false
    };
    _group.add(b4.mesh);
    _bombs.push(b4);
  }

  // ── Key item ────────────────────────────────────────────────
  function _placeKey() {
    // Key on a dead terrorist near north lower concourse
    _keyItem = _box(0.3, 0.1, 0.15, COLOR_KEY, 15, 2.1, -28);
    _keyItem.name = 'keyItem';
    _group.add(_keyItem);
    _keyPickedUp = false;
  }

  // ── Terrorists ──────────────────────────────────────────────
  function _spawnTerrorists() {
    _terrorists = [];

    // Terrorist positions: spread around stadium (staff uniforms = green vests)
    var tPositions = [
      // Lower south concourse
      { x: -14,  y: 1.5, z: 28,  leader: false, nearBomb: 0 },
      { x: 12,   y: 1.5, z: 29,  leader: false, nearBomb: -1 },
      // Lower north concourse
      { x: 18,   y: 1.5, z: -28, leader: false, nearBomb: 1 },
      { x: 5,    y: 1.5, z: -28, leader: false, nearBomb: -1 },
      // Upper east / press box
      { x: 51,   y: 11,  z: -7,  leader: false, nearBomb: 2 },
      { x: 53,   y: 11,  z: -12, leader: false, nearBomb: -1 },
      // Tunnel patrol
      { x: 5,    y: -4,  z: 2,   leader: false, nearBomb: 3 },
      { x: -5,   y: -4,  z: -2,  leader: false, nearBomb: -1 },
      // Field level / general patrol
      { x: 0,    y: 1.5, z: 32,  leader: false, nearBomb: -1 },
      { x: -20,  y: 1.5, z: 0,   leader: false, nearBomb: -1 },
      { x: 20,   y: 1.5, z: 20,  leader: false, nearBomb: -1 },
      // Control room guard
      { x: -47,  y: -3,  z: 1,   leader: false, nearBomb: -1 }
    ];

    for (var t = 0; t < tPositions.length; t++) {
      var tp = tPositions[t];
      var tGrp = new THREE.Group();
      // Body (staff vest color)
      var tBody = _box(0.7, 1.6, 0.4, COLOR_TERRORIST, 0, 0, 0);
      tGrp.add(tBody);
      // Head
      var tHead = _sphere(0.25, 0xBB9977, 0, 0.95, 0);
      tGrp.add(tHead);
      // Radio (small box, blinks when radioing)
      var tRadio = _box(0.15, 0.2, 0.08, 0x333333, 0.42, 0.2, 0);
      tRadio.name = 'radio';
      tGrp.add(tRadio);
      // Radio light
      var tRadioLight = new THREE.PointLight(0xFF6600, 0, 1.5);
      tRadioLight.name = 'radioLight';
      tRadioLight.position.set(0.42, 0.25, 0.1);
      tGrp.add(tRadioLight);

      tGrp.position.set(tp.x, tp.y, tp.z);

      var terroristObj = {
        mesh: tGrp,
        hp: TERRORIST_HP,
        alive: true,
        nearBomb: tp.nearBomb,   // index of bomb they guard (-1 = patrol)
        radioTimer: Math.random() * 5,
        radioOn: false,
        identified: false,       // player can see they're hostile
        moveTimer: Math.random() * 2,
        baseX: tp.x,
        baseZ: tp.z,
        baseY: tp.y,
        alertTimer: 0
      };
      _group.add(tGrp);
      _terrorists.push(terroristObj);
    }
    _terroristCount = _terrorists.length;

    // ── Leader ──────────────────────────────────────────────
    var lGrp = new THREE.Group();
    var lBody = _box(0.8, 1.7, 0.45, COLOR_LEADER, 0, 0, 0);
    lGrp.add(lBody);
    var lHead = _sphere(0.28, 0xAA8866, 0, 1.0, 0);
    lGrp.add(lHead);
    // Detonator (held in hand)
    _detonatorObj = _box(0.2, 0.3, 0.12, COLOR_DETONATOR, 0.52, 0.1, 0);
    _detonatorObj.name = 'detonator';
    var detLight = new THREE.PointLight(COLOR_DETONATOR, 1.0, 2.5);
    detLight.position.set(0.52, 0.15, 0.1);
    detLight.name = 'detLight';
    lGrp.add(_detonatorObj);
    lGrp.add(detLight);

    lGrp.position.set(-51, -2.5, 0);

    _leader = {
      mesh: lGrp,
      hp: LEADER_HP,
      alive: true,
      identified: true,  // leader is obviously the target
      detonatorTimer: 0,
      alertTimer: 0
    };
    _group.add(lGrp);
  }

  // ── Crowd ────────────────────────────────────────────────────
  function _spawnCrowd() {
    _crowdObjects = [];
    // Place 200 civilian boxes in stands / concourses
    var crowdPositions = [
      // Lower stand sections
      { xMin: -40, xMax: 40, yBase: 1.5,  zMin: -38, zMax: -28 },
      { xMin: -40, xMax: 40, yBase: 1.5,  zMin:  28, zMax:  38 },
      { xMin:  44, xMax:  54,yBase: 1.5,  zMin: -22, zMax:  22 },
      { xMin: -54, xMax: -44,yBase: 1.5,  zMin: -22, zMax:  22 },
    ];
    var totalCivs = 200;
    for (var ci = 0; ci < totalCivs; ci++) {
      var zone = crowdPositions[ci % crowdPositions.length];
      var cx = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
      var cz = zone.zMin + Math.random() * (zone.zMax - zone.zMin);
      var cy = zone.yBase;
      var civColor = (Math.random() > 0.5) ? COLOR_CROWD : COLOR_CIVILIAN;
      var civMesh = _box(0.5, 1.4, 0.4, civColor, cx, cy, cz);
      civMesh.name = 'civilian';

      var civObj = {
        mesh: civMesh,
        alive: true,
        panic: false,
        panicDir: { x: 0, z: 0 },
        panicTimer: 0,
        baseX: cx,
        baseZ: cz,
        zone: ci % 4   // which section
      };
      _group.add(civMesh);
      _crowdObjects.push(civObj);
    }
  }

  // ── Input handlers ──────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_active && !_inited) {
      // Activation check
      var k = e.key.toUpperCase();
      if (k === 'F') _fPressTime = performance.now() / 1000;
      if (k === 'S') _sPressTime = performance.now() / 1000;
      if (Math.abs(_fPressTime - _sPressTime) < ACTIVATION_WINDOW &&
          _fPressTime > 0 && _sPressTime > 0) {
        _activate();
        return;
      }
    }
    if (!_active) return;
    _keys[e.key.toUpperCase()] = true;
    if (e.key === 'e' || e.key === 'E') {
      _eDown = true;
    }
  }

  function _onKeyUp(e) {
    _keys[e.key.toUpperCase()] = false;
    if (e.key === 'e' || e.key === 'E') {
      _eDown = false;
      _eHeldTime = 0;
      _eTarget = null;
      _showProgress(null, 0);
    }
  }

  function _onMouseDown(e) {
    if (!_active || _gameOver) return;
    if (e.button === 0) {
      _mouseDown = true;
      _tryShoot();
    }
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  // ── Shooting ─────────────────────────────────────────────────
  function _tryShoot() {
    if (!_camera || !_active || _gameOver) return;
    var now = performance.now() / 1000;
    if (now - _lastShotTime < _shootCooldown) return;
    _lastShotTime = now;
    _playGunshot();

    // Trigger crowd panic in nearby sections
    var camPos = _camera.position;
    _panicZones.push({ x: camPos.x, z: camPos.z, radius: 20, time: 8.0 });

    // Raycasting via brute force distance + direction check
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    var origin = _camera.position.clone();

    var bestDist = SHOOT_RANGE;
    var bestTarget = null;
    var bestType = null;

    // Check terrorists
    for (var ti = 0; ti < _terrorists.length; ti++) {
      var ter = _terrorists[ti];
      if (!ter.alive) continue;
      var tPos = ter.mesh.position;
      var toT = tPos.clone().sub(origin);
      var dist = toT.length();
      if (dist > SHOOT_RANGE) continue;
      toT.normalize();
      var dot = toT.dot(dir);
      if (dot < 0.92) continue;  // ~23deg cone
      if (dist < bestDist) {
        bestDist = dist;
        bestTarget = ter;
        bestType = 'terrorist';
      }
    }

    // Check leader
    if (_leader && _leader.alive) {
      var lPos = _leader.mesh.position;
      var toL = lPos.clone().sub(origin);
      var ldist = toL.length();
      if (ldist < SHOOT_RANGE) {
        toL.normalize();
        var ldot = toL.dot(dir);
        if (ldot > 0.92 && ldist < bestDist) {
          bestDist = ldist;
          bestTarget = _leader;
          bestType = 'leader';
        }
      }
      // Check detonator shot
      if (_leader.alive && _detonatorObj && !_detonatorShot) {
        var detWPos = new THREE.Vector3();
        _detonatorObj.getWorldPosition(detWPos);
        var toDet = detWPos.clone().sub(origin);
        var detDist = toDet.length();
        if (detDist < SHOOT_RANGE * 0.6) {
          toDet.normalize();
          var detDot = toDet.dot(dir);
          if (detDot > 0.97 && detDist < bestDist) {
            bestDist = detDist;
            bestTarget = 'detonator';
            bestType = 'detonator';
          }
        }
      }
    }

    // Check civilians (penalty)
    for (var ci = 0; ci < _crowdObjects.length; ci++) {
      var civ = _crowdObjects[ci];
      if (!civ.alive) continue;
      var cPos = civ.mesh.position;
      var toC = cPos.clone().sub(origin);
      var cdist = toC.length();
      if (cdist > 15) continue;
      toC.normalize();
      var cdot = toC.dot(dir);
      if (cdot > 0.94 && cdist < bestDist) {
        bestDist = cdist;
        bestTarget = civ;
        bestType = 'civilian';
      }
    }

    if (bestType === 'terrorist') {
      bestTarget.hp -= 35;
      bestTarget.identified = true;
      if (bestTarget.hp <= 0) {
        _killTerrorist(bestTarget);
      }
    } else if (bestType === 'leader') {
      bestTarget.hp -= 50;
      if (bestTarget.hp <= 0) {
        _killLeader();
      }
    } else if (bestType === 'detonator') {
      _shootDetonator();
    } else if (bestType === 'civilian') {
      _score += CIVILIAN_PENALTY;
      _civiliansAlive = Math.max(0, _civiliansAlive - 1);
      _showOverlay('CIVILIAN DOWN! -500 POINTS', '#FF2200');
      setTimeout(function () { _hideOverlay(); }, 2000);
    }
  }

  function _killTerrorist(ter) {
    ter.alive = false;
    ter.hp = 0;
    ter.mesh.scale.y = 0.1;
    ter.mesh.position.y -= 0.7;
    _score += SCORE_TERRORIST_DOWN;
    _terroristCount--;
    // If key was on this terrorist, make it accessible
    // (Key is always placed at static position, not on a specific terrorist)
  }

  function _killLeader() {
    _leaderDead = true;
    _leader.alive = false;
    _leader.mesh.scale.y = 0.1;
    _leader.mesh.position.y -= 0.8;
    _leaderDetonating = false;
    // Remove detonator glow
    var dl = _leader.mesh.getObjectByName('detLight');
    if (dl) dl.intensity = 0;
    _score += SCORE_LEADER_DOWN;
    _playSuccess();
    _checkWinCondition();
  }

  function _shootDetonator() {
    _detonatorShot = true;
    _leaderDetonating = false;
    _detonatorObj.visible = false;
    var dl = _leader.mesh.getObjectByName('detLight');
    if (dl) dl.intensity = 0;
    _showOverlay('DETONATOR SHOT OUT OF HAND!', '#00FF88');
    setTimeout(function () { _hideOverlay(); }, 2000);
  }

  // ── Interaction ──────────────────────────────────────────────
  function _getInteractTarget() {
    if (!_camera) return null;
    var camPos = _camera.position;

    // Check bombs
    for (var bi = 0; bi < _bombs.length; bi++) {
      var b = _bombs[bi];
      if (b.disarmed || b.exploded) continue;
      var bPos = b.mesh.position;
      var dist = camPos.distanceTo(bPos);
      if (dist < INTERACT_RANGE) {
        return { type: 'bomb', index: bi };
      }
    }

    // Check key
    if (!_keyPickedUp && _keyItem) {
      var kDist = camPos.distanceTo(_keyItem.position);
      if (kDist < INTERACT_RANGE) {
        return { type: 'key' };
      }
    }

    // Check PA panel
    if (_paPanel) {
      var paDist = camPos.distanceTo(_paPanel.position);
      if (paDist < INTERACT_RANGE) {
        return { type: 'paPanel' };
      }
    }

    // Check terminal
    if (_terminal && _leaderDead) {
      var tDist = camPos.distanceTo(_terminal.position);
      if (tDist < INTERACT_RANGE) {
        return { type: 'terminal' };
      }
    }

    return null;
  }

  function _updateInteraction(delta) {
    if (_gameOver) return;

    var target = _getInteractTarget();

    if (target) {
      // Show prompt
      if (target.type === 'bomb') {
        var b = _bombs[target.index];
        if (b.locked && !_keyPickedUp) {
          _showPrompt('[LOCKED] Find the key first  (' + b.label + ')');
          _showProgress(null, 0);
          if (_eDown) { _eHeldTime = 0; }
          return;
        }
        _showPrompt('[E] Hold to DISARM — ' + b.label);
      } else if (target.type === 'key') {
        _showPrompt('[E] Pick up EQUIPMENT ROOM KEY');
      } else if (target.type === 'paPanel') {
        _showPrompt('[E] Hold 2s — Emergency PA / Evacuate Section');
      } else if (target.type === 'terminal') {
        _showPrompt('[E] Hold 4s — DISABLE ALL BOMBS via Terminal');
      }

      if (_eDown) {
        // Accumulate hold time
        if (_eTarget && (_eTarget.type !== target.type || _eTarget.index !== target.index)) {
          _eHeldTime = 0; // reset if target changed
        }
        _eTarget = target;
        _eHeldTime += delta;

        var holdRequired = 0;
        var progressLabel = '';
        if (target.type === 'bomb') {
          holdRequired = BOMB_DISARM_TIME;
          progressLabel = 'DISARMING...';
        } else if (target.type === 'key') {
          holdRequired = 0.3;
          progressLabel = 'PICKING UP...';
        } else if (target.type === 'paPanel') {
          holdRequired = PA_PANEL_TIME;
          progressLabel = 'ACTIVATING PA...';
        } else if (target.type === 'terminal') {
          holdRequired = TERMINAL_USE_TIME;
          progressLabel = 'DISABLING BOMBS...';
        }

        _showProgress(progressLabel, _eHeldTime / holdRequired);

        if (_eHeldTime >= holdRequired) {
          _eHeldTime = 0;
          _completeInteraction(target);
        }
      } else {
        _eTarget = null;
        _eHeldTime = 0;
        _showProgress(null, 0);
      }
    } else {
      _showPrompt(null);
      _showProgress(null, 0);
      if (!_eDown) {
        _eHeldTime = 0;
        _eTarget = null;
      }
    }
  }

  function _completeInteraction(target) {
    if (target.type === 'bomb') {
      var b = _bombs[target.index];
      if (b.locked && !_keyPickedUp) return;
      b.disarmed = true;
      _bombsDisarmed++;
      var bl = b.mesh.getObjectByName('bombLight');
      if (bl) bl.intensity = 0;
      // Turn bomb green
      b.mesh.traverse(function (child) {
        if (child.isMesh) {
          child.material.color.setHex(0x00AA44);
        }
      });
      _score += SCORE_BOMB_DISARMED;
      _playSuccess();
      _showOverlay('BOMB ' + (target.index + 1) + ' DISARMED!', '#00FF88');
      setTimeout(function () { _hideOverlay(); }, 2000);

      if (_bombsDisarmed === 4) {
        _allBombsJustDisarmed = true;
        _lastBombDisarmedTime = performance.now() / 1000;
        if (_leaderDead || _detonatorShot) {
          _triggerWin();
        }
        // else leader has LEADER_DETONATOR_TIME seconds to detonate
      }
    } else if (target.type === 'key') {
      _keyPickedUp = true;
      _group.remove(_keyItem);
      _bomb2Locked = false;
      _bombs[1].locked = false;
      _showOverlay('EQUIPMENT ROOM KEY obtained!\nBOMB-2 accessible!', '#FFE566');
      setTimeout(function () { _hideOverlay(); }, 2500);
      _playBeep();
    } else if (target.type === 'paPanel') {
      // Evacuate nearest section
      var cam = _camera.position;
      var sectionIdx = 0;
      if (cam.z < -20) sectionIdx = 0;      // north
      else if (cam.z > 20) sectionIdx = 1;  // south
      else if (cam.x > 20) sectionIdx = 2;  // east
      else sectionIdx = 3;                   // west

      _sectionEvacuated[sectionIdx] = true;
      var sNames = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
      _showOverlay('SECTION ' + sNames[sectionIdx] + ' EVACUATING!', '#3366FF');
      setTimeout(function () { _hideOverlay(); }, 2000);

      // Make crowd flee from this section
      for (var ci = 0; ci < _crowdObjects.length; ci++) {
        var civ = _crowdObjects[ci];
        if (civ.zone === sectionIdx) {
          civ.panic = true;
          civ.panicDir.x = (Math.random() - 0.5) * 2;
          civ.panicDir.z = (Math.random() - 0.5) * 2;
          civ.panicTimer = 15;
        }
      }
      _playAlarm();
    } else if (target.type === 'terminal') {
      // Disable all remaining bombs (requires leader dead)
      if (!_leaderDead) {
        _showOverlay('Leader must be eliminated first!', '#FF2200');
        setTimeout(function () { _hideOverlay(); }, 2000);
        return;
      }
      for (var bi = 0; bi < _bombs.length; bi++) {
        if (!_bombs[bi].disarmed && !_bombs[bi].exploded) {
          _bombs[bi].disarmed = true;
          _bombsDisarmed++;
          var blt = _bombs[bi].mesh.getObjectByName('bombLight');
          if (blt) blt.intensity = 0;
          _bombs[bi].mesh.traverse(function (child) {
            if (child.isMesh) child.material.color.setHex(0x00AA44);
          });
        }
      }
      _playSuccess();
      _triggerWin();
    }
  }

  // ── Win / Lose ───────────────────────────────────────────────
  function _checkWinCondition() {
    if (_gameOver) return;
    if (_bombsDisarmed >= 4 && _leaderDead) {
      _triggerWin();
    }
  }

  function _triggerWin() {
    if (_gameOver) return;
    _gameOver = true;
    _gameWon = true;
    _score += SCORE_WIN;
    _playSuccess();
    _showOverlay(
      'MISSION COMPLETE<br><span style="font-size:18px">All bombs neutralized. Stadium secured.<br>SCORE: ' + _score + '</span>',
      '#00FF88'
    );
    if (_hudEl) _hudEl.style.color = '#00FF88';
  }

  function _triggerBombExplosion(bombIndex) {
    if (_gameOver) return;
    var b = _bombs[bombIndex];
    b.exploded = true;
    _bombsExploded++;
    _playExplosion();
    // Flash red
    b.mesh.traverse(function (child) {
      if (child.isMesh) child.material.color.setHex(0xFF6600);
    });
    var bl = b.mesh.getObjectByName('bombLight');
    if (bl) { bl.color.setHex(0xFF6600); bl.intensity = 5; }

    // Civilian casualties
    _civiliansAlive = Math.max(0, _civiliansAlive - 35);

    _gameOver = true;
    _gameWon = false;
    _showOverlay(
      'BOMB DETONATED!<br><span style="font-size:18px">35 civilian casualties.<br>MISSION FAILED</span>',
      '#FF2200'
    );
  }

  function _triggerLeaderDetonation() {
    if (_gameOver) return;
    _leaderDetonating = false;
    _gameOver = true;
    _gameWon = false;
    _playExplosion();
    _showOverlay(
      'DETONATOR ACTIVATED!<br><span style="font-size:18px">Multiple bombs triggered.<br>MISSION FAILED</span>',
      '#FF2200'
    );
  }

  // ── Terrorist AI ─────────────────────────────────────────────
  function _updateTerrorists(delta) {
    var camPos = _camera ? _camera.position : new THREE.Vector3();

    for (var ti = 0; ti < _terrorists.length; ti++) {
      var ter = _terrorists[ti];
      if (!ter.alive) continue;

      // Radio cycle
      ter.radioTimer -= delta;
      if (ter.radioTimer <= 0) {
        ter.radioOn = !ter.radioOn;
        ter.radioTimer = ter.radioOn ? (1.5 + Math.random() * 2) : (3 + Math.random() * 5);
        var rl = ter.mesh.getObjectByName('radioLight');
        if (rl) rl.intensity = ter.radioOn ? 0.8 : 0;
        if (ter.radioOn) ter.identified = true;
      }

      // Approach assigned bomb (identifying behavior)
      if (ter.nearBomb >= 0 && !_bombs[ter.nearBomb].disarmed) {
        var bPos = _bombs[ter.nearBomb].mesh.position;
        var dx = bPos.x - ter.mesh.position.x;
        var dz = bPos.z - ter.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 2) {
          ter.mesh.position.x += (dx / dist) * 0.8 * delta;
          ter.mesh.position.z += (dz / dist) * 0.8 * delta;
          ter.identified = true;
        }
      } else {
        // Patrol around base position
        ter.moveTimer -= delta;
        if (ter.moveTimer <= 0) {
          ter.moveTimer = 2 + Math.random() * 3;
          ter._patrolDx = (Math.random() - 0.5) * 4;
          ter._patrolDz = (Math.random() - 0.5) * 4;
        }
        if (ter._patrolDx) {
          ter.mesh.position.x += ter._patrolDx * delta * 0.3;
          ter.mesh.position.z += ter._patrolDz * delta * 0.3;
          // Keep near base
          var bx = ter.mesh.position.x - ter.baseX;
          var bz = ter.mesh.position.z - ter.baseZ;
          if (Math.sqrt(bx * bx + bz * bz) > 5) {
            ter.mesh.position.x = ter.baseX + bx * 0.5;
            ter.mesh.position.z = ter.baseZ + bz * 0.5;
          }
        }
      }

      // Alert if gunshot panic nearby
      for (var pi = 0; pi < _panicZones.length; pi++) {
        var pz = _panicZones[pi];
        var pdx = ter.mesh.position.x - pz.x;
        var pdz = ter.mesh.position.z - pz.z;
        if (Math.sqrt(pdx * pdx + pdz * pdz) < pz.radius) {
          ter.identified = true;
          ter.alertTimer = 3;
        }
      }

      // Alert glow
      if (ter.alertTimer > 0) {
        ter.alertTimer -= delta;
      }
    }

    // Leader AI
    if (_leader && _leader.alive) {
      // Check if last bomb disarmed and leader should detonate
      if (_allBombsJustDisarmed && !_detonatorShot && !_leaderDead) {
        var elapsed = performance.now() / 1000 - _lastBombDisarmedTime;
        if (elapsed >= LEADER_DETONATOR_TIME) {
          // Leader detonates
          _leaderDetonating = true;
          _leader.detonatorTimer -= delta;
          if (_leader.detonatorTimer <= -1) {
            _triggerLeaderDetonation();
          }
        } else {
          // Count down warning
          _leaderDetonating = true;
        }
      }

      // Leader detonator blink
      var dl2 = _leader.mesh.getObjectByName('detLight');
      if (dl2 && _leaderDetonating) {
        dl2.intensity = (Math.sin(performance.now() * 0.01) > 0) ? 2.5 : 0;
      }
    }
  }

  // ── Crowd AI ─────────────────────────────────────────────────
  function _updateCrowd(delta) {
    var camPos = _camera ? _camera.position : new THREE.Vector3();

    // Update panic zones
    for (var pi = _panicZones.length - 1; pi >= 0; pi--) {
      _panicZones[pi].time -= delta;
      if (_panicZones[pi].time <= 0) {
        _panicZones.splice(pi, 1);
      }
    }

    for (var ci = 0; ci < _crowdObjects.length; ci++) {
      var civ = _crowdObjects[ci];
      if (!civ.alive) continue;

      // Check if in panic zone
      if (!civ.panic) {
        for (var pj = 0; pj < _panicZones.length; pj++) {
          var pz = _panicZones[pj];
          var dx = civ.mesh.position.x - pz.x;
          var dz = civ.mesh.position.z - pz.z;
          if (Math.sqrt(dx * dx + dz * dz) < pz.radius) {
            civ.panic = true;
            civ.panicTimer = 8 + Math.random() * 5;
            // Flee away from panic center
            var len = Math.sqrt(dx * dx + dz * dz) || 1;
            civ.panicDir.x = dx / len;
            civ.panicDir.z = dz / len;
            break;
          }
        }
      }

      if (civ.panic && civ.panicTimer > 0) {
        civ.panicTimer -= delta;
        // Move away
        civ.mesh.position.x += civ.panicDir.x * 3 * delta;
        civ.mesh.position.z += civ.panicDir.z * 3 * delta;
        // Crowd surge: if near player, slow them
        var toCam = camPos.distanceTo(civ.mesh.position);
        if (toCam < 1.2) {
          // Player pinned effect — note in prompt
          _showPrompt('CROWD SURGE — push through!');
        }
        // Clamp to stadium bounds
        civ.mesh.position.x = Math.max(-70, Math.min(70, civ.mesh.position.x));
        civ.mesh.position.z = Math.max(-60, Math.min(60, civ.mesh.position.z));

        if (civ.panicTimer <= 0) {
          civ.panic = false;
        }
      }
    }
  }

  // ── Bomb blink animation ─────────────────────────────────────
  function _updateBombs(delta) {
    for (var bi = 0; bi < _bombs.length; bi++) {
      var b = _bombs[bi];
      if (b.disarmed || b.exploded) continue;

      // Blink speed increases as timer goes down
      var blinkRate = _missionTime > 120 ? 1.0 : (_missionTime > 30 ? 0.35 : 0.12);
      b.blinkTimer += delta;
      if (b.blinkTimer >= blinkRate) {
        b.blinkTimer = 0;
        b.lightOn = !b.lightOn;
        var bl = b.mesh.getObjectByName('bombLight');
        if (bl) bl.intensity = b.lightOn ? 1.5 : 0;
        var led = b.mesh.getObjectByName('led');
        if (led) led.material.color.setHex(b.lightOn ? 0xFF2200 : 0x330000);
        if (b.lightOn) _playBeep();
      }
    }
  }

  // ── Player movement ──────────────────────────────────────────
  function _updatePlayerMovement(delta) {
    if (!_camera || _gameOver) return;
    var speed = 8.0 * delta;
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    var right = new THREE.Vector3();
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    if (_keys['W'] || _keys['ARROWUP'])    _camera.position.addScaledVector(dir, speed);
    if (_keys['S'] || _keys['ARROWDOWN'])  _camera.position.addScaledVector(dir, -speed);
    if (_keys['A'] || _keys['ARROWLEFT'])  _camera.position.addScaledVector(right, -speed);
    if (_keys['D'] || _keys['ARROWRIGHT']) _camera.position.addScaledVector(right, speed);

    // Clamp to stadium bounds
    _camera.position.x = Math.max(-60, Math.min(60, _camera.position.x));
    _camera.position.z = Math.max(-55, Math.min(55, _camera.position.z));
    // Y clamp: field, tunnel, upper
    _camera.position.y = Math.max(-5.5, Math.min(15, _camera.position.y));
  }

  // ── Activate ─────────────────────────────────────────────────
  function _activate() {
    if (_inited) return;
    _inited = true;
    _active = true;
    _fPressTime = -999;
    _sPressTime = -999;

    _buildStadium();
    _placeBombs();
    _placeKey();
    _spawnTerrorists();
    _spawnCrowd();
    _ensureHUD();

    if (_hudEl) _hudEl.style.display = 'block';

    // Set camera starting position (player enters from south tunnel entrance)
    if (_camera) {
      _camera.position.set(0, 1.7, 30);
      _camera.rotation.set(0, 0, 0);
    }

    // Ambient scene setup
    if (_scene) {
      _scene.background = new THREE.Color(0x111122);
      _scene.fog = new THREE.Fog(0x111122, 30, 120);
    }

    _showOverlay(
      'STADIUM BREACH<br>' +
      '<span style="font-size:16px">4 bombs planted. 8 minutes. 12 terrorists.<br>' +
      'WASD: Move | E: Interact/Disarm | Click: Shoot<br>' +
      'ID terrorists by behavior — do NOT shoot civilians</span>',
      '#FFE566'
    );
    setTimeout(function () { _hideOverlay(); }, 5000);
  }

  // ── Public API ───────────────────────────────────────────────
  function init(scene, camera, renderer) {
    _scene    = scene;
    _camera   = camera;
    _renderer = renderer;

    if (!_addedKeys) {
      _addedKeys = true;
      document.addEventListener('keydown', _onKeyDown);
      document.addEventListener('keyup',   _onKeyUp);
      document.addEventListener('mousedown', _onMouseDown);
      document.addEventListener('mouseup',   _onMouseUp);
    }
  }

  function update(delta) {
    if (!_active) return;
    if (_gameOver) {
      _updateHUD();
      return;
    }

    // Mission timer
    _missionTime -= delta;
    if (_missionTime <= 0) {
      _missionTime = 0;
      // Time out — all un-disarmed bombs detonate
      for (var bi = 0; bi < _bombs.length; bi++) {
        if (!_bombs[bi].disarmed && !_bombs[bi].exploded) {
          _triggerBombExplosion(bi);
          return;
        }
      }
    }

    _updatePlayerMovement(delta);
    _updateBombs(delta);
    _updateTerrorists(delta);
    _updateCrowd(delta);
    _updateInteraction(delta);
    _updateHUD();

    // Check if all bombs disarmed + leader alive → leader has 5s to detonate
    if (_allBombsJustDisarmed && !_leaderDead && !_detonatorShot) {
      var elapsed = performance.now() / 1000 - _lastBombDisarmedTime;
      var remaining = LEADER_DETONATOR_TIME - elapsed;
      if (remaining > 0) {
        _showOverlay(
          'LEADER ACTIVATING DETONATOR!<br>' +
          '<span style="font-size:18px">Reach him or shoot detonator! ' +
          Math.ceil(remaining) + 's</span>',
          '#FF2200'
        );
      } else if (!_gameOver) {
        _triggerLeaderDetonation();
      }
    } else if (!_gameOver && _allBombsJustDisarmed && (_leaderDead || _detonatorShot)) {
      // Safe — win
      _triggerWin();
    }
  }

  function reset() {
    _active = false;
    _inited = false;
    _gameOver = false;
    _gameWon = false;
    _score = 0;
    _missionTime = MISSION_TIME;
    _bombsDisarmed = 0;
    _bombsExploded = 0;
    _terroristCount = 0;
    _leaderDead = false;
    _leaderDetonating = false;
    _allBombsJustDisarmed = false;
    _lastBombDisarmedTime = 0;
    _keyPickedUp = false;
    _bomb2Locked = true;
    _eDown = false;
    _eHeldTime = 0;
    _eTarget = null;
    _panicZones = [];
    _sectionEvacuated = [false, false, false, false];
    _civiliansAlive = CIVILIANS_SAFE_START;
    _fPressTime = -999;
    _sPressTime = -999;
    _keys = {};
    _mouseDown = false;

    if (_group && _scene) {
      _scene.remove(_group);
    }
    _group = null;
    _bombs = [];
    _terrorists = [];
    _crowdObjects = [];
    _leader = null;
    _detonatorObj = null;
    _detonatorShot = false;
    _paPanel = null;
    _terminal = null;
    _keyItem = null;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_interactPromptEl) _interactPromptEl.style.display = 'none';
    if (_progressEl) _progressEl.style.display = 'none';
  }

  return { init: init, update: update, reset: reset };
}());
