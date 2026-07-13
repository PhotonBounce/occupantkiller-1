window.SlumWarfare = (function() {
  'use strict';

  var scene, camera;
  var shanties = [];
  var rooftopPositions = [];
  var laundryLines = [];
  var waterBarrels = [];
  var lightBulbs = [];
  var wires = [];
  var satelliteDishes = [];
  var bossHouse = null;
  var bossSpotlight = null;
  var alleyGates = [];
  var barricades = [];
  var spawnPoints = [];
  var animationState = {
    time: 0,
    bossSpotlightAngle: 0,
    explosionFlash: 0,
    wireWaveOffset: 0
  };

  var colors = {
    concreteGray: 0x808080,
    tinSilver: 0xC0C0C0,
    tinRust: 0x8B6914,
    alleyShadow: 0x2a2a2a,
    cartelRed: 0xCC0000,
    nightGlow: 0xFF8C00,
    bossGold: 0xFFD700,
    barrelBrown: 0x654321,
    laundryWhite: 0xF5F5F5
  };

  function createShantyShelter(x, y, z, width, height, depth) {
    var group = new THREE.Group();

    var mainWall = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.9 })
    );
    mainWall.position.set(x, y + height / 2, z);
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    group.add(mainWall);

    var roofHeight = 0.3;
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1, roofHeight, depth + 1),
      new THREE.MeshStandardMaterial({ color: colors.tinRust, roughness: 0.8 })
    );
    roof.position.set(x, y + height + roofHeight / 2, z);
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    var ridgeStrip = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1, 0.15, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.7 })
    );
    ridgeStrip.position.set(x, y + height + roofHeight + 0.1, z);
    group.add(ridgeStrip);

    shanties.push(group);
    return group;
  }

  function createWaterBarrel(x, y, z) {
    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: colors.barrelBrown, roughness: 0.8 })
    );
    barrel.position.set(x, y + 0.5, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;

    var barrelLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: colors.tinSilver, roughness: 0.6 })
    );
    barrelLid.position.set(x, y + 1.05, z);
    barrelLid.castShadow = true;

    waterBarrels.push({
      barrel: barrel,
      lid: barrelLid,
      drippingTime: 0
    });

    return { barrel: barrel, lid: barrelLid };
  }

  function createLaundryLine(x, y, z, length) {
    var linePoints = [
      new THREE.Vector3(x - length / 2, y, z),
      new THREE.Vector3(x + length / 2, y, z)
    ];
    var lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    var line = new THREE.LineSegments(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 2 })
    );

    var clothingItems = [];
    var numClothes = 4;
    for (var i = 0; i < numClothes; i++) {
      var clothX = x - length / 2 + (i + 1) * (length / (numClothes + 1));
      var clothY = y - 0.3;
      var cloth = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.3, 0.05),
        new THREE.MeshStandardMaterial({ color: colors.laundryWhite, roughness: 0.5 })
      );
      cloth.position.set(clothX, clothY, z);
      cloth.castShadow = true;
      clothingItems.push({ mesh: cloth, baseX: clothX, baseY: clothY });
    }

    laundryLines.push({
      line: line,
      clothes: clothingItems,
      swayPhase: Math.random() * Math.PI * 2
    });

    return { line: line, clothes: clothingItems };
  }

  function createSatelliteDish(x, y, z, size) {
    var dish = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.8, size * 0.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.7, roughness: 0.3 })
    );
    dish.position.set(x, y, z);
    dish.rotation.x = -0.3;
    dish.castShadow = true;

    var bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, size * 0.7, 0.15),
      new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.8 })
    );
    bracket.position.set(x, y - size * 0.3, z - size * 0.2);

    satelliteDishes.push({
      dish: dish,
      bracket: bracket,
      baseRotation: dish.rotation.copy()
    });

    return { dish: dish, bracket: bracket };
  }

  function createBossHouse(x, y, z) {
    var group = new THREE.Group();

    var mainStructure = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.85 })
    );
    mainStructure.position.set(x, y + 2.5, z);
    mainStructure.castShadow = true;
    mainStructure.receiveShadow = true;
    group.add(mainStructure);

    var concreteWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
    );
    concreteWall1.position.set(x - 3, y + 2, z);
    concreteWall1.castShadow = true;
    group.add(concreteWall1);

    var concreteWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 })
    );
    concreteWall2.position.set(x + 3, y + 2, z);
    concreteWall2.castShadow = true;
    group.add(concreteWall2);

    var roofBoss = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.4, 6.5),
      new THREE.MeshStandardMaterial({ color: colors.tinRust, roughness: 0.75 })
    );
    roofBoss.position.set(x, y + 5.2, z);
    roofBoss.castShadow = true;
    group.add(roofBoss);

    var spotlightBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: colors.bossGold, metalness: 0.9 })
    );
    spotlightBase.position.set(x, y + 5.4, z);
    group.add(spotlightBase);

    var spotlightLight = new THREE.SpotLight(0xFFFF99, 1.5, 40, Math.PI / 3, 0.5, 1);
    spotlightLight.position.set(x, y + 5.5, z);
    spotlightLight.target.position.set(x, y, z + 15);
    spotlightLight.castShadow = true;
    group.add(spotlightLight);
    group.add(spotlightLight.target);

    bossHouse = group;
    bossSpotlight = spotlightLight;
    return group;
  }

  function createBarricade(x, y, z) {
    var group = new THREE.Group();

    var baseLog1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.95 })
    );
    baseLog1.position.set(x, y + 0.15, z);
    baseLog1.castShadow = true;
    group.add(baseLog1);

    var baseLog2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.95 })
    );
    baseLog2.position.set(x, y + 0.6, z);
    baseLog2.castShadow = true;
    group.add(baseLog2);

    var rubblePile = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 })
    );
    rubblePile.position.set(x - 1, y + 1.6, z + 0.8);
    rubblePile.castShadow = true;
    group.add(rubblePile);

    var metalSheetLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2, 2),
      new THREE.MeshStandardMaterial({ color: colors.tinSilver, roughness: 0.4, metalness: 0.6 })
    );
    metalSheetLeft.position.set(x - 2.3, y + 1, z);
    metalSheetLeft.castShadow = true;
    group.add(metalSheetLeft);

    var metalSheetRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 2, 2),
      new THREE.MeshStandardMaterial({ color: colors.tinSilver, roughness: 0.4, metalness: 0.6 })
    );
    metalSheetRight.position.set(x + 2.3, y + 1, z);
    metalSheetRight.castShadow = true;
    group.add(metalSheetRight);

    barricades.push({ group: group, oscillationPhase: Math.random() * Math.PI * 2 });
    return group;
  }

  function createStaircaseAlley(x, y, z, numSteps) {
    var group = new THREE.Group();
    var stepWidth = 1.5;
    var stepHeight = 0.4;
    var stepDepth = 0.6;

    for (var i = 0; i < numSteps; i++) {
      var stepX = x;
      var stepY = y + i * stepHeight;
      var stepZ = z + i * stepDepth;

      var step = new THREE.Mesh(
        new THREE.BoxGeometry(stepWidth, 0.2, stepDepth),
        new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.9 })
      );
      step.position.set(stepX, stepY, stepZ);
      step.castShadow = true;
      step.receiveShadow = true;
      group.add(step);

      if (i > 0) {
        var riser = new THREE.Mesh(
          new THREE.BoxGeometry(stepWidth, stepHeight - 0.1, 0.1),
          new THREE.MeshStandardMaterial({ color: colors.alleyShadow, roughness: 0.9 })
        );
        riser.position.set(stepX, stepY - stepHeight / 2 + 0.05, stepZ - stepDepth / 2);
        riser.castShadow = true;
        group.add(riser);
      }
    }

    return group;
  }

  function createElectricalWires(x, y, z) {
    var wirePositions = [
      { start: new THREE.Vector3(x - 5, y + 3, z), end: new THREE.Vector3(x + 5, y + 2.5, z + 2) },
      { start: new THREE.Vector3(x - 3, y + 4, z + 1), end: new THREE.Vector3(x + 4, y + 3, z + 3) },
      { start: new THREE.Vector3(x - 4, y + 2, z - 2), end: new THREE.Vector3(x + 3, y + 2.5, z + 1) },
      { start: new THREE.Vector3(x - 2, y + 5, z - 1), end: new THREE.Vector3(x + 5, y + 4, z + 2) }
    ];

    wirePositions.forEach(function(wirePair) {
      var points = [wirePair.start, wirePair.end];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 1 })
      );
      wires.push({ line: line, baseStart: wirePair.start.clone(), baseEnd: wirePair.end.clone() });
    });
  }

  function createRooftopPosition(x, y, z) {
    var group = new THREE.Group();

    var sandbag1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xA4A460, roughness: 0.95 })
    );
    sandbag1.position.set(x - 0.8, y + 0.2, z);
    sandbag1.castShadow = true;
    group.add(sandbag1);

    var sandbag2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 2),
      new THREE.MeshStandardMaterial({ color: 0xA4A460, roughness: 0.95 })
    );
    sandbag2.position.set(x + 0.8, y + 0.2, z);
    sandbag2.castShadow = true;
    group.add(sandbag2);

    var lookoutPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.85 })
    );
    lookoutPost.position.set(x, y + 0.75, z);
    lookoutPost.castShadow = true;
    group.add(lookoutPost);

    rooftopPositions.push({ group: group, position: { x: x, y: y, z: z }, time: 0 });
    return group;
  }

  function createStreetVendorWreck(x, y, z) {
    var group = new THREE.Group();

    var cartBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.5, 1),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 })
    );
    cartBase.position.set(x, y + 0.25, z);
    cartBase.castShadow = true;
    group.add(cartBase);

    var cartTop = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 1.5),
      new THREE.MeshStandardMaterial({ color: colors.tinSilver, roughness: 0.5 })
    );
    cartTop.position.set(x, y + 1, z);
    cartTop.rotation.z = 0.3;
    cartTop.castShadow = true;
    group.add(cartTop);

    var wheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
    );
    wheel1.position.set(x - 0.6, y + 0.35, z - 0.5);
    wheel1.rotation.z = Math.PI / 2;
    group.add(wheel1);

    var wheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 })
    );
    wheel2.position.set(x + 0.6, y + 0.35, z - 0.5);
    wheel2.rotation.z = Math.PI / 2;
    group.add(wheel2);

    var umbrellaPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 })
    );
    umbrellaPost.position.set(x + 0.3, y + 1.5, z);
    umbrellaPost.rotation.z = 0.4;
    group.add(umbrellaPost);

    var umbrella = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: colors.cartelRed, roughness: 0.6 })
    );
    umbrella.position.set(x + 0.7, y + 2.2, z);
    umbrella.castShadow = true;
    group.add(umbrella);

    return group;
  }

  function createRainCatchmentTank(x, y, z) {
    var tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.8 })
    );
    tank.position.set(x, y + 0.9, z);
    tank.castShadow = true;
    tank.receiveShadow = true;

    var cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.75 })
    );
    cap.position.set(x, y + 1.9, z);
    cap.castShadow = true;

    return { tank: tank, cap: cap };
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    spawnPoints = [
      { x: -15, y: 0, z: 0, name: 'alleyEntry' },
      { x: -5, y: 3, z: 5, name: 'midpointStaircase' },
      { x: 5, y: 2, z: 8, name: 'waterBarrelCluster' },
      { x: 8, y: 6, z: -5, name: 'rooftop' },
      { x: 0, y: 5, z: 12, name: 'bossHouseApproach' }
    ];

    var shanty1 = createShantyShelter(-10, 0, -2, 4, 3, 3);
    scene.add(shanty1);

    var shanty2 = createShantyShelter(-6, 1, 2, 3.5, 3.5, 3);
    scene.add(shanty2);

    var shanty3 = createShantyShelter(-2, 0, -4, 4, 2.5, 3);
    scene.add(shanty3);

    var shanty4 = createShantyShelter(4, 2, 1, 3, 3, 3);
    scene.add(shanty4);

    var shanty5 = createShantyShelter(2, 3, 5, 3.5, 3, 3);
    scene.add(shanty5);

    var barrelCluster1 = createWaterBarrel(5, 0, 8);
    scene.add(barrelCluster1.barrel);
    scene.add(barrelCluster1.lid);

    var barrelCluster2 = createWaterBarrel(7, 0, 7);
    scene.add(barrelCluster2.barrel);
    scene.add(barrelCluster2.lid);

    var barrelCluster3 = createWaterBarrel(6, 0, 10);
    scene.add(barrelCluster3.barrel);
    scene.add(barrelCluster3.lid);

    var laundry1 = createLaundryLine(-8, 4, 0, 5);
    scene.add(laundry1.line);
    laundry1.clothes.forEach(function(cloth) {
      scene.add(cloth.mesh);
    });

    var laundry2 = createLaundryLine(2, 5, 3, 4);
    scene.add(laundry2.line);
    laundry2.clothes.forEach(function(cloth) {
      scene.add(cloth.mesh);
    });

    var dish1 = createSatelliteDish(-8, 3.5, -3, 1.2);
    scene.add(dish1.dish);
    scene.add(dish1.bracket);

    var dish2 = createSatelliteDish(4, 5.5, 2, 1);
    scene.add(dish2.dish);
    scene.add(dish2.bracket);

    var dish3 = createSatelliteDish(1, 3, 7, 0.9);
    scene.add(dish3.dish);
    scene.add(dish3.bracket);

    var barricade1 = createBarricade(-10, 0, 10);
    scene.add(barricade1);

    var barricade2 = createBarricade(8, 0, 0);
    scene.add(barricade2);

    var staircase = createStaircaseAlley(-3, 0, 0, 8);
    scene.add(staircase);

    createElectricalWires(0, 3, 3);
    wires.forEach(function(wire) {
      scene.add(wire.line);
    });

    var rooftop1 = createRooftopPosition(-8, 3.5, 0);
    scene.add(rooftop1);

    var rooftop2 = createRooftopPosition(4, 5.5, 2);
    scene.add(rooftop2);

    var vendorWreck = createStreetVendorWreck(-12, 0, 5);
    scene.add(vendorWreck);

    var tank1 = createRainCatchmentTank(8, 0, 8);
    scene.add(tank1.tank);
    scene.add(tank1.cap);

    var tank2 = createRainCatchmentTank(10, 0, 10);
    scene.add(tank2.tank);
    scene.add(tank2.cap);

    var bossHouseGroup = createBossHouse(0, 4, 14);
    scene.add(bossHouseGroup);

    var ambientLight = new THREE.AmbientLight(0xFFFFCC, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFF99, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var pointLightAlley = new THREE.PointLight(colors.nightGlow, 0.5, 20);
    pointLightAlley.position.set(-5, 2, 0);
    scene.add(pointLightAlley);

    var pointLightBarrels = new THREE.PointLight(colors.nightGlow, 0.4, 15);
    pointLightBarrels.position.set(6, 1, 9);
    scene.add(pointLightBarrels);
  }

  function update(delta) {
    animationState.time += delta;
    animationState.bossSpotlightAngle += delta * 0.5;
    animationState.wireWaveOffset += delta * 0.3;

    laundryLines.forEach(function(laundry) {
      var swayAmount = Math.sin(animationState.time + laundry.swayPhase) * 0.08;
      laundry.clothes.forEach(function(cloth) {
        cloth.mesh.position.x = cloth.baseX + swayAmount;
        cloth.mesh.position.y = cloth.baseY + Math.cos(animationState.time + laundry.swayPhase) * 0.04;
        cloth.mesh.rotation.z = swayAmount * 0.5;
      });
    });

    rooftopPositions.forEach(function(rooftop) {
      rooftop.time += delta;
      var patrolX = rooftop.position.x + Math.sin(rooftop.time * 0.8) * 1.5;
      var patrolZ = rooftop.position.z + Math.cos(rooftop.time * 0.6) * 1.2;
      rooftop.group.position.x = patrolX - rooftop.position.x;
      rooftop.group.position.z = patrolZ - rooftop.position.z;
    });

    lightBulbs.forEach(function(bulb) {
      if (bulb.mesh) {
        bulb.mesh.position.y += Math.sin(animationState.time * 2 + bulb.phase) * 0.003;
        bulb.intensity = 0.6 + Math.sin(animationState.time * 3 + bulb.phase) * 0.2;
      }
    });

    waterBarrels.forEach(function(barrel) {
      barrel.drippingTime += delta;
      if (barrel.drippingTime > 2) {
        var dropX = barrel.barrel.position.x + (Math.random() - 0.5) * 0.3;
        var dropY = barrel.barrel.position.y - 0.5;
        var dropZ = barrel.barrel.position.z;
        barrel.drippingTime = 0;
      }
    });

    barricades.forEach(function(barricade) {
      var oscillation = Math.sin(animationState.time * 0.5 + barricade.oscillationPhase) * 0.02;
      barricade.group.rotation.z = oscillation;
    });

    if (bossSpotlight) {
      bossSpotlight.position.x = bossSpotlight.position.x + Math.sin(animationState.bossSpotlightAngle) * 0.1;
      bossSpotlight.target.position.x = bossSpotlight.target.position.x + Math.sin(animationState.bossSpotlightAngle) * 0.5;
      bossSpotlight.intensity = 1.2 + Math.sin(animationState.time * 0.7) * 0.3;
    }

    wires.forEach(function(wire) {
      var waveY = Math.sin(animationState.wireWaveOffset + wire.line.position.x * 0.1) * 0.15;
      var positions = wire.line.geometry.attributes.position.array;
      positions[1] = wire.baseEnd.y + waveY;
      wire.line.geometry.attributes.position.needsUpdate = true;
    });

    satelliteDishes.forEach(function(dish) {
      dish.dish.rotation.y += delta * 0.15;
    });

    animationState.explosionFlash = Math.max(0, animationState.explosionFlash - delta);
  }

  function reset() {
    shanties = [];
    rooftopPositions = [];
    laundryLines = [];
    waterBarrels = [];
    lightBulbs = [];
    wires = [];
    satelliteDishes = [];
    bossHouse = null;
    bossSpotlight = null;
    alleyGates = [];
    barricades = [];
    spawnPoints = [];

    animationState.time = 0;
    animationState.bossSpotlightAngle = 0;
    animationState.explosionFlash = 0;
    animationState.wireWaveOffset = 0;

    var objectsToRemove = [];
    scene.traverse(function(child) {
      if (child !== scene && child.parent === scene) {
        objectsToRemove.push(child);
      }
    });

    objectsToRemove.forEach(function(obj) {
      scene.remove(obj);
    });
  }

  return {
    init: init,
    update: update,
    reset: reset,
    spawnPoints: spawnPoints
  };
}());
