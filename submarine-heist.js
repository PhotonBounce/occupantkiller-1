window.SubmarineHeist = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ──────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation: S + H simultaneous within 400ms
    sDown: false,
    hDown: false,
    sDownTime: 0,
    hDownTime: 0,
    // three.js
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    playerPos: { x: 0, y: 1.7, z: 32 },
    playerYaw: 0,
    playerPitch: 0,
    playerHP: 100,
    playerMaxHP: 100,
    moveKeys: {},
    pointerLocked: false,
    running: false,
    // mission state
    missionFailed: false,
    missionClear: false,
    // timers
    surfacedTimer: 480,       // 8 minutes
    alarmTriggered: false,
    alarmTimer: 180,          // 3 min after alarm
    // diving
    divingStarted: false,
    diveProgress: 0,          // 0..1
    diveTiltAngle: 0,
    // stealth
    stealthActive: true,
    hasKeycard: false,
    // objectives
    doorsOpened: 0,           // 0..3
    codesSecured: false,
    // safe cracking
    safeCracking: false,
    safeCrackTimer: 0,
    safeCrackDuration: 6,
    safeOpen: false,
    safeMesh: null,
    codeMesh: null,
    // hacking doors
    hackingDoor: false,
    hackDoorTimer: 0,
    hackDoorDuration: 4,
    hackTargetDoor: null,
    // crew
    crew: [],
    crewMeshes: [],
    crewCount: 18,
    // cameras
    cameras3d: [],
    cameraAngle: [],
    cameraDir: [],
    cameraDisabled: [],
    // motion detector
    motionDetectorMesh: null,
    motionTriggered: false,
    // alarm panels
    alarmPanels: [],
    // flood
    floodedCompartments: {},
    floodMeshes: {},
    floodLevel: {},
    // escape hatch
    escapeHatchMesh: null,
    escapeHatchPos: { x: 0, y: 5.2, z: -28 },
    escapingNow: false,
    // captain
    captainMesh: null,
    captainHP: 300,
    captainMaxHP: 300,
    captainPos: { x: 0, y: 1, z: -46 },
    captainAlerted: false,
    captainFlooding: false,
    captainFloodTimer: 0,
    // bulkhead doors
    doors: [],
    doorMeshes: [],
    // first officer (has keycard)
    firstOfficerMesh: null,
    firstOfficerHP: 80,
    firstOfficerPos: { x: 3, y: 1, z: -22 },
    firstOfficerDead: false,
    // hot pipe damage
    inEngineRoom: false,
    engineRoomTimer: 0,
    // shooting
    canShoot: true,
    shootCooldown: 0,
    bullets: [],
    bulletMeshes: [],
    // stealth kill timer
    stealthKillPossible: false,
    stealthKillTarget: null,
    // interact
    interactPossible: false,
    interactTarget: null,
    lastInteractTime: 0,
    // HUD
    hudEl: null,
    promptEl: null,
    endEl: null,
    // sub group (for tilt)
    subGroup: null,
    // water level Y
    waterY: -20,
    // key listeners
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null,
    pointerlockHandler: null
  };

  // ─── Constants ───────────────────────────────────────────────────────────────
  var WALK_SPEED = 4;
  var RUN_SPEED = 8;
  var INTERACT_DIST = 2.5;
  var STEALTH_KILL_DIST = 1.8;
  var CAMERA_SWEEP_SPEED = 0.6;
  var BULLET_SPEED = 30;
  var SHOOT_INTERVAL = 0.25;
  var FLOOD_RATE = 0.5;
  var FLOOD_DAMAGE_DEPTH = 2;
  var FLOOD_DAMAGE_RATE = 5;
  var HOT_PIPE_DAMAGE = 3;
  var DIVE_FULL_TIME = 60;    // sub fully submerged after 60s of diving

  // Compartment Z ranges (sub lies horizontal, Z axis = fore/aft)
  // Positive Z = stern (entry), Negative Z = bow (captain)
  var COMP = {
    torpedo:   { zMin: -60, zMax: -40, name: 'TORPEDO ROOM' },
    engine:    { zMin: -40, zMax: -20, name: 'ENGINE ROOM' },
    crew:      { zMin: -20, zMax: -5,  name: 'CREW QUARTERS' },
    control:   { zMin: -5,  zMax:  10, name: 'CONTROL ROOM' },
    captain:   { zMin: 10,  zMax:  25, name: "CAPTAIN'S QUARTERS" }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function makeBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, colorHex, x, y, z, rotX) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : 0, z || 0);
    if (rotX) { mesh.rotation.x = rotX; }
    return mesh;
  }

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 10, 10);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.5 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : 0, z || 0);
    return mesh;
  }

  function makeLineBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: colorHex });
    var mesh = new THREE.LineSegments(edges, mat);
    mesh.position.set(x || 0, y !== undefined ? y : 0, z || 0);
    return mesh;
  }

  function dist3D(ax, ay, az, bx, by, bz) {
    var dx = ax - bx, dy = ay - by, dz = az - bz;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function getPlayerZ() { return state.playerPos.z; }

  function compartmentOf(z) {
    for (var k in COMP) {
      if (z >= COMP[k].zMin && z < COMP[k].zMax) { return k; }
    }
    return null;
  }

  // ─── Build Scene ─────────────────────────────────────────────────────────────
  function buildScene() {
    var sg = state.subGroup;
    var s = state.scene;

    // ── Ambient / directional light ──
    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    s.add(ambient);
    var dir = new THREE.DirectionalLight(0x88aacc, 1.0);
    dir.position.set(5, 20, 10);
    s.add(dir);

    // ── Ocean water plane (outside sub) ──
    var ocean = makeBox(200, 0.5, 200, 0x113355, 0, -5, 0);
    s.add(ocean);

    // ── Sub hull exterior (CylinderGeometry r=5 h=60, lying horizontal) ──
    var hull = makeCylinder(5, 5, 60, 12, 0x334433, 0, 0, -15, Math.PI / 2);
    sg.add(hull);

    // Conning tower
    var conning = makeBox(4, 5, 6, 0x334433, 0, 5.5, -10);
    sg.add(conning);

    // Conning tower periscope
    var periscope = makeCylinder(0.15, 0.15, 5, 6, 0x445544, 0, 10, -10);
    sg.add(periscope);

    // Entry hatch (topside)
    var hatch = makeBox(1.5, 0.3, 1.5, 0x557755, 0, 5.2, -10);
    hatch.userData.isHatch = true;
    sg.add(hatch);

    // ── Escape hatch (topside bow area) ──
    var escHatch = makeBox(1.5, 0.3, 1.5, 0x448844, 0, 5.2, -28);
    escHatch.userData.isEscapeHatch = true;
    state.escapeHatchMesh = escHatch;
    sg.add(escHatch);

    // ─ Interior floor/ceiling for all rooms ─
    buildTorpedoRoom(sg);
    buildEngineRoom(sg);
    buildCrewQuarters(sg);
    buildControlRoom(sg);
    buildCaptainsQuarters(sg);

    // ── Bulkhead doors (3 doors between compartments) ──
    buildBulkheadDoors(sg);

    // ── Security cameras (2) ──
    buildCameras(sg);

    // ── Motion detector ──
    var motionDet = makeBox(0.5, 0.5, 0.5, 0x334455, 0, 2.5, -12);
    motionDet.userData.isMotionDetector = true;
    state.motionDetectorMesh = motionDet;
    sg.add(motionDet);

    // ── Alarm panels (red, shoot to destroy) ──
    buildAlarmPanels(sg);

    // ── Crew members ──
    buildCrew(sg);

    // ── Captain ──
    buildCaptain(sg);

    // ── First officer (has keycard) ──
    buildFirstOfficer(sg);

    // ── Safe in captain's quarters ──
    buildSafe(sg);

    s.add(sg);
  }

  function buildTorpedoRoom(sg) {
    // Floor
    var floor = makeBox(8, 0.2, 20, 0x334444, 0, -1.9, -50);
    sg.add(floor);
    var ceil = makeBox(8, 0.2, 20, 0x223333, 0, 2.1, -50);
    sg.add(ceil);
    // Walls
    sg.add(makeBox(0.2, 4, 20, 0x334444, -4, 0, -50));
    sg.add(makeBox(0.2, 4, 20, 0x334444,  4, 0, -50));
    // Room box label color (visible ceiling stripe)
    var roomBody = makeBox(7.8, 4, 19.8, 0x334444, 0, 0, -50);
    roomBody.material.transparent = true;
    roomBody.material.opacity = 0.15;
    sg.add(roomBody);
    // Torpedo tubes (4x CylinderGeometry, horizontal)
    sg.add(makeCylinder(0.5, 0.5, 4, 8, 0x445555, -2, 0,  -58, Math.PI / 2));
    sg.add(makeCylinder(0.5, 0.5, 4, 8, 0x445555,  2, 0,  -58, Math.PI / 2));
    sg.add(makeCylinder(0.5, 0.5, 4, 8, 0x445555, -2, 0.8, -58, Math.PI / 2));
    sg.add(makeCylinder(0.5, 0.5, 4, 8, 0x445555,  2, 0.8, -58, Math.PI / 2));
  }

  function buildEngineRoom(sg) {
    var floor = makeBox(8, 0.2, 20, 0x334433, 0, -1.9, -30);
    sg.add(floor);
    var ceil = makeBox(8, 0.2, 20, 0x223322, 0, 2.1, -30);
    sg.add(ceil);
    sg.add(makeBox(0.2, 4, 20, 0x334433, -4, 0, -30));
    sg.add(makeBox(0.2, 4, 20, 0x334433,  4, 0, -30));
    var roomBody = makeBox(7.8, 4, 19.8, 0x334433, 0, 0, -30);
    roomBody.material.transparent = true;
    roomBody.material.opacity = 0.15;
    sg.add(roomBody);
    // Turbines (CylinderGeometry)
    sg.add(makeCylinder(1.2, 1.2, 4, 10, 0x556644, -2, 0.5, -30));
    sg.add(makeCylinder(1.2, 1.2, 4, 10, 0x556644,  2, 0.5, -30));
    sg.add(makeCylinder(1.2, 1.2, 4, 10, 0x556644,  0, 0.5, -34));
    // Hot pipes (orange glow)
    sg.add(makeCylinder(0.15, 0.15, 16, 6, 0xFF5500, -3.5, 1.5, -30, Math.PI / 2));
    sg.add(makeCylinder(0.15, 0.15, 16, 6, 0xFF5500,  3.5, 1.5, -30, Math.PI / 2));
  }

  function buildCrewQuarters(sg) {
    var floor = makeBox(8, 0.2, 15, 0x334455, 0, -1.9, -12.5);
    sg.add(floor);
    var ceil = makeBox(8, 0.2, 15, 0x223344, 0, 2.1, -12.5);
    sg.add(ceil);
    sg.add(makeBox(0.2, 4, 15, 0x334455, -4, 0, -12.5));
    sg.add(makeBox(0.2, 4, 15, 0x334455,  4, 0, -12.5));
    var roomBody = makeBox(7.8, 4, 14.8, 0x334455, 0, 0, -12.5);
    roomBody.material.transparent = true;
    roomBody.material.opacity = 0.12;
    sg.add(roomBody);
    // Bunks (6 pairs)
    for (var bi = 0; bi < 6; bi++) {
      var bz = -6 - bi * 1.4;
      var bx = bi % 2 === 0 ? -2.5 : 2.5;
      sg.add(makeBox(1.8, 0.15, 0.8, 0x554433, bx, -0.5, bz));
      sg.add(makeBox(1.8, 0.15, 0.8, 0x554433, bx,  0.5, bz));
    }
  }

  function buildControlRoom(sg) {
    var floor = makeBox(10, 0.2, 12, 0x334466, 0, -1.9, 2.5);
    sg.add(floor);
    var ceil = makeBox(10, 0.2, 12, 0x223355, 0, 2.1, 2.5);
    sg.add(ceil);
    sg.add(makeBox(0.2, 4, 12, 0x334466, -5, 0, 2.5));
    sg.add(makeBox(0.2, 4, 12, 0x334466,  5, 0, 2.5));
    var roomBody = makeBox(9.8, 4, 11.8, 0x334466, 0, 0, 2.5);
    roomBody.material.transparent = true;
    roomBody.material.opacity = 0.13;
    sg.add(roomBody);
    // Periscope base
    sg.add(makeCylinder(0.3, 0.3, 3, 8, 0x445577, 0, 0.5, 2));
    // Control consoles
    sg.add(makeBox(2, 0.8, 0.4, 0x223355, -3, -0.6, -2));
    sg.add(makeBox(2, 0.8, 0.4, 0x223355,  3, -0.6, -2));
    sg.add(makeBox(2, 0.8, 0.4, 0x223355,  0, -0.6,  8));
  }

  function buildCaptainsQuarters(sg) {
    var floor = makeBox(8, 0.2, 10, 0x443344, 0, -1.9, 19.5);
    sg.add(floor);
    var ceil = makeBox(8, 0.2, 10, 0x332233, 0, 2.1, 19.5);
    sg.add(ceil);
    sg.add(makeBox(0.2, 4, 10, 0x443344, -4, 0, 19.5));
    sg.add(makeBox(0.2, 4, 10, 0x443344,  4, 0, 19.5));
    var roomBody = makeBox(7.8, 4, 9.8, 0x443344, 0, 0, 19.5);
    roomBody.material.transparent = true;
    roomBody.material.opacity = 0.15;
    sg.add(roomBody);
    // Captain's desk
    sg.add(makeBox(2, 0.6, 1, 0x553322, -2, -0.7, 17));
    // Bed
    sg.add(makeBox(1.5, 0.3, 2.5, 0x664433, 2.5, -0.85, 22));
  }

  function buildBulkheadDoors(sg) {
    // Door 1: between torpedo room and engine room (z=-40)
    // Door 2: between crew quarters and control room (z=-5)
    // Door 3: between control room and captain's quarters (z=10)
    var doorZs = [-40, -5, 10];
    var doorColors = [0x445555, 0x445566, 0x554455];
    state.doors = [];
    state.doorMeshes = [];
    for (var di = 0; di < 3; di++) {
      var dz = doorZs[di];
      // Frame: LineSegments
      var frame = makeLineBox(8, 4, 0.3, 0x88AACC, 0, 0, dz);
      sg.add(frame);
      // Panel
      var panel = makeBox(7.5, 3.8, 0.25, doorColors[di], 0, 0, dz);
      panel.userData.isDoor = true;
      panel.userData.doorIndex = di;
      sg.add(panel);
      state.doorMeshes.push(panel);
      // Hack panel (small box on side)
      var hackPanel = makeBox(0.4, 0.4, 0.15, 0x33AA55, 3.5, 0.5, dz);
      hackPanel.userData.isHackPanel = true;
      hackPanel.userData.doorIndex = di;
      sg.add(hackPanel);
      state.doors.push({
        open: false,
        zPos: dz,
        hackPanel: hackPanel,
        mesh: panel,
        hacking: false,
        hackTimer: 0
      });
    }
  }

  function buildCameras(sg) {
    // Camera 1: crew quarters
    // Camera 2: control room
    var camPositions = [
      { x: 0, y: 1.9, z: -12, rx: 0 },
      { x: 0, y: 1.9, z:  3,  rx: 0 }
    ];
    state.cameras3d = [];
    state.cameraAngle = [];
    state.cameraDir = [];
    state.cameraDisabled = [];
    for (var ci = 0; ci < 2; ci++) {
      var cp = camPositions[ci];
      var camBody = makeBox(0.4, 0.25, 0.35, 0x334444, cp.x, cp.y, cp.z);
      camBody.userData.isCamera = true;
      camBody.userData.cameraIndex = ci;
      sg.add(camBody);
      // Lens
      var lens = makeCylinder(0.08, 0.08, 0.3, 6, 0x224455, cp.x, cp.y - 0.1, cp.z - 0.3);
      sg.add(lens);
      state.cameras3d.push({ body: camBody, lens: lens, x: cp.x, y: cp.y, z: cp.z });
      state.cameraAngle.push(0);
      state.cameraDir.push(1);
      state.cameraDisabled.push(false);
    }
  }

  function buildAlarmPanels(sg) {
    // One in each main area
    var panelPositions = [
      { x: -3, y: 0, z: -48 },
      { x: -3, y: 0, z: -30 },
      { x: -3, y: 0, z: -12 },
      { x: -4, y: 0, z:   3 }
    ];
    state.alarmPanels = [];
    for (var ai = 0; ai < panelPositions.length; ai++) {
      var ap = panelPositions[ai];
      var panel = makeBox(0.5, 0.5, 0.15, 0xFF2200, ap.x, ap.y + 1, ap.z);
      panel.userData.isAlarmPanel = true;
      panel.userData.panelIndex = ai;
      sg.add(panel);
      state.alarmPanels.push({ mesh: panel, destroyed: false, x: ap.x, y: ap.y + 1, z: ap.z });
    }
  }

  function buildCrew(sg) {
    // 18 crew in various compartments
    state.crew = [];
    state.crewMeshes = [];
    // Torpedo room: 4 crew
    var torpCrew = [
      { x: -2, z: -46 }, { x: 2, z: -46 }, { x: -2, z: -54 }, { x: 2, z: -54 }
    ];
    // Engine room: 3 engineers
    var engCrew = [
      { x: -1, z: -28 }, { x: 1, z: -28 }, { x: 0, z: -32 }
    ];
    // Crew quarters: 6 sleeping
    var qCrew = [
      { x: -2.5, z: -8 }, { x: 2.5, z: -8 },
      { x: -2.5, z: -11 }, { x: 2.5, z: -11 },
      { x: -2.5, z: -14 }, { x: 2.5, z: -14 }
    ];
    // Control room: 4 officers
    var ctlCrew = [
      { x: -3, z: 0 }, { x: 3, z: 0 }, { x: -3, z: 5 }, { x: 3, z: 5 }
    ];
    // All combined
    var allCrew = [];
    for (var i = 0; i < torpCrew.length; i++) {
      allCrew.push({ x: torpCrew[i].x, z: torpCrew[i].z, hp: 60, isOfficer: false, sleeping: false, patrolAngle: Math.random() * Math.PI * 2 });
    }
    for (var i = 0; i < engCrew.length; i++) {
      allCrew.push({ x: engCrew[i].x, z: engCrew[i].z, hp: 60, isOfficer: false, sleeping: false, patrolAngle: Math.random() * Math.PI * 2 });
    }
    for (var i = 0; i < qCrew.length; i++) {
      allCrew.push({ x: qCrew[i].x, z: qCrew[i].z, hp: 60, isOfficer: false, sleeping: true, patrolAngle: 0 });
    }
    for (var i = 0; i < ctlCrew.length; i++) {
      allCrew.push({ x: ctlCrew[i].x, z: ctlCrew[i].z, hp: 80, isOfficer: true, sleeping: false, patrolAngle: Math.random() * Math.PI * 2 });
    }
    // Remaining 1 more to reach 18
    allCrew.push({ x: 0, z: -3, hp: 80, isOfficer: true, sleeping: false, patrolAngle: 0 });

    for (var ci = 0; ci < allCrew.length; ci++) {
      var cd = allCrew[ci];
      var color = cd.isOfficer ? 0x445566 : 0x334455;
      var crewMesh = makeBox(0.6, 1.4, 0.4, color, cd.x, 0, cd.z);
      crewMesh.userData.crewIndex = ci;
      crewMesh.userData.isCrew = true;
      sg.add(crewMesh);
      state.crew.push({
        x: cd.x, y: 0, z: cd.z,
        hp: cd.hp, maxHp: cd.hp,
        isOfficer: cd.isOfficer,
        sleeping: cd.sleeping,
        alerted: false,
        dead: false,
        patrolAngle: cd.patrolAngle,
        patrolTimer: Math.random() * 3,
        mesh: crewMesh
      });
      state.crewMeshes.push(crewMesh);
    }
  }

  function buildFirstOfficer(sg) {
    var fo = makeBox(0.65, 1.5, 0.45, 0x334477, 3, 0, -22);
    fo.userData.isFirstOfficer = true;
    sg.add(fo);
    state.firstOfficerMesh = fo;
  }

  function buildCaptain(sg) {
    var cap = makeBox(0.7, 1.6, 0.5, 0x443322, 0, 0, 19);
    cap.userData.isCaptain = true;
    sg.add(cap);
    state.captainMesh = cap;
  }

  function buildSafe(sg) {
    var safe = makeBox(0.8, 0.8, 0.8, 0x445544, -1.5, -0.6, 17);
    safe.userData.isSafe = true;
    sg.add(safe);
    state.safeMesh = safe;
    // Nuclear code case (hidden until safe opens)
    var code = makeSphere(0.25, 0x44AAFF, -1.5, -0.1, 17);
    code.userData.isCode = true;
    code.visible = false;
    sg.add(code);
    state.codeMesh = code;
  }

  // ─── Flood mechanics ──────────────────────────────────────────────────────────
  function startFloodCompartment(compKey) {
    if (state.floodedCompartments[compKey]) { return; }
    state.floodedCompartments[compKey] = true;
    state.floodLevel[compKey] = -2;
    var comp = COMP[compKey];
    var w = (compKey === 'control') ? 10 : 8;
    var len = comp.zMax - comp.zMin;
    var midZ = (comp.zMin + comp.zMax) / 2;
    var waterMesh = makeBox(w - 0.3, 0.1, len - 0.3, 0x224466, 0, state.floodLevel[compKey], midZ);
    waterMesh.material.transparent = true;
    waterMesh.material.opacity = 0.65;
    state.subGroup.add(waterMesh);
    state.floodMeshes[compKey] = waterMesh;
  }

  function updateFlood(dt) {
    for (var k in state.floodedCompartments) {
      if (!state.floodedCompartments[k]) { continue; }
      state.floodLevel[k] += FLOOD_RATE * dt;
      if (state.floodLevel[k] > 3) { state.floodLevel[k] = 3; }
      if (state.floodMeshes[k]) {
        state.floodMeshes[k].position.y = state.floodLevel[k];
      }
      // Damage player if in this compartment and flood deep enough
      var compZ = COMP[k];
      var pz = state.playerPos.z;
      if (pz >= compZ.zMin && pz < compZ.zMax) {
        var py = state.playerPos.y;
        if (py - 1.7 < state.floodLevel[k] - FLOOD_DAMAGE_DEPTH) {
          state.playerHP -= FLOOD_DAMAGE_RATE * dt;
          showPrompt('FLOODING! MOVE!');
        }
      }
    }
  }

  // ─── Camera detection ─────────────────────────────────────────────────────────
  function updateSecurityCameras(dt) {
    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      if (state.cameraDisabled[ci]) { continue; }
      state.cameraAngle[ci] += CAMERA_SWEEP_SPEED * state.cameraDir[ci] * dt;
      if (state.cameraAngle[ci] > Math.PI / 2) {
        state.cameraAngle[ci] = Math.PI / 2;
        state.cameraDir[ci] = -1;
      } else if (state.cameraAngle[ci] < -Math.PI / 2) {
        state.cameraAngle[ci] = -Math.PI / 2;
        state.cameraDir[ci] = 1;
      }
      // Rotate camera body to show sweep
      var camData = state.cameras3d[ci];
      if (camData.body) {
        camData.body.rotation.y = state.cameraAngle[ci];
      }
      // Check if player is in camera cone
      if (!state.alarmTriggered) {
        var camX = camData.x, camZ = camData.z;
        var pX = state.playerPos.x, pZ = state.playerPos.z;
        var toCamX = pX - camX, toCamZ = pZ - camZ;
        var distToCam = Math.sqrt(toCamX * toCamX + toCamZ * toCamZ);
        if (distToCam < 8) {
          // Camera faces -Z direction, rotated by angle
          var camFacingX = Math.sin(state.cameraAngle[ci]);
          var camFacingZ = -Math.cos(state.cameraAngle[ci]);
          var dot = (toCamX * camFacingX + toCamZ * camFacingZ);
          var lenP = distToCam;
          if (lenP > 0.1) {
            var cosAngle = dot / lenP;
            if (cosAngle > 0.7) { // within ~45 deg cone
              triggerAlarm('CAMERA SPOTTED YOU');
            }
          }
        }
      }
    }
  }

  // ─── Motion detector ─────────────────────────────────────────────────────────
  function checkMotionDetector() {
    if (state.motionTriggered || state.alarmTriggered) { return; }
    var mx = 0, mz = -12;
    var pdist = dist2D(state.playerPos.x, state.playerPos.z, mx, mz);
    if (pdist < 4 && state.running) {
      state.motionTriggered = true;
      triggerAlarm('MOTION DETECTOR TRIGGERED');
    }
  }

  // ─── Alarm ───────────────────────────────────────────────────────────────────
  function triggerAlarm(reason) {
    if (state.alarmTriggered) { return; }
    state.alarmTriggered = true;
    state.stealthActive = false;
    showPrompt('ALARM: ' + reason + ' — BULKHEADS SEALING!');
    // Wake sleeping crew
    for (var ci = 0; ci < state.crew.length; ci++) {
      var c = state.crew[ci];
      if (c.sleeping && !c.dead) {
        c.sleeping = false;
        c.alerted = true;
      }
    }
    // Captain becomes alerted
    state.captainAlerted = true;
    // Seal opened doors (the 3 bulkhead doors re-close if alarm)
    for (var di = 0; di < state.doors.length; di++) {
      if (state.doors[di].open) {
        state.doors[di].open = false;
        if (state.doors[di].mesh) {
          state.doors[di].mesh.visible = true;
        }
      }
    }
    // Start dive
    if (!state.divingStarted) {
      state.divingStarted = true;
    }
  }

  // ─── Interact system ─────────────────────────────────────────────────────────
  function checkInteractTargets() {
    var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;
    state.interactPossible = false;
    state.stealthKillPossible = false;
    state.interactTarget = null;
    state.stealthKillTarget = null;

    // Check bulkhead doors
    for (var di = 0; di < state.doors.length; di++) {
      var door = state.doors[di];
      if (!door.open) {
        var d = Math.abs(pz - door.zPos);
        if (d < INTERACT_DIST && Math.abs(px) < 4) {
          state.interactPossible = true;
          state.interactTarget = { type: 'door', index: di };
          showPrompt('[E] Hack door lock (4s)');
          return;
        }
      }
    }

    // Check safe
    if (!state.safeOpen && !state.codesSecured) {
      var sd = dist3D(px, py, pz, -1.5, -0.1, 17);
      if (sd < INTERACT_DIST) {
        if (state.hasKeycard) {
          state.interactPossible = true;
          state.interactTarget = { type: 'safe_keycard' };
          showPrompt('[E] Use keycard on safe');
        } else {
          state.interactPossible = true;
          state.interactTarget = { type: 'safe' };
          showPrompt('[E] Hold to crack safe (6s)');
        }
        return;
      }
    }

    // Nuclear code pickup
    if (state.safeOpen && !state.codesSecured && state.codeMesh && state.codeMesh.visible) {
      var cd = dist3D(px, py, pz, -1.5, -0.1, 17);
      if (cd < INTERACT_DIST) {
        state.interactPossible = true;
        state.interactTarget = { type: 'code' };
        showPrompt('[E] Pick up nuclear codes');
        return;
      }
    }

    // Escape hatch
    if (state.codesSecured) {
      var ed = dist3D(px, py, pz,
        state.escapeHatchPos.x, state.escapeHatchPos.y, state.escapeHatchPos.z);
      if (ed < INTERACT_DIST + 1.5) {
        state.interactPossible = true;
        state.interactTarget = { type: 'escape' };
        showPrompt('[E] ESCAPE — Open hatch and surface!');
        return;
      }
    }

    // First officer (keycard)
    if (!state.firstOfficerDead && !state.hasKeycard && state.firstOfficerMesh) {
      var fod = dist3D(px, py, pz,
        state.firstOfficerPos.x, state.firstOfficerPos.y, state.firstOfficerPos.z);
      if (fod < STEALTH_KILL_DIST) {
        state.stealthKillPossible = true;
        state.stealthKillTarget = { type: 'firstOfficer' };
        showPrompt('[E] Stealth kill — take keycard');
        return;
      }
    }

    // Crew stealth kill
    for (var ci = 0; ci < state.crew.length; ci++) {
      var c = state.crew[ci];
      if (c.dead) { continue; }
      var cd2 = dist3D(px, py, pz, c.x, c.y + 0.7, c.z);
      if (cd2 < STEALTH_KILL_DIST) {
        // Check if approaching from behind
        var facingX = Math.sin(state.playerYaw);
        var facingZ = -Math.cos(state.playerYaw);
        var toCX = c.x - px, toCZ = c.z - pz;
        var len2 = Math.sqrt(toCX * toCX + toCZ * toCZ);
        var dot2 = 0;
        if (len2 > 0.01) {
          dot2 = (facingX * toCX + facingZ * toCZ) / len2;
        }
        if (dot2 > 0.5) {
          state.stealthKillPossible = true;
          state.stealthKillTarget = { type: 'crew', index: ci };
          showPrompt('[E] Stealth kill (from behind)');
          return;
        }
      }
    }

    // Captain stealth kill / fight
    if (state.captainMesh && !state.captainMesh.userData.dead) {
      var capd = dist3D(px, py, pz, state.captainPos.x, state.captainPos.y + 0.8, state.captainPos.z);
      if (capd < STEALTH_KILL_DIST) {
        var facingX2 = Math.sin(state.playerYaw);
        var facingZ2 = -Math.cos(state.playerYaw);
        var toCX2 = state.captainPos.x - px, toCZ2 = state.captainPos.z - pz;
        var len3 = Math.sqrt(toCX2 * toCX2 + toCZ2 * toCZ2);
        var dot3 = 0;
        if (len3 > 0.01) { dot3 = (facingX2 * toCX2 + facingZ2 * toCZ2) / len3; }
        if (dot3 > 0.5 && !state.captainAlerted) {
          state.stealthKillPossible = true;
          state.stealthKillTarget = { type: 'captain' };
          showPrompt('[E] Stealth kill captain');
          return;
        }
      }
    }

    clearPrompt();
  }

  function doInteract() {
    var now = performance.now ? performance.now() : Date.now();
    if (now - state.lastInteractTime < 400) { return; }
    state.lastInteractTime = now;

    // Stealth kill takes priority
    if (state.stealthKillPossible && state.stealthKillTarget) {
      var t = state.stealthKillTarget;
      if (t.type === 'crew') {
        var c = state.crew[t.index];
        c.dead = true;
        c.mesh.visible = false;
        state.crewCount = Math.max(0, state.crewCount - 1);
      } else if (t.type === 'firstOfficer') {
        state.firstOfficerDead = true;
        state.firstOfficerMesh.visible = false;
        state.hasKeycard = true;
        showPrompt('KEYCARD OBTAINED!');
      } else if (t.type === 'captain') {
        state.captainMesh.userData.dead = true;
        state.captainMesh.visible = false;
        state.captainHP = 0;
        showPrompt('CAPTAIN ELIMINATED (STEALTH)');
      }
      return;
    }

    if (!state.interactPossible || !state.interactTarget) { return; }
    var target = state.interactTarget;

    if (target.type === 'door') {
      var door = state.doors[target.index];
      if (!door.hacking) {
        door.hacking = true;
        door.hackTimer = 0;
        state.hackingDoor = true;
        state.hackTargetDoor = target.index;
        showPrompt('Hacking... hold [E]');
      }
    } else if (target.type === 'safe') {
      if (!state.safeCracking) {
        state.safeCracking = true;
        state.safeCrackTimer = 0;
        showPrompt('Cracking safe... hold [E]');
      }
    } else if (target.type === 'safe_keycard') {
      // Instant open with keycard
      openSafe();
    } else if (target.type === 'code') {
      state.codesSecured = true;
      if (state.codeMesh) { state.codeMesh.visible = false; }
      showPrompt('NUCLEAR CODES SECURED! REACH ESCAPE HATCH!');
    } else if (target.type === 'escape') {
      triggerEscape();
    }
  }

  function openSafe() {
    state.safeOpen = true;
    state.safeCracking = false;
    if (state.safeMesh) { state.safeMesh.visible = false; }
    if (state.codeMesh) { state.codeMesh.visible = true; }
    showPrompt('SAFE OPEN — grab the nuclear codes!');
  }

  function triggerEscape() {
    if (!state.codesSecured) { return; }
    if (state.divingStarted && state.diveProgress > 0.8) {
      // Too late
      endMission(false, 'SUB SUBMERGED — ESCAPE IMPOSSIBLE');
      return;
    }
    state.missionClear = true;
    endMission(true, 'MISSION COMPLETE — CODES SECURED AND ESCAPED!');
  }

  // ─── Shooting ────────────────────────────────────────────────────────────────
  function shoot() {
    if (!state.canShoot) { return; }
    state.canShoot = false;
    state.shootCooldown = SHOOT_INTERVAL;

    var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;
    var yaw = state.playerYaw, pitch = state.playerPitch;
    var dirX = Math.sin(yaw) * Math.cos(pitch);
    var dirY = -Math.sin(pitch);
    var dirZ = -Math.cos(yaw) * Math.cos(pitch);

    var bulletMesh = makeBox(0.08, 0.08, 0.4, 0xFFCC44, px, py, pz);
    state.subGroup.add(bulletMesh);
    state.bullets.push({
      x: px, y: py, z: pz,
      dx: dirX, dy: dirY, dz: dirZ,
      mesh: bulletMesh,
      life: 2.0
    });

    // Silenced: no alarm if stealth active (assuming silenced weapons)
  }

  function updateBullets(dt) {
    for (var bi = state.bullets.length - 1; bi >= 0; bi--) {
      var b = state.bullets[bi];
      b.x += b.dx * BULLET_SPEED * dt;
      b.y += b.dy * BULLET_SPEED * dt;
      b.z += b.dz * BULLET_SPEED * dt;
      b.life -= dt;
      if (b.mesh) {
        b.mesh.position.set(b.x, b.y, b.z);
      }

      var hit = false;

      // Check crew
      for (var ci = 0; ci < state.crew.length; ci++) {
        var c = state.crew[ci];
        if (c.dead) { continue; }
        var bcd = dist3D(b.x, b.y, b.z, c.x, c.y + 0.7, c.z);
        if (bcd < 0.7) {
          c.hp -= 30;
          if (c.hp <= 0) {
            c.dead = true;
            c.mesh.visible = false;
            state.crewCount = Math.max(0, state.crewCount - 1);
          } else {
            // Not stealth
            if (!state.alarmTriggered) { triggerAlarm('CREW ALERTED BY GUNFIRE'); }
            c.alerted = true;
          }
          hit = true;
          break;
        }
      }

      // Check captain
      if (!hit && state.captainMesh && !state.captainMesh.userData.dead) {
        var capd2 = dist3D(b.x, b.y, b.z,
          state.captainPos.x, state.captainPos.y + 0.8, state.captainPos.z);
        if (capd2 < 0.8) {
          state.captainHP -= 30;
          if (!state.alarmTriggered) { triggerAlarm('GUNFIRE IN CAPTAIN\'S QUARTERS'); }
          if (state.captainHP <= 0) {
            state.captainMesh.userData.dead = true;
            state.captainMesh.visible = false;
          }
          hit = true;
        }
      }

      // Check first officer
      if (!hit && !state.firstOfficerDead && state.firstOfficerMesh) {
        var fod2 = dist3D(b.x, b.y, b.z,
          state.firstOfficerPos.x, state.firstOfficerPos.y + 0.75, state.firstOfficerPos.z);
        if (fod2 < 0.7) {
          if (!state.firstOfficerDead) {
            state.firstOfficerDead = true;
            state.firstOfficerMesh.visible = false;
            state.hasKeycard = true;
            showPrompt('First officer down — KEYCARD OBTAINED!');
          }
          if (!state.alarmTriggered) { triggerAlarm('GUNFIRE DETECTED'); }
          hit = true;
        }
      }

      // Check alarm panels
      if (!hit) {
        for (var api = 0; api < state.alarmPanels.length; api++) {
          var ap = state.alarmPanels[api];
          if (ap.destroyed) { continue; }
          var apd = dist3D(b.x, b.y, b.z, ap.x, ap.y, ap.z);
          if (apd < 0.5) {
            ap.destroyed = true;
            ap.mesh.visible = false;
            hit = true;
            showPrompt('Alarm panel destroyed');
            break;
          }
        }
      }

      if (hit || b.life <= 0) {
        if (b.mesh) {
          state.subGroup.remove(b.mesh);
        }
        state.bullets.splice(bi, 1);
      }
    }
  }

  // ─── Crew AI ─────────────────────────────────────────────────────────────────
  function updateCrew(dt) {
    for (var ci = 0; ci < state.crew.length; ci++) {
      var c = state.crew[ci];
      if (c.dead || c.sleeping) { continue; }

      if (state.alarmTriggered || c.alerted) {
        // Move toward player
        var dx = state.playerPos.x - c.x;
        var dz = state.playerPos.z - c.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1.5) {
          c.x += (dx / dist) * 1.8 * dt;
          c.z += (dz / dist) * 1.8 * dt;
          c.mesh.position.set(c.x, c.y, c.z);
        } else {
          // Attack player
          state.playerHP -= 10 * dt;
        }
      } else {
        // Patrol
        c.patrolTimer -= dt;
        if (c.patrolTimer <= 0) {
          c.patrolAngle += (Math.random() - 0.5) * Math.PI;
          c.patrolTimer = 2 + Math.random() * 2;
        }
        var pdx = Math.sin(c.patrolAngle) * 1.5 * dt;
        var pdz = Math.cos(c.patrolAngle) * 1.5 * dt;
        var nx = c.x + pdx, nz = c.z + pdz;
        // Keep in sub bounds
        if (Math.abs(nx) < 3.5) { c.x = nx; }
        if (nz > -58 && nz < 25) { c.z = nz; }
        c.mesh.position.set(c.x, c.y, c.z);

        // Spot player
        var sdx = state.playerPos.x - c.x;
        var sdz = state.playerPos.z - c.z;
        var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
        if (sdist < 4) {
          c.alerted = true;
          if (!state.alarmTriggered) { triggerAlarm('CREW SPOTTED YOU'); }
        }
      }
    }
  }

  // ─── Captain AI ──────────────────────────────────────────────────────────────
  function updateCaptain(dt) {
    if (!state.captainMesh || state.captainMesh.userData.dead) { return; }

    if (state.captainAlerted) {
      // Move toward player if close
      var dx = state.playerPos.x - state.captainPos.x;
      var dz = state.playerPos.z - state.captainPos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 2.0) {
        state.captainPos.x += (dx / dist) * 2.5 * dt;
        state.captainPos.z += (dz / dist) * 2.5 * dt;
        state.captainMesh.position.set(state.captainPos.x, 0, state.captainPos.z);
      } else {
        // Attack player
        state.playerHP -= 20 * dt;
      }
      // Flood compartment if player gets close
      state.captainFloodTimer += dt;
      if (state.captainFloodTimer > 5 && !state.captainFlooding) {
        state.captainFlooding = true;
        startFloodCompartment('captain');
        showPrompt('CAPTAIN OPENED EMERGENCY FLOOD VALVE!');
      }
    }
  }

  // ─── Hacking & Cracking ──────────────────────────────────────────────────────
  function updateHackAndCrack(dt) {
    // Door hacking (hold E)
    if (state.hackingDoor && state.hackTargetDoor !== null) {
      var door = state.doors[state.hackTargetDoor];
      if (door && !door.open) {
        door.hackTimer += dt;
        if (door.hackTimer >= hackDoorDuration()) {
          door.open = true;
          door.hacking = false;
          if (door.mesh) { door.mesh.visible = false; }
          state.doorsOpened++;
          state.hackingDoor = false;
          state.hackTargetDoor = null;
          showPrompt('DOOR HACKED! (' + state.doorsOpened + '/3)');
        }
      } else {
        state.hackingDoor = false;
        state.hackTargetDoor = null;
      }
    }

    // Safe cracking (hold E)
    if (state.safeCracking && !state.safeOpen) {
      state.safeCrackTimer += dt;
      if (state.safeCrackTimer >= state.safeCrackDuration) {
        openSafe();
      }
    }
  }

  function hackDoorDuration() { return 4; }

  // ─── Engine room damage ───────────────────────────────────────────────────────
  function checkEngineRoom(dt) {
    var pz = state.playerPos.z;
    if (pz >= COMP.engine.zMin && pz < COMP.engine.zMax) {
      state.inEngineRoom = true;
      state.engineRoomTimer += dt;
      if (state.engineRoomTimer > 0.5) {
        state.playerHP -= HOT_PIPE_DAMAGE * dt;
        showPrompt('HOT PIPES — 3HP/s DAMAGE!');
      }
    } else {
      state.inEngineRoom = false;
      state.engineRoomTimer = 0;
    }
  }

  // ─── Dive mechanic ───────────────────────────────────────────────────────────
  function updateDive(dt) {
    if (!state.divingStarted) { return; }

    state.diveProgress += dt / DIVE_FULL_TIME;
    if (state.diveProgress >= 1) {
      state.diveProgress = 1;
      // Fully submerged — lose condition
      if (!state.missionClear && !state.missionFailed) {
        endMission(false, 'SUB FULLY SUBMERGED — MISSION FAILED');
      }
    }

    // Tilt angle: 0 -> 10 degrees
    state.diveTiltAngle = state.diveProgress * (10 * Math.PI / 180);
    state.subGroup.rotation.z = state.diveTiltAngle;

    // Water rises around sub
    state.waterY = -5 + state.diveProgress * 15;
  }

  // ─── Player movement ─────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.missionFailed || state.missionClear) { return; }

    var speed = state.running ? RUN_SPEED : WALK_SPEED;
    var yaw = state.playerYaw;
    var fwdX = Math.sin(yaw), fwdZ = -Math.cos(yaw);
    var rgtX = Math.cos(yaw), rgtZ = Math.sin(yaw);

    var moveX = 0, moveZ = 0;
    if (state.moveKeys['KeyW'] || state.moveKeys['ArrowUp'])    { moveX += fwdX; moveZ += fwdZ; }
    if (state.moveKeys['KeyS'] || state.moveKeys['ArrowDown'])  { moveX -= fwdX; moveZ -= fwdZ; }
    if (state.moveKeys['KeyA'] || state.moveKeys['ArrowLeft'])  { moveX -= rgtX; moveZ -= rgtZ; }
    if (state.moveKeys['KeyD'] || state.moveKeys['ArrowRight']) { moveX += rgtX; moveZ += rgtZ; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len; moveZ /= len;
      state.playerPos.x += moveX * speed * dt;
      state.playerPos.z += moveZ * speed * dt;
    }

    // Keep player inside sub bounds (roughly)
    if (state.playerPos.x < -3.5) { state.playerPos.x = -3.5; }
    if (state.playerPos.x > 3.5) { state.playerPos.x = 3.5; }
    if (state.playerPos.z < -59) { state.playerPos.z = -59; }
    if (state.playerPos.z > 24) { state.playerPos.z = 24; }

    // Running detection
    state.running = !!(state.moveKeys['ShiftLeft'] || state.moveKeys['ShiftRight']);

    // Door blocking
    for (var di = 0; di < state.doors.length; di++) {
      var door = state.doors[di];
      if (!door.open) {
        var dz = door.zPos;
        if (state.playerPos.z < dz + 0.4 && state.playerPos.z > dz - 0.4) {
          // Push player back
          state.playerPos.z = dz + (state.playerPos.z > dz ? 0.5 : -0.5);
        }
      }
    }

    // Update camera
    state.camera.position.set(
      state.playerPos.x, state.playerPos.y, state.playerPos.z
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    // HP clamp
    if (state.playerHP > state.playerMaxHP) { state.playerHP = state.playerMaxHP; }
    if (state.playerHP <= 0) {
      endMission(false, 'YOU DIED');
    }
  }

  // ─── Shoot cooldown ──────────────────────────────────────────────────────────
  function updateShootCooldown(dt) {
    if (!state.canShoot) {
      state.shootCooldown -= dt;
      if (state.shootCooldown <= 0) { state.canShoot = true; }
    }
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function updateHUD() {
    if (!state.hudEl) { return; }
    var doorsStr = state.doorsOpened + '/3 OPEN';
    var stealthStr = state.stealthActive ? 'ACTIVE' : 'BLOWN';
    var codesStr = state.codesSecured ? 'SECURED' : 'UNSECURED';
    var diveStr = 'SURFACED';
    if (state.divingStarted) {
      if (state.alarmTriggered) {
        var secs = Math.max(0, Math.ceil(state.alarmTimer));
        diveStr = 'EMERGENCY DIVE ' + secs + 's';
      } else {
        var remaining = Math.max(0, DIVE_FULL_TIME - state.diveProgress * DIVE_FULL_TIME);
        diveStr = 'DIVING ' + Math.ceil(remaining) + 's';
      }
    } else if (!state.alarmTriggered) {
      diveStr = 'SURFACED ' + toMM_SS(Math.max(0, state.surfacedTimer));
    }
    var crewStr = state.crewCount;
    var hp = Math.max(0, Math.ceil(state.playerHP));
    state.hudEl.textContent =
      'SUBMARINE HEIST  ' +
      '[DOORS: ' + doorsStr + ']  ' +
      '[STEALTH: ' + stealthStr + ']  ' +
      '[CODES: ' + codesStr + ']  ' +
      '[DIVE: ' + diveStr + ']  ' +
      '[CREW: ' + crewStr + ']  ' +
      '[HP: ' + hp + ']';
  }

  function showPrompt(msg) {
    if (!state.promptEl) { return; }
    state.promptEl.textContent = msg;
    state.promptEl.style.opacity = '1';
  }

  function clearPrompt() {
    if (!state.promptEl) { return; }
    state.promptEl.textContent = '';
    state.promptEl.style.opacity = '0';
  }

  // ─── End Mission ─────────────────────────────────────────────────────────────
  function endMission(win, msg) {
    if (state.missionFailed || state.missionClear) { return; }
    if (win) { state.missionClear = true; }
    else { state.missionFailed = true; }
    if (state.endEl) {
      state.endEl.style.display = 'flex';
      state.endEl.innerHTML =
        '<div style="text-align:center">' +
        '<div style="font-size:2em;color:' + (win ? '#44FF88' : '#FF4422') + ';margin-bottom:16px">' +
        (win ? 'MISSION COMPLETE' : 'MISSION FAILED') +
        '</div>' +
        '<div style="font-size:1em;color:#88CCFF;margin-bottom:24px">' + msg + '</div>' +
        '<button id="sh-restart" style="padding:10px 30px;font-size:1em;background:#224466;color:#fff;border:1px solid #44AAFF;cursor:pointer">RETRY</button>' +
        '</div>';
      var btn = document.getElementById('sh-restart');
      if (btn) { btn.addEventListener('click', function () { reset(); init(); }); }
    }
  }

  // ─── Main update loop ─────────────────────────────────────────────────────────
  function update(dt) {
    if (!state.active || state.missionFailed || state.missionClear) { return; }

    // Timers
    if (!state.alarmTriggered) {
      state.surfacedTimer -= dt;
      if (state.surfacedTimer <= 0) {
        state.surfacedTimer = 0;
        if (!state.divingStarted) {
          state.divingStarted = true;
          showPrompt('CREW ROTATION COMPLETE — SUB DIVING!');
        }
      }
    } else {
      state.alarmTimer -= dt;
      if (state.alarmTimer <= 0) {
        state.alarmTimer = 0;
        if (!state.divingStarted) {
          state.divingStarted = true;
        }
      }
    }

    updatePlayer(dt);
    updateShootCooldown(dt);
    updateBullets(dt);
    updateCrew(dt);
    updateCaptain(dt);
    updateSecurityCameras(dt);
    checkMotionDetector();
    updateHackAndCrack(dt);
    checkEngineRoom(dt);
    updateFlood(dt);
    updateDive(dt);
    checkInteractTargets();
    updateHUD();

    // Animate nuclear code glow
    if (state.codeMesh && state.codeMesh.visible) {
      var t = (performance.now ? performance.now() : Date.now()) / 1000;
      state.codeMesh.position.y = -0.1 + Math.sin(t * 2) * 0.08;
      state.codeMesh.material.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.3;
    }
  }

  function gameLoop(timestamp) {
    state.animFrameId = requestAnimationFrame(gameLoop);
    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;
    update(dt);
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    if (state.active) { return; }
    state.active = true;

    // ── Renderer ──
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x112233);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '9000';
    state.renderer = renderer;

    // ── Scene ──
    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.Fog(0x112233, 30, 100);

    // ── Camera ──
    state.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 200
    );
    state.camera.position.set(0, 1.7, 32);
    state.scene.add(state.camera);

    // ── Sub group (for tilt) ──
    state.subGroup = new THREE.Group();
    state.scene.add(state.subGroup);

    // ── Build scene ──
    buildScene();

    // ── HUD ──
    var hudEl = document.createElement('div');
    hudEl.style.cssText =
      'position:fixed;top:10px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,20,40,0.85);color:#44FFAA;font-family:monospace;' +
      'font-size:12px;padding:6px 12px;border:1px solid #224466;' +
      'z-index:9100;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(hudEl);
    state.hudEl = hudEl;

    // ── Prompt ──
    var promptEl = document.createElement('div');
    promptEl.style.cssText =
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,20,40,0.8);color:#88FFCC;font-family:monospace;' +
      'font-size:14px;padding:6px 14px;border:1px solid #336655;' +
      'z-index:9100;pointer-events:none;opacity:0;transition:opacity 0.2s;';
    document.body.appendChild(promptEl);
    state.promptEl = promptEl;

    // ── End overlay ──
    var endEl = document.createElement('div');
    endEl.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'background:rgba(0,10,20,0.92);z-index:9200;' +
      'display:none;align-items:center;justify-content:center;' +
      'font-family:monospace;';
    document.body.appendChild(endEl);
    state.endEl = endEl;

    // ── Crosshair ──
    var xhair = document.createElement('div');
    xhair.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:16px;height:16px;pointer-events:none;z-index:9150;';
    xhair.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16">' +
      '<line x1="8" y1="2" x2="8" y2="14" stroke="#44FFAA" stroke-width="1"/>' +
      '<line x1="2" y1="8" x2="14" y2="8" stroke="#44FFAA" stroke-width="1"/>' +
      '</svg>';
    document.body.appendChild(xhair);
    state.crosshairEl = xhair;

    // ── Pointer lock ──
    var canvas = renderer.domElement;
    state.clickHandler = function () {
      if (!state.pointerLocked) { canvas.requestPointerLock(); }
      else { shoot(); }
    };
    canvas.addEventListener('click', state.clickHandler);

    state.pointerlockHandler = function () {
      state.pointerLocked = !!document.pointerLockElement;
    };
    document.addEventListener('pointerlockchange', state.pointerlockHandler);

    // ── Mouse move ──
    state.mousemoveHandler = function (e) {
      if (!state.pointerLocked) { return; }
      state.playerYaw   -= e.movementX * 0.0018;
      state.playerPitch -= e.movementY * 0.0018;
      if (state.playerPitch > Math.PI / 2.5) { state.playerPitch = Math.PI / 2.5; }
      if (state.playerPitch < -Math.PI / 2.5) { state.playerPitch = -Math.PI / 2.5; }
    };
    document.addEventListener('mousemove', state.mousemoveHandler);

    // ── Key listeners ──
    state.keydownHandler = function (e) {
      state.moveKeys[e.code] = true;
      if (e.code === 'KeyE') { doInteract(); }
      if (e.code === 'Escape') { reset(); }
    };
    state.keyupHandler = function (e) {
      state.moveKeys[e.code] = false;
    };
    document.addEventListener('keydown', state.keydownHandler);
    document.addEventListener('keyup', state.keyupHandler);

    // ── Resize ──
    window.addEventListener('resize', function () {
      if (!state.active) { return; }
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    });

    // ── Start loop ──
    state.lastTime = performance.now ? performance.now() : Date.now();
    gameLoop(state.lastTime);

    showPrompt('INFILTRATE THE SUBMARINE — STEAL THE NUCLEAR CODES!  [WASD] Move  [E] Interact  [Click] Shoot  [Shift] Run  [Esc] Exit');
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────
  function reset() {
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    if (state.renderer) {
      document.body.removeChild(state.renderer.domElement);
      state.renderer.dispose();
      state.renderer = null;
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
    if (state.crosshairEl && state.crosshairEl.parentNode) {
      state.crosshairEl.parentNode.removeChild(state.crosshairEl);
      state.crosshairEl = null;
    }

    if (state.keydownHandler) {
      document.removeEventListener('keydown', state.keydownHandler);
      state.keydownHandler = null;
    }
    if (state.keyupHandler) {
      document.removeEventListener('keyup', state.keyupHandler);
      state.keyupHandler = null;
    }
    if (state.mousemoveHandler) {
      document.removeEventListener('mousemove', state.mousemoveHandler);
      state.mousemoveHandler = null;
    }
    if (state.pointerlockHandler) {
      document.removeEventListener('pointerlockchange', state.pointerlockHandler);
      state.pointerlockHandler = null;
    }

    // Reset all state values
    state.sDown = false;
    state.hDown = false;
    state.sDownTime = 0;
    state.hDownTime = 0;
    state.scene = null;
    state.camera = null;
    state.subGroup = null;
    state.playerPos = { x: 0, y: 1.7, z: 32 };
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.playerHP = 100;
    state.moveKeys = {};
    state.pointerLocked = false;
    state.running = false;
    state.missionFailed = false;
    state.missionClear = false;
    state.surfacedTimer = 480;
    state.alarmTriggered = false;
    state.alarmTimer = 180;
    state.divingStarted = false;
    state.diveProgress = 0;
    state.diveTiltAngle = 0;
    state.stealthActive = true;
    state.hasKeycard = false;
    state.doorsOpened = 0;
    state.codesSecured = false;
    state.safeCracking = false;
    state.safeCrackTimer = 0;
    state.safeOpen = false;
    state.safeMesh = null;
    state.codeMesh = null;
    state.hackingDoor = false;
    state.hackDoorTimer = 0;
    state.hackTargetDoor = null;
    state.crew = [];
    state.crewMeshes = [];
    state.crewCount = 18;
    state.cameras3d = [];
    state.cameraAngle = [];
    state.cameraDir = [];
    state.cameraDisabled = [];
    state.motionDetectorMesh = null;
    state.motionTriggered = false;
    state.alarmPanels = [];
    state.floodedCompartments = {};
    state.floodMeshes = {};
    state.floodLevel = {};
    state.escapeHatchMesh = null;
    state.escapingNow = false;
    state.captainMesh = null;
    state.captainHP = 300;
    state.captainPos = { x: 0, y: 1, z: -46 };
    state.captainAlerted = false;
    state.captainFlooding = false;
    state.captainFloodTimer = 0;
    state.doors = [];
    state.doorMeshes = [];
    state.firstOfficerMesh = null;
    state.firstOfficerHP = 80;
    state.firstOfficerPos = { x: 3, y: 1, z: -22 };
    state.firstOfficerDead = false;
    state.inEngineRoom = false;
    state.engineRoomTimer = 0;
    state.canShoot = true;
    state.shootCooldown = 0;
    state.bullets = [];
    state.bulletMeshes = [];
    state.stealthKillPossible = false;
    state.stealthKillTarget = null;
    state.interactPossible = false;
    state.interactTarget = null;
    state.lastInteractTime = 0;
    state.waterY = -20;
  }

  // ─── Activation (S + H within 400ms) ────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    var now = Date.now();

    if (e.code === 'KeyS') {
      state.sDown = true;
      state.sDownTime = now;
      if (state.hDown && (now - state.hDownTime) < 400) {
        if (!state.active) { init(); }
      }
    }
    if (e.code === 'KeyH') {
      state.hDown = true;
      state.hDownTime = now;
      if (state.sDown && (now - state.sDownTime) < 400) {
        if (!state.active) { init(); }
      }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (e.code === 'KeyS') { state.sDown = false; }
    if (e.code === 'KeyH') { state.hDown = false; }
  });

  return { init: init, update: update, reset: reset };

}());
