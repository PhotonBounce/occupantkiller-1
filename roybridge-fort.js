window.RoyBridgeFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createMainFort(scene) {
    var geometry = new THREE.BoxGeometry(12, 10, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 5, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createOuterRamparts(scene) {
    var positions = [
      { x: 10, z: 0 },
      { x: -10, z: 0 },
      { x: 0, z: 10 },
      { x: 0, z: -10 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.BoxGeometry(1, 4, 16);
      var material = new THREE.MeshLambertMaterial({ color: 0x665544 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i].x, 2, positions[i].z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createGlenRoyTerraces(scene) {
    var heights = [8, 12, 16];

    for (var i = 0; i < heights.length; i++) {
      var geometry = new THREE.BoxGeometry(50, 0.5, 3);
      var material = new THREE.MeshLambertMaterial({ color: 0x887766 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-15, heights[i], -20 + i * 5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createGeologicalStation(scene) {
    var geometry = new THREE.BoxGeometry(6, 4, 5);
    var material = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(20, 2, 15);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var sphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var instrumentMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var sphere = new THREE.Mesh(sphereGeometry, instrumentMaterial);
    sphere.position.set(20, 6, 15);
    sphere.castShadow = true;
    scene.add(sphere);
    objects.push(sphere);

    var cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var cylinder = new THREE.Mesh(cylinderGeometry, instrumentMaterial);
    cylinder.position.set(21, 5.5, 15);
    cylinder.castShadow = true;
    scene.add(cylinder);
    objects.push(cylinder);
  }

  function createRadioTower(scene) {
    var towerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 18, 8);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(30, 9, -10);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    var armPositions = [
      { y: 15, z: 0 },
      { y: 12, z: 2 },
      { y: 9, z: -2 }
    ];

    for (var i = 0; i < armPositions.length; i++) {
      var armGeometry = new THREE.BoxGeometry(4, 0.2, 0.2);
      var armMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(30, armPositions[i].y, armPositions[i].z - 10);
      arm.castShadow = true;
      scene.add(arm);
      objects.push(arm);
    }
  }

  function createAmmunitionCache(scene) {
    var geometry = new THREE.BoxGeometry(8, 3, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-25, 1.5, 5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var doorGeometry = new THREE.BoxGeometry(2, 2.5, 0.3);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-25, 1.5, 3.2);
    door.castShadow = true;
    scene.add(door);
    objects.push(door);
  }

  function createStreamCrossing(scene) {
    var positions = [
      { x: -30, z: -15 },
      { x: -30, z: -10 },
      { x: -30, z: -5 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.SphereGeometry(1.5, 8, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i].x, 0.5, positions[i].z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createDeerStalkingHide(scene) {
    var geometry = new THREE.BoxGeometry(4, 2, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C4030 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(15, 1, -25);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createAmbientLight(scene) {
    var light = new THREE.AmbientLight(0xCCDDFF, 0.6);
    scene.add(light);
    lights.push(light);
  }

  function createFortLight(scene) {
    var light = new THREE.PointLight(0xFFEE88, 0.8);
    light.position.set(0, 15, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add(light);
    lights.push(light);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].geometry instanceof THREE.SphereGeometry) {
        if (objects[i].position.y > 5) {
          objects[i].rotation.x += delta * 0.5;
          objects[i].rotation.z += delta * 0.3;
        }
      }
      if (objects[i].geometry instanceof THREE.CylinderGeometry) {
        if (objects[i].position.y > 5) {
          objects[i].rotation.y += delta * 0.4;
        }
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

  function init(scene) {
    createMainFort(scene);
    createOuterRamparts(scene);
    createGlenRoyTerraces(scene);
    createGeologicalStation(scene);
    createRadioTower(scene);
    createAmmunitionCache(scene);
    createStreamCrossing(scene);
    createDeerStalkingHide(scene);
    createAmbientLight(scene);
    createFortLight(scene);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getObjects: function() { return objects; },
    getLights: function() { return lights; }
  };
}());
