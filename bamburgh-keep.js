window.BamburghKeep = (function() {
  'use strict';

  var WX = 2710;
  var WZ = 2200;

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    return mesh;
  }

  function makeEdges(mesh) {
    var edges = new THREE.EdgesGeometry(mesh.geometry);
    var mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.copy(mesh.position);
    return lines;
  }

  function buildRock(group) {
    // Main basalt volcanic rock base
    var rock = makeBox(40, 8, 20, 0x4A4A4A, 0, 4, 0);
    group.add(rock);
    // Rock outcrops
    var r1 = makeBox(14, 4, 8, 0x3A3A3A, -18, 2, -5);
    group.add(r1);
    var r2 = makeBox(10, 3, 6, 0x3A3A3A, 18, 1.5, 3);
    group.add(r2);
    var r3 = makeBox(8, 5, 10, 0x424242, -12, 2.5, 8);
    group.add(r3);
    var r4 = makeBox(20, 3, 8, 0x404040, 5, 1.5, -12);
    group.add(r4);
  }

  function buildKeep(group) {
    // Square Norman keep
    var keep = makeBox(14, 20, 14, 0xD4A97A, 0, 18, 0);
    group.add(keep);
    group.add(makeEdges(keep));

    // Keep battlements top
    var b1 = makeBox(2, 2, 1, 0xC49A6A, -5, 29, -7);
    group.add(b1);
    var b2 = makeBox(2, 2, 1, 0xC49A6A, -1, 29, -7);
    group.add(b2);
    var b3 = makeBox(2, 2, 1, 0xC49A6A, 3, 29, -7);
    group.add(b3);
    var b4 = makeBox(2, 2, 1, 0xC49A6A, -5, 29, 7);
    group.add(b4);
    var b5 = makeBox(2, 2, 1, 0xC49A6A, -1, 29, 7);
    group.add(b5);
    var b6 = makeBox(2, 2, 1, 0xC49A6A, 3, 29, 7);
    group.add(b6);
    var b7 = makeBox(1, 2, 2, 0xC49A6A, -7, 29, -3);
    group.add(b7);
    var b8 = makeBox(1, 2, 2, 0xC49A6A, -7, 29, 1);
    group.add(b8);
    var b9 = makeBox(1, 2, 2, 0xC49A6A, 7, 29, -3);
    group.add(b9);
    var b10 = makeBox(1, 2, 2, 0xC49A6A, 7, 29, 1);
    group.add(b10);

    // Keep windows (dark recesses)
    var w1 = makeBox(1.5, 2.5, 0.5, 0x2A1A0A, -3, 16, -7.1);
    group.add(w1);
    var w2 = makeBox(1.5, 2.5, 0.5, 0x2A1A0A, 3, 16, -7.1);
    group.add(w2);
    var w3 = makeBox(1.5, 2.5, 0.5, 0x2A1A0A, -3, 22, -7.1);
    group.add(w3);
    var w4 = makeBox(1.5, 2.5, 0.5, 0x2A1A0A, 3, 22, -7.1);
    group.add(w4);
  }

  function buildCurtainWalls(group) {
    // North wall
    var wn = makeBox(36, 10, 2, 0xC49A6A, 0, 13, -14);
    group.add(wn);
    // South wall
    var ws = makeBox(36, 10, 2, 0xC49A6A, 0, 13, 14);
    group.add(ws);
    // East wall
    var we = makeBox(2, 10, 28, 0xC49A6A, 18, 13, 0);
    group.add(we);
    // West wall
    var ww = makeBox(2, 10, 28, 0xC49A6A, -18, 13, 0);
    group.add(ww);

    // Battlements on north wall
    var i;
    for (i = 0; i < 6; i++) {
      var bn = makeBox(2, 2, 1, 0xB88A5A, -12 + i * 5, 19, -14);
      group.add(bn);
    }
    // Battlements on south wall
    for (i = 0; i < 6; i++) {
      var bs = makeBox(2, 2, 1, 0xB88A5A, -12 + i * 5, 19, 14);
      group.add(bs);
    }
    // Battlements on east wall
    for (i = 0; i < 5; i++) {
      var be = makeBox(1, 2, 2, 0xB88A5A, 18, 19, -10 + i * 5);
      group.add(be);
    }
    // Battlements on west wall
    for (i = 0; i < 5; i++) {
      var bw = makeBox(1, 2, 2, 0xB88A5A, -18, 19, -10 + i * 5);
      group.add(bw);
    }
  }

  function buildCornerTowers(group) {
    // NW tower
    var tnw = makeCylinder(3, 3.5, 14, 8, 0xD4A97A, -18, 15, -14);
    group.add(tnw);
    var cnw = makeCone(3.2, 4, 8, 0x8B6A4A, -18, 23, -14);
    group.add(cnw);

    // NE tower
    var tne = makeCylinder(3, 3.5, 14, 8, 0xD4A97A, 18, 15, -14);
    group.add(tne);
    var cne = makeCone(3.2, 4, 8, 0x8B6A4A, 18, 23, -14);
    group.add(cne);

    // SW tower
    var tsw = makeCylinder(3, 3.5, 14, 8, 0xD4A97A, -18, 15, 14);
    group.add(tsw);
    var csw = makeCone(3.2, 4, 8, 0x8B6A4A, -18, 23, 14);
    group.add(csw);

    // SE tower
    var tse = makeCylinder(3, 3.5, 14, 8, 0xD4A97A, 18, 15, 14);
    group.add(tse);
    var cse = makeCone(3.2, 4, 8, 0x8B6A4A, 18, 23, 14);
    group.add(cse);
  }

  function buildBeach(group) {
    // Wide sandy beach stretching south
    var beach1 = makeBox(80, 0.5, 40, 0xD4B483, 10, 0.25, 50);
    group.add(beach1);
    var beach2 = makeBox(100, 0.5, 30, 0xD4C490, 5, 0.25, 85);
    group.add(beach2);
    var beach3 = makeBox(90, 0.5, 20, 0xD4B483, 0, 0.25, 110);
    group.add(beach3);

    // Sand dunes
    var d1 = makeBox(12, 3, 6, 0xC8A870, -20, 1.5, 45);
    group.add(d1);
    var d2 = makeBox(8, 2, 5, 0xC8A870, 15, 1, 52);
    group.add(d2);
    var d3 = makeBox(10, 4, 7, 0xC0A060, -30, 2, 60);
    group.add(d3);
    var d4 = makeBox(15, 2.5, 5, 0xC8A870, 30, 1.25, 48);
    group.add(d4);
    var d5 = makeBox(9, 3, 6, 0xBE9E5A, 5, 1.5, 70);
    group.add(d5);
    var d6 = makeBox(11, 2, 8, 0xC8A870, -15, 1, 80);
    group.add(d6);
  }

  function buildNorthSea(group) {
    // North Sea — blue-grey water stretching east
    var sea1 = makeBox(100, 0.4, 60, 0x1A4A6A, 70, 0.2, -20);
    group.add(sea1);
    var sea2 = makeBox(80, 0.4, 50, 0x1E4E70, 110, 0.2, 10);
    group.add(sea2);
    var sea3 = makeBox(120, 0.4, 40, 0x1A4A6A, 80, 0.2, -50);
    group.add(sea3);
    var sea4 = makeBox(60, 0.4, 80, 0x1C4C6C, 130, 0.2, -30);
    group.add(sea4);
    // Waves (lighter patches)
    var w1 = makeBox(20, 0.3, 3, 0x2A6A8A, 60, 0.35, -10);
    group.add(w1);
    var w2 = makeBox(18, 0.3, 2, 0x2A6A8A, 80, 0.35, 5);
    group.add(w2);
    var w3 = makeBox(25, 0.3, 3, 0x2A6A8A, 50, 0.35, -30);
    group.add(w3);
  }

  function buildFarneIslands(group) {
    // Farne Islands cluster — dark basalt offshore
    var fi1 = makeBox(10, 2, 8, 0x4A4A4A, 90, 1, -60);
    group.add(fi1);
    var fi2 = makeBox(7, 3, 5, 0x3A3A3A, 105, 1.5, -55);
    group.add(fi2);
    var fi3 = makeBox(12, 2, 9, 0x4A4A4A, 118, 1, -70);
    group.add(fi3);
    var fi4 = makeBox(6, 1.5, 5, 0x404040, 100, 0.75, -75);
    group.add(fi4);
    var fi5 = makeBox(8, 2, 6, 0x3A3A3A, 130, 1, -65);
    group.add(fi5);
    var fi6 = makeBox(5, 1, 4, 0x4A4A4A, 95, 0.5, -80);
    group.add(fi6);

    // Puffin colonies — orange bodies, white chests
    var puffPositions = [
      [90, 3.5, -58],
      [92, 3.5, -60],
      [88, 3.5, -62],
      [105, 4, -53],
      [107, 4, -56],
      [118, 3.5, -68],
      [120, 3.5, -71],
      [100, 3, -74]
    ];
    for (var pi = 0; pi < puffPositions.length; pi++) {
      var px = puffPositions[pi][0];
      var py = puffPositions[pi][1];
      var pz = puffPositions[pi][2];
      var body = makeSphere(0.4, 6, 5, 0xFF8C00, px - WX, py, pz - WZ);
      group.add(body);
      var chest = makeSphere(0.25, 6, 5, 0xFFFFFF, px - WX, py - 0.1, pz - WZ - 0.25);
      group.add(chest);
    }
  }

  function buildGraceDarlingMuseum(group) {
    // Small Victorian building — Grace Darling museum
    var museum = makeBox(10, 5, 8, 0xD4A97A, -25, 4.5, 25);
    group.add(museum);
    group.add(makeEdges(museum));

    // Museum roof
    var roof = makeBox(11, 2, 9, 0x8B6A4A, -25, 7.5, 25);
    group.add(roof);

    // Chimney
    var chimney = makeBox(1.5, 3, 1.5, 0xA08060, -22, 9.5, 22);
    group.add(chimney);

    // Door
    var door = makeBox(1.5, 2.5, 0.3, 0x5A3A1A, -25, 3.25, 20.9);
    group.add(door);

    // Windows
    var mw1 = makeBox(1.5, 1.5, 0.3, 0x8AB4C8, -28, 5, 20.9);
    group.add(mw1);
    var mw2 = makeBox(1.5, 1.5, 0.3, 0x8AB4C8, -22, 5, 20.9);
    group.add(mw2);

    // Portrait plaque on museum wall
    var plaque = makeBox(1.2, 1.6, 0.2, 0xB8A060, -30.1, 4.5, 25);
    group.add(plaque);
  }

  function buildStAidansChurch(group) {
    // St Aidan's Church — where Grace Darling is buried
    // Main nave
    var nave = makeBox(14, 10, 8, 0x9A8A78, 20, 7, 30);
    group.add(nave);
    group.add(makeEdges(nave));

    // Square tower
    var tower = makeBox(6, 16, 6, 0x8A7A68, 15, 10, 26);
    group.add(tower);
    group.add(makeEdges(tower));

    // Tower battlements
    var ct1 = makeBox(2, 2, 1, 0x7A6A58, 13, 19, 23);
    group.add(ct1);
    var ct2 = makeBox(2, 2, 1, 0x7A6A58, 17, 19, 23);
    group.add(ct2);
    var ct3 = makeBox(1, 2, 2, 0x7A6A58, 12, 19, 26);
    group.add(ct3);
    var ct4 = makeBox(1, 2, 2, 0x7A6A58, 18, 19, 26);
    group.add(ct4);

    // Church roof (peaked)
    var roof = makeBox(15, 3, 9, 0x6A5A4A, 20, 12.5, 30);
    group.add(roof);

    // Chancel (east end)
    var chancel = makeBox(6, 8, 6, 0x9A8A78, 30, 6, 30);
    group.add(chancel);

    // Church windows
    var cw1 = makeBox(1, 2, 0.2, 0x8AB4C8, 20, 8, 25.9);
    group.add(cw1);
    var cw2 = makeBox(1, 2, 0.2, 0x8AB4C8, 24, 8, 25.9);
    group.add(cw2);
    var cw3 = makeBox(1, 2, 0.2, 0x8AB4C8, 16, 8, 25.9);
    group.add(cw3);

    // Graveyard markers (simple crosses)
    var g1 = makeBox(0.3, 2, 0.3, 0x8A8A8A, 25, 1.5, 22);
    group.add(g1);
    var g2 = makeBox(0.3, 2, 0.3, 0x8A8A8A, 28, 1.5, 20);
    group.add(g2);
    var g3 = makeBox(0.3, 2, 0.3, 0x8A8A8A, 23, 1.5, 19);
    group.add(g3);
    var g4 = makeBox(0.3, 2, 0.3, 0x9A9A9A, 30, 1.5, 24);
    group.add(g4);
    // Crossbars
    var gc1 = makeBox(1, 0.3, 0.3, 0x8A8A8A, 25, 2, 22);
    group.add(gc1);
    var gc2 = makeBox(1, 0.3, 0.3, 0x8A8A8A, 28, 2, 20);
    group.add(gc2);
    var gc3 = makeBox(1, 0.3, 0.3, 0x8A8A8A, 23, 2, 19);
    group.add(gc3);
    var gc4 = makeBox(1, 0.3, 0.3, 0x9A9A9A, 30, 2, 24);
    group.add(gc4);

    // Grace Darling tomb slab
    var tomb = makeBox(3, 0.5, 1.5, 0xB0A090, 26, 0.75, 18);
    group.add(tomb);
  }

  function buildVillageBuildings(group) {
    // A few village cottages around the church
    var c1 = makeBox(7, 5, 6, 0xC8B090, 35, 3.5, 35);
    group.add(c1);
    var r1 = makeBox(8, 2, 7, 0x8B6A4A, 35, 6.5, 35);
    group.add(r1);

    var c2 = makeBox(6, 4, 5, 0xBEA880, 45, 3, 28);
    group.add(c2);
    var r2 = makeBox(7, 1.5, 6, 0x7A5A3A, 45, 5.25, 28);
    group.add(r2);

    var c3 = makeBox(8, 5, 7, 0xC0AA88, 12, 3.5, 42);
    group.add(c3);
    var r3 = makeBox(9, 2, 8, 0x8B6A4A, 12, 6.5, 42);
    group.add(r3);

    // Village road
    var road = makeBox(50, 0.2, 4, 0x8A8070, 20, 0.1, 37);
    group.add(road);
  }

  function buildGroundPlane(group) {
    // Grassy ground around castle
    var ground = makeBox(160, 0.5, 160, 0x5A7A3A, 0, -0.25, 20);
    group.add(ground);
    // Cliff edges near sea
    var cliff1 = makeBox(40, 6, 5, 0x5A5040, 30, 3, -20);
    group.add(cliff1);
    var cliff2 = makeBox(30, 4, 5, 0x504838, 55, 2, -15);
    group.add(cliff2);
  }

  function create(scene) {
    var group = new THREE.Group();

    buildGroundPlane(group);
    buildRock(group);
    buildKeep(group);
    buildCurtainWalls(group);
    buildCornerTowers(group);
    buildBeach(group);
    buildNorthSea(group);
    buildFarneIslands(group);
    buildGraceDarlingMuseum(group);
    buildStAidansChurch(group);
    buildVillageBuildings(group);

    scene.add(group);
    return group;
  }

  return {
    create: create,
    worldX: WX,
    worldZ: WZ,
    name: 'BamburghKeep'
  };

}());
