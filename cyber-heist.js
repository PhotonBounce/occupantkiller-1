(function (window) {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys
    cDown: false,
    yDown: false,
    cDownTime: 0,
    yDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    tickAccum: 0,
    // player
    player: null,
    playerMesh: null,
    playerYaw: 0,
    playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    // mission
    alarmLevel: 0,          // 0 SILENT 1 SUSPICIOUS 2 LOCKDOWN 3 PURGE
    lockdownTimer: 0,
    lockdownActive: false,
    missionFailed: false,
    missionClear: false,
    score: 3000,
    alarmCount: 0,
    hasDataDrive: false,
    dataExtracted: false,
    // servers
    servers: [],
    hackedServers: 0,
    totalServers: 6,
    // hacking
    hackingServer: null,
    hackTimer: 0,
    hackDuration: 10,
    hasSpikeEquipped: false,
    // tools
    tools: [],
    toolsHeld: { spike: 0, emp: 0, holodecoy: 0, netbuster: 0, tranq: 0 },
    // cameras
    cameras3d: [],
    cameraStunTimer: 0,
    // guards
    guards: [],
    guardCount: 8,
    // alarm blink
    alarmBlinkTimer: 0,
    // server lights
    serverLights: [],
    // blast doors
    blastDoors: [],
    blastDoorsOpen: true,
    // control terminal
    controlTerminal: null,
    controlTerminalHacking: false,
    controlTerminalTimer: 0,
    controlTerminalDuration: 30,
    // holodecoy
    holodecoy: null,
    holodecoyTimer: 0,
    holoActive: false,
    // extraction
    extractionPoint: null,
    dataDriveMesh: null,
    extractionTimer: 45 * 60,
    // hud
    hudEl: null,
    // reinforcements (lockdown)
    extraGuards: [],
    // radio check
    radioCheckTimer: 120,
    // bodies
    bodies: []
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
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

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : r, z || 0);
    return mesh;
  }

  function makeCylinder(rt, rb, h, colorHex, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function triggerAlarm(delta) {
    if (state.missionFailed || state.missionClear) return;
    state.alarmLevel = Math.min(3, state.alarmLevel + delta);
    state.alarmCount++;
    state.score = Math.max(0, state.score - 200);
    if (state.alarmLevel === 2) {
      closeBlastedDoors();
      state.lockdownTimer = 30;
      state.lockdownActive = true;
      spawnExtraGuards();
    }
    if (state.alarmLevel === 3) {
      state.missionFailed = true;
      showEndMessage('MISSION FAILED — DATA PURGED');
    }
    updateHUD();
  }

  // ─── Scene Setup ───────────────────────────────────────────────────────────
  function initScene() {
    var T = window.THREE;
    if (!T) { console.warn('CyberHeist: THREE.js not found'); return false; }

    state.scene = new T.Scene();
    state.scene.background = new T.Color(0x050a0f);
    state.scene.fog = new T.Fog(0x050a0f, 30, 100);

    state.camera = new T.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    state.camera.position.set(0, 1.7, 5);

    state.renderer = new T.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.id = 'cyber-heist-canvas';
    state.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:900;';
    document.body.appendChild(state.renderer.domElement);

    // Lights
    var ambient = new T.AmbientLight(0x101820, 0.8);
    state.scene.add(ambient);
    var dir = new T.DirectionalLight(0x2244aa, 0.5);
    dir.position.set(5, 15, 5);
    dir.castShadow = true;
    state.scene.add(dir);

    // Ground
    var ground = makeBox(120, 0.2, 120, 0x0a0a10, 0, -0.1, 0);
    state.scene.add(ground);

    // player mesh (first-person, invisible; camera is the player)
    state.player = state.camera;

    buildServerFarm();
    buildCoolingUnits();
    buildMainframe();
    buildTargetServers();
    buildControlTerminal();
    buildBlastDoors();
    buildExtractionPoint();
    buildDataDriveMesh();
    buildCameras();
    buildGuards();
    buildToolPickups();
    buildOuterWalls();
    buildHUD();

    return true;
  }

  // ─── Server Farm ───────────────────────────────────────────────────────────
  function buildServerFarm() {
    var i, j, x, z, rack, light;
    var rows = 4;
    var cols = 5;
    state.serverLights = [];

    for (i = 0; i < rows; i++) {
      for (j = 0; j < cols; j++) {
        x = -10 + j * 5;
        z = -12 + i * 6;
        rack = makeBox(2, 4, 0.5, 0x112244, x, 2, z);
        rack.castShadow = true;
        rack.receiveShadow = true;
        rack.userData.type = 'serverRack';
        state.scene.add(rack);

        // PointLight status blink
        light = new THREE.PointLight(0x0044ff, 1.0, 3);
        light.position.set(x, 4.2, z - 0.3);
        state.scene.add(light);
        state.serverLights.push({ light: light, timer: Math.random() * 2, rack: rack });
      }
    }
  }

  function buildCoolingUnits() {
    var i, x, z, cyl;
    var positions = [
      [-14, -14], [14, -14], [-14, 10], [14, 10],
      [-14, -2], [14, -2]
    ];
    for (i = 0; i < positions.length; i++) {
      x = positions[i][0];
      z = positions[i][1];
      cyl = makeCylinder(0.6, 0.7, 3, 0x224433, x, 1.5, z);
      cyl.castShadow = true;
      state.scene.add(cyl);
      // fan top
      var fan = makeCylinder(0.55, 0.55, 0.2, 0x335544, x, 3.1, z);
      state.scene.add(fan);
    }
  }

  function buildMainframe() {
    var mf = makeBox(3, 5, 3, 0x001133, 0, 2.5, -15);
    mf.castShadow = true;
    mf.userData.type = 'mainframe';
    state.scene.add(mf);
    // glow strip
    var strip = makeBox(2.8, 0.1, 0.05, 0x0055ff, 0, 3, -13.45);
    state.scene.add(strip);
    var mfLight = new THREE.PointLight(0x0033ff, 1.5, 8);
    mfLight.position.set(0, 4, -14);
    state.scene.add(mfLight);
  }

  // ─── Target Servers ────────────────────────────────────────────────────────
  function buildTargetServers() {
    var i, x, z, srv;
    var positions = [
      [-8, -6], [0, -6], [8, -6],
      [-8, 2], [0, 2], [8, 2]
    ];
    state.servers = [];
    for (i = 0; i < positions.length; i++) {
      x = positions[i][0];
      z = positions[i][1];
      srv = makeBox(1.2, 2.5, 0.6, 0x1a1a2e, x, 1.25, z);
      srv.castShadow = true;
      srv.userData.type = 'targetServer';
      srv.userData.index = i;
      srv.userData.hacked = false;

      // status light (red = not hacked)
      var indicator = makeBox(0.15, 0.15, 0.05, 0xff2200, x, 2.4, z - 0.35);
      state.scene.add(indicator);
      srv.userData.indicator = indicator;

      state.scene.add(srv);
      state.servers.push(srv);
    }
  }

  // ─── Control Terminal ──────────────────────────────────────────────────────
  function buildControlTerminal() {
    var term = makeBox(1, 1.5, 0.5, 0x002244, -18, 0.75, 0);
    term.userData.type = 'controlTerminal';
    state.scene.add(term);
    var screen = makeBox(0.8, 0.5, 0.05, 0x0088cc, -18, 1.3, -0.28);
    state.scene.add(screen);
    state.controlTerminal = term;
  }

  // ─── Blast Doors ───────────────────────────────────────────────────────────
  function buildBlastDoors() {
    var door1 = makeBox(6, 5, 0.4, 0x334455, -3, 2.5, 18);
    var door2 = makeBox(6, 5, 0.4, 0x334455, 3, 2.5, 18);
    door1.userData.type = 'blastDoor';
    door2.userData.type = 'blastDoor';
    door1.visible = false;
    door2.visible = false;
    state.scene.add(door1);
    state.scene.add(door2);
    state.blastDoors = [door1, door2];
    state.blastDoorsOpen = true;
  }

  function closeBlastedDoors() {
    var i;
    for (i = 0; i < state.blastDoors.length; i++) {
      state.blastDoors[i].visible = true;
    }
    state.blastDoorsOpen = false;
  }

  function openBlastDoors() {
    var i;
    for (i = 0; i < state.blastDoors.length; i++) {
      state.blastDoors[i].visible = false;
    }
    state.blastDoorsOpen = true;
  }

  // ─── Extraction ────────────────────────────────────────────────────────────
  function buildExtractionPoint() {
    var ep = makeBox(3, 0.1, 3, 0x00aaff, 0, 0.05, 28);
    ep.userData.type = 'extraction';
    state.scene.add(ep);
    var epLight = new THREE.PointLight(0x00aaff, 1.2, 6);
    epLight.position.set(0, 1, 28);
    state.scene.add(epLight);
    state.extractionPoint = ep;
  }

  function buildDataDriveMesh() {
    var drive = makeBox(0.3, 0.1, 0.5, 0x00ff88, 999, 999, 999);
    drive.userData.type = 'dataDrive';
    drive.visible = false;
    state.scene.add(drive);
    state.dataDriveMesh = drive;
  }

  // ─── Cameras ───────────────────────────────────────────────────────────────
  function buildCameras() {
    var i, cam, cone, pos;
    var positions = [
      { x: -10, z: -20, angle: 0 },
      { x: 10,  z: -20, angle: Math.PI },
      { x: -18, z: 0,   angle: Math.PI / 2 },
      { x: 18,  z: 0,   angle: -Math.PI / 2 },
      { x: -10, z: 20,  angle: -Math.PI / 4 },
      { x: 10,  z: 20,  angle: Math.PI + Math.PI / 4 }
    ];
    state.cameras3d = [];

    for (i = 0; i < positions.length; i++) {
      pos = positions[i];
      cam = makeCylinder(0.15, 0.25, 0.6, 0x334455, pos.x, 4.0, pos.z);
      cam.rotation.z = Math.PI / 2;
      cam.userData.type = 'securityCamera';
      cam.userData.disabled = false;
      cam.userData.stunTimer = 0;
      cam.userData.sweepAngle = pos.angle;
      cam.userData.sweepDir = 1;
      cam.userData.playerInCone = false;
      cam.userData.playerInConeTimer = 0;
      cam.userData.index = i;

      // Vision cone (LineSegments)
      var coneGeo = buildConeGeo(pos.x, 4.0, pos.z, pos.angle);
      cone = new THREE.LineSegments(coneGeo, new THREE.LineBasicMaterial({ color: 0x00ff44, opacity: 0.4, transparent: true }));
      state.scene.add(cone);
      cam.userData.coneMesh = cone;

      state.scene.add(cam);
      state.cameras3d.push(cam);
    }
  }

  function buildConeGeo(ox, oy, oz, baseAngle) {
    var pts = [];
    var spread = Math.PI / 6; // 30 deg half-angle = 60 deg total sweep
    var reach = 12;
    var steps = 8;
    var i, a;
    // origin to left edge
    pts.push(ox, oy, oz);
    pts.push(ox + Math.sin(baseAngle - spread) * reach, oy - 1, oz + Math.cos(baseAngle - spread) * reach);
    // arc
    for (i = 0; i <= steps; i++) {
      a = (baseAngle - spread) + (2 * spread * i / steps);
      pts.push(ox + Math.sin(a) * reach, oy - 1, oz + Math.cos(a) * reach);
      if (i < steps) {
        a = (baseAngle - spread) + (2 * spread * (i + 1) / steps);
        pts.push(ox + Math.sin(a) * reach, oy - 1, oz + Math.cos(a) * reach);
      }
    }
    // right edge back to origin
    pts.push(ox + Math.sin(baseAngle + spread) * reach, oy - 1, oz + Math.cos(baseAngle + spread) * reach);
    pts.push(ox, oy, oz);

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }

  // ─── Guards ────────────────────────────────────────────────────────────────
  function buildGuards() {
    var i, guard;
    var patrolRoutes = [
      [{ x: -8, z: -5 }, { x: -8, z: 5 }],
      [{ x: 0,  z: -5 }, { x: 0,  z: 5 }],
      [{ x: 8,  z: -5 }, { x: 8,  z: 5 }],
      [{ x: -14, z: -10 }, { x: -14, z: 10 }],
      [{ x: 14, z: -10 }, { x: 14, z: 10 }],
      [{ x: -5, z: -18 }, { x: 5,  z: -18 }],
      [{ x: -5, z: 16 },  { x: 5,  z: 16 }],
      [{ x: 0,  z: -20 }, { x: 0,  z: 20 }]
    ];
    state.guards = [];
    for (i = 0; i < 8; i++) {
      guard = spawnGuard(patrolRoutes[i], i);
      state.guards.push(guard);
    }
  }

  function spawnGuard(route, index) {
    var mesh = makeBox(0.5, 1.8, 0.5, 0x334466, route[0].x, 0.9, route[0].z);
    mesh.castShadow = true;
    state.scene.add(mesh);
    var g = {
      mesh: mesh,
      route: route,
      routeIndex: 0,
      alive: true,
      stunned: false,
      stunTimer: 0,
      alerted: false,
      investigating: false,
      investigateTimer: 0,
      investigateTarget: null,
      radioCheckTimer: 120 + index * 15,
      speed: 2.5 + Math.random() * 0.5
    };
    return g;
  }

  function spawnExtraGuards() {
    var extraRoute = [{ x: -5, z: 0 }, { x: 5, z: 0 }];
    var i, guard;
    for (i = 0; i < 4; i++) {
      guard = spawnGuard([
        { x: -10 + i * 5, z: -8 },
        { x: -10 + i * 5, z: 8 }
      ], 100 + i);
      state.extraGuards.push(guard);
      state.guards.push(guard);
    }
  }

  // ─── Tool Pickups ──────────────────────────────────────────────────────────
  function buildToolPickups() {
    var placements = [
      { type: 'spike',     x: -16, z: -16, color: 0xff4400 },
      { type: 'emp',       x: 16,  z: -16, color: 0xffaa00 },
      { type: 'emp',       x: 16,  z: 12,  color: 0xffaa00 },
      { type: 'holodecoy', x: -16, z: 12,  color: 0xaa88ff },
      { type: 'netbuster', x: 0,   z: -22, color: 0xff0044 },
      { type: 'tranq',     x: -6,  z: -22, color: 0x00ffaa },
      { type: 'tranq',     x: 6,   z: -22, color: 0x00ffaa },
      { type: 'spike',     x: -16, z: 0,   color: 0xff4400 }
    ];
    var i, p, mesh;
    state.tools = [];
    for (i = 0; i < placements.length; i++) {
      p = placements[i];
      mesh = makeBox(0.3, 0.3, 0.3, p.color, p.x, 0.3, p.z);
      mesh.userData.toolType = p.type;
      mesh.userData.picked = false;
      state.scene.add(mesh);
      state.tools.push(mesh);
    }
  }

  // ─── Outer Walls ───────────────────────────────────────────────────────────
  function buildOuterWalls() {
    var walls = [
      { w: 40, h: 5, d: 0.5, x: 0,   y: 2.5, z: -22 },
      { w: 40, h: 5, d: 0.5, x: 0,   y: 2.5, z: 22  },
      { w: 0.5, h: 5, d: 44, x: -20, y: 2.5, z: 0   },
      { w: 0.5, h: 5, d: 44, x: 20,  y: 2.5, z: 0   }
    ];
    var i, w;
    for (i = 0; i < walls.length; i++) {
      w = walls[i];
      state.scene.add(makeBox(w.w, w.h, w.d, 0x1a1a2e, w.x, w.y, w.z));
    }
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'cyber-heist-hud';
    hud.style.cssText = [
      'position:fixed',
      'bottom:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:1000',
      'background:rgba(0,10,20,0.85)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border:1px solid #004466',
      'border-radius:4px',
      'letter-spacing:1px',
      'pointer-events:none',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;
    updateHUD();
  }

  function alarmLabel() {
    var labels = ['SILENT', 'SUSPICIOUS', 'LOCKDOWN', 'PURGE'];
    return labels[state.alarmLevel] || 'UNKNOWN';
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var aliveGuards = 0;
    var i;
    for (i = 0; i < state.guards.length; i++) {
      if (state.guards[i].alive) aliveGuards++;
    }
    var mins = toMM_SS(Math.max(0, state.extractionTimer));
    state.hudEl.textContent =
      'CYBER HEIST' +
      ' │ SERVERS: ' + state.hackedServers + '/' + state.totalServers +
      ' │ ALARM: ' + alarmLabel() +
      ' │ GUARDS: ' + aliveGuards +
      ' │ EMP: ' + state.toolsHeld.emp +
      ' │ EXTRACTION: ' + mins;
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var key = e.key.toLowerCase();
    if (!state.active) {
      // activation detection
      if (key === 'c') { state.cDown = true; state.cDownTime = Date.now(); }
      if (key === 'y') { state.yDown = true; state.yDownTime = Date.now(); }
      if (state.cDown && state.yDown) {
        var diff = Math.abs(state.cDownTime - state.yDownTime);
        if (diff <= 400) { activate(); }
      }
      return;
    }

    state.moveKeys[key] = true;

    if (key === 'e') { tryHack(); }
    if (key === 'g') { throwEMP(); }
    if (key === 'h') { deployHolodecoy(); }
    if (key === 'n') { useNetbuster(); }
    if (key === 'q') { fireTranq(); }
    if (key === 'escape') { deactivate(); }
  }

  function onKeyUp(e) {
    var key = e.key.toLowerCase();
    if (!state.active) {
      if (key === 'c') { state.cDown = false; }
      if (key === 'y') { state.yDown = false; }
      return;
    }
    state.moveKeys[key] = false;
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    state.playerYaw -= dx * 0.002;
    state.playerPitch -= dy * 0.002;
    state.playerPitch = Math.max(-1.2, Math.min(1.2, state.playerPitch));
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;
  }

  function onPointerLockChange() {
    state.pointerLocked = (document.pointerLockElement === state.renderer.domElement);
  }

  function onResize() {
    if (!state.active) return;
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Interaction ───────────────────────────────────────────────────────────
  function tryHack() {
    if (state.missionFailed || state.missionClear) return;
    var pos = state.camera.position;
    var i, srv, d;

    // Check control terminal during lockdown
    if (state.lockdownActive && state.controlTerminal) {
      d = dist3D(pos, state.controlTerminal.position);
      if (d < 3) {
        state.controlTerminalHacking = true;
        state.controlTerminalTimer = state.controlTerminalDuration;
        return;
      }
    }

    // Check target servers
    if (!state.hasSpikeEquipped && state.toolsHeld.spike < 1) return;
    for (i = 0; i < state.servers.length; i++) {
      srv = state.servers[i];
      if (srv.userData.hacked) continue;
      d = dist3D(pos, srv.position);
      if (d < 3) {
        state.hackingServer = srv;
        state.hackTimer = state.hackDuration;
        state.hasSpikeEquipped = true;
        return;
      }
    }
  }

  function completeServerHack(srv) {
    srv.userData.hacked = true;
    srv.material.color.setHex(0x004422);
    var ind = srv.userData.indicator;
    if (ind) { ind.material.color.setHex(0x00ff44); }
    state.hackedServers++;
    state.score += 500;
    updateHUD();

    if (state.hackedServers >= state.totalServers) {
      // data drive appears near last server
      state.hasDataDrive = false;
      state.dataDriveMesh.position.copy(srv.position);
      state.dataDriveMesh.position.y = 0.15;
      state.dataDriveMesh.visible = true;
    }
  }

  function throwEMP() {
    if (state.toolsHeld.emp < 1) return;
    state.toolsHeld.emp--;
    // stun all cameras and guards within radius 10
    var pos = state.camera.position;
    var i, cam, g;
    for (i = 0; i < state.cameras3d.length; i++) {
      cam = state.cameras3d[i];
      if (cam.userData.disabled) continue;
      if (dist3D(pos, cam.position) <= 10) {
        cam.userData.stunTimer = 15;
        cam.userData.coneMesh.material.color.setHex(0x555555);
      }
    }
    for (i = 0; i < state.guards.length; i++) {
      g = state.guards[i];
      if (!g.alive || g.stunned) continue;
      if (dist3D(pos, g.mesh.position) <= 10) {
        g.stunned = true;
        g.stunTimer = 15;
        g.mesh.material.color.setHex(0xffff00);
      }
    }
    updateHUD();
  }

  function deployHolodecoy() {
    if (state.toolsHeld.holodecoy < 1) return;
    if (state.holoActive) return;
    state.toolsHeld.holodecoy--;
    var pos = state.camera.position;
    if (!state.holodecoy) {
      state.holodecoy = makeBox(0.5, 1.8, 0.5, 0xaa8866, pos.x + 1, 0.9, pos.z);
      state.scene.add(state.holodecoy);
    } else {
      state.holodecoy.position.set(pos.x + 1, 0.9, pos.z);
      state.holodecoy.visible = true;
    }
    state.holoActive = true;
    state.holodecoyTimer = 20;
  }

  function useNetbuster() {
    if (state.toolsHeld.netbuster < 1) return;
    var pos = state.camera.position;
    var i, cam;
    var closest = null;
    var closestDist = 15;
    for (i = 0; i < state.cameras3d.length; i++) {
      cam = state.cameras3d[i];
      if (cam.userData.disabled) continue;
      var d = dist3D(pos, cam.position);
      if (d < closestDist) {
        closestDist = d;
        closest = cam;
      }
    }
    if (closest) {
      state.toolsHeld.netbuster--;
      closest.userData.disabled = true;
      closest.material.color.setHex(0x111111);
      closest.userData.coneMesh.visible = false;
    }
  }

  function fireTranq() {
    if (state.toolsHeld.tranq < 1) return;
    var pos = state.camera.position;
    var i, g, d;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(state.camera.rotation);

    for (i = 0; i < state.guards.length; i++) {
      g = state.guards[i];
      if (!g.alive || g.stunned) continue;
      d = dist3D(pos, g.mesh.position);
      if (d < 20) {
        // check if in front
        var toGuard = new THREE.Vector3().subVectors(g.mesh.position, pos).normalize();
        if (dir.dot(toGuard) > 0.7) {
          state.toolsHeld.tranq--;
          g.stunned = true;
          g.stunTimer = 30;
          g.mesh.material.color.setHex(0x225522);
          // guard sound investigation in radius 20
          investigateSoundAt(pos.x, pos.z, 20);
          break;
        }
      }
    }
    updateHUD();
  }

  function investigateSoundAt(sx, sz, radius) {
    var i, g, d;
    for (i = 0; i < state.guards.length; i++) {
      g = state.guards[i];
      if (!g.alive || g.stunned || g.investigating) continue;
      d = dist2D(g.mesh.position.x, g.mesh.position.z, sx, sz);
      if (d <= radius) {
        g.investigating = true;
        g.investigateTimer = 3;
        g.investigateTarget = { x: sx, z: sz };
      }
    }
  }

  function checkGuardFindBody() {
    var i, j, g, b, d;
    for (i = 0; i < state.guards.length; i++) {
      g = state.guards[i];
      if (!g.alive || g.stunned) continue;
      for (j = 0; j < state.bodies.length; j++) {
        b = state.bodies[j];
        d = dist2D(g.mesh.position.x, g.mesh.position.z, b.x, b.z);
        if (d < 3) {
          triggerAlarm(1);
          return;
        }
      }
    }
  }

  // ─── Camera Vision Check ───────────────────────────────────────────────────
  function playerInCone(cam) {
    if (cam.userData.disabled || cam.userData.stunTimer > 0) return false;
    var cx = cam.position.x;
    var cz = cam.position.z;
    var px = state.camera.position.x;
    var pz = state.camera.position.z;
    var dx = px - cx;
    var dz = pz - cz;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 12) return false;
    var angle = cam.userData.sweepAngle;
    var spread = Math.PI / 6;
    var dir = Math.atan2(dx, dz);
    var diff = dir - angle;
    // normalize diff
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Math.abs(diff) <= spread;
  }

  // ─── Tool Pickup Check ─────────────────────────────────────────────────────
  function checkToolPickups() {
    var pos = state.camera.position;
    var i, tool;
    for (i = 0; i < state.tools.length; i++) {
      tool = state.tools[i];
      if (tool.userData.picked) continue;
      if (dist3D(pos, tool.position) < 1.5) {
        tool.userData.picked = true;
        tool.visible = false;
        state.toolsHeld[tool.userData.toolType]++;
        updateHUD();
      }
    }
  }

  function checkDataDrivePickup() {
    if (state.hasDataDrive || !state.dataDriveMesh.visible) return;
    var pos = state.camera.position;
    if (dist3D(pos, state.dataDriveMesh.position) < 1.5) {
      state.hasDataDrive = true;
      state.dataDriveMesh.visible = false;
    }
  }

  function checkExtraction() {
    if (!state.hasDataDrive || state.dataExtracted) return;
    var pos = state.camera.position;
    if (dist3D(pos, state.extractionPoint.position) < 3) {
      state.dataExtracted = true;
      state.missionClear = true;
      if (state.alarmCount === 0) state.score += 3000;
      showEndMessage('MISSION COMPLETE — DATA EXTRACTED — SCORE: ' + state.score);
    }
  }

  // ─── End Screen ────────────────────────────────────────────────────────────
  function showEndMessage(msg) {
    var el = document.createElement('div');
    el.id = 'cyber-heist-end';
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:1100',
      'background:rgba(0,5,15,0.95)',
      'color:#00ffcc',
      'font-family:monospace',
      'font-size:24px',
      'font-weight:bold',
      'padding:32px 48px',
      'border:2px solid #00ffcc',
      'border-radius:8px',
      'text-align:center',
      'letter-spacing:2px'
    ].join(';');
    el.textContent = msg;
    var close = document.createElement('div');
    close.style.cssText = 'margin-top:16px;font-size:14px;color:#aaa;cursor:pointer;';
    close.textContent = '[ESC to exit]';
    el.appendChild(close);
    document.body.appendChild(el);
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    state.active = true;
    state.cDown = false;
    state.yDown = false;

    if (!initScene()) { state.active = false; return; }

    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onResize, false);
    document.addEventListener('pointerlockchange', onPointerLockChange, false);

    state.renderer.domElement.addEventListener('click', function () {
      state.renderer.domElement.requestPointerLock();
    });

    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(loop);
  }

  function deactivate() {
    if (!state.active) return;
    state.active = false;

    cancelAnimationFrame(state.animFrameId);
    state.animFrameId = null;

    if (document.exitPointerLock) document.exitPointerLock();

    window.removeEventListener('keydown', onKeyDown, false);
    window.removeEventListener('keyup', onKeyUp, false);
    window.removeEventListener('mousemove', onMouseMove, false);
    window.removeEventListener('resize', onResize, false);
    document.removeEventListener('pointerlockchange', onPointerLockChange, false);

    var canvas = document.getElementById('cyber-heist-canvas');
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    var hud = document.getElementById('cyber-heist-hud');
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud);
    var end = document.getElementById('cyber-heist-end');
    if (end && end.parentNode) end.parentNode.removeChild(end);

    // Reset state fields
    state.alarmLevel = 0;
    state.alarmCount = 0;
    state.score = 3000;
    state.hackedServers = 0;
    state.hasDataDrive = false;
    state.dataExtracted = false;
    state.missionFailed = false;
    state.missionClear = false;
    state.lockdownActive = false;
    state.lockdownTimer = 0;
    state.hackingServer = null;
    state.hackTimer = 0;
    state.holoActive = false;
    state.holodecoyTimer = 0;
    state.toolsHeld = { spike: 0, emp: 0, holodecoy: 0, netbuster: 0, tranq: 0 };
    state.guards = [];
    state.extraGuards = [];
    state.cameras3d = [];
    state.servers = [];
    state.tools = [];
    state.serverLights = [];
    state.blastDoors = [];
    state.bodies = [];
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.player = null;
    state.holodecoy = null;
    state.controlTerminal = null;
    state.extractionPoint = null;
    state.dataDriveMesh = null;
    state.hudEl = null;
    state.pointerLocked = false;
    state.moveKeys = {};
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.extractionTimer = 45 * 60;
    state.radioCheckTimer = 120;
    state.cameraStunTimer = 0;
    state.blastDoorsOpen = true;
    state.controlTerminalHacking = false;
    state.controlTerminalTimer = 0;
    state.hasSpikeEquipped = false;
  }

  // ─── Main Loop ─────────────────────────────────────────────────────────────
  function loop(now) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);

    var dt = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    if (!state.missionFailed && !state.missionClear) {
      updatePlayer(dt);
      updateGuards(dt);
      updateCameras(dt);
      updateServerLightBlink(dt);
      updateHacking(dt);
      updateHolodecoy(dt);
      updateLockdown(dt);
      updateControlTerminalHack(dt);
      updateExtractTimer(dt);
      checkToolPickups();
      checkDataDrivePickup();
      checkExtraction();
      checkGuardFindBody();
    }

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Player Movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 5;
    var cam = state.camera;
    var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
    forward.y = 0;
    forward.normalize();
    var right = new THREE.Vector3(1, 0, 0).applyEuler(cam.rotation);
    right.y = 0;
    right.normalize();

    var mk = state.moveKeys;
    if (mk['w'] || mk['arrowup'])    { cam.position.addScaledVector(forward, speed * dt); }
    if (mk['s'] || mk['arrowdown'])  { cam.position.addScaledVector(forward, -speed * dt); }
    if (mk['a'] || mk['arrowleft'])  { cam.position.addScaledVector(right, -speed * dt); }
    if (mk['d'] || mk['arrowright']) { cam.position.addScaledVector(right, speed * dt); }

    // Keep player at eye height
    cam.position.y = 1.7;

    // Clamp to building area
    cam.position.x = Math.max(-19.5, Math.min(19.5, cam.position.x));
    cam.position.z = Math.max(-21.5, Math.min(30, cam.position.z));
  }

  // ─── Guard AI ──────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    var i, g, target, dx, dz, d, speed;
    for (i = 0; i < state.guards.length; i++) {
      g = state.guards[i];
      if (!g.alive) continue;

      // Radio check
      g.radioCheckTimer -= dt;
      if (g.radioCheckTimer <= 0) {
        g.radioCheckTimer = 120;
        // silence = alarm (if guard is stunned, radio silence)
        if (g.stunned) {
          triggerAlarm(1);
        }
      }

      // Stun recovery
      if (g.stunned) {
        g.stunTimer -= dt;
        if (g.stunTimer <= 0) {
          g.stunned = false;
          g.mesh.material.color.setHex(0x334466);
          // record body if tranqed (stunner removes from patrol visually only)
          state.bodies.push({ x: g.mesh.position.x, z: g.mesh.position.z });
          g.alive = false;
          g.mesh.visible = false;
          updateHUD();
        }
        continue;
      }

      speed = g.speed;
      if (state.alarmLevel >= 1) speed *= 1.5;

      // Holodecoy distraction
      if (state.holoActive && state.holodecoy) {
        target = state.holodecoy.position;
        dx = target.x - g.mesh.position.x;
        dz = target.z - g.mesh.position.z;
        d = Math.sqrt(dx * dx + dz * dz);
        if (d < 18) {
          if (d > 0.5) {
            g.mesh.position.x += (dx / d) * speed * dt;
            g.mesh.position.z += (dz / d) * speed * dt;
          }
          continue;
        }
      }

      // Investigate sound
      if (g.investigating) {
        target = g.investigateTarget;
        dx = target.x - g.mesh.position.x;
        dz = target.z - g.mesh.position.z;
        d = Math.sqrt(dx * dx + dz * dz);
        if (d > 1) {
          g.mesh.position.x += (dx / d) * speed * dt;
          g.mesh.position.z += (dz / d) * speed * dt;
        } else {
          g.investigateTimer -= dt;
          if (g.investigateTimer <= 0) {
            g.investigating = false;
          }
        }
        continue;
      }

      // Patrol route
      var pt = g.route[g.routeIndex];
      dx = pt.x - g.mesh.position.x;
      dz = pt.z - g.mesh.position.z;
      d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.3) {
        g.routeIndex = (g.routeIndex + 1) % g.route.length;
      } else {
        g.mesh.position.x += (dx / d) * speed * dt;
        g.mesh.position.z += (dz / d) * speed * dt;
      }

      // Spot player (within 8 units)
      var pd = dist3D(g.mesh.position, state.camera.position);
      if (pd < 8 && state.alarmLevel >= 1) {
        triggerAlarm(1);
      }
    }
  }

  // ─── Camera Updates ────────────────────────────────────────────────────────
  function updateCameras(dt) {
    var i, cam, sweepSpeed, inCone;
    sweepSpeed = 0.5; // rad/s
    for (i = 0; i < state.cameras3d.length; i++) {
      cam = state.cameras3d[i];
      if (cam.userData.disabled) continue;

      // Stun timer
      if (cam.userData.stunTimer > 0) {
        cam.userData.stunTimer -= dt;
        if (cam.userData.stunTimer <= 0) {
          cam.userData.stunTimer = 0;
          cam.userData.coneMesh.material.color.setHex(0x00ff44);
        }
        cam.userData.playerInConeTimer = 0;
        continue;
      }

      // Sweep
      cam.userData.sweepAngle += sweepSpeed * cam.userData.sweepDir * dt;
      var spread = Math.PI / 3; // 60° total sweep
      if (cam.userData.sweepAngle > spread) { cam.userData.sweepDir = -1; }
      if (cam.userData.sweepAngle < -spread) { cam.userData.sweepDir = 1; }

      // Update cone mesh rotation
      cam.userData.coneMesh.rotation.y = cam.userData.sweepAngle;

      inCone = playerInCone(cam);
      if (inCone) {
        cam.userData.playerInConeTimer += dt;
        cam.userData.coneMesh.material.color.setHex(0xff4400);
        if (cam.userData.playerInConeTimer >= 1) {
          triggerAlarm(1);
          cam.userData.playerInConeTimer = 0;
        }
      } else {
        cam.userData.playerInConeTimer = 0;
        cam.userData.coneMesh.material.color.setHex(0x00ff44);
      }
    }
  }

  // ─── Server Light Blink ────────────────────────────────────────────────────
  function updateServerLightBlink(dt) {
    var i, sl;
    for (i = 0; i < state.serverLights.length; i++) {
      sl = state.serverLights[i];
      sl.timer -= dt;
      if (sl.timer <= 0) {
        sl.timer = 0.5 + Math.random() * 1.5;
        sl.light.intensity = sl.light.intensity > 0.5 ? 0.1 : 1.0;
      }
    }
  }

  // ─── Hacking ───────────────────────────────────────────────────────────────
  function updateHacking(dt) {
    if (!state.hackingServer) return;
    // Alarm bypass: spike bypasses alarm check
    state.hackTimer -= dt;
    if (state.hudEl) {
      state.hudEl.textContent =
        'HACKING... ' + Math.max(0, Math.ceil(state.hackTimer)) + 's | ' + state.hudEl.textContent;
    }
    if (state.hackTimer <= 0) {
      completeServerHack(state.hackingServer);
      state.hackingServer = null;
      state.hackTimer = 0;
      updateHUD();
    }
  }

  // ─── Holodecoy ─────────────────────────────────────────────────────────────
  function updateHolodecoy(dt) {
    if (!state.holoActive) return;
    state.holodecoyTimer -= dt;
    if (state.holodecoy) {
      // move in opposite direction from player
      var cam = state.camera;
      var forward = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation);
      forward.y = 0;
      forward.normalize();
      state.holodecoy.position.x -= forward.x * 3 * dt;
      state.holodecoy.position.z -= forward.z * 3 * dt;
    }
    if (state.holodecoyTimer <= 0) {
      state.holoActive = false;
      if (state.holodecoy) state.holodecoy.visible = false;
    }
  }

  // ─── Lockdown Timer ────────────────────────────────────────────────────────
  function updateLockdown(dt) {
    if (!state.lockdownActive) return;
    state.lockdownTimer -= dt;
    if (state.lockdownTimer <= 0) {
      // Lockdown expired without bypass = purge
      if (state.alarmLevel >= 2 && !state.missionFailed && !state.missionClear) {
        triggerAlarm(1); // push to 3 = PURGE
      }
      state.lockdownActive = false;
    }
  }

  // ─── Control Terminal Hack ─────────────────────────────────────────────────
  function updateControlTerminalHack(dt) {
    if (!state.controlTerminalHacking) return;
    state.controlTerminalTimer -= dt;
    if (state.controlTerminalTimer <= 0) {
      state.controlTerminalHacking = false;
      // revert lockdown to suspicious
      if (state.alarmLevel >= 2) {
        state.alarmLevel = 1;
        openBlastDoors();
        state.lockdownActive = false;
        updateHUD();
      }
    }
  }

  // ─── Extraction Timer ──────────────────────────────────────────────────────
  function updateExtractTimer(dt) {
    state.extractionTimer -= dt;
    if (state.extractionTimer <= 0) {
      state.extractionTimer = 0;
      if (!state.missionFailed && !state.missionClear) {
        state.missionFailed = true;
        showEndMessage('MISSION FAILED — TIME EXPIRED');
      }
    }
    updateHUD();
  }

  // ─── Public API ────────────────────────────────────────────────────────────
  window.CyberHeist = {
    activate: activate,
    deactivate: deactivate,
    getState: function () { return state; }
  };

  // Key listener for activation (before module is active)
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);

}(window));
