window.MountaintopBase = (function() {
  'use strict';

  // Scene references
  var scene = null;
  var camera = null;

  // Platform and terrain
  var basePlatform = null;
  var terrain = [];
  var platformObjects = [];

  // Laser weapon system
  var laserArray = null;
  var laserBarrels = [];
  var laserTips = [];
  var laserRotation = 0;
  var laserElevation = 0;

  // Radar system
  var radarDome = null;
  var radarHousing = null;
  var radarRotation = 0;

  // Cable car system
  var cableCar = null;
  var cableCarCabin = null;
  var cableCarPosition = 0;
  var cableLines = [];
  var cableDrums = [];

  // Guard rails and defensive positions
  var guardRails = [];
  var sniperPositions = [];

  // Other structures
  var helicopterPad = null;
  var antennaArray = [];
  var weatherStation = null;
  var powerBunker = null;
  var emergencyShelter = null;
  var satelliteDish = null;
  var accessLadder = null;

  // Beacon and lighting
  var warningBeacon = null;
  var beaconIntensity = 1;
  var beaconDirection = -0.02;

  // Snow particles
  var snowParticles = [];
  var windPhase = 0;

  // Climbing anchors
  var climbingAnchors = [];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    // Build the mountaintop
    buildBasePlatform();
    buildLaserWeaponArray();
    buildRadarSystem();
    buildCableCarStation();
    buildGuardRails();
    buildSniperPositions();
    buildHelicopterPad();
    buildAntennaArray();
    buildWeatherStation();
    buildPowerBunker();
    buildEmergencyShelter();
    buildSatelliteDish();
    buildAccessLadder();
    buildSnowPatches();
    buildClimbingAnchors();
    buildBeacon();
  }

  function buildBasePlatform() {
    // Main rocky summit platform - irregular terrain using multiple box geometries
    var platformGeom = new THREE.BoxGeometry(80, 3, 60);
    var platformMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.8,
      metalness: 0.1
    });
    basePlatform = new THREE.Mesh(platformGeom, platformMat);
    basePlatform.position.y = 0;
    basePlatform.castShadow = true;
    basePlatform.receiveShadow = true;
    scene.add(basePlatform);
    platformObjects.push(basePlatform);

    // Jagged rocky sides using multiple boxes
    var rockColors = [0x4a3a2a, 0x3a2a1a, 0x6a5a4a];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var distance = 50;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;
      var height = 15 + Math.random() * 20;

      var rockGeom = new THREE.BoxGeometry(
        8 + Math.random() * 4,
        height,
        8 + Math.random() * 4
      );
      var rockMat = new THREE.MeshStandardMaterial({
        color: rockColors[Math.floor(Math.random() * rockColors.length)],
        roughness: 0.9,
        metalness: 0
      });
      var rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(x, -height / 2 - 1.5, z);
      rock.rotation.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      terrain.push(rock);
    }

    // Reinforced platform edges (rim)
    var rimMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var distance = 42;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;
      var edgeGeom = new THREE.BoxGeometry(6, 1.5, 6);
      var edge = new THREE.Mesh(edgeGeom, rimMat);
      edge.position.set(x, 2, z);
      edge.castShadow = true;
      scene.add(edge);
      platformObjects.push(edge);
    }
  }

  function buildLaserWeaponArray() {
    // Central laser weapon array housing
    var housingGeom = new THREE.BoxGeometry(12, 4, 8);
    var housingMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.8
    });
    var housing = new THREE.Mesh(housingGeom, housingMat);
    housing.position.set(0, 3, 0);
    housing.castShadow = true;
    housing.receiveShadow = true;
    scene.add(housing);
    platformObjects.push(housing);

    laserArray = housing;

    // Create 4 laser barrels
    for (var i = 0; i < 4; i++) {
      var offsetX = (i < 2 ? -3 : 3);
      var offsetZ = (i % 2 === 0 ? -2 : 2);

      // Barrel mounting bracket
      var bracketGeom = new THREE.BoxGeometry(2, 2, 2);
      var bracketMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.6,
        metalness: 0.7
      });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.position.set(offsetX, 4, offsetZ);
      bracket.castShadow = true;
      scene.add(bracket);
      platformObjects.push(bracket);

      // Barrel cylinder
      var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 16);
      var barrelMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.4,
        metalness: 0.9
      });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(offsetX, 4, offsetZ);
      barrel.rotation.z = Math.PI / 2;
      barrel.castShadow = true;
      scene.add(barrel);
      laserBarrels.push(barrel);

      // Laser tip (glowing sphere)
      var tipGeom = new THREE.SphereGeometry(0.3, 12, 12);
      var tipMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.6,
        metalness: 1,
        roughness: 0.1
      });
      var tip = new THREE.Mesh(tipGeom, tipMat);
      tip.position.set(offsetX + 3.5, 4, offsetZ);
      tip.castShadow = true;
      scene.add(tip);
      laserTips.push(tip);
    }
  }

  function buildRadarSystem() {
    // Radar dome housing (cylindrical base)
    var housingGeom = new THREE.CylinderGeometry(5, 6, 2, 32);
    var housingMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.5
    });
    radarHousing = new THREE.Mesh(housingGeom, housingMat);
    radarHousing.position.set(-15, 3, 15);
    radarHousing.castShadow = true;
    radarHousing.receiveShadow = true;
    scene.add(radarHousing);
    platformObjects.push(radarHousing);

    // Large white radar dome (sphere)
    var domeGeom = new THREE.SphereGeometry(5.5, 32, 32);
    var domeMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.4,
      metalness: 0.3
    });
    radarDome = new THREE.Mesh(domeGeom, domeMat);
    radarDome.position.set(-15, 6, 15);
    radarDome.castShadow = true;
    radarDome.receiveShadow = true;
    scene.add(radarDome);

    // Supporting post
    var postGeom = new THREE.CylinderGeometry(0.5, 0.8, 4, 16);
    var postMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.5
    });
    var post = new THREE.Mesh(postGeom, postMat);
    post.position.set(-15, 2, 15);
    post.castShadow = true;
    scene.add(post);
    platformObjects.push(post);
  }

  function buildCableCarStation() {
    // Cable car terminal station
    var terminalGeom = new THREE.BoxGeometry(8, 3, 6);
    var terminalMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.5,
      metalness: 0.6
    });
    var terminal = new THREE.Mesh(terminalGeom, terminalMat);
    terminal.position.set(20, 2, 0);
    terminal.castShadow = true;
    terminal.receiveShadow = true;
    scene.add(terminal);
    platformObjects.push(terminal);

    // Cable drums (cylindrical)
    for (var i = 0; i < 2; i++) {
      var drumGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 24);
      var drumMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.8
      });
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.set(18 + i * 2, 3, 0);
      drum.rotation.z = Math.PI / 2;
      drum.castShadow = true;
      scene.add(drum);
      cableDrums.push(drum);
    }

    // Cable car cabin (box)
    var cabinGeom = new THREE.BoxGeometry(3, 3, 2.5);
    var cabinMat = new THREE.MeshStandardMaterial({
      color: 0xdd0000,
      roughness: 0.4,
      metalness: 0.6
    });
    cableCarCabin = new THREE.Mesh(cabinGeom, cabinMat);
    cableCarCabin.position.set(20, 10, 0);
    cableCarCabin.castShadow = true;
    cableCarCabin.receiveShadow = true;
    scene.add(cableCarCabin);

    cableCar = cableCarCabin;

    // Cable lines (LineSegments)
    var cablePoints = [
      new THREE.Vector3(18, 4, -0.8),
      new THREE.Vector3(20, 10, -0.8)
    ];
    var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });
    var cableLine = new THREE.LineSegments(cableGeom, cableMat);
    scene.add(cableLine);
    cableLines.push(cableLine);

    var cablePoints2 = [
      new THREE.Vector3(22, 4, -0.8),
      new THREE.Vector3(20, 10, -0.8)
    ];
    var cableGeom2 = new THREE.BufferGeometry().setFromPoints(cablePoints2);
    var cableLine2 = new THREE.LineSegments(cableGeom2, cableMat);
    scene.add(cableLine2);
    cableLines.push(cableLine2);
  }

  function buildGuardRails() {
    // Guard rails around cliff edges
    var railMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.6,
      metalness: 0.7
    });

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var distance = 42;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;

      // Vertical post
      var postGeom = new THREE.BoxGeometry(0.4, 1.5, 0.4);
      var post = new THREE.Mesh(postGeom, railMat);
      post.position.set(x, 1.5, z);
      post.castShadow = true;
      scene.add(post);
      guardRails.push(post);

      // Horizontal rail
      if (i < 11) {
        var nextAngle = ((i + 1) / 12) * Math.PI * 2;
        var nextX = Math.cos(nextAngle) * distance;
        var nextZ = Math.sin(nextAngle) * distance;
        var railLength = Math.sqrt((nextX - x) * (nextX - x) + (nextZ - z) * (nextZ - z));

        var railGeom = new THREE.BoxGeometry(railLength, 0.15, 0.15);
        var rail = new THREE.Mesh(railGeom, railMat);
        var midX = (x + nextX) / 2;
        var midZ = (z + nextZ) / 2;
        rail.position.set(midX, 1.2, midZ);
        rail.rotation.y = Math.atan2(nextZ - z, nextX - x);
        rail.castShadow = true;
        scene.add(rail);
        guardRails.push(rail);
      }
    }
  }

  function buildSniperPositions() {
    // Low walls carved into rock at cliff edges for sniper positions
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a2a,
      roughness: 0.8,
      metalness: 0.2
    });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var distance = 38;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;

      var wallGeom = new THREE.BoxGeometry(6, 1.2, 4);
      var wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(x, 0.8, z);
      wall.rotation.y = angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      sniperPositions.push(wall);
    }
  }

  function buildHelicopterPad() {
    // Helicopter landing pad bolted to peak
    var padGeom = new THREE.BoxGeometry(20, 0.5, 20);
    var padMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.5,
      metalness: 0.7
    });
    helicopterPad = new THREE.Mesh(padGeom, padMat);
    helicopterPad.position.set(-20, 2.5, -20);
    helicopterPad.castShadow = true;
    helicopterPad.receiveShadow = true;
    scene.add(helicopterPad);
    platformObjects.push(helicopterPad);

    // Landing pad markings (using thin boxes)
    var markMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.5
    });
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var offset = 8;
      var x = -20 + Math.cos(angle) * offset;
      var z = -20 + Math.sin(angle) * offset;
      var markGeom = new THREE.BoxGeometry(3, 0.1, 0.8);
      var mark = new THREE.Mesh(markGeom, markMat);
      mark.position.set(x, 2.6, z);
      mark.rotation.y = angle;
      scene.add(mark);
      platformObjects.push(mark);
    }
  }

  function buildAntennaArray() {
    // Multiple antenna masts
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var distance = 25;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;

      // Mast (tall cylinder)
      var mastGeom = new THREE.CylinderGeometry(0.15, 0.2, 8, 12);
      var mastMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.5,
        metalness: 0.8
      });
      var mast = new THREE.Mesh(mastGeom, mastMat);
      mast.position.set(x, 5, z);
      mast.castShadow = true;
      scene.add(mast);
      antennaArray.push(mast);

      // Antenna element (box at top)
      var antGeom = new THREE.BoxGeometry(0.3, 2, 0.3);
      var antMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.4,
        metalness: 0.9
      });
      var ant = new THREE.Mesh(antGeom, antMat);
      ant.position.set(x, 9.5, z);
      ant.castShadow = true;
      scene.add(ant);
      antennaArray.push(ant);

      // Support cable (LineSegments)
      var cableStart = new THREE.Vector3(x, 8, z);
      var cableEnd = new THREE.Vector3(x + 3, 3, z + 2);
      var cablePoints = [cableStart, cableEnd];
      var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
      var cableMat = new THREE.LineBasicMaterial({ color: 0x5a5a5a, linewidth: 1 });
      var cable = new THREE.LineSegments(cableGeom, cableMat);
      scene.add(cable);
      antennaArray.push(cable);
    }
  }

  function buildWeatherStation() {
    // Weather monitoring instruments
    var stationGeom = new THREE.BoxGeometry(4, 2, 4);
    var stationMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.6,
      metalness: 0.6
    });
    weatherStation = new THREE.Mesh(stationGeom, stationMat);
    weatherStation.position.set(-25, 2, 20);
    weatherStation.castShadow = true;
    weatherStation.receiveShadow = true;
    scene.add(weatherStation);
    platformObjects.push(weatherStation);

    // Anemometer (wind speed sensor - spinning cylinder)
    var anemGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
    var anemMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.8
    });
    var anem = new THREE.Mesh(anemGeom, anemMat);
    anem.position.set(-25, 4, 20);
    anem.castShadow = true;
    scene.add(anem);
    platformObjects.push(anem);
  }

  function buildPowerBunker() {
    // Power supply bunker
    var bunkerGeom = new THREE.BoxGeometry(6, 3, 8);
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });
    powerBunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    powerBunker.position.set(0, 1.5, -20);
    powerBunker.castShadow = true;
    powerBunker.receiveShadow = true;
    scene.add(powerBunker);
    platformObjects.push(powerBunker);

    // Fuel tank (cylinder)
    var tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 20);
    var tankMat = new THREE.MeshStandardMaterial({
      color: 0xaa5500,
      roughness: 0.5,
      metalness: 0.7
    });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(4, 2, -20);
    tank.castShadow = true;
    scene.add(tank);
    platformObjects.push(tank);
  }

  function buildEmergencyShelter() {
    // Reinforced emergency shelter
    var shelterGeom = new THREE.BoxGeometry(5, 3, 5);
    var shelterMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.8
    });
    emergencyShelter = new THREE.Mesh(shelterGeom, shelterMat);
    emergencyShelter.position.set(-10, 1.5, -25);
    emergencyShelter.castShadow = true;
    emergencyShelter.receiveShadow = true;
    scene.add(emergencyShelter);
    platformObjects.push(emergencyShelter);

    // Reinforced door (box)
    var doorGeom = new THREE.BoxGeometry(1.5, 2, 0.3);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.4,
      metalness: 0.9
    });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-8, 1.5, -2.8);
    door.castShadow = true;
    scene.add(door);
    platformObjects.push(door);
  }

  function buildSatelliteDish() {
    // Communication satellite dish
    var baseGeom = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 24);
    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.6
    });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(20, 1.5, -15);
    base.castShadow = true;
    scene.add(base);
    platformObjects.push(base);

    // Dish reflector (hemisphere)
    var dishGeom = new THREE.SphereGeometry(3, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    var dishMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.3,
      metalness: 0.8
    });
    satelliteDish = new THREE.Mesh(dishGeom, dishMat);
    satelliteDish.position.set(20, 4, -15);
    satelliteDish.rotation.z = Math.PI / 4;
    satelliteDish.castShadow = true;
    scene.add(satelliteDish);

    // Supporting arm (cylinder)
    var armGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 12);
    var armMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.7
    });
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(20, 2.5, -15);
    arm.rotation.z = Math.PI / 4;
    arm.castShadow = true;
    scene.add(arm);
    platformObjects.push(arm);
  }

  function buildAccessLadder() {
    // Access ladder bolted to cliff from below
    var ladderX = 30;
    var ladderZ = 25;
    var ladderHeight = 40;

    // Vertical rails
    for (var side = 0; side < 2; side++) {
      var railX = ladderX + (side === 0 ? -0.5 : 0.5);
      var railStart = new THREE.Vector3(railX, 0, ladderZ);
      var railEnd = new THREE.Vector3(railX, ladderHeight, ladderZ);
      var railPoints = [railStart, railEnd];
      var railGeom = new THREE.BufferGeometry().setFromPoints(railPoints);
      var railMat = new THREE.LineBasicMaterial({ color: 0x5a5a5a, linewidth: 3 });
      var rail = new THREE.LineSegments(railGeom, railMat);
      scene.add(rail);
      platformObjects.push(rail);

      // Horizontal rungs
      for (var rung = 0; rung < 15; rung++) {
        var rungY = rung * 2.8;
        var rung1 = new THREE.Vector3(ladderX - 0.5, rungY, ladderZ);
        var rung2 = new THREE.Vector3(ladderX + 0.5, rungY, ladderZ);
        var rungPoints = [rung1, rung2];
        var rungGeom = new THREE.BufferGeometry().setFromPoints(rungPoints);
        var rungMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });
        var rungLine = new THREE.LineSegments(rungGeom, rungMat);
        scene.add(rungLine);
        platformObjects.push(rungLine);
      }
    }
  }

  function buildSnowPatches() {
    // Snow patches on cold surfaces
    for (var i = 0; i < 5; i++) {
      var snowGeom = new THREE.BoxGeometry(
        6 + Math.random() * 8,
        0.2,
        6 + Math.random() * 8
      );
      var snowMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0
      });
      var snow = new THREE.Mesh(snowGeom, snowMat);
      var angle = Math.random() * Math.PI * 2;
      var distance = 10 + Math.random() * 20;
      snow.position.set(
        Math.cos(angle) * distance,
        2.5,
        Math.sin(angle) * distance
      );
      snow.castShadow = true;
      snow.receiveShadow = true;
      scene.add(snow);
      platformObjects.push(snow);
    }
  }

  function buildClimbingAnchors() {
    // Ice pick climbing anchor points (spheres with guide lines)
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var distance = 48 + Math.random() * 4;
      var height = 5 + Math.random() * 8;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;

      // Anchor sphere
      var anchorGeom = new THREE.SphereGeometry(0.4, 12, 12);
      var anchorMat = new THREE.MeshStandardMaterial({
        color: 0x8a7a6a,
        emissive: 0x3a3a3a,
        roughness: 0.6,
        metalness: 0.7
      });
      var anchor = new THREE.Mesh(anchorGeom, anchorMat);
      anchor.position.set(x, height, z);
      anchor.castShadow = true;
      scene.add(anchor);
      climbingAnchors.push(anchor);

      // Guide line to next anchor (LineSegments)
      if (i < 7) {
        var nextAngle = ((i + 1) / 8) * Math.PI * 2;
        var nextDistance = 48 + Math.random() * 4;
        var nextHeight = 5 + Math.random() * 8;
        var nextX = Math.cos(nextAngle) * nextDistance;
        var nextZ = Math.sin(nextAngle) * nextDistance;

        var lineStart = new THREE.Vector3(x, height, z);
        var lineEnd = new THREE.Vector3(nextX, nextHeight, nextZ);
        var linePoints = [lineStart, lineEnd];
        var lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
        var lineMat = new THREE.LineBasicMaterial({ color: 0x8a7a6a, linewidth: 1 });
        var line = new THREE.LineSegments(lineGeom, lineMat);
        scene.add(line);
        climbingAnchors.push(line);
      }
    }
  }

  function buildBeacon() {
    // Warning beacon (blinking light)
    var beaconGeom = new THREE.SphereGeometry(0.5, 16, 16);
    var beaconMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 1,
      metalness: 0.8,
      roughness: 0.2
    });
    warningBeacon = new THREE.Mesh(beaconGeom, beaconMat);
    warningBeacon.position.set(0, 12, 0);
    warningBeacon.castShadow = true;
    scene.add(warningBeacon);
  }

  function update(delta) {
    // Laser array rotation and elevation
    laserRotation += delta * 0.3;
    laserElevation += delta * 0.15;

    if (laserArray) {
      laserArray.rotation.y = laserRotation;
    }

    for (var i = 0; i < laserBarrels.length; i++) {
      laserBarrels[i].rotation.y = laserRotation;
      laserBarrels[i].rotation.z = Math.PI / 2 + Math.sin(laserElevation) * 0.3;
    }

    for (var i = 0; i < laserTips.length; i++) {
      laserTips[i].rotation.y = laserRotation;
    }

    // Radar dome rotation
    radarRotation += delta * 0.8;
    if (radarDome) {
      radarDome.rotation.y = radarRotation;
    }

    // Cable car movement
    cableCarPosition = (cableCarPosition + delta * 0.3) % 40;
    if (cableCarCabin) {
      var baseY = 10;
      var verticalMovement = Math.sin(cableCarPosition * 0.1) * 3;
      cableCarCabin.position.y = baseY + verticalMovement;
    }

    // Wind-driven snow particles
    windPhase += delta * 0.5;
    for (var i = 0; i < snowParticles.length; i++) {
      var particle = snowParticles[i];
      particle.position.x += Math.sin(windPhase + i) * 0.5;
      particle.position.y -= delta * 0.8;

      if (particle.position.y < 0) {
        particle.position.y = 20;
        particle.position.x = Math.random() * 100 - 50;
        particle.position.z = Math.random() * 100 - 50;
      }
    }

    // Warning beacon blink
    beaconIntensity += beaconDirection;
    if (beaconIntensity > 1) {
      beaconIntensity = 1;
      beaconDirection = -0.03;
    } else if (beaconIntensity < 0.2) {
      beaconIntensity = 0.2;
      beaconDirection = 0.03;
    }

    if (warningBeacon && warningBeacon.material) {
      warningBeacon.material.emissiveIntensity = beaconIntensity;
    }

    // Anemometer spin
    if (platformObjects.length > 8) {
      platformObjects[platformObjects.length - 2].rotation.y += delta * 2;
    }
  }

  function reset() {
    // Reset laser rotation and elevation
    laserRotation = 0;
    laserElevation = 0;

    // Reset radar rotation
    radarRotation = 0;

    // Reset cable car position
    cableCarPosition = 0;

    // Reset beacon
    beaconIntensity = 1;
    beaconDirection = -0.02;

    // Reset wind phase
    windPhase = 0;

    // Update positions based on reset values
    if (laserArray) {
      laserArray.rotation.y = 0;
    }

    if (radarDome) {
      radarDome.rotation.y = 0;
    }

    if (cableCarCabin) {
      cableCarCabin.position.y = 10;
    }

    if (warningBeacon && warningBeacon.material) {
      warningBeacon.material.emissiveIntensity = 1;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
