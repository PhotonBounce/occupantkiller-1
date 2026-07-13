var window = window || {};

window.ThroneRoom = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var chandelier = null;
  var chandelierGroup = null;
  var torches = [];
  var glassFragments = [];
  var throne = null;
  var treasureVault = null;
  var wallBanners = [];
  var elapsedTime = 0;
  var lights = [];

  function createThroneOnDais() {
    var group = new THREE.Group();

    // Dais base - stacked ornate boxes
    var daisBaseGeometry = new THREE.BoxGeometry(6, 1.5, 6);
    var daisMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.7,
      roughness: 0.3
    });
    var daisBase = new THREE.Mesh(daisBaseGeometry, daisMaterial);
    daisBase.position.y = 0.75;
    daisBase.castShadow = true;
    daisBase.receiveShadow = true;
    group.add(daisBase);

    // Second tier - raised platform
    var secondTierGeometry = new THREE.BoxGeometry(4.5, 1, 4.5);
    var secondTier = new THREE.Mesh(secondTierGeometry, daisMaterial);
    secondTier.position.y = 2.5;
    secondTier.castShadow = true;
    secondTier.receiveShadow = true;
    group.add(secondTier);

    // Throne back - tall ornate box
    var throneBackGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    var throneMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFFB700,
      emissiveIntensity: 0.4
    });
    var throneBack = new THREE.Mesh(throneBackGeometry, throneMaterial);
    throneBack.position.set(0, 4.2, -0.5);
    throneBack.castShadow = true;
    throneBack.receiveShadow = true;
    group.add(throneBack);

    // Throne seat - main box
    var throneSeatGeometry = new THREE.BoxGeometry(2.2, 1, 2.2);
    var throneSeat = new THREE.Mesh(throneSeatGeometry, throneMaterial);
    throneSeat.position.y = 3.5;
    throneSeat.castShadow = true;
    throneSeat.receiveShadow = true;
    group.add(throneSeat);

    // Armrests - two boxes on sides
    var armrestGeometry = new THREE.BoxGeometry(0.3, 1.2, 2);
    var armrestMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC8800,
      metalness: 0.6,
      roughness: 0.4
    });
    var leftArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
    leftArmrest.position.set(-1.2, 4, 0);
    leftArmrest.castShadow = true;
    leftArmrest.receiveShadow = true;
    group.add(leftArmrest);

    var rightArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
    rightArmrest.position.set(1.2, 4, 0);
    rightArmrest.castShadow = true;
    rightArmrest.receiveShadow = true;
    group.add(rightArmrest);

    // Throne ornament - sphere on top back
    var ornamentGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var ornamentMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF99,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFDD00,
      emissiveIntensity: 0.6
    });
    var ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
    ornament.position.set(0, 5.8, -0.5);
    ornament.castShadow = true;
    ornament.receiveShadow = true;
    group.add(ornament);

    throne = group;
    return group;
  }

  function createMarblePillars() {
    var group = new THREE.Group();

    var pillarPositions = [
      { x: -8, z: -5 },
      { x: 8, z: -5 },
      { x: -8, z: 5 },
      { x: 8, z: 5 }
    ];

    var pillarGeometry = new THREE.CylinderGeometry(0.8, 1, 12, 16);
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFEE,
      metalness: 0.3,
      roughness: 0.7
    });

    pillarPositions.forEach(function(pos) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 6, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      // Capital (top ornament)
      var capitalGeometry = new THREE.CylinderGeometry(1.1, 0.8, 0.5, 16);
      var capitalMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.8,
        roughness: 0.3
      });
      var capital = new THREE.Mesh(capitalGeometry, capitalMaterial);
      capital.position.set(pos.x, 12.5, pos.z);
      capital.castShadow = true;
      capital.receiveShadow = true;
      group.add(capital);

      // Base (bottom ornament)
      var baseGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.4, 16);
      var base = new THREE.Mesh(baseGeometry, capitalMaterial);
      base.position.set(pos.x, 0.2, pos.z);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);
    });

    return group;
  }

  function createPortraitBanners() {
    var group = new THREE.Group();

    var bannerPositions = [
      { x: -12, z: 0 },
      { x: 12, z: 0 },
      { x: 0, z: -11 },
      { x: 0, z: 11 }
    ];

    var bannerColors = [0xFF0000, 0x00FF00, 0xFF00FF, 0xFFFF00];

    bannerPositions.forEach(function(pos, index) {
      var bannerGeometry = new THREE.BoxGeometry(1.5, 5, 0.3);
      var bannerMaterial = new THREE.MeshStandardMaterial({
        color: bannerColors[index],
        metalness: 0.4,
        roughness: 0.6,
        emissive: bannerColors[index],
        emissiveIntensity: 0.3
      });
      var banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
      banner.position.set(pos.x, 4, pos.z);
      banner.castShadow = true;
      banner.receiveShadow = true;
      group.add(banner);

      wallBanners.push({
        mesh: banner,
        colors: [0xFF0000, 0x00FF00, 0xFF00FF, 0xFFFF00],
        colorIndex: index
      });
    });

    return group;
  }

  function createGuardPostAlcoves() {
    var group = new THREE.Group();

    var alcovePositions = [
      { x: -11, z: -10 },
      { x: 11, z: -10 },
      { x: -11, z: 10 },
      { x: 11, z: 10 }
    ];

    alcovePositions.forEach(function(pos) {
      // Alcove frame - tall narrow box
      var alcoveGeometry = new THREE.BoxGeometry(1.2, 4, 0.8);
      var alcoveMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.5,
        roughness: 0.8
      });
      var alcove = new THREE.Mesh(alcoveGeometry, alcoveMaterial);
      alcove.position.set(pos.x, 2, pos.z);
      alcove.castShadow = true;
      alcove.receiveShadow = true;
      group.add(alcove);

      // Guard silhouette - dark cylinder inside
      var guardGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3.5, 8);
      var guardMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.3,
        roughness: 0.9
      });
      var guard = new THREE.Mesh(guardGeometry, guardMaterial);
      guard.position.set(pos.x, 1.8, pos.z);
      guard.castShadow = true;
      guard.receiveShadow = true;
      group.add(guard);
    });

    return group;
  }

  function createShatteredGlassPanel() {
    var group = new THREE.Group();

    // Create scattered glass fragments
    for (var i = 0; i < 12; i++) {
      var fragmentGeometry = new THREE.BoxGeometry(
        0.3 + Math.random() * 0.4,
        0.3 + Math.random() * 0.5,
        0.05
      );
      var glassColor = 0x88CCFF + Math.floor(Math.random() * 0x112200);
      var glassMaterial = new THREE.MeshStandardMaterial({
        color: glassColor,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.8,
        emissive: 0x4488FF,
        emissiveIntensity: 0.3
      });
      var fragment = new THREE.Mesh(fragmentGeometry, glassMaterial);
      fragment.position.set(
        -10 + Math.random() * 4,
        6 + Math.random() * 3,
        10.2 + Math.random() * 0.5
      );
      fragment.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      group.add(fragment);
      glassFragments.push(fragment);
    }

    return group;
  }

  function createGoldenFloor() {
    var group = new THREE.Group();

    var floorGeometry = new THREE.BoxGeometry(26, 0.2, 26);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.6,
      roughness: 0.4
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    group.add(floor);

    // Floor tiles pattern - darker gold borders
    for (var i = 0; i < 13; i++) {
      for (var j = 0; j < 13; j++) {
        var tileGeometry = new THREE.BoxGeometry(2, 0.05, 2);
        var tileMaterial = new THREE.MeshStandardMaterial({
          color: (i + j) % 2 === 0 ? 0xFFD700 : 0xFFB700,
          metalness: 0.6,
          roughness: 0.4
        });
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(
          -12 + i * 2,
          0.05,
          -12 + j * 2
        );
        tile.receiveShadow = true;
        group.add(tile);
      }
    }

    return group;
  }

  function createTreasureVault() {
    var group = new THREE.Group();

    // Vault door - large thick box
    var doorGeometry = new THREE.BoxGeometry(2.5, 3, 0.8);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x222222,
      emissiveIntensity: 0.2
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.5, -9.5);
    door.castShadow = true;
    door.receiveShadow = true;
    door.name = 'treasureVaultDoor';
    group.add(door);

    // Vault frame
    var frameGeometry = new THREE.BoxGeometry(3, 3.5, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.3
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 1.5, -10);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Vault dial - sphere on door
    var dialGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    var dialMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      metalness: 0.8,
      roughness: 0.2
    });
    var dial = new THREE.Mesh(dialGeometry, dialMaterial);
    dial.position.set(0, 1.5, -9.1);
    dial.castShadow = true;
    dial.receiveShadow = true;
    group.add(dial);

    // Gold bars visible inside - stacked small boxes
    for (var i = 0; i < 6; i++) {
      var barGeometry = new THREE.BoxGeometry(0.2, 1.8, 0.3);
      var barMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xFFCC00,
        emissiveIntensity: 0.5
      });
      var bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(-0.6 + i * 0.25, 1.5, -8.5);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);
    }

    treasureVault = door;
    return group;
  }

  function createRedCarpetRunner() {
    var group = new THREE.Group();

    var carpetGeometry = new THREE.BoxGeometry(3, 0.15, 8);
    var carpetMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC0000,
      metalness: 0.3,
      roughness: 0.6,
      emissive: 0x660000,
      emissiveIntensity: 0.2
    });
    var carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
    carpet.position.set(0, 0.2, 0);
    carpet.castShadow = true;
    carpet.receiveShadow = true;
    group.add(carpet);

    // Carpet edge trim - gold stripe
    var trimGeometry = new THREE.BoxGeometry(3.3, 0.1, 0.2);
    var trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.7,
      roughness: 0.3
    });
    var frontTrim = new THREE.Mesh(trimGeometry, trimMaterial);
    frontTrim.position.set(0, 0.25, -4);
    frontTrim.castShadow = true;
    frontTrim.receiveShadow = true;
    group.add(frontTrim);

    var backTrim = new THREE.Mesh(trimGeometry, trimMaterial);
    backTrim.position.set(0, 0.25, 4);
    backTrim.castShadow = true;
    backTrim.receiveShadow = true;
    group.add(backTrim);

    return group;
  }

  function createChandelierWithRods() {
    var group = new THREE.Group();

    // Main chandelier sphere
    var chandGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var chandMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFCC44,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.7
    });
    var chandelier = new THREE.Mesh(chandGeometry, chandMaterial);
    chandelier.position.y = 0;
    chandelier.castShadow = true;
    chandelier.receiveShadow = true;
    group.add(chandelier);

    // Hanging rods - cylinders extending upward
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var rodGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
      var rodMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.9,
        roughness: 0.1
      });
      var rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.position.set(
        Math.cos(angle) * 0.6,
        1.5,
        Math.sin(angle) * 0.6
      );
      rod.castShadow = true;
      rod.receiveShadow = true;
      group.add(rod);
    }

    // Hanging candles - small spheres
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var candleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var candleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD55,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0xFFCC00,
        emissiveIntensity: 0.6
      });
      var candle = new THREE.Mesh(candleGeometry, candleMaterial);
      candle.position.set(
        Math.cos(angle) * 1.2,
        -0.5,
        Math.sin(angle) * 1.2
      );
      candle.castShadow = true;
      candle.receiveShadow = true;
      group.add(candle);
    }

    chandelierGroup = group;
    return group;
  }

  function createTorchSconces() {
    var group = new THREE.Group();

    var torchPositions = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
      { x: -12, z: 0 },
      { x: 12, z: 0 }
    ];

    torchPositions.forEach(function(pos) {
      // Torch bracket - small cylinder
      var bracketGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
      var bracketMaterial = new THREE.MeshStandardMaterial({
        color: 0x884400,
        metalness: 0.5,
        roughness: 0.6
      });
      var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.set(pos.x, 7, pos.z);
      bracket.castShadow = true;
      bracket.receiveShadow = true;
      group.add(bracket);

      // Torch flame - sphere
      var flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFCC44,
        metalness: 0.3,
        roughness: 0.5,
        emissive: 0xFF8800,
        emissiveIntensity: 0.8
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(pos.x, 7.4, pos.z);
      flame.castShadow = true;
      flame.receiveShadow = true;
      group.add(flame);

      torches.push({ flame: flame, originalPos: { y: 7.4 } });
    });

    return group;
  }

  function createRoyalSealFloorEmblem() {
    var group = new THREE.Group();

    // Outer circle - large disk
    var outerGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    var sealMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      metalness: 0.7,
      roughness: 0.3
    });
    var outer = new THREE.Mesh(outerGeometry, sealMaterial);
    outer.position.set(0, 0.3, 0);
    outer.castShadow = true;
    outer.receiveShadow = true;
    group.add(outer);

    // Inner circle
    var innerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.12, 32);
    var innerMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC0000,
      metalness: 0.5,
      roughness: 0.5
    });
    var inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.set(0, 0.35, 0);
    inner.castShadow = true;
    inner.receiveShadow = true;
    group.add(inner);

    // Center emblem - sphere
    var emblemGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    var emblemMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFCC,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFDD00,
      emissiveIntensity: 0.6
    });
    var emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
    emblem.position.set(0, 0.5, 0);
    emblem.castShadow = true;
    emblem.receiveShadow = true;
    group.add(emblem);

    return group;
  }

  function createStaircaseToDais() {
    var group = new THREE.Group();

    var stepCount = 4;
    for (var i = 0; i < stepCount; i++) {
      var stepGeometry = new THREE.BoxGeometry(2.5, 0.4, 0.8);
      var stepMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.7,
        roughness: 0.4
      });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(0, 0.5 + i * 0.6, -3.5 + i * 0.8);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);
    }

    // Railing on both sides
    for (var i = 0; i < stepCount; i++) {
      var railGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
      var railMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.8,
        roughness: 0.2
      });

      var leftRail = new THREE.Mesh(railGeometry, railMaterial);
      leftRail.position.set(-1.4, 0.9 + i * 0.6, -3.5 + i * 0.8);
      leftRail.castShadow = true;
      leftRail.receiveShadow = true;
      group.add(leftRail);

      var rightRail = new THREE.Mesh(railGeometry, railMaterial);
      rightRail.position.set(1.4, 0.9 + i * 0.6, -3.5 + i * 0.8);
      rightRail.castShadow = true;
      rightRail.receiveShadow = true;
      group.add(rightRail);
    }

    return group;
  }

  function createCeremonialDoorways() {
    var group = new THREE.Group();

    var doorPositions = [
      { x: 0, z: -12 },
      { x: 0, z: 12 }
    ];

    doorPositions.forEach(function(pos) {
      // Door frame - tall box
      var frameGeometry = new THREE.BoxGeometry(3, 5, 0.5);
      var frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x884400,
        metalness: 0.5,
        roughness: 0.6
      });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, 2.5, pos.z);
      frame.castShadow = true;
      frame.receiveShadow = true;
      group.add(frame);

      // Arch top - cone shape
      var archGeometry = new THREE.ConeGeometry(1.6, 1, 16);
      var archMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        metalness: 0.7,
        roughness: 0.3
      });
      var arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(pos.x, 5.3, pos.z);
      arch.castShadow = true;
      arch.receiveShadow = true;
      group.add(arch);

      // Door panel - darker box inside
      var doorPanelGeometry = new THREE.BoxGeometry(2.5, 4.5, 0.3);
      var doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x332200,
        metalness: 0.3,
        roughness: 0.8
      });
      var doorPanel = new THREE.Mesh(doorPanelGeometry, doorMaterial);
      doorPanel.position.set(pos.x, 2.3, pos.z + 0.15);
      doorPanel.castShadow = true;
      doorPanel.receiveShadow = true;
      group.add(doorPanel);
    });

    return group;
  }

  function createWallTapestryPanels() {
    var group = new THREE.Group();

    var tapestryPositions = [
      { x: -10, z: -11.5 },
      { x: -5, z: -11.5 },
      { x: 5, z: -11.5 },
      { x: 10, z: -11.5 }
    ];

    tapestryPositions.forEach(function(pos) {
      var tapestryGeometry = new THREE.BoxGeometry(2.5, 3, 0.2);
      var tapestryMaterial = new THREE.MeshStandardMaterial({
        color: 0x663300,
        metalness: 0.2,
        roughness: 0.8
      });
      var tapestry = new THREE.Mesh(tapestryGeometry, tapestryMaterial);
      tapestry.position.set(pos.x, 3, pos.z);
      tapestry.castShadow = true;
      tapestry.receiveShadow = true;
      group.add(tapestry);
    });

    return group;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];

    // Create all throne room elements
    var throneGroup = createThroneOnDais();
    sceneObjects.push(throneGroup);
    scene.add(throneGroup);

    var pillarsGroup = createMarblePillars();
    sceneObjects.push(pillarsGroup);
    scene.add(pillarsGroup);

    var bannersGroup = createPortraitBanners();
    sceneObjects.push(bannersGroup);
    scene.add(bannersGroup);

    var guardsGroup = createGuardPostAlcoves();
    sceneObjects.push(guardsGroup);
    scene.add(guardsGroup);

    var glassGroup = createShatteredGlassPanel();
    sceneObjects.push(glassGroup);
    scene.add(glassGroup);

    var floorGroup = createGoldenFloor();
    sceneObjects.push(floorGroup);
    scene.add(floorGroup);

    var vaultGroup = createTreasureVault();
    sceneObjects.push(vaultGroup);
    scene.add(vaultGroup);

    var carpetGroup = createRedCarpetRunner();
    sceneObjects.push(carpetGroup);
    scene.add(carpetGroup);

    // Chandelier positioned high above
    var chandGroup = createChandelierWithRods();
    chandGroup.position.y = 11;
    sceneObjects.push(chandGroup);
    scene.add(chandGroup);

    var torchGroup = createTorchSconces();
    sceneObjects.push(torchGroup);
    scene.add(torchGroup);

    var sealGroup = createRoyalSealFloorEmblem();
    sceneObjects.push(sealGroup);
    scene.add(sealGroup);

    var stairsGroup = createStaircaseToDais();
    sceneObjects.push(stairsGroup);
    scene.add(stairsGroup);

    var doorwaysGroup = createCeremonialDoorways();
    sceneObjects.push(doorwaysGroup);
    scene.add(doorwaysGroup);

    var tapestryGroup = createWallTapestryPanels();
    sceneObjects.push(tapestryGroup);
    scene.add(tapestryGroup);

    // Add lights
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var pointLight = new THREE.PointLight(0xFFCC44, 1.5, 50);
    pointLight.position.set(0, 11, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    lights.push(pointLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    lights.push(dirLight);

    elapsedTime = 0;
  }

  function update(delta) {
    elapsedTime += delta;

    // Chandelier sway
    if (chandelierGroup) {
      var sway = Math.sin(elapsedTime * 0.5) * 0.15;
      chandelierGroup.position.x = sway;
      chandelierGroup.position.z = Math.cos(elapsedTime * 0.3) * 0.2;
    }

    // Torch flicker
    torches.forEach(function(torch) {
      var flicker = Math.random() * 0.2 - 0.1;
      var scale = 0.95 + Math.random() * 0.1;
      torch.flame.scale.y = scale;
      torch.flame.position.y = torch.originalPos.y + flicker;
    });

    // Glass fragment glint
    glassFragments.forEach(function(fragment, index) {
      fragment.rotation.x += 0.01 + Math.random() * 0.01;
      fragment.rotation.y += 0.02 + Math.random() * 0.01;
      var glint = Math.sin(elapsedTime * 2 + index) * 0.15;
      fragment.material.opacity = 0.6 + glint;
    });

    // Throne golden glow pulse
    if (throne) {
      var children = throne.children;
      children.forEach(function(child) {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          var pulse = 0.3 + Math.sin(elapsedTime * 1.5) * 0.2;
          child.material.emissiveIntensity = pulse;
        }
      });
    }

    // Treasury vault door slightly ajar (tempting)
    if (treasureVault) {
      var doorOpen = Math.sin(elapsedTime * 0.3) * 0.08;
      treasureVault.position.z = -9.5 + doorOpen;
    }

    // Wall banner colors cycling
    wallBanners.forEach(function(banner, index) {
      var colorCycle = Math.floor((elapsedTime * 0.5 + index) % banner.colors.length);
      var newColor = banner.colors[colorCycle];
      banner.mesh.material.color.setHex(newColor);
      banner.mesh.material.emissive.setHex(newColor);
    });
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj && obj.traverse) {
        obj.traverse(function(child) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function(mat) { mat.dispose(); });
            } else {
              child.material.dispose();
            }
          }
        });
      }
    });

    lights.forEach(function(light) {
      if (light.shadow && light.shadow.map) {
        light.shadow.map.dispose();
      }
    });

    sceneObjects = [];
    torches = [];
    glassFragments = [];
    wallBanners = [];
    lights = [];
    throne = null;
    treasureVault = null;
    chandelierGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
