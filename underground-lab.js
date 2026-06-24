var window = window || {};

window.UndergroundLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var hudElement = null;
  var elapsedTime = 0;
  var hudVisible = true;
  var lastAKeyTime = 0;
  var lastMKeyTime = 0;

  var gameState = {
    specimensCaptured: 0,
    dataDownloaded: 0,
    securityLevel: 5,
    timeInLab: 0
  };

  var animationState = {
    specimenTanks: [],
    emergencyLights: [],
    ventilationFans: [],
    securityDoors: [],
    dataScreens: []
  };

  function createFloor() {
    var floorGeometry = new THREE.BoxGeometry(50, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.6, metalness: 0.2 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    floor.castShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function createWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.7, metalness: 0.1 });

    var wallPositions = [
      { x: 0, z: -25, width: 50, height: 5, depth: 1 },
      { x: 0, z: 25, width: 50, height: 5, depth: 1 },
      { x: -25, z: 0, width: 1, height: 5, depth: 50 },
      { x: 25, z: 0, width: 1, height: 5, depth: 50 }
    ];

    wallPositions.forEach(function(pos) {
      var wallGeometry = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos.x, pos.height / 2, pos.z);
      wall.receiveShadow = true;
      wall.castShadow = true;
      scene.add(wall);
      sceneObjects.push(wall);
    });
  }

  function createCeiling() {
    var ceilingGeometry = new THREE.BoxGeometry(50, 0.5, 50);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.6, metalness: 0.15 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 5;
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;
    scene.add(ceiling);
    sceneObjects.push(ceiling);
  }

  function createLabBench() {
    var group = new THREE.Group();

    var benchGeometry = new THREE.BoxGeometry(3, 1, 1);
    var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B8B8B, roughness: 0.5, metalness: 0.4 });
    var bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.y = 0.5;
    bench.castShadow = true;
    bench.receiveShadow = true;
    group.add(bench);

    var legGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.5 });

    var legPositions = [
      [-1.2, 0.25, -0.3],
      [1.2, 0.25, -0.3],
      [-1.2, 0.25, 0.3],
      [1.2, 0.25, 0.3]
    ];

    legPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });

    return group;
  }

  function createSpecimenTank(position, glowColor) {
    var group = new THREE.Group();

    var cylGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.8
    });
    var cylinder = new THREE.Mesh(cylGeometry, tankMaterial);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    group.add(cylinder);

    var topGeometry = new THREE.SphereGeometry(0.6, 16, 8);
    var topMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.5 });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1;
    top.scale.z = 0.3;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    var bottomGeometry = new THREE.SphereGeometry(0.6, 16, 8);
    var bottom = new THREE.Mesh(bottomGeometry, topMaterial);
    bottom.position.y = -1;
    bottom.scale.z = 0.3;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    group.add(bottom);

    var contentGeometry = new THREE.CylinderGeometry(0.55, 0.55, 1.8, 16);
    var contentMaterial = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7
    });
    var content = new THREE.Mesh(contentGeometry, contentMaterial);
    content.position.y = 0;
    content.castShadow = true;
    group.add(content);

    group.position.set(position.x, position.y, position.z);
    group.tankData = {
      baseColor: glowColor,
      bubblePhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2
    };

    scene.add(group);
    sceneObjects.push(group);
    animationState.specimenTanks.push(group);
    return group;
  }

  function createServerRack(position) {
    var group = new THREE.Group();

    var rackGeometry = new THREE.BoxGeometry(0.8, 2.5, 0.6);
    var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.castShadow = true;
    rack.receiveShadow = true;
    group.add(rack);

    for (var i = 0; i < 5; i++) {
      var serverGeometry = new THREE.BoxGeometry(0.7, 0.35, 0.5);
      var serverMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.6 });
      var server = new THREE.Mesh(serverGeometry, serverMaterial);
      server.position.y = -0.9 + (i * 0.5);
      server.castShadow = true;
      server.receiveShadow = true;
      group.add(server);

      var ledGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.01);
      var ledColor = (Math.random() > 0.6) ? 0x00FF00 : 0xFF0000;
      var ledMaterial = new THREE.MeshStandardMaterial({ color: ledColor, emissive: ledColor, emissiveIntensity: 0.8 });
      var led = new THREE.Mesh(ledGeometry, ledMaterial);
      led.position.set(0.25, -0.9 + (i * 0.5), 0.27);
      group.add(led);
    }

    group.position.set(position.x, position.y, position.z);
    group.serverData = { index: Math.random() };
    scene.add(group);
    sceneObjects.push(group);
    animationState.dataScreens.push(group);
    return group;
  }

  function createSecurityDoor(position) {
    var group = new THREE.Group();

    var frameGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    var doorGeometry = new THREE.BoxGeometry(1.8, 2.8, 0.15);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.7 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.x = -0.5;
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    var handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.5, 0.3, 0.15);
    handle.castShadow = true;
    group.add(handle);

    var scannerGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
    var scannerMaterial = new THREE.MeshStandardMaterial({ color: 0x0088FF, roughness: 0.5, metalness: 0.5 });
    var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scanner.position.set(0.7, 0, 0.15);
    scanner.castShadow = true;
    group.add(scanner);

    group.position.set(position.x, position.y, position.z);
    group.doorData = {
      isOpen: false,
      openAmount: 0,
      proximityTrigger: 5
    };
    scene.add(group);
    sceneObjects.push(group);
    animationState.securityDoors.push(group);
    return group;
  }

  function createEmergencyLight(position) {
    var group = new THREE.Group();

    var cageGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
    var cageMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
    var cage = new THREE.Mesh(cageGeometry, cageMaterial);
    cage.castShadow = true;
    cage.receiveShadow = true;
    group.add(cage);

    var bulbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.7
    });
    var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.y = 0.1;
    group.add(bulb);

    group.position.set(position.x, position.y, position.z);
    group.lightData = {
      baseIntensity: 0.7,
      flickerPhase: Math.random() * Math.PI * 2,
      bulb: bulb
    };

    var pointLight = new THREE.PointLight(0xFF0000, 0.7, 10);
    pointLight.position.copy(position);
    pointLight.position.y += 0.1;
    pointLight.castShadow = true;
    scene.add(pointLight);
    group.lightData.light = pointLight;

    scene.add(group);
    sceneObjects.push(group);
    animationState.emergencyLights.push(group);
    return group;
  }

  function createVentilationDuct(position) {
    var group = new THREE.Group();

    var mainDuctGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.6 });
    var mainDuct = new THREE.Mesh(mainDuctGeometry, ductMaterial);
    mainDuct.rotation.z = Math.PI / 2;
    mainDuct.castShadow = true;
    mainDuct.receiveShadow = true;
    group.add(mainDuct);

    var fanGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12);
    var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.7 });
    var fan = new THREE.Mesh(fanGeometry, fanMaterial);
    fan.rotation.z = Math.PI / 2;
    fan.position.z = 1.8;
    fan.castShadow = true;
    fan.receiveShadow = true;
    group.add(fan);

    var bladeGeometry = new THREE.BoxGeometry(0.6, 0.08, 0.08);
    var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.6 });

    for (var i = 0; i < 3; i++) {
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = (i * Math.PI * 2) / 3;
      blade.position.z = 1.8;
      blade.castShadow = true;
      blade.receiveShadow = true;
      group.add(blade);
    }

    group.position.set(position.x, position.y, position.z);
    group.ductData = {
      rotation: 0,
      speed: 0.15
    };
    scene.add(group);
    sceneObjects.push(group);
    animationState.ventilationFans.push(group);
    return group;
  }

  function createHazmatLocker(position) {
    var group = new THREE.Group();

    var caseGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    var caseMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.6, metalness: 0.4 });
    var case_ = new THREE.Mesh(caseGeometry, caseMaterial);
    case_.castShadow = true;
    case_.receiveShadow = true;
    group.add(case_);

    var stripeGeometry = new THREE.BoxGeometry(0.05, 1.2, 0.5);
    var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5, metalness: 0.3 });

    for (var i = -3; i <= 3; i++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.x = i * 0.15;
      stripe.castShadow = true;
      group.add(stripe);
    }

    var lockGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    var lockMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
    var lock = new THREE.Mesh(lockGeometry, lockMaterial);
    lock.position.y = -0.4;
    lock.castShadow = true;
    group.add(lock);

    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createControlPanel(position) {
    var group = new THREE.Group();

    var panelGeometry = new THREE.BoxGeometry(1.5, 1, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.6 });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    for (var i = 0; i < 6; i++) {
      var buttonGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
      var buttonColor = [0xFF0000, 0x00FF00, 0x0088FF, 0xFFFF00, 0xFF00FF, 0xFFAA00][i];
      var buttonMaterial = new THREE.MeshStandardMaterial({
        color: buttonColor,
        emissive: buttonColor,
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.5
      });
      var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(-0.5 + (i % 3) * 0.5, 0.2 - Math.floor(i / 3) * 0.4, 0.2);
      button.castShadow = true;
      group.add(button);
    }

    var screenGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.05);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x001122, roughness: 0.3, metalness: 0.4 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.y = -0.2;
    screen.position.z = 0.2;
    screen.castShadow = true;
    group.add(screen);

    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createRadiationSign(position) {
    var group = new THREE.Group();

    var postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.6 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    var signGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    var signMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.6, metalness: 0.3 });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 0.8, 0.05);
    sign.castShadow = true;
    group.add(sign);

    var symbolGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16);
    var symbolMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.8, metalness: 0.2 });
    var symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    symbol.position.set(0, 0.8, 0.1);
    symbol.castShadow = true;
    group.add(symbol);

    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEscapeTunnel(position) {
    var group = new THREE.Group();

    var tunnelGeometry = new THREE.CylinderGeometry(1, 1, 6, 16);
    var tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.7, metalness: 0.2 });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.rotation.z = Math.PI / 2;
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    group.add(tunnel);

    var gateGeometry = new THREE.BoxGeometry(1.8, 1.8, 0.3);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.7 });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.z = 3;
    gate.castShadow = true;
    gate.receiveShadow = true;
    group.add(gate);

    group.position.set(position.x, position.y, position.z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEnvironment() {
    createFloor();
    createWalls();
    createCeiling();

    var labBench1 = createLabBench();
    labBench1.position.set(-10, 0.5, -5);
    scene.add(labBench1);
    sceneObjects.push(labBench1);

    var labBench2 = createLabBench();
    labBench2.position.set(10, 0.5, -5);
    scene.add(labBench2);
    sceneObjects.push(labBench2);

    var labBench3 = createLabBench();
    labBench3.position.set(0, 0.5, 10);
    scene.add(labBench3);
    sceneObjects.push(labBench3);

    createSpecimenTank({ x: -15, y: 1.2, z: -10 }, 0x00FF88);
    createSpecimenTank({ x: -15, y: 1.2, z: 0 }, 0x00FFFF);
    createSpecimenTank({ x: -15, y: 1.2, z: 10 }, 0xFF00FF);
    createSpecimenTank({ x: 15, y: 1.2, z: -10 }, 0x00FF88);
    createSpecimenTank({ x: 15, y: 1.2, z: 5 }, 0xFFFF00);

    createServerRack({ x: -12, y: 1.25, z: 15 });
    createServerRack({ x: -6, y: 1.25, z: 15 });
    createServerRack({ x: 0, y: 1.25, z: 15 });
    createServerRack({ x: 6, y: 1.25, z: 15 });
    createServerRack({ x: 12, y: 1.25, z: 15 });

    createSecurityDoor({ x: -20, y: 1.5, z: 0 });
    createSecurityDoor({ x: 20, y: 1.5, z: 0 });
    createSecurityDoor({ x: 0, y: 1.5, z: -20 });

    createEmergencyLight({ x: -18, y: 4.5, z: -18 });
    createEmergencyLight({ x: 18, y: 4.5, z: -18 });
    createEmergencyLight({ x: -18, y: 4.5, z: 18 });
    createEmergencyLight({ x: 18, y: 4.5, z: 18 });

    createVentilationDuct({ x: -20, y: 4, z: -15 });
    createVentilationDuct({ x: 20, y: 4, z: 10 });
    createVentilationDuct({ x: 0, y: 4, z: 20 });

    createHazmatLocker({ x: -8, y: 0.6, z: -15 });
    createHazmatLocker({ x: 8, y: 0.6, z: -15 });
    createHazmatLocker({ x: -8, y: 0.6, z: 18 });

    createControlPanel({ x: -20, y: 2, z: -5 });
    createControlPanel({ x: 20, y: 2, z: 5 });

    createRadiationSign({ x: 0, y: 0.75, z: -20 });
    createRadiationSign({ x: -20, y: 0.75, z: 15 });

    createEscapeTunnel({ x: 0, y: 2, z: 22 });
  }

  function updateSpecimenTanks(delta) {
    animationState.specimenTanks.forEach(function(tank) {
      var data = tank.tankData;
      data.bubblePhase += 2 * delta;
      data.pulsePhase += 1.5 * delta;

      var pulseFactor = 0.6 + Math.sin(data.pulsePhase) * 0.3;

      tank.children.forEach(function(child) {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = 0.6 * pulseFactor;
        }
      });
    });
  }

  function updateEmergencyLights(delta) {
    animationState.emergencyLights.forEach(function(light) {
      var data = light.lightData;
      data.flickerPhase += 3 * delta;

      var flicker = Math.sin(elapsedTime * 4 + data.flickerPhase) * 0.4 + 1;
      data.light.intensity = data.baseIntensity * flicker;

      if (data.bulb) {
        data.bulb.material.emissiveIntensity = 0.7 * flicker;
      }
    });
  }

  function updateVentilationFans(delta) {
    animationState.ventilationFans.forEach(function(duct) {
      var data = duct.ductData;
      data.rotation += data.speed;

      duct.children.forEach(function(child) {
        if (child.geometry && (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'CylinderGeometry')) {
          if (child !== duct.children[0]) {
            child.rotation.z = data.rotation;
          }
        }
      });
    });
  }

  function updateSecurityDoors(delta) {
    animationState.securityDoors.forEach(function(door) {
      var data = door.doorData;

      if (camera) {
        var distance = camera.position.distanceTo(door.position);
        if (distance < data.proximityTrigger && !data.isOpen) {
          data.isOpen = true;
          data.openAmount = 0;
        }
        if (distance >= data.proximityTrigger && data.isOpen) {
          data.isOpen = false;
        }
      }

      if (data.isOpen) {
        data.openAmount = Math.min(data.openAmount + delta, 0.8);
      } else {
        data.openAmount = Math.max(data.openAmount - delta, 0);
      }

      door.children.forEach(function(child) {
        if (child.material && child.material.color.getHex && child.material.color.getHex() === 0x666666) {
          child.position.x = -0.5 - data.openAmount;
        }
      });
    });
  }

  function updateDataScreens(delta) {
    animationState.dataScreens.forEach(function(screen) {
      var data = screen.serverData;
      data.scrollPhase = (data.scrollPhase || 0) + 2 * delta;

      screen.children.forEach(function(child) {
        if (child.material && child.material.color && child.material.color.getHex) {
          var ledColor = child.material.color.getHex();
          if (ledColor === 0x00FF00 || ledColor === 0xFF0000) {
            var flicker = Math.sin(elapsedTime * 5 + data.scrollPhase) * 0.3 + 0.7;
            child.material.emissiveIntensity = 0.8 * flicker;
          }
        }
      });
    });
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'underground-lab-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF88; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 15px; border: 2px solid #00FF88; ' +
                                  'z-index: 100; text-shadow: 0 0 10px #00FF88; box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);';
      document.body.appendChild(hudElement);
    }
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'UNDERGROUND LAB STATUS\n' +
                  '======================\n' +
                  'SPECIMENS CAPTURED: ' + gameState.specimensCaptured + '/5\n' +
                  'DATA DOWNLOADED: ' + gameState.dataDownloaded + '%\n' +
                  'SECURITY LEVEL: ' + gameState.securityLevel + '/10\n' +
                  'TIME ELAPSED: ' + Math.floor(gameState.timeInLab) + 's\n' +
                  '[A+M to toggle HUD]';

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'A') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'm' || event.key.toLowerCase() === 'M') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ONLINE' : 'HUD: OFFLINE';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF88; font-family: monospace; font-size: 22px; font-weight: bold; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 30px; z-index: 200; ' +
                                'border: 3px solid #00FF88; pointer-events: none; ' +
                                'box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1200);
        }
        lastMKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    scene.background = new THREE.Color(0x0A0A0A);
    scene.fog = new THREE.FogExp2(0x050505, 0.06);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(10, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0xFFFFFF, 0.6, 30, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 3, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);

    createEnvironment();
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;
    gameState.timeInLab += delta;

    updateSpecimenTanks(delta);
    updateEmergencyLights(delta);
    updateVentilationFans(delta);
    updateSecurityDoors(delta);
    updateDataScreens(delta);

    gameState.dataDownloaded = Math.min(100, Math.floor(gameState.timeInLab * 5));
    gameState.specimensCaptured = Math.floor(gameState.timeInLab / 30);

    updateHUD();
  }

  function reset() {
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
      obj.children.forEach(function(child) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(function(mat) { mat.dispose(); });
          } else {
            child.material.dispose();
          }
        }
      });
    });

    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light && !(child instanceof THREE.AmbientLight && child === scene.children[0])) {
        scene.remove(child);
      }
    });

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    sceneObjects = [];
    animatedObjects = [];
    animationState.specimenTanks = [];
    animationState.emergencyLights = [];
    animationState.ventilationFans = [];
    animationState.securityDoors = [];
    animationState.dataScreens = [];
    elapsedTime = 0;
    gameState.specimensCaptured = 0;
    gameState.dataDownloaded = 0;
    gameState.securityLevel = 5;
    gameState.timeInLab = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
