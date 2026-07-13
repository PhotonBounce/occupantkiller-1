window.CargoFortress = (function() {
  'use strict';

  // ============================================================================
  // STATE & CONFIG
  // ============================================================================
  var state = {
    gateOpen: false,
    gateAngle: 0,
    craneRotation: 0,
    craneSwayPhase: 0,
    dishRotation: 0,
    gameTime: 0,
    containers: [],
    walkways: [],
    cranes: [],
    gates: [],
    misc: []
  };

  var config = {
    containerWidth: 20,
    containerHeight: 8,
    containerDepth: 8,
    containerColors: [0xc41e3a, 0x0066cc, 0xffd700, 0x228b22], // rust red, blue, yellow, green
    perimeterScale: 4,
    gateCycleTime: 5,
    gateOpenTime: 2.5
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  var createBox = function(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.3 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createCylinder = function(radiusTop, radiusBottom, height, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.4 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createCone = function(radius, height, color, x, y, z) {
    var geometry = new THREE.ConeGeometry(radius, height, 16);
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, metalness: 0.5 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createSphere = function(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.3 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createLineSegments = function(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    return line;
  };

  var addBulletPocks = function(container, count) {
    count = count || 3;
    for (var i = 0; i < count; i++) {
      var sideIndex = Math.floor(Math.random() * 4);
      var offsetX = (Math.random() - 0.5) * 15;
      var offsetY = (Math.random() - 0.5) * 6;
      var pockColor = 0x1a1a1a;
      var pockX = container.position.x + (sideIndex === 0 ? 10 : sideIndex === 1 ? -10 : offsetX);
      var pockY = container.position.y + offsetY;
      var pockZ = container.position.z + (sideIndex === 2 ? 4 : sideIndex === 3 ? -4 : 0);
      var pock = createBox(1.5, 1.5, 0.5, pockColor, pockX, pockY, pockZ);
      state.misc.push(pock);
    }
  };

  // ============================================================================
  // CONTAINER WALLS
  // ============================================================================
  var buildContainerWalls = function(scene) {
    var w = config.containerWidth;
    var h = config.containerHeight;
    var d = config.containerDepth;
    var scale = config.perimeterScale;
    var perimeter = w * scale;

    // North wall
    for (var i = 0; i < scale; i++) {
      var colors = [config.containerColors[0], config.containerColors[1], config.containerColors[2]];
      var color = colors[i % colors.length];
      var container = createBox(w, h, d, color, -perimeter / 2 + w * (i + 0.5), h / 2, -perimeter / 2);
      scene.add(container);
      state.containers.push(container);
      addBulletPocks(container, 2);
    }

    // South wall
    for (var i = 0; i < scale; i++) {
      var colors = [config.containerColors[1], config.containerColors[3], config.containerColors[0]];
      var color = colors[i % colors.length];
      var container = createBox(w, h, d, color, -perimeter / 2 + w * (i + 0.5), h / 2, perimeter / 2);
      scene.add(container);
      state.containers.push(container);
      addBulletPocks(container, 2);
    }

    // East wall
    for (var i = 0; i < scale; i++) {
      var colors = [config.containerColors[2], config.containerColors[0], config.containerColors[1]];
      var color = colors[i % colors.length];
      var container = createBox(d, h, w, color, perimeter / 2, h / 2, -perimeter / 2 + w * (i + 0.5));
      scene.add(container);
      state.containers.push(container);
      addBulletPocks(container, 2);
    }

    // West wall (with gate cutout in center)
    for (var i = 0; i < scale; i++) {
      if (i === Math.floor(scale / 2)) {
        continue; // Skip center for gate
      }
      var colors = [config.containerColors[3], config.containerColors[2], config.containerColors[1]];
      var color = colors[i % colors.length];
      var container = createBox(d, h, w, color, -perimeter / 2, h / 2, -perimeter / 2 + w * (i + 0.5));
      scene.add(container);
      state.containers.push(container);
      addBulletPocks(container, 2);
    }
  };

  // ============================================================================
  // CONTAINER TOWERS
  // ============================================================================
  var buildContainerTowers = function(scene) {
    var w = config.containerWidth;
    var h = config.containerHeight;
    var d = config.containerDepth;
    var perimeter = w * config.perimeterScale;

    var corners = [
      { x: -perimeter / 2, z: -perimeter / 2 },
      { x: perimeter / 2, z: -perimeter / 2 },
      { x: -perimeter / 2, z: perimeter / 2 },
      { x: perimeter / 2, z: perimeter / 2 }
    ];

    for (var c = 0; c < corners.length; c++) {
      var corner = corners[c];
      for (var level = 0; level < 3; level++) {
        var color = config.containerColors[(c + level) % config.containerColors.length];
        var tower = createBox(w, h, d, color, corner.x, h * (level + 0.5), corner.z);
        scene.add(tower);
        state.containers.push(tower);
        addBulletPocks(tower, 1);
      }
    }
  };

  // ============================================================================
  // COMMAND ROOM
  // ============================================================================
  var buildCommandRoom = function(scene) {
    var w = config.containerWidth;
    var h = config.containerHeight;
    var d = config.containerDepth;

    // Main command container (stacked 2 high at center)
    var cmdColor = config.containerColors[1];
    var cmd1 = createBox(w, h, d, cmdColor, 0, h / 2, 0);
    scene.add(cmd1);
    state.containers.push(cmd1);

    var cmd2 = createBox(w, h, d, config.containerColors[0], 0, h * 1.5, 0);
    scene.add(cmd2);
    state.containers.push(cmd2);

    // Interior furnishings
    var screenColor = 0x1a1a1a;
    var screen1 = createBox(4, 3, 0.3, screenColor, -6, h * 1.2, -6);
    scene.add(screen1);
    state.misc.push(screen1);

    var screen2 = createBox(4, 3, 0.3, screenColor, 6, h * 1.2, -6);
    scene.add(screen2);
    state.misc.push(screen2);

    var console1 = createBox(8, 2, 2, 0x2a5a2a, -4, h * 0.8, 0);
    scene.add(console1);
    state.misc.push(console1);

    var console2 = createBox(8, 2, 2, 0x2a5a2a, 4, h * 0.8, 0);
    scene.add(console2);
    state.misc.push(console2);

    // Satellite dish on roof
    var dishPole = createCylinder(0.5, 0.5, 3, 0x888888, 0, h * 2.5, 0);
    scene.add(dishPole);
    state.misc.push(dishPole);

    var dishBase = createCone(3, 1.5, 0xaaaaaa, 0, h * 3.3, 0);
    scene.add(dishBase);
    state.misc.push(dishBase);
  };

  // ============================================================================
  // WALKWAYS & RAILINGS
  // ============================================================================
  var buildWalkways = function(scene) {
    var perimeter = config.containerWidth * config.perimeterScale;
    var walkHeight = config.containerHeight + 1;

    // North walkway
    var northWalk = createBox(perimeter - 10, 1, 3, 0x555555, 0, walkHeight, -perimeter / 2 + 5);
    scene.add(northWalk);
    state.walkways.push(northWalk);

    var northRail = createLineSegments([
      { x: -perimeter / 2, y: walkHeight + 1.5, z: -perimeter / 2 + 5 },
      { x: perimeter / 2, y: walkHeight + 1.5, z: -perimeter / 2 + 5 }
    ], 0xffff00);
    scene.add(northRail);

    // South walkway
    var southWalk = createBox(perimeter - 10, 1, 3, 0x555555, 0, walkHeight, perimeter / 2 - 5);
    scene.add(southWalk);
    state.walkways.push(southWalk);

    var southRail = createLineSegments([
      { x: -perimeter / 2, y: walkHeight + 1.5, z: perimeter / 2 - 5 },
      { x: perimeter / 2, y: walkHeight + 1.5, z: perimeter / 2 - 5 }
    ], 0xffff00);
    scene.add(southRail);

    // East walkway
    var eastWalk = createBox(3, 1, perimeter - 10, 0x555555, perimeter / 2 - 5, walkHeight, 0);
    scene.add(eastWalk);
    state.walkways.push(eastWalk);

    var eastRail = createLineSegments([
      { x: perimeter / 2 - 5, y: walkHeight + 1.5, z: -perimeter / 2 },
      { x: perimeter / 2 - 5, y: walkHeight + 1.5, z: perimeter / 2 }
    ], 0xffff00);
    scene.add(eastRail);

    // Support poles for walkways
    var poles = [
      { x: -perimeter / 4, z: -perimeter / 2 + 5 },
      { x: perimeter / 4, z: -perimeter / 2 + 5 },
      { x: -perimeter / 4, z: perimeter / 2 - 5 },
      { x: perimeter / 4, z: perimeter / 2 - 5 },
      { x: perimeter / 2 - 5, z: -perimeter / 4 },
      { x: perimeter / 2 - 5, z: perimeter / 4 }
    ];

    for (var i = 0; i < poles.length; i++) {
      var pole = createCylinder(0.8, 0.8, walkHeight - 1, 0x444444, poles[i].x, (walkHeight - 1) / 2, poles[i].z);
      scene.add(pole);
      state.misc.push(pole);
    }
  };

  // ============================================================================
  // CONTAINER CRANE
  // ============================================================================
  var buildCrane = function(scene) {
    var craneX = -40;
    var craneZ = -40;
    var craneHeight = 35;

    // Vertical tower
    var crateTower = createBox(2, craneHeight, 2, 0x666666, craneX, craneHeight / 2, craneZ);
    scene.add(crateTower);
    state.misc.push(crateTower);

    // Horizontal boom (will rotate)
    var cranerGroup = new THREE.Group();
    cranerGroup.position.set(craneX, craneHeight, craneZ);
    scene.add(cranerGroup);
    state.cranes.push(cranerGroup);

    var boom = createBox(25, 1.5, 1.5, 0x777777, 12, 0, 0);
    cranerGroup.add(boom);

    // Cable with sway
    var cablePoints = [];
    for (var i = 0; i <= 20; i++) {
      cablePoints.push({ x: 24, y: -i * 1.5, z: 0 });
    }
    var cable = createLineSegments(cablePoints, 0xcccccc);
    cranerGroup.add(cable);

    // Hook
    var hook = createBox(1, 2, 1, 0xffaa00, 24, -30, 0);
    cranerGroup.add(hook);
  };

  // ============================================================================
  // VEHICLE GATE
  // ============================================================================
  var buildVehicleGate = function(scene) {
    var h = config.containerHeight;
    var d = config.containerDepth;
    var w = config.containerWidth;

    // Left gate door
    var gateLeftColor = config.containerColors[0];
    var gateLeft = createBox(w / 2 - 0.5, h, d, gateLeftColor, -w / 4 - 0.25, h / 2, -config.containerWidth * config.perimeterScale / 2);
    scene.add(gateLeft);
    state.gates.push({ mesh: gateLeft, side: 'left' });

    // Right gate door
    var gateRightColor = config.containerColors[0];
    var gateRight = createBox(w / 2 - 0.5, h, d, gateRightColor, w / 4 + 0.25, h / 2, -config.containerWidth * config.perimeterScale / 2);
    scene.add(gateRight);
    state.gates.push({ mesh: gateRight, side: 'right' });
  };

  // ============================================================================
  // SNIPER PERCHES
  // ============================================================================
  var buildSniperPerches = function(scene) {
    var perimeter = config.containerWidth * config.perimeterScale;
    var towerHeight = config.containerHeight * 3;
    var perchHeight = towerHeight + 2;

    var corners = [
      { x: -perimeter / 2, z: -perimeter / 2 },
      { x: perimeter / 2, z: -perimeter / 2 },
      { x: -perimeter / 2, z: perimeter / 2 },
      { x: perimeter / 2, z: perimeter / 2 }
    ];

    for (var c = 0; c < corners.length; c++) {
      var corner = corners[c];

      // Open-top container structure
      var perch = createBox(config.containerWidth, 4, config.containerDepth, config.containerColors[2], corner.x, perchHeight, corner.z);
      scene.add(perch);
      state.misc.push(perch);

      // Sandbag walls
      var sandbag1 = createBox(3, 2, 1.5, 0x8b7355, corner.x - 7, perchHeight + 2.5, corner.z - 3);
      scene.add(sandbag1);
      state.misc.push(sandbag1);

      var sandbag2 = createBox(3, 2, 1.5, 0x8b7355, corner.x + 7, perchHeight + 2.5, corner.z - 3);
      scene.add(sandbag2);
      state.misc.push(sandbag2);

      var sandbag3 = createBox(1.5, 2, 3, 0x8b7355, corner.x - 9, perchHeight + 2.5, corner.z);
      scene.add(sandbag3);
      state.misc.push(sandbag3);

      var sandbag4 = createBox(1.5, 2, 3, 0x8b7355, corner.x + 9, perchHeight + 2.5, corner.z);
      scene.add(sandbag4);
      state.misc.push(sandbag4);
    }
  };

  // ============================================================================
  // GENERATOR
  // ============================================================================
  var buildGenerator = function(scene) {
    var genX = 35;
    var genY = 4;
    var genZ = -35;

    // Generator unit
    var genBody = createBox(6, 4, 6, 0x333333, genX, genY, genZ);
    scene.add(genBody);
    state.misc.push(genBody);

    // Fuel tank
    var fuelTank = createCylinder(1.5, 1.5, 8, 0x8b4513, genX - 5, genY + 2, genZ);
    scene.add(fuelTank);
    state.misc.push(fuelTank);

    // Exhaust pipe
    var exhaustPipe = createCylinder(0.6, 0.6, 12, 0x666666, genX + 4, genY + 6, genZ);
    scene.add(exhaustPipe);
    state.misc.push(exhaustPipe);

    // Exhaust cap
    var exhaustCap = createCone(0.8, 1, 0x555555, genX + 4, genY + 12, genZ);
    scene.add(exhaustCap);
    state.misc.push(exhaustCap);
  };

  // ============================================================================
  // INIT
  // ============================================================================
  var init = function(scene, camera) {
    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Ground plane
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.1 });
    var groundGeometry = new THREE.BoxGeometry(300, 1, 300);
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build fortress
    buildContainerWalls(scene);
    buildContainerTowers(scene);
    buildCommandRoom(scene);
    buildWalkways(scene);
    buildCrane(scene);
    buildVehicleGate(scene);
    buildSniperPerches(scene);
    buildGenerator(scene);

    // Camera starting position (inside fortress, FPS view)
    camera.position.set(0, 10, 50);
    camera.lookAt(0, 10, 0);

    state.gameTime = 0;
  };

  // ============================================================================
  // UPDATE
  // ============================================================================
  var update = function(delta) {
    state.gameTime += delta;

    // Gate animation - open/close cycle
    var cycleTime = state.gameTime % config.gateCycleTime;
    var gateOpen = cycleTime < config.gateOpenTime;
    var gatePosAlpha = gateOpen ? (cycleTime / config.gateOpenTime) : ((config.gateCycleTime - cycleTime) / (config.gateCycleTime - config.gateOpenTime));
    gatePosAlpha = Math.max(0, Math.min(1, gatePosAlpha));

    for (var g = 0; g < state.gates.length; g++) {
      var gate = state.gates[g];
      var moveAmount = gatePosAlpha * 12;
      if (gate.side === 'left') {
        gate.mesh.position.x = -config.containerWidth / 4 - 0.25 - moveAmount;
      } else {
        gate.mesh.position.x = config.containerWidth / 4 + 0.25 + moveAmount;
      }
    }

    // Crane rotation
    state.craneRotation += delta * 0.3;
    for (var c = 0; c < state.cranes.length; c++) {
      state.cranes[c].rotation.y = state.craneRotation;
    }

    // Satellite dish rotation
    state.dishRotation += delta * 0.5;

    // Gentle crane cable sway
    state.craneSwayPhase += delta * 2;
  };

  // ============================================================================
  // RESET
  // ============================================================================
  var reset = function() {
    state.gameTime = 0;
    state.gateOpen = false;
    state.gateAngle = 0;
    state.craneRotation = 0;
    state.craneSwayPhase = 0;
    state.dishRotation = 0;
    state.containers = [];
    state.walkways = [];
    state.cranes = [];
    state.gates = [];
    state.misc = [];
  };

  // ============================================================================
  // EXPORTS
  // ============================================================================
  return {
    init: init,
    update: update,
    reset: reset
  };

}());
