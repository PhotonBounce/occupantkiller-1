window.LinlithgowBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var brazierLights = [];

  function createPalaceWalls(scene) {
    var wallGeometry = new THREE.BoxGeometry(2, 16, 20);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xCC9966 });

    var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(-11, 8, 0);
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.set(11, 8, 0);
    scene.add(wall2);
    objects.push(wall2);

    var wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(0, 8, -10);
    wall3.rotation.y = Math.PI / 2;
    scene.add(wall3);
    objects.push(wall3);

    var wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall4.position.set(0, 8, 10);
    wall4.rotation.y = Math.PI / 2;
    scene.add(wall4);
    objects.push(wall4);
  }

  function createCornerTowers(scene) {
    var towerGeometry = new THREE.CylinderGeometry(4, 4, 20, 16);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xBB8855 });

    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-13, 10, -12);
    scene.add(tower1);
    objects.push(tower1);

    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(13, 10, -12);
    scene.add(tower2);
    objects.push(tower2);

    var tower3 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower3.position.set(-13, 10, 12);
    scene.add(tower3);
    objects.push(tower3);

    var tower4 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower4.position.set(13, 10, 12);
    scene.add(tower4);
    objects.push(tower4);
  }

  function createLochShore(scene) {
    var quayGeometry = new THREE.BoxGeometry(20, 0.5, 10);
    var quayMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var quay = new THREE.Mesh(quayGeometry, quayMaterial);
    quay.position.set(0, -0.25, -18);
    scene.add(quay);
    objects.push(quay);
  }

  function createFountainRuin(scene) {
    var baseGeometry = new THREE.CylinderGeometry(3, 3, 1.5, 12);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });

    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, 0.75, 0);
    scene.add(base);
    objects.push(base);

    var topGeometry = new THREE.SphereGeometry(1, 16, 16);
    var topMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });

    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 2.5, 0);
    scene.add(top);
    objects.push(top);
  }

  function createMemorial(scene) {
    var memorialGeometry = new THREE.BoxGeometry(2, 6, 0.5);
    var memorialMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });

    var memorial = new THREE.Mesh(memorialGeometry, memorialMaterial);
    memorial.position.set(-6, 3, 5);
    scene.add(memorial);
    objects.push(memorial);
  }

  function createBarracks(scene) {
    var barracksGeometry = new THREE.BoxGeometry(12, 4, 8);
    var barracksMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var barracks = new THREE.Mesh(barracksGeometry, barracksMaterial);
    barracks.position.set(0, 2, -5);
    scene.add(barracks);
    objects.push(barracks);
  }

  function createPatrolBoat(scene) {
    var boatGeometry = new THREE.BoxGeometry(10, 1.5, 3);
    var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });

    var boat = new THREE.Mesh(boatGeometry, boatMaterial);
    boat.position.set(-8, 0.5, -20);
    scene.add(boat);
    objects.push(boat);
  }

  function createBarricade(scene) {
    var blockGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var blockMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    for (var i = 0; i < 8; i++) {
      var block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.set(-5.25 + i * 1.5, 0.75, 15);
      scene.add(block);
      objects.push(block);
    }
  }

  function createFloodlights(scene) {
    var light1 = new THREE.PointLight(0xFFDD88, 1.3);
    light1.position.set(-10, 18, 0);
    scene.add(light1);
    lights.push(light1);

    var light2 = new THREE.PointLight(0xFFDD88, 1.3);
    light2.position.set(10, 18, 0);
    scene.add(light2);
    lights.push(light2);

    var light3 = new THREE.PointLight(0xFFDD88, 1.3);
    light3.position.set(0, 18, -10);
    scene.add(light3);
    lights.push(light3);

    var light4 = new THREE.PointLight(0xFFDD88, 1.3);
    light4.position.set(0, 18, 10);
    scene.add(light4);
    lights.push(light4);
  }

  function createBrazierFires(scene) {
    var fireGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xFF5500 });

    var fire1 = new THREE.Mesh(fireGeometry, fireMaterial);
    fire1.position.set(-4, 0.4, 2);
    scene.add(fire1);
    objects.push(fire1);

    var fireLight1 = new THREE.PointLight(0xFF5500, 0.8);
    fireLight1.position.set(-4, 1.5, 2);
    scene.add(fireLight1);
    lights.push(fireLight1);
    brazierLights.push(fireLight1);

    var fire2 = new THREE.Mesh(fireGeometry, fireMaterial);
    fire2.position.set(4, 0.4, 2);
    scene.add(fire2);
    objects.push(fire2);

    var fireLight2 = new THREE.PointLight(0xFF5500, 0.8);
    fireLight2.position.set(4, 1.5, 2);
    scene.add(fireLight2);
    lights.push(fireLight2);
    brazierLights.push(fireLight2);
  }

  function initialize(scene) {
    createPalaceWalls(scene);
    createCornerTowers(scene);
    createLochShore(scene);
    createFountainRuin(scene);
    createMemorial(scene);
    createBarracks(scene);
    createPatrolBoat(scene);
    createBarricade(scene);
    createFloodlights(scene);
    createBrazierFires(scene);
  }

  function update(delta) {
    for (var i = 0; i < brazierLights.length; i++) {
      var light = brazierLights[i];
      var flicker = 0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2;
      light.intensity = flicker;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects.length = 0;

    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    lights.length = 0;
    brazierLights.length = 0;
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
