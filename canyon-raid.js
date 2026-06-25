window.CanyonRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var spawnPoints = [];
  var time = 0;

  var SANDSTONE_ORANGE = 0xC2834A;
  var TERRACOTTA = 0x8B4513;
  var DUSTY_BEIGE = 0xD4A574;
  var SHADOW_GRAY = 0x4A4A4A;
  var DARK_BROWN = 0x3E2723;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    spawnPoints = [];
    time = 0;

    buildCanyonWalls();
    buildCanyonFloor();
    buildRopeBridges();
    buildCaveEntrances();
    buildStashRooms();
    buildSniperLedges();
    buildBoulderClusters();
    buildAbandonedMuleCaravan();
    buildWaterSeep();
    buildRopePulleySystem();
    buildLookoutPost();
    buildPetroglyphs();
    buildFallenColumn();
    buildDustClouds();

    createSpawnPoints();
  }

  function buildCanyonWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: SANDSTONE_ORANGE, roughness: 0.8 });
    var darkWallMaterial = new THREE.MeshStandardMaterial({ color: TERRACOTTA, roughness: 0.9 });
    var shadowMaterial = new THREE.MeshStandardMaterial({ color: SHADOW_GRAY, roughness: 0.7 });

    // Left canyon wall - tall layered sections
    var leftWallGeometry1 = new THREE.BoxGeometry(15, 100, 5);
    var leftWall1 = new THREE.Mesh(leftWallGeometry1, wallMaterial);
    leftWall1.position.set(-40, 50, 50);
    leftWall1.castShadow = true;
    leftWall1.receiveShadow = true;
    scene.add(leftWall1);
    meshes.push(leftWall1);

    var leftWallGeometry2 = new THREE.BoxGeometry(12, 80, 5);
    var leftWall2 = new THREE.Mesh(leftWallGeometry2, darkWallMaterial);
    leftWall2.position.set(-42, 55, 150);
    leftWall2.castShadow = true;
    leftWall2.receiveShadow = true;
    scene.add(leftWall2);
    meshes.push(leftWall2);

    var leftWallGeometry3 = new THREE.BoxGeometry(10, 90, 5);
    var leftWall3 = new THREE.Mesh(leftWallGeometry3, shadowMaterial);
    leftWall3.position.set(-40, 48, 250);
    leftWall3.castShadow = true;
    leftWall3.receiveShadow = true;
    scene.add(leftWall3);
    meshes.push(leftWall3);

    // Right canyon wall - tall layered sections
    var rightWallGeometry1 = new THREE.BoxGeometry(15, 100, 5);
    var rightWall1 = new THREE.Mesh(rightWallGeometry1, wallMaterial);
    rightWall1.position.set(40, 50, 50);
    rightWall1.castShadow = true;
    rightWall1.receiveShadow = true;
    scene.add(rightWall1);
    meshes.push(rightWall1);

    var rightWallGeometry2 = new THREE.BoxGeometry(12, 85, 5);
    var rightWall2 = new THREE.Mesh(rightWallGeometry2, darkWallMaterial);
    rightWall2.position.set(42, 52, 150);
    rightWall2.castShadow = true;
    rightWall2.receiveShadow = true;
    scene.add(rightWall2);
    meshes.push(rightWall2);

    var rightWallGeometry3 = new THREE.BoxGeometry(10, 95, 5);
    var rightWall3 = new THREE.Mesh(rightWallGeometry3, shadowMaterial);
    rightWall3.position.set(40, 50, 250);
    rightWall3.castShadow = true;
    rightWall3.receiveShadow = true;
    scene.add(rightWall3);
    meshes.push(rightWall3);
  }

  function buildCanyonFloor() {
    var floorMaterial = new THREE.MeshStandardMaterial({ color: DUSTY_BEIGE, roughness: 0.9 });

    // Main canyon floor sections
    var floorGeometry1 = new THREE.BoxGeometry(80, 2, 80);
    var floor1 = new THREE.Mesh(floorGeometry1, floorMaterial);
    floor1.position.set(0, 0, 50);
    floor1.receiveShadow = true;
    scene.add(floor1);
    meshes.push(floor1);

    var floorGeometry2 = new THREE.BoxGeometry(70, 2, 100);
    var floor2 = new THREE.Mesh(floorGeometry2, floorMaterial);
    floor2.position.set(0, 0, 160);
    floor2.receiveShadow = true;
    scene.add(floor2);
    meshes.push(floor2);

    var floorGeometry3 = new THREE.BoxGeometry(75, 2, 80);
    var floor3 = new THREE.Mesh(floorGeometry3, floorMaterial);
    floor3.position.set(0, 0, 270);
    floor3.receiveShadow = true;
    scene.add(floor3);
    meshes.push(floor3);

    // Narrow bottleneck section
    var bottleneckGeometry = new THREE.BoxGeometry(30, 2, 50);
    var bottleneck = new THREE.Mesh(bottleneckGeometry, new THREE.MeshStandardMaterial({ color: SHADOW_GRAY, roughness: 0.85 }));
    bottleneck.position.set(0, 0, 380);
    bottleneck.receiveShadow = true;
    scene.add(bottleneck);
    meshes.push(bottleneck);
  }

  function buildRopeBridges() {
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xA0826D, linewidth: 2 });

    // Bridge 1: planks across chasm
    for (var i = 0; i < 8; i++) {
      var plankGeometry = new THREE.BoxGeometry(8, 1, 2);
      var plank = new THREE.Mesh(plankGeometry, bridgeMaterial);
      plank.position.set(-8 + i * 2.5, 30, 100);
      plank.castShadow = true;
      plank.receiveShadow = true;
      scene.add(plank);
      meshes.push(plank);
    }

    // Bridge 1: rope lines using LineSegments
    var ropePoints1 = [
      new THREE.Vector3(-20, 35, 100),
      new THREE.Vector3(-20, 25, 100),
      new THREE.Vector3(20, 25, 100),
      new THREE.Vector3(20, 35, 100)
    ];
    var ropeGeometry1 = new THREE.BufferGeometry().setFromPoints(ropePoints1);
    var ropes1 = new THREE.LineSegments(ropeGeometry1, ropeMaterial);
    scene.add(ropes1);
    meshes.push(ropes1);

    // Bridge 2: second rope bridge
    for (var j = 0; j < 10; j++) {
      var plank2Geometry = new THREE.BoxGeometry(7, 0.8, 2);
      var plank2 = new THREE.Mesh(plank2Geometry, bridgeMaterial);
      plank2.position.set(-10 + j * 2, 40, 220);
      plank2.castShadow = true;
      plank2.receiveShadow = true;
      scene.add(plank2);
      meshes.push(plank2);
    }

    var ropePoints2 = [
      new THREE.Vector3(-25, 45, 220),
      new THREE.Vector3(-25, 35, 220),
      new THREE.Vector3(25, 35, 220),
      new THREE.Vector3(25, 45, 220)
    ];
    var ropeGeometry2 = new THREE.BufferGeometry().setFromPoints(ropePoints2);
    var ropes2 = new THREE.LineSegments(ropeGeometry2, ropeMaterial);
    scene.add(ropes2);
    meshes.push(ropes2);
  }

  function buildCaveEntrances() {
    var caveMaterial = new THREE.MeshStandardMaterial({ color: DARK_BROWN, roughness: 0.95 });
    var caveFrameMaterial = new THREE.MeshStandardMaterial({ color: TERRACOTTA, roughness: 0.8 });

    // Cave 1: left wall cave entrance
    var caveFrameGeometry1 = new THREE.BoxGeometry(12, 18, 2);
    var caveFrame1 = new THREE.Mesh(caveFrameGeometry1, caveFrameMaterial);
    caveFrame1.position.set(-42, 30, 80);
    caveFrame1.castShadow = true;
    caveFrame1.receiveShadow = true;
    scene.add(caveFrame1);
    meshes.push(caveFrame1);

    var caveInteriorGeometry1 = new THREE.BoxGeometry(10, 16, 1);
    var caveInterior1 = new THREE.Mesh(caveInteriorGeometry1, caveMaterial);
    caveInterior1.position.set(-42, 30, 78);
    caveInterior1.receiveShadow = true;
    scene.add(caveInterior1);
    meshes.push(caveInterior1);

    // Cave 2: right wall cave entrance
    var caveFrameGeometry2 = new THREE.BoxGeometry(12, 20, 2);
    var caveFrame2 = new THREE.Mesh(caveFrameGeometry2, caveFrameMaterial);
    caveFrame2.position.set(42, 32, 180);
    caveFrame2.castShadow = true;
    caveFrame2.receiveShadow = true;
    scene.add(caveFrame2);
    meshes.push(caveFrame2);

    var caveInteriorGeometry2 = new THREE.BoxGeometry(10, 18, 1);
    var caveInterior2 = new THREE.Mesh(caveInteriorGeometry2, caveMaterial);
    caveInterior2.position.set(42, 32, 178);
    caveInterior2.receiveShadow = true;
    scene.add(caveInterior2);
    meshes.push(caveInterior2);

    // Cave 3: left wall deep cave
    var caveFrameGeometry3 = new THREE.BoxGeometry(14, 16, 2);
    var caveFrame3 = new THREE.Mesh(caveFrameGeometry3, caveFrameMaterial);
    caveFrame3.position.set(-42, 28, 280);
    caveFrame3.castShadow = true;
    caveFrame3.receiveShadow = true;
    scene.add(caveFrame3);
    meshes.push(caveFrame3);

    var caveInteriorGeometry3 = new THREE.BoxGeometry(12, 14, 1);
    var caveInterior3 = new THREE.Mesh(caveInteriorGeometry3, caveMaterial);
    caveInterior3.position.set(-42, 28, 278);
    caveInterior3.receiveShadow = true;
    scene.add(caveInterior3);
    meshes.push(caveInterior3);
  }

  function buildStashRooms() {
    var crateColor = 0x8B7500;
    var crateMaterial = new THREE.MeshStandardMaterial({ color: crateColor, roughness: 0.7 });

    // Stash room 1: inside left cave
    var crate1Geometry = new THREE.BoxGeometry(4, 4, 4);
    var crate1 = new THREE.Mesh(crate1Geometry, crateMaterial);
    crate1.position.set(-42, 15, 75);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    scene.add(crate1);
    meshes.push(crate1);

    var crate2Geometry = new THREE.BoxGeometry(3, 3, 3);
    var crate2 = new THREE.Mesh(crate2Geometry, crateMaterial);
    crate2.position.set(-38, 12, 76);
    crate2.castShadow = true;
    crate2.receiveShadow = true;
    scene.add(crate2);
    meshes.push(crate2);

    // Stash room 2: right cave
    var crate3Geometry = new THREE.BoxGeometry(4, 4, 4);
    var crate3 = new THREE.Mesh(crate3Geometry, crateMaterial);
    crate3.position.set(42, 18, 175);
    crate3.castShadow = true;
    crate3.receiveShadow = true;
    scene.add(crate3);
    meshes.push(crate3);

    // Stash room 3: deep left cave
    var crate4Geometry = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    var crate4 = new THREE.Mesh(crate4Geometry, crateMaterial);
    crate4.position.set(-45, 16, 280);
    crate4.castShadow = true;
    crate4.receiveShadow = true;
    scene.add(crate4);
    meshes.push(crate4);

    var crate5Geometry = new THREE.BoxGeometry(3, 3, 3);
    var crate5 = new THREE.Mesh(crate5Geometry, crateMaterial);
    crate5.position.set(-39, 13, 282);
    crate5.castShadow = true;
    crate5.receiveShadow = true;
    scene.add(crate5);
    meshes.push(crate5);
  }

  function buildSniperLedges() {
    var ledgeMaterial = new THREE.MeshStandardMaterial({ color: TERRACOTTA, roughness: 0.75 });

    // Left wall sniper ledge 1
    var ledgeGeometry1 = new THREE.BoxGeometry(20, 3, 12);
    var ledge1 = new THREE.Mesh(ledgeGeometry1, ledgeMaterial);
    ledge1.position.set(-38, 70, 60);
    ledge1.rotation.z = 0.1;
    ledge1.castShadow = true;
    ledge1.receiveShadow = true;
    scene.add(ledge1);
    meshes.push(ledge1);

    // Right wall sniper ledge 1
    var ledgeGeometry2 = new THREE.BoxGeometry(20, 3, 12);
    var ledge2 = new THREE.Mesh(ledgeGeometry2, ledgeMaterial);
    ledge2.position.set(38, 72, 130);
    ledge2.rotation.z = -0.1;
    ledge2.castShadow = true;
    ledge2.receiveShadow = true;
    scene.add(ledge2);
    meshes.push(ledge2);

    // Left wall sniper ledge 2
    var ledgeGeometry3 = new THREE.BoxGeometry(18, 2.5, 10);
    var ledge3 = new THREE.Mesh(ledgeGeometry3, ledgeMaterial);
    ledge3.position.set(-38, 68, 240);
    ledge3.castShadow = true;
    ledge3.receiveShadow = true;
    scene.add(ledge3);
    meshes.push(ledge3);
  }

  function buildBoulderClusters() {
    var boulderMaterial = new THREE.MeshStandardMaterial({ color: SHADOW_GRAY, roughness: 0.9 });

    // Boulder cluster 1: canyon floor
    var boulder1Geometry = new THREE.SphereGeometry(8, 8, 8);
    var boulder1 = new THREE.Mesh(boulder1Geometry, boulderMaterial);
    boulder1.position.set(-25, 10, 40);
    boulder1.castShadow = true;
    boulder1.receiveShadow = true;
    scene.add(boulder1);
    meshes.push(boulder1);

    var boulder2Geometry = new THREE.SphereGeometry(6, 8, 8);
    var boulder2 = new THREE.Mesh(boulder2Geometry, boulderMaterial);
    boulder2.position.set(-18, 8, 35);
    boulder2.castShadow = true;
    boulder2.receiveShadow = true;
    scene.add(boulder2);
    meshes.push(boulder2);

    // Boulder cluster 2: path obstacle
    var boulder3Geometry = new THREE.SphereGeometry(7, 8, 8);
    var boulder3 = new THREE.Mesh(boulder3Geometry, boulderMaterial);
    boulder3.position.set(20, 9, 150);
    boulder3.castShadow = true;
    boulder3.receiveShadow = true;
    scene.add(boulder3);
    meshes.push(boulder3);

    var boulder4Geometry = new THREE.SphereGeometry(5, 8, 8);
    var boulder4 = new THREE.Mesh(boulder4Geometry, boulderMaterial);
    boulder4.position.set(28, 7, 145);
    boulder4.castShadow = true;
    boulder4.receiveShadow = true;
    scene.add(boulder4);
    meshes.push(boulder4);

    // Small shale rocks for crumbling effect
    var shale1Geometry = new THREE.BoxGeometry(2, 2, 2);
    var shale1 = new THREE.Mesh(shale1Geometry, new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.95 }));
    shale1.position.set(-20, 12, 50);
    shale1.castShadow = true;
    scene.add(shale1);
    meshes.push(shale1);
  }

  function buildAbandonedMuleCaravan() {
    var cartMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5D4F, roughness: 0.8 });

    // Cart body 1
    var cartGeometry1 = new THREE.BoxGeometry(5, 3, 8);
    var cart1 = new THREE.Mesh(cartGeometry1, cartMaterial);
    cart1.position.set(-15, 5, 200);
    cart1.castShadow = true;
    cart1.receiveShadow = true;
    scene.add(cart1);
    meshes.push(cart1);

    // Cart cargo
    var cargoGeometry1 = new THREE.BoxGeometry(4, 2, 6);
    var cargo1 = new THREE.Mesh(cargoGeometry1, new THREE.MeshStandardMaterial({ color: 0x8B7500, roughness: 0.7 }));
    cargo1.position.set(-15, 9, 200);
    cargo1.castShadow = true;
    cargo1.receiveShadow = true;
    scene.add(cargo1);
    meshes.push(cargo1);

    // Cart body 2
    var cartGeometry2 = new THREE.BoxGeometry(4, 2.5, 7);
    var cart2 = new THREE.Mesh(cartGeometry2, cartMaterial);
    cart2.position.set(10, 4, 210);
    cart2.castShadow = true;
    cart2.receiveShadow = true;
    scene.add(cart2);
    meshes.push(cart2);

    // Mule silhouette 1 (boxgeometry approximation)
    var muleGeometry1 = new THREE.BoxGeometry(3, 4, 6);
    var mule1 = new THREE.Mesh(muleGeometry1, new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.8 }));
    mule1.position.set(-5, 5, 195);
    mule1.castShadow = true;
    mule1.receiveShadow = true;
    scene.add(mule1);
    meshes.push(mule1);
  }

  function buildWaterSeep() {
    var dampMaterial = new THREE.MeshStandardMaterial({ color: 0x5A7A8A, roughness: 0.6, metalness: 0.1 });

    // Water seep patch on left wall
    var seepGeometry = new THREE.BoxGeometry(8, 15, 0.5);
    var seep = new THREE.Mesh(seepGeometry, dampMaterial);
    seep.position.set(-42.5, 25, 120);
    seep.receiveShadow = true;
    scene.add(seep);
    meshes.push(seep);

    // Algae/mineral deposit
    var depositGeometry = new THREE.BoxGeometry(6, 12, 0.3);
    var deposit = new THREE.Mesh(depositGeometry, new THREE.MeshStandardMaterial({ color: 0x6B8E6F, roughness: 0.7 }));
    deposit.position.set(-42.3, 26, 118);
    deposit.receiveShadow = true;
    scene.add(deposit);
    meshes.push(deposit);
  }

  function buildRopePulleySystem() {
    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3F35, roughness: 0.8 });
    var ropeLineColor = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 3 });

    // Pulley drum on right rim
    var drumGeometry = new THREE.CylinderGeometry(6, 6, 3, 16);
    var drum = new THREE.Mesh(drumGeometry, drumMaterial);
    drum.position.set(42, 95, 200);
    drum.rotation.z = Math.PI / 2;
    drum.castShadow = true;
    drum.receiveShadow = true;
    scene.add(drum);
    meshes.push(drum);

    // Rope hanging from pulley
    var ropePoints = [
      new THREE.Vector3(42, 90, 200),
      new THREE.Vector3(42, 50, 200),
      new THREE.Vector3(42, 20, 205)
    ];
    var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeVisualization = new THREE.LineSegments(ropeGeometry, ropeLineColor);
    scene.add(ropeVisualization);
    meshes.push(ropeVisualization);

    // Support structure
    var supportGeometry = new THREE.BoxGeometry(4, 20, 2);
    var support = new THREE.Mesh(supportGeometry, new THREE.MeshStandardMaterial({ color: TERRACOTTA, roughness: 0.8 }));
    support.position.set(44, 80, 200);
    support.castShadow = true;
    support.receiveShadow = true;
    scene.add(support);
    meshes.push(support);
  }

  function buildLookoutPost() {
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.8 });
    var platformMaterial = new THREE.MeshStandardMaterial({ color: DUSTY_BEIGE, roughness: 0.75 });

    // Platform on right rim
    var platformGeometry = new THREE.BoxGeometry(12, 2, 12);
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-35, 95, 320);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);

    // Post support
    var postGeometry = new THREE.CylinderGeometry(2, 3, 30, 8);
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(-35, 65, 320);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);
    meshes.push(post);

    // Guard shelter box
    var shelterGeometry = new THREE.BoxGeometry(6, 4, 6);
    var shelter = new THREE.Mesh(shelterGeometry, postMaterial);
    shelter.position.set(-35, 99, 320);
    shelter.castShadow = true;
    shelter.receiveShadow = true;
    scene.add(shelter);
    meshes.push(shelter);
  }

  function buildPetroglyphs() {
    var petroglyph1Material = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.9 });

    // Petroglyph carved pattern 1: left wall
    var petro1Geometry = new THREE.BoxGeometry(0.2, 6, 8);
    var petro1 = new THREE.Mesh(petro1Geometry, petroglyph1Material);
    petro1.position.set(-42.5, 45, 110);
    scene.add(petro1);
    meshes.push(petro1);

    // Petroglyph pattern 2: geometric
    var petro2Geometry = new THREE.BoxGeometry(6, 0.2, 8);
    var petro2 = new THREE.Mesh(petro2Geometry, petroglyph1Material);
    petro2.position.set(-40, 42, 110);
    scene.add(petro2);
    meshes.push(petro2);

    // Petroglyph pattern 3: right wall
    var petro3Geometry = new THREE.BoxGeometry(0.2, 5, 6);
    var petro3 = new THREE.Mesh(petro3Geometry, petroglyph1Material);
    petro3.position.set(42.5, 50, 200);
    scene.add(petro3);
    meshes.push(petro3);

    // Petroglyph pattern 4: circular design
    var petro4Geometry = new THREE.BoxGeometry(4, 0.2, 4);
    var petro4 = new THREE.Mesh(petro4Geometry, petroglyph1Material);
    petro4.position.set(38, 48, 200);
    scene.add(petro4);
    meshes.push(petro4);
  }

  function buildFallenColumn() {
    var columnMaterial = new THREE.MeshStandardMaterial({ color: TERRACOTTA, roughness: 0.8 });

    // Fallen stone column blocking path
    var columnGeometry = new THREE.CylinderGeometry(4, 4, 40, 12);
    var column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(0, 12, 320);
    column.rotation.z = Math.PI / 2.2;
    column.castShadow = true;
    column.receiveShadow = true;
    scene.add(column);
    meshes.push(column);

    // Column base debris
    var debrisGeometry = new THREE.BoxGeometry(10, 3, 8);
    var debris = new THREE.Mesh(debrisGeometry, columnMaterial);
    debris.position.set(8, 5, 330);
    debris.castShadow = true;
    debris.receiveShadow = true;
    scene.add(debris);
    meshes.push(debris);
  }

  function buildDustClouds() {
    var dustMaterial = new THREE.MeshStandardMaterial({ color: 0xC9A876, transparent: true, opacity: 0.3, roughness: 0.8 });

    // Dust cloud 1
    var dust1Geometry = new THREE.SphereGeometry(12, 6, 6);
    var dust1 = new THREE.Mesh(dust1Geometry, dustMaterial);
    dust1.position.set(15, 35, 140);
    scene.add(dust1);
    meshes.push(dust1);

    // Dust cloud 2
    var dust2Geometry = new THREE.SphereGeometry(10, 6, 6);
    var dust2 = new THREE.Mesh(dust2Geometry, dustMaterial);
    dust2.position.set(-20, 40, 250);
    scene.add(dust2);
    meshes.push(dust2);
  }

  function createSpawnPoints() {
    // Spawn point 1: canyon entry
    spawnPoints.push({ position: new THREE.Vector3(0, 5, -10), direction: new THREE.Vector3(0, 0, 1) });

    // Spawn point 2: first bridge approach
    spawnPoints.push({ position: new THREE.Vector3(-15, 5, 95), direction: new THREE.Vector3(0, 0, 1) });

    // Spawn point 3: cave mouth left
    spawnPoints.push({ position: new THREE.Vector3(-42, 15, 85), direction: new THREE.Vector3(1, 0, 0) });

    // Spawn point 4: bridge middle section
    spawnPoints.push({ position: new THREE.Vector3(0, 5, 160), direction: new THREE.Vector3(0, 0, 1) });

    // Spawn point 5: bottleneck approach
    spawnPoints.push({ position: new THREE.Vector3(0, 5, 360), direction: new THREE.Vector3(0, 0, -1) });
  }

  function update(delta) {
    time += delta;

    // Rope bridge swaying animation
    var bridgeSwayAmount = Math.sin(time * 0.8) * 0.15;
    var bridgeSwayRotation = Math.sin(time * 0.6) * 0.02;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];

      // Apply sway to rope bridge planks
      if (mesh.geometry && mesh.geometry instanceof THREE.BoxGeometry) {
        if (mesh.position.z > 95 && mesh.position.z < 105) {
          mesh.position.y += bridgeSwayAmount * 0.02;
          mesh.rotation.z = bridgeSwayRotation;
        }
        if (mesh.position.z > 215 && mesh.position.z < 225) {
          mesh.position.y += bridgeSwayAmount * 0.015;
          mesh.rotation.z = bridgeSwayRotation * 0.8;
        }
      }

      // Sniper glint effect on ledges
      if (mesh.position.y > 65 && mesh.position.y < 75 && (mesh.position.x > 35 || mesh.position.x < -35)) {
        var glintIntensity = Math.sin(time * 2.5) * 0.5 + 0.5;
        if (mesh.material) {
          mesh.material.emissive = new THREE.Color(0xFFDD00);
          mesh.material.emissiveIntensity = glintIntensity * 0.4;
        }
      }
    }

    // Pulley rotation
    for (var j = 0; j < meshes.length; j++) {
      var obj = meshes[j];
      if (obj.geometry && obj.geometry instanceof THREE.CylinderGeometry) {
        if (obj.position.y > 90 && obj.position.y < 100) {
          obj.rotation.x += delta * 2;
        }
      }
    }

    // Dust cloud drifting
    for (var k = 0; k < meshes.length; k++) {
      var dustCloud = meshes[k];
      if (dustCloud.geometry && dustCloud.geometry instanceof THREE.SphereGeometry) {
        if (dustCloud.position.x > 10 && dustCloud.position.y > 30) {
          dustCloud.position.x += Math.sin(time * 0.4) * 0.1;
          dustCloud.position.y += Math.cos(time * 0.3) * 0.05;
        }
      }
    }

    // Boulders crumbling (shale falling)
    for (var m = 0; m < meshes.length; m++) {
      var rock = meshes[m];
      if (rock.position.z > 45 && rock.position.z < 55) {
        var fallSpeed = Math.sin(time * 1.2 + rock.position.x) * 0.08;
        if (fallSpeed < 0 && rock.position.y > 5) {
          rock.position.y += fallSpeed;
        }
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    spawnPoints = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
