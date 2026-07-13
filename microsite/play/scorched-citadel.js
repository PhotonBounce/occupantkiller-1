window.ScorchedCitadel = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var embers = [];
  var smokePuffs = [];
  var time = 0;

  var ColorPalette = {
    charcoalBlack: 0x1a1a1a,
    scorchBrown: 0x3d2817,
    darkGray: 0x4a4a4a,
    fireOrange: 0xff6600,
    darkOrange: 0xcc5500,
    lightGray: 0x6a6a6a,
    ashGray: 0x888888,
    blackSmoke: 0x2a2a2a
  };

  function createMaterial(color, emissive, emissiveIntensity) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      roughness: 0.8,
      metalness: 0.1
    });
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createOuterCurtainWall() {
    // Main wall segments with battlement gaps
    var wallHeight = 12;
    var wallThickness = 0.8;
    var wallLength = 50;

    // North wall
    var northWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var northWall = new THREE.Mesh(northWallGeo, createMaterial(ColorPalette.darkGray));
    northWall.position.set(0, wallHeight / 2, -25);
    addToScene(northWall);

    // South wall
    var southWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var southWall = new THREE.Mesh(southWallGeo, createMaterial(ColorPalette.darkGray));
    southWall.position.set(0, wallHeight / 2, 25);
    addToScene(southWall);

    // East wall
    var eastWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var eastWall = new THREE.Mesh(eastWallGeo, createMaterial(ColorPalette.darkGray));
    eastWall.position.set(25, wallHeight / 2, 0);
    addToScene(eastWall);

    // West wall
    var westWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var westWall = new THREE.Mesh(westWallGeo, createMaterial(ColorPalette.darkGray));
    westWall.position.set(-25, wallHeight / 2, 0);
    addToScene(westWall);

    // Create battle gaps (destroyed sections)
    var gapSize = 3;
    var gapGeo = new THREE.BoxGeometry(gapSize, wallHeight, wallThickness + 0.2);
    var gapPositions = [
      { x: -15, z: -25 },
      { x: 12, z: -25 },
      { x: -18, z: 25 },
      { x: 10, z: 25 },
      { x: 25, z: -10 },
      { x: 25, z: 8 },
      { x: -25, z: -8 },
      { x: -25, z: 12 }
    ];

    gapPositions.forEach(function(pos) {
      var gapMesh = new THREE.Mesh(gapGeo, createMaterial(ColorPalette.charcoalBlack));
      gapMesh.position.set(pos.x, wallHeight / 2, pos.z);
      addToScene(gapMesh);
    });

    // Battlements
    var battlementSize = 1.2;
    var battlementSpacing = 4;
    for (var i = -24; i < 24; i += battlementSpacing) {
      var battGeo = new THREE.BoxGeometry(battlementSize, battlementSize * 1.5, wallThickness + 0.2);
      var battMesh = new THREE.Mesh(battGeo, createMaterial(ColorPalette.lightGray));
      battMesh.position.set(i, wallHeight + battlementSize * 0.75, -25.5);
      addToScene(battMesh);

      var battMesh2 = new THREE.Mesh(battGeo, createMaterial(ColorPalette.lightGray));
      battMesh2.position.set(i, wallHeight + battlementSize * 0.75, 25.5);
      addToScene(battMesh2);
    }

    for (var j = -24; j < 24; j += battlementSpacing) {
      var battGeo2 = new THREE.BoxGeometry(wallThickness + 0.2, battlementSize * 1.5, battlementSize);
      var battMesh3 = new THREE.Mesh(battGeo2, createMaterial(ColorPalette.lightGray));
      battMesh3.position.set(25.5, wallHeight + battlementSize * 0.75, j);
      addToScene(battMesh3);

      var battMesh4 = new THREE.Mesh(battGeo2, createMaterial(ColorPalette.lightGray));
      battMesh4.position.set(-25.5, wallHeight + battlementSize * 0.75, j);
      addToScene(battMesh4);
    }
  }

  function createRoundTowers() {
    var towerRadius = 2.5;
    var towerHeight = 14;
    var towerPositions = [
      { x: -22, z: -22 },
      { x: 22, z: -22 },
      { x: 22, z: 22 },
      { x: -22, z: 22 }
    ];

    towerPositions.forEach(function(pos) {
      // Tower cylinder
      var towerGeo = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
      var tower = new THREE.Mesh(towerGeo, createMaterial(ColorPalette.darkGray));
      tower.position.set(pos.x, towerHeight / 2, pos.z);
      addToScene(tower);

      // Shattered cone cap
      var capGeo = new THREE.ConeGeometry(towerRadius, 3, 16);
      var cap = new THREE.Mesh(capGeo, createMaterial(ColorPalette.scorchBrown));
      cap.position.set(pos.x, towerHeight + 1.5, pos.z);
      cap.rotation.z = Math.random() * 0.5;
      cap.rotation.x = Math.random() * 0.3;
      addToScene(cap);

      // Broken rubble pieces at base
      for (var k = 0; k < 3; k++) {
        var rubbleGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        var rubble = new THREE.Mesh(rubbleGeo, createMaterial(ColorPalette.charcoalBlack));
        rubble.position.set(
          pos.x + (Math.random() - 0.5) * 5,
          0.4,
          pos.z + (Math.random() - 0.5) * 5
        );
        addToScene(rubble);
      }
    });
  }

  function createKeepDonjon() {
    var keepWidth = 10;
    var keepDepth = 10;
    var keepHeight = 18;

    // Main keep structure
    var keepGeo = new THREE.BoxGeometry(keepWidth, keepHeight, keepDepth);
    var keep = new THREE.Mesh(keepGeo, createMaterial(ColorPalette.darkGray));
    keep.position.set(0, keepHeight / 2, 0);
    addToScene(keep);

    // Collapsed section (large hole in side)
    var collapseGeo = new THREE.BoxGeometry(5, 10, keepDepth + 1);
    var collapseMesh = new THREE.Mesh(collapseGeo, createMaterial(ColorPalette.charcoalBlack));
    collapseMesh.position.set(3, 10, 0);
    addToScene(collapseMesh);

    // Fallen stone blocks around collapse
    for (var m = 0; m < 15; m++) {
      var blockGeo = new THREE.BoxGeometry(
        2 + Math.random() * 2,
        1.5 + Math.random(),
        2 + Math.random() * 2
      );
      var block = new THREE.Mesh(blockGeo, createMaterial(ColorPalette.scorchBrown));
      block.position.set(
        3 + (Math.random() - 0.5) * 8,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 12
      );
      block.rotation.set(
        Math.random() * 0.7,
        Math.random() * Math.PI,
        Math.random() * 0.5
      );
      addToScene(block);
    }
  }

  function createGreatHallRuin() {
    var hallWidth = 12;
    var hallLength = 20;
    var hallHeight = 8;

    // Hall walls
    var northHallGeo = new THREE.BoxGeometry(hallLength, hallHeight, 0.6);
    var northHall = new THREE.Mesh(northHallGeo, createMaterial(ColorPalette.darkGray));
    northHall.position.set(0, hallHeight / 2, -18);
    addToScene(northHall);

    var southHallGeo = new THREE.BoxGeometry(hallLength, hallHeight, 0.6);
    var southHall = new THREE.Mesh(southHallGeo, createMaterial(ColorPalette.darkGray));
    southHall.position.set(0, hallHeight / 2, -2);
    addToScene(southHall);

    var eastHallGeo = new THREE.BoxGeometry(0.6, hallHeight, hallWidth);
    var eastHall = new THREE.Mesh(eastHallGeo, createMaterial(ColorPalette.darkGray));
    eastHall.position.set(10, hallHeight / 2, -10);
    addToScene(eastHall);

    var westHallGeo = new THREE.BoxGeometry(0.6, hallHeight, hallWidth);
    var westHall = new THREE.Mesh(westHallGeo, createMaterial(ColorPalette.darkGray));
    westHall.position.set(-10, hallHeight / 2, -10);
    addToScene(westHall);

    // Fallen roof beams (diagonal boxes)
    for (var n = 0; n < 8; n++) {
      var beamGeo = new THREE.BoxGeometry(0.3, 0.3, 15);
      var beam = new THREE.Mesh(beamGeo, createMaterial(ColorPalette.charcoalBlack));
      beam.position.set(
        (Math.random() - 0.5) * 15,
        5 + Math.random() * 2,
        -10
      );
      beam.rotation.z = Math.PI / 4 + Math.random() * 0.3;
      beam.rotation.x = Math.random() * 0.3;
      addToScene(beam);
    }

    // Rubble heap inside
    for (var p = 0; p < 20; p++) {
      var rubbGeo = new THREE.BoxGeometry(
        1.5 + Math.random(),
        1 + Math.random() * 1.5,
        1.5 + Math.random()
      );
      var rubb = new THREE.Mesh(rubbGeo, createMaterial(ColorPalette.scorchBrown));
      rubb.position.set(
        (Math.random() - 0.5) * 14,
        0.8,
        -10 + (Math.random() - 0.5) * 8
      );
      addToScene(rubb);
    }
  }

  function createBurnedWoodenStructures() {
    var scaffoldPositions = [
      { x: 15, z: -15 },
      { x: -15, z: 15 },
      { x: 18, z: 10 }
    ];

    scaffoldPositions.forEach(function(pos) {
      // Vertical supports
      for (var q = 0; q < 4; q++) {
        var supportGeo = new THREE.BoxGeometry(0.4, 6, 0.4);
        var support = new THREE.Mesh(supportGeo, createMaterial(ColorPalette.charcoalBlack));
        support.position.set(
          pos.x + (q % 2) * 2 - 1,
          3,
          pos.z + Math.floor(q / 2) * 2 - 1
        );
        addToScene(support);
      }

      // Horizontal braces
      for (var r = 0; r < 3; r++) {
        var braceGeo = new THREE.BoxGeometry(2.5, 0.3, 2.5);
        var brace = new THREE.Mesh(braceGeo, createMaterial(ColorPalette.charcoalBlack));
        brace.position.set(pos.x, 1.5 + r * 1.5, pos.z);
        addToScene(brace);
      }

      // Barricade planks
      for (var s = 0; s < 5; s++) {
        var plankGeo = new THREE.BoxGeometry(0.2, 3, 3);
        var plank = new THREE.Mesh(plankGeo, createMaterial(ColorPalette.charcoalBlack));
        plank.position.set(pos.x + 1.5, 1.5, pos.z - 2.5 + s);
        addToScene(plank);
      }
    });
  }

  function createFirePits() {
    var pitPositions = [
      { x: -15, z: -10 },
      { x: 10, z: 15 },
      { x: -8, z: 8 },
      { x: 15, z: -15 },
      { x: 5, z: 0 },
      { x: -20, z: 10 }
    ];

    pitPositions.forEach(function(pos) {
      // Pit container (dark stones)
      var pitRingGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 12);
      var pitRing = new THREE.Mesh(pitRingGeo, createMaterial(ColorPalette.charcoalBlack));
      pitRing.position.set(pos.x, 0.25, pos.z);
      addToScene(pitRing);

      // Glowing embers
      for (var u = 0; u < 5; u++) {
        var emberGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8);
        var ember = new THREE.Mesh(emberGeo, createMaterial(ColorPalette.fireOrange, ColorPalette.fireOrange, 0.8));
        ember.position.set(
          pos.x + (Math.random() - 0.5) * 1.8,
          0.8 + Math.random() * 0.3,
          pos.z + (Math.random() - 0.5) * 1.8
        );
        ember.userData.baseY = ember.position.y;
        ember.userData.phase = Math.random() * Math.PI * 2;
        addToScene(ember);
        embers.push(ember);
      }
    });
  }

  function createCatapultWreckage() {
    var positions = [
      { x: 12, z: -20 },
      { x: -15, z: 18 }
    ];

    positions.forEach(function(pos) {
      // Arm segment (long diagonal box)
      var armGeo = new THREE.BoxGeometry(0.5, 0.5, 12);
      var arm = new THREE.Mesh(armGeo, createMaterial(ColorPalette.charcoalBlack));
      arm.position.set(pos.x, 2, pos.z);
      arm.rotation.z = Math.PI / 6 + Math.random() * 0.3;
      addToScene(arm);

      // Base frame
      var baseGeo = new THREE.BoxGeometry(4, 0.8, 4);
      var base = new THREE.Mesh(baseGeo, createMaterial(ColorPalette.scorchBrown));
      base.position.set(pos.x, 0.4, pos.z);
      addToScene(base);

      // Counterweight blocks
      for (var v = 0; v < 3; v++) {
        var weightGeo = new THREE.BoxGeometry(1, 1.5, 1);
        var weight = new THREE.Mesh(weightGeo, createMaterial(ColorPalette.charcoalBlack));
        weight.position.set(pos.x - 1.5 + v, 3, pos.z - 2);
        addToScene(weight);
      }
    });
  }

  function createCollapsedGate() {
    var gateX = -25.5;
    var gateZ = 0;
    var gateHeight = 10;

    // Gate posts (still standing)
    var postGeo = new THREE.BoxGeometry(0.8, gateHeight, 0.8);
    var postLeft = new THREE.Mesh(postGeo, createMaterial(ColorPalette.darkGray));
    postLeft.position.set(gateX, gateHeight / 2, -2);
    addToScene(postLeft);

    var postRight = new THREE.Mesh(postGeo, createMaterial(ColorPalette.darkGray));
    postRight.position.set(gateX, gateHeight / 2, 2);
    addToScene(postRight);

    // Fallen portcullis bars (line segments pattern with box proxies)
    for (var w = 0; w < 10; w++) {
      var barGeo = new THREE.BoxGeometry(0.15, 0.15, 8);
      var bar = new THREE.Mesh(barGeo, createMaterial(ColorPalette.charcoalBlack));
      bar.position.set(gateX + 1, 3 - w * 0.4, gateZ);
      bar.rotation.z = Math.PI / 3 + w * 0.15;
      addToScene(bar);
    }

    // Broken hinge blocks
    for (var x = 0; x < 4; x++) {
      var hingeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var hinge = new THREE.Mesh(hingeGeo, createMaterial(ColorPalette.charcoalBlack));
      hinge.position.set(gateX + 0.5, 2 + x, gateZ - 2 + Math.random() * 4);
      addToScene(hinge);
    }
  }

  function createChapelSpire() {
    var spireX = -12;
    var spireZ = -12;

    // Chapel base (cylinder)
    var baseGeo = new THREE.CylinderGeometry(3, 3, 6, 12);
    var base = new THREE.Mesh(baseGeo, createMaterial(ColorPalette.darkGray));
    base.position.set(spireX, 3, spireZ);
    addToScene(base);

    // Spire cone (fire-scorched black)
    var spireGeo = new THREE.ConeGeometry(2, 8, 12);
    var spire = new THREE.Mesh(spireGeo, createMaterial(ColorPalette.charcoalBlack, ColorPalette.darkOrange, 0.3));
    spire.position.set(spireX, 10, spireZ);
    addToScene(spire);

    // Broken sections at base
    for (var y = 0; y < 4; y++) {
      var fragGeo = new THREE.BoxGeometry(1, 1.2, 1);
      var frag = new THREE.Mesh(fragGeo, createMaterial(ColorPalette.scorchBrown));
      frag.position.set(spireX + (Math.random() - 0.5) * 4, 0.6, spireZ + (Math.random() - 0.5) * 4);
      addToScene(frag);
    }
  }

  function createRubblePiles() {
    var pilePositions = [
      { x: 20, z: 5 },
      { x: -18, z: -20 },
      { x: 8, z: 20 },
      { x: -22, z: 0 },
      { x: 15, z: 15 },
      { x: -10, z: 18 }
    ];

    pilePositions.forEach(function(pos) {
      for (var z = 0; z < 12; z++) {
        var chunkGeo = new THREE.BoxGeometry(
          1.5 + Math.random() * 1.5,
          0.8 + Math.random() * 1,
          1.5 + Math.random() * 1.5
        );
        var chunk = new THREE.Mesh(chunkGeo, createMaterial(ColorPalette.scorchBrown));
        chunk.position.set(
          pos.x + (Math.random() - 0.5) * 4,
          0.5 + z * 0.3 + Math.random() * 0.5,
          pos.z + (Math.random() - 0.5) * 4
        );
        chunk.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        addToScene(chunk);
      }
    });
  }

  function createArrowSlitWalls() {
    var positions = [
      { x: 15, z: -15, angle: 0 },
      { x: -15, z: 15, angle: Math.PI / 2 },
      { x: 15, z: 15, angle: 0 }
    ];

    positions.forEach(function(pos) {
      // Wall section
      var wallGeo = new THREE.BoxGeometry(4, 5, 0.6);
      var wall = new THREE.Mesh(wallGeo, createMaterial(ColorPalette.darkGray));
      wall.position.set(pos.x, 2.5, pos.z);
      wall.rotation.y = pos.angle;
      addToScene(wall);

      // Arrow slits (dark gaps)
      for (var aa = 0; aa < 3; aa++) {
        var slitGeo = new THREE.BoxGeometry(0.3, 2, 0.8);
        var slit = new THREE.Mesh(slitGeo, createMaterial(ColorPalette.charcoalBlack));
        slit.position.set(
          pos.x - 1.2 + aa * 1.2,
          2 + 0.5,
          pos.z + 0.4
        );
        slit.rotation.y = pos.angle;
        addToScene(slit);
      }
    });
  }

  function createSiegeWeaponEmplacements() {
    var emplacementPositions = [
      { x: 20, z: -18 },
      { x: -20, z: 18 }
    ];

    emplacementPositions.forEach(function(pos) {
      // Platform
      var platformGeo = new THREE.BoxGeometry(5, 0.8, 4);
      var platform = new THREE.Mesh(platformGeo, createMaterial(ColorPalette.scorchBrown));
      platform.position.set(pos.x, 0.4, pos.z);
      addToScene(platform);

      // Support pillars
      for (var ab = 0; ab < 4; ab++) {
        var pillarGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
        var pillar = new THREE.Mesh(pillarGeo, createMaterial(ColorPalette.darkGray));
        pillar.position.set(
          pos.x - 2 + (ab % 2) * 4,
          1,
          pos.z - 1.5 + Math.floor(ab / 2) * 3
        );
        addToScene(pillar);
      }

      // Cannon barrels (cylinder)
      for (var ac = 0; ac < 2; ac++) {
        var barrelGeo = new THREE.CylinderGeometry(0.3, 0.35, 4, 12);
        var barrel = new THREE.Mesh(barrelGeo, createMaterial(ColorPalette.charcoalBlack));
        barrel.position.set(pos.x - 1.5 + ac * 3, 1.5, pos.z);
        barrel.rotation.z = Math.PI / 6;
        addToScene(barrel);
      }
    });
  }

  function createSmokePuffs() {
    var smokeCount = 15;
    for (var ad = 0; ad < smokeCount; ad++) {
      var smokeMaterial = createMaterial(ColorPalette.blackSmoke);
      smokeMaterial.opacity = 0.3;
      smokeMaterial.transparent = true;

      var smokePuffGeo = new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 6);
      var smokePuff = new THREE.Mesh(smokePuffGeo, smokeMaterial);
      smokePuff.position.set(
        (Math.random() - 0.5) * 30,
        3 + Math.random() * 5,
        (Math.random() - 0.5) * 30
      );
      smokePuff.userData.baseY = smokePuff.position.y;
      smokePuff.userData.phase = Math.random() * Math.PI * 2;
      smokePuff.userData.speed = 0.5 + Math.random() * 1;
      addToScene(smokePuff);
      smokePuffs.push(smokePuff);
    }
  }

  var exports = {};

  exports.init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    embers = [];
    smokePuffs = [];
    time = 0;

    // Build the environment
    createOuterCurtainWall();
    createRoundTowers();
    createKeepDonjon();
    createGreatHallRuin();
    createBurnedWoodenStructures();
    createFirePits();
    createCatapultWreckage();
    createCollapsedGate();
    createChapelSpire();
    createRubblePiles();
    createArrowSlitWalls();
    createSiegeWeaponEmplacements();
    createSmokePuffs();
  };

  exports.update = function(delta) {
    time += delta;

    // Animate fire embers rising and flickering
    embers.forEach(function(ember) {
      ember.position.y = ember.userData.baseY +
        Math.sin(time * 2 + ember.userData.phase) * 0.3 +
        time * 0.5;

      // Flicker intensity
      var flicker = 0.5 + 0.5 * Math.sin(time * 8 + ember.userData.phase);
      ember.material.emissiveIntensity = flicker;

      // Reset if too high
      if (ember.position.y > 20) {
        ember.position.y = ember.userData.baseY;
      }
    });

    // Animate smoke puffs rising
    smokePuffs.forEach(function(puff) {
      puff.position.y = puff.userData.baseY + time * puff.userData.speed;
      puff.position.x += Math.sin(time + puff.userData.phase) * 0.02;
      puff.position.z += Math.cos(time + puff.userData.phase) * 0.02;
      puff.scale.set(
        1 + (time - (puff.userData.baseY - 3)) * 0.1,
        1 + (time - (puff.userData.baseY - 3)) * 0.1,
        1 + (time - (puff.userData.baseY - 3)) * 0.1
      );

      // Fade out
      var age = time - (puff.userData.baseY - 3);
      if (age > 0) {
        puff.material.opacity = 0.3 * (1 - age / 8);
      }

      // Reset if dissipated
      if (puff.position.y > 25) {
        puff.position.y = puff.userData.baseY;
        puff.scale.set(1, 1, 1);
      }
    });
  };

  exports.reset = function() {
    objects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });
    objects = [];
    embers = [];
    smokePuffs = [];
    time = 0;
  };

  return exports;
}());
