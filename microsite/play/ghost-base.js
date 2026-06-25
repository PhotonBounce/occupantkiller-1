window.GhostBase = (function() {
  'use strict';

  var meshes = [];
  var lights = [];
  var animationState = {
    engineWarmup: 0,
    serverFanRotation: 0,
    motionSensorSweep: 0,
    operatorPatrol: [],
    documentFire: 0,
    tunnelPressure: 0,
    blackoutPulse: 0
  };

  var colors = {
    mattBlack: 0x1A1A1A,
    classifiedRed: 0xAA0000,
    ghostGray: 0x555566,
    techBlue: 0x0033AA,
    stealthDark: 0x222233,
    alertOrange: 0xFF6600,
    gunMetal: 0x373737,
    darkSteel: 0x2A2A2A
  };

  function createMainHangar(scene) {
    var hangarGeom = new THREE.BoxGeometry(120, 45, 80);
    var hangarMat = new THREE.MeshStandardMaterial({
      color: colors.mattBlack,
      metalness: 0.3,
      roughness: 0.8
    });
    var hangar = new THREE.Mesh(hangarGeom, hangarMat);
    hangar.position.set(0, 22.5, 0);
    hangar.scale.set(1, 1, 1);
    scene.add(hangar);
    meshes.push(hangar);

    // Hangar floor with panel detail
    var floorGeom = new THREE.BoxGeometry(120, 0.5, 80);
    var floorMat = new THREE.MeshStandardMaterial({
      color: colors.stealthDark,
      metalness: 0.4,
      roughness: 0.9
    });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, -0.25, 0);
    scene.add(floor);
    meshes.push(floor);

    // Hangar support pillars
    for (var i = 0; i < 4; i++) {
      var pillarGeom = new THREE.CylinderGeometry(2, 2, 45, 12);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: colors.gunMetal,
        metalness: 0.6,
        roughness: 0.5
      });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(
        (i < 2 ? -40 : 40),
        22.5,
        (i % 2 === 0 ? -25 : 25)
      );
      scene.add(pillar);
      meshes.push(pillar);
    }

    return hangar;
  }

  function createStealthAircraft(scene) {
    var aircraftGroup = new THREE.Group();
    aircraftGroup.position.set(-30, 5, 0);

    // Aircraft fuselage - delta shape
    var fuselageGeom = new THREE.BoxGeometry(8, 3, 25);
    var fuselageMat = new THREE.MeshStandardMaterial({
      color: colors.stealthDark,
      metalness: 0.8,
      roughness: 0.3
    });
    var fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.position.y = 2;
    aircraftGroup.add(fuselage);
    meshes.push(fuselage);

    // Left wing
    var wingGeom = new THREE.BoxGeometry(20, 0.5, 8);
    var wingMat = new THREE.MeshStandardMaterial({
      color: colors.mattBlack,
      metalness: 0.85,
      roughness: 0.2
    });
    var leftWing = new THREE.Mesh(wingGeom, wingMat);
    leftWing.position.set(-10, 2.5, -5);
    leftWing.rotation.z = 0.3;
    aircraftGroup.add(leftWing);
    meshes.push(leftWing);

    // Right wing
    var rightWing = new THREE.Mesh(wingGeom, wingMat);
    rightWing.position.set(10, 2.5, -5);
    rightWing.rotation.z = -0.3;
    aircraftGroup.add(rightWing);
    meshes.push(rightWing);

    // Engine intake - cone shape
    var intakeGeom = new THREE.ConeGeometry(1.5, 4, 16);
    var intakeMat = new THREE.MeshStandardMaterial({
      color: colors.gunMetal,
      metalness: 0.9,
      roughness: 0.1
    });
    var intake = new THREE.Mesh(intakeGeom, intakeMat);
    intake.position.set(0, 2, 12.5);
    intake.rotation.z = Math.PI / 2;
    aircraftGroup.add(intake);
    meshes.push(intake);

    // Canopy
    var canopyGeom = new THREE.SphereGeometry(1, 8, 8);
    var canopyMat = new THREE.MeshStandardMaterial({
      color: 0x1A3A5A,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    var canopy = new THREE.Mesh(canopyGeom, canopyMat);
    canopy.position.set(0, 3.5, 8);
    canopy.scale.set(1, 1.2, 1.5);
    aircraftGroup.add(canopy);
    meshes.push(canopy);

    scene.add(aircraftGroup);
    aircraftGroup.userData.isAircraft = true;
    return aircraftGroup;
  }

  function createFaradayCage(scene) {
    var cageGroup = new THREE.Group();
    cageGroup.position.set(35, 0, -20);

    // Cage frame - outer box shell (thin walls with 0.01 depth)
    var cageSize = 12;
    var wallThickness = 0.3;

    // Front wall
    var frontWall = new THREE.BoxGeometry(cageSize, cageSize, 0.01);
    var cageMat = new THREE.MeshStandardMaterial({
      color: colors.gunMetal,
      metalness: 0.9,
      roughness: 0.2
    });
    var front = new THREE.Mesh(frontWall, cageMat);
    front.position.z = cageSize / 2;
    cageGroup.add(front);
    meshes.push(front);

    // Back wall
    var back = new THREE.Mesh(frontWall, cageMat);
    back.position.z = -cageSize / 2;
    cageGroup.add(back);
    meshes.push(back);

    // Left wall
    var sideWall = new THREE.BoxGeometry(0.01, cageSize, cageSize);
    var left = new THREE.Mesh(sideWall, cageMat);
    left.position.x = -cageSize / 2;
    cageGroup.add(left);
    meshes.push(left);

    // Right wall
    var right = new THREE.Mesh(sideWall, cageMat);
    right.position.x = cageSize / 2;
    cageGroup.add(right);
    meshes.push(right);

    // Roof
    var roofWall = new THREE.BoxGeometry(cageSize, 0.01, cageSize);
    var roof = new THREE.Mesh(roofWall, cageMat);
    roof.position.y = cageSize / 2;
    cageGroup.add(roof);
    meshes.push(roof);

    // Metal mesh effect - horizontal lines
    var lineMat = new THREE.LineBasicMaterial({ color: colors.techBlue, linewidth: 2 });
    for (var i = 0; i < 10; i++) {
      var offset = (i - 4.5) * 2.5;
      var points = [
        new THREE.Vector3(-cageSize / 2, offset, -cageSize / 2),
        new THREE.Vector3(cageSize / 2, offset, -cageSize / 2)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(geometry, lineMat);
      cageGroup.add(line);
      meshes.push(line);
    }

    // Vertical mesh lines
    for (var j = 0; j < 10; j++) {
      var xOffset = (j - 4.5) * 2.5;
      var points2 = [
        new THREE.Vector3(xOffset, -cageSize / 2, -cageSize / 2),
        new THREE.Vector3(xOffset, cageSize / 2, -cageSize / 2)
      ];
      var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
      var line2 = new THREE.LineSegments(geometry2, lineMat);
      cageGroup.add(line2);
      meshes.push(line2);
    }

    scene.add(cageGroup);
    cageGroup.userData.isCage = true;
    return cageGroup;
  }

  function createClassifiedLockers(scene) {
    var lockerGroup = new THREE.Group();
    lockerGroup.position.set(-45, 0, 25);

    var lockerMat = new THREE.MeshStandardMaterial({
      color: colors.classifiedRed,
      metalness: 0.7,
      roughness: 0.4
    });

    // 4x3 grid of classified equipment lockers
    for (var x = 0; x < 4; x++) {
      for (var y = 0; y < 3; y++) {
        var lockerGeom = new THREE.BoxGeometry(3, 5, 2);
        var locker = new THREE.Mesh(lockerGeom, lockerMat);
        locker.position.set(x * 3.5 - 5, y * 5.5 + 2.5, 0);
        lockerGroup.add(locker);
        meshes.push(locker);

        // Locker door detail
        var doorGeom = new THREE.BoxGeometry(2.8, 4.8, 0.1);
        var doorMat = new THREE.MeshStandardMaterial({
          color: 0x8B0000,
          metalness: 0.6,
          roughness: 0.5
        });
        var door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(x * 3.5 - 5, y * 5.5 + 2.5, 1.05);
        lockerGroup.add(door);
        meshes.push(door);
      }
    }

    scene.add(lockerGroup);
    return lockerGroup;
  }

  function createArmory(scene) {
    var armoryGroup = new THREE.Group();
    armoryGroup.position.set(40, 0, 20);

    var armoryMat = new THREE.MeshStandardMaterial({
      color: colors.gunMetal,
      metalness: 0.5,
      roughness: 0.6
    });

    // Main armory cabinet
    var cabinetGeom = new THREE.BoxGeometry(15, 20, 3);
    var cabinet = new THREE.Mesh(cabinetGeom, armoryMat);
    cabinet.position.y = 10;
    armoryGroup.add(cabinet);
    meshes.push(cabinet);

    // Weapon rack shelves - BoxGeometry for flat surfaces
    var shelfMat = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      metalness: 0.7,
      roughness: 0.3
    });

    for (var shelf = 0; shelf < 5; shelf++) {
      var shelfGeom = new THREE.BoxGeometry(14, 0.3, 2.5);
      var shelfMesh = new THREE.Mesh(shelfGeom, shelfMat);
      shelfMesh.position.set(0, 5 + shelf * 3, 0);
      armoryGroup.add(shelfMesh);
      meshes.push(shelfMesh);
    }

    // Prototype weapons - small boxes on shelves
    var weaponMat = new THREE.MeshStandardMaterial({
      color: colors.mattBlack,
      metalness: 0.8,
      roughness: 0.2
    });

    for (var w = 0; w < 12; w++) {
      var weaponGeom = new THREE.BoxGeometry(1.5, 0.8, 0.5);
      var weapon = new THREE.Mesh(weaponGeom, weaponMat);
      weapon.position.set((w % 6) * 2 - 5, 6 + Math.floor(w / 6) * 3, 0);
      armoryGroup.add(weapon);
      meshes.push(weapon);
    }

    scene.add(armoryGroup);
    return armoryGroup;
  }

  function createServerRoom(scene) {
    var serverGroup = new THREE.Group();
    serverGroup.position.set(-35, 0, -35);

    var serverMat = new THREE.MeshStandardMaterial({
      color: colors.techBlue,
      metalness: 0.8,
      roughness: 0.3
    });

    // Server rack towers
    for (var rack = 0; rack < 4; rack++) {
      var rackGeom = new THREE.BoxGeometry(3, 18, 2.5);
      var rackMesh = new THREE.Mesh(rackGeom, serverMat);
      rackMesh.position.set(rack * 5 - 7.5, 9, 0);
      serverGroup.add(rackMesh);
      meshes.push(rackMesh);

      // Server blades on rack
      var bladeMat = new THREE.MeshStandardMaterial({
        color: 0x001155,
        metalness: 0.9,
        roughness: 0.1
      });

      for (var blade = 0; blade < 8; blade++) {
        var bladeGeom = new THREE.BoxGeometry(2.8, 2, 2.3);
        var bladeMesh = new THREE.Mesh(bladeGeom, bladeMat);
        bladeMesh.position.set(rack * 5 - 7.5, 2 + blade * 2.2, 0);
        serverGroup.add(bladeMesh);
        meshes.push(bladeMesh);
      }
    }

    // Cooling fans - cylinders with rotation animation
    for (var fan = 0; fan < 4; fan++) {
      var fanGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
      var fanMat = new THREE.MeshStandardMaterial({
        color: colors.alertOrange,
        metalness: 0.4,
        roughness: 0.6
      });
      var fanMesh = new THREE.Mesh(fanGeom, fanMat);
      fanMesh.position.set(fan * 5 - 7.5, 0.5, -2);
      fanMesh.rotation.x = Math.PI / 2;
      fanMesh.userData.isFan = true;
      serverGroup.add(fanMesh);
      meshes.push(fanMesh);
    }

    scene.add(serverGroup);
    serverGroup.userData.isServerRoom = true;
    return serverGroup;
  }

  function createUndergroundOpsCenter(scene) {
    var opsCenterGroup = new THREE.Group();
    opsCenterGroup.position.set(0, -20, 0);

    // Main ops center chamber
    var opsGeom = new THREE.BoxGeometry(50, 15, 40);
    var opsMat = new THREE.MeshStandardMaterial({
      color: colors.stealthDark,
      metalness: 0.3,
      roughness: 0.8
    });
    var opsCenter = new THREE.Mesh(opsGeom, opsMat);
    opsCenter.position.y = -7.5;
    opsCenterGroup.add(opsCenter);
    meshes.push(opsCenter);

    // Command center consoles - flat boxes
    var consoleMat = new THREE.MeshStandardMaterial({
      color: 0x001A00,
      metalness: 0.5,
      roughness: 0.5
    });

    for (var console = 0; console < 3; console++) {
      var consoleGeom = new THREE.BoxGeometry(8, 2, 1);
      var consoleMesh = new THREE.Mesh(consoleGeom, consoleMat);
      consoleMesh.position.set(console * 15 - 15, -2, 15);
      opsCenterGroup.add(consoleMesh);
      meshes.push(consoleMesh);

      // Monitor screens
      var screenGeom = new THREE.BoxGeometry(7, 1.5, 0.1);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x00FF00,
        emissive: 0x00AA00,
        emissiveIntensity: 0.3
      });
      var screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(console * 15 - 15, 0.5, 1.1);
      opsCenterGroup.add(screen);
      meshes.push(screen);
    }

    scene.add(opsCenterGroup);
    opsCenterGroup.userData.isOpsCenter = true;
    return opsCenterGroup;
  }

  function createEscapeTunnel(scene) {
    var tunnelGroup = new THREE.Group();
    tunnelGroup.position.set(0, -20, -50);

    // Tunnel walls and roof
    var tunnelWallGeom = new THREE.BoxGeometry(8, 6, 30);
    var tunnelMat = new THREE.MeshStandardMaterial({
      color: colors.mattBlack,
      metalness: 0.2,
      roughness: 0.9
    });
    var tunnelWall = new THREE.Mesh(tunnelWallGeom, tunnelMat);
    tunnelWall.position.z = 0;
    tunnelGroup.add(tunnelWall);
    meshes.push(tunnelWall);

    // Blast door at end - large heavy door
    var doorGeom = new THREE.BoxGeometry(8, 7, 1);
    var doorMat = new THREE.MeshStandardMaterial({
      color: colors.classifiedRed,
      metalness: 0.8,
      roughness: 0.3
    });
    var blastDoor = new THREE.Mesh(doorGeom, doorMat);
    blastDoor.position.set(0, 0, 15);
    tunnelGroup.add(blastDoor);
    meshes.push(blastDoor);

    // Door locking mechanism - cylinders
    for (var lock = 0; lock < 6; lock++) {
      var lockGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
      var lockMat = new THREE.MeshStandardMaterial({
        color: colors.gunMetal,
        metalness: 0.9,
        roughness: 0.2
      });
      var lockMesh = new THREE.Mesh(lockGeom, lockMat);
      lockMesh.position.set(
        (lock % 3) * 3 - 3,
        (lock < 3 ? 2 : -2),
        15
      );
      tunnelGroup.add(lockMesh);
      meshes.push(lockMesh);
    }

    scene.add(tunnelGroup);
    tunnelGroup.userData.isTunnel = true;
    return tunnelGroup;
  }

  function createPerimeterSensors(scene) {
    var perimeterGroup = new THREE.Group();
    perimeterGroup.position.set(0, 0, 0);

    // Motion sensor poles around perimeter
    var polePositions = [
      { x: 70, z: 60 },
      { x: 70, z: -60 },
      { x: -70, z: 60 },
      { x: -70, z: -60 },
      { x: 60, z: 70 },
      { x: -60, z: 70 }
    ];

    var poleMat = new THREE.MeshStandardMaterial({
      color: colors.alertOrange,
      metalness: 0.4,
      roughness: 0.6
    });

    polePositions.forEach(function(pos) {
      var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 6, pos.z);
      pole.userData.isMotionSensor = true;
      perimeterGroup.add(pole);
      meshes.push(pole);

      // Sensor head - sphere on top
      var sensorGeom = new THREE.SphereGeometry(0.6, 8, 8);
      var sensorMat = new THREE.MeshStandardMaterial({
        color: 0xFF3300,
        emissive: 0xFF1100,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
      });
      var sensor = new THREE.Mesh(sensorGeom, sensorMat);
      sensor.position.set(pos.x, 12.5, pos.z);
      perimeterGroup.add(sensor);
      meshes.push(sensor);
    });

    scene.add(perimeterGroup);
    return perimeterGroup;
  }

  function createBarracks(scene) {
    var barracksGroup = new THREE.Group();
    barracksGroup.position.set(-50, 2, -45);

    // Barracks building
    var barracksGeom = new THREE.BoxGeometry(20, 8, 12);
    var barracksMat = new THREE.MeshStandardMaterial({
      color: colors.stealthDark,
      metalness: 0.2,
      roughness: 0.8
    });
    var barracks = new THREE.Mesh(barracksGeom, barracksMat);
    barracks.position.y = 4;
    barracksGroup.add(barracks);
    meshes.push(barracks);

    // Bunk beds inside - small boxes
    var bunkMat = new THREE.MeshStandardMaterial({
      color: colors.gunMetal,
      metalness: 0.4,
      roughness: 0.6
    });

    for (var bunk = 0; bunk < 8; bunk++) {
      var bunkGeom = new THREE.BoxGeometry(2, 1.5, 4);
      var bunkMesh = new THREE.Mesh(bunkGeom, bunkMat);
      bunkMesh.position.set(
        (bunk % 4) * 4 - 6,
        4,
        (bunk < 4 ? -2 : 2)
      );
      barracksGroup.add(bunkMesh);
      meshes.push(bunkMesh);
    }

    // Operator bodies - cylinders with caps
    var operatorMat = new THREE.MeshStandardMaterial({
      color: 0x3A3A4A,
      metalness: 0.3,
      roughness: 0.7
    });

    for (var op = 0; op < 4; op++) {
      // Body
      var bodyGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8);
      var body = new THREE.Mesh(bodyGeom, operatorMat);
      body.position.set(
        op * 6 - 9,
        4.5,
        0
      );
      body.userData.isOperator = true;
      barracksGroup.add(body);
      meshes.push(body);

      // Head
      var headGeom = new THREE.SphereGeometry(0.35, 8, 8);
      var head = new THREE.Mesh(headGeom, operatorMat);
      head.position.set(op * 6 - 9, 5.5, 0);
      barracksGroup.add(head);
      meshes.push(head);
    }

    scene.add(barracksGroup);
    barracksGroup.userData.isBarracks = true;
    return barracksGroup;
  }

  function createUnmarkedVehicles(scene) {
    var vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(50, 1, 45);

    // Black unmarked vehicle bodies - large boxes
    var vehicleMat = new THREE.MeshStandardMaterial({
      color: colors.mattBlack,
      metalness: 0.4,
      roughness: 0.7
    });

    for (var v = 0; v < 3; v++) {
      var bodyGeom = new THREE.BoxGeometry(2.5, 1.8, 6);
      var body = new THREE.Mesh(bodyGeom, vehicleMat);
      body.position.set(v * 8 - 8, 1, 0);
      vehicleGroup.add(body);
      meshes.push(body);

      // Cab
      var cabGeom = new THREE.BoxGeometry(2.3, 1.2, 2);
      var cab = new THREE.Mesh(cabGeom, vehicleMat);
      cab.position.set(v * 8 - 8, 2, 2);
      vehicleGroup.add(cab);
      meshes.push(cab);

      // Wheels - cylinders
      var wheelMat = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.2,
        roughness: 0.9
      });

      for (var wheel = 0; wheel < 4; wheel++) {
        var wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
        var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
        wheelMesh.position.set(
          v * 8 - 8 + (wheel < 2 ? -0.8 : 0.8),
          0.5,
          (wheel % 2 === 0 ? -1.5 : 1.5)
        );
        wheelMesh.rotation.z = Math.PI / 2;
        vehicleGroup.add(wheelMesh);
        meshes.push(wheelMesh);
      }
    }

    scene.add(vehicleGroup);
    return vehicleGroup;
  }

  function createLighting(scene) {
    // Dim red alert lighting
    var redLight = new THREE.PointLight(colors.classifiedRed, 0.3, 100);
    redLight.position.set(30, 20, 30);
    scene.add(redLight);
    lights.push(redLight);

    // Blue tech lighting in server room
    var blueLight = new THREE.PointLight(colors.techBlue, 0.4, 80);
    blueLight.position.set(-35, 5, -35);
    scene.add(blueLight);
    lights.push(blueLight);

    // Orange perimeter lighting
    var orangeLight = new THREE.PointLight(colors.alertOrange, 0.35, 120);
    orangeLight.position.set(70, 10, 60);
    scene.add(orangeLight);
    lights.push(orangeLight);

    // General low ambient
    var ambientLight = new THREE.AmbientLight(0x333344, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  return {
    init: function(scene, camera) {
      meshes = [];
      lights = [];

      createMainHangar(scene);
      createStealthAircraft(scene);
      createFaradayCage(scene);
      createClassifiedLockers(scene);
      createArmory(scene);
      createServerRoom(scene);
      createUndergroundOpsCenter(scene);
      createEscapeTunnel(scene);
      createPerimeterSensors(scene);
      createBarracks(scene);
      createUnmarkedVehicles(scene);
      createLighting(scene);

      // Reset animation state
      animationState.engineWarmup = 0;
      animationState.serverFanRotation = 0;
      animationState.motionSensorSweep = 0;
      animationState.documentFire = 0;
      animationState.tunnelPressure = 0;
      animationState.blackoutPulse = 0;

      console.log('Ghost Base initialized with', meshes.length, 'meshes');
    },

    update: function(delta) {
      // Stealth aircraft engine warmup - light pulsing
      animationState.engineWarmup += delta * 0.5;
      meshes.forEach(function(mesh) {
        if (mesh.parent && mesh.parent.userData.isAircraft) {
          var intensity = 0.3 + Math.sin(animationState.engineWarmup) * 0.1;
          if (mesh.userData.engineLight) {
            mesh.userData.engineLight.intensity = intensity;
          }
        }
      });

      // Server room fan rotation
      animationState.serverFanRotation += delta * 3;
      meshes.forEach(function(mesh) {
        if (mesh.userData.isFan) {
          mesh.rotation.x = animationState.serverFanRotation;
        }
      });

      // Motion sensor sweep effect
      animationState.motionSensorSweep += delta * 2;
      meshes.forEach(function(mesh) {
        if (mesh.userData.isMotionSensor) {
          var parent = mesh.parent;
          if (parent && parent.userData.isMotionSensor) {
            parent.rotation.y = Math.sin(animationState.motionSensorSweep) * 0.5;
          }
        }
      });

      // Classified document auto-destruction fire effect
      animationState.documentFire += delta;
      if (animationState.documentFire > 5) {
        animationState.documentFire = 0;
      }

      // Escape tunnel pressurizing effect
      animationState.tunnelPressure += delta * 0.7;
      meshes.forEach(function(mesh) {
        if (mesh.parent && mesh.parent.userData.isTunnel) {
          if (Math.sin(animationState.tunnelPressure) > 0.8) {
            mesh.scale.z = 1 + Math.random() * 0.02;
          }
        }
      });

      // Blackout room EMP pulse
      animationState.blackoutPulse += delta;
      meshes.forEach(function(mesh) {
        if (mesh.parent && mesh.parent.userData.isCage) {
          if (Math.sin(animationState.blackoutPulse * 3) > 0.9) {
            mesh.material.emissive.setHex(0x0066FF);
          } else {
            mesh.material.emissive.setHex(0x000000);
          }
        }
      });

      // Ghost operator patrol idle animation
      meshes.forEach(function(mesh) {
        if (mesh.userData.isOperator) {
          mesh.position.y += Math.sin(animationState.engineWarmup * 2) * 0.001;
        }
      });
    },

    reset: function() {
      meshes.forEach(function(mesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(function(mat) { mat.dispose(); });
          } else {
            mesh.material.dispose();
          }
        }
      });

      lights.forEach(function(light) {
        light.dispose();
      });

      meshes = [];
      lights = [];
      animationState = {
        engineWarmup: 0,
        serverFanRotation: 0,
        motionSensorSweep: 0,
        operatorPatrol: [],
        documentFire: 0,
        tunnelPressure: 0,
        blackoutPulse: 0
      };
    },

    getSpawnPoints: function() {
      return [
        { x: -30, y: 5, z: 0, name: 'Hangar' },
        { x: 35, y: 0, z: -20, name: 'Comms Room' },
        { x: -35, y: 5, z: -35, name: 'Server Room' },
        { x: 0, y: -20, z: -50, name: 'Escape Tunnel' },
        { x: 70, y: 5, z: 60, name: 'Perimeter' }
      ];
    },

    getMeshCount: function() {
      return meshes.length;
    }
  };
}());
