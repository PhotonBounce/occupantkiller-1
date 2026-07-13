window.VaultRaid = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var laserBeams = [];
  var cameraTrack = null;
  var alarmLight = null;
  var sparkParticles = [];
  var laserTime = 0;
  var cameraTime = 0;
  var alarmTime = 0;
  var sparkTime = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    laserBeams = [];
    sparkParticles = [];
    laserTime = 0;
    cameraTime = 0;
    alarmTime = 0;
    sparkTime = 0;

    // Background color
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 150, 300);

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Main lobby floor - marble tiles
    createLobbyFloor();

    // Teller counters
    createTellerCounters();

    // Overhead chandeliers
    createChandeliers();

    // Security checkpoint with metal detector
    createSecurityCheckpoint();

    // Laser grid corridors
    createLaserGrid();

    // Armored vault door
    createVaultDoor();

    // Drill room with equipment
    createDrillRoom();

    // Gold bar storage room
    createGoldBarRoom();

    // Safe deposit boxes wall
    createSafeDepositWall();

    // Security camera with sweep
    createSecurityCamera();

    // Alarm siren
    createAlarmSiren();

    // Escape tunnel
    createEscapeTunnel();

    // Ceiling and walls
    createWallsAndCeiling();
  };

  var createLobbyFloor = function() {
    var tileSize = 10;
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.1, roughness: 0.8 });

    for (var x = -60; x < 60; x += tileSize) {
      for (var z = -60; z < 60; z += tileSize) {
        var alternateColor = ((Math.floor(x / tileSize) + Math.floor(z / tileSize)) % 2 === 0) ? 0xf5f5f5 : 0xe0e0e0;
        var tileMaterial = new THREE.MeshStandardMaterial({ color: alternateColor, metalness: 0.1, roughness: 0.8 });
        var tileGeometry = new THREE.BoxGeometry(tileSize, 0.5, tileSize);
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x + tileSize / 2, -0.25, z + tileSize / 2);
        tile.receiveShadow = true;
        tile.castShadow = true;
        scene.add(tile);
        objects.push(tile);
      }
    }
  };

  var createTellerCounters = function() {
    var counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.3, roughness: 0.6 });
    var counterPositions = [
      { x: -30, z: 10 },
      { x: -15, z: 10 },
      { x: 0, z: 10 },
      { x: 15, z: 10 },
      { x: 30, z: 10 }
    ];

    for (var i = 0; i < counterPositions.length; i++) {
      var pos = counterPositions[i];
      var counterGeometry = new THREE.BoxGeometry(8, 3, 2);
      var counter = new THREE.Mesh(counterGeometry, counterMaterial);
      counter.position.set(pos.x, 1.5, pos.z);
      counter.castShadow = true;
      counter.receiveShadow = true;
      scene.add(counter);
      objects.push(counter);

      // Desk front panel
      var panelGeometry = new THREE.BoxGeometry(8, 0.8, 0.3);
      var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.5, roughness: 0.5 });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, 3.5, pos.z - 1.2);
      panel.castShadow = true;
      scene.add(panel);
      objects.push(panel);
    }
  };

  var createChandeliers = function() {
    var chandelierPositions = [
      { x: -40, z: -30 },
      { x: 0, z: -30 },
      { x: 40, z: -30 },
      { x: -40, z: 20 },
      { x: 0, z: 20 },
      { x: 40, z: 20 }
    ];

    for (var i = 0; i < chandelierPositions.length; i++) {
      var pos = chandelierPositions[i];
      var crystalMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffff99 });

      // Main chandelier sphere
      var mainGeometry = new THREE.SphereGeometry(2, 12, 12);
      var main = new THREE.Mesh(mainGeometry, crystalMaterial);
      main.position.set(pos.x, 28, pos.z);
      main.castShadow = true;
      scene.add(main);
      objects.push(main);

      // Crystal clusters hanging down
      for (var j = 0; j < 8; j++) {
        var angle = (j / 8) * Math.PI * 2;
        var offsetX = Math.cos(angle) * 3;
        var offsetZ = Math.sin(angle) * 3;

        var crystalGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        var crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.set(pos.x + offsetX, 24, pos.z + offsetZ);
        crystal.castShadow = true;
        scene.add(crystal);
        objects.push(crystal);
      }
    }
  };

  var createSecurityCheckpoint = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.9, roughness: 0.3 });

    // Metal detector frame - tall arch
    var archGeometry = new THREE.BoxGeometry(6, 0.8, 0.5);
    var topArch = new THREE.Mesh(archGeometry, metalMaterial);
    topArch.position.set(0, 3.5, 35);
    topArch.castShadow = true;
    scene.add(topArch);
    objects.push(topArch);

    var sideGeometry = new THREE.BoxGeometry(0.8, 3, 0.5);
    var leftSide = new THREE.Mesh(sideGeometry, metalMaterial);
    leftSide.position.set(-3, 1.5, 35);
    leftSide.castShadow = true;
    scene.add(leftSide);
    objects.push(leftSide);

    var rightSide = new THREE.Mesh(sideGeometry, metalMaterial);
    rightSide.position.set(3, 1.5, 35);
    rightSide.castShadow = true;
    scene.add(rightSide);
    objects.push(rightSide);

    // Guard booths on sides
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.5, roughness: 0.5 });
    var boothGeometry = new THREE.BoxGeometry(4, 3, 4);

    var leftBooth = new THREE.Mesh(boothGeometry, boothMaterial);
    leftBooth.position.set(-8, 1.5, 35);
    leftBooth.castShadow = true;
    scene.add(leftBooth);
    objects.push(leftBooth);

    var rightBooth = new THREE.Mesh(boothGeometry, boothMaterial);
    rightBooth.position.set(8, 1.5, 35);
    rightBooth.castShadow = true;
    scene.add(rightBooth);
    objects.push(rightBooth);

    // Window panels on booths
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4488cc, metalness: 0.2, roughness: 0.8 });
    var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.3);

    var leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(-8, 2, 37);
    scene.add(leftWindow);
    objects.push(leftWindow);

    var rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(8, 2, 37);
    scene.add(rightWindow);
    objects.push(rightWindow);
  };

  var createLaserGrid = function() {
    var laserMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });

    // Horizontal lasers at different heights
    var heights = [0.5, 1.2, 2.0];
    var corridorLength = 40;

    for (var h = 0; h < heights.length; h++) {
      var height = heights[h];

      // Left corridor
      for (var i = 0; i < 6; i++) {
        var points = [
          new THREE.Vector3(-45 + i * 2, height, 0),
          new THREE.Vector3(-45 + i * 2, height, corridorLength)
        ];
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var beam = new THREE.LineSegments(geometry, laserMaterial);
        scene.add(beam);
        laserBeams.push({ beam: beam, axis: 'z' });
      }

      // Right corridor
      for (var i = 0; i < 6; i++) {
        var points = [
          new THREE.Vector3(45 - i * 2, height, 0),
          new THREE.Vector3(45 - i * 2, height, corridorLength)
        ];
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var beam = new THREE.LineSegments(geometry, laserMaterial);
        scene.add(beam);
        laserBeams.push({ beam: beam, axis: 'z' });
      }

      // Crossing beams
      for (var i = 0; i < 4; i++) {
        var points = [
          new THREE.Vector3(-45, height, 10 + i * 5),
          new THREE.Vector3(-20, height, 10 + i * 5)
        ];
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var beam = new THREE.LineSegments(geometry, laserMaterial);
        scene.add(beam);
        laserBeams.push({ beam: beam, axis: 'x' });
      }
    }
  };

  var createVaultDoor = function() {
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.95, roughness: 0.1 });

    // Main circular door frame
    var frameGeometry = new THREE.BoxGeometry(12, 12, 1.5);
    var frame = new THREE.Mesh(frameGeometry, doorMaterial);
    frame.position.set(0, 6, -50);
    frame.castShadow = true;
    scene.add(frame);
    objects.push(frame);

    // Outer ring accent
    var ringGeometry = new THREE.BoxGeometry(14, 14, 0.5);
    var ringMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.3 });
    var ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 6, -51);
    ring.castShadow = true;
    scene.add(ring);
    objects.push(ring);

    // Locking wheel with spokes (LineSegments)
    var spokeMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 3 });
    var spokes = 8;
    for (var i = 0; i < spokes; i++) {
      var angle = (i / spokes) * Math.PI * 2;
      var x = Math.cos(angle) * 3;
      var z = Math.sin(angle) * 3;
      var points = [
        new THREE.Vector3(0, 6, -50),
        new THREE.Vector3(x, 6, -50 + z)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var spoke = new THREE.LineSegments(geometry, spokeMaterial);
      scene.add(spoke);
      cameraTrack = spoke;
    }

    // Decorative bolts around frame
    var boltMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.9, roughness: 0.2 });
    var boltGeometry = new THREE.SphereGeometry(0.3, 8, 8);

    var boltPositions = [
      { x: -6, y: 12 }, { x: 6, y: 12 },
      { x: -6, y: 0 }, { x: 6, y: 0 },
      { x: 0, y: 12 }, { x: 0, y: 0 }
    ];

    for (var i = 0; i < boltPositions.length; i++) {
      var pos = boltPositions[i];
      var bolt = new THREE.Mesh(boltGeometry, boltMaterial);
      bolt.position.set(pos.x, pos.y, -50);
      bolt.castShadow = true;
      scene.add(bolt);
      objects.push(bolt);
    }
  };

  var createDrillRoom = function() {
    var drillMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });

    // Cutting torch equipment - cylinder
    var torchGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
    var torch = new THREE.Mesh(torchGeometry, drillMaterial);
    torch.position.set(-35, 2, -20);
    torch.rotation.z = Math.PI / 4;
    torch.castShadow = true;
    scene.add(torch);
    objects.push(torch);

    // Torch nozzle
    var nozzleGeometry = new THREE.CylinderGeometry(0.2, 0.1, 1, 12);
    var nozzle = new THREE.Mesh(nozzleGeometry, drillMaterial);
    nozzle.position.set(-35, 4, -20);
    nozzle.castShadow = true;
    scene.add(nozzle);
    objects.push(nozzle);

    // Equipment table
    var tableGeometry = new THREE.BoxGeometry(8, 3, 4);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.5 });
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-35, 1.5, -15);
    table.castShadow = true;
    scene.add(table);
    objects.push(table);

    // Spark generator for visual effect
    var sparkSource = { x: -35, y: 4, z: -20 };
    for (var i = 0; i < 4; i++) {
      var sparkParticle = {
        position: new THREE.Vector3(sparkSource.x, sparkSource.y, sparkSource.z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 5,
          (Math.random() - 0.5) * 8
        ),
        life: 0,
        maxLife: 0.5
      };
      sparkParticles.push(sparkParticle);
    }
  };

  var createGoldBarRoom = function() {
    var goldMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.3, emissive: 0xffaa00 });
    var barGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.6);

    // Create stacks of gold bars
    var rows = 5;
    var cols = 6;
    var depth = 3;

    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        for (var k = 0; k < depth; k++) {
          var bar = new THREE.Mesh(barGeometry, goldMaterial);
          bar.position.set(
            -40 + i * 2,
            1 + k * 1,
            -45 + j * 2
          );
          bar.castShadow = true;
          bar.receiveShadow = true;
          scene.add(bar);
          objects.push(bar);
        }
      }
    }
  };

  var createSafeDepositWall = function() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.5, roughness: 0.6 });
    var wallGeometry = new THREE.BoxGeometry(20, 12, 1);
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(40, 6, 0);
    wall.receiveShadow = true;
    scene.add(wall);
    objects.push(wall);

    // Safe deposit boxes - cylinders
    var boxMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.3 });
    var boxGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);

    var rows = 6;
    var cols = 8;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(
          30 + col * 1.3,
          2 + row * 1.8,
          0.8
        );
        box.rotation.z = Math.PI / 2;
        box.castShadow = true;
        scene.add(box);
        objects.push(box);
      }
    }
  };

  var createSecurityCamera = function() {
    var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
    var lensColor = 0x222222;
    var lensMaterial = new THREE.MeshStandardMaterial({ color: lensColor, metalness: 0.9, roughness: 0.1 });

    // Camera body
    var bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    var body = new THREE.Mesh(bodyGeometry, cameraMaterial);
    body.position.set(25, 25, -30);
    body.castShadow = true;
    scene.add(body);
    objects.push(body);

    // Mounting bracket
    var bracketGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
    var bracket = new THREE.Mesh(bracketGeometry, cameraMaterial);
    bracket.position.set(25, 18, -30);
    bracket.castShadow = true;
    scene.add(bracket);
    objects.push(bracket);

    // Lens - cylinder
    var lensGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(25, 25, -29.5);
    lens.rotation.z = Math.PI / 2;
    lens.castShadow = true;
    scene.add(lens);
    cameraTrack = lens;
  };

  var createAlarmSiren = function() {
    var sirenMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });

    // Siren body - cylinder
    var bodyGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
    var body = new THREE.Mesh(bodyGeometry, sirenMaterial);
    body.position.set(-25, 28, 40);
    body.castShadow = true;
    scene.add(body);
    objects.push(body);

    // Red light on top - sphere
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.9, roughness: 0.3, emissive: 0xff0000 });
    var lightGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    alarmLight = new THREE.Mesh(lightGeometry, lightMaterial);
    alarmLight.position.set(-25, 30, 40);
    alarmLight.castShadow = true;
    scene.add(alarmLight);
    objects.push(alarmLight);
  };

  var createEscapeTunnel = function() {
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.2, roughness: 0.9 });

    // Tunnel walls and ceiling
    var tunnelLength = 60;
    var tunnelWidth = 5;
    var tunnelHeight = 4;

    // Floor
    var floorGeometry = new THREE.BoxGeometry(tunnelWidth, 0.5, tunnelLength);
    var floor = new THREE.Mesh(floorGeometry, concreteMaterial);
    floor.position.set(0, -1, -85);
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // Left wall
    var leftGeometry = new THREE.BoxGeometry(0.5, tunnelHeight, tunnelLength);
    var leftWall = new THREE.Mesh(leftGeometry, concreteMaterial);
    leftWall.position.set(-2.75, tunnelHeight / 2, -85);
    leftWall.castShadow = true;
    scene.add(leftWall);
    objects.push(leftWall);

    // Right wall
    var rightGeometry = new THREE.BoxGeometry(0.5, tunnelHeight, tunnelLength);
    var rightWall = new THREE.Mesh(rightGeometry, concreteMaterial);
    rightWall.position.set(2.75, tunnelHeight / 2, -85);
    rightWall.castShadow = true;
    scene.add(rightWall);
    objects.push(rightWall);

    // Ceiling
    var ceilingGeometry = new THREE.BoxGeometry(tunnelWidth, 0.5, tunnelLength);
    var ceiling = new THREE.Mesh(ceilingGeometry, concreteMaterial);
    ceiling.position.set(0, tunnelHeight, -85);
    ceiling.castShadow = true;
    scene.add(ceiling);
    objects.push(ceiling);

    // Debris rocks scattered
    var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.1, roughness: 0.9 });
    var debrisGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);

    for (var i = 0; i < 12; i++) {
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        (Math.random() - 0.5) * 3,
        0.5,
        -60 - i * 3
      );
      debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      debris.castShadow = true;
      scene.add(debris);
      objects.push(debris);
    }
  };

  var createWallsAndCeiling = function() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.2, roughness: 0.8 });

    // Ceiling
    var ceilingGeometry = new THREE.BoxGeometry(120, 1, 120);
    var ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.position.set(0, 30, -20);
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    objects.push(ceiling);

    // Back wall
    var backWallGeometry = new THREE.BoxGeometry(120, 30, 1);
    var backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 15, -60);
    backWall.receiveShadow = true;
    scene.add(backWall);
    objects.push(backWall);

    // Left wall
    var leftWallGeometry = new THREE.BoxGeometry(1, 30, 120);
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-60, 15, -20);
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    objects.push(leftWall);

    // Right wall
    var rightWallGeometry = new THREE.BoxGeometry(1, 30, 120);
    var rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(60, 15, -20);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    objects.push(rightWall);
  };

  var update = function(delta) {
    laserTime += delta;
    cameraTime += delta;
    alarmTime += delta;
    sparkTime += delta;

    // Animate laser scan pattern - pulsing opacity
    var laserIntensity = Math.sin(laserTime * 3) * 0.5 + 0.5;
    for (var i = 0; i < laserBeams.length; i++) {
      laserBeams[i].beam.material.opacity = 0.3 + laserIntensity * 0.7;
    }

    // Animate security camera sweep
    if (cameraTrack) {
      var sweepAngle = Math.sin(cameraTime * 1.5) * 0.6;
      if (cameraTrack.rotation) {
        cameraTrack.rotation.y = sweepAngle;
      }
    }

    // Pulse alarm light
    if (alarmLight) {
      var alarmIntensity = Math.sin(alarmTime * 8) * 0.5 + 0.7;
      alarmLight.material.emissive.setHex(0xff0000);
      alarmLight.material.emissiveIntensity = alarmIntensity;
    }

    // Update and remove spark particles
    for (var i = sparkParticles.length - 1; i >= 0; i--) {
      var spark = sparkParticles[i];
      spark.life += delta;
      spark.velocity.y -= 9.8 * delta;

      spark.position.x += spark.velocity.x * delta;
      spark.position.y += spark.velocity.y * delta;
      spark.position.z += spark.velocity.z * delta;

      if (spark.life >= spark.maxLife) {
        sparkParticles.splice(i, 1);
      }
    }

    // Generate new sparks periodically
    if (sparkTime > 0.1) {
      sparkTime = 0;
      for (var i = 0; i < 2; i++) {
        var sparkParticle = {
          position: new THREE.Vector3(-35, 4, -20),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 8
          ),
          life: 0,
          maxLife: 0.5
        };
        sparkParticles.push(sparkParticle);
      }
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (var i = laserBeams.length - 1; i >= 0; i--) {
      scene.remove(laserBeams[i].beam);
    }
    for (var i = sparkParticles.length - 1; i >= 0; i--) {
      sparkParticles.splice(i, 1);
    }
    objects = [];
    laserBeams = [];
    sparkParticles = [];
    laserTime = 0;
    cameraTime = 0;
    alarmTime = 0;
    sparkTime = 0;
    cameraTrack = null;
    alarmLight = null;
    scene = null;
    camera = null;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
