window.FreightTrain = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var trainGroup = null;
  var trackGroup = null;
  var landscapeGroup = null;
  var trainSpeed = 0.05;
  var trainPosition = 0;
  var smokeParticles = [];
  var guards = [];
  var sceneryOffset = 0;

  var meshes = {
    locomotive: null,
    cars: [],
    caboose: null,
    track: null,
    tunnel: null,
    landscape: null
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    trainGroup = new THREE.Group();
    scene.add(trainGroup);

    trackGroup = new THREE.Group();
    scene.add(trackGroup);

    landscapeGroup = new THREE.Group();
    scene.add(landscapeGroup);

    buildLocomotiveEngine();
    buildFreightCars();
    buildCaboose();
    buildTrack();
    buildTunnelFrame();
    buildLandscape();
    buildGuardPosts();

    camera.position.z = 15;
    camera.position.y = 5;
  }

  function buildLocomotiveEngine() {
    var locGroup = new THREE.Group();
    locGroup.position.z = 0;
    trainGroup.add(locGroup);

    var cabGeometry = new THREE.BoxGeometry(3, 4, 8);
    var cabMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.y = 2;
    cab.position.z = 0;
    locGroup.add(cab);
    meshes.locomotive = cab;

    var boilerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
    var boilerMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var boiler = new THREE.Mesh(boilerGeometry, boilerMaterial);
    boiler.rotation.z = Math.PI / 2;
    boiler.position.z = 2;
    boiler.position.y = 1.5;
    locGroup.add(boiler);

    var stackGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 12);
    var stackMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.position.y = 5.5;
    stack.position.z = 6;
    locGroup.add(stack);

    var rimGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.2, 16);
    var rimMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var rimLeft = new THREE.Mesh(rimGeometry, rimMaterial);
    rimLeft.rotation.z = Math.PI / 2;
    rimLeft.position.y = 0.5;
    rimLeft.position.z = 2;
    locGroup.add(rimLeft);

    var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var wheelFront = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFront.rotation.z = Math.PI / 2;
    wheelFront.position.y = 0.3;
    wheelFront.position.z = 8;
    locGroup.add(wheelFront);

    var wheelBack = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelBack.rotation.z = Math.PI / 2;
    wheelBack.position.y = 0.3;
    wheelBack.position.z = -2;
    locGroup.add(wheelBack);

    locGroup.userData = { type: 'locomotive', health: 100 };
  }

  function buildFreightCars() {
    var carTypes = [
      { type: 'flatbed', color: 0x777777, cargo: true },
      { type: 'boxcar', color: 0x8B2222, cargo: false },
      { type: 'tank', color: 0xCCCCCC, cargo: false },
      { type: 'container', color: 0x666666, cargo: false },
      { type: 'flatbed', color: 0x777777, cargo: true },
      { type: 'boxcar', color: 0x8B2222, cargo: false },
      { type: 'tank', color: 0xCCCCCC, cargo: false },
      { type: 'container', color: 0x555555, cargo: false }
    ];

    var posZ = -12;

    carTypes.forEach(function(carData, index) {
      var carGroup = new THREE.Group();
      carGroup.position.z = posZ;
      trainGroup.add(carGroup);

      if (carData.type === 'flatbed') {
        buildFlatbedCar(carGroup, carData.color, carData.cargo);
      } else if (carData.type === 'boxcar') {
        buildBoxcar(carGroup, carData.color);
      } else if (carData.type === 'tank') {
        buildTankCar(carGroup, carData.color);
      } else if (carData.type === 'container') {
        buildContainerCar(carGroup, carData.color);
      }

      var coupling = buildCoupling(index);
      carGroup.add(coupling);

      carGroup.userData = { type: carData.type, index: index, health: 80 };
      meshes.cars.push(carGroup);

      posZ -= 12;
    });
  }

  function buildFlatbedCar(carGroup, color, hasCargo) {
    var flatGeometry = new THREE.BoxGeometry(4, 0.8, 10);
    var flatMaterial = new THREE.MeshPhongMaterial({ color: color });
    var flatbed = new THREE.Mesh(flatGeometry, flatMaterial);
    flatbed.position.y = 1;
    carGroup.add(flatbed);

    var railGeometry = new THREE.BoxGeometry(0.3, 2, 10);
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.x = -2.2;
    railLeft.position.y = 1.8;
    carGroup.add(railLeft);

    var railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.x = 2.2;
    railRight.position.y = 1.8;
    carGroup.add(railRight);

    if (hasCargo) {
      var crateGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x8B6914 });

      var crate1 = new THREE.Mesh(crateGeometry, crateMaterial);
      crate1.position.set(-1, 2, -2);
      carGroup.add(crate1);

      var crate2 = new THREE.Mesh(crateGeometry, crateMaterial);
      crate2.position.set(1, 2, 0);
      carGroup.add(crate2);

      var crate3 = new THREE.Mesh(crateGeometry, crateMaterial);
      crate3.position.set(-1, 2, 3);
      carGroup.add(crate3);

      var drumGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12);
      var drumMaterial = new THREE.MeshPhongMaterial({ color: 0xCC6600 });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(1.5, 2, -3);
      carGroup.add(drum);
    }

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = 0.2;
      wheel.position.z = -3 + i * 3;
      carGroup.add(wheel);
    }
  }

  function buildBoxcar(carGroup, color) {
    var boxGeometry = new THREE.BoxGeometry(4, 4, 10);
    var boxMaterial = new THREE.MeshPhongMaterial({ color: color });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 2.5;
    carGroup.add(box);

    var roofGeometry = new THREE.BoxGeometry(4.2, 0.4, 10);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5;
    carGroup.add(roof);

    var doorGeometry = new THREE.BoxGeometry(3.8, 3.5, 0.2);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x5a0000 });
    var doorLeft = new THREE.Mesh(doorGeometry, doorMaterial);
    doorLeft.position.set(-1, 2.5, 5);
    carGroup.add(doorLeft);

    var doorRight = new THREE.Mesh(doorGeometry, doorMaterial);
    doorRight.position.set(1, 2.5, 5);
    carGroup.add(doorRight);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = 0.2;
      wheel.position.z = -3 + i * 3;
      carGroup.add(wheel);
    }
  }

  function buildTankCar(carGroup, color) {
    var tankGeometry = new THREE.CylinderGeometry(1.8, 1.8, 12, 16);
    var tankMaterial = new THREE.MeshPhongMaterial({ color: color });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.rotation.z = Math.PI / 2;
    tank.position.y = 1.5;
    carGroup.add(tank);

    var capGeometry = new THREE.SphereGeometry(1.8, 16, 8);
    var capMaterial = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
    var capLeft = new THREE.Mesh(capGeometry, capMaterial);
    capLeft.scale.z = 0.4;
    capLeft.position.set(6, 1.5, 0);
    carGroup.add(capLeft);

    var capRight = new THREE.Mesh(capGeometry, capMaterial);
    capRight.scale.z = 0.4;
    capRight.position.set(-6, 1.5, 0);
    carGroup.add(capRight);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = 0.2;
      wheel.position.z = -3 + i * 3;
      carGroup.add(wheel);
    }
  }

  function buildContainerCar(carGroup, color) {
    var containerGeometry = new THREE.BoxGeometry(4, 3.5, 10);
    var containerMaterial = new THREE.MeshPhongMaterial({ color: color });
    var container = new THREE.Mesh(containerGeometry, containerMaterial);
    container.position.y = 2;
    carGroup.add(container);

    var doorGeometry = new THREE.BoxGeometry(3.8, 3, 0.2);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2, 5);
    carGroup.add(door);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = 0.2;
      wheel.position.z = -3 + i * 3;
      carGroup.add(wheel);
    }
  }

  function buildCoupling(index) {
    var couplingGroup = new THREE.Group();
    couplingGroup.position.z = 5.5 + index * 0.5;

    var hookGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    var hookMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    couplingGroup.add(hook);

    return couplingGroup;
  }

  function buildCaboose() {
    var cabooseGroup = new THREE.Group();
    cabooseGroup.position.z = -108;
    trainGroup.add(cabooseGroup);

    var bodyGeometry = new THREE.BoxGeometry(3.5, 3.5, 8);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xCC0000 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    cabooseGroup.add(body);

    var roofGeometry = new THREE.BoxGeometry(3.8, 0.5, 8);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x990000 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.2;
    cabooseGroup.add(roof);

    var windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

    for (var i = 0; i < 2; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-1.5 + i * 3, 2.5, 4);
      cabooseGroup.add(window);
    }

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });

    for (var j = 0; j < 4; j++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.y = 0.2;
      wheel.position.z = -2.5 + j * 2.5;
      cabooseGroup.add(wheel);
    }

    meshes.caboose = cabooseGroup;
  }

  function buildTrack() {
    var railGroup = new THREE.Group();
    trackGroup.add(railGroup);

    var railGeometry = new THREE.BoxGeometry(0.2, 0.3, 200);
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x4A3A2A });
    var railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.x = -2;
    railLeft.position.y = -0.5;
    railGroup.add(railLeft);

    var railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.x = 2;
    railRight.position.y = -0.5;
    railGroup.add(railRight);

    var tieGeometry = new THREE.BoxGeometry(4.5, 0.2, 0.5);
    var tieMaterial = new THREE.MeshPhongMaterial({ color: 0x6B5344 });

    for (var i = 0; i < 100; i++) {
      var tie = new THREE.Mesh(tieGeometry, tieMaterial);
      tie.position.y = -0.6;
      tie.position.z = -100 + i * 2;
      railGroup.add(tie);
    }

    meshes.track = railGroup;
  }

  function buildTunnelFrame() {
    var tunnelGroup = new THREE.Group();
    tunnelGroup.position.z = 100;
    trackGroup.add(tunnelGroup);

    var archTop = new THREE.BoxGeometry(8, 0.5, 2);
    var archMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var top = new THREE.Mesh(archTop, archMaterial);
    top.position.y = 8;
    tunnelGroup.add(top);

    var archLeft = new THREE.BoxGeometry(0.5, 10, 2);
    var left = new THREE.Mesh(archLeft, archMaterial);
    left.position.x = -4;
    left.position.y = 3;
    tunnelGroup.add(left);

    var archRight = new THREE.Mesh(archLeft, archMaterial);
    archRight.position.x = 4;
    archRight.position.y = 3;
    tunnelGroup.add(archRight);

    var tunnelInterior = new THREE.BoxGeometry(7.5, 9, 2);
    var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var interior = new THREE.Mesh(tunnelInterior, tunnelMaterial);
    interior.position.z = -1;
    tunnelGroup.add(interior);

    meshes.tunnel = tunnelGroup;
  }

  function buildLandscape() {
    var landscapeGroup2 = new THREE.Group();
    landscapeGroup.add(landscapeGroup2);

    var treeLineGeometry = new THREE.BoxGeometry(50, 15, 1);
    var treeMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a2d });

    var treeLine1 = new THREE.Mesh(treeLineGeometry, treeMaterial);
    treeLine1.position.set(-25, 5, -50);
    landscapeGroup.add(treeLine1);

    var treeLine2 = new THREE.Mesh(treeLineGeometry, treeMaterial);
    treeLine2.position.set(25, 5, -50);
    landscapeGroup.add(treeLine2);

    var hillGeometry = new THREE.BoxGeometry(100, 8, 40);
    var hillMaterial = new THREE.MeshPhongMaterial({ color: 0x3d6b3d });
    var hill = new THREE.Mesh(hillGeometry, hillMaterial);
    hill.position.set(0, -3, -80);
    landscapeGroup.add(hill);

    meshes.landscape = landscapeGroup2;
  }

  function buildGuardPosts() {
    var guardPostPositions = [
      { carIndex: 0, x: 0, z: -2 },
      { carIndex: 1, x: -1.5, z: -14 },
      { carIndex: 3, x: 1.5, z: -36 },
      { carIndex: 5, x: -1.5, z: -60 }
    ];

    guardPostPositions.forEach(function(pos) {
      var postGroup = new THREE.Group();
      postGroup.position.set(pos.x, 5.5, pos.z);

      if (meshes.cars[pos.carIndex]) {
        meshes.cars[pos.carIndex].add(postGroup);
      }

      var guardrailGeometry = new THREE.BoxGeometry(1, 1.5, 0.3);
      var guardrailMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var guardrail = new THREE.Mesh(guardrailGeometry, guardrailMaterial);
      postGroup.add(guardrail);

      guards.push({
        mesh: postGroup,
        health: 40,
        ammo: 20
      });
    });
  }

  function updateSmoke(delta) {
    if (meshes.locomotive && Math.random() > 0.7) {
      var smokeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var smokeMaterial = new THREE.MeshPhongMaterial({
        color: 0xAAAAAA,
        transparent: true,
        opacity: 0.6
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.copy(meshes.locomotive.position);
      smoke.position.y += 5;
      smoke.position.z += 6;

      smokeParticles.push({
        mesh: smoke,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.8 + 0.3,
          0
        ),
        life: 3
      });

      scene.add(smoke);
    }

    for (var i = smokeParticles.length - 1; i >= 0; i--) {
      var particle = smokeParticles[i];
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));
      particle.life -= delta;
      particle.mesh.material.opacity = particle.life / 3;

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        smokeParticles.splice(i, 1);
      }
    }
  }

  function updateTrain(delta) {
    trainPosition += trainSpeed * delta;
    trainGroup.position.z = trainPosition;

    sceneryOffset += trainSpeed * delta * 10;
    if (sceneryOffset > 40) {
      sceneryOffset -= 40;
    }

    if (meshes.locomotive) {
      var wheelRotation = (trainPosition * 0.1) % (Math.PI * 2);
      meshes.locomotive.children.forEach(function(child) {
        if (child.geometry && child.geometry instanceof THREE.CylinderGeometry) {
          child.rotation.x = wheelRotation;
        }
      });
    }

    meshes.cars.forEach(function(car) {
      car.children.forEach(function(child) {
        if (child.geometry && child.geometry instanceof THREE.CylinderGeometry) {
          var wheelRot = (trainPosition * 0.1) % (Math.PI * 2);
          child.rotation.x = wheelRot;
        }
      });
    });

    if (meshes.track) {
      meshes.track.position.z = -sceneryOffset;
    }

    if (meshes.landscape) {
      meshes.landscape.position.z = -sceneryOffset * 0.5;
    }

    trainSpeed = 0.05 + Math.sin(trainPosition * 0.01) * 0.02;
  }

  function updateGuards(delta) {
    guards.forEach(function(guard, index) {
      if (guard.mesh) {
        guard.mesh.rotation.y += 0.5 * delta;
        if (Math.random() > 0.9) {
          guard.ammo -= 1;
        }
      }
    });
  }

  function update(delta) {
    updateTrain(delta);
    updateSmoke(delta);
    updateGuards(delta);
  }

  function reset() {
    smokeParticles.forEach(function(particle) {
      scene.remove(particle.mesh);
    });
    smokeParticles = [];

    guards = [];

    if (trainGroup) {
      scene.remove(trainGroup);
      trainGroup = new THREE.Group();
      scene.add(trainGroup);
    }

    if (trackGroup) {
      scene.remove(trackGroup);
      trackGroup = new THREE.Group();
      scene.add(trackGroup);
    }

    if (landscapeGroup) {
      scene.remove(landscapeGroup);
      landscapeGroup = new THREE.Group();
      scene.add(landscapeGroup);
    }

    trainPosition = 0;
    sceneryOffset = 0;
    trainSpeed = 0.05;

    meshes = {
      locomotive: null,
      cars: [],
      caboose: null,
      track: null,
      tunnel: null,
      landscape: null
    };

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
