window.JungleFortress = (function() {
  'use strict';

  // Color constants
  var BAMBOO_TAN = 0xDEB887;
  var JUNGLE_GREEN = 0x228B22;
  var DARK_JUNGLE = 0x0D3B0D;
  var MUD_BROWN = 0x6B4226;
  var FIRE_ORANGE = 0xFF6600;
  var THATCHED_ROOF = 0xC8A05A;

  // Game state
  var state = {
    fortress: null,
    guards: [],
    fireParticles: [],
    vines: [],
    treeSway: 0,
    soundPhase: 0,
    tunnelOpen: false,
    warlordAnimation: 0
  };

  function init(scene, camera) {
    state.fortress = {};
    state.guards = [];
    state.fireParticles = [];
    state.vines = [];
    state.treeSway = 0;
    state.soundPhase = 0;
    state.tunnelOpen = false;
    state.warlordAnimation = 0;

    // Build bamboo palisade perimeter wall
    buildBambooPalisade(scene);

    // Build 4 elevated watchtowers
    buildWatchtowers(scene);

    // Build thatched command building
    buildCommandBuilding(scene);

    // Build tunnel entrance hatch
    buildTunnelEntrance(scene);

    // Build munitions bunker with crates
    buildMunitionsBunker(scene);

    // Build drug processing lab
    buildDrugLab(scene);

    // Build jungle trees with canopy
    buildJungleTrees(scene);

    // Build vine-covered walls
    buildVineCoveredWalls(scene);

    // Build jeep vehicle
    buildJeep(scene);

    // Build fire pit
    buildFirePit(scene);

    // Build bamboo cage (prisoner cell)
    buildBambooCage(scene);

    // Build rope bridge between towers
    buildRopeBridge(scene);

    // Spawn guards
    spawnGuards(scene);

    // Set up ground
    buildGround(scene);
  }

  function buildGround(scene) {
    var groundGeom = new THREE.BoxGeometry(200, 1, 200);
    var groundMat = new THREE.MeshStandardMaterial({ color: MUD_BROWN, roughness: 0.9 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -1;
    scene.add(ground);
    state.fortress.ground = ground;
  }

  function buildBambooPalisade(scene) {
    var palisadeGroup = new THREE.Group();
    var perimeter = 150;
    var numPoles = 40;
    var poleSpacing = (perimeter * Math.PI * 2) / numPoles;

    for (var i = 0; i < numPoles; i++) {
      var angle = (i / numPoles) * Math.PI * 2;
      var x = Math.cos(angle) * perimeter;
      var z = Math.sin(angle) * perimeter;

      // Bamboo pole (tall cylinder)
      var poleGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
      var poleMat = new THREE.MeshStandardMaterial({ color: BAMBOO_TAN, roughness: 0.7 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(x, 4, z);
      pole.castShadow = true;
      pole.receiveShadow = true;
      palisadeGroup.add(pole);

      // Horizontal bamboo connector
      if (i % 3 === 0) {
        var nextAngle = ((i + 1) / numPoles) * Math.PI * 2;
        var nextX = Math.cos(nextAngle) * perimeter;
        var nextZ = Math.sin(nextAngle) * perimeter;
        var distance = Math.sqrt((nextX - x) ** 2 + (nextZ - z) ** 2);
        var connectorGeom = new THREE.BoxGeometry(distance, 0.4, 0.4);
        var connectorMat = new THREE.MeshStandardMaterial({ color: BAMBOO_TAN, roughness: 0.7 });
        var connector = new THREE.Mesh(connectorGeom, connectorMat);
        connector.position.set((x + nextX) / 2, 6, (z + nextZ) / 2);
        connector.lookAt(nextX, 6, nextZ);
        connector.castShadow = true;
        palisadeGroup.add(connector);
      }
    }

    scene.add(palisadeGroup);
    state.fortress.palisade = palisadeGroup;
  }

  function buildWatchtowers(scene) {
    var positions = [
      { x: 80, z: 80 },
      { x: -80, z: 80 },
      { x: -80, z: -80 },
      { x: 80, z: -80 }
    ];

    var towersGroup = new THREE.Group();

    positions.forEach(function(pos) {
      // Wooden stilts
      for (var sx = -3; sx <= 3; sx += 6) {
        for (var sz = -3; sz <= 3; sz += 6) {
          var stiltGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
          var stiltMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
          var stilt = new THREE.Mesh(stiltGeom, stiltMat);
          stilt.position.set(pos.x + sx, 3, pos.z + sz);
          stilt.castShadow = true;
          towersGroup.add(stilt);
        }
      }

      // Platform
      var platformGeom = new THREE.BoxGeometry(8, 0.5, 8);
      var platformMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
      var platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.set(pos.x, 6, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      towersGroup.add(platform);

      // Guard rails
      for (var r = 0; r < 4; r++) {
        var railGeom = new THREE.BoxGeometry(8, 1.5, 0.3);
        var railMat = new THREE.MeshStandardMaterial({ color: BAMBOO_TAN, roughness: 0.7 });
        var rail = new THREE.Mesh(railGeom, railMat);
        if (r === 0) rail.position.set(pos.x, 6.75, pos.z + 4);
        if (r === 1) rail.position.set(pos.x, 6.75, pos.z - 4);
        if (r === 2) rail.position.set(pos.x + 4, 6.75, pos.z);
        if (r === 3) rail.position.set(pos.x - 4, 6.75, pos.z);
        rail.castShadow = true;
        towersGroup.add(rail);
      }

      // Spotlight on tower
      var spotLight = new THREE.SpotLight(0xFFFFFF, 1, 100, Math.PI / 4, 0.5, 1);
      spotLight.position.set(pos.x, 7, pos.z);
      spotLight.target.position.set(pos.x, 0, pos.z);
      towersGroup.add(spotLight);
      towersGroup.add(spotLight.target);
    });

    scene.add(towersGroup);
    state.fortress.towers = towersGroup;
  }

  function buildCommandBuilding(scene) {
    var buildingGroup = new THREE.Group();

    // Main building structure (box)
    var bodyGeom = new THREE.BoxGeometry(12, 6, 10);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, 3, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    buildingGroup.add(body);

    // Thatched cone roof
    var roofGeom = new THREE.ConeGeometry(7.5, 4, 32);
    var roofMat = new THREE.MeshStandardMaterial({ color: THATCHED_ROOF, roughness: 0.9 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 7, 0);
    roof.castShadow = true;
    buildingGroup.add(roof);

    // Door
    var doorGeom = new THREE.BoxGeometry(2, 3, 0.2);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 2, 5.1);
    door.castShadow = true;
    buildingGroup.add(door);

    // Windows
    for (var w = 0; w < 3; w++) {
      var windowGeom = new THREE.BoxGeometry(1.5, 1.5, 0.1);
      var windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, roughness: 0.3, metalness: 0.6 });
      var window = new THREE.Mesh(windowGeom, windowMat);
      window.position.set((w - 1) * 3, 4, -5.1);
      window.castShadow = true;
      buildingGroup.add(window);
    }

    // Interior light (warlord presence)
    var ambientLight = new THREE.PointLight(0xFF8C00, 0.8, 50);
    ambientLight.position.set(0, 4, 0);
    buildingGroup.add(ambientLight);

    scene.add(buildingGroup);
    state.fortress.commandBuilding = buildingGroup;
  }

  function buildTunnelEntrance(scene) {
    var tunnelGroup = new THREE.Group();

    // Hatch door (metal)
    var hatchGeom = new THREE.BoxGeometry(4, 4, 0.3);
    var hatchMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.8 });
    var hatch = new THREE.Mesh(hatchGeom, hatchMat);
    hatch.position.set(-40, 0.15, 40);
    hatch.castShadow = true;
    tunnelGroup.add(hatch);

    // Circular tunnel entrance frame
    var frameGeom = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 32);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(-40, -1, 40);
    frame.castShadow = true;
    tunnelGroup.add(frame);

    scene.add(tunnelGroup);
    state.fortress.tunnel = { group: tunnelGroup, hatch: hatch };
  }

  function buildMunitionsBunker(scene) {
    var bunkerGroup = new THREE.Group();

    // Bunker structure (reinforced box)
    var bunkerGeom = new THREE.BoxGeometry(10, 4, 8);
    var bunkerMat = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.9 });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.position.set(50, 2, 20);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    bunkerGroup.add(bunker);

    // Ammo crates
    for (var cx = -3; cx <= 3; cx += 3) {
      for (var cy = 0; cy < 2; cy++) {
        for (var cz = -2; cz <= 2; cz += 2) {
          var crateGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
          var crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
          var crate = new THREE.Mesh(crateGeom, crateMat);
          crate.position.set(50 + cx, 3 + cy * 1.6, 20 + cz);
          crate.castShadow = true;
          crate.receiveShadow = true;
          bunkerGroup.add(crate);
        }
      }
    }

    scene.add(bunkerGroup);
    state.fortress.bunker = bunkerGroup;
  }

  function buildDrugLab(scene) {
    var labGroup = new THREE.Group();

    // Lab building
    var labGeom = new THREE.BoxGeometry(14, 5, 12);
    var labMat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8 });
    var lab = new THREE.Mesh(labGeom, labMat);
    lab.position.set(-50, 2.5, 20);
    lab.castShadow = true;
    lab.receiveShadow = true;
    labGroup.add(lab);

    // Processing tables
    for (var t = 0; t < 3; t++) {
      var tableTopGeom = new THREE.BoxGeometry(3, 0.3, 2);
      var tableTopMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 });
      var tableTop = new THREE.Mesh(tableTopGeom, tableTopMat);
      tableTop.position.set(-50 + (t - 1) * 4, 2.5, 20);
      tableTop.castShadow = true;
      labGroup.add(tableTop);

      // Table legs
      for (var leg = 0; leg < 4; leg++) {
        var legGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        var legMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
        var legOffset = leg < 2 ? -1 : 1;
        var legPos = leg % 2 === 0 ? -0.8 : 0.8;
        var legMesh = new THREE.Mesh(legGeom, legMat);
        legMesh.position.set(-50 + (t - 1) * 4 + legPos, 1.5, 20 + legOffset);
        legMesh.castShadow = true;
        labGroup.add(legMesh);
      }
    }

    // Chemical containers (emissive green)
    for (var c = 0; c < 5; c++) {
      var containerGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 12);
      var containerMat = new THREE.MeshStandardMaterial({
        color: JUNGLE_GREEN,
        emissive: 0x00FF00,
        emissiveIntensity: 0.3,
        roughness: 0.5
      });
      var container = new THREE.Mesh(containerGeom, containerMat);
      container.position.set(-50 + (c - 2) * 2, 3.2, 20);
      container.castShadow = true;
      labGroup.add(container);
    }

    scene.add(labGroup);
    state.fortress.lab = labGroup;
  }

  function buildJungleTrees(scene) {
    var treesGroup = new THREE.Group();

    // Scatter trees around fortress perimeter
    var treePositions = [
      { x: 120, z: 0 },
      { x: -120, z: 0 },
      { x: 0, z: 120 },
      { x: 0, z: -120 },
      { x: 100, z: 100 },
      { x: -100, z: 100 },
      { x: -100, z: -100 },
      { x: 100, z: -100 },
      { x: 130, z: 30 },
      { x: -130, z: 30 },
      { x: 30, z: 130 },
      { x: -30, z: 130 },
      { x: 30, z: -130 },
      { x: -30, z: -130 },
      { x: 90, z: -50 }
    ];

    treePositions.forEach(function(pos, idx) {
      // Trunk (cylinder)
      var trunkGeom = new THREE.CylinderGeometry(1.5, 2, 12, 12);
      var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.9 });
      var trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.set(pos.x, 6, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treesGroup.add(trunk);

      // Canopy (sphere)
      var canopyGeom = new THREE.SphereGeometry(6, 16, 16);
      var canopyMat = new THREE.MeshStandardMaterial({ color: JUNGLE_GREEN, roughness: 0.8 });
      var canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.set(pos.x, 10, pos.z);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      treesGroup.add(canopy);

      // Vine decoration
      var vineGeom = new THREE.BoxGeometry(0.2, 8, 0.2);
      var vineMat = new THREE.MeshStandardMaterial({ color: DARK_JUNGLE, roughness: 0.8 });
      var vine = new THREE.Mesh(vineGeom, vineMat);
      vine.position.set(pos.x - 1, 8, pos.z);
      treesGroup.add(vine);

      state.vines.push({ mesh: vine, originalPos: { x: vine.position.x, y: vine.position.y, z: vine.position.z }, idx: idx });
    });

    scene.add(treesGroup);
    state.fortress.trees = treesGroup;
  }

  function buildVineCoveredWalls(scene) {
    var vineWallGroup = new THREE.Group();

    // Vine-covered wall panels
    var wallPositions = [
      { x: -30, z: -50, rot: 0 },
      { x: 30, z: -50, rot: 0 },
      { x: -50, z: 30, rot: Math.PI / 2 },
      { x: -50, z: -30, rot: Math.PI / 2 }
    ];

    wallPositions.forEach(function(pos) {
      var wallGeom = new THREE.BoxGeometry(15, 5, 0.3);
      var wallMat = new THREE.MeshStandardMaterial({
        color: DARK_JUNGLE,
        emissive: JUNGLE_GREEN,
        emissiveIntensity: 0.2,
        roughness: 0.9
      });
      var wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(pos.x, 2.5, pos.z);
      wall.rotation.y = pos.rot;
      wall.castShadow = true;
      wall.receiveShadow = true;
      vineWallGroup.add(wall);
    });

    scene.add(vineWallGroup);
    state.fortress.vineWalls = vineWallGroup;
  }

  function buildJeep(scene) {
    var jeepGroup = new THREE.Group();

    // Jeep body
    var bodyGeom = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2F4F2F, roughness: 0.7 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(40, 0.75, -30);
    body.castShadow = true;
    body.receiveShadow = true;
    jeepGroup.add(body);

    // Roof (canvas)
    var roofGeom = new THREE.BoxGeometry(1.8, 1, 3.5);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(40, 1.5, -30);
    jeepGroup.add(roof);

    // Wheels
    for (var w = 0; w < 4; w++) {
      var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.6, 12);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, metalness: 0.3 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      var xOffset = (w < 2 ? -1 : 1) * 1;
      var zOffset = (w % 2 === 0 ? -1 : 1) * 1.5;
      wheel.position.set(40 + xOffset, 0.6, -30 + zOffset);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      jeepGroup.add(wheel);
    }

    // Machine gun mount
    var gunGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8 });
    var gun = new THREE.Mesh(gunGeom, gunMat);
    gun.position.set(40, 1.8, -30);
    gun.rotation.z = Math.PI / 4;
    gun.castShadow = true;
    jeepGroup.add(gun);

    scene.add(jeepGroup);
    state.fortress.jeep = jeepGroup;
  }

  function buildFirePit(scene) {
    var pitGroup = new THREE.Group();

    // Stone ring
    var ringGeom = new THREE.CylinderGeometry(2, 2, 0.5, 32);
    var ringMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(0, 0.25, -20);
    ring.castShadow = true;
    ring.receiveShadow = true;
    pitGroup.add(ring);

    // Fire glow
    var fireLight = new THREE.PointLight(FIRE_ORANGE, 1.5, 30);
    fireLight.position.set(0, 2, -20);
    pitGroup.add(fireLight);

    // Initialize fire particles
    for (var fp = 0; fp < 20; fp++) {
      var particleGeom = new THREE.SphereGeometry(0.15, 4, 4);
      var particleMat = new THREE.MeshStandardMaterial({
        color: FIRE_ORANGE,
        emissive: FIRE_ORANGE,
        emissiveIntensity: 0.8
      });
      var particle = new THREE.Mesh(particleGeom, particleMat);
      particle.position.set(0 + (Math.random() - 0.5) * 2, Math.random() * 3, -20 + (Math.random() - 0.5) * 2);
      pitGroup.add(particle);
      state.fireParticles.push({
        mesh: particle,
        vx: (Math.random() - 0.5) * 0.05,
        vy: Math.random() * 0.08,
        vz: (Math.random() - 0.5) * 0.05,
        life: Math.random()
      });
    }

    scene.add(pitGroup);
    state.fortress.firePit = pitGroup;
  }

  function buildBambooCage(scene) {
    var cageGroup = new THREE.Group();

    // Cage frame (bamboo poles)
    var frameBars = [
      // Vertical bars
      { start: { x: -2, y: 0, z: -2 }, end: { x: -2, y: 3, z: -2 } },
      { start: { x: 2, y: 0, z: -2 }, end: { x: 2, y: 3, z: -2 } },
      { start: { x: -2, y: 0, z: 2 }, end: { x: -2, y: 3, z: 2 } },
      { start: { x: 2, y: 0, z: 2 }, end: { x: 2, y: 3, z: 2 } },
      // Horizontal top bars
      { start: { x: -2, y: 3, z: -2 }, end: { x: 2, y: 3, z: -2 } },
      { start: { x: -2, y: 3, z: 2 }, end: { x: 2, y: 3, z: 2 } },
      { start: { x: -2, y: 3, z: -2 }, end: { x: -2, y: 3, z: 2 } },
      { start: { x: 2, y: 3, z: -2 }, end: { x: 2, y: 3, z: 2 } }
    ];

    frameBars.forEach(function(bar) {
      var dx = bar.end.x - bar.start.x;
      var dy = bar.end.y - bar.start.y;
      var dz = bar.end.z - bar.start.z;
      var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      var barGeom = new THREE.BoxGeometry(length, 0.3, 0.3);
      var barMat = new THREE.MeshStandardMaterial({ color: BAMBOO_TAN, roughness: 0.7 });
      var barMesh = new THREE.Mesh(barGeom, barMat);

      barMesh.position.set(
        (bar.start.x + bar.end.x) / 2,
        (bar.start.y + bar.end.y) / 2,
        (bar.start.z + bar.end.z) / 2
      );

      barMesh.lookAt(bar.end.x, bar.end.y, bar.end.z);
      barMesh.castShadow = true;
      cageGroup.add(barMesh);
    });

    // Door
    var doorGeom = new THREE.BoxGeometry(1.5, 2.5, 0.2);
    var doorMat = new THREE.MeshStandardMaterial({ color: BAMBOO_TAN, roughness: 0.7 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-2, 1.25, -2.1);
    door.castShadow = true;
    cageGroup.add(door);

    cageGroup.position.set(-60, 0, -40);
    scene.add(cageGroup);
    state.fortress.cage = cageGroup;
  }

  function buildRopeBridge(scene) {
    var bridgeGroup = new THREE.Group();

    // Rope bridge between towers (using LineSegments)
    var points = [];
    var segments = 20;
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = 80 * (1 - t) + (-80) * t;
      var z = 80 * (1 - t) + 80 * t;
      var sag = Math.sin(t * Math.PI) * 3;
      points.push(new THREE.Vector3(x, 6 + sag, z));
    }

    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 3 });
    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    bridgeGroup.add(rope);

    // Wooden planks
    for (var p = 0; p < segments; p++) {
      var plankGeom = new THREE.BoxGeometry(2, 0.3, 0.5);
      var plankMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
      var plank = new THREE.Mesh(plankGeom, plankMat);
      var t = p / segments;
      var x = 80 * (1 - t) + (-80) * t;
      var z = 80 * (1 - t) + 80 * t;
      var sag = Math.sin(t * Math.PI) * 3;
      plank.position.set(x, 6 + sag, z);
      plank.castShadow = true;
      bridgeGroup.add(plank);
    }

    scene.add(bridgeGroup);
    state.fortress.bridge = bridgeGroup;
  }

  function spawnGuards(scene) {
    // Create guard patrol paths
    var guardPaths = [
      // Perimeter patrol
      [
        new THREE.Vector3(100, 0, 0),
        new THREE.Vector3(70, 0, 70),
        new THREE.Vector3(0, 0, 100),
        new THREE.Vector3(-70, 0, 70),
        new THREE.Vector3(-100, 0, 0),
        new THREE.Vector3(-70, 0, -70),
        new THREE.Vector3(0, 0, -100),
        new THREE.Vector3(70, 0, -70)
      ],
      // Tower to tower
      [
        new THREE.Vector3(80, 0, 80),
        new THREE.Vector3(-80, 0, 80),
        new THREE.Vector3(-80, 0, -80),
        new THREE.Vector3(80, 0, -80)
      ],
      // Center compound
      [
        new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(40, 0, -30),
        new THREE.Vector3(40, 0, 20),
        new THREE.Vector3(0, 0, 0)
      ]
    ];

    guardPaths.forEach(function(path, idx) {
      // Guard body
      var bodyGeom = new THREE.BoxGeometry(1, 1.8, 0.6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.7 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      // Guard head
      var headGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xC39C68, roughness: 0.7 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(0, 1.2, 0);
      head.castShadow = true;
      body.add(head);

      // Guard weapon
      var gunGeom = new THREE.BoxGeometry(0.2, 0.1, 1.5);
      var gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8 });
      var gun = new THREE.Mesh(gunGeom, gunMat);
      gun.position.set(0.3, 0.5, 0.5);
      gun.rotation.z = Math.PI / 6;
      gun.castShadow = true;
      body.add(gun);

      state.guards.push({
        body: body,
        path: path,
        pathIndex: 0,
        speed: 0.01 + Math.random() * 0.01,
        progress: Math.random()
      });
    });
  }

  function update(delta) {
    // Update fire pit flickering
    updateFirePit(delta);

    // Update guard patrols
    updateGuards(delta);

    // Update bird animations and vines
    updateVines(delta);

    // Update tunnel hatch on approach (would check player distance in real game)
    updateTunnelHatch(delta);

    // Update warlord animation
    updateWarlord(delta);
  }

  function updateFirePit(delta) {
    state.fireParticles.forEach(function(particle) {
      particle.mesh.position.x += particle.vx;
      particle.mesh.position.y += particle.vy;
      particle.mesh.position.z += particle.vz;

      particle.life -= delta * 0.5;
      if (particle.life <= 0) {
        particle.mesh.position.set(
          (Math.random() - 0.5) * 2,
          Math.random() * 0.5,
          -20 + (Math.random() - 0.5) * 2
        );
        particle.life = 1;
        particle.vy = Math.random() * 0.08;
      }

      var opacity = Math.max(0, particle.life);
      particle.mesh.material.opacity = opacity;
    });
  }

  function updateGuards(delta) {
    state.guards.forEach(function(guard) {
      guard.progress += guard.speed * delta;

      if (guard.progress >= 1) {
        guard.pathIndex = (guard.pathIndex + 1) % guard.path.length;
        guard.progress = 0;
      }

      var currentWaypoint = guard.path[guard.pathIndex];
      var nextWaypoint = guard.path[(guard.pathIndex + 1) % guard.path.length];

      var x = currentWaypoint.x + (nextWaypoint.x - currentWaypoint.x) * guard.progress;
      var z = currentWaypoint.z + (nextWaypoint.z - currentWaypoint.z) * guard.progress;

      guard.body.position.set(x, 0.9, z);

      // Face direction of movement
      var direction = new THREE.Vector3(nextWaypoint.x - x, 0, nextWaypoint.z - z);
      if (direction.length() > 0) {
        direction.normalize();
        guard.body.lookAt(guard.body.position.x + direction.x, guard.body.position.y, guard.body.position.z + direction.z);
      }
    });
  }

  function updateVines(delta) {
    state.soundPhase += delta * 0.5;

    state.vines.forEach(function(vine) {
      var sway = Math.sin(state.soundPhase + vine.idx * 0.5) * 0.5;
      vine.mesh.position.x = vine.originalPos.x + sway;
      vine.mesh.position.y = vine.originalPos.y + Math.cos(state.soundPhase * 2 + vine.idx) * 0.3;
    });

    // Tree canopy shadow movement
    state.treeSway += delta;
  }

  function updateTunnelHatch(delta) {
    // Simulate hatch opening on approach
    if (state.fortress.tunnel && state.fortress.tunnel.hatch) {
      state.warlordAnimation += delta;
      var hatchAngle = Math.sin(state.warlordAnimation * 0.3) * 0.2;
      state.fortress.tunnel.hatch.rotation.z = hatchAngle;
    }
  }

  function updateWarlord(delta) {
    // Warlord boss pacing in command building
    state.warlordAnimation += delta * 0.3;
    if (state.fortress.commandBuilding) {
      var pace = Math.sin(state.warlordAnimation) * 2;
      state.fortress.commandBuilding.children[0].position.z = pace;
    }
  }

  function reset() {
    // Clear all fortress objects
    state.guards.forEach(function(guard) {
      if (guard.body && guard.body.parent) {
        guard.body.parent.remove(guard.body);
      }
    });
    state.guards = [];

    state.fireParticles.forEach(function(particle) {
      if (particle.mesh && particle.mesh.parent) {
        particle.mesh.parent.remove(particle.mesh);
      }
    });
    state.fireParticles = [];

    state.vines = [];
    state.treeSway = 0;
    state.soundPhase = 0;
    state.tunnelOpen = false;
    state.warlordAnimation = 0;

    // Groups will be removed by scene cleanup
    state.fortress = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
