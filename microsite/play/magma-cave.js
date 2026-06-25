window.MagmaCave = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var animatedObjects = [];
  var magmaBubbles = [];
  var elevatorPlatform = null;
  var crystalLights = [];

  function createMaterial(color, emissive) {
    emissive = emissive || 0x000000;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      metalness: 0.4,
      roughness: 0.6
    });
  }

  function addToScene(mesh) {
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCaveCeiling() {
    var ceilingY = 15;
    var ceilingMaterial = createMaterial(0x2a2a2a, 0x000000);

    // Main ceiling base
    var ceilingBase = new THREE.Mesh(
      new THREE.BoxGeometry(60, 2, 60),
      ceilingMaterial
    );
    ceilingBase.position.y = ceilingY;
    addToScene(ceilingBase);

    // Stalactites hanging from ceiling
    for (var i = 0; i < 25; i++) {
      var x = (Math.random() - 0.5) * 55;
      var z = (Math.random() - 0.5) * 55;
      var stalactiteLength = 2 + Math.random() * 4;

      // Cone stalactite
      var stalactite = new THREE.Mesh(
        new THREE.ConeGeometry(0.4 + Math.random() * 0.3, stalactiteLength, 8),
        ceilingMaterial
      );
      stalactite.position.set(x, ceilingY - stalactiteLength / 2, z);
      stalactite.rotation.z = (Math.random() - 0.5) * 0.3;
      stalactite.rotation.x = (Math.random() - 0.5) * 0.3;
      addToScene(stalactite);

      // Box stalactite column
      var stalactiteBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, stalactiteLength * 0.6, 0.3),
        ceilingMaterial
      );
      stalactiteBox.position.set(x + 1.5, ceilingY - stalactiteLength * 0.4, z);
      addToScene(stalactiteBox);
    }
  }

  function createCaveFloor() {
    var floorMaterial = createMaterial(0x3a3a3a, 0x000000);

    // Rough terrain chunks
    for (var i = 0; i < 30; i++) {
      var x = (Math.random() - 0.5) * 58;
      var z = (Math.random() - 0.5) * 58;
      var height = 0.5 + Math.random() * 1.5;
      var width = 1 + Math.random() * 2;
      var depth = 1 + Math.random() * 2;

      var chunk = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        floorMaterial
      );
      chunk.position.set(x, height / 2 - 0.25, z);
      chunk.rotation.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * 0.4
      );
      addToScene(chunk);
    }
  }

  function createMagmaRivers() {
    var magmaMaterial = createMaterial(0xff6600, 0xff3300);

    // Horizontal magma channels
    var river1 = new THREE.Mesh(
      new THREE.BoxGeometry(45, 1.5, 3),
      magmaMaterial
    );
    river1.position.set(0, 0.75, 0);
    addToScene(river1);

    var river2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 45),
      magmaMaterial
    );
    river2.position.set(0, 0.75, 0);
    addToScene(river2);

    // Connecting side channels
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 20;
      var z = Math.sin(angle) * 20;

      var channel = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1, 2),
        magmaMaterial
      );
      channel.position.set(x, 0.5, z);
      channel.rotation.y = angle;
      addToScene(channel);
    }
  }

  function createRockPillars() {
    var pillarMaterial = createMaterial(0x4a4a4a, 0x000000);

    // Pillars connecting floor to ceiling
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = Math.cos(angle) * 18;
      var z = Math.sin(angle) * 18;
      var radius = 0.6 + Math.random() * 0.3;

      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.2, 14, 12),
        pillarMaterial
      );
      pillar.position.set(x, 7, z);
      addToScene(pillar);
    }
  }

  function createMagmaPools() {
    var poolPlatformMaterial = createMaterial(0xcc3300, 0xff2200);
    var bubbleMaterial = createMaterial(0xff6600, 0xff5500);

    // Magma pools
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var x = Math.cos(angle) * 15 + (Math.random() - 0.5) * 5;
      var z = Math.sin(angle) * 15 + (Math.random() - 0.5) * 5;

      // Pool platform
      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.8, 4),
        poolPlatformMaterial
      );
      platform.position.set(x, 0.4, z);
      addToScene(platform);

      // Bubble clusters above pools
      for (var b = 0; b < 15; b++) {
        var bubbleRadius = 0.3 + Math.random() * 0.2;
        var bubble = new THREE.Mesh(
          new THREE.SphereGeometry(bubbleRadius, 8, 8),
          bubbleMaterial
        );
        var offsetX = (Math.random() - 0.5) * 3;
        var offsetZ = (Math.random() - 0.5) * 3;
        var offsetY = 1.5 + Math.random() * 2;

        bubble.position.set(x + offsetX, offsetY, z + offsetZ);
        bubble.userData.startY = bubble.position.y;
        bubble.userData.bobSpeed = 1 + Math.random() * 2;
        bubble.userData.bobAmount = 0.5 + Math.random() * 0.7;
        addToScene(bubble);
        magmaBubbles.push(bubble);
        animatedObjects.push(bubble);
      }
    }
  }

  function createCrystalFormations() {
    var crystalMaterial = createMaterial(0x4400aa, 0x6600ff);

    // Crystal clusters growing from floor
    for (var i = 0; i < 20; i++) {
      var x = (Math.random() - 0.5) * 50;
      var z = (Math.random() - 0.5) * 50;

      // Skip if too close to center (magma rivers)
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

      // Main crystal cone
      var crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 2.5, 8),
        crystalMaterial
      );
      crystal.position.set(x, 1.25, z);
      crystal.userData.baseY = 1.25;
      addToScene(crystal);
      animatedObjects.push(crystal);

      var light = new THREE.PointLight(0x6600ff, 2, 8);
      light.position.set(x, 2, z);
      scene.add(light);

      // Secondary crystals
      for (var c = 0; c < 3; c++) {
        var secondaryHeight = 1.5 + Math.random() * 1;
        var secondary = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, secondaryHeight, 8),
          crystalMaterial
        );
        var offsetX = (Math.random() - 0.5) * 1.5;
        var offsetZ = (Math.random() - 0.5) * 1.5;
        secondary.position.set(x + offsetX, secondaryHeight / 2, z + offsetZ);
        secondary.userData.baseY = secondaryHeight / 2;
        addToScene(secondary);
        animatedObjects.push(secondary);
      }

      crystalLights.push(light);
    }
  }

  function createMilitaryMiningOperation() {
    var drillerMaterial = createMaterial(0x666666, 0x333333);
    var processingMaterial = createMaterial(0x888888, 0x444444);
    var drillBitMaterial = createMaterial(0x444444, 0x222222);

    // Drill machine 1
    var drillX = -15;
    var drillZ = -15;

    var drillBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      processingMaterial
    );
    drillBase.position.set(drillX, 1, drillZ);
    addToScene(drillBase);

    var drillPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.5, 4),
      drillerMaterial
    );
    drillPlatform.position.set(drillX, 2.3, drillZ);
    addToScene(drillPlatform);

    var drillBit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2, 8),
      drillBitMaterial
    );
    drillBit.position.set(drillX, 4, drillZ);
    drillBit.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    addToScene(drillBit);
    animatedObjects.push(drillBit);

    // Processing unit 1
    var processor1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 3),
      processingMaterial
    );
    processor1.position.set(drillX + 8, 2, drillZ);
    addToScene(processor1);

    // Drill machine 2
    var drillX2 = 15;
    var drillZ2 = 15;

    var drillBase2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      processingMaterial
    );
    drillBase2.position.set(drillX2, 1, drillZ2);
    addToScene(drillBase2);

    var drillPlatform2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.5, 4),
      drillerMaterial
    );
    drillPlatform2.position.set(drillX2, 2.3, drillZ2);
    addToScene(drillPlatform2);

    var drillBit2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2, 8),
      drillBitMaterial
    );
    drillBit2.position.set(drillX2, 4, drillZ2);
    drillBit2.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
    addToScene(drillBit2);
    animatedObjects.push(drillBit2);

    var processor2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 3),
      processingMaterial
    );
    processor2.position.set(drillX2 - 8, 2, drillZ2);
    addToScene(processor2);

    // Control tower
    var tower = new THREE.Mesh(
      new THREE.BoxGeometry(2, 5, 2),
      drillerMaterial
    );
    tower.position.set(0, 2.5, 20);
    addToScene(tower);

    var towerTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1, 2.5),
      processingMaterial
    );
    towerTop.position.set(0, 5.5, 20);
    addToScene(towerTop);
  }

  function createOreDeposits() {
    var oreMaterial = createMaterial(0xffaa00, 0xff8800);

    // Glowing ore clusters in walls
    for (var i = 0; i < 18; i++) {
      var x = (Math.random() - 0.5) * 56;
      var z = (Math.random() - 0.5) * 56;
      var y = 2 + Math.random() * 8;

      // Cluster of ore spheres
      for (var o = 0; o < 5; o++) {
        var oreRadius = 0.3 + Math.random() * 0.2;
        var ore = new THREE.Mesh(
          new THREE.SphereGeometry(oreRadius, 6, 6),
          oreMaterial
        );
        var offsetX = (Math.random() - 0.5) * 1.2;
        var offsetY = (Math.random() - 0.5) * 1.2;
        var offsetZ = (Math.random() - 0.5) * 1.2;
        ore.position.set(x + offsetX, y + offsetY, z + offsetZ);
        addToScene(ore);

        var oreLight = new THREE.PointLight(0xff8800, 1.5, 6);
        oreLight.position.copy(ore.position);
        scene.add(oreLight);
      }
    }
  }

  function createElevatorShaft() {
    var shaftMaterial = createMaterial(0x555555, 0x000000);
    var platformMaterial = createMaterial(0x888888, 0x333333);

    // Elevator shaft walls
    var shaftWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 12, 0.3),
      shaftMaterial
    );
    shaftWall1.position.set(-23, 6, -23);
    addToScene(shaftWall1);

    var shaftWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 12, 0.3),
      shaftMaterial
    );
    shaftWall2.position.set(-19, 6, -23);
    addToScene(shaftWall2);

    var shaftWall3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 12, 4),
      shaftMaterial
    );
    shaftWall3.position.set(-23, 6, -23);
    addToScene(shaftWall3);

    var shaftWall4 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 12, 4),
      shaftMaterial
    );
    shaftWall4.position.set(-19, 6, -23);
    addToScene(shaftWall4);

    // Elevator platform
    elevatorPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.5, 3.5),
      platformMaterial
    );
    elevatorPlatform.position.set(-21, 2, -21);
    elevatorPlatform.userData.minY = 1;
    elevatorPlatform.userData.maxY = 10;
    elevatorPlatform.userData.speed = 3;
    elevatorPlatform.userData.direction = 1;
    addToScene(elevatorPlatform);
    animatedObjects.push(elevatorPlatform);
  }

  function createEmergencyExitTunnels() {
    var tunnelMaterial = createMaterial(0x3a3a3a, 0x000000);
    var doorFrameMaterial = createMaterial(0x666666, 0x333333);

    // Exit tunnel 1 (North)
    var tunnel1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 8),
      tunnelMaterial
    );
    tunnel1.position.set(0, 2, -28);
    addToScene(tunnel1);

    var doorFrame1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 3.5, 0.4),
      doorFrameMaterial
    );
    doorFrame1.position.set(0, 2.5, -32);
    addToScene(doorFrame1);

    // Exit tunnel 2 (South)
    var tunnel2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 8),
      tunnelMaterial
    );
    tunnel2.position.set(0, 2, 28);
    addToScene(tunnel2);

    var doorFrame2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 3.5, 0.4),
      doorFrameMaterial
    );
    doorFrame2.position.set(0, 2.5, 32);
    addToScene(doorFrame2);

    // Exit tunnel 3 (East)
    var tunnel3 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 4),
      tunnelMaterial
    );
    tunnel3.position.set(28, 2, 0);
    addToScene(tunnel3);

    var doorFrame3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3.5, 3.5),
      doorFrameMaterial
    );
    doorFrame3.position.set(32, 2.5, 0);
    addToScene(doorFrame3);

    // Exit tunnel 4 (West)
    var tunnel4 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 4),
      tunnelMaterial
    );
    tunnel4.position.set(-28, 2, 0);
    addToScene(tunnel4);

    var doorFrame4 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3.5, 3.5),
      doorFrameMaterial
    );
    doorFrame4.position.set(-32, 2.5, 0);
    addToScene(doorFrame4);
  }

  function createSupportScaffolding() {
    var beamMaterial = createMaterial(0x777777, 0x333333);

    // Horizontal scaffolding beams
    for (var i = 0; i < 5; i++) {
      var y = 3 + i * 2;

      var beamX = new THREE.Mesh(
        new THREE.BoxGeometry(50, 0.3, 0.3),
        beamMaterial
      );
      beamX.position.y = y;
      addToScene(beamX);

      var beamZ = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 50),
        beamMaterial
      );
      beamZ.position.y = y;
      addToScene(beamZ);
    }

    // Cross-bracing with LineSegments
    var bracingGeometry = new THREE.BufferGeometry();
    var bracingPoints = [];

    // Diagonal bracing patterns
    for (var bx = -25; bx <= 25; bx += 10) {
      for (var bz = -25; bz <= 25; bz += 10) {
        for (var by = 3; by <= 11; by += 4) {
          // X diagonal
          bracingPoints.push(bx - 2, by, bz - 2);
          bracingPoints.push(bx + 2, by + 2, bz + 2);

          // Z diagonal
          bracingPoints.push(bx - 2, by, bz + 2);
          bracingPoints.push(bx + 2, by + 2, bz - 2);
        }
      }
    }

    bracingGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(bracingPoints), 3)
    );
    var bracingMaterial = new THREE.LineBasicMaterial({ color: 0x999999 });
    var bracing = new THREE.LineSegments(bracingGeometry, bracingMaterial);
    scene.add(bracing);
    meshes.push(bracing);
  }

  function createHeatVents() {
    var ventPipeMaterial = createMaterial(0x555555, 0x222222);
    var ventGlowMaterial = createMaterial(0xff3300, 0xff2200);

    // Heat vents scattered around
    for (var i = 0; i < 10; i++) {
      var x = (Math.random() - 0.5) * 50;
      var z = (Math.random() - 0.5) * 50;

      // Vent pipe
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 3, 8),
        ventPipeMaterial
      );
      pipe.position.set(x, 1.5, z);
      addToScene(pipe);

      // Glow at opening
      var ventOpening = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.2, 8),
        ventGlowMaterial
      );
      ventOpening.position.set(x, 3, z);
      addToScene(ventOpening);

      var ventLight = new THREE.PointLight(0xff3300, 1.5, 6);
      ventLight.position.set(x, 3.5, z);
      scene.add(ventLight);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    animatedObjects = [];
    magmaBubbles = [];
    crystalLights = [];

    createCaveCeiling();
    createCaveFloor();
    createMagmaRivers();
    createRockPillars();
    createMagmaPools();
    createCrystalFormations();
    createMilitaryMiningOperation();
    createOreDeposits();
    createElevatorShaft();
    createEmergencyExitTunnels();
    createSupportScaffolding();
    createHeatVents();

    return meshes.length;
  }

  function update(delta) {
    var i;

    // Animate magma bubbles rising
    for (i = 0; i < magmaBubbles.length; i++) {
      var bubble = magmaBubbles[i];
      var elapsed = (Date.now() / 1000) * bubble.userData.bobSpeed;
      bubble.position.y = bubble.userData.startY +
        Math.sin(elapsed) * bubble.userData.bobAmount;
    }

    // Animate crystal pulsing glow
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.userData.baseY !== undefined) {
        // Crystal pulsing
        var pulse = Math.sin((Date.now() / 1000) * 2) * 0.15;
        obj.position.y = obj.userData.baseY + pulse;
      }

      if (obj.userData.rotationAxis !== undefined) {
        // Drill bit spinning
        obj.rotation.y += delta * 3;
      }
    }

    // Animate elevator platform
    if (elevatorPlatform) {
      elevatorPlatform.position.y += elevatorPlatform.userData.direction *
        elevatorPlatform.userData.speed * delta;

      if (elevatorPlatform.position.y >= elevatorPlatform.userData.maxY) {
        elevatorPlatform.userData.direction = -1;
      }
      if (elevatorPlatform.position.y <= elevatorPlatform.userData.minY) {
        elevatorPlatform.userData.direction = 1;
      }
    }

    // Update crystal light intensities
    for (i = 0; i < crystalLights.length; i++) {
      var light = crystalLights[i];
      var intensity = 1.5 + Math.sin((Date.now() / 1000) * 1.5) * 0.8;
      light.intensity = intensity;
    }
  }

  function reset() {
    var i;

    // Remove all meshes
    for (i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
      if (meshes[i].geometry) {
        meshes[i].geometry.dispose();
      }
      if (meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var m = 0; m < meshes[i].material.length; m++) {
            meshes[i].material[m].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
    }

    // Remove crystal lights
    for (i = 0; i < crystalLights.length; i++) {
      scene.remove(crystalLights[i]);
    }

    // Remove ore lights
    var lightsToRemove = [];
    for (i = 0; i < scene.children.length; i++) {
      var child = scene.children[i];
      if (child instanceof THREE.Light && child !== scene.background) {
        lightsToRemove.push(child);
      }
    }
    for (i = 0; i < lightsToRemove.length; i++) {
      scene.remove(lightsToRemove[i]);
    }

    meshes = [];
    animatedObjects = [];
    magmaBubbles = [];
    elevatorPlatform = null;
    crystalLights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
