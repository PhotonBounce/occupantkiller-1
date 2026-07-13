window.BattleArena = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var arenaGroup = null;
  var floodlights = [];
  var scoreboardPixels = [];
  var respawnPads = [];
  var time = 0;

  var ARENA_SIZE = 80;
  var HALF_ARENA = ARENA_SIZE / 2;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    arenaGroup = new THREE.Group();
    scene.add(arenaGroup);

    createCentralCombatZone();
    createMultiLevelStructure();
    createSniperTowers();
    createClaymoreMineFields();
    createAmmoResupplyStations();
    createObstacleCourse();
    createVehicleCombatLane();
    createSpectatorGallery();
    createFloodlights();
    createCountdownScoreboard();
    createWaterHazard();
    createMedicBunker();
    createRespawnPads();
  }

  function createCentralCombatZone() {
    var floorGeometry = new THREE.BoxGeometry(ARENA_SIZE, 1, ARENA_SIZE);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    arenaGroup.add(floor);

    // Concrete wall cover - north
    var wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(20, 4, 2),
      new THREE.MeshPhongMaterial({ color: 0x808080 })
    );
    wallNorth.position.set(0, 2, -30);
    wallNorth.receiveShadow = true;
    wallNorth.castShadow = true;
    arenaGroup.add(wallNorth);

    // Concrete wall cover - south
    var wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(20, 4, 2),
      new THREE.MeshPhongMaterial({ color: 0x808080 })
    );
    wallSouth.position.set(0, 2, 30);
    wallSouth.receiveShadow = true;
    wallSouth.castShadow = true;
    arenaGroup.add(wallSouth);

    // Concrete wall cover - east
    var wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 20),
      new THREE.MeshPhongMaterial({ color: 0x808080 })
    );
    wallEast.position.set(30, 2, 0);
    wallEast.receiveShadow = true;
    wallEast.castShadow = true;
    arenaGroup.add(wallEast);

    // Concrete wall cover - west
    var wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 20),
      new THREE.MeshPhongMaterial({ color: 0x808080 })
    );
    wallWest.position.set(-30, 2, 0);
    wallWest.receiveShadow = true;
    wallWest.castShadow = true;
    arenaGroup.add(wallWest);

    // Destroyed vehicles - tank wrecks
    for (var i = 0; i < 3; i++) {
      var tankBody = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 10),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
      );
      tankBody.position.set(-15 + i * 15, 1.5, -20);
      tankBody.receiveShadow = true;
      tankBody.castShadow = true;
      arenaGroup.add(tankBody);

      var tankTurret = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 2, 8),
        new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
      );
      tankTurret.position.set(-15 + i * 15, 3, -20);
      tankTurret.receiveShadow = true;
      tankTurret.castShadow = true;
      arenaGroup.add(tankTurret);
    }

    // Small cover blocks scattered
    for (var j = 0; j < 8; j++) {
      var blockX = (Math.random() - 0.5) * 50;
      var blockZ = (Math.random() - 0.5) * 50;
      if (Math.abs(blockX) < 10 && Math.abs(blockZ) < 10) continue;

      var coverBlock = new THREE.Mesh(
        new THREE.BoxGeometry(3, 2, 3),
        new THREE.MeshPhongMaterial({ color: 0x696969 })
      );
      coverBlock.position.set(blockX, 1, blockZ);
      coverBlock.receiveShadow = true;
      coverBlock.castShadow = true;
      arenaGroup.add(coverBlock);
    }
  }

  function createMultiLevelStructure() {
    // Platform 1 - North platform
    var platform1 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    platform1.position.set(-25, 5, -25);
    platform1.receiveShadow = true;
    arenaGroup.add(platform1);

    // Platform 2 - South platform
    var platform2 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    platform2.position.set(25, 5, 25);
    platform2.receiveShadow = true;
    arenaGroup.add(platform2);

    // Platform 3 - East platform
    var platform3 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    platform3.position.set(25, 3, -25);
    platform3.receiveShadow = true;
    arenaGroup.add(platform3);

    // Platform 4 - West platform
    var platform4 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    platform4.position.set(-25, 3, 25);
    platform4.receiveShadow = true;
    arenaGroup.add(platform4);

    // Ramps connecting platforms
    var ramp1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 10),
      new THREE.MeshPhongMaterial({ color: 0x707070 })
    );
    ramp1.position.set(-22, 5.25, -15);
    ramp1.rotation.z = 0.3;
    ramp1.receiveShadow = true;
    arenaGroup.add(ramp1);

    var ramp2 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 10),
      new THREE.MeshPhongMaterial({ color: 0x707070 })
    );
    ramp2.position.set(22, 4.25, 15);
    ramp2.rotation.z = -0.3;
    ramp2.receiveShadow = true;
    arenaGroup.add(ramp2);

    var ramp3 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.5, 3),
      new THREE.MeshPhongMaterial({ color: 0x707070 })
    );
    ramp3.position.set(5, 4, -22);
    ramp3.rotation.x = 0.25;
    ramp3.receiveShadow = true;
    arenaGroup.add(ramp3);

    // Support pillars
    for (var i = 0; i < 4; i++) {
      var pillarPositions = [
        [-25, 2.5, -25],
        [25, 2.5, 25],
        [25, 1.5, -25],
        [-25, 1.5, 25]
      ];
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 5, 8),
        new THREE.MeshPhongMaterial({ color: 0x606060 })
      );
      pillar.position.set(pillarPositions[i][0], pillarPositions[i][1], pillarPositions[i][2]);
      pillar.receiveShadow = true;
      pillar.castShadow = true;
      arenaGroup.add(pillar);
    }
  }

  function createSniperTowers() {
    var towerPositions = [
      [-35, 0, -35],
      [35, 0, -35],
      [35, 0, 35],
      [-35, 0, 35]
    ];

    for (var t = 0; t < 4; t++) {
      var pos = towerPositions[t];

      // Tower base
      var towerBase = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1, 8),
        new THREE.MeshPhongMaterial({ color: 0x333333 })
      );
      towerBase.position.set(pos[0], 0.5, pos[2]);
      towerBase.receiveShadow = true;
      arenaGroup.add(towerBase);

      // Tower shaft
      var towerShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 20, 8),
        new THREE.MeshPhongMaterial({ color: 0x404040 })
      );
      towerShaft.position.set(pos[0], 10, pos[2]);
      towerShaft.receiveShadow = true;
      towerShaft.castShadow = true;
      arenaGroup.add(towerShaft);

      // Sniper platform
      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 10),
        new THREE.MeshPhongMaterial({ color: 0x555555 })
      );
      platform.position.set(pos[0], 20, pos[2]);
      platform.receiveShadow = true;
      platform.castShadow = true;
      arenaGroup.add(platform);

      // Guard rail
      var railing = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1.5, 0.5),
        new THREE.MeshPhongMaterial({ color: 0x606060 })
      );
      railing.position.set(pos[0], 20.75, pos[2] + 4.75);
      railing.receiveShadow = true;
      arenaGroup.add(railing);
    }
  }

  function createClaymoreMineFields() {
    // Mine field 1 - North section
    for (var i = 0; i < 12; i++) {
      var mine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6),
        new THREE.MeshPhongMaterial({ color: 0xffff00 })
      );
      mine.position.set(-20 + i * 3, 0.2, -35);
      mine.receiveShadow = true;
      arenaGroup.add(mine);
    }

    // Mine field 2 - East section
    for (var j = 0; j < 10; j++) {
      var mine2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6),
        new THREE.MeshPhongMaterial({ color: 0xffff00 })
      );
      mine2.position.set(35, 0.2, -20 + j * 4);
      mine2.receiveShadow = true;
      arenaGroup.add(mine2);
    }

    // Mine field 3 - South section
    for (var k = 0; k < 12; k++) {
      var mine3 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6),
        new THREE.MeshPhongMaterial({ color: 0xffff00 })
      );
      mine3.position.set(-20 + k * 3, 0.2, 35);
      mine3.receiveShadow = true;
      arenaGroup.add(mine3);
    }

    // Mine field 4 - West section
    for (var l = 0; l < 10; l++) {
      var mine4 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.8, 0.3, 6),
        new THREE.MeshPhongMaterial({ color: 0xffff00 })
      );
      mine4.position.set(-35, 0.2, -20 + l * 4);
      mine4.receiveShadow = true;
      arenaGroup.add(mine4);
    }
  }

  function createAmmoResupplyStations() {
    var stationPositions = [
      [-20, 0, 0],
      [20, 0, 0],
      [0, 0, -20],
      [0, 0, 20]
    ];

    for (var s = 0; s < 4; s++) {
      var pos = stationPositions[s];

      // Crate stack 1
      for (var i = 0; i < 3; i++) {
        var crate = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 3),
          new THREE.MeshPhongMaterial({ color: 0xc0c000 })
        );
        crate.position.set(pos[0] - 3, 1.5 + i * 3, pos[2] - 3);
        crate.receiveShadow = true;
        crate.castShadow = true;
        arenaGroup.add(crate);
      }

      // Crate stack 2
      for (var j = 0; j < 3; j++) {
        var crate2 = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 3),
          new THREE.MeshPhongMaterial({ color: 0xc0c000 })
        );
        crate2.position.set(pos[0] + 3, 1.5 + j * 3, pos[2] + 3);
        crate2.receiveShadow = true;
        crate2.castShadow = true;
        arenaGroup.add(crate2);
      }

      // Crate stack 3
      for (var k = 0; k < 2; k++) {
        var crate3 = new THREE.Mesh(
          new THREE.BoxGeometry(3, 3, 3),
          new THREE.MeshPhongMaterial({ color: 0xc0c000 })
        );
        crate3.position.set(pos[0], 1.5 + k * 3, pos[2]);
        crate3.receiveShadow = true;
        crate3.castShadow = true;
        arenaGroup.add(crate3);
      }
    }
  }

  function createObstacleCourse() {
    // Maze configuration
    var walls = [
      { pos: [-10, 2, 10], size: [15, 4, 2] },
      { pos: [10, 2, 10], size: [15, 4, 2] },
      { pos: [-10, 2, -10], size: [15, 4, 2] },
      { pos: [10, 2, -10], size: [15, 4, 2] },
      { pos: [0, 2, 5], size: [2, 4, 10] },
      { pos: [0, 2, -5], size: [2, 4, 10] },
      { pos: [-5, 2, 0], size: [10, 4, 2] },
      { pos: [5, 2, 0], size: [10, 4, 2] },
      { pos: [-15, 2, 15], size: [4, 3, 4] },
      { pos: [15, 2, 15], size: [4, 3, 4] },
      { pos: [-15, 2, -15], size: [4, 3, 4] },
      { pos: [15, 2, -15], size: [4, 3, 4] }
    ];

    for (var w = 0; w < walls.length; w++) {
      var wallData = walls[w];
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(wallData.size[0], wallData.size[1], wallData.size[2]),
        new THREE.MeshPhongMaterial({ color: 0x696969 })
      );
      wall.position.set(wallData.pos[0], wallData.pos[1], wallData.pos[2]);
      wall.receiveShadow = true;
      wall.castShadow = true;
      arenaGroup.add(wall);
    }
  }

  function createVehicleCombatLane() {
    // Combat lane ground
    var lane = new THREE.Mesh(
      new THREE.BoxGeometry(40, 0.5, 10),
      new THREE.MeshPhongMaterial({ color: 0x5a5a5a })
    );
    lane.position.set(0, 0.25, 15);
    lane.receiveShadow = true;
    arenaGroup.add(lane);

    // Destroyed tanks
    for (var t = 0; t < 3; t++) {
      var tankBody = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 10),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
      );
      tankBody.position.set(-12 + t * 12, 1.5, 15);
      tankBody.receiveShadow = true;
      tankBody.castShadow = true;
      arenaGroup.add(tankBody);

      var turret = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 2, 8),
        new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
      );
      turret.position.set(-12 + t * 12, 3, 15);
      turret.receiveShadow = true;
      turret.castShadow = true;
      arenaGroup.add(turret);
    }

    // Barriers along lane
    for (var b = 0; b < 8; b++) {
      var barrier = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 10),
        new THREE.MeshPhongMaterial({ color: 0xffa500 })
      );
      barrier.position.set(-16 + b * 5, 1, 15);
      barrier.receiveShadow = true;
      barrier.castShadow = true;
      arenaGroup.add(barrier);
    }
  }

  function createSpectatorGallery() {
    // North bleachers
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 12; col++) {
        var bench = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1, 1.5),
          new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        bench.position.set(-12 + col * 2, 0.5 + row * 1.2, -38 - row * 2);
        bench.receiveShadow = true;
        arenaGroup.add(bench);
      }
    }

    // South bleachers
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 12; c++) {
        var bench2 = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1, 1.5),
          new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        bench2.position.set(-12 + c * 2, 0.5 + r * 1.2, 38 + r * 2);
        bench2.receiveShadow = true;
        arenaGroup.add(bench2);
      }
    }

    // East bleachers
    for (var re = 0; re < 3; re++) {
      for (var ce = 0; ce < 10; ce++) {
        var bench3 = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1, 2),
          new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        bench3.position.set(38 + re * 2, 0.5 + re * 1.2, -10 + ce * 2);
        bench3.receiveShadow = true;
        arenaGroup.add(bench3);
      }
    }

    // West bleachers
    for (var rw = 0; rw < 3; rw++) {
      for (var cw = 0; cw < 10; cw++) {
        var bench4 = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1, 2),
          new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
        bench4.position.set(-38 - rw * 2, 0.5 + rw * 1.2, -10 + cw * 2);
        bench4.receiveShadow = true;
        arenaGroup.add(bench4);
      }
    }
  }

  function createFloodlights() {
    var lightPositions = [
      [-30, 0, -30],
      [30, 0, -30],
      [30, 0, 30],
      [-30, 0, 30]
    ];

    for (var l = 0; l < 4; l++) {
      var pos = lightPositions[l];

      // Light pole
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 25, 8),
        new THREE.MeshPhongMaterial({ color: 0x505050 })
      );
      pole.position.set(pos[0], 12.5, pos[2]);
      pole.receiveShadow = true;
      pole.castShadow = true;
      arenaGroup.add(pole);

      // Light head sphere
      var lightHead = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 8),
        new THREE.MeshPhongMaterial({
          color: 0xffff99,
          emissive: 0xffff00,
          emissiveIntensity: 0.3
        })
      );
      lightHead.position.set(pos[0], 25, pos[2]);
      lightHead.receiveShadow = true;
      lightHead.castShadow = true;
      arenaGroup.add(lightHead);

      floodlights.push({
        head: lightHead,
        pole: pole,
        basePos: pos,
        sweepAngle: l * Math.PI / 2
      });
    }
  }

  function createCountdownScoreboard() {
    // Main board backing
    var boardBack = new THREE.Mesh(
      new THREE.BoxGeometry(20, 12, 2),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    boardBack.position.set(0, 15, 40);
    boardBack.receiveShadow = true;
    arenaGroup.add(boardBack);

    // Score display - create pixel grid
    for (var row = 0; row < 8; row++) {
      for (var col = 0; col < 12; col++) {
        var pixel = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 1.4, 0.2),
          new THREE.MeshPhongMaterial({ color: 0x00ff00 })
        );
        pixel.position.set(-10 + col * 1.8, 12 - row * 1.8, 41);
        pixel.receiveShadow = true;
        arenaGroup.add(pixel);
        scoreboardPixels.push(pixel);
      }
    }

    // Scoreboard frame
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(22, 14, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x606060 })
    );
    frame.position.set(0, 15, 39.75);
    frame.receiveShadow = true;
    arenaGroup.add(frame);
  }

  function createWaterHazard() {
    // Trench walls
    var trenchWallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 1),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    trenchWallNorth.position.set(0, 1.5, -8);
    trenchWallNorth.receiveShadow = true;
    arenaGroup.add(trenchWallNorth);

    var trenchWallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 1),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    trenchWallSouth.position.set(0, 1.5, 8);
    trenchWallSouth.receiveShadow = true;
    arenaGroup.add(trenchWallSouth);

    // Water - dark blue material
    var waterGeometry = new THREE.BoxGeometry(20, 2, 16);
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x001a4d,
      emissive: 0x000033,
      transparent: true,
      opacity: 0.7
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 1, 0);
    water.receiveShadow = true;
    arenaGroup.add(water);
  }

  function createMedicBunker() {
    // Bunker main structure
    var bunkerMain = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 12),
      new THREE.MeshPhongMaterial({ color: 0x8b0000 })
    );
    bunkerMain.position.set(-35, 3, 0);
    bunkerMain.receiveShadow = true;
    bunkerMain.castShadow = true;
    arenaGroup.add(bunkerMain);

    // Bunker roof
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1, 12),
      new THREE.MeshPhongMaterial({ color: 0x6b0000 })
    );
    roof.position.set(-35, 6.5, 0);
    roof.receiveShadow = true;
    arenaGroup.add(roof);

    // Red cross marker - vertical
    var crossVertical = new THREE.Mesh(
      new THREE.BoxGeometry(1, 4, 0.5),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    crossVertical.position.set(-35, 7, 0);
    crossVertical.receiveShadow = true;
    arenaGroup.add(crossVertical);

    // Red cross marker - horizontal
    var crossHorizontal = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 0.5),
      new THREE.MeshPhongMaterial({ color: 0xff0000 })
    );
    crossHorizontal.position.set(-35, 7, 0);
    crossHorizontal.receiveShadow = true;
    arenaGroup.add(crossHorizontal);

    // Interior pillars
    for (var p = 0; p < 4; p++) {
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 5, 6),
        new THREE.MeshPhongMaterial({ color: 0xa00000 })
      );
      pillar.position.set(-38 + p * 2, 2.5, -2 + p * 1.5);
      pillar.receiveShadow = true;
      pillar.castShadow = true;
      arenaGroup.add(pillar);
    }
  }

  function createRespawnPads() {
    // Blue team respawn area - north
    var blueBase = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.5, 15),
      new THREE.MeshPhongMaterial({
        color: 0x0066ff,
        emissive: 0x0033ff,
        emissiveIntensity: 0.2
      })
    );
    blueBase.position.set(-30, 0.3, -40);
    blueBase.receiveShadow = true;
    arenaGroup.add(blueBase);

    // Blue respawn pads
    for (var b = 0; b < 4; b++) {
      var bluePad = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 3),
        new THREE.MeshPhongMaterial({
          color: 0x0099ff,
          emissive: 0x0055ff,
          emissiveIntensity: 0.4
        })
      );
      bluePad.position.set(-28 + b * 5, 0.4, -38 + (b % 2) * 5);
      bluePad.receiveShadow = true;
      bluePad.castShadow = true;
      arenaGroup.add(bluePad);
      respawnPads.push({
        mesh: bluePad,
        team: 'blue',
        baseScale: 1,
        pulsePhase: b * Math.PI / 2
      });
    }

    // Red team respawn area - south
    var redBase = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.5, 15),
      new THREE.MeshPhongMaterial({
        color: 0xff0033,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
      })
    );
    redBase.position.set(30, 0.3, 40);
    redBase.receiveShadow = true;
    arenaGroup.add(redBase);

    // Red respawn pads
    for (var r = 0; r < 4; r++) {
      var redPad = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.8, 3),
        new THREE.MeshPhongMaterial({
          color: 0xff3366,
          emissive: 0xff0000,
          emissiveIntensity: 0.4
        })
      );
      redPad.position.set(28 + r * 5, 0.4, 38 + (r % 2) * 5);
      redPad.receiveShadow = true;
      redPad.castShadow = true;
      arenaGroup.add(redPad);
      respawnPads.push({
        mesh: redPad,
        team: 'red',
        baseScale: 1,
        pulsePhase: r * Math.PI / 2
      });
    }
  }

  function update(delta) {
    time += delta;

    // Animate floodlights sweeping
    for (var l = 0; l < floodlights.length; l++) {
      var light = floodlights[l];
      var sweepAngle = light.sweepAngle + time * 0.5;
      var radius = 15;

      light.head.position.x = light.basePos[0] + Math.cos(sweepAngle) * radius;
      light.head.position.z = light.basePos[2] + Math.sin(sweepAngle) * radius;
    }

    // Animate scoreboard pixels
    for (var p = 0; p < scoreboardPixels.length; p++) {
      var pixel = scoreboardPixels[p];
      var pixelBrightness = Math.sin(time * 2 + p * 0.1) * 0.5 + 0.5;
      pixel.material.color.setHSL(0.33, 1, pixelBrightness * 0.7);
    }

    // Pulse respawn pads
    for (var r = 0; r < respawnPads.length; r++) {
      var pad = respawnPads[r];
      var pulse = Math.sin(time * 3 + pad.pulsePhase) * 0.3 + 1;
      pad.mesh.scale.set(pulse, 1, pulse);

      var pulseIntensity = Math.sin(time * 3 + pad.pulsePhase) * 0.3 + 0.4;
      pad.mesh.material.emissiveIntensity = pulseIntensity;
    }
  }

  function reset() {
    if (arenaGroup) {
      scene.remove(arenaGroup);
      arenaGroup = null;
    }
    floodlights = [];
    scoreboardPixels = [];
    respawnPads = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
