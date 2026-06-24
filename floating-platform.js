var window = window || {};

window.FloatingPlatform = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animationState = {
    antiGravPhase: 0,
    platformBobPhase: 0,
    shieldRotation: 0,
    catapultPhase: 0,
    droneDoorsPhase: 0,
    cloudDriftPhase: 0
  };
  var platformComponents = {
    mainDeck: null,
    antiGravGenerators: [],
    cloudSpheres: [],
    shieldDome: null,
    catapultArm: null,
    catapultBase: null,
    droneBayDoors: [],
    grapplePoints: [],
    platforms: [],
    turrets: []
  };
  var elapsedTime = 0;

  function createMainPlatformDeck() {
    var group = new THREE.Group();

    // Large main platform deck (flat box)
    var deckGeometry = new THREE.BoxGeometry(20, 1, 15);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x556677,
      metalness: 0.6,
      roughness: 0.4
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0;
    deck.castShadow = true;
    deck.receiveShadow = true;
    deck.platformData = { basisY: 0 };
    group.add(deck);
    platformComponents.mainDeck = group;

    // Platform edge barriers (thin vertical boxes)
    var barrierGeometry = new THREE.BoxGeometry(0.3, 1.5, 15);
    var barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0x445566,
      metalness: 0.5,
      roughness: 0.5
    });

    var barrier1 = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier1.position.set(-10, 0.75, 0);
    barrier1.castShadow = true;
    barrier1.receiveShadow = true;
    group.add(barrier1);

    var barrier2 = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier2.position.set(10, 0.75, 0);
    barrier2.castShadow = true;
    barrier2.receiveShadow = true;
    group.add(barrier2);

    var barrierGeometry2 = new THREE.BoxGeometry(20, 1.5, 0.3);
    var barrier3 = new THREE.Mesh(barrierGeometry2, barrierMaterial);
    barrier3.position.set(0, 0.75, -7.5);
    barrier3.castShadow = true;
    barrier3.receiveShadow = true;
    group.add(barrier3);

    var barrier4 = new THREE.Mesh(barrierGeometry2, barrierMaterial);
    barrier4.position.set(0, 0.75, 7.5);
    barrier4.castShadow = true;
    barrier4.receiveShadow = true;
    group.add(barrier4);

    group.position.set(0, 10, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createAntiGravGenerators() {
    var generators = [];

    // Three glowing anti-gravity generator pillars underneath
    var positions = [
      [-6, -2, -4],
      [0, -2, 6],
      [6, -2, -4]
    ];

    var cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);

    positions.forEach(function(pos) {
      var material = new THREE.MeshStandardMaterial({
        color: 0x00FFAA,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0x00FFAA,
        emissiveIntensity: 0.5
      });
      var generator = new THREE.Mesh(cylinderGeometry, material);
      generator.position.set(pos[0], pos[1], pos[2]);
      generator.castShadow = true;
      generator.receiveShadow = true;
      generator.generatorData = { baseMaterial: material };
      platformComponents.mainDeck.add(generator);
      generators.push(generator);
    });

    platformComponents.antiGravGenerators = generators;
    return generators;
  }

  function createDroneBayHangar() {
    var group = new THREE.Group();

    // Drone bay hangar opening (large box frame)
    var frameGeometry = new THREE.BoxGeometry(5, 4, 3);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 2, -6);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Drone bay doors (two sliding doors)
    var doorGeometry = new THREE.BoxGeometry(2.3, 3.8, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x445566,
      metalness: 0.7,
      roughness: 0.4
    });

    var door1 = new THREE.Mesh(doorGeometry, doorMaterial);
    door1.position.set(-1.3, 2, -6);
    door1.castShadow = true;
    door1.receiveShadow = true;
    door1.doorData = { closedX: -1.3, openX: -3.5, speed: 2.5 };
    group.add(door1);
    platformComponents.droneBayDoors.push(door1);

    var door2 = new THREE.Mesh(doorGeometry, doorMaterial);
    door2.position.set(1.3, 2, -6);
    door2.castShadow = true;
    door2.receiveShadow = true;
    door2.doorData = { closedX: 1.3, openX: 3.5, speed: 2.5 };
    group.add(door2);
    platformComponents.droneBayDoors.push(door2);

    platformComponents.mainDeck.add(group);
    return group;
  }

  function createCatapultLauncher() {
    var group = new THREE.Group();

    // Catapult base (platform)
    var baseGeometry = new THREE.BoxGeometry(3, 0.5, 5);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.6,
      roughness: 0.4
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(8, 0.5, 3);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
    platformComponents.catapultBase = base;

    // Catapult arm (long box rotating)
    var armGeometry = new THREE.BoxGeometry(0.4, 0.4, 4.5);
    var armMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0xFF6600,
      emissiveIntensity: 0.3
    });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, 0.5, 0);
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);
    platformComponents.catapultArm = arm;
    arm.armData = { baseRotation: 0, maxRotation: Math.PI / 3 };

    // Catapult support struts
    var strutGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
    var strutMaterial = new THREE.MeshStandardMaterial({
      color: 0x556677,
      metalness: 0.6,
      roughness: 0.4
    });

    var strut1 = new THREE.Mesh(strutGeometry, strutMaterial);
    strut1.position.set(-1, -1, -1);
    strut1.castShadow = true;
    group.add(strut1);

    var strut2 = new THREE.Mesh(strutGeometry, strutMaterial);
    strut2.position.set(1, -1, -1);
    strut2.castShadow = true;
    group.add(strut2);

    platformComponents.mainDeck.add(group);
    return group;
  }

  function createEnergyShieldDome() {
    var group = new THREE.Group();

    // Shield dome frame using LineSegments (wireframe hemisphere)
    var points = [];
    var segments = [];
    var rings = 6;
    var segments_per_ring = 12;

    // Create hemisphere points
    for (var r = 0; r <= rings; r++) {
      var theta = (r / rings) * (Math.PI / 2);
      var radius = 8 * Math.sin(theta);
      var height = 8 * Math.cos(theta);

      for (var s = 0; s < segments_per_ring; s++) {
        var phi = (s / segments_per_ring) * Math.PI * 2;
        var x = radius * Math.cos(phi);
        var z = radius * Math.sin(phi);
        points.push(new THREE.Vector3(x, height, z));
      }
    }

    // Create ring segments
    for (var ring = 0; ring < rings; ring++) {
      var ringStart = ring * segments_per_ring;
      for (var seg = 0; seg < segments_per_ring; seg++) {
        var p1 = ringStart + seg;
        var p2 = ringStart + ((seg + 1) % segments_per_ring);
        segments.push(p1, p2);
      }
    }

    // Create vertical segments
    for (var ring2 = 0; ring2 < rings; ring2++) {
      for (var seg2 = 0; seg2 < segments_per_ring; seg2 += 3) {
        var p3 = ring2 * segments_per_ring + seg2;
        var p4 = (ring2 + 1) * segments_per_ring + seg2;
        segments.push(p3, p4);
      }
    }

    var geometry = new THREE.BufferGeometry();
    var positionArray = new Float32Array(points.length * 3);
    for (var i = 0; i < points.length; i++) {
      positionArray[i * 3] = points[i].x;
      positionArray[i * 3 + 1] = points[i].y;
      positionArray[i * 3 + 2] = points[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

    var indexArray = new Uint32Array(segments);
    geometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4488FF,
      linewidth: 2,
      emissive: 0x2255FF,
      fog: false
    });

    var shield = new THREE.LineSegments(geometry, lineMaterial);
    shield.position.set(0, 5, 0);
    shield.shieldData = { rotationSpeed: 0.3 };
    group.add(shield);
    platformComponents.shieldDome = shield;

    platformComponents.mainDeck.add(group);
    return group;
  }

  function createCloudMistSpheres() {
    var clouds = [];

    // Large semi-transparent cloud spheres for stealth cover
    var sphereGeometry = new THREE.SphereGeometry(6, 16, 16);

    var positions = [
      [-10, 8, -8],
      [8, 6, 5],
      [-5, 7, 10],
      [12, 9, -3]
    ];

    positions.forEach(function(pos) {
      var cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.15,
        metalness: 0,
        roughness: 1,
        emissive: 0xCCCCCC,
        emissiveIntensity: 0.2
      });
      var cloud = new THREE.Mesh(sphereGeometry, cloudMaterial);
      cloud.position.set(pos[0], pos[1], pos[2]);
      cloud.castShadow = false;
      cloud.receiveShadow = false;
      cloud.cloudData = {
        baseX: pos[0],
        baseY: pos[1],
        baseZ: pos[2],
        driftSpeed: 0.5 + Math.random() * 0.5
      };
      platformComponents.mainDeck.add(cloud);
      clouds.push(cloud);
    });

    platformComponents.cloudSpheres = clouds;
    return clouds;
  }

  function createGunTurrets() {
    var turrets = [];

    // Gun turret emplacements (cylinder + cone barrel)
    var turretPositions = [
      [-8, 1.2, -6],
      [8, 1.2, -6],
      [-8, 1.2, 6],
      [8, 1.2, 6]
    ];

    turretPositions.forEach(function(pos) {
      var turretGroup = new THREE.Group();

      // Turret base (cylinder)
      var baseGeometry = new THREE.CylinderGeometry(0.8, 1, 0.5, 12);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x334455,
        metalness: 0.7,
        roughness: 0.3
      });
      var turretBase = new THREE.Mesh(baseGeometry, baseMaterial);
      turretBase.position.y = 0.3;
      turretBase.castShadow = true;
      turretBase.receiveShadow = true;
      turretGroup.add(turretBase);

      // Gun barrel (cone)
      var barrelGeometry = new THREE.ConeGeometry(0.3, 2, 8);
      var barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.9,
        roughness: 0.2
      });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.y = 1;
      barrel.rotation.z = Math.PI / 2;
      barrel.castShadow = true;
      turretGroup.add(barrel);

      turretGroup.position.set(pos[0], pos[1], pos[2]);
      platformComponents.mainDeck.add(turretGroup);
      turrets.push(turretGroup);
    });

    platformComponents.turrets = turrets;
    return turrets;
  }

  function createPowerConduitCables() {
    var cables = [];

    // Power conduit cables using LineSegments
    var cablePositions = [
      [[-8, 0.5, -4], [-6, -1.5, -3]],
      [[0, 0.5, 5], [0, -1.5, 6]],
      [[8, 0.5, -4], [6, -1.5, -3]],
      [[-6, 0.5, 3], [-5, -1.5, 4]],
      [[6, 0.5, 3], [5, -1.5, 4]]
    ];

    cablePositions.forEach(function(pair) {
      var geometry = new THREE.BufferGeometry();
      var points = [
        new THREE.Vector3(pair[0][0], pair[0][1], pair[0][2]),
        new THREE.Vector3(pair[1][0], pair[1][1], pair[1][2])
      ];
      var positionArray = new Float32Array([
        pair[0][0], pair[0][1], pair[0][2],
        pair[1][0], pair[1][1], pair[1][2]
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

      var material = new THREE.LineBasicMaterial({
        color: 0x00FFAA,
        linewidth: 2,
        emissive: 0x00DD88
      });
      var line = new THREE.LineSegments(geometry, material);
      platformComponents.mainDeck.add(line);
      cables.push(line);
    });

    return cables;
  }

  function createSuspendedCargoNets() {
    var nets = [];

    // Suspended cargo nets using LineSegments
    var netPositions = [
      [-5, -2, 0],
      [5, -2, 0]
    ];

    netPositions.forEach(function(centerPos) {
      var netGeometry = new THREE.BufferGeometry();
      var netPoints = [];
      var netSegments = [];

      // Create grid of net points
      for (var nx = 0; nx < 4; nx++) {
        for (var nz = 0; nz < 4; nz++) {
          netPoints.push(new THREE.Vector3(
            centerPos[0] + (nx - 1.5) * 0.6,
            centerPos[1] + (nz - 1.5) * 0.6,
            centerPos[2]
          ));
        }
      }

      // Create net lines
      for (var nx2 = 0; nx2 < 4; nx2++) {
        for (var nz2 = 0; nz2 < 4; nz2++) {
          var idx = nx2 * 4 + nz2;
          if (nx2 < 3) netSegments.push(idx, idx + 4);
          if (nz2 < 3) netSegments.push(idx, idx + 1);
        }
      }

      var positionArray = new Float32Array(netPoints.length * 3);
      for (var np = 0; np < netPoints.length; np++) {
        positionArray[np * 3] = netPoints[np].x;
        positionArray[np * 3 + 1] = netPoints[np].y;
        positionArray[np * 3 + 2] = netPoints[np].z;
      }
      netGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

      var indexArray = new Uint32Array(netSegments);
      netGeometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

      var netMaterial = new THREE.LineBasicMaterial({
        color: 0x889900,
        linewidth: 1
      });
      var netMesh = new THREE.LineSegments(netGeometry, netMaterial);
      platformComponents.mainDeck.add(netMesh);
      nets.push(netMesh);
    });

    return nets;
  }

  function createObservationTower() {
    var group = new THREE.Group();

    // Tower shaft (tall box)
    var shaftGeometry = new THREE.BoxGeometry(0.8, 5, 0.8);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x445566,
      metalness: 0.6,
      roughness: 0.4
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(-9, 3, -6);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Tower observation deck (box platform)
    var deckGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x334455,
      metalness: 0.6,
      roughness: 0.4
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(-9, 5.3, -6);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Tower light (small sphere with glow)
    var lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.5
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(-9, 5.8, -6);
    light.castShadow = true;
    group.add(light);

    platformComponents.mainDeck.add(group);
    return group;
  }

  function createGrapplePointAnchors() {
    var anchors = [];

    // Grapple point anchors (small spheres at strategic locations)
    var anchorPositions = [
      [-7, 3, 0],
      [7, 3, 0],
      [-5, 2.5, 7],
      [5, 2.5, 7],
      [0, 3.5, -7],
      [-9, 4.5, -6]
    ];

    var anchorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var anchorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF00FF,
      emissive: 0xFF00FF,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2
    });

    anchorPositions.forEach(function(pos) {
      var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
      anchor.position.set(pos[0], pos[1], pos[2]);
      anchor.castShadow = true;
      platformComponents.mainDeck.add(anchor);
      anchors.push(anchor);
    });

    platformComponents.grapplePoints = anchors;
    return anchors;
  }

  function createSecondaryPlatforms() {
    var platforms = [];

    // Two secondary floating platforms connected by bridges
    var secondaryData = [
      {
        position: [-15, 8, -8],
        size: [8, 0.8, 8],
        bridgeEnd: [-10.5, 8.8, -4]
      },
      {
        position: [15, 8, 6],
        size: [8, 0.8, 8],
        bridgeEnd: [10.5, 8.8, 3]
      }
    ];

    secondaryData.forEach(function(data) {
      var group = new THREE.Group();

      // Secondary platform deck
      var deckGeometry = new THREE.BoxGeometry(data.size[0], data.size[1], data.size[2]);
      var deckMaterial = new THREE.MeshStandardMaterial({
        color: 0x556677,
        metalness: 0.6,
        roughness: 0.4
      });
      var deck = new THREE.Mesh(deckGeometry, deckMaterial);
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);

      // Support pillars
      var pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 12);
      var pillarMaterial = new THREE.MeshStandardMaterial({
        color: 0x445566,
        metalness: 0.6,
        roughness: 0.4
      });

      var pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar1.position.set(-3, -2.5, -3);
      pillar1.castShadow = true;
      group.add(pillar1);

      var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar2.position.set(3, -2.5, 3);
      pillar2.castShadow = true;
      group.add(pillar2);

      group.position.set(data.position[0], data.position[1], data.position[2]);
      platformComponents.mainDeck.add(group);

      // Bridge to main platform
      var bridgeGeometry = new THREE.BoxGeometry(
        Math.hypot(data.bridgeEnd[0] - data.position[0], data.bridgeEnd[2] - data.position[2]) + 0.2,
        0.4,
        1.5
      );
      var bridgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x556677,
        metalness: 0.6,
        roughness: 0.4
      });
      var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      var midX = (data.position[0] + data.bridgeEnd[0]) / 2;
      var midZ = (data.position[2] + data.bridgeEnd[2]) / 2;
      bridge.position.set(midX, data.bridgeEnd[1], midZ);
      var angle = Math.atan2(data.bridgeEnd[2] - data.position[2], data.bridgeEnd[0] - data.position[0]);
      bridge.rotation.y = angle;
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      platformComponents.mainDeck.add(bridge);

      platforms.push(group);
    });

    platformComponents.platforms = platforms;
    return platforms;
  }

  var module = {
    init: function(_scene, _camera) {
      scene = _scene;
      camera = _camera;

      createMainPlatformDeck();
      createAntiGravGenerators();
      createDroneBayHangar();
      createCatapultLauncher();
      createEnergyShieldDome();
      createCloudMistSpheres();
      createGunTurrets();
      createPowerConduitCables();
      createSuspendedCargoNets();
      createObservationTower();
      createGrapplePointAnchors();
      createSecondaryPlatforms();

      elapsedTime = 0;
    },

    update: function(delta) {
      elapsedTime += delta;

      // Anti-gravity generators pulsing
      animationState.antiGravPhase += delta * 2;
      platformComponents.antiGravGenerators.forEach(function(gen) {
        var pulseMagnitude = 0.3 + Math.sin(animationState.antiGravPhase) * 0.25;
        if (gen.material && gen.material.emissiveIntensity !== undefined) {
          gen.material.emissiveIntensity = pulseMagnitude;
        }
      });

      // Platform gently bobbing
      animationState.platformBobPhase += delta;
      if (platformComponents.mainDeck) {
        var bobAmount = Math.sin(animationState.platformBobPhase * 0.8) * 0.3;
        platformComponents.mainDeck.position.y = 10 + bobAmount;
      }

      // Cloud spheres drifting slowly
      animationState.cloudDriftPhase += delta;
      platformComponents.cloudSpheres.forEach(function(cloud) {
        if (cloud.cloudData) {
          cloud.position.x = cloud.cloudData.baseX + Math.sin(animationState.cloudDriftPhase * cloud.cloudData.driftSpeed) * 2;
          cloud.position.z = cloud.cloudData.baseZ + Math.cos(animationState.cloudDriftPhase * cloud.cloudData.driftSpeed * 0.7) * 1.5;
        }
      });

      // Shield dome rotating
      animationState.shieldRotation += delta * 0.5;
      if (platformComponents.shieldDome) {
        platformComponents.shieldDome.rotation.y = animationState.shieldRotation;
      }

      // Catapult arm cocking and releasing cycle
      animationState.catapultPhase += delta;
      var catapultCycle = (animationState.catapultPhase % 4) / 4;
      if (platformComponents.catapultArm && platformComponents.catapultArm.armData) {
        var armMaxRotation = platformComponents.catapultArm.armData.maxRotation;
        if (catapultCycle < 0.5) {
          // Cock phase
          platformComponents.catapultArm.rotation.z = -armMaxRotation * (catapultCycle * 2);
        } else if (catapultCycle < 0.6) {
          // Fire phase
          platformComponents.catapultArm.rotation.z = 0;
        } else {
          // Rest phase
          platformComponents.catapultArm.rotation.z = 0;
        }
      }

      // Drone bay doors opening and closing
      animationState.droneDoorsPhase += delta;
      var doorCycle = (animationState.droneDoorsPhase % 6) / 6;
      platformComponents.droneBayDoors.forEach(function(door) {
        if (door.doorData) {
          var doorSpeed = door.doorData.speed;
          if (doorCycle < 0.25) {
            // Open phase
            var t = (doorCycle / 0.25);
            if (door.doorData.closedX < 0) {
              door.position.x = door.doorData.closedX - (door.doorData.openX - door.doorData.closedX) * t;
            } else {
              door.position.x = door.doorData.closedX + (door.doorData.openX - door.doorData.closedX) * t;
            }
          } else if (doorCycle > 0.75) {
            // Close phase
            var t2 = ((doorCycle - 0.75) / 0.25);
            if (door.doorData.closedX < 0) {
              door.position.x = door.doorData.openX + (door.doorData.closedX - door.doorData.openX) * t2;
            } else {
              door.position.x = door.doorData.openX - (door.doorData.openX - door.doorData.closedX) * t2;
            }
          }
        }
      });
    },

    reset: function() {
      sceneObjects.forEach(function(obj) {
        if (scene) {
          scene.remove(obj);
        }
      });
      sceneObjects = [];
      platformComponents = {
        mainDeck: null,
        antiGravGenerators: [],
        cloudSpheres: [],
        shieldDome: null,
        catapultArm: null,
        catapultBase: null,
        droneBayDoors: [],
        grapplePoints: [],
        platforms: [],
        turrets: []
      };
      animationState = {
        antiGravPhase: 0,
        platformBobPhase: 0,
        shieldRotation: 0,
        catapultPhase: 0,
        droneDoorsPhase: 0,
        cloudDriftPhase: 0
      };
      elapsedTime = 0;
    }
  };

  return module;
}());
