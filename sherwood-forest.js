window.SherwoodForest = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 15720;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function addMesh(geometry, material, x, y, z) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addMeshRotated(geometry, material, x, y, z, rx, ry, rz) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    mesh.rotation.set(rx, ry, rz);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildMajorOak() {
    var trunkMat = makeMaterial(0x4A2C0A);
    var canopyMat = makeMaterial(0x1A6B00);
    var propMat = makeMaterial(0x4A2C0A);

    // Main trunk
    var trunkGeo = new THREE.CylinderGeometry(4, 4.5, 8, 10);
    addMesh(trunkGeo, trunkMat, 0, 4, 0);

    // 6 prop beams supporting the ancient trunk
    var propAngles = [0, 60, 120, 180, 240, 300];
    for (var i = 0; i < propAngles.length; i++) {
      var angle = propAngles[i] * Math.PI / 180;
      var propGeo = new THREE.BoxGeometry(0.5, 6, 0.5);
      var px = Math.sin(angle) * 5;
      var pz = Math.cos(angle) * 5;
      var tilt = Math.PI / 6;
      var prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(OFFSET_X + px, 3, OFFSET_Z + pz);
      prop.rotation.set(
        Math.cos(angle) * tilt,
        0,
        -Math.sin(angle) * tilt
      );
      scene.add(prop);
      objects.push(prop);
    }

    // Canopy — 3 overlapping spheres
    var c1 = new THREE.SphereGeometry(10, 10, 8);
    addMesh(c1, canopyMat, 0, 15, 0);

    var c2 = new THREE.SphereGeometry(9, 10, 8);
    addMesh(c2, canopyMat, 4, 17, 3);

    var c3 = new THREE.SphereGeometry(8, 10, 8);
    addMesh(c3, canopyMat, -3, 16, -4);
  }

  function buildForestFloor() {
    var floorMat = makeMaterial(0x2D5A1B);
    var positions = [
      [-20, -22], [15, -18], [-10, 25], [30, 10],
      [-35, 5], [22, -35], [-15, -40], [40, 30],
      [-40, -20], [10, 45], [-30, 35], [35, -10]
    ];
    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(8, 1, 8);
      addMesh(geo, floorMat, positions[i][0], -0.5, positions[i][1]);
    }
  }

  function buildOakTrees() {
    var trunkMat = makeMaterial(0x3D1F08);
    var canopyMat = makeMaterial(0x228B22);
    var treePositions = [
      [-25, -15], [20, -20], [-40, 10], [35, -5],
      [-18, 30], [28, 25], [-50, -30], [50, 15],
      [-12, -50], [45, 40], [-45, 35], [15, 55],
      [-55, 0], [55, -25], [-30, -55], [30, 50],
      [0, -45], [-20, 50], [60, 5], [-60, -10]
    ];
    for (var i = 0; i < treePositions.length; i++) {
      var tx = treePositions[i][0];
      var tz = treePositions[i][1];
      var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 10, 8);
      addMesh(trunkGeo, trunkMat, tx, 5, tz);
      var canopyGeo = new THREE.SphereGeometry(7, 8, 6);
      addMesh(canopyGeo, canopyMat, tx, 14, tz);
    }
  }

  function buildUndergrowth() {
    var bushMat = makeMaterial(0x145214);
    var bushData = [
      [-8, -12, 2.5], [18, -8, 2],  [-22, 18, 3],
      [25, 15, 2.5], [-16, -28, 2], [32, -18, 3],
      [-38, -8, 2.5], [12, 38, 2], [-28, 28, 3],
      [38, -22, 2], [-5, 42, 2.5], [20, -40, 2],
      [-42, 22, 3], [42, 8, 2.5], [-10, -35, 2]
    ];
    for (var i = 0; i < bushData.length; i++) {
      var bx = bushData[i][0];
      var bz = bushData[i][1];
      var br = bushData[i][2];
      var geo = new THREE.SphereGeometry(br, 7, 5);
      addMesh(geo, bushMat, bx, br * 0.5, bz);
    }
  }

  function buildForestPath() {
    var pathMat = makeMaterial(0x8B6914);
    var pathSegments = [
      [-30, -60, 0], [-22, -45, 5], [-12, -30, 8],
      [-5, -15, 6], [0, 0, 3], [5, 15, 5],
      [10, 30, 8], [15, 42, 6], [20, 52, 4], [25, 62, 2]
    ];
    for (var i = 0; i < pathSegments.length; i++) {
      var px = pathSegments[i][0];
      var pz = pathSegments[i][1];
      var angle = pathSegments[i][2] * Math.PI / 180;
      var geo = new THREE.BoxGeometry(3, 0.3, 8);
      var mesh = new THREE.Mesh(geo, pathMat);
      mesh.position.set(OFFSET_X + px, 0.05, OFFSET_Z + pz);
      mesh.rotation.set(0, angle, 0);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function buildOutlawCamp() {
    var tentMat = makeMaterial(0x8B7355);
    var fireMat = makeMaterial(0xFF4500);
    var logMat = makeMaterial(0x4A2C0A);

    var campPositions = [
      [-60, 20], [-60, 35], [-50, 28]
    ];

    for (var i = 0; i < campPositions.length; i++) {
      var cx = campPositions[i][0];
      var cz = campPositions[i][1];

      // Tent
      var tentGeo = new THREE.ConeGeometry(4, 6, 8);
      addMesh(tentGeo, tentMat, cx, 3, cz);
    }

    // Campfire at centre of camp
    var fireGeo = new THREE.SphereGeometry(0.8, 7, 5);
    addMesh(fireGeo, fireMat, -57, 1, 28);

    // Log benches around the campfire — 4 logs
    var benchOffsets = [
      [3, 0, 0], [-3, 0, 0], [0, 0, 3], [0, 0, -3]
    ];
    for (var j = 0; j < benchOffsets.length; j++) {
      var bx = benchOffsets[j][0];
      var bz = benchOffsets[j][2];
      var benchGeo = new THREE.BoxGeometry(3, 0.5, 0.5);
      addMesh(benchGeo, logMat, -57 + bx, 0.5, 28 + bz);
    }
  }

  function buildArcheryRange() {
    var postMat = makeMaterial(0x8B4513);
    var redMat = makeMaterial(0xCC0000);
    var whiteMat = makeMaterial(0xFFFFFF);

    var targetX = [40, 50, 60];
    for (var i = 0; i < targetX.length; i++) {
      var tx = targetX[i];

      // Post
      var postGeo = new THREE.BoxGeometry(0.5, 6, 0.5);
      addMesh(postGeo, postMat, tx, 3, -50);

      // Outer red ring
      var outerGeo = new THREE.CylinderGeometry(2, 2, 0.3, 12);
      var outerMesh = new THREE.Mesh(outerGeo, redMat);
      outerMesh.position.set(OFFSET_X + tx, 5, OFFSET_Z - 50);
      outerMesh.rotation.set(Math.PI / 2, 0, 0);
      scene.add(outerMesh);
      objects.push(outerMesh);

      // Inner white ring
      var innerGeo = new THREE.CylinderGeometry(1, 1, 0.3, 12);
      var innerMesh = new THREE.Mesh(innerGeo, whiteMat);
      innerMesh.position.set(OFFSET_X + tx, 5, OFFSET_Z - 50.2);
      innerMesh.rotation.set(Math.PI / 2, 0, 0);
      scene.add(innerMesh);
      objects.push(innerMesh);
    }
  }

  function buildFallenLogs() {
    var logMat = makeMaterial(0x5C3317);

    // First fallen log
    var geo1 = new THREE.CylinderGeometry(2, 2, 20, 10);
    var log1 = new THREE.Mesh(geo1, logMat);
    log1.position.set(OFFSET_X + 10, 2, OFFSET_Z - 20);
    log1.rotation.set(Math.PI / 2, 0, 0.3);
    scene.add(log1);
    objects.push(log1);

    // Second fallen log
    var geo2 = new THREE.CylinderGeometry(2, 2, 20, 10);
    var log2 = new THREE.Mesh(geo2, logMat);
    log2.position.set(OFFSET_X - 20, 2, OFFSET_Z + 15);
    log2.rotation.set(Math.PI / 2, 0, -0.5);
    scene.add(log2);
    objects.push(log2);
  }

  function build() {
    buildMajorOak();
    buildForestFloor();
    buildOakTrees();
    buildUndergrowth();
    buildForestPath();
    buildOutlawCamp();
    buildArcheryRange();
    buildFallenLogs();
  }

  function update(delta) {
    // Static environment — no per-frame animation needed
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
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
