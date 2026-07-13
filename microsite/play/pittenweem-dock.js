window.PittenweemDock = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createPrioryTower(scene) {
    var geometry = new THREE.BoxGeometry(6, 14, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var tower = new THREE.Mesh(geometry, material);
    tower.position.set(-15, 7, -20);
    scene.add(tower);
    objects.push(tower);
  }

  function createCaveEntrance(scene) {
    var geometry = new THREE.CylinderGeometry(2, 2, 2, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var cave = new THREE.Mesh(geometry, material);
    cave.position.set(-10, 1, -25);
    scene.add(cave);
    objects.push(cave);

    var gateGeometry = new THREE.BoxGeometry(3.8, 1.8, 0.1);
    var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(-10, 1, -23.95);
    scene.add(gate);
    objects.push(gate);
  }

  function createMarketHall(scene) {
    var geometry = new THREE.BoxGeometry(16, 4, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var hall = new THREE.Mesh(geometry, material);
    hall.position.set(5, 2, -5);
    scene.add(hall);
    objects.push(hall);
  }

  function createHarbourWalls(scene) {
    var geometry1 = new THREE.BoxGeometry(1, 4, 24);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var wall1 = new THREE.Mesh(geometry1, material);
    wall1.position.set(-22, 2, 0);
    scene.add(wall1);
    objects.push(wall1);

    var geometry2 = new THREE.BoxGeometry(1, 4, 16);
    var wall2 = new THREE.Mesh(geometry2, material);
    wall2.position.set(-22, 2, 18);
    scene.add(wall2);
    objects.push(wall2);
  }

  function createTrawlers(scene) {
    var colors = [0x336633, 0x223388, 0x336633];
    var positions = [
      {x: -5, z: 5},
      {x: 8, z: 12},
      {x: 2, z: -8}
    ];

    for (var i = 0; i < 3; i++) {
      var geometry = new THREE.BoxGeometry(10, 2, 4);
      var material = new THREE.MeshLambertMaterial({ color: colors[i] });
      var trawler = new THREE.Mesh(geometry, material);
      trawler.position.set(positions[i].x, 1, positions[i].z);
      trawler.userData.bobOffset = i * 0.5;
      trawler.userData.baseY = 1;
      scene.add(trawler);
      objects.push(trawler);
    }
  }

  function createFishBoxes(scene) {
    var boxSize = {w: 0.8, h: 0.6, d: 0.6};
    var geometry = new THREE.BoxGeometry(boxSize.w, boxSize.h, boxSize.d);
    var material = new THREE.MeshLambertMaterial({ color: 0xFF8800 });

    for (var x = 0; x < 5; x++) {
      for (var z = 0; z < 4; z++) {
        var box = new THREE.Mesh(geometry, material);
        box.position.set(-18 + x * 1.2, 0.3, 15 + z * 1.0);
        scene.add(box);
        objects.push(box);
      }
    }
  }

  function createGuardPost(scene) {
    var geometry = new THREE.BoxGeometry(2, 2.5, 2);
    var material = new THREE.MeshLambertMaterial({ color: 0xC2A06E });
    var post = new THREE.Mesh(geometry, material);
    post.position.set(-20, 1.25, 25);
    scene.add(post);
    objects.push(post);
  }

  function createIceFactory(scene) {
    var geometry = new THREE.BoxGeometry(12, 6, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var factory = new THREE.Mesh(geometry, material);
    factory.position.set(15, 3, 15);
    scene.add(factory);
    objects.push(factory);
  }

  function createAmbientLight(scene) {
    var ambientLight = new THREE.AmbientLight(0xFFBB66, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function createFloodlights(scene) {
    var positions = [
      {x: -20, y: 8, z: 20},
      {x: 20, y: 8, z: 20}
    ];

    for (var i = 0; i < positions.length; i++) {
      var light = new THREE.PointLight(0xDDEEFF, 1.2);
      light.position.set(positions[i].x, positions[i].y, positions[i].z);
      scene.add(light);
      lights.push(light);
    }
  }

  function init(scene) {
    createPrioryTower(scene);
    createCaveEntrance(scene);
    createMarketHall(scene);
    createHarbourWalls(scene);
    createTrawlers(scene);
    createFishBoxes(scene);
    createGuardPost(scene);
    createIceFactory(scene);
    createAmbientLight(scene);
    createFloodlights(scene);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.baseY !== undefined) {
        var bobAmount = Math.sin(Date.now() * 0.001 + obj.userData.bobOffset) * 0.15;
        obj.position.y = obj.userData.baseY + bobAmount;
      }
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
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
