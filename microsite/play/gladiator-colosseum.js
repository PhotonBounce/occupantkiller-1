window.GladiatorColosseum = (function () {
  'use strict';

  // ─── Activation key tracking ─────────────────────────────────────────────────
  var keysDown = {};
  var gDownAt = 0;
  var cDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;

  // ─── Three.js handles ────────────────────────────────────────────────────────
  var scene, camera, renderer, animFrameId;

  // ─── Game state ──────────────────────────────────────────────────────────────
  var playerHP = 200;
  var playerMaxHP = 200;
  var playerPos = { x: 0, y: 0, z: 10 };
  var playerVelX = 0;
  var playerVelZ = 0;
  var playerSlowTimer = 0;    // net slowdown timer
  var playerKnockdown = false;
  var playerKnockdownTimer = 0;
  var playerShield = false;   // player has a shield pickup
  var playerShieldHP = 100;

  var currentRound = 0;       // 0 = waiting to start
  var totalRounds = 5;
  var roundActive = false;
  var roundStartTimer = 0;    // countdown before round starts
  var waitingForRoundStart = false;
  var roundClearTimer = 0;
  var roundCleared = false;
  var gameOver = false;
  var gameWon = false;
  var score = 0;
  var crowdFavor = 50;        // 0-100

  // ─── Entity arrays ────────────────────────────────────────────────────────────
  var enemies = [];
  var projectiles = [];       // generic projectile list (arrows, tridents)
  var netObjects = [];
  var crowdFigures = [];
  var pickupObjects = [];
  var trapDoors = [];
  var bears = [];
  var overheadLights = [];    // 3 PointLights whose intensity we modulate

  // ─── Player mesh ─────────────────────────────────────────────────────────────
  var playerMesh = null;
  var playerWeaponMesh = null;  // current held weapon visual

  // ─── Clock ───────────────────────────────────────────────────────────────────
  var clock = { last: 0 };

  // ─── Combat timers ───────────────────────────────────────────────────────────
  var attackCooldown = 0;
  var moveDir = { x: 0, z: -1 };

  // ─── HUD element ─────────────────────────────────────────────────────────────
  var hudEl = null;
  var msgEl = null;

  // ─── Audio ───────────────────────────────────────────────────────────────────
  var audioCtx = null;

  // ─── Bonus weapon gate (golden weapon at max favor) ──────────────────────────
  var bonusWeaponSpawned = false;

  // ─── Emperor thumb extra enemies flag ────────────────────────────────────────
  var emperorThumbTimer = 0;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randAngle() { return Math.random() * Math.PI * 2; }

  // ─── Audio helpers ───────────────────────────────────────────────────────────
  function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }

  function playNoise(freq, dur, vol, type) {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    osc.type = type || 'sawtooth';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, audioCtx.currentTime + dur);
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(vol || 0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function playCrowdRoar() {
    if (!audioCtx) return;
    var sz = Math.floor(audioCtx.sampleRate * 0.7);
    var buf = audioCtx.createBuffer(1, sz, audioCtx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var filt = audioCtx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 180;
    filt.Q.value = 0.4;
    src.connect(filt);
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.5, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
    filt.connect(g);
    g.connect(audioCtx.destination);
    src.start();
  }

  function playClang() { playNoise(600, 0.12, 0.25, 'square'); }
  function playSwoosh() { playNoise(380, 0.14, 0.18, 'sawtooth'); }
  function playRoar() { playCrowdRoar(); }

  // ─── Scene build ─────────────────────────────────────────────────────────────
  function buildScene() {
    var THREE = window.THREE;
    if (!THREE) { console.warn('GladiatorColosseum: THREE not found'); return false; }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7799BB);
    scene.fog = new THREE.Fog(0x7799BB, 50, 110);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 30, 42);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'gladiator-colosseum-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    // Ambient
    var ambient = new THREE.AmbientLight(0xFFEECC, 0.5);
    scene.add(ambient);

    // 3 overhead PointLights (0xFFCC88)
    var lightPositions = [
      { x: 0, y: 18, z: 0 },
      { x: -12, y: 16, z: -8 },
      { x: 12, y: 16, z: -8 }
    ];
    overheadLights = [];
    for (var li = 0; li < lightPositions.length; li++) {
      var pl = new THREE.PointLight(0xFFCC88, 1.2, 60);
      pl.position.set(lightPositions[li].x, lightPositions[li].y, lightPositions[li].z);
      pl.castShadow = true;
      scene.add(pl);
      overheadLights.push(pl);
    }

    buildArena(THREE);
    buildPlayer(THREE);
    buildHUD();
    buildMessage();

    showRoundMessage('PRESS ENTER TO BEGIN ROUND 1 / 5');
    waitingForRoundStart = true;
    currentRound = 1;
    roundStartTimer = 3.0;

    return true;
  }

  // ─── Arena ───────────────────────────────────────────────────────────────────
  function buildArena(THREE) {
    // Sand floor CylinderGeometry r=18 h=0.5 (0xCC9944)
    var floorGeo = new THREE.CylinderGeometry(18, 18, 0.5, 48);
    var floorMat = new THREE.MeshLambertMaterial({ color: 0xCC9944 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // Surrounding wall CylinderGeometry r=20 h=8 (0x998855)
    var wallGeo = new THREE.CylinderGeometry(20, 20, 8, 32, 1, true);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x998855, side: 2 });
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 4;
    scene.add(wall);

    // Outer wall (visible exterior)
    var outerGeo = new THREE.CylinderGeometry(20.4, 20.4, 8, 32, 1, true);
    var outer = new THREE.Mesh(outerGeo, new THREE.MeshLambertMaterial({ color: 0x887744, side: 0 }));
    outer.position.y = 4;
    scene.add(outer);

    // Spectator stands – BoxGeometry tiers around the wall
    for (var si = 0; si < 16; si++) {
      var ang = (si / 16) * Math.PI * 2;
      var sx = Math.cos(ang) * 21.5;
      var sz = Math.sin(ang) * 21.5;

      // Stand block
      var standGeo = new THREE.BoxGeometry(4, 3, 2);
      var standMat = new THREE.MeshLambertMaterial({ color: 0x776644 });
      var stand = new THREE.Mesh(standGeo, standMat);
      stand.position.set(sx, 5.5, sz);
      stand.rotation.y = -ang;
      scene.add(stand);

      // Spectator row
      for (var ci = 0; ci < 3; ci++) {
        var figGeo = new THREE.BoxGeometry(0.5, 0.9, 0.4);
        var figColors = [0xCC5533, 0x3366AA, 0xCCCC33, 0x44AA44];
        var figMat = new THREE.MeshLambertMaterial({ color: figColors[ci % figColors.length] });
        var fig = new THREE.Mesh(figGeo, figMat);
        var figOff = (ci - 1) * 1.2;
        fig.position.set(sx + Math.cos(ang + Math.PI / 2) * figOff, 7.8, sz + Math.sin(ang + Math.PI / 2) * figOff);
        fig.rotation.y = ang + Math.PI;

        // Head
        var hGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
        var head = new THREE.Mesh(hGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
        head.position.y = 0.64;
        fig.add(head);

        // Arm for waving
        var armGeo = new THREE.BoxGeometry(0.18, 0.6, 0.18);
        var arm = new THREE.Mesh(armGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
        arm.position.set(0.35, 0.2, 0);
        arm.rotation.z = -0.3;
        fig.add(arm);
        fig.userData.arm = arm;
        fig.userData.baseArmZ = -0.3;
        fig.userData.wavePhase = Math.random() * Math.PI * 2;
        scene.add(fig);
        crowdFigures.push(fig);
      }
    }

    // 4 Gates BoxGeometry (0x776644) N/S/E/W at ground level
    var gateDirs = [
      { x: 0, z: -18, ry: 0 },
      { x: 0, z: 18, ry: Math.PI },
      { x: 18, z: 0, ry: -Math.PI / 2 },
      { x: -18, z: 0, ry: Math.PI / 2 }
    ];
    for (var gi = 0; gi < 4; gi++) {
      var gd = gateDirs[gi];
      var gateGeo = new THREE.BoxGeometry(3.5, 5, 0.6);
      var gateMat = new THREE.MeshLambertMaterial({ color: 0x776644 });
      var gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(gd.x, 2.5, gd.z);
      gate.rotation.y = gd.ry;
      scene.add(gate);
    }

    // 4 Trap doors BoxGeometry (0x776633) in the sand
    var trapPositions = [
      { x: 6, z: 6 }, { x: -6, z: 6 }, { x: 6, z: -6 }, { x: -6, z: -6 }
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tp = trapPositions[ti];
      var trapGeo = new THREE.BoxGeometry(2.5, 0.15, 2.5);
      var trapMat = new THREE.MeshLambertMaterial({ color: 0x776633 });
      var trap = new THREE.Mesh(trapGeo, trapMat);
      trap.position.set(tp.x, 0.02, tp.z);
      scene.add(trap);
      trapDoors.push({
        mesh: trap,
        x: tp.x,
        z: tp.z,
        open: false,
        openTimer: 0,
        bearSpawned: false
      });
    }
  }

  // ─── Player ───────────────────────────────────────────────────────────────────
  function buildPlayer(THREE) {
    var g = new THREE.Group();

    // Legs
    var legMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
    var legGeo = new THREE.BoxGeometry(0.3, 0.7, 0.3);
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.22, 0.35, 0);
    g.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.22, 0.35, 0);
    g.add(legR);

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4466AA });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    g.add(body);

    // Chest armor
    var chestGeo = new THREE.BoxGeometry(0.85, 0.6, 0.2);
    var chest = new THREE.Mesh(chestGeo, new THREE.MeshLambertMaterial({ color: 0x888899 }));
    chest.position.set(0, 1.25, 0.28);
    g.add(chest);

    // Head
    var headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
    head.position.y = 1.95;
    g.add(head);

    // Helmet
    var helmGeo = new THREE.BoxGeometry(0.62, 0.3, 0.62);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0xBBBBCC }));
    helm.position.y = 2.28;
    g.add(helm);

    // Default sword
    var swordGeo = new THREE.BoxGeometry(0.1, 0.8, 0.08);
    var sword = new THREE.Mesh(swordGeo, new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));
    sword.position.set(0.52, 1.1, 0.2);
    g.add(sword);
    g.userData.weaponMesh = sword;

    g.position.set(playerPos.x, 0, playerPos.z);
    g.castShadow = true;
    scene.add(g);
    playerMesh = g;
  }

  // ─── Enemy factories ──────────────────────────────────────────────────────────

  // Round 1 – Retiarius gladiator with trident
  function spawnRetiarius(THREE) {
    var ang = randAngle();
    var r = 14;
    var ex = Math.cos(ang) * r;
    var ez = Math.sin(ang) * r;
    var g = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.75, 1.2, 0.45);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x996633 }));
    body.position.y = 0.9;
    g.add(body);

    var headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
    head.position.y = 1.85;
    g.add(head);

    // Trident handle CylinderGeometry
    var handleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6);
    var handle = new THREE.Mesh(handleGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
    handle.position.set(0.55, 1.5, 0.2);
    g.add(handle);

    // 3 prongs (CylinderGeometry)
    for (var pi = 0; pi < 3; pi++) {
      var po = (pi - 1) * 0.18;
      var pGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4);
      var prong = new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color: 0x888888 }));
      prong.position.set(0.55 + po, 2.28, 0.2);
      g.add(prong);
    }

    g.position.set(ex, 0, ez);
    g.castShadow = true;
    scene.add(g);

    var e = {
      mesh: g, hp: 80, maxHp: 80, speed: 3.5,
      x: ex, z: ez,
      attackCooldown: 2.0, attackTimer: 0,
      type: 'retiarius',
      netCooldown: 8.0, netTimer: 0,
      snared: false, snareTimer: 0,
      downed: false, dead: false,
      animPhase: randAngle()
    };
    enemies.push(e);
    return e;
  }

  // Round 2 – Lion
  function spawnLion(THREE) {
    var ang = randAngle();
    var r = 13;
    var ex = Math.cos(ang) * r;
    var ez = Math.sin(ang) * r;
    var g = new THREE.Group();

    // Body CylinderGeometry (approx box as spec says CylinderGeometry body 2x0.8x1)
    var bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    var bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0xCC8822 }));
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.set(0, 0.8, 0);
    g.add(bodyMesh);

    // Head SphereGeometry
    var headGeo = new THREE.SphereGeometry(0.45, 8, 8);
    var headMesh = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xCC8822 }));
    headMesh.position.set(0, 1.0, 0.9);
    g.add(headMesh);

    // Mane
    var maneGeo = new THREE.SphereGeometry(0.55, 8, 8);
    var mane = new THREE.Mesh(maneGeo, new THREE.MeshLambertMaterial({ color: 0x885500 }));
    mane.position.set(0, 1.0, 0.7);
    g.add(mane);

    // Legs
    var legMat = new THREE.MeshLambertMaterial({ color: 0xBB7711 });
    var lpos = [[-0.4, 0.3, 0.6], [0.4, 0.3, 0.6], [-0.4, 0.3, -0.4], [0.4, 0.3, -0.4]];
    for (var li = 0; li < 4; li++) {
      var lGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
      var leg = new THREE.Mesh(lGeo, legMat);
      leg.position.set(lpos[li][0], lpos[li][1], lpos[li][2]);
      g.add(leg);
    }

    g.position.set(ex, 0, ez);
    g.castShadow = true;
    scene.add(g);

    var e = {
      mesh: g, hp: 120, maxHp: 120, speed: 6,
      x: ex, z: ez,
      attackCooldown: 1.5, attackTimer: 0,
      type: 'lion',
      lunging: false, lungeTimer: 0, lungeVx: 0, lungeVz: 0,
      pouncing: false, pounceTimer: 0,
      snared: false, snareTimer: 0,
      downed: false, dead: false,
      animPhase: randAngle()
    };
    enemies.push(e);
    return e;
  }

  // Round 3 – Chariot
  function spawnChariot(THREE) {
    var g = new THREE.Group();

    // Chariot body BoxGeometry 3x1.5x2 (0x664422)
    var bodyGeo = new THREE.BoxGeometry(3, 1.5, 2);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x664422 }));
    body.position.y = 0.75;
    g.add(body);

    // Wheels
    for (var wi = 0; wi < 2; wi++) {
      var side = wi === 0 ? -1.6 : 1.6;
      var wGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 10);
      var wheel = new THREE.Mesh(wGeo, new THREE.MeshLambertMaterial({ color: 0x443322 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side, 0.7, 0);
      g.add(wheel);
    }

    // Horse pair – CylinderGeometry (0x885533)
    for (var hi = 0; hi < 2; hi++) {
      var hoff = hi === 0 ? -0.8 : 0.8;
      var hGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 6);
      var horse = new THREE.Mesh(hGeo, new THREE.MeshLambertMaterial({ color: 0x885533 }));
      horse.rotation.x = Math.PI / 2;
      horse.position.set(hoff, 1.0, -2.2);
      g.add(horse);

      // Horse head
      var hhGeo = new THREE.BoxGeometry(0.35, 0.5, 0.5);
      var hHead = new THREE.Mesh(hhGeo, new THREE.MeshLambertMaterial({ color: 0x774422 }));
      hHead.position.set(hoff, 1.5, -3.4);
      g.add(hHead);
    }

    // Archer on chariot
    var archerGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
    var archer = new THREE.Mesh(archerGeo, new THREE.MeshLambertMaterial({ color: 0x664444 }));
    archer.position.set(0, 2.2, 0.2);
    g.add(archer);

    g.position.set(14, 0, 0);
    g.castShadow = true;
    scene.add(g);

    var e = {
      mesh: g, hp: 200, maxHp: 200, speed: 12,
      x: 14, z: 0,
      orbitAngle: 0,
      orbitRadius: 13,
      attackCooldown: 1.2, attackTimer: 0,
      type: 'chariot',
      snared: false, snareTimer: 0,
      downed: false, dead: false,
      animPhase: 0
    };
    enemies.push(e);
    return e;
  }

  // Round 4 – Murmillo heavy gladiator
  function spawnMurmillo(THREE) {
    var ang = randAngle();
    var r = 12;
    var ex = Math.cos(ang) * r;
    var ez = Math.sin(ang) * r;
    var g = new THREE.Group();

    // Body BoxGeometry (0x888866)
    var bodyGeo = new THREE.BoxGeometry(0.9, 1.4, 0.55);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x888866 }));
    body.position.y = 1.0;
    g.add(body);

    var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
    head.position.y = 2.0;
    g.add(head);

    // Heavy helmet
    var helmGeo = new THREE.BoxGeometry(0.75, 0.55, 0.75);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x666655 }));
    helm.position.y = 2.4;
    g.add(helm);

    // Tower shield BoxGeometry (0x777755)
    var shieldGeo = new THREE.BoxGeometry(0.15, 1.6, 0.9);
    var shield = new THREE.Mesh(shieldGeo, new THREE.MeshLambertMaterial({ color: 0x777755 }));
    shield.position.set(-0.65, 0.9, 0.05);
    g.add(shield);
    g.userData.shieldMesh = shield;

    // Gladius sword
    var gladGeo = new THREE.BoxGeometry(0.1, 0.65, 0.08);
    var gladius = new THREE.Mesh(gladGeo, new THREE.MeshLambertMaterial({ color: 0xCCCCAA }));
    gladius.position.set(0.6, 1.1, 0.2);
    g.add(gladius);

    g.position.set(ex, 0, ez);
    g.castShadow = true;
    scene.add(g);

    var e = {
      mesh: g, hp: 180, maxHp: 180, speed: 2.5,
      x: ex, z: ez,
      attackCooldown: 1.8, attackTimer: 0,
      type: 'murmillo',
      shieldUp: true,           // blocks frontal
      snared: false, snareTimer: 0,
      downed: false, dead: false,
      animPhase: randAngle()
    };
    enemies.push(e);
    return e;
  }

  // Round 5 – Champion Spartacus
  function spawnSpartacus(THREE) {
    var g = new THREE.Group();
    var sc = 1.5;

    var bodyGeo = new THREE.BoxGeometry(0.9 * sc, 1.5 * sc, 0.6 * sc);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x882222 }));
    body.position.y = 0.9 * sc;
    g.add(body);

    var headGeo = new THREE.BoxGeometry(0.65 * sc, 0.65 * sc, 0.65 * sc);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDAA }));
    head.position.y = 2.1 * sc;
    g.add(head);

    var helmGeo = new THREE.BoxGeometry(0.78 * sc, 0.55 * sc, 0.78 * sc);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x660000 }));
    helm.position.y = 2.52 * sc;
    g.add(helm);

    // Shield (starts with one)
    var shGeo = new THREE.BoxGeometry(0.14 * sc, 1.6 * sc, 0.95 * sc);
    var shMesh = new THREE.Mesh(shGeo, new THREE.MeshLambertMaterial({ color: 0x771111 }));
    shMesh.position.set(-0.7 * sc, 1.0 * sc, 0.05 * sc);
    g.add(shMesh);
    g.userData.spartShield = shMesh;

    // Dual blades
    for (var bi = 0; bi < 2; bi++) {
      var side = bi === 0 ? 0.7 : -0.7;
      var bGeo = new THREE.BoxGeometry(0.12 * sc, 1.0 * sc, 0.09 * sc);
      var blade = new THREE.Mesh(bGeo, new THREE.MeshLambertMaterial({ color: 0xDDDDCC }));
      blade.position.set(side * sc, 1.2 * sc, 0.25 * sc);
      g.add(blade);
    }

    g.position.set(0, 0, -12);
    g.castShadow = true;
    scene.add(g);

    var e = {
      mesh: g, hp: 500, maxHp: 500, speed: 4.0, scale: sc,
      x: 0, z: -12,
      attackCooldown: 0.33,   // 3 attacks per second
      attackTimer: 0,
      type: 'spartacus',
      hasShield: true,
      shieldHP: 150,
      snared: false, snareTimer: 0,
      downed: false, dead: false,
      animPhase: 0
    };
    enemies.push(e);
    return e;
  }

  // Bear from trapdoor – CylinderGeometry (0x663322)
  function spawnBear(THREE, tx, tz) {
    var g = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.55, 0.65, 1.4, 8);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x663322 }));
    body.position.y = 0.9;
    g.add(body);

    var headGeo = new THREE.SphereGeometry(0.42, 8, 8);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0x5A2A18 }));
    head.position.set(0, 1.85, 0.35);
    g.add(head);

    var earGeo = new THREE.SphereGeometry(0.13, 6, 6);
    var earMat = new THREE.MeshLambertMaterial({ color: 0x5A2A18 });
    var earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.25, 2.2, 0.28);
    g.add(earL);
    var earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.25, 2.2, 0.28);
    g.add(earR);

    g.position.set(tx, -1, tz);
    g.castShadow = true;
    scene.add(g);

    var b = {
      mesh: g, hp: 80, maxHp: 80, speed: 5,
      x: tx, z: tz, y: -1,
      rising: true,
      attackCooldown: 1.8, attackTimer: 0,
      dead: false,
      animPhase: randAngle()
    };
    bears.push(b);
  }

  // ─── Round management ─────────────────────────────────────────────────────────
  function startRound(THREE) {
    waitingForRoundStart = false;
    roundActive = true;
    roundCleared = false;
    clearMessage();
    enemies = [];
    bears = [];
    bonusWeaponSpawned = false;
    emperorThumbTimer = 0;

    if (currentRound === 1) {
      // 4 retiarii
      for (var i = 0; i < 4; i++) spawnRetiarius(THREE);
    } else if (currentRound === 2) {
      // 2 lions
      spawnLion(THREE);
      spawnLion(THREE);
    } else if (currentRound === 3) {
      // 1 chariot
      spawnChariot(THREE);
    } else if (currentRound === 4) {
      // 2 murmillos
      spawnMurmillo(THREE);
      spawnMurmillo(THREE);
    } else if (currentRound === 5) {
      // Champion Spartacus
      spawnSpartacus(THREE);
    }

    playCrowdRoar();
    updateHUD();
  }

  function checkRoundClear() {
    if (!roundActive || roundCleared) return;
    var alive = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].dead) alive++;
    }
    for (var j = 0; j < bears.length; j++) {
      if (!bears[j].dead) alive++;
    }
    if (alive === 0) {
      roundCleared = true;
      roundActive = false;
      roundClearTimer = 3.0;
      playCrowdRoar();
      spawnRoundPickups();
      if (currentRound < totalRounds) {
        showRoundMessage('ROUND ' + currentRound + ' CLEARED! PRESS ENTER FOR ROUND ' + (currentRound + 1));
      } else {
        showRoundMessage('VICTORY! CHAMPION OF THE COLOSSEUM! ESC to exit.');
        gameWon = true;
      }
      waitingForRoundStart = !gameWon;
    }
  }

  function spawnRoundPickups() {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var types = [
      { color: 0x888866, label: 'shield' },
      { color: 0x888844, label: 'spear' },
      { color: 0x446644, label: 'net' }
    ];
    for (var i = 0; i < 3; i++) {
      var ang = (i / 3) * Math.PI * 2;
      var r = randRange(5, 11);
      var px = Math.cos(ang) * r;
      var pz = Math.sin(ang) * r;
      var pGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var pMesh = new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color: types[i].color }));
      pMesh.position.set(px, 1.5, pz);
      scene.add(pMesh);
      pickupObjects.push({ mesh: pMesh, x: px, z: pz, life: 20, type: types[i].label });
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'gc-hud';
    hudEl.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%',
      'transform:translateX(-50%)',
      'z-index:9100', 'font-family:monospace', 'font-size:13px',
      'color:#FFD700', 'background:rgba(0,0,0,0.7)',
      'padding:6px 16px', 'border:1px solid #776644',
      'border-radius:3px', 'white-space:nowrap',
      'text-shadow:1px 1px 0 #000', 'pointer-events:none'
    ].join(';');
    document.body.appendChild(hudEl);
    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;
    var alive = 0;
    for (var i = 0; i < enemies.length; i++) { if (!enemies[i].dead) alive++; }
    for (var j = 0; j < bears.length; j++) { if (!bears[j].dead) alive++; }
    var rStr = roundActive ? currentRound + '/5' : (gameWon ? 'DONE' : currentRound + '/5');
    hudEl.textContent =
      'COLOSSEUM [ROUND: ' + rStr + '] ' +
      '[CROWD FAVOR: ' + Math.round(crowdFavor) + '%] ' +
      '[ENEMIES: ' + alive + '] | SCORE: ' + score;
  }

  function buildMessage() {
    msgEl = document.createElement('div');
    msgEl.id = 'gc-msg';
    msgEl.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:9200', 'font-family:monospace', 'font-size:24px',
      'font-weight:bold', 'color:#FFD700',
      'background:rgba(0,0,0,0.82)',
      'padding:18px 36px', 'border:2px solid #882222',
      'border-radius:6px', 'text-align:center',
      'pointer-events:none', 'display:none'
    ].join(';');
    document.body.appendChild(msgEl);
  }

  function showRoundMessage(txt) {
    if (!msgEl) return;
    msgEl.textContent = txt;
    msgEl.style.display = 'block';
  }

  function clearMessage() {
    if (!msgEl) return;
    msgEl.style.display = 'none';
  }

  // ─── Input ────────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toLowerCase();

    if (!active) {
      if (k === 'g') { keysDown['g'] = true; gDownAt = Date.now(); }
      if (k === 'c') { keysDown['c'] = true; cDownAt = Date.now(); }
      checkActivation();
      return;
    }

    keysDown[k] = true;

    if (k === 'escape') { deactivate(); return; }

    if ((k === 'enter') && waitingForRoundStart) {
      e.preventDefault();
      startRound(window.THREE);
      return;
    }

    if (k === ' ') {
      e.preventDefault();
      doAttack();
    }

    if (k === 'n') {
      throwNet();
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    keysDown[k] = false;
    if (!active) {
      if (k === 'g') keysDown['g'] = false;
      if (k === 'c') keysDown['c'] = false;
    }
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0) doAttack();
  }

  function checkActivation() {
    if (keysDown['g'] && keysDown['c']) {
      var gap = Math.abs(gDownAt - cDownAt);
      if (gap <= ACTIVATION_WINDOW) {
        activate();
      }
    }
  }

  // ─── Activate / Deactivate ───────────────────────────────────────────────────
  function activate() {
    if (active) return;
    active = true;
    initAudio();
    if (!buildScene()) { active = false; return; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onResize);
    clock.last = performance.now();
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (renderer) {
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      renderer.dispose();
      renderer = null;
    }
    if (hudEl) { if (hudEl.parentNode) hudEl.parentNode.removeChild(hudEl); hudEl = null; }
    if (msgEl) { if (msgEl.parentNode) msgEl.parentNode.removeChild(msgEl); msgEl = null; }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('resize', onResize);
    resetState();
  }

  function resetState() {
    enemies = []; projectiles = []; netObjects = [];
    crowdFigures = []; pickupObjects = []; trapDoors = [];
    bears = []; overheadLights = [];
    playerHP = 200; playerMaxHP = 200;
    playerPos = { x: 0, y: 0, z: 10 };
    playerSlowTimer = 0; playerKnockdown = false; playerKnockdownTimer = 0;
    playerShield = false; playerShieldHP = 100;
    currentRound = 0; totalRounds = 5;
    roundActive = false; roundStartTimer = 0;
    waitingForRoundStart = false; roundClearTimer = 0; roundCleared = false;
    gameOver = false; gameWon = false;
    score = 0; crowdFavor = 50;
    attackCooldown = 0; moveDir = { x: 0, z: -1 };
    bonusWeaponSpawned = false; emperorThumbTimer = 0;
    playerMesh = null; playerWeaponMesh = null;
    scene = null; camera = null; keysDown = {};
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
    if (!roundActive) return;
    if (attackCooldown > 0) return;
    attackCooldown = 0.5;
    playSwoosh();

    var attackRange = 3.5;
    var baseDmg = 35;
    var styleKill = false;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) continue;
      var d = dist2d(playerPos, { x: e.x, z: e.z });
      if (d <= attackRange) {
        // Aerial hit bonus
        if (playerPos.y > 0.5) { baseDmg = Math.round(baseDmg * 1.5); styleKill = true; }
        hitEnemy(e, baseDmg, styleKill);
      }
    }
    for (var j = 0; j < bears.length; j++) {
      var bear = bears[j];
      if (bear.dead) continue;
      var db = dist2d(playerPos, { x: bear.x, z: bear.z });
      if (db <= attackRange) {
        hitBear(bear, baseDmg);
      }
    }
    updateHUD();
  }

  function throwNet() {
    if (!roundActive || !window.THREE) return;
    var THREE = window.THREE;
    var nearestE = null;
    var nearestD = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].dead) continue;
      var d = dist2d(playerPos, { x: enemies[i].x, z: enemies[i].z });
      if (d < nearestD) { nearestD = d; nearestE = enemies[i]; }
    }
    var dirX = moveDir.x, dirZ = moveDir.z;
    if (nearestE) {
      var dx = nearestE.x - playerPos.x;
      var dz = nearestE.z - playerPos.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      dirX = dx / len; dirZ = dz / len;
    }
    var pts = [];
    for (var row = 0; row <= 4; row++) {
      for (var col = 0; col < 4; col++) {
        pts.push(new THREE.Vector3(col * 0.45 - 0.9, row * 0.45 - 0.9, 0));
        pts.push(new THREE.Vector3((col + 1) * 0.45 - 0.9, row * 0.45 - 0.9, 0));
      }
      for (var col2 = 0; col2 <= 4; col2++) {
        if (row < 4) {
          pts.push(new THREE.Vector3(col2 * 0.45 - 0.9, row * 0.45 - 0.9, 0));
          pts.push(new THREE.Vector3(col2 * 0.45 - 0.9, (row + 1) * 0.45 - 0.9, 0));
        }
      }
    }
    var netGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var netMesh = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x446644 }));
    netMesh.position.set(playerPos.x, 1.4, playerPos.z);
    scene.add(netMesh);
    netObjects.push({
      mesh: netMesh, x: playerPos.x, z: playerPos.z,
      vx: dirX * 13, vz: dirZ * 13,
      life: 2.0, maxRange: 9,
      startX: playerPos.x, startZ: playerPos.z,
      landed: false
    });
  }

  function hitEnemy(e, dmg, styleKill) {
    if (e.dead) return;

    // Murmillo shield blocks frontal
    if (e.type === 'murmillo' && e.shieldUp) {
      var toPlayerX = playerPos.x - e.x;
      var toPlayerZ = playerPos.z - e.z;
      var facingX = Math.sin(e.mesh ? e.mesh.rotation.y : 0);
      var facingZ = Math.cos(e.mesh ? e.mesh.rotation.y : 0);
      var dot = toPlayerX * facingX + toPlayerZ * facingZ;
      // If enemy is facing player, shield absorbs most damage
      if (dot > 0.3) { dmg = Math.round(dmg * 0.15); }
    }

    // Spartacus shield
    if (e.type === 'spartacus' && e.hasShield && e.shieldHP > 0) {
      e.shieldHP -= dmg;
      if (e.shieldHP <= 0) {
        e.hasShield = false;
        if (e.mesh && e.mesh.userData.spartShield) {
          e.mesh.remove(e.mesh.userData.spartShield);
        }
        addCrowdFavor(20);
        score += 100;
      }
      flashMesh(e.mesh, 0xFFFFFF);
      return;
    }

    e.hp -= dmg;
    flashMesh(e.mesh, 0xFFFFFF);
    playClang();

    // Disarm style kill
    if (styleKill) { addCrowdFavor(15); score += 50; }

    if (e.hp <= 0 && !e.downed) {
      if (e.type === 'murmillo' || e.type === 'spartacus') {
        e.downed = true;
        if (e.mesh) e.mesh.rotation.z = Math.PI / 2;
        addCrowdFavor(10);
        score += 50;
      } else {
        killEnemy(e, styleKill);
      }
    }
    addCrowdFavor(5);
    updateHUD();
  }

  function hitBear(bear, dmg) {
    if (bear.dead) return;
    bear.hp -= dmg;
    if (bear.hp <= 0) {
      bear.dead = true;
      if (bear.mesh && scene) scene.remove(bear.mesh);
      score += 75;
      addCrowdFavor(12);
    }
  }

  function killEnemy(e, stylish) {
    if (e.dead) return;
    e.dead = true;
    if (e.mesh && scene) scene.remove(e.mesh);
    score += 200;
    if (stylish) {
      addCrowdFavor(30);
      score += 150;
    } else {
      addCrowdFavor(20);
    }
    playRoar();
    checkRoundClear();
    updateHUD();
  }

  function flashMesh(mesh, color) {
    if (!mesh || !mesh.children || !mesh.children[0]) return;
    var c0 = mesh.children[0];
    if (!c0.material || !c0.material.color) return;
    var orig = c0.material.color.getHex();
    c0.material.color.setHex(color);
    setTimeout(function () {
      if (c0.material) c0.material.color.setHex(orig);
    }, 90);
  }

  // ─── Crowd favor & lights ────────────────────────────────────────────────────
  function addCrowdFavor(amt) {
    crowdFavor = clamp(crowdFavor + amt, 0, 100);
    // Modulate overhead light intensity based on favor
    var brightness = 0.8 + (crowdFavor / 100) * 1.4;
    for (var i = 0; i < overheadLights.length; i++) {
      overheadLights[i].intensity = brightness;
    }
    // Low favor: emperor's thumb spawns 2 extra enemies
    if (crowdFavor < 20 && roundActive && emperorThumbTimer <= 0) {
      emperorThumbTimer = 15.0;
      spawnExtraEnemies();
    }
    // Max favor: open bonus weapon
    if (crowdFavor >= 100 && !bonusWeaponSpawned) {
      bonusWeaponSpawned = true;
      spawnBonusWeapon();
    }
    updateHUD();
  }

  function spawnExtraEnemies() {
    if (!window.THREE || !roundActive) return;
    for (var i = 0; i < 2; i++) {
      spawnRetiarius(window.THREE);
    }
    playCrowdRoar();
  }

  function spawnBonusWeapon() {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var bGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    var bMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00, emissive: 0xFFCC00, emissiveIntensity: 0.7 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(0, 1.5, 0);
    scene.add(bMesh);
    pickupObjects.push({ mesh: bMesh, x: 0, z: 0, life: 30, type: 'bonus_blade' });
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

    // Auto-start round countdown
    if (waitingForRoundStart) {
      roundStartTimer -= dt;
      if (roundStartTimer <= 0 && !roundActive && !roundCleared) {
        startRound(window.THREE);
      }
    }

    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateNets(dt);
    updateBears(dt);
    updatePickups(dt);
    updateTrapDoors(dt);
    updateCrowd(dt);
    updateCamera();
    updateHUD();
    renderScene();
  }

  function renderScene() {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // ─── Player update ────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (attackCooldown > 0) attackCooldown -= dt;
    if (playerSlowTimer > 0) playerSlowTimer -= dt;
    if (emperorThumbTimer > 0) emperorThumbTimer -= dt;

    if (playerKnockdown) {
      playerKnockdownTimer -= dt;
      if (playerKnockdownTimer <= 0) {
        playerKnockdown = false;
        if (playerMesh) playerMesh.rotation.z = 0;
      }
      return;
    }

    var speed = playerSlowTimer > 0 ? 8.0 * 0.4 : 8.0;

    var ix = 0, iz = 0;
    if (keysDown['arrowleft'] || keysDown['a']) ix -= 1;
    if (keysDown['arrowright'] || keysDown['d']) ix += 1;
    if (keysDown['arrowup'] || keysDown['w']) iz -= 1;
    if (keysDown['arrowdown'] || keysDown['s']) iz += 1;

    var ilen = Math.sqrt(ix * ix + iz * iz) || 1;
    if (ix !== 0 || iz !== 0) { moveDir.x = ix / ilen; moveDir.z = iz / ilen; }

    playerPos.x += ix * speed * dt;
    playerPos.z += iz * speed * dt;

    // Arena boundary r=17
    var pd = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);
    if (pd > 17) {
      playerPos.x = (playerPos.x / pd) * 17;
      playerPos.z = (playerPos.z / pd) * 17;
    }

    if (playerMesh) {
      playerMesh.position.x = playerPos.x;
      playerMesh.position.z = playerPos.z;
      if (ix !== 0 || iz !== 0) playerMesh.rotation.y = Math.atan2(ix, iz) + Math.PI;
    }

    // Trapdoor check
    for (var ti = 0; ti < trapDoors.length; ti++) {
      var trap = trapDoors[ti];
      if (!trap.open) {
        var td = dist2d(playerPos, { x: trap.x, z: trap.z });
        if (td < 1.5) {
          trap.open = true;
          trap.openTimer = 0;
          if (trap.mesh) {
            trap.mesh.rotation.x = Math.PI / 2;
            trap.mesh.position.y = -0.5;
          }
        }
      }
    }

    // Pickup check
    for (var pi = pickupObjects.length - 1; pi >= 0; pi--) {
      var pk = pickupObjects[pi];
      if (dist2d(playerPos, { x: pk.x, z: pk.z }) < 1.5) {
        if (pk.type === 'shield') { playerShield = true; playerShieldHP = 120; score += 20; }
        else if (pk.type === 'bonus_blade') { score += 500; addCrowdFavor(20); }
        else { score += 20; }
        if (scene) scene.remove(pk.mesh);
        pickupObjects.splice(pi, 1);
      }
    }

    if (playerHP <= 0) {
      gameOver = true;
      showRoundMessage('DEFEATED IN THE COLOSSEUM! ESC to exit.');
    }
  }

  // ─── Enemy update ─────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) continue;

      // Snare tick
      if (e.snared) {
        e.snareTimer -= dt;
        if (e.snareTimer <= 0) e.snared = false;
      }

      if (e.downed) {
        if (e.mesh) e.mesh.rotation.z = Math.PI / 2 + Math.sin(Date.now() * 0.002) * 0.04;
        continue;
      }

      var effectiveSpeed = e.speed * (e.snared ? 0.25 : 1);

      if (e.type === 'retiarius') {
        updateRetiarius(e, dt, effectiveSpeed);
      } else if (e.type === 'lion') {
        updateLion(e, dt, effectiveSpeed);
      } else if (e.type === 'chariot') {
        updateChariot(e, dt);
      } else if (e.type === 'murmillo') {
        updateMurmillo(e, dt, effectiveSpeed);
      } else if (e.type === 'spartacus') {
        updateSpartacus(e, dt, effectiveSpeed);
      }
    }
  }

  function updateRetiarius(e, dt, spd) {
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;

    if (d > 3.5) {
      e.x += (dx / d) * spd * dt;
      e.z += (dz / d) * spd * dt;
      clampToArena(e, 17);
    }

    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      e.mesh.rotation.y = Math.atan2(dx, dz);
      e.animPhase += dt * 3;
      e.mesh.position.y = Math.abs(Math.sin(e.animPhase)) * 0.08;
    }

    // Net throw (slows player 60% for 4s)
    e.netTimer += dt;
    if (e.netTimer >= e.netCooldown && d < 10) {
      e.netTimer = 0;
      throwEnemyNet(e);
    }

    // Melee attack
    if (d <= 4.0) {
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown) {
        e.attackTimer = 0;
        dealPlayerDmg(12, false);
      }
    } else {
      e.attackTimer = 0;
    }
  }

  function throwEnemyNet(e) {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;

    var nGeo = new THREE.BoxGeometry(0.8, 0.05, 0.8);
    var nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x886644 }));
    nMesh.position.set(e.x, 1.2, e.z);
    scene.add(nMesh);

    projectiles.push({
      mesh: nMesh,
      x: e.x, y: 1.2, z: e.z,
      vx: (dx / len) * 9, vy: 4, vz: (dz / len) * 9,
      life: 2.5,
      type: 'enemy_net',
      owner: e
    });
  }

  function updateLion(e, dt, spd) {
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;

    // Lunge at 5u range
    if (d < 5 && !e.lunging && e.attackTimer <= 0) {
      e.lunging = true;
      e.lungeTimer = 0.4;
      e.lungeVx = (dx / d) * 14;
      e.lungeVz = (dz / d) * 14;
    }

    if (e.lunging) {
      e.lungeTimer -= dt;
      e.x += e.lungeVx * dt;
      e.z += e.lungeVz * dt;
      if (e.lungeTimer <= 0) {
        e.lunging = false;
        e.attackTimer = e.attackCooldown;
        // Pounce – check if player hit
        var lunged = dist2d(playerPos, { x: e.x, z: e.z });
        if (lunged < 2.0) {
          playerKnockdown = true;
          playerKnockdownTimer = 1.5;
          if (playerMesh) playerMesh.rotation.z = Math.PI / 2;
          dealPlayerDmg(22, false);
        }
      }
    } else {
      if (e.attackTimer > 0) e.attackTimer -= dt;
      if (d > 2.0) {
        e.x += (dx / d) * spd * dt;
        e.z += (dz / d) * spd * dt;
      }
    }

    clampToArena(e, 17);

    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      e.mesh.rotation.y = Math.atan2(dx, dz);
      e.animPhase += dt * 6;
    }
  }

  function updateChariot(e, dt) {
    // Circles arena at 12u/s
    e.orbitAngle += (e.speed / e.orbitRadius) * dt;
    e.x = Math.cos(e.orbitAngle) * e.orbitRadius;
    e.z = Math.sin(e.orbitAngle) * e.orbitRadius;

    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      e.mesh.rotation.y = -e.orbitAngle + Math.PI / 2;
    }

    // Run player over
    var d = dist2d(playerPos, { x: e.x, z: e.z });
    if (d < 2.8 && !e.snared) {
      dealPlayerDmg(25, true);
    }

    // Archer fires arrows at player
    e.attackTimer += dt;
    if (e.attackTimer >= e.attackCooldown) {
      e.attackTimer = 0;
      fireChariotArrow(e);
    }
  }

  function fireChariotArrow(e) {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;
    var aGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var aMesh = new THREE.Mesh(aGeo, new THREE.MeshLambertMaterial({ color: 0x884422 }));
    aMesh.position.set(e.x, 2.5, e.z);
    scene.add(aMesh);
    projectiles.push({
      mesh: aMesh,
      x: e.x, y: 2.5, z: e.z,
      vx: (dx / d) * 18, vy: 3, vz: (dz / d) * 18,
      life: 2.0,
      type: 'chariot_arrow',
      owner: e
    });
  }

  function updateMurmillo(e, dt, spd) {
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;

    if (d > 2.5) {
      e.x += (dx / d) * spd * dt;
      e.z += (dz / d) * spd * dt;
      clampToArena(e, 17);
    }

    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      e.mesh.rotation.y = Math.atan2(dx, dz);
    }

    if (d <= 3.0) {
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown) {
        e.attackTimer = 0;
        var blocked = playerShield && playerShieldHP > 0;
        if (blocked) { playerShieldHP -= 20; if (playerShieldHP <= 0) playerShield = false; }
        else dealPlayerDmg(18, false);
      }
    } else {
      e.attackTimer = 0;
    }
  }

  function updateSpartacus(e, dt, spd) {
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;

    if (d > 2.0) {
      e.x += (dx / d) * spd * dt;
      e.z += (dz / d) * spd * dt;
      clampToArena(e, 17);
    }

    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      e.mesh.rotation.y = Math.atan2(dx, dz);
      e.animPhase += dt * 4;
      e.mesh.position.y = Math.abs(Math.sin(e.animPhase)) * 0.05;
    }

    if (d <= 2.8) {
      e.attackTimer += dt;
      // 3 attacks per second (cooldown 0.33)
      if (e.attackTimer >= e.attackCooldown) {
        e.attackTimer = 0;
        var blocked = playerShield && playerShieldHP > 0;
        if (blocked) { playerShieldHP -= 35; if (playerShieldHP <= 0) playerShield = false; }
        else dealPlayerDmg(28, false);
      }
    } else {
      e.attackTimer = 0;
    }
  }

  function clampToArena(e, r) {
    var ed = Math.sqrt(e.x * e.x + e.z * e.z);
    if (ed > r) { e.x = (e.x / ed) * r; e.z = (e.z / ed) * r; }
  }

  // ─── Projectile update ────────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (scene) scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.vy -= 9.8 * dt;
      p.y += p.vy * dt;
      if (p.y < 0) {
        if (scene) scene.remove(p.mesh);
        projectiles.splice(i, 1);
        continue;
      }
      p.mesh.position.set(p.x, p.y, p.z);

      // Check hit on player
      var pd = dist2d(playerPos, { x: p.x, z: p.z });
      if (pd < 1.0 && Math.abs(p.y - 1.0) < 1.5) {
        if (p.type === 'enemy_net') {
          playerSlowTimer = 4.0;
          addCrowdFavor(-8);
        } else if (p.type === 'chariot_arrow') {
          dealPlayerDmg(15, false);
        } else if (p.type === 'crowd_net') {
          playerSlowTimer = 3.0;
        }
        if (scene) scene.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }
  }

  // ─── Net update ───────────────────────────────────────────────────────────────
  function updateNets(dt) {
    for (var i = netObjects.length - 1; i >= 0; i--) {
      var n = netObjects[i];
      n.life -= dt;
      if (n.life <= 0 || n.landed) {
        if (n.life <= 0 && scene) scene.remove(n.mesh);
        if (n.landed && n.life <= 0 && scene) scene.remove(n.mesh);
        netObjects.splice(i, 1);
        continue;
      }

      var tx = n.x - n.startX;
      var tz = n.z - n.startZ;
      var traveled = Math.sqrt(tx * tx + tz * tz);
      if (traveled >= n.maxRange) { n.landed = true; continue; }

      n.x += n.vx * dt;
      n.z += n.vz * dt;
      n.mesh.position.x = n.x;
      n.mesh.position.z = n.z;
      n.mesh.position.y = 1.4 + Math.sin(traveled * 0.5) * 2;
      n.mesh.rotation.x += dt * 5;

      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (e.dead || e.snared) continue;
        if (dist2d({ x: n.x, z: n.z }, { x: e.x, z: e.z }) < 1.8) {
          e.snared = true;
          e.snareTimer = 5.0;
          n.landed = true;
          n.life = 0.01;
          addCrowdFavor(15);
          score += 50;
          // Style kill: net throw = disarm
          if (!e.downed && e.hp > 0) { score += 30; addCrowdFavor(10); }
          break;
        }
      }
    }
  }

  // ─── Bears update ─────────────────────────────────────────────────────────────
  function updateBears(dt) {
    for (var i = 0; i < bears.length; i++) {
      var b = bears[i];
      if (b.dead) continue;

      // Rise from trapdoor
      if (b.rising) {
        b.y += 2.5 * dt;
        if (b.y >= 0) { b.y = 0; b.rising = false; }
        if (b.mesh) b.mesh.position.y = b.y;
        continue;
      }

      var dx = playerPos.x - b.x;
      var dz = playerPos.z - b.z;
      var d = Math.sqrt(dx * dx + dz * dz) || 1;

      if (d > 2.0) {
        b.x += (dx / d) * b.speed * dt;
        b.z += (dz / d) * b.speed * dt;
      }

      if (b.mesh) {
        b.mesh.position.x = b.x;
        b.mesh.position.z = b.z;
        b.mesh.rotation.y = Math.atan2(dx, dz);
        b.animPhase += dt * 5;
        b.mesh.position.y = Math.abs(Math.sin(b.animPhase)) * 0.06;
      }

      if (d <= 2.2) {
        b.attackTimer += dt;
        if (b.attackTimer >= b.attackCooldown) {
          b.attackTimer = 0;
          dealPlayerDmg(20, false);
        }
      } else {
        b.attackTimer = 0;
      }
    }
  }

  // ─── Pickup update ────────────────────────────────────────────────────────────
  function updatePickups(dt) {
    for (var i = pickupObjects.length - 1; i >= 0; i--) {
      var pk = pickupObjects[i];
      pk.life -= dt;
      if (pk.life <= 0) {
        if (scene) scene.remove(pk.mesh);
        pickupObjects.splice(i, 1);
        continue;
      }
      pk.mesh.position.y = 0.8 + Math.sin(Date.now() * 0.003 + i) * 0.25;
      pk.mesh.rotation.y += dt * 2;
    }
  }

  // ─── Trapdoor update ──────────────────────────────────────────────────────────
  function updateTrapDoors(dt) {
    for (var i = 0; i < trapDoors.length; i++) {
      var trap = trapDoors[i];
      if (trap.open && !trap.bearSpawned) {
        trap.openTimer += dt;
        if (trap.openTimer >= 0.5 && window.THREE) {
          trap.bearSpawned = true;
          spawnBear(window.THREE, trap.x, trap.z);
          // Reset trapdoor after 12s
          setTimeout(function (t) {
            return function () {
              t.open = false;
              t.bearSpawned = false;
              t.openTimer = 0;
              if (t.mesh) {
                t.mesh.rotation.x = 0;
                t.mesh.position.y = 0.02;
              }
            };
          }(trap), 12000);
        }
      }
    }
  }

  // ─── Crowd update ────────────────────────────────────────────────────────────
  function updateCrowd(dt) {
    var doWave = crowdFavor > 55;
    var t = Date.now();
    for (var i = 0; i < crowdFigures.length; i++) {
      var fig = crowdFigures[i];
      var arm = fig.userData.arm;
      if (!arm) continue;
      if (doWave) {
        arm.rotation.z = fig.userData.baseArmZ + Math.sin(t * 0.005 + fig.userData.wavePhase) * 0.9;
      } else {
        arm.rotation.z = fig.userData.baseArmZ;
      }
    }

    // Crowd throws nets at player when favor < 25
    if (crowdFavor < 25 && roundActive && window.THREE) {
      if (Math.random() < dt * 0.15) {
        throwCrowdNet();
      }
    }
  }

  function throwCrowdNet() {
    if (!window.THREE) return;
    var THREE = window.THREE;
    var ang = randAngle();
    var r = 19;
    var sx = Math.cos(ang) * r;
    var sz = Math.sin(ang) * r;
    var dx = playerPos.x - sx;
    var dz = playerPos.z - sz;
    var dl = Math.sqrt(dx * dx + dz * dz) || 1;

    var nGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    var nMesh = new THREE.Mesh(nGeo, new THREE.MeshLambertMaterial({ color: 0x667744 }));
    nMesh.position.set(sx, 7.5, sz);
    scene.add(nMesh);

    projectiles.push({
      mesh: nMesh, x: sx, y: 7.5, z: sz,
      vx: (dx / dl) * 10, vy: -2, vz: (dz / dl) * 10,
      life: 2.5, type: 'crowd_net', owner: null
    });
  }

  // ─── Camera update ────────────────────────────────────────────────────────────
  function updateCamera() {
    if (!camera) return;
    var tx = playerPos.x * 0.25;
    var tz = 42 + playerPos.z * 0.2;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.z += (tz - camera.position.z) * 0.06;
    camera.lookAt(playerPos.x * 0.15, 0, playerPos.z * 0.1);
  }

  // ─── Player damage ────────────────────────────────────────────────────────────
  function dealPlayerDmg(dmg, knockback) {
    if (playerShield && playerShieldHP > 0) {
      playerShieldHP -= dmg * 0.5;
      if (playerShieldHP <= 0) playerShield = false;
      dmg = Math.round(dmg * 0.4);
    }
    playerHP -= dmg;
    addCrowdFavor(-4);
    screenShake();
    if (playerHP <= 0) {
      gameOver = true;
      showRoundMessage('DEFEATED IN THE COLOSSEUM! ESC to exit.');
    }
  }

  function screenShake() {
    if (!renderer) return;
    renderer.domElement.style.left = (Math.random() * 8 - 4) + 'px';
    renderer.domElement.style.top = (Math.random() * 8 - 4) + 'px';
    setTimeout(function () {
      if (renderer) {
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '0';
      }
    }, 75);
  }

  // ─── Init key listeners ───────────────────────────────────────────────────────
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
