window.KungFuDojo = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── Activation key tracking ──────────────────────────────────────────────
  var keysDown = {};
  var kDownAt = 0;
  var fDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;
  var scene, camera, renderer, animFrameId;

  // ─── Game state ───────────────────────────────────────────────────────────
  var playerHP = 150;
  var playerMaxHP = 150;
  var currentRound = 1;
  var totalRounds = 7;
  var score = 0;
  var gameOver = false;
  var gameWon = false;
  var honorStrikes = 0; // dishonor count
  var maxHonorStrikes = 3;
  var clock = { last: 0 };
  var audioCtx = null;
  var hudEl = null;

  // ─── Player state ─────────────────────────────────────────────────────────
  var playerMesh = null;
  var playerPos = { x: 0, y: 0, z: 8 };
  var playerVelX = 0;
  var playerVelZ = 0;
  var moveDir = { x: 0, z: 0 };

  // Combat cooldowns & states
  var punchCooldown = 0;
  var kickCooldown = 0;
  var blockActive = false;
  var blockHeldTime = 0;
  var blockFatigued = false;
  var dodgeActive = false;
  var dodgeTimer = 0;
  var dodgeDirX = 0;
  var invincTimer = 0;
  var throwChargeTimer = 0;
  var throwCharging = false;
  var punchHeldTimer = 0;
  var punchHeld = false;
  var attackCooldown = 0;

  // Double-tap dodge
  var lastTapA = 0;
  var lastTapD = 0;
  var TAP_INTERVAL = 300;

  // ─── Chi system ───────────────────────────────────────────────────────────
  var chi = 0; // 0-100
  var ironPalmActive = false;
  var ironPalmTimer = 0;
  var flyingKickActive = false;
  var flyingKickTimer = 0;
  var flyingKickPos = { x: 0, y: 0, z: 0 };
  var flyingKickDir = { x: 0, z: 0 };
  var ironBodyActive = false;
  var ironBodyTimer = 0;

  // ─── Combo system ─────────────────────────────────────────────────────────
  var comboBuffer = []; // array of { action, time }
  var COMBO_WINDOW = 0.5; // seconds
  var comboHits = 0;
  var comboTimer = 0;
  var COMBO_DECAY = 2.0;
  var lastMoves = []; // for Grandmaster mirroring

  // ─── Enemy state ──────────────────────────────────────────────────────────
  var enemyMesh = null;
  var enemyPos = { x: 0, y: 0, z: -6 };
  var enemyHP = 80;
  var enemyMaxHP = 80;
  var enemyStunTimer = 0;
  var enemyAirStunTimer = 0;
  var enemyKnockback = { x: 0, z: 0 };
  var enemyKnockbackTimer = 0;
  var enemyAttackTimer = 0;
  var enemyBlockTimer = 0;
  var enemyBlockActive = false;
  var enemyDown = false;
  var enemyDownTimer = 0;
  var roundTransitionTimer = 0;
  var roundTransitionActive = false;
  var grandmasterMirrorMoves = [];
  var grandmasterMirrorTimer = 0;

  // ─── Environment objects ──────────────────────────────────────────────────
  var lanterns = [];
  var lanternLights = [];
  var spectators = [];
  var weaponRacks = [];
  var walls = [];
  var senseiMesh = null;
  var platformMesh = null;

  // ─── Visuals ──────────────────────────────────────────────────────────────
  var hitFlashTimer = 0;
  var screenFlashEl = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }

  // ─── Round definitions ────────────────────────────────────────────────────
  var ROUND_DEFS = [
    { hp: 80,  color: 0x334422, name: 'Student I',       ai: 'basic' },
    { hp: 80,  color: 0x334422, name: 'Student II',      ai: 'basic' },
    { hp: 120, color: 0x225522, name: 'Adv. Student I',  ai: 'advanced' },
    { hp: 120, color: 0x225522, name: 'Adv. Student II', ai: 'advanced' },
    { hp: 180, color: 0x222222, name: 'Black Belt I',    ai: 'blackbelt' },
    { hp: 180, color: 0x222222, name: 'Black Belt II',   ai: 'blackbelt' },
    { hp: 350, color: 0x221111, name: 'Grandmaster',     ai: 'grandmaster' }
  ];

  // ─── Audio ────────────────────────────────────────────────────────────────
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }

  function playTone(freq, type, dur, vol) {
    if (!audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }

  function playPunchSound() { playTone(180, 'sawtooth', 0.08, 0.2); }
  function playKickSound()  { playTone(120, 'sawtooth', 0.12, 0.25); }
  function playBlockSound() { playTone(300, 'square', 0.06, 0.15); }
  function playComboSound() { playTone(440, 'sine', 0.2, 0.3); }
  function playChiSound()   { playTone(660, 'sine', 0.3, 0.25); }
  function playHitSound()   { playTone(100, 'sawtooth', 0.1, 0.3); }
  function playWinSound() {
    if (!audioCtx) return;
    var notes = [262, 330, 392, 523];
    for (var i = 0; i < notes.length; i++) {
      (function(n, delay) {
        setTimeout(function() { playTone(n, 'sine', 0.3, 0.2); }, delay * 150);
      })(notes[i], i);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'kungfu-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #664400',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);

    screenFlashEl = document.createElement('div');
    screenFlashEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:9998',
      'opacity:0',
      'background:rgba(255,80,0,0.35)',
      'transition:opacity 0.05s'
    ].join(';');
    document.body.appendChild(screenFlashEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var def = ROUND_DEFS[currentRound - 1];
    var honorStr = honorStrikes + '/' + maxHonorStrikes + ' STRIKES';
    hudEl.textContent =
      'KUNG FU DOJO ' +
      '[ROUND: ' + currentRound + '/' + totalRounds + '] ' +
      '[HP: ' + Math.max(0, Math.round(playerHP)) + '/' + playerMaxHP + '] ' +
      '[ENEMY HP: ' + Math.max(0, Math.round(enemyHP)) + '] ' +
      '[CHI: ' + Math.round(chi) + '%] ' +
      '[COMBO: ' + comboHits + ' HIT] ' +
      '| HONOR: ' + honorStr +
      (ironBodyActive ? ' [IRON BODY]' : '') +
      (ironPalmActive ? ' [IRON PALM]' : '') +
      (flyingKickActive ? ' [FLYING KICK]' : '');
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (screenFlashEl && screenFlashEl.parentNode) { screenFlashEl.parentNode.removeChild(screenFlashEl); screenFlashEl = null; }
  }

  function flashScreen() {
    if (!screenFlashEl) return;
    screenFlashEl.style.opacity = '1';
    setTimeout(function() { if (screenFlashEl) screenFlashEl.style.opacity = '0'; }, 80);
  }

  function showMessage(msg, color) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + (color || '#FFCC44'),
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:10001',
      'text-shadow:0 0 8px rgba(0,0,0,0.9)',
      'text-align:center'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }

  // ─── Scene setup ──────────────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.Fog(0x111122, 20, 50);

    // Ambient + directional
    var ambLight = new THREE.AmbientLight(0x221111, 0.6);
    scene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0xFFBB88, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    buildFloor();
    buildWalls();
    buildLanterns();
    buildWeaponRacks();
    buildSensei();
    buildSpectators();
  }

  function buildFloor() {
    var geo = new THREE.PlaneGeometry(30, 30, 10, 10);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCC8833 });
    var floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    // Wood plank lines via LineSegments
    var lineGeo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = -14; i <= 14; i += 2) {
      verts.push(-15, 0.01, i,  15, 0.01, i);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0xAA6622, opacity: 0.4, transparent: true });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  function buildWalls() {
    var wallDefs = [
      { x: 0,   y: 3, z: -15, rx: 0,           w: 30, h: 6, d: 0.4 },
      { x: 0,   y: 3, z:  15, rx: 0,           w: 30, h: 6, d: 0.4 },
      { x: -15, y: 3, z:  0,  rx: 0,           w: 0.4, h: 6, d: 30 },
      { x:  15, y: 3, z:  0,  rx: 0,           w: 0.4, h: 6, d: 30 }
    ];
    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var geo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var mat = new THREE.MeshLambertMaterial({ color: 0x887766, transparent: true, opacity: 0.85 });
      var wall = new THREE.Mesh(geo, mat);
      wall.position.set(wd.x, wd.y, wd.z);
      scene.add(wall);
      walls.push(wall);

      // LineSegments lattice grid on each wall
      var gridGeo = new THREE.BufferGeometry();
      var gv = [];
      var ww = wd.w > 1 ? wd.w : wd.d;
      var wh = wd.h;
      var cols = Math.max(2, Math.floor(ww / 1.5));
      var rows = Math.max(2, Math.floor(wh / 1.5));
      for (var c = 0; c <= cols; c++) {
        var cx = -ww / 2 + (ww / cols) * c;
        gv.push(cx, -wh / 2, 0,  cx, wh / 2, 0);
      }
      for (var r = 0; r <= rows; r++) {
        var ry = -wh / 2 + (wh / rows) * r;
        gv.push(-ww / 2, ry, 0,  ww / 2, ry, 0);
      }
      gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3));
      var gridMat = new THREE.LineBasicMaterial({ color: 0x554433, opacity: 0.6, transparent: true });
      var grid = new THREE.LineSegments(gridGeo, gridMat);
      grid.position.set(wd.x, wd.y, wd.z + (wd.d < 1 ? 0.21 : 0));
      if (wd.w < 1) {
        grid.rotation.y = Math.PI / 2;
        grid.position.set(wd.x + 0.21, wd.y, wd.z);
      }
      scene.add(grid);
    }
  }

  function buildLanterns() {
    var positions = [
      { x: -10, y: 5, z: -10 },
      { x:  10, y: 5, z: -10 },
      { x: -10, y: 5, z:  10 },
      { x:  10, y: 5, z:  10 },
      { x:  0,  y: 6, z:  0  }
    ];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      // Lantern body
      var bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.8, 8);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFCC44, emissive: 0xFF8800, emissiveIntensity: 0.6 });
      var lantern = new THREE.Mesh(bodyGeo, bodyMat);
      lantern.position.set(p.x, p.y, p.z);
      scene.add(lantern);
      lanterns.push(lantern);

      // Cap top/bottom
      var capGeo = new THREE.CylinderGeometry(0.12, 0.28, 0.12, 8);
      var capMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
      var capT = new THREE.Mesh(capGeo, capMat);
      capT.position.set(p.x, p.y + 0.46, p.z);
      scene.add(capT);
      var capB = new THREE.Mesh(capGeo, capMat);
      capB.position.set(p.x, p.y - 0.46, p.z);
      scene.add(capB);

      // Hanging wire
      var wireGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);
      var wireMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(p.x, p.y + 0.9, p.z);
      scene.add(wire);

      // Point light
      var pt = new THREE.PointLight(0xFFAA44, 1.0, 10);
      pt.position.set(p.x, p.y - 0.2, p.z);
      scene.add(pt);
      lanternLights.push(pt);
    }
  }

  function buildWeaponRacks() {
    var rackPositions = [
      { x: -13, z: -8 },
      { x: -13, z:  0 },
      { x:  13, z: -8 },
      { x:  13, z:  0 }
    ];
    for (var i = 0; i < rackPositions.length; i++) {
      var rp = rackPositions[i];
      // Rack frame
      var rackGeo = new THREE.BoxGeometry(0.4, 2.0, 2.0);
      var rackMat = new THREE.MeshLambertMaterial({ color: 0x665533 });
      var rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(rp.x, 1.0, rp.z);
      scene.add(rack);
      weaponRacks.push(rack);

      // Horizontal bar
      var barGeo = new THREE.BoxGeometry(0.08, 0.08, 1.8);
      var bar = new THREE.Mesh(barGeo, rackMat);
      bar.position.set(rp.x + 0.2, 1.4, rp.z);
      scene.add(bar);

      // Decorative weapons (staffs/swords) as cylinders
      for (var w = 0; w < 3; w++) {
        var wpnGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.6, 6);
        var wpnMat = new THREE.MeshLambertMaterial({ color: w === 0 ? 0x888888 : 0x664422 });
        var wpn = new THREE.Mesh(wpnGeo, wpnMat);
        wpn.rotation.z = Math.PI / 2;
        wpn.position.set(rp.x + 0.25, 1.5, rp.z - 0.6 + w * 0.6);
        scene.add(wpn);
      }
    }
  }

  function buildSensei() {
    // Platform
    var platGeo = new THREE.BoxGeometry(3, 0.3, 2);
    var platMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    platformMesh = new THREE.Mesh(platGeo, platMat);
    platformMesh.position.set(0, 0.15, -13);
    scene.add(platformMesh);

    // Sensei body
    var bodyGeo = new THREE.BoxGeometry(0.7, 0.9, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x332222 });
    senseiMesh = new THREE.Mesh(bodyGeo, bodyMat);
    senseiMesh.position.set(0, 0.9, -13);
    scene.add(senseiMesh);

    // Head
    var headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 1.55, -13);
    scene.add(headMesh);

    // Seated legs
    var legGeo = new THREE.BoxGeometry(0.6, 0.2, 0.7);
    var legMesh = new THREE.Mesh(legGeo, bodyMat);
    legMesh.position.set(0, 0.4, -12.7);
    scene.add(legMesh);
  }

  function buildSpectators() {
    var spPositions = [
      { x: -12, z:  6 }, { x: -10, z:  8 }, { x: -8,  z: 10 }, { x: -6,  z: 12 },
      { x:  12, z:  6 }, { x:  10, z:  8 }, { x:  8,  z: 10 }, { x:  6,  z: 12 }
    ];
    for (var i = 0; i < spPositions.length; i++) {
      var sp = spPositions[i];
      var bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.4);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(sp.x, 0.4, sp.z);
      scene.add(body);

      var headGeo = new THREE.SphereGeometry(0.22, 6, 6);
      var headMesh = new THREE.Mesh(headGeo, bodyMat);
      headMesh.position.set(sp.x, 0.95, sp.z);
      scene.add(headMesh);

      spectators.push({ body: body, head: headMesh, baseY: 0.4, phase: Math.random() * Math.PI * 2 });
    }
  }

  // ─── Player mesh ──────────────────────────────────────────────────────────
  function createPlayerMesh() {
    if (playerMesh) { scene.remove(playerMesh); }
    var group = new THREE.Object3D();

    var bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xEEDDBB });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    var head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.05;
    group.add(head);

    // Belt
    var beltGeo = new THREE.BoxGeometry(0.62, 0.12, 0.42);
    var beltMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.35;
    group.add(belt);

    group.position.set(playerPos.x, playerPos.y, playerPos.z);
    scene.add(group);
    playerMesh = group;
  }

  // ─── Enemy mesh ───────────────────────────────────────────────────────────
  function createEnemyMesh() {
    if (enemyMesh) { scene.remove(enemyMesh); }
    var def = ROUND_DEFS[currentRound - 1];
    var group = new THREE.Object3D();

    var bodyGeo = new THREE.BoxGeometry(0.65, 0.9, 0.45);
    var bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.26, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xDDCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.06;
    group.add(head);

    // Belt color by tier
    var beltColor = currentRound <= 2 ? 0x886600 : currentRound <= 4 ? 0x006622 : currentRound <= 6 ? 0x111111 : 0x880000;
    var beltGeo = new THREE.BoxGeometry(0.67, 0.12, 0.47);
    var beltMat = new THREE.MeshLambertMaterial({ color: beltColor });
    var belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 0.35;
    group.add(belt);

    group.position.set(enemyPos.x, enemyPos.y, enemyPos.z);
    scene.add(group);
    enemyMesh = group;
  }

  // ─── Round init ───────────────────────────────────────────────────────────
  function startRound() {
    var def = ROUND_DEFS[currentRound - 1];
    enemyHP = def.hp;
    enemyMaxHP = def.hp;
    enemyPos.x = 0;
    enemyPos.y = 0;
    enemyPos.z = -6;
    enemyStunTimer = 0;
    enemyAirStunTimer = 0;
    enemyKnockback.x = 0;
    enemyKnockback.z = 0;
    enemyKnockbackTimer = 0;
    enemyAttackTimer = 1.5 + Math.random();
    enemyBlockTimer = 0;
    enemyBlockActive = false;
    enemyDown = false;
    enemyDownTimer = 0;
    grandmasterMirrorMoves = [];
    grandmasterMirrorTimer = 0;
    playerPos.x = 0;
    playerPos.z = 8;
    createPlayerMesh();
    createEnemyMesh();
    comboBuffer = [];
    comboHits = 0;
    showMessage('ROUND ' + currentRound + ' - ' + def.name + '!', '#FFCC44');
  }

  // ─── Input registration ───────────────────────────────────────────────────
  var mouseDownTime = 0;
  var mouseHeld = false;

  function onKeyDown(e) {
    if (!active) {
      // Activation check
      var k = e.key ? e.key.toLowerCase() : '';
      if (k === 'k') kDownAt = Date.now();
      if (k === 'f') fDownAt = Date.now();
      if (Math.abs(kDownAt - fDownAt) <= ACTIVATION_WINDOW && kDownAt > 0 && fDownAt > 0) {
        kDownAt = 0; fDownAt = 0;
        startGame();
      }
      return;
    }

    var key = e.key ? e.key.toLowerCase() : '';
    keysDown[key] = true;

    if (gameOver || gameWon || roundTransitionActive) return;

    // Dodge double-tap
    if (key === 'a') {
      var now = Date.now();
      if (now - lastTapA < TAP_INTERVAL) { triggerDodge(-1); }
      lastTapA = now;
    }
    if (key === 'd') {
      var nowD = Date.now();
      if (nowD - lastTapD < TAP_INTERVAL) { triggerDodge(1); }
      lastTapD = nowD;
    }

    // Chi specials
    if (key === 'c') { tryIronPalm(); }
    if (key === 'x') { tryFlyingKick(); }
    if (key === 'z') { tryIronBody(); }

    // Kick
    if (key === 'q') {
      recordComboAction('kick');
      tryKick();
    }
    // Block
    if (key === 'e') {
      blockActive = true;
      blockHeldTime = 0;
      blockFatigued = false;
      addComboAction('block');
    }
  }

  function onKeyUp(e) {
    if (!active) return;
    var key = e.key ? e.key.toLowerCase() : '';
    keysDown[key] = false;
    if (key === 'e') {
      blockActive = false;
      blockHeldTime = 0;
      blockFatigued = false;
    }
    if (key === 'q') {
      // Throw check: was holding Q near blocked/stunned enemy
      if (throwCharging && throwChargeTimer >= 0.8) {
        triggerThrow();
      }
      throwCharging = false;
      throwChargeTimer = 0;
    }
  }

  function onMouseDown(e) {
    if (!active || e.button !== 0) return;
    mouseHeld = true;
    mouseDownTime = Date.now();
    punchHeld = true;
    punchHeldTimer = 0;
  }

  function onMouseUp(e) {
    if (!active || e.button !== 0) return;
    if (gameOver || gameWon || roundTransitionActive) { mouseHeld = false; punchHeld = false; return; }
    if (punchHeldTimer >= 0.8) {
      // Uppercut
      triggerUppercut();
    } else {
      recordComboAction('punch');
      tryPunch();
    }
    mouseHeld = false;
    punchHeld = false;
    punchHeldTimer = 0;
  }

  function addComboAction(action) {
    var now = performance.now() / 1000;
    comboBuffer.push({ action: action, time: now });
    // Prune old entries outside combo window
    var cutoff = now - COMBO_WINDOW;
    var newBuf = [];
    for (var i = 0; i < comboBuffer.length; i++) {
      if (comboBuffer[i].time >= cutoff) newBuf.push(comboBuffer[i]);
    }
    comboBuffer = newBuf;
    checkCombos();
  }

  function recordComboAction(action) {
    addComboAction(action);
    // Track for grandmaster mirror (last 3 moves)
    lastMoves.push(action);
    if (lastMoves.length > 3) lastMoves.shift();
  }

  function checkCombos() {
    if (comboBuffer.length < 3) return;
    var actions = [];
    for (var i = 0; i < comboBuffer.length; i++) {
      actions.push(comboBuffer[i].action);
    }
    var seq = actions.join(',');

    // Triple punch: Dragon Strike
    if (seq.indexOf('punch,punch,punch') >= 0) {
      comboBuffer = [];
      triggerDragonStrike();
      return;
    }
    // Kick-punch-kick: Spinning Wheel
    if (seq.indexOf('kick,punch,kick') >= 0) {
      comboBuffer = [];
      triggerSpinningWheel();
      return;
    }
    // Punch-dodge-punch: Shadow Strike
    if (seq.indexOf('punch,dodge,punch') >= 0) {
      comboBuffer = [];
      triggerShadowStrike();
      return;
    }
  }

  // ─── Combat actions ───────────────────────────────────────────────────────
  function tryPunch() {
    if (punchCooldown > 0) return;
    punchCooldown = 0.2;
    var dmg = ironPalmActive ? 120 : 20;
    if (ironPalmActive) {
      ironPalmActive = false;
      ironPalmTimer = 0;
      showMessage('IRON PALM!', '#FF8800');
      playChiSound();
    }
    dealDamageToEnemy(dmg, false, 'punch');
    playPunchSound();
    animatePlayerAttack();
  }

  function tryKick() {
    if (kickCooldown > 0) return;
    kickCooldown = 0.5;
    dealDamageToEnemy(35, true, 'kick');
    playKickSound();
    animatePlayerAttack();
    // Throw charge starts here if Q is held
    var d = dist2d(playerPos, enemyPos);
    if (d < 3.0 && (enemyBlockActive || enemyStunTimer > 0)) {
      throwCharging = true;
      throwChargeTimer = 0;
    }
  }

  function triggerDodge(dir) {
    if (dodgeActive) return;
    dodgeActive = true;
    dodgeTimer = 0.3;
    dodgeDirX = dir * 1.5;
    invincTimer = 0.3;
    addComboAction('dodge');
    playTone(200, 'sine', 0.1, 0.1);
  }

  function triggerThrow() {
    var d = dist2d(playerPos, enemyPos);
    if (d > 3.5) return;
    if (!enemyBlockActive && enemyStunTimer <= 0) return;
    dealDamageToEnemy(30, false, 'throw');
    enemyKnockback.x = (enemyPos.x - playerPos.x) * 0.5;
    enemyKnockback.z = (enemyPos.z - playerPos.z) * 0.5;
    enemyKnockbackTimer = 0.5;
    enemyStunTimer = 0.5;
    showMessage('THROW!', '#FFAA44');
    playKickSound();
  }

  function triggerUppercut() {
    dealDamageToEnemy(50, false, 'uppercut');
    enemyAirStunTimer = 2.0;
    enemyStunTimer = 2.0;
    showMessage('UPPERCUT!', '#FFCC44');
    playTone(250, 'sawtooth', 0.15, 0.3);
  }

  function triggerDragonStrike() {
    dealDamageToEnemy(75, false, 'dragonStrike');
    chi = Math.min(100, chi + 10);
    comboHits += 3;
    comboTimer = COMBO_DECAY;
    showMessage('DRAGON STRIKE! 75 DMG', '#FF6600');
    playComboSound();
  }

  function triggerSpinningWheel() {
    dealDamageToEnemy(90, false, 'spinningWheel');
    enemyStunTimer = 1.5;
    chi = Math.min(100, chi + 10);
    comboHits += 3;
    comboTimer = COMBO_DECAY;
    showMessage('SPINNING WHEEL! 90 DMG + STUN', '#FF4400');
    playComboSound();
  }

  function triggerShadowStrike() {
    var dmg = 80;
    var counterBreak = Math.random() < 0.3;
    dealDamageToEnemy(dmg, false, 'shadowStrike');
    if (counterBreak) {
      enemyBlockActive = false;
      enemyBlockTimer = 0;
      showMessage('SHADOW STRIKE! COUNTER BREAK!', '#FF2200');
    } else {
      showMessage('SHADOW STRIKE! 80 DMG', '#FF4400');
    }
    chi = Math.min(100, chi + 10);
    comboHits += 3;
    comboTimer = COMBO_DECAY;
    playComboSound();
  }

  // ─── Chi specials ─────────────────────────────────────────────────────────
  function tryIronPalm() {
    if (chi < 30) { showMessage('NOT ENOUGH CHI (need 30)', '#FF4444'); return; }
    chi -= 30;
    ironPalmActive = true;
    ironPalmTimer = 5.0;
    showMessage('IRON PALM READY (next punch = 120 dmg)', '#FF8800');
    playChiSound();
  }

  function tryFlyingKick() {
    if (chi < 50) { showMessage('NOT ENOUGH CHI (need 50)', '#FF4444'); return; }
    chi -= 50;
    flyingKickActive = true;
    flyingKickTimer = 0;
    flyingKickPos.x = playerPos.x;
    flyingKickPos.y = playerPos.y;
    flyingKickPos.z = playerPos.z;
    var dx = enemyPos.x - playerPos.x;
    var dz = enemyPos.z - playerPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    flyingKickDir.x = dx / len;
    flyingKickDir.z = dz / len;
    showMessage('FLYING KICK!', '#FFFF00');
    playChiSound();
  }

  function tryIronBody() {
    if (chi < 70) { showMessage('NOT ENOUGH CHI (need 70)', '#FF4444'); return; }
    chi -= 70;
    ironBodyActive = true;
    ironBodyTimer = 5.0;
    showMessage('IRON BODY - 5s INVULNERABLE!', '#44FFFF');
    playChiSound();
  }

  // ─── Damage dealing ───────────────────────────────────────────────────────
  function dealDamageToEnemy(dmg, hasKnockback, moveType) {
    if (enemyHP <= 0) return;
    var d = dist2d(playerPos, enemyPos);
    if (d > 4.0) return; // out of range

    // Enemy block reduces damage
    var finalDmg = dmg;
    if (enemyBlockActive && enemyStunTimer <= 0) {
      finalDmg = dmg * 0.2;
    }

    enemyHP -= finalDmg;
    comboHits++;
    comboTimer = COMBO_DECAY;
    score += Math.round(finalDmg);

    if (hasKnockback) {
      enemyKnockback.x = (enemyPos.x - playerPos.x) * 0.4;
      enemyKnockback.z = (enemyPos.z - playerPos.z) * 0.4;
      enemyKnockbackTimer = 0.25;
    }

    flashScreen();
    playHitSound();

    if (enemyHP <= 0) {
      onEnemyDefeated();
    }
  }

  function dealDamageToPlayer(dmg) {
    if (invincTimer > 0) return;
    if (ironBodyActive) {
      // Reflect 30%
      var reflected = dmg * 0.3;
      enemyHP -= reflected;
      showMessage('REFLECTED ' + Math.round(reflected) + ' DMG!', '#44FFFF');
      if (enemyHP <= 0) { onEnemyDefeated(); }
      return;
    }

    var finalDmg = dmg;
    if (blockActive) {
      if (blockFatigued) {
        finalDmg = dmg * 0.2; // 80% reduction but fatigued means only 20% block
        // Actually spec: 80% absorb normally, reduced to 20% block (absorbs 20%) if fatigued
        finalDmg = dmg * 0.8;
      } else {
        finalDmg = dmg * 0.2; // 80% absorbed
        chi = Math.min(100, chi + 5); // chi gain on successful block
      }
      playBlockSound();
    }

    playerHP -= finalDmg;
    if (playerHP <= 0) {
      playerHP = 0;
      onPlayerDefeated();
    }
  }

  // ─── Enemy defeated / round transition ───────────────────────────────────
  function onEnemyDefeated() {
    enemyHP = 0;
    if (enemyMesh) {
      // Lay down
      enemyMesh.rotation.x = Math.PI / 2;
      enemyMesh.position.y = 0;
    }
    var def = ROUND_DEFS[currentRound - 1];
    showMessage(def.name + ' DEFEATED!', '#44FF44');
    playWinSound();

    if (currentRound === 7) {
      // Win!
      gameWon = true;
      var honorBonus = 0;
      var honorMsg = '';
      if (honorStrikes === 0) {
        honorBonus = 500;
        score += honorBonus;
        honorMsg = '\nHONORABLE VICTORY +500 PTS - SENSEI BOWS';
        animateSenseiBow();
      }
      showMessage('TOURNAMENT COMPLETE!\nSCORE: ' + score + honorMsg, '#FFCC44');
      return;
    }

    roundTransitionActive = true;
    roundTransitionTimer = 2.5;
  }

  function onPlayerDefeated() {
    gameOver = true;
    showMessage('DEFEATED!\nSCORE: ' + score, '#FF4444');
  }

  function animateSenseiBow() {
    if (!senseiMesh) return;
    var t = 0;
    var interval = setInterval(function() {
      t += 0.05;
      if (!senseiMesh) { clearInterval(interval); return; }
      senseiMesh.rotation.x = Math.sin(t) * 0.4;
      if (t > 2) clearInterval(interval);
    }, 50);
  }

  // ─── Dirty move detection ─────────────────────────────────────────────────
  function checkDirtyMove(moveType) {
    // Kicking a downed/0hp enemy = dirty
    if ((enemyDown || enemyHP <= 0) && (moveType === 'kick' || moveType === 'punch')) {
      honorStrikes++;
      showMessage('DISHONOR! (' + honorStrikes + '/' + maxHonorStrikes + ')', '#FF2200');
      if (honorStrikes >= maxHonorStrikes) {
        gameOver = true;
        showMessage('DISQUALIFIED!\nToo many dishonor strikes.', '#FF0000');
      }
    }
  }

  // ─── Player attack animation ──────────────────────────────────────────────
  function animatePlayerAttack() {
    if (!playerMesh) return;
    playerMesh.position.z -= 0.15;
    setTimeout(function() {
      if (playerMesh) playerMesh.position.z += 0.15;
    }, 80);
  }

  // ─── AI behavior ──────────────────────────────────────────────────────────
  function updateEnemyAI(dt) {
    if (enemyHP <= 0 || gameOver || gameWon) return;
    if (enemyStunTimer > 0 || enemyAirStunTimer > 0) return;

    var def = ROUND_DEFS[currentRound - 1];
    var d = dist2d(playerPos, enemyPos);

    // Move toward player
    if (d > 2.5) {
      var dx = playerPos.x - enemyPos.x;
      var dz = playerPos.z - enemyPos.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var speed = def.ai === 'grandmaster' ? 2.8 : def.ai === 'blackbelt' ? 2.2 : 1.5;
      enemyPos.x += (dx / len) * speed * dt;
      enemyPos.z += (dz / len) * speed * dt;
    }

    // Attack
    enemyAttackTimer -= dt;
    if (enemyAttackTimer <= 0 && d < 3.5) {
      var attackRate = def.ai === 'basic' ? 1.8 : def.ai === 'advanced' ? 1.2 : def.ai === 'blackbelt' ? 0.9 : 0.7;
      enemyAttackTimer = attackRate + Math.random() * 0.5;

      // Advanced+ can block/throw
      if (def.ai === 'advanced' || def.ai === 'blackbelt' || def.ai === 'grandmaster') {
        if (Math.random() < 0.25 && !enemyBlockActive) {
          enemyBlockActive = true;
          enemyBlockTimer = 1.0 + Math.random();
          return;
        }
      }

      // Grandmaster mirrors player moves
      if (def.ai === 'grandmaster' && lastMoves.length >= 1 && Math.random() < 0.4) {
        var mirror = lastMoves[Math.floor(Math.random() * lastMoves.length)];
        if (mirror === 'punch') { dealDamageToPlayer(20); playPunchSound(); }
        else if (mirror === 'kick') { dealDamageToPlayer(35); playKickSound(); }
        else if (mirror === 'dragonStrike') { dealDamageToPlayer(75 * 0.6); playComboSound(); }
        else if (mirror === 'spinningWheel') { dealDamageToPlayer(90 * 0.5); enemyStunTimer = 0; }
      } else {
        // Normal attack
        var dmg = def.ai === 'basic' ? 12 : def.ai === 'advanced' ? 18 : def.ai === 'blackbelt' ? 25 : 35;
        dealDamageToPlayer(dmg);
        playHitSound();
      }
    }

    // Block timer
    if (enemyBlockActive) {
      enemyBlockTimer -= dt;
      if (enemyBlockTimer <= 0) {
        enemyBlockActive = false;
      }
    }

    // Grandmaster chi special
    if (def.ai === 'grandmaster' && Math.random() < 0.002) {
      // Mirror iron body
      enemyStunTimer = 0;
      showMessage('GRANDMASTER: IRON BODY STANCE!', '#FF8888');
      var gmTimer = 3.0;
      var gmInterval = setInterval(function() {
        gmTimer -= 0.1;
        if (gmTimer <= 0) clearInterval(gmInterval);
      }, 100);
    }
  }

  // ─── Update flying kick ───────────────────────────────────────────────────
  function updateFlyingKick(dt) {
    if (!flyingKickActive) return;
    flyingKickTimer += dt;
    var speed = 12.0;
    playerPos.x += flyingKickDir.x * speed * dt;
    playerPos.z += flyingKickDir.z * speed * dt;

    var d = dist2d(playerPos, enemyPos);
    if (d < 2.0 || flyingKickTimer > 0.6) {
      flyingKickActive = false;
      if (d < 2.5) {
        dealDamageToEnemy(100, true, 'flyingKick');
        enemyStunTimer = 2.0;
        showMessage('FLYING KICK! 100 DMG + STUN!', '#FFFF00');
      }
    }
  }

  // ─── Main update ──────────────────────────────────────────────────────────
  function update() {
    if (!active) return;
    var now = performance.now();
    var dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;

    if (gameOver || gameWon) {
      updateHUD();
      return;
    }

    // Round transition
    if (roundTransitionActive) {
      roundTransitionTimer -= dt;
      if (roundTransitionTimer <= 0) {
        roundTransitionActive = false;
        currentRound++;
        startRound();
      }
      updateHUD();
      return;
    }

    // Timers
    if (punchCooldown > 0) punchCooldown -= dt;
    if (kickCooldown > 0) kickCooldown -= dt;
    if (invincTimer > 0) invincTimer -= dt;
    if (enemyStunTimer > 0) enemyStunTimer -= dt;
    if (enemyAirStunTimer > 0) enemyAirStunTimer -= dt;

    // Block fatigue
    if (blockActive) {
      blockHeldTime += dt;
      if (blockHeldTime >= 2.0) blockFatigued = true;
    }

    // Iron palm timer
    if (ironPalmActive) {
      ironPalmTimer -= dt;
      if (ironPalmTimer <= 0) { ironPalmActive = false; }
    }

    // Iron body timer
    if (ironBodyActive) {
      ironBodyTimer -= dt;
      if (ironBodyTimer <= 0) {
        ironBodyActive = false;
        showMessage('IRON BODY ENDED', '#44FFFF');
      }
    }

    // Throw charge
    if (throwCharging) {
      throwChargeTimer += dt;
    }

    // Punch hold (uppercut charge)
    if (punchHeld) {
      punchHeldTimer += dt;
    }

    // Combo decay
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) {
        comboHits = 0;
        comboTimer = 0;
      }
    }

    // Player movement
    if (!flyingKickActive) {
      var spd = 5.0;
      var mx = 0, mz = 0;
      if (keysDown['a'] || keysDown['arrowleft'])  mx -= 1;
      if (keysDown['d'] || keysDown['arrowright']) mx += 1;
      if (keysDown['w'] || keysDown['arrowup'])    mz -= 1;
      if (keysDown['s'] || keysDown['arrowdown'])  mz += 1;

      var mlen = Math.sqrt(mx * mx + mz * mz);
      if (mlen > 0) { mx /= mlen; mz /= mlen; }
      moveDir.x = mx; moveDir.z = mz;

      playerPos.x += mx * spd * dt;
      playerPos.z += mz * spd * dt;
    }

    // Dodge movement
    if (dodgeActive) {
      dodgeTimer -= dt;
      playerPos.x += dodgeDirX * 5 * dt;
      if (dodgeTimer <= 0) {
        dodgeActive = false;
        dodgeDirX = 0;
      }
    }

    // Clamp player to arena
    playerPos.x = clamp(playerPos.x, -13, 13);
    playerPos.z = clamp(playerPos.z, -12, 13);

    // Enemy knockback
    if (enemyKnockbackTimer > 0) {
      enemyKnockbackTimer -= dt;
      enemyPos.x += enemyKnockback.x * 6 * dt;
      enemyPos.z += enemyKnockback.z * 6 * dt;
      enemyPos.x = clamp(enemyPos.x, -13, 13);
      enemyPos.z = clamp(enemyPos.z, -13, 12);
    }

    // Enemy down state
    if (enemyDown) {
      enemyDownTimer -= dt;
      if (enemyDownTimer <= 0) { enemyDown = false; }
    }

    // Flying kick
    updateFlyingKick(dt);

    // Enemy AI
    updateEnemyAI(dt);

    // Update meshes
    if (playerMesh) {
      playerMesh.position.x = playerPos.x;
      playerMesh.position.z = playerPos.z;
      // Face enemy
      var faceAngle = Math.atan2(enemyPos.x - playerPos.x, enemyPos.z - playerPos.z);
      playerMesh.rotation.y = faceAngle;
      // Block tilt
      if (blockActive) { playerMesh.rotation.x = 0.3; }
      else { playerMesh.rotation.x = 0; }
    }

    if (enemyMesh && enemyHP > 0) {
      enemyMesh.position.x = enemyPos.x;
      enemyMesh.position.z = enemyPos.z;
      // Face player
      var eAngle = Math.atan2(playerPos.x - enemyPos.x, playerPos.z - enemyPos.z);
      enemyMesh.rotation.y = eAngle;
      // Block pose
      if (enemyBlockActive) { enemyMesh.rotation.x = 0.2; }
      else if (enemyStunTimer > 0) { enemyMesh.rotation.z = 0.3; }
      else { enemyMesh.rotation.x = 0; enemyMesh.rotation.z = 0; }
    }

    // Animate lanterns
    var t = now / 1000;
    for (var i = 0; i < lanternLights.length; i++) {
      lanternLights[i].intensity = 0.8 + Math.sin(t * 2.1 + i) * 0.2;
    }
    for (var j = 0; j < lanterns.length; j++) {
      lanterns[j].position.y += Math.sin(t * 1.5 + j) * 0.0005;
    }

    // Animate spectators (bob slightly)
    for (var s = 0; s < spectators.length; s++) {
      var sp = spectators[s];
      sp.body.position.y = sp.baseY + Math.sin(t * 1.8 + sp.phase) * 0.05;
    }

    // Camera follows player loosely (FPS-ish, slightly elevated)
    camera.position.x = playerPos.x * 0.5;
    camera.position.y = 4.5 + Math.sin(t * 0.3) * 0.02;
    camera.position.z = playerPos.z + 6;
    camera.lookAt(
      playerPos.x * 0.3 + enemyPos.x * 0.7,
      1.2,
      playerPos.z * 0.3 + enemyPos.z * 0.7
    );

    updateHUD();
    if (renderer) renderer.render(scene, camera);
    animFrameId = requestAnimationFrame(update);
  }

  // ─── Start / stop ─────────────────────────────────────────────────────────
  function startGame() {
    if (active) return;
    active = true;

    initAudio();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.id = 'kungfu-canvas';
    renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:9990;';
    document.body.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);

    buildScene();
    createHUD();
    resetState();
    startRound();

    clock.last = performance.now();
    animFrameId = requestAnimationFrame(update);

    // Controls hint
    showMessage('K+F activated! WASD=move Q=kick E=block LMB=punch\nC=IronPalm X=FlyingKick Z=IronBody', '#AAFFAA');
  }

  function resetState() {
    playerHP = playerMaxHP;
    currentRound = 1;
    score = 0;
    gameOver = false;
    gameWon = false;
    honorStrikes = 0;
    chi = 0;
    comboHits = 0;
    comboTimer = 0;
    comboBuffer = [];
    lastMoves = [];
    ironPalmActive = false;
    flyingKickActive = false;
    ironBodyActive = false;
    invincTimer = 0;
    punchCooldown = 0;
    kickCooldown = 0;
    blockActive = false;
    blockHeldTime = 0;
    blockFatigued = false;
    dodgeActive = false;
    throwCharging = false;
    throwChargeTimer = 0;
    roundTransitionActive = false;
    roundTransitionTimer = 0;
    playerPos.x = 0;
    playerPos.y = 0;
    playerPos.z = 8;
  }

  function stopGame() {
    if (!active) return;
    active = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    removeHUD();
    var canvas = document.getElementById('kungfu-canvas');
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (scene) {
      while (scene.children.length > 0) scene.remove(scene.children[0]);
    }
    // Clear arrays
    lanterns = []; lanternLights = []; spectators = []; weaponRacks = []; walls = [];
    senseiMesh = null; platformMesh = null; playerMesh = null; enemyMesh = null;
    keysDown = {};
    kDownAt = 0; fDownAt = 0;
  }

  // ─── Resize ───────────────────────────────────────────────────────────────
  function onResize() {
    if (!active || !renderer || !camera) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  // ─── Event listeners ──────────────────────────────────────────────────────
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup',   onMouseUp);
  window.addEventListener('resize',    onResize);

  // ─── Context menu block when active ──────────────────────────────────────
  window.addEventListener('contextmenu', function(e) {
    if (active) e.preventDefault();
  });

  // ─── Public API ───────────────────────────────────────────────────────────
  function init()  {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */
 /* activation via K+F keypress */ }
  function reset() { stopGame(); resetState(); }

  return { init: init, update: update, reset: reset };
}());
