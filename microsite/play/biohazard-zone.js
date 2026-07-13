window.BiohazardZone = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var animationState = {
    workerPositions: [],
    helicopterHeight: 0,
    droneAngle: 0,
    sirenRotation: 0,
    toxicPulse: 0,
    foamShimmer: 0
  };
  var keyStates = { h: false, z: false };
  var lastHKeyTime = 0;
  var hudVisible = false;
  var hudElement = null;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    createContaminatedGround();
    createChemicalPlant();
    createStorageTanks();
    createToxicPool();
    createDecontaminationTent();
    createCDCVehicles();
    createInfectedWorkers();
    createHazmatTeam();
    createContainmentBarriers();
    createChemicalBarrels();
    createWarningSiren();
    createEmergencyShower();
    createInfectedVehicle();
    createEvacuationHelicopter();
    createMonitoringDrone();
    createAirFiltration();
    createBioContainmentFoam();

    setupHUD();
    setupKeyboardControls();
  }

  function createContaminatedGround() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 400);
    var material = new THREE.MeshStandardMaterial({ color: 0x4a6a10 });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -0.15;
    scene.add(ground);
    objects.push(ground);
  }

  function createChemicalPlant() {
    var mainGeometry = new THREE.BoxGeometry(40, 15, 30);
    var wingGeometry = new THREE.BoxGeometry(20, 15, 20);
    var material = new THREE.MeshStandardMaterial({
      color: 0xb85c2d,
      roughness: 0.8,
      metalness: 0.4
    });

    var mainBuilding = new THREE.Mesh(mainGeometry, material);
    mainBuilding.position.set(-10, 7.5, 0);
    scene.add(mainBuilding);
    objects.push(mainBuilding);

    var wingBuilding = new THREE.Mesh(wingGeometry, material);
    wingBuilding.position.set(15, 7.5, -15);
    scene.add(wingBuilding);
    objects.push(wingBuilding);
  }

  function createStorageTanks() {
    var positions = [
      { x: 30, z: 30 },
      { x: -30, z: 30 },
      { x: 30, z: -30 },
      { x: -30, z: -30 }
    ];

    positions.forEach(function(pos) {
      var cylinderGeometry = new THREE.BoxGeometry(8, 12, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0xc0a020,
        roughness: 0.7,
        metalness: 0.6
      });
      var tank = new THREE.Mesh(cylinderGeometry, material);
      tank.position.set(pos.x, 6, pos.z);
      scene.add(tank);
      objects.push(tank);

      var crossGeometry = new THREE.BoxGeometry(1, 3, 3);
      var biohazardMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      var biohazard = new THREE.Mesh(crossGeometry, biohazardMaterial);
      biohazard.position.set(pos.x, 10, pos.z);
      scene.add(biohazard);
      objects.push(biohazard);
    });
  }

  function createToxicPool() {
    var geometry = new THREE.BoxGeometry(20, 0.2, 15);
    var material = new THREE.MeshStandardMaterial({
      color: 0x00ff44,
      emissive: 0x00ff44,
      emissiveIntensity: 0.5,
      metalness: 0.3
    });
    var pool = new THREE.Mesh(geometry, material);
    pool.position.set(0, 0.2, -40);
    scene.add(pool);
    objects.push(pool);
    animationState.toxicPoolRef = pool;
  }

  function createDecontaminationTent() {
    var tentGeometry = new THREE.BoxGeometry(20, 5, 10);
    var material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6
    });
    var tent = new THREE.Mesh(tentGeometry, material);
    tent.position.set(-50, 2.5, 0);
    scene.add(tent);
    objects.push(tent);

    var pipeGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (var i = 0; i < 4; i++) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.set(-50 + i * 6, 1.5, 0);
      scene.add(pipe);
      objects.push(pipe);
    }

    var grateGeometry = new THREE.BoxGeometry(20, 0.1, 10);
    var grateMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var grate = new THREE.Mesh(grateGeometry, grateMaterial);
    grate.position.set(-50, 0.05, 0);
    scene.add(grate);
    objects.push(grate);
  }

  function createCDCVehicles() {
    var positions = [
      { x: -80, z: -20 },
      { x: -80, z: 0 },
      { x: -80, z: 20 }
    ];

    positions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(8, 6, 15);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 3, pos.z);
      scene.add(body);
      objects.push(body);

      var stripGeometry = new THREE.BoxGeometry(8.2, 0.3, 15);
      var stripMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      var strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.set(pos.x, 5.5, pos.z);
      scene.add(strip);
      objects.push(strip);

      var satGeometry = new THREE.BoxGeometry(2, 2, 2);
      var satMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var sat = new THREE.Mesh(satGeometry, satMaterial);
      sat.position.set(pos.x, 7, pos.z);
      scene.add(sat);
      objects.push(sat);
    });
  }

  function createInfectedWorkers() {
    var positions = [
      { x: 20, z: -50 },
      { x: -20, z: -60 },
      { x: 0, z: -45 },
      { x: 30, z: -55 },
      { x: -40, z: -50 }
    ];

    positions.forEach(function(pos, idx) {
      var bodyGeometry = new THREE.BoxGeometry(2, 4, 1.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6622 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 2, pos.z);
      scene.add(body);
      objects.push(body);
      animationState.workerPositions[idx] = { x: pos.x, z: pos.z, body: body };

      var armGeometry = new THREE.BoxGeometry(0.6, 3, 0.6);
      var armMaterial = new THREE.MeshStandardMaterial({ color: 0x666644 });
      for (var i = 0; i < 2; i++) {
        var arm = new THREE.Mesh(armGeometry, armMaterial);
        arm.position.set(pos.x + (i === 0 ? -1.5 : 1.5), 2.5, pos.z);
        scene.add(arm);
        objects.push(arm);
        if (!animationState.workerPositions[idx].arms) animationState.workerPositions[idx].arms = [];
        animationState.workerPositions[idx].arms.push(arm);
      }
    });
  }

  function createHazmatTeam() {
    var positions = [
      { x: -20, z: 20 },
      { x: -10, z: 25 },
      { x: 0, z: 20 },
      { x: 10, z: 25 }
    ];

    positions.forEach(function(pos) {
      var suitGeometry = new THREE.BoxGeometry(2, 4, 1.5);
      var suitMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
      var suit = new THREE.Mesh(suitGeometry, suitMaterial);
      suit.position.set(pos.x, 2, pos.z);
      scene.add(suit);
      objects.push(suit);

      var helmetGeometry = new THREE.SphereGeometry(0.7, 8, 8);
      var helmetMaterial = new THREE.MeshStandardMaterial({ color: 0xcccc00 });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.set(pos.x, 4, pos.z);
      scene.add(helmet);
      objects.push(helmet);
    });
  }

  function createContainmentBarriers() {
    var positions = [
      { x: 0, z: -25 },
      { x: -15, z: -25 },
      { x: 15, z: -25 }
    ];

    positions.forEach(function(pos) {
      var fenceGeometry = new THREE.BoxGeometry(10, 2, 0.3);
      var fenceMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      var fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.set(pos.x, 1, pos.z);
      scene.add(fence);
      objects.push(fence);

      var stripeGeometry = new THREE.BoxGeometry(10, 0.3, 0.3);
      var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(pos.x, 1.7, pos.z);
      scene.add(stripe);
      objects.push(stripe);
    });
  }

  function createChemicalBarrels() {
    var baseX = 10, baseZ = -35;
    for (var i = 0; i < 6; i++) {
      var barrelGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
      var barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0xdd4400,
        emissive: 0x00ff44,
        emissiveIntensity: 0.3
      });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(baseX + i * 2.5, 1, baseZ + (i % 2) * 2);
      barrel.rotation.z = Math.PI / 4;
      scene.add(barrel);
      objects.push(barrel);
    }
  }

  function createWarningSiren() {
    var poleGeometry = new THREE.BoxGeometry(0.5, 20, 0.5);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-60, 10, -40);
    scene.add(pole);
    objects.push(pole);

    var sirenGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var sirenMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8
    });
    var siren = new THREE.Mesh(sirenGeometry, sirenMaterial);
    siren.position.set(-60, 20, -40);
    scene.add(siren);
    objects.push(siren);
    animationState.sirenRef = siren;
  }

  function createEmergencyShower() {
    var frameGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    var frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame1.position.set(-70, 2, -10);
    scene.add(frame1);
    objects.push(frame1);

    var frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame2.position.set(-60, 2, -10);
    scene.add(frame2);
    objects.push(frame2);

    var crossbarGeometry = new THREE.BoxGeometry(10, 0.3, 0.3);
    var crossbar = new THREE.Mesh(crossbarGeometry, frameMaterial);
    crossbar.position.set(-65, 4, -10);
    scene.add(crossbar);
    objects.push(crossbar);

    for (var i = 0; i < 5; i++) {
      var dropGeometry = new THREE.SphereGeometry(0.2, 4, 4);
      var dropMaterial = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x0088ff,
        emissiveIntensity: 0.6
      });
      var drop = new THREE.Mesh(dropGeometry, dropMaterial);
      drop.position.set(-65 + i * 1.5, 3, -10);
      scene.add(drop);
      objects.push(drop);
    }
  }

  function createInfectedVehicle() {
    var carGeometry = new THREE.BoxGeometry(5, 3, 10);
    var carMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a6633,
      roughness: 0.9
    });
    var car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.set(50, 1.5, -50);
    car.rotation.z = 0.2;
    scene.add(car);
    objects.push(car);

    var windowGeometry = new THREE.BoxGeometry(4, 1.5, 0.1);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x44aa44 });
    var window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(50, 2.5, 5);
    scene.add(window);
    objects.push(window);
  }

  function createEvacuationHelicopter() {
    var bodyGeometry = new THREE.BoxGeometry(6, 3, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(60, 15, 30);
    scene.add(body);
    objects.push(body);
    animationState.helicopterRef = body;
    animationState.helicopterBaseY = 15;

    var rotorGeometry = new THREE.BoxGeometry(20, 0.3, 2);
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(60, 16.5, 30);
    scene.add(rotor);
    objects.push(rotor);
    animationState.rotorRef = rotor;
  }

  function createMonitoringDrone() {
    var bodyGeometry = new THREE.BoxGeometry(2, 1, 2);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var droneBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    droneBody.position.set(0, 8, 0);
    scene.add(droneBody);
    objects.push(droneBody);
    animationState.droneRef = droneBody;

    var armPositions = [
      { x: 1.5, z: 1.5 },
      { x: 1.5, z: -1.5 },
      { x: -1.5, z: 1.5 },
      { x: -1.5, z: -1.5 }
    ];

    armPositions.forEach(function(pos) {
      var armGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
      var armMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
      var arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.position.set(pos.x, 0, pos.z);
      droneBody.add(arm);

      var rotorGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
      var rotorMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        emissive: 0x00ff44,
        emissiveIntensity: 0.4
      });
      var droneRotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      droneRotor.position.set(0, 0.5, 0);
      arm.add(droneRotor);
    });
  }

  function createAirFiltration() {
    var machineGeometry = new THREE.BoxGeometry(8, 6, 8);
    var machineMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.5
    });
    var machine = new THREE.Mesh(machineGeometry, machineMaterial);
    machine.position.set(70, 3, 20);
    scene.add(machine);
    objects.push(machine);

    var fanGeometry = new THREE.BoxGeometry(6, 0.2, 6);
    var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var fan = new THREE.Mesh(fanGeometry, fanMaterial);
    fan.position.set(70, 6.5, 20);
    scene.add(fan);
    objects.push(fan);
    animationState.fanRef = fan;

    var pipeGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(70, 8, 20);
    scene.add(pipe);
    objects.push(pipe);
  }

  function createBioContainmentFoam() {
    var foamPositions = [
      { x: 5, z: -40 },
      { x: -5, z: -40 },
      { x: 10, z: -35 },
      { x: -10, z: -35 }
    ];

    animationState.foamRefs = [];
    foamPositions.forEach(function(pos) {
      var foamGeometry = new THREE.BoxGeometry(6, 0.1, 6);
      var foamMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
      });
      var foam = new THREE.Mesh(foamGeometry, foamMaterial);
      foam.position.set(pos.x, 0.3, pos.z);
      scene.add(foam);
      objects.push(foam);
      animationState.foamRefs.push(foam);
    });
  }

  function setupKeyboardControls() {
    document.addEventListener('keydown', function(e) {
      var key = e.key.toLowerCase();
      if (key === 'h') {
        keyStates.h = true;
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          if (keyStates.z) {
            toggleHUD();
            lastHKeyTime = 0;
          }
        } else {
          lastHKeyTime = now;
        }
      } else if (key === 'z') {
        keyStates.z = true;
        var now2 = Date.now();
        if (now2 - lastHKeyTime < 400) {
          if (keyStates.h) {
            toggleHUD();
            lastHKeyTime = 0;
          }
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      var key = e.key.toLowerCase();
      if (key === 'h') keyStates.h = false;
      if (key === 'z') keyStates.z = false;
    });
  }

  function setupHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'biohazard-hud';
    hudElement.style.position = 'absolute';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.color = '#ffff00';
    hudElement.style.fontSize = '14px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #ffff00';
    hudElement.style.display = 'none';
    hudElement.innerHTML = '' +
      'CONTAMINATION LEVEL: HIGH<br>' +
      'INFECTED: 5<br>' +
      'TEAM STATUS: ACTIVE';
    document.body.appendChild(hudElement);
  }

  function toggleHUD() {
    hudVisible = !hudVisible;
    if (hudElement) {
      hudElement.style.display = hudVisible ? 'block' : 'none';
    }
  }

  function update(delta) {
    if (!scene) return;

    animationState.toxicPulse = (animationState.toxicPulse + delta * 2) % (Math.PI * 2);
    if (animationState.toxicPoolRef) {
      var pulseIntensity = 0.3 + Math.sin(animationState.toxicPulse) * 0.2;
      animationState.toxicPoolRef.material.emissiveIntensity = pulseIntensity;
    }

    animationState.helicopterHeight = (animationState.helicopterHeight + delta * 3) % 100;
    if (animationState.helicopterRef) {
      animationState.helicopterRef.position.y = animationState.helicopterBaseY + animationState.helicopterHeight;
    }
    if (animationState.rotorRef) {
      animationState.rotorRef.rotation.z += delta * 10;
      animationState.rotorRef.position.y = animationState.helicopterBaseY + animationState.helicopterHeight + 1.5;
    }

    animationState.droneAngle = (animationState.droneAngle + delta * 0.5) % (Math.PI * 2);
    if (animationState.droneRef) {
      var orbitRadius = 20;
      animationState.droneRef.position.x = Math.cos(animationState.droneAngle) * orbitRadius;
      animationState.droneRef.position.z = Math.sin(animationState.droneAngle) * orbitRadius;
      var bobbing = Math.sin(Date.now() * 0.001) * 1;
      animationState.droneRef.position.y = 8 + bobbing;
    }

    animationState.sirenRotation = (animationState.sirenRotation + delta * 5) % (Math.PI * 2);
    if (animationState.sirenRef) {
      animationState.sirenRef.rotation.y = animationState.sirenRotation;
      var pulse = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
      animationState.sirenRef.material.emissiveIntensity = pulse;
    }

    animationState.foamShimmer = (animationState.foamShimmer + delta * 1) % (Math.PI * 2);
    if (animationState.foamRefs) {
      animationState.foamRefs.forEach(function(foam) {
        var shimmer = 0.2 + Math.sin(animationState.foamShimmer) * 0.15;
        foam.material.emissiveIntensity = shimmer;
      });
    }

    if (animationState.fanRef) {
      animationState.fanRef.rotation.x += delta * 8;
    }

    animationState.workerPositions.forEach(function(worker, idx) {
      var t = Date.now() * 0.0005 + idx;
      worker.body.position.x = worker.x + Math.sin(t) * 2;
      worker.body.position.z = worker.z + Math.cos(t * 0.7) * 2;

      if (worker.arms && worker.arms.length > 0) {
        worker.arms[0].rotation.z = Math.sin(t * 2) * 0.6;
        worker.arms[1].rotation.z = Math.sin(t * 2 + Math.PI) * 0.6;
      }
    });
  }

  function reset() {
    animationState.helicopterHeight = 0;
    animationState.droneAngle = 0;
    animationState.sirenRotation = 0;
    animationState.toxicPulse = 0;
    animationState.foamShimmer = 0;
    if (animationState.rotorRef) animationState.rotorRef.rotation.z = 0;
    if (animationState.fanRef) animationState.fanRef.rotation.x = 0;
    hudVisible = false;
    if (hudElement) hudElement.style.display = 'none';
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
