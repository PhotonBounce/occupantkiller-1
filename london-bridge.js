window.LondonBridge = (function() {
  'use strict';

  var WX = 5000;
  var WZ = 2200;
  var objects = [];
  var scene = null;

  function makebox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makecyl(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(WX + x, y, WZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildlondonbridge() {
    // Bridge deck
    makebox(50, 1.5, 10, 0xD3D3D3, 0, 5, 0);
    // 4 piers
    makebox(3, 8, 4, 0xD3D3D3, -18, 1, 0);
    makebox(3, 8, 4, 0xD3D3D3, -6, 1, 0);
    makebox(3, 8, 4, 0xD3D3D3, 6, 1, 0);
    makebox(3, 8, 4, 0xD3D3D3, 18, 1, 0);
    // Parapets
    makebox(50, 0.8, 0.5, 0xC0C0C0, 0, 6.4, 4.75);
    makebox(50, 0.8, 0.5, 0xC0C0C0, 0, 6.4, -4.75);
  }

  function buildwaterloobridge() {
    // Bridge deck - offset from London Bridge
    makebox(45, 1.2, 8, 0xD4D0C4, -120, 5, -80);
    // 5 slender piers
    makebox(2, 8, 3, 0xD4D0C4, -138, 1, -80);
    makebox(2, 8, 3, 0xD4D0C4, -127, 1, -80);
    makebox(2, 8, 3, 0xD4D0C4, -120, 1, -80);
    makebox(2, 8, 3, 0xD4D0C4, -113, 1, -80);
    makebox(2, 8, 3, 0xD4D0C4, -102, 1, -80);
    // Parapets
    makebox(45, 0.7, 0.4, 0xD4D0C4, -120, 6.1, -76);
    makebox(45, 0.7, 0.4, 0xD4D0C4, -120, 6.1, -84);
  }

  function buildblackfriarsbridge() {
    // Box bridge deck
    makebox(40, 1.4, 9, 0xCC4444, 60, 5, -30);
    // Distinctive red iron columns at road level
    makebox(1.5, 6, 1.5, 0xFF2200, 44, 2, -30);
    makebox(1.5, 6, 1.5, 0xFF2200, 54, 2, -30);
    makebox(1.5, 6, 1.5, 0xFF2200, 64, 2, -30);
    makebox(1.5, 6, 1.5, 0xFF2200, 74, 2, -30);
    makebox(1.5, 6, 1.5, 0xFF2200, 80, 2, -30);
    // Railway bridge alongside
    makebox(40, 1.0, 7, 0x886644, 60, 7, -42);
    makebox(1.2, 8, 1.2, 0x886644, 44, 3, -42);
    makebox(1.2, 8, 1.2, 0x886644, 60, 3, -42);
    makebox(1.2, 8, 1.2, 0x886644, 76, 3, -42);
    // Parapets
    makebox(40, 0.7, 0.4, 0xCC4444, 60, 6.1, -25.5);
    makebox(40, 0.7, 0.4, 0xCC4444, 60, 6.1, -34.5);
  }

  function buildhungerfordbridge() {
    // Pedestrian walkways (two flanking walkways)
    makebox(48, 1.0, 4, 0xAAAAAA, -60, 5, -50);
    makebox(48, 1.0, 4, 0xAAAAAA, -60, 5, -62);
    // Rail section between
    makebox(48, 1.2, 6, 0x888888, -60, 6, -56);
    // CylinderGeometry diagonal cable stay supports
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -80, 10, -51);
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -60, 10, -51);
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -40, 10, -51);
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -80, 10, -61);
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -60, 10, -61);
    makecyl(0.8, 0.8, 20, 8, 0xFFD700, -40, 10, -61);
    // Pylons
    makebox(2, 30, 2, 0x999999, -80, 15, -56);
    makebox(2, 30, 2, 0x999999, -40, 15, -56);
    // Golden cable boxes across top
    makebox(40, 0.5, 0.5, 0xFFD700, -60, 26, -51);
    makebox(40, 0.5, 0.5, 0xFFD700, -60, 26, -61);
  }

  function buildnationaltheatre() {
    // National Theatre - brutalist concrete box
    makebox(30, 16, 8, 0x808080, -100, 8, 30);
    // Stepped terraces
    makebox(36, 3, 10, 0x707070, -100, 1.5, 30);
    makebox(32, 6, 9, 0x787878, -100, 3, 30);
    // Fly tower
    makebox(10, 24, 7, 0x808080, -95, 12, 30);
    // Terrace walkways
    makebox(34, 0.5, 2, 0x909090, -100, 10, 34);
    makebox(34, 0.5, 2, 0x909090, -100, 14, 34);
  }

  function buildbfi() {
    // BFI - silver/grey box
    makebox(20, 10, 6, 0xC0C0C0, -100, 5, 50);
    // Entrance canopy
    makebox(12, 0.4, 4, 0xA0A0A0, -100, 1.2, 53);
    // Glass facade panels
    makebox(18, 8, 0.3, 0x87CEEB, -100, 5, 53.2);
  }

  function buildqueenelizabethhall() {
    // QEH - medium brutalist box
    makebox(22, 12, 7, 0x888888, -75, 6, 40);
    // Purcell Room attached
    makebox(10, 9, 6, 0x808080, -62, 4.5, 40);
    // Roof terrace
    makebox(24, 0.5, 8, 0x909090, -75, 12, 40);
  }

  function buildroyalfestivalhall() {
    // Main concert hall - cream box
    makebox(25, 14, 10, 0xFFF8DC, -140, 7, 30);
    // Wide glass facade panels
    makebox(23, 12, 0.4, 0x87CEEB, -140, 7, 35.2);
    makebox(4, 14, 0.4, 0x87CEEB, -152.5, 7, 35.2);
    makebox(4, 14, 0.4, 0x87CEEB, -127.5, 7, 35.2);
    // Riverside terrace
    makebox(30, 0.5, 6, 0xEEE8AA, -140, 0.3, 38);
    makebox(30, 1.2, 0.4, 0xDDD8AA, -140, 0.9, 41);
    // Side wings
    makebox(6, 10, 10, 0xFFF0DC, -155, 5, 30);
    makebox(6, 10, 10, 0xFFF0DC, -125, 5, 30);
  }

  function buildwaterloostation() {
    // Massive main terminus box
    makebox(50, 10, 20, 0xD2B48C, -170, 5, 80);
    // Large curved glass roof suggestion - layered boxes
    makebox(52, 4, 22, 0x87CEEB, -170, 13, 80);
    makebox(50, 2, 20, 0xADD8E6, -170, 16, 80);
    // Station facade
    makebox(52, 12, 1, 0xC8A882, -170, 6, 69.5);
    // Eurostar terminal box
    makebox(30, 8, 12, 0x4A4A8A, -200, 4, 80);
    makebox(30, 2, 12, 0x6A6AAA, -200, 9, 80);
    // Platform canopies
    makebox(48, 1, 18, 0xBBAA88, -170, 11, 80);
    // Entrance hall
    makebox(20, 14, 8, 0xC8A882, -156, 7, 80);
    // Waterloo Road wing
    makebox(10, 8, 6, 0xC4A07C, -185, 4, 90);
  }

  function buildimaxcinema() {
    // Distinctive cylindrical drum
    makecyl(10, 10, 8, 16, 0x1C1C1C, -135, 4, 80);
    // IMAX signage panels (Box)
    makebox(6, 1.5, 0.3, 0xFFFFFF, -135, 9.5, 69.9);
    makebox(6, 1.5, 0.3, 0xFFFFFF, -141, 9.5, 73);
    makebox(6, 1.5, 0.3, 0xFFFFFF, -129, 9.5, 73);
    makebox(0.3, 1.5, 6, 0xFFFFFF, -125.1, 9.5, 80);
    makebox(0.3, 1.5, 6, 0xFFFFFF, -144.9, 9.5, 80);
    // Base structure
    makebox(22, 2, 22, 0x2C2C2C, -135, 0, 80);
    // Ticket/entrance area
    makebox(8, 3, 4, 0x333333, -135, 1.5, 70);
  }

  function buildoxotower() {
    // Main Art Deco box tower
    makebox(4, 20, 4, 0xFFFFFF, 80, 10, 20);
    // Base building
    makebox(14, 8, 10, 0xF5F5F0, 80, 4, 20);
    // OXO letter windows in red - O X O patterns
    // O left
    makebox(2.5, 0.4, 0.3, 0xFF0000, 80, 17, 17.8);
    makebox(2.5, 0.4, 0.3, 0xFF0000, 80, 14, 17.8);
    makebox(0.3, 3, 0.3, 0xFF0000, 78.85, 15.5, 17.8);
    makebox(0.3, 3, 0.3, 0xFF0000, 81.15, 15.5, 17.8);
    // X middle
    makebox(2.5, 0.3, 0.3, 0xFF0000, 80, 16.5, 17.7);
    makebox(2.5, 0.3, 0.3, 0xFF0000, 80, 14.5, 17.7);
    // O right (represented on another face)
    makebox(0.3, 2.5, 2.5, 0xFF0000, 82.15, 15.5, 20);
    makebox(0.3, 0.4, 2.5, 0xFF0000, 82.15, 17, 20);
    makebox(0.3, 0.4, 2.5, 0xFF0000, 82.15, 14, 20);
    // Riverside terrace
    makebox(16, 0.4, 3, 0xEEEEEE, 80, 8.2, 24.5);
    // Top lantern
    makebox(3, 2, 3, 0xFFFFCC, 80, 21, 20);
  }

  function buildgabrielswharf() {
    // Cluster of colorful workshops and cafes
    makebox(5, 4, 4, 0xFF6600, 30, 2, 15);
    makebox(4, 3.5, 4, 0x4169E1, 36, 1.75, 15);
    makebox(5, 5, 4, 0xFF0000, 42, 2.5, 15);
    makebox(4, 3, 4, 0xFFFF00, 48, 1.5, 15);
    makebox(5, 4, 4, 0xFF6600, 54, 2, 15);
    makebox(4, 4.5, 4, 0x4169E1, 30, 2.25, 20);
    makebox(5, 3, 4, 0xFFFF00, 36, 1.5, 20);
    makebox(4, 4, 4, 0xFF0000, 42, 2, 20);
    makebox(5, 3.5, 4, 0xFF6600, 48, 1.75, 20);
    // Market canopies
    makebox(30, 0.3, 5, 0xFF9900, 42, 5.2, 15);
    makebox(30, 0.3, 5, 0x3399FF, 42, 4.2, 20);
    // Riverside walkway
    makebox(32, 0.4, 2, 0xCCCCCC, 42, 0.2, 24);
  }

  function buildsouthbankground() {
    // Thames Embankment walkway - South Bank
    makebox(200, 0.5, 15, 0x999999, -60, -0.25, 10);
    // Riverside wall
    makebox(200, 2, 1, 0x888888, -60, 0.75, 17.5);
    // Steps to river
    makebox(200, 0.4, 3, 0xAAAAAA, -60, -0.8, 19.5);
    // North bank road suggestion
    makebox(200, 0.5, 12, 0x777777, -60, -0.25, -40);
    // Ground plane (use boxes as ground sections to avoid PlaneGeometry)
    makebox(300, 0.5, 60, 0x556B2F, -60, -0.5, 60);
    makebox(300, 0.5, 30, 0x4A5240, -60, -0.5, -20);
  }

  function init(sceneref) {
    scene = sceneref;
    objects = [];
    buildsouthbankground();
    buildlondonbridge();
    buildblackfriarsbridge();
    buildhungerfordbridge();
    buildwaterloobridge();
    buildnationaltheatre();
    buildbfi();
    buildqueenelizabethhall();
    buildroyalfestivalhall();
    buildwaterloostation();
    buildimaxcinema();
    buildoxotower();
    buildgabrielswharf();
  }

  function update(delta) {
    // Static environment — no per-frame animation required
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

  return { init: init, update: update, reset: reset };

}());
