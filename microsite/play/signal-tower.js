window.SignalTower = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var dishAzimuth = 0;
  var beaconBlink = 0;
  var antennaOscillation = 0;
  var groups = {};

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    groups = {};

    // Main lattice tower
    buildLattice();

    // Parabolic dish receiver
    buildParabolicDish();

    // YAGI antenna arrays
    buildYAGIArrays();

    // Rhombic antenna
    buildRhombicAntenna();

    // Operations bunker
    buildBunker();

    // Generator building
    buildGenerator();

    // Perimeter fence with razor wire
    buildPerimeterFence();

    // Vehicle compound
    buildVehicleCompound();

    // Cable runs
    buildCableRuns();

    // Satellite uplink dish
    buildSatelliteUplink();

    // Warning signs
    buildWarningSign();

    // Guard tower
    buildGuardTower();

    // Lightning rod
    buildLightningRod();
  }

  function buildLattice() {
    var group = new THREE.Group();
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });

    // Base platform
    var basePlatform = new THREE.BoxGeometry(8, 0.5, 8);
    var baseMesh = new THREE.Mesh(basePlatform, material);
    baseMesh.position.y = 0.25;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);
    meshes.push(baseMesh);

    // Lattice tower sections
    var towerHeight = 35;
    var sections = 7;
    var sectionHeight = towerHeight / sections;

    for (var i = 0; i < sections; i++) {
      var y = 1 + (i * sectionHeight);

      // Four corner vertical members (simplified as boxes)
      var verticalGeom = new THREE.BoxGeometry(0.3, sectionHeight, 0.3);
      var verticalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.85, roughness: 0.25 });

      var positions = [
        [-3, y + sectionHeight / 2, -3],
        [3, y + sectionHeight / 2, -3],
        [3, y + sectionHeight / 2, 3],
        [-3, y + sectionHeight / 2, 3]
      ];

      for (var p = 0; p < positions.length; p++) {
        var vMesh = new THREE.Mesh(verticalGeom, verticalMat);
        vMesh.position.set(positions[p][0], positions[p][1], positions[p][2]);
        vMesh.castShadow = true;
        vMesh.receiveShadow = true;
        group.add(vMesh);
        meshes.push(vMesh);
      }

      // Cross-bracing with LineSegments
      var geometry = new THREE.BufferGeometry();
      var positions_array = new Float32Array([
        -3, y, -3, 3, y, 3,
        3, y, -3, -3, y, 3,
        -3, y + sectionHeight / 2, -3, 3, y + sectionHeight / 2, 3,
        3, y + sectionHeight / 2, -3, -3, y + sectionHeight / 2, 3
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions_array, 3));
      var lineMat = new THREE.LineBasicMaterial({ color: 0x777777, linewidth: 2 });
      var lines = new THREE.LineSegments(geometry, lineMat);
      group.add(lines);
    }

    // Tower top platform
    var topPlatform = new THREE.BoxGeometry(4, 0.3, 4);
    var topMesh = new THREE.Mesh(topPlatform, material);
    topMesh.position.y = towerHeight + 0.15;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);
    meshes.push(topMesh);

    scene.add(group);
    groups.lattice = group;
  }

  function buildParabolicDish() {
    var group = new THREE.Group();
    group.position.set(12, 8, 12);

    // Dish reflector (SphereGeometry hemisphere approximation)
    var dishGeom = new THREE.SphereGeometry(5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.2 });
    var dishMesh = new THREE.Mesh(dishGeom, dishMat);
    dishMesh.castShadow = true;
    dishMesh.receiveShadow = true;
    group.add(dishMesh);
    meshes.push(dishMesh);

    // Feed horn structure (cone + box)
    var hornGeom = new THREE.ConeGeometry(1.2, 3, 16);
    var hornMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    var hornMesh = new THREE.Mesh(hornGeom, hornMat);
    hornMesh.position.set(0, 2.5, 0);
    hornMesh.castShadow = true;
    hornMesh.receiveShadow = true;
    group.add(hornMesh);
    meshes.push(hornMesh);

    // Support struts (BoxGeometry)
    var strutGeom = new THREE.BoxGeometry(0.2, 6, 0.2);
    var strutMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var strutMesh = new THREE.Mesh(strutGeom, strutMat);
      strutMesh.position.set(Math.cos(angle) * 4, -3, Math.sin(angle) * 4);
      strutMesh.castShadow = true;
      strutMesh.receiveShadow = true;
      group.add(strutMesh);
      meshes.push(strutMesh);
    }

    // Azimuth bearing (CylinderGeometry)
    var bearingGeom = new THREE.CylinderGeometry(5.5, 5.5, 0.5, 32);
    var bearingMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
    var bearingMesh = new THREE.Mesh(bearingGeom, bearingMat);
    bearingMesh.position.y = -3.25;
    bearingMesh.castShadow = true;
    bearingMesh.receiveShadow = true;
    group.add(bearingMesh);
    meshes.push(bearingMesh);

    scene.add(group);
    groups.dish = group;
  }

  function buildYAGIArrays() {
    var group = new THREE.Group();
    group.position.set(-15, 15, 0);

    var arrayCount = 3;
    for (var a = 0; a < arrayCount; a++) {
      var yagiGroup = new THREE.Group();
      yagiGroup.position.z = (a - 1) * 4;

      // Boom (BoxGeometry)
      var boomGeom = new THREE.BoxGeometry(0.15, 0.15, 6);
      var boomMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
      var boomMesh = new THREE.Mesh(boomGeom, boomMat);
      boomMesh.castShadow = true;
      boomMesh.receiveShadow = true;
      yagiGroup.add(boomMesh);
      meshes.push(boomMesh);

      // Director elements (CylinderGeometry)
      var elementCount = 8;
      var elementSpacing = 6 / elementCount;
      for (var e = 0; e < elementCount; e++) {
        var elemGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
        var elemMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.75 });
        var elemMesh = new THREE.Mesh(elemGeom, elemMat);
        elemMesh.rotation.z = Math.PI / 2;
        elemMesh.position.set(0, 0.5, -3 + e * elementSpacing);
        elemMesh.castShadow = true;
        elemMesh.receiveShadow = true;
        yagiGroup.add(elemMesh);
        meshes.push(elemMesh);
      }

      group.add(yagiGroup);
    }

    scene.add(group);
    groups.yagi = group;
  }

  function buildRhombicAntenna() {
    var group = new THREE.Group();
    group.position.set(-20, 12, -12);

    var rhombusMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });

    // Rhombic wire formation
    var geometry = new THREE.BufferGeometry();
    var positions_array = new Float32Array([
      0, 0, 0, 8, 0, 0,
      8, 0, 0, 8, 8, 0,
      8, 8, 0, 0, 8, 0,
      0, 8, 0, 0, 0, 0,
      0, 0, 0, 8, 8, 0,
      8, 0, 0, 0, 8, 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions_array, 3));
    var lines = new THREE.LineSegments(geometry, rhombusMat);
    lines.position.set(0, 0, 0);
    group.add(lines);

    // Feed point box
    var feedGeom = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var feedMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x444400 });
    var feedMesh = new THREE.Mesh(feedGeom, feedMat);
    feedMesh.position.set(4, 4, 0);
    feedMesh.castShadow = true;
    group.add(feedMesh);
    meshes.push(feedMesh);

    scene.add(group);
    groups.rhombic = group;
  }

  function buildBunker() {
    var group = new THREE.Group();
    group.position.set(0, -2, -25);

    // Reinforced entrance (BoxGeometry)
    var entranceGeom = new THREE.BoxGeometry(6, 4, 2);
    var concreteMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var entranceMesh = new THREE.Mesh(entranceGeom, concreteMat);
    entranceMesh.position.z = -1;
    entranceMesh.castShadow = true;
    entranceMesh.receiveShadow = true;
    group.add(entranceMesh);
    meshes.push(entranceMesh);

    // Heavy steel door (BoxGeometry)
    var doorGeom = new THREE.BoxGeometry(2.5, 3.5, 0.3);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
    var doorMesh = new THREE.Mesh(doorGeom, doorMat);
    doorMesh.position.set(0, 0.25, 0.5);
    doorMesh.castShadow = true;
    group.add(doorMesh);
    meshes.push(doorMesh);

    // Blast shield (BoxGeometry)
    var shieldGeom = new THREE.BoxGeometry(8, 3, 1.5);
    var shieldMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.85 });
    var shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.z = 2;
    shieldMesh.castShadow = true;
    shieldMesh.receiveShadow = true;
    group.add(shieldMesh);
    meshes.push(shieldMesh);

    scene.add(group);
    groups.bunker = group;
  }

  function buildGenerator() {
    var group = new THREE.Group();
    group.position.set(18, 0, -20);

    // Main building (BoxGeometry)
    var buildingGeom = new THREE.BoxGeometry(6, 5, 8);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    var buildingMesh = new THREE.Mesh(buildingGeom, buildingMat);
    buildingMesh.position.y = 2.5;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);
    meshes.push(buildingMesh);

    // Roof (BoxGeometry angled)
    var roofGeom = new THREE.BoxGeometry(6.4, 0.5, 8.4);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 });
    var roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.position.y = 5.25;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);
    meshes.push(roofMesh);

    // Exhaust stack (CylinderGeometry)
    var exhaustGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 16);
    var exhaustMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 });
    var exhaustMesh = new THREE.Mesh(exhaustGeom, exhaustMat);
    exhaustMesh.position.set(2, 7, 3);
    exhaustMesh.castShadow = true;
    exhaustMesh.receiveShadow = true;
    group.add(exhaustMesh);
    meshes.push(exhaustMesh);

    // Fuel tank (CylinderGeometry horizontal)
    var tankGeom = new THREE.CylinderGeometry(1, 1, 3, 16);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    var tankMesh = new THREE.Mesh(tankGeom, tankMat);
    tankMesh.rotation.z = Math.PI / 2;
    tankMesh.position.set(-4, 1.5, 0);
    tankMesh.castShadow = true;
    tankMesh.receiveShadow = true;
    group.add(tankMesh);
    meshes.push(tankMesh);

    scene.add(group);
    groups.generator = group;
  }

  function buildPerimeterFence() {
    var group = new THREE.Group();

    var fenceRadius = 40;
    var postCount = 16;
    var postMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var wireMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });

    for (var i = 0; i < postCount; i++) {
      var angle = (i / postCount) * Math.PI * 2;
      var x = Math.cos(angle) * fenceRadius;
      var z = Math.sin(angle) * fenceRadius;

      // Fence post (BoxGeometry)
      var postGeom = new THREE.BoxGeometry(0.4, 3, 0.4);
      var postMesh = new THREE.Mesh(postGeom, postMat);
      postMesh.position.set(x, 1.5, z);
      postMesh.castShadow = true;
      postMesh.receiveShadow = true;
      group.add(postMesh);
      meshes.push(postMesh);

      // Razor wire strands (LineSegments)
      var nextAngle = ((i + 1) % postCount) / postCount * Math.PI * 2;
      var nextX = Math.cos(nextAngle) * fenceRadius;
      var nextZ = Math.sin(nextAngle) * fenceRadius;

      var geom = new THREE.BufferGeometry();
      var pos = new Float32Array([
        x, 2.8, z, nextX, 2.8, nextZ,
        x, 2.5, z, nextX, 2.5, nextZ,
        x, 2.2, z, nextX, 2.2, nextZ
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var wireLines = new THREE.LineSegments(geom, wireMat);
      group.add(wireLines);
    }

    scene.add(group);
    groups.fence = group;
  }

  function buildVehicleCompound() {
    var group = new THREE.Group();
    group.position.set(25, 0, 15);

    var vehicleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });

    for (var v = 0; v < 3; v++) {
      // Vehicle body (BoxGeometry)
      var bodyGeom = new THREE.BoxGeometry(2.5, 2.5, 5);
      var bodyMesh = new THREE.Mesh(bodyGeom, vehicleMat);
      bodyMesh.position.set(v * 7 - 7, 1.25, 0);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);
      meshes.push(bodyMesh);

      // Tires (CylinderGeometry)
      var tireGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      var tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

      var tirePositions = [
        [-0.9, 0.6, -1.5],
        [0.9, 0.6, -1.5],
        [-0.9, 0.6, 1.5],
        [0.9, 0.6, 1.5]
      ];

      for (var t = 0; t < tirePositions.length; t++) {
        var tireMesh = new THREE.Mesh(tireGeom, tireMat);
        tireMesh.position.set(v * 7 - 7 + tirePositions[t][0], tirePositions[t][1], tirePositions[t][2]);
        tireMesh.rotation.z = Math.PI / 2;
        tireMesh.castShadow = true;
        tireMesh.receiveShadow = true;
        group.add(tireMesh);
        meshes.push(tireMesh);
      }
    }

    scene.add(group);
    groups.vehicles = group;
  }

  function buildCableRuns() {
    var group = new THREE.Group();
    var cableMat = new THREE.LineBasicMaterial({ color: 0x00aa00, linewidth: 1 });

    // Ground cable runs from tower to various sites
    var sites = [
      { pos: [12, 0.1, 12], name: 'dish' },
      { pos: [-15, 0.1, 0], name: 'yagi' },
      { pos: [0, 0.1, -25], name: 'bunker' },
      { pos: [25, 0.1, 15], name: 'vehicles' }
    ];

    for (var s = 0; s < sites.length; s++) {
      var geom = new THREE.BufferGeometry();
      var pos = new Float32Array([
        0, 0.1, 0,
        sites[s].pos[0], sites[s].pos[1], sites[s].pos[2]
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      var lines = new THREE.LineSegments(geom, cableMat);
      group.add(lines);
    }

    scene.add(group);
    groups.cables = group;
  }

  function buildSatelliteUplink() {
    var group = new THREE.Group();
    group.position.set(-12, 20, 20);

    // Dish reflector (SphereGeometry)
    var upGeom = new THREE.SphereGeometry(3, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2.5);
    var upMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.25 });
    var upMesh = new THREE.Mesh(upGeom, upMat);
    upMesh.castShadow = true;
    upMesh.receiveShadow = true;
    group.add(upMesh);
    meshes.push(upMesh);

    // Pedestal (CylinderGeometry)
    var pedGeom = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
    var pedMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    var pedMesh = new THREE.Mesh(pedGeom, pedMat);
    pedMesh.position.y = -1.5;
    pedMesh.castShadow = true;
    pedMesh.receiveShadow = true;
    group.add(pedMesh);
    meshes.push(pedMesh);

    scene.add(group);
    groups.satellite = group;
  }

  function buildWarningSign() {
    var group = new THREE.Group();
    group.position.set(30, 0, -8);

    // Sign post (BoxGeometry)
    var postGeom = new THREE.BoxGeometry(0.3, 4, 0.3);
    var postMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var postMesh = new THREE.Mesh(postGeom, postMat);
    postMesh.position.y = 2;
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    group.add(postMesh);
    meshes.push(postMesh);

    // Sign face (BoxGeometry red/white)
    var signGeom = new THREE.BoxGeometry(2.5, 2, 0.1);
    var signMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
    var signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(0, 3.5, 0.5);
    signMesh.castShadow = true;
    group.add(signMesh);
    meshes.push(signMesh);

    // White stripe (BoxGeometry)
    var stripeGeom = new THREE.BoxGeometry(2.5, 0.4, 0.1);
    var stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var stripeMesh = new THREE.Mesh(stripeGeom, stripeMat);
    stripeMesh.position.set(0, 3.5, 0.6);
    group.add(stripeMesh);
    meshes.push(stripeMesh);

    scene.add(group);
    groups.sign = group;
  }

  function buildGuardTower() {
    var group = new THREE.Group();
    group.position.set(-32, 0, 20);

    // Support legs (CylinderGeometry)
    var legGeom = new THREE.CylinderGeometry(0.3, 0.4, 6, 8);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

    var legPositions = [
      [-1.5, -1.5],
      [1.5, -1.5],
      [1.5, 1.5],
      [-1.5, 1.5]
    ];

    for (var l = 0; l < legPositions.length; l++) {
      var legMesh = new THREE.Mesh(legGeom, legMat);
      legMesh.position.set(legPositions[l][0], 3, legPositions[l][1]);
      legMesh.castShadow = true;
      legMesh.receiveShadow = true;
      group.add(legMesh);
      meshes.push(legMesh);
    }

    // Platform (BoxGeometry)
    var platformGeom = new THREE.BoxGeometry(4, 0.4, 4);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var platformMesh = new THREE.Mesh(platformGeom, platformMat);
    platformMesh.position.y = 6.2;
    platformMesh.castShadow = true;
    platformMesh.receiveShadow = true;
    group.add(platformMesh);
    meshes.push(platformMesh);

    // Guard booth (BoxGeometry)
    var boothGeom = new THREE.BoxGeometry(2.5, 2.2, 2.5);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var boothMesh = new THREE.Mesh(boothGeom, boothMat);
    boothMesh.position.y = 7.3;
    boothMesh.castShadow = true;
    boothMesh.receiveShadow = true;
    group.add(boothMesh);
    meshes.push(boothMesh);

    // Spotlight (ConeGeometry)
    var spotGeom = new THREE.ConeGeometry(0.4, 1.2, 12);
    var spotMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x444400 });
    var spotMesh = new THREE.Mesh(spotGeom, spotMat);
    spotMesh.position.set(0, 8.5, 0);
    spotMesh.castShadow = true;
    group.add(spotMesh);
    meshes.push(spotMesh);

    scene.add(group);
    groups.guard = group;
  }

  function buildLightningRod() {
    var group = new THREE.Group();
    group.position.set(0, 35, 0);

    // Rod (CylinderGeometry)
    var rodGeom = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
    var rodMat = new THREE.MeshStandardMaterial({ color: 0xdddd00, metalness: 0.95, roughness: 0.1 });
    var rodMesh = new THREE.Mesh(rodGeom, rodMat);
    rodMesh.castShadow = true;
    group.add(rodMesh);
    meshes.push(rodMesh);

    // Beacon light sphere at top
    var beaconGeom = new THREE.SphereGeometry(0.3, 8, 8);
    var beaconMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
    var beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    beaconMesh.position.y = 1.2;
    beaconMesh.castShadow = true;
    group.add(beaconMesh);
    meshes.push(beaconMesh);

    groups.beacon = beaconMesh;
    scene.add(group);
    groups.lightning = group;
  }

  function update(delta) {
    // Dish azimuth rotation (slow rotation)
    if (groups.dish) {
      dishAzimuth += delta * 0.1;
      groups.dish.rotation.y = dishAzimuth;
    }

    // Beacon blink
    beaconBlink += delta * 4;
    if (groups.beacon) {
      var intensity = Math.sin(beaconBlink) * 0.5 + 0.5;
      groups.beacon.material.emissiveIntensity = intensity;
    }

    // Antenna array oscillation
    antennaOscillation += delta * 2;
    if (groups.yagi) {
      groups.yagi.rotation.x = Math.sin(antennaOscillation) * 0.1;
    }
  }

  function reset() {
    dishAzimuth = 0;
    beaconBlink = 0;
    antennaOscillation = 0;

    if (groups.dish) {
      groups.dish.rotation.y = 0;
    }

    if (groups.beacon) {
      groups.beacon.material.emissiveIntensity = 1;
    }

    if (groups.yagi) {
      groups.yagi.rotation.x = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
