window.AncientRuins = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var ruinObjects = [];
  var animationState = {
    time: 0,
    trapStates: {},
    mercenaryPositions: []
  };

  var COLORS = {
    stone: 0x8B7355,
    darkStone: 0x5C4033,
    moss: 0x4A7C59,
    gold: 0xFFD700,
    amber: 0xFFA500,
    purple: 0x4B0082,
    gray: 0x808080,
    lightGray: 0xA9A9A9
  };

  var SPAWN_POINTS = [
    { x: -15, y: 0, z: 20 },
    { x: 15, y: 0, z: 20 },
    { x: -20, y: 2, z: -5 },
    { x: 20, y: 2, z: -5 },
    { x: 0, y: -8, z: 0 }
  ];

  function createCrumblingColumn(x, z) {
    var columnGroup = new THREE.Group();

    var cylinderGeom = new THREE.CylinderGeometry(1.2, 1.3, 8, 16);
    var stoneMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.8, metalness: 0.1 });
    var cylinder = new THREE.Mesh(cylinderGeom, stoneMat);
    cylinder.position.set(x, 4, z);
    columnGroup.add(cylinder);

    for (var i = 0; i < 8; i++) {
      var chunkGeom = new THREE.BoxGeometry(0.6, 0.4, 0.8);
      var chunkMat = new THREE.MeshStandardMaterial({ color: COLORS.darkStone, roughness: 0.9, metalness: 0.05 });
      var chunk = new THREE.Mesh(chunkGeom, chunkMat);
      chunk.position.set(x + (Math.random() - 0.5) * 2, 2 + Math.random() * 6, z + (Math.random() - 0.5) * 2);
      chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      columnGroup.add(chunk);
    }

    return columnGroup;
  }

  function createTempleWall(x, z, width, height) {
    var wallGroup = new THREE.Group();

    var baseGeom = new THREE.BoxGeometry(width, height, 0.6);
    var wallMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.85, metalness: 0.08 });
    var wall = new THREE.Mesh(baseGeom, wallMat);
    wall.position.set(x, height / 2, z);
    wallGroup.add(wall);

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var reliefGeom = new THREE.BoxGeometry(0.3, 0.4, 0.15);
        var reliefMat = new THREE.MeshStandardMaterial({ color: COLORS.darkStone, roughness: 0.9 });
        var relief = new THREE.Mesh(reliefGeom, reliefMat);
        relief.position.set(x - width / 2 + 2 + i * (width / 4), 1 + j * 1.5, z + 0.4);
        wallGroup.add(relief);
      }
    }

    return wallGroup;
  }

  function createUndergroundStaircase(x, z) {
    var stairGroup = new THREE.Group();

    for (var i = 0; i < 12; i++) {
      var stepGeom = new THREE.BoxGeometry(3, 0.4, 1.5);
      var stepMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.85 });
      var step = new THREE.Mesh(stepGeom, stepMat);
      step.position.set(x, -2 - i * 0.8, z + i * 1.2);
      stairGroup.add(step);
    }

    return stairGroup;
  }

  function createSanctumDoor(x, y, z) {
    var doorGroup = new THREE.Group();

    var doorGeom = new THREE.BoxGeometry(2.5, 4, 0.3);
    var doorMat = new THREE.MeshStandardMaterial({ color: COLORS.purple, roughness: 0.6, metalness: 0.4, emissive: COLORS.purple, emissiveIntensity: 0.3 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(x, y + 2, z);
    door.name = 'sanctumDoor';
    doorGroup.add(door);

    for (var i = 0; i < 4; i++) {
      var lockGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
      var lockMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.4, metalness: 0.8 });
      var lock = new THREE.Mesh(lockGeom, lockMat);
      lock.position.set(x - 0.8 + i * 0.6, y + 2 + (1 - i * 0.3), z + 0.3);
      lock.rotation.z = Math.PI / 2;
      doorGroup.add(lock);
    }

    return doorGroup;
  }

  function createExcavationPit(x, z) {
    var pitGroup = new THREE.Group();

    var pitGeom = new THREE.BoxGeometry(8, 3, 8);
    var pitMat = new THREE.MeshStandardMaterial({ color: 0x6B5344, roughness: 0.95 });
    var pit = new THREE.Mesh(pitGeom, pitMat);
    pit.position.set(x, -3, z);
    pitGroup.add(pit);

    for (var i = 0; i < 4; i++) {
      var scaffoldGeom = new THREE.BoxGeometry(0.3, 4, 0.3);
      var scaffoldMat = new THREE.MeshStandardMaterial({ color: COLORS.gray, roughness: 0.7 });
      var scaffold = new THREE.Mesh(scaffoldGeom, scaffoldMat);
      scaffold.position.set(x - 3 + i * 2, -1, z - 3);
      pitGroup.add(scaffold);

      var crossGeom = new THREE.BoxGeometry(6, 0.2, 0.3);
      var cross = new THREE.Mesh(crossGeom, scaffoldMat);
      cross.position.set(x, -1 + i * 1.2, z - 3);
      pitGroup.add(cross);
    }

    var craneBaseGeom = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var craneMat = new THREE.MeshStandardMaterial({ color: COLORS.lightGray, roughness: 0.6 });
    var craneBase = new THREE.Mesh(craneBaseGeom, craneMat);
    craneBase.position.set(x + 5, 0, z + 5);
    craneBase.name = 'craneBase';
    pitGroup.add(craneBase);

    var armGeom = new THREE.BoxGeometry(4, 0.3, 0.3);
    var arm = new THREE.Mesh(armGeom, craneMat);
    arm.position.set(x + 7, 2, z + 5);
    arm.name = 'craneArm';
    pitGroup.add(arm);

    return pitGroup;
  }

  function createArtifactCase(x, y, z) {
    var caseGroup = new THREE.Group();

    var caseGeom = new THREE.BoxGeometry(1.2, 1.8, 1.2);
    var caseMat = new THREE.MeshStandardMaterial({ color: COLORS.lightGray, roughness: 0.3, metalness: 0.2, transparent: true, opacity: 0.7 });
    var caseBox = new THREE.Mesh(caseGeom, caseMat);
    caseBox.position.set(x, y + 0.9, z);
    caseGroup.add(caseBox);

    var artifactGeom = new THREE.SphereGeometry(0.35, 16, 16);
    var artifactMat = new THREE.MeshStandardMaterial({ color: 0xE6B800, roughness: 0.2, metalness: 0.9, emissive: 0xE6B800, emissiveIntensity: 0.4 });
    var artifact = new THREE.Mesh(artifactGeom, artifactMat);
    artifact.position.set(x, y + 1, z);
    artifact.name = 'artifact_' + x + '_' + z;
    caseGroup.add(artifact);

    return caseGroup;
  }

  function createVegetation(x, y, z) {
    var vegGroup = new THREE.Group();

    var mossGeom = new THREE.SphereGeometry(0.8, 8, 8);
    var mossMat = new THREE.MeshStandardMaterial({ color: COLORS.moss, roughness: 0.95, metalness: 0 });
    var moss = new THREE.Mesh(mossGeom, mossMat);
    moss.position.set(x, y, z);
    moss.scale.set(1.2, 0.8, 1.2);
    moss.name = 'moss_' + x + '_' + z;
    vegGroup.add(moss);

    for (var i = 0; i < 3; i++) {
      var palmGeom = new THREE.ConeGeometry(0.4, 2.5, 8);
      var palmMat = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.9 });
      var palm = new THREE.Mesh(palmGeom, palmMat);
      palm.position.set(x + (i - 1) * 0.8, y + 1.2, z + (i - 1) * 0.6);
      palm.name = 'palm_' + i + '_' + x;
      vegGroup.add(palm);
    }

    return vegGroup;
  }

  function createTorchSconce(x, y, z) {
    var torchGroup = new THREE.Group();

    var bracketGeom = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    var bracketMat = new THREE.MeshStandardMaterial({ color: COLORS.gray, roughness: 0.8 });
    var bracket = new THREE.Mesh(bracketGeom, bracketMat);
    bracket.position.set(x, y, z);
    torchGroup.add(bracket);

    var rodGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
    var rodMat = new THREE.MeshStandardMaterial({ color: COLORS.darkStone, roughness: 0.85 });
    var rod = new THREE.Mesh(rodGeom, rodMat);
    rod.position.set(x, y + 0.8, z);
    torchGroup.add(rod);

    var flameGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var flameMat = new THREE.MeshStandardMaterial({ color: COLORS.amber, roughness: 0.5, metalness: 0, emissive: COLORS.gold, emissiveIntensity: 0.8 });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.set(x, y + 1.3, z);
    flame.name = 'torch_flame_' + x + '_' + z;
    torchGroup.add(flame);

    return torchGroup;
  }

  function createBoobyTrapPlate(x, y, z) {
    var trapGeom = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    var trapMat = new THREE.MeshStandardMaterial({ color: COLORS.darkStone, roughness: 0.9, metalness: 0.05 });
    var trap = new THREE.Mesh(trapGeom, trapMat);
    trap.position.set(x, y, z);
    trap.name = 'trap_' + x + '_' + z;
    trap.userData.isActivated = false;
    trap.userData.glowIntensity = 0;
    return trap;
  }

  function createFallenRubble(x, y, z) {
    var rubbleGroup = new THREE.Group();

    for (var i = 0; i < 5; i++) {
      var rubbleGeom = new THREE.BoxGeometry(0.8 + Math.random() * 0.6, 0.3 + Math.random() * 0.4, 1.2 + Math.random() * 0.8);
      var rubbleMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.9 });
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.position.set(x + (Math.random() - 0.5) * 3, y + i * 0.35, z + (Math.random() - 0.5) * 3);
      rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rubbleGroup.add(rubble);
    }

    return rubbleGroup;
  }

  function createToolCart(x, y, z) {
    var cartGroup = new THREE.Group();

    var bedGeom = new THREE.BoxGeometry(1.5, 0.3, 1.2);
    var bedMat = new THREE.MeshStandardMaterial({ color: COLORS.darkStone, roughness: 0.8 });
    var bed = new THREE.Mesh(bedGeom, bedMat);
    bed.position.set(x, y + 0.2, z);
    cartGroup.add(bed);

    for (var i = 0; i < 4; i++) {
      var wheelGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12);
      var wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.gray, roughness: 0.7, metalness: 0.3 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      var xOffset = (i < 2) ? -0.6 : 0.6;
      var zOffset = (i % 2 === 0) ? -0.5 : 0.5;
      wheel.position.set(x + xOffset, y, z + zOffset);
      wheel.rotation.z = Math.PI / 2;
      cartGroup.add(wheel);
    }

    var handleGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    var handleMat = new THREE.MeshStandardMaterial({ color: COLORS.lightGray, roughness: 0.6 });
    var handle = new THREE.Mesh(handleGeom, handleMat);
    handle.position.set(x - 1, y + 0.5, z);
    cartGroup.add(handle);

    return cartGroup;
  }

  function createAltar(x, y, z) {
    var altarGroup = new THREE.Group();

    var platformGeom = new THREE.BoxGeometry(2.5, 0.8, 2.5);
    var platformMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.85 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(x, y + 0.4, z);
    altarGroup.add(platform);

    var orbGeom = new THREE.SphereGeometry(0.6, 20, 20);
    var orbMat = new THREE.MeshStandardMaterial({
      color: COLORS.purple,
      roughness: 0.3,
      metalness: 0.8,
      emissive: COLORS.purple,
      emissiveIntensity: 0.6
    });
    var orb = new THREE.Mesh(orbGeom, orbMat);
    orb.position.set(x, y + 1.5, z);
    orb.name = 'altarOrb';
    altarGroup.add(orb);

    return altarGroup;
  }

  function createStoneIdol(x, y, z) {
    var idolGroup = new THREE.Group();

    var baseGeom = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    var baseMat = new THREE.MeshStandardMaterial({ color: COLORS.stone, roughness: 0.9 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x, y + 0.3, z);
    idolGroup.add(base);

    var bodyGeom = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    var body = new THREE.Mesh(bodyGeom, baseMat);
    body.position.set(x, y + 1.1, z);
    idolGroup.add(body);

    var headGeom = new THREE.BoxGeometry(0.5, 0.7, 0.5);
    var head = new THREE.Mesh(headGeom, baseMat);
    head.position.set(x, y + 2, z);
    idolGroup.add(head);

    for (var i = 0; i < 2; i++) {
      var armGeom = new THREE.BoxGeometry(0.25, 0.8, 0.25);
      var arm = new THREE.Mesh(armGeom, baseMat);
      arm.position.set(x + (i === 0 ? -0.4 : 0.4), y + 1.2, z - 0.2);
      arm.rotation.z = (i === 0 ? 0.3 : -0.3);
      idolGroup.add(arm);
    }

    return idolGroup;
  }

  function createDustMotes(x, y, z) {
    var motesGroup = new THREE.Group();

    for (var i = 0; i < 15; i++) {
      var moteGeom = new THREE.SphereGeometry(0.03, 4, 4);
      var moteMat = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.8, transparent: true, opacity: 0.4 });
      var mote = new THREE.Mesh(moteGeom, moteMat);
      mote.position.set(
        x + (Math.random() - 0.5) * 8,
        y + Math.random() * 5,
        z + (Math.random() - 0.5) * 8
      );
      mote.name = 'dustMote_' + i;
      motesGroup.add(mote);
    }

    return motesGroup;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    ruinObjects = [];
    animationState.time = 0;
    animationState.trapStates = {};
    animationState.mercenaryPositions = [
      { x: 0, y: 0, z: -10, angle: 0 },
      { x: 10, y: 0, z: 5, angle: Math.PI / 4 },
      { x: -12, y: 0, z: -5, angle: -Math.PI / 3 }
    ];

    var ground = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 50),
      new THREE.MeshStandardMaterial({ color: 0x6B5344, roughness: 0.95 })
    );
    ground.position.y = -0.25;
    scene.add(ground);
    ruinObjects.push(ground);

    var col1 = createCrumblingColumn(-12, -8);
    scene.add(col1);
    ruinObjects.push(col1);

    var col2 = createCrumblingColumn(12, -8);
    scene.add(col2);
    ruinObjects.push(col2);

    var col3 = createCrumblingColumn(-8, 5);
    scene.add(col3);
    ruinObjects.push(col3);

    var col4 = createCrumblingColumn(8, 5);
    scene.add(col4);
    ruinObjects.push(col4);

    var wall1 = createTempleWall(0, -20, 12, 6);
    scene.add(wall1);
    ruinObjects.push(wall1);

    var wall2 = createTempleWall(-15, 0, 8, 5);
    scene.add(wall2);
    ruinObjects.push(wall2);

    var staircase = createUndergroundStaircase(0, 10);
    scene.add(staircase);
    ruinObjects.push(staircase);

    var sanctumDoor = createSanctumDoor(0, -12, -18);
    scene.add(sanctumDoor);
    ruinObjects.push(sanctumDoor);

    var pit = createExcavationPit(-8, 15);
    scene.add(pit);
    ruinObjects.push(pit);

    var case1 = createArtifactCase(-10, 0.5, 10);
    scene.add(case1);
    ruinObjects.push(case1);

    var case2 = createArtifactCase(5, 0.5, -5);
    scene.add(case2);
    ruinObjects.push(case2);

    var case3 = createArtifactCase(15, 0.5, 12);
    scene.add(case3);
    ruinObjects.push(case3);

    var veg1 = createVegetation(-15, 0, -15);
    scene.add(veg1);
    ruinObjects.push(veg1);

    var veg2 = createVegetation(18, 0, 8);
    scene.add(veg2);
    ruinObjects.push(veg2);

    var torch1 = createTorchSconce(-10, 3, -12);
    scene.add(torch1);
    ruinObjects.push(torch1);

    var torch2 = createTorchSconce(10, 3, 10);
    scene.add(torch2);
    ruinObjects.push(torch2);

    var torch3 = createTorchSconce(0, 3, 0);
    scene.add(torch3);
    ruinObjects.push(torch3);

    var trap1 = createBoobyTrapPlate(-5, 0.05, 8);
    scene.add(trap1);
    ruinObjects.push(trap1);
    animationState.trapStates['trap_-5_8'] = 0;

    var trap2 = createBoobyTrapPlate(8, 0.05, -3);
    scene.add(trap2);
    ruinObjects.push(trap2);
    animationState.trapStates['trap_8_-3'] = 0;

    var rubble1 = createFallenRubble(-10, 0, 0);
    scene.add(rubble1);
    ruinObjects.push(rubble1);

    var rubble2 = createFallenRubble(15, 0, -10);
    scene.add(rubble2);
    ruinObjects.push(rubble2);

    var cart = createToolCart(0, 0, 20);
    scene.add(cart);
    ruinObjects.push(cart);

    var altar = createAltar(0, 0, -25);
    scene.add(altar);
    ruinObjects.push(altar);

    var idol = createStoneIdol(-18, 0, 5);
    scene.add(idol);
    ruinObjects.push(idol);

    var motes = createDustMotes(0, 2, 0);
    scene.add(motes);
    ruinObjects.push(motes);
  }

  function update(delta) {
    animationState.time += delta;

    var torchFlames = scene.getObjectByName('torch_flame_-10_-12');
    if (torchFlames) {
      torchFlames.scale.y = 1 + Math.sin(animationState.time * 4) * 0.15;
      torchFlames.scale.x = 1 + Math.cos(animationState.time * 3.5) * 0.12;
    }

    var torchFlame2 = scene.getObjectByName('torch_flame_10_10');
    if (torchFlame2) {
      torchFlame2.scale.y = 1 + Math.sin(animationState.time * 4 + 1) * 0.15;
      torchFlame2.scale.z = 1 + Math.cos(animationState.time * 3.5 + 1) * 0.12;
    }

    var torchFlame3 = scene.getObjectByName('torch_flame_0_0');
    if (torchFlame3) {
      torchFlame3.scale.y = 1 + Math.sin(animationState.time * 4 + 2) * 0.15;
      torchFlame3.scale.x = 1 + Math.cos(animationState.time * 3.5 + 2) * 0.12;
    }

    var altarOrb = scene.getObjectByName('altarOrb');
    if (altarOrb) {
      altarOrb.scale.set(
        1 + Math.sin(animationState.time * 2) * 0.2,
        1 + Math.sin(animationState.time * 2) * 0.2,
        1 + Math.sin(animationState.time * 2) * 0.2
      );
      altarOrb.rotation.y += delta * 1.5;
      altarOrb.material.emissiveIntensity = 0.4 + Math.sin(animationState.time * 3) * 0.3;
    }

    var trapNames = Object.keys(animationState.trapStates);
    for (var i = 0; i < trapNames.length; i++) {
      var trapName = trapNames[i];
      var trap = scene.getObjectByName(trapName);
      if (trap) {
        var glowPhase = (animationState.time * 2) % 1;
        if (glowPhase > 0.5) {
          animationState.trapStates[trapName] = (glowPhase - 0.5) * 2;
        } else {
          animationState.trapStates[trapName] = glowPhase * 2;
        }
        trap.material.emissiveIntensity = animationState.trapStates[trapName] * 0.6;
        trap.material.color.set(COLORS.darkStone);
      }
    }

    var mossPatterns = [];
    for (var m = 0; m < 100; m++) {
      var mossName = 'moss_' + (-15 + (m % 3) * 15) + '_' + (-15 + (Math.floor(m / 3) % 3) * 15);
      mossPatterns.push(mossName);
    }

    var m1 = scene.getObjectByName('moss_-15_-15');
    if (m1) {
      m1.rotation.z += delta * 0.3;
    }

    var m2 = scene.getObjectByName('moss_18_8');
    if (m2) {
      m2.rotation.z -= delta * 0.25;
    }

    for (var p = 0; p < 15; p++) {
      var palmName = 'palm_' + p;
      var palm = scene.getObjectByName(palmName);
      if (palm) {
        palm.rotation.z = Math.sin(animationState.time * 1.5 + p) * 0.1;
      }
    }

    scene.children.forEach(function(child) {
      if (child.name && child.name.indexOf('dustMote_') === 0) {
        child.position.y += Math.sin(animationState.time + child.position.x) * 0.02;
        child.position.x += Math.cos(animationState.time * 0.5 + child.position.z) * 0.01;
      }
    });

    var craneArm = scene.getObjectByName('craneArm');
    if (craneArm) {
      craneArm.rotation.z = Math.sin(animationState.time * 0.8) * 0.3;
    }

    var sanctumDoor = scene.getObjectByName('sanctumDoor');
    if (sanctumDoor) {
      sanctumDoor.position.y += Math.sin(animationState.time * 0.5) * 0.005;
      sanctumDoor.material.emissiveIntensity = 0.3 + Math.sin(animationState.time * 1.5) * 0.15;
    }

    for (var m = 0; m < animationState.mercenaryPositions.length; m++) {
      var pos = animationState.mercenaryPositions[m];
      pos.angle += delta * 0.5;
      pos.x = 15 * Math.cos(pos.angle);
      pos.z = 15 * Math.sin(pos.angle);
    }
  }

  function reset() {
    for (var i = 0; i < ruinObjects.length; i++) {
      scene.remove(ruinObjects[i]);
    }
    ruinObjects = [];
    animationState.time = 0;
    animationState.trapStates = {};
    animationState.mercenaryPositions = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    SPAWN_POINTS: SPAWN_POINTS,
    COLORS: COLORS
  };
}());
