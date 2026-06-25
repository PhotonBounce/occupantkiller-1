window.PortAskaigBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createDistillery(scene) {
    var geometry = new THREE.BoxGeometry(16, 8, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-20, 4, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createPotStills(scene) {
    var positions = [-10, 0, 10];
    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.CylinderGeometry(0.8, 0.8, 4, 32);
      var material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i], 2, -15);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createWarehouse(scene) {
    var geometry = new THREE.BoxGeometry(12, 5, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 2.5, 10);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createPier(scene) {
    var geometry = new THREE.BoxGeometry(20, 1, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.5, -25);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createFuelTanks(scene) {
    var positions = [-15, 0, 15];
    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.CylinderGeometry(2, 2, 3, 32);
      var material = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i], 1.5, 20);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createGuardTower(scene) {
    var geometry = new THREE.BoxGeometry(3, 12, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(25, 6, -20);
    scene.add(mesh);
    objects.push(mesh);

    var searchGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    var searchMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var searchMesh = new THREE.Mesh(searchGeometry, searchMaterial);
    searchMesh.position.set(25, 12.6, -20);
    scene.add(searchMesh);
    objects.push(searchMesh);
  }

  function createFence(scene) {
    var fencePositions = [
      { x: -35, z: 0 },
      { x: -35, z: 15 },
      { x: -35, z: -15 },
      { x: 35, z: 0 },
      { x: 35, z: 15 },
      { x: 35, z: -15 },
      { x: 0, z: -30 },
      { x: -15, z: -30 },
      { x: 15, z: -30 },
      { x: 0, z: 30 },
      { x: -15, z: 30 },
      { x: 15, z: 30 }
    ];

    for (var i = 0; i < fencePositions.length; i++) {
      var geometry = new THREE.BoxGeometry(0.2, 2, 0.2);
      var material = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(fencePositions[i].x, 1, fencePositions[i].z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createAmmoCrates(scene) {
    var cratePositions = [
      { x: -5, z: 5 },
      { x: 5, z: 5 },
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: 20, z: 15 },
      { x: -20, z: 20 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(cratePositions[i].x, 0.5, cratePositions[i].z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createLights(scene) {
    var ambientLight = new THREE.PointLight(0xFFFFFF, 0.8);
    ambientLight.position.set(0, 20, 0);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var torchPositions = [
      { x: -30, z: 0 },
      { x: 30, z: 0 },
      { x: 0, z: 30 },
      { x: 0, z: -30 }
    ];

    for (var i = 0; i < torchPositions.length; i++) {
      var torch = new THREE.PointLight(0xFF8800, 0.6);
      torch.position.set(torchPositions[i].x, 3, torchPositions[i].z);
      scene.add(torch);
      lights.push(torch);
    }
  }

  function initialize(scene) {
    createDistillery(scene);
    createPotStills(scene);
    createWarehouse(scene);
    createPier(scene);
    createFuelTanks(scene);
    createGuardTower(scene);
    createFence(scene);
    createAmmoCrates(scene);
    createLights(scene);
  }

  function update(delta) {
    var potStillStart = 3;
    var potStillEnd = 6;

    for (var i = potStillStart; i < potStillEnd; i++) {
      if (objects[i]) {
        objects[i].rotation.y += delta * 0.5;
      }
    }

    for (var j = 0; j < lights.length; j++) {
      var light = lights[j];
      if (light !== lights[0]) {
        var flicker = 0.5 + Math.sin(Date.now() * 0.003 + j) * 0.3;
        light.intensity = 0.6 * flicker;
      }
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
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
