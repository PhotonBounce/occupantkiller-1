window.NavalDockyard = (function() {
  'use strict';

  var objects = [];
  var animationState = {
    craneRotation: 0,
    sparkFlash: 0,
    patrolBoatPosition: 0,
    radarSweep: 0,
    chainSway: 0,
    bunkering: 0
  };

  var colors = {
    darkSteel: 0x1a1a2e,
    rust: 0x8b4513,
    water: 0x1e5a7a,
    yellow: 0xffff00,
    red: 0xff0000,
    concrete: 0x808080,
    warning: 0xffaa00,
    spark: 0xffff99,
    submarine: 0x2d5a3d,
    green: 0x00aa00
  };

  var clearScene = function(scene) {
    var i = objects.length - 1;
    while (i >= 0) {
      scene.remove(objects[i]);
      i--;
    }
    objects = [];
  };

  var addDryDock = function(scene) {
    var geometry = new THREE.BoxGeometry(60, 25, 15);
    var material = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var dryDock = new THREE.Mesh(geometry, material);
    dryDock.position.set(0, 0, 0);
    dryDock.userData.name = 'dryDock';
    scene.add(dryDock);
    objects.push(dryDock);

    var wallGeometry = new THREE.BoxGeometry(2, 25, 15);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.position.set(-31, 0, 0);
    scene.add(wallLeft);
    objects.push(wallLeft);

    var wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.position.set(31, 0, 0);
    scene.add(wallRight);
    objects.push(wallRight);
  };

  var addDestroyerHull = function(scene) {
    var hullGeometry = new THREE.CylinderGeometry(8, 8, 40, 32, 16);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.8 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.set(0, 8, 0);
    hull.rotation.z = Math.PI / 2;
    hull.userData.name = 'destroyerHull';
    scene.add(hull);
    objects.push(hull);

    var bowGeometry = new THREE.ConeGeometry(8, 12, 32);
    var bowMaterial = new THREE.MeshStandardMaterial({ color: colors.rust });
    var bow = new THREE.Mesh(bowGeometry, bowMaterial);
    bow.position.set(26, 8, 0);
    bow.rotation.z = Math.PI / 2;
    scene.add(bow);
    objects.push(bow);

    var superstructureGeometry = new THREE.BoxGeometry(6, 12, 6);
    var superMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var superstructure = new THREE.Mesh(superstructureGeometry, superMaterial);
    superstructure.position.set(-5, 18, 0);
    scene.add(superstructure);
    objects.push(superstructure);
  };

  var addGantryCrane = function(scene) {
    var baseGeometry = new THREE.BoxGeometry(4, 2, 50);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: colors.yellow });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-25, 12, 0);
    scene.add(base);
    objects.push(base);

    var leftLegGeometry = new THREE.BoxGeometry(3, 30, 3);
    var legMaterial = new THREE.MeshStandardMaterial({ color: colors.yellow });
    var leftLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    leftLeg.position.set(-25, 15, -24);
    scene.add(leftLeg);
    objects.push(leftLeg);

    var rightLeg = new THREE.Mesh(leftLegGeometry, legMaterial);
    rightLeg.position.set(-25, 15, 24);
    scene.add(rightLeg);
    objects.push(rightLeg);

    var jibGeometry = new THREE.BoxGeometry(3, 2, 40);
    var jibMaterial = new THREE.MeshStandardMaterial({ color: colors.yellow });
    var jib = new THREE.Mesh(jibGeometry, jibMaterial);
    jib.position.set(-25, 35, 0);
    jib.userData.name = 'craneJib';
    jib.userData.baseRotation = jib.rotation.y;
    scene.add(jib);
    objects.push(jib);

    var hookGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
    var hookMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(-25, 30, 0);
    hook.userData.name = 'craneHook';
    scene.add(hook);
    objects.push(hook);
  };

  var addTorpedoDock = function(scene) {
    var dockGeometry = new THREE.BoxGeometry(8, 4, 20);
    var dockMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var torpedoDock = new THREE.Mesh(dockGeometry, dockMaterial);
    torpedoDock.position.set(20, 2, -20);
    scene.add(torpedoDock);
    objects.push(torpedoDock);

    var torpedoGeometry = new THREE.CylinderGeometry(1, 1, 8, 16);
    var torpedoMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var i = 0;
    while (i < 4) {
      var torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
      torpedo.position.set(20 + i * 2, 5, -20);
      torpedo.rotation.z = Math.PI / 2;
      scene.add(torpedo);
      objects.push(torpedo);
      i++;
    }
  };

  var addSubmarinePen = function(scene) {
    var penGeometry = new THREE.BoxGeometry(20, 15, 8);
    var penMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var pen = new THREE.Mesh(penGeometry, penMaterial);
    pen.position.set(0, 7, 30);
    scene.add(pen);
    objects.push(pen);

    var roofGeometry = new THREE.CylinderGeometry(10, 10, 20, 32);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 20, 30);
    roof.rotation.z = Math.PI / 2;
    scene.add(roof);
    objects.push(roof);

    var entryGeometry = new THREE.BoxGeometry(8, 10, 2);
    var entryMaterial = new THREE.MeshStandardMaterial({ color: colors.water });
    var entry = new THREE.Mesh(entryGeometry, entryMaterial);
    entry.position.set(0, 5, 34);
    scene.add(entry);
    objects.push(entry);
  };

  var addMinelayingBarge = function(scene) {
    var bargeGeometry = new THREE.BoxGeometry(20, 3, 12);
    var bargeMaterial = new THREE.MeshStandardMaterial({ color: colors.rust });
    var barge = new THREE.Mesh(bargeGeometry, bargeMaterial);
    barge.position.set(-35, 1, 15);
    barge.userData.name = 'mineBarge';
    scene.add(barge);
    objects.push(barge);

    var mineRackGeometry = new THREE.BoxGeometry(2, 6, 3);
    var rackMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var i = 0;
    while (i < 5) {
      var rack = new THREE.Mesh(mineRackGeometry, rackMaterial);
      rack.position.set(-35 + i * 4, 5, 15);
      scene.add(rack);
      objects.push(rack);
      i++;
    }

    var mineGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var mineMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var j = 0;
    while (j < 3) {
      var mine = new THREE.Mesh(mineGeometry, mineMaterial);
      mine.position.set(-35 + j * 8, 8, 15);
      mine.userData.name = 'mine_' + j;
      scene.add(mine);
      objects.push(mine);
      j++;
    }
  };

  var addWeldingArc = function(scene) {
    var sparkPoints = [];
    var i = 0;
    while (i < 20) {
      sparkPoints.push(new THREE.Vector3(
        Math.random() * 4 - 2,
        Math.random() * 3 + 15,
        Math.random() * 2 - 1
      ));
      i++;
    }
    var sparkGeometry = new THREE.BufferGeometry().setFromPoints(sparkPoints);
    var sparkMaterial = new THREE.PointsMaterial({ color: colors.spark, size: 0.5 });
    var sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    sparks.position.set(10, 0, -15);
    sparks.userData.name = 'weldingSparks';
    scene.add(sparks);
    objects.push(sparks);

    var workAreaGeometry = new THREE.BoxGeometry(6, 8, 4);
    var workMaterial = new THREE.MeshStandardMaterial({ color: colors.warning });
    var workArea = new THREE.Mesh(workAreaGeometry, workMaterial);
    workArea.position.set(10, 4, -15);
    scene.add(workArea);
    objects.push(workArea);
  };

  var addAnchorChainStorage = function(scene) {
    var storageGeometry = new THREE.BoxGeometry(12, 8, 10);
    var storageMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var storage = new THREE.Mesh(storageGeometry, storageMaterial);
    storage.position.set(25, 4, 20);
    scene.add(storage);
    objects.push(storage);

    var chainGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var chainMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var i = 0;
    while (i < 6) {
      var chainCoil = new THREE.Mesh(chainGeometry, chainMaterial);
      chainCoil.position.set(25 - 3 + i * 2, 8, 20);
      chainCoil.userData.swayIndex = i;
      chainCoil.userData.name = 'chainCoil_' + i;
      scene.add(chainCoil);
      objects.push(chainCoil);
      i++;
    }
  };

  var addFuelBunkeringStation = function(scene) {
    var tankGeometry = new THREE.CylinderGeometry(5, 5, 12, 32);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: colors.warning });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(-20, 6, -30);
    tank.userData.name = 'fuelTank';
    scene.add(tank);
    objects.push(tank);

    var pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 15, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: colors.rust });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(-20, 15, -20);
    pipe.rotation.z = Math.PI / 2.5;
    scene.add(pipe);
    objects.push(pipe);

    var pumpGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 32);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: colors.rust });
    var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(-20, 2, -15);
    pump.userData.name = 'fuelPump';
    scene.add(pump);
    objects.push(pump);
  };

  var addNavalWarehouse = function(scene) {
    var buildingGeometry = new THREE.BoxGeometry(30, 15, 20);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(30, 7, -15);
    scene.add(building);
    objects.push(building);

    var roofGeometry = new THREE.CylinderGeometry(17, 17, 30, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: colors.rust });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(30, 17, -15);
    roof.rotation.z = Math.PI / 2;
    scene.add(roof);
    objects.push(roof);

    var doorGeometry = new THREE.BoxGeometry(8, 12, 1);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(30, 6, -24);
    scene.add(door);
    objects.push(door);
  };

  var addAntiSubmarine = function(scene) {
    var platformGeometry = new THREE.BoxGeometry(12, 3, 12);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-15, 15, 30);
    scene.add(platform);
    objects.push(platform);

    var mortarGeometry = new THREE.ConeGeometry(1.5, 4, 16);
    var mortarMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var mortar = new THREE.Mesh(mortarGeometry, mortarMaterial);
    mortar.position.set(-15, 18, 30);
    mortar.userData.name = 'mortarGun';
    scene.add(mortar);
    objects.push(mortar);

    var scopeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
    var scopeMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.position.set(-15, 20, 30);
    scope.userData.name = 'mortarScope';
    scene.add(scope);
    objects.push(scope);
  };

  var addHarborPatrolBoats = function(scene) {
    var boatGeometry = new THREE.BoxGeometry(8, 2, 3);
    var boatMaterial = new THREE.MeshStandardMaterial({ color: colors.green });
    var boat1 = new THREE.Mesh(boatGeometry, boatMaterial);
    boat1.position.set(-40, 1, 0);
    boat1.userData.name = 'patrolBoat1';
    boat1.userData.pathStart = -40;
    boat1.userData.pathEnd = 40;
    scene.add(boat1);
    objects.push(boat1);

    var boatCabinGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var cabin = new THREE.Mesh(boatCabinGeometry, cabinMaterial);
    cabin.position.set(-36, 2.5, 0);
    cabin.userData.name = 'boatCabin1';
    scene.add(cabin);
    objects.push(cabin);

    var radarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var radarMaterial = new THREE.MeshStandardMaterial({ color: colors.red });
    var radar = new THREE.Mesh(radarGeometry, radarMaterial);
    radar.position.set(-36, 4, 0);
    radar.userData.name = 'patrolRadar';
    scene.add(radar);
    objects.push(radar);
  };

  var addRadarDish = function(scene) {
    var dishGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 32);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: colors.red, metalness: 0.9 });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(0, 40, 0);
    dish.userData.name = 'radarDish';
    scene.add(dish);
    objects.push(dish);

    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: colors.darkSteel });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(0, 30, 0);
    scene.add(pole);
    objects.push(pole);

    var sweepGeometry = new THREE.BoxGeometry(8, 0.2, 0.2);
    var sweepMaterial = new THREE.MeshStandardMaterial({ color: colors.green });
    var sweep = new THREE.Mesh(sweepGeometry, sweepMaterial);
    sweep.position.set(0, 40, 0);
    sweep.userData.name = 'radarSweep';
    scene.add(sweep);
    objects.push(sweep);
  };

  var addWaterFeature = function(scene) {
    var waterPoints = [];
    var x = -50;
    while (x <= 50) {
      var y = -10;
      while (y <= 5) {
        waterPoints.push(new THREE.Vector3(x, y, 35));
        y += 3;
      }
      x += 10;
    }
    var waterGeometry = new THREE.BufferGeometry().setFromPoints(waterPoints);
    var waterMaterial = new THREE.PointsMaterial({ color: colors.water, size: 0.3 });
    var water = new THREE.Points(waterGeometry, waterMaterial);
    water.userData.name = 'water';
    scene.add(water);
    objects.push(water);
  };

  var init = function(scene, camera) {
    clearScene(scene);
    animationState = {
      craneRotation: 0,
      sparkFlash: 0,
      patrolBoatPosition: 0,
      radarSweep: 0,
      chainSway: 0,
      bunkering: 0
    };

    addDryDock(scene);
    addDestroyerHull(scene);
    addGantryCrane(scene);
    addTorpedoDock(scene);
    addSubmarinePen(scene);
    addMinelayingBarge(scene);
    addWeldingArc(scene);
    addAnchorChainStorage(scene);
    addFuelBunkeringStation(scene);
    addNavalWarehouse(scene);
    addAntiSubmarine(scene);
    addHarborPatrolBoats(scene);
    addRadarDish(scene);
    addWaterFeature(scene);
  };

  var update = function(delta) {
    animationState.craneRotation += delta * 0.5;
    animationState.sparkFlash += delta * 8;
    animationState.patrolBoatPosition += delta * 0.3;
    animationState.radarSweep += delta * 1.5;
    animationState.chainSway += delta * 2;
    animationState.bunkering += delta * 1.2;

    var i = 0;
    while (i < objects.length) {
      var obj = objects[i];

      if (obj.userData.name === 'craneJib') {
        obj.rotation.y = Math.sin(animationState.craneRotation) * 0.8;
      }

      if (obj.userData.name === 'craneHook') {
        obj.position.y = 30 - Math.sin(animationState.craneRotation) * 8;
      }

      if (obj.userData.name === 'weldingSparks') {
        var flashAlpha = Math.abs(Math.sin(animationState.sparkFlash));
        obj.material.opacity = 0.5 + flashAlpha * 0.5;
      }

      if (obj.userData.name === 'patrolBoat1') {
        var boatPos = obj.userData.pathStart + (Math.sin(animationState.patrolBoatPosition) + 1) * 40;
        obj.position.x = boatPos;
      }

      if (obj.userData.name === 'boatCabin1') {
        var boatPos = -40 + (Math.sin(animationState.patrolBoatPosition) + 1) * 40;
        obj.position.x = boatPos + 4;
      }

      if (obj.userData.name === 'patrolRadar') {
        var boatPos = -40 + (Math.sin(animationState.patrolBoatPosition) + 1) * 40;
        obj.position.x = boatPos + 4;
      }

      if (obj.userData.name === 'radarSweep') {
        obj.rotation.z = animationState.radarSweep;
      }

      if (obj.userData.name && obj.userData.name.indexOf('chainCoil_') === 0) {
        var swayAmount = Math.sin(animationState.chainSweep + obj.userData.swayIndex) * 0.3;
        obj.position.x = 25 - 3 + obj.userData.swayIndex * 2 + swayAmount;
      }

      if (obj.userData.name === 'fuelTank') {
        obj.rotation.z = Math.sin(animationState.bunkering) * 0.05;
      }

      i++;
    }
  };

  var reset = function() {
    var scene = objects.length > 0 && objects[0].parent ? objects[0].parent : null;
    if (scene) {
      clearScene(scene);
    } else {
      var i = objects.length - 1;
      while (i >= 0) {
        if (objects[i].parent) {
          objects[i].parent.remove(objects[i]);
        }
        i--;
      }
      objects = [];
    }
    animationState = {
      craneRotation: 0,
      sparkFlash: 0,
      patrolBoatPosition: 0,
      radarSweep: 0,
      chainSway: 0,
      bunkering: 0
    };
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
