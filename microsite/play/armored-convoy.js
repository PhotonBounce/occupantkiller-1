window.ArmoredConvoy = (function() {
  'use strict';

  var scene, camera;
  var elements = {};
  var animationState = {
    helicopterAngle: 0,
    helicopterRotor: 0,
    eodRobotPosition: 0,
    blastPulse: 0,
    insurgentBob: 0,
    weaponsPodRotation: 0
  };
  var hudToggleState = {
    lastH: 0,
    lastV: 0,
    showHud: false
  };

  function createDesertGround() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 400);
    var material = new THREE.MeshPhongMaterial({ color: 0xd4b483 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -0.15;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.desertGround = mesh;
  }

  function createHighwayRoad() {
    var geometry = new THREE.BoxGeometry(8, 0.1, 400);
    var material = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.highwayRoad = mesh;
  }

  function createIEDBlastCrater() {
    var geometry = new THREE.BoxGeometry(15, 0.05, 15);
    var material = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -0.02, 120);
    mesh.receiveShadow = true;
    scene.add(mesh);
    elements.iedCrater = mesh;

    var smokeGeometry = new THREE.SphereGeometry(12, 16, 16);
    var smokeMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600, emissive: 0xff6600 });
    var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(0, 25, 120);
    smoke.material.transparent = true;
    smoke.material.opacity = 0.6;
    scene.add(smoke);
    elements.blastSmoke = smoke;
  }

  function createLeadAPC() {
    var group = new THREE.Group();
    group.position.set(0, 0, 80);

    var bodyGeometry = new THREE.BoxGeometry(3, 2.5, 6);
    var armorMaterial = new THREE.MeshPhongMaterial({ color: 0x2a4a2a });
    var body = new THREE.Mesh(bodyGeometry, armorMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var roofGeometry = new THREE.BoxGeometry(3.2, 0.3, 2);
    var roof = new THREE.Mesh(roofGeometry, armorMaterial);
    roof.position.set(0, 2.65, -1.5);
    roof.castShadow = true;
    group.add(roof);

    var hatchGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    var hatchMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.position.set(0, 2.85, -1.5);
    hatch.castShadow = true;
    group.add(hatch);

    var gunGeometry = new THREE.BoxGeometry(0.4, 0.4, 3.5);
    var gun = new THREE.Mesh(gunGeometry, hatchMaterial);
    gun.position.set(0, 3.2, -1.5);
    gun.castShadow = true;
    group.add(gun);

    var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var wheelPositions = [
      { x: -1.6, z: 1.5 },
      { x: 1.6, z: 1.5 },
      { x: -1.6, z: -1.5 },
      { x: 1.6, z: -1.5 }
    ];
    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.6, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    scene.add(group);
    elements.leadAPC = group;
  }

  function createVIPVehicle() {
    var group = new THREE.Group();
    group.position.set(0, 0, 50);

    var bodyGeometry = new THREE.BoxGeometry(2.2, 2, 4.5);
    var vipMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var body = new THREE.Mesh(bodyGeometry, vipMaterial);
    body.position.y = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var roofGeometry = new THREE.BoxGeometry(2.4, 0.2, 2);
    var roof = new THREE.Mesh(roofGeometry, vipMaterial);
    roof.position.set(0, 2.1, 0);
    roof.castShadow = true;
    group.add(roof);

    var windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x333366 });
    var windowPositions = [
      { x: -1.1, z: 1.2 },
      { x: 1.1, z: 1.2 },
      { x: -1.1, z: -1.2 },
      { x: 1.1, z: -1.2 }
    ];
    windowPositions.forEach(function(pos) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(pos.x, 1.2, pos.z);
      window.castShadow = true;
      group.add(window);
    });

    var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var wheelPositions = [
      { x: -1.1, z: 1.2 },
      { x: 1.1, z: 1.2 },
      { x: -1.1, z: -1.2 },
      { x: 1.1, z: -1.2 }
    ];
    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.5, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    scene.add(group);
    elements.vipVehicle = group;
  }

  function createRearAPC() {
    var group = new THREE.Group();
    group.position.set(0, 0, 0);

    var bodyGeometry = new THREE.BoxGeometry(3, 2.5, 6);
    var armorMaterial = new THREE.MeshPhongMaterial({ color: 0x2a4a2a });
    var body = new THREE.Mesh(bodyGeometry, armorMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var turretGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
    var turretMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 2.8;
    turret.castShadow = true;
    group.add(turret);

    var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var wheelPositions = [
      { x: -1.6, z: 1.5 },
      { x: 1.6, z: 1.5 },
      { x: -1.6, z: -1.5 },
      { x: 1.6, z: -1.5 }
    ];
    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.6, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    scene.add(group);
    elements.rearAPC = group;
  }

  function createEscortHumvees() {
    var humvees = [];
    var positions = [
      { x: -8, z: 40 },
      { x: 8, z: 40 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      var bodyGeometry = new THREE.BoxGeometry(2, 2, 3.5);
      var humveeMaterial = new THREE.MeshPhongMaterial({ color: 0x3a5a3a });
      var body = new THREE.Mesh(bodyGeometry, humveeMaterial);
      body.position.y = 1;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var gunMountGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
      var gunMount = new THREE.Mesh(gunMountGeometry, humveeMaterial);
      gunMount.position.set(0, 2.2, -0.5);
      gunMount.castShadow = true;
      group.add(gunMount);

      var gunBoxGeometry = new THREE.BoxGeometry(0.5, 0.5, 1.5);
      var gunBox = new THREE.Mesh(gunBoxGeometry, humveeMaterial);
      gunBox.position.set(0, 2.8, -1.2);
      gunBox.castShadow = true;
      group.add(gunBox);

      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
      var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
      var wheelPositions = [
        { x: -1, z: 0.8 },
        { x: 1, z: 0.8 },
        { x: -1, z: -0.8 },
        { x: 1, z: -0.8 }
      ];
      wheelPositions.forEach(function(wpos) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wpos.x, 0.5, wpos.z);
        wheel.castShadow = true;
        group.add(wheel);
      });

      scene.add(group);
      humvees.push(group);
    });

    elements.escortHumvees = humvees;
  }

  function createInsurgentFighters() {
    var insurgents = [];
    var positions = [
      { x: -60, z: 100 },
      { x: -70, z: 80 },
      { x: 60, z: 100 },
      { x: 70, z: 80 },
      { x: -65, z: 50 },
      { x: 65, z: 50 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.4);
      var insurgentMaterial = new THREE.MeshPhongMaterial({ color: 0x3d3d1f });
      var body = new THREE.Mesh(bodyGeometry, insurgentMaterial);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);

      var headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      var head = new THREE.Mesh(headGeometry, insurgentMaterial);
      head.position.y = 1.95;
      head.castShadow = true;
      group.add(head);

      var gunGeometry = new THREE.BoxGeometry(0.2, 0.1, 1.2);
      var gunMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(0.3, 1.2, 0);
      gun.rotation.z = Math.PI / 6;
      gun.castShadow = true;
      group.add(gun);

      scene.add(group);
      insurgents.push(group);
    });

    elements.insurgentFighters = insurgents;
  }

  function createConvoySecurityGuards() {
    var guards = [];
    var positions = [
      { x: -2, z: 85 },
      { x: 2, z: 85 },
      { x: -2, z: 30 },
      { x: 2, z: 30 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      var bodyGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.35);
      var guardMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
      var body = new THREE.Mesh(bodyGeometry, guardMaterial);
      body.position.y = 0.9;
      body.castShadow = true;
      group.add(body);

      var headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var head = new THREE.Mesh(headGeometry, guardMaterial);
      head.position.y = 1.9;
      head.castShadow = true;
      group.add(head);

      var gunGeometry = new THREE.BoxGeometry(0.15, 0.1, 1);
      var gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(0.2, 1.1, 0);
      gun.rotation.z = Math.PI / 8;
      gun.castShadow = true;
      group.add(gun);

      scene.add(group);
      guards.push(group);
    });

    elements.convoySecurityGuards = guards;
  }

  function createRockRidges() {
    var ridges = [];
    var positions = [
      { x: -80, z: 100 },
      { x: 80, z: 100 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos.x, 0, pos.z);

      var rockGeometry = new THREE.BoxGeometry(20, 15, 12);
      var rockMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.y = 7.5;
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);

      var rock2Geometry = new THREE.BoxGeometry(16, 12, 10);
      var rock2 = new THREE.Mesh(rock2Geometry, rockMaterial);
      rock2.position.set(8, 6, 5);
      rock2.castShadow = true;
      rock2.receiveShadow = true;
      group.add(rock2);

      scene.add(group);
      ridges.push(group);
    });

    elements.rockRidges = ridges;
  }

  function createSupportHelicopter() {
    var group = new THREE.Group();
    group.position.set(0, 40, 60);

    var fuselageGeometry = new THREE.BoxGeometry(2, 1.5, 5);
    var heloMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a2d });
    var fuselage = new THREE.Mesh(fuselageGeometry, heloMaterial);
    fuselage.castShadow = true;
    group.add(fuselage);

    var tailBoomGeometry = new THREE.BoxGeometry(0.3, 0.3, 3);
    var tail = new THREE.Mesh(tailBoomGeometry, heloMaterial);
    tail.position.set(0, -0.5, 4);
    tail.castShadow = true;
    group.add(tail);

    var mainRotorGeometry = new THREE.BoxGeometry(0.3, 0.1, 12);
    var rotorMaterial = new THREE.MeshPhongMaterial({ color: 0x4a7c4a });
    var mainRotor = new THREE.Mesh(mainRotorGeometry, rotorMaterial);
    mainRotor.position.y = 1;
    mainRotor.castShadow = true;
    group.add(mainRotor);
    elements.mainRotor = mainRotor;

    var tailRotorGeometry = new THREE.BoxGeometry(0.2, 0.05, 2.5);
    var tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
    tailRotor.position.set(0.5, 0.2, 4.5);
    tailRotor.rotation.x = Math.PI / 2;
    tailRotor.castShadow = true;
    group.add(tailRotor);
    elements.tailRotor = tailRotor;

    var podGeometry = new THREE.BoxGeometry(0.5, 0.3, 1.2);
    var podMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var podL = new THREE.Mesh(podGeometry, podMaterial);
    podL.position.set(-1, -0.8, -0.5);
    podL.castShadow = true;
    group.add(podL);
    elements.weaponsPodL = podL;

    var podR = new THREE.Mesh(podGeometry, podMaterial);
    podR.position.set(1, -0.8, -0.5);
    podR.castShadow = true;
    group.add(podR);
    elements.weaponsPodR = podR;

    scene.add(group);
    elements.supportHelicopter = group;
  }

  function createEODRobot() {
    var group = new THREE.Group();
    group.position.set(0, 0.2, 100);

    var chassisGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.6);
    var robotMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    var chassis = new THREE.Mesh(chassisGeometry, robotMaterial);
    chassis.castShadow = true;
    group.add(chassis);

    var wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var wheelPositions = [
      { x: -0.6, z: 0.5 },
      { x: 0.6, z: 0.5 },
      { x: -0.6, z: -0.5 },
      { x: 0.6, z: -0.5 }
    ];
    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.35, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    var armGeometry = new THREE.BoxGeometry(0.15, 0.15, 1.5);
    var arm = new THREE.Mesh(armGeometry, robotMaterial);
    arm.position.set(0.6, 0.5, 1.2);
    arm.rotation.z = Math.PI / 4;
    arm.castShadow = true;
    group.add(arm);
    elements.eodArm = arm;

    var cameraGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    var cameraMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
    var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.position.set(0.7, 0.4, 1.8);
    camera.castShadow = true;
    group.add(camera);

    scene.add(group);
    elements.eodRobot = group;
  }

  function createIEDDevice() {
    var group = new THREE.Group();
    group.position.set(0, 0.3, 120);

    var mainBoxGeometry = new THREE.BoxGeometry(2, 0.8, 1.2);
    var iedMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4033 });
    var mainBox = new THREE.Mesh(mainBoxGeometry, iedMaterial);
    mainBox.castShadow = true;
    group.add(mainBox);

    var wireGeometry = new THREE.BoxGeometry(0.05, 0.05, 3);
    var wireMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.position.z = -1.8;
    wire.castShadow = true;
    group.add(wire);

    var triggerGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var triggerMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
    var trigger = new THREE.Mesh(triggerGeometry, triggerMaterial);
    trigger.position.z = -2.2;
    trigger.castShadow = true;
    group.add(trigger);

    scene.add(group);
    elements.iedDevice = group;
  }

  function createSupplyTruck() {
    var group = new THREE.Group();
    group.position.set(0, 0, -50);

    var bodyGeometry = new THREE.BoxGeometry(2.5, 2.2, 7);
    var truckMaterial = new THREE.MeshPhongMaterial({ color: 0x9b7653 });
    var body = new THREE.Mesh(bodyGeometry, truckMaterial);
    body.position.y = 1.1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var canopyGeometry = new THREE.BoxGeometry(2.7, 1.5, 4);
    var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0xc9a574 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 2.5, -1.5);
    canopy.castShadow = true;
    group.add(canopy);

    var wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
    var wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var wheelPositions = [
      { x: -1.2, z: 2 },
      { x: 1.2, z: 2 },
      { x: -1.2, z: -2 },
      { x: 1.2, z: -2 }
    ];
    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.7, pos.z);
      wheel.castShadow = true;
      group.add(wheel);
    });

    scene.add(group);
    elements.supplyTruck = group;
  }

  function createRoadsideSandbags() {
    var group = new THREE.Group();
    group.position.set(0, 0, 110);

    var bagGeometry = new THREE.BoxGeometry(2, 0.5, 0.6);
    var bagMaterial = new THREE.MeshPhongMaterial({ color: 0xc9a574 });

    var positions = [
      { x: -5, z: 0 },
      { x: -2.5, z: 0 },
      { x: 0, z: 0 },
      { x: 2.5, z: 0 },
      { x: 5, z: 0 }
    ];

    positions.forEach(function(pos) {
      var bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(pos.x, 0.25, pos.z);
      bag.castShadow = true;
      bag.receiveShadow = true;
      group.add(bag);
    });

    scene.add(group);
    elements.roadsideSandbags = group;
  }

  function createSmokeSignal() {
    var group = new THREE.Group();
    group.position.set(-5, 8, 75);

    var smokeGeometry = new THREE.SphereGeometry(1.5, 12, 12);
    var smokeMaterial = new THREE.MeshBasicMaterial({ color: 0x00cc00, emissive: 0x00cc00 });
    smokeMaterial.transparent = true;
    smokeMaterial.opacity = 0.7;

    var spheres = [];
    var offsets = [
      { x: 0, y: 0, z: 0 },
      { x: 1.2, y: 1, z: 0.5 },
      { x: -1.2, y: 1, z: -0.5 }
    ];

    offsets.forEach(function(offset) {
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
      smoke.position.set(offset.x, offset.y, offset.z);
      group.add(smoke);
      spheres.push(smoke);
    });

    scene.add(group);
    elements.smokeSignal = group;
    elements.smokeSignalSpheres = spheres;
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('CONVOY STATUS: AMBUSHED', 10, 30);
    ctx.fillText('VIP: SECURE', 10, 55);
    ctx.fillText('EOD: ACTIVE', 10, 80);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#ff9900';
    ctx.fillText('H+V to toggle', 10, 110);

    var texture = new THREE.CanvasTexture(canvas);
    var geometry = new THREE.BoxGeometry(4, 2, 0.01);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    material.transparent = true;
    var hud = new THREE.Mesh(geometry, material);
    hud.position.set(-8, 8, -10);
    camera.add(hud);
    elements.hud = hud;
  }

  function updateAnimations(delta) {
    animationState.helicopterAngle += delta * 0.3;
    animationState.helicopterRotor += delta * 20;
    animationState.eodRobotPosition += delta * 0.5;
    animationState.blastPulse += delta * 2;
    animationState.insurgentBob += delta * 3;
    animationState.weaponsPodRotation += delta * 1.2;

    if (elements.supportHelicopter) {
      elements.supportHelicopter.position.x = Math.sin(animationState.helicopterAngle) * 50;
      elements.supportHelicopter.position.z = 60 + Math.cos(animationState.helicopterAngle) * 30;

      if (elements.mainRotor) {
        elements.mainRotor.rotation.y = animationState.helicopterRotor;
      }
      if (elements.tailRotor) {
        elements.tailRotor.rotation.z = animationState.helicopterRotor * 4;
      }
      if (elements.weaponsPodL) {
        elements.weaponsPodL.rotation.y = Math.sin(animationState.weaponsPodRotation) * 0.3;
      }
      if (elements.weaponsPodR) {
        elements.weaponsPodR.rotation.y = Math.sin(animationState.weaponsPodRotation) * 0.3;
      }
    }

    if (elements.eodRobot) {
      elements.eodRobot.position.z = 100 + animationState.eodRobotPosition * 2;
      if (animationState.eodRobotPosition > 8) {
        animationState.eodRobotPosition = 0;
      }
    }

    if (elements.blastSmoke) {
      var pulseScale = 1 + Math.sin(animationState.blastPulse) * 0.3;
      elements.blastSmoke.scale.set(pulseScale, pulseScale, pulseScale);
    }

    if (elements.insurgentFighters) {
      elements.insurgentFighters.forEach(function(fighter) {
        fighter.position.y = Math.sin(animationState.insurgentBob) * 0.15;
      });
    }
  }

  function handleHUDToggle(key) {
    var now = Date.now();
    if (key === 'h') {
      hudToggleState.lastH = now;
    } else if (key === 'v') {
      hudToggleState.lastV = now;
    }

    if (Math.abs(hudToggleState.lastH - hudToggleState.lastV) < 400 &&
        hudToggleState.lastH !== 0 && hudToggleState.lastV !== 0) {
      hudToggleState.showHud = !hudToggleState.showHud;
      if (elements.hud) {
        elements.hud.visible = hudToggleState.showHud;
      }
      hudToggleState.lastH = 0;
      hudToggleState.lastV = 0;
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    createDesertGround();
    createHighwayRoad();
    createIEDBlastCrater();
    createLeadAPC();
    createVIPVehicle();
    createRearAPC();
    createEscortHumvees();
    createInsurgentFighters();
    createConvoySecurityGuards();
    createRockRidges();
    createSupportHelicopter();
    createEODRobot();
    createIEDDevice();
    createSupplyTruck();
    createRoadsideSandbags();
    createSmokeSignal();
    createHUD();

    document.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'h' || event.key.toLowerCase() === 'v') {
        handleHUDToggle(event.key.toLowerCase());
      }
    });

    elements.hud.visible = false;
  }

  function update(delta) {
    updateAnimations(delta);
  }

  function reset() {
    Object.keys(elements).forEach(function(key) {
      var element = elements[key];
      if (element && element.parent) {
        element.parent.remove(element);
      }
    });
    elements = {};
    animationState = {
      helicopterAngle: 0,
      helicopterRotor: 0,
      eodRobotPosition: 0,
      blastPulse: 0,
      insurgentBob: 0,
      weaponsPodRotation: 0
    };
    hudToggleState = {
      lastH: 0,
      lastV: 0,
      showHud: false
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
