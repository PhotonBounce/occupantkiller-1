var window = window || {};

window.AbandonedMine = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    depth: 450,
    sectionsCleared: 0,
    chargesPlanted: 0,
    maxSections: 5,
    maxCharges: 3
  };
  var mineCart = null;
  var ventilationFan = null;
  var lanternLights = [];
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastMKeyTime = 0;
  var hudVisible = true;

  function createMinecart() {
    var group = new THREE.Group();

    // Cart body (box)
    var bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.5;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Wheels (cylinders)
    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

    var wheelPositions = [
      [-0.6, 0.3, -0.5],
      [0.6, 0.3, -0.5],
      [-0.6, 0.3, 0.5],
      [0.6, 0.3, 0.5]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    group.position.set(-5, 1, -10);
    group.minecartData = { trackZ: -10, speed: 0.3, maxZ: 15, minZ: -15 };

    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createRailTracks() {
    // Two parallel rails (thin boxes)
    var railGeometry = new THREE.BoxGeometry(0.15, 0.1, 50);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });

    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(-2.5, 0.5, 0);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    scene.add(rail1);
    sceneObjects.push(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(2.5, 0.5, 0);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    scene.add(rail2);
    sceneObjects.push(rail2);

    // Sleeper boxes
    var sleeperGeometry = new THREE.BoxGeometry(6, 0.2, 0.3);
    var sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3C2A, roughness: 0.9 });

    for (var i = -20; i < 20; i += 1.5) {
      var sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
      sleeper.position.set(0, 0.35, i);
      sleeper.castShadow = true;
      sleeper.receiveShadow = true;
      scene.add(sleeper);
      sceneObjects.push(sleeper);
    }
  }

  function createWoodenSupportBeams() {
    // T-shaped support beams
    var verticalGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    var horizontalGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });

    var positions = [
      { x: -8, z: -5 },
      { x: 8, z: -5 },
      { x: -8, z: 5 },
      { x: 8, z: 5 },
      { x: -8, z: 15 },
      { x: 8, z: 15 }
    ];

    positions.forEach(function(pos) {
      // Vertical beam
      var vertical = new THREE.Mesh(verticalGeometry, beamMaterial);
      vertical.position.set(pos.x, 2, pos.z);
      vertical.castShadow = true;
      vertical.receiveShadow = true;
      scene.add(vertical);
      sceneObjects.push(vertical);

      // Horizontal beam (top)
      var horizontal = new THREE.Mesh(horizontalGeometry, beamMaterial);
      horizontal.position.set(pos.x, 3.8, pos.z);
      horizontal.castShadow = true;
      horizontal.receiveShadow = true;
      scene.add(horizontal);
      sceneObjects.push(horizontal);
    });
  }

  function createOreVeins() {
    // Glowing ore veins on walls
    var oreGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.2);
    var oreMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.3
    });

    var orePositions = [
      { x: -9.5, y: 1.5, z: -8 },
      { x: 9.5, y: 2, z: -3 },
      { x: -9.5, y: 1, z: 2 },
      { x: 9.5, y: 2.5, z: 8 },
      { x: -9.5, y: 1.5, z: 12 },
      { x: 9.5, y: 2, z: 18 }
    ];

    orePositions.forEach(function(pos) {
      var ore = new THREE.Mesh(oreGeometry, oreMaterial);
      ore.position.set(pos.x, pos.y, pos.z);
      ore.castShadow = true;
      ore.receiveShadow = true;
      scene.add(ore);
      sceneObjects.push(ore);
    });
  }

  function createElevatorShaft() {
    // Cage structure
    var cageGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
    var cageMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
    var cage = new THREE.Mesh(cageGeometry, cageMaterial);
    cage.position.set(-12, 1, -15);
    cage.castShadow = true;
    cage.receiveShadow = true;
    scene.add(cage);
    sceneObjects.push(cage);

    // Vertical rail for elevator
    var railGeometry = new THREE.BoxGeometry(0.1, 8, 0.1);
    var rail = new THREE.Mesh(railGeometry, cageMaterial);
    rail.position.set(-12, 4, -15);
    rail.castShadow = true;
    rail.receiveShadow = true;
    scene.add(rail);
    sceneObjects.push(rail);
  }

  function createDynamitePlunger() {
    var group = new THREE.Group();

    // Box base
    var baseGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Cylinder handle
    var handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xD2691E, roughness: 0.7 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.y = 0.7;
    handle.castShadow = true;
    handle.receiveShadow = true;
    group.add(handle);

    group.position.set(12, 0.3, -18);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createVentilationFan() {
    var group = new THREE.Group();

    // Fan body (cylinder)
    var bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.3 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Blades (LineSegments)
    var bladeGeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      0, 0.7, 0,
      0, -0.7, 0,
      0.7, 0, 0,
      -0.7, 0, 0
    ]);
    bladeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var indices = new Uint16Array([0, 1, 2, 3]);
    bladeGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

    var bladeMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA, linewidth: 2 });
    var blades = new THREE.LineSegments(bladeGeometry, bladeMaterial);
    blades.rotation.z = Math.PI / 2;
    group.add(blades);

    group.position.set(10, 3.5, 15);
    group.fanData = { rotation: 0 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createTunnelDwellerEnemy() {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.9 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.8 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.4;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Headlamp (emissive sphere)
    var lampGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    var lampMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.9
    });
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(0, 1.45, 0.2);
    group.add(lamp);

    group.enemyData = {
      position: new THREE.Vector3(Math.random() * 15 - 7.5, 1, Math.random() * 20 - 10),
      speed: 0.02 + Math.random() * 0.02,
      health: 100
    };
    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function createLanternLights() {
    // Flickering lantern lights at regular intervals along tunnel
    for (var i = 0; i < 6; i++) {
      var light = new THREE.PointLight(0xFF9900, 0.8, 15);
      light.position.set(
        (i % 2 === 0) ? -9 : 9,
        2.5,
        -15 + (i * 5)
      );
      light.castShadow = true;
      scene.add(light);
      lanternLights.push({
        light: light,
        baseIntensity: 0.8,
        flickerPhase: Math.random() * Math.PI * 2
      });
    }
  }

  function updateMinecart(delta) {
    if (!mineCart) return;

    var data = mineCart.minecartData;
    data.trackZ += data.speed;
    if (data.trackZ > data.maxZ) {
      data.trackZ = data.minZ;
    }
    mineCart.position.z = data.trackZ;
  }

  function updateVentilationFan(delta) {
    if (!ventilationFan) return;

    var data = ventilationFan.fanData;
    data.rotation += 0.05;
    ventilationFan.children.forEach(function(child) {
      if (child instanceof THREE.LineSegments) {
        child.rotation.z = data.rotation;
      }
    });
  }

  function updateLanternLights(delta) {
    lanternLights.forEach(function(lantern) {
      var flicker = Math.sin(elapsedTime * 3 + lantern.flickerPhase) * 0.3 + 1;
      lantern.light.intensity = lantern.baseIntensity * flicker;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;
      data.position.x += (Math.sin(elapsedTime * 0.5 + data.position.x) * data.speed);
      data.position.z += data.speed;

      if (data.position.z > 20) {
        data.position.z = -20;
      }

      enemy.position.copy(data.position);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'DEPTH: ' + gameState.depth + 'm\n' +
                  'TUNNEL SECTIONS CLEARED: ' + gameState.sectionsCleared + '/' + gameState.maxSections + '\n' +
                  'CHARGES PLANTED: ' + gameState.chargesPlanted + '/' + gameState.maxCharges;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'abandoned-mine-hud';
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

      if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'A') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'm' || event.key.toLowerCase() === 'M') {
        if (now - lastAKeyTime < 400) {
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
        lastMKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.08);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create tunnel structures
    createRailTracks();
    createWoodenSupportBeams();
    createOreVeins();
    createElevatorShaft();
    createDynamitePlunger();

    // Create interactive elements
    mineCart = createMinecart();
    ventilationFan = createVentilationFan();
    createLanternLights();

    // Create enemies
    for (var i = 0; i < 4; i++) {
      createTunnelDwellerEnemy();
    }

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateMinecart(delta);
    updateVentilationFan(delta);
    updateLanternLights(delta);
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
    lanternLights = [];
    mineCart = null;
    ventilationFan = null;
    gameState.sectionsCleared = 0;
    gameState.chargesPlanted = 0;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
