window.HelensburghPost = (function() {
  'use strict';

  var WORLD_X = 1990;
  var WORLD_Z = 2200;

  function buildHillHouse(scene) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });

    // Main body
    var mainGeo = new THREE.BoxGeometry(14, 8, 12);
    var main = new THREE.Mesh(mainGeo, mat);
    main.position.set(WORLD_X - 60, 4, WORLD_Z - 40);
    scene.add(main);

    // White harling render panel inserts (front)
    var panelFrontGeo = new THREE.BoxGeometry(4, 3, 0.3);
    var panelFront = new THREE.Mesh(panelFrontGeo, whiteMat);
    panelFront.position.set(WORLD_X - 60, 5.5, WORLD_Z - 34.1);
    scene.add(panelFront);

    var panelFront2Geo = new THREE.BoxGeometry(3, 2, 0.3);
    var panelFront2 = new THREE.Mesh(panelFront2Geo, whiteMat);
    panelFront2.position.set(WORLD_X - 65, 3, WORLD_Z - 34.1);
    scene.add(panelFront2);

    // White harling side panel
    var panelSideGeo = new THREE.BoxGeometry(0.3, 3, 5);
    var panelSide = new THREE.Mesh(panelSideGeo, whiteMat);
    panelSide.position.set(WORLD_X - 53.1, 6, WORLD_Z - 40);
    scene.add(panelSide);

    // Cylindrical stair tower
    var towerGeo = new THREE.CylinderGeometry(1.8, 1.8, 10, 8);
    var tower = new THREE.Mesh(towerGeo, mat);
    tower.position.set(WORLD_X - 67, 5, WORLD_Z - 40);
    scene.add(tower);

    // Stair tower cap
    var capGeo = new THREE.CylinderGeometry(2, 1.8, 1.5, 8);
    var cap = new THREE.Mesh(capGeo, whiteMat);
    cap.position.set(WORLD_X - 67, 10.75, WORLD_Z - 40);
    scene.add(cap);

    // Flat roof section (Mackintosh signature)
    var roofGeo = new THREE.BoxGeometry(14, 0.6, 12);
    var roof = new THREE.Mesh(roofGeo, whiteMat);
    roof.position.set(WORLD_X - 60, 8.3, WORLD_Z - 40);
    scene.add(roof);

    // Secondary flat roof extension
    var roofExtGeo = new THREE.BoxGeometry(6, 0.6, 7);
    var roofExt = new THREE.Mesh(roofExtGeo, mat);
    roofExt.position.set(WORLD_X - 54, 5.3, WORLD_Z - 42);
    scene.add(roofExt);

    // Small chimney stacks
    var chimneyGeo = new THREE.BoxGeometry(1, 3, 1);
    var chimney1 = new THREE.Mesh(chimneyGeo, mat);
    chimney1.position.set(WORLD_X - 57, 9.5, WORLD_Z - 34.5);
    scene.add(chimney1);

    var chimney2 = new THREE.Mesh(chimneyGeo, mat);
    chimney2.position.set(WORLD_X - 63, 9.5, WORLD_Z - 34.5);
    scene.add(chimney2);
  }

  function buildFaslaneBase(scene) {
    var concreteMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

    // Main administration building
    var adminGeo = new THREE.BoxGeometry(40, 6, 15);
    var admin = new THREE.Mesh(adminGeo, concreteMat);
    admin.position.set(WORLD_X + 80, 3, WORLD_Z - 20);
    scene.add(admin);

    // Second long building
    var bldg2Geo = new THREE.BoxGeometry(40, 6, 15);
    var bldg2 = new THREE.Mesh(bldg2Geo, concreteMat);
    bldg2.position.set(WORLD_X + 80, 3, WORLD_Z + 10);
    scene.add(bldg2);

    // Third barracks block
    var bldg3Geo = new THREE.BoxGeometry(30, 5, 12);
    var bldg3 = new THREE.Mesh(bldg3Geo, concreteMat);
    bldg3.position.set(WORLD_X + 110, 2.5, WORLD_Z - 5);
    scene.add(bldg3);

    // Concrete submarine pens (tunnel openings)
    var pen1Geo = new THREE.BoxGeometry(8, 6, 20);
    var pen1 = new THREE.Mesh(pen1Geo, darkMat);
    pen1.position.set(WORLD_X + 55, 3, WORLD_Z + 35);
    scene.add(pen1);

    var pen2Geo = new THREE.BoxGeometry(8, 6, 20);
    var pen2 = new THREE.Mesh(pen2Geo, darkMat);
    pen2.position.set(WORLD_X + 65, 3, WORLD_Z + 35);
    scene.add(pen2);

    var pen3Geo = new THREE.BoxGeometry(8, 6, 20);
    var pen3 = new THREE.Mesh(pen3Geo, darkMat);
    pen3.position.set(WORLD_X + 75, 3, WORLD_Z + 35);
    scene.add(pen3);

    // Pen roof slabs
    var penRoofGeo = new THREE.BoxGeometry(30, 1.5, 20);
    var penRoof = new THREE.Mesh(penRoofGeo, concreteMat);
    penRoof.position.set(WORLD_X + 65, 6.75, WORLD_Z + 35);
    scene.add(penRoof);

    // Guard house / gatehouse
    var gateGeo = new THREE.BoxGeometry(5, 4, 5);
    var gate = new THREE.Mesh(gateGeo, concreteMat);
    gate.position.set(WORLD_X + 45, 2, WORLD_Z - 30);
    scene.add(gate);

    // Watchtower base
    var watchBaseGeo = new THREE.BoxGeometry(3, 8, 3);
    var watchBase = new THREE.Mesh(watchBaseGeo, concreteMat);
    watchBase.position.set(WORLD_X + 50, 4, WORLD_Z - 35);
    scene.add(watchBase);

    // Watchtower cabin
    var watchTopGeo = new THREE.BoxGeometry(4, 3, 4);
    var watchTop = new THREE.Mesh(watchTopGeo, darkMat);
    watchTop.position.set(WORLD_X + 50, 9.5, WORLD_Z - 35);
    scene.add(watchTop);
  }

  function buildSecurityFencing(scene) {
    var postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var wireMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

    var fencePositions = [
      [WORLD_X + 40, WORLD_Z - 40],
      [WORLD_X + 50, WORLD_Z - 40],
      [WORLD_X + 60, WORLD_Z - 40],
      [WORLD_X + 70, WORLD_Z - 40],
      [WORLD_X + 80, WORLD_Z - 40],
      [WORLD_X + 90, WORLD_Z - 40],
      [WORLD_X + 100, WORLD_Z - 40],
      [WORLD_X + 110, WORLD_Z - 40],
      [WORLD_X + 120, WORLD_Z - 40]
    ];

    var i;
    for (i = 0; i < fencePositions.length; i++) {
      var postGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 4);
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(fencePositions[i][0], 2.5, fencePositions[i][1]);
      scene.add(post);
    }

    // Wire lines between fence posts
    var wireVerts = new Float32Array([
      WORLD_X + 40, 4, WORLD_Z - 40,
      WORLD_X + 120, 4, WORLD_Z - 40,
      WORLD_X + 40, 3, WORLD_Z - 40,
      WORLD_X + 120, 3, WORLD_Z - 40,
      WORLD_X + 40, 2, WORLD_Z - 40,
      WORLD_X + 120, 2, WORLD_Z - 40
    ]);
    var wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
    var wireIndices = new Uint16Array([0, 1, 2, 3, 4, 5]);
    wireGeo.setIndex(new THREE.BufferAttribute(wireIndices, 1));
    var wireLines = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireLines);

    // Side fence
    var sideFenceVerts = new Float32Array([
      WORLD_X + 40, 4, WORLD_Z - 40,
      WORLD_X + 40, 4, WORLD_Z + 50,
      WORLD_X + 40, 3, WORLD_Z - 40,
      WORLD_X + 40, 3, WORLD_Z + 50,
      WORLD_X + 40, 2, WORLD_Z - 40,
      WORLD_X + 40, 2, WORLD_Z + 50
    ]);
    var sideFenceGeo = new THREE.BufferGeometry();
    sideFenceGeo.setAttribute('position', new THREE.BufferAttribute(sideFenceVerts, 3));
    var sideFenceIdx = new Uint16Array([0, 1, 2, 3, 4, 5]);
    sideFenceGeo.setIndex(new THREE.BufferAttribute(sideFenceIdx, 1));
    var sideFenceLines = new THREE.LineSegments(sideFenceGeo, wireMat);
    scene.add(sideFenceLines);

    // Side fence posts
    var sidePosts = [
      [WORLD_X + 40, WORLD_Z - 30],
      [WORLD_X + 40, WORLD_Z - 20],
      [WORLD_X + 40, WORLD_Z - 10],
      [WORLD_X + 40, WORLD_Z],
      [WORLD_X + 40, WORLD_Z + 10],
      [WORLD_X + 40, WORLD_Z + 20],
      [WORLD_X + 40, WORLD_Z + 30],
      [WORLD_X + 40, WORLD_Z + 40],
      [WORLD_X + 40, WORLD_Z + 50]
    ];

    for (i = 0; i < sidePosts.length; i++) {
      var sidePostGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 4);
      var sidePost = new THREE.Mesh(sidePostGeo, postMat);
      sidePost.position.set(sidePosts[i][0], 2.5, sidePosts[i][1]);
      scene.add(sidePost);
    }
  }

  function buildTridentSubmarine(scene) {
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x2A2A3A });
    var darkGreyMat = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });

    // Main hull
    var hullGeo = new THREE.BoxGeometry(40, 4, 7);
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.set(WORLD_X + 65, 1.5, WORLD_Z + 35);
    scene.add(hull);

    // Bow taper
    var bowGeo = new THREE.BoxGeometry(6, 3, 5);
    var bow = new THREE.Mesh(bowGeo, hullMat);
    bow.position.set(WORLD_X + 88, 1.5, WORLD_Z + 35);
    scene.add(bow);

    // Bow tip cone-like box
    var bowTipGeo = new THREE.BoxGeometry(3, 2, 3);
    var bowTip = new THREE.Mesh(bowTipGeo, hullMat);
    bowTip.position.set(WORLD_X + 93, 1.5, WORLD_Z + 35);
    scene.add(bowTip);

    // Stern taper
    var sternGeo = new THREE.BoxGeometry(5, 3, 5);
    var stern = new THREE.Mesh(sternGeo, hullMat);
    stern.position.set(WORLD_X + 43, 1.5, WORLD_Z + 35);
    scene.add(stern);

    // Conning tower / fin
    var finGeo = new THREE.BoxGeometry(3, 5, 3);
    var fin = new THREE.Mesh(finGeo, darkGreyMat);
    fin.position.set(WORLD_X + 70, 5.5, WORLD_Z + 35);
    scene.add(fin);

    // Periscope
    var periscopeGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 5);
    var periscope = new THREE.Mesh(periscopeGeo, darkGreyMat);
    periscope.position.set(WORLD_X + 70, 9.5, WORLD_Z + 35);
    scene.add(periscope);

    // Ballast tanks / outer hull bulges
    var tankGeo = new THREE.BoxGeometry(30, 1.5, 8.5);
    var tanks = new THREE.Mesh(tankGeo, hullMat);
    tanks.position.set(WORLD_X + 65, -0.2, WORLD_Z + 35);
    scene.add(tanks);
  }

  function buildTVMast(scene) {
    var mastMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var redMat = new THREE.MeshLambertMaterial({ color: 0xCC2200 });

    // Mast base (on hilltop)
    var baseGeo = new THREE.CylinderGeometry(0.8, 1.2, 2, 6);
    var base = new THREE.Mesh(baseGeo, mastMat);
    base.position.set(WORLD_X - 30, 1, WORLD_Z - 80);
    scene.add(base);

    // Main mast shaft
    var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 30, 6);
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(WORLD_X - 30, 17, WORLD_Z - 80);
    scene.add(mast);

    // Warning light sphere at top
    var lightGeo = new THREE.SphereGeometry(0.5, 6, 4);
    var light = new THREE.Mesh(lightGeo, redMat);
    light.position.set(WORLD_X - 30, 32.5, WORLD_Z - 80);
    scene.add(light);

    // Cross-arm for aerials (mid height)
    var crossArm1Geo = new THREE.BoxGeometry(6, 0.3, 0.3);
    var crossArm1 = new THREE.Mesh(crossArm1Geo, mastMat);
    crossArm1.position.set(WORLD_X - 30, 22, WORLD_Z - 80);
    scene.add(crossArm1);

    var crossArm2Geo = new THREE.BoxGeometry(4, 0.3, 0.3);
    var crossArm2 = new THREE.Mesh(crossArm2Geo, mastMat);
    crossArm2.position.set(WORLD_X - 30, 27, WORLD_Z - 80);
    scene.add(crossArm2);

    // Guy wire representations as LineSegments
    var wireMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var guyVerts = new Float32Array([
      WORLD_X - 30, 32, WORLD_Z - 80,
      WORLD_X - 38, 0, WORLD_Z - 88,
      WORLD_X - 30, 32, WORLD_Z - 80,
      WORLD_X - 22, 0, WORLD_Z - 88,
      WORLD_X - 30, 32, WORLD_Z - 80,
      WORLD_X - 30, 0, WORLD_Z - 70
    ]);
    var guyGeo = new THREE.BufferGeometry();
    guyGeo.setAttribute('position', new THREE.BufferAttribute(guyVerts, 3));
    var guyIdx = new Uint16Array([0, 1, 2, 3, 4, 5]);
    guyGeo.setIndex(new THREE.BufferAttribute(guyIdx, 1));
    var guyLines = new THREE.LineSegments(guyGeo, wireMat);
    scene.add(guyLines);
  }

  function buildVictorianPier(scene) {
    var ironMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
    var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

    // Main pier deck
    var deckGeo = new THREE.BoxGeometry(35, 2, 5);
    var deck = new THREE.Mesh(deckGeo, ironMat);
    deck.position.set(WORLD_X + 17, 1, WORLD_Z - 70);
    scene.add(deck);

    // Pier supports / piles
    var pilePositions = [
      [WORLD_X + 2, WORLD_Z - 68],
      [WORLD_X + 2, WORLD_Z - 72],
      [WORLD_X + 9, WORLD_Z - 68],
      [WORLD_X + 9, WORLD_Z - 72],
      [WORLD_X + 16, WORLD_Z - 68],
      [WORLD_X + 16, WORLD_Z - 72],
      [WORLD_X + 23, WORLD_Z - 68],
      [WORLD_X + 23, WORLD_Z - 72],
      [WORLD_X + 30, WORLD_Z - 68],
      [WORLD_X + 30, WORLD_Z - 72]
    ];

    var i;
    for (i = 0; i < pilePositions.length; i++) {
      var pileGeo = new THREE.CylinderGeometry(0.25, 0.35, 4, 6);
      var pile = new THREE.Mesh(pileGeo, ironMat);
      pile.position.set(pilePositions[i][0], -1, pilePositions[i][1]);
      scene.add(pile);
    }

    // End pavilion shelter — walls
    var pavilionBaseGeo = new THREE.BoxGeometry(8, 4, 6);
    var pavilionBase = new THREE.Mesh(pavilionBaseGeo, whiteMat);
    pavilionBase.position.set(WORLD_X + 34, 3, WORLD_Z - 70);
    scene.add(pavilionBase);

    // Pavilion roof
    var pavilionRoofGeo = new THREE.BoxGeometry(9, 0.8, 7);
    var pavilionRoof = new THREE.Mesh(pavilionRoofGeo, ironMat);
    pavilionRoof.position.set(WORLD_X + 34, 5.4, WORLD_Z - 70);
    scene.add(pavilionRoof);

    // Pavilion decorative cone turret
    var turretGeo = new THREE.ConeGeometry(1.5, 2.5, 6);
    var turret = new THREE.Mesh(turretGeo, ironMat);
    turret.position.set(WORLD_X + 34, 7.65, WORLD_Z - 70);
    scene.add(turret);

    // Pavilion columns
    var colPositions = [
      [WORLD_X + 30.5, WORLD_Z - 67.5],
      [WORLD_X + 30.5, WORLD_Z - 72.5],
      [WORLD_X + 37.5, WORLD_Z - 67.5],
      [WORLD_X + 37.5, WORLD_Z - 72.5]
    ];

    for (i = 0; i < colPositions.length; i++) {
      var colGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
      var col = new THREE.Mesh(colGeo, whiteMat);
      col.position.set(colPositions[i][0], 3, colPositions[i][1]);
      scene.add(col);
    }

    // Pier railings as LineSegments
    var railMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var railVerts = new Float32Array([
      WORLD_X + 0, 2.5, WORLD_Z - 67.5,
      WORLD_X + 32, 2.5, WORLD_Z - 67.5,
      WORLD_X + 0, 2.5, WORLD_Z - 72.5,
      WORLD_X + 32, 2.5, WORLD_Z - 72.5
    ]);
    var railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.BufferAttribute(railVerts, 3));
    var railIdx = new Uint16Array([0, 1, 2, 3]);
    railGeo.setIndex(new THREE.BufferAttribute(railIdx, 1));
    var railLines = new THREE.LineSegments(railGeo, railMat);
    scene.add(railLines);

    // Decorative lamp posts
    var lampPositions = [
      [WORLD_X + 5, WORLD_Z - 67.2],
      [WORLD_X + 15, WORLD_Z - 67.2],
      [WORLD_X + 25, WORLD_Z - 67.2],
      [WORLD_X + 5, WORLD_Z - 72.8],
      [WORLD_X + 15, WORLD_Z - 72.8],
      [WORLD_X + 25, WORLD_Z - 72.8]
    ];

    var lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var globeMat = new THREE.MeshLambertMaterial({ color: 0xFFFFDD });

    for (i = 0; i < lampPositions.length; i++) {
      var lampGeo = new THREE.CylinderGeometry(0.08, 0.12, 3, 5);
      var lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(lampPositions[i][0], 3.5, lampPositions[i][1]);
      scene.add(lamp);

      var globeGeo = new THREE.SphereGeometry(0.25, 5, 4);
      var globe = new THREE.Mesh(globeGeo, globeMat);
      globe.position.set(lampPositions[i][0], 5.25, lampPositions[i][1]);
      scene.add(globe);
    }
  }

  function buildTownBuildings(scene) {
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8A8070 });
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
    var redMat = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });

    // Victorian terraced row 1
    var terrace1Geo = new THREE.BoxGeometry(25, 9, 8);
    var terrace1 = new THREE.Mesh(terrace1Geo, stoneMat);
    terrace1.position.set(WORLD_X - 20, 4.5, WORLD_Z - 10);
    scene.add(terrace1);

    // Terrace 1 chimneys
    var i;
    for (i = 0; i < 4; i++) {
      var chimGeo = new THREE.BoxGeometry(0.8, 2.5, 0.8);
      var chim = new THREE.Mesh(chimGeo, darkMat);
      chim.position.set(WORLD_X - 30 + i * 6, 10.25, WORLD_Z - 10);
      scene.add(chim);
    }

    // Victorian terraced row 2
    var terrace2Geo = new THREE.BoxGeometry(20, 8, 8);
    var terrace2 = new THREE.Mesh(terrace2Geo, stoneMat);
    terrace2.position.set(WORLD_X - 20, 4, WORLD_Z + 5);
    scene.add(terrace2);

    // Church / town hall
    var churchGeo = new THREE.BoxGeometry(12, 12, 10);
    var church = new THREE.Mesh(churchGeo, stoneMat);
    church.position.set(WORLD_X + 5, 6, WORLD_Z - 20);
    scene.add(church);

    // Church steeple
    var steepleGeo = new THREE.CylinderGeometry(0.1, 1.5, 8, 6);
    var steeple = new THREE.Mesh(steepleGeo, darkMat);
    steeple.position.set(WORLD_X + 5, 16, WORLD_Z - 20);
    scene.add(steeple);

    // Church tower base
    var towerGeo = new THREE.BoxGeometry(4, 14, 4);
    var ctower = new THREE.Mesh(towerGeo, stoneMat);
    ctower.position.set(WORLD_X + 5, 7, WORLD_Z - 20);
    scene.add(ctower);

    // High Street shop blocks
    var shop1Geo = new THREE.BoxGeometry(15, 6, 7);
    var shop1 = new THREE.Mesh(shop1Geo, redMat);
    shop1.position.set(WORLD_X - 5, 3, WORLD_Z + 20);
    scene.add(shop1);

    var shop2Geo = new THREE.BoxGeometry(12, 7, 7);
    var shop2 = new THREE.Mesh(shop2Geo, stoneMat);
    shop2.position.set(WORLD_X + 12, 3.5, WORLD_Z + 20);
    scene.add(shop2);

    // Station building
    var stationGeo = new THREE.BoxGeometry(18, 5, 10);
    var station = new THREE.Mesh(stationGeo, darkMat);
    station.position.set(WORLD_X - 35, 2.5, WORLD_Z + 30);
    scene.add(station);

    // Station canopy
    var canopyGeo = new THREE.BoxGeometry(18, 0.5, 5);
    var canopy = new THREE.Mesh(canopyGeo, stoneMat);
    canopy.position.set(WORLD_X - 35, 5.25, WORLD_Z + 23);
    scene.add(canopy);
  }

  function buildEstuaryFeatures(scene) {
    var seaWallMat = new THREE.MeshLambertMaterial({ color: 0x7A7A6A });
    var rockMat = new THREE.MeshLambertMaterial({ color: 0x6A6060 });

    // Sea wall / promenade
    var seaWallGeo = new THREE.BoxGeometry(80, 2, 4);
    var seaWall = new THREE.Mesh(seaWallGeo, seaWallMat);
    seaWall.position.set(WORLD_X, 1, WORLD_Z - 60);
    scene.add(seaWall);

    // Rock outcrops
    var rock1Geo = new THREE.BoxGeometry(4, 1.5, 3);
    var rock1 = new THREE.Mesh(rock1Geo, rockMat);
    rock1.position.set(WORLD_X - 50, 0.75, WORLD_Z - 65);
    scene.add(rock1);

    var rock2Geo = new THREE.BoxGeometry(3, 2, 4);
    var rock2 = new THREE.Mesh(rock2Geo, rockMat);
    rock2.position.set(WORLD_X - 40, 1, WORLD_Z - 68);
    scene.add(rock2);

    var rock3Geo = new THREE.BoxGeometry(5, 1, 3);
    var rock3 = new THREE.Mesh(rock3Geo, rockMat);
    rock3.position.set(WORLD_X + 30, 0.5, WORLD_Z - 66);
    scene.add(rock3);

    // Hilltop platform (where Baird tested TV signals)
    var hillTopGeo = new THREE.BoxGeometry(10, 0.8, 10);
    var hillTop = new THREE.Mesh(hillTopGeo, seaWallMat);
    hillTop.position.set(WORLD_X - 30, 12, WORLD_Z - 80);
    scene.add(hillTop);

    // Baird commemorative plinth
    var plinthGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
    var plinthMat = new THREE.MeshLambertMaterial({ color: 0x9A9080 });
    var plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(WORLD_X - 35, 13, WORLD_Z - 82);
    scene.add(plinth);
  }

  function build(scene) {
    buildHillHouse(scene);
    buildFaslaneBase(scene);
    buildSecurityFencing(scene);
    buildTridentSubmarine(scene);
    buildTVMast(scene);
    buildVictorianPier(scene);
    buildTownBuildings(scene);
    buildEstuaryFeatures(scene);
  }

  return {
    build: build
  };
}());
