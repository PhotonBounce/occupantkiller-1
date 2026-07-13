window.MilitaryAcademy = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationState = {
    flagWave: 0,
    targetRotation: 0,
    barrierArm: 0,
    clockBell: 0,
    tankTurret: 0,
    honorGuardPace: 0
  };

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];

    // Main Academy Building - grand stone facade
    var mainBuildingGeom = new THREE.BoxGeometry(40, 30, 50);
    var mainBuildingMat = new THREE.MeshPhongMaterial({ color: 0x887755 });
    var mainBuilding = new THREE.Mesh(mainBuildingGeom, mainBuildingMat);
    mainBuilding.position.set(0, 15, 0);
    mainBuilding.name = 'mainBuilding';
    scene.add(mainBuilding);
    objects.push(mainBuilding);

    // Parade Ground - flat wide tarmac
    var paradeGroundGeom = new THREE.BoxGeometry(120, 2, 150);
    var paradeGroundMat = new THREE.MeshPhongMaterial({ color: 0x556644 });
    var paradeGround = new THREE.Mesh(paradeGroundGeom, paradeGroundMat);
    paradeGround.position.set(0, 0, 40);
    paradeGround.name = 'paradeGround';
    scene.add(paradeGround);
    objects.push(paradeGround);

    // Flagpole - CylinderGeometry pole
    var flagpoleGeom = new THREE.CylinderGeometry(1, 1, 25, 16);
    var flagpoleMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var flagpole = new THREE.Mesh(flagpoleGeom, flagpoleMat);
    flagpole.position.set(-30, 12.5, 40);
    flagpole.name = 'flagpole';
    scene.add(flagpole);
    objects.push(flagpole);

    // Flag - BoxGeometry waving
    var flagGeom = new THREE.BoxGeometry(8, 5, 0.5);
    var flagMat = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(-26, 20, 40);
    flag.name = 'flag';
    scene.add(flag);
    objects.push(flag);

    // Obstacle Course - Wall sections
    var wallGeom = new THREE.BoxGeometry(30, 3, 1);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x886633 });
    var wall1 = new THREE.Mesh(wallGeom, wallMat);
    wall1.position.set(-40, 1.5, 100);
    wall1.name = 'wall1';
    scene.add(wall1);
    objects.push(wall1);

    var wall2 = new THREE.Mesh(wallGeom, wallMat);
    wall2.position.set(0, 1.5, 120);
    wall2.name = 'wall2';
    scene.add(wall2);
    objects.push(wall2);

    // Cargo Net Frame - BoxGeometry obstacles
    var netFrameGeom = new THREE.BoxGeometry(15, 8, 2);
    var netFrameMat = new THREE.MeshPhongMaterial({ color: 0x886633 });
    var netFrame = new THREE.Mesh(netFrameGeom, netFrameMat);
    netFrame.position.set(35, 4, 110);
    netFrame.name = 'netFrame';
    scene.add(netFrame);
    objects.push(netFrame);

    // Armory Building
    var armoryGeom = new THREE.BoxGeometry(25, 20, 30);
    var armoryMat = new THREE.MeshPhongMaterial({ color: 0x667755 });
    var armory = new THREE.Mesh(armoryGeom, armoryMat);
    armory.position.set(-50, 10, -30);
    armory.name = 'armory';
    scene.add(armory);
    objects.push(armory);

    // Armory Heavy Door
    var doorGeom = new THREE.BoxGeometry(4, 6, 0.5);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x443322 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-50, 3, -15.5);
    door.name = 'armoryDoor';
    scene.add(door);
    objects.push(door);

    // Firing Range Target Boards - rotating
    var targetGeom = new THREE.BoxGeometry(2, 8, 0.3);
    var targetMat = new THREE.MeshPhongMaterial({ color: 0x885544 });
    var target1 = new THREE.Mesh(targetGeom, targetMat);
    target1.position.set(40, 4, 60);
    target1.name = 'target1';
    scene.add(target1);
    objects.push(target1);

    var target2 = new THREE.Mesh(targetGeom, targetMat);
    target2.position.set(50, 4, 65);
    target2.name = 'target2';
    scene.add(target2);
    objects.push(target2);

    // Command HQ Building
    var hqGeom = new THREE.BoxGeometry(30, 18, 25);
    var hqMat = new THREE.MeshPhongMaterial({ color: 0x778866 });
    var hq = new THREE.Mesh(hqGeom, hqMat);
    hq.position.set(45, 9, -20);
    hq.name = 'hqBuilding';
    scene.add(hq);
    objects.push(hq);

    // Dormitory Blocks - multiple windows
    var dormGeom = new THREE.BoxGeometry(35, 22, 20);
    var dormMat = new THREE.MeshPhongMaterial({ color: 0x998877 });
    var dorm1 = new THREE.Mesh(dormGeom, dormMat);
    dorm1.position.set(-45, 11, 10);
    dorm1.name = 'dorm1';
    scene.add(dorm1);
    objects.push(dorm1);

    var dorm2 = new THREE.Mesh(dormGeom, dormMat);
    dorm2.position.set(50, 11, 15);
    dorm2.name = 'dorm2';
    scene.add(dorm2);
    objects.push(dorm2);

    // Guard Shack Checkpoint - small boxGeometry + barrier arm
    var shackGeom = new THREE.BoxGeometry(8, 6, 10);
    var shackMat = new THREE.MeshPhongMaterial({ color: 0x667755 });
    var shack = new THREE.Mesh(shackGeom, shackMat);
    shack.position.set(0, 3, -60);
    shack.name = 'guardShack';
    scene.add(shack);
    objects.push(shack);

    // Barrier Arm - raises/lowers
    var barrierGeom = new THREE.BoxGeometry(15, 1, 1);
    var barrierMat = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(0, 3.5, -55);
    barrier.name = 'barrierArm';
    scene.add(barrier);
    objects.push(barrier);

    // Artillery Training Gun - CylinderGeometry barrel + BoxGeometry carriage
    var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
    var barrelMat = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.position.set(-35, 3, 75);
    barrel.rotation.z = Math.PI / 6;
    barrel.name = 'artilleryBarrel';
    scene.add(barrel);
    objects.push(barrel);

    var carriageGeom = new THREE.BoxGeometry(5, 3, 8);
    var carriageMat = new THREE.MeshPhongMaterial({ color: 0x555544 });
    var carriage = new THREE.Mesh(carriageGeom, carriageMat);
    carriage.position.set(-35, 1.5, 75);
    carriage.name = 'artilleryCarriage';
    scene.add(carriage);
    objects.push(carriage);

    // Tank Training Vehicle - BoxGeometry hull + CylinderGeometry turret
    var hullGeom = new THREE.BoxGeometry(10, 6, 15);
    var hullMat = new THREE.MeshPhongMaterial({ color: 0x4A5C2A });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(60, 3, 85);
    hull.name = 'tankHull';
    scene.add(hull);
    objects.push(hull);

    var turretGeom = new THREE.CylinderGeometry(3, 3, 4, 16);
    var turretMat = new THREE.MeshPhongMaterial({ color: 0x4A5C2A });
    var turret = new THREE.Mesh(turretGeom, turretMat);
    turret.position.set(60, 6, 85);
    turret.name = 'tankTurret';
    scene.add(turret);
    objects.push(turret);

    // Parade Ground Statue Monument - CylinderGeometry base + BoxGeometry figure
    var baseGeom = new THREE.CylinderGeometry(4, 5, 2, 16);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x888877 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(20, 1, 50);
    base.name = 'monumentBase';
    scene.add(base);
    objects.push(base);

    var figureGeom = new THREE.BoxGeometry(3, 8, 2);
    var figureMat = new THREE.MeshPhongMaterial({ color: 0x888877 });
    var figure = new THREE.Mesh(figureGeom, figureMat);
    figure.position.set(20, 7, 50);
    figure.name = 'monumentFigure';
    scene.add(figure);
    objects.push(figure);

    // Academy Clock Tower - BoxGeometry tower + CylinderGeometry clock face
    var towerGeom = new THREE.BoxGeometry(8, 35, 8);
    var towerMat = new THREE.MeshPhongMaterial({ color: 0x887766 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-65, 17.5, 30);
    tower.name = 'clockTower';
    scene.add(tower);
    objects.push(tower);

    var clockGeom = new THREE.CylinderGeometry(5, 5, 0.5, 16);
    var clockMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var clock = new THREE.Mesh(clockGeom, clockMat);
    clock.position.set(-65, 33, 35.5);
    clock.name = 'clockFace';
    scene.add(clock);
    objects.push(clock);

    // Honor Guard Posts - CylinderGeometry sentry box
    var sentryGeom = new THREE.CylinderGeometry(2, 2, 5, 16);
    var sentryMat = new THREE.MeshPhongMaterial({ color: 0x6B5C3E });
    var sentry1 = new THREE.Mesh(sentryGeom, sentryMat);
    sentry1.position.set(-15, 2.5, 40);
    sentry1.name = 'sentryBox1';
    scene.add(sentry1);
    objects.push(sentry1);

    var sentry2 = new THREE.Mesh(sentryGeom, sentryMat);
    sentry2.position.set(15, 2.5, 40);
    sentry2.name = 'sentryBox2';
    scene.add(sentry2);
    objects.push(sentry2);

    // Additional obstacle - cone markers for course
    var markerGeom = new THREE.ConeGeometry(1.5, 3, 16);
    var markerMat = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
    var marker1 = new THREE.Mesh(markerGeom, markerMat);
    marker1.position.set(-20, 1.5, 95);
    marker1.name = 'courseMarker1';
    scene.add(marker1);
    objects.push(marker1);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
  };

  var update = function(delta) {
    // Flag wave animation (rotation.z oscillates)
    animationState.flagWave += delta * 2;
    var flagObj = scene.getObjectByName('flag');
    if (flagObj) {
      flagObj.rotation.z = Math.sin(animationState.flagWave) * 0.3;
    }

    // Firing range targets rotate/snap (rotation.y oscillates)
    animationState.targetRotation += delta * 1.5;
    var target1 = scene.getObjectByName('target1');
    var target2 = scene.getObjectByName('target2');
    if (target1) {
      target1.rotation.y = Math.sin(animationState.targetRotation) * 0.4;
    }
    if (target2) {
      target2.rotation.y = Math.cos(animationState.targetRotation) * 0.4;
    }

    // Guard barrier arm raises/lowers
    animationState.barrierArm += delta * 1;
    var barrier = scene.getObjectByName('barrierArm');
    if (barrier) {
      var raiseLower = Math.sin(animationState.barrierArm) * 0.5;
      barrier.rotation.z = raiseLower;
    }

    // Clock tower bell animation (rotation.z oscillates)
    animationState.clockBell += delta * 3;
    var clock = scene.getObjectByName('clockFace');
    if (clock) {
      clock.rotation.z = Math.sin(animationState.clockBell) * 0.15;
    }

    // Tank turret slowly rotates
    animationState.tankTurret += delta * 0.3;
    var turret = scene.getObjectByName('tankTurret');
    if (turret) {
      turret.rotation.y += delta * 0.3;
    }

    // Honor guard pacing (position.z oscillates)
    animationState.honorGuardPace += delta * 1.2;
    var sentry1 = scene.getObjectByName('sentryBox1');
    var sentry2 = scene.getObjectByName('sentryBox2');
    if (sentry1) {
      sentry1.position.z = 40 + Math.sin(animationState.honorGuardPace) * 2;
    }
    if (sentry2) {
      sentry2.position.z = 40 + Math.cos(animationState.honorGuardPace) * 2;
    }
  };

  var reset = function() {
    if (scene) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animationState = {
      flagWave: 0,
      targetRotation: 0,
      barrierArm: 0,
      clockBell: 0,
      tankTurret: 0,
      honorGuardPace: 0
    };
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
