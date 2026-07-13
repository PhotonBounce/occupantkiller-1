window.BruichladdiChFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createDistilleryMainBlock(scene) {
    var geometry = new THREE.BoxGeometry(22, 14, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0xEEEEDD });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 7, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createPagodaKiln(scene) {
    var boxGeometry = new THREE.BoxGeometry(8, 10, 8);
    var material = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var boxMesh = new THREE.Mesh(boxGeometry, material);
    boxMesh.position.set(15, 5, 0);
    scene.add(boxMesh);
    objects.push(boxMesh);

    var coneGeometry = new THREE.ConeGeometry(5, 4, 16);
    var coneMesh = new THREE.Mesh(coneGeometry, material);
    coneMesh.position.set(15, 15, 0);
    scene.add(coneMesh);
    objects.push(coneMesh);
  }

  function createMaltingFloorShed(scene) {
    var geometry = new THREE.BoxGeometry(18, 8, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0xCCCCBB });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-12, 4, 10);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createControlTower(scene) {
    var geometry = new THREE.BoxGeometry(4, 4, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(5, 20, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  function createGunBattery(scene) {
    var emplacementGeometry = new THREE.BoxGeometry(3, 2, 3);
    var emplacementMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });

    var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });

    var positions = [
      [-8, 1, 8],
      [0, 1, 12],
      [8, 1, 8]
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var emplacementMesh = new THREE.Mesh(emplacementGeometry, emplacementMaterial);
      emplacementMesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(emplacementMesh);
      objects.push(emplacementMesh);

      var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrelMesh.position.set(positions[i][0], positions[i][1] + 2, positions[i][2]);
      barrelMesh.rotation.z = Math.PI / 6;
      scene.add(barrelMesh);
      objects.push(barrelMesh);
    }
  }

  function createRazorWire(scene) {
    var points = [];
    var x;
    for (x = -25; x <= 25; x += 2) {
      var y = (x % 4 === 0) ? 2 : 3;
      points.push(new THREE.Vector3(x, y, 18));
    }

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var wireSegments = new THREE.LineSegments(geometry, material);
    scene.add(wireSegments);
    objects.push(wireSegments);
  }

  function createLoadingCrane(scene) {
    var verticalGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    var craneColor = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var verticalMesh = new THREE.Mesh(verticalGeometry, craneColor);
    verticalMesh.position.set(-20, 6, -15);
    scene.add(verticalMesh);
    objects.push(verticalMesh);

    var armGeometry = new THREE.BoxGeometry(8, 1, 1);
    var armMesh = new THREE.Mesh(armGeometry, craneColor);
    armMesh.position.set(-20, 12.5, -15);
    armMesh.name = 'craneArm';
    scene.add(armMesh);
    objects.push(armMesh);
  }

  function createWhiskyBarrelCourse(scene) {
    var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1, 8);
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    var positions = [
      [-5, 0.5, -5],
      [-2, 0.5, -5],
      [1, 0.5, -5],
      [4, 0.5, -5],
      [-3, 0.5, -8],
      [0, 0.5, -8],
      [3, 0.5, -8],
      [-4, 0.5, -11],
      [-1, 0.5, -11],
      [2, 0.5, -11]
    ];

    var i;
    for (i = 0; i < positions.length; i++) {
      var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrelMesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      scene.add(barrelMesh);
      objects.push(barrelMesh);
    }
  }

  function createCourtyard(scene) {
    var courtyard = {
      position: new THREE.Vector3(0, 10, 0),
      intensity: 1.2
    };
    var light = new THREE.PointLight(0xFFEE88, 1.2, 40);
    light.position.copy(courtyard.position);
    scene.add(light);
    lights.push(light);
  }

  function createSearchlight(scene) {
    var searchlight = new THREE.PointLight(0xFFFFFF, 1.5, 100);
    searchlight.position.set(-22, 18, -20);
    searchlight.name = 'searchlight';
    scene.add(searchlight);
    lights.push(searchlight);
  }

  var update = function(delta) {
    var i;
    for (i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.name === 'craneArm') {
        obj.rotation.z += 0.3 * delta;
      }
    }

    for (i = 0; i < lights.length; i++) {
      var light = lights[i];
      if (light.name === 'searchlight') {
        var time = Date.now() * 0.001;
        light.position.x = -22 + Math.cos(time * 0.5) * 15;
        light.position.z = -20 + Math.sin(time * 0.5) * 15;
      }
    }
  };

  var reset = function(scene) {
    var i;
    for (i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }
    lights = [];
  };

  var init = function(scene) {
    reset(scene);
    createDistilleryMainBlock(scene);
    createPagodaKiln(scene);
    createMaltingFloorShed(scene);
    createControlTower(scene);
    createGunBattery(scene);
    createRazorWire(scene);
    createLoadingCrane(scene);
    createWhiskyBarrelCourse(scene);
    createCourtyard(scene);
    createSearchlight(scene);
  };

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
