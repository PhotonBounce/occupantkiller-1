window.LightningTower = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedElements = [];

  var colors = {
    electricWhite: 0xEEFFFF,
    electricBlue: 0x0088FF,
    copperOrange: 0xFF8C00,
    metallicGray: 0x888888,
    warningYellow: 0xFFDD00,
    darkGray: 0x444444,
    lightGray: 0xCCCCCC,
    brightBlue: 0x00CCFF
  };

  function createMaterial(color, emissive, intensity) {
    emissive = emissive || 0x000000;
    intensity = intensity !== undefined ? intensity : 0;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: intensity,
      metalness: 0.7,
      roughness: 0.3
    });
  }

  function addToScene(obj) {
    scene.add(obj);
    objects.push(obj);
    return obj;
  }

  function createMainTower() {
    var tower = new THREE.Group();

    var mainCylinderGeo = new THREE.CylinderGeometry(8, 12, 40, 32);
    var mainCylinderMat = createMaterial(colors.metallicGray, colors.electricBlue, 0.3);
    var mainCylinder = new THREE.Mesh(mainCylinderGeo, mainCylinderMat);
    mainCylinder.position.set(0, 20, 0);
    tower.add(mainCylinder);

    var towerCapGeo = new THREE.ConeGeometry(9, 8, 32);
    var towerCapMat = createMaterial(colors.electricWhite, colors.electricBlue, 0.5);
    var towerCap = new THREE.Mesh(towerCapGeo, towerCapMat);
    towerCap.position.set(0, 44, 0);
    tower.add(towerCap);

    var ringRad = 12.5;
    for (var i = 0; i < 4; i++) {
      var angle = (Math.PI / 2) * i;
      var ringGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
      var ringMat = createMaterial(colors.copperOrange, colors.copperOrange, 0.2);
      var ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(Math.cos(angle) * ringRad, 15, Math.sin(angle) * ringRad);
      tower.add(ring);
    }

    return addToScene(tower);
  }

  function createTeslaCoils() {
    var coilGroup = new THREE.Group();
    var coilDistance = 25;
    var positions = [
      { x: coilDistance, z: 0 },
      { x: -coilDistance, z: 0 },
      { x: 0, z: coilDistance },
      { x: 0, z: -coilDistance }
    ];

    positions.forEach(function(pos) {
      var coil = new THREE.Group();

      var platformGeo = new THREE.CylinderGeometry(6, 6, 0.5, 32);
      var platformMat = createMaterial(colors.darkGray);
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.y = 0.25;
      coil.add(platform);

      var coilGeo = new THREE.CylinderGeometry(2.5, 3, 8, 16);
      var coilMat = createMaterial(colors.copperOrange, colors.copperOrange, 0.1);
      var coilCyl = new THREE.Mesh(coilGeo, coilMat);
      coilCyl.position.y = 5;
      coil.add(coilCyl);

      var topSphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
      var topSphereMat = createMaterial(colors.electricWhite, colors.electricBlue, 0.4);
      var topSphere = new THREE.Mesh(topSphereGeo, topSphereMat);
      topSphere.position.y = 13.5;
      coil.add(topSphere);

      animatedElements.push({
        object: topSphere,
        type: 'tesla',
        baseScale: 3.5,
        time: 0
      });

      coil.position.set(pos.x, 0, pos.z);
      coilGroup.add(coil);
    });

    return addToScene(coilGroup);
  }

  function createPowerFacility() {
    var facility = new THREE.Group();
    facility.position.set(-30, 0, -30);

    var buildingGeo = new THREE.BoxGeometry(20, 12, 20);
    var buildingMat = createMaterial(colors.darkGray);
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.set(0, 6, 0);
    facility.add(building);

    var roofGeo = new THREE.ConeGeometry(11, 3, 32);
    var roofMat = createMaterial(colors.metallicGray);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 15, 0);
    facility.add(roof);

    for (var i = 0; i < 3; i++) {
      var ductGeo = new THREE.CylinderGeometry(1, 1, 8, 16);
      var ductMat = createMaterial(colors.metallicGray, 0, 0);
      var duct = new THREE.Mesh(ductGeo, ductMat);
      duct.position.set(-6 + i * 6, 18, 0);
      facility.add(duct);
    }

    var panelGeo = new THREE.BoxGeometry(2, 5, 15);
    var panelMat = createMaterial(colors.electricBlue, colors.electricBlue, 0.2);
    for (var j = 0; j < 4; j++) {
      var panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(-9 + j * 6, 6, -11);
      facility.add(panel);
    }

    return addToScene(facility);
  }

  function createLightningArcGenerators() {
    var arcGroup = new THREE.Group();

    var positions = [
      { x: 15, z: 15 },
      { x: -15, z: 15 },
      { x: 15, z: -15 },
      { x: -15, z: -15 }
    ];

    positions.forEach(function(pos) {
      var generator = new THREE.Group();

      var post1Geo = new THREE.CylinderGeometry(0.6, 0.8, 12, 16);
      var postMat = createMaterial(colors.copperOrange);
      var post1 = new THREE.Mesh(post1Geo, postMat);
      post1.position.set(-2, 6, 0);
      generator.add(post1);

      var post2 = new THREE.Mesh(post1Geo, postMat);
      post2.position.set(2, 6, 0);
      generator.add(post2);

      var arcPoints = [
        new THREE.Vector3(-2, 12, 0),
        new THREE.Vector3(0, 14, 0),
        new THREE.Vector3(2, 12, 0)
      ];
      var arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      var arcMat = new THREE.LineBasicMaterial({ color: colors.electricBlue, linewidth: 3 });
      var arc = new THREE.LineSegments(arcGeo, arcMat);
      generator.add(arc);

      animatedElements.push({
        object: arc,
        type: 'arc',
        basePoints: arcPoints,
        time: Math.random() * Math.PI * 2
      });

      generator.position.set(pos.x, 0, pos.z);
      arcGroup.add(generator);
    });

    return addToScene(arcGroup);
  }

  function createInsulatorStacks() {
    var stackGroup = new THREE.Group();

    var angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

    angles.forEach(function(angle) {
      var stack = new THREE.Group();
      var stackDistance = 20;

      for (var i = 0; i < 5; i++) {
        var insulatorGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
        var insulatorMat = createMaterial(colors.lightGray);
        var insulator = new THREE.Mesh(insulatorGeo, insulatorMat);
        insulator.position.y = i * 0.9;
        stack.add(insulator);
      }

      var pylonGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 12);
      var pylonMat = createMaterial(colors.metallicGray);
      var pylon = new THREE.Mesh(pylonGeo, pylonMat);
      pylon.position.y = -4;
      stack.add(pylon);

      stack.position.set(Math.cos(angle) * stackDistance, 0, Math.sin(angle) * stackDistance);
      stackGroup.add(stack);
    });

    return addToScene(stackGroup);
  }

  function createConductorLines() {
    var lineGroup = new THREE.Group();
    var lineMat = new THREE.LineBasicMaterial({ color: colors.copperOrange, linewidth: 2 });

    var mainTowerPos = new THREE.Vector3(0, 20, 0);
    var coilPositions = [
      new THREE.Vector3(25, 13, 0),
      new THREE.Vector3(-25, 13, 0),
      new THREE.Vector3(0, 13, 25),
      new THREE.Vector3(0, 13, -25)
    ];

    coilPositions.forEach(function(coilPos) {
      var points = [mainTowerPos, coilPos];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(lineGeo, lineMat);
      lineGroup.add(line);
    });

    var facilityPos = new THREE.Vector3(-30, 6, -30);
    var facilityLine = new THREE.BufferGeometry().setFromPoints([mainTowerPos, facilityPos]);
    var fLine = new THREE.LineSegments(facilityLine, lineMat);
    lineGroup.add(fLine);

    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 * i) / 8;
      var radius = 28;
      var periphPos = new THREE.Vector3(Math.cos(angle) * radius, 10, Math.sin(angle) * radius);
      var pLine = new THREE.BufferGeometry().setFromPoints([mainTowerPos, periphPos]);
      var pLineSegments = new THREE.LineSegments(pLine, lineMat);
      lineGroup.add(pLineSegments);
    }

    return addToScene(lineGroup);
  }

  function createControlBunker() {
    var bunker = new THREE.Group();
    bunker.position.set(30, 0, -30);

    var structureGeo = new THREE.BoxGeometry(18, 8, 18);
    var structureMat = createMaterial(colors.darkGray);
    var structure = new THREE.Mesh(structureGeo, structureMat);
    structure.position.y = 4;
    bunker.add(structure);

    var roofGeo = new THREE.BoxGeometry(19, 0.5, 19);
    var roofMat = createMaterial(colors.metallicGray);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 8.5;
    bunker.add(roof);

    var mastGeo = new THREE.CylinderGeometry(0.4, 0.5, 12, 16);
    var mastMat = createMaterial(colors.copperOrange);
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(8, 14, -8);
    bunker.add(mast);

    var antennaGeo = new THREE.SphereGeometry(0.6, 8, 8);
    var antennaMat = createMaterial(colors.electricWhite, colors.electricBlue, 0.3);
    var antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(8, 26, -8);
    bunker.add(antenna);

    for (var i = 0; i < 4; i++) {
      var windowGeo = new THREE.BoxGeometry(2, 2, 0.1);
      var windowMat = createMaterial(colors.electricBlue, colors.electricBlue, 0.2);
      var window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(-8 + i * 6, 4, -9.1);
      bunker.add(window);
    }

    return addToScene(bunker);
  }

  function createCapacitorBanks() {
    var bankGroup = new THREE.Group();
    bankGroup.position.set(32, 1, -28);

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var capGeo = new THREE.BoxGeometry(2.5, 4, 2.5);
        var capMat = createMaterial(colors.electricBlue, colors.electricBlue, 0.15);
        var capacitor = new THREE.Mesh(capGeo, capMat);
        capacitor.position.set(col * 3.5 - 5, row * 4.5 + 2, 0);
        bankGroup.add(capacitor);
      }
    }

    return addToScene(bankGroup);
  }

  function createEMPCraters() {
    var craterGroup = new THREE.Group();

    var craterPositions = [
      { x: 25, z: 25 },
      { x: -25, z: 25 },
      { x: -25, z: -25 }
    ];

    craterPositions.forEach(function(pos) {
      var craterGeo = new THREE.BoxGeometry(10, 1.5, 10);
      var craterMat = createMaterial(colors.darkGray);
      var crater = new THREE.Mesh(craterGeo, craterMat);
      crater.position.set(pos.x, -1, pos.z);
      craterGroup.add(crater);

      var rimGeo = new THREE.BoxGeometry(11, 0.2, 11);
      var rimMat = createMaterial(colors.metallicGray);
      var rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(pos.x, 0.2, pos.z);
      craterGroup.add(rim);
    });

    return addToScene(craterGroup);
  }

  function createWarningPerimeter() {
    var perimeterGroup = new THREE.Group();
    var perimeterRadius = 35;
    var postCount = 12;
    var lineMat = new THREE.LineBasicMaterial({ color: colors.warningYellow, linewidth: 2 });

    for (var i = 0; i < postCount; i++) {
      var angle = (Math.PI * 2 * i) / postCount;
      var x = Math.cos(angle) * perimeterRadius;
      var z = Math.sin(angle) * perimeterRadius;

      var postGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
      var postMat = createMaterial(colors.warningYellow);
      var post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 1.5, z);
      perimeterGroup.add(post);

      if (i < postCount - 1) {
        var nextAngle = (Math.PI * 2 * (i + 1)) / postCount;
        var nextX = Math.cos(nextAngle) * perimeterRadius;
        var nextZ = Math.sin(nextAngle) * perimeterRadius;
        var barPoints = [
          new THREE.Vector3(x, 2.5, z),
          new THREE.Vector3(nextX, 2.5, nextZ)
        ];
        var barGeo = new THREE.BufferGeometry().setFromPoints(barPoints);
        var bar = new THREE.LineSegments(barGeo, lineMat);
        perimeterGroup.add(bar);
      }
    }

    return addToScene(perimeterGroup);
  }

  function createBurnedVehicles() {
    var vehicleGroup = new THREE.Group();

    var positions = [
      { x: 30, z: 25 },
      { x: -30, z: -25 },
      { x: 28, z: -28 }
    ];

    positions.forEach(function(pos) {
      var vehicle = new THREE.Group();

      var bodyGeo = new THREE.BoxGeometry(4, 2, 8);
      var bodyMat = createMaterial(colors.darkGray);
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1;
      vehicle.add(body);

      var cabGeo = new THREE.BoxGeometry(3, 2, 3);
      var cabMat = createMaterial(colors.darkGray);
      var cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 3, -2);
      vehicle.add(cab);

      var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
      var wheelMat = createMaterial(0x222222);
      for (var w = 0; w < 4; w++) {
        var wheel = new THREE.Mesh(wheelGeo, wheelMat);
        var wheelX = w < 2 ? -1.5 : 1.5;
        var wheelZ = w % 2 === 0 ? -2.5 : 2.5;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.8, wheelZ);
        vehicle.add(wheel);
      }

      vehicle.position.set(pos.x, 0, pos.z);
      vehicleGroup.add(vehicle);
    });

    return addToScene(vehicleGroup);
  }

  function createSensorArray() {
    var arrayGroup = new THREE.Group();

    var ringGeo = new THREE.BoxGeometry(50, 0.3, 50);
    var ringMat = createMaterial(colors.metallicGray);
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.15;
    arrayGroup.add(ring);

    var sensorCount = 16;
    for (var i = 0; i < sensorCount; i++) {
      var angle = (Math.PI * 2 * i) / sensorCount;
      var radius = 24;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var podGeo = new THREE.CylinderGeometry(0.8, 1, 3, 12);
      var podMat = createMaterial(colors.electricBlue, colors.electricBlue, 0.1);
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(x, 1.5, z);
      arrayGroup.add(pod);

      var domeGeo = new THREE.SphereGeometry(1, 8, 8);
      var domeMat = createMaterial(colors.electricWhite, colors.electricBlue, 0.2);
      var dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.set(x, 4, z);
      arrayGroup.add(dome);
    }

    return addToScene(arrayGroup);
  }

  function createElectricOrbs() {
    var orbGroup = new THREE.Group();

    var orbCount = 8;
    for (var i = 0; i < orbCount; i++) {
      var angle = (Math.PI * 2 * i) / orbCount;
      var x = Math.cos(angle) * 30;
      var z = Math.sin(angle) * 30;
      var y = 20 + Math.random() * 15;

      var orbGeo = new THREE.SphereGeometry(1.2, 16, 16);
      var orbMat = createMaterial(colors.electricBlue, colors.electricBlue, 0.6);
      var orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(x, y, z);
      orbGroup.add(orb);

      animatedElements.push({
        object: orb,
        type: 'orb',
        baseScale: 1.2,
        time: Math.random() * Math.PI * 2
      });
    }

    return addToScene(orbGroup);
  }

  function createGround() {
    var groundGeo = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMat = createMaterial(colors.darkGray);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.25;
    return addToScene(ground);
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedElements = [];

    createGround();
    createMainTower();
    createTeslaCoils();
    createPowerFacility();
    createLightningArcGenerators();
    createInsulatorStacks();
    createConductorLines();
    createControlBunker();
    createCapacitorBanks();
    createEMPCraters();
    createWarningPerimeter();
    createBurnedVehicles();
    createSensorArray();
    createElectricOrbs();

    return objects.length;
  }

  function update(delta) {
    animatedElements.forEach(function(elem) {
      if (elem.type === 'tesla') {
        var pulse = 0.5 + 0.5 * Math.sin(elem.time * 4);
        elem.object.scale.set(pulse, pulse, pulse);
        elem.object.material.emissiveIntensity = 0.2 + pulse * 0.3;
        elem.time += delta;
      } else if (elem.type === 'arc') {
        var jitterAmount = 0.5;
        var positions = elem.object.geometry.attributes.position.array;
        var basePoints = elem.basePoints;
        for (var i = 0; i < basePoints.length; i++) {
          positions[i * 3] = basePoints[i].x + (Math.random() - 0.5) * jitterAmount;
          positions[i * 3 + 1] = basePoints[i].y + (Math.random() - 0.5) * jitterAmount;
          positions[i * 3 + 2] = basePoints[i].z + (Math.random() - 0.5) * jitterAmount;
        }
        elem.object.geometry.attributes.position.needsUpdate = true;
        elem.time += delta;
        if (Math.random() < 0.1) {
          elem.object.material.color.setHex(colors.electricWhite);
        } else {
          elem.object.material.color.setHex(colors.electricBlue);
        }
      } else if (elem.type === 'orb') {
        var orbPulse = 0.8 + 0.4 * Math.sin(elem.time * 3);
        elem.object.scale.set(orbPulse, orbPulse, orbPulse);
        elem.object.material.emissiveIntensity = 0.4 + orbPulse * 0.2;
        elem.time += delta;
      }
    });
  }

  function reset() {
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];
    animatedElements = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
