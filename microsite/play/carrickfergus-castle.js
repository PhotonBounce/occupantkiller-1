window.CarrickfergusCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 17040;
  var OFFSET_Z = 0;

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildKeep() {
    // Main keep body 18w x 16d x 28h
    makeBox(18, 28, 16, 0x8B7355, 0, 14, 0);

    // 4 corner turrets 5x5x32
    makeBox(5, 32, 5, 0x8B7355, -11.5, 16, -10.5);
    makeBox(5, 32, 5, 0x8B7355, 11.5, 16, -10.5);
    makeBox(5, 32, 5, 0x8B7355, -11.5, 16, 10.5);
    makeBox(5, 32, 5, 0x8B7355, 11.5, 16, 10.5);

    // Crenellated battlements along top: 12 merlons 2x4x2 at y=30
    var i;
    for (i = 0; i < 6; i++) {
      makeBox(2, 4, 2, 0x8B7355, -12.5 + i * 5, 30, -8);
      makeBox(2, 4, 2, 0x8B7355, -12.5 + i * 5, 30, 8);
    }

    // Window slots 6x (1 wide x 6 tall x 0.5 deep) dark stone
    makeBox(1, 6, 0.5, 0x222222, -4, 10, -8.1);
    makeBox(1, 6, 0.5, 0x222222, 0, 10, -8.1);
    makeBox(1, 6, 0.5, 0x222222, 4, 10, -8.1);
    makeBox(1, 6, 0.5, 0x222222, -4, 20, -8.1);
    makeBox(1, 6, 0.5, 0x222222, 0, 20, -8.1);
    makeBox(1, 6, 0.5, 0x222222, 4, 20, -8.1);
  }

  function buildInnerWard() {
    // Inner bailey walls 4 sections, color 0x7A6545
    // North wall 30x14x2
    makeBox(30, 14, 2, 0x7A6545, 0, 7, -22);
    // South wall
    makeBox(30, 14, 2, 0x7A6545, 0, 7, 22);
    // West wall 2x14x30
    makeBox(2, 14, 30, 0x7A6545, -15, 7, 0);
    // East wall
    makeBox(2, 14, 30, 0x7A6545, 15, 7, 0);

    // 3 round towers CylinderGeometry r=4 h=16 seg=8 at corners/midpoints
    makeCylinder(4, 4, 16, 8, 0x6A5535, -15, 8, -22);
    makeCylinder(4, 4, 16, 8, 0x6A5535, 15, 8, -22);
    makeCylinder(4, 4, 16, 8, 0x6A5535, 0, 8, 22);
  }

  function buildMiddleWard() {
    // Second defensive ring walls, color 0x8B7355
    // North wall 45x12x2
    makeBox(45, 12, 2, 0x8B7355, 0, 6, -38);
    // South wall
    makeBox(45, 12, 2, 0x8B7355, 0, 6, 38);
    // West wall 2x12x45
    makeBox(2, 12, 45, 0x8B7355, -22.5, 6, 0);
    // East wall
    makeBox(2, 12, 45, 0x8B7355, 22.5, 6, 0);

    // Gatehouse 12x8x16 on south wall
    makeBox(12, 16, 8, 0x8B7355, 0, 8, 38);
    // Dark arch inset 5x8 in gatehouse
    makeBox(5, 8, 0.5, 0x111111, 0, 4, 34.1);

    // 2 flanking towers CylinderGeometry r=3 h=18 seg=6
    makeCylinder(3, 3, 18, 6, 0x7A6545, -7, 9, 38);
    makeCylinder(3, 3, 18, 6, 0x7A6545, 7, 9, 38);
  }

  function buildOuterWard() {
    // Sea-facing outer walls 2x10x55, color 0x7A6545
    makeBox(2, 10, 55, 0x7A6545, -32, 5, 0);
    makeBox(2, 10, 55, 0x7A6545, 32, 5, 0);
    makeBox(55, 10, 2, 0x7A6545, 0, 5, -48);
    makeBox(55, 10, 2, 0x7A6545, 0, 5, 48);

    // Wall walk on top: BoxGeometry 2x2x50
    makeBox(50, 2, 2, 0x7A6545, 0, 11, -48);
    makeBox(50, 2, 2, 0x7A6545, 0, 11, 48);

    // Gun ports: 6 BoxGeometry 2x2x2 dark at intervals on west sea wall
    var i;
    for (i = 0; i < 6; i++) {
      makeBox(2, 2, 2, 0x111111, -32.1, 5, -25 + i * 10);
    }
  }

  function buildSeaApproach() {
    // Rocky basalt platform 60x4x40 color 0x3A3A4A
    makeBox(60, 4, 40, 0x3A3A4A, 0, -2, 0);

    // Belfast Lough water: 5 BoxGeometry 25x0.5x20 color 0x1B4E8A
    makeBox(25, 0.5, 20, 0x1B4E8A, -50, 0, -30);
    makeBox(25, 0.5, 20, 0x1B4E8A, -50, 0, 10);
    makeBox(25, 0.5, 20, 0x1B4E8A, -80, 0, -10);
    makeBox(25, 0.5, 20, 0x1B4E8A, -50, 0, -10);
    makeBox(25, 0.5, 20, 0x1B4E8A, -80, 0, 20);
  }

  function buildWilliamLanding() {
    // Ship hull 8x4x20 BoxGeometry color 0x4A2C0A wood
    makeBox(8, 4, 20, 0x4A2C0A, -70, 2, 0);

    // Furled sails BoxGeometry 12x8x0.5 color 0xF5DEB3
    makeBox(12, 8, 0.5, 0xF5DEB3, -70, 8, -4);
    makeBox(12, 8, 0.5, 0xF5DEB3, -70, 8, 4);

    // Mast pole
    makeBox(0.5, 16, 0.5, 0x4A2C0A, -70, 12, 0);

    // Landing party: 6 figure pairs (body 1x4x1 + head 0.8x1.2x0.8) color 0xCC0000
    var i;
    for (i = 0; i < 6; i++) {
      // Body
      makeBox(1, 4, 1, 0xCC0000, -58 + i * 3, 2, 5);
      // Head
      makeBox(0.8, 1.2, 0.8, 0xCC0000, -58 + i * 3, 5, 5);
    }
  }

  function buildTownWalls() {
    // Town wall remains: 2 BoxGeometry 2x8x30 color 0x8B7355
    makeBox(2, 8, 30, 0x8B7355, 40, 4, -20);
    makeBox(2, 8, 30, 0x8B7355, 60, 4, -20);

    // North Gate arch 8x12x4 color 0x7A6545
    makeBox(8, 12, 4, 0x7A6545, 50, 6, -20);
    // Dark arch opening 4x8
    makeBox(4, 8, 0.5, 0x111111, 50, 4, -18.1);

    // Moat ditch 50x4x6 color 0x2A3040
    makeBox(50, 4, 6, 0x2A3040, 20, -2, 60);
  }

  function buildMuseumCannon() {
    // 3 cannons: barrel CylinderGeometry r=1 h=8 color 0x444444 horizontal
    // Carriage BoxGeometry 2x2x10 color 0x4A2C0A
    // Wheels CylinderGeometry r=1.5 h=0.5 color 0x333333
    var i;
    for (i = 0; i < 3; i++) {
      var cx = 10 + i * 8;
      var cy = 2;
      var cz = -60;

      // Cannon barrel lying on its side (rotate via geometry by using CylinderGeometry with h=8 along x axis)
      var barrelGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
      var barrelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(OFFSET_X + cx, cy + 2, OFFSET_Z + cz);
      scene.add(barrel);
      objects.push(barrel);

      // Wheeled carriage
      makeBox(2, 2, 10, 0x4A2C0A, cx, cy, cz);

      // Left wheel
      var wheelGeoL = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
      var wheelMatL = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var wheelL = new THREE.Mesh(wheelGeoL, wheelMatL);
      wheelL.rotation.z = Math.PI / 2;
      wheelL.position.set(OFFSET_X + cx, cy, OFFSET_Z + cz - 3);
      scene.add(wheelL);
      objects.push(wheelL);

      // Right wheel
      var wheelGeoR = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
      var wheelMatR = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var wheelR = new THREE.Mesh(wheelGeoR, wheelMatR);
      wheelR.rotation.z = Math.PI / 2;
      wheelR.position.set(OFFSET_X + cx, cy, OFFSET_Z + cz + 3);
      scene.add(wheelR);
      objects.push(wheelR);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function build() {
    buildKeep();
    buildInnerWard();
    buildMiddleWard();
    buildOuterWard();
    buildSeaApproach();
    buildWilliamLanding();
    buildTownWalls();
    buildMuseumCannon();
  }

  function update(delta) {
    // Static environment — no per-frame updates required
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
