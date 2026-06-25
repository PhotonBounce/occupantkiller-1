window.WreckedCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var particleSystems = [];

  var Materials = {
    concreteGray: null,
    ashBlack: null,
    rustBrown: null,
    darkWater: null,
    grassGreen: null,
    fireOrange: null,
    warningRed: null,
    metalGray: null,
    graffitiBright: null,
    dustWhite: null
  };

  function initMaterials() {
    Materials.concreteGray = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.3, roughness: 0.8 });
    Materials.ashBlack = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.9 });
    Materials.rustBrown = new THREE.MeshStandardMaterial({ color: 0x6b4423, metalness: 0.5, roughness: 0.7 });
    Materials.darkWater = new THREE.MeshStandardMaterial({ color: 0x2d4d5f, metalness: 0.9, roughness: 0.2 });
    Materials.grassGreen = new THREE.MeshStandardMaterial({ color: 0x3d5c2f, metalness: 0.0, roughness: 0.9 });
    Materials.fireOrange = new THREE.MeshStandardMaterial({ color: 0xff8c00, emissive: 0xff4500, metalness: 0.0, roughness: 1.0 });
    Materials.warningRed = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.2, roughness: 0.6 });
    Materials.metalGray = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.3 });
    Materials.graffitiBright = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 0.0, roughness: 0.8 });
    Materials.dustWhite = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.6 });
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createSkeletalBuildings() {
    // Building 1: 20x30x60 frame with exposed columns and broken floors
    var buildingPos = { x: -30, y: 0, z: -25 };

    // Main columns (4 corner columns)
    var colGeo = new THREE.BoxGeometry(3, 60, 3);
    var col1 = addToScene(new THREE.Mesh(colGeo, Materials.concreteGray));
    col1.position.set(buildingPos.x - 8, 30, buildingPos.z - 12);

    var col2 = addToScene(new THREE.Mesh(colGeo, Materials.concreteGray));
    col2.position.set(buildingPos.x + 8, 30, buildingPos.z - 12);

    var col3 = addToScene(new THREE.Mesh(colGeo, Materials.concreteGray));
    col3.position.set(buildingPos.x - 8, 30, buildingPos.z + 12);

    var col4 = addToScene(new THREE.Mesh(colGeo, Materials.concreteGray));
    col4.position.set(buildingPos.x + 8, 30, buildingPos.z + 12);

    // Horizontal beams connecting columns
    var beamGeo = new THREE.BoxGeometry(16, 2, 2);
    var beam1 = addToScene(new THREE.Mesh(beamGeo, Materials.concreteGray));
    beam1.position.set(buildingPos.x, 45, buildingPos.z - 12);

    var beam2 = addToScene(new THREE.Mesh(beamGeo, Materials.concreteGray));
    beam2.position.set(buildingPos.x, 45, buildingPos.z + 12);

    var beam3 = addToScene(new THREE.Mesh(beamGeo, Materials.concreteGray));
    beam3.position.set(buildingPos.x, 30, buildingPos.z);
    beam3.rotation.z = Math.PI / 2;

    var beam4 = addToScene(new THREE.Mesh(beamGeo, Materials.concreteGray));
    beam4.position.set(buildingPos.x, 15, buildingPos.z);
    beam4.rotation.z = Math.PI / 2;

    // Partial collapsed floor slabs
    var floorGeo = new THREE.BoxGeometry(14, 1.5, 20);
    var floor1 = addToScene(new THREE.Mesh(floorGeo, Materials.ashBlack));
    floor1.position.set(buildingPos.x + 2, 40, buildingPos.z);
    floor1.rotation.z = 0.3;

    var floor2 = addToScene(new THREE.Mesh(floorGeo, Materials.ashBlack));
    floor2.position.set(buildingPos.x - 3, 25, buildingPos.z);
    floor2.rotation.z = -0.2;

    // Building 2: Taller collapsed structure
    var building2Pos = { x: 20, y: 0, z: -35 };

    var col2_1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2.5, 70, 2.5), Materials.concreteGray));
    col2_1.position.set(building2Pos.x - 10, 35, building2Pos.z);

    var col2_2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2.5, 70, 2.5), Materials.concreteGray));
    col2_2.position.set(building2Pos.x + 10, 35, building2Pos.z);

    var col2_3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2.5, 50, 2.5), Materials.concreteGray));
    col2_3.position.set(building2Pos.x - 10, 25, building2Pos.z + 15);
    col2_3.rotation.z = 0.4;

    var crashBeam = addToScene(new THREE.Mesh(new THREE.BoxGeometry(20, 3, 3), Materials.rustBrown));
    crashBeam.position.set(building2Pos.x, 20, building2Pos.z + 5);
    crashBeam.rotation.z = 0.6;

    var floor2_1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(18, 2, 25), Materials.ashBlack));
    floor2_1.position.set(building2Pos.x, 50, building2Pos.z);
    floor2_1.rotation.x = 0.15;

    var floor2_2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(18, 1.5, 25), Materials.ashBlack));
    floor2_2.position.set(building2Pos.x + 1, 30, building2Pos.z + 3);
    floor2_2.rotation.x = -0.2;
  }

  function createRubbleMountains() {
    // Large rubble mound 1
    var mound1Pos = { x: -50, y: 0, z: 10 };
    var rubbleGeo = new THREE.BoxGeometry(3, 3, 3);

    for (var i = 0; i < 25; i++) {
      var rubble = addToScene(new THREE.Mesh(rubbleGeo, Materials.concreteGray));
      rubble.position.set(
        mound1Pos.x + Math.random() * 15 - 7.5,
        mound1Pos.y + Math.random() * 20 + 2,
        mound1Pos.z + Math.random() * 15 - 7.5
      );
      rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }

    // Large mound base
    var moundBase1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(20, 8, 20), Materials.ashBlack));
    moundBase1.position.set(mound1Pos.x, 4, mound1Pos.z);

    // Large rubble mound 2
    var mound2Pos = { x: 40, y: 0, z: 15 };
    var moundBase2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(25, 10, 25), Materials.concreteGray));
    moundBase2.position.set(mound2Pos.x, 5, mound2Pos.z);

    for (var j = 0; j < 30; j++) {
      var rubble2 = addToScene(new THREE.Mesh(rubbleGeo, Materials.ashBlack));
      rubble2.position.set(
        mound2Pos.x + Math.random() * 18 - 9,
        mound2Pos.y + Math.random() * 25 + 3,
        mound2Pos.z + Math.random() * 18 - 9
      );
      rubble2.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }

    // Smaller rubble pile
    var mound3Pos = { x: 0, y: 0, z: 45 };
    var moundBase3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(15, 6, 15), Materials.rustBrown));
    moundBase3.position.set(mound3Pos.x, 3, mound3Pos.z);

    for (var k = 0; k < 20; k++) {
      var rubble3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), Materials.concreteGray));
      rubble3.position.set(
        mound3Pos.x + Math.random() * 12 - 6,
        mound3Pos.y + Math.random() * 15 + 2,
        mound3Pos.z + Math.random() * 12 - 6
      );
      rubble3.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }
  }

  function createCrackedStreetGrid() {
    // Main road sections with cracks
    var roadGeo = new THREE.BoxGeometry(12, 0.8, 35);

    var road1 = addToScene(new THREE.Mesh(roadGeo, Materials.concreteGray));
    road1.position.set(-15, 0.4, 0);

    var road2 = addToScene(new THREE.Mesh(roadGeo, Materials.concreteGray));
    road2.position.set(15, 0.4, 0);

    var road3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(35, 0.8, 12), Materials.concreteGray));
    road3.position.set(0, 0.4, -15);

    var road4 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(35, 0.8, 12), Materials.concreteGray));
    road4.position.set(0, 0.4, 15);

    // Large crack gaps (BoxGeometry gaps)
    var crackGap1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 8), Materials.ashBlack));
    crackGap1.position.set(-15, 0.6, 15);

    var crackGap2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 8), Materials.ashBlack));
    crackGap2.position.set(15, 0.6, -20);

    var crackGap3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.5), Materials.ashBlack));
    crackGap3.position.set(-20, 0.6, 10);

    var crackGap4 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 1.5), Materials.ashBlack));
    crackGap4.position.set(25, 0.6, -10);

    // Road surface details - potholes and debris
    for (var i = 0; i < 8; i++) {
      var pothole = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), Materials.ashBlack));
      pothole.position.set(
        (Math.random() * 30 - 15),
        0.25,
        (Math.random() * 40 - 20)
      );
    }
  }

  function createDestroyedVehicles() {
    // Overturned car 1
    var car1Pos = { x: -25, y: 0, z: 20 };
    var carGeo = new THREE.BoxGeometry(2, 1.5, 4);
    var car1 = addToScene(new THREE.Mesh(carGeo, Materials.rustBrown));
    car1.position.set(car1Pos.x, 1, car1Pos.z);
    car1.rotation.z = Math.PI / 3;
    car1.rotation.x = 0.2;

    // Car wheels (as BoxGeometry cylinders approximation)
    var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8);
    var wheel1 = addToScene(new THREE.Mesh(wheelGeo, Materials.ashBlack));
    wheel1.position.set(car1Pos.x - 1.2, 0.6, car1Pos.z - 1.5);

    var wheel2 = addToScene(new THREE.Mesh(wheelGeo, Materials.ashBlack));
    wheel2.position.set(car1Pos.x + 1.2, 0.6, car1Pos.z - 1.5);

    var wheel3 = addToScene(new THREE.Mesh(wheelGeo, Materials.ashBlack));
    wheel3.position.set(car1Pos.x - 1.2, 0.6, car1Pos.z + 1.5);

    var wheel4 = addToScene(new THREE.Mesh(wheelGeo, Materials.ashBlack));
    wheel4.position.set(car1Pos.x + 1.2, 0.6, car1Pos.z + 1.5);

    // Burned-out truck
    var truckPos = { x: 30, y: 0, z: -15 };
    var truckGeo = new THREE.BoxGeometry(3, 2, 6);
    var truck = addToScene(new THREE.Mesh(truckGeo, Materials.ashBlack));
    truck.position.set(truckPos.x, 1.2, truckPos.z);
    truck.rotation.z = -0.4;
    truck.rotation.y = 0.3;

    // Truck cabin
    var cabinGeo = new THREE.BoxGeometry(2.5, 2, 2);
    var cabin = addToScene(new THREE.Mesh(cabinGeo, Materials.rustBrown));
    cabin.position.set(truckPos.x + 1.5, 1.5, truckPos.z - 2);
    cabin.rotation.z = -0.4;

    // Crushed car under rubble
    var crushedPos = { x: -45, y: 0, z: 5 };
    var crushedCar = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3.5), Materials.ashBlack));
    crushedCar.position.set(crushedPos.x, 0.5, crushedPos.z);
    crushedCar.rotation.z = Math.PI / 2.5;

    // Heavy rubble on crushed car
    var heavyRubble = addToScene(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), Materials.concreteGray));
    heavyRubble.position.set(crushedPos.x, 2.5, crushedPos.z);
    heavyRubble.rotation.z = 0.3;
  }

  function createCollapsedHighway() {
    var ovPos = { x: -20, y: 0, z: -40 };

    // Main overpass deck sections - fallen at angles
    var deckGeo = new THREE.BoxGeometry(25, 1.5, 4);
    var deck1 = addToScene(new THREE.Mesh(deckGeo, Materials.concreteGray));
    deck1.position.set(ovPos.x, 10, ovPos.z);
    deck1.rotation.z = 0.4;
    deck1.rotation.y = 0.1;

    var deck2 = addToScene(new THREE.Mesh(deckGeo, Materials.concreteGray));
    deck2.position.set(ovPos.x - 5, 5, ovPos.z + 8);
    deck2.rotation.z = -0.3;
    deck2.rotation.y = -0.2;

    var deck3 = addToScene(new THREE.Mesh(deckGeo, Materials.ashBlack));
    deck3.position.set(ovPos.x + 3, 3, ovPos.z - 8);
    deck3.rotation.z = 0.5;

    // Support pillars - some broken
    var pillarGeo = new THREE.BoxGeometry(2, 15, 2);
    var pillar1 = addToScene(new THREE.Mesh(pillarGeo, Materials.concreteGray));
    pillar1.position.set(ovPos.x - 10, 7.5, ovPos.z);

    var pillar2 = addToScene(new THREE.Mesh(pillarGeo, Materials.concreteGray));
    pillar2.position.set(ovPos.x + 10, 7.5, ovPos.z);

    // Broken pillar segment
    var brokenPillar = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2.5, 8, 2.5), Materials.rustBrown));
    brokenPillar.position.set(ovPos.x, 4, ovPos.z - 6);
    brokenPillar.rotation.z = 0.6;

    // Concrete debris from collapsed sections
    for (var i = 0; i < 15; i++) {
      var debrisPiece = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), Materials.concreteGray));
      debrisPiece.position.set(
        ovPos.x + Math.random() * 20 - 10,
        Math.random() * 12 + 2,
        ovPos.z + Math.random() * 15 - 7.5
      );
      debrisPiece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }
  }

  function createWaterFlooding() {
    // Large water crater in main depression
    var craterPos = { x: 35, y: 0, z: -50 };
    var waterPoolGeo = new THREE.BoxGeometry(20, 2, 20);
    var waterPool = addToScene(new THREE.Mesh(waterPoolGeo, Materials.darkWater));
    waterPool.position.set(craterPos.x, 1, craterPos.z);

    // Crater rim/edges
    var rimGeo = new THREE.BoxGeometry(22, 1, 1);
    var rim1 = addToScene(new THREE.Mesh(rimGeo, Materials.ashBlack));
    rim1.position.set(craterPos.x, 2.2, craterPos.z - 10);

    var rim2 = addToScene(new THREE.Mesh(rimGeo, Materials.ashBlack));
    rim2.position.set(craterPos.x, 2.2, craterPos.z + 10);

    var rim3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 20), Materials.ashBlack));
    rim3.position.set(craterPos.x - 10, 2.2, craterPos.z);

    var rim4 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 20), Materials.ashBlack));
    rim4.position.set(craterPos.x + 10, 2.2, craterPos.z);

    // Smaller water pools scattered
    var pool2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 6), Materials.darkWater));
    pool2.position.set(-10, 0.25, -25);

    var pool3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), Materials.darkWater));
    pool3.position.set(20, 0.3, 25);
  }

  function createGraffitiWalls() {
    // Standing wall 1 with graffiti
    var wall1Pos = { x: 10, y: 0, z: -60 };
    var wallGeo = new THREE.BoxGeometry(15, 8, 0.8);
    var wall1 = addToScene(new THREE.Mesh(wallGeo, Materials.concreteGray));
    wall1.position.set(wall1Pos.x, 4, wall1Pos.z);

    // Graffiti patches
    var graffPatch1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.9), Materials.graffitiBright));
    graffPatch1.position.set(wall1Pos.x - 3, 4, wall1Pos.z + 0.5);

    var graffPatch2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.9), Materials.warningRed));
    graffPatch2.position.set(wall1Pos.x + 4, 5.5, wall1Pos.z + 0.5);

    var graffPatch3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.9), Materials.grassGreen));
    graffPatch3.position.set(wall1Pos.x, 2, wall1Pos.z + 0.5);

    // Standing wall 2
    var wall2Pos = { x: -60, y: 0, z: 30 };
    var wall2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(12, 10, 0.8), Materials.ashBlack));
    wall2.position.set(wall2Pos.x, 5, wall2Pos.z);

    var graffPatch4 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.9), Materials.graffitiBright));
    graffPatch4.position.set(wall2Pos.x + 1, 5, wall2Pos.z + 0.5);

    // Leaning wall
    var wall3Pos = { x: 50, y: 0, z: -30 };
    var wall3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(10, 7, 0.8), Materials.concreteGray));
    wall3.position.set(wall3Pos.x, 3.5, wall3Pos.z);
    wall3.rotation.z = 0.25;

    var graffPatch5 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.9), Materials.warningRed));
    graffPatch5.position.set(wall3Pos.x + 1, 3.5, wall3Pos.z + 0.5);
  }

  function createPropagandaPosters() {
    // Poster on wall 1
    var poster1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.2), Materials.metalGray));
    poster1.position.set(10, 5, -59);

    // Poster on wall 2
    var poster2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), Materials.metalGray));
    poster2.position.set(-60, 7, 29);

    // Poster on rubble
    var poster3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.8, 0.2), Materials.metalGray));
    poster3.position.set(-40, 12, 10);
    poster3.rotation.z = 0.3;

    // Warning sign
    var sign1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.2), Materials.warningRed));
    sign1.position.set(55, 3, 20);
  }

  function createSurvivorCamp() {
    var campPos = { x: -35, y: 0, z: -65 };

    // Improvised shelter - BoxGeometry frame
    var roofGeo = new THREE.BoxGeometry(8, 0.5, 6);
    var roof = addToScene(new THREE.Mesh(roofGeo, Materials.metalGray));
    roof.position.set(campPos.x, 3, campPos.z);
    roof.rotation.z = 0.15;

    var wallLeft = addToScene(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 6), Materials.metalGray));
    wallLeft.position.set(campPos.x - 4, 1.5, campPos.z);

    var wallRight = addToScene(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 6), Materials.metalGray));
    wallRight.position.set(campPos.x + 4, 1.5, campPos.z);

    var backWall = addToScene(new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.5), Materials.metalGray));
    backWall.position.set(campPos.x, 1.5, campPos.z - 3);

    // Camp fire - central point
    var fireGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var fire = addToScene(new THREE.Mesh(fireGeo, Materials.fireOrange));
    fire.position.set(campPos.x, 0.8, campPos.z);
    animatedObjects.push({
      obj: fire,
      type: 'fire',
      originalScale: new THREE.Vector3(1, 1, 1)
    });

    // Fire glow
    var fireGlowGeo = new THREE.SphereGeometry(1.2, 8, 8);
    var fireGlow = addToScene(new THREE.Mesh(fireGlowGeo, new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff4500,
      transparent: true,
      opacity: 0.3
    })));
    fireGlow.position.set(campPos.x, 0.8, campPos.z);
    animatedObjects.push({
      obj: fireGlow,
      type: 'fireGlow',
      originalOpacity: 0.3
    });

    // Barrels around camp
    var barrel1 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), Materials.rustBrown));
    barrel1.position.set(campPos.x - 2, 0.5, campPos.z + 2);

    var barrel2 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 8), Materials.rustBrown));
    barrel2.position.set(campPos.x + 2, 0.5, campPos.z + 2);

    // Tent-like structure
    var tentGeo = new THREE.ConeGeometry(1.5, 2.5, 8);
    var tent = addToScene(new THREE.Mesh(tentGeo, Materials.grassGreen));
    tent.position.set(campPos.x - 3, 1.25, campPos.z - 3);

    // Supply boxes
    var box1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), Materials.rustBrown));
    box1.position.set(campPos.x + 1, 0.5, campPos.z - 2.5);

    var box2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), Materials.concreteGray));
    box2.position.set(campPos.x + 3, 0.4, campPos.z - 3);
  }

  function createBurnedTrees() {
    // Burned tree 1
    var tree1Pos = { x: 45, y: 0, z: 10 };
    var trunk1 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 8, 8), Materials.ashBlack));
    trunk1.position.set(tree1Pos.x, 4, tree1Pos.z);

    // Broken top
    var brokenTop1 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 3, 8), Materials.ashBlack));
    brokenTop1.position.set(tree1Pos.x + 1.5, 7.5, tree1Pos.z - 0.5);
    brokenTop1.rotation.z = 0.8;

    // Burned tree 2
    var tree2Pos = { x: -55, y: 0, z: 50 };
    var trunk2 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 6, 8), Materials.ashBlack));
    trunk2.position.set(tree2Pos.x, 3, tree2Pos.z);

    var brokenTop2 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 2.5, 8), Materials.ashBlack));
    brokenTop2.position.set(tree2Pos.x - 1.2, 5, tree2Pos.z + 0.8);
    brokenTop2.rotation.z = -0.6;

    // Burned tree 3 - completely fallen
    var tree3Pos = { x: 0, y: 0, z: 60 };
    var fallenTrunk = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 7, 8), Materials.ashBlack));
    fallenTrunk.position.set(tree3Pos.x, 0.4, tree3Pos.z);
    fallenTrunk.rotation.z = Math.PI / 2;

    // Burned tree 4
    var tree4Pos = { x: 30, y: 0, z: 40 };
    var trunk4 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 7.5, 8), Materials.ashBlack));
    trunk4.position.set(tree4Pos.x, 3.75, tree4Pos.z);
    trunk4.rotation.z = 0.2;

    var brokenTop4 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 2, 8), Materials.ashBlack));
    brokenTop4.position.set(tree4Pos.x + 1, 6.5, tree4Pos.z - 0.3);
    brokenTop4.rotation.z = 0.5;
  }

  function createFireHydrants() {
    // Main hydrant with geyser
    var hydrantPos = { x: 25, y: 0, z: 35 };
    var hydrantBody = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8), Materials.rustBrown));
    hydrantBody.position.set(hydrantPos.x, 0.6, hydrantPos.z);

    var hydrantNozzle = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), Materials.metalGray));
    hydrantNozzle.position.set(hydrantPos.x, 1.3, hydrantPos.z);
    hydrantNozzle.rotation.z = Math.PI / 3;

    // Water spray - multiple spheres for geyser effect
    var waterSpray1 = addToScene(new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), Materials.darkWater));
    waterSpray1.position.set(hydrantPos.x, 2, hydrantPos.z);
    waterSpray1.material.transparent = true;
    waterSpray1.material.opacity = 0.7;
    animatedObjects.push({
      obj: waterSpray1,
      type: 'geyser',
      originalY: 2,
      amplitude: 2
    });

    var waterSpray2 = addToScene(new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), Materials.darkWater));
    waterSpray2.position.set(hydrantPos.x + 0.5, 3, hydrantPos.z);
    waterSpray2.material.transparent = true;
    waterSpray2.material.opacity = 0.6;
    animatedObjects.push({
      obj: waterSpray2,
      type: 'geyser',
      originalY: 3,
      amplitude: 2.5
    });

    // Second hydrant
    var hydrant2Pos = { x: -45, y: 0, z: -30 };
    var hydrant2Body = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.2, 8), Materials.metalGray));
    hydrant2Body.position.set(hydrant2Pos.x, 0.6, hydrant2Pos.z);

    var hydrant2Nozzle = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 6), Materials.metalGray));
    hydrant2Nozzle.position.set(hydrant2Pos.x, 1.3, hydrant2Pos.z);
    hydrant2Nozzle.rotation.z = -Math.PI / 4;

    var water2 = addToScene(new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), Materials.darkWater));
    water2.position.set(hydrant2Pos.x - 0.3, 2.5, hydrant2Pos.z);
    water2.material.transparent = true;
    water2.material.opacity = 0.6;
    animatedObjects.push({
      obj: water2,
      type: 'geyser',
      originalY: 2.5,
      amplitude: 1.8
    });
  }

  function createWireAndDebris() {
    // Tangled wire using LineSegments
    var wirePoints = [];

    // Main wire line 1
    wirePoints.push(new THREE.Vector3(-40, 8, 10));
    wirePoints.push(new THREE.Vector3(-30, 10, 15));
    wirePoints.push(new THREE.Vector3(-20, 9, 20));
    wirePoints.push(new THREE.Vector3(-10, 11, 18));

    var wireGeo1 = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireLineMat = new THREE.LineBasicMaterial({ color: 0x444444 });
    var wireLine1 = new THREE.LineSegments(wireGeo1, wireLineMat);
    addToScene(wireLine1);

    // Wire line 2
    var wirePoints2 = [];
    wirePoints2.push(new THREE.Vector3(20, 6, -30));
    wirePoints2.push(new THREE.Vector3(30, 8, -25));
    wirePoints2.push(new THREE.Vector3(40, 7, -20));
    wirePoints2.push(new THREE.Vector3(45, 9, -15));

    var wireGeo2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
    var wireLine2 = new THREE.LineSegments(wireGeo2, wireLineMat);
    addToScene(wireLine2);

    // Wire line 3 across rubble
    var wirePoints3 = [];
    wirePoints3.push(new THREE.Vector3(-50, 15, 5));
    wirePoints3.push(new THREE.Vector3(-40, 12, 8));
    wirePoints3.push(new THREE.Vector3(-30, 14, 6));
    wirePoints3.push(new THREE.Vector3(-20, 11, 9));

    var wireGeo3 = new THREE.BufferGeometry().setFromPoints(wirePoints3);
    var wireLine3 = new THREE.LineSegments(wireGeo3, wireLineMat);
    addToScene(wireLine3);

    // Scattered debris pieces
    for (var i = 0; i < 12; i++) {
      var debrisPiece = addToScene(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), Materials.metalGray));
      debrisPiece.position.set(
        Math.random() * 80 - 40,
        Math.random() * 20 + 3,
        Math.random() * 80 - 40
      );
      debrisPiece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }
  }

  function createUnexplodedOrdnance() {
    // Warning markers with red flags and stakes
    var marker1Pos = { x: 50, y: 0, z: 50 };
    var stake1 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), Materials.metalGray));
    stake1.position.set(marker1Pos.x, 0.75, marker1Pos.z);

    var flag1 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), Materials.warningRed));
    flag1.position.set(marker1Pos.x + 0.6, 1.3, marker1Pos.z);

    // Marker 2
    var marker2Pos = { x: -40, y: 0, z: 45 };
    var stake2 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), Materials.metalGray));
    stake2.position.set(marker2Pos.x, 0.75, marker2Pos.z);

    var flag2 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), Materials.warningRed));
    flag2.position.set(marker2Pos.x + 0.6, 1.3, marker2Pos.z);

    // Marker 3
    var marker3Pos = { x: 0, y: 0, z: -70 };
    var stake3 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), Materials.metalGray));
    stake3.position.set(marker3Pos.x, 0.75, marker3Pos.z);

    var flag3 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), Materials.warningRed));
    flag3.position.set(marker3Pos.x + 0.6, 1.3, marker3Pos.z);

    // Marker 4
    var marker4Pos = { x: -60, y: 0, z: -20 };
    var stake4 = addToScene(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6), Materials.metalGray));
    stake4.position.set(marker4Pos.x, 0.75, marker4Pos.z);

    var flag4 = addToScene(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), Materials.warningRed));
    flag4.position.set(marker4Pos.x + 0.6, 1.3, marker4Pos.z);
  }

  function createDustParticles() {
    // Drifting dust particle systems
    for (var i = 0; i < 50; i++) {
      var dustParticle = addToScene(new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), Materials.dustWhite));
      dustParticle.position.set(
        Math.random() * 80 - 40,
        Math.random() * 40 + 5,
        Math.random() * 80 - 40
      );

      particleSystems.push({
        obj: dustParticle,
        startPos: dustParticle.position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.03 - 0.015,
          (Math.random() - 0.5) * 0.1
        ),
        lifetime: Math.random() * 8 + 12,
        elapsed: 0
      });
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];
    particleSystems = [];

    initMaterials();

    // Create all environment elements
    createSkeletalBuildings();
    createRubbleMountains();
    createCrackedStreetGrid();
    createDestroyedVehicles();
    createCollapsedHighway();
    createWaterFlooding();
    createGraffitiWalls();
    createPropagandaPosters();
    createSurvivorCamp();
    createBurnedTrees();
    createFireHydrants();
    createWireAndDebris();
    createUnexplodedOrdnance();
    createDustParticles();

    return objects.length;
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    // Animate fire - flickering
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];

      if (anim.type === 'fire') {
        var flicker = Math.sin(time * 3) * 0.15 + 0.9;
        anim.obj.scale.set(flicker, flicker, flicker);
      }

      if (anim.type === 'fireGlow') {
        var glowFlicker = Math.sin(time * 2.5) * 0.2 + anim.originalOpacity;
        anim.obj.material.opacity = glowFlicker;
      }

      if (anim.type === 'geyser') {
        var pulse = Math.sin(time * 2) * anim.amplitude;
        anim.obj.position.y = anim.originalY + pulse;
        var scalePulse = 0.8 + Math.sin(time * 2.5) * 0.3;
        anim.obj.scale.set(scalePulse, scalePulse, scalePulse);
      }
    }

    // Update dust particles
    for (var j = 0; j < particleSystems.length; j++) {
      var particle = particleSystems[j];
      particle.elapsed += delta;

      particle.obj.position.add(particle.velocity);

      if (particle.elapsed > particle.lifetime) {
        particle.obj.position.copy(particle.startPos);
        particle.elapsed = 0;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    particleSystems = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
