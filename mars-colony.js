window.MarsColony = (function () {
  'use strict';

  // ── constants ─────────────────────────────────────────────────────────────

  var MODULE_NAME = 'MarsColony';
  var ACTIVATION_KEY_M = 77;
  var ACTIVATION_KEY_C = 67;
  var ACTIVATION_WINDOW = 400;

  var PLAYER_MAX_HP = 150;
  var PLAYER_SPEED = 8;
  var PLAYER_HEIGHT = 1.8;
  var GRAVITY = -9.8;
  var JUMP_FORCE = 5.5;

  var COLONY_COLONISTS = 200;
  var WIN_TIME = 900; // 15 minutes in seconds

  // Life support HP
  var O2_HP_MAX = 300;
  var WATER_HP_MAX = 300;
  var POWER_HP_MAX = 300;
  var AIRLOCK_HP_MAX = 200;

  // Rebel definitions
  var REBEL_COLONIST_COUNT = 12;
  var REBEL_ENGINEER_COUNT = 3;
  var REBEL_COLONIST_HP = 80;
  var REBEL_ENGINEER_HP = 120;
  var REBEL_LEADER_HP = 300;
  var REBEL_COLONIST_DMG = 40;
  var REBEL_ENGINEER_SABOTAGE_DPS = 20;
  var REBEL_WAVE_INTERVAL = 180; // 3 minutes

  // Dust storm timing
  var STORM_INTERVAL = 240;   // 4 minutes between storms
  var STORM_DURATION = 90;    // 90 seconds each

  // Dome positions (centers, evenly spaced)
  var DOME_DEFS = [
    { x: -30, z: -30, system: 'o2' },
    { x:  30, z: -30, system: 'water' },
    { x:  30, z:  30, system: 'power' },
    { x: -30, z:  30, system: 'airlock' }
  ];

  // Solar panel positions (outdoors)
  var SOLAR_PANEL_POSITIONS = [
    { x: 0,   z: -50 },
    { x: 10,  z: -50 },
    { x: -10, z: -50 },
    { x: 0,   z:  50 }
  ];

  // ── state ─────────────────────────────────────────────────────────────────

  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,

    // Player
    playerPos: { x: 0, y: PLAYER_HEIGHT, z: 0 },
    playerVel: { x: 0, y: 0, z: 0 },
    playerHP: PLAYER_MAX_HP,
    playerYaw: 0,
    playerPitch: 0,
    onGround: false,
    shooting: false,
    shootCooldown: 0,
    inRover: false,
    roverMesh: null,

    // Repair
    repairTarget: null,
    repairHoldTime: 0,
    repairHeld: false,

    // Storm covers carry
    carryingCover: false,
    carryCoverMesh: null,
    stormCovers: [],

    // Life support systems
    systems: {
      o2:      { hp: O2_HP_MAX,      max: O2_HP_MAX,      mesh: null, light: null, domeIndex: 0 },
      water:   { hp: WATER_HP_MAX,   max: WATER_HP_MAX,   mesh: null, light: null, domeIndex: 1 },
      power:   { hp: POWER_HP_MAX,   max: POWER_HP_MAX,   mesh: null, light: null, domeIndex: 2 },
      airlock: { hp: AIRLOCK_HP_MAX, max: AIRLOCK_HP_MAX, mesh: null, light: null, domeIndex: 3 }
    },

    // Rebels
    rebels: [],
    rebelLeader: null,
    waveTimer: REBEL_WAVE_INTERVAL,
    airlockBreachTimer: 0,

    // Colonists
    colonistsAlive: COLONY_COLONISTS,

    // Dust storm
    stormTimer: STORM_INTERVAL,
    stormActive: false,
    stormRemaining: 0,

    // Solar panels
    solarPanels: [],

    // Dome lights
    domeLights: [],

    // Game
    gameTime: 0,
    gameOver: false,
    gameWon: false,
    lastTime: 0,
    animFrameId: null,

    // Objects
    objects: [],
    bullets: [],
    domeMeshes: [],
    tunnelMeshes: [],

    // HUD
    hudEl: null,
    msgEl: null,
    msgTimer: 0,

    // Input
    keysDown: {},
    keyTimes: {},
    mouseX: 0,
    mouseY: 0,
    mouseDX: 0,
    mouseDY: 0,
    pointerLocked: false
  };

  // ── key / mouse helpers ───────────────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.keyCode;
    var now = Date.now();
    if (!state.keysDown[k]) {
      state.keyTimes[k] = now;
    }
    state.keysDown[k] = true;

    // E = interact (repair / cover / board rover)
    if (k === 69) { handleInteract(); }

    // F = shoot
    if (k === 70) { state.shooting = true; }

    // ESC = destroy
    if (k === 27) { destroy(); }

    checkActivationCombo(k, now);
  }

  function onKeyUp(e) {
    var k = e.keyCode;
    state.keysDown[k] = false;
    if (k === 70) { state.shooting = false; }
    if (k === 69) {
      state.repairHeld = false;
      state.repairHoldTime = 0;
    }
  }

  function onMouseMove(e) {
    if (state.pointerLocked) {
      state.mouseDX += e.movementX || 0;
      state.mouseDY += e.movementY || 0;
    }
  }

  function onPointerLockChange() {
    state.pointerLocked = (document.pointerLockElement === state.renderer.domElement);
  }

  function onCanvasClick() {
    if (!state.pointerLocked && state.renderer) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  function checkActivationCombo(k, now) {
    if (k === ACTIVATION_KEY_C && state.keysDown[ACTIVATION_KEY_M]) {
      var t = state.keyTimes[ACTIVATION_KEY_M] || 0;
      if (now - t <= ACTIVATION_WINDOW) { init(); return; }
    }
    if (k === ACTIVATION_KEY_M && state.keysDown[ACTIVATION_KEY_C]) {
      var t2 = state.keyTimes[ACTIVATION_KEY_C] || 0;
      if (now - t2 <= ACTIVATION_WINDOW) { init(); return; }
    }
  }

  function bindInput() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    if (state.renderer) {
      state.renderer.domElement.addEventListener('click', onCanvasClick);
    }
  }

  function unbindInput() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  // ── init / destroy / reset ────────────────────────────────────────────────

  function init() {
    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildGround();
    buildDomesAndTunnels();
    buildOutdoorProps();
    buildSolarPanels();
    buildStormCovers();
    buildLifeSupport();
    buildRover();
    buildRebels();
    buildHUD();
    bindInput();
    animate(0);
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
    if (state.msgEl && state.msgEl.parentNode) {
      state.msgEl.parentNode.removeChild(state.msgEl);
      state.msgEl = null;
    }
    unbindInput();

    state.scene = null;
    state.camera = null;
    state.rebels = [];
    state.bullets = [];
    state.objects = [];
    state.solarPanels = [];
    state.stormCovers = [];
    state.domeMeshes = [];
    state.tunnelMeshes = [];
    state.domeLights = [];
    state.systems.o2.mesh = null;
    state.systems.water.mesh = null;
    state.systems.power.mesh = null;
    state.systems.airlock.mesh = null;
  }

  function resetState() {
    state.playerPos = { x: 0, y: PLAYER_HEIGHT, z: 0 };
    state.playerVel = { x: 0, y: 0, z: 0 };
    state.playerHP = PLAYER_MAX_HP;
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.onGround = false;
    state.shooting = false;
    state.shootCooldown = 0;
    state.inRover = false;
    state.roverMesh = null;
    state.repairTarget = null;
    state.repairHoldTime = 0;
    state.repairHeld = false;
    state.carryingCover = false;
    state.carryCoverMesh = null;
    state.stormCovers = [];

    state.systems.o2      = { hp: O2_HP_MAX,      max: O2_HP_MAX,      mesh: null, light: null, domeIndex: 0, shielded: false };
    state.systems.water   = { hp: WATER_HP_MAX,   max: WATER_HP_MAX,   mesh: null, light: null, domeIndex: 1, shielded: false };
    state.systems.power   = { hp: POWER_HP_MAX,   max: POWER_HP_MAX,   mesh: null, light: null, domeIndex: 2, shielded: false };
    state.systems.airlock = { hp: AIRLOCK_HP_MAX, max: AIRLOCK_HP_MAX, mesh: null, light: null, domeIndex: 3, shielded: false };

    state.rebels = [];
    state.rebelLeader = null;
    state.waveTimer = REBEL_WAVE_INTERVAL;
    state.airlockBreachTimer = 0;

    state.colonistsAlive = COLONY_COLONISTS;

    state.stormTimer = STORM_INTERVAL;
    state.stormActive = false;
    state.stormRemaining = 0;

    state.solarPanels = [];
    state.domeLights = [];

    state.gameTime = 0;
    state.gameOver = false;
    state.gameWon = false;
    state.lastTime = 0;
    state.animFrameId = null;

    state.objects = [];
    state.bullets = [];
    state.domeMeshes = [];
    state.tunnelMeshes = [];

    state.keysDown = {};
    state.keyTimes = {};
    state.mouseDX = 0;
    state.mouseDY = 0;
    state.pointerLocked = false;
  }

  // ── scene setup ───────────────────────────────────────────────────────────

  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x441100);
    state.scene.fog = new THREE.FogExp2(0x551100, 0.02);

    state.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 500);
    state.camera.position.set(0, PLAYER_HEIGHT, 0);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    // Mars ambient: dim reddish
    var ambient = new THREE.AmbientLight(0x331100, 0.5);
    state.scene.add(ambient);

    // Sun from horizon-ish
    var sun = new THREE.DirectionalLight(0xFF9966, 0.8);
    sun.position.set(100, 60, -80);
    state.scene.add(sun);
  }

  // ── geometry helpers ──────────────────────────────────────────────────────

  function makeMesh(geo, mat, x, y, z) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    state.objects.push(mesh);
    return mesh;
  }

  function makeMeshNoTrack(geo, mat, x, y, z) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    state.scene.add(mesh);
    return mesh;
  }

  // ── ground ────────────────────────────────────────────────────────────────

  function buildGround() {
    // Use BoxGeometry for ground (rules say PlaneGeometry color 0x882211)
    var groundGeo = new THREE.BoxGeometry(400, 1, 400);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x882211 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.5, 0);
    state.scene.add(ground);
    state.objects.push(ground);

    // Scattered rocks
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x663322 });
    var i, rx, rz;
    for (i = 0; i < 40; i++) {
      rx = (Math.random() - 0.5) * 160;
      rz = (Math.random() - 0.5) * 160;
      if (Math.abs(rx) < 12 && Math.abs(rz) < 12) { rx += 20; }
      makeMesh(
        new THREE.BoxGeometry(0.5 + Math.random() * 1.5, 0.3 + Math.random() * 0.8, 0.5 + Math.random() * 1.5),
        rockMat,
        rx, 0.2, rz
      );
    }
  }

  // ── domes and tunnels ─────────────────────────────────────────────────────

  function buildDomesAndTunnels() {
    var domeMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x2a3a45 });
    var i, d, light, domeGeo, dome;

    for (i = 0; i < DOME_DEFS.length; i++) {
      d = DOME_DEFS[i];
      // CylinderGeometry domes r=8 h=5
      domeGeo = new THREE.CylinderGeometry(8, 8, 5, 12);
      dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(d.x, 2.5, d.z);
      state.scene.add(dome);
      state.objects.push(dome);
      state.domeMeshes.push(dome);

      // Dome top cap (half sphere approximation with small cylinder)
      var capGeo = new THREE.CylinderGeometry(0.5, 8, 2, 12);
      makeMesh(capGeo, domeMat, d.x, 6, d.z);

      // PointLight inside each dome
      light = new THREE.PointLight(0x66AACC, 1.0, 25);
      light.position.set(d.x, 4, d.z);
      state.scene.add(light);
      state.domeLights.push(light);
    }

    // Tunnels connecting domes: 3x3x20 BoxGeometry
    // Connect dome 0<->1 (along X)
    buildTunnel(-30, 30, -30, -30);
    // Connect dome 1<->2 (along Z)
    buildTunnel(30, 30, -30, 30);
    // Connect dome 2<->3 (along X)
    buildTunnel(30, -30, 30, 30);
    // Connect dome 3<->0 (along Z)
    buildTunnel(-30, -30, -30, 30);
  }

  function buildTunnel(x1, x2, z1, z2) {
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x2a3a45 });
    var cx = (x1 + x2) / 2;
    var cz = (z1 + z2) / 2;
    var dx = x2 - x1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dz * dz);
    var tunnel = new THREE.Mesh(
      new THREE.BoxGeometry(dz === 0 ? length : 3, 3, dz === 0 ? 3 : length),
      tunnelMat
    );
    tunnel.position.set(cx, 1.5, cz);
    state.scene.add(tunnel);
    state.objects.push(tunnel);
    state.tunnelMeshes.push(tunnel);
  }

  // ── outdoor props ─────────────────────────────────────────────────────────

  function buildOutdoorProps() {
    // Rover (placeholder mesh — real rover built in buildRover)
    // Antenna
    var antennaMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 10, 6), antennaMat, 0, 5, -60);
    // Antenna dish (cone tip)
    makeMesh(new THREE.ConeGeometry(1.5, 2, 8), antennaMat, 0, 11, -60);

    // Additional antenna cluster
    makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 7, 5), antennaMat, 5, 3.5, -62);
    makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 5), antennaMat, -5, 2.5, -62);

    // Some supply crates outside
    var crateMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
    makeMesh(new THREE.BoxGeometry(2, 1.5, 2), crateMat, 15, 0.75, -15);
    makeMesh(new THREE.BoxGeometry(2, 1.5, 2), crateMat, 17, 0.75, -15);
    makeMesh(new THREE.BoxGeometry(2, 1.5, 2), crateMat, 15, 0.75, -13);
  }

  // ── solar panels ──────────────────────────────────────────────────────────

  function buildSolarPanels() {
    var panelMat = new THREE.MeshLambertMaterial({ color: 0x224455 });
    var poleMat  = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var i, pos, panel, panelInfo;

    for (i = 0; i < SOLAR_PANEL_POSITIONS.length; i++) {
      pos = SOLAR_PANEL_POSITIONS[i];
      // Pole
      makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 5), poleMat, pos.x, 1.5, pos.z);
      // Panel face (flat box)
      panel = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.15, 2.5),
        panelMat
      );
      panel.position.set(pos.x, 3.2, pos.z);
      state.scene.add(panel);
      state.objects.push(panel);

      panelInfo = {
        mesh: panel,
        hp: 100,
        x: pos.x,
        z: pos.z,
        shielded: false,
        coverMesh: null
      };
      state.solarPanels.push(panelInfo);
    }
  }

  // ── storm covers ──────────────────────────────────────────────────────────

  function buildStormCovers() {
    var coverMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var i, cover;
    // 4 covers stored near the main entrance
    for (i = 0; i < 4; i++) {
      cover = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.3, 3),
        coverMat
      );
      cover.position.set(-10 + i * 3, 0.5, -10);
      state.scene.add(cover);
      state.objects.push(cover);
      state.stormCovers.push({ mesh: cover, placed: false, panelIndex: -1 });
    }
  }

  // ── life support systems ──────────────────────────────────────────────────

  function buildLifeSupport() {
    var i, dome, sx, sz;
    var sysDefs = [
      { key: 'o2',      color: 0x224466, emissive: false },
      { key: 'water',   color: 0x224455, emissive: false },
      { key: 'power',   color: 0x00AAFF, emissive: true  },
      { key: 'airlock', color: 0x334455, emissive: false }
    ];

    for (i = 0; i < sysDefs.length; i++) {
      dome = DOME_DEFS[i];
      sx = dome.x;
      sz = dome.z;
      buildOneSystem(sysDefs[i].key, sysDefs[i].color, sysDefs[i].emissive, sx, sz);
    }
  }

  function buildOneSystem(key, color, emissive, sx, sz) {
    var mat, geo, mesh;
    if (emissive) {
      mat = new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 });
    } else {
      mat = new THREE.MeshLambertMaterial({ color: color });
    }

    if (key === 'o2') {
      // CylinderGeometry r=1.5 h=3
      geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, 1.5, sz);
    } else if (key === 'water') {
      // BoxGeometry 3x2x3
      geo = new THREE.BoxGeometry(3, 2, 3);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, 1, sz);
    } else if (key === 'power') {
      // SphereGeometry r=2
      geo = new THREE.SphereGeometry(2, 10, 8);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, 2, sz);
    } else {
      // airlock: BoxGeometry 4x3x2
      geo = new THREE.BoxGeometry(4, 3, 2);
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(sx, 1.5, sz);
    }

    state.scene.add(mesh);
    state.objects.push(mesh);
    state.systems[key].mesh = mesh;

    // Small indicator light on each system
    var sysLight = new THREE.PointLight(color, 0.8, 8);
    sysLight.position.copy(mesh.position);
    sysLight.position.y += 3;
    state.scene.add(sysLight);
    state.systems[key].light = sysLight;
  }

  // ── rover ─────────────────────────────────────────────────────────────────

  function buildRover() {
    var roverBodyMat  = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var roverWheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    // Body
    var roverBody = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 2.5), roverBodyMat);
    roverBody.position.set(20, 0.8, -5);
    state.scene.add(roverBody);
    state.objects.push(roverBody);
    state.roverMesh = roverBody;

    // Wheels
    var wheelOffsets = [
      { x: -1.7, z: -1.3 }, { x: 1.7, z: -1.3 },
      { x: -1.7, z:  1.3 }, { x: 1.7, z:  1.3 }
    ];
    var i, wo, wheel;
    for (i = 0; i < wheelOffsets.length; i++) {
      wo = wheelOffsets[i];
      wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8), roverWheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(roverBody.position.x + wo.x, 0.5, roverBody.position.z + wo.z);
      state.scene.add(wheel);
      state.objects.push(wheel);
    }

    // Cab
    makeMesh(new THREE.BoxGeometry(2, 0.8, 2), roverBodyMat,
      roverBody.position.x, roverBody.position.y + 1, roverBody.position.z);
  }

  // ── rebel AI ──────────────────────────────────────────────────────────────

  function buildRebels() {
    var i;
    // Rebel colonists
    for (i = 0; i < REBEL_COLONIST_COUNT; i++) {
      spawnRebelColonist();
    }
    // Rebel engineers
    for (i = 0; i < REBEL_ENGINEER_COUNT; i++) {
      spawnRebelEngineer();
    }
    // Rebel leader
    spawnRebelLeader();
  }

  function spawnRebelColonist() {
    var rebel = createRebelBase(0x552211, 1, 1, 1, REBEL_COLONIST_HP, 'colonist');
    placeRebelOutside(rebel);
    state.rebels.push(rebel);
  }

  function spawnRebelEngineer() {
    var rebel = createRebelBase(0x442211, 1.2, 1, 1.2, REBEL_ENGINEER_HP, 'engineer');
    placeRebelOutside(rebel);
    state.rebels.push(rebel);
  }

  function spawnRebelLeader() {
    var leader = createRebelBase(0x330000, 1.4, 1.8, 1.4, REBEL_LEADER_HP, 'leader');
    leader.mesh.position.set(60, 1, 60);
    state.scene.add(leader.mesh);
    state.objects.push(leader.mesh);
    state.rebelLeader = leader;
    state.rebels.push(leader);
  }

  function createRebelBase(color, sx, sy, sz, hp, type) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var geo = new THREE.BoxGeometry(sx, sy, sz);
    var mesh = new THREE.Mesh(geo, mat);
    return {
      mesh: mesh,
      hp: hp,
      maxHp: hp,
      type: type,
      alive: true,
      targetSystem: null,
      attackCooldown: 0,
      speed: type === 'leader' ? 4 : (type === 'engineer' ? 3 : 3.5),
      stateAI: 'patrol', // patrol | attack | sabotage
      patrolAngle: Math.random() * Math.PI * 2,
      patrolRadius: 25 + Math.random() * 20,
      patrolCenter: { x: 0, z: 0 }
    };
  }

  function placeRebelOutside(rebel) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 55 + Math.random() * 20;
    rebel.mesh.position.set(Math.cos(angle) * radius, 1, Math.sin(angle) * radius);
    state.scene.add(rebel.mesh);
    state.objects.push(rebel.mesh);
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    var hud = document.createElement('div');
    hud.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'background:rgba(0,0,0,0.7)',
      'color:#FF9944',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 10px',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    var msg = document.createElement('div');
    msg.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FF6622',
      'font-family:monospace',
      'font-size:22px',
      'font-weight:bold',
      'z-index:9999',
      'pointer-events:none',
      'text-align:center',
      'text-shadow:0 0 8px #FF4400'
    ].join(';');
    document.body.appendChild(msg);
    state.msgEl = msg;

    // Crosshair
    var cross = document.createElement('div');
    cross.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:16px',
      'height:16px',
      'margin:-8px 0 0 -8px',
      'border:2px solid rgba(255,200,100,0.8)',
      'border-radius:50%',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(cross);
    state.crosshairEl = cross;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var sys = state.systems;
    var stormStr = state.stormActive ? Math.ceil(state.stormRemaining) + 's' : 'CLEAR';
    var rebelCount = 0;
    var i;
    for (i = 0; i < state.rebels.length; i++) {
      if (state.rebels[i].alive) rebelCount++;
    }
    var timeLeft = Math.max(0, Math.ceil(WIN_TIME - state.gameTime));
    state.hudEl.textContent =
      'MARS COLONY ' +
      '[O2: ' + Math.max(0, Math.ceil(sys.o2.hp)) + ' HP] ' +
      '[WATER: ' + Math.max(0, Math.ceil(sys.water.hp)) + ' HP] ' +
      '[POWER: ' + Math.max(0, Math.ceil(sys.power.hp)) + ' HP] ' +
      '[AIRLOCK: ' + Math.max(0, Math.ceil(sys.airlock.hp)) + ' HP] ' +
      '[REBELS: ' + rebelCount + '] | ' +
      'STORM: ' + stormStr + ' ' +
      'COLONISTS: ' + state.colonistsAlive + ' ' +
      'PLAYER HP: ' + Math.ceil(state.playerHP) + ' ' +
      'TIME: ' + Math.floor(timeLeft / 60) + ':' + ('0' + (timeLeft % 60)).slice(-2);
  }

  function showMessage(txt, duration) {
    if (!state.msgEl) return;
    state.msgEl.textContent = txt;
    state.msgTimer = duration || 3;
  }

  // ── interact ──────────────────────────────────────────────────────────────

  function handleInteract() {
    // Board / exit rover
    var roverDist = distToRover();
    if (!state.inRover && roverDist < 5) {
      state.inRover = true;
      showMessage('BOARDING ROVER - WASD to drive, E to exit', 3);
      return;
    }
    if (state.inRover) {
      state.inRover = false;
      showMessage('EXITED ROVER', 2);
      return;
    }

    // Pick up / place storm cover
    if (!state.carryingCover) {
      var ci = nearestCover();
      if (ci >= 0) {
        state.carryingCover = true;
        state.carryCoverMesh = state.stormCovers[ci];
        state.stormCovers[ci].carried = true;
        showMessage('CARRYING STORM COVER - walk to solar panel, E to place', 3);
        return;
      }
    } else {
      // Place on nearest solar panel
      var pi = nearestUnshieldedPanel();
      if (pi >= 0) {
        placeCoverOnPanel(pi);
        showMessage('STORM COVER PLACED', 2);
      } else {
        // Drop
        state.carryingCover = false;
        if (state.carryCoverMesh) { state.carryCoverMesh.carried = false; }
        state.carryCoverMesh = null;
      }
      return;
    }

    // Repair: start hold — actual repair done in update loop
    state.repairHeld = true;
    state.repairTarget = nearestDamagedSystem();
    if (state.repairTarget) {
      showMessage('HOLD E to repair ' + state.repairTarget.toUpperCase() + '...', 4);
    }
  }

  function distToRover() {
    if (!state.roverMesh) return 999;
    var rm = state.roverMesh.position;
    var dx = state.playerPos.x - rm.x;
    var dz = state.playerPos.z - rm.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function nearestCover() {
    var i, cover, dx, dz, dist;
    var best = -1, bestDist = 4;
    for (i = 0; i < state.stormCovers.length; i++) {
      cover = state.stormCovers[i];
      if (cover.placed || cover.carried) continue;
      dx = state.playerPos.x - cover.mesh.position.x;
      dz = state.playerPos.z - cover.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  }

  function nearestUnshieldedPanel() {
    var i, panel, dx, dz, dist;
    var best = -1, bestDist = 5;
    for (i = 0; i < state.solarPanels.length; i++) {
      panel = state.solarPanels[i];
      if (panel.shielded) continue;
      dx = state.playerPos.x - panel.x;
      dz = state.playerPos.z - panel.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  }

  function placeCoverOnPanel(pi) {
    var panel = state.solarPanels[pi];
    var cover = state.carryCoverMesh;
    cover.placed = true;
    cover.panelIndex = pi;
    cover.mesh.position.set(panel.x, 3.4, panel.z);
    panel.shielded = true;
    panel.coverMesh = cover.mesh;
    state.carryingCover = false;
    state.carryCoverMesh = null;
  }

  function nearestDamagedSystem() {
    var keys = ['o2', 'water', 'power', 'airlock'];
    var i, key, sys, dome, dx, dz, dist;
    var best = null, bestDist = 6;
    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      sys = state.systems[key];
      if (sys.hp >= sys.max) continue;
      dome = DOME_DEFS[sys.domeIndex];
      dx = state.playerPos.x - dome.x;
      dz = state.playerPos.z - dome.z;
      dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; best = key; }
    }
    return best;
  }

  // ── shoot / bullets ───────────────────────────────────────────────────────

  function tryShoot() {
    if (state.shootCooldown > 0) return;
    state.shootCooldown = 0.25;

    var yaw   = state.playerYaw;
    var pitch = state.playerPitch;
    var dx = -Math.sin(yaw) * Math.cos(pitch);
    var dy = Math.sin(pitch);
    var dz = -Math.cos(yaw) * Math.cos(pitch);

    var bMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0xFFCC00 });
    var bGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.scene.add(bMesh);

    state.bullets.push({
      mesh: bMesh,
      vx: dx * 50,
      vy: dy * 50,
      vz: dz * 50,
      life: 2.0
    });
  }

  function updateBullets(dt) {
    var i, b, rebel, dx, dy, dz, dist;
    for (i = state.bullets.length - 1; i >= 0; i--) {
      b = state.bullets[i];
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.life -= dt;

      if (b.life <= 0 || b.mesh.position.y < -1) {
        state.scene.remove(b.mesh);
        state.bullets.splice(i, 1);
        continue;
      }

      // Hit rebels
      for (var j = 0; j < state.rebels.length; j++) {
        rebel = state.rebels[j];
        if (!rebel.alive) continue;
        dx = b.mesh.position.x - rebel.mesh.position.x;
        dy = b.mesh.position.y - rebel.mesh.position.y;
        dz = b.mesh.position.z - rebel.mesh.position.z;
        dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1.2) {
          rebel.hp -= 30;
          if (rebel.hp <= 0) { killRebel(rebel); }
          state.scene.remove(b.mesh);
          state.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  function killRebel(rebel) {
    rebel.alive = false;
    state.scene.remove(rebel.mesh);
  }

  // ── rebel AI update ───────────────────────────────────────────────────────

  function updateRebels(dt) {
    var i, rebel, tx, tz, dx, dz, dist, speed, sys, domePos;
    var waterSpeed = state.systems.water.hp <= 0 ? 1.2 : 1.0;

    for (i = 0; i < state.rebels.length; i++) {
      rebel = state.rebels[i];
      if (!rebel.alive) continue;

      speed = rebel.speed * waterSpeed;

      if (state.stormActive) { speed *= 1.0; } // rebels unaffected by storm speed

      // Choose target system (nearest or assigned by leader)
      if (!rebel.targetSystem || state.systems[rebel.targetSystem].hp <= 0) {
        rebel.targetSystem = chooseRebelTarget();
      }

      domePos = DOME_DEFS[state.systems[rebel.targetSystem].domeIndex];
      tx = domePos.x;
      tz = domePos.z;

      dx = tx - rebel.mesh.position.x;
      dz = tz - rebel.mesh.position.z;
      dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2) {
        rebel.mesh.position.x += (dx / dist) * speed * dt;
        rebel.mesh.position.z += (dz / dist) * speed * dt;
        rebel.mesh.position.y = 1;
      }

      // Sabotage / attack when close enough
      if (dist < 4) {
        rebel.attackCooldown -= dt;
        if (rebel.type === 'engineer' && dist < 2) {
          // Passive sabotage: damage dealt per second
          state.systems[rebel.targetSystem].hp -= REBEL_ENGINEER_SABOTAGE_DPS * dt;
        } else if (rebel.type === 'colonist' || rebel.type === 'leader') {
          if (rebel.attackCooldown <= 0) {
            state.systems[rebel.targetSystem].hp -= REBEL_COLONIST_DMG * dt * 0.5;
            rebel.attackCooldown = 1.0;
          }
        }
        // Cap at 0
        if (state.systems[rebel.targetSystem].hp < 0) {
          state.systems[rebel.targetSystem].hp = 0;
        }
      }

      // Rebel leader: attack player if nearby
      if (rebel.type === 'leader') {
        var pdx = state.playerPos.x - rebel.mesh.position.x;
        var pdz = state.playerPos.z - rebel.mesh.position.z;
        var pdist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pdist < 6) {
          rebel.attackCooldown -= dt;
          if (rebel.attackCooldown <= 0) {
            state.playerHP -= 25;
            rebel.attackCooldown = 2.0;
            showMessage('LEADER ATTACKS YOU!', 1.5);
          }
        }
      }

      // Rover kill
      if (state.inRover && state.roverMesh) {
        var rv = state.roverMesh.position;
        var rdx = rebel.mesh.position.x - rv.x;
        var rdz = rebel.mesh.position.z - rv.z;
        var rdist = Math.sqrt(rdx * rdx + rdz * rdz);
        if (rdist < 3) {
          killRebel(rebel);
        }
      }
    }
  }

  function chooseRebelTarget() {
    var keys = ['o2', 'water', 'power', 'airlock'];
    var alive = [];
    var i;
    for (i = 0; i < keys.length; i++) {
      if (state.systems[keys[i]].hp > 0) { alive.push(keys[i]); }
    }
    if (alive.length === 0) return 'o2';
    return alive[Math.floor(Math.random() * alive.length)];
  }

  // ── wave system ───────────────────────────────────────────────────────────

  function updateWaves(dt) {
    state.waveTimer -= dt;
    if (state.waveTimer <= 0) {
      state.waveTimer = REBEL_WAVE_INTERVAL;
      spawnWave();
    }

    // Airlock breach: if airlock fails, rebels spawn every minute
    if (state.systems.airlock.hp <= 0) {
      state.airlockBreachTimer -= dt;
      if (state.airlockBreachTimer <= 0) {
        state.airlockBreachTimer = 60;
        spawnRebelColonist();
        spawnRebelColonist();
        showMessage('AIRLOCK BREACH: REBELS ENTERING!', 3);
      }
    }
  }

  function spawnWave() {
    var i;
    var count = 3 + Math.floor(state.gameTime / 180);
    for (i = 0; i < count; i++) {
      spawnRebelColonist();
    }
    if (state.rebelLeader && state.rebelLeader.alive) {
      showMessage('REBEL LEADER SENDS A NEW WAVE!', 3);
    } else {
      showMessage('REBEL WAVE INCOMING!', 3);
    }
  }

  // ── dust storm ────────────────────────────────────────────────────────────

  function updateStorm(dt) {
    if (!state.stormActive) {
      state.stormTimer -= dt;
      if (state.stormTimer <= 0) {
        startStorm();
      }
    } else {
      state.stormRemaining -= dt;
      if (state.stormRemaining <= 0) {
        endStorm();
      }

      // Outdoor systems / solar panels take damage
      var i, panel;
      for (i = 0; i < state.solarPanels.length; i++) {
        panel = state.solarPanels[i];
        if (!panel.shielded) {
          panel.hp -= 10 * dt;
          if (panel.hp < 0) { panel.hp = 0; }
        }
      }

      // Rover damage in storm
      if (state.inRover) {
        state.playerHP -= 5 * dt;
      }
    }
  }

  function startStorm() {
    state.stormActive = true;
    state.stormRemaining = STORM_DURATION;
    state.stormTimer = STORM_INTERVAL;
    if (state.scene) {
      state.scene.background = new THREE.Color(0x663300);
      state.scene.fog = new THREE.FogExp2(0x663300, 0.1);
    }
    showMessage('DUST STORM INCOMING! Seek shelter!', 4);
  }

  function endStorm() {
    state.stormActive = false;
    if (state.scene) {
      state.scene.background = new THREE.Color(0x441100);
      state.scene.fog = new THREE.FogExp2(0x551100, 0.02);
    }
    showMessage('Storm passed.', 3);
  }

  // ── systems failure cascades ──────────────────────────────────────────────

  function updateSystemCascades(dt) {
    var sys = state.systems;

    // O2 fails: player loses HP
    if (sys.o2.hp <= 0) {
      state.playerHP -= 5 * dt;
    }

    // Water fails: colonists die slowly, penalty
    if (sys.water.hp <= 0) {
      state.colonistsAlive = Math.max(0, state.colonistsAlive - 0.5 * dt);
    }

    // Power fails: dim lights
    if (sys.power.hp <= 0) {
      var i;
      for (i = 0; i < state.domeLights.length; i++) {
        state.domeLights[i].intensity = 0.1;
      }
    } else {
      var j;
      for (j = 0; j < state.domeLights.length; j++) {
        state.domeLights[j].intensity = 1.0;
      }
    }

    // Indicator lights dim when system dead
    var keys = ['o2', 'water', 'power', 'airlock'];
    var k, s;
    for (k = 0; k < keys.length; k++) {
      s = sys[keys[k]];
      if (s.light) {
        s.light.intensity = s.hp > 0 ? 0.8 : 0;
      }
    }
  }

  // ── repair logic ──────────────────────────────────────────────────────────

  function updateRepair(dt) {
    if (!state.repairHeld || !state.repairTarget) {
      state.repairHoldTime = 0;
      return;
    }

    var sys = state.systems[state.repairTarget];
    if (!sys) { state.repairHeld = false; return; }

    var dome = DOME_DEFS[sys.domeIndex];
    var dx = state.playerPos.x - dome.x;
    var dz = state.playerPos.z - dome.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 7) {
      // Moved away
      state.repairHeld = false;
      state.repairHoldTime = 0;
      return;
    }

    state.repairHoldTime += dt;
    if (state.repairHoldTime >= 4.0) {
      sys.hp = Math.min(sys.max, sys.hp + 50);
      state.repairHoldTime = 0;
      showMessage(state.repairTarget.toUpperCase() + ' REPAIRED (+50 HP)', 2);
    }
  }

  // ── player movement ───────────────────────────────────────────────────────

  function updatePlayer(dt) {
    // Mouse look
    var sensitivity = 0.002;
    state.playerYaw   -= state.mouseDX * sensitivity;
    state.playerPitch -= state.mouseDY * sensitivity;
    state.playerPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.playerPitch));
    state.mouseDX = 0;
    state.mouseDY = 0;

    // Shoot
    if (state.shooting && !state.inRover) { tryShoot(); }
    if (state.shootCooldown > 0) { state.shootCooldown -= dt; }

    if (state.inRover) {
      updateRoverDrive(dt);
      return;
    }

    var speed = PLAYER_SPEED;
    if (state.stormActive) { speed *= 0.7; }

    var yaw = state.playerYaw;
    var mx = 0, mz = 0;

    // WASD
    if (state.keysDown[87]) { mx -= Math.sin(yaw); mz -= Math.cos(yaw); } // W
    if (state.keysDown[83]) { mx += Math.sin(yaw); mz += Math.cos(yaw); } // S
    if (state.keysDown[65]) { mx -= Math.cos(yaw); mz += Math.sin(yaw); } // A
    if (state.keysDown[68]) { mx += Math.cos(yaw); mz -= Math.sin(yaw); } // D

    var mlen = Math.sqrt(mx * mx + mz * mz);
    if (mlen > 0) {
      mx /= mlen; mz /= mlen;
      state.playerPos.x += mx * speed * dt;
      state.playerPos.z += mz * speed * dt;
    }

    // Jump
    if (state.keysDown[32] && state.onGround) {
      state.playerVel.y = JUMP_FORCE;
      state.onGround = false;
    }

    // Gravity
    state.playerVel.y += GRAVITY * dt;
    state.playerPos.y += state.playerVel.y * dt;

    // Ground clamp
    if (state.playerPos.y <= PLAYER_HEIGHT) {
      state.playerPos.y = PLAYER_HEIGHT;
      state.playerVel.y = 0;
      state.onGround = true;
    }

    // Position camera
    state.camera.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    // Storm cover follows player when carried
    if (state.carryingCover && state.carryCoverMesh) {
      state.carryCoverMesh.mesh.position.set(
        state.playerPos.x + Math.sin(state.playerYaw) * -1.5,
        state.playerPos.y,
        state.playerPos.z + Math.cos(state.playerYaw) * -1.5
      );
    }
  }

  function updateRoverDrive(dt) {
    if (!state.roverMesh) return;
    var speed = 14;
    var yaw = state.playerYaw;
    var mx = 0, mz = 0;

    if (state.keysDown[87]) { mx -= Math.sin(yaw); mz -= Math.cos(yaw); }
    if (state.keysDown[83]) { mx += Math.sin(yaw); mz += Math.cos(yaw); }
    if (state.keysDown[65]) { yaw -= 1.5 * dt; state.playerYaw = yaw; }
    if (state.keysDown[68]) { yaw += 1.5 * dt; state.playerYaw = yaw; }

    var mlen = Math.sqrt(mx * mx + mz * mz);
    if (mlen > 0) {
      mx /= mlen; mz /= mlen;
      state.roverMesh.position.x += mx * speed * dt;
      state.roverMesh.position.z += mz * speed * dt;
    }

    // Player rides rover
    state.playerPos.x = state.roverMesh.position.x;
    state.playerPos.z = state.roverMesh.position.z;
    state.playerPos.y = state.roverMesh.position.y + 2.0;

    state.camera.position.set(state.playerPos.x, state.playerPos.y + 0.5, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;
  }

  // ── win / lose ────────────────────────────────────────────────────────────

  function checkEndConditions() {
    // Lose: all 4 systems fail simultaneously
    var sys = state.systems;
    if (sys.o2.hp <= 0 && sys.water.hp <= 0 && sys.power.hp <= 0 && sys.airlock.hp <= 0) {
      state.gameOver = true;
      showMessage('ALL SYSTEMS FAILED - COLONY LOST - 200 COLONISTS DEAD', 99);
      return;
    }

    // Lose: player dies
    if (state.playerHP <= 0) {
      state.gameOver = true;
      showMessage('YOU HAVE DIED - COLONY UNDEFENDED', 99);
      return;
    }

    // Win: survive 15 minutes
    if (state.gameTime >= WIN_TIME) {
      state.gameWon = true;
      showMessage('RESUPPLY SHIP ARRIVED! COLONY SAVED! ' + Math.ceil(state.colonistsAlive) + ' COLONISTS SURVIVED!', 99);
    }
  }

  // ── power core pulse ──────────────────────────────────────────────────────

  function updatePowerPulse(dt) {
    var sys = state.systems.power;
    if (!sys.mesh || sys.hp <= 0) return;
    var t = state.gameTime;
    var mat = sys.mesh.material;
    var pulse = 0.4 + 0.4 * Math.sin(t * 3);
    mat.emissiveIntensity = pulse;
  }

  // ── main loop ─────────────────────────────────────────────────────────────

  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    if (dt > 0.1) { dt = 0.1; }
    if (dt <= 0) { return; }

    if (state.gameOver || state.gameWon) {
      if (state.renderer && state.scene && state.camera) {
        state.renderer.render(state.scene, state.camera);
      }
      return;
    }

    state.gameTime += dt;

    updatePlayer(dt);
    updateRebels(dt);
    updateWaves(dt);
    updateStorm(dt);
    updateSystemCascades(dt);
    updateRepair(dt);
    updateBullets(dt);
    updatePowerPulse(dt);
    checkEndConditions();
    updateHUD();

    // Message timer
    if (state.msgTimer > 0) {
      state.msgTimer -= dt;
      if (state.msgTimer <= 0 && state.msgEl) {
        state.msgEl.textContent = '';
      }
    }

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ── public API ────────────────────────────────────────────────────────────

  function update() {
    // Called externally if needed; game loop is self-contained
  }

  function reset() {
    destroy();
    init();
  }

  // ── activation listener (M+C) ─────────────────────────────────────────────

  document.addEventListener('keydown', function (e) {
    var k = e.keyCode;
    var now = Date.now();
    if (!window._mcKeys) { window._mcKeys = {}; window._mcTimes = {}; }
    if (!window._mcKeys[k]) { window._mcTimes[k] = now; }
    window._mcKeys[k] = true;

    if (k === ACTIVATION_KEY_C && window._mcKeys[ACTIVATION_KEY_M]) {
      if (now - (window._mcTimes[ACTIVATION_KEY_M] || 0) <= ACTIVATION_WINDOW) { init(); }
    }
    if (k === ACTIVATION_KEY_M && window._mcKeys[ACTIVATION_KEY_C]) {
      if (now - (window._mcTimes[ACTIVATION_KEY_C] || 0) <= ACTIVATION_WINDOW) { init(); }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (window._mcKeys) { window._mcKeys[e.keyCode] = false; }
  });

  return { init: init, update: update, reset: reset };

}());
