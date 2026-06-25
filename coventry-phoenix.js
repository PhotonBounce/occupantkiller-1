window.CoventryPhoenix = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OFFSET_X = 15800;
  var OFFSET_Z = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeCylinder(rt, rb, h, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildRuins() {
    var wallColor = 0xB8A898;

    // Wall 1 — long south wall
    makeBox(2, 24, 40, wallColor, -20, 12, 0);
    // Tooth protrusions on wall 1
    makeBox(2, 4, 3, wallColor, -20, 28, -15);
    makeBox(2, 6, 3, wallColor, -20, 30, -5);
    makeBox(2, 3, 3, wallColor, -20, 27, 8);
    makeBox(2, 5, 3, wallColor, -20, 29, 18);

    // Wall 2 — north wall
    makeBox(2, 24, 30, wallColor, 20, 12, -5);
    // Tooth protrusions on wall 2
    makeBox(2, 5, 3, wallColor, 20, 29, -12);
    makeBox(2, 3, 3, wallColor, 20, 27, -2);
    makeBox(2, 7, 3, wallColor, 20, 31, 8);

    // Wall 3 — east end partial wall
    makeBox(2, 24, 20, wallColor, 0, 12, 20);
    // Rotated to run east-west — reposition so it spans the end
    makeBox(20, 24, 2, wallColor, 0, 12, 22);
    // Tooth protrusions on wall 3
    makeBox(3, 4, 2, wallColor, -8, 28, 22);
    makeBox(3, 6, 2, wallColor, 5, 30, 22);
    makeBox(3, 3, 2, wallColor, 14, 27, 22);
  }

  function buildCrossOfNails() {
    // Pedestal
    makeBox(4, 3, 4, 0x888888, -5, 1.5, -15);
    // Horizontal beam
    makeBox(14, 1, 1, 0x4A2C0A, -5, 4.5, -15);
    // Vertical beam
    makeBox(1, 1, 8, 0x4A2C0A, -5, 4.5, -15);
  }

  function buildNewCathedralSpire() {
    var sandstone = 0xE8D5C4;
    // Base section of spire
    makeBox(10, 40, 10, sandstone, 50, 20, 0);
    // Upper tapering section
    makeBox(6, 10, 6, sandstone, 50, 45, 0);
  }

  function buildNewCathedralBody() {
    var bodyColor = 0xD4C5B0;
    var glassColor = 0x87CEEB;

    // Main cathedral body
    makeBox(40, 22, 25, bodyColor, 50, 11, 20);

    // 14 window bays evenly spaced along the 40w body
    // Span from x=50-20=30 to x=50+20=70, step = 40/13 ~ 3.08
    var i;
    var startX = -20 + (40 / 15);
    var stepX = 40 / 15;
    for (i = 0; i < 14; i++) {
      var wx = startX + i * stepX;
      makeBox(1, 18, 0.5, glassColor, 50 + wx - 20, 12, 20 + 12.5);
    }
  }

  function buildEcumenicalCross() {
    var silver = 0xC0C0C0;
    // Stone plinth
    makeBox(3, 2, 3, 0x999999, 30, 1, -30);
    // Vertical member
    makeBox(2, 30, 2, silver, 30, 17, -30);
    // Horizontal member
    makeBox(12, 2, 2, silver, 30, 25, -30);
  }

  function buildPhoenixSculpture() {
    var fireOrange = 0xFF6600;
    // Base
    makeBox(3, 5, 3, 0x888888, 15, 2.5, -35);

    // Body center block
    makeBox(2, 4, 2, fireOrange, 15, 7, -35);
    // Left wing lower
    makeBox(5, 1.5, 1.5, fireOrange, 12, 8.5, -35);
    // Left wing upper tip — angled implied by offset height
    makeBox(4, 1, 1, fireOrange, 9.5, 10, -35);
    // Right wing lower
    makeBox(5, 1.5, 1.5, fireOrange, 18, 8.5, -35);
    // Right wing upper tip
    makeBox(4, 1, 1, fireOrange, 20.5, 10, -35);
  }

  function buildPrioryGardens() {
    var stoneColor = 0x888888;
    var hedgeColor = 0x2D5A1B;

    // 6 low stone walls
    makeBox(2, 3, 10, stoneColor, -35, 1.5, -10);
    makeBox(2, 3, 10, stoneColor, -35, 1.5, 5);
    makeBox(2, 3, 10, stoneColor, -35, 1.5, 20);
    makeBox(10, 3, 2, stoneColor, -28, 1.5, -15);
    makeBox(10, 3, 2, stoneColor, -28, 1.5, 0);
    makeBox(10, 3, 2, stoneColor, -28, 1.5, 15);

    // Overgrown hedges — SphereGeometry
    makeSphere(3, hedgeColor, -40, 3, -12);
    makeSphere(3, hedgeColor, -40, 3, 0);
    makeSphere(3, hedgeColor, -40, 3, 12);
    makeSphere(3, hedgeColor, -32, 3, -20);
    makeSphere(3, hedgeColor, -32, 3, 22);
  }

  function buildWarMemorial() {
    // Base slab
    makeBox(6, 1, 6, 0x666666, 10, 0.5, -50);

    // 10 name plaques arranged in a row
    var i;
    var startX = -2.25;
    var stepX = 0.5;
    for (i = 0; i < 10; i++) {
      makeBox(1, 0.5, 0.3, 0x333333, 10 + startX + i * stepX, 1.25, -50);
    }
  }

  function build() {
    buildRuins();
    buildCrossOfNails();
    buildNewCathedralSpire();
    buildNewCathedralBody();
    buildEcumenicalCross();
    buildPhoenixSculpture();
    buildPrioryGardens();
    buildWarMemorial();
  }

  function update(delta) {
    // Static environment — no per-frame animation needed
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
