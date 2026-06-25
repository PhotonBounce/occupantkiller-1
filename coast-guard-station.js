window.CoastGuardStation = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatingObjects = [];
  var time = 0;

  var colors = {
    lighthouseWhite: 0xFFFFEE,
    cgOrange: 0xFF6600,
    oceanBlue: 0x1A4A7A,
    rockGray: 0x777777,
    signalRed: 0xCC2200,
    pierWood: 0x8B6914,
    steel: 0x444444,
    concrete: 0x999999
  };

  var spawnPoints = [
    { name: 'lighthouse', pos: { x: 0, y: 5, z: -50 } },
    { name: 'dock', pos: { x: -40, y: 2, z: 20 } },
    { name: 'station', pos: { x: 30, y: 3, z: 0 } },
    { name: 'cliff', pos: { x: -60, y: 35, z: -80 } }
  ];

  function createLighthouse() {
    var group = new THREE.Group();

    var baseCyl = new THREE.CylinderGeometry(8, 10, 2, 32);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var baseMesh = new THREE.Mesh(baseCyl, baseMat);
    baseMesh.position.y = 1;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);
    objects.push(baseMesh);

    var towerCyl = new THREE.CylinderGeometry(6, 6, 45, 32);
    var towerMat = new THREE.MeshStandardMaterial({ color: colors.lighthouseWhite });
    var towerMesh = new THREE.Mesh(towerCyl, towerMat);
    towerMesh.position.y = 25;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);
    objects.push(towerMesh);

    var lanternBox = new THREE.BoxGeometry(5, 3, 5);
    var lanternMat = new THREE.MeshStandardMaterial({ color: colors.steel });
    var lanternMesh = new THREE.Mesh(lanternBox, lanternMat);
    lanternMesh.position.y = 47;
    lanternMesh.castShadow = true;
    lanternMesh.receiveShadow = true;
    group.add(lanternMesh);
    objects.push(lanternMesh);

    var roofCone = new THREE.ConeGeometry(7, 6, 32);
    var roofMat = new THREE.MeshStandardMaterial({ color: colors.signalRed });
    var roofMesh = new THREE.Mesh(roofCone, roofMat);
    roofMesh.position.y = 52;
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);
    objects.push(roofMesh);

    var lightBeamGeom = new THREE.CylinderGeometry(0.5, 0.5, 100, 16);
    var lightMat = new THREE.MeshStandardMaterial({ color: 0xFFFF99, emissive: 0xFFFF00, emissiveIntensity: 0.8 });
    var lightBeam = new THREE.Mesh(lightBeamGeom, lightMat);
    lightBeam.position.set(0, 50, 0);
    group.add(lightBeam);
    animatingObjects.push({
      mesh: lightBeam,
      type: 'rotatingBeam',
      speed: 0.5
    });
    objects.push(lightBeam);

    group.position.set(0, 0, -50);
    scene.add(group);
    return group;
  }

  function createMainStation() {
    var group = new THREE.Group();

    var buildingBox = new THREE.BoxGeometry(25, 12, 18);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
    var buildingMesh = new THREE.Mesh(buildingBox, buildingMat);
    buildingMesh.position.set(0, 6, 0);
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    group.add(buildingMesh);
    objects.push(buildingMesh);

    var roofBox = new THREE.BoxGeometry(27, 1, 20);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0xCC0000 });
    var roofMesh = new THREE.Mesh(roofBox, roofMat);
    roofMesh.position.set(0, 13, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);
    objects.push(roofMesh);

    var doorBox = new THREE.BoxGeometry(3, 5, 0.5);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var doorMesh = new THREE.Mesh(doorBox, doorMat);
    doorMesh.position.set(-8, 3, 10);
    doorMesh.castShadow = true;
    group.add(doorMesh);
    objects.push(doorMesh);

    var window1Box = new THREE.BoxGeometry(2, 2, 0.3);
    var windowMat = new THREE.MeshStandardMaterial({ color: 0x6699FF });
    var window1Mesh = new THREE.Mesh(window1Box, windowMat);
    window1Mesh.position.set(5, 8, 10);
    group.add(window1Mesh);
    objects.push(window1Mesh);

    var window2Mesh = new THREE.Mesh(window1Box, windowMat);
    window2Mesh.position.set(-5, 8, 10);
    group.add(window2Mesh);
    objects.push(window2Mesh);

    var window3Mesh = new THREE.Mesh(window1Box, windowMat);
    window3Mesh.position.set(10, 8, -9);
    group.add(window3Mesh);
    objects.push(window3Mesh);

    group.position.set(30, 0, 0);
    scene.add(group);
    return group;
  }

  function createDockAndPier() {
    var group = new THREE.Group();

    var pierBox = new THREE.BoxGeometry(60, 1, 8);
    var pierMat = new THREE.MeshStandardMaterial({ color: colors.pierWood });
    var pierMesh = new THREE.Mesh(pierBox, pierMat);
    pierMesh.position.set(-40, 0.5, 20);
    pierMesh.castShadow = true;
    pierMesh.receiveShadow = true;
    group.add(pierMesh);
    objects.push(pierMesh);

    for (var i = 0; i < 8; i++) {
      var supportCyl = new THREE.CylinderGeometry(0.4, 0.4, 5, 16);
      var supportMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
      var supportMesh = new THREE.Mesh(supportCyl, supportMat);
      supportMesh.position.set(-40 + i * 10 - 35, -2, 20);
      supportMesh.castShadow = true;
      group.add(supportMesh);
      objects.push(supportMesh);
    }

    group.position.set(0, 0, 0);
    scene.add(group);
    return group;
  }

  function createCoastGuardCutter(posX, posZ) {
    var group = new THREE.Group();

    var hullBox = new THREE.BoxGeometry(8, 2.5, 14);
    var hullMat = new THREE.MeshStandardMaterial({ color: colors.cgOrange });
    var hullMesh = new THREE.Mesh(hullBox, hullMat);
    hullMesh.position.y = 1.25;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);
    objects.push(hullMesh);

    var cabinBox = new THREE.BoxGeometry(6, 2, 4);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var cabinMesh = new THREE.Mesh(cabinBox, cabinMat);
    cabinMesh.position.set(0, 3, -2);
    cabinMesh.castShadow = true;
    cabinMesh.receiveShadow = true;
    group.add(cabinMesh);
    objects.push(cabinMesh);

    var engine1Cyl = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
    var engineMat = new THREE.MeshStandardMaterial({ color: colors.steel });
    var engine1Mesh = new THREE.Mesh(engine1Cyl, engineMat);
    engine1Mesh.rotation.z = Math.PI / 2;
    engine1Mesh.position.set(-2.5, 2, 4);
    engine1Mesh.castShadow = true;
    group.add(engine1Mesh);
    objects.push(engine1Mesh);

    var engine2Mesh = new THREE.Mesh(engine1Cyl, engineMat);
    engine2Mesh.rotation.z = Math.PI / 2;
    engine2Mesh.position.set(2.5, 2, 4);
    engine2Mesh.castShadow = true;
    group.add(engine2Mesh);
    objects.push(engine2Mesh);

    var radarBox = new THREE.BoxGeometry(1.5, 1.5, 0.3);
    var radarMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var radarMesh = new THREE.Mesh(radarBox, radarMat);
    radarMesh.position.set(0, 5, -1.5);
    radarMesh.castShadow = true;
    group.add(radarMesh);
    objects.push(radarMesh);

    group.position.set(posX, 0, posZ);
    animatingObjects.push({
      mesh: group,
      type: 'boatRocking',
      speed: 0.8,
      amplitude: 0.5,
      originalY: 0
    });
    scene.add(group);
    return group;
  }

  function createBoathouse() {
    var group = new THREE.Group();

    var structureBox = new THREE.BoxGeometry(20, 10, 15);
    var structMat = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    var structMesh = new THREE.Mesh(structureBox, structMat);
    structMesh.position.set(0, 5, 0);
    structMesh.castShadow = true;
    structMesh.receiveShadow = true;
    group.add(structMesh);
    objects.push(structMesh);

    var roofBox = new THREE.BoxGeometry(22, 1, 17);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x704020 });
    var roofMesh = new THREE.Mesh(roofBox, roofMat);
    roofMesh.position.set(0, 11, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);
    objects.push(roofMesh);

    var doorBox = new THREE.BoxGeometry(8, 9, 0.3);
    var doorMat = new THREE.MeshStandardMaterial({ color: colors.cgOrange });
    var doorMesh = new THREE.Mesh(doorBox, doorMat);
    doorMesh.position.set(0, 5, 7.7);
    doorMesh.castShadow = true;
    group.add(doorMesh);
    animatingObjects.push({
      mesh: doorMesh,
      type: 'rollingDoor',
      speed: 0.3,
      originalY: 5
    });
    objects.push(doorMesh);

    group.position.set(-50, 0, -20);
    scene.add(group);
    return group;
  }

  function createCommunicationMast() {
    var group = new THREE.Group();

    var baseCyl = new THREE.CylinderGeometry(1, 1.2, 2, 16);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var baseMesh = new THREE.Mesh(baseCyl, baseMat);
    baseMesh.position.y = 1;
    baseMesh.castShadow = true;
    group.add(baseMesh);
    objects.push(baseMesh);

    var mastCyl = new THREE.CylinderGeometry(0.3, 0.3, 30, 12);
    var mastMat = new THREE.MeshStandardMaterial({ color: colors.steel });
    var mastMesh = new THREE.Mesh(mastCyl, mastMat);
    mastMesh.position.y = 16;
    mastMesh.castShadow = true;
    group.add(mastMesh);
    objects.push(mastMesh);

    var antenna1Cyl = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    var antennaMat = new THREE.MeshStandardMaterial({ color: 0xFF00FF });
    var antenna1Mesh = new THREE.Mesh(antenna1Cyl, antennaMat);
    antenna1Mesh.rotation.z = Math.PI / 3;
    antenna1Mesh.position.set(1.5, 28, 0);
    antenna1Mesh.castShadow = true;
    group.add(antenna1Mesh);
    objects.push(antenna1Mesh);

    var antenna2Mesh = new THREE.Mesh(antenna1Cyl, antennaMat);
    antenna2Mesh.rotation.z = -Math.PI / 3;
    antenna2Mesh.position.set(-1.5, 28, 0);
    antenna2Mesh.castShadow = true;
    group.add(antenna2Mesh);
    objects.push(antenna2Mesh);

    group.position.set(50, 0, -30);
    scene.add(group);
    return group;
  }

  function createSearchlightTower() {
    var group = new THREE.Group();

    var baseCyl = new THREE.CylinderGeometry(2, 2.5, 1.5, 16);
    var baseMat = new THREE.MeshStandardMaterial({ color: colors.steel });
    var baseMesh = new THREE.Mesh(baseCyl, baseMat);
    baseMesh.position.y = 0.75;
    baseMesh.castShadow = true;
    group.add(baseMesh);
    objects.push(baseMesh);

    var towerCyl = new THREE.CylinderGeometry(0.8, 0.8, 12, 12);
    var towerMat = new THREE.MeshStandardMaterial({ color: colors.steel });
    var towerMesh = new THREE.Mesh(towerCyl, towerMat);
    towerMesh.position.y = 7;
    towerMesh.castShadow = true;
    group.add(towerMesh);
    objects.push(towerMesh);

    var lampBox = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    var lampMat = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 0.6 });
    var lampMesh = new THREE.Mesh(lampBox, lampMat);
    lampMesh.position.set(0, 13.5, 0);
    lampMesh.castShadow = true;
    group.add(lampMesh);
    animatingObjects.push({
      mesh: lampMesh,
      type: 'searchlight',
      speed: 1.2,
      originalX: 0
    });
    objects.push(lampMesh);

    group.position.set(-70, 0, 10);
    scene.add(group);
    return group;
  }

  function createCliffEdges() {
    var group = new THREE.Group();

    var cliff1Box = new THREE.BoxGeometry(40, 20, 8);
    var cliffMat = new THREE.MeshStandardMaterial({ color: colors.rockGray });
    var cliff1Mesh = new THREE.Mesh(cliff1Box, cliffMat);
    cliff1Mesh.position.set(-80, 10, -70);
    cliff1Mesh.castShadow = true;
    cliff1Mesh.receiveShadow = true;
    group.add(cliff1Mesh);
    objects.push(cliff1Mesh);

    var cliff2Box = new THREE.BoxGeometry(30, 15, 6);
    var cliff2Mesh = new THREE.Mesh(cliff2Box, cliffMat);
    cliff2Mesh.position.set(-70, 8, -85);
    cliff2Mesh.castShadow = true;
    cliff2Mesh.receiveShadow = true;
    group.add(cliff2Mesh);
    objects.push(cliff2Mesh);

    var cliff3Box = new THREE.BoxGeometry(50, 25, 10);
    var cliff3Mesh = new THREE.Mesh(cliff3Box, cliffMat);
    cliff3Mesh.position.set(-60, 13, -100);
    cliff3Mesh.castShadow = true;
    cliff3Mesh.receiveShadow = true;
    group.add(cliff3Mesh);
    objects.push(cliff3Mesh);

    group.position.set(0, 0, 0);
    scene.add(group);
    return group;
  }

  function createRescueEquipmentShed() {
    var group = new THREE.Group();

    var shedBox = new THREE.BoxGeometry(12, 8, 10);
    var shedMat = new THREE.MeshStandardMaterial({ color: 0xFF4444 });
    var shedMesh = new THREE.Mesh(shedBox, shedMat);
    shedMesh.position.set(0, 4, 0);
    shedMesh.castShadow = true;
    shedMesh.receiveShadow = true;
    group.add(shedMesh);
    objects.push(shedMesh);

    var roofBox = new THREE.BoxGeometry(14, 1, 12);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0xCC2200 });
    var roofMesh = new THREE.Mesh(roofBox, roofMat);
    roofMesh.position.set(0, 9, 0);
    roofMesh.castShadow = true;
    group.add(roofMesh);
    objects.push(roofMesh);

    var doorBox = new THREE.BoxGeometry(2.5, 4, 0.3);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var doorMesh = new THREE.Mesh(doorBox, doorMat);
    doorMesh.position.set(0, 2.5, 5.2);
    doorMesh.castShadow = true;
    group.add(doorMesh);
    objects.push(doorMesh);

    group.position.set(60, 0, 40);
    scene.add(group);
    return group;
  }

  function createLifeRingPosts() {
    var group = new THREE.Group();

    var positions = [
      { x: -40, z: 15 },
      { x: -10, z: 25 },
      { x: 20, z: 18 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var postCyl = new THREE.CylinderGeometry(0.25, 0.25, 4, 12);
      var postMat = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
      var postMesh = new THREE.Mesh(postCyl, postMat);
      postMesh.position.set(positions[i].x, 2, positions[i].z);
      postMesh.castShadow = true;
      group.add(postMesh);
      objects.push(postMesh);

      var ringMat = new THREE.MeshStandardMaterial({ color: colors.signalRed });
      var ringGroup = new THREE.Group();
      for (var rk = 0; rk < 10; rk++) {
        var rkA = (rk / 10) * Math.PI * 2;
        var rkSeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), ringMat);
        rkSeg.position.set(Math.cos(rkA) * 1.2, 0, Math.sin(rkA) * 1.2);
        ringGroup.add(rkSeg);
      }
      ringGroup.position.set(positions[i].x, 4, positions[i].z);
      group.add(ringGroup);
      objects.push(ringGroup);
    }

    scene.add(group);
    return group;
  }

  function createSignalFlagPoles() {
    var group = new THREE.Group();

    var poleCyl = new THREE.CylinderGeometry(0.2, 0.2, 6, 12);
    var poleMat = new THREE.MeshStandardMaterial({ color: colors.steel });

    var flagBox1 = new THREE.BoxGeometry(1.5, 0.8, 0.1);
    var flagMat1 = new THREE.MeshStandardMaterial({ color: 0xFF0000 });

    var flagBox2 = new THREE.BoxGeometry(1.5, 0.8, 0.1);
    var flagMat2 = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });

    for (var i = 0; i < 2; i++) {
      var poleMesh = new THREE.Mesh(poleCyl, poleMat);
      poleMesh.position.set(10 + i * 15, 3, 30);
      poleMesh.castShadow = true;
      group.add(poleMesh);
      objects.push(poleMesh);

      var flagMesh = i === 0 ? new THREE.Mesh(flagBox1, flagMat1) : new THREE.Mesh(flagBox2, flagMat2);
      flagMesh.position.set(10 + i * 15 + 1, 5.5, 30);
      flagMesh.castShadow = true;
      group.add(flagMesh);
      animatingObjects.push({
        mesh: flagMesh,
        type: 'flagWave',
        speed: 2.0,
        originalZ: 30
      });
      objects.push(flagMesh);
    }

    scene.add(group);
    return group;
  }

  function createFuelPier() {
    var group = new THREE.Group();

    var platformBox = new THREE.BoxGeometry(6, 0.5, 12);
    var platformMat = new THREE.MeshStandardMaterial({ color: colors.pierWood });
    var platformMesh = new THREE.Mesh(platformBox, platformMat);
    platformMesh.position.set(0, 1.5, 0);
    platformMesh.castShadow = true;
    platformMesh.receiveShadow = true;
    group.add(platformMesh);
    objects.push(platformMesh);

    var supportCyl = new THREE.CylinderGeometry(0.3, 0.3, 3, 12);
    var supportMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });

    for (var i = 0; i < 4; i++) {
      var supportMesh = new THREE.Mesh(supportCyl, supportMat);
      supportMesh.position.set(-2 + i * 1.5, -0.75, -4 + i * 4);
      supportMesh.castShadow = true;
      group.add(supportMesh);
      objects.push(supportMesh);
    }

    var pumpBox = new THREE.BoxGeometry(1.5, 2, 1);
    var pumpMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var pumpMesh = new THREE.Mesh(pumpBox, pumpMat);
    pumpMesh.position.set(0, 2.5, 0);
    pumpMesh.castShadow = true;
    group.add(pumpMesh);
    objects.push(pumpMesh);

    group.position.set(-30, 0, -40);
    scene.add(group);
    return group;
  }

  function createHelicopterPatrol() {
    var group = new THREE.Group();

    var fuselageBox = new THREE.BoxGeometry(2, 1.5, 6);
    var fuselageMat = new THREE.MeshStandardMaterial({ color: colors.cgOrange });
    var fuselageMesh = new THREE.Mesh(fuselageBox, fuselageMat);
    fuselageMesh.castShadow = true;
    group.add(fuselageMesh);
    objects.push(fuselageMesh);

    var tailCyl = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    var tailMat = new THREE.MeshStandardMaterial({ color: colors.cgOrange });
    var tailMesh = new THREE.Mesh(tailCyl, tailMat);
    tailMesh.rotation.z = Math.PI / 2;
    tailMesh.position.set(0, 0, 3);
    tailMesh.castShadow = true;
    group.add(tailMesh);
    objects.push(tailMesh);

    var rotorGeom = new THREE.CylinderGeometry(3, 3, 0.2, 4);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var rotorMesh = new THREE.Mesh(rotorGeom, rotorMat);
    rotorMesh.position.y = 1.5;
    rotorMesh.castShadow = true;
    group.add(rotorMesh);
    animatingObjects.push({
      mesh: rotorMesh,
      type: 'helicopterRotor',
      speed: 8.0
    });
    objects.push(rotorMesh);

    group.position.set(0, 50, -100);
    animatingObjects.push({
      mesh: group,
      type: 'helicopterPatrol',
      speed: 0.4,
      originalX: 0,
      originalZ: -100
    });
    scene.add(group);
    return group;
  }

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatingObjects = [];
    time = 0;

    createLighthouse();
    createMainStation();
    createDockAndPier();
    createCoastGuardCutter(-45, 28);
    createCoastGuardCutter(-25, 25);
    createBoathouse();
    createCommunicationMast();
    createSearchlightTower();
    createCliffEdges();
    createRescueEquipmentShed();
    createLifeRingPosts();
    createSignalFlagPoles();
    createFuelPier();
    createHelicopterPatrol();
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < animatingObjects.length; i++) {
      var anim = animatingObjects[i];

      if (anim.type === 'rotatingBeam') {
        anim.mesh.rotation.y += anim.speed * delta;
      } else if (anim.type === 'boatRocking') {
        anim.mesh.position.y = anim.originalY + Math.sin(time * anim.speed) * anim.amplitude;
      } else if (anim.type === 'rollingDoor') {
        var doorOffset = Math.sin(time * anim.speed) * 0.3;
        anim.mesh.position.y = anim.originalY + doorOffset;
      } else if (anim.type === 'searchlight') {
        anim.mesh.rotation.z = Math.sin(time * anim.speed) * 0.4;
      } else if (anim.type === 'flagWave') {
        anim.mesh.position.z = anim.originalZ + Math.sin(time * anim.speed) * 0.5;
        anim.mesh.rotation.z = Math.sin(time * anim.speed * 0.5) * 0.15;
      } else if (anim.type === 'helicopterRotor') {
        anim.mesh.rotation.y += anim.speed * delta;
      } else if (anim.type === 'helicopterPatrol') {
        var patrolX = anim.originalX + Math.sin(time * anim.speed) * 80;
        var patrolZ = anim.originalZ + Math.cos(time * anim.speed * 0.7) * 60;
        anim.mesh.position.x = patrolX;
        anim.mesh.position.z = patrolZ;
      }
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      } else {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animatingObjects = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset,
    spawnPoints: spawnPoints
  };
}());
