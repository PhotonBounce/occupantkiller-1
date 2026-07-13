window.CyberpunkHeist = (function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys C + H within 400ms
    cDown: false,
    hDown: false,
    cDownTime: 0,
    hDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    player: { x: 0, y: 1.8, z: 8 },
    playerMesh: null,
    playerYaw: 0,
    playerPitch: 0,
    playerHP: 100,
    moveKeys: {},
    pointerLocked: false,
    // floor / building
    currentFloor: 1,
    // mission timer 10 minutes = 600s
    missionTimer: 600,
    missionFailed: false,
    missionClear: false,
    // data state: 0=UNSECURED 1=COPYING 2=SECURED
    dataState: 0,
    hackCopyTimer: 0,
    hackCopyDuration: 8,
    dataDriveMesh: null,
    hasDataDrive: false,
    // security
    securityLevel: 0,  // 0=NOMINAL 1=ELEVATED 2=ALARM
    securityTimer: 0,
    camerasDisabled: false,
    camerasDisabledTimer: 0,
    // hacking terminal
    hackingTerminal: null,
    hackingTimer: 0,
    hackingDuration: 3,
    hackingActive: false,
    // guards
    guards: [],
    guardCount: 30,
    // turrets
    turrets: [],
    // cameras
    cameras3d: [],
    // cyborg enforcer
    cyborg: null,
    cyborgHP: 300,
    cyborgSpawned: false,
    // AI core
    aiCoreMesh: null,
    aiCoreLight: null,
    aiCorePulse: 0,
    // HUD
    hudEl: null,
    // extraction
    extractionReached: false,
    // terminal sequence minigame
    terminalActive: false,
    terminalEl: null,
    terminalSequence: [],
    terminalInput: [],
    terminalTarget: null,
    terminalType: '',  // 'door' 'camera_hub' 'ai_core'
    // floor meshes groups
    floorGroups: [],
    // doors needing hack
    doors: [],
    // alarm blink
    alarmBlinkTimer: 0,
    // neon strip pulse
    neonPulse: 0,
    // city backdrop
    cityLights: []
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function pad2(n) {
    return (n < 10 ? '0' : '') + Math.floor(n);
  }

  function toMM_SS(s) {
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return pad2(m) + ':' + pad2(sec);
  }

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }

  function randFloat(a, b) {
    return Math.random() * (b - a) + a;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─── Geometry helpers ───────────────────────────────────────────────────────
  function makeBox(w, h, d, colorHex, x, y, z, opacity) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var matOpts = { color: colorHex };
    if (opacity !== undefined && opacity < 1) {
      matOpts.transparent = true;
      matOpts.opacity = opacity;
    }
    var mat = new THREE.MeshLambertMaterial(matOpts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeCyl(rt, rb, h, seg, colorHex, x, y, z, opacity) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, seg || 8);
    var matOpts = { color: colorHex };
    if (opacity !== undefined && opacity < 1) {
      matOpts.transparent = true;
      matOpts.opacity = opacity;
    }
    var mat = new THREE.MeshLambertMaterial(matOpts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeSphere(r, colorHex, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 12, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : r, z || 0);
    return mesh;
  }

  function makeCone(r, h, colorHex, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: colorHex });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y !== undefined ? y : h / 2, z || 0);
    return mesh;
  }

  function makeNeonLines(points, colorHex) {
    var geo = new THREE.BufferGeometry();
    var verts = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      verts[i * 3] = points[i][0];
      verts[i * 3 + 1] = points[i][1];
      verts[i * 3 + 2] = points[i][2];
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: colorHex });
    return new THREE.LineSegments(geo, mat);
  }

  function makeDoorFrame(w, h, colorHex, x, y, z) {
    var pts = [
      [x - w / 2, y, z], [x + w / 2, y, z],
      [x + w / 2, y, z], [x + w / 2, y + h, z],
      [x + w / 2, y + h, z], [x - w / 2, y + h, z],
      [x - w / 2, y + h, z], [x - w / 2, y, z]
    ];
    return makeNeonLines(pts, colorHex);
  }

  function addPointLight(scene, colorHex, intensity, dist, x, y, z) {
    var light = new THREE.PointLight(colorHex, intensity, dist);
    light.position.set(x, y, z);
    scene.add(light);
    return light;
  }

  // ─── Scene Build ────────────────────────────────────────────────────────────
  function buildScene() {
    var sc = state.scene;

    // ambient
    var amb = new THREE.AmbientLight(0x112233, 0.6);
    sc.add(amb);

    // directional dim blue moonlight
    var dir = new THREE.DirectionalLight(0x223366, 0.4);
    dir.position.set(10, 40, 20);
    sc.add(dir);

    buildCityBackdrop(sc);
    buildOmniCorpTower(sc);
    buildLobby(sc);
    buildSecurityHub(sc);
    buildResearchLab(sc);
    buildExecutiveFloor(sc);
    buildServerRoom(sc);
    buildRooftop(sc);

    spawnGuards(sc);
    spawnTurrets(sc);
    spawnCameras(sc);
  }

  function buildCityBackdrop(sc) {
    // ground plane
    var ground = makeBox(300, 0.5, 300, 0x050510, 0, -0.25, 0);
    sc.add(ground);

    // distant city towers
    var towers = [
      { x: -80, z: -120, w: 18, h: 120, d: 18, c: 0x111122 },
      { x: -60, z: -140, w: 14, h: 90,  d: 14, c: 0x111133 },
      { x: 80,  z: -130, w: 20, h: 140, d: 20, c: 0x111122 },
      { x: 100, z: -110, w: 12, h: 80,  d: 12, c: 0x111133 },
      { x: -100,z: -100, w: 16, h: 100, d: 16, c: 0x111122 },
      { x: 60,  z: -150, w: 22, h: 160, d: 22, c: 0x111133 },
      { x: -50, z: -160, w: 10, h: 70,  d: 10, c: 0x111122 },
      { x: 120, z: -140, w: 18, h: 110, d: 18, c: 0x111133 },
      { x: -120,z: -130, w: 14, h: 95,  d: 14, c: 0x111122 },
      { x: 40,  z: -170, w: 16, h: 130, d: 16, c: 0x111133 }
    ];
    for (var i = 0; i < towers.length; i++) {
      var t = towers[i];
      var mesh = makeBox(t.w, t.h, t.d, t.c, t.x, t.h / 2, t.z);
      sc.add(mesh);
      // neon signs on towers
      var signColors = [0xFF00AA, 0x00FFAA, 0x4444FF, 0xFF4400, 0x00AAFF];
      var sc2 = signColors[i % signColors.length];
      var pl = addPointLight(sc, sc2, 1.5, 40, t.x, t.h * 0.7, t.z);
      state.cityLights.push(pl);
      // small neon box sign
      var sign = makeBox(4, 1.5, 0.3, sc2, t.x, t.h * 0.7, t.z + t.d / 2 + 0.2);
      sc.add(sign);
    }

    // street neon strips along the ground
    var streetNeons = [
      [[-150, 0.1, 30], [150, 0.1, 30]],
      [[-150, 0.1, -30], [150, 0.1, -30]],
      [[40, 0.1, -150], [40, 0.1, 50]]
    ];
    for (var j = 0; j < streetNeons.length; j++) {
      var ln = makeNeonLines(streetNeons[j], 0x00FFAA);
      sc.add(ln);
    }

    // neon ground reflections (point lights near ground)
    addPointLight(sc, 0xFF00AA, 0.8, 60, -40, 0.5, 20);
    addPointLight(sc, 0x00FFAA, 0.8, 60, 40, 0.5, 20);
    addPointLight(sc, 0x4444FF, 0.6, 50, 0, 0.5, 30);
  }

  function buildOmniCorpTower(sc) {
    // Main tower body 20x90x20 at origin
    var tower = makeBox(20, 90, 20, 0x112233, 0, 45, 0);
    sc.add(tower);

    // Glass facade panels
    var glassFaces = [
      { w: 18, h: 88, d: 0.3, x: 0, y: 45, z: 10.15 },
      { w: 18, h: 88, d: 0.3, x: 0, y: 45, z: -10.15 },
      { w: 0.3, h: 88, d: 18, x: 10.15, y: 45, z: 0 },
      { w: 0.3, h: 88, d: 18, x: -10.15, y: 45, z: 0 }
    ];
    for (var f = 0; f < glassFaces.length; f++) {
      var gf = glassFaces[f];
      var gm = makeBox(gf.w, gf.h, gf.d, 0x224466, gf.x, gf.y, gf.z, 0.35);
      sc.add(gm);
    }

    // Omni Corp logo neon (top of tower)
    addPointLight(sc, 0x00FFFF, 3, 30, 0, 92, 0);
    var logoBox = makeBox(8, 2, 0.5, 0x00FFFF, 0, 92, 10.5);
    sc.add(logoBox);

    // Floor indicator lights on tower exterior
    var floorColors = [0xFF00AA, 0x00FFAA, 0x4444FF, 0xFF4400];
    for (var fl = 0; fl < 8; fl++) {
      var fy = 6 + fl * 10;
      addPointLight(sc, floorColors[fl % 4], 0.4, 12, 10.5, fy, 0);
    }
  }

  function floorY(floor) {
    return (floor - 1) * 3;
  }

  // helper to add floor ceiling and walls
  function addFloorShell(sc, floor, color) {
    var fy = floorY(floor);
    var floor_mesh = makeBox(20, 0.3, 20, color || 0x112233, 0, fy, 0);
    sc.add(floor_mesh);
    var ceiling = makeBox(20, 0.3, 20, color || 0x112233, 0, fy + 3, 0);
    sc.add(ceiling);
    // neon floor strips
    var strip = makeNeonLines([
      [-9, fy + 0.16, -9], [9, fy + 0.16, -9],
      [9, fy + 0.16, -9], [9, fy + 0.16, 9],
      [9, fy + 0.16, 9], [-9, fy + 0.16, 9],
      [-9, fy + 0.16, 9], [-9, fy + 0.16, -9]
    ], 0x00FFAA);
    sc.add(strip);
    return fy;
  }

  function buildLobby(sc) {
    // Floor 1 — lobby
    var fy = addFloorShell(sc, 1, 0x223355);

    // Lobby floor — larger box representing lobby area
    var lobbyFloor = makeBox(30, 0.5, 30, 0x223355, 0, fy + 0.25, 0);
    sc.add(lobbyFloor);

    // Lobby ceiling
    var lobbyCeiling = makeBox(30, 0.3, 30, 0x1a2a44, 0, fy + 6, 0);
    sc.add(lobbyCeiling);

    // Reception desk
    var desk = makeBox(8, 1.2, 2, 0x334466, 0, fy + 0.6, -4);
    sc.add(desk);

    // Hologram display above desk
    var hologram = makeSphere(0.6, 0x00FFFF, 0, fy + 2.5, -4);
    sc.add(hologram);
    addPointLight(sc, 0x00FFFF, 1.2, 5, 0, fy + 2.5, -4);

    // Reception AI — sphere head on cylinder body
    var aiHead = makeSphere(0.4, 0x00AAFF, 0, fy + 2.0, -4);
    sc.add(aiHead);
    var aiBody = makeCyl(0.25, 0.25, 1.0, 8, 0x1a3366, 0, fy + 1.2, -4);
    sc.add(aiBody);
    addPointLight(sc, 0x0088FF, 0.5, 3, 0, fy + 2.0, -4);

    // Pillars
    var pillarPositions = [[-8, -8], [8, -8], [-8, 8], [8, 8]];
    for (var p = 0; p < pillarPositions.length; p++) {
      var pp = pillarPositions[p];
      var pillar = makeCyl(0.6, 0.6, 6, 8, 0x1a3355, pp[0], fy + 3, pp[1]);
      sc.add(pillar);
      addPointLight(sc, 0x00FFAA, 0.4, 6, pp[0], fy + 5.5, pp[1]);
    }

    // Entrance doors (hackable)
    var door1 = makeBox(3, 2.8, 0.2, 0x224466, -5, fy + 1.4, 9.9);
    sc.add(door1);
    var door2 = makeBox(3, 2.8, 0.2, 0x224466, 5, fy + 1.4, 9.9);
    sc.add(door2);
    var doorFrame1 = makeDoorFrame(3.2, 3, 0x00FFAA, -5, fy, 9.9);
    sc.add(doorFrame1);
    var doorFrame2 = makeDoorFrame(3.2, 3, 0x00FFAA, 5, fy, 9.9);
    sc.add(doorFrame2);

    // Add a terminal panel near entrance
    var terminal1 = makeBox(0.8, 1.4, 0.2, 0x224466, 3, fy + 0.7, 8.5);
    sc.add(terminal1);
    addPointLight(sc, 0x00FF44, 0.5, 3, 3, fy + 1.2, 8.5);
    state.doors.push({
      mesh: door1,
      terminalMesh: terminal1,
      hacked: false,
      floor: 1,
      pos: { x: 3, y: fy + 0.7, z: 8.5 }
    });
  }

  function buildSecurityHub(sc) {
    var fy = addFloorShell(sc, 5, 0x0d1a26);

    // Camera control banks — multiple screens
    var screenColors = [0x002244, 0x002244, 0x003322, 0x002244];
    for (var s = 0; s < 4; s++) {
      var sx = -6 + s * 4;
      var screen = makeBox(3, 2, 0.3, screenColors[s], sx, fy + 1.5, -7);
      sc.add(screen);
      addPointLight(sc, 0x0044FF, 0.6, 5, sx, fy + 1.5, -7);
    }

    // Master hack terminal — security hub
    var masterTerminal = makeBox(1.2, 1.8, 0.3, 0x224466, 0, fy + 0.9, -6.5);
    sc.add(masterTerminal);
    addPointLight(sc, 0x00FF44, 1.0, 6, 0, fy + 2.0, -6.5);
    // Blinking red indicator
    var indicator = makeBox(0.2, 0.2, 0.05, 0xFF0000, 0.3, fy + 1.6, -6.35);
    sc.add(indicator);

    state.doors.push({
      mesh: masterTerminal,
      terminalMesh: masterTerminal,
      hacked: false,
      floor: 5,
      pos: { x: 0, y: fy + 0.9, z: -6.5 },
      isCameraHub: true
    });

    // Security desks
    for (var d = 0; d < 2; d++) {
      var sdx = -4 + d * 8;
      var sdesk = makeBox(3, 1, 1.5, 0x1a2a3a, sdx, fy + 0.5, -3);
      sc.add(sdesk);
    }

    // Ceiling neon red strips (alarm corridor feel)
    var redStrip = makeNeonLines([
      [-9, fy + 2.9, -9], [9, fy + 2.9, -9],
      [-9, fy + 2.9, 9], [9, fy + 2.9, 9]
    ], 0xFF0022);
    sc.add(redStrip);
  }

  function buildResearchLab(sc) {
    var fy = addFloorShell(sc, 15, 0x0d1f1a);

    // Lab benches
    var labBenchPositions = [
      { x: -6, z: -6 }, { x: 0, z: -6 }, { x: 6, z: -6 },
      { x: -6, z: 0 }, { x: 6, z: 0 }
    ];
    for (var b = 0; b < labBenchPositions.length; b++) {
      var lb = labBenchPositions[b];
      var bench = makeBox(4, 0.9, 1.5, 0x1a3322, lb.x, fy + 0.45, lb.z);
      sc.add(bench);
      // Lab equipment on bench
      var equip = makeCyl(0.3, 0.3, 0.8, 6, 0x00FF88, lb.x, fy + 0.9 + 0.4, lb.z);
      sc.add(equip);
      addPointLight(sc, 0x00FF88, 0.4, 4, lb.x, fy + 1.5, lb.z);
    }

    // Prototype equipment — cone shape
    var proto = makeCone(1.0, 2.0, 0x00FFCC, 0, fy + 2.0, 4);
    sc.add(proto);
    addPointLight(sc, 0x00FFCC, 0.8, 8, 0, fy + 3.0, 4);

    // Lab door terminal
    var labTerminal = makeBox(0.8, 1.4, 0.2, 0x224466, 8.5, fy + 0.7, 0);
    sc.add(labTerminal);
    addPointLight(sc, 0x00FF44, 0.5, 3, 8.5, fy + 1.2, 0);
    state.doors.push({
      mesh: labTerminal,
      terminalMesh: labTerminal,
      hacked: false,
      floor: 15,
      pos: { x: 8.5, y: fy + 0.7, z: 0 }
    });

    // Scientists (static NPCs for show)
    for (var sc2 = 0; sc2 < 3; sc2++) {
      var scix = -5 + sc2 * 5;
      var sciBody = makeBox(0.7, 1.6, 0.5, 0xFFFFFF, scix, fy + 0.8, -5);
      sc.add(sciBody);
      var sciHead = makeSphere(0.3, 0xFFCCAA, scix, fy + 1.75, -5);
      sc.add(sciHead);
    }
  }

  function buildExecutiveFloor(sc) {
    var fy = addFloorShell(sc, 25, 0x1a0d0d);

    // CEO office — large desk
    var ceoDeskTop = makeBox(5, 0.2, 2.5, 0x3a1a00, 3, fy + 0.9, -5);
    sc.add(ceoDeskTop);
    var ceoDeskBase = makeBox(4.5, 0.8, 2, 0x2a1200, 3, fy + 0.4, -5);
    sc.add(ceoDeskBase);

    // CEO chair
    var chairSeat = makeBox(1.2, 0.2, 1.2, 0x1a0a0a, 3, fy + 0.7, -3.5);
    sc.add(chairSeat);
    var chairBack = makeBox(1.2, 1.5, 0.2, 0x1a0a0a, 3, fy + 1.45, -3.0);
    sc.add(chairBack);

    // Safe — box with neon outline
    var safe = makeBox(1.5, 1.5, 1, 0x2a1a0a, -7, fy + 0.75, -7);
    sc.add(safe);
    var safeFrame = makeDoorFrame(1.6, 1.6, 0xFF4400, -7, fy, -7);
    sc.add(safeFrame);
    addPointLight(sc, 0xFF4400, 0.8, 5, -7, fy + 1.5, -7);

    // Executive terminal
    var execTerminal = makeBox(0.8, 1.4, 0.2, 0x224466, -5, fy + 0.7, -7);
    sc.add(execTerminal);
    addPointLight(sc, 0x00FF44, 0.5, 3, -5, fy + 1.2, -7);

    // Panoramic window effect — neon strips top
    var winStrip = makeNeonLines([
      [-9, fy + 2.8, 9], [9, fy + 2.8, 9]
    ], 0x4444FF);
    sc.add(winStrip);
    addPointLight(sc, 0x4444FF, 0.5, 15, 0, fy + 2.5, 9);
  }

  function buildServerRoom(sc) {
    var fy = addFloorShell(sc, 28, 0x050d14);

    // Server racks — BoxGeometry rows
    var rackPositions = [
      { x: -7, z: -7 }, { x: -7, z: -3 }, { x: -7, z: 1 }, { x: -7, z: 5 },
      { x: 7, z: -7 },  { x: 7, z: -3 },  { x: 7, z: 1 },  { x: 7, z: 5 }
    ];
    for (var r = 0; r < rackPositions.length; r++) {
      var rp = rackPositions[r];
      var rack = makeBox(1.5, 2.4, 1, 0x223344, rp.x, fy + 1.2, rp.z);
      sc.add(rack);
      // Blinking indicators
      for (var ri = 0; ri < 3; ri++) {
        var indicatorColor = ri === 0 ? 0x00FF44 : ri === 1 ? 0x0044FF : 0xFF4400;
        addPointLight(sc, indicatorColor, 0.3, 2, rp.x + 0.7, fy + 0.5 + ri * 0.7, rp.z);
      }
    }

    // Corridor neon strips
    var corridorStrip = makeNeonLines([
      [-5, fy + 0.15, -9], [-5, fy + 0.15, 9],
      [5, fy + 0.15, -9], [5, fy + 0.15, 9],
      [-5, fy + 0.15, 0], [5, fy + 0.15, 0]
    ], 0x00FFAA);
    sc.add(corridorStrip);

    // ─── AI Core ───────────────────────────────────────────────────────────────
    var aiCore = makeCyl(2, 2, 4, 16, 0x00FFFF, 0, fy + 2, 0);
    sc.add(aiCore);
    state.aiCoreMesh = aiCore;

    var aiCoreLight = addPointLight(sc, 0x00FFFF, 3, 15, 0, fy + 3, 0);
    state.aiCoreLight = aiCoreLight;

    // Outer ring
    var aiRing = makeCyl(2.5, 2.5, 0.3, 24, 0x0088AA, 0, fy + 0.15, 0);
    sc.add(aiRing);
    var aiRingTop = makeCyl(2.5, 2.5, 0.3, 24, 0x0088AA, 0, fy + 3.85, 0);
    sc.add(aiRingTop);

    // Pulsing vertical neon lines around core
    var coreLines = makeNeonLines([
      [-0.5, fy, -2], [-0.5, fy + 4, -2],
      [0.5, fy, -2],  [0.5, fy + 4, -2],
      [-2, fy, -0.5], [-2, fy + 4, -0.5],
      [-2, fy, 0.5],  [-2, fy + 4, 0.5],
      [0.5, fy, 2],   [0.5, fy + 4, 2],
      [-0.5, fy, 2],  [-0.5, fy + 4, 2],
      [2, fy, 0.5],   [2, fy + 4, 0.5],
      [2, fy, -0.5],  [2, fy + 4, -0.5]
    ], 0x00FFFF);
    sc.add(coreLines);

    // AI Core hack terminal
    var coreTerminal = makeBox(0.8, 1.4, 0.2, 0x224466, 3, fy + 0.7, 2);
    sc.add(coreTerminal);
    addPointLight(sc, 0x00FF44, 0.8, 4, 3, fy + 1.4, 2);
    state.doors.push({
      mesh: coreTerminal,
      terminalMesh: coreTerminal,
      hacked: false,
      floor: 28,
      pos: { x: 3, y: fy + 0.7, z: 2 },
      isAiCore: true
    });

    // Data drive case — pickupable
    var dataDrive = makeBox(0.5, 0.3, 0.8, 0x334455, 0, fy + 4.15, 0);
    sc.add(dataDrive);
    state.dataDriveMesh = dataDrive;
    addPointLight(sc, 0xFFFF00, 0.6, 3, 0, fy + 4.3, 0);
  }

  function buildRooftop(sc) {
    var fy = floorY(30);

    // Roof pad
    var roof = makeBox(22, 0.5, 22, 0x112233, 0, fy + 0.25, 0);
    sc.add(roof);

    // Helipad — H marking using neon lines
    var heliLines = makeNeonLines([
      // H shape
      [-3, fy + 0.3, -3], [-3, fy + 0.3, 3],
      [3, fy + 0.3, -3],  [3, fy + 0.3, 3],
      [-3, fy + 0.3, 0],  [3, fy + 0.3, 0],
      // circle
      [-4, fy + 0.3, 0], [-2.8, fy + 0.3, 2.8],
      [-2.8, fy + 0.3, 2.8], [0, fy + 0.3, 4],
      [0, fy + 0.3, 4], [2.8, fy + 0.3, 2.8],
      [2.8, fy + 0.3, 2.8], [4, fy + 0.3, 0],
      [4, fy + 0.3, 0], [2.8, fy + 0.3, -2.8],
      [2.8, fy + 0.3, -2.8], [0, fy + 0.3, -4],
      [0, fy + 0.3, -4], [-2.8, fy + 0.3, -2.8],
      [-2.8, fy + 0.3, -2.8], [-4, fy + 0.3, 0]
    ], 0x00FFAA);
    sc.add(heliLines);

    addPointLight(sc, 0x00FF88, 2, 20, 0, fy + 5, 0);

    // Extraction beacon
    var beacon = makeCyl(0.3, 0.3, 2, 8, 0x00FF88, 0, fy + 1, 0);
    sc.add(beacon);
    addPointLight(sc, 0xFFFFFF, 1, 8, 0, fy + 3, 0);

    // Rooftop structures — water towers, vents
    var vent1 = makeBox(2, 1.5, 2, 0x223344, -8, fy + 0.75, -8);
    sc.add(vent1);
    var vent2 = makeBox(2, 1.5, 2, 0x223344, 8, fy + 0.75, -8);
    sc.add(vent2);

    // Water tower
    var waterTower = makeCyl(1.5, 1.5, 3, 8, 0x334455, -8, fy + 2.5, 8);
    sc.add(waterTower);
    var waterTowerRoof = makeCone(2, 1.5, 0x223344, -8, fy + 4.25, 8);
    sc.add(waterTowerRoof);

    // Rooftop perimeter rail neon
    var rail = makeNeonLines([
      [-10, fy + 0.8, -10], [10, fy + 0.8, -10],
      [10, fy + 0.8, -10], [10, fy + 0.8, 10],
      [10, fy + 0.8, 10], [-10, fy + 0.8, 10],
      [-10, fy + 0.8, 10], [-10, fy + 0.8, -10]
    ], 0xFF00AA);
    sc.add(rail);
  }

  // ─── Spawn Guards ───────────────────────────────────────────────────────────
  function spawnGuards(sc) {
    var guardFloors = [
      { floor: 1, count: 6 },
      { floor: 5, count: 4 },
      { floor: 15, count: 4 },
      { floor: 25, count: 6 },
      { floor: 28, count: 8 },
      { floor: 30, count: 2 }
    ];
    for (var f = 0; f < guardFloors.length; f++) {
      var gf = guardFloors[f];
      var fy = floorY(gf.floor);
      for (var g = 0; g < gf.count; g++) {
        var gx = randFloat(-8, 8);
        var gz = randFloat(-8, 8);
        var isElite = gf.floor === 25;
        var guardColor = isElite ? 0x1a2a3a : 0x334455;
        var guardBody = makeBox(0.8, 1.6, 0.6, guardColor, gx, fy + 0.8, gz);
        sc.add(guardBody);
        var guardHead = makeSphere(0.35, 0x334455, gx, fy + 1.75, gz);
        sc.add(guardHead);
        // Plasma rifle light
        var rifleLight = addPointLight(sc, 0x4466FF, 0.3, 3, gx + 0.6, fy + 1.2, gz);
        var guard = {
          body: guardBody,
          head: guardHead,
          light: rifleLight,
          x: gx, y: fy + 0.8, z: gz,
          floor: gf.floor,
          hp: isElite ? 120 : 90,
          maxHp: isElite ? 120 : 90,
          alive: true,
          patrolAngle: Math.random() * Math.PI * 2,
          patrolRadius: randFloat(2, 5),
          patrolSpeed: randFloat(0.4, 0.8),
          alertTimer: 0,
          alerted: false,
          originX: gx,
          originZ: gz
        };
        state.guards.push(guard);
      }
    }
  }

  // ─── Spawn Turrets ──────────────────────────────────────────────────────────
  function spawnTurrets(sc) {
    var fy = floorY(28);
    var turretPositions = [
      { x: -8, z: -4 },
      { x: 8, z: -4 },
      { x: 0, z: -8 }
    ];
    for (var t = 0; t < turretPositions.length; t++) {
      var tp = turretPositions[t];
      var tBase = makeCyl(0.5, 0.6, 0.8, 8, 0x334455, tp.x, fy + 0.4, tp.z);
      sc.add(tBase);
      var tHead = makeBox(0.8, 0.5, 0.5, 0x445566, tp.x, fy + 0.85, tp.z);
      sc.add(tHead);
      var tBarrel = makeCyl(0.08, 0.08, 1.2, 6, 0x556677, tp.x + 0.6, fy + 0.85, tp.z);
      tBarrel.rotation.z = Math.PI / 2;
      sc.add(tBarrel);
      var tLight = addPointLight(sc, 0xFF0000, 0.8, 8, tp.x, fy + 1.2, tp.z);
      state.turrets.push({
        base: tBase,
        head: tHead,
        barrel: tBarrel,
        light: tLight,
        x: tp.x, y: fy + 0.85, z: tp.z,
        hp: 150,
        maxHp: 150,
        alive: true,
        angle: 0,
        fireTimer: 0
      });
    }
  }

  // ─── Spawn Cameras ──────────────────────────────────────────────────────────
  function spawnCameras(sc) {
    var camFloors = [1, 5, 15, 25, 28];
    for (var cf = 0; cf < camFloors.length; cf++) {
      var fy = floorY(camFloors[cf]);
      for (var cc = 0; cc < 2; cc++) {
        var cx = cc === 0 ? -7 : 7;
        var cz = -7;
        var cBody = makeBox(0.4, 0.4, 0.8, 0x334455, cx, fy + 2.7, cz);
        sc.add(cBody);
        var cLens = makeCyl(0.15, 0.15, 0.5, 8, 0x001122, cx, fy + 2.7, cz - 0.4);
        sc.add(cLens);
        var cLight = addPointLight(sc, 0xFF0000, 0.5, 6, cx, fy + 2.7, cz);
        var cam = {
          body: cBody,
          lens: cLens,
          light: cLight,
          x: cx, y: fy + 2.7, z: cz,
          floor: camFloors[cf],
          angle: Math.random() * Math.PI * 2,
          sweepDir: 1,
          alive: true,
          detectionTimer: 0
        };
        state.cameras3d.push(cam);
      }
    }
  }

  // ─── Cyborg Enforcer ────────────────────────────────────────────────────────
  function spawnCyborg(sc) {
    if (state.cyborgSpawned) return;
    state.cyborgSpawned = true;
    var fy = floorY(state.currentFloor);
    var cbBody = makeBox(1.2, 2.0, 0.8, 0x223344, 5, fy + 1.0, 5);
    sc.add(cbBody);
    var cbHead = makeBox(0.8, 0.8, 0.8, 0x1a2a3a, 5, fy + 2.2, 5);
    sc.add(cbHead);
    // Arm cannon
    var cbCannon = makeCyl(0.25, 0.25, 1.8, 8, 0x334455, 6.0, fy + 1.4, 5);
    cbCannon.rotation.z = Math.PI / 2;
    sc.add(cbCannon);
    var cbLight = addPointLight(sc, 0xFF4400, 1.5, 10, 5, fy + 2.0, 5);
    state.cyborg = {
      body: cbBody,
      head: cbHead,
      cannon: cbCannon,
      light: cbLight,
      x: 5, y: fy + 1.0, z: 5,
      hp: 300,
      alive: true,
      fireTimer: 0
    };
  }

  // ─── Terminal Minigame ──────────────────────────────────────────────────────
  function startTerminalMinigame(terminalObj) {
    state.terminalActive = true;
    state.terminalTarget = terminalObj;
    state.hackingActive = false;

    if (!state.terminalEl) {
      var el = document.createElement('div');
      el.id = 'ch-terminal';
      el.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%)',
        'background:#001122',
        'border:2px solid #00FFAA',
        'color:#00FFAA',
        'font-family:monospace',
        'font-size:18px',
        'padding:24px',
        'min-width:340px',
        'z-index:9999',
        'text-align:center',
        'box-shadow:0 0 40px #00FFAA66'
      ].join(';');
      document.body.appendChild(el);
      state.terminalEl = el;
    }

    // Generate a sequence of 4 keys
    var keys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'];
    var seq = [];
    for (var i = 0; i < 4; i++) {
      seq.push(keys[Math.floor(Math.random() * keys.length)]);
    }
    state.terminalSequence = seq;
    state.terminalInput = [];

    var typeLabel = terminalObj.isCameraHub
      ? 'CAMERA HUB OVERRIDE'
      : terminalObj.isAiCore
        ? 'AI CORE ACCESS'
        : 'DOOR BYPASS';

    state.terminalEl.innerHTML = [
      '<div style="color:#FF00AA;margin-bottom:8px">[ OMNI CORP SECURITY ]</div>',
      '<div style="color:#00FFFF;margin-bottom:12px">' + typeLabel + '</div>',
      '<div style="margin-bottom:8px">ENTER SEQUENCE:</div>',
      '<div id="ch-seq" style="letter-spacing:8px;font-size:24px;color:#FFFF00">' + seq.join(' ') + '</div>',
      '<div id="ch-inp" style="margin-top:8px;letter-spacing:8px;font-size:24px;color:#00FF44">_</div>',
      '<div style="margin-top:12px;color:#888;font-size:13px">[ESC] ABORT</div>'
    ].join('');

    state.terminalEl.style.display = 'block';
    // release pointer lock so keys work
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function updateTerminalInput(key) {
    if (!state.terminalActive) return;
    if (key === 'ESCAPE') {
      closeTerminal(false);
      return;
    }
    var upper = key.toUpperCase();
    if (upper.length !== 1 || !'ASDFGHJK'.includes(upper)) return;
    state.terminalInput.push(upper);
    var inpEl = document.getElementById('ch-inp');
    if (inpEl) inpEl.textContent = state.terminalInput.join(' ');
    if (state.terminalInput.length >= state.terminalSequence.length) {
      // check match
      var correct = true;
      for (var i = 0; i < state.terminalSequence.length; i++) {
        if (state.terminalInput[i] !== state.terminalSequence[i]) {
          correct = false;
          break;
        }
      }
      if (correct) {
        onTerminalSuccess(state.terminalTarget);
      } else {
        // Wrong sequence: raise security
        if (state.securityLevel < 2) state.securityLevel++;
        showTerminalMsg('ACCESS DENIED - ALARM RAISED', '#FF0044');
        setTimeout(function () { closeTerminal(false); }, 1000);
      }
    }
  }

  function showTerminalMsg(msg, color) {
    if (!state.terminalEl) return;
    state.terminalEl.innerHTML = '<div style="color:' + color + ';font-size:20px;padding:20px">' + msg + '</div>';
  }

  function onTerminalSuccess(terminalObj) {
    if (terminalObj.isCameraHub) {
      state.camerasDisabled = true;
      state.camerasDisabledTimer = 300; // 5 minutes
      showTerminalMsg('CAMERAS DISABLED - 5:00', '#00FFAA');
    } else if (terminalObj.isAiCore) {
      // Start the 8s copy
      state.dataState = 1;
      state.hackCopyTimer = 0;
      showTerminalMsg('INITIATING DATA COPY...', '#00FFFF');
    } else {
      terminalObj.hacked = true;
      // Open door
      if (terminalObj.mesh) terminalObj.mesh.visible = false;
      showTerminalMsg('ACCESS GRANTED', '#00FF44');
    }
    setTimeout(function () { closeTerminal(true); }, 1000);
  }

  function closeTerminal(success) {
    state.terminalActive = false;
    state.terminalTarget = null;
    if (state.terminalEl) state.terminalEl.style.display = 'none';
    // re-request pointer lock
    if (state.renderer && !state.missionFailed && !state.missionClear) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    var el = document.createElement('div');
    el.id = 'ch-hud';
    el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'background:rgba(0,0,0,0.75)',
      'color:#00FFAA',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 16px',
      'z-index:9000',
      'display:flex',
      'gap:24px',
      'align-items:center',
      'border-bottom:1px solid #00FFAA44'
    ].join(';');
    document.body.appendChild(el);
    state.hudEl = el;
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var timeLeft = Math.max(0, Math.floor(state.missionTimer));
    var aliveGuards = 0;
    for (var i = 0; i < state.guards.length; i++) {
      if (state.guards[i].alive) aliveGuards++;
    }
    var secLabels = ['NOMINAL', 'ELEVATED', 'ALARM'];
    var dataLabels = ['UNSECURED', 'COPYING', 'SECURED'];
    var secColor = state.securityLevel === 0 ? '#00FF44' : state.securityLevel === 1 ? '#FFAA00' : '#FF0044';
    var dataColor = state.dataState === 0 ? '#888' : state.dataState === 1 ? '#FFFF00' : '#00FF44';

    state.hudEl.innerHTML = [
      '<span style="color:#FF00AA;font-weight:bold">CYBERPUNK HEIST</span>',
      '<span>[FLOOR: ' + state.currentFloor + '/30]</span>',
      '<span>[DATA: <span style="color:' + dataColor + '">' + dataLabels[state.dataState] + '</span>]</span>',
      '<span>[TIMER: <span style="color:' + (timeLeft < 60 ? '#FF0044' : '#00FFAA') + '">' + toMM_SS(timeLeft) + '</span>]</span>',
      '<span>[SECURITY: <span style="color:' + secColor + '">' + secLabels[state.securityLevel] + '</span>]</span>',
      '<span>[GUARDS: ' + aliveGuards + ']</span>',
      '<span>[HP: <span style="color:' + (state.playerHP > 50 ? '#00FF44' : '#FF4400') + '">' + state.playerHP + '</span>]</span>',
      state.camerasDisabled ? '<span style="color:#00FFFF">[CAMS OFF: ' + toMM_SS(state.camerasDisabledTimer) + ']</span>' : ''
    ].join('');
  }

  // ─── End Screen ─────────────────────────────────────────────────────────────
  function showEndScreen(win) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.9)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'font-family:monospace',
      'z-index:99999'
    ].join(';');
    el.innerHTML = win
      ? [
          '<div style="color:#00FFFF;font-size:42px;margin-bottom:16px">EXTRACTION COMPLETE</div>',
          '<div style="color:#00FFAA;font-size:22px;margin-bottom:8px">AI CONSCIOUSNESS SECURED</div>',
          '<div style="color:#888;font-size:16px;margin-bottom:32px">Omni Corp will never know what hit them.</div>',
          '<div style="color:#FF00AA;font-size:18px">MISSION: SUCCESS</div>',
          '<div style="margin-top:24px;color:#00FFAA;font-size:13px">Press ESC to exit</div>'
        ].join('')
      : [
          '<div style="color:#FF0044;font-size:42px;margin-bottom:16px">MISSION FAILED</div>',
          '<div style="color:#FF4400;font-size:22px;margin-bottom:8px">' + (state.playerHP <= 0 ? 'AGENT DOWN' : 'TIMER EXPIRED') + '</div>',
          '<div style="color:#888;font-size:16px;margin-bottom:32px">Omni Corp security has contained the breach.</div>',
          '<div style="color:#FF00AA;font-size:18px">MISSION: FAILED</div>',
          '<div style="margin-top:24px;color:#00FFAA;font-size:13px">Press ESC to exit</div>'
        ].join('');
    document.body.appendChild(el);
  }

  // ─── Controls ───────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (!state.active) {
      // Activation: C + H within 400ms
      if (e.code === 'KeyC') {
        state.cDown = true;
        state.cDownTime = Date.now();
        checkActivation();
      }
      if (e.code === 'KeyH') {
        state.hDown = true;
        state.hDownTime = Date.now();
        checkActivation();
      }
      return;
    }

    // Terminal minigame input
    if (state.terminalActive) {
      updateTerminalInput(e.key === 'Escape' ? 'ESCAPE' : e.key);
      return;
    }

    // Movement
    state.moveKeys[e.code] = true;

    // Interact — E to hack terminal
    if (e.code === 'KeyE') {
      tryInteract();
    }

    // ESC to exit
    if (e.code === 'Escape') {
      state.terminalActive = false;
      if (state.terminalEl) state.terminalEl.style.display = 'none';
    }
  }

  function onKeyUp(e) {
    if (!state.active) {
      if (e.code === 'KeyC') state.cDown = false;
      if (e.code === 'KeyH') state.hDown = false;
      return;
    }
    state.moveKeys[e.code] = false;
  }

  function checkActivation() {
    if (state.cDown && state.hDown) {
      var dt = Math.abs(state.cDownTime - state.hDownTime);
      if (dt < 400) {
        initGame();
      }
    }
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked || state.terminalActive) return;
    var sens = 0.002;
    state.playerYaw -= e.movementX * sens;
    state.playerPitch -= e.movementY * sens;
    state.playerPitch = clamp(state.playerPitch, -Math.PI * 0.4, Math.PI * 0.4);
  }

  function onPointerLockChange() {
    state.pointerLocked = document.pointerLockElement === state.renderer.domElement;
  }

  function onCanvasClick() {
    if (state.active && !state.terminalActive) {
      state.renderer.domElement.requestPointerLock();
    }
  }

  // ─── Interact ───────────────────────────────────────────────────────────────
  function tryInteract() {
    var px = state.player.x;
    var py = state.player.y;
    var pz = state.player.z;

    // Find nearest terminal on current floor
    var nearest = null;
    var nearestDist = 4;
    for (var i = 0; i < state.doors.length; i++) {
      var d = state.doors[i];
      if (d.floor !== state.currentFloor) continue;
      if (d.hacked && !d.isAiCore) continue;
      if (d.isAiCore && state.dataState === 2) continue;
      var dd = dist2D(px, pz, d.pos.x, d.pos.z);
      if (dd < nearestDist) {
        nearestDist = dd;
        nearest = d;
      }
    }

    if (nearest) {
      startTerminalMinigame(nearest);
      return;
    }

    // Pick up data drive after AI core hack
    if (state.dataState === 2 && !state.hasDataDrive && state.currentFloor === 28 && state.dataDriveMesh) {
      var ddd = dist2D(px, pz, 0, 0);
      if (ddd < 5) {
        state.hasDataDrive = true;
        state.dataDriveMesh.visible = false;
        showAlert('DATA DRIVE SECURED — PROCEED TO ROOFTOP', '#00FFFF');
      }
    }
  }

  // ─── Floor travel (staircase simulation) ────────────────────────────────────
  function updateFloor() {
    var targetFloor = Math.max(1, Math.min(30, Math.floor(state.player.y / 3) + 1));
    if (targetFloor !== state.currentFloor) {
      state.currentFloor = targetFloor;
    }
  }

  // ─── Alert banner ───────────────────────────────────────────────────────────
  var alertTimeout = null;
  function showAlert(msg, color) {
    var el = document.getElementById('ch-alert');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ch-alert';
      el.style.cssText = [
        'position:fixed',
        'top:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'font-family:monospace',
        'font-size:18px',
        'padding:8px 24px',
        'background:rgba(0,0,0,0.85)',
        'border:1px solid #00FFAA',
        'pointer-events:none',
        'z-index:9999',
        'transition:opacity 0.3s'
      ].join(';');
      document.body.appendChild(el);
    }
    el.style.color = color || '#00FFAA';
    el.style.borderColor = color || '#00FFAA';
    el.style.opacity = '1';
    el.textContent = msg;
    if (alertTimeout) clearTimeout(alertTimeout);
    alertTimeout = setTimeout(function () { el.style.opacity = '0'; }, 3000);
  }

  // ─── Player Movement ────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (state.terminalActive) return;
    var speed = 6;
    var yaw = state.playerYaw;
    var fwd = { x: Math.sin(yaw), z: Math.cos(yaw) };
    var rgt = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    var mx = 0, mz = 0;
    if (state.moveKeys['KeyW'] || state.moveKeys['ArrowUp'])    { mx -= fwd.x; mz -= fwd.z; }
    if (state.moveKeys['KeyS'] || state.moveKeys['ArrowDown'])  { mx += fwd.x; mz += fwd.z; }
    if (state.moveKeys['KeyA'] || state.moveKeys['ArrowLeft'])  { mx -= rgt.x; mz -= rgt.z; }
    if (state.moveKeys['KeyD'] || state.moveKeys['ArrowRight']) { mx += rgt.x; mz += rgt.z; }

    var len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }

    state.player.x += mx * speed * dt;
    state.player.z += mz * speed * dt;

    // Vertical — Space to go up floors (elevator), Shift+move or C to go down
    if (state.moveKeys['Space'] && !state.moveKeys['ShiftLeft']) {
      state.player.y += 4 * dt;
    }
    if (state.moveKeys['ShiftLeft'] || state.moveKeys['KeyC']) {
      state.player.y -= 4 * dt;
    }
    state.player.y = Math.max(1.8, state.player.y);
    // Cap at rooftop level + some
    state.player.y = Math.min(floorY(30) + 3, state.player.y);

    // Keep inside tower roughly
    state.player.x = clamp(state.player.x, -9, 9);
    state.player.z = clamp(state.player.z, -9, 9);

    // Update camera
    state.camera.position.set(state.player.x, state.player.y, state.player.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    updateFloor();
  }

  // ─── Guard AI ───────────────────────────────────────────────────────────────
  function updateGuards(dt) {
    var px = state.player.x;
    var pz = state.player.z;
    var pFloor = state.currentFloor;

    for (var i = 0; i < state.guards.length; i++) {
      var g = state.guards[i];
      if (!g.alive) continue;
      if (g.floor !== pFloor && !(state.securityLevel === 2 && Math.abs(g.floor - pFloor) <= 2)) continue;

      if (state.securityLevel >= 1 && g.floor === pFloor) {
        // Chase player
        var dx = px - g.x;
        var dz = pz - g.z;
        var dd = Math.sqrt(dx * dx + dz * dz);
        if (dd > 0.5) {
          var spd = state.securityLevel === 2 ? 3.5 : 2.5;
          g.x += (dx / dd) * spd * dt;
          g.z += (dz / dd) * spd * dt;
        }
        // Attack player if close
        if (dd < 2) {
          g.alertTimer += dt;
          if (g.alertTimer >= 1.0) {
            g.alertTimer = 0;
            state.playerHP -= 8;
            if (state.playerHP <= 0) {
              state.playerHP = 0;
              state.missionFailed = true;
            }
          }
        }
      } else {
        // Patrol
        g.patrolAngle += g.patrolSpeed * dt;
        g.x = g.originX + Math.cos(g.patrolAngle) * g.patrolRadius;
        g.z = g.originZ + Math.sin(g.patrolAngle) * g.patrolRadius;
      }

      // Detect player without cameras (or camera fallback)
      if (!state.camerasDisabled || state.securityLevel > 0) {
        var detDist = state.securityLevel > 0 ? 12 : 6;
        var gy = floorY(g.floor);
        var dd2 = dist2D(px, pz, g.x, g.z);
        if (dd2 < detDist && g.floor === pFloor) {
          if (state.securityLevel === 0) {
            state.securityLevel = 1;
            showAlert('SECURITY ELEVATED — GUARD ALERTED', '#FFAA00');
            spawnCyborg(state.scene);
          }
        }
      }

      // Update mesh positions
      var fy = floorY(g.floor);
      g.body.position.set(g.x, fy + 0.8, g.z);
      g.head.position.set(g.x, fy + 1.75, g.z);
      g.light.position.set(g.x + 0.6, fy + 1.2, g.z);
    }
  }

  // ─── Camera sweep ───────────────────────────────────────────────────────────
  function updateCameras3D(dt) {
    for (var i = 0; i < state.cameras3d.length; i++) {
      var cam = state.cameras3d[i];
      if (!cam.alive) continue;

      if (state.camerasDisabled) {
        cam.light.color.setHex(0x004400);
        continue;
      }

      // Sweep 120 degrees
      cam.angle += cam.sweepDir * 0.6 * dt;
      if (cam.angle > Math.PI / 3) { cam.sweepDir = -1; }
      if (cam.angle < -Math.PI / 3) { cam.sweepDir = 1; }

      cam.body.rotation.y = cam.angle;

      // Detection
      if (cam.floor === state.currentFloor) {
        var camFwdX = Math.sin(cam.angle);
        var camFwdZ = -1; // cameras face -z by default
        var toCamX = state.player.x - cam.x;
        var toCamZ = state.player.z - cam.z;
        var dists = Math.sqrt(toCamX * toCamX + toCamZ * toCamZ);
        if (dists < 10) {
          var dot = (camFwdX * toCamX + camFwdZ * toCamZ) / dists;
          if (dot > 0.5) {
            cam.detectionTimer += dt;
            cam.light.color.setHex(0xFF8800);
            if (cam.detectionTimer > 2) {
              cam.light.color.setHex(0xFF0000);
              if (state.securityLevel < 2) {
                state.securityLevel = 2;
                showAlert('ALARM — CAMERA DETECTED INTRUDER', '#FF0044');
                spawnCyborg(state.scene);
              }
            }
          } else {
            cam.detectionTimer = Math.max(0, cam.detectionTimer - dt);
            cam.light.color.setHex(0xFF0000);
          }
        } else {
          cam.detectionTimer = Math.max(0, cam.detectionTimer - dt * 0.5);
          cam.light.color.setHex(0xFF0000);
        }
      }
    }
  }

  // ─── Turret AI ──────────────────────────────────────────────────────────────
  function updateTurrets(dt) {
    for (var i = 0; i < state.turrets.length; i++) {
      var t = state.turrets[i];
      if (!t.alive) continue;
      if (state.currentFloor !== 28) continue;

      // Track player
      var dx = state.player.x - t.x;
      var dz = state.player.z - t.z;
      var dd = Math.sqrt(dx * dx + dz * dz);

      t.head.rotation.y = Math.atan2(dx, dz);

      if (dd < 12) {
        t.fireTimer += dt;
        t.light.color.setHex(0xFF4400);
        if (t.fireTimer >= 1.5) {
          t.fireTimer = 0;
          state.playerHP -= 15;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            state.missionFailed = true;
          }
          showAlert('TURRET HIT! HP: ' + state.playerHP, '#FF4400');
        }
      } else {
        t.light.color.setHex(0xFF0000);
      }
    }
  }

  // ─── Cyborg Enforcer AI ─────────────────────────────────────────────────────
  function updateCyborg(dt) {
    var cb = state.cyborg;
    if (!cb || !cb.alive) return;

    var dx = state.player.x - cb.x;
    var dz = state.player.z - cb.z;
    var dd = Math.sqrt(dx * dx + dz * dz);

    if (dd > 0.5) {
      var spd = 4.5;
      cb.x += (dx / dd) * spd * dt;
      cb.z += (dz / dd) * spd * dt;
    }

    var fy = floorY(state.currentFloor);
    cb.body.position.set(cb.x, fy + 1.0, cb.z);
    cb.head.position.set(cb.x, fy + 2.2, cb.z);
    cb.cannon.position.set(cb.x + 0.9, fy + 1.4, cb.z);
    cb.light.position.set(cb.x, fy + 2.0, cb.z);

    if (dd < 2.5) {
      cb.fireTimer += dt;
      if (cb.fireTimer >= 0.8) {
        cb.fireTimer = 0;
        state.playerHP -= 25;
        if (state.playerHP <= 0) {
          state.playerHP = 0;
          state.missionFailed = true;
        }
        showAlert('CYBORG HIT! HP: ' + state.playerHP, '#FF0044');
      }
    }
  }

  // ─── AI Core copy progress ──────────────────────────────────────────────────
  function updateAiCore(dt) {
    // Pulse
    state.aiCorePulse += dt * 2;
    if (state.aiCoreMesh) {
      state.aiCoreMesh.rotation.y += dt * 0.8;
    }
    if (state.aiCoreLight) {
      var pulse = 2 + Math.sin(state.aiCorePulse) * 1.2;
      state.aiCoreLight.intensity = pulse;
    }

    if (state.dataState === 1) {
      state.hackCopyTimer += dt;
      if (state.hackCopyTimer >= state.hackCopyDuration) {
        state.dataState = 2;
        showAlert('DATA COPY COMPLETE — PICK UP DRIVE (E)', '#00FFFF');
      }
    }
  }

  // ─── Neon city light pulse ──────────────────────────────────────────────────
  function updateNeonPulse(dt) {
    state.neonPulse += dt;
    var pulse = 1.0 + Math.sin(state.neonPulse * 2) * 0.3;
    for (var i = 0; i < state.cityLights.length; i++) {
      state.cityLights[i].intensity = pulse * (1.2 + (i % 3) * 0.3);
    }
  }

  // ─── Win condition check ─────────────────────────────────────────────────────
  function checkWinLose() {
    if (state.missionFailed || state.missionClear) return;

    // Lose: timer
    if (state.missionTimer <= 0) {
      state.missionFailed = true;
    }
    // Lose: hp
    if (state.playerHP <= 0) {
      state.missionFailed = true;
    }

    // Win: at rooftop with data
    if (state.hasDataDrive && state.currentFloor === 30) {
      state.missionClear = true;
    }

    if (state.missionFailed) {
      stopGame();
      showEndScreen(false);
    }
    if (state.missionClear) {
      stopGame();
      showEndScreen(true);
    }
  }

  // ─── Main update loop ───────────────────────────────────────────────────────
  function gameLoop(timestamp) {
    state.animFrameId = requestAnimationFrame(gameLoop);
    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;

    if (state.missionFailed || state.missionClear) return;

    // Count down mission timer
    if (!state.terminalActive) {
      state.missionTimer -= dt;
    }

    // Cameras disabled countdown
    if (state.camerasDisabled) {
      state.camerasDisabledTimer -= dt;
      if (state.camerasDisabledTimer <= 0) {
        state.camerasDisabled = false;
        showAlert('CAMERAS BACK ONLINE', '#FF4400');
      }
    }

    updatePlayer(dt);
    updateGuards(dt);
    updateCameras3D(dt);
    updateTurrets(dt);
    updateCyborg(dt);
    updateAiCore(dt);
    updateNeonPulse(dt);
    checkWinLose();
    updateHUD();

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Init / start ────────────────────────────────────────────────────────────
  function initGame() {
    if (state.active) return;
    state.active = true;

    // Scene
    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.Fog(0x050510, 30, 150);
    state.scene.background = new THREE.Color(0x050510);

    // Camera
    state.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    // Renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:8000';
    document.body.appendChild(state.renderer.domElement);

    // Resize
    window.addEventListener('resize', function () {
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Build world
    buildScene();
    buildHUD();

    // Player start position — lobby
    state.player.x = 0;
    state.player.y = 1.8;
    state.player.z = 5;
    state.camera.position.set(0, 1.8, 5);

    // Input
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    state.renderer.domElement.addEventListener('click', onCanvasClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Request pointer lock
    state.renderer.domElement.requestPointerLock();

    // Crosshair
    var crosshair = document.createElement('div');
    crosshair.id = 'ch-crosshair';
    crosshair.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:9100'
    ].join(';');
    crosshair.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20">' +
      '<line x1="10" y1="2" x2="10" y2="8" stroke="#00FFAA" stroke-width="1.5"/>' +
      '<line x1="10" y1="12" x2="10" y2="18" stroke="#00FFAA" stroke-width="1.5"/>' +
      '<line x1="2" y1="10" x2="8" y2="10" stroke="#00FFAA" stroke-width="1.5"/>' +
      '<line x1="12" y1="10" x2="18" y2="10" stroke="#00FFAA" stroke-width="1.5"/>' +
      '</svg>';
    document.body.appendChild(crosshair);

    // Tip
    showAlert('WASD: Move | Space/Shift: Up/Down floors | E: Hack terminal | C+H: Activate', '#00FFAA');

    // Start loop
    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(gameLoop);
  }

  // ─── Stop ────────────────────────────────────────────────────────────────────
  function stopGame() {
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ─── Public: reset ───────────────────────────────────────────────────────────
  function reset() {
    stopGame();
    if (state.renderer) {
      document.body.removeChild(state.renderer.domElement);
      state.renderer.dispose();
      state.renderer = null;
    }
    if (state.hudEl) { document.body.removeChild(state.hudEl); state.hudEl = null; }
    if (state.terminalEl) { document.body.removeChild(state.terminalEl); state.terminalEl = null; }
    var cross = document.getElementById('ch-crosshair');
    if (cross) document.body.removeChild(cross);
    var alert2 = document.getElementById('ch-alert');
    if (alert2) document.body.removeChild(alert2);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    // Reset state fields
    state.active = false;
    state.cDown = false;
    state.hDown = false;
    state.scene = null;
    state.camera = null;
    state.renderer = null;
    state.animFrameId = null;
    state.player = { x: 0, y: 1.8, z: 8 };
    state.playerHP = 100;
    state.playerYaw = 0;
    state.playerPitch = 0;
    state.moveKeys = {};
    state.pointerLocked = false;
    state.currentFloor = 1;
    state.missionTimer = 600;
    state.missionFailed = false;
    state.missionClear = false;
    state.dataState = 0;
    state.hackCopyTimer = 0;
    state.dataDriveMesh = null;
    state.hasDataDrive = false;
    state.securityLevel = 0;
    state.camerasDisabled = false;
    state.camerasDisabledTimer = 0;
    state.hackingTerminal = null;
    state.hackingActive = false;
    state.hackingTimer = 0;
    state.terminalActive = false;
    state.terminalTarget = null;
    state.terminalEl = null;
    state.guards = [];
    state.turrets = [];
    state.cameras3d = [];
    state.cyborg = null;
    state.cyborgSpawned = false;
    state.aiCoreMesh = null;
    state.aiCoreLight = null;
    state.aiCorePulse = 0;
    state.doors = [];
    state.floorGroups = [];
    state.cityLights = [];
    state.extractionReached = false;
    state.neonPulse = 0;
    state.alarmBlinkTimer = 0;
    state.dataDriveMesh = null;
  }

  // ─── Public: update (external tick hook, no-op if running own loop) ──────────
  function update() {}

  // ─── Public: init (alias for external call) ─────────────────────────────────
  function init() {
    initGame();
  }

  // ─── Keyboard registration runs immediately ──────────────────────────────────
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return { init: init, update: update, reset: reset };
}());
