var window = window || {};

window.ArcticStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var elapsedTime = 0;
  var auroraLights = [];
  var windTurbine = null;
  var emergencyBeacon = null;
  var satelliteDishes = [];
  var snowcats = [];
  var icePanels = [];

  function createPrefabHabitatModules() {
    // Prefab modular habitat cylinders on stilts
    var positions = [
      [-12, 2, -8],
      [-6, 2, -8],
      [0, 2, -8],
      [6, 2, -8],
      [-12, 2, 0],
      [0, 2, 0],
      [6, 2, 8]
    ];

    positions.forEach(function(pos) {
      // Support stilts (cylindrical legs)
      var stiltGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 12);
      var stiltMaterial = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7 });

      var stilt1 = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt1.position.set(pos[0] - 0.8, 0.75, pos[2] - 0.8);
      stilt1.castShadow = true;
      stilt1.receiveShadow = true;
      scene.add(stilt1);
      sceneObjects.push(stilt1);

      var stilt2 = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt2.position.set(pos[0] + 0.8, 0.75, pos[2] - 0.8);
      stilt2.castShadow = true;
      stilt2.receiveShadow = true;
      scene.add(stilt2);
      sceneObjects.push(stilt2);

      var stilt3 = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt3.position.set(pos[0] - 0.8, 0.75, pos[2] + 0.8);
      stilt3.castShadow = true;
      stilt3.receiveShadow = true;
      scene.add(stilt3);
      sceneObjects.push(stilt3);

      var stilt4 = new THREE.Mesh(stiltGeometry, stiltMaterial);
      stilt4.position.set(pos[0] + 0.8, 0.75, pos[2] + 0.8);
      stilt4.castShadow = true;
      stilt4.receiveShadow = true;
      scene.add(stilt4);
      sceneObjects.push(stilt4);

      // Main habitat module (horizontal cylinder)
      var habitatGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 16);
      var habitatMaterial = new THREE.MeshStandardMaterial({ color: 0xEEFFFF, roughness: 0.6 });
      var habitat = new THREE.Mesh(habitatGeometry, habitatMaterial);
      habitat.position.set(pos[0], pos[1], pos[2]);
      habitat.rotation.z = Math.PI / 2;
      habitat.castShadow = true;
      habitat.receiveShadow = true;
      scene.add(habitat);
      sceneObjects.push(habitat);

      // End cap domes
      var domeGeometry = new THREE.SphereGeometry(1.2, 16, 16);
      var domeMaterial = new THREE.MeshStandardMaterial({ color: 0xD0E8FF, roughness: 0.5 });

      var dome1 = new THREE.Mesh(domeGeometry, domeMaterial);
      dome1.position.set(pos[0] - 2.2, pos[1], pos[2]);
      dome1.scale.set(1, 1, 0.5);
      dome1.castShadow = true;
      dome1.receiveShadow = true;
      scene.add(dome1);
      sceneObjects.push(dome1);

      var dome2 = new THREE.Mesh(domeGeometry, domeMaterial);
      dome2.position.set(pos[0] + 2.2, pos[1], pos[2]);
      dome2.scale.set(1, 1, 0.5);
      dome2.castShadow = true;
      dome2.receiveShadow = true;
      scene.add(dome2);
      sceneObjects.push(dome2);
    });
  }

  function createIceRunway() {
    // Long flat white ice runway with markings
    var runwayGeometry = new THREE.BoxGeometry(20, 0.3, 50);
    var runwayMaterial = new THREE.MeshStandardMaterial({ color: 0xEEFFFF, roughness: 0.9 });
    var runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(25, 0.15, 0);
    runway.castShadow = true;
    runway.receiveShadow = true;
    scene.add(runway);
    sceneObjects.push(runway);
    icePanels.push(runway);

    // Runway center line markings
    var lineGeometry = new THREE.BoxGeometry(0.3, 0.05, 50);
    var lineMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, roughness: 0.8 });
    var centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.position.set(25, 0.2, 0);
    scene.add(centerLine);
    sceneObjects.push(centerLine);

    // Side markings
    var sideLineGeometry = new THREE.BoxGeometry(0.2, 0.05, 50);
    var sideLineMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });

    var leftLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    leftLine.position.set(15, 0.2, 0);
    scene.add(leftLine);
    sceneObjects.push(leftLine);

    var rightLine = new THREE.Mesh(sideLineGeometry, sideLineMaterial);
    rightLine.position.set(35, 0.2, 0);
    scene.add(rightLine);
    sceneObjects.push(rightLine);
  }

  function createSnowcatGarage() {
    // Garage structure for snowcats
    var garageGeometry = new THREE.BoxGeometry(8, 4, 6);
    var garageMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.7 });
    var garage = new THREE.Mesh(garageGeometry, garageMaterial);
    garage.position.set(-25, 2, -20);
    garage.castShadow = true;
    garage.receiveShadow = true;
    scene.add(garage);
    sceneObjects.push(garage);

    // Garage door
    var doorGeometry = new THREE.BoxGeometry(7.5, 3.5, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.8 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-25, 2, -23);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);
    sceneObjects.push(door);

    // Create snowcats inside and outside garage
    createSnowcat(-20, 0, -15);
    createSnowcat(-30, 0, -15);
  }

  function createSnowcat(x, y, z) {
    var group = new THREE.Group();

    // Main body
    var bodyGeometry = new THREE.BoxGeometry(2.2, 1.8, 4.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin
    var cabinGeometry = new THREE.BoxGeometry(2, 1.4, 2);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.5, -0.8);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Tracks (caterpillar treads)
    var trackGeometry = new THREE.BoxGeometry(0.6, 0.8, 4.5);
    var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    var track1 = new THREE.Mesh(trackGeometry, trackMaterial);
    track1.position.set(-1.3, 0.4, 0);
    track1.castShadow = true;
    track1.receiveShadow = true;
    group.add(track1);

    var track2 = new THREE.Mesh(trackGeometry, trackMaterial);
    track2.position.set(1.3, 0.4, 0);
    track2.castShadow = true;
    track2.receiveShadow = true;
    group.add(track2);

    group.position.set(x, y, z);
    group.snowcatData = { vibrateTime: 0, vibrateAmount: 0.02 };
    scene.add(group);
    sceneObjects.push(group);
    snowcats.push(group);
    return group;
  }

  function createSatelliteUplink() {
    // Satellite dish array on a platform
    var platformGeometry = new THREE.BoxGeometry(6, 0.4, 6);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-40, 0.2, 15);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);

    // Create satellite dishes
    var dishPositions = [
      [-42, 1.5, 12],
      [-38, 1.5, 12],
      [-42, 1.5, 18],
      [-38, 1.5, 18]
    ];

    dishPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Support pole
      var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 0.75;
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);

      // Dish (cone shape)
      var dishGeometry = new THREE.ConeGeometry(1, 0.5, 16);
      var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8, roughness: 0.3 });
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.y = 1.6;
      dish.castShadow = true;
      dish.receiveShadow = true;
      group.add(dish);

      // Central feed horn (small cylinder)
      var feedGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
      var feedMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
      var feed = new THREE.Mesh(feedGeometry, feedMaterial);
      feed.position.y = 1.4;
      feed.castShadow = true;
      feed.receiveShadow = true;
      group.add(feed);

      group.position.set(pos[0], pos[1], pos[2]);
      group.trackingData = { angle: 0, trackingSpeed: 0.3 };
      scene.add(group);
      sceneObjects.push(group);
      satelliteDishes.push(group);
    });
  }

  function createFrozenStorageVault() {
    // Large vault structure
    var vaultGeometry = new THREE.BoxGeometry(6, 3.5, 5);
    var vaultMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(20, 1.75, -25);
    vault.castShadow = true;
    vault.receiveShadow = true;
    scene.add(vault);
    sceneObjects.push(vault);

    // Vault door (thick heavy door)
    var doorGeometry = new THREE.BoxGeometry(5.5, 3, 0.4);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.9, roughness: 0.2 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(20, 1.75, -27.5);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);
    sceneObjects.push(door);

    // Door handle
    var handleGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.2);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, metalness: 0.9 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(21.5, 1.75, -27.6);
    handle.castShadow = true;
    handle.receiveShadow = true;
    scene.add(handle);
    sceneObjects.push(handle);
  }

  function createAuroraLights() {
    // Aurora curtains (tall thin planes with gradient emissive)
    var positions = [
      [-35, 8, -30],
      [0, 8, -35],
      [35, 8, -30],
      [-40, 8, 10],
      [45, 8, 15]
    ];

    positions.forEach(function(pos) {
      var auroraGeometry = new THREE.BoxGeometry(12, 10, 0.1);
      var auroraMaterial = new THREE.MeshStandardMaterial({
        color: 0x44FF88,
        emissive: 0x44FF88,
        emissiveIntensity: 0.8,
        roughness: 0.4
      });
      var aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
      aurora.position.set(pos[0], pos[1], pos[2]);
      aurora.castShadow = false;
      aurora.receiveShadow = true;
      scene.add(aurora);
      sceneObjects.push(aurora);
      auroraLights.push({
        mesh: aurora,
        baseColor: 0x44FF88,
        alternateColor: 0x88AAFF,
        shimmerId: Math.random()
      });
    });
  }

  function createIceShelfEdge() {
    // Sharp drop cliff edge at boundary
    var edgeGeometry = new THREE.BoxGeometry(50, 0.2, 1);
    var edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.9 });
    var edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.position.set(0, 0.1, 50);
    edge.castShadow = true;
    edge.receiveShadow = true;
    scene.add(edge);
    sceneObjects.push(edge);

    // Cliff face (tall vertical wall)
    var cliffGeometry = new THREE.BoxGeometry(50, 15, 2);
    var cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.95 });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(0, -7.5, 51);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    sceneObjects.push(cliff);

    // Ice cracks (thin lines on cliff)
    for (var i = 0; i < 8; i++) {
      var crackGeometry = new THREE.BoxGeometry(0.1, 4 + Math.random() * 4, 0.05);
      var crackMaterial = new THREE.MeshStandardMaterial({ color: 0x2266FF, emissive: 0x2266FF, emissiveIntensity: 0.5 });
      var crack = new THREE.Mesh(crackGeometry, crackMaterial);
      crack.position.set(-20 + Math.random() * 40, -5, 51.5);
      scene.add(crack);
      sceneObjects.push(crack);
    }
  }

  function createFuelBladders() {
    // Deflated sphere shapes for fuel storage
    var positions = [
      [-35, 1.2, -5],
      [-30, 1.2, -8],
      [-32, 1.2, 2]
    ];

    positions.forEach(function(pos) {
      var bladderGeometry = new THREE.SphereGeometry(1.2, 12, 12);
      var bladderMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.7 });
      var bladder = new THREE.Mesh(bladderGeometry, bladderMaterial);
      bladder.position.set(pos[0], pos[1], pos[2]);
      bladder.scale.set(1, 0.6, 1);
      bladder.castShadow = true;
      bladder.receiveShadow = true;
      scene.add(bladder);
      sceneObjects.push(bladder);
    });
  }

  function createWeatherStationMast() {
    // Tall meteorological mast
    var mastGeometry = new THREE.CylinderGeometry(0.1, 0.1, 12, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(35, 6, 25);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    sceneObjects.push(mast);

    // Instrument boxes at various heights
    for (var i = 0; i < 4; i++) {
      var boxGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.5);
      var boxMaterial = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.7 });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(35.5, 3 + i * 2, 25);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      sceneObjects.push(box);
    }

    // Anemometer (spinning cup)
    var cupGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var cupMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, roughness: 0.6 });

    for (var j = 0; j < 3; j++) {
      var cup = new THREE.Mesh(cupGeometry, cupMaterial);
      var angle = (j * 2 * Math.PI) / 3;
      cup.position.set(
        35.8 + Math.cos(angle) * 0.5,
        11,
        25 + Math.sin(angle) * 0.5
      );
      cup.castShadow = true;
      cup.receiveShadow = true;
      scene.add(cup);
      sceneObjects.push(cup);
    }
  }

  function createCrevasseBridge() {
    // Wooden/metal bridge crossing dangerous crevasse
    var bridgeGeometry = new THREE.BoxGeometry(4, 0.3, 8);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.8 });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(-50, 0.15, 30);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    sceneObjects.push(bridge);

    // Support cables
    for (var i = 0; i < 2; i++) {
      var cableGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
      var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
      var cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.position.set(-50 + (i * 3.5 - 1.75), 1.2, 30);
      cable.castShadow = true;
      cable.receiveShadow = true;
      scene.add(cable);
      sceneObjects.push(cable);
    }

    // Crevasse walls (deep gap)
    var cliffLeftGeometry = new THREE.BoxGeometry(1, 8, 8);
    var cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.95 });

    var cliffLeft = new THREE.Mesh(cliffLeftGeometry, cliffMaterial);
    cliffLeft.position.set(-52, -4, 30);
    scene.add(cliffLeft);
    sceneObjects.push(cliffLeft);

    var cliffRight = new THREE.Mesh(cliffLeftGeometry, cliffMaterial);
    cliffRight.position.set(-48, -4, 30);
    scene.add(cliffRight);
    sceneObjects.push(cliffRight);
  }

  function createBlizzardWindTurbine() {
    // Wind turbine for power generation
    var towerGeometry = new THREE.CylinderGeometry(0.25, 0.25, 8, 12);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.7 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(50, 4, -15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    sceneObjects.push(tower);

    // Nacelle (turbine housing)
    var nacelleGeometry = new THREE.BoxGeometry(1, 0.8, 1.2);
    var nacelleMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.7 });
    var nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
    nacelle.position.set(50, 8.2, -15);
    nacelle.castShadow = true;
    nacelle.receiveShadow = true;
    scene.add(nacelle);
    sceneObjects.push(nacelle);

    // Turbine blades (three cylinders rotated)
    var bladeGeometry = new THREE.BoxGeometry(0.3, 2.5, 0.15);
    var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.6 });

    var group = new THREE.Group();
    for (var i = 0; i < 3; i++) {
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.z = 1.8;
      blade.rotation.y = (i * 2 * Math.PI) / 3;
      blade.castShadow = true;
      blade.receiveShadow = true;
      group.add(blade);
    }

    group.position.set(50, 8.2, -15);
    scene.add(group);
    sceneObjects.push(group);
    windTurbine = group;
  }

  function createEmergencyBeacon() {
    // Strobe beacon light
    var baseGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(15, 0.2, -35);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    sceneObjects.push(base);

    // Pole
    var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(15, 1.35, -35);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    sceneObjects.push(pole);

    // Beacon light (glowing sphere)
    var beaconGeometry = new THREE.SphereGeometry(0.3, 12, 12);
    var beaconMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.9,
      roughness: 0.4
    });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(15, 2.8, -35);
    beacon.castShadow = true;
    beacon.receiveShadow = true;
    scene.add(beacon);
    sceneObjects.push(beacon);
    emergencyBeacon = {
      mesh: beacon,
      strobeTime: 0,
      strobeFrequency: 2
    };
  }

  function createSupplyPalletStacks() {
    // Stacked supply pallets
    var positions = [
      [10, 0, 15],
      [16, 0, 12],
      [8, 0, 20]
    ];

    positions.forEach(function(pos) {
      for (var layer = 0; layer < 3; layer++) {
        var palletGeometry = new THREE.BoxGeometry(2, 0.4, 1.2);
        var palletMaterial = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.8 });
        var pallet = new THREE.Mesh(palletGeometry, palletMaterial);
        pallet.position.set(pos[0], pos[1] + layer * 0.5, pos[2]);
        pallet.castShadow = true;
        pallet.receiveShadow = true;
        scene.add(pallet);
        sceneObjects.push(pallet);

        // Supply boxes on pallet
        var boxGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        var boxMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.7 });

        for (var i = 0; i < 2; i++) {
          var box = new THREE.Mesh(boxGeometry, boxMaterial);
          box.position.set(pos[0] - 0.6 + i * 1.2, pos[1] + layer * 0.5 + 0.5, pos[2]);
          box.castShadow = true;
          box.receiveShadow = true;
          scene.add(box);
          sceneObjects.push(box);
        }
      }
    });
  }

  function createTerrain() {
    // Snow-covered ground
    var groundGeometry = new THREE.BoxGeometry(120, 0.5, 120);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0xEEFFFF, roughness: 0.95 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
    icePanels.push(ground);

    // Snow drifts for terrain variation
    for (var i = 0; i < 10; i++) {
      var driftGeometry = new THREE.BoxGeometry(
        5 + Math.random() * 4,
        0.6 + Math.random() * 1.2,
        8 + Math.random() * 6
      );
      var driftMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5FF, roughness: 0.95 });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.position.set(
        Math.random() * 100 - 50,
        0.3,
        Math.random() * 100 - 50
      );
      drift.rotation.y = Math.random() * Math.PI;
      drift.receiveShadow = true;
      scene.add(drift);
      sceneObjects.push(drift);
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    auroraLights = [];
    windTurbine = null;
    emergencyBeacon = null;
    satelliteDishes = [];
    snowcats = [];
    icePanels = [];
    elapsedTime = 0;

    // Arctic atmosphere
    scene.background = new THREE.Color(0x0A0E27);
    scene.fog = new THREE.Fog(0x0A0E27, 80, 150);

    // Aurora-tinted lighting
    var ambientLight = new THREE.AmbientLight(0x2244AA, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x88AAFF, 0.6);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all level elements
    createTerrain();
    createPrefabHabitatModules();
    createIceRunway();
    createSnowcatGarage();
    createSatelliteUplink();
    createFrozenStorageVault();
    createAuroraLights();
    createIceShelfEdge();
    createFuelBladders();
    createWeatherStationMast();
    createCrevasseBridge();
    createBlizzardWindTurbine();
    createEmergencyBeacon();
    createSupplyPalletStacks();
  }

  function update(delta) {
    elapsedTime += delta;

    // Aurora curtains shimmering effect
    auroraLights.forEach(function(aurora) {
      var shimmer = Math.sin(elapsedTime * 2 + aurora.shimmerId * 6) * 0.5 + 0.5;
      var currentColor = new THREE.Color(aurora.baseColor).lerp(
        new THREE.Color(aurora.alternateColor),
        shimmer
      );
      aurora.mesh.material.color.copy(currentColor);
      aurora.mesh.material.emissive.copy(currentColor);
      aurora.mesh.material.emissiveIntensity = 0.5 + shimmer * 0.6;
    });

    // Wind turbine spinning
    if (windTurbine) {
      windTurbine.rotation.z += 0.05;
    }

    // Emergency beacon strobing
    if (emergencyBeacon) {
      emergencyBeacon.strobeTime += delta;
      var strobePhase = (emergencyBeacon.strobeTime * emergencyBeacon.strobeFrequency) % 1;
      var strobeIntensity = strobePhase < 0.3 ? 1 : 0.1;
      emergencyBeacon.mesh.material.emissiveIntensity = 0.3 + strobeIntensity * 0.8;
    }

    // Snowcat idle vibration
    snowcats.forEach(function(snowcat) {
      if (snowcat.snowcatData) {
        snowcat.snowcatData.vibrateTime += delta;
        var vibration = Math.sin(snowcat.snowcatData.vibrateTime * 8) * snowcat.snowcatData.vibrateAmount;
        snowcat.position.y += vibration * 0.1;
      }
    });

    // Satellite dish slow tracking
    satelliteDishes.forEach(function(dish) {
      if (dish.trackingData) {
        dish.trackingData.angle += dish.trackingData.trackingSpeed * delta;
        dish.rotation.y = Math.sin(dish.trackingData.angle) * 0.5;
      }
    });

    // Ice panel micro-jitter (scale variations)
    icePanels.forEach(function(panel) {
      var jitter = Math.sin(elapsedTime * 3 + panel.position.x * 0.1) * 0.0015;
      panel.scale.y = 1 + jitter;
    });
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    sceneObjects = [];
    auroraLights = [];
    windTurbine = null;
    emergencyBeacon = null;
    satelliteDishes = [];
    snowcats = [];
    icePanels = [];
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
