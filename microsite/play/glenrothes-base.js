window.GlenrothesBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function addObject(mesh) {
    objects.push(mesh);
  }

  function addLight(light) {
    lights.push(light);
  }

  function createTullisRussellMill() {
    var geometry = new THREE.BoxGeometry(28, 18, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B3A3A });
    var mill = new THREE.Mesh(geometry, material);
    mill.position.set(-45, 9, -35);
    addObject(mill);

    var chimneyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 24, 8);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(-45, 22, -30);
    addObject(chimney);
  }

  function createKingdomShoppingCentre() {
    var geometry = new THREE.BoxGeometry(40, 25, 7);
    var material = new THREE.MeshLambertMaterial({ color: 0x888899 });
    var centre = new THREE.Mesh(geometry, material);
    centre.position.set(30, 12.5, 50);
    addObject(centre);

    var barricadeGeometry = new THREE.BoxGeometry(42, 3, 1);
    var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var barricade1 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade1.position.set(30, 15, 53.5);
    addObject(barricade1);

    var barricade2 = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
    barricade2.position.set(30, 15, 46.5);
    addObject(barricade2);
  }

  function createMilitaryHQ() {
    var geometry = new THREE.BoxGeometry(18, 12, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var hq = new THREE.Mesh(geometry, material);
    hq.position.set(0, 6, 0);
    addObject(hq);

    var flagPoleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 6);
    var flagPoleMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var flagPole1 = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole1.position.set(-9, 13, -4);
    addObject(flagPole1);

    var flagPole2 = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole2.position.set(9, 13, -4);
    addObject(flagPole2);

    var flagPole3 = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
    flagPole3.position.set(0, 13, 4);
    addObject(flagPole3);
  }

  function createHESCOBastions() {
    var positions = [
      [-60, 0, -60],
      [60, 0, -60],
      [60, 0, 60],
      [-60, 0, 60]
    ];

    positions.forEach(function(pos) {
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
          var boxGeometry = new THREE.BoxGeometry(4, 4, 2);
          var boxMaterial = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
          var box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.set(pos[0] + i * 4, pos[1] + i * 4, pos[2] + j * 2);
          addObject(box);
        }
      }

      var wirePoints = [];
      wirePoints.push(new THREE.Vector3(pos[0], pos[1] + 8, pos[2]));
      wirePoints.push(new THREE.Vector3(pos[0] + 8, pos[1] + 8, pos[2]));
      wirePoints.push(new THREE.Vector3(pos[0] + 8, pos[1] + 8, pos[2] + 4));
      wirePoints.push(new THREE.Vector3(pos[0], pos[1] + 8, pos[2] + 4));
      wirePoints.push(wirePoints[0]);

      var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
      var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
      var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
      addObject(wire);
    });
  }

  function createDroneControlTower() {
    var baseGeometry = new THREE.BoxGeometry(6, 3, 6);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(25, 1.5, -40);
    base.userData.isDroneBase = true;
    addObject(base);

    var towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 16, 8);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(25, 11, -40);
    tower.userData.isDroneTower = true;
    addObject(tower);

    var scannerGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 8);
    var scannerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scanner.position.set(25, 19, -40);
    scanner.userData.isDroneScanner = true;
    addObject(scanner);
  }

  function createHelipad() {
    var padGeometry = new THREE.BoxGeometry(14, 0.3, 14);
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(0, 0.15, 0);
    addObject(pad);

    var hLetterPart1Geometry = new THREE.BoxGeometry(1.5, 0.3, 0.5);
    var hLetterMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var hPart1 = new THREE.Mesh(hLetterPart1Geometry, hLetterMaterial);
    hPart1.position.set(-1.5, 0.3, -0.5);
    addObject(hPart1);

    var hPart2 = new THREE.Mesh(hLetterPart1Geometry, hLetterMaterial);
    hPart2.position.set(1.5, 0.3, -0.5);
    addObject(hPart2);

    var hBarGeometry = new THREE.BoxGeometry(3, 0.3, 0.5);
    var hBar = new THREE.Mesh(hBarGeometry, hLetterMaterial);
    hBar.position.set(0, 0.3, -0.5);
    addObject(hBar);
  }

  function createAntiDroneNetTowers() {
    var polePositions = [
      [-35, 0, -25],
      [-25, 0, -25],
      [-30, 0, -15],
      [-35, 0, -5],
      [-25, 0, -5],
      [-30, 0, 5]
    ];

    polePositions.forEach(function(pos) {
      var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
      var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], 4, pos[1]);
      addObject(pole);
    });

    for (var i = 0; i < polePositions.length - 1; i++) {
      var wireGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(polePositions[i][0], 8, polePositions[i][1]),
        new THREE.Vector3(polePositions[i + 1][0], 8, polePositions[i + 1][1])
      ]);
      var wireMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
      var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
      addObject(wire);
    }
  }

  function createArtSculpture() {
    var colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0x95E1D3];
    var positions = [
      [-8, 0, 8],
      [8, 0, 8],
      [-8, 0, -8],
      [8, 0, -8]
    ];

    positions.forEach(function(pos, index) {
      var boxGeometry = new THREE.BoxGeometry(4, 6, 4);
      var boxMaterial = new THREE.MeshLambertMaterial({ color: colors[index] });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos[0] - 50, pos[1] + 3, pos[2] + 40);
      addObject(box);
    });

    var topGeometry = new THREE.SphereGeometry(5, 8, 8);
    var topMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(-50, 12, 40);
    addObject(top);
  }

  function createAmbientLight() {
    var light = new THREE.AmbientLight(0x9999BB, 0.6);
    addLight(light);
  }

  function createSecurityLights() {
    var lightPositions = [
      [-60, 25, -60],
      [60, 25, -60],
      [60, 25, 60],
      [-60, 25, 60]
    ];

    lightPositions.forEach(function(pos) {
      var light = new THREE.PointLight(0xCCDDFF, 0.8);
      light.position.set(pos[0], pos[1], pos[2]);
      light.distance = 100;
      addLight(light);
    });
  }

  function build(scene) {
    createTullisRussellMill();
    createKingdomShoppingCentre();
    createMilitaryHQ();
    createHESCOBastions();
    createDroneControlTower();
    createHelipad();
    createAntiDroneNetTowers();
    createArtSculpture();
    createAmbientLight();
    createSecurityLights();

    objects.forEach(function(obj) {
      scene.add(obj);
    });

    lights.forEach(function(light) {
      scene.add(light);
    });
  }

  function update(delta) {
    objects.forEach(function(obj) {
      if (obj.userData.isDroneScanner) {
        obj.rotation.y += delta * 2;
      }
    });
  }

  function reset(scene) {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    objects = [];
    lights = [];
  }

  return {
    build: build,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
