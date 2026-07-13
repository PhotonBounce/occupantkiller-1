window.CableCar = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var gondola = null;
  var cableWire = null;
  var snipers = [];
  var trees = [];
  var time = 0;
  var gondolaProgress = 0;
  var gondolaSpeed = 0.15;

  var startPos = { x: -80, y: 35, z: 0 };
  var endPos = { x: 80, y: 60, z: 0 };

  var colors = {
    gondolaRed: 0xCC2200,
    cableGray: 0x888888,
    rockBrown: 0x7A6A5A,
    snow: 0xF8F8FF,
    pineGreen: 0x1A5C1A,
    stationWood: 0x8B6914,
    steelGray: 0x555555,
    darkGray: 0x333333
  };

  function createMountainGorge() {
    // Left cliff wall
    var leftCliffGeom = new THREE.BoxGeometry(15, 150, 100);
    var leftCliffMat = new THREE.MeshStandardMaterial({
      color: colors.rockBrown,
      roughness: 0.9,
      metalness: 0.1
    });
    var leftCliff = new THREE.Mesh(leftCliffGeom, leftCliffMat);
    leftCliff.position.set(-60, 0, -50);
    leftCliff.castShadow = true;
    leftCliff.receiveShadow = true;
    scene.add(leftCliff);
    objects.push(leftCliff);

    // Right cliff wall
    var rightCliffGeom = new THREE.BoxGeometry(15, 150, 100);
    var rightCliffMat = new THREE.MeshStandardMaterial({
      color: colors.rockBrown,
      roughness: 0.9,
      metalness: 0.1
    });
    var rightCliff = new THREE.Mesh(rightCliffGeom, rightCliffMat);
    rightCliff.position.set(60, 0, -50);
    rightCliff.castShadow = true;
    rightCliff.receiveShadow = true;
    scene.add(rightCliff);
    objects.push(rightCliff);

    // Gorge bottom (narrow canyon floor)
    var floorGeom = new THREE.BoxGeometry(30, 5, 120);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x5A4A3A,
      roughness: 0.95,
      metalness: 0
    });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, -50, -10);
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function createLowerTerminal() {
    // Main station building at lower end
    var stationGeom = new THREE.BoxGeometry(25, 20, 35);
    var stationMat = new THREE.MeshStandardMaterial({
      color: colors.stationWood,
      roughness: 0.7,
      metalness: 0.15
    });
    var station = new THREE.Mesh(stationGeom, stationMat);
    station.position.set(-75, 5, 50);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);
    objects.push(station);

    // Station roof (pitched)
    var roofGeom = new THREE.ConeGeometry(14, 8, 4);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.2
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(-75, 18, 50);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    // Sniper nest platform on left side
    var sniperPlatformGeom = new THREE.BoxGeometry(8, 1, 12);
    var platformMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.5,
      metalness: 0.6
    });
    var sniperPlatform = new THREE.Mesh(sniperPlatformGeom, platformMat);
    sniperPlatform.position.set(-75, 20, 30);
    sniperPlatform.castShadow = true;
    scene.add(sniperPlatform);
    objects.push(sniperPlatform);

    // Support pillar for station
    var pillarGeom = new THREE.CylinderGeometry(3, 4, 25, 8);
    var pillarMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.4,
      metalness: 0.7
    });
    var pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(-75, -10, 50);
    pillar.castShadow = true;
    scene.add(pillar);
    objects.push(pillar);
  }

  function createUpperTerminal() {
    // Upper station on mountain peak
    var upperStationGeom = new THREE.BoxGeometry(25, 20, 35);
    var upperStationMat = new THREE.MeshStandardMaterial({
      color: colors.stationWood,
      roughness: 0.7,
      metalness: 0.15
    });
    var upperStation = new THREE.Mesh(upperStationGeom, upperStationMat);
    upperStation.position.set(80, 45, 50);
    upperStation.castShadow = true;
    upperStation.receiveShadow = true;
    scene.add(upperStation);
    objects.push(upperStation);

    // Upper roof
    var upperRoofGeom = new THREE.ConeGeometry(14, 8, 4);
    var upperRoofMat = new THREE.MeshStandardMaterial({
      color: colors.snow,
      roughness: 0.6,
      metalness: 0.2
    });
    var upperRoof = new THREE.Mesh(upperRoofGeom, upperRoofMat);
    upperRoof.position.set(80, 58, 50);
    upperRoof.castShadow = true;
    scene.add(upperRoof);
    objects.push(upperRoof);

    // Upper sniper nest platform
    var upperSniperGeom = new THREE.BoxGeometry(8, 1, 12);
    var upperPlatformMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.5,
      metalness: 0.6
    });
    var upperSniper = new THREE.Mesh(upperSniperGeom, upperPlatformMat);
    upperSniper.position.set(80, 60, 30);
    upperSniper.castShadow = true;
    scene.add(upperSniper);
    objects.push(upperSniper);

    // Upper support pillar
    var upperPillarGeom = new THREE.CylinderGeometry(3, 4, 50, 8);
    var upperPillarMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.4,
      metalness: 0.7
    });
    var upperPillar = new THREE.Mesh(upperPillarGeom, upperPillarMat);
    upperPillar.position.set(80, 10, 50);
    upperPillar.castShadow = true;
    scene.add(upperPillar);
    objects.push(upperPillar);
  }

  function createCableSuspension() {
    // Mid-span support pylon left
    var pylonLeftGeom = new THREE.CylinderGeometry(2.5, 3, 80, 8);
    var pylonMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.3,
      metalness: 0.8
    });
    var pylonLeft = new THREE.Mesh(pylonLeftGeom, pylonMat);
    pylonLeft.position.set(-20, 25, 0);
    pylonLeft.castShadow = true;
    scene.add(pylonLeft);
    objects.push(pylonLeft);

    // Mid-span support pylon right
    var pylonRightGeom = new THREE.CylinderGeometry(2.5, 3, 80, 8);
    var pylonRight = new THREE.Mesh(pylonRightGeom, pylonMat);
    pylonRight.position.set(20, 25, 0);
    pylonRight.castShadow = true;
    scene.add(pylonRight);
    objects.push(pylonRight);

    // Cable wire using LineSegments
    var cablePoints = [];
    cablePoints.push(new THREE.Vector3(-80, 35, 0));
    cablePoints.push(new THREE.Vector3(-50, 38, 0));
    cablePoints.push(new THREE.Vector3(-20, 42, 0));
    cablePoints.push(new THREE.Vector3(0, 45, 0));
    cablePoints.push(new THREE.Vector3(20, 48, 0));
    cablePoints.push(new THREE.Vector3(50, 55, 0));
    cablePoints.push(new THREE.Vector3(80, 60, 0));

    var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMat = new THREE.LineBasicMaterial({
      color: colors.cableGray,
      linewidth: 3
    });
    cableWire = new THREE.LineSegments(cableGeom, cableMat);
    scene.add(cableWire);
    objects.push(cableWire);
  }

  function createGondolaCar() {
    // Main cabin box
    var cabinGeom = new THREE.BoxGeometry(6, 5, 8);
    var cabinMat = new THREE.MeshStandardMaterial({
      color: colors.gondolaRed,
      roughness: 0.4,
      metalness: 0.3
    });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.copy(startPos);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);

    // Left window (thin box)
    var windowGeom = new THREE.BoxGeometry(2.5, 1.5, 0.2);
    var windowMat = new THREE.MeshStandardMaterial({
      color: 0x4488FF,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.6
    });
    var leftWindow = new THREE.Mesh(windowGeom, windowMat);
    leftWindow.position.set(-1.8, 1, 4);
    cabin.add(leftWindow);

    // Right window
    var rightWindow = new THREE.Mesh(windowGeom, windowMat);
    rightWindow.position.set(1.8, 1, 4);
    cabin.add(rightWindow);

    // Cabin door (thin box)
    var doorGeom = new THREE.BoxGeometry(1, 2.5, 0.15);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x882200,
      roughness: 0.5,
      metalness: 0.4
    });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(0, 0, 4);
    cabin.add(door);

    // Left support wheel (cylinder on cable)
    var wheelGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.6,
      metalness: 0.9
    });
    var leftWheel = new THREE.Mesh(wheelGeom, wheelMat);
    leftWheel.rotation.z = Math.PI / 2;
    leftWheel.position.set(-2.5, -3, 0);
    cabin.add(leftWheel);

    // Right support wheel
    var rightWheel = new THREE.Mesh(wheelGeom, wheelMat);
    rightWheel.rotation.z = Math.PI / 2;
    rightWheel.position.set(2.5, -3, 0);
    cabin.add(rightWheel);

    // Roof box (small, extending above)
    var roofBoxGeom = new THREE.BoxGeometry(7, 1.5, 9);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x990000,
      roughness: 0.5,
      metalness: 0.2
    });
    var roofBox = new THREE.Mesh(roofBoxGeom, roofMat);
    roofBox.position.set(0, 3, 0);
    cabin.add(roofBox);

    // Antenna/tower on roof
    var antennaGeom = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
    var antennaMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.3,
      metalness: 0.8
    });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(2, 5, 0);
    cabin.add(antenna);

    gondola = { cabin, door, leftWindow, rightWindow, leftWheel, rightWheel };
    return cabin;
  }

  function createCliffLedgeSnipers() {
    // Sniper nest on left cliff ledge
    var leftLedgeGeom = new THREE.BoxGeometry(10, 1, 8);
    var ledgeMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.5,
      metalness: 0.5
    });
    var leftLedge = new THREE.Mesh(leftLedgeGeom, ledgeMat);
    leftLedge.position.set(-50, 40, -60);
    scene.add(leftLedge);
    objects.push(leftLedge);

    // Sniper shooting stand (thin box)
    var shootStandGeom = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    var shootMat = new THREE.MeshStandardMaterial({
      color: colors.darkGray,
      roughness: 0.4,
      metalness: 0.6
    });
    var shootStand = new THREE.Mesh(shootStandGeom, shootMat);
    shootStand.position.set(-50, 42, -60);
    shootStand.userData.type = 'sniper';
    scene.add(shootStand);
    objects.push(shootStand);
    snipers.push(shootStand);

    // Right cliff ledge
    var rightLedgeGeom = new THREE.BoxGeometry(10, 1, 8);
    var rightLedge = new THREE.Mesh(rightLedgeGeom, ledgeMat);
    rightLedge.position.set(50, 45, -60);
    scene.add(rightLedge);
    objects.push(rightLedge);

    // Right sniper stand
    var rightShootStand = new THREE.Mesh(shootStandGeom, shootMat);
    rightShootStand.position.set(50, 47, -60);
    rightShootStand.userData.type = 'sniper';
    scene.add(rightShootStand);
    objects.push(rightShootStand);
    snipers.push(rightShootStand);
  }

  function createPineTrees() {
    // Tree 1 - left cliff edge
    var trunk1Geom = new THREE.CylinderGeometry(0.8, 1.2, 10, 8);
    var trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4A3A2A,
      roughness: 0.8,
      metalness: 0.1
    });
    var trunk1 = new THREE.Mesh(trunk1Geom, trunkMat);
    trunk1.position.set(-55, 30, -65);
    trunk1.castShadow = true;
    scene.add(trunk1);
    objects.push(trunk1);

    var foliage1Geom = new THREE.ConeGeometry(4, 12, 8);
    var foliageMat = new THREE.MeshStandardMaterial({
      color: colors.pineGreen,
      roughness: 0.7,
      metalness: 0
    });
    var foliage1 = new THREE.Mesh(foliage1Geom, foliageMat);
    foliage1.position.set(-55, 40, -65);
    foliage1.castShadow = true;
    scene.add(foliage1);
    objects.push(foliage1);
    trees.push({ foliage: foliage1, baseRotY: foliage1.rotation.y });

    // Tree 2 - left cliff
    var trunk2Geom = new THREE.CylinderGeometry(0.7, 1, 8, 8);
    var trunk2 = new THREE.Mesh(trunk2Geom, trunkMat);
    trunk2.position.set(-30, 25, -70);
    trunk2.castShadow = true;
    scene.add(trunk2);
    objects.push(trunk2);

    var foliage2Geom = new THREE.ConeGeometry(3.5, 10, 8);
    var foliage2 = new THREE.Mesh(foliage2Geom, foliageMat);
    foliage2.position.set(-30, 35, -70);
    foliage2.castShadow = true;
    scene.add(foliage2);
    objects.push(foliage2);
    trees.push({ foliage: foliage2, baseRotY: foliage2.rotation.y });

    // Tree 3 - right cliff edge
    var trunk3Geom = new THREE.CylinderGeometry(0.8, 1.2, 10, 8);
    var trunk3 = new THREE.Mesh(trunk3Geom, trunkMat);
    trunk3.position.set(60, 35, -65);
    trunk3.castShadow = true;
    scene.add(trunk3);
    objects.push(trunk3);

    var foliage3Geom = new THREE.ConeGeometry(4, 12, 8);
    var foliage3 = new THREE.Mesh(foliage3Geom, foliageMat);
    foliage3.position.set(60, 45, -65);
    foliage3.castShadow = true;
    scene.add(foliage3);
    objects.push(foliage3);
    trees.push({ foliage: foliage3, baseRotY: foliage3.rotation.y });

    // Tree 4 - right cliff
    var trunk4Geom = new THREE.CylinderGeometry(0.7, 1, 8, 8);
    var trunk4 = new THREE.Mesh(trunk4Geom, trunkMat);
    trunk4.position.set(45, 30, -70);
    trunk4.castShadow = true;
    scene.add(trunk4);
    objects.push(trunk4);

    var foliage4Geom = new THREE.ConeGeometry(3.5, 10, 8);
    var foliage4 = new THREE.Mesh(foliage4Geom, foliageMat);
    foliage4.position.set(45, 40, -70);
    foliage4.castShadow = true;
    scene.add(foliage4);
    objects.push(foliage4);
    trees.push({ foliage: foliage4, baseRotY: foliage4.rotation.y });
  }

  function createCounterweightSystem() {
    // Counterweight box (heavy mass for balance)
    var counterGeom = new THREE.BoxGeometry(3, 6, 4);
    var counterMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.3,
      metalness: 0.9
    });
    var counterweight = new THREE.Mesh(counterGeom, counterMat);
    counterweight.position.set(80, 10, 20);
    counterweight.castShadow = true;
    scene.add(counterweight);
    objects.push(counterweight);

    // Cable guide pulley
    var pulleyGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var pulleyMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.2,
      metalness: 0.95
    });
    var pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulley.position.set(0, 70, 0);
    pulley.castShadow = true;
    scene.add(pulley);
    objects.push(pulley);
  }

  function createEngineRoom() {
    // Engine room building at lower station
    var engineGeom = new THREE.BoxGeometry(15, 10, 12);
    var engineMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.4
    });
    var engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(-75, -10, -35);
    engine.castShadow = true;
    scene.add(engine);
    objects.push(engine);

    // Motor unit (cylinder inside)
    var motorGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
    var motorMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.3,
      metalness: 0.8
    });
    var motor = new THREE.Mesh(motorGeom, motorMat);
    motor.position.set(-75, -10, -35);
    scene.add(motor);
    objects.push(motor);
  }

  function createRescueRappelSetup() {
    // Rappel anchor point on upper station
    var anchorGeom = new THREE.SphereGeometry(0.6, 8, 8);
    var anchorMat = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      roughness: 0.4,
      metalness: 0.9
    });
    var anchor = new THREE.Mesh(anchorGeom, anchorMat);
    anchor.position.set(75, 62, 50);
    scene.add(anchor);
    objects.push(anchor);

    // Rappel rope using LineSegments
    var ropePoints = [];
    ropePoints.push(new THREE.Vector3(75, 62, 50));
    ropePoints.push(new THREE.Vector3(75, 35, 55));
    ropePoints.push(new THREE.Vector3(75, 8, 60));

    var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMat = new THREE.LineBasicMaterial({
      color: 0xFF8800,
      linewidth: 2
    });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(rope);
    objects.push(rope);

    // Rappel equipment platform
    var equipGeom = new THREE.BoxGeometry(4, 1, 6);
    var equipMat = new THREE.MeshStandardMaterial({
      color: colors.steelGray,
      roughness: 0.5,
      metalness: 0.6
    });
    var equipment = new THREE.Mesh(equipGeom, equipMat);
    equipment.position.set(75, 50, 50);
    scene.add(equipment);
    objects.push(equipment);
  }

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;
    objects = [];
    snipers = [];
    trees = [];
    time = 0;
    gondolaProgress = 0;

    createMountainGorge();
    createLowerTerminal();
    createUpperTerminal();
    createCableSuspension();
    var gondolaMesh = createGondolaCar();
    objects.push(gondolaMesh);
    createCliffLedgeSnipers();
    createPineTrees();
    createCounterweightSystem();
    createEngineRoom();
    createRescueRappelSetup();
  }

  function update(delta) {
    time += delta;

    // Update gondola position along cable
    gondolaProgress += gondolaSpeed * delta;
    if (gondolaProgress > 1) {
      gondolaProgress = 1;
    }

    if (gondola && gondola.cabin) {
      var gondolaPos = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(startPos.x, startPos.y, startPos.z),
        new THREE.Vector3(endPos.x, endPos.y, endPos.z),
        gondolaProgress
      );

      // Add subtle cable sway
      var swayAmount = Math.sin(time * 0.8) * 0.5;
      gondolaPos.z += swayAmount;

      gondola.cabin.position.copy(gondolaPos);

      // Gondola tilt based on movement
      gondola.cabin.rotation.z = Math.sin(time * 0.5) * 0.05;

      // Door opening animation at certain progress points
      if (gondolaProgress > 0.3 && gondolaProgress < 0.5) {
        gondola.door.rotation.y = (gondolaProgress - 0.3) * 2.5;
      } else if (gondolaProgress >= 0.5) {
        gondola.door.rotation.y = 0.5;
      }

      // Window bullet hole effect (glass cracks at progress 0.6)
      if (gondolaProgress > 0.6) {
        gondola.leftWindow.material.opacity = 0.3;
        gondola.rightWindow.material.opacity = 0.3;
      }
    }

    // Animate snipers at terminals
    for (var i = 0; i < snipers.length; i++) {
      var sniper = snipers[i];
      // Aiming animation - rotation based on gondola position
      sniper.rotation.y = Math.sin(time * 1.2) * 0.3;
      sniper.rotation.x = Math.cos(time * 0.9) * 0.2;
    }

    // Tree sway in wind
    for (var j = 0; j < trees.length; j++) {
      var tree = trees[j];
      var windSway = Math.sin(time * 0.6 + j) * 0.08;
      tree.foliage.rotation.z = windSway;
      tree.foliage.rotation.y = tree.baseRotY + Math.cos(time * 0.7 + j) * 0.05;
    }

    // Cable subtle oscillation
    if (cableWire) {
      var cableOscillation = Math.sin(time * 0.4) * 0.3;
      cableWire.position.z = cableOscillation;
    }
  }

  function reset() {
    // Clear all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    if (gondola && gondola.cabin) {
      scene.remove(gondola.cabin);
    }

    if (cableWire) {
      scene.remove(cableWire);
    }

    objects = [];
    snipers = [];
    trees = [];
    gondola = null;
    cableWire = null;
    time = 0;
    gondolaProgress = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
