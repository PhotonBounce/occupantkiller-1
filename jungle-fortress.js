var window = window || {};

window.JungleFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    tunnelNetworkCleared: 0,
    maxTunnels: 4,
    guerrillasDown: 0,
    trapsDisarmed: 0,
    maxTraps: 6
  };
  var tripwires = [];
  var canopies = [];
  var campfireLights = [];
  var elapsedTime = 0;
  var lastJKeyTime = 0;
  var lastFKeyTime = 0;
  var hudVisible = true;

  // ============================================================================
  // SCENE BUILDERS: Jungle Fortress Components
  // ============================================================================

  function createBermWalls() {
    // Earthwork berm walls - long angled box mounds
    var bermPositions = [
      { x: -15, z: -5, length: 30 },
      { x: 15, z: 5, length: 28 },
      { x: 0, z: -20, length: 25 }
    ];

    bermPositions.forEach(function(berm) {
      var geometry = new THREE.BoxGeometry(2, 1.5, berm.length);
      var material = new THREE.MeshStandardMaterial({
        color: 0x6B5D4F,
        roughness: 0.95,
        metalness: 0
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(berm.x, 0.75, berm.z);
      mesh.rotation.z = Math.random() * 0.15 - 0.075;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      sceneObjects.push(mesh);
    });
  }

  function createBambooWatchtower() {
    var group = new THREE.Group();

    // Four bamboo poles (cylinders)
    var polePositions = [
      [-1.5, 0, -1.5],
      [1.5, 0, -1.5],
      [-1.5, 0, 1.5],
      [1.5, 0, 1.5]
    ];

    polePositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(0.25, 0.3, 8, 12);
      var material = new THREE.MeshStandardMaterial({
        color: 0x9B8B4C,
        roughness: 0.8
      });
      var pole = new THREE.Mesh(geometry, material);
      pole.position.set(pos[0], 4, pos[2]);
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);
    });

    // Platform (box)
    var platformGeometry = new THREE.BoxGeometry(4, 0.4, 4);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.85
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 8;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Roof structure (cone)
    var roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 8);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3C2A,
      roughness: 0.9
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 9;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    group.position.set(12, 0, -15);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createBunkerEntrance() {
    // Box tunnel opening in the ground
    var geometry = new THREE.BoxGeometry(3, 2, 4);
    var material = new THREE.MeshStandardMaterial({
      color: 0x3D3530,
      roughness: 0.95,
      metalness: 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-8, -0.5, 8);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    sceneObjects.push(mesh);
  }

  function createTripwireLines() {
    // Tripwires at ankle height (LineSegments)
    var tripwirePositions = [
      { start: [-10, 0.3, 0], end: [-5, 0.3, 0] },
      { start: [0, 0.3, -8], end: [5, 0.3, -8] },
      { start: [8, 0.3, 5], end: [8, 0.3, 12] },
      { start: [-12, 0.3, 15], end: [-5, 0.3, 18] }
    ];

    tripwirePositions.forEach(function(wire, idx) {
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([
          wire.start[0], wire.start[1], wire.start[2],
          wire.end[0], wire.end[1], wire.end[2]
        ]),
        3
      ));
      var material = new THREE.LineBasicMaterial({
        color: 0x333333,
        linewidth: 2
      });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      sceneObjects.push(line);
      tripwires.push({
        line: line,
        triggered: false,
        triggerTime: -1000,
        originalColor: 0x333333
      });
    });
  }

  function createPunjiTrapPits() {
    // Box recessed areas for punji traps
    var pitPositions = [
      { x: -18, z: 10 },
      { x: 5, z: 20 },
      { x: 20, z: -10 }
    ];

    pitPositions.forEach(function(pit) {
      var geometry = new THREE.BoxGeometry(2, 1, 2);
      var material = new THREE.MeshStandardMaterial({
        color: 0x2A2520,
        roughness: 0.95,
        metalness: 0
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pit.x, -0.5, pit.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      sceneObjects.push(mesh);
    });
  }

  function createHammocks() {
    // Hammocks slung between tree trunks (LineSegments)
    var hammockPositions = [
      {
        start: [-20, 3, -12],
        end: [-15, 3.2, -12]
      },
      {
        start: [18, 2.8, 10],
        end: [22, 3, 10]
      }
    ];

    hammockPositions.forEach(function(hammock) {
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([
          hammock.start[0], hammock.start[1], hammock.start[2],
          hammock.end[0], hammock.end[1], hammock.end[2]
        ]),
        3
      ));
      var material = new THREE.LineBasicMaterial({
        color: 0x8B5A3C,
        linewidth: 3
      });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      sceneObjects.push(line);
    });
  }

  function createSupplyTunnelOpening() {
    // Box hatch opening
    var geometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var material = new THREE.MeshStandardMaterial({
      color: 0x4A4035,
      roughness: 0.9
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, -0.3, -18);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    sceneObjects.push(mesh);
  }

  function createDenseJungleTrees() {
    // Dense cylinder trunks with sphere canopies
    var treePositions = [
      { x: -25, z: -20 },
      { x: -20, z: 5 },
      { x: 25, z: -15 },
      { x: 22, z: 18 },
      { x: -15, z: 20 },
      { x: 8, z: -25 },
      { x: -30, z: 10 },
      { x: 28, z: 8 },
      { x: 0, z: -30 },
      { x: 18, z: -20 },
      { x: -22, z: -28 },
      { x: 25, z: 25 }
    ];

    treePositions.forEach(function(treePos, idx) {
      var group = new THREE.Group();

      // Trunk (cylinder)
      var trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x5C4033,
        roughness: 0.95
      });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 6;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      group.add(trunk);

      // Canopy (sphere)
      var canopyGeometry = new THREE.SphereGeometry(5, 12, 12);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2D5C2D,
        roughness: 0.85
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.y = 10;
      canopy.scale.set(1, 1.2, 1);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      group.add(canopy);

      group.position.set(treePos.x, 0, treePos.z);
      group.treeData = {
        baseY: 10,
        oscillation: Math.random() * Math.PI * 2,
        canopy: canopy
      };

      scene.add(group);
      sceneObjects.push(group);
      canopies.push(group.treeData);
    });
  }

  function createCampfire() {
    var group = new THREE.Group();

    // Fire logs (boxes)
    var logGeometry = new THREE.BoxGeometry(0.3, 0.3, 2);
    var logMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D2817,
      roughness: 0.95
    });

    var log1 = new THREE.Mesh(logGeometry, logMaterial);
    log1.rotation.z = Math.PI / 4;
    log1.position.set(0, 0.2, 0);
    group.add(log1);

    var log2 = new THREE.Mesh(logGeometry, logMaterial);
    log2.rotation.z = -Math.PI / 4;
    log2.position.set(0, 0.2, 0);
    group.add(log2);

    // Fire light
    var fireLight = new THREE.PointLight(0xFF6600, 2, 15);
    fireLight.position.set(0, 1.5, 0);
    fireLight.castShadow = true;
    group.add(fireLight);
    campfireLights.push({
      light: fireLight,
      baseIntensity: 2,
      flickerPhase: Math.random() * Math.PI * 2
    });

    group.position.set(-10, 0.5, -12);
    scene.add(group);
    sceneObjects.push(group);
  }

  // ============================================================================
  // ENEMY CREATION
  // ============================================================================

  function createTunnelFighterEnemy() {
    var group = new THREE.Group();

    // Body (green camouflage box, crouching - low Y)
    var bodyGeometry = new THREE.BoxGeometry(0.6, 1, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A6B3A,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (small sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D5C2D,
      roughness: 0.75
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1.2, 0);
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Rifle (box)
    var rifleGeometry = new THREE.BoxGeometry(0.1, 0.1, 1);
    var rifleMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      roughness: 0.9
    });
    var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
    rifle.position.set(0.3, 0.8, -0.5);
    rifle.rotation.z = 0.3;
    rifle.castShadow = true;
    group.add(rifle);

    var startX = (Math.random() - 0.5) * 40;
    var startZ = (Math.random() - 0.5) * 40;
    group.position.set(startX, 0, startZ);

    group.enemyData = {
      position: new THREE.Vector3(startX, 0, startZ),
      speed: 1 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      patrolRadius: 8
    };

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
  }

  function createWatchtowerSentry() {
    var group = new THREE.Group();

    // Body
    var bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C7A4A,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head
    var headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A6B3A,
      roughness: 0.75
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 1, 0);
    head.castShadow = true;
    group.add(head);

    group.position.set(12, 8.5, -15);
    group.enemyData = {
      position: new THREE.Vector3(12, 8.5, -15),
      speed: 0,
      angle: 0,
      patrolRadius: 0
    };

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
  }

  // ============================================================================
  // ANIMATIONS & UPDATES
  // ============================================================================

  function updateTripwires(delta) {
    tripwires.forEach(function(wire, idx) {
      // Occasionally trigger
      if (Math.random() < 0.01) {
        wire.triggered = true;
        wire.triggerTime = elapsedTime;
        wire.line.material.color.setHex(0xFF0000);
        wire.line.material.emissive.setHex(0xFF3300);
      }

      // Reset after flash
      if (wire.triggered && (elapsedTime - wire.triggerTime) > 0.15) {
        wire.triggered = false;
        wire.line.material.color.setHex(wire.originalColor);
        wire.line.material.emissive.setHex(0x000000);
      }
    });
  }

  function updateCanopies(delta) {
    canopies.forEach(function(canopyData) {
      var oscillation = Math.sin(elapsedTime * 0.6 + canopyData.oscillation) * 0.3;
      canopyData.canopy.position.y = canopyData.baseY + oscillation;
    });
  }

  function updateCampfire(delta) {
    campfireLights.forEach(function(fire) {
      var flicker = Math.sin(elapsedTime * 4 + fire.flickerPhase) * 0.4 + 1;
      fire.light.intensity = fire.baseIntensity * flicker;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;

      // Patrol behavior
      if (data.patrolRadius > 0) {
        data.angle += (Math.random() - 0.5) * 0.1;
        var targetX = Math.cos(data.angle) * data.patrolRadius;
        var targetZ = Math.sin(data.angle) * data.patrolRadius;

        data.position.x += (targetX - data.position.x) * 0.05;
        data.position.z += (targetZ - data.position.z) * 0.05;
      }

      enemy.position.copy(data.position);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'TUNNEL NETWORK CLEARED: ' + gameState.tunnelNetworkCleared + '/' + gameState.maxTunnels + '\n' +
                  'GUERRILLAS DOWN: ' + gameState.guerrillasDown + '\n' +
                  'TRAPS DISARMED: ' + gameState.trapsDisarmed + '/' + gameState.maxTraps;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'jungle-fortress-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #00FF00; ' +
                                  'z-index: 100; text-shadow: 0 0 8px #00FF00; letter-spacing: 1px;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'j') {
        lastJKeyTime = now;
      }

      if (event.key.toLowerCase() === 'f') {
        if (now - lastJKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF00; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 3px solid #00FF00; pointer-events: none; ' +
                                'text-shadow: 0 0 10px #00FF00;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastFKeyTime = now;
      }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x1a2a1a);
    scene.fog = new THREE.FogExp2(0x0d2d0d, 0.15);

    // Lighting - oppressive jungle heat, dim dappled light
    var ambientLight = new THREE.AmbientLight(0x4a6a4a, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffee99, 0.4);
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create scene elements
    createDenseJungleTrees();
    createBermWalls();
    createBambooWatchtower();
    createBunkerEntrance();
    createTripwireLines();
    createPunjiTrapPits();
    createHammocks();
    createSupplyTunnelOpening();
    createCampfire();

    // Create enemies
    for (var i = 0; i < 3; i++) {
      createTunnelFighterEnemy();
    }
    createWatchtowerSentry();

    // Setup HUD and input
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateTripwires(delta);
    updateCanopies(delta);
    updateCampfire(delta);
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
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
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

    // Reset all state
    sceneObjects = [];
    enemies = [];
    tripwires = [];
    canopies = [];
    campfireLights = [];
    gameState.tunnelNetworkCleared = 0;
    gameState.guerrillasDown = 0;
    gameState.trapsDisarmed = 0;
    elapsedTime = 0;
    lastJKeyTime = 0;
    lastFKeyTime = 0;
    hudVisible = true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
