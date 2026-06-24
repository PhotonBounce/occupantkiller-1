var window = window || {};

window.SubmarineDock = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    subsDisabled: 0,
    maxSubs: 3,
    missilesLoaded: 2,
    maxMissiles: 8,
    missileBlocked: 0,
    floodingTime: 240000 // 4 minutes in milliseconds
  };
  var submarine = null;
  var craneArm = null;
  var waterSurface = null;
  var gantryFrame = null;
  var bubbles = [];
  var elapsedTime = 0;
  var lastSKeyTime = 0;
  var lastDKeyTime = 0;
  var hudVisible = true;
  var docklights = [];

  function createSubmarineDock() {
    var group = new THREE.Group();

    // Main submarine hull (large cylinder body)
    var hullGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 16);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a3a, metalness: 0.6, roughness: 0.4 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 2;
    hull.rotation.z = Math.PI / 2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // Conning tower (box on top of hull)
    var towerGeometry = new THREE.BoxGeometry(1, 2, 1.2);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x0d1f1f, metalness: 0.7, roughness: 0.3 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 4.5, -2);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Torpedo tubes (small cylinders along hull)
    var tubeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a4a, metalness: 0.8, roughness: 0.2 });

    var tubePositions = [
      [1.5, 2, -2],
      [1.5, 2, 0],
      [1.5, 2, 2],
      [-1.5, 2, -2],
      [-1.5, 2, 0],
      [-1.5, 2, 2]
    ];

    tubePositions.forEach(function(pos) {
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.rotation.z = Math.PI / 2;
      tube.position.set(pos[0], pos[1], pos[2]);
      tube.castShadow = true;
      tube.receiveShadow = true;
      group.add(tube);
    });

    group.position.set(0, 0, -5);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createDockPlatform() {
    // Walkway platform alongside submarine
    var platformGeometry = new THREE.BoxGeometry(4, 0.3, 10);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5a5a, roughness: 0.7 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(3.5, 0.15, -5);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);

    // Railings (boxes)
    var railGeometry = new THREE.BoxGeometry(0.2, 1.2, 10);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });

    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(5.2, 0.6, -5);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    scene.add(rail1);
    sceneObjects.push(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(1.8, 0.6, -5);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    scene.add(rail2);
    sceneObjects.push(rail2);
  }

  function createCrane() {
    var group = new THREE.Group();

    // Mast (tall vertical box)
    var mastGeometry = new THREE.BoxGeometry(0.4, 12, 0.4);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 6;
    mast.castShadow = true;
    mast.receiveShadow = true;
    group.add(mast);

    // Base platform
    var baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Horizontal arm (rotates)
    var armGeometry = new THREE.BoxGeometry(0.3, 0.3, 6);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, 10, -1);
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);

    // Hook cable (line segment)
    var cableGeometry = new THREE.BufferGeometry();
    var cableVertices = new Float32Array([
      0, 10, -4,
      0, 5, -4
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA, linewidth: 1 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    group.add(cable);

    group.position.set(-8, 0, -5);
    group.craneData = { armRotation: 0 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createMissileGantry() {
    var group = new THREE.Group();

    // Vertical frame supports (4 corner pillars)
    var pillarGeometry = new THREE.BoxGeometry(0.3, 5, 0.3);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });

    var pillarPositions = [
      [-2, 2.5, -2],
      [2, 2.5, -2],
      [-2, 2.5, -8],
      [2, 2.5, -8]
    ];

    pillarPositions.forEach(function(pos) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], pos[1], pos[2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    });

    // Horizontal cross-beams (top frame)
    var beamGeometry = new THREE.BoxGeometry(4.6, 0.2, 0.2);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });

    var beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam1.position.set(0, 5, -2);
    beam1.castShadow = true;
    beam1.receiveShadow = true;
    group.add(beam1);

    var beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam2.position.set(0, 5, -8);
    beam2.castShadow = true;
    beam2.receiveShadow = true;
    group.add(beam2);

    var beamZ = new THREE.BoxGeometry(0.2, 0.2, 6.3);
    var beam3 = new THREE.Mesh(beamZ, beamMaterial);
    beam3.position.set(-2, 5, -5);
    beam3.castShadow = true;
    beam3.receiveShadow = true;
    group.add(beam3);

    var beam4 = new THREE.Mesh(beamZ, beamMaterial);
    beam4.position.set(2, 5, -5);
    beam4.castShadow = true;
    beam4.receiveShadow = true;
    group.add(beam4);

    group.position.set(0, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createCaveCeiling() {
    // Large arcing cave ceiling (inverted box approximation)
    var ceilingGeometry = new THREE.BoxGeometry(30, 2, 25);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a3a, roughness: 0.9 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 11, -5);
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    sceneObjects.push(ceiling);

    // Cave walls (surrounding boxes)
    var wallGeometry = new THREE.BoxGeometry(30, 12, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2a2a, roughness: 0.95 });

    var wallFront = new THREE.Mesh(wallGeometry, wallMaterial);
    wallFront.position.set(0, 6, 5);
    wallFront.receiveShadow = true;
    scene.add(wallFront);
    sceneObjects.push(wallFront);

    var wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, 6, -15);
    wallBack.receiveShadow = true;
    scene.add(wallBack);
    sceneObjects.push(wallBack);

    var wallLeft = new THREE.BoxGeometry(1, 12, 25);
    var wLeft = new THREE.Mesh(wallLeft, wallMaterial);
    wLeft.position.set(-15, 6, -5);
    wLeft.receiveShadow = true;
    scene.add(wLeft);
    sceneObjects.push(wLeft);

    var wallRight = new THREE.Mesh(wallLeft, wallMaterial);
    wallRight.position.set(15, 6, -5);
    wallRight.receiveShadow = true;
    scene.add(wallRight);
    sceneObjects.push(wallRight);

    // Cave floor
    var floorGeometry = new THREE.BoxGeometry(30, 1, 25);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x3a4a4a, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -0.5, -5);
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function createDockWater() {
    // Dark emissive water surface
    var waterGeometry = new THREE.BoxGeometry(20, 0.2, 12);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a2a,
      emissive: 0x001a2a,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.1
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 0.8, -5);
    water.receiveShadow = true;
    scene.add(water);
    sceneObjects.push(water);
    return water;
  }

  function createMooringBollards() {
    // Cylindrical posts with rope lines
    var bollardGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 12);
    var bollardMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });

    var positions = [
      [-8, 1, 0],
      [-8, 1, -10],
      [8, 1, 0],
      [8, 1, -10]
    ];

    positions.forEach(function(pos) {
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      bollard.position.set(pos[0], pos[1], pos[2]);
      bollard.castShadow = true;
      bollard.receiveShadow = true;
      scene.add(bollard);
      sceneObjects.push(bollard);

      // Add rope line segments between bollards
      if (pos[0] === -8) {
        var ropeGeometry = new THREE.BufferGeometry();
        var ropeVertices = new Float32Array([
          pos[0], pos[1], pos[2],
          0, 1, pos[2]
        ]);
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropeVertices, 3));
        var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
        var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
        scene.add(rope);
        sceneObjects.push(rope);
      }
    });
  }

  function createLightingRigs() {
    // Overhead industrial dock lights
    for (var i = 0; i < 8; i++) {
      var light = new THREE.PointLight(0xCCCCAA, 1.2, 20);
      light.position.set(
        -12 + (i % 4) * 8,
        10,
        -2 + Math.floor(i / 4) * 8
      );
      light.castShadow = true;
      scene.add(light);
      docklights.push({
        light: light,
        baseIntensity: 1.2,
        flicker: Math.random() * Math.PI * 2
      });
    }
  }

  function createBubbles() {
    // Create initial bubble particles rising from submarine hull
    var bubbleCount = 5;
    for (var i = 0; i < bubbleCount; i++) {
      var bubble = {
        position: new THREE.Vector3(
          Math.random() * 2 - 1,
          1 + Math.random(),
          -5 + Math.random() * 2 - 1
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.05 + Math.random() * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        radius: 0.1 + Math.random() * 0.1,
        lifespan: 3 + Math.random() * 2,
        age: 0
      };
      bubbles.push(bubble);
    }
  }

  function createNavalCrew() {
    // Naval crew guarding the dock
    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      // Body (box)
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a4a5a, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.6;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.22, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, roughness: 0.7 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.3;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      // Helmet light (emissive sphere)
      var lightGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFCCAA,
        emissive: 0xFFCCAA,
        emissiveIntensity: 0.7
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, 1.35, 0.2);
      group.add(light);

      // Arms (cylinders)
      var armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
      var armMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a6a, roughness: 0.8 });

      var armLeft = new THREE.Mesh(armGeometry, armMaterial);
      armLeft.position.set(-0.35, 0.8, 0);
      armLeft.rotation.z = Math.PI / 4;
      armLeft.castShadow = true;
      armLeft.receiveShadow = true;
      group.add(armLeft);

      var armRight = new THREE.Mesh(armGeometry, armMaterial);
      armRight.position.set(0.35, 0.8, 0);
      armRight.rotation.z = -Math.PI / 4;
      armRight.castShadow = true;
      armRight.receiveShadow = true;
      group.add(armRight);

      group.enemyData = {
        position: new THREE.Vector3(
          -6 + i * 6,
          0.6,
          -8 + Math.random() * 6
        ),
        speed: 0.015 + Math.random() * 0.01,
        health: 80
      };
      group.position.copy(group.enemyData.position);
      group.castShadow = true;
      group.receiveShadow = true;

      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    }
  }

  function createSpecialForces() {
    // Special forces elite guards
    for (var i = 0; i < 2; i++) {
      var group = new THREE.Group();

      // Tactical body
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.3, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.9 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.65;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.24, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      // Visor (emissive line)
      var visorGeometry = new THREE.BufferGeometry();
      var visorVertices = new Float32Array([
        -0.15, 1.35, 0.2,
        0.15, 1.35, 0.2
      ]);
      visorGeometry.setAttribute('position', new THREE.BufferAttribute(visorVertices, 3));
      var visorMaterial = new THREE.LineBasicMaterial({ color: 0xFF3300, linewidth: 3 });
      var visor = new THREE.LineSegments(visorGeometry, visorMaterial);
      group.add(visor);

      group.enemyData = {
        position: new THREE.Vector3(
          -4 + i * 8,
          0.65,
          -2 + Math.random() * 4
        ),
        speed: 0.025 + Math.random() * 0.01,
        health: 120
      };
      group.position.copy(group.enemyData.position);
      group.castShadow = true;
      group.receiveShadow = true;

      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    }
  }

  function updateCraneArm(delta) {
    if (!craneArm) return;

    var data = craneArm.craneData;
    data.armRotation += 0.015;
    if (data.armRotation > Math.PI * 2) {
      data.armRotation -= Math.PI * 2;
    }

    craneArm.children.forEach(function(child) {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
        if (child.position.z < 0) {
          child.rotation.y = data.armRotation;
        }
      }
    });
  }

  function updateWaterRipples(delta) {
    if (!waterSurface) return;

    var rippleAmount = Math.sin(elapsedTime * 2) * 0.02;
    waterSurface.position.y = 0.8 + rippleAmount;
  }

  function updateBubbles(delta) {
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var bubble = bubbles[i];
      bubble.age += delta;

      if (bubble.age > bubble.lifespan) {
        bubbles.splice(i, 1);
        continue;
      }

      bubble.position.add(bubble.velocity);
      bubble.position.y = Math.max(0.5, bubble.position.y);
    }

    // Create new bubbles periodically
    if (Math.floor(elapsedTime * 2) % 3 === 0 && bubbles.length < 12) {
      var newBubble = {
        position: new THREE.Vector3(
          Math.random() * 2 - 1,
          1 + Math.random(),
          -5 + Math.random() * 2 - 1
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0.05 + Math.random() * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        radius: 0.08 + Math.random() * 0.08,
        lifespan: 2 + Math.random() * 1.5,
        age: 0
      };
      bubbles.push(newBubble);
    }
  }

  function updateDocklights(delta) {
    docklights.forEach(function(rig) {
      var flicker = Math.sin(elapsedTime * 1.5 + rig.flicker) * 0.15 + 1;
      rig.light.intensity = rig.baseIntensity * flicker;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;

      // Patrol movement
      data.position.x += Math.sin(elapsedTime * 0.3 + data.position.x) * data.speed;
      data.position.z += data.speed * 0.5;

      if (data.position.z > 0) {
        data.position.z = -10;
      }
      if (data.position.x > 10) {
        data.position.x = -10;
      }
      if (data.position.x < -10) {
        data.position.x = 10;
      }

      enemy.position.copy(data.position);
    });
  }

  function formatTime(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updateHUD() {
    if (!hudElement) return;

    var floodTimeRemaining = Math.max(0, gameState.floodingTime - (elapsedTime * 1000));
    var hudText = 'SUBS DISABLED: ' + gameState.subsDisabled + '/' + gameState.maxSubs + '\n' +
                  'MISSILES LOADED: ' + gameState.missilesLoaded + '/' + gameState.maxMissiles + ' BLOCKED\n' +
                  'DOCK FLOODING IN: ' + formatTime(floodTimeRemaining);

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'submarine-dock-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 12px; border: 2px solid #00FF00; ' +
                                  'z-index: 100; text-shadow: 0 0 8px #00FF00; line-height: 1.6;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();
      var key = event.key.toLowerCase();

      if (key === 's') {
        lastSKeyTime = now;
      }

      if (key === 'd') {
        if (now - lastSKeyTime < 400 && now - lastSKeyTime > 0) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ACTIVE' : 'HUD: HIDDEN';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF00; font-family: monospace; font-size: 18px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px 30px; z-index: 200; ' +
                                'border: 2px solid #00FF00; pointer-events: none; ' +
                                'text-shadow: 0 0 8px #00FF00;';
          document.body.appendChild(notif);
          setTimeout(function() {
            if (notif.parentNode) {
              notif.parentNode.removeChild(notif);
            }
          }, 800);
        }
        lastDKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x0a1515);
    scene.fog = new THREE.FogExp2(0x050a0f, 0.05);

    // Ambient lighting for cave
    var ambientLight = new THREE.AmbientLight(0x203040, 0.5);
    scene.add(ambientLight);

    // Main directional light (submarine pen work light)
    var directionalLight = new THREE.DirectionalLight(0xCCCCAA, 0.8);
    directionalLight.position.set(8, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -5;
    scene.add(directionalLight);

    // Create dock environment
    createCaveCeiling();
    createDockWater();
    waterSurface = createDockWater();

    // Create submarine and equipment
    submarine = createSubmarineDock();
    createDockPlatform();
    craneArm = createCrane();
    gantryFrame = createMissileGantry();

    // Create structural elements
    createMooringBollards();
    createLightingRigs();

    // Initialize bubbles
    createBubbles();

    // Create enemies
    createNavalCrew();
    createSpecialForces();

    // Setup HUD and controls
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateCraneArm(delta);
    updateWaterRipples(delta);
    updateBubbles(delta);
    updateDocklights(delta);
    updateEnemies(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            if (mat && mat.dispose) {
              mat.dispose();
            }
          });
        } else if (obj.material && obj.material.dispose) {
          obj.material.dispose();
        }
      }
      if (obj.children && obj.children.length > 0) {
        obj.children.forEach(function(child) {
          if (child.geometry && child.geometry.dispose) {
            child.geometry.dispose();
          }
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
        });
      }
    });

    // Remove all lights except essential scene lighting
    var lightsToRemove = [];
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(function(light) {
      scene.remove(light);
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    bubbles = [];
    docklights = [];
    submarine = null;
    craneArm = null;
    waterSurface = null;
    gantryFrame = null;
    gameState.subsDisabled = 0;
    gameState.missilesLoaded = 2;
    gameState.missileBlocked = 0;
    elapsedTime = 0;
    hudVisible = true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
