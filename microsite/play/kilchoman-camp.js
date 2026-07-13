window.KilchomanCamp = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createMainBuilding(scene) {
    var geometry = new THREE.BoxGeometry(16, 5, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 2.5, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createDistillery(scene) {
    var geometry = new THREE.BoxGeometry(12, 6, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(15, 3, 5);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createBarley(scene) {
    var geometry = new THREE.BoxGeometry(14, 4, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-20, 2, -5);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createTents(scene) {
    var positions = [
      [-8, 1.5, 8],
      [-5, 1.5, 8],
      [-2, 1.5, 8],
      [-8, 1.5, 12],
      [-5, 1.5, 12],
      [-2, 1.5, 12]
    ];
    var geometry = new THREE.BoxGeometry(3, 2, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x6B7355 });
    for (var i = 0; i < positions.length; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createFieldKitchen(scene) {
    var geometry = new THREE.BoxGeometry(8, 3, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x7A5C32 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 1.5, -15);
    scene.add(mesh);
    objects.push(mesh);

    var chimneyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 16);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3A22 });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(12, 4, -12);
    scene.add(chimney);
    objects.push(chimney);
  }

  function createCrates(scene) {
    var cratePositions = [
      [25, 0.5, -10],
      [25, 1.5, -10],
      [25, 2.5, -10],
      [26, 0.5, -10],
      [26, 1.5, -10],
      [27, 0.5, -10],
      [25, 0.5, -9],
      [25, 1.5, -9],
      [26, 0.5, -9]
    ];
    var geometry = new THREE.BoxGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    for (var i = 0; i < cratePositions.length; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(cratePositions[i][0], cratePositions[i][1], cratePositions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createBerm(scene) {
    var positions = [
      [-30, 0.3, 0],
      [-28, 0.3, 2],
      [-26, 0.3, -1],
      [-24, 0.3, 3],
      [-22, 0.3, 0],
      [-20, 0.3, -2]
    ];
    var geometry = new THREE.BoxGeometry(6, 0.6, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    for (var i = 0; i < positions.length; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createStoneCircle(scene) {
    var positions = [
      [-35, 1.5, 20],
      [-30, 1.5, 25],
      [-25, 1.5, 23],
      [-20, 1.5, 28],
      [-15, 1.5, 25],
      [-10, 1.5, 22],
      [-15, 1.5, 15],
      [-25, 1.5, 18]
    ];
    var geometry = new THREE.BoxGeometry(0.5, 3, 0.5);
    var material = new THREE.MeshLambertMaterial({ color: 0x999988 });
    for (var i = 0; i < positions.length; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createCampfire(scene) {
    var geometry = new THREE.SphereGeometry(0.5, 16, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(5, 0.5, 5);
    scene.add(mesh);
    objects.push(mesh);

    var light = new THREE.PointLight(0xFF4400, 1.5, 30);
    light.position.set(5, 2, 5);
    scene.add(light);
    lights.push(light);
  }

  function createAmbientLight(scene) {
    var light = new THREE.AmbientLight(0xCCDDFF, 0.4);
    scene.add(light);
    lights.push(light);
  }

  function init(scene) {
    createMainBuilding(scene);
    createDistillery(scene);
    createBarley(scene);
    createTents(scene);
    createFieldKitchen(scene);
    createCrates(scene);
    createBerm(scene);
    createStoneCircle(scene);
    createCampfire(scene);
    createAmbientLight(scene);
  }

  function update(delta) {
    if (lights.length > 0) {
      var campfireLight = lights[lights.length - 2];
      if (campfireLight && campfireLight.intensity !== undefined) {
        campfireLight.intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;
      }
    }

    if (objects.length > 0) {
      var campfireSphere = objects[objects.length - 1];
      if (campfireSphere && campfireSphere.scale) {
        var scale = 1 + Math.sin(Date.now() * 0.008) * 0.15;
        campfireSphere.scale.set(scale, scale, scale);
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
