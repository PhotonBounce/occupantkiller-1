window.GreenwichWharf = (function() {
  'use strict';

  var OFFSET_X = 4560;
  var OFFSET_Z = 2200;

  var scene = null;
  var objects = [];
  var gondolas = [];
  var gondolaSpeed = 0.02;

  function makeMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makeSphere(radius, wSegs, hSegs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(radius, wSegs, hSegs);
    var mat = makeMaterial(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  // 1. Old Royal Naval College
  function buildNavalCollege() {
    var positions = [
      [-18, 0, -12],
      [18, 0, -12],
      [-18, 0, 12],
      [18, 0, 12]
    ];
    var i;
    for (i = 0; i < positions.length; i++) {
      var px = positions[i][0];
      var py = positions[i][1];
      var pz = positions[i][2];
      makeBox(10, 10, 10, 0xFFFFFF, px, 5, pz);
      makeCylinder(5, 5, 4, 16, 0xFFFFFF, px, 12, pz);
      makeSphere(5, 16, 8, 0xFFFFFF, px, 16, pz);
      makeBox(8, 6, 8, 0xF0F0F0, px, 3, pz);
      makeBox(12, 1, 12, 0xDCDCDC, px, 0.5, pz);
    }
    makeBox(40, 4, 6, 0xF5F5F5, 0, 2, -12);
    makeBox(40, 4, 6, 0xF5F5F5, 0, 2, 12);
    makeBox(6, 12, 6, 0xFFFFFF, -12, 6, 0);
    makeBox(6, 12, 6, 0xFFFFFF, 12, 6, 0);
  }

  // 2. Cutty Sark
  function buildCuttySark() {
    var bx = 80;
    var bz = -40;
    makeBox(30, 6, 8, 0x1C1C1C, bx, 3, bz);
    makeBox(28, 2, 6, 0x4A3728, bx, 7, bz);
    makeBox(32, 1, 2, 0x8B4513, bx, 0.5, bz);
    makeCylinder(0.4, 0.4, 20, 8, 0x3B2507, bx - 8, 17, bz);
    makeCylinder(0.4, 0.4, 22, 8, 0x3B2507, bx, 18, bz);
    makeCylinder(0.4, 0.4, 18, 8, 0x3B2507, bx + 8, 16, bz);
    makeBox(14, 0.3, 0.3, 0x3B2507, bx - 8, 22, bz);
    makeBox(16, 0.3, 0.3, 0x3B2507, bx, 24, bz);
    makeBox(12, 0.3, 0.3, 0x3B2507, bx + 8, 20, bz);
    makeBox(10, 0.3, 0.3, 0x3B2507, bx - 8, 18, bz);
    makeBox(12, 0.3, 0.3, 0x3B2507, bx, 20, bz);
    makeBox(8, 0.3, 0.3, 0x3B2507, bx + 8, 17, bz);
    makeBox(34, 1, 10, 0x5C4A3A, bx, 0, bz);
    makeBox(4, 4, 10, 0x2A1A0A, bx - 14, 2, bz);
    makeCylinder(0.5, 0.8, 3, 8, 0x8B6914, bx, 9, bz);
  }

  // 3. National Maritime Museum
  function buildMaritimeMuseum() {
    var mx = 40;
    var mz = 20;
    makeBox(40, 8, 16, 0xFFF8DC, mx, 4, mz);
    makeBox(36, 6, 12, 0x87CEEB, mx, 10, mz);
    var col;
    for (col = 0; col < 8; col++) {
      makeBox(1, 10, 1, 0xF5F5DC, mx - 17 + col * 5, 5, mz - 7);
      makeBox(1, 10, 1, 0xF5F5DC, mx - 17 + col * 5, 5, mz + 7);
    }
    makeBox(40, 0.5, 1, 0xD2B48C, mx, 8, mz - 8);
    makeBox(40, 0.5, 1, 0xD2B48C, mx, 8, mz + 8);
    makeBox(42, 1, 18, 0xDEB887, mx, 0.5, mz);
    makeBox(8, 8, 8, 0xFFF8DC, mx - 16, 4, mz);
    makeBox(8, 8, 8, 0xFFF8DC, mx + 16, 4, mz);
  }

  // 4. Royal Observatory Greenwich
  function buildObservatory() {
    var ox = -20;
    var oz = -60;
    makeBox(12, 2, 8, 0x8B7355, ox, 16, oz);
    makeBox(10, 8, 6, 0xD2B48C, ox, 20, oz);
    makeBox(8, 6, 4, 0xD2B48C, ox, 26, oz - 1);
    makeCylinder(0.3, 0.3, 8, 8, 0x4A4A4A, ox + 3, 33, oz);
    makeCylinder(1, 1, 2, 8, 0xFF0000, ox + 3, 38, oz);
    makeBox(40, 0.3, 0.3, 0xFFD700, ox, 16, oz);
    makeBox(0.3, 30, 0.3, 0xFFD700, ox, 1, oz);
    makeBox(6, 4, 4, 0xD2B48C, ox - 5, 18, oz);
    makeBox(20, 10, 0.5, 0xD2B48C, ox, 21, oz + 2);
    makeBox(15, 1, 15, 0x228B22, ox, 15.5, oz + 5);
    makeCylinder(0.8, 0.8, 12, 8, 0xC8A87A, ox - 8, 22, oz - 3);
  }

  // 5. Canary Wharf Towers
  function buildCanaryWharf() {
    var cwx = 160;
    var cwz = -80;
    makeBox(8, 35, 8, 0x87CEEB, cwx, 17.5, cwz);
    makeCylinder(0, 4, 6, 4, 0xC0C0C0, cwx, 38, cwz);
    makeBox(6, 28, 6, 0x87CEEB, cwx - 16, 14, cwz - 8);
    makeBox(6, 22, 6, 0x87CEEB, cwx + 16, 11, cwz - 8);
    makeBox(7, 25, 7, 0x87CEEB, cwx - 20, 12.5, cwz + 8);
    makeBox(6, 30, 6, 0x87CEEB, cwx + 20, 15, cwz + 4);
    makeBox(5, 20, 5, 0x87CEEB, cwx - 10, 10, cwz + 16);
    makeBox(5, 26, 5, 0x87CEEB, cwx + 10, 13, cwz + 16);
    makeBox(80, 1, 60, 0x808080, cwx, 0.5, cwz);
    makeBox(4, 4, 60, 0xA9A9A9, cwx - 20, 2, cwz);
    makeBox(4, 4, 60, 0xA9A9A9, cwx + 20, 2, cwz);
    makeBox(80, 4, 4, 0xA9A9A9, cwx, 2, cwz - 20);
    makeBox(80, 4, 4, 0xA9A9A9, cwx, 2, cwz + 20);
  }

  // 6. O2 Arena
  function buildO2Arena() {
    var ax = 220;
    var az = 40;
    makeCylinder(18, 18, 4, 32, 0xFFFFFF, ax, 2, az);
    makeCylinder(16, 16, 6, 32, 0xE8E8E8, ax, 5, az);
    makeCylinder(12, 12, 2, 32, 0xF0F0F0, ax, 9, az);
    var i;
    var angle;
    var radius = 18;
    for (i = 0; i < 12; i++) {
      angle = (i / 12) * Math.PI * 2;
      var mastX = ax + Math.cos(angle) * radius;
      var mastZ = az + Math.sin(angle) * radius;
      makeCylinder(0.4, 0.4, 14, 8, 0xFFD700, mastX - OFFSET_X, 7, mastZ - OFFSET_Z);
      makeBox(1, 12, 1, 0xFFD700, mastX - OFFSET_X, 6, mastZ - OFFSET_Z);
    }
    makeBox(40, 1, 40, 0xC8C8C8, ax, 0, az);
  }

  // 7. Thames Barrier
  function buildThamesBarrier() {
    var tbx = 140;
    var tbz = 80;
    var i;
    for (i = 0; i < 10; i++) {
      makeCylinder(2, 2, 6, 12, 0xC0C0C0, tbx - 45 + i * 10, 3, tbz);
      if (i < 9) {
        makeBox(8, 4, 2, 0xC0C0C0, tbx - 40 + i * 10, 5, tbz);
        makeBox(8, 0.5, 2, 0xA0A0A0, tbx - 40 + i * 10, 7.5, tbz);
      }
    }
    makeBox(100, 1, 4, 0x708090, tbx, 0.5, tbz);
  }

  // 8. Isle of Dogs Docklands
  function buildIsleOfDogs() {
    var idx = 200;
    var idz = 60;
    makeBox(60, 0.5, 40, 0x1E90FF, idx, 0.3, idz);
    makeBox(62, 2, 42, 0x8B7355, idx, 1, idz);
    makeBox(8, 16, 8, 0xD3D3D3, idx - 22, 8, idz - 14);
    makeBox(8, 20, 8, 0xC8C8C8, idx - 10, 10, idz - 14);
    makeBox(8, 14, 8, 0xBEBEBE, idx + 6, 7, idz - 14);
    makeBox(8, 18, 8, 0xD0D0D0, idx + 18, 9, idz - 14);
    makeBox(8, 12, 8, 0xC0C0C0, idx - 22, 6, idz + 14);
    makeBox(8, 22, 8, 0xD5D5D5, idx - 6, 11, idz + 14);
    makeBox(8, 15, 8, 0xCACACA, idx + 10, 7.5, idz + 14);
    makeBox(8, 19, 8, 0xCFCFCF, idx + 22, 9.5, idz + 14);
    makeBox(70, 1, 50, 0x808080, idx, 0.5, idz + 35);
  }

  // 9. Greenwich Park
  function buildGreenwichPark() {
    var gpx = 0;
    var gpz = -30;
    makeBox(40, 0.5, 40, 0x228B22, gpx, 0.3, gpz);
    makeBox(20, 3, 20, 0x2D7A2D, gpx - 5, 1.8, gpz - 8);
    makeBox(12, 6, 12, 0x1F6B1F, gpx - 5, 5, gpz - 8);
    makeBox(8, 9, 8, 0x185418, gpx - 5, 10, gpz - 8);
    makeBox(15, 0.5, 15, 0x32A832, gpx + 8, 0.4, gpz + 10);
    makeBox(10, 4, 10, 0x267326, gpx + 12, 2.3, gpz - 5);
    makeBox(1, 6, 1, 0x8B4513, gpx - 14, 3, gpz - 14);
    makeBox(4, 0.5, 0.5, 0x228B22, gpx - 14, 6.3, gpz - 14);
    makeBox(0.5, 0.5, 4, 0x228B22, gpx - 14, 6.3, gpz - 14);
    makeBox(42, 1, 42, 0x3A5A3A, gpx, 0, gpz);
  }

  // 10. Emirates Air Line Cable Car
  function buildEmiratesAirLine() {
    var ealx = 260;
    var ealz = 0;
    makeCylinder(1, 1.5, 15, 8, 0xCC0000, ealx, 7.5, ealz - 30);
    makeCylinder(1, 1.5, 15, 8, 0xCC0000, ealx, 7.5, ealz + 30);
    makeBox(0.4, 0.4, 60, 0x888888, ealx, 15, ealz);
    makeBox(0.4, 0.4, 60, 0x888888, ealx - 2, 15, ealz);

    var gondola1 = makeBox(3, 2, 2, 0xCC0000, ealx - 1, 13, ealz - 10);
    var gondola2 = makeBox(3, 2, 2, 0xCC0000, ealx - 1, 13, ealz + 10);
    gondolas.push({ mesh: gondola1, dir: 1, startZ: OFFSET_Z + ealz - 10 });
    gondolas.push({ mesh: gondola2, dir: -1, startZ: OFFSET_Z + ealz + 10 });
  }

  function buildGround() {
    makeBox(500, 0.5, 500, 0x4A7A4A, 0, -0.25, 0);
    makeBox(500, 0.3, 80, 0x1565C0, 0, 0, 60);
  }

  function init(sceneRef) {
    scene = sceneRef;
    objects = [];
    gondolas = [];

    buildGround();
    buildNavalCollege();
    buildCuttySark();
    buildMaritimeMuseum();
    buildObservatory();
    buildCanaryWharf();
    buildO2Arena();
    buildThamesBarrier();
    buildIsleOfDogs();
    buildGreenwichPark();
    buildEmiratesAirLine();
  }

  function update(delta) {
    var i;
    var g;
    var halfSpan = 25;
    for (i = 0; i < gondolas.length; i++) {
      g = gondolas[i];
      g.mesh.position.z += gondolaSpeed * g.dir * (delta || 1);
      var relZ = g.mesh.position.z - g.startZ;
      if (relZ > halfSpan || relZ < -halfSpan) {
        g.dir = -g.dir;
      }
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (scene) {
        scene.remove(objects[i]);
      }
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    gondolas = [];
    scene = null;
  }

  return { init: init, update: update, reset: reset };

}());
