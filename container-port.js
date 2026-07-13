window.ContainerPort = (function() {
  'use strict';

  var scene, camera;
  var craneHook, craneWheel, tugboat, tugboatSmokestack, containerMazeGroup;
  var gantryBaseLeft, gantryBaseRight, gantryBridge, craneCarriage;
  var dockLights = [];
  var guardMeshes = [];
  var contraband, contrabandGlow;
  var reachStacker, weighbridge;
  var harborTower, customsBuilding;
  var perimeter = [];
  var craneHookY = 15;
  var craneHookDirection = -1;
  var tugboatWave = 0;
  var tugboatWaveSpeed = 2;
  var dockLightAngle = 0;
  var reachStackerX = -30;
  var reachStackerDirection = 1;
  var customsScannerAngle = 0;
  var contrabandOpening = false;
  var contrabandOpenAmount = 0;

  var CONTAINER_COLORS = [0x2244AA, 0xAA2222, 0x226622];
  var CONTAINER_WIDTH = 4;
  var CONTAINER_HEIGHT = 3;
  var CONTAINER_DEPTH = 8;

  var spawnPoints = [];

  function init(s, c) {
    scene = s;
    camera = c;
    containerMazeGroup = new THREE.Group();
    scene.add(containerMazeGroup);

    // Build container maze - multiple rows and columns, stacked 3-4 high
    var containerStartX = -50;
    var containerStartZ = -80;
    var colSpacing = CONTAINER_WIDTH * 1.1;
    var rowSpacing = CONTAINER_DEPTH * 1.1;
    var verticalSpacing = CONTAINER_HEIGHT * 1.05;

    for (var row = 0; row < 6; row++) {
      for (var col = 0; col < 5; col++) {
        for (var level = 0; level < 4; level++) {
          var x = containerStartX + col * colSpacing;
          var y = level * verticalSpacing + CONTAINER_HEIGHT / 2;
          var z = containerStartZ + row * rowSpacing;
          var colorIdx = (row + col + level) % CONTAINER_COLORS.length;
          var container = createContainer(x, y, z, CONTAINER_COLORS[colorIdx]);
          containerMazeGroup.add(container);
        }
      }
    }

    // Container alley spawn point
    spawnPoints.push({
      name: 'alley',
      position: new THREE.Vector3(-40, 1.5, -30)
    });

    // Build gantry crane - tall structure spanning container area
    var craneX = 0;
    var craneZ = -50;
    var craneHeight = 40;
    var craneSpan = 80;

    // Left base leg
    gantryBaseLeft = new THREE.Mesh(
      new THREE.BoxGeometry(3, craneHeight, 3),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    gantryBaseLeft.position.set(craneX - craneSpan / 2, craneHeight / 2, craneZ);
    containerMazeGroup.add(gantryBaseLeft);

    // Right base leg
    gantryBaseRight = new THREE.Mesh(
      new THREE.BoxGeometry(3, craneHeight, 3),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    gantryBaseRight.position.set(craneX + craneSpan / 2, craneHeight / 2, craneZ);
    containerMazeGroup.add(gantryBaseRight);

    // Horizontal bridge beam
    gantryBridge = new THREE.Mesh(
      new THREE.BoxGeometry(craneSpan, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    gantryBridge.position.set(craneX, craneHeight - 2, craneZ);
    containerMazeGroup.add(gantryBridge);

    // Crane carriage on bridge
    craneCarriage = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 3),
      new THREE.MeshStandardMaterial({ color: 0x777777 })
    );
    craneCarriage.position.set(craneX - 20, craneHeight - 3, craneZ);
    containerMazeGroup.add(craneCarriage);

    // Crane hook
    var hookGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
    craneHook = new THREE.Mesh(
      hookGeometry,
      new THREE.MeshStandardMaterial({ color: 0xFFDD00, emissive: 0x664400 })
    );
    craneHook.position.set(craneCarriage.position.x, craneHeight - 5, craneZ);
    craneHookY = craneHook.position.y;
    containerMazeGroup.add(craneHook);

    // Crane control cab
    var cabGeometry = new THREE.BoxGeometry(4, 3, 3);
    var cab = new THREE.Mesh(
      cabGeometry,
      new THREE.MeshStandardMaterial({ color: 0x334455 })
    );
    cab.position.set(craneX - 35, craneHeight - 3, craneZ - 8);
    containerMazeGroup.add(cab);

    // Spawn at crane control
    spawnPoints.push({
      name: 'crane',
      position: new THREE.Vector3(craneX - 35, craneHeight - 5, craneZ - 12)
    });

    // Tugboat at dock
    var dockZ = 60;

    // Hull
    var hullGeometry = new THREE.BoxGeometry(12, 6, 25);
    tugboat = new THREE.Mesh(
      hullGeometry,
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    tugboat.position.set(30, 3, dockZ);
    containerMazeGroup.add(tugboat);

    // Smokestack
    var stackGeometry = new THREE.CylinderGeometry(1.5, 1.8, 8, 16);
    tugboatSmokestack = new THREE.Mesh(
      stackGeometry,
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    tugboatSmokestack.position.set(30, 8, dockZ - 5);
    containerMazeGroup.add(tugboatSmokestack);

    // Dock spawn
    spawnPoints.push({
      name: 'dock',
      position: new THREE.Vector3(50, 1.5, dockZ - 15)
    });

    // Customs inspection building
    var customsBuildingGeometry = new THREE.BoxGeometry(20, 12, 25);
    customsBuilding = new THREE.Mesh(
      customsBuildingGeometry,
      new THREE.MeshStandardMaterial({ color: 0xAA9944 })
    );
    customsBuilding.position.set(-70, 6, 30);
    containerMazeGroup.add(customsBuilding);

    // Customs building roof
    var roofGeometry = new THREE.BoxGeometry(22, 1, 27);
    var roof = new THREE.Mesh(
      roofGeometry,
      new THREE.MeshStandardMaterial({ color: 0x665533 })
    );
    roof.position.set(-70, 12.5, 30);
    containerMazeGroup.add(roof);

    // Door opening
    var doorGeometry = new THREE.BoxGeometry(3, 5, 0.5);
    var door = new THREE.Mesh(
      doorGeometry,
      new THREE.MeshStandardMaterial({ color: 0x331111 })
    );
    door.position.set(-70, 2.5, 42.5);
    containerMazeGroup.add(door);

    // Customs scanner/checkpoint
    var scannerGeometry = new THREE.BoxGeometry(6, 4, 2);
    var scanner = new THREE.Mesh(
      scannerGeometry,
      new THREE.MeshStandardMaterial({ color: 0x2244CC, emissive: 0x1122FF })
    );
    scanner.position.set(-65, 2, 45);
    containerMazeGroup.add(scanner);

    // Customs spawn
    spawnPoints.push({
      name: 'customs',
      position: new THREE.Vector3(-75, 1.5, 25)
    });

    // Reach stacker vehicle (container handler)
    var stackerCabGeometry = new THREE.BoxGeometry(4, 4, 5);
    var stackerCab = new THREE.Mesh(
      stackerCabGeometry,
      new THREE.MeshStandardMaterial({ color: 0xFF9900 })
    );
    stackerCab.position.set(-30, 2, -60);
    containerMazeGroup.add(stackerCab);

    // Reach stacker mast
    var mastGeometry = new THREE.BoxGeometry(1, 12, 1);
    var mast = new THREE.Mesh(
      mastGeometry,
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    mast.position.set(-30, 6, -60);
    containerMazeGroup.add(mast);

    // Reach stacker forks
    var forksGeometry = new THREE.BoxGeometry(4, 1, 3);
    var forks = new THREE.Mesh(
      forksGeometry,
      new THREE.MeshStandardMaterial({ color: 0xFFDD00 })
    );
    forks.position.set(-30, 8, -60);
    containerMazeGroup.add(forks);

    reachStacker = stackerCab;

    // Dock pilings in water
    for (var i = 0; i < 8; i++) {
      var pilingGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 16);
      var piling = new THREE.Mesh(
        pilingGeometry,
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      piling.position.set(50 + i * 8, 10, 85);
      containerMazeGroup.add(piling);
    }

    // Floodlights on poles
    for (var i = 0; i < 4; i++) {
      var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
      var pole = new THREE.Mesh(
        poleGeometry,
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      var px = -60 + i * 40;
      pole.position.set(px, 12.5, -90);
      containerMazeGroup.add(pole);

      // Light fixture at top
      var lightFixtureGeometry = new THREE.BoxGeometry(3, 2, 2);
      var lightFixture = new THREE.Mesh(
        lightFixtureGeometry,
        new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x444444 })
      );
      lightFixture.position.set(px, 24.5, -90);
      containerMazeGroup.add(lightFixture);

      // Store for animation
      dockLights.push({
        mesh: lightFixture,
        poleX: px
      });
    }

    // Contraband hidden container (glowing)
    var contrabandX = -50;
    var contrabandY = CONTAINER_HEIGHT + CONTAINER_HEIGHT * 1.05;
    var contrabandZ = -80;

    var contrabandGeometry = new THREE.BoxGeometry(
      CONTAINER_WIDTH,
      CONTAINER_HEIGHT,
      CONTAINER_DEPTH
    );
    contraband = new THREE.Mesh(
      contrabandGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5
      })
    );
    contraband.position.set(contrabandX, contrabandY, contrabandZ);
    containerMazeGroup.add(contraband);

    // Glow outline for contraband
    var glowGeometry = new THREE.BoxGeometry(
      CONTAINER_WIDTH + 0.2,
      CONTAINER_HEIGHT + 0.2,
      CONTAINER_DEPTH + 0.2
    );
    contrabandGlow = new THREE.Mesh(
      glowGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF3300,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.3,
        wireframe: true
      })
    );
    contrabandGlow.position.set(contrabandX, contrabandY, contrabandZ);
    containerMazeGroup.add(contrabandGlow);

    // Contraband spawn
    spawnPoints.push({
      name: 'contraband',
      position: new THREE.Vector3(contrabandX + 5, contrabandY + 2, contrabandZ)
    });

    // Harbor master tower
    var towerGeometry = new THREE.BoxGeometry(6, 20, 6);
    harborTower = new THREE.Mesh(
      towerGeometry,
      new THREE.MeshStandardMaterial({ color: 0x776655 })
    );
    harborTower.position.set(70, 10, 20);
    containerMazeGroup.add(harborTower);

    // Tower window
    var windowGeometry = new THREE.BoxGeometry(4, 3, 0.5);
    var window = new THREE.Mesh(
      windowGeometry,
      new THREE.MeshStandardMaterial({ color: 0x1166CC })
    );
    window.position.set(70, 15, 23.5);
    containerMazeGroup.add(window);

    // Weighbridge scale station
    var scaleGeometry = new THREE.BoxGeometry(15, 1, 8);
    weighbridge = new THREE.Mesh(
      scaleGeometry,
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    weighbridge.position.set(-20, 0.5, 15);
    containerMazeGroup.add(weighbridge);

    // Scale number display
    var displayGeometry = new THREE.BoxGeometry(8, 2, 1);
    var display = new THREE.Mesh(
      displayGeometry,
      new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x00FF00 })
    );
    display.position.set(-20, 2, 20);
    containerMazeGroup.add(display);

    // Perimeter fence
    var fenceHeight = 6;
    var fenceStartX = -100;
    var fenceEndX = 100;
    var fenceZ = -100;

    // North fence
    for (var i = 0; i < 20; i++) {
      var postGeometry = new THREE.BoxGeometry(0.5, fenceHeight, 0.5);
      var post = new THREE.Mesh(
        postGeometry,
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      post.position.set(fenceStartX + i * 10, fenceHeight / 2, fenceZ);
      containerMazeGroup.add(post);
    }

    // West fence
    for (var i = 0; i < 20; i++) {
      var postGeometry = new THREE.BoxGeometry(0.5, fenceHeight, 0.5);
      var post = new THREE.Mesh(
        postGeometry,
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      post.position.set(fenceStartX, fenceHeight / 2, fenceZ + i * 10);
      containerMazeGroup.add(post);
    }

    // Perimeter gate (south side)
    var gateGeometry = new THREE.BoxGeometry(8, fenceHeight, 1);
    var gate = new THREE.Mesh(
      gateGeometry,
      new THREE.MeshStandardMaterial({ color: 0xCC0000 })
    );
    gate.position.set(0, fenceHeight / 2, 100);
    containerMazeGroup.add(gate);

    // Create guard positions throughout the yard
    var guardPositions = [
      { x: -50, z: -40 },
      { x: 20, z: -60 },
      { x: -70, z: 10 },
      { x: 40, z: 25 },
      { x: 0, z: 0 }
    ];

    guardPositions.forEach(function(pos) {
      var guard = createGuard(pos.x, pos.z);
      containerMazeGroup.add(guard);
      guardMeshes.push(guard);
    });
  }

  function createContainer(x, y, z, color) {
    var containerGeometry = new THREE.BoxGeometry(
      CONTAINER_WIDTH,
      CONTAINER_HEIGHT,
      CONTAINER_DEPTH
    );
    var containerMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.3
    });
    var container = new THREE.Mesh(containerGeometry, containerMaterial);
    container.position.set(x, y, z);
    container.castShadow = true;
    container.receiveShadow = true;
    return container;
  }

  function createGuard(x, z) {
    var groupGeometry = new THREE.BoxGeometry(0.8, 2, 0.8);
    var group = new THREE.Mesh(
      groupGeometry,
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    group.position.set(x, 1, z);
    return group;
  }

  function update(delta) {
    if (!scene) return;

    // Gantry crane hook up/down
    craneHookY += craneHookDirection * delta * 8;
    if (craneHookY > 30 || craneHookY < 10) {
      craneHookDirection *= -1;
    }
    if (craneHook) {
      craneHook.position.y = craneHookY;
    }

    // Crane carriage moving back and forth
    if (craneCarriage) {
      craneCarriage.position.x += delta * 15;
      if (craneCarriage.position.x > 20 || craneCarriage.position.x < -50) {
        // Reset position
        craneCarriage.position.x = -50;
      }
      if (craneHook) {
        craneHook.position.x = craneCarriage.position.x;
      }
    }

    // Tugboat rocking motion
    if (tugboat) {
      tugboatWave += delta * tugboatWaveSpeed;
      tugboat.position.y = 3 + Math.sin(tugboatWave) * 0.5;
      if (tugboatSmokestack) {
        tugboatSmokestack.position.y = 8 + Math.sin(tugboatWave) * 0.5;
      }
    }

    // Dock lights sweeping
    dockLightAngle += delta * 0.5;
    dockLights.forEach(function(light) {
      light.mesh.rotation.y = Math.sin(dockLightAngle) * 0.3;
    });

    // Reach stacker moving back and forth
    if (reachStacker) {
      reachStacker.position.x += reachStackerDirection * delta * 10;
      if (reachStacker.position.x > 20 || reachStacker.position.x < -60) {
        reachStackerDirection *= -1;
      }
    }

    // Custom scanner beeping (rotation animation)
    customsScannerAngle += delta * 3;

    // Contraband container opening when triggered
    if (contrabandOpening) {
      contrabandOpenAmount = Math.min(contrabandOpenAmount + delta * 2, 1);
      if (contraband) {
        contraband.rotation.x = contrabandOpenAmount * Math.PI / 4;
      }
      if (contrabandGlow) {
        contrabandGlow.rotation.x = contrabandOpenAmount * Math.PI / 4;
        contrabandGlow.material.emissiveIntensity = 0.8 + contrabandOpenAmount * 0.5;
      }
    }

    // Guard patrol animations
    guardMeshes.forEach(function(guard, idx) {
      var time = Date.now() * 0.001 + idx;
      guard.rotation.y = Math.sin(time * 0.5) * 0.2;
      guard.position.y = 1 + Math.sin(time) * 0.1;
    });
  }

  function reset() {
    contrabandOpening = false;
    contrabandOpenAmount = 0;
    if (contraband) {
      contraband.rotation.x = 0;
    }
    if (contrabandGlow) {
      contrabandGlow.rotation.x = 0;
      contrabandGlow.material.emissiveIntensity = 0.8;
    }
    craneHookY = 15;
    craneHookDirection = -1;
    tugboatWave = 0;
    dockLightAngle = 0;
    reachStackerX = -30;
    reachStackerDirection = 1;
    customsScannerAngle = 0;

    if (craneCarriage) {
      craneCarriage.position.x = -50;
    }
    if (craneHook) {
      craneHook.position.x = -50;
      craneHook.position.y = 15;
    }
    if (tugboat) {
      tugboat.position.y = 3;
    }
    if (tugboatSmokestack) {
      tugboatSmokestack.position.y = 8;
    }
    if (reachStacker) {
      reachStacker.position.x = -30;
    }
  }

  function triggerContrabandOpening() {
    contrabandOpening = true;
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    triggerContrabandOpening: triggerContrabandOpening,
    getSpawnPoints: getSpawnPoints
  };
}());
