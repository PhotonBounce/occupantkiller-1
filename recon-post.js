window.ReconPost = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  // Animation state
  var scopePanAngle = 0;
  var satcomDishAngle = 0;
  var thermalCamAngle = 0;
  var camoNetSway = 0;

  // Game objects
  var gameObjects = [];
  var lineSegmentsObjects = [];

  function createBoxGeometry(width, height, depth, x, y, z, color) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  function createCylinderGeometry(radiusTop, radiusBottom, height, segments, x, y, z, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  function createSphereGeometry(radius, widthSegments, heightSegments, x, y, z, color) {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  function createConeGeometry(radius, height, segments, x, y, z, color) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positionArray = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positionArray[i * 3] = points[i].x;
      positionArray[i * 3 + 1] = points[i].y;
      positionArray[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var lineSegments = new THREE.LineSegments(geometry, material);
    scene.add(lineSegments);
    lineSegmentsObjects.push(lineSegments);
    return lineSegments;
  }

  function createCamoNettingMesh() {
    // Diamond pattern mesh for camouflage netting
    var points = [];
    var spacing = 1.5;
    var width = 25;
    var depth = 20;

    for (var x = -width / 2; x <= width / 2; x += spacing) {
      for (var z = -depth / 2; z <= depth / 2; z += spacing) {
        points.push({ x: x, y: 4.5, z: z });
      }
    }

    // Create diamond grid pattern
    var gridPoints = [];
    for (var i = -width / 2; i <= width / 2; i += spacing) {
      for (var j = -depth / 2; j <= depth / 2; j += spacing) {
        gridPoints.push({ x: i, y: 4.5, z: j });
        if (i + spacing <= width / 2) {
          gridPoints.push({ x: i + spacing, y: 4.5, z: j });
        }
        if (j + spacing <= depth / 2) {
          gridPoints.push({ x: i, y: 4.5, z: j + spacing });
        }
      }
    }

    createLineSegments(gridPoints, 0x4a4a2a);
  }

  function createLeafScatter() {
    // Brown camouflage boxes scattered on netting
    for (var i = 0; i < 8; i++) {
      var x = (Math.random() - 0.5) * 24;
      var z = (Math.random() - 0.5) * 18;
      createBoxGeometry(0.8, 0.1, 0.6, x, 4.6, z, 0x3d3d1f);
    }
  }

  function createMainObservationHide() {
    // Low, wide shelter for observation
    createBoxGeometry(6, 2, 4, 0, 1, -8, 0x2a2a1a);
    // Roof overhang
    createBoxGeometry(7, 0.3, 4.5, 0, 3.1, -8, 0x1a1a0a);
    // Left wall
    createBoxGeometry(0.4, 2, 4, -3, 1, -8, 0x3a3a2a);
    // Right wall
    createBoxGeometry(0.4, 2, 4, 3, 1, -8, 0x3a3a2a);
    // Back wall
    createBoxGeometry(6, 2, 0.4, 0, 1, -5.8, 0x3a3a2a);
  }

  function createObservationScope() {
    // Tripod base
    var tripodBase = createBoxGeometry(2, 0.2, 2, 5, 0.5, 0, 0x4a4a3a);

    // Three tripod legs
    createCylinderGeometry(0.08, 0.08, 1.2, 8, 4.2, 1.2, 0.8, 0x5a5a4a);
    createCylinderGeometry(0.08, 0.08, 1.2, 8, 5.8, 1.2, 0.8, 0x5a5a4a);
    createCylinderGeometry(0.08, 0.08, 1.2, 8, 5, 1.5, 0.8, 0x5a5a4a);

    // Scope tube mounting
    var scopeMount = createBoxGeometry(0.3, 0.3, 0.8, 5, 2.2, 0, 0x3a3a2a);

    // Long scope cylinder
    var scopeBarrel = createCylinderGeometry(0.15, 0.15, 2.5, 16, 5, 2.8, 0.2, 0x1a1a0a);
    scopeBarrel.userData.originalRotation = { x: 0, y: 0, z: 0 };

    // Eyepiece lens
    createSphereGeometry(0.18, 16, 16, 5.5, 3.9, 0, 0x4a7a9a);

    return scopeBarrel;
  }

  function createSniperHide() {
    // Sniper position hide
    var hideMain = createBoxGeometry(3.5, 1.8, 3, -8, 0.8, 4, 0x2a3a1a);

    // Shooting port opening
    createBoxGeometry(2, 0.8, 0.3, -8, 1.2, 6.5, 0x1a1a0a);

    // Rifle barrel
    var rifleBarrel = createCylinderGeometry(0.05, 0.05, 2.2, 12, -7.5, 1.5, 6.8, 0x0a0a0a);
    rifleBarrel.rotation.z = Math.PI / 8;

    // Magazine
    createBoxGeometry(0.3, 1.2, 0.2, -8.2, 0.6, 6.5, 0x1a1a1a);
  }

  function createSatcomTerminal() {
    // Main terminal box
    var terminalBox = createBoxGeometry(2.5, 1.8, 2, 10, 1, 8, 0x3a3a4a);

    // Control panel
    createBoxGeometry(2, 0.8, 0.2, 10, 2, 8.5, 0x5a7a9a);

    // Satellite dish (parabolic approximation with BoxGeometry)
    var dishBack = createBoxGeometry(0.3, 1.5, 3, 10, 2.5, 8.8, 0x5a5a4a);
    var dishFrame = createCylinderGeometry(1.5, 1.5, 0.2, 12, 10, 2.8, 8.8, 0x4a4a3a);
    dishFrame.userData.isSatcomDish = true;

    // Feed horn
    createCylinderGeometry(0.2, 0.2, 0.8, 8, 10, 2.2, 8.8, 0x3a3a2a);
  }

  function createAntennaArray() {
    // Main antenna mast
    var mast = createCylinderGeometry(0.12, 0.12, 5, 8, 6, 4.5, -12, 0x4a4a3a);

    // Antenna elements
    for (var i = 0; i < 5; i++) {
      var antennaY = 3 + i * 0.8;
      createCylinderGeometry(0.05, 0.05, 1.2, 6, 5.3, antennaY, -12.5, 0x5a7a9a);
    }

    // Support wires
    var wirePoints = [
      { x: 6, y: 4.5, z: -12 },
      { x: 8, y: 2, z: -10 },
      { x: 6, y: 4.5, z: -12 },
      { x: 4, y: 2, z: -14 },
      { x: 6, y: 4.5, z: -12 },
      { x: 7, y: 2, z: -14.5 }
    ];
    createLineSegments(wirePoints, 0x6a7a8a);
  }

  function createSupplyCache() {
    // Buried hatch
    var hatchCover = createBoxGeometry(1.5, 0.2, 1.5, -6, 0, 10, 0x5a5a4a);
    hatchCover.rotation.z = Math.PI / 6;

    // Hatch frame
    createBoxGeometry(1.7, 0.1, 1.7, -6, 0.25, 10, 0x3a3a2a);

    // Ration boxes inside cache
    for (var i = 0; i < 4; i++) {
      createBoxGeometry(1, 0.8, 0.6, -6 + (i % 2) * 1.2, -0.5, 10 - (Math.floor(i / 2)) * 0.8, 0x7a7a4a);
    }

    // Water containers
    for (var j = 0; j < 2; j++) {
      createCylinderGeometry(0.3, 0.3, 0.9, 8, -4.5, -0.4, 10 + j * 0.8, 0x3a5a7a);
    }
  }

  function createEscapeTunnel() {
    // Concealed tunnel exit opening
    var tunnelExit = createBoxGeometry(1.8, 1.5, 0.4, -15, 0.5, 6, 0x1a1a0a);

    // Tunnel interior visible
    var tunnelInterior = createBoxGeometry(1.6, 1.3, 3, -15, 0.6, 3, 0x0a0a0a);

    // Emergency exit marker (minimal)
    createBoxGeometry(0.3, 0.3, 0.3, -15.5, 2, 6, 0x9a2a2a);
  }

  function createMedicalKit() {
    // Red medical case
    var medCase = createBoxGeometry(1, 0.6, 0.4, 2, 1.5, 12, 0xa02a2a);

    // Opened flap
    createBoxGeometry(1, 0.2, 0.4, 2, 2.2, 12.2, 0x7a1a1a);

    // Supply vials (small cylinders)
    for (var i = 0; i < 6; i++) {
      createCylinderGeometry(0.08, 0.08, 0.3, 6, 1.2 + (i % 3) * 0.3, 1.8, 11.8 + (Math.floor(i / 3)) * 0.3, 0xfafafa);
    }
  }

  function createThermalCamera() {
    // Camera body
    var cameraBody = createBoxGeometry(0.6, 0.5, 0.4, -4, 3, 0, 0x2a2a2a);

    // Thermal lens assembly
    var lens = createCylinderGeometry(0.25, 0.25, 0.3, 16, -3.5, 3, 0, 0x1a3a5a);
    lens.userData.isThermalCamera = true;

    // Mounting bracket
    createBoxGeometry(0.2, 0.4, 0.6, -4, 2.3, 0, 0x3a3a3a);

    return lens;
  }

  function createNightVisionPole() {
    // Mounting pole
    var pole = createCylinderGeometry(0.15, 0.15, 3.5, 8, 8, 2.5, -6, 0x4a4a3a);

    // Camera body
    createBoxGeometry(0.5, 0.5, 0.4, 8.5, 4.2, -6, 0x1a1a1a);

    // Large objective lens
    var nvLens = createSphereGeometry(0.3, 16, 16, 8.8, 4, -6, 0x2a4a6a);
    nvLens.userData.isNightVision = true;
  }

  function createRangeCardMarkers() {
    // Ground stake markers for range estimation
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var dist = 12;
      var x = Math.cos(angle) * dist;
      var z = Math.sin(angle) * dist;

      createBoxGeometry(0.15, 0.8, 0.15, x, 0.4, z, 0x5a5a3a);
    }
  }

  function createLaserRangeFinder() {
    // Small laser rangefinder unit
    var rangeBody = createBoxGeometry(0.4, 0.3, 0.5, -2, 2.5, -4, 0x3a3a3a);

    // Optical element
    createSphereGeometry(0.12, 12, 12, -2.2, 2.5, -4.3, 0x4a7a9a);

    // Display panel
    createBoxGeometry(0.35, 0.1, 0.3, -2, 2, -4, 0x5a5a5a);
  }

  function createBiometricSensors() {
    // Perimeter sensor posts
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var radius = 18;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      createCylinderGeometry(0.1, 0.1, 2.2, 8, x, 1, z, 0x3a4a5a);
      createBoxGeometry(0.3, 0.3, 0.3, x, 2.5, z, 0x7a9aaa);
    }
  }

  function createBoulderCover() {
    // Large boulders for concealed positions
    var boulderPositions = [
      { x: 12, y: 0.8, z: -6 },
      { x: -12, y: 0.9, z: 8 },
      { x: 14, y: 0.7, z: 10 },
      { x: -10, y: 0.8, z: -15 }
    ];

    for (var i = 0; i < boulderPositions.length; i++) {
      var pos = boulderPositions[i];
      var radius = 1.2 + Math.random() * 0.5;
      createSphereGeometry(radius, 10, 10, pos.x, pos.y, pos.z, 0x5a5a4a);
    }
  }

  function createForestEdge() {
    // Conifer trees for forest edge concealment
    for (var i = 0; i < 8; i++) {
      var x = -20 + i * 3;
      var z = -16 + Math.random() * 4;

      // Tree trunk
      createCylinderGeometry(0.4, 0.5, 4, 8, x, 1.5, z, 0x3a2a1a);

      // Tree foliage (cone)
      createConeGeometry(2, 4.5, 8, x, 4, z, 0x2a4a2a);
    }
  }

  function createEnemyTarget() {
    // Distant target building on horizon
    var targetBase = createBoxGeometry(3, 0.3, 3, 25, 0, 15, 0x5a4a3a);

    // Main building
    var targetBuilding = createBoxGeometry(2.5, 3, 2.5, 25, 1.5, 15, 0x6a5a4a);

    // Antenna on target building
    createCylinderGeometry(0.08, 0.08, 2, 6, 24.5, 4.8, 15, 0x4a4a3a);

    // Window (dark opening)
    createBoxGeometry(0.8, 0.8, 0.2, 26.2, 2, 15, 0x0a0a0a);
  }

  function createRockyOutcrop() {
    // Hilltop rocky base
    var baseRock = createBoxGeometry(30, 2, 25, 0, -1, 0, 0x5a5a5a);

    // Protruding rocks
    for (var i = 0; i < 5; i++) {
      var x = (Math.random() - 0.5) * 25;
      var z = (Math.random() - 0.5) * 20;
      var rockSize = 0.8 + Math.random() * 0.6;
      createSphereGeometry(rockSize, 8, 8, x, 1.2, z, 0x4a4a4a);
    }
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    // Create terrain
    createRockyOutcrop();

    // Build recon post structures
    createCamoNettingMesh();
    createLeafScatter();
    createMainObservationHide();
    var scopeObj = createObservationScope();
    createSniperHide();
    createSatcomTerminal();
    createAntennaArray();
    createSupplyCache();
    createEscapeTunnel();
    createMedicalKit();
    var thermalObj = createThermalCamera();
    createNightVisionPole();
    createRangeCardMarkers();
    createLaserRangeFinder();
    createBiometricSensors();
    createBoulderCover();
    createForestEdge();
    createEnemyTarget();

    // Store animation objects
    gameObjects.scopeTube = scopeObj;
    gameObjects.thermalCamera = thermalObj;

    return true;
  }

  function update(delta) {
    // Scope pan animation (slow horizontal sweep)
    scopePanAngle += delta * 0.3;
    if (gameObjects.scopeTube) {
      gameObjects.scopeTube.rotation.y = Math.sin(scopePanAngle) * 0.4;
    }

    // SATCOM dish tracking rotation (continuous slow rotation)
    satcomDishAngle += delta * 0.15;
    for (var i = 0; i < gameObjects.length; i++) {
      if (gameObjects[i].userData && gameObjects[i].userData.isSatcomDish) {
        gameObjects[i].rotation.y = satcomDishAngle;
      }
    }

    // Camouflage netting gentle sway (oscillation in LineSegments)
    camoNetSway += delta * 0.5;
    for (var j = 0; j < lineSegmentsObjects.length; j++) {
      var swayAmount = Math.sin(camoNetSway) * 0.08;
      lineSegmentsObjects[j].position.y = 4.5 + swayAmount;
    }

    // Thermal camera slow pan
    thermalCamAngle += delta * 0.2;
    for (var k = 0; k < gameObjects.length; k++) {
      if (gameObjects[k].userData && gameObjects[k].userData.isThermalCamera) {
        gameObjects[k].rotation.z = Math.sin(thermalCamAngle) * 0.3;
      }
    }
  }

  function reset() {
    // Reset all animation states
    scopePanAngle = 0;
    satcomDishAngle = 0;
    thermalCamAngle = 0;
    camoNetSway = 0;

    // Reset all objects to initial positions and rotations
    for (var i = 0; i < gameObjects.length; i++) {
      gameObjects[i].position.set(gameObjects[i].userData.initX || 0, gameObjects[i].userData.initY || 0, gameObjects[i].userData.initZ || 0);
      gameObjects[i].rotation.set(0, 0, 0);
    }

    for (var j = 0; j < lineSegmentsObjects.length; j++) {
      lineSegmentsObjects[j].position.y = 4.5;
      lineSegmentsObjects[j].rotation.set(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
