window.LivingstonPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var broadcastLight = null;
  var broadcastLightState = false;

  function createOutlet(scene) {
    var geometry = new THREE.BoxGeometry(40, 8, 30);
    var material = new THREE.MeshLambertMaterial({ color: 0x888899 });
    var outlet = new THREE.Mesh(geometry, material);
    outlet.position.set(-20, 4, 0);
    scene.add(outlet);
    objects.push(outlet);

    var glassGeometry = new THREE.BoxGeometry(38, 7, 1);
    var glassMaterial = new THREE.MeshLambertMaterial({ color: 0x88AACC });
    var glassFacade = new THREE.Mesh(glassGeometry, glassMaterial);
    glassFacade.position.set(-20, 4, 15);
    scene.add(glassFacade);
    objects.push(glassFacade);
  }

  function createTechHQ(scene) {
    var positions = [
      [10, 3, -15],
      [10, 3, 0],
      [30, 3, -15],
      [30, 3, 0]
    ];

    var colors = [0x88AACC, 0x778877, 0x88AACC, 0x778877];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(16, 6, 12);
      var material = new THREE.MeshLambertMaterial({ color: colors[i] });
      var building = new THREE.Mesh(geometry, material);
      building.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(building);
      objects.push(building);
    }
  }

  function createCommandTents(scene) {
    var positions = [
      [-5, 2.5, 20],
      [0, 2.5, 20],
      [5, 2.5, 20]
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(14, 5, 10);
      var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
      var tent = new THREE.Mesh(geometry, material);
      tent.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(tent);
      objects.push(tent);
    }
  }

  function createHescoWalls(scene) {
    var positions = [
      [-45, 2, -25],
      [-45, 2, -15],
      [-45, 2, -5],
      [-45, 2, 5],
      [-45, 2, 15],
      [-45, 2, 25],
      [45, 2, -25],
      [45, 2, -15],
      [45, 2, -5],
      [45, 2, 5],
      [45, 2, 15],
      [45, 2, 25]
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(2, 2, 2);
      var material = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
      var basket = new THREE.Mesh(geometry, material);
      basket.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(basket);
      objects.push(basket);

      for (var j = 1; j < 4; j++) {
        var stackGeom = new THREE.BoxGeometry(2, 2, 2);
        var stackMat = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
        var stackBasket = new THREE.Mesh(stackGeom, stackMat);
        stackBasket.position.set(positions[i][0], positions[i][1] + j * 2, positions[i][2]);
        scene.add(stackBasket);
        objects.push(stackBasket);
      }

      var wirePoints = [
        new THREE.Vector3(positions[i][0] - 1, positions[i][1], positions[i][2] - 1),
        new THREE.Vector3(positions[i][0] + 1, positions[i][1], positions[i][2] + 1)
      ];
      var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
      var wireMat = new THREE.LineBasicMaterial({ color: 0x666666 });
      var wireframe = new THREE.LineSegments(wireGeom, wireMat);
      scene.add(wireframe);
      objects.push(wireframe);
    }
  }

  function createDroneVan(scene) {
    var geometry = new THREE.BoxGeometry(8, 3, 5);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var van = new THREE.Mesh(geometry, material);
    van.position.set(25, 1.5, -20);
    scene.add(van);
    objects.push(van);

    var antennaGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    var antennaMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(25, 5, -20);
    scene.add(antenna);
    objects.push(antenna);
  }

  function createRoundabout(scene) {
    var geometry = new THREE.CylinderGeometry(4, 4, 1, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var roundabout = new THREE.Mesh(geometry, material);
    roundabout.position.set(0, 0.5, -35);
    scene.add(roundabout);
    objects.push(roundabout);

    var obstaclePositions = [
      [4, 1, -35],
      [-4, 1, -35],
      [0, 1, -31],
      [0, 1, -39]
    ];

    for (var i = 0; i < obstaclePositions.length; i++) {
      var obsGeom = new THREE.BoxGeometry(1.5, 2, 1.5);
      var obsMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      var obstacle = new THREE.Mesh(obsGeom, obsMat);
      obstacle.position.set(obstaclePositions[i][0], obstaclePositions[i][1], obstaclePositions[i][2]);
      scene.add(obstacle);
      objects.push(obstacle);
    }
  }

  function createBroadcastTower(scene) {
    var geometry = new THREE.CylinderGeometry(0.5, 0.5, 18, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(40, 9, 30);
    scene.add(tower);
    objects.push(tower);

    var lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
    var lightMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var lightSphere = new THREE.Mesh(lightGeom, lightMat);
    lightSphere.position.set(40, 18, 30);
    scene.add(lightSphere);
    objects.push(lightSphere);

    broadcastLight = new THREE.PointLight(0xFF0000, 0, 50);
    broadcastLight.position.set(40, 18, 30);
    scene.add(broadcastLight);
    lights.push(broadcastLight);
  }

  function createRefugeeTents(scene) {
    var positions = [
      [-35, 1.5, 5],
      [-30, 1.5, 5],
      [-25, 1.5, 5]
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(4, 2, 3);
      var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var tent = new THREE.Mesh(geometry, material);
      tent.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(tent);
      objects.push(tent);
    }
  }

  function createLights(scene) {
    var ambientLight = new THREE.AmbientLight(0x8899BB, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var securityPositions = [
      [15, 8, -10],
      [35, 8, 5],
      [-15, 8, 20],
      [25, 8, 20]
    ];

    for (var i = 0; i < securityPositions.length; i++) {
      var light = new THREE.PointLight(0xDDEEFF, 0.8, 40);
      light.position.set(securityPositions[i][0], securityPositions[i][1], securityPositions[i][2]);
      scene.add(light);
      lights.push(light);
    }
  }

  function update(delta) {
    if (broadcastLight) {
      broadcastLightState = !broadcastLightState;
      broadcastLight.intensity = broadcastLightState ? 1.5 : 0;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights = [];
    broadcastLight = null;
  }

  function init(scene) {
    reset(scene);
    createOutlet(scene);
    createTechHQ(scene);
    createCommandTents(scene);
    createHescoWalls(scene);
    createDroneVan(scene);
    createRoundabout(scene);
    createBroadcastTower(scene);
    createRefugeeTents(scene);
    createLights(scene);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
