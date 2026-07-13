// cyber-espionage.js — Cyber Espionage FPS Module for OccupantKiller
// IIFE pattern: window.CyberEspionage
// Activation: C then E within 400ms
// All var, no let/const, pure browser JS, THREE global assumed

window.CyberEspionage = (function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  var ACTIVATION_WINDOW   = 400;       // ms for C->E sequence
  var FLOOR_HEIGHT        = 6;
  var SECTION_W           = 30;
  var SECTION_D           = 30;
  var GUARD_HP            = 90;
  var DIRECTOR_HP         = 350;
  var TRANQ_KNOCKDOWN     = 30;        // seconds knocked out
  var LASER_ALARM_ADD     = 25;        // % alarm per laser crossing
  var CAMERA_ALARM_ADD    = 30;        // % alarm per camera detection
  var HACK_DURATION       = 6.0;       // seconds to hack terminal
  var CAMERA_DISABLE_TIME = 120.0;     // seconds cameras disabled after hack
  var DISGUISE_DURATION   = 180.0;     // 3 minutes
  var DISGUISE_RADIUS_MUL = 0.5;
  var CAMERA_SWEEP        = 60;        // degrees total sweep
  var CAMERA_SPEED        = 0.8;       // rad/s
  var GUARD_SIGHT_RANGE   = 14;
  var GUARD_SIGHT_DISGUISED = 7;
  var LOCKDOWN_ESCAPE_TIME = 60;       // seconds to escape after lockdown
  var PLAYER_SPEED        = 8;
  var PLAYER_HP           = 100;
  var USB_LIGHT_COLOR     = 0x33AAFF;
  var ALARM_100_LOCKDOWN  = 100;

  // Colors
  var COL_GLASS           = 0x112233;
  var COL_FLOOR           = 0x111122;
  var COL_WALL            = 0x223344;
  var COL_GUARD           = 0x334433;
  var COL_DIRECTOR        = 0x443333;
  var COL_TERMINAL        = 0x005522;
  var COL_USB             = 0x33AAFF;
  var COL_DRIVE           = 0xFFAA00;
  var COL_LASER           = 0xFF0000;
  var COL_CAMERA_BODY     = 0x556677;
  var COL_UNIFORM         = 0x446644;

  // Section IDs
  var SEC_LOBBY       = 0;
  var SEC_SERVER      = 1;
  var SEC_RESEARCH    = 2;
  var SEC_DIRECTOR    = 3;
  var SEC_BUNKER      = 4;

  // ─── State ──────────────────────────────────────────────────────────────────

  var state = {
    active: false,
    // activation sequence
    cDown: false,
    cDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    playerMesh: null,
    playerPos: { x: 0, y: 1.8, z: 55 },
    playerYaw: 0,
    playerPitch: 0,
    playerHP: PLAYER_HP,
    moveKeys: {},
    pointerLocked: false,
    // mission
    alarmMeter: 0,
    lockdownActive: false,
    lockdownTimer: 0,
    missionFailed: false,
    missionWon: false,
    blueprintsCollected: 0,
    hasDrive: false,
    // keycard
    hasKeycard: false,
    // disguise
    disguiseActive: false,
    disguiseTimer: 0,
    // guards
    guards: [],
    guardCount: 0,
    // cameras
    cameras3d: [],
    camerasDisabledTimer: 0,
    camerasDisabled: false,
    // laser grids
    laserGrids: [],
    // hacking
    hackingTerminal: false,
    hackTimer: 0,
    hackTarget: null,
    hackType: null,
    // USB drives (blueprints)
    usbDrives: [],
    // encrypted drive
    encryptedDrive: null,
    encryptedDriveSecured: false,
    // director
    directorMesh: null,
    directorHP: DIRECTOR_HP,
    directorNeutralized: false,
    // doors (keycard locked)
    lockedDoors: [],
    // meshes
    buildingMeshes: [],
    // HUD
    hudEl: null,
    promptEl: null,
    endEl: null,
    // interaction
    interactKeyHeld: false,
    interactHoldTimer: 0,
    interactTarget: null,
    // uniforms to steal
    uniformPickups: [],
    // reinforcements
    reinforcements: [],
    // shooting
    shootCooldown: 0,
    // tranq gun (Q key)
    tranqCooldown: 0,
    // mouse look
    mouseDX: 0,
    mouseDY: 0,
    // clock lights (alarm blink)
    alarmLights: [],
    alarmBlinkTimer: 0
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) { params.transparent = opts.transparent; }
      if (opts.opacity !== undefined)     { params.opacity = opts.opacity; }
      if (opts.wireframe !== undefined)   { params.wireframe = opts.wireframe; }
      if (opts.emissive !== undefined)    { params.emissive = opts.emissive; }
      if (opts.emissiveIntensity !== undefined) { params.emissiveIntensity = opts.emissiveIntensity; }
    }
    return new THREE.MeshStandardMaterial(params);
  }

  function box(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function cyl(rt, rb, h, seg, color, opts) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, seg || 8);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function sphere(r, color, opts) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function cone(r, h, seg, color, opts) {
    var geo = new THREE.ConeGeometry(r, h, seg || 8);
    var mat = makeMat(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function clamp(v, mn, mx) {
    return v < mn ? mn : (v > mx ? mx : v);
  }

  function addAlarm(pct) {
    if (state.lockdownActive) { return; }
    state.alarmMeter = clamp(state.alarmMeter + pct, 0, 100);
    if (state.alarmMeter >= ALARM_100_LOCKDOWN) {
      triggerLockdown();
    }
  }

  function triggerLockdown() {
    if (state.lockdownActive) { return; }
    state.lockdownActive = true;
    state.lockdownTimer = LOCKDOWN_ESCAPE_TIME;
    // Seal locked doors
    sealAllDoors();
    // Spawn reinforcements
    spawnReinforcements();
  }

  function sealAllDoors() {
    var i;
    for (i = 0; i < state.lockedDoors.length; i++) {
      state.lockedDoors[i].mesh.material.color.setHex(0xFF0000);
    }
  }

  // ─── World Building ─────────────────────────────────────────────────────────

  function buildWorld() {
    var scene = state.scene;

    // Ambient light
    var ambient = new THREE.AmbientLight(0x223344, 0.7);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xAADDFF, 0.5);
    sun.position.set(20, 50, 10);
    scene.add(sun);

    // Ground plane
    var ground = box(200, 0.2, 200, 0x111118);
    ground.position.set(0, -0.1, 0);
    scene.add(ground);

    // Build exterior corporate towers
    buildExterior();

    // Build 5 sections
    buildLobby();
    buildServerFarm();
    buildResearchWing();
    buildDirectorSuite();
    buildBunker();

    // Security checkpoint
    buildCheckpoint();

    // Spawn guards
    spawnGuards();

    // Spawn cameras
    spawnCameras();

    // Spawn laser grids
    spawnLaserGrids();

    // Spawn collectibles
    spawnUSBDrives();
    spawnEncryptedDrive();

    // Player mesh (hidden capsule)
    var pm = box(0.6, 1.8, 0.6, 0x4488AA);
    pm.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    pm.visible = false;
    scene.add(pm);
    state.playerMesh = pm;

    // HUD
    buildHUD();
  }

  function buildExterior() {
    var scene = state.scene;
    // Two glass towers flanking the facility
    var towerL = box(12, 40, 12, COL_GLASS, { transparent: true, opacity: 0.6 });
    towerL.position.set(-25, 20, -40);
    scene.add(towerL);

    var towerR = box(12, 40, 12, COL_GLASS, { transparent: true, opacity: 0.6 });
    towerR.position.set(25, 20, -40);
    scene.add(towerR);

    var towerC = box(16, 32, 16, COL_GLASS, { transparent: true, opacity: 0.5 });
    towerC.position.set(0, 16, -50);
    scene.add(towerC);

    // Entrance plaza
    var plaza = box(40, 0.2, 20, 0x223344);
    plaza.position.set(0, 0.1, 40);
    scene.add(plaza);

    // Entrance sign
    var sign = box(10, 2, 0.3, 0x334455);
    sign.position.set(0, 4, 30);
    scene.add(sign);
  }

  function buildCheckpoint() {
    var scene = state.scene;
    // Guard booth
    var booth = box(3, 3, 2, 0x334455);
    booth.position.set(5, 1.5, 35);
    scene.add(booth);

    var boothR = box(3, 3, 2, 0x334455);
    boothR.position.set(-5, 1.5, 35);
    scene.add(boothR);

    // Barrier arms
    var armL = box(4, 0.2, 0.2, 0xFF3300);
    armL.position.set(8, 2.5, 35);
    scene.add(armL);

    var armR = box(4, 0.2, 0.2, 0xFF3300);
    armR.position.set(-8, 2.5, 35);
    scene.add(armR);

    // Checkpoint light
    var checkLight = new THREE.PointLight(0x00FF88, 0.8, 8);
    checkLight.position.set(0, 3, 35);
    scene.add(checkLight);
  }

  // Section Z offsets: lobby=30, server=0, research=-30, director=-60, bunker=-90
  function sectionZ(id) {
    return 30 - id * 30;
  }

  function buildSection(id, color, label) {
    var scene = state.scene;
    var z = sectionZ(id);
    // Floor
    var floor = box(SECTION_W, 0.3, SECTION_D, color);
    floor.position.set(0, 0.15, z);
    scene.add(floor);
    state.buildingMeshes.push(floor);
    // Walls
    var wallN = box(SECTION_W, FLOOR_HEIGHT, 0.4, COL_WALL);
    wallN.position.set(0, FLOOR_HEIGHT / 2, z - SECTION_D / 2);
    scene.add(wallN);
    var wallS = box(SECTION_W, FLOOR_HEIGHT, 0.4, COL_WALL);
    wallS.position.set(0, FLOOR_HEIGHT / 2, z + SECTION_D / 2);
    scene.add(wallS);
    var wallE = box(0.4, FLOOR_HEIGHT, SECTION_D, COL_WALL);
    wallE.position.set(SECTION_W / 2, FLOOR_HEIGHT / 2, z);
    scene.add(wallE);
    var wallW = box(0.4, FLOOR_HEIGHT, SECTION_D, COL_WALL);
    wallW.position.set(-SECTION_W / 2, FLOOR_HEIGHT / 2, z);
    scene.add(wallW);
    // Ceiling
    var ceil = box(SECTION_W, 0.3, SECTION_D, 0x111122);
    ceil.position.set(0, FLOOR_HEIGHT, z);
    scene.add(ceil);
    // Ceiling light
    var ceilLight = new THREE.PointLight(0x88AACC, 0.6, 25);
    ceilLight.position.set(0, FLOOR_HEIGHT - 0.5, z);
    scene.add(ceilLight);
    return z;
  }

  function buildLobby() {
    var z = buildSection(SEC_LOBBY, 0x1A2233, 'LOBBY');
    var scene = state.scene;
    // Reception desk
    var desk = box(8, 1.2, 2, 0x334466);
    desk.position.set(0, 0.6, z);
    scene.add(desk);
    // Decorative pillars
    var pillarL = cyl(0.4, 0.4, FLOOR_HEIGHT, 8, 0x445566);
    pillarL.position.set(-8, FLOOR_HEIGHT / 2, z + 5);
    scene.add(pillarL);
    var pillarR = cyl(0.4, 0.4, FLOOR_HEIGHT, 8, 0x445566);
    pillarR.position.set(8, FLOOR_HEIGHT / 2, z + 5);
    scene.add(pillarR);
    // Hacking terminal at lobby
    buildTerminal(-10, z - 5, 'cameras');
    // Door to server farm (doorway in north wall, no lockout)
    var doorFrame = box(3, 4, 0.5, 0x223355);
    doorFrame.position.set(0, 2, z - SECTION_D / 2);
    scene.add(doorFrame);
  }

  function buildServerFarm() {
    var z = buildSection(SEC_SERVER, 0x0A1A0A, 'SERVER FARM');
    var scene = state.scene;
    // Server racks
    var i;
    for (i = 0; i < 6; i++) {
      var rack = box(1.5, 4, 3, 0x112211);
      rack.position.set(-9 + i * 4, 2, z + 5);
      scene.add(rack);
      // Blinking lights on rack
      var rlight = new THREE.PointLight(0x00FF44, 0.3, 4);
      rlight.position.set(-9 + i * 4, 3, z + 4);
      scene.add(rlight);
    }
    // Hacking terminal
    buildTerminal(9, z, 'keycards');
    buildTerminal(-9, z, 'guards');
    // Keycard door to research wing
    buildKeycardDoor(0, z - SECTION_D / 2 + 0.3);
  }

  function buildResearchWing() {
    var z = buildSection(SEC_RESEARCH, 0x0A0A1A, 'RESEARCH WING');
    var scene = state.scene;
    // Research tables
    var t1 = box(6, 1, 3, 0x223355);
    t1.position.set(-7, 0.5, z + 5);
    scene.add(t1);
    var t2 = box(6, 1, 3, 0x223355);
    t2.position.set(7, 0.5, z + 5);
    scene.add(t2);
    // Central column
    var col = box(2, FLOOR_HEIGHT, 2, 0x334466);
    col.position.set(0, FLOOR_HEIGHT / 2, z);
    scene.add(col);
    // Hacking terminal
    buildTerminal(11, z + 8, 'cameras');
    // Door to director suite (keycard)
    buildKeycardDoor(0, z - SECTION_D / 2 + 0.3);
  }

  function buildDirectorSuite() {
    var z = buildSection(SEC_DIRECTOR, 0x1A0A0A, "DIRECTOR'S SUITE");
    var scene = state.scene;
    // Director's desk
    var desk = box(5, 1, 3, 0x664433);
    desk.position.set(0, 0.5, z + 5);
    scene.add(desk);
    // Director's chair
    var chair = box(1.5, 2, 1.5, 0x443322);
    chair.position.set(0, 1, z + 7);
    scene.add(chair);
    // Bookshelf
    var shelf = box(2, 4, 1, 0x553322);
    shelf.position.set(-12, 2, z + 5);
    scene.add(shelf);
    // Encrypted drive on desk
    spawnEncryptedDriveAt(0, 1.3, z + 5);
    // Director NPC
    spawnDirector(0, 0, z + 7);
    // Hacking terminal
    buildTerminal(12, z - 5, 'cameras');
    // Door to bunker (director's keycard)
    buildKeycardDoor(0, z - SECTION_D / 2 + 0.3);
  }

  function buildBunker() {
    var z = buildSection(SEC_BUNKER, 0x0A0A0A, 'EMERGENCY BUNKER');
    var scene = state.scene;
    // Hardened walls (extra thickness visual)
    var hw1 = box(SECTION_W, 0.5, 0.8, 0x334444);
    hw1.position.set(0, 0.25, z - SECTION_D / 2 + 1);
    scene.add(hw1);
    // Emergency equipment
    var genBox = box(3, 2, 2, 0x555555);
    genBox.position.set(-10, 1, z - 8);
    scene.add(genBox);
    // Red emergency light
    var elight = new THREE.PointLight(0xFF2200, 0.8, 20);
    elight.position.set(0, 5, z);
    scene.add(elight);
    state.alarmLights.push(elight);
    // Hacking terminal in bunker
    buildTerminal(10, z - 8, 'cameras');
    // Extraction zone marker (glowing floor)
    var exZone = box(6, 0.1, 6, 0x00FF44, { emissive: 0x00FF44, emissiveIntensity: 0.3 });
    exZone.position.set(0, 0.05, z + 10);
    exZone.userData.isExtraction = true;
    scene.add(exZone);
  }

  function buildTerminal(x, z, hackType) {
    var scene = state.scene;
    var base = box(0.8, 1.4, 0.6, 0x112211);
    base.position.set(x, 0.7, z);
    scene.add(base);
    var screen = box(0.75, 0.5, 0.08, COL_TERMINAL, { emissive: 0x00AA44, emissiveIntensity: 0.5 });
    screen.position.set(x, 1.2, z - 0.25);
    scene.add(screen);
    var tLight = new THREE.PointLight(0x00FF88, 0.4, 5);
    tLight.position.set(x, 1.5, z);
    scene.add(tLight);
    var termObj = {
      mesh: base,
      screenMesh: screen,
      hackType: hackType,
      hacked: false,
      x: x,
      z: z
    };
    base.userData.terminal = termObj;
    // store reference
    if (!state.terminals) { state.terminals = []; }
    state.terminals.push(termObj);
  }

  function buildKeycardDoor(x, z) {
    var scene = state.scene;
    var door = box(3, 4, 0.5, 0x441122);
    door.position.set(x, 2, z);
    scene.add(door);
    var dLight = new THREE.PointLight(0xFF0044, 0.5, 4);
    dLight.position.set(x, 3, z);
    scene.add(dLight);
    var doorObj = { mesh: door, light: dLight, x: x, z: z, unlocked: false };
    state.lockedDoors.push(doorObj);
  }

  // ─── Guards ──────────────────────────────────────────────────────────────────

  function spawnGuards() {
    var scene = state.scene;
    var positions = [
      // Lobby guards (2)
      { x: -8, z: sectionZ(SEC_LOBBY) + 8 },
      { x:  8, z: sectionZ(SEC_LOBBY) + 8 },
      // Server farm guards (3)
      { x: -5, z: sectionZ(SEC_SERVER) + 8 },
      { x:  5, z: sectionZ(SEC_SERVER) + 8 },
      { x:  0, z: sectionZ(SEC_SERVER) - 5 },
      // Research wing guards (3)
      { x: -8, z: sectionZ(SEC_RESEARCH) + 8 },
      { x:  8, z: sectionZ(SEC_RESEARCH) + 8 },
      { x:  0, z: sectionZ(SEC_RESEARCH) - 5 },
      // Director suite guards (4)
      { x: -5, z: sectionZ(SEC_DIRECTOR) + 8 },
      { x:  5, z: sectionZ(SEC_DIRECTOR) + 8 },
      { x: -5, z: sectionZ(SEC_DIRECTOR) - 5 },
      { x:  5, z: sectionZ(SEC_DIRECTOR) - 5 },
      // Bunker guards (3)
      { x: -8, z: sectionZ(SEC_BUNKER) + 5 },
      { x:  8, z: sectionZ(SEC_BUNKER) + 5 },
      { x:  0, z: sectionZ(SEC_BUNKER) - 5 }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var p = positions[i];
      var guardBody = box(0.8, 1.8, 0.5, COL_GUARD);
      guardBody.position.set(p.x, 0.9, p.z);
      scene.add(guardBody);
      var guardHead = sphere(0.3, 0xBBAA88);
      guardHead.position.set(p.x, 2.1, p.z);
      scene.add(guardHead);
      var gObj = {
        body: guardBody,
        head: guardHead,
        hp: GUARD_HP,
        x: p.x,
        z: p.z,
        originX: p.x,
        originZ: p.z,
        yaw: 0,
        patrolDir: 1,
        patrolTimer: 0,
        knockedOut: false,
        knockoutTimer: 0,
        alertTimer: 0,
        uniformTaken: false,
        uniformPickup: null,
        dead: false
      };
      state.guards.push(gObj);
    }
    state.guardCount = state.guards.length;
  }

  function spawnDirector(x, y, z) {
    var scene = state.scene;
    var body = box(0.9, 2, 0.6, COL_DIRECTOR);
    body.position.set(x, 1, z);
    scene.add(body);
    var head = sphere(0.35, 0xBBAA99);
    head.position.set(x, 2.2, z);
    scene.add(head);
    state.directorMesh = body;
    state.directorHead = head;
    state.directorX = x;
    state.directorZ = z;
    state.directorPatrolDir = 1;
  }

  function spawnReinforcements() {
    var scene = state.scene;
    var i;
    for (i = 0; i < 4; i++) {
      var rx = (i % 2 === 0 ? -1 : 1) * 5;
      var rz = sectionZ(SEC_LOBBY) + 12 + i * 2;
      var rBody = box(0.8, 1.8, 0.5, 0x553322);
      rBody.position.set(rx, 0.9, rz);
      scene.add(rBody);
      var rHead = sphere(0.3, 0x996655);
      rHead.position.set(rx, 2.1, rz);
      scene.add(rHead);
      var rObj = {
        body: rBody,
        head: rHead,
        hp: GUARD_HP,
        x: rx,
        z: rz,
        originX: rx,
        originZ: rz,
        yaw: 0,
        patrolDir: 1,
        patrolTimer: 0,
        knockedOut: false,
        knockoutTimer: 0,
        alertTimer: 0,
        uniformTaken: false,
        uniformPickup: null,
        dead: false
      };
      state.reinforcements.push(rObj);
      state.guards.push(rObj);
    }
  }

  // ─── Cameras ─────────────────────────────────────────────────────────────────

  function spawnCameras() {
    var scene = state.scene;
    var positions = [
      { x: -10, z: sectionZ(SEC_LOBBY), wallZ: true },
      { x:  10, z: sectionZ(SEC_LOBBY), wallZ: false },
      { x: -10, z: sectionZ(SEC_SERVER), wallZ: true },
      { x:  10, z: sectionZ(SEC_SERVER), wallZ: false },
      { x:   0, z: sectionZ(SEC_RESEARCH) + 10, wallZ: true },
      { x: -10, z: sectionZ(SEC_DIRECTOR), wallZ: true },
      { x:  10, z: sectionZ(SEC_DIRECTOR), wallZ: false }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var p = positions[i];
      // Mount on ceiling
      var camBody = cyl(0.25, 0.2, 0.6, 8, COL_CAMERA_BODY);
      camBody.rotation.x = Math.PI / 2;
      camBody.position.set(p.x, FLOOR_HEIGHT - 0.3, p.z);
      scene.add(camBody);
      var lens = sphere(0.15, 0x111111);
      lens.position.set(p.x, FLOOR_HEIGHT - 0.5, p.z - 0.3);
      scene.add(lens);
      var cLight = new THREE.PointLight(COL_LASER, 0.4, 6);
      cLight.position.set(p.x, FLOOR_HEIGHT - 0.6, p.z);
      scene.add(cLight);
      var camObj = {
        body: camBody,
        lens: lens,
        light: cLight,
        x: p.x,
        z: p.z,
        yaw: 0,
        sweepDir: 1,
        detected: false,
        detectTimer: 0
      };
      state.cameras3d.push(camObj);
    }
  }

  // ─── Laser Grids ─────────────────────────────────────────────────────────────

  function spawnLaserGrids() {
    var scene = state.scene;
    // Place laser grids in corridors between sections
    var corridors = [
      { x: 0, z: sectionZ(SEC_LOBBY) - 13, axis: 'x' },
      { x: 0, z: sectionZ(SEC_SERVER) - 13, axis: 'x' },
      { x: 0, z: sectionZ(SEC_RESEARCH) - 13, axis: 'x' },
      { x: 0, z: sectionZ(SEC_DIRECTOR) - 13, axis: 'x' }
    ];
    var i, j;
    for (i = 0; i < corridors.length; i++) {
      var c = corridors[i];
      // Create laser lines using LineSegments
      var points = [];
      var numBeams = 4;
      for (j = 0; j < numBeams; j++) {
        var beamY = 0.5 + j * 1.0;
        points.push(new THREE.Vector3(-8, beamY, 0));
        points.push(new THREE.Vector3( 8, beamY, 0));
      }
      var geo = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: COL_LASER });
      var lines = new THREE.LineSegments(geo, mat);
      lines.position.set(c.x, 0, c.z);
      scene.add(lines);
      var lLight = new THREE.PointLight(COL_LASER, 0.6, 10);
      lLight.position.set(c.x, 2, c.z);
      scene.add(lLight);
      var lgObj = {
        lines: lines,
        light: lLight,
        x: c.x,
        z: c.z,
        triggered: false,
        triggerCooldown: 0
      };
      state.laserGrids.push(lgObj);
    }
  }

  // ─── Collectibles ─────────────────────────────────────────────────────────────

  function spawnUSBDrives() {
    var scene = state.scene;
    var rz = sectionZ(SEC_RESEARCH);
    var positions = [
      { x: -7, z: rz + 8 },
      { x:  7, z: rz + 8 },
      { x:  0, z: rz - 8 }
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var p = positions[i];
      var usb = box(0.3, 0.15, 0.6, COL_USB);
      usb.position.set(p.x, 1.1, p.z);
      scene.add(usb);
      var uLight = new THREE.PointLight(USB_LIGHT_COLOR, 0.8, 4);
      uLight.position.set(p.x, 1.5, p.z);
      scene.add(uLight);
      var uObj = {
        mesh: usb,
        light: uLight,
        x: p.x,
        z: p.z,
        collected: false
      };
      state.usbDrives.push(uObj);
    }
  }

  function spawnEncryptedDriveAt(x, y, z) {
    var scene = state.scene;
    var drive = box(0.4, 0.1, 0.8, COL_DRIVE);
    drive.position.set(x, y, z);
    scene.add(drive);
    var dLight = new THREE.PointLight(0xFFAA00, 0.8, 4);
    dLight.position.set(x, y + 0.5, z);
    scene.add(dLight);
    state.encryptedDrive = {
      mesh: drive,
      light: dLight,
      x: x,
      z: z,
      collected: false
    };
  }

  function spawnEncryptedDrive() {
    // Called during world build — actual placement done in buildDirectorSuite via spawnEncryptedDriveAt
    // This function is a no-op placeholder since buildDirectorSuite calls spawnEncryptedDriveAt directly
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────

  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'ce-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00FFAA',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.7)',
      'padding:8px 12px',
      'border:1px solid #00FFAA',
      'z-index:10000',
      'pointer-events:none',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    var prompt = document.createElement('div');
    prompt.id = 'ce-prompt';
    prompt.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.6)',
      'padding:4px 10px',
      'border:1px solid #888',
      'z-index:10000',
      'pointer-events:none',
      'display:none'
    ].join(';');
    document.body.appendChild(prompt);
    state.promptEl = prompt;

    var endEl = document.createElement('div');
    endEl.id = 'ce-end';
    endEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:24px',
      'background:rgba(0,0,0,0.9)',
      'padding:20px 30px',
      'border:2px solid #FFFFFF',
      'z-index:10001',
      'pointer-events:none',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(endEl);
    state.endEl = endEl;

    // Crosshair
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'width:12px',
      'height:12px',
      'margin:-6px 0 0 -6px',
      'border:1px solid rgba(255,255,255,0.8)',
      'border-radius:50%',
      'z-index:10000',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(ch);
    state.crosshair = ch;
  }

  function updateHUD() {
    if (!state.hudEl) { return; }
    var camerasStr;
    if (state.camerasDisabled) {
      camerasStr = Math.ceil(state.camerasDisabledTimer) + 's';
    } else {
      camerasStr = 'N/A';
    }
    var directorStr = state.directorNeutralized ? 'NEUTRALIZED' : 'ACTIVE';
    var driveStr = state.hasDrive ? 'SECURED' : 'NOT FOUND';
    var liveGuards = 0;
    var i;
    for (i = 0; i < state.guards.length; i++) {
      if (!state.guards[i].knockedOut && !state.guards[i].dead) { liveGuards++; }
    }
    var alarmStr = Math.floor(state.alarmMeter) + '%';
    if (state.lockdownActive) {
      alarmStr = 'LOCKDOWN! ESCAPE: ' + Math.ceil(state.lockdownTimer) + 's';
    }
    state.hudEl.textContent = [
      'CYBER ESPIONAGE',
      '[BLUEPRINTS: ' + state.blueprintsCollected + '/3]',
      '[DRIVE: ' + driveStr + ']',
      '[ALARM: ' + alarmStr + ']',
      '[CAMERAS DISABLED: ' + camerasStr + ']',
      '[DIRECTOR: ' + directorStr + ']',
      '[GUARDS: ' + liveGuards + ']',
      '[HP: ' + state.playerHP + ']',
      '',
      'WASD:Move  Mouse:Look  LMB:Shoot',
      'Q:Tranq  E(hold):Hack/Interact'
    ].join('\n');
  }

  function showPrompt(text) {
    if (!state.promptEl) { return; }
    if (text) {
      state.promptEl.textContent = text;
      state.promptEl.style.display = 'block';
    } else {
      state.promptEl.style.display = 'none';
    }
  }

  function showEnd(msg, color) {
    if (!state.endEl) { return; }
    state.endEl.textContent = msg;
    state.endEl.style.color = color || '#FFFFFF';
    state.endEl.style.display = 'block';
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  function setupInput() {
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);
    state.renderer.domElement.addEventListener('click', function () {
      if (!state.pointerLocked) {
        state.renderer.domElement.requestPointerLock();
      }
    }, false);
  }

  function teardownInput() {
    document.removeEventListener('keydown', onKeyDown, false);
    document.removeEventListener('keyup', onKeyUp, false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('pointerlockchange', onPointerLockChange, false);
  }

  function onKeyDown(e) {
    if (!state.active) {
      // activation sequence: C then E within 400ms
      if (e.code === 'KeyC') {
        state.cDown = true;
        state.cDownTime = Date.now();
      }
      if (e.code === 'KeyE' && state.cDown) {
        if (Date.now() - state.cDownTime <= ACTIVATION_WINDOW) {
          activateGame();
          return;
        }
        state.cDown = false;
      }
      return;
    }
    state.moveKeys[e.code] = true;
    if (e.code === 'KeyE') {
      state.interactKeyHeld = true;
    }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyC') { state.cDown = false; }
    if (!state.active) { return; }
    state.moveKeys[e.code] = false;
    if (e.code === 'KeyE') {
      state.interactKeyHeld = false;
      state.interactHoldTimer = 0;
      state.hackingTerminal = false;
      showPrompt(null);
    }
    if (e.code === 'KeyQ') {
      fireTranq();
    }
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) { return; }
    state.mouseDX += e.movementX;
    state.mouseDY += e.movementY;
  }

  function onMouseDown(e) {
    if (!state.active || !state.pointerLocked) { return; }
    if (e.button === 0) {
      fireShot();
    }
  }

  function onPointerLockChange() {
    state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
  }

  // ─── Shooting ────────────────────────────────────────────────────────────────

  function fireShot() {
    if (state.shootCooldown > 0) { return; }
    state.shootCooldown = 0.3;
    // Raycast from camera
    var dir = new THREE.Vector3();
    state.camera.getWorldDirection(dir);
    var origin = state.camera.position.clone();
    // Check guards
    var i;
    for (i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (g.knockedOut || g.dead) { continue; }
      var gx = g.body.position.x;
      var gz = g.body.position.z;
      var toG = new THREE.Vector3(gx - origin.x, 0.9 - (origin.y - 0), gz - origin.z);
      var dotVal = dir.dot(toG.clone().normalize());
      if (dotVal > 0.97 && toG.length() < 25) {
        g.hp -= 30;
        if (g.hp <= 0) {
          g.dead = true;
          g.body.visible = false;
          g.head.visible = false;
        }
        addAlarm(10);
        return;
      }
    }
    // Check director
    if (!state.directorNeutralized && state.directorMesh) {
      var dx = state.directorMesh.position.x - origin.x;
      var dz = state.directorMesh.position.z - origin.z;
      var toDir = new THREE.Vector3(dx, 0, dz);
      var dotD = dir.dot(toDir.clone().normalize());
      if (dotD > 0.97 && toDir.length() < 25) {
        state.directorHP -= 30;
        if (state.directorHP <= 0) {
          state.directorNeutralized = true;
          state.directorMesh.visible = false;
          if (state.directorHead) { state.directorHead.visible = false; }
          // Drop keycard indicator
          state.hasKeycard = true;
          showPrompt('Director neutralized — keycard acquired!');
        }
        addAlarm(15);
        return;
      }
    }
  }

  function fireTranq() {
    if (state.tranqCooldown > 0) { return; }
    state.tranqCooldown = 1.5;
    var dir = new THREE.Vector3();
    state.camera.getWorldDirection(dir);
    var origin = state.camera.position.clone();
    var i;
    for (i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (g.knockedOut || g.dead) { continue; }
      var gx = g.body.position.x;
      var gz = g.body.position.z;
      var toG = new THREE.Vector3(gx - origin.x, 0, gz - origin.z);
      var dotVal = dir.dot(toG.clone().normalize());
      if (dotVal > 0.97 && toG.length() < 20) {
        knockoutGuard(i);
        return;
      }
    }
    // Director tranq
    if (!state.directorNeutralized && state.directorMesh) {
      var ddx = state.directorMesh.position.x - origin.x;
      var ddz = state.directorMesh.position.z - origin.z;
      var toDir = new THREE.Vector3(ddx, 0, ddz);
      var dotD = dir.dot(toDir.clone().normalize());
      if (dotD > 0.97 && toDir.length() < 20) {
        state.directorHP -= 0; // non-lethal
        state.directorNeutralized = true;
        state.directorMesh.material.color.setHex(0x666666);
        if (state.directorHead) { state.directorHead.material.color.setHex(0x888877); }
        state.hasKeycard = true;
        showPrompt('Director tranquilized — keycard acquired!');
      }
    }
  }

  function knockoutGuard(idx) {
    var g = state.guards[idx];
    g.knockedOut = true;
    g.knockoutTimer = TRANQ_KNOCKDOWN;
    g.body.material.color.setHex(0x555544);
    g.head.material.color.setHex(0x888877);
    // Spawn uniform pickup if not already taken
    if (!g.uniformTaken) {
      spawnUniformPickup(g.body.position.x, g.body.position.z);
      g.uniformTaken = true;
    }
  }

  function spawnUniformPickup(x, z) {
    var scene = state.scene;
    var uni = box(0.8, 0.1, 0.5, COL_UNIFORM);
    uni.position.set(x, 0.3, z + 0.5);
    scene.add(uni);
    var uLight = new THREE.PointLight(0x44FF44, 0.4, 3);
    uLight.position.set(x, 0.6, z + 0.5);
    scene.add(uLight);
    state.uniformPickups.push({ mesh: uni, light: uLight, x: x, z: z + 0.5, taken: false });
  }

  // ─── Interaction ─────────────────────────────────────────────────────────────

  function checkInteractions(dt) {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var prompt = null;
    var i;

    // USB drives
    for (i = 0; i < state.usbDrives.length; i++) {
      var usb = state.usbDrives[i];
      if (!usb.collected && dist2D(px, pz, usb.x, usb.z) < 2.5) {
        prompt = '[E] Collect Blueprint USB (' + (i + 1) + ')';
        if (state.interactKeyHeld) {
          usb.collected = true;
          usb.mesh.visible = false;
          usb.light.intensity = 0;
          state.blueprintsCollected++;
          showPrompt('Blueprint ' + state.blueprintsCollected + '/3 collected!');
          return;
        }
      }
    }

    // Encrypted drive
    if (state.encryptedDrive && !state.encryptedDrive.collected) {
      if (dist2D(px, pz, state.encryptedDrive.x, state.encryptedDrive.z) < 2.5) {
        if (state.hasKeycard) {
          prompt = '[E] Collect Encrypted Drive';
          if (state.interactKeyHeld) {
            state.encryptedDrive.collected = true;
            state.encryptedDrive.mesh.visible = false;
            state.encryptedDrive.light.intensity = 0;
            state.hasDrive = true;
            showPrompt('Encrypted drive secured!');
            return;
          }
        } else {
          prompt = 'Director\'s keycard required for encrypted drive';
        }
      }
    }

    // Hacking terminals
    if (state.terminals) {
      for (i = 0; i < state.terminals.length; i++) {
        var term = state.terminals[i];
        if (!term.hacked && dist2D(px, pz, term.x, term.z) < 2.5) {
          prompt = '[E hold ' + HACK_DURATION + 's] Hack terminal (' + term.hackType + ')';
          if (state.interactKeyHeld) {
            state.hackingTerminal = true;
            state.hackTarget = term;
            state.interactHoldTimer += dt;
            var pct = state.interactHoldTimer / HACK_DURATION;
            showPrompt('Hacking... ' + Math.floor(pct * 100) + '%');
            if (state.interactHoldTimer >= HACK_DURATION) {
              completeHack(term);
              state.hackingTerminal = false;
              state.interactHoldTimer = 0;
              state.hackTarget = null;
            }
            return;
          } else {
            state.interactHoldTimer = 0;
          }
        }
      }
    }

    // Uniform pickups
    for (i = 0; i < state.uniformPickups.length; i++) {
      var up = state.uniformPickups[i];
      if (!up.taken && dist2D(px, pz, up.x, up.z) < 2) {
        prompt = '[E hold 3s] Take guard uniform';
        if (state.interactKeyHeld) {
          state.interactHoldTimer += dt;
          showPrompt('Taking uniform... ' + Math.floor((state.interactHoldTimer / 3) * 100) + '%');
          if (state.interactHoldTimer >= 3.0) {
            up.taken = true;
            up.mesh.visible = false;
            up.light.intensity = 0;
            state.disguiseActive = true;
            state.disguiseTimer = DISGUISE_DURATION;
            state.interactHoldTimer = 0;
            showPrompt('Disguise equipped for ' + DISGUISE_DURATION + 's!');
          }
          return;
        } else {
          state.interactHoldTimer = 0;
        }
      }
    }

    // Keycard-locked doors (unlock with keycard)
    for (i = 0; i < state.lockedDoors.length; i++) {
      var door = state.lockedDoors[i];
      if (!door.unlocked && !state.lockdownActive && dist2D(px, pz, door.x, door.z) < 2.5) {
        if (state.hasKeycard) {
          prompt = '[E] Unlock door (keycard)';
          if (state.interactKeyHeld) {
            door.unlocked = true;
            door.mesh.visible = false;
            door.light.intensity = 0;
            showPrompt('Door unlocked!');
            return;
          }
        } else {
          prompt = 'Keycard required';
        }
      }
    }

    // Extraction zone check
    var extractZ = sectionZ(SEC_BUNKER) + 10;
    if (dist2D(px, pz, 0, extractZ) < 4) {
      if (state.blueprintsCollected >= 3 && state.hasDrive) {
        prompt = '[E] EXTRACT — Mission Complete!';
        if (state.interactKeyHeld) {
          winGame();
          return;
        }
      } else {
        prompt = 'Need all 3 blueprints + encrypted drive to extract';
      }
    }

    showPrompt(prompt);
  }

  function completeHack(term) {
    term.hacked = true;
    term.screenMesh.material.emissive.setHex(0x0044FF);
    term.screenMesh.material.color.setHex(0x003388);
    if (term.hackType === 'cameras') {
      state.camerasDisabled = true;
      state.camerasDisabledTimer = CAMERA_DISABLE_TIME;
      showPrompt('Cameras disabled for ' + CAMERA_DISABLE_TIME + 's!');
    } else if (term.hackType === 'keycards') {
      state.hasKeycard = true;
      showPrompt('Keycard access granted!');
    } else if (term.hackType === 'guards') {
      // Slow guards for 20s
      state.guardsSlowed = true;
      state.guardsSlowedTimer = 20;
      showPrompt('Guards slowed for 20s!');
    }
  }

  // ─── Gameplay ─────────────────────────────────────────────────────────────────

  function winGame() {
    state.missionWon = true;
    showEnd('MISSION COMPLETE\nAll blueprints and encrypted drive extracted!\nThe AI weapon secrets are safe.', '#00FF88');
    state.active = false;
    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  function loseGame(reason) {
    state.missionFailed = true;
    showEnd('MISSION FAILED\n' + (reason || 'Objective failed.'), '#FF4444');
    state.active = false;
    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  // ─── Guard AI ────────────────────────────────────────────────────────────────

  function updateGuards(dt) {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var sightRange = state.disguiseActive ? GUARD_SIGHT_DISGUISED : GUARD_SIGHT_RANGE;
    var speedMul = (state.guardsSlowed) ? 0.3 : 1.0;
    var i;
    for (i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (g.dead) { continue; }
      if (g.knockedOut) {
        g.knockoutTimer -= dt;
        if (g.knockoutTimer <= 0) {
          g.knockedOut = false;
          g.body.material.color.setHex(COL_GUARD);
          g.head.material.color.setHex(0xBBAA88);
        }
        continue;
      }
      // Patrol movement
      g.patrolTimer += dt;
      if (g.patrolTimer > 3.0) {
        g.patrolDir *= -1;
        g.patrolTimer = 0;
      }
      var moveSpd = 2.5 * speedMul;
      g.x += Math.sin(g.yaw) * g.patrolDir * moveSpd * dt;
      g.z += Math.cos(g.yaw) * g.patrolDir * moveSpd * dt;
      // Clamp to origin area
      var maxWander = 6;
      g.x = clamp(g.x, g.originX - maxWander, g.originX + maxWander);
      g.z = clamp(g.z, g.originZ - maxWander, g.originZ + maxWander);
      g.body.position.set(g.x, 0.9, g.z);
      g.head.position.set(g.x, 2.1, g.z);
      // Detection check
      var d = dist2D(px, pz, g.x, g.z);
      if (d < sightRange && !state.camerasDisabled) {
        g.alertTimer += dt;
        if (g.alertTimer > 1.5) {
          g.alertTimer = 0;
          addAlarm(8);
        }
      } else {
        g.alertTimer = Math.max(0, g.alertTimer - dt * 0.5);
      }
      // Chase player if alarmed
      if (state.lockdownActive || state.alarmMeter > 60) {
        var ddx = px - g.x;
        var ddz = pz - g.z;
        var dlen = Math.sqrt(ddx * ddx + ddz * ddz);
        if (dlen > 0.5) {
          g.x += (ddx / dlen) * 4 * speedMul * dt;
          g.z += (ddz / dlen) * 4 * speedMul * dt;
          g.body.position.set(g.x, 0.9, g.z);
          g.head.position.set(g.x, 2.1, g.z);
        }
        // Deal damage if very close
        if (dlen < 1.5) {
          state.playerHP -= 15 * dt;
          if (state.playerHP <= 0) {
            loseGame('Player killed by security forces.');
          }
        }
      }
    }
  }

  function updateDirector(dt) {
    if (state.directorNeutralized || !state.directorMesh) { return; }
    // Director patrols small area
    state.directorPatrolTimer = (state.directorPatrolTimer || 0) + dt;
    if (state.directorPatrolTimer > 4.0) {
      state.directorPatrolDir *= -1;
      state.directorPatrolTimer = 0;
    }
    var dz = sectionZ(SEC_DIRECTOR);
    state.directorX += state.directorPatrolDir * 1.5 * dt;
    state.directorX = clamp(state.directorX, -8, 8);
    state.directorMesh.position.set(state.directorX, 1, dz + 7);
    if (state.directorHead) {
      state.directorHead.position.set(state.directorX, 2.2, dz + 7);
    }
    state.directorZ = dz + 7;
  }

  // ─── Camera AI ───────────────────────────────────────────────────────────────

  function updateCameras(dt) {
    if (state.camerasDisabled) {
      state.camerasDisabledTimer -= dt;
      if (state.camerasDisabledTimer <= 0) {
        state.camerasDisabled = false;
        state.camerasDisabledTimer = 0;
      }
      // Flash cameras red when disabled
      var i;
      for (i = 0; i < state.cameras3d.length; i++) {
        state.cameras3d[i].light.color.setHex(0x0000FF);
      }
      return;
    }
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var sweepRad = (CAMERA_SWEEP * Math.PI / 180) / 2;
    var i;
    for (i = 0; i < state.cameras3d.length; i++) {
      var cam = state.cameras3d[i];
      // Sweep
      cam.yaw += CAMERA_SPEED * cam.sweepDir * dt;
      if (cam.yaw > sweepRad)  { cam.yaw = sweepRad;  cam.sweepDir = -1; }
      if (cam.yaw < -sweepRad) { cam.yaw = -sweepRad; cam.sweepDir =  1; }
      cam.body.rotation.z = cam.yaw;
      cam.light.color.setHex(COL_LASER);
      // Detection
      var d = dist2D(px, pz, cam.x, cam.z);
      if (d < 12) {
        var toDirX = px - cam.x;
        var toDirZ = pz - cam.z;
        var angleToPlayer = Math.atan2(toDirX, toDirZ);
        var angleDiff = Math.abs(cam.yaw - angleToPlayer);
        if (angleDiff < 0.4 && !state.disguiseActive) {
          cam.detectTimer += dt;
          cam.light.color.setHex(0xFF8800);
          if (cam.detectTimer > 1.0) {
            cam.detectTimer = 0;
            addAlarm(CAMERA_ALARM_ADD);
          }
        } else {
          cam.detectTimer = Math.max(0, cam.detectTimer - dt);
        }
      }
    }
  }

  // ─── Laser Grids ─────────────────────────────────────────────────────────────

  function updateLaserGrids(dt) {
    var px = state.playerPos.x;
    var pz = state.playerPos.z;
    var i;
    for (i = 0; i < state.laserGrids.length; i++) {
      var lg = state.laserGrids[i];
      if (lg.triggerCooldown > 0) {
        lg.triggerCooldown -= dt;
        continue;
      }
      // Check if player is within the laser plane
      var distZ = Math.abs(pz - lg.z);
      var distX = Math.abs(px - lg.x);
      if (distZ < 0.6 && distX < 8) {
        // Player stepped through laser
        addAlarm(LASER_ALARM_ADD);
        lg.triggerCooldown = 3.0;
        lg.light.color.setHex(0xFF8800);
        // Flash
        lg.lines.material.color.setHex(0xFFFFFF);
        setTimeout(function () {
          if (lg.lines) { lg.lines.material.color.setHex(COL_LASER); }
          if (lg.light) { lg.light.color.setHex(COL_LASER); }
        }, 300);
      }
    }
  }

  // ─── Player Movement ─────────────────────────────────────────────────────────

  function updatePlayer(dt) {
    // Mouse look
    var sensitivity = 0.002;
    state.playerYaw   -= state.mouseDX * sensitivity;
    state.playerPitch -= state.mouseDY * sensitivity;
    state.playerPitch  = clamp(state.playerPitch, -1.2, 1.2);
    state.mouseDX = 0;
    state.mouseDY = 0;

    // Movement
    var fwd = 0;
    var strafe = 0;
    if (state.moveKeys['KeyW']) { fwd    =  1; }
    if (state.moveKeys['KeyS']) { fwd    = -1; }
    if (state.moveKeys['KeyA']) { strafe = -1; }
    if (state.moveKeys['KeyD']) { strafe =  1; }

    var spd = PLAYER_SPEED * dt;
    state.playerPos.x += (Math.sin(state.playerYaw) * fwd + Math.cos(state.playerYaw) * strafe) * spd;
    state.playerPos.z += (Math.cos(state.playerYaw) * fwd - Math.sin(state.playerYaw) * strafe) * spd;

    // Clamp to world bounds
    state.playerPos.x = clamp(state.playerPos.x, -14, 14);
    state.playerPos.z = clamp(state.playerPos.z, sectionZ(SEC_BUNKER) - 14, 65);

    // Update camera
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y,
      state.playerPos.z
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;
  }

  // ─── Cooldowns / Timers ───────────────────────────────────────────────────────

  function updateTimers(dt) {
    if (state.shootCooldown > 0) { state.shootCooldown -= dt; }
    if (state.tranqCooldown > 0) { state.tranqCooldown -= dt; }
    if (state.disguiseActive) {
      state.disguiseTimer -= dt;
      if (state.disguiseTimer <= 0) {
        state.disguiseActive = false;
        state.disguiseTimer = 0;
      }
    }
    if (state.guardsSlowed) {
      state.guardsSlowedTimer -= dt;
      if (state.guardsSlowedTimer <= 0) {
        state.guardsSlowed = false;
      }
    }
    if (state.lockdownActive) {
      state.lockdownTimer -= dt;
      if (state.lockdownTimer <= 0) {
        loseGame('Lockdown escape timer expired!');
      }
    }
    // Alarm blink
    state.alarmBlinkTimer += dt;
    if (state.alarmBlinkTimer > 0.5) {
      state.alarmBlinkTimer = 0;
      var i;
      for (i = 0; i < state.alarmLights.length; i++) {
        var al = state.alarmLights[i];
        if (state.lockdownActive || state.alarmMeter > 50) {
          al.intensity = al.intensity > 0 ? 0 : 0.8;
        } else {
          al.intensity = 0;
        }
      }
    }
  }

  // ─── Animate ────────────────────────────────────────────────────────────────

  function animate(ts) {
    if (!state.active) { return; }
    state.animFrameId = requestAnimationFrame(animate);
    var dt = Math.min((ts - state.lastTime) / 1000, 0.1);
    state.lastTime = ts;
    if (state.missionFailed || state.missionWon) {
      state.renderer.render(state.scene, state.camera);
      return;
    }
    updatePlayer(dt);
    updateGuards(dt);
    updateDirector(dt);
    updateCameras(dt);
    updateLaserGrids(dt);
    updateTimers(dt);
    checkInteractions(dt);
    // USB float animation
    var now = ts / 1000;
    var i;
    for (i = 0; i < state.usbDrives.length; i++) {
      var u = state.usbDrives[i];
      if (!u.collected) {
        u.mesh.position.y = 1.1 + Math.sin(now * 2 + i) * 0.15;
        u.mesh.rotation.y += dt * 1.5;
      }
    }
    if (state.encryptedDrive && !state.encryptedDrive.collected) {
      state.encryptedDrive.mesh.rotation.y += dt * 1.2;
    }
    updateHUD();
    state.renderer.render(state.scene, state.camera);
  }

  // ─── Init / Activate ────────────────────────────────────────────────────────

  function activateGame() {
    if (state.active) { return; }
    state.active = true;

    // Create renderer
    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;';
    document.body.appendChild(canvas);
    state.canvas = canvas;

    state.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(window.devicePixelRatio || 1);
    state.renderer.shadowMap.enabled = false;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x050A10);
    state.scene.fog = new THREE.Fog(0x050A10, 30, 120);

    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);

    buildWorld();
    setupInput();

    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(animate);

    window.addEventListener('resize', onResize, false);
  }

  function onResize() {
    if (!state.renderer) { return; }
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  function init() {
    // Reset activation keys so fresh C->E sequence works
    state.cDown = false;
    state.cDownTime = 0;
  }

  function update(dt) {
    // External tick hook — unused internally (self-driven rAF loop)
    void dt;
  }

  function reset() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    teardownInput();
    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.canvas && state.canvas.parentNode) {
      state.canvas.parentNode.removeChild(state.canvas);
      state.canvas = null;
    }
    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }
    if (state.promptEl && state.promptEl.parentNode) {
      state.promptEl.parentNode.removeChild(state.promptEl);
      state.promptEl = null;
    }
    if (state.endEl && state.endEl.parentNode) {
      state.endEl.parentNode.removeChild(state.endEl);
      state.endEl = null;
    }
    if (state.crosshair && state.crosshair.parentNode) {
      state.crosshair.parentNode.removeChild(state.crosshair);
      state.crosshair = null;
    }
    if (document.exitPointerLock) { document.exitPointerLock(); }
    // Reset state fields
    state.active = false;
    state.scene = null;
    state.camera = null;
    state.guards = [];
    state.cameras3d = [];
    state.laserGrids = [];
    state.usbDrives = [];
    state.lockedDoors = [];
    state.reinforcements = [];
    state.uniformPickups = [];
    state.alarmLights = [];
    state.terminals = [];
    state.encryptedDrive = null;
    state.directorMesh = null;
    state.directorHead = null;
    state.alarmMeter = 0;
    state.lockdownActive = false;
    state.lockdownTimer = 0;
    state.missionFailed = false;
    state.missionWon = false;
    state.blueprintsCollected = 0;
    state.hasDrive = false;
    state.hasKeycard = false;
    state.disguiseActive = false;
    state.disguiseTimer = 0;
    state.camerasDisabled = false;
    state.camerasDisabledTimer = 0;
    state.playerHP = PLAYER_HP;
    state.playerPos = { x: 0, y: 1.8, z: 55 };
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.moveKeys = {};
    state.pointerLocked = false;
    state.hackingTerminal = false;
    state.hackTimer = 0;
    state.hackTarget = null;
    state.interactKeyHeld = false;
    state.interactHoldTimer = 0;
    state.shootCooldown = 0;
    state.tranqCooldown = 0;
    state.guardsSlowed = false;
    state.guardsSlowedTimer = 0;
    state.guardCount = 0;
    state.directorHP = DIRECTOR_HP;
    state.directorNeutralized = false;
    state.mouseDX = 0;
    state.mouseDY = 0;
    state.alarmBlinkTimer = 0;
  }

  return { init: init, update: update, reset: reset };

})();
