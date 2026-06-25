window.BodiamCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var GROUP_OFFSET_X = 16480;
  var GROUP_OFFSET_Z = 0;

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(GROUP_OFFSET_X + x, y, GROUP_OFFSET_Z + z);
    return mesh;
  }

  function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(GROUP_OFFSET_X + x, y, GROUP_OFFSET_Z + z);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(GROUP_OFFSET_X + x, y, GROUP_OFFSET_Z + z);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(GROUP_OFFSET_X + x, y, GROUP_OFFSET_Z + z);
    return mesh;
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildMoat() {
    var waterColor = 0x2B7DBF;
    var positions = [
      [-30, 0],
      [-10, 0],
      [10, 0],
      [30, 0],
      [-30, -40],
      [-10, -40],
      [10, -40],
      [30, -40]
    ];
    // Full ring: top row, bottom row, left col, right col
    var ringPositions = [
      // Top row
      [-30, 40],
      [-10, 40],
      [10, 40],
      [30, 40],
      // Bottom row
      [-30, -40],
      [-10, -40],
      [10, -40],
      [30, -40]
    ];
    // Build 8 water tiles in a square ring (top + bottom rows, covering corners)
    var tileCoords = [
      [-30, 40],
      [-10, 40],
      [10, 40],
      [30, 40],
      [-30, -40],
      [-10, -40],
      [10, -40],
      [30, -40]
    ];
    for (var i = 0; i < tileCoords.length; i++) {
      addToScene(makeBox(20, 0.5, 20, waterColor, tileCoords[i][0], 0, tileCoords[i][1]));
    }
  }

  function buildCurtainWalls() {
    var wallColor = 0xC4956A;
    // North wall
    addToScene(makeBox(44, 18, 2, wallColor, 0, 9, 22));
    // South wall
    addToScene(makeBox(44, 18, 2, wallColor, 0, 9, -22));
    // East wall
    addToScene(makeBox(2, 18, 44, wallColor, 22, 9, 0));
    // West wall
    addToScene(makeBox(2, 18, 44, wallColor, -22, 9, 0));

    // Crenellations on each wall: 20 merlons per wall evenly spaced
    // North wall crenellations (along X axis at z=22)
    buildWallCrenellations(20, 44, 18, 2, 0, 22, 'x');
    // South wall crenellations
    buildWallCrenellations(20, 44, 18, 2, 0, -22, 'x');
    // East wall crenellations (along Z axis at x=22)
    buildWallCrenellations(20, 44, 18, 2, 22, 0, 'z');
    // West wall crenellations
    buildWallCrenellations(20, 44, 18, 2, -22, 0, 'z');
  }

  function buildWallCrenellations(count, wallLen, wallH, wallD, cx, cz, axis) {
    var wallColor = 0xC4956A;
    var spacing = wallLen / count;
    var halfLen = wallLen / 2;
    for (var i = 0; i < count; i++) {
      var offset = -halfLen + spacing * 0.5 + i * spacing;
      var x = (axis === 'x') ? cx + offset : cx;
      var z = (axis === 'z') ? cz + offset : cz;
      addToScene(makeBox(2, 3, 2, wallColor, x, wallH + 1.5, z));
    }
  }

  function buildCornerTowers() {
    var towerColor = 0xB88060;
    var towerMerlonColor = 0xB88060;
    var corners = [
      [22, 22],
      [22, -22],
      [-22, 22],
      [-22, -22]
    ];
    for (var i = 0; i < corners.length; i++) {
      var cx = corners[i][0];
      var cz = corners[i][1];
      // Main tower cylinder
      addToScene(makeCylinder(7, 7, 22, 8, towerColor, cx, 11, cz));
      // 8 crenellation boxes around tower top
      for (var j = 0; j < 8; j++) {
        var angle = (j / 8) * Math.PI * 2;
        var mx = cx + Math.cos(angle) * 6;
        var mz = cz + Math.sin(angle) * 6;
        addToScene(makeBox(1.5, 3, 1.5, towerMerlonColor, mx, 23.5, mz));
      }
    }
  }

  function buildGatehouse() {
    var stoneColor = 0xC4956A;
    var darkColor = 0x333333;
    var woodColor = 0x6B4423;

    // Main gatehouse body (south side)
    addToScene(makeBox(14, 24, 10, stoneColor, 0, 12, -27));

    // Twin flanking towers
    addToScene(makeCylinder(5, 5, 26, 8, stoneColor, -9, 13, -27));
    addToScene(makeCylinder(5, 5, 26, 8, stoneColor, 9, 13, -27));

    // Portcullis: 4 vertical bars
    addToScene(makeBox(0.5, 12, 0.5, darkColor, -1.5, 6, -25));
    addToScene(makeBox(0.5, 12, 0.5, darkColor, -0.5, 6, -25));
    addToScene(makeBox(0.5, 12, 0.5, darkColor, 0.5, 6, -25));
    addToScene(makeBox(0.5, 12, 0.5, darkColor, 1.5, 6, -25));

    // Drawbridge over moat
    addToScene(makeBox(8, 1, 12, woodColor, 0, 0.5, -36));
  }

  function buildNorthPostern() {
    var stoneColor = 0xC4956A;
    var waterColor = 0x1B6CA8;

    // Secondary gate body (north side)
    addToScene(makeBox(8, 18, 6, stoneColor, 0, 9, 27));

    // Single round tower
    addToScene(makeCylinder(4, 4, 20, 8, stoneColor, 6, 10, 27));

    // Water gate channel through moat
    addToScene(makeBox(4, 0.5, 6, waterColor, 0, 0.1, 38));
  }

  function buildInteriorCourtyard() {
    var ruinColor = 0xB88060;
    var wellColor = 0x555555;
    var woodColor = 0x6B4423;

    // 6 partial internal wall stubs (alternating orientations)
    addToScene(makeBox(2, 8, 15, ruinColor, -10, 4, 5));
    addToScene(makeBox(15, 8, 2, ruinColor, 5, 4, -5));
    addToScene(makeBox(2, 8, 15, ruinColor, 10, 4, 5));
    addToScene(makeBox(15, 8, 2, ruinColor, -5, 4, 10));
    addToScene(makeBox(2, 8, 15, ruinColor, -15, 4, -5));
    addToScene(makeBox(15, 8, 2, ruinColor, 5, 4, 12));

    // Well shaft at center
    addToScene(makeCylinder(2, 2, 4, 8, wellColor, 0, 2, 0));

    // Well cap
    addToScene(makeBox(5, 1, 5, ruinColor, 0, 4.5, 0));

    // Well roof cone
    addToScene(makeCone(3, 4, 8, woodColor, 0, 7, 0));
  }

  function buildLandscape() {
    var grassColor = 0x3A8A3A;
    var treeCanopyColor = 0x228B22;
    var treeTrunkColor = 0x6B4423;
    var waterColor = 0x1B6CA8;

    // 6 grass mounds around the castle area
    var moundPositions = [
      [70, -20],
      [-70, -20],
      [70, 20],
      [-70, 20],
      [0, 70],
      [0, -70]
    ];
    for (var i = 0; i < moundPositions.length; i++) {
      addToScene(makeBox(20, 2, 20, grassColor, moundPositions[i][0], -1, moundPositions[i][1]));
    }

    // 8 oak trees: trunk + canopy
    var treePositions = [
      [60, -30],
      [-60, -30],
      [60, 30],
      [-60, 30],
      [50, -60],
      [-50, -60],
      [50, 60],
      [-50, 60]
    ];
    for (var t = 0; t < treePositions.length; t++) {
      var tx = treePositions[t][0];
      var tz = treePositions[t][1];
      // Trunk
      addToScene(makeCylinder(0.8, 1.0, 6, 6, treeTrunkColor, tx, 3, tz));
      // Canopy
      addToScene(makeSphere(5, 8, 6, treeCanopyColor, tx, 9, tz));
    }

    // River Rother winding south
    addToScene(makeBox(6, 0.5, 50, waterColor, 55, -0.1, -60));
  }

  function buildCauseway() {
    var causeColor = 0xD4C5A9;
    var bollardColor = 0xC4956A;

    // Stone causeway across moat to gatehouse
    addToScene(makeBox(6, 1, 40, causeColor, 0, 0.5, -20));

    // 10 bollards flanking the causeway (5 on each side)
    for (var i = 0; i < 5; i++) {
      var zPos = -5 + i * (-8);
      // Left side
      addToScene(makeCylinder(0.6, 0.6, 2, 8, bollardColor, -4, 1, zPos));
      // Right side
      addToScene(makeCylinder(0.6, 0.6, 2, 8, bollardColor, 4, 1, zPos));
    }
  }

  function build() {
    buildMoat();
    buildCurtainWalls();
    buildCornerTowers();
    buildGatehouse();
    buildNorthPostern();
    buildInteriorCourtyard();
    buildLandscape();
    buildCauseway();
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    build();
  }

  function update(delta) {
    // Static environment — no per-frame animation needed
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) { objects[i].geometry.dispose(); }
      if (objects[i].material) { objects[i].material.dispose(); }
    }
    objects = [];
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
