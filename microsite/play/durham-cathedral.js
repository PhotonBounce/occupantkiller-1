window.DurhamCathedral = (function() {
  'use strict';

  var WX = 2680;
  var WZ = 2200;

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = makeMesh(geo, color);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mesh = makeMesh(geo, color);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mesh = makeMesh(geo, color);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mesh = makeMesh(geo, color);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeWireframe(geometry, color, x, y, z) {
    var mat = new THREE.LineBasicMaterial({ color: color });
    var edges = new THREE.EdgesGeometry(geometry);
    var line = new THREE.LineSegments(edges, mat);
    line.position.set(x, y, z);
    return line;
  }

  function buildCathedralNave(group) {
    // Main nave body — massive Norman Romanesque
    var nave = makeBox(40, 18, 16, 0xD4A97A, WX, 9, WZ);
    group.add(nave);

    // Nave roof ridge
    var naveRoof = makeBox(40, 3, 4, 0xB8905A, WX, 19.5, WZ);
    group.add(naveRoof);

    // Transept (cross arms)
    var transeptN = makeBox(12, 16, 10, 0xD4A97A, WX, 8, WZ - 12);
    group.add(transeptN);

    var transeptS = makeBox(12, 16, 10, 0xD4A97A, WX, 8, WZ + 12);
    group.add(transeptS);

    // Choir/chancel extending east
    var choir = makeBox(20, 16, 14, 0xD4A97A, WX + 25, 8, WZ);
    group.add(choir);

    // Choir roof
    var choirRoof = makeBox(20, 3, 4, 0xB8905A, WX + 25, 17, WZ);
    group.add(choirRoof);
  }

  function buildWestTowers(group) {
    // Twin west towers — cylinders with cone spires
    var towerNW = makeCylinder(4, 4, 28, 12, 0xD4A97A, WX - 16, 14, WZ - 7);
    group.add(towerNW);

    var spireNW = makeCone(4, 14, 12, 0xB8905A, WX - 16, 35, WZ - 7);
    group.add(spireNW);

    var towerSW = makeCylinder(4, 4, 28, 12, 0xD4A97A, WX - 16, 14, WZ + 7);
    group.add(towerSW);

    var spireSW = makeCone(4, 14, 12, 0xB8905A, WX - 16, 35, WZ + 7);
    group.add(spireSW);

    // West window recess detail
    var westWindow = makeBox(6, 10, 1, 0x5A4A3A, WX - 20, 12, WZ);
    group.add(westWindow);
  }

  function buildCentralTower(group) {
    // Massive central tower — landmark of Durham
    var centralTower = makeBox(8, 32, 8, 0xD4A97A, WX, 25, WZ);
    group.add(centralTower);

    // Central tower battlements cap
    var battlementN = makeBox(2, 2, 8, 0xC49060, WX - 3, 42, WZ);
    group.add(battlementN);
    var battlementS = makeBox(2, 2, 8, 0xC49060, WX + 3, 42, WZ);
    group.add(battlementS);
    var battlementW = makeBox(8, 2, 2, 0xC49060, WX, 42, WZ - 3);
    group.add(battlementW);
    var battlementE = makeBox(8, 2, 2, 0xC49060, WX, 42, WZ + 3);
    group.add(battlementE);

    // Central tower corner turrets
    var turretNW = makeCylinder(1, 1, 6, 8, 0xD4A97A, WX - 4, 44, WZ - 4);
    group.add(turretNW);
    var capNW = makeCone(1, 3, 8, 0xB8905A, WX - 4, 50, WZ - 4);
    group.add(capNW);

    var turretNE = makeCylinder(1, 1, 6, 8, 0xD4A97A, WX + 4, 44, WZ - 4);
    group.add(turretNE);
    var capNE = makeCone(1, 3, 8, 0xB8905A, WX + 4, 50, WZ - 4);
    group.add(capNE);

    var turretSW = makeCylinder(1, 1, 6, 8, 0xD4A97A, WX - 4, 44, WZ + 4);
    group.add(turretSW);
    var capSW = makeCone(1, 3, 8, 0xB8905A, WX - 4, 50, WZ + 4);
    group.add(capSW);

    var turretSE = makeCylinder(1, 1, 6, 8, 0xD4A97A, WX + 4, 44, WZ + 4);
    group.add(turretSE);
    var capSE = makeCone(1, 3, 8, 0xB8905A, WX + 4, 50, WZ + 4);
    group.add(capSE);
  }

  function buildFlyingButtresses(group) {
    // Flying buttresses on north and south flanks
    var i;
    var offsets = [-6, 0, 6];

    for (i = 0; i < offsets.length; i++) {
      // North side buttresses
      var buttNBase = makeBox(2, 14, 3, 0xC8A068, WX + offsets[i], 7, WZ - 12);
      group.add(buttNBase);
      var buttNArm = makeBox(4, 2, 2, 0xC8A068, WX + offsets[i], 14, WZ - 10);
      group.add(buttNArm);

      // South side buttresses
      var buttSBase = makeBox(2, 14, 3, 0xC8A068, WX + offsets[i], 7, WZ + 12);
      group.add(buttSBase);
      var buttSArm = makeBox(4, 2, 2, 0xC8A068, WX + offsets[i], 14, WZ + 10);
      group.add(buttSArm);
    }
  }

  function buildSanctuaryKnocker(group) {
    // Main door box on west face
    var door = makeBox(3, 5, 0.5, 0x3A2810, WX - 20, 5, WZ);
    group.add(door);

    // Sanctuary Knocker — famous bronze lion-head ring
    // The ring itself as a torus approximated with small boxes arranged in arc
    var knockerBase = makeSphere(0.6, 8, 8, 0x8B6914, WX - 20.3, 6, WZ);
    group.add(knockerBase);

    // Ring arc approximation with small sphere segments
    var ringTop = makeSphere(0.2, 6, 6, 0xB8860B, WX - 20.4, 7, WZ);
    group.add(ringTop);
    var ringLeft = makeSphere(0.2, 6, 6, 0xB8860B, WX - 20.4, 6.5, WZ - 0.4);
    group.add(ringLeft);
    var ringRight = makeSphere(0.2, 6, 6, 0xB8860B, WX - 20.4, 6.5, WZ + 0.4);
    group.add(ringRight);
    var ringBot = makeSphere(0.2, 6, 6, 0xB8860B, WX - 20.4, 6, WZ);
    group.add(ringBot);
  }

  function buildMinersMemorial(group) {
    // Stone cross in nave for Durham miners — simple cross boxes
    var crossVert = makeBox(0.4, 4, 0.4, 0x707070, WX + 5, 2, WZ);
    group.add(crossVert);
    var crossHoriz = makeBox(2, 0.4, 0.4, 0x707070, WX + 5, 3.5, WZ);
    group.add(crossHoriz);
    var crossBase = makeBox(0.8, 0.4, 0.8, 0x707070, WX + 5, 0.2, WZ);
    group.add(crossBase);
  }

  function buildCastle(group) {
    // Durham Castle (Palace Green) — Norman castle north-west of cathedral
    var castleX = WX - 32;
    var castleZ = WZ - 18;

    // Main castle body
    var castleMain = makeBox(18, 14, 14, 0x9A8A78, castleX, 7, castleZ);
    group.add(castleMain);

    // Castle corner towers
    var ctNW = makeCylinder(2, 2, 16, 8, 0x9A8A78, castleX - 8, 8, castleZ - 6);
    group.add(ctNW);
    var capCNW = makeCone(2, 5, 8, 0x7A6A58, castleX - 8, 18, castleZ - 6);
    group.add(capCNW);

    var ctNE = makeCylinder(2, 2, 16, 8, 0x9A8A78, castleX + 8, 8, castleZ - 6);
    group.add(ctNE);
    var capCNE = makeCone(2, 5, 8, 0x7A6A58, castleX + 8, 18, castleZ - 6);
    group.add(capCNE);

    var ctSW = makeCylinder(2, 2, 16, 8, 0x9A8A78, castleX - 8, 8, castleZ + 6);
    group.add(ctSW);
    var capCSW = makeCone(2, 5, 8, 0x7A6A58, castleX - 8, 18, castleZ + 6);
    group.add(capCSW);

    var ctSE = makeCylinder(2, 2, 16, 8, 0x9A8A78, castleX + 8, 8, castleZ + 6);
    group.add(ctSE);
    var capCSE = makeCone(2, 5, 8, 0x7A6A58, castleX + 8, 18, castleZ + 6);
    group.add(capCSE);

    // Motte (earthen mound) for round keep
    var motte = makeCylinder(6, 8, 6, 12, 0x5A5040, castleX - 2, 3, castleZ - 20);
    group.add(motte);

    // Round keep on motte
    var keep = makeCylinder(4, 4, 10, 12, 0x9A8A78, castleX - 2, 11, castleZ - 20);
    group.add(keep);
    var keepCap = makeCone(4, 5, 12, 0x7A6A58, castleX - 2, 18, castleZ - 20);
    group.add(keepCap);

    // Gatehouse
    var gatehouse = makeBox(6, 12, 8, 0x9A8A78, castleX + 10, 6, castleZ + 2);
    group.add(gatehouse);
    var gateArch = makeBox(2, 5, 8, 0x2A2018, castleX + 10, 3, castleZ + 2);
    group.add(gateArch);

    // Gatehouse towers
    var gtL = makeCylinder(1.5, 1.5, 14, 8, 0x9A8A78, castleX + 7, 7, castleZ + 2);
    group.add(gtL);
    var gtR = makeCylinder(1.5, 1.5, 14, 8, 0x9A8A78, castleX + 13, 7, castleZ + 2);
    group.add(gtR);

    // Castle curtain wall
    var wallN = makeBox(18, 8, 1, 0x9A8A78, castleX, 4, castleZ - 7);
    group.add(wallN);
    var wallS = makeBox(18, 8, 1, 0x9A8A78, castleX, 4, castleZ + 7);
    group.add(wallS);
    var wallW = makeBox(1, 8, 14, 0x9A8A78, castleX - 9, 4, castleZ);
    group.add(wallW);
  }

  function buildRiverWear(group) {
    // River Wear gorge wraps around cathedral peninsula on 3 sides
    // North gorge water
    var waterN = makeBox(100, 3, 20, 0x1A6B8A, WX, -1.5, WZ - 50);
    group.add(waterN);

    // South gorge water
    var waterS = makeBox(100, 3, 20, 0x1A6B8A, WX, -1.5, WZ + 50);
    group.add(waterS);

    // West gorge water (river bends west)
    var waterW = makeBox(20, 3, 100, 0x1A6B8A, WX - 60, -1.5, WZ);
    group.add(waterW);

    // Gorge walls — steep wooded sides (dark green box masses)
    // North gorge wall
    var gorgeWallN = makeBox(100, 20, 8, 0x1A3A10, WX, 10, WZ - 44);
    group.add(gorgeWallN);

    // South gorge wall
    var gorgeWallS = makeBox(100, 20, 8, 0x1A3A10, WX, 10, WZ + 44);
    group.add(gorgeWallS);

    // West gorge wall
    var gorgeWallW = makeBox(8, 20, 100, 0x1A3A10, WX - 54, 10, WZ);
    group.add(gorgeWallW);

    // Tree canopy masses on gorge walls
    var treesN1 = makeBox(30, 8, 6, 0x2A5A18, WX - 20, 22, WZ - 44);
    group.add(treesN1);
    var treesN2 = makeBox(30, 10, 6, 0x1E4A12, WX + 20, 22, WZ - 44);
    group.add(treesN2);
    var treesS1 = makeBox(30, 8, 6, 0x2A5A18, WX - 20, 22, WZ + 44);
    group.add(treesS1);
    var treesS2 = makeBox(30, 10, 6, 0x1E4A12, WX + 20, 22, WZ + 44);
    group.add(treesS2);
    var treesW1 = makeBox(6, 8, 30, 0x2A5A18, WX - 54, 22, WZ - 20);
    group.add(treesW1);
    var treesW2 = makeBox(6, 10, 30, 0x1E4A12, WX - 54, 22, WZ + 20);
    group.add(treesW2);
  }

  function buildFramwellgateBridge(group) {
    // Medieval Framwellgate Bridge crossing River Wear to the west
    var bridgeX = WX - 62;
    var bridgeZ = WZ;

    // Main bridge deck
    var bridgeDeck = makeBox(25, 3, 5, 0x9A8A78, bridgeX, 1.5, bridgeZ);
    group.add(bridgeDeck);

    // Two arch piers supporting the bridge
    var pier1 = makeBox(3, 5, 5, 0x8A7A68, bridgeX - 7, -1, bridgeZ);
    group.add(pier1);
    var pier2 = makeBox(3, 5, 5, 0x8A7A68, bridgeX + 7, -1, bridgeZ);
    group.add(pier2);

    // Arch opening cutout hints (dark boxes under deck between piers)
    var arch1 = makeBox(4, 2, 5, 0x2A1A0A, bridgeX - 3.5, 0, bridgeZ);
    group.add(arch1);
    var arch2 = makeBox(4, 2, 5, 0x2A1A0A, bridgeX + 3.5, 0, bridgeZ);
    group.add(arch2);

    // Bridge parapet walls
    var paraL = makeBox(25, 2, 0.5, 0x9A8A78, bridgeX, 3.5, bridgeZ - 2.5);
    group.add(paraL);
    var paraR = makeBox(25, 2, 0.5, 0x9A8A78, bridgeX, 3.5, bridgeZ + 2.5);
    group.add(paraR);

    // Bridge towers (medieval gateway towers)
    var btL = makeBox(4, 8, 6, 0x9A8A78, bridgeX - 14, 4, bridgeZ);
    group.add(btL);
    var btR = makeBox(4, 8, 6, 0x9A8A78, bridgeX + 14, 4, bridgeZ);
    group.add(btR);
  }

  function buildPalaceGreen(group) {
    // Palace Green — open ground between cathedral and castle
    var green = makeBox(28, 0.3, 24, 0x3A6A28, WX - 16, 0.15, WZ - 4);
    group.add(green);

    // Cathedral Close — grassed area east of nave
    var closeGrass = makeBox(30, 0.3, 30, 0x386028, WX + 20, 0.15, WZ);
    group.add(closeGrass);
  }

  function buildPeninsulaGround(group) {
    // Peninsula ground level
    var ground = makeBox(90, 0.5, 90, 0x4A6A30, WX, -0.25, WZ);
    group.add(ground);
  }

  function buildEdgeWireframes(group) {
    // Add LineSegments wireframe outlines on key structural elements
    var cathedralGeo = new THREE.BoxGeometry(40, 18, 16);
    var cathedralWire = makeWireframe(cathedralGeo, 0xA07848, WX, 9, WZ);
    group.add(cathedralWire);

    var centralTowerGeo = new THREE.BoxGeometry(8, 32, 8);
    var centralTowerWire = makeWireframe(centralTowerGeo, 0xA07848, WX, 25, WZ);
    group.add(centralTowerWire);

    var castleGeo = new THREE.BoxGeometry(18, 14, 14);
    var castleWire = makeWireframe(castleGeo, 0x887060, WX - 32, 7, WZ - 18);
    group.add(castleWire);
  }

  function create(scene) {
    var group = new THREE.Group();

    buildPeninsulaGround(group);
    buildPalaceGreen(group);
    buildCathedralNave(group);
    buildWestTowers(group);
    buildCentralTower(group);
    buildFlyingButtresses(group);
    buildSanctuaryKnocker(group);
    buildMinersMemorial(group);
    buildCastle(group);
    buildRiverWear(group);
    buildFramwellgateBridge(group);
    buildEdgeWireframes(group);

    scene.add(group);
    return group;
  }

  function getWorldPosition() {
    return { x: WX, z: WZ };
  }

  function getLabel() {
    return 'Durham Cathedral & Castle — UNESCO World Heritage Site';
  }

  return {
    create: create,
    getWorldPosition: getWorldPosition,
    getLabel: getLabel
  };

}());
