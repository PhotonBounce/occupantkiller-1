window.MelroseAbbey = (function() {
  'use strict';

  var WX = 2500;
  var WZ = 2200;

  var objects = [];
  var lights = [];
  var animatedMesh = null;

  function addMelroseAbbey(scene) {
    // Main nave - roofless Gothic ruin, pink sandstone 35x14x12
    var sandstoneMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var naveGeom = new THREE.BoxGeometry(35, 14, 12);
    var nave = new THREE.Mesh(naveGeom, sandstoneMat);
    nave.position.set(WX, 7, WZ);
    scene.add(nave);
    objects.push(nave);

    // Nave interior hollow (dark interior air - slightly smaller box inside)
    var hollowMat = new THREE.MeshLambertMaterial({ color: 0x2A2018 });
    var hollowGeom = new THREE.BoxGeometry(33, 13, 10);
    var hollow = new THREE.Mesh(hollowGeom, hollowMat);
    hollow.position.set(WX, 7.5, WZ);
    scene.add(hollow);
    objects.push(hollow);

    // North nave wall (restored solid piece)
    var northWallGeom = new THREE.BoxGeometry(35, 14, 1.5);
    var northWall = new THREE.Mesh(northWallGeom, sandstoneMat);
    northWall.position.set(WX, 7, WZ - 5.25);
    scene.add(northWall);
    objects.push(northWall);

    // South nave wall
    var southWall = new THREE.Mesh(northWallGeom, sandstoneMat);
    southWall.position.set(WX, 7, WZ + 5.25);
    scene.add(southWall);
    objects.push(southWall);

    // East gable end (chancel end) wall
    var eastGableGeom = new THREE.BoxGeometry(1.5, 14, 12);
    var eastGable = new THREE.Mesh(eastGableGeom, sandstoneMat);
    eastGable.position.set(WX + 17.25, 7, WZ);
    scene.add(eastGable);
    objects.push(eastGable);

    // West end wall (ruined, partial)
    var westFragGeom = new THREE.BoxGeometry(1.5, 10, 12);
    var westFrag = new THREE.Mesh(westFragGeom, sandstoneMat);
    westFrag.position.set(WX - 17.25, 5, WZ);
    scene.add(westFrag);
    objects.push(westFrag);

    // Parapet cap along north wall top
    var parapetNGeom = new THREE.BoxGeometry(35, 1.5, 2);
    var parapetN = new THREE.Mesh(parapetNGeom, sandstoneMat);
    parapetN.position.set(WX, 14.75, WZ - 5);
    scene.add(parapetN);
    objects.push(parapetN);

    // Parapet cap along south wall top
    var parapetS = new THREE.Mesh(parapetNGeom, sandstoneMat);
    parapetS.position.set(WX, 14.75, WZ + 5);
    scene.add(parapetS);
    objects.push(parapetS);

    // Window tracery boxes - Gothic lancet windows north wall (x5)
    var winDarkMat = new THREE.MeshLambertMaterial({ color: 0x1A1410 });
    var winGeom = new THREE.BoxGeometry(2, 5, 0.6);
    var winArch = new THREE.BoxGeometry(2, 1.5, 0.6);
    for (var wn = 0; wn < 5; wn++) {
      var winN = new THREE.Mesh(winGeom, winDarkMat);
      winN.position.set(WX - 14 + wn * 7, 9, WZ - 5.8);
      scene.add(winN);
      objects.push(winN);
      // Gothic arch top box
      var winNarch = new THREE.Mesh(winArch, sandstoneMat);
      winNarch.position.set(WX - 14 + wn * 7, 12, WZ - 5.8);
      scene.add(winNarch);
      objects.push(winNarch);
    }

    // Window tracery boxes - Gothic lancet windows south wall (x5)
    for (var ws = 0; ws < 5; ws++) {
      var winS = new THREE.Mesh(winGeom, winDarkMat);
      winS.position.set(WX - 14 + ws * 7, 9, WZ + 5.8);
      scene.add(winS);
      objects.push(winS);
      var winSarch = new THREE.Mesh(winArch, sandstoneMat);
      winSarch.position.set(WX - 14 + ws * 7, 12, WZ + 5.8);
      scene.add(winSarch);
      objects.push(winSarch);
    }

    // Great east window tracery (large box grid)
    var eastWinGeom = new THREE.BoxGeometry(0.6, 8, 8);
    var eastWin = new THREE.Mesh(eastWinGeom, winDarkMat);
    eastWin.position.set(WX + 17.9, 8, WZ);
    scene.add(eastWin);
    objects.push(eastWin);

    // East window mullion bars (horizontal tracery)
    var mullionHGeom = new THREE.BoxGeometry(0.6, 0.5, 8);
    for (var mh = 0; mh < 3; mh++) {
      var mullionH = new THREE.Mesh(mullionHGeom, sandstoneMat);
      mullionH.position.set(WX + 17.9, 5 + mh * 2.5, WZ);
      scene.add(mullionH);
      objects.push(mullionH);
    }

    // East window vertical tracery bars
    var mullionVGeom = new THREE.BoxGeometry(0.6, 8, 0.5);
    for (var mv = -3; mv <= 3; mv++) {
      var mullionV = new THREE.Mesh(mullionVGeom, sandstoneMat);
      mullionV.position.set(WX + 17.9, 8, WZ + mv * 1.2);
      scene.add(mullionV);
      objects.push(mullionV);
    }

    // Flying buttresses (north side) - angled box struts x4
    var buttressMat = new THREE.MeshLambertMaterial({ color: 0xC09060 });
    var buttressGeom = new THREE.BoxGeometry(1.2, 6, 4);
    for (var bn = 0; bn < 4; bn++) {
      var buttN = new THREE.Mesh(buttressGeom, buttressMat);
      buttN.position.set(WX - 12 + bn * 8, 10, WZ - 9);
      buttN.rotation.x = 0.35;
      scene.add(buttN);
      objects.push(buttN);
    }

    // Flying buttresses (south side) - angled box struts x4
    for (var bs = 0; bs < 4; bs++) {
      var buttS = new THREE.Mesh(buttressGeom, buttressMat);
      buttS.position.set(WX - 12 + bs * 8, 10, WZ + 9);
      buttS.rotation.x = -0.35;
      scene.add(buttS);
      objects.push(buttS);
    }

    // Buttress piers (north, freestanding vertical supports)
    var pierGeom = new THREE.BoxGeometry(1.5, 12, 1.5);
    for (var pn = 0; pn < 4; pn++) {
      var pierN = new THREE.Mesh(pierGeom, sandstoneMat);
      pierN.position.set(WX - 12 + pn * 8, 6, WZ - 11);
      scene.add(pierN);
      objects.push(pierN);
    }

    // Buttress piers (south)
    for (var ps = 0; ps < 4; ps++) {
      var pierS = new THREE.Mesh(pierGeom, sandstoneMat);
      pierS.position.set(WX - 12 + ps * 8, 6, WZ + 11);
      scene.add(pierS);
      objects.push(pierS);
    }

    // Chancel/choir section extending east - 14x10x10
    var chancelGeom = new THREE.BoxGeometry(14, 10, 10);
    var chancel = new THREE.Mesh(chancelGeom, sandstoneMat);
    chancel.position.set(WX + 24, 5, WZ);
    scene.add(chancel);
    objects.push(chancel);

    // Chancel hollow
    var chancelHollowGeom = new THREE.BoxGeometry(12, 9, 8);
    var chancelHollow = new THREE.Mesh(chancelHollowGeom, hollowMat);
    chancelHollow.position.set(WX + 24, 5.5, WZ);
    scene.add(chancelHollow);
    objects.push(chancelHollow);

    // South transept - box 10x13x8
    var transeptGeom = new THREE.BoxGeometry(10, 13, 8);
    var transept = new THREE.Mesh(transeptGeom, sandstoneMat);
    transept.position.set(WX + 4, 6.5, WZ + 10);
    scene.add(transept);
    objects.push(transept);

    // North transept
    var northTransept = new THREE.Mesh(transeptGeom, sandstoneMat);
    northTransept.position.set(WX + 4, 6.5, WZ - 10);
    scene.add(northTransept);
    objects.push(northTransept);

    // Crossing tower stump (roofless) - 8x18x8
    var crossingGeom = new THREE.BoxGeometry(8, 18, 8);
    var crossing = new THREE.Mesh(crossingGeom, sandstoneMat);
    crossing.position.set(WX + 4, 9, WZ);
    scene.add(crossing);
    objects.push(crossing);

    // Crossing tower hollow
    var crossingHollowGeom = new THREE.BoxGeometry(6, 17, 6);
    var crossingHollow = new THREE.Mesh(crossingHollowGeom, hollowMat);
    crossingHollow.position.set(WX + 4, 9.5, WZ);
    scene.add(crossingHollow);
    objects.push(crossingHollow);

    // Tower parapet decoration
    var towerCapGeom = new THREE.BoxGeometry(9, 1.8, 9);
    var towerCap = new THREE.Mesh(towerCapGeom, sandstoneMat);
    towerCap.position.set(WX + 4, 18.9, WZ);
    scene.add(towerCap);
    objects.push(towerCap);

    // Abbey ground floor - flagstone base
    var flagstoneMat = new THREE.MeshLambertMaterial({ color: 0xB09880 });
    var floorGeom = new THREE.BoxGeometry(38, 0.3, 15);
    var floor = new THREE.Mesh(floorGeom, flagstoneMat);
    floor.position.set(WX, 0.15, WZ);
    scene.add(floor);
    objects.push(floor);

    // Nave pillar columns (internal) x6
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0xC49A6A });
    var pillarGeom = new THREE.CylinderGeometry(0.6, 0.7, 13, 8);
    var pillarXPos = [-12, -6, 0, 6, 12];
    for (var pl = 0; pl < pillarXPos.length; pl++) {
      var pilN = new THREE.Mesh(pillarGeom, pillarMat);
      pilN.position.set(WX + pillarXPos[pl], 6.5, WZ - 3);
      scene.add(pilN);
      objects.push(pilN);

      var pilS = new THREE.Mesh(pillarGeom, pillarMat);
      pilS.position.set(WX + pillarXPos[pl], 6.5, WZ + 3);
      scene.add(pilS);
      objects.push(pilS);
    }
  }

  function addGargoyles(scene) {
    // Gargoyle detail: small grotesque figures on parapet (at least 4)
    var gargoyleMat = new THREE.MeshLambertMaterial({ color: 0xA08060 });

    // Gargoyle body cylinders and head boxes along north parapet
    var gargPositions = [
      [WX - 12, WZ - 4.5],
      [WX - 4,  WZ - 4.5],
      [WX + 4,  WZ - 4.5],
      [WX + 12, WZ - 4.5],
      [WX - 8,  WZ + 4.5],
      [WX + 8,  WZ + 4.5]
    ];

    var gBodyGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 6);
    var gHeadGeom = new THREE.BoxGeometry(0.5, 0.5, 0.6);
    var gSnoutGeom = new THREE.BoxGeometry(0.25, 0.2, 0.5);

    for (var gg = 0; gg < gargPositions.length; gg++) {
      var gx = gargPositions[gg][0];
      var gz = gargPositions[gg][1];
      // Body
      var gBody = new THREE.Mesh(gBodyGeom, gargoyleMat);
      gBody.position.set(gx, 15.4, gz);
      scene.add(gBody);
      objects.push(gBody);
      // Head box
      var gHead = new THREE.Mesh(gHeadGeom, gargoyleMat);
      gHead.position.set(gx, 16.05, gz);
      scene.add(gHead);
      objects.push(gHead);
      // Snout projection
      var gSnout = new THREE.Mesh(gSnoutGeom, gargoyleMat);
      var snoutZ = (gz < WZ) ? gz - 0.4 : gz + 0.4;
      gSnout.position.set(gx, 16.0, snoutZ);
      scene.add(gSnout);
      objects.push(gSnout);
    }
  }

  function addBrucesHeartMarker(scene) {
    // Bruce's Heart burial marker - lead casket 2x1x2
    var leadMat = new THREE.MeshLambertMaterial({ color: 0xC0A060 });
    var casketGeom = new THREE.BoxGeometry(2, 1, 2);
    var casket = new THREE.Mesh(casketGeom, leadMat);
    casket.position.set(WX + 1, 0.5, WZ + 1);
    scene.add(casket);
    objects.push(casket);

    // Ornate stone shrine above the casket - stepped base
    var shrineMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var shrineBase1Geom = new THREE.BoxGeometry(3.5, 0.5, 3.5);
    var shrineBase1 = new THREE.Mesh(shrineBase1Geom, shrineMat);
    shrineBase1.position.set(WX + 1, 1.25, WZ + 1);
    scene.add(shrineBase1);
    objects.push(shrineBase1);

    var shrineBase2Geom = new THREE.BoxGeometry(2.8, 0.5, 2.8);
    var shrineBase2 = new THREE.Mesh(shrineBase2Geom, shrineMat);
    shrineBase2.position.set(WX + 1, 1.75, WZ + 1);
    scene.add(shrineBase2);
    objects.push(shrineBase2);

    // Shrine chest/body
    var shrineBodyGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var shrineBody = new THREE.Mesh(shrineBodyGeom, shrineMat);
    shrineBody.position.set(WX + 1, 2.75, WZ + 1);
    scene.add(shrineBody);
    objects.push(shrineBody);

    // Shrine lid - slightly wider box
    var shrineLidGeom = new THREE.BoxGeometry(2.4, 0.4, 2.4);
    var shrineLid = new THREE.Mesh(shrineLidGeom, shrineMat);
    shrineLid.position.set(WX + 1, 3.7, WZ + 1);
    scene.add(shrineLid);
    objects.push(shrineLid);

    // Shrine apex cone finial
    var shrineFinialGeom = new THREE.ConeGeometry(0.4, 1.2, 6);
    var shrineFinialMat = new THREE.MeshLambertMaterial({ color: 0xB08050 });
    var shrineFinial = new THREE.Mesh(shrineFinialGeom, shrineFinialMat);
    shrineFinial.position.set(WX + 1, 4.5, WZ + 1);
    scene.add(shrineFinial);
    objects.push(shrineFinial);

    // Four corner pillars of shrine canopy
    var cPillarMat = new THREE.MeshLambertMaterial({ color: 0xC09A6A });
    var cPillarGeom = new THREE.CylinderGeometry(0.12, 0.15, 2.5, 6);
    var cPillarPos = [
      [WX + 0.2, WZ + 0.2],
      [WX + 1.8, WZ + 0.2],
      [WX + 0.2, WZ + 1.8],
      [WX + 1.8, WZ + 1.8]
    ];
    for (var cp = 0; cp < cPillarPos.length; cp++) {
      var cPillar = new THREE.Mesh(cPillarGeom, cPillarMat);
      cPillar.position.set(cPillarPos[cp][0], 2.75, cPillarPos[cp][1]);
      scene.add(cPillar);
      objects.push(cPillar);
    }

    // Inscription slab (flat box in front)
    var slabMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
    var slabGeom = new THREE.BoxGeometry(1.8, 0.15, 1.0);
    var slab = new THREE.Mesh(slabGeom, slabMat);
    slab.position.set(WX + 1, 0.15, WZ + 3.5);
    scene.add(slab);
    objects.push(slab);
  }

  function addAbbotsfords(scene) {
    // Abbotsford House - Walter Scott baronial fantasy 28x12x16
    var abbotMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var mainHouseGeom = new THREE.BoxGeometry(28, 12, 16);
    var mainHouse = new THREE.Mesh(mainHouseGeom, abbotMat);
    mainHouse.position.set(WX + 70, 6, WZ - 10);
    scene.add(mainHouse);
    objects.push(mainHouse);

    // Stepped gable ends (crow-step boxes) - north gable
    var crowMat = new THREE.MeshLambertMaterial({ color: 0xC49A6A });
    var crowStep1Geom = new THREE.BoxGeometry(3, 3, 1.5);
    var crowStepNPos = [
      [WX + 56.5, 13.5, WZ - 10],
      [WX + 56.5, 16.5, WZ - 10],
      [WX + 56.5, 18.5, WZ - 10]
    ];
    for (var cs1 = 0; cs1 < crowStepNPos.length; cs1++) {
      var csN = new THREE.Mesh(crowStep1Geom, crowMat);
      csN.position.set(crowStepNPos[cs1][0], crowStepNPos[cs1][1], crowStepNPos[cs1][2]);
      scene.add(csN);
      objects.push(csN);
    }

    // Stepped gable ends - east gable
    var crowStepEPos = [
      [WX + 84.5, 13.5, WZ - 10],
      [WX + 84.5, 16.5, WZ - 10],
      [WX + 84.5, 18.5, WZ - 10]
    ];
    for (var cs2 = 0; cs2 < crowStepEPos.length; cs2++) {
      var csE = new THREE.Mesh(crowStep1Geom, crowMat);
      csE.position.set(crowStepEPos[cs2][0], crowStepEPos[cs2][1], crowStepEPos[cs2][2]);
      scene.add(csE);
      objects.push(csE);
    }

    // Roof ridge boxes
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var roofRidgeGeom = new THREE.BoxGeometry(28, 1.5, 2);
    var roofRidge = new THREE.Mesh(roofRidgeGeom, roofMat);
    roofRidge.position.set(WX + 70, 12.75, WZ - 10);
    scene.add(roofRidge);
    objects.push(roofRidge);

    // Baronial turrets (cylinder towers) at corners
    var turretMat = new THREE.MeshLambertMaterial({ color: 0xC49A6A });
    var turretGeom = new THREE.CylinderGeometry(1.8, 2.0, 16, 10);
    var turretCapGeom = new THREE.ConeGeometry(2.1, 4, 10);
    var turretCapMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var turretPos = [
      [WX + 57, WZ - 18],
      [WX + 83, WZ - 18],
      [WX + 57, WZ - 2],
      [WX + 83, WZ - 2]
    ];
    for (var tt = 0; tt < turretPos.length; tt++) {
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(turretPos[tt][0], 8, turretPos[tt][1]);
      scene.add(turret);
      objects.push(turret);

      var turretCap = new THREE.Mesh(turretCapGeom, turretCapMat);
      turretCap.position.set(turretPos[tt][0], 18, turretPos[tt][1]);
      scene.add(turretCap);
      objects.push(turretCap);
    }

    // Wing extension - library wing
    var wingGeom = new THREE.BoxGeometry(12, 10, 12);
    var wing = new THREE.Mesh(wingGeom, abbotMat);
    wing.position.set(WX + 64, 5, WZ + 8);
    scene.add(wing);
    objects.push(wing);

    // Walled garden - four enclosure walls
    var gardenWallMat = new THREE.MeshLambertMaterial({ color: 0xB08A6A });
    var gwNSGeom = new THREE.BoxGeometry(24, 2.5, 0.5);
    var gwEWGeom = new THREE.BoxGeometry(0.5, 2.5, 20);

    var gwN = new THREE.Mesh(gwNSGeom, gardenWallMat);
    gwN.position.set(WX + 72, 1.25, WZ + 18);
    scene.add(gwN);
    objects.push(gwN);

    var gwS = new THREE.Mesh(gwNSGeom, gardenWallMat);
    gwS.position.set(WX + 72, 1.25, WZ + 38);
    scene.add(gwS);
    objects.push(gwS);

    var gwW = new THREE.Mesh(gwEWGeom, gardenWallMat);
    gwW.position.set(WX + 60, 1.25, WZ + 28);
    scene.add(gwW);
    objects.push(gwW);

    var gwE = new THREE.Mesh(gwEWGeom, gardenWallMat);
    gwE.position.set(WX + 84, 1.25, WZ + 28);
    scene.add(gwE);
    objects.push(gwE);

    // Gatehouse box at garden entrance
    var gatehouseGeom = new THREE.BoxGeometry(4, 5, 4);
    var gatehouse = new THREE.Mesh(gatehouseGeom, abbotMat);
    gatehouse.position.set(WX + 60, 2.5, WZ + 18);
    scene.add(gatehouse);
    objects.push(gatehouse);

    // Garden feature: central sundial sphere
    var dialMat = new THREE.MeshLambertMaterial({ color: 0x888870 });
    var dialBaseGeom = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    var dialBase = new THREE.Mesh(dialBaseGeom, dialMat);
    dialBase.position.set(WX + 72, 0.6, WZ + 28);
    scene.add(dialBase);
    objects.push(dialBase);

    var dialSphereGeom = new THREE.SphereGeometry(0.5, 8, 6);
    var dialSphere = new THREE.Mesh(dialSphereGeom, dialMat);
    dialSphere.position.set(WX + 72, 1.7, WZ + 28);
    scene.add(dialSphere);
    objects.push(dialSphere);
    animatedMesh = dialSphere;
  }

  function addEildonHills(scene) {
    // Three distinctive volcanic peaks of the Eildon Hills
    var hillMat = new THREE.MeshLambertMaterial({ color: 0x6A8A6A });
    var hillDarkMat = new THREE.MeshLambertMaterial({ color: 0x4A6A4A });

    // North hill - tallest peak, box base + cone summit
    var hill1BaseGeom = new THREE.BoxGeometry(40, 20, 35);
    var hill1 = new THREE.Mesh(hill1BaseGeom, hillMat);
    hill1.position.set(WX - 60, 10, WZ - 80);
    scene.add(hill1);
    objects.push(hill1);

    var hill1TopGeom = new THREE.ConeGeometry(18, 22, 10);
    var hill1Top = new THREE.Mesh(hill1TopGeom, hillDarkMat);
    hill1Top.position.set(WX - 60, 31, WZ - 80);
    scene.add(hill1Top);
    objects.push(hill1Top);

    // Mid hill - second peak slightly lower
    var hill2BaseGeom = new THREE.BoxGeometry(35, 18, 30);
    var hill2 = new THREE.Mesh(hill2BaseGeom, hillMat);
    hill2.position.set(WX - 25, 9, WZ - 85);
    scene.add(hill2);
    objects.push(hill2);

    var hill2TopGeom = new THREE.ConeGeometry(15, 18, 10);
    var hill2Top = new THREE.Mesh(hill2TopGeom, hillDarkMat);
    hill2Top.position.set(WX - 25, 27, WZ - 85);
    scene.add(hill2Top);
    objects.push(hill2Top);

    // South hill - third, slightly smaller peak
    var hill3BaseGeom = new THREE.BoxGeometry(30, 15, 28);
    var hill3 = new THREE.Mesh(hill3BaseGeom, hillMat);
    hill3.position.set(WX - 45, 7.5, WZ - 60);
    scene.add(hill3);
    objects.push(hill3);

    var hill3TopGeom = new THREE.ConeGeometry(13, 15, 10);
    var hill3Top = new THREE.Mesh(hill3TopGeom, hillDarkMat);
    hill3Top.position.set(WX - 45, 22, WZ - 60);
    scene.add(hill3Top);
    objects.push(hill3Top);
  }

  function addTrimontiumFort(scene) {
    // Trimontium Roman fort at Newstead - rectangular marching camp outline
    var romanMat = new THREE.MeshLambertMaterial({ color: 0x9A8A7A });

    // Fort perimeter walls (box outlines for rectangular camp)
    // North wall
    var fortWallNGeom = new THREE.BoxGeometry(40, 2.5, 1.5);
    var fortWallN = new THREE.Mesh(fortWallNGeom, romanMat);
    fortWallN.position.set(WX + 130, 1.25, WZ - 20);
    scene.add(fortWallN);
    objects.push(fortWallN);

    // South wall
    var fortWallS = new THREE.Mesh(fortWallNGeom, romanMat);
    fortWallS.position.set(WX + 130, 1.25, WZ + 20);
    scene.add(fortWallS);
    objects.push(fortWallS);

    // East wall
    var fortWallEGeom = new THREE.BoxGeometry(1.5, 2.5, 40);
    var fortWallE = new THREE.Mesh(fortWallEGeom, romanMat);
    fortWallE.position.set(WX + 150, 1.25, WZ);
    scene.add(fortWallE);
    objects.push(fortWallE);

    // West wall
    var fortWallW = new THREE.Mesh(fortWallEGeom, romanMat);
    fortWallW.position.set(WX + 110, 1.25, WZ);
    scene.add(fortWallW);
    objects.push(fortWallW);

    // Corner watchtower stumps
    var watchMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
    var watchGeom = new THREE.BoxGeometry(3, 5, 3);
    var watchPos = [
      [WX + 110, WZ - 20],
      [WX + 150, WZ - 20],
      [WX + 110, WZ + 20],
      [WX + 150, WZ + 20]
    ];
    for (var wt = 0; wt < watchPos.length; wt++) {
      var watch = new THREE.Mesh(watchGeom, watchMat);
      watch.position.set(watchPos[wt][0], 2.5, watchPos[wt][1]);
      scene.add(watch);
      objects.push(watch);
    }

    // Gate gap / entrance markers (north and south gates)
    var gatePostMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
    var gatePostGeom = new THREE.BoxGeometry(1.2, 3.5, 1.2);

    // North gate posts
    var gateN1 = new THREE.Mesh(gatePostGeom, gatePostMat);
    gateN1.position.set(WX + 127, 1.75, WZ - 20);
    scene.add(gateN1);
    objects.push(gateN1);

    var gateN2 = new THREE.Mesh(gatePostGeom, gatePostMat);
    gateN2.position.set(WX + 133, 1.75, WZ - 20);
    scene.add(gateN2);
    objects.push(gateN2);

    // South gate posts
    var gateS1 = new THREE.Mesh(gatePostGeom, gatePostMat);
    gateS1.position.set(WX + 127, 1.75, WZ + 20);
    scene.add(gateS1);
    objects.push(gateS1);

    var gateS2 = new THREE.Mesh(gatePostGeom, gatePostMat);
    gateS2.position.set(WX + 133, 1.75, WZ + 20);
    scene.add(gateS2);
    objects.push(gateS2);

    // Praetorium (HQ building) ruin box inside fort
    var praetMat = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
    var praetGeom = new THREE.BoxGeometry(12, 2, 8);
    var praet = new THREE.Mesh(praetGeom, praetMat);
    praet.position.set(WX + 130, 1, WZ);
    scene.add(praet);
    objects.push(praet);

    // Roman road approach (flat stone strip)
    var roadMat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
    var roadGeom = new THREE.BoxGeometry(4, 0.2, 40);
    var road = new THREE.Mesh(roadGeom, roadMat);
    road.position.set(WX + 110, 0.1, WZ);
    scene.add(road);
    objects.push(road);
  }

  function addRiverTweed(scene) {
    // River Tweed meandering past the abbey - flat blue strip boxes
    var riverMat = new THREE.MeshLambertMaterial({ color: 0x4A6A8A });
    var river1Geom = new THREE.BoxGeometry(60, 0.2, 8);
    var river1 = new THREE.Mesh(river1Geom, riverMat);
    river1.position.set(WX + 20, 0.1, WZ + 25);
    scene.add(river1);
    objects.push(river1);

    var river2Geom = new THREE.BoxGeometry(8, 0.2, 30);
    var river2 = new THREE.Mesh(river2Geom, riverMat);
    river2.position.set(WX + 50, 0.1, WZ + 40);
    scene.add(river2);
    objects.push(river2);

    // Chain bridge crossing the Tweed
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
    var bridgeDeckGeom = new THREE.BoxGeometry(18, 0.6, 5);
    var bridgeDeck = new THREE.Mesh(bridgeDeckGeom, bridgeMat);
    bridgeDeck.position.set(WX + 20, 0.5, WZ + 25);
    scene.add(bridgeDeck);
    objects.push(bridgeDeck);

    // Bridge pylon boxes
    var pylonMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var pylonGeom = new THREE.BoxGeometry(1.5, 5, 1.5);
    var pylonPos = [
      [WX + 11.5, WZ + 25],
      [WX + 28.5, WZ + 25]
    ];
    for (var py = 0; py < pylonPos.length; py++) {
      var pylon = new THREE.Mesh(pylonGeom, pylonMat);
      pylon.position.set(pylonPos[py][0], 2.5, pylonPos[py][1]);
      scene.add(pylon);
      objects.push(pylon);
    }
  }

  function addTownBuildings(scene) {
    // Melrose town market square buildings
    var townMat = new THREE.MeshLambertMaterial({ color: 0xAA9A88 });
    var townDarkMat = new THREE.MeshLambertMaterial({ color: 0x887A6A });

    // Market Cross monument cylinder+box
    var crossBaseMat = new THREE.MeshLambertMaterial({ color: 0x999888 });
    var crossBaseGeom = new THREE.CylinderGeometry(1.5, 2.0, 1.2, 8);
    var crossBase = new THREE.Mesh(crossBaseGeom, crossBaseMat);
    crossBase.position.set(WX + 45, 0.6, WZ + 5);
    scene.add(crossBase);
    objects.push(crossBase);

    var crossShaftGeom = new THREE.BoxGeometry(0.6, 4, 0.6);
    var crossShaft = new THREE.Mesh(crossShaftGeom, crossBaseMat);
    crossShaft.position.set(WX + 45, 3.2, WZ + 5);
    scene.add(crossShaft);
    objects.push(crossShaft);

    // Row of town houses along the main street
    var houseGeom = new THREE.BoxGeometry(7, 7, 8);
    var roofGeom = new THREE.BoxGeometry(7.5, 1, 8.5);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (var th = 0; th < 5; th++) {
      var townHouse = new THREE.Mesh(houseGeom, (th % 2 === 0) ? townMat : townDarkMat);
      townHouse.position.set(WX + 38 + th * 7.5, 3.5, WZ + 50);
      scene.add(townHouse);
      objects.push(townHouse);

      var hRoof = new THREE.Mesh(roofGeom, roofMat);
      hRoof.position.set(WX + 38 + th * 7.5, 7.5, WZ + 50);
      scene.add(hRoof);
      objects.push(hRoof);
    }

    // Inn / hotel box
    var innGeom = new THREE.BoxGeometry(12, 9, 10);
    var innMat = new THREE.MeshLambertMaterial({ color: 0xB09A80 });
    var inn = new THREE.Mesh(innGeom, innMat);
    inn.position.set(WX + 50, 4.5, WZ - 35);
    scene.add(inn);
    objects.push(inn);

    // Inn sign post
    var signPostGeom = new THREE.CylinderGeometry(0.1, 0.1, 3, 6);
    var signMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
    var signPost = new THREE.Mesh(signPostGeom, signMat);
    signPost.position.set(WX + 44.5, 1.5, WZ - 30);
    scene.add(signPost);
    objects.push(signPost);

    var signBoardGeom = new THREE.BoxGeometry(2, 1, 0.2);
    var signBoard = new THREE.Mesh(signBoardGeom, signMat);
    signBoard.position.set(WX + 43.5, 3.2, WZ - 30);
    scene.add(signBoard);
    objects.push(signBoard);
  }

  function addLights(scene) {
    // Ambient warm Scottish sky
    var ambientLight = new THREE.AmbientLight(0xFFEECC, 0.55);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Abbey main flood
    var abbeyLight = new THREE.PointLight(0xFFDDAA, 1.3);
    abbeyLight.position.set(WX, 20, WZ);
    scene.add(abbeyLight);
    lights.push(abbeyLight);

    // Bruce's heart shrine candlelight
    var shrineLight = new THREE.PointLight(0xFFAA44, 0.8);
    shrineLight.position.set(WX + 1, 5, WZ + 1);
    scene.add(shrineLight);
    lights.push(shrineLight);

    // Abbotsford house light
    var abbotLight = new THREE.PointLight(0xFFCC88, 1.0);
    abbotLight.position.set(WX + 70, 14, WZ - 10);
    scene.add(abbotLight);
    lights.push(abbotLight);

    // Eildon Hills skylight
    var hillLight = new THREE.PointLight(0xAACC88, 0.6);
    hillLight.position.set(WX - 45, 40, WZ - 75);
    scene.add(hillLight);
    lights.push(hillLight);

    // Roman fort torch
    var fortLight = new THREE.PointLight(0xFF9944, 0.7);
    fortLight.position.set(WX + 130, 8, WZ);
    scene.add(fortLight);
    lights.push(fortLight);
  }

  function buildEnvironment(scene) {
    addMelroseAbbey(scene);
    addGargoyles(scene);
    addBrucesHeartMarker(scene);
    addAbbotsfords(scene);
    addEildonHills(scene);
    addTrimontiumFort(scene);
    addRiverTweed(scene);
    addTownBuildings(scene);
    addLights(scene);
  }

  function update(delta) {
    if (animatedMesh) {
      animatedMesh.rotation.y += delta * 0.25;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      objects[i].geometry.dispose();
      objects[i].material.dispose();
    }
    objects.length = 0;

    for (var j = 0; j < lights.length; j++) {
      if (lights[j].dispose) {
        lights[j].dispose();
      }
    }
    lights.length = 0;

    animatedMesh = null;
  }

  return {
    build: buildEnvironment,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
