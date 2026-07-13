window.NightFactory = (function() {
  'use strict';

  // Module state
  var scene = null;
  var camera = null;
  var factoryObjects = [];
  var animationState = {
    roboticArmTime: 0,
    moltenPourTime: 0,
    steamVentTime: 0,
    craneTraverseTime: 0,
    securityLightFlicker: 0
  };

  var FACTORY_CONFIG = {
    hallWidth: 120,
    hallLength: 180,
    hallHeight: 40,
    wallThickness: 2,
    floorLevel: 0,
    ceilingLevel: 40
  };

  function createFactoryHall() {
    // Dark concrete walls
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });

    // North wall
    var northWall = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.hallWidth, FACTORY_CONFIG.hallHeight, FACTORY_CONFIG.wallThickness),
      wallMaterial
    );
    northWall.position.set(0, FACTORY_CONFIG.hallHeight / 2, -FACTORY_CONFIG.hallLength / 2);
    northWall.name = 'northWall';
    scene.add(northWall);
    factoryObjects.push(northWall);

    // South wall
    var southWall = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.hallWidth, FACTORY_CONFIG.hallHeight, FACTORY_CONFIG.wallThickness),
      wallMaterial
    );
    southWall.position.set(0, FACTORY_CONFIG.hallHeight / 2, FACTORY_CONFIG.hallLength / 2);
    scene.add(southWall);
    factoryObjects.push(southWall);

    // East wall
    var eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.wallThickness, FACTORY_CONFIG.hallHeight, FACTORY_CONFIG.hallLength),
      wallMaterial
    );
    eastWall.position.set(FACTORY_CONFIG.hallWidth / 2, FACTORY_CONFIG.hallHeight / 2, 0);
    scene.add(eastWall);
    factoryObjects.push(eastWall);

    // West wall
    var westWall = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.wallThickness, FACTORY_CONFIG.hallHeight, FACTORY_CONFIG.hallLength),
      wallMaterial
    );
    westWall.position.set(-FACTORY_CONFIG.hallWidth / 2, FACTORY_CONFIG.hallHeight / 2, 0);
    scene.add(westWall);
    factoryObjects.push(westWall);

    // Floor (dark metal plating)
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d0d,
      roughness: 0.7,
      metalness: 0.4
    });
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.hallWidth, 0.5, FACTORY_CONFIG.hallLength),
      floorMaterial
    );
    floor.position.y = -0.25;
    scene.add(floor);
    factoryObjects.push(floor);

    // Ceiling (dark metal with industrial look)
    var ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(FACTORY_CONFIG.hallWidth, 0.5, FACTORY_CONFIG.hallLength),
      wallMaterial
    );
    ceiling.position.y = FACTORY_CONFIG.ceilingLevel;
    scene.add(ceiling);
    factoryObjects.push(ceiling);
  }

  function createMoltenMetalLadle() {
    var group = new THREE.Group();
    group.position.set(-30, 5, -40);

    // Ladle vessel (CylinderGeometry)
    var ladleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
      metalness: 0.7
    });
    var ladle = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 12, 16),
      ladleMaterial
    );
    ladle.position.y = 8;
    ladle.castShadow = true;
    group.add(ladle);

    // Handle arm (BoxGeometry)
    var handle = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 20),
      ladleMaterial
    );
    handle.position.set(12, 10, 0);
    handle.rotation.z = Math.PI / 12;
    group.add(handle);

    // Molten glow (SphereGeometry inside ladle)
    var moltenMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF4400,
      roughness: 0.3,
      metalness: 0.2
    });
    var molten = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      moltenMaterial
    );
    molten.position.y = 8;
    molten.scale.y = 0.5;
    molten.castShadow = true;
    group.add(molten);
    group.moltenSphere = molten;

    scene.add(group);
    factoryObjects.push(group);
    return group;
  }

  function createCastingMolds() {
    var moldMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8,
      metalness: 0.5
    });

    for (var i = 0; i < 4; i++) {
      var mold = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 10),
        moldMaterial
      );
      mold.position.set(-15 + i * 15, 4, -20);
      mold.castShadow = true;
      scene.add(mold);
      factoryObjects.push(mold);
    }
  }

  function createRoboticAssemblyArm() {
    var group = new THREE.Group();
    group.position.set(20, 10, -50);

    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.5,
      metalness: 0.8
    });

    // Base (BoxGeometry)
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 6),
      armMaterial
    );
    base.position.y = 0;
    base.castShadow = true;
    group.add(base);

    // First joint (CylinderGeometry pivot)
    var pivot1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 2, 8),
      armMaterial
    );
    pivot1.position.y = 3;
    pivot1.rotation.z = Math.PI / 2;
    group.add(pivot1);

    // Arm segment 1 (BoxGeometry)
    var segment1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 16),
      armMaterial
    );
    segment1.position.set(0, 5, 12);
    segment1.castShadow = true;
    group.add(segment1);

    // Second joint (CylinderGeometry)
    var pivot2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8),
      armMaterial
    );
    pivot2.position.set(0, 6, 20);
    group.add(pivot2);

    // Arm segment 2 (BoxGeometry)
    var segment2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 14),
      armMaterial
    );
    segment2.position.set(0, 5, 32);
    segment2.castShadow = true;
    group.add(segment2);

    // Gripper (BoxGeometry)
    var gripper = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3, 3),
      armMaterial
    );
    gripper.position.set(0, 5, 42);
    gripper.castShadow = true;
    group.add(gripper);

    group.baseRotation = 0;
    group.segment1Rotation = 0;
    scene.add(group);
    factoryObjects.push(group);
    return group;
  }

  function createOverheadCrane() {
    var group = new THREE.Group();
    group.position.set(0, 36, 0);

    var beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.8
    });

    // I-beam (BoxGeometry)
    var ibeam = new THREE.Mesh(
      new THREE.BoxGeometry(100, 2, 3),
      beamMaterial
    );
    ibeam.castShadow = true;
    group.add(ibeam);

    // Chain segments (LineSegments)
    var chainGeometry = new THREE.BufferGeometry();
    var chainPositions = [];
    var chainLinks = 8;
    for (var i = 0; i < chainLinks; i++) {
      chainPositions.push(20, -i * 3, 0);
      chainPositions.push(20, -(i + 1) * 3, 0);
    }
    chainGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(chainPositions), 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 });
    var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
    group.add(chain);

    // Hook (CylinderGeometry)
    var hook = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 4, 8),
      beamMaterial
    );
    hook.position.set(20, -24, 0);
    group.add(hook);
    group.craneHookX = 20;

    scene.add(group);
    factoryObjects.push(group);
    return group;
  }

  function createCoolingBath() {
    var bathMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.6,
      metalness: 0.3
    });

    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a4a,
      roughness: 0.4,
      metalness: 0.1
    });

    // Tank walls
    var tankX = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 0.5),
      bathMaterial
    );
    tankX.position.set(0, 6, 60);
    scene.add(tankX);
    factoryObjects.push(tankX);

    // Water surface
    var water = new THREE.Mesh(
      new THREE.BoxGeometry(19, 0.3, 18),
      waterMaterial
    );
    water.position.set(0, 12, 60);
    scene.add(water);
    factoryObjects.push(water);
  }

  function createSteamVentPipes() {
    var group = new THREE.Group();
    group.position.set(40, 8, 30);

    var pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.7,
      metalness: 0.7
    });

    // Vertical pipe (CylinderGeometry)
    var pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 20, 12),
      pipeMaterial
    );
    pipe.position.y = 10;
    pipe.castShadow = true;
    group.add(pipe);

    // Steam cloud (SphereGeometry)
    var steamMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x666666,
      roughness: 0.8,
      transparent: true,
      opacity: 0.3
    });
    var steam = new THREE.Mesh(
      new THREE.SphereGeometry(6, 8, 8),
      steamMaterial
    );
    steam.position.y = 22;
    steam.scale.set(1, 0.8, 1);
    group.add(steam);
    group.steamCloud = steam;
    group.steamBaseScale = 1;

    scene.add(group);
    factoryObjects.push(group);
    return group;
  }

  function createSecurityPatrolMarkers() {
    var markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF6600,
      roughness: 0.5
    });

    var patrolPath = [
      { x: -40, z: -60 },
      { x: 40, z: -60 },
      { x: 40, z: 60 },
      { x: -40, z: 60 }
    ];

    for (var i = 0; i < patrolPath.length; i++) {
      var marker = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.2, 4),
        markerMaterial
      );
      marker.position.set(patrolPath[i].x, 0.1, patrolPath[i].z);
      scene.add(marker);
      factoryObjects.push(marker);
    }
  }

  function createToolStorage() {
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.6
    });

    // Wall rack shelves
    for (var i = 0; i < 3; i++) {
      var shelf = new THREE.Mesh(
        new THREE.BoxGeometry(20, 0.5, 8),
        rackMaterial
      );
      shelf.position.set(-50, 2 + i * 3, -60);
      scene.add(shelf);
      factoryObjects.push(shelf);
    }

    // Support posts (CylinderGeometry)
    for (var j = 0; j < 2; j++) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 12, 8),
        rackMaterial
      );
      post.position.set(-40 + j * 20, 6, -60);
      scene.add(post);
      factoryObjects.push(post);
    }
  }

  function createBreakRoom() {
    var breakGroup = new THREE.Group();
    breakGroup.position.set(45, 0, 70);

    var tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.6,
      metalness: 0.3
    });

    // Table (BoxGeometry)
    var table = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.8, 8),
      tableMaterial
    );
    table.position.y = 2;
    breakGroup.add(table);

    // Table legs (CylinderGeometry)
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        var leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 2, 8),
          tableMaterial
        );
        leg.position.set(-4 + i * 8, 1, -3 + j * 6);
        breakGroup.add(leg);
      }
    }

    // Chairs (BoxGeometry)
    for (var c = 0; c < 2; c++) {
      var chair = new THREE.Mesh(
        new THREE.BoxGeometry(2, 3, 2),
        tableMaterial
      );
      chair.position.set(-6 + c * 12, 1.5, 6);
      breakGroup.add(chair);
    }

    // Vending machine (BoxGeometry + CylinderGeometry)
    var vendingBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 6, 2),
      tableMaterial
    );
    vendingBody.position.set(8, 3, 8);
    breakGroup.add(vendingBody);

    var vendingLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0x888800 })
    );
    vendingLight.position.set(8, 5.5, 1.5);
    breakGroup.add(vendingLight);

    scene.add(breakGroup);
    factoryObjects.push(breakGroup);
  }

  function createLoadingDock() {
    var dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x222a2a,
      roughness: 0.8,
      metalness: 0.4
    });

    // Bay doors (BoxGeometry)
    for (var i = 0; i < 2; i++) {
      var door = new THREE.Mesh(
        new THREE.BoxGeometry(12, 12, 0.5),
        dockMaterial
      );
      door.position.set(-15 + i * 30, 6, 80);
      scene.add(door);
      factoryObjects.push(door);
    }

    // Ramp (BoxGeometry)
    var ramp = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.5, 15),
      dockMaterial
    );
    ramp.position.set(0, 0, 70);
    ramp.rotation.x = -0.2;
    scene.add(ramp);
    factoryObjects.push(ramp);
  }

  function createQualityControlTable() {
    var tableGroup = new THREE.Group();
    tableGroup.position.set(-35, 0, 20);

    var qcMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      roughness: 0.6,
      metalness: 0.5
    });

    var qcTable = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.8, 10),
      qcMaterial
    );
    qcTable.position.y = 2.5;
    tableGroup.add(qcTable);

    // Indicator lights (SphereGeometry)
    var indicatorColors = [0xFF0000, 0x00FF00, 0x0000FF];
    for (var i = 0; i < 3; i++) {
      var light = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshStandardMaterial({
          color: indicatorColors[i],
          emissive: indicatorColors[i],
          roughness: 0.3
        })
      );
      light.position.set(-4 + i * 4, 3.5, 2);
      tableGroup.add(light);
    }

    scene.add(tableGroup);
    factoryObjects.push(tableGroup);
  }

  function createLockerBays() {
    var lockerMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.6
    });

    var bayGroup = new THREE.Group();
    bayGroup.position.set(-55, 0, 0);

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var locker = new THREE.Mesh(
          new THREE.BoxGeometry(3, 4, 1),
          lockerMaterial
        );
        locker.position.set(col * 4, 2 + row * 5, 0);
        bayGroup.add(locker);
      }
    }

    scene.add(bayGroup);
    factoryObjects.push(bayGroup);
  }

  function createFireWatchStation() {
    var stationGroup = new THREE.Group();
    stationGroup.position.set(50, 0, -70);

    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.7,
      metalness: 0.5
    });

    // Elevated platform (BoxGeometry)
    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.8, 8),
      platformMaterial
    );
    platform.position.y = 8;
    stationGroup.add(platform);

    // Support column (CylinderGeometry)
    var column = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 8, 12),
      platformMaterial
    );
    column.position.y = 4;
    stationGroup.add(column);

    // Red alert light (SphereGeometry)
    var alertLight = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0x880000,
        roughness: 0.4
      })
    );
    alertLight.position.y = 10;
    stationGroup.add(alertLight);
    stationGroup.alertLight = alertLight;

    scene.add(stationGroup);
    factoryObjects.push(stationGroup);
    return stationGroup;
  }

  function createElectricalRoom() {
    var roomGroup = new THREE.Group();
    roomGroup.position.set(-60, 0, 50);

    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.7
    });

    // Panel walls (BoxGeometry)
    var panelWall = new THREE.Mesh(
      new THREE.BoxGeometry(12, 15, 10),
      panelMaterial
    );
    panelWall.position.y = 7.5;
    roomGroup.add(panelWall);

    // Indicator lights on panel
    for (var i = 0; i < 4; i++) {
      var indLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0x00FF00,
          emissive: 0x00AA00,
          roughness: 0.3
        })
      );
      indLight.position.set(-4 + i * 3, 10, 5.1);
      roomGroup.add(indLight);
    }

    scene.add(roomGroup);
    factoryObjects.push(roomGroup);
  }

  function createEmergencyExitSigns() {
    var exitMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00AA00,
      roughness: 0.2
    });

    var exitPositions = [
      { x: 55, y: 18, z: -75 },
      { x: -55, y: 18, z: 75 }
    ];

    for (var i = 0; i < exitPositions.length; i++) {
      var sign = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 0.3),
        exitMaterial
      );
      sign.position.copy(exitPositions[i]);
      scene.add(sign);
      factoryObjects.push(sign);
    }
  }

  function createSecurityLights() {
    var lightPositions = [
      { x: 0, z: -40 },
      { x: 30, z: 0 },
      { x: -30, z: 40 }
    ];

    for (var i = 0; i < lightPositions.length; i++) {
      var lightSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xFFFFCC,
          emissive: 0x888844,
          roughness: 0.3
        })
      );
      lightSphere.position.set(lightPositions[i].x, 35, lightPositions[i].z);
      scene.add(lightSphere);
      factoryObjects.push(lightSphere);

      // Overhead light that casts shadows
      var pointLight = new THREE.PointLight(0xFFFFCC, 0.4, 60);
      pointLight.position.copy(lightSphere.position);
      pointLight.castShadow = true;
      scene.add(pointLight);
    }
  }

  function createHydraulicPress() {
    var pressGroup = new THREE.Group();
    pressGroup.position.set(30, 0, -10);

    var pressMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.8
    });

    // Base frame (BoxGeometry)
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(15, 2, 15),
      pressMaterial
    );
    base.position.y = 1;
    pressGroup.add(base);

    // Vertical columns (CylinderGeometry)
    for (var i = 0; i < 2; i++) {
      var column = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 18, 12),
        pressMaterial
      );
      column.position.set(-5 + i * 10, 9, 0);
      column.castShadow = true;
      pressGroup.add(column);
    }

    // Ram head (BoxGeometry)
    var ram = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2, 12),
      pressMaterial
    );
    ram.position.y = 16;
    ram.castShadow = true;
    pressGroup.add(ram);
    pressGroup.ramPosition = 16;

    scene.add(pressGroup);
    factoryObjects.push(pressGroup);
    return pressGroup;
  }

  function createScrapMetalBin() {
    var binGroup = new THREE.Group();
    binGroup.position.set(-25, 0, -75);

    var binMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.5
    });

    // Main bin container (BoxGeometry)
    var binBody = new THREE.Mesh(
      new THREE.BoxGeometry(12, 10, 12),
      binMaterial
    );
    binBody.position.y = 5;
    binBody.castShadow = true;
    binGroup.add(binBody);

    // Scrap metal pieces (irregular BoxGeometry)
    var scrapColor = 0x404040;
    for (var i = 0; i < 6; i++) {
      var scrap = new THREE.Mesh(
        new THREE.BoxGeometry(2 + Math.random() * 2, 1 + Math.random() * 1.5, 2 + Math.random() * 2),
        new THREE.MeshStandardMaterial({ color: scrapColor, roughness: 0.9, metalness: 0.4 })
      );
      scrap.position.set(-3 + Math.random() * 6, 8 + i * 0.5, -3 + Math.random() * 6);
      scrap.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      binGroup.add(scrap);
    }

    scene.add(binGroup);
    factoryObjects.push(binGroup);
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    // Set ambient lighting (minimal for night atmosphere)
    var ambientLight = new THREE.AmbientLight(0x1a1a2a, 0.3);
    scene.add(ambientLight);

    // Create all factory elements
    createFactoryHall();
    var moltenLadle = createMoltenMetalLadle();
    factoryObjects.push(moltenLadle);
    createCastingMolds();
    var roboticArm = createRoboticAssemblyArm();
    factoryObjects.push(roboticArm);
    var crane = createOverheadCrane();
    factoryObjects.push(crane);
    createCoolingBath();
    var steamVent = createSteamVentPipes();
    factoryObjects.push(steamVent);
    createSecurityPatrolMarkers();
    createToolStorage();
    createBreakRoom();
    createLoadingDock();
    createQualityControlTable();
    createLockerBays();
    var fireStation = createFireWatchStation();
    factoryObjects.push(fireStation);
    createElectricalRoom();
    createEmergencyExitSigns();
    createSecurityLights();
    var press = createHydraulicPress();
    factoryObjects.push(press);
    createScrapMetalBin();

    // Store references for animation
    scene.nightFactoryData = {
      moltenLadle: moltenLadle,
      roboticArm: roboticArm,
      crane: crane,
      steamVent: steamVent,
      fireStation: fireStation,
      press: press
    };
  }

  function update(delta) {
    if (!scene || !scene.nightFactoryData) return;

    var data = scene.nightFactoryData;

    // Robotic arm oscillation
    animationState.roboticArmTime += delta;
    if (data.roboticArm) {
      data.roboticArm.rotation.y = Math.sin(animationState.roboticArmTime * 0.8) * 0.4;
    }

    // Molten metal pour animation
    animationState.moltenPourTime += delta;
    if (data.moltenLadle && data.moltenLadle.moltenSphere) {
      var pourCycle = Math.sin(animationState.moltenPourTime * 1.2) * 0.3 + 0.7;
      data.moltenLadle.moltenSphere.material.emissive.setScalar(pourCycle);
      data.moltenLadle.rotation.z = Math.sin(animationState.moltenPourTime * 0.5) * 0.1;
    }

    // Steam vent puffing
    animationState.steamVentTime += delta;
    if (data.steamVent && data.steamVent.steamCloud) {
      var steamScale = Math.sin(animationState.steamVentTime * 1.5) * 0.3 + 1;
      data.steamVent.steamCloud.scale.set(steamScale, steamScale * 0.8, steamScale);
      data.steamVent.steamCloud.material.opacity = Math.sin(animationState.steamVentTime * 2) * 0.1 + 0.2;
    }

    // Crane traverse
    animationState.craneTraverseTime += delta;
    if (data.crane) {
      var craneX = Math.sin(animationState.craneTraverseTime * 0.6) * 30;
      data.crane.craneHookX = craneX;
      data.crane.children.forEach(function(child) {
        if (child.type === 'Mesh' && child.geometry && child.geometry.type === 'CylinderGeometry') {
          child.position.x = craneX;
        }
        if (child instanceof THREE.LineSegments) {
          var positions = child.geometry.attributes.position.array;
          for (var i = 0; i < positions.length; i += 3) {
            if (i === 0 || (i > 0 && positions[i * 3 - 3] !== craneX)) {
              positions[i] = craneX;
            }
          }
          child.geometry.attributes.position.needsUpdate = true;
        }
      });
    }

    // Security light flicker
    animationState.securityLightFlicker += delta;
    if (data.fireStation && data.fireStation.alertLight) {
      var flicker = Math.sin(animationState.securityLightFlicker * 2.5) * 0.2 + 0.8;
      data.fireStation.alertLight.material.emissive.setScalar(flicker * 0.5);
    }

    // Hydraulic press cycling
    if (data.press) {
      var pressCycle = Math.sin(animationState.moltenPourTime * 1.1) * 2 + 16;
      data.press.ramPosition = pressCycle;
      data.press.children.forEach(function(child) {
        if (child.type === 'Mesh' && child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y > 14) {
          child.position.y = pressCycle;
        }
      });
    }
  }

  function reset() {
    animationState.roboticArmTime = 0;
    animationState.moltenPourTime = 0;
    animationState.steamVentTime = 0;
    animationState.craneTraverseTime = 0;
    animationState.securityLightFlicker = 0;

    factoryObjects.forEach(function(obj) {
      if (obj.children) {
        obj.children.forEach(function(child) {
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
          if (child.geometry && child.geometry.dispose) {
            child.geometry.dispose();
          }
        });
      }
      if (obj.material && obj.material.dispose) {
        obj.material.dispose();
      }
      if (obj.geometry && obj.geometry.dispose) {
        obj.geometry.dispose();
      }
    });

    factoryObjects = [];
    if (scene && scene.nightFactoryData) {
      scene.nightFactoryData = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
