window.BlarneyCastle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 17240;
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

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildKeep() {
    // Main tower keep 18w x 16d x 28h
    makeBox(18, 28, 16, 0x8B7355, 0, 14, 0);

    // 4 corner machicolation turrets 4x4x32
    makeBox(4, 32, 4, 0x8B7355, -9, 16, -8);
    makeBox(4, 32, 4, 0x8B7355, 9, 16, -8);
    makeBox(4, 32, 4, 0x8B7355, -9, 16, 8);
    makeBox(4, 32, 4, 0x8B7355, 9, 16, 8);

    // Crenellated battlements top - 10 merlons 2x4x2
    var merlonY = 30;
    makeBox(2, 4, 2, 0x8B7355, -8, merlonY, -8);
    makeBox(2, 4, 2, 0x8B7355, -4, merlonY, -8);
    makeBox(2, 4, 2, 0x8B7355, 0, merlonY, -8);
    makeBox(2, 4, 2, 0x8B7355, 4, merlonY, -8);
    makeBox(2, 4, 2, 0x8B7355, 8, merlonY, -8);
    makeBox(2, 4, 2, 0x8B7355, -8, merlonY, 8);
    makeBox(2, 4, 2, 0x8B7355, -4, merlonY, 8);
    makeBox(2, 4, 2, 0x8B7355, 4, merlonY, 8);
    makeBox(2, 4, 2, 0x8B7355, 8, merlonY, 8);
    makeBox(2, 4, 2, 0x8B7355, -8, merlonY, 0);

    // Arrow loops 8 - 0.8x6x0.5 dark
    makeBox(0.8, 6, 0.5, 0x333333, -5, 12, -8.1);
    makeBox(0.8, 6, 0.5, 0x333333, 5, 12, -8.1);
    makeBox(0.8, 6, 0.5, 0x333333, -5, 20, -8.1);
    makeBox(0.8, 6, 0.5, 0x333333, 5, 20, -8.1);
    makeBox(0.8, 6, 0.5, 0x333333, -5, 12, 8.1);
    makeBox(0.8, 6, 0.5, 0x333333, 5, 12, 8.1);
    makeBox(0.8, 6, 0.5, 0x333333, -5, 20, 8.1);
    makeBox(0.8, 6, 0.5, 0x333333, 5, 20, 8.1);
  }

  function buildBlarneyStone() {
    // Blarney Stone limestone block 1.5x0.8x2 in battlement
    makeBox(1.5, 0.8, 2, 0xD4C5A9, 3, 29.4, -8);

    // Blue ribbon above it 1.5x0.1x0.5
    makeBox(1.5, 0.1, 0.5, 0x0000CC, 3, 30.2, -8);

    // 3 tourists implied by figure BoxGeometry leaning over battlement
    // Tourist 1 orange
    makeBox(0.8, 3, 0.8, 0xFF6600, 2, 30.5, -9.2);
    // Tourist 2 blue
    makeBox(0.8, 3, 0.8, 0x3333FF, 3, 30.5, -9.2);
    // Tourist 3 red
    makeBox(0.8, 3, 0.8, 0xFF0000, 4, 30.5, -9.2);
  }

  function buildInnerWard() {
    // Inner courtyard floor 20x0.5x16
    makeBox(20, 0.5, 16, 0xC0B0A0, 0, 0.25, 30);

    // Surrounding wall stubs 2x8x14 sides
    makeBox(2, 8, 14, 0x7A6545, -11, 4, 30);
    makeBox(2, 8, 14, 0x7A6545, 11, 4, 30);
    // Wall stubs 2x8x10 ends
    makeBox(2, 8, 10, 0x7A6545, 0, 4, 23);
    makeBox(2, 8, 10, 0x7A6545, 0, 4, 37);

    // Well shaft CylinderGeometry r=2 h=3
    makeCylinder(2, 2, 3, 12, 0x555555, 0, 1.5, 30);
    // Well cover ConeGeometry r=3 h=4
    makeCone(3, 4, 12, 0x4A2C0A, 0, 4.5, 30);
  }

  function buildPoisonGarden() {
    var pgX = 30;
    var pgZ = 20;

    // 8 raised garden beds 4x1x6
    makeBox(4, 1, 6, 0x3A2010, pgX, 0.5, pgZ);
    makeBox(4, 1, 6, 0x3A2010, pgX + 6, 0.5, pgZ);
    makeBox(4, 1, 6, 0x3A2010, pgX + 12, 0.5, pgZ);
    makeBox(4, 1, 6, 0x3A2010, pgX + 18, 0.5, pgZ);
    makeBox(4, 1, 6, 0x3A2010, pgX, 0.5, pgZ + 9);
    makeBox(4, 1, 6, 0x3A2010, pgX + 6, 0.5, pgZ + 9);
    makeBox(4, 1, 6, 0x3A2010, pgX + 12, 0.5, pgZ + 9);
    makeBox(4, 1, 6, 0x3A2010, pgX + 18, 0.5, pgZ + 9);

    // Skull and crossbones gate posts 0.5x8x0.5
    makeBox(0.5, 8, 0.5, 0x333333, pgX - 2, 4, pgZ - 5);
    makeBox(0.5, 8, 0.5, 0x333333, pgX + 2, 4, pgZ - 5);
    // Crossbar 6x0.5x0.5
    makeBox(6, 0.5, 0.5, 0x333333, pgX, 7.75, pgZ - 5);

    // 2 skull spheres r=1
    makeSphere(1, 8, 8, 0xEEEEEE, pgX - 1.5, 9.5, pgZ - 5);
    makeSphere(1, 8, 8, 0xEEEEEE, pgX + 1.5, 9.5, pgZ - 5);

    // 10 poisonous plants SphereGeometry r=1.5 dark green
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX, 2, pgZ);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 6, 2, pgZ);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 12, 2, pgZ);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 18, 2, pgZ);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX, 2, pgZ + 9);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 6, 2, pgZ + 9);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 12, 2, pgZ + 9);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 18, 2, pgZ + 9);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 3, 2, pgZ + 4);
    makeSphere(1.5, 8, 8, 0x1A8A1A, pgX + 9, 2, pgZ + 4);
  }

  function buildWishingSteps() {
    var wsX = -30;
    var wsZ = 10;

    // 12 steps descending BoxGeometry 4x0.5x2
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX, 0.25, wsZ);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 1, -0.25, wsZ + 2.2);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 2, -0.75, wsZ + 4.4);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 3, -1.25, wsZ + 6.6);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 4, -1.75, wsZ + 8.8);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 4.5, -2.25, wsZ + 11.0);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 4.5, -2.75, wsZ + 13.2);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 4, -3.25, wsZ + 15.4);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 3, -3.75, wsZ + 17.6);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 2, -4.25, wsZ + 19.8);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX - 1, -4.75, wsZ + 22.0);
    makeBox(4, 0.5, 2, 0xD4C5A9, wsX, -5.25, wsZ + 24.2);

    // Handrail along side BoxGeometry 0.3x0.3x24
    makeBox(0.3, 0.3, 24, 0xD4C5A9, wsX + 2.2, 1.5, wsZ + 12);

    // Wishing well CylinderGeometry r=2 h=4
    makeCylinder(2, 2, 4, 12, 0x888888, wsX - 2, -3.25, wsZ + 28);
    // Wishing well roof ConeGeometry r=3 h=4
    makeCone(3, 4, 12, 0x4A2C0A, wsX - 2, 0.75, wsZ + 28);
    // Rope CylinderGeometry r=0.2 h=6 hanging
    makeCylinder(0.2, 0.2, 6, 6, 0x8B6914, wsX - 2, -0.25, wsZ + 28);
  }

  function buildRockClose() {
    var rcX = -25;
    var rcZ = -30;

    // 4 large half-buried ancient monolith spheres
    makeSphere(5, 12, 12, 0x8B7355, rcX, 2, rcZ);
    makeSphere(6, 12, 12, 0x8B7355, rcX + 15, 3, rcZ + 5);
    makeSphere(4, 12, 12, 0x8B7355, rcX + 5, 1.5, rcZ - 10);
    makeSphere(7, 12, 12, 0x8B7355, rcX + 22, 3.5, rcZ - 5);

    // 3 dolmens: each has 2 uprights + capstone
    // Dolmen 1
    makeBox(2, 8, 2, 0x8B7355, rcX - 8, 4, rcZ + 10);
    makeBox(2, 8, 2, 0x8B7355, rcX - 4, 4, rcZ + 10);
    makeBox(6, 2, 4, 0x8B7355, rcX - 6, 9, rcZ + 10);

    // Dolmen 2
    makeBox(2, 8, 2, 0x8B7355, rcX + 8, 4, rcZ - 15);
    makeBox(2, 8, 2, 0x8B7355, rcX + 12, 4, rcZ - 15);
    makeBox(6, 2, 4, 0x8B7355, rcX + 10, 9, rcZ - 15);

    // Dolmen 3
    makeBox(2, 8, 2, 0x8B7355, rcX + 25, 4, rcZ + 8);
    makeBox(2, 8, 2, 0x8B7355, rcX + 29, 4, rcZ + 8);
    makeBox(6, 2, 4, 0x8B7355, rcX + 27, 9, rcZ + 8);

    // Ancient yew tree trunk CylinderGeometry r=3 h=10
    makeCylinder(3, 3, 10, 10, 0x2C1810, rcX + 12, 5, rcZ);
    // Ancient yew canopy SphereGeometry r=8 dark
    makeSphere(8, 10, 10, 0x0A3D0A, rcX + 12, 14, rcZ);
  }

  function buildVillage() {
    var vX = 40;
    var vZ = -20;

    // 6 painted shopfronts BoxGeometry 8x10x6
    makeBox(8, 10, 6, 0x4A90D4, vX, 5, vZ);
    makeBox(8, 10, 6, 0xCC3333, vX + 10, 5, vZ);
    makeBox(8, 10, 6, 0x2D8B2D, vX + 20, 5, vZ);
    makeBox(8, 10, 6, 0xFFCC00, vX + 30, 5, vZ);
    makeBox(8, 10, 6, 0x4A90D4, vX + 40, 5, vZ);
    makeBox(8, 10, 6, 0xCC3333, vX + 50, 5, vZ);

    // Pub sign post 0.5x5x0.5
    makeBox(0.5, 5, 0.5, 0x8B4513, vX + 10, 7.5, vZ - 4);
    // Pub sign board 3x2x0.3
    makeBox(3, 2, 0.3, 0x8B4513, vX + 11, 10, vZ - 4);
  }

  function buildRiverMartin() {
    var rvX = -45;
    var rvZ = 0;

    // 3 water tiles BoxGeometry 12x0.5x20
    makeBox(12, 0.5, 20, 0x1B6CA8, rvX, -0.25, rvZ - 20);
    makeBox(12, 0.5, 20, 0x1B6CA8, rvX, -0.25, rvZ);
    makeBox(12, 0.5, 20, 0x1B6CA8, rvX, -0.25, rvZ + 20);

    // Kingfisher perch CylinderGeometry r=0.2 h=6
    makeCylinder(0.2, 0.2, 6, 6, 0x4A2C0A, rvX + 4, 3, rvZ - 5);
    // Kingfisher SphereGeometry r=0.5 blue
    makeSphere(0.5, 8, 8, 0x0000CC, rvX + 4, 6.5, rvZ - 5);

    // Wooden footbridge BoxGeometry 4x1x16
    makeBox(4, 1, 16, 0x8B6914, rvX, 0.5, rvZ);

    // 8 railing posts 0.3x4x0.3
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX - 1.85, 2.5, rvZ - 7);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX + 1.85, 2.5, rvZ - 7);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX - 1.85, 2.5, rvZ - 4);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX + 1.85, 2.5, rvZ - 4);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX - 1.85, 2.5, rvZ);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX + 1.85, 2.5, rvZ);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX - 1.85, 2.5, rvZ + 4);
    makeBox(0.3, 4, 0.3, 0x8B6914, rvX + 1.85, 2.5, rvZ + 4);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function build() {
    buildKeep();
    buildBlarneyStone();
    buildInnerWard();
    buildPoisonGarden();
    buildWishingSteps();
    buildRockClose();
    buildVillage();
    buildRiverMartin();
  }

  function update(delta) {
    // static environment — no per-frame animation required
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
