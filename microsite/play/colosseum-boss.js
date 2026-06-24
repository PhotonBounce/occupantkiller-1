/* ─────────────────────────────────────────────────────────────────────────────
   COLOSSEUM BOSS — 4-arena boss gauntlet
   Activation: C + L simultaneous within 400ms
   4 unique bosses, each in a different arena, connected by portals.
   Defeat all 4 to win.
   ───────────────────────────────────────────────────────────────────────────── */
window.ColosseumBoss = (function () {
  'use strict';

  /* ── activation key tracking ──────────────────────────────────────────────── */
  var keysDown   = {};
  var cDownAt    = 0;
  var lDownAt    = 0;
  var ACTIVATION_WINDOW = 400;
  var active     = false;

  /* ── Three.js handles ─────────────────────────────────────────────────────── */
  var scene, camera, renderer, animFrameId;
  var overlayEl, hudEl, msgEl;

  /* ── clock ────────────────────────────────────────────────────────────────── */
  var clock = { last: 0 };

  /* ── player state ─────────────────────────────────────────────────────────── */
  var playerHP      = 200;
  var playerMaxHP   = 200;
  var playerAmmo    = 60;
  var playerMaxAmmo = 60;
  var playerPos     = { x: 0, y: 1, z: 8 };
  var playerVelX    = 0;
  var playerVelZ    = 0;
  var playerMesh    = null;
  var playerLight   = null;
  var playerLightNormalRange    = 18;
  var playerLightCurrentRange   = 18;
  var playerLightDimTimer       = 0;
  var playerLightDimDuration    = 5;
  var playerPoisonTimer         = 0;    /* seconds remaining */
  var playerPoisonDps           = 5;
  var playerKnockbackTimer      = 0;
  var playerKnockbackVelX       = 0;
  var playerKnockbackVelZ       = 0;
  var playerStaggerTimer        = 0;    /* stagger (cannot attack) */

  /* ── camera / mouse look ──────────────────────────────────────────────────── */
  var yaw   = 0;
  var pitch = 0;
  var mouseX = 0;
  var mouseY = 0;
  var mouseSensitivity = 0.002;
  var pointerLocked    = false;

  /* ── input ────────────────────────────────────────────────────────────────── */
  var keys = {};

  /* ── arena / boss state ───────────────────────────────────────────────────── */
  var currentArena = 0;      /* 0–3 */
  var arenaObjects = [];     /* meshes to clear on arena change */
  var portalMesh   = null;
  var portalSpawned = false;
  var gameState    = 'inactive'; /* inactive | playing | won | lost */
  var bossesDefeated = 0;

  /* ── boss state ───────────────────────────────────────────────────────────── */
  var boss = {
    mesh      : null,
    hp        : 0,
    maxHp     : 0,
    phase     : 1,
    name      : '',
    alive     : false,
    pos       : { x: 0, y: 0, z: -10 },
    velX      : 0,
    velZ      : 0,
    atkTimer  : 0,
    stateTimer: 0,
    state     : 'idle',     /* idle | attack | charge | stagger */
    staggerTimer      : 0,
    weakPointExposed   : false,
    weakPointMesh      : null,
    weakPointHits      : 0,   /* hits on exposed weak point this stagger */
    weakPointTotalHits : 0,   /* total hits on weak point (Shadow Lord) */
    /* Titan specifics */
    chargeCooldown : 0,
    crackLines     : [],
    /* Serpent specifics */
    mouthOpen      : false,
    mouthOpenTimer : 0,
    minions        : [],
    /* Knight specifics */
    shieldUp       : true,
    comboStep      : 0,
    comboTimer     : 0,
    swordProjectile: null,
    /* Shadow Lord specifics */
    tentacles      : [],    /* array of {mesh, hp, alive} */
    allTentaclesDead: false,
    lightCoreMesh  : null,
    lightCoreHits  : 0,
    realityRiftTimer: 0
  };

  /* projectiles pool */
  var projectiles = []; /* {mesh, pos, vel, dmg, type} */
  var playerBullets = [];/* {mesh, pos, vel, life} */
  var shockwaves = [];  /* {mesh, pos, radius, maxRadius, life} */

  /* shoot cooldown */
  var shootCooldown = 0;
  var SHOOT_INTERVAL = 0.12;

  /* ── helpers ──────────────────────────────────────────────────────────────── */
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
  function mkMat(color, emissive, emissiveIntensity) {
    var opts = { color: color };
    if (emissive !== undefined) {
      opts.emissive = emissive;
      opts.emissiveIntensity = emissiveIntensity || 1;
    }
    return new THREE.MeshLambertMaterial(opts);
  }
  function addToArena(mesh) {
    scene.add(mesh);
    arenaObjects.push(mesh);
    return mesh;
  }
  function clearArena() {
    for (var i = 0; i < arenaObjects.length; i++) {
      scene.remove(arenaObjects[i]);
      if (arenaObjects[i].geometry) arenaObjects[i].geometry.dispose();
      if (arenaObjects[i].material) arenaObjects[i].material.dispose();
    }
    arenaObjects = [];
    projectiles = [];
    playerBullets = [];
    shockwaves = [];
    if (portalMesh) { scene.remove(portalMesh); portalMesh = null; }
    portalSpawned = false;
  }
  function spawnMesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }

  /* ── audio ────────────────────────────────────────────────────────────────── */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return audioCtx;
  }
  function playTone(freq, type, duration, gain) {
    var ctx = getAudio();
    if (!ctx) return;
    try {
      var osc = ctx.createOscillator();
      var g   = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  }
  function playShoot()   { playTone(440, 'square', 0.06, 0.1); }
  function playHit()     { playTone(220, 'sawtooth', 0.12, 0.18); }
  function playWeakHit() { playTone(660, 'sine', 0.18, 0.2); }
  function playPortal()  { playTone(330, 'sine', 0.5, 0.2); }
  function playDmg()     { playTone(110, 'sawtooth', 0.15, 0.2); }
  function playWin()     { playTone(880, 'sine', 1.0, 0.3); }

  /* ══════════════════════════════════════════════════════════════════════════════
     ARENA BUILDERS
  ══════════════════════════════════════════════════════════════════════════════ */

  /* ── Arena 0: Rocky Cave (Boss 1 – Titan) ─────────────────────────────────── */
  function buildArena0() {
    /* floor */
    var floor = spawnMesh(
      new THREE.BoxGeometry(40, 0.5, 40),
      mkMat(0x443322),
      0, -0.25, 0
    );
    addToArena(floor);

    /* ceiling */
    var ceil = spawnMesh(
      new THREE.BoxGeometry(40, 0.5, 40),
      mkMat(0x332211),
      0, 10, 0
    );
    addToArena(ceil);

    /* walls */
    var wallMat = mkMat(0x554433);
    var walls = [
      spawnMesh(new THREE.BoxGeometry(40, 12, 1), wallMat,  0,  5, -20),
      spawnMesh(new THREE.BoxGeometry(40, 12, 1), wallMat,  0,  5,  20),
      spawnMesh(new THREE.BoxGeometry(1, 12, 40), wallMat, -20, 5,   0),
      spawnMesh(new THREE.BoxGeometry(1, 12, 40), wallMat,  20, 5,   0)
    ];
    for (var i = 0; i < walls.length; i++) addToArena(walls[i]);

    /* stalagmites */
    var slagMat = mkMat(0x443322);
    var stalagPos = [
      [-8, 0, -12], [8, 0, -12], [-12, 0, -6], [12, 0, -6],
      [-5, 0,  0], [5, 0, 0], [-10, 0, 5]
    ];
    for (var j = 0; j < stalagPos.length; j++) {
      var h = randRange(1.5, 3.5);
      var sl = spawnMesh(
        new THREE.CylinderGeometry(0.2, 0.6, h, 6),
        slagMat,
        stalagPos[j][0], h / 2, stalagPos[j][2]
      );
      addToArena(sl);
    }

    /* ambient light */
    var aLight = new THREE.AmbientLight(0x331111, 0.5);
    scene.add(aLight);
    arenaObjects.push(aLight);
    var pLight = new THREE.PointLight(0xFF6622, 1.2, 35);
    pLight.position.set(0, 6, 0);
    scene.add(pLight);
    arenaObjects.push(pLight);
  }

  /* ── Arena 1: Jungle (Boss 2 – Serpent Queen) ─────────────────────────────── */
  function buildArena1() {
    /* floor */
    var floor = spawnMesh(
      new THREE.BoxGeometry(44, 0.5, 44),
      mkMat(0x1A3A0A),
      0, -0.25, 0
    );
    addToArena(floor);

    /* jungle walls */
    var wallMat = mkMat(0x1A4A1A);
    var walls = [
      spawnMesh(new THREE.BoxGeometry(44, 14, 1), wallMat,  0,  7, -22),
      spawnMesh(new THREE.BoxGeometry(44, 14, 1), wallMat,  0,  7,  22),
      spawnMesh(new THREE.BoxGeometry(1, 14, 44), wallMat, -22, 7,   0),
      spawnMesh(new THREE.BoxGeometry(1, 14, 44), wallMat,  22, 7,   0)
    ];
    for (var i = 0; i < walls.length; i++) addToArena(walls[i]);

    /* tree trunks */
    var trunkMat = mkMat(0x3A2A10);
    var treePos = [[-10, 0, -10], [10, 0, -10], [-8, 0, 3], [8, 0, 5]];
    for (var t = 0; t < treePos.length; t++) {
      var trunk = spawnMesh(
        new THREE.CylinderGeometry(0.4, 0.6, 6, 8),
        trunkMat,
        treePos[t][0], 3, treePos[t][2]
      );
      addToArena(trunk);
    }

    /* poison pools */
    var poolMat = mkMat(0x44FF44, 0x22CC22, 0.5);
    var pools = [
      [-6, 0, -8], [6, 0, -6], [-4, 0, 4]
    ];
    for (var p = 0; p < pools.length; p++) {
      var pool = spawnMesh(
        new THREE.BoxGeometry(3, 0.05, 3),
        poolMat,
        pools[p][0], 0.03, pools[p][2]
      );
      pool.userData.isPoison = true;
      addToArena(pool);
    }

    /* vines (LineSegments) */
    var vinePoints = [];
    for (var v = 0; v < 8; v++) {
      var vx = randRange(-15, 15);
      var vz = randRange(-15, 5);
      vinePoints.push(new THREE.Vector3(vx, 10, vz));
      vinePoints.push(new THREE.Vector3(vx + randRange(-1, 1), 0, vz + randRange(-1, 1)));
    }
    var vineGeo = new THREE.BufferGeometry().setFromPoints(vinePoints);
    var vines = new THREE.LineSegments(vineGeo, new THREE.LineBasicMaterial({ color: 0x226622 }));
    scene.add(vines);
    arenaObjects.push(vines);

    /* lighting */
    var aLight = new THREE.AmbientLight(0x112211, 0.6);
    scene.add(aLight);
    arenaObjects.push(aLight);
    var pLight = new THREE.PointLight(0x44FF44, 0.8, 40);
    pLight.position.set(0, 8, 0);
    scene.add(pLight);
    arenaObjects.push(pLight);
  }

  /* ── Arena 2: Castle Hall (Boss 3 – Iron Knight) ──────────────────────────── */
  function buildArena2() {
    /* stone floor */
    var floor = spawnMesh(
      new THREE.BoxGeometry(50, 0.5, 50),
      mkMat(0x888877),
      0, -0.25, 0
    );
    addToArena(floor);

    /* walls */
    var wallMat = mkMat(0x888877);
    var walls = [
      spawnMesh(new THREE.BoxGeometry(50, 16, 1), wallMat,  0,  8, -25),
      spawnMesh(new THREE.BoxGeometry(50, 16, 1), wallMat,  0,  8,  25),
      spawnMesh(new THREE.BoxGeometry(1, 16, 50), wallMat, -25, 8,   0),
      spawnMesh(new THREE.BoxGeometry(1, 16, 50), wallMat,  25, 8,   0)
    ];
    for (var i = 0; i < walls.length; i++) addToArena(walls[i]);

    /* columns */
    var colMat = mkMat(0x999988);
    var colPos = [
      [-8, 0, -15], [8, 0, -15], [-8, 0, -5],  [8, 0, -5],
      [-8, 0,  5],  [8, 0,  5],  [-8, 0, 15],  [8, 0, 15]
    ];
    for (var c = 0; c < colPos.length; c++) {
      var col = spawnMesh(
        new THREE.CylinderGeometry(0.7, 0.8, 14, 8),
        colMat,
        colPos[c][0], 7, colPos[c][2]
      );
      addToArena(col);
    }

    /* banner strips */
    var banMat = mkMat(0x8B0000);
    var banPos = [
      [-14, 0, -24], [14, 0, -24], [-14, 0, 24], [14, 0, 24]
    ];
    for (var b = 0; b < banPos.length; b++) {
      var ban = spawnMesh(
        new THREE.BoxGeometry(0.4, 8, 0.1),
        banMat,
        banPos[b][0], 10, banPos[b][2]
      );
      addToArena(ban);
    }

    /* lighting */
    var aLight = new THREE.AmbientLight(0x222233, 0.7);
    scene.add(aLight);
    arenaObjects.push(aLight);
    for (var t = 0; t < 4; t++) {
      var torch = new THREE.PointLight(0xFF8822, 1.0, 20);
      torch.position.set((t % 2 === 0 ? -10 : 10), 6, (t < 2 ? -10 : 10));
      scene.add(torch);
      arenaObjects.push(torch);
    }
  }

  /* ── Arena 3: Void Platform (Boss 4 – Shadow Lord) ───────────────────────── */
  function buildArena3() {
    /* main floating platform */
    var platMat = mkMat(0x112233);
    var plat = spawnMesh(
      new THREE.BoxGeometry(30, 0.8, 30),
      platMat,
      0, -0.4, 0
    );
    addToArena(plat);

    /* void edge markers */
    var edgeMat = mkMat(0x4422AA, 0x4422AA, 0.6);
    var edges = [
      spawnMesh(new THREE.BoxGeometry(30, 0.2, 0.3), edgeMat,  0, 0,  15),
      spawnMesh(new THREE.BoxGeometry(30, 0.2, 0.3), edgeMat,  0, 0, -15),
      spawnMesh(new THREE.BoxGeometry(0.3, 0.2, 30), edgeMat,  15, 0,  0),
      spawnMesh(new THREE.BoxGeometry(0.3, 0.2, 30), edgeMat, -15, 0,  0)
    ];
    for (var i = 0; i < edges.length; i++) addToArena(edges[i]);

    /* star-field dots via LineSegments */
    var starPoints = [];
    for (var s = 0; s < 200; s++) {
      var sx = randRange(-60, 60), sy = randRange(-20, 60), sz = randRange(-60, 60);
      starPoints.push(new THREE.Vector3(sx, sy, sz));
      starPoints.push(new THREE.Vector3(sx + 0.1, sy, sz));
    }
    var starGeo = new THREE.BufferGeometry().setFromPoints(starPoints);
    var stars = new THREE.LineSegments(starGeo, new THREE.LineBasicMaterial({ color: 0xCCCCFF }));
    scene.add(stars);
    arenaObjects.push(stars);

    /* dim ambient */
    var aLight = new THREE.AmbientLight(0x050515, 0.4);
    scene.add(aLight);
    arenaObjects.push(aLight);

    /* player light is the primary source — stored globally */
    playerLight = new THREE.PointLight(0xFFFFEE, 1.0, playerLightCurrentRange);
    scene.add(playerLight);
    arenaObjects.push(playerLight);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     BOSS SPAWNERS
  ══════════════════════════════════════════════════════════════════════════════ */

  function spawnBoss0() {
    /* THE TITAN — Rock Golem */
    boss.name    = 'THE TITAN';
    boss.hp      = 600;
    boss.maxHp   = 600;
    boss.phase   = 1;
    boss.alive   = true;
    boss.state   = 'idle';
    boss.atkTimer = 2;
    boss.staggerTimer = 0;
    boss.weakPointExposed = false;
    boss.weakPointHits = 0;
    boss.chargeCooldown = 0;
    boss.crackLines = [];
    boss.pos = { x: 0, y: 3, z: -10 };

    /* body */
    var bodyGeo = new THREE.BoxGeometry(4, 6, 3);
    var bodyMat = mkMat(0x776655);
    boss.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    boss.mesh.position.set(0, 3, -10);
    scene.add(boss.mesh);
    arenaObjects.push(boss.mesh);

    /* fists */
    var fistMat = mkMat(0x998877);
    var leftFist = spawnMesh(new THREE.SphereGeometry(0.9, 8, 6), fistMat, -3, 3, -10);
    var rightFist = spawnMesh(new THREE.SphereGeometry(0.9, 8, 6), fistMat, 3, 3, -10);
    scene.add(leftFist);
    scene.add(rightFist);
    arenaObjects.push(leftFist);
    arenaObjects.push(rightFist);
    boss.mesh.userData.leftFist  = leftFist;
    boss.mesh.userData.rightFist = rightFist;

    /* weak point (hidden initially) */
    var wpGeo = new THREE.SphereGeometry(0.5, 8, 6);
    var wpMat = mkMat(0xFF6600, 0xFF6600, 2);
    boss.weakPointMesh = new THREE.Mesh(wpGeo, wpMat);
    boss.weakPointMesh.position.set(0, 3, -10 + 1.6); /* on back */
    boss.weakPointMesh.visible = false;
    scene.add(boss.weakPointMesh);
    arenaObjects.push(boss.weakPointMesh);
  }

  function spawnBoss1() {
    /* THE SERPENT QUEEN */
    boss.name    = 'THE SERPENT QUEEN';
    boss.hp      = 500;
    boss.maxHp   = 500;
    boss.phase   = 1;
    boss.alive   = true;
    boss.state   = 'idle';
    boss.atkTimer = 2.5;
    boss.mouthOpen = false;
    boss.mouthOpenTimer = 0;
    boss.minions = [];
    boss.weakPointExposed = false;
    boss.weakPointHits = 0;
    boss.pos = { x: 0, y: 4, z: -10 };

    /* body coil */
    var bodyMat = mkMat(0x336633);
    var bodyGeo = new THREE.CylinderGeometry(1, 1, 8, 10);
    boss.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    boss.mesh.position.set(0, 4, -10);
    boss.mesh.rotation.z = 0.3;
    scene.add(boss.mesh);
    arenaObjects.push(boss.mesh);

    /* head */
    var headMat = mkMat(0x224422);
    var headGeo = new THREE.SphereGeometry(1.1, 10, 8);
    boss.weakPointMesh = new THREE.Mesh(headGeo, headMat);
    boss.weakPointMesh.position.set(0, 8.5, -10);
    scene.add(boss.weakPointMesh);
    arenaObjects.push(boss.weakPointMesh);

    /* ambient */
    var aLight = new THREE.AmbientLight(0x112211, 0.6);
    scene.add(aLight);
    arenaObjects.push(aLight);
  }

  function spawnBoss2() {
    /* THE IRON KNIGHT */
    boss.name    = 'THE IRON KNIGHT';
    boss.hp      = 700;
    boss.maxHp   = 700;
    boss.phase   = 1;
    boss.alive   = true;
    boss.state   = 'idle';
    boss.atkTimer = 3;
    boss.shieldUp   = true;
    boss.comboStep  = 0;
    boss.comboTimer = 0;
    boss.swordProjectile = null;
    boss.weakPointExposed = false;
    boss.weakPointHits = 0;
    boss.pos = { x: 0, y: 1.5, z: -10 };

    /* body */
    var bodyMat = mkMat(0x556677);
    var bodyGeo = new THREE.BoxGeometry(2, 3, 1.5);
    boss.mesh = new THREE.Mesh(bodyGeo, bodyMat);
    boss.mesh.position.set(0, 1.5, -10);
    scene.add(boss.mesh);
    arenaObjects.push(boss.mesh);

    /* sword */
    var swordMat = mkMat(0xCCCCCC);
    var swordGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6);
    boss.mesh.userData.swordMesh = new THREE.Mesh(swordGeo, swordMat);
    boss.mesh.userData.swordMesh.position.set(1.5, 1, -10);
    scene.add(boss.mesh.userData.swordMesh);
    arenaObjects.push(boss.mesh.userData.swordMesh);

    /* shield */
    var shieldMat = mkMat(0x334455);
    var shieldGeo = new THREE.BoxGeometry(1.2, 1.8, 0.2);
    boss.mesh.userData.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    boss.mesh.userData.shieldMesh.position.set(-1.5, 1, -10);
    scene.add(boss.mesh.userData.shieldMesh);
    arenaObjects.push(boss.mesh.userData.shieldMesh);

    /* weak point: back of knight */
    var wpMat = mkMat(0xFF4400, 0xFF4400, 1);
    var wpGeo = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    boss.weakPointMesh = new THREE.Mesh(wpGeo, wpMat);
    boss.weakPointMesh.position.set(0, 1.5, -10 + 0.9);
    scene.add(boss.weakPointMesh);
    arenaObjects.push(boss.weakPointMesh);
  }

  function spawnBoss3() {
    /* THE SHADOW LORD */
    boss.name    = 'THE SHADOW LORD';
    boss.hp      = 800;
    boss.maxHp   = 800;
    boss.phase   = 1;
    boss.alive   = true;
    boss.state   = 'idle';
    boss.atkTimer = 3;
    boss.weakPointExposed = false;
    boss.allTentaclesDead = false;
    boss.lightCoreHits = 0;
    boss.tentacles = [];
    boss.realityRiftTimer = 10;
    boss.pos = { x: 0, y: 3, z: -8 };

    /* body sphere */
    var bodyMat = mkMat(0x111122, 0x111122, 2);
    boss.mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 12), bodyMat);
    boss.mesh.position.set(0, 3, -8);
    scene.add(boss.mesh);
    arenaObjects.push(boss.mesh);

    /* light core (hidden until all tentacles dead) */
    var coreMat = mkMat(0xFFFFCC, 0xFFFFCC, 3);
    boss.lightCoreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), coreMat);
    boss.lightCoreMesh.position.set(0, 3, -8);
    boss.lightCoreMesh.visible = false;
    scene.add(boss.lightCoreMesh);
    arenaObjects.push(boss.lightCoreMesh);

    /* tentacles — 8 LineSegments */
    var tentacleMat = new THREE.LineBasicMaterial({ color: 0x221133 });
    for (var t = 0; t < 8; t++) {
      var angle = (Math.PI * 2 / 8) * t;
      var tentaclePoints = [];
      tentaclePoints.push(new THREE.Vector3(0, 3, -8));
      tentaclePoints.push(new THREE.Vector3(
        Math.cos(angle) * 6,
        3 + Math.sin(t) * 2,
        -8 + Math.sin(angle) * 6
      ));
      var tentGeo = new THREE.BufferGeometry().setFromPoints(tentaclePoints);
      var tentMesh = new THREE.LineSegments(tentGeo, tentacleMat.clone());
      /* Also add a visible hitbox sphere at tip */
      var tipMat = mkMat(0x332244, 0x220033, 0.5);
      var tipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), tipMat);
      tipMesh.position.set(
        Math.cos(angle) * 6,
        3 + Math.sin(t) * 2,
        -8 + Math.sin(angle) * 6
      );
      scene.add(tentMesh);
      scene.add(tipMesh);
      arenaObjects.push(tentMesh);
      arenaObjects.push(tipMesh);
      boss.tentacles.push({
        lineMesh: tentMesh,
        tipMesh : tipMesh,
        hp      : 80,
        alive   : true,
        angle   : angle,
        baseAngle: angle
      });
    }
  }

  var BOSS_SPAWNERS = [spawnBoss0, spawnBoss1, spawnBoss2, spawnBoss3];

  /* ══════════════════════════════════════════════════════════════════════════════
     ARENA SETUP
  ══════════════════════════════════════════════════════════════════════════════ */
  function loadArena(idx) {
    clearArena();
    playerLight = null;
    playerLightCurrentRange = playerLightNormalRange;
    playerLightDimTimer = 0;

    currentArena = idx;
    if (idx === 0) buildArena0();
    else if (idx === 1) buildArena1();
    else if (idx === 2) buildArena2();
    else if (idx === 3) buildArena3();

    BOSS_SPAWNERS[idx]();

    /* reset player position */
    playerPos.x = 0;
    playerPos.y = 1;
    playerPos.z = 10;
    playerVelX = 0;
    playerVelZ = 0;
    playerKnockbackTimer = 0;
    playerPoisonTimer = 0;
    playerStaggerTimer = 0;
    if (playerMesh) {
      playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    }
    yaw = Math.PI; /* face boss */
    pitch = 0;

    /* restore camera */
    camera.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
    camera.rotation.set(0, yaw, 0, 'YXZ');
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     PORTAL
  ══════════════════════════════════════════════════════════════════════════════ */
  function spawnPortal() {
    var portalMat = mkMat(0xAA44FF, 0xAA44FF, 2);
    var portalGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
    portalMesh = new THREE.Mesh(portalGeo, portalMat);
    portalMesh.position.set(0, 1.5, 5);
    scene.add(portalMesh);
    portalSpawned = true;
    playPortal();
    showMsg('BOSS DEFEATED! Enter the portal to proceed.');
  }

  function checkPortalEntry() {
    if (!portalSpawned || !portalMesh) return false;
    var d = dist2d(playerPos, { x: portalMesh.position.x, z: portalMesh.position.z });
    return d < 2.5;
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     PLAYER
  ══════════════════════════════════════════════════════════════════════════════ */
  function buildPlayer() {
    var pMat = mkMat(0x3355AA);
    var pGeo = new THREE.BoxGeometry(0.6, 1.6, 0.6);
    playerMesh = new THREE.Mesh(pGeo, pMat);
    playerMesh.position.set(0, 1, 10);
    scene.add(playerMesh);
  }

  function shootBullet() {
    if (playerAmmo <= 0) return;
    playerAmmo--;
    playShoot();

    /* direction from camera */
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));

    var bMat = mkMat(0xFFFF44, 0xFFFF44, 2);
    var bGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(
      playerPos.x + dir.x * 0.5,
      playerPos.y + 0.8,
      playerPos.z + dir.z * 0.5
    );
    scene.add(bMesh);

    playerBullets.push({
      mesh : bMesh,
      pos  : { x: bMesh.position.x, y: bMesh.position.y, z: bMesh.position.z },
      vel  : { x: dir.x * 28, y: dir.y * 28, z: dir.z * 28 },
      life : 2.0
    });
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     PROJECTILE SPAWNERS
  ══════════════════════════════════════════════════════════════════════════════ */
  function spawnBoulder(fromPos) {
    var dx = playerPos.x - fromPos.x;
    var dz = playerPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var bMat = mkMat(0x887766);
    var bGeo = new THREE.SphereGeometry(0.5, 7, 6);
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(fromPos.x, fromPos.y + 1, fromPos.z);
    scene.add(bMesh);
    arenaObjects.push(bMesh);
    projectiles.push({
      mesh : bMesh,
      pos  : { x: bMesh.position.x, y: bMesh.position.y, z: bMesh.position.z },
      vel  : { x: (dx / len) * 9, y: 3, z: (dz / len) * 9 },
      dmg  : 80,
      type : 'boulder',
      life : 4
    });
  }

  function spawnPoison(fromPos) {
    var dx = playerPos.x - fromPos.x;
    var dz = playerPos.z - fromPos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var pMat = mkMat(0x44FF44, 0x22FF22, 1);
    var pGeo = new THREE.SphereGeometry(0.3, 6, 5);
    var pMesh = new THREE.Mesh(pGeo, pMat);
    pMesh.position.set(fromPos.x, fromPos.y + 2, fromPos.z);
    scene.add(pMesh);
    arenaObjects.push(pMesh);
    projectiles.push({
      mesh : pMesh,
      pos  : { x: pMesh.position.x, y: pMesh.position.y, z: pMesh.position.z },
      vel  : { x: (dx / len) * 10, y: 1, z: (dz / len) * 10 },
      dmg  : 30,
      type : 'poison',
      life : 4
    });
  }

  function spawnShockwave(cx, cy, cz) {
    var sMat = mkMat(0x9922FF, 0x9922FF, 1.5);
    var sGeo = new THREE.SphereGeometry(0.5, 8, 6);
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(cx, cy, cz);
    scene.add(sMesh);
    arenaObjects.push(sMesh);
    shockwaves.push({ mesh: sMesh, radius: 0.5, maxRadius: 6, life: 0.6 });
  }

  function spawnCrack(pos) {
    /* crack in ground — LineSegments */
    var pts = [];
    var cx = pos.x, cz = pos.z;
    for (var i = 0; i < 6; i++) {
      var angle = randRange(0, Math.PI * 2);
      var len2 = randRange(1, 3.5);
      pts.push(new THREE.Vector3(cx, 0.05, cz));
      pts.push(new THREE.Vector3(cx + Math.cos(angle) * len2, 0.05, cz + Math.sin(angle) * len2));
    }
    var crackGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var crackMesh = new THREE.LineSegments(crackGeo, new THREE.LineBasicMaterial({ color: 0xFF4400 }));
    scene.add(crackMesh);
    arenaObjects.push(crackMesh);
    boss.crackLines.push(crackMesh);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     BOSS AI UPDATE FUNCTIONS
  ══════════════════════════════════════════════════════════════════════════════ */

  function updateBoss0(dt) {
    /* THE TITAN */
    if (!boss.alive) return;

    /* phase transition */
    if (boss.hp < 300 && boss.phase === 1) {
      boss.phase = 2;
      showMsg('THE TITAN enrages! Watch for charges!');
    }

    /* fist sync */
    if (boss.mesh.userData.leftFist) {
      boss.mesh.userData.leftFist.position.set(
        boss.pos.x - 3, boss.pos.y, boss.pos.z
      );
      boss.mesh.userData.rightFist.position.set(
        boss.pos.x + 3, boss.pos.y, boss.pos.z
      );
    }

    /* weak point sync */
    if (boss.weakPointMesh) {
      boss.weakPointMesh.position.set(
        boss.pos.x, boss.pos.y, boss.pos.z + 1.7
      );
      boss.weakPointMesh.visible = boss.weakPointExposed;
    }

    /* stagger */
    if (boss.staggerTimer > 0) {
      boss.staggerTimer -= dt;
      if (boss.staggerTimer <= 0) {
        boss.staggerTimer = 0;
        boss.weakPointExposed = false;
        boss.weakPointHits = 0;
        boss.state = 'idle';
      }
      return;
    }

    boss.atkTimer -= dt;
    if (boss.atkTimer > 0) return;

    if (boss.phase === 1) {
      /* throw boulder */
      spawnBoulder(boss.pos);
      boss.atkTimer = randRange(1.5, 2.5);
    } else {
      /* phase 2: alternate charge / boulder */
      if (boss.chargeCooldown > 0) {
        boss.chargeCooldown -= dt;
        spawnBoulder(boss.pos);
        boss.atkTimer = 1.8;
      } else {
        /* charge */
        boss.state = 'charge';
        boss.chargeCooldown = 5;
        boss.atkTimer = 3;
        /* move boss toward player rapidly in update loop */
      }
    }
  }

  function updateBoss0Move(dt) {
    if (!boss.alive || boss.staggerTimer > 0) return;
    if (boss.state === 'charge') {
      var dx = playerPos.x - boss.pos.x;
      var dz = playerPos.z - boss.pos.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var spd = 8;
      boss.pos.x += (dx / len) * spd * dt;
      boss.pos.z += (dz / len) * spd * dt;
      boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);

      var d = dist2d(boss.pos, playerPos);
      if (d < 3) {
        /* hit player */
        damagePlayer(100, 'charge');
        /* leave crack */
        spawnCrack(boss.pos);
        /* expose weak point */
        boss.weakPointExposed = true;
        boss.state = 'idle';
        boss.atkTimer = 1;
      }
      if (d > 22 || boss.atkTimer <= 0) {
        boss.state = 'idle';
      }
    } else {
      /* idle drift toward player, slow */
      var dx2 = playerPos.x - boss.pos.x;
      var dz2 = playerPos.z - boss.pos.z;
      var len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
      boss.pos.x += (dx2 / len2) * 1.5 * dt;
      boss.pos.z += (dz2 / len2) * 1.5 * dt;
      boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
    }
  }

  function updateBoss1(dt) {
    /* THE SERPENT QUEEN */
    if (!boss.alive) return;

    if (boss.hp < 250 && boss.phase === 1) {
      boss.phase = 2;
      showMsg('THE SERPENT QUEEN spawns minions!');
      spawnSnakeMinions();
    }

    /* update minions */
    updateSnakeMinions(dt);

    /* mouth open syncs head visual */
    if (boss.weakPointMesh) {
      boss.weakPointMesh.position.set(
        boss.pos.x, boss.pos.y + 4.5, boss.pos.z
      );
    }

    /* boss body drift */
    var dx = playerPos.x - boss.pos.x;
    var dz = playerPos.z - boss.pos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = 2.5;
    if (boss.phase === 2) spd = 3.5;
    boss.pos.x += (dx / len) * spd * dt;
    boss.pos.z += (dz / len) * spd * dt;
    boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);

    /* mouth open timer */
    if (boss.mouthOpen) {
      boss.mouthOpenTimer -= dt;
      if (boss.mouthOpenTimer <= 0) {
        boss.mouthOpen = false;
        boss.weakPointExposed = false;
        if (boss.weakPointMesh) boss.weakPointMesh.material.color.setHex(0x224422);
      }
    }

    boss.atkTimer -= dt;
    if (boss.atkTimer > 0) return;

    var roll = Math.random();
    if (roll < 0.55) {
      /* spit poison */
      boss.mouthOpen = true;
      boss.mouthOpenTimer = 1.2;
      boss.weakPointExposed = true;
      if (boss.weakPointMesh) boss.weakPointMesh.material.color.setHex(0xFF4444);
      spawnPoison(boss.pos);
      boss.atkTimer = randRange(2, 3.5);
    } else {
      /* tail whip — just damage if player close */
      var d = dist2d(boss.pos, playerPos);
      if (d < 6) {
        damagePlayer(70, 'tailwhip');
        /* knockback */
        var kx = playerPos.x - boss.pos.x, kz = playerPos.z - boss.pos.z;
        var klen = Math.sqrt(kx * kx + kz * kz) || 1;
        playerKnockbackVelX = (kx / klen) * 12;
        playerKnockbackVelZ = (kz / klen) * 12;
        playerKnockbackTimer = 0.4;
      }
      boss.atkTimer = randRange(3, 5);
    }
  }

  function spawnSnakeMinions() {
    var minionMat = mkMat(0x224422);
    for (var i = 0; i < 3; i++) {
      var angle = (Math.PI * 2 / 3) * i;
      var mx = boss.pos.x + Math.cos(angle) * 5;
      var mz = boss.pos.z + Math.sin(angle) * 5;
      var mGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
      var mMesh = new THREE.Mesh(mGeo, minionMat);
      mMesh.position.set(mx, 1, mz);
      scene.add(mMesh);
      arenaObjects.push(mMesh);
      boss.minions.push({
        mesh  : mMesh,
        pos   : { x: mx, y: 1, z: mz },
        hp    : 40,
        alive : true,
        atkTimer: 2
      });
    }
  }

  function updateSnakeMinions(dt) {
    for (var i = 0; i < boss.minions.length; i++) {
      var m = boss.minions[i];
      if (!m.alive) continue;
      var dx = playerPos.x - m.pos.x;
      var dz = playerPos.z - m.pos.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      m.pos.x += (dx / len) * 3 * dt;
      m.pos.z += (dz / len) * 3 * dt;
      m.mesh.position.set(m.pos.x, m.pos.y, m.pos.z);
      m.atkTimer -= dt;
      if (m.atkTimer <= 0 && len < 2) {
        damagePlayer(15, 'minion');
        m.atkTimer = 1.5;
      }
    }
  }

  function updateBoss2(dt) {
    /* THE IRON KNIGHT */
    if (!boss.alive) return;

    if (boss.hp < 200 && boss.phase === 1) {
      boss.phase = 2;
      showMsg('THE IRON KNIGHT discards his shield!');
      boss.shieldUp = false;
      if (boss.mesh.userData.shieldMesh) {
        boss.mesh.userData.shieldMesh.visible = false;
      }
    }

    /* weak point is on back — check angle between boss facing and player */
    var dx = playerPos.x - boss.pos.x;
    var dz = playerPos.z - boss.pos.z;
    var angleToPlayer = Math.atan2(dx, dz);
    var bossYaw = boss.mesh.rotation.y;
    var angleDiff = Math.abs(angleToPlayer - bossYaw);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
    var playerBehind = angleDiff > Math.PI * 0.7;
    boss.weakPointExposed = playerBehind;
    if (boss.weakPointMesh) {
      boss.weakPointMesh.position.set(boss.pos.x, boss.pos.y + 0.5, boss.pos.z + 0.85);
      boss.weakPointMesh.visible = playerBehind;
    }

    /* sword sync */
    if (boss.mesh.userData.swordMesh) {
      boss.mesh.userData.swordMesh.position.set(boss.pos.x + 1.5, boss.pos.y + 1, boss.pos.z);
    }
    if (boss.mesh.userData.shieldMesh) {
      boss.mesh.userData.shieldMesh.position.set(boss.pos.x - 1.5, boss.pos.y + 0.5, boss.pos.z);
    }

    /* boss faces player */
    boss.mesh.rotation.y = Math.atan2(dx, dz);

    /* movement */
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var spd = boss.phase === 2 ? 5 : 2.5;
    if (len > 3) {
      boss.pos.x += (dx / len) * spd * dt;
      boss.pos.z += (dz / len) * spd * dt;
    }
    boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);

    /* combo timer */
    if (boss.comboTimer > 0) { boss.comboTimer -= dt; return; }

    boss.atkTimer -= dt;
    if (boss.atkTimer > 0) return;

    var roll = Math.random();
    if (boss.phase >= 3 || (boss.hp < 80 && boss.phase === 2)) {
      /* phase 3: throw sword then punch */
      if (boss.mesh.userData.swordMesh && !boss.swordProjectile) {
        throwSword();
      } else if (len < 3) {
        damagePlayer(50, 'punch');
      }
      boss.atkTimer = 2;
    } else if (roll < 0.6) {
      /* 3-hit sword combo */
      doSwordCombo();
    } else {
      /* shield bash if close */
      if (len < 3 && boss.shieldUp) {
        damagePlayer(60, 'bash');
        playerStaggerTimer = 0.8;
        showMsg('Shield bash! Staggered!');
      }
      boss.atkTimer = randRange(2.5, 4);
    }
  }

  function doSwordCombo() {
    var d = dist2d(boss.pos, playerPos);
    if (d < 3.5) {
      damagePlayer(20, 'sword');
      showMsg('Sword combo: hit 1!');
    }
    boss.comboTimer = 0.4;
    boss.comboStep = 1;
    /* second hit */
    var _self = boss;
    /* schedule in state flags */
    _self.atkTimer = 0.4;
    _self.userData_comboHit2 = true;
  }

  function throwSword() {
    if (!boss.mesh.userData.swordMesh) return;
    var swordMesh = boss.mesh.userData.swordMesh;
    var dx = playerPos.x - boss.pos.x;
    var dz = playerPos.z - boss.pos.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    scene.remove(swordMesh);
    var sMat = mkMat(0xCCCCCC);
    var sGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 6);
    var sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(boss.pos.x, boss.pos.y + 1, boss.pos.z);
    scene.add(sMesh);
    arenaObjects.push(sMesh);
    projectiles.push({
      mesh: sMesh,
      pos : { x: sMesh.position.x, y: sMesh.position.y, z: sMesh.position.z },
      vel : { x: (dx / len) * 14, y: 0, z: (dz / len) * 14 },
      dmg : 60,
      type: 'sword',
      life: 3
    });
    boss.swordProjectile = sMesh;
    boss.mesh.userData.swordMesh = null;
  }

  function updateBoss3(dt) {
    /* THE SHADOW LORD */
    if (!boss.alive) return;

    /* tentacle animation & checks */
    var aliveTentacles = 0;
    for (var t = 0; t < boss.tentacles.length; t++) {
      var tent = boss.tentacles[t];
      if (!tent.alive) continue;
      aliveTentacles++;
      /* animate tip */
      tent.baseAngle += dt * 0.8;
      var angle = tent.angle + Math.sin(tent.baseAngle) * 0.3;
      var tx = boss.pos.x + Math.cos(angle) * 6;
      var ty = boss.pos.y + Math.sin(tent.baseAngle * 0.7) * 2;
      var tz = boss.pos.z + Math.sin(angle) * 6;
      tent.tipMesh.position.set(tx, ty, tz);
    }

    if (aliveTentacles === 0 && !boss.allTentaclesDead) {
      boss.allTentaclesDead = true;
      boss.weakPointExposed = true;
      boss.lightCoreMesh.visible = true;
      showMsg('ALL TENTACLES DESTROYED! Hit the LIGHT CORE!');
    }

    /* boss body float */
    boss.pos.y = 3 + Math.sin(Date.now() * 0.001) * 0.5;
    boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
    if (boss.lightCoreMesh) {
      boss.lightCoreMesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
    }

    /* reality rift timer */
    boss.realityRiftTimer -= dt;
    if (boss.realityRiftTimer <= 0) {
      boss.realityRiftTimer = randRange(12, 20);
      doRealityRift();
    }

    boss.atkTimer -= dt;
    if (boss.atkTimer > 0) return;

    var roll = Math.random();
    if (roll < 0.35) {
      /* tentacle slam */
      doTentacleSlam();
      boss.atkTimer = randRange(2, 3);
    } else if (roll < 0.65) {
      /* darkness pulse */
      doDarknessPulse();
      boss.atkTimer = randRange(5, 8);
    } else {
      /* tentacle slam again */
      doTentacleSlam();
      boss.atkTimer = randRange(2.5, 4);
    }
  }

  function doTentacleSlam() {
    /* pick alive tentacle closest to player */
    var closest = null, closestD = 999;
    for (var t = 0; t < boss.tentacles.length; t++) {
      var tent = boss.tentacles[t];
      if (!tent.alive) continue;
      var d = dist3d(
        { x: tent.tipMesh.position.x, y: tent.tipMesh.position.y, z: tent.tipMesh.position.z },
        playerPos
      );
      if (d < closestD) { closestD = d; closest = tent; }
    }
    if (!closest) return;
    /* slam toward player */
    var tx = playerPos.x, ty = playerPos.y, tz = playerPos.z;
    var d = dist2d(playerPos, { x: boss.pos.x, z: boss.pos.z });
    if (d < 4) {
      damagePlayer(70, 'tentacleslam');
      spawnShockwave(playerPos.x, 0.1, playerPos.z);
    }
  }

  function doDarknessPulse() {
    if (currentArena !== 3 || !playerLight) return;
    playerLightCurrentRange = playerLightNormalRange * 0.2;
    playerLight.distance = playerLightCurrentRange;
    playerLightDimTimer = 5;
    showMsg('DARKNESS PULSE! Vision severely reduced for 5 seconds!');
    playTone(55, 'sawtooth', 0.5, 0.3);
  }

  function doRealityRift() {
    /* teleport player to random spot on void platform */
    playerPos.x = randRange(-12, 12);
    playerPos.z = randRange(-12, 12);
    playerPos.y = 1;
    if (playerMesh) playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);
    showMsg('REALITY RIFT! Teleported!');
    playTone(220, 'square', 0.3, 0.2);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     BULLET HIT DETECTION
  ══════════════════════════════════════════════════════════════════════════════ */

  function checkBulletHitBoss(bullet) {
    if (!boss.alive) return false;

    var bx = bullet.pos.x, by = bullet.pos.y, bz = bullet.pos.z;

    /* check tentacle tips for boss 3 */
    if (currentArena === 3) {
      for (var t = 0; t < boss.tentacles.length; t++) {
        var tent = boss.tentacles[t];
        if (!tent.alive) continue;
        var td = dist3d(
          { x: tent.tipMesh.position.x, y: tent.tipMesh.position.y, z: tent.tipMesh.position.z },
          { x: bx, y: by, z: bz }
        );
        if (td < 1.0) {
          tent.hp -= 30;
          playHit();
          if (tent.hp <= 0) {
            tent.alive = false;
            tent.tipMesh.visible = false;
            tent.lineMesh.visible = false;
            showMsg('Tentacle destroyed! ' + countAliveTentacles() + ' remaining.');
          }
          return true;
        }
      }
      /* check light core */
      if (boss.allTentaclesDead && boss.lightCoreMesh && boss.lightCoreMesh.visible) {
        var ld = dist3d(
          { x: boss.lightCoreMesh.position.x, y: boss.lightCoreMesh.position.y, z: boss.lightCoreMesh.position.z },
          { x: bx, y: by, z: bz }
        );
        if (ld < 1.0) {
          boss.lightCoreHits++;
          boss.hp -= 80;
          playWeakHit();
          showMsg('LIGHT CORE HIT! ' + boss.lightCoreHits + '/10');
          if (boss.lightCoreHits >= 10) {
            killBoss();
          }
          return true;
        }
      }
      return false;
    }

    /* check weak point first */
    if (boss.weakPointExposed && boss.weakPointMesh) {
      var wd = dist3d(
        { x: boss.weakPointMesh.position.x, y: boss.weakPointMesh.position.y, z: boss.weakPointMesh.position.z },
        { x: bx, y: by, z: bz }
      );
      if (wd < 1.2) {
        var wpDmg = 0;
        /* boss 0: stagger mechanic */
        if (currentArena === 0) {
          if (boss.staggerTimer > 0) {
            /* burst window — deal 200 dmg per hit on staggered */
            wpDmg = 200;
            boss.hp -= wpDmg;
            playWeakHit();
            showMsg('BURST HIT! ' + wpDmg + ' damage!');
            if (boss.hp <= 0) { killBoss(); return true; }
          } else if (boss.weakPointExposed) {
            boss.weakPointHits++;
            wpDmg = 40;
            boss.hp -= wpDmg;
            playWeakHit();
            if (boss.weakPointHits >= 3) {
              boss.staggerTimer = 2;
              boss.weakPointHits = 0;
              boss.state = 'stagger';
              showMsg('TITAN STAGGERED! Shoot weak point now!');
            }
          }
        }
        /* boss 1: mouth shot */
        else if (currentArena === 1) {
          wpDmg = boss.mouthOpen ? 90 : 30; /* 3× if mouth open */
          boss.hp -= wpDmg;
          playWeakHit();
          if (boss.hp <= 0) { killBoss(); return true; }
        }
        /* boss 2: behind = 3× */
        else if (currentArena === 2) {
          wpDmg = 90; /* 3× of 30 */
          boss.hp -= wpDmg;
          playWeakHit();
          if (boss.hp <= 0) { killBoss(); return true; }
        }
        return true;
      }
    }

    /* hit boss body */
    var bd = dist3d(boss.pos, { x: bx, y: by, z: bz });
    if (bd < 3.5) {
      var dmg = 30;
      /* boss 2 front damage reduction */
      if (currentArena === 2 && boss.shieldUp && !boss.weakPointExposed) {
        dmg = Math.floor(dmg * 0.3);
      }
      boss.hp -= dmg;
      playHit();
      if (boss.hp <= 0) { killBoss(); return true; }
      return true;
    }
    /* boss 1 minions */
    if (currentArena === 1) {
      for (var m = 0; m < boss.minions.length; m++) {
        var mn = boss.minions[m];
        if (!mn.alive) continue;
        var md = dist2d(mn.pos, { x: bx, z: bz });
        if (md < 1.0) {
          mn.hp -= 30;
          playHit();
          if (mn.hp <= 0) {
            mn.alive = false;
            mn.mesh.visible = false;
          }
          return true;
        }
      }
    }
    return false;
  }

  function countAliveTentacles() {
    var count = 0;
    for (var t = 0; t < boss.tentacles.length; t++) {
      if (boss.tentacles[t].alive) count++;
    }
    return count;
  }

  function killBoss() {
    boss.alive = false;
    if (boss.mesh) boss.mesh.visible = false;
    if (boss.weakPointMesh) boss.weakPointMesh.visible = false;
    if (boss.lightCoreMesh) boss.lightCoreMesh.visible = false;
    bossesDefeated++;
    playWin();
    if (bossesDefeated >= 4) {
      gameState = 'won';
      showMsg('ALL BOSSES DEFEATED! YOU HAVE CONQUERED THE COLOSSEUM!');
    } else {
      /* restore HP to 60%, refill ammo */
      playerHP = Math.min(playerMaxHP, Math.floor(playerMaxHP * 0.6));
      playerAmmo = playerMaxAmmo;
      spawnPortal();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     PLAYER DAMAGE
  ══════════════════════════════════════════════════════════════════════════════ */
  function damagePlayer(dmg, type) {
    if (playerStaggerTimer > 0) return;
    playerHP -= dmg;
    playDmg();
    if (type === 'poison' || type === 'poisonpool') {
      playerPoisonTimer = 10;
    }
    flashDamage();
    if (playerHP <= 0) {
      playerHP = 0;
      gameState = 'lost';
      showMsg('YOU DIED. Restarting arena...');
      setTimeout(function () {
        restartCurrentArena();
      }, 2000);
    }
  }

  function flashDamage() {
    if (!overlayEl) return;
    overlayEl.style.background = 'rgba(255,0,0,0.25)';
    setTimeout(function () {
      if (overlayEl) overlayEl.style.background = 'none';
    }, 200);
  }

  function restartCurrentArena() {
    gameState = 'playing';
    playerHP = playerMaxHP;
    playerAmmo = playerMaxAmmo;
    loadArena(currentArena);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     VOID CHECK (arena 3)
  ══════════════════════════════════════════════════════════════════════════════ */
  function checkVoidDeath() {
    if (currentArena !== 3) return;
    if (Math.abs(playerPos.x) > 15.5 || Math.abs(playerPos.z) > 15.5 || playerPos.y < -1) {
      damagePlayer(playerHP, 'void'); /* instant death */
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     POISON POOL CHECK (arena 1)
  ══════════════════════════════════════════════════════════════════════════════ */
  function checkPoisonPools() {
    if (currentArena !== 1) return;
    for (var i = 0; i < arenaObjects.length; i++) {
      var obj = arenaObjects[i];
      if (!obj.userData || !obj.userData.isPoison) continue;
      var d = dist2d(playerPos, {
        x: obj.position.x,
        z: obj.position.z
      });
      if (d < 2) {
        if (playerPoisonTimer <= 0) {
          damagePlayer(0, 'poisonpool'); /* start poison */
          playerPoisonTimer = 10;
          showMsg('Poisoned by pool! 5 HP/s for 10s.');
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     MAIN UPDATE
  ══════════════════════════════════════════════════════════════════════════════ */
  function update() {
    if (!active || gameState === 'inactive') return;
    animFrameId = requestAnimationFrame(update);

    var now  = performance.now();
    var dt   = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;

    if (gameState === 'won' || gameState === 'lost') {
      updateHUD();
      renderer.render(scene, camera);
      return;
    }

    /* ── player movement ────────────────────────────────────────────────────── */
    if (playerKnockbackTimer > 0) {
      playerKnockbackTimer -= dt;
      playerPos.x += playerKnockbackVelX * dt;
      playerPos.z += playerKnockbackVelZ * dt;
    } else {
      var speed = 6;
      var fwd   = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
      var rgt   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      var mv    = new THREE.Vector3(0, 0, 0);
      if (keys['w'] || keys['arrowup'])    mv.addScaledVector(fwd, 1);
      if (keys['s'] || keys['arrowdown'])  mv.addScaledVector(fwd, -1);
      if (keys['a'] || keys['arrowleft'])  mv.addScaledVector(rgt, -1);
      if (keys['d'] || keys['arrowright']) mv.addScaledVector(rgt, 1);
      if (mv.lengthSq() > 0) mv.normalize();
      playerPos.x += mv.x * speed * dt;
      playerPos.z += mv.z * speed * dt;
    }

    /* clamp to arena bounds */
    if (currentArena === 3) {
      /* void check done separately */
    } else {
      var arenaHalf = currentArena === 2 ? 24 : 19;
      playerPos.x = clamp(playerPos.x, -arenaHalf, arenaHalf);
      playerPos.z = clamp(playerPos.z, -arenaHalf, arenaHalf);
    }
    playerPos.y = 1;

    /* update player mesh */
    if (playerMesh) playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);

    /* camera follows player */
    camera.position.set(playerPos.x, playerPos.y + 0.8, playerPos.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    /* ── player light (void arena) ──────────────────────────────────────────── */
    if (playerLight) {
      playerLight.position.set(playerPos.x, playerPos.y + 1.5, playerPos.z);
      if (playerLightDimTimer > 0) {
        playerLightDimTimer -= dt;
        if (playerLightDimTimer <= 0) {
          playerLightCurrentRange = playerLightNormalRange;
          playerLight.distance = playerLightCurrentRange;
          showMsg('Vision restored.');
        }
      }
    }

    /* ── shoot cooldown ─────────────────────────────────────────────────────── */
    if (shootCooldown > 0) shootCooldown -= dt;
    if (keys[' '] || keys['mousedown']) {
      if (shootCooldown <= 0 && playerAmmo > 0 && playerStaggerTimer <= 0) {
        shootBullet();
        shootCooldown = SHOOT_INTERVAL;
      }
    }

    /* ── stagger ────────────────────────────────────────────────────────────── */
    if (playerStaggerTimer > 0) playerStaggerTimer -= dt;

    /* ── poison ─────────────────────────────────────────────────────────────── */
    if (playerPoisonTimer > 0) {
      playerPoisonTimer -= dt;
      playerHP -= playerPoisonDps * dt;
      if (playerHP <= 0) { playerHP = 0; gameState = 'lost'; showMsg('You died to poison!'); }
    }

    /* ── void check ─────────────────────────────────────────────────────────── */
    checkVoidDeath();

    /* ── poison pools ───────────────────────────────────────────────────────── */
    checkPoisonPools();

    /* ── player bullets ─────────────────────────────────────────────────────── */
    for (var b = playerBullets.length - 1; b >= 0; b--) {
      var bul = playerBullets[b];
      bul.pos.x += bul.vel.x * dt;
      bul.pos.y += bul.vel.y * dt;
      bul.pos.z += bul.vel.z * dt;
      bul.life -= dt;
      bul.mesh.position.set(bul.pos.x, bul.pos.y, bul.pos.z);

      var hit = checkBulletHitBoss(bul);
      if (hit || bul.life <= 0) {
        scene.remove(bul.mesh);
        if (bul.mesh.geometry) bul.mesh.geometry.dispose();
        if (bul.mesh.material) bul.mesh.material.dispose();
        playerBullets.splice(b, 1);
      }
    }

    /* ── enemy projectiles ──────────────────────────────────────────────────── */
    for (var p = projectiles.length - 1; p >= 0; p--) {
      var proj = projectiles[p];
      proj.pos.x += proj.vel.x * dt;
      proj.pos.y += proj.vel.y * dt - 4.9 * dt * dt; /* gravity for bouncing */
      proj.pos.z += proj.vel.z * dt;
      proj.life  -= dt;
      proj.mesh.position.set(proj.pos.x, proj.pos.y, proj.pos.z);

      /* floor bounce for boulders */
      if (proj.pos.y < 0.5 && proj.type === 'boulder') {
        proj.vel.y = Math.abs(proj.vel.y) * 0.5;
        if (proj.vel.y < 0.5) proj.life = 0;
      }

      /* check hit player */
      var pd = dist2d(proj.pos, playerPos);
      if (pd < 1.5 && Math.abs(proj.pos.y - playerPos.y) < 2) {
        damagePlayer(proj.dmg, proj.type);
        proj.life = 0;
      }

      if (proj.life <= 0) {
        scene.remove(proj.mesh);
        projectiles.splice(p, 1);
      }
    }

    /* ── shockwaves ─────────────────────────────────────────────────────────── */
    for (var sw = shockwaves.length - 1; sw >= 0; sw--) {
      var shk = shockwaves[sw];
      shk.life -= dt;
      var frac = 1 - shk.life / 0.6;
      shk.radius = 0.5 + frac * shk.maxRadius;
      shk.mesh.scale.setScalar(shk.radius);
      if (shk.life <= 0) {
        scene.remove(shk.mesh);
        shockwaves.splice(sw, 1);
      }
    }

    /* ── portal rotation ─────────────────────────────────────────────────────── */
    if (portalMesh) {
      portalMesh.rotation.y += dt * 1.5;
    }

    /* ── portal entry ────────────────────────────────────────────────────────── */
    if (portalSpawned && checkPortalEntry()) {
      var nextArena = currentArena + 1;
      if (nextArena < 4) {
        loadArena(nextArena);
      }
      return;
    }

    /* ── boss AI ─────────────────────────────────────────────────────────────── */
    if (boss.alive) {
      if (currentArena === 0) {
        updateBoss0(dt);
        updateBoss0Move(dt);
        /* sync boss mesh */
        boss.mesh.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
      } else if (currentArena === 1) {
        updateBoss1(dt);
      } else if (currentArena === 2) {
        updateBoss2(dt);
      } else if (currentArena === 3) {
        updateBoss3(dt);
      }
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════════ */
  function updateHUD() {
    if (!hudEl) return;
    var tentStr = '';
    if (currentArena === 3) {
      tentStr = ' | TENTACLES: ' + countAliveTentacles() + '/8';
    }
    var wpStr = boss.weakPointExposed ? 'EXPOSED' : 'HIDDEN';
    var bossHPStr = boss.alive ? boss.hp.toString() : '0';
    var poisonStr = playerPoisonTimer > 0 ? ' [POISONED ' + Math.ceil(playerPoisonTimer) + 's]' : '';
    hudEl.textContent =
      'COLOSSEUM BOSS' +
      ' [BOSS: ' + boss.name + ' ' + (currentArena + 1) + ' of 4]' +
      ' [BOSS HP: ' + Math.max(0, bossHPStr) + '/' + boss.maxHp + ']' +
      ' [PHASE: ' + boss.phase + ']' +
      ' [WEAKPOINT: ' + wpStr + ']' +
      tentStr +
      ' | HP: ' + Math.max(0, Math.floor(playerHP)) + '/' + playerMaxHP +
      ' AMMO: ' + playerAmmo + '/' + playerMaxAmmo +
      poisonStr;
    if (gameState === 'won') {
      hudEl.textContent = 'COLOSSEUM CONQUERED! ALL 4 BOSSES DEFEATED! YOU WIN!';
    } else if (gameState === 'lost') {
      hudEl.textContent = 'YOU DIED — Restarting arena ' + (currentArena + 1) + '...';
    }
  }

  function showMsg(text) {
    if (!msgEl) return;
    msgEl.textContent = text;
    clearTimeout(msgEl._hideTimer);
    msgEl._hideTimer = setTimeout(function () {
      if (msgEl) msgEl.textContent = '';
    }, 3500);
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     INIT / TEARDOWN
  ══════════════════════════════════════════════════════════════════════════════ */
  function buildUI() {
    overlayEl = document.createElement('div');
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'pointer-events:none', 'z-index:9998'
    ].join(';');
    document.body.appendChild(overlayEl);

    hudEl = document.createElement('div');
    hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'background:rgba(0,0,0,0.65)', 'color:#EEE', 'font:bold 12px monospace',
      'padding:6px 10px', 'z-index:9999', 'pointer-events:none',
      'white-space:nowrap', 'overflow:hidden'
    ].join(';');
    document.body.appendChild(hudEl);

    msgEl = document.createElement('div');
    msgEl.style.cssText = [
      'position:fixed', 'bottom:60px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)', 'color:#FFD700', 'font:bold 16px monospace',
      'padding:8px 18px', 'border-radius:4px', 'z-index:9999',
      'pointer-events:none', 'text-align:center', 'max-width:80vw'
    ].join(';');
    document.body.appendChild(msgEl);
  }

  function destroyUI() {
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    if (hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);
    if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    overlayEl = null; hudEl = null; msgEl = null;
  }

  function buildRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:9990';
  }

  function buildScene() {
    scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x080808);
    scene.fog = new THREE.Fog(0x080808, 20, 60);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 1.8, 10);
  }

  function onResize() {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function requestPointerLock() {
    if (renderer && renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  }

  function onMouseMove(e) {
    if (!active) return;
    if (pointerLocked) {
      yaw   -= e.movementX * mouseSensitivity;
      pitch -= e.movementY * mouseSensitivity;
      pitch  = clamp(pitch, -Math.PI / 3, Math.PI / 3);
    }
  }

  function onPointerLockChange() {
    pointerLocked = document.pointerLockElement === (renderer && renderer.domElement);
  }

  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    keys[k] = true;

    /* activation */
    if (k === 'c') cDownAt = performance.now();
    if (k === 'l') lDownAt = performance.now();
    if (k === 'c' || k === 'l') {
      if (Math.abs(cDownAt - lDownAt) <= ACTIVATION_WINDOW && cDownAt > 0 && lDownAt > 0) {
        if (!active) {
          activate();
        }
      }
    }

    /* space = shoot */
    if (k === ' ') e.preventDefault();
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function onMouseDown(e) {
    if (!active) return;
    keys['mousedown'] = true;
    if (!pointerLocked) requestPointerLock();
  }

  function onMouseUp(e) {
    keys['mousedown'] = false;
  }

  function bindEvents() {
    window.addEventListener('keydown',  onKeyDown,  false);
    window.addEventListener('keyup',    onKeyUp,    false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('mouseup',   onMouseUp,   false);
    window.addEventListener('resize',    onResize,    false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);
  }

  function unbindEvents() {
    window.removeEventListener('keydown',  onKeyDown,  false);
    window.removeEventListener('keyup',    onKeyUp,    false);
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('mousedown', onMouseDown, false);
    window.removeEventListener('mouseup',   onMouseUp,   false);
    window.removeEventListener('resize',    onResize,    false);
    document.removeEventListener('pointerlockchange', onPointerLockChange, false);
  }

  function activate() {
    active = true;
    cDownAt = 0;
    lDownAt = 0;
    gameState = 'playing';
    bossesDefeated = 0;
    playerHP    = playerMaxHP;
    playerAmmo  = playerMaxAmmo;
    yaw   = Math.PI;
    pitch = 0;

    buildScene();
    buildRenderer();
    buildUI();
    buildPlayer();

    loadArena(0);

    requestPointerLock();
    showMsg('COLOSSEUM BOSS — Defeat all 4 bosses! WASD + Mouse. Click to shoot.');

    clock.last = performance.now();
    animFrameId = requestAnimationFrame(update);
  }

  function deactivate() {
    active = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    clearArena();
    if (playerMesh) { scene.remove(playerMesh); playerMesh = null; }
    if (renderer) {
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      renderer = null;
    }
    if (scene) { scene = null; }
    destroyUI();
    unbindEvents();
    if (document.exitPointerLock) document.exitPointerLock();
    keys = {};
    gameState = 'inactive';
  }

  /* ══════════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════════ */
  function init() {
    bindEvents();
  }

  function updateAPI() {
    /* no-op: frame loop driven internally */
  }

  function resetAPI() {
    if (active) deactivate();
  }

  return {
    init   : init,
    update : updateAPI,
    reset  : resetAPI
  };
}());
