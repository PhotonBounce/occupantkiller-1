var window = window || {};

window.JungleCamp = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    weaponsCaches: 0,
    maxWeaponsCaches: 4,
    fightersDown: 0,
    intelligenceFiles: 0,
    maxIntelligenceFiles: 2
  };

  var elapsedTime = 0;
  var lastJKeyTime = 0;
  var lastCKeyTime = 0;
  var hudVisible = true;
  var campfire = null;
  var searchlights = [];
  var ropeSegments = [];

  // Keybind tracking for J+C combo (within 400ms)
  function handleKeyPress(event) {
    var now = Date.now();

    if (event.key === 'j' || event.key === 'J') {
      lastJKeyTime = now;
    } else if (event.key === 'c' || event.key === 'C') {
      if (now - lastJKeyTime < 400) {
        hudVisible = !hudVisible;
        updateHUD();
      }
      lastCKeyTime = now;
    }
  }

  function updateHUD() {
    if (!hudElement) return;

    var text = 'WEAPONS CACHES DESTROYED: ' + gameState.weaponsCaches + '/' + gameState.maxWeaponsCaches + '\n' +
               'FIGHTERS DOWN: ' + gameState.fightersDown + '\n' +
               'INTELLIGENCE FILES: ' + gameState.intelligenceFiles + '/' + gameState.maxIntelligenceFiles;

    if (hudVisible) {
      hudElement.textContent = text;
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function createCanvasTent(x, z) {
    var group = new THREE.Group();

    // Tent base (box body)
    var baseGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 });
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.y = 0.75;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Peaked roof (cone)
    var roofGeometry = new THREE.ConeGeometry(1.2, 1.5, 8);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5345, roughness: 0.8 });
    var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
    roofMesh.position.y = 2.2;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createWeaponsCrate(x, z) {
    var group = new THREE.Group();

    // Crate body (dark wood box)
    var crateGeometry = new THREE.BoxGeometry(1.2, 1, 1.2);
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x3D3D3D, roughness: 0.9 });
    var crateMesh = new THREE.Mesh(crateGeometry, crateMaterial);
    crateMesh.position.y = 0.5;
    crateMesh.castShadow = true;
    crateMesh.receiveShadow = true;
    group.add(crateMesh);

    // Ammo boxes (smaller boxes inside)
    for (var i = 0; i < 3; i++) {
      var ammoGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var ammoMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8 });
      var ammoMesh = new THREE.Mesh(ammoGeometry, ammoMaterial);
      ammoMesh.position.set(-0.3 + i * 0.3, 1.3, 0);
      ammoMesh.castShadow = true;
      ammoMesh.receiveShadow = true;
      group.add(ammoMesh);
    }

    group.position.set(x, 0, z);
    group.isWeaponsCrate = true;
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createObstacleCourse(startX, startZ) {
    // Wall obstacles
    for (var i = 0; i < 3; i++) {
      var wallGeometry = new THREE.BoxGeometry(3, 1.5, 0.3);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.8 });
      var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(startX + i * 4, 0.75, startZ);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
      sceneObjects.push(wallMesh);
    }

    // Poles (cylinders)
    for (var j = 0; j < 4; j++) {
      var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
      var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
      poleMesh.position.set(startX + j * 3, 1, startZ + 2);
      poleMesh.castShadow = true;
      poleMesh.receiveShadow = true;
      scene.add(poleMesh);
      sceneObjects.push(poleMesh);
    }
  }

  function createCampfire(x, z) {
    var group = new THREE.Group();

    // Fire cone (yellow-orange emissive)
    var fireGeometry = new THREE.ConeGeometry(0.8, 1.2, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B1A,
      emissive: 0xFF6B1A,
      emissiveIntensity: 0.8,
      roughness: 0.5
    });
    var fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
    fireMesh.position.y = 0.6;
    fireMesh.castShadow = true;
    group.add(fireMesh);

    // Glow sphere (emissive)
    var glowGeometry = new THREE.SphereGeometry(1, 16, 16);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      emissive: 0xFF8800,
      emissiveIntensity: 0.6,
      roughness: 0.8
    });
    var glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.y = 0.5;
    glowMesh.scale.set(0.6, 0.6, 0.6);
    glowMesh.castShadow = true;
    group.add(glowMesh);

    group.position.set(x, 0.2, z);
    group.campfireData = { fireIntensity: 0.8, pulsSpeed: 3 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createRopeBridge(x1, z1, x2, z2) {
    // Create platform ends (box platforms on cylinder poles)
    var platformGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });

    var platform1 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform1.position.set(x1, 2, z1);
    platform1.castShadow = true;
    platform1.receiveShadow = true;
    scene.add(platform1);
    sceneObjects.push(platform1);

    var platform2 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform2.position.set(x2, 2, z2);
    platform2.castShadow = true;
    platform2.receiveShadow = true;
    scene.add(platform2);
    sceneObjects.push(platform2);

    // Support poles (cylinders)
    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3C2A, roughness: 0.9 });

    for (var p = 0; p < 2; p++) {
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(x1 + p * (x2 - x1), 1, z1 + p * (z2 - z1));
      pole.castShadow = true;
      pole.receiveShadow = true;
      scene.add(pole);
      sceneObjects.push(pole);
    }

    // Rope bridge (LineSegments)
    var ropePoints = [];
    for (var i = 0; i <= 4; i++) {
      var t = i / 4;
      var px = x1 + (x2 - x1) * t;
      var pz = z1 + (z2 - z1) * t;
      ropePoints.push(new THREE.Vector3(px, 2.2, pz));
    }

    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
    var ropeLine = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(ropeLine);
    sceneObjects.push(ropeLine);

    var ropeData = {
      midX: (x1 + x2) / 2,
      midZ: (z1 + z2) / 2,
      amplitude: 0.15,
      speed: 2,
      offset: 0
    };
    ropeSegments.push({ line: ropeLine, points: ropePoints, data: ropeData });
  }

  function createJungleTreeLine() {
    // Dense cluster of trees along perimeter
    var treePositions = [
      [-15, 0, -20], [-12, 0, -22], [-10, 0, -20], [-8, 0, -23],
      [15, 0, -20], [12, 0, -22], [10, 0, -20], [8, 0, -23],
      [-15, 0, 20], [-12, 0, 22], [-10, 0, 20], [-8, 0, 23],
      [15, 0, 20], [12, 0, 22], [10, 0, 20], [8, 0, 23]
    ];

    treePositions.forEach(function(pos) {
      // Trunk (cylinder)
      var trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 5, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.9 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos[0], pos[1] + 2.5, pos[2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      sceneObjects.push(trunk);

      // Canopy (sphere)
      var canopyGeometry = new THREE.SphereGeometry(2.5, 8, 8);
      var canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x1B4D0E, roughness: 0.6 });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(pos[0], pos[1] + 5.5, pos[2]);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      scene.add(canopy);
      sceneObjects.push(canopy);
    });
  }

  function createGuardPost(x, z) {
    var group = new THREE.Group();

    // Elevated platform (box)
    var platformGeometry = new THREE.BoxGeometry(2.5, 0.4, 2.5);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 2.5, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Support pole (cylinder)
    var poleGeometry = new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3C2A, roughness: 0.9 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 1.25, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Searchlight beam (cone)
    var beamGeometry = new THREE.ConeGeometry(1.5, 3, 12);
    var beamMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5,
      roughness: 0.6
    });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 2.5, 1.5);
    beam.rotation.x = -Math.PI / 4;
    beam.castShadow = true;
    group.add(beam);

    group.position.set(x, 0, z);
    group.searchlightData = { beam: beam, angle: 0, speed: 2 };
    scene.add(group);
    sceneObjects.push(group);
    searchlights.push(group);
    return group;
  }

  function createGuerrillaFighter(x, z) {
    var group = new THREE.Group();

    // Body (green box with camouflage pattern)
    var bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.7 });
    var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0.4, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Head (smaller box)
    var headGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.25);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.7 });
    var headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.set(0, 1.15, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    group.add(headMesh);

    // Boonie hat (flat box on top)
    var hatGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    var hatMaterial = new THREE.MeshStandardMaterial({ color: 0x1B3D0D, roughness: 0.8 });
    var hatMesh = new THREE.Mesh(hatGeometry, hatMaterial);
    hatMesh.position.set(0, 1.35, 0);
    hatMesh.castShadow = true;
    hatMesh.receiveShadow = true;
    group.add(hatMesh);

    // Arms (cylinders)
    var armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.7 });

    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.25, 0.7, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.25, 0.7, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    group.position.set(x, 0, z);
    group.isFighter = true;
    group.health = 3;
    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;

    // Setup fog (dense jungle humidity)
    scene.fog = new THREE.Fog(0x1a472a, 30, 60);
    scene.background = new THREE.Color(0x0d2a15);

    // Setup lighting (dappled jungle lighting)
    var ambientLight = new THREE.AmbientLight(0x4a6741, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x90EE90, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    // Ground plane (dark green)
    var groundGeometry = new THREE.BoxGeometry(40, 0.2, 40);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a472a, roughness: 0.9 });
    var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.position.set(0, -0.1, 0);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);
    sceneObjects.push(groundMesh);

    // Create scene elements
    createCanvasTent(-8, -8);
    createCanvasTent(8, -8);
    createCanvasTent(-8, 8);
    createCanvasTent(8, 8);

    createWeaponsCrate(-5, 0);
    createWeaponsCrate(5, 0);
    createWeaponsCrate(0, -5);
    createWeaponsCrate(0, 5);

    createObstacleCourse(-10, -15);

    campfire = createCampfire(0, 0);

    createRopeBridge(-10, 5, 10, 5);
    createRopeBridge(-10, -5, 10, -5);

    createJungleTreeLine();

    createGuardPost(-12, 12);
    createGuardPost(12, 12);

    // Create guerrilla fighters
    createGuerrillaFighter(-3, 3);
    createGuerrillaFighter(3, -3);
    createGuerrillaFighter(6, 6);

    // Setup HUD
    setupHUD();

    // Setup keyboard listener
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleKeyPress);
    }

    return {
      sceneObjects: sceneObjects,
      enemies: enemies
    };
  }

  function setupHUD() {
    if (typeof document !== 'undefined') {
      hudElement = document.createElement('div');
      hudElement.id = 'jungle-camp-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.right = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      hudElement.style.padding = '10px 15px';
      hudElement.style.border = '2px solid #00FF00';
      hudElement.style.borderRadius = '4px';
      hudElement.style.zIndex = '1000';
      hudElement.style.whiteSpace = 'pre';
      hudElement.style.textShadow = '0 0 10px #00FF00';

      if (document.body) {
        document.body.appendChild(hudElement);
      }

      updateHUD();
    }
  }

  function update(delta) {
    elapsedTime += delta;

    // Animate campfire flicker and pulse
    if (campfire) {
      var children = campfire.children;
      for (var i = 0; i < children.length; i++) {
        if (children[i].material && children[i].material.emissive) {
          var fireIntensity = campfire.campfireData.pulsSpeed;
          var pulse = 0.6 + 0.4 * Math.sin(elapsedTime * fireIntensity);
          children[i].material.emissiveIntensity = pulse;
        }
      }
    }

    // Animate rope bridge sway
    ropeSegments.forEach(function(ropeData) {
      var offset = Math.sin(elapsedTime * ropeData.data.speed) * ropeData.data.amplitude;
      var newPoints = [];

      for (var i = 0; i < ropeData.points.length; i++) {
        var origPoint = ropeData.points[i];
        var newPoint = new THREE.Vector3(
          origPoint.x + (i > 0 && i < ropeData.points.length - 1 ? offset : 0),
          origPoint.y,
          origPoint.z
        );
        newPoints.push(newPoint);
      }

      ropeData.line.geometry.dispose();
      ropeData.line.geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
    });

    // Animate searchlight rotation
    searchlights.forEach(function(post) {
      var beam = post.searchlightData.beam;
      beam.rotation.y += delta * post.searchlightData.speed;
    });

    // Simple enemy patrol (back and forth)
    enemies.forEach(function(enemy) {
      var patrolDist = 3;
      var patrolSpeed = 1;
      enemy.position.x += Math.sin(elapsedTime * patrolSpeed) * 0.05;
    });
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    // Remove HUD element
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Remove keyboard listener
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleKeyPress);
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    searchlights = [];
    ropeSegments = [];
    campfire = null;
    gameState = {
      weaponsCaches: 0,
      maxWeaponsCaches: 4,
      fightersDown: 0,
      intelligenceFiles: 0,
      maxIntelligenceFiles: 2
    };
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    gameState: gameState
  };
}());
