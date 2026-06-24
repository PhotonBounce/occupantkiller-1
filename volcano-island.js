var window = window || {};

window.VolcanoIsland = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    missileCountdown: 300,
    silosDisabled: 0,
    maxSilos: 2,
    soldierCount: 0,
    maxSoldiers: 6
  };
  var lavaFlows = [];
  var smokePuffs = [];
  var missileInSilo = null;
  var elapsedTime = 0;
  var lastVKeyTime = 0;
  var lastIKeyTime = 0;
  var hudVisible = true;

  function createVolcanicCone() {
    var coneGeometry = new THREE.ConeGeometry(25, 40, 32);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3d3d,
      roughness: 0.95,
      metalness: 0
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(0, 15, 0);
    cone.castShadow = true;
    cone.receiveShadow = true;
    scene.add(cone);
    sceneObjects.push(cone);
    return cone;
  }

  function createLavaFlows() {
    // Create multiple glowing lava channels flowing down the volcano
    var flowPositions = [
      { pos: [-8, 5, -5], rot: [0.3, 0, 0] },
      { pos: [8, 4, 0], rot: [-0.2, 0.1, 0] },
      { pos: [0, 3, 8], rot: [0.1, 0, 0.2] },
      { pos: [-5, 6, 5], rot: [0.25, 0, -0.1] }
    ];

    flowPositions.forEach(function(flow) {
      var flowGeometry = new THREE.BoxGeometry(1.5, 0.3, 8);
      var flowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF4400,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.2
      });
      var flowMesh = new THREE.Mesh(flowGeometry, flowMaterial);
      flowMesh.position.set(flow.pos[0], flow.pos[1], flow.pos[2]);
      flowMesh.rotation.set(flow.rot[0], flow.rot[1], flow.rot[2]);
      flowMesh.castShadow = true;
      flowMesh.receiveShadow = true;
      scene.add(flowMesh);
      sceneObjects.push(flowMesh);
      lavaFlows.push({ mesh: flowMesh, material: flowMaterial, baseIntensity: 0.6 });
    });
  }

  function createMissileSilo() {
    var group = new THREE.Group();

    // Main shaft (cylinder going into ground)
    var shaftGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 32);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.3
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(0, -7, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Missile body (cone shape inside silo)
    var missileGeometry = new THREE.ConeGeometry(1.5, 6, 16);
    var missileMaterial = new THREE.MeshStandardMaterial({
      color: 0x333399,
      roughness: 0.5,
      metalness: 0.8
    });
    var missile = new THREE.Mesh(missileGeometry, missileMaterial);
    missile.position.set(0, 0, 0);
    missile.castShadow = true;
    missile.receiveShadow = true;
    group.add(missile);
    missileInSilo = { mesh: missile, baseY: 0, maxY: 8 };

    // Silo rim (raised circular edge)
    var rimGeometry = new THREE.CylinderGeometry(2.8, 2.5, 0.5, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 1, 0);
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);

    group.position.set(-15, 0, 10);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createSecondMissileSilo() {
    var group = new THREE.Group();

    var shaftGeometry = new THREE.CylinderGeometry(2, 2.5, 15, 32);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.3
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(0, -7, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    var missileGeometry = new THREE.ConeGeometry(1.5, 6, 16);
    var missileMaterial = new THREE.MeshStandardMaterial({
      color: 0x333399,
      roughness: 0.5,
      metalness: 0.8
    });
    var missile = new THREE.Mesh(missileGeometry, missileMaterial);
    missile.position.set(0, 0, 0);
    missile.castShadow = true;
    missile.receiveShadow = true;
    group.add(missile);

    var rimGeometry = new THREE.CylinderGeometry(2.8, 2.5, 0.5, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 1, 0);
    rim.castShadow = true;
    rim.receiveShadow = true;
    group.add(rim);

    group.position.set(15, 0, 10);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createLaunchControlBunker() {
    var group = new THREE.Group();

    // Main bunker box (concrete structure)
    var bunkerGeometry = new THREE.BoxGeometry(8, 4, 6);
    var bunkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.95,
      metalness: 0.1
    });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(0, 2, 0);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    group.add(bunker);

    // Door frame (darker box)
    var doorGeometry = new THREE.BoxGeometry(2.5, 3, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.4
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2.5, 3.2);
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    // Antenna tower (cylinder on top)
    var antennaGeometry = new THREE.CylinderGeometry(0.15, 0.2, 6, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
      metalness: 0.7
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(3, 7, 0);
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    group.add(antenna);

    group.position.set(-25, 0, -20);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createLavaRocks() {
    // Scattered dark rocks with emissive orange cracks
    var rockPositions = [
      { pos: [-12, 0.5, -15], scale: [1.5, 1.2, 1.3] },
      { pos: [10, 0.4, -12], scale: [1.3, 1.4, 1.2] },
      { pos: [8, 0.6, 8], scale: [1.6, 1.1, 1.4] },
      { pos: [-18, 0.3, 5], scale: [1.2, 1.5, 1.3] },
      { pos: [15, 0.5, -5], scale: [1.4, 1.3, 1.2] },
      { pos: [-8, 0.4, 20], scale: [1.3, 1.2, 1.5] }
    ];

    rockPositions.forEach(function(rock) {
      var rockGeometry = new THREE.BoxGeometry(1, 1, 1);
      var rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        emissive: 0xFF3300,
        emissiveIntensity: 0.2,
        roughness: 0.98,
        metalness: 0
      });
      var rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
      rockMesh.position.set(rock.pos[0], rock.pos[1], rock.pos[2]);
      rockMesh.scale.set(rock.scale[0], rock.scale[1], rock.scale[2]);
      rockMesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      scene.add(rockMesh);
      sceneObjects.push(rockMesh);
    });
  }

  function createPalmTrees() {
    // Tropical palm trees with cylinder trunks and sphere canopies
    var treePositions = [
      { pos: [20, 0, -20], height: 8 },
      { pos: [-22, 0, 18], height: 7.5 },
      { pos: [12, 0, 15], height: 8.5 },
      { pos: [-30, 0, -10], height: 7 },
      { pos: [25, 0, 5], height: 8 }
    ];

    treePositions.forEach(function(tree) {
      var group = new THREE.Group();

      // Trunk (cylinder)
      var trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, tree.height, 12);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B6F47,
        roughness: 0.9,
        metalness: 0
      });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(0, tree.height / 2, 0);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Canopy (sphere)
      var canopyGeometry = new THREE.SphereGeometry(4, 16, 12);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 0.8,
        metalness: 0
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(0, tree.height + 2, 0);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      group.add(canopy);

      group.position.set(tree.pos[0], tree.pos[1], tree.pos[2]);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createRadarDomes() {
    // Radar stations with sphere domes on cylinder bases
    var radarPositions = [
      { pos: [-12, 0, 25] },
      { pos: [18, 0, -25] }
    ];

    radarPositions.forEach(function(radar) {
      var group = new THREE.Group();

      // Base (cylinder)
      var baseGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 16);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.7,
        metalness: 0.3
      });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(0, 1, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      // Dome (sphere)
      var domeGeometry = new THREE.SphereGeometry(2, 16, 12);
      var domeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFCC00,
        roughness: 0.5,
        metalness: 0.6,
        emissive: 0xFF9900,
        emissiveIntensity: 0.3
      });
      var dome = new THREE.Mesh(domeGeometry, domeMaterial);
      dome.position.set(0, 3.5, 0);
      dome.castShadow = true;
      dome.receiveShadow = true;
      group.add(dome);

      group.position.set(radar.pos[0], radar.pos[1], radar.pos[2]);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createSmokePuff(x, y, z) {
    var puffGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var puffMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.6
    });
    var puff = new THREE.Mesh(puffGeometry, puffMaterial);
    puff.position.set(x, y, z);
    scene.add(puff);
    sceneObjects.push(puff);

    var puffData = {
      mesh: puff,
      startY: y,
      maxY: y + 8,
      velocity: 2 + Math.random() * 1,
      lifetime: 3,
      age: 0
    };
    smokePuffs.push(puffData);
    return puffData;
  }

  function createIslandBase() {
    // Sandy ground
    var groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xD2B48C,
      roughness: 0.95,
      metalness: 0
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.set(0, -1, 0);
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
  }

  function createTropicalSoldier() {
    var group = new THREE.Group();

    // Head (small sphere)
    var headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xC79C6D,
      roughness: 0.7,
      metalness: 0
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.6, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Body (tan box)
    var bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xC9A961,
      roughness: 0.8,
      metalness: 0
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Legs (two boxes)
    var legGeometry = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    var legMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.9,
      metalness: 0
    });

    var leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-0.15, 0.35, 0);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    group.add(leg1);

    var leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(0.15, 0.35, 0);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    group.add(leg2);

    // Weapon (rifle - thin cylinder)
    var rifleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
    var rifleMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.3
    });
    var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
    rifle.position.set(0.3, 1.2, 0);
    rifle.rotation.z = Math.PI / 4;
    rifle.castShadow = true;
    rifle.receiveShadow = true;
    group.add(rifle);

    var x = -30 + Math.random() * 60;
    var z = -30 + Math.random() * 60;
    group.position.set(x, 0, z);
    group.soldierData = {
      position: group.position.clone(),
      speed: 2 + Math.random() * 1,
      angle: Math.random() * Math.PI * 2
    };

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    gameState.soldierCount++;

    return group;
  }

  function updateSmokePuffs(delta) {
    var i = smokePuffs.length - 1;
    while (i >= 0) {
      var puff = smokePuffs[i];
      puff.age += delta;

      if (puff.age >= puff.lifetime) {
        scene.remove(puff.mesh);
        var idx = sceneObjects.indexOf(puff.mesh);
        if (idx > -1) sceneObjects.splice(idx, 1);
        smokePuffs.splice(i, 1);
      } else {
        puff.mesh.position.y = puff.startY + (puff.age / puff.lifetime) * 8;
        puff.mesh.material.opacity = 0.6 * (1 - puff.age / puff.lifetime);
      }
      i--;
    }

    // Spawn new smoke puffs periodically
    if (Math.floor(elapsedTime * 2) % 4 === 0 && smokePuffs.length < 8) {
      var offsetX = (Math.random() - 0.5) * 4;
      var offsetZ = (Math.random() - 0.5) * 4;
      createSmokePuff(offsetX, 18, offsetZ);
    }
  }

  function updateLavaFlows(delta) {
    lavaFlows.forEach(function(flow) {
      var pulse = 0.3 * Math.sin(elapsedTime * 2);
      flow.material.emissiveIntensity = flow.baseIntensity + pulse;
    });
  }

  function updateMissile(delta) {
    if (missileInSilo) {
      var progress = Math.sin(elapsedTime * 0.5) * 0.5 + 0.5;
      missileInSilo.mesh.position.y = missileInSilo.baseY + progress * 4;
    }
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      if (!enemy.soldierData) return;

      var data = enemy.soldierData;
      data.position.x += Math.cos(data.angle) * data.speed * delta;
      data.position.z += Math.sin(data.angle) * data.speed * delta;

      if (Math.random() < 0.02) {
        data.angle += (Math.random() - 0.5) * Math.PI;
      }

      if (Math.abs(data.position.x) > 35) {
        data.position.x = -35 * Math.sign(data.position.x);
      }
      if (Math.abs(data.position.z) > 35) {
        data.position.z = -35 * Math.sign(data.position.z);
      }

      enemy.position.copy(data.position);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var minutes = Math.floor(gameState.missileCountdown / 60);
    var seconds = gameState.missileCountdown % 60;
    var secondsStr = seconds < 10 ? '0' + seconds : '' + seconds;

    var hudText = 'MISSILE LAUNCH IN: ' + minutes + ':' + secondsStr + '\n' +
                  'SILOS DISABLED: ' + gameState.silosDisabled + '/' + gameState.maxSilos + '\n' +
                  'SOLDIERS DOWN: ' + gameState.soldierCount;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'volcano-island-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #FF6600; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #FF6600; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #FF6600;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'v') {
        lastVKeyTime = now;
      }

      if (event.key.toLowerCase() === 'i') {
        if (now - lastVKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #FF6600; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #FF6600; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastIKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene with tropical heat-haze atmosphere
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0xFF8844, 0.02);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFAA88, 0.8);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFDD99, 0.9);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    // Create island structures
    createIslandBase();
    createVolcanicCone();
    createLavaFlows();
    createMissileSilo();
    createSecondMissileSilo();
    createLaunchControlBunker();
    createLavaRocks();
    createPalmTrees();
    createRadarDomes();

    // Create enemies
    for (var i = 0; i < 6; i++) {
      createTropicalSoldier();
    }

    // Setup HUD and controls
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    // Countdown timer
    gameState.missileCountdown = Math.max(0, 300 - elapsedTime);

    updateLavaFlows(delta);
    updateSmokePuffs(delta);
    updateMissile(delta);
    updateEnemies(delta);
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
    lavaFlows = [];
    smokePuffs = [];
    missileInSilo = null;
    gameState.silosDisabled = 0;
    gameState.soldierCount = 0;
    gameState.missileCountdown = 300;
    elapsedTime = 0;
    lastVKeyTime = 0;
    lastIKeyTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
