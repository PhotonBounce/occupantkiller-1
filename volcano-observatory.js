window.VolcanoObservatory = (function() {
  'use strict';

  var objects = [];
  var animatingObjects = [];
  var spawnPoints = [];
  var pulseObjects = [];
  var rotatingObjects = [];
  var driftingObjects = [];
  var trembleObjects = [];
  var time = 0;

  var BASALT_BLACK = 0x1A1A1A;
  var LAVA_ORANGE = 0xFF4400;
  var ASH_GRAY = 0x777777;
  var OBSERVATORY_WHITE = 0xEEEEEE;
  var WARNING_AMBER = 0xFFAA00;
  var DARK_RED = 0x660000;
  var DARK_GRAY = 0x333333;
  var LIGHT_GRAY = 0x999999;

  function init(scene, camera) {
    objects = [];
    animatingObjects = [];
    spawnPoints = [];
    pulseObjects = [];
    rotatingObjects = [];
    driftingObjects = [];
    trembleObjects = [];
    time = 0;

    createCraterRim(scene);
    createLavaGlow(scene);
    createObservatoryDome(scene);
    createSeismographStation(scene);
    createLavaRedirectionValve(scene);
    createThermalCameraArray(scene);
    createSatelliteUplinkDish(scene);
    createEmergencyBunker(scene);
    createAshSamplingProbe(scene);
    createGasMaskStation(scene);
    createVolcanicRockColumns(scene);
    createHelicopterLandingPad(scene);
    createCableCarStation(scene);
    createAshCloud(scene);
    createSpawnPoints(scene);
  }

  function createCraterRim(scene) {
    var rimGeometry = new THREE.BoxGeometry(80, 4, 80);
    var rimMaterial = new THREE.MeshStandardMaterial({ color: BASALT_BLACK, roughness: 0.9 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(0, 5, 0);
    rim.castShadow = true;
    rim.receiveShadow = true;
    scene.add(rim);
    objects.push(rim);

    var rockCount = 12;
    for (var i = 0; i < rockCount; i++) {
      var angle = (i / rockCount) * Math.PI * 2;
      var radius = 35;
      var rockX = Math.cos(angle) * radius;
      var rockZ = Math.sin(angle) * radius;

      var rockGeometry = new THREE.BoxGeometry(6, 8, 6);
      var rockMaterial = new THREE.MeshStandardMaterial({ color: BASALT_BLACK, roughness: 0.95 });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(rockX, 8 + Math.random() * 2, rockZ);
      rock.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      objects.push(rock);
    }
  }

  function createLavaGlow(scene) {
    var lavaGeometry = new THREE.SphereGeometry(25, 8, 8);
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: LAVA_ORANGE,
      emissive: LAVA_ORANGE,
      emissiveIntensity: 0.5,
      roughness: 0.7
    });
    var lava = new THREE.Mesh(lavaGeometry, lavaMaterial);
    lava.position.set(0, -15, 0);
    lava.castShadow = true;
    scene.add(lava);
    objects.push(lava);
    pulseObjects.push({ mesh: lava, intensity: 0.5, speed: 2 });

    var craterBottomGeometry = new THREE.BoxGeometry(50, 2, 50);
    var craterMaterial = new THREE.MeshStandardMaterial({
      color: DARK_RED,
      emissive: DARK_RED,
      emissiveIntensity: 0.3
    });
    var craterBottom = new THREE.Mesh(craterBottomGeometry, craterMaterial);
    craterBottom.position.set(0, -30, 0);
    craterBottom.castShadow = true;
    scene.add(craterBottom);
    objects.push(craterBottom);

    var ventGeometry = new THREE.CylinderGeometry(8, 10, 4, 16);
    var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.8 });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.set(-12, -20, 8);
    vent.castShadow = true;
    scene.add(vent);
    objects.push(vent);
    trembleObjects.push({ mesh: vent, amount: 0.2 });
  }

  function createObservatoryDome(scene) {
    var domeGeometry = new THREE.SphereGeometry(12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: OBSERVATORY_WHITE,
      emissive: 0x333333,
      roughness: 0.3,
      metalness: 0.2
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(20, 20, -15);
    dome.castShadow = true;
    dome.receiveShadow = true;
    scene.add(dome);
    objects.push(dome);
    rotatingObjects.push({ mesh: dome, axis: 'y', speed: 0.3 });

    var baseGeometry = new THREE.CylinderGeometry(14, 16, 3, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(20, 9, -15);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    objects.push(base);

    var supportGeometry = new THREE.CylinderGeometry(1, 1.5, 10, 8);
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var supX = Math.cos(angle) * 10;
      var supZ = Math.sin(angle) * 10;
      var support = new THREE.Mesh(supportGeometry, baseMaterial);
      support.position.set(20 + supX, 14, -15 + supZ);
      support.castShadow = true;
      scene.add(support);
      objects.push(support);
    }
  }

  function createSeismographStation(scene) {
    var stationGeometry = new THREE.BoxGeometry(18, 4, 10);
    var stationMaterial = new THREE.MeshStandardMaterial({ color: OBSERVATORY_WHITE, roughness: 0.6 });
    var station = new THREE.Mesh(stationGeometry, stationMaterial);
    station.position.set(-20, 5, 15);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);
    objects.push(station);

    var instrumentCount = 3;
    for (var i = 0; i < instrumentCount; i++) {
      var instGeometry = new THREE.BoxGeometry(4, 6, 3);
      var instMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.4 });
      var instrument = new THREE.Mesh(instGeometry, instMaterial);
      instrument.position.set(-20 + (i - 1) * 7, 11, 15);
      instrument.castShadow = true;
      scene.add(instrument);
      objects.push(instrument);
    }

    var sensorGeometry = new THREE.CylinderGeometry(0.8, 1.2, 2, 8);
    var sensorMaterial = new THREE.MeshStandardMaterial({ color: WARNING_AMBER, metalness: 0.6 });
    for (var j = 0; j < 6; j++) {
      var angle = (j / 6) * Math.PI * 2;
      var senX = Math.cos(angle) * 8;
      var senZ = Math.sin(angle) * 8;
      var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
      sensor.position.set(-20 + senX, 2, 15 + senZ);
      sensor.castShadow = true;
      scene.add(sensor);
      objects.push(sensor);
      trembleObjects.push({ mesh: sensor, amount: 0.1 });
    }
  }

  function createLavaRedirectionValve(scene) {
    var valveHousingGeometry = new THREE.BoxGeometry(12, 16, 12);
    var valveMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, metalness: 0.7, roughness: 0.3 });
    var valveHousing = new THREE.Mesh(valveHousingGeometry, valveMaterial);
    valveHousing.position.set(25, 15, 20);
    valveHousing.castShadow = true;
    scene.add(valveHousing);
    objects.push(valveHousing);
    trembleObjects.push({ mesh: valveHousing, amount: 0.15 });

    var handleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: LAVA_ORANGE, metalness: 0.8 });
    for (var i = 0; i < 2; i++) {
      var handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(25 + (i === 0 ? -8 : 8), 20, 20);
      handle.rotation.z = Math.PI / 4;
      handle.castShadow = true;
      scene.add(handle);
      objects.push(handle);
      rotatingObjects.push({ mesh: handle, axis: 'x', speed: 0.5 });
    }

    var pipeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(25, 8, 35);
    pipe.rotation.z = Math.PI / 2.5;
    pipe.castShadow = true;
    scene.add(pipe);
    objects.push(pipe);
  }

  function createThermalCameraArray(scene) {
    var tripodCount = 4;
    for (var i = 0; i < tripodCount; i++) {
      var angle = (i / tripodCount) * Math.PI * 2;
      var tripX = Math.cos(angle) * 22;
      var tripZ = Math.sin(angle) * 22;

      var tripodGeometry = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
      var tripodMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.7 });
      var tripod = new THREE.Mesh(tripodGeometry, tripodMaterial);
      tripod.position.set(tripX, 6, tripZ);
      tripod.castShadow = true;
      scene.add(tripod);
      objects.push(tripod);

      var cameraGeometry = new THREE.BoxGeometry(2, 1.5, 3);
      var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
      var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
      camera.position.set(tripX, 13, tripZ);
      camera.castShadow = true;
      scene.add(camera);
      objects.push(camera);
      rotatingObjects.push({ mesh: camera, axis: 'y', speed: 0.6 });
    }
  }

  function createSatelliteUplinkDish(scene) {
    var dishGeometry = new THREE.CylinderGeometry(6, 6, 1, 16, 1, true);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(-25, 18, 10);
    dish.rotation.x = 0.3;
    dish.castShadow = true;
    scene.add(dish);
    objects.push(dish);
    rotatingObjects.push({ mesh: dish, axis: 'y', speed: 0.4 });

    var supportGeometry = new THREE.BoxGeometry(2, 12, 2);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.8 });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(-25, 8, 10);
    support.castShadow = true;
    scene.add(support);
    objects.push(support);

    var armGeometry = new THREE.CylinderGeometry(0.6, 0.6, 10, 8);
    var arm = new THREE.Mesh(armGeometry, supportMaterial);
    arm.position.set(-25, 16, 10);
    arm.rotation.z = 0.4;
    arm.castShadow = true;
    scene.add(arm);
    objects.push(arm);
  }

  function createEmergencyBunker(scene) {
    var bunkerGeometry = new THREE.BoxGeometry(14, 8, 14);
    var bunkerMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.9 });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-30, 6, -30);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);
    objects.push(bunker);

    var doorGeometry = new THREE.BoxGeometry(4, 5, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-30, 5, -36.5);
    door.castShadow = true;
    scene.add(door);
    objects.push(door);

    var windowCount = 2;
    for (var i = 0; i < windowCount; i++) {
      var windowGeometry = new THREE.BoxGeometry(2, 2, 0.3);
      var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4488FF, emissive: 0x2244AA });
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-30 + (i === 0 ? -3 : 3), 8, -36.5);
      window.castShadow = true;
      scene.add(window);
      objects.push(window);
    }

    var reinforcementGeometry = new THREE.BoxGeometry(1, 8, 1);
    var reinforceMaterial = new THREE.MeshStandardMaterial({ color: WARNING_AMBER, metalness: 0.5 });
    for (var j = 0; j < 4; j++) {
      var reinforce = new THREE.Mesh(reinforcementGeometry, reinforceMaterial);
      reinforce.position.set(-30 + (j % 2) * 10 - 5, 5, -30 + Math.floor(j / 2) * 10 - 5);
      reinforce.castShadow = true;
      scene.add(reinforce);
      objects.push(reinforce);
    }
  }

  function createAshSamplingProbe(scene) {
    var probeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
    var probeMaterial = new THREE.MeshStandardMaterial({ color: LIGHT_GRAY, metalness: 0.6 });
    var probe = new THREE.Mesh(probeGeometry, probeMaterial);
    probe.position.set(0, 8, 30);
    probe.castShadow = true;
    scene.add(probe);
    objects.push(probe);
    trembleObjects.push({ mesh: probe, amount: 0.08 });

    var frameGeometry = new THREE.BoxGeometry(4, 10, 4);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.8 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 8, 30);
    frame.castShadow = true;
    scene.add(frame);
    objects.push(frame);

    var collectorGeometry = new THREE.SphereGeometry(2, 8, 8);
    var collectorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.7 });
    var collector = new THREE.Mesh(collectorGeometry, collectorMaterial);
    collector.position.set(0, 16, 30);
    collector.castShadow = true;
    scene.add(collector);
    objects.push(collector);
  }

  function createGasMaskStation(scene) {
    var wallGeometry = new THREE.BoxGeometry(10, 12, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: OBSERVATORY_WHITE, roughness: 0.7 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(-15, 8, -40);
    wall.castShadow = true;
    scene.add(wall);
    objects.push(wall);

    var maskCount = 4;
    for (var i = 0; i < maskCount; i++) {
      var maskGeometry = new THREE.SphereGeometry(1, 8, 8);
      var maskMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
      var mask = new THREE.Mesh(maskGeometry, maskMaterial);
      mask.position.set(-15 + (i % 2) * 4 - 2, 10 - Math.floor(i / 2) * 4, -39.5);
      mask.castShadow = true;
      scene.add(mask);
      objects.push(mask);
    }
  }

  function createVolcanicRockColumns(scene) {
    var columnCount = 5;
    for (var i = 0; i < columnCount; i++) {
      var angle = (i / columnCount) * Math.PI * 2;
      var colX = Math.cos(angle) * 28;
      var colZ = Math.sin(angle) * 28;

      var columnGeometry = new THREE.CylinderGeometry(2.5, 3, 14, 8);
      var columnMaterial = new THREE.MeshStandardMaterial({ color: BASALT_BLACK, roughness: 0.95 });
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(colX, 10, colZ);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      objects.push(column);
    }
  }

  function createHelicopterLandingPad(scene) {
    var padGeometry = new THREE.BoxGeometry(20, 1, 20);
    var padMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(35, 5, -35);
    pad.castShadow = true;
    pad.receiveShadow = true;
    scene.add(pad);
    objects.push(pad);

    var markerCount = 4;
    for (var i = 0; i < markerCount; i++) {
      var angle = (i / markerCount) * Math.PI * 2;
      var marX = Math.cos(angle) * 9;
      var marZ = Math.sin(angle) * 9;

      var markerGeometry = new THREE.CylinderGeometry(1, 1.5, 3, 8);
      var markerMaterial = new THREE.MeshStandardMaterial({ color: WARNING_AMBER, emissive: WARNING_AMBER, emissiveIntensity: 0.4 });
      var marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(35 + marX, 7, -35 + marZ);
      marker.castShadow = true;
      scene.add(marker);
      objects.push(marker);
      pulseObjects.push({ mesh: marker, intensity: 0.4, speed: 3 });
    }
  }

  function createCableCarStation(scene) {
    var buildingGeometry = new THREE.BoxGeometry(12, 10, 12);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: OBSERVATORY_WHITE, roughness: 0.7 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-35, 8, 20);
    building.castShadow = true;
    scene.add(building);
    objects.push(building);

    var roofGeometry = new THREE.ConeGeometry(8, 4, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: LAVA_ORANGE, roughness: 0.7 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-35, 15, 20);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var supportGeometry = new THREE.CylinderGeometry(1, 1.5, 8, 8);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: DARK_GRAY, roughness: 0.8 });
    for (var i = 0; i < 2; i++) {
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(-35 + (i === 0 ? -4 : 4), 6, 20);
      support.castShadow = true;
      scene.add(support);
      objects.push(support);
    }
  }

  function createAshCloud(scene) {
    var cloudCount = 8;
    for (var i = 0; i < cloudCount; i++) {
      var cloudGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 6, 6);
      var cloudMaterial = new THREE.MeshStandardMaterial({
        color: ASH_GRAY,
        emissive: 0x444444,
        transparent: true,
        opacity: 0.4,
        roughness: 0.9
      });
      var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      var angle = (i / cloudCount) * Math.PI * 2;
      var cloudX = Math.cos(angle) * 15;
      var cloudZ = Math.sin(angle) * 15;
      cloud.position.set(cloudX, 25 + Math.random() * 15, cloudZ);
      scene.add(cloud);
      objects.push(cloud);
      driftingObjects.push({
        mesh: cloud,
        startY: cloud.position.y,
        driftX: (Math.random() - 0.5) * 0.3,
        driftZ: (Math.random() - 0.5) * 0.3,
        speed: 0.5 + Math.random() * 0.3
      });
    }
  }

  function createSpawnPoints(scene) {
    spawnPoints = [
      { x: -20, y: 0, z: 15, name: 'Observatory Entrance' },
      { x: 25, y: 0, z: 20, name: 'Crater Rim' },
      { x: -30, y: 0, z: -30, name: 'Bunker' },
      { x: 35, y: 0, z: -35, name: 'Landing Pad' },
      { x: -35, y: 0, z: 20, name: 'Cable Car Station' }
    ];
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < pulseObjects.length; i++) {
      var pObj = pulseObjects[i];
      var pulse = 0.5 + Math.sin(time * pObj.speed) * 0.3;
      if (pObj.mesh.material.emissiveIntensity !== undefined) {
        pObj.mesh.material.emissiveIntensity = pObj.intensity * pulse;
      }
    }

    for (var j = 0; j < rotatingObjects.length; j++) {
      var rObj = rotatingObjects[j];
      var rotAmount = delta * rObj.speed;
      if (rObj.axis === 'x') {
        rObj.mesh.rotation.x += rotAmount;
      } else if (rObj.axis === 'y') {
        rObj.mesh.rotation.y += rotAmount;
      } else if (rObj.axis === 'z') {
        rObj.mesh.rotation.z += rotAmount;
      }
    }

    for (var k = 0; k < driftingObjects.length; k++) {
      var dObj = driftingObjects[k];
      dObj.mesh.position.y += dObj.speed * delta;
      dObj.mesh.position.x += dObj.driftX * delta;
      dObj.mesh.position.z += dObj.driftZ * delta;
      if (dObj.mesh.position.y - dObj.startY > 25) {
        dObj.mesh.position.y = dObj.startY;
      }
    }

    for (var m = 0; m < trembleObjects.length; m++) {
      var tObj = trembleObjects[m];
      var trembleX = Math.sin(time * 8) * tObj.amount;
      var trembleZ = Math.cos(time * 6.5) * tObj.amount * 0.7;
      tObj.mesh.position.x += trembleX;
      tObj.mesh.position.z += trembleZ;
    }
  }

  function reset() {
    objects = [];
    animatingObjects = [];
    spawnPoints = [];
    pulseObjects = [];
    rotatingObjects = [];
    driftingObjects = [];
    trembleObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getObjects: function() { return objects; }
  };
}());
