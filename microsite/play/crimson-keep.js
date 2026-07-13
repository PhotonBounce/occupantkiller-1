window.CrimsonKeep = (function() {
  'use strict';

  var geometries = [];
  var meshes = [];
  var animatedObjects = [];
  var scene = null;
  var camera = null;

  var COLORS = {
    deepCrimson: 0x4a0000,
    darkBloodRed: 0x660000,
    darkRed: 0x800000,
    brightCrimson: 0xdc143c,
    boneWhite: 0xf5f5dc,
    ironBlack: 0x1a1a1a,
    darkStone: 0x2a2a2a,
    rust: 0xb22222,
    veryDarkRed: 0x330000
  };

  function createMaterial(color, metalness, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness || 0.3,
      roughness: roughness || 0.8,
      side: THREE.DoubleSide
    });
  }

  function addGeometry(geometry) {
    geometries.push(geometry);
    return geometry;
  }

  function addMesh(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function addAnimatedObject(object, type, params) {
    animatedObjects.push({
      object: object,
      type: type,
      params: params,
      time: 0
    });
  }

  function createMassiveKeep() {
    var geo = addGeometry(new THREE.BoxGeometry(30, 45, 30));
    var mat = createMaterial(COLORS.darkBloodRed, 0.2, 0.9);
    var keep = addMesh(new THREE.Mesh(geo, mat));
    keep.position.set(0, 22.5, 0);
    keep.castShadow = true;
    keep.receiveShadow = true;

    // Keep windows - carved indentations using boxes
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var windowGeo = addGeometry(new THREE.BoxGeometry(2, 2, 1));
        var windowMat = createMaterial(COLORS.ironBlack, 0.8, 0.5);
        var window = addMesh(new THREE.Mesh(windowGeo, windowMat));
        window.position.set(-12 + i * 8, 15 + j * 10, 15.5);
      }
    }
  }

  function createCrimsonWalls() {
    // North wall
    var wallNGeo = addGeometry(new THREE.BoxGeometry(80, 15, 2));
    var wallMat = createMaterial(COLORS.darkRed, 0.1, 0.95);
    var wallN = addMesh(new THREE.Mesh(wallNGeo, wallMat));
    wallN.position.set(0, 7.5, -40);
    wallN.castShadow = true;
    wallN.receiveShadow = true;

    // South wall
    var wallSGeo = addGeometry(new THREE.BoxGeometry(80, 15, 2));
    var wallS = addMesh(new THREE.Mesh(wallSGeo, wallMat));
    wallS.position.set(0, 7.5, 40);
    wallS.castShadow = true;
    wallS.receiveShadow = true;

    // East wall
    var wallEGeo = addGeometry(new THREE.BoxGeometry(2, 15, 80));
    var wallE = addMesh(new THREE.Mesh(wallEGeo, wallMat));
    wallE.position.set(40, 7.5, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;

    // West wall
    var wallWGeo = addGeometry(new THREE.BoxGeometry(2, 15, 80));
    var wallW = addMesh(new THREE.Mesh(wallWGeo, wallMat));
    wallW.position.set(-40, 7.5, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;

    // Add blood stains (dark red patches)
    for (var i = 0; i < 20; i++) {
      var stainGeo = addGeometry(new THREE.BoxGeometry(4 + Math.random() * 3, 2 + Math.random() * 2, 0.1));
      var stainMat = createMaterial(COLORS.veryDarkRed, 0.05, 0.98);
      var stain = addMesh(new THREE.Mesh(stainGeo, stainMat));
      stain.position.set(
        -35 + Math.random() * 70,
        3 + Math.random() * 10,
        -39.5 + Math.random() * 2
      );
    }
  }

  function createBoneDecoratedBattlements() {
    // Crenellations (alternating boxes)
    var battlementMat = createMaterial(COLORS.darkRed, 0.1, 0.95);
    var skullMat = createMaterial(COLORS.boneWhite, 0.05, 0.9);

    for (var i = 0; i < 16; i++) {
      var crenGeo = addGeometry(new THREE.BoxGeometry(3, 4, 3));
      var cren = addMesh(new THREE.Mesh(crenGeo, battlementMat));
      cren.position.set(-39 + i * 5, 24.5, -40.5);
      cren.castShadow = true;

      // Skull on top of crenellation
      var skullGeo = addGeometry(new THREE.SphereGeometry(1.2, 8, 8));
      var skull = addMesh(new THREE.Mesh(skullGeo, skullMat));
      skull.position.set(-39 + i * 5, 29, -40.5);
      skull.scale.set(1, 1.3, 0.8);
      addAnimatedObject(skull, 'rattle', { originalPos: skull.position.clone(), intensity: 0.15 });
    }

    // South side crenellations
    for (var i = 0; i < 16; i++) {
      var crenGeo = addGeometry(new THREE.BoxGeometry(3, 4, 3));
      var cren = addMesh(new THREE.Mesh(crenGeo, battlementMat));
      cren.position.set(-39 + i * 5, 24.5, 40.5);
      cren.castShadow = true;

      var skullGeo = addGeometry(new THREE.SphereGeometry(1.2, 8, 8));
      var skull = addMesh(new THREE.Mesh(skullGeo, skullMat));
      skull.position.set(-39 + i * 5, 29, 40.5);
      skull.scale.set(1, 1.3, 0.8);
      addAnimatedObject(skull, 'rattle', { originalPos: skull.position.clone(), intensity: 0.15 });
    }
  }

  function createRoundTowers() {
    var towerPositions = [
      { x: -40, z: -40 },
      { x: 40, z: -40 },
      { x: -40, z: 40 },
      { x: 40, z: 40 }
    ];

    var towerMat = createMaterial(COLORS.darkBloodRed, 0.2, 0.85);
    var coneMat = createMaterial(COLORS.brightCrimson, 0.3, 0.8);

    for (var i = 0; i < towerPositions.length; i++) {
      var pos = towerPositions[i];

      // Cylinder tower body
      var towerGeo = addGeometry(new THREE.CylinderGeometry(6, 6, 20, 16));
      var tower = addMesh(new THREE.Mesh(towerGeo, towerMat));
      tower.position.set(pos.x, 10, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;

      // Cone roof
      var coneGeo = addGeometry(new THREE.ConeGeometry(6.5, 8, 16));
      var cone = addMesh(new THREE.Mesh(coneGeo, coneMat));
      cone.position.set(pos.x, 24, pos.z);
      cone.castShadow = true;

      // Tower windows
      for (var j = 0; j < 3; j++) {
        var windowGeo = addGeometry(new THREE.SphereGeometry(0.8, 8, 8));
        var windowMat = createMaterial(COLORS.ironBlack, 0.9, 0.4);
        var window = addMesh(new THREE.Mesh(windowGeo, windowMat));
        var angle = (j / 3) * Math.PI * 2;
        window.position.set(
          pos.x + Math.cos(angle) * 5.5,
          8 + j * 4,
          pos.z + Math.sin(angle) * 5.5
        );
      }
    }
  }

  function createPortcullis() {
    // Main gate structure
    var gateFrameGeo = addGeometry(new THREE.BoxGeometry(12, 16, 2));
    var gateMat = createMaterial(COLORS.ironBlack, 0.8, 0.3);
    var gateFrame = addMesh(new THREE.Mesh(gateFrameGeo, gateMat));
    gateFrame.position.set(0, 8, -40);

    // Vertical bars using LineSegments
    var barMaterial = new THREE.LineBasicMaterial({ color: COLORS.ironBlack, linewidth: 3 });
    for (var i = 0; i < 7; i++) {
      var barGeo = addGeometry(new THREE.BufferGeometry());
      var positions = new Float32Array([
        -5 + i * 1.8, -8, 0,
        -5 + i * 1.8, 8, 0
      ]);
      barGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      var bar = addMesh(new THREE.LineSegments(barGeo, barMaterial));
      bar.position.set(0, 8, -39);
    }

    // Horizontal bars
    for (var j = 0; j < 5; j++) {
      var hbarGeo = addGeometry(new THREE.BufferGeometry());
      var hpositions = new Float32Array([
        -6, -7 + j * 3.5, 0,
        6, -7 + j * 3.5, 0
      ]);
      hbarGeo.setAttribute('position', new THREE.BufferAttribute(hpositions, 3));
      var hbar = addMesh(new THREE.LineSegments(hbarGeo, barMaterial));
      hbar.position.set(0, 8, -39);
    }

    // Bar stain overlays
    for (var i = 0; i < 12; i++) {
      var stainGeo = addGeometry(new THREE.BoxGeometry(0.3, 1.5, 0.15));
      var stainMat = createMaterial(COLORS.rust, 0.7, 0.4);
      var stain = addMesh(new THREE.Mesh(stainGeo, stainMat));
      stain.position.set(-5 + Math.random() * 10, 2 + Math.random() * 10, -39.5);
    }
  }

  function createBloodRedCourtyard() {
    // Courtyard ground
    var groundGeo = addGeometry(new THREE.BoxGeometry(70, 0.5, 70));
    var groundMat = createMaterial(COLORS.veryDarkRed, 0.05, 0.95);
    var ground = addMesh(new THREE.Mesh(groundGeo, groundMat));
    ground.position.set(0, -0.25, 0);
    ground.receiveShadow = true;

    // Cobblestone details - small box variations
    for (var i = 0; i < 40; i++) {
      var stoneGeo = addGeometry(new THREE.BoxGeometry(8, 0.2, 8));
      var stoneMat = createMaterial(COLORS.deepCrimson, 0.1, 0.9);
      var stone = addMesh(new THREE.Mesh(stoneGeo, stoneMat));
      stone.position.set(-30 + Math.random() * 60, 0.1, -30 + Math.random() * 60);
    }
  }

  function createTortureImplements() {
    // Torture rack 1
    var rackFrameGeo = addGeometry(new THREE.BoxGeometry(6, 1, 10));
    var rackMat = createMaterial(COLORS.ironBlack, 0.7, 0.5);
    var rackFrame = addMesh(new THREE.Mesh(rackFrameGeo, rackMat));
    rackFrame.position.set(-15, 0.5, -15);

    // Rack vertical posts
    for (var i = 0; i < 2; i++) {
      var postGeo = addGeometry(new THREE.BoxGeometry(0.8, 3, 0.8));
      var post = addMesh(new THREE.Mesh(postGeo, rackMat));
      post.position.set(-15 + (i * 5), 1.5, -15);
    }

    // Rack chains/bars
    for (var j = 0; j < 3; j++) {
      var barGeo = addGeometry(new THREE.BoxGeometry(6, 0.3, 0.3));
      var bar = addMesh(new THREE.Mesh(barGeo, rackMat));
      bar.position.set(-15, 1 + j * 0.8, -15);
    }

    // Stake driver - vertical spikes
    for (var i = 0; i < 4; i++) {
      var spikeGeo = addGeometry(new THREE.ConeGeometry(0.5, 3, 8));
      var spikeMat = createMaterial(COLORS.ironBlack, 0.9, 0.2);
      var spike = addMesh(new THREE.Mesh(spikeGeo, spikeMat));
      spike.position.set(-15 + i * 2, 1.5, 15);
      spike.rotation.x = Math.PI;
    }

    // Gallows structure
    var gallowsPostGeo = addGeometry(new THREE.CylinderGeometry(0.8, 0.8, 10, 8));
    var gallowsMat = createMaterial(COLORS.darkStone, 0.1, 0.95);
    var gallowsPost = addMesh(new THREE.Mesh(gallowsPostGeo, gallowsMat));
    gallowsPost.position.set(20, 5, -15);

    // Gallows crossbeam
    var crossbeamGeo = addGeometry(new THREE.BoxGeometry(8, 0.8, 0.8));
    var crossbeam = addMesh(new THREE.Mesh(crossbeamGeo, gallowsMat));
    crossbeam.position.set(20, 10, -15);

    // Noose
    var nooseGeo = addGeometry(new THREE.SphereGeometry(0.3, 8, 8));
    var nooseMat = createMaterial(COLORS.ironBlack, 0.5, 0.6);
    var noose = addMesh(new THREE.Mesh(nooseGeo, nooseMat));
    noose.position.set(20, 7, -15);
  }

  function createHallOfTrophies() {
    // Hall structure - tall box
    var hallGeo = addGeometry(new THREE.BoxGeometry(20, 30, 15));
    var hallMat = createMaterial(COLORS.darkBloodRed, 0.15, 0.95);
    var hall = addMesh(new THREE.Mesh(hallGeo, hallMat));
    hall.position.set(0, 15, 30);
    hall.castShadow = true;
    hall.receiveShadow = true;

    // Weapon rack walls (boxes as weapon mounts)
    var rackMat = createMaterial(COLORS.ironBlack, 0.8, 0.4);
    for (var i = 0; i < 6; i++) {
      var swordGeo = addGeometry(new THREE.BoxGeometry(0.3, 4, 0.2));
      var sword = addMesh(new THREE.Mesh(swordGeo, rackMat));
      sword.position.set(-8 + i * 3, 10 + (i % 2) * 2, 22);
      sword.rotation.z = (i % 2) * 0.3;
    }

    for (var i = 0; i < 6; i++) {
      var swordGeo = addGeometry(new THREE.BoxGeometry(0.3, 4, 0.2));
      var sword = addMesh(new THREE.Mesh(swordGeo, rackMat));
      sword.position.set(-8 + i * 3, 10 + (i % 2) * 2, 38);
      sword.rotation.z = (i % 2) * 0.3;
    }

    // Shield decorations on walls
    for (var i = 0; i < 8; i++) {
      var shieldGeo = addGeometry(new THREE.SphereGeometry(1.5, 12, 12));
      var shieldMat = createMaterial(COLORS.brightCrimson, 0.4, 0.7);
      var shield = addMesh(new THREE.Mesh(shieldGeo, shieldMat));
      shield.position.set(-6 + i * 3, 5, 21.5);
      shield.scale.set(1, 1.3, 0.3);
    }

    // Trophy pedestal
    var pedestalGeo = addGeometry(new THREE.BoxGeometry(3, 2, 3));
    var pedestalMat = createMaterial(COLORS.darkStone, 0.1, 0.95);
    var pedestal = addMesh(new THREE.Mesh(pedestalGeo, pedestalMat));
    pedestal.position.set(0, 1, 30);

    // Trophy sphere
    var trophyGeo = addGeometry(new THREE.SphereGeometry(1.5, 12, 12));
    var trophyMat = createMaterial(COLORS.brightCrimson, 0.8, 0.3);
    var trophy = addMesh(new THREE.Mesh(trophyGeo, trophyMat));
    trophy.position.set(0, 4, 30);
  }

  function createRedTorchBraziers() {
    var torchPositions = [
      { x: -30, z: -25 },
      { x: 30, z: -25 },
      { x: -30, z: 25 },
      { x: 30, z: 25 },
      { x: -15, z: 0 },
      { x: 15, z: 0 }
    ];

    var standMat = createMaterial(COLORS.ironBlack, 0.8, 0.3);
    var fireMat = createMaterial(COLORS.brightCrimson, 0.9, 0.2);

    for (var i = 0; i < torchPositions.length; i++) {
      var pos = torchPositions[i];

      // Torch stand
      var standGeo = addGeometry(new THREE.CylinderGeometry(0.6, 0.8, 3, 8));
      var stand = addMesh(new THREE.Mesh(standGeo, standMat));
      stand.position.set(pos.x, 1.5, pos.z);
      stand.castShadow = true;

      // Fire orbs
      var fireGeo = addGeometry(new THREE.SphereGeometry(1.2, 8, 8));
      var fire = addMesh(new THREE.Mesh(fireGeo, fireMat));
      fire.position.set(pos.x, 3.5, pos.z);
      fire.castShadow = true;

      addAnimatedObject(fire, 'flicker', { originalPos: fire.position.clone(), intensity: 0.3 });

      // Glow effect - larger sphere
      var glowGeo = addGeometry(new THREE.SphereGeometry(1.5, 8, 8));
      var glowMat = createMaterial(COLORS.rust, 0.3, 0.8);
      var glow = addMesh(new THREE.Mesh(glowGeo, glowMat));
      glow.position.set(pos.x, 3.5, pos.z);
    }
  }

  function createMoatOfBlood() {
    // Moat channel
    var moatGeo = addGeometry(new THREE.BoxGeometry(85, 8, 85));
    var moatMat = createMaterial(COLORS.veryDarkRed, 0.05, 0.98);
    var moat = addMesh(new THREE.Mesh(moatGeo, moatMat));
    moat.position.set(0, -4, 0);
    moat.receiveShadow = true;

    // Moat liquid surface ripples (multiple boxes for wave effect)
    for (var i = 0; i < 12; i++) {
      var waveGeo = addGeometry(new THREE.BoxGeometry(15, 0.3, 15));
      var waveMat = createMaterial(COLORS.deepCrimson, 0.1, 0.95);
      var wave = addMesh(new THREE.Mesh(waveGeo, waveMat));
      wave.position.set(
        -30 + Math.random() * 60,
        -0.5 + Math.sin(i) * 0.2,
        -30 + Math.random() * 60
      );
      addAnimatedObject(wave, 'ripple', { originalY: wave.position.y, intensity: 0.25, phase: i });
    }

    // Moat walls (raised edges)
    var wallThickness = 2;
    var wallHeight = 4;

    // North moat wall
    var northWallGeo = addGeometry(new THREE.BoxGeometry(85, wallHeight, wallThickness));
    var wallMat = createMaterial(COLORS.darkRed, 0.1, 0.95);
    var northWall = addMesh(new THREE.Mesh(northWallGeo, wallMat));
    northWall.position.set(0, -6, -42.5);

    // South moat wall
    var southWallGeo = addGeometry(new THREE.BoxGeometry(85, wallHeight, wallThickness));
    var southWall = addMesh(new THREE.Mesh(southWallGeo, wallMat));
    southWall.position.set(0, -6, 42.5);

    // East moat wall
    var eastWallGeo = addGeometry(new THREE.BoxGeometry(wallThickness, wallHeight, 85));
    var eastWall = addMesh(new THREE.Mesh(eastWallGeo, wallMat));
    eastWall.position.set(42.5, -6, 0);

    // West moat wall
    var westWallGeo = addGeometry(new THREE.BoxGeometry(wallThickness, wallHeight, 85));
    var westWall = addMesh(new THREE.Mesh(westWallGeo, wallMat));
    westWall.position.set(-42.5, -6, 0);
  }

  function createMurderHoles() {
    var gatehouseX = 0;
    var gatehouseZ = -38;

    // Murder holes in ceiling
    for (var i = 0; i < 4; i++) {
      var holeGeo = addGeometry(new THREE.SphereGeometry(1, 8, 8));
      var holeMat = createMaterial(COLORS.ironBlack, 0.9, 0.3);
      var hole = addMesh(new THREE.Mesh(holeGeo, holeMat));
      hole.position.set(-4 + i * 3, 13, gatehouseZ);
      hole.scale.set(1, 0.4, 1);
    }

    // Portcullis damage holes
    for (var i = 0; i < 6; i++) {
      var damageGeo = addGeometry(new THREE.SphereGeometry(0.8, 8, 8));
      var damageMat = createMaterial(COLORS.ironBlack, 0.8, 0.5);
      var damage = addMesh(new THREE.Mesh(damageGeo, damageMat));
      damage.position.set(-3 + i * 2, 4 + Math.random() * 8, gatehouseZ + 0.5);
    }
  }

  function createBattleScaredWalls() {
    // Impact craters on main keep
    for (var i = 0; i < 15; i++) {
      var craterGeo = addGeometry(new THREE.SphereGeometry(1.5, 8, 8));
      var craterMat = createMaterial(COLORS.veryDarkRed, 0.05, 0.98);
      var crater = addMesh(new THREE.Mesh(craterGeo, craterMat));
      crater.position.set(
        -12 + Math.random() * 24,
        10 + Math.random() * 20,
        14
      );
    }

    // Wall damage on perimeter
    for (var i = 0; i < 10; i++) {
      var damageGeo = addGeometry(new THREE.BoxGeometry(2 + Math.random(), 3, 1.5));
      var damageMat = createMaterial(COLORS.veryDarkRed, 0.02, 0.99);
      var damage = addMesh(new THREE.Mesh(damageGeo, damageMat));
      damage.position.set(-35 + Math.random() * 70, 8 + Math.random() * 6, -39);
    }

    // Scorch marks
    for (var i = 0; i < 20; i++) {
      var scorchGeo = addGeometry(new THREE.BoxGeometry(3, 2, 0.1));
      var scorchMat = createMaterial(COLORS.ironBlack, 0.05, 0.99);
      var scorch = addMesh(new THREE.Mesh(scorchGeo, scorchMat));
      var wallChoice = Math.floor(Math.random() * 4);
      if (wallChoice === 0) {
        scorch.position.set(-35 + Math.random() * 70, 2 + Math.random() * 12, -39.5);
      } else if (wallChoice === 1) {
        scorch.position.set(-35 + Math.random() * 70, 2 + Math.random() * 12, 39.5);
      } else if (wallChoice === 2) {
        scorch.position.set(39.5, 2 + Math.random() * 12, -35 + Math.random() * 70);
      } else {
        scorch.position.set(-39.5, 2 + Math.random() * 12, -35 + Math.random() * 70);
      }
    }
  }

  function createSiegeMachineWreckage() {
    // Trebuchet ruins
    var trebuchetBaseGeo = addGeometry(new THREE.BoxGeometry(8, 0.5, 8));
    var trebuchetMat = createMaterial(COLORS.darkStone, 0.1, 0.95);
    var trebuchetBase = addMesh(new THREE.Mesh(trebuchetBaseGeo, trebuchetMat));
    trebuchetBase.position.set(-35, 0.25, -30);

    // Broken wooden beams
    var beamGeo = addGeometry(new THREE.BoxGeometry(10, 0.6, 0.6));
    var beamMat = createMaterial(COLORS.darkStone, 0.1, 0.95);
    var beam1 = addMesh(new THREE.Mesh(beamGeo, beamMat));
    beam1.position.set(-35, 2, -30);
    beam1.rotation.z = 0.4;

    var beam2 = addMesh(new THREE.Mesh(addGeometry(new THREE.BoxGeometry(8, 0.6, 0.6)), beamMat));
    beam2.position.set(-30, 3, -32);
    beam2.rotation.z = -0.6;

    // Counterweight stone
    var stoneGeo = addGeometry(new THREE.BoxGeometry(3, 3, 3));
    var stoneMat = createMaterial(COLORS.darkRed, 0.1, 0.95);
    var stone = addMesh(new THREE.Mesh(stoneGeo, stoneMat));
    stone.position.set(-42, 1.5, -25);

    // Battering ram remains
    var ramLogGeo = addGeometry(new THREE.CylinderGeometry(1.2, 1.2, 14, 8));
    var ramLogMat = createMaterial(COLORS.darkStone, 0.1, 0.95);
    var ramLog = addMesh(new THREE.Mesh(ramLogGeo, ramLogMat));
    ramLog.position.set(30, 1.5, -35);
    ramLog.rotation.z = 0.3;

    // Ram stand
    var ramStandGeo = addGeometry(new THREE.BoxGeometry(4, 2, 4));
    var ramStand = addMesh(new THREE.Mesh(ramStandGeo, ramLogMat));
    ramStand.position.set(30, 1, -35);

    // Scorpion ballista ruins
    var ballista1Geo = addGeometry(new THREE.BoxGeometry(3, 2, 10));
    var ballista1 = addMesh(new THREE.Mesh(ballista1Geo, trebuchetMat));
    ballista1.position.set(35, 0.5, 35);
    ballista1.rotation.z = 0.5;

    // Ballista arm
    var armGeo = addGeometry(new THREE.BoxGeometry(0.8, 6, 0.8));
    var arm = addMesh(new THREE.Mesh(armGeo, trebuchetMat));
    arm.position.set(35, 4, 35);
    arm.rotation.z = -0.6;

    // Broken bolts scattered
    for (var i = 0; i < 12; i++) {
      var boltGeo = addGeometry(new THREE.ConeGeometry(0.3, 2, 6));
      var boltMat = createMaterial(COLORS.ironBlack, 0.8, 0.4);
      var bolt = addMesh(new THREE.Mesh(boltGeo, boltMat));
      bolt.position.set(25 + Math.random() * 20, 0.5, 25 + Math.random() * 20);
      bolt.rotation.set(Math.random(), Math.random(), Math.random());
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    createMassiveKeep();
    createCrimsonWalls();
    createBoneDecoratedBattlements();
    createRoundTowers();
    createPortcullis();
    createBloodRedCourtyard();
    createTortureImplements();
    createHallOfTrophies();
    createRedTorchBraziers();
    createMoatOfBlood();
    createMurderHoles();
    createBattleScaredWalls();
    createSiegeMachineWreckage();

    // Add lighting
    var ambientLight = new THREE.AmbientLight(COLORS.brightCrimson, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(COLORS.brightCrimson, 0.6);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      anim.time += delta;

      if (anim.type === 'flicker') {
        var flicker = Math.sin(anim.time * 8) * anim.params.intensity;
        anim.object.position.y = anim.params.originalPos.y + flicker;
        anim.object.scale.x = 1 + Math.sin(anim.time * 6) * 0.2;
        anim.object.scale.z = 1 + Math.sin(anim.time * 6) * 0.2;
      } else if (anim.type === 'ripple') {
        var rippleOffset = Math.sin(anim.time * 2 + anim.params.phase) * anim.params.intensity;
        anim.object.position.y = anim.params.originalY + rippleOffset;
      } else if (anim.type === 'rattle') {
        var rattle = (Math.random() - 0.5) * anim.params.intensity;
        anim.object.position.x = anim.params.originalPos.x + rattle;
        anim.object.position.z = anim.params.originalPos.z + (Math.random() - 0.5) * anim.params.intensity;
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    for (var i = 0; i < geometries.length; i++) {
      geometries[i].dispose();
    }
    geometries = [];
    meshes = [];
    animatedObjects = [];
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
