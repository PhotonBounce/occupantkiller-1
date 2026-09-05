window.SamuraiSiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── Activation key tracking (S+S within 400ms) ───────────────────────────
  var keysDown = {};
  var s1DownAt = 0;
  var s2DownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;
  var scene, camera, renderer, animFrameId;

  // ─── Clock ────────────────────────────────────────────────────────────────
  var clockLast = 0;
  var gameTime = 0; // seconds elapsed
  var WIN_TIME = 900; // 15 minutes

  // ─── Game state ──────────────────────────────────────────────────────────
  var gameOver = false;
  var gameWon = false;
  var gameOverReason = '';

  // ─── Player state ────────────────────────────────────────────────────────
  var playerHP = 200;
  var playerMaxHP = 200;
  var playerPos = { x: 0, y: 1, z: 10 };
  var playerYaw = 0;   // horizontal rotation (radians)
  var playerPitch = 0; // vertical camera tilt
  var moveVel = { x: 0, z: 0 };
  var playerMesh = null;
  var playerAlive = true;

  // ─── Weapon state ────────────────────────────────────────────────────────
  var WEAPON_KATANA = 'katana';
  var WEAPON_BOW = 'bow';
  var WEAPON_NAGINATA = 'naginata';
  var currentWeapon = WEAPON_KATANA;
  var attackCooldown = 0;
  var katanaCooldown = 0.7;
  var naginataCooldown = 1.2;
  var bowChargeTime = 0;
  var bowMaxCharge = 1.5;
  var bowCharging = false;
  var arrows = 20;
  var parryActive = false;
  var parryTimer = 0;
  var parryWindow = 0.5;
  var naginataFound = false;
  var swingAnim = 0;
  var swingAnimMax = 0.4;
  var weaponMesh = null;

  // ─── Keys / mouse ────────────────────────────────────────────────────────
  var keys = {};
  var mouseButtons = {};
  var mouseDX = 0;
  var mouseDY = 0;
  var pointerLocked = false;

  // ─── Enemies ─────────────────────────────────────────────────────────────
  var enemies = [];
  var enemyIdCounter = 0;

  // ─── Wave state ──────────────────────────────────────────────────────────
  var currentWave = 0; // 0 = none spawned yet, 1-5
  var waveSpawnTimes = [0, 180, 360, 540, 720]; // seconds (0,3,6,9,12 min)
  var waveSpawned = [false, false, false, false, false];
  var enemiesRouted = false;
  var generalAlive = false;
  var generalEnemy = null;
  var waveLabel = 'N/A';

  // ─── Inner keep capture ──────────────────────────────────────────────────
  var keepCaptureTimer = 0;
  var keepCaptured = false;
  var KEEP_CAPTURE_TIME = 30;
  var keepBounds = { x: 0, z: 0, r: 12 };

  // ─── Oil cauldrons ───────────────────────────────────────────────────────
  var oilCauldrons = [];

  // ─── Arrow slits usage ───────────────────────────────────────────────────
  var arrowSlits = [];
  var atArrowSlit = null;

  // ─── Barricade system ────────────────────────────────────────────────────
  var woodBoards = [];
  var barricades = [];
  var heldBoard = null;

  // ─── Castle bell ─────────────────────────────────────────────────────────
  var bellMesh = null;
  var bellPos = { x: 0, z: -30 };
  var bellRinging = false;
  var bellTimer = 0;
  var BELL_DURATION = 10;

  // ─── HUD ─────────────────────────────────────────────────────────────────
  var hudEl = null;
  var overlayEl = null;

  // ─── Arrow projectiles ───────────────────────────────────────────────────
  var playerArrows = [];
  var enemyArrows = [];

  // ─── Burn zones from oil ─────────────────────────────────────────────────
  var burnZones = [];

  // ─── Parry flash ─────────────────────────────────────────────────────────
  var parryFlash = 0;

  // ─── Audio ───────────────────────────────────────────────────────────────
  var audioCtx = null;

  // ─── Castle meshes (kept for cleanup) ────────────────────────────────────
  var castleMeshes = [];

  // =========================================================================
  // HELPERS
  // =========================================================================
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function dist3d(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
  function formatTime(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // =========================================================================
  // AUDIO
  // =========================================================================
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }

  function playTone(freq, dur, type, vol) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, audioCtx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function playNoise(dur, vol) {
    if (!audioCtx) return;
    var bufSize = Math.floor(audioCtx.sampleRate * dur);
    var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (vol || 0.3);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(vol || 0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  }

  function playSwoosh() { playTone(600, 0.15, 'sawtooth', 0.2); }
  function playClash() { playNoise(0.18, 0.35); }
  function playHit() { playTone(120, 0.1, 'square', 0.25); }
  function playArrow() { playTone(800, 0.08, 'sawtooth', 0.1); }
  function playBell() {
    if (!audioCtx) return;
    playTone(440, 2.0, 'sine', 0.4);
    playTone(880, 1.5, 'sine', 0.2);
  }
  function playOil() { playNoise(0.4, 0.25); }
  function playWaveAlert() {
    playTone(300, 0.4, 'square', 0.3);
    setTimeout(function () { playTone(400, 0.4, 'square', 0.3); }, 300);
  }

  // =========================================================================
  // THREE.JS MESH HELPERS
  // =========================================================================
  function makeMesh(geo, color, emissive) {
    var THREE = window.THREE;
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive) mat.emissive = new THREE.Color(emissive);
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function makeLines(geo, color) {
    var THREE = window.THREE;
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  function addToScene(m) {
    scene.add(m);
    castleMeshes.push(m);
    return m;
  }

  function box(w, h, d, color, x, y, z) {
    var THREE = window.THREE;
    var m = makeMesh(new THREE.BoxGeometry(w, h, d), color);
    m.position.set(x || 0, y || 0, z || 0);
    return addToScene(m);
  }

  function cyl(rt, rb, h, seg, color, x, y, z) {
    var THREE = window.THREE;
    var m = makeMesh(new THREE.CylinderGeometry(rt, rb, h, seg || 8), color);
    m.position.set(x || 0, y || 0, z || 0);
    return addToScene(m);
  }

  function cone(r, h, seg, color, x, y, z) {
    var THREE = window.THREE;
    var m = makeMesh(new THREE.ConeGeometry(r, h, seg || 8), color);
    m.position.set(x || 0, y || 0, z || 0);
    return addToScene(m);
  }

  function sph(r, color, x, y, z) {
    var THREE = window.THREE;
    var m = makeMesh(new THREE.SphereGeometry(r, 8, 6), color);
    m.position.set(x || 0, y || 0, z || 0);
    return addToScene(m);
  }

  // =========================================================================
  // CASTLE CONSTRUCTION
  // =========================================================================
  function buildCastle() {
    var THREE = window.THREE;

    // Ground
    box(200, 0.5, 200, 0x445533, 0, -0.25, 0);

    // ── Outer bailey courtyard ────────────────────────────────────────────
    box(120, 0.3, 120, 0x776655, 0, 0.15, 0);

    // ── Outer perimeter walls (4 sides) ──────────────────────────────────
    // North
    box(120, 5, 2, 0x776655, 0, 2.5, -60);
    // South
    box(120, 5, 2, 0x776655, 0, 2.5, 60);
    // East
    box(2, 5, 120, 0x776655, 60, 2.5, 0);
    // West
    box(2, 5, 120, 0x776655, -60, 2.5, 0);

    // ── Wall battlements (LineSegments on top of walls) ───────────────────
    buildBattlements(0, 5.5, -60, 120, 0, true);
    buildBattlements(0, 5.5, 60, 120, 0, true);
    buildBattlements(60, 5.5, 0, 0, 120, false);
    buildBattlements(-60, 5.5, 0, 0, 120, false);

    // ── Main gate (south wall gap) ────────────────────────────────────────
    box(12, 6, 3, 0x886644, 0, 3, 60);  // gate structure over gap
    box(4, 6, 3, 0x886644, -8, 3, 60);  // left pillar
    box(4, 6, 3, 0x886644, 8, 3, 60);   // right pillar

    // ── Corner guard towers ───────────────────────────────────────────────
    buildTower(-58, 0, -58);
    buildTower(58, 0, -58);
    buildTower(-58, 0, 58);
    buildTower(58, 0, 58);

    // ── Inner wall barrier ────────────────────────────────────────────────
    box(2, 5, 80, 0x776655, -41, 2.5, -10);  // west segment
    box(2, 5, 80, 0x776655, 41, 2.5, -10);   // east segment
    box(80, 5, 2, 0x776655, 0, 2.5, -50);    // north segment
    // Inner gate passage (narrower)
    box(8, 6, 3, 0x886644, 0, 3, -10);  // inner gate arch

    // ── Keep (main building) ──────────────────────────────────────────────
    // Ground floor
    box(20, 15, 20, 0x887755, 0, 7.5, -30);
    // Second floor overhang
    box(18, 5, 18, 0x998866, 0, 17.5, -30);
    // Third floor
    box(14, 4, 14, 0x887755, 0, 22, -30);
    // Keep roof tiers
    cone(12, 6, 4, 0x554433, 0, 26, -30);
    cone(9, 5, 4, 0x554433, 0, 30, -30);
    cone(5, 4, 4, 0x554433, 0, 34, -30);
    // Keep door
    box(3, 4, 0.5, 0x665533, 0, 2, -20);

    // ── Arrow slits in keep walls ─────────────────────────────────────────
    buildArrowSlits();

    // ── Garden (south of keep, inside inner wall) ─────────────────────────
    box(20, 0.3, 15, 0x556644, 0, 0.15, -10);
    // Bamboo stalks
    buildBamboo(-5, 0, -8);
    buildBamboo(-4, 0, -6);
    buildBamboo(-3, 0, -9);
    buildBamboo(5, 0, -7);
    buildBamboo(6, 0, -9);
    // Stone lanterns
    buildLantern(-8, 0, -12);
    buildLantern(8, 0, -12);
    buildLantern(0, 0, -18);

    // ── Oil cauldrons on towers ───────────────────────────────────────────
    buildOilCauldron(-58, 10.5, -58);
    buildOilCauldron(58, 10.5, -58);
    buildOilCauldron(-58, 10.5, 58);
    buildOilCauldron(58, 10.5, 58);

    // ── Castle bell ───────────────────────────────────────────────────────
    bellMesh = cyl(1.5, 1.5, 2, 8, 0x887700, 0, 5, -25);
    bellMesh.userData.isBell = true;
    castleMeshes.push(bellMesh);

    // ── Naginata pickup in keep ───────────────────────────────────────────
    buildNaginataPickup();

    // ── Wood board pickups ────────────────────────────────────────────────
    buildWoodBoards();

    // ── Lighting ──────────────────────────────────────────────────────────
    var ambient = new THREE.AmbientLight(0x443322, 0.6);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffcc88, 1.0);
    sun.position.set(30, 60, 20);
    sun.castShadow = true;
    scene.add(sun);
    // Lantern point lights
    var l1 = new THREE.PointLight(0xff8833, 1.2, 25);
    l1.position.set(-8, 2, -12);
    scene.add(l1);
    var l2 = new THREE.PointLight(0xff8833, 1.2, 25);
    l2.position.set(8, 2, -12);
    scene.add(l2);
  }

  function buildBattlements(cx, cy, cz, width, depth, isEW) {
    var THREE = window.THREE;
    var count = isEW ? 20 : 20;
    var span = isEW ? width : depth;
    var geo = new THREE.BoxGeometry(1);
    var positions = [];
    var i;
    for (i = 0; i < count; i++) {
      var t = (i / count) - 0.5;
      var bx = isEW ? cx + t * span : cx;
      var bz = isEW ? cz : cz + t * span;
      // simple merlons as small boxes
      var mb = makeMesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), 0x665544);
      mb.position.set(bx, cy + 0.75, bz);
      scene.add(mb);
      castleMeshes.push(mb);
    }
  }

  function buildTower(x, y, z) {
    // Tower body
    var t = box(4, 10, 4, 0x887766, x, y + 5, z);
    // Tower roof
    cone(3.5, 3, 4, 0x554433, x, y + 11.5, z);
    // Tower floor platform
    box(5, 0.5, 5, 0x776655, x, y + 10.5, z);
  }

  function buildArrowSlits() {
    // Arrow slits on the keep's south wall
    var slitPositions = [
      { x: -6, y: 3, z: -20 },
      { x: 6, y: 3, z: -20 },
      { x: -6, y: 10, z: -20 },
      { x: 6, y: 10, z: -20 }
    ];
    var i;
    for (i = 0; i < slitPositions.length; i++) {
      var sp = slitPositions[i];
      var slitMesh = box(0.4, 1.5, 0.3, 0x221100, sp.x, sp.y, sp.z);
      arrowSlits.push({ mesh: slitMesh, pos: sp, inUse: false });
    }
  }

  function buildBamboo(x, y, z) {
    cyl(0.15, 0.15, 4, 6, 0x335522, x, y + 2, z);
    cyl(0.15, 0.15, 4, 6, 0x446633, x, y + 5, z);
  }

  function buildLantern(x, y, z) {
    cyl(0.3, 0.5, 1.2, 6, 0x887755, x, y + 0.6, z);  // base
    cyl(0.4, 0.4, 0.8, 6, 0xccaa44, x, y + 1.4, z);  // body (glowing)
    cone(0.5, 0.4, 6, 0x887755, x, y + 2.2, z);       // cap
  }

  function buildOilCauldron(x, y, z) {
    var THREE = window.THREE;
    var cauldron = cyl(0.8, 0.6, 0.8, 8, 0x334433, x, y, z);
    // Oil surface
    var oil = cyl(0.7, 0.7, 0.1, 8, 0x221100, x, y + 0.45, z);
    oil.userData.isOil = true;
    scene.add(oil);
    castleMeshes.push(oil);
    oilCauldrons.push({
      mesh: cauldron,
      oilMesh: oil,
      pos: { x: x, y: y, z: z },
      ready: true,
      cooldown: 0
    });
  }

  function buildNaginataPickup() {
    var THREE = window.THREE;
    var geo = new THREE.BoxGeometry(0.2, 3, 0.2);
    var nag = makeMesh(geo, 0x887744);
    nag.position.set(-3, 1.5, -28);
    nag.rotation.z = Math.PI / 4;
    nag.userData.isNaginata = true;
    scene.add(nag);
    castleMeshes.push(nag);
  }

  function buildWoodBoards() {
    var positions = [
      { x: -10, z: 5 },
      { x: 10, z: 5 },
      { x: -15, z: -5 },
      { x: 15, z: -5 },
      { x: 0, z: -18 }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var p = positions[i];
      var THREE = window.THREE;
      var b = makeMesh(new THREE.BoxGeometry(2, 0.2, 0.8), 0x886644);
      b.position.set(p.x, 0.5, p.z);
      b.userData.isWoodBoard = true;
      scene.add(b);
      castleMeshes.push(b);
      woodBoards.push({ mesh: b, pos: { x: p.x, z: p.z }, picked: false });
    }
  }

  // =========================================================================
  // PLAYER MESH
  // =========================================================================
  function buildPlayer() {
    var THREE = window.THREE;
    playerMesh = makeMesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), 0x223344);
    playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    scene.add(playerMesh);

    // Weapon mesh (attached to camera/view)
    buildWeaponMesh();
  }

  function buildWeaponMesh() {
    var THREE = window.THREE;
    if (weaponMesh) {
      camera.remove(weaponMesh);
      weaponMesh = null;
    }

    if (currentWeapon === WEAPON_KATANA) {
      // Katana: LineSegments blade
      var geo = new THREE.BufferGeometry();
      var pts = new Float32Array([
        0, 0, 0,
        0, 0, -1.2,
        0, 0, -1.2,
        0.05, 0, -1.2,
        0.05, 0, -1.2,
        0.05, 0, -0.2,
        0.05, 0, -0.2,
        0, 0, 0
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      weaponMesh = makeLines(geo, 0xccccaa);
    } else if (currentWeapon === WEAPON_BOW) {
      // Bow: curved box
      var geo2 = new THREE.BoxGeometry(0.1, 1.0, 0.1);
      weaponMesh = makeMesh(geo2, 0x886633);
    } else if (currentWeapon === WEAPON_NAGINATA) {
      // Naginata: longer LineSegments
      var geo3 = new THREE.BufferGeometry();
      var pts3 = new Float32Array([
        0, 0, 0,
        0, 0, -2.0,
        0, 0, -2.0,
        0.08, 0, -2.0,
        0.08, 0, -2.0,
        0.08, 0, -0.3,
        0.08, 0, -0.3,
        0, 0, 0
      ]);
      geo3.setAttribute('position', new THREE.BufferAttribute(pts3, 3));
      weaponMesh = makeLines(geo3, 0xccbbaa);
    }

    if (weaponMesh) {
      weaponMesh.position.set(0.35, -0.3, -0.5);
      camera.add(weaponMesh);
    }
  }

  // =========================================================================
  // ENEMY FACTORY
  // =========================================================================
  function spawnEnemy(type, spawnX, spawnZ) {
    var THREE = window.THREE;
    var cfg = getEnemyConfig(type);
    var mesh = makeMesh(new THREE.BoxGeometry(0.8, cfg.height, 0.6), cfg.color);
    mesh.position.set(spawnX, cfg.height / 2, spawnZ);
    scene.add(mesh);

    // Head
    var head = makeMesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), cfg.color);
    head.position.set(0, cfg.height / 2 + 0.3, 0);
    mesh.add(head);

    // Weapon indicator
    var wepGeo = new THREE.BufferGeometry();
    var wpts = new Float32Array([0, 0, 0, 0.8, 0, -0.5]);
    wepGeo.setAttribute('position', new THREE.BufferAttribute(wpts, 3));
    var wep = makeLines(wepGeo, 0x888866);
    wep.position.set(0.3, 0.2, 0);
    mesh.add(wep);

    var id = ++enemyIdCounter;
    var enemy = {
      id: id,
      type: type,
      mesh: mesh,
      pos: { x: spawnX, y: cfg.height / 2, z: spawnZ },
      hp: cfg.hp,
      maxHp: cfg.hp,
      speed: cfg.speed,
      damage: cfg.damage,
      attackRate: cfg.attackRate,
      attackTimer: Math.random() * cfg.attackRate,
      height: cfg.height,
      color: cfg.color,
      state: 'approach', // approach, attack, flee, dead
      isArcher: cfg.isArcher || false,
      isGeneral: cfg.isGeneral || false,
      canParry: cfg.canParry || false,
      burnTimer: 0,
      hitFlash: 0,
      bowCooldown: 0
    };

    enemies.push(enemy);
    if (type === 'general') {
      generalEnemy = enemy;
      generalAlive = true;
    }
    return enemy;
  }

  function getEnemyConfig(type) {
    if (type === 'footsoldier') {
      return { hp: 70, height: 1.7, speed: 2.5, damage: 18, attackRate: 1.8, color: 0x445544, isArcher: false };
    } else if (type === 'archer') {
      return { hp: 55, height: 1.6, speed: 1.8, damage: 15, attackRate: 2.5, color: 0x554433, isArcher: true };
    } else if (type === 'warrior') {
      return { hp: 120, height: 1.8, speed: 3.2, damage: 25, attackRate: 1.2, color: 0x443322, isArcher: false };
    } else if (type === 'elite') {
      return { hp: 180, height: 1.9, speed: 3.5, damage: 35, attackRate: 1.0, color: 0x332211, isArcher: false, canParry: true };
    } else if (type === 'general') {
      return { hp: 600, height: 2.1, speed: 2.8, damage: 50, attackRate: 0.8, color: 0x221100, isArcher: false };
    }
    return { hp: 70, height: 1.7, speed: 2.5, damage: 18, attackRate: 1.8, color: 0x445544 };
  }

  function getSpawnPos(index) {
    // Spawn outside south wall
    var angle = (index / 16) * Math.PI * 2;
    var r = 65 + randRange(0, 15);
    return {
      x: Math.cos(angle) * r,
      z: 65 + Math.sin(angle) * 10
    };
  }

  // =========================================================================
  // WAVE SPAWNING
  // =========================================================================
  function spawnWave(waveIndex) {
    var i, sp;
    waveLabel = waveIndex + '/5';
    if (waveIndex === 1) {
      // 15 footsoldiers
      for (i = 0; i < 15; i++) {
        sp = getSpawnPos(i);
        spawnEnemy('footsoldier', sp.x, sp.z);
      }
    } else if (waveIndex === 2) {
      // 15 footsoldiers + 5 archers
      for (i = 0; i < 15; i++) {
        sp = getSpawnPos(i);
        spawnEnemy('footsoldier', sp.x, sp.z);
      }
      for (i = 0; i < 5; i++) {
        sp = getSpawnPos(i + 15);
        spawnEnemy('archer', sp.x, sp.z);
      }
    } else if (waveIndex === 3) {
      // 12 warriors
      for (i = 0; i < 12; i++) {
        sp = getSpawnPos(i);
        spawnEnemy('warrior', sp.x, sp.z);
      }
    } else if (waveIndex === 4) {
      // 10 elite
      for (i = 0; i < 10; i++) {
        sp = getSpawnPos(i);
        spawnEnemy('elite', sp.x, sp.z);
      }
    } else if (waveIndex === 5) {
      // 8 elite + general
      for (i = 0; i < 8; i++) {
        sp = getSpawnPos(i);
        spawnEnemy('elite', sp.x, sp.z);
      }
      spawnEnemy('general', 0, 80);
    }
    currentWave = waveIndex;
    playWaveAlert();
    showWaveAlert(waveIndex);
  }

  // =========================================================================
  // COMBAT
  // =========================================================================
  function playerMeleeAttack() {
    if (attackCooldown > 0) return;
    var cooldown = (currentWeapon === WEAPON_NAGINATA) ? naginataCooldown : katanaCooldown;
    var dmg = (currentWeapon === WEAPON_NAGINATA) ? 45 : 35;
    var reach = (currentWeapon === WEAPON_NAGINATA) ? 3.5 : 2.0;
    attackCooldown = cooldown;
    swingAnim = swingAnimMax;
    playSwoosh();

    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.state === 'dead') continue;
      var d = dist2d(playerPos, e.pos);
      if (d < reach) {
        // Check if elite tries to parry
        if (e.canParry && Math.random() < 0.3) {
          // Enemy parries — deflect
          playClash();
          e.hitFlash = 0.2;
        } else {
          damageEnemy(e, dmg);
        }
      }
    }
  }

  function playerBowRelease() {
    if (arrows <= 0) return;
    var charge = clamp(bowChargeTime / bowMaxCharge, 0, 1);
    var dmg = Math.floor(20 + charge * 40);
    arrows--;
    bowChargeTime = 0;
    bowCharging = false;
    firePlayerArrow(dmg);
    playArrow();
  }

  function firePlayerArrow(dmg) {
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5);
    var mesh = makeMesh(geo, 0x886644);
    // Direction from camera
    var dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    mesh.position.set(
      camera.position.x + dir.x,
      camera.position.y + dir.y,
      camera.position.z + dir.z
    );
    scene.add(mesh);
    playerArrows.push({
      mesh: mesh,
      pos: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      vel: { x: dir.x * 30, y: dir.y * 30, z: dir.z * 30 },
      dmg: dmg,
      life: 3.0
    });
  }

  function fireEnemyArrow(enemy) {
    var THREE = window.THREE;
    var geo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5);
    var mesh = makeMesh(geo, 0x665533);
    var ep = enemy.pos;
    var pp = playerPos;
    var dx = pp.x - ep.x, dy = 0, dz = pp.z - ep.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.01) return;
    dx /= len; dz /= len;
    mesh.position.set(ep.x, ep.y, ep.z);
    scene.add(mesh);
    enemyArrows.push({
      mesh: mesh,
      pos: { x: ep.x, y: ep.y, z: ep.z },
      vel: { x: dx * 18, y: 0.5, z: dz * 18 },
      dmg: enemy.damage,
      life: 4.0
    });
  }

  function damageEnemy(enemy, dmg) {
    enemy.hp -= dmg;
    enemy.hitFlash = 0.25;
    playHit();
    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    enemy.state = 'dead';
    enemy.hp = 0;
    if (enemy.mesh) {
      enemy.mesh.rotation.z = Math.PI / 2;
      enemy.mesh.position.y = enemy.height / 2 * 0.3;
    }
    if (enemy.isGeneral) {
      generalAlive = false;
      // Rout all remaining enemies
      routAllEnemies();
      if (!gameOver && !gameWon) {
        gameWon = true;
        gameOver = true;
        gameOverReason = 'GENERAL DEFEATED — SAMURAI ROUT! YOU WIN!';
        showOverlay(true);
      }
    }
  }

  function routAllEnemies() {
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].state !== 'dead') {
        enemies[i].state = 'flee';
      }
    }
    enemiesRouted = true;
  }

  function damagePlayer(dmg) {
    if (!playerAlive) return;
    playerHP -= dmg;
    parryFlash = 0.15;
    if (playerHP <= 0) {
      playerHP = 0;
      playerAlive = false;
      gameOver = true;
      gameWon = false;
      gameOverReason = 'YOU HAVE FALLEN. THE CASTLE IS LOST.';
      showOverlay(false);
    }
  }

  // =========================================================================
  // OIL CAULDRON
  // =========================================================================
  function pourOilCauldron(cauldron) {
    if (!cauldron.ready) return;
    cauldron.ready = false;
    cauldron.cooldown = 60;
    playOil();
    // Create burn zone below cauldron
    burnZones.push({
      pos: { x: cauldron.pos.x, z: cauldron.pos.z },
      radius: 8,
      timer: 15,
      dmgTick: 0,
      dmgInterval: 0.5
    });
    // Flash oil mesh
    if (cauldron.oilMesh && cauldron.oilMesh.material) {
      cauldron.oilMesh.material.color.setHex(0xff4400);
    }
  }

  // =========================================================================
  // ENEMY AI UPDATE
  // =========================================================================
  function updateEnemies(dt) {
    var i, e, d, dx, dz, len, attackRange;
    for (i = enemies.length - 1; i >= 0; i--) {
      e = enemies[i];
      if (e.state === 'dead') continue;

      // Burn damage
      if (e.burnTimer > 0) {
        e.burnTimer -= dt;
        e.hp -= dt * 15;
        e.hitFlash = 0.1;
        if (e.hp <= 0) { killEnemy(e); continue; }
      }

      // Apply burn zones
      var bi;
      for (bi = 0; bi < burnZones.length; bi++) {
        var bz = burnZones[bi];
        var bd = dist2d(e.pos, { x: bz.pos.x, z: bz.pos.z });
        if (bd < bz.radius && bz.timer > 0) {
          e.burnTimer = 1.0;
        }
      }

      // Hit flash fade
      if (e.hitFlash > 0) {
        e.hitFlash -= dt;
        if (e.mesh && e.mesh.material) {
          e.mesh.material.color.setHex(e.hitFlash > 0 ? 0xffffff : e.color);
        }
      } else {
        if (e.mesh && e.mesh.material) {
          e.mesh.material.color.setHex(e.color);
        }
      }

      // State machine
      if (e.state === 'flee') {
        // Run away
        dx = e.pos.x - playerPos.x;
        dz = e.pos.z - playerPos.z;
        len = Math.sqrt(dx * dx + dz * dz) || 1;
        e.pos.x += (dx / len) * e.speed * dt;
        e.pos.z += (dz / len) * e.speed * dt;
        e.mesh.position.set(e.pos.x, e.height / 2, e.pos.z);
        continue;
      }

      // Bell attraction override
      if (bellRinging) {
        dx = bellPos.x - e.pos.x;
        dz = bellPos.z - e.pos.z;
        len = Math.sqrt(dx * dx + dz * dz) || 1;
        if (len > 2) {
          e.pos.x += (dx / len) * e.speed * dt;
          e.pos.z += (dz / len) * e.speed * dt;
          e.mesh.position.set(e.pos.x, e.height / 2, e.pos.z);
          continue;
        }
      }

      d = dist2d(e.pos, playerPos);

      if (e.isArcher) {
        // Archers stay at distance and fire
        attackRange = 30;
        var minRange = 15;
        if (d > attackRange) {
          // Approach
          dx = playerPos.x - e.pos.x;
          dz = playerPos.z - e.pos.z;
          len = Math.sqrt(dx * dx + dz * dz) || 1;
          e.pos.x += (dx / len) * e.speed * dt;
          e.pos.z += (dz / len) * e.speed * dt;
        } else if (d < minRange) {
          // Retreat
          dx = e.pos.x - playerPos.x;
          dz = e.pos.z - playerPos.z;
          len = Math.sqrt(dx * dx + dz * dz) || 1;
          e.pos.x += (dx / len) * e.speed * dt;
          e.pos.z += (dz / len) * e.speed * dt;
        }
        e.mesh.position.set(e.pos.x, e.height / 2, e.pos.z);

        // Fire arrow
        e.bowCooldown -= dt;
        if (e.bowCooldown <= 0 && d < attackRange) {
          e.bowCooldown = e.attackRate;
          fireEnemyArrow(e);
        }
        continue;
      }

      // Melee enemies
      attackRange = (e.isGeneral) ? 2.5 : 2.0;
      if (d > attackRange) {
        // Move toward player
        dx = playerPos.x - e.pos.x;
        dz = playerPos.z - e.pos.z;
        len = Math.sqrt(dx * dx + dz * dz) || 1;
        e.pos.x += (dx / len) * e.speed * dt;
        e.pos.z += (dz / len) * e.speed * dt;
        e.mesh.position.set(e.pos.x, e.height / 2, e.pos.z);
        e.state = 'approach';
      } else {
        // Attack
        e.state = 'attack';
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackRate;
          // Check parry
          if (parryActive) {
            playClash();
            parryFlash = 0.3;
            // Deflect — no damage, stagger enemy
            e.attackTimer += 1.0;
          } else {
            damagePlayer(e.damage);
          }
        }
      }
    }
  }

  // =========================================================================
  // ARROW PROJECTILE UPDATE
  // =========================================================================
  function updateArrows(dt) {
    var i, a, d, ei, e;

    // Player arrows
    for (i = playerArrows.length - 1; i >= 0; i--) {
      a = playerArrows[i];
      a.life -= dt;
      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt - 4.9 * dt * dt;
      a.pos.z += a.vel.z * dt;
      a.vel.y -= 9.8 * dt;
      a.mesh.position.set(a.pos.x, a.pos.y, a.pos.z);

      var hit = false;
      for (ei = 0; ei < enemies.length; ei++) {
        e = enemies[ei];
        if (e.state === 'dead') continue;
        d = dist3d(a.pos, e.pos);
        if (d < 1.0) {
          damageEnemy(e, a.dmg);
          hit = true;
          break;
        }
      }

      if (hit || a.life <= 0 || a.pos.y < -2) {
        scene.remove(a.mesh);
        playerArrows.splice(i, 1);
      }
    }

    // Enemy arrows
    for (i = enemyArrows.length - 1; i >= 0; i--) {
      a = enemyArrows[i];
      a.life -= dt;
      a.pos.x += a.vel.x * dt;
      a.pos.y += a.vel.y * dt;
      a.pos.z += a.vel.z * dt;
      a.vel.y -= 4.9 * dt;
      a.mesh.position.set(a.pos.x, a.pos.y, a.pos.z);

      d = dist3d(a.pos, playerPos);
      var hitPlayer = false;
      if (d < 1.2) {
        if (!parryActive) {
          damagePlayer(a.dmg);
        } else {
          playClash();
        }
        hitPlayer = true;
      }

      if (hitPlayer || a.life <= 0 || a.pos.y < -2) {
        scene.remove(a.mesh);
        enemyArrows.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // BURN ZONE UPDATE
  // =========================================================================
  function updateBurnZones(dt) {
    var i;
    for (i = burnZones.length - 1; i >= 0; i--) {
      var bz = burnZones[i];
      bz.timer -= dt;
      if (bz.timer <= 0) {
        burnZones.splice(i, 1);
      }
    }
  }

  // =========================================================================
  // OIL CAULDRON UPDATE
  // =========================================================================
  function updateCauldrons(dt) {
    var i;
    for (i = 0; i < oilCauldrons.length; i++) {
      var c = oilCauldrons[i];
      if (!c.ready) {
        c.cooldown -= dt;
        if (c.cooldown <= 0) {
          c.ready = true;
          if (c.oilMesh && c.oilMesh.material) {
            c.oilMesh.material.color.setHex(0x221100);
          }
        }
      }
    }
  }

  // =========================================================================
  // INNER KEEP CAPTURE CHECK
  // =========================================================================
  function updateKeepCapture(dt) {
    if (keepCaptured) return;
    var inKeep = 0;
    var i;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.state === 'dead') continue;
      var d = dist2d(e.pos, { x: keepBounds.x, z: keepBounds.z });
      if (d < keepBounds.r) inKeep++;
    }

    if (inKeep > 0) {
      // Check if player is also in keep
      var playerInKeep = dist2d(playerPos, { x: keepBounds.x, z: keepBounds.z }) < keepBounds.r;
      if (!playerInKeep) {
        keepCaptureTimer += dt;
        if (keepCaptureTimer >= KEEP_CAPTURE_TIME) {
          keepCaptured = true;
          if (!gameOver) {
            gameOver = true;
            gameWon = false;
            gameOverReason = 'INNER KEEP CAPTURED — CASTLE FALLS!';
            showOverlay(false);
          }
        }
      } else {
        keepCaptureTimer = Math.max(0, keepCaptureTimer - dt);
      }
    } else {
      keepCaptureTimer = Math.max(0, keepCaptureTimer - dt * 2);
    }
  }

  // =========================================================================
  // BELL UPDATE
  // =========================================================================
  function updateBell(dt) {
    if (bellRinging) {
      bellTimer -= dt;
      if (bellTimer <= 0) {
        bellRinging = false;
        bellTimer = 0;
      }
    }
  }

  // =========================================================================
  // PLAYER MOVEMENT & CAMERA
  // =========================================================================
  function updatePlayer(dt) {
    if (!playerAlive || gameOver) return;

    // Mouse look
    if (pointerLocked) {
      playerYaw -= mouseDX * 0.002;
      playerPitch -= mouseDY * 0.002;
      playerPitch = clamp(playerPitch, -Math.PI / 3, Math.PI / 3);
      mouseDX = 0;
      mouseDY = 0;
    }

    // Movement
    var speed = 7;
    var fw = 0, rt = 0;
    if (keys['KeyW'] || keys['ArrowUp']) fw = 1;
    if (keys['KeyS'] || keys['ArrowDown']) fw = -1;
    if (keys['KeyA'] || keys['ArrowLeft']) rt = -1;
    if (keys['KeyD'] || keys['ArrowRight']) rt = 1;

    var cosY = Math.cos(playerYaw);
    var sinY = Math.sin(playerYaw);
    var mx = (sinY * fw + cosY * rt) * speed * dt;
    var mz = (-cosY * fw + sinY * rt) * speed * dt;

    playerPos.x += mx;
    playerPos.z += mz;

    // Simple boundary clamp
    playerPos.x = clamp(playerPos.x, -58, 58);
    playerPos.z = clamp(playerPos.z, -58, 62);

    // Camera follows player
    camera.position.set(playerPos.x, playerPos.y + 0.9, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;

    // Player mesh
    if (playerMesh) {
      playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
      playerMesh.rotation.y = playerYaw;
    }

    // Attack cooldown
    if (attackCooldown > 0) attackCooldown -= dt;
    if (swingAnim > 0) {
      swingAnim -= dt;
      if (weaponMesh) {
        weaponMesh.rotation.x = -Math.PI / 3 * (swingAnim / swingAnimMax);
      }
    } else {
      if (weaponMesh) weaponMesh.rotation.x = 0;
    }

    // Parry timer
    if (parryActive) {
      parryTimer -= dt;
      if (parryTimer <= 0) {
        parryActive = false;
        parryTimer = 0;
      }
    }

    // Bow charge
    if (bowCharging) {
      bowChargeTime += dt;
    }

    // Parry flash
    if (parryFlash > 0) parryFlash -= dt;

    // Check E interactions
    updateInteractions(dt);
  }

  // =========================================================================
  // INTERACTIONS (E key)
  // =========================================================================
  function updateInteractions(dt) {
    // Naginata pickup
    var i;
    if (!naginataFound) {
      for (i = 0; i < castleMeshes.length; i++) {
        var m = castleMeshes[i];
        if (m.userData && m.userData.isNaginata) {
          var nagPos = { x: m.position.x, z: m.position.z };
          if (dist2d(playerPos, nagPos) < 2) {
            if (keys['KeyE']) {
              naginataFound = true;
              m.visible = false;
              currentWeapon = WEAPON_NAGINATA;
              buildWeaponMesh();
              showMessage('NAGINATA ACQUIRED');
            }
          }
          break;
        }
      }
    }

    // Wood board pickup
    if (!heldBoard) {
      for (i = 0; i < woodBoards.length; i++) {
        var wb = woodBoards[i];
        if (wb.picked) continue;
        if (dist2d(playerPos, wb.pos) < 2.5) {
          if (keys['KeyE']) {
            wb.picked = true;
            wb.mesh.visible = false;
            heldBoard = wb;
            showMessage('BOARD PICKED UP — PRESS F TO PLACE BARRICADE');
          }
          break;
        }
      }
    } else {
      // Place board
      if (keys['KeyF']) {
        placeBarricade();
      }
    }

    // Bell
    if (bellMesh && !bellRinging) {
      var bd = dist2d(playerPos, { x: bellMesh.position.x, z: bellMesh.position.z });
      if (bd < 3 && keys['KeyE']) {
        bellRinging = true;
        bellTimer = BELL_DURATION;
        playBell();
        showMessage('BELL RUNG — SAMURAI DRAWN TO BELL!');
      }
    }

    // Arrow slits
    atArrowSlit = null;
    for (i = 0; i < arrowSlits.length; i++) {
      var slit = arrowSlits[i];
      var sd = dist3d(playerPos, slit.pos);
      if (sd < 2.5) {
        atArrowSlit = slit;
        if (keys['KeyE'] && currentWeapon === WEAPON_BOW && arrows > 0) {
          // Fire through slit (fire forward)
          firePlayerArrow(30);
          arrows--;
          playArrow();
          showMessage('ARROW FIRED THROUGH SLIT');
        }
        break;
      }
    }

    // Oil cauldrons
    for (i = 0; i < oilCauldrons.length; i++) {
      var oc = oilCauldrons[i];
      if (!oc.ready) continue;
      var od = dist3d(playerPos, oc.pos);
      if (od < 4 && keys['KeyE']) {
        pourOilCauldron(oc);
        showMessage('OIL POURED — ENEMIES BURN!');
      }
    }
  }

  function placeBarricade() {
    if (!heldBoard) return;
    var THREE = window.THREE;
    var b = makeMesh(new THREE.BoxGeometry(2, 1.5, 0.3), 0x886644);
    var px = playerPos.x + Math.sin(playerYaw) * 2;
    var pz = playerPos.z - Math.cos(playerYaw) * 2;
    b.position.set(px, 0.75, pz);
    b.rotation.y = playerYaw;
    scene.add(b);
    castleMeshes.push(b);
    barricades.push({ mesh: b, pos: { x: px, z: pz } });
    heldBoard = null;
    showMessage('BARRICADE PLACED');
  }

  // =========================================================================
  // WEAPON SWITCH
  // =========================================================================
  function switchWeapon(dir) {
    var weapons = [WEAPON_KATANA, WEAPON_BOW];
    if (naginataFound) weapons.push(WEAPON_NAGINATA);
    var idx = weapons.indexOf(currentWeapon);
    idx = (idx + dir + weapons.length) % weapons.length;
    currentWeapon = weapons[idx];
    buildWeaponMesh();
    showMessage('WEAPON: ' + currentWeapon.toUpperCase());
  }

  // =========================================================================
  // WAVE TIMING
  // =========================================================================
  function updateWaves(dt) {
    var i;
    for (i = 0; i < waveSpawnTimes.length; i++) {
      if (!waveSpawned[i] && gameTime >= waveSpawnTimes[i]) {
        waveSpawned[i] = true;
        spawnWave(i + 1);
      }
    }
  }

  // =========================================================================
  // WIN CONDITION CHECK
  // =========================================================================
  function updateWinCondition(dt) {
    if (gameOver) return;
    // 15 minute timer
    if (gameTime >= WIN_TIME && !gameWon) {
      gameWon = true;
      gameOver = true;
      gameOverReason = 'REINFORCEMENTS ARRIVE — YOU HELD THE CASTLE! VICTORY!';
      showOverlay(true);
    }
  }

  // =========================================================================
  // HUD
  // =========================================================================
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'samurai-siege-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'padding:10px 16px',
      'font-family:monospace',
      'font-size:13px',
      'color:#ffdd88',
      'background:rgba(0,0,0,0.55)',
      'z-index:9100',
      'white-space:nowrap',
      'letter-spacing:1px',
      'user-select:none'
    ].join(';');
    document.body.appendChild(hudEl);

    overlayEl = document.createElement('div');
    overlayEl.id = 'samurai-siege-overlay';
    overlayEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'bottom:0',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'background:rgba(0,0,0,0.75)',
      'z-index:9200',
      'color:#ffdd88',
      'font-family:monospace',
      'font-size:22px',
      'text-align:center'
    ].join(';');
    document.body.appendChild(overlayEl);

    // Message popup
    var msgEl = document.createElement('div');
    msgEl.id = 'samurai-siege-msg';
    msgEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'font-family:monospace',
      'font-size:15px',
      'color:#ffcc44',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 16px',
      'border-radius:4px',
      'z-index:9150',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(msgEl);

    // Crosshair
    var xhair = document.createElement('div');
    xhair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px',
      'height:16px',
      'z-index:9150',
      'pointer-events:none'
    ].join(';');
    xhair.innerHTML = '<svg width="16" height="16"><line x1="8" y1="0" x2="8" y2="16" stroke="#ffcc44" stroke-width="1.5"/><line x1="0" y1="8" x2="16" y2="8" stroke="#ffcc44" stroke-width="1.5"/></svg>';
    document.body.appendChild(xhair);

    // Health bar
    var hpBar = document.createElement('div');
    hpBar.id = 'samurai-siege-hpbar';
    hpBar.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:16px',
      'width:200px',
      'z-index:9150',
      'font-family:monospace',
      'font-size:12px',
      'color:#ffdd88'
    ].join(';');
    document.body.appendChild(hpBar);

    // Keep capture bar
    var capBar = document.createElement('div');
    capBar.id = 'samurai-siege-capbar';
    capBar.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:16px',
      'width:200px',
      'z-index:9150',
      'font-family:monospace',
      'font-size:12px',
      'color:#ff4444',
      'text-align:right'
    ].join(';');
    document.body.appendChild(capBar);

    // Controls help
    var help = document.createElement('div');
    help.style.cssText = [
      'position:fixed',
      'bottom:50px',
      'right:16px',
      'font-family:monospace',
      'font-size:11px',
      'color:#886644',
      'z-index:9150',
      'text-align:right',
      'line-height:1.6'
    ].join(';');
    help.innerHTML = 'WASD:Move | Mouse:Look<br>LMB:Attack/Charge Bow | RMB:Parry<br>Q/R:Switch Weapon | E:Interact<br>F:Place Barricade | ESC:Quit';
    document.body.appendChild(help);
  }

  function updateHUD() {
    if (!hudEl) return;

    var generalStatus = 'N/A';
    if (currentWave === 5) {
      generalStatus = generalAlive ? 'ALIVE' : 'DEFEATED';
    }

    var keepStatus = keepCaptured ? 'BREACHED' : (keepCaptureTimer > 5 ? 'DANGER' : 'HOLD');
    var remaining = 0;
    var ei;
    for (ei = 0; ei < enemies.length; ei++) {
      if (enemies[ei].state !== 'dead') remaining++;
    }

    var timeLeft = Math.max(0, WIN_TIME - gameTime);

    hudEl.textContent = 'SAMURAI SIEGE  ' +
      '[WAVE: ' + (currentWave || '-') + '/5]  ' +
      '[DEFENDERS: ' + keepStatus + ']  ' +
      '[GENERAL: ' + generalStatus + ']  ' +
      '[TIMER: ' + formatTime(timeLeft) + ']  ' +
      '[ENEMY: ' + remaining + ']  ' +
      '[ARROWS: ' + arrows + ']  ' +
      '[WPN: ' + currentWeapon.toUpperCase() + ']';

    // Health bar
    var hpBar = document.getElementById('samurai-siege-hpbar');
    if (hpBar) {
      var pct = Math.max(0, (playerHP / playerMaxHP) * 100);
      var barFill = Math.round(pct / 5);
      var barStr = '';
      var bi;
      for (bi = 0; bi < 20; bi++) barStr += (bi < barFill ? '|' : ' ');
      var hpColor = pct > 50 ? '#44ff44' : pct > 25 ? '#ffcc00' : '#ff4444';
      hpBar.innerHTML = '<span style="color:' + hpColor + '">HP [' + barStr + '] ' + Math.round(playerHP) + '</span>';
      if (parryFlash > 0) {
        hpBar.style.background = 'rgba(255,200,0,0.3)';
      } else {
        hpBar.style.background = 'transparent';
      }
    }

    // Keep capture bar
    var capBar = document.getElementById('samurai-siege-capbar');
    if (capBar) {
      if (keepCaptureTimer > 0) {
        var capPct = keepCaptureTimer / KEEP_CAPTURE_TIME;
        capBar.innerHTML = 'KEEP BREACH [' + Math.round(capPct * 100) + '%]';
      } else {
        capBar.textContent = '';
      }
    }

    // Bow charge
    if (bowCharging && currentWeapon === WEAPON_BOW) {
      var charge = Math.round(clamp(bowChargeTime / bowMaxCharge, 0, 1) * 100);
      hudEl.textContent += '  [CHARGE: ' + charge + '%]';
    }
  }

  var msgTimeout = null;
  function showMessage(txt) {
    var msgEl = document.getElementById('samurai-siege-msg');
    if (!msgEl) return;
    msgEl.textContent = txt;
    msgEl.style.opacity = '1';
    if (msgTimeout) clearTimeout(msgTimeout);
    msgTimeout = setTimeout(function () {
      if (msgEl) msgEl.style.opacity = '0';
    }, 2500);
  }

  var waveAlertEl = null;
  function showWaveAlert(waveNum) {
    if (!waveAlertEl) {
      waveAlertEl = document.createElement('div');
      waveAlertEl.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'font-family:monospace',
        'font-size:32px',
        'color:#ff4422',
        'text-shadow:0 0 20px #ff2200',
        'z-index:9300',
        'pointer-events:none',
        'text-align:center'
      ].join(';');
      document.body.appendChild(waveAlertEl);
    }
    var labels = ['', 'WAVE 1 — FOOTSOLDIERS ADVANCE!', 'WAVE 2 — ARCHERS JOIN THE ASSAULT!',
      'WAVE 3 — WARRIORS CHARGE!', 'WAVE 4 — ELITE SAMURAI!', 'WAVE 5 — THE GENERAL ARRIVES!'];
    waveAlertEl.textContent = labels[waveNum] || ('WAVE ' + waveNum);
    waveAlertEl.style.opacity = '1';
    setTimeout(function () {
      if (waveAlertEl) waveAlertEl.style.opacity = '0';
    }, 3000);
  }

  function showOverlay(won) {
    if (!overlayEl) return;
    overlayEl.style.display = 'flex';
    var color = won ? '#88ff44' : '#ff4422';
    overlayEl.innerHTML =
      '<div style="font-size:36px;color:' + color + ';margin-bottom:20px;">' + (won ? '— VICTORY —' : '— DEFEAT —') + '</div>' +
      '<div style="font-size:18px;margin-bottom:30px;max-width:600px;">' + gameOverReason + '</div>' +
      '<div style="font-size:14px;color:#886644;">Press R to restart or ESC to quit</div>';
  }

  // =========================================================================
  // INPUT HANDLERS
  // =========================================================================
  function onKeyDown(e) {
    keys[e.code] = true;

    // S+S activation detection
    if (!active) {
      if (e.code === 'KeyS') {
        var now = Date.now();
        if (s1DownAt === 0) {
          s1DownAt = now;
        } else {
          if (now - s1DownAt < ACTIVATION_WINDOW) {
            activate();
          }
          s1DownAt = now;
        }
      }
      return;
    }

    if (!playerAlive && e.code === 'KeyR') {
      reset();
      return;
    }
    if (gameOver && e.code === 'KeyR') {
      reset();
      return;
    }

    if (e.code === 'Escape') {
      deactivate();
      return;
    }

    // Weapon switch
    if (e.code === 'KeyQ') switchWeapon(-1);
    if (e.code === 'KeyR') switchWeapon(1);

    // Parry (also RMB)
    if (e.code === 'KeyV') {
      parryActive = true;
      parryTimer = parryWindow;
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'KeyE') {
      // released E
    }
  }

  function onMouseDown(e) {
    if (!active || gameOver) return;
    mouseButtons[e.button] = true;

    if (e.button === 0) {
      // LMB
      if (currentWeapon === WEAPON_BOW) {
        bowCharging = true;
        bowChargeTime = 0;
      } else {
        playerMeleeAttack();
      }
    }
    if (e.button === 2) {
      // RMB — parry
      parryActive = true;
      parryTimer = parryWindow;
    }
  }

  function onMouseUp(e) {
    mouseButtons[e.button] = false;
    if (!active || gameOver) return;
    if (e.button === 0 && currentWeapon === WEAPON_BOW && bowCharging) {
      playerBowRelease();
    }
  }

  function onMouseMove(e) {
    if (!active || !pointerLocked) return;
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  }

  function onWheel(e) {
    if (!active) return;
    switchWeapon(e.deltaY > 0 ? 1 : -1);
  }

  function onPointerLockChange() {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  }

  function onResize() {
    if (!active) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onContextMenu(e) {
    if (active) e.preventDefault();
  }

  // =========================================================================
  // ACTIVATION / DEACTIVATION
  // =========================================================================
  function activate() {
    if (active) return;
    active = true;
    initGame();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    cleanup();
  }

  function cleanup() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (hudEl && hudEl.parentNode) { hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (overlayEl && overlayEl.parentNode) { overlayEl.parentNode.removeChild(overlayEl); overlayEl = null; }
    if (waveAlertEl && waveAlertEl.parentNode) { waveAlertEl.parentNode.removeChild(waveAlertEl); waveAlertEl = null; }
    var msgEl = document.getElementById('samurai-siege-msg');
    if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    var hpBar = document.getElementById('samurai-siege-hpbar');
    if (hpBar && hpBar.parentNode) hpBar.parentNode.removeChild(hpBar);
    var capBar = document.getElementById('samurai-siege-capbar');
    if (capBar && capBar.parentNode) capBar.parentNode.removeChild(capBar);
    // Remove all crosshair/help elements added
    document.exitPointerLock && document.exitPointerLock();
    if (renderer) renderer.dispose();
  }

  // =========================================================================
  // INIT GAME
  // =========================================================================
  function initGame() {
    var THREE = window.THREE;
    if (!THREE) { console.error('SamuraiSiege: THREE.js not found'); active = false; return; }

    // Reset state
    gameTime = 0;
    gameOver = false;
    gameWon = false;
    gameOverReason = '';
    playerHP = playerMaxHP;
    playerAlive = true;
    playerPos = { x: 0, y: 1, z: 10 };
    playerYaw = Math.PI; // face north
    playerPitch = 0;
    currentWeapon = WEAPON_KATANA;
    attackCooldown = 0;
    arrows = 20;
    parryActive = false;
    enemies = [];
    playerArrows = [];
    enemyArrows = [];
    burnZones = [];
    oilCauldrons = [];
    arrowSlits = [];
    woodBoards = [];
    barricades = [];
    heldBoard = null;
    bellRinging = false;
    bellTimer = 0;
    bellMesh = null;
    keepCaptureTimer = 0;
    keepCaptured = false;
    currentWave = 0;
    waveSpawned = [false, false, false, false, false];
    generalAlive = false;
    generalEnemy = null;
    enemiesRouted = false;
    waveLabel = 'N/A';
    castleMeshes = [];
    weaponMesh = null;
    naginataFound = false;
    bowCharging = false;
    bowChargeTime = 0;
    swingAnim = 0;
    clockLast = 0;
    msgTimeout = null;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x334422);
    scene.fog = new THREE.Fog(0x334422, 60, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
    scene.add(camera); // camera in scene for weapon mesh attachment

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'samurai-siege-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    // Pointer lock
    renderer.domElement.addEventListener('click', function () {
      renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', onPointerLockChange);

    buildCastle();
    buildPlayer();
    buildHUD();
    initAudio();

    window.addEventListener('resize', onResize);
    window.addEventListener('contextmenu', onContextMenu);

    clockLast = performance.now();
    loop();
  }

  // =========================================================================
  // MAIN LOOP
  // =========================================================================
  function loop() {
    animFrameId = requestAnimationFrame(loop);
    var now = performance.now();
    var dt = Math.min((now - clockLast) / 1000, 0.05);
    clockLast = now;

    if (!gameOver) {
      gameTime += dt;
      updatePlayer(dt);
      updateEnemies(dt);
      updateArrows(dt);
      updateBurnZones(dt);
      updateCauldrons(dt);
      updateBell(dt);
      updateKeepCapture(dt);
      updateWaves(dt);
      updateWinCondition(dt);
    }

    updateHUD();
    if (renderer) renderer.render(scene, camera);
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    // Register key listeners once
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onWheel, { passive: true });
  }

  function update() {
    // External update hook (no-op — game runs its own RAF loop)
  }

  function reset() {
    cleanup();
    // Small delay then re-init
    setTimeout(function () {
      active = true;
      initGame();
    }, 100);
  }

  return { init: init, update: update, reset: reset };

})();
