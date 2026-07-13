window.StrathyreFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createLochCliffside(scene) {
    var geometry = new THREE.BoxGeometry(40, 20, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 10, -25);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createChurchTower(scene) {
    var geometry = new THREE.BoxGeometry(6, 14, 6);
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-15, 7, -10);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var clockGeometry = new THREE.BoxGeometry(2, 2, 0.3);
    var clockMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var clockMesh = new THREE.Mesh(clockGeometry, clockMaterial);
    clockMesh.position.set(-15, 12, -2.8);
    clockMesh.castShadow = true;
    clockMesh.receiveShadow = true;
    scene.add(clockMesh);
    objects.push(clockMesh);
  }

  function createLochShoreBarricade(scene) {
    var baseX = -20;
    for (var i = 0; i < 5; i++) {
      var geometry = new THREE.BoxGeometry(2, 1, 1);
      var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(baseX + i * 3, 0.5, 5);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createMilitaryBunkhouse(scene) {
    var geometry = new THREE.BoxGeometry(14, 5, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a5240 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(20, 2.5, -5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createFallenTree(scene) {
    var geometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
    var material = new THREE.MeshLambertMaterial({ color: 0x5C3A1E });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(10, 0.8, 15);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createCheckpoint(scene) {
    var geometry = new THREE.BoxGeometry(4, 3, 4);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-8, 1.5, 20);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var barierGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var barrierMesh = new THREE.Mesh(barierGeometry, barrierMaterial);
    barrierMesh.rotation.z = Math.PI / 3;
    barrierMesh.position.set(-8, 2, 22);
    barrierMesh.castShadow = true;
    barrierMesh.receiveShadow = true;
    scene.add(barrierMesh);
    objects.push(barrierMesh);
  }

  function createTimberYard(scene) {
    var logRadius = 0.6;
    var logHeight = 8;
    var startX = 25;
    var startY = 3;
    var startZ = 15;

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var geometry = new THREE.CylinderGeometry(logRadius, logRadius, logHeight, 12);
        var material = new THREE.MeshLambertMaterial({ color: 0x6B4C2A });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(startX + col * 2, startY + row * 1.5, startZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
      }
    }
  }

  function createPatrolBoat(scene) {
    var geometry = new THREE.BoxGeometry(8, 1.5, 3);
    var material = new THREE.MeshLambertMaterial({ color: 0x778877 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-30, 0.75, -30);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var outboardGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    var outboardMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var outboardMesh = new THREE.Mesh(outboardGeometry, outboardMaterial);
    outboardMesh.rotation.z = Math.PI / 2;
    outboardMesh.position.set(-34, 1.5, -30);
    outboardMesh.castShadow = true;
    outboardMesh.receiveShadow = true;
    scene.add(outboardMesh);
    objects.push(outboardMesh);
  }

  function createWaterfallRavine(scene) {
    var geometry = new THREE.BoxGeometry(2, 15, 20);
    var material = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(35, 7.5, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function setupLights(scene) {
    var ambientLight = new THREE.AmbientLight(0x778866, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var lochLight = new THREE.DirectionalLight(0xCCDDEE, 0.5);
    lochLight.position.set(-20, 15, -35);
    lochLight.castShadow = true;
    lochLight.shadow.mapSize.width = 2048;
    lochLight.shadow.mapSize.height = 2048;
    scene.add(lochLight);
    lights.push(lochLight);
  }

  function init(scene) {
    createLochCliffside(scene);
    createChurchTower(scene);
    createLochShoreBarricade(scene);
    createMilitaryBunkhouse(scene);
    createFallenTree(scene);
    createCheckpoint(scene);
    createTimberYard(scene);
    createPatrolBoat(scene);
    createWaterfallRavine(scene);
    setupLights(scene);
  }

  function update(delta) {
    if (objects.length > 0) {
      var boatIndex = -1;
      for (var i = 0; i < objects.length; i++) {
        if (objects[i].position.x < -25 && objects[i].position.x > -35 &&
            objects[i].position.y < 2 && objects[i].position.y > 0 &&
            objects[i].position.z < -25 && objects[i].position.z > -35) {
          boatIndex = i;
          break;
        }
      }

      if (boatIndex >= 0) {
        var boat = objects[boatIndex];
        boat.position.y = 0.75 + Math.sin(Date.now() * 0.001) * 0.3;
      }
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
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
