window.FortressRuins = (function() {
  'use strict';

  var sceneReference = null;
  var cameraReference = null;
  var fortressObjects = [];
  var animatedObjects = [];
  var flagObject = null;
  var searchLightGroup = null;

  var colors = {
    stoneGray: 0x7a7a7a,
    darkStoneGray: 0x555555,
    lightStoneGray: 0x999999,
    mossyGreen: 0x6b8e23,
    khaki: 0xc3b091,
    darkKhaki: 0xa89968,
    rust: 0x8b4513,
    metalGray: 0x808080,
    darkMetal: 0x505050,
    bloodRed: 0x8b0000,
    sandColor: 0xd4a574,
    blackMetal: 0x1a1a1a
  };

  function addObjectToScene(object) {
    sceneReference.add(object);
    fortressObjects.push(object);
  }

  function createOuterCurtainWalls() {
    var wallHeight = 12;
    var wallThickness = 1.5;
    var wallLength = 75;

    // North wall - main section with gaps
    var northWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(30, wallHeight, wallThickness),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    northWall1.position.set(-20, wallHeight / 2, -37.5);
    northWall1.castShadow = true;
    northWall1.receiveShadow = true;
    addObjectToScene(northWall1);

    var northWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(30, wallHeight, wallThickness),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    northWall2.position.set(20, wallHeight / 2, -37.5);
    northWall2.castShadow = true;
    northWall2.receiveShadow = true;
    addObjectToScene(northWall2);

    // South wall
    var southWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(25, wallHeight * 0.8, wallThickness),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    southWall1.position.set(-15, (wallHeight * 0.8) / 2, 37.5);
    southWall1.castShadow = true;
    southWall1.receiveShadow = true;
    addObjectToScene(southWall1);

    var southWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(25, wallHeight * 0.6, wallThickness),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    southWall2.position.set(15, (wallHeight * 0.6) / 2, 37.5);
    southWall2.castShadow = true;
    southWall2.receiveShadow = true;
    addObjectToScene(southWall2);

    // East wall
    var eastWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 35),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    eastWall1.position.set(37.5, wallHeight / 2, 0);
    eastWall1.castShadow = true;
    eastWall1.receiveShadow = true;
    addObjectToScene(eastWall1);

    var eastWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight * 0.7, 25),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    eastWall2.position.set(37.5, (wallHeight * 0.7) / 2, 15);
    eastWall2.castShadow = true;
    eastWall2.receiveShadow = true;
    addObjectToScene(eastWall2);

    // West wall
    var westWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 40),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    westWall1.position.set(-37.5, wallHeight / 2, -2);
    westWall1.castShadow = true;
    westWall1.receiveShadow = true;
    addObjectToScene(westWall1);

    var westWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight * 0.75, 30),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    westWall2.position.set(-37.5, (wallHeight * 0.75) / 2, 15);
    westWall2.castShadow = true;
    westWall2.receiveShadow = true;
    addObjectToScene(westWall2);

    // Wall remnants with moss
    for (var i = 0; i < 8; i++) {
      var remnantHeight = 6 + Math.random() * 4;
      var remnantX = -35 + i * 10;
      var remnantY = remnantHeight / 2;
      var remnantZ = -35;

      var remnant = new THREE.Mesh(
        new THREE.BoxGeometry(3, remnantHeight, 2),
        new THREE.MeshPhongMaterial({ color: colors.mossyGreen })
      );
      remnant.position.set(remnantX, remnantY, remnantZ);
      remnant.castShadow = true;
      remnant.receiveShadow = true;
      addObjectToScene(remnant);
    }
  }

  function createRoundTowers() {
    var towerHeight = 16;
    var towerRadius = 5;

    // Northeast tower
    var neTower = new THREE.Mesh(
      new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    neTower.position.set(32, towerHeight / 2, -32);
    neTower.castShadow = true;
    neTower.receiveShadow = true;
    addObjectToScene(neTower);

    // Northwest tower - collapsed to half height
    var nwTower = new THREE.Mesh(
      new THREE.CylinderGeometry(towerRadius * 0.9, towerRadius * 0.9, towerHeight * 0.5, 16),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    nwTower.position.set(-32, (towerHeight * 0.5) / 2, -32);
    nwTower.castShadow = true;
    nwTower.receiveShadow = true;
    addObjectToScene(nwTower);

    // Southeast tower
    var seTower = new THREE.Mesh(
      new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight * 0.75, 16),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    seTower.position.set(32, (towerHeight * 0.75) / 2, 32);
    seTower.castShadow = true;
    seTower.receiveShadow = true;
    addObjectToScene(seTower);

    // Southwest tower - fully intact
    var swTower = new THREE.Mesh(
      new THREE.CylinderGeometry(towerRadius * 1.1, towerRadius * 1.1, towerHeight, 16),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    swTower.position.set(-32, towerHeight / 2, 32);
    swTower.castShadow = true;
    swTower.receiveShadow = true;
    addObjectToScene(swTower);

    // Mid-wall towers for detail
    var midTower1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 11, 12),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    midTower1.position.set(0, 5.5, -35);
    midTower1.castShadow = true;
    midTower1.receiveShadow = true;
    addObjectToScene(midTower1);

    var midTower2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 10, 12),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    midTower2.position.set(-25, 5, 35);
    midTower2.castShadow = true;
    midTower2.receiveShadow = true;
    addObjectToScene(midTower2);

    var midTower3 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 9, 12),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    midTower3.position.set(35, 4.5, 15);
    midTower3.castShadow = true;
    midTower3.receiveShadow = true;
    addObjectToScene(midTower3);
  }

  function createModernMilitaryAdditions() {
    var sandbagColor = colors.khaki;
    var sandbagHeight = 0.8;

    // Sandbag positions on north wall
    for (var i = 0; i < 6; i++) {
      var sandbag = new THREE.Mesh(
        new THREE.BoxGeometry(2, sandbagHeight, 1.5),
        new THREE.MeshPhongMaterial({ color: sandbagColor })
      );
      sandbag.position.set(-25 + i * 8, 12.5 + sandbagHeight / 2, -36);
      sandbag.castShadow = true;
      sandbag.receiveShadow = true;
      addObjectToScene(sandbag);
    }

    // Sandbag positions on east wall
    for (var i = 0; i < 5; i++) {
      var sandbag2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, sandbagHeight, 2),
        new THREE.MeshPhongMaterial({ color: colors.darkKhaki })
      );
      sandbag2.position.set(36.5, 11.5 + sandbagHeight / 2, -25 + i * 10);
      sandbag2.castShadow = true;
      sandbag2.receiveShadow = true;
      addObjectToScene(sandbag2);
    }

    // Gun emplacements - sandbag rings
    var gunemplacementX = [15, -18];
    var gunemplacementZ = [-30, 28];

    for (var j = 0; j < 2; j++) {
      for (var i = 0; i < 4; i++) {
        var angle = (i / 4) * Math.PI * 2;
        var offsetX = Math.cos(angle) * 3.5;
        var offsetZ = Math.sin(angle) * 3.5;

        var embankment = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.6, 1.8),
          new THREE.MeshPhongMaterial({ color: sandbagColor })
        );
        embankment.position.set(gunemplacementX[j] + offsetX, 0.3, gunemplacementZ[j] + offsetZ);
        embankment.castShadow = true;
        embankment.receiveShadow = true;
        addObjectToScene(embankment);
      }
    }
  }

  function createInnerBailey() {
    // Open courtyard - rubble chunks
    for (var i = 0; i < 25; i++) {
      var rubbleSize = 1.5 + Math.random() * 3;
      var rubble = new THREE.Mesh(
        new THREE.BoxGeometry(rubbleSize, rubbleSize * 0.7, rubbleSize * 0.8),
        new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
      );

      var rX = -20 + Math.random() * 40;
      var rZ = -20 + Math.random() * 40;

      // Avoid center area
      if (Math.abs(rX) < 5 && Math.abs(rZ) < 5) {
        rX = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 5);
        rZ = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 5);
      }

      rubble.position.set(rX, rubbleSize * 0.35, rZ);
      rubble.rotation.z = Math.random() * Math.PI * 2;
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      addObjectToScene(rubble);
    }

    // Ancient well - CylinderGeometry
    var wellOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4.5, 3, 16),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    wellOuter.position.set(3, 1.5, -5);
    wellOuter.castShadow = true;
    wellOuter.receiveShadow = true;
    addObjectToScene(wellOuter);

    var wellInner = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.8, 2.8, 16),
      new THREE.MeshPhongMaterial({ color: colors.blackMetal })
    );
    wellInner.position.set(3, 1.6, -5);
    wellInner.receiveShadow = true;
    addObjectToScene(wellInner);

    // Well rope pulley
    var pulley = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    pulley.position.set(3, 4.5, -5);
    pulley.rotation.z = Math.PI / 2;
    pulley.castShadow = true;
    pulley.receiveShadow = true;
    addObjectToScene(pulley);
  }

  function createKeepRuins() {
    var keepWidth = 20;
    var keepHeight = 22;

    // Main keep base
    var keepBase = new THREE.Mesh(
      new THREE.BoxGeometry(keepWidth, keepHeight, keepWidth),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    keepBase.position.set(0, keepHeight / 2, 0);
    keepBase.castShadow = true;
    keepBase.receiveShadow = true;
    addObjectToScene(keepBase);

    // Crumbling top section 1
    var crumble1 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 4, 18),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    crumble1.position.set(-1.5, 22, -1.5);
    crumble1.rotation.z = -0.15;
    crumble1.castShadow = true;
    crumble1.receiveShadow = true;
    addObjectToScene(crumble1);

    // Crumbling top section 2
    var crumble2 = new THREE.Mesh(
      new THREE.BoxGeometry(16, 3.5, 16),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    crumble2.position.set(1, 24.5, 2);
    crumble2.rotation.x = -0.1;
    crumble2.castShadow = true;
    crumble2.receiveShadow = true;
    addObjectToScene(crumble2);

    // Internal support columns
    for (var i = 0; i < 4; i++) {
      var colX = -7 + (i % 2) * 14;
      var colZ = -7 + Math.floor(i / 2) * 14;

      var column = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, keepHeight * 0.8, 12),
        new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
      );
      column.position.set(colX, (keepHeight * 0.8) / 2, colZ);
      column.castShadow = true;
      column.receiveShadow = true;
      addObjectToScene(column);
    }

    // Keep interior floor remains
    var floor1 = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.5, 18),
      new THREE.MeshPhongMaterial({ color: colors.darkMetal })
    );
    floor1.position.set(0, 10, 0);
    floor1.receiveShadow = true;
    addObjectToScene(floor1);

    var floor2 = new THREE.Mesh(
      new THREE.BoxGeometry(17, 0.5, 17),
      new THREE.MeshPhongMaterial({ color: colors.darkMetal })
    );
    floor2.position.set(0, 15, 0);
    floor2.receiveShadow = true;
    addObjectToScene(floor2);
  }

  function createVaultedPassage() {
    // Archway formed by 3 BoxGeometry pieces
    var archLeft = new THREE.Mesh(
      new THREE.BoxGeometry(2, 6, 1),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    archLeft.position.set(-5, 3, 25);
    archLeft.castShadow = true;
    archLeft.receiveShadow = true;
    addObjectToScene(archLeft);

    var archRight = new THREE.Mesh(
      new THREE.BoxGeometry(2, 6, 1),
      new THREE.MeshPhongMaterial({ color: colors.stoneGray })
    );
    archRight.position.set(5, 3, 25);
    archRight.castShadow = true;
    archRight.receiveShadow = true;
    addObjectToScene(archRight);

    var archTop = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2, 1),
      new THREE.MeshPhongMaterial({ color: colors.lightStoneGray })
    );
    archTop.position.set(0, 6.5, 25);
    archTop.castShadow = true;
    archTop.receiveShadow = true;
    addObjectToScene(archTop);

    // Passage floor
    var passageFloor = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.4, 12),
      new THREE.MeshPhongMaterial({ color: colors.darkMetal })
    );
    passageFloor.position.set(0, 0.2, 20);
    passageFloor.receiveShadow = true;
    addObjectToScene(passageFloor);

    // Passage walls
    var passageWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 5, 12),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    passageWall1.position.set(-4.5, 2.5, 20);
    passageWall1.castShadow = true;
    passageWall1.receiveShadow = true;
    addObjectToScene(passageWall1);

    var passageWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 5, 12),
      new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
    );
    passageWall2.position.set(4.5, 2.5, 20);
    passageWall2.castShadow = true;
    passageWall2.receiveShadow = true;
    addObjectToScene(passageWall2);
  }

  function createModernMilitaryCamp() {
    // Tents
    var tentPositions = [[-15, 8], [-8, 12], [10, 5], [18, 10]];

    for (var i = 0; i < tentPositions.length; i++) {
      var tent = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 4),
        new THREE.MeshPhongMaterial({ color: colors.khaki })
      );
      tent.position.set(tentPositions[i][0], 1.5, tentPositions[i][1]);
      tent.castShadow = true;
      tent.receiveShadow = true;
      addObjectToScene(tent);

      // Tent flap
      var flap = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.2, 0.3),
        new THREE.MeshPhongMaterial({ color: colors.darkKhaki })
      );
      flap.position.set(tentPositions[i][0], 2.8, tentPositions[i][1] - 2.2);
      flap.castShadow = true;
      flap.receiveShadow = true;
      addObjectToScene(flap);
    }

    // Supply crates
    var cratePositions = [[5, -12], [-10, -15], [12, -20], [-18, -18]];
    var crateColors = [colors.khaki, colors.darkKhaki, colors.khaki, colors.bloodRed];

    for (var i = 0; i < cratePositions.length; i++) {
      for (var j = 0; j < 3; j++) {
        var crate = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 2.5, 2.5),
          new THREE.MeshPhongMaterial({ color: crateColors[i] })
        );
        crate.position.set(
          cratePositions[i][0] + j * 2.8,
          1.25,
          cratePositions[i][1]
        );
        crate.castShadow = true;
        crate.receiveShadow = true;
        addObjectToScene(crate);
      }
    }

    // Ammunition boxes
    for (var i = 0; i < 6; i++) {
      var ammoBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.8, 1.5),
        new THREE.MeshPhongMaterial({ color: colors.bloodRed })
      );
      ammoBox.position.set(-8 + i * 2, 0.4, 20);
      ammoBox.castShadow = true;
      ammoBox.receiveShadow = true;
      addObjectToScene(ammoBox);
    }

    // Medical tent - white
    var medTent = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3.5, 5),
      new THREE.MeshPhongMaterial({ color: 0xffffff })
    );
    medTent.position.set(0, 1.75, -18);
    medTent.castShadow = true;
    medTent.receiveShadow = true;
    addObjectToScene(medTent);
  }

  function createDefensivePositions() {
    // Foxholes
    var foxholePositions = [[-28, -25], [25, -28], [28, 20], [-25, 25]];

    for (var i = 0; i < foxholePositions.length; i++) {
      var foxhole = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1.5, 3),
        new THREE.MeshPhongMaterial({ color: colors.sandColor })
      );
      foxhole.position.set(foxholePositions[i][0], 0.75, foxholePositions[i][1]);
      foxhole.castShadow = true;
      foxhole.receiveShadow = true;
      addObjectToScene(foxhole);

      // Sandbag walls around foxhole
      for (var j = 0; j < 4; j++) {
        var angle = (j / 4) * Math.PI * 2;
        var offsetX = Math.cos(angle) * 2.5;
        var offsetZ = Math.sin(angle) * 2.5;

        var sandbag = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.7, 1.2),
          new THREE.MeshPhongMaterial({ color: colors.khaki })
        );
        sandbag.position.set(
          foxholePositions[i][0] + offsetX,
          0.35,
          foxholePositions[i][1] + offsetZ
        );
        sandbag.castShadow = true;
        sandbag.receiveShadow = true;
        addObjectToScene(sandbag);
      }
    }

    // Sandbag walls - defensive lines
    for (var i = 0; i < 10; i++) {
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.8, 0.8),
        new THREE.MeshPhongMaterial({ color: colors.khaki })
      );
      wall.position.set(-30 + i * 6, 0.4, -8);
      wall.castShadow = true;
      wall.receiveShadow = true;
      addObjectToScene(wall);
    }

    for (var i = 0; i < 8; i++) {
      var wall2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 2),
        new THREE.MeshPhongMaterial({ color: colors.darkKhaki })
      );
      wall2.position.set(10, 0.4, -25 + i * 6);
      wall2.castShadow = true;
      wall2.receiveShadow = true;
      addObjectToScene(wall2);
    }
  }

  function createCommunicationAntenna() {
    // Antenna mast - BoxGeometry
    var mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 15, 0.6),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    mast.position.set(22, 7.5, -28);
    mast.castShadow = true;
    mast.receiveShadow = true;
    addObjectToScene(mast);

    // Antenna array - LineSegments
    var antennaGeometry = new THREE.BufferGeometry();
    var antennaPositions = [];

    var mastBaseX = 22;
    var mastBaseY = 15;
    var mastBaseZ = -28;
    var arraySize = 3;

    // Horizontal array elements
    for (var i = 0; i < 4; i++) {
      var x1 = mastBaseX - arraySize;
      var x2 = mastBaseX + arraySize;
      var z = mastBaseZ + (i - 1.5) * 1.5;

      antennaPositions.push(x1, mastBaseY, z);
      antennaPositions.push(x2, mastBaseY, z);
    }

    // Vertical elements
    for (var i = 0; i < 3; i++) {
      var x = mastBaseX + (i - 1) * 3;

      antennaPositions.push(x, mastBaseY - 2, mastBaseZ);
      antennaPositions.push(x, mastBaseY + 2, mastBaseZ);
    }

    antennaGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(antennaPositions), 3));
    var antennaArray = new THREE.LineSegments(
      antennaGeometry,
      new THREE.LineBasicMaterial({ color: colors.metalGray, linewidth: 2 })
    );
    addObjectToScene(antennaArray);

    // Mast support cables - LineSegments
    var cableGeometry = new THREE.BufferGeometry();
    var cablePositions = [];

    var supportPoints = [
      [-20, 3, -20],
      [-20, 3, -36],
      [30, 3, -20],
      [30, 3, -36]
    ];

    for (var i = 0; i < supportPoints.length; i++) {
      cablePositions.push(mastBaseX, mastBaseY, mastBaseZ);
      cablePositions.push(supportPoints[i][0], supportPoints[i][1], supportPoints[i][2]);
    }

    cableGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePositions), 3));
    var cables = new THREE.LineSegments(
      cableGeometry,
      new THREE.LineBasicMaterial({ color: colors.darkMetal, linewidth: 1 })
    );
    addObjectToScene(cables);
  }

  function createArrowLoops() {
    // Arrow loop slit walls - vertical gaps in walls
    var loopPositions = [
      [0, 9.5, -36.5],
      [-18, 9, -36.5],
      [18, 9, -36.5],
      [37.5, 8.5, -18],
      [37.5, 8.5, 12],
      [-37.5, 8, 8]
    ];

    for (var i = 0; i < loopPositions.length; i++) {
      // Frame around loop
      var loopFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.5, 1),
        new THREE.MeshPhongMaterial({ color: colors.darkStoneGray })
      );
      loopFrame.position.set(
        loopPositions[i][0],
        loopPositions[i][1],
        loopPositions[i][2]
      );
      loopFrame.castShadow = true;
      loopFrame.receiveShadow = true;
      addObjectToScene(loopFrame);
    }
  }

  function createCollapsedFloors() {
    // Collapsed floor sections
    var floorSections = [
      {x: 8, y: 8, z: 5, w: 6, h: 0.5, d: 6},
      {x: -10, y: 5, z: 3, w: 5, h: 0.5, d: 5},
      {x: 15, y: 6, z: -8, w: 7, h: 0.5, d: 4},
      {x: -12, y: 4, z: -12, w: 4, h: 0.5, d: 6},
      {x: 5, y: 7, z: 12, w: 5, h: 0.5, d: 5},
      {x: -8, y: 3, z: 15, w: 6, h: 0.5, d: 5}
    ];

    for (var i = 0; i < floorSections.length; i++) {
      var section = floorSections[i];
      var floor = new THREE.Mesh(
        new THREE.BoxGeometry(section.w, section.h, section.d),
        new THREE.MeshPhongMaterial({ color: colors.darkMetal })
      );
      floor.position.set(section.x, section.y, section.z);
      floor.rotation.z = (Math.random() - 0.5) * 0.3;
      floor.receiveShadow = true;
      addObjectToScene(floor);
    }
  }

  function createMoatRemnants() {
    // Dry moat channel - BoxGeometry
    var moatDepth = 3;
    var moatWidth = 6;

    // North moat
    var northMoat = new THREE.Mesh(
      new THREE.BoxGeometry(50, moatDepth, moatWidth),
      new THREE.MeshPhongMaterial({ color: colors.sandColor })
    );
    northMoat.position.set(0, moatDepth / 2 - 1, -43);
    northMoat.receiveShadow = true;
    addObjectToScene(northMoat);

    // East moat
    var eastMoat = new THREE.Mesh(
      new THREE.BoxGeometry(moatWidth, moatDepth, 50),
      new THREE.MeshPhongMaterial({ color: colors.sandColor })
    );
    eastMoat.position.set(43, moatDepth / 2 - 1, 0);
    eastMoat.receiveShadow = true;
    addObjectToScene(eastMoat);

    // South moat
    var southMoat = new THREE.Mesh(
      new THREE.BoxGeometry(50, moatDepth, moatWidth),
      new THREE.MeshPhongMaterial({ color: colors.sandColor })
    );
    southMoat.position.set(0, moatDepth / 2 - 1, 43);
    southMoat.receiveShadow = true;
    addObjectToScene(southMoat);

    // West moat
    var westMoat = new THREE.Mesh(
      new THREE.BoxGeometry(moatWidth, moatDepth, 50),
      new THREE.MeshPhongMaterial({ color: colors.sandColor })
    );
    westMoat.position.set(-43, moatDepth / 2 - 1, 0);
    westMoat.receiveShadow = true;
    addObjectToScene(westMoat);

    // Razor wire - LineSegments
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];

    // Wire in north moat
    for (var i = 0; i < 10; i++) {
      var x1 = -25 + i * 5;
      var x2 = -22.5 + i * 5;

      wirePositions.push(x1, 0.5, -43);
      wirePositions.push(x2, 0.8, -43);

      wirePositions.push(x1, 0.5, -43);
      wirePositions.push(x1, 0.8, -40);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var razorWire = new THREE.LineSegments(
      wireGeometry,
      new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 })
    );
    addObjectToScene(razorWire);
  }

  function createWaterCistern() {
    // Underground water storage - BoxGeometry for tank
    var cisternWidth = 8;
    var cisternDepth = 8;
    var cisternHeight = 4;

    // Cistern structure - appears partially underground
    var cistern = new THREE.Mesh(
      new THREE.BoxGeometry(cisternWidth, cisternHeight, cisternDepth),
      new THREE.MeshPhongMaterial({ color: colors.darkMetal })
    );
    cistern.position.set(-12, cisternHeight / 2 - 0.5, -22);
    cistern.castShadow = true;
    cistern.receiveShadow = true;
    addObjectToScene(cistern);

    // Cistern hatch - CylinderGeometry access hatch
    var hatch = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.3, 16),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    hatch.position.set(-12, cisternHeight + 0.2, -22);
    hatch.castShadow = true;
    hatch.receiveShadow = true;
    addObjectToScene(hatch);

    // Hatch rim
    var hatchRim = new THREE.Mesh(
      new THREE.CylinderGeometry(2.3, 2.3, 0.15, 16),
      new THREE.MeshPhongMaterial({ color: colors.rust })
    );
    hatchRim.position.set(-12, cisternHeight + 0.35, -22);
    hatchRim.castShadow = true;
    hatchRim.receiveShadow = true;
    addObjectToScene(hatchRim);

    // Water pump structure
    var pump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 1.5, 8),
      new THREE.MeshPhongMaterial({ color: colors.rust })
    );
    pump.position.set(-12, cisternHeight + 1, -22);
    pump.castShadow = true;
    pump.receiveShadow = true;
    addObjectToScene(pump);

    // Pipe connections - LineSegments
    var pipeGeometry = new THREE.BufferGeometry();
    var pipePositions = [
      -12, cisternHeight + 1.8, -22,
      -12, cisternHeight + 3, -22,

      -12, cisternHeight + 3, -22,
      -10, cisternHeight + 3, -22,

      -12, cisternHeight + 3, -22,
      -14, cisternHeight + 3, -22
    ];

    pipeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pipePositions), 3));
    var pipes = new THREE.LineSegments(
      pipeGeometry,
      new THREE.LineBasicMaterial({ color: colors.rust, linewidth: 2 })
    );
    addObjectToScene(pipes);
  }

  function createFlag() {
    // Flagpole
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 6, 8),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    pole.position.set(28, 3, 28);
    pole.castShadow = true;
    pole.receiveShadow = true;
    addObjectToScene(pole);

    // Flag - BoxGeometry with animation
    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 0.2),
      new THREE.MeshPhongMaterial({ color: colors.khaki })
    );
    flag.position.set(30.5, 5, 28);
    flag.castShadow = true;
    flag.receiveShadow = true;
    addObjectToScene(flag);

    flagObject = {
      mesh: flag,
      baseX: 30.5,
      baseY: 5,
      baseZ: 28,
      time: 0
    };

    animatedObjects.push(flagObject);
  }

  function createSearchLight() {
    // Searchlight structure
    var searchLightGroupLocal = new THREE.Group();

    // Base mounting
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 2),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    base.position.set(-28, 14, 28);
    base.castShadow = true;
    base.receiveShadow = true;
    searchLightGroupLocal.add(base);

    // Pivot arm
    var arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 4),
      new THREE.MeshPhongMaterial({ color: colors.darkMetal })
    );
    arm.position.set(0, 0, 2);
    searchLightGroupLocal.add(arm);

    // Spotlight head - ConeGeometry
    var spotlight = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 1.5, 16),
      new THREE.MeshPhongMaterial({ color: colors.metalGray })
    );
    spotlight.position.set(0, 0, 4);
    spotlight.rotation.z = Math.PI / 2;
    searchLightGroupLocal.add(spotlight);

    searchLightGroupLocal.position.set(0, 0, 0);
    sceneReference.add(searchLightGroupLocal);
    fortressObjects.push(searchLightGroupLocal);

    searchLightGroup = {
      group: searchLightGroupLocal,
      rotation: 0,
      direction: 1
    };

    animatedObjects.push(searchLightGroup);
  }

  function createAdditionalRubble() {
    // Extra rubble piles and broken stones scattered around
    for (var i = 0; i < 20; i++) {
      var rubbleX = -40 + Math.random() * 80;
      var rubbleZ = -40 + Math.random() * 80;

      // Skip if too close to center keep
      if (Math.abs(rubbleX) < 15 && Math.abs(rubbleZ) < 15) {
        continue;
      }

      var rubbleSize = 0.8 + Math.random() * 2;
      var rubble = new THREE.Mesh(
        new THREE.BoxGeometry(rubbleSize, rubbleSize * 0.5, rubbleSize * 0.7),
        new THREE.MeshPhongMaterial({ color: colors.mossyGreen })
      );

      rubble.position.set(rubbleX, rubbleSize * 0.25, rubbleZ);
      rubble.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      rubble.receiveShadow = true;
      addObjectToScene(rubble);
    }
  }

  function init(scene, camera) {
    sceneReference = scene;
    cameraReference = camera;
    fortressObjects = [];
    animatedObjects = [];

    // Create ground plane
    var ground = new THREE.Mesh(
      new THREE.BoxGeometry(100, 0.5, 100),
      new THREE.MeshPhongMaterial({ color: colors.sandColor })
    );
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    sceneReference.add(ground);
    fortressObjects.push(ground);

    // Build fortress
    createOuterCurtainWalls();
    createRoundTowers();
    createModernMilitaryAdditions();
    createInnerBailey();
    createKeepRuins();
    createVaultedPassage();
    createModernMilitaryCamp();
    createDefensivePositions();
    createCommunicationAntenna();
    createArrowLoops();
    createCollapsedFloors();
    createMoatRemnants();
    createWaterCistern();
    createAdditionalRubble();
    createFlag();
    createSearchLight();

    console.log('FortressRuins initialized with', fortressObjects.length, 'objects');
  }

  function update(delta) {
    // Animate flag oscillation
    if (flagObject) {
      flagObject.time += delta;
      var waveAmplitude = 0.3;
      var waveFrequency = 2;
      var verticalBob = Math.sin(flagObject.time * waveFrequency) * 0.15;

      flagObject.mesh.position.x = flagObject.baseX + Math.sin(flagObject.time * waveFrequency) * waveAmplitude;
      flagObject.mesh.position.y = flagObject.baseY + verticalBob;
      flagObject.mesh.rotation.z = Math.sin(flagObject.time * waveFrequency * 0.5) * 0.2;
    }

    // Rotate searchlight
    if (searchLightGroup) {
      searchLightGroup.rotation += searchLightGroup.direction * delta * 0.5;

      if (searchLightGroup.rotation > Math.PI * 2) {
        searchLightGroup.rotation = 0;
      }

      searchLightGroup.group.rotation.y = searchLightGroup.rotation;
    }
  }

  function reset() {
    // Remove all fortress objects from scene
    for (var i = 0; i < fortressObjects.length; i++) {
      sceneReference.remove(fortressObjects[i]);
    }

    fortressObjects = [];
    animatedObjects = [];
    flagObject = null;
    searchLightGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
