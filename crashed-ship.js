window.CrashedShip = (function() {
  'use strict';

  var scene;
  var camera;
  var shipObjects = [];
  var time = 0;
  var shipGroup;
  var oilSlickGroup;
  var campFireGroup;

  var materials = {
    rustRed: new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 30 }),
    rustOrange: new THREE.MeshPhongMaterial({ color: 0xCD7F32, shininess: 25 }),
    containerRed: new THREE.MeshPhongMaterial({ color: 0xCC0000, shininess: 40 }),
    containerBlue: new THREE.MeshPhongMaterial({ color: 0x0066CC, shininess: 40 }),
    containerYellow: new THREE.MeshPhongMaterial({ color: 0xFFCC00, shininess: 35 }),
    containerGreen: new THREE.MeshPhongMaterial({ color: 0x00AA00, shininess: 40 }),
    containerOrange: new THREE.MeshPhongMaterial({ color: 0xFF6600, shininess: 40 }),
    rockGray: new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 20 }),
    sandBrown: new THREE.MeshPhongMaterial({ color: 0xB8A579, shininess: 10 }),
    waterDark: new THREE.MeshPhongMaterial({ color: 0x001a4d, shininess: 60 }),
    metalGray: new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 50 }),
    blackMetal: new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 40 }),
    fireOrange: new THREE.MeshPhongMaterial({ color: 0xFF8800, emissive: 0xFF4400 }),
    oilBlack: new THREE.MeshPhongMaterial({ color: 0x0a0a0a, shininess: 80 })
  };

  function createShipHull() {
    shipGroup = new THREE.Group();

    // Main hull section 1 - front part, tilted up 25 degrees
    var hull1Geo = new THREE.BoxGeometry(68, 20, 18);
    var hull1 = new THREE.Mesh(hull1Geo, materials.rustRed);
    hull1.position.set(-5, 8, 0);
    hull1.rotation.z = 0.44; // ~25 degrees
    shipGroup.add(hull1);
    shipObjects.push(hull1);

    // Main hull section 2 - rear part, tilted down 20 degrees and lower
    var hull2Geo = new THREE.BoxGeometry(65, 18, 16);
    var hull2 = new THREE.Mesh(hull2Geo, materials.rustOrange);
    hull2.position.set(15, -6, 1);
    hull2.rotation.z = -0.35; // ~-20 degrees
    hull2.rotation.x = 0.1;
    shipGroup.add(hull2);
    shipObjects.push(hull2);

    // Hull gap - split area showing damage
    var hullEdge1Geo = new THREE.BoxGeometry(3, 25, 20);
    var hullEdge1 = new THREE.Mesh(hullEdge1Geo, materials.blackMetal);
    hullEdge1.position.set(10, 0, 0);
    shipGroup.add(hullEdge1);
    shipObjects.push(hullEdge1);

    // Exposed interior ribbing - BoxGeometry support beams
    for (var i = 0; i < 8; i++) {
      var ribGeo = new THREE.BoxGeometry(2, 20, 1.5);
      var rib = new THREE.Mesh(ribGeo, materials.metalGray);
      rib.position.set(-25 + i * 12, 0, -7);
      shipGroup.add(rib);
      shipObjects.push(rib);
    }

    return shipGroup;
  }

  function createCargoHolds() {
    // Exposed cargo hold 1 - open rectangular compartment
    var hold1Geo = new THREE.BoxGeometry(20, 16, 14);
    var hold1 = new THREE.Mesh(hold1Geo, materials.blackMetal);
    hold1.position.set(-15, 0, 0);
    shipGroup.add(hold1);
    shipObjects.push(hold1);

    // Exposed cargo hold 2
    var hold2Geo = new THREE.BoxGeometry(18, 14, 12);
    var hold2 = new THREE.Mesh(hold2Geo, materials.metalGray);
    hold2.position.set(5, -5, 2);
    shipGroup.add(hold2);
    shipObjects.push(hold2);

    // Exposed cargo hold 3
    var hold3Geo = new THREE.BoxGeometry(16, 12, 10);
    var hold3 = new THREE.Mesh(hold3Geo, materials.blackMetal);
    hold3.position.set(25, -3, 1);
    shipGroup.add(hold3);
    shipObjects.push(hold3);

    // Spilled cargo inside hold 1
    for (var i = 0; i < 6; i++) {
      var cargoGeo = new THREE.BoxGeometry(3, 3, 3);
      var cargo = new THREE.Mesh(cargoGeo, materials.containerRed);
      cargo.position.set(-20 + i * 3, -8 + Math.sin(i) * 2, -2);
      cargo.rotation.y = Math.random() * Math.PI;
      shipGroup.add(cargo);
      shipObjects.push(cargo);
    }

    // Spilled cargo inside hold 2
    for (var i = 0; i < 5; i++) {
      var cargoGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
      var cargo = new THREE.Mesh(cargoGeo, materials.containerBlue);
      cargo.position.set(0 + i * 3, -12 + Math.random() * 3, 1);
      cargo.rotation.x = Math.random() * 0.3;
      shipGroup.add(cargo);
      shipObjects.push(cargo);
    }
  }

  function createBridge() {
    // Bridge/superstructure - command center area
    var bridgeMainGeo = new THREE.BoxGeometry(16, 12, 12);
    var bridgeMain = new THREE.Mesh(bridgeMainGeo, materials.metalGray);
    bridgeMain.position.set(-25, 15, 1);
    bridgeMain.rotation.z = 0.3; // Tilted
    shipGroup.add(bridgeMain);
    shipObjects.push(bridgeMain);

    // Bridge wing 1
    var bridgeWing1Geo = new THREE.BoxGeometry(8, 4, 6);
    var bridgeWing1 = new THREE.Mesh(bridgeWing1Geo, materials.rustRed);
    bridgeWing1.position.set(-30, 18, -5);
    bridgeWing1.rotation.z = 0.2;
    shipGroup.add(bridgeWing1);
    shipObjects.push(bridgeWing1);

    // Bridge wing 2
    var bridgeWing2Geo = new THREE.BoxGeometry(8, 4, 6);
    var bridgeWing2 = new THREE.Mesh(bridgeWing2Geo, materials.rustRed);
    bridgeWing2.position.set(-30, 18, 7);
    bridgeWing2.rotation.z = 0.15;
    shipGroup.add(bridgeWing2);
    shipObjects.push(bridgeWing2);

    // Cracked bridge sections
    var crackGeo = new THREE.BoxGeometry(3, 2, 2);
    var crack1 = new THREE.Mesh(crackGeo, materials.blackMetal);
    crack1.position.set(-22, 20, 0);
    crack1.rotation.z = 0.5;
    shipGroup.add(crack1);
    shipObjects.push(crack1);

    var crack2 = new THREE.Mesh(crackGeo, materials.blackMetal);
    crack2.position.set(-28, 14, 2);
    crack2.rotation.z = -0.4;
    shipGroup.add(crack2);
    shipObjects.push(crack2);
  }

  function createCargoContainers() {
    var containerColors = [
      materials.containerRed, materials.containerBlue,
      materials.containerYellow, materials.containerGreen,
      materials.containerOrange, materials.containerRed
    ];

    var positions = [
      { x: -40, y: -5, z: 8 }, { x: -35, y: -8, z: 12 },
      { x: -38, y: -10, z: 15 }, { x: -32, y: -6, z: 10 },
      { x: -28, y: -4, z: 18 }, { x: -45, y: -9, z: 5 },
      { x: 10, y: -8, z: -12 }, { x: 15, y: -10, z: -15 },
      { x: 8, y: -7, z: -8 }, { x: 18, y: -12, z: -18 },
      { x: 12, y: -5, z: -5 }, { x: 20, y: -14, z: -20 },
      { x: 35, y: -8, z: 8 }, { x: 40, y: -10, z: 12 },
      { x: 38, y: -6, z: 5 }, { x: 42, y: -12, z: 15 },
      { x: 45, y: -15, z: 10 }, { x: 50, y: -18, z: 18 },
      { x: -50, y: -12, z: -8 }, { x: -48, y: -14, z: 12 },
      { x: -42, y: -8, z: -5 }, { x: -38, y: -5, z: 3 },
      { x: 25, y: -11, z: 14 }, { x: 28, y: -13, z: 20 },
      { x: 30, y: -10, z: 8 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var containerGeo = new THREE.BoxGeometry(6, 8, 6);
      var containerMat = containerColors[i % containerColors.length];
      var container = new THREE.Mesh(containerGeo, containerMat);
      container.position.copy(positions[i]);
      container.rotation.y = Math.random() * Math.PI;
      container.rotation.x = (Math.random() - 0.5) * 0.3;
      container.rotation.z = (Math.random() - 0.5) * 0.2;
      shipGroup.add(container);
      shipObjects.push(container);
    }
  }

  function createRocks() {
    var rockPositions = [
      { x: 0, y: -22, z: 0, sx: 25, sy: 15, sz: 20 },
      { x: 20, y: -25, z: -15, sx: 20, sy: 12, sz: 18 },
      { x: -15, y: -24, z: 15, sx: 18, sy: 14, sz: 16 },
      { x: 35, y: -23, z: 8, sx: 22, sy: 13, sz: 19 },
      { x: -35, y: -25, z: -10, sx: 19, sy: 11, sz: 17 },
      { x: 50, y: -26, z: 0, sx: 17, sy: 10, sz: 15 },
      { x: -50, y: -26, z: 5, sx: 16, sy: 9, sz: 14 },
      { x: 5, y: -20, z: -25, sx: 21, sy: 12, sz: 18 },
      { x: -25, y: -22, z: -18, sx: 19, sy: 11, sz: 16 }
    ];

    for (var i = 0; i < rockPositions.length; i++) {
      var rpos = rockPositions[i];
      var rockGeo = new THREE.BoxGeometry(rpos.sx, rpos.sy, rpos.sz);
      var rock = new THREE.Mesh(rockGeo, materials.rockGray);
      rock.position.set(rpos.x, rpos.y, rpos.z);
      rock.rotation.x = (Math.random() - 0.5) * 0.4;
      rock.rotation.y = Math.random() * Math.PI;
      rock.rotation.z = (Math.random() - 0.5) * 0.3;
      shipGroup.add(rock);
      shipObjects.push(rock);
    }

    // Smaller rock formations for detail
    for (var i = 0; i < 12; i++) {
      var smallRockGeo = new THREE.BoxGeometry(6, 5, 5);
      var smallRock = new THREE.Mesh(smallRockGeo, materials.rockGray);
      smallRock.position.set(
        (Math.random() - 0.5) * 100,
        -28 + Math.random() * 2,
        (Math.random() - 0.5) * 60
      );
      smallRock.rotation.x = Math.random() * Math.PI;
      smallRock.rotation.y = Math.random() * Math.PI;
      smallRock.rotation.z = Math.random() * Math.PI;
      shipGroup.add(smallRock);
      shipObjects.push(smallRock);
    }
  }

  function createBeach() {
    // Sand/beach terrain
    var beachGeo = new THREE.BoxGeometry(180, 6, 80);
    var beach = new THREE.Mesh(beachGeo, materials.sandBrown);
    beach.position.set(0, -32, 0);
    beach.receiveShadow = true;
    shipGroup.add(beach);
    shipObjects.push(beach);

    // Sandy approach sections
    var approach1Geo = new THREE.BoxGeometry(40, 4, 40);
    var approach1 = new THREE.Mesh(approach1Geo, materials.sandBrown);
    approach1.position.set(-50, -30, -35);
    approach1.rotation.x = 0.1;
    shipGroup.add(approach1);
    shipObjects.push(approach1);

    var approach2Geo = new THREE.BoxGeometry(40, 4, 40);
    var approach2 = new THREE.Mesh(approach2Geo, materials.sandBrown);
    approach2.position.set(50, -30, 35);
    approach2.rotation.x = -0.08;
    shipGroup.add(approach2);
    shipObjects.push(approach2);
  }

  function createFloodedCompartments() {
    // Water in lower hold sections
    var waterGeo = new THREE.BoxGeometry(16, 8, 10);
    var water1 = new THREE.Mesh(waterGeo, materials.waterDark);
    water1.position.set(-15, -12, 0);
    water1.material.transparent = true;
    water1.material.opacity = 0.7;
    shipGroup.add(water1);
    shipObjects.push(water1);

    var water2Geo = new THREE.BoxGeometry(14, 6, 8);
    var water2 = new THREE.Mesh(water2Geo, materials.waterDark);
    water2.position.set(5, -15, 1);
    water2.material.transparent = true;
    water2.material.opacity = 0.65;
    shipGroup.add(water2);
    shipObjects.push(water2);

    var water3Geo = new THREE.BoxGeometry(12, 5, 7);
    var water3 = new THREE.Mesh(water3Geo, materials.waterDark);
    water3.position.set(22, -14, -2);
    water3.material.transparent = true;
    water3.material.opacity = 0.6;
    shipGroup.add(water3);
    shipObjects.push(water3);
  }

  function createCraneArm() {
    // Ship's fallen crane arm - structural beam across deck
    var armBaseGeo = new THREE.BoxGeometry(4, 4, 4);
    var armBase = new THREE.Mesh(armBaseGeo, materials.blackMetal);
    armBase.position.set(-20, 12, -8);
    shipGroup.add(armBase);
    shipObjects.push(armBase);

    // Long boom section
    var boomGeo = new THREE.BoxGeometry(50, 2, 2);
    var boom = new THREE.Mesh(boomGeo, materials.metalGray);
    boom.position.set(0, 15, -12);
    boom.rotation.z = 0.25;
    boom.rotation.x = 0.1;
    shipGroup.add(boom);
    shipObjects.push(boom);

    // Crane hook housing
    var hookHousingGeo = new THREE.BoxGeometry(3, 4, 3);
    var hookHousing = new THREE.Mesh(hookHousingGeo, materials.blackMetal);
    hookHousing.position.set(25, 14, -11);
    shipGroup.add(hookHousing);
    shipObjects.push(hookHousing);

    // Boom reinforcement struts
    for (var i = 0; i < 5; i++) {
      var strutGeo = new THREE.BoxGeometry(1, 3, 1);
      var strut = new THREE.Mesh(strutGeo, materials.metalGray);
      strut.position.set(-10 + i * 10, 13, -12);
      shipGroup.add(strut);
      shipObjects.push(strut);
    }
  }

  function createLifeboatDavits() {
    // Lifeboat davit frame 1
    var davit1FrameGeo = new THREE.BoxGeometry(8, 10, 2);
    var davit1Frame = new THREE.Mesh(davit1FrameGeo, materials.metalGray);
    davit1Frame.position.set(-35, 12, -10);
    davit1Frame.rotation.z = 0.3;
    shipGroup.add(davit1Frame);
    shipObjects.push(davit1Frame);

    // Davit 1 arm - CylinderGeometry
    var davit1ArmGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    var davit1Arm = new THREE.Mesh(davit1ArmGeo, materials.metalGray);
    davit1Arm.position.set(-35, 8, -10);
    davit1Arm.rotation.z = 1.2; // Fallen
    shipGroup.add(davit1Arm);
    shipObjects.push(davit1Arm);

    // Lifeboat davit frame 2
    var davit2FrameGeo = new THREE.BoxGeometry(8, 10, 2);
    var davit2Frame = new THREE.Mesh(davit2FrameGeo, materials.metalGray);
    davit2Frame.position.set(-35, 12, 10);
    davit2Frame.rotation.z = -0.25;
    shipGroup.add(davit2Frame);
    shipObjects.push(davit2Frame);

    // Davit 2 arm - CylinderGeometry
    var davit2ArmGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
    var davit2Arm = new THREE.Mesh(davit2ArmGeo, materials.metalGray);
    davit2Arm.position.set(-35, 8, 10);
    davit2Arm.rotation.z = 1.0;
    shipGroup.add(davit2Arm);
    shipObjects.push(davit2Arm);

    // Lower hook blocks
    var hookGeo = new THREE.BoxGeometry(2, 3, 2);
    var hook1 = new THREE.Mesh(hookGeo, materials.blackMetal);
    hook1.position.set(-40, 0, -10);
    shipGroup.add(hook1);
    shipObjects.push(hook1);

    var hook2 = new THREE.Mesh(hookGeo, materials.blackMetal);
    hook2.position.set(-40, 0, 10);
    shipGroup.add(hook2);
    shipObjects.push(hook2);
  }

  function createEmergencyLadders() {
    // Hull exterior emergency ladders using LineSegments
    var ladderPositions = [
      -25, -15, 0,
      -25, 5, 0,
      -20, -15, 0,
      -20, 5, 0,
      -15, -15, 0,
      -15, 5, 0
    ];

    var ladderGeo = new THREE.BufferGeometry();
    ladderGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderPositions), 3));
    var ladderLines = new THREE.LineSegments(ladderGeo, new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 }));
    shipGroup.add(ladderLines);
    shipObjects.push(ladderLines);

    // Ladder rung segments - using LineSegments
    var rungPositions = [];
    for (var i = 0; i < 6; i++) {
      var y = -15 + i * 4;
      rungPositions.push(-26, y, 0);
      rungPositions.push(-14, y, 0);
    }

    var rungGeo = new THREE.BufferGeometry();
    rungGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rungPositions), 3));
    var rungLines = new THREE.LineSegments(rungGeo, new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 }));
    shipGroup.add(rungLines);
    shipObjects.push(rungLines);

    // Additional ladder set on opposite side
    var ladderPositions2 = [
      25, -12, 0,
      25, 8, 0,
      30, -12, 0,
      30, 8, 0
    ];

    var ladderGeo2 = new THREE.BufferGeometry();
    ladderGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderPositions2), 3));
    var ladderLines2 = new THREE.LineSegments(ladderGeo2, new THREE.LineBasicMaterial({ color: 0x777777, linewidth: 2 }));
    shipGroup.add(ladderLines2);
    shipObjects.push(ladderLines2);
  }

  function createOilSlick() {
    oilSlickGroup = new THREE.Group();

    // Main oil slick patches - flat dark BoxGeometry
    var slick1Geo = new THREE.BoxGeometry(30, 0.2, 25);
    var slick1 = new THREE.Mesh(slick1Geo, materials.oilBlack);
    slick1.position.set(-10, -33.5, 5);
    oilSlickGroup.add(slick1);
    shipObjects.push(slick1);

    var slick2Geo = new THREE.BoxGeometry(25, 0.2, 20);
    var slick2 = new THREE.Mesh(slick2Geo, materials.oilBlack);
    slick2.position.set(20, -33.5, -8);
    oilSlickGroup.add(slick2);
    shipObjects.push(slick2);

    var slick3Geo = new THREE.BoxGeometry(20, 0.2, 18);
    var slick3 = new THREE.Mesh(slick3Geo, materials.oilBlack);
    slick3.position.set(-35, -33.5, -12);
    oilSlickGroup.add(slick3);
    shipObjects.push(slick3);

    var slick4Geo = new THREE.BoxGeometry(18, 0.2, 15);
    var slick4 = new THREE.Mesh(slick4Geo, materials.oilBlack);
    slick4.position.set(40, -33.5, 10);
    oilSlickGroup.add(slick4);
    shipObjects.push(slick4);

    // Smaller slick patches
    for (var i = 0; i < 6; i++) {
      var smallSlickGeo = new THREE.BoxGeometry(8, 0.15, 7);
      var smallSlick = new THREE.Mesh(smallSlickGeo, materials.oilBlack);
      smallSlick.position.set(
        (Math.random() - 0.5) * 80,
        -33.6,
        (Math.random() - 0.5) * 50
      );
      smallSlick.material.opacity = 0.8;
      oilSlickGroup.add(smallSlick);
      shipObjects.push(smallSlick);
    }

    shipGroup.add(oilSlickGroup);
  }

  function createScavengerCamp() {
    // Camp shelter - BoxGeometry structure
    var shelterFrameGeo = new THREE.BoxGeometry(12, 8, 10);
    var shelterFrame = new THREE.Mesh(shelterFrameGeo, materials.metalGray);
    shelterFrame.position.set(-45, -2, 0);
    shelterFrame.rotation.y = 0.3;
    shipGroup.add(shelterFrame);
    shipObjects.push(shelterFrame);

    // Shelter roof
    var roofGeo = new THREE.BoxGeometry(14, 1, 12);
    var roof = new THREE.Mesh(roofGeo, materials.blackMetal);
    roof.position.set(-45, 5, 0);
    roof.rotation.y = 0.3;
    shipGroup.add(roof);
    shipObjects.push(roof);

    // Support posts
    for (var i = 0; i < 4; i++) {
      var postGeo = new THREE.BoxGeometry(1, 6, 1);
      var post = new THREE.Mesh(postGeo, materials.blackMetal);
      post.position.set(-50 + (i % 2) * 10, 0, -4 + Math.floor(i / 2) * 8);
      shipGroup.add(post);
      shipObjects.push(post);
    }

    // Camp supply boxes
    for (var i = 0; i < 4; i++) {
      var boxGeo = new THREE.BoxGeometry(2, 2, 2);
      var box = new THREE.Mesh(boxGeo, materials.containerYellow);
      box.position.set(-48 + i * 2, -3, -5);
      shipGroup.add(box);
      shipObjects.push(box);
    }

    campFireGroup = new THREE.Group();
    // Fire pit - circular arrangement of rocks (BoxGeometry)
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var fireRockGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
      var fireRock = new THREE.Mesh(fireRockGeo, materials.rockGray);
      fireRock.position.set(
        -45 + Math.cos(angle) * 3,
        -2.5,
        2 + Math.sin(angle) * 3
      );
      campFireGroup.add(fireRock);
      shipObjects.push(fireRock);
    }

    // Camp fire glow sources (SphereGeometry for fire effect)
    var fireGlowGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var fireGlow = new THREE.Mesh(fireGlowGeo, materials.fireOrange);
    fireGlow.position.set(-45, -1, 2);
    fireGlow.scale.set(1, 0.5, 1);
    campFireGroup.add(fireGlow);
    shipObjects.push(fireGlow);

    shipGroup.add(campFireGroup);
  }

  function createPropeller() {
    // Propeller shaft - large CylinderGeometry
    var shaftGeo = new THREE.CylinderGeometry(2, 2, 35, 16);
    var shaft = new THREE.Mesh(shaftGeo, materials.metalGray);
    shaft.position.set(35, -20, -8);
    shaft.rotation.z = 1.57; // 90 degrees
    shipGroup.add(shaft);
    shipObjects.push(shaft);

    // Propeller hub
    var hubGeo = new THREE.SphereGeometry(3, 12, 12);
    var hub = new THREE.Mesh(hubGeo, materials.blackMetal);
    hub.position.set(35, -20, -8);
    shipGroup.add(hub);
    shipObjects.push(hub);

    // Propeller blades - BoxGeometry
    for (var i = 0; i < 4; i++) {
      var bladeGeo = new THREE.BoxGeometry(2, 12, 1);
      var blade = new THREE.Mesh(bladeGeo, materials.metalGray);
      blade.position.set(35, -20, -8);
      blade.rotation.y = (i / 4) * Math.PI * 2;
      blade.rotation.x = 0.2;
      shipGroup.add(blade);
      shipObjects.push(blade);
    }

    // Propeller guard ring - CylinderGeometry
    var guardGeo = new THREE.CylinderGeometry(8, 8, 2, 16);
    var guard = new THREE.Mesh(guardGeo, materials.metalGray);
    guard.position.set(35, -20, -8);
    guard.rotation.z = 1.57;
    shipGroup.add(guard);
    shipObjects.push(guard);

    // Shaft support bearing blocks
    for (var i = 0; i < 3; i++) {
      var bearingGeo = new THREE.BoxGeometry(5, 3, 5);
      var bearing = new THREE.Mesh(bearingGeo, materials.blackMetal);
      bearing.position.set(20 + i * 8, -22, -8);
      shipGroup.add(bearing);
      shipObjects.push(bearing);
    }
  }

  function createAdditionalStructures() {
    // Mast remnants - CylinderGeometry
    var mast1Geo = new THREE.CylinderGeometry(1, 1, 28, 12);
    var mast1 = new THREE.Mesh(mast1Geo, materials.blackMetal);
    mast1.position.set(-25, 0, 10);
    mast1.rotation.z = 0.5;
    shipGroup.add(mast1);
    shipObjects.push(mast1);

    var mast2Geo = new THREE.CylinderGeometry(0.8, 0.8, 18, 10);
    var mast2 = new THREE.Mesh(mast2Geo, materials.metalGray);
    mast2.position.set(-10, 5, -8);
    mast2.rotation.z = 0.8;
    shipGroup.add(mast2);
    shipObjects.push(mast2);

    // Ventilation stacks - CylinderGeometry
    for (var i = 0; i < 3; i++) {
      var stackGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
      var stack = new THREE.Mesh(stackGeo, materials.rustOrange);
      stack.position.set(-20 + i * 15, 8, -6);
      stack.rotation.z = (Math.random() - 0.5) * 0.3;
      shipGroup.add(stack);
      shipObjects.push(stack);
    }

    // Anchor chain sections - LineSegments
    var chainPositions = [];
    for (var i = 0; i < 8; i++) {
      chainPositions.push(-50, 5 - i * 3, -5);
      chainPositions.push(-50, 5 - (i + 1) * 3, -5);
    }
    var chainGeo = new THREE.BufferGeometry();
    chainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainPositions), 3));
    var chainLines = new THREE.LineSegments(chainGeo, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 3 }));
    shipGroup.add(chainLines);
    shipObjects.push(chainLines);

    // Deck railings - LineSegments
    var railPositions = [];
    for (var i = 0; i < 10; i++) {
      railPositions.push(-50 + i * 10, 10, 8);
      railPositions.push(-50 + i * 10, 10, -8);
    }
    var railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(railPositions), 3));
    var railLines = new THREE.LineSegments(railGeo, new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 }));
    shipGroup.add(railLines);
    shipObjects.push(railLines);

    // Additional cargo hold internal bracing
    for (var i = 0; i < 6; i++) {
      var braceGeo = new THREE.BoxGeometry(15, 1.5, 1.5);
      var brace = new THREE.Mesh(braceGeo, materials.metalGray);
      brace.position.set(0, -8 + i * 2, 0);
      brace.rotation.y = (i % 2) * 0.3;
      shipGroup.add(brace);
      shipObjects.push(brace);
    }

    // Bulkhead doors (fallen) - BoxGeometry
    for (var i = 0; i < 4; i++) {
      var doorGeo = new THREE.BoxGeometry(8, 10, 0.5);
      var door = new THREE.Mesh(doorGeo, materials.metalGray);
      door.position.set(-30 + i * 15, -5, 10);
      door.rotation.z = 0.2 + i * 0.1;
      shipGroup.add(door);
      shipObjects.push(door);
    }

    // Window frames - BoxGeometry
    for (var i = 0; i < 6; i++) {
      var windowFrameGeo = new THREE.BoxGeometry(3, 3, 0.3);
      var windowFrame = new THREE.Mesh(windowFrameGeo, materials.blackMetal);
      windowFrame.position.set(-28 + i * 4, 12 + Math.sin(i) * 2, -6);
      shipGroup.add(windowFrame);
      shipObjects.push(windowFrame);
    }
  }

  function addLighting() {
    // Ambient light for overall scene
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    shipGroup.add(ambientLight);

    // Directional light (sun)
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(30, 40, 30);
    shipGroup.add(dirLight);

    // Fire glow light
    var fireLight = new THREE.PointLight(0xFF6600, 2, 30);
    fireLight.position.set(-45, 0, 2);
    shipGroup.add(fireLight);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    shipGroup = new THREE.Group();

    createShipHull();
    createCargoHolds();
    createBridge();
    createCargoContainers();
    createRocks();
    createBeach();
    createFloodedCompartments();
    createCraneArm();
    createLifeboatDavits();
    createEmergencyLadders();
    createOilSlick();
    createScavengerCamp();
    createPropeller();
    createAdditionalStructures();
    addLighting();

    scene.add(shipGroup);

    return shipObjects.length;
  }

  function update(delta) {
    time += delta;

    // Gentle ship rocking - very subtle
    if (shipGroup) {
      var rockAmount = 0.15;
      var rockSpeed = 0.3;
      shipGroup.rotation.x = Math.sin(time * rockSpeed) * rockAmount * 0.01;
      shipGroup.rotation.z = Math.cos(time * rockSpeed * 0.7) * rockAmount * 0.008;
      shipGroup.position.y = Math.sin(time * rockSpeed * 0.5) * 0.08;
    }

    // Oil slick shimmer effect
    if (oilSlickGroup) {
      oilSlickGroup.rotation.z = Math.sin(time * 0.4) * 0.02;
      for (var i = 0; i < oilSlickGroup.children.length; i++) {
        var child = oilSlickGroup.children[i];
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = 0.75 + Math.sin(time + i) * 0.1;
        }
      }
    }

    // Camp fire flickering - using SphereGeometry light
    if (campFireGroup) {
      for (var i = 0; i < campFireGroup.children.length; i++) {
        var child = campFireGroup.children[i];
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          var flicker = 0.8 + Math.sin(time * 3 + i) * 0.3 + Math.random() * 0.2;
          child.scale.set(flicker, flicker * 0.6, flicker);
          if (child.material.emissive) {
            var intensity = Math.floor(flicker * 255);
            child.material.emissive.setHex((intensity << 16) | (intensity / 2 << 8));
          }
        }
      }

      // Flickering light for fire
      var lights = shipGroup.children.filter(function(obj) {
        return obj instanceof THREE.Light;
      });
      for (var i = 0; i < lights.length; i++) {
        if (lights[i] instanceof THREE.PointLight) {
          var flicker = 1.8 + Math.sin(time * 2.5) * 0.8 + Math.random() * 0.5;
          lights[i].intensity = Math.max(0.5, flicker);
        }
      }
    }
  }

  function reset() {
    if (scene && shipGroup) {
      scene.remove(shipGroup);
    }

    for (var i = 0; i < shipObjects.length; i++) {
      var obj = shipObjects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }

    shipObjects = [];
    shipGroup = null;
    oilSlickGroup = null;
    campFireGroup = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
