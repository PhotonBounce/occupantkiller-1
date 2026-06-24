var window = window || {};

window.CrashedSatellite = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    blackBoxSecured: false,
    agentsDown: 0,
    totalAgents: 6,
    extractionTimeLeft: 180,
    agentSpawnPositions: [
      { x: -15, y: 0.5, z: 25 },
      { x: 15, y: 0.5, z: 25 },
      { x: -20, y: 0.5, z: 10 },
      { x: 20, y: 0.5, z: 10 },
      { x: -10, y: 0.5, z: -10 },
      { x: 10, y: 0.5, z: -10 }
    ]
  };
  var recoveryDrone = null;
  var blackBox = null;
  var debrisLights = [];
  var elapsedTime = 0;
  var lastCKeyTime = 0;
  var lastSKeyTime = 0;
  var hudVisible = true;
  var craterRim = null;
  var terrainRocks = [];

  function createImpactCrater() {
    // Large flat depression ground plane representing crater
    var craterGeometry = new THREE.BoxGeometry(80, 0.3, 80);
    var craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0.1
    });
    var craterBase = new THREE.Mesh(craterGeometry, craterMaterial);
    craterBase.position.set(0, -0.5, 0);
    craterBase.receiveShadow = true;
    scene.add(craterBase);
    sceneObjects.push(craterBase);

    // Crater rim (raised edge) using cylinders and boxes
    var rimGeometry = new THREE.CylinderGeometry(40, 42, 2, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x996633,
      roughness: 0.85
    });
    craterRim = new THREE.Mesh(rimGeometry, rimMaterial);
    craterRim.position.set(0, 0.8, 0);
    craterRim.castShadow = true;
    craterRim.receiveShadow = true;
    scene.add(craterRim);
    sceneObjects.push(craterRim);

    // Crater interior wall detail
    var wallGeometry = new THREE.CylinderGeometry(39, 40, 3, 32);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5344,
      roughness: 0.9
    });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, -1, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    sceneObjects.push(wall);
  }

  function createTerrainRocks() {
    // Scattered rocks around crash site
    var rockPositions = [
      { x: -35, z: -30, s: 2.5 },
      { x: 35, z: -25, s: 2 },
      { x: -30, z: 35, s: 2.2 },
      { x: 32, z: 33, s: 1.8 },
      { x: -5, z: -40, s: 2.8 },
      { x: 10, z: 40, s: 2.1 }
    ];

    rockPositions.forEach(function(pos) {
      var rockGeometry = new THREE.SphereGeometry(pos.s, 8, 8);
      var rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x6B5344,
        roughness: 0.95
      });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(pos.x, pos.s * 0.5, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      sceneObjects.push(rock);
      terrainRocks.push(rock);
    });
  }

  function createSatelliteWreckage() {
    // Main satellite body (large box with damage)
    var bodyGeometry = new THREE.BoxGeometry(6, 4, 8);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.5, 0);
    body.rotation.z = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    // Satellite antenna cylinder (bent/broken)
    var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 16);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.9,
      roughness: 0.2
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(3.5, 3, 2);
    antenna.rotation.z = 0.6;
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    scene.add(antenna);
    sceneObjects.push(antenna);

    // Scattered debris boxes (various sizes)
    var debrisPositions = [
      { x: -4, y: 0.8, z: -3, sx: 1, sy: 0.5, sz: 1.5 },
      { x: 5, y: 0.6, z: 4, sx: 0.8, sy: 0.4, sz: 1 },
      { x: -2, y: 0.5, z: 2, sx: 0.6, sy: 0.3, sz: 0.8 },
      { x: 3, y: 0.7, z: -2, sx: 1.2, sy: 0.5, sz: 0.6 },
      { x: -1, y: 0.4, z: -1, sx: 0.9, sy: 0.3, sz: 1.1 }
    ];

    debrisPositions.forEach(function(pos) {
      var debrisGeometry = new THREE.BoxGeometry(pos.sx, pos.sy, pos.sz);
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.4
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(pos.x, pos.y, pos.z);
      debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      sceneObjects.push(debris);
    });
  }

  function createSolarPanelArrays() {
    // Bent solar panel arrays
    var panelGeometry = new THREE.BoxGeometry(5, 0.1, 3);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      metalness: 0.6,
      roughness: 0.2
    });

    // Panel 1 (broken angle)
    var panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel1.position.set(-8, 1, 3);
    panel1.rotation.set(0.8, 0.2, 0.4);
    panel1.castShadow = true;
    panel1.receiveShadow = true;
    scene.add(panel1);
    sceneObjects.push(panel1);

    // Panel 2 (twisted)
    var panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel2.position.set(8, 2, -2);
    panel2.rotation.set(-0.6, -0.3, 0.5);
    panel2.castShadow = true;
    panel2.receiveShadow = true;
    scene.add(panel2);
    sceneObjects.push(panel2);

    // Panel 3 (mostly detached)
    var panel3 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel3.position.set(0, 3, -6);
    panel3.rotation.set(0.2, 0.4, -0.7);
    panel3.castShadow = true;
    panel3.receiveShadow = true;
    scene.add(panel3);
    sceneObjects.push(panel3);
  }

  function createParabolicDishFragment() {
    // Dish using cylinder + cone
    var dishGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
    var dishMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      metalness: 0.75,
      roughness: 0.3
    });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(-6, 1.2, 6);
    dish.rotation.x = 0.5;
    dish.castShadow = true;
    dish.receiveShadow = true;
    scene.add(dish);
    sceneObjects.push(dish);

    // Cone support structure
    var coneGeometry = new THREE.ConeGeometry(1.5, 2, 16);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.6,
      roughness: 0.4
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(-6, 0.5, 6);
    cone.rotation.z = 0.3;
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    sceneObjects.push(cone);
  }

  function createRecoveryDrone() {
    var group = new THREE.Group();

    // Main body (box)
    var bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Four rotor arms (cylinders extending from body)
    var armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.7,
      roughness: 0.4
    });

    var armPositions = [
      { x: 0.6, z: 0.6 },
      { x: -0.6, z: 0.6 },
      { x: 0.6, z: -0.6 },
      { x: -0.6, z: -0.6 }
    ];

    armPositions.forEach(function(pos) {
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(pos.x, 0.3, pos.z);
      arm.rotation.z = Math.PI / 4;
      arm.castShadow = true;
      arm.receiveShadow = true;
      group.add(arm);
    });

    // Rotors (spinning cylinders on each arm tip)
    var rotorGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    var rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.2
    });

    armPositions.forEach(function(pos) {
      var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      rotor.position.set(pos.x, 0.7, pos.z);
      rotor.rotorData = { rotation: 0 };
      rotor.castShadow = true;
      rotor.receiveShadow = true;
      group.add(rotor);
    });

    // Status light (emissive)
    var lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
      emissiveIntensity: 0.8
    });
    var statusLight = new THREE.Mesh(lightGeometry, lightMaterial);
    statusLight.position.set(0, 0.5, 0);
    group.add(statusLight);

    group.droneData = {
      orbitRadius: 12,
      orbitSpeed: 0.5,
      orbitAngle: 0,
      hoverHeight: 4,
      verticalBob: 0
    };
    group.position.set(12, 4, 0);
    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createBlackBox() {
    var group = new THREE.Group();

    // Main black box (small emissive cube)
    var boxGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);

    // Beacon ring indicator (cylinder)
    var ringGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16);
    var ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x330000,
      emissive: 0xFF6666,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 0.4;
    group.add(ring);

    group.boxData = {
      pulsePhase: 0,
      basePulse: 0.6
    };
    group.position.set(0, 0.5, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEnemyAgent(position) {
    var group = new THREE.Group();

    // Body (dark suit)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Helmet/visor area (dark)
    var helmetGeometry = new THREE.BoxGeometry(0.22, 0.2, 0.15);
    var helmetMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.6,
      roughness: 0.3
    });
    var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(0, 1.4, 0.15);
    group.add(helmet);

    // Weapon (small cylinder)
    var weaponGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    var weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.7,
      roughness: 0.4
    });
    var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.3, 0.8, 0);
    weapon.rotation.z = Math.PI / 4;
    group.add(weapon);

    group.enemyData = {
      position: position.clone(),
      speed: 0.03 + Math.random() * 0.02,
      patrolRadius: 8,
      patrolCenter: position.clone(),
      health: 100
    };
    group.position.copy(position);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function createDebrisLights() {
    // Flickering emissive lights on debris pieces (sparks effect)
    var lightPositions = [
      { x: -4, y: 1.2, z: -3 },
      { x: 5, y: 1.1, z: 4 },
      { x: -2, y: 0.8, z: 2 },
      { x: 3, y: 1.3, z: -2 }
    ];

    lightPositions.forEach(function(pos) {
      var pointLight = new THREE.PointLight(0xFF6600, 0.5, 8);
      pointLight.position.set(pos.x, pos.y, pos.z);
      pointLight.castShadow = true;
      scene.add(pointLight);
      debrisLights.push({
        light: pointLight,
        baseIntensity: 0.5,
        flickerPhase: Math.random() * Math.PI * 2,
        position: pos
      });
    });
  }

  function updateRecoveryDrone(delta) {
    if (!recoveryDrone) return;

    var data = recoveryDrone.droneData;

    // Orbital motion around crater
    data.orbitAngle += data.orbitSpeed * delta;
    var orbitX = Math.cos(data.orbitAngle) * data.orbitRadius;
    var orbitZ = Math.sin(data.orbitAngle) * data.orbitRadius;

    // Vertical bobbing motion
    data.verticalBob += delta * 1.5;
    var bobHeight = Math.sin(data.verticalBob) * 0.5;

    recoveryDrone.position.set(orbitX, data.hoverHeight + bobHeight, orbitZ);

    // Spin rotors
    recoveryDrone.children.forEach(function(child) {
      if (child.rotorData) {
        child.rotorData.rotation += 0.15;
        child.rotation.x = child.rotorData.rotation;
      }
    });

    // Face orbit direction
    recoveryDrone.lookAt(0, data.hoverHeight, 0);
  }

  function updateBlackBox(delta) {
    if (!blackBox) return;

    var data = blackBox.boxData;
    data.pulsePhase += delta * 2;

    var pulseIntensity = data.basePulse + Math.sin(data.pulsePhase) * 0.3;

    blackBox.children.forEach(function(child) {
      if (child.material && child.material.emissive) {
        child.material.emissiveIntensity = pulseIntensity;
      }
    });
  }

  function updateDebrisLights(delta) {
    debrisLights.forEach(function(light) {
      var flicker = Math.sin(elapsedTime * 4 + light.flickerPhase) * 0.4 + 0.6;
      light.light.intensity = light.baseIntensity * flicker;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;

      // Patrol motion around spawn area
      var patrolAngle = elapsedTime * 0.3 + Math.random() * 0.5;
      var patrolX = data.patrolCenter.x + Math.cos(patrolAngle) * data.patrolRadius;
      var patrolZ = data.patrolCenter.z + Math.sin(patrolAngle) * data.patrolRadius;

      data.position.x = patrolX;
      data.position.z = patrolZ;

      enemy.position.copy(data.position);
    });
  }

  function updateGameState(delta) {
    gameState.extractionTimeLeft = Math.max(0, gameState.extractionTimeLeft - delta);
  }

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  function updateHUD() {
    if (!hudElement) return;

    var statusText = gameState.blackBoxSecured ? 'SECURED' : 'NOT SECURED';
    var statusColor = gameState.blackBoxSecured ? '#00FF00' : '#FF0000';

    var hudText = 'BLACK BOX: ' + statusText + '\n' +
                  'AGENTS DOWN: ' + gameState.agentsDown + '/' + gameState.totalAgents + '\n' +
                  'EXTRACTION IN: ' + formatTime(gameState.extractionTimeLeft);

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';

    var lines = hudElement.textContent.split('\n');
    var colorText = 'BLACK BOX: ' + (gameState.blackBoxSecured ? 'SECURED' : 'NOT SECURED');
    if (hudElement.textContent.indexOf('NOT SECURED') !== -1) {
      hudElement.style.color = statusColor;
    } else {
      hudElement.style.color = statusColor;
    }
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'crashed-satellite-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #FF0000; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #FF6600; ' +
                                  'z-index: 100; text-shadow: 0 0 8px #FF6600;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'c') {
        lastCKeyTime = now;
      }

      if (event.key.toLowerCase() === 's') {
        if (now - lastCKeyTime < 400 && lastCKeyTime !== 0) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #FF6600; font-family: monospace; font-size: 20px; font-weight: bold; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 3px solid #FF6600; pointer-events: none; ' +
                                'text-shadow: 0 0 10px #FF6600;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1200);
          lastCKeyTime = 0;
        }
        lastSKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene with desert atmosphere
    scene.background = new THREE.Color(0xD4A574);
    scene.fog = new THREE.FogExp2(0xD4A574, 0.04);

    // Ambient light (dusty desert)
    var ambientLight = new THREE.AmbientLight(0xFFE4B5, 0.7);
    scene.add(ambientLight);

    // Directional light (sun)
    var directionalLight = new THREE.DirectionalLight(0xFFF8DC, 0.8);
    directionalLight.position.set(20, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create crash site structures
    createImpactCrater();
    createTerrainRocks();
    createSatelliteWreckage();
    createSolarPanelArrays();
    createParabolicDishFragment();

    // Create interactive elements
    recoveryDrone = createRecoveryDrone();
    blackBox = createBlackBox();
    createDebrisLights();

    // Create enemy agents
    for (var i = 0; i < gameState.totalAgents; i++) {
      createEnemyAgent(gameState.agentSpawnPositions[i]);
    }

    // Setup HUD and keybinds
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateRecoveryDrone(delta);
    updateBlackBox(delta);
    updateDebrisLights(delta);
    updateEnemies(delta);
    updateGameState(delta);
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
      if (obj.children) {
        obj.children.forEach(function(child) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function(mat) { mat.dispose(); });
            } else {
              child.material.dispose();
            }
          }
        });
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
    debrisLights = [];
    terrainRocks = [];
    recoveryDrone = null;
    blackBox = null;
    craterRim = null;
    gameState.blackBoxSecured = false;
    gameState.agentsDown = 0;
    gameState.extractionTimeLeft = 180;
    elapsedTime = 0;
    lastCKeyTime = 0;
    lastSKeyTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
