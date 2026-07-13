var window = window || {};

window.ClockTower = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    bombTimeRemaining: 300, // 5 minutes in seconds
    mercenariesDown: 0,
    totalMercenaries: 6,
    clockworkAccessLocked: true
  };
  var towerMesh = null;
  var clockFaces = [];
  var clockHands = [];
  var bombDevice = null;
  var bellMesh = null;
  var staircase = null;
  var elapsedTime = 0;
  var lastCKeyTime = 0;
  var lastKKeyTime = 0;
  var hudVisible = true;
  var cKeyPressTimeout = 400; // milliseconds for C+K combo

  function createTowerBase() {
    // Main Gothic tower structure - tall box with stone-like appearance
    var towerGeometry = new THREE.BoxGeometry(8, 35, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.7,
      metalness: 0.1
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(0, 17.5, 0);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    sceneObjects.push(tower);

    // Stone detail: add subtle ridges with thin boxes
    var ridgeGeometry = new THREE.BoxGeometry(8.2, 0.5, 8.2);
    var ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.9
    });

    for (var i = 0; i < 8; i++) {
      var ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
      ridge.position.set(0, 5 + i * 4, 0);
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      scene.add(ridge);
      sceneObjects.push(ridge);
    }

    return tower;
  }

  function createClockFaces() {
    // Four cardinal clock faces (flat cylinders)
    var faceGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 32);
    var faceMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5DEB3, // Cream color
      roughness: 0.5,
      metalness: 0.2
    });

    var positions = [
      { x: 4.5, z: 0, ry: 0 },           // Right (East)
      { x: -4.5, z: 0, ry: Math.PI },    // Left (West)
      { x: 0, z: 4.5, ry: Math.PI / 2 }, // Front (South)
      { x: 0, z: -4.5, ry: -Math.PI / 2 } // Back (North)
    ];

    positions.forEach(function(pos) {
      var face = new THREE.Mesh(faceGeometry, faceMaterial);
      face.position.set(pos.x, 28, pos.z);
      face.rotation.y = pos.ry;
      face.castShadow = true;
      face.receiveShadow = true;
      scene.add(face);
      sceneObjects.push(face);
      clockFaces.push(face);
    });
  }

  function createClockHands() {
    // Hour hand (shorter, wider)
    var hourHandGeometry = new THREE.BoxGeometry(0.4, 0.3, 6);
    var handMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F, // Dark slate grey
      roughness: 0.6
    });

    var hourHand = new THREE.Mesh(hourHandGeometry, handMaterial);
    hourHand.position.set(0, 28.5, 0);
    hourHand.castShadow = true;
    hourHand.receiveShadow = true;
    hourHand.clockData = { speed: 0.0167, type: 'hour' }; // ~hour hand speed
    scene.add(hourHand);
    sceneObjects.push(hourHand);
    clockHands.push(hourHand);

    // Minute hand (longer, thinner)
    var minuteHandGeometry = new THREE.BoxGeometry(0.25, 0.2, 7.5);
    var minuteHand = new THREE.Mesh(minuteHandGeometry, handMaterial);
    minuteHand.position.set(0, 28.2, 0);
    minuteHand.castShadow = true;
    minuteHand.receiveShadow = true;
    minuteHand.clockData = { speed: 0.1, type: 'minute' }; // ~minute hand speed
    scene.add(minuteHand);
    sceneObjects.push(minuteHand);
    clockHands.push(minuteHand);
  }

  function createBellChamber() {
    // Open box framework for bell chamber
    var frameThickness = 0.5;
    var size = 6;
    var height = 4;

    // Four vertical corner posts
    var postGeometry = new THREE.BoxGeometry(frameThickness, height, frameThickness);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x556B2F, // Dark olive
      roughness: 0.7
    });

    var corners = [
      { x: size/2, z: size/2 },
      { x: -size/2, z: size/2 },
      { x: size/2, z: -size/2 },
      { x: -size/2, z: -size/2 }
    ];

    corners.forEach(function(corner) {
      var post = new THREE.Mesh(postGeometry, frameMaterial);
      post.position.set(corner.x, 30, corner.z);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      sceneObjects.push(post);
    });

    // Horizontal frame beams
    var beamGeometry = new THREE.BoxGeometry(size, frameThickness, frameThickness);

    for (var i = 0; i < 2; i++) {
      var beam = new THREE.Mesh(beamGeometry, frameMaterial);
      beam.position.set(0, 30 + i * 3, 3);
      beam.castShadow = true;
      beam.receiveShadow = true;
      scene.add(beam);
      sceneObjects.push(beam);
    }

    // Bell (sphere)
    var bellGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold
      metalness: 0.9,
      roughness: 0.2
    });
    bellMesh = new THREE.Mesh(bellGeometry, bellMaterial);
    bellMesh.position.set(0, 31, 0);
    bellMesh.castShadow = true;
    bellMesh.receiveShadow = true;
    bellMesh.bellData = { swayAmount: 0, maxSway: 0.5 };
    scene.add(bellMesh);
    sceneObjects.push(bellMesh);

    return bellMesh;
  }

  function createStaircase() {
    // Spiral staircase simulated with stacked angled box steps
    var stepGeometry = new THREE.BoxGeometry(1.5, 0.3, 2);
    var stepMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.8
    });

    var stairGroup = new THREE.Group();

    for (var i = 0; i < 12; i++) {
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      var angle = (i / 12) * Math.PI * 2;
      var radius = 3;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;
      var y = i * 1.5; // Height increases per step

      step.position.set(x, y + 5, z);
      step.rotation.y = angle;
      step.rotation.z = 0.1; // Slight tilt for stairs
      step.castShadow = true;
      step.receiveShadow = true;
      stairGroup.add(step);
      sceneObjects.push(step);
    }

    stairGroup.position.set(-3, 0, 0);
    scene.add(stairGroup);

    return stairGroup;
  }

  function createWestminsterBridge() {
    // Flat bridge structure below tower
    var bridgeGeometry = new THREE.BoxGeometry(12, 0.5, 30);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.6
    });

    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, -2, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    sceneObjects.push(bridge);

    // Railing boxes on sides
    var railingGeometry = new THREE.BoxGeometry(0.3, 1.2, 30);
    var railingMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7
    });

    var railLeft = new THREE.Mesh(railingGeometry, railingMaterial);
    railLeft.position.set(-6.5, -1, 0);
    railLeft.castShadow = true;
    railLeft.receiveShadow = true;
    scene.add(railLeft);
    sceneObjects.push(railLeft);

    var railRight = new THREE.Mesh(railingGeometry, railingMaterial);
    railRight.position.set(6.5, -1, 0);
    railRight.castShadow = true;
    railRight.receiveShadow = true;
    scene.add(railRight);
    sceneObjects.push(railRight);

    // Decorative posts
    var postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16);
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.4
    });

    for (var i = -4; i <= 4; i++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(-6.2, -1, i * 3);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      sceneObjects.push(post);

      var post2 = new THREE.Mesh(postGeometry, postMaterial);
      post2.position.set(6.2, -1, i * 3);
      post2.castShadow = true;
      post2.receiveShadow = true;
      scene.add(post2);
      sceneObjects.push(post2);
    }
  }

  function createBombDevice() {
    // Red emissive box with pulsing intensity
    var bombGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var bombMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7
    });

    bombDevice = new THREE.Mesh(bombGeometry, bombMaterial);
    bombDevice.position.set(0.5, 20, 0.5);
    bombDevice.castShadow = true;
    bombDevice.receiveShadow = true;
    bombDevice.bombData = {
      pulsePhase: 0,
      maxIntensity: 0.8,
      minIntensity: 0.3
    };
    scene.add(bombDevice);
    sceneObjects.push(bombDevice);

    // Warning wires (thin line segments)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      0, 0, 0,     // point 1
      1.5, 0.2, 0.3  // point 2
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
    wires.position.set(0.5, 20, 0.5);
    scene.add(wires);
    sceneObjects.push(wires);

    return bombDevice;
  }

  function createEnemies() {
    // Mercenaries in black tactical gear on stairs and platforms

    // Create 6 enemies positioned around the tower
    var enemyPositions = [
      { x: -3, y: 8, z: 0 },    // Stair position 1
      { x: 2, y: 12, z: -2 },   // Stair position 2
      { x: -2.5, y: 5, z: 2.5 }, // Platform 1
      { x: 3, y: 16, z: -3 },   // Platform 2
      { x: -1, y: 10, z: -1 },  // Mid-stair
      { x: 2.5, y: 14, z: 1.5 }  // Upper position
    ];

    enemyPositions.forEach(function(pos) {
      var enemyGroup = new THREE.Group();

      // Body (black box)
      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.6;
      body.castShadow = true;
      body.receiveShadow = true;
      enemyGroup.add(body);

      // Head (small sphere)
      var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Tan skin
        roughness: 0.6
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.5;
      head.castShadow = true;
      head.receiveShadow = true;
      enemyGroup.add(head);

      // Weapon (thin rifle box)
      var weaponGeometry = new THREE.BoxGeometry(0.1, 0.15, 1.8);
      var weaponMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.6
      });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.3, 0.8, -0.5);
      weapon.rotation.z = 0.3;
      weapon.castShadow = true;
      weapon.receiveShadow = true;
      enemyGroup.add(weapon);

      enemyGroup.position.set(pos.x, pos.y, pos.z);
      enemyGroup.enemyData = {
        health: 100,
        alive: true,
        patrolAngle: Math.random() * Math.PI * 2
      };
      scene.add(enemyGroup);
      sceneObjects.push(enemyGroup);
      enemies.push(enemyGroup);
    });
  }

  function updateClockHands(delta) {
    clockHands.forEach(function(hand) {
      hand.rotation.z += hand.clockData.speed * delta;
    });
  }

  function updateBell(delta) {
    if (bellMesh) {
      // Sway bell every 15 seconds
      var swayPhase = (elapsedTime % 15) / 15 * Math.PI * 2;
      bellMesh.position.x = Math.sin(swayPhase) * bellMesh.bellData.maxSway;
    }
  }

  function updateBomb(delta) {
    if (bombDevice) {
      // Pulsing red intensifies as countdown progresses
      var bombData = bombDevice.bombData;
      bombData.pulsePhase += delta * 2; // Speed up as time runs out

      var intensity = bombData.minIntensity +
        (bombData.maxIntensity - bombData.minIntensity) *
        (0.5 + 0.5 * Math.sin(bombData.pulsePhase));

      bombDevice.material.emissiveIntensity = intensity;

      // Slight rotation for visual effect
      bombDevice.rotation.x += delta * 0.3;
      bombDevice.rotation.y += delta * 0.2;
    }

    // Update countdown
    gameState.bombTimeRemaining = Math.max(0, gameState.bombTimeRemaining - delta);
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      if (enemy.enemyData && enemy.enemyData.alive) {
        // Simple patrol animation
        enemy.enemyData.patrolAngle += delta * 0.5;
        var bobAmount = Math.sin(enemy.enemyData.patrolAngle) * 0.1;
        var originalY = enemy.position.y;
        enemy.position.y = originalY + bobAmount;
      }
    });
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'clock-tower-hud';
    hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #00FF00; font-family: monospace; font-size: 14px; background: rgba(0,0,0,0.7); padding: 15px; border: 2px solid #00FF00; z-index: 100;';
    document.body.appendChild(hudElement);
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      var minutes = Math.floor(gameState.bombTimeRemaining / 60);
      var seconds = Math.floor(gameState.bombTimeRemaining % 60);
      var timeStr = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

      var statusColor = gameState.clockworkAccessLocked ? '#FF0000' : '#00FF00';
      var accessStatus = gameState.clockworkAccessLocked ? 'LOCKED' : 'ACCESSED';

      hudElement.innerHTML =
        'BOMB TIMER: ' + timeStr + '<br>' +
        'MERCENARIES DOWN: ' + gameState.mercenariesDown + '/' + gameState.totalMercenaries + '<br>' +
        '<span style="color: ' + statusColor + ';">CLOCKWORK ACCESS: ' + accessStatus + '</span>';
    }
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key === 'c' || event.key === 'C') {
        lastCKeyTime = now;
      }

      if (event.key === 'k' || event.key === 'K') {
        if (now - lastCKeyTime < cKeyPressTimeout) {
          // C+K combo detected
          hudVisible = !hudVisible;
          if (hudElement) {
            hudElement.style.display = hudVisible ? 'block' : 'none';
          }
          lastCKeyTime = 0;
          lastKKeyTime = 0;
        } else {
          lastKKeyTime = now;
        }
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene with misty London atmosphere
    scene.background = new THREE.Color(0x4A6FA5); // Grey-blue
    scene.fog = new THREE.FogExp2(0x5A7A9F, 0.03); // Misty fog

    // Overcast lighting
    var ambientLight = new THREE.AmbientLight(0xB0B0B0, 0.9);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xCCCCCC, 0.7);
    directionalLight.position.set(15, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create scene geometry
    createTowerBase();
    createClockFaces();
    createClockHands();
    createBellChamber();
    createStaircase();
    createWestminsterBridge();
    createBombDevice();

    // Create enemies
    createEnemies();

    // Setup HUD and input
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateClockHands(delta);
    updateBell(delta);
    updateBomb(delta);
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

    // Remove all lights
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
    clockFaces = [];
    clockHands = [];
    towerMesh = null;
    bombDevice = null;
    bellMesh = null;
    staircase = null;
    elapsedTime = 0;
    lastCKeyTime = 0;
    lastKKeyTime = 0;

    gameState.bombTimeRemaining = 300;
    gameState.mercenariesDown = 0;
    gameState.clockworkAccessLocked = true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
