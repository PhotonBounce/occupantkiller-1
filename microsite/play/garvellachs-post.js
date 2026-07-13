window.GarvellachsPost = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createBeehiveClusters(scene) {
    var positions = [
      [-4, 1.5, -4],
      [4, 1.5, -4],
      [-4, 1.5, 4],
      [4, 1.5, 4]
    ];

    for (var i = 0; i < positions.length; i++) {
      var geometry = new THREE.SphereGeometry(3, 16, 16);
      var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createStoneEnclosure(scene) {
    var wallLength = 12;
    var wallHeight = 3;
    var wallThickness = 1;
    var material = new THREE.MeshLambertMaterial({ color: 0x777766 });

    var wallPositions = [
      [-6, wallHeight / 2, 0],
      [6, wallHeight / 2, 0],
      [0, wallHeight / 2, -6],
      [0, wallHeight / 2, 6]
    ];

    for (var i = 0; i < wallPositions.length; i++) {
      var geometry = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(wallPositions[i][0], wallPositions[i][1], wallPositions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createCommunsBunker(scene) {
    var geometry = new THREE.BoxGeometry(8, 3, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1.5, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createSatelliteUplink(scene) {
    var geometry = new THREE.CylinderGeometry(0.4, 0.4, 16, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 8, -5);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createDishArray(scene) {
    var geometry = new THREE.BoxGeometry(3, 2, 0.5);
    var material = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 10, -5);
    mesh.rotation.x = 0.3;
    mesh.userData.isDish = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createHelicopterPad(scene) {
    var padGeometry = new THREE.BoxGeometry(12, 0.5, 12);
    var padMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var padMesh = new THREE.Mesh(padGeometry, padMaterial);
    padMesh.position.set(0, 0.25, 0);
    scene.add(padMesh);
    objects.push(padMesh);

    var hMarkGeometry = new THREE.BoxGeometry(0.5, 0.01, 3);
    var hMarkMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var hMark1 = new THREE.Mesh(hMarkGeometry, hMarkMaterial);
    hMark1.position.set(0, 0.3, 0);
    scene.add(hMark1);
    objects.push(hMark1);

    var hMark2 = new THREE.Mesh(hMarkGeometry, hMarkMaterial);
    hMark2.position.set(0, 0.3, 0);
    hMark2.rotation.z = Math.PI / 2;
    scene.add(hMark2);
    objects.push(hMark2);
  }

  function createAncientStone(scene) {
    var geometry = new THREE.BoxGeometry(1, 3, 0.5);
    var material = new THREE.MeshLambertMaterial({ color: 0x998866 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 1.5, 8);
    mesh.rotation.y = 0.4;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createSupplyDrops(scene) {
    var dropPositions = [
      [-8, 4, 8],
      [8, 4, -8]
    ];

    for (var i = 0; i < dropPositions.length; i++) {
      var boxGeometry = new THREE.BoxGeometry(2, 2, 2);
      var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x666633 });
      var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.set(dropPositions[i][0], dropPositions[i][1], dropPositions[i][2]);
      scene.add(boxMesh);
      objects.push(boxMesh);

      var cylinderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x666633 });
      var cylinderMesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinderMesh.position.set(dropPositions[i][0], dropPositions[i][1] + 1.5, dropPositions[i][2]);
      scene.add(cylinderMesh);
      objects.push(cylinderMesh);
    }
  }

  function createSeabirdMarkers(scene) {
    var markerPositions = [
      [-9, 3, 9],
      [9, 3, 9],
      [-9, 3, -9],
      [9, 3, -9],
      [0, 4, 10],
      [0, 4, -10]
    ];

    for (var i = 0; i < markerPositions.length; i++) {
      var geometry = new THREE.SphereGeometry(0.3, 8, 8);
      var material = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(markerPositions[i][0], markerPositions[i][1], markerPositions[i][2]);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createLighting(scene) {
    var ambientLight = new THREE.AmbientLight(0xBBCCCC, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var helipadLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 20);
    helipadLight1.position.set(-4, 3, -4);
    scene.add(helipadLight1);
    lights.push(helipadLight1);

    var helipadLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 20);
    helipadLight2.position.set(4, 3, 4);
    scene.add(helipadLight2);
    lights.push(helipadLight2);
  }

  function init(scene) {
    createBeehiveClusters(scene);
    createStoneEnclosure(scene);
    createCommunsBunker(scene);
    createSatelliteUplink(scene);
    createDishArray(scene);
    createHelicopterPad(scene);
    createAncientStone(scene);
    createSupplyDrops(scene);
    createSeabirdMarkers(scene);
    createLighting(scene);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isDish) {
        objects[i].rotation.y += delta * 0.5;
      }
    }
  }

  function reset(scene) {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
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
