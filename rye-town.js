window.RyeTown = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OX = 16440;
  var OZ = 0;

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildRyeHill() {
    addToScene(makeBox(50, 12, 50, 0x8B7355, 0, 6, 0));
    addToScene(makeBox(40, 4, 40, 0x9B8365, 0, 14, 0));
    addToScene(makeBox(30, 4, 30, 0xA09070, 0, 20, 0));
  }

  function buildMermaidStreet() {
    addToScene(makeBox(6, 0.3, 40, 0xC0A870, 0, 22.15, 10));
    var i;
    for (i = 0; i < 8; i++) {
      var side = (i % 2 === 0) ? -6 : 6;
      var zOff = -16 + i * 5;
      addToScene(makeBox(8, 12, 7, 0xF5DEB3, side, 28, 10 + zOff));
      addToScene(makeBox(0.5, 10, 0.5, 0x3B1F05, side - 3, 28, 10 + zOff - 3));
      addToScene(makeBox(0.5, 10, 0.5, 0x3B1F05, side - 1, 28, 10 + zOff - 3));
      addToScene(makeBox(0.5, 10, 0.5, 0x3B1F05, side + 1, 28, 10 + zOff - 3));
      addToScene(makeBox(0.5, 10, 0.5, 0x3B1F05, side + 3, 28, 10 + zOff - 3));
      addToScene(makeBox(9, 5, 4, 0xE8D0A0, side, 34, 10 + zOff - 4.5));
    }
  }

  function buildMermaidInn() {
    addToScene(makeBox(14, 14, 8, 0xF0E0C0, -30, 29, -10));
    addToScene(makeCylinder(0.3, 0.3, 6, 8, 0x4A2C0A, -38, 25, -10));
    addToScene(makeBox(3, 2, 0.3, 0x1B4E9A, -38, 28, -10));
    addToScene(makeSphere(1.5, 0xFF3399, -30, 30, -14));
    addToScene(makeSphere(1.5, 0xFF3399, -26, 32, -14));
    addToScene(makeSphere(1.5, 0xFF3399, -34, 33, -14));
    addToScene(makeSphere(1.5, 0xFF3399, -28, 35, -14));
    addToScene(makeSphere(1.5, 0xFF3399, -32, 28, -14));
  }

  function buildYpres() {
    addToScene(makeBox(8, 16, 8, 0x8B7355, 30, 30, -20));
    addToScene(makeBox(2, 3, 2, 0x7A6345, 28, 41, -22));
    addToScene(makeBox(2, 3, 2, 0x7A6345, 32, 41, -22));
    addToScene(makeBox(2, 3, 2, 0x7A6345, 28, 41, -18));
    addToScene(makeBox(2, 3, 2, 0x7A6345, 32, 41, -18));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 26, 33, -20));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 26, 37, -20));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 34, 33, -20));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 34, 37, -20));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 30, 33, -24));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 30, 37, -24));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 30, 33, -16));
    addToScene(makeBox(0.5, 4, 0.5, 0x222222, 30, 37, -16));
  }

  function buildStMarys() {
    addToScene(makeBox(16, 18, 14, 0xD4C5A9, 0, 31, -40));
    addToScene(makeBox(8, 28, 8, 0xC8B89A, 0, 36, -40));
    addToScene(makeBox(2, 5, 2, 0xC0B090, -3, 52, -43));
    addToScene(makeBox(2, 5, 2, 0xC0B090, 3, 52, -43));
    addToScene(makeBox(2, 5, 2, 0xC0B090, -3, 52, -37));
    addToScene(makeBox(2, 5, 2, 0xC0B090, 3, 52, -37));
    addToScene(makeCylinder(2.5, 2.5, 0.5, 16, 0xFFFFFF, 0, 44, -40));
  }

  function buildLandGate() {
    addToScene(makeBox(10, 18, 6, 0x8B7355, 40, 31, 30));
    addToScene(makeCylinder(3.5, 3.5, 20, 6, 0x7A6345, 34, 32, 30));
    addToScene(makeCylinder(3.5, 3.5, 20, 6, 0x7A6345, 46, 32, 30));
    addToScene(makeBox(5, 10, 0.3, 0x111111, 40, 27, 27));
    addToScene(makeBox(0.2, 10, 0.2, 0x333333, 38, 27, 28));
    addToScene(makeBox(0.2, 10, 0.2, 0x333333, 42, 27, 28));
  }

  function buildHarbour() {
    var w, i;
    var waterOffsets = [
      [0, 0],
      [22, 0],
      [-22, 0],
      [0, 18],
      [22, 18]
    ];
    for (i = 0; i < 5; i++) {
      addToScene(makeBox(20, 0.5, 15, 0x1B6CA8, -60 + waterOffsets[i][0], 18, 60 + waterOffsets[i][1]));
    }
    addToScene(makeBox(30, 0.3, 10, 0xA0906A, -60, 18.25, 82));
    addToScene(makeBox(3, 1, 8, 0x6B3A1F, -55, 19, 65));
    addToScene(makeBox(3, 1, 8, 0x6B3A1F, -45, 19, 65));
    addToScene(makeBox(3, 1, 8, 0x6B3A1F, -65, 19, 65));
    addToScene(makeBox(2, 4, 30, 0x888888, -50, 20, 78));
  }

  function buildWatchbellStreet() {
    var heights = [10, 14, 8, 12, 6];
    var i;
    for (i = 0; i < 5; i++) {
      var xOff = -20 + i * 10;
      addToScene(makeBox(8, heights[i], 7, 0xE8D5B0, xOff, 22 + heights[i] / 2, 50));
      addToScene(makeBox(10, 2, 8, 0x8B2000, xOff, 22 + heights[i] + 1, 50));
      addToScene(makeBox(1, 4, 1, 0xCC5500, xOff - 2, 22 + heights[i] + 3, 50));
      addToScene(makeBox(1, 4, 1, 0xCC5500, xOff + 2, 22 + heights[i] + 3, 50));
    }
  }

  function build() {
    buildRyeHill();
    buildMermaidStreet();
    buildMermaidInn();
    buildYpres();
    buildStMarys();
    buildLandGate();
    buildHarbour();
    buildWatchbellStreet();
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function update(delta) {
    void delta;
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
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
