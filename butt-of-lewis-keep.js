var ButtOfLewisKeep = (function() {
  'use strict';

  var module = {};
  var scene = null;
  var structures = [];
  var worldX = 1500;
  var worldZ = 2020;

  function createLighthouse() {
    var geometry = new THREE.CylinderGeometry(2, 2, 15, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0xAA3322 });
    var lighthouse = new THREE.Mesh(geometry, material);
    lighthouse.position.set(worldX, 7.5, worldZ);
    lighthouse.castShadow = true;
    lighthouse.receiveShadow = true;
    scene.add(lighthouse);
    return lighthouse;
  }

  function createKeeperCottage() {
    var geometry = new THREE.BoxGeometry(6, 3, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
    var cottage = new THREE.Mesh(geometry, material);
    cottage.position.set(worldX - 15, 1.5, worldZ - 12);
    cottage.castShadow = true;
    cottage.receiveShadow = true;
    scene.add(cottage);
    return cottage;
  }

  function createAtlanticCliffGun() {
    var group = new THREE.Group();
    var baseGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    group.add(base);

    var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 12;
    barrel.position.set(0, 1.5, -4);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    group.position.set(worldX + 20, 3, worldZ + 25);
    scene.add(group);
    return group;
  }

  function createSeaStack() {
    var geometry = new THREE.CylinderGeometry(3, 3.2, 12, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
    var stack = new THREE.Mesh(geometry, material);
    stack.rotation.z = 0.15;
    stack.position.set(worldX - 60, 6, worldZ + 80);
    stack.castShadow = true;
    stack.receiveShadow = true;
    scene.add(stack);
    return stack;
  }

  function createGannetColony() {
    var group = new THREE.Group();
    var positions = [
      [0, 0, 0],
      [8, 1, -4],
      [-6, 2, 6],
      [12, 0.5, 3],
      [-10, 1.5, -8],
      [5, 2, 10],
      [-15, 1, 2],
      [18, 0, -5],
      [3, 2.5, -12],
      [-20, 1, 8]
    ];

    var gannets = [];
    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.SphereGeometry(0.5, 8, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
      var gannet = new THREE.Mesh(geometry, material);
      gannet.position.set(positions[i][0], positions[i][1], positions[i][2]);
      gannet.castShadow = true;
      gannet.receiveShadow = true;
      group.add(gannet);
      gannets.push(gannet);
    }

    group.position.set(worldX + 35, 25, worldZ - 40);
    scene.add(group);
    return group;
  }

  function createRDFStation() {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(4, 0.5, 4);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);

    var mastGeometry = new THREE.CylinderGeometry(0.2, 0.2, 12, 8);
    var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 6;
    mast.castShadow = true;
    mast.receiveShadow = true;
    group.add(mast);

    var sensorGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var sensorMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    sensor.position.y = 12.5;
    sensor.castShadow = true;
    sensor.receiveShadow = true;
    group.add(sensor);

    group.position.set(worldX - 40, 0, worldZ - 50);
    group.rotation.y = Math.PI / 6;
    scene.add(group);
    return group;
  }

  function createAAPlattform() {
    var group = new THREE.Group();

    var platformGeometry = new THREE.BoxGeometry(10, 1, 10);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 2;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    var gunPositions = [
      [3, 3, 3],
      [-3, 3, 3],
      [3, 3, -3],
      [-3, 3, -3]
    ];

    var guns = [];
    for (var i = 0; i < gunPositions.length; i++) {
      var gunGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(gunPositions[i][0], gunPositions[i][1], gunPositions[i][2]);
      gun.castShadow = true;
      gun.receiveShadow = true;
      group.add(gun);
      guns.push(gun);
    }

    group.position.set(worldX + 50, 0, worldZ + 60);
    scene.add(group);
    return group;
  }

  function createBunker() {
    var geometry = new THREE.BoxGeometry(8, 4, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var bunker = new THREE.Mesh(geometry, material);
    bunker.position.set(worldX - 25, 1, worldZ + 35);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);
    return bunker;
  }

  function init(sceneArg) {
    scene = sceneArg;
    structures = [];

    var lighthouse = createLighthouse();
    structures.push(lighthouse);

    var cottage = createKeeperCottage();
    structures.push(cottage);

    var gun = createAtlanticCliffGun();
    structures.push(gun);

    var stack = createSeaStack();
    structures.push(stack);

    var colony = createGannetColony();
    structures.push(colony);

    var rdf = createRDFStation();
    structures.push(rdf);

    var platform = createAAPlattform();
    structures.push(platform);

    var bunker = createBunker();
    structures.push(bunker);

    return structures;
  }

  function update(deltaTime) {
    if (structures.length > 5 && structures[5]) {
      structures[5].rotation.y += 0.01;
    }
  }

  module.init = init;
  module.update = update;
  module.getStructures = function() {
    return structures;
  };
  module.getWorldPosition = function() {
    return { x: worldX, z: worldZ };
  };

  return module;
}());
