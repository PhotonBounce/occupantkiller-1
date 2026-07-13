window.SamuraiDuel = (function () {
  'use strict';

  // ─── Activation key tracking ──────────────────────────────────────────────────
  var keysDown = {};
  var sDownAt = 0;
  var dDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;
  var scene, camera, renderer, animFrameId;

  // ─── Game state ──────────────────────────────────────────────────────────────
  var playerHP = 200;
  var playerMaxHP = 200;
  var honor = 0;
  var maxHonor = 100;
  var currentEncounter = 1;
  var totalEncounters = 5;
  var stance = 'ATTACK'; // ATTACK or PARRY
  var parryActive = false;
  var parryTimer = 0;
  var parryWindow = 0.8;
  var attackCooldown = 0;
  var rollActive = false;
  var rollTimer = 0;
  var rollDirX = 0;
  var rollDirZ = 0;
  var gameOver = false;
  var gameWon = false;
  var clock = { last: 0 };

  // ─── Player ───────────────────────────────────────────────────────────────────
  var playerMesh = null;
  var playerPos = { x: 0, y: 0, z: 8 };
  var moveDir = { x: 0, z: 0 };

  // ─── Enemies ─────────────────────────────────────────────────────────────────
  var currentEnemy = null;
  var enemyDefeated = false;
  var encTransitionTimer = 0;
  var encTransitionActive = false;

  // ─── Encounter 2 (archer) ─────────────────────────────────────────────────────
  var archerArrows = [];

  // ─── Encounter 3 (heavy samurai) ─────────────────────────────────────────────
  // nothing extra needed

  // ─── Encounter 4 (ninja) ─────────────────────────────────────────────────────
  var ninjaTeleportTimer = 0;

  // ─── Encounter 5 (daimyo boss) ────────────────────────────────────────────────
  var daimyoPhase = 0; // 0=approach, 1=combo, 2=sweep, 3=flurry
  var daimyoPhaseTimer = 0;
  var daimyoDefeated = false;

  // ─── Environment hazards ─────────────────────────────────────────────────────
  var ricePaperWalls = [];
  var braziers = [];
  var koiPondBounds = { x: -6, z: 4, w: 5, d: 3 }; // centered area
  var brazierKnockedOver = false;

  // ─── Secret scroll ────────────────────────────────────────────────────────────
  var secretScrollMesh = null;
  var secretScrollVisible = false;
  var scrollLoreEl = null;

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  var hudEl = null;

  // ─── Audio ───────────────────────────────────────────────────────────────────
  var audioCtx = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }

  function inKoiPond(px, pz) {
    return px > koiPondBounds.x - koiPondBounds.w / 2 &&
           px < koiPondBounds.x + koiPondBounds.w / 2 &&
           pz > koiPondBounds.z - koiPondBounds.d / 2 &&
           pz < koiPondBounds.z + koiPondBounds.d / 2;
  }

  // ─── Audio ───────────────────────────────────────────────────────────────────
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }

  function playSwoosh() {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.18);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  }

  function playClash() {
    if (!audioCtx) return;
    var bufSize = audioCtx.sampleRate * 0.2;
    var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  }

  function playHit() {
    if (!audioCtx) return;
    var osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }

  // ─── Scene setup ─────────────────────────────────────────────────────────────
  function buildScene() {
    var THREE = window.THREE;
    if (!THREE) { console.warn('SamuraiDuel: THREE not found'); return false; }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x334455);
    scene.fog = new THREE.Fog(0x334455, 40, 100);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'samurai-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    // Lighting
    var ambient = new THREE.AmbientLight(0xfff0cc, 0.5);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xffeecc, 1.0);
    sun.position.set(15, 30, 10);
    sun.castShadow = true;
    scene.add(sun);
    var moonLight = new THREE.DirectionalLight(0x8899cc, 0.4);
    moonLight.position.set(-10, 20, -15);
    scene.add(moonLight);

    buildEnvironment(THREE);
    buildPlayer(THREE);
    buildHUD();
    spawnEncounter(THREE, currentEncounter);

    return true;
  }

  // ─── Environment ─────────────────────────────────────────────────────────────
  function buildEnvironment(THREE) {
    // Ground courtyard
    var groundGeo = new THREE.PlaneGeometry(60, 60);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Feudal castle BoxGeometry 30x15x25
    var castleMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var castleGeo = new THREE.BoxGeometry(30, 15, 25);
    var castle = new THREE.Mesh(castleGeo, castleMat);
    castle.position.set(0, 7.5, -22);
    castle.castShadow = true;
    castle.receiveShadow = true;
    scene.add(castle);

    // Castle roof
    var roofGeo = new THREE.BoxGeometry(32, 2, 27);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 16, -22);
    scene.add(roof);

    // Castle wall walkway for archer
    var wallTopGeo = new THREE.BoxGeometry(30, 2, 2);
    var wallTop = new THREE.Mesh(wallTopGeo, castleMat);
    wallTop.position.set(0, 15.5, -9);
    scene.add(wallTop);

    // Cherry trees – trunk CylinderGeometry + blossom SphereGeometry
    var treePositions = [[-12, 0, -5], [12, 0, -5], [-16, 0, 5], [16, 0, 5]];
    for (var ti = 0; ti < treePositions.length; ti++) {
      var tp = treePositions[ti];
      var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x884455 });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tp[0], 2, tp[2]);
      trunk.castShadow = true;
      scene.add(trunk);

      var blossomGeo = new THREE.SphereGeometry(2.2, 10, 10);
      var blossomMat = new THREE.MeshLambertMaterial({ color: 0xFFCCDD });
      var blossom = new THREE.Mesh(blossomGeo, blossomMat);
      blossom.position.set(tp[0], 5.5, tp[2]);
      scene.add(blossom);
    }

    // Stone bridge CylinderGeometry over water
    var bridgeGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8, 1, false);
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, 0.4, 12);
    bridge.castShadow = true;
    scene.add(bridge);

    // Water PlaneGeometry under bridge
    var waterGeo = new THREE.PlaneGeometry(10, 4);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x114466, transparent: true, opacity: 0.8 });
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.05, 12);
    scene.add(water);

    // Koi pond PlaneGeometry
    var koiGeo = new THREE.PlaneGeometry(5, 3);
    var koiMat = new THREE.MeshLambertMaterial({ color: 0x224466, transparent: true, opacity: 0.85 });
    var koi = new THREE.Mesh(koiGeo, koiMat);
    koi.rotation.x = -Math.PI / 2;
    koi.position.set(koiPondBounds.x, 0.06, koiPondBounds.z);
    scene.add(koi);

    // Rice paper walls LineSegments that can be cut
    buildRicePaperWalls(THREE);

    // Burning braziers CylinderGeometry
    buildBraziers(THREE);

    // Secret scroll BoxGeometry (hidden until max honor)
    var scrollGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    var scrollMat = new THREE.MeshLambertMaterial({ color: 0xFFCC44 });
    secretScrollMesh = new THREE.Mesh(scrollGeo, scrollMat);
    secretScrollMesh.position.set(8, 1.5, -8);
    secretScrollMesh.visible = false;
    scene.add(secretScrollMesh);
  }

  function buildRicePaperWalls(THREE) {
    ricePaperWalls = [];
    var wallDefs = [
      { x: -5, z: 0, rotY: 0 },
      { x: 5, z: -2, rotY: Math.PI / 4 }
    ];
    for (var wi = 0; wi < wallDefs.length; wi++) {
      var wd = wallDefs[wi];
      var pts = [];
      // Grid of rice paper wall LineSegments
      var W = 3, H = 4;
      for (var row = 0; row <= H; row++) {
        pts.push(new THREE.Vector3(0, row, 0));
        pts.push(new THREE.Vector3(W, row, 0));
      }
      for (var col = 0; col <= W; col++) {
        pts.push(new THREE.Vector3(col, 0, 0));
        pts.push(new THREE.Vector3(col, H, 0));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(pts);
      var mat = new THREE.LineBasicMaterial({ color: 0xEEDDCC });
      var wall = new THREE.LineSegments(geo, mat);
      wall.position.set(wd.x - W / 2, 0, wd.z);
      wall.rotation.y = wd.rotY;
      scene.add(wall);
      ricePaperWalls.push({ mesh: wall, x: wd.x, z: wd.z, cut: false });
    }
  }

  function buildBraziers(THREE) {
    braziers = [];
    var brazierPositions = [[-8, 0, -3], [8, 0, -3]];
    for (var bi = 0; bi < brazierPositions.length; bi++) {
      var bp = brazierPositions[bi];
      var brazierGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8);
      var brazierMat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
      var brazier = new THREE.Mesh(brazierGeo, brazierMat);
      brazier.position.set(bp[0], 0.75, bp[2]);
      scene.add(brazier);

      var flamePt = new THREE.PointLight(0xFF6600, 1.5, 8);
      flamePt.position.set(bp[0], 2, bp[2]);
      scene.add(flamePt);

      braziers.push({ mesh: brazier, light: flamePt, x: bp[0], z: bp[2], knockedOver: false });
    }
  }

  // ─── Player ───────────────────────────────────────────────────────────────────
  function buildPlayer(THREE) {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFDDCC });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.7;
    group.add(head);

    // Helmet kabuto
    var helmGeo = new THREE.BoxGeometry(0.65, 0.5, 0.65);
    var helmMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 2.05;
    group.add(helm);

    // Katana blade LineSegments
    var bladePts = [
      new THREE.Vector3(0.5, 0.8, 0.2),
      new THREE.Vector3(0.5, 2.2, 0.2)
    ];
    var bladeGeo = new THREE.BufferGeometry().setFromPoints(bladePts);
    var bladeMat = new THREE.LineBasicMaterial({ color: 0xCCCCDD });
    var blade = new THREE.LineSegments(bladeGeo, bladeMat);
    group.add(blade);
    group.userData.blade = blade;

    group.position.set(playerPos.x, playerPos.y, playerPos.z);
    group.castShadow = true;
    scene.add(group);
    playerMesh = group;
  }

  // ─── Encounter spawning ───────────────────────────────────────────────────────
  function spawnEncounter(THREE, enc) {
    currentEnemy = null;
    enemyDefeated = false;
    archerArrows = [];
    ninjaTeleportTimer = 4;
    daimyoPhase = 0;
    daimyoPhaseTimer = 0;
    daimyoDefeated = false;

    if (enc === 1) spawnAshigaru(THREE);
    else if (enc === 2) spawnArcher(THREE);
    else if (enc === 3) spawnHeavySamurai(THREE);
    else if (enc === 4) spawnNinja(THREE);
    else if (enc === 5) spawnDaimyo(THREE);
  }

  // D1: Ashigaru
  function spawnAshigaru(THREE) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.75, 1.3, 0.45);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.65;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDCC }));
    head.position.y = 1.6;
    group.add(head);

    var helmGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    helm.position.y = 1.97;
    group.add(helm);

    // Spear weapon
    var spearPts = [
      new THREE.Vector3(0.45, 0.5, 0.2),
      new THREE.Vector3(0.45, 2.0, 0.2)
    ];
    var spearGeo = new THREE.BufferGeometry().setFromPoints(spearPts);
    var spear = new THREE.LineSegments(spearGeo, new THREE.LineBasicMaterial({ color: 0x885533 }));
    group.add(spear);

    // Telegraph flash PointLight
    var telegraphLight = new THREE.PointLight(0xFF4400, 0, 6);
    telegraphLight.position.y = 2;
    group.add(telegraphLight);
    group.userData.telegraphLight = telegraphLight;

    group.position.set(0, 0, -6);
    group.castShadow = true;
    scene.add(group);

    currentEnemy = {
      mesh: group,
      hp: 80,
      maxHp: 80,
      x: 0,
      z: -6,
      speed: 3.5,
      attackCooldown: 2.2,
      attackTimer: 0,
      telegraphing: false,
      telegraphTimer: 0,
      dead: false,
      type: 'ashigaru',
      aware: true,
      animPhase: 0
    };
  }

  // D2: Yumi archer on castle wall
  function spawnArcher(THREE) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.7, 1.3, 0.4);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x885533 }));
    body.position.y = 0.65;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDCC }));
    head.position.y = 1.57;
    group.add(head);

    var helmGeo = new THREE.BoxGeometry(0.55, 0.35, 0.55);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x553311 }));
    helm.position.y = 1.92;
    group.add(helm);

    // Bow LineSegments
    var bowPts = [];
    for (var bi = 0; bi <= 8; bi++) {
      var ba = (bi / 8) * Math.PI;
      bowPts.push(new THREE.Vector3(Math.cos(ba) * 0.35 + 0.5, Math.sin(ba) * 0.7 + 0.9, 0.2));
    }
    var bowGeo = new THREE.BufferGeometry().setFromPoints(bowPts);
    var bow = new THREE.Line(bowGeo, new THREE.LineBasicMaterial({ color: 0x553311 }));
    group.add(bow);

    // Placed on castle wall
    group.position.set(4, 15.5, -9);
    scene.add(group);

    currentEnemy = {
      mesh: group,
      hp: 100,
      maxHp: 100,
      x: 4,
      z: -9,
      speed: 0,
      attackCooldown: 3.0,
      attackTimer: 0,
      dead: false,
      type: 'archer',
      aware: true,
      animPhase: 0
    };
  }

  // D3: Heavy samurai
  function spawnHeavySamurai(THREE) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 8);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x334433 }));
    body.position.y = 0.75;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDCC }));
    head.position.y = 1.82;
    group.add(head);

    var helmGeo = new THREE.BoxGeometry(0.75, 0.6, 0.75);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x222222 }));
    helm.position.y = 2.22;
    group.add(helm);

    // Nodachi blade
    var nodachiPts = [
      new THREE.Vector3(0.55, 0.7, 0.25),
      new THREE.Vector3(0.55, 2.5, 0.25)
    ];
    var nodachiGeo = new THREE.BufferGeometry().setFromPoints(nodachiPts);
    var nodachi = new THREE.LineSegments(nodachiGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC }));
    group.add(nodachi);

    group.position.set(0, 0, -6);
    scene.add(group);

    currentEnemy = {
      mesh: group,
      hp: 200,
      maxHp: 200,
      x: 0,
      z: -6,
      speed: 2.5,
      attackCooldown: 2.0,
      attackTimer: 0,
      dead: false,
      type: 'heavy',
      aware: true,
      animPhase: 0,
      telegraphing: false,
      telegraphTimer: 0
    };
  }

  // D4: Ninja
  function spawnNinja(THREE) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(0.65, 1.25, 0.4);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x222222 }));
    body.position.y = 0.625;
    group.add(body);

    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0x111111 }));
    head.position.y = 1.52;
    group.add(head);

    // Eyes slit
    var eyeGeo = new THREE.BoxGeometry(0.35, 0.06, 0.06);
    var eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var eyes = new THREE.Mesh(eyeGeo, eyeMat);
    eyes.position.set(0, 1.55, 0.26);
    group.add(eyes);

    // Tanto blade
    var tantoPts = [
      new THREE.Vector3(0.4, 0.6, 0.2),
      new THREE.Vector3(0.4, 1.4, 0.2)
    ];
    var tantoGeo = new THREE.BufferGeometry().setFromPoints(tantoPts);
    var tanto = new THREE.LineSegments(tantoGeo, new THREE.LineBasicMaterial({ color: 0x9999AA }));
    group.add(tanto);

    group.position.set(0, 0, -6);
    scene.add(group);
    group.visible = true;

    currentEnemy = {
      mesh: group,
      hp: 150,
      maxHp: 150,
      x: 0,
      z: -6,
      speed: 6.0,
      attackCooldown: 1.5,
      attackTimer: 0,
      dead: false,
      type: 'ninja',
      aware: true,
      animPhase: 0,
      invisible: false,
      comboCount: 0
    };
    ninjaTeleportTimer = 4;
  }

  // D5: Daimyo boss
  function spawnDaimyo(THREE) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.BoxGeometry(1.0, 1.6, 0.6);
    var body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: 0x221133 }));
    body.position.y = 0.8;
    group.add(body);

    // Ornate shoulder armor
    var shoulderMat = new THREE.MeshLambertMaterial({ color: 0x330044 });
    var shlGeo = new THREE.BoxGeometry(0.45, 0.4, 0.45);
    var shlL = new THREE.Mesh(shlGeo, shoulderMat);
    shlL.position.set(-0.72, 1.5, 0);
    group.add(shlL);
    var shlR = new THREE.Mesh(shlGeo, shoulderMat);
    shlR.position.set(0.72, 1.5, 0);
    group.add(shlR);

    var headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    var head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: 0xFFDDCC }));
    head.position.y = 2.05;
    group.add(head);

    var helmGeo = new THREE.BoxGeometry(0.8, 0.7, 0.8);
    var helm = new THREE.Mesh(helmGeo, new THREE.MeshLambertMaterial({ color: 0x111122 }));
    helm.position.y = 2.55;
    group.add(helm);

    // Ancestral katana gold LineSegments
    var katanaPts = [
      new THREE.Vector3(0.6, 0.8, 0.25),
      new THREE.Vector3(0.6, 2.6, 0.25)
    ];
    var katanaGeo = new THREE.BufferGeometry().setFromPoints(katanaPts);
    var katana = new THREE.LineSegments(katanaGeo, new THREE.LineBasicMaterial({ color: 0xFFCC00 }));
    group.add(katana);

    // Gold guard
    var guardGeo = new THREE.BoxGeometry(0.5, 0.1, 0.12);
    var guard = new THREE.Mesh(guardGeo, new THREE.MeshLambertMaterial({ color: 0xFFDD00 }));
    guard.position.set(0.6, 1.0, 0.25);
    group.add(guard);

    group.position.set(0, 0, -8);
    scene.add(group);

    currentEnemy = {
      mesh: group,
      hp: 400,
      maxHp: 400,
      x: 0,
      z: -8,
      speed: 3.0,
      attackCooldown: 1.0,
      attackTimer: 0,
      dead: false,
      type: 'daimyo',
      aware: true,
      animPhase: 0,
      telegraphing: false,
      telegraphTimer: 0
    };
    daimyoPhase = 0;
    daimyoPhaseTimer = 3.0; // approach time
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'samurai-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9100',
      'font-family:monospace',
      'font-size:14px',
      'color:#FFEE88',
      'background:rgba(0,0,0,0.7)',
      'padding:7px 18px',
      'border:1px solid #553311',
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
    var daimyoStr = 'N/A';
    if (currentEncounter === 5 && currentEnemy) {
      daimyoStr = currentEnemy.dead ? 'DEFEATED' : 'HP ' + Math.max(0, Math.ceil(currentEnemy.hp));
    } else if (currentEncounter > 5 || gameWon) {
      daimyoStr = 'DEFEATED';
    }
    hudEl.textContent = 'BUSHIDO [HONOR: ' + Math.floor(honor) + '] [ENCOUNTER: ' + currentEncounter + '/5] [HP: ' + Math.max(0, Math.ceil(playerHP)) + '] [STANCE: ' + stance + '] | DAIMYO: ' + daimyoStr;
  }

  // ─── Input ────────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toLowerCase();

    if (!active) {
      if (k === 's') { keysDown['s'] = true; sDownAt = Date.now(); }
      if (k === 'd') { keysDown['d'] = true; dDownAt = Date.now(); }
      checkActivation();
      return;
    }

    keysDown[k] = true;

    if (k === 'escape') { deactivate(); return; }

    if (k === 'q') {
      e.preventDefault();
      doHorizontalSlash();
    }
    if (k === 'e') {
      e.preventDefault();
      doVerticalStrike();
    }
    if (k === 'r') {
      e.preventDefault();
      doParry();
    }
    if (k === ' ') {
      e.preventDefault();
      doRoll();
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    keysDown[k] = false;
    if (!active) {
      if (k === 's') keysDown['s'] = false;
      if (k === 'd') keysDown['d'] = false;
    }
    // Release parry
    if (active && k === 'r' && parryActive) {
      // parry naturally expires via timer
    }
  }

  function checkActivation() {
    if (keysDown['s'] && keysDown['d']) {
      var now = Date.now();
      if (Math.abs(sDownAt - dDownAt) <= ACTIVATION_WINDOW) {
        activate();
      }
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────────
  function activate() {
    if (active) return;
    active = true;
    initAudio();
    if (!buildScene()) { active = false; return; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
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
    if (scrollLoreEl) { if (scrollLoreEl.parentNode) scrollLoreEl.parentNode.removeChild(scrollLoreEl); scrollLoreEl = null; }
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    // Reset state
    playerHP = 200;
    honor = 0;
    currentEncounter = 1;
    stance = 'ATTACK';
    parryActive = false;
    parryTimer = 0;
    attackCooldown = 0;
    rollActive = false;
    rollTimer = 0;
    gameOver = false;
    gameWon = false;
    currentEnemy = null;
    archerArrows = [];
    ricePaperWalls = [];
    braziers = [];
    secretScrollMesh = null;
    secretScrollVisible = false;
    brazierKnockedOver = false;
    enemyDefeated = false;
    encTransitionActive = false;
    playerPos = { x: 0, y: 0, z: 8 };
    moveDir = { x: 0, z: 0 };
    scene = null;
    camera = null;
    playerMesh = null;
    keysDown = {};
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Combat actions ───────────────────────────────────────────────────────────
  function doHorizontalSlash() {
    if (gameOver || gameWon || attackCooldown > 0) return;
    attackCooldown = 0.5;
    stance = 'ATTACK';
    parryActive = false;
    playSwoosh();

    // Animate blade
    if (playerMesh && playerMesh.userData.blade) {
      var blade = playerMesh.userData.blade;
      blade.rotation.z = 0.8;
      setTimeout(function () { if (blade) blade.rotation.z = 0; }, 200);
    }

    // Check rice paper wall cut (E within 0.3u creates gap, Q also works)
    checkRicePaperCut();

    if (!currentEnemy || currentEnemy.dead) return;
    var d = dist2d(playerPos, { x: currentEnemy.x, z: currentEnemy.z });
    if (d <= 2.0) {
      var dmg = 40;
      // Unaware kill = -honor
      if (!currentEnemy.aware) { changeHonor(-15); }
      hitEnemy(dmg, false);
    }
  }

  function doVerticalStrike() {
    if (gameOver || gameWon || attackCooldown > 0) return;
    attackCooldown = 0.6;
    stance = 'ATTACK';
    parryActive = false;
    playSwoosh();

    // Check rice paper wall cut
    checkRicePaperCut();
    // Check brazier knock
    checkBrazierKnock();

    if (!currentEnemy || currentEnemy.dead) return;
    var d = dist2d(playerPos, { x: currentEnemy.x, z: currentEnemy.z });
    if (d <= 1.5) {
      var dmg = 60;
      if (!currentEnemy.aware) { changeHonor(-15); }
      hitEnemy(dmg, false);
    }
  }

  function doParry() {
    if (gameOver || gameWon) return;
    parryActive = true;
    parryTimer = parryWindow;
    stance = 'PARRY';
    updateHUD();
  }

  function doRoll() {
    if (gameOver || gameWon || rollActive) return;
    rollActive = true;
    rollTimer = 0.35;
    rollDirX = moveDir.x;
    rollDirZ = moveDir.z;
    if (rollDirX === 0 && rollDirZ === 0) rollDirZ = 1; // roll backward
  }

  // ─── Rice paper wall cutting ──────────────────────────────────────────────────
  function checkRicePaperCut() {
    for (var i = 0; i < ricePaperWalls.length; i++) {
      var w = ricePaperWalls[i];
      if (w.cut) continue;
      var d = dist2d(playerPos, { x: w.x, z: w.z });
      if (d <= 0.3 + 1.5) { // 0.3 plus wall half width
        w.cut = true;
        if (w.mesh) w.mesh.visible = false;
      }
    }
  }

  // ─── Brazier knock ────────────────────────────────────────────────────────────
  function checkBrazierKnock() {
    for (var i = 0; i < braziers.length; i++) {
      var b = braziers[i];
      if (b.knockedOver) continue;
      var d = dist2d(playerPos, { x: b.x, z: b.z });
      if (d <= 1.5) {
        b.knockedOver = true;
        if (b.mesh) b.mesh.rotation.z = Math.PI / 2;
        if (b.light) b.light.intensity = 0.2;
      }
    }
  }

  // ─── Hit enemy ────────────────────────────────────────────────────────────────
  function hitEnemy(dmg, isCounter) {
    if (!currentEnemy || currentEnemy.dead) return;
    currentEnemy.hp -= dmg;
    playHit();

    // Flash
    if (currentEnemy.mesh && currentEnemy.mesh.children[0]) {
      var origColor = currentEnemy.mesh.children[0].material.color.getHex();
      currentEnemy.mesh.children[0].material.color.setHex(0xFFFFFF);
      setTimeout(function () {
        if (currentEnemy && currentEnemy.mesh && currentEnemy.mesh.children[0]) {
          currentEnemy.mesh.children[0].material.color.setHex(origColor);
        }
      }, 100);
    }

    if (isCounter) changeHonor(20);

    if (currentEnemy.hp <= 0) {
      killCurrentEnemy();
    }
  }

  function killCurrentEnemy() {
    if (!currentEnemy || currentEnemy.dead) return;
    currentEnemy.dead = true;
    if (currentEnemy.mesh) scene.remove(currentEnemy.mesh);
    if (currentEnemy.type === 'daimyo') daimyoDefeated = true;

    enemyDefeated = true;
    encTransitionTimer = 2.5;
    encTransitionActive = true;
    updateHUD();

    if (currentEncounter >= totalEncounters) {
      gameWon = true;
      showEndMessage('HONOR RESTORED. The Daimyo falls. Press ESC to exit.');
    }
  }

  // ─── Parry collision ──────────────────────────────────────────────────────────
  // Called when enemy tries to attack; returns true if blocked/countered
  function tryParryEnemy(isPerfectWindow) {
    if (!parryActive) return false;
    playClash();
    if (isPerfectWindow) {
      // Counter attack
      changeHonor(25);
      hitEnemy(80, true);
    }
    parryActive = false;
    parryTimer = 0;
    stance = 'ATTACK';
    return true;
  }

  // ─── Honor ────────────────────────────────────────────────────────────────────
  function changeHonor(delta) {
    honor = clamp(honor + delta, 0, maxHonor);
    if (honor >= maxHonor && !secretScrollVisible) {
      secretScrollVisible = true;
      if (secretScrollMesh) secretScrollMesh.visible = true;
      showScrollLore();
    }
    updateHUD();
  }

  function showScrollLore() {
    if (scrollLoreEl) return;
    scrollLoreEl = document.createElement('div');
    scrollLoreEl.id = 'samurai-scroll-lore';
    scrollLoreEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9200',
      'font-family:monospace',
      'font-size:13px',
      'color:#FFEE88',
      'background:rgba(20,10,0,0.85)',
      'padding:12px 24px',
      'border:2px solid #FFCC44',
      'border-radius:6px',
      'max-width:500px',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    scrollLoreEl.innerHTML = '[ ANCESTRAL SCROLL UNLOCKED ]<br>"The way of the sword is the acceptance of death.<br>One who masters the parry masters life itself.<br>- Bushido Shoshinshu"';
    document.body.appendChild(scrollLoreEl);
  }

  // ─── Game loop ────────────────────────────────────────────────────────────────
  function gameLoop(now) {
    if (!active) return;
    animFrameId = requestAnimationFrame(gameLoop);

    var dt = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;

    if (!gameOver && !gameWon) {
      updatePlayer(dt);
      updateCurrentEnemy(dt);
      updateArcherArrows(dt);
      updateEnvironmentAnimations(dt);
      updateEncounterTransition(dt);
    }

    updateCamera();
    updateHUD();

    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  // ─── Player update ────────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (attackCooldown > 0) attackCooldown -= dt;
    if (parryTimer > 0) {
      parryTimer -= dt;
      if (parryTimer <= 0) {
        parryActive = false;
        stance = 'ATTACK';
      }
    }

    var speed = 6.0;
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

    // Koi pond slows movement
    var speedMult = 1.0;
    if (inKoiPond(playerPos.x, playerPos.z)) speedMult = 0.4;

    if (rollActive) {
      rollTimer -= dt;
      playerPos.x += rollDirX * 12 * dt;
      playerPos.z += rollDirZ * 12 * dt;
      if (playerMesh) playerMesh.position.y = Math.sin((1 - rollTimer / 0.35) * Math.PI) * 1.2;
      if (rollTimer <= 0) {
        rollActive = false;
        if (playerMesh) playerMesh.position.y = 0;
      }
    } else {
      playerPos.x += inputX * speed * speedMult * dt;
      playerPos.z += inputZ * speed * speedMult * dt;
    }

    // Boundary
    playerPos.x = clamp(playerPos.x, -25, 25);
    playerPos.z = clamp(playerPos.z, -18, 18);

    if (playerMesh) {
      playerMesh.position.x = playerPos.x;
      playerMesh.position.z = playerPos.z;
      if (!rollActive) playerMesh.position.y = 0;
      if (inputX !== 0 || inputZ !== 0) {
        playerMesh.rotation.y = Math.atan2(inputX, inputZ) + Math.PI;
      } else if (currentEnemy && !currentEnemy.dead) {
        // Face enemy
        var fx = currentEnemy.x - playerPos.x;
        var fz = currentEnemy.z - playerPos.z;
        playerMesh.rotation.y = Math.atan2(fx, fz);
      }
    }

    // Secret scroll pickup
    if (secretScrollMesh && secretScrollVisible) {
      var sd = dist2d(playerPos, { x: 8, z: -8 });
      if (sd < 1.5) {
        secretScrollMesh.visible = false;
      }
    }

    if (playerHP <= 0) {
      gameOver = true;
      showEndMessage('FALLEN IN BATTLE. Honor lost. Press ESC to exit.');
    }
  }

  // ─── Enemy AI update ──────────────────────────────────────────────────────────
  function updateCurrentEnemy(dt) {
    if (!currentEnemy || currentEnemy.dead || enemyDefeated) return;

    var e = currentEnemy;
    e.animPhase += dt;

    if (e.type === 'ashigaru') updateAshigaru(e, dt);
    else if (e.type === 'archer') updateArcher(e, dt);
    else if (e.type === 'heavy') updateHeavy(e, dt);
    else if (e.type === 'ninja') updateNinja(e, dt);
    else if (e.type === 'daimyo') updateDaimyo(e, dt);

    // Update mesh position
    if (e.mesh) {
      e.mesh.position.x = e.x;
      e.mesh.position.z = e.z;
      // Bob
      e.mesh.position.y = Math.abs(Math.sin(e.animPhase * 3)) * 0.05;
    }
  }

  function facePlayer(e) {
    if (!e.mesh) return;
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    e.mesh.rotation.y = Math.atan2(dx, dz);
  }

  function moveTowardPlayer(e, speed, dt) {
    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;
    e.x += (dx / d) * speed * dt;
    e.z += (dz / d) * speed * dt;
  }

  // D1 Ashigaru update
  function updateAshigaru(e, dt) {
    facePlayer(e);
    var d = dist2d(playerPos, { x: e.x, z: e.z });

    if (d > 2.5) moveTowardPlayer(e, e.speed, dt);

    // Telegraph then attack
    if (e.telegraphing) {
      e.telegraphTimer -= dt;
      if (e.mesh && e.mesh.userData.telegraphLight) {
        e.mesh.userData.telegraphLight.intensity = Math.sin(Date.now() * 0.02) * 2 + 2;
      }
      if (e.telegraphTimer <= 0) {
        e.telegraphing = false;
        e.attackTimer = 0;
        if (e.mesh && e.mesh.userData.telegraphLight) e.mesh.userData.telegraphLight.intensity = 0;
        // Actually attack
        if (d <= 2.5) {
          var isPerfect = parryActive && parryTimer > (parryWindow * 0.6);
          var blocked = tryParryEnemy(isPerfect);
          if (!blocked) {
            playerHP -= 20;
            screenShake();
          }
        }
      }
    } else {
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown && d <= 2.5) {
        // Telegraph
        e.telegraphing = true;
        e.telegraphTimer = 0.8;
        e.attackTimer = 0;
      }
    }
  }

  // D2 Archer update
  function updateArcher(e, dt) {
    facePlayer(e);
    e.attackTimer += dt;
    if (e.attackTimer >= e.attackCooldown) {
      e.attackTimer = 0;
      fireArcherArrow(e);
    }
  }

  function fireArcherArrow(e) {
    var THREE = window.THREE;
    if (!THREE) return;
    var arrowGeo = new THREE.SphereGeometry(0.12, 4, 4);
    var arrowMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
    var arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(e.x, 16.5, e.z);
    scene.add(arrowMesh);

    var dx = playerPos.x - e.x;
    var dz = playerPos.z - e.z;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;
    var speed = 14;
    archerArrows.push({
      mesh: arrowMesh,
      x: e.x, y: 16.5, z: e.z,
      vx: (dx / d) * speed,
      vy: 5,
      vz: (dz / d) * speed,
      life: 4.0
    });
  }

  function updateArcherArrows(dt) {
    for (var i = archerArrows.length - 1; i >= 0; i--) {
      var ar = archerArrows[i];
      ar.life -= dt;
      if (ar.life <= 0) {
        scene.remove(ar.mesh);
        archerArrows.splice(i, 1);
        continue;
      }
      ar.x += ar.vx * dt;
      ar.z += ar.vz * dt;
      ar.vy -= 9.8 * dt;
      ar.y += ar.vy * dt;
      ar.mesh.position.set(ar.x, ar.y, ar.z);

      if (ar.y < 0) {
        scene.remove(ar.mesh);
        archerArrows.splice(i, 1);
        continue;
      }

      // Hit player
      var pad = dist2d(playerPos, { x: ar.x, z: ar.z });
      if (pad < 1.0 && Math.abs(ar.y - 1.0) < 2.0) {
        if (!rollActive) {
          var blocked = tryParryEnemy(false);
          if (!blocked) {
            playerHP -= 25;
            screenShake();
          }
        }
        scene.remove(ar.mesh);
        archerArrows.splice(i, 1);
      }
    }
  }

  // D3 Heavy samurai update
  function updateHeavy(e, dt) {
    facePlayer(e);
    var d = dist2d(playerPos, { x: e.x, z: e.z });
    if (d > 2.0) moveTowardPlayer(e, e.speed, dt);

    if (e.telegraphing) {
      e.telegraphTimer -= dt;
      if (e.telegraphTimer <= 0) {
        e.telegraphing = false;
        e.attackTimer = 0;
        if (d <= 2.5) {
          var isNearPerfect = parryActive && parryTimer > (parryWindow * 0.7); // 0.3s window = 30% of 0.8s
          var isPerfect = parryActive && parryTimer > (parryWindow * 0.625);
          var blocked = tryParryEnemy(isPerfect);
          if (!blocked) {
            playerHP -= 60;
            screenShake();
          }
        }
      }
    } else {
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown && d <= 2.5) {
        e.telegraphing = true;
        e.telegraphTimer = 0.5;
        e.attackTimer = 0;
      }
    }
  }

  // D4 Ninja update
  function updateNinja(e, dt) {
    facePlayer(e);
    var d = dist2d(playerPos, { x: e.x, z: e.z });
    if (d > 1.8) moveTowardPlayer(e, e.speed, dt);

    // Teleport mechanic
    ninjaTeleportTimer -= dt;
    if (ninjaTeleportTimer <= 0) {
      ninjaTeleportTimer = 4.0;
      teleportNinja(e);
    }

    // Fast 3-hit combo
    e.attackTimer += dt;
    if (e.attackTimer >= e.attackCooldown && d <= 2.0) {
      e.attackTimer = 0;
      doNinjaCombo(e);
    }
  }

  function teleportNinja(e) {
    if (!e.mesh) return;
    // Disappear
    e.mesh.visible = false;
    e.invisible = true;

    var self = e;
    setTimeout(function () {
      if (!self || self.dead) return;
      // Reappear 3 units behind player
      var dx = playerPos.x - self.x;
      var dz = playerPos.z - self.z;
      var d = Math.sqrt(dx * dx + dz * dz) || 1;
      // Behind player means opposite direction from enemy to player
      var nx = playerPos.x - (dx / d) * 3;
      var nz = playerPos.z - (dz / d) * 3;
      // Lerp position over time via direct set (instant teleport)
      self.x = nx;
      self.z = nz;
      if (self.mesh) {
        self.mesh.position.x = self.x;
        self.mesh.position.z = self.z;
        self.mesh.visible = true;
        self.invisible = false;
      }
    }, 300);
  }

  function doNinjaCombo(e) {
    // 3 fast hits
    var d = dist2d(playerPos, { x: e.x, z: e.z });
    if (d > 2.0) return;
    var hitCount = 0;
    function doHit() {
      if (!e || e.dead || hitCount >= 3) return;
      hitCount++;
      var blocked = tryParryEnemy(false);
      if (!blocked && !rollActive) {
        playerHP -= 15;
        if (playerHP > 0) screenShake();
      }
      if (hitCount < 3) setTimeout(doHit, 200);
    }
    doHit();
  }

  // D5 Daimyo update
  function updateDaimyo(e, dt) {
    facePlayer(e);
    var d = dist2d(playerPos, { x: e.x, z: e.z });

    daimyoPhaseTimer -= dt;

    // Phase transitions based on HP
    var hpRatio = e.hp / e.maxHp;
    if (hpRatio > 0.75) daimyoPhase = 0;       // approach
    else if (hpRatio > 0.5) daimyoPhase = 1;   // combo
    else if (hpRatio > 0.25) daimyoPhase = 2;  // spinning sweep
    else daimyoPhase = 3;                        // desperation flurry

    if (daimyoPhase === 0) {
      // Approach
      if (d > 2.5) moveTowardPlayer(e, e.speed, dt);
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown && d <= 3.0) {
        e.attackTimer = 0;
        doDaimyoSingleStrike(e, d);
      }
    } else if (daimyoPhase === 1) {
      // 3-hit combo
      if (d > 2.0) moveTowardPlayer(e, e.speed * 1.2, dt);
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown * 0.8 && d <= 2.5) {
        e.attackTimer = 0;
        doDaimyoCombo(e);
      }
    } else if (daimyoPhase === 2) {
      // Spinning sweep — telegraphed; player can E to jump-parry
      if (d > 3.0) moveTowardPlayer(e, e.speed, dt);
      if (e.telegraphing) {
        e.telegraphTimer -= dt;
        if (e.mesh) e.mesh.rotation.y += dt * 4; // spin
        if (e.telegraphTimer <= 0) {
          e.telegraphing = false;
          e.attackTimer = 0;
          if (d <= 3.5) {
            // Jump-parry = player doing E (vertical strike) also triggers parry dodge
            var blocked = tryParryEnemy(parryActive);
            if (!blocked && !rollActive) {
              playerHP -= 45;
              screenShake();
            }
          }
        }
      } else {
        e.attackTimer += dt;
        if (e.attackTimer >= e.attackCooldown * 1.5) {
          e.telegraphing = true;
          e.telegraphTimer = 1.0;
          e.attackTimer = 0;
        }
      }
    } else if (daimyoPhase === 3) {
      // Desperation flurry
      if (d > 1.5) moveTowardPlayer(e, e.speed * 1.5, dt);
      e.attackTimer += dt;
      if (e.attackTimer >= e.attackCooldown * 0.5 && d <= 2.0) {
        e.attackTimer = 0;
        doDaimyoFlurry(e);
      }
    }
  }

  function doDaimyoSingleStrike(e, d) {
    if (d > 3.0) return;
    var blocked = tryParryEnemy(parryActive && parryTimer > parryWindow * 0.5);
    if (!blocked && !rollActive) { playerHP -= 35; screenShake(); }
  }

  function doDaimyoCombo(e) {
    var hits = 0;
    function nextHit() {
      if (!e || e.dead || hits >= 3) return;
      hits++;
      var d = dist2d(playerPos, { x: e.x, z: e.z });
      if (d <= 2.5) {
        var blocked = tryParryEnemy(false);
        if (!blocked && !rollActive) { playerHP -= 25; screenShake(); }
      }
      if (hits < 3) setTimeout(nextHit, 250);
    }
    nextHit();
  }

  function doDaimyoFlurry(e) {
    var hits = 0;
    function nextHit() {
      if (!e || e.dead || hits >= 5) return;
      hits++;
      var d = dist2d(playerPos, { x: e.x, z: e.z });
      if (d <= 2.0) {
        var blocked = tryParryEnemy(false);
        if (!blocked && !rollActive) { playerHP -= 18; screenShake(); }
      }
      if (hits < 5) setTimeout(nextHit, 150);
    }
    nextHit();
  }

  // ─── Encounter transition ─────────────────────────────────────────────────────
  function updateEncounterTransition(dt) {
    if (!encTransitionActive) return;
    encTransitionTimer -= dt;
    if (encTransitionTimer <= 0) {
      encTransitionActive = false;
      if (currentEncounter < totalEncounters && !gameWon) {
        currentEncounter++;
        playerPos = { x: 0, y: 0, z: 8 };
        if (playerMesh) playerMesh.position.set(0, 0, 8);
        // Clear arrows
        for (var i = 0; i < archerArrows.length; i++) scene.remove(archerArrows[i].mesh);
        archerArrows = [];
        spawnEncounter(window.THREE, currentEncounter);
        updateHUD();
      }
    }
  }

  // ─── Environment animations ───────────────────────────────────────────────────
  function updateEnvironmentAnimations(dt) {
    // Scroll bob
    if (secretScrollMesh && secretScrollVisible) {
      secretScrollMesh.position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.2;
      secretScrollMesh.rotation.y += dt * 1.5;
    }

    // Brazier flicker
    for (var i = 0; i < braziers.length; i++) {
      var b = braziers[i];
      if (!b.knockedOver && b.light) {
        b.light.intensity = 1.3 + Math.sin(Date.now() * 0.01 + i) * 0.5;
      }
    }
  }

  // ─── Camera ───────────────────────────────────────────────────────────────────
  function updateCamera() {
    if (!camera) return;
    var targetX = playerPos.x * 0.25;
    var targetZ = 30 + playerPos.z * 0.2;
    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.lookAt(playerPos.x * 0.2, 0, playerPos.z * 0.2);
  }

  // ─── Screen shake ─────────────────────────────────────────────────────────────
  function screenShake() {
    if (!renderer) return;
    renderer.domElement.style.left = (Math.random() * 10 - 5) + 'px';
    renderer.domElement.style.top = (Math.random() * 10 - 5) + 'px';
    setTimeout(function () {
      if (renderer) {
        renderer.domElement.style.left = '0';
        renderer.domElement.style.top = '0';
      }
    }, 80);
  }

  // ─── End message ─────────────────────────────────────────────────────────────
  function showEndMessage(msg) {
    var el = document.createElement('div');
    el.id = 'samurai-end';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:9200',
      'font-family:monospace',
      'font-size:28px',
      'font-weight:bold',
      'color:#FFEE88',
      'background:rgba(0,0,0,0.85)',
      'padding:24px 40px',
      'border:3px solid #553311',
      'border-radius:8px',
      'text-align:center',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
  }

  // ─── Init key listeners for activation ───────────────────────────────────────
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
