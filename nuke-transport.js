var window = window || {};

window.NukeTransport = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var animatingObjects = [];
  var hudElement = null;
  var gameState = {
    convoyProgress: 0,
    maxProgress: 100,
    interceptAttempts: 0,
    maxInterceptAttempts: 5,
    warningLevel: 0,
    detonationCycleTime: 0,
    helicopterAltitude: 8
  };
  var elapsedTime = 0;
  var lastHKeyTime = 0;
  var hudVisible = true;

  // Create highway road surface
  function createHighway() {
    var roadGeometry = new THREE.BoxGeometry(12, 0.2, 80);
    var roadMaterial = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.9 });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(0, 0.1, 0);
    road.receiveShadow = true;
    scene.add(road);
    sceneObjects.push(road);

    // Road center line (using LineSegments)
    var lineGeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array();
    for (var i = -40; i <= 40; i += 2) {
      vertices = new Float32Array([
        -6, 0.15, i,
        6, 0.15, i
      ]);
    }
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 1 });
    var centerLine = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(centerLine);
    sceneObjects.push(centerLine);

    // Road edges
    var edgeGeometry = new THREE.BoxGeometry(0.2, 0.1, 80);
    var edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x666655 });

    var edgeLeft = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeLeft.position.set(-6.2, 0.15, 0);
    edgeLeft.receiveShadow = true;
    scene.add(edgeLeft);
    sceneObjects.push(edgeLeft);

    var edgeRight = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edgeRight.position.set(6.2, 0.15, 0);
    edgeRight.receiveShadow = true;
    scene.add(edgeRight);
    sceneObjects.push(edgeRight);
  }

  // Create armored transport truck with nuke container
  function createArmoredTruck() {
    var group = new THREE.Group();

    // Truck cab (front box)
    var cabGeometry = new THREE.BoxGeometry(2.2, 2.5, 3);
    var greenMaterial = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.7 });
    var cab = new THREE.Mesh(cabGeometry, greenMaterial);
    cab.position.set(0, 1.3, 2);
    cab.castShadow = true;
    cab.receiveShadow = true;
    group.add(cab);

    // Truck trailer (long cargo box)
    var trailerGeometry = new THREE.BoxGeometry(2.4, 3.5, 8);
    var armorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var trailer = new THREE.Mesh(trailerGeometry, armorMaterial);
    trailer.position.set(0, 1.8, -2);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    group.add(trailer);

    // Nuke container (cylindrical with red warning color)
    var nukeGeometry = new THREE.CylinderGeometry(0.9, 0.9, 4, 16);
    var nukeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, metalness: 0.8, roughness: 0.3 });
    var nukeContainer = new THREE.Mesh(nukeGeometry, nukeMaterial);
    nukeContainer.position.set(0, 2.5, -2);
    nukeContainer.rotation.z = Math.PI / 2;
    nukeContainer.castShadow = true;
    nukeContainer.receiveShadow = true;
    group.add(nukeContainer);

    // Radiation warning decals (small yellow spheres on container)
    for (var i = 0; i < 4; i++) {
      var warningGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var warningMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        emissive: 0xFFDD00,
        emissiveIntensity: 0.6
      });
      var warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.position.set((i % 2 === 0) ? -0.7 : 0.7, 2.5, -2 + (i - 1.5) * 1.2);
      group.add(warning);
    }

    // Wheels (cylinders)
    var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    var wheelPositions = [
      [-1, 0.5, 3],
      [1, 0.5, 3],
      [-1, 0.5, 1],
      [1, 0.5, 1],
      [-1, 0.5, -1],
      [1, 0.5, -1],
      [-1, 0.5, -4],
      [1, 0.5, -4]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    group.position.set(0, 0, -20);
    group.truckData = {
      z: -20,
      speed: 0.15,
      maxZ: 50,
      minZ: -40
    };

    scene.add(group);
    sceneObjects.push(group);
    animatingObjects.push(group);
    return group;
  }

  // Create military escort jeeps
  function createEscortJeep() {
    var group = new THREE.Group();

    // Jeep body
    var bodyGeometry = new THREE.BoxGeometry(1.6, 1.8, 3);
    var greenMaterial = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.7 });
    var body = new THREE.Mesh(bodyGeometry, greenMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Gun turret (small cylinder on top)
    var turretGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(0, 2.2, 0);
    turret.castShadow = true;
    turret.receiveShadow = true;
    group.add(turret);

    // Gun barrel (thin cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    var barrel = new THREE.Mesh(barrelGeometry, turretMaterial);
    barrel.position.set(0, 2.5, 0.8);
    barrel.rotation.x = 0.2;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    // Wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    var wheelPositions = [
      [-0.7, 0.4, -0.8],
      [0.7, 0.4, -0.8],
      [-0.7, 0.4, 0.8],
      [0.7, 0.4, 0.8]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    return group;
  }

  // Create escort formation (3 jeeps)
  function createEscortVehicles() {
    var positions = [
      { x: -5, z: -10 },
      { x: 5, z: -15 },
      { x: -5, z: -25 }
    ];

    positions.forEach(function(pos) {
      var jeep = createEscortJeep();
      jeep.position.set(pos.x, 0, pos.z);
      jeep.escortData = {
        baseZ: pos.z,
        oscillation: 0,
        speed: 0.15
      };
      scene.add(jeep);
      sceneObjects.push(jeep);
      animatingObjects.push(jeep);
    });
  }

  // Create concrete roadblock barriers
  function createRoadblocks() {
    var positions = [
      { x: -4, z: 15 },
      { x: 4, z: 15 },
      { x: -3, z: 30 },
      { x: 3, z: 30 },
      { x: -4, z: 45 },
      { x: 4, z: 45 }
    ];

    positions.forEach(function(pos) {
      var blockGeometry = new THREE.BoxGeometry(1.8, 1.2, 0.8);
      var blockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
      var block = new THREE.Mesh(blockGeometry, blockMaterial);
      block.position.set(pos.x, 0.6, pos.z);
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);
      sceneObjects.push(block);
    });
  }

  // Create overpass bridge structure
  function createOverpass() {
    var group = new THREE.Group();

    // Left support pillar
    var pillarGeometry = new THREE.BoxGeometry(0.6, 6, 0.6);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });

    var pillarLeft = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarLeft.position.set(-5, 3, 35);
    pillarLeft.castShadow = true;
    pillarLeft.receiveShadow = true;
    group.add(pillarLeft);

    var pillarRight = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarRight.position.set(5, 3, 35);
    pillarRight.castShadow = true;
    pillarRight.receiveShadow = true;
    group.add(pillarRight);

    // Bridge deck (horizontal box)
    var deckGeometry = new THREE.BoxGeometry(11, 0.4, 8);
    var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 6.2, 35);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Bridge railings
    var railGeometry = new THREE.BoxGeometry(0.15, 1, 8);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });

    var railLeft = new THREE.Mesh(railGeometry, railMaterial);
    railLeft.position.set(-5.5, 6.7, 35);
    railLeft.castShadow = true;
    railLeft.receiveShadow = true;
    group.add(railLeft);

    var railRight = new THREE.Mesh(railGeometry, railMaterial);
    railRight.position.set(5.5, 6.7, 35);
    railRight.castShadow = true;
    railRight.receiveShadow = true;
    group.add(railRight);

    scene.add(group);
    sceneObjects.push(group);
  }

  // Create helicopter overhead
  function createHelicopter() {
    var group = new THREE.Group();

    // Helicopter body
    var bodyGeometry = new THREE.BoxGeometry(1.5, 1, 3.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.7 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Tail boom (thin box)
    var tailGeometry = new THREE.BoxGeometry(0.2, 0.2, 2.5);
    var tailMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
    var tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.3, -2);
    tail.castShadow = true;
    tail.receiveShadow = true;
    group.add(tail);

    // Main rotor disk (large disk)
    var rotorGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 8);
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.y = 1.5;
    rotor.receiveShadow = true;
    group.add(rotor);

    // Tail rotor (small disk)
    var tailRotorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 8);
    var tailRotor = new THREE.Mesh(tailRotorGeometry, rotorMaterial);
    tailRotor.position.set(0, 0.8, -2);
    group.add(tailRotor);

    // Landing skids
    var skidGeometry = new THREE.BoxGeometry(0.1, 0.1, 3.5);
    var skidMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });

    var skidLeft = new THREE.Mesh(skidGeometry, skidMaterial);
    skidLeft.position.set(-0.8, -0.2, 0);
    group.add(skidLeft);

    var skidRight = new THREE.Mesh(skidGeometry, skidMaterial);
    skidRight.position.set(0.8, -0.2, 0);
    group.add(skidRight);

    group.position.set(8, 8, 10);
    group.helicopterData = {
      rotorRotation: 0,
      tailRotorRotation: 0,
      bobbing: 0,
      baseY: 8
    };

    scene.add(group);
    sceneObjects.push(group);
    animatingObjects.push(group);
    return group;
  }

  // Create roadside cover (rocks and ditches)
  function createRoadsideCover() {
    // Ditch on left side
    var ditchGeometry = new THREE.BoxGeometry(2, 0.3, 40);
    var ditchMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 });
    var ditchLeft = new THREE.Mesh(ditchGeometry, ditchMaterial);
    ditchLeft.position.set(-8, -0.1, 0);
    ditchLeft.receiveShadow = true;
    scene.add(ditchLeft);
    sceneObjects.push(ditchLeft);

    var ditchRight = new THREE.Mesh(ditchGeometry, ditchMaterial);
    ditchRight.position.set(8, -0.1, 0);
    ditchRight.receiveShadow = true;
    scene.add(ditchRight);
    sceneObjects.push(ditchRight);

    // Rock covers scattered
    var rockPositions = [
      { x: -7, z: 5 },
      { x: 7, z: 10 },
      { x: -7, z: 20 },
      { x: 7, z: 25 },
      { x: -7, z: 40 },
      { x: 7, z: 45 }
    ];

    rockPositions.forEach(function(pos) {
      var rockGeometry = new THREE.SphereGeometry(1, 8, 8);
      var rockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(pos.x, 0.8, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      sceneObjects.push(rock);
    });
  }

  // Create military checkpoint
  function createCheckpoint() {
    // Guard booth (small box)
    var boothGeometry = new THREE.BoxGeometry(2, 2.5, 2);
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.7 });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(-4, 1.25, -30);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);
    sceneObjects.push(booth);

    // Gate pole (thin cylinder)
    var gateGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(4, 1.75, -30);
    gate.castShadow = true;
    gate.receiveShadow = true;
    scene.add(gate);
    sceneObjects.push(gate);

    // Gate arm (horizontal box)
    var armGeometry = new THREE.BoxGeometry(8, 0.2, 0.3);
    var arm = new THREE.Mesh(armGeometry, gateMaterial);
    arm.position.set(0, 3.3, -30);
    arm.castShadow = true;
    arm.receiveShadow = true;
    scene.add(arm);
    sceneObjects.push(arm);
  }

  // Create flare signals
  function createFlareSignals() {
    var positions = [
      { x: -3, z: 5 },
      { x: 3, z: 12 },
      { x: -3, z: 22 },
      { x: 3, z: 35 },
      { x: -3, z: 48 }
    ];

    positions.forEach(function(pos) {
      var flareGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var flareMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        emissive: 0xFFDD00,
        emissiveIntensity: 0.8
      });
      var flare = new THREE.Mesh(flareGeometry, flareMaterial);
      flare.position.set(pos.x, 2, pos.z);
      flare.flareData = {
        oscillation: 0,
        speed: 3
      };
      scene.add(flare);
      sceneObjects.push(flare);
      animatingObjects.push(flare);
    });
  }

  // Create crashed civilian car
  function createCrashedCar() {
    var group = new THREE.Group();

    // Car body (damaged box)
    var bodyGeometry = new THREE.BoxGeometry(1.8, 1.5, 4);
    var carMaterial = new THREE.MeshStandardMaterial({ color: 0xCC0000, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeometry, carMaterial);
    body.position.y = 0.7;
    body.rotation.z = 0.3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    var wheelPositions = [
      [-0.6, 0.35, -1],
      [0.6, 0.35, -1],
      [-0.6, 0.35, 1],
      [0.6, 0.35, 1]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    group.position.set(6, 0, 20);
    scene.add(group);
    sceneObjects.push(group);
  }

  // Create guard tower
  function createGuardTower() {
    var group = new THREE.Group();

    // Tower base (tall box)
    var baseGeometry = new THREE.BoxGeometry(1, 8, 1);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 4;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Tower platform (box at top)
    var platformGeometry = new THREE.BoxGeometry(1.8, 0.3, 1.8);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 8.15;
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Guard cabin (small box)
    var cabinGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x556644, roughness: 0.7 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 8.8, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Searchlight (cylinder)
    var lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.5 });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 9.3;
    light.castShadow = true;
    light.receiveShadow = true;
    group.add(light);

    group.position.set(-9, 0, 28);
    scene.add(group);
    sceneObjects.push(group);
  }

  // Create detonation console
  function createDetonationConsole() {
    var group = new THREE.Group();

    // Console base (box)
    var baseGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.9;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Display screen (small box)
    var screenGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x00FF00, emissiveIntensity: 0.6 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 1.5, 0.35);
    screen.castShadow = true;
    screen.receiveShadow = true;
    group.add(screen);

    // Countdown indicator (red sphere)
    var indicatorGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    var indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.7
    });
    var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(-0.3, 1.2, 0.4);
    group.add(indicator);

    // Button panel (small box with bumps)
    var buttonGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.1);
    var buttonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6 });
    var buttons = new THREE.Mesh(buttonGeometry, buttonMaterial);
    buttons.position.set(0, 0.8, 0.35);
    buttons.castShadow = true;
    buttons.receiveShadow = true;
    group.add(buttons);

    group.consoleData = {
      countdown: 0,
      blinkPhase: 0
    };

    group.position.set(9, 0, -35);
    scene.add(group);
    sceneObjects.push(group);
    animatingObjects.push(group);
    return group;
  }

  // Update convoy movement
  function updateConvoy(delta) {
    animatingObjects.forEach(function(obj) {
      if (obj.truckData) {
        obj.truckData.z += obj.truckData.speed;
        if (obj.truckData.z > obj.truckData.maxZ) {
          obj.truckData.z = obj.truckData.minZ;
        }
        obj.position.z = obj.truckData.z;
        gameState.convoyProgress = Math.min(100, (obj.truckData.z + 40) * 1.25);
      }
    });
  }

  // Update escort vehicles (oscillating movement)
  function updateEscortVehicles(delta) {
    animatingObjects.forEach(function(obj) {
      if (obj.escortData) {
        obj.escortData.oscillation += 0.03;
        obj.position.z = obj.escortData.baseZ + obj.escortData.speed * 40;
        obj.position.x += Math.sin(obj.escortData.oscillation) * 0.02;
      }
    });
  }

  // Update helicopter rotation and bobbing
  function updateHelicopter(delta) {
    animatingObjects.forEach(function(obj) {
      if (obj.helicopterData) {
        var data = obj.helicopterData;
        data.rotorRotation += 0.4;
        data.tailRotorRotation += 0.8;
        data.bobbing += 0.02;

        // Update rotor
        for (var i = 0; i < obj.children.length; i++) {
          var child = obj.children[i];
          if (child.geometry && (child.geometry.type === 'CylinderGeometry')) {
            if (child.position.y > 1) {
              child.rotation.y = data.rotorRotation;
            } else if (child.position.z < -1) {
              child.rotation.y = data.tailRotorRotation;
            }
          }
        }

        // Bobbing motion
        obj.position.y = data.baseY + Math.sin(data.bobbing) * 0.3;
      }
    });
  }

  // Update flare signals (blinking)
  function updateFlareSignals(delta) {
    animatingObjects.forEach(function(obj) {
      if (obj.flareData) {
        var data = obj.flareData;
        data.oscillation += data.speed * delta;

        // Blinking effect
        var blink = (Math.sin(elapsedTime * 3) + 1) * 0.5;
        if (obj.material) {
          obj.material.emissiveIntensity = 0.4 + blink * 0.4;
        }
      }
    });
  }

  // Update detonation console
  function updateDetonationConsole(delta) {
    animatingObjects.forEach(function(obj) {
      if (obj.consoleData) {
        var data = obj.consoleData;
        data.countdown += delta * 0.5;
        data.blinkPhase += 0.05;

        // Blink the indicator light
        for (var i = 0; i < obj.children.length; i++) {
          var child = obj.children[i];
          if (child.geometry && child.geometry.type === 'SphereGeometry') {
            var blink = Math.sin(data.blinkPhase) > 0 ? 1 : 0.2;
            child.material.emissiveIntensity = blink * 0.7;
          }
        }
      }
    });
  }

  // Update HUD display
  function updateHUD() {
    if (!hudElement) return;

    var progressBar = '';
    var filled = Math.floor(gameState.convoyProgress / 5);
    for (var i = 0; i < 20; i++) {
      progressBar += (i < filled) ? '█' : '░';
    }

    var hudText = 'CONVOY PROGRESS: [' + progressBar + '] ' + Math.floor(gameState.convoyProgress) + '%\n' +
                  'INTERCEPT ATTEMPTS: ' + gameState.interceptAttempts + '/' + gameState.maxInterceptAttempts + '\n' +
                  'WARNING LEVEL: ' + gameState.warningLevel + '\n' +
                  'DETONATION CIRCUIT: ' + Math.floor(gameState.detonationCycleTime) + 's';

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  // Create HUD
  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'nuke-transport-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #FF0000; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #FF0000; ' +
                                  'z-index: 100; text-shadow: 0 0 10px #FF0000;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  // Setup key listener
  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'h' || event.key.toLowerCase() === 'H') {
        if (now - lastHKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #FF0000; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #FF0000; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastHKeyTime = now;
      }
    });
  }

  // Initialize module
  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.04);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Create all scene objects
    createHighway();
    createRoadsideCover();
    createCheckpoint();
    createGuardTower();
    var truck = createArmoredTruck();
    createEscortVehicles();
    createRoadblocks();
    createOverpass();
    createHelicopter();
    createFlareSignals();
    createCrashedCar();
    createDetonationConsole();

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  // Update module
  function update(delta) {
    elapsedTime += delta;
    gameState.detonationCycleTime = (elapsedTime % 60);
    gameState.warningLevel = Math.floor((gameState.convoyProgress / 100) * 5);

    updateConvoy(delta);
    updateEscortVehicles(delta);
    updateHelicopter(delta);
    updateFlareSignals(delta);
    updateDetonationConsole(delta);
    updateHUD();
  }

  // Reset module
  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    lights.forEach(function(light) {
      scene.remove(light);
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    animatingObjects = [];
    lights = [];
    gameState.convoyProgress = 0;
    gameState.interceptAttempts = 0;
    gameState.warningLevel = 0;
    gameState.detonationCycleTime = 0;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
