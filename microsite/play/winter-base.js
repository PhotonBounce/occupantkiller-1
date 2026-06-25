window.WinterBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var baseObjects = [];
  var campfires = [];
  var satelliteDish = null;
  var snowParticles = [];
  var time = 0;

  function createTerrainValley() {
    var terrainGroup = new THREE.Group();

    // Valley floor - varied height terrain slabs
    var terrainHeights = [
      { x: 0, z: 0, w: 30, h: 1, d: 30, y: -5, color: 0xE8F4F8 },
      { x: -15, z: -15, w: 20, h: 1, d: 20, y: -4, color: 0xF0F8FF },
      { x: 15, z: -15, w: 25, h: 1, d: 25, y: -3.5, color: 0xEBF5FB },
      { x: 0, z: 20, w: 28, h: 1, d: 15, y: -4.5, color: 0xF5FAFF },
      { x: -20, z: 10, w: 18, h: 1, d: 22, y: -3, color: 0xECF6FF },
      { x: 20, z: 5, w: 22, h: 1, d: 20, y: -4.2, color: 0xF0F7FF }
    ];

    for (var i = 0; i < terrainHeights.length; i++) {
      var t = terrainHeights[i];
      var geom = new THREE.BoxGeometry(t.w, t.h, t.d);
      var mat = new THREE.MeshPhongMaterial({ color: t.color, shininess: 80 });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(t.x, t.y, t.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      terrainGroup.add(mesh);
      baseObjects.push(mesh);
    }

    return terrainGroup;
  }

  function createMountainWalls() {
    var wallGroup = new THREE.Group();

    // East wall
    var eastGeom = new THREE.BoxGeometry(8, 30, 90);
    var rockMat = new THREE.MeshPhongMaterial({ color: 0x4A5568, shininess: 20 });
    var eastWall = new THREE.Mesh(eastGeom, rockMat);
    eastWall.position.set(40, 5, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    wallGroup.add(eastWall);
    baseObjects.push(eastWall);

    // West wall
    var westWall = new THREE.Mesh(eastGeom, rockMat);
    westWall.position.set(-40, 5, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    wallGroup.add(westWall);
    baseObjects.push(westWall);

    // North wall segment
    var northGeom = new THREE.BoxGeometry(80, 25, 6);
    var northWall = new THREE.Mesh(northGeom, rockMat);
    northWall.position.set(0, 3, 42);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    wallGroup.add(northWall);
    baseObjects.push(northWall);

    return wallGroup;
  }

  function createCommandTent() {
    var tentGroup = new THREE.Group();

    // Main tent body
    var tentGeom = new THREE.BoxGeometry(12, 8, 16);
    var tentMat = new THREE.MeshPhongMaterial({ color: 0x3D3D3D, shininess: 30 });
    var tentMesh = new THREE.Mesh(tentGeom, tentMat);
    tentMesh.position.set(0, 0, -20);
    tentMesh.castShadow = true;
    tentMesh.receiveShadow = true;
    tentGroup.add(tentMesh);
    baseObjects.push(tentMesh);

    // Support poles
    for (var i = 0; i < 4; i++) {
      var offsetX = (i % 2 === 0) ? -5 : 5;
      var offsetZ = (i < 2) ? -8 : 8;
      var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 9, 8);
      var poleMat = new THREE.MeshPhongMaterial({ color: 0x2C2C2C, shininess: 40 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(offsetX, 0.5, -20 + offsetZ);
      pole.castShadow = true;
      pole.receiveShadow = true;
      tentGroup.add(pole);
      baseObjects.push(pole);
    }

    // Tent roof peak
    var roofGeom = new THREE.BoxGeometry(12, 1, 16);
    var roofMesh = new THREE.Mesh(roofGeom, tentMat);
    roofMesh.position.set(0, 4, -20);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    tentGroup.add(roofMesh);
    baseObjects.push(roofMesh);

    return tentGroup;
  }

  function createSatelliteDish() {
    var dishGroup = new THREE.Group();

    // Mast
    var mastGeom = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
    var metalMat = new THREE.MeshPhongMaterial({ color: 0x555555, shininess: 100 });
    var mast = new THREE.Mesh(mastGeom, metalMat);
    mast.position.set(25, 3, -30);
    mast.castShadow = true;
    mast.receiveShadow = true;
    dishGroup.add(mast);
    baseObjects.push(mast);

    // Dish cone
    var dishGeom = new THREE.ConeGeometry(3.5, 2, 16);
    var dishMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA, shininess: 120 });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(25, 10, -30);
    dish.rotation.z = Math.PI * 0.3;
    dish.castShadow = true;
    dish.receiveShadow = true;
    dishGroup.add(dish);
    baseObjects.push(dish);
    satelliteDish = dish;

    // Support arm
    var armGeom = new THREE.BoxGeometry(0.3, 2.5, 2);
    var armMesh = new THREE.Mesh(armGeom, metalMat);
    armMesh.position.set(25, 8, -28);
    armMesh.castShadow = true;
    armMesh.receiveShadow = true;
    dishGroup.add(armMesh);
    baseObjects.push(armMesh);

    // Antenna wires
    var wireGeom = new THREE.BufferGeometry();
    var wireVerts = new Float32Array([
      25, 12, -30, 28, 14, -32,
      25, 12, -30, 22, 15, -28
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var wires = new THREE.LineSegments(wireGeom, wireMat);
    dishGroup.add(wires);
    baseObjects.push(wires);

    return dishGroup;
  }

  function createVehiclePool() {
    var vehicleGroup = new THREE.Group();

    // Armored vehicles
    var vehiclePositions = [
      { x: -28, z: 10 },
      { x: -28, z: 18 },
      { x: -28, z: 26 }
    ];

    for (var i = 0; i < vehiclePositions.length; i++) {
      var pos = vehiclePositions[i];

      // Vehicle body
      var bodyGeom = new THREE.BoxGeometry(4, 3, 8);
      var vehicleMat = new THREE.MeshPhongMaterial({ color: 0x556B2F, shininess: 40 });
      var body = new THREE.Mesh(bodyGeom, vehicleMat);
      body.position.set(pos.x, 1.5, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      vehicleGroup.add(body);
      baseObjects.push(body);

      // Turret
      var turretGeom = new THREE.CylinderGeometry(1.2, 1.5, 1.5, 8);
      var turret = new THREE.Mesh(turretGeom, vehicleMat);
      turret.position.set(pos.x, 3.2, pos.z - 1);
      turret.castShadow = true;
      turret.receiveShadow = true;
      vehicleGroup.add(turret);
      baseObjects.push(turret);

      // Gun barrel
      var barrelGeom = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x2C2C2C, shininess: 60 });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(pos.x + 3, 3.5, pos.z - 1);
      barrel.rotation.z = Math.PI * 0.15;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      vehicleGroup.add(barrel);
      baseObjects.push(barrel);
    }

    // Snowcats
    var snowcatPositions = [
      { x: -20, z: 10 },
      { x: -20, z: 18 }
    ];

    for (var j = 0; j < snowcatPositions.length; j++) {
      var spos = snowcatPositions[j];

      // Snowcat body
      var catGeom = new THREE.BoxGeometry(3.5, 2.5, 7);
      var catMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, shininess: 50 });
      var catBody = new THREE.Mesh(catGeom, catMat);
      catBody.position.set(spos.x, 1.25, spos.z);
      catBody.castShadow = true;
      catBody.receiveShadow = true;
      vehicleGroup.add(catBody);
      baseObjects.push(catBody);

      // Cabin
      var cabinGeom = new THREE.BoxGeometry(2, 2, 3);
      var cabinMat = new THREE.MeshPhongMaterial({ color: 0xCCCCCC, shininess: 45 });
      var cabin = new THREE.Mesh(cabinGeom, cabinMat);
      cabin.position.set(spos.x, 2.5, spos.z - 1.5);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      vehicleGroup.add(cabin);
      baseObjects.push(cabin);
    }

    return vehicleGroup;
  }

  function createMedicalTent() {
    var medGroup = new THREE.Group();

    // Tent body
    var medGeom = new THREE.BoxGeometry(8, 6, 10);
    var whiteMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, shininess: 35 });
    var medTent = new THREE.Mesh(medGeom, whiteMat);
    medTent.position.set(-20, -1, 5);
    medTent.castShadow = true;
    medTent.receiveShadow = true;
    medGroup.add(medTent);
    baseObjects.push(medTent);

    // Red cross marking on side
    var crossVertical = new THREE.BoxGeometry(0.6, 3, 0.3);
    var redMat = new THREE.MeshPhongMaterial({ color: 0xCC0000, shininess: 30 });
    var vertBar = new THREE.Mesh(crossVertical, redMat);
    vertBar.position.set(-20, 0, 10.2);
    vertBar.castShadow = true;
    vertBar.receiveShadow = true;
    medGroup.add(vertBar);
    baseObjects.push(vertBar);

    var crossHorizontal = new THREE.BoxGeometry(3, 0.6, 0.3);
    var horzBar = new THREE.Mesh(crossHorizontal, redMat);
    horzBar.position.set(-20, 0, 10.2);
    horzBar.castShadow = true;
    horzBar.receiveShadow = true;
    medGroup.add(horzBar);
    baseObjects.push(horzBar);

    // Support poles
    for (var i = 0; i < 2; i++) {
      var poleX = (i === 0) ? -24 : -16;
      var poleGeom = new THREE.CylinderGeometry(0.35, 0.35, 7, 8);
      var poleMat = new THREE.MeshPhongMaterial({ color: 0x4D4D4D, shininess: 40 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(poleX, 0.5, 5);
      pole.castShadow = true;
      pole.receiveShadow = true;
      medGroup.add(pole);
      baseObjects.push(pole);
    }

    return medGroup;
  }

  function createMortarPit() {
    var mortarGroup = new THREE.Group();

    // Sandbag circle - BoxGeometry sandbags arranged in ring
    var sandbagCount = 12;
    var radius = 4;
    var sandbagMat = new THREE.MeshPhongMaterial({ color: 0x8B7355, shininess: 25 });

    for (var i = 0; i < sandbagCount; i++) {
      var angle = (i / sandbagCount) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var bagGeom = new THREE.BoxGeometry(1.5, 1, 1.5);
      var bag = new THREE.Mesh(bagGeom, sandbagMat);
      bag.position.set(10 + x, 0.5, 15 + z);
      bag.castShadow = true;
      bag.receiveShadow = true;
      mortarGroup.add(bag);
      baseObjects.push(bag);
    }

    // Mortar tube
    var mortarGeom = new THREE.CylinderGeometry(0.8, 1, 3, 8);
    var mortarMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C, shininess: 50 });
    var mortar = new THREE.Mesh(mortarGeom, mortarMat);
    mortar.position.set(10, 2.5, 15);
    mortar.rotation.z = Math.PI * 0.25;
    mortar.castShadow = true;
    mortar.receiveShadow = true;
    mortarGroup.add(mortar);
    baseObjects.push(mortar);

    return mortarGroup;
  }

  function createSupplyLine() {
    var supplyGroup = new THREE.Group();

    // Sleds with crates
    var sledPositions = [
      { x: 15, z: -15 },
      { x: 15, z: -8 },
      { x: 15, z: -1 }
    ];

    for (var i = 0; i < sledPositions.length; i++) {
      var spos = sledPositions[i];

      // Sled base
      var sledGeom = new THREE.BoxGeometry(3, 0.5, 5);
      var sledMat = new THREE.MeshPhongMaterial({ color: 0x8B4513, shininess: 35 });
      var sled = new THREE.Mesh(sledGeom, sledMat);
      sled.position.set(spos.x, 0.25, spos.z);
      sled.castShadow = true;
      sled.receiveShadow = true;
      supplyGroup.add(sled);
      baseObjects.push(sled);

      // Crates on sled
      var crateCount = 2;
      for (var j = 0; j < crateCount; j++) {
        var crateGeom = new THREE.BoxGeometry(2.5, 2, 2.5);
        var crateMat = new THREE.MeshPhongMaterial({ color: 0x664400, shininess: 30 });
        var crate = new THREE.Mesh(crateGeom, crateMat);
        crate.position.set(spos.x, 1.25 + j * 2, spos.z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        supplyGroup.add(crate);
        baseObjects.push(crate);
      }
    }

    return supplyGroup;
  }

  function createFrozenStream() {
    var streamGroup = new THREE.Group();

    // Ice stripe through valley
    var iceGeom = new THREE.BoxGeometry(3, 0.3, 50);
    var iceMat = new THREE.MeshPhongMaterial({ color: 0xB0E0E6, shininess: 140 });
    var ice = new THREE.Mesh(iceGeom, iceMat);
    ice.position.set(-5, -4.8, 0);
    ice.castShadow = false;
    ice.receiveShadow = true;
    streamGroup.add(ice);
    baseObjects.push(ice);

    // Additional ice patches
    var icePatches = [
      { x: 5, z: -10 },
      { x: -12, z: 20 }
    ];

    for (var i = 0; i < icePatches.length; i++) {
      var patch = icePatches[i];
      var patchGeom = new THREE.BoxGeometry(4, 0.3, 8);
      var patchMesh = new THREE.Mesh(patchGeom, iceMat);
      patchMesh.position.set(patch.x, -4.8, patch.z);
      patchMesh.castShadow = false;
      patchMesh.receiveShadow = true;
      streamGroup.add(patchMesh);
      baseObjects.push(patchMesh);
    }

    return streamGroup;
  }

  function createObservationPost() {
    var obsGroup = new THREE.Group();

    // Platform
    var platformGeom = new THREE.BoxGeometry(6, 0.8, 6);
    var platformMat = new THREE.MeshPhongMaterial({ color: 0x556B2F, shininess: 40 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(30, 10, 25);
    platform.castShadow = true;
    platform.receiveShadow = true;
    obsGroup.add(platform);
    baseObjects.push(platform);

    // Support legs
    var legCount = 4;
    var legPositions = [
      { x: -2.5, z: -2.5 },
      { x: 2.5, z: -2.5 },
      { x: -2.5, z: 2.5 },
      { x: 2.5, z: 2.5 }
    ];

    for (var i = 0; i < legCount; i++) {
      var lpos = legPositions[i];
      var legGeom = new THREE.CylinderGeometry(0.5, 0.6, 11, 8);
      var legMat = new THREE.MeshPhongMaterial({ color: 0x4A4A4A, shininess: 50 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(30 + lpos.x, 4.5, 25 + lpos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      obsGroup.add(leg);
      baseObjects.push(leg);
    }

    // Guard rail
    var railGeom = new THREE.BoxGeometry(6.5, 1, 0.3);
    var railMat = new THREE.MeshPhongMaterial({ color: 0x3D3D3D, shininess: 45 });
    var rail = new THREE.Mesh(railGeom, railMat);
    rail.position.set(30, 10.8, 28);
    rail.castShadow = true;
    rail.receiveShadow = true;
    obsGroup.add(rail);
    baseObjects.push(rail);

    return obsGroup;
  }

  function createFuelBladderFarm() {
    var fuelGroup = new THREE.Group();

    // Large fuel bladders in row
    var bladderCount = 6;
    var fuelMat = new THREE.MeshPhongMaterial({ color: 0x1C1C1C, shininess: 60 });

    for (var i = 0; i < bladderCount; i++) {
      var bladderGeom = new THREE.BoxGeometry(3, 4, 6);
      var bladder = new THREE.Mesh(bladderGeom, fuelMat);
      bladder.position.set(-32, 2, 0 + i * 7);
      bladder.castShadow = true;
      bladder.receiveShadow = true;
      fuelGroup.add(bladder);
      baseObjects.push(bladder);

      // Nozzle pipe
      var nozzleGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6);
      var nozzleMat = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 70 });
      var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
      nozzle.position.set(-30, 4, 0 + i * 7);
      nozzle.rotation.z = Math.PI * 0.3;
      nozzle.castShadow = true;
      nozzle.receiveShadow = true;
      fuelGroup.add(nozzle);
      baseObjects.push(nozzle);
    }

    return fuelGroup;
  }

  function createCommunicationsArray() {
    var commGroup = new THREE.Group();

    // Multiple antenna masts
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0x595959, shininess: 90 });
    var antennaPositions = [
      { x: 20, z: -25 },
      { x: 24, z: -25 },
      { x: 28, z: -25 },
      { x: 22, z: -20 }
    ];

    for (var i = 0; i < antennaPositions.length; i++) {
      var apos = antennaPositions[i];

      var mastGeom = new THREE.CylinderGeometry(0.25, 0.25, 15, 8);
      var mast = new THREE.Mesh(mastGeom, antennaMat);
      mast.position.set(apos.x, 7.5, apos.z);
      mast.castShadow = true;
      mast.receiveShadow = true;
      commGroup.add(mast);
      baseObjects.push(mast);

      // Antenna segments on top
      var antennaGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
      var antenna = new THREE.Mesh(antennaGeom, antennaMat);
      antenna.position.set(apos.x, 16, apos.z);
      antenna.castShadow = true;
      antenna.receiveShadow = true;
      commGroup.add(antenna);
      baseObjects.push(antenna);
    }

    // Wire connecting antennas
    var wireVerts = new Float32Array([
      20, 14, -25, 24, 14, -25,
      24, 14, -25, 28, 14, -25,
      28, 14, -25, 22, 14, -20,
      20, 14, -25, 22, 14, -20
    ]);
    var wireGeom = new THREE.BufferGeometry();
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
    var wires = new THREE.LineSegments(wireGeom, wireMat);
    commGroup.add(wires);
    baseObjects.push(wires);

    return commGroup;
  }

  function createCampfireCircles() {
    var campfireGroup = new THREE.Group();

    var campfirePositions = [
      { x: 10, z: 30 },
      { x: -15, z: -25 },
      { x: 5, z: 35 }
    ];

    for (var i = 0; i < campfirePositions.length; i++) {
      var cpos = campfirePositions[i];
      var campfireData = { position: cpos, intensity: 1.0, phase: i * 0.7 };
      campfires.push(campfireData);

      // Fire glow sphere
      var fireGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var fireMat = new THREE.MeshPhongMaterial({
        color: 0xFF6B35,
        emissive: 0xFF6B35,
        emissiveIntensity: 0.6,
        shininess: 10
      });
      var fireSphere = new THREE.Mesh(fireGeom, fireMat);
      fireSphere.position.set(cpos.x, 1, cpos.z);
      campfireGroup.add(fireSphere);
      baseObjects.push(fireSphere);
      campfireData.mesh = fireSphere;

      // Log seats around fire
      var logCount = 4;
      var logRadius = 3;
      var logMat = new THREE.MeshPhongMaterial({ color: 0x5C3D2E, shininess: 20 });

      for (var j = 0; j < logCount; j++) {
        var angle = (j / logCount) * Math.PI * 2;
        var logX = Math.cos(angle) * logRadius;
        var logZ = Math.sin(angle) * logRadius;

        var logGeom = new THREE.BoxGeometry(0.8, 0.5, 3);
        var log = new THREE.Mesh(logGeom, logMat);
        log.position.set(cpos.x + logX, 0.3, cpos.z + logZ);
        log.rotation.y = angle;
        log.castShadow = true;
        log.receiveShadow = true;
        campfireGroup.add(log);
        baseObjects.push(log);
      }
    }

    return campfireGroup;
  }

  function createSnowParticles() {
    var particlePositions = new Float32Array(180);
    for (var i = 0; i < 60; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 100;
      particlePositions[i * 3 + 1] = Math.random() * 60;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    var particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    var particleMat = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.3,
      sizeAttenuation: true,
      opacity: 0.6,
      transparent: true
    });

    var particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);
    baseObjects.push(particles);

    snowParticles = particles;
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    // Create terrain
    var terrain = createTerrainValley();
    scene.add(terrain);

    // Create mountain walls
    var walls = createMountainWalls();
    scene.add(walls);

    // Create command tent
    var commandTent = createCommandTent();
    scene.add(commandTent);

    // Create satellite dish
    var satelliteDish = createSatelliteDish();
    scene.add(satelliteDish);

    // Create vehicle pool
    var vehiclePool = createVehiclePool();
    scene.add(vehiclePool);

    // Create medical tent
    var medicalTent = createMedicalTent();
    scene.add(medicalTent);

    // Create mortar pit
    var mortarPit = createMortarPit();
    scene.add(mortarPit);

    // Create supply line
    var supplyLine = createSupplyLine();
    scene.add(supplyLine);

    // Create frozen stream
    var frozenStream = createFrozenStream();
    scene.add(frozenStream);

    // Create observation post
    var observationPost = createObservationPost();
    scene.add(observationPost);

    // Create fuel bladder farm
    var fuelFarm = createFuelBladderFarm();
    scene.add(fuelFarm);

    // Create communications array
    var commArray = createCommunicationsArray();
    scene.add(commArray);

    // Create campfire circles
    var campfireGroup = createCampfireCircles();
    scene.add(campfireGroup);

    // Create snow particles
    createSnowParticles();
  }

  function update(delta) {
    time += delta;

    // Animate campfire flickering
    for (var i = 0; i < campfires.length; i++) {
      var cf = campfires[i];
      var flicker = 0.9 + Math.sin(time * 3 + cf.phase) * 0.15;
      cf.mesh.material.emissiveIntensity = 0.6 * flicker;
      cf.mesh.scale.y = 0.8 + Math.sin(time * 2.5 + cf.phase) * 0.2;
    }

    // Satellite dish slowly rotating
    if (satelliteDish) {
      satelliteDish.rotation.y += delta * 0.3;
    }

    // Snow particles drifting
    if (snowParticles && snowParticles.geometry) {
      var positions = snowParticles.geometry.attributes.position.array;
      for (var j = 0; j < positions.length; j += 3) {
        positions[j + 1] -= delta * 8;
        if (positions[j + 1] < -10) {
          positions[j + 1] = 60;
        }
        positions[j] += Math.sin(time + j) * delta * 2;
        positions[j + 2] += Math.cos(time + j) * delta * 1.5;
      }
      snowParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  function reset() {
    for (var i = 0; i < baseObjects.length; i++) {
      var obj = baseObjects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      if (scene && obj.parent === scene) {
        scene.remove(obj);
      }
    }

    baseObjects = [];
    campfires = [];
    satelliteDish = null;
    snowParticles = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
