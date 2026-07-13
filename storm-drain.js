var window = window || {};

window.StormDrain = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var floodGate = null;
  var waterSurface = null;
  var manholeShafts = [];
  var pumpMachinery = [];
  var waterDebris = [];
  var floodGateData = { position: 0, targetPosition: 1, speed: 0.5 };
  var waterFlowOffset = 0;
  var elapsedTime = 0;
  var hudElement = null;
  var gameState = {
    drainageLevel: 0,
    maxDrainageLevel: 100,
    smugglersEliminated: 0,
    maxSmugglers: 12,
    pumpStatus: 'OPERATIONAL'
  };

  function createMainTunnel() {
    // Main drainage tunnel - large curved structure made from boxes
    // Left wall (curved effect with stacked boxes)
    for (var i = 0; i < 8; i++) {
      var wallGeometry = new THREE.BoxGeometry(1, 3, 3);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(-8 + i * 0.8, 1.5, -30 + i * 5);
      wall.rotation.z = i * 0.1;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      sceneObjects.push(wall);
    }

    // Right wall (curved effect with stacked boxes)
    for (var i = 0; i < 8; i++) {
      var wallGeometry = new THREE.BoxGeometry(1, 3, 3);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888877, roughness: 0.8 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(8 - i * 0.8, 1.5, -30 + i * 5);
      wall.rotation.z = -i * 0.1;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      sceneObjects.push(wall);
    }

    // Ceiling support ribs
    for (var i = 0; i < 5; i++) {
      var ribGeometry = new THREE.BoxGeometry(20, 0.3, 0.3);
      var ribMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
      var rib = new THREE.Mesh(ribGeometry, ribMaterial);
      rib.position.set(0, 3.5, -20 + i * 8);
      rib.rotation.z = Math.PI / 6;
      rib.castShadow = true;
      rib.receiveShadow = true;
      scene.add(rib);
      sceneObjects.push(rib);
    }
  }

  function createWaterChannel() {
    // Long flowing water surface (blue)
    waterSurface = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.5, 80),
      new THREE.MeshStandardMaterial({
        color: 0x2266AA,
        metalness: 0.4,
        roughness: 0.3,
        emissive: 0x1a4d88,
        emissiveIntensity: 0.3
      })
    );
    waterSurface.position.set(0, 0.5, 0);
    waterSurface.castShadow = true;
    waterSurface.receiveShadow = true;
    scene.add(waterSurface);
    sceneObjects.push(waterSurface);
    waterSurface.waterData = { flowSpeed: 1.5, waveHeight: 0.2 };
  }

  function createMaintenanceCatwalk() {
    // Left catwalk
    var leftCatGeometry = new THREE.BoxGeometry(2, 0.4, 60);
    var catMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9, metalness: 0.2 });
    var leftCat = new THREE.Mesh(leftCatGeometry, catMaterial);
    leftCat.position.set(-6, 2.2, 0);
    leftCat.castShadow = true;
    leftCat.receiveShadow = true;
    scene.add(leftCat);
    sceneObjects.push(leftCat);

    // Right catwalk
    var rightCat = new THREE.Mesh(leftCatGeometry, catMaterial);
    rightCat.position.set(6, 2.2, 0);
    rightCat.castShadow = true;
    rightCat.receiveShadow = true;
    scene.add(rightCat);
    sceneObjects.push(rightCat);

    // Catwalk railings
    for (var i = 0; i < 6; i++) {
      var railGeometry = new THREE.BoxGeometry(0.2, 1.2, 10);
      var railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
      var rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(-6, 2.8, -30 + i * 10);
      rail.castShadow = true;
      rail.receiveShadow = true;
      scene.add(rail);
      sceneObjects.push(rail);

      var rail2 = new THREE.Mesh(railGeometry, railMaterial);
      rail2.position.set(6, 2.8, -30 + i * 10);
      rail2.castShadow = true;
      rail2.receiveShadow = true;
      scene.add(rail2);
      sceneObjects.push(rail2);
    }
  }

  function createManholeShafts() {
    // Vertical light shafts from above (emissive cylinders)
    var shaftPositions = [
      [-10, 0],
      [-2, 0],
      [6, 0],
      [14, 0],
      [-6, -20],
      [8, -20],
      [-4, 20],
      [10, 20]
    ];

    shaftPositions.forEach(function(pos) {
      var shaftGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
      var shaftMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF88,
        emissive: 0xFFFF88,
        emissiveIntensity: 0.6,
        roughness: 0.4
      });
      var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      shaft.position.set(pos[0], 2.5, pos[1]);
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      scene.add(shaft);
      sceneObjects.push(shaft);
      manholeShafts.push({
        mesh: shaft,
        baseIntensity: 0.6,
        pulseTime: Math.random() * Math.PI * 2
      });
    });
  }

  function createPumpStation() {
    var group = new THREE.Group();

    // Pump base
    var baseGeometry = new THREE.BoxGeometry(4, 1, 3);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x334422, roughness: 0.7 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Main pump cylinder (large orange cylinder)
    var pumpGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 12);
    var pumpMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.4,
      roughness: 0.5
    });
    var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(-0.5, 2, 0);
    pump.castShadow = true;
    pump.receiveShadow = true;
    group.add(pump);
    pumpMachinery.push({ mesh: pump, rotationSpeed: 2 });

    // Motor assembly
    var motorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12);
    var motorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var motor = new THREE.Mesh(motorGeometry, motorMaterial);
    motor.position.set(1.5, 2.3, 0);
    motor.castShadow = true;
    motor.receiveShadow = true;
    group.add(motor);
    pumpMachinery.push({ mesh: motor, rotationSpeed: 3 });

    // Intake pipe (cylinder coming from water)
    var intakeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var intake = new THREE.Mesh(intakeGeometry, pipeMaterial);
    intake.position.set(-0.5, 0, 1.5);
    intake.rotation.z = Math.PI / 4;
    intake.castShadow = true;
    intake.receiveShadow = true;
    group.add(intake);

    // Discharge pipe
    var discharge = new THREE.Mesh(intakeGeometry, pipeMaterial);
    discharge.position.set(-0.5, 3.5, -1.5);
    discharge.rotation.z = Math.PI / 4;
    discharge.castShadow = true;
    discharge.receiveShadow = true;
    group.add(discharge);

    group.position.set(0, 0, -25);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createJunctionChamber() {
    // Wide open chamber where tunnels meet
    var chamberGeometry = new THREE.BoxGeometry(18, 4, 12);
    var chamberMaterial = new THREE.MeshStandardMaterial({ color: 0x777766, roughness: 0.8 });
    var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(0, 2, 25);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    scene.add(chamber);
    sceneObjects.push(chamber);

    // Side tunnel openings (3 visible pipe mouths)
    var pipeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });

    var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.position.set(-9, 2, 20);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.castShadow = true;
    pipe1.receiveShadow = true;
    scene.add(pipe1);
    sceneObjects.push(pipe1);

    var pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe2.position.set(9, 2, 20);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.castShadow = true;
    pipe2.receiveShadow = true;
    scene.add(pipe2);
    sceneObjects.push(pipe2);

    var pipe3 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe3.position.set(0, 2, 32);
    pipe3.castShadow = true;
    pipe3.receiveShadow = true;
    scene.add(pipe3);
    sceneObjects.push(pipe3);
  }

  function createSmugglingCacheBoxes() {
    // Crates and boxes hidden in the junction chamber
    var positions = [
      [-7, 0.5, 22],
      [-5, 0.5, 24],
      [5, 0.5, 26],
      [7, 0.5, 28],
      [-3, 1.8, 20],
      [3, 1.8, 30]
    ];

    positions.forEach(function(pos) {
      var crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.8 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      sceneObjects.push(crate);
    });
  }

  function createMetalGrateFloor() {
    // Metal grate sections in multiple locations
    for (var i = 0; i < 4; i++) {
      var grateGeometry = new THREE.BoxGeometry(10, 0.15, 6);
      var grateMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
        metalness: 0.3
      });
      var grate = new THREE.Mesh(grateGeometry, grateMaterial);
      grate.position.set(0, 0.08, -35 + i * 20);
      grate.castShadow = true;
      grate.receiveShadow = true;
      scene.add(grate);
      sceneObjects.push(grate);
    }
  }

  function createDrainagePipeOpenings() {
    // Side openings where water drains from
    var openingPositions = [
      [-7, 1, -40],
      [7, 1, -40],
      [-8, 1, -15],
      [8, 1, -15],
      [-6, 1, 10],
      [6, 1, 10]
    ];

    openingPositions.forEach(function(pos) {
      var openingGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12);
      var openingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
      var opening = new THREE.Mesh(openingGeometry, openingMaterial);
      opening.position.set(pos[0], pos[1], pos[2]);
      opening.rotation.z = Math.PI / 2;
      opening.castShadow = true;
      opening.receiveShadow = true;
      scene.add(opening);
      sceneObjects.push(opening);
    });
  }

  function createFloodGate() {
    // Large gate door that can raise/lower
    var gateGeometry = new THREE.BoxGeometry(16, 3, 0.8);
    var gateMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    floodGate = new THREE.Mesh(gateGeometry, gateMaterial);
    floodGate.position.set(0, 1.5, -50);
    floodGate.castShadow = true;
    floodGate.receiveShadow = true;
    scene.add(floodGate);
    sceneObjects.push(floodGate);

    // Gate frame (steel beams on sides)
    var frameGeometry = new THREE.BoxGeometry(0.5, 4, 1.2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });

    var frame1 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame1.position.set(-9, 2, -50);
    frame1.castShadow = true;
    frame1.receiveShadow = true;
    scene.add(frame1);
    sceneObjects.push(frame1);

    var frame2 = new THREE.Mesh(frameGeometry, frameMaterial);
    frame2.position.set(9, 2, -50);
    frame2.castShadow = true;
    frame2.receiveShadow = true;
    scene.add(frame2);
    sceneObjects.push(frame2);
  }

  function createElectricalConduits() {
    // Electrical boxes and conduit on walls
    var conduitPositions = [
      [-8, 2.5, -30],
      [-8, 2.5, 0],
      [8, 2.5, -30],
      [8, 2.5, 0],
      [-8, 2.5, 20],
      [8, 2.5, 20]
    ];

    conduitPositions.forEach(function(pos) {
      var conduitGeometry = new THREE.BoxGeometry(0.6, 0.8, 1.2);
      var conduitMaterial = new THREE.MeshStandardMaterial({
        color: 0x444400,
        emissive: 0x222200,
        emissiveIntensity: 0.2,
        roughness: 0.7
      });
      var conduit = new THREE.Mesh(conduitGeometry, conduitMaterial);
      conduit.position.set(pos[0], pos[1], pos[2]);
      conduit.castShadow = true;
      conduit.receiveShadow = true;
      scene.add(conduit);
      sceneObjects.push(conduit);
    });
  }

  function createLadderAccessPoints() {
    // Ladder rungs (horizontal bars) leading up catwalk
    for (var i = 0; i < 4; i++) {
      var ladderGeometry = new THREE.BoxGeometry(1.5, 0.15, 0.15);
      var ladderMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });

      var rung1 = new THREE.Mesh(ladderGeometry, ladderMaterial);
      rung1.position.set(-6.5, 1.2 + i * 0.4, -40);
      rung1.castShadow = true;
      rung1.receiveShadow = true;
      scene.add(rung1);
      sceneObjects.push(rung1);

      var rung2 = new THREE.Mesh(ladderGeometry, ladderMaterial);
      rung2.position.set(6.5, 1.2 + i * 0.4, 30);
      rung2.castShadow = true;
      rung2.receiveShadow = true;
      scene.add(rung2);
      sceneObjects.push(rung2);
    }
  }

  function createWaterDebris() {
    // Small floating debris boxes
    var positions = [
      [-3, 0.8, -20],
      [2, 0.9, -10],
      [-5, 0.7, 5],
      [4, 0.8, 15],
      [-1, 0.85, -35],
      [3, 0.75, 10]
    ];

    positions.forEach(function(pos) {
      var debrisGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.5);
      var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(pos[0], pos[1], pos[2]);
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      sceneObjects.push(debris);
      waterDebris.push({
        mesh: debris,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.1,
        vz: Math.random() * 0.5 + 0.2,
        wobbleTime: Math.random() * Math.PI * 2
      });
    });
  }

  function createWaterSprayParticles() {
    // Mist particles near pump station (small spheres)
    for (var i = 0; i < 50; i++) {
      var sprayGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      var sprayMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCEEFF,
        emissive: 0x88CCFF,
        emissiveIntensity: 0.3,
        roughness: 0.6
      });
      var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
      spray.position.set(
        (Math.random() - 0.5) * 3,
        1.5 + Math.random() * 2,
        -25 + Math.random() * 3
      );
      spray.castShadow = true;
      spray.receiveShadow = true;
      scene.add(spray);
      sceneObjects.push(spray);
    }
  }

  function createGround() {
    // Concrete floor of drain
    var floorGeometry = new THREE.BoxGeometry(20, 0.2, 100);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 0.95 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'DRAINAGE LEVEL: ' + Math.floor(gameState.drainageLevel) + '/' + gameState.maxDrainageLevel + '\n' +
                  'SMUGGLERS ELIMINATED: ' + gameState.smugglersEliminated + '/' + gameState.maxSmugglers + '\n' +
                  'PUMP STATUS: ' + gameState.pumpStatus;
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    var now = Date.now();
    if (event.key === 'd' || event.key === 'D') {
      if (gameState.drainageLevel < gameState.maxDrainageLevel) {
        gameState.drainageLevel += 5;
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    manholeShafts = [];
    pumpMachinery = [];
    waterDebris = [];
    elapsedTime = 0;
    waterFlowOffset = 0;
    floodGateData = { position: 0, targetPosition: 1, speed: 0.5 };
    gameState = {
      drainageLevel: 0,
      maxDrainageLevel: 100,
      smugglersEliminated: 0,
      maxSmugglers: 12,
      pumpStatus: 'OPERATIONAL'
    };

    // Drain atmosphere - dark, wet, industrial
    scene.background = new THREE.Color(0x2a2a2a);
    scene.fog = new THREE.Fog(0x2a2a2a, 60, 100);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x666666, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFCC, 0.6);
    directionalLight.position.set(20, 35, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all level objects
    createGround();
    createMainTunnel();
    createWaterChannel();
    createMaintenanceCatwalk();
    createManholeShafts();
    createPumpStation();
    createJunctionChamber();
    createSmugglingCacheBoxes();
    createMetalGrateFloor();
    createDrainagePipeOpenings();
    createFloodGate();
    createElectricalConduits();
    createLadderAccessPoints();
    createWaterDebris();
    createWaterSprayParticles();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'storm-drain-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.right = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.lineHeight = '1.6';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,0,0.7)';
      hudElement.style.backgroundColor = 'rgba(0,0,0,0.6)';
      hudElement.style.padding = '10px';
      hudElement.style.border = '1px solid #00FF00';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Water surface flowing animation
    if (waterSurface) {
      waterFlowOffset += delta * waterSurface.waterData.flowSpeed;
      waterSurface.position.z = (waterFlowOffset % 80) - 40;
      var waveAmount = Math.sin(elapsedTime * 2) * 0.1;
      waterSurface.position.y = 0.5 + waveAmount;
    }

    // Update manhole shaft lights (pulsing emissive)
    manholeShafts.forEach(function(shaft) {
      shaft.pulseTime += delta;
      var pulse = Math.sin(shaft.pulseTime * 1.5) * 0.4 + 0.6;
      shaft.mesh.material.emissiveIntensity = shaft.baseIntensity * pulse;
    });

    // Rotate pump machinery
    pumpMachinery.forEach(function(pump) {
      pump.mesh.rotation.y += pump.rotationSpeed * delta;
      pump.mesh.position.y += Math.sin(elapsedTime * 3) * 0.02;
    });

    // Animate flood gate raising/lowering
    if (floodGate) {
      if (Math.abs(floodGateData.position - floodGateData.targetPosition) > 0.01) {
        if (floodGateData.position < floodGateData.targetPosition) {
          floodGateData.position += floodGateData.speed * delta;
        } else {
          floodGateData.position -= floodGateData.speed * delta;
        }
        floodGate.position.y = 1.5 + floodGateData.position * 3;
      }
      if (Math.random() < 0.01) {
        floodGateData.targetPosition = Math.random();
      }
    }

    // Drift water debris
    waterDebris.forEach(function(item) {
      item.mesh.position.x += item.vx;
      item.mesh.position.z += item.vz;
      item.wobbleTime += delta;
      item.mesh.position.y = 0.8 + Math.sin(item.wobbleTime * 2) * 0.15;

      if (item.mesh.position.z > 50) {
        item.mesh.position.z = -40;
      }
    });

    // Game state updates
    if (Math.random() < 0.008) {
      if (gameState.drainageLevel < gameState.maxDrainageLevel) {
        gameState.drainageLevel += 2;
      }
    }

    if (Math.random() < 0.01) {
      if (gameState.smugglersEliminated < gameState.maxSmugglers) {
        gameState.smugglersEliminated += 1;
      }
    }

    if (Math.random() < 0.03) {
      gameState.pumpStatus = gameState.pumpStatus === 'OPERATIONAL' ? 'CAVITATION' : 'OPERATIONAL';
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove water debris
    waterDebris.forEach(function(item) {
      scene.remove(item.mesh);
    });

    sceneObjects = [];
    manholeShafts = [];
    pumpMachinery = [];
    waterDebris = [];
    floodGate = null;
    waterSurface = null;
    elapsedTime = 0;
    waterFlowOffset = 0;
    floodGateData = { position: 0, targetPosition: 1, speed: 0.5 };
    gameState = {
      drainageLevel: 0,
      maxDrainageLevel: 100,
      smugglersEliminated: 0,
      maxSmugglers: 12,
      pumpStatus: 'OPERATIONAL'
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
