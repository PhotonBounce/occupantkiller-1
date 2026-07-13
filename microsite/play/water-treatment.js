window.WaterTreatment = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  // Container objects for easy batch updates and removal
  var plantMeshes = [];
  var animatedObjects = [];
  var clarificationTanks = [];
  var uvLights = [];
  var pumpHouses = [];
  var chemicalDrips = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Position camera at ground level for FPS view
    camera.position.set(0, 1.7, 20);
    camera.lookAt(0, 1, 0);

    // Build main facility structures
    buildClarificationTanks();
    buildSedimentationBasins();
    buildSandFiltrationBeds();
    buildChemicalDosingStation();
    buildUVDisinfectionChambers();
    buildPumpHouses();
    buildPipeNetwork();
    buildFlowControlValves();
    buildChemicalStorageShed();
    buildControlRoom();
    buildOverheadWalkway();
    buildAccessLadders();
    buildPressureGauges();
    buildEmergencyShutoff();
    buildPerimeterFence();
    buildSpillContainmentBerm();

    // Ground
    var groundGeometry = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c3c });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    plantMeshes.push(ground);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 40, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);

    // Hazard warning ambient lighting
    var hazardLight = new THREE.PointLight(0xff4400, 0.3, 150);
    hazardLight.position.set(30, 15, -30);
    scene.add(hazardLight);
  };

  var buildClarificationTanks = function() {
    // Large circular clarification tanks with swirl animation
    var tankPositions = [
      { x: -25, z: -15 },
      { x: 25, z: -15 },
      { x: 0, z: 5 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var pos = tankPositions[i];
      var tankGeometry = new THREE.CylinderGeometry(12, 14, 8, 32);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x6ba3d0, metalness: 0.4, roughness: 0.6 });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(pos.x, 4, pos.z);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      plantMeshes.push(tank);
      clarificationTanks.push({ mesh: tank, rotation: 0 });

      // Tank cap/cover
      var capGeometry = new THREE.CylinderGeometry(12.2, 12.2, 0.5, 32);
      var capMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos.x, 8.25, pos.z);
      cap.castShadow = true;
      scene.add(cap);
      plantMeshes.push(cap);

      // Interior swirl effect mesh (invisible, for animation tracking)
      clarificationTanks[clarificationTanks.length - 1].originalRotation = tank.rotation.y;
    }
  };

  var buildSedimentationBasins = function() {
    // Rectangular sedimentation basins
    var basins = [
      { x: -40, z: 20, w: 15, d: 25 },
      { x: -10, z: 20, w: 15, d: 25 },
      { x: 20, z: 20, w: 15, d: 25 }
    ];

    for (var i = 0; i < basins.length; i++) {
      var b = basins[i];
      var basinGeometry = new THREE.BoxGeometry(b.w, 5, b.d);
      var basinMaterial = new THREE.MeshStandardMaterial({ color: 0x7db8d9, metalness: 0.5, roughness: 0.5 });
      var basinMesh = new THREE.Mesh(basinGeometry, basinMaterial);
      basinMesh.position.set(b.x, 2.5, b.z);
      basinMesh.castShadow = true;
      basinMesh.receiveShadow = true;
      scene.add(basinMesh);
      plantMeshes.push(basinMesh);

      // Water surface (thin box)
      var waterGeometry = new THREE.BoxGeometry(b.w - 0.5, 0.1, b.d - 0.5);
      var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.7 });
      var water = new THREE.Mesh(waterGeometry, waterMaterial);
      water.position.set(b.x, 5.05, b.z);
      scene.add(water);
      plantMeshes.push(water);
    }
  };

  var buildSandFiltrationBeds = function() {
    // Sand filtration beds with textured surface
    var bedGeometry = new THREE.BoxGeometry(18, 4, 20);
    var bedMaterial = new THREE.MeshStandardMaterial({ color: 0xc4a85a, metalness: 0.2, roughness: 0.9 });

    var bedPositions = [
      { x: -45, z: -40 },
      { x: -15, z: -40 },
      { x: 15, z: -40 },
      { x: 45, z: -40 }
    ];

    for (var i = 0; i < bedPositions.length; i++) {
      var pos = bedPositions[i];
      var bed = new THREE.Mesh(bedGeometry, bedMaterial);
      bed.position.set(pos.x, 2, pos.z);
      bed.castShadow = true;
      bed.receiveShadow = true;
      scene.add(bed);
      plantMeshes.push(bed);

      // Filter support frame (BoxGeometry posts at corners)
      var framePostGeometry = new THREE.BoxGeometry(0.8, 5, 0.8);
      var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
      var corners = [
        { x: -9, z: -10 },
        { x: 9, z: -10 },
        { x: -9, z: 10 },
        { x: 9, z: 10 }
      ];
      for (var j = 0; j < corners.length; j++) {
        var post = new THREE.Mesh(framePostGeometry, frameMaterial);
        post.position.set(pos.x + corners[j].x, 2.5, pos.z + corners[j].z);
        post.castShadow = true;
        scene.add(post);
        plantMeshes.push(post);
      }
    }
  };

  var buildChemicalDosingStation = function() {
    // Main dosing station building
    var buildingGeometry = new THREE.BoxGeometry(16, 8, 12);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.3, roughness: 0.7 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-60, 4, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    plantMeshes.push(building);

    // Chemical injection tanks (tall cylinders)
    var tankPositions = [
      { x: -65, z: -3 },
      { x: -65, z: 3 },
      { x: -55, z: -3 },
      { x: -55, z: 3 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var pos = tankPositions[i];
      var tankGeometry = new THREE.CylinderGeometry(1.5, 1.8, 7, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.6, roughness: 0.4 });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(pos.x, 3.5, pos.z);
      tank.castShadow = true;
      scene.add(tank);
      plantMeshes.push(tank);

      // Tank cap
      var capGeometry = new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16);
      var capMaterial = new THREE.MeshStandardMaterial({ color: 0xcc5500, metalness: 0.7, roughness: 0.3 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos.x, 7.15, pos.z);
      scene.add(cap);
      plantMeshes.push(cap);

      // Drip animation for this tank
      chemicalDrips.push({
        position: new THREE.Vector3(pos.x, 7, pos.z),
        drops: [],
        rate: 0.05 + Math.random() * 0.05
      });
    }

    // Dosing pump heads (small cylinders)
    var pumpGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    for (var i = 0; i < 4; i++) {
      var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
      pump.position.set(-65 + i * 5, 6, 0);
      pump.castShadow = true;
      scene.add(pump);
      plantMeshes.push(pump);
      animatedObjects.push({ mesh: pump, type: 'pump', intensity: 0.1 });
    }
  };

  var buildUVDisinfectionChambers = function() {
    // UV treatment tunnel sections
    var chamberGeometry = new THREE.BoxGeometry(8, 5, 30);
    var chamberMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.4, roughness: 0.6 });
    var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(50, 2.5, 10);
    chamber.castShadow = true;
    chamber.receiveShadow = true;
    scene.add(chamber);
    plantMeshes.push(chamber);

    // UV light elements (SphereGeometry)
    var lightPositions = [
      { x: 47, z: 0 },
      { x: 47, z: 10 },
      { x: 47, z: 20 },
      { x: 53, z: 0 },
      { x: 53, z: 10 },
      { x: 53, z: 20 }
    ];

    for (var i = 0; i < lightPositions.length; i++) {
      var pos = lightPositions[i];
      var uvGeometry = new THREE.SphereGeometry(0.8, 12, 12);
      var uvMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x0088ff });
      var uvLight = new THREE.Mesh(uvGeometry, uvMaterial);
      uvLight.position.set(pos.x, 2.5, 10 + pos.z);
      scene.add(uvLight);
      plantMeshes.push(uvLight);
      uvLights.push({ mesh: uvLight, originalIntensity: 0.8, pulse: 0 });
    }

    // UV reactor housing support
    var supportGeometry = new THREE.BoxGeometry(10, 0.5, 32);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.5 });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(50, 5.5, 10);
    support.castShadow = true;
    scene.add(support);
    plantMeshes.push(support);
  };

  var buildPumpHouses = function() {
    // Main pump house building
    var buildingGeometry = new THREE.BoxGeometry(14, 10, 18);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, metalness: 0.3, roughness: 0.7 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(60, 5, 30);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    plantMeshes.push(building);
    pumpHouses.push({ building: building, vibration: 0 });

    // Large pump bodies (horizontal cylinders)
    var pumpGeometry = new THREE.CylinderGeometry(2.5, 2.5, 8, 16);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.3 });

    var pumpPositions = [
      { x: 0, y: 2, z: -5 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 2, z: 5 }
    ];

    for (var i = 0; i < pumpPositions.length; i++) {
      var pos = pumpPositions[i];
      var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
      pump.rotation.z = Math.PI / 2;
      pump.position.set(60 + pos.x, 5 + pos.y, 30 + pos.z);
      pump.castShadow = true;
      scene.add(pump);
      plantMeshes.push(pump);
      animatedObjects.push({ mesh: pump, type: 'pump', intensity: 0.15 });
    }

    // Pump drive motors (cylinders)
    var motorGeometry = new THREE.CylinderGeometry(1.8, 1.8, 3, 12);
    var motorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 });
    for (var i = 0; i < 3; i++) {
      var motor = new THREE.Mesh(motorGeometry, motorMaterial);
      motor.rotation.z = Math.PI / 2;
      motor.position.set(68, 5 + (i - 1) * 5, 30);
      motor.castShadow = true;
      scene.add(motor);
      plantMeshes.push(motor);
      animatedObjects.push({ mesh: motor, type: 'motor', intensity: 0.2 });
    }

    // Pump foundation/base
    var baseGeometry = new THREE.BoxGeometry(16, 1, 20);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.4, roughness: 0.6 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(60, 0.5, 30);
    base.castShadow = true;
    scene.add(base);
    plantMeshes.push(base);
  };

  var buildPipeNetwork = function() {
    // Above-ground pipe runs using CylinderGeometry
    var pipeSegments = [
      // Main trunk from treatment to distribution
      { start: new THREE.Vector3(-60, 8, 0), end: new THREE.Vector3(0, 8, 0) },
      { start: new THREE.Vector3(0, 8, 0), end: new THREE.Vector3(40, 8, 10) },
      { start: new THREE.Vector3(40, 8, 10), end: new THREE.Vector3(60, 8, 30) },
      // Branch lines
      { start: new THREE.Vector3(-40, 6, 20), end: new THREE.Vector3(-40, 8, 0) },
      { start: new THREE.Vector3(50, 8, 10), end: new THREE.Vector3(50, 3.5, 10) }
    ];

    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });

    for (var i = 0; i < pipeSegments.length; i++) {
      var seg = pipeSegments[i];
      var direction = new THREE.Vector3().subVectors(seg.end, seg.start);
      var distance = direction.length();
      var midpoint = new THREE.Vector3().addVectors(seg.start, seg.end).multiplyScalar(0.5);

      var pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, distance, 8);
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.position.copy(midpoint);
      pipe.lookAt(seg.end);
      pipe.rotation.x = Math.PI / 2;
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      plantMeshes.push(pipe);

      // Pipe insulation wrap (slightly larger diameter)
      var wrapGeometry = new THREE.CylinderGeometry(0.75, 0.75, distance, 8);
      var wrapMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.8 });
      var wrap = new THREE.Mesh(wrapGeometry, wrapMaterial);
      wrap.position.copy(midpoint);
      wrap.position.y -= 0.1;
      wrap.lookAt(seg.end);
      wrap.rotation.x = Math.PI / 2;
      wrap.castShadow = true;
      scene.add(wrap);
      plantMeshes.push(wrap);
    }
  };

  var buildFlowControlValves = function() {
    // Flow control valve stations
    var valvePositions = [
      { x: -30, z: 0 },
      { x: 10, z: 5 },
      { x: 40, z: 15 }
    ];

    for (var i = 0; i < valvePositions.length; i++) {
      var pos = valvePositions[i];

      // Valve body (BoxGeometry)
      var bodyGeometry = new THREE.BoxGeometry(2, 3, 2);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 7, pos.z);
      body.castShadow = true;
      scene.add(body);
      plantMeshes.push(body);

      // Valve handle (CylinderGeometry)
      var handleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
      var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.3 });
      var handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(pos.x, 8.5, pos.z);
      handle.castShadow = true;
      scene.add(handle);
      plantMeshes.push(handle);
      animatedObjects.push({ mesh: handle, type: 'valve', intensity: 0.05, originalRotation: handle.rotation.z });
    }
  };

  var buildChemicalStorageShed = function() {
    // Storage shed building
    var shedGeometry = new THREE.BoxGeometry(12, 7, 10);
    var shedMaterial = new THREE.MeshStandardMaterial({ color: 0x6a4c3a, metalness: 0.3, roughness: 0.7 });
    var shed = new THREE.Mesh(shedGeometry, shedMaterial);
    shed.position.set(-70, 3.5, -20);
    shed.castShadow = true;
    shed.receiveShadow = true;
    scene.add(shed);
    plantMeshes.push(shed);

    // Hazmat storage drums (CylinderGeometry)
    var drumPositions = [
      { x: -75, z: -18 },
      { x: -75, z: -22 },
      { x: -65, z: -18 },
      { x: -65, z: -22 }
    ];

    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.6, roughness: 0.5 });
    for (var i = 0; i < drumPositions.length; i++) {
      var pos = drumPositions[i];
      var drumGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(pos.x, 1.5, pos.z);
      drum.castShadow = true;
      scene.add(drum);
      plantMeshes.push(drum);

      // Drum lid
      var lidGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 12);
      var lidMaterial = new THREE.MeshStandardMaterial({ color: 0xcc8800, metalness: 0.7, roughness: 0.4 });
      var lid = new THREE.Mesh(lidGeometry, lidMaterial);
      lid.position.set(pos.x, 3.1, pos.z);
      scene.add(lid);
      plantMeshes.push(lid);
    }

    // Drums safety cage (BoxGeometry frame)
    var cageGeometry = new THREE.BoxGeometry(14, 4, 6);
    var cageMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
    var cage = new THREE.Mesh(cageGeometry, cageMaterial);
    cage.position.set(-70, 2, -20);
    scene.add(cage);
    plantMeshes.push(cage);
  };

  var buildControlRoom = function() {
    // Control room building
    var buildingGeometry = new THREE.BoxGeometry(16, 8, 12);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.3, roughness: 0.7 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(0, 4, -40);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    plantMeshes.push(building);

    // Control screen wall (array of BoxGeometry monitors)
    var screenWidth = 4;
    var screenHeight = 2.5;
    var screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, 0.3);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.2 });

    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 2; y++) {
        var screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(-6 + x * 5, 3.5 + y * 3, -45.85);
        screen.castShadow = true;
        scene.add(screen);
        plantMeshes.push(screen);

        // Screen glow (emissive effect via material)
        var glowGeometry = new THREE.BoxGeometry(screenWidth - 0.2, screenHeight - 0.2, 0.1);
        var glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
        var glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(-6 + x * 5, 3.5 + y * 3, -45.7);
        scene.add(glow);
        plantMeshes.push(glow);
        animatedObjects.push({ mesh: glow, type: 'screen', intensity: 0.3 });
      }
    }

    // Control desk
    var deskGeometry = new THREE.BoxGeometry(14, 1, 3);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.5 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, 1, -38);
    desk.castShadow = true;
    scene.add(desk);
    plantMeshes.push(desk);
  };

  var buildOverheadWalkway = function() {
    // Catwalk structure spanning facility
    var catwalkGeometry = new THREE.BoxGeometry(2, 0.3, 80);
    var catwalkMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6, roughness: 0.4 });
    var catwalk = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk.position.set(0, 12, -5);
    catwalk.castShadow = true;
    catwalk.receiveShadow = true;
    scene.add(catwalk);
    plantMeshes.push(catwalk);

    // Catwalk support posts (BoxGeometry)
    var postPositions = [
      { x: -35, z: -40 },
      { x: -35, z: 0 },
      { x: -35, z: 40 },
      { x: 35, z: -40 },
      { x: 35, z: 0 },
      { x: 35, z: 40 }
    ];

    var postGeometry = new THREE.BoxGeometry(1.5, 10, 1.5);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
    for (var i = 0; i < postPositions.length; i++) {
      var pos = postPositions[i];
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, 6, pos.z);
      post.castShadow = true;
      scene.add(post);
      plantMeshes.push(post);
    }

    // Railing (LineSegments)
    var railGeometry = new THREE.BufferGeometry();
    var railPositions = [];

    // Left rail
    railPositions.push(-1.5, 12.3, -40, -1.5, 12.3, 40);
    // Right rail
    railPositions.push(1.5, 12.3, -40, 1.5, 12.3, 40);

    // Vertical rail posts
    for (var i = -40; i <= 40; i += 10) {
      railPositions.push(-1.5, 12.3, i, -1.5, 11, i);
      railPositions.push(1.5, 12.3, i, 1.5, 11, i);
    }

    railGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(railPositions), 3));
    var railMaterial = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
    var railing = new THREE.LineSegments(railGeometry, railMaterial);
    scene.add(railing);
    plantMeshes.push(railing);
  };

  var buildAccessLadders = function() {
    // Ladders on tank structures (LineSegments rungs)
    var ladderPositions = [
      { x: -25, z: -15 },
      { x: 25, z: -15 }
    ];

    for (var i = 0; i < ladderPositions.length; i++) {
      var pos = ladderPositions[i];
      var ladderGeometry = new THREE.BufferGeometry();
      var ladderPts = [];

      // Ladder rungs
      for (var h = 0; h < 8; h++) {
        var yPos = h * 1.2;
        ladderPts.push(pos.x - 1, yPos, pos.z + 10);
        ladderPts.push(pos.x + 1, yPos, pos.z + 10);
      }

      ladderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderPts), 3));
      var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 3 });
      var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
      scene.add(ladder);
      plantMeshes.push(ladder);
    }
  };

  var buildPressureGauges = function() {
    // Pressure gauge dials throughout facility
    var gaugePositions = [
      { x: -60, y: 9, z: 3 },
      { x: -30, y: 8, z: 0 },
      { x: 20, y: 8, z: 25 },
      { x: 60, y: 10, z: 28 }
    ];

    var dialMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    for (var i = 0; i < gaugePositions.length; i++) {
      var pos = gaugePositions[i];

      // Gauge dial face (CylinderGeometry)
      var dialGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
      var dial = new THREE.Mesh(dialGeometry, dialMaterial);
      dial.rotation.y = Math.PI / 2;
      dial.position.set(pos.x, pos.y, pos.z);
      dial.castShadow = true;
      scene.add(dial);
      plantMeshes.push(dial);

      // Gauge mounting bracket (BoxGeometry)
      var bracketGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      var bracketMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });
      var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.set(pos.x + 0.8, pos.y - 0.3, pos.z);
      bracket.castShadow = true;
      scene.add(bracket);
      plantMeshes.push(bracket);
    }
  };

  var buildEmergencyShutoff = function() {
    // Large emergency chemical shutoff valve
    var bodyGeometry = new THREE.BoxGeometry(3, 4, 3);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.7, roughness: 0.4 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(-55, 6, 12);
    body.castShadow = true;
    scene.add(body);
    plantMeshes.push(body);

    // Large handle (CylinderGeometry)
    var handleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.9, roughness: 0.2 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-55, 7.5, 12);
    handle.castShadow = true;
    scene.add(handle);
    plantMeshes.push(handle);

    // Warning stripes on body (BoxGeometry bands)
    for (var i = 0; i < 4; i++) {
      var stripeGeometry = new THREE.BoxGeometry(3.1, 0.5, 3.1);
      var stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(-55, 4.5 + i * 0.7, 12);
      scene.add(stripe);
      plantMeshes.push(stripe);
    }
  };

  var buildPerimeterFence = function() {
    // Fence posts (BoxGeometry)
    var postGeometry = new THREE.BoxGeometry(0.5, 4, 0.5);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });

    var fencePoints = [];
    for (var angle = 0; angle < Math.PI * 2; angle += Math.PI * 2 / 12) {
      var x = Math.cos(angle) * 95;
      var z = Math.sin(angle) * 95;
      fencePoints.push({ x: x, z: z });
    }

    for (var i = 0; i < fencePoints.length; i++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(fencePoints[i].x, 2, fencePoints[i].z);
      post.castShadow = true;
      scene.add(post);
      plantMeshes.push(post);
    }

    // Fence wire (LineSegments)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePts = [];
    for (var i = 0; i < fencePoints.length; i++) {
      var current = fencePoints[i];
      var next = fencePoints[(i + 1) % fencePoints.length];
      wirePts.push(current.x, 3, current.z, next.x, 3, next.z);
    }
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePts), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    plantMeshes.push(wire);
  };

  var buildSpillContainmentBerm = function() {
    // Raised containment berm (BoxGeometry raised lip)
    var bermGeometry = new THREE.BoxGeometry(35, 2, 18);
    var bermMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6f47, metalness: 0.3, roughness: 0.8 });
    var berm = new THREE.Mesh(bermGeometry, bermMaterial);
    berm.position.set(-50, 1, -55);
    berm.castShadow = true;
    berm.receiveShadow = true;
    scene.add(berm);
    plantMeshes.push(berm);

    // Berm warning signs (BoxGeometry)
    var signGeometry = new THREE.BoxGeometry(3, 2, 0.2);
    var signMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    for (var i = 0; i < 3; i++) {
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(-65 + i * 15, 3, -55);
      scene.add(sign);
      plantMeshes.push(sign);
    }
  };

  var update = function(delta) {
    // Clarification tank surface swirl
    for (var i = 0; i < clarificationTanks.length; i++) {
      var tank = clarificationTanks[i];
      tank.mesh.rotation.y += delta * 0.3;
    }

    // UV light pulse animation
    for (var i = 0; i < uvLights.length; i++) {
      var light = uvLights[i];
      light.pulse += delta * 2;
      var pulseIntensity = 0.5 + Math.sin(light.pulse) * 0.3;
      light.mesh.material.opacity = Math.max(0.3, light.originalIntensity * pulseIntensity);
    }

    // Pump house vibration
    for (var i = 0; i < pumpHouses.length; i++) {
      var house = pumpHouses[i];
      house.vibration += delta * 0.1;
      house.building.position.y = 5 + Math.sin(house.vibration) * 0.05;
    }

    // Chemical drips from dosing tanks
    for (var i = 0; i < chemicalDrips.length; i++) {
      var dripSource = chemicalDrips[i];
      dripSource.pulse = (dripSource.pulse || 0) + delta;

      if (dripSource.pulse > 1 / dripSource.rate) {
        dripSource.pulse = 0;
        // Create drop
        var dropGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        var dropMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        var drop = new THREE.Mesh(dropGeometry, dropMaterial);
        drop.position.copy(dripSource.position);
        drop.velocity = new THREE.Vector3(0, -5, 0);
        drop.age = 0;
        scene.add(drop);
        dripSource.drops.push(drop);
      }

      // Update existing drops
      for (var j = dripSource.drops.length - 1; j >= 0; j--) {
        var drop = dripSource.drops[j];
        drop.age += delta;
        drop.position.addScaledVector(drop.velocity, delta);

        if (drop.age > 2) {
          scene.remove(drop);
          dripSource.drops.splice(j, 1);
        }
      }
    }

    // Animated object movements
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      var time = Date.now() * 0.001;

      if (obj.type === 'pump') {
        obj.mesh.position.x += Math.sin(time * 3) * obj.intensity * delta;
      } else if (obj.type === 'motor') {
        obj.mesh.rotation.z += delta * 5;
      } else if (obj.type === 'valve') {
        if (obj.originalRotation !== undefined) {
          obj.mesh.rotation.z = obj.originalRotation + Math.sin(time * 2) * 0.3;
        }
      } else if (obj.type === 'screen') {
        var flicker = Math.sin(time * 8) * 0.2;
        obj.mesh.material.emissive.setHex(parseInt(0x00aa00 * (0.5 + flicker)));
      }
    }
  };

  var reset = function() {
    // Remove all meshes
    for (var i = plantMeshes.length - 1; i >= 0; i--) {
      scene.remove(plantMeshes[i]);
    }
    plantMeshes = [];
    clarificationTanks = [];
    uvLights = [];
    pumpHouses = [];
    chemicalDrips = [];
    animatedObjects = [];

    // Re-initialize facility
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
