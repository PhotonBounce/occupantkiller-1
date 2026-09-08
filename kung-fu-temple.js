window.KungFuTemple = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── Activation key tracking ──────────────────────────────────────────────
  var keysDown = {};
  var kDownAt = 0;
  var tDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;
  var scene, camera, renderer, animFrameId;

  // ─── Game constants ───────────────────────────────────────────────────────
  var TOTAL_WAVES = 10;
  var TOTAL_SCROLLS = 5;
  var GAME_DURATION = 480; // 8 minutes in seconds
  var BELL_COOLDOWN = 90;
  var BELL_STUN_TIME = 5;
  var BELL_RANGE = 20;
  var WIN_SCROLLS_NEEDED = 3;
  var SCROLL_STEAL_TIME = 15; // seconds for gangster to carry scroll to entrance

  // ─── Game state ───────────────────────────────────────────────────────────
  var playerHP = 150;
  var playerMaxHP = 150;
  var currentWave = 0;
  var waveActive = false;
  var waveTransitionTimer = 0;
  var gameOver = false;
  var gameWon = false;
  var clock = { last: 0 };
  var audioCtx = null;
  var hudEl = null;
  var screenFlashEl = null;
  var timeRemaining = GAME_DURATION;
  var bellCooldown = 0;
  var bossStatus = 'N/A'; // 'N/A', 'APPROACHING', 'DEFEATED'

  // ─── Player state ─────────────────────────────────────────────────────────
  var playerMesh = null;
  var playerPos = { x: 0, y: 0, z: 10 };
  var playerYaw = 0;  // camera yaw (radians)
  var playerPitch = 0;

  // ─── Combat state ─────────────────────────────────────────────────────────
  var punchCooldown = 0;
  var kickCooldown = 0;
  var staffCooldown = 0;
  var throwCooldown = 0;
  var chiBlastCooldown = 0;
  var blockActive = false;
  var chiMeter = 0; // 0-100
  var throwingStars = 10;
  var hasStaff = false;
  var punchCombo = 0;
  var punchComboTimer = 0;
  var invincTimer = 0;
  var attackAnimTimer = 0;

  // ─── Scroll state ─────────────────────────────────────────────────────────
  var scrolls = []; // { mesh, light, pos, stolen, carriedBy, stealTimer }
  var scrollsSafe = TOTAL_SCROLLS;
  var scrollsStolen = 0;

  // ─── Enemy state ──────────────────────────────────────────────────────────
  var enemies = []; // { mesh, pos, hp, maxHp, type, state, attackTimer, stunTimer, carryingScroll, scrollIdx, stealProgress }
  var totalKilled = 0;
  var bossDefeated = false;
  var bossMesh = null;

  // ─── Monk AI helpers ──────────────────────────────────────────────────────
  var monks = []; // { mesh, pos, target, state }
  var monksAlerted = false;

  // ─── Scene objects ────────────────────────────────────────────────────────
  var templeFloor = null;
  var trainingDummies = [];
  var incenseBurners = [];
  var bellMesh = null;
  var bellRopeMesh = null;
  var bellSwingTimer = 0;
  var bellSwinging = false;
  var staffPickupMesh = null;
  var staffPickupPos = { x: 8, y: 0.5, z: 18 };
  var throwingStarPickupMesh = null;
  var throwingStarPickupPos = { x: -8, y: 0.5, z: 18 };

  // ─── Projectiles ──────────────────────────────────────────────────────────
  var projectiles = []; // { mesh, pos, dir, speed, damage, timer }

  // ─── Message queue ────────────────────────────────────────────────────────
  var messageCooldown = 0;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist3d(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(randRange(a, b + 1)); }
  function formatTime(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

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

  function playPunchSound()  { playTone(180, 'sawtooth', 0.07, 0.2); }
  function playKickSound()   { playTone(120, 'sawtooth', 0.12, 0.25); }
  function playStaffSound()  { playTone(90,  'square',   0.15, 0.3); }
  function playStarSound()   { playTone(500, 'sine',     0.06, 0.15); }
  function playChiSound()    { playTone(660, 'sine',     0.4,  0.3); }
  function playBellSound()   {
    playTone(220, 'sine', 2.0, 0.4);
    playTone(330, 'sine', 1.5, 0.2);
  }
  function playHitSound()    { playTone(100, 'sawtooth', 0.1, 0.3); }
  function playBlockSound()  { playTone(300, 'square',   0.06, 0.15); }
  function playAlertSound()  { playTone(440, 'square',   0.2,  0.2); playTone(550, 'square', 0.2, 0.2); }
  function playWinSound()    {
    if (!audioCtx) return;
    var notes = [262, 330, 392, 523, 659];
    for (var i = 0; i < notes.length; i++) {
      (function (n, delay) {
        setTimeout(function () { playTone(n, 'sine', 0.4, 0.25); }, delay * 150);
      })(notes[i], i);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'kungfutemple-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 12px',
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
    var bossStr = bossStatus;
    var enemyCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) enemyCount++;
    }
    hudEl.textContent =
      'KUNG FU TEMPLE ' +
      '[WAVE: ' + currentWave + '/' + TOTAL_WAVES + '] ' +
      '[SCROLLS: ' + scrollsSafe + '/' + TOTAL_SCROLLS + ' SAFE] ' +
      '[TIMER: ' + formatTime(timeRemaining) + '] ' +
      '[CHI: ' + Math.round(chiMeter) + '%] ' +
      '[ENEMIES: ' + enemyCount + '] ' +
      '[BOSS: ' + bossStr + '] ' +
      '[HP: ' + Math.max(0, Math.round(playerHP)) + '] ' +
      (hasStaff ? '[STAFF] ' : '') +
      '[STARS: ' + throwingStars + ']' +
      (blockActive ? ' [BLOCKING]' : '');
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (screenFlashEl && screenFlashEl.parentNode) { screenFlashEl.parentNode.removeChild(screenFlashEl); screenFlashEl = null; }
  }

  function flashScreen(color) {
    if (!screenFlashEl) return;
    screenFlashEl.style.background = color || 'rgba(255,80,0,0.35)';
    screenFlashEl.style.opacity = '1';
    setTimeout(function () { if (screenFlashEl) screenFlashEl.style.opacity = '0'; }, 80);
  }

  function showMessage(msg, color, duration) {
    if (messageCooldown > 0) return;
    messageCooldown = 0.5;
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:55px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:' + (color || '#FFCC44'),
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'pointer-events:none',
      'z-index:10001',
      'text-shadow:0 0 8px rgba(0,0,0,0.9)',
      'text-align:center'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, duration || 1800);
  }

  // ─── Scene construction ───────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x223311);
    scene.fog = new THREE.Fog(0x223311, 30, 80);

    // Lighting
    var ambLight = new THREE.AmbientLight(0x332211, 0.7);
    scene.add(ambLight);
    var sunLight = new THREE.DirectionalLight(0xFFCC88, 0.9);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);
    var fillLight = new THREE.DirectionalLight(0x113322, 0.4);
    fillLight.position.set(-5, 8, -5);
    scene.add(fillLight);

    buildCourtyard();
    buildTempleHall();
    buildTrainingYard();
    buildBellTower();
    buildMonasteryWing();
    buildScrollCases();
    buildPickups();
    buildBoundaryWalls();
  }

  function buildCourtyard() {
    // Stone tile floor
    var floorGeo = new THREE.BoxGeometry(40, 0.3, 30);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.15, 5);
    scene.add(floor);
    templeFloor = floor;

    // Tile grid lines
    var tileGeo = new THREE.BufferGeometry();
    var tv = [];
    for (var tx = -20; tx <= 20; tx += 2) {
      tv.push(tx, 0.02, -10,  tx, 0.02, 20);
    }
    for (var tz = -10; tz <= 20; tz += 2) {
      tv.push(-20, 0.02, tz,  20, 0.02, tz);
    }
    tileGeo.setAttribute('position', new THREE.Float32BufferAttribute(tv, 3));
    var tileMat = new THREE.LineBasicMaterial({ color: 0x665544, opacity: 0.5, transparent: true });
    scene.add(new THREE.LineSegments(tileGeo, tileMat));

    // Stone fountain (CylinderGeometry)
    var fountainBaseGeo = new THREE.CylinderGeometry(2.5, 3, 0.8, 12);
    var fountainMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var fountainBase = new THREE.Mesh(fountainBaseGeo, fountainMat);
    fountainBase.position.set(0, 0.4, 8);
    scene.add(fountainBase);

    var fountainPoolGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12);
    var fountainPoolMat = new THREE.MeshLambertMaterial({ color: 0x3366AA });
    var fountainPool = new THREE.Mesh(fountainPoolGeo, fountainPoolMat);
    fountainPool.position.set(0, 0.9, 8);
    scene.add(fountainPool);

    var fountainPillarGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    var fountainPillar = new THREE.Mesh(fountainPillarGeo, fountainMat);
    fountainPillar.position.set(0, 1.55, 8);
    scene.add(fountainPillar);

    // Training dummies (BoxGeometry)
    var dummyPositions = [
      { x: -8, z: 12 }, { x: 8, z: 12 }, { x: -12, z: 6 }, { x: 12, z: 6 }
    ];
    for (var i = 0; i < dummyPositions.length; i++) {
      var dp = dummyPositions[i];
      var poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 2.2, 6);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(dp.x, 1.1, dp.z);
      scene.add(pole);

      var dBodyGeo = new THREE.BoxGeometry(0.6, 0.8, 0.4);
      var dBodyMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
      var dBody = new THREE.Mesh(dBodyGeo, dBodyMat);
      dBody.position.set(dp.x, 1.8, dp.z);
      scene.add(dBody);

      var dHeadGeo = new THREE.SphereGeometry(0.25, 6, 6);
      var dHead = new THREE.Mesh(dHeadGeo, dBodyMat);
      dHead.position.set(dp.x, 2.45, dp.z);
      scene.add(dHead);

      trainingDummies.push({ body: dBody, head: dHead, pole: pole, pos: { x: dp.x, z: dp.z } });
    }

    // Stone path lanterns
    var lanternPos = [
      { x: -5, z: 14 }, { x: 5, z: 14 },
      { x: -5, z: 0 },  { x: 5, z: 0 }
    ];
    for (var l = 0; l < lanternPos.length; l++) {
      var lp = lanternPos[l];
      var lstemGeo = new THREE.CylinderGeometry(0.05, 0.08, 2, 6);
      var lstemMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
      var lstem = new THREE.Mesh(lstemGeo, lstemMat);
      lstem.position.set(lp.x, 1, lp.z);
      scene.add(lstem);

      var lbodyGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8);
      var lbodyMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.5 });
      var lbody = new THREE.Mesh(lbodyGeo, lbodyMat);
      lbody.position.set(lp.x, 2.1, lp.z);
      scene.add(lbody);

      var llight = new THREE.PointLight(0xFF8800, 0.8, 8);
      llight.position.set(lp.x, 2.1, lp.z);
      scene.add(llight);
    }
  }

  function buildTempleHall() {
    // Main temple hall
    var hallGeo = new THREE.BoxGeometry(25, 8, 20);
    var hallMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var hall = new THREE.Mesh(hallGeo, hallMat);
    hall.position.set(0, 4, -18);
    scene.add(hall);

    // Hall roof
    var roofGeo = new THREE.BoxGeometry(28, 1.5, 23);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 8.75, -18);
    scene.add(roof);

    // Roof edges (eaves)
    var eaveGeo = new THREE.BoxGeometry(32, 0.5, 27);
    var eaveMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var eave = new THREE.Mesh(eaveGeo, eaveMat);
    eave.position.set(0, 8.2, -18);
    scene.add(eave);

    // Hall columns
    var colPositions = [
      { x: -11, z: -8 }, { x: -11, z: -28 },
      { x: 11, z: -8 },  { x: 11, z: -28 }
    ];
    for (var i = 0; i < colPositions.length; i++) {
      var cp = colPositions[i];
      var colGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8);
      var colMat = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
      var col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cp.x, 4, cp.z);
      scene.add(col);
    }

    // Hall floor
    var hFloorGeo = new THREE.BoxGeometry(25, 0.2, 20);
    var hFloorMat = new THREE.MeshLambertMaterial({ color: 0x998866 });
    var hFloor = new THREE.Mesh(hFloorGeo, hFloorMat);
    hFloor.position.set(0, 0.1, -18);
    scene.add(hFloor);

    // Buddha statue (SphereGeometry)
    var buddhaBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 8);
    var buddhaMat = new THREE.MeshLambertMaterial({ color: 0x997722 });
    var buddhaBase = new THREE.Mesh(buddhaBaseGeo, buddhaMat);
    buddhaBase.position.set(0, 0.3, -26);
    scene.add(buddhaBase);

    var buddhaBodyGeo = new THREE.SphereGeometry(1.0, 12, 12);
    var buddhaBody = new THREE.Mesh(buddhaBodyGeo, buddhaMat);
    buddhaBody.position.set(0, 1.5, -26);
    scene.add(buddhaBody);

    var buddhaHeadGeo = new THREE.SphereGeometry(0.55, 10, 10);
    var buddhaHeadMat = new THREE.MeshLambertMaterial({ color: 0xBB9933 });
    var buddhaHead = new THREE.Mesh(buddhaHeadGeo, buddhaHeadMat);
    buddhaHead.position.set(0, 2.65, -26);
    scene.add(buddhaHead);

    // Buddha glow
    var buddhaLight = new THREE.PointLight(0xFFCC44, 0.8, 10);
    buddhaLight.position.set(0, 2, -26);
    scene.add(buddhaLight);

    // Incense burners (CylinderGeometry)
    var incensePos = [
      { x: -4, z: -26 }, { x: 4, z: -26 },
      { x: -8, z: -20 }, { x: 8, z: -20 }
    ];
    for (var j = 0; j < incensePos.length; j++) {
      var ip = incensePos[j];
      var burnerGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
      var burnerMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
      var burner = new THREE.Mesh(burnerGeo, burnerMat);
      burner.position.set(ip.x, 0.4, ip.z);
      scene.add(burner);

      var stickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
      var stickMat = new THREE.MeshLambertMaterial({ color: 0x553311 });
      var stick = new THREE.Mesh(stickGeo, stickMat);
      stick.position.set(ip.x, 1.2, ip.z);
      scene.add(stick);

      incenseBurners.push({ pos: ip });
    }
  }

  function buildTrainingYard() {
    // Training yard floor
    var yardGeo = new THREE.BoxGeometry(30, 0.3, 30);
    var yardMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var yard = new THREE.Mesh(yardGeo, yardMat);
    yard.position.set(-25, -0.15, 0);
    scene.add(yard);

    // Wooden training equipment (BoxGeometry)
    var equipDefs = [
      { x: -22, z: -5, w: 2, h: 1.5, d: 0.3 },
      { x: -28, z: -5, w: 0.3, h: 2, d: 2 },
      { x: -32, z:  2, w: 3, h: 0.5, d: 3 },
      { x: -20, z:  5, w: 0.5, h: 3, d: 0.5 }
    ];
    for (var i = 0; i < equipDefs.length; i++) {
      var ed = equipDefs[i];
      var eGeo = new THREE.BoxGeometry(ed.w, ed.h, ed.d);
      var eMat = new THREE.MeshLambertMaterial({ color: 0x8B6444 });
      var eMesh = new THREE.Mesh(eGeo, eMat);
      eMesh.position.set(ed.x, ed.h / 2, ed.z);
      scene.add(eMesh);
    }

    // Practice poles (CylinderGeometry)
    var polePos = [
      { x: -24, z: 5 }, { x: -26, z: 2 }, { x: -28, z: 8 }
    ];
    for (var p = 0; p < polePos.length; p++) {
      var pp = polePos[p];
      var pGeo = new THREE.CylinderGeometry(0.12, 0.15, 3, 6);
      var pMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(pp.x, 1.5, pp.z);
      scene.add(pMesh);
    }
  }

  function buildBellTower() {
    // Bell tower cylinder base
    var towerGeo = new THREE.CylinderGeometry(4, 4.5, 20, 12);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(22, 10, -5);
    scene.add(tower);

    // Tower top
    var tTopGeo = new THREE.ConeGeometry(5, 4, 12);
    var tTopMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var tTop = new THREE.Mesh(tTopGeo, tTopMat);
    tTop.position.set(22, 22, -5);
    scene.add(tTop);

    // Bell (CylinderGeometry)
    var bellGeo = new THREE.CylinderGeometry(1.2, 1.8, 2, 12);
    var bellMat = new THREE.MeshLambertMaterial({ color: 0xBB9922 });
    bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.position.set(22, 19, -5);
    scene.add(bellMesh);

    // Bell rope (LineSegments)
    var ropeGeo = new THREE.BufferGeometry();
    var ropeVerts = [];
    for (var r = 0; r <= 18; r++) {
      ropeVerts.push(22, 18 - r, -5);
      ropeVerts.push(22, 17 - r, -5);
    }
    ropeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ropeVerts, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x886644 });
    bellRopeMesh = new THREE.LineSegments(ropeGeo, ropeMat);
    scene.add(bellRopeMesh);

    // Bell light
    var bellLight = new THREE.PointLight(0xFFCC44, 0.6, 15);
    bellLight.position.set(22, 20, -5);
    scene.add(bellLight);
  }

  function buildMonasteryWing() {
    // Monastery wing
    var wingGeo = new THREE.BoxGeometry(20, 5, 30);
    var wingMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(22, 2.5, -18);
    scene.add(wing);

    // Monastery roof
    var wingRoofGeo = new THREE.BoxGeometry(23, 1, 33);
    var wingRoofMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var wingRoof = new THREE.Mesh(wingRoofGeo, wingRoofMat);
    wingRoof.position.set(22, 5.5, -18);
    scene.add(wingRoof);

    // Monks quarters windows (box cutouts via smaller boxes)
    var winPositions = [
      { x: 12, z: -10 }, { x: 12, z: -18 }, { x: 12, z: -26 }
    ];
    for (var w = 0; w < winPositions.length; w++) {
      var wp = winPositions[w];
      var winGeo = new THREE.BoxGeometry(0.3, 1.2, 1.5);
      var winMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      var winMesh = new THREE.Mesh(winGeo, winMat);
      winMesh.position.set(wp.x, 2.5, wp.z);
      scene.add(winMesh);
    }

    // Hidden passage door
    var passGeo = new THREE.BoxGeometry(0.3, 2, 1.2);
    var passMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var passMesh = new THREE.Mesh(passGeo, passMat);
    passMesh.position.set(12, 1, -26);
    scene.add(passMesh);
  }

  function buildScrollCases() {
    // 5 scroll cases in temple hall
    var scrollPositions = [
      { x: -8, z: -22 },
      { x: -4, z: -22 },
      { x:  0, z: -22 },
      { x:  4, z: -22 },
      { x:  8, z: -22 }
    ];

    for (var i = 0; i < TOTAL_SCROLLS; i++) {
      var sp = scrollPositions[i];
      var caseGeo = new THREE.BoxGeometry(0.8, 1.2, 0.6);
      var caseMat = new THREE.MeshLambertMaterial({ color: 0x997722 });
      var caseMesh = new THREE.Mesh(caseGeo, caseMat);
      caseMesh.position.set(sp.x, 0.6, sp.z);
      scene.add(caseMesh);

      // Scroll glow
      var scrollLight = new THREE.PointLight(0xFFAA44, 0.9, 4);
      scrollLight.position.set(sp.x, 1.5, sp.z);
      scene.add(scrollLight);

      // Scroll label strip
      var stripGeo = new THREE.BoxGeometry(0.82, 0.2, 0.1);
      var stripMat = new THREE.MeshLambertMaterial({ color: 0xCC9933 });
      var strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(sp.x, 0.8, sp.z + 0.3);
      scene.add(strip);

      scrolls.push({
        mesh: caseMesh,
        light: scrollLight,
        pos: { x: sp.x, y: 0.6, z: sp.z },
        originalPos: { x: sp.x, y: 0.6, z: sp.z },
        stolen: false,
        carriedBy: -1,
        stealTimer: 0
      });
    }
  }

  function buildPickups() {
    // Staff pickup in training yard
    var sGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6);
    var sMat = new THREE.MeshLambertMaterial({ color: 0x886633, emissive: 0x441100, emissiveIntensity: 0.3 });
    staffPickupMesh = new THREE.Mesh(sGeo, sMat);
    staffPickupMesh.rotation.z = Math.PI / 6;
    staffPickupMesh.position.set(staffPickupPos.x, staffPickupPos.y, staffPickupPos.z);
    scene.add(staffPickupMesh);

    // Throwing stars pickup (ConeGeometry cluster)
    var starGeo = new THREE.ConeGeometry(0.3, 0.1, 5);
    var starMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA, emissive: 0x444444, emissiveIntensity: 0.4 });
    throwingStarPickupMesh = new THREE.Mesh(starGeo, starMat);
    throwingStarPickupMesh.position.set(throwingStarPickupPos.x, throwingStarPickupPos.y, throwingStarPickupPos.z);
    scene.add(throwingStarPickupMesh);
  }

  function buildBoundaryWalls() {
    var wallDefs = [
      // North wall
      { x: 0,   y: 4, z: -35, w: 60, h: 8, d: 1 },
      // South wall (temple entrance)
      { x: 0,   y: 2, z: 22,  w: 20, h: 4, d: 1 },
      { x: -16, y: 2, z: 22,  w: 12, h: 4, d: 1 },
      { x:  16, y: 2, z: 22,  w: 12, h: 4, d: 1 },
      // East wall
      { x: 35,  y: 4, z: -5,  w: 1, h: 8, d: 60 },
      // West wall
      { x: -35, y: 4, z: -5,  w: 1, h: 8, d: 60 }
    ];
    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var wGeo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var wMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
      var wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(wd.x, wd.y, wd.z);
      scene.add(wMesh);
    }

    // Gate pillars
    var pillarGeo = new THREE.BoxGeometry(1.5, 6, 1.5);
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var p1 = new THREE.Mesh(pillarGeo, pillarMat);
    p1.position.set(-5, 3, 22);
    scene.add(p1);
    var p2 = new THREE.Mesh(pillarGeo, pillarMat);
    p2.position.set(5, 3, 22);
    scene.add(p2);

    // Gate top beam
    var gateTopGeo = new THREE.BoxGeometry(13, 1, 1.5);
    var gateTopMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
    var gateTop = new THREE.Mesh(gateTopGeo, gateTopMat);
    gateTop.position.set(0, 6.5, 22);
    scene.add(gateTop);
  }

  // ─── Player mesh ──────────────────────────────────────────────────────────
  function createPlayerMesh() {
    if (playerMesh) { scene.remove(playerMesh); }
    var group = new THREE.Object3D();

    // Monk robe body
    var bodyGeo = new THREE.BoxGeometry(0.65, 1.0, 0.45);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFAA55 }); // saffron robe
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.27, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xDDCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.15;
    group.add(head);

    // Shoulders / arms stub
    var armGeo = new THREE.BoxGeometry(0.95, 0.25, 0.3);
    var arm = new THREE.Mesh(armGeo, bodyMat);
    arm.position.y = 0.82;
    group.add(arm);

    group.position.set(playerPos.x, playerPos.y, playerPos.z);
    scene.add(group);
    playerMesh = group;
  }

  // ─── Enemy creation ───────────────────────────────────────────────────────
  function spawnEnemy(type, spawnPos) {
    var hp, color, speed, damage, attackRate;
    if (type === 'boss') {
      hp = 450; color = 0x110000; speed = 2.5; damage = 40; attackRate = 1.0;
    } else if (type === 'enforcer') {
      hp = 100; color = 0x221100; speed = 2.8; damage = 22; attackRate = 1.3;
    } else {
      hp = 60; color = 0x332211; speed = 2.2; damage = 15; attackRate = 1.8;
    }

    var group = new THREE.Object3D();

    var bGeo = new THREE.BoxGeometry(0.7, 0.95, 0.5);
    var bMat = new THREE.MeshLambertMaterial({ color: color });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.y = 0.475;
    group.add(bMesh);

    var hGeo = new THREE.SphereGeometry(0.28, 6, 6);
    var hMat = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
    var hMesh = new THREE.Mesh(hGeo, hMat);
    hMesh.position.y = 1.15;
    group.add(hMesh);

    if (type === 'boss') {
      // Twin nightstick indicators
      var ns1Geo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 4);
      var nsMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var ns1 = new THREE.Mesh(ns1Geo, nsMat);
      ns1.rotation.z = Math.PI / 3;
      ns1.position.set(-0.5, 0.7, 0.1);
      group.add(ns1);
      var ns2 = new THREE.Mesh(ns1Geo, nsMat);
      ns2.rotation.z = -Math.PI / 3;
      ns2.position.set(0.5, 0.7, 0.1);
      group.add(ns2);
    } else if (type === 'enforcer') {
      // Brass knuckles indicator
      var bkGeo = new THREE.BoxGeometry(0.35, 0.15, 0.15);
      var bkMat = new THREE.MeshLambertMaterial({ color: 0xBBA033 });
      var bk = new THREE.Mesh(bkGeo, bkMat);
      bk.position.set(0.45, 0.65, 0.15);
      group.add(bk);
    }

    var pos = spawnPos || { x: randRange(-15, 15), y: 0, z: 25 };
    group.position.set(pos.x, pos.y, pos.z);
    scene.add(group);

    var enemy = {
      mesh: group,
      pos: { x: pos.x, y: 0, z: pos.z },
      hp: hp,
      maxHp: hp,
      type: type,
      speed: speed,
      damage: damage,
      attackRate: attackRate,
      state: 'patrol', // patrol, attack, stunned, carrying, retreating
      attackTimer: randRange(0.5, 2.0),
      stunTimer: 0,
      carryingScroll: false,
      scrollIdx: -1,
      stealProgress: 0,
      phase: Math.random() * Math.PI * 2
    };
    enemies.push(enemy);
    return enemy;
  }

  // ─── Wave spawning ─────────────────────────────────────────────────────────
  function startWave(waveNum) {
    currentWave = waveNum;
    waveActive = true;

    // Remove dead enemy refs
    var live = [];
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) live.push(enemies[i]);
    }
    enemies = live;

    var spawnCount = 4;
    var isBossWave = (waveNum === TOTAL_WAVES);

    if (isBossWave) {
      bossStatus = 'APPROACHING';
      showMessage('WAVE 10 — GANG BOSS APPROACHES!', '#FF4444', 3000);
      // Spawn boss + 3 soldiers
      spawnEnemy('boss', { x: 0, y: 0, z: 28 });
      bossMesh = enemies[enemies.length - 1].mesh;
      for (var b = 0; b < 3; b++) {
        spawnEnemy('soldier', { x: randRange(-12, 12), y: 0, z: 26 + randRange(0, 4) });
      }
    } else {
      if (isBossWave) { bossStatus = 'N/A'; }
      for (var j = 0; j < spawnCount; j++) {
        var type = (waveNum >= 4 && Math.random() < 0.5) ? 'enforcer' : 'soldier';
        var sx = randRange(-18, 18);
        var sz = randRange(24, 28);
        spawnEnemy(type, { x: sx, y: 0, z: sz });
      }
      showMessage('WAVE ' + waveNum + ' — TRIADS INCOMING!', '#FFCC44', 2000);
    }

    playAlertSound();
  }

  // ─── Monk AI ───────────────────────────────────────────────────────────────
  function createMonks() {
    var monkPositions = [
      { x: -6, z: -20 }, { x: 6, z: -20 }
    ];
    for (var i = 0; i < monkPositions.length; i++) {
      var mp = monkPositions[i];
      var mg = new THREE.Object3D();

      var mbGeo = new THREE.BoxGeometry(0.55, 0.9, 0.4);
      var mbMat = new THREE.MeshLambertMaterial({ color: 0xFF9933 });
      var mbMesh = new THREE.Mesh(mbGeo, mbMat);
      mbMesh.position.y = 0.45;
      mg.add(mbMesh);

      var mhGeo = new THREE.SphereGeometry(0.22, 6, 6);
      var mhMat = new THREE.MeshLambertMaterial({ color: 0xDDCCAA });
      var mhMesh = new THREE.Mesh(mhGeo, mhMat);
      mhMesh.position.y = 1.05;
      mg.add(mhMesh);

      mg.position.set(mp.x, 0, mp.z);
      scene.add(mg);

      monks.push({
        mesh: mg,
        pos: { x: mp.x, y: 0, z: mp.z },
        hp: 80,
        attackTimer: 1.5,
        state: 'idle'
      });
    }
  }

  function updateMonks(dt) {
    for (var i = 0; i < monks.length; i++) {
      var monk = monks[i];
      if (monk.hp <= 0) continue;

      // Find nearest enemy or scroll-carrier
      var nearest = null;
      var nearDist = 999;
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (en.hp <= 0) continue;
        var priority = en.carryingScroll ? 1 : 0;
        var d = dist2d(monk.pos, en.pos);
        var dd = d - priority * 20; // scroll carriers are "closer" in priority
        if (dd < nearDist) { nearDist = dd; nearest = en; }
      }

      if (nearest) {
        var dx = nearest.pos.x - monk.pos.x;
        var dz = nearest.pos.z - monk.pos.z;
        var dlen = Math.sqrt(dx * dx + dz * dz) || 1;
        var mspeed = 3.5;
        if (dlen > 2.5) {
          monk.pos.x += (dx / dlen) * mspeed * dt;
          monk.pos.z += (dz / dlen) * mspeed * dt;
        }

        monk.attackTimer -= dt;
        if (monk.attackTimer <= 0 && dlen < 3.0) {
          monk.attackTimer = 1.2;
          nearest.hp -= 18;
          if (nearest.hp <= 0) { killEnemy(nearest); }
        }
      }

      monk.mesh.position.x = monk.pos.x;
      monk.mesh.position.z = monk.pos.z;
    }
  }

  // ─── Input handling ───────────────────────────────────────────────────────
  var mouseX = 0, mouseY = 0;
  var pointerLocked = false;

  function onKeyDown(e) {
    if (!active) {
      var k = e.key ? e.key.toLowerCase() : '';
      if (k === 'k') kDownAt = Date.now();
      if (k === 't') tDownAt = Date.now();
      if (Math.abs(kDownAt - tDownAt) <= ACTIVATION_WINDOW && kDownAt > 0 && tDownAt > 0) {
        kDownAt = 0; tDownAt = 0;
        startGame();
      }
      return;
    }
    var key = e.key ? e.key.toLowerCase() : '';
    keysDown[key] = true;
    if (key === 'escape') { stopGame(); return; }
    if (gameOver || gameWon) return;

    // V = chi blast
    if (key === 'v') { tryChiBlast(); }
    // E = throw star or ring bell
    if (key === 'e') {
      var nearBell = Math.abs(playerPos.x - 22) < 5 && Math.abs(playerPos.z - 5) < 5;
      if (nearBell && bellCooldown <= 0) {
        ringBell();
      } else {
        throwThrowingStar();
      }
    }
    // F = pick up staff if near
    if (key === 'f') { tryPickupStaff(); }
  }

  function onKeyUp(e) {
    if (!active) return;
    var key = e.key ? e.key.toLowerCase() : '';
    keysDown[key] = false;
    if (key === ' ') blockActive = false;
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0) { doPunch(); }
    if (e.button === 2) { doKick(); }
    if (e.button === 2) { e.preventDefault(); }
  }

  function onContextMenu(e) { if (active) e.preventDefault(); }

  function onMouseMove(e) {
    if (!active) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    playerYaw   -= dx * 0.002;
    playerPitch -= dy * 0.002;
    playerPitch = clamp(playerPitch, -0.5, 0.7);
  }

  function onPointerLockChange() {
    pointerLocked = (document.pointerLockElement === renderer.domElement);
  }

  // ─── Combat actions ───────────────────────────────────────────────────────
  function doPunch() {
    if (gameOver || gameWon) return;
    if (punchCooldown > 0) return;

    punchCombo++;
    if (punchCombo > 3) punchCombo = 1;
    punchComboTimer = 0.8;

    var dmg = 20;
    if (punchCombo === 3) { dmg = 30; showMessage('3-HIT COMBO!', '#FFAA44'); }
    punchCooldown = 0.18;

    var hit = attackNearestEnemy(dmg, 2.5, 0);
    if (hit) {
      chiMeter = Math.min(100, chiMeter + 5);
      playPunchSound();
      flashScreen();
      attackAnimTimer = 0.1;
    }
  }

  function doKick() {
    if (gameOver || gameWon) return;
    if (kickCooldown > 0) return;
    kickCooldown = 0.5;

    var hit = attackNearestEnemy(35, 3.0, 2.5);
    if (hit) {
      chiMeter = Math.min(100, chiMeter + 8);
      playKickSound();
      flashScreen();
      attackAnimTimer = 0.12;
    }
  }

  function doStaffAttack() {
    if (!hasStaff) return;
    if (staffCooldown > 0) return;
    staffCooldown = 0.55;
    // Sweep: hit all enemies in range
    var hitCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      var d = dist2d(playerPos, en.pos);
      if (d < 4.5) {
        applyDamageToEnemy(en, 45, 1.5);
        hitCount++;
      }
    }
    if (hitCount > 0) {
      playStaffSound();
      chiMeter = Math.min(100, chiMeter + 6 * hitCount);
      flashScreen('rgba(100,200,100,0.3)');
      if (hitCount > 1) showMessage('STAFF SWEEP x' + hitCount + '!', '#88FFAA');
      attackAnimTimer = 0.15;
    }
  }

  function throwThrowingStar() {
    if (throwingStars <= 0) { showMessage('NO THROWING STARS LEFT!', '#FF4444'); return; }
    if (throwCooldown > 0) return;
    throwCooldown = 0.3;
    throwingStars--;

    // Direction from player yaw
    var dirX = -Math.sin(playerYaw);
    var dirZ = -Math.cos(playerYaw);

    var starGeo = new THREE.ConeGeometry(0.12, 0.08, 5);
    var starMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.position.set(playerPos.x, 1.2, playerPos.z);
    scene.add(starMesh);

    projectiles.push({
      mesh: starMesh,
      pos: { x: playerPos.x, y: 1.2, z: playerPos.z },
      dir: { x: dirX, z: dirZ },
      speed: 18,
      damage: 30,
      timer: 3.0
    });

    playStarSound();
    attackAnimTimer = 0.08;
  }

  function tryChiBlast() {
    if (chiMeter < 50) { showMessage('NOT ENOUGH CHI (need 50%)', '#FF4444'); return; }
    if (chiBlastCooldown > 0) return;
    chiMeter -= 50;
    chiBlastCooldown = 3.0;

    var blastCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      var d = dist2d(playerPos, en.pos);
      if (d < 8) {
        // Knockback
        var dx = en.pos.x - playerPos.x;
        var dz = en.pos.z - playerPos.z;
        var dlen = Math.sqrt(dx * dx + dz * dz) || 1;
        en.pos.x += (dx / dlen) * 5;
        en.pos.z += (dz / dlen) * 5;
        en.stunTimer = 1.5;
        en.state = 'stunned';
        // Drop scroll if carrying
        if (en.carryingScroll) { dropScroll(en); }
        blastCount++;
      }
    }

    showMessage('CHI BLAST! ' + blastCount + ' ENEMIES KNOCKED BACK!', '#44FFFF', 2000);
    playChiSound();
    flashScreen('rgba(0,200,255,0.3)');
  }

  function ringBell() {
    bellCooldown = BELL_COOLDOWN;
    bellSwinging = true;
    bellSwingTimer = 3.0;

    var stunCount = 0;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      var d = dist2d(playerPos, en.pos);
      if (d < BELL_RANGE) {
        en.stunTimer = BELL_STUN_TIME;
        en.state = 'stunned';
        stunCount++;
      }
    }

    // Alert monks
    monksAlerted = true;

    playBellSound();
    showMessage('BELL RUNG! ' + stunCount + ' ENEMIES STUNNED! MONKS ALERTED!', '#FFCC44', 3000);
  }

  function tryPickupStaff() {
    if (!staffPickupMesh) return;
    var d = dist2d(playerPos, staffPickupPos);
    if (d < 3) {
      hasStaff = true;
      scene.remove(staffPickupMesh);
      staffPickupMesh = null;
      showMessage('STAFF ACQUIRED! LMB to sweep!', '#88FF88', 2500);
    }
  }

  // ─── Attack helpers ───────────────────────────────────────────────────────
  function attackNearestEnemy(damage, range, knockback) {
    var best = null;
    var bestD = 999;
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      var d = dist2d(playerPos, en.pos);
      if (d < range && d < bestD) { bestD = d; best = en; }
    }
    if (!best) return false;
    applyDamageToEnemy(best, damage, knockback);
    return true;
  }

  function applyDamageToEnemy(en, damage, knockback) {
    if (en.hp <= 0) return;
    en.hp -= damage;
    if (knockback > 0) {
      var dx = en.pos.x - playerPos.x;
      var dz = en.pos.z - playerPos.z;
      var dlen = Math.sqrt(dx * dx + dz * dz) || 1;
      en.pos.x += (dx / dlen) * knockback;
      en.pos.z += (dz / dlen) * knockback;
    }
    // Knock down scroll carrier
    if (en.carryingScroll && knockback > 0) { dropScroll(en); }

    if (en.hp <= 0) { killEnemy(en); }
    else {
      en.stunTimer = 0.3;
    }
  }

  function killEnemy(en) {
    en.hp = 0;
    if (en.carryingScroll) { dropScroll(en); }
    if (en.mesh) {
      en.mesh.rotation.x = Math.PI / 2;
      en.mesh.position.y = -0.3;
    }
    totalKilled++;
    chiMeter = Math.min(100, chiMeter + 3);

    if (en.type === 'boss') {
      bossDefeated = true;
      bossStatus = 'DEFEATED';
      showMessage('GANG BOSS DEFEATED!', '#FFCC44', 3000);
      playWinSound();
    }
  }

  // ─── Scroll management ────────────────────────────────────────────────────
  function tryStealScroll(en) {
    // Find nearest unstolen scroll in temple hall
    var best = -1;
    var bestD = 999;
    for (var i = 0; i < scrolls.length; i++) {
      var sc = scrolls[i];
      if (sc.stolen || sc.carriedBy !== -1) continue;
      var d = dist2d(en.pos, sc.pos);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best === -1) return false;
    if (bestD < 1.5) {
      en.carryingScroll = true;
      en.scrollIdx = best;
      scrolls[best].carriedBy = enemies.indexOf(en);
      en.state = 'carrying';
      showMessage('SCROLL STOLEN! INTERCEPT!', '#FF2222', 2000);
      playAlertSound();
      return true;
    }
    return false;
  }

  function dropScroll(en) {
    if (en.scrollIdx < 0) return;
    var idx = en.scrollIdx;
    scrolls[idx].carriedBy = -1;
    scrolls[idx].pos.x = en.pos.x;
    scrolls[idx].pos.z = en.pos.z;
    scrolls[idx].mesh.position.x = en.pos.x;
    scrolls[idx].mesh.position.z = en.pos.z;
    scrolls[idx].light.position.x = en.pos.x;
    scrolls[idx].light.position.z = en.pos.z;
    en.carryingScroll = false;
    en.scrollIdx = -1;
    en.state = 'patrol';
  }

  function confirmScrollStolen(en) {
    if (en.scrollIdx < 0) return;
    var idx = en.scrollIdx;
    scrolls[idx].stolen = true;
    scrolls[idx].carriedBy = -1;
    if (scrolls[idx].mesh) {
      scene.remove(scrolls[idx].mesh);
      scrolls[idx].mesh = null;
    }
    if (scrolls[idx].light) {
      scene.remove(scrolls[idx].light);
      scrolls[idx].light = null;
    }
    en.carryingScroll = false;
    en.scrollIdx = -1;

    scrollsStolen++;
    scrollsSafe = TOTAL_SCROLLS - scrollsStolen;

    showMessage('SCROLL LOST! (' + scrollsSafe + ' REMAIN)', '#FF0000', 2500);
    playAlertSound();

    if (scrollsStolen >= TOTAL_SCROLLS) {
      triggerGameOver('All sacred scrolls have been stolen!');
    }
  }

  // ─── Enemy AI update ──────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;

      // Stun
      if (en.stunTimer > 0) {
        en.stunTimer -= dt;
        if (en.stunTimer <= 0) { en.state = en.carryingScroll ? 'carrying' : 'patrol'; }
        // Animate stun wobble
        if (en.mesh) { en.mesh.rotation.z = Math.sin(en.phase + Date.now() * 0.01) * 0.3; }
        continue;
      }
      if (en.mesh) { en.mesh.rotation.z = 0; }

      var dx, dz, dlen, d;

      if (en.state === 'carrying') {
        // Head to temple entrance (z = 22)
        dx = 0 - en.pos.x;
        dz = 24 - en.pos.z;
        dlen = Math.sqrt(dx * dx + dz * dz) || 1;
        en.pos.x += (dx / dlen) * en.speed * 0.7 * dt;
        en.pos.z += (dz / dlen) * en.speed * 0.7 * dt;

        // Update carried scroll position
        var sc = scrolls[en.scrollIdx];
        if (sc) {
          sc.pos.x = en.pos.x;
          sc.pos.z = en.pos.z;
          if (sc.mesh) { sc.mesh.position.set(en.pos.x, 1.8, en.pos.z); }
          if (sc.light) { sc.light.position.set(en.pos.x, 2.5, en.pos.z); }
        }

        // Reached gate = scroll stolen
        if (en.pos.z >= 24) {
          confirmScrollStolen(en);
          en.state = 'patrol';
          // Enemy escapes or retreats
          en.hp = 0;
          if (en.mesh) scene.remove(en.mesh);
        }
      } else if (en.state === 'patrol' || en.state === 'attack') {
        d = dist2d(playerPos, en.pos);

        // Decide: go for scroll or attack player?
        var wantScroll = (Math.random() < 0.003) && (d > 8); // occasionally decide to steal
        if (wantScroll) {
          // Move toward nearest scroll
          var bestSc = -1;
          var bestScD = 999;
          for (var s = 0; s < scrolls.length; s++) {
            if (!scrolls[s].stolen && scrolls[s].carriedBy === -1) {
              var sd = dist2d(en.pos, scrolls[s].pos);
              if (sd < bestScD) { bestScD = sd; bestSc = s; }
            }
          }
          if (bestSc !== -1) {
            dx = scrolls[bestSc].pos.x - en.pos.x;
            dz = scrolls[bestSc].pos.z - en.pos.z;
            dlen = Math.sqrt(dx * dx + dz * dz) || 1;
            en.pos.x += (dx / dlen) * en.speed * dt;
            en.pos.z += (dz / dlen) * en.speed * dt;
            if (bestScD < 1.5) { tryStealScroll(en); }
          }
        } else {
          // Move toward player
          if (d > 2.2) {
            dx = playerPos.x - en.pos.x;
            dz = playerPos.z - en.pos.z;
            dlen = Math.sqrt(dx * dx + dz * dz) || 1;
            en.pos.x += (dx / dlen) * en.speed * dt;
            en.pos.z += (dz / dlen) * en.speed * dt;
          }

          // Attack player
          en.attackTimer -= dt;
          if (en.attackTimer <= 0 && d < 2.5) {
            en.attackTimer = en.attackRate + randRange(0, 0.5);
            dealDamageToPlayer(en.damage);
          }

          // Also check proximity to scroll (opportunistic theft)
          for (var ss = 0; ss < scrolls.length; ss++) {
            if (!scrolls[ss].stolen && scrolls[ss].carriedBy === -1) {
              var ssd = dist2d(en.pos, scrolls[ss].pos);
              if (ssd < 1.5) { tryStealScroll(en); break; }
            }
          }
        }
      }

      // Clamp position within temple grounds
      en.pos.x = clamp(en.pos.x, -34, 34);
      en.pos.z = clamp(en.pos.z, -34, 28);

      // Update mesh
      if (en.mesh) {
        en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        // Face player
        var angle = Math.atan2(playerPos.x - en.pos.x, playerPos.z - en.pos.z);
        en.mesh.rotation.y = angle;
      }
    }
  }

  // ─── Projectile update ────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var proj = projectiles[i];
      proj.pos.x += proj.dir.x * proj.speed * dt;
      proj.pos.z += proj.dir.z * proj.speed * dt;
      proj.timer -= dt;

      if (proj.mesh) {
        proj.mesh.position.set(proj.pos.x, proj.pos.y, proj.pos.z);
        proj.mesh.rotation.y += 10 * dt;
      }

      // Hit test
      var hit = false;
      for (var j = 0; j < enemies.length; j++) {
        var en = enemies[j];
        if (en.hp <= 0) continue;
        var d = dist2d(proj.pos, en.pos);
        if (d < 1.0) {
          applyDamageToEnemy(en, proj.damage, 0);
          playHitSound();
          hit = true;
          break;
        }
      }

      if (hit || proj.timer <= 0) {
        if (proj.mesh) { scene.remove(proj.mesh); }
        projectiles.splice(i, 1);
      }
    }
  }

  // ─── Player takes damage ──────────────────────────────────────────────────
  function dealDamageToPlayer(dmg) {
    if (invincTimer > 0) return;
    var finalDmg = dmg;
    if (blockActive) {
      finalDmg = dmg * 0.4;
      playBlockSound();
    }
    playerHP -= finalDmg;
    flashScreen();
    if (playerHP <= 0) {
      playerHP = 0;
      triggerGameOver('The Head Monk has fallen!');
    }
  }

  // ─── Wave completion check ────────────────────────────────────────────────
  function checkWaveComplete() {
    if (!waveActive) return;
    var alive = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) alive++;
    }
    if (alive === 0) {
      waveActive = false;
      if (currentWave >= TOTAL_WAVES) {
        triggerWin();
      } else {
        waveTransitionTimer = 5.0;
        showMessage('WAVE ' + currentWave + ' CLEARED! NEXT WAVE IN 5s...', '#44FF44', 4000);
      }
    }
  }

  // ─── Win / Lose ───────────────────────────────────────────────────────────
  function triggerWin() {
    gameWon = true;
    playWinSound();
    showMessage(
      'TEMPLE DEFENDED! POLICE ARRIVE!\n' + scrollsSafe + '/' + TOTAL_SCROLLS + ' SCROLLS SAFE',
      '#FFCC44', 8000
    );
  }

  function triggerGameOver(reason) {
    gameOver = true;
    showMessage('MISSION FAILED\n' + reason, '#FF2222', 8000);
  }

  // ─── Bell animation ───────────────────────────────────────────────────────
  function updateBell(dt) {
    if (bellSwinging) {
      bellSwingTimer -= dt;
      if (bellMesh) {
        bellMesh.rotation.z = Math.sin(bellSwingTimer * 5) * 0.4;
      }
      if (bellSwingTimer <= 0) {
        bellSwinging = false;
        if (bellMesh) bellMesh.rotation.z = 0;
      }
    }
    if (bellCooldown > 0) bellCooldown -= dt;
  }

  // ─── Throwing star pickup check ───────────────────────────────────────────
  function checkPickups(dt) {
    // Staff
    if (staffPickupMesh) {
      staffPickupMesh.rotation.y += dt * 1.5;
      var sd = dist2d(playerPos, staffPickupPos);
      if (sd < 2.0) {
        tryPickupStaff();
      }
    }
    // Throwing stars
    if (throwingStarPickupMesh) {
      throwingStarPickupMesh.rotation.y += dt * 2;
      var td = dist2d(playerPos, throwingStarPickupPos);
      if (td < 2.0) {
        throwingStars = Math.min(10, throwingStars + 5);
        scene.remove(throwingStarPickupMesh);
        throwingStarPickupMesh = null;
        showMessage('+5 THROWING STARS', '#AAAAFF', 1500);
      }
    }
  }

  // ─── Main update loop ─────────────────────────────────────────────────────
  function update() {
    if (!active) return;
    var now = performance.now();
    var dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;

    if (messageCooldown > 0) messageCooldown -= dt;

    if (gameOver || gameWon) {
      updateHUD();
      if (renderer && scene && camera) if (renderer) renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(update);
      return;
    }

    // Time countdown
    timeRemaining -= dt;
    if (timeRemaining <= 0) {
      timeRemaining = 0;
      triggerWin();
    }

    // Timers
    if (punchCooldown > 0) punchCooldown -= dt;
    if (kickCooldown > 0) kickCooldown -= dt;
    if (staffCooldown > 0) staffCooldown -= dt;
    if (throwCooldown > 0) throwCooldown -= dt;
    if (chiBlastCooldown > 0) chiBlastCooldown -= dt;
    if (invincTimer > 0) invincTimer -= dt;
    if (attackAnimTimer > 0) attackAnimTimer -= dt;

    if (punchComboTimer > 0) {
      punchComboTimer -= dt;
      if (punchComboTimer <= 0) punchCombo = 0;
    }

    // Block (space)
    blockActive = !!keysDown[' '];

    // Staff attack (LMB if staff equipped — shared with punch via hasStaff flag)
    // If player has staff, override LMB action handled via doPunch → doStaffAttack
    // (doPunch calls doStaffAttack automatically when staff equipped)

    // Wave management
    if (!waveActive) {
      if (currentWave === 0) {
        // Start first wave after a moment
        waveTransitionTimer -= dt;
        if (waveTransitionTimer <= 0) {
          startWave(1);
        }
      } else if (currentWave < TOTAL_WAVES) {
        waveTransitionTimer -= dt;
        if (waveTransitionTimer <= 0) {
          startWave(currentWave + 1);
        }
      }
    } else {
      checkWaveComplete();
    }

    // Player movement (WASD)
    var spd = blockActive ? 1.5 : 5.0;
    var mx = 0, mz = 0;
    if (keysDown['a'] || keysDown['arrowleft'])  mx -= 1;
    if (keysDown['d'] || keysDown['arrowright']) mx += 1;
    if (keysDown['w'] || keysDown['arrowup'])    mz -= 1;
    if (keysDown['s'] || keysDown['arrowdown'])  mz += 1;

    var mlen = Math.sqrt(mx * mx + mz * mz);
    if (mlen > 0) { mx /= mlen; mz /= mlen; }

    // Apply movement relative to camera yaw
    var cos = Math.cos(playerYaw);
    var sin = Math.sin(playerYaw);
    playerPos.x += (mx * cos - mz * (-sin)) * spd * dt;
    playerPos.z += (mx * (-sin) + mz * (-cos)) * spd * dt; // corrected for FPS-like

    // FPS walk movement in look direction
    // Recompute: forward = -sin(yaw), right = cos(yaw) on XZ plane
    playerPos.x = clamp(playerPos.x, -33, 33);
    playerPos.z = clamp(playerPos.z, -33, 27);

    // Update player mesh
    if (playerMesh) {
      playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
      playerMesh.rotation.y = playerYaw;
      if (attackAnimTimer > 0) {
        playerMesh.rotation.x = -0.3;
      } else {
        playerMesh.rotation.x = 0;
      }
    }

    // Camera (FPS)
    var eyeH = 1.7;
    camera.position.set(
      playerPos.x,
      playerPos.y + eyeH,
      playerPos.z
    );
    var lookX = playerPos.x - Math.sin(playerYaw) * Math.cos(playerPitch) * 5;
    var lookY = playerPos.y + eyeH + Math.sin(playerPitch) * 5;
    var lookZ = playerPos.z - Math.cos(playerYaw) * Math.cos(playerPitch) * 5;
    camera.lookAt(lookX, lookY, lookZ);

    // Staff attack on LMB when equipped
    // (handled in doPunch → redirects to doStaffAttack)

    updateEnemies(dt);
    updateProjectiles(dt);
    updateMonks(dt);
    updateBell(dt);
    checkPickups(dt);

    // Animate scroll glow pulse
    var t = now / 1000;
    for (var s = 0; s < scrolls.length; s++) {
      if (scrolls[s].light && !scrolls[s].stolen) {
        scrolls[s].light.intensity = 0.7 + Math.sin(t * 2.5 + s) * 0.3;
      }
    }

    // Count for HUD boss status
    if (currentWave === TOTAL_WAVES && !bossDefeated) {
      // check if boss is still alive
      var bossAlive = false;
      for (var bi = 0; bi < enemies.length; bi++) {
        if (enemies[bi].type === 'boss' && enemies[bi].hp > 0) { bossAlive = true; break; }
      }
      if (!bossAlive && waveActive) { bossStatus = 'DEFEATED'; bossDefeated = true; }
    }

    updateHUD();
    if (renderer) renderer.render(scene, camera);
    animFrameId = requestAnimationFrame(update);
  }

  // ─── Start / stop ─────────────────────────────────────────────────────────
  function startGame() {
    if (active) return;
    active = true;

    initAudio();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.id = 'kungfutemple-canvas';
    renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:9990;cursor:crosshair;';
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    buildScene();
    createPlayerMesh();
    createMonks();
    createHUD();
    resetState();

    // Pointer lock
    renderer.domElement.addEventListener('click', function () {
      if (active) renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onMouseMove);

    clock.last = performance.now();
    waveTransitionTimer = 3.0; // 3s before first wave

    animFrameId = requestAnimationFrame(update);

    showMessage(
      'DEFEND THE TEMPLE!\nWASD=Move Mouse=Look LMB=Punch/Staff RMB=Kick\nE=Star/Bell V=ChiBl F=Pickup SPACE=Block',
      '#AAFFAA', 5000
    );
  }

  function resetState() {
    playerHP = playerMaxHP;
    playerPos.x = 0; playerPos.y = 0; playerPos.z = 10;
    playerYaw = 0; playerPitch = 0;
    currentWave = 0;
    waveActive = false;
    waveTransitionTimer = 3.0;
    gameOver = false;
    gameWon = false;
    timeRemaining = GAME_DURATION;
    bellCooldown = 0;
    bellSwinging = false;
    bellSwingTimer = 0;
    chiMeter = 0;
    throwingStars = 10;
    hasStaff = false;
    punchCombo = 0;
    punchComboTimer = 0;
    punchCooldown = 0;
    kickCooldown = 0;
    staffCooldown = 0;
    throwCooldown = 0;
    chiBlastCooldown = 0;
    invincTimer = 0;
    attackAnimTimer = 0;
    blockActive = false;
    scrollsSafe = TOTAL_SCROLLS;
    scrollsStolen = 0;
    totalKilled = 0;
    bossDefeated = false;
    bossStatus = 'N/A';
    bossMesh = null;
    enemies = [];
    projectiles = [];
    monks = [];
    monksAlerted = false;
    scrolls = [];
    messageCooldown = 0;
  }

  function stopGame() {
    if (!active) return;
    active = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    removeHUD();
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    document.removeEventListener('mousemove', onMouseMove);
    if (document.exitPointerLock) document.exitPointerLock();
    var canvas = document.getElementById('kungfutemple-canvas');
    if (canvas && canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    if (scene) {
      while (scene.children.length > 0) { scene.remove(scene.children[0]); }
    }
    keysDown = {};
    kDownAt = 0; tDownAt = 0;
  }

  // ─── Resize ───────────────────────────────────────────────────────────────
  function onResize() {
    if (!active || !renderer || !camera) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  // ─── Override doPunch to use staff if available ───────────────────────────
  var _origDoPunch = doPunch;
  doPunch = function () {
    if (hasStaff) { doStaffAttack(); return; }
    _origDoPunch();
  };

  // ─── Event listeners ──────────────────────────────────────────────────────
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('resize', onResize);

  // ─── Public API ───────────────────────────────────────────────────────────
  function init()  {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */
 /* activated via K+T simultaneous keypress */ }
  function reset() { stopGame(); }

  return { init: init, update: update, reset: reset };
}());
