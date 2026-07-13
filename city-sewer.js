var window = window || {};

window.CitySewer = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    districtsCleared: 0,
    maxDistricts: 3,
    membersDown: 0,
    waterLevel: 0,
    waterLevelMax: 100
  };
  var waterCascades = [];
  var graffiti = [];
  var drips = [];
  var elapsedTime = 0;
  var lastCKeyTime = 0;
  var lastWKeyTime = 0;
  var hudVisible = true;
  var keybindCooldown = 0;

  // Initialize the game
  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    sceneObjects = [];
    enemies = [];
    waterCascades = [];
    graffiti = [];
    drips = [];
    elapsedTime = 0;
    gameState.districtsCleared = 0;
    gameState.membersDown = 0;
    gameState.waterLevel = 50;

    // Set up fog for underground atmosphere
    scene.fog = new THREE.Fog(0x1a2a3a, 50, 200);
    scene.background = new THREE.Color(0x0d1520);

    // Create lighting
    createLighting();

    // Create environment
    createConcreteWalls();
    createManholes();
    createWaterfalls();
    createGraffiti();
    createBarricades();
    createDrainageGrates();
    createEmergencyLadder();

    // Create enemies (mutant gang members)
    createEnemies();

    // Set up HUD
    updateHUD();
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0x4a6fa5, 0.5);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x8899ff, 0.6);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    var pointLight1 = new THREE.PointLight(0x4488cc, 0.8, 40);
    pointLight1.position.set(-15, 3, 0);
    scene.add(pointLight1);
    sceneObjects.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0x4488cc, 0.8, 40);
    pointLight2.position.set(15, 3, -20);
    scene.add(pointLight2);
    sceneObjects.push(pointLight2);
  }

  function createConcreteWalls() {
    // Main corridor floor
    var floorGeometry = new THREE.BoxGeometry(30, 0.5, 60);
    var concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeometry, concreteMaterial);
    floor.position.y = -0.25;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Left wall
    var leftWallGeometry = new THREE.BoxGeometry(1, 8, 60);
    var leftWall = new THREE.Mesh(leftWallGeometry, concreteMaterial);
    leftWall.position.set(-15, 4, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    sceneObjects.push(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(leftWallGeometry, concreteMaterial);
    rightWall.position.set(15, 4, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    sceneObjects.push(rightWall);

    // Ceiling with patches
    var ceilingGeometry = new THREE.BoxGeometry(30, 0.5, 60);
    var ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.05
    });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 8.25;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    sceneObjects.push(ceiling);

    // Side alcoves/branching corridors
    var alcoveGeometry = new THREE.BoxGeometry(3, 6, 12);
    var alcoveMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.85
    });

    for (var i = 0; i < 3; i++) {
      var alcove = new THREE.Mesh(alcoveGeometry, alcoveMaterial);
      alcove.position.set(-12, 3, -20 + i * 20);
      alcove.castShadow = true;
      alcove.receiveShadow = true;
      scene.add(alcove);
      sceneObjects.push(alcove);

      var alcove2 = new THREE.Mesh(alcoveGeometry, alcoveMaterial);
      alcove2.position.set(12, 3, -20 + i * 20);
      alcove2.castShadow = true;
      alcove2.receiveShadow = true;
      scene.add(alcove2);
      sceneObjects.push(alcove2);
    }
  }

  function createManholes() {
    // Circular manhole entrances in ceiling as cylinder discs
    var manholeGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    var manholeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.6,
      roughness: 0.4
    });

    var manholeMaterial2 = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2
    });

    var positions = [[-10, 7.8, -15], [0, 7.8, 0], [10, 7.8, 20]];

    positions.forEach(function(pos, index) {
      var manhole = new THREE.Mesh(manholeGeometry, index === 1 ? manholeMaterial2 : manholeMaterial);
      manhole.position.set(pos[0], pos[1], pos[2]);
      manhole.rotation.x = Math.PI / 2;
      manhole.castShadow = true;
      manhole.receiveShadow = true;
      scene.add(manhole);
      sceneObjects.push(manhole);

      // Manhole cover grid pattern
      var gridGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.1, 32);
      var gridMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      var grid = new THREE.Mesh(gridGeometry, gridMaterial);
      grid.position.set(pos[0], pos[1] + 0.2, pos[2]);
      grid.rotation.x = Math.PI / 2;
      grid.castShadow = true;
      grid.receiveShadow = true;
      scene.add(grid);
      sceneObjects.push(grid);
    });
  }

  function createWaterfalls() {
    // Cascading waterfalls - thin boxes with emissive blue
    var waterfallMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });

    var positions = [[-8, 7, -10], [5, 7, 5], [-3, 7, 25]];

    positions.forEach(function(pos) {
      var waterfallGeometry = new THREE.BoxGeometry(0.5, 8, 0.2);
      var waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
      waterfall.position.set(pos[0], pos[1], pos[2]);
      waterfall.castShadow = true;
      waterfall.receiveShadow = true;
      scene.add(waterfall);
      sceneObjects.push(waterfall);

      waterCascades.push({
        mesh: waterfall,
        baseY: pos[1],
        scrollOffset: 0,
        speed: 2
      });
    });
  }

  function createGraffiti() {
    // Gang territory markings - emissive spray paint shapes on walls
    var graffitiMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff1100,
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.6
    });

    var positions = [
      { pos: [-14.8, 5, -15], size: 2 },
      { pos: [14.8, 4, 10], size: 1.8 },
      { pos: [-14.8, 6, 20], size: 2.2 },
      { pos: [14.8, 5, -25], size: 1.5 }
    ];

    positions.forEach(function(item) {
      var graffitiGeometry = new THREE.BoxGeometry(item.size, item.size * 0.8, 0.1);
      var graffiti = new THREE.Mesh(graffitiGeometry, graffitiMaterial);
      graffiti.position.set(item.pos[0], item.pos[1], item.pos[2]);
      graffiti.castShadow = true;
      scene.add(graffiti);
      sceneObjects.push(graffiti);

      graffiti.graffitiData = {
        pulseIntensity: 0.5,
        pulseSpeed: 3
      };
    });
  }

  function createBarricades() {
    // Barricades of junk - irregular box clusters
    var junkMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.95,
      metalness: 0.1
    });

    var boxSizes = [
      [1.5, 2, 1],
      [1, 1.5, 0.8],
      [1.2, 1.8, 1.2],
      [0.8, 1, 0.9]
    ];

    var barricadePositions = [[0, 2, -25], [-6, 2, 15], [8, 2, 5]];

    barricadePositions.forEach(function(basePos) {
      boxSizes.forEach(function(size, index) {
        var junkGeometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        var junk = new THREE.Mesh(junkGeometry, junkMaterial);
        junk.position.set(
          basePos[0] + (index - 1.5) * 0.8,
          basePos[1] + (index % 2) * 1.5,
          basePos[2] + (index - 1.5) * 0.6
        );
        junk.rotation.y = Math.random() * Math.PI;
        junk.castShadow = true;
        junk.receiveShadow = true;
        scene.add(junk);
        sceneObjects.push(junk);
      });
    });
  }

  function createDrainageGrates() {
    // Drainage grates - LineSegments grid pattern
    var grayColor = new THREE.Color(0x555555);
    var points = [];

    // Create grid pattern on floor
    var gridSize = 28;
    var gridSpacing = 2;

    for (var x = -gridSize / 2; x <= gridSize / 2; x += gridSpacing) {
      points.push(new THREE.Vector3(x, 0.1, -gridSize / 2));
      points.push(new THREE.Vector3(x, 0.1, gridSize / 2));
    }

    for (var z = -gridSize / 2; z <= gridSize / 2; z += gridSpacing) {
      points.push(new THREE.Vector3(-gridSize / 2, 0.1, z));
      points.push(new THREE.Vector3(gridSize / 2, 0.1, z));
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(points.flatMap(function(p) { return [p.x, p.y, p.z]; })),
      3
    ));

    var lineMaterial = new THREE.LineBasicMaterial({ color: grayColor, linewidth: 2 });
    var gridLines = new THREE.LineSegments(geometry, lineMaterial);
    scene.add(gridLines);
    sceneObjects.push(gridLines);
  }

  function createEmergencyLadder() {
    // Emergency exit ladder - box rungs in shaft
    var shaftGeometry = new THREE.BoxGeometry(1.5, 15, 0.5);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.6,
      roughness: 0.4
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(-12, 7.5, 25);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    scene.add(shaft);
    sceneObjects.push(shaft);

    // Rungs
    var rungMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa8844,
      metalness: 0.5,
      roughness: 0.6
    });

    for (var i = 0; i < 10; i++) {
      var rungGeometry = new THREE.BoxGeometry(1.8, 0.2, 0.3);
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(-12, 1 + i * 1.3, 25);
      rung.castShadow = true;
      rung.receiveShadow = true;
      scene.add(rung);
      sceneObjects.push(rung);
    }
  }

  function createEnemies() {
    // District 1 - Mutant gang members
    for (var i = 0; i < 3; i++) {
      createMutantMember(-10 + i * 3, 1.5, -15);
    }

    // District 2
    for (var i = 0; i < 3; i++) {
      createMutantMember(-8 + i * 4, 1.5, 5);
    }

    // District 3
    for (var i = 0; i < 2; i++) {
      createMutantMember(0 + i * 5, 1.5, 25);
    }

    // Boss mutants
    createBossMutant(-12, 1.5, -20);
    createBossMutant(10, 1.5, 10);
    createBossMutant(5, 1.5, 28);
  }

  function createMutantMember(x, y, z) {
    var group = new THREE.Group();

    // Body (green-tinted box)
    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var greenMaterial = new THREE.MeshStandardMaterial({
      color: 0x229922,
      roughness: 0.7,
      metalness: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, greenMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (smaller box)
    var headGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.4);
    var head = new THREE.Mesh(headGeometry, greenMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Spiked head accessory (cone)
    var spikeGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
    var spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3
    });
    var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spike.position.y = 2.1;
    spike.castShadow = true;
    spike.receiveShadow = true;
    group.add(spike);

    // Arms (small boxes)
    var armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    var leftArm = new THREE.Mesh(armGeometry, greenMaterial);
    leftArm.position.set(-0.4, 1, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, greenMaterial);
    rightArm.position.set(0.4, 1, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    group.add(rightArm);

    group.position.set(x, y, z);
    group.enemyData = {
      health: 100,
      type: 'mutant',
      district: Math.floor((z + 30) / 20)
    };

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
  }

  function createBossMutant(x, y, z) {
    var group = new THREE.Group();

    // Large body
    var bodyGeometry = new THREE.BoxGeometry(1, 1.8, 0.6);
    var bossMaterial = new THREE.MeshStandardMaterial({
      color: 0x117722,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x004400,
      emissiveIntensity: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bossMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Large head
    var headGeometry = new THREE.BoxGeometry(0.7, 0.8, 0.6);
    var head = new THREE.Mesh(headGeometry, bossMaterial);
    head.position.y = 2.1;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Multiple spikes
    var spikeGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
    var spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });

    for (var i = 0; i < 3; i++) {
      var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(
        (i - 1) * 0.4,
        2.8 + (i % 2) * 0.2,
        0
      );
      spike.castShadow = true;
      spike.receiveShadow = true;
      group.add(spike);
    }

    // Large arms
    var armGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
    var leftArm = new THREE.Mesh(armGeometry, bossMaterial);
    leftArm.position.set(-0.7, 1.2, 0);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, bossMaterial);
    rightArm.position.set(0.7, 1.2, 0);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    group.add(rightArm);

    group.position.set(x, y, z);
    group.enemyData = {
      health: 250,
      type: 'boss',
      district: Math.floor((z + 30) / 20)
    };

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
  }

  function updateHUD() {
    var hudText = 'DISTRICT CLEARED: ' + gameState.districtsCleared + '/' + gameState.maxDistricts +
      ' | GANG MEMBERS DOWN: ' + gameState.membersDown +
      ' | WATER LEVEL: ' + (gameState.waterLevel > 60 ? 'RISING' : (gameState.waterLevel < 40 ? 'LOW' : 'NORMAL'));

    if (hudElement && typeof hudElement.textContent !== 'undefined') {
      hudElement.textContent = hudText;
    }
  }

  function updateWaterfalls(delta) {
    waterCascades.forEach(function(cascade) {
      cascade.scrollOffset += delta * cascade.speed;
      cascade.scrollOffset = cascade.scrollOffset % 8;

      // Animate vertical position for flowing effect
      var offset = Math.sin(elapsedTime * cascade.speed) * 0.3;
      cascade.mesh.position.y = cascade.baseY + offset;
    });
  }

  function updateDrips(delta) {
    for (var i = drips.length - 1; i >= 0; i--) {
      var drip = drips[i];
      drip.position.y -= delta * drip.speed;

      if (drip.position.y < -5) {
        scene.remove(drip);
        sceneObjects.splice(sceneObjects.indexOf(drip), 1);
        drips.splice(i, 1);
      }
    }
  }

  function updateGraffiti(delta) {
    sceneObjects.forEach(function(obj) {
      if (obj.graffitiData) {
        var pulseValue = 0.3 + Math.sin(elapsedTime * obj.graffitiData.pulseSpeed) * 0.3;
        if (obj.material && obj.material.emissiveIntensity !== undefined) {
          obj.material.emissiveIntensity = pulseValue;
        }
      }
    });
  }

  function spawnDrip(x, z) {
    var dripGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    var dripMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.4,
      metalness: 0.3
    });
    var drip = new THREE.Mesh(dripGeometry, dripMaterial);
    drip.position.set(x, 7.5, z);
    drip.castShadow = true;
    drip.receiveShadow = true;
    drip.speed = 5 + Math.random() * 3;

    scene.add(drip);
    sceneObjects.push(drip);
    drips.push(drip);
  }

  function handleKeybind() {
    // C+W keybind for toggling HUD (C then W within 400ms)
    if (keybindCooldown > 0) {
      keybindCooldown--;
    }
  }

  function toggleHUD() {
    hudVisible = !hudVisible;
    if (hudElement && hudElement.style) {
      hudElement.style.display = hudVisible ? 'block' : 'none';
    }

    if (hudVisible) {
      // Show brief notification
      if (hudElement && hudElement.textContent) {
        var originalText = hudElement.textContent;
        hudElement.textContent = 'HUD: ON';
        setTimeout(function() {
          hudElement.textContent = originalText;
        }, 1000);
      }
    }
  }

  // Update function called each frame
  function update(delta) {
    elapsedTime += delta;
    handleKeybind();
    updateWaterfalls(delta);
    updateDrips(delta);
    updateGraffiti(delta);

    // Randomly spawn drips
    if (Math.random() < 0.02) {
      var dripX = -12 + Math.random() * 24;
      var dripZ = -25 + Math.random() * 50;
      spawnDrip(dripX, dripZ);
    }

    // Simulate water level changes
    gameState.waterLevel += (Math.random() - 0.48) * 0.5;
    gameState.waterLevel = Math.max(10, Math.min(100, gameState.waterLevel));

    updateHUD();
  }

  // Reset function - clear all scene objects
  function reset() {
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });
    waterCascades = [];
    drips = [];
    sceneObjects = [];
    enemies = [];
    elapsedTime = 0;
    gameState.districtsCleared = 0;
    gameState.membersDown = 0;
    gameState.waterLevel = 50;
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset,
    toggleHUD: toggleHUD,
    getGameState: function() { return gameState; },
    getEnemies: function() { return enemies; },
    setHUDElement: function(element) { hudElement = element; },
    onCKeyPressed: function() {
      if (lastCKeyTime && Date.now() - lastCKeyTime < 400) {
        toggleHUD();
      }
      lastCKeyTime = Date.now();
    },
    onWKeyPressed: function() {
      if (lastWKeyTime && Date.now() - lastWKeyTime < 400) {
        toggleHUD();
      }
      lastWKeyTime = Date.now();
    }
  };
}());
