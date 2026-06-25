window.DublinTrinity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var OX = 17120;
  var OZ = 0;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function makeCylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function addObject(mesh) {
    scene.add(mesh);
    objects.push(mesh);
  }

  function buildFrontSquare() {
    // Cobblestone quad floor
    addObject(makeBox(50, 0.5, 40, 0xC0B0A0, 0, 0.25, 0));

    // Rubrics building — 3 sections in a row
    addObject(makeBox(10, 14, 8, 0xCC5500, -10, 7.25, -24));
    addObject(makeBox(10, 14, 8, 0xCC5500, 0, 7.25, -24));
    addObject(makeBox(10, 14, 8, 0xCC5500, 10, 7.25, -24));
  }

  function buildWestFront() {
    // Main Palladian gate building body
    addObject(makeBox(40, 20, 12, 0xF0EAD0, 0, 10.25, -38));

    // 6 Corinthian columns across the facade
    var colPositions = [-15, -9, -3, 3, 9, 15];
    for (var i = 0; i < colPositions.length; i++) {
      addObject(makeCylinder(2.5, 2.5, 16, 8, 0xEEE8C8, colPositions[i], 8.25, -44));
    }

    // Triangular pediment
    addObject(makeBox(42, 5, 4, 0xEEE8C8, 0, 21.5, -44));

    // Gate opening dark inset
    addObject(makeBox(8, 12, 0.5, 0x222222, 0, 6.25, -44.2));

    // Iron gate bars — 4 vertical bars
    addObject(makeBox(0.5, 10, 0.5, 0x111111, -3, 5.25, -44.3));
    addObject(makeBox(0.5, 10, 0.5, 0x111111, -1, 5.25, -44.3));
    addObject(makeBox(0.5, 10, 0.5, 0x111111, 1, 5.25, -44.3));
    addObject(makeBox(0.5, 10, 0.5, 0x111111, 3, 5.25, -44.3));
  }

  function buildCampanile() {
    // Main shaft
    addObject(makeCylinder(2, 2, 32, 8, 0xD0C8B8, 0, 16.25, 0));

    // Bell stage
    addObject(makeCylinder(3, 3, 6, 8, 0xC8C0B0, 0, 35.25, 0));

    // Dome base ring
    addObject(makeCylinder(3, 3, 2, 8, 0xD8D0C0, 0, 39.25, 0));

    // Dome sphere
    addObject(makeSphere(3, 0xD8D0C0, 0, 41.25, 0));

    // Cross — vertical
    addObject(makeBox(0.5, 5, 0.5, 0xC8C0B0, 0, 45.75, 0));

    // Cross — horizontal
    addObject(makeBox(3, 0.5, 0.5, 0xC8C0B0, 0, 47.5, 0));
  }

  function buildOldLibrary() {
    // Long Room main building body
    addObject(makeBox(45, 16, 18, 0xE0D0A8, 35, 8.25, -10));

    // 8 arched window bays — stone arches and glass
    for (var i = 0; i < 8; i++) {
      var wx = 35 - 21 + i * 6;
      // Glass window
      addObject(makeBox(3, 12, 0.5, 0x87CEEB, wx, 8.25, -1));
      // Keystone above each window
      addObject(makeBox(2, 1, 0.3, 0xDDCC98, wx, 15.25, -1));
    }

    // Barrel-vaulted roof suggestion
    addObject(makeBox(46, 6, 4, 0xD0C090, 35, 19.25, -10));
  }

  function buildBookOfKells() {
    // Stone pedestal
    addObject(makeBox(4, 3, 3, 0x888888, 35, 1.75, 5));

    // Glass display case top
    addObject(makeBox(4, 4, 0.3, 0x87CEEB, 35, 4.4, 5));

    // Golden illuminated page glow sphere
    addObject(makeSphere(1.5, 0xFFD700, 35, 3.5, 5));
  }

  function buildNewSquare() {
    // Eastern quadrangle paving
    addObject(makeBox(40, 0.5, 35, 0xC0B0A0, 70, 0.25, 0));

    // Museum Building — Venetian Gothic body
    addObject(makeBox(22, 18, 14, 0xD4A574, 70, 9.25, -20));

    // 6 Corinthian portico columns
    var museumCols = [-10, -6, -2, 2, 6, 10];
    for (var j = 0; j < museumCols.length; j++) {
      addObject(makeCylinder(1.5, 1.5, 14, 8, 0xD0A070, 70 + museumCols[j], 7.25, -14));
    }
  }

  function buildCollegeGreen() {
    // Grass area
    addObject(makeBox(30, 0.5, 20, 0x3A8A3A, -55, 0.25, 0));

    // Equestrian statue 1
    addObject(makeBox(4, 8, 4, 0x888888, -62, 4.25, -5));
    addObject(makeBox(4, 3, 6, 0x888888, -62, 10.25, -5));
    // Legs — 4 legs
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -63.6, 7.25, -6));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -60.4, 7.25, -6));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -63.6, 7.25, -4));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -60.4, 7.25, -4));
    // Rider
    addObject(makeBox(1.5, 2.5, 1.5, 0x888888, -62, 13.75, -5));

    // Equestrian statue 2
    addObject(makeBox(4, 8, 4, 0x888888, -48, 4.25, 5));
    addObject(makeBox(4, 3, 6, 0x888888, -48, 10.25, 5));
    // Legs — 4 legs
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -49.6, 7.25, 4));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -46.4, 7.25, 4));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -49.6, 7.25, 6));
    addObject(makeBox(0.8, 3, 0.8, 0x888888, -46.4, 7.25, 6));
    // Rider
    addObject(makeBox(1.5, 2.5, 1.5, 0x888888, -48, 13.75, 5));

    // Tram tracks — pair
    addObject(makeBox(0.3, 0.1, 50, 0x777777, -55, 0.55, -2));
    addObject(makeBox(0.3, 0.1, 50, 0x777777, -55, 0.55, 2));
  }

  function buildFellowsGarden() {
    // 8 mature trees
    var treePositions = [
      [55, 15], [55, -15],
      [62, 20], [62, -20],
      [70, 20], [70, -20],
      [78, 15], [78, -15]
    ];
    for (var k = 0; k < treePositions.length; k++) {
      var tx = treePositions[k][0];
      var tz = treePositions[k][1];
      // Trunk
      addObject(makeCylinder(0.5, 0.7, 6, 6, 0x5C3D1E, tx, 3.25, tz));
      // Canopy
      addObject(makeSphere(4, 0x228B22, tx, 9.25, tz));
    }

    // Ornamental pond
    addObject(makeCylinder(6, 6, 1, 12, 0x1B6CA8, 65, 0.75, 12));

    // 4 iron benches
    addObject(makeBox(3, 1, 1, 0x333333, 58, 0.75, 8));
    addObject(makeBox(3, 1, 1, 0x333333, 58, 0.75, -8));
    addObject(makeBox(3, 1, 1, 0x333333, 72, 0.75, 8));
    addObject(makeBox(3, 1, 1, 0x333333, 72, 0.75, -8));
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
  }

  function build() {
    buildFrontSquare();
    buildWestFront();
    buildCampanile();
    buildOldLibrary();
    buildBookOfKells();
    buildNewSquare();
    buildCollegeGreen();
    buildFellowsGarden();
  }

  function update(delta) {
    // Static environment — no animation required
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
