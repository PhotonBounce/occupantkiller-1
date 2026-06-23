window.GladiatorArena = (function () {
  'use strict';

  // ─── Key tracking ────────────────────────────────────────────────────────────
  var keysDown = {};
  var gDownAt = 0;
  var aDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;
  var scene, camera, renderer, animFrameId;

  // ─── Game state ──────────────────────────────────────────────────────────────
  var playerHP = 100;
  var playerMaxHP = 100;
  var currentWeapon = 1; // 1=SWORD 2=TRIDENT 3=SHIELD+MACE 4=BOW
  var weaponNames = { 1: 'SWORD', 2: 'TRIDENT', 3: 'SHIELD+MACE', 4: 'BOW' };
  var crowdFavor = 50; // 0-100
  var currentWave = 1;
  var totalWaves = 6;
  var enemies = [];
  var projectiles = [];
  var netObjects = [];
  var arrowObjects = [];
  var crowdFigures = [];
  var gateObjects = [];
  var pickupObjects = [];
  var lion = null;
  var lionStunned = false;
  var lionStunTimer = 0;
  var rollCooldown = 0;
  var rollActive = false;
  var rollTimer = 0;
  var rollDirX = 0;
  var rollDirZ = 0;
  var netCooldown = 0;
  var crowdWaving = false;
  var crowdWaveTimer = 0;
  var playerMesh = null;
  var playerPos = { x: 0, y: 0, z: 10 };
  var playerVelX = 0;
  var playerVelZ = 0;
  var clock = { last: 0 };
  var comboBonusMult = 1;
  var comboTimer = 0;
  var waveEnemiesLeft = 0;
  var waveCleared = false;
  var waveTransitionTimer = 0;
  var gameOver = false;
  var gameWon = false;
  var audioCtx = null;
  var hudEl = null;
  var crowdStatus = 'CHEERING';
  var shieldActive = false;
  var attackCooldown = 0;
  var guardAttacking = false;
  var guardAttackTimer = 0;
  var guardMeshes = [];
  var bossEnemy = null;

  // Movement direction for roll
  var moveDir = { x: 0, z: 0 };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }

  // ─── Audio ───────────────────────────────────────────────────────────────────
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }

  function playCrowdRoar() {
    if (!audioCtx) return;
    var bufSize = audioCtx.sampleRate * 0.6;
    var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 200;
    filt.Q.value = 0.5;
    src.connect(filt);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    filt.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  }

  function playSwoosh() {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  function playBoos() {
    if (!audioCtx) return;
    var bufSize = audioCtx.sampleRate * 0.8;
    var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 150;
    src.connect(filt);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    filt.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  }

  // ─── Three.js scene setup ────────────────────────────────────────────────────
  function buildScene() {
    var THREE = window.THREE;
    if (!THREE) { console.warn('GladiatorArena: THREE not found'); return false; }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 60, 120);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 28, 38);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'gladiator-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0xfff8e1, 0.6);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(20, 40, 10);
    sun.castShadow = true;
    scene.add(sun);

    buildArena(THREE);
    buildPlayer(THREE);
    buildHUD();
    spawnWave(THREE, currentWave);

    return true;
  }

  // ─── Arena construction ──────────────────────────────────────────────────────
  function buildArena(THREE) {
    // Sand floor – CylinderGeometry r=25 h=0.5
    var floorGeo = new THREE.CylinderGeometry(25, 25, 0.5, 48);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0xD4A017 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // Surrounding walls – 10 arch segments around perimeter
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    for (var i = 0; i < 10; i++) {
      var angle = (i / 10) * Math.PI * 2;
      var wx = Math.cos(angle) * 26;
      var wz = Math.sin(angle) * 26;

      // Main wall block
      var wallGeo = new THREE.BoxGeometry(4.5, 8, 2.5);
      var wall = new THREE.Mesh(wallGeo, stoneMat);
      wall.position.set(wx, 4, wz);
      wall.rotation.y = -angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);

      // Arch top
      var archGeo = new THREE.BoxGeometry(4.5, 1.5, 2.5);
      var arch = new THREE.Mesh(archGeo, new THREE.MeshLambertMaterial({ color: 0x7A6545 }));
      arch.position.set(wx, 8.75, wz);
      arch.rotation.y = -angle;
      scene.add(arch);

      // Gate at south position (segment 5)
      if (i === 5) {
        var gateGeo = new THREE.BoxGeometry(3, 6, 0.5);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
        var gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(wx * 0.9, 3, wz * 0.9);
        gate.rotation.y = -angle;
        gate.userData.isGate = true;
        scene.add(gate);
        gateObjects.push(gate);
      }
    }

    // VIP box at north (0xCC0000)
    var vipGeo = new THREE.BoxGeometry(5, 4, 3);
    var vipMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var vip = new THREE.Mesh(vipGeo, vipMat);
    vip.position.set(0, 5, -28);
    vip.castShadow = true;
    scene.add(vip);

    // VIP box railing
    var railGeo = new THREE.BoxGeometry(5.5, 0.3, 0.3);
    var railMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(0, 7.15, -26.65);
    scene.add(rail);

    // Crowd figures – 30 spectators in tiers
    buildCrowd(THREE);
  }

  function buildCrowd(THREE) {
    var colors = [0xFFE0BD, 0xD4A373, 0x8B5E3C, 0xF2D2BD];
    var robeColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFED766, 0x2AB7CA, 0xF0B429];

    for (var i = 0; i < 30; i++) {
      var angle = (i / 30) * Math.PI * 2;
      var tier = Math.floor(i / 10); // 0, 1, 2
      var radius = 27 + tier * 1.5;
      var height = 9 + tier * 2;

      var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      var bodyMat = new THREE.MeshLambertMaterial({ color: robeColors[i % robeColors.length] });
      var body = new THREE.Mesh(bodyGeo, bodyMat);

      var headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      var headMat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 0.825;
      body.add(head);

      // Arm for waving
      var armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
      var armMat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(0.4, 0.3, 0);
      arm.rotation.z = -0.3;
      body.add(arm);
      body.userData.arm = arm;
      body.userData.baseArmRotZ = -0.3;
      body.userData.wavePhase = Math.random() * Math.PI * 2;

      body.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      body.lookAt(0, height, 0);
      scene.add(body);
      crowdFigures.push(body);
    }
  }

  // ─── Player ───────────────────────────────────────────────────────────────────
  function buildPlayer(THREE) {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFE0BD });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    group.add(head);

    // Helmet
    var helmGeo = new THREE.BoxGeometry(0.65, 0.35, 0.65);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 2.12;
    group.add(helm);

    group.position.set(playerPos.x, playerPos.y, playerPos.z);
    group.castShadow = true;
    scene.add(group);
    playerMesh = group;

    buildWeaponVisual(THREE, group);
  }

  function buildWeaponVisual(THREE, parent) {
    // Remove old weapon
    while (parent.userData.weaponGroup && parent.userData.weaponGroup.parent) {
      parent.remove(parent.userData.weaponGroup);
    }

    var wg = new THREE.Group();

    if (currentWeapon === 1) {
      // SWORD – BoxGeometry blade
      var bladeGeo = new THREE.BoxGeometry(0.12, 0.9, 0.08);
      var bladeMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
      var blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(0.5, 1.0, 0.2);
      wg.add(blade);
      var guardGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
      var guard = new THREE.Mesh(guardGeo, new THREE.MeshLambertMaterial({ color: 0xFFD700 }));
      guard.position.set(0.5, 0.6, 0.2);
      wg.add(guard);
    } else if (currentWeapon === 2) {
      // TRIDENT – LineSegments + SphereGeometry tip
      var tridentMat = new THREE.LineBasicMaterial({ color: 0x885500 });
      var pts = [];
      pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.4, 0));
      pts.push(new THREE.Vector3(-0.2, 1.1, 0), new THREE.Vector3(-0.2, 1.4, 0));
      pts.push(new THREE.Vector3(0.2, 1.1, 0), new THREE.Vector3(0.2, 1.4, 0));
      var tridentGeo = new THREE.BufferGeometry().setFromPoints(pts);
      var tridentLine = new THREE.LineSegments(tridentGeo, tridentMat);
      tridentLine.position.set(0.5, 0.5, 0.2);
      wg.add(tridentLine);
      var tipGeo = new THREE.SphereGeometry(0.08, 6, 6);
      var tip = new THREE.Mesh(tipGeo, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }));
      tip.position.set(0.5, 1.95, 0.2);
      wg.add(tip);
    } else if (currentWeapon === 3) {
      // SHIELD + MACE
      var shieldGeo = new THREE.BoxGeometry(0.1, 1.0, 0.7);
      var shieldMesh = new THREE.Mesh(shieldGeo, new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
      shieldMesh.position.set(-0.55, 0.9, 0.1);
      wg.add(shieldMesh);
      var maceStickGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
      var maceStick = new THREE.Mesh(maceStickGeo, new THREE.MeshLambertMaterial({ color: 0x5C3A1E }));
      maceStick.position.set(0.5, 0.9, 0.2);
      wg.add(maceStick);
      var maceHeadGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var maceHead = new THREE.Mesh(maceHeadGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
      maceHead.position.set(0.5, 1.35, 0.2);
      wg.add(maceHead);
    } else if (currentWeapon === 4) {
      // BOW
      var bowPts = [];
      for (var bi = 0; bi <= 8; bi++) {
        var ba = (bi / 8) * Math.PI;
        bowPts.push(new THREE.Vector3(Math.cos(ba) * 0.4, Math.sin(ba) * 0.8, 0));
      }
      var bowGeo = new THREE.BufferGeometry().setFromPoints(bowPts);
      var bowLine = new THREE.Line(bowGeo, new THREE.LineBasicMaterial({ color: 0x5C3A1E }));
      bowLine.position.set(0.5, 0.6, 0.2);
      wg.add(bowLine);
      var stringPts = [new THREE.Vector3(0.9, 0.6, 0.2), new THREE.Vector3(0.1, 1.4, 0.2)];
      var stringGeo = new THREE.BufferGeometry().setFromPoints(stringPts);
      var stringLine = new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xDDDDDD }));
      wg.add(stringLine);
    }

    parent.add(wg);
    parent.userData.weaponGroup = wg;
  }

  // ─── Enemy spawning ──────────────────────────────────────────────────────────
  function spawnWave(THREE, wave) {
    enemies = [];
    lion = null;
    waveCleared = false;

    var count = wave < 6 ? wave + 2 : 0; // wave 6 is boss only
    var isBossWave = (wave === 6);

    // Clear old enemies from scene
    // (handled by removing mesh in killEnemy)

    if (isBossWave) {
      spawnBoss(THREE);
      waveEnemiesLeft = 1;
    } else {
      for (var i = 0; i < count; i++) {
        spawnEnemy(THREE, i, wave);
      }
      // Spawn lion on wave 3+
      if (wave >= 3) {
        spawnLion(THREE);
      }
      waveEnemiesLeft = count + (wave >= 3 ? 1 : 0);
    }
  }

  function spawnEnemy(THREE, index, wave) {
    var angle = (index / 6) * Math.PI * 2 + Math.random() * 0.5;
    var spawnRadius = 20;
    var ex = Math.cos(angle) * spawnRadius;
    var ez = Math.sin(angle) * spawnRadius;

    var scale = randRange(1.0, 1.3);
    var hp = Math.floor(randRange(80, 200));
    var weaponType = Math.floor(Math.random() * 4) + 1;
    var speed = randRange(2.5, 4.5);

    var group = new THREE.Group();

    // Body
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xC0392B });
    var bodyGeo = new THREE.BoxGeometry(0.8 * scale, 1.4 * scale, 0.5 * scale);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7 * scale;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6 * scale, 0.6 * scale, 0.6 * scale);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFE0BD }));
    head.position.y = 1.7 * scale;
    group.add(head);

    // Helmet (varied colors)
    var helmColors = [0x888888, 0xFFD700, 0x8B4513, 0x2F4F4F];
    var helmGeo = new THREE.BoxGeometry(0.65 * scale, 0.35 * scale, 0.65 * scale);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: helmColors[index % helmColors.length] }));
    helm.position.y = 2.12 * scale;
    group.add(helm);

    // Add weapon visual to enemy
    addEnemyWeapon(THREE, group, weaponType, scale);

    group.position.set(ex, 0, ez);
    group.castShadow = true;
    scene.add(group);

    var enemyData = {
      mesh: group,
      hp: hp,
      maxHp: hp,
      scale: scale,
      speed: speed,
      weaponType: weaponType,
      x: ex,
      z: ez,
      attackCooldown: randRange(1.5, 3.0),
      attackTimer: 0,
      snared: false,
      snareTimer: 0,
      downed: false,
      dead: false,
      isLion: false,
      isBoss: false,
      animPhase: Math.random() * Math.PI * 2
    };

    enemies.push(enemyData);
  }

  function addEnemyWeapon(THREE, group, weaponType, scale) {
    var wg = new THREE.Group();
    if (weaponType === 1) {
      var bGeo = new THREE.BoxGeometry(0.12 * scale, 0.9 * scale, 0.08 * scale);
      var blade = new THREE.Mesh(bGeo, new THREE.MeshLambertMaterial({ color: 0xAAAAAA }));
      blade.position.set(0.5 * scale, 1.0 * scale, 0.2 * scale);
      wg.add(blade);
    } else if (weaponType === 2) {
      var tGeo = new THREE.SphereGeometry(0.08 * scale, 4, 4);
      var tip = new THREE.Mesh(tGeo, new THREE.MeshLambertMaterial({ color: 0x885500 }));
      tip.position.set(0.5 * scale, 1.5 * scale, 0.2 * scale);
      wg.add(tip);
    } else if (weaponType === 3) {
      var sGeo = new THREE.BoxGeometry(0.1 * scale, 0.9 * scale, 0.65 * scale);
      var shield = new THREE.Mesh(sGeo, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
      shield.position.set(-0.5 * scale, 0.9 * scale, 0.1 * scale);
      wg.add(shield);
    } else if (weaponType === 4) {
      var aGeo = new THREE.SphereGeometry(0.1 * scale, 4, 4);
      var arrowTip = new THREE.Mesh(aGeo, new THREE.MeshLambertMaterial({ color: 0xC0C0C0 }));
      arrowTip.position.set(0.5 * scale, 1.0 * scale, 0.2 * scale);
      wg.add(arrowTip);
    }
    group.add(wg);
  }

  function spawnLion(THREE) {
    var lionGroup = new THREE.Group();

    // Body SphereGeometry r=1
    var bodyGeo = new THREE.SphereGeometry(1, 10, 10);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xC8A04A });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1;
    lionGroup.add(body);

    // Mane BoxGeometry
    var maneGeo = new THREE.BoxGeometry(1.8, 1.8, 1.0);
    var maneMat = new THREE.MeshLambertMaterial({ color: 0x7B5E2A });
    var mane = new THREE.Mesh(maneGeo, maneMat);
    mane.position.set(0, 1.1, 0.3);
    lionGroup.add(mane);

    // Head
    var headGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
    var headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 1.2, 0.9);
    lionGroup.add(headMesh);

    // Legs
    var legMat = new THREE.MeshLambertMaterial({ color: 0xC8A04A });
    var legPositions = [[-0.5, 0.3, -0.5], [0.5, 0.3, -0.5], [-0.5, 0.3, 0.3], [0.5, 0.3, 0.3]];
    for (var li = 0; li < legPositions.length; li++) {
      var legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legPositions[li][0], legPositions[li][1], legPositions[li][2]);
      lionGroup.add(leg);
    }

    lionGroup.position.set(-18, 0, -18);
    scene.add(lionGroup);

    lion = {
      mesh: lionGroup,
      hp: 150,
      maxHp: 150,
      speed: 15,
      x: -18,
      z: -18,
      downed: false,
      dead: false,
      stunned: false,
      stunTimer: 0,
      attackCooldown: 2.0,
      attackTimer: 0,
      isLion: true,
      isBoss: false,
      snared: false,
      snareTimer: 0,
      animPhase: 0
    };
    enemies.push(lion);
  }

  function spawnBoss(THREE) {
    var group = new THREE.Group();
    var sc = 1.5;

    // Armored body layers
    var bodyGeo = new THREE.BoxGeometry(0.9 * sc, 1.5 * sc, 0.6 * sc);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
    body.position.y = 0.75 * sc;
    group.add(body);

    // Chest armor
    var chestGeo = new THREE.BoxGeometry(1.0 * sc, 0.9 * sc, 0.2 * sc);
    var chest = new THREE.Mesh(chestGeo, new THREE.MeshLambertMaterial({ color: 0x2F2F2F }));
    chest.position.set(0, 1.1 * sc, 0.35 * sc);
    group.add(chest);

    // Shoulder pads
    var shoulGeo = new THREE.BoxGeometry(0.4 * sc, 0.35 * sc, 0.4 * sc);
    var shoulMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    [-1, 1].forEach(function (side) {
      var shoul = new THREE.Mesh(shoulGeo, shoulMat);
      shoul.position.set(side * 0.7 * sc, 1.5 * sc, 0.05 * sc);
      group.add(shoul);
    });

    // Head
    var headGeo = new THREE.BoxGeometry(0.7 * sc, 0.7 * sc, 0.7 * sc);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFE0BD }));
    head.position.y = 2.0 * sc;
    group.add(head);

    // Full helmet
    var helmGeo = new THREE.BoxGeometry(0.8 * sc, 0.8 * sc, 0.8 * sc);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
    helm.position.y = 2.45 * sc;
    group.add(helm);

    // Boss weapon (giant sword)
    var bSwordGeo = new THREE.BoxGeometry(0.2 * sc, 1.4 * sc, 0.12 * sc);
    var bSword = new THREE.Mesh(bSwordGeo, new THREE.MeshLambertMaterial({ color: 0xFF4444 }));
    bSword.position.set(0.7 * sc, 1.5 * sc, 0.3 * sc);
    group.add(bSword);

    group.position.set(0, 0, -15);
    scene.add(group);

    var boss = {
      mesh: group,
      hp: 400,
      maxHp: 400,
      scale: sc,
      speed: 4.5,
      weaponType: 1,
      x: 0,
      z: -15,
      attackCooldown: 1.2,
      attackTimer: 0,
      snared: false,
      snareTimer: 0,
      downed: false,
      dead: false,
      isLion: false,
      isBoss: true,
      animPhase: 0
    };
    enemies.push(boss);
    bossEnemy = boss;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'gladiator-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9100',
      'font-family:monospace',
      'font-size:14px',
      'color:#FFD700',
      'background:rgba(0,0,0,0.65)',
      'padding:7px 18px',
      'border:1px solid #8B7355',
      'border-radius:4px',
      'white-space:nowrap',
      'text-shadow:1px 1px 0 #000',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(hudEl);
    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;
    var cs = crowdStatus;
    var favor = Math.round(crowdFavor);
    var wname = weaponNames[currentWeapon] || 'SWORD';
    hudEl.textContent = 'ARENA [WAVE: ' + currentWave + '/' + totalWaves + '] [WEAPON: ' + wname + '] [FAVOR: ' + favor + '%] [HP: ' + Math.max(0, Math.round(playerHP)) + '] | CROWD: ' + cs;
  }

  // ─── Input handling ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toLowerCase();

    if (!active) {
      if (k === 'g') { keysDown['g'] = true; gDownAt = Date.now(); }
      if (k === 'a') { keysDown['a'] = true; aDownAt = Date.now(); }
      checkActivation();
      return;
    }

    keysDown[k] = true;

    // Weapon select
    if (k === '1') { currentWeapon = 1; buildWeaponVisual(window.THREE, playerMesh); updateHUD(); }
    if (k === '2') { currentWeapon = 2; buildWeaponVisual(window.THREE, playerMesh); updateHUD(); }
    if (k === '3') { currentWeapon = 3; buildWeaponVisual(window.THREE, playerMesh); updateHUD(); }
    if (k === '4') { currentWeapon = 4; buildWeaponVisual(window.THREE, playerMesh); updateHUD(); }

    // Net throw
    if (k === 'n' && netCooldown <= 0) {
      throwNet();
    }

    // Combat roll CTRL
    if ((k === 'control') && rollCooldown <= 0 && !rollActive) {
      startRoll();
    }

    // Execution E
    if (k === 'e') {
      tryExecution();
    }

    // Attack space / click
    if (k === ' ') {
      e.preventDefault();
      doAttack();
    }

    // Escape to deactivate
    if (k === 'escape') {
      deactivate();
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    keysDown[k] = false;
    if (!active) {
      if (k === 'g') keysDown['g'] = false;
      if (k === 'a') keysDown['a'] = false;
    }
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0) doAttack();
  }

  function checkActivation() {
    if (keysDown['g'] && keysDown['a']) {
      var now = Date.now();
      if (Math.abs(gDownAt - aDownAt) <= ACTIVATION_WINDOW) {
        activate();
      }
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────────
  function activate() {
    if (active) return;
    active = true;
    initAudio();
    if (!buildScene()) {
      active = false;
      return;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onResize);
    clock.last = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
    playCrowdRoar();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (renderer) {
      renderer.domElement.parentNode && renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer.dispose();
      renderer = null;
    }
    if (hudEl) { hudEl.parentNode && hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('resize', onResize);
    // Reset state
    enemies = [];
    projectiles = [];
    netObjects = [];
    arrowObjects = [];
    crowdFigures = [];
    gateObjects = [];
    pickupObjects = [];
    lion = null;
    playerHP = 100;
    crowdFavor = 50;
    currentWave = 1;
    currentWeapon = 1;
    gameOver = false;
    gameWon = false;
    playerPos = { x: 0, y: 0, z: 10 };
    rollCooldown = 0;
    rollActive = false;
    netCooldown = 0;
    comboBonusMult = 1;
    comboTimer = 0;
    waveEnemiesLeft = 0;
    bossEnemy = null;
    scene = null;
    camera = null;
    playerMesh = null;
    crowdStatus = 'CHEERING';
    keysDown = {};
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Combat ───────────────────────────────────────────────────────────────────
  function doAttack() {
    if (gameOver || gameWon) return;
    if (attackCooldown > 0) return;

    playSwoosh();
    triggerCrowdWave();

    if (currentWeapon === 1) {
      // SWORD – short range lunge, 40 damage
      attackCooldown = 0.55;
      meleeAttack(3.5, 40);
    } else if (currentWeapon === 2) {
      // TRIDENT lunge
      attackCooldown = 0.7;
      meleeAttack(4.5, 35);
    } else if (currentWeapon === 3) {
      // MACE overhead
      attackCooldown = 0.9;
      shieldActive = true;
      meleeAttack(3.0, 45);
      setTimeout(function () { shieldActive = false; }, 300);
    } else if (currentWeapon === 4) {
      // BOW – fire arrow
      attackCooldown = 1.0;
      fireArrow();
    }
  }

  function meleeAttack(range, baseDamage) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) continue;
      var d = dist2d(playerPos, { x: e.x, z: e.z });
      if (d <= range) {
        var dmg = baseDamage * comboBonusMult;
        if (e.snared) dmg *= 2;
        hitEnemy(e, dmg);
      }
    }
  }

  function hitEnemy(e, dmg) {
    if (e.dead) return;
    e.hp -= dmg;
    // Flash red
    if (e.mesh && e.mesh.children[0]) {
      var origColor = e.mesh.children[0].material.color.getHex();
      e.mesh.children[0].material.color.setHex(0xFFFFFF);
      setTimeout(function () {
        if (e.mesh && e.mesh.children[0]) e.mesh.children[0].material.color.setHex(origColor);
      }, 100);
    }

    // Combo
    comboBonusMult = Math.min(comboBonusMult + 0.2, 3.0);
    comboTimer = 3.0;

    if (e.hp <= 0 && !e.downed) {
      if (!e.isBoss || e.snared) {
        killEnemy(e);
      } else {
        // Boss requires net
        e.hp = 1;
      }
    } else if (e.hp < e.maxHp * 0.2 && !e.downed && !e.isLion) {
      e.downed = true;
      if (e.mesh) e.mesh.rotation.z = Math.PI / 2;
    }

    addCrowdFavor(8);
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    waveEnemiesLeft = Math.max(0, waveEnemiesLeft - 1);
    if (e.mesh) {
      scene.remove(e.mesh);
    }
    addCrowdFavor(20);
    playCrowdRoar();
    triggerCrowdWave();

    if (waveEnemiesLeft <= 0 && !waveCleared) {
      waveCleared = true;
      waveTransitionTimer = 3.0;
    }
  }

  function tryExecution() {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead || !e.downed) continue;
      var d = dist2d(playerPos, { x: e.x, z: e.z });
      if (d <= 3.0) {
        // Execution move
        killEnemy(e);
        addCrowdFavor(150);
        playCrowdRoar();
        triggerCrowdWave();
        return;
      }
    }
  }

  function throwNet() {
    if (!window.THREE) return;
    netCooldown = 8.0;

    // Direction player is facing (toward nearest enemy or forward)
    var nearestEnemy = null;
    var nearestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].dead) continue;
      var d = dist2d(playerPos, { x: enemies[i].x, z: enemies[i].z });
      if (d < nearestDist) { nearestDist = d; nearestEnemy = enemies[i]; }
    }

    var dirX = 0, dirZ = -1;
    if (nearestEnemy) {
      var dx = nearestEnemy.x - playerPos.x;
      var dz = nearestEnemy.z - playerPos.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      dirX = dx / len;
      dirZ = dz / len;
    }

    // Create net as LineSegments
    var THREE = window.THREE;
    var netPts = [];
    for (var row = 0; row <= 4; row++) {
      for (var col = 0; col < 4; col++) {
        netPts.push(new THREE.Vector3(col * 0.5 - 1, row * 0.5 - 1, 0));
        netPts.push(new THREE.Vector3((col + 1) * 0.5 - 1, row * 0.5 - 1, 0));
      }
      for (var col2 = 0; col2 <= 4; col2++) {
        if (row < 4) {
          netPts.push(new THREE.Vector3(col2 * 0.5 - 1, row * 0.5 - 1, 0));
          netPts.push(new THREE.Vector3(col2 * 0.5 - 1, (row + 1) * 0.5 - 1, 0));
        }
      }
    }
    var netGeo = new THREE.BufferGeometry().setFromPoints(netPts);
    var netMesh = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x885500 }));
    netMesh.position.set(playerPos.x, 1.5, playerPos.z);
    scene.add(netMesh);

    netObjects.push({
      mesh: netMesh,
      x: playerPos.x,
      z: playerPos.z,
      vx: dirX * 12,
      vz: dirZ * 12,
      life: 1.5,
      maxRange: 8,
      startX: playerPos.x,
      startZ: playerPos.z,
      landed: false
    });
  }

  function fireArrow() {
    if (!window.THREE) return;
    var THREE = window.THREE;

    var nearestEnemy = null;
    var nearestDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].dead) continue;
      var d = dist2d(playerPos, { x: enemies[i].x, z: enemies[i].z });
      if (d < nearestDist) { nearestDist = d; nearestEnemy = enemies[i]; }
    }

    var dirX = 0, dirZ = -1;
    if (nearestEnemy) {
      var dx2 = nearestEnemy.x - playerPos.x;
      var dz2 = nearestEnemy.z - playerPos.z;
      var len2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
      dirX = dx2 / len2;
      dirZ = dz2 / len2;
    }

    var arrowGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var arrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshLambertMaterial({ color: 0x885500 }));
    arrowMesh.position.set(playerPos.x, 1.2, playerPos.z);
    scene.add(arrowMesh);

    arrowObjects.push({
      mesh: arrowMesh,
      x: playerPos.x,
      y: 1.2,
      z: playerPos.z,
      vx: dirX * 50,
      vy: 8,
      vz: dirZ * 50,
      life: 3.0,
      damage: 50,
      arc: true
    });
  }

  // ─── Roll ─────────────────────────────────────────────────────────────────────
  function startRoll() {
    rollActive = true;
    rollTimer = 0.4;
    rollCooldown = 3.0;
    rollDirX = moveDir.x;
    rollDirZ = moveDir.z;
    if (rollDirX === 0 && rollDirZ === 0) {
      rollDirX = 0;
      rollDirZ = -1;
    }
  }

  // ─── Crowd favor ──────────────────────────────────────────────────────────────
  function addCrowdFavor(amount) {
    crowdFavor = clamp(crowdFavor + amount, 0, 100);
    if (crowdFavor >= 100) {
      crowdFavor = 0;
      spawnWeaponPickup();
      crowdStatus = 'ECSTATIC';
    } else if (crowdFavor > 60) {
      crowdStatus = 'CHEERING';
    } else if (crowdFavor > 30) {
      crowdStatus = 'NEUTRAL';
    } else {
      crowdStatus = 'BOOING';
      if (crowdFavor <= 5) {
        triggerGuardAttack();
      }
    }
    updateHUD();
  }

  function spawnWeaponPickup() {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var angle = Math.random() * Math.PI * 2;
    var px = Math.cos(angle) * randRange(3, 10);
    var pz = Math.sin(angle) * randRange(3, 10);

    var pickupGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var pickupMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    var pickup = new THREE.Mesh(pickupGeo, pickupMat);
    pickup.position.set(px, 2.5, pz);
    scene.add(pickup);

    pickupObjects.push({
      mesh: pickup,
      x: px,
      z: pz,
      life: 15.0,
      weaponType: Math.floor(Math.random() * 4) + 1
    });
  }

  function triggerCrowdWave() {
    crowdWaving = true;
    crowdWaveTimer = 2.0;
  }

  function triggerGuardAttack() {
    if (guardAttacking) return;
    guardAttacking = true;
    guardAttackTimer = 5.0;
    crowdStatus = 'HOSTILE';
    playBoos();
  }

  // ─── Game loop ────────────────────────────────────────────────────────────────
  function gameLoop(now) {
    if (!active) return;
    animFrameId = requestAnimationFrame(gameLoop);

    var dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;

    if (gameOver || gameWon) {
      renderScene();
      return;
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateNets(dt);
    updateArrows(dt);
    updatePickups(dt);
    updateCrowd(dt);
    updateWaveTransition(dt);
    updateCamera();
    updateHUD();

    renderScene();
  }

  function renderScene() {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // ─── Player update ────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    // Timers
    if (attackCooldown > 0) attackCooldown -= dt;
    if (netCooldown > 0) netCooldown -= dt;
    if (rollCooldown > 0) rollCooldown -= dt;
    if (comboTimer > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) comboBonusMult = 1;
    }

    var speed = 8.0;
    var inputX = 0, inputZ = 0;
    if (keysDown['arrowleft'] || keysDown['a']) inputX -= 1;
    if (keysDown['arrowright'] || keysDown['d']) inputX += 1;
    if (keysDown['arrowup'] || keysDown['w']) inputZ -= 1;
    if (keysDown['arrowdown'] || keysDown['s']) inputZ += 1;

    var inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ) || 1;
    if (inputX !== 0 || inputZ !== 0) {
      moveDir.x = inputX / inputLen;
      moveDir.z = inputZ / inputLen;
    }

    if (rollActive) {
      rollTimer -= dt;
      playerPos.x += rollDirX * 14 * dt;
      playerPos.z += rollDirZ * 14 * dt;
      if (playerMesh) playerMesh.position.y = Math.sin(rollTimer / 0.4 * Math.PI) * 2;
      if (rollTimer <= 0) {
        rollActive = false;
        if (playerMesh) playerMesh.position.y = 0;
      }
    } else {
      playerPos.x += inputX * speed * dt;
      playerPos.z += inputZ * speed * dt;
    }

    // Keep in arena
    var pDist = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);
    if (pDist > 23) {
      playerPos.x = (playerPos.x / pDist) * 23;
      playerPos.z = (playerPos.z / pDist) * 23;
    }

    if (playerMesh) {
      playerMesh.position.x = playerPos.x;
      playerMesh.position.z = playerPos.z;
      if (!rollActive) playerMesh.position.y = 0;
      if (inputX !== 0 || inputZ !== 0) {
        playerMesh.rotation.y = Math.atan2(inputX, inputZ) + Math.PI;
      }
    }

    // Check pickup collision
    for (var pi = pickupObjects.length - 1; pi >= 0; pi--) {
      var pk = pickupObjects[pi];
      var pkd = dist2d(playerPos, { x: pk.x, z: pk.z });
      if (pkd < 1.5) {
        currentWeapon = pk.weaponType;
        buildWeaponVisual(window.THREE, playerMesh);
        scene.remove(pk.mesh);
        pickupObjects.splice(pi, 1);
        addCrowdFavor(5);
      }
    }

    // Guard attacks
    if (guardAttacking) {
      guardAttackTimer -= dt;
      if (guardAttackTimer <= 0) {
        guardAttacking = false;
        crowdStatus = 'NEUTRAL';
      } else {
        playerHP -= 5 * dt;
      }
    }

    if (playerHP <= 0) {
      gameOver = true;
      showEndMessage('DEFEATED! Press ESC to exit.');
    }
  }

  // ─── Enemy update ─────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) continue;

      // Snare timer
      if (e.snared) {
        e.snareTimer -= dt;
        if (e.snareTimer <= 0) e.snared = false;
      }

      if (e.downed) {
        // Downed – wiggle slightly
        if (e.mesh) {
          e.mesh.rotation.z = Math.PI / 2 + Math.sin(Date.now() * 0.003) * 0.05;
        }
        continue;
      }

      var effectiveSpeed = e.speed;
      if (e.snared) effectiveSpeed *= 0.3;

      if (e.isLion) {
        // Lion behavior
        if (e.stunned) {
          e.stunTimer -= dt;
          if (e.stunTimer <= 0) e.stunned = false;
        } else {
          var ldx = playerPos.x - e.x;
          var ldz = playerPos.z - e.z;
          var ld = Math.sqrt(ldx * ldx + ldz * ldz) || 1;
          e.x += (ldx / ld) * effectiveSpeed * dt;
          e.z += (ldz / ld) * effectiveSpeed * dt;
          e.mesh.position.x = e.x;
          e.mesh.position.z = e.z;
          e.mesh.rotation.y = Math.atan2(ldx, ldz);

          // Animate legs
          e.animPhase += dt * 8;
          if (e.mesh.children[3]) e.mesh.children[3].rotation.x = Math.sin(e.animPhase) * 0.5;
          if (e.mesh.children[4]) e.mesh.children[4].rotation.x = Math.sin(e.animPhase + Math.PI) * 0.5;

          if (ld < 2.0) {
            e.attackTimer += dt;
            if (e.attackTimer >= e.attackCooldown) {
              e.attackTimer = 0;
              playerHP -= 18;
              addCrowdFavor(-10);
              screenShake();
            }
          }
        }
      } else {
        // Regular gladiator AI
        var edx = playerPos.x - e.x;
        var edz = playerPos.z - e.z;
        var ed = Math.sqrt(edx * edx + edz * edz) || 1;

        var attackRange = (e.weaponType === 4) ? 15 : 3.5;

        if (ed > attackRange) {
          e.x += (edx / ed) * effectiveSpeed * dt;
          e.z += (edz / ed) * effectiveSpeed * dt;
        }

        // Keep in arena
        var enemyArenaD = Math.sqrt(e.x * e.x + e.z * e.z);
        if (enemyArenaD > 23) {
          e.x = (e.x / enemyArenaD) * 23;
          e.z = (e.z / enemyArenaD) * 23;
        }

        if (e.mesh) {
          e.mesh.position.x = e.x;
          e.mesh.position.z = e.z;
          e.mesh.rotation.y = Math.atan2(edx, edz);
        }

        // Enemy attack
        if (ed <= attackRange + 0.5) {
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            enemyAttackPlayer(e);
          }
        } else {
          e.attackTimer = 0;
        }

        // Bob animation
        e.animPhase += dt * 3;
        if (e.mesh) e.mesh.position.y = Math.abs(Math.sin(e.animPhase)) * 0.1;
      }
    }
  }

  function enemyAttackPlayer(e) {
    var baseDmg = 10 + e.weaponType * 3;
    var dmg = baseDmg;

    // Shield blocks 80% damage if player has shield+mace
    if (currentWeapon === 3 && shieldActive) {
      dmg *= 0.2;
    }

    if (rollActive) dmg = 0; // dodge during roll

    playerHP -= dmg;
    if (dmg > 0) {
      addCrowdFavor(-5);
      screenShake();
    }
  }

  function screenShake() {
    if (!renderer) return;
    var orig = { x: renderer.domElement.style.left, y: renderer.domElement.style.top };
    renderer.domElement.style.left = (Math.random() * 8 - 4) + 'px';
    renderer.domElement.style.top = (Math.random() * 8 - 4) + 'px';
    setTimeout(function () {
      if (renderer) {
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '0';
      }
    }, 80);
  }

  // ─── Nets update ─────────────────────────────────────────────────────────────
  function updateNets(dt) {
    for (var i = netObjects.length - 1; i >= 0; i--) {
      var n = netObjects[i];
      n.life -= dt;
      if (n.life <= 0 || n.landed) {
        if (n.life <= 0) { scene.remove(n.mesh); netObjects.splice(i, 1); }
        continue;
      }

      var travelX = n.x - n.startX;
      var travelZ = n.z - n.startZ;
      var traveled = Math.sqrt(travelX * travelX + travelZ * travelZ);
      if (traveled >= n.maxRange) {
        n.landed = true;
        continue;
      }

      n.x += n.vx * dt;
      n.z += n.vz * dt;
      n.mesh.position.x = n.x;
      n.mesh.position.z = n.z;
      n.mesh.position.y = 1.5 + Math.sin(traveled * 0.5) * 2;
      n.mesh.rotation.x += dt * 4;

      // Check hit enemies
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.dead || e.snared) continue;
        var nd = dist2d({ x: n.x, z: n.z }, { x: e.x, z: e.z });
        if (nd < 2.0) {
          e.snared = true;
          e.snareTimer = 5.0;
          n.landed = true;
          n.life = 0;
          // If boss, allow killing
          if (e.isBoss) {
            e.hp = 1;
            e.downed = true;
            if (e.mesh) e.mesh.rotation.z = Math.PI / 2;
          }
          // If lion, stun
          if (e.isLion) {
            e.stunned = true;
            e.stunTimer = 3.0;
          }
          break;
        }
      }
    }
  }

  // ─── Arrows update ───────────────────────────────────────────────────────────
  function updateArrows(dt) {
    for (var i = arrowObjects.length - 1; i >= 0; i--) {
      var ar = arrowObjects[i];
      ar.life -= dt;
      if (ar.life <= 0) {
        scene.remove(ar.mesh);
        arrowObjects.splice(i, 1);
        continue;
      }
      ar.x += ar.vx * dt;
      ar.z += ar.vz * dt;
      if (ar.arc) {
        ar.vy -= 9.8 * dt;
        ar.y += ar.vy * dt;
      }
      ar.mesh.position.set(ar.x, ar.y, ar.z);

      if (ar.y < 0) {
        scene.remove(ar.mesh);
        arrowObjects.splice(i, 1);
        continue;
      }

      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.dead) continue;
        var d = dist2d({ x: ar.x, z: ar.z }, { x: e.x, z: e.z });
        if (d < 1.2) {
          var dmg = ar.damage * comboBonusMult;
          if (e.snared) dmg *= 2;
          hitEnemy(e, dmg);
          scene.remove(ar.mesh);
          arrowObjects.splice(i, 1);
          break;
        }
      }
    }
  }

  // ─── Pickups update ───────────────────────────────────────────────────────────
  function updatePickups(dt) {
    for (var i = pickupObjects.length - 1; i >= 0; i--) {
      var pk = pickupObjects[i];
      pk.life -= dt;
      if (pk.life <= 0) {
        scene.remove(pk.mesh);
        pickupObjects.splice(i, 1);
        continue;
      }
      // Bob and spin
      pk.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      pk.mesh.rotation.y += dt * 2;
    }
  }

  // ─── Crowd update ────────────────────────────────────────────────────────────
  function updateCrowd(dt) {
    if (crowdWaveTimer > 0) crowdWaveTimer -= dt;
    var doWave = crowdWaveTimer > 0;

    for (var i = 0; i < crowdFigures.length; i++) {
      var fig = crowdFigures[i];
      var arm = fig.userData.arm;
      if (!arm) continue;
      if (doWave) {
        var waveAmt = Math.sin(Date.now() * 0.005 + fig.userData.wavePhase) * 0.8;
        arm.rotation.z = fig.userData.baseArmRotZ + waveAmt;
      } else {
        arm.rotation.z = fig.userData.baseArmRotZ;
      }
    }
  }

  // ─── Wave transition ─────────────────────────────────────────────────────────
  function updateWaveTransition(dt) {
    if (!waveCleared) return;
    waveTransitionTimer -= dt;
    if (waveTransitionTimer <= 0) {
      waveCleared = false;
      currentWave++;
      if (currentWave > totalWaves) {
        gameWon = true;
        showEndMessage('VICTORY! Champion of the Colosseum! ESC to exit.');
        return;
      }
      // Clear remaining objects
      for (var i = 0; i < netObjects.length; i++) scene.remove(netObjects[i].mesh);
      for (var j = 0; j < arrowObjects.length; j++) scene.remove(arrowObjects[j].mesh);
      netObjects = [];
      arrowObjects = [];
      spawnWave(window.THREE, currentWave);
    }
  }

  // ─── Camera update ────────────────────────────────────────────────────────────
  function updateCamera() {
    if (!camera) return;
    var targetX = playerPos.x * 0.3;
    var targetZ = 38 + playerPos.z * 0.2;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(playerPos.x * 0.2, 0, playerPos.z * 0.2);
  }

  // ─── End screen ──────────────────────────────────────────────────────────────
  function showEndMessage(msg) {
    var el = document.createElement('div');
    el.id = 'gladiator-end';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:9200',
      'font-family:monospace',
      'font-size:32px',
      'font-weight:bold',
      'color:#FFD700',
      'background:rgba(0,0,0,0.8)',
      'padding:24px 40px',
      'border:3px solid #8B0000',
      'border-radius:8px',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
  }

  // ─── Init key listeners for activation (before activate()) ───────────────────
  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
  }

  init();

  return {
    activate: activate,
    deactivate: deactivate,
    isActive: function () { return active; }
  };

}());
