window.BoxHill = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16840;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeMesh(geometry, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, mat);
    return mesh;
  }

  function buildHill() {
    var layers = [
      { w: 60, h: 8,  d: 50, y: 4 },
      { w: 50, h: 6,  d: 40, y: 11 },
      { w: 40, h: 8,  d: 30, y: 18 },
      { w: 30, h: 10, d: 20, y: 25 }
    ];
    var i;
    for (i = 0; i < layers.length; i++) {
      var l = layers[i];
      var geo = new THREE.BoxGeometry(l.w, l.h, l.d);
      var mesh = makeMesh(geo, 0x4A8A4A);
      mesh.position.set(OFFSET_X, l.y, OFFSET_Z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function buildVisitorBuilding() {
    var bx = OFFSET_X + 5;
    var by = 32;
    var bz = OFFSET_Z - 5;

    var bodyGeo = new THREE.BoxGeometry(16, 8, 6);
    var body = makeMesh(bodyGeo, 0xD4C5A9);
    body.position.set(bx, by + 4, bz);
    scene.add(body);
    objects.push(body);

    var verandaGeo = new THREE.BoxGeometry(18, 2, 4);
    var veranda = makeMesh(verandaGeo, 0x8B6914);
    veranda.position.set(bx, by + 1, bz + 5);
    scene.add(veranda);
    objects.push(veranda);

    var postPositions = [-7, -3, 0, 3, 6, 9];
    var p;
    for (p = 0; p < postPositions.length; p++) {
      var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
      var post = makeMesh(postGeo, 0x6B5012);
      post.position.set(bx + postPositions[p], by + 2, bz + 7);
      scene.add(post);
      objects.push(post);
    }
  }

  function buildSalomons() {
    var cx = OFFSET_X - 4;
    var cz = OFFSET_Z + 3;
    var baseY = 30;

    var plinthGeo = new THREE.BoxGeometry(5, 3, 5);
    var plinth = makeMesh(plinthGeo, 0xC4B59A);
    plinth.position.set(cx, baseY + 1.5, cz);
    scene.add(plinth);
    objects.push(plinth);

    var columnGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
    var column = makeMesh(columnGeo, 0xD4C5A9);
    column.position.set(cx, baseY + 3 + 10, cz);
    scene.add(column);
    objects.push(column);

    var capGeo = new THREE.BoxGeometry(4, 4, 3);
    var cap = makeMesh(capGeo, 0xD4C5A9);
    cap.position.set(cx, baseY + 3 + 20 + 2, cz);
    scene.add(cap);
    objects.push(cap);

    var apexGeo = new THREE.ConeGeometry(2.5, 5, 6);
    var apex = makeMesh(apexGeo, 0xD4C5A9);
    apex.position.set(cx, baseY + 3 + 20 + 4 + 2.5, cz);
    scene.add(apex);
    objects.push(apex);
  }

  function buildBoxTrees() {
    var shrubData = [
      [-12, -8], [-9, -14], [-15, -12], [-6, -10], [-18, -6],
      [-20, -14], [-10, -18], [-14, -4], [-22, -10], [-8, -22],
      [10, -8], [12, -14], [8, -18], [15, -12], [6, -20]
    ];
    var hillTop = 30;
    var i;
    for (i = 0; i < shrubData.length; i++) {
      var sd = shrubData[i];
      var shrubGeo = new THREE.SphereGeometry(2.5, 6, 6);
      var shrub = makeMesh(shrubGeo, 0x1A5A1A);
      shrub.position.set(OFFSET_X + sd[0], hillTop + 2.5, OFFSET_Z + sd[1]);
      scene.add(shrub);
      objects.push(shrub);
    }

    var tallerTreeData = [
      [-25, -5], [-28, -12], [-30, -20], [-25, -28],
      [18, -5], [20, -15], [22, -25], [16, -30]
    ];
    var j;
    for (j = 0; j < tallerTreeData.length; j++) {
      var td = tallerTreeData[j];
      var trunkGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
      var trunk = makeMesh(trunkGeo, 0x4A2C0A);
      trunk.position.set(OFFSET_X + td[0], hillTop + 4, OFFSET_Z + td[1]);
      scene.add(trunk);
      objects.push(trunk);

      var canopyGeo = new THREE.SphereGeometry(5, 6, 6);
      var canopy = makeMesh(canopyGeo, 0x1A5A1A);
      canopy.position.set(OFFSET_X + td[0], hillTop + 8 + 5, OFFSET_Z + td[1]);
      scene.add(canopy);
      objects.push(canopy);
    }
  }

  function buildCyclingHairpin() {
    var rx = OFFSET_X - 30;
    var ry = 12;
    var rz = OFFSET_Z + 20;

    var section1Geo = new THREE.BoxGeometry(4, 0.3, 20);
    var section1 = makeMesh(section1Geo, 0x444444);
    section1.position.set(rx, ry, rz);
    scene.add(section1);
    objects.push(section1);

    var b1LeftGeo = new THREE.BoxGeometry(0.3, 1, 20);
    var b1Left = makeMesh(b1LeftGeo, 0xFF6600);
    b1Left.position.set(rx - 2.15, ry + 0.5, rz);
    scene.add(b1Left);
    objects.push(b1Left);

    var b1RightGeo = new THREE.BoxGeometry(0.3, 1, 20);
    var b1Right = makeMesh(b1RightGeo, 0xFF6600);
    b1Right.position.set(rx + 2.15, ry + 0.5, rz);
    scene.add(b1Right);
    objects.push(b1Right);

    var cornerGeo = new THREE.BoxGeometry(4, 0.3, 4);
    var corner = makeMesh(cornerGeo, 0x444444);
    corner.position.set(rx + 8, ry, rz + 12);
    corner.rotation.y = Math.PI / 2;
    scene.add(corner);
    objects.push(corner);

    var cLeftGeo = new THREE.BoxGeometry(0.3, 1, 4);
    var cLeft = makeMesh(cLeftGeo, 0xFF6600);
    cLeft.position.set(rx + 8, ry + 0.5, rz + 14.15);
    scene.add(cLeft);
    objects.push(cLeft);

    var cRightGeo = new THREE.BoxGeometry(0.3, 1, 4);
    var cRight = makeMesh(cRightGeo, 0xFF6600);
    cRight.position.set(rx + 8, ry + 0.5, rz + 9.85);
    scene.add(cRight);
    objects.push(cRight);

    var section2Geo = new THREE.BoxGeometry(4, 0.3, 20);
    var section2 = makeMesh(section2Geo, 0x444444);
    section2.position.set(rx + 16, ry + 2, rz);
    scene.add(section2);
    objects.push(section2);

    var b2LeftGeo = new THREE.BoxGeometry(0.3, 1, 20);
    var b2Left = makeMesh(b2LeftGeo, 0xFF6600);
    b2Left.position.set(rx + 13.85, ry + 2.5, rz);
    scene.add(b2Left);
    objects.push(b2Left);

    var b2RightGeo = new THREE.BoxGeometry(0.3, 1, 20);
    var b2Right = makeMesh(b2RightGeo, 0xFF6600);
    b2Right.position.set(rx + 18.15, ry + 2.5, rz);
    scene.add(b2Right);
    objects.push(b2Right);
  }

  function buildRiverMole() {
    var riverX = OFFSET_X - 50;
    var riverZ = OFFSET_Z + 40;
    var riverY = 0.25;

    var tileOffsets = [
      [0, 0], [8, 5], [16, 2], [22, 8], [28, 4]
    ];
    var i;
    for (i = 0; i < tileOffsets.length; i++) {
      var to = tileOffsets[i];
      var waterGeo = new THREE.BoxGeometry(10, 0.5, 15);
      var water = makeMesh(waterGeo, 0x1B6CA8);
      water.position.set(riverX + to[0], riverY, riverZ + to[1]);
      scene.add(water);
      objects.push(water);
    }

    var stoneOffsets = [
      [2, 3], [5, 6], [8, 4], [11, 7], [14, 5], [17, 8], [20, 6], [23, 4]
    ];
    var j;
    for (j = 0; j < stoneOffsets.length; j++) {
      var so = stoneOffsets[j];
      var stoneGeo = new THREE.SphereGeometry(1.2, 6, 6);
      var stone = makeMesh(stoneGeo, 0x888888);
      stone.position.set(riverX + so[0], riverY + 0.5, riverZ + so[1]);
      scene.add(stone);
      objects.push(stone);
    }

    var meadowGeo = new THREE.BoxGeometry(30, 0.5, 20);
    var meadow = makeMesh(meadowGeo, 0x5A9A5A);
    meadow.position.set(riverX - 20, 0.1, riverZ + 5);
    scene.add(meadow);
    objects.push(meadow);
  }

  function buildViewpointTerrace() {
    var vx = OFFSET_X + 20;
    var vz = OFFSET_Z - 20;
    var baseY = 30;

    var tierData = [
      { w: 20, z: 0 },
      { w: 24, z: 7 },
      { w: 28, z: 14 }
    ];
    var i;
    for (i = 0; i < tierData.length; i++) {
      var td = tierData[i];
      var tierGeo = new THREE.BoxGeometry(td.w, 1, 6);
      var tier = makeMesh(tierGeo, 0xD4C5A9);
      tier.position.set(vx, baseY - i * 0.5, vz - td.z);
      scene.add(tier);
      objects.push(tier);
    }

    var benchPositions = [-8, -3, 3, 8];
    var j;
    for (j = 0; j < benchPositions.length; j++) {
      var benchGeo = new THREE.BoxGeometry(4, 1, 1);
      var bench = makeMesh(benchGeo, 0x4A2C0A);
      bench.position.set(vx + benchPositions[j], baseY + 1.5, vz + 3);
      scene.add(bench);
      objects.push(bench);
    }

    var binocs = [
      { x: vx - 9, z: vz - 1 },
      { x: vx + 9, z: vz - 1 }
    ];
    var k;
    for (k = 0; k < binocs.length; k++) {
      var bd = binocs[k];
      var standGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 6);
      var stand = makeMesh(standGeo, 0x555555);
      stand.position.set(bd.x, baseY + 2, bd.z);
      scene.add(stand);
      objects.push(stand);

      var lensGeo = new THREE.BoxGeometry(1, 1, 4);
      var lens = makeMesh(lensGeo, 0x333333);
      lens.position.set(bd.x, baseY + 4.5, bd.z);
      lens.rotation.x = -0.3;
      scene.add(lens);
      objects.push(lens);
    }
  }

  function buildWealdPanorama() {
    var backdropZ = OFFSET_Z - 80;
    var backdropY = -10;

    var hillOffsets = [
      -60, -30, 0, 30, 60
    ];
    var i;
    for (i = 0; i < hillOffsets.length; i++) {
      var hillGeo = new THREE.SphereGeometry(30, 8, 8);
      var hill = makeMesh(hillGeo, 0x4A8A4A);
      hill.position.set(OFFSET_X + hillOffsets[i], backdropY, backdropZ);
      scene.add(hill);
      objects.push(hill);
    }

    var fieldColors = [0x4A9A4A, 0xD4C5A9, 0x8B8B30, 0x4A9A4A, 0xD4C5A9, 0x8B8B30, 0x4A9A4A, 0xD4C5A9];
    var fieldOffsets = [
      [-52, -60], [-36, -60], [-20, -60], [-4, -60],
      [12, -60], [28, -60], [44, -60], [60, -60]
    ];
    var j;
    for (j = 0; j < fieldOffsets.length; j++) {
      var fo = fieldOffsets[j];
      var fieldGeo = new THREE.BoxGeometry(15, 0.3, 10);
      var field = makeMesh(fieldGeo, fieldColors[j]);
      field.position.set(OFFSET_X + fo[0], 0.15, OFFSET_Z + fo[1]);
      scene.add(field);
      objects.push(field);
    }
  }

  function build() {
    buildHill();
    buildVisitorBuilding();
    buildSalomons();
    buildBoxTrees();
    buildCyclingHairpin();
    buildRiverMole();
    buildViewpointTerrace();
    buildWealdPanorama();
  }

  function update(delta) {
    void delta;
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
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
