window.StokePost = (function() {
  'use strict';

  var WX = 3220;
  var WZ = 2200;

  function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z, parent) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function makeCyl(rt, rb, h, color, x, y, z, parent) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function makeSphere(r, color, x, y, z, parent) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function makeCone(r, h, color, x, y, z, parent) {
    var geo = new THREE.ConeGeometry(r, h, 12);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function addEdges(mesh, parent) {
    var edges = new THREE.EdgesGeometry(mesh.geometry);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    line.position.copy(mesh.position);
    parent.add(line);
  }

  function buildBottleKiln(px, py, pz, parent) {
    // Base cylinder - wide body
    makeCyl(2, 2, 6, 0x9A6A4A, px, py + 3, pz, parent);
    // Narrowing neck cylinder
    makeCyl(1.2, 2, 2, 0x9A6A4A, px, py + 7, pz, parent);
    // Cone taper
    makeCone(1.0, 2, 0x9A6A4A, px, py + 9, pz, parent);
    // Dome cap
    makeSphere(0.9, 0xC8A882, px, py + 10.2, pz, parent);
  }

  function buildBottleKilnCluster(scene) {
    var positions = [
      [-4, 0, -4],
      [0, 0, -4],
      [4, 0, -4],
      [-4, 0, 0],
      [4, 0, 0],
      [-4, 0, 4],
      [0, 0, 4],
      [4, 0, 4]
    ];
    var bx = WX - 60;
    var bz = WZ - 40;
    for (var i = 0; i < positions.length; i++) {
      buildBottleKiln(bx + positions[i][0], 0, bz + positions[i][2], scene);
    }
    // Ground slab
    makeBox(20, 0.5, 20, 0x888877, bx, 0.25, bz, scene);
  }

  function buildWedgwoodFactory(scene) {
    var fx = WX + 20;
    var fz = WZ - 30;
    // Main factory building
    makeBox(30, 8, 15, 0xF5E8D0, fx, 4, fz, scene);
    // Wedgwood blue tile panels - front face
    makeBox(8, 5, 0.5, 0x5A7A9A, fx - 9, 5, fz - 7.6, scene);
    makeBox(8, 5, 0.5, 0x5A7A9A, fx + 1, 5, fz - 7.6, scene);
    makeBox(8, 5, 0.5, 0x5A7A9A, fx + 9, 5, fz - 7.6, scene);
    // Roof structure
    makeBox(32, 1, 17, 0xD4C4A0, fx, 8.5, fz, scene);
    // Chimney stack
    makeCyl(0.8, 0.8, 10, 0x8B7355, fx + 12, 9, fz - 5, scene);
    // Side annex
    makeBox(10, 6, 10, 0xF5E8D0, fx + 20, 3, fz, scene);
    // Loading dock
    makeBox(15, 1, 5, 0xAAAAAA, fx - 5, 0.5, fz + 10, scene);
  }

  function buildTrenthamGardens(scene) {
    var gx = WX + 60;
    var gz = WZ + 30;
    // Ornamental lake
    makeBox(40, 0.3, 20, 0x1A6B8A, gx, 0.15, gz, scene);
    // Hedge parterre boxes
    var hedgePositions = [
      [-15, -8],
      [-5, -8],
      [5, -8],
      [15, -8],
      [-15, 8],
      [-5, 8],
      [5, 8],
      [15, 8]
    ];
    for (var i = 0; i < hedgePositions.length; i++) {
      makeBox(6, 1.5, 4, 0x2D5A1B, gx + hedgePositions[i][0], 0.75, gz + hedgePositions[i][1], scene);
    }
    // Central fountain base
    makeCyl(4, 4, 0.5, 0xBBBBBB, gx, 0.25, gz - 25, scene);
    // Fountain bowl
    makeCyl(2.5, 3.5, 1, 0xCCCCCC, gx, 0.75, gz - 25, scene);
    // Fountain jets (cylinders)
    makeCyl(0.1, 0.1, 3, 0x88CCEE, gx, 2.25, gz - 25, scene);
    makeCyl(0.1, 0.1, 2, 0x88CCEE, gx + 1.5, 1.75, gz - 25, scene);
    makeCyl(0.1, 0.1, 2, 0x88CCEE, gx - 1.5, 1.75, gz - 25, scene);
    // Formal garden path
    makeBox(60, 0.2, 3, 0xC8B88A, gx, 0.1, gz - 12, scene);
    makeBox(3, 0.2, 40, 0xC8B88A, gx, 0.1, gz - 10, scene);
    // Ornamental urns (sphere on cylinder)
    makeCyl(0.4, 0.5, 1.2, 0xAA9977, gx - 10, 0.6, gz - 15, scene);
    makeSphere(0.5, 0xCCBB99, gx - 10, 1.5, gz - 15, scene);
    makeCyl(0.4, 0.5, 1.2, 0xAA9977, gx + 10, 0.6, gz - 15, scene);
    makeSphere(0.5, 0xCCBB99, gx + 10, 1.5, gz - 15, scene);
  }

  function buildBet365Stadium(scene) {
    var sx = WX - 20;
    var sz = WZ + 60;
    // Main stands
    makeBox(70, 12, 8, 0x888888, sx, 6, sz - 25, scene);
    makeBox(70, 10, 8, 0x888888, sx, 5, sz + 25, scene);
    makeBox(8, 10, 50, 0x888888, sx - 35, 5, sz, scene);
    makeBox(8, 8, 50, 0x888888, sx + 35, 4, sz, scene);
    // Roof canopies
    makeBox(72, 1, 10, 0xAAAAAA, sx, 12.5, sz - 25, scene);
    makeBox(72, 1, 10, 0xAAAAAA, sx, 10.5, sz + 25, scene);
    // Pitch - alternating red and white stripes
    var stripeColors = [
      0xCC0000,
      0xFFFFFF,
      0xCC0000,
      0xFFFFFF,
      0xCC0000,
      0xFFFFFF,
      0xCC0000,
      0xFFFFFF,
      0xCC0000,
      0xFFFFFF
    ];
    for (var i = 0; i < stripeColors.length; i++) {
      makeBox(6, 0.1, 48, stripeColors[i], sx - 27 + i * 6, 0.05, sz, scene);
    }
    // Goal posts (cylinders)
    makeCyl(0.15, 0.15, 3, 0xFFFFFF, sx - 28, 1.5, sz - 20, scene);
    makeCyl(0.15, 0.15, 3, 0xFFFFFF, sx - 21, 1.5, sz - 20, scene);
    makeBox(7.5, 0.15, 0.15, 0xFFFFFF, sx - 24.5, 3.1, sz - 20, scene);
    makeCyl(0.15, 0.15, 3, 0xFFFFFF, sx - 28, 1.5, sz + 20, scene);
    makeCyl(0.15, 0.15, 3, 0xFFFFFF, sx - 21, 1.5, sz + 20, scene);
    makeBox(7.5, 0.15, 0.15, 0xFFFFFF, sx - 24.5, 3.1, sz + 20, scene);
  }

  function buildGladstoneMuseum(scene) {
    var mx = WX - 80;
    var mz = WZ + 20;
    // Main Victorian building
    makeBox(16, 8, 10, 0xD4A97A, mx, 4, mz, scene);
    // Museum roof
    makeBox(18, 1, 12, 0xB8874A, mx, 8.5, mz, scene);
    // Office wing
    makeBox(8, 6, 8, 0xD4A97A, mx + 12, 3, mz - 1, scene);
    // Entrance arch box
    makeBox(4, 5, 1, 0xC89A6A, mx, 2.5, mz - 5.5, scene);
    makeBox(2, 3, 1, 0xF5E0C0, mx, 1.5, mz - 5.5, scene);
    // 4 bottle kilns in yard
    buildBottleKiln(mx - 6, 0, mz + 8, scene);
    buildBottleKiln(mx - 2, 0, mz + 8, scene);
    buildBottleKiln(mx + 2, 0, mz + 8, scene);
    buildBottleKiln(mx + 6, 0, mz + 8, scene);
    // Yard ground
    makeBox(25, 0.3, 12, 0x999988, mx, 0.15, mz + 8, scene);
    // Display cases
    makeBox(3, 1.5, 2, 0xEEDDCC, mx - 5, 0.75, mz - 2, scene);
    makeBox(3, 1.5, 2, 0xEEDDCC, mx, 0.75, mz - 2, scene);
    makeBox(3, 1.5, 2, 0xEEDDCC, mx + 5, 0.75, mz - 2, scene);
  }

  function buildCanalWharf(scene) {
    var cx = WX + 10;
    var cz = WZ + 90;
    // Caldon Canal water
    makeBox(80, 0.5, 8, 0x1A6B8A, cx, 0.25, cz, scene);
    // Canal bank - stone
    makeBox(82, 1, 2, 0x888877, cx, 0.5, cz - 5, scene);
    makeBox(82, 1, 2, 0x888877, cx, 0.5, cz + 5, scene);
    // Coal barge 1
    makeBox(12, 1.5, 3.5, 0x222222, cx - 25, 1.0, cz, scene);
    makeBox(10, 1.0, 3, 0x333333, cx - 25, 2.25, cz, scene);
    // Coal barge 2
    makeBox(12, 1.5, 3.5, 0x222222, cx - 5, 1.0, cz, scene);
    makeBox(10, 1.0, 3, 0x333333, cx - 5, 2.25, cz, scene);
    // Pottery crates on wharf
    makeBox(2, 2, 2, 0xC8A870, cx + 15, 1.5, cz - 7, scene);
    makeBox(2, 2, 2, 0xC8A870, cx + 18, 1.5, cz - 7, scene);
    makeBox(2, 2, 2, 0xC8A870, cx + 21, 1.5, cz - 7, scene);
    makeBox(2, 4, 2, 0xC8A870, cx + 16.5, 3.5, cz - 7, scene);
    makeBox(2, 4, 2, 0xC8A870, cx + 19.5, 3.5, cz - 7, scene);
    // Wharf warehouse
    makeBox(20, 6, 10, 0xAA9977, cx + 30, 3, cz - 9, scene);
    makeBox(22, 1, 12, 0x887755, cx + 30, 6.5, cz - 9, scene);
    // Wharf crane (boxes and cylinders)
    makeCyl(0.4, 0.4, 8, 0x555555, cx + 10, 4, cz - 6, scene);
    makeBox(6, 0.4, 0.4, 0x555555, cx + 13, 8.2, cz - 6, scene);
    makeCyl(0.1, 0.1, 5, 0x333333, cx + 16, 5.75, cz - 6, scene);
    // Towpath boxes
    makeBox(80, 0.2, 3, 0xBBAA88, cx, 0.6, cz + 8, scene);
  }

  function build(scene) {
    buildBottleKilnCluster(scene);
    buildWedgwoodFactory(scene);
    buildTrenthamGardens(scene);
    buildBet365Stadium(scene);
    buildGladstoneMuseum(scene);
    buildCanalWharf(scene);
  }

  return {
    build: build
  };
}());
