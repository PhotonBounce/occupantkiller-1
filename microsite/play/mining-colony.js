var window = window || global;

window.MiningColony = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var drillAngle = 0;
  var conveyorOffset = 0;
  var panelAngle = 0;
  var laserPulse = 0;
  var debrisTumble = [];
  var craterGlow = 1.0;
  var craterPulsing = true;
  var cartPosition = 0;
  var lightBlinkState = 0;
  var asteroidRotation = 0;

  var spawnPoints = [];

  var colors = {
    asteroidGray: 0x4A4A4A,
    habitatWhite: 0xFFFFFF,
    oreOrange: 0xFF6600,
    spaceBlack: 0x000000,
    laserRed: 0xFF0000,
    steelBlue: 0x4682B4,
    darkGray: 0x333333,
    lightGray: 0x888888,
    solarBlue: 0x1E90FF,
    craterGray: 0x2A2A2A
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    debrisTumble = [];
    craterGlow = 1.0;
    cartPosition = 0;
    asteroidRotation = 0;

    // Set black space background
    scene.background = new THREE.Color(colors.spaceBlack);
    scene.fog = new THREE.Fog(colors.spaceBlack, 500, 1000);

    // Asteroid surface terrain - irregular gray blocks
    createAsteroidTerrain();

    // Habitat dome clusters
    createHabitatDomes();

    // Mining drill platform
    createDrillPlatform();

    // Ore processing bay
    createProcessingBay();

    // Mineral storage silos
    createStorageSilos();

    // Airlock module
    createAirlock();

    // Solar panel array
    createSolarArray();

    // Ore cart rail system
    createRailSystem();

    // Communications relay tower
    createCommunicationsRelay();

    // Explosion crater
    createExplosionCrater();

    // Emergency oxygen supply
    createOxygenSupply();

    // Rock cutting laser array
    createLaserArray();

    // Space debris floating
    createSpaceDebris();

    // Spawn points
    spawnPoints = [
      { name: 'airlock', pos: new THREE.Vector3(0, 5, 0) },
      { name: 'habitat', pos: new THREE.Vector3(-40, 15, -30) },
      { name: 'drill', pos: new THREE.Vector3(50, 20, 40) },
      { name: 'processing', pos: new THREE.Vector3(-30, 10, 50) },
      { name: 'exterior', pos: new THREE.Vector3(60, 25, -50) }
    ];
  }

  function createAsteroidTerrain() {
    var terrainGroup = new THREE.Group();

    // Irregular ground blocks
    var blockConfigs = [
      { x: 0, y: -30, z: 0, w: 200, h: 20, d: 200 },
      { x: -80, y: -20, z: 80, w: 60, h: 15, d: 60 },
      { x: 90, y: -25, z: 50, w: 50, h: 18, d: 50 },
      { x: 60, y: -22, z: -80, w: 70, h: 12, d: 70 },
      { x: -60, y: -18, z: -60, w: 55, h: 14, d: 55 }
    ];

    blockConfigs.forEach(function(cfg) {
      var geom = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      var mat = new THREE.MeshStandardMaterial({
        color: colors.asteroidGray,
        roughness: 0.8,
        metalness: 0.2
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      terrainGroup.add(mesh);
      objects.push(mesh);
    });

    scene.add(terrainGroup);
  }

  function createHabitatDomes() {
    var habitatGroup = new THREE.Group();

    // Main central dome
    var domeGeom = new THREE.SphereGeometry(20, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6);
    var domeMat = new THREE.MeshStandardMaterial({
      color: colors.habitatWhite,
      metalness: 0.4,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85
    });
    var dome1 = new THREE.Mesh(domeGeom, domeMat);
    dome1.position.set(-40, 5, -30);
    dome1.castShadow = true;
    habitatGroup.add(dome1);
    objects.push(dome1);

    // Secondary dome cluster
    var dome2 = new THREE.Mesh(domeGeom, domeMat);
    dome2.scale.set(0.7, 0.7, 0.7);
    dome2.position.set(-50, 8, -15);
    dome2.castShadow = true;
    habitatGroup.add(dome2);
    objects.push(dome2);

    // Connecting tunnels
    var tunnelGeom = new THREE.CylinderGeometry(3, 3, 20, 16);
    var tunnelMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.6,
      roughness: 0.3
    });

    var tunnel1 = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel1.rotation.z = Math.PI / 3;
    tunnel1.position.set(-45, 5, -22);
    tunnel1.castShadow = true;
    habitatGroup.add(tunnel1);
    objects.push(tunnel1);

    var tunnel2 = new THREE.Mesh(tunnelGeom, tunnelMat);
    tunnel2.rotation.z = Math.PI / 4;
    tunnel2.position.set(-35, 12, -32);
    tunnel2.castShadow = true;
    habitatGroup.add(tunnel2);
    objects.push(tunnel2);

    // Habitat lights (blink during update)
    var lightGeom = new THREE.SphereGeometry(1, 8, 8);
    var lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var hLight1 = new THREE.Mesh(lightGeom, lightMat);
    hLight1.position.set(-40, 20, -30);
    hLight1.name = 'habitatLight1';
    habitatGroup.add(hLight1);
    objects.push(hLight1);

    var hLight2 = new THREE.Mesh(lightGeom, lightMat);
    hLight2.position.set(-50, 15, -15);
    hLight2.name = 'habitatLight2';
    habitatGroup.add(hLight2);
    objects.push(hLight2);

    scene.add(habitatGroup);
  }

  function createDrillPlatform() {
    var drillGroup = new THREE.Group();

    // Main drill rig frame - large box structure
    var frameGeom = new THREE.BoxGeometry(30, 40, 25);
    var frameMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(50, 15, 40);
    frame.castShadow = true;
    frame.receiveShadow = true;
    drillGroup.add(frame);
    objects.push(frame);

    // Drill bit - large spinning cylinder
    var bitGeom = new THREE.CylinderGeometry(4, 4, 12, 16);
    var bitMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.8,
      roughness: 0.2
    });
    var drillBit = new THREE.Mesh(bitGeom, bitMat);
    drillBit.position.set(50, 5, 40);
    drillBit.name = 'drillBit';
    drillBit.castShadow = true;
    drillGroup.add(drillBit);
    objects.push(drillBit);

    // Support columns
    var colGeom = new THREE.CylinderGeometry(2, 2, 35, 8);
    var colMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });

    var col1 = new THREE.Mesh(colGeom, colMat);
    col1.position.set(40, 10, 30);
    col1.castShadow = true;
    drillGroup.add(col1);
    objects.push(col1);

    var col2 = new THREE.Mesh(colGeom, colMat);
    col2.position.set(60, 10, 50);
    col2.castShadow = true;
    drillGroup.add(col2);
    objects.push(col2);

    scene.add(drillGroup);
  }

  function createProcessingBay() {
    var bayGroup = new THREE.Group();

    // Conveyor platform
    var conveyorGeom = new THREE.BoxGeometry(50, 3, 15);
    var conveyorMat = new THREE.MeshStandardMaterial({
      color: colors.lightGray,
      metalness: 0.5,
      roughness: 0.4
    });
    var conveyor = new THREE.Mesh(conveyorGeom, conveyorMat);
    conveyor.position.set(-30, 8, 50);
    conveyor.name = 'conveyor';
    conveyor.castShadow = true;
    bayGroup.add(conveyor);
    objects.push(conveyor);

    // Crusher rollers
    var rollerGeom = new THREE.CylinderGeometry(2.5, 2.5, 15, 12);
    var rollerMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.7,
      roughness: 0.3
    });

    var roller1 = new THREE.Mesh(rollerGeom, rollerMat);
    roller1.rotation.z = Math.PI / 2;
    roller1.position.set(-30, 12, 45);
    roller1.name = 'roller1';
    roller1.castShadow = true;
    bayGroup.add(roller1);
    objects.push(roller1);

    var roller2 = new THREE.Mesh(rollerGeom, rollerMat);
    roller2.rotation.z = Math.PI / 2;
    roller2.position.set(-30, 12, 55);
    roller2.name = 'roller2';
    roller2.castShadow = true;
    bayGroup.add(roller2);
    objects.push(roller2);

    // Processing chamber
    var chamberGeom = new THREE.BoxGeometry(40, 20, 20);
    var chamberMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.6,
      roughness: 0.3
    });
    var chamber = new THREE.Mesh(chamberGeom, chamberMat);
    chamber.position.set(-30, 18, 50);
    chamber.castShadow = true;
    bayGroup.add(chamber);
    objects.push(chamber);

    // Hopper for ore input
    var hopperGeom = new THREE.ConeGeometry(8, 15, 8);
    var hopperMat = new THREE.MeshStandardMaterial({
      color: colors.oreOrange,
      metalness: 0.5,
      roughness: 0.4
    });
    var hopper = new THREE.Mesh(hopperGeom, hopperMat);
    hopper.position.set(-30, 30, 50);
    hopper.castShadow = true;
    bayGroup.add(hopper);
    objects.push(hopper);

    scene.add(bayGroup);
  }

  function createStorageSilos() {
    var siloGroup = new THREE.Group();

    var siloConfigs = [
      { x: 20, z: 60, s: 1.0 },
      { x: 10, z: 75, s: 0.8 },
      { x: 30, z: 75, s: 0.9 }
    ];

    siloConfigs.forEach(function(cfg) {
      var geom = new THREE.CylinderGeometry(6 * cfg.s, 7 * cfg.s, 35 * cfg.s, 12);
      var mat = new THREE.MeshStandardMaterial({
        color: colors.asteroidGray,
        metalness: 0.6,
        roughness: 0.4
      });
      var silo = new THREE.Mesh(geom, mat);
      silo.position.set(cfg.x, 12, cfg.z);
      silo.castShadow = true;
      silo.receiveShadow = true;
      siloGroup.add(silo);
      objects.push(silo);

      // Silo cap
      var capGeom = new THREE.ConeGeometry(6 * cfg.s, 8, 8);
      var capMat = new THREE.MeshStandardMaterial({
        color: colors.steelBlue,
        metalness: 0.7,
        roughness: 0.3
      });
      var cap = new THREE.Mesh(capGeom, capMat);
      cap.position.set(cfg.x, 30, cfg.z);
      cap.castShadow = true;
      siloGroup.add(cap);
      objects.push(cap);
    });

    scene.add(siloGroup);
  }

  function createAirlock() {
    var airlockGroup = new THREE.Group();

    // Outer chamber
    var outerGeom = new THREE.BoxGeometry(15, 20, 12);
    var airlockMat = new THREE.MeshStandardMaterial({
      color: colors.habitatWhite,
      metalness: 0.5,
      roughness: 0.3
    });
    var outer = new THREE.Mesh(outerGeom, airlockMat);
    outer.position.set(-5, 5, 0);
    outer.castShadow = true;
    airlockGroup.add(outer);
    objects.push(outer);

    // Inner chamber
    var innerGeom = new THREE.BoxGeometry(15, 20, 12);
    var inner = new THREE.Mesh(innerGeom, airlockMat);
    inner.position.set(15, 5, 0);
    inner.castShadow = true;
    airlockGroup.add(inner);
    objects.push(inner);

    // Connecting passage
    var passageGeom = new THREE.BoxGeometry(6, 18, 10);
    var passageMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.6,
      roughness: 0.3
    });
    var passage = new THREE.Mesh(passageGeom, passageMat);
    passage.position.set(5, 5, 0);
    passage.castShadow = true;
    airlockGroup.add(passage);
    objects.push(passage);

    // Door frames
    var doorGeom = new THREE.BoxGeometry(2, 15, 10);
    var doorMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.8,
      roughness: 0.2
    });
    var door1 = new THREE.Mesh(doorGeom, doorMat);
    door1.position.set(0, 5, 0);
    door1.castShadow = true;
    airlockGroup.add(door1);
    objects.push(door1);

    var door2 = new THREE.Mesh(doorGeom, doorMat);
    door2.position.set(10, 5, 0);
    door2.castShadow = true;
    airlockGroup.add(door2);
    objects.push(door2);

    scene.add(airlockGroup);
  }

  function createSolarArray() {
    var solarGroup = new THREE.Group();

    // Main mast
    var mastGeom = new THREE.CylinderGeometry(1.5, 1.5, 60, 8);
    var mastMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(70, 15, -30);
    mast.castShadow = true;
    solarGroup.add(mast);
    objects.push(mast);

    // Solar panels
    var panelConfigs = [
      { x: 0, y: 25, z: 0, rx: 0, ry: 0, rz: 0 },
      { x: 0, y: 0, z: 0, rx: Math.PI / 6, ry: 0, rz: 0 },
      { x: 0, y: 25, z: 0, rx: 0, ry: Math.PI / 4, rz: 0 }
    ];

    panelConfigs.forEach(function(cfg, idx) {
      var panelGeom = new THREE.BoxGeometry(25, 20, 0.5);
      var panelMat = new THREE.MeshStandardMaterial({
        color: colors.solarBlue,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0x003366
      });
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(70 + cfg.x, 15 + cfg.y, -30 + cfg.z);
      panel.rotation.order = 'YXZ';
      panel.rotation.x = cfg.rx;
      panel.rotation.y = cfg.ry;
      panel.rotation.z = cfg.rz;
      panel.name = 'solarPanel' + idx;
      panel.castShadow = true;
      solarGroup.add(panel);
      objects.push(panel);
    });

    scene.add(solarGroup);
  }

  function createRailSystem() {
    var railGroup = new THREE.Group();

    // Rail tracks
    var railGeom = new THREE.BoxGeometry(2, 1, 80);
    var railMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });

    var rail1 = new THREE.Mesh(railGeom, railMat);
    rail1.position.set(-5, 2, 30);
    rail1.castShadow = true;
    railGroup.add(rail1);
    objects.push(rail1);

    var rail2 = new THREE.Mesh(railGeom, railMat);
    rail2.position.set(5, 2, 30);
    rail2.castShadow = true;
    railGroup.add(rail2);
    objects.push(rail2);

    // Rail ties
    var tieGeom = new THREE.BoxGeometry(12, 0.5, 3);
    var tieMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.5,
      roughness: 0.4
    });
    for (var i = 0; i < 8; i++) {
      var tie = new THREE.Mesh(tieGeom, tieMat);
      tie.position.set(0, 2.5, 0 + i * 10);
      tie.castShadow = true;
      railGroup.add(tie);
      objects.push(tie);
    }

    // Ore cart
    var cartGeom = new THREE.BoxGeometry(8, 6, 6);
    var cartMat = new THREE.MeshStandardMaterial({
      color: colors.oreOrange,
      metalness: 0.6,
      roughness: 0.3
    });
    var cart = new THREE.Mesh(cartGeom, cartMat);
    cart.position.set(0, 5, 0);
    cart.name = 'oreCart';
    cart.castShadow = true;
    railGroup.add(cart);
    objects.push(cart);

    // Cart wheels
    var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.8,
      roughness: 0.2
    });
    for (var j = 0; j < 4; j++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-3 + j * 2, 2, -4);
      wheel.castShadow = true;
      railGroup.add(wheel);
      objects.push(wheel);
    }

    scene.add(railGroup);
  }

  function createCommunicationsRelay() {
    var comGroup = new THREE.Group();

    // Tower
    var towerGeom = new THREE.CylinderGeometry(3, 4, 50, 8);
    var towerMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-70, 20, 20);
    tower.castShadow = true;
    comGroup.add(tower);
    objects.push(tower);

    // Antenna dishes
    var dishGeom = new THREE.SphereGeometry(4, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var dishMat = new THREE.MeshStandardMaterial({
      color: colors.lightGray,
      metalness: 0.8,
      roughness: 0.1
    });

    var dish1 = new THREE.Mesh(dishGeom, dishMat);
    dish1.scale.set(1.2, 0.6, 1.2);
    dish1.position.set(-70, 45, 20);
    dish1.castShadow = true;
    comGroup.add(dish1);
    objects.push(dish1);

    var dish2 = new THREE.Mesh(dishGeom, dishMat);
    dish2.scale.set(1.0, 0.5, 1.0);
    dish2.position.set(-70, 40, 30);
    dish2.castShadow = true;
    comGroup.add(dish2);
    objects.push(dish2);

    scene.add(comGroup);
  }

  function createExplosionCrater() {
    var craterGroup = new THREE.Group();

    // Recessed crater floor
    var craterGeom = new THREE.BoxGeometry(40, 10, 40);
    var craterMat = new THREE.MeshStandardMaterial({
      color: colors.craterGray,
      metalness: 0.4,
      roughness: 0.6,
      emissive: 0x440000
    });
    var crater = new THREE.Mesh(craterGeom, craterMat);
    crater.position.set(40, -15, -60);
    crater.name = 'crater';
    crater.castShadow = true;
    crater.receiveShadow = true;
    craterGroup.add(crater);
    objects.push(crater);

    // Crater rim blocks
    var rimGeom = new THREE.BoxGeometry(8, 5, 8);
    var rimMat = new THREE.MeshStandardMaterial({
      color: colors.asteroidGray,
      metalness: 0.3,
      roughness: 0.7
    });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var rim = new THREE.Mesh(rimGeom, rimMat);
      rim.position.set(
        40 + Math.cos(angle) * 25,
        -10,
        -60 + Math.sin(angle) * 25
      );
      rim.castShadow = true;
      craterGroup.add(rim);
      objects.push(rim);
    }

    scene.add(craterGroup);
  }

  function createOxygenSupply() {
    var oxygenGroup = new THREE.Group();

    // Main oxygen tank
    var tankGeom = new THREE.CylinderGeometry(4, 4, 18, 8);
    var tankMat = new THREE.MeshStandardMaterial({
      color: colors.steelBlue,
      metalness: 0.7,
      roughness: 0.3
    });
    var tank1 = new THREE.Mesh(tankGeom, tankMat);
    tank1.position.set(-80, 8, -20);
    tank1.castShadow = true;
    oxygenGroup.add(tank1);
    objects.push(tank1);

    var tank2 = new THREE.Mesh(tankGeom, tankMat);
    tank2.position.set(-70, 8, -20);
    tank2.castShadow = true;
    oxygenGroup.add(tank2);
    objects.push(tank2);

    var tank3 = new THREE.Mesh(tankGeom, tankMat);
    tank3.position.set(-75, 15, -20);
    tank3.castShadow = true;
    oxygenGroup.add(tank3);
    objects.push(tank3);

    // Connection pipes
    var pipeGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
    var pipeMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.8,
      roughness: 0.2
    });

    var pipe1 = new THREE.Mesh(pipeGeom, pipeMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-75, 8, -10);
    pipe1.castShadow = true;
    oxygenGroup.add(pipe1);
    objects.push(pipe1);

    scene.add(oxygenGroup);
  }

  function createLaserArray() {
    var laserGroup = new THREE.Group();

    // Laser emitter blocks
    var emitterGeom = new THREE.BoxGeometry(8, 8, 8);
    var emitterMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      metalness: 0.7,
      roughness: 0.2
    });

    var emitter1 = new THREE.Mesh(emitterGeom, emitterMat);
    emitter1.position.set(80, 25, 60);
    emitter1.name = 'laserEmitter1';
    emitter1.castShadow = true;
    laserGroup.add(emitter1);
    objects.push(emitter1);

    var emitter2 = new THREE.Mesh(emitterGeom, emitterMat);
    emitter2.position.set(90, 25, 60);
    emitter2.name = 'laserEmitter2';
    emitter2.castShadow = true;
    laserGroup.add(emitter2);
    objects.push(emitter2);

    // Laser beams (line segments)
    var material = new THREE.LineBasicMaterial({ color: colors.laserRed, linewidth: 3 });

    var geometry1 = new THREE.BufferGeometry();
    var positions1 = new Float32Array([
      80, 25, 60,
      80, 25, -40
    ]);
    geometry1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
    var beam1 = new THREE.LineSegments(geometry1, material);
    beam1.name = 'laserBeam1';
    laserGroup.add(beam1);
    objects.push(beam1);

    var geometry2 = new THREE.BufferGeometry();
    var positions2 = new Float32Array([
      90, 25, 60,
      90, 25, -40
    ]);
    geometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    var beam2 = new THREE.LineSegments(geometry2, material);
    beam2.name = 'laserBeam2';
    laserGroup.add(beam2);
    objects.push(beam2);

    scene.add(laserGroup);
  }

  function createSpaceDebris() {
    var debrisGroup = new THREE.Group();

    var debrisConfigs = [
      { x: 100, y: 50, z: 80, s: 2.0, tSpeed: 0.3 },
      { x: -100, y: 40, z: 100, s: 1.5, tSpeed: 0.25 },
      { x: 120, y: 60, z: -80, s: 1.2, tSpeed: 0.35 },
      { x: -120, y: 35, z: -100, s: 1.8, tSpeed: 0.28 },
      { x: 0, y: 80, z: 120, s: 1.3, tSpeed: 0.32 }
    ];

    debrisConfigs.forEach(function(cfg, idx) {
      var geom = new THREE.SphereGeometry(cfg.s, 8, 8);
      var mat = new THREE.MeshStandardMaterial({
        color: colors.asteroidGray,
        metalness: 0.5,
        roughness: 0.6
      });
      var debris = new THREE.Mesh(geom, mat);
      debris.position.set(cfg.x, cfg.y, cfg.z);
      debris.name = 'debris' + idx;
      debris.castShadow = true;
      debrisGroup.add(debris);
      objects.push(debris);

      debrisTumble.push({
        mesh: debris,
        rotSpeed: cfg.tSpeed,
        axis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize()
      });
    });

    scene.add(debrisGroup);
  }

  function update(delta) {
    drillAngle += delta * 2;
    conveyorOffset += delta * 3;
    panelAngle += delta * 0.5;
    laserPulse += delta * 3;
    cartPosition += delta * 5;
    lightBlinkState += delta;
    asteroidRotation += delta * 0.02;

    // Crater glow pulse
    if (craterPulsing) {
      craterGlow -= delta * 0.3;
      if (craterGlow < 0.2) {
        craterPulsing = false;
      }
    } else {
      craterGlow += delta * 0.2;
      if (craterGlow > 1.0) {
        craterPulsing = true;
      }
    }

    // Update drill spinning
    objects.forEach(function(mesh) {
      if (mesh.name === 'drillBit') {
        mesh.rotation.y = drillAngle;
      }
    });

    // Update conveyor moving
    objects.forEach(function(mesh) {
      if (mesh.name === 'conveyor') {
        mesh.material.map = null;
      }
    });

    // Update rollers
    objects.forEach(function(mesh) {
      if (mesh.name === 'roller1' || mesh.name === 'roller2') {
        mesh.rotation.x = conveyorOffset;
      }
    });

    // Update solar panels rotating
    objects.forEach(function(mesh) {
      if (mesh.name && mesh.name.indexOf('solarPanel') === 0) {
        mesh.rotation.y += delta * 0.2;
      }
    });

    // Update space debris tumbling
    debrisTumble.forEach(function(item) {
      item.mesh.rotation.x += item.rotSpeed * delta;
      item.mesh.rotation.y += item.rotSpeed * delta * 0.7;
      item.mesh.rotation.z += item.rotSpeed * delta * 0.5;
    });

    // Update laser pulsing
    objects.forEach(function(mesh) {
      if (mesh.name && (mesh.name.indexOf('laserEmitter') === 0 || mesh.name.indexOf('laserBeam') === 0)) {
        var pulse = Math.sin(laserPulse) * 0.5 + 0.5;
        if (mesh.material) {
          mesh.material.opacity = pulse;
        }
      }
    });

    // Update ore cart rolling
    objects.forEach(function(mesh) {
      if (mesh.name === 'oreCart') {
        mesh.position.z = Math.sin(cartPosition * 0.3) * 20;
      }
    });

    // Update habitat lights blinking
    objects.forEach(function(mesh) {
      if (mesh.name === 'habitatLight1' || mesh.name === 'habitatLight2') {
        var blink = Math.sin(lightBlinkState * 3) > 0 ? 1 : 0.2;
        if (mesh.material) {
          mesh.material.intensity = blink;
        }
      }
    });

    // Update crater glow
    objects.forEach(function(mesh) {
      if (mesh.name === 'crater') {
        mesh.material.emissiveIntensity = craterGlow * 0.5;
      }
    });
  }

  function reset() {
    if (scene) {
      objects.forEach(function(mesh) {
        scene.remove(mesh);
      });
    }
    objects = [];
    debrisTumble = [];
    drillAngle = 0;
    conveyorOffset = 0;
    panelAngle = 0;
    laserPulse = 0;
    cartPosition = 0;
    lightBlinkState = 0;
    asteroidRotation = 0;
    craterGlow = 1.0;
    craterPulsing = true;
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints
  };
}());
