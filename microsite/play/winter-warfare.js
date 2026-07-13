window.WinterWarfare = (function() {
  'use strict';

  var scene, camera, renderer;
  var sceneElements = [];
  var particles = [];
  var hud = null;
  var lastHKeyTime = 0;
  var hKeyPressed = false;
  var hudVisible = true;
  var deltaTime = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Clear any existing objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    sceneElements = [];
    particles = [];
    lastHKeyTime = 0;
    hKeyPressed = false;
    hudVisible = true;

    // 1. Snow ground - white flat box (400×0.5×400), 0xf0f0ff
    var groundGeometry = new THREE.BoxGeometry(400, 0.5, 400);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0ff });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -5;
    scene.add(ground);
    sceneElements.push({ mesh: ground, type: 'ground' });

    // 2. Frozen river - flat light blue-white box (10×0.1×200), 0xaaccee
    var riverGeometry = new THREE.BoxGeometry(10, 0.1, 200);
    var riverMaterial = new THREE.MeshStandardMaterial({ color: 0xaaccee });
    var river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.position.set(0, -4.9, 0);
    scene.add(river);
    sceneElements.push({ mesh: river, type: 'river' });

    // 3-5. Ruined building shells (3 buildings)
    for (var i = 0; i < 3; i++) {
      var building = createRuinedBuilding();
      building.position.set((i - 1) * 60, 0, -80 + i * 20);
      scene.add(building);
      sceneElements.push({ mesh: building, type: 'building' });
    }

    // 6-7. T-34 tanks (2 Soviet tanks from east)
    for (var i = 0; i < 2; i++) {
      var tank = createT34Tank();
      tank.position.set(150 - i * 40, 0, 20 + i * 30);
      tank.userData.type = 'soviet_tank';
      tank.userData.startX = tank.position.x;
      scene.add(tank);
      sceneElements.push({ mesh: tank, type: 'soviet_tank' });
    }

    // 8-9. German Panzer IV tanks (2 from west)
    for (var i = 0; i < 2; i++) {
      var panzer = createPanzerTank();
      panzer.position.set(-150 + i * 40, 0, 20 - i * 30);
      panzer.userData.type = 'german_tank';
      panzer.userData.startX = panzer.position.x;
      scene.add(panzer);
      sceneElements.push({ mesh: panzer, type: 'german_tank' });
    }

    // 10-15. Soviet infantry figures (6 white winter coat box figures)
    for (var i = 0; i < 6; i++) {
      var soldier = createSoldier(0xccccff);
      soldier.position.set(80 + (i % 3) * 20, 0, 50 + Math.floor(i / 3) * 40);
      scene.add(soldier);
      sceneElements.push({ mesh: soldier, type: 'soviet_soldier' });
    }

    // 16-21. German infantry figures (6 gray uniform box figures)
    for (var i = 0; i < 6; i++) {
      var soldier = createSoldier(0x888888);
      soldier.position.set(-80 - (i % 3) * 20, 0, 50 - Math.floor(i / 3) * 40);
      scene.add(soldier);
      sceneElements.push({ mesh: soldier, type: 'german_soldier' });
    }

    // 22-23. Ski troop figures (2 white box figures with ski boards)
    for (var i = 0; i < 2; i++) {
      var skiTroop = createSkiTroop();
      skiTroop.position.set(120 + i * 40, 0, 120);
      scene.add(skiTroop);
      sceneElements.push({ mesh: skiTroop, type: 'ski_troop' });
    }

    // 24. Snow trench line
    var trench = createTrench();
    trench.position.set(0, 0, -40);
    scene.add(trench);
    sceneElements.push({ mesh: trench, type: 'trench' });

    // 25. Artillery gun
    var artillery = createArtillery();
    artillery.position.set(100, 0, -60);
    artillery.userData.barrelTilt = 0;
    scene.add(artillery);
    sceneElements.push({ mesh: artillery, type: 'artillery' });

    // 26. Frozen horse + broken cart
    var horseCart = createHorseAndCart();
    horseCart.position.set(-120, 0, -100);
    scene.add(horseCart);
    sceneElements.push({ mesh: horseCart, type: 'horse_cart' });

    // 27. Field kitchen
    var kitchen = createFieldKitchen();
    kitchen.position.set(60, 0, -150);
    scene.add(kitchen);
    sceneElements.push({ mesh: kitchen, type: 'field_kitchen' });

    // 28. Barbed wire entanglement
    var barbedWire = createBarbedWire();
    barbedWire.position.set(-80, 0, -80);
    scene.add(barbedWire);
    sceneElements.push({ mesh: barbedWire, type: 'barbed_wire' });

    // 29. Church bell tower ruins
    var tower = createBellTower();
    tower.position.set(0, 0, 150);
    scene.add(tower);
    sceneElements.push({ mesh: tower, type: 'bell_tower' });

    // 30. Ammunition crate dump
    var ammo = createAmmoCrates();
    ammo.position.set(-100, 0, 80);
    scene.add(ammo);
    sceneElements.push({ mesh: ammo, type: 'ammo_crates' });

    // 31+. Blizzard particle system (50 tiny white boxes)
    initBlizzard();

    // Setup keyboard handler for HUD toggle
    document.addEventListener('keydown', handleKeyDown);

    // Create HUD
    createHUD();
  }

  function createRuinedBuilding() {
    var group = new THREE.Group();

    // Main wall structure
    var wallGeometry = new THREE.BoxGeometry(30, 25, 25);
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var wall = new THREE.Mesh(wallGeometry, stoneMaterial);
    wall.position.y = 12;
    group.add(wall);

    // Collapsed roof
    var roofGeometry = new THREE.BoxGeometry(32, 3, 27);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 25, 0);
    group.add(roof);

    // Window cutout (just a darker area)
    var windowGeometry = new THREE.BoxGeometry(8, 8, 0.5);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-8, 12, 12.6);
    group.add(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(8, 12, 12.6);
    group.add(window2);

    return group;
  }

  function createT34Tank() {
    var group = new THREE.Group();

    // Hull
    var hullGeometry = new THREE.BoxGeometry(12, 8, 20);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x223344 });
    var hull = new THREE.Mesh(hullGeometry, metalMaterial);
    hull.position.y = 4;
    group.add(hull);

    // Turret
    var turretGeometry = new THREE.BoxGeometry(10, 6, 10);
    var turret = new THREE.Mesh(turretGeometry, metalMaterial);
    turret.position.set(0, 10, 0);
    group.add(turret);

    // Barrel (cylinder approximated with long thin box)
    var barrelGeometry = new THREE.BoxGeometry(2, 2, 15);
    var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
    barrel.position.set(0, 10, -8);
    group.add(barrel);

    // Road wheels (6 wheels)
    for (var i = 0; i < 6; i++) {
      var wheelGeometry = new THREE.BoxGeometry(3, 3, 3);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      var wheelY = 2;
      var wheelZ = -8 + (i * 3);
      wheel.position.set(-6.5, wheelY, wheelZ);
      group.add(wheel);

      var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel2.position.set(6.5, wheelY, wheelZ);
      group.add(wheel2);
    }

    return group;
  }

  function createPanzerTank() {
    var group = new THREE.Group();

    // Hull (slightly different proportions)
    var hullGeometry = new THREE.BoxGeometry(11, 7, 19);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x445566 });
    var hull = new THREE.Mesh(hullGeometry, metalMaterial);
    hull.position.y = 4;
    group.add(hull);

    // Turret
    var turretGeometry = new THREE.BoxGeometry(9, 6, 9);
    var turret = new THREE.Mesh(turretGeometry, metalMaterial);
    turret.position.set(0, 10, 0);
    group.add(turret);

    // Barrel
    var barrelGeometry = new THREE.BoxGeometry(2, 2, 14);
    var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
    barrel.position.set(0, 10, -7);
    group.add(barrel);

    // Road wheels (6 wheels)
    for (var i = 0; i < 6; i++) {
      var wheelGeometry = new THREE.BoxGeometry(3, 3, 3);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      var wheelY = 2;
      var wheelZ = -8 + (i * 3);
      wheel.position.set(-6, wheelY, wheelZ);
      group.add(wheel);

      var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel2.position.set(6, wheelY, wheelZ);
      group.add(wheel2);
    }

    return group;
  }

  function createSoldier(color) {
    var group = new THREE.Group();

    // Head
    var headGeometry = new THREE.BoxGeometry(2, 2.5, 2);
    var headshotMaterial = new THREE.MeshStandardMaterial({ color: 0xffccbb });
    var head = new THREE.Mesh(headGeometry, headshotMaterial);
    head.position.y = 8;
    group.add(head);

    // Body
    var bodyGeometry = new THREE.BoxGeometry(3, 5, 2.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 5;
    group.add(body);

    // Left leg
    var legGeometry = new THREE.BoxGeometry(2, 4, 2);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-1.5, 2, 0);
    group.add(leftLeg);

    // Right leg
    var rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(1.5, 2, 0);
    group.add(rightLeg);

    // Left arm
    var armGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
    var armMaterial = new THREE.MeshStandardMaterial({ color: color });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-2.5, 5, 0);
    group.add(leftArm);

    // Right arm
    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(2.5, 5, 0);
    group.add(rightArm);

    return group;
  }

  function createSkiTroop() {
    var group = new THREE.Group();

    // Soldier body
    var soldier = createSoldier(0xccccff);
    group.add(soldier);

    // Ski boards (wide flat boxes below feet)
    var skiGeometry = new THREE.BoxGeometry(6, 0.4, 12);
    var skiMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var skis = new THREE.Mesh(skiGeometry, skiMaterial);
    skis.position.y = 0.5;
    group.add(skis);

    return group;
  }

  function createTrench() {
    var group = new THREE.Group();

    // Dug trench channel (recessed)
    var trenchDepth = 3;
    var trenchGeometry = new THREE.BoxGeometry(60, trenchDepth, 20);
    var trenchMaterial = new THREE.MeshStandardMaterial({ color: 0xd0d0e0 });
    var trenchBox = new THREE.Mesh(trenchGeometry, trenchMaterial);
    trenchBox.position.y = -trenchDepth / 2;
    group.add(trenchBox);

    // Parapet (raised defensive wall)
    var parapetGeometry = new THREE.BoxGeometry(62, 2, 22);
    var parapetMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var parapet = new THREE.Mesh(parapetGeometry, parapetMaterial);
    parapet.position.set(0, -2.5, 0);
    group.add(parapet);

    // Firing step
    var stepGeometry = new THREE.BoxGeometry(58, 1, 18);
    var stepMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    var step = new THREE.Mesh(stepGeometry, stepMaterial);
    step.position.y = -2;
    group.add(step);

    return group;
  }

  function createArtillery() {
    var group = new THREE.Group();

    // Gun carriage (box base)
    var carriageGeometry = new THREE.BoxGeometry(8, 3, 15);
    var carriageMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
    carriage.position.y = 2;
    group.add(carriage);

    // Long barrel (cylinder approximated as box)
    var barrelGeometry = new THREE.BoxGeometry(2, 2, 25);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 5.5, -5);
    barrel.rotation.x = 0.3;
    barrel.userData.originalRotation = barrel.rotation.x;
    barrel.name = 'barrel';
    group.add(barrel);

    // Wheels
    for (var i = 0; i < 2; i++) {
      var wheelGeometry = new THREE.BoxGeometry(3, 3, 4);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set((i === 0 ? -5 : 5), 1.5, 5);
      group.add(wheel);
    }

    return group;
  }

  function createHorseAndCart() {
    var group = new THREE.Group();

    // Horse body (lying on side)
    var horseBodyGeometry = new THREE.BoxGeometry(4, 4, 12);
    var horseMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6f47 });
    var horseBody = new THREE.Mesh(horseBodyGeometry, horseMaterial);
    horseBody.position.set(-5, 2, 0);
    horseBody.rotation.z = Math.PI / 2;
    group.add(horseBody);

    // Horse head
    var horseHeadGeometry = new THREE.BoxGeometry(2.5, 2.5, 3);
    var horseHead = new THREE.Mesh(horseHeadGeometry, horseMaterial);
    horseHead.position.set(-7, 4, -7);
    group.add(horseHead);

    // Overturned cart box
    var cartGeometry = new THREE.BoxGeometry(15, 8, 10);
    var cartMaterial = new THREE.MeshStandardMaterial({ color: 0xaa8844 });
    var cart = new THREE.Mesh(cartGeometry, cartMaterial);
    cart.position.set(10, 4, 5);
    cart.rotation.z = Math.PI / 6;
    group.add(cart);

    // Cart wheel
    var wheelGeometry = new THREE.BoxGeometry(4, 4, 1);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(8, 2, 12);
    group.add(wheel);

    return group;
  }

  function createFieldKitchen() {
    var group = new THREE.Group();

    // Truck body
    var truckGeometry = new THREE.BoxGeometry(10, 8, 15);
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var truck = new THREE.Mesh(truckGeometry, truckMaterial);
    truck.position.y = 4;
    group.add(truck);

    // Chimney (box)
    var chimneyGeometry = new THREE.BoxGeometry(2, 10, 2);
    var chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(3, 12, -7);
    group.add(chimney);

    // Smoke sphere
    var smokeGeometry = new THREE.BoxGeometry(4, 4, 4);
    var smokeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      opacity: 0.6,
      transparent: true
    });
    var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(3, 17, -7);
    smoke.userData.baseY = smoke.position.y;
    group.add(smoke);

    // Pot (cylinder as box)
    var potGeometry = new THREE.BoxGeometry(3, 3, 3);
    var potMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.set(-2, 8.5, 0);
    group.add(pot);

    return group;
  }

  function createBarbedWire() {
    var group = new THREE.Group();

    // Fence posts
    for (var i = 0; i < 5; i++) {
      var postGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(i * 8 - 16, 2, 0);
      group.add(post);
    }

    // Barbed wire segments (thin boxes)
    for (var i = 0; i < 4; i++) {
      var wireGeometry = new THREE.BoxGeometry(8, 0.3, 0.2);
      var wireMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
      var wire = new THREE.Mesh(wireGeometry, wireMaterial);
      wire.position.set(-8 + i * 8, 3.5 - i * 0.3, 0);
      group.add(wire);
    }

    return group;
  }

  function createBellTower() {
    var group = new THREE.Group();

    // Main tower stump (tall box)
    var towerGeometry = new THREE.BoxGeometry(12, 35, 12);
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    var tower = new THREE.Mesh(towerGeometry, stoneMaterial);
    tower.position.y = 17;
    group.add(tower);

    // Crumbled top
    var crumbleGeometry = new THREE.BoxGeometry(14, 5, 14);
    var crumbleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var crumble = new THREE.Mesh(crumbleGeometry, crumbleMaterial);
    crumble.position.set(0, 37, 0);
    group.add(crumble);

    // Bell remnant (dark box)
    var bellGeometry = new THREE.BoxGeometry(6, 6, 6);
    var bellMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(-2, 30, 0);
    group.add(bell);

    return group;
  }

  function createAmmoCrates() {
    var group = new THREE.Group();

    // Stack of wooden crates
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var crateGeometry = new THREE.BoxGeometry(8, 5, 8);
        var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(i * 10 - 10, 2.5 + j * 5, j * 3);
        group.add(crate);
      }
    }

    // Snow covering top
    var snowGeometry = new THREE.BoxGeometry(32, 1, 18);
    var snowMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0ff });
    var snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.set(0, 12.8, 3);
    group.add(snow);

    return group;
  }

  function initBlizzard() {
    particles = [];
    var particleCount = 50;

    for (var i = 0; i < particleCount; i++) {
      var pGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var pMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.8,
        transparent: true
      });
      var particle = new THREE.Mesh(pGeometry, pMaterial);

      particle.position.set(
        Math.random() * 400 - 200,
        Math.random() * 150 + 50,
        Math.random() * 400 - 200
      );

      scene.add(particle);

      particles.push({
        mesh: particle,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 2,
        vz: Math.random() * 0.3,
        time: Math.random() * 10,
        lifespan: 20
      });
    }
  }

  function createHUD() {
    // Create a simple DOM-based HUD (in-scene would require canvas texture)
    var hudDiv = document.createElement('div');
    hudDiv.id = 'winter-warfare-hud';
    hudDiv.style.position = 'absolute';
    hudDiv.style.top = '10px';
    hudDiv.style.left = '10px';
    hudDiv.style.color = '#0088ff';
    hudDiv.style.fontFamily = 'monospace';
    hudDiv.style.fontSize = '14px';
    hudDiv.style.fontWeight = 'bold';
    hudDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    hudDiv.style.padding = '10px';
    hudDiv.style.borderRadius = '5px';
    hudDiv.style.zIndex = '1000';
    hudDiv.style.userSelect = 'none';
    hudDiv.style.pointerEvents = 'none';

    hudDiv.innerHTML = [
      'SOVIET ADVANCE: STALLED',
      'GERMAN POSITION: HOLDING',
      'TEMP: -28°C'
    ].join('<br>');

    document.body.appendChild(hudDiv);
    hud = hudDiv;
  }

  function handleKeyDown(event) {
    if (event.key === 'h' || event.key === 'H') {
      var currentTime = Date.now();

      // Check if H was pressed within 400ms of previous H
      if (currentTime - lastHKeyTime < 400) {
        hKeyPressed = true;
      } else {
        hKeyPressed = false;
      }

      lastHKeyTime = currentTime;
    }

    if (event.key === 'i' || event.key === 'I') {
      if (hKeyPressed && Date.now() - lastHKeyTime < 400) {
        // Toggle HUD
        hudVisible = !hudVisible;
        if (hud) {
          hud.style.display = hudVisible ? 'block' : 'none';
        }
        hKeyPressed = false;
      }
    }
  }

  function update(delta) {
    deltaTime = delta;

    // Update particle positions (blizzard swirl)
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.time += delta;

      // Circular motion + random swirl
      var angle = p.time * 0.5;
      p.mesh.position.x += Math.cos(angle) * 0.3 * delta + p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += Math.sin(angle) * 0.2 * delta + p.vz * delta;

      // Wrap around
      if (p.mesh.position.y < 0) {
        p.mesh.position.y = 200;
      }
      if (p.mesh.position.x < -200) {
        p.mesh.position.x = 200;
      }
      if (p.mesh.position.x > 200) {
        p.mesh.position.x = -200;
      }
      if (p.mesh.position.z < -200) {
        p.mesh.position.z = 200;
      }
      if (p.mesh.position.z > 200) {
        p.mesh.position.z = -200;
      }
    }

    // Update tank positions (advance toward each other)
    for (var i = 0; i < sceneElements.length; i++) {
      var elem = sceneElements[i];

      if (elem.type === 'soviet_tank') {
        elem.mesh.position.x = Math.max(elem.mesh.userData.startX - delta * 15, -30);
      }

      if (elem.type === 'german_tank') {
        elem.mesh.position.x = Math.min(elem.mesh.userData.startX + delta * 15, 30);
      }
    }

    // River ice creaks (slight oscillation)
    for (var i = 0; i < sceneElements.length; i++) {
      var elem = sceneElements[i];

      if (elem.type === 'river') {
        elem.mesh.position.y = -4.9 + Math.sin(Date.now() * 0.001) * 0.05;
      }
    }

    // Artillery recoil animation
    for (var i = 0; i < sceneElements.length; i++) {
      var elem = sceneElements[i];

      if (elem.type === 'artillery') {
        // Find barrel and animate recoil
        var barrel = elem.mesh.getObjectByName('barrel');
        if (barrel) {
          var time = Date.now() * 0.002;
          var recoilAmount = Math.max(0, 0.3 - (time % 2) * 0.15);
          barrel.rotation.x = barrel.userData.originalRotation - recoilAmount;
        }
      }
    }

    // Field kitchen smoke rises
    for (var i = 0; i < sceneElements.length; i++) {
      var elem = sceneElements[i];

      if (elem.type === 'field_kitchen') {
        // Find smoke in children
        for (var j = 0; j < elem.mesh.children.length; j++) {
          var child = elem.mesh.children[j];
          if (child.position.y > 10) {
            child.position.y = child.userData.baseY + Math.sin(Date.now() * 0.003 + j) * 1.5;
          }
        }
      }
    }
  }

  function reset() {
    // Remove HUD
    if (hud && hud.parentNode) {
      hud.parentNode.removeChild(hud);
    }

    // Clear scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    sceneElements = [];
    particles = [];

    // Remove event listener
    document.removeEventListener('keydown', handleKeyDown);

    // Re-initialize
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
