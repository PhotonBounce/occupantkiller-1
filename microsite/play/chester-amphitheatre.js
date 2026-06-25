window.ChesterAmphitheatre = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var group = null;

  var OFFSET_X = 15920;
  var OFFSET_Z = 0;

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function buildOuterWalls() {
    var segments = 24;
    var rx = 30;
    var rz = 24;
    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * rx;
      var z = Math.sin(angle) * rz;
      var geo = new THREE.BoxGeometry(4, 8, 3);
      var mesh = makeMesh(geo, 0xD4A574);
      mesh.position.set(x, 4, z);
      mesh.rotation.y = angle;
      group.add(mesh);
      objects.push(mesh);
    }
  }

  function buildSeatingTiers() {
    var rings = [
      { count: 20, rx: 16, rz: 13, y: 2, color: 0xC4956A },
      { count: 20, rx: 22, rz: 18, y: 5, color: 0xC4956A },
      { count: 20, rx: 27, rz: 22, y: 8, color: 0xC4956A }
    ];
    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r];
      for (var i = 0; i < ring.count; i++) {
        var angle = (i / ring.count) * Math.PI * 2;
        var x = Math.cos(angle) * ring.rx;
        var z = Math.sin(angle) * ring.rz;
        var geo = new THREE.BoxGeometry(2, 2, 4);
        var mesh = makeMesh(geo, ring.color);
        mesh.position.set(x, ring.y, z);
        mesh.rotation.y = angle;
        group.add(mesh);
        objects.push(mesh);
      }
    }
  }

  function buildArenaFloor() {
    var floorParts = [
      { x: 0, z: 0 },
      { x: 0, z: -16 },
      { x: 0, z: 16 }
    ];
    for (var i = 0; i < floorParts.length; i++) {
      var geo = new THREE.BoxGeometry(20, 0.5, 16);
      var mesh = makeMesh(geo, 0xD2B48C);
      mesh.position.set(floorParts[i].x, -0.25, floorParts[i].z);
      group.add(mesh);
      objects.push(mesh);
    }
  }

  function buildEntranceTunnel() {
    var leftCol = new THREE.BoxGeometry(3, 8, 3);
    var leftMesh = makeMesh(leftCol, 0xD4A574);
    leftMesh.position.set(-5, 4, 26);
    group.add(leftMesh);
    objects.push(leftMesh);

    var rightCol = new THREE.BoxGeometry(3, 8, 3);
    var rightMesh = makeMesh(rightCol, 0xD4A574);
    rightMesh.position.set(5, 4, 26);
    group.add(rightMesh);
    objects.push(rightMesh);

    var lintelGeo = new THREE.BoxGeometry(10, 2, 3);
    var lintelMesh = makeMesh(lintelGeo, 0xD4A574);
    lintelMesh.position.set(0, 9, 26);
    group.add(lintelMesh);
    objects.push(lintelMesh);

    var stepsGeo = new THREE.BoxGeometry(8, 1, 2);
    var stepsMesh = makeMesh(stepsGeo, 0xD4A574);
    stepsMesh.position.set(0, -0.5, 28);
    group.add(stepsMesh);
    objects.push(stepsMesh);
  }

  function buildRomanWalls() {
    var wallDefs = [
      { w: 2,  h: 12, d: 50,  x: -60,  y: 6, z: 0   },
      { w: 50, h: 12, d: 2,   x: -35,  y: 6, z: -50  },
      { w: 2,  h: 12, d: 40,  x: -10,  y: 6, z: 0    },
      { w: 40, h: 12, d: 2,   x: -35,  y: 6, z: 50   }
    ];
    for (var i = 0; i < wallDefs.length; i++) {
      var wd = wallDefs[i];
      var geo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var mesh = makeMesh(geo, 0xD4A574);
      mesh.position.set(wd.x, wd.y, wd.z);
      group.add(mesh);
      objects.push(mesh);
    }

    var towerPositions = [
      { x: -60, z: -50 },
      { x: -10, z: -50 },
      { x: -60, z:  50 },
      { x: -10, z:  50 }
    ];
    for (var t = 0; t < towerPositions.length; t++) {
      var tp = towerPositions[t];
      var tGeo = new THREE.CylinderGeometry(5, 5, 16, 12);
      var tMesh = makeMesh(tGeo, 0xC4856A);
      tMesh.position.set(tp.x, 8, tp.z);
      group.add(tMesh);
      objects.push(tMesh);
    }
  }

  function buildEastgateClockArch() {
    var archGeo = new THREE.BoxGeometry(16, 14, 2);
    var archMesh = makeMesh(archGeo, 0xD4A574);
    archMesh.position.set(-35, 7, -50);
    group.add(archMesh);
    objects.push(archMesh);

    var openingGeo = new THREE.BoxGeometry(8, 10, 2.1);
    var openingMesh = makeMesh(openingGeo, 0x222222);
    openingMesh.position.set(-35, 5, -50);
    group.add(openingMesh);
    objects.push(openingMesh);

    var clockGeo = new THREE.CylinderGeometry(3, 3, 0.5, 16);
    var clockMesh = makeMesh(clockGeo, 0xFFD700);
    clockMesh.rotation.x = Math.PI / 2;
    clockMesh.position.set(-35, 14, -50);
    group.add(clockMesh);
    objects.push(clockMesh);
  }

  function buildTheRows() {
    var rowPositions = [
      { x: -20, z: -40 },
      { x: -35, z: -40 },
      { x: -50, z: -40 }
    ];
    for (var i = 0; i < rowPositions.length; i++) {
      var rp = rowPositions[i];
      var rowGeo = new THREE.BoxGeometry(30, 5, 6);
      var rowMesh = makeMesh(rowGeo, 0xF5DEB3);
      rowMesh.position.set(rp.x, 7.5, rp.z);
      group.add(rowMesh);
      objects.push(rowMesh);

      var postCount = 10;
      for (var p = 0; p < postCount; p++) {
        var px = rp.x - 13.5 + p * 3;
        var postGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
        var postMesh = makeMesh(postGeo, 0x4A3728);
        postMesh.position.set(px, 2.5, rp.z);
        group.add(postMesh);
        objects.push(postMesh);
      }
    }
  }

  function buildCathedral() {
    var naveGeo = new THREE.BoxGeometry(24, 20, 16);
    var naveMesh = makeMesh(naveGeo, 0xD4A574);
    naveMesh.position.set(-70, 10, 20);
    group.add(naveMesh);
    objects.push(naveMesh);

    var towerGeo = new THREE.BoxGeometry(6, 28, 6);
    var towerMesh = makeMesh(towerGeo, 0xD4A574);
    towerMesh.position.set(-70, 14, 20);
    group.add(towerMesh);
    objects.push(towerMesh);

    var pinnacleOffsets = [
      { x: -3, z: -3 },
      { x:  3, z: -3 },
      { x: -3, z:  3 },
      { x:  3, z:  3 }
    ];
    for (var p = 0; p < pinnacleOffsets.length; p++) {
      var po = pinnacleOffsets[p];
      var pinGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
      var pinMesh = makeMesh(pinGeo, 0xD4A574);
      pinMesh.position.set(-70 + po.x, 30.5, 20 + po.z);
      group.add(pinMesh);
      objects.push(pinMesh);
    }

    var windowPositions = [
      { x: -82, y: 12, z: 20 },
      { x: -58, y: 12, z: 20 },
      { x: -70,  y: 12, z: 12 },
      { x: -70,  y: 12, z: 28 }
    ];
    for (var w = 0; w < windowPositions.length; w++) {
      var wp = windowPositions[w];
      var winGeo = new THREE.BoxGeometry(2, 12, 0.5);
      var winMesh = makeMesh(winGeo, 0x87CEEB);
      winMesh.position.set(wp.x, wp.y, wp.z);
      group.add(winMesh);
      objects.push(winMesh);
    }
  }

  function build() {
    group = new THREE.Group();
    group.position.set(OFFSET_X, 0, OFFSET_Z);

    buildOuterWalls();
    buildSeatingTiers();
    buildArenaFloor();
    buildEntranceTunnel();
    buildRomanWalls();
    buildEastgateClockArch();
    buildTheRows();
    buildCathedral();

    scene.add(group);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    group = null;
  }

  function update(delta) {
    // static environment — no per-frame update needed
  }

  function reset() {
    if (group && scene) {
      scene.remove(group);
    }
    objects = [];
    group = null;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    build: build,
    update: update,
    reset: reset
  };

}());
