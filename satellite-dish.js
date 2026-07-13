window.SatelliteDish = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera;
  var active = false;
  var keyState = {};
  var lastSPress = -9999;
  var yaw = 0, pitch = 0;
  var playerVelocity = { x: 0, y: 0, z: 0 };
  var playerOnGround = true;
  var container, hudEl, notifEl;

  var sceneObjects = [];
  var dishes = [];
  var enemies = [];
  var projectiles = [];
  var serverRacks = [];
  var serverRacksActivated = 0;
  var lastActivatedRack = -1;
  var signalStrength = 0;
  var uplinkRestored = false;
  var gameWon = false, gameLost = false;
  var playerHP = 100;
  var score = 0;
  var fogInterferenceTimer = 0;
  var fogInterferenceActive = false;
  var notifTimer = 0;
  var raycaster;
  var interactCooldown = 0;

  // ── keybind tracking ───────────────────────────────────────────────────────
  function handleKeyDown(e) {
    keyState[e.code] = true;
    if (e.code === 'KeyS') {
      var now = performance.now();
      lastSPress = now;
    }
    if (e.code === 'KeyD') {
      var nowD = performance.now();
      if (nowD - lastSPress < 400) {
        if (!active) {
          activate();
        } else {
          deactivate();
        }
      }
    }
    if (!active) return;
    if (e.code === 'Space' && playerOnGround) {
      playerVelocity.y = 8;
      playerOnGround = false;
    }
    if (e.code === 'KeyE') {
      tryInteract();
    }
  }

  function handleKeyUp(e) {
    keyState[e.code] = false;
  }

  function handleMouseMove(e) {
    if (!active) return;
    yaw -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch = Math.max(-1.2, Math.min(1.2, pitch));
  }

  function handleClick(e) {
    if (!active) return;
    if (document.pointerLockElement !== container) {
      container.requestPointerLock();
      return;
    }
    shoot();
  }

  // ── init ───────────────────────────────────────────────────────────────────
  function init(sc, cam) {
    scene = sc;
    camera = cam;
    container = document.body;
    raycaster = new THREE.Raycaster();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);

    buildHUD();
    showNotif('Press S then D (within 400ms) to enter Satellite Dish Array');
  }

  function activate() {
    active = true;
    reset();
    buildWorld();
    camera.position.set(0, 1.7, 5);
    yaw = Math.PI;
    pitch = 0;
    container.requestPointerLock();
    showNotif('UPLINK STATUS: JAMMED — Restore the uplink!');
  }

  function deactivate() {
    showNotif('Satellite Dish Array — module toggled OFF');
    active = false;
    if (hudEl) hudEl.style.display = 'none';
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'satdish-hud';
    hudEl.style.cssText = 'position:fixed;top:10px;left:10px;color:#0ff;font:13px monospace;pointer-events:none;display:none;text-shadow:1px 1px 3px #000;z-index:999;line-height:1.6;';
    document.body.appendChild(hudEl);

    notifEl = document.createElement('div');
    notifEl.id = 'satdish-notif';
    notifEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#0ff;font:bold 18px monospace;pointer-events:none;display:none;text-shadow:0 0 12px #0ff;z-index:1000;text-align:center;';
    document.body.appendChild(notifEl);
  }

  function showNotif(msg) {
    if (!notifEl) return;
    notifEl.innerHTML = msg;
    notifEl.style.display = 'block';
    notifTimer = 3.0;
  }

  function updateHUD(dt) {
    if (!hudEl) return;
    if (!active) { hudEl.style.display = 'none'; return; }
    hudEl.style.display = 'block';

    notifTimer -= dt;
    if (notifTimer <= 0 && notifEl) {
      notifEl.style.display = 'none';
    }

    var uplinkStr = uplinkRestored
      ? '<span style="color:#0f0">UPLINK STATUS: RESTORED</span>'
      : '<span style="color:#f40">UPLINK STATUS: JAMMED</span>';

    var barWidth = Math.floor(signalStrength);
    var bar = '';
    var bi;
    for (bi = 0; bi < 20; bi++) {
      if (bi < Math.floor(barWidth / 5)) {
        bar += '<span style="color:#0f0">|</span>';
      } else {
        bar += '<span style="color:#333">|</span>';
      }
    }

    var racksStr = serverRacksActivated + '/3 server racks activated';
    var enemyCount = 0;
    var ei;
    for (ei = 0; ei < enemies.length; ei++) {
      if (enemies[ei].hp > 0) enemyCount++;
    }

    hudEl.innerHTML = [
      uplinkStr,
      'Signal Strength: [' + bar + '] ' + signalStrength + '%',
      racksStr,
      'HP: ' + playerHP + '   Score: ' + score,
      'Enemies: ' + enemyCount,
      fogInterferenceActive ? '<span style="color:#f80">&#9889; SIGNAL INTERFERENCE &#9889;</span>' : '',
      '<span style="color:#888">[E] Interact  [Click] Shoot  [S+D] Toggle</span>'
    ].filter(Boolean).join('<br>');
  }

  // ── scene helpers ──────────────────────────────────────────────────────────
  function mat(color, opts) {
    var o = opts || {};
    return new THREE.MeshLambertMaterial({
      color: color,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      wireframe: o.wire || false
    });
  }

  function matBasic(color) {
    return new THREE.MeshBasicMaterial({ color: color });
  }

  function addObj(mesh) {
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function box(w, h, d, color, opts) {
    var g = new THREE.BoxGeometry(w, h, d);
    var m = new THREE.Mesh(g, mat(color, opts));
    return addObj(m);
  }

  function cyl(rt, rb, h, segs, color) {
    var g = new THREE.CylinderGeometry(rt, rb, h, segs);
    var m = new THREE.Mesh(g, mat(color));
    return addObj(m);
  }

  function sph(r, segs, color) {
    var g = new THREE.SphereGeometry(r, segs, segs);
    var m = new THREE.Mesh(g, mat(color));
    return addObj(m);
  }

  function addLight(x, y, z, color, intensity, dist) {
    var l = new THREE.PointLight(color, intensity, dist);
    l.position.set(x, y, z);
    scene.add(l);
    sceneObjects.push(l);
    return l;
  }

  function lineSegs(points, color) {
    var pts = [];
    var i;
    for (i = 0; i < points.length; i++) {
      pts.push(points[i][0], points[i][1], points[i][2]);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    var ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color }));
    return addObj(ls);
  }

  // ── world building ─────────────────────────────────────────────────────────
  function buildWorld() {
    scene.background = new THREE.Color(0x0a0f1a);
    scene.fog = new THREE.Fog(0x0a0f1a, 20, 180);

    var ambient = new THREE.AmbientLight(0x223344, 0.8);
    scene.add(ambient);
    sceneObjects.push(ambient);

    var sun = new THREE.DirectionalLight(0x8899aa, 0.6);
    sun.position.set(30, 60, 20);
    scene.add(sun);
    sceneObjects.push(sun);

    // Ground — hilltop
    var ground = box(300, 1, 300, 0x2a3520);
    ground.position.set(0, -0.5, 0);

    // Hilltop mound shape (raised center ring)
    var mound = cyl(40, 60, 6, 16, 0x2d3a22);
    mound.position.set(0, -2, 0);

    buildControlBuilding();
    buildDishArray();
    buildAntennaMasts();
    buildPowerGenerator();
    buildPerimeterFence();
    buildServerRacks();
    spawnEnemies();

    addLight(0, 8, 0, 0x4488cc, 1.2, 80);
    addLight(-30, 6, -20, 0x334455, 0.8, 60);
    addLight(30, 6, 20, 0x334455, 0.8, 60);
  }

  // ── Control Building ───────────────────────────────────────────────────────
  function buildControlBuilding() {
    // Main building body
    var body = box(18, 5, 12, 0x445566);
    body.position.set(0, 2.5, 0);

    // Roof
    var roof = box(19, 0.6, 13, 0x334455);
    roof.position.set(0, 5.3, 0);

    // Front wall with door gap implied by offset panels
    var fw1 = box(6, 5, 0.4, 0x3a4a55);
    fw1.position.set(-4.5, 2.5, 6);
    var fw2 = box(6, 5, 0.4, 0x3a4a55);
    fw2.position.set(4.5, 2.5, 6);
    var fwtop = box(4, 1.5, 0.4, 0x3a4a55);
    fwtop.position.set(0, 4.75, 6);

    // Windows (slightly recessed box panels)
    var win1 = box(2, 1.2, 0.1, 0x99ccff);
    win1.position.set(-7, 3.2, 6.05);
    var win2 = box(2, 1.2, 0.1, 0x99ccff);
    win2.position.set(7, 3.2, 6.05);

    // Satellite uplink terminal on roof
    var terminal = box(2, 1.2, 1.2, 0x223344);
    terminal.position.set(0, 6.1, 0);
    var antBase = cyl(0.15, 0.2, 1.5, 8, 0x556677);
    antBase.position.set(0, 7.05, 0);
    var antDish = cyl(0.8, 0.05, 0.6, 12, 0x7799aa);
    antDish.position.set(0, 7.9, 0);
    antDish.rotation.x = Math.PI / 4;
  }

  // ── Satellite Dish Array ───────────────────────────────────────────────────
  function buildDishArray() {
    var dishConfigs = [
      { x: -25, z: -15, rot: 0.3 },
      { x:  25, z: -15, rot: -0.4 },
      { x: -30, z:  15, rot: 0.7 },
      { x:  30, z:  15, rot: -0.2 }
    ];
    var i;
    for (i = 0; i < dishConfigs.length; i++) {
      buildSingleDish(dishConfigs[i].x, 0, dishConfigs[i].z, dishConfigs[i].rot);
    }
  }

  function buildSingleDish(x, y, z, initRot) {
    // Pole mount
    var pole = cyl(0.25, 0.35, 6, 8, 0x556677);
    pole.position.set(x, y + 3, z);

    // Horizontal cross arm
    var arm = box(3, 0.25, 0.25, 0x445566);
    arm.position.set(x, y + 6.1, z);

    // Bowl (dish) — use a CylinderGeometry with open top as bowl shape
    var bowl = cyl(3.5, 0.3, 1.2, 16, 0x8899aa);
    bowl.position.set(x, y + 7.2, z);
    bowl.rotation.x = Math.PI / 6;
    bowl.rotation.y = initRot;
    // Store reference for rotation
    dishes.push(bowl);

    // Feed horn at center of dish
    var feedArm = box(0.1, 0.1, 2.5, 0x667788);
    feedArm.position.set(x, y + 7.8, z);
    var feedHorn = cyl(0.18, 0.08, 0.4, 8, 0x99aacc);
    feedHorn.position.set(x, y + 7.8, z + 1.25);

    // Base foundation
    var base = box(2, 0.4, 2, 0x334444);
    base.position.set(x, y + 0.2, z);

    // Small blinking light on tip
    var blink = sph(0.12, 6, 0xff2200);
    blink.position.set(x, y + 7.85, z + 1.45);
    blink.userData.blinkMesh = true;

    addLight(x, y + 5, z, 0x224466, 0.5, 25);
  }

  // ── Antenna Masts ──────────────────────────────────────────────────────────
  function buildAntennaMasts() {
    buildSingleMast(-18, 0, -30);
    buildSingleMast( 18, 0, -30);
    buildSingleMast(  0, 0,  35);
  }

  function buildSingleMast(x, y, z) {
    // Tall mast — thin cylinder
    var mast = cyl(0.12, 0.18, 22, 6, 0x556677);
    mast.position.set(x, y + 11, z);

    // Cross-bars
    var bar1 = box(3, 0.12, 0.12, 0x445566);
    bar1.position.set(x, y + 18, z);
    var bar2 = box(2.2, 0.12, 0.12, 0x445566);
    bar2.position.set(x, y + 14, z);

    // Guy wires (LineSegments from mast top to ground anchors)
    var mastTopY = y + 22;
    var guySrc = [x, mastTopY, z];
    var anchorDist = 12;
    var anchors = [
      [x + anchorDist, y, z],
      [x - anchorDist, y, z],
      [x, y, z + anchorDist],
      [x, y, z - anchorDist]
    ];
    var i;
    for (i = 0; i < anchors.length; i++) {
      lineSegs([guySrc, anchors[i]], 0x556677);
    }

    // Red warning light at top
    var warn = sph(0.2, 6, 0xff1100);
    warn.position.set(x, y + 22.2, z);
    warn.userData.blinkMesh = true;

    addLight(x, y + 20, z, 0xff1100, 0.3, 15);
  }

  // ── Power Generator ────────────────────────────────────────────────────────
  function buildPowerGenerator() {
    // Generator housing
    var gen = box(5, 3, 3, 0x334433);
    gen.position.set(12, 1.5, -10);

    // Exhaust stack
    var stack = cyl(0.3, 0.35, 3, 8, 0x222222);
    stack.position.set(13.5, 4.5, -10);

    // Control panel on side
    var panel = box(1.5, 1, 0.12, 0x445544);
    panel.position.set(12, 2, -8.44);
    var panelScreen = box(0.8, 0.5, 0.05, 0x00aa44);
    panelScreen.position.set(12, 2.1, -8.37);

    // Fuel tank
    var tank = cyl(0.8, 0.9, 2.5, 10, 0x556655);
    tank.position.set(15, 1.25, -10);

    // Connecting pipe
    var pipe = box(2.5, 0.2, 0.2, 0x444433);
    pipe.position.set(13.75, 1.5, -10);

    addLight(12, 4, -10, 0x44ff44, 0.4, 20);
  }

  // ── Perimeter Fence ────────────────────────────────────────────────────────
  function buildPerimeterFence() {
    var fenceRadius = 55;
    var postCount = 40;
    var i;
    var pts = [];
    var prev = null;

    for (i = 0; i <= postCount; i++) {
      var angle = (i / postCount) * Math.PI * 2;
      var fx = Math.cos(angle) * fenceRadius;
      var fz = Math.sin(angle) * fenceRadius;

      // Fence post
      var post = cyl(0.12, 0.12, 3, 5, 0x889988);
      post.position.set(fx, 1.5, fz);

      if (prev) {
        // Top wire
        pts.push([prev.x, 3, prev.z]);
        pts.push([fx, 3, fz]);
        // Middle wire
        pts.push([prev.x, 2, prev.z]);
        pts.push([fx, 2, fz]);
        // Bottom wire
        pts.push([prev.x, 1, prev.z]);
        pts.push([fx, 1, fz]);
      }
      prev = { x: fx, z: fz };
    }

    // Barbed wire (LineSegments for full fence perimeter)
    var j;
    for (j = 0; j < pts.length; j += 2) {
      lineSegs([pts[j], pts[j + 1]], 0x667766);
    }

    // Gate posts (gap in fence at south)
    var gatePost1 = cyl(0.2, 0.2, 4, 6, 0x99aaaa);
    gatePost1.position.set(-3, 2, fenceRadius);
    var gatePost2 = cyl(0.2, 0.2, 4, 6, 0x99aaaa);
    gatePost2.position.set(3, 2, fenceRadius);
    // Gate bar
    var gateBar = box(6, 0.2, 0.15, 0x99aaaa);
    gateBar.position.set(0, 3.5, fenceRadius);
  }

  // ── Server Racks ───────────────────────────────────────────────────────────
  function buildServerRacks() {
    // Inside the control building — 3 server rack towers
    var rackPositions = [
      { x: -5, z: -3 },
      { x:  0, z: -3 },
      { x:  5, z: -3 }
    ];
    var i;
    for (i = 0; i < rackPositions.length; i++) {
      buildSingleRack(rackPositions[i].x, 0, rackPositions[i].z, i);
    }
  }

  function buildSingleRack(x, y, z, idx) {
    var rackBody = box(1.2, 4, 0.9, 0x223344);
    rackBody.position.set(x, y + 2, z);

    // Panel rows on front
    var ri;
    for (ri = 0; ri < 6; ri++) {
      var row = box(0.9, 0.3, 0.05, 0x112233);
      row.position.set(x, y + 0.7 + ri * 0.5, z - 0.47);
      var led = box(0.1, 0.1, 0.05, (ri % 2 === 0) ? 0x00ff44 : 0xff4400);
      led.position.set(x + 0.35, y + 0.7 + ri * 0.5, z - 0.47);
    }

    // Status indicator on top
    var indicator = sph(0.18, 6, 0xff4400);
    indicator.position.set(x, y + 4.22, z);
    indicator.userData.rackIndicator = true;

    serverRacks.push({
      mesh: rackBody,
      indicator: indicator,
      idx: idx,
      activated: false,
      pos: new THREE.Vector3(x, y + 2, z)
    });
  }

  // ── Enemy spawning ──────────────────────────────────────────────────────────
  function spawnEnemies() {
    var techPositions = [
      { x: -20, z: 10 }, { x: 20, z: 10 },
      { x: 0, z: -25 },  { x: -15, z: -20 },
      { x: 15, z: -20 }
    ];
    var guardPositions = [
      { x: -40, z: 0 }, { x: 40, z: 0 },
      { x: 0, z: 40 }, { x: -30, z: -30 },
      { x: 30, z: -30 }, { x: 0, z: -45 }
    ];
    var i;
    for (i = 0; i < techPositions.length; i++) {
      spawnTechnician(techPositions[i].x, 0, techPositions[i].z);
    }
    for (i = 0; i < guardPositions.length; i++) {
      spawnGuard(guardPositions[i].x, 0, guardPositions[i].z);
    }
  }

  function spawnTechnician(x, y, z) {
    // Civilian clothes — tan/grey outfit
    var torso = box(0.55, 0.85, 0.38, 0xc8a870);
    torso.position.set(x, y + 1.15, z);
    var head = box(0.42, 0.42, 0.42, 0xe8c890);
    head.position.set(0, 0.63, 0);
    torso.add(head);
    // Hard hat
    var hat = cyl(0.26, 0.28, 0.18, 8, 0xffee00);
    hat.position.set(0, 0.89, 0);
    torso.add(hat);
    // Laptop / tablet held in front
    var laptop = box(0.3, 0.22, 0.04, 0x334455);
    laptop.position.set(0, 0, 0.22);
    torso.add(laptop);

    var en = {
      mesh: torso, head: head,
      hp: 50, maxHp: 50,
      type: 'technician',
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      patrolOrigin: new THREE.Vector3(x, y + 1.15, z),
      attackCooldown: 0,
      shootCooldown: 3 + Math.random() * 2,
      pos: new THREE.Vector3(x, y + 1.15, z),
      alerted: false
    };
    enemies.push(en);
    return en;
  }

  function spawnGuard(x, y, z) {
    // Mercenary guard — dark tactical gear
    var torso = box(0.65, 1.0, 0.45, 0x1a2210);
    torso.position.set(x, y + 1.2, z);
    var head = box(0.48, 0.48, 0.48, 0x2a3318);
    head.position.set(0, 0.74, 0);
    torso.add(head);
    // Helmet
    var helm = cyl(0.3, 0.28, 0.28, 8, 0x111a08);
    helm.position.set(0, 0.98, 0);
    torso.add(helm);
    // Body armor
    var armor = box(0.7, 0.5, 0.5, 0x0d1a08);
    armor.position.set(0, 0.18, 0);
    torso.add(armor);

    var en = {
      mesh: torso, head: head,
      hp: 100, maxHp: 100,
      type: 'guard',
      state: 'patrol',
      patrolAngle: Math.random() * Math.PI * 2,
      patrolOrigin: new THREE.Vector3(x, y + 1.2, z),
      attackCooldown: 0,
      shootCooldown: 2.5 + Math.random() * 1.5,
      pos: new THREE.Vector3(x, y + 1.2, z),
      alerted: false
    };
    enemies.push(en);
    return en;
  }

  // ── shooting ────────────────────────────────────────────────────────────────
  function shoot() {
    if (!active) return;
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);

    var meshList = [];
    var i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) meshList.push(enemies[i].mesh);
    }
    var hits = raycaster.intersectObjects(meshList, true);
    if (hits.length > 0) {
      var hitMesh = hits[0].object;
      var ei;
      for (ei = 0; ei < enemies.length; ei++) {
        var en = enemies[ei];
        if (en.hp <= 0) continue;
        if (en.mesh === hitMesh || en.mesh.getObjectById(hitMesh.id)) {
          var dmg = (en.type === 'guard') ? 25 : 35;
          en.hp -= dmg;
          en.alerted = true;
          en.state = 'chase';
          if (en.hp <= 0) killEnemy(en);
          break;
        }
      }
    }

    // Spawn muzzle flash projectile tracer
    var tracer = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xffee88 })
    );
    tracer.position.copy(camera.position).addScaledVector(dir, 1.5);
    tracer.lookAt(camera.position.clone().addScaledVector(dir, 10));
    scene.add(tracer);
    sceneObjects.push(tracer);
    projectiles.push({ mesh: tracer, velocity: dir.clone().multiplyScalar(30), life: 0.15, fromEnemy: false });
  }

  function killEnemy(en) {
    en.hp = 0;
    en.mesh.visible = false;
    score += (en.type === 'guard') ? 200 : 100;
  }

  // ── server rack interaction ─────────────────────────────────────────────────
  function tryInteract() {
    if (interactCooldown > 0) return;
    if (uplinkRestored) return;

    var i;
    for (i = 0; i < serverRacks.length; i++) {
      var rack = serverRacks[i];
      if (rack.activated) continue;
      var dist = camera.position.distanceTo(rack.pos);
      if (dist < 4.5) {
        // Check consecutive order
        if (rack.idx !== lastActivatedRack + 1) {
          showNotif('WARNING: Must activate server racks in sequence (1 → 2 → 3)!');
          interactCooldown = 1.5;
          return;
        }
        rack.activated = true;
        lastActivatedRack = rack.idx;
        serverRacksActivated++;
        // Update indicator to green
        if (rack.indicator) {
          rack.indicator.material = new THREE.MeshBasicMaterial({ color: 0x00ff44 });
        }
        signalStrength = Math.floor((serverRacksActivated / 3) * 100);
        interactCooldown = 0.8;

        if (serverRacksActivated >= 3) {
          uplinkRestored = true;
          signalStrength = 100;
          gameWon = true;
          score += 3000;
          showNotif('UPLINK RESTORED! Communications re-established!');
          setTimeout(function () {
            showEndScreen('Uplink restored. Military forces re-engaged. Mission complete.', true);
          }, 2500);
        } else {
          showNotif('Server rack ' + serverRacksActivated + '/3 activated — Signal at ' + signalStrength + '%');
        }
        return;
      }
    }
    showNotif('No server rack in range. [E] to interact when close.');
    interactCooldown = 1.0;
  }

  // ── update ──────────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;
    var dt = delta || 0.016;
    dt = Math.min(dt, 0.05);

    updatePlayer(dt);
    updateDishes(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateFogInterference(dt);
    updateHUD(dt);

    if (interactCooldown > 0) interactCooldown -= dt;
  }

  function updatePlayer(dt) {
    var speed = 8;
    var forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    var move = new THREE.Vector3();

    if (keyState['KeyW'] || keyState['ArrowUp'])    move.addScaledVector(forward, speed);
    if (keyState['KeyA'] || keyState['ArrowLeft'])  move.addScaledVector(right, -speed);
    if (keyState['KeyD'] || keyState['ArrowRight']) move.addScaledVector(right, speed);
    // Note: 'S' key is used for toggle detection, but if not in toggle sequence still moves
    if (keyState['ArrowDown']) move.addScaledVector(forward, -speed);

    playerVelocity.x = move.x;
    playerVelocity.z = move.z;
    playerVelocity.y -= 22 * dt;

    var newPos = camera.position.clone();
    newPos.x += playerVelocity.x * dt;
    newPos.y += playerVelocity.y * dt;
    newPos.z += playerVelocity.z * dt;

    if (newPos.y < 1.7) {
      newPos.y = 1.7;
      playerVelocity.y = 0;
      playerOnGround = true;
    }

    camera.position.copy(newPos);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  function updateDishes(dt) {
    var i;
    for (i = 0; i < dishes.length; i++) {
      dishes[i].rotation.y += dt * 0.3;
    }
  }

  // ── fog interference (jamming visual) ─────────────────────────────────────
  var fogPhase = 0;
  function updateFogInterference(dt) {
    fogPhase += dt;
    fogInterferenceTimer -= dt;

    if (fogInterferenceTimer <= 0) {
      fogInterferenceActive = !fogInterferenceActive;
      if (fogInterferenceActive) {
        fogInterferenceTimer = 0.08 + Math.random() * 0.18;
      } else {
        fogInterferenceTimer = 1.5 + Math.random() * 3.5;
      }
    }

    if (fogInterferenceActive) {
      if (scene.fog) {
        // Rapid random fog density changes — signal interference
        scene.fog.near = 5 + Math.random() * 30;
        scene.fog.far = 30 + Math.random() * 60;
      }
    } else {
      if (scene.fog) {
        // Smooth restored fog
        var targetNear = uplinkRestored ? 40 : 20;
        var targetFar = uplinkRestored ? 200 : 180;
        scene.fog.near += (targetNear - scene.fog.near) * dt * 3;
        scene.fog.far += (targetFar - scene.fog.far) * dt * 3;
      }
    }
  }

  function updateEnemies(dt) {
    var playerPos = camera.position.clone();
    var i;
    for (i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (en.hp <= 0) continue;
      updateEnemy(en, dt, playerPos);
    }
  }

  function updateEnemy(en, dt, playerPos) {
    var dist = en.pos.distanceTo(playerPos);
    var aggroRange = (en.type === 'guard') ? 30 : 20;

    if (!en.alerted && dist < aggroRange) {
      en.alerted = true;
      en.state = 'chase';
    }

    var speed = (en.type === 'guard') ? 4.5 : 3.0;

    if (en.state === 'patrol') {
      en.patrolAngle += dt * 0.4;
      var px = en.patrolOrigin.x + Math.cos(en.patrolAngle) * 6;
      var pz = en.patrolOrigin.z + Math.sin(en.patrolAngle) * 6;
      var pdx = px - en.pos.x;
      var pdz = pz - en.pos.z;
      var plen = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
      en.pos.x += (pdx / plen) * speed * 0.6 * dt;
      en.pos.z += (pdz / plen) * speed * 0.6 * dt;
    } else if (en.state === 'chase') {
      var cdx = playerPos.x - en.pos.x;
      var cdz = playerPos.z - en.pos.z;
      var clen = Math.sqrt(cdx * cdx + cdz * cdz) || 1;

      if (en.type === 'guard' && dist < 15) {
        // Guards keep distance and shoot
        if (dist < 8) {
          en.pos.x -= (cdx / clen) * speed * dt;
          en.pos.z -= (cdz / clen) * speed * dt;
        }
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0 && dist < 25) {
          en.shootCooldown = 2.5 + Math.random() * 1.5;
          var sdir = new THREE.Vector3(playerPos.x - en.pos.x, playerPos.y - en.pos.y - 0.5, playerPos.z - en.pos.z).normalize();
          spawnEnemyProjectile(en.pos.clone().add(new THREE.Vector3(0, 0.8, 0)), sdir, 12, 18, 0xff4400);
        }
      } else if (en.type === 'technician') {
        // Technicians approach and melee
        if (dist > 2.5) {
          en.pos.x += (cdx / clen) * speed * dt;
          en.pos.z += (cdz / clen) * speed * dt;
        }
        en.attackCooldown -= dt;
        if (en.attackCooldown <= 0 && dist < 2.5) {
          en.attackCooldown = 1.8;
          playerHP -= 8;
        }
        en.shootCooldown -= dt;
        if (en.shootCooldown <= 0 && dist < 18) {
          en.shootCooldown = 3 + Math.random() * 2;
          var tdir = new THREE.Vector3(playerPos.x - en.pos.x, playerPos.y - en.pos.y - 0.3, playerPos.z - en.pos.z).normalize();
          spawnEnemyProjectile(en.pos.clone().add(new THREE.Vector3(0, 0.6, 0)), tdir, 8, 12, 0xffcc00);
        }
      } else {
        en.pos.x += (cdx / clen) * speed * dt;
        en.pos.z += (cdz / clen) * speed * dt;
      }
    }

    en.mesh.position.copy(en.pos);
    if (en.alerted) {
      var faceAngle = Math.atan2(playerPos.x - en.pos.x, playerPos.z - en.pos.z);
      en.mesh.rotation.y = faceAngle;
    }

    if (playerHP <= 0 && !gameLost) {
      gameLost = true;
      showEndScreen('Overrun by jamming technicians. The uplink remains severed.', false);
    }
  }

  function spawnEnemyProjectile(from, dir, damage, speed, color) {
    var geo = new THREE.BoxGeometry(0.1, 0.1, 0.35);
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color }));
    mesh.position.copy(from);
    scene.add(mesh);
    sceneObjects.push(mesh);
    projectiles.push({ mesh: mesh, velocity: dir.clone().multiplyScalar(speed), damage: damage, life: 3.0, fromEnemy: true });
  }

  function updateProjectiles(dt) {
    var toRemove = [];
    var i;
    for (i = 0; i < projectiles.length; i++) {
      var p = projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.life -= dt;
      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }
      if (p.fromEnemy) {
        var d = p.mesh.position.distanceTo(camera.position);
        if (d < 0.9) {
          playerHP -= p.damage;
          toRemove.push(i);
        }
      }
    }
    for (i = toRemove.length - 1; i >= 0; i--) {
      var idx = toRemove[i];
      scene.remove(projectiles[idx].mesh);
      projectiles.splice(idx, 1);
    }
  }

  // ── end screen ─────────────────────────────────────────────────────────────
  function showEndScreen(msg, win) {
    if (document.exitPointerLock) document.exitPointerLock();
    active = false;
    var div = document.createElement('div');
    div.id = 'satdish-endscreen';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);color:' + (win ? '#0f8' : '#f44') + ';font:bold 2em monospace;z-index:2000;text-align:center;';
    div.innerHTML = '<div>' + (win ? 'UPLINK RESTORED' : 'MISSION FAILED') + '</div>'
      + '<div style="font-size:0.5em;margin-top:20px;color:#ccc">' + msg + '</div>'
      + '<div style="font-size:0.5em;margin-top:10px;color:#0cf">Score: ' + score + '</div>'
      + '<div style="font-size:0.4em;margin-top:20px;color:#888">Press R to restart  |  S+D to toggle module</div>';
    document.body.appendChild(div);
    var handler = function (e) {
      if (e.code === 'KeyR') {
        var el = document.getElementById('satdish-endscreen');
        if (el) document.body.removeChild(el);
        document.removeEventListener('keydown', handler);
        reset();
        buildWorld();
        camera.position.set(0, 1.7, 5);
        yaw = Math.PI;
        pitch = 0;
        active = true;
        gameWon = false;
        gameLost = false;
        container.requestPointerLock();
      }
    };
    document.addEventListener('keydown', handler);
  }

  // ── reset ───────────────────────────────────────────────────────────────────
  function reset() {
    var i;
    for (i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    dishes = [];
    enemies = [];
    projectiles = [];
    serverRacks = [];
    serverRacksActivated = 0;
    lastActivatedRack = -1;
    signalStrength = 0;
    uplinkRestored = false;
    gameWon = false;
    gameLost = false;
    playerHP = 100;
    score = 0;
    fogInterferenceTimer = 0;
    fogInterferenceActive = false;
    fogPhase = 0;
    interactCooldown = 0;
    playerVelocity = { x: 0, y: 0, z: 0 };
    playerOnGround = true;
    if (scene.fog) {
      scene.fog.near = 20;
      scene.fog.far = 180;
    }
  }

  return { init: init, update: update, reset: reset };
}());
