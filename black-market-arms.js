window.BlackMarketArms = (function () {
  'use strict';

  // ── state ────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var keys = {};
  var mouseX = 0, mouseY = 0;
  var yaw = 0, pitch = 0;
  var playerPos = { x: 0, y: 1.7, z: 0 };
  var playerVelY = 0;
  var onGround = false;
  var active = false;
  var lastKeyTime = 0, lastKey = '';

  // game state
  var enemies = [];
  var caches = [];
  var cachesSeized = 0;
  var snipersDown = 0;
  var laptopObj = null;
  var laptopExtracted = false;
  var laptopTimer = 0;
  var brokerEscaping = false;
  var brokerEscapeTimer = 0;
  var missionFailed = false;
  var missionWon = false;
  var interactTimer = 0;
  var interactTarget = null;
  var hudEl = null;
  var overlayEl = null;
  var interactHintEl = null;
  var shootCooldown = 0;
  var playerHP = 100;
  var objects = []; // collidable geometry boxes
  var broker = null;
  var brokerState = 'office'; // office -> flee -> truck
  var brokerReinforcementsCalled = false;
  var reinforcementSpawned = false;
  var climbableContainers = [];
  var playerOnContainer = false;

  // ── activation key sequence ───────────────────────────────────────────────
  function handleKeyActivation(e) {
    var now = performance.now();
    if (e.key === 'b' || e.key === 'B') {
      lastKey = 'b';
      lastKeyTime = now;
    } else if ((e.key === 'm' || e.key === 'M') && lastKey === 'b' && now - lastKeyTime < 400) {
      lastKey = '';
      if (!active) { init(); }
    }
    if (active) { keys[e.key.toLowerCase()] = true; }
  }

  function handleKeyUp(e) {
    if (active) { keys[e.key.toLowerCase()] = false; }
  }

  function handleMouseMove(e) {
    if (!active) { return; }
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }

  function handleClick() {
    if (!active) { return; }
    if (document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock();
    } else {
      shoot();
    }
  }

  // ── math helpers ──────────────────────────────────────────────────────────
  function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function makeMat(color, opts) {
    var cfg = { color: color };
    if (opts) { for (var k in opts) { cfg[k] = opts[k]; } }
    return new THREE.MeshLambertMaterial(cfg);
  }

  function addBox(w, h, d, color, x, y, z, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color, opts);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  // ── environment ───────────────────────────────────────────────────────────
  function buildWarehouse() {
    // floor
    addBox(80, 0.2, 80, 0x888880, 0, -0.1, 0);

    // walls (N/S/E/W)
    addBox(80, 16, 0.4, 0x778899, 0, 8, -40); // north
    addBox(80, 16, 0.4, 0x778899, 0, 8, 40);  // south
    addBox(0.4, 16, 80, 0x778899, -40, 8, 0); // west
    addBox(0.4, 16, 80, 0x778899, 40, 8, 0);  // east

    // ceiling
    addBox(80, 0.4, 80, 0x556677, 0, 16, 0);

    // skylight grid (LineSegments)
    var skyGeo = new THREE.BufferGeometry();
    var skyVerts = [];
    for (var i = -20; i <= 20; i += 4) {
      skyVerts.push(i, 15.9, -20, i, 15.9, 20);
      skyVerts.push(-20, 15.9, i, 20, 15.9, i);
    }
    skyGeo.setAttribute('position', new THREE.Float32BufferAttribute(skyVerts, 3));
    var skyLines = new THREE.LineSegments(skyGeo, new THREE.LineBasicMaterial({ color: 0x99bbdd }));
    scene.add(skyLines);

    // pillars
    var pillarPositions = [[-15, 0], [15, 0], [-15, -20], [15, -20], [-15, 20], [15, 20]];
    for (var pi = 0; pi < pillarPositions.length; pi++) {
      var pp = pillarPositions[pi];
      addBox(1, 16, 1, 0x667788, pp[0], 8, pp[1]);
    }

    // lighting
    var ambient = new THREE.AmbientLight(0x334455, 0.7);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xaabbcc, 0.8);
    sun.position.set(10, 20, -10);
    scene.add(sun);
    var fill = new THREE.PointLight(0x445566, 0.5, 60);
    fill.position.set(0, 14, 0);
    scene.add(fill);
  }

  function buildDisplayTables() {
    // 3 rows of display tables
    var tablePositions = [
      [-10, 0, -10], [-10, 0, -5], [-10, 0, 0], [-10, 0, 5], [-10, 0, 10],
      [0, 0, -10],   [0, 0, -5],   [0, 0, 0],   [0, 0, 5],   [0, 0, 10],
      [10, 0, -10],  [10, 0, -5],  [10, 0, 0],  [10, 0, 5],  [10, 0, 10]
    ];

    for (var ti = 0; ti < tablePositions.length; ti++) {
      var tp = tablePositions[ti];
      var table = addBox(3, 0.15, 1.2, 0x5a4030, tp[0], 0.9, tp[2]);
      // table legs
      addBox(0.1, 0.9, 0.1, 0x3a2a1a, tp[0] - 1.3, 0.45, tp[2] - 0.5);
      addBox(0.1, 0.9, 0.1, 0x3a2a1a, tp[0] + 1.3, 0.45, tp[2] - 0.5);
      addBox(0.1, 0.9, 0.1, 0x3a2a1a, tp[0] - 1.3, 0.45, tp[2] + 0.5);
      addBox(0.1, 0.9, 0.1, 0x3a2a1a, tp[0] + 1.3, 0.45, tp[2] + 0.5);

      // weapon props on table (rifle shape: box + cylinder barrel)
      var gunBody = addBox(1.2, 0.15, 0.2, 0x222222, tp[0] - 0.2, 1.02, tp[2]);
      addCylinder(0.04, 0.04, 0.7, 6, 0x111111, tp[0] + 0.8, 1.02, tp[2]);
      // stock
      addBox(0.35, 0.2, 0.15, 0x3a2010, tp[0] - 0.8, 0.97, tp[2]);
    }
  }

  function buildShippingContainers() {
    // Container maze on east side
    var containerDefs = [
      // [x, z, stackH]  stackH: 1=one high, 2=two high
      [22, -25, 1], [22, -15, 2], [22, -5, 1], [22, 5, 2], [22, 15, 1],
      [28, -20, 2], [28, -10, 1], [28, 0, 2],  [28, 10, 2], [28, 20, 1],
      [34, -25, 1], [34, -15, 2], [34, 5, 1],  [34, 15, 2]
    ];

    for (var ci = 0; ci < containerDefs.length; ci++) {
      var cd = containerDefs[ci];
      var cx = cd[0], cz = cd[1], ch = cd[2];
      // container body
      var cont = addBox(6, 3, 2.5, 0x4a6a3a, cx, 1.5, cz);
      // container top markings
      addBox(5.8, 0.05, 2.3, 0x3a5a2a, cx, 3.02, cz);
      if (ch >= 2) {
        var cont2 = addBox(6, 3, 2.5, 0x3a5a6a, cx, 4.5, cz);
        addBox(5.8, 0.05, 2.3, 0x2a4a5a, cx, 6.02, cz);
      }
      // register as climbable
      climbableContainers.push({ x: cx, z: cz, topY: ch === 2 ? 6.1 : 3.1, halfW: 3, halfD: 1.25 });
    }
  }

  function buildForklift() {
    var fx = -25, fz = 5;
    // body
    addBox(2.5, 2, 3, 0xddaa00, fx, 1, fz);
    // cab
    addBox(2, 1.5, 1.5, 0xcc9900, fx - 0.1, 2.75, fz - 0.5);
    // mast
    addBox(0.3, 4, 0.3, 0x888888, fx + 1, 3, fz + 1.2);
    addBox(0.3, 4, 0.3, 0x888888, fx + 1, 3, fz - 1.2);
    // forks
    addBox(2, 0.1, 0.2, 0x666666, fx + 2.2, 1.4, fz + 0.6);
    addBox(2, 0.1, 0.2, 0x666666, fx + 2.2, 1.4, fz - 0.6);
    // wheels (4 cylinders)
    addCylinder(0.5, 0.5, 0.4, 8, 0x222222, fx - 0.9, 0.5, fz + 1.4);
    addCylinder(0.5, 0.5, 0.4, 8, 0x222222, fx + 0.9, 0.5, fz + 1.4);
    addCylinder(0.5, 0.5, 0.4, 8, 0x222222, fx - 0.9, 0.5, fz - 1.4);
    addCylinder(0.5, 0.5, 0.4, 8, 0x222222, fx + 0.9, 0.5, fz - 1.4);
  }

  function buildLoadingBay() {
    // south wall loading bay area
    // Rolling doors (slats — multiple thin BoxGeometry)
    for (var s = 0; s < 8; s++) {
      addBox(5, 0.35, 0.15, 0xaaaaaa, -15, 0.2 + s * 0.38, 39.8);
      addBox(5, 0.35, 0.15, 0xaaaaaa, 15, 0.2 + s * 0.38, 39.8);
    }
    // door frames
    addBox(0.2, 4, 0.4, 0x888888, -12.5, 2, 39.8);
    addBox(0.2, 4, 0.4, 0x888888, -17.5, 2, 39.8);
    addBox(0.2, 4, 0.4, 0x888888, 12.5, 2, 39.8);
    addBox(0.2, 4, 0.4, 0x888888, 17.5, 2, 39.8);

    // trucks outside (behind south wall, decorative)
    addBox(8, 3.5, 4, 0xcc4422, -15, 1.75, 44);   // truck 1
    addBox(7, 3, 4, 0x224466, 15, 1.5, 44);        // truck 2 (broker escape truck)
    // truck cabs
    addBox(2.5, 3.5, 4, 0xaa3311, -19.5, 1.75, 44);
    addBox(2.5, 3, 4, 0x1a3355, 11, 1.5, 44);
    // wheels
    addCylinder(0.7, 0.7, 0.4, 8, 0x222222, -18, 0.3, 42.2);
    addCylinder(0.7, 0.7, 0.4, 8, 0x222222, -12, 0.3, 42.2);
    addCylinder(0.7, 0.7, 0.4, 8, 0x222222, 12, 0.3, 42.2);
    addCylinder(0.7, 0.7, 0.4, 8, 0x222222, 18, 0.3, 42.2);
  }

  function buildMezzanine() {
    // Elevated security office platform on north side
    // Platform
    addBox(18, 0.4, 10, 0x556677, -5, 8, -32);
    // Pillars supporting it
    addBox(0.5, 8, 0.5, 0x445566, -13, 4, -27);
    addBox(0.5, 8, 0.5, 0x445566, 3, 4, -27);
    addBox(0.5, 8, 0.5, 0x445566, -13, 4, -37);
    addBox(0.5, 8, 0.5, 0x445566, 3, 4, -37);

    // Glass windows (flat transparent-ish boxes)
    addBox(6, 3, 0.1, 0x6699bb, -8, 9.7, -27.2, { transparent: true, opacity: 0.4 });
    addBox(6, 3, 0.1, 0x6699bb, -1, 9.7, -27.2, { transparent: true, opacity: 0.4 });

    // Walls of security office
    addBox(18, 4, 0.2, 0x445566, -5, 10, -37);   // back wall
    addBox(0.2, 4, 10, 0x445566, -14, 10, -32);  // left wall
    addBox(0.2, 4, 10, 0x445566, 4, 10, -32);    // right wall

    // stairs to mezzanine
    for (var st = 0; st < 8; st++) {
      addBox(2, 0.3, 1, 0x667788, 4, 1 + st, -26 - st);
    }

    // Laptop on desk (evidence)
    var desk = addBox(2, 0.6, 1, 0x5a4030, -5, 8.7, -34);
    laptopObj = addBox(0.6, 0.05, 0.5, 0x222233, -5, 8.98, -34);
    addBox(0.6, 0.4, 0.04, 0x333344, -5, 9.22, -34.27); // screen
  }

  function buildCacheRooms() {
    // 3 back rooms on north wall
    var rooms = [
      { x: -28, z: -34 },
      { x: -5, z: -34 },
      { x: 18, z: -34 }
    ];

    for (var ri = 0; ri < rooms.length; ri++) {
      var r = rooms[ri];
      // room walls
      addBox(12, 5, 0.3, 0x445533, r.x, 2.5, r.z - 5);
      addBox(0.3, 5, 10, 0x445533, r.x - 6, 2.5, r.z);
      addBox(0.3, 5, 10, 0x445533, r.x + 6, 2.5, r.z);
      // door opening (no top — just frame)
      addBox(0.5, 1, 0.3, 0x334422, r.x - 1.5, 0.5, r.z + 5);
      addBox(0.5, 1, 0.3, 0x334422, r.x + 1.5, 0.5, r.z + 5);
      addBox(3, 0.3, 0.3, 0x334422, r.x, 2.15, r.z + 5);

      // 5 weapon crates per room (but 2 are the seizable ones)
      for (var ci2 = 0; ci2 < 5; ci2++) {
        var cx2 = r.x - 4 + ci2 * 2;
        var crate = addBox(0.9, 0.9, 0.9, 0x7a6030, cx2, 0.45, r.z - 2);
        // crate detail lines
        addBox(0.92, 0.05, 0.05, 0x9a8050, cx2, 0.7, r.z - 2);
        addBox(0.05, 0.92, 0.05, 0x9a8050, cx2, 0.45, r.z - 2);

        // only the first 2 crates per room are seizure targets
        if (ci2 < 2) {
          caches.push({
            mesh: crate,
            pos: { x: cx2, y: 0.45, z: r.z - 2 },
            seized: false,
            room: ri
          });
        }
      }
    }
  }

  // ── enemy builders ────────────────────────────────────────────────────────
  function makeEnemy(x, y, z, color, hp, type) {
    var group = new THREE.Group();
    // body
    var bodyGeo = new THREE.BoxGeometry(0.6, 1, 0.4);
    var mat = makeMat(color);
    var body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.5;
    group.add(body);
    // head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var head = new THREE.Mesh(headGeo, makeMat(0xddaa88));
    head.position.y = 1.2;
    group.add(head);
    // arms
    addLimb(group, color, -0.45, 0.5, 0, 0.15, 0.7, 0.15);
    addLimb(group, color, 0.45, 0.5, 0, 0.15, 0.7, 0.15);
    // legs
    addLimb(group, 0x223355, -0.18, -0.1, 0, 0.18, 0.8, 0.18);
    addLimb(group, 0x223355, 0.18, -0.1, 0, 0.18, 0.8, 0.18);

    group.position.set(x, y, z);
    scene.add(group);

    var e = {
      group: group,
      pos: { x: x, y: y, z: z },
      hp: hp,
      maxHp: hp,
      type: type,
      dead: false,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolSpeed: type === 'sniper' ? 0 : 1.5 + Math.random(),
      alertTimer: 0,
      shootTimer: Math.random() * 2,
      fleeTimer: 0,
      patrolRadius: 4 + Math.random() * 6,
      patrolCenter: { x: x, z: z },
      reinforcement: false
    };
    enemies.push(e);
    return e;
  }

  function addLimb(group, color, lx, ly, lz, w, h, d) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, makeMat(color));
    mesh.position.set(lx, ly, lz);
    group.add(mesh);
  }

  function spawnEnemies() {
    // 13 guards/dealers on warehouse floor
    var guardPositions = [
      [-8, 0, -15], [8, 0, -15], [-5, 0, 5], [5, 0, 5],
      [-12, 0, 0], [12, 0, 0], [0, 0, -8], [0, 0, 15],
      [-20, 0, 10], [20, 0, 10], [-20, 0, -10], [20, 0, -10],
      [0, 0, 25]
    ];
    for (var gi = 0; gi < guardPositions.length; gi++) {
      var gp = guardPositions[gi];
      makeEnemy(gp[0], 1, gp[2], 0x443333, 80, 'guard');
    }

    // 5 snipers on elevated positions
    var sniperPositions = [
      [-5, 8.4, -30],   // mezzanine
      [-10, 8.4, -28],  // mezzanine
      [22, 6.2, -15],   // container top
      [28, 6.2, 0],     // container top
      [22, 3.2, 15]     // lower container
    ];
    for (var si = 0; si < sniperPositions.length; si++) {
      var sp = sniperPositions[si];
      makeEnemy(sp[0], sp[1], sp[2], 0x333322, 95, 'sniper');
    }

    // Boss: The Broker
    broker = makeEnemy(-5, 8.4, -34, 0x222211, 460, 'broker');
    broker.state = 'office';
    broker.shootTimer = 1;
  }

  // ── shooting ──────────────────────────────────────────────────────────────
  function shoot() {
    if (shootCooldown > 0 || missionFailed || missionWon) { return; }
    shootCooldown = 0.35;

    // raycast from camera
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var best = null, bestDist = 999;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) { continue; }
      var ep = v3(e.pos.x, e.pos.y + 0.6, e.pos.z);
      var cp = v3(playerPos.x, playerPos.y, playerPos.z);
      var toE = ep.clone().sub(cp);
      var d = toE.length();
      if (d < 0.5 || d > 60) { continue; }
      toE.normalize();
      var dot = dir.dot(toE);
      if (dot > 0.97 - 0.01 * Math.min(d, 20)) {
        if (d < bestDist) { bestDist = d; best = e; }
      }
    }

    if (best) {
      var dmg = 25 + Math.floor(Math.random() * 15);
      best.hp -= dmg;
      showDamageFlash();
      if (best.hp <= 0) {
        killEnemy(best);
      } else if (best === broker) {
        checkBrokerState();
      }
    }

    // muzzle flash in HUD
    flashMuzzle();
  }

  function killEnemy(e) {
    e.dead = true;
    e.group.rotation.z = Math.PI / 2;
    e.group.position.y -= 0.6;
    if (e.type === 'sniper') {
      snipersDown++;
      updateHUD();
    }
    if (e === broker) {
      brokerEscaping = false;
      checkWin();
    }
  }

  function checkBrokerState() {
    var pct = broker.hp / broker.maxHp;
    if (pct <= 0.7 && !brokerReinforcementsCalled) {
      brokerReinforcementsCalled = true;
      spawnReinforcements();
    }
    if (pct <= 0.3 && !brokerEscaping && broker.state !== 'fled') {
      brokerEscaping = true;
      brokerEscapeTimer = 20;
      broker.state = 'flee';
      showAlert('THE BROKER IS FLEEING! STOP HIM! 20s!');
    }
  }

  function spawnReinforcements() {
    if (reinforcementSpawned) { return; }
    reinforcementSpawned = true;
    showAlert('BROKER CALLED REINFORCEMENTS!');
    var positions = [[-3, 0, -20], [3, 0, -20], [-8, 0, -18], [8, 0, -18]];
    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var re = makeEnemy(p[0], 1, p[2], 0x553333, 60, 'guard');
      re.reinforcement = true;
    }
  }

  // ── player movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    var speed = 6;
    var dx = 0, dz = 0;

    if (keys['w'] || keys['arrowup'])    { dz -= 1; }
    if (keys['s'] || keys['arrowdown'])  { dz += 1; }
    if (keys['a'] || keys['arrowleft'])  { dx -= 1; }
    if (keys['d'] || keys['arrowright']) { dx += 1; }

    var sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    var mx = (dx * cosY + dz * sinY) * speed * dt;
    var mz = (-dx * sinY + dz * cosY) * speed * dt;

    playerPos.x += mx;
    playerPos.z += mz;

    // simple boundary
    playerPos.x = Math.max(-39, Math.min(39, playerPos.x));
    playerPos.z = Math.max(-39, Math.min(39, playerPos.z));

    // gravity / jumping
    if (keys[' '] && onGround) {
      playerVelY = 6;
      onGround = false;
    }
    playerVelY -= 18 * dt;
    playerPos.y += playerVelY * dt;

    // container climbing
    var onCont = false;
    for (var ci = 0; ci < climbableContainers.length; ci++) {
      var cc = climbableContainers[ci];
      if (Math.abs(playerPos.x - cc.x) < cc.halfW + 1.5 &&
          Math.abs(playerPos.z - cc.z) < cc.halfD + 1.5) {
        // adjacent — allow jump to mount
        if (playerPos.y < cc.topY && playerPos.y > cc.topY - 3.5) {
          if (Math.abs(playerPos.x - cc.x) < cc.halfW &&
              Math.abs(playerPos.z - cc.z) < cc.halfD) {
            if (playerPos.y < cc.topY) {
              playerPos.y = cc.topY;
              playerVelY = 0;
              onGround = true;
              onCont = true;
            }
          }
        }
      }
    }

    if (!onCont && playerPos.y <= 1.7) {
      playerPos.y = 1.7;
      playerVelY = 0;
      onGround = true;
    }

    camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  // ── enemy AI ──────────────────────────────────────────────────────────────
  function updateEnemies(dt) {
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead) { continue; }

      var distToPlayer = dist2(e.pos, playerPos);
      var canSee = distToPlayer < 25;

      if (e.type === 'guard') {
        updateGuard(e, dt, distToPlayer, canSee);
      } else if (e.type === 'sniper') {
        updateSniper(e, dt, distToPlayer, canSee);
      } else if (e.type === 'broker') {
        updateBroker(e, dt, distToPlayer, canSee);
      }

      e.group.position.set(e.pos.x, e.pos.y, e.pos.z);
      if (distToPlayer > 0.1) {
        var angle = Math.atan2(playerPos.x - e.pos.x, playerPos.z - e.pos.z);
        e.group.rotation.y = angle;
      }
    }
  }

  function updateGuard(e, dt, distToPlayer, canSee) {
    if (canSee) {
      // chase player
      var dx = playerPos.x - e.pos.x;
      var dz = playerPos.z - e.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 3) {
        e.pos.x += (dx / d) * e.patrolSpeed * dt;
        e.pos.z += (dz / d) * e.patrolSpeed * dt;
      }
      // shoot at player
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && distToPlayer < 18) {
        e.shootTimer = 1.5 + Math.random() * 2;
        damagePlayer(8 + Math.floor(Math.random() * 8));
      }
    } else {
      // patrol
      e.patrolAngle += dt * 0.4;
      e.pos.x = e.patrolCenter.x + Math.cos(e.patrolAngle) * e.patrolRadius;
      e.pos.z = e.patrolCenter.z + Math.sin(e.patrolAngle) * e.patrolRadius;
      e.pos.x = Math.max(-38, Math.min(38, e.pos.x));
      e.pos.z = Math.max(-38, Math.min(38, e.pos.z));
    }
  }

  function updateSniper(e, dt, distToPlayer, canSee) {
    // Snipers stay put, shoot from range
    if (canSee && distToPlayer < 40) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 2.5 + Math.random() * 2;
        damagePlayer(15 + Math.floor(Math.random() * 10));
      }
    }
  }

  function updateBroker(e, dt, distToPlayer, canSee) {
    if (e.state === 'flee' || brokerEscaping) {
      // flee to loading bay truck
      var target = { x: 15, z: 38 };
      var dx = target.x - e.pos.x;
      var dz = target.z - e.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 1) {
        e.pos.x += (dx / d) * 4 * dt;
        e.pos.z += (dz / d) * 4 * dt;
        e.pos.y = 1;
      } else {
        // reached truck — mission fail
        if (!missionFailed) {
          missionFailed = true;
          showOverlay('MISSION FAILED', 'The Broker escaped!', '#cc2200');
        }
      }
    } else {
      // in office — shoot and dodge
      if (canSee) {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = 1 + Math.random() * 1.5;
          damagePlayer(12 + Math.floor(Math.random() * 12));
        }
        // tactical strafe
        e.fleeTimer += dt;
        if (e.fleeTimer > 1) {
          e.fleeTimer = 0;
          e.pos.x += (Math.random() - 0.5) * 2;
          e.pos.z += (Math.random() - 0.5) * 2;
          e.pos.x = Math.max(-13, Math.min(3, e.pos.x));
          e.pos.z = Math.max(-37, Math.min(-27, e.pos.z));
        }
      }
    }
  }

  // ── player damage ─────────────────────────────────────────────────────────
  function damagePlayer(amt) {
    playerHP = Math.max(0, playerHP - amt);
    updateHUD();
    if (playerHP <= 0 && !missionFailed) {
      missionFailed = true;
      showOverlay('MISSION FAILED', 'You were eliminated.', '#cc2200');
    }
    // red flash
    var hud = document.getElementById('bma-hud');
    if (hud) {
      hud.style.background = 'rgba(200,0,0,0.3)';
      setTimeout(function () { if (hud) { hud.style.background = 'rgba(0,0,0,0.5)'; } }, 150);
    }
  }

  // ── interaction ───────────────────────────────────────────────────────────
  function updateInteraction(dt) {
    if (!keys['e']) {
      interactTimer = 0;
      interactTarget = null;
      if (interactHintEl) { interactHintEl.textContent = ''; }
      return;
    }

    // check cache proximity
    for (var i = 0; i < caches.length; i++) {
      var c = caches[i];
      if (c.seized) { continue; }
      if (dist3(playerPos, c.pos) < 2.5) {
        if (interactTarget !== c) { interactTarget = c; interactTimer = 0; }
        interactTimer += dt;
        if (interactHintEl) {
          interactHintEl.textContent = 'Seizing cache... ' + Math.min(100, Math.floor(interactTimer / 2 * 100)) + '%';
        }
        if (interactTimer >= 2) {
          c.seized = true;
          cachesSeized++;
          c.mesh.material.color.setHex(0x00ff44);
          interactTimer = 0;
          interactTarget = null;
          updateHUD();
          checkWin();
          if (interactHintEl) { interactHintEl.textContent = 'Cache seized!'; }
        }
        return;
      }
    }

    // check laptop
    if (laptopObj && !laptopExtracted && dist3(playerPos, { x: -5, y: 8.98, z: -34 }) < 3) {
      if (interactTarget !== laptopObj) { interactTarget = laptopObj; interactTimer = 0; }
      interactTimer += dt;
      if (interactHintEl) {
        interactHintEl.textContent = 'Extracting intel... ' + Math.min(100, Math.floor(interactTimer / 5 * 100)) + '%';
      }
      if (interactTimer >= 5) {
        laptopExtracted = true;
        laptopObj.material.color.setHex(0x00ffff);
        if (interactHintEl) { interactHintEl.textContent = 'Intel extracted! +BONUS'; }
        interactTimer = 0;
        interactTarget = null;
      }
      return;
    }

    if (interactHintEl) { interactHintEl.textContent = 'Nothing to interact with'; }
  }

  // ── escape timer ──────────────────────────────────────────────────────────
  function updateEscapeTimer(dt) {
    if (!brokerEscaping || broker.dead || missionFailed) { return; }
    brokerEscapeTimer -= dt;
    if (brokerEscapeTimer <= 0) {
      if (!missionFailed) {
        missionFailed = true;
        showOverlay('MISSION FAILED', 'The Broker escaped in the truck!', '#cc2200');
      }
    }
    updateHUD();
  }

  // ── win condition ─────────────────────────────────────────────────────────
  function checkWin() {
    if (missionFailed || missionWon) { return; }
    if (cachesSeized >= 6 && broker && broker.dead) {
      missionWon = true;
      showOverlay('MISSION COMPLETE', 'Arms market busted! Broker arrested!\n' + (laptopExtracted ? '+INTEL BONUS' : ''), '#00cc44');
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  function buildHUD() {
    // Main HUD container
    hudEl = document.createElement('div');
    hudEl.id = 'bma-hud';
    hudEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'pointer-events:none', 'font-family:monospace', 'color:#eee',
      'background:rgba(0,0,0,0.5)', 'z-index:1000'
    ].join(';');
    document.body.appendChild(hudEl);

    // crosshair
    var ch = document.createElement('div');
    ch.style.cssText = [
      'position:absolute', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px', 'height:20px',
      'border:2px solid rgba(255,255,255,0.8)',
      'border-radius:50%'
    ].join(';');
    hudEl.appendChild(ch);

    // stats panel (top-left)
    var stats = document.createElement('div');
    stats.id = 'bma-stats';
    stats.style.cssText = 'position:absolute;top:16px;left:16px;font-size:15px;line-height:1.7;text-shadow:1px 1px 3px #000;';
    hudEl.appendChild(stats);

    // interact hint (center bottom)
    interactHintEl = document.createElement('div');
    interactHintEl.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);font-size:14px;color:#ffee88;text-shadow:1px 1px 3px #000;';
    hudEl.appendChild(interactHintEl);

    // hp bar (bottom center)
    var hpWrap = document.createElement('div');
    hpWrap.style.cssText = 'position:absolute;bottom:30px;left:50%;transform:translateX(-50%);width:200px;';
    var hpLabel = document.createElement('div');
    hpLabel.style.cssText = 'text-align:center;font-size:12px;margin-bottom:3px;';
    hpLabel.textContent = 'HEALTH';
    var hpBar = document.createElement('div');
    hpBar.id = 'bma-hpbar';
    hpBar.style.cssText = 'height:12px;background:#cc2200;width:100%;border:1px solid #fff;';
    hpWrap.appendChild(hpLabel);
    hpWrap.appendChild(hpBar);
    hudEl.appendChild(hpWrap);

    // alert
    var alert = document.createElement('div');
    alert.id = 'bma-alert';
    alert.style.cssText = 'position:absolute;top:40%;left:50%;transform:translateX(-50%);font-size:20px;color:#ff4400;font-weight:bold;text-shadow:2px 2px 4px #000;text-align:center;';
    hudEl.appendChild(alert);

    updateHUD();
  }

  function updateHUD() {
    var stats = document.getElementById('bma-stats');
    if (!stats) { return; }
    var brokerHPPct = broker ? Math.max(0, Math.round(broker.hp / broker.maxHp * 100)) : 0;
    var brokerHPStr = broker && !broker.dead ? brokerHPPct + '%' : 'ELIMINATED';
    var lines = [
      'OPERATION: BLACK MARKET ARMS',
      '─────────────────────────────',
      'Caches Seized: ' + cachesSeized + '/6',
      'Snipers Down:  ' + snipersDown + '/5',
      'Broker HP:     ' + brokerHPStr,
      'Player HP:     ' + playerHP + '/100',
    ];
    if (brokerEscaping && !broker.dead) {
      lines.push('ESCAPE TIMER: ' + Math.ceil(brokerEscapeTimer) + 's');
    }
    if (laptopExtracted) { lines.push('Intel extracted'); }
    stats.innerHTML = lines.join('<br>');

    var hpBar = document.getElementById('bma-hpbar');
    if (hpBar) { hpBar.style.width = playerHP + '%'; }
  }

  function showAlert(msg) {
    var a = document.getElementById('bma-alert');
    if (!a) { return; }
    a.textContent = msg;
    setTimeout(function () { if (a) { a.textContent = ''; } }, 3500);
  }

  function showDamageFlash() {
    var a = document.getElementById('bma-alert');
    if (!a) { return; }
    a.style.color = '#ff0000';
  }

  function flashMuzzle() {
    // brief muzzle flash indicator
    var a = document.getElementById('bma-alert');
    if (!a) { return; }
    a.style.color = '#ffcc00';
    setTimeout(function () { if (a) { a.style.color = '#ff4400'; } }, 80);
  }

  function showOverlay(title, body, color) {
    overlayEl = document.createElement('div');
    overlayEl.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.8)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'z-index:2000', 'font-family:monospace', 'color:' + color,
      'text-align:center'
    ].join(';');
    var h = document.createElement('div');
    h.style.cssText = 'font-size:36px;font-weight:bold;margin-bottom:16px;text-shadow:2px 2px 6px #000;';
    h.textContent = title;
    var p = document.createElement('div');
    p.style.cssText = 'font-size:18px;color:#fff;white-space:pre-line;';
    p.textContent = body;
    var btn = document.createElement('button');
    btn.textContent = 'PLAY AGAIN';
    btn.style.cssText = 'margin-top:30px;padding:12px 30px;font-size:16px;font-family:monospace;cursor:pointer;background:#333;color:#eee;border:1px solid #aaa;';
    btn.addEventListener('click', function () {
      if (overlayEl) { document.body.removeChild(overlayEl); overlayEl = null; }
      reset();
      init();
    });
    overlayEl.appendChild(h);
    overlayEl.appendChild(p);
    overlayEl.appendChild(btn);
    document.body.appendChild(overlayEl);
    if (document.exitPointerLock) { document.exitPointerLock(); }
  }

  // ── core loop ─────────────────────────────────────────────────────────────
  function update() {
    if (!active) { return; }
    var dt = Math.min(clock.getDelta(), 0.05);

    if (!missionFailed && !missionWon) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateInteraction(dt);
      updateEscapeTimer(dt);
      if (shootCooldown > 0) { shootCooldown -= dt; }
    }

    renderer.render(scene, camera);
  }

  // ── init ──────────────────────────────────────────────────────────────────
  function init() {
    reset();
    active = true;

    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.Fog(0x111122, 30, 80);

    // camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.id = 'bma-canvas';
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // build world
    buildWarehouse();
    buildDisplayTables();
    buildShippingContainers();
    buildForklift();
    buildLoadingBay();
    buildMezzanine();
    buildCacheRooms();
    spawnEnemies();
    buildHUD();

    // player start
    playerPos.x = 0;
    playerPos.y = 1.7;
    playerPos.z = 30;
    playerHP = 100;
    yaw = Math.PI; // face north

    // resize
    window.addEventListener('resize', onResize);

    // request pointer lock on canvas click
    renderer.domElement.addEventListener('click', handleClick);

    showAlert('OPERATION: BLACK MARKET ARMS — Seize 6 weapon caches and arrest The Broker!');
  }

  function onResize() {
    if (!renderer || !camera) { return; }
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    active = false;
    enemies = [];
    caches = [];
    cachesSeized = 0;
    snipersDown = 0;
    laptopObj = null;
    laptopExtracted = false;
    laptopTimer = 0;
    brokerEscaping = false;
    brokerEscapeTimer = 0;
    missionFailed = false;
    missionWon = false;
    interactTimer = 0;
    interactTarget = null;
    shootCooldown = 0;
    playerHP = 100;
    broker = null;
    brokerState = 'office';
    brokerReinforcementsCalled = false;
    reinforcementSpawned = false;
    climbableContainers = [];
    playerOnContainer = false;
    playerVelY = 0;
    onGround = false;
    keys = {};

    // remove canvas
    var old = document.getElementById('bma-canvas');
    if (old && old.parentNode) { old.parentNode.removeChild(old); }
    // remove HUD
    var oldHud = document.getElementById('bma-hud');
    if (oldHud && oldHud.parentNode) { oldHud.parentNode.removeChild(oldHud); }

    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    scene = null;
    camera = null;
    clock = null;
    interactHintEl = null;
    hudEl = null;
  }

  // ── event listeners (attached once) ──────────────────────────────────────
  window.addEventListener('keydown', handleKeyActivation);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('mousemove', handleMouseMove);

  return { init: init, update: update, reset: reset };
}());
