(function (window) {
  'use strict';

  // ─── State ─────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys (C + P within 400ms)
    cDown: false,
    pDown: false,
    cDownTime: 0,
    pDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    // player
    playerPos: null,   // THREE.Vector3
    playerYaw: 0,
    playerPitch: 0,
    moveKeys: {},
    pointerLocked: false,
    playerHP: 100,
    floor: 1,
    // augmentation
    augCharge: 100,   // 0-100
    augBlockedTimer: 0, // seconds remaining (Hacker NPC counter-hack)
    // hacks
    hackCooldown: 0,
    cameraHackTimer: 0,
    cameraHackActive: false,
    turretHackTimers: [],
    frozenEnemies: [],
    // mission
    blackBoxTaken: false,
    blackBoxMesh: null,
    missionComplete: false,
    // data shards
    shards: [],
    shardsCollected: 0,
    cheatActive: false,
    cheatTimer: 0,
    // corporate AI
    aiAwareness: 0,   // 0-100
    lockdownActive: false,
    lockdownLights: [],
    lockdownGuards: [],
    // enemies
    enemies: [],
    // cameras
    cameras3d: [],
    // turrets
    turrets: [],
    // doors
    doors: [],
    // skyscrapers / neon
    skyscrapers: [],
    neonLights: [],
    hologramAds: [],
    rainOverlayLight: null,
    // hud
    hudEl: null,
    // elevator
    elevatorMesh: null,
    elevatorY: 0,
    elevatorTarget: 0,
    playerInElevator: false,
    // tower
    towerMesh: null,
    towerFloors: [],
    // escape pad
    escapePad: null,
    // ground / street
    groundMesh: null
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function makeBox(w, h, d, colorHex, x, y, z, emissive) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var params = { color: colorHex };
    if (emissive !== undefined) {
      params.emissive = emissive;
      params.emissiveIntensity = 0.7;
    }
    var mat = new THREE.MeshLambertMaterial(params);
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

  function makeLines(points, colorHex) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    var i;
    for (i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: colorHex });
    return new THREE.LineSegments(geo, mat);
  }

  function dist3D(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function vecFromYaw(yaw) {
    return { x: Math.sin(yaw), z: Math.cos(yaw) };
  }

  // ─── Scene Init ────────────────────────────────────────────────────────────
  function initScene() {
    var T = window.THREE;
    if (!T) { console.warn('CyberpunkCity: THREE.js not found'); return false; }

    state.scene = new T.Scene();
    state.scene.background = new T.Color(0x000511);
    state.scene.fog = new T.FogExp2(0x110033, 0.03);

    state.camera = new T.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    state.camera.position.set(0, 1.7, 0);

    state.playerPos = state.camera.position;

    state.renderer = new T.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.id = 'cyberpunk-city-canvas';
    state.renderer.domElement.style.cssText = 'position:fixed;top:0;left:0;z-index:900;';
    document.body.appendChild(state.renderer.domElement);

    buildAmbient();
    buildGround();
    buildSkyscrapers();
    buildRainLight();
    buildHologramAds();
    buildTower();
    buildElevator();
    buildFloors();
    buildEscapePad();
    buildBlackBox();
    buildEnemies();
    buildCameras3d();
    buildTurrets();
    buildDoors();
    buildDataShards();
    buildHUD();

    return true;
  }

  // ─── Ambient ───────────────────────────────────────────────────────────────
  function buildAmbient() {
    var ambient = new THREE.AmbientLight(0x0a0a1a, 0.6);
    state.scene.add(ambient);
  }

  // ─── Ground / Street ───────────────────────────────────────────────────────
  function buildGround() {
    var ground = makeBox(200, 0.2, 200, 0x0a0a10, 0, -0.1, 0);
    state.scene.add(ground);
    state.groundMesh = ground;

    // Street puddle reflections as emissive strips
    var i;
    for (i = 0; i < 12; i++) {
      var strip = makeBox(
        1 + Math.random() * 3,
        0.01,
        0.3 + Math.random(),
        0x001122,
        (Math.random() - 0.5) * 60,
        0.01,
        (Math.random() - 0.5) * 60,
        0x002244
      );
      state.scene.add(strip);
    }
  }

  // ─── Skyscrapers ───────────────────────────────────────────────────────────
  function buildSkyscrapers() {
    var colors = [0x112244, 0x221133, 0x002233, 0x112244, 0x221133, 0x002233, 0x112244, 0x221133];
    var neonColors = [0x0044FF, 0xFF0044, 0x00FFCC, 0xFF0044, 0x0044FF, 0x00FFCC, 0xFF0044, 0x0044FF];
    var positions = [
      [-25, -30], [25, -30], [-40, -10], [40, -10],
      [-28, 15], [28, 15], [-45, 35], [45, 35]
    ];
    var heights = [40, 35, 50, 45, 38, 42, 55, 48];
    var i;

    state.skyscrapers = [];
    state.neonLights = [];

    for (i = 0; i < 8; i++) {
      var w = 8 + Math.random() * 6;
      var h = heights[i];
      var d = 8 + Math.random() * 6;
      var x = positions[i][0];
      var z = positions[i][1];

      var scraper = makeBox(w, h, d, colors[i], x, h / 2, z);
      scraper.castShadow = true;
      scraper.receiveShadow = true;
      state.scene.add(scraper);
      state.skyscrapers.push(scraper);

      // Neon sign PointLight at mid-height
      var neonLight = new THREE.PointLight(neonColors[i], 2.5, 20);
      neonLight.position.set(x, h * 0.6, z);
      state.scene.add(neonLight);
      state.neonLights.push({ light: neonLight, baseIntensity: 2.5, timer: Math.random() * Math.PI * 2 });

      // Neon sign geometry (small emissive box on building face)
      var signW = 2 + Math.random() * 2;
      var signH = 0.6;
      var signBox = makeBox(signW, signH, 0.15, neonColors[i], x, h * 0.6, z - d / 2 - 0.1, neonColors[i]);
      state.scene.add(signBox);

      // Window rows (emissive small boxes)
      var floorCount = Math.floor(h / 3);
      var f, winX, col;
      for (f = 1; f < floorCount; f++) {
        for (winX = -1; winX <= 1; winX++) {
          if (Math.random() > 0.5) {
            col = (Math.random() > 0.7) ? 0xFF6600 : 0x4488FF;
            var win = makeBox(1.2, 0.8, 0.05, col, x + winX * 2.5, f * 3 + 1, z - d / 2 - 0.05, col);
            win.userData.flickerTimer = Math.random() * 5;
            state.scene.add(win);
          }
        }
      }
    }
  }

  // ─── Rain Light Overlay ────────────────────────────────────────────────────
  function buildRainLight() {
    var rainLight = new THREE.PointLight(0x224466, 1.0, 80);
    rainLight.position.set(0, 30, 0);
    state.scene.add(rainLight);
    state.rainOverlayLight = rainLight;
  }

  // ─── Hologram Ads ──────────────────────────────────────────────────────────
  function buildHologramAds() {
    var i, ad, x, z, h;
    state.hologramAds = [];
    var adPositions = [
      [-15, -15, 8], [15, -20, 10], [-20, 5, 12], [20, 10, 9]
    ];

    for (i = 0; i < adPositions.length; i++) {
      x = adPositions[i][0];
      h = adPositions[i][2];
      z = adPositions[i][1];
      ad = makeBox(3, 5, 0.1, 0x0088FF, x, h, z, 0x0088FF);
      ad.userData.flickerTimer = Math.random() * 3;
      ad.userData.flickerPhase = Math.random();
      state.scene.add(ad);
      state.hologramAds.push(ad);

      // Small sub-panel
      var sub = makeBox(2, 1.5, 0.08, 0x00FFCC, x + 0.2, h - 3.5, z + 0.05, 0x00FFCC);
      sub.userData.flickerTimer = Math.random() * 2;
      sub.userData.flickerPhase = Math.random() * Math.PI;
      state.scene.add(sub);
      state.hologramAds.push(sub);
    }
  }

  // ─── Megacorp Tower ────────────────────────────────────────────────────────
  function buildTower() {
    var tower = makeBox(8, 30, 8, 0x112233, 0, 15, -20);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.userData.type = 'tower';
    state.scene.add(tower);
    state.towerMesh = tower;

    // Tower accent lights
    var tl1 = new THREE.PointLight(0x0044FF, 1.5, 15);
    tl1.position.set(0, 30, -20);
    state.scene.add(tl1);
    var tl2 = new THREE.PointLight(0xFF0044, 1.0, 12);
    tl2.position.set(4, 20, -16);
    state.scene.add(tl2);
  }

  // ─── Elevator ──────────────────────────────────────────────────────────────
  function buildElevator() {
    // Elevator shaft (visual, cylinder)
    var shaft = makeCylinder(0.4, 0.4, 30, 0x1a2233, 0, 15, -16);
    shaft.userData.type = 'elevatorShaft';
    state.scene.add(shaft);

    // Elevator cab
    var cab = makeBox(1.5, 1.8, 1.5, 0x223344, 0, 1.5, -16);
    cab.userData.type = 'elevatorCab';
    state.scene.add(cab);
    state.elevatorMesh = cab;
    state.elevatorY = 1.5;
    state.elevatorTarget = 1.5;

    // Stairwell ladder LineSegments (vertical rungs)
    var ladderPoints = [];
    var r;
    for (r = 0; r <= 12; r++) {
      var yBase = r * 2.5;
      // left rail
      ladderPoints.push(new THREE.Vector3(2.5, yBase, -17));
      ladderPoints.push(new THREE.Vector3(2.5, yBase + 2.5, -17));
      // right rail
      ladderPoints.push(new THREE.Vector3(3.2, yBase, -17));
      ladderPoints.push(new THREE.Vector3(3.2, yBase + 2.5, -17));
      // rung
      ladderPoints.push(new THREE.Vector3(2.5, yBase + 1.0, -17));
      ladderPoints.push(new THREE.Vector3(3.2, yBase + 1.0, -17));
      ladderPoints.push(new THREE.Vector3(2.5, yBase + 1.8, -17));
      ladderPoints.push(new THREE.Vector3(3.2, yBase + 1.8, -17));
    }
    var ladder = makeLines(ladderPoints, 0x334466);
    state.scene.add(ladder);
  }

  // ─── Tower Floors ──────────────────────────────────────────────────────────
  function buildFloors() {
    var i, floor;
    state.towerFloors = [];
    for (i = 0; i < 12; i++) {
      var floorY = i * 2.5;
      floor = makeBox(7.5, 0.15, 7.5, 0x0d1a2a, 0, floorY, -20);
      floor.receiveShadow = true;
      state.scene.add(floor);
      state.towerFloors.push(floor);

      // Floor number light
      var fLight = new THREE.PointLight(0x001133, 0.8, 5);
      fLight.position.set(0, floorY + 1.5, -20);
      state.scene.add(fLight);
    }
  }

  // ─── Escape Pad (Rooftop) ──────────────────────────────────────────────────
  function buildEscapePad() {
    var pad = makeBox(4, 0.1, 4, 0x00FFCC, 0, 30.1, -20, 0x00FFCC);
    pad.userData.type = 'escapePad';
    state.scene.add(pad);
    state.escapePad = pad;

    var padLight = new THREE.PointLight(0x00FFCC, 2.0, 10);
    padLight.position.set(0, 32, -20);
    state.scene.add(padLight);
  }

  // ─── BlackBox ──────────────────────────────────────────────────────────────
  function buildBlackBox() {
    // Floor 12 = index 11 → y = 11*2.5 = 27.5; place at y+0.4
    var bb = makeBox(0.4, 0.4, 0.4, 0x00FFCC, 1, 27.95, -20, 0x00FFCC);
    bb.userData.type = 'blackBox';
    state.scene.add(bb);
    state.blackBoxMesh = bb;

    var bbLight = new THREE.PointLight(0x00FFCC, 1.5, 4);
    bbLight.position.set(1, 28.2, -20);
    state.scene.add(bbLight);
    state.blackBoxLight = bbLight;
  }

  // ─── Data Shards ───────────────────────────────────────────────────────────
  function buildDataShards() {
    var i, shard, floorIdx, y;
    state.shards = [];
    // One shard per floor (floors 0-11 within tower)
    var offsets = [
      [-1, -19], [1.5, -21], [-1.5, -20], [0.5, -18],
      [-0.5, -21], [1, -19], [-1, -20], [1.5, -18],
      [-1.5, -21], [0.5, -20], [-1, -19], [1, -21]
    ];
    for (i = 0; i < 12; i++) {
      floorIdx = i;
      y = floorIdx * 2.5 + 0.5;
      shard = makeBox(0.25, 0.25, 0.25, 0x0088FF, offsets[i][0], y, offsets[i][1], 0x0088FF);
      shard.userData.type = 'dataShard';
      shard.userData.index = i;
      shard.userData.collected = false;
      shard.userData.spinTimer = Math.random() * Math.PI * 2;
      state.scene.add(shard);
      state.shards.push(shard);
    }
  }

  // ─── Enemies ───────────────────────────────────────────────────────────────
  function buildEnemies() {
    var i;
    state.enemies = [];

    // 2 Corpo Enforcers – street level
    for (i = 0; i < 2; i++) {
      spawnEnemy('corpo', (i === 0 ? -5 : 5), 0.9, (i === 0 ? -5 : -8));
    }

    // 1 Combat Drone – hovering
    spawnEnemy('drone', 3, 4, -10);

    // 1 Cyborg – mid tower
    spawnEnemy('cyborg', -1, 8 * 2.5 + 0.9, -20);

    // 1 Hacker NPC – upper floor
    spawnEnemy('hacker', 1, 10 * 2.5 + 0.9, -20);

    // 1 Extra Corpo near tower entrance
    spawnEnemy('corpo', -2, 0.9, -14);
  }

  function spawnEnemy(type, x, y, z) {
    var mesh, light, hp, lines, obj;
    if (type === 'corpo') {
      mesh = makeBox(0.6, 1.8, 0.4, 0x223344, x, y, z);
      hp = 80;
    } else if (type === 'drone') {
      mesh = makeCylinder(0.4, 0.4, 0.3, 0x334455, x, y, z);
      hp = 50;
    } else if (type === 'cyborg') {
      mesh = makeBox(0.65, 1.8, 0.45, 0x334422, x, y, z);
      hp = 120;
      // Metal limb (visible LineSegments)
      var limbPoints = [
        new THREE.Vector3(x + 0.35, y + 0.6, z),
        new THREE.Vector3(x + 0.8, y + 0.2, z),
        new THREE.Vector3(x + 0.8, y + 0.2, z),
        new THREE.Vector3(x + 1.1, y - 0.4, z)
      ];
      lines = makeLines(limbPoints, 0xAABBCC);
      state.scene.add(lines);
    } else if (type === 'hacker') {
      mesh = makeBox(0.6, 1.8, 0.4, 0x442244, x, y, z);
      hp = 60;
    }

    mesh.castShadow = true;
    mesh.userData.type = 'enemy';
    mesh.userData.enemyType = type;
    state.scene.add(mesh);

    obj = {
      mesh: mesh,
      type: type,
      hp: hp,
      maxHp: hp,
      frozen: false,
      frozenTimer: 0,
      limbMesh: lines || null,
      limbIntact: type === 'cyborg',
      regenTimer: 0,
      hackTimer: 0,         // hacker counter-hack cooldown
      alertTimer: 0,
      patrol: true,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolRadius: 2 + Math.random() * 2,
      patrolOrigin: { x: x, y: y, z: z }
    };

    state.enemies.push(obj);
    return obj;
  }

  // ─── Security Cameras ──────────────────────────────────────────────────────
  function buildCameras3d() {
    var positions = [
      { x: -3, y: 3, z: -14 },
      { x: 3, y: 5, z: -22 },
      { x: -2, y: 8, z: -20 }
    ];
    var i, cam, obj;
    state.cameras3d = [];
    for (i = 0; i < positions.length; i++) {
      cam = makeCylinder(0.15, 0.2, 0.4, 0x334455,
        positions[i].x, positions[i].y, positions[i].z);
      cam.userData.type = 'camera3d';
      state.scene.add(cam);
      obj = {
        mesh: cam,
        hacked: false,
        hackedTimer: 0,
        scanAngle: Math.random() * Math.PI * 2,
        scanDir: 1
      };
      state.cameras3d.push(obj);
    }
  }

  // ─── Turrets ───────────────────────────────────────────────────────────────
  function buildTurrets() {
    var positions = [
      { x: -3.5, y: 2.5, z: -20 },
      { x: 3.5, y: 5.0, z: -20 }
    ];
    var i, turret, obj;
    state.turrets = [];
    for (i = 0; i < positions.length; i++) {
      turret = makeCylinder(0.3, 0.35, 0.5, 0x553322,
        positions[i].x, positions[i].y, positions[i].z);
      turret.userData.type = 'turret';
      state.scene.add(turret);
      obj = {
        mesh: turret,
        flipped: false,
        flipTimer: 0,
        light: null
      };
      // Turret warning light
      var tLight = new THREE.PointLight(0xFF2200, 1.0, 3);
      tLight.position.set(positions[i].x, positions[i].y + 0.4, positions[i].z);
      state.scene.add(tLight);
      obj.light = tLight;
      state.turrets.push(obj);
    }
  }

  // ─── Door Panels ───────────────────────────────────────────────────────────
  function buildDoors() {
    var doorDefs = [
      { x: 0, y: 1.0, z: -13.5, floorLink: 0 },
      { x: 0, y: 6 * 2.5 + 1.0, z: -16.5, floorLink: 6 },
      { x: 0, y: 11 * 2.5 + 1.0, z: -16.5, floorLink: 11 }
    ];
    var i, panel, doorMesh, obj;
    state.doors = [];
    for (i = 0; i < doorDefs.length; i++) {
      // Door panel (control panel)
      panel = makeBox(0.25, 0.5, 0.08, 0x44FF44,
        doorDefs[i].x - 1.5, doorDefs[i].y, doorDefs[i].z, 0x22AA22);
      panel.userData.type = 'doorPanel';
      state.scene.add(panel);

      // Door mesh
      doorMesh = makeBox(1.5, 2.4, 0.15, 0x334444,
        doorDefs[i].x, doorDefs[i].y, doorDefs[i].z);
      doorMesh.userData.type = 'door';
      state.scene.add(doorMesh);

      obj = {
        panel: panel,
        door: doorMesh,
        locked: true,
        floorLink: doorDefs[i].floorLink
      };
      state.doors.push(obj);
    }
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    var el = document.createElement('div');
    el.id = 'cyberpunk-city-hud';
    el.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:1000',
      'background:rgba(0,5,17,0.82)',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border:1px solid #0044FF',
      'white-space:nowrap',
      'pointer-events:none',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(el);
    state.hudEl = el;
    updateHUD();
  }

  function updateHUD() {
    if (!state.hudEl) return;
    var aug = Math.round(state.augCharge);
    var bbStr = state.blackBoxTaken ? 'SECURED' : 'NOT TAKEN';
    var cheat = (state.cheatActive) ? ' [INFINITE HACK ACTIVE]' : '';
    var block = (state.augBlockedTimer > 0) ? ' [AUG BLOCKED]' : '';
    state.hudEl.textContent =
      'CYBERPUNK' +
      ' [FLOOR: ' + state.floor + '/12]' +
      ' [AUG: ' + aug + '%]' +
      ' [SHARDS: ' + state.shardsCollected + '/8]' +
      ' [AI AWARENESS: ' + Math.round(state.aiAwareness) + '%]' +
      ' [BLACKBOX: ' + bbStr + ']' +
      cheat + block +
      ' | HACK: H/J/K/L';
  }

  function showMessage(txt, durationMs) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'z-index:1100',
      'background:rgba(0,5,17,0.92)',
      'color:#FF0044',
      'font-family:monospace',
      'font-size:22px',
      'padding:14px 28px',
      'border:2px solid #FF0044'
    ].join(';');
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, durationMs || 2500);
  }

  // ─── Hack Actions ──────────────────────────────────────────────────────────
  function hackNearestEnemy() {
    if (!canHack(30)) return;
    var nearest = null, nearestDist = 12.1, i, d;
    for (i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      if (e.hp <= 0) continue;
      d = dist3D(state.playerPos, e.mesh.position);
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    if (!nearest) { showMessage('NO TARGET IN RANGE (12u)', 1200); return; }
    spendCharge(30);
    nearest.frozen = true;
    nearest.frozenTimer = 5;
    showMessage('HACK: ENEMY FROZEN 5s', 1400);
    increaseAwareness(5);
  }

  function hackCamera() {
    if (!canHack(20)) return;
    spendCharge(20);
    state.cameraHackActive = true;
    state.cameraHackTimer = 8;
    showMessage('HACK: CAMERA FEED COMPROMISED 8s', 1600);
    // Visually tint cameras
    var i;
    for (i = 0; i < state.cameras3d.length; i++) {
      state.cameras3d[i].mesh.material.color.setHex(0x00FF88);
      state.cameras3d[i].hacked = true;
      state.cameras3d[i].hackedTimer = 8;
    }
  }

  function hackTurret() {
    if (!canHack(50)) return;
    // Find nearest un-flipped turret
    var nearest = null, nearestDist = 15, i, d;
    for (i = 0; i < state.turrets.length; i++) {
      if (state.turrets[i].flipped) continue;
      d = dist3D(state.playerPos, state.turrets[i].mesh.position);
      if (d < nearestDist) { nearestDist = d; nearest = state.turrets[i]; }
    }
    if (!nearest) { showMessage('NO TURRET IN RANGE', 1200); return; }
    spendCharge(50);
    nearest.flipped = true;
    nearest.flipTimer = 12;
    nearest.mesh.material.color.setHex(0x00FF44);
    nearest.light.color.setHex(0x00FF44);
    showMessage('HACK: TURRET FLIPPED 12s', 1600);
  }

  function hackDoorPanel() {
    if (!canHack(15)) return;
    // Find nearest locked door panel
    var nearest = null, nearestDist = 4, i, d;
    for (i = 0; i < state.doors.length; i++) {
      if (!state.doors[i].locked) continue;
      d = dist3D(state.playerPos, state.doors[i].panel.position);
      if (d < nearestDist) { nearestDist = d; nearest = state.doors[i]; }
    }
    if (!nearest) { showMessage('NO DOOR PANEL IN RANGE (4u)', 1200); return; }
    spendCharge(15);
    nearest.locked = false;
    nearest.door.material.color.setHex(0x008833);
    nearest.panel.material.color.setHex(0x00FF44);
    showMessage('HACK: DOOR UNLOCKED', 1400);
    increaseAwareness(10);
  }

  function canHack(cost) {
    if (state.augBlockedTimer > 0) { showMessage('AUGMENTATION BLOCKED!', 1200); return false; }
    if (!state.cheatActive && state.augCharge < cost) {
      showMessage('INSUFFICIENT AUG CHARGE (' + cost + '% NEEDED)', 1200);
      return false;
    }
    return true;
  }

  function spendCharge(cost) {
    if (!state.cheatActive) {
      state.augCharge = Math.max(0, state.augCharge - cost);
    }
  }

  // ─── AI Awareness ──────────────────────────────────────────────────────────
  function increaseAwareness(amount) {
    if (state.lockdownActive) return;
    state.aiAwareness = Math.min(100, state.aiAwareness + amount);
    if (state.aiAwareness >= 100) {
      triggerLockdown();
    }
    updateHUD();
  }

  function triggerLockdown() {
    if (state.lockdownActive) return;
    state.lockdownActive = true;
    showMessage('!! CORPORATE LOCKDOWN — AI AT 100% !!', 4000);

    // All doors seal
    var i;
    for (i = 0; i < state.doors.length; i++) {
      state.doors[i].locked = true;
      state.doors[i].door.material.color.setHex(0xFF0000);
      state.doors[i].panel.material.color.setHex(0xFF0000);
    }

    // All lights red
    state.lockdownLights = [];
    for (i = 0; i < state.neonLights.length; i++) {
      state.neonLights[i].light.color.setHex(0xFF0000);
    }

    // Spawn 6 extra enforcers
    var positions = [
      [-3, 0.9, -12], [3, 0.9, -12], [-5, 0.9, -5],
      [5, 0.9, -5], [0, 0.9, -8], [-2, 0.9, -16]
    ];
    state.lockdownGuards = [];
    for (i = 0; i < 6; i++) {
      var e = spawnEnemy('corpo', positions[i][0], positions[i][1], positions[i][2]);
      state.lockdownGuards.push(e);
    }
  }

  // ─── Pointer Lock & Input ──────────────────────────────────────────────────
  function setupPointerLock() {
    var canvas = state.renderer.domElement;
    canvas.addEventListener('click', function () {
      canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function () {
      state.pointerLocked = (document.pointerLockElement === canvas);
    });
    document.addEventListener('mousemove', function (e) {
      if (!state.pointerLocked || !state.active) return;
      state.playerYaw -= e.movementX * 0.002;
      state.playerPitch -= e.movementY * 0.002;
      state.playerPitch = Math.max(-1.2, Math.min(1.2, state.playerPitch));
    });
  }

  function setupKeys() {
    document.addEventListener('keydown', function (e) {
      if (!state.active) return;
      var k = e.key.toLowerCase();
      state.moveKeys[k] = true;

      if (k === 'h') { hackNearestEnemy(); }
      if (k === 'j') { hackCamera(); }
      if (k === 'k') { hackTurret(); }
      if (k === 'l') { hackDoorPanel(); }

      // Elevator up/down: e = up, q = down
      if (k === 'e') { callElevatorToPlayer(1); }
      if (k === 'q') { callElevatorToPlayer(-1); }
    });
    document.addEventListener('keyup', function (e) {
      if (!state.active) return;
      state.moveKeys[e.key.toLowerCase()] = false;
    });
  }

  function callElevatorToPlayer(dir) {
    var newFloor = Math.min(12, Math.max(1, state.floor + dir));
    state.floor = newFloor;
    var targetY = (newFloor - 1) * 2.5 + 1.5;
    state.elevatorTarget = targetY;
    // Teleport player to elevator position
    state.playerPos.x = 0;
    state.playerPos.z = -16;
    state.playerPos.y = targetY + 0.1;
    updateHUD();
  }

  // ─── Activation Keys ───────────────────────────────────────────────────────
  function setupActivationKeys() {
    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      var now = performance.now();
      if (k === 'c') { state.cDown = true; state.cDownTime = now; }
      if (k === 'p') { state.pDown = true; state.pDownTime = now; }
      if (state.cDown && state.pDown) {
        var diff = Math.abs(state.cDownTime - state.pDownTime);
        if (diff < 400) {
          if (!state.active) {
            activate();
          } else {
            deactivate();
          }
        }
      }
    });
    document.addEventListener('keyup', function (e) {
      var k = e.key.toLowerCase();
      if (k === 'c') { state.cDown = false; }
      if (k === 'p') { state.pDown = false; }
    });
  }

  // ─── Activate / Deactivate ─────────────────────────────────────────────────
  function activate() {
    if (state.active) return;
    var T = window.THREE;
    if (!T) { console.warn('CyberpunkCity: THREE.js required'); return; }

    state.active = true;
    if (!initScene()) { state.active = false; return; }
    setupPointerLock();
    setupKeys();
    setupResize();
    state.lastTime = performance.now();
    loop();
  }

  function deactivate() {
    state.active = false;
    if (state.animFrameId) { cancelAnimationFrame(state.animFrameId); state.animFrameId = null; }
    // Remove canvas
    var canvas = document.getElementById('cyberpunk-city-canvas');
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    // Remove HUD
    var hud = document.getElementById('cyberpunk-city-hud');
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud);
    // Dispose scene
    if (state.renderer) { state.renderer.dispose(); state.renderer = null; }
    state.scene = null;
    state.camera = null;
    state.enemies = [];
    state.cameras3d = [];
    state.turrets = [];
    state.doors = [];
    state.shards = [];
    state.hologramAds = [];
    state.neonLights = [];
    state.skyscrapers = [];
    state.towerFloors = [];
    state.lockdownGuards = [];
    state.lockdownActive = false;
    state.aiAwareness = 0;
    state.augCharge = 100;
    state.augBlockedTimer = 0;
    state.shardsCollected = 0;
    state.shards = [];
    state.blackBoxTaken = false;
    state.missionComplete = false;
    state.floor = 1;
    state.cheatActive = false;
    state.cheatTimer = 0;
    state.cameraHackActive = false;
    state.cameraHackTimer = 0;
    if (document.exitPointerLock) document.exitPointerLock();
  }

  function setupResize() {
    window.addEventListener('resize', function () {
      if (!state.active || !state.renderer || !state.camera) return;
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // ─── Main Loop ─────────────────────────────────────────────────────────────
  function loop() {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);
    var now = performance.now();
    var dt = Math.min((now - state.lastTime) / 1000, 0.1);
    state.lastTime = now;

    updatePlayer(dt);
    updateAugmentation(dt);
    updateEnemies(dt);
    updateCameras(dt);
    updateTurrets(dt);
    updateShards(dt);
    updateHologramAds(dt);
    updateNeonFlicker(dt);
    updateBlackBox(dt);
    updateMission(dt);
    updateCheat(dt);

    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    state.renderer.render(state.scene, state.camera);
  }

  // ─── Player Movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 5;
    var dir = vecFromYaw(state.playerYaw);
    var right = { x: dir.z, z: -dir.x };

    if (state.moveKeys['w'] || state.moveKeys['arrowup']) {
      state.playerPos.x -= dir.x * speed * dt;
      state.playerPos.z -= dir.z * speed * dt;
    }
    if (state.moveKeys['s'] || state.moveKeys['arrowdown']) {
      state.playerPos.x += dir.x * speed * dt;
      state.playerPos.z += dir.z * speed * dt;
    }
    if (state.moveKeys['a'] || state.moveKeys['arrowleft']) {
      state.playerPos.x += right.x * speed * dt;
      state.playerPos.z += right.z * speed * dt;
    }
    if (state.moveKeys['d'] || state.moveKeys['arrowright']) {
      state.playerPos.x -= right.x * speed * dt;
      state.playerPos.z -= right.z * speed * dt;
    }

    // Compute current floor based on Y position
    var floorIdx = Math.floor((state.playerPos.y - 0.5) / 2.5);
    floorIdx = Math.max(0, Math.min(11, floorIdx));
    state.floor = floorIdx + 1;
  }

  // ─── Augmentation Recharge ─────────────────────────────────────────────────
  function updateAugmentation(dt) {
    if (state.augBlockedTimer > 0) {
      state.augBlockedTimer -= dt;
      if (state.augBlockedTimer < 0) {
        state.augBlockedTimer = 0;
        showMessage('AUGMENTATION RESTORED', 1200);
      }
    } else {
      state.augCharge = Math.min(100, state.augCharge + 10 * dt);
    }
    updateHUD();
  }

  // ─── Enemy AI ──────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    var i, e, d;
    for (i = 0; i < state.enemies.length; i++) {
      e = state.enemies[i];
      if (e.hp <= 0) {
        e.mesh.visible = false;
        if (e.limbMesh) e.limbMesh.visible = false;
        continue;
      }

      // Frozen
      if (e.frozen) {
        e.frozenTimer -= dt;
        e.mesh.material.color.setHex(0x0088FF);
        if (e.frozenTimer <= 0) {
          e.frozen = false;
          restoreEnemyColor(e);
        }
        continue;
      }

      // Cyborg HP regen
      if (e.type === 'cyborg' && e.limbIntact) {
        e.hp = Math.min(e.maxHp, e.hp + 5 * dt);
      }

      // Hacker NPC counter-hack
      if (e.type === 'hacker') {
        e.hackTimer -= dt;
        if (e.hackTimer <= 0) {
          d = dist3D(state.playerPos, e.mesh.position);
          if (d < 15) {
            e.hackTimer = 15;
            if (state.augBlockedTimer <= 0) {
              state.augBlockedTimer = 8;
              showMessage('COUNTER-HACK: AUGMENTATION BLOCKED 8s', 2000);
            }
          } else {
            e.hackTimer = 3;
          }
        }
      }

      // Patrol movement
      e.patrolAngle += dt * 0.4 * e.patrolDir || dt * 0.4;
      e.mesh.position.x = e.patrolOrigin.x + Math.cos(e.patrolAngle) * e.patrolRadius;
      e.mesh.position.z = e.patrolOrigin.z + Math.sin(e.patrolAngle) * e.patrolRadius;
      if (e.type !== 'drone') {
        e.mesh.position.y = e.patrolOrigin.y;
      } else {
        e.mesh.position.y = e.patrolOrigin.y + Math.sin(e.patrolAngle * 2) * 0.3;
      }

      // Update limb position if cyborg
      if (e.type === 'cyborg' && e.limbMesh) {
        var bx = e.mesh.position.x;
        var by = e.mesh.position.y;
        var bz = e.mesh.position.z;
        var pos = e.limbMesh.geometry.attributes.position;
        pos.setXYZ(0, bx + 0.35, by + 0.6, bz);
        pos.setXYZ(1, bx + 0.8, by + 0.2, bz);
        pos.setXYZ(2, bx + 0.8, by + 0.2, bz);
        pos.setXYZ(3, bx + 1.1, by - 0.4, bz);
        pos.needsUpdate = true;
      }

      // Camera awareness
      d = dist3D(state.playerPos, e.mesh.position);
      if (d < 6 && !state.cameraHackActive) {
        increaseAwareness(0.5 * dt);
      }
    }
    // Fix patrolDir init
    for (i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].patrolDir === undefined) {
        state.enemies[i].patrolDir = (Math.random() > 0.5) ? 1 : -1;
      }
    }
  }

  function restoreEnemyColor(e) {
    var colorMap = { corpo: 0x223344, drone: 0x334455, cyborg: 0x334422, hacker: 0x442244 };
    e.mesh.material.color.setHex(colorMap[e.type] || 0x334455);
  }

  // ─── Camera Scanning ───────────────────────────────────────────────────────
  function updateCameras(dt) {
    var i, cam;
    for (i = 0; i < state.cameras3d.length; i++) {
      cam = state.cameras3d[i];
      if (cam.hacked) {
        cam.hackedTimer -= dt;
        if (cam.hackedTimer <= 0) {
          cam.hacked = false;
          cam.mesh.material.color.setHex(0x334455);
          state.cameraHackActive = false;
        }
        continue;
      }

      // Scan rotation
      cam.scanAngle += dt * cam.scanDir * 0.8;
      if (cam.scanAngle > 1.0 || cam.scanAngle < -1.0) { cam.scanDir *= -1; }
      cam.mesh.rotation.y = cam.scanAngle;

      // Check if player is in camera FOV
      var d = dist3D(state.playerPos, cam.mesh.position);
      if (d < 10) {
        increaseAwareness(15 * dt);
      }
    }

    if (state.cameraHackTimer > 0) {
      state.cameraHackTimer -= dt;
      if (state.cameraHackTimer <= 0) {
        state.cameraHackActive = false;
      }
    }
  }

  // ─── Turret Updates ────────────────────────────────────────────────────────
  function updateTurrets(dt) {
    var i, t;
    for (i = 0; i < state.turrets.length; i++) {
      t = state.turrets[i];
      if (t.flipped) {
        t.flipTimer -= dt;
        if (t.flipTimer <= 0) {
          t.flipped = false;
          t.mesh.material.color.setHex(0x553322);
          t.light.color.setHex(0xFF2200);
          showMessage('TURRET ALLEGIANCE EXPIRED', 1200);
        }
        // Flipped turret blinks green
        t.light.intensity = 0.5 + 0.5 * Math.sin(performance.now() * 0.01);
      } else {
        // Turret AI scans player
        var d = dist3D(state.playerPos, t.mesh.position);
        if (d < 8) {
          increaseAwareness(30 * dt);
        }
      }
    }
  }

  // ─── Data Shards ───────────────────────────────────────────────────────────
  function updateShards(dt) {
    var i, s, d;
    for (i = 0; i < state.shards.length; i++) {
      s = state.shards[i];
      if (s.userData.collected) continue;
      s.userData.spinTimer += dt * 2;
      s.rotation.y = s.userData.spinTimer;
      s.position.y += Math.sin(s.userData.spinTimer) * 0.001;

      d = dist3D(state.playerPos, s.position);
      if (d < 1.2) {
        s.userData.collected = true;
        s.visible = false;
        state.shardsCollected++;
        showMessage('DATA SHARD COLLECTED (' + state.shardsCollected + '/8)', 1200);
        if (state.shardsCollected >= 8 && !state.cheatActive) {
          state.cheatActive = true;
          state.cheatTimer = 30;
          showMessage('CHEAT CODE UNLOCKED: INFINITE HACK CHARGE 30s', 3000);
          // Show cheat code menu in HUD
          var cEl = document.createElement('div');
          cEl.id = 'cyberpunk-cheat-menu';
          cEl.style.cssText = [
            'position:fixed', 'bottom:60px', 'right:20px', 'z-index:1000',
            'background:rgba(0,5,17,0.92)', 'color:#00FFCC',
            'font-family:monospace', 'font-size:12px',
            'padding:8px 14px', 'border:1px solid #00FFCC'
          ].join(';');
          cEl.innerHTML = '=== CHEAT CODES UNLOCKED ===<br>[1] INFINITE HACK 30s — ACTIVE<br>[2] ALL SHARDS COLLECTED';
          document.body.appendChild(cEl);
        }
        updateHUD();
      }
    }
  }

  // ─── Hologram Ad Flicker ──────────────────────────────────────────────────
  function updateHologramAds(dt) {
    var i, ad;
    for (i = 0; i < state.hologramAds.length; i++) {
      ad = state.hologramAds[i];
      ad.userData.flickerTimer += dt;
      var flicker = 0.3 + 0.7 * Math.abs(Math.sin(ad.userData.flickerTimer * 3.7 + ad.userData.flickerPhase));
      ad.material.opacity = flicker;
      ad.material.transparent = true;
      // Random blink off
      if (Math.sin(ad.userData.flickerTimer * 11.3) > 0.95) {
        ad.visible = false;
      } else {
        ad.visible = true;
      }
    }
  }

  // ─── Neon Flicker ─────────────────────────────────────────────────────────
  function updateNeonFlicker(dt) {
    var i, nl, t;
    for (i = 0; i < state.neonLights.length; i++) {
      nl = state.neonLights[i];
      nl.timer += dt;
      t = nl.timer;
      nl.light.intensity = nl.baseIntensity * (0.7 + 0.3 * Math.sin(t * 4.2 + i));
    }
  }

  // ─── BlackBox Pickup ───────────────────────────────────────────────────────
  function updateBlackBox(dt) {
    if (state.blackBoxTaken) return;
    if (!state.blackBoxMesh) return;
    var d = dist3D(state.playerPos, state.blackBoxMesh.position);
    if (d < 1.2) {
      state.blackBoxTaken = true;
      state.blackBoxMesh.visible = false;
      if (state.blackBoxLight) state.blackBoxLight.intensity = 0;
      showMessage('BLACKBOX SECURED — REACH ROOFTOP ESCAPE PAD', 3000);
      increaseAwareness(20);
      updateHUD();
    }
  }

  // ─── Mission / Escape ──────────────────────────────────────────────────────
  function updateMission(dt) {
    if (state.missionComplete) return;
    if (!state.blackBoxTaken) return;
    if (!state.escapePad) return;
    var d = dist3D(state.playerPos, state.escapePad.position);
    if (d < 2.5 && state.floor >= 12) {
      state.missionComplete = true;
      showMessage('MISSION COMPLETE — BLACKBOX EXTRACTED!', 5000);
      updateHUD();
    }
  }

  // ─── Cheat Timer ──────────────────────────────────────────────────────────
  function updateCheat(dt) {
    if (!state.cheatActive) return;
    state.cheatTimer -= dt;
    if (state.cheatTimer <= 0) {
      state.cheatActive = false;
      state.cheatTimer = 0;
      showMessage('INFINITE HACK CHARGE EXPIRED', 1500);
      var cm = document.getElementById('cyberpunk-cheat-menu');
      if (cm && cm.parentNode) cm.parentNode.removeChild(cm);
    }
    updateHUD();
  }

  // ─── Init activation listener ──────────────────────────────────────────────
  setupActivationKeys();

  // ─── Public API ────────────────────────────────────────────────────────────
  window.CyberpunkCity = {
    activate: activate,
    deactivate: deactivate,
    getState: function () { return state; }
  };

}(window));
