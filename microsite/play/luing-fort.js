window.LuingFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createQuarryPit(scene) {
    var geometry = new THREE.BoxGeometry(30, 0.5, 25);
    var material = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -7, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createQuarryWalls(scene) {
    var wallGeometry1 = new THREE.BoxGeometry(1, 15, 25);
    var wallGeometry2 = new THREE.BoxGeometry(30, 15, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x556677 });

    var wallLeft = new THREE.Mesh(wallGeometry1, material);
    wallLeft.position.set(-15, 0, 0);
    scene.add(wallLeft);
    objects.push(wallLeft);

    var wallRight = new THREE.Mesh(wallGeometry1, material);
    wallRight.position.set(15, 0, 0);
    scene.add(wallRight);
    objects.push(wallRight);

    var wallFront = new THREE.Mesh(wallGeometry2, material);
    wallFront.position.set(0, 0, 12.5);
    scene.add(wallFront);
    objects.push(wallFront);

    var wallBack = new THREE.Mesh(wallGeometry2, material);
    wallBack.position.set(0, 0, -12.5);
    scene.add(wallBack);
    objects.push(wallBack);
  }

  function createProcessingBuilding(scene) {
    var geometry = new THREE.BoxGeometry(16, 8, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(20, 4, -15);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createConveyorBelt(scene) {
    var conveyorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var positions = [
      { x: 5, y: 8, z: -8, rx: 0.2, ry: 0, rz: 0 },
      { x: 8, y: 10, z: -6, rx: 0.2, ry: 0, rz: 0 },
      { x: 11, y: 12, z: -4, rx: 0.2, ry: 0, rz: 0 },
      { x: 14, y: 14, z: -2, rx: 0.2, ry: 0, rz: 0 },
      { x: 17, y: 15, z: 0, rx: 0.15, ry: 0, rz: 0 },
      { x: 20, y: 16, z: 2, rx: 0.1, ry: 0, rz: 0 },
      { x: 22, y: 17, z: 4, rx: 0.05, ry: 0, rz: 0 },
      { x: 24, y: 17, z: 6, rx: 0, ry: 0, rz: 0 },
      { x: 25, y: 16, z: 8, rx: -0.05, ry: 0, rz: 0 },
      { x: 25, y: 14, z: 10, rx: -0.1, ry: 0, rz: 0 },
      { x: 24, y: 12, z: 12, rx: -0.15, ry: 0, rz: 0 },
      { x: 22, y: 10, z: 13, rx: -0.2, ry: 0, rz: 0 }
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(12, 1, 2);
      var mesh = new THREE.Mesh(geometry, conveyorMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.x = pos.rx;
      mesh.rotation.y = pos.ry;
      mesh.rotation.z = pos.rz;
      mesh.conveyorIndex = i;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createCrusherMachinery(scene) {
    var geometry = new THREE.BoxGeometry(8, 6, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(18, 3, 18);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createStorageHoppers(scene) {
    var hoperMaterial = new THREE.MeshLambertMaterial({ color: 0x667799 });
    var positions = [
      { x: -10, y: 5, z: 10 },
      { x: -5, y: 5, z: 10 },
      { x: 0, y: 5, z: 10 },
      { x: 5, y: 5, z: 10 }
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.CylinderGeometry(3, 2, 4, 8);
      var mesh = new THREE.Mesh(geometry, hoperMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createBarracks(scene) {
    var geometry = new THREE.BoxGeometry(10, 5, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-20, 2.5, 18);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createPerimeterFence(scene) {
    var fencePositions = [
      { x: -18, z: 15 },
      { x: -10, z: 15 },
      { x: 0, z: 15 },
      { x: 10, z: 15 },
      { x: 18, z: 15 },
      { x: -18, z: -15 },
      { x: -10, z: -15 },
      { x: 0, z: -15 },
      { x: 10, z: -15 },
      { x: 18, z: -15 }
    ];

    var fencePostMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var i;
    for (i = 0; i < fencePositions.length; i++) {
      var pos = fencePositions[i];
      var geometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      var mesh = new THREE.Mesh(geometry, fencePostMaterial);
      mesh.position.set(pos.x, 1.5, pos.z);
      scene.add(mesh);
      objects.push(mesh);
    }

    var wireGeometry = new THREE.BufferGeometry();
    var wireVertices = [];
    var j;
    for (j = 0; j < fencePositions.length - 1; j++) {
      wireVertices.push(fencePositions[j].x, 2, fencePositions[j].z);
      wireVertices.push(fencePositions[j + 1].x, 2, fencePositions[j + 1].z);
    }
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wireVertices), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
    var wireSegments = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireSegments);
    objects.push(wireSegments);
  }

  function createDrainageSluice(scene) {
    var geometry = new THREE.BoxGeometry(2, 1, 20);
    var material = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-12, -3, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createFloodlights(scene) {
    var lightPositions = [
      { x: 15, y: 20, z: 15 },
      { x: -15, y: 20, z: -15 },
      { x: 0, y: 22, z: 0 }
    ];

    var i;
    for (i = 0; i < lightPositions.length; i++) {
      var pos = lightPositions[i];
      var light = new THREE.PointLight(0xFFFFFF, 1.0);
      light.position.set(pos.x, pos.y, pos.z);
      scene.add(light);
      lights.push(light);
    }
  }

  function init(scene) {
    createQuarryPit(scene);
    createQuarryWalls(scene);
    createProcessingBuilding(scene);
    createConveyorBelt(scene);
    createCrusherMachinery(scene);
    createStorageHoppers(scene);
    createBarracks(scene);
    createPerimeterFence(scene);
    createDrainageSluice(scene);
    createFloodlights(scene);
  }

  function update(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.conveyorIndex !== undefined) {
        obj.position.y += delta * 0.5;
        if (obj.position.y > 25) {
          obj.position.y = 5;
        }
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

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
