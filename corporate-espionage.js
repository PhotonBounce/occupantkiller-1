// corporate-espionage.js — Corporate Espionage Stealth Module for OccupantKiller
// IIFE pattern: window.CorporateEspionage
// Activation: C + E simultaneous keypress (both within 400ms)
// All var, no let/const, pure browser JS, THREE global assumed

window.CorporateEspionage = (function (window) {
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────

  var BUILDING_W        = 18;
  var BUILDING_H        = 24;
  var BUILDING_D        = 14;
  var FLOOR_HEIGHT      = 3;       // each storey
  var FLOOR_COUNT       = 8;

  var COLOR_BUILDING    = 0x445566;
  var COLOR_EXECUTIVE   = 0x334455; // executive badge / board member box
  var COLOR_GUARD       = 0x334433;
  var COLOR_ELEVATOR    = 0x888888;
  var COLOR_CAMERA      = 0xAAAAAA;
  var COLOR_SENSOR      = 0xFFAA00;
  var COLOR_DOG         = 0x886633;
  var COLOR_EMPLOYEE    = 0x9999BB;
  var COLOR_FLOOR_BASE  = 0x222233;
  var COLOR_FLOOR_ALT   = 0x223322;
  var COLOR_WALL        = 0x334455;
  var COLOR_BADGE_VIS   = 0xCCDD88; // visitor badge
  var COLOR_BADGE_EXEC  = 0x334455; // executive badge
  var COLOR_SCANNER     = 0xFF6600;
  var COLOR_SCANNER_OK  = 0x00FF66;
  var COLOR_SCANNER_ERR = 0xFF0000;
  var COLOR_TUNNEL      = 0x554433;
  var COLOR_PLAYER      = 0x44AAEE;

  // Data targets
  var COLOR_TITAN_FILES = 0x4444FF;
  var COLOR_BOARD_REC   = 0xFFCC44;
  var COLOR_FINANCIAL   = 0x44FF44;
  var COLOR_PATENTS     = 0xFF4444;
  var COLOR_EMPLOYEE_DB = 0x44AAFF;

  // Gameplay numbers
  var CAMERA_SWEEP_ARC  = 60;          // degrees total
  var CAMERA_SWEEP_SPD  = 0.6;         // rad/s
  var CAMERA_HACK_TIME  = 5.0;         // seconds to hack one camera
  var CAMERA_MAX_LOOP   = 3;           // max cameras that can be looped
  var DOG_SMELL_RANGE   = 6;           // units
  var GUARD_SIGHT_RANGE = 18;          // units
  var GUARD_ALERT_RANGE = 10;          // hearing
  var EMPLOYEE_ALERT_DIST = 4;         // employee spots suspicious behaviour
  var LOCKDOWN_DURATION = 300;         // 5 minutes in seconds
  var ACTIVATION_WINDOW = 0.4;         // seconds for C+E simultaneous

  // Floor badge requirements:
  // visitor = floors 1-3, executive = all floors
  var BADGE_VISITOR  = 'VISITOR';
  var BADGE_EXECUTIVE = 'EXECUTIVE';

  // ─── State ─────────────────────────────────────────────────────────────────

  var state = {
    active: false,
    // activation keys
    cDown: false,
    eDown: false,
    cDownTime: 0,
    eDownTime: 0,
    // three.js
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    playerMesh: null,
    playerFloor: 1,        // 1-8
    playerYaw: 0,
    playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    playerPos: { x: 0, y: 0, z: 0 },
    // badge
    badge: BADGE_VISITOR,
    // data targets collected
    filesCollected: 0,
    targetsCollected: {},  // key -> true
    // cameras
    cameras3d: [],
    cameraAngles: [],
    cameraDir: [],         // +1 or -1 sweep direction
    camerasLooped: 0,
    cameraLooped: [],      // per-camera boolean
    cameraHacking: false,
    cameraHackTarget: -1,
    cameraHackTimer: 0,
    // motion sensors
    sensors: [],
    sensorTriggered: [],
    // guards
    guards: [],
    guardAlerted: [],
    guardTarget: [],       // world pos target
    guardReturnTimer: [],  // time before returning to post
    // dogs
    dogs: [],
    dogMesh: [],
    // employees
    employees: [],
    employeeAlertTimer: [],
    // alarm
    alarmActive: false,
    alarmFlashTimer: 0,
    // lockdown
    lockdownActive: false,
    lockdownTimer: 0,
    // scanners
    scanners: [],
    scannerFlashTimer: [],
    scannerFlashColor: [],
    // board member (carries executive badge)
    boardMemberMesh: null,
    boardMemberPickedUp: false,
    boardMemberFloor: 6,
    // exfil options used
    exfilDone: false,
    // building meshes
    floorMeshes: [],
    // HUD
    hudEl: null,
    // interact / prompt
    promptEl: null,
    endEl: null,
    // mission result
    missionClear: false,
    missionFailed: false,
    // interact throttle
    lastInteractTime: 0,
    // suspicious meter (0-100)
    suspicious: 0,
    // maintenance tunnel (B1)
    tunnelMesh: null,
    // key listeners
    keydownHandler: null,
    keyupHandler: null,
    mousemoveHandler: null,
    clickHandler: null
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function makeBox(w, h, d, colorHex, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCylinder(rt, rb, h, colorHex, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function floorY(floor) {
    // floor 1 = y 0, floor 2 = y 3, ...  floor -1 (B1) = y -3
    return (floor - 1) * FLOOR_HEIGHT;
  }

  function playerFloorFromY(y) {
    var f = Math.floor(y / FLOOR_HEIGHT) + 1;
    if (f < 1) { return 1; }
    if (f > FLOOR_COUNT) { return FLOOR_COUNT; }
    return f;
  }

  function setColor(mesh, hex) {
    if (mesh && mesh.material) {
      mesh.material.color.setHex(hex);
    }
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  // ─── Build Scene ───────────────────────────────────────────────────────────

  function buildScene() {
    var s = state.scene;

    // Lighting
    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    s.add(ambient);
    var dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(20, 40, 20);
    s.add(dir);

    // ── Exterior building shell (8-floor HQ, 18x24x14)
    // We represent the shell as outer wall panels instead of a solid so the
    // player can move inside.  The HQ sits with its base at y=0.
    var halfW = BUILDING_W / 2;
    var halfD = BUILDING_D / 2;
    var totalH = FLOOR_COUNT * FLOOR_HEIGHT; // 24

    // North wall
    var wallN = makeBox(BUILDING_W, totalH, 0.4, COLOR_BUILDING,
                        0, totalH / 2, -halfD);
    s.add(wallN);
    // South wall
    var wallS = makeBox(BUILDING_W, totalH, 0.4, COLOR_BUILDING,
                        0, totalH / 2, halfD);
    s.add(wallS);
    // East wall
    var wallE = makeBox(0.4, totalH, BUILDING_D, COLOR_BUILDING,
                        halfW, totalH / 2, 0);
    s.add(wallE);
    // West wall
    var wallW = makeBox(0.4, totalH, BUILDING_D, COLOR_BUILDING,
                        -halfW, totalH / 2, 0);
    s.add(wallW);

    // ── Floor slabs (one per floor) and floor-level props
    state.floorMeshes = [];
    var floorColors = [
      0x556677, // floor 1 – reception
      0x445566, // floor 2 – offices
      0x445566,
      0x445566,
      0x445566, // floor 5 – R&D
      0x334455, // floor 6 – exec / CFO
      0x334455, // floor 7 – exec / board room
      0x222233  // floor 8 – server farm
    ];
    for (var fi = 0; fi < FLOOR_COUNT; fi++) {
      var fy = fi * FLOOR_HEIGHT;
      var fslab = makeBox(BUILDING_W - 0.5, 0.2, BUILDING_D - 0.5,
                          floorColors[fi], 0, fy, 0);
      s.add(fslab);
      state.floorMeshes.push(fslab);
    }

    // ── 3 Elevator shafts (CylinderGeometry, vertical)
    var elevX = [-6, 0, 6];
    for (var ei = 0; ei < 3; ei++) {
      var shaft = makeCylinder(0.6, 0.6, totalH, COLOR_ELEVATOR,
                               elevX[ei], totalH / 2, halfD - 2);
      s.add(shaft);
    }

    // ── Maintenance tunnel (B1, below floor 1)
    var tunnel = makeBox(4, 2, 6, COLOR_TUNNEL, 0, -1.5, halfD - 3);
    s.add(tunnel);
    state.tunnelMesh = tunnel;

    // ── Reception desk floor 1
    var recDesk = makeBox(3, 1, 1, 0x998877, -4, floorY(1) + 0.5, -3);
    s.add(recDesk);

    // ── Office desks floors 2-5 (2 per floor)
    for (var of2 = 2; of2 <= 5; of2++) {
      var desk1 = makeBox(2, 0.8, 1, 0x887766, -4, floorY(of2) + 0.4, -2);
      var desk2 = makeBox(2, 0.8, 1, 0x887766,  4, floorY(of2) + 0.4,  2);
      s.add(desk1);
      s.add(desk2);
    }

    // ── Board room table floor 7
    var boardTable = makeBox(5, 0.8, 2, 0x443322, 0, floorY(7) + 0.4, 0);
    s.add(boardTable);

    // ── Server racks floor 8
    for (var sr = 0; sr < 4; sr++) {
      var rack = makeBox(1, 2.5, 0.5, 0x222255, -6 + sr * 4,
                         floorY(8) + 1.25, -3);
      s.add(rack);
    }

    buildDataTargets();
    buildElevatorScanners();
    buildCameras();
    buildMotionSensors();
    buildGuards();
    buildDogs();
    buildEmployees();
    buildBoardMember();
    buildPlayer();
  }

  // ── Data Targets ─────────────────────────────────────────────────────────

  var TARGET_DEFS = [
    { key: 'titan',      color: COLOR_TITAN_FILES, floor: 8, x: -5, z: -3,
      label: 'Project Titan Files' },
    { key: 'boardrec',   color: COLOR_BOARD_REC,  floor: 7, x:  3, z:  1,
      label: 'Board Meeting Recording' },
    { key: 'financial',  color: COLOR_FINANCIAL,  floor: 6, x: -3, z: -2,
      label: 'Financial Data' },
    { key: 'patents',    color: COLOR_PATENTS,    floor: 5, x:  4, z:  2,
      label: 'Patents' },
    { key: 'empdb',      color: COLOR_EMPLOYEE_DB, floor: 3, x: -4, z:  2,
      label: 'Employee Database' }
  ];

  var targetMeshes = [];

  function buildDataTargets() {
    targetMeshes = [];
    for (var ti = 0; ti < TARGET_DEFS.length; ti++) {
      var td = TARGET_DEFS[ti];
      var tm = makeBox(0.6, 0.6, 0.6, td.color,
                       td.x, floorY(td.floor) + 0.5, td.z);
      state.scene.add(tm);
      targetMeshes.push(tm);
    }
  }

  // ── Elevator / Floor ID Scanners ──────────────────────────────────────────

  function buildElevatorScanners() {
    state.scanners = [];
    state.scannerFlashTimer = [];
    state.scannerFlashColor = [];
    // One scanner panel per elevator per floor transition (simplified: one
    // scanner pillar per floor on the elevator side)
    for (var fl = 2; fl <= FLOOR_COUNT; fl++) {
      var sc = makeBox(0.3, 0.8, 0.3, COLOR_SCANNER,
                       0, floorY(fl) + 0.4, 4);
      state.scene.add(sc);
      state.scanners.push({ mesh: sc, floor: fl });
      state.scannerFlashTimer.push(0);
      state.scannerFlashColor.push(COLOR_SCANNER);
    }
  }

  // ── Cameras ───────────────────────────────────────────────────────────────

  var CAMERA_POSITIONS = [
    // [floor, x, z, facing yaw]
    [2, -7, -6, 0],
    [4,  7,  5, Math.PI],
    [6, -7,  0, Math.PI * 0.5],
    [7,  6, -5, Math.PI * 1.5],
    [8, -5,  3, 0],
    [8,  5, -3, Math.PI]
  ];

  function buildCameras() {
    state.cameras3d = [];
    state.cameraAngles = [];
    state.cameraDir = [];
    state.cameraLooped = [];
    for (var ci = 0; ci < CAMERA_POSITIONS.length; ci++) {
      var cp = CAMERA_POSITIONS[ci];
      var camMesh = makeCylinder(0.15, 0.15, 0.5, COLOR_CAMERA,
                                 cp[1], floorY(cp[0]) + 2.6, cp[2]);
      // small lens box
      var lens = makeBox(0.25, 0.25, 0.4, 0x222222,
                         cp[1], floorY(cp[0]) + 2.6, cp[2] + 0.3);
      state.scene.add(camMesh);
      state.scene.add(lens);
      state.cameras3d.push({ mesh: camMesh, lens: lens, floor: cp[0],
                             baseYaw: cp[3] });
      state.cameraAngles.push(cp[3]);
      state.cameraDir.push(1);
      state.cameraLooped.push(false);
    }
    state.camerasLooped = 0;
    state.cameraHacking = false;
    state.cameraHackTarget = -1;
    state.cameraHackTimer = 0;
  }

  // ── Motion Sensors ────────────────────────────────────────────────────────

  var SENSOR_POSITIONS = [
    [1, -6,  4],
    [3,  5, -3],
    [5, -4,  2],
    [7,  3,  3],
    [8, -3, -4]
  ];

  function buildMotionSensors() {
    state.sensors = [];
    state.sensorTriggered = [];
    for (var si = 0; si < SENSOR_POSITIONS.length; si++) {
      var sp = SENSOR_POSITIONS[si];
      var sm = makeBox(0.3, 0.3, 0.3, COLOR_SENSOR,
                       sp[1], floorY(sp[0]) + 1.5, sp[2]);
      state.scene.add(sm);
      state.sensors.push({ mesh: sm, floor: sp[0],
                           x: sp[1], z: sp[2], range: 3.5 });
      state.sensorTriggered.push(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  var GUARD_SPAWN = [
    // [floor, x, z]
    [1, -5, -4], [1,  5,  3],
    [2, -4,  2], [3,  4, -3],
    [5, -3,  1], [6,  3,  3],
    [7, -4, -2], [8,  2,  2]
  ];

  function buildGuards() {
    state.guards = [];
    state.guardAlerted = [];
    state.guardTarget = [];
    state.guardReturnTimer = [];
    for (var gi = 0; gi < GUARD_SPAWN.length; gi++) {
      var gs = GUARD_SPAWN[gi];
      var gm = makeBox(0.5, 1.7, 0.4, COLOR_GUARD,
                       gs[1], floorY(gs[0]) + 0.85, gs[2]);
      state.scene.add(gm);
      state.guards.push({
        mesh: gm,
        floor: gs[0],
        homeX: gs[1],
        homeZ: gs[2],
        x: gs[1],
        z: gs[2],
        yaw: 0,
        patrolDir: Math.random() * Math.PI * 2,
        patrolTimer: 0
      });
      state.guardAlerted.push(false);
      state.guardTarget.push(null);
      state.guardReturnTimer.push(0);
    }
  }

  // ── Dogs ──────────────────────────────────────────────────────────────────

  var DOG_SPAWN = [
    [1,  3, 5],   // lobby
    [6, -3, 4]    // executive floor
  ];

  function buildDogs() {
    state.dogs = [];
    state.dogMesh = [];
    for (var di = 0; di < DOG_SPAWN.length; di++) {
      var ds = DOG_SPAWN[di];
      var dm = makeBox(0.8, 0.5, 0.4, COLOR_DOG,
                       ds[1], floorY(ds[0]) + 0.25, ds[2]);
      state.scene.add(dm);
      state.dogs.push({
        mesh: dm,
        floor: ds[0],
        x: ds[1],
        z: ds[2],
        homeX: ds[1],
        homeZ: ds[2],
        yaw: Math.random() * Math.PI * 2,
        alerted: false
      });
      state.dogMesh.push(dm);
    }
  }

  // ── Employees (non-combatant) ─────────────────────────────────────────────

  var EMPLOYEE_FLOORS = [1,1,2,2,3,3,4,4,5,5,
                         6,6,7,7,8,8,1,2,3,4,
                         5,6,7,8,1,2,3,4,5,6];

  function buildEmployees() {
    state.employees = [];
    state.employeeAlertTimer = [];
    for (var eei = 0; eei < 30; eei++) {
      var ef = EMPLOYEE_FLOORS[eei % EMPLOYEE_FLOORS.length];
      var ex = (Math.random() - 0.5) * (BUILDING_W - 2);
      var ez = (Math.random() - 0.5) * (BUILDING_D - 2);
      var em = makeBox(0.4, 1.6, 0.35, COLOR_EMPLOYEE,
                       ex, floorY(ef) + 0.8, ez);
      state.scene.add(em);
      state.employees.push({
        mesh: em,
        floor: ef,
        x: ex,
        z: ez,
        homeX: ex,
        homeZ: ez,
        alerted: false,
        moveTimer: Math.random() * 3
      });
      state.employeeAlertTimer.push(0);
    }
  }

  // ── Board Member (carries exec badge) ────────────────────────────────────

  function buildBoardMember() {
    var bmFloor = state.boardMemberFloor; // floor 6
    var bm = makeBox(0.5, 1.7, 0.4, COLOR_EXECUTIVE,
                     2, floorY(bmFloor) + 0.85, -1);
    state.scene.add(bm);
    state.boardMemberMesh = bm;
    state.boardMemberPickedUp = false;
  }

  // ── Player ────────────────────────────────────────────────────────────────

  function buildPlayer() {
    var pm = makeBox(0.5, 1.7, 0.4, COLOR_PLAYER, 0, 0.85, 6);
    state.scene.add(pm);
    state.playerMesh = pm;
    state.playerPos.x = 0;
    state.playerPos.y = 0.85;
    state.playerPos.z = 6;
    // Position camera behind player
    state.camera.position.set(0, 1.6, 8);
    state.camera.lookAt(0, 1.6, 0);
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    var hud = document.getElementById('ce-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'ce-hud';
      hud.style.cssText = [
        'position:fixed',
        'top:8px',
        'left:8px',
        'right:8px',
        'color:#00ffcc',
        'font-family:monospace',
        'font-size:13px',
        'background:rgba(0,0,0,0.55)',
        'padding:5px 10px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'white-space:nowrap'
      ].join(';');
      document.body.appendChild(hud);
    }
    state.hudEl = hud;

    var prompt = document.getElementById('ce-prompt');
    if (!prompt) {
      prompt = document.createElement('div');
      prompt.id = 'ce-prompt';
      prompt.style.cssText = [
        'position:fixed',
        'bottom:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'color:#ffffcc',
        'font-family:monospace',
        'font-size:14px',
        'background:rgba(0,0,0,0.7)',
        'padding:4px 12px',
        'border-radius:4px',
        'pointer-events:none',
        'z-index:9999',
        'display:none'
      ].join(';');
      document.body.appendChild(prompt);
    }
    state.promptEl = prompt;

    var end = document.getElementById('ce-end');
    if (!end) {
      end = document.createElement('div');
      end.id = 'ce-end';
      end.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'color:#ffffff',
        'font-family:monospace',
        'font-size:20px',
        'background:rgba(0,0,0,0.85)',
        'padding:20px 40px',
        'border-radius:8px',
        'pointer-events:none',
        'z-index:99999',
        'display:none',
        'text-align:center'
      ].join(';');
      document.body.appendChild(end);
    }
    state.endEl = end;
  }

  function updateHUD() {
    if (!state.hudEl) { return; }
    var fl     = state.playerFloor;
    var badge  = state.badge;
    var files  = state.filesCollected;
    var looped = state.camerasLooped;
    var ldText = '';
    if (state.lockdownActive) {
      ldText = ' | LOCKDOWN: ' + toMM_SS(state.lockdownTimer);
    }
    if (state.alarmActive) {
      state.hudEl.style.color = '#ff4444';
    } else {
      state.hudEl.style.color = '#00ffcc';
    }
    state.hudEl.textContent =
      'ESPIONAGE  [FLOOR: ' + fl + '/8]' +
      '  [BADGE: ' + badge + ']' +
      '  [FILES: ' + files + '/5]' +
      '  [CAMERAS: ' + looped + '/' + CAMERA_MAX_LOOP + ' looped]' +
      ldText;
  }

  function showPrompt(msg) {
    if (!state.promptEl) { return; }
    if (msg) {
      state.promptEl.textContent = msg;
      state.promptEl.style.display = 'block';
    } else {
      state.promptEl.style.display = 'none';
    }
  }

  function showEnd(msg, color) {
    if (!state.endEl) { return; }
    state.endEl.style.display = 'block';
    state.endEl.style.color = color || '#ffffff';
    state.endEl.innerHTML = msg;
  }

  // ─── Interaction Proximity Detection ──────────────────────────────────────

  function nearestTarget() {
    var best = null;
    var bestDist = 2.5;
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return null; }
    // Data targets
    for (var ti = 0; ti < TARGET_DEFS.length; ti++) {
      if (state.targetsCollected[TARGET_DEFS[ti].key]) { continue; }
      var tm = targetMeshes[ti];
      if (!tm) { continue; }
      var d = dist3D(pp, tm.position);
      if (d < bestDist) { bestDist = d; best = { type: 'data', idx: ti }; }
    }
    // Board member badge
    if (!state.boardMemberPickedUp && state.boardMemberMesh) {
      var bd = dist3D(pp, state.boardMemberMesh.position);
      if (bd < 2.5 && bd < bestDist) {
        bestDist = bd;
        best = { type: 'badge' };
      }
    }
    // Cameras (hack)
    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      if (state.cameraLooped[ci]) { continue; }
      var cm = state.cameras3d[ci].mesh;
      var cd = dist3D(pp, cm.position);
      if (cd < 3.0 && cd < bestDist) {
        bestDist = cd;
        best = { type: 'camera', idx: ci };
      }
    }
    // Tunnel exfil
    if (state.lockdownActive && state.tunnelMesh) {
      var td = dist3D(pp, state.tunnelMesh.position);
      if (td < 3 && td < bestDist) {
        bestDist = td;
        best = { type: 'tunnel' };
      }
    }
    // Front door exfil (near y=0, z=7)
    if (state.lockdownActive) {
      var fdist = dist3D(pp, { x: 0, y: 0.85, z: 7 });
      if (fdist < 3 && fdist < bestDist) {
        bestDist = fdist;
        best = { type: 'frontdoor' };
      }
      // Window rappel (near x=9, y= exec floor)
      var rdist = dist3D(pp, { x: 9, y: floorY(6) + 1, z: 0 });
      if (rdist < 3 && rdist < bestDist) {
        bestDist = rdist;
        best = { type: 'rappel' };
      }
    }
    return best;
  }

  function handleInteract() {
    var now = Date.now() / 1000;
    if (now - state.lastInteractTime < 0.3) { return; }
    state.lastInteractTime = now;

    if (state.missionClear || state.missionFailed) { return; }

    // If already hacking a camera, this completes/cancels — let update handle it
    if (state.cameraHacking) {
      state.cameraHacking = false;
      state.cameraHackTarget = -1;
      state.cameraHackTimer = 0;
      showPrompt(null);
      return;
    }

    var near = nearestTarget();
    if (!near) { return; }

    if (near.type === 'data') {
      var td = TARGET_DEFS[near.idx];
      // Check floor access
      if (!canAccessFloor(td.floor)) {
        triggerScannerAlarm();
        return;
      }
      state.targetsCollected[td.key] = true;
      state.filesCollected++;
      if (targetMeshes[near.idx]) {
        state.scene.remove(targetMeshes[near.idx]);
        targetMeshes[near.idx] = null;
      }
      showPrompt('Collected: ' + td.label + '  [' + state.filesCollected + '/5]');
      if (state.filesCollected >= 4 && !state.lockdownActive) {
        triggerLockdown();
      }
    } else if (near.type === 'badge') {
      state.badge = BADGE_EXECUTIVE;
      state.boardMemberPickedUp = true;
      if (state.boardMemberMesh) {
        state.scene.remove(state.boardMemberMesh);
        state.boardMemberMesh = null;
      }
      showPrompt('Executive badge acquired — all floors unlocked');
    } else if (near.type === 'camera') {
      if (state.camerasLooped >= CAMERA_MAX_LOOP) {
        showPrompt('Max cameras looped (' + CAMERA_MAX_LOOP + ')');
        return;
      }
      state.cameraHacking = true;
      state.cameraHackTarget = near.idx;
      state.cameraHackTimer = 0;
      showPrompt('Hacking camera... [E to cancel]');
    } else if (near.type === 'tunnel') {
      doExfil('maintenance tunnel');
    } else if (near.type === 'frontdoor') {
      doExfil('front door');
    } else if (near.type === 'rappel') {
      doExfil('window rappel');
    }
  }

  function canAccessFloor(floor) {
    if (state.badge === BADGE_EXECUTIVE) { return true; }
    // visitor: floors 1-3
    return floor <= 3;
  }

  function triggerScannerAlarm() {
    triggerAlarm('ID SCANNER — WRONG BADGE');
  }

  function triggerAlarm(reason) {
    if (state.missionFailed) { return; }
    state.alarmActive = true;
    state.alarmFlashTimer = 1.5;
    // Alert all guards
    for (var gi = 0; gi < state.guardAlerted.length; gi++) {
      state.guardAlerted[gi] = true;
      state.guardTarget[gi] = {
        x: state.playerMesh ? state.playerMesh.position.x : 0,
        z: state.playerMesh ? state.playerMesh.position.z : 0
      };
    }
    showPrompt('ALARM: ' + (reason || 'DETECTED'));
  }

  function triggerLockdown() {
    state.lockdownActive = true;
    state.lockdownTimer = LOCKDOWN_DURATION;
    state.alarmActive = true;
    state.alarmFlashTimer = 2;
    showPrompt('LOCKDOWN — Exfiltrate within 5 minutes!');
    // Alert all guards
    for (var gi = 0; gi < state.guardAlerted.length; gi++) {
      state.guardAlerted[gi] = true;
    }
  }

  function doExfil(method) {
    if (state.exfilDone) { return; }
    state.exfilDone = true;
    state.missionClear = true;
    showEnd(
      'MISSION COMPLETE<br>' +
      'Files collected: ' + state.filesCollected + '/5<br>' +
      'Exfil: ' + method + '<br>' +
      'Press Escape to exit',
      '#00ffcc'
    );
  }

  // ─── Guard AI ──────────────────────────────────────────────────────────────

  function updateGuards(dt) {
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return; }

    for (var gi = 0; gi < state.guards.length; gi++) {
      var g = state.guards[gi];
      var alerted = state.guardAlerted[gi];

      // Move guard mesh to reflect state.x/z
      g.mesh.position.x = g.x;
      g.mesh.position.z = g.z;

      if (alerted) {
        var tgt = state.guardTarget[gi];
        var tx, tz;
        if (tgt) {
          tx = tgt.x;
          tz = tgt.z;
        } else {
          tx = pp.x;
          tz = pp.z;
        }
        var dx = tx - g.x;
        var dz = tz - g.z;
        var dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 0.2) {
          g.x += (dx / dl) * 3.5 * dt;
          g.z += (dz / dl) * 3.5 * dt;
        }
        // Check catch
        var catchDist = dist3D(pp, { x: g.x, y: pp.y, z: g.z });
        if (catchDist < 1.2) {
          if (!state.missionFailed) {
            state.missionFailed = true;
            showEnd('CAPTURED<br>Guard caught you<br>Mission Failed', '#ff4444');
          }
        }
        // Return to post after a while if alarm clears
        if (!state.alarmActive && !state.lockdownActive) {
          state.guardReturnTimer[gi] += dt;
          if (state.guardReturnTimer[gi] > 10) {
            state.guardAlerted[gi] = false;
            state.guardTarget[gi] = null;
            state.guardReturnTimer[gi] = 0;
          }
        }
      } else {
        // Patrol: random walk
        g.patrolTimer += dt;
        if (g.patrolTimer > 2.5) {
          g.patrolTimer = 0;
          g.patrolDir = Math.random() * Math.PI * 2;
        }
        var pdx = Math.sin(g.patrolDir) * 2.0 * dt;
        var pdz = Math.cos(g.patrolDir) * 2.0 * dt;
        var nx = g.x + pdx;
        var nz = g.z + pdz;
        // keep inside building
        if (Math.abs(nx) < BUILDING_W / 2 - 1) { g.x = nx; }
        if (Math.abs(nz) < BUILDING_D / 2 - 1) { g.z = nz; }

        // Sight check — same floor
        if (g.floor === state.playerFloor) {
          var sd = dist2D(g.x, g.z, pp.x, pp.z);
          if (sd < GUARD_SIGHT_RANGE) {
            state.guardAlerted[gi] = true;
            state.guardTarget[gi] = { x: pp.x, z: pp.z };
            triggerAlarm('SPOTTED by guard');
          }
        }
      }
    }
  }

  // ─── Dog AI ────────────────────────────────────────────────────────────────

  function updateDogs(dt) {
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return; }

    for (var di = 0; di < state.dogs.length; di++) {
      var dog = state.dogs[di];
      dog.mesh.position.x = dog.x;
      dog.mesh.position.z = dog.z;

      if (dog.floor !== state.playerFloor) { continue; }

      var dd = dist2D(dog.x, dog.z, pp.x, pp.z);
      if (dd < DOG_SMELL_RANGE) {
        dog.alerted = true;
        setColor(dog.mesh, 0xFF2200);
      }
      if (dog.alerted) {
        var dx = pp.x - dog.x;
        var dz = pp.z - dog.z;
        var dl = Math.sqrt(dx * dx + dz * dz);
        if (dl > 0.3) {
          dog.x += (dx / dl) * 4.0 * dt;
          dog.z += (dz / dl) * 4.0 * dt;
        }
        var biteD = dist3D(pp, { x: dog.x, y: pp.y, z: dog.z });
        if (biteD < 1.0) {
          if (!state.missionFailed) {
            state.missionFailed = true;
            showEnd('MAULED<br>Guard dog caught you<br>Mission Failed', '#ff4444');
          }
        }
      } else {
        // Patrol
        dog.yaw += 0.8 * dt;
        var px = Math.sin(dog.yaw) * 2.0 * dt;
        var pz = Math.cos(dog.yaw) * 2.0 * dt;
        dog.x = dog.homeX + Math.sin(dog.yaw) * 2.5;
        dog.z = dog.homeZ + Math.cos(dog.yaw) * 2.5;
      }
    }
  }

  // ─── Camera Sweep ──────────────────────────────────────────────────────────

  function updateCameras(dt) {
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return; }

    var halfArc = (CAMERA_SWEEP_ARC * Math.PI / 180) / 2;

    for (var ci = 0; ci < state.cameras3d.length; ci++) {
      var cam = state.cameras3d[ci];
      if (state.cameraLooped[ci]) { continue; }

      // Sweep
      state.cameraAngles[ci] += CAMERA_SWEEP_SPD * state.cameraDir[ci] * dt;
      if (state.cameraAngles[ci] > cam.baseYaw + halfArc) {
        state.cameraAngles[ci] = cam.baseYaw + halfArc;
        state.cameraDir[ci] = -1;
      } else if (state.cameraAngles[ci] < cam.baseYaw - halfArc) {
        state.cameraAngles[ci] = cam.baseYaw - halfArc;
        state.cameraDir[ci] = 1;
      }
      cam.mesh.rotation.y = state.cameraAngles[ci];
      if (cam.lens) { cam.lens.rotation.y = state.cameraAngles[ci]; }

      // Detection: same floor, within 10u, in front of camera
      if (cam.floor !== state.playerFloor) { continue; }
      var cdx = pp.x - cam.mesh.position.x;
      var cdz = pp.z - cam.mesh.position.z;
      var cdist = Math.sqrt(cdx * cdx + cdz * cdz);
      if (cdist < 10) {
        var camFwdX = Math.sin(state.cameraAngles[ci]);
        var camFwdZ = Math.cos(state.cameraAngles[ci]);
        var dot = (cdx / cdist) * camFwdX + (cdz / cdist) * camFwdZ;
        var cosHalf = Math.cos(halfArc);
        if (dot > cosHalf) {
          // Player in camera cone
          if (!state.alarmActive) {
            triggerAlarm('Spotted by camera');
          }
        }
      }
    }

    // Camera hacking progress
    if (state.cameraHacking) {
      state.cameraHackTimer += dt;
      var prog = Math.floor((state.cameraHackTimer / CAMERA_HACK_TIME) * 100);
      showPrompt('Hacking camera... ' + prog + '%  [F to cancel]');
      if (state.cameraHackTimer >= CAMERA_HACK_TIME) {
        var hidx = state.cameraHackTarget;
        state.cameraLooped[hidx] = true;
        state.camerasLooped++;
        setColor(state.cameras3d[hidx].mesh, 0x00FF44);
        state.cameraHacking = false;
        state.cameraHackTarget = -1;
        state.cameraHackTimer = 0;
        showPrompt('Camera ' + (hidx + 1) + ' looped!');
      }
    }
  }

  // ─── Motion Sensors ────────────────────────────────────────────────────────

  function updateSensors(dt) {
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return; }

    for (var si = 0; si < state.sensors.length; si++) {
      var sen = state.sensors[si];
      if (sen.floor !== state.playerFloor) { continue; }
      var sd = dist2D(pp.x, pp.z, sen.x, sen.z);
      if (sd < sen.range && !state.sensorTriggered[si]) {
        state.sensorTriggered[si] = true;
        setColor(sen.mesh, 0xFF2200);
        triggerAlarm('Motion sensor triggered');
      }
    }
  }

  // ─── Employee AI ───────────────────────────────────────────────────────────

  function updateEmployees(dt) {
    var pp = state.playerMesh ? state.playerMesh.position : null;
    if (!pp) { return; }

    for (var ei = 0; ei < state.employees.length; ei++) {
      var emp = state.employees[ei];
      if (emp.floor !== state.playerFloor) { continue; }

      // Random drift
      emp.moveTimer -= dt;
      if (emp.moveTimer <= 0) {
        emp.moveTimer = 2 + Math.random() * 3;
        emp.driftX = (Math.random() - 0.5) * 4;
        emp.driftZ = (Math.random() - 0.5) * 4;
        var nx = emp.homeX + (emp.driftX || 0);
        var nz = emp.homeZ + (emp.driftZ || 0);
        nx = clamp(nx, -BUILDING_W / 2 + 1, BUILDING_W / 2 - 1);
        nz = clamp(nz, -BUILDING_D / 2 + 1, BUILDING_D / 2 - 1);
        emp.x = nx;
        emp.z = nz;
        emp.mesh.position.x = emp.x;
        emp.mesh.position.z = emp.z;
      }

      // Spot suspicious behaviour
      var ed = dist2D(pp.x, pp.z, emp.x, emp.z);
      if (ed < EMPLOYEE_ALERT_DIST && !emp.alerted && state.suspicious > 50) {
        state.employeeAlertTimer[ei] += dt;
        if (state.employeeAlertTimer[ei] > 2.0) {
          emp.alerted = true;
          setColor(emp.mesh, 0xFFAA00);
          triggerAlarm('Employee reported suspicious activity');
          state.employeeAlertTimer[ei] = 0;
        }
      } else {
        if (!emp.alerted) { state.employeeAlertTimer[ei] = 0; }
      }
    }
  }

  // ─── Scanners Flash ────────────────────────────────────────────────────────

  function updateScanners(dt) {
    for (var si = 0; si < state.scanners.length; si++) {
      if (state.scannerFlashTimer[si] > 0) {
        state.scannerFlashTimer[si] -= dt;
        if (state.scannerFlashTimer[si] <= 0) {
          setColor(state.scanners[si].mesh, COLOR_SCANNER);
          state.scannerFlashColor[si] = COLOR_SCANNER;
        }
      }
    }
  }

  // ─── Player Movement ───────────────────────────────────────────────────────

  function updatePlayer(dt) {
    if (!state.playerMesh || !state.pointerLocked) { return; }

    var speed = 6.0;
    var mk = state.moveKeys;
    var yaw = state.playerYaw;

    var moveX = 0;
    var moveZ = 0;
    if (mk['KeyW'] || mk['ArrowUp'])    { moveZ -= 1; }
    if (mk['KeyS'] || mk['ArrowDown'])  { moveZ += 1; }
    if (mk['KeyA'] || mk['ArrowLeft'])  { moveX -= 1; }
    if (mk['KeyD'] || mk['ArrowRight']) { moveX += 1; }

    var wX = moveX * Math.cos(yaw) - moveZ * Math.sin(yaw);
    var wZ = moveX * Math.sin(yaw) + moveZ * Math.cos(yaw);

    var len = Math.sqrt(wX * wX + wZ * wZ);
    if (len > 0) {
      wX /= len;
      wZ /= len;
      state.suspicious = clamp(state.suspicious + 5 * dt, 0, 100);
    } else {
      state.suspicious = clamp(state.suspicious - 10 * dt, 0, 100);
    }

    var pm = state.playerMesh;
    var nx = pm.position.x + wX * speed * dt;
    var nz = pm.position.z + wZ * speed * dt;

    // Elevator: if near elevator shaft X positions and pressing up/down
    var onElevator = false;
    var elevX = [-6, 0, 6];
    for (var ei = 0; ei < elevX.length; ei++) {
      var ex = elevX[ei];
      var ez = BUILDING_D / 2 - 2;
      if (Math.abs(pm.position.x - ex) < 1.5 && Math.abs(pm.position.z - ez) < 1.5) {
        onElevator = true;
        break;
      }
    }

    if (onElevator) {
      if (mk['KeyQ'] || mk['PageUp']) {
        // Go up one floor
        var targetFloor = state.playerFloor + 1;
        if (targetFloor <= FLOOR_COUNT) {
          if (!canAccessFloor(targetFloor)) {
            // Flash scanner
            flashScannerOnFloor(targetFloor);
            triggerScannerAlarm();
          } else {
            var newY = floorY(targetFloor) + 0.85;
            pm.position.y = newY;
            state.playerPos.y = newY;
            state.playerFloor = targetFloor;
          }
        }
      }
      if (mk['KeyZ'] || mk['PageDown']) {
        // Go down one floor
        var targetFloor2 = state.playerFloor - 1;
        if (targetFloor2 >= 1) {
          var newY2 = floorY(targetFloor2) + 0.85;
          pm.position.y = newY2;
          state.playerPos.y = newY2;
          state.playerFloor = targetFloor2;
        }
      }
    }

    // Clamp to building
    nx = clamp(nx, -BUILDING_W / 2 + 0.5, BUILDING_W / 2 - 0.5);
    nz = clamp(nz, -BUILDING_D / 2 + 0.5, BUILDING_D / 2 - 0.5);

    pm.position.x = nx;
    pm.position.z = nz;
    pm.rotation.y = yaw;

    state.playerPos.x = nx;
    state.playerPos.z = nz;
    state.playerFloor = playerFloorFromY(pm.position.y - 0.85);

    // Camera follow
    var camDist = 5;
    var camH    = 3;
    state.camera.position.x = nx - Math.sin(yaw) * camDist;
    state.camera.position.y = pm.position.y + camH;
    state.camera.position.z = nz - Math.cos(yaw) * camDist;
    state.camera.lookAt(nx, pm.position.y + 1, nz);

    // Proximity prompt
    var near = nearestTarget();
    if (near && !state.cameraHacking) {
      if (near.type === 'data') {
        showPrompt('[F] Collect ' + TARGET_DEFS[near.idx].label);
      } else if (near.type === 'badge') {
        showPrompt('[F] Steal Executive Badge from board member');
      } else if (near.type === 'camera') {
        showPrompt('[F] Hack camera (' + CAMERA_HACK_TIME + 's)');
      } else if (near.type === 'tunnel') {
        showPrompt('[F] Escape via maintenance tunnel (B1)');
      } else if (near.type === 'frontdoor') {
        showPrompt('[F] Escape via front door');
      } else if (near.type === 'rappel') {
        showPrompt('[F] Escape via window rappel');
      }
    } else if (!state.cameraHacking) {
      showPrompt(null);
    }
  }

  function flashScannerOnFloor(floor) {
    for (var si = 0; si < state.scanners.length; si++) {
      if (state.scanners[si].floor === floor) {
        setColor(state.scanners[si].mesh, COLOR_SCANNER_ERR);
        state.scannerFlashTimer[si] = 1.5;
      }
    }
  }

  // ─── Lockdown Timer ────────────────────────────────────────────────────────

  function updateLockdown(dt) {
    if (!state.lockdownActive) { return; }
    state.lockdownTimer -= dt;
    if (state.lockdownTimer <= 0) {
      state.lockdownTimer = 0;
      if (!state.missionFailed && !state.missionClear) {
        state.missionFailed = true;
        showEnd(
          'CAPTURED<br>Lockdown expired — surrounded<br>Mission Failed',
          '#ff4444'
        );
      }
    }
  }

  // ─── Alarm Flash ───────────────────────────────────────────────────────────

  function updateAlarm(dt) {
    if (state.alarmFlashTimer > 0) {
      state.alarmFlashTimer -= dt;
      // Pulse the building walls red
      if (Math.floor(state.alarmFlashTimer * 4) % 2 === 0) {
        // flash
        if (state.hudEl) { state.hudEl.style.background = 'rgba(120,0,0,0.7)'; }
      } else {
        if (state.hudEl) { state.hudEl.style.background = 'rgba(0,0,0,0.55)'; }
      }
      if (state.alarmFlashTimer <= 0) {
        if (state.hudEl) { state.hudEl.style.background = 'rgba(0,0,0,0.55)'; }
      }
    }
  }

  // ─── Main Loop ─────────────────────────────────────────────────────────────

  function tick(timestamp) {
    if (!state.active) { return; }
    state.animFrameId = requestAnimationFrame(tick);

    var now = timestamp / 1000;
    var dt  = Math.min(now - state.lastTime, 0.05);
    state.lastTime = now;

    if (!state.missionClear && !state.missionFailed) {
      updatePlayer(dt);
      updateGuards(dt);
      updateDogs(dt);
      updateCameras(dt);
      updateSensors(dt);
      updateEmployees(dt);
      updateScanners(dt);
      updateLockdown(dt);
      updateAlarm(dt);
    }

    updateHUD();
    state.renderer.render(state.scene, state.camera);
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    // Activation detection
    if (e.code === 'KeyC') {
      state.cDown = true;
      state.cDownTime = Date.now();
    }
    if (e.code === 'KeyE') {
      state.eDown = true;
      state.eDownTime = Date.now();
    }
    var gap = Math.abs(state.cDownTime - state.eDownTime) / 1000;
    if (state.cDown && state.eDown && gap < ACTIVATION_WINDOW && !state.active) {
      activate();
      return;
    }
    if (!state.active) { return; }
    state.moveKeys[e.code] = true;
    if (e.code === 'KeyF') { handleInteract(); }
    if (e.code === 'Escape') { deactivate(); }
  }

  function onKeyUp(e) {
    if (e.code === 'KeyC') { state.cDown = false; }
    if (e.code === 'KeyE') { state.eDown = false; }
    if (!state.active) { return; }
    state.moveKeys[e.code] = false;
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) { return; }
    var sens = 0.002;
    state.playerYaw   -= e.movementX * sens;
    state.playerPitch -= e.movementY * sens;
    state.playerPitch  = clamp(state.playerPitch, -Math.PI / 3, Math.PI / 3);
  }

  function onClick() {
    if (!state.active) { return; }
    if (!state.pointerLocked) {
      document.body.requestPointerLock();
    }
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────

  function activate() {
    if (state.active) { return; }
    state.active = true;

    // Set up renderer / scene / camera
    var canvas = document.createElement('canvas');
    canvas.id = 'ce-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;';
    document.body.appendChild(canvas);

    state.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setClearColor(0x111122);

    state.scene  = new THREE.Scene();
    state.scene.fog = new THREE.Fog(0x111122, 30, 80);

    state.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 200
    );

    // Reset game state
    state.playerFloor        = 1;
    state.badge              = BADGE_VISITOR;
    state.filesCollected     = 0;
    state.targetsCollected   = {};
    state.camerasLooped      = 0;
    state.cameraHacking      = false;
    state.cameraHackTarget   = -1;
    state.cameraHackTimer    = 0;
    state.alarmActive        = false;
    state.alarmFlashTimer    = 0;
    state.lockdownActive     = false;
    state.lockdownTimer      = 0;
    state.suspicious         = 0;
    state.exfilDone          = false;
    state.missionClear       = false;
    state.missionFailed      = false;
    state.boardMemberFloor   = 6;
    state.boardMemberPickedUp = false;
    state.moveKeys           = {};
    state.playerYaw          = 0;
    state.playerPitch        = 0;
    state.pointerLocked      = false;
    state.lastInteractTime   = 0;

    buildScene();
    buildHUD();

    state.lastTime = performance.now() / 1000;
    state.animFrameId = requestAnimationFrame(tick);

    // Pointer lock events
    document.addEventListener('pointerlockchange', function () {
      state.pointerLocked = (document.pointerLockElement === canvas);
    });

    window.addEventListener('resize', function () {
      if (!state.active) { return; }
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function deactivate() {
    if (!state.active) { return; }
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    var canvas = document.getElementById('ce-canvas');
    if (canvas) { canvas.parentNode.removeChild(canvas); }
    var hud = document.getElementById('ce-hud');
    if (hud) { hud.parentNode.removeChild(hud); }
    var prompt = document.getElementById('ce-prompt');
    if (prompt) { prompt.parentNode.removeChild(prompt); }
    var end = document.getElementById('ce-end');
    if (end) { end.parentNode.removeChild(end); }

    if (state.renderer) {
      state.renderer.dispose();
      state.renderer = null;
    }
    state.scene  = null;
    state.camera = null;
    state.hudEl  = null;
    state.promptEl = null;
    state.endEl  = null;
  }

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  state.keydownHandler = onKeyDown;
  state.keyupHandler   = onKeyUp;
  state.mousemoveHandler = onMouseMove;
  state.clickHandler   = onClick;

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('click',  onClick);

  // ─── Public API ────────────────────────────────────────────────────────────

  return {
    activate:   activate,
    deactivate: deactivate,
    isActive:   function () { return state.active; },
    getState:   function () { return state; }
  };

}(window));
