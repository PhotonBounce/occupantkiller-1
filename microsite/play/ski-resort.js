var window = window || {};

window.SkiResort = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    targetsEliminated: 0,
    maxTargets: 3,
    civiliansCasualties: 0,
    maxCivilians: 12,
    slopeElevation: 3200,
    slopeFallen: 0
  };
  var snowCannon = null;
  var cableCars = [];
  var slalomPoles = [];
  var snowParticles = [];
  var elapsedTime = 0;
  var lastSKeyTime = 0;
  var lastRKeyTime = 0;
  var hudVisible = true;

  function createSkiLodgeChalet() {
    var group = new THREE.Group();

    // Main building box
    var bodyGeometry = new THREE.BoxGeometry(8, 6, 6);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5DEB3,
      roughness: 0.6,
      metalness: 0.1
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 3, -30);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Alpine peaked roof (cone)
    var roofGeometry = new THREE.ConeGeometry(6, 4, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B0000,
      roughness: 0.7,
      metalness: 0.1
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 8, -30);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Windows (small boxes)
    var windowGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.1);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      roughness: 0.3,
      metalness: 0.5
    });

    var windowPositions = [
      [-2, 4, 3.1],
      [0, 4, 3.1],
      [2, 4, 3.1],
      [-2, 2, 3.1],
      [0, 2, 3.1],
      [2, 2, 3.1]
    ];

    windowPositions.forEach(function(pos) {
      var window_obj = new THREE.Mesh(windowGeometry, windowMaterial);
      window_obj.position.set(pos[0], pos[1], pos[2] - 30);
      group.add(window_obj);
    });

    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createSkiLiftTowers() {
    // Two tower structures for cable car lift
    var towerGeometry = new THREE.CylinderGeometry(0.4, 0.5, 15, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.6,
      metalness: 0.4
    });

    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-20, 7.5, 0);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    scene.add(tower1);
    sceneObjects.push(tower1);

    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(20, 7.5, 30);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    scene.add(tower2);
    sceneObjects.push(tower2);

    // Cable (LineSegments)
    var cableGeometry = new THREE.BufferGeometry();
    var cableVertices = new Float32Array([
      -20, 14, 0,
      20, 14, 30
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));

    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cable);
    sceneObjects.push(cable);

    return {
      startX: -20,
      startZ: 0,
      endX: 20,
      endZ: 30,
      length: Math.sqrt(Math.pow(40, 2) + Math.pow(30, 2))
    };
  }

  function createCableCar(cableData, index) {
    var group = new THREE.Group();

    // Cabin (box)
    var cabinGeometry = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    var cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6347,
      roughness: 0.5,
      metalness: 0.3
    });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Suspension bracket (small cylinder)
    var bracketGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    var bracketMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.7,
      roughness: 0.3
    });
    var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket.position.y = 0.8;
    group.add(bracket);

    group.cableCarData = {
      progress: index * 0.33,
      speed: 0.15,
      cableData: cableData
    };

    // Initial position on cable
    var startX = cableData.startX;
    var startZ = cableData.startZ;
    var endX = cableData.endX;
    var endZ = cableData.endZ;
    var posX = startX + (endX - startX) * group.cableCarData.progress;
    var posZ = startZ + (endZ - startZ) * group.cableCarData.progress;
    var posY = 12 + Math.sin(group.cableCarData.progress * Math.PI) * 2;

    group.position.set(posX, posY, posZ);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    cableCars.push(group);
    return group;
  }

  function createSlalomPoles() {
    // Slalom gate poles with flat flags
    var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.5
    });

    var flagGeometry = new THREE.BoxGeometry(1, 0.6, 0.05);

    var polePositions = [
      { x: -8, z: 5, color: 0xFF0000 },
      { x: 8, z: 5, color: 0x0000FF },
      { x: -8, z: 15, color: 0xFF0000 },
      { x: 8, z: 15, color: 0x0000FF },
      { x: -8, z: 25, color: 0xFF0000 },
      { x: 8, z: 25, color: 0x0000FF }
    ];

    polePositions.forEach(function(posData) {
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(posData.x, 1.5, posData.z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      sceneObjects.push(pole);

      // Flag (flat box that waves)
      var flagMaterial = new THREE.MeshStandardMaterial({
        color: posData.color,
        roughness: 0.4,
        metalness: 0.2
      });
      var flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(posData.x + 0.7, 2, posData.z);
      flag.castShadow = true;
      flag.receiveShadow = true;
      flag.poleData = {
        baseX: posData.x + 0.7,
        wavePhase: Math.random() * Math.PI * 2
      };
      scene.add(flag);
      sceneObjects.push(flag);
      slalomPoles.push(flag);
    });
  }

  function createSnowCoveredMountainSlope() {
    // Large angled flat box representing the ski slope
    var slopeGeometry = new THREE.BoxGeometry(80, 2, 60);
    var slopeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.8,
      metalness: 0
    });
    var slope = new THREE.Mesh(slopeGeometry, slopeMaterial);
    slope.rotation.z = -0.2; // Angled slope
    slope.position.set(0, 0, 20);
    slope.castShadow = true;
    slope.receiveShadow = true;
    scene.add(slope);
    sceneObjects.push(slope);

    // Secondary slope platform
    var platformGeometry = new THREE.BoxGeometry(60, 1, 40);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8E8E8,
      roughness: 0.8,
      metalness: 0
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -5, 45);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);
  }

  function createSkiEquipmentRack() {
    var group = new THREE.Group();

    // Frame (4 corner posts - thin cylinders)
    var postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
      metalness: 0.2
    });

    var postPositions = [
      [-1, 1, 0],
      [1, 1, 0],
      [-1, 1, 1],
      [1, 1, 1]
    ];

    postPositions.forEach(function(pos) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos[0], pos[1], pos[2] - 8);
      group.add(post);
    });

    // Horizontal bars (thin boxes)
    var barGeometry = new THREE.BoxGeometry(2.2, 0.08, 0.08);
    var barMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.6,
      metalness: 0.2
    });

    var bar1 = new THREE.Mesh(barGeometry, barMaterial);
    bar1.position.set(0, 1.5, -8);
    group.add(bar1);

    var bar2 = new THREE.Mesh(barGeometry, barMaterial);
    bar2.position.set(0, 0.8, -8);
    group.add(bar2);

    // Skis and poles (small boxes)
    var skiGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.8);
    var skiMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      roughness: 0.4,
      metalness: 0.3
    });

    for (var i = 0; i < 4; i++) {
      var ski = new THREE.Mesh(skiGeometry, skiMaterial);
      ski.position.set(-0.8 + (i * 0.4), 1, -8);
      ski.rotation.z = 0.3;
      group.add(ski);
    }

    group.position.set(-15, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createSnowCannon() {
    var group = new THREE.Group();

    // Base (cylinder)
    var baseGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 12);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.6,
      metalness: 0.4
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Barrel (long cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 12);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.5,
      metalness: 0.5
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.y = 2;
    barrel.rotation.z = 0.3;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    // Nozzle (box)
    var nozzleGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.5);
    var nozzleMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.6
    });
    var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
    nozzle.position.set(0.5, 2.8, 0);
    nozzle.rotation.z = 0.3;
    group.add(nozzle);

    group.position.set(15, 1, 10);
    group.cannonData = { emissionPhase: 0 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createPineTrees() {
    // Pine trees with cylinder trunks and cone snowy tops
    var treePositions = [
      { x: -30, z: 10 },
      { x: 30, z: 15 },
      { x: -25, z: 30 },
      { x: 25, z: 35 },
      { x: -35, z: 20 },
      { x: 35, z: 25 }
    ];

    var trunkGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 8);
    var trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8,
      metalness: 0.1
    });

    var topGeometry = new THREE.ConeGeometry(2.5, 5, 8);
    var topMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F2F,
      roughness: 0.7,
      metalness: 0.05
    });

    treePositions.forEach(function(pos) {
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 2, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      sceneObjects.push(trunk);

      var top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(pos.x, 5.5, pos.z);
      top.castShadow = true;
      top.receiveShadow = true;
      scene.add(top);
      sceneObjects.push(top);

      // Snow cap on top (white sphere)
      var snowCapGeometry = new THREE.SphereGeometry(2.6, 8, 8);
      var snowCapMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.9,
        metalness: 0
      });
      var snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial);
      snowCap.position.set(pos.x, 7.5, pos.z);
      snowCap.castShadow = true;
      snowCap.receiveShadow = true;
      scene.add(snowCap);
      sceneObjects.push(snowCap);
    });
  }

  function createMercenarySkier(startZ) {
    var group = new THREE.Group();

    // Body (white box figure)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.6,
      metalness: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (small sphere)
    var headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDBAC,
      roughness: 0.7,
      metalness: 0.1
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Weapon (black box)
    var weaponGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    var weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
      metalness: 0.3
    });
    var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.3, 0.7, 0);
    group.add(weapon);

    group.enemyData = {
      startZ: startZ,
      posZ: startZ,
      speed: 0.5 + Math.random() * 0.3,
      health: 100,
      posX: (Math.random() - 0.5) * 30
    };

    group.position.set(group.enemyData.posX, 1, group.enemyData.posZ);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function createStationarySniper() {
    var group = new THREE.Group();

    // Body (dark box figure)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.7,
      metalness: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (small sphere)
    var headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A5A5A,
      roughness: 0.7,
      metalness: 0.1
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Rifle (long thin box)
    var rifleGeometry = new THREE.BoxGeometry(0.08, 0.15, 1.5);
    var rifleMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
      metalness: 0.4
    });
    var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
    rifle.position.set(0.3, 0.8, 0.5);
    rifle.rotation.x = -0.3;
    group.add(rifle);

    // Scope (small sphere on rifle)
    var scopeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    var scopeMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.4,
      metalness: 0.7
    });
    var scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.position.set(0.35, 0.95, 0.8);
    group.add(scope);

    group.enemyData = {
      position: new THREE.Vector3(0, 4, -30),
      health: 150,
      isSniper: true
    };

    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function updateCableCars(delta) {
    cableCars.forEach(function(car) {
      var data = car.cableCarData;
      var cableData = data.cableData;

      data.progress += data.speed * delta;
      if (data.progress > 1) {
        data.progress = 0;
      }

      var startX = cableData.startX;
      var startZ = cableData.startZ;
      var endX = cableData.endX;
      var endZ = cableData.endZ;
      var posX = startX + (endX - startX) * data.progress;
      var posZ = startZ + (endZ - startZ) * data.progress;
      var posY = 12 + Math.sin(data.progress * Math.PI) * 2;

      car.position.set(posX, posY, posZ);
    });
  }

  function updateSnowCannon(delta) {
    if (!snowCannon) return;

    var data = snowCannon.cannonData;
    data.emissionPhase += 0.02;

    if (data.emissionPhase % 0.5 < 0.25) {
      for (var i = 0; i < 3; i++) {
        var particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 4, 4),
          new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 })
        );
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.3 + Math.random() * 0.2;
        particle.position.copy(snowCannon.position);
        particle.position.y += 2;
        particle.particleData = {
          vx: Math.cos(angle) * speed,
          vy: 0.2 + Math.random() * 0.3,
          vz: Math.sin(angle) * speed,
          life: 3
        };
        scene.add(particle);
        sceneObjects.push(particle);
        snowParticles.push(particle);
      }
    }
  }

  function updateSnowParticles(delta) {
    snowParticles = snowParticles.filter(function(particle) {
      var data = particle.particleData;
      data.life -= delta;

      if (data.life <= 0) {
        scene.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
        return false;
      }

      particle.position.x += data.vx * delta;
      particle.position.y += data.vy * delta;
      particle.position.z += data.vz * delta;
      data.vy -= 0.5 * delta;
      particle.material.opacity = data.life / 3;

      return true;
    });
  }

  function updateSlalomFlags(delta) {
    slalomPoles.forEach(function(flag) {
      var data = flag.poleData;
      var wave = Math.sin(elapsedTime * 2 + data.wavePhase) * 0.2;
      flag.rotation.z = wave;
      flag.position.x = data.baseX + wave * 0.3;
    });
  }

  function updateMercenaries(delta) {
    enemies.forEach(function(enemy) {
      if (enemy.enemyData.isSniper) return;

      var data = enemy.enemyData;
      data.posZ -= data.speed * delta;

      if (data.posZ < -50) {
        data.posZ = 40;
        data.posX = (Math.random() - 0.5) * 30;
      }

      enemy.position.set(data.posX, 1, data.posZ);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'TARGETS ELIMINATED: ' + gameState.targetsEliminated + '/' + gameState.maxTargets + '\n' +
                  'CIVILIANS PROTECTED: ' + (gameState.maxCivilians - gameState.civiliansCasualties) + '\n' +
                  'SLOPE ELEVATION: ' + gameState.slopeElevation + 'm';

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'ski-resort-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.7); padding: 10px; border: 1px solid #00FF00; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #00FF00;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'S') {
        lastSKeyTime = now;
      }

      if (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'R') {
        if (now - lastSKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF00; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.8); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #00FF00; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastRKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene with alpine atmosphere
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xCCEEFF, 0.04);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.9);
    directionalLight.position.set(30, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create terrain and structures
    createSnowCoveredMountainSlope();
    createPineTrees();

    // Create lodge
    createSkiLodgeChalet();

    // Create ski lift
    var cableData = createSkiLiftTowers();
    for (var i = 0; i < 3; i++) {
      createCableCar(cableData, i);
    }

    // Create slalom course
    createSlalomPoles();

    // Create equipment and features
    createSkiEquipmentRack();
    snowCannon = createSnowCannon();

    // Create enemies
    createStationarySniper();
    for (var j = 0; j < 3; j++) {
      createMercenarySkier(40 - (j * 15));
    }

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateCableCars(delta);
    updateSnowCannon(delta);
    updateSnowParticles(delta);
    updateSlalomFlags(delta);
    updateMercenaries(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    cableCars = [];
    slalomPoles = [];
    snowParticles = [];
    snowCannon = null;
    gameState.targetsEliminated = 0;
    gameState.civiliansCasualties = 0;
    gameState.slopeElevation = 3200;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
