window.BonnyriggCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var aaTargetLight = null;
  var aaTargetLightState = 0;

  function createBox(scene, x, y, z, w, h, d, color) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCylinder(scene, x, y, z, radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createSphere(scene, x, y, z, radius, color) {
    var geometry = new THREE.SphereGeometry(radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createCone(scene, x, y, z, radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 32);
    var material = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createSuburbanHousing(scene) {
    var brickColor = 0xCC8866;
    var spacing = 10;

    for (var i = 0; i < 6; i++) {
      var xPos = -25 + (i * spacing);
      createBox(scene, xPos, 2.5, 10, 8, 5, 6, brickColor);
    }
  }

  function createCarPark(scene) {
    var tarmacColor = 0x333333;
    var concreteColor = 0x888888;

    createBox(scene, 0, 0.15, -25, 20, 0.3, 15, tarmacColor);

    var blockerSpacing = 4;
    for (var i = 0; i < 5; i++) {
      var xPos = -10 + (i * blockerSpacing);
      createBox(scene, xPos, 0.5, -25, 0.5, 1, 15, concreteColor);
    }
  }

  function createCommunityCentre(scene) {
    var brickColor = 0xCC9977;
    var roofColor = 0x4488BB;

    createBox(scene, 20, 2.5, 0, 20, 5, 14, brickColor);
    createBox(scene, 20, 7.5, 0, 20, 3, 14, roofColor);
  }

  function createFootballPitch(scene) {
    var grassColor = 0x3a5a3a;
    var sandbagColor = 0xCC9966;

    createBox(scene, 30, 0.15, 30, 32, 0.3, 20, grassColor);

    var positions = [
      [-16, 1, 30],
      [16, 1, 30],
      [-16, 1, 50],
      [16, 1, 50]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      createBox(scene, pos[0], pos[1], pos[2], 2, 2, 2, sandbagColor);
    }
  }

  function createChurchTower(scene) {
    var stoneColor = 0x888877;
    var sandbagColor = 0xCC9966;

    createBox(scene, -30, 8, 20, 6, 16, 6, stoneColor);

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var xPos = -30 + Math.cos(angle) * 4;
      var zPos = 20 + Math.sin(angle) * 4;
      createBox(scene, xPos, 1, zPos, 1.5, 1.5, 1.5, sandbagColor);
    }
  }

  function createShoppingPrecinct(scene) {
    var concreteColor = 0x778877;

    createBox(scene, 0, 1, 50, 6, 2, 4, concreteColor);
  }

  function createStreetBarricades(scene) {
    var wreckColor = 0x444433;
    var baseX = -40;
    var baseZ = 0;

    for (var i = 0; i < 10; i++) {
      var xPos = baseX + (i * 3);
      createBox(scene, xPos, 1, baseZ, 2, 1.5, 2.5, wreckColor);
    }
  }

  function createAntiAirBattery(scene) {
    var mountColor = 0x444444;
    var barrelColor = 0x333333;

    var mount = createBox(scene, 45, 1.5, 35, 4, 3, 4, mountColor);

    var barrelPositions = [
      [2, 3, 2],
      [-2, 3, 2],
      [2, 3, -2],
      [-2, 3, -2]
    ];

    for (var i = 0; i < barrelPositions.length; i++) {
      var pos = barrelPositions[i];
      var xPos = 45 + pos[0];
      var yPos = 1.5 + pos[1];
      var zPos = 35 + pos[2];
      createCylinder(scene, xPos, yPos, zPos, 0.3, 0.3, 4, barrelColor);
    }

    var targetLight = new THREE.PointLight(0xFFFFFF, 0.5, 50);
    targetLight.position.set(45, 6, 35);
    scene.add(targetLight);
    lights.push(targetLight);
    aaTargetLight = targetLight;
  }

  function createFloodlights(scene) {
    var cornerPositions = [
      [22, 15, 20],
      [38, 15, 20],
      [22, 15, 40],
      [38, 15, 40]
    ];

    for (var i = 0; i < cornerPositions.length; i++) {
      var pos = cornerPositions[i];
      var light = new THREE.PointLight(0xFFFFFF, 1.2, 80);
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
      lights.push(light);

      createCylinder(scene, pos[0], pos[1] - 5, pos[2], 0.4, 0.4, 10, 0x666666);
    }
  }

  function initialize(scene) {
    createSuburbanHousing(scene);
    createCarPark(scene);
    createCommunityCentre(scene);
    createFootballPitch(scene);
    createChurchTower(scene);
    createShoppingPrecinct(scene);
    createStreetBarricades(scene);
    createAntiAirBattery(scene);
    createFloodlights(scene);

    var ambientLight = new THREE.AmbientLight(0x9999AA, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function update(delta) {
    if (aaTargetLight) {
      aaTargetLightState += delta * 5;
      if (aaTargetLightState > Math.PI * 2) {
        aaTargetLightState -= Math.PI * 2;
      }
      var strobeValue = Math.abs(Math.sin(aaTargetLightState));
      aaTargetLight.intensity = 0.2 + (strobeValue * 0.8);
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    aaTargetLight = null;
    aaTargetLightState = 0;
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
