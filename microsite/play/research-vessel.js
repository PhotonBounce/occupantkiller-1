var window = window || {};

window.ResearchVessel = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var elapsedTime = 0;
  var shipHull = null;
  var sonarDome = null;
  var anemometer = null;
  var roveDeploymentArm = null;
  var specimenTanks = [];
  var weatherInstruments = [];
  var computerWorkstations = [];
  var specimenTubes = [];
  var moonPoolFrame = null;
  var hiddenLabTrapdoor = null;

  function createShipHull() {
    // Main ship hull - elongated box on water
    var hullGeometry = new THREE.BoxGeometry(8, 4, 20);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0xCCDDEE, roughness: 0.5, metalness: 0.6 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 2, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    sceneObjects.push(hull);
    shipHull = hull;
    animatedObjects.push({ obj: hull, type: 'rock' });

    // Hull railing
    var railingGeometry = new THREE.BoxGeometry(8.5, 0.2, 20.5);
    var railingMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.4 });
    var railing = new THREE.Mesh(railingGeometry, railingMaterial);
    railing.position.set(0, 4.1, 0);
    railing.castShadow = true;
    railing.receiveShadow = true;
    scene.add(railing);
    sceneObjects.push(railing);
  }

  function createSpecimenTanks() {
    // Row of specimen holding cylinders - green glowing tanks
    var tankPositions = [
      [-5, 2.2, -8],
      [-2, 2.2, -8],
      [1, 2.2, -8],
      [4, 2.2, -8]
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var tankGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF88,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x00FF88,
        emissiveIntensity: 0.3
      });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(tankPositions[i][0], tankPositions[i][1], tankPositions[i][2]);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      sceneObjects.push(tank);
      specimenTanks.push(tank);
      animatedObjects.push({ obj: tank, type: 'bubble' });

      // Tank glass top
      var topGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 16);
      var topMaterial = new THREE.MeshStandardMaterial({ color: 0x0088FF, roughness: 0.1, metalness: 0.9 });
      var top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(tankPositions[i][0], tankPositions[i][1] + 1.55, tankPositions[i][2]);
      top.castShadow = true;
      top.receiveShadow = true;
      scene.add(top);
      sceneObjects.push(top);
    }
  }

  function createSonarArray() {
    // Sonar dome underneath hull - rotating blue hemisphere
    var domeGeometry = new THREE.SphereGeometry(2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AAFF,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x0055AA,
      emissiveIntensity: 0.2
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(0, -2.5, 0);
    dome.rotation.z = Math.PI;
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);
    sceneObjects.push(dome);
    sonarDome = dome;
    animatedObjects.push({ obj: dome, type: 'sonar' });

    // Sonar antenna ring
    var antennaGeometry = new THREE.TorusGeometry(2.5, 0.15, 8, 100);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x0088CC, roughness: 0.4, metalness: 0.8 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, -2.5, 0);
    antenna.rotation.x = Math.PI / 2;
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    scene.add(antenna);
    sceneObjects.push(antenna);
  }

  function createWeatherDeck() {
    // Anemometer - spinning wind sensor on top of deck
    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.6 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(-4, 4.5, 8);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    sceneObjects.push(pole);

    // Anemometer head
    var anemometerGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var anemometerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF8800, roughness: 0.5, metalness: 0.6 });
    var anemometer = new THREE.Mesh(anemometerGeometry, anemometerMaterial);
    anemometer.position.set(-4, 6.5, 8);
    anemometer.castShadow = true;
    anemometer.receiveShadow = true;
    scene.add(anemometer);
    sceneObjects.push(anemometer);
    animatedObjects.push({ obj: anemometer, type: 'spin' });

    // Barometer gauge cluster
    var gaugeGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    var gaugeMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.4 });
    var gauge1 = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
    gauge1.position.set(-3, 4.8, 7);
    gauge1.castShadow = true;
    gauge1.receiveShadow = true;
    scene.add(gauge1);
    sceneObjects.push(gauge1);

    var gauge2 = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
    gauge2.position.set(-3, 4.8, 9);
    gauge2.castShadow = true;
    gauge2.receiveShadow = true;
    scene.add(gauge2);
    sceneObjects.push(gauge2);
    animatedObjects.push({ obj: gauge2, type: 'spin' });
  }

  function createROVDeploymentBay() {
    // A-frame deployment crane - orange structural support
    var craneLeftGeometry = new THREE.BoxGeometry(0.3, 6, 0.3);
    var craneMaterial = new THREE.MeshStandardMaterial({ color: 0xFF8800, roughness: 0.5, metalness: 0.7 });
    var craneLeft = new THREE.Mesh(craneLeftGeometry, craneMaterial);
    craneLeft.position.set(-3, 3, 10);
    craneLeft.rotation.z = Math.PI / 8;
    craneLeft.castShadow = true;
    craneLeft.receiveShadow = true;
    scene.add(craneLeft);
    sceneObjects.push(craneLeft);

    var craneRight = new THREE.Mesh(craneLeftGeometry, craneMaterial);
    craneRight.position.set(3, 3, 10);
    craneRight.rotation.z = -Math.PI / 8;
    craneRight.castShadow = true;
    craneRight.receiveShadow = true;
    scene.add(craneRight);
    sceneObjects.push(craneRight);

    // Deployment cable
    var cableGeometry = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.set(0, 1, 10);
    cable.castShadow = true;
    cable.receiveShadow = true;
    scene.add(cable);
    sceneObjects.push(cable);

    // ROV submersible - small deployment vehicle
    var rovGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.5);
    var rovMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.5 });
    var rov = new THREE.Mesh(rovGeometry, rovMaterial);
    rov.position.set(0, -1, 10);
    rov.castShadow = true;
    rov.receiveShadow = true;
    scene.add(rov);
    sceneObjects.push(rov);
    roveDeploymentArm = rov;
    animatedObjects.push({ obj: rov, type: 'deploy' });

    // ROV light
    var lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.8 });
    var rovLight = new THREE.Mesh(lightGeometry, lightMaterial);
    rovLight.position.set(0.6, -1, 10.75);
    rovLight.castShadow = true;
    rovLight.receiveShadow = true;
    scene.add(rovLight);
    sceneObjects.push(rovLight);
  }

  function createSpecimenStorage() {
    // Sample storage freezer units - stacked boxes with cold appearance
    var freezerPositions = [
      [5, 1.5, -8],
      [5, 3.5, -8],
      [5, 5.5, -8]
    ];

    for (var i = 0; i < freezerPositions.length; i++) {
      var freezerGeometry = new THREE.BoxGeometry(1.5, 1.5, 2);
      var freezerMaterial = new THREE.MeshStandardMaterial({ color: 0x0099FF, roughness: 0.4, metalness: 0.7 });
      var freezer = new THREE.Mesh(freezerGeometry, freezerMaterial);
      freezer.position.set(freezerPositions[i][0], freezerPositions[i][1], freezerPositions[i][2]);
      freezer.castShadow = true;
      freezer.receiveShadow = true;
      scene.add(freezer);
      sceneObjects.push(freezer);

      // Freezer door handle
      var handleGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.1);
      var handleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3 });
      var handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(5.75, freezerPositions[i][1], freezerPositions[i][2]);
      handle.castShadow = true;
      handle.receiveShadow = true;
      scene.add(handle);
      sceneObjects.push(handle);
    }
  }

  function createComputerWorkstations() {
    // Computer terminals and research stations
    var stationPositions = [
      [-6, 2.3, 2],
      [-6, 2.3, 5],
      [6, 2.3, 2],
      [6, 2.3, 5]
    ];

    for (var i = 0; i < stationPositions.length; i++) {
      var deskGeometry = new THREE.BoxGeometry(2, 0.8, 1.5);
      var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 });
      var desk = new THREE.Mesh(deskGeometry, deskMaterial);
      desk.position.set(stationPositions[i][0], stationPositions[i][1], stationPositions[i][2]);
      desk.castShadow = true;
      desk.receiveShadow = true;
      scene.add(desk);
      sceneObjects.push(desk);

      // Monitor
      var monitorGeometry = new THREE.BoxGeometry(0.8, 1, 0.1);
      var monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
      var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
      monitor.position.set(stationPositions[i][0], stationPositions[i][1] + 1.2, stationPositions[i][2] - 0.3);
      monitor.castShadow = true;
      monitor.receiveShadow = true;
      scene.add(monitor);
      sceneObjects.push(monitor);
      computerWorkstations.push(monitor);

      // Screen glow
      var screenGeometry = new THREE.BoxGeometry(0.75, 0.95, 0.05);
      var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00FF00, emissiveIntensity: 0.5 });
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(stationPositions[i][0], stationPositions[i][1] + 1.2, stationPositions[i][2] - 0.35);
      screen.castShadow = true;
      screen.receiveShadow = true;
      scene.add(screen);
      sceneObjects.push(screen);
    }
  }

  function createSpecimenTubes() {
    // Glass specimen tubes pulsing with colored contents
    var tubePositions = [
      [-3, 3.5, 3],
      [-1, 3.5, 3],
      [1, 3.5, 3],
      [3, 3.5, 3],
      [-3, 3.5, 6],
      [-1, 3.5, 6],
      [1, 3.5, 6],
      [3, 3.5, 6]
    ];

    var colors = [0xFF0088, 0x00FF88, 0x8800FF, 0xFFFF00, 0x00FFFF, 0xFF8800, 0xFF0000, 0x00FF00];

    for (var i = 0; i < tubePositions.length; i++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
      var tubeMaterial = new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.2,
        metalness: 0.4,
        emissive: colors[i],
        emissiveIntensity: 0.4
      });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(tubePositions[i][0], tubePositions[i][1], tubePositions[i][2]);
      tube.castShadow = true;
      tube.receiveShadow = true;
      scene.add(tube);
      sceneObjects.push(tube);
      specimenTubes.push(tube);
      animatedObjects.push({ obj: tube, type: 'pulse', color: colors[i] });
    }
  }

  function createMappingPlottersTable() {
    // Large chart table for oceanographic mapping
    var tableGeometry = new THREE.BoxGeometry(3, 0.8, 4);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.5 });
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-6, 2.3, -4);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    sceneObjects.push(table);

    // Chart paper surface
    var chartGeometry = new THREE.BoxGeometry(2.8, 0.1, 3.8);
    var chartMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFDD, roughness: 0.8 });
    var chart = new THREE.Mesh(chartGeometry, chartMaterial);
    chart.position.set(-6, 3.1, -4);
    chart.castShadow = true;
    chart.receiveShadow = true;
    scene.add(chart);
    sceneObjects.push(chart);

    // Plotting instruments on table
    var compassGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    var compassMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.3 });
    var compass = new THREE.Mesh(compassGeometry, compassMaterial);
    compass.position.set(-7.5, 3.2, -4);
    compass.castShadow = true;
    compass.receiveShadow = true;
    scene.add(compass);
    sceneObjects.push(compass);
  }

  function createMoonPool() {
    // Moon pool opening in deck - underwater access
    var poolFrameGeometry = new THREE.TorusGeometry(1.5, 0.2, 8, 100);
    var poolMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });
    var pool = new THREE.Mesh(poolFrameGeometry, poolMaterial);
    pool.position.set(0, 0.3, 0);
    pool.rotation.x = Math.PI / 2;
    pool.castShadow = true;
    pool.receiveShadow = true;
    scene.add(pool);
    sceneObjects.push(pool);
    moonPoolFrame = pool;

    // Water surface shimmer
    var waterGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.1, 16);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x003366,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x0055AA,
      emissiveIntensity: 0.3
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 0.15, 0);
    water.castShadow = true;
    water.receiveShadow = true;
    scene.add(water);
    sceneObjects.push(water);
  }

  function createHiddenLab() {
    // Hidden black-ops laboratory beneath main deck - trapdoor entry
    var trapdoorGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var trapdoorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    var trapdoor = new THREE.Mesh(trapdoorGeometry, trapdoorMaterial);
    trapdoor.position.set(0, 0.1, -8);
    trapdoor.castShadow = true;
    trapdoor.receiveShadow = true;
    scene.add(trapdoor);
    sceneObjects.push(trapdoor);
    hiddenLabTrapdoor = trapdoor;
    animatedObjects.push({ obj: trapdoor, type: 'trapdoor' });

    // Lab door frame
    var frameGeometry = new THREE.BoxGeometry(2.3, 2.3, 0.2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 0.8, -7.9);
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);
    sceneObjects.push(frame);

    // Lab interior glow
    var glowGeometry = new THREE.BoxGeometry(1.8, 1.8, 0.1);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.6
    });
    var glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(0, 0.8, -7.85);
    glow.castShadow = true;
    glow.receiveShadow = true;
    scene.add(glow);
    sceneObjects.push(glow);
  }

  function createLifeRings() {
    // Life ring stations mounted on railing
    var ringPositions = [
      [-5, 3.8, 9.8],
      [5, 3.8, 9.8],
      [-5, 3.8, -9.8],
      [5, 3.8, -9.8]
    ];

    for (var i = 0; i < ringPositions.length; i++) {
      var ringGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 32);
      var ringMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5500, roughness: 0.6 });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(ringPositions[i][0], ringPositions[i][1], ringPositions[i][2]);
      ring.rotation.y = Math.PI / 2;
      ring.castShadow = true;
      ring.receiveShadow = true;
      scene.add(ring);
      sceneObjects.push(ring);

      // Ring bracket
      var bracketGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var bracketMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
      var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.set(ringPositions[i][0], ringPositions[i][1] - 0.8, ringPositions[i][2]);
      bracket.castShadow = true;
      bracket.receiveShadow = true;
      scene.add(bracket);
      sceneObjects.push(bracket);
    }
  }

  function createOcean() {
    // Ocean water below
    var oceanGeometry = new THREE.PlaneGeometry(100, 100);
    var oceanMaterial = new THREE.MeshStandardMaterial({ color: 0x1155AA, roughness: 0.5 });
    var ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -10;
    ocean.receiveShadow = true;
    scene.add(ocean);
    sceneObjects.push(ocean);
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    animatedObjects = [];
    specimenTanks = [];
    weatherInstruments = [];
    computerWorkstations = [];
    specimenTubes = [];
    elapsedTime = 0;

    createOcean();
    createShipHull();
    createSpecimenTanks();
    createSonarArray();
    createWeatherDeck();
    createROVDeploymentBay();
    createSpecimenStorage();
    createComputerWorkstations();
    createSpecimenTubes();
    createMappingPlottersTable();
    createMoonPool();
    createHiddenLab();
    createLifeRings();

    return sceneObjects.length;
  }

  function update(delta) {
    elapsedTime += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var entry = animatedObjects[i];
      var obj = entry.obj;
      var type = entry.type;

      if (type === 'rock') {
        obj.position.y = 2 + Math.sin(elapsedTime * 0.5) * 0.3;
      } else if (type === 'bubble') {
        obj.position.y = entry.originalY !== undefined ? entry.originalY : obj.position.y;
        obj.position.y += Math.sin(elapsedTime * 1.5 + i) * 0.2;
      } else if (type === 'sonar') {
        obj.rotation.y += delta * 0.4;
      } else if (type === 'spin') {
        obj.rotation.z += delta * 2.5;
      } else if (type === 'deploy') {
        obj.position.y = -1 + Math.sin(elapsedTime * 0.8) * 0.8;
      } else if (type === 'pulse') {
        var scale = 1 + Math.sin(elapsedTime * 2 + i * 0.8) * 0.15;
        obj.scale.set(scale, scale, scale);
      } else if (type === 'trapdoor') {
        obj.rotation.x = Math.sin(elapsedTime * 0.4) * 0.1;
      }
    }
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    animatedObjects = [];
    specimenTanks = [];
    weatherInstruments = [];
    computerWorkstations = [];
    specimenTubes = [];
    shipHull = null;
    sonarDome = null;
    anemometer = null;
    roveDeploymentArm = null;
    moonPoolFrame = null;
    hiddenLabTrapdoor = null;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
