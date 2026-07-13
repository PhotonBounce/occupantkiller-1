window.WarMarket = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lanterns = [];
  var campfires = [];
  var time = 0;

  var colors = {
    dustyOchre: 0xC9A56B,
    wornBrown: 0x6B4423,
    fadedCanvas: 0xD4A574,
    warmLantern: 0xFFB84D,
    darkCrate: 0x2B2B2B,
    ashGray: 0x5A5A5A,
    bloodRed: 0x8B0000,
    ironGray: 0x4A4A4A,
    rustOrange: 0xB85C3C,
    deepBrown: 0x4A3728,
    sandBag: 0x9E9E4E,
    cobblestone: 0x8B8B7A,
    fireGlow: 0xFFAA00,
    ropeColor: 0x8B7355
  };

  function addObject(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position.x, position.y, position.z);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    if (scale) mesh.scale.set(scale.x, scale.y, scale.z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addLine(start, end, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]), 3));
    var material = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    objects.push(line);
    return line;
  }

  function buildCentralSquare() {
    var squareSize = 80;
    var tileSize = 5;
    var tilesPerSide = Math.floor(squareSize / tileSize);
    var startX = -squareSize / 2;
    var startZ = -squareSize / 2;

    for (var ix = 0; ix < tilesPerSide; ix++) {
      for (var iz = 0; iz < tilesPerSide; iz++) {
        var tileColor = ((ix + iz) % 2) === 0 ? colors.cobblestone : colors.ashGray;
        var geometry = new THREE.BoxGeometry(tileSize, 0.3, tileSize);
        var material = new THREE.MeshStandardMaterial({ color: tileColor, roughness: 0.8 });
        var posX = startX + ix * tileSize + tileSize / 2;
        var posZ = startZ + iz * tileSize + tileSize / 2;
        addObject(geometry, material, { x: posX, y: 0, z: posZ }, null, null);
      }
    }
  }

  function buildMarketStalls() {
    var stallWidth = 6;
    var stallDepth = 6;
    var stallHeight = 8;
    var canopyHeight = 2;
    var spacing = 10;
    var rows = 4;
    var cols = 4;
    var startX = -30;
    var startZ = -30;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var posX = startX + col * spacing;
        var posZ = startZ + row * spacing;

        // Stall frame posts
        var postGeometry = new THREE.BoxGeometry(0.8, stallHeight, 0.8);
        var postMaterial = new THREE.MeshStandardMaterial({ color: colors.ironGray, roughness: 0.9 });
        addObject(postGeometry, postMaterial, { x: posX - 2.5, y: stallHeight / 2, z: posZ - 2.5 }, null, null);
        addObject(postGeometry, postMaterial, { x: posX + 2.5, y: stallHeight / 2, z: posZ - 2.5 }, null, null);
        addObject(postGeometry, postMaterial, { x: posX - 2.5, y: stallHeight / 2, z: posZ + 2.5 }, null, null);
        addObject(postGeometry, postMaterial, { x: posX + 2.5, y: stallHeight / 2, z: posZ + 2.5 }, null, null);

        // Canopy top
        var canopyColor = [colors.fadedCanvas, colors.dustyOchre, colors.wornBrown, colors.deepBrown][Math.floor(Math.random() * 4)];
        var canopyGeometry = new THREE.BoxGeometry(stallWidth + 1, canopyHeight, stallDepth + 1);
        var canopyMaterial = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.7 });
        addObject(canopyGeometry, canopyMaterial, { x: posX, y: stallHeight - 0.5, z: posZ }, null, null);

        // Stall counter/table
        var tableGeometry = new THREE.BoxGeometry(stallWidth, 1.2, stallDepth);
        var tableMaterial = new THREE.MeshStandardMaterial({ color: colors.deepBrown, roughness: 0.9 });
        addObject(tableGeometry, tableMaterial, { x: posX, y: 1.5, z: posZ }, null, null);
      }
    }
  }

  function buildWeaponMerchantDisplays() {
    var displayPositions = [
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 15, z: 15 }
    ];

    displayPositions.forEach(function(pos) {
      // Display table
      var tableGeometry = new THREE.BoxGeometry(8, 1.5, 6);
      var tableMaterial = new THREE.MeshStandardMaterial({ color: colors.wornBrown, roughness: 0.8 });
      addObject(tableGeometry, tableMaterial, { x: pos.x, y: 1.5, z: pos.z }, null, null);

      // Weapon barrels on display
      for (var i = 0; i < 6; i++) {
        var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var barrelMaterial = new THREE.MeshStandardMaterial({ color: colors.ironGray, metalness: 0.8, roughness: 0.2 });
        var offsetX = (i - 2.5) * 1.5;
        var rotation = i % 2 === 0 ? { x: Math.PI / 2, y: 0, z: 0 } : { x: 0, y: 0, z: Math.PI / 4 };
        addObject(barrelGeometry, barrelMaterial, { x: pos.x + offsetX, y: 3, z: pos.z }, rotation, null);
      }
    });
  }

  function buildRuinedBuildings() {
    var buildingPositions = [
      { x: -38, z: -35 },
      { x: 38, z: -35 },
      { x: -38, z: 35 },
      { x: 38, z: 35 }
    ];

    buildingPositions.forEach(function(pos) {
      var wallWidth = 12;
      var wallHeight = 12;
      var wallDepth = 2;

      // Wall segment
      var wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: colors.ashGray, roughness: 0.95 });
      addObject(wallGeometry, wallMaterial, { x: pos.x, y: wallHeight / 2, z: pos.z }, null, null);

      // Blown-out window gaps
      for (var i = 0; i < 3; i++) {
        var windowGeometry = new THREE.BoxGeometry(2, 2.5, 0.5);
        var windowMaterial = new THREE.MeshStandardMaterial({ color: colors.darkCrate, roughness: 1 });
        var offsetX = (i - 1) * 4;
        var offsetY = 2;
        addObject(windowGeometry, windowMaterial, { x: pos.x + offsetX, y: offsetY + wallHeight / 2, z: pos.z }, null, null);
      }
    });
  }

  function buildBlackMarketCrates() {
    var cratePositions = [
      { x: -25, z: -25 },
      { x: 25, z: -25 },
      { x: -25, z: 25 },
      { x: 25, z: 25 },
      { x: 0, z: -30 },
      { x: 0, z: 30 }
    ];

    cratePositions.forEach(function(pos) {
      // Stack of 3 crates
      for (var i = 0; i < 3; i++) {
        var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
        var crateMaterial = new THREE.MeshStandardMaterial({ color: colors.darkCrate, roughness: 0.85 });
        var offsetX = i === 0 ? 0 : (i === 1 ? -2 : 2);
        addObject(crateGeometry, crateMaterial, { x: pos.x + offsetX, y: 1.5 + i * 3.2, z: pos.z }, null, null);

        // Crate markings - thin boxes as stripes
        var markingGeometry = new THREE.BoxGeometry(3.2, 0.3, 0.2);
        var markingMaterial = new THREE.MeshStandardMaterial({ color: colors.rustOrange, roughness: 0.7 });
        addObject(markingGeometry, markingMaterial, { x: pos.x + offsetX, y: 2.5 + i * 3.2, z: pos.z + 1.4 }, null, null);
      }
    });
  }

  function buildBarricadeCheckpoints() {
    var checkpointPositions = [
      { x: -35, z: 0 },
      { x: 35, z: 0 },
      { x: 0, z: -35 },
      { x: 0, z: 35 }
    ];

    checkpointPositions.forEach(function(pos) {
      // Sandbag wall
      for (var i = 0; i < 5; i++) {
        var bagGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
        var bagMaterial = new THREE.MeshStandardMaterial({ color: colors.sandBag, roughness: 0.8 });
        addObject(bagGeometry, bagMaterial, { x: pos.x + (i - 2) * 3.5, y: 0.8 + i * 0.3, z: pos.z }, null, null);
      }

      // Armed position - small tower
      var towerGeometry = new THREE.BoxGeometry(2.5, 4, 2.5);
      var towerMaterial = new THREE.MeshStandardMaterial({ color: colors.ironGray, roughness: 0.9 });
      addObject(towerGeometry, towerMaterial, { x: pos.x, y: 2.5, z: pos.z + 5 }, null, null);
    });
  }

  function buildBurnedVehicles() {
    var vehiclePositions = [
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: -20 },
      { x: 0, z: 20 }
    ];

    vehiclePositions.forEach(function(pos) {
      // Car body
      var bodyGeometry = new THREE.BoxGeometry(4, 2, 8);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.rustOrange, roughness: 0.95 });
      addObject(bodyGeometry, bodyMaterial, { x: pos.x, y: 1.5, z: pos.z }, null, null);

      // Burned chassis - darker box on top
      var chassisGeometry = new THREE.BoxGeometry(3.5, 1, 7);
      var chassisMaterial = new THREE.MeshStandardMaterial({ color: colors.darkCrate, roughness: 1 });
      addObject(chassisGeometry, chassisMaterial, { x: pos.x, y: 2.5, z: pos.z }, null, null);

      // Wheel rims
      for (var i = 0; i < 4; i++) {
        var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8);
        var wheelMaterial = new THREE.MeshStandardMaterial({ color: colors.ironGray, metalness: 0.6, roughness: 0.4 });
        var offsetZ = (i < 2 ? -3 : 3);
        var offsetX = (i % 2 === 0 ? -2 : 2);
        addObject(wheelGeometry, wheelMaterial, { x: pos.x + offsetX, y: 0.8, z: pos.z + offsetZ }, { x: Math.PI / 2, y: 0, z: 0 }, null);
      }
    });
  }

  function buildWaterWell() {
    var wellX = 0;
    var wellZ = 0;

    // Well cylinder structure
    var wellGeometry = new THREE.CylinderGeometry(3, 3.2, 4, 8);
    var wellMaterial = new THREE.MeshStandardMaterial({ color: colors.ashGray, roughness: 0.9 });
    addObject(wellGeometry, wellMaterial, { x: wellX, y: 2, z: wellZ }, null, null);

    // Well ring at top
    var ringGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 8);
    var ringMaterial = new THREE.MeshStandardMaterial({ color: colors.ironGray, metalness: 0.7, roughness: 0.3 });
    addObject(ringGeometry, ringMaterial, { x: wellX, y: 4.3, z: wellZ }, null, null);

    // Crank handle - horizontal cylinder
    var crankGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6);
    var crankMaterial = new THREE.MeshStandardMaterial({ color: colors.wornBrown, roughness: 0.7 });
    addObject(crankGeometry, crankMaterial, { x: wellX, y: 4.5, z: wellZ }, { x: 0, y: 0, z: Math.PI / 2 }, null);

    // Support beams
    addLine({ x: wellX - 3.5, y: 4.5, z: wellZ }, { x: wellX + 3.5, y: 4.5, z: wellZ }, colors.ironGray);
    addLine({ x: wellX, y: 4.5, z: wellZ - 3.5 }, { x: wellX, y: 4.5, z: wellZ + 3.5 }, colors.ironGray);
  }

  function buildHangingLanterns() {
    var lanternPositions = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 },
      { x: -30, z: 0 },
      { x: 30, z: 0 },
      { x: 0, z: -30 },
      { x: 0, z: 30 }
    ];

    lanternPositions.forEach(function(pos) {
      // Lantern sphere
      var sphereGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var sphereMaterial = new THREE.MeshStandardMaterial({
        color: colors.warmLantern,
        emissive: colors.warmLantern,
        emissiveIntensity: 0.6,
        roughness: 0.4
      });
      var lantern = addObject(sphereGeometry, sphereMaterial, { x: pos.x, y: 8, z: pos.z }, null, null);
      lantern.userData.baseY = 8;
      lantern.userData.swayAmount = 0.3;
      lantern.userData.swaySpeed = 1 + Math.random() * 0.5;
      lanterns.push(lantern);

      // Wire string to lantern
      addLine({ x: pos.x, y: 10, z: pos.z }, { x: pos.x, y: 8, z: pos.z }, colors.ropeColor);
    });
  }

  function buildCarpetDisplays() {
    var carpetPositions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: -15, z: 0 },
      { x: 15, z: 0 }
    ];

    carpetPositions.forEach(function(pos) {
      var carpetGeometry = new THREE.BoxGeometry(6, 0.15, 8);
      var carpetColor = [colors.rustOrange, colors.bloodRed, colors.wornBrown, colors.deepBrown][Math.floor(Math.random() * 4)];
      var carpetMaterial = new THREE.MeshStandardMaterial({ color: carpetColor, roughness: 0.6 });
      addObject(carpetGeometry, carpetMaterial, { x: pos.x, y: 0.1, z: pos.z }, null, null);

      // Small display items on carpet
      for (var i = 0; i < 3; i++) {
        var itemGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        var itemMaterial = new THREE.MeshStandardMaterial({ color: colors.darkCrate, roughness: 0.8 });
        var offsetX = (i - 1) * 2.5;
        addObject(itemGeometry, itemMaterial, { x: pos.x + offsetX, y: 0.6, z: pos.z }, null, null);
      }
    });
  }

  function buildCrowdBarriers() {
    var barrierSections = [
      { start: { x: -35, z: -10 }, end: { x: -35, z: 10 } },
      { start: { x: 35, z: -10 }, end: { x: 35, z: 10 } },
      { start: { x: -10, z: -35 }, end: { x: 10, z: -35 } },
      { start: { x: -10, z: 35 }, end: { x: 10, z: 35 } }
    ];

    barrierSections.forEach(function(section) {
      var distance = Math.hypot(section.end.x - section.start.x, section.end.z - section.start.z);
      var midX = (section.start.x + section.end.x) / 2;
      var midZ = (section.start.z + section.end.z) / 2;
      var angle = Math.atan2(section.end.z - section.start.z, section.end.x - section.start.x);

      // Posts along barrier
      var postCount = Math.ceil(distance / 5);
      for (var i = 0; i < postCount; i++) {
        var t = i / postCount;
        var postX = section.start.x + (section.end.x - section.start.x) * t;
        var postZ = section.start.z + (section.end.z - section.start.z) * t;

        var postGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
        var postMaterial = new THREE.MeshStandardMaterial({ color: colors.wornBrown, roughness: 0.8 });
        addObject(postGeometry, postMaterial, { x: postX, y: 1, z: postZ }, null, null);
      }

      // Rope line
      addLine(section.start, section.end, colors.ropeColor);
    });
  }

  function buildSideAlleyExits() {
    var alleyExits = [
      { x: -38, z: -15, dirX: -1, dirZ: 0 },
      { x: -38, z: 15, dirX: -1, dirZ: 0 },
      { x: 38, z: -15, dirX: 1, dirZ: 0 },
      { x: 38, z: 15, dirX: 1, dirZ: 0 }
    ];

    alleyExits.forEach(function(exit) {
      // Corridor walls
      var wallLength = 12;
      var wallHeight = 8;
      var wallWidth = 0.5;

      // Left wall
      var leftWallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallLength);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: colors.ashGray, roughness: 0.95 });
      addObject(leftWallGeometry, wallMaterial, { x: exit.x + exit.dirX * 2, y: wallHeight / 2, z: exit.z - 3 }, null, null);

      // Right wall
      var rightWallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallLength);
      addObject(rightWallGeometry, wallMaterial, { x: exit.x + exit.dirX * 2, y: wallHeight / 2, z: exit.z + 3 }, null, null);

      // Rubble on ground
      for (var i = 0; i < 4; i++) {
        var rubbleGeometry = new THREE.BoxGeometry(2, 0.8, 2);
        var rubbleMaterial = new THREE.MeshStandardMaterial({ color: colors.deepBrown, roughness: 0.9 });
        var offsetZ = (i - 1.5) * 2.5;
        addObject(rubbleGeometry, rubbleMaterial, { x: exit.x + exit.dirX * 8, y: 0.5, z: exit.z + offsetZ }, null, null);
      }
    });
  }

  function buildCampfireCircles() {
    var campfirePositions = [
      { x: -22, z: -22 },
      { x: 22, z: -22 },
      { x: -22, z: 22 },
      { x: 22, z: 22 }
    ];

    campfirePositions.forEach(function(pos) {
      // Fire glow sphere
      var fireGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var fireMaterial = new THREE.MeshStandardMaterial({
        color: colors.fireGlow,
        emissive: colors.fireGlow,
        emissiveIntensity: 0.7,
        roughness: 0.5
      });
      var fireGlow = addObject(fireGeometry, fireMaterial, { x: pos.x, y: 1, z: pos.z }, null, null);
      fireGlow.userData.baseIntensity = 0.7;
      campfires.push(fireGlow);

      // Log seats around fire
      for (var i = 0; i < 4; i++) {
        var angle = (i / 4) * Math.PI * 2;
        var seatX = pos.x + Math.cos(angle) * 3;
        var seatZ = pos.z + Math.sin(angle) * 3;

        var logGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6);
        var logMaterial = new THREE.MeshStandardMaterial({ color: colors.deepBrown, roughness: 0.9 });
        addObject(logGeometry, logMaterial, { x: seatX, y: 0.8, z: seatZ }, { x: 0, y: 0, z: Math.PI / 4 }, null);
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    lanterns = [];
    campfires = [];
    time = 0;

    buildCentralSquare();
    buildMarketStalls();
    buildWeaponMerchantDisplays();
    buildRuinedBuildings();
    buildBlackMarketCrates();
    buildBarricadeCheckpoints();
    buildBurnedVehicles();
    buildWaterWell();
    buildHangingLanterns();
    buildCarpetDisplays();
    buildCrowdBarriers();
    buildSideAlleyExits();
    buildCampfireCircles();
  }

  function update(delta) {
    time += delta;

    // Animate lanterns swaying
    lanterns.forEach(function(lantern) {
      var sway = Math.sin(time * lantern.userData.swaySpeed) * lantern.userData.swayAmount;
      lantern.position.y = lantern.userData.baseY + sway;
      lantern.position.x += Math.sin(time * lantern.userData.swaySpeed * 0.7) * 0.02;
      lantern.position.z += Math.cos(time * lantern.userData.swaySpeed * 0.6) * 0.02;
    });

    // Animate campfire flicker
    campfires.forEach(function(fire) {
      var flicker = fire.userData.baseIntensity + Math.sin(time * 3.5) * 0.2 + Math.random() * 0.15;
      fire.material.emissiveIntensity = Math.max(0.3, Math.min(1, flicker));
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      scene.remove(obj);
    });
    objects = [];
    lanterns = [];
    campfires = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
