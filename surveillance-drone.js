window.SurveillanceDrone = (function() {
  'use strict';

  var drones = [];
  var controlTower = null;
  var empNodes = [];
  var rooftopStructures = [];
  var laserGrid = null;
  var scene = null;
  var camera = null;
  var gameState = {
    towerDestroyed: false,
    alarmTriggered: false,
    playerDetected: false,
    empBurstActive: false,
    time: 0
  };

  function createControlTower(x, y, z) {
    var group = new THREE.Group();

    // Main tower base - large box
    var baseGeom = new THREE.BoxGeometry(3, 8, 3);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x00CC44, roughness: 0.6 });
    var baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = 4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Antenna array - three vertical cylinders
    for (var i = 0; i < 3; i++) {
      var antennaGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
      var antennaMat = new THREE.MeshStandardMaterial({ color: 0xCCCC00, metalness: 0.8 });
      var antennaMesh = new THREE.Mesh(antennaGeom, antennaMat);
      antennaMesh.position.set((i - 1) * 1.2, 9, 0);
      antennaMesh.castShadow = true;
      group.add(antennaMesh);
    }

    // Signal dish - sphere on top
    var dishGeom = new THREE.SphereGeometry(0.8, 16, 16);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0x0044FF, metalness: 0.9 });
    var dishMesh = new THREE.Mesh(dishGeom, dishMat);
    dishMesh.position.y = 11;
    dishMesh.castShadow = true;
    group.add(dishMesh);

    group.position.set(x, y, z);
    scene.add(group);
    return group;
  }

  function createEmpNode(x, y, z) {
    var group = new THREE.Group();

    // Pole - cylinder
    var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
    var poleMesh = new THREE.Mesh(poleGeom, poleMat);
    poleMesh.position.y = 2.5;
    poleMesh.castShadow = true;
    group.add(poleMesh);

    // Emp sphere on top
    var empGeom = new THREE.SphereGeometry(0.6, 16, 16);
    var empMat = new THREE.MeshStandardMaterial({ color: 0xFF4488, emissive: 0xFF2200, emissiveIntensity: 0.3 });
    var empMesh = new THREE.Mesh(empGeom, empMat);
    empMesh.position.y = 5.5;
    empMesh.castShadow = true;
    group.add(empMesh);

    // Three circular relay rings around sphere (BoxGeometry segments)
    var ringColors = [0xFF2200, 0xFF4400, 0xFF6600];
    for (var i = 0; i < 3; i++) {
      var ringGroup = new THREE.Group();
      var ringMat = new THREE.MeshStandardMaterial({ color: ringColors[i], emissive: ringColors[i] });
      for (var rk = 0; rk < 10; rk++) {
        var rkA = (rk / 10) * Math.PI * 2;
        var rkSeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), ringMat);
        rkSeg.position.set(Math.cos(rkA), 0, Math.sin(rkA));
        ringGroup.add(rkSeg);
      }
      ringGroup.position.y = 5.5;
      ringGroup.rotation.x = i * Math.PI / 3;
      ringGroup.userData.isEmpRing = true;
      group.add(ringGroup);
    }

    group.position.set(x, y, z);
    scene.add(group);
    return group;
  }

  function createSurveillanceDrone(x, y, z, type) {
    var group = new THREE.Group();

    // Main body - black box
    var bodyGeom = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 });
    var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Camera sensor - red sphere on front
    var cameraGeom = new THREE.SphereGeometry(0.15, 12, 12);
    var cameraMat = new THREE.MeshStandardMaterial({ color: 0xFF2200, emissive: 0xFF2200, emissiveIntensity: 0.5 });
    var cameraMesh = new THREE.Mesh(cameraGeom, cameraMat);
    cameraMesh.position.set(0, 0, -0.45);
    cameraMesh.castShadow = true;
    group.add(cameraMesh);

    // Four rotors at corners
    var rotorPositions = [
      [-0.35, 0.3, -0.35],
      [0.35, 0.3, -0.35],
      [-0.35, 0.3, 0.35],
      [0.35, 0.3, 0.35]
    ];

    for (var i = 0; i < 4; i++) {
      var rotorGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
      var rotorMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
      var rotorMesh = new THREE.Mesh(rotorGeom, rotorMat);
      rotorMesh.position.set(rotorPositions[i][0], rotorPositions[i][1], rotorPositions[i][2]);
      rotorMesh.castShadow = true;
      group.add(rotorMesh);
    }

    // Armed variant - add gun pod
    if (type === 'armed') {
      var gunGeom = new THREE.BoxGeometry(0.3, 0.3, 1.2);
      var gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
      var gunMesh = new THREE.Mesh(gunGeom, gunMat);
      gunMesh.position.set(0, -0.3, 0);
      gunMesh.castShadow = true;
      group.add(gunMesh);
    }

    group.position.set(x, y, z);
    group.userData.type = type || 'patrol';
    group.userData.time = Math.random() * Math.PI * 2;
    group.userData.baseHeight = y;
    group.userData.active = true;
    group.userData.rotors = [];

    // Store rotor references for animation
    var rotorIndex = 0;
    group.traverse(function(child) {
      if (child.geometry instanceof THREE.CylinderGeometry && rotorIndex < 4) {
        group.userData.rotors.push(child);
        rotorIndex++;
      }
    });

    scene.add(group);
    return group;
  }

  function createRooftopStructures() {
    var structures = [];

    // AC Unit 1 - metal box
    var acGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var acMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var acMesh = new THREE.Mesh(acGeom, acMat);
    acMesh.position.set(-8, 0.75, -10);
    acMesh.castShadow = true;
    acMesh.receiveShadow = true;
    scene.add(acMesh);
    structures.push(acMesh);

    // Water tank - cylinder
    var tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x444488, roughness: 0.6 });
    var tankMesh = new THREE.Mesh(tankGeom, tankMat);
    tankMesh.position.set(10, 1.5, 8);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;
    scene.add(tankMesh);
    structures.push(tankMesh);

    // Ventilation tower - cone
    var ventGeom = new THREE.ConeGeometry(1, 2.5, 12);
    var ventMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var ventMesh = new THREE.Mesh(ventGeom, ventMat);
    ventMesh.position.set(-12, 1.25, 5);
    ventMesh.castShadow = true;
    ventMesh.receiveShadow = true;
    scene.add(ventMesh);
    structures.push(ventMesh);

    // Electrical box - small box
    var elecGeom = new THREE.BoxGeometry(1, 1.5, 0.8);
    var elecMat = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.5 });
    var elecMesh = new THREE.Mesh(elecGeom, elecMat);
    elecMesh.position.set(7, 0.75, -8);
    elecMesh.castShadow = true;
    scene.add(elecMesh);
    structures.push(elecMesh);

    return structures;
  }

  function createLaserDetectionGrid() {
    var positions = [];
    var colors = [];
    var laserColor = new THREE.Color(0xFF4488);

    // Create grid of laser beams
    for (var x = -15; x <= 15; x += 5) {
      for (var z = -15; z <= 15; z += 5) {
        positions.push(x, 3, z);
        positions.push(x, 3.2, z);
        colors.push(laserColor.r, laserColor.g, laserColor.b);
        colors.push(laserColor.r, laserColor.g, laserColor.b);
      }
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    var material = new THREE.LineBasicMaterial({ color: 0xFF4488, linewidth: 2, vertexColors: true });
    var laserGrid = new THREE.LineSegments(geometry, material);
    scene.add(laserGrid);
    return laserGrid;
  }

  function createChargingPads() {
    var pads = [];
    var positions = [
      [-10, 0, 15],
      [10, 0, -15],
      [0, 0, -20]
    ];

    for (var i = 0; i < positions.length; i++) {
      var padGeom = new THREE.BoxGeometry(2.5, 0.3, 2.5);
      var padMat = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00AA00, emissiveIntensity: 0.4 });
      var padMesh = new THREE.Mesh(padGeom, padMat);
      padMesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      padMesh.receiveShadow = true;
      scene.add(padMesh);
      pads.push(padMesh);
    }

    return pads;
  }

  function createSignalRelayArray() {
    var group = new THREE.Group();

    // Base platform
    var platformGeom = new THREE.BoxGeometry(6, 0.5, 4);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var platformMesh = new THREE.Mesh(platformGeom, platformMat);
    platformMesh.position.y = 0.25;
    platformMesh.castShadow = true;
    group.add(platformMesh);

    // Eight relay spheres arranged in grid
    for (var x = -2; x <= 2; x += 2) {
      for (var z = -1.5; z <= 1.5; z += 1.5) {
        if (Math.abs(x) + Math.abs(z) <= 3) {
          var relayGeom = new THREE.SphereGeometry(0.4, 12, 12);
          var relayMat = new THREE.MeshStandardMaterial({ color: 0x0044FF, emissive: 0x0022FF });
          var relayMesh = new THREE.Mesh(relayGeom, relayMat);
          relayMesh.position.set(x, 1.2, z);
          relayMesh.castShadow = true;
          group.add(relayMesh);
        }
      }
    }

    group.position.set(-15, 0, 0);
    scene.add(group);
    return group;
  }

  function updateDronePatrol(drone, delta) {
    drone.userData.time += delta * (drone.userData.type === 'combat' ? 1.5 : drone.userData.type === 'patrol' ? 2 : 0.8);

    // Sinusoidal flight pattern
    var horizontal = 12 * Math.sin(drone.userData.time);
    var vertical = 2 + 1.5 * Math.cos(drone.userData.time * 0.7);

    drone.position.x = horizontal;
    drone.position.y = drone.userData.baseHeight + vertical;
    drone.position.z = 8 * Math.cos(drone.userData.time * 0.8);

    // Rotate toward movement direction
    var nextHoriz = 12 * Math.sin(drone.userData.time + 0.1);
    var nextZ = 8 * Math.cos((drone.userData.time + 0.1) * 0.8);
    var angle = Math.atan2(nextHoriz - drone.position.x, nextZ - drone.position.z);
    drone.rotation.y = angle;

    // Spin rotors
    drone.userData.rotors.forEach(function(rotor) {
      rotor.rotation.z += delta * 50;
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameState.time = 0;
    gameState.towerDestroyed = false;
    gameState.alarmTriggered = false;

    // Create rooftop environment
    var roofGeom = new THREE.BoxGeometry(50, 0.5, 50);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.position.y = -0.25;
    roofMesh.receiveShadow = true;
    scene.add(roofMesh);

    // Create boundary walls
    var wallGeom = new THREE.BoxGeometry(50, 3, 0.5);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });

    for (var i = 0; i < 4; i++) {
      var wallMesh = new THREE.Mesh(wallGeom, wallMat);
      if (i === 0) wallMesh.position.set(0, 1.5, -25);
      if (i === 1) wallMesh.position.set(0, 1.5, 25);
      if (i === 2) {
        wallMesh.geometry = new THREE.BoxGeometry(0.5, 3, 50);
        wallMesh.position.set(-25, 1.5, 0);
      }
      if (i === 3) {
        wallMesh.geometry = new THREE.BoxGeometry(0.5, 3, 50);
        wallMesh.position.set(25, 1.5, 0);
      }
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
    }

    // Create control tower
    controlTower = createControlTower(0, 0, 0);

    // Create EMP nodes
    empNodes.push(createEmpNode(-18, 0, -12));
    empNodes.push(createEmpNode(18, 0, 12));
    empNodes.push(createEmpNode(-15, 0, 18));
    empNodes.push(createEmpNode(15, 0, -18));

    // Create rooftop structures
    rooftopStructures = createRooftopStructures();

    // Create laser detection grid
    laserGrid = createLaserDetectionGrid();

    // Create charging pads
    var chargingPads = createChargingPads();

    // Create signal relay array
    var relayArray = createSignalRelayArray();

    // Create surveillance drones
    drones.push(createSurveillanceDrone(0, 4, 10, 'watcher'));
    drones.push(createSurveillanceDrone(-12, 5, -8, 'patrol'));
    drones.push(createSurveillanceDrone(12, 5, 8, 'patrol'));
    drones.push(createSurveillanceDrone(-8, 6, 0, 'armed'));
    drones.push(createSurveillanceDrone(8, 6, -12, 'patrol'));
    drones.push(createSurveillanceDrone(0, 5, -15, 'combat'));
    drones.push(createSurveillanceDrone(-10, 4, 12, 'watcher'));
    drones.push(createSurveillanceDrone(10, 5, 0, 'armed'));

    return {
      drones: drones,
      controlTower: controlTower,
      empNodes: empNodes,
      laserGrid: laserGrid
    };
  }

  function update(delta) {
    gameState.time += delta;

    // Update drone positions and animations
    drones.forEach(function(drone) {
      if (drone.userData.active) {
        updateDronePatrol(drone, delta);

        // Pulsing camera indicator
        drone.traverse(function(child) {
          if (child.geometry instanceof THREE.SphereGeometry && child.material.color.r > 0.9) {
            var pulse = 0.3 + 0.2 * Math.sin(gameState.time * 3);
            child.material.emissiveIntensity = pulse;
          }
        });
      }
    });

    // Animate laser grid opacity
    if (laserGrid) {
      laserGrid.material.opacity = 0.4 + 0.3 * Math.sin(gameState.time * 2);
    }

    // Animate control tower antenna
    if (controlTower) {
      controlTower.traverse(function(child) {
        if (child.geometry instanceof THREE.CylinderGeometry && child.position.y > 8) {
          child.rotation.z += delta * 2;
        }
      });
    }

    // Animate EMP nodes
    empNodes.forEach(function(node) {
      node.traverse(function(child) {
        if (child.userData && child.userData.isEmpRing) {
          child.rotation.y += delta * 1.5;
        }
      });
    });

    // Trigger alarm if player detected
    if (gameState.playerDetected && !gameState.alarmTriggered) {
      gameState.alarmTriggered = true;
      drones.forEach(function(drone) {
        drone.userData.type = 'combat';
      });
    }

    // EMP burst effect
    if (gameState.empBurstActive) {
      drones.forEach(function(drone) {
        if (drone.userData.active) {
          drone.position.y += Math.sin(gameState.time * 20) * 0.2;
          drone.userData.active = false;
          setTimeout(function() {
            drone.userData.active = true;
          }, 2000);
        }
      });
      gameState.empBurstActive = false;
    }

    // Tower destruction disables surveillance
    if (gameState.towerDestroyed) {
      drones.forEach(function(drone) {
        drone.userData.active = false;
      });
    }
  }

  function reset() {
    drones.forEach(function(drone) {
      scene.remove(drone);
    });
    drones = [];

    if (controlTower) {
      scene.remove(controlTower);
      controlTower = null;
    }

    empNodes.forEach(function(node) {
      scene.remove(node);
    });
    empNodes = [];

    rooftopStructures.forEach(function(structure) {
      scene.remove(structure);
    });
    rooftopStructures = [];

    if (laserGrid) {
      scene.remove(laserGrid);
      laserGrid = null;
    }

    gameState = {
      towerDestroyed: false,
      alarmTriggered: false,
      playerDetected: false,
      empBurstActive: false,
      time: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getGameState: function() { return gameState; },
    triggerAlarm: function() { gameState.playerDetected = true; },
    deactivateDrones: function() { gameState.empBurstActive = true; },
    destroyTower: function() { gameState.towerDestroyed = true; }
  };
}());
