window.FrozenBase = (function() {
  'use strict';

  // Module state
  var scene;
  var camera;
  var baseObjects = [];
  var particles = [];
  var beacons = [];
  var polarBears = [];
  var snowdrifts = [];
  var animationTime = 0;

  // Initialize the frozen base
  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    baseObjects = [];
    particles = [];
    beacons = [];
    polarBears = [];
    snowdrifts = [];
    animationTime = 0;

    // Create snow-covered ground
    createSnowGround();

    // Create main research building
    createMainBuilding();

    // Create frozen storage tanks
    createStorageTanks();

    // Create snowcat vehicles
    createSnowcats();

    // Create antenna mast
    createAntennaMast();

    // Create frozen satellite dish
    createSatelliteDish();

    // Create emergency generator hut
    createGeneratorHut();

    // Create ice wall defensive berms
    createIceWalls();

    // Create frozen water barrels
    createWaterBarrels();

    // Create equipment crates
    createEquipmentCrates();

    // Create dog sled
    createDogSled();

    // Create polar bear
    createPolarBear();

    // Create icicles
    createIcicles();

    // Create snowdrift sculpted walls
    createSnowdrifts();

    // Create solar array
    createSolarArray();

    // Create emergency light beacons
    createBeacons();

    // Create frozen fuel tanker
    createFuelTanker();

    // Create collapsed antenna sections
    createCollapsedAntenna();

    // Create ice crack patterns
    createIceCracks();

    // Initialize snow particles
    initializeSnowParticles();
  };

  // Ground: snow-covered white flat surface
  var createSnowGround = function() {
    var geometry = new THREE.BoxGeometry(300, 1, 300);
    var material = new THREE.MeshStandardMaterial({
      color: 0xEEEEEE,
      roughness: 0.8,
      metalness: 0.1
    });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    baseObjects.push(ground);
  };

  // Main research building with ice-crust overlay
  var createMainBuilding = function() {
    // Main building structure
    var mainGeometry = new THREE.BoxGeometry(40, 35, 50);
    var mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.6,
      metalness: 0.3
    });
    var mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.position.set(0, 17.5, 0);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    scene.add(mainBuilding);
    baseObjects.push(mainBuilding);

    // Ice-crust overlay
    var iceGeometry = new THREE.BoxGeometry(41, 36, 51);
    var iceMaterial = new THREE.MeshStandardMaterial({
      color: 0xB4E7FF,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.4
    });
    var iceCrust = new THREE.Mesh(iceGeometry, iceMaterial);
    iceCrust.position.set(0, 17.5, 0);
    iceCrust.castShadow = true;
    scene.add(iceCrust);
    baseObjects.push(iceCrust);

    // Windows
    for (var i = 0; i < 4; i++) {
      var windowGeometry = new THREE.BoxGeometry(4, 4, 0.5);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.1,
        metalness: 0.9
      });
      var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
      windowMesh.position.set(-15 + i * 10, 25, 25.5);
      windowMesh.castShadow = true;
      scene.add(windowMesh);
      baseObjects.push(windowMesh);
    }
  };

  // Frozen storage tanks
  var createStorageTanks = function() {
    for (var i = 0; i < 3; i++) {
      // Tank body
      var tankGeometry = new THREE.CylinderGeometry(8, 8, 20, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.7,
        metalness: 0.4
      });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(-60 + i * 35, 10, -50);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      baseObjects.push(tank);

      // Ice coating
      var iceCoatGeometry = new THREE.CylinderGeometry(8.5, 8.5, 21, 16);
      var iceCoatMaterial = new THREE.MeshStandardMaterial({
        color: 0xD0E8FF,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.5
      });
      var iceCoat = new THREE.Mesh(iceCoatGeometry, iceCoatMaterial);
      iceCoat.position.set(-60 + i * 35, 10, -50);
      iceCoat.castShadow = true;
      scene.add(iceCoat);
      baseObjects.push(iceCoat);
    }
  };

  // Snowcat vehicles
  var createSnowcats = function() {
    for (var i = 0; i < 2; i++) {
      // Cab
      var cabGeometry = new THREE.BoxGeometry(5, 4, 8);
      var cabMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF4500,
        roughness: 0.6,
        metalness: 0.4
      });
      var cab = new THREE.Mesh(cabGeometry, cabMaterial);
      cab.position.set(50 + i * 25, 2, -70);
      cab.castShadow = true;
      cab.receiveShadow = true;
      scene.add(cab);
      baseObjects.push(cab);

      // Track bases (BoxGeometry for simplicity)
      var trackGeometry = new THREE.BoxGeometry(6, 2, 12);
      var trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        roughness: 0.8,
        metalness: 0.2
      });
      var track = new THREE.Mesh(trackGeometry, trackMaterial);
      track.position.set(50 + i * 25, 1, -70);
      track.castShadow = true;
      track.receiveShadow = true;
      scene.add(track);
      baseObjects.push(track);
    }
  };

  // Antenna mast
  var createAntennaMast = function() {
    // Main mast cylinder
    var mastGeometry = new THREE.CylinderGeometry(1.5, 1.5, 60, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.7,
      metalness: 0.5
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(40, 30, 40);
    mast.castShadow = true;
    scene.add(mast);
    baseObjects.push(mast);

    // Guy wires (LineSegments)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      40, 30, 40,    30, 5, 30,
      40, 30, 40,    50, 5, 50,
      40, 30, 40,    40, 5, 60,
      40, 30, 40,    50, 5, 30
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
    var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wires);
    baseObjects.push(wires);

    // Top antenna
    var antennaGeometry = new THREE.ConeGeometry(1, 8, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      roughness: 0.5,
      metalness: 0.8
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(40, 65, 40);
    antenna.castShadow = true;
    scene.add(antenna);
    baseObjects.push(antenna);
  };

  // Frozen satellite dish
  var createSatelliteDish = function() {
    // Dish base structure
    var dishBaseGeometry = new THREE.BoxGeometry(25, 2, 25);
    var dishBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.6,
      metalness: 0.5
    });
    var dishBase = new THREE.Mesh(dishBaseGeometry, dishBaseMaterial);
    dishBase.position.set(-50, 1, 60);
    dishBase.castShadow = true;
    dishBase.receiveShadow = true;
    scene.add(dishBase);
    baseObjects.push(dishBase);

    // Dish surface (BoxGeometry approximation)
    var surfaceGeometry = new THREE.BoxGeometry(22, 1, 22);
    var surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.4,
      metalness: 0.7
    });
    var surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.set(-50, 12, 60);
    surface.castShadow = true;
    surface.receiveShadow = true;
    scene.add(surface);
    baseObjects.push(surface);

    // Ice chunks on dish
    for (var i = 0; i < 5; i++) {
      var chunkGeometry = new THREE.BoxGeometry(3 + Math.random() * 2, 2 + Math.random() * 1.5, 3 + Math.random() * 2);
      var chunkMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCE5FF,
        roughness: 0.2,
        metalness: 0.6
      });
      var chunk = new THREE.Mesh(chunkGeometry, chunkMaterial);
      chunk.position.set(-60 + Math.random() * 20, 13 + Math.random() * 3, 50 + Math.random() * 20);
      chunk.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      chunk.castShadow = true;
      scene.add(chunk);
      baseObjects.push(chunk);
    }
  };

  // Emergency generator hut
  var createGeneratorHut = function() {
    // Hut structure
    var hutGeometry = new THREE.BoxGeometry(12, 10, 15);
    var hutMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F,
      roughness: 0.7,
      metalness: 0.2
    });
    var hut = new THREE.Mesh(hutGeometry, hutMaterial);
    hut.position.set(80, 5, -20);
    hut.castShadow = true;
    hut.receiveShadow = true;
    scene.add(hut);
    baseObjects.push(hut);

    // Exhaust chimney
    var chimneyGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
    var chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1C1C1C,
      roughness: 0.8,
      metalness: 0.3
    });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(85, 10, -20);
    chimney.castShadow = true;
    scene.add(chimney);
    baseObjects.push(chimney);
  };

  // Ice wall defensive berms
  var createIceWalls = function() {
    for (var i = 0; i < 4; i++) {
      var wallGeometry = new THREE.BoxGeometry(50, 6, 3);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x87CEEB,
        roughness: 0.3,
        metalness: 0.6
      });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);

      if (i === 0) wall.position.set(0, 3, -80);
      else if (i === 1) wall.position.set(0, 3, 80);
      else if (i === 2) wall.position.set(-80, 3, 0);
      else wall.position.set(80, 3, 0);

      wall.rotation.y = (i % 2) * Math.PI / 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      baseObjects.push(wall);
    }
  };

  // Frozen water barrels
  var createWaterBarrels = function() {
    for (var i = 0; i < 6; i++) {
      var barrelGeometry = new THREE.CylinderGeometry(2, 2, 4, 8);
      var barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0xB22222,
        roughness: 0.6,
        metalness: 0.4
      });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(-70 + (i % 3) * 20, 2, -80 + Math.floor(i / 3) * 20);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      baseObjects.push(barrel);
    }
  };

  // Equipment crates
  var createEquipmentCrates = function() {
    for (var i = 0; i < 8; i++) {
      var crateGeometry = new THREE.BoxGeometry(6, 5, 6);
      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.2
      });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      var x = -40 + (i % 4) * 20;
      var z = 30 + Math.floor(i / 4) * 25;
      crate.position.set(x, 2.5, z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      baseObjects.push(crate);

      // Half-submerged effect (snow around it)
      var snowGeometry = new THREE.BoxGeometry(7, 1.5, 7);
      var snowMaterial = new THREE.MeshStandardMaterial({
        color: 0xF5F5F5,
        roughness: 0.8,
        metalness: 0.05
      });
      var snowMound = new THREE.Mesh(snowGeometry, snowMaterial);
      snowMound.position.set(x, 0.75, z);
      snowMound.receiveShadow = true;
      scene.add(snowMound);
      baseObjects.push(snowMound);
    }
  };

  // Dog sled
  var createDogSled = function() {
    // Sled base
    var sledGeometry = new THREE.BoxGeometry(3, 1, 6);
    var sledMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6,
      metalness: 0.3
    });
    var sled = new THREE.Mesh(sledGeometry, sledMaterial);
    sled.position.set(60, 0.5, 70);
    sled.castShadow = true;
    sled.receiveShadow = true;
    scene.add(sled);
    baseObjects.push(sled);

    // Harness lines (LineSegments)
    var harnessGeometry = new THREE.BufferGeometry();
    var harnessPositions = new Float32Array([
      60, 1.5, 68,    58, 0.5, 65,
      60, 1.5, 68,    62, 0.5, 65,
      60, 1.5, 68,    58, 0.5, 70,
      60, 1.5, 68,    62, 0.5, 70
    ]);
    harnessGeometry.setAttribute('position', new THREE.BufferAttribute(harnessPositions, 3));
    var harnessMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    var harness = new THREE.LineSegments(harnessGeometry, harnessMaterial);
    scene.add(harness);
    baseObjects.push(harness);
  };

  // Polar bear
  var createPolarBear = function() {
    var bear = {};
    bear.position = new THREE.Vector3(-100, 0, 100);
    bear.objects = [];

    // Body
    var bodyGeometry = new THREE.SphereGeometry(4, 16, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFF0,
      roughness: 0.6,
      metalness: 0.1
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.copy(bear.position);
    body.scale.set(1, 0.8, 1.3);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    bear.objects.push(body);

    // Head
    var headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFF0,
      roughness: 0.6,
      metalness: 0.1
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(bear.position.x, bear.position.y + 2, bear.position.z + 4);
    head.castShadow = true;
    scene.add(head);
    bear.objects.push(head);

    // Snout
    var snoutGeometry = new THREE.ConeGeometry(1.2, 2, 8);
    var snoutMaterial = new THREE.MeshStandardMaterial({
      color: 0xF0E68C,
      roughness: 0.5,
      metalness: 0.2
    });
    var snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
    snout.position.set(bear.position.x, bear.position.y + 2.5, bear.position.z + 5.5);
    snout.castShadow = true;
    scene.add(snout);
    bear.objects.push(snout);

    bear.time = 0;
    polarBears.push(bear);
  };

  // Icicles
  var createIcicles = function() {
    // Icicle clusters on building
    var iciclePositions = [
      [-20, 33, 25], [-10, 33, 25], [0, 33, 25], [10, 33, 25], [20, 33, 25],
      [-20, 20, -25], [0, 22, -25], [20, 20, -25]
    ];

    for (var p = 0; p < iciclePositions.length; p++) {
      var pos = iciclePositions[p];

      // Cluster of 3-4 icicles
      for (var i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
        var icicleGeometry = new THREE.ConeGeometry(0.4, 3 + Math.random() * 2, 6);
        var icicleMaterial = new THREE.MeshStandardMaterial({
          color: 0xE0F6FF,
          roughness: 0.1,
          metalness: 0.9
        });
        var icicle = new THREE.Mesh(icicleGeometry, icicleMaterial);
        icicle.position.set(pos[0] + i * 1.5 - 1.5, pos[1], pos[2]);
        icicle.rotation.z = Math.PI;
        icicle.castShadow = true;
        scene.add(icicle);
        baseObjects.push(icicle);
      }
    }
  };

  // Snowdrift sculpted walls
  var createSnowdrifts = function() {
    for (var i = 0; i < 6; i++) {
      var driftGeometry = new THREE.BoxGeometry(20, 8, 5);
      var driftMaterial = new THREE.MeshStandardMaterial({
        color: 0xF0F8FF,
        roughness: 0.8,
        metalness: 0.05
      });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);

      var angle = (i / 6) * Math.PI * 2;
      var radius = 120;
      drift.position.set(
        Math.cos(angle) * radius,
        4,
        Math.sin(angle) * radius
      );
      drift.rotation.y = angle + Math.PI / 2;
      drift.castShadow = true;
      drift.receiveShadow = true;
      scene.add(drift);
      snowdrifts.push(drift);
    }
  };

  // Solar array
  var createSolarArray = function() {
    // Panel frame
    for (var i = 0; i < 4; i++) {
      var panelGeometry = new THREE.BoxGeometry(8, 0.2, 10);
      var panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.4,
        metalness: 0.8
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(30 + i * 12, 25, -60);
      panel.rotation.z = Math.PI / 6;
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);
      baseObjects.push(panel);

      // Ice on panels
      var iceGeometry = new THREE.BoxGeometry(8.5, 0.1, 10.5);
      var iceMaterial = new THREE.MeshStandardMaterial({
        color: 0xB0E0E6,
        roughness: 0.3,
        metalness: 0.7,
        transparent: true,
        opacity: 0.6
      });
      var panelIce = new THREE.Mesh(iceGeometry, iceMaterial);
      panelIce.position.set(30 + i * 12, 25.15, -60);
      panelIce.rotation.z = Math.PI / 6;
      scene.add(panelIce);
      baseObjects.push(panelIce);
    }
  };

  // Emergency light beacons
  var createBeacons = function() {
    var beaconPositions = [
      [0, 40, 0],
      [-50, 35, -50],
      [50, 35, 50],
      [80, 15, -20]
    ];

    for (var i = 0; i < beaconPositions.length; i++) {
      var pos = beaconPositions[i];
      var beaconGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      var beaconMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF4444,
        emissive: 0xFF0000,
        emissiveIntensity: 0.8,
        roughness: 0.4,
        metalness: 0.8
      });
      var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
      beacon.position.set(pos[0], pos[1], pos[2]);
      beacon.castShadow = true;
      scene.add(beacon);
      beacons.push({
        mesh: beacon,
        intensity: 0.8,
        phase: i * Math.PI / 2
      });
    }
  };

  // Frozen fuel tanker
  var createFuelTanker = function() {
    // Tank body
    var tankerGeometry = new THREE.CylinderGeometry(5, 5, 25, 16);
    var tankerMaterial = new THREE.MeshStandardMaterial({
      color: 0xDEB887,
      roughness: 0.6,
      metalness: 0.5
    });
    var tanker = new THREE.Mesh(tankerGeometry, tankerMaterial);
    tanker.position.set(-80, 5, 40);
    tanker.rotation.z = Math.PI / 4;
    tanker.castShadow = true;
    tanker.receiveShadow = true;
    scene.add(tanker);
    baseObjects.push(tanker);

    // Spilled fuel residue
    var spillGeometry = new THREE.BoxGeometry(15, 0.5, 8);
    var spillMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7500,
      roughness: 0.7,
      metalness: 0.3
    });
    var spill = new THREE.Mesh(spillGeometry, spillMaterial);
    spill.position.set(-85, 0.25, 48);
    spill.receiveShadow = true;
    scene.add(spill);
    baseObjects.push(spill);
  };

  // Collapsed antenna sections
  var createCollapsedAntenna = function() {
    for (var i = 0; i < 3; i++) {
      var sectionGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
      var sectionMaterial = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.7,
        metalness: 0.5
      });
      var section = new THREE.Mesh(sectionGeometry, sectionMaterial);
      section.position.set(30 + i * 20, 3, 70);
      section.rotation.z = Math.PI / 3;
      section.castShadow = true;
      section.receiveShadow = true;
      scene.add(section);
      baseObjects.push(section);
    }
  };

  // Ice crack patterns on ground
  var createIceCracks = function() {
    var crackGeometry = new THREE.BufferGeometry();
    var positions = [];

    // Create irregular crack pattern
    for (var i = 0; i < 20; i++) {
      var startX = (Math.random() - 0.5) * 300;
      var startZ = (Math.random() - 0.5) * 300;
      var endX = startX + (Math.random() - 0.5) * 80;
      var endZ = startZ + (Math.random() - 0.5) * 80;

      positions.push(startX, 0.01, startZ);
      positions.push(endX, 0.01, endZ);
    }

    crackGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var crackMaterial = new THREE.LineBasicMaterial({ color: 0x4A90E2, linewidth: 2 });
    var cracks = new THREE.LineSegments(crackGeometry, crackMaterial);
    scene.add(cracks);
    baseObjects.push(cracks);
  };

  // Initialize snow particles
  var initializeSnowParticles = function() {
    particles = [];
    for (var i = 0; i < 200; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.8,
        metalness: 0.1
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 400,
        Math.random() * 100 + 10,
        (Math.random() - 0.5) * 400
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        -Math.random() * 2 - 1,
        (Math.random() - 0.5) * 5
      );
      particle.age = 0;
      scene.add(particle);
      particles.push(particle);
    }
  };

  // Update function
  var update = function(delta) {
    animationTime += delta;

    // Update snow particles (blizzard effect)
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.position.add(p.velocity.clone().multiplyScalar(delta));
      p.age += delta;

      // Wrap around when particle falls or moves too far
      if (p.position.y < -5 || p.age > 30) {
        p.position.set(
          (Math.random() - 0.5) * 400,
          Math.random() * 100 + 50,
          (Math.random() - 0.5) * 400
        );
        p.age = 0;
      }

      // Bobbing motion
      p.position.y += Math.sin(animationTime * 2 + i) * delta * 0.5;
    }

    // Update emergency beacons (flash effect)
    for (var b = 0; b < beacons.length; b++) {
      var beacon = beacons[b];
      var pulse = Math.sin(animationTime * 3 + beacon.phase) * 0.5 + 0.5;
      beacon.mesh.material.emissiveIntensity = pulse * 1.2;
      beacon.mesh.scale.set(1 + pulse * 0.2, 1 + pulse * 0.2, 1 + pulse * 0.2);
    }

    // Update polar bear movement
    for (var bear_i = 0; bear_i < polarBears.length; bear_i++) {
      var bear = polarBears[bear_i];
      bear.time += delta;

      // Slow patrol movement
      var patrolAngle = bear.time * 0.2;
      var patrolRadius = 80;
      var newX = Math.cos(patrolAngle) * patrolRadius - 100;
      var newZ = Math.sin(patrolAngle) * patrolRadius + 100;

      // Update bear position
      for (var b_obj = 0; b_obj < bear.objects.length; b_obj++) {
        var offset = bear.objects[b_obj].position.clone().sub(bear.position);
        bear.objects[b_obj].position.set(
          newX + offset.x,
          offset.y,
          newZ + offset.z
        );
      }
      bear.position.set(newX, bear.position.y, newZ);

      // Slight head bobbing
      bear.objects[1].position.y += Math.sin(animationTime * 3) * 0.1;
    }

    // Snowdrift subtle sway
    for (var d = 0; d < snowdrifts.length; d++) {
      snowdrifts[d].position.y = 4 + Math.sin(animationTime * 0.5 + d) * 0.2;
    }
  };

  // Reset function
  var reset = function() {
    // Remove all base objects
    for (var i = 0; i < baseObjects.length; i++) {
      scene.remove(baseObjects[i]);
    }

    // Remove all particles
    for (var p = 0; p < particles.length; p++) {
      scene.remove(particles[p]);
    }

    // Remove all beacons
    for (var b = 0; b < beacons.length; b++) {
      scene.remove(beacons[b].mesh);
    }

    // Remove all polar bears
    for (var bear_i = 0; bear_i < polarBears.length; bear_i++) {
      for (var b_obj = 0; b_obj < polarBears[bear_i].objects.length; b_obj++) {
        scene.remove(polarBears[bear_i].objects[b_obj]);
      }
    }

    // Clear arrays
    baseObjects = [];
    particles = [];
    beacons = [];
    polarBears = [];
    snowdrifts = [];
    animationTime = 0;

    // Reinitialize
    init(scene, camera);
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
