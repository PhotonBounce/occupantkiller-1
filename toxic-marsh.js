window.ToxicMarsh = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];

  var colors = {
    toxicGreen: 0x39ff14,
    toxicYellow: 0xffff00,
    darkGreen: 0x1a4d1a,
    blackDeath: 0x1a1a1a,
    hazmatOrange: 0xff8c00,
    deadBrown: 0x3d2817,
    rustyRed: 0x8b4513,
    hazardGray: 0x4d4d4d
  };

  function createToxicWaterPool(x, y, z, width, depth) {
    var geometry = new THREE.BoxGeometry(width, 0.3, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.toxicGreen,
      emissive: colors.toxicGreen,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.1
    });
    var pool = new THREE.Mesh(geometry, material);
    pool.position.set(x, y, z);
    scene.add(pool);
    objects.push(pool);

    // Add bubbling effect with spheres
    var bubbleCount = Math.floor(Math.random() * 3) + 2;
    for (var i = 0; i < bubbleCount; i++) {
      var bubbleGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6);
      var bubbleMat = new THREE.MeshStandardMaterial({
        color: colors.toxicYellow,
        emissive: colors.toxicYellow,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.6
      });
      var bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(
        x + (Math.random() - 0.5) * width * 0.8,
        y + 0.5,
        z + (Math.random() - 0.5) * depth * 0.8
      );
      bubble.userData.baseY = bubble.position.y;
      bubble.userData.bobSpeed = 0.5 + Math.random() * 1;
      bubble.userData.bobAmount = 0.4 + Math.random() * 0.3;
      scene.add(bubble);
      objects.push(bubble);
      animatedObjects.push(bubble);
    }
  }

  function createGasDisposalTower(x, y, z) {
    // Main tower cylinder
    var towerGeo = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
    var towerMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      metalness: 0.8,
      roughness: 0.3
    });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x, y + 4, z);
    scene.add(tower);
    objects.push(tower);

    // Cone nozzle at top
    var nozzleGeo = new THREE.ConeGeometry(0.8, 1.5, 8);
    var nozzleMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      metalness: 0.9,
      roughness: 0.2
    });
    var nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(x, y + 8.5, z);
    scene.add(nozzle);
    objects.push(nozzle);

    // Gas cloud effect from nozzle
    var gasGeo = new THREE.SphereGeometry(1.5, 8, 8);
    var gasMat = new THREE.MeshStandardMaterial({
      color: colors.toxicYellow,
      emissive: colors.toxicYellow,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.3
    });
    var gasCloud = new THREE.Mesh(gasGeo, gasMat);
    gasCloud.position.set(x, y + 9.5, z);
    gasCloud.userData.baseY = gasCloud.position.y;
    gasCloud.userData.driftSpeed = 0.3 + Math.random() * 0.2;
    gasCloud.userData.driftAmount = 1 + Math.random() * 0.5;
    gasCloud.userData.expandSpeed = 0.5;
    gasCloud.userData.maxScale = 3;
    gasCloud.scale.set(0.5, 0.5, 0.5);
    scene.add(gasCloud);
    objects.push(gasCloud);
    animatedObjects.push(gasCloud);

    // Base platform
    var baseGeo = new THREE.CylinderGeometry(2, 2.2, 0.4, 8);
    var baseMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.6
    });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(x, y, z);
    scene.add(base);
    objects.push(base);
  }

  function createChemicalSilo(x, y, z) {
    // Large storage cylinder
    var siloGeo = new THREE.CylinderGeometry(2, 2.2, 10, 12);
    var siloMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      metalness: 0.7,
      roughness: 0.4
    });
    var silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.set(x, y + 5, z);
    scene.add(silo);
    objects.push(silo);

    // Top dome
    var domeGeo = new THREE.SphereGeometry(2, 12, 6);
    var domeMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      metalness: 0.8
    });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.set(x, y + 10.5, z);
    dome.scale.set(1, 0.6, 1);
    scene.add(dome);
    objects.push(dome);

    // Warning panels
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var panelX = x + Math.cos(angle) * 2.5;
      var panelZ = z + Math.sin(angle) * 2.5;
      var panelGeo = new THREE.BoxGeometry(0.8, 1.2, 0.2);
      var panelMat = new THREE.MeshStandardMaterial({
        color: colors.blackDeath,
        emissive: colors.hazmatOrange,
        emissiveIntensity: 0.3
      });
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(panelX, y + 4, panelZ);
      panel.lookAt(x, y + 4, z);
      scene.add(panel);
      objects.push(panel);
    }

    // Valve cylinder on side
    var valveGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
    var valveMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.8
    });
    var valve = new THREE.Mesh(valveGeo, valveMat);
    valve.position.set(x + 2.5, y + 3, z);
    valve.rotation.z = Math.PI / 2;
    scene.add(valve);
    objects.push(valve);
  }

  function createDeadTree(x, y, z) {
    // Trunk
    var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 6);
    var trunkMat = new THREE.MeshStandardMaterial({
      color: colors.blackDeath,
      roughness: 0.8
    });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, y + 3, z);
    trunk.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(trunk);
    objects.push(trunk);

    // Dead branches as smaller cylinders
    var branchCount = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < branchCount; i++) {
      var branchGeo = new THREE.CylinderGeometry(0.1, 0.15, 2 + Math.random() * 1.5, 4);
      var branchMat = new THREE.MeshStandardMaterial({
        color: colors.deadBrown,
        roughness: 0.9
      });
      var branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.set(
        x + (Math.random() - 0.5) * 1.5,
        y + 3 + Math.random() * 4,
        z + (Math.random() - 0.5) * 1.5
      );
      branch.rotation.set(
        (Math.random() - 0.5) * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI
      );
      scene.add(branch);
      objects.push(branch);
    }
  }

  function createTestBunker(x, y, z) {
    // Main bunker structure
    var bunkerGeo = new THREE.BoxGeometry(4, 3, 5);
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      roughness: 0.7,
      metalness: 0.3
    });
    var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
    bunker.position.set(x, y + 1.5, z);
    scene.add(bunker);
    objects.push(bunker);

    // Blast shutters (BoxGeometry doors)
    for (var i = 0; i < 2; i++) {
      var shutterGeo = new THREE.BoxGeometry(1.5, 2.2, 0.4);
      var shutterMat = new THREE.MeshStandardMaterial({
        color: colors.blackDeath,
        metalness: 0.9,
        roughness: 0.2
      });
      var shutter = new THREE.Mesh(shutterGeo, shutterMat);
      shutter.position.set(
        x + (i === 0 ? -1.2 : 1.2),
        y + 1.5,
        z + 2.6
      );
      scene.add(shutter);
      objects.push(shutter);
    }

    // Roof ventilation cylinder
    var ventGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 6);
    var ventMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.7
    });
    var vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(x - 1, y + 3.1, z);
    scene.add(vent);
    objects.push(vent);

    var vent2 = vent.clone();
    vent2.position.set(x + 1, y + 3.1, z);
    scene.add(vent2);
    objects.push(vent2);
  }

  function createDecontaminationShower(x, y, z) {
    // Shower stall walls
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var wallX = x + Math.cos(angle) * 1;
      var wallZ = z + Math.sin(angle) * 1;
      var wallGeo = new THREE.BoxGeometry(0.2, 2.5, 2);
      var wallMat = new THREE.MeshStandardMaterial({
        color: colors.hazardGray,
        metalness: 0.5
      });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallX, y + 1.25, wallZ);
      wall.rotation.y = angle;
      scene.add(wall);
      objects.push(wall);
    }

    // Shower pipe
    var pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    var pipeMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.8
    });
    var pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(x, y + 2, z);
    scene.add(pipe);
    objects.push(pipe);

    // Shower head sphere
    var headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.9
    });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(x, y + 2.5, z);
    scene.add(head);
    objects.push(head);
  }

  function createWarningPerimeter(x, y, z) {
    // Warning sign BoxGeometry
    var signGeo = new THREE.BoxGeometry(1, 1.2, 0.2);
    var signMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      emissive: colors.hazmatOrange,
      emissiveIntensity: 0.2
    });
    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, y + 1, z);
    scene.add(sign);
    objects.push(sign);

    // Post cylinder
    var postGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 6);
    var postMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.6
    });
    var post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, y + 0.75, z);
    scene.add(post);
    objects.push(post);
  }

  function createCorpse(x, y, z) {
    // Body box
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.5, 0.3);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: colors.blackDeath,
      roughness: 0.9
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y + 0.75, z);
    body.rotation.z = (Math.random() - 0.5) * 0.5;
    scene.add(body);
    objects.push(body);

    // Head sphere
    var headGeo = new THREE.SphereGeometry(0.25, 6, 6);
    var headMat = new THREE.MeshStandardMaterial({
      color: colors.deadBrown,
      roughness: 0.8
    });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(x, y + 1.8, z);
    scene.add(head);
    objects.push(head);

    // Scattered equipment (small boxes)
    for (var i = 0; i < 2; i++) {
      var equipGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
      var equipMat = new THREE.MeshStandardMaterial({
        color: colors.hazardGray,
        metalness: 0.5
      });
      var equip = new THREE.Mesh(equipGeo, equipMat);
      equip.position.set(
        x + (Math.random() - 0.5) * 1,
        y + 0.15,
        z + (Math.random() - 0.5) * 1
      );
      scene.add(equip);
      objects.push(equip);
    }
  }

  function createDrainageChannel(x, y, z, length, direction) {
    var channelGeo = new THREE.BoxGeometry(
      direction === 'x' ? length : 1.5,
      0.3,
      direction === 'z' ? length : 1.5
    );
    var channelMat = new THREE.MeshStandardMaterial({
      color: colors.darkGreen,
      roughness: 0.6
    });
    var channel = new THREE.Mesh(channelGeo, channelMat);
    channel.position.set(x, y, z);
    scene.add(channel);
    objects.push(channel);

    // Channel walls
    var wallHeight = 0.8;
    var wallCount = direction === 'x' ? 2 : 2;
    for (var i = 0; i < wallCount; i++) {
      var wallGeo = new THREE.BoxGeometry(
        direction === 'x' ? length : 0.3,
        wallHeight,
        0.3
      );
      var wallMat = new THREE.MeshStandardMaterial({
        color: colors.hazardGray,
        metalness: 0.4
      });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      var offset = i === 0 ? -0.75 : 0.75;
      wall.position.set(
        direction === 'x' ? x : x + offset,
        y + wallHeight / 2,
        direction === 'z' ? z : z + offset
      );
      scene.add(wall);
      objects.push(wall);
    }
  }

  function createMonitoringEquipment(x, y, z) {
    // Sensor array base
    var baseGeo = new THREE.BoxGeometry(1.5, 0.3, 1.5);
    var baseMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.6
    });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(x, y, z);
    scene.add(base);
    objects.push(base);

    // Sensor array on pole
    var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 6);
    var poleMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.7
    });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, y + 1.3, z);
    scene.add(pole);
    objects.push(pole);

    // Sensor boxes
    for (var i = 0; i < 3; i++) {
      var sensorGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var sensorMat = new THREE.MeshStandardMaterial({
        color: colors.toxicGreen,
        emissive: colors.toxicGreen,
        emissiveIntensity: 0.2,
        metalness: 0.8
      });
      var sensor = new THREE.Mesh(sensorGeo, sensorMat);
      var angle = (i / 3) * Math.PI * 2;
      sensor.position.set(
        x + Math.cos(angle) * 0.8,
        y + 2.2 + (i - 1) * 0.3,
        z + Math.sin(angle) * 0.8
      );
      scene.add(sensor);
      objects.push(sensor);

      // Wire connections using LineSegments
      var lineGeo = new THREE.BufferGeometry();
      var positions = new Float32Array([
        x, y + 2, z,
        sensor.position.x, sensor.position.y, sensor.position.z
      ]);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var lineMat = new THREE.LineBasicMaterial({ color: colors.hazardGray });
      var line = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(line);
      objects.push(line);
    }
  }

  function createHazmatTruck(x, y, z) {
    // Truck body box
    var bodyGeo = new THREE.BoxGeometry(2.5, 2, 5);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      metalness: 0.6
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, y + 1, z);
    scene.add(body);
    objects.push(body);

    // Cabin box
    var cabinGeo = new THREE.BoxGeometry(2.2, 1.8, 1.5);
    var cabinMat = new THREE.MeshStandardMaterial({
      color: colors.hazardGray,
      metalness: 0.5
    });
    var cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(x, y + 1, z + 3);
    scene.add(cabin);
    objects.push(cabin);

    // Wheels (cylinders)
    for (var i = 0; i < 4; i++) {
      var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
      var wheelMat = new THREE.MeshStandardMaterial({
        color: colors.blackDeath,
        metalness: 0.7
      });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      var wheelX = x + (i < 2 ? -1.3 : 1.3);
      var wheelZ = z + (i % 2 === 0 ? -1.8 : 1.8);
      wheel.position.set(wheelX, y + 0.5, wheelZ);
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
      objects.push(wheel);
    }

    // Hazard warning panels on sides
    var panelGeo = new THREE.BoxGeometry(0.2, 1.2, 2);
    var panelMat = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      emissive: colors.hazmatOrange,
      emissiveIntensity: 0.3
    });
    var panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(x + 1.35, y + 1, z);
    scene.add(panel);
    objects.push(panel);
  }

  function createCrater(x, y, z, radius) {
    // Crater depression (mostly visual, boxes forming bottom)
    var craterGeo = new THREE.BoxGeometry(radius * 2, 1, radius * 2);
    var craterMat = new THREE.MeshStandardMaterial({
      color: colors.toxicGreen,
      emissive: colors.toxicGreen,
      emissiveIntensity: 0.2,
      roughness: 0.8
    });
    var crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(x, y - 0.5, z);
    scene.add(crater);
    objects.push(crater);

    // Crater walls using cylinder segments
    var wallSegments = 6;
    for (var i = 0; i < wallSegments; i++) {
      var angle = (i / wallSegments) * Math.PI * 2;
      var wallX = x + Math.cos(angle) * radius;
      var wallZ = z + Math.sin(angle) * radius;

      var wallGeo = new THREE.BoxGeometry(radius * 0.5, 0.8, 0.4);
      var wallMat = new THREE.MeshStandardMaterial({
        color: colors.blackDeath,
        roughness: 0.9
      });
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallX, y - 0.2, wallZ);
      wall.rotation.y = angle;
      scene.add(wall);
      objects.push(wall);
    }

    // Toxic liquid puddles in crater
    var puddles = 2 + Math.floor(Math.random() * 2);
    for (var p = 0; p < puddles; p++) {
      var pudGeo = new THREE.BoxGeometry(radius * 0.6, 0.1, radius * 0.6);
      var pudMat = new THREE.MeshStandardMaterial({
        color: colors.toxicYellow,
        emissive: colors.toxicYellow,
        emissiveIntensity: 0.3
      });
      var puddle = new THREE.Mesh(pudGeo, pudMat);
      var pudAngle = Math.random() * Math.PI * 2;
      puddle.position.set(
        x + Math.cos(pudAngle) * (radius * 0.4),
        y - 0.48,
        z + Math.sin(pudAngle) * (radius * 0.4)
      );
      scene.add(puddle);
      objects.push(puddle);
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];

    var centerX = 0;
    var centerY = 0;
    var centerZ = 0;

    // Create toxic water pools scattered around
    createToxicWaterPool(-20, 0, -15, 8, 6);
    createToxicWaterPool(15, 0, 20, 10, 8);
    createToxicWaterPool(-10, 0, 15, 7, 7);
    createToxicWaterPool(25, 0, -5, 8, 9);
    createToxicWaterPool(5, 0, -25, 9, 7);

    // Gas disposal towers
    createGasDisposalTower(-25, 0, 10);
    createGasDisposalTower(20, 0, -20);
    createGasDisposalTower(0, 0, 25);
    createGasDisposalTower(-15, 0, -25);

    // Chemical silos
    createChemicalSilo(30, 0, 15);
    createChemicalSilo(-30, 0, -15);
    createChemicalSilo(10, 0, -30);

    // Dead trees scattered
    createDeadTree(-18, 0, 8);
    createDeadTree(12, 0, -10);
    createDeadTree(-8, 0, -15);
    createDeadTree(22, 0, 5);
    createDeadTree(-25, 0, 20);
    createDeadTree(5, 0, 28);
    createDeadTree(28, 0, -8);
    createDeadTree(-5, 0, 18);

    // Test bunkers
    createTestBunker(-35, 0, 25);
    createTestBunker(35, 0, -25);
    createTestBunker(0, 0, -35);

    // Decontamination showers
    createDecontaminationShower(-30, 0, 10);
    createDecontaminationShower(25, 0, 30);
    createDecontaminationShower(10, 0, -20);

    // Warning perimeter signs
    var perimeterRadius = 42;
    var perimeterSigns = 8;
    for (var i = 0; i < perimeterSigns; i++) {
      var angle = (i / perimeterSigns) * Math.PI * 2;
      var signX = centerX + Math.cos(angle) * perimeterRadius;
      var signZ = centerZ + Math.sin(angle) * perimeterRadius;
      createWarningPerimeter(signX, 0, signZ);
    }

    // Scattered corpses and equipment
    createCorpse(-15, 0, -8);
    createCorpse(18, 0, 10);
    createCorpse(-8, 0, 22);
    createCorpse(25, 0, -15);
    createCorpse(-20, 0, -18);
    createCorpse(8, 0, 8);
    createCorpse(35, 0, 8);
    createCorpse(-30, 0, 5);

    // Drainage channels connecting pools
    createDrainageChannel(-10, 0, 0, 15, 'x');
    createDrainageChannel(0, 0, 10, 12, 'z');
    createDrainageChannel(10, 0, -5, 10, 'x');

    // Monitoring equipment arrays
    createMonitoringEquipment(-15, 0, 15);
    createMonitoringEquipment(20, 0, 10);
    createMonitoringEquipment(5, 0, -25);
    createMonitoringEquipment(-25, 0, -10);

    // Hazmat trucks at perimeter
    createHazmatTruck(38, 0, 0);
    createHazmatTruck(-38, 0, 5);
    createHazmatTruck(0, 0, 38);
    createHazmatTruck(-5, 0, -38);

    // Impact craters
    createCrater(-12, 0, -20, 4);
    createCrater(18, 0, 15, 3.5);
    createCrater(-22, 0, 10, 4.5);
    createCrater(28, 0, -12, 3);
    createCrater(-8, 0, 25, 3.8);

    // More gas clouds wandering
    for (var g = 0; g < 3; g++) {
      var cloudGeo = new THREE.SphereGeometry(2, 8, 8);
      var cloudMat = new THREE.MeshStandardMaterial({
        color: colors.toxicYellow,
        emissive: colors.toxicGreen,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.25
      });
      var cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        (Math.random() - 0.5) * 70,
        3 + Math.random() * 4,
        (Math.random() - 0.5) * 70
      );
      cloud.userData.baseY = cloud.position.y;
      cloud.userData.driftSpeed = 0.2 + Math.random() * 0.3;
      cloud.userData.driftAmount = 2 + Math.random() * 1;
      cloud.userData.driftOffsetX = Math.random() * Math.PI * 2;
      cloud.userData.driftOffsetZ = Math.random() * Math.PI * 2;
      scene.add(cloud);
      objects.push(cloud);
      animatedObjects.push(cloud);
    }

    // Additional environmental boxes and cylinders for detail
    // Storage containers
    for (var s = 0; s < 5; s++) {
      var containerGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var containerMat = new THREE.MeshStandardMaterial({
        color: colors.hazmatOrange,
        emissive: colors.hazmatOrange,
        emissiveIntensity: 0.1,
        metalness: 0.6
      });
      var container = new THREE.Mesh(containerGeo, containerMat);
      container.position.set(
        (Math.random() - 0.5) * 60,
        0.75,
        (Math.random() - 0.5) * 60
      );
      scene.add(container);
      objects.push(container);
    }

    // Pipe systems
    for (var pi = 0; pi < 6; pi++) {
      var pipeStartX = (Math.random() - 0.5) * 60;
      var pipeStartZ = (Math.random() - 0.5) * 60;
      var pipeLength = 10 + Math.random() * 15;
      var pipeDir = Math.random() > 0.5 ? 'x' : 'z';

      var systemPipeGeo = new THREE.CylinderGeometry(0.2, 0.2, pipeLength, 8);
      var systemPipeMat = new THREE.MeshStandardMaterial({
        color: colors.hazardGray,
        metalness: 0.7
      });
      var systemPipe = new THREE.Mesh(systemPipeGeo, systemPipeMat);
      systemPipe.position.set(pipeStartX, 0.5, pipeStartZ);
      if (pipeDir === 'x') {
        systemPipe.rotation.z = Math.PI / 2;
        systemPipe.position.x += pipeLength / 2;
      } else {
        systemPipe.rotation.x = Math.PI / 2;
        systemPipe.position.z += pipeLength / 2;
      }
      scene.add(systemPipe);
      objects.push(systemPipe);
    }

    // Fencing/barriers
    for (var f = 0; f < 12; f++) {
      var fenceGeo = new THREE.BoxGeometry(3, 2, 0.2);
      var fenceMat = new THREE.MeshStandardMaterial({
        color: colors.hazardGray,
        metalness: 0.5
      });
      var fence = new THREE.Mesh(fenceGeo, fenceMat);
      var fenceAngle = (f / 12) * Math.PI * 2;
      fence.position.set(
        Math.cos(fenceAngle) * 45,
        1,
        Math.sin(fenceAngle) * 45
      );
      fence.rotation.y = fenceAngle + Math.PI / 2;
      scene.add(fence);
      objects.push(fence);
    }

    // Ground reference markers
    for (var m = 0; m < 8; m++) {
      var markerGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
      var markerMat = new THREE.MeshStandardMaterial({
        color: colors.hazmatOrange,
        emissive: colors.hazmatOrange,
        emissiveIntensity: 0.2
      });
      var marker = new THREE.Mesh(markerGeo, markerMat);
      var markerAngle = (m / 8) * Math.PI * 2;
      marker.position.set(
        Math.cos(markerAngle) * 30,
        0.25,
        Math.sin(markerAngle) * 30
      );
      scene.add(marker);
      objects.push(marker);
    }

    // Additional small scattered cylinders for visual complexity
    for (var c = 0; c < 10; c++) {
      var scrapGeo = new THREE.CylinderGeometry(
        0.2 + Math.random() * 0.3,
        0.2 + Math.random() * 0.3,
        1 + Math.random() * 1.5,
        6
      );
      var scrapMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? colors.hazardGray : colors.rustyRed,
        metalness: 0.6 + Math.random() * 0.3
      });
      var scrap = new THREE.Mesh(scrapGeo, scrapMat);
      scrap.position.set(
        (Math.random() - 0.5) * 70,
        0.5 + Math.random() * 1,
        (Math.random() - 0.5) * 70
      );
      scrap.rotation.set(
        (Math.random() - 0.5) * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI
      );
      scene.add(scrap);
      objects.push(scrap);
    }

    // Additional sphere gas cloud formations
    for (var gs = 0; gs < 5; gs++) {
      var gasFormGeo = new THREE.SphereGeometry(1 + Math.random() * 0.5, 6, 6);
      var gasFormMat = new THREE.MeshStandardMaterial({
        color: colors.toxicGreen,
        emissive: colors.toxicYellow,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.1
      });
      var gasForm = new THREE.Mesh(gasFormGeo, gasFormMat);
      gasForm.position.set(
        (Math.random() - 0.5) * 70,
        2 + Math.random() * 5,
        (Math.random() - 0.5) * 70
      );
      gasForm.userData.baseY = gasForm.position.y;
      gasForm.userData.wobbleSpeed = 0.3 + Math.random() * 0.2;
      scene.add(gasForm);
      objects.push(gasForm);
      animatedObjects.push(gasForm);
    }
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      // Bubbling effect for water pools
      if (obj.userData.bobSpeed) {
        obj.position.y = obj.userData.baseY + Math.sin(Date.now() * 0.001 * obj.userData.bobSpeed) * obj.userData.bobAmount;
      }

      // Drifting gas clouds
      if (obj.userData.driftSpeed && !obj.userData.expandSpeed) {
        obj.position.x += Math.sin(Date.now() * 0.0005 * obj.userData.driftSpeed) * obj.userData.driftAmount * delta;
        obj.position.z += Math.cos(Date.now() * 0.0005 * obj.userData.driftSpeed) * obj.userData.driftAmount * delta;
        obj.position.y = obj.userData.baseY + Math.sin(Date.now() * 0.0003) * 0.5;
      }

      // Tower gas cloud expansion and contraction
      if (obj.userData.expandSpeed) {
        var expandAmount = Math.sin(Date.now() * 0.001) * 0.5 + 1;
        obj.scale.set(expandAmount * 0.5, expandAmount * 0.5, expandAmount * 0.5);
      }

      // Wobbling floating gas formations
      if (obj.userData.wobbleSpeed && !obj.userData.expandSpeed && !obj.userData.driftSpeed) {
        obj.position.y = obj.userData.baseY + Math.sin(Date.now() * 0.0008 * obj.userData.wobbleSpeed) * 1.2;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var m = 0; m < objects[i].material.length; m++) {
            objects[i].material[m].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }
    objects = [];
    animatedObjects = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
