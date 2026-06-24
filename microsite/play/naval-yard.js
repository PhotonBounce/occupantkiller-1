var window = window || {};

window.NavalYard = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var weldingParticles = [];
  var crane = null;
  var craneMissiles = [];
  var craneHook = null;
  var hullSections = [];
  var missileBunker = null;
  var launchRamp = null;
  var launchWater = null;
  var barracksLights = [];
  var bunkerLight = null;
  var elapsedTime = 0;
  var hudElement = null;
  var gameState = {
    shipHullProgress: 0,
    maxProgress: 100,
    workersDefeated: 0,
    maxWorkers: 12,
    missilesSecured: 0,
    maxMissiles: 8
  };

  function createDrydockDepression() {
    // Large sunken drydock basin
    var drydockGeometry = new THREE.BoxGeometry(40, 8, 50);
    var drydockMaterial = new THREE.MeshStandardMaterial({ color: 0x4466AA, roughness: 0.6 });
    var drydock = new THREE.Mesh(drydockGeometry, drydockMaterial);
    drydock.position.set(0, -6, 0);
    drydock.castShadow = true;
    drydock.receiveShadow = true;
    scene.add(drydock);
    sceneObjects.push(drydock);

    // Drydock walls
    var wallGeometry = new THREE.BoxGeometry(42, 1, 52);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555533, roughness: 0.8 });
    var wallNorth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallNorth.position.set(0, -2, -27);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    sceneObjects.push(wallNorth);

    var wallSouth = new THREE.Mesh(wallGeometry, wallMaterial);
    wallSouth.position.set(0, -2, 27);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    sceneObjects.push(wallSouth);
  }

  function createWarshipHull() {
    // Main hull skeleton - large box frame
    var mainHullGeometry = new THREE.BoxGeometry(6, 4, 25);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
    var mainHull = new THREE.Mesh(mainHullGeometry, hullMaterial);
    mainHull.position.set(0, -4, 0);
    mainHull.castShadow = true;
    mainHull.receiveShadow = true;
    scene.add(mainHull);
    sceneObjects.push(mainHull);
    hullSections.push(mainHull);

    // Bow section (detached)
    var bowGeometry = new THREE.BoxGeometry(5, 3.5, 6);
    var bowMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
    var bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(12, -3, -20);
    bow.castShadow = true;
    bow.receiveShadow = true;
    scene.add(bow);
    sceneObjects.push(bow);
    hullSections.push(bow);

    // Stern section
    var sternGeometry = new THREE.BoxGeometry(5, 3, 5);
    var stern = new THREE.Mesh(sternGeometry, bowMaterial);
    stern.position.set(-14, -3.5, 18);
    stern.castShadow = true;
    stern.receiveShadow = true;
    scene.add(stern);
    sceneObjects.push(stern);
    hullSections.push(stern);

    // Keel blocks supporting hull
    var keelBlockGeometry = new THREE.BoxGeometry(1.5, 1, 25);
    var keelMaterial = new THREE.MeshStandardMaterial({ color: 0x555533, roughness: 0.9 });
    var keelBlock1 = new THREE.Mesh(keelBlockGeometry, keelMaterial);
    keelBlock1.position.set(-2.5, -6.5, 0);
    scene.add(keelBlock1);
    sceneObjects.push(keelBlock1);

    var keelBlock2 = new THREE.Mesh(keelBlockGeometry, keelMaterial);
    keelBlock2.position.set(2.5, -6.5, 0);
    scene.add(keelBlock2);
    sceneObjects.push(keelBlock2);

    // Hull plate sections leaning
    var plateMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5 });
    var plateGeometry = new THREE.BoxGeometry(8, 0.3, 6);
    var plate1 = new THREE.Mesh(plateGeometry, plateMaterial);
    plate1.position.set(-12, -1, -15);
    plate1.rotation.z = Math.PI / 6;
    plate1.castShadow = true;
    scene.add(plate1);
    sceneObjects.push(plate1);

    var plate2 = new THREE.Mesh(plateGeometry, plateMaterial);
    plate2.position.set(10, -1, 10);
    plate2.rotation.z = -Math.PI / 5;
    plate2.castShadow = true;
    scene.add(plate2);
    sceneObjects.push(plate2);
  }

  function createScaffoldingTower() {
    // Tall scaffolding frame around hull
    var frameGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12, 8);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });

    var positions = [
      [-5, 0, -12],
      [5, 0, -12],
      [-5, 0, 12],
      [5, 0, 12]
    ];

    positions.forEach(function(pos) {
      var post = new THREE.Mesh(frameGeometry, frameMaterial);
      post.position.set(pos[0], pos[1], pos[2]);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      sceneObjects.push(post);
    });

    // Horizontal scaffold beams
    var beamGeometry = new THREE.CylinderGeometry(0.12, 0.12, 10, 8);
    var beam1 = new THREE.Mesh(beamGeometry, frameMaterial);
    beam1.rotation.z = Math.PI / 2;
    beam1.position.set(0, 3, -12);
    beam1.castShadow = true;
    scene.add(beam1);
    sceneObjects.push(beam1);

    var beam2 = new THREE.Mesh(beamGeometry, frameMaterial);
    beam2.rotation.z = Math.PI / 2;
    beam2.position.set(0, 3, 12);
    beam2.castShadow = true;
    scene.add(beam2);
    sceneObjects.push(beam2);

    var beam3 = new THREE.Mesh(beamGeometry, frameMaterial);
    beam3.rotation.x = Math.PI / 2;
    beam3.position.set(0, 3, 0);
    beam3.castShadow = true;
    scene.add(beam3);
    sceneObjects.push(beam3);
  }

  function createMobileCrane() {
    var group = new THREE.Group();

    // Base carriage on rails
    var carriageGeometry = new THREE.BoxGeometry(3, 1, 2);
    var carriageMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
    carriage.position.y = 0.5;
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    group.add(carriage);

    // Vertical mast
    var mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 10, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 5.5;
    mast.castShadow = true;
    mast.receiveShadow = true;
    group.add(mast);

    // Jib arm extending
    var jibGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
    var jib = new THREE.Mesh(jibGeometry, mastMaterial);
    jib.rotation.z = Math.PI / 2;
    jib.position.set(4, 9.5, 0);
    jib.castShadow = true;
    jib.receiveShadow = true;
    group.add(jib);

    // Hook and cable
    var hookGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
    var hookMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.9 });
    craneHook = new THREE.Mesh(hookGeometry, hookMaterial);
    craneHook.position.set(4, 6, 0);
    craneHook.castShadow = true;
    craneHook.receiveShadow = true;
    group.add(craneHook);

    // Cable (thin line)
    var cableGeometry = new THREE.BoxGeometry(0.05, 3.5, 0.05);
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.set(4, 7.8, 0);
    group.add(cable);

    group.position.set(-15, -2, 0);
    group.craneData = { traversePos: 0, hookHeight: 6 };
    scene.add(group);
    sceneObjects.push(group);
    crane = group;
  }

  function createPartsWarehouse() {
    // Large industrial building
    var warehouseGeometry = new THREE.BoxGeometry(15, 6, 12);
    var warehouseMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    var warehouse = new THREE.Mesh(warehouseGeometry, warehouseMaterial);
    warehouse.position.set(20, 2.5, -18);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    scene.add(warehouse);
    sceneObjects.push(warehouse);

    // Warehouse roof
    var roofGeometry = new THREE.BoxGeometry(16, 0.5, 13);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(20, 6.25, -18);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    sceneObjects.push(roof);

    // Warehouse doors
    var doorGeometry = new THREE.BoxGeometry(3, 5, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var door1 = new THREE.Mesh(doorGeometry, doorMaterial);
    door1.position.set(15, 2.5, -24);
    scene.add(door1);
    sceneObjects.push(door1);

    var door2 = new THREE.Mesh(doorGeometry, doorMaterial);
    door2.position.set(25, 2.5, -24);
    scene.add(door2);
    sceneObjects.push(door2);
  }

  function createLaunchRamp() {
    // Inclined ramp for ship launch
    var rampGeometry = new THREE.BoxGeometry(25, 1, 8);
    var rampMaterial = new THREE.MeshStandardMaterial({ color: 0x555533, roughness: 0.8 });
    launchRamp = new THREE.Mesh(rampGeometry, rampMaterial);
    launchRamp.position.set(0, 0, 28);
    launchRamp.rotation.x = Math.PI / 12;
    launchRamp.castShadow = true;
    launchRamp.receiveShadow = true;
    scene.add(launchRamp);
    sceneObjects.push(launchRamp);
    launchRamp.rampData = { waterShimmer: 0 };

    // Water at launch ramp bottom
    var waterGeometry = new THREE.BoxGeometry(30, 1.5, 12);
    var waterMaterial = new THREE.MeshStandardMaterial({ color: 0x4466AA, roughness: 0.5, metalness: 0.2 });
    launchWater = new THREE.Mesh(waterGeometry, waterMaterial);
    launchWater.position.set(0, -2.5, 35);
    launchWater.receiveShadow = true;
    scene.add(launchWater);
    sceneObjects.push(launchWater);
    launchWater.waterData = { shimmerTime: 0 };
  }

  function createWorkerBarracks() {
    // Modular barracks buildings
    var barrackGeometry = new THREE.BoxGeometry(8, 4, 6);
    var barrackMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });

    var barrack1 = new THREE.Mesh(barrackGeometry, barrackMaterial);
    barrack1.position.set(-25, 1.5, -10);
    barrack1.castShadow = true;
    barrack1.receiveShadow = true;
    scene.add(barrack1);
    sceneObjects.push(barrack1);

    var barrack2 = new THREE.Mesh(barrackGeometry, barrackMaterial);
    barrack2.position.set(-25, 1.5, 5);
    barrack2.castShadow = true;
    barrack2.receiveShadow = true;
    scene.add(barrack2);
    sceneObjects.push(barrack2);

    // Barracks lights (windows with emissive material)
    var lightGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
    var lightMaterial1 = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.6 });
    var lightMaterial2 = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0x000000, emissiveIntensity: 0 });

    for (var i = 0; i < 4; i++) {
      var light = new THREE.Mesh(lightGeometry, lightMaterial1);
      light.position.set(-29 + i * 2.5, 2.5, -10.2);
      light.lightData = { on: true, toggleTime: 0 };
      scene.add(light);
      sceneObjects.push(light);
      barracksLights.push(light);
    }
  }

  function createMissileBunker() {
    // Underground missile storage bunker
    var bunkerGeometry = new THREE.BoxGeometry(12, 4, 8);
    var bunkerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
    missileBunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    missileBunker.position.set(-25, 1.5, 20);
    missileBunker.castShadow = true;
    missileBunker.receiveShadow = true;
    scene.add(missileBunker);
    sceneObjects.push(missileBunker);
    missileBunker.bunkerData = { blinkTime: 0 };

    // Bunker security light (red blinker)
    var secLightGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var secLightMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.8 });
    bunkerLight = new THREE.Mesh(secLightGeometry, secLightMaterial);
    bunkerLight.position.set(-25, 4, 20);
    bunkerLight.castShadow = true;
    scene.add(bunkerLight);
    sceneObjects.push(bunkerLight);
    bunkerLight.lightData = { blinkTime: 0 };

    // Anti-ship missiles in storage
    var missileGeometry = new THREE.ConeGeometry(0.3, 3, 8);
    var missileMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.6 });

    for (var j = 0; j < 8; j++) {
      var missile = new THREE.Mesh(missileGeometry, missileMaterial);
      missile.position.set(-30 + (j % 4) * 2, 2 + Math.floor(j / 4) * 1.5, 20);
      missile.castShadow = true;
      missile.receiveShadow = true;
      scene.add(missile);
      sceneObjects.push(missile);
      craneMissiles.push(missile);
    }
  }

  function createWeldingShop() {
    // Fabrication shop with welding equipment
    var shopGeometry = new THREE.BoxGeometry(10, 5, 8);
    var shopMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 });
    var shop = new THREE.Mesh(shopGeometry, shopMaterial);
    shop.position.set(15, 2.5, 12);
    shop.castShadow = true;
    shop.receiveShadow = true;
    scene.add(shop);
    sceneObjects.push(shop);

    // Welding torch (cylinder)
    var torchGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    var torchMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var torch = new THREE.Mesh(torchGeometry, torchMaterial);
    torch.position.set(15, 3, 12);
    torch.castShadow = true;
    scene.add(torch);
    sceneObjects.push(torch);
  }

  function createWeldingSparks() {
    // Emissive welding spark particles
    var sparkGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var sparkMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF4400, emissiveIntensity: 1.0 });

    for (var i = 0; i < 30; i++) {
      var spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
      spark.position.set(
        15 + Math.random() * 2 - 1,
        3 + Math.random() * 2,
        12 + Math.random() * 2 - 1
      );
      spark.scale.set(0.3, 0.3, 0.3);
      spark.castShadow = true;
      scene.add(spark);
      sceneObjects.push(spark);
      weldingParticles.push({
        mesh: spark,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 3 + 0.5,
        vz: Math.random() * 2 - 1,
        life: 0,
        maxLife: 1.5
      });
    }
  }

  function createRopeBarriers() {
    // Rope barriers around dangerous areas
    var ropeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1, 6);
    var ropeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });

    var positions = [
      [-12, 0.5, -18],
      [-12, 0.5, 18],
      [12, 0.5, -18],
      [12, 0.5, 18]
    ];

    positions.forEach(function(pos) {
      var rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
      rope.position.set(pos[0], pos[1], pos[2]);
      scene.add(rope);
      sceneObjects.push(rope);
    });
  }

  function createEnemies() {
    // Shipyard workers (white box figures)
    var positions = [
      [-8, 0, 0],
      [8, 0, -5],
      [0, 0, 8],
      [-20, 0, -12],
      [18, 0, 15],
      [-15, 0, 15],
      [10, 0, -15],
      [-5, 0, 20],
      [25, 0, -8],
      [-28, 0, -5],
      [20, 0, 8],
      [-18, 0, 0]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCDB2, roughness: 0.7 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(pos[0], pos[1], pos[2]);
      group.enemyData = { health: 80, active: true, patrolPos: pos };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    });
  }

  function createTerrain() {
    // Concrete ground around shipyard
    var groundGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'HULL ASSEMBLY: ' + gameState.shipHullProgress + '%\n' +
                  'WORKERS ELIMINATED: ' + gameState.workersDefeated + '/' + gameState.maxWorkers + '\n' +
                  'MISSILES SECURED: ' + gameState.missilesSecured + '/' + gameState.maxMissiles;
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    var now = Date.now();
    if (event.key === 'a' || event.key === 'A') {
      window.lastAKeyTime = now;
    }
    if (event.key === 'o' || event.key === 'O') {
      if (!window.lastAKeyTime) window.lastAKeyTime = 0;
      if (now - window.lastAKeyTime < 400) {
        if (hudElement) {
          hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
        }
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    enemies = [];
    weldingParticles = [];
    hullSections = [];
    craneMissiles = [];
    barracksLights = [];
    elapsedTime = 0;
    gameState = {
      shipHullProgress: 0,
      maxProgress: 100,
      workersDefeated: 0,
      maxWorkers: 12,
      missilesSecured: 0,
      maxMissiles: 8
    };

    // Naval shipyard atmosphere
    scene.background = new THREE.Color(0x8BA0B5);
    scene.fog = new THREE.Fog(0x8BA0B5, 120, 200);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xCCCCDD, 0.7);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    directionalLight.position.set(50, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all level objects
    createTerrain();
    createDrydockDepression();
    createWarshipHull();
    createScaffoldingTower();
    createMobileCrane();
    createPartsWarehouse();
    createLaunchRamp();
    createWorkerBarracks();
    createMissileBunker();
    createWeldingShop();
    createWeldingSparks();
    createRopeBarriers();
    createEnemies();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'naval-yard-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.right = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,0,0.5)';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    // Key listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Crane traversal on rails
    if (crane) {
      crane.craneData.traversePos += delta * 0.3;
      var craneX = -15 + Math.sin(crane.craneData.traversePos) * 8;
      crane.position.x = craneX;

      // Hook bobbing
      if (craneHook) {
        craneHook.position.y = 6 + Math.sin(elapsedTime * 2) * 0.3;
      }
    }

    // Welding sparks emissive burst
    weldingParticles.forEach(function(p) {
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.life += delta;

      if (p.life > p.maxLife) {
        p.life = 0;
        p.mesh.position.set(
          15 + Math.random() * 2 - 1,
          3 + Math.random() * 2,
          12 + Math.random() * 2 - 1
        );
      }

      var fadeOut = Math.max(0, 1 - (p.life / p.maxLife));
      p.mesh.material.emissiveIntensity = fadeOut * 0.8;
      p.mesh.scale.set(0.3 * fadeOut, 0.3 * fadeOut, 0.3 * fadeOut);
    });

    // Hull sections slowly moving
    hullSections.forEach(function(section, idx) {
      section.position.y += Math.sin(elapsedTime * 0.5 + idx) * 0.0005;
    });

    // Barracks lights cycling on/off
    barracksLights.forEach(function(light, idx) {
      light.lightData.toggleTime += delta;
      if (light.lightData.toggleTime > 2) {
        light.lightData.toggleTime = 0;
        light.lightData.on = !light.lightData.on;
        if (light.lightData.on) {
          light.material.color.setHex(0xFFFF00);
          light.material.emissive.setHex(0xFFFF00);
          light.material.emissiveIntensity = 0.6;
        } else {
          light.material.color.setHex(0x444444);
          light.material.emissive.setHex(0x000000);
          light.material.emissiveIntensity = 0;
        }
      }
    });

    // Missile bunker red light blinking
    if (bunkerLight) {
      bunkerLight.lightData.blinkTime += delta;
      var blinkInterval = 0.6;
      if (bunkerLight.lightData.blinkTime > blinkInterval) {
        bunkerLight.lightData.blinkTime = 0;
      }
      var blinking = bunkerLight.lightData.blinkTime < blinkInterval * 0.5;
      bunkerLight.material.emissiveIntensity = blinking ? 0.9 : 0.2;
    }

    // Launch ramp water shimmering
    if (launchWater) {
      launchWater.waterData.shimmerTime += delta;
      var shimmer = Math.sin(launchWater.waterData.shimmerTime * 3) * 0.05;
      launchWater.position.y = -2.5 + shimmer;
    }

    // Randomly update game state
    if (Math.random() < 0.008) {
      if (gameState.shipHullProgress < gameState.maxProgress) {
        gameState.shipHullProgress += Math.floor(Math.random() * 3) + 1;
        if (gameState.shipHullProgress > gameState.maxProgress) {
          gameState.shipHullProgress = gameState.maxProgress;
        }
      }
    }

    if (Math.random() < 0.012) {
      if (gameState.workersDefeated < gameState.maxWorkers) {
        gameState.workersDefeated += 1;
      }
    }

    if (Math.random() < 0.010) {
      if (gameState.missilesSecured < gameState.maxMissiles) {
        gameState.missilesSecured += 1;
      }
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove welding particles
    weldingParticles.forEach(function(p) {
      scene.remove(p.mesh);
    });

    // Remove enemies
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });

    sceneObjects = [];
    enemies = [];
    weldingParticles = [];
    hullSections = [];
    craneMissiles = [];
    barracksLights = [];
    crane = null;
    craneHook = null;
    missileBunker = null;
    launchRamp = null;
    launchWater = null;
    bunkerLight = null;
    elapsedTime = 0;
    gameState = {
      shipHullProgress: 0,
      maxProgress: 100,
      workersDefeated: 0,
      maxWorkers: 12,
      missilesSecured: 0,
      maxMissiles: 8
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
