window.SubwayAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var trainCars = [];
  var emergencyLights = [];
  var cableMeshes = [];
  var trainPosition = 0;
  var trainDirection = 1;
  var emergencyStrobeTime = 0;
  var cableSwayTime = 0;
  var originalPositions = {};

  var material = {
    concrete: new THREE.MeshPhongMaterial({ color: 0x3a3a3a, shininess: 5 }),
    steel: new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 30 }),
    rail: new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 20 }),
    trainBody: new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 25 }),
    trainWindow: new THREE.MeshPhongMaterial({ color: 0x0a1e3a, shininess: 60 }),
    trainDoor: new THREE.MeshPhongMaterial({ color: 0x2a3a5a, shininess: 15 }),
    barrier: new THREE.MeshPhongMaterial({ color: 0x888800, shininess: 40 }),
    signage: new THREE.MeshPhongMaterial({ color: 0xffcc00, shininess: 50 }),
    emergencyLight: new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff6600, shininess: 100 }),
    graffiti: new THREE.MeshPhongMaterial({ color: 0xff1144, shininess: 10 }),
    water: new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 80, transparent: true, opacity: 0.6 }),
    archway: new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 0 }),
    catwalk: new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 15 }),
    ventilation: new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 20 }),
    bench: new THREE.MeshPhongMaterial({ color: 0x885533, shininess: 10 }),
    trashBin: new THREE.MeshPhongMaterial({ color: 0xdd4422, shininess: 5 }),
    junctionBox: new THREE.MeshPhongMaterial({ color: 0xffaa00, shininess: 35 })
  };

  function createPlatform() {
    var platformGeom = new THREE.BoxGeometry(80, 0.5, 15);
    var platform = new THREE.Mesh(platformGeom, material.concrete);
    platform.position.set(0, 0, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);
  }

  function createTracks() {
    var railSpacing = 1.5;
    var railGeom = new THREE.BoxGeometry(100, 0.2, 0.15);
    var rail1 = new THREE.Mesh(railGeom, material.rail);
    rail1.position.set(0, -0.3, -railSpacing);
    rail1.castShadow = true;
    scene.add(rail1);
    meshes.push(rail1);

    var rail2 = new THREE.Mesh(railGeom, material.rail);
    rail2.position.set(0, -0.3, railSpacing);
    rail2.castShadow = true;
    scene.add(rail2);
    meshes.push(rail2);

    for (var i = -40; i < 40; i += 2) {
      var tieGeom = new THREE.BoxGeometry(0.5, 0.15, 3.2);
      var tie = new THREE.Mesh(tieGeom, material.steel);
      tie.position.set(i, -0.25, 0);
      tie.castShadow = true;
      scene.add(tie);
      meshes.push(tie);
    }
  }

  function createTrainCars() {
    var carPositions = [-20, 0, 20];
    carPositions.forEach(function(xPos) {
      var carBody = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 2.5), material.trainBody);
      carBody.position.set(xPos, 1.5, 0);
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      scene.add(carBody);
      trainCars.push(carBody);
      meshes.push(carBody);

      for (var i = 0; i < 4; i++) {
        var windowGeom = new THREE.BoxGeometry(1.2, 1, 0.1);
        var window = new THREE.Mesh(windowGeom, material.trainWindow);
        window.position.set(-2.5 + i * 2, 2, 1.3);
        carBody.add(window);
      }

      var doorGeom = new THREE.BoxGeometry(1.5, 2, 0.08);
      var door1 = new THREE.Mesh(doorGeom, material.trainDoor);
      door1.position.set(-3, 1, 1.26);
      carBody.add(door1);

      var door2 = new THREE.Mesh(doorGeom, material.trainDoor);
      door2.position.set(3, 1, 1.26);
      carBody.add(door2);
    });
  }

  function createSupportPillars() {
    var pillarPositions = [-35, -15, 5, 25];
    pillarPositions.forEach(function(xPos) {
      var pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
      var pillar = new THREE.Mesh(pillarGeom, material.concrete);
      pillar.position.set(xPos, 2, 6);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      meshes.push(pillar);

      var pillar2 = new THREE.Mesh(pillarGeom, material.concrete);
      pillar2.position.set(xPos, 2, -6);
      pillar2.castShadow = true;
      pillar2.receiveShadow = true;
      scene.add(pillar2);
      meshes.push(pillar2);
    });
  }

  function createOverheadCables() {
    var cablePositions = [-8, 0, 8];
    cablePositions.forEach(function(zPos) {
      var points = [
        new THREE.Vector3(-40, 4.5, zPos),
        new THREE.Vector3(40, 4.5, zPos)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 3 }));
      scene.add(line);
      cableMeshes.push({ mesh: line, zPos: zPos, originalZ: zPos });
      meshes.push(line);
    });
  }

  function createTicketBarriers() {
    for (var i = 0; i < 3; i++) {
      var barrierGeom = new THREE.BoxGeometry(2, 1.5, 0.15);
      var barrier = new THREE.Mesh(barrierGeom, material.barrier);
      barrier.position.set(-20 + i * 10, 0.75, -9);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      scene.add(barrier);
      meshes.push(barrier);
    }
  }

  function createSignageBoards() {
    for (var i = 0; i < 4; i++) {
      var signGeom = new THREE.BoxGeometry(4, 2, 0.1);
      var sign = new THREE.Mesh(signGeom, material.signage);
      sign.position.set(-30 + i * 20, 3.5, 7.5);
      sign.castShadow = true;
      scene.add(sign);
      meshes.push(sign);
    }
  }

  function createElectricalBoxes() {
    for (var i = 0; i < 3; i++) {
      var boxGeom = new THREE.BoxGeometry(1.5, 2, 1);
      var box = new THREE.Mesh(boxGeom, material.junctionBox);
      box.position.set(-25 + i * 25, 1.5, -8);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      meshes.push(box);
    }
  }

  function createCatwalk() {
    var walkGeom = new THREE.BoxGeometry(60, 0.3, 1.5);
    var walk = new THREE.Mesh(walkGeom, material.catwalk);
    walk.position.set(0, 4.2, -7.5);
    walk.castShadow = true;
    walk.receiveShadow = true;
    scene.add(walk);
    meshes.push(walk);

    for (var i = -30; i < 30; i += 3) {
      var railGeom = new THREE.BoxGeometry(0.2, 1, 1.5);
      var rail = new THREE.Mesh(railGeom, material.steel);
      rail.position.set(i, 4.7, -7.5);
      scene.add(rail);
      meshes.push(rail);
    }
  }

  function createEmergencyLights() {
    for (var i = 0; i < 6; i++) {
      var lightGeom = new THREE.BoxGeometry(0.8, 0.4, 0.3);
      var light = new THREE.Mesh(lightGeom, material.emergencyLight);
      light.position.set(-30 + i * 12, 4, 7.8);
      light.castShadow = true;
      scene.add(light);
      emergencyLights.push({ mesh: light, originalColor: 0xff6600 });
      meshes.push(light);
    }
  }

  function createTunnelMouth() {
    var archGeom = new THREE.BoxGeometry(20, 5, 0.3);
    var arch = new THREE.Mesh(archGeom, material.archway);
    arch.position.set(-45, 2.5, 0);
    scene.add(arch);
    meshes.push(arch);

    var arch2 = new THREE.Mesh(archGeom, material.archway);
    arch2.position.set(45, 2.5, 0);
    scene.add(arch2);
    meshes.push(arch2);
  }

  function createEscalator() {
    var stepCount = 12;
    for (var i = 0; i < stepCount; i++) {
      var stepGeom = new THREE.BoxGeometry(3, 0.3, 0.6);
      var step = new THREE.Mesh(stepGeom, material.steel);
      step.position.set(30, 0.5 + i * 0.4, 8 - i * 0.5);
      step.castShadow = true;
      scene.add(step);
      meshes.push(step);
    }
  }

  function createTrashBins() {
    for (var i = 0; i < 4; i++) {
      var binGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8);
      var bin = new THREE.Mesh(binGeom, material.trashBin);
      bin.position.set(-35 + i * 25, 0.4, -7);
      bin.castShadow = true;
      bin.receiveShadow = true;
      scene.add(bin);
      meshes.push(bin);
    }
  }

  function createBenches() {
    for (var i = 0; i < 3; i++) {
      var benchGeom = new THREE.BoxGeometry(4, 0.6, 1);
      var bench = new THREE.Mesh(benchGeom, material.bench);
      bench.position.set(-20 + i * 20, 0.3, 6.5);
      bench.castShadow = true;
      bench.receiveShadow = true;
      scene.add(bench);
      meshes.push(bench);
    }
  }

  function createGraffitiWalls() {
    for (var i = 0; i < 5; i++) {
      var grafGeom = new THREE.BoxGeometry(3, 2, 0.05);
      var graf = new THREE.Mesh(grafGeom, material.graffiti);
      graf.position.set(-30 + i * 15, 1, -8.5);
      scene.add(graf);
      meshes.push(graf);
    }
  }

  function createWaterPuddle() {
    var pudgeGeom = new THREE.BoxGeometry(2, 0.02, 2);
    var puddle = new THREE.Mesh(pudgeGeom, material.water);
    puddle.position.set(-10, 0.05, 5);
    puddle.receiveShadow = true;
    scene.add(puddle);
    meshes.push(puddle);
  }

  function createServiceDoors() {
    for (var i = 0; i < 2; i++) {
      var doorGeom = new THREE.BoxGeometry(2, 2.5, 0.1);
      var door = new THREE.Mesh(doorGeom, material.steel);
      door.position.set(-40 + i * 80, 1.25, -8);
      door.castShadow = true;
      scene.add(door);
      meshes.push(door);
    }
  }

  function createFareMachines() {
    for (var i = 0; i < 2; i++) {
      var machineGeom = new THREE.BoxGeometry(1, 1.8, 0.6);
      var machine = new THREE.Mesh(machineGeom, material.junctionBox);
      machine.position.set(-15 + i * 30, 0.9, -8.5);
      machine.castShadow = true;
      machine.receiveShadow = true;
      scene.add(machine);
      meshes.push(machine);
    }
  }

  function createVentilationGrates() {
    for (var i = 0; i < 4; i++) {
      var grateGeom = new THREE.BoxGeometry(2, 1.5, 0.2);
      var grate = new THREE.Mesh(grateGeom, material.ventilation);
      grate.position.set(-30 + i * 20, 4.5, 7.8);
      scene.add(grate);
      meshes.push(grate);
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    meshes = [];
    trainCars = [];
    emergencyLights = [];
    cableMeshes = [];
    trainPosition = 0;

    createPlatform();
    createTracks();
    createTrainCars();
    createSupportPillars();
    createOverheadCables();
    createTicketBarriers();
    createSignageBoards();
    createElectricalBoxes();
    createCatwalk();
    createEmergencyLights();
    createTunnelMouth();
    createEscalator();
    createTrashBins();
    createBenches();
    createGraffitiWalls();
    createWaterPuddle();
    createServiceDoors();
    createFareMachines();
    createVentilationGrates();

    meshes.forEach(function(mesh) {
      if (mesh.position) {
        originalPositions[mesh.uuid] = {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z
        };
      }
    });
  }

  function update(delta) {
    trainPosition += trainDirection * delta * 2;
    if (trainPosition > 30) trainDirection = -1;
    if (trainPosition < -30) trainDirection = 1;

    trainCars.forEach(function(car) {
      car.position.x += trainDirection * delta * 2;
    });

    emergencyStrobeTime += delta;
    if (emergencyStrobeTime > 0.3) {
      emergencyStrobeTime = 0;
      emergencyLights.forEach(function(light) {
        var intensity = Math.sin(emergencyStrobeTime * Math.PI * 10) > 0 ? 1 : 0.3;
        light.mesh.material.emissive.setHex(light.originalColor);
        light.mesh.material.emissive.multiplyScalar(intensity);
      });
    }

    cableSwayTime += delta;
    cableMeshes.forEach(function(cable) {
      var sway = Math.sin(cableSwayTime * 1.5) * 0.15;
      var geometry = cable.mesh.geometry;
      var positions = geometry.attributes.position.array;
      positions[1] += sway * delta;
      positions[4] += sway * delta;
      geometry.attributes.position.needsUpdate = true;
    });
  }

  function reset() {
    trainPosition = 0;
    trainDirection = 1;
    emergencyStrobeTime = 0;
    cableSwayTime = 0;

    trainCars.forEach(function(car) {
      if (originalPositions[car.uuid]) {
        var orig = originalPositions[car.uuid];
        car.position.set(orig.x, orig.y, orig.z);
      }
    });

    emergencyLights.forEach(function(light) {
      light.mesh.material.emissive.setHex(light.originalColor);
    });

    cableMeshes.forEach(function(cable) {
      var geometry = cable.mesh.geometry;
      var positions = geometry.attributes.position.array;
      positions[1] = 4.5;
      positions[4] = 4.5;
      geometry.attributes.position.needsUpdate = true;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
