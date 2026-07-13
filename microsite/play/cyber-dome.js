window.CyberDome = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var domeGroup = null;
  var aiCoreOrb = null;
  var aiCoreColumn = null;
  var dataFlowParticles = null;
  var maintenanceBots = [];
  var emergencyBarriers = [];
  var emitterPylons = [];
  var terminalGroups = [];
  var serverRackWalls = [];
  var time = 0;
  var particlePositions = [];
  var particleVelocities = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    domeGroup = new THREE.Group();
    scene.add(domeGroup);

    // Dark environment setup
    domeGroup.background = new THREE.Color(0x001a2e);

    // Create dome shell with hexagonal panel arrangement
    createDomeShell();

    // Create energy barrier walls
    createEnergyBarriers();

    // Create hacking terminals
    createHackingTerminals();

    // Create central AI core
    createAICore();

    // Create data conduit floor with particle grid
    createDataConduitFloor();

    // Create server rack walls
    createServerRackWalls();

    // Create holographic displays
    createHolographicDisplays();

    // Create drone assembly line
    createDroneAssemblyLine();

    // Create electromagnetic pulse emitters
    createEMPEmitters();

    // Create maintenance bots
    createMaintenanceBots();

    // Create emergency lockdown barriers
    createEmergencyBarriers();

    // Initialize particle system
    initializeParticles();
  };

  var createDomeShell = function() {
    var shellGroup = new THREE.Group();
    var panelSize = 40;
    var rows = 8;
    var cols = 12;

    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        var angle = (j / cols) * Math.PI * 2;
        var elevation = (i / rows) * Math.PI * 0.5;
        var radius = 400;

        var x = radius * Math.cos(elevation) * Math.cos(angle);
        var y = radius * Math.sin(elevation);
        var z = radius * Math.cos(elevation) * Math.sin(angle);

        var geometry = new THREE.BoxGeometry(panelSize, panelSize, 5);
        var material = new THREE.MeshStandardMaterial({
          color: 0x0a1a2e,
          emissive: 0x00ccff,
          emissiveIntensity: 0.2,
          metalness: 0.8,
          roughness: 0.2
        });
        var panel = new THREE.Mesh(geometry, material);
        panel.position.set(x, y, z);
        panel.lookAt(0, 0, 0);
        shellGroup.add(panel);

        // Add edge lines to panels
        var edgeGeometry = new THREE.BufferGeometry();
        var edgeVertices = new Float32Array([
          -panelSize/2, -panelSize/2, 0,
          panelSize/2, -panelSize/2, 0,
          panelSize/2, panelSize/2, 0,
          -panelSize/2, panelSize/2, 0,
          -panelSize/2, -panelSize/2, 0
        ]);
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgeVertices, 3));
        var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
        var edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edgeLines.position.copy(panel.position);
        edgeLines.quaternion.copy(panel.quaternion);
        shellGroup.add(edgeLines);
      }
    }

    domeGroup.add(shellGroup);
  };

  var createEnergyBarriers = function() {
    var barrierGroup = new THREE.Group();

    // Create multiple translucent barrier layers
    for (var layer = 0; layer < 3; layer++) {
      var radius = 350 - (layer * 30);
      var geometry = new THREE.SphereGeometry(radius, 16, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.1 + (layer * 0.05),
        transparent: true,
        opacity: 0.15 - (layer * 0.05),
        wireframe: true,
        metalness: 0.5,
        roughness: 0.8
      });
      var barrier = new THREE.Mesh(geometry, material);
      barrier.userData.pulsePhase = layer * Math.PI / 1.5;
      barrierGroup.add(barrier);
    }

    domeGroup.add(barrierGroup);
  };

  var createHackingTerminals = function() {
    var terminalPositions = [
      { x: -200, y: -150, z: -250 },
      { x: 200, y: -150, z: -250 },
      { x: -200, y: -150, z: 250 },
      { x: 200, y: -150, z: 250 },
      { x: -280, y: -100, z: 0 },
      { x: 280, y: -100, z: 0 }
    ];

    terminalPositions.forEach(function(pos) {
      var terminalGroup = new THREE.Group();

      // Terminal body
      var bodyGeometry = new THREE.BoxGeometry(60, 80, 30);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x0d1b2a,
        metalness: 0.7,
        roughness: 0.3
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      terminalGroup.add(body);

      // Screen face (emissive cyan)
      var screenGeometry = new THREE.BoxGeometry(50, 60, 2);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff99,
        emissive: 0x00ff99,
        emissiveIntensity: 0.8,
        metalness: 0.6,
        roughness: 0.4
      });
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.z = 20;
      terminalGroup.add(screen);

      // LED indicators
      for (var i = 0; i < 4; i++) {
        var ledGeometry = new THREE.SphereGeometry(3, 8, 8);
        var ledMaterial = new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xff0080 : 0x00ff00,
          emissive: i % 2 === 0 ? 0xff0080 : 0x00ff00,
          emissiveIntensity: 0.9
        });
        var led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(-15 + (i * 10), 25, 22);
        terminalGroup.add(led);
      }

      terminalGroup.position.copy(pos);
      domeGroup.add(terminalGroup);
      terminalGroups.push(terminalGroup);
    });
  };

  var createAICore = function() {
    var coreGroup = new THREE.Group();

    // Support column
    var columnGeometry = new THREE.CylinderGeometry(25, 25, 200, 16);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a52,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003366,
      emissiveIntensity: 0.3
    });
    aiCoreColumn = new THREE.Mesh(columnGeometry, columnMaterial);
    aiCoreColumn.position.y = 0;
    coreGroup.add(aiCoreColumn);

    // Main AI orb - large central sphere
    var coreGeometry = new THREE.SphereGeometry(80, 32, 32);
    var coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.6,
      metalness: 0.7,
      roughness: 0.2,
      wireframe: false
    });
    aiCoreOrb = new THREE.Mesh(coreGeometry, coreMaterial);
    aiCoreOrb.position.y = 120;
    coreGroup.add(aiCoreOrb);

    // Rotating data rings around core (BoxGeometry segments in circle)
    for (var ring = 0; ring < 3; ring++) {
      var ringGroup = new THREE.Group();
      var ringRadius = 100 + (ring * 40);
      var ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        emissive: 0x0099ff,
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.4
      });
      var segments = 24;
      for (var seg = 0; seg < segments; seg++) {
        var angle = (seg / segments) * Math.PI * 2;
        var segGeom = new THREE.BoxGeometry(16, 8, 8);
        var segMesh = new THREE.Mesh(segGeom, ringMaterial);
        segMesh.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
        segMesh.rotation.y = -angle;
        ringGroup.add(segMesh);
      }
      ringGroup.position.y = 120;
      ringGroup.rotation.x = ring * 0.3;
      ringGroup.userData.rotationSpeed = 0.5 + (ring * 0.3);
      coreGroup.add(ringGroup);
    }

    coreGroup.position.set(0, 50, 0);
    domeGroup.add(coreGroup);
  };

  var createDataConduitFloor = function() {
    var floorGroup = new THREE.Group();

    // Floor platform
    var floorGeometry = new THREE.BoxGeometry(600, 10, 600);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a1520,
      metalness: 0.6,
      roughness: 0.4,
      emissive: 0x001a3a,
      emissiveIntensity: 0.2
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -200;
    floorGroup.add(floor);

    // Grid pattern with lines
    var gridSize = 600;
    var gridSpacing = 40;
    var gridGeometry = new THREE.BufferGeometry();
    var gridVertices = [];

    for (var i = -gridSize / 2; i <= gridSize / 2; i += gridSpacing) {
      gridVertices.push(i, -195, -gridSize / 2);
      gridVertices.push(i, -195, gridSize / 2);
      gridVertices.push(-gridSize / 2, -195, i);
      gridVertices.push(gridSize / 2, -195, i);
    }

    gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridVertices), 3));
    var gridMaterial = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 1 });
    var gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    floorGroup.add(gridLines);

    domeGroup.add(floorGroup);
  };

  var createServerRackWalls = function() {
    var rackPositions = [
      { x: -280, z: -280, rotY: Math.PI * 0.25 },
      { x: 280, z: -280, rotY: -Math.PI * 0.25 },
      { x: -280, z: 280, rotY: -Math.PI * 0.25 },
      { x: 280, z: 280, rotY: Math.PI * 0.25 }
    ];

    rackPositions.forEach(function(pos) {
      var rackWall = new THREE.Group();

      // Create rows of server units
      for (var row = 0; row < 6; row++) {
        for (var col = 0; col < 4; col++) {
          var rackGeometry = new THREE.BoxGeometry(35, 25, 20);
          var rackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a2a3a,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x003344,
            emissiveIntensity: 0.2
          });
          var rack = new THREE.Mesh(rackGeometry, rackMaterial);
          rack.position.set(col * 40 - 60, row * 30 - 75, 0);
          rackWall.add(rack);

          // LED indicators on racks
          for (var led = 0; led < 3; led++) {
            var ledGeometry = new THREE.SphereGeometry(2, 6, 6);
            var ledColor = led === 0 ? 0x00ff00 : (led === 1 ? 0xff9900 : 0xff0000);
            var ledMaterial = new THREE.MeshStandardMaterial({
              color: ledColor,
              emissive: ledColor,
              emissiveIntensity: 0.8
            });
            var ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
            ledMesh.position.set(col * 40 - 60, row * 30 - 75 + (led * 5), 12);
            rackWall.add(ledMesh);
          }
        }
      }

      rackWall.position.set(pos.x, -50, pos.z);
      rackWall.rotation.y = pos.rotY;
      domeGroup.add(rackWall);
      serverRackWalls.push(rackWall);
    });
  };

  var createHolographicDisplays = function() {
    var displayPositions = [
      { x: -300, y: 100, z: 0, rotY: Math.PI * 0.5 },
      { x: 300, y: 100, z: 0, rotY: -Math.PI * 0.5 },
      { x: 0, y: 100, z: -300, rotY: 0 }
    ];

    displayPositions.forEach(function(pos) {
      var displayGeometry = new THREE.BoxGeometry(120, 100, 10);
      var displayMaterial = new THREE.MeshStandardMaterial({
        color: 0x0055ff,
        emissive: 0x0066ff,
        emissiveIntensity: 0.7,
        metalness: 0.5,
        roughness: 0.3
      });
      var display = new THREE.Mesh(displayGeometry, displayMaterial);
      display.position.set(pos.x, pos.y, pos.z);
      display.rotation.y = pos.rotY;
      display.userData.cyclePhase = Math.random() * Math.PI * 2;
      domeGroup.add(display);
    });
  };

  var createDroneAssemblyLine = function() {
    var assemblyGroup = new THREE.Group();

    // Conveyor belt
    var beltGeometry = new THREE.BoxGeometry(400, 15, 60);
    var beltMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      metalness: 0.6,
      roughness: 0.4
    });
    var belt = new THREE.Mesh(beltGeometry, beltMaterial);
    belt.position.y = -140;
    assemblyGroup.add(belt);

    // Drone bodies on assembly line
    for (var i = 0; i < 5; i++) {
      var droneGroup = new THREE.Group();
      var droneGeometry = new THREE.BoxGeometry(30, 20, 25);
      var droneMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a3a5a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x003366,
        emissiveIntensity: 0.3
      });
      var droneBody = new THREE.Mesh(droneGeometry, droneMaterial);
      droneGroup.add(droneBody);

      // Drone rotors
      for (var rotor = 0; rotor < 4; rotor++) {
        var rotorGeometry = new THREE.CylinderGeometry(8, 8, 2, 8);
        var rotorMaterial = new THREE.MeshStandardMaterial({
          color: 0x0088ff,
          metalness: 0.7,
          roughness: 0.3
        });
        var rotorMesh = new THREE.Mesh(rotorGeometry, rotorMaterial);
        var angle = (rotor / 4) * Math.PI * 2;
        rotorMesh.position.set(Math.cos(angle) * 15, 10, Math.sin(angle) * 15);
        rotorMesh.userData.rotationAxis = new THREE.Vector3(0, 1, 0);
        droneGroup.add(rotorMesh);
      }

      droneGroup.position.set(-160 + (i * 80), -140, 0);
      droneGroup.userData.assemblyIndex = i;
      assemblyGroup.add(droneGroup);
    }

    assemblyGroup.position.set(0, 0, 150);
    domeGroup.add(assemblyGroup);
  };

  var createEMPEmitters = function() {
    var cardinalPoints = [
      { x: 320, z: 0 },
      { x: -320, z: 0 },
      { x: 0, z: 320 },
      { x: 0, z: -320 }
    ];

    cardinalPoints.forEach(function(pos) {
      var emitterGroup = new THREE.Group();

      // Pylon base
      var pylonGeometry = new THREE.CylinderGeometry(20, 30, 150, 12);
      var pylonMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a3a52,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x003366,
        emissiveIntensity: 0.3
      });
      var pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
      pylon.position.y = 0;
      emitterGroup.add(pylon);

      // Emitter cap
      var capGeometry = new THREE.ConeGeometry(20, 30, 12);
      var capMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.6,
        metalness: 0.6,
        roughness: 0.2
      });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.y = 90;
      emitterGroup.add(cap);

      // Energy arcs
      var arcGeometry = new THREE.BufferGeometry();
      var arcVertices = [];
      for (var a = 0; a < 8; a++) {
        var angle = (a / 8) * Math.PI * 2;
        arcVertices.push(Math.cos(angle) * 25, 80, Math.sin(angle) * 25);
        arcVertices.push(Math.cos(angle) * 35, 100, Math.sin(angle) * 35);
      }
      arcGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arcVertices), 3));
      var arcMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
      var arcLines = new THREE.LineSegments(arcGeometry, arcMaterial);
      emitterGroup.add(arcLines);

      emitterGroup.position.set(pos.x, -50, pos.z);
      emitterGroup.userData.pulsePhase = Math.random() * Math.PI * 2;
      domeGroup.add(emitterGroup);
      emitterPylons.push(emitterGroup);
    });
  };

  var createMaintenanceBots = function() {
    for (var bot = 0; bot < 3; bot++) {
      var botGroup = new THREE.Group();

      // Bot body
      var bodyGeometry = new THREE.BoxGeometry(20, 30, 20);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a2a4a,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x001144,
        emissiveIntensity: 0.2
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      botGroup.add(body);

      // Treads (wheels)
      for (var tread = 0; tread < 2; tread++) {
        var treadGeometry = new THREE.CylinderGeometry(8, 8, 5, 12);
        var treadMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.6,
          roughness: 0.5
        });
        var treadMesh = new THREE.Mesh(treadGeometry, treadMaterial);
        treadMesh.position.set((tread === 0 ? -12 : 12), -15, 0);
        treadMesh.rotation.z = Math.PI * 0.5;
        treadMesh.userData.rotationSpeed = 0.15;
        botGroup.add(treadMesh);
      }

      // Sensor head
      var sensorGeometry = new THREE.SphereGeometry(6, 8, 8);
      var sensorMaterial = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff3300,
        emissiveIntensity: 0.7
      });
      var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
      sensor.position.y = 20;
      botGroup.add(sensor);

      botGroup.position.set(-150 + (bot * 150), -165, 0);
      botGroup.userData.trackPath = bot;
      botGroup.userData.pathProgress = Math.random();
      domeGroup.add(botGroup);
      maintenanceBots.push(botGroup);
    }
  };

  var createEmergencyBarriers = function() {
    var barrierPositions = [
      { x: -250, z: -250, sizeX: 100, sizeZ: 20 },
      { x: 250, z: -250, sizeX: 100, sizeZ: 20 },
      { x: -250, z: 250, sizeX: 100, sizeZ: 20 },
      { x: 250, z: 250, sizeX: 100, sizeZ: 20 }
    ];

    barrierPositions.forEach(function(pos) {
      var barrierGeometry = new THREE.BoxGeometry(pos.sizeX, 120, pos.sizeZ);
      var barrierMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7,
        metalness: 0.8,
        roughness: 0.2
      });
      var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(pos.x, -50, pos.z);
      barrier.userData.closedState = 0;
      domeGroup.add(barrier);
      emergencyBarriers.push(barrier);
    });
  };

  var initializeParticles = function() {
    var particleCount = 200;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.random() * 300;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 400 - 150;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      particlePositions.push({
        x: positions[i * 3],
        y: positions[i * 3 + 1],
        z: positions[i * 3 + 2]
      });
      particleVelocities.push({
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        z: (Math.random() - 0.5) * 100
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: 2,
      sizeAttenuation: true
    });
    dataFlowParticles = new THREE.Points(geometry, material);
    domeGroup.add(dataFlowParticles);
  };

  var update = function(delta) {
    time += delta;

    // Rotate AI core orb
    if (aiCoreOrb) {
      aiCoreOrb.rotation.x += 0.3 * delta;
      aiCoreOrb.rotation.y += 0.2 * delta;
    }

    // Animate rotating rings around core
    domeGroup.traverse(function(child) {
      if (child.userData.rotationSpeed !== undefined) {
        child.rotation.x += child.userData.rotationSpeed * delta;
        child.rotation.z += child.userData.rotationSpeed * 0.5 * delta;
      }
    });

    // Energy barrier pulse
    domeGroup.traverse(function(child) {
      if (child.userData.pulsePhase !== undefined && child.geometry instanceof THREE.SphereGeometry) {
        var pulseAmount = Math.sin(time * 2 + child.userData.pulsePhase) * 0.15;
        child.scale.set(1 + pulseAmount, 1 + pulseAmount, 1 + pulseAmount);
      }
    });

    // Update data flow particles
    if (dataFlowParticles) {
      var positions = dataFlowParticles.geometry.attributes.position.array;
      for (var i = 0; i < particlePositions.length; i++) {
        particlePositions[i].x += particleVelocities[i].x * delta;
        particlePositions[i].y += particleVelocities[i].y * delta;
        particlePositions[i].z += particleVelocities[i].z * delta;

        // Boundary wrapping
        if (Math.abs(particlePositions[i].x) > 350) {
          particleVelocities[i].x *= -1;
          particlePositions[i].x = Math.max(-350, Math.min(350, particlePositions[i].x));
        }
        if (Math.abs(particlePositions[i].y) > 250) {
          particleVelocities[i].y *= -1;
          particlePositions[i].y = Math.max(-250, Math.min(250, particlePositions[i].y));
        }
        if (Math.abs(particlePositions[i].z) > 350) {
          particleVelocities[i].z *= -1;
          particlePositions[i].z = Math.max(-350, Math.min(350, particlePositions[i].z));
        }

        positions[i * 3] = particlePositions[i].x;
        positions[i * 3 + 1] = particlePositions[i].y;
        positions[i * 3 + 2] = particlePositions[i].z;
      }
      dataFlowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Animate maintenance bots along paths
    maintenanceBots.forEach(function(bot) {
      var pathRadius = 200;
      var speed = 1;
      bot.userData.pathProgress += speed * delta;
      if (bot.userData.pathProgress > Math.PI * 2) {
        bot.userData.pathProgress -= Math.PI * 2;
      }

      var pathAngle = (bot.userData.trackPath * Math.PI * 0.66) + bot.userData.pathProgress;
      bot.position.x = Math.cos(pathAngle) * pathRadius;
      bot.position.z = Math.sin(pathAngle) * pathRadius;

      // Rotate treads
      bot.children.forEach(function(child) {
        if (child.userData.rotationSpeed !== undefined) {
          child.rotation.x += child.userData.rotationSpeed * 10 * delta;
        }
      });
    });

    // Animate emergency barriers closing
    emergencyBarriers.forEach(function(barrier) {
      barrier.userData.closedState += delta * 0.3;
      if (barrier.userData.closedState > 1) {
        barrier.userData.closedState = 1;
      }
      barrier.position.y = -50 + (barrier.userData.closedState * 60);
      barrier.material.opacity = 0.7 - (barrier.userData.closedState * 0.3);
    });

    // Pulse holographic displays
    domeGroup.traverse(function(child) {
      if (child.userData.cyclePhase !== undefined && child.geometry instanceof THREE.BoxGeometry && child.scale.x > 1) {
        var cycleIntensity = Math.sin(time * 3 + child.userData.cyclePhase) * 0.3;
        child.material.emissiveIntensity = 0.7 + cycleIntensity;
      }
    });

    // EMP emitter pulse effects
    emitterPylons.forEach(function(emitter) {
      var pulseIntensity = Math.sin(time * 1.5 + emitter.userData.pulsePhase) * 0.3 + 0.5;
      emitter.children.forEach(function(child) {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.ConeGeometry) {
          child.material.emissiveIntensity = 0.6 * pulseIntensity;
        }
      });
    });
  };

  var reset = function() {
    time = 0;
    if (domeGroup) {
      domeGroup.clear();
    }
    maintenanceBots = [];
    emergencyBarriers = [];
    emitterPylons = [];
    terminalGroups = [];
    serverRackWalls = [];
    particlePositions = [];
    particleVelocities = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
