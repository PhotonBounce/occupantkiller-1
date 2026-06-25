window.DocklandsIsle = (function() {
  'use strict';

  var OX = 5280;
  var OZ = 2200;

  var objects = [];
  var lights = [];
  var dlrCars = [];
  var dlrTime = 0;

  function addBox(scene, color, w, h, d, x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCylinder(scene, color, rt, rb, h, segs, x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addCone(scene, color, r, h, segs, x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function addSphere(scene, color, r, ws, hs, x, y, z) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildWestIndiaDocks(scene) {
    addBox(scene, 0x4169E1, 50, 2, 20, -120, 1, -80);
    addBox(scene, 0x4169E1, 50, 2, 20, -120, 1, -110);

    var warehouses = [
      [-95, 0, -80], [-95, 0, -110],
      [-145, 0, -80], [-145, 0, -110],
      [-120, 0, -60], [-120, 0, -130]
    ];
    for (var i = 0; i < warehouses.length; i++) {
      var w = warehouses[i];
      addBox(scene, 0x8B3A3A, 12, 10, 8, w[0], 5, w[1]);
    }

    addBox(scene, 0x888888, 3, 12, 3, -108, 6, -78);
    addBox(scene, 0x888888, 3, 12, 3, -132, 6, -78);
    addBox(scene, 0x888888, 3, 12, 3, -108, 6, -112);
    addBox(scene, 0x888888, 3, 12, 3, -132, 6, -112);
  }

  function buildCanaryWharfCluster(scene) {
    addCylinder(scene, 0xC0C0C0, 5, 5, 40, 12, 0, 20, 0);
    addCone(scene, 0xC0C0C0, 5, 8, 4, 0, 44, 0);

    var towerOffsets = [
      [14, 0, 0, 6, 28],
      [-14, 0, 0, 6, 22],
      [0, 0, 14, 5, 25],
      [0, 0, -14, 5, 20],
      [10, 0, 10, 4, 30],
      [-10, 0, 10, 4, 26],
      [10, 0, -10, 5, 24],
      [-10, 0, -10, 4, 22]
    ];
    for (var i = 0; i < towerOffsets.length; i++) {
      var t = towerOffsets[i];
      addBox(scene, 0x87CEEB, t[3], t[4], t[3], t[0], t[4] / 2, t[2]);
    }

    addBox(scene, 0x444444, 40, 6, 40, 0, -3, 0);
    addBox(scene, 0x333333, 30, 4, 30, 0, -7, 0);
  }

  function buildCrossrailPlace(scene) {
    addBox(scene, 0x808080, 24, 8, 20, 60, 4, 20);
    addBox(scene, 0x3A7A3A, 22, 3, 18, 60, 11, 20);
    addBox(scene, 0x4A9A4A, 6, 2, 4, 54, 13, 18);
    addBox(scene, 0x4A9A4A, 6, 2, 4, 62, 13, 18);
    addBox(scene, 0x4A9A4A, 6, 2, 4, 58, 13, 26);
    addBox(scene, 0x808080, 4, 6, 4, 60, 3, 12);
  }

  function buildMuseumDocklands(scene) {
    addBox(scene, 0x8B3A3A, 20, 12, 8, -50, 6, 40);
    addBox(scene, 0x7A3030, 20, 2, 8, -50, 13, 40);

    addBox(scene, 0x9B4A4A, 4, 14, 4, -62, 7, 40);
    addBox(scene, 0x9B4A4A, 4, 14, 4, -38, 7, 40);
    addBox(scene, 0x666666, 6, 2, 2, -50, 3, 35);
  }

  function buildPoplar(scene) {
    var blocks = [
      [-200, 0, 60, 18, 16, 12],
      [-220, 0, 80, 14, 20, 10],
      [-185, 0, 80, 16, 12, 10],
      [-200, 0, 100, 20, 18, 12]
    ];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      addBox(scene, 0x808080, b[3], b[4], b[5], b[0], b[4] / 2, b[1]);
    }

    addBox(scene, 0xBBBBAA, 30, 4, 12, -240, 2, 70);
    addBox(scene, 0xBBBBAA, 4, 8, 4, -228, 4, 64);
    addBox(scene, 0xBBBBAA, 4, 8, 4, -252, 4, 64);
    addBox(scene, 0xBBBBAA, 6, 3, 6, -240, 5, 64);
  }

  function buildMillwallDock(scene) {
    addBox(scene, 0x4169E1, 30, 2, 12, -60, 1, 100);

    addBox(scene, 0x6B5B4E, 10, 6, 8, -76, 3, 100);
    addBox(scene, 0x6B5B4E, 10, 6, 8, -44, 3, 100);
    addBox(scene, 0x6B5B4E, 8, 5, 30, -60, 2.5, 88);
    addBox(scene, 0x6B5B4E, 8, 5, 30, -60, 2.5, 112);

    addBox(scene, 0x808080, 2, 10, 2, -76, 5, 94);
    addBox(scene, 0x808080, 2, 10, 2, -44, 5, 94);
  }

  function buildMudchuteFarm(scene) {
    addBox(scene, 0xAA8844, 14, 5, 10, -80, 2.5, 160);
    addBox(scene, 0x887722, 10, 4, 8, -96, 2, 160);
    addCone(scene, 0xCC6633, 6, 4, 4, -80, 7, 160);

    var penPositions = [
      [-68, 160], [-68, 170], [-78, 170], [-88, 170]
    ];
    for (var i = 0; i < penPositions.length; i++) {
      var pp = penPositions[i];
      addBox(scene, 0x666655, 8, 1, 8, pp[0], 0.5, pp[1]);
      addBox(scene, 0x666655, 0.5, 2, 8, pp[0] - 4, 1, pp[1]);
      addBox(scene, 0x666655, 0.5, 2, 8, pp[0] + 4, 1, pp[1]);
    }

    var cowPositions = [
      [-70, 162], [-66, 166], [-74, 168]
    ];
    for (var c = 0; c < cowPositions.length; c++) {
      var cp = cowPositions[c];
      addBox(scene, 0xEEEECC, 3, 2, 1.5, cp[0], 2, cp[1]);
      addBox(scene, 0xEEEECC, 1, 1.5, 1, cp[0], 3.25, cp[1] - 0.5);
    }

    var sheepPositions = [
      [-82, 172], [-86, 168], [-90, 172]
    ];
    for (var s = 0; s < sheepPositions.length; s++) {
      var sp = sheepPositions[s];
      addBox(scene, 0xDDDDDD, 2, 1.5, 1, sp[0], 1.75, sp[1]);
      addBox(scene, 0xDDDDDD, 0.8, 1, 0.8, sp[0], 2.75, sp[1] - 0.3);
    }
  }

  function buildIslandGardens(scene) {
    addBox(scene, 0x228B22, 50, 1, 40, -60, 0.5, 220);

    addBox(scene, 0x808080, 8, 4, 8, -60, 2, 235);
    addBox(scene, 0x808080, 6, 1, 6, -60, 4.5, 235);
    addSphere(scene, 0x909090, 4, 8, 6, -60, 6, 235);

    addBox(scene, 0x447744, 4, 3, 4, -50, 1.5, 222);
    addBox(scene, 0x447744, 4, 3, 4, -42, 1.5, 222);
    addBox(scene, 0x225522, 3, 5, 3, -46, 2.5, 228);
    addBox(scene, 0x225522, 3, 5, 3, -56, 2.5, 228);
    addBox(scene, 0x3A8A3A, 4, 6, 4, -76, 3, 220);
  }

  function buildDLR(scene) {
    var pillarPositions = [
      -100, -70, -40, -10, 20, 50, 80, 110, 140
    ];
    for (var i = 0; i < pillarPositions.length; i++) {
      var px = pillarPositions[i];
      addCylinder(scene, 0x888888, 1, 1.2, 8, 8, px, 4, -20);
      addBox(scene, 0x999999, 0.5, 0.5, 4, px, 8.25, -20);
    }

    addBox(scene, 0xAAAAAA, 240, 1.5, 4, 5, 8.75, -20);

    var carColors = [0x3355AA, 0x3355AA, 0x2244AA];
    for (var c = 0; c < 3; c++) {
      var car = addBox(scene, carColors[c], 10, 3, 3, -60 + c * 12, 10.5, -20);
      car.userData.dlrCar = true;
      car.userData.dlrIndex = c;
      car.userData.dlrOffset = c * 12;
      dlrCars.push(car);
    }
  }

  function buildBillingsgate(scene) {
    addBox(scene, 0xFFF8DC, 28, 10, 18, 120, 5, -20);
    addBox(scene, 0xEEE8C0, 30, 2, 20, 120, 10.5, -20);

    addCylinder(scene, 0xFFF8DC, 2, 2, 12, 8, 110, 6, -10);
    addCylinder(scene, 0xFFF8DC, 2, 2, 12, 8, 130, 6, -10);
    addCylinder(scene, 0xFFF8DC, 2, 2, 12, 8, 110, 6, -30);
    addCylinder(scene, 0xFFF8DC, 2, 2, 12, 8, 130, 6, -30);

    addCone(scene, 0xDDD0A0, 3, 3, 4, 110, 13.5, -10);
    addCone(scene, 0xDDD0A0, 3, 3, 4, 130, 13.5, -10);
    addCone(scene, 0xDDD0A0, 3, 3, 4, 110, 13.5, -30);
    addCone(scene, 0xDDD0A0, 3, 3, 4, 130, 13.5, -30);

    addBox(scene, 0xCCBB80, 2, 6, 2, 105, 3, -20);
    addBox(scene, 0xAA9960, 2, 3, 1, 105, 7, -20);
    addBox(scene, 0xAA9960, 1.5, 1, 1.5, 105, 9, -20);
  }

  function buildGroundSlab(scene) {
    addBox(scene, 0x555555, 400, 1, 300, 0, -0.5, 70);
  }

  function buildAmbientLighting(scene) {
    var ambient = new THREE.AmbientLight(0xCCDDEE, 0.7);
    scene.add(ambient);
    lights.push(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.9);
    sun.position.set(OX + 200, 150, OZ - 100);
    scene.add(sun);
    lights.push(sun);
  }

  function init(scene) {
    buildGroundSlab(scene);
    buildWestIndiaDocks(scene);
    buildCanaryWharfCluster(scene);
    buildCrossrailPlace(scene);
    buildMuseumDocklands(scene);
    buildPoplar(scene);
    buildMillwallDock(scene);
    buildMudchuteFarm(scene);
    buildIslandGardens(scene);
    buildDLR(scene);
    buildBillingsgate(scene);
    buildAmbientLighting(scene);
  }

  function update(delta) {
    dlrTime += delta;
    var trackLength = 240;
    var speed = 20;
    for (var i = 0; i < dlrCars.length; i++) {
      var car = dlrCars[i];
      var offset = car.userData.dlrOffset || 0;
      var pos = ((dlrTime * speed + offset) % trackLength) - 120;
      car.position.x = OX + 5 + pos;
    }
  }

  function reset(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      if (objects[i].geometry) objects[i].geometry.dispose();
      if (objects[i].material) objects[i].material.dispose();
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    lights = [];

    dlrCars = [];
    dlrTime = 0;
  }

  return { init: init, update: update, reset: reset };
}());
