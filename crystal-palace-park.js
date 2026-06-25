window.CrystalPalacePark = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 16800;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeMat(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function addBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCyl(rTop, rBot, h, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, 8);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSph(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildTerraces() {
    // 3 massive stone terraces stepped descending northward
    addBox(80, 5, 20, 0xD4C5A9, 0, 2.5, 0);
    addBox(70, 4, 20, 0xD4C5A9, 0, 7, -22);
    addBox(60, 3, 20, 0xD4C5A9, 0, 10.5, -44);

    // 12 sphinx statues atop upper terrace (3x4x6)
    var sphinxXs = [-33, -22, -11, 0, 11, 22, -33, -22, -11, 0, 11, 22];
    var sphinxRows = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
    for (var i = 0; i < 12; i++) {
      var sz = sphinxRows[i] === 0 ? -3 : 3;
      addBox(3, 4, 6, 0xD0C0A8, sphinxXs[i], 7, sz);
    }
  }

  function buildIguanodon() {
    var bx = -60;
    var bz = 80;
    // body
    addBox(6, 5, 10, 0x5A8A5A, bx, 5, bz);
    // neck vertical
    addBox(2, 6, 2, 0x5A8A5A, bx, 10.5, bz - 3);
    // head
    addBox(3, 3, 4, 0x5A8A5A, bx, 14, bz - 4);
    // tail
    addBox(1, 1, 8, 0x5A8A5A, bx, 3.5, bz + 8);
    // 4 thick legs
    addBox(1.5, 5, 1.5, 0x5A8A5A, bx - 2, 2.5, bz - 3);
    addBox(1.5, 5, 1.5, 0x5A8A5A, bx + 2, 2.5, bz - 3);
    addBox(1.5, 5, 1.5, 0x5A8A5A, bx - 2, 2.5, bz + 3);
    addBox(1.5, 5, 1.5, 0x5A8A5A, bx + 2, 2.5, bz + 3);
  }

  function buildMegalosaurus() {
    var bx = -30;
    var bz = 90;
    // body 8x4x12
    addBox(8, 4, 12, 0x6A7A5A, bx, 4, bz);
    // 2 short foreleg boxes
    addBox(1.5, 3, 1.5, 0x6A7A5A, bx - 3, 2.5, bz - 4);
    addBox(1.5, 3, 1.5, 0x6A7A5A, bx + 3, 2.5, bz - 4);
    // long tail
    addBox(1.5, 1.5, 10, 0x6A7A5A, bx, 3, bz + 10);
    // jaws 2x2x6
    addBox(2, 2, 6, 0x6A7A5A, bx, 7, bz - 7);
    // hind legs
    addBox(2, 5, 2, 0x6A7A5A, bx - 3, 2.5, bz + 3);
    addBox(2, 5, 2, 0x6A7A5A, bx + 3, 2.5, bz + 3);
  }

  function buildIchthyosaur() {
    var bx = 0;
    var bz = 100;
    // aquatic body 3x2x16
    addBox(3, 2, 16, 0x3A6A8A, bx, 1.5, bz);
    // dorsal fin 1x4x0.5
    addBox(1, 4, 0.5, 0x3A6A8A, bx, 5, bz);
    // 4 paddle flippers
    addBox(4, 0.8, 2, 0x3A6A8A, bx - 4, 1.5, bz - 4);
    addBox(4, 0.8, 2, 0x3A6A8A, bx + 4, 1.5, bz - 4);
    addBox(3, 0.8, 1.5, 0x3A6A8A, bx - 3.5, 1.5, bz + 4);
    addBox(3, 0.8, 1.5, 0x3A6A8A, bx + 3.5, 1.5, bz + 4);
  }

  function buildDinosaurLake() {
    // 5 water tiles 20x0.5x15
    addBox(20, 0.5, 15, 0x2B7DBF, -70, 0.25, 80);
    addBox(20, 0.5, 15, 0x2B7DBF, -50, 0.25, 90);
    addBox(20, 0.5, 15, 0x2B7DBF, -30, 0.25, 100);
    addBox(20, 0.5, 15, 0x2B7DBF, -10, 0.25, 90);
    addBox(20, 0.5, 15, 0x2B7DBF, 10, 0.25, 80);
    // 3 island mounds 15x3x12
    addBox(15, 3, 12, 0x4A7A4A, -60, 1.5, 80);
    addBox(15, 3, 12, 0x4A7A4A, -30, 1.5, 90);
    addBox(15, 3, 12, 0x4A7A4A, 0, 1.5, 100);
  }

  function buildBroadcastTowers() {
    // Two tall chimney stumps CylinderGeometry r=3 h=40
    addCyl(3, 3, 40, 0xD0C8B8, 100, 20, -50);
    addCyl(3, 3, 40, 0xD0C8B8, 120, 20, -50);
    // Ruined top BoxGeometry chunks 4x6x4 at base
    addBox(4, 6, 4, 0xD4C5A9, 97, 5, -47);
    addBox(4, 6, 4, 0xD4C5A9, 103, 5, -53);
    addBox(4, 6, 4, 0xD4C5A9, 117, 5, -47);
    addBox(4, 6, 4, 0xD4C5A9, 123, 5, -53);
  }

  function buildConcertBowl() {
    var bx = 60;
    var bz = -80;
    // 3 curved seating tiers
    addBox(40, 2, 8, 0x888888, bx, 1, bz);
    addBox(36, 2, 8, 0x888888, bx, 3, bz + 9);
    addBox(32, 2, 8, 0x888888, bx, 5, bz + 18);
    // stage 20x2x15
    addBox(20, 2, 15, 0xD4C5A9, bx, 1, bz - 16);
    // backstage roof 22x8x12
    addBox(22, 8, 12, 0x555555, bx, 6, bz - 22);
  }

  function buildItalianGardens() {
    var gx = -100;
    var gz = -40;
    // 6 hedge borders 2x2x20
    addBox(2, 2, 20, 0x1A5A1A, gx, 1, gz);
    addBox(2, 2, 20, 0x1A5A1A, gx + 22, 1, gz);
    addBox(2, 2, 20, 0x1A5A1A, gx + 44, 1, gz);
    addBox(2, 2, 20, 0x1A5A1A, gx, 1, gz + 25);
    addBox(2, 2, 20, 0x1A5A1A, gx + 22, 1, gz + 25);
    addBox(2, 2, 20, 0x1A5A1A, gx + 44, 1, gz + 25);
    // 4 urns: CylinderGeometry r=2 h=4 on BoxGeometry 3x3x3 pedestal
    addBox(3, 3, 3, 0xD4C5A9, gx + 5, 1.5, gz + 5);
    addCyl(2, 2, 4, 0xD4C5A9, gx + 5, 5, gz + 5);
    addBox(3, 3, 3, 0xD4C5A9, gx + 17, 1.5, gz + 5);
    addCyl(2, 2, 4, 0xD4C5A9, gx + 17, 5, gz + 5);
    addBox(3, 3, 3, 0xD4C5A9, gx + 5, 1.5, gz + 18);
    addCyl(2, 2, 4, 0xD4C5A9, gx + 5, 5, gz + 18);
    addBox(3, 3, 3, 0xD4C5A9, gx + 17, 1.5, gz + 18);
    addCyl(2, 2, 4, 0xD4C5A9, gx + 17, 5, gz + 18);
    // 3 fountain basins CylinderGeometry r=4 h=1
    addCyl(4, 4, 1, 0x888888, gx + 11, 0.5, gz + 5);
    addCyl(4, 4, 1, 0x888888, gx + 11, 0.5, gz + 12);
    addCyl(4, 4, 1, 0x888888, gx + 11, 0.5, gz + 18);
  }

  function buildSportsCentre() {
    var bx = 80;
    var bz = 40;
    // Main brutalist building 40x18x30 (w x h x d = 40x30x18)
    addBox(40, 18, 30, 0xB0A898, bx, 9, bz);
    // Cantilevered roof 44x4x34
    addBox(44, 4, 34, 0x999888, bx, 20, bz);
    // Diving platform tower 4x30x4
    addBox(4, 30, 4, 0x888888, bx + 24, 15, bz);
    // 3 platform boards 8x0.5x3 at intervals
    addBox(8, 0.5, 3, 0x888888, bx + 28, 10, bz);
    addBox(8, 0.5, 3, 0x888888, bx + 28, 18, bz);
    addBox(8, 0.5, 3, 0x888888, bx + 28, 26, bz);
  }

  function buildWoodland() {
    // 20 mature trees
    var treeData = [
      [-80, -70], [-60, -65], [-40, -75], [-20, -68], [20, -72],
      [40, -66], [60, -70], [80, -68], [100, -73], [120, -65],
      [-90, 40], [-70, 50], [-50, 45], [30, 50], [50, 48],
      [70, 55], [90, 42], [110, 50], [-100, -20], [130, 30]
    ];
    for (var i = 0; i < treeData.length; i++) {
      var tx = treeData[i][0];
      var tz = treeData[i][1];
      // trunk CylinderGeometry r=1.5 h=14
      addCyl(1.5, 1.5, 14, 0x3D1F08, tx, 7, tz);
      // canopy SphereGeometry r=9
      addSph(9, 0x2D7A2D, tx, 18, tz);
    }
    // Wide path 6x0.3x60
    addBox(6, 0.3, 60, 0xD0C0A0, 0, 0.15, -60);
    // Victorian lamp posts along path
    var lampXs = [-10, 0, 10];
    var lampZs = [-40, -60, -80];
    for (var j = 0; j < 3; j++) {
      // post CylinderGeometry r=0.4 h=10
      addCyl(0.4, 0.4, 10, 0x4A4A4A, lampXs[j], 5, lampZs[j]);
      // globe SphereGeometry r=1.5
      addSph(1.5, 0xFFFF99, lampXs[j], 11, lampZs[j]);
    }
  }

  function build() {
    buildTerraces();
    buildDinosaurLake();
    buildIguanodon();
    buildMegalosaurus();
    buildIchthyosaur();
    buildBroadcastTowers();
    buildConcertBowl();
    buildItalianGardens();
    buildSportsCentre();
    buildWoodland();
  }

  function update(delta) {
    // static environment — no animation
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
