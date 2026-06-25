window.WinterVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var villageGroup = null;
  var snowflakes = [];
  var flames = [];
  var trees = [];
  var vehiclesGroup = null;
  var buildingsGroup = null;

  var snowflakeSpeed = 0.5;
  var fireTimer = 0;
  var windStrength = 0;
  var windTimer = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    villageGroup = new THREE.Group();
    scene.add(villageGroup);

    buildingsGroup = new THREE.Group();
    villageGroup.add(buildingsGroup);

    vehiclesGroup = new THREE.Group();
    villageGroup.add(vehiclesGroup);

    createSnowGround();
    createFarmhouses();
    createOrthodoxChurch();
    createFrozenWell();
    createSnowCoveredVehicles();
    createPineTrees();
    createFenceRows();
    createIcicles();
    createSnowDrifts();
    createCampfireCircle();
    createMilitaryCamoNets();
    createHayBales();
    createBarn();
    createSupplyDump();
    createRoadBarrier();
    createFrozenPond();
    createSnowflakes();
  }

  function createSnowGround() {
    var groundGeometry = new THREE.BoxGeometry(300, 0.5, 300);
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5ff, emissive: 0x303030 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.castShadow = true;
    ground.receiveShadow = true;
    buildingsGroup.add(ground);

    // Snow texture variations
    for (var i = 0; i < 40; i++) {
      var snowPatchGeo = new THREE.BoxGeometry(Math.random() * 20 + 10, 0.05, Math.random() * 20 + 10);
      var snowPatchMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x1a1a2e });
      var snowPatch = new THREE.Mesh(snowPatchGeo, snowPatchMat);
      snowPatch.position.set((Math.random() - 0.5) * 280, 0.3, (Math.random() - 0.5) * 280);
      snowPatch.receiveShadow = true;
      buildingsGroup.add(snowPatch);
    }
  }

  function createFarmhouses() {
    var farmhousePositions = [
      { x: -80, z: 40 },
      { x: 50, z: 30 },
      { x: -120, z: -60 },
      { x: 90, z: -50 }
    ];

    farmhousePositions.forEach(function(pos) {
      createFarmhouse(pos.x, pos.z);
    });
  }

  function createFarmhouse(x, z) {
    // Main log wall body
    var wallGeometry = new THREE.BoxGeometry(20, 12, 16);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914, emissive: 0x2a1810 });
    var walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.set(x, 6, z);
    walls.castShadow = true;
    walls.receiveShadow = true;
    buildingsGroup.add(walls);

    // Roof peak - cone
    var roofGeometry = new THREE.ConeGeometry(14, 8, 4);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc, emissive: 0x333333 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 16, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    buildingsGroup.add(roof);

    // Snow on roof
    var snowRoofGeometry = new THREE.ConeGeometry(14.2, 0.5, 4);
    var snowRoofMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
    var snowRoof = new THREE.Mesh(snowRoofGeometry, snowRoofMaterial);
    snowRoof.position.set(x, 19.5, z);
    snowRoof.rotation.y = Math.PI / 4;
    buildingsGroup.add(snowRoof);

    // Window
    var windowGeometry = new THREE.BoxGeometry(3, 3, 0.5);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5568, emissive: 0x0f0f1e });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(x - 6, 8, z - 8.5);
    buildingsGroup.add(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(x + 6, 8, z - 8.5);
    buildingsGroup.add(window2);

    // Door
    var doorGeometry = new THREE.BoxGeometry(4, 8, 0.5);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817, emissive: 0x1a0f08 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, 4, z - 8.5);
    buildingsGroup.add(door);

    // Chimney
    var chimneyGeometry = new THREE.BoxGeometry(2.5, 14, 2.5);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728, emissive: 0x1a0f08 });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(x + 7, 10, z + 5);
    chimney.castShadow = true;
    buildingsGroup.add(chimney);
  }

  function createOrthodoxChurch() {
    var x = 0;
    var z = -100;

    // Main body
    var bodyGeometry = new THREE.BoxGeometry(14, 18, 14);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x7a5239, emissive: 0x2a1810 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 9, z);
    body.castShadow = true;
    buildingsGroup.add(body);

    // Onion dome (main)
    var domeGeometry = new THREE.CylinderGeometry(7, 7, 6, 32);
    var domeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2, emissive: 0x1a2a5e });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(x, 24, z);
    dome.castShadow = true;
    buildingsGroup.add(dome);

    // Spire (cone on top of dome)
    var spireGeometry = new THREE.ConeGeometry(3, 10, 16);
    var spireMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x664d00 });
    var spire = new THREE.Mesh(spireGeometry, spireMaterial);
    spire.position.set(x, 30, z);
    spire.castShadow = true;
    buildingsGroup.add(spire);

    // Smaller domes
    var smallDomePositions = [
      { x: -6, z: -6 },
      { x: 6, z: -6 },
      { x: -6, z: 6 },
      { x: 6, z: 6 }
    ];

    smallDomePositions.forEach(function(pos) {
      var smallDomeGeo = new THREE.ConeGeometry(2.5, 4, 16);
      var smallDomeMat = new THREE.MeshLambertMaterial({ color: 0x4a90e2, emissive: 0x1a2a5e });
      var smallDome = new THREE.Mesh(smallDomeGeo, smallDomeMat);
      smallDome.position.set(x + pos.x, 20, z + pos.z);
      buildingsGroup.add(smallDome);
    });

    // Cross on top
    var crossHorizGeo = new THREE.BoxGeometry(4, 0.5, 0.5);
    var crossMat = new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x664d00 });
    var crossHoriz = new THREE.Mesh(crossHorizGeo, crossMat);
    crossHoriz.position.set(x, 30.5, z);
    buildingsGroup.add(crossHoriz);

    var crossVertGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
    var crossVert = new THREE.Mesh(crossVertGeo, crossMat);
    crossVert.position.set(x, 31.5, z);
    buildingsGroup.add(crossVert);
  }

  function createFrozenWell() {
    var x = 60;
    var z = 80;

    // Stone rim (cylinder)
    var rimGeometry = new THREE.CylinderGeometry(3, 3.2, 2, 16);
    var rimMaterial = new THREE.MeshLambertMaterial({ color: 0x696969, emissive: 0x1a1a1a });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(x, 1, z);
    rim.castShadow = true;
    buildingsGroup.add(rim);

    // Roof
    var roofGeometry = new THREE.BoxGeometry(8, 1.5, 8);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914, emissive: 0x2a1810 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 2.5, z);
    roof.castShadow = true;
    buildingsGroup.add(roof);

    // Rope pulley (cylinder)
    var pulleyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    var pulleyMaterial = new THREE.MeshLambertMaterial({ color: 0x654321, emissive: 0x1a0f08 });
    var pulley = new THREE.Mesh(pulleyGeometry, pulleyMaterial);
    pulley.position.set(x, 4, z);
    buildingsGroup.add(pulley);

    // Rope as line segments
    var ropePoints = [
      new THREE.Vector3(x + 2, 3.5, z),
      new THREE.Vector3(x + 2, -4, z)
    ];
    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xb8860b, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    buildingsGroup.add(rope);

    var rope2Points = [
      new THREE.Vector3(x - 2, 3.5, z),
      new THREE.Vector3(x - 2, -4, z)
    ];
    var rope2Geometry = new THREE.BufferGeometry().setFromPoints(rope2Points);
    var rope2 = new THREE.LineSegments(rope2Geometry, ropeMaterial);
    buildingsGroup.add(rope2);

    // Frozen water surface
    var waterGeometry = new THREE.BoxGeometry(5.5, 0.1, 5.5);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0xccffff, emissive: 0x336666 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(x, -0.5, z);
    buildingsGroup.add(water);
  }

  function createSnowCoveredVehicles() {
    // Truck 1
    var truckBodyGeo = new THREE.BoxGeometry(8, 6, 12);
    var truckMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
    var truckBody = new THREE.Mesh(truckBodyGeo, truckMat);
    truckBody.position.set(-50, 3, 60);
    vehiclesGroup.add(truckBody);

    // Snow on truck
    var truckSnowGeo = new THREE.BoxGeometry(8.5, 3, 12.5);
    var truckSnowMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
    var truckSnow = new THREE.Mesh(truckSnowGeo, truckSnowMat);
    truckSnow.position.set(-50, 7, 60);
    vehiclesGroup.add(truckSnow);

    // Cab
    var cabGeo = new THREE.BoxGeometry(6, 4, 4);
    var cabMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, emissive: 0x0a0a0a });
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-50, 5, 70);
    vehiclesGroup.add(cab);

    var cabSnowGeo = new THREE.BoxGeometry(6.5, 2.5, 4.5);
    var cabSnow = new THREE.Mesh(cabSnowGeo, truckSnowMat);
    cabSnow.position.set(-50, 8, 70);
    vehiclesGroup.add(cabSnow);

    // Car
    var carBodyGeo = new THREE.BoxGeometry(5, 4, 9);
    var carMat = new THREE.MeshLambertMaterial({ color: 0x404040, emissive: 0x0a0a0a });
    var carBody = new THREE.Mesh(carBodyGeo, carMat);
    carBody.position.set(70, 2, 50);
    vehiclesGroup.add(carBody);

    var carSnowGeo = new THREE.BoxGeometry(5.5, 2.5, 9.5);
    var carSnow = new THREE.Mesh(carSnowGeo, truckSnowMat);
    carSnow.position.set(70, 5.5, 50);
    vehiclesGroup.add(carSnow);
  }

  function createPineTrees() {
    var treePositions = [
      { x: -130, z: 50 },
      { x: -140, z: -80 },
      { x: 120, z: -120 },
      { x: 100, z: 60 },
      { x: -80, z: -140 },
      { x: 60, z: -90 }
    ];

    treePositions.forEach(function(pos) {
      createPineTree(pos.x, pos.z);
    });

    trees = treePositions;
  }

  function createPineTree(x, z) {
    // Trunk
    var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 15, 8);
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3d2817, emissive: 0x0a0805 });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 7.5, z);
    trunk.castShadow = true;
    buildingsGroup.add(trunk);

    // Green foliage cone
    var foliageGeo = new THREE.ConeGeometry(8, 16, 8);
    var foliageMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a, emissive: 0x0a2610 });
    var foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.set(x, 13, z);
    foliage.castShadow = true;
    buildingsGroup.add(foliage);

    // Snow cap on top
    var snowCapGeo = new THREE.ConeGeometry(8.5, 2, 8);
    var snowCapMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
    var snowCap = new THREE.Mesh(snowCapGeo, snowCapMat);
    snowCap.position.set(x, 22, z);
    buildingsGroup.add(snowCap);
  }

  function createFenceRows() {
    var fenceStartPositions = [
      { x: -150, z: 0 },
      { x: 150, z: 0 },
      { x: 0, z: 150 }
    ];

    fenceStartPositions.forEach(function(pos) {
      createFenceRow(pos.x, pos.z);
    });
  }

  function createFenceRow(startX, startZ) {
    var fenceLength = 100;
    var fenceSpacing = 5;
    var isHorizontal = startX === 0;

    for (var i = 0; i < fenceLength / fenceSpacing; i++) {
      var fenceX = isHorizontal ? startX + i * fenceSpacing : startX;
      var fenceZ = isHorizontal ? startZ : startZ + i * fenceSpacing;

      // Horizontal plank
      var plankGeo = new THREE.BoxGeometry(5, 1, 0.4);
      var plankMat = new THREE.MeshLambertMaterial({ color: 0x8b6914, emissive: 0x2a1810 });
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(fenceX, 2, fenceZ);
      buildingsGroup.add(plank);

      var plank2 = new THREE.Mesh(plankGeo, plankMat);
      plank2.position.set(fenceX, 4, fenceZ);
      buildingsGroup.add(plank2);

      // Post
      var postGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
      var postMat = new THREE.MeshLambertMaterial({ color: 0x654321, emissive: 0x1a0f08 });
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(fenceX, 2.5, fenceZ);
      buildingsGroup.add(post);
    }
  }

  function createIcicles() {
    var roofEdges = [
      { x: -70, z: 50, count: 8 },
      { x: 60, z: 35, count: 8 },
      { x: -110, z: -65, count: 8 }
    ];

    roofEdges.forEach(function(edge) {
      for (var i = 0; i < edge.count; i++) {
        var offset = (i - edge.count / 2) * 2;
        var icicleGeo = new THREE.ConeGeometry(0.3, 2, 8);
        var icicleMat = new THREE.MeshLambertMaterial({ color: 0xccffff, emissive: 0x336666 });
        var icicle = new THREE.Mesh(icicleGeo, icicleMat);
        icicle.position.set(edge.x + offset, 16, edge.z - 9);
        icicle.rotation.z = Math.PI;
        buildingsGroup.add(icicle);
      }
    });
  }

  function createSnowDrifts() {
    var driftCount = 8;
    for (var i = 0; i < driftCount; i++) {
      var driftGeo = new THREE.SphereGeometry(Math.random() * 6 + 4, 8, 8);
      var driftMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
      var drift = new THREE.Mesh(driftGeo, driftMat);

      var randomX = (Math.random() - 0.5) * 250;
      var randomZ = (Math.random() - 0.5) * 250;
      drift.position.set(randomX, 1, randomZ);
      drift.scale.y = 0.5;
      drift.castShadow = true;
      drift.receiveShadow = true;
      buildingsGroup.add(drift);
    }
  }

  function createCampfireCircle() {
    var x = -20;
    var z = 20;

    // Stone circle (cylinder)
    var stoneGeo = new THREE.CylinderGeometry(5, 5, 0.8, 16);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a, emissive: 0x1a1a1a });
    var stones = new THREE.Mesh(stoneGeo, stoneMat);
    stones.position.set(x, 0.4, z);
    stones.receiveShadow = true;
    buildingsGroup.add(stones);

    // Fire flames (sphere)
    var flameGeo = new THREE.SphereGeometry(2, 6, 6);
    var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6b35, emissive: 0xff3d00 });
    var flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, 2, z);
    buildingsGroup.add(flame);

    flames.push({
      mesh: flame,
      baseY: 2,
      index: 0
    });

    // Log
    var logGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var logMat = new THREE.MeshLambertMaterial({ color: 0x4a3728, emissive: 0x1a0f08 });
    var log = new THREE.Mesh(logGeo, logMat);
    log.position.set(x, 1, z);
    log.rotation.z = Math.PI / 4;
    buildingsGroup.add(log);
  }

  function createMilitaryCamoNets() {
    var netPositions = [
      { x: 40, z: -60, width: 15, height: 12 },
      { x: -60, z: -100, width: 18, height: 10 }
    ];

    netPositions.forEach(function(net) {
      var points = [];
      var gridX = 6;
      var gridZ = 5;

      for (var i = 0; i < gridX; i++) {
        for (var j = 0; j < gridZ; j++) {
          var px = net.x - net.width / 2 + (i / gridX) * net.width;
          var pz = net.z - net.height / 2 + (j / gridZ) * net.height;
          points.push(new THREE.Vector3(px, 3, pz));
        }
      }

      // Draw net lines
      for (var i = 0; i < gridX; i++) {
        for (var j = 0; j < gridZ - 1; j++) {
          var idx = i * gridZ + j;
          var lineGeo = new THREE.BufferGeometry().setFromPoints([
            points[idx],
            points[idx + 1]
          ]);
          var lineMat = new THREE.LineBasicMaterial({ color: 0x4a4a3a, linewidth: 1 });
          var line = new THREE.LineSegments(lineGeo, lineMat);
          buildingsGroup.add(line);
        }
      }
    });
  }

  function createHayBales() {
    var hayPositions = [
      { x: 30, z: -30 },
      { x: 50, z: -40 },
      { x: 25, z: -45 }
    ];

    hayPositions.forEach(function(pos) {
      var hayGeo = new THREE.CylinderGeometry(2, 2, 1.5, 8);
      var hayMat = new THREE.MeshLambertMaterial({ color: 0xdaa520, emissive: 0x6b4423 });
      var hay = new THREE.Mesh(hayGeo, hayMat);
      hay.position.set(pos.x, 0.75, pos.z);
      hay.castShadow = true;
      hay.receiveShadow = true;
      buildingsGroup.add(hay);

      // Snow on top
      var snowGeo = new THREE.BoxGeometry(4.5, 0.5, 4.5);
      var snowMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
      var snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(pos.x, 2, pos.z);
      buildingsGroup.add(snow);
    });
  }

  function createBarn() {
    var x = -100;
    var z = 80;

    // Large main body
    var barnGeo = new THREE.BoxGeometry(30, 14, 24);
    var barnMat = new THREE.MeshLambertMaterial({ color: 0x654321, emissive: 0x1a0f08 });
    var barn = new THREE.Mesh(barnGeo, barnMat);
    barn.position.set(x, 7, z);
    barn.castShadow = true;
    barn.receiveShadow = true;
    buildingsGroup.add(barn);

    // Roof
    var roofGeo = new THREE.ConeGeometry(16, 10, 4);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b6914, emissive: 0x2a1810 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(x, 18, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    buildingsGroup.add(roof);

    // Big doors
    var doorGeo = new THREE.BoxGeometry(8, 10, 0.5);
    var doorMat = new THREE.MeshLambertMaterial({ color: 0x3d2817, emissive: 0x1a0f08 });
    var door1 = new THREE.Mesh(doorGeo, doorMat);
    door1.position.set(x - 5, 7, z - 12.5);
    buildingsGroup.add(door1);

    var door2 = new THREE.Mesh(doorGeo, doorMat);
    door2.position.set(x + 5, 7, z - 12.5);
    buildingsGroup.add(door2);
  }

  function createSupplyDump() {
    var x = 80;
    var z = -80;

    // Multiple crates
    for (var i = 0; i < 5; i++) {
      var crateGeo = new THREE.BoxGeometry(4, 4, 4);
      var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b7355, emissive: 0x2a1810 });
      var crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(x - 10 + i * 5, 2, z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      buildingsGroup.add(crate);

      // Snow on crate
      var snowGeo = new THREE.BoxGeometry(4.5, 1.5, 4.5);
      var snowMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a0a14 });
      var snow = new THREE.Mesh(snowGeo, snowMat);
      snow.position.set(x - 10 + i * 5, 5, z);
      buildingsGroup.add(snow);
    }
  }

  function createRoadBarrier() {
    var x = 0;
    var z = 120;

    for (var i = 0; i < 6; i++) {
      var barGeo = new THREE.BoxGeometry(3, 2, 0.4);
      var barMat = new THREE.MeshLambertMaterial({ color: 0xff4500, emissive: 0x661a00 });
      var bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x - 9 + i * 3, 1, z);
      buildingsGroup.add(bar);

      // White stripe
      var stripeGeo = new THREE.BoxGeometry(2.8, 0.3, 0.5);
      var stripeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x333333 });
      var stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(x - 9 + i * 3, 1.5, z);
      buildingsGroup.add(stripe);
    }
  }

  function createFrozenPond() {
    var x = -80;
    var z = -120;

    var pondGeo = new THREE.BoxGeometry(40, 0.2, 50);
    var pondMat = new THREE.MeshLambertMaterial({ color: 0xb3d9ff, emissive: 0x4d7399 });
    var pond = new THREE.Mesh(pondGeo, pondMat);
    pond.position.set(x, 0.15, z);
    pond.receiveShadow = true;
    buildingsGroup.add(pond);

    // Ice cracks (line segments)
    var crackPoints = [
      new THREE.Vector3(x - 15, 0.2, z - 15),
      new THREE.Vector3(x + 10, 0.2, z + 10),
      new THREE.Vector3(x + 15, 0.2, z - 20),
      new THREE.Vector3(x - 10, 0.2, z + 20)
    ];

    for (var i = 0; i < crackPoints.length - 1; i++) {
      var crackGeo = new THREE.BufferGeometry().setFromPoints([
        crackPoints[i],
        crackPoints[i + 1]
      ]);
      var crackMat = new THREE.LineBasicMaterial({ color: 0x4d7399, linewidth: 2 });
      var crack = new THREE.LineSegments(crackGeo, crackMat);
      buildingsGroup.add(crack);
    }
  }

  function createSnowflakes() {
    var flakeCount = 200;
    for (var i = 0; i < flakeCount; i++) {
      var flakeGeo = new THREE.SphereGeometry(0.05, 4, 4);
      var flakeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xcccccc });
      var flake = new THREE.Mesh(flakeGeo, flakeMat);

      flake.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 200 + 50,
        (Math.random() - 0.5) * 400
      );

      flake.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        -snowflakeSpeed,
        (Math.random() - 0.5) * 0.2
      );

      villageGroup.add(flake);
      snowflakes.push(flake);
    }
  }

  function update(delta) {
    // Update snowflakes
    for (var i = 0; i < snowflakes.length; i++) {
      var flake = snowflakes[i];
      flake.position.add(flake.userData.velocity);

      // Reset flake if it falls below ground
      if (flake.position.y < 0) {
        flake.position.y = Math.random() * 200 + 100;
        flake.position.x = (Math.random() - 0.5) * 400;
        flake.position.z = (Math.random() - 0.5) * 400;
      }

      // Wind effect
      flake.userData.velocity.x += Math.sin(windTimer * 0.5) * 0.01;
    }

    // Update fire flicker
    fireTimer += delta;
    if (flames.length > 0) {
      var flame = flames[0];
      var flicker = Math.sin(fireTimer * 3) * 0.3 + 1;
      flame.mesh.scale.y = flicker;
      flame.mesh.position.y = flame.baseY + (flicker - 1) * 0.5;

      // Color variation
      var colorValue = 0xff3d00 + Math.floor(Math.sin(fireTimer * 2) * 30) * 0x100;
      flame.mesh.material.emissive.setHex(colorValue);
    }

    // Wind animation for trees
    windTimer += delta;
    for (var i = 0; i < trees.length; i++) {
      var tree = trees[i];
      var sway = Math.sin(windTimer + i) * 0.02;
      // Tree sway would be applied to buildingsGroup rotation
    }
  }

  function reset() {
    fireTimer = 0;
    windTimer = 0;
    windStrength = 0;

    // Reset snowflakes
    for (var i = 0; i < snowflakes.length; i++) {
      snowflakes[i].position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 200 + 100,
        (Math.random() - 0.5) * 400
      );
    }

    // Reset flames
    if (flames.length > 0) {
      flames[0].mesh.scale.y = 1;
      flames[0].mesh.position.y = flames[0].baseY;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
