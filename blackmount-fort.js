window.BlackMountFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createSummitKeep(scene) {
    var geometry = new THREE.BoxGeometry(10, 14, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 7, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createSkiLiftPylons(scene) {
    var i;
    var positions = [
      { x: -25, z: -20 },
      { x: 25, z: -20 },
      { x: -25, z: 20 },
      { x: 25, z: 20 },
      { x: 0, z: 0 }
    ];

    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var cylinderGeometry = new THREE.CylinderGeometry(1, 1, 12, 8);
      var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinderMesh.position.set(pos.x, 6, pos.z);
      scene.add(cylinderMesh);
      objects.push(cylinderMesh);

      var boxGeometry = new THREE.BoxGeometry(4, 0.5, 4);
      var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
      var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.set(pos.x, 11, pos.z);
      scene.add(boxMesh);
      objects.push(boxMesh);
    }
  }

  function createObservationBunkers(scene) {
    var i;
    var bunkerPositions = [
      { x: -20, z: -25 },
      { x: 20, z: -25 },
      { x: -20, z: 25 },
      { x: 20, z: 25 }
    ];

    for (i = 0; i < bunkerPositions.length; i++) {
      var pos = bunkerPositions[i];
      var geometry = new THREE.BoxGeometry(4, 2, 3);
      var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, 1, pos.z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createWeatherStation(scene) {
    var boxGeometry = new THREE.BoxGeometry(6, 6, 6);
    var boxMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    boxMesh.position.set(30, 3, -30);
    scene.add(boxMesh);
    objects.push(boxMesh);

    var cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinderMesh.position.set(30, 9, -30);
    scene.add(cylinderMesh);
    objects.push(cylinderMesh);

    var sphereGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
    var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(30, 11, -30);
    scene.add(sphereMesh);
    objects.push(sphereMesh);
  }

  function createSnowCannon(scene) {
    var geometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-30, 2, -30);
    mesh.rotation.z = 0.5;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createCableCarStation(scene) {
    var geometry = new THREE.BoxGeometry(14, 6, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 3, -35);
    scene.add(mesh);
    objects.push(mesh);

    var glassMaterial = new THREE.MeshLambertMaterial({ color: 0x88AACC });
    var glassGeometry = new THREE.BoxGeometry(12, 4, 0.5);
    var glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.set(0, 5, -30);
    scene.add(glassMesh);
    objects.push(glassMesh);
  }

  function createRadarDome(scene) {
    var sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphereMesh.position.set(-40, 4, 0);
    sphereMesh.name = 'radarDome';
    scene.add(sphereMesh);
    objects.push(sphereMesh);

    var plinthGeometry = new THREE.BoxGeometry(5, 1, 5);
    var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var plinthMesh = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinthMesh.position.set(-40, 0.5, 0);
    scene.add(plinthMesh);
    objects.push(plinthMesh);

    var light = new THREE.PointLight(0xFF2200, 0.8, 50);
    light.position.set(-40, 8, 0);
    scene.add(light);
    lights.push(light);
  }

  function createSurvivalCache(scene) {
    var geometry = new THREE.BoxGeometry(4, 2, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x554433 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(35, 1, 30);
    mesh.rotation.z = 0.3;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createSummitCairn(scene) {
    var i;
    var sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var positions = [
      { x: 0, y: 1, z: 0 },
      { x: -1.2, y: 2.2, z: 0 },
      { x: 1.2, y: 2.2, z: 0 },
      { x: 0, y: 2.2, z: -1.2 },
      { x: 0, y: 2.2, z: 1.2 },
      { x: 0, y: 3.5, z: 0 }
    ];

    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function update(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      if (objects[i].name === 'radarDome') {
        objects[i].rotation.y += 0.5 * delta;
      }
    }
  }

  function reset(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    lights = [];
  }

  function init(scene) {
    reset(scene);

    var ambientLight = new THREE.AmbientLight(0xCCDDFF, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    createSummitKeep(scene);
    createSkiLiftPylons(scene);
    createObservationBunkers(scene);
    createWeatherStation(scene);
    createSnowCannon(scene);
    createCableCarStation(scene);
    createRadarDome(scene);
    createSurvivalCache(scene);
    createSummitCairn(scene);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
