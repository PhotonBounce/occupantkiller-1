window.PaisleyAbbey = (function() {
  'use strict';

  var WX = 2200;
  var WZ = 2200;

  var objects = [];
  var lights = [];
  var animatedMesh = null;

  function addPaisleyAbbey(scene) {
    // Main abbey nave - Norman/Gothic sandstone box 28x10x14
    var naveGeom = new THREE.BoxGeometry(28, 10, 14);
    var sandstoneMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var nave = new THREE.Mesh(naveGeom, sandstoneMat);
    nave.position.set(WX, 5, WZ - 20);
    scene.add(nave);
    objects.push(nave);

    // Massive square tower - 8x20x8
    var towerGeom = new THREE.BoxGeometry(8, 20, 8);
    var tower = new THREE.Mesh(towerGeom, sandstoneMat);
    tower.position.set(WX - 10, 10, WZ - 20);
    scene.add(tower);
    objects.push(tower);

    // Tower parapet cap
    var parapetGeom = new THREE.BoxGeometry(9, 1.5, 9);
    var parapet = new THREE.Mesh(parapetGeom, sandstoneMat);
    parapet.position.set(WX - 10, 20.75, WZ - 20);
    scene.add(parapet);
    objects.push(parapet);

    // South transept - Gothic window boxes (x3 lancet windows represented as inset boxes)
    var transeptGeom = new THREE.BoxGeometry(10, 12, 8);
    var transept = new THREE.Mesh(transeptGeom, sandstoneMat);
    transept.position.set(WX + 4, 6, WZ - 10);
    scene.add(transept);
    objects.push(transept);

    // Gothic window box 1 on south transept (dark interior recess)
    var winMat = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });
    var winGeom = new THREE.BoxGeometry(1.5, 4, 0.5);

    var win1 = new THREE.Mesh(winGeom, winMat);
    win1.position.set(WX + 1.5, 7, WZ - 6.3);
    scene.add(win1);
    objects.push(win1);

    var win2 = new THREE.Mesh(winGeom, winMat);
    win2.position.set(WX + 4, 7, WZ - 6.3);
    scene.add(win2);
    objects.push(win2);

    var win3 = new THREE.Mesh(winGeom, winMat);
    win3.position.set(WX + 6.5, 7, WZ - 6.3);
    scene.add(win3);
    objects.push(win3);

    // Nave clerestory windows (north side)
    var navWinGeom = new THREE.BoxGeometry(1.2, 2.5, 0.5);
    for (var nw = 0; nw < 4; nw++) {
      var navWin = new THREE.Mesh(navWinGeom, winMat);
      navWin.position.set(WX - 10 + nw * 6, 8, WZ - 27.3);
      scene.add(navWin);
      objects.push(navWin);
    }

    // Chancel - east end box
    var chancelGeom = new THREE.BoxGeometry(10, 9, 10);
    var chancel = new THREE.Mesh(chancelGeom, sandstoneMat);
    chancel.position.set(WX + 17, 4.5, WZ - 20);
    scene.add(chancel);
    objects.push(chancel);

    // Graveyard enclosure wall - four thin box sides
    var gravWallMat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
    var gwGeomN = new THREE.BoxGeometry(20, 1.5, 0.5);
    var gravWallN = new THREE.Mesh(gwGeomN, gravWallMat);
    gravWallN.position.set(WX + 5, 0.75, WZ - 5);
    scene.add(gravWallN);
    objects.push(gravWallN);

    var gravWallS = new THREE.Mesh(gwGeomN, gravWallMat);
    gravWallS.position.set(WX + 5, 0.75, WZ + 5);
    scene.add(gravWallS);
    objects.push(gravWallS);

    var gwGeomE = new THREE.BoxGeometry(0.5, 1.5, 10);
    var gravWallE = new THREE.Mesh(gwGeomE, gravWallMat);
    gravWallE.position.set(WX + 15, 0.75, WZ);
    scene.add(gravWallE);
    objects.push(gravWallE);

    var gravWallW = new THREE.Mesh(gwGeomE, gravWallMat);
    gravWallW.position.set(WX - 5, 0.75, WZ);
    scene.add(gravWallW);
    objects.push(gravWallW);

    // Grave marker boxes in graveyard
    var graveMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
    var graveGeom = new THREE.BoxGeometry(0.6, 1.2, 0.15);
    var gravePositions = [
      [WX, 0.6, WZ - 2],
      [WX + 2, 0.6, WZ - 2],
      [WX + 4, 0.6, WZ - 2],
      [WX + 6, 0.6, WZ - 2],
      [WX + 1, 0.6, WZ + 2],
      [WX + 3, 0.6, WZ + 2],
      [WX + 5, 0.6, WZ + 2]
    ];
    for (var g = 0; g < gravePositions.length; g++) {
      var grave = new THREE.Mesh(graveGeom, graveMat);
      grave.position.set(gravePositions[g][0], gravePositions[g][1], gravePositions[g][2]);
      scene.add(grave);
      objects.push(grave);
    }
  }

  function addCoatsChurch(scene) {
    // Coats Memorial Baptist Church - red sandstone box 18x10x16
    var churchMat = new THREE.MeshLambertMaterial({ color: 0xB05050 });
    var churchGeom = new THREE.BoxGeometry(18, 10, 16);
    var church = new THREE.Mesh(churchGeom, churchMat);
    church.position.set(WX + 40, 5, WZ + 10);
    scene.add(church);
    objects.push(church);

    // Drum cylinder base for dome
    var drumMat = new THREE.MeshLambertMaterial({ color: 0x9A4040 });
    var drumGeom = new THREE.CylinderGeometry(5, 5, 4, 16);
    var drum = new THREE.Mesh(drumGeom, drumMat);
    drum.position.set(WX + 40, 12, WZ + 10);
    scene.add(drum);
    objects.push(drum);

    // Huge dome on drum - sphere r=7
    var domeMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var domeGeom = new THREE.SphereGeometry(7, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    var dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.set(WX + 40, 14, WZ + 10);
    scene.add(dome);
    objects.push(dome);

    // Decorated lantern tower on dome apex
    var lanternGeom = new THREE.BoxGeometry(3, 5, 3);
    var lanternMat = new THREE.MeshLambertMaterial({ color: 0xB06040 });
    var lantern = new THREE.Mesh(lanternGeom, lanternMat);
    lantern.position.set(WX + 40, 22, WZ + 10);
    scene.add(lantern);
    objects.push(lantern);

    // Lantern cone cap
    var lanternCapGeom = new THREE.ConeGeometry(2.2, 3, 8);
    var lanternCap = new THREE.Mesh(lanternCapGeom, lanternMat);
    lanternCap.position.set(WX + 40, 26, WZ + 10);
    scene.add(lanternCap);
    objects.push(lanternCap);

    // Front portico columns - cylinders
    var colMat = new THREE.MeshLambertMaterial({ color: 0x9A4040 });
    var colGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var colOffsets = [-6, -2, 2, 6];
    for (var c = 0; c < colOffsets.length; c++) {
      var col = new THREE.Mesh(colGeom, colMat);
      col.position.set(WX + 40 + colOffsets[c], 4, WZ + 18.5);
      scene.add(col);
      objects.push(col);
    }

    // Steps approach box
    var stepsGeom = new THREE.BoxGeometry(14, 1, 4);
    var stepsMat = new THREE.MeshLambertMaterial({ color: 0x884040 });
    var steps = new THREE.Mesh(stepsGeom, stepsMat);
    steps.position.set(WX + 40, 0.5, WZ + 21);
    scene.add(steps);
    objects.push(steps);

    // Flanking corner turrets
    var turretGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
    var turretMat = new THREE.MeshLambertMaterial({ color: 0xA04848 });
    var turretPositions = [
      [WX + 31, 6, WZ + 2],
      [WX + 49, 6, WZ + 2],
      [WX + 31, 6, WZ + 18],
      [WX + 49, 6, WZ + 18]
    ];
    for (var t = 0; t < turretPositions.length; t++) {
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(turretPositions[t][0], turretPositions[t][1], turretPositions[t][2]);
      scene.add(turret);
      objects.push(turret);
    }
  }

  function addCoatsThreadMill(scene) {
    // Main mill building - massive Victorian industrial box
    var millMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
    var mill1Geom = new THREE.BoxGeometry(40, 12, 20);
    var mill1 = new THREE.Mesh(mill1Geom, millMat);
    mill1.position.set(WX - 50, 6, WZ + 20);
    scene.add(mill1);
    objects.push(mill1);

    // Second mill wing
    var mill2Geom = new THREE.BoxGeometry(24, 10, 30);
    var mill2 = new THREE.Mesh(mill2Geom, millMat);
    mill2.position.set(WX - 50, 5, WZ - 5);
    scene.add(mill2);
    objects.push(mill2);

    // Warehouse/despatch block
    var warehouseGeom = new THREE.BoxGeometry(18, 8, 14);
    var warehouse = new THREE.Mesh(warehouseGeom, millMat);
    warehouse.position.set(WX - 75, 4, WZ + 10);
    scene.add(warehouse);
    objects.push(warehouse);

    // Tall chimney 1
    var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x5A4A4A });
    var chimney1Geom = new THREE.CylinderGeometry(1.2, 1.8, 28, 10);
    var chimney1 = new THREE.Mesh(chimney1Geom, chimneyMat);
    chimney1.position.set(WX - 45, 14, WZ + 15);
    scene.add(chimney1);
    objects.push(chimney1);

    // Tall chimney 2
    var chimney2Geom = new THREE.CylinderGeometry(1.0, 1.6, 24, 10);
    var chimney2 = new THREE.Mesh(chimney2Geom, chimneyMat);
    chimney2.position.set(WX - 60, 12, WZ + 22);
    scene.add(chimney2);
    objects.push(chimney2);

    // Cooling tower cone 1
    var coolMat = new THREE.MeshLambertMaterial({ color: 0x787878 });
    var coolGeom = new THREE.ConeGeometry(5, 14, 12);
    var cool1 = new THREE.Mesh(coolGeom, coolMat);
    cool1.position.set(WX - 72, 7, WZ + 25);
    scene.add(cool1);
    objects.push(cool1);

    // Cooling tower cone 2
    var cool2 = new THREE.Mesh(coolGeom, coolMat);
    cool2.position.set(WX - 80, 7, WZ + 25);
    scene.add(cool2);
    objects.push(cool2);

    // Mill roof ridge boxes
    var ridgeMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var ridgeGeom = new THREE.BoxGeometry(40, 1, 2);
    var ridge1 = new THREE.Mesh(ridgeGeom, ridgeMat);
    ridge1.position.set(WX - 50, 12.5, WZ + 20);
    scene.add(ridge1);
    objects.push(ridge1);

    // Workers terrace housing row - 6 terraced house boxes
    var terraceMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
    var houseGeom = new THREE.BoxGeometry(6, 6, 8);
    for (var h = 0; h < 6; h++) {
      var house = new THREE.Mesh(houseGeom, terraceMat);
      house.position.set(WX - 35 + h * 6.5, 3, WZ + 45);
      scene.add(house);
      objects.push(house);
    }

    // Terrace roof boxes
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var roofGeom = new THREE.BoxGeometry(6, 1, 8);
    for (var hr = 0; hr < 6; hr++) {
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(WX - 35 + hr * 6.5, 6.5, WZ + 45);
      scene.add(roof);
      objects.push(roof);
    }

    // Mill gate pillars
    var pillarMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var pillarGeom = new THREE.BoxGeometry(1.5, 5, 1.5);

    var pillarL = new THREE.Mesh(pillarGeom, pillarMat);
    pillarL.position.set(WX - 28, 2.5, WZ + 8);
    scene.add(pillarL);
    objects.push(pillarL);

    var pillarR = new THREE.Mesh(pillarGeom, pillarMat);
    pillarR.position.set(WX - 32, 2.5, WZ + 8);
    scene.add(pillarR);
    objects.push(pillarR);
  }

  function addRiverCartBridge(scene) {
    // Stone bridge deck - 20x3x5
    var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
    var bridgeGeom = new THREE.BoxGeometry(20, 3, 5);
    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(WX - 10, 1.5, WZ + 32);
    scene.add(bridge);
    objects.push(bridge);

    // Bridge pier supports - 4 box piers
    var pierMat = new THREE.MeshLambertMaterial({ color: 0x7A7868 });
    var pierGeom = new THREE.BoxGeometry(2.5, 4, 4);
    var pierOffsets = [-7, -2, 2, 7];
    for (var p = 0; p < pierOffsets.length; p++) {
      var pier = new THREE.Mesh(pierGeom, pierMat);
      pier.position.set(WX - 10 + pierOffsets[p], -0.5, WZ + 32);
      scene.add(pier);
      objects.push(pier);
    }

    // Bridge parapet walls
    var bParapetMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var bParapetGeom = new THREE.BoxGeometry(20, 1, 0.5);

    var bParapetN = new THREE.Mesh(bParapetGeom, bParapetMat);
    bParapetN.position.set(WX - 10, 3.5, WZ + 29.5);
    scene.add(bParapetN);
    objects.push(bParapetN);

    var bParapetS = new THREE.Mesh(bParapetGeom, bParapetMat);
    bParapetS.position.set(WX - 10, 3.5, WZ + 34.5);
    scene.add(bParapetS);
    objects.push(bParapetS);
  }

  function addTownSquareTiles(scene) {
    // Paisley pattern floor tiles: alternating dark/light strips
    var darkMat = new THREE.MeshLambertMaterial({ color: 0x9A6A4A });
    var lightMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
    var stripGeom = new THREE.BoxGeometry(2, 0.15, 20);

    for (var ts = 0; ts < 14; ts++) {
      var mat = (ts % 2 === 0) ? darkMat : lightMat;
      var strip = new THREE.Mesh(stripGeom, mat);
      strip.position.set(WX + 22 + ts * 2.1, 0.075, WZ + 10);
      scene.add(strip);
      objects.push(strip);
    }

    // Cross strips (perpendicular) for tessellated effect
    var stripGeom2 = new THREE.BoxGeometry(28, 0.12, 2);
    for (var ts2 = 0; ts2 < 8; ts2++) {
      var mat2 = (ts2 % 2 === 0) ? lightMat : darkMat;
      var strip2 = new THREE.Mesh(stripGeom2, mat2);
      strip2.position.set(WX + 29, 0.06, WZ + 1 + ts2 * 2.5);
      scene.add(strip2);
      objects.push(strip2);
    }

    // Central fountain/monument cylinder in town square
    var fountainMat = new THREE.MeshLambertMaterial({ color: 0xAA9A88 });
    var fountainBaseGeom = new THREE.CylinderGeometry(3, 3.5, 1, 12);
    var fountainBase = new THREE.Mesh(fountainBaseGeom, fountainMat);
    fountainBase.position.set(WX + 29, 0.5, WZ + 10);
    scene.add(fountainBase);
    objects.push(fountainBase);

    var fountainShaftGeom = new THREE.CylinderGeometry(0.6, 0.8, 4, 8);
    var fountainShaft = new THREE.Mesh(fountainShaftGeom, fountainMat);
    fountainShaft.position.set(WX + 29, 3, WZ + 10);
    scene.add(fountainShaft);
    objects.push(fountainShaft);

    var fountainTopGeom = new THREE.SphereGeometry(1, 8, 6);
    var fountainTop = new THREE.Mesh(fountainTopGeom, fountainMat);
    fountainTop.position.set(WX + 29, 5.5, WZ + 10);
    scene.add(fountainTop);
    objects.push(fountainTop);
    animatedMesh = fountainTop;
  }

  function addLights(scene) {
    // Warm sandstone ambient
    var ambientLight = new THREE.AmbientLight(0xFFE8CC, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Abbey floodlight
    var abbeyLight = new THREE.PointLight(0xFFEEAA, 1.2);
    abbeyLight.position.set(WX, 18, WZ - 20);
    scene.add(abbeyLight);
    lights.push(abbeyLight);

    // Church dome light
    var churchLight = new THREE.PointLight(0xFF9988, 1.0);
    churchLight.position.set(WX + 40, 20, WZ + 10);
    scene.add(churchLight);
    lights.push(churchLight);

    // Mill industrial light
    var millLight = new THREE.PointLight(0xCC8866, 0.8);
    millLight.position.set(WX - 50, 14, WZ + 20);
    scene.add(millLight);
    lights.push(millLight);

    // Town square light
    var squareLight = new THREE.PointLight(0xFFDDAA, 0.9);
    squareLight.position.set(WX + 29, 8, WZ + 10);
    scene.add(squareLight);
    lights.push(squareLight);
  }

  function buildEnvironment(scene) {
    addPaisleyAbbey(scene);
    addCoatsChurch(scene);
    addCoatsThreadMill(scene);
    addRiverCartBridge(scene);
    addTownSquareTiles(scene);
    addLights(scene);
  }

  function update(delta) {
    if (animatedMesh) {
      animatedMesh.rotation.y += delta * 0.3;
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
