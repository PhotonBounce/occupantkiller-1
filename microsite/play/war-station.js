window.WarStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environmentObjects = [];
  var staticMeshes = [];

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    scene.background = new THREE.Color(0x4a4a4a);
    scene.fog = new THREE.Fog(0x4a4a4a, 100, 300);

    buildMainPlatform();
    buildDerailedLocomotive();
    buildOverturnedTrainCars();
    buildClockTower();
    buildTicketBooths();
    buildWaitingRoom();
    buildUnderpasses();
    buildMilitaryBarrier();
    buildAmbience();
  }

  function buildMainPlatform() {
    var platformGeom = new THREE.BoxGeometry(120, 2, 40);
    var platformMat = new THREE.MeshStandardMaterial({
      color: 0x6b5d55,
      metalness: 0.1,
      roughness: 0.9
    });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(0, 0, 0);
    platform.receiveShadow = true;
    scene.add(platform);
    staticMeshes.push(platform);
  }

  function buildDerailedLocomotive() {
    var bodyGeom = new THREE.BoxGeometry(25, 12, 8);
    var metalMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.3
    });
    var body = new THREE.Mesh(bodyGeom, metalMat);
    body.position.set(-30, 7, 0);
    body.rotation.z = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    staticMeshes.push(body);

    var smokeStack = new THREE.CylinderGeometry(2.5, 3, 15, 8);
    var stack = new THREE.Mesh(smokeStack, metalMat);
    stack.position.set(-30, 22, 0);
    stack.castShadow = true;
    scene.add(stack);
    staticMeshes.push(stack);

    var wheelGeom = new THREE.CylinderGeometry(3.5, 3.5, 2, 16);
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeom, metalMat);
      wheel.position.set(-30 + (i - 1.5) * 8, 3.5, 5);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      scene.add(wheel);
      staticMeshes.push(wheel);
    }
  }

  function buildOverturnedTrainCars() {
    var carGeom = new THREE.BoxGeometry(20, 9, 6);
    var carMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.3,
      roughness: 0.7
    });

    var positions = [
      [30, 5, -15],
      [55, 5, 10],
      [10, 5, 25],
      [45, 5, -25]
    ];

    for (var i = 0; i < positions.length; i++) {
      var car = new THREE.Mesh(carGeom, carMat);
      car.position.set(positions[i][0], positions[i][1], positions[i][2]);
      car.rotation.z = (i % 2) * 0.4;
      car.rotation.x = 0.2 * (i % 2);
      car.castShadow = true;
      car.receiveShadow = true;
      scene.add(car);
      staticMeshes.push(car);

      var doorGeom = new THREE.BoxGeometry(4, 6, 0.3);
      var doorMat = new THREE.MeshStandardMaterial({
        color: 0x4a3728,
        metalness: 0.2,
        roughness: 0.8
      });
      var door = new THREE.Mesh(doorGeom, doorMat);
      door.position.set(positions[i][0] + 5, positions[i][1] + 2, positions[i][2] + 3.2);
      scene.add(door);
      staticMeshes.push(door);
    }
  }

  function buildClockTower() {
    var baseGeom = new THREE.CylinderGeometry(6, 8, 5, 12);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0x7f8c8d,
      metalness: 0.05,
      roughness: 0.95
    });
    var base = new THREE.Mesh(baseGeom, stoneMat);
    base.position.set(-50, 2.5, 30);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    staticMeshes.push(base);

    var towerGeom = new THREE.CylinderGeometry(4, 5, 35, 8);
    var tower = new THREE.Mesh(towerGeom, stoneMat);
    tower.position.set(-50, 20, 30);
    tower.castShadow = true;
    scene.add(tower);
    staticMeshes.push(tower);

    var capGeom = new THREE.ConeGeometry(5, 8, 8);
    var cap = new THREE.Mesh(capGeom, stoneMat);
    cap.position.set(-50, 43, 30);
    cap.castShadow = true;
    scene.add(cap);
    staticMeshes.push(cap);

    var clockGeom = new THREE.SphereGeometry(3, 16, 16);
    var clockMat = new THREE.MeshStandardMaterial({
      color: 0xf4e4c1,
      metalness: 0.4,
      roughness: 0.6
    });
    var clock = new THREE.Mesh(clockGeom, clockMat);
    clock.position.set(-50, 23, 30);
    scene.add(clock);
    staticMeshes.push(clock);
  }

  function buildTicketBooths() {
    var boothGeom = new THREE.BoxGeometry(5, 4, 4);
    var boothMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      metalness: 0.15,
      roughness: 0.85
    });

    for (var i = 0; i < 3; i++) {
      var booth = new THREE.Mesh(boothGeom, boothMat);
      booth.position.set(-40 + i * 8, 2, -25);
      booth.castShadow = true;
      booth.receiveShadow = true;
      scene.add(booth);
      staticMeshes.push(booth);

      var windowGeom = new THREE.BoxGeometry(2, 2, 0.2);
      var glassMat = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.6
      });
      var window = new THREE.Mesh(windowGeom, glassMat);
      window.position.set(-40 + i * 8, 2.5, -22.5);
      scene.add(window);
      staticMeshes.push(window);
    }
  }

  function buildWaitingRoom() {
    var wallGeom = new THREE.BoxGeometry(30, 8, 1);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0xbcb5b0,
      metalness: 0.02,
      roughness: 0.98
    });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(40, 4, -20);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    staticMeshes.push(wall);

    var benchGeom = new THREE.BoxGeometry(25, 1.5, 3);
    var benchMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.1,
      roughness: 0.8
    });
    var bench = new THREE.Mesh(benchGeom, benchMat);
    bench.position.set(40, 1.5, -10);
    bench.receiveShadow = true;
    scene.add(bench);
    staticMeshes.push(bench);
  }

  function buildUnderpasses() {
    var underpassGeom = new THREE.CylinderGeometry(12, 12, 50, 8, 4, true);
    var underpassMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      metalness: 0.0,
      roughness: 1.0,
      side: THREE.BackSide
    });
    var underpass = new THREE.Mesh(underpassGeom, underpassMat);
    underpass.position.set(0, -8, 50);
    underpass.rotation.z = Math.PI / 2;
    underpass.receiveShadow = true;
    scene.add(underpass);
    staticMeshes.push(underpass);
  }

  function buildMilitaryBarrier() {
    var barricadeGeom = new THREE.BoxGeometry(4, 2.5, 0.8);
    var barricadeMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      metalness: 0.3,
      roughness: 0.7
    });

    for (var i = 0; i < 8; i++) {
      var barricade = new THREE.Mesh(barricadeGeom, barricadeMat);
      var angle = (i / 8) * Math.PI * 2;
      var radius = 35;
      barricade.position.set(
        Math.cos(angle) * radius,
        1.25,
        Math.sin(angle) * radius
      );
      barricade.rotation.y = angle;
      barricade.castShadow = true;
      barricade.receiveShadow = true;
      scene.add(barricade);
      staticMeshes.push(barricade);
    }
  }

  function buildAmbience() {
    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(50, 40, 50);
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.far = 200;
    light.shadow.camera.left = -100;
    light.shadow.camera.right = 100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    light.castShadow = true;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var fogLight = new THREE.PointLight(0xff6b6b, 0.5, 100);
    fogLight.position.set(0, 25, 0);
    scene.add(fogLight);
  }

  function update(delta) {
    if (!scene) return;

    for (var i = 0; i < staticMeshes.length; i++) {
      var mesh = staticMeshes[i];
      if (mesh.geometry instanceof THREE.SphereGeometry && mesh.position.z === 30) {
        mesh.rotation.y += delta * 0.3;
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = staticMeshes.length - 1; i >= 0; i--) {
        scene.remove(staticMeshes[i]);
        if (staticMeshes[i].geometry) {
          staticMeshes[i].geometry.dispose();
        }
        if (staticMeshes[i].material) {
          if (Array.isArray(staticMeshes[i].material)) {
            for (var j = 0; j < staticMeshes[i].material.length; j++) {
              staticMeshes[i].material[j].dispose();
            }
          } else {
            staticMeshes[i].material.dispose();
          }
        }
      }
      staticMeshes = [];
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
