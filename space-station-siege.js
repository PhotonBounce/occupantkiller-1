window.SpaceStationSiege = (function() {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var keys = {};
  var mouse = { x: 0, y: 0, locked: false };
  var yaw = 0, pitch = 0;
  var gameActive = false;
  var gameOver = false;
  var gameWon = false;
  var container, hudEl;

  // Activation
  var activationKeys = [];
  var activationTimeout = null;

  // Player state
  var player = {
    pos: new THREE.Vector3(0, 0, 0),
    vel: new THREE.Vector3(0, 0, 0),
    hp: 100,
    maxHp: 100,
    onSurface: false,
    surfaceNormal: new THREE.Vector3(0, 1, 0),
    inSpace: false,
    o2: 60,
    o2Max: 60,
    sealKits: 3,
    breaches: 0,
    hasPlasmaTorch: false,
    hasTetherGun: false,
    ammo: 90,
    shootCooldown: 0
  };

  // Tether
  var tether = {
    active: false,
    anchor: new THREE.Vector3(),
    line: null,
    pulling: false
  };

  // Game objectives
  var deOrbitTime = 480; // 8 minutes in seconds
  var deOrbitAborted = false;
  var ringleaderDead = false;
  var crewFreed = 0;
  var crewTotal = 6;
  var reactorDamaged = false;
  var gameTimer = 0;
  var playerDead = false;

  // Objects
  var hijackers = [];
  var hostages = [];
  var doors = [];
  var terminals = [];
  var toolboxes = [];
  var airlocks = [];
  var sealKitPickups = [];
  var tetherPickup = null;
  var stars = [];
  var stationMeshes = [];
  var ringleader = null;

  // Interaction
  var eHoldTimer = 0;
  var eHoldTarget = null;
  var ePressed = false;

  // Visual
  var powerOut = false;
  var ambientLight, pointLights = [];

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function makeMat(color, emissive, emissiveIntensity) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive !== undefined ? emissive : 0x000000,
      emissiveIntensity: emissiveIntensity !== undefined ? emissiveIntensity : 0
    });
  }

  function addMesh(geo, mat, x, y, z, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    scene.add(m);
    stationMeshes.push(m);
    return m;
  }

  function edgeMesh(geo, x, y, z) {
    var edges = new THREE.EdgesGeometry(geo);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x88aacc, linewidth: 1 }));
    line.position.set(x || 0, y || 0, z || 0);
    scene.add(line);
    return line;
  }

  function distSq(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return dx*dx + dy*dy + dz*dz;
  }

  function dist(a, b) { return Math.sqrt(distSq(a, b)); }

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

  function formatTime(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function randRange(a, b) { return a + Math.random() * (b - a); }

  // Simple AABB collision check
  function checkAABB(pos, size, meshPos, meshSize) {
    return Math.abs(pos.x - meshPos.x) < (size + meshSize) * 0.5 &&
           Math.abs(pos.y - meshPos.y) < (size + meshSize) * 0.5 &&
           Math.abs(pos.z - meshPos.z) < (size + meshSize) * 0.5;
  }

  // ─── Scene Setup ─────────────────────────────────────────────────────────────
  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000005);
    scene.fog = new THREE.Fog(0x000005, 60, 120);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.copy(player.pos);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Lighting
    ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0x88aaff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Point lights in modules
    var lightPositions = [
      [0, 2, 0], [25, 2, 0], [-25, 2, 0],
      [0, 2, 25], [0, 2, -25]
    ];
    for (var i = 0; i < lightPositions.length; i++) {
      var pl = new THREE.PointLight(0x6699cc, 1.5, 30);
      pl.position.set(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
      scene.add(pl);
      pointLights.push(pl);
    }

    buildStars();
    buildStation();
    spawnEnemies();
    spawnHostages();
    spawnPickups();
  }

  // ─── Starfield ───────────────────────────────────────────────────────────────
  function buildStars() {
    var starGeo = new THREE.SphereGeometry(0.1, 4, 4);
    var starMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    for (var i = 0; i < 300; i++) {
      var star = new THREE.Mesh(starGeo, starMat);
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      var r = 80 + Math.random() * 40;
      star.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      scene.add(star);
      stars.push(star);
    }
  }

  // ─── Station Layout ──────────────────────────────────────────────────────────
  function buildStation() {
    // Central hub: CylinderGeometry r=8 h=15, 0x334455
    var hubGeo = new THREE.CylinderGeometry(8, 8, 15, 12);
    var hubMat = makeMat(0x334455, 0x112233, 0.1);
    var hub = addMesh(hubGeo, hubMat, 0, 0, 0);
    edgeMesh(new THREE.CylinderGeometry(8, 8, 15, 12), 0, 0, 0);

    // Hub floor/ceiling details
    var floorGeo = new THREE.CylinderGeometry(7.8, 7.8, 0.3, 12);
    addMesh(floorGeo, makeMat(0x223344), 0, -7.2, 0);
    addMesh(floorGeo, makeMat(0x223344), 0, 7.2, 0);

    // 4 radiating corridor modules: CylinderGeometry r=3 h=20
    var corridorGeo = new THREE.CylinderGeometry(3, 3, 20, 8);
    var corridorMat = makeMat(0x2a3f50, 0x112233, 0.05);

    // +X corridor → Science Lab
    var cx = addMesh(corridorGeo, corridorMat, 18, 0, 0, 0, 0, Math.PI / 2);
    edgeMesh(new THREE.CylinderGeometry(3, 3, 20, 8), 18, 0, 0);

    // -X corridor → Command Center
    var cx2 = addMesh(corridorGeo, corridorMat, -18, 0, 0, 0, 0, Math.PI / 2);
    edgeMesh(new THREE.CylinderGeometry(3, 3, 20, 8), -18, 0, 0);

    // +Z corridor → Docking Bay
    var cz = addMesh(corridorGeo, corridorMat, 0, 0, 18, Math.PI / 2, 0, 0);
    edgeMesh(new THREE.CylinderGeometry(3, 3, 20, 8), 0, 0, 18);

    // -Z corridor → Reactor Room
    var cz2 = addMesh(corridorGeo, corridorMat, 0, 0, -18, Math.PI / 2, 0, 0);
    edgeMesh(new THREE.CylinderGeometry(3, 3, 20, 8), 0, 0, -18);

    // Science Lab (end of +X corridor)
    buildRoom(30, 0, 0, 12, 8, 12, 0x1a3322, 'scienceLab');

    // Command Center (end of -X corridor)
    buildRoom(-30, 0, 0, 12, 8, 12, 0x1a2233, 'commandCenter');

    // Docking Bay (end of +Z corridor)
    buildRoom(0, 0, 30, 14, 8, 14, 0x332211, 'dockingBay');

    // Reactor Room (end of -Z corridor)
    buildRoom(0, 0, -30, 10, 8, 10, 0x331100, 'reactorRoom');

    // Reactor core
    var reactorGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
    var reactorMesh = addMesh(reactorGeo, makeMat(0xff4400, 0xff2200, 0.8), 0, 0, -30);
    edgeMesh(new THREE.CylinderGeometry(2, 2, 6, 8), 0, 0, -30);
    reactorMesh.userData.isReactor = true;

    // Command center terminal
    var termGeo = new THREE.BoxGeometry(2, 2, 1);
    var termMesh = addMesh(termGeo, makeMat(0x00ff88, 0x00ff44, 0.5), -30, 0, -5);
    termMesh.userData.type = 'terminal';
    termMesh.userData.label = 'ABORT DE-ORBIT';
    terminals.push(termMesh);

    // Locked door between hub and command center corridor
    var doorGeo = new THREE.BoxGeometry(4, 5, 0.5);
    var doorMesh = addMesh(doorGeo, makeMat(0x556677, 0x223344, 0.1), -8.5, 0, 0);
    doorMesh.userData.locked = true;
    doorMesh.userData.open = false;
    doorMesh.userData.label = 'LOCKED DOOR (Plasma Torch)';
    doors.push(doorMesh);

    // Airlock to space
    var airlockGeo = new THREE.BoxGeometry(4, 5, 1);
    var airlockMesh = addMesh(airlockGeo, makeMat(0xff8800, 0xff4400, 0.2), 0, 0, 22);
    airlockMesh.userData.type = 'airlock';
    airlockMesh.userData.label = 'AIRLOCK';
    airlocks.push(airlockMesh);

    // Windows (decorative with breach potential)
    buildWindows();

    // Floor grids in hub
    buildFloorGrid();
  }

  function buildRoom(x, y, z, w, h, d, color, type) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, 0x000000, 0);
    var mesh = addMesh(geo, mat, x, y, z);
    mesh.userData.roomType = type;
    edgeMesh(new THREE.BoxGeometry(w, h, d), x, y, z);
    return mesh;
  }

  function buildWindows() {
    var winGeo = new THREE.BoxGeometry(2, 2, 0.1);
    var winMat = new THREE.MeshLambertMaterial({
      color: 0x2244aa,
      transparent: true,
      opacity: 0.4,
      emissive: 0x112244,
      emissiveIntensity: 0.3
    });
    var windowPos = [
      [8.5, 2, 5], [8.5, 2, -5], [-8.5, 2, 5], [-8.5, 2, -5],
      [5, 2, 8.5], [-5, 2, 8.5], [5, 2, -8.5], [-5, 2, -8.5]
    ];
    for (var i = 0; i < windowPos.length; i++) {
      var wm = new THREE.Mesh(winGeo, winMat.clone());
      wm.position.set(windowPos[i][0], windowPos[i][1], windowPos[i][2]);
      if (Math.abs(windowPos[i][0]) > Math.abs(windowPos[i][2])) {
        wm.rotation.y = Math.PI / 2;
      }
      wm.userData.isWindow = true;
      wm.userData.breached = false;
      scene.add(wm);
      stationMeshes.push(wm);
    }
  }

  function buildFloorGrid() {
    var gridGeo = new THREE.BoxGeometry(14, 0.2, 14);
    addMesh(gridGeo, makeMat(0x223344), 0, -7, 0);
    var grid2 = new THREE.BoxGeometry(14, 0.2, 14);
    addMesh(grid2, makeMat(0x223344), 0, 7, 0);
    // Pipe/conduit details
    for (var i = 0; i < 4; i++) {
      var pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 15, 6);
      var angle = (i / 4) * Math.PI * 2;
      addMesh(pipeGeo, makeMat(0x445566), Math.cos(angle) * 7, 0, Math.sin(angle) * 7);
    }
  }

  // ─── Enemies ─────────────────────────────────────────────────────────────────
  function spawnEnemies() {
    var spawnPositions = [
      // Hub
      [3, 1, 3], [-3, 1, 3], [3, 1, -3], [-3, 1, -3],
      // Science lab area
      [28, 1, 2], [32, 1, -2], [30, 1, 4], [27, 1, -3],
      // Command center area
      [-28, 1, 2], [-32, 1, -2], [-30, 1, 4],
      // Docking bay
      [2, 1, 28], [-2, 1, 32], [3, 1, 30],
      // Corridors
      [15, 0, 0], [-15, 0, 0], [0, 0, 15], [0, 0, -15]
    ];

    for (var i = 0; i < 18; i++) {
      var sp = spawnPositions[i % spawnPositions.length];
      var h = createHijacker(sp[0] + randRange(-1, 1), sp[1], sp[2] + randRange(-1, 1), false);
      hijackers.push(h);
    }

    // Ringleader in command center
    ringleader = createHijacker(-30, 0, 0, true);
    ringleader.mesh.scale.set(1.3, 1.3, 1.3);
    ringleader.mesh.children[0].material.color.setHex(0xff2200);
    ringleader.mesh.children[1].material.color.setHex(0xff4422);
    scene.add(ringleader.mesh);
    hijackers.push(ringleader);
  }

  function createHijacker(x, y, z, isRingleader) {
    var group = new THREE.Group();

    // Body - BoxGeometry
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    var bodyMat = makeMat(isRingleader ? 0xff2200 : 0x443322, 0x000000, 0);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);

    // Helmet - SphereGeometry
    var helmGeo = new THREE.SphereGeometry(0.4, 8, 8);
    var helmMat = makeMat(isRingleader ? 0xff4422 : 0x556677, 0x224466, 0.2);
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.85;
    group.add(helm);

    // Visor detail
    var visorGeo = new THREE.BoxGeometry(0.35, 0.2, 0.45);
    var visorMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xff8800, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 });
    var visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.85, 0.3);
    group.add(visor);

    // Jetpack (EVA pack)
    var packGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    var pack = new THREE.Mesh(packGeo, makeMat(0x334455));
    pack.position.set(0, 0, -0.35);
    group.add(pack);

    group.position.set(x, y, z);
    if (!isRingleader) scene.add(group);

    return {
      mesh: group,
      hp: isRingleader ? 450 : 100,
      maxHp: isRingleader ? 450 : 100,
      isRingleader: isRingleader,
      dead: false,
      vel: new THREE.Vector3(0, 0, 0),
      state: 'patrol',
      patrolTarget: new THREE.Vector3(x + randRange(-5, 5), y, z + randRange(-5, 5)),
      patrolTimer: randRange(2, 5),
      attackCooldown: 0,
      alertRadius: isRingleader ? 20 : 15,
      shootRadius: isRingleader ? 18 : 12,
      patrolRadius: 8,
      originPos: new THREE.Vector3(x, y, z),
      floatOffset: Math.random() * Math.PI * 2
    };
  }

  // ─── Hostages ─────────────────────────────────────────────────────────────────
  function spawnHostages() {
    var hostagePos = [
      [28, 0, -3], [32, 0, 3], [30, 0, -4],
      [28, 1, 2], [33, 0, 0], [31, 1, -2]
    ];
    for (var i = 0; i < 6; i++) {
      var hp = hostagePos[i];
      var geo = new THREE.BoxGeometry(0.7, 1.6, 0.4);
      var mat = makeMat(0x886655, 0x443322, 0.1);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(hp[0], hp[1], hp[2]);

      // Floating animation offset
      mesh.userData.floatOffset = Math.random() * Math.PI * 2;
      mesh.userData.freed = false;
      mesh.userData.baseY = hp[1];
      scene.add(mesh);
      hostages.push(mesh);
    }
  }

  // ─── Pickups ──────────────────────────────────────────────────────────────────
  function spawnPickups() {
    // Toolbox with plasma torch
    var toolboxGeo = new THREE.BoxGeometry(1, 0.7, 0.5);
    var toolboxMat = makeMat(0xdd8800, 0x884400, 0.3);
    var tb = new THREE.Mesh(toolboxGeo, toolboxMat);
    tb.position.set(5, -6.5, 0);
    tb.userData.type = 'toolbox';
    tb.userData.label = 'TOOLBOX (Plasma Torch)';
    scene.add(tb);
    toolboxes.push(tb);

    // Tether gun pickup
    var tgGeo = new THREE.BoxGeometry(0.5, 0.3, 1.2);
    var tgMat = makeMat(0x00aaff, 0x0055aa, 0.4);
    tetherPickup = new THREE.Mesh(tgGeo, tgMat);
    tetherPickup.position.set(-5, -6.5, 0);
    tetherPickup.userData.type = 'tetherGun';
    tetherPickup.userData.label = 'TETHER GUN';
    scene.add(tetherPickup);

    // Seal kits
    var sealPositions = [[2, 0, -6], [-2, 0, 6], [0, 6, 2]];
    for (var i = 0; i < 3; i++) {
      var skGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var skMat = makeMat(0xff4488, 0xaa0044, 0.4);
      var sk = new THREE.Mesh(skGeo, skMat);
      sk.position.set(sealPositions[i][0], sealPositions[i][1], sealPositions[i][2]);
      sk.userData.type = 'sealKit';
      sk.userData.label = 'SEAL KIT';
      scene.add(sk);
      sealKitPickups.push(sk);
    }

    // Ammo pickups scattered
    var ammoPositions = [[10, 0, 0], [-10, 0, 0], [0, 0, 10], [0, 3, -3], [20, 0, 0], [-20, 0, 0]];
    for (var j = 0; j < ammoPositions.length; j++) {
      var aGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      var aMat = makeMat(0xffcc00, 0xaa8800, 0.3);
      var ammoMesh = new THREE.Mesh(aGeo, aMat);
      ammoMesh.position.set(ammoPositions[j][0], ammoPositions[j][1], ammoPositions[j][2]);
      ammoMesh.userData.type = 'ammo';
      ammoMesh.userData.label = 'AMMO (+30)';
      scene.add(ammoMesh);
      sealKitPickups.push(ammoMesh); // reuse array for all small pickups
    }

    // Health pack
    var hpGeo = new THREE.BoxGeometry(0.5, 0.5, 0.2);
    var hpMat = makeMat(0xff2222, 0xaa0000, 0.4);
    var hpMesh = new THREE.Mesh(hpGeo, hpMat);
    hpMesh.position.set(0, -6.5, 5);
    hpMesh.userData.type = 'health';
    hpMesh.userData.label = 'MED KIT (+40 HP)';
    scene.add(hpMesh);
    sealKitPickups.push(hpMesh);
  }

  // ─── Tether Visuals ───────────────────────────────────────────────────────────
  function createTetherLine() {
    var points = [new THREE.Vector3(), new THREE.Vector3()];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x00aaff, linewidth: 2 });
    tether.line = new THREE.Line(geo, mat);
    scene.add(tether.line);
  }

  function updateTetherLine() {
    if (!tether.active || !tether.line) return;
    var points = [player.pos.clone(), tether.anchor.clone()];
    tether.line.geometry.setFromPoints(points);
    tether.line.geometry.attributes.position.needsUpdate = true;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%',
      'color:#00ffcc', 'font-family:monospace', 'font-size:13px',
      'padding:8px 12px', 'background:rgba(0,0,0,0.55)',
      'pointer-events:none', 'z-index:100', 'box-sizing:border-box',
      'text-shadow:0 0 6px #00ffcc'
    ].join(';');
    document.body.appendChild(hudEl);

    // Crosshair
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px', 'height:20px',
      'border:2px solid rgba(0,255,200,0.7)',
      'border-radius:50%',
      'pointer-events:none', 'z-index:101'
    ].join(';');
    document.body.appendChild(ch);

    // Interaction prompt
    var prompt = document.createElement('div');
    prompt.id = 'sss-prompt';
    prompt.style.cssText = [
      'position:fixed', 'bottom:100px', 'left:50%',
      'transform:translateX(-50%)',
      'color:#ffcc00', 'font-family:monospace', 'font-size:15px',
      'background:rgba(0,0,0,0.6)', 'padding:6px 14px',
      'border:1px solid #ffcc00', 'border-radius:4px',
      'pointer-events:none', 'z-index:102', 'display:none'
    ].join(';');
    document.body.appendChild(prompt);

    // E-hold progress bar
    var progBar = document.createElement('div');
    progBar.id = 'sss-progbar';
    progBar.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%',
      'transform:translateX(-50%)',
      'width:200px', 'height:10px',
      'background:rgba(255,200,0,0.3)',
      'border:1px solid #ffcc00', 'border-radius:3px',
      'pointer-events:none', 'z-index:102', 'display:none'
    ].join(';');
    var progFill = document.createElement('div');
    progFill.id = 'sss-progfill';
    progFill.style.cssText = 'width:0%;height:100%;background:#ffcc00;border-radius:3px;transition:width 0.05s;';
    progBar.appendChild(progFill);
    document.body.appendChild(progBar);

    // Overlay for win/lose/start
    var overlay = document.createElement('div');
    overlay.id = 'sss-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,40,0.88)', 'color:#00ffcc', 'font-family:monospace',
      'font-size:20px', 'z-index:200', 'pointer-events:auto', 'text-align:center'
    ].join(';');
    overlay.innerHTML = [
      '<div style="font-size:32px;font-weight:bold;color:#00ffcc;text-shadow:0 0 20px #00ffcc;margin-bottom:20px">SPACE STATION SIEGE</div>',
      '<div style="color:#88ccff;font-size:15px;line-height:1.8;max-width:600px">',
      'International Space Station has been hijacked!<br>',
      'Ringleader has activated DE-ORBIT SEQUENCE (8 min)<br><br>',
      '<b>WASD</b> - Move &nbsp; <b>Mouse</b> - Look &nbsp; <b>Click</b> - Shoot<br>',
      '<b>Space</b> - Jump/Push off surface &nbsp; <b>E</b> - Interact (hold)<br>',
      '<b>T</b> - Fire Tether Gun &nbsp; <b>R</b> - Reload<br>',
      '<b>F</b> - Use Seal Kit (fix hull breach)<br><br>',
      '<b>MISSION:</b> Abort de-orbit, kill ringleader, reach docking bay<br>',
      '<b>WARNING:</b> Avoid reactor room - damage causes power failure!',
      '</div>',
      '<div style="margin-top:30px;color:#ffcc00;font-size:14px">Press <b>S</b> then <b>T</b> within 400ms to BEGIN</div>'
    ].join('');
    document.body.appendChild(overlay);
  }

  function updateHUD(dt) {
    if (!hudEl || !gameActive) return;

    var deOrbitStr = deOrbitAborted ? 'ABORTED' : formatTime(deOrbitTime);
    var deOrbitColor = deOrbitAborted ? '#00ff88' : (deOrbitTime < 60 ? '#ff2200' : '#ff8800');
    var rleStr = ringleaderDead ? 'DEAD' : 'ALIVE';
    var rleColor = ringleaderDead ? '#00ff88' : '#ff4444';
    var aliveCount = 0;
    for (var i = 0; i < hijackers.length; i++) {
      if (!hijackers[i].dead) aliveCount++;
    }
    var o2Str = player.inSpace ? ' [O2: ' + Math.ceil(player.o2) + 's]' : '';
    var o2Color = player.o2 < 15 ? '#ff2200' : '#00ccff';
    var hpColor = player.hp < 30 ? '#ff2200' : '#00ffcc';
    var reactorStr = reactorDamaged ? ' [POWER OUT!]' : '';

    hudEl.innerHTML = [
      '<span style="color:#00ffcc;font-weight:bold">SPACE STATION SIEGE</span> ',
      '[DE-ORBIT: <span style="color:' + deOrbitColor + '">' + deOrbitStr + '</span>] ',
      '[CREW: <span style="color:#88ff88">' + crewFreed + '/6 FREED</span>] ',
      '[RINGLEADER: <span style="color:' + rleColor + '">' + rleStr + '</span>] ',
      '[BREACHES: <span style="color:#ffaa00">' + player.breaches + '</span>] ',
      '[HIJACKERS: <span style="color:#ff6666">' + aliveCount + '</span>] ',
      '[TIMER: <span style="color:#aaaaff">' + formatTime(gameTimer) + '</span>] ',
      '[HP: <span style="color:' + hpColor + '">' + Math.ceil(player.hp) + '</span>]',
      o2Str ? '<span style="color:' + o2Color + '">' + o2Str + '</span>' : '',
      reactorDamaged ? '<span style="color:#ff8800">' + reactorStr + '</span>' : '',
      player.hasPlasmaTorch ? ' [<span style="color:#ff8822">TORCH</span>]' : '',
      player.hasTetherGun ? ' [<span style="color:#22aaff">TETHER</span>]' : '',
      ' [AMMO: <span style="color:#ffcc44">' + player.ammo + '</span>]',
      '[SEALS: <span style="color:#ff88aa">' + player.sealKits + '</span>]'
    ].join('');

    // Interaction prompt
    var promptEl = document.getElementById('sss-prompt');
    var progBarEl = document.getElementById('sss-progbar');
    var progFillEl = document.getElementById('sss-progfill');

    if (eHoldTarget && promptEl) {
      promptEl.style.display = 'block';
      var req = getInteractionRequired(eHoldTarget);
      promptEl.textContent = 'Hold E: ' + (eHoldTarget.userData.label || 'Interact') + ' (' + req.toFixed(1) + 's)';
      if (ePressed && eHoldTimer > 0) {
        progBarEl.style.display = 'block';
        var pct = Math.min(100, (eHoldTimer / req) * 100);
        progFillEl.style.width = pct + '%';
      } else {
        progBarEl.style.display = 'none';
      }
    } else {
      if (promptEl) promptEl.style.display = 'none';
      if (progBarEl) progBarEl.style.display = 'none';
    }
  }

  function showOverlay(html) {
    var ov = document.getElementById('sss-overlay');
    if (ov) { ov.style.display = 'flex'; ov.innerHTML = html; }
  }

  function hideOverlay() {
    var ov = document.getElementById('sss-overlay');
    if (ov) ov.style.display = 'none';
  }

  // ─── Input ────────────────────────────────────────────────────────────────────
  function setupInput() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function onKeyDown(e) {
    keys[e.code] = true;

    // Activation sequence: S then T within 400ms
    if (!gameActive && !gameOver) {
      if (e.code === 'KeyS') {
        activationKeys = ['S'];
        if (activationTimeout) clearTimeout(activationTimeout);
        activationTimeout = setTimeout(function() { activationKeys = []; }, 400);
      } else if (e.code === 'KeyT' && activationKeys[0] === 'S') {
        activationKeys = [];
        if (activationTimeout) clearTimeout(activationTimeout);
        startGame();
        return;
      }
    }

    if (!gameActive) return;

    if (e.code === 'KeyE') {
      ePressed = true;
    }
    if (e.code === 'KeyF') {
      useSealKit();
    }
    if (e.code === 'KeyT' && player.hasTetherGun) {
      fireTether();
    }
    if (e.code === 'KeyR') {
      // Reload
      player.ammo = Math.min(90, player.ammo + 30);
    }
    if (e.code === 'Space') {
      doJump();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'KeyE') {
      ePressed = false;
      eHoldTimer = 0;
    }
  }

  function onMouseMove(e) {
    if (!mouse.locked || !gameActive) return;
    var sens = 0.002;
    yaw -= e.movementX * sens;
    pitch -= e.movementY * sens;
    pitch = clamp(pitch, -Math.PI / 2.2, Math.PI / 2.2);
  }

  function onMouseClick(e) {
    if (!gameActive) return;
    if (!mouse.locked) {
      renderer.domElement.requestPointerLock();
      return;
    }
    shoot();
  }

  function onPointerLockChange() {
    mouse.locked = document.pointerLockElement === renderer.domElement;
  }

  // ─── Game Start/Reset ─────────────────────────────────────────────────────────
  function startGame() {
    hideOverlay();
    gameActive = true;
    gameOver = false;
    gameWon = false;
    renderer.domElement.requestPointerLock();
  }

  function triggerGameOver(won) {
    gameOver = true;
    gameActive = false;
    gameWon = won;
    if (document.exitPointerLock) document.exitPointerLock();

    if (won) {
      showOverlay([
        '<div style="font-size:36px;color:#00ff88;text-shadow:0 0 20px #00ff88;margin-bottom:20px">MISSION COMPLETE</div>',
        '<div style="color:#88ccff;font-size:16px;line-height:2">',
        'De-orbit ABORTED<br>Ringleader ELIMINATED<br>',
        'Station SECURED<br>Crew Freed: ' + crewFreed + '/6<br>',
        'Time: ' + formatTime(gameTimer),
        '</div>',
        '<div style="margin-top:24px;color:#ffcc00">Press S+T to Play Again</div>'
      ].join(''));
    } else {
      var reason = playerDead ? 'YOU WERE KILLED' : 'DE-ORBIT SEQUENCE COMPLETE - STATION DESTROYED';
      showOverlay([
        '<div style="font-size:36px;color:#ff2200;text-shadow:0 0 20px #ff2200;margin-bottom:20px">MISSION FAILED</div>',
        '<div style="color:#ff8888;font-size:16px;line-height:2">' + reason + '</div>',
        '<div style="margin-top:24px;color:#ffcc00">Press S+T to Try Again</div>'
      ].join(''));
    }
  }

  // ─── Player Actions ───────────────────────────────────────────────────────────
  function doJump() {
    // Zero-gravity: jump launches player, wall-jump pushes off surface
    var jumpForce = 6;
    if (player.onSurface) {
      // Push off in normal direction
      player.vel.addScaledVector(player.surfaceNormal, jumpForce);
      player.onSurface = false;
    } else {
      // In space, boost in look direction
      var dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      player.vel.addScaledVector(dir, jumpForce * 0.5);
    }
  }

  function shoot() {
    if (player.ammo <= 0) return;
    if (player.shootCooldown > 0) return;
    player.ammo--;
    player.shootCooldown = 0.15;

    // Raycasting from camera
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Check hits on enemies
    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (h.dead) continue;
      // Simple sphere hit check
      var toEnemy = h.mesh.position.clone().sub(camera.position);
      var dot = toEnemy.dot(raycaster.ray.direction);
      if (dot < 0) continue;
      var closest = raycaster.ray.direction.clone().multiplyScalar(dot);
      var perp = toEnemy.clone().sub(closest);
      if (perp.length() < 1.2) {
        var dmg = 20 + Math.random() * 10;
        h.hp -= dmg;
        if (h.hp <= 0) {
          h.dead = true;
          h.mesh.visible = false;
          if (h.isRingleader) ringleaderDead = true;
        }
        // Alert nearby enemies
        alertNearby(h.mesh.position, 12);
        break;
      }
    }

    // Check hits on windows (causes hull breach)
    for (var j = 0; j < stationMeshes.length; j++) {
      var sm = stationMeshes[j];
      if (!sm.userData.isWindow || sm.userData.breached) continue;
      var toWin = sm.position.clone().sub(camera.position);
      var dotW = toWin.dot(raycaster.ray.direction);
      if (dotW < 0) continue;
      var closestW = raycaster.ray.direction.clone().multiplyScalar(dotW);
      var perpW = toWin.clone().sub(closestW);
      if (perpW.length() < 1.5) {
        sm.userData.breached = true;
        sm.material.color.setHex(0x000000);
        sm.material.opacity = 0.1;
        player.breaches++;
        player.hp -= 15; // suit damaged
      }
    }

    // Check reactor hit
    for (var k = 0; k < stationMeshes.length; k++) {
      if (!stationMeshes[k].userData.isReactor) continue;
      var toR = stationMeshes[k].position.clone().sub(camera.position);
      var dotR = toR.dot(raycaster.ray.direction);
      if (dotR < 0) continue;
      var closestR = raycaster.ray.direction.clone().multiplyScalar(dotR);
      var perpR = toR.clone().sub(closestR);
      if (perpR.length() < 2.5) {
        reactorDamaged = true;
        // Dim lights
        if (ambientLight) ambientLight.intensity = 0.1;
        for (var pi = 0; pi < pointLights.length; pi++) {
          pointLights[pi].intensity = 0.3;
          pointLights[pi].color.setHex(0xff4400);
        }
      }
    }
  }

  function fireTether() {
    if (!player.hasTetherGun) return;

    if (tether.active) {
      // Release tether
      tether.active = false;
      tether.pulling = false;
      if (tether.line) tether.line.visible = false;
      return;
    }

    // Fire upward or in look direction with range limit of 15
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    var anchorPos = player.pos.clone().addScaledVector(dir, 15);

    // Check if anchor is within station bounds (simple dist check)
    if (dist(anchorPos, new THREE.Vector3(0, 0, 0)) < 50) {
      tether.active = true;
      tether.anchor.copy(anchorPos);
      tether.pulling = true;
      if (!tether.line) createTetherLine();
      tether.line.visible = true;
    }
  }

  function useSealKit() {
    if (player.sealKits > 0 && player.breaches > 0) {
      player.sealKits--;
      player.breaches = Math.max(0, player.breaches - 1);
      player.hp = Math.min(player.maxHp, player.hp + 10);
    }
  }

  function alertNearby(pos, radius) {
    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (!h.dead && dist(h.mesh.position, pos) < radius) {
        h.state = 'attack';
      }
    }
  }

  // ─── Interaction System ───────────────────────────────────────────────────────
  function getInteractionRequired(obj) {
    if (!obj || !obj.userData) return 2;
    if (obj.userData.locked) return 4; // Plasma torch door
    if (obj.userData.type === 'terminal') return 3;
    if (obj.userData.isHostage) return 2;
    return 1;
  }

  function findInteractionTarget() {
    var best = null;
    var bestDist = 3.5;
    var camPos = camera.position;
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    // Check doors
    for (var i = 0; i < doors.length; i++) {
      var d = doors[i];
      if (!d.userData.open) {
        var dd = dist(camPos, d.position);
        if (dd < bestDist) { best = d; bestDist = dd; }
      }
    }
    // Check terminals
    for (var j = 0; j < terminals.length; j++) {
      var t = terminals[j];
      var td = dist(camPos, t.position);
      if (td < bestDist) { best = t; bestDist = td; }
    }
    // Check hostages
    for (var k = 0; k < hostages.length; k++) {
      var ho = hostages[k];
      if (!ho.userData.freed) {
        var hd = dist(camPos, ho.position);
        if (hd < bestDist) {
          ho.userData.isHostage = true;
          ho.userData.label = 'FREE HOSTAGE';
          best = ho;
          bestDist = hd;
        }
      }
    }
    // Check toolboxes
    for (var m = 0; m < toolboxes.length; m++) {
      var tb = toolboxes[m];
      if (tb.visible) {
        var tbd = dist(camPos, tb.position);
        if (tbd < bestDist) { best = tb; bestDist = tbd; }
      }
    }
    // Check tether pickup
    if (tetherPickup && tetherPickup.visible && !player.hasTetherGun) {
      var tpd = dist(camPos, tetherPickup.position);
      if (tpd < bestDist) { best = tetherPickup; bestDist = tpd; }
    }
    // Check small pickups
    for (var n = 0; n < sealKitPickups.length; n++) {
      var sp = sealKitPickups[n];
      if (sp.visible) {
        var spd = dist(camPos, sp.position);
        if (spd < bestDist) { best = sp; bestDist = spd; }
      }
    }
    return best;
  }

  function completeInteraction(target) {
    if (!target || !target.userData) return;

    if (target.userData.locked) {
      // Open locked door with plasma torch
      if (!player.hasPlasmaTorch) {
        // Can't open
        return;
      }
      target.userData.locked = false;
      target.userData.open = true;
      target.visible = false;
    } else if (target.userData.type === 'terminal') {
      if (!deOrbitAborted) {
        deOrbitAborted = true;
        // Flash terminal green
        if (target.material) {
          target.material.color.setHex(0x00ff00);
          target.material.emissive.setHex(0x00ff00);
        }
      }
    } else if (target.userData.isHostage) {
      if (!target.userData.freed) {
        target.userData.freed = true;
        target.material.color.setHex(0x88ff88);
        crewFreed++;
      }
    } else if (target.userData.type === 'toolbox') {
      player.hasPlasmaTorch = true;
      target.visible = false;
    } else if (target.userData.type === 'tetherGun') {
      player.hasTetherGun = true;
      target.visible = false;
    } else if (target.userData.type === 'sealKit') {
      player.sealKits++;
      target.visible = false;
    } else if (target.userData.type === 'ammo') {
      player.ammo = Math.min(90, player.ammo + 30);
      target.visible = false;
    } else if (target.userData.type === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + 40);
      target.visible = false;
    }
  }

  // ─── Player Movement ──────────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!gameActive) return;

    // Zero-gravity: apply very light drag (floaty)
    var drag = reactorDamaged ? 0.97 : 0.98;
    player.vel.multiplyScalar(drag);

    // Movement direction from WASD
    var moveDir = new THREE.Vector3();
    var forward = new THREE.Vector3();
    var right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    right.crossVectors(forward, camera.up).normalize();

    var speed = reactorDamaged ? 4 : 6;
    if (keys['KeyW']) moveDir.addScaledVector(forward, speed);
    if (keys['KeyS']) moveDir.addScaledVector(forward, -speed);
    if (keys['KeyA']) moveDir.addScaledVector(right, -speed);
    if (keys['KeyD']) moveDir.addScaledVector(right, speed);

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      // In zero-g, WASD adds gentle thrust
      player.vel.addScaledVector(moveDir, dt * 2);
    }

    // Tether pulling
    if (tether.active && tether.pulling) {
      var toAnchor = tether.anchor.clone().sub(player.pos);
      var anchorDist = toAnchor.length();
      if (anchorDist < 1.5) {
        tether.active = false;
        tether.pulling = false;
        if (tether.line) tether.line.visible = false;
      } else {
        toAnchor.normalize();
        player.vel.addScaledVector(toAnchor, 15 * dt);
      }
    }

    // Speed limit
    var maxSpeed = reactorDamaged ? 5 : 8;
    if (player.vel.length() > maxSpeed) {
      player.vel.normalize().multiplyScalar(maxSpeed);
    }

    // Move player
    player.pos.addScaledVector(player.vel, dt);

    // Clamp player within station bounds (soft)
    var stationRadius = 45;
    if (player.pos.length() > stationRadius) {
      // In space
      player.inSpace = true;
      player.o2 -= dt;
      if (player.o2 <= 0) {
        player.hp -= 5 * dt; // Suffocation
      }
    } else {
      player.inSpace = false;
      player.o2 = Math.min(player.o2Max, player.o2 + dt * 2);
    }

    // Surface detection (simplified: detect if near station walls)
    detectSurface();

    // Camera follows player
    camera.position.copy(player.pos);
    camera.rotation.set(0, 0, 0);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Shoot cooldown
    if (player.shootCooldown > 0) player.shootCooldown -= dt;

    // Hull breach damage
    if (player.breaches > 0) {
      player.hp -= player.breaches * 0.5 * dt;
    }

    // Death check
    if (player.hp <= 0) {
      playerDead = true;
      triggerGameOver(false);
    }

    // Timer
    gameTimer += dt;
  }

  function detectSurface() {
    // Check if player is near hub walls/floor/ceiling
    var hubY = player.pos.y;
    var inHub = player.pos.length() < 10;

    player.onSurface = false;

    if (inHub) {
      if (Math.abs(hubY) > 6.5) {
        player.onSurface = true;
        player.surfaceNormal.set(0, Math.sign(hubY), 0);
        var sign = Math.sign(hubY);
        if (hubY * sign > 7) {
          player.pos.y = 7 * sign;
          player.vel.y *= -0.2;
        }
      }
    }

    // Module corridor floors
    var px = player.pos.x, py = player.pos.y, pz = player.pos.z;
    // +X corridor
    if (px > 8 && px < 28 && Math.abs(pz) < 3) {
      if (Math.abs(py) > 2.5) {
        player.onSurface = true;
        player.surfaceNormal.set(0, -Math.sign(py), 0);
      }
    }
    // -X corridor
    if (px < -8 && px > -28 && Math.abs(pz) < 3) {
      if (Math.abs(py) > 2.5) {
        player.onSurface = true;
        player.surfaceNormal.set(0, -Math.sign(py), 0);
      }
    }
    // +Z corridor
    if (pz > 8 && pz < 28 && Math.abs(px) < 3) {
      if (Math.abs(py) > 2.5) {
        player.onSurface = true;
        player.surfaceNormal.set(0, -Math.sign(py), 0);
      }
    }
    // -Z corridor
    if (pz < -8 && pz > -28 && Math.abs(px) < 3) {
      if (Math.abs(py) > 2.5) {
        player.onSurface = true;
        player.surfaceNormal.set(0, -Math.sign(py), 0);
      }
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < hijackers.length; i++) {
      var h = hijackers[i];
      if (h.dead) continue;

      // Float animation
      h.floatOffset += dt * 0.8;
      h.mesh.position.y += Math.sin(h.floatOffset) * 0.003;

      var dToPlayer = dist(h.mesh.position, player.pos);

      // State machine
      if (h.state === 'patrol') {
        // Move toward patrol target
        h.patrolTimer -= dt;
        var toPt = h.patrolTarget.clone().sub(h.mesh.position);
        if (toPt.length() < 1 || h.patrolTimer <= 0) {
          // New patrol target
          h.patrolTarget.set(
            h.originPos.x + randRange(-h.patrolRadius, h.patrolRadius),
            h.originPos.y + randRange(-1, 1),
            h.originPos.z + randRange(-h.patrolRadius, h.patrolRadius)
          );
          h.patrolTimer = randRange(2, 5);
        }
        var moveSpeed = 1.5;
        if (toPt.length() > 0.1) {
          toPt.normalize().multiplyScalar(moveSpeed * dt);
          h.mesh.position.add(toPt);
          // Face movement direction
          h.mesh.rotation.y = Math.atan2(toPt.x, toPt.z);
        }

        // Alert if player close
        if (dToPlayer < h.alertRadius) {
          h.state = 'attack';
        }
      } else if (h.state === 'attack') {
        // Chase and shoot player
        var toPlayer = player.pos.clone().sub(h.mesh.position);
        var chaseSpeed = h.isRingleader ? 3.5 : 2.5;

        if (dToPlayer > h.shootRadius) {
          // Chase
          var moveVec = toPlayer.clone().normalize().multiplyScalar(chaseSpeed * dt);
          h.mesh.position.add(moveVec);
        }

        // Face player
        h.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        // Shoot if in range
        if (dToPlayer < h.shootRadius) {
          h.attackCooldown -= dt;
          if (h.attackCooldown <= 0) {
            var cooldown = h.isRingleader ? 0.6 : 1.2;
            h.attackCooldown = cooldown;
            // Hit check with accuracy spread
            var accuracy = h.isRingleader ? 0.7 : 0.45;
            if (Math.random() < accuracy) {
              var dmg = h.isRingleader ? 18 : 10;
              player.hp -= dmg;
            }
          }
        }

        // Return to patrol if player too far
        if (dToPlayer > h.alertRadius * 1.5) {
          h.state = 'patrol';
        }
      }
    }
  }

  // ─── Hostage Float Animation ──────────────────────────────────────────────────
  function updateHostages(dt) {
    for (var i = 0; i < hostages.length; i++) {
      var ho = hostages[i];
      if (ho.userData.freed) continue;
      ho.userData.floatOffset += dt * 0.5;
      ho.position.y = ho.userData.baseY + Math.sin(ho.userData.floatOffset) * 0.3;
      ho.rotation.y += dt * 0.2;
    }
  }

  // ─── Pickups float ────────────────────────────────────────────────────────────
  var pickupFloatTime = 0;
  function updatePickups(dt) {
    pickupFloatTime += dt;
    // Float toolboxes, tether gun, seal kits
    for (var i = 0; i < toolboxes.length; i++) {
      if (toolboxes[i].visible) {
        toolboxes[i].position.y = -6.5 + Math.sin(pickupFloatTime * 1.2 + i) * 0.2;
        toolboxes[i].rotation.y += dt * 0.5;
      }
    }
    if (tetherPickup && tetherPickup.visible) {
      tetherPickup.position.y = -6.5 + Math.sin(pickupFloatTime * 1.5) * 0.25;
      tetherPickup.rotation.y += dt * 0.6;
    }
    for (var j = 0; j < sealKitPickups.length; j++) {
      if (sealKitPickups[j].visible) {
        sealKitPickups[j].rotation.y += dt * 0.8;
        sealKitPickups[j].position.y += Math.sin(pickupFloatTime * 2 + j) * 0.002;
      }
    }
  }

  // ─── E-hold Interaction Update ────────────────────────────────────────────────
  function updateInteraction(dt) {
    eHoldTarget = findInteractionTarget();

    if (ePressed && eHoldTarget) {
      eHoldTimer += dt;
      var required = getInteractionRequired(eHoldTarget);

      // Show appropriate message for locked door without torch
      if (eHoldTarget.userData.locked && !player.hasPlasmaTorch) {
        // Can't open - need plasma torch
        return;
      }

      if (eHoldTimer >= required) {
        completeInteraction(eHoldTarget);
        eHoldTimer = 0;
        eHoldTarget = null;
        ePressed = false;
      }
    } else if (!ePressed) {
      eHoldTimer = 0;
    }
  }

  // ─── De-orbit Countdown ───────────────────────────────────────────────────────
  function updateDeOrbit(dt) {
    if (!deOrbitAborted) {
      deOrbitTime -= dt;
      if (deOrbitTime <= 0) {
        deOrbitTime = 0;
        triggerGameOver(false);
      }
    }
  }

  // ─── Win Check ────────────────────────────────────────────────────────────────
  function checkWinCondition() {
    if (gameOver) return;
    // Win: abort de-orbit + ringleader dead + reach docking bay
    var inDockingBay = dist(player.pos, new THREE.Vector3(0, 0, 30)) < 10;
    if (deOrbitAborted && ringleaderDead && inDockingBay) {
      triggerGameOver(true);
    }
  }

  // ─── Tether Update ────────────────────────────────────────────────────────────
  function updateTether(dt) {
    if (tether.active) {
      updateTetherLine();
    }
  }

  // ─── Stars slow rotation ──────────────────────────────────────────────────────
  var starRotTime = 0;
  function updateStars(dt) {
    starRotTime += dt * 0.01;
    for (var i = 0; i < stars.length; i++) {
      stars[i].position.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.001);
    }
  }

  // ─── Main Loop ────────────────────────────────────────────────────────────────
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    var dt = clock.getDelta();
    dt = Math.min(dt, 0.05); // Cap delta

    if (gameActive && !gameOver) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateHostages(dt);
      updatePickups(dt);
      updateInteraction(dt);
      updateDeOrbit(dt);
      updateTether(dt);
      checkWinCondition();
      updateStars(dt);
      updateHUD(dt);
    }

    renderer.render(scene, camera);
  }

  // ─── Window Resize ────────────────────────────────────────────────────────────
  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    container = document.createElement('div');
    container.id = 'sss-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:50;';
    document.body.appendChild(container);

    // Initial player position in hub
    player.pos.set(0, 0, 5);

    buildScene();
    buildHUD();
    setupInput();

    window.addEventListener('resize', onResize);

    gameLoop();
  }

  // ─── Update (external) ───────────────────────────────────────────────────────
  function update() {
    // Called externally if needed; main loop handles itself
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────
  function reset() {
    gameActive = false;
    gameOver = false;
    gameWon = false;
    playerDead = false;

    // Reset player
    player.pos.set(0, 0, 5);
    player.vel.set(0, 0, 0);
    player.hp = 100;
    player.onSurface = false;
    player.inSpace = false;
    player.o2 = 60;
    player.sealKits = 3;
    player.breaches = 0;
    player.hasPlasmaTorch = false;
    player.hasTetherGun = false;
    player.ammo = 90;
    player.shootCooldown = 0;

    // Reset game state
    deOrbitTime = 480;
    deOrbitAborted = false;
    ringleaderDead = false;
    crewFreed = 0;
    reactorDamaged = false;
    gameTimer = 0;

    // Reset tether
    tether.active = false;
    tether.pulling = false;
    if (tether.line) tether.line.visible = false;

    // Reset camera
    yaw = 0;
    pitch = 0;
    eHoldTimer = 0;
    eHoldTarget = null;
    ePressed = false;

    // Reset lighting
    if (ambientLight) ambientLight.intensity = 0.6;
    for (var i = 0; i < pointLights.length; i++) {
      pointLights[i].intensity = 1.5;
      pointLights[i].color.setHex(0x6699cc);
    }

    // Reset enemies
    for (var j = 0; j < hijackers.length; j++) {
      var h = hijackers[j];
      h.dead = false;
      h.hp = h.maxHp;
      h.state = 'patrol';
      h.mesh.visible = true;
      h.attackCooldown = 0;
    }

    // Reset hostages
    for (var k = 0; k < hostages.length; k++) {
      hostages[k].userData.freed = false;
      hostages[k].material.color.setHex(0x886655);
    }

    // Reset pickups
    for (var m = 0; m < toolboxes.length; m++) { toolboxes[m].visible = true; }
    if (tetherPickup) tetherPickup.visible = true;
    for (var n = 0; n < sealKitPickups.length; n++) { sealKitPickups[n].visible = true; }

    // Reset doors
    for (var d = 0; d < doors.length; d++) {
      doors[d].userData.locked = true;
      doors[d].userData.open = false;
      doors[d].visible = true;
    }

    // Reset terminals
    for (var t = 0; t < terminals.length; t++) {
      if (terminals[t].material) {
        terminals[t].material.color.setHex(0x00ff88);
        terminals[t].material.emissive.setHex(0x00ff44);
      }
    }

    // Restore ringleader
    if (ringleader) {
      ringleader.dead = false;
      ringleader.hp = 450;
      ringleader.mesh.visible = true;
      ringleader.state = 'patrol';
    }

    // Show start overlay again
    var ov = document.getElementById('sss-overlay');
    if (ov) {
      ov.style.display = 'flex';
      ov.innerHTML = [
        '<div style="font-size:32px;font-weight:bold;color:#00ffcc;text-shadow:0 0 20px #00ffcc;margin-bottom:20px">SPACE STATION SIEGE</div>',
        '<div style="color:#88ccff;font-size:15px;line-height:1.8;max-width:600px">',
        'MISSION RESET<br><br>',
        '<b>WASD</b> - Move &nbsp; <b>Mouse</b> - Look &nbsp; <b>Click</b> - Shoot<br>',
        '<b>Space</b> - Jump/Push off surface &nbsp; <b>E</b> - Interact (hold)<br>',
        '<b>T</b> - Fire Tether Gun &nbsp; <b>R</b> - Reload<br>',
        '<b>F</b> - Use Seal Kit (fix hull breach)',
        '</div>',
        '<div style="margin-top:30px;color:#ffcc00;font-size:14px">Press <b>S</b> then <b>T</b> within 400ms to BEGIN</div>'
      ].join('');
    }
  }

  return { init: init, update: update, reset: reset };

})();
