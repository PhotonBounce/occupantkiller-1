window.OilRig = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var MODULE_NAME = 'OilRig';
  var ACTIVATION_KEY_O = 79;
  var ACTIVATION_KEY_R = 82;
  var ACTIVATION_WINDOW = 400;

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    playerPos: { x: 0, y: 4, z: 0 },
    playerHP: 100,
    onPlatform: true,
    drowning: false,
    drownTimer: 0,
    score: 0,
    gameOver: false,
    lastTime: 0,
    animFrameId: null,
    objects: [],
    enemies: [],
    hostages: [],
    barrels: [],
    fuelLines: [],
    ladders: [],
    fireLights: [],
    c4Placed: [],
    craneArm: null,
    craneLoad: null,
    craneAngle: 0,
    craneControlled: false,
    craneLoadDropped: false,
    speedboat: null,
    speedboatAngle: 0,
    speedboatTimer: 0,
    speedboatActive: true,
    helicopter: null,
    helicopterLanded: false,
    helicopterTimer: 0,
    helicopterLeft: false,
    helicopterBoarded: false,
    controlRoomHacking: false,
    hackTimer: 0,
    controlRoomTaken: false,
    paSystemActive: false,
    paTimer: 0,
    emergencyShutdown: false,
    fireActive: false,
    fireDamageTimer: 0,
    fireDamageInterval: null,
    hostagesFreed: 0,
    hostagesTotal: 5,
    reinforcementsCalled: false,
    nearConsole: false,
    nearLock: false,
    nearLadder: false,
    hudEl: null,
    hudInterval: null,
    keysDown: {},
    keyTimes: {}
  };

  var PLATFORM_Y = 4;
  var WATER_Y = -8;
  var DROWN_TIME = 15;
  var ENEMY_SIGHT = 40;
  var HACK_TIME = 15;
  var PA_DURATION = 20;
  var HELI_SPAWN_TIME = 300;
  var HELI_WINDOW = 30;
  var SPEEDBOAT_CYCLE = 90;
  var FIRE_DAMAGE_RATE = 5;
  var CRANE_KILL_RADIUS = 3;

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[OilRig] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildOcean();
    buildPlatform();
    buildLegs();
    buildDerrick();
    buildHelipad();
    buildCrewQuarters();
    buildControlRoom();
    buildFuelLines();
    buildLadders();
    buildCrane();
    buildEnemies();
    buildHostages();
    buildBarrels();
    buildSpeedboat();
    buildHelicopter();
    buildHUD();
    bindKeys();
    animate(0);
  }

  function resetState() {
    state.playerPos = { x: 0, y: PLATFORM_Y, z: 0 };
    state.playerHP = 100;
    state.onPlatform = true;
    state.drowning = false;
    state.drownTimer = 0;
    state.score = 0;
    state.gameOver = false;
    state.lastTime = 0;
    state.animFrameId = null;
    state.objects = [];
    state.enemies = [];
    state.hostages = [];
    state.barrels = [];
    state.fuelLines = [];
    state.ladders = [];
    state.fireLights = [];
    state.c4Placed = [];
    state.craneArm = null;
    state.craneLoad = null;
    state.craneAngle = 0;
    state.craneControlled = false;
    state.craneLoadDropped = false;
    state.speedboat = null;
    state.speedboatAngle = 0;
    state.speedboatTimer = 0;
    state.speedboatActive = true;
    state.helicopter = null;
    state.helicopterLanded = false;
    state.helicopterTimer = 0;
    state.helicopterLeft = false;
    state.helicopterBoarded = false;
    state.controlRoomHacking = false;
    state.hackTimer = 0;
    state.controlRoomTaken = false;
    state.paSystemActive = false;
    state.paTimer = 0;
    state.emergencyShutdown = false;
    state.fireActive = false;
    state.fireDamageTimer = 0;
    state.hostagesFreed = 0;
    state.reinforcementsCalled = false;
    state.nearConsole = false;
    state.nearLock = false;
    state.nearLadder = false;
    state.keysDown = {};
    state.keyTimes = {};
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;
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
    if (state.hudInterval) {
      clearInterval(state.hudInterval);
      state.hudInterval = null;
    }
    if (state.fireDamageInterval) {
      clearInterval(state.fireDamageInterval);
      state.fireDamageInterval = null;
    }
    unbindKeys();
    state.objects = [];
    state.enemies = [];
    state.hostages = [];
    state.barrels = [];
    state.fuelLines = [];
    state.ladders = [];
    state.fireLights = [];
    state.scene = null;
    state.camera = null;
  }

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x001A33);
    state.scene.fog = new THREE.FogExp2(0x001A33, 0.012);

    state.camera = new THREE.PerspectiveCamera(70, w / h, 0.1, 600);
    state.camera.position.set(0, 20, 50);
    state.camera.lookAt(0, 4, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    state.scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFDDAA, 1.2);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    state.scene.add(sun);

    var fillLight = new THREE.PointLight(0x2244AA, 0.8, 200);
    fillLight.position.set(-30, 10, -30);
    state.scene.add(fillLight);
  }

  function makeMesh(geo, mat, x, y, z) {
    var mesh = new THREE.Mesh(geo, mat);
    if (x !== undefined) mesh.position.set(x, y, z);
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  function buildOcean() {
    var oceanGeo = new THREE.BoxGeometry(400, 2, 400);
    var oceanMat = new THREE.MeshLambertMaterial({ color: 0x001A33, transparent: true, opacity: 0.88 });
    var ocean = makeMesh(oceanGeo, oceanMat, 0, WATER_Y - 1, 0);
    ocean.userData.isOcean = true;
  }

  function buildPlatform() {
    var platGeo = new THREE.BoxGeometry(35, 3, 35);
    var platMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var platform = makeMesh(platGeo, platMat, 0, PLATFORM_Y - 1.5, 0);
    platform.userData.isPlatform = true;

    var northExtGeo = new THREE.BoxGeometry(12, 1, 10);
    var northExtMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var northExt = makeMesh(northExtGeo, northExtMat, 0, PLATFORM_Y, -22);
    northExt.userData.isPlatform = true;
  }

  function buildLegs() {
    var legMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var legPositions = [
      [14, -8, 14],
      [-14, -8, 14],
      [14, -8, -14],
      [-14, -8, -14]
    ];
    for (var i = 0; i < legPositions.length; i++) {
      var lp = legPositions[i];
      var legGeo = new THREE.CylinderGeometry(2, 2, 20, 12);
      var leg = makeMesh(legGeo, legMat, lp[0], lp[1], lp[2]);
      leg.userData.isLeg = true;
    }
  }

  function buildDerrick() {
    var derrickMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var derrickGeo = new THREE.BoxGeometry(4, 30, 4);
    var derrick = makeMesh(derrickGeo, derrickMat, 0, PLATFORM_Y + 15, 0);
    derrick.userData.isDerrick = true;

    var crossMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var crossPositions = [10, 18, 26];
    for (var c = 0; c < crossPositions.length; c++) {
      var crossGeo = new THREE.BoxGeometry(10, 0.8, 0.8);
      makeMesh(crossGeo, crossMat, 0, PLATFORM_Y + crossPositions[c], 0);
      var crossGeo2 = new THREE.BoxGeometry(0.8, 0.8, 10);
      makeMesh(crossGeo2, crossMat, 0, PLATFORM_Y + crossPositions[c], 0);
    }
  }

  function buildHelipad() {
    var padGeo = new THREE.BoxGeometry(10, 0.5, 10);
    var padMat = new THREE.MeshLambertMaterial({ color: 0xFFFF44 });
    var pad = makeMesh(padGeo, padMat, 0, PLATFORM_Y + 0.75, -22);
    pad.userData.isHelipad = true;

    var markGeo = new THREE.BoxGeometry(1, 0.6, 8);
    var markMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    makeMesh(markGeo, markMat, 0, PLATFORM_Y + 1.05, -22);
    var markGeo2 = new THREE.BoxGeometry(8, 0.6, 1);
    makeMesh(markGeo2, markMat, 0, PLATFORM_Y + 1.05, -22);
  }

  function buildCrewQuarters() {
    var quartGeo = new THREE.BoxGeometry(15, 5, 10);
    var quartMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var quarters = makeMesh(quartGeo, quartMat, 20, PLATFORM_Y + 2.5, 0);
    quarters.userData.isCrewQuarters = true;

    var doorGeo = new THREE.BoxGeometry(2, 3.5, 0.3);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var door = makeMesh(doorGeo, doorMat, 20, PLATFORM_Y + 1.75, -5);
    door.userData.isLock = true;
    door.userData.locked = true;

    var lockGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var lockMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    var lock = makeMesh(lockGeo, lockMat, 20, PLATFORM_Y + 2.5, -5.3);
    lock.userData.isLockHandle = true;
    lock.userData.locked = true;
  }

  function buildControlRoom() {
    var crGeo = new THREE.BoxGeometry(8, 4, 8);
    var crMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var cr = makeMesh(crGeo, crMat, -10, PLATFORM_Y + 2, 0);
    cr.userData.isControlRoom = true;

    var consoleGeo = new THREE.BoxGeometry(4, 1.5, 1.5);
    var consoleMat = new THREE.MeshLambertMaterial({ color: 0x225544 });
    var console3d = makeMesh(consoleGeo, consoleMat, -10, PLATFORM_Y + 2.75, -2);
    console3d.userData.isConsole = true;

    var screenGeo = new THREE.BoxGeometry(3, 1, 0.1);
    var screenMat = new THREE.MeshLambertMaterial({ color: 0x44FF88, emissive: 0x004422 });
    makeMesh(screenGeo, screenMat, -10, PLATFORM_Y + 3.3, -2.8);
  }

  function buildFuelLines() {
    var fuelMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
    var fuelDefs = [
      { x: 5, y: PLATFORM_Y + 0.5, z: 5, rx: 0, ry: 0, rz: 0, w: 20, h: 0.5, d: 0.5 },
      { x: 5, y: PLATFORM_Y + 0.5, z: -5, rx: 0, ry: 0, rz: 0, w: 20, h: 0.5, d: 0.5 },
      { x: -5, y: PLATFORM_Y + 0.5, z: 0, rx: 0, ry: Math.PI / 2, rz: 0, w: 20, h: 0.5, d: 0.5 }
    ];
    for (var f = 0; f < fuelDefs.length; f++) {
      var fd = fuelDefs[f];
      var fgeo = new THREE.BoxGeometry(fd.w, fd.h, fd.d);
      var fmesh = new THREE.Mesh(fgeo, fuelMat);
      fmesh.position.set(fd.x, fd.y, fd.z);
      fmesh.rotation.y = fd.ry;
      fmesh.userData.isFuelLine = true;
      fmesh.userData.onFire = false;
      state.scene.add(fmesh);
      state.objects.push(fmesh);
      state.fuelLines.push(fmesh);
    }
  }

  function buildLadders() {
    var ladderMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
    var legPositions = [
      [14, -8, 14],
      [-14, -8, 14],
      [14, -8, -14],
      [-14, -8, -14]
    ];
    for (var i = 0; i < legPositions.length; i++) {
      var lp = legPositions[i];
      var ladderGeo = new THREE.CylinderGeometry(0.2, 0.2, 20, 6);
      var ladder = new THREE.Mesh(ladderGeo, ladderMat);
      ladder.position.set(lp[0] + 2.5, lp[1], lp[2]);
      ladder.userData.isLadder = true;
      ladder.userData.legIndex = i;
      state.scene.add(ladder);
      state.objects.push(ladder);
      state.ladders.push(ladder);
    }
  }

  function buildCrane() {
    var craneMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
    var baseGeo = new THREE.BoxGeometry(3, 6, 3);
    var craneBase = makeMesh(baseGeo, craneMat, 12, PLATFORM_Y + 3, 10);
    craneBase.userData.isCraneBase = true;

    var armGeo = new THREE.BoxGeometry(16, 1, 1);
    var armMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(12, PLATFORM_Y + 6.5, 10);
    arm.userData.isCraneArm = true;
    state.scene.add(arm);
    state.objects.push(arm);
    state.craneArm = arm;

    var loadGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    var loadMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var craneLoad = new THREE.Mesh(loadGeo, loadMat);
    craneLoad.position.set(20, PLATFORM_Y + 5, 10);
    craneLoad.userData.isCraneLoad = true;
    craneLoad.userData.dropped = false;
    state.scene.add(craneLoad);
    state.objects.push(craneLoad);
    state.craneLoad = craneLoad;
  }

  function buildEnemies() {
    var enemyMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var patrolPositions = [
      { x: 5, y: PLATFORM_Y + 1, z: 5 },
      { x: -5, y: PLATFORM_Y + 1, z: 5 },
      { x: 5, y: PLATFORM_Y + 1, z: -5 },
      { x: -5, y: PLATFORM_Y + 1, z: -5 },
      { x: 10, y: PLATFORM_Y + 1, z: 0 },
      { x: -10, y: PLATFORM_Y + 1, z: 0 }
    ];
    var sniperPositions = [
      { x: 2, y: PLATFORM_Y + 25, z: 0 },
      { x: -2, y: PLATFORM_Y + 20, z: 2 },
      { x: 0, y: PLATFORM_Y + 28, z: -2 },
      { x: 3, y: PLATFORM_Y + 15, z: -3 }
    ];

    for (var p = 0; p < patrolPositions.length; p++) {
      var pp = patrolPositions[p];
      var eGeo = new THREE.BoxGeometry(1, 2, 1);
      var enemy = new THREE.Mesh(eGeo, enemyMat.clone());
      enemy.position.set(pp.x, pp.y, pp.z);
      enemy.userData.isEnemy = true;
      enemy.userData.type = 'patroller';
      enemy.userData.alive = true;
      enemy.userData.alerted = false;
      enemy.userData.sightRange = ENEMY_SIGHT;
      enemy.userData.patrolDir = 1;
      enemy.userData.patrolTimer = 0;
      enemy.userData.startX = pp.x;
      enemy.userData.startZ = pp.z;
      state.scene.add(enemy);
      state.objects.push(enemy);
      state.enemies.push(enemy);
    }

    for (var s = 0; s < sniperPositions.length; s++) {
      var sp = sniperPositions[s];
      var sGeo = new THREE.BoxGeometry(1, 2, 1);
      var sniper = new THREE.Mesh(sGeo, enemyMat.clone());
      sniper.position.set(sp.x, sp.y, sp.z);
      sniper.userData.isEnemy = true;
      sniper.userData.type = 'sniper';
      sniper.userData.alive = true;
      sniper.userData.alerted = false;
      sniper.userData.sightRange = ENEMY_SIGHT;
      state.scene.add(sniper);
      state.objects.push(sniper);
      state.enemies.push(sniper);
    }
  }

  function buildHostages() {
    var hostMat = new THREE.MeshLambertMaterial({ color: 0xDDCC99 });
    var hostPositions = [
      { x: 18, y: PLATFORM_Y + 1, z: 2 },
      { x: 20, y: PLATFORM_Y + 1, z: 2 },
      { x: 22, y: PLATFORM_Y + 1, z: 2 },
      { x: 18, y: PLATFORM_Y + 1, z: -1 },
      { x: 22, y: PLATFORM_Y + 1, z: -1 }
    ];
    for (var h = 0; h < hostPositions.length; h++) {
      var hp = hostPositions[h];
      var hGeo = new THREE.BoxGeometry(0.9, 1.8, 0.9);
      var hostage = new THREE.Mesh(hGeo, hostMat);
      hostage.position.set(hp.x, hp.y, hp.z);
      hostage.userData.isHostage = true;
      hostage.userData.freed = false;
      hostage.userData.distracting = false;
      state.scene.add(hostage);
      state.objects.push(hostage);
      state.hostages.push(hostage);
    }
  }

  function buildBarrels() {
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0xFF4422 });
    var barrelPositions = [
      { x: 8, y: PLATFORM_Y + 1, z: 8 },
      { x: -8, y: PLATFORM_Y + 1, z: 8 },
      { x: 8, y: PLATFORM_Y + 1, z: -8 },
      { x: -8, y: PLATFORM_Y + 1, z: -8 },
      { x: 15, y: PLATFORM_Y + 1, z: 5 },
      { x: -15, y: PLATFORM_Y + 1, z: 5 },
      { x: 15, y: PLATFORM_Y + 1, z: -5 },
      { x: -15, y: PLATFORM_Y + 1, z: -5 }
    ];
    for (var b = 0; b < barrelPositions.length; b++) {
      var bp = barrelPositions[b];
      var bGeo = new THREE.BoxGeometry(1, 1.8, 1);
      var barrel = new THREE.Mesh(bGeo, barrelMat.clone());
      barrel.position.set(bp.x, bp.y, bp.z);
      barrel.userData.isBarrel = true;
      barrel.userData.exploded = false;
      state.scene.add(barrel);
      state.objects.push(barrel);
      state.barrels.push(barrel);
    }
  }

  function buildSpeedboat() {
    var boatMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
    var boatGeo = new THREE.BoxGeometry(5, 1.5, 12);
    var boat = new THREE.Mesh(boatGeo, boatMat);
    boat.position.set(60, WATER_Y + 0.75, 0);
    boat.userData.isSpeedboat = true;
    boat.userData.destroyed = false;
    state.scene.add(boat);
    state.objects.push(boat);
    state.speedboat = boat;
    state.speedboatAngle = 0;
    state.speedboatTimer = 0;
  }

  function buildHelicopter() {
    var heliMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var heliGeo = new THREE.BoxGeometry(8, 3, 12);
    var heli = new THREE.Mesh(heliGeo, heliMat);
    heli.position.set(0, PLATFORM_Y + 30, -22);
    heli.userData.isHelicopter = true;
    state.scene.add(heli);
    state.objects.push(heli);
    state.helicopter = heli;
    state.helicopterTimer = 0;
  }

  function buildHUD() {
    var hud = document.createElement('div');
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.85)',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #0088AA',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    hud.id = 'oil-rig-hud';
    document.body.appendChild(hud);
    state.hudEl = hud;
    updateHUD();
  }

  function countAliveEnemies() {
    var count = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].userData.alive) count++;
    }
    return count;
  }

  function getHeliCountdown() {
    var remaining = HELI_SPAWN_TIME - state.helicopterTimer;
    if (remaining < 0) remaining = 0;
    if (state.helicopterLanded) {
      remaining = HELI_WINDOW - (state.helicopterTimer - HELI_SPAWN_TIME);
      if (remaining < 0) remaining = 0;
    }
    var mins = Math.floor(remaining / 60);
    var secs = Math.floor(remaining % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var alive = countAliveEnemies();
    var crStatus = state.controlRoomTaken ? 'OWNED' : (state.controlRoomHacking ? 'HACKING' : 'LOCKED');
    var fireStatus = state.fireActive ? 'YES' : 'NO';
    var hostFreed = state.hostagesFreed;
    var hostTotal = state.hostagesTotal;
    var heliTime = getHeliCountdown();
    state.hudEl.textContent = 'OIL RIG [OPERATORS: ' + alive + '] [CONTROL ROOM: ' + crStatus + '] [FIRE: ' + fireStatus + '] [HOSTAGES: ' + hostFreed + '/' + hostTotal + '] | HELI: ' + heliTime;
  }

  function bindKeys() {
    state._onKeyDown = function (e) {
      if (!state.active) return;
      var now = Date.now();
      state.keysDown[e.keyCode] = true;
      state.keyTimes[e.keyCode] = now;
      handleKeyPress(e.keyCode, now);
    };
    state._onKeyUp = function (e) {
      if (!state.active) return;
      state.keysDown[e.keyCode] = false;
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

  function handleKeyPress(keyCode, now) {
    // Movement: WASD
    // E: interact
    // B: place C4
    // IJKL: crane
    // F: shoot fuel line (simulate)

    if (keyCode === 69) {
      // E key - interact
      handleInteract();
    }

    if (keyCode === 66) {
      // B key - place C4
      placeC4();
    }

    if (keyCode === 70) {
      // F key - shoot fuel line
      shootFuelLine();
    }

    // IJKL crane control
    if (state.craneControlled && state.craneArm) {
      if (keyCode === 73) state.craneAngle -= 0.15; // I - swing left
      if (keyCode === 75) state.craneAngle += 0.15; // K - swing right
      if (keyCode === 74) {
        // J - drop load
        if (state.craneLoad && !state.craneLoadDropped) {
          state.craneLoadDropped = true;
          dropCraneLoad();
        }
      }
    }
  }

  function handleInteract() {
    // Check console proximity
    state.nearConsole = false;
    var consolePos = { x: -10, y: PLATFORM_Y + 2.75, z: -2 };
    if (dist3(state.playerPos, consolePos) < 4) {
      state.nearConsole = true;
      if (!state.controlRoomTaken && !state.controlRoomHacking) {
        state.controlRoomHacking = true;
        state.hackTimer = 0;
        console.log('[OilRig] Hacking console...');
      }
    }

    // Check lock proximity (crew quarters door)
    state.nearLock = false;
    var lockPos = { x: 20, y: PLATFORM_Y + 2.5, z: -5.3 };
    if (dist3(state.playerPos, lockPos) < 3) {
      state.nearLock = true;
      freeHostages();
    }
  }

  function freeHostages() {
    for (var i = 0; i < state.hostages.length; i++) {
      var h = state.hostages[i];
      if (!h.userData.freed) {
        h.userData.freed = true;
        h.userData.distracting = true;
        state.hostagesFreed++;
        h.material.color.setHex(0x88FF88);
      }
    }
    updateHUD();
  }

  function shootFuelLine() {
    if (state.fuelLines.length === 0) return;
    var target = state.fuelLines[0];
    for (var i = 0; i < state.fuelLines.length; i++) {
      var fl = state.fuelLines[i];
      if (!fl.userData.onFire && dist3(state.playerPos, fl.position) < 20) {
        target = fl;
        break;
      }
    }
    igniteFireZone(target);
  }

  function igniteFireZone(fuelLine) {
    if (fuelLine.userData.onFire) return;
    fuelLine.userData.onFire = true;
    fuelLine.material.color.setHex(0xFF4400);

    var fireLight = new THREE.PointLight(0xFF4400, 3, 20);
    fireLight.position.copy(fuelLine.position);
    fireLight.position.y += 2;
    state.scene.add(fireLight);
    state.fireLights.push(fireLight);

    state.fireActive = true;
    state.fireDamageTimer = 0;

    if (!state.fireDamageInterval) {
      state.fireDamageInterval = setInterval(function () {
        if (!state.active || !state.fireActive) {
          clearInterval(state.fireDamageInterval);
          state.fireDamageInterval = null;
          return;
        }
        state.fireDamageTimer++;
        if (state.fireDamageTimer >= 30) {
          // fire not extinguished - spread damage
          state.playerHP -= FIRE_DAMAGE_RATE;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerGameOver('Burned alive on the rig!');
          }
        }
      }, 1000);
    }

    // propagate fire to nearby fuel lines after delay
    setTimeout(function () {
      if (!state.active) return;
      for (var i = 0; i < state.fuelLines.length; i++) {
        var fl2 = state.fuelLines[i];
        if (!fl2.userData.onFire && dist3(fl2.position, fuelLine.position) < 15) {
          igniteFireZone(fl2);
        }
      }
    }, 5000);

    updateHUD();
  }

  function extinguishFire() {
    for (var i = 0; i < state.fuelLines.length; i++) {
      state.fuelLines[i].userData.onFire = false;
      state.fuelLines[i].material.color.setHex(0xAA4422);
    }
    for (var j = 0; j < state.fireLights.length; j++) {
      state.scene.remove(state.fireLights[j]);
    }
    state.fireLights = [];
    state.fireActive = false;
    state.fireDamageTimer = 0;
    if (state.fireDamageInterval) {
      clearInterval(state.fireDamageInterval);
      state.fireDamageInterval = null;
    }
    updateHUD();
  }

  function placeC4() {
    var c4Geo = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    var c4Mat = new THREE.MeshLambertMaterial({ color: 0xFFFFAA });
    var c4 = new THREE.Mesh(c4Geo, c4Mat);
    c4.position.set(state.playerPos.x, state.playerPos.y - 0.8, state.playerPos.z);
    c4.userData.isC4 = true;
    c4.userData.armed = true;
    state.scene.add(c4);
    state.objects.push(c4);
    state.c4Placed.push(c4);

    // Detonate after 5 seconds
    (function (c4ref) {
      setTimeout(function () {
        if (!state.active) return;
        detonateC4(c4ref);
      }, 5000);
    }(c4));
  }

  function detonateC4(c4) {
    var pos = c4.position;
    // Destroy nearby enemies
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.userData.alive && dist3(e.position, pos) < 8) {
        killEnemy(e);
      }
    }
    // Check speedboat
    if (state.speedboat && !state.speedboat.userData.destroyed) {
      if (dist3(state.speedboat.position, pos) < 10) {
        destroySpeedboat();
      }
    }
    // Chain barrel explosions
    for (var b = 0; b < state.barrels.length; b++) {
      var barrel = state.barrels[b];
      if (!barrel.userData.exploded && dist3(barrel.position, pos) < 6) {
        detonateBarrel(barrel);
      }
    }
    // Flash
    var flash = new THREE.PointLight(0xFFAA22, 10, 30);
    flash.position.copy(pos);
    state.scene.add(flash);
    setTimeout(function () { if (state.scene) state.scene.remove(flash); }, 300);
    state.scene.remove(c4);
    updateHUD();
  }

  function detonateBarrel(barrel) {
    if (barrel.userData.exploded) return;
    barrel.userData.exploded = true;
    barrel.material.color.setHex(0xFF6600);
    var pos = barrel.position;

    // Kill enemies in radius
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.userData.alive && dist3(e.position, pos) < 5) {
        killEnemy(e);
      }
    }

    // Chain reaction to other barrels
    (function (refPos) {
      setTimeout(function () {
        if (!state.active) return;
        for (var b = 0; b < state.barrels.length; b++) {
          var b2 = state.barrels[b];
          if (!b2.userData.exploded && dist3(b2.position, refPos) < 6) {
            detonateBarrel(b2);
          }
        }
      }, 300);
    }(pos.clone()));

    var flash = new THREE.PointLight(0xFF6600, 8, 25);
    flash.position.copy(pos);
    state.scene.add(flash);
    setTimeout(function () { if (state.scene) state.scene.remove(flash); }, 400);
    state.scene.remove(barrel);
    updateHUD();
  }

  function dropCraneLoad() {
    if (!state.craneLoad) return;
    var dropPos = state.craneLoad.position.clone();
    // Animate drop
    var dropInterval = setInterval(function () {
      if (!state.active) { clearInterval(dropInterval); return; }
      state.craneLoad.position.y -= 0.5;
      if (state.craneLoad.position.y <= PLATFORM_Y + 1) {
        clearInterval(dropInterval);
        // Kill enemies in radius
        for (var i = 0; i < state.enemies.length; i++) {
          var e = state.enemies[i];
          if (e.userData.alive && dist3(e.position, state.craneLoad.position) < CRANE_KILL_RADIUS) {
            killEnemy(e);
          }
        }
        // Impact flash
        var flash = new THREE.PointLight(0xFFCC00, 6, 20);
        flash.position.copy(state.craneLoad.position);
        state.scene.add(flash);
        setTimeout(function () { if (state.scene) state.scene.remove(flash); }, 500);
        updateHUD();
      }
    }, 50);
  }

  function killEnemy(enemy) {
    if (!enemy.userData.alive) return;
    enemy.userData.alive = false;
    enemy.material.color.setHex(0x111122);
    enemy.position.y -= 0.9;
    updateHUD();
  }

  function destroySpeedboat() {
    if (!state.speedboat || state.speedboat.userData.destroyed) return;
    state.speedboat.userData.destroyed = true;
    state.speedboat.material.color.setHex(0x333333);
    var flash = new THREE.PointLight(0xFF6600, 12, 40);
    flash.position.copy(state.speedboat.position);
    state.scene.add(flash);
    setTimeout(function () { if (state.scene) state.scene.remove(flash); }, 600);
  }

  function activatePASystem() {
    state.paSystemActive = true;
    state.paTimer = 0;
    for (var i = 0; i < state.enemies.length; i++) {
      state.enemies[i].userData.alerted = false;
      state.enemies[i].userData.distracted = true;
    }
    console.log('[OilRig] PA system activated - guards distracted for 20s');
  }

  function activateEmergencyShutdown() {
    state.emergencyShutdown = true;
    extinguishFire();
    console.log('[OilRig] Emergency shutdown - all pumps stopped. Mission complete option available!');
    triggerVictory('Emergency shutdown successful!');
  }

  function triggerVictory(msg) {
    state.gameOver = true;
    showEndMessage('MISSION COMPLETE: ' + msg);
  }

  function triggerGameOver(msg) {
    state.gameOver = true;
    showEndMessage('MISSION FAILED: ' + msg);
  }

  function showEndMessage(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.9)',
      'color:#FFCC00',
      'font-family:monospace',
      'font-size:24px',
      'padding:30px 50px',
      'border:2px solid #FFCC00',
      'border-radius:8px',
      'z-index:99999',
      'text-align:center'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      destroy();
    }, 5000);
  }

  function dist3(a, b) {
    var ax = a.x !== undefined ? a.x : 0;
    var ay = a.y !== undefined ? a.y : 0;
    var az = a.z !== undefined ? a.z : 0;
    var bx = b.x !== undefined ? b.x : 0;
    var by = b.y !== undefined ? b.y : 0;
    var bz = b.z !== undefined ? b.z : 0;
    var dx = ax - bx;
    var dy = ay - by;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2(a, b) {
    var dx = (a.x || 0) - (b.x || 0);
    var dz = (a.z || 0) - (b.z || 0);
    return Math.sqrt(dx * dx + dz * dz);
  }

  function updatePlayerMovement(dt) {
    var speed = 8;
    var moved = false;
    if (state.keysDown[87]) { state.playerPos.z -= speed * dt; moved = true; } // W
    if (state.keysDown[83]) { state.playerPos.z += speed * dt; moved = true; } // S
    if (state.keysDown[65]) { state.playerPos.x -= speed * dt; moved = true; } // A
    if (state.keysDown[68]) { state.playerPos.x += speed * dt; moved = true; } // D

    // Check if player is on platform
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var onMainPlatform = (px >= -17.5 && px <= 17.5 && pz >= -17.5 && pz <= 17.5);
    var onNorthExt = (px >= -6 && px <= 6 && pz >= -27 && pz <= -17);
    state.onPlatform = onMainPlatform || onNorthExt;

    if (state.onPlatform) {
      state.playerPos.y = PLATFORM_Y + 1;
      if (state.drowning) {
        state.drowning = false;
        state.drownTimer = 0;
      }
    } else {
      // Check ladder proximity
      var onLadder = false;
      for (var l = 0; l < state.ladders.length; l++) {
        var lad = state.ladders[l];
        if (dist2(state.playerPos, lad.position) < 3) {
          onLadder = true;
          break;
        }
      }
      if (onLadder) {
        // Climbing - allow vertical movement
        if (state.keysDown[87]) state.playerPos.y += speed * dt * 0.6;
        if (state.keysDown[83]) state.playerPos.y -= speed * dt * 0.6;
        state.playerPos.y = Math.max(WATER_Y, Math.min(PLATFORM_Y + 1, state.playerPos.y));
        if (state.playerPos.y >= PLATFORM_Y) {
          state.onPlatform = true;
          state.drowning = false;
          state.drownTimer = 0;
        }
        state.drowning = false;
        state.drownTimer = 0;
      } else {
        // Fell off
        state.playerPos.y = WATER_Y;
        if (!state.drowning) {
          state.drowning = true;
          state.drownTimer = 0;
        }
      }
    }
  }

  function updateDrowning(dt) {
    if (!state.drowning) return;
    state.drownTimer += dt;
    if (state.drownTimer >= DROWN_TIME) {
      triggerGameOver('Drowned in the ocean!');
    }
  }

  function updateCamera() {
    state.camera.position.x = state.playerPos.x;
    state.camera.position.y = state.playerPos.y + 16;
    state.camera.position.z = state.playerPos.z + 30;
    state.camera.lookAt(state.playerPos.x, state.playerPos.y, state.playerPos.z);
  }

  function updateEnemies(dt) {
    var pp = state.playerPos;
    var distracted = false;
    if (state.paSystemActive) distracted = true;
    for (var h = 0; h < state.hostages.length; h++) {
      if (state.hostages[h].userData.distracting) { distracted = true; break; }
    }

    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (!e.userData.alive) continue;

      if (e.userData.type === 'patroller') {
        e.userData.patrolTimer += dt;
        if (e.userData.patrolTimer > 3) {
          e.userData.patrolDir *= -1;
          e.userData.patrolTimer = 0;
        }
        e.position.x += e.userData.patrolDir * 2 * dt;
      }

      // Sight check
      if (!distracted) {
        var d = dist3(e.position, pp);
        if (d < e.userData.sightRange) {
          if (!e.userData.alerted) {
            e.userData.alerted = true;
            e.material.color.setHex(0xFF0000);
            if (!state.reinforcementsCalled) {
              state.reinforcementsCalled = true;
              callReinforcements();
            }
          }
        }
      } else {
        e.userData.alerted = false;
        if (e.userData.alive) e.material.color.setHex(0x334466);
      }
    }
  }

  function callReinforcements() {
    console.log('[OilRig] Guards called reinforcements!');
    // Spawn 2 extra enemies after 10s
    setTimeout(function () {
      if (!state.active) return;
      var extraMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
      var spawnPositions = [
        { x: 5, y: PLATFORM_Y + 1, z: 15 },
        { x: -5, y: PLATFORM_Y + 1, z: 15 }
      ];
      for (var i = 0; i < spawnPositions.length; i++) {
        var sp = spawnPositions[i];
        var eGeo = new THREE.BoxGeometry(1, 2, 1);
        var extra = new THREE.Mesh(eGeo, extraMat);
        extra.position.set(sp.x, sp.y, sp.z);
        extra.userData.isEnemy = true;
        extra.userData.type = 'patroller';
        extra.userData.alive = true;
        extra.userData.alerted = false;
        extra.userData.sightRange = ENEMY_SIGHT;
        extra.userData.patrolDir = 1;
        extra.userData.patrolTimer = 0;
        extra.userData.startX = sp.x;
        extra.userData.startZ = sp.z;
        state.scene.add(extra);
        state.objects.push(extra);
        state.enemies.push(extra);
      }
      updateHUD();
    }, 10000);
  }

  function updateSpeedboat(dt) {
    if (!state.speedboat || state.speedboat.userData.destroyed || !state.speedboatActive) return;
    state.speedboatTimer += dt;
    state.speedboatAngle += dt * (2 * Math.PI / SPEEDBOAT_CYCLE);
    var radius = 65;
    state.speedboat.position.x = Math.cos(state.speedboatAngle) * radius;
    state.speedboat.position.z = Math.sin(state.speedboatAngle) * radius;
    state.speedboat.rotation.y = -state.speedboatAngle;

    // Periodic guard jump when close to rig
    var distToRig = dist2(state.speedboat.position, { x: 0, z: 0 });
    if (distToRig < 40 && state.speedboatTimer > 20) {
      state.speedboatTimer = 0;
      spawnBoatGuard();
    }
  }

  function spawnBoatGuard() {
    var guardMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
    var gGeo = new THREE.BoxGeometry(1, 2, 1);
    var guard = new THREE.Mesh(gGeo, guardMat);
    guard.position.set(
      state.speedboat.position.x,
      PLATFORM_Y + 1,
      state.speedboat.position.z
    );
    guard.userData.isEnemy = true;
    guard.userData.type = 'patroller';
    guard.userData.alive = true;
    guard.userData.alerted = false;
    guard.userData.sightRange = ENEMY_SIGHT;
    guard.userData.patrolDir = 1;
    guard.userData.patrolTimer = 0;
    state.scene.add(guard);
    state.objects.push(guard);
    state.enemies.push(guard);
    updateHUD();
  }

  function updateHelicopter(dt) {
    if (!state.helicopter || state.helicopterLeft || state.helicopterBoarded) return;
    state.helicopterTimer += dt;

    if (state.helicopterTimer < HELI_SPAWN_TIME) {
      // Hovering above approach path
      var approachX = Math.sin(state.helicopterTimer * 0.5) * 40;
      state.helicopter.position.set(approachX, PLATFORM_Y + 30, -22);
    } else if (!state.helicopterLanded) {
      // Land on helipad
      state.helicopterLanded = true;
      state.helicopter.position.set(0, PLATFORM_Y + 3, -22);
      console.log('[OilRig] Helicopter has landed! Board within 30 seconds!');
    } else {
      // Landed - window countdown
      var elapsed = state.helicopterTimer - HELI_SPAWN_TIME;
      if (elapsed >= HELI_WINDOW) {
        state.helicopterLeft = true;
        state.helicopter.position.y += 50;
        console.log('[OilRig] Helicopter left without you!');
        if (!state.gameOver) triggerGameOver('Helicopter left without you!');
      } else {
        // Check if player boards
        if (dist3(state.playerPos, state.helicopter.position) < 6) {
          state.helicopterBoarded = true;
          triggerVictory('Boarded escape helicopter!');
        }
      }
    }

    updateHUD();
  }

  function updateHack(dt) {
    if (!state.controlRoomHacking || state.controlRoomTaken) return;
    state.hackTimer += dt;
    if (state.hackTimer >= HACK_TIME) {
      state.controlRoomHacking = false;
      state.controlRoomTaken = true;
      state.craneControlled = true;
      console.log('[OilRig] Control room taken! Crane, PA, and shutdown available.');
      updateHUD();
      // Auto-activate PA system
      activatePASystem();
    }
  }

  function updatePASystem(dt) {
    if (!state.paSystemActive) return;
    state.paTimer += dt;
    if (state.paTimer >= PA_DURATION) {
      state.paSystemActive = false;
      state.paTimer = 0;
      for (var i = 0; i < state.enemies.length; i++) {
        if (state.enemies[i].alive) state.enemies[i].userData.distracted = false;
      }
    }
  }

  function updateCrane() {
    if (!state.craneArm || !state.craneControlled) return;
    state.craneArm.rotation.y = state.craneAngle;
    if (state.craneLoad && !state.craneLoadDropped) {
      var angle = state.craneAngle;
      state.craneLoad.position.x = 12 + Math.cos(angle) * 8;
      state.craneLoad.position.z = 10 + Math.sin(angle) * 8;
    }
  }

  function updateFireLights(dt) {
    for (var i = 0; i < state.fireLights.length; i++) {
      var fl = state.fireLights[i];
      fl.intensity = 2.5 + Math.sin(Date.now() * 0.01 + i) * 0.8;
    }
  }

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    if (dt > 0.1) dt = 0.1;
    if (dt <= 0) return;

    if (state.gameOver) {
      state.renderer.render(state.scene, state.camera);
      return;
    }

    updatePlayerMovement(dt);
    updateDrowning(dt);
    updateEnemies(dt);
    updateSpeedboat(dt);
    updateHelicopter(dt);
    updateHack(dt);
    updatePASystem(dt);
    updateCrane();
    updateFireLights(dt);
    updateCamera();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // Activation key tracking
  var _activationKeys = {};
  var _activationHandler = function (e) {
    var now = Date.now();
    if (e.keyCode === ACTIVATION_KEY_O || e.keyCode === ACTIVATION_KEY_R) {
      _activationKeys[e.keyCode] = now;
      var other = e.keyCode === ACTIVATION_KEY_O ? ACTIVATION_KEY_R : ACTIVATION_KEY_O;
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
    destroy: destroy,
    extinguishFire: extinguishFire,
    activatePASystem: activatePASystem,
    activateEmergencyShutdown: activateEmergencyShutdown,
    getState: function () { return state; }
  };
}());
