window.MidnightBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var baseObjects = [];
  var commTowerLight = null;
  var irTripWires = [];
  var starField = null;
  var animationTime = 0;

  var DARK_GRAY = 0x1a1a1a;
  var DARKER_GRAY = 0x0d0d0d;
  var DARKEST_GRAY = 0x050505;
  var NIGHT_GREEN = 0x00ff00;
  var RED_ALERT = 0xff0000;
  var DARK_RED = 0x330000;
  var METAL_GRAY = 0x2a2a2a;
  var BLUE_GLOW = 0x0066ff;

  function createBoxGeometry(w, h, d) {
    return new THREE.BoxGeometry(w, h, d);
  }

  function createCylinderGeometry(rTop, rBottom, h, segments) {
    return new THREE.CylinderGeometry(rTop, rBottom, h, segments || 16);
  }

  function createSphereGeometry(radius, segments) {
    return new THREE.SphereGeometry(radius, segments || 8, segments || 8);
  }

  function createConeGeometry(radius, height, segments) {
    return new THREE.ConeGeometry(radius, height, segments || 16);
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    var positionArray = [];
    for (var i = 0; i < points.length; i++) {
      positionArray.push(points[i].x, points[i].y, points[i].z);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionArray), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    return new THREE.LineSegments(geometry, material);
  }

  function addObjectToBase(obj) {
    scene.add(obj);
    baseObjects.push(obj);
    return obj;
  }

  function createPerimeterWalls() {
    var wallHeight = 8;
    var wallThickness = 0.5;
    var baseSize = 80;

    var northWall = new THREE.Mesh(
      createBoxGeometry(baseSize, wallHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.8, roughness: 0.9 })
    );
    northWall.position.set(0, wallHeight / 2, -(baseSize / 2));
    addObjectToBase(northWall);

    var southWall = new THREE.Mesh(
      createBoxGeometry(baseSize, wallHeight, wallThickness),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.8, roughness: 0.9 })
    );
    southWall.position.set(0, wallHeight / 2, baseSize / 2);
    addObjectToBase(southWall);

    var eastWall = new THREE.Mesh(
      createBoxGeometry(wallThickness, wallHeight, baseSize),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.8, roughness: 0.9 })
    );
    eastWall.position.set(baseSize / 2, wallHeight / 2, 0);
    addObjectToBase(eastWall);

    var westWall = new THREE.Mesh(
      createBoxGeometry(wallThickness, wallHeight, baseSize),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.8, roughness: 0.9 })
    );
    westWall.position.set(-(baseSize / 2), wallHeight / 2, 0);
    addObjectToBase(westWall);
  }

  function createGuardPostTowers() {
    var towerPositions = [
      { x: 35, z: -35 },
      { x: -35, z: -35 },
      { x: 35, z: 35 },
      { x: -35, z: 35 }
    ];

    towerPositions.forEach(function(pos) {
      var towerBase = new THREE.Mesh(
        createBoxGeometry(3, 10, 3),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.6 })
      );
      towerBase.position.set(pos.x, 5, pos.z);
      addObjectToBase(towerBase);

      var roofCone = new THREE.Mesh(
        createConeGeometry(2, 2, 8),
        new THREE.MeshStandardMaterial({ color: DARK_GRAY })
      );
      roofCone.position.set(pos.x, 11, pos.z);
      addObjectToBase(roofCone);

      var nvOptic = new THREE.Mesh(
        createSphereGeometry(0.6, 8),
        new THREE.MeshStandardMaterial({ color: NIGHT_GREEN, emissive: NIGHT_GREEN, emissiveIntensity: 0.6 })
      );
      nvOptic.position.set(pos.x, 9.5, pos.z - 1.8);
      addObjectToBase(nvOptic);
    });
  }

  function createStealthAircraftHangar() {
    var hangarLength = 45;
    var hangarWidth = 28;
    var hangarHeight = 18;

    var hangarBody = new THREE.Mesh(
      createBoxGeometry(hangarWidth, hangarHeight, hangarLength),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.9, roughness: 0.8 })
    );
    hangarBody.position.set(-8, hangarHeight / 2, 0);
    addObjectToBase(hangarBody);

    var doorFrameLeft = new THREE.Mesh(
      createBoxGeometry(1.5, hangarHeight - 1, hangarWidth - 2),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    doorFrameLeft.position.set(-8 - hangarWidth / 2 + 0.75, hangarHeight / 2, 0);
    addObjectToBase(doorFrameLeft);

    var doorFrameRight = new THREE.Mesh(
      createBoxGeometry(1.5, hangarHeight - 1, hangarWidth - 2),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    doorFrameRight.position.set(-8 + hangarWidth / 2 - 0.75, hangarHeight / 2, 0);
    addObjectToBase(doorFrameRight);

    var doorGapTop = new THREE.Mesh(
      createBoxGeometry(hangarWidth - 3, 1, 0.5),
      new THREE.MeshStandardMaterial({ color: DARK_GRAY })
    );
    doorGapTop.position.set(-8, hangarHeight - 0.5, -hangarLength / 2 + 0.25);
    addObjectToBase(doorGapTop);
  }

  function createStealthBomber() {
    var fuselage = new THREE.Mesh(
      createBoxGeometry(3, 2.5, 15),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.95, roughness: 0.7 })
    );
    fuselage.position.set(-8, 6, 0);
    addObjectToBase(fuselage);

    var leftWingTip = new THREE.Mesh(
      createConeGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.9 })
    );
    leftWingTip.position.set(-8 - 5, 5.5, -2);
    leftWingTip.rotation.z = Math.PI / 6;
    addObjectToBase(leftWingTip);

    var rightWingTip = new THREE.Mesh(
      createConeGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.9 })
    );
    rightWingTip.position.set(-8 + 5, 5.5, -2);
    rightWingTip.rotation.z = -Math.PI / 6;
    addObjectToBase(rightWingTip);

    var cockpitBump = new THREE.Mesh(
      createSphereGeometry(0.8, 6),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.8 })
    );
    cockpitBump.position.set(-8, 7.5, 5);
    addObjectToBase(cockpitBump);
  }

  function createRunway() {
    var runwayLength = 70;
    var runwayWidth = 16;

    var runwayStrip = new THREE.Mesh(
      createBoxGeometry(runwayWidth, 0.5, runwayLength),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 })
    );
    runwayStrip.position.set(28, 0.25, 0);
    addObjectToBase(runwayStrip);

    var lightPositions = [];
    for (var i = 0; i < runwayLength; i += 4) {
      lightPositions.push(
        { x: 28 - runwayWidth / 2 - 1, z: -(runwayLength / 2) + i },
        { x: 28 + runwayWidth / 2 + 1, z: -(runwayLength / 2) + i }
      );
    }

    lightPositions.forEach(function(pos) {
      var lightMarker = new THREE.Mesh(
        createSphereGeometry(0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 0.5 })
      );
      lightMarker.position.set(pos.x, 0.5, pos.z);
      addObjectToBase(lightMarker);
    });
  }

  function createFuelDepot() {
    var tankPositions = [
      { x: -22, z: -28 },
      { x: -22, z: -20 },
      { x: -22, z: -12 },
      { x: -14, z: -28 },
      { x: -14, z: -20 }
    ];

    tankPositions.forEach(function(pos) {
      var tank = new THREE.Mesh(
        createCylinderGeometry(2.5, 2.5, 10, 16),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.8 })
      );
      tank.position.set(pos.x, 5, pos.z);
      addObjectToBase(tank);

      var tankTop = new THREE.Mesh(
        createConeGeometry(2.5, 1.5, 16),
        new THREE.MeshStandardMaterial({ color: DARK_GRAY })
      );
      tankTop.position.set(pos.x, 10.5, pos.z);
      addObjectToBase(tankTop);
    });

    var fenceLinePoints = [
      new THREE.Vector3(-28, 0, -33),
      new THREE.Vector3(-8, 0, -33),
      new THREE.Vector3(-8, 0, -8),
      new THREE.Vector3(-28, 0, -8),
      new THREE.Vector3(-28, 0, -33)
    ];

    for (var i = 0; i < fenceLinePoints.length - 1; i++) {
      var segment = createLineSegments(
        [fenceLinePoints[i], fenceLinePoints[i + 1]],
        DARK_GRAY
      );
      addObjectToBase(segment);
    }

    for (var j = 0; j < fenceLinePoints.length - 1; j++) {
      var fencePost = new THREE.Mesh(
        createBoxGeometry(0.3, 3, 0.3),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
      );
      fencePost.position.set(fenceLinePoints[j].x, 1.5, fenceLinePoints[j].z);
      addObjectToBase(fencePost);
    }
  }

  function createCommsTower() {
    var mastSegment1 = new THREE.Mesh(
      createCylinderGeometry(0.6, 0.6, 15, 12),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.9 })
    );
    mastSegment1.position.set(38, 7.5, -25);
    addObjectToBase(mastSegment1);

    var mastSegment2 = new THREE.Mesh(
      createCylinderGeometry(0.4, 0.4, 10, 12),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.9 })
    );
    mastSegment2.position.set(38, 17.5, -25);
    addObjectToBase(mastSegment2);

    var baseInulator = new THREE.Mesh(
      createSphereGeometry(1, 8),
      new THREE.MeshStandardMaterial({ color: DARK_GRAY })
    );
    baseInulator.position.set(38, 0.5, -25);
    addObjectToBase(baseInulator);

    var antennaArrayPoints = [];
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = 38 + Math.cos(angle) * 3;
      var z = -25 + Math.sin(angle) * 3;
      antennaArrayPoints.push(
        new THREE.Vector3(x, 20, z),
        new THREE.Vector3(x, 22, z)
      );
    }

    for (var j = 0; j < antennaArrayPoints.length; j += 2) {
      var antennaSegment = createLineSegments(
        [antennaArrayPoints[j], antennaArrayPoints[j + 1]],
        METAL_GRAY
      );
      addObjectToBase(antennaSegment);
    }

    commTowerLight = new THREE.Mesh(
      createSphereGeometry(0.5, 8),
      new THREE.MeshStandardMaterial({ color: RED_ALERT, emissive: RED_ALERT, emissiveIntensity: 0.8 })
    );
    commTowerLight.position.set(38, 23, -25);
    addObjectToBase(commTowerLight);
  }

  function createOpsCenter() {
    var building = new THREE.Mesh(
      createBoxGeometry(12, 6, 10),
      new THREE.MeshStandardMaterial({ color: DARK_GRAY, metalness: 0.6 })
    );
    building.position.set(35, 3, 18);
    addObjectToBase(building);

    var windowPositions = [
      { x: 30, y: 4, z: 18 },
      { x: 40, y: 4, z: 18 },
      { x: 30, y: 2, z: 18 },
      { x: 40, y: 2, z: 18 },
      { x: 35, y: 4, z: 23 },
      { x: 35, y: 2, z: 23 }
    ];

    windowPositions.forEach(function(pos) {
      var windowInset = new THREE.Mesh(
        createBoxGeometry(1.5, 1.2, 0.4),
        new THREE.MeshStandardMaterial({ color: BLUE_GLOW, emissive: BLUE_GLOW, emissiveIntensity: 0.7 })
      );
      windowInset.position.set(pos.x, pos.y, pos.z);
      addObjectToBase(windowInset);
    });

    var roofPlate = new THREE.Mesh(
      createBoxGeometry(13, 0.5, 11),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.8 })
    );
    roofPlate.position.set(35, 6.25, 18);
    addObjectToBase(roofPlate);
  }

  function createGuardVehicleWrecks() {
    var wrecks = [
      { x: 20, z: 10 },
      { x: -30, z: 15 },
      { x: 25, z: -18 }
    ];

    wrecks.forEach(function(pos) {
      var chassis = new THREE.Mesh(
        createBoxGeometry(2.5, 1.5, 5),
        new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.7 })
      );
      chassis.position.set(pos.x, 0.75, pos.z);
      chassis.rotation.z = Math.random() * 0.3;
      addObjectToBase(chassis);

      var wheel1 = new THREE.Mesh(
        createCylinderGeometry(0.8, 0.8, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
      );
      wheel1.position.set(pos.x - 0.8, 0.8, pos.z - 1.5);
      wheel1.rotation.x = Math.PI / 2;
      addObjectToBase(wheel1);

      var wheel2 = new THREE.Mesh(
        createCylinderGeometry(0.8, 0.8, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
      );
      wheel2.position.set(pos.x + 0.8, 0.8, pos.z - 1.5);
      wheel2.rotation.x = Math.PI / 2;
      addObjectToBase(wheel2);

      var wheel3 = new THREE.Mesh(
        createCylinderGeometry(0.8, 0.8, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
      );
      wheel3.position.set(pos.x - 0.8, 0.8, pos.z + 1.5);
      wheel3.rotation.x = Math.PI / 2;
      addObjectToBase(wheel3);

      var wheel4 = new THREE.Mesh(
        createCylinderGeometry(0.8, 0.8, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
      );
      wheel4.position.set(pos.x + 0.8, 0.8, pos.z + 1.5);
      wheel4.rotation.x = Math.PI / 2;
      addObjectToBase(wheel4);

      var cabinDamage = new THREE.Mesh(
        createBoxGeometry(2, 1, 2),
        new THREE.MeshStandardMaterial({ color: DARK_RED, metalness: 0.5 })
      );
      cabinDamage.position.set(pos.x, 1.5, pos.z);
      addObjectToBase(cabinDamage);
    });
  }

  function createCraterFromStrike() {
    var craterDepth = 3;
    var craterRadius = 8;

    var craterBowl = new THREE.Mesh(
      createSphereGeometry(craterRadius, 12),
      new THREE.MeshStandardMaterial({ color: 0x1a0000, metalness: 0.4, roughness: 0.95 })
    );
    craterBowl.position.set(-25, -craterDepth / 2, 20);
    craterBowl.scale.set(1, 0.6, 1);
    addObjectToBase(craterBowl);

    var smolderingHotSpot1 = new THREE.Mesh(
      createSphereGeometry(2, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.4 })
    );
    smolderingHotSpot1.position.set(-25, 0.2, 20);
    addObjectToBase(smolderingHotSpot1);

    var smolderingHotSpot2 = new THREE.Mesh(
      createSphereGeometry(1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 0.3 })
    );
    smolderingHotSpot2.position.set(-27, 0.5, 22);
    addObjectToBase(smolderingHotSpot2);

    var craterRimSegments = [];
    for (var i = 0; i < 16; i++) {
      var angle = (i / 16) * Math.PI * 2;
      var x = -25 + Math.cos(angle) * craterRadius;
      var z = 20 + Math.sin(angle) * craterRadius;
      craterRimSegments.push(new THREE.Vector3(x, 0.3, z));
    }
    craterRimSegments.push(craterRimSegments[0]);

    for (var j = 0; j < craterRimSegments.length - 1; j++) {
      var rimLine = createLineSegments(
        [craterRimSegments[j], craterRimSegments[j + 1]],
        DARK_RED
      );
      addObjectToBase(rimLine);
    }
  }

  function createInfraredTripWires() {
    var wireConfigurations = [
      { y: 0.3, startX: -20, endX: -10, z: -30, intensity: 1.0 },
      { y: 1.2, startX: -20, endX: -10, z: -30, intensity: 0.8 },
      { y: 0.3, startX: 15, endX: 25, z: -35, intensity: 1.0 },
      { y: 1.2, startX: 15, endX: 25, z: -35, intensity: 0.8 },
      { y: 0.3, startX: 30, endX: 40, z: 5, intensity: 1.0 },
      { y: 1.2, startX: 30, endX: 40, z: 5, intensity: 0.8 }
    ];

    wireConfigurations.forEach(function(config) {
      var wirePoints = [
        new THREE.Vector3(config.startX, config.y, config.z),
        new THREE.Vector3(config.endX, config.y, config.z)
      ];

      var wireSegment = createLineSegments(wirePoints, RED_ALERT);
      wireSegment.userData.intensity = config.intensity;
      wireSegment.userData.baseIntensity = config.intensity;
      addObjectToBase(wireSegment);
      irTripWires.push(wireSegment);
    });
  }

  function createStarField() {
    var starGeometries = [];
    var starColors = [];

    for (var i = 0; i < 200; i++) {
      var x = (Math.random() - 0.5) * 200;
      var y = 50 + Math.random() * 30;
      var z = (Math.random() - 0.5) * 200;

      var starSphere = createSphereGeometry(0.15, 4);
      starSphere.translate(x, y, z);
      starGeometries.push(starSphere);

      var brightness = 0.6 + Math.random() * 0.4;
      starColors.push(brightness, brightness, brightness);
    }

    var mergedStarGeometry = new THREE.BufferGeometry();
    var positions = [];
    var colors = [];

    for (var j = 0; j < starGeometries.length; j++) {
      var posAttr = starGeometries[j].getAttribute('position');
      for (var k = 0; k < posAttr.count; k++) {
        positions.push(posAttr.getX(k), posAttr.getY(k), posAttr.getZ(k));
        colors.push(starColors[j * 3], starColors[j * 3 + 1], starColors[j * 3 + 2]);
      }
    }

    mergedStarGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    mergedStarGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

    starField = new THREE.Mesh(
      mergedStarGeometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0.8 })
    );
    addObjectToBase(starField);
  }

  function createEmergencyRedLighting() {
    var lightPositions = [
      { x: -8, y: 8, z: 0 },
      { x: 35, y: 7, z: 18 },
      { x: 38, y: 12, z: -25 },
      { x: -22, y: 6, z: -20 },
      { x: 28, y: 3, z: 0 },
      { x: -35, y: 6, z: -35 },
      { x: 35, y: 6, z: 35 }
    ];

    lightPositions.forEach(function(pos) {
      var emergencyLight = new THREE.Mesh(
        createSphereGeometry(0.4, 8),
        new THREE.MeshStandardMaterial({ color: RED_ALERT, emissive: RED_ALERT, emissiveIntensity: 0.5 })
      );
      emergencyLight.position.set(pos.x, pos.y, pos.z);
      emergencyLight.userData.pulsePhase = Math.random() * Math.PI * 2;
      addObjectToBase(emergencyLight);
    });
  }

  function createAdditionalStructures() {
    var guardHut1 = new THREE.Mesh(
      createBoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    guardHut1.position.set(28, 1.25, -28);
    addObjectToBase(guardHut1);

    var guardHut2 = new THREE.Mesh(
      createBoxGeometry(3, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    guardHut2.position.set(-28, 1.25, 28);
    addObjectToBase(guardHut2);

    var searchlightBase1 = new THREE.Mesh(
      createCylinderGeometry(1.5, 1.5, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    searchlightBase1.position.set(35, 0.4, -30);
    addObjectToBase(searchlightBase1);

    var searchlightMount1 = new THREE.Mesh(
      createBoxGeometry(0.4, 2, 0.4),
      new THREE.MeshStandardMaterial({ color: METAL_GRAY })
    );
    searchlightMount1.position.set(35, 1.8, -30);
    addObjectToBase(searchlightMount1);

    var searchlightHead1 = new THREE.Mesh(
      createConeGeometry(1.2, 1.5, 12),
      new THREE.MeshStandardMaterial({ color: DARK_GRAY })
    );
    searchlightHead1.position.set(35, 3, -30);
    addObjectToBase(searchlightHead1);

    var radarDish = new THREE.Mesh(
      createSphereGeometry(3, 12),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.85 })
    );
    radarDish.position.set(-35, 8, -28);
    radarDish.scale.set(1, 0.3, 1);
    addObjectToBase(radarDish);

    var radarMast = new THREE.Mesh(
      createCylinderGeometry(0.5, 0.5, 10, 12),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.8 })
    );
    radarMast.position.set(-35, 5, -28);
    addObjectToBase(radarMast);

    var supplyBunker = new THREE.Mesh(
      createBoxGeometry(8, 4, 6),
      new THREE.MeshStandardMaterial({ color: DARKEST_GRAY, metalness: 0.5 })
    );
    supplyBunker.position.set(-10, 2, 30);
    addObjectToBase(supplyBunker);

    var bunkerDoor = new THREE.Mesh(
      createBoxGeometry(3, 3.5, 0.5),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY, metalness: 0.7 })
    );
    bunkerDoor.position.set(-10, 2, 33);
    addObjectToBase(bunkerDoor);

    var powerGenerator1 = new THREE.Mesh(
      createCylinderGeometry(1.2, 1.2, 3, 8),
      new THREE.MeshStandardMaterial({ color: DARK_RED, metalness: 0.6 })
    );
    powerGenerator1.position.set(5, 1.5, 25);
    addObjectToBase(powerGenerator1);

    var powerGenerator2 = new THREE.Mesh(
      createCylinderGeometry(1.2, 1.2, 3, 8),
      new THREE.MeshStandardMaterial({ color: DARK_RED, metalness: 0.6 })
    );
    powerGenerator2.position.set(10, 1.5, 25);
    addObjectToBase(powerGenerator2);

    var controlCab = new THREE.Mesh(
      createBoxGeometry(4, 3, 3),
      new THREE.MeshStandardMaterial({ color: DARKER_GRAY })
    );
    controlCab.position.set(7.5, 1.5, -10);
    addObjectToBase(controlCab);

    var controlWindow = new THREE.Mesh(
      createBoxGeometry(2, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: BLUE_GLOW, emissive: BLUE_GLOW, emissiveIntensity: 0.6 })
    );
    controlWindow.position.set(7.5, 2.5, -11.5);
    addObjectToBase(controlWindow);
  }

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    baseObjects = [];
    animationTime = 0;

    createPerimeterWalls();
    createGuardPostTowers();
    createStealthAircraftHangar();
    createStealthBomber();
    createRunway();
    createFuelDepot();
    createCommsTower();
    createOpsCenter();
    createGuardVehicleWrecks();
    createCraterFromStrike();
    createInfraredTripWires();
    createStarField();
    createEmergencyRedLighting();
    createAdditionalStructures();

    var ambientLight = new THREE.AmbientLight(0x0a0a0a, 0.3);
    scene.add(ambientLight);
    baseObjects.push(ambientLight);

    var dirLight = new THREE.DirectionalLight(0x1a1a2e, 0.2);
    dirLight.position.set(20, 30, -20);
    scene.add(dirLight);
    baseObjects.push(dirLight);
  }

  function update(delta) {
    animationTime += delta;

    if (commTowerLight) {
      var blinkCycle = 0.8;
      var blinkFraction = (animationTime % blinkCycle) / blinkCycle;
      var isOn = blinkFraction < 0.3;
      commTowerLight.material.emissiveIntensity = isOn ? 0.8 : 0.1;
    }

    irTripWires.forEach(function(wire) {
      var pulseSpeed = 2;
      var pulse = Math.sin(animationTime * pulseSpeed) * 0.5 + 0.5;
      wire.material.linewidth = 1 + pulse * 2;
      wire.material.opacity = wire.userData.baseIntensity * (0.5 + pulse * 0.5);
    });

    if (starField) {
      starField.rotation.y += delta * 0.02;
    }

    var emergencyLights = baseObjects.filter(function(obj) {
      return obj.userData && obj.userData.pulsePhase !== undefined;
    });

    emergencyLights.forEach(function(light) {
      var pulseValue = Math.sin(animationTime * 3 + light.userData.pulsePhase) * 0.5 + 0.5;
      light.material.emissiveIntensity = pulseValue * 0.5 + 0.2;
    });
  }

  function reset() {
    baseObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });
    baseObjects = [];
    irTripWires = [];
    commTowerLight = null;
    starField = null;
    animationTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
