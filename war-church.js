window.WarChurch = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var animationState = {
    bellRotation: 0,
    smokeParticles: [],
    flickerLights: []
  };

  var materialStone = null;
  var materialDamaged = null;
  var materialMetal = null;
  var materialWood = null;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    lights = [];

    // Initialize materials
    materialStone = new THREE.MeshStandardMaterial({
      color: 0x8B8680,
      roughness: 0.8,
      metalness: 0.1
    });
    materialDamaged = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.9,
      metalness: 0.0
    });
    materialMetal = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      roughness: 0.4,
      metalness: 0.9
    });
    materialWood = new THREE.MeshStandardMaterial({
      color: 0x6B5344,
      roughness: 0.7,
      metalness: 0.0
    });

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(40, 50, 30);
    scene.add(directionalLight);
    lights.push(directionalLight);

    // MAIN CATHEDRAL STRUCTURE
    buildMainNave();
    buildBellTowers();
    buildCryptsBelow();
    buildChoirLoft();
    buildRoof();

    // FORTIFICATION ELEMENTS
    buildSandbagPositions();
    buildOverturnedPews();
    buildFallenColumns();
    buildRubblePiles();
    buildShellDamage();

    // MILITARY ADDITIONS
    buildMilitaryTrucks();
    buildAmmoCrates();
    buildCommandPost();

    // ATMOSPHERIC ELEMENTS
    buildCandles();
    buildStainedGlassFragments();
    buildGargoyles();

    // Initialize animation state
    animationState.bellRotation = 0;
    animationState.smokeParticles = [];
    animationState.flickerLights = [];

    for (var i = 0; i < 5; i++) {
      animationState.flickerLights.push({
        light: lights[Math.floor(Math.random() * lights.length)],
        originalIntensity: 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildMainNave() {
    // Nave floor (80x30 units)
    var naveFloor = new THREE.Mesh(
      new THREE.BoxGeometry(80, 1, 30),
      materialStone
    );
    naveFloor.position.y = 0;
    naveFloor.position.z = 0;
    scene.add(naveFloor);
    meshes.push(naveFloor);

    // Nave walls (left and right)
    var naveWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1, 25, 30),
      materialDamaged
    );
    naveWallLeft.position.set(-40, 12, 0);
    scene.add(naveWallLeft);
    meshes.push(naveWallLeft);

    var naveWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 25, 30),
      materialDamaged
    );
    naveWallRight.position.set(40, 12, 0);
    scene.add(naveWallRight);
    meshes.push(naveWallRight);

    // Nave ceiling support arches (cylinders as pillars)
    for (var i = 0; i < 4; i++) {
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 24, 12),
        materialStone
      );
      pillar.position.set(-25 + i * 17, 12, -5);
      scene.add(pillar);
      meshes.push(pillar);
    }

    // Nave ceiling
    var naveCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(80, 1, 30),
      materialStone
    );
    naveCeiling.position.y = 24;
    naveCeiling.position.z = 0;
    scene.add(naveCeiling);
    meshes.push(naveCeiling);

    // Front entrance wall
    var frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(80, 25, 2),
      materialDamaged
    );
    frontWall.position.set(0, 12, 15);
    scene.add(frontWall);
    meshes.push(frontWall);

    // Altar area back wall
    var backWall = new THREE.Mesh(
      new THREE.BoxGeometry(80, 25, 2),
      materialDamaged
    );
    backWall.position.set(0, 12, -15);
    scene.add(backWall);
    meshes.push(backWall);
  }

  function buildBellTowers() {
    // Left bell tower
    var leftTowerBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 35, 8),
      materialStone
    );
    leftTowerBase.position.set(-35, 17, 12);
    scene.add(leftTowerBase);
    meshes.push(leftTowerBase);

    // Left bell tower upper section
    var leftTowerUpper = new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 6),
      materialDamaged
    );
    leftTowerUpper.position.set(-35, 40, 12);
    scene.add(leftTowerUpper);
    meshes.push(leftTowerUpper);

    // Right bell tower
    var rightTowerBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 35, 8),
      materialStone
    );
    rightTowerBase.position.set(35, 17, 12);
    scene.add(rightTowerBase);
    meshes.push(rightTowerBase);

    // Right bell tower upper section
    var rightTowerUpper = new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 6),
      materialDamaged
    );
    rightTowerUpper.position.set(35, 40, 12);
    scene.add(rightTowerUpper);
    meshes.push(rightTowerUpper);

    // Bells (cylinders)
    var leftBell = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 4, 16),
      materialMetal
    );
    leftBell.position.set(-35, 43, 12);
    leftBell.name = 'leftBell';
    scene.add(leftBell);
    meshes.push(leftBell);

    var rightBell = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 4, 16),
      materialMetal
    );
    rightBell.position.set(35, 43, 12);
    rightBell.name = 'rightBell';
    scene.add(rightBell);
    meshes.push(rightBell);
  }

  function buildCryptsBelow() {
    // Crypt entrance shaft
    var cryptShaft = new THREE.Mesh(
      new THREE.BoxGeometry(6, 12, 6),
      materialStone
    );
    cryptShaft.position.set(0, -6, 0);
    scene.add(cryptShaft);
    meshes.push(cryptShaft);

    // Crypt chamber
    var cryptFloor = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1, 25),
      materialDamaged
    );
    cryptFloor.position.set(0, -12, 0);
    scene.add(cryptFloor);
    meshes.push(cryptFloor);

    // Crypt walls
    var cryptWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 25),
      materialDamaged
    );
    cryptWallLeft.position.set(-15, -8, 0);
    scene.add(cryptWallLeft);
    meshes.push(cryptWallLeft);

    var cryptWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(1, 8, 25),
      materialDamaged
    );
    cryptWallRight.position.set(15, -8, 0);
    scene.add(cryptWallRight);
    meshes.push(cryptWallRight);

    // Ammo storage pillars
    for (var i = 0; i < 3; i++) {
      var storagePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 8, 8),
        materialMetal
      );
      storagePillar.position.set(-8 + i * 8, -8, -8);
      scene.add(storagePillar);
      meshes.push(storagePillar);
    }
  }

  function buildChoirLoft() {
    // Choir loft floor
    var choirFloor = new THREE.Mesh(
      new THREE.BoxGeometry(50, 1, 12),
      materialWood
    );
    choirFloor.position.set(0, 16, -10);
    scene.add(choirFloor);
    meshes.push(choirFloor);

    // Choir loft railing (using cylinders as balusters)
    for (var i = 0; i < 10; i++) {
      var baluster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2, 6),
        materialWood
      );
      baluster.position.set(-22 + i * 5, 17.5, -16);
      scene.add(baluster);
      meshes.push(baluster);
    }

    // Choir loft front support columns
    var choirSupport1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 15, 12),
      materialStone
    );
    choirSupport1.position.set(-20, 8, -10);
    scene.add(choirSupport1);
    meshes.push(choirSupport1);

    var choirSupport2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 15, 12),
      materialStone
    );
    choirSupport2.position.set(20, 8, -10);
    scene.add(choirSupport2);
    meshes.push(choirSupport2);
  }

  function buildRoof() {
    // Main roof (large box slanted effect via multiple boxes)
    var roofSection1 = new THREE.Mesh(
      new THREE.BoxGeometry(80, 2, 25),
      materialDamaged
    );
    roofSection1.position.set(0, 24, -5);
    roofSection1.rotation.z = 0.1;
    scene.add(roofSection1);
    meshes.push(roofSection1);

    var roofSection2 = new THREE.Mesh(
      new THREE.BoxGeometry(80, 2, 25),
      materialDamaged
    );
    roofSection2.position.set(0, 26, 5);
    roofSection2.rotation.z = -0.1;
    scene.add(roofSection2);
    meshes.push(roofSection2);

    // Roof damage holes (represented by empty space)
    var roofDamage1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    roofDamage1.position.set(-25, 25, 0);
    scene.add(roofDamage1);
    meshes.push(roofDamage1);

    var roofDamage2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    roofDamage2.position.set(20, 26, -8);
    scene.add(roofDamage2);
    meshes.push(roofDamage2);
  }

  function buildSandbagPositions() {
    // Sandbag stacks at doorways and windows
    for (var i = 0; i < 6; i++) {
      var sandbag = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x8B7355 })
      );
      sandbag.position.set(-35 + i * 14, 1, 14);
      scene.add(sandbag);
      meshes.push(sandbag);
    }

    // Additional sandbag rows
    for (var i = 0; i < 4; i++) {
      var sandbag2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x8B7355 })
      );
      sandbag2.position.set(-38, 1, -10 + i * 6);
      scene.add(sandbag2);
      meshes.push(sandbag2);
    }
  }

  function buildOverturnedPews() {
    // Overturned wooden pews as barricades
    for (var i = 0; i < 5; i++) {
      var pew = new THREE.Mesh(
        new THREE.BoxGeometry(12, 1, 2),
        materialWood
      );
      pew.position.set(-30 + i * 15, 2, 5);
      pew.rotation.z = Math.PI / 6;
      scene.add(pew);
      meshes.push(pew);
    }

    // Vertical pew fragments
    for (var i = 0; i < 6; i++) {
      var pewFragment = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 3, 0.8),
        materialWood
      );
      pewFragment.position.set(-25 + i * 10, 2, 0);
      pewFragment.rotation.z = 0.3;
      scene.add(pewFragment);
      meshes.push(pewFragment);
    }
  }

  function buildFallenColumns() {
    // Fallen columns from collapsed sections
    var fallenColumn1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 20, 16),
      materialStone
    );
    fallenColumn1.position.set(-20, 3, -8);
    fallenColumn1.rotation.z = Math.PI / 2;
    scene.add(fallenColumn1);
    meshes.push(fallenColumn1);

    var fallenColumn2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 18, 14),
      materialDamaged
    );
    fallenColumn2.position.set(25, 2, 8);
    fallenColumn2.rotation.z = Math.PI / 2.2;
    scene.add(fallenColumn2);
    meshes.push(fallenColumn2);

    // Column base pieces
    for (var i = 0; i < 3; i++) {
      var columnBase = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 3),
        materialStone
      );
      columnBase.position.set(-15 + i * 15, 0.5, 5);
      scene.add(columnBase);
      meshes.push(columnBase);
    }
  }

  function buildRubblePiles() {
    // Rubble piles for cover
    for (var i = 0; i < 8; i++) {
      var rubble = new THREE.Mesh(
        new THREE.BoxGeometry(
          2 + Math.random() * 2,
          1 + Math.random() * 2,
          2 + Math.random() * 2
        ),
        materialDamaged
      );
      rubble.position.set(
        -30 + Math.random() * 60,
        1 + Math.random() * 2,
        -10 + Math.random() * 20
      );
      rubble.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI,
        Math.random() * 0.5
      );
      scene.add(rubble);
      meshes.push(rubble);
    }
  }

  function buildShellDamage() {
    // Shell crater in floor
    var crater = new THREE.Mesh(
      new THREE.ConeGeometry(5, 2, 16),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    );
    crater.position.set(10, 1, -5);
    crater.rotation.x = Math.PI;
    scene.add(crater);
    meshes.push(crater);

    // Shell hole in wall
    var wallHole = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    wallHole.position.set(39, 15, 8);
    scene.add(wallHole);
    meshes.push(wallHole);

    // Bullet scarring (small spheres)
    for (var i = 0; i < 12; i++) {
      var bulletHole = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 4, 4),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      bulletHole.position.set(
        -35 + Math.random() * 5,
        5 + Math.random() * 15,
        14.9
      );
      scene.add(bulletHole);
      meshes.push(bulletHole);
    }
  }

  function buildMilitaryTrucks() {
    // First military truck (cargo truck)
    var truck1Body = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x556B2F })
    );
    truck1Body.position.set(-25, 1.5, 25);
    scene.add(truck1Body);
    meshes.push(truck1Body);

    var truck1Cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x556B2F })
    );
    truck1Cabin.position.set(-25, 2, 29);
    scene.add(truck1Cabin);
    meshes.push(truck1Cabin);

    // Truck wheels (cylinders)
    for (var i = 0; i < 4; i++) {
      var wheel1 = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
      );
      wheel1.position.set(-27 + (i % 2) * 4, 1, 22 + Math.floor(i / 2) * 7);
      scene.add(wheel1);
      meshes.push(wheel1);
    }

    // Second military truck
    var truck2Body = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x556B2F })
    );
    truck2Body.position.set(20, 1.5, 28);
    scene.add(truck2Body);
    meshes.push(truck2Body);

    var truck2Cabin = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x556B2F })
    );
    truck2Cabin.position.set(20, 2, 32);
    scene.add(truck2Cabin);
    meshes.push(truck2Cabin);

    // Truck 2 wheels
    for (var i = 0; i < 4; i++) {
      var wheel2 = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
      );
      wheel2.position.set(18 + (i % 2) * 4, 1, 25 + Math.floor(i / 2) * 7);
      scene.add(wheel2);
      meshes.push(wheel2);
    }
  }

  function buildAmmoCrates() {
    // Ammunition crate stacks
    for (var x = 0; x < 2; x++) {
      for (var y = 0; y < 3; y++) {
        var crate = new THREE.Mesh(
          new THREE.BoxGeometry(2, 2, 2),
          new THREE.MeshStandardMaterial({ color: 0x8B4513 })
        );
        crate.position.set(-32 + x * 4, 1 + y * 2, 5);
        scene.add(crate);
        meshes.push(crate);
      }
    }

    // Medical supply boxes
    for (var i = 0; i < 4; i++) {
      var medBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 2.5),
        new THREE.MeshStandardMaterial({ color: 0xDC143C })
      );
      medBox.position.set(15 + i * 3, 1, -3);
      scene.add(medBox);
      meshes.push(medBox);
    }
  }

  function buildCommandPost() {
    // Command post elevated platform
    var commandPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.5, 8),
      materialMetal
    );
    commandPlatform.position.set(0, 8, -12);
    scene.add(commandPlatform);
    meshes.push(commandPlatform);

    // Command post pillars
    var pillar1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 7, 10),
      materialStone
    );
    pillar1.position.set(-5, 3.5, -12);
    scene.add(pillar1);
    meshes.push(pillar1);

    var pillar2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 7, 10),
      materialStone
    );
    pillar2.position.set(5, 3.5, -12);
    scene.add(pillar2);
    meshes.push(pillar2);

    // Radar/communications sphere on top
    var radarDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xAA5500 })
    );
    radarDome.position.set(0, 10, -12);
    scene.add(radarDome);
    meshes.push(radarDome);
  }

  function buildCandles() {
    // Candle light sources around the cathedral
    for (var i = 0; i < 6; i++) {
      var candleLight = new THREE.PointLight(0xFFAA00, 1, 15);
      candleLight.position.set(-25 + i * 10, 8, -8);
      scene.add(candleLight);
      lights.push(candleLight);

      // Candle geometry
      var candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0xFFDD00 })
      );
      candle.position.set(-25 + i * 10, 7, -8);
      scene.add(candle);
      meshes.push(candle);

      // Flame
      var flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 1, 6),
        new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF6600 })
      );
      flame.position.set(-25 + i * 10, 9, -8);
      scene.add(flame);
      meshes.push(flame);
    }
  }

  function buildStainedGlassFragments() {
    // Shattered stained glass window fragments
    var glassColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];

    for (var i = 0; i < 15; i++) {
      var glassFragment = new THREE.Mesh(
        new THREE.BoxGeometry(
          1 + Math.random() * 2,
          2 + Math.random() * 2,
          0.2
        ),
        new THREE.MeshStandardMaterial({
          color: glassColors[i % glassColors.length],
          emissive: glassColors[i % glassColors.length],
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.6
        })
      );
      glassFragment.position.set(
        -38 + Math.random() * 5,
        8 + Math.random() * 12,
        14.8
      );
      glassFragment.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI,
        Math.random() * 0.3
      );
      scene.add(glassFragment);
      meshes.push(glassFragment);
    }
  }

  function buildGargoyles() {
    // Fallen gargoyles as cover objects
    var gargoyle1 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
    );
    gargoyle1.position.set(-30, 2, -10);
    scene.add(gargoyle1);
    meshes.push(gargoyle1);

    // Gargoyle wings (cone shapes)
    var wing1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
    );
    wing1.position.set(-32, 3, -10);
    wing1.rotation.z = Math.PI / 4;
    scene.add(wing1);
    meshes.push(wing1);

    var wing2 = new THREE.Mesh(
      new THREE.ConeGeometry(1.5, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d3d3d })
    );
    wing2.position.set(-28, 3, -10);
    wing2.rotation.z = -Math.PI / 4;
    scene.add(wing2);
    meshes.push(wing2);

    // Second gargoyle
    var gargoyle2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.8, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    );
    gargoyle2.position.set(28, 2, 5);
    scene.add(gargoyle2);
    meshes.push(gargoyle2);

    // Gargoyle 2 wings
    var wing3 = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    );
    wing3.position.set(30, 3, 5);
    wing3.rotation.z = Math.PI / 3.5;
    scene.add(wing3);
    meshes.push(wing3);

    var wing4 = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
    );
    wing4.position.set(26, 3, 5);
    wing4.rotation.z = -Math.PI / 3.5;
    scene.add(wing4);
    meshes.push(wing4);
  }

  function update(delta) {
    if (!scene || !camera) return;

    // Bell ringing animation
    animationState.bellRotation += delta * 0.5;
    var bellSwing = Math.sin(animationState.bellRotation) * 0.15;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.name === 'leftBell') {
        mesh.rotation.z = bellSwing;
      } else if (mesh.name === 'rightBell') {
        mesh.rotation.z = -bellSwing;
      }
    }

    // Flickering candle lights
    for (var i = 0; i < animationState.flickerLights.length; i++) {
      var flicker = animationState.flickerLights[i];
      flicker.phase += delta * 2;
      var fluxIntensity = flicker.originalIntensity +
        Math.sin(flicker.phase) * 0.2 +
        Math.random() * 0.1;
      flicker.light.intensity = Math.max(0.2, fluxIntensity);
    }

    // Smoke particle simulation
    if (animationState.smokeParticles.length < 20) {
      animationState.smokeParticles.push({
        x: -25 + Math.random() * 50,
        y: Math.random() * 3,
        z: -10 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.3 + 0.2,
        vz: (Math.random() - 0.5) * 0.5,
        life: 1.0,
        size: 0.5 + Math.random() * 1
      });
    }

    // Update smoke particles
    for (var i = animationState.smokeParticles.length - 1; i >= 0; i--) {
      var particle = animationState.smokeParticles[i];
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.z += particle.vz * delta;
      particle.life -= delta * 0.5;

      if (particle.life <= 0) {
        animationState.smokeParticles.splice(i, 1);
      }
    }
  }

  function reset() {
    // Clear animation state
    animationState.bellRotation = 0;
    animationState.smokeParticles = [];
    animationState.flickerLights = [];

    // Reset all mesh positions/rotations to initial state
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].userData.initialPosition) {
        meshes[i].position.copy(meshes[i].userData.initialPosition);
      }
      if (meshes[i].userData.initialRotation) {
        meshes[i].rotation.copy(meshes[i].userData.initialRotation);
      }
    }

    // Reset lights
    for (var i = 0; i < lights.length; i++) {
      if (lights[i].userData.initialIntensity) {
        lights[i].intensity = lights[i].userData.initialIntensity;
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
