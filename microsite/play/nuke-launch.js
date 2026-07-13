// nuke-launch.js — NukeLaunch module
// Activation: N+L simultaneous keypress (both within 400ms)
// Soviet-era silo complex: destroy 3 abort consoles before 10-minute launch countdown.
// IIFE pattern, var throughout — no let/const.
window.NukeLaunch = (function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────
  var ACTIVATION_KEYS   = ['KeyN', 'KeyL'];
  var ACTIVATION_WINDOW = 400;       // ms between the two activation keys
  var TOTAL_TIME        = 600;       // 10 minutes in seconds
  var INTERACT_RANGE    = 3.0;       // units — proximity for E interaction
  var CONSOLE_DESTROY   = 5.0;       // seconds to hold E to destroy abort console
  var GENERAL_HP        = 400;
  var GUARD_HP          = 80;
  var COMMANDER_HP      = 150;
  var HAZMAT_HP         = 120;
  var ELEVATOR_TIME     = 10.0;      // seconds for elevator descent
  var DOOR_LOCKDOWN     = 300;       // 5 minutes — all doors lock
  var SHOOT_COOLDOWN    = 0.4;       // seconds between shots
  var REINFORCEMENT_COUNT = 4;
  var MOVE_SPEED        = 7;
  var GRAVITY           = -18;
  var JUMP_SPEED        = 8;
  var PLAYER_HP         = 100;

  // ── Internal state ─────────────────────────────────────────────────────────
  var _active      = false;
  var _scene       = null;
  var _camera      = null;
  var _renderer    = null;
  var _clock       = null;
  var _animId      = null;
  var _container   = null;
  var _keys        = {};
  var _mouseX      = 0;
  var _yaw         = 0;
  var _pitch       = 0;
  var _pointerLocked = false;

  // Activation key tracking
  var _nTime       = 0;
  var _lTime       = 0;
  var _nDown       = false;
  var _lDown       = false;

  // Timer / game state
  var _timeLeft    = TOTAL_TIME;
  var _gameOver    = false;
  var _gameWon     = false;
  var _pulseT      = 0;

  // Player
  var _playerPos   = { x: 0, y: 1.7, z: 25 };
  var _playerVel   = { x: 0, y: 0, z: 0 };
  var _playerHP    = PLAYER_HP;
  var _onGround    = false;
  var _shootCooldown = 0;
  var _hasKey1     = false; // commander 1 key (reactor door)
  var _hasKey2     = false; // general access code (console 3)
  var _elevatorUsed = false;
  var _elevatorActive = false;
  var _elevatorTimer  = 0;
  var _elevatorStart  = false;

  // Abort consoles
  var _consoleDestroyed = [false, false, false];
  var _consoleHolding   = -1;
  var _consoleProgress  = [0, 0, 0];

  // General Romanov
  var _generalHP     = GENERAL_HP;
  var _generalState  = 'locked';  // 'locked'|'active'|'eliminated'
  var _generalBunkerOpen = false;
  var _generalFireTimer  = 0;
  var _radioDestroyed    = false;
  var _reinforcementCalled = false;
  var _generalLaunchProgress = 0;
  var _generalHoldingLaunch  = false;

  // Guards: type 'soldier'|'commander'|'hazmat'|'reinforcement'
  var _guards        = [];
  // guard structure: { mesh, hp, maxHp, type, pos, vel, state, alertTimer, fireTimer, key }
  var _guardsAlerted = false;
  var _doorLockdown  = false;
  var _doorOverrideDestroyed = [false, false, false, false]; // 4 door panels

  // Mission phase
  var _phase = 'tunnel'; // 'tunnel'|'level1'|'level2'|'level3'

  // THREE objects
  var _rootGroup     = null;
  var _nukeLight     = null;
  var _fuelLight     = null;
  var _missileMesh   = null;
  var _missileY      = -17;
  var _missileRising = false;

  var _consoleMeshes     = [];
  var _consoleLights     = [];
  var _generalMesh       = null;
  var _radioMesh         = null;
  var _elevatorMesh      = null;
  var _blastDoorLines    = null;
  var _doorPanelMeshes   = [];
  var _pressureDoors     = [];
  var _pressureDoorOpen  = [false, false];
  var _reactorDoorMesh   = null;
  var _reactorDoorOpen   = false;

  // HUD
  var _hudEl    = null;
  var _msgEl    = null;
  var _msgTimer = 0;
  var _overlayEl = null;

  // ── Audio ──────────────────────────────────────────────────────────────────
  function _getAudioCtx() {
    if (window._audioCtx) return window._audioCtx;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) { window._audioCtx = new Ctx(); return window._audioCtx; }
    } catch (e) {}
    return null;
  }

  function _playTone(freq, dur, vol, type) {
    var ctx = _getAudioCtx();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = type || 'square';
      osc.frequency.value = freq || 440;
      g.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.1));
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (dur || 0.1) + 0.02);
    } catch (e) {}
  }

  function _playAlarm() { _playTone(880, 0.3, 0.2, 'sawtooth'); }
  function _playShot()  { _playTone(220, 0.08, 0.18, 'square'); }
  function _playHit()   { _playTone(150, 0.05, 0.15, 'triangle'); }
  function _playBeep()  { _playTone(660, 0.1, 0.1, 'sine'); }
  function _playDestroy() {
    _playTone(200, 0.15, 0.2, 'sawtooth');
    setTimeout(function() { _playTone(120, 0.2, 0.2, 'sawtooth'); }, 120);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _T() { return window.THREE; }

  function _dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function _padZero(n) { return n < 10 ? '0' + n : '' + n; }

  function _formatTime(secs) {
    var s = Math.max(0, Math.ceil(secs));
    return _padZero(Math.floor(s / 60)) + ':' + _padZero(s % 60);
  }

  function _showMsg(txt, dur) {
    if (!_msgEl) return;
    _msgEl.textContent = txt;
    _msgEl.style.opacity = '1';
    _msgTimer = dur || 3;
  }

  function _consolesDestroyed() {
    return _consoleDestroyed[0] && _consoleDestroyed[1] && _consoleDestroyed[2];
  }

  function _mk(geo, color, emissive) {
    var T = _T();
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = emissive;
      opts.emissiveIntensity = 0.4;
    }
    return new T.Mesh(geo, new T.MeshLambertMaterial(opts));
  }

  // ── Scene construction ────────────────────────────────────────────────────
  function _buildScene() {
    var T = _T();
    if (!T) return;

    _rootGroup = new T.Group();
    _scene.add(_rootGroup);

    // Ambient + fill light
    _scene.add(new T.AmbientLight(0x334455, 0.5));
    var fillLight = new T.PointLight(0x4466AA, 0.6, 80);
    fillLight.position.set(0, 10, 0);
    _scene.add(fillLight);

    // Global red pulsing alarm light (brightens near zero)
    _nukeLight = new T.PointLight(0xFF0000, 0.3, 60);
    _nukeLight.position.set(0, 8, -40);
    _scene.add(_nukeLight);

    // Missile fuel glow (appears at 1 min)
    _fuelLight = new T.PointLight(0xFF8800, 0, 20);
    _fuelLight.position.set(0, -16, -50);
    _scene.add(_fuelLight);

    _buildEntryTunnel(T);
    _buildLevel1(T);
    _buildLevel2(T);
    _buildLevel3(T);
    _buildGeneralBunker(T);
    _buildGuards(T);
    _buildElevator(T);
  }

  // Entry tunnel BoxGeometry 3x3x30
  function _buildEntryTunnel(T) {
    // Floor
    var floorGeo = new T.BoxGeometry(3, 0.2, 30);
    var floor = _mk(floorGeo, 0x333344);
    floor.position.set(0, 0, 10);
    _rootGroup.add(floor);

    // Ceiling
    var ceilGeo = new T.BoxGeometry(3, 0.2, 30);
    var ceil = _mk(ceilGeo, 0x444455);
    ceil.position.set(0, 3, 10);
    _rootGroup.add(ceil);

    // Walls
    var wallL = _mk(new T.BoxGeometry(0.2, 3, 30), 0x444455);
    wallL.position.set(-1.5, 1.5, 10);
    _rootGroup.add(wallL);

    var wallR = _mk(new T.BoxGeometry(0.2, 3, 30), 0x444455);
    wallR.position.set(1.5, 1.5, 10);
    _rootGroup.add(wallR);

    // End cap
    var cap = _mk(new T.BoxGeometry(3, 3, 0.2), 0x444455);
    cap.position.set(0, 1.5, 26);
    _rootGroup.add(cap);

    // Tunnel lights
    for (var tl = 0; tl < 3; tl++) {
      var tlight = new T.PointLight(0x8899BB, 0.5, 12);
      tlight.position.set(0, 2.5, 6 + tl * 8);
      _scene.add(tlight);
    }

    // Pressure doors (2 doors in tunnel at z=18 and z=12)
    var pdPositions = [18, 12];
    for (var pd = 0; pd < 2; pd++) {
      var pdGeo = new T.BoxGeometry(3, 2.8, 0.25);
      var pdMesh = _mk(pdGeo, 0x556677);
      pdMesh.position.set(0, 1.4, pdPositions[pd]);
      _rootGroup.add(pdMesh);
      _pressureDoors.push(pdMesh);
    }
  }

  // Level 1: Command center BoxGeometry 30x4x20
  function _buildLevel1(T) {
    // Floor
    var f = _mk(new T.BoxGeometry(30, 0.2, 20), 0x334455);
    f.position.set(0, 0, -5);
    _rootGroup.add(f);

    // Ceiling
    var c = _mk(new T.BoxGeometry(30, 0.2, 20), 0x334455);
    c.position.set(0, 4, -5);
    _rootGroup.add(c);

    // Walls
    var walls = [
      { w: 30, h: 4, d: 0.2, x: 0,   y: 2, z: -15 },
      { w: 30, h: 4, d: 0.2, x: 0,   y: 2, z:  5  },
      { w: 0.2,h: 4, d: 20,  x: -15, y: 2, z: -5  },
      { w: 0.2,h: 4, d: 20,  x:  15, y: 2, z: -5  }
    ];
    for (var wi = 0; wi < walls.length; wi++) {
      var wl = walls[wi];
      var wm = _mk(new T.BoxGeometry(wl.w, wl.h, wl.d), 0x334455);
      wm.position.set(wl.x, wl.y, wl.z);
      _rootGroup.add(wm);
    }

    // 4 terminals with glass screens
    var termPositions = [
      { x: -10, z: -12 }, { x: -5, z: -12 },
      { x:  5,  z: -12 }, { x: 10, z: -12 }
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tp = termPositions[ti];
      // Terminal body
      var tbody = _mk(new T.BoxGeometry(1, 1.2, 0.6), 0x223344);
      tbody.position.set(tp.x, 0.6, tp.z);
      _rootGroup.add(tbody);
      // Glass screen
      var tscreen = _mk(new T.BoxGeometry(0.8, 0.7, 0.05), 0x44FFCC, 0x44FFCC);
      tscreen.position.set(tp.x, 1.0, tp.z + 0.32);
      _rootGroup.add(tscreen);
    }

    // Level lights
    for (var ll = 0; ll < 4; ll++) {
      var llight = new T.PointLight(0x7799AA, 0.5, 12);
      llight.position.set(-12 + ll * 8, 3.5, -5);
      _scene.add(llight);
    }

    // Abort console 1 (guarded) at left side of command center
    var c1 = _buildAbortConsole(T, -12, 1, -8, 0);
    _consoleMeshes.push(c1);

    // Downward opening to level 2 (stairwell at x=12, z=-10)
    var stairLabel = _mk(new T.BoxGeometry(2, 0.2, 2), 0x556677);
    stairLabel.position.set(12, 0.1, -10);
    _rootGroup.add(stairLabel);
  }

  // Level 2: Reactor level BoxGeometry 25x4x18
  function _buildLevel2(T) {
    var baseY = -6;

    var f = _mk(new T.BoxGeometry(25, 0.2, 18), 0x334444);
    f.position.set(0, baseY, -25);
    _rootGroup.add(f);

    var c = _mk(new T.BoxGeometry(25, 0.2, 18), 0x334444);
    c.position.set(0, baseY + 4, -25);
    _rootGroup.add(c);

    var walls2 = [
      { w: 25,  h: 4, d: 0.2, x: 0,    y: baseY + 2, z: -34 },
      { w: 25,  h: 4, d: 0.2, x: 0,    y: baseY + 2, z: -16 },
      { w: 0.2, h: 4, d: 18,  x: -12.5,y: baseY + 2, z: -25 },
      { w: 0.2, h: 4, d: 18,  x:  12.5,y: baseY + 2, z: -25 }
    ];
    for (var wi = 0; wi < walls2.length; wi++) {
      var wl = walls2[wi];
      var wm = _mk(new T.BoxGeometry(wl.w, wl.h, wl.d), 0x334444);
      wm.position.set(wl.x, wl.y, wl.z);
      _rootGroup.add(wm);
    }

    // Coolant pipes (CylinderGeometry)
    var pipePositions = [
      { x: -8, z: -30 }, { x: -4, z: -30 },
      { x:  4, z: -30 }, { x:  8, z: -30 }
    ];
    for (var pi = 0; pi < 4; pi++) {
      var pp = pipePositions[pi];
      var pipeGeo = new T.CylinderGeometry(0.25, 0.25, 4, 8);
      var pipeMesh = _mk(pipeGeo, 0x446655);
      pipeMesh.position.set(pp.x, baseY + 2, pp.z);
      _rootGroup.add(pipeMesh);
      // Horizontal connector
      var hpGeo = new T.CylinderGeometry(0.15, 0.15, 4, 8);
      var hpMesh = _mk(hpGeo, 0x446655);
      hpMesh.rotation.z = Math.PI / 2;
      hpMesh.position.set(pp.x + 2, baseY + 3.5, pp.z);
      _rootGroup.add(hpMesh);
    }

    // Reactor core glow
    var reactGeo = new T.CylinderGeometry(1.5, 1.5, 3.5, 12);
    var reactMesh = _mk(reactGeo, 0x226644, 0x226644);
    reactMesh.position.set(0, baseY + 2, -30);
    _rootGroup.add(reactMesh);
    var reactLight = new T.PointLight(0x22FF88, 0.8, 14);
    reactLight.position.set(0, baseY + 4, -30);
    _scene.add(reactLight);

    // Locked door to reactor section (key required)
    _reactorDoorMesh = _mk(new T.BoxGeometry(3, 3.8, 0.25), 0x556644);
    _reactorDoorMesh.position.set(-6, baseY + 2, -22);
    _rootGroup.add(_reactorDoorMesh);

    // Abort console 2 (behind locked door)
    var c2 = _buildAbortConsole(T, -8, baseY + 1, -28, 1);
    _consoleMeshes.push(c2);

    // Level 2 lights
    for (var ll2 = 0; ll2 < 3; ll2++) {
      var llight2 = new T.PointLight(0x559988, 0.5, 12);
      llight2.position.set(-8 + ll2 * 8, baseY + 3.5, -25);
      _scene.add(llight2);
    }

    // Stair down to level 3
    var stair2 = _mk(new T.BoxGeometry(2, 0.2, 2), 0x445566);
    stair2.position.set(10, baseY + 0.1, -32);
    _rootGroup.add(stair2);
  }

  // Level 3: Missile bay
  function _buildLevel3(T) {
    var baseY = -14;

    // Silo shaft CylinderGeometry r=8 h=40
    var shaftGeo = new T.CylinderGeometry(8, 8, 40, 16, 1, true);
    var shaftMat = new T.MeshLambertMaterial({ color: 0x223344, side: T.BackSide });
    var shaftMesh = new T.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(0, baseY + 6, -50);
    _rootGroup.add(shaftMesh);

    // Silo floor
    var siloFloor = _mk(new T.CylinderGeometry(8, 8, 0.5, 16), 0x223344);
    siloFloor.position.set(0, baseY - 14.25, -50);
    _rootGroup.add(siloFloor);

    // Platform around silo at level 3
    var platform = _mk(new T.BoxGeometry(20, 0.2, 20), 0x334455);
    platform.position.set(0, baseY, -50);
    _rootGroup.add(platform);

    // Platform walls
    var pwalls = [
      { w: 20, h: 4, d: 0.2, x: 0,   z: -40 },
      { w: 0.2,h: 4, d: 20,  x: -10, z: -50 },
      { w: 0.2,h: 4, d: 20,  x:  10, z: -50 }
    ];
    for (var pwi = 0; pwi < pwalls.length; pwi++) {
      var pw = pwalls[pwi];
      var pwm = _mk(new T.BoxGeometry(pw.w, pw.h, pw.d), 0x334455);
      pwm.position.set(pw.x, baseY + 2, pw.z);
      _rootGroup.add(pwm);
    }

    // Missile CylinderGeometry r=2 h=15
    var missileGeo = new T.CylinderGeometry(2, 2.2, 15, 16);
    _missileMesh = _mk(missileGeo, 0x334455);
    _missileY = baseY - 10;
    _missileMesh.position.set(0, _missileY, -50);
    _rootGroup.add(_missileMesh);

    // Missile nose cone
    var noseCone = _mk(new T.ConeGeometry(2, 4, 16), 0x445566);
    noseCone.position.set(0, _missileY + 9.5, -50);
    _rootGroup.add(noseCone);

    // Abort console 3 at missile base
    var c3 = _buildAbortConsole(T, 4, baseY + 1, -52, 2);
    _consoleMeshes.push(c3);

    // Level 3 platform lights
    for (var ll3 = 0; ll3 < 3; ll3++) {
      var llight3 = new T.PointLight(0x4466AA, 0.5, 10);
      llight3.position.set(-6 + ll3 * 6, baseY + 3, -48);
      _scene.add(llight3);
    }
  }

  function _buildAbortConsole(T, x, y, z, idx) {
    // Console body
    var bodyGeo = new T.BoxGeometry(1.2, 1.5, 0.8);
    var bodyMesh = _mk(bodyGeo, 0x334455);
    bodyMesh.position.set(x, y + 0.75, z);
    _rootGroup.add(bodyMesh);

    // Glass screen
    var screenGeo = new T.BoxGeometry(0.9, 0.7, 0.05);
    var screenMesh = _mk(screenGeo, 0x44AAFF, 0x22AAFF);
    screenMesh.position.set(x, y + 1.1, z + 0.43);
    _rootGroup.add(screenMesh);

    // Console light
    var cLight = new T.PointLight(0x44AAFF, 0.8, 5);
    cLight.position.set(x, y + 2, z);
    _scene.add(cLight);
    _consoleLights.push(cLight);

    return bodyMesh;
  }

  // General Romanov's bunker
  function _buildGeneralBunker(T) {
    var bx = -18, by = -6, bz = -25;

    // Bunker walls BoxGeometry
    var bFloor = _mk(new T.BoxGeometry(10, 0.2, 10), 0x223344);
    bFloor.position.set(bx, by, bz);
    _rootGroup.add(bFloor);

    var bCeil = _mk(new T.BoxGeometry(10, 0.2, 10), 0x223344);
    bCeil.position.set(bx, by + 4, bz);
    _rootGroup.add(bCeil);

    var bwalls = [
      { w: 10,  h: 4, d: 0.2, x: bx,     y: by + 2, z: bz - 5 },
      { w: 10,  h: 4, d: 0.2, x: bx,     y: by + 2, z: bz + 5 },
      { w: 0.2, h: 4, d: 10,  x: bx - 5, y: by + 2, z: bz     },
      { w: 0.2, h: 4, d: 10,  x: bx + 5, y: by + 2, z: bz     }
    ];
    for (var bwi = 0; bwi < bwalls.length; bwi++) {
      var bw = bwalls[bwi];
      var bwm = _mk(new T.BoxGeometry(bw.w, bw.h, bw.d), 0x223344);
      bwm.position.set(bw.x, bw.y, bw.z);
      _rootGroup.add(bwm);
    }

    // Blast door (LineSegments — closed initially, opens after 2 consoles)
    var doorEdges = [];
    var dw = 3, dh = 3.8;
    // Rectangle frame
    doorEdges.push(-dw/2, 0, 0,  dw/2, 0, 0);
    doorEdges.push( dw/2, 0, 0,  dw/2, dh, 0);
    doorEdges.push( dw/2, dh, 0, -dw/2, dh, 0);
    doorEdges.push(-dw/2, dh, 0, -dw/2, 0, 0);
    // Cross bars
    doorEdges.push(-dw/2, dh/3, 0,    dw/2, dh/3, 0);
    doorEdges.push(-dw/2, 2*dh/3, 0,  dw/2, 2*dh/3, 0);
    doorEdges.push(0, 0, 0,           0, dh, 0);

    var bldGeo = new T.BufferGeometry();
    var verts = new Float32Array(doorEdges);
    bldGeo.setAttribute('position', new T.BufferAttribute(verts, 3));
    var bldMat = new T.LineBasicMaterial({ color: 0xAABBCC, linewidth: 2 });
    _blastDoorLines = new T.LineSegments(bldGeo, bldMat);
    _blastDoorLines.position.set(bx + 5, by, bz - 2);
    _rootGroup.add(_blastDoorLines);

    // General Romanov — BoxGeometry
    var genGeo = new T.BoxGeometry(0.8, 1.7, 0.5);
    _generalMesh = _mk(genGeo, 0x443311);
    _generalMesh.position.set(bx - 1, by + 0.85, bz - 2);
    _rootGroup.add(_generalMesh);

    // Medals — CylinderGeometry
    var medalGeo = new T.CylinderGeometry(0.1, 0.1, 0.05, 8);
    var medalColors = [0xFFDD00, 0xCCCCCC, 0xFF4400];
    for (var mi = 0; mi < 3; mi++) {
      var medal = _mk(medalGeo, medalColors[mi], medalColors[mi]);
      medal.rotation.x = Math.PI / 2;
      medal.position.set(bx - 1.15 + mi * 0.12, by + 1.1, bz - 1.75);
      _rootGroup.add(medal);
    }

    // Radio on desk
    var radioGeo = new T.BoxGeometry(0.5, 0.3, 0.4);
    _radioMesh = _mk(radioGeo, 0x333333);
    _radioMesh.position.set(bx + 1, by + 0.95, bz - 3);
    _rootGroup.add(_radioMesh);

    // Desk
    var deskGeo = new T.BoxGeometry(2, 0.15, 1.2);
    var desk = _mk(deskGeo, 0x554433);
    desk.position.set(bx + 1, by + 0.8, bz - 3);
    _rootGroup.add(desk);

    // Bunker light
    var bLight = new T.PointLight(0xAA8855, 0.6, 12);
    bLight.position.set(bx, by + 3.5, bz);
    _scene.add(bLight);
  }

  // Elevator (CylinderGeometry platform)
  function _buildElevator(T) {
    var elevGeo = new T.CylinderGeometry(1.2, 1.2, 0.3, 12);
    _elevatorMesh = _mk(elevGeo, 0x556677);
    _elevatorMesh.position.set(10, -6, -32);
    _rootGroup.add(_elevatorMesh);

    // Shaft
    var shaftWalls = new T.CylinderGeometry(1.5, 1.5, 12, 12, 1, true);
    var shaftMat = new T.MeshLambertMaterial({ color: 0x334455, side: T.BackSide });
    var shaftMesh = new T.Mesh(shaftWalls, shaftMat);
    shaftMesh.position.set(10, -10, -32);
    _rootGroup.add(shaftMesh);
  }

  // Guards
  function _buildGuards(T) {
    _guards = [];

    // Level 1: 8 guards (4 soldiers near console 1, 4 others)
    var l1Positions = [
      { x: -10, z: -5, type: 'soldier' },
      { x: -13, z: -10, type: 'soldier' },
      { x: -10, z: -12, type: 'soldier' },
      { x: -14, z: -5, type: 'soldier' },
      { x:  5,  z: -8, type: 'soldier' },
      { x:  10, z: -5, type: 'soldier' },
      { x:  8,  z: -12, type: 'soldier' },
      { x:  0,  z: -8, type: 'soldier' }
    ];

    // Commander 1 on level 1 (has key1)
    l1Positions.push({ x: -6, z: -10, type: 'commander', key: 'key1' });

    // Level 2: 5 guards + 1 commander
    var l2Positions = [
      { x: -5,  z: -26, type: 'soldier' },
      { x:  5,  z: -26, type: 'soldier' },
      { x: -10, z: -30, type: 'soldier' },
      { x:  10, z: -30, type: 'soldier' },
      { x:  0,  z: -32, type: 'soldier' }
    ];
    // Commander 2 on level 2 (carries key2)
    l2Positions.push({ x: 0, z: -24, type: 'commander', key: 'key2' });

    // Level 2 hazmat room: 3 hazmat guards
    var hazPositions = [
      { x: -10, z: -28, type: 'hazmat' },
      { x: -10, z: -32, type: 'hazmat' },
      { x: -10, z: -30, type: 'hazmat' }
    ];

    // Level 3: 2 soldiers near missile
    var l3Positions = [
      { x: -4, z: -50, type: 'soldier' },
      { x:  4, z: -50, type: 'soldier' }
    ];

    var allPositions = l1Positions.concat(l2Positions).concat(hazPositions).concat(l3Positions);

    for (var gi = 0; gi < allPositions.length; gi++) {
      var gp = allPositions[gi];
      var g = _spawnGuard(T, gp.x, gp.z, gp.type, gp.key || null);
      _guards.push(g);
    }

    // Door panel meshes (4 panels to override lockdown)
    var panelPositions = [
      { x: 1.6, y: 1.5, z: 5.1 },
      { x: 1.6, y: 1.5, z: -16.1 },
      { x: -12.4, y: -4.5, z: -22.1 },
      { x: -12.4, y: -4.5, z: -40.1 }
    ];
    for (var dpi = 0; dpi < 4; dpi++) {
      var dpGeo = new T.BoxGeometry(0.3, 0.5, 0.2);
      var dpMesh = _mk(dpGeo, 0xFF4400, 0xFF4400);
      var dp = panelPositions[dpi];
      dpMesh.position.set(dp.x, dp.y, dp.z);
      _rootGroup.add(dpMesh);
      _doorPanelMeshes.push(dpMesh);
    }
  }

  function _spawnGuard(T, gx, gz, type, keyDrop) {
    var h = (type === 'commander') ? 1.9 : 1.7;
    var color = (type === 'hazmat') ? 0x446644 : 0x334444;
    var hp = (type === 'commander') ? COMMANDER_HP : (type === 'hazmat') ? HAZMAT_HP : GUARD_HP;

    var bodyGeo = new T.BoxGeometry(0.7, h, 0.45);
    var bodyMesh = _mk(bodyGeo, color);
    var gy = (gz < -13) ? ((gz < -40) ? -14 + h / 2 : -6 + h / 2) : h / 2;
    bodyMesh.position.set(gx, gy, gz);
    _rootGroup.add(bodyMesh);

    // Head
    var headGeo = new T.BoxGeometry(0.5, 0.5, 0.5);
    var headMesh = _mk(headGeo, color);
    headMesh.position.set(gx, gy + h / 2 + 0.3, gz);
    _rootGroup.add(headMesh);

    // Commander hat (CylinderGeometry)
    var hatMesh = null;
    if (type === 'commander') {
      var hatGeo = new T.CylinderGeometry(0.3, 0.32, 0.3, 10);
      hatMesh = _mk(hatGeo, 0x223344);
      hatMesh.position.set(gx, gy + h / 2 + 0.65, gz);
      _rootGroup.add(hatMesh);
    }

    return {
      body: bodyMesh,
      head: headMesh,
      hat: hatMesh,
      hp: hp,
      maxHp: hp,
      type: type,
      key: keyDrop,
      pos: { x: gx, y: gy, z: gz },
      state: 'patrol',
      alertTimer: 0,
      fireTimer: 0 + Math.random() * 1.5,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolRadius: 3 + Math.random() * 3,
      patrolOriginX: gx,
      patrolOriginZ: gz,
      alive: true,
      keyDropped: false
    };
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    // Remove any existing
    var old = document.getElementById('nuke-launch-hud');
    if (old) old.parentNode.removeChild(old);
    var oldMsg = document.getElementById('nuke-launch-msg');
    if (oldMsg) oldMsg.parentNode.removeChild(oldMsg);
    var oldOv = document.getElementById('nuke-launch-overlay');
    if (oldOv) oldOv.parentNode.removeChild(oldOv);

    _hudEl = document.createElement('div');
    _hudEl.id = 'nuke-launch-hud';
    _hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'padding:8px 14px', 'background:rgba(0,0,0,0.72)',
      'color:#00FF88', 'font:bold 13px monospace',
      'z-index:9990', 'letter-spacing:0.04em',
      'text-shadow:0 0 6px #00FF88'
    ].join(';');
    document.body.appendChild(_hudEl);

    _msgEl = document.createElement('div');
    _msgEl.id = 'nuke-launch-msg';
    _msgEl.style.cssText = [
      'position:fixed', 'top:50px', 'left:50%', 'transform:translateX(-50%)',
      'padding:10px 22px', 'background:rgba(0,0,0,0.8)',
      'color:#FFCC00', 'font:bold 16px monospace',
      'z-index:9991', 'border:1px solid #FFCC00',
      'opacity:0', 'transition:opacity 0.3s',
      'text-align:center', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(_msgEl);

    _overlayEl = document.createElement('div');
    _overlayEl.id = 'nuke-launch-overlay';
    _overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.85)',
      'color:#FFF', 'font:bold 32px monospace',
      'display:flex', 'align-items:center', 'justify-content:center',
      'flex-direction:column', 'gap:16px',
      'z-index:9995', 'display:none'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _updateHUD() {
    if (!_hudEl) return;

    var numDestroyed = (_consoleDestroyed[0] ? 1 : 0) +
                       (_consoleDestroyed[1] ? 1 : 0) +
                       (_consoleDestroyed[2] ? 1 : 0);

    var generalStatus = _generalState === 'locked'     ? 'LOCKED'      :
                        _generalState === 'active'     ? 'ACTIVE'      :
                        _generalState === 'eliminated' ? 'ELIMINATED'  : '???';

    var doorStatus = _doorLockdown ? 'LOCKED' : 'OPEN';

    var aliveGuards = 0;
    for (var gi = 0; gi < _guards.length; gi++) {
      if (_guards[gi].alive) aliveGuards++;
    }

    var cd = _formatTime(_timeLeft);
    // Red color when under 2 minutes
    var cdColor = (_timeLeft < 120) ? '#FF2200' : (_timeLeft < 300 ? '#FFAA00' : '#00FF88');

    _hudEl.innerHTML =
      'NUKE LAUNCH &nbsp;|&nbsp; ' +
      'CONSOLES: <span style="color:#FFCC00">' + numDestroyed + '/3 DESTROYED</span> &nbsp;|&nbsp; ' +
      'COUNTDOWN: <span style="color:' + cdColor + '">' + cd + '</span> &nbsp;|&nbsp; ' +
      'GUARDS: <span style="color:#AACCFF">' + aliveGuards + '</span> &nbsp;|&nbsp; ' +
      'GENERAL: <span style="color:#FF8844">' + generalStatus + '</span> &nbsp;|&nbsp; ' +
      'DOOR: <span style="color:#88CCFF">' + doorStatus + '</span> &nbsp;|&nbsp; ' +
      'HP: <span style="color:#FF4444">' + Math.max(0, Math.ceil(_playerHP)) + '</span>';
  }

  // ── Pointer lock ───────────────────────────────────────────────────────────
  function _requestPointerLock() {
    if (_container && _container.requestPointerLock) {
      _container.requestPointerLock();
    }
  }

  function _onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement === _container);
  }

  function _onMouseMove(e) {
    if (!_pointerLocked || !_active) return;
    var sens = 0.002;
    _yaw   -= e.movementX * sens;
    _pitch -= e.movementY * sens;
    _pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active || _gameOver) return;
    if (e.button === 0) {
      _requestPointerLock();
      _tryShoot();
    }
  }

  // ── Shooting ───────────────────────────────────────────────────────────────
  function _tryShoot() {
    if (_shootCooldown > 0 || _gameOver) return;
    _shootCooldown = SHOOT_COOLDOWN;
    _playShot();

    var T = _T();
    if (!T) return;

    // Raycast from camera forward
    var dir = new T.Vector3(0, 0, -1);
    dir.applyEuler(new T.Euler(_pitch, _yaw, 0, 'YXZ'));

    var origin = new T.Vector3(_playerPos.x, _playerPos.y, _playerPos.z);
    var ray = new T.Raycaster(origin, dir, 0, 30);

    // Check guards
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;
      var hits = ray.intersectObject(g.body, false);
      if (hits.length > 0) {
        _damageGuard(gi, 35);
        return;
      }
      var hitsHead = ray.intersectObject(g.head, false);
      if (hitsHead.length > 0) {
        _damageGuard(gi, 70);
        return;
      }
    }

    // Check general
    if (_generalState === 'active' && _generalMesh && _generalMesh.visible) {
      var genHit = ray.intersectObject(_generalMesh, false);
      if (genHit.length > 0) {
        _generalHP -= 40;
        _playHit();
        if (_generalHP <= 0) {
          _killGeneral();
        }
        return;
      }
    }

    // Check radio
    if (!_radioDestroyed && _radioMesh && _radioMesh.visible) {
      var radioHit = ray.intersectObject(_radioMesh, false);
      if (radioHit.length > 0) {
        _radioDestroyed = true;
        _radioMesh.visible = false;
        _showMsg('Radio destroyed! General cannot call reinforcements.', 3);
        _playDestroy();
        return;
      }
    }

    // Check door override panels
    for (var dpi = 0; dpi < _doorPanelMeshes.length; dpi++) {
      if (_doorOverrideDestroyed[dpi]) continue;
      var dpHit = ray.intersectObject(_doorPanelMeshes[dpi], false);
      if (dpHit.length > 0) {
        _doorOverrideDestroyed[dpi] = true;
        _doorPanelMeshes[dpi].visible = false;
        _playDestroy();
        _showMsg('Door panel shot out — passage unlocked!', 2.5);
        return;
      }
    }
  }

  function _damageGuard(gi, dmg) {
    var g = _guards[gi];
    g.hp -= dmg;
    g.state = 'hostile';
    _playHit();
    if (g.hp <= 0) {
      _killGuard(gi);
    } else {
      if (!_guardsAlerted) {
        _guardsAlerted = true;
        _playAlarm();
        _showMsg('ALERT! Guards are hostile!', 3);
      }
    }
  }

  function _killGuard(gi) {
    var g = _guards[gi];
    g.alive = false;
    g.body.visible = false;
    if (g.head) g.head.visible = false;
    if (g.hat) g.hat.visible = false;
    _playDestroy();

    // Drop key
    if (g.key === 'key1' && !_hasKey1) {
      _hasKey1 = true;
      _showMsg('Key card acquired! Reactor door can now be unlocked.', 4);
      _playBeep();
    }
    if (g.key === 'key2' && !_hasKey2) {
      _hasKey2 = true;
      _showMsg('Access code acquired! Console 3 interaction enabled.', 4);
      _playBeep();
    }
  }

  function _killGeneral() {
    _generalState = 'eliminated';
    if (_generalMesh) _generalMesh.visible = false;
    _playDestroy();
    _showMsg('General Romanov eliminated! Console 3 access granted.', 5);
    _hasKey2 = true; // also grants access to console 3
  }

  // ── Elevator logic ─────────────────────────────────────────────────────────
  function _tryElevator() {
    if (!_elevatorMesh) return;
    var ep = _elevatorMesh.position;
    var d = _dist3(_playerPos, { x: ep.x, y: ep.y, z: ep.z });
    if (d > 2.5) return;
    if (_elevatorActive) return;
    _elevatorActive = true;
    _elevatorTimer = 0;
    _elevatorStart = true;
    _showMsg('Descending to missile bay... (10s)', 3);
    _playBeep();
  }

  // ── Key interaction ────────────────────────────────────────────────────────
  function _tryInteract() {
    if (_gameOver) return;

    // Console interaction
    for (var ci = 0; ci < _consoleMeshes.length; ci++) {
      if (_consoleDestroyed[ci]) continue;

      // Console 2 requires key1
      if (ci === 1 && !_hasKey1) continue;
      // Console 3 requires elevator + key2 (from general or commander)
      if (ci === 2 && (!_elevatorUsed || !_hasKey2)) continue;

      var cm = _consoleMeshes[ci];
      var d = _dist3(_playerPos, { x: cm.position.x, y: cm.position.y, z: cm.position.z });
      if (d < INTERACT_RANGE + 1) {
        _consoleHolding = ci;
        return;
      }
    }

    // Elevator
    _tryElevator();

    // Reactor door
    if (!_reactorDoorOpen && _hasKey1 && _reactorDoorMesh) {
      var rd = _reactorDoorMesh.position;
      var rdDist = _dist3(_playerPos, { x: rd.x, y: rd.y, z: rd.z });
      if (rdDist < 3) {
        _reactorDoorOpen = true;
        _reactorDoorMesh.visible = false;
        _showMsg('Reactor section unlocked!', 3);
        _playBeep();
      }
    }
  }

  // ── Collision / movement helpers ───────────────────────────────────────────
  function _getFloorY(x, z) {
    // Level detection by Z
    if (z > 5) return 1.7;          // tunnel
    if (z > -16) return 1.7;        // level 1
    if (z > -40) return -6 + 1.7;   // level 2
    return -14 + 1.7;               // level 3 / silo
  }

  // ── Player update ──────────────────────────────────────────────────────────
  function _updatePlayer(dt) {
    if (_gameOver) return;

    // Rotation from yaw/pitch
    var cosY = Math.cos(_yaw);
    var sinY = Math.sin(_yaw);

    var moveX = 0, moveZ = 0;
    var speed = MOVE_SPEED;

    if (_keys['KeyW'] || _keys['ArrowUp'])    { moveX -= sinY; moveZ -= cosY; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { moveX += sinY; moveZ += cosY; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= cosY; moveZ += sinY; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += cosY; moveZ -= sinY; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    _playerVel.x = moveX * speed;
    _playerVel.z = moveZ * speed;

    // Gravity
    _playerVel.y += GRAVITY * dt;
    var floorY = _getFloorY(_playerPos.x, _playerPos.z);

    _playerPos.x += _playerVel.x * dt;
    _playerPos.z += _playerVel.z * dt;
    _playerPos.y += _playerVel.y * dt;

    // Floor collision
    if (_playerPos.y <= floorY) {
      _playerPos.y = floorY;
      _playerVel.y = 0;
      _onGround = true;
    } else {
      _onGround = false;
    }

    // Jump
    if ((_keys['Space']) && _onGround) {
      _playerVel.y = JUMP_SPEED;
      _onGround = false;
    }

    // Clamp player to arena bounds
    _playerPos.x = Math.max(-14.5, Math.min(14.5, _playerPos.x));
    _playerPos.z = Math.max(-60, Math.min(26, _playerPos.z));

    // Update camera
    _camera.position.set(_playerPos.x, _playerPos.y + 0.3, _playerPos.z);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;

    // Shoot cooldown
    if (_shootCooldown > 0) _shootCooldown -= dt;
    if (_shootCooldown < 0) _shootCooldown = 0;
  }

  // ── Console hold logic ─────────────────────────────────────────────────────
  function _updateConsoleHold(dt) {
    if (_consoleHolding < 0) return;
    var ci = _consoleHolding;

    if (_consoleDestroyed[ci]) { _consoleHolding = -1; return; }

    if (!_keys['KeyE']) {
      _consoleProgress[ci] = 0;
      _consoleHolding = -1;
      return;
    }

    _consoleProgress[ci] += dt;
    if (_consoleProgress[ci] >= CONSOLE_DESTROY) {
      _consoleDestroyed[ci] = true;
      _consoleProgress[ci] = CONSOLE_DESTROY;
      _consoleHolding = -1;
      _consoleMeshes[ci].visible = false;
      if (_consoleLights[ci]) _consoleLights[ci].intensity = 0;
      _playDestroy();
      var numDone = (_consoleDestroyed[0] ? 1 : 0) +
                    (_consoleDestroyed[1] ? 1 : 0) +
                    (_consoleDestroyed[2] ? 1 : 0);
      _showMsg('ABORT CONSOLE ' + (ci + 1) + ' DESTROYED! (' + numDone + '/3)', 4);
      _playAlarm();

      // Open blast door after consoles 1 + 2 destroyed
      if (_consoleDestroyed[0] && _consoleDestroyed[1]) {
        _generalBunkerOpen = true;
        _generalState = 'active';
        if (_blastDoorLines) _blastDoorLines.visible = false;
        _showMsg('BLAST DOOR OPEN — General Romanov is active!', 5);
      }
    }
  }

  // ── Elevator update ────────────────────────────────────────────────────────
  function _updateElevator(dt) {
    if (!_elevatorActive) return;
    _elevatorTimer += dt;

    var t = Math.min(1, _elevatorTimer / ELEVATOR_TIME);
    // Move elevator from level 2 to level 3
    if (_elevatorMesh) {
      _elevatorMesh.position.y = -6 + (-8) * t;
    }

    // Move player with elevator
    if (_elevatorStart) {
      _playerPos.x = 10;
      _playerPos.z = -32;
      _playerPos.y = _elevatorMesh.position.y + 1.7;
    }

    if (_elevatorTimer >= ELEVATOR_TIME) {
      _elevatorActive = false;
      _elevatorStart = false;
      _elevatorUsed = true;
      _playerPos.y = -14 + 1.7;
      _showMsg('Arrived at missile bay Level 3.', 3);
    }
  }

  // ── General AI ────────────────────────────────────────────────────────────
  function _updateGeneral(dt) {
    if (_generalState !== 'active') return;
    if (!_generalMesh || !_generalMesh.visible) {
      _generalMesh.visible = true;
    }

    // General fires at player occasionally
    _generalFireTimer -= dt;
    var dx = _playerPos.x - _generalMesh.position.x;
    var dz = _playerPos.z - _generalMesh.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (_generalFireTimer <= 0 && dist < 20) {
      _generalFireTimer = 1.5;
      // 30% hit chance
      if (Math.random() < 0.3) {
        _playerHP -= 15;
        _playHit();
        if (_playerHP <= 0) { _triggerGameOver('You were killed by General Romanov.'); }
      }
      _playShot();
    }

    // General tries to launch if player is near console 3 and console 3 not destroyed
    if (!_consoleDestroyed[2]) {
      var launchDist = _dist3(_playerPos, {
        x: _consoleMeshes[2] ? _consoleMeshes[2].position.x : 4,
        y: _playerPos.y,
        z: _consoleMeshes[2] ? _consoleMeshes[2].position.z : -52
      });
      if (launchDist < 10) {
        _generalHoldingLaunch = true;
        _generalLaunchProgress += dt;
        if (_generalLaunchProgress >= 3) {
          // Manual launch triggered early
          _triggerMissileLaunch();
        }
      } else {
        _generalHoldingLaunch = false;
        _generalLaunchProgress = 0;
      }
    }

    // Call reinforcements (if radio not destroyed and not already called)
    if (!_radioDestroyed && !_reinforcementCalled) {
      var T = _T();
      if (T && _guards.length < 30) {
        _reinforcementCalled = true;
        _spawnReinforcements(T);
        _showMsg('General called REINFORCEMENTS!', 4);
        _playAlarm();
      }
    }
  }

  function _spawnReinforcements(T) {
    for (var ri = 0; ri < REINFORCEMENT_COUNT; ri++) {
      var g = _spawnGuard(T, -16 + ri * 2, -24, 'soldier', null);
      g.state = 'hostile';
      _guards.push(g);
    }
  }

  // ── Guard AI ───────────────────────────────────────────────────────────────
  function _updateGuards(dt) {
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (!g.alive) continue;

      var dx = _playerPos.x - g.pos.x;
      var dy = _playerPos.y - g.pos.y;
      var dz = _playerPos.z - g.pos.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (g.state === 'patrol') {
        // Circle patrol
        g.patrolAngle += dt * 0.5;
        var tx = g.patrolOriginX + Math.cos(g.patrolAngle) * g.patrolRadius;
        var tz = g.patrolOriginZ + Math.sin(g.patrolAngle) * g.patrolRadius;
        var pdx = tx - g.pos.x, pdz = tz - g.pos.z;
        var plen = Math.sqrt(pdx * pdx + pdz * pdz);
        if (plen > 0.1) {
          g.pos.x += (pdx / plen) * 2 * dt;
          g.pos.z += (pdz / plen) * 2 * dt;
        }

        // Detect player
        if (dist < 12 || _guardsAlerted) {
          g.state = 'hostile';
          if (!_guardsAlerted) {
            _guardsAlerted = true;
            _playAlarm();
          }
        }
      } else {
        // Hostile — move toward player
        if (dist > 2) {
          var speed = 3.5;
          g.pos.x += (dx / dist) * speed * dt;
          g.pos.z += (dz / dist) * speed * dt;
        }

        // Fire at player
        g.fireTimer -= dt;
        if (g.fireTimer <= 0 && dist < 18) {
          g.fireTimer = 1.2 + Math.random() * 0.8;
          var hitChance = (dist < 8) ? 0.35 : 0.18;
          if (g.type === 'commander') hitChance += 0.1;
          if (Math.random() < hitChance) {
            _playerHP -= (g.type === 'commander') ? 20 : 12;
            _playHit();
            if (_playerHP <= 0) {
              _triggerGameOver('You were killed in action.');
            }
          }
          _playShot();
        }
      }

      // Sync mesh
      g.body.position.set(g.pos.x, g.pos.y, g.pos.z);
      if (g.head) g.head.position.set(g.pos.x, g.pos.y + (g.type === 'commander' ? 1.2 : 1.0), g.pos.z);
      if (g.hat) g.hat.position.set(g.pos.x, g.pos.y + 1.45, g.pos.z);
    }
  }

  // ── Door lockdown ──────────────────────────────────────────────────────────
  function _updateDoors(dt) {
    if (!_doorLockdown && _timeLeft <= DOOR_LOCKDOWN && _timeLeft > 0) {
      _doorLockdown = true;
      _showMsg('EMERGENCY LOCKDOWN — Shoot door panels to override!', 5);
      _playAlarm();
    }

    // Update pressure doors (open automatically as player approaches entry)
    for (var pdi = 0; pdi < _pressureDoors.length; pdi++) {
      var pd = _pressureDoors[pdi];
      var pdx = _playerPos.x - pd.position.x;
      var pdz = _playerPos.z - pd.position.z;
      var pdDist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pdDist < 4) {
        if (!_pressureDoorOpen[pdi]) {
          _pressureDoorOpen[pdi] = true;
          pd.visible = false;
        }
      }
    }
  }

  // ── Countdown & tension ────────────────────────────────────────────────────
  function _updateCountdown(dt) {
    if (_gameOver || _gameWon) return;
    _timeLeft -= dt;

    // Pulse red nuke light intensity with countdown urgency
    _pulseT += dt * 2;
    var urgency = 1 - Math.max(0, _timeLeft / TOTAL_TIME);
    var pulse = (Math.sin(_pulseT * (1 + urgency * 4)) * 0.5 + 0.5);
    if (_nukeLight) {
      _nukeLight.intensity = 0.2 + pulse * urgency * 2.5;
    }

    // At 2 minutes: launch imminent
    if (_timeLeft <= 120 && _timeLeft > 119.5) {
      _showMsg('LAUNCH IMMINENT — 2 MINUTES REMAINING!', 6);
      _playAlarm();
    }

    // At 1 minute: fuel glow starts
    if (_timeLeft <= 60) {
      if (_fuelLight) {
        var fuelPulse = Math.sin(_pulseT * 3) * 0.5 + 0.5;
        _fuelLight.intensity = 0.8 + fuelPulse * 1.2;
      }
      if (_timeLeft <= 59.5 && _timeLeft > 59) {
        _showMsg('MISSILE FUELING — 1 MINUTE TO LAUNCH!', 5);
        _playAlarm();
      }
    }

    // Countdown hit zero
    if (_timeLeft <= 0) {
      _timeLeft = 0;
      // Check if any console not destroyed
      if (!_consolesDestroyed()) {
        _triggerMissileLaunch();
      }
    }
  }

  function _triggerMissileLaunch() {
    if (_gameOver) return;
    _missileRising = true;
    _triggerGameOver('LAUNCH SEQUENCE COMPLETE — Nuclear missile launched. Mission failed.');
    _playAlarm();
  }

  function _updateMissile(dt) {
    if (!_missileRising || !_missileMesh) return;
    _missileY += 12 * dt;
    _missileMesh.position.y = _missileY;
  }

  // ── Win / Lose ─────────────────────────────────────────────────────────────
  function _checkWin() {
    if (_gameOver || _gameWon) return;
    if (_consolesDestroyed()) {
      _gameWon = true;
      _gameOver = true;
      _showEndScreen(true);
      _playBeep();
    }
  }

  function _triggerGameOver(reason) {
    if (_gameOver) return;
    _gameOver = true;
    _gameWon = false;
    _showEndScreen(false, reason);
  }

  function _showEndScreen(won, reason) {
    if (!_overlayEl) return;
    _overlayEl.style.display = 'flex';
    var title = won
      ? '<div style="color:#00FF88;font-size:40px">LAUNCH ABORTED</div>'
      : '<div style="color:#FF2200;font-size:40px">MISSION FAILED</div>';
    var sub = won
      ? '<div style="color:#AAFFCC;font-size:18px">All 3 abort consoles destroyed. The missile stays grounded.</div>'
      : '<div style="color:#FFAAAA;font-size:18px">' + (reason || 'Mission failed.') + '</div>';
    _overlayEl.innerHTML = title + sub +
      '<div style="color:#888;font-size:14px;margin-top:20px">Press ESC to exit or R to restart</div>';
  }

  // ── E key hold detection ───────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (!_active) {
      // Activation detection
      if (e.code === 'KeyN') { _nDown = true; _nTime = Date.now(); }
      if (e.code === 'KeyL') { _lDown = true; _lTime = Date.now(); }
      if (_nDown && _lDown && Math.abs(_nTime - _lTime) <= ACTIVATION_WINDOW) {
        _activate();
        return;
      }
      return;
    }

    _keys[e.code] = true;

    if (_gameOver) {
      if (e.code === 'Escape') { _deactivate(); return; }
      if (e.code === 'KeyR') { _resetAndRestart(); return; }
      return;
    }

    if (e.code === 'Escape') { _deactivate(); return; }

    if (e.code === 'KeyE') {
      _tryInteract();
    }
  }

  function _onKeyUp(e) {
    if (!_active) {
      if (e.code === 'KeyN') _nDown = false;
      if (e.code === 'KeyL') _lDown = false;
      return;
    }
    _keys[e.code] = false;

    if (e.code === 'KeyE') {
      _consoleHolding = -1;
    }
  }

  // ── Main loop ──────────────────────────────────────────────────────────────
  function _loop() {
    _animId = requestAnimationFrame(_loop);
    var dt = Math.min(0.05, _clock.getDelta());

    if (!_gameOver) {
      _updatePlayer(dt);
      _updateConsoleHold(dt);
      _updateElevator(dt);
      _updateGuards(dt);
      _updateGeneral(dt);
      _updateDoors(dt);
      _updateCountdown(dt);
      _updateMissile(dt);
      _checkWin();

      // Progress message for E-hold
      if (_consoleHolding >= 0) {
        var pct = Math.floor((_consoleProgress[_consoleHolding] / CONSOLE_DESTROY) * 100);
        _showMsg('Destroying console ' + (_consoleHolding + 1) + '... ' + pct + '%', 0.2);
      }

      // Message timer
      if (_msgTimer > 0) {
        _msgTimer -= dt;
        if (_msgTimer <= 0) {
          _msgTimer = 0;
          if (_msgEl) _msgEl.style.opacity = '0';
        }
      }
    }

    _updateHUD();
    _renderer.render(_scene, _camera);
  }

  // ── Activation / Deactivation ──────────────────────────────────────────────
  function _activate() {
    if (_active) return;
    var T = _T();
    if (!T) { console.warn('NukeLaunch: THREE not found'); return; }

    _active = true;
    _nDown = false;
    _lDown = false;

    // Container
    _container = document.createElement('div');
    _container.id = 'nuke-launch-container';
    _container.style.cssText = 'position:fixed;inset:0;z-index:9980;background:#000;cursor:crosshair;';
    document.body.appendChild(_container);

    // Renderer
    _renderer = new T.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(window.devicePixelRatio || 1);
    _container.appendChild(_renderer.domElement);

    // Scene
    _scene = new T.Scene();
    _scene.background = new T.Color(0x0a0a0f);
    _scene.fog = new T.Fog(0x0a0a0f, 20, 80);

    // Camera
    _camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    // Clock
    _clock = new T.Clock();

    // Build world
    _buildScene();
    _buildHUD();

    // Position player at tunnel entry
    _playerPos = { x: 0, y: 1.7, z: 22 };
    _yaw = Math.PI; // facing inward (toward -Z)
    _pitch = 0;

    // Events
    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);
    document.addEventListener('mousemove', _onMouseMove);
    _container.addEventListener('mousedown', _onMouseDown);
    document.addEventListener('pointerlockchange', _onPointerLockChange);
    window.addEventListener('resize', _onResize);

    _requestPointerLock();
    _loop();

    _showMsg('MISSION: Destroy all 3 abort consoles before countdown! E=Interact, LMB=Shoot', 7);
  }

  function _deactivate() {
    _active = false;

    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('pointerlockchange', _onPointerLockChange);
    window.removeEventListener('resize', _onResize);

    if (document.pointerLockElement) document.exitPointerLock();

    if (_container && _container.parentNode) {
      _container.parentNode.removeChild(_container);
    }
    if (_hudEl && _hudEl.parentNode)     { _hudEl.parentNode.removeChild(_hudEl); }
    if (_msgEl && _msgEl.parentNode)     { _msgEl.parentNode.removeChild(_msgEl); }
    if (_overlayEl && _overlayEl.parentNode) { _overlayEl.parentNode.removeChild(_overlayEl); }

    if (_renderer) { _renderer.dispose(); _renderer = null; }
    _scene = null;
    _camera = null;
    _clock = null;
    _container = null;
    _hudEl = null;
    _msgEl = null;
    _overlayEl = null;
  }

  function _onResize() {
    if (!_camera || !_renderer) return;
    _camera.aspect = window.innerWidth / window.innerHeight;
    _camera.updateProjectionMatrix();
    _renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function _resetState() {
    _timeLeft    = TOTAL_TIME;
    _gameOver    = false;
    _gameWon     = false;
    _pulseT      = 0;

    _playerPos   = { x: 0, y: 1.7, z: 22 };
    _playerVel   = { x: 0, y: 0, z: 0 };
    _playerHP    = PLAYER_HP;
    _onGround    = false;
    _shootCooldown = 0;
    _hasKey1     = false;
    _hasKey2     = false;
    _elevatorUsed = false;
    _elevatorActive = false;
    _elevatorTimer  = 0;
    _elevatorStart  = false;

    _consoleDestroyed = [false, false, false];
    _consoleHolding   = -1;
    _consoleProgress  = [0, 0, 0];

    _generalHP     = GENERAL_HP;
    _generalState  = 'locked';
    _generalBunkerOpen = false;
    _generalFireTimer  = 0;
    _radioDestroyed    = false;
    _reinforcementCalled = false;
    _generalLaunchProgress = 0;
    _generalHoldingLaunch  = false;

    _guards        = [];
    _guardsAlerted = false;
    _doorLockdown  = false;
    _doorOverrideDestroyed = [false, false, false, false];

    _phase = 'tunnel';

    _rootGroup     = null;
    _nukeLight     = null;
    _fuelLight     = null;
    _missileMesh   = null;
    _missileY      = -17;
    _missileRising = false;

    _consoleMeshes     = [];
    _consoleLights     = [];
    _generalMesh       = null;
    _radioMesh         = null;
    _elevatorMesh      = null;
    _blastDoorLines    = null;
    _doorPanelMeshes   = [];
    _pressureDoors     = [];
    _pressureDoorOpen  = [false, false];
    _reactorDoorMesh   = null;
    _reactorDoorOpen   = false;

    _yaw   = Math.PI;
    _pitch = 0;
    _keys  = {};
    _pointerLocked = false;
  }

  function _resetAndRestart() {
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }

    if (_renderer) { _renderer.dispose(); _renderer = null; }
    _scene = null;
    _camera = null;
    _clock = null;

    if (_hudEl && _hudEl.parentNode)     { _hudEl.parentNode.removeChild(_hudEl); }
    if (_msgEl && _msgEl.parentNode)     { _msgEl.parentNode.removeChild(_msgEl); }
    if (_overlayEl && _overlayEl.parentNode) { _overlayEl.parentNode.removeChild(_overlayEl); }
    _hudEl = null; _msgEl = null; _overlayEl = null;

    // Keep container, rebuild inside it
    var oldContainer = _container;
    _resetState();
    _container = oldContainer;

    var T = _T();
    if (!T) return;

    _renderer = new T.WebGLRenderer({ antialias: true });
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.setPixelRatio(window.devicePixelRatio || 1);
    _container.appendChild(_renderer.domElement);

    _scene = new T.Scene();
    _scene.background = new T.Color(0x0a0a0f);
    _scene.fog = new T.Fog(0x0a0a0f, 20, 80);

    _camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    _clock = new T.Clock();

    _buildScene();
    _buildHUD();

    _active = true;
    _requestPointerLock();
    _loop();
    _showMsg('MISSION RESTART: Destroy all 3 abort consoles before countdown!', 6);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  function init() {
    document.addEventListener('keydown', function _initKeyDown(e) {
      if (e.code === 'KeyN') { _nDown = true; _nTime = Date.now(); }
      if (e.code === 'KeyL') { _lDown = true; _lTime = Date.now(); }
      if (_nDown && _lDown && Math.abs(_nTime - _lTime) <= ACTIVATION_WINDOW) {
        document.removeEventListener('keydown', _initKeyDown);
        _activate();
      }
    });
    document.addEventListener('keyup', function(e) {
      if (!_active) {
        if (e.code === 'KeyN') _nDown = false;
        if (e.code === 'KeyL') _lDown = false;
      }
    });
  }

  function update(dt) {
    // External update hook (optional, loop is self-contained)
  }

  function reset() {
    if (_active) _deactivate();
    _resetState();
  }

  return { init: init, update: update, reset: reset };

}());
