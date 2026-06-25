window.SandstormBase = (function() {
  'use strict';

  var state = {
    objects: [],
    particles: null,
    antennas: [],
    generators: [],
    ropeLines: [],
    vehicles: [],
    driftingSand: [],
    windTime: 0,
    stormIntensity: 0,
    spawnPoints: []
  };

  var colorScheme = {
    hescoTan: 0xD4B087,
    desertSand: 0xC2A05A,
    stormBrown: 0x8B6F47,
    stormOrange: 0xE6975C,
    militaryGreen: 0x4A5C3A,
    emergencyRed: 0xFF3333,
    metal: 0x888888,
    darkSand: 0x9B8B6F
  };

  function init(scene, camera) {
    reset();

    // Create main command building - modular blocks
    var commandPos = new THREE.Vector3(0, 0, 0);
    createCommandBuilding(scene, commandPos);

    // Create HESCO barriers perimeter
    createHESCOPerimeter(scene);

    // Create guard posts at cardinal points
    createGuardPosts(scene);

    // Create vehicle motor pool
    createMotorPool(scene);

    // Create antenna tower
    createAntennaTower(scene);

    // Create fuel bladder farm
    createFuelBladders(scene);

    // Create generator set
    createGenerators(scene);

    // Create medical station
    createMedicalStation(scene);

    // Create ammo point with berm
    createAmmoPoint(scene);

    // Create water buffalo
    createWaterBuffalo(scene);

    // Create half-buried equipment mound
    createHalfBuriedEquipment(scene);

    // Create rope guide lines
    createRopeGuideLines(scene);

    // Create sand drifts against walls
    createSandDrifts(scene);

    // Create storm sand particle cloud wall
    createStormParticleWall(scene);

    // Setup spawn points
    setupSpawnPoints();
  }

  function createCommandBuilding(scene, pos) {
    var buildingGroup = new THREE.Group();
    buildingGroup.position.copy(pos);

    // Main structure - modular blocks
    var block1 = createBox(8, 4, 6, colorScheme.hescoTan, 0, 2, 0);
    var block2 = createBox(6, 4, 8, colorScheme.stormBrown, 4, 2, 4);
    var block3 = createBox(5, 3, 5, colorScheme.darkSand, -3, 1.5, -3);

    buildingGroup.add(block1);
    buildingGroup.add(block2);
    buildingGroup.add(block3);

    // Roof sections
    var roofSection1 = createBox(8, 0.5, 6, colorScheme.metal, 0, 4.25, 0);
    var roofSection2 = createBox(6, 0.5, 8, colorScheme.militaryGreen, 4, 4.25, 4);

    buildingGroup.add(roofSection1);
    buildingGroup.add(roofSection2);

    // Windows - small boxes representing openings
    var window1 = createBox(0.8, 1.2, 0.3, 0x1a1a1a, 0, 2.5, 3.1);
    var window2 = createBox(0.8, 1.2, 0.3, 0x1a1a1a, 2, 2.5, 3.1);
    var window3 = createBox(1.2, 0.8, 0.3, 0x1a1a1a, 0, 2.5, -3.1);

    buildingGroup.add(window1);
    buildingGroup.add(window2);
    buildingGroup.add(window3);

    // Sandbag barriers around entrance
    var sandbag1 = createBox(3, 1.5, 1.5, colorScheme.desertSand, -2, 0.75, -4);
    var sandbag2 = createBox(3, 1.5, 1.5, colorScheme.desertSand, 2, 0.75, -4);

    buildingGroup.add(sandbag1);
    buildingGroup.add(sandbag2);

    scene.add(buildingGroup);
    state.objects.push(buildingGroup);

    // Add spawn point at command building
    state.spawnPoints.push(new THREE.Vector3(pos.x, pos.y + 5, pos.z - 8));
  }

  function createHESCOPerimeter(scene) {
    var positions = [
      new THREE.Vector3(0, 0, -25),
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(0, 0, 25),
      new THREE.Vector3(-25, 0, 0)
    ];

    positions.forEach(function(pos, idx) {
      var perimeterGroup = new THREE.Group();
      perimeterGroup.position.copy(pos);

      // Stack HESCO barriers - 3 high
      for (var i = 0; i < 3; i++) {
        var hesco1 = createBox(5, 1.8, 1.2, colorScheme.hescoTan, 0, i * 1.8 + 0.9, 0);
        var hesco2 = createBox(5, 1.8, 1.2, colorScheme.stormBrown, 0, i * 1.8 + 0.9, -1.2);
        perimeterGroup.add(hesco1);
        perimeterGroup.add(hesco2);
      }

      // Mesh pattern on HESCO
      var meshPattern = createBox(5, 5.4, 0.1, 0x666666, 0, 2.7, 0.1);
      perimeterGroup.add(meshPattern);

      scene.add(perimeterGroup);
      state.objects.push(perimeterGroup);

      // Spawn point at first barrier
      if (idx === 0) {
        state.spawnPoints.push(new THREE.Vector3(pos.x, pos.y + 7, pos.z + 8));
      }
    });
  }

  function createGuardPosts(scene) {
    var positions = [
      new THREE.Vector3(15, 0, 15),
      new THREE.Vector3(-15, 0, 15),
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(15, 0, -15)
    ];

    positions.forEach(function(pos) {
      var postGroup = new THREE.Group();
      postGroup.position.copy(pos);

      // Sandbag bunker base
      var bunkerBase = createBox(4, 1.5, 4, colorScheme.desertSand, 0, 0.75, 0);
      postGroup.add(bunkerBase);

      // Sandbag walls
      var frontWall = createBox(4, 2, 0.8, colorScheme.desertSand, 0, 2.4, 1.6);
      var sideWall1 = createBox(0.8, 2, 3.2, colorScheme.desertSand, 1.6, 2.4, 0);
      postGroup.add(frontWall);
      postGroup.add(sideWall1);

      // Gun emplacement - small cylindrical mount
      var gunMount = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: colorScheme.militaryGreen })
      );
      gunMount.position.set(0, 2.8, 0);
      postGroup.add(gunMount);

      // Wooden shooting rest box
      var shootRest = createBox(2, 0.5, 1.2, 0x5C4033, 0, 2.5, 1);
      postGroup.add(shootRest);

      scene.add(postGroup);
      state.objects.push(postGroup);
    });
  }

  function createMotorPool(scene) {
    var motorPoolGroup = new THREE.Group();
    motorPoolGroup.position.set(18, 0, -8);

    // Create 3 HMMWV shapes
    var hmmwv1Pos = new THREE.Vector3(-6, 0, 0);
    var hmmwv2Pos = new THREE.Vector3(0, 0, 0);
    var hmmwv3Pos = new THREE.Vector3(6, 0, 0);

    [hmmwv1Pos, hmmwv2Pos, hmmwv3Pos].forEach(function(vpos) {
      var hmmwv = new THREE.Group();
      hmmwv.position.copy(vpos);

      // Vehicle body
      var body = createBox(2.2, 2, 4.5, colorScheme.militaryGreen, 0, 1, 0);
      var cabin = createBox(2, 1.8, 2, colorScheme.militaryGreen, 0, 2.3, 0.8);
      hmmwv.add(body);
      hmmwv.add(cabin);

      // Wheels
      var wheel1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel1.rotation.z = Math.PI / 2;
      wheel1.position.set(-1, 0.6, 1.2);
      hmmwv.add(wheel1);

      var wheel2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel2.rotation.z = Math.PI / 2;
      wheel2.position.set(1, 0.6, 1.2);
      hmmwv.add(wheel2);

      var wheel3 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel3.rotation.z = Math.PI / 2;
      wheel3.position.set(-1, 0.6, -1.2);
      hmmwv.add(wheel3);

      var wheel4 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x222222 })
      );
      wheel4.rotation.z = Math.PI / 2;
      wheel4.position.set(1, 0.6, -1.2);
      hmmwv.add(wheel4);

      motorPoolGroup.add(hmmwv);
      state.vehicles.push(hmmwv);
    });

    // Supply truck
    var truck = new THREE.Group();
    truck.position.set(-8, 0, 5);
    var truckCab = createBox(2, 2, 3, colorScheme.stormBrown, 0, 1, -2);
    var truckBed = createBox(2.4, 2, 5, colorScheme.stormBrown, 0, 1, 2);
    truck.add(truckCab);
    truck.add(truckBed);
    motorPoolGroup.add(truck);
    state.vehicles.push(truck);

    scene.add(motorPoolGroup);
    state.objects.push(motorPoolGroup);

    // Motor pool spawn point
    state.spawnPoints.push(new THREE.Vector3(18, 5, -8));
  }

  function createAntennaTower(scene) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(-18, 0, 8);

    // Base plate
    var basePlate = createBox(3, 0.5, 3, colorScheme.metal, 0, 0.25, 0);
    towerGroup.add(basePlate);

    // Main mast - cylinder
    var mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 12, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.metal })
    );
    mast.position.y = 6;
    towerGroup.add(mast);

    // Antenna state tracking
    var antenna = {
      mesh: mast,
      baseRotation: 0,
      baseY: 6
    };
    state.antennas.push(antenna);

    // Lattice structure - crossbars
    for (var i = 0; i < 4; i++) {
      var crossbar = createBox(2.5, 0.2, 0.2, colorScheme.militaryGreen, 0, 2 + i * 2.5, 0);
      towerGroup.add(crossbar);
    }

    // Antenna elements at top
    var horizontalAntenna = createBox(3.5, 0.2, 0.2, colorScheme.militaryGreen, 0, 11, 0);
    var verticalAntenna = createBox(0.2, 2, 0.2, colorScheme.militaryGreen, 0, 12, 0);
    towerGroup.add(horizontalAntenna);
    towerGroup.add(verticalAntenna);

    // GPS dome on top
    var gpsDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
    );
    gpsDome.position.y = 13;
    towerGroup.add(gpsDome);

    scene.add(towerGroup);
    state.objects.push(towerGroup);
  }

  function createFuelBladders(scene) {
    var bladderFarmGroup = new THREE.Group();
    bladderFarmGroup.position.set(-12, 0, -15);

    // Create 3 large fuel bladder tanks
    for (var i = 0; i < 3; i++) {
      var bladderGroup = new THREE.Group();
      bladderGroup.position.x = i * 5;

      // Main tank body
      var tank = createBox(3, 2.5, 3.5, colorScheme.stormOrange, 0, 1.25, 0);
      bladderGroup.add(tank);

      // Top fill cap
      var cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.4, 0.3, 8),
        new THREE.MeshStandardMaterial({ color: colorScheme.militaryGreen })
      );
      cap.position.set(0, 2.6, 0);
      bladderGroup.add(cap);

      // Fuel level sight gauge
      var gauge = createBox(0.2, 2, 0.1, 0x00FF00, 1, 1.25, 0);
      bladderGroup.add(gauge);

      // Pump connection
      var pumpBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: colorScheme.metal })
      );
      pumpBase.position.set(-1.2, 0.5, 0);
      bladderGroup.add(pumpBase);

      bladderFarmGroup.add(bladderGroup);
    }

    // Berm around fuel farm
    var berm1 = createBox(16, 1.5, 1.2, colorScheme.desertSand, 0, 0.75, -2.5);
    var berm2 = createBox(1.2, 1.5, 4, colorScheme.desertSand, -7.5, 0.75, 0);
    bladderFarmGroup.add(berm1);
    bladderFarmGroup.add(berm2);

    scene.add(bladderFarmGroup);
    state.objects.push(bladderFarmGroup);
  }

  function createGenerators(scene) {
    var genSetGroup = new THREE.Group();
    genSetGroup.position.set(12, 0, 12);

    // Generator 1
    var gen1 = new THREE.Group();
    gen1.position.set(-4, 0, 0);
    var genBody1 = createBox(2.5, 1.8, 1.8, colorScheme.militaryGreen, 0, 0.9, 0);
    var exhaust1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.metal })
    );
    exhaust1.position.set(0.8, 2.5, 0);
    gen1.add(genBody1);
    gen1.add(exhaust1);
    genSetGroup.add(gen1);
    state.generators.push({
      group: gen1,
      exhaust: exhaust1,
      baseRotation: 0,
      vibration: 0
    });

    // Generator 2
    var gen2 = new THREE.Group();
    gen2.position.set(4, 0, 0);
    var genBody2 = createBox(2.5, 1.8, 1.8, colorScheme.stormBrown, 0, 0.9, 0);
    var exhaust2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.metal })
    );
    exhaust2.position.set(0.8, 2.5, 0);
    gen2.add(genBody2);
    gen2.add(exhaust2);
    genSetGroup.add(gen2);
    state.generators.push({
      group: gen2,
      exhaust: exhaust2,
      baseRotation: 0,
      vibration: 0
    });

    // Fuel connection manifold
    var manifold = createBox(6, 0.8, 0.8, colorScheme.metal, 0, 2.3, 0);
    genSetGroup.add(manifold);

    // Shelter canopy over generators
    var canopyFrame = createBox(7, 0.3, 2.5, colorScheme.militaryGreen, 0, 3.5, 0);
    genSetGroup.add(canopyFrame);

    scene.add(genSetGroup);
    state.objects.push(genSetGroup);
  }

  function createMedicalStation(scene) {
    var medGroup = new THREE.Group();
    medGroup.position.set(-8, 0, 12);

    // Tent frame structure
    var tentFrame1 = createBox(5, 0.3, 4, colorScheme.militaryGreen, 0, 2.5, 0);
    var tentFrame2 = createBox(0.3, 3, 4, colorScheme.militaryGreen, 2.5, 1.5, 0);
    var tentFrame3 = createBox(0.3, 3, 4, colorScheme.militaryGreen, -2.5, 1.5, 0);
    medGroup.add(tentFrame1);
    medGroup.add(tentFrame2);
    medGroup.add(tentFrame3);

    // Red cross symbol on side
    var crossH = createBox(2, 0.4, 0.2, colorScheme.emergencyRed, 0, 1.8, 2.1);
    var crossV = createBox(0.4, 2, 0.2, colorScheme.emergencyRed, 0, 1.8, 2.1);
    medGroup.add(crossH);
    medGroup.add(crossV);

    // Medical supply boxes
    var supplyBox1 = createBox(1, 1, 1, 0xFFFFFF, 1.5, 0.5, -1);
    var supplyBox2 = createBox(1, 1, 1, 0xFFFFFF, -1.5, 0.5, -1);
    medGroup.add(supplyBox1);
    medGroup.add(supplyBox2);

    // Cot/gurney area
    var gurney = createBox(2.5, 0.5, 1, 0x8B4513, 0, 0.5, 1.5);
    medGroup.add(gurney);

    scene.add(medGroup);
    state.objects.push(medGroup);

    // Medical station spawn point
    state.spawnPoints.push(new THREE.Vector3(-8, 5, 12));
  }

  function createAmmoPoint(scene) {
    var ammoGroup = new THREE.Group();
    ammoGroup.position.set(8, 0, 15);

    // Ammo crates stacked
    for (var i = 0; i < 3; i++) {
      var crate = createBox(2.2, 1.8, 1.8, colorScheme.desertSand, 0, i * 1.8 + 0.9, 0);
      ammoGroup.add(crate);
    }

    var crate2 = createBox(2.2, 1.8, 1.8, colorScheme.stormBrown, 2, 0.9, 0);
    var crate3 = createBox(2.2, 1.8, 1.8, colorScheme.stormBrown, -2, 0.9, 0);
    ammoGroup.add(crate2);
    ammoGroup.add(crate3);

    // Protective berm around ammo
    var ammoBerm1 = createBox(8, 2, 1.2, colorScheme.desertSand, 0, 1, -2);
    var ammoBerm2 = createBox(1.2, 2, 3, colorScheme.desertSand, 3.5, 1, 0);
    ammoGroup.add(ammoBerm1);
    ammoGroup.add(ammoBerm2);

    // Warning sign post
    var signPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 3, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.metal })
    );
    signPost.position.set(0, 1.5, -2.5);
    ammoGroup.add(signPost);

    // Warning sign panel
    var signPanel = createBox(1.2, 1, 0.1, colorScheme.emergencyRed, 0, 2.5, -2.5);
    ammoGroup.add(signPanel);

    scene.add(ammoGroup);
    state.objects.push(ammoGroup);

    // Ammo point spawn
    state.spawnPoints.push(new THREE.Vector3(8, 5, 15));
  }

  function createWaterBuffalo(scene) {
    var waterGroup = new THREE.Group();
    waterGroup.position.set(0, 0, -18);

    // Main tank body - large rectangular
    var tankBody = createBox(3.2, 2.5, 5, colorScheme.stormBrown, 0, 1.25, 0);
    waterGroup.add(tankBody);

    // Hatch cover
    var hatch = createBox(2, 0.3, 2.5, colorScheme.metal, 0, 2.8, 0);
    waterGroup.add(hatch);

    // Connection fittings
    var fitting1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.metal })
    );
    fitting1.rotation.z = Math.PI / 2;
    fitting1.position.set(1.3, 0.8, 1.5);
    waterGroup.add(fitting1);

    // Trailer frame
    var frame1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: colorScheme.militaryGreen })
    );
    frame1.rotation.z = Math.PI / 2;
    frame1.position.set(0, 0.5, 2.8);
    waterGroup.add(frame1);

    // Wheels
    var wheelFL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    wheelFL.rotation.z = Math.PI / 2;
    wheelFL.position.set(-1.2, 0.5, 2);
    waterGroup.add(wheelFL);

    var wheelFR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    wheelFR.rotation.z = Math.PI / 2;
    wheelFR.position.set(1.2, 0.5, 2);
    waterGroup.add(wheelFR);

    scene.add(waterGroup);
    state.objects.push(waterGroup);
  }

  function createHalfBuriedEquipment(scene) {
    var equipGroup = new THREE.Group();
    equipGroup.position.set(-18, 0, -12);

    // Sand mound base - large sloped shape
    var sandMound1 = createBox(8, 1.5, 8, colorScheme.desertSand, 0, 0.75, 0);
    var sandMound2 = createBox(6, 1, 6, colorScheme.darkSand, 0, 1.9, 0);
    equipGroup.add(sandMound1);
    equipGroup.add(sandMound2);

    // Half-buried items emerging from sand
    var item1 = createBox(1.5, 3.5, 1.2, colorScheme.stormBrown, -2, 2.5, -2);
    var item2 = createBox(1.2, 2.8, 1.5, colorScheme.militaryGreen, 2, 2, 2);
    var item3 = createBox(2, 1.5, 1.2, colorScheme.hescoTan, 0, 1.8, 2.5);
    equipGroup.add(item1);
    equipGroup.add(item2);
    equipGroup.add(item3);

    // Tracking state for sinking animation
    state.driftingSand.push({
      group: equipGroup,
      baseY: 0,
      sinkRate: 0.003
    });

    scene.add(equipGroup);
    state.objects.push(equipGroup);
  }

  function createSandDrifts(scene) {
    var positions = [
      { pos: new THREE.Vector3(0, 0, -8), size: 6 },
      { pos: new THREE.Vector3(15, 0, 8), size: 5 },
      { pos: new THREE.Vector3(-12, 0, -8), size: 4 }
    ];

    positions.forEach(function(item) {
      var driftGroup = new THREE.Group();
      driftGroup.position.copy(item.pos);

      // Sloped sand drift piles
      var drift1 = createBox(item.size, item.size * 0.5, item.size, colorScheme.desertSand, 0, item.size * 0.25, 0);
      var drift2 = createBox(item.size * 0.8, item.size * 0.3, item.size * 0.8, colorScheme.darkSand, 0, item.size * 0.65, 0);

      driftGroup.add(drift1);
      driftGroup.add(drift2);

      scene.add(driftGroup);
      state.objects.push(driftGroup);
    });
  }

  function createStormParticleWall(scene) {
    var particleGeometry = new THREE.BufferGeometry();
    var particleCount = 2000;
    var positions = new Float32Array(particleCount * 3);
    var colors = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 120;

      colors[i] = colorScheme.stormOrange / 0xFFFFFF * (0.5 + Math.random() * 0.5);
      colors[i + 1] = colorScheme.stormBrown / 0xFFFFFF * (0.5 + Math.random() * 0.5);
      colors[i + 2] = colorScheme.desertSand / 0xFFFFFF * (0.5 + Math.random() * 0.5);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6
    });

    var particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    state.particles = particles;
    state.objects.push(particles);
  }

  function createRopeGuideLines(scene) {
    var ropePositions = [
      { start: new THREE.Vector3(0, 4, 0), end: new THREE.Vector3(10, 4, 10) },
      { start: new THREE.Vector3(0, 4, 0), end: new THREE.Vector3(-10, 4, 10) },
      { start: new THREE.Vector3(0, 4, 0), end: new THREE.Vector3(10, 4, -10) },
      { start: new THREE.Vector3(0, 4, 0), end: new THREE.Vector3(-10, 4, -10) },
      { start: new THREE.Vector3(10, 4, 10), end: new THREE.Vector3(-10, 4, 10) }
    ];

    ropePositions.forEach(function(rope) {
      var lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(
        new Float32Array([
          rope.start.x, rope.start.y, rope.start.z,
          rope.end.x, rope.end.y, rope.end.z
        ]), 3
      ));

      var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF6633, linewidth: 2 });
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);

      scene.add(line);
      state.ropeLines.push({
        mesh: line,
        startPos: rope.start.clone(),
        endPos: rope.end.clone(),
        sag: 0
      });
      state.objects.push(line);
    });
  }

  function setupSpawnPoints() {
    // Ensure we have 5 spawn points minimum
    if (state.spawnPoints.length < 5) {
      state.spawnPoints.push(new THREE.Vector3(0, 5, -15));
      state.spawnPoints.push(new THREE.Vector3(12, 5, -5));
    }
  }

  function createBox(width, height, depth, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function update(delta) {
    state.windTime += delta;

    // Update sand particle wind sweep
    if (state.particles) {
      var positions = state.particles.geometry.attributes.position.array;
      var windStrength = Math.sin(state.windTime * 0.5) * 0.3;

      for (var i = 0; i < positions.length; i += 3) {
        positions[i] += windStrength * delta * 8;
        positions[i + 2] += Math.sin(state.windTime * 0.8 + i) * delta * 3;

        if (positions[i] > 60) positions[i] = -60;
        if (positions[i + 2] > 60) positions[i + 2] = -60;
      }
      state.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Antenna whipping in wind
    state.antennas.forEach(function(antenna) {
      antenna.mesh.rotation.x = Math.sin(state.windTime * 1.5) * 0.15;
      antenna.mesh.rotation.z = Math.cos(state.windTime * 1.2) * 0.1;
    });

    // Generator straining and vibration
    state.generators.forEach(function(gen) {
      var vibration = Math.sin(state.windTime * 8) * 0.08;
      gen.group.position.y = vibration;
      gen.exhaust.rotation.x = Math.cos(state.windTime * 2.5) * 0.12;
    });

    // Rope guide lines thrashing
    state.ropeLines.forEach(function(rope, idx) {
      var sag = Math.sin(state.windTime * (1 + idx * 0.3)) * 1.5;
      var lineGeometry = rope.mesh.geometry;
      var positions = lineGeometry.attributes.position.array;

      var midX = (rope.startPos.x + rope.endPos.x) / 2 + sag;
      var midY = (rope.startPos.y + rope.endPos.y) / 2 - sag * 0.5;
      var midZ = (rope.startPos.z + rope.endPos.z) / 2 + Math.sin(state.windTime * 0.7) * 0.5;

      positions[0] = rope.startPos.x;
      positions[1] = rope.startPos.y;
      positions[2] = rope.startPos.z;
      positions[3] = rope.endPos.x;
      positions[4] = rope.endPos.y;
      positions[5] = rope.endPos.z;

      lineGeometry.attributes.position.needsUpdate = true;
    });

    // Vehicle shifting in sand
    state.vehicles.forEach(function(vehicle, idx) {
      vehicle.position.y = Math.sin(state.windTime * 0.4 + idx * 0.5) * 0.2;
      vehicle.rotation.z = Math.sin(state.windTime * 0.3) * 0.05;
    });

    // Half-buried equipment sinking
    state.driftingSand.forEach(function(drift) {
      drift.group.position.y -= drift.sinkRate * delta;
      if (drift.group.position.y < -2) {
        drift.group.position.y = 0;
      }
    });

    // Storm intensity pulsing
    state.stormIntensity = 0.5 + Math.sin(state.windTime * 0.3) * 0.3;
    if (state.particles) {
      state.particles.material.opacity = 0.3 + state.stormIntensity * 0.3;
    }
  }

  function reset() {
    state.objects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    state = {
      objects: [],
      particles: null,
      antennas: [],
      generators: [],
      ropeLines: [],
      vehicles: [],
      driftingSand: [],
      windTime: 0,
      stormIntensity: 0,
      spawnPoints: []
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
