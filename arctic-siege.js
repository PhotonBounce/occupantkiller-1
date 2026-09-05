window.ArcticSiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'ArcticSiege';
  var ACTIVATION_KEY_A = 65;
  var ACTIVATION_KEY_S = 83;
  var ACTIVATION_WINDOW = 400;

  // Colors
  var COLOR_SNOW       = 0xEEEEFF;
  var COLOR_LAB        = 0x445566;
  var COLOR_BARRACKS   = 0x445544;
  var COLOR_GENSHED    = 0x445533;
  var COLOR_FENCE      = 0x888899;
  var COLOR_HELIPAD    = 0x446655;
  var COLOR_MERC       = 0xCCDDEE;
  var COLOR_MERC_ELITE = 0x334455;
  var COLOR_COMMANDER  = 0x334433;
  var COLOR_SNOWCAT    = 0x334455;
  var COLOR_SNOWMOBILE = 0x445566;
  var COLOR_GENERATOR  = 0x445544;
  var COLOR_GEN_LIGHT  = 0x44FF44;
  var COLOR_TENT       = 0x667755;
  var COLOR_LOCKER     = 0x556677;
  var COLOR_SKY        = 0xAABBCC;

  // Game constants
  var TOTAL_MISSION_TIME = 720; // 12 minutes in seconds
  var COLD_DMG_PER_SEC   = 3;
  var COLD_BUILD_RATE    = 1;   // temp units per second outside
  var COLD_MAX           = 100;
  var COLD_THRESHOLD     = 60;  // "cold" starts here
  var COLD_CRITICAL      = 90;
  var SUIT_TIME_BONUS    = 180; // extra seconds before cold kicks in
  var GEN_OFFLINE_LOSE   = 120; // 2 min offline = lose
  var MORTAR_INTERVAL    = 20;  // seconds between mortar hits
  var MORTAR_DMG         = 5;
  var MORTAR_KILL_WINDOW = 45;
  var PLAYER_SPEED       = 7;
  var SNIPER_RANGE       = 30;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    hudEl: null,
    animFrameId: null,
    lastTime: 0,
    keysDown: {},
    keyTimes: {},

    // Player
    playerPos: { x: 0, y: 1, z: 0 },
    playerHP: 100,
    playerDead: false,
    hasSuit: false,
    tents: 2,
    repairKits: 2,
    isRepairing: false,
    repairTimer: 0,
    isEquipping: false,

    // Mission
    missionTime: 0,
    wave: 0,
    gameOver: false,
    gameWon: false,
    rescueArrived: false,

    // Cold mechanic
    tempExposure: 0,
    insideBuilding: false,
    insideTent: false,
    coldDmgAccum: 0,

    // Buildings
    buildingA: null,
    buildingB: null,
    buildingC: null,
    buildingAIntact: true,
    buildingBIntact: true,
    buildingCIntact: true,
    buildingAHP: 500,
    buildingBHP: 500,
    buildingCHP: 500,

    // Generator
    generatorOnline: true,
    generatorHP: 200,
    generatorOfflineTimer: 0,
    generatorLight: null,
    ambientLight: null,

    // Mercenaries
    mercenaries: [],
    snowmobiles: [],
    snowcat: null,
    snowcatHP: 0,
    snowcatEngineBlown: false,

    // Commander
    commanderMesh: null,
    commanderHP: 350,
    commanderAlive: false,
    commanderKilled: false,
    commanderLight: null,
    commanderFireTimer: 0,

    // Mortar
    mortarActive: false,
    mortarTeam: null,
    mortarTeamHP: 100,
    mortarDestroyTimer: 0,
    mortarHitTimer: 0,

    // Wave tracking
    wave1Spawned: false,
    wave2Spawned: false,
    wave3Spawned: false,
    wave4Spawned: false,
    eliteAssaultSpawned: false,
    wave4Delayed: false,
    wave4DelayTimer: 0,

    // Scene objects
    objects: [],
    tentsPlaced: [],
    snowdrifts: [],
    fencePosts: [],
    helipads: [],
    helicopter: null,
    lockerMesh: null,
    suitPickedUp: false,
    serverMesh: null,
    genMesh: null,
    storageMesh: null
  };

  // ------------------------------------------------------------------
  // Activation (A + S within 400ms)
  // ------------------------------------------------------------------
  function onKeyDown(e) {
    var code = e.keyCode || e.which;
    var now = Date.now();
    state.keysDown[code] = true;
    state.keyTimes[code] = now;

    if (code === ACTIVATION_KEY_A || code === ACTIVATION_KEY_S) {
      var other = (code === ACTIVATION_KEY_A) ? ACTIVATION_KEY_S : ACTIVATION_KEY_A;
      if (state.keyTimes[other] && (now - state.keyTimes[other]) < ACTIVATION_WINDOW) {
        if (!state.active) {
          init();
        }
      }
    }

    if (!state.active || state.gameOver) return;

    // E = interact
    if (code === 69) {
      tryInteract();
    }
    // F = place tent
    if (code === 70) {
      placeTent();
    }
  }

  function onKeyUp(e) {
    var code = e.keyCode || e.which;
    state.keysDown[code] = false;
    if (code === 69) {
      state.isRepairing = false;
      state.repairTimer = 0;
      state.isEquipping = false;
    }
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not loaded');
      state.active = false;
      return;
    }

    resetState();
    setupScene();
    buildSnowfield();
    buildSnowdrifts();
    buildBuildingA();
    buildBuildingB();
    buildBuildingC();
    buildPerimeterFence();
    buildHelicopterPad();
    buildGenerator();
    buildLocker();
    buildHUD();
    animate(0);
  }

  function resetState() {
    state.playerPos        = { x: 0, y: 1, z: 0 };
    state.playerHP         = 100;
    state.playerDead       = false;
    state.hasSuit          = false;
    state.tents            = 2;
    state.repairKits       = 2;
    state.isRepairing      = false;
    state.repairTimer      = 0;
    state.isEquipping      = false;
    state.missionTime      = 0;
    state.wave             = 0;
    state.gameOver         = false;
    state.gameWon          = false;
    state.rescueArrived    = false;
    state.tempExposure     = 0;
    state.insideBuilding   = false;
    state.insideTent       = false;
    state.coldDmgAccum     = 0;
    state.buildingAIntact  = true;
    state.buildingBIntact  = true;
    state.buildingCIntact  = true;
    state.buildingAHP      = 500;
    state.buildingBHP      = 500;
    state.buildingCHP      = 300;
    state.generatorOnline  = true;
    state.generatorHP      = 200;
    state.generatorOfflineTimer = 0;
    state.mercenaries      = [];
    state.snowmobiles      = [];
    state.snowcat          = null;
    state.snowcatHP        = 0;
    state.snowcatEngineBlown = false;
    state.commanderAlive   = false;
    state.commanderKilled  = false;
    state.commanderHP      = 350;
    state.commanderFireTimer = 0;
    state.mortarActive     = false;
    state.mortarTeamHP     = 100;
    state.mortarDestroyTimer = 0;
    state.mortarHitTimer   = 0;
    state.wave1Spawned     = false;
    state.wave2Spawned     = false;
    state.wave3Spawned     = false;
    state.wave4Spawned     = false;
    state.eliteAssaultSpawned = false;
    state.wave4Delayed     = false;
    state.wave4DelayTimer  = 0;
    state.objects          = [];
    state.tentsPlaced      = [];
    state.snowdrifts       = [];
    state.fencePosts       = [];
    state.helipads         = [];
    state.suitPickedUp     = false;
  }

  // ------------------------------------------------------------------
  // Scene
  // ------------------------------------------------------------------
  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(COLOR_SKY);
    state.scene.fog = new THREE.FogExp2(0xAABBCC, 0.018);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 500);
    state.camera.position.set(0, 12, 35);
    state.camera.lookAt(0, 0, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top    = '0';
    state.renderer.domElement.style.left   = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    state.ambientLight = new THREE.AmbientLight(0xBBCCDD, 0.6);
    state.scene.add(state.ambientLight);

    var sun = new THREE.DirectionalLight(0xDDEEFF, 0.9);
    sun.position.set(30, 60, 30);
    sun.castShadow = true;
    state.scene.add(sun);
  }

  function addMesh(geo, mat, x, y, z) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  // ------------------------------------------------------------------
  // World building
  // ------------------------------------------------------------------
  function buildSnowfield() {
    var geo = new THREE.BoxGeometry(400, 1, 400);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_SNOW });
    var ground = new THREE.Mesh(geo, mat);
    ground.position.set(0, -0.5, 0);
    ground.receiveShadow = true;
    state.scene.add(ground);
    state.objects.push(ground);
  }

  function buildSnowdrifts() {
    var drifts = [
      { x: -35, z: -30, w: 8, h: 1.5, d: 4 },
      { x: 40,  z: -20, w: 10, h: 1.2, d: 5 },
      { x: -25, z: 40,  w: 7,  h: 1.8, d: 4 },
      { x: 50,  z: 30,  w: 9,  h: 1.0, d: 6 },
      { x: -50, z: -5,  w: 6,  h: 2.0, d: 3 },
      { x: 15,  z: 50,  w: 12, h: 1.3, d: 5 },
      { x: -10, z: -45, w: 8,  h: 1.5, d: 4 },
      { x: 35,  z: -45, w: 6,  h: 1.2, d: 3 }
    ];
    for (var i = 0; i < drifts.length; i++) {
      var d = drifts[i];
      var geo = new THREE.BoxGeometry(d.w, d.h, d.d);
      var mat = new THREE.MeshLambertMaterial({ color: 0xF0F0FF });
      var mesh = addMesh(geo, mat, d.x, d.h / 2, d.z);
      state.snowdrifts.push(mesh);
    }
  }

  function buildBuildingA() {
    // Research lab: 20x5x15, at (0,0,-10)
    var geo = new THREE.BoxGeometry(20, 5, 15);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_LAB });
    var mesh = addMesh(geo, mat, 0, 2.5, -10);
    mesh.userData.building = 'A';
    mesh.userData.bounds = { minX: -10, maxX: 10, minZ: -17.5, maxZ: -2.5 };
    state.buildingA = mesh;

    // Data server inside
    var sGeo = new THREE.BoxGeometry(2, 3, 1.5);
    var sMat = new THREE.MeshLambertMaterial({ color: 0x224466 });
    var server = addMesh(sGeo, sMat, 3, 1.5, -10);
    server.userData.isServer = true;
    state.serverMesh = server;

    // Server status light
    var sLight = new THREE.PointLight(0x0088FF, 0.8, 5);
    sLight.position.set(3, 3.5, -10);
    state.scene.add(sLight);

    // Exit markers (decorative posts)
    var postGeo = new THREE.BoxGeometry(0.4, 3, 0.4);
    var postMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    addMesh(postGeo, postMat, -10, 1.5, -10); // west exit
    addMesh(postGeo, postMat, 10, 1.5, -10);  // east exit

    // Roof
    var rGeo = new THREE.BoxGeometry(21, 0.3, 16);
    var rMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    addMesh(rGeo, rMat, 0, 5.15, -10);
  }

  function buildBuildingB() {
    // Barracks: 15x5x12, at (-25, 0, 10)
    var geo = new THREE.BoxGeometry(15, 5, 12);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_BARRACKS });
    var mesh = addMesh(geo, mat, -25, 2.5, 10);
    mesh.userData.building = 'B';
    mesh.userData.bounds = { minX: -32.5, maxX: -17.5, minZ: 4, maxZ: 16 };
    state.buildingB = mesh;

    // Medical station (white cross box)
    var medGeo = new THREE.BoxGeometry(3, 2, 3);
    var medMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    addMesh(medGeo, medMat, -25, 1, 10);

    var medLight = new THREE.PointLight(0xFF3333, 0.6, 5);
    medLight.position.set(-25, 3, 10);
    state.scene.add(medLight);

    // Locker in barracks (suit pickup)
    buildLocker();

    // Roof access platform
    var rGeo = new THREE.BoxGeometry(16, 0.3, 13);
    var rMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    addMesh(rGeo, rMat, -25, 5.15, 10);

    // Roof ladder box
    var lGeo = new THREE.BoxGeometry(1, 5, 0.3);
    var lMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    addMesh(lGeo, lMat, -25, 2.5, 3.85);
  }

  function buildBuildingC() {
    // Generator shed: 10x4x8, at (25, 0, 10)
    var geo = new THREE.BoxGeometry(10, 4, 8);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_GENSHED });
    var mesh = addMesh(geo, mat, 25, 2, 10);
    mesh.userData.building = 'C';
    mesh.userData.bounds = { minX: 20, maxX: 30, minZ: 6, maxZ: 14 };
    state.buildingC = mesh;

    // Roof
    var rGeo = new THREE.BoxGeometry(11, 0.3, 9);
    var rMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    addMesh(rGeo, rMat, 25, 4.15, 10);

    // Storage boxes (repair kits)
    var stGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
    var stMat = new THREE.MeshLambertMaterial({ color: 0x667755 });
    var storage = addMesh(stGeo, stMat, 23, 0.75, 12);
    storage.userData.isStorage = true;
    state.storageMesh = storage;
  }

  function buildGenerator() {
    // CylinderGeometry r=1 h=3 generator
    var geo = new THREE.CylinderGeometry(1, 1, 3, 12);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_GENERATOR });
    var mesh = addMesh(geo, mat, 25, 1.5, 10);
    mesh.userData.isGenerator = true;
    state.genMesh = mesh;

    // Generator glow light
    var light = new THREE.PointLight(COLOR_GEN_LIGHT, 1.5, 8);
    light.position.set(25, 3, 10);
    state.scene.add(light);
    state.generatorLight = light;

    // Exhaust stack
    var stackGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var stackMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    addMesh(stackGeo, stackMat, 26, 3, 10);
  }

  function buildLocker() {
    // Arctic suit locker in barracks
    var lGeo = new THREE.BoxGeometry(1.2, 2, 0.8);
    var lMat = new THREE.MeshLambertMaterial({ color: COLOR_LOCKER });
    var locker = addMesh(lGeo, lMat, -28, 1, 14);
    locker.userData.isLocker = true;
    state.lockerMesh = locker;

    var lLight = new THREE.PointLight(0x6699FF, 0.5, 4);
    lLight.position.set(-28, 2.5, 14);
    state.scene.add(lLight);
  }

  function buildPerimeterFence() {
    // Chain-link fence perimeter using LineSegments
    var fenceRadius = 45;
    var postPositions = [
      { x: -fenceRadius, z: -fenceRadius },
      { x:  fenceRadius, z: -fenceRadius },
      { x:  fenceRadius, z:  fenceRadius },
      { x: -fenceRadius, z:  fenceRadius }
    ];

    var verts = [];
    for (var i = 0; i < postPositions.length; i++) {
      var a = postPositions[i];
      var b = postPositions[(i + 1) % postPositions.length];
      // Fence panel segments
      var steps = 8;
      for (var s = 0; s < steps; s++) {
        var t0 = s / steps;
        var t1 = (s + 1) / steps;
        var x0 = a.x + (b.x - a.x) * t0;
        var z0 = a.z + (b.z - a.z) * t0;
        var x1 = a.x + (b.x - a.x) * t1;
        var z1 = a.z + (b.z - a.z) * t1;
        // Bottom rail
        verts.push(x0, 0.2, z0, x1, 0.2, z1);
        // Top rail
        verts.push(x0, 2.5, z0, x1, 2.5, z1);
        // Vertical strands
        verts.push(x0, 0.2, z0, x0, 2.5, z0);
        // Diagonal cross
        verts.push(x0, 0.2, z0, x1, 2.5, z1);
        verts.push(x1, 0.2, z1, x0, 2.5, z0);
      }
    }

    var buf = new THREE.Float32BufferAttribute(verts, 3);
    var fenceGeo = new THREE.BufferGeometry();
    fenceGeo.setAttribute('position', buf);
    var fenceMat = new THREE.LineBasicMaterial({ color: COLOR_FENCE });
    var fence = new THREE.LineSegments(fenceGeo, fenceMat);
    state.scene.add(fence);
    state.objects.push(fence);

    // 4 guard posts at corners
    for (var j = 0; j < postPositions.length; j++) {
      var pp = postPositions[j];
      var pGeo = new THREE.BoxGeometry(2, 4, 2);
      var pMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
      var post = addMesh(pGeo, pMat, pp.x, 2, pp.z);
      post.userData.isGuardPost = true;
      state.fencePosts.push(post);

      // Search light on post
      var sl = new THREE.PointLight(0xFFFFDD, 0.7, 12);
      sl.position.set(pp.x, 5, pp.z);
      state.scene.add(sl);
    }
  }

  function buildHelicopterPad() {
    // Helipad: BoxGeometry flat (0x446655)
    var geo = new THREE.BoxGeometry(12, 0.3, 12);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_HELIPAD });
    var pad = addMesh(geo, mat, 0, 0.15, 30);
    pad.userData.isHelipad = true;
    state.helipads.push(pad);

    // H marking on pad
    var hGeo = new THREE.BoxGeometry(6, 0.1, 1);
    var hMat = new THREE.MeshLambertMaterial({ color: 0x88AAAA });
    addMesh(hGeo, hMat, 0, 0.35, 30);
    addMesh(new THREE.BoxGeometry(1, 0.1, 6), hMat, -2, 0.35, 30);
    addMesh(new THREE.BoxGeometry(1, 0.1, 6), hMat,  2, 0.35, 30);

    // Perimeter lights
    var padLight = new THREE.PointLight(0x44FF66, 0.8, 15);
    padLight.position.set(0, 2, 30);
    state.scene.add(padLight);
  }

  // ------------------------------------------------------------------
  // HUD
  // ------------------------------------------------------------------
  function buildHUD() {
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
    }
    var el = document.createElement('div');
    el.id = 'arctic-siege-hud';
    el.style.position = 'fixed';
    el.style.top = '10px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(0,10,30,0.78)';
    el.style.color = '#AADDFF';
    el.style.fontFamily = 'monospace';
    el.style.fontSize = '13px';
    el.style.padding = '8px 18px';
    el.style.borderRadius = '4px';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.letterSpacing = '1px';
    el.style.textAlign = 'center';
    el.style.whiteSpace = 'nowrap';
    document.body.appendChild(el);
    state.hudEl = el;
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var remaining = Math.max(0, TOTAL_MISSION_TIME - state.missionTime);
    var mm = Math.floor(remaining / 60);
    var ss = Math.floor(remaining % 60);
    var timeStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;

    var buildings = 0;
    if (state.buildingAIntact) buildings++;
    if (state.buildingBIntact) buildings++;
    if (state.buildingCIntact) buildings++;

    var genStr = state.generatorOnline ? 'ONLINE' : 'OFFLINE';
    if (!state.generatorOnline) {
      var offRemain = Math.max(0, GEN_OFFLINE_LOSE - state.generatorOfflineTimer);
      genStr = 'OFFLINE [FAIL IN ' + Math.ceil(offRemain) + 's]';
    }

    var tempStr;
    if (state.insideBuilding || state.insideTent) {
      tempStr = 'WARM';
    } else if (state.tempExposure >= COLD_CRITICAL) {
      tempStr = 'CRITICAL';
    } else if (state.tempExposure >= COLD_THRESHOLD) {
      tempStr = 'COLD';
    } else {
      tempStr = 'OK';
    }

    var hp = Math.max(0, Math.ceil(state.playerHP));

    var waveStr = state.wave + '/4';
    if (state.rescueArrived) waveStr = 'RESCUE!';

    var line = 'ARCTIC SIEGE  |  WAVE: ' + waveStr +
               '  |  RESCUE: ' + timeStr +
               '  |  BUILDINGS: ' + buildings + '/3' +
               '  |  GENERATOR: ' + genStr +
               '  |  TEMP: ' + tempStr +
               '  |  HP: ' + hp;

    if (state.hasSuit) line += '  |  [SUIT]';
    if (state.tents > 0) line += '  |  TENTS:' + state.tents;
    if (state.repairKits > 0) line += '  |  KITS:' + state.repairKits;
    if (state.isRepairing) line += '  |  REPAIRING...';

    if (state.gameOver) {
      line = state.gameWon
        ? '*** MISSION SUCCESS — RESCUE ARRIVED! ***'
        : '*** MISSION FAILED ***';
    }

    state.hudEl.textContent = line;

    // Color feedback
    if (state.gameOver) {
      state.hudEl.style.color = state.gameWon ? '#44FF88' : '#FF4444';
    } else if (tempStr === 'CRITICAL' || hp < 30) {
      state.hudEl.style.color = '#FF4444';
    } else if (tempStr === 'COLD' || !state.generatorOnline) {
      state.hudEl.style.color = '#FFAA44';
    } else {
      state.hudEl.style.color = '#AADDFF';
    }
  }

  // ------------------------------------------------------------------
  // Mercenary spawning
  // ------------------------------------------------------------------
  function spawnMerc(x, z, hp, color, isElite, isCommander) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = addMesh(geo, mat, x, 0.9, z);

    var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: color });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.15, 0);
    mesh.add(head);

    var merc = {
      mesh: mesh,
      hp: hp,
      maxHP: hp,
      alive: true,
      isElite: isElite || false,
      isCommander: isCommander || false,
      speed: isElite ? 4.5 : 3.0,
      attackTimer: 0,
      attackRate: isElite ? 0.8 : 1.5,
      damage: isElite ? 15 : 8,
      targetBuilding: null,
      phase: 'advance'
    };
    return merc;
  }

  function spawnWave1() {
    // 10 snowsuit mercs from south (z = +80)
    state.wave = 1;
    for (var i = 0; i < 10; i++) {
      var x = (Math.random() - 0.5) * 30;
      var merc = spawnMerc(x, 80 + Math.random() * 10, 80, COLOR_MERC, false, false);
      merc.targetBuilding = 'A';
      state.mercenaries.push(merc);
    }
  }

  function spawnWave2() {
    state.wave = 2;
    // 15 mercs from east and west
    for (var i = 0; i < 8; i++) {
      var merc = spawnMerc(80 + Math.random() * 10, (Math.random() - 0.5) * 30, 80, COLOR_MERC, false, false);
      merc.targetBuilding = 'B';
      state.mercenaries.push(merc);
    }
    for (var j = 0; j < 7; j++) {
      var m = spawnMerc(-80 - Math.random() * 10, (Math.random() - 0.5) * 30, 80, COLOR_MERC, false, false);
      m.targetBuilding = 'C';
      state.mercenaries.push(m);
    }
    // 2 snowmobiles
    spawnSnowmobile(80, 0, 'B');
    spawnSnowmobile(-80, 0, 'C');
  }

  function spawnWave3() {
    state.wave = 3;
    // 20 mercs from north
    for (var i = 0; i < 20; i++) {
      var x = (Math.random() - 0.5) * 40;
      var merc = spawnMerc(x, -80 - Math.random() * 10, 100, COLOR_MERC, false, false);
      merc.targetBuilding = 'A';
      state.mercenaries.push(merc);
    }
    // Mortar team from north
    spawnMortarTeam();
    // Commander appears
    spawnCommander();
  }

  function spawnWave4() {
    state.wave = 4;
    // 25 elite mercs from all directions
    for (var i = 0; i < 25; i++) {
      var angle = (i / 25) * Math.PI * 2;
      var dist = 80 + Math.random() * 15;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;
      var merc = spawnMerc(x, z, 150, COLOR_MERC_ELITE, true, false);
      var buildings = ['A', 'B', 'C'];
      merc.targetBuilding = buildings[i % 3];
      state.mercenaries.push(merc);
    }
    // Armored snowcat
    spawnSnowcat();
  }

  function spawnEliteAssault() {
    // 8-man breach team, 2 per building + 2 extra
    var targets = ['A', 'A', 'B', 'B', 'C', 'C', 'A', 'B'];
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 50;
      var z = Math.sin(angle) * 50;
      var merc = spawnMerc(x, z, 200, COLOR_MERC_ELITE, true, false);
      merc.targetBuilding = targets[i];
      merc.phase = 'breach';
      state.mercenaries.push(merc);
    }
  }

  function spawnSnowmobile(x, z, target) {
    // Body
    var bodyGeo = new THREE.BoxGeometry(2.5, 0.8, 1.2);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_SNOWMOBILE });
    var body = addMesh(bodyGeo, bodyMat, x, 0.5, z);

    // Skis (CylinderGeometry)
    var skiGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.8, 8);
    var skiMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var skiL = new THREE.Mesh(skiGeo, skiMat);
    skiL.rotation.z = Math.PI / 2;
    skiL.position.set(0, -0.3, 0.45);
    body.add(skiL);

    var skiR = new THREE.Mesh(skiGeo, skiMat);
    skiR.rotation.z = Math.PI / 2;
    skiR.position.set(0, -0.3, -0.45);
    body.add(skiR);

    var rider = spawnMerc(x, z, 80, COLOR_MERC, false, false);
    rider.targetBuilding = target;
    rider.onSnowmobile = true;
    rider.speed = 8;
    state.mercenaries.push(rider);

    var sm = {
      mesh: body,
      riderMerc: rider,
      alive: true,
      hp: 60,
      speed: 8,
      targetBuilding: target
    };
    state.snowmobiles.push(sm);
    return sm;
  }

  function spawnSnowcat() {
    var bodyGeo = new THREE.BoxGeometry(6, 2.5, 4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: COLOR_SNOWCAT });
    var body = addMesh(bodyGeo, bodyMat, 70, 1.25, 0);

    // Cabin on top
    var cabinGeo = new THREE.BoxGeometry(3.5, 1.5, 3);
    var cabinMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 2, 0);
    body.add(cabin);

    // Engine exhaust
    var exhGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8);
    var exhMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var exh = new THREE.Mesh(exhGeo, exhMat);
    exh.position.set(2.5, 2.5, 0);
    body.add(exh);

    state.snowcat = body;
    state.snowcatHP = 300;
  }

  function spawnMortarTeam() {
    // Mortar base
    var baseGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 10);
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var base = addMesh(baseGeo, baseMat, 0, 0.15, -75);

    // Mortar tube
    var tubeGeo = new THREE.CylinderGeometry(0.25, 0.35, 2, 8);
    var tubeMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var tube = addMesh(tubeGeo, tubeMat, 0, 1.3, -75);
    tube.rotation.x = -0.4;

    // 2 crew members
    var c1 = spawnMerc(-2, -75, 80, COLOR_MERC, false, false);
    c1.targetBuilding = 'A';
    var c2 = spawnMerc(2, -75, 80, COLOR_MERC, false, false);
    c2.targetBuilding = 'A';
    state.mercenaries.push(c1, c2);

    state.mortarActive = true;
    state.mortarTeam = { base: base, tube: tube, c1: c1, c2: c2 };
    state.mortarDestroyTimer = MORTAR_KILL_WINDOW;
    state.mortarHitTimer = MORTAR_INTERVAL;
  }

  function spawnCommander() {
    var geo = new THREE.BoxGeometry(1, 2, 1);
    var mat = new THREE.MeshLambertMaterial({ color: COLOR_COMMANDER });
    var mesh = addMesh(geo, mat, -60, 1, -60);

    var headGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.2, 0);
    mesh.add(head);

    // Sniper rifle (PointLight beam)
    var sniperLight = new THREE.PointLight(0xFFFFAA, 0, 40);
    sniperLight.position.set(-60, 3, -60);
    state.scene.add(sniperLight);
    state.commanderLight = sniperLight;

    state.commanderMesh = mesh;
    state.commanderAlive = true;
  }

  // ------------------------------------------------------------------
  // Interact
  // ------------------------------------------------------------------
  function tryInteract() {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    // Locker (arctic suit)
    if (!state.suitPickedUp && state.lockerMesh) {
      var lp = state.lockerMesh.position;
      if (dist2D(px, pz, lp.x, lp.z) < 4) {
        state.hasSuit = true;
        state.suitPickedUp = true;
        // Extend cold onset — represented by reducing exposure faster when inside
        // In suit: COLD_THRESHOLD effectively higher (handled in updateCold)
        return;
      }
    }

    // Generator repair
    if (!state.generatorOnline && state.repairKits > 0 && state.genMesh) {
      var gp = state.genMesh.position;
      if (dist2D(px, pz, gp.x, gp.z) < 5) {
        if (!state.isRepairing) {
          state.isRepairing = true;
          state.repairTimer = 8;
        }
        return;
      }
    }

    // Storage (get repair kit)
    if (state.storageMesh) {
      var sp = state.storageMesh.position;
      if (dist2D(px, pz, sp.x, sp.z) < 4) {
        // Already starts with 2 kits; this refreshes if player used them
        // (simplified: just notify)
        return;
      }
    }
  }

  function placeTent() {
    if (state.tents <= 0) return;
    if (state.insideBuilding) return;
    state.tents--;

    var tGeo = new THREE.BoxGeometry(4, 2, 4);
    var tMat = new THREE.MeshLambertMaterial({ color: COLOR_TENT });
    var tent = addMesh(tGeo, tMat, state.playerPos.x, 1, state.playerPos.z);
    tent.userData.isTent = true;
    tent.userData.bounds = {
      minX: state.playerPos.x - 2,
      maxX: state.playerPos.x + 2,
      minZ: state.playerPos.z - 2,
      maxZ: state.playerPos.z + 2
    };

    var warmLight = new THREE.PointLight(0xFF8800, 0.8, 6);
    warmLight.position.set(state.playerPos.x, 2, state.playerPos.z);
    state.scene.add(warmLight);

    state.tentsPlaced.push(tent);
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function dist2D(x1, z1, x2, z2) {
    var dx = x1 - x2;
    var dz = z1 - z2;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function getBuildingTarget(id) {
    if (id === 'A') return { x: 0,   z: -10 };
    if (id === 'B') return { x: -25, z: 10  };
    if (id === 'C') return { x: 25,  z: 10  };
    return { x: 0, z: 0 };
  }

  function isBuildingIntact(id) {
    if (id === 'A') return state.buildingAIntact;
    if (id === 'B') return state.buildingBIntact;
    if (id === 'C') return state.buildingCIntact;
    return false;
  }

  function damageBuildingById(id, amount) {
    if (id === 'A') {
      state.buildingAHP -= amount;
      if (state.buildingAHP <= 0 && state.buildingAIntact) {
        state.buildingAIntact = false;
        destroyBuildingVisual(state.buildingA);
      }
    } else if (id === 'B') {
      state.buildingBHP -= amount;
      if (state.buildingBHP <= 0 && state.buildingBIntact) {
        state.buildingBIntact = false;
        destroyBuildingVisual(state.buildingB);
      }
    } else if (id === 'C') {
      state.buildingCHP -= amount;
      if (state.buildingCHP <= 0 && state.buildingCIntact) {
        state.buildingCIntact = false;
        destroyBuildingVisual(state.buildingC);
        // Generator in C also destroyed
        state.generatorOnline = false;
        state.generatorHP = 0;
        if (state.generatorLight) state.generatorLight.intensity = 0;
        if (state.ambientLight) state.ambientLight.intensity = 0.1;
      }
    }
  }

  function destroyBuildingVisual(mesh) {
    if (!mesh) return;
    mesh.material.color.setHex(0x332211);
    // Tilt it slightly
    mesh.rotation.z = 0.15;
    mesh.rotation.x = 0.08;
  }

  function checkLoseCondition() {
    var destroyed = 0;
    if (!state.buildingAIntact) destroyed++;
    if (!state.buildingBIntact) destroyed++;
    if (!state.buildingCIntact) destroyed++;
    if (destroyed >= 2) return true;
    if (state.generatorOfflineTimer >= GEN_OFFLINE_LOSE) return true;
    if (state.playerHP <= 0) return true;
    return false;
  }

  function checkWinCondition() {
    if (state.missionTime >= TOTAL_MISSION_TIME && state.rescueArrived) {
      var destroyed = 0;
      if (!state.buildingAIntact) destroyed++;
      if (!state.buildingBIntact) destroyed++;
      if (!state.buildingCIntact) destroyed++;
      if (destroyed < 2) return true;
    }
    return false;
  }

  // ------------------------------------------------------------------
  // Player movement
  // ------------------------------------------------------------------
  function updatePlayer(dt) {
    var speed = PLAYER_SPEED * dt;
    var moved = false;

    if (state.keysDown[87] || state.keysDown[38]) { state.playerPos.z -= speed; moved = true; } // W / Up
    if (state.keysDown[83] || state.keysDown[40]) { state.playerPos.z += speed; moved = true; } // S / Down
    if (state.keysDown[65] || state.keysDown[37]) { state.playerPos.x -= speed; moved = true; } // A / Left
    if (state.keysDown[68] || state.keysDown[39]) { state.playerPos.x += speed; moved = true; } // D / Right

    // Clamp to world
    state.playerPos.x = Math.max(-90, Math.min(90, state.playerPos.x));
    state.playerPos.z = Math.max(-90, Math.min(90, state.playerPos.z));

    // Update camera to follow player
    state.camera.position.x = state.playerPos.x;
    state.camera.position.z = state.playerPos.z + 30;
    state.camera.position.y = 15;
    state.camera.lookAt(state.playerPos.x, 0, state.playerPos.z);

    // Shooting: space bar
    if (state.keysDown[32]) {
      shootAtNearestEnemy();
    }
  }

  var shootCooldown = 0;
  function shootAtNearestEnemy() {
    if (shootCooldown > 0) return;
    shootCooldown = 0.25; // 4 shots/sec

    var nearest = null;
    var nearDist = 999;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    for (var i = 0; i < state.mercenaries.length; i++) {
      var m = state.mercenaries[i];
      if (!m.alive) continue;
      var d = dist2D(px, pz, m.mesh.position.x, m.mesh.position.z);
      if (d < nearDist) { nearDist = d; nearest = m; }
    }

    // Snowcat engine
    if (state.snowcat && !state.snowcatEngineBlown) {
      var sd = dist2D(px, pz, state.snowcat.position.x, state.snowcat.position.z);
      if (sd < nearDist && sd < 25) {
        state.snowcatHP -= 20;
        if (state.snowcatHP <= 0) {
          state.snowcatEngineBlown = true;
          state.snowcat.material.color.setHex(0x221100);
        }
        return;
      }
    }

    // Commander
    if (state.commanderAlive && state.commanderMesh) {
      var cd = dist2D(px, pz, state.commanderMesh.position.x, state.commanderMesh.position.z);
      if (cd < nearDist && cd < SNIPER_RANGE * 1.5) {
        state.commanderHP -= 25;
        if (state.commanderHP <= 0 && state.commanderAlive) {
          state.commanderAlive = false;
          state.commanderKilled = true;
          state.commanderMesh.visible = false;
          if (state.commanderLight) state.commanderLight.intensity = 0;
          // Delay wave 4 by 2 min
          if (!state.wave4Spawned) {
            state.wave4Delayed = true;
            state.wave4DelayTimer = 120;
          }
        }
        return;
      }
    }

    // Mortar team
    if (state.mortarActive && state.mortarTeam) {
      var mt = state.mortarTeam;
      if (mt.base) {
        var md = dist2D(px, pz, mt.base.position.x, mt.base.position.z);
        if (md < 20) {
          state.mortarTeamHP -= 30;
          if (state.mortarTeamHP <= 0) {
            state.mortarActive = false;
            mt.base.visible = false;
            mt.tube.visible = false;
          }
          return;
        }
      }
    }

    if (nearest && nearDist < 30) {
      var dmg = 25 + Math.random() * 15;
      nearest.hp -= dmg;
      if (nearest.hp <= 0) {
        nearest.alive = false;
        nearest.mesh.visible = false;
      }
    }
  }

  // ------------------------------------------------------------------
  // Enemy AI update
  // ------------------------------------------------------------------
  function updateMercenaries(dt) {
    for (var i = 0; i < state.mercenaries.length; i++) {
      var m = state.mercenaries[i];
      if (!m.alive) continue;

      // Find a building target that's still intact
      var tgt = getBuildingTarget(m.targetBuilding);
      if (!isBuildingIntact(m.targetBuilding)) {
        // Switch to another intact building
        if (state.buildingAIntact)      { m.targetBuilding = 'A'; tgt = getBuildingTarget('A'); }
        else if (state.buildingBIntact) { m.targetBuilding = 'B'; tgt = getBuildingTarget('B'); }
        else if (state.buildingCIntact) { m.targetBuilding = 'C'; tgt = getBuildingTarget('C'); }
      }

      var mx = m.mesh.position.x;
      var mz = m.mesh.position.z;
      var dx = tgt.x - mx;
      var dz = tgt.z - mz;
      var d  = Math.sqrt(dx * dx + dz * dz);

      if (d > 3) {
        m.mesh.position.x += (dx / d) * m.speed * dt;
        m.mesh.position.z += (dz / d) * m.speed * dt;
        m.mesh.rotation.y = Math.atan2(dx, dz);
      } else {
        // Attack the building
        m.attackTimer -= dt;
        if (m.attackTimer <= 0) {
          m.attackTimer = m.attackRate;
          damageBuildingById(m.targetBuilding, m.damage);
        }
      }

      // Also attack player if nearby
      var pd = dist2D(mx, mz, state.playerPos.x, state.playerPos.z);
      if (pd < 4) {
        m.attackTimer -= dt;
        if (m.attackTimer <= 0) {
          m.attackTimer = m.attackRate;
          state.playerHP -= m.damage * 0.5;
        }
      }
    }
  }

  function updateSnowmobiles(dt) {
    for (var i = 0; i < state.snowmobiles.length; i++) {
      var sm = state.snowmobiles[i];
      if (!sm.alive) continue;
      if (sm.riderMerc && !sm.riderMerc.alive) {
        sm.alive = false;
        sm.mesh.visible = false;
        continue;
      }
      var tgt = getBuildingTarget(sm.targetBuilding);
      var mx = sm.mesh.position.x;
      var mz = sm.mesh.position.z;
      var dx = tgt.x - mx;
      var dz = tgt.z - mz;
      var d  = Math.sqrt(dx * dx + dz * dz);
      if (d > 5) {
        sm.mesh.position.x += (dx / d) * sm.speed * dt;
        sm.mesh.position.z += (dz / d) * sm.speed * dt;
        sm.mesh.rotation.y = Math.atan2(dx, dz);
        if (sm.riderMerc) {
          sm.riderMerc.mesh.position.copy(sm.mesh.position);
        }
      } else {
        // Ram the building
        damageBuildingById(sm.targetBuilding, 30 * dt);
      }
    }
  }

  function updateSnowcat(dt) {
    if (!state.snowcat || state.snowcatEngineBlown) return;
    var tgt = getBuildingTarget('A');
    var mx = state.snowcat.position.x;
    var mz = state.snowcat.position.z;
    var dx = tgt.x - mx;
    var dz = tgt.z - mz;
    var d  = Math.sqrt(dx * dx + dz * dz);
    if (d > 8) {
      state.snowcat.position.x += (dx / d) * 5 * dt;
      state.snowcat.position.z += (dz / d) * 5 * dt;
      state.snowcat.rotation.y = Math.atan2(dx, dz);
    } else {
      damageBuildingById('A', 40 * dt);
    }
  }

  function updateCommander(dt) {
    if (!state.commanderAlive || !state.commanderMesh) return;
    state.commanderFireTimer -= dt;
    if (state.commanderFireTimer <= 0) {
      state.commanderFireTimer = 3 + Math.random() * 2;
      // Sniper shot — flash the light
      if (state.commanderLight) {
        state.commanderLight.intensity = 2;
        // Fade out handled in animate via simple flag
        state.sniperFlash = 0.3;
      }
      // Damage player if in range
      var cd = dist2D(
        state.playerPos.x, state.playerPos.z,
        state.commanderMesh.position.x,
        state.commanderMesh.position.z
      );
      if (cd < SNIPER_RANGE) {
        state.playerHP -= 20;
      }
    }
    // Fade sniper light
    if (state.sniperFlash > 0) {
      state.sniperFlash -= dt;
      if (state.sniperFlash <= 0 && state.commanderLight) {
        state.commanderLight.intensity = 0;
      }
    }
  }

  function updateMortar(dt) {
    if (!state.mortarActive) return;
    state.mortarDestroyTimer -= dt;
    state.mortarHitTimer -= dt;
    if (state.mortarHitTimer <= 0) {
      state.mortarHitTimer = MORTAR_INTERVAL;
      // Hit a random intact building
      if (state.buildingAIntact) damageBuildingById('A', MORTAR_DMG);
      else if (state.buildingBIntact) damageBuildingById('B', MORTAR_DMG);
    }
    // Animate tube wobble
    if (state.mortarTeam && state.mortarTeam.tube) {
      state.mortarTeam.tube.rotation.z = Math.sin(Date.now() * 0.002) * 0.05;
    }
  }

  // ------------------------------------------------------------------
  // Cold mechanic
  // ------------------------------------------------------------------
  function updateCold(dt) {
    // Check if player is inside a building
    state.insideBuilding = false;
    var px = state.playerPos.x;
    var pz = state.playerPos.z;

    var buildingBounds = [];
    if (state.buildingA && state.buildingAIntact) buildingBounds.push(state.buildingA.userData.bounds);
    if (state.buildingB && state.buildingBIntact) buildingBounds.push(state.buildingB.userData.bounds);
    if (state.buildingC && state.buildingCIntact) buildingBounds.push(state.buildingC.userData.bounds);

    for (var i = 0; i < buildingBounds.length; i++) {
      var b = buildingBounds[i];
      if (b && px > b.minX && px < b.maxX && pz > b.minZ && pz < b.maxZ) {
        state.insideBuilding = true;
        break;
      }
    }

    // Check if inside a placed tent
    state.insideTent = false;
    for (var j = 0; j < state.tentsPlaced.length; j++) {
      var t = state.tentsPlaced[j];
      var tb = t.userData.bounds;
      if (tb && px > tb.minX && px < tb.maxX && pz > tb.minZ && pz < tb.maxZ) {
        state.insideTent = true;
        break;
      }
    }

    var safe = state.insideBuilding || state.insideTent;
    var coldThreshold = state.hasSuit ? COLD_THRESHOLD + 40 : COLD_THRESHOLD;

    if (safe) {
      // Warm up
      state.tempExposure = Math.max(0, state.tempExposure - 20 * dt);
    } else {
      // Build up exposure
      state.tempExposure = Math.min(COLD_MAX, state.tempExposure + COLD_BUILD_RATE * dt);
    }

    // Apply frost damage when critical
    if (state.tempExposure >= coldThreshold && !safe) {
      state.coldDmgAccum += dt;
      if (state.coldDmgAccum >= 1) {
        state.coldDmgAccum = 0;
        state.playerHP -= COLD_DMG_PER_SEC;
      }
    }
  }

  // ------------------------------------------------------------------
  // Generator
  // ------------------------------------------------------------------
  function updateGenerator(dt) {
    if (!state.generatorOnline) {
      state.generatorOfflineTimer += dt;
      return;
    }
    state.generatorOfflineTimer = 0;

    // Pulse the generator light
    if (state.generatorLight) {
      state.generatorLight.intensity = 1.2 + Math.sin(Date.now() * 0.003) * 0.3;
    }

    // Repair via E-hold
    if (state.isRepairing && state.repairKits > 0) {
      state.repairTimer -= dt;
      if (state.repairTimer <= 0) {
        state.isRepairing = false;
        state.repairKits--;
        state.generatorHP = Math.min(200, state.generatorHP * 0 + 150); // restore to 75%
        state.generatorOnline = true;
        if (state.generatorLight) state.generatorLight.intensity = 1.5;
        if (state.ambientLight) state.ambientLight.intensity = 0.6;
      }
    }
  }

  // ------------------------------------------------------------------
  // Wave management
  // ------------------------------------------------------------------
  function updateWaves(dt) {
    var t = state.missionTime;

    if (t >= 0 && !state.wave1Spawned) {
      state.wave1Spawned = true;
      spawnWave1();
    }
    if (t >= 180 && !state.wave2Spawned) {
      state.wave2Spawned = true;
      spawnWave2();
    }
    if (t >= 360 && !state.wave3Spawned) {
      state.wave3Spawned = true;
      spawnWave3();
    }

    // Wave 4: at 540s unless delayed by killing commander
    if (!state.wave4Spawned) {
      if (state.wave4Delayed) {
        state.wave4DelayTimer -= dt;
        if (state.wave4DelayTimer <= 0) {
          state.wave4Spawned = true;
          spawnWave4();
        }
      } else if (t >= 540) {
        state.wave4Spawned = true;
        spawnWave4();
      }
    }

    // Elite assault at 660s (11 min)
    if (t >= 660 && !state.eliteAssaultSpawned) {
      state.eliteAssaultSpawned = true;
      spawnEliteAssault();
    }

    // Rescue helicopter at 720s (12 min)
    if (t >= TOTAL_MISSION_TIME && !state.rescueArrived) {
      state.rescueArrived = true;
      spawnRescueHelicopter();
    }
  }

  function spawnRescueHelicopter() {
    // Main body
    var bodyGeo = new THREE.BoxGeometry(8, 2.5, 4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x336644 });
    var body = addMesh(bodyGeo, bodyMat, 0, 15, -50);

    // Tail boom
    var tailGeo = new THREE.BoxGeometry(6, 0.8, 0.8);
    var tailMat = new THREE.MeshLambertMaterial({ color: 0x336644 });
    var tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(5, 0, 0);
    body.add(tail);

    // Rotor disk
    var rotorGeo = new THREE.BoxGeometry(14, 0.15, 0.6);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x224433 });
    var rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.position.set(0, 1.5, 0);
    body.add(rotor);

    // Landing light
    var heliLight = new THREE.PointLight(0xFFFFAA, 2, 30);
    heliLight.position.set(0, 20, -50);
    state.scene.add(heliLight);

    state.helicopter = body;
  }

  function updateHelicopter(dt) {
    if (!state.helicopter) return;
    var heli = state.helicopter;
    var tgt = { x: 0, y: 2, z: 30 }; // helipad position
    var dx = tgt.x - heli.position.x;
    var dy = tgt.y - heli.position.y;
    var dz = tgt.z - heli.position.z;
    var d  = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > 2) {
      heli.position.x += (dx / d) * 10 * dt;
      heli.position.y += (dy / d) * 10 * dt;
      heli.position.z += (dz / d) * 10 * dt;
    }
    // Spin rotor
    if (heli.children.length > 1) {
      heli.children[1].rotation.y += 8 * dt;
    }
  }

  // ------------------------------------------------------------------
  // Animate
  // ------------------------------------------------------------------
  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;

    if (state.gameOver) {
      state.renderer.render(state.scene, state.camera);
      updateHUD();
      return;
    }

    state.missionTime += dt;

    // Shoot cooldown
    if (shootCooldown > 0) shootCooldown -= dt;

    updatePlayer(dt);
    updateCold(dt);
    updateGenerator(dt);
    updateWaves(dt);
    updateMercenaries(dt);
    updateSnowmobiles(dt);
    updateSnowcat(dt);
    updateCommander(dt);
    updateMortar(dt);
    updateHelicopter(dt);

    // Animate generator
    if (state.genMesh && state.generatorOnline) {
      state.genMesh.rotation.y += dt * 2;
    }

    // Check win/lose
    if (checkLoseCondition()) {
      state.gameOver = true;
      state.gameWon = false;
    } else if (checkWinCondition()) {
      state.gameOver = true;
      state.gameWon = true;
    }

    state.renderer.render(state.scene, state.camera);
    updateHUD();
  }

  // ------------------------------------------------------------------
  // Reset / public interface
  // ------------------------------------------------------------------
  function reset() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (state.renderer) {
      if (state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    state.active = false;
    state.scene = null;
    state.camera = null;
  }

  function update(dt) {
    // External update hook (no-op; animation loop self-driven)
  }

  // ------------------------------------------------------------------
  // Bootstrap key listener (always on, triggers init on A+S)
  // ------------------------------------------------------------------
  bindKeys();

  return { init: init, update: update, reset: reset };
}());
