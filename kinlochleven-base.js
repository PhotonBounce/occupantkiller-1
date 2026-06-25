window.KinlochlevenBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var smokeParticles = [];

  function createMaterial(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function createMainSmelterHall(scene) {
    var geometry = new THREE.BoxGeometry(30, 12, 20);
    var material = createMaterial(0x667788);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 6, 0);
    scene.add(mesh);
    objects.push(mesh);

    var chimneyPositions = [
      { x: -8, z: -5 },
      { x: 8, z: -5 },
      { x: -8, z: 5 },
      { x: 8, z: 5 }
    ];

    chimneyPositions.forEach(function(pos) {
      var chimneyGeometry = new THREE.CylinderGeometry(2, 2, 25, 16);
      var chimneyMaterial = createMaterial(0x555566);
      var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
      chimney.position.set(pos.x, 18.5, pos.z);
      scene.add(chimney);
      objects.push(chimney);

      var smokeGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      var smokeMaterial = createMaterial(0x999999);
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(pos.x, 27, pos.z);
      smoke.userData.baseY = 27;
      scene.add(smoke);
      objects.push(smoke);
      smokeParticles.push(smoke);

      var warningLightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var warningLightMaterial = createMaterial(0xFF0000);
      var warningLight = new THREE.Mesh(warningLightGeometry, warningLightMaterial);
      warningLight.position.set(pos.x, 28, pos.z);
      scene.add(warningLight);
      objects.push(warningLight);

      var chimney_light = new THREE.PointLight(0xFF2200, 0.8);
      chimney_light.position.set(pos.x, 28, pos.z);
      scene.add(chimney_light);
      lights.push(chimney_light);
    });
  }

  function createHydroelectricPipe(scene) {
    var geometry = new THREE.CylinderGeometry(3, 3, 15, 16);
    var material = createMaterial(0x8B4513);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-15, 8, -10);
    mesh.rotation.z = Math.PI / 6;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createWorkersVillage(scene) {
    var startX = -18;
    var startZ = 15;
    var spacing = 8;

    for (var i = 0; i < 8; i++) {
      var geometry = new THREE.BoxGeometry(6, 4, 5);
      var material = createMaterial(0xCCCCBB);
      var house = new THREE.Mesh(geometry, material);
      house.position.set(startX + (i * spacing), 2, startZ);
      scene.add(house);
      objects.push(house);
    }
  }

  function createPowerSubstation(scene) {
    var geometry = new THREE.BoxGeometry(10, 8, 6);
    var material = createMaterial(0x667788);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(20, 4, -15);
    scene.add(mesh);
    objects.push(mesh);

    var transformerPositions = [
      { x: 15, z: -12 },
      { x: 25, z: -12 },
      { x: 15, z: -18 },
      { x: 25, z: -18 }
    ];

    transformerPositions.forEach(function(pos) {
      var transformerGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
      var transformerMaterial = createMaterial(0x555566);
      var transformer = new THREE.Mesh(transformerGeometry, transformerMaterial);
      transformer.position.set(pos.x, 6.5, pos.z);
      scene.add(transformer);
      objects.push(transformer);
    });
  }

  function createMountainPipeline(scene) {
    var pipelineLength = 20;
    var pipelineCount = 20;
    var startX = -40;
    var spacing = 4;

    for (var i = 0; i < pipelineCount; i++) {
      var geometry = new THREE.BoxGeometry(pipelineLength, 1, 1);
      var material = createMaterial(0x444444);
      var pipe = new THREE.Mesh(geometry, material);
      var elevation = Math.sin((i / pipelineCount) * Math.PI) * 15;
      pipe.position.set(startX + (i * spacing), 5 + elevation, -25);
      pipe.rotation.z = (elevation / 15) * 0.3;
      scene.add(pipe);
      objects.push(pipe);
    }
  }

  function createStorageTanks(scene) {
    var tankPositions = [
      { x: 10, z: 10 },
      { x: 18, z: 10 },
      { x: 26, z: 10 }
    ];

    tankPositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(3, 3, 6, 20);
      var material = createMaterial(0xEEEEEE);
      var tank = new THREE.Mesh(geometry, material);
      tank.position.set(pos.x, 3, pos.z);
      scene.add(tank);
      objects.push(tank);
    });
  }

  function createLochWaterfront(scene) {
    var geometry = new THREE.BoxGeometry(24, 1, 5);
    var material = createMaterial(0x888888);
    var dock = new THREE.Mesh(geometry, material);
    dock.position.set(0, 0.5, -32);
    scene.add(dock);
    objects.push(dock);
  }

  function createFloodlights(scene) {
    var floodlightPositions = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 }
    ];

    floodlightPositions.forEach(function(pos) {
      var floodlight = new THREE.PointLight(0xFFDD00, 1.2);
      floodlight.position.set(pos.x, 15, pos.z);
      scene.add(floodlight);
      lights.push(floodlight);

      var floodlightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var floodlightMaterial = createMaterial(0xFFDD00);
      var floodlightMesh = new THREE.Mesh(floodlightGeometry, floodlightMaterial);
      floodlightMesh.position.set(pos.x, 15, pos.z);
      scene.add(floodlightMesh);
      objects.push(floodlightMesh);
    });
  }

  function buildEnvironment(scene) {
    createMainSmelterHall(scene);
    createHydroelectricPipe(scene);
    createWorkersVillage(scene);
    createPowerSubstation(scene);
    createMountainPipeline(scene);
    createStorageTanks(scene);
    createLochWaterfront(scene);
    createFloodlights(scene);
  }

  function update(delta) {
    smokeParticles.forEach(function(smoke) {
      smoke.position.y += delta * 2;
      if (smoke.position.y > smoke.userData.baseY + 8) {
        smoke.position.y = smoke.userData.baseY;
      }
    });

    lights.forEach(function(light) {
      if (light.color.getHex() === 0xFF2200) {
        light.intensity = 0.8 + Math.sin(Date.now() * 0.005) * 0.3;
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
    smokeParticles = [];
  }

  return {
    buildEnvironment: buildEnvironment,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
