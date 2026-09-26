window.OilPlatform = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'OilPlatform';
  var ACTIVATION_KEY_O = 79;
  var ACTIVATION_KEY_P = 80;
  var ACTIVATION_WINDOW = 400;

  var DECK_Y = 12;
  var SEA_Y = -8;
  var DEFUSE_TIME = 6;
  var FREE_WORKER_TIME = 1;
  var MISSION_TIME = 600; // 10 minutes
  var BOMB_PULSE_SPEED = 3;
  var PLAYER_SPEED = 8;
  var ENEMY_SIGHT = 22;
  var ENEMY_FIRE_RANGE = 18;
  var ENEMY_FIRE_RATE = 1.5;
  var LEADER_SIGHT = 35;
  var LEADER_FIRE_RATE = 2.5;
  var LEADER_HP = 350;
  var RPG_SPEED = 20;
  var WORKER_FIRE_DAMAGE = 3;
  var MUSTER_X = -30;
  var MUSTER_Z = 10;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: DECK_Y + 1, z: 30 },
    playerHP: 100,
    gameOver: false,
    won: false,
    lastTime: 0,
    animFrameId: null,
    keysDown: {},
    keyTimes: {},
    // Objects
    objects: [],
    bombs: [],
    workers: [],
    terrorists: [],
    leader: null,
    gate: null,
    gateLocked: true,
    barrels: [],
    sprayLights: [],
    oilSlick: null,
    oilOnFire: false,
    fireLights: [],
    helipad: null,
    flareGun: null,
    flareGunPickedUp: false,
    flareSignalled: false,
    // State trackers
    bombsDefused: 0,
    workersRescued: 0,
    terroristsKilled: 0,
    leaderAlive: true,
    leaderHP: LEADER_HP,
    leaderDead: false,
    deadManTriggered: false,
    // Timer
    missionTimer: MISSION_TIME,
    // Interaction
    defusingBomb: null,
    defuseTimer: 0,
    freingWorker: null,
    freeTimer: 0,
    // Floors / ladder
    currentFloor: 0, // 0=deck, 1=modules, 2=derrick top
    onLadder: false,
    ladderPos: null,
    // Bomb 4 locked until 3 defused
    // RPG projectiles from leader
    rpgProjectiles: [],
    // HUD
    hudEl: null,
    // activation
    _onKeyDown: null,
    _onKeyUp: null,
    _activationKeys: {}
  };

  // -----------------------------------------------------------------------
  // Init / Reset / Destroy
  // -----------------------------------------------------------------------
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    if (typeof THREE === 'undefined') {
      console.warn('[OilPlatform] THREE.js not loaded');
      return;
    }
    state.active = true;
    resetState();
    setupScene();
    buildEnvironment();
    buildPlatformStructure();
    buildModules();
    buildDerrick();
    buildLadders();
    buildBombs();
    buildWorkers();
    buildTerrorists();
    buildLeader();
    buildFlareGun();
    buildHelipad();
    buildHUD();
    bindKeys();
    animate(0);
  }

  function resetState() {
    state.playerPos = { x: 0, y: DECK_Y + 1, z: 30 };
    state.playerHP = 100;
    state.gameOver = false;
    state.won = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.keysDown = {};
    state.keyTimes = {};
    state.objects = [];
    state.bombs = [];
    state.workers = [];
    state.terrorists = [];
    state.leader = null;
    state.gate = null;
    state.gateLocked = true;
    state.barrels = [];
    state.sprayLights = [];
    state.oilSlick = null;
    state.oilOnFire = false;
    state.fireLights = [];
    state.helipad = null;
    state.flareGun = null;
    state.flareGunPickedUp = false;
    state.flareSignalled = false;
    state.bombsDefused = 0;
    state.workersRescued = 0;
    state.terroristsKilled = 0;
    state.leaderAlive = true;
    state.leaderHP = LEADER_HP;
    state.leaderDead = false;
    state.deadManTriggered = false;
    state.missionTimer = MISSION_TIME;
    state.defusingBomb = null;
    state.defuseTimer = 0;
    state.freingWorker = null;
    state.freeTimer = 0;
    state.currentFloor = 0;
    state.onLadder = false;
    state.ladderPos = null;
    state.rpgProjectiles = [];
    state.hudEl = null;
    state._onKeyDown = null;
    state._onKeyUp = null;
    state._activationKeys = {};
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      if (state.renderer.domElement && state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    var endEl = document.getElementById('oil-platform-end');
    if (endEl && endEl.parentNode) endEl.parentNode.removeChild(endEl);
    unbindKeys();
    state.scene = null;
    state.camera = null;
  }

  // -----------------------------------------------------------------------
  // Scene setup
  // -----------------------------------------------------------------------
  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x112233);
    state.scene.fog = new THREE.FogExp2(0x112233, 0.008);

    state.camera = new THREE.PerspectiveCamera(72, w / h, 0.1, 800);
    state.camera.position.set(0, DECK_Y + 18, 55);
    state.camera.lookAt(0, DECK_Y, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    state.scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xCCDDEE, 1.0);
    sun.position.set(60, 120, 40);
    sun.castShadow = true;
    state.scene.add(sun);

    var fill = new THREE.PointLight(0x2244AA, 0.6, 300);
    fill.position.set(-40, 20, -40);
    state.scene.add(fill);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function makeMesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    if (x !== undefined) m.position.set(x, y, z);
    state.scene.add(m);
    state.objects.push(m);
    return m;
  }

  function dist3(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dy = (a.y || 0) - (b.y || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // -----------------------------------------------------------------------
  // Build: Environment
  // -----------------------------------------------------------------------
  function buildEnvironment() {
    // Ocean
    var oceanGeo = new THREE.BoxGeometry(500, 4, 500);
    var oceanMat = new THREE.MeshLambertMaterial({ color: 0x224466, transparent: true, opacity: 0.9 });
    var ocean = makeMesh(oceanGeo, oceanMat, 0, SEA_Y - 2, 0);
    ocean.userData.isOcean = true;

    // Oil slick south of platform
    var slickGeo = new THREE.BoxGeometry(60, 0.3, 30);
    var slickMat = new THREE.MeshLambertMaterial({ color: 0x111122, transparent: true, opacity: 0.85 });
    var slick = makeMesh(slickGeo, slickMat, 0, SEA_Y + 0.5, 35);
    slick.userData.isOilSlick = true;
    state.oilSlick = slick;

    // Sea spray point lights flickering
    var sprayPositions = [
      { x: -25, y: SEA_Y + 3, z: -25 },
      { x: 25, y: SEA_Y + 3, z: -25 },
      { x: -25, y: SEA_Y + 3, z: 25 },
      { x: 25, y: SEA_Y + 3, z: 25 }
    ];
    for (var s = 0; s < sprayPositions.length; s++) {
      var sp = sprayPositions[s];
      var spLight = new THREE.PointLight(0x88AABB, 0.6, 40);
      spLight.position.set(sp.x, sp.y, sp.z);
      state.scene.add(spLight);
      state.sprayLights.push(spLight);
    }

    // Boat approach from south - a simple boat mesh
    var boatGeo = new THREE.BoxGeometry(6, 2, 14);
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    makeMesh(boatGeo, boatMat, 0, SEA_Y + 1, 55);
  }

  // -----------------------------------------------------------------------
  // Build: Platform structure
  // -----------------------------------------------------------------------
  function buildPlatformStructure() {
    // 4 pillar legs
    var legMat = new THREE.MeshLambertMaterial({ color: 0x446655 });
    var legPositions = [
      [-20, -20],
      [20, -20],
      [-20, 20],
      [20, 20]
    ];
    for (var i = 0; i < legPositions.length; i++) {
      var lp = legPositions[i];
      var legGeo = new THREE.CylinderGeometry(3, 3, 20, 10);
      var leg = makeMesh(legGeo, legMat, lp[0], SEA_Y + 10, lp[1]);
      leg.userData.isLeg = true;
    }

    // Cross bracing between legs
    var braceMat = new THREE.MeshLambertMaterial({ color: 0x3a5544 });
    var braceGeo = new THREE.BoxGeometry(44, 1, 1);
    makeMesh(braceGeo, braceMat, 0, SEA_Y + 5, -20);
    var braceGeo2 = new THREE.BoxGeometry(44, 1, 1);
    makeMesh(braceGeo2, braceMat, 0, SEA_Y + 5, 20);
    var braceGeo3 = new THREE.BoxGeometry(1, 1, 44);
    makeMesh(braceGeo3, braceMat, -20, SEA_Y + 5, 0);
    var braceGeo4 = new THREE.BoxGeometry(1, 1, 44);
    makeMesh(braceGeo4, braceMat, 20, SEA_Y + 5, 0);

    // Main deck
    var deckGeo = new THREE.BoxGeometry(50, 1, 40);
    var deckMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var deck = makeMesh(deckGeo, deckMat, 0, DECK_Y, 0);
    deck.userData.isDeck = true;

    // Guardrails
    var railMat = new THREE.MeshLambertMaterial({ color: 0x667766 });
    // North
    makeMesh(new THREE.BoxGeometry(50, 1.5, 0.3), railMat, 0, DECK_Y + 1.25, -20);
    // South
    makeMesh(new THREE.BoxGeometry(50, 1.5, 0.3), railMat, 0, DECK_Y + 1.25, 20);
    // West
    makeMesh(new THREE.BoxGeometry(0.3, 1.5, 40), railMat, -25, DECK_Y + 1.25, 0);
    // East
    makeMesh(new THREE.BoxGeometry(0.3, 1.5, 40), railMat, 25, DECK_Y + 1.25, 0);
  }

  // -----------------------------------------------------------------------
  // Build: Modules A, B, C, D
  // -----------------------------------------------------------------------
  function buildModules() {
    var dY = DECK_Y;

    // Module A - accommodation (NW) - 3 workers, 4 terrorists
    var matA = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var modA = makeMesh(new THREE.BoxGeometry(20, 5, 15), matA, -15, dY + 3.5, -8);
    modA.userData.module = 'A';

    // Module B - control room (NE) - glass panels, 3 terrorists + bomb1
    var matB = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var modB = makeMesh(new THREE.BoxGeometry(15, 5, 12), matB, 15, dY + 3.5, -8);
    modB.userData.module = 'B';
    // Glass control panels (emissive teal)
    var glassMat = new THREE.MeshLambertMaterial({ color: 0x44AACC, emissive: 0x004466, transparent: true, opacity: 0.7 });
    makeMesh(new THREE.BoxGeometry(6, 2, 0.2), glassMat, 15, dY + 3, -13.5);
    makeMesh(new THREE.BoxGeometry(0.2, 2, 5), glassMat, 7.5, dY + 3, -8);

    // Module C - machinery (SE) - pipes, pumps, bomb2 (locked gate)
    var matC = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var modC = makeMesh(new THREE.BoxGeometry(20, 6, 18), matC, 12, dY + 4, 10);
    modC.userData.module = 'C';
    // Pipe cylinders
    var pipeMat = new THREE.MeshLambertMaterial({ color: 0x667755 });
    makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), pipeMat, 8, dY + 2, 10);
    makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 8), pipeMat, 10, dY + 2, 14);
    makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 8), pipeMat, 16, dY + 1, 8);
    // Pump boxes
    makeMesh(new THREE.BoxGeometry(2, 2, 2), pipeMat, 14, dY + 2, 12);
    makeMesh(new THREE.BoxGeometry(2, 2, 2), pipeMat, 18, dY + 2, 10);
    // Gate - locked - shoot lock to open
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var gate = makeMesh(new THREE.BoxGeometry(0.3, 4, 3), gateMat, 2, dY + 2.5, 8);
    gate.userData.isGate = true;
    gate.userData.locked = true;
    state.gate = gate;
    // Gate lock handle
    var lockMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    var lockHandle = makeMesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), lockMat, 2.2, dY + 2.5, 8);
    lockHandle.userData.isLockHandle = true;
    lockHandle.userData.gate = gate;

    // Module D - storage (SW) - explosive barrels, bomb3
    var matD = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var modD = makeMesh(new THREE.BoxGeometry(15, 5, 12), matD, -15, dY + 3.5, 10);
    modD.userData.module = 'D';
    // Explosive barrels
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0xAA3311 });
    var barrelPositions = [
      { x: -20, z: 7 }, { x: -18, z: 11 }, { x: -14, z: 9 }, { x: -22, z: 12 }
    ];
    for (var bi = 0; bi < barrelPositions.length; bi++) {
      var bp = barrelPositions[bi];
      var barrel = makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8), barrelMat, bp.x, dY + 1.4, bp.z);
      barrel.userData.isBarrel = true;
      barrel.userData.exploded = false;
      state.barrels.push(barrel);
    }
  }

  // -----------------------------------------------------------------------
  // Build: Derrick tower + top platform
  // -----------------------------------------------------------------------
  function buildDerrick() {
    var dY = DECK_Y;

    // Derrick mast
    var mast = makeMesh(
      new THREE.CylinderGeometry(2, 2, 30, 10),
      new THREE.MeshLambertMaterial({ color: 0x445533 }),
      0, dY + 15, -18
    );
    mast.userData.isDerrick = true;

    // Derrick cross struts
    var strutMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var strutHeights = [dY + 6, dY + 12, dY + 18, dY + 24];
    for (var sh = 0; sh < strutHeights.length; sh++) {
      makeMesh(new THREE.BoxGeometry(8, 0.6, 0.6), strutMat, 0, strutHeights[sh], -18);
      makeMesh(new THREE.BoxGeometry(0.6, 0.6, 8), strutMat, 0, strutHeights[sh], -18);
    }

    // Derrick top platform
    var topPlat = makeMesh(
      new THREE.BoxGeometry(10, 2, 10),
      new THREE.MeshLambertMaterial({ color: 0x445544 }),
      0, dY + 31, -18
    );
    topPlat.userData.isDerrickTop = true;

    // Helipad H-lines on top (LineSegments)
    var helipPts = new THREE.BufferGeometry();
    var hPositions = new Float32Array([
      -3, 0, 0,  3, 0, 0,
      0, 0, -3,  0, 0, 3,
      -4, 0, -4, 4, 0, -4,
      -4, 0, 4,  4, 0, 4,
      -4, 0, -4, -4, 0, 4,
      4, 0, -4,  4, 0, 4
    ]);
    helipPts.setAttribute('position', new THREE.BufferAttribute(hPositions, 3));
    var heliLines = new THREE.LineSegments(
      helipPts,
      new THREE.LineBasicMaterial({ color: 0xFFFF00 })
    );
    heliLines.position.set(0, dY + 32.1, -18);
    state.scene.add(heliLines);
    state.objects.push(heliLines);
    state.helipad = heliLines;
  }

  // -----------------------------------------------------------------------
  // Build: Ladders (two: deck->modules, modules->derrick top)
  // -----------------------------------------------------------------------
  function buildLadders() {
    var dY = DECK_Y;
    var ladderMat = new THREE.MeshLambertMaterial({ color: 0x778899 });

    // Ladder 1: Ground approach boarding ladder (south face of platform)
    for (var r1 = 0; r1 < 8; r1++) {
      var rungGeo1 = new THREE.BoxGeometry(1.4, 0.25, 0.25);
      makeMesh(rungGeo1, ladderMat, 0, SEA_Y + 2 + r1 * 2.5, 20.3);
    }
    var sideA1 = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 20, 6), ladderMat, -0.8, SEA_Y + 10, 20.3);
    sideA1.userData.isLadder = true;
    sideA1.userData.ladderFloors = [0, 1];
    sideA1.userData.topY = dY + 1;
    var sideB1 = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 20, 6), ladderMat, 0.8, SEA_Y + 10, 20.3);
    sideB1.userData.isLadder = true;
    sideB1.userData.ladderFloors = [0, 1];
    sideB1.userData.topY = dY + 1;

    // Ladder 2: Deck to derrick top
    for (var r2 = 0; r2 < 12; r2++) {
      var rungGeo2 = new THREE.BoxGeometry(1.4, 0.25, 0.25);
      makeMesh(rungGeo2, ladderMat, -0.3, dY + 1.5 + r2 * 2.5, -16.5);
    }
    var sideA2 = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 30, 6), ladderMat, -0.8, dY + 16, -16.5);
    sideA2.userData.isLadder = true;
    sideA2.userData.ladderFloors = [1, 2];
    sideA2.userData.topY = dY + 32;
    var sideB2 = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 30, 6), ladderMat, 0.2, dY + 16, -16.5);
    sideB2.userData.isLadder = true;
    sideB2.userData.ladderFloors = [1, 2];
    sideB2.userData.topY = dY + 32;
  }

  // -----------------------------------------------------------------------
  // Build: Bombs (4)
  // -----------------------------------------------------------------------
  function buildBombs() {
    var dY = DECK_Y;
    var bombData = [
      // Bomb 1: Control room (guarded)
      { id: 1, x: 15, y: dY + 1.6, z: -12, module: 'B', label: 'CTL-RM' },
      // Bomb 2: Machinery (behind locked gate)
      { id: 2, x: 12, y: dY + 1.6, z: 12, module: 'C', label: 'MACH' },
      // Bomb 3: Storage room rigged to barrel
      { id: 3, x: -16, y: dY + 1.6, z: 12, module: 'D', label: 'STORE' },
      // Bomb 4: Derrick top - locked until 3 others defused
      { id: 4, x: 0, y: dY + 32.5, z: -18, module: 'DERRICK', label: 'DERRICK' }
    ];

    for (var i = 0; i < bombData.length; i++) {
      var bd = bombData[i];
      var bombGeo = new THREE.BoxGeometry(0.9, 0.5, 0.6);
      var bombMat = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0x880000 });
      var bomb = new THREE.Mesh(bombGeo, bombMat);
      bomb.position.set(bd.x, bd.y, bd.z);
      bomb.userData.isBomb = true;
      bomb.userData.bombId = bd.id;
      bomb.userData.module = bd.module;
      bomb.userData.label = bd.label;
      bomb.userData.defused = false;
      bomb.userData.locked = (bd.id === 4); // derrick bomb locked initially

      var bLight = new THREE.PointLight(0xFF2200, 1.5, 8);
      bLight.position.set(bd.x, bd.y + 1, bd.z);
      state.scene.add(bLight);
      bomb.userData.light = bLight;

      state.scene.add(bomb);
      state.objects.push(bomb);
      state.bombs.push(bomb);
    }
  }

  // -----------------------------------------------------------------------
  // Build: Workers (8 total)
  // -----------------------------------------------------------------------
  function buildWorkers() {
    var dY = DECK_Y;
    var workerPositions = [
      // Module A: 3 workers
      { x: -18, y: dY + 1, z: -10 },
      { x: -14, y: dY + 1, z: -7 },
      { x: -16, y: dY + 1, z: -5 },
      // Module B: 2 workers (control room area)
      { x: 14, y: dY + 1, z: -11 },
      { x: 17, y: dY + 1, z: -5 },
      // Module C: 2 workers (machinery)
      { x: 14, y: dY + 1, z: 8 },
      { x: 18, y: dY + 1, z: 13 },
      // Module D: 1 worker
      { x: -17, y: dY + 1, z: 8 }
    ];

    var workerMat = new THREE.MeshLambertMaterial({ color: 0x886655 });
    for (var i = 0; i < workerPositions.length; i++) {
      var wp = workerPositions[i];
      var wGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
      var worker = new THREE.Mesh(wGeo, workerMat.clone());
      worker.position.set(wp.x, wp.y, wp.z);
      worker.userData.isWorker = true;
      worker.userData.rescued = false;
      worker.userData.freeing = false;
      worker.userData.startX = wp.x;
      worker.userData.startZ = wp.z;
      state.scene.add(worker);
      state.objects.push(worker);
      state.workers.push(worker);
    }
  }

  // -----------------------------------------------------------------------
  // Build: Terrorists (total ~10 across modules + leader)
  // -----------------------------------------------------------------------
  function buildTerrorists() {
    var dY = DECK_Y;
    var terrorPositions = [
      // Module A: 4
      { x: -12, y: dY + 1, z: -8, patrol: true },
      { x: -17, y: dY + 1, z: -9, patrol: true },
      { x: -13, y: dY + 1, z: -4, patrol: true },
      { x: -19, y: dY + 1, z: -5, patrol: false },
      // Module B: 3 (guarding bomb1)
      { x: 13, y: dY + 1, z: -9, patrol: false },
      { x: 17, y: dY + 1, z: -11, patrol: true },
      { x: 15, y: dY + 1, z: -6, patrol: true },
      // Deck patrol: 2
      { x: 3, y: dY + 1, z: 5, patrol: true },
      { x: -3, y: dY + 1, z: -2, patrol: true },
      // Module C entrance guard
      { x: 5, y: dY + 1, z: 9, patrol: false }
    ];

    var tMat = new THREE.MeshLambertMaterial({ color: 0x223311 });
    for (var i = 0; i < terrorPositions.length; i++) {
      var tp = terrorPositions[i];
      var tGeo = new THREE.BoxGeometry(0.9, 1.9, 0.9);
      var terror = new THREE.Mesh(tGeo, tMat.clone());
      terror.position.set(tp.x, tp.y, tp.z);
      terror.userData.isTerrorist = true;
      terror.userData.alive = true;
      terror.userData.patrol = tp.patrol;
      terror.userData.patrolDir = (Math.random() > 0.5) ? 1 : -1;
      terror.userData.patrolTimer = Math.random() * 3;
      terror.userData.startX = tp.x;
      terror.userData.startZ = tp.z;
      terror.userData.fireTimer = Math.random() * ENEMY_FIRE_RATE;
      terror.userData.alerted = false;
      state.scene.add(terror);
      state.objects.push(terror);
      state.terrorists.push(terror);
    }
  }

  // -----------------------------------------------------------------------
  // Build: Cell leader on derrick top
  // -----------------------------------------------------------------------
  function buildLeader() {
    var dY = DECK_Y;
    var leaderGeo = new THREE.BoxGeometry(1.1, 2, 1.1);
    var leaderMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
    var leader = new THREE.Mesh(leaderGeo, leaderMat);
    leader.position.set(2, dY + 33, -18);
    leader.userData.isLeader = true;
    leader.userData.alive = true;
    leader.userData.hp = LEADER_HP;
    leader.userData.fireTimer = 0;

    // RPG warhead visual on leader
    var rpgGeo = new THREE.ConeGeometry(0.25, 1.2, 8);
    var rpgMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var rpg = new THREE.Mesh(rpgGeo, rpgMat);
    rpg.rotation.z = -Math.PI / 2;
    rpg.position.set(0.9, 0, 0);
    leader.add(rpg);

    state.scene.add(leader);
    state.objects.push(leader);
    state.leader = leader;
  }

  // -----------------------------------------------------------------------
  // Build: Flare gun in control room
  // -----------------------------------------------------------------------
  function buildFlareGun() {
    var dY = DECK_Y;
    var fgGeo = new THREE.BoxGeometry(0.4, 0.2, 0.8);
    var fgMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0x331100 });
    var fg = makeMesh(fgGeo, fgMat, 15, dY + 1.3, -9);
    fg.userData.isFlareGun = true;
    state.flareGun = fg;
  }

  // -----------------------------------------------------------------------
  // Build: Helipad area marker (top of derrick, already has LineSegments)
  // -----------------------------------------------------------------------
  function buildHelipad() {
    // Helipad light ring
    var dY = DECK_Y;
    var padLight = new THREE.PointLight(0xFFFF44, 0.8, 15);
    padLight.position.set(0, dY + 33.5, -18);
    state.scene.add(padLight);
  }

  // -----------------------------------------------------------------------
  // Build: HUD
  // -----------------------------------------------------------------------
  function buildHUD() {
    var hud = document.createElement('div');
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,10,20,0.88)',
      'color:#00FFAA',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 14px',
      'border:1px solid #006644',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    hud.id = 'oil-platform-hud';
    document.body.appendChild(hud);
    state.hudEl = hud;
    updateHUD();
  }

  function formatTimer(secs) {
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var alive = 0;
    for (var i = 0; i < state.terrorists.length; i++) {
      if (state.terrorists[i].userData.alive) alive++;
    }
    var leaderStatus = state.leaderDead ? 'ELIMINATED' : 'ACTIVE';
    var timerStr = formatTimer(state.missionTimer);
    var hp = Math.max(0, Math.ceil(state.playerHP));
    state.hudEl.textContent =
      'OIL PLATFORM  ' +
      '[BOMBS: ' + state.bombsDefused + '/4 DEFUSED]  ' +
      '[WORKERS: ' + state.workersRescued + '/8 RESCUED]  ' +
      '[CELL LEADER: ' + leaderStatus + ']  ' +
      '[TIMER: ' + timerStr + ']  ' +
      '[TERRORISTS: ' + alive + ']  ' +
      '[HP: ' + hp + ']';
  }

  // -----------------------------------------------------------------------
  // Key bindings
  // -----------------------------------------------------------------------
  function bindKeys() {
    state._onKeyDown = function (e) {
      if (!state.active) return;
      state.keysDown[e.keyCode] = true;
      state.keyTimes[e.keyCode] = Date.now();
      handleKeyPress(e.keyCode);
    };
    state._onKeyUp = function (e) {
      if (!state.active) return;
      state.keysDown[e.keyCode] = false;
      // Cancel hold actions when key released
      if (e.keyCode === 69) { // E
        state.defusingBomb = null;
        state.defuseTimer = 0;
        state.freingWorker = null;
        state.freeTimer = 0;
      }
    };
    window.addEventListener('keydown', state._onKeyDown);
    window.addEventListener('keyup', state._onKeyUp);
  }

  function unbindKeys() {
    if (state._onKeyDown) window.removeEventListener('keydown', state._onKeyDown);
    if (state._onKeyUp) window.removeEventListener('keyup', state._onKeyUp);
    state._onKeyDown = null;
    state._onKeyUp = null;
  }

  function handleKeyPress(keyCode) {
    if (keyCode === 70) { // F - fire/shoot
      handleShoot();
    }
    if (keyCode === 82) { // R - signal flare
      handleFlareSignal();
    }
    if (keyCode === 69) { // E - start interact (hold handled in update)
      handleInteractStart();
    }
    if (keyCode === 76) { // L - climb ladder
      handleLadder();
    }
  }

  // -----------------------------------------------------------------------
  // Shoot mechanic
  // -----------------------------------------------------------------------
  function handleShoot() {
    var pp = state.playerPos;
    var closest = null;
    var closestDist = 999;

    // Check terrorists
    for (var i = 0; i < state.terrorists.length; i++) {
      var t = state.terrorists[i];
      if (!t.userData.alive) continue;
      var d = dist3(pp, t.position);
      if (d < ENEMY_FIRE_RANGE + 5 && d < closestDist) {
        closestDist = d;
        closest = t;
      }
    }

    // Check leader
    if (state.leader && state.leader.userData.alive) {
      var ld = dist3(pp, state.leader.position);
      if (ld < LEADER_SIGHT) {
        if (ld < closestDist) {
          closestDist = ld;
          closest = state.leader;
        }
      }
    }

    // Check gate lock
    if (state.gate && state.gate.userData.locked) {
      var gd = dist3(pp, state.gate.position);
      if (gd < 8) {
        shootGateLock();
        return;
      }
    }

    if (closest) {
      if (closest.userData.isLeader) {
        shootLeader(25);
      } else {
        killTerrorist(closest);
      }
      // Flash hit
      var flash = new THREE.PointLight(0xFFFF88, 4, 12);
      flash.position.copy(closest.position);
      state.scene.add(flash);
      (function (fl) {
        setTimeout(function () { if (state.scene) state.scene.remove(fl); }, 150);
      }(flash));
    }
  }

  function shootGateLock() {
    if (!state.gate || !state.gate.userData.locked) return;
    state.gate.userData.locked = false;
    state.gateLocked = false;
    state.gate.material.color.setHex(0x334422);
    // Remove lock handle
    for (var i = 0; i < state.objects.length; i++) {
      if (state.objects[i].userData.isLockHandle) {
        state.scene.remove(state.objects[i]);
        state.objects.splice(i, 1);
        break;
      }
    }
    var fl = new THREE.PointLight(0xFFAA00, 5, 10);
    fl.position.copy(state.gate.position);
    state.scene.add(fl);
    setTimeout(function () { if (state.scene) state.scene.remove(fl); }, 200);
  }

  function shootLeader(dmg) {
    if (!state.leader || state.leaderDead) return;
    state.leaderHP -= dmg;
    state.leader.userData.hp = state.leaderHP;
    if (state.leaderHP <= 0) {
      killLeader();
    }
  }

  function killLeader() {
    if (state.leaderDead) return;
    state.leaderDead = true;
    state.leader.userData.alive = false;
    state.leaderAlive = false;
    state.leader.material.color.setHex(0x110800);
    state.leader.position.y -= 1;
    // Dead man's switch check
    if (state.bombsDefused < 3) {
      triggerDeadManSwitch();
    }
    updateHUD();
  }

  function triggerDeadManSwitch() {
    if (state.deadManTriggered) return;
    state.deadManTriggered = true;
    // Detonate all remaining bombs instantly
    for (var i = 0; i < state.bombs.length; i++) {
      var b = state.bombs[i];
      if (!b.userData.defused) {
        detonateBomb(b);
      }
    }
    showMessage('DEAD-MAN SWITCH! ALL BOMBS DETONATED!', 0xFF0000);
    setTimeout(function () {
      triggerGameOver('Dead-man switch triggered — platform destroyed!');
    }, 2000);
  }

  function killTerrorist(t) {
    if (!t.userData.alive) return;
    t.userData.alive = false;
    t.material.color.setHex(0x111100);
    t.position.y -= 0.9;
    state.terroristsKilled++;
    updateHUD();
  }

  // -----------------------------------------------------------------------
  // Interact start (E key pressed)
  // -----------------------------------------------------------------------
  function handleInteractStart() {
    var pp = state.playerPos;

    // Check flare gun pickup
    if (!state.flareGunPickedUp && state.flareGun) {
      var fgd = dist3(pp, state.flareGun.position);
      if (fgd < 5) {
        state.flareGunPickedUp = true;
        state.scene.remove(state.flareGun);
        showMessage('FLARE GUN ACQUIRED', 0xFFAA00);
        return;
      }
    }

    // Check bomb proximity
    for (var bi = 0; bi < state.bombs.length; bi++) {
      var bomb = state.bombs[bi];
      if (bomb.userData.defused) continue;
      if (bomb.userData.locked) continue; // bomb 4 locked
      var bd = dist3(pp, bomb.position);
      if (bd < 5) {
        // Bomb 3 - must not shoot nearby barrel first; defuse safe
        state.defusingBomb = bomb;
        state.defuseTimer = 0;
        return;
      }
    }

    // Check worker proximity
    for (var wi = 0; wi < state.workers.length; wi++) {
      var w = state.workers[wi];
      if (w.userData.rescued) continue;
      var wd = dist3(pp, w.position);
      if (wd < 4) {
        state.freingWorker = w;
        state.freeTimer = 0;
        return;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Flare signal
  // -----------------------------------------------------------------------
  function handleFlareSignal() {
    if (!state.flareGunPickedUp) return;
    if (state.flareSignalled) return;
    state.flareSignalled = true;
    // Bright red light burst upward
    var flareLight = new THREE.PointLight(0xFF4400, 8, 60);
    flareLight.position.set(state.playerPos.x, state.playerPos.y + 30, state.playerPos.z);
    state.scene.add(flareLight);
    setTimeout(function () { if (state.scene) state.scene.remove(flareLight); }, 3000);
    showMessage('FLARE FIRED — EXTRACTION SIGNALLED', 0xFF6600);
  }

  // -----------------------------------------------------------------------
  // Ladder
  // -----------------------------------------------------------------------
  function handleLadder() {
    var pp = state.playerPos;
    // Boarding ladder (south, z~20)
    var boardingDist = dist2({ x: 0, z: 20.3 }, pp);
    if (boardingDist < 5) {
      if (state.currentFloor === 0) {
        state.currentFloor = 1;
        state.playerPos.y = DECK_Y + 1;
        state.playerPos.z = 18;
        showMessage('BOARDED DECK', 0x00FFAA);
        return;
      }
    }
    // Derrick ladder (north, z~-16.5)
    var derrickDist = dist2({ x: 0, z: -16.5 }, pp);
    if (derrickDist < 5) {
      if (state.currentFloor === 1) {
        state.currentFloor = 2;
        state.playerPos.y = DECK_Y + 32;
        state.playerPos.z = -18;
        state.playerPos.x = 0;
        showMessage('CLIMBED TO DERRICK TOP', 0x00FFAA);
        return;
      }
      if (state.currentFloor === 2) {
        state.currentFloor = 1;
        state.playerPos.y = DECK_Y + 1;
        state.playerPos.z = -14;
        state.playerPos.x = 0;
        showMessage('DESCENDED TO DECK', 0x00FFAA);
        return;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Detonation helpers
  // -----------------------------------------------------------------------
  function detonateBomb(bomb) {
    if (!bomb) return;
    var fl = new THREE.PointLight(0xFF4400, 10, 30);
    fl.position.copy(bomb.position);
    state.scene.add(fl);
    setTimeout(function () { if (state.scene) state.scene.remove(fl); }, 600);

    if (bomb.userData.module === 'D') {
      // Chain barrel explosions
      for (var bi = 0; bi < state.barrels.length; bi++) {
        chainBarrel(state.barrels[bi], bomb.position);
      }
    }

    // Workers in module take fire damage
    for (var wi = 0; wi < state.workers.length; wi++) {
      var w = state.workers[wi];
      if (!w.userData.rescued && dist3(w.position, bomb.position) < 10) {
        w.userData.onFire = true;
      }
    }

    // Ignite oil slick if bomb near south
    if (bomb.position.z > 0 && state.oilSlick) {
      igniteOilSlick();
    }
  }

  function chainBarrel(barrel, origin) {
    if (barrel.userData.exploded) return;
    if (dist3(barrel.position, origin) > 8) return;
    barrel.userData.exploded = true;
    barrel.material.color.setHex(0xFF6600);
    var bfl = new THREE.PointLight(0xFF6600, 6, 18);
    bfl.position.copy(barrel.position);
    state.scene.add(bfl);
    setTimeout(function () { if (state.scene) state.scene.remove(bfl); }, 500);
    // Chain to neighbors
    var refPos = barrel.position;
    (function (rp) {
      setTimeout(function () {
        if (!state.active) return;
        for (var bi = 0; bi < state.barrels.length; bi++) {
          chainBarrel(state.barrels[bi], rp);
        }
      }, 350);
    }(refPos.clone()));
  }

  function igniteOilSlick() {
    if (state.oilOnFire) return;
    state.oilOnFire = true;
    if (state.oilSlick) {
      state.oilSlick.material.color.setHex(0xFF3300);
    }
    var fireLight = new THREE.PointLight(0xFF3300, 4, 50);
    fireLight.position.set(0, SEA_Y + 3, 35);
    state.scene.add(fireLight);
    state.fireLights.push(fireLight);
    showMessage('OIL SLICK IGNITED!', 0xFF3300);
  }

  // -----------------------------------------------------------------------
  // Update functions
  // -----------------------------------------------------------------------
  function updateMissionTimer(dt) {
    if (state.gameOver) return;
    state.missionTimer -= dt;
    if (state.missionTimer <= 0) {
      state.missionTimer = 0;
      triggerGameOver('Platform detonated — 10-minute timer expired!');
    }
  }

  function updatePlayerMovement(dt) {
    var speed = PLAYER_SPEED;
    if (state.keysDown[87]) state.playerPos.z -= speed * dt; // W
    if (state.keysDown[83]) state.playerPos.z += speed * dt; // S
    if (state.keysDown[65]) state.playerPos.x -= speed * dt; // A
    if (state.keysDown[68]) state.playerPos.x += speed * dt; // D

    // Clamp position to floor bounds
    if (state.currentFloor === 0) {
      // In water / boat approach
      state.playerPos.y = SEA_Y + 2;
    } else if (state.currentFloor === 1) {
      state.playerPos.y = DECK_Y + 1;
      state.playerPos.x = clamp(state.playerPos.x, -24, 24);
      state.playerPos.z = clamp(state.playerPos.z, -19, 19);
    } else if (state.currentFloor === 2) {
      state.playerPos.y = DECK_Y + 32;
      state.playerPos.x = clamp(state.playerPos.x, -4, 4);
      state.playerPos.z = clamp(state.playerPos.z, -22, -14);
    }
  }

  function updateCamera() {
    var px = state.playerPos.x;
    var py = state.playerPos.y;
    var pz = state.playerPos.z;
    state.camera.position.x = px;
    state.camera.position.y = py + 14;
    state.camera.position.z = pz + 28;
    state.camera.lookAt(px, py, pz);
  }

  function updateDefuse(dt) {
    if (!state.defusingBomb) return;
    if (!state.keysDown[69]) {
      state.defusingBomb = null;
      state.defuseTimer = 0;
      return;
    }
    state.defuseTimer += dt;
    if (state.defuseTimer >= DEFUSE_TIME) {
      defuseBomb(state.defusingBomb);
      state.defusingBomb = null;
      state.defuseTimer = 0;
    }
  }

  function defuseBomb(bomb) {
    if (bomb.userData.defused) return;
    bomb.userData.defused = true;
    state.bombsDefused++;
    bomb.material.color.setHex(0x004400);
    bomb.material.emissive.setHex(0x002200);
    if (bomb.userData.light) {
      bomb.userData.light.intensity = 0;
    }
    showMessage('BOMB ' + bomb.userData.bombId + ' (' + bomb.userData.label + ') DEFUSED!', 0x00FF88);

    // Unlock bomb 4 when 3 defused
    if (state.bombsDefused >= 3) {
      for (var bi = 0; bi < state.bombs.length; bi++) {
        if (state.bombs[bi].userData.bombId === 4) {
          state.bombs[bi].userData.locked = false;
          showMessage('DERRICK BOMB NOW ACCESSIBLE!', 0xFFAA00);
        }
      }
    }
    updateHUD();
  }

  function updateFreeWorker(dt) {
    if (!state.freingWorker) return;
    if (!state.keysDown[69]) {
      state.freingWorker = null;
      state.freeTimer = 0;
      return;
    }
    state.freeTimer += dt;
    if (state.freeTimer >= FREE_WORKER_TIME) {
      freeWorker(state.freingWorker);
      state.freingWorker = null;
      state.freeTimer = 0;
    }
  }

  function freeWorker(w) {
    if (w.userData.rescued) return;
    w.userData.rescued = true;
    w.userData.onFire = false;
    state.workersRescued++;
    w.material.color.setHex(0x44CC66);
    // Move to muster point
    w.position.set(MUSTER_X, DECK_Y + 1, MUSTER_Z);
    showMessage('WORKER RESCUED! (' + state.workersRescued + '/8)', 0x44FF88);
    updateHUD();
  }

  function updateWorkerFire(dt) {
    for (var i = 0; i < state.workers.length; i++) {
      var w = state.workers[i];
      if (w.userData.onFire && !w.userData.rescued) {
        w.userData.fireDmgAcc = (w.userData.fireDmgAcc || 0) + dt;
        if (w.userData.fireDmgAcc >= 1) {
          w.userData.fireDmgAcc -= 1;
          // Worker loses HP (tracked implicitly – worker "dies" after enough damage)
          w.userData.fireHits = (w.userData.fireHits || 0) + 1;
          if (w.userData.fireHits >= 10) {
            w.userData.rescued = true; // removed as casualty
            w.material.color.setHex(0x220000);
            showMessage('WORKER LOST TO FIRE', 0xFF0000);
          }
        }
      }
    }
  }

  function updateTerrorists(dt) {
    var pp = state.playerPos;
    for (var i = 0; i < state.terrorists.length; i++) {
      var t = state.terrorists[i];
      if (!t.userData.alive) continue;

      // Patrol movement
      if (t.userData.patrol) {
        t.userData.patrolTimer += dt;
        if (t.userData.patrolTimer > 3.5) {
          t.userData.patrolDir *= -1;
          t.userData.patrolTimer = 0;
        }
        t.position.x += t.userData.patrolDir * 1.5 * dt;
      }

      // Sight & fire
      var dist = dist3(pp, t.position);
      if (dist < ENEMY_SIGHT) {
        t.userData.alerted = true;
        t.userData.fireTimer += dt;
        if (t.userData.fireTimer >= ENEMY_FIRE_RATE) {
          t.userData.fireTimer = 0;
          if (dist < ENEMY_FIRE_RANGE) {
            state.playerHP -= 12 + Math.random() * 8;
            if (state.playerHP <= 0) {
              state.playerHP = 0;
              triggerGameOver('Eliminated by eco-terrorists!');
            }
            updateHUD();
          }
        }
        if (!t.userData.wasAlerted) {
          t.userData.wasAlerted = true;
          t.material.color.setHex(0xFF2200);
        }
      } else {
        t.userData.alerted = false;
        if (t.userData.wasAlerted) {
          t.userData.wasAlerted = false;
          t.material.color.setHex(0x223311);
        }
      }
    }
  }

  function updateLeader(dt) {
    if (!state.leader || state.leaderDead) return;
    var pp = state.playerPos;
    var dist = dist3(pp, state.leader.position);
    if (dist < LEADER_SIGHT) {
      state.leader.userData.fireTimer += dt;
      if (state.leader.userData.fireTimer >= LEADER_FIRE_RATE) {
        state.leader.userData.fireTimer = 0;
        fireRPG();
      }
    }
    // Rotate leader to face player
    var dx = pp.x - state.leader.position.x;
    var dz = pp.z - state.leader.position.z;
    state.leader.rotation.y = Math.atan2(dx, dz);
  }

  function fireRPG() {
    var dY = DECK_Y;
    var pp = state.playerPos;
    var lp = state.leader.position;
    var rpgGeo = new THREE.ConeGeometry(0.2, 0.9, 8);
    var rpgMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var rpgMesh = new THREE.Mesh(rpgGeo, rpgMat);
    rpgMesh.position.copy(lp);
    rpgMesh.position.y += 0.5;

    var dx = pp.x - lp.x;
    var dy = pp.y - lp.y;
    var dz = pp.z - lp.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len === 0) return;
    rpgMesh.userData.vx = (dx / len) * RPG_SPEED;
    rpgMesh.userData.vy = (dy / len) * RPG_SPEED;
    rpgMesh.userData.vz = (dz / len) * RPG_SPEED;
    rpgMesh.userData.isRPG = true;
    rpgMesh.userData.life = 3;

    state.scene.add(rpgMesh);
    state.rpgProjectiles.push(rpgMesh);

    var rpgLight = new THREE.PointLight(0xFF8800, 2, 10);
    rpgLight.position.copy(lp);
    state.scene.add(rpgLight);
    rpgMesh.userData.light = rpgLight;
  }

  function updateRPGProjectiles(dt) {
    var pp = state.playerPos;
    for (var i = state.rpgProjectiles.length - 1; i >= 0; i--) {
      var rpg = state.rpgProjectiles[i];
      rpg.position.x += rpg.userData.vx * dt;
      rpg.position.y += rpg.userData.vy * dt;
      rpg.position.z += rpg.userData.vz * dt;
      rpg.userData.life -= dt;

      if (rpg.userData.light) {
        rpg.userData.light.position.copy(rpg.position);
      }

      var pd = dist3(rpg.position, pp);
      var hit = pd < 3 || rpg.userData.life <= 0;
      if (hit) {
        if (pd < 3) {
          state.playerHP -= 35 + Math.random() * 20;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerGameOver('Destroyed by RPG!');
          }
          updateHUD();
        }
        // Explosion
        var fl = new THREE.PointLight(0xFF6600, 8, 25);
        fl.position.copy(rpg.position);
        state.scene.add(fl);
        (function (flt) {
          setTimeout(function () { if (state.scene) state.scene.remove(flt); }, 400);
        }(fl));
        if (rpg.userData.light) state.scene.remove(rpg.userData.light);
        state.scene.remove(rpg);
        state.rpgProjectiles.splice(i, 1);
      }
    }
  }

  function updateBombPulse(timestamp) {
    for (var i = 0; i < state.bombs.length; i++) {
      var b = state.bombs[i];
      if (b.userData.defused) continue;
      if (!b.userData.light) continue;
      var pulse = 1.0 + Math.sin(timestamp * 0.003 * BOMB_PULSE_SPEED + i) * 0.7;
      b.userData.light.intensity = pulse * 1.8;
    }
  }

  function updateSprayLights(timestamp) {
    for (var i = 0; i < state.sprayLights.length; i++) {
      var sl = state.sprayLights[i];
      sl.intensity = 0.4 + Math.sin(timestamp * 0.0015 + i * 1.3) * 0.25;
    }
  }

  function updateFireLights(timestamp) {
    for (var i = 0; i < state.fireLights.length; i++) {
      var fl = state.fireLights[i];
      fl.intensity = 3 + Math.sin(timestamp * 0.008 + i) * 1.5;
    }
  }

  // -----------------------------------------------------------------------
  // Victory check
  // -----------------------------------------------------------------------
  function checkVictory() {
    if (state.gameOver) return;
    if (state.bombsDefused < 4) return;
    if (!state.leaderDead) return;
    if (!state.flareSignalled) return;
    // Player must be on helipad (derrick top)
    if (state.currentFloor !== 2) return;
    var helipadPos = { x: 0, y: DECK_Y + 32, z: -18 };
    if (dist3(state.playerPos, helipadPos) > 7) return;
    triggerVictory('All bombs defused, leader eliminated, extracted by helicopter!');
  }

  // -----------------------------------------------------------------------
  // Win / Lose
  // -----------------------------------------------------------------------
  function triggerVictory(msg) {
    if (state.gameOver) return;
    state.gameOver = true;
    state.won = true;
    showEndScreen('MISSION COMPLETE', msg, 0x00FF88);
  }

  function triggerGameOver(msg) {
    if (state.gameOver) return;
    state.gameOver = true;
    state.won = false;
    showEndScreen('MISSION FAILED', msg, 0xFF2200);
  }

  function showEndScreen(title, msg, color) {
    var hex = '#' + color.toString(16).padStart(6, '0');
    var el = document.createElement('div');
    el.id = 'oil-platform-end';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.92)',
      'color:' + hex,
      'font-family:monospace',
      'font-size:22px',
      'padding:30px 50px',
      'border:2px solid ' + hex,
      'border-radius:8px',
      'z-index:99999',
      'text-align:center',
      'max-width:600px'
    ].join(';');
    el.innerHTML = '<div style="font-size:28px;margin-bottom:12px">' + title + '</div>' +
      '<div style="font-size:14px;color:#AABBCC">' + msg + '</div>' +
      '<div style="font-size:11px;color:#667788;margin-top:16px">Press O+P to exit</div>';
    document.body.appendChild(el);
  }

  function showMessage(msg, color) {
    var hex = '#' + (color || 0xFFFFFF).toString(16).padStart(6, '0');
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:' + hex,
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 20px',
      'border-radius:3px',
      'z-index:99998',
      'pointer-events:none'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2800);
  }

  // -----------------------------------------------------------------------
  // Main animate loop
  // -----------------------------------------------------------------------
  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    if (dt > 0.12) dt = 0.12;
    if (dt <= 0) return;

    if (!state.gameOver) {
      updateMissionTimer(dt);
      updatePlayerMovement(dt);
      updateDefuse(dt);
      updateFreeWorker(dt);
      updateTerrorists(dt);
      updateLeader(dt);
      updateRPGProjectiles(dt);
      updateWorkerFire(dt);
      checkVictory();
    }

    updateBombPulse(timestamp);
    updateSprayLights(timestamp);
    updateFireLights(timestamp);
    updateCamera();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // -----------------------------------------------------------------------
  // Public update / reset (called by harness if needed)
  // -----------------------------------------------------------------------
  function update(dt) {
    // No-op; internal loop runs itself
  }

  function reset() {
    destroy();
    init();
  }

  // -----------------------------------------------------------------------
  // Activation: O+P simultaneous within 400ms
  // -----------------------------------------------------------------------
  var _activationKeys = {};
  var _activationHandler = function (e) {
    var now = Date.now();
    if (e.keyCode === ACTIVATION_KEY_O || e.keyCode === ACTIVATION_KEY_P) {
      _activationKeys[e.keyCode] = now;
      var other = e.keyCode === ACTIVATION_KEY_O ? ACTIVATION_KEY_P : ACTIVATION_KEY_O;
      if (_activationKeys[other] && (now - _activationKeys[other]) <= ACTIVATION_WINDOW) {
        _activationKeys = {};
        if (!state.active) {
          init();
        } else {
          destroy();
        }
      }
    }
  };
  window.addEventListener('keydown', _activationHandler);

  return {
    init: init,
    update: update,
    reset: reset,
    destroy: destroy,
    getState: function () { return state; }
  };
}());
