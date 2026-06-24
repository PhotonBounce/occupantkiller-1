window.TokyoShowdown = (function () {
  'use strict';

  // ─── Activation (T + K within 400ms) ─────────────────────────────────────────
  var tDownAt = 0;
  var kDownAt = 0;
  var ACTIVATION_WINDOW = 400;
  var active = false;

  // ─── Core Three.js handles ───────────────────────────────────────────────────
  var scene, camera, renderer, animFrameId;
  var clock = { last: 0 };

  // ─── Game state ──────────────────────────────────────────────────────────────
  var gameOver = false;
  var gameWon = false;
  var playerHP = 150;
  var playerMaxHP = 150;
  var currentFloor = 1; // 1-4
  var timerSeconds = 600; // 10 minutes

  // ─── Weapons & inventory ─────────────────────────────────────────────────────
  var currentWeapon = 'pistol'; // pistol | katana
  var hasKatana = false;
  var shurikenCount = 10;
  var katanaDeflecting = false;
  var deflectTimer = 0;
  var deflectWindow = 0.35;
  var shootCooldown = 0;
  var meleeCooldown = 0;

  // ─── Player movement ─────────────────────────────────────────────────────────
  var playerPos = { x: 0, y: 1, z: 20 };
  var playerYaw = 0;
  var playerPitch = 0;
  var moveKeys = {};
  var pointerLocked = false;
  var playerMesh = null;
  var playerSpeed = 8;
  var playerOnGround = true;
  var playerVelY = 0;

  // ─── Projectiles ─────────────────────────────────────────────────────────────
  var bullets = [];
  var enemyBullets = [];
  var shurikens = [];

  // ─── Yakuza enemies (28 total) ───────────────────────────────────────────────
  var yakuzaList = [];
  var yakuzaAlive = 0;

  // ─── Lieutenant Toshi (2nd floor) ────────────────────────────────────────────
  var toshi = null;
  var toshiState = 'ALIVE'; // ALIVE | SURRENDERED | DEAD

  // ─── Oyabun Tanaka (rooftop dojo, floor 4) ───────────────────────────────────
  var tanaka = null;
  var tanakaState = 'ALIVE'; // ALIVE | PHASE2 | PHASE3 | DEFEATED
  var tanakaPhase = 1;
  var tanakaPhaseTimer = 0;
  var tanakaHP = 600;
  var tanakaMaxHP = 600;
  var tanakaPausedTimer = 0; // paused when hostage freed

  // ─── Hostage (3rd floor) ─────────────────────────────────────────────────────
  var hostage = null;
  var hostageState = 'HIDDEN'; // HIDDEN | FOUND | FREED
  var hostagePos = { x: 5, y: 31, z: -8 };

  // ─── Oyabun location reveal ───────────────────────────────────────────────────
  var oyabunRevealed = false;

  // ─── Minimap marker ───────────────────────────────────────────────────────────
  var minimapCanvas = null;
  var minimapCtx = null;

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  var hudEl = null;

  // ─── Floor boundaries ────────────────────────────────────────────────────────
  // Floor 1: y=0-10, Floor 2: y=10-20, Floor 3: y=20-30, Floor 4(roof): y=30+
  var floorY = [0, 10, 20, 30];

  // ─── Structural geometry ─────────────────────────────────────────────────────
  var neonLights = [];
  var staircases = [];
  var katanaPickupMesh = null;
  var katanaPickupPos = { x: -8, y: 1, z: 5 };
  var katanaPickedUp = false;

  // ─── Interrogation ───────────────────────────────────────────────────────────
  var interactCooldown = 0;

  // ─── Audio ───────────────────────────────────────────────────────────────────
  var audioCtx = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function clamp(v, mn, mx) { return v < mn ? mn : v > mx ? mx : v; }
  function dist3d(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  function dist2d(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function randRange(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(randRange(a, b + 1)); }

  // ─── Audio helpers ────────────────────────────────────────────────────────────
  function initAudio() {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
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
  function playShot() { playTone(800, 0.08, 'square', 0.3); }
  function playHit() { playTone(200, 0.12, 'sawtooth', 0.25); }
  function playSword() { playTone(1200, 0.15, 'sawtooth', 0.2); }
  function playDeflect() { playTone(1800, 0.1, 'sine', 0.35); }
  function playKill() { playTone(400, 0.2, 'square', 0.3); }

  // ─── Scene builder ────────────────────────────────────────────────────────────
  function buildScene() {
    var T = window.THREE;
    if (!T) { console.warn('TokyoShowdown: THREE not found'); return false; }

    scene = new T.Scene();
    scene.background = new T.Color(0x050510);
    scene.fog = new T.FogExp2(0x050510, 0.018);

    camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);

    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'tokyo-canvas';
    renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:9000;';
    document.body.appendChild(renderer.domElement);

    buildStreet(T);
    buildStronghold(T);
    buildPlayer(T);
    buildHostage(T);
    spawnYakuza(T);
    buildKatanaPickup(T);
    buildHUD();

    return true;
  }

  // ─── Street environment ───────────────────────────────────────────────────────
  function buildStreet(T) {
    // Ground
    var groundGeo = new T.PlaneGeometry(120, 80);
    var groundMat = new T.MeshLambertMaterial({ color: 0x111118 });
    var ground = new T.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    // Road markings – LineSegments
    var roadPts = [];
    for (var ri = -40; ri <= 40; ri += 8) {
      roadPts.push(ri, 0.02, -30, ri, 0.02, 30);
    }
    var roadGeo = new T.BufferGeometry();
    roadGeo.setAttribute('position', new T.Float32BufferAttribute(roadPts, 3));
    var roadMat = new T.LineBasicMaterial({ color: 0xffff00, opacity: 0.4, transparent: true });
    scene.add(new T.LineSegments(roadGeo, roadMat));

    // Ambient night light
    var ambientLight = new T.AmbientLight(0x111133, 0.8);
    scene.add(ambientLight);

    // Buildings lining the street
    var buildingDefs = [
      // left side
      { x: -22, z: -15, w: 8, h: 18, d: 10, col: 0x111122 },
      { x: -32, z:  5,  w: 10, h: 24, d: 12, col: 0x112233 },
      { x: -20, z:  18, w: 7,  h: 14, d: 8,  col: 0x111122 },
      // right side
      { x:  22, z: -15, w: 8,  h: 20, d: 10, col: 0x112233 },
      { x:  30, z:  5,  w: 10, h: 16, d: 12, col: 0x111122 },
      { x:  20, z:  20, w: 7,  h: 22, d: 8,  col: 0x112233 },
      // back row
      { x: -10, z: -35, w: 12, h: 30, d: 10, col: 0x111122 },
      { x:  10, z: -35, w: 12, h: 28, d: 10, col: 0x112233 },
    ];
    for (var bi = 0; bi < buildingDefs.length; bi++) {
      var bd = buildingDefs[bi];
      var bGeo = new T.BoxGeometry(bd.w, bd.h, bd.d);
      var bMat = new T.MeshLambertMaterial({ color: bd.col });
      var bMesh = new T.Mesh(bGeo, bMat);
      bMesh.position.set(bd.x, bd.h / 2, bd.z);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      scene.add(bMesh);
    }

    // Pachinko parlor (vivid magenta facade)
    var pachGeo = new T.BoxGeometry(12, 10, 8);
    var pachMat = new T.MeshLambertMaterial({ color: 0x220033 });
    var pachMesh = new T.Mesh(pachGeo, pachMat);
    pachMesh.position.set(-28, 5, -5);
    pachMesh.castShadow = true;
    scene.add(pachMesh);
    // Pachinko sign rows (LineSegments)
    addSignLines(T, -28, 10.2, -5, 5, 0xFF0088);
    // Neon PointLight for pachinko
    addPointLight(T, -28, 11, -5, 0xFF0088, 3, 20);
    addPointLight(T, -26, 8, -2, 0xFF44AA, 2, 15);

    // Ramen shop (warm amber glow)
    var ramenGeo = new T.BoxGeometry(9, 7, 7);
    var ramenMat = new T.MeshLambertMaterial({ color: 0x221100 });
    var ramenMesh = new T.Mesh(ramenGeo, ramenMat);
    ramenMesh.position.set(25, 3.5, -5);
    ramenMesh.castShadow = true;
    scene.add(ramenMesh);
    addSignLines(T, 25, 7.2, -5, 4, 0xFF4400);
    addPointLight(T, 25, 9, -5, 0xFF4400, 3, 18);
    addPointLight(T, 27, 6, -3, 0xFFAA44, 2, 12);

    // Karaoke bar (cyan neon)
    var karaGeo = new T.BoxGeometry(11, 9, 8);
    var karaMat = new T.MeshLambertMaterial({ color: 0x001122 });
    var karaMesh = new T.Mesh(karaGeo, karaMat);
    karaMesh.position.set(23, 4.5, 15);
    karaMesh.castShadow = true;
    scene.add(karaMesh);
    addSignLines(T, 23, 9.2, 15, 5, 0x00FFCC);
    addPointLight(T, 23, 11, 15, 0x00FFCC, 4, 22);
    addPointLight(T, 20, 7, 13, 0x0088AA, 2, 14);

    // Street lamps
    var lampPositions = [
      [-12, 0, -10], [12, 0, -10], [-12, 0, 10], [12, 0, 10]
    ];
    for (var li = 0; li < lampPositions.length; li++) {
      var lp = lampPositions[li];
      var poleGeo = new T.CylinderGeometry(0.1, 0.12, 6, 6);
      var poleMat = new T.MeshLambertMaterial({ color: 0x334455 });
      var poleMesh = new T.Mesh(poleGeo, poleMat);
      poleMesh.position.set(lp[0], 3, lp[2]);
      scene.add(poleMesh);
      addPointLight(T, lp[0], 6.5, lp[2], 0xCCDDFF, 1.5, 16);
    }
  }

  function addSignLines(T, x, y, z, w, col) {
    var pts = [
      -w/2, 0, 0,  w/2, 0, 0,
       w/2, 0, 0,  w/2, 0.6, 0,
       w/2, 0.6, 0, -w/2, 0.6, 0,
      -w/2, 0.6, 0, -w/2, 0, 0
    ];
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    var mat = new T.LineBasicMaterial({ color: col });
    var ls = new T.LineSegments(geo, mat);
    ls.position.set(x, y, z);
    scene.add(ls);
  }

  function addPointLight(T, x, y, z, col, intensity, dist) {
    var pl = new T.PointLight(col, intensity, dist);
    pl.position.set(x, y, z);
    scene.add(pl);
    neonLights.push(pl);
  }

  // ─── Stronghold (4 floors) ────────────────────────────────────────────────────
  function buildStronghold(T) {
    // Main building envelope (4 floors stacked)
    var hullGeo = new T.BoxGeometry(30, 40, 26);
    var hullMat = new T.MeshLambertMaterial({ color: 0x0A0A18 });
    var hull = new T.Mesh(hullGeo, hullMat);
    hull.position.set(0, 20, -20);
    hull.receiveShadow = true;
    scene.add(hull);

    buildFloor1(T);
    buildFloor2(T);
    buildFloor3(T);
    buildFloor4Roof(T);
    buildStaircases(T);
  }

  // Floor 1 – Ground (bar/reception)
  function buildFloor1(T) {
    var baseY = 0;
    // Floor slab
    var floorGeo = new T.BoxGeometry(28, 0.3, 24);
    var floorMat = new T.MeshLambertMaterial({ color: 0x151520 });
    var floorMesh = new T.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, baseY, -20);
    scene.add(floorMesh);

    // Bar counter
    var barGeo = new T.BoxGeometry(14, 1.2, 2);
    var barMat = new T.MeshLambertMaterial({ color: 0x331100 });
    var bar = new T.Mesh(barGeo, barMat);
    bar.position.set(-3, baseY + 0.6, -18);
    bar.castShadow = true;
    scene.add(bar);

    // Bar stools CylinderGeometry
    for (var si = 0; si < 5; si++) {
      var stoolGeo = new T.CylinderGeometry(0.3, 0.25, 0.8, 8);
      var stoolMat = new T.MeshLambertMaterial({ color: 0x442200 });
      var stool = new T.Mesh(stoolGeo, stoolMat);
      stool.position.set(-7 + si * 3, baseY + 0.4, -16.5);
      scene.add(stool);
    }

    // Reception desk
    var deskGeo = new T.BoxGeometry(6, 1.5, 2);
    var deskMat = new T.MeshLambertMaterial({ color: 0x221108 });
    var desk = new T.Mesh(deskGeo, deskMat);
    desk.position.set(6, baseY + 0.75, -25);
    desk.castShadow = true;
    scene.add(desk);

    // Neon sign behind bar
    addPointLight(T, -3, baseY + 4, -19, 0xFF0088, 3, 18);
    addPointLight(T, 6, baseY + 6, -26, 0xFF4400, 2, 14);
    addSignLines(T, -3, baseY + 4.2, -19.5, 6, 0xFF0088);

    // Floor ceiling
    var ceilGeo = new T.BoxGeometry(28, 0.3, 24);
    var ceilMat = new T.MeshLambertMaterial({ color: 0x0D0D16 });
    var ceil = new T.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, baseY + 9.7, -20);
    scene.add(ceil);
  }

  // Floor 2 – Gambling hall
  function buildFloor2(T) {
    var baseY = 10;
    var floorGeo = new T.BoxGeometry(28, 0.3, 24);
    var floorMat = new T.MeshLambertMaterial({ color: 0x0E0E14 });
    var floorMesh = new T.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, baseY, -20);
    scene.add(floorMesh);

    // Gambling tables (BoxGeometry)
    var tablePositions = [
      { x: -8, z: -18 }, { x: 0, z: -18 }, { x: 8, z: -18 },
      { x: -8, z: -25 }, { x: 4, z: -25 }
    ];
    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      var tGeo = new T.BoxGeometry(4, 0.15, 2.5);
      var tMat = new T.MeshLambertMaterial({ color: 0x004400 });
      var tMesh = new T.Mesh(tGeo, tMat);
      tMesh.position.set(tp.x, baseY + 1, tp.z);
      tMesh.castShadow = true;
      scene.add(tMesh);

      // Table legs
      var legGeo = new T.CylinderGeometry(0.08, 0.08, 1, 6);
      var legMat = new T.MeshLambertMaterial({ color: 0x331100 });
      var legOffsets = [[-1.7, -1], [1.7, -1], [-1.7, 1], [1.7, 1]];
      for (var li = 0; li < legOffsets.length; li++) {
        var leg = new T.Mesh(legGeo, legMat);
        leg.position.set(tp.x + legOffsets[li][0], baseY + 0.5, tp.z + legOffsets[li][1]);
        scene.add(leg);
      }

      // CylinderGeometry dice on tables
      var diceGeo = new T.CylinderGeometry(0.2, 0.2, 0.2, 6);
      var diceMat = new T.MeshLambertMaterial({ color: 0xFFFFEE });
      var dice1 = new T.Mesh(diceGeo, diceMat);
      dice1.position.set(tp.x - 0.5, baseY + 1.25, tp.z);
      scene.add(dice1);
      var dice2 = new T.Mesh(diceGeo, diceMat);
      dice2.position.set(tp.x + 0.5, baseY + 1.25, tp.z);
      scene.add(dice2);
    }

    // Neon gambling lights
    addPointLight(T, -8, baseY + 5, -18, 0x00FFCC, 2.5, 16);
    addPointLight(T, 8, baseY + 5, -22, 0xFF0088, 2, 14);
    addPointLight(T, 0, baseY + 7, -20, 0xFF4400, 2, 16);

    // Ceiling
    var ceilGeo = new T.BoxGeometry(28, 0.3, 24);
    var ceilMat = new T.MeshLambertMaterial({ color: 0x0D0D14 });
    var ceil = new T.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, baseY + 9.7, -20);
    scene.add(ceil);

    // Build Toshi (Lieutenant)
    buildToshi(T, baseY);
  }

  // Floor 3 – VIP lounge
  function buildFloor3(T) {
    var baseY = 20;
    var floorGeo = new T.BoxGeometry(28, 0.3, 24);
    var floorMat = new T.MeshLambertMaterial({ color: 0x0C0C12 });
    var floorMesh = new T.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, baseY, -20);
    scene.add(floorMesh);

    // VIP couches (BoxGeometry)
    var couchDefs = [
      { x: -8, z: -22, w: 5, d: 2 },
      { x:  8, z: -22, w: 5, d: 2 },
      { x:  0, z: -28, w: 8, d: 2 }
    ];
    for (var ci = 0; ci < couchDefs.length; ci++) {
      var cd = couchDefs[ci];
      var coGeo = new T.BoxGeometry(cd.w, 0.8, cd.d);
      var coMat = new T.MeshLambertMaterial({ color: 0x440011 });
      var coMesh = new T.Mesh(coGeo, coMat);
      coMesh.position.set(cd.x, baseY + 0.4, cd.z);
      coMesh.castShadow = true;
      scene.add(coMesh);
    }

    // Low coffee tables
    var ctGeo = new T.BoxGeometry(2.5, 0.3, 1.5);
    var ctMat = new T.MeshLambertMaterial({ color: 0x220800 });
    var ct1 = new T.Mesh(ctGeo, ctMat);
    ct1.position.set(-8, baseY + 0.45, -20);
    scene.add(ct1);
    var ct2 = new T.Mesh(ctGeo, ctMat);
    ct2.position.set(8, baseY + 0.45, -20);
    scene.add(ct2);

    // VIP neon
    addPointLight(T, -5, baseY + 5, -20, 0xAA00FF, 3, 18);
    addPointLight(T, 5, baseY + 5, -20, 0xFF0055, 2.5, 16);
    addPointLight(T, 0, baseY + 6, -25, 0x0044FF, 2, 14);

    // Ceiling
    var ceilGeo = new T.BoxGeometry(28, 0.3, 24);
    var ceilMat = new T.MeshLambertMaterial({ color: 0x0C0C12 });
    var ceil = new T.Mesh(ceilGeo, ceilMat);
    ceil.position.set(0, baseY + 9.7, -20);
    scene.add(ceil);
  }

  // Floor 4 – Rooftop dojo
  function buildFloor4Roof(T) {
    var baseY = 30;
    // Roof deck
    var roofGeo = new T.BoxGeometry(30, 0.4, 26);
    var roofMat = new T.MeshLambertMaterial({ color: 0x0A0A10 });
    var roofMesh = new T.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, baseY, -20);
    scene.add(roofMesh);

    // Dojo mat borders – LineSegments grid
    var matBorderPts = [];
    var dojoMinX = -8, dojoMaxX = 8, dojoMinZ = -28, dojoMaxZ = -12;
    matBorderPts.push(
      dojoMinX, baseY + 0.05, dojoMinZ,  dojoMaxX, baseY + 0.05, dojoMinZ,
      dojoMaxX, baseY + 0.05, dojoMinZ,  dojoMaxX, baseY + 0.05, dojoMaxZ,
      dojoMaxX, baseY + 0.05, dojoMaxZ,  dojoMinX, baseY + 0.05, dojoMaxZ,
      dojoMinX, baseY + 0.05, dojoMaxZ,  dojoMinX, baseY + 0.05, dojoMinZ,
      // inner lines
      -2, baseY + 0.05, dojoMinZ,  -2, baseY + 0.05, dojoMaxZ,
       2, baseY + 0.05, dojoMinZ,   2, baseY + 0.05, dojoMaxZ,
      dojoMinX, baseY + 0.05, -20,  dojoMaxX, baseY + 0.05, -20
    );
    var matGeo = new T.BufferGeometry();
    matGeo.setAttribute('position', new T.Float32BufferAttribute(matBorderPts, 3));
    var matLineMat = new T.LineBasicMaterial({ color: 0xCCBB88 });
    scene.add(new T.LineSegments(matGeo, matLineMat));

    // Dojo mat surface
    var dojoMatGeo = new T.BoxGeometry(16, 0.08, 16);
    var dojoMatMat = new T.MeshLambertMaterial({ color: 0x1A1408 });
    var dojoMatMesh = new T.Mesh(dojoMatGeo, dojoMatMat);
    dojoMatMesh.position.set(0, baseY + 0.04, -20);
    scene.add(dojoMatMesh);

    // Training posts CylinderGeometry
    var postPositions = [
      [-6, -14], [6, -14], [-6, -26], [6, -26], [0, -20]
    ];
    for (var pi = 0; pi < postPositions.length; pi++) {
      var pp = postPositions[pi];
      var postGeo = new T.CylinderGeometry(0.2, 0.22, 2.5, 8);
      var postMat = new T.MeshLambertMaterial({ color: 0x664422 });
      var postMesh = new T.Mesh(postGeo, postMat);
      postMesh.position.set(pp[0], baseY + 1.25, pp[1]);
      postMesh.castShadow = true;
      scene.add(postMesh);
    }

    // Torii gate pillars (CylinderGeometry)
    var torii1 = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 5, 8),
      new T.MeshLambertMaterial({ color: 0xAA2200 }));
    torii1.position.set(-5, baseY + 2.5, -12);
    scene.add(torii1);
    var torii2 = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 5, 8),
      new T.MeshLambertMaterial({ color: 0xAA2200 }));
    torii2.position.set(5, baseY + 2.5, -12);
    scene.add(torii2);
    var toriiTop = new T.Mesh(new T.BoxGeometry(12, 0.4, 0.4),
      new T.MeshLambertMaterial({ color: 0xAA2200 }));
    toriiTop.position.set(0, baseY + 5.2, -12);
    scene.add(toriiTop);

    // Rooftop neon – dramatic
    addPointLight(T, 0, baseY + 8, -20, 0xFF0088, 4, 30);
    addPointLight(T, -10, baseY + 4, -15, 0x00FFCC, 2.5, 20);
    addPointLight(T,  10, baseY + 4, -25, 0xFF4400, 2.5, 20);
    addPointLight(T, 0, baseY + 3, -12, 0xFFCC00, 2, 16);

    // Parapet walls
    var parapetGeo = new T.BoxGeometry(30, 1.2, 0.5);
    var parapetMat = new T.MeshLambertMaterial({ color: 0x0F0F18 });
    var parF = new T.Mesh(parapetGeo, parapetMat);
    parF.position.set(0, baseY + 0.6, -7);
    scene.add(parF);
    var parB = new T.Mesh(parapetGeo, parapetMat);
    parB.position.set(0, baseY + 0.6, -33);
    scene.add(parB);
    var parapetGeoS = new T.BoxGeometry(0.5, 1.2, 26);
    var parL = new T.Mesh(parapetGeoS, parapetMat);
    parL.position.set(-15, baseY + 0.6, -20);
    scene.add(parL);
    var parR = new T.Mesh(parapetGeoS, parapetMat);
    parR.position.set(15, baseY + 0.6, -20);
    scene.add(parR);

    // Build Tanaka (oyabun)
    buildTanaka(T, baseY);
  }

  // ─── Staircases between floors ────────────────────────────────────────────────
  function buildStaircases(T) {
    // Each staircase: a BoxGeometry ramp accessible from south side
    var stairDefs = [
      { x: 11, y1: 0, y2: 10, z: -10 },
      { x: 11, y1: 10, y2: 20, z: -10 },
      { x: 11, y1: 20, y2: 30, z: -10 }
    ];
    for (var si = 0; si < stairDefs.length; si++) {
      var sd = stairDefs[si];
      var midY = (sd.y1 + sd.y2) / 2;
      var stGeo = new T.BoxGeometry(2, 10, 3);
      var stMat = new T.MeshLambertMaterial({ color: 0x1A1A28 });
      var stMesh = new T.Mesh(stGeo, stMat);
      stMesh.position.set(sd.x, midY, sd.z);
      stMesh.castShadow = true;
      scene.add(stMesh);
      staircases.push({ x: sd.x, y1: sd.y1, y2: sd.y2, z: sd.z });
    }
  }

  // ─── Player mesh ─────────────────────────────────────────────────────────────
  function buildPlayer(T) {
    var geo = new T.BoxGeometry(0.6, 1.8, 0.6);
    var mat = new T.MeshLambertMaterial({ color: 0x334455 });
    playerMesh = new T.Mesh(geo, mat);
    playerMesh.visible = false;
    scene.add(playerMesh);
  }

  // ─── Katana pickup ────────────────────────────────────────────────────────────
  function buildKatanaPickup(T) {
    var geo = new T.BoxGeometry(0.1, 0.8, 0.05);
    var mat = new T.MeshLambertMaterial({ color: 0xCCCCDD });
    katanaPickupMesh = new T.Mesh(geo, mat);
    katanaPickupMesh.position.set(katanaPickupPos.x, katanaPickupPos.y, katanaPickupPos.z);
    scene.add(katanaPickupMesh);
  }

  // ─── Lieutenant Toshi ─────────────────────────────────────────────────────────
  function buildToshi(T, baseY) {
    var bodyGeo = new T.BoxGeometry(0.8, 1.6, 0.5);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x221122 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.set(4, baseY + 0.8, -22);
    body.castShadow = true;
    scene.add(body);

    // Tattoo sleeve LineSegments
    var tatPts = [];
    for (var ti = 0; ti < 6; ti++) {
      var angle = (ti / 6) * Math.PI * 2;
      tatPts.push(0.42, -0.4 + ti * 0.15, 0, 0.42, -0.4 + ti * 0.15 + 0.08, 0);
    }
    var tatGeo = new T.BufferGeometry();
    tatGeo.setAttribute('position', new T.Float32BufferAttribute(tatPts, 3));
    var tatMat = new T.LineBasicMaterial({ color: 0xFF0044 });
    var tattoo = new T.LineSegments(tatGeo, tatMat);
    body.add(tattoo);

    // Head
    var headGeo = new T.BoxGeometry(0.55, 0.55, 0.55);
    var headMat = new T.MeshLambertMaterial({ color: 0xCC9966 });
    var head = new T.Mesh(headGeo, headMat);
    head.position.set(0, 1.05, 0);
    body.add(head);

    // Dual swords
    var swordGeo = new T.BoxGeometry(0.06, 1.0, 0.04);
    var swordMat = new T.MeshLambertMaterial({ color: 0xCCCCDD });
    var sword1 = new T.Mesh(swordGeo, swordMat);
    sword1.position.set(0.5, 0, 0);
    body.add(sword1);
    var sword2 = new T.Mesh(swordGeo, swordMat);
    sword2.position.set(-0.5, 0, 0);
    body.add(sword2);

    toshi = {
      mesh: body,
      hp: 200,
      maxHP: 200,
      pos: { x: 4, y: baseY + 0.8, z: -22 },
      floor: 2,
      state: 'PATROL', // PATROL | ALERT | SURRENDER
      attackTimer: 0,
      attackInterval: 2.0,
      patrolDir: 1,
      patrolTimer: 0
    };
  }

  // ─── Oyabun Tanaka ────────────────────────────────────────────────────────────
  function buildTanaka(T, baseY) {
    var bodyGeo = new T.BoxGeometry(0.9, 1.8, 0.6);
    var bodyMat = new T.MeshLambertMaterial({ color: 0x110011 });
    var body = new T.Mesh(bodyGeo, bodyMat);
    body.position.set(0, baseY + 0.9, -22);
    body.castShadow = true;
    scene.add(body);

    // Head
    var headGeo = new T.BoxGeometry(0.6, 0.6, 0.6);
    var headMat = new T.MeshLambertMaterial({ color: 0xBB8855 });
    var head = new T.Mesh(headGeo, headMat);
    head.position.set(0, 1.2, 0);
    body.add(head);

    // Katana
    var kGeo = new T.BoxGeometry(0.07, 1.4, 0.04);
    var kMat = new T.MeshLambertMaterial({ color: 0xEEEEFF });
    var katana = new T.Mesh(kGeo, kMat);
    katana.position.set(0.55, 0, 0);
    body.add(katana);

    tanaka = {
      mesh: body,
      hp: tanakaHP,
      maxHP: tanakaMaxHP,
      pos: { x: 0, y: baseY + 0.9, z: -22 },
      floor: 4,
      phase: 1,
      attackTimer: 0,
      attackInterval: 1.5,
      phaseTimer: 0,
      circleAngle: 0
    };
  }

  // ─── Hostage: Tanaka's daughter ───────────────────────────────────────────────
  function buildHostage(T) {
    var geo = new T.BoxGeometry(0.5, 1.5, 0.4);
    var mat = new T.MeshLambertMaterial({ color: 0x887766 });
    hostage = new T.Mesh(geo, mat);
    hostage.position.set(hostagePos.x, hostagePos.y, hostagePos.z);
    scene.add(hostage);

    // Bound hands indicator (LineSegments)
    var hPts = [-0.25, -0.3, 0.26,  0.25, -0.3, 0.26];
    var hGeo = new T.BufferGeometry();
    hGeo.setAttribute('position', new T.Float32BufferAttribute(hPts, 3));
    var hMat = new T.LineBasicMaterial({ color: 0xFF4400 });
    hostage.add(new T.LineSegments(hGeo, hMat));
  }

  // ─── Spawn yakuza (28 members across 4 floors) ───────────────────────────────
  function spawnYakuza(T) {
    yakuzaList = [];
    // Distribution: 8 ground, 8 gambling, 6 VIP, 6 rooftop (excluding Toshi/Tanaka)
    var floorDefs = [
      { count: 8, baseY: 0,  zMin: -30, zMax: -12, xMin: -10, xMax: 10 },
      { count: 8, baseY: 10, zMin: -30, zMax: -12, xMin: -10, xMax: 10 },
      { count: 6, baseY: 20, zMin: -30, zMax: -12, xMin: -10, xMax: 10 },
      { count: 6, baseY: 30, zMin: -30, zMax: -12, xMin: -12, xMax: 12 }
    ];
    var T3 = T;
    for (var fi = 0; fi < floorDefs.length; fi++) {
      var fd = floorDefs[fi];
      for (var yi = 0; yi < fd.count; yi++) {
        var yakuza = buildYakuzaMember(T3, fd.baseY, fd.xMin, fd.xMax, fd.zMin, fd.zMax, fi + 1);
        yakuzaList.push(yakuza);
      }
    }
    yakuzaAlive = yakuzaList.length;
  }

  function buildYakuzaMember(T, baseY, xMin, xMax, zMin, zMax, floor) {
    var geo = new T.BoxGeometry(0.65, 1.6, 0.5);
    var mat = new T.MeshLambertMaterial({ color: 0x221122 });
    var mesh = new T.Mesh(geo, mat);
    var px = randRange(xMin, xMax);
    var pz = randRange(zMin, zMax);
    mesh.position.set(px, baseY + 0.8, pz);
    mesh.castShadow = true;
    scene.add(mesh);

    // Head
    var headGeo = new T.BoxGeometry(0.45, 0.45, 0.45);
    var headMat = new T.MeshLambertMaterial({ color: 0xCC8855 });
    var head = new T.Mesh(headGeo, headMat);
    head.position.set(0, 1.0, 0);
    mesh.add(head);

    // Tattoo sleeve LineSegments
    var tatPts = [];
    for (var ti = 0; ti < 5; ti++) {
      tatPts.push(0.33, -0.6 + ti * 0.2, 0, 0.33, -0.6 + ti * 0.2 + 0.1, 0);
    }
    var tatGeo = new T.BufferGeometry();
    tatGeo.setAttribute('position', new T.Float32BufferAttribute(tatPts, 3));
    var tatMat = new T.LineBasicMaterial({ color: 0x0088FF });
    mesh.add(new T.LineSegments(tatGeo, tatMat));

    // Weapon (alternating: pistol / katana visual)
    var useKatana = (Math.random() > 0.5);
    var wGeo, wMat, wMesh;
    if (useKatana) {
      wGeo = new T.BoxGeometry(0.05, 0.9, 0.03);
      wMat = new T.MeshLambertMaterial({ color: 0xBBBBCC });
    } else {
      wGeo = new T.BoxGeometry(0.15, 0.3, 0.08);
      wMat = new T.MeshLambertMaterial({ color: 0x222222 });
    }
    wMesh = new T.Mesh(wGeo, wMat);
    wMesh.position.set(0.4, 0, 0);
    mesh.add(wMesh);

    return {
      mesh: mesh,
      hp: 75,
      maxHP: 75,
      pos: { x: px, y: baseY + 0.8, z: pz },
      floor: floor,
      alive: true,
      state: 'PATROL', // PATROL | ALERT | DEAD
      attackTimer: randRange(0.5, 2.5),
      attackInterval: randRange(1.8, 3.2),
      patrolDir: Math.random() > 0.5 ? 1 : -1,
      patrolTimer: randRange(0, 3),
      usesKatana: useKatana,
      alert: false
    };
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'tokyo-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00FFCC',
      'font:bold 13px monospace',
      'z-index:9100',
      'text-shadow:0 0 8px #00FFCC',
      'pointer-events:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(hudEl);

    // Crosshair
    var xh = document.createElement('div');
    xh.id = 'tokyo-crosshair';
    xh.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FFCC',
      'font:bold 20px monospace',
      'z-index:9101',
      'pointer-events:none',
      'text-shadow:0 0 6px #00FFCC'
    ].join(';');
    xh.textContent = '+';
    document.body.appendChild(xh);

    // Minimap
    minimapCanvas = document.createElement('canvas');
    minimapCanvas.id = 'tokyo-minimap';
    minimapCanvas.width = 140;
    minimapCanvas.height = 140;
    minimapCanvas.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:10px',
      'z-index:9101',
      'border:1px solid #00FFCC',
      'background:rgba(0,0,0,0.6)'
    ].join(';');
    document.body.appendChild(minimapCanvas);
    minimapCtx = minimapCanvas.getContext('2d');

    // Controls hint
    var hint = document.createElement('div');
    hint.id = 'tokyo-hint';
    hint.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:10px',
      'color:#888899',
      'font:11px monospace',
      'z-index:9101',
      'pointer-events:none',
      'line-height:1.5'
    ].join(';');
    hint.innerHTML = 'WASD:move | Mouse:aim | Click:shoot | E:interact/shuriken | F:katana | R:deflect<br>Click screen to lock pointer';
    document.body.appendChild(hint);
  }

  function updateHUD() {
    if (!hudEl) return;
    var mins = Math.floor(timerSeconds / 60);
    var secs = Math.floor(timerSeconds % 60);
    var timerStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var floorStr = currentFloor + '/4';
    var toshiStr = toshiState;
    var tanakaStr = tanakaState === 'ALIVE' ? 'ALIVE' :
                    tanakaState === 'PHASE2' ? 'PHASE 2' :
                    tanakaState === 'PHASE3' ? 'PHASE 3' : 'DEFEATED';
    var hostageStr = hostageState;
    var weaponStr = currentWeapon.toUpperCase() + (currentWeapon === 'shuriken' ? ' [' + shurikenCount + ']' : '');
    hudEl.innerHTML =
      'TOKYO SHOWDOWN<br>' +
      '[FLOOR: ' + floorStr + ']<br>' +
      '[TOSHI: ' + toshiStr + ']<br>' +
      '[TANAKA: ' + tanakaStr + ']<br>' +
      '[HOSTAGE: ' + hostageStr + ']<br>' +
      '[YAKUZA: ' + yakuzaAlive + ']<br>' +
      '[TIMER: ' + timerStr + ']<br>' +
      '[HP: ' + playerHP + ']<br>' +
      '[WEAPON: ' + weaponStr + ']<br>' +
      (hasKatana ? '[KATANA: EQUIPPED]<br>' : '') +
      (katanaDeflecting ? '<span style="color:#FF0088">*** DEFLECTING ***</span><br>' : '') +
      (oyabunRevealed ? '<span style="color:#FFCC00">TANAKA LOCATION REVEALED</span><br>' : '');
  }

  function drawMinimap() {
    if (!minimapCtx) return;
    var ctx = minimapCtx;
    ctx.clearRect(0, 0, 140, 140);

    // Scale: map -30 to +30 on X, -35 to +35 on Z -> 140px
    function mapX(wx) { return (wx + 30) / 60 * 140; }
    function mapZ(wz) { return (wz + 35) / 70 * 140; }

    // Draw stronghold outline
    ctx.strokeStyle = '#334455';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX(-15), mapZ(-33), mapX(15) - mapX(-15), mapZ(-7) - mapZ(-33));

    // Draw player
    ctx.fillStyle = '#00FFCC';
    ctx.beginPath();
    ctx.arc(mapX(playerPos.x), mapZ(playerPos.z), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw alive yakuza
    for (var yi = 0; yi < yakuzaList.length; yi++) {
      var y = yakuzaList[yi];
      if (y.alive && y.floor === currentFloor) {
        ctx.fillStyle = '#FF0088';
        ctx.fillRect(mapX(y.pos.x) - 2, mapZ(y.pos.z) - 2, 4, 4);
      }
    }

    // Toshi
    if (toshi && toshiState !== 'DEAD' && toshi.floor === currentFloor) {
      ctx.fillStyle = toshiState === 'SURRENDERED' ? '#FFFF00' : '#FF4400';
      ctx.fillRect(mapX(toshi.pos.x) - 3, mapZ(toshi.pos.z) - 3, 6, 6);
    }

    // Tanaka (only if revealed)
    if (tanaka && tanakaState !== 'DEFEATED' && oyabunRevealed && tanaka.floor === currentFloor) {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(mapX(tanaka.pos.x), mapZ(tanaka.pos.z), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FF8800';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Hostage
    if (hostageState === 'FOUND' && currentFloor === 3) {
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(mapX(hostagePos.x) - 3, mapZ(hostagePos.z) - 3, 6, 6);
    }

    // Floor label
    ctx.fillStyle = '#00FFCC';
    ctx.font = '10px monospace';
    ctx.fillText('FLOOR ' + currentFloor, 4, 12);
  }

  // ─── Controls setup ────────────────────────────────────────────────────────────
  function setupControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', function () {
      renderer.domElement.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function () {
      pointerLocked = document.pointerLockElement === renderer.domElement;
    });
  }

  function onKeyDown(e) {
    moveKeys[e.code] = true;
    if (e.code === 'KeyE') { tryInteract(); }
    if (e.code === 'KeyF') { switchWeapon(); }
    if (e.code === 'KeyR') { startDeflect(); }
    if (e.code === 'Digit1') { currentWeapon = 'pistol'; }
    if (e.code === 'Digit2' && hasKatana) { currentWeapon = 'katana'; }
    if (e.code === 'Digit3') { currentWeapon = 'shuriken'; }
  }

  function onKeyUp(e) {
    moveKeys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!pointerLocked) return;
    playerYaw -= e.movementX * 0.002;
    playerPitch -= e.movementY * 0.002;
    playerPitch = clamp(playerPitch, -1.2, 1.2);
  }

  function onMouseDown(e) {
    if (!active || gameOver || gameWon) return;
    if (e.button === 0) { tryShoot(); }
  }

  function switchWeapon() {
    if (currentWeapon === 'pistol' && hasKatana) {
      currentWeapon = 'katana';
    } else if (currentWeapon === 'katana') {
      currentWeapon = 'pistol';
    }
  }

  function startDeflect() {
    if (!hasKatana || currentWeapon !== 'katana') return;
    katanaDeflecting = true;
    deflectTimer = deflectWindow;
    playDeflect();
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────────
  function tryShoot() {
    if (gameOver || gameWon) return;
    if (currentWeapon === 'pistol') {
      if (shootCooldown > 0) return;
      shootCooldown = 0.25;
      spawnBullet(false);
      playShot();
    } else if (currentWeapon === 'katana') {
      if (meleeCooldown > 0) return;
      meleeCooldown = 0.5;
      doMeleeAttack();
      playSword();
    } else if (currentWeapon === 'shuriken') {
      if (shurikenCount <= 0) return;
      if (shootCooldown > 0) return;
      shootCooldown = 0.3;
      shurikenCount--;
      spawnShuriken();
      playShot();
    }
  }

  function spawnBullet(fromEnemy, originPos, dirVec) {
    var T = window.THREE;
    var geo = new T.SphereGeometry(0.06, 4, 4);
    var mat = new T.MeshLambertMaterial({ color: fromEnemy ? 0xFF4400 : 0xFFFF00 });
    var mesh = new T.Mesh(geo, mat);
    var startPos, dir;
    if (fromEnemy && originPos && dirVec) {
      startPos = { x: originPos.x, y: originPos.y + 1.2, z: originPos.z };
      dir = { x: dirVec.x, y: dirVec.y, z: dirVec.z };
    } else {
      startPos = { x: playerPos.x, y: playerPos.y + 1.5, z: playerPos.z };
      var fwd = getForwardDir();
      dir = fwd;
    }
    mesh.position.set(startPos.x, startPos.y, startPos.z);
    scene.add(mesh);
    var bObj = { mesh: mesh, pos: startPos, dir: dir, speed: 40, life: 2.0, fromEnemy: fromEnemy, damage: 20 };
    if (fromEnemy) { enemyBullets.push(bObj); } else { bullets.push(bObj); }
  }

  function spawnShuriken() {
    var T = window.THREE;
    var geo = new T.BoxGeometry(0.25, 0.05, 0.25);
    var mat = new T.MeshLambertMaterial({ color: 0xCCCCDD });
    var mesh = new T.Mesh(geo, mat);
    var startPos = { x: playerPos.x, y: playerPos.y + 1.5, z: playerPos.z };
    var fwd = getForwardDir();
    mesh.position.set(startPos.x, startPos.y, startPos.z);
    scene.add(mesh);
    shurikens.push({ mesh: mesh, pos: startPos, dir: fwd, speed: 35, life: 3.0, damage: 15 });
  }

  function getForwardDir() {
    var cos = Math.cos(playerYaw);
    var sin = Math.sin(playerYaw);
    var pitchCos = Math.cos(playerPitch);
    return {
      x: -sin * pitchCos,
      y: Math.sin(playerPitch),
      z: -cos * pitchCos
    };
  }

  function doMeleeAttack() {
    var reach = 2.5;
    var fwd = getForwardDir();
    var hitPos = { x: playerPos.x + fwd.x * reach, y: playerPos.y + 1, z: playerPos.z + fwd.z * reach };
    // Check yakuza
    for (var yi = 0; yi < yakuzaList.length; yi++) {
      var y = yakuzaList[yi];
      if (!y.alive) continue;
      if (dist3d(hitPos, y.pos) < 2.0) {
        damageYakuza(y, 35);
      }
    }
    // Check Toshi
    if (toshi && toshiState === 'ALIVE' && dist3d(hitPos, toshi.pos) < 2.0) {
      damageToshi(35);
    }
    // Check Tanaka
    if (tanaka && tanakaState !== 'DEFEATED' && dist3d(hitPos, tanaka.pos) < 2.5) {
      damageTanaka(35);
    }
  }

  // ─── Interact (E) ─────────────────────────────────────────────────────────────
  function tryInteract() {
    if (interactCooldown > 0) return;
    interactCooldown = 1.0;

    // Check Toshi surrender interrogate
    if (toshi && toshiState === 'SURRENDERED') {
      if (dist3d(playerPos, toshi.pos) < 4.0) {
        oyabunRevealed = true;
        showMsg('TOSHI: "Oyabun Tanaka waits on the rooftop dojo. Fourth floor. Be careful..."');
      }
    }

    // Check hostage (free her)
    if (hostage && hostageState === 'FOUND') {
      if (dist3d(playerPos, hostagePos) < 3.5) {
        freeHostage();
      }
    }

    // Check katana pickup
    if (!katanaPickedUp && katanaPickupMesh) {
      if (dist3d(playerPos, katanaPickupPos) < 2.5) {
        pickupKatana();
      }
    }
  }

  function freeHostage() {
    hostageState = 'FREED';
    if (hostage) {
      hostage.visible = false;
    }
    tanakaPausedTimer = 10.0;
    showMsg('Hostage freed! Tanaka pauses in grief — 10 seconds!');
  }

  function pickupKatana() {
    katanaPickedUp = true;
    hasKatana = true;
    currentWeapon = 'katana';
    if (katanaPickupMesh) katanaPickupMesh.visible = false;
    showMsg('Katana acquired! Press F to switch, R to deflect bullets.');
  }

  // ─── Damage functions ─────────────────────────────────────────────────────────
  function damageYakuza(y, dmg) {
    if (!y.alive) return;
    y.hp -= dmg;
    playHit();
    if (y.hp <= 0) {
      y.alive = false;
      y.state = 'DEAD';
      y.mesh.visible = false;
      yakuzaAlive--;
      playKill();
    } else {
      y.state = 'ALERT';
    }
  }

  function damageToshi(dmg) {
    if (toshiState !== 'ALIVE') return;
    toshi.hp -= dmg;
    playHit();
    if (toshi.hp <= 0) {
      toshiState = 'DEAD';
      toshi.mesh.visible = false;
      showMsg('Lieutenant Toshi defeated!');
    } else if (toshi.hp < toshi.maxHP * 0.3) {
      toshiState = 'SURRENDERED';
      toshi.state = 'SURRENDER';
      showMsg('Toshi: "I yield! I yield! Mercy..." Press E near him to interrogate.');
    }
  }

  function damageTanaka(dmg) {
    if (tanakaState === 'DEFEATED') return;
    if (tanakaPausedTimer > 0) return; // paused
    tanaka.hp -= dmg;
    tanakaHP = tanaka.hp;
    playHit();

    // Phase transitions
    if (tanaka.hp <= tanakaMaxHP * 0.66 && tanakaState === 'ALIVE') {
      tanakaState = 'PHASE2';
      tanaka.phase = 2;
      tanaka.attackInterval = 1.0;
      showMsg('TANAKA PHASE 2: Unarmed combat!');
    }
    if (tanaka.hp <= tanakaMaxHP * 0.33 && tanakaState === 'PHASE2') {
      tanakaState = 'PHASE3';
      tanaka.phase = 3;
      tanaka.attackInterval = 0.7;
      showMsg('TANAKA PHASE 3: SUMMONS LAST GUARDS!');
      summonTanakaGuards();
    }
    if (tanaka.hp <= 0 && tanakaState !== 'DEFEATED') {
      tanakaState = 'DEFEATED';
      if (tanaka.mesh) tanaka.mesh.visible = false;
      gameWon = true;
      showMsg('OYABUN TANAKA DEFEATED! Tokyo is free!');
      showEndScreen(true);
      playKill();
    }
  }

  function summonTanakaGuards() {
    var T = window.THREE;
    var guardPositions = [
      { x: -5, z: -18 }, { x: 5, z: -18 },
      { x: -5, z: -26 }, { x: 5, z: -26 }
    ];
    for (var gi = 0; gi < guardPositions.length; gi++) {
      var gp = guardPositions[gi];
      var yakuza = buildYakuzaMember(T, 30, gp.x - 1, gp.x + 1, gp.z - 1, gp.z + 1, 4);
      yakuza.state = 'ALERT';
      yakuzaList.push(yakuza);
      yakuzaAlive++;
    }
  }

  function damagePlayer(dmg) {
    if (katanaDeflecting && currentWeapon === 'katana') {
      playDeflect();
      return; // deflect
    }
    playerHP -= dmg;
    playHit();
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      showMsg('YOU HAVE FALLEN... The yakuza reclaim Tokyo.');
      showEndScreen(false);
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────────
  function updateYakuzaAI(dt) {
    for (var yi = 0; yi < yakuzaList.length; yi++) {
      var y = yakuzaList[yi];
      if (!y.alive || y.state === 'DEAD') continue;

      var dx = playerPos.x - y.pos.x;
      var dz = playerPos.z - y.pos.z;
      var distToPlayer = Math.sqrt(dx * dx + dz * dz);
      var onSameFloor = (y.floor === currentFloor);

      if (!onSameFloor) continue;

      // Alert if player is close
      if (distToPlayer < 12) {
        y.state = 'ALERT';
      }

      if (y.state === 'ALERT') {
        // Move toward player
        if (distToPlayer > 2.5) {
          var speed = 3.5;
          y.pos.x += (dx / distToPlayer) * speed * dt;
          y.pos.z += (dz / distToPlayer) * speed * dt;
          y.mesh.position.set(y.pos.x, y.pos.y, y.pos.z);
          // Face player
          y.mesh.rotation.y = Math.atan2(dx, dz);
        }

        // Attack
        y.attackTimer -= dt;
        if (y.attackTimer <= 0) {
          y.attackTimer = y.attackInterval;
          if (distToPlayer < 2.5) {
            // Melee
            damagePlayer(y.usesKatana ? 12 : 8);
          } else if (distToPlayer < 12 && !y.usesKatana) {
            // Shoot
            var dir = { x: dx / distToPlayer, y: 0, z: dz / distToPlayer };
            spawnBullet(true, y.pos, dir);
          }
        }
      } else {
        // Patrol
        y.patrolTimer -= dt;
        if (y.patrolTimer <= 0) {
          y.patrolTimer = randRange(2, 4);
          y.patrolDir = -y.patrolDir;
        }
        y.pos.x += y.patrolDir * 1.5 * dt;
        y.pos.x = clamp(y.pos.x, -11, 11);
        y.mesh.position.set(y.pos.x, y.pos.y, y.pos.z);
      }

      // Hostage discovery
      if (y.floor === 3 && hostageState === 'HIDDEN' && distToPlayer < 8) {
        hostageState = 'FOUND';
        showMsg('You spot Tanaka\'s daughter bound in the VIP lounge! Press E to free her.');
      }
    }
  }

  function updateToshiAI(dt) {
    if (!toshi || toshiState !== 'ALIVE') return;
    if (toshi.floor !== currentFloor) return;

    var dx = playerPos.x - toshi.pos.x;
    var dz = playerPos.z - toshi.pos.z;
    var distToPlayer = Math.sqrt(dx * dx + dz * dz);

    if (distToPlayer < 15) {
      toshi.state = 'ALERT';
    }

    if (toshi.state === 'ALERT') {
      if (distToPlayer > 3) {
        var speed = 4.5;
        toshi.pos.x += (dx / distToPlayer) * speed * dt;
        toshi.pos.z += (dz / distToPlayer) * speed * dt;
        toshi.mesh.position.set(toshi.pos.x, toshi.pos.y, toshi.pos.z);
        toshi.mesh.rotation.y = Math.atan2(dx, dz);
      }

      toshi.attackTimer -= dt;
      if (toshi.attackTimer <= 0) {
        toshi.attackTimer = toshi.attackInterval;
        if (distToPlayer < 3) {
          damagePlayer(18); // dual swords
        } else if (distToPlayer < 12) {
          var dir = { x: dx / distToPlayer, y: 0, z: dz / distToPlayer };
          spawnBullet(true, toshi.pos, dir);
        }
      }
    }
  }

  function updateTanakaAI(dt) {
    if (!tanaka || tanakaState === 'DEFEATED') return;
    if (tanaka.floor !== currentFloor) return;
    if (tanakaPausedTimer > 0) {
      tanakaPausedTimer -= dt;
      return;
    }

    var dx = playerPos.x - tanaka.pos.x;
    var dz = playerPos.z - tanaka.pos.z;
    var distToPlayer = Math.sqrt(dx * dx + dz * dz);

    // Tanaka circles the player
    tanaka.circleAngle += dt * (tanaka.phase === 1 ? 0.8 : tanaka.phase === 2 ? 1.2 : 1.6);
    var circleR = 4;
    var targetX = playerPos.x + Math.sin(tanaka.circleAngle) * circleR;
    var targetZ = playerPos.z + Math.cos(tanaka.circleAngle) * circleR;
    tanaka.pos.x += (targetX - tanaka.pos.x) * dt * 2;
    tanaka.pos.z += (targetZ - tanaka.pos.z) * dt * 2;
    tanaka.mesh.position.set(tanaka.pos.x, tanaka.pos.y, tanaka.pos.z);
    tanaka.mesh.rotation.y = Math.atan2(dx, dz);

    tanaka.attackTimer -= dt;
    if (tanaka.attackTimer <= 0) {
      tanaka.attackTimer = tanaka.attackInterval;
      if (distToPlayer < 3) {
        var phaseDmg = tanaka.phase === 1 ? 22 : tanaka.phase === 2 ? 18 : 28;
        damagePlayer(phaseDmg);
      } else if (tanaka.phase === 1 && distToPlayer < 15) {
        // Phase 1: sword throw (ranged)
        var dir = { x: dx / distToPlayer, y: 0, z: dz / distToPlayer };
        spawnBullet(true, tanaka.pos, dir);
      } else if (tanaka.phase === 3 && distToPlayer < 10) {
        // Phase 3: rapid strikes
        damagePlayer(15);
      }
    }
  }

  // ─── Projectile updates ───────────────────────────────────────────────────────
  function updateProjectiles(dt) {
    // Player bullets
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var b = bullets[bi];
      b.pos.x += b.dir.x * b.speed * dt;
      b.pos.y += b.dir.y * b.speed * dt;
      b.pos.z += b.dir.z * b.speed * dt;
      b.mesh.position.set(b.pos.x, b.pos.y, b.pos.z);
      b.life -= dt;
      var hit = false;
      // Check yakuza
      for (var yi = 0; yi < yakuzaList.length; yi++) {
        var y = yakuzaList[yi];
        if (!y.alive) continue;
        if (dist3d(b.pos, y.pos) < 1.0) {
          damageYakuza(y, b.damage);
          hit = true;
          break;
        }
      }
      // Check Toshi
      if (!hit && toshi && toshiState === 'ALIVE' && dist3d(b.pos, toshi.pos) < 1.2) {
        damageToshi(b.damage);
        hit = true;
      }
      // Check Tanaka
      if (!hit && tanaka && tanakaState !== 'DEFEATED' && dist3d(b.pos, tanaka.pos) < 1.4) {
        damageTanaka(b.damage);
        hit = true;
      }
      if (hit || b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(bi, 1);
      }
    }

    // Enemy bullets
    for (var ei = enemyBullets.length - 1; ei >= 0; ei--) {
      var eb = enemyBullets[ei];
      eb.pos.x += eb.dir.x * eb.speed * dt;
      eb.pos.y += eb.dir.y * eb.speed * dt;
      eb.pos.z += eb.dir.z * eb.speed * dt;
      eb.mesh.position.set(eb.pos.x, eb.pos.y, eb.pos.z);
      eb.life -= dt;
      var eHit = false;
      if (dist3d(eb.pos, playerPos) < 1.2) {
        damagePlayer(eb.damage);
        eHit = true;
      }
      if (eHit || eb.life <= 0) {
        scene.remove(eb.mesh);
        enemyBullets.splice(ei, 1);
      }
    }

    // Shurikens
    for (var si = shurikens.length - 1; si >= 0; si--) {
      var sh = shurikens[si];
      sh.pos.x += sh.dir.x * sh.speed * dt;
      sh.pos.y += sh.dir.y * sh.speed * dt;
      sh.pos.z += sh.dir.z * sh.speed * dt;
      sh.mesh.position.set(sh.pos.x, sh.pos.y, sh.pos.z);
      sh.mesh.rotation.y += dt * 10;
      sh.life -= dt;
      var sHit = false;
      for (var syi = 0; syi < yakuzaList.length; syi++) {
        var sy = yakuzaList[syi];
        if (!sy.alive) continue;
        if (dist3d(sh.pos, sy.pos) < 1.0) {
          damageYakuza(sy, sh.damage);
          sHit = true;
          break;
        }
      }
      if (!sHit && toshi && toshiState === 'ALIVE' && dist3d(sh.pos, toshi.pos) < 1.2) {
        damageToshi(sh.damage);
        sHit = true;
      }
      if (!sHit && tanaka && tanakaState !== 'DEFEATED' && dist3d(sh.pos, tanaka.pos) < 1.4) {
        damageTanaka(sh.damage);
        sHit = true;
      }
      if (sHit || sh.life <= 0) {
        scene.remove(sh.mesh);
        shurikens.splice(si, 1);
      }
    }
  }

  // ─── Player movement ──────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (gameOver || gameWon) return;

    var speed = playerSpeed;
    var cos = Math.cos(playerYaw);
    var sin = Math.sin(playerYaw);
    var moveX = 0, moveZ = 0;

    if (moveKeys['KeyW'] || moveKeys['ArrowUp'])    { moveX -= sin; moveZ -= cos; }
    if (moveKeys['KeyS'] || moveKeys['ArrowDown'])  { moveX += sin; moveZ += cos; }
    if (moveKeys['KeyA'] || moveKeys['ArrowLeft'])  { moveX -= cos; moveZ += sin; }
    if (moveKeys['KeyD'] || moveKeys['ArrowRight']) { moveX += cos; moveZ -= sin; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX = (moveX / len) * speed * dt;
      moveZ = (moveZ / len) * speed * dt;
    }

    playerPos.x += moveX;
    playerPos.z += moveZ;

    // Floor detection: staircases allow player to move between floors
    updateFloorHeight();

    // Camera
    camera.position.set(playerPos.x, playerPos.y + 1.6, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;

    // Update player mesh (for shadow reference)
    if (playerMesh) playerMesh.position.set(playerPos.x, playerPos.y, playerPos.z);

    // Katana pickup proximity
    if (!katanaPickedUp && dist3d(playerPos, katanaPickupPos) < 2.5) {
      showMsgOnce('katana-hint', 'Press E to pick up katana');
    }

    // Hostage proximity
    if (hostageState === 'FOUND' && dist3d(playerPos, hostagePos) < 3.5) {
      showMsgOnce('hostage-hint', 'Press E to free the hostage');
    }

    // Toshi surrender proximity
    if (toshi && toshiState === 'SURRENDERED' && dist3d(playerPos, toshi.pos) < 4.0) {
      showMsgOnce('toshi-hint', 'Press E to interrogate Toshi');
    }
  }

  function updateFloorHeight() {
    // Determine which floor the player should be on based on Z position in stronghold
    var inStronghold = playerPos.x > -15 && playerPos.x < 15 && playerPos.z > -33 && playerPos.z < -7;
    var nearStaircase = false;
    var targetFloorY = 0;

    for (var si = 0; si < staircases.length; si++) {
      var st = staircases[si];
      var dx = playerPos.x - st.x;
      var dz = playerPos.z - st.z;
      if (Math.abs(dx) < 2 && Math.abs(dz) < 3) {
        nearStaircase = true;
        // Gradually move between floors
        if (playerPos.y < st.y2 - 0.5) {
          playerPos.y = Math.min(playerPos.y + 8 * (1.0 / 60), st.y2);
        }
      }
    }

    if (!nearStaircase && inStronghold) {
      // Snap to floor
      if (playerPos.y >= 28) { targetFloorY = 30; }
      else if (playerPos.y >= 18) { targetFloorY = 20; }
      else if (playerPos.y >= 8) { targetFloorY = 10; }
      else { targetFloorY = 0; }

      if (Math.abs(playerPos.y - targetFloorY) > 0.5) {
        playerPos.y += (targetFloorY - playerPos.y) * 5 * (1.0 / 60);
      } else {
        playerPos.y = targetFloorY;
      }
    } else if (!inStronghold) {
      playerPos.y = 0;
    }

    // Clamp to world bounds
    playerPos.x = clamp(playerPos.x, -40, 40);
    playerPos.z = clamp(playerPos.z, -38, 35);

    // Determine current floor
    if (playerPos.y >= 28) { currentFloor = 4; }
    else if (playerPos.y >= 18) { currentFloor = 3; }
    else if (playerPos.y >= 8) { currentFloor = 2; }
    else { currentFloor = 1; }

    // Hostage found check (player must be on floor 3 and inside stronghold)
    if (currentFloor === 3 && hostageState === 'HIDDEN' && inStronghold) {
      hostageState = 'FOUND';
      showMsg('You found Tanaka\'s daughter bound in the VIP lounge! Press E near her to free her.');
    }
  }

  // ─── Neon flicker ─────────────────────────────────────────────────────────────
  function updateNeonFlicker(dt) {
    for (var ni = 0; ni < neonLights.length; ni++) {
      var nl = neonLights[ni];
      if (Math.random() < 0.02) {
        nl.intensity = nl.intensity * (0.6 + Math.random() * 0.8);
      }
    }
  }

  // ─── Cooldown updates ─────────────────────────────────────────────────────────
  function updateCooldowns(dt) {
    if (shootCooldown > 0) shootCooldown -= dt;
    if (meleeCooldown > 0) meleeCooldown -= dt;
    if (interactCooldown > 0) interactCooldown -= dt;
    if (deflectTimer > 0) {
      deflectTimer -= dt;
      if (deflectTimer <= 0) katanaDeflecting = false;
    }
  }

  // ─── One-shot messages ────────────────────────────────────────────────────────
  var msgShownOnce = {};
  function showMsgOnce(key, text) {
    if (msgShownOnce[key]) return;
    msgShownOnce[key] = true;
    showMsg(text);
  }

  var msgEl = null;
  var msgTimer = 0;
  function showMsg(text) {
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'tokyo-msg';
      msgEl.style.cssText = [
        'position:fixed',
        'bottom:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#FFCC00',
        'font:bold 14px monospace',
        'z-index:9102',
        'text-shadow:0 0 10px #FF4400',
        'background:rgba(0,0,0,0.7)',
        'padding:6px 16px',
        'border:1px solid #FF4400',
        'pointer-events:none',
        'text-align:center',
        'max-width:600px'
      ].join(';');
      document.body.appendChild(msgEl);
    }
    msgEl.textContent = text;
    msgEl.style.display = 'block';
    msgTimer = 4.0;
  }

  function updateMsg(dt) {
    if (msgTimer > 0) {
      msgTimer -= dt;
      if (msgTimer <= 0 && msgEl) {
        msgEl.style.display = 'none';
      }
    }
  }

  // ─── End screen ───────────────────────────────────────────────────────────────
  function showEndScreen(won) {
    var el = document.createElement('div');
    el.id = 'tokyo-end';
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'background:rgba(0,0,0,0.85)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'flex-direction:column',
      'z-index:9200',
      'color:' + (won ? '#00FFCC' : '#FF0088'),
      'font:bold 32px monospace',
      'text-shadow:0 0 20px ' + (won ? '#00FFCC' : '#FF0088')
    ].join(';');
    var titleText = won ? 'TOKYO LIBERATED' : 'MISSION FAILED';
    var subText = won
      ? 'Oyabun Tanaka falls. The yakuza clan is broken.<br><small style="font-size:16px">The neon district breathes again.</small>'
      : 'The yakuza hold Tokyo.<br><small style="font-size:16px">Another agent must be sent.</small>';
    el.innerHTML = titleText + '<br><div style="font-size:18px;margin-top:20px">' + subText + '</div>';
    document.body.appendChild(el);
  }

  // ─── Main loop ────────────────────────────────────────────────────────────────
  function loop(timestamp) {
    if (!active) return;
    animFrameId = requestAnimationFrame(loop);

    var now = timestamp / 1000;
    var dt = Math.min(now - clock.last, 0.05);
    clock.last = now;

    if (!gameOver && !gameWon) {
      timerSeconds -= dt;
      if (timerSeconds <= 0) {
        timerSeconds = 0;
        gameOver = true;
        showEndScreen(false);
        showMsg('TIME EXPIRED — mission failed.');
      }

      updateCooldowns(dt);
      updatePlayer(dt);
      updateProjectiles(dt);
      updateYakuzaAI(dt);
      updateToshiAI(dt);
      updateTanakaAI(dt);
      updateNeonFlicker(dt);
      updateMsg(dt);
    }

    updateHUD();
    drawMinimap();
    renderer.render(scene, camera);
  }

  // ─── Resize handler ───────────────────────────────────────────────────────────
  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Teardown ────────────────────────────────────────────────────────────────
  function teardown() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('resize', onResize);
    ['tokyo-canvas','tokyo-hud','tokyo-crosshair','tokyo-minimap','tokyo-hint','tokyo-msg','tokyo-end'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.parentNode.removeChild(el);
    });
    if (renderer) {
      renderer.dispose();
    }
    scene = null; camera = null; renderer = null; animFrameId = null;
    active = false;
  }

  // ─── init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (active) return;
    active = true;
    gameOver = false;
    gameWon = false;
    playerHP = 150;
    timerSeconds = 600;
    toshiState = 'ALIVE';
    tanakaState = 'ALIVE';
    tanakaHP = 600;
    hostageState = 'HIDDEN';
    oyabunRevealed = false;
    currentFloor = 1;
    playerPos = { x: 0, y: 1, z: 20 };
    playerYaw = Math.PI;
    playerPitch = 0;
    hasKatana = false;
    katanaPickedUp = false;
    currentWeapon = 'pistol';
    shurikenCount = 10;
    bullets = [];
    enemyBullets = [];
    shurikens = [];
    yakuzaList = [];
    yakuzaAlive = 0;
    moveKeys = {};
    neonLights = [];
    staircases = [];
    toshi = null;
    tanaka = null;
    hostage = null;
    katanaPickupMesh = null;
    msgShownOnce = {};

    initAudio();
    if (!buildScene()) {
      active = false;
      return;
    }
    setupControls();
    window.addEventListener('resize', onResize);
    clock.last = performance.now() / 1000;
    showMsg('TOKYO SHOWDOWN — Infiltrate the yakuza stronghold. Reach Oyabun Tanaka on the rooftop. T+K to activate.');
    animFrameId = requestAnimationFrame(loop);
  }

  // ─── update (external tick, not required — game runs its own RAF) ─────────────
  function update() {}

  // ─── reset ────────────────────────────────────────────────────────────────────
  function reset() {
    teardown();
    init();
  }

  // ─── Global activation key listener ──────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var now = Date.now();
    if (e.code === 'KeyT') { tDownAt = now; }
    if (e.code === 'KeyK') { kDownAt = now; }
    if (e.code === 'KeyT' || e.code === 'KeyK') {
      if (Math.abs(tDownAt - kDownAt) <= ACTIVATION_WINDOW && tDownAt > 0 && kDownAt > 0) {
        tDownAt = 0; kDownAt = 0;
        if (!active) { init(); }
      }
    }
    if (e.code === 'Escape' && active) { teardown(); }
  });

  return { init: init, update: update, reset: reset };

}());
