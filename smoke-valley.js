window.SmokeValley = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var smokeClouds = [];
  var fireParticles = [];
  var shellTrajectory = null;
  var time = 0;

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    smokeClouds = [];
    fireParticles = [];
    time = 0;

    createValleyTerrain();
    createArtilleryCraters();
    createSmokeClouds();
    createDestroyedArtilleryPositions();
    createTrenchNetwork();
    createRuinedFarmhouse();
    createAbandonedFieldHospital();
    createBrokenCommunicationLines();
    createUnexplodedShells();
    createDebrisField();
    createMachineGunNests();
    createBurningSupplyDepot();
    createShellCratersWithWater();
  }

  function createValleyTerrain() {
    var eastHill = new THREE.BoxGeometry(15, 20, 80);
    var eastHillMat = new THREE.MeshPhongMaterial({ color: 0x6B5444 });
    var eastHillMesh = new THREE.Mesh(eastHill, eastHillMat);
    eastHillMesh.position.set(32.5, 10, 0);
    eastHillMesh.rotation.z = 0.3;
    scene.add(eastHillMesh);
    objects.push(eastHillMesh);

    var westHill = new THREE.BoxGeometry(15, 20, 80);
    var westHillMat = new THREE.MeshPhongMaterial({ color: 0x6B5444 });
    var westHillMesh = new THREE.Mesh(westHill, westHillMat);
    westHillMesh.position.set(-32.5, 10, 0);
    westHillMesh.rotation.z = -0.3;
    scene.add(westHillMesh);
    objects.push(westHillMesh);

    var valleyFloor = new THREE.BoxGeometry(50, 0.5, 80);
    var floorMat = new THREE.MeshPhongMaterial({ color: 0x4A3F35 });
    var floorMesh = new THREE.Mesh(valleyFloor, floorMat);
    floorMesh.position.set(0, -0.25, 0);
    scene.add(floorMesh);
    objects.push(floorMesh);
  }

  function createArtilleryCraters() {
    var craterPositions = [
      [-20, -2, -30], [-10, -2.5, -20], [15, -2, 10], [25, -2.3, -15],
      [-5, -2.2, 25], [8, -2.1, -35], [-25, -2.4, 5], [20, -2, 30]
    ];

    for (var i = 0; i < craterPositions.length; i++) {
      var pos = craterPositions[i];
      var crater = new THREE.BoxGeometry(8, 3, 8);
      var craterMat = new THREE.MeshPhongMaterial({ color: 0x3A3530 });
      var craterMesh = new THREE.Mesh(crater, craterMat);
      craterMesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(craterMesh);
      objects.push(craterMesh);
    }
  }

  function createSmokeClouds() {
    var smokePositions = [
      [-20, 12, -20], [-15, 10, -10], [-10, 14, 0], [-5, 11, 10],
      [0, 13, -15], [5, 12, 5], [10, 11, -5], [15, 13, 15],
      [20, 10, -10], [25, 12, 20], [-25, 11, 20], [8, 9, -25],
      [-12, 15, 8], [18, 10, -30], [-18, 12, -5], [12, 14, 25],
      [-3, 11, -30], [22, 13, -20], [-30, 10, 0], [28, 11, 15],
      [-22, 13, 30], [15, 9, 35], [-8, 12, -35], [10, 14, -25]
    ];

    for (var i = 0; i < smokePositions.length; i++) {
      var pos = smokePositions[i];
      var smokeGeo = new THREE.SphereGeometry(6, 8, 8);
      var smokeMat = new THREE.MeshPhongMaterial({
        color: 0x444444,
        emissive: 0x222222,
        transparent: true,
        opacity: 0.6
      });
      var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
      smokeMesh.position.set(pos[0], pos[1], pos[2]);
      smokeMesh.castShadow = false;
      smokeMesh.receiveShadow = false;
      scene.add(smokeMesh);
      objects.push(smokeMesh);
      smokeClouds.push({
        mesh: smokeMesh,
        baseX: pos[0],
        baseY: pos[1],
        baseZ: pos[2],
        driftAmount: Math.random() * 0.5,
        driftPhase: Math.random() * Math.PI * 2,
        expandRate: 0.03 + Math.random() * 0.05
      });
    }
  }

  function createDestroyedArtilleryPositions() {
    var posPositions = [[35, 5, -35], [-35, 5, -25], [38, 6, 20], [-38, 6, 30]];

    for (var i = 0; i < posPositions.length; i++) {
      var pos = posPositions[i];

      var gunBase = new THREE.BoxGeometry(6, 3, 6);
      var gunMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
      var gunBaseMesh = new THREE.Mesh(gunBase, gunMat);
      gunBaseMesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(gunBaseMesh);
      objects.push(gunBaseMesh);

      var rubble = new THREE.BoxGeometry(4, 2, 4);
      var rubbleMat = new THREE.MeshPhongMaterial({ color: 0x6B5A52 });
      var rubbleMesh = new THREE.Mesh(rubble, rubbleMat);
      rubbleMesh.position.set(pos[0] + 3, pos[1] + 1, pos[2] + 2);
      rubbleMesh.rotation.z = 0.5;
      scene.add(rubbleMesh);
      objects.push(rubbleMesh);

      var gunBarrel = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var barrelMesh = new THREE.Mesh(gunBarrel, barrelMat);
      barrelMesh.position.set(pos[0], pos[1] + 2, pos[2]);
      barrelMesh.rotation.z = 0.4;
      scene.add(barrelMesh);
      objects.push(barrelMesh);
    }
  }

  function createTrenchNetwork() {
    var trenchPositions = [
      {x: -20, z: -20}, {x: -20, z: 0}, {x: -20, z: 20},
      {x: 0, z: -25}, {x: 0, z: 25},
      {x: 20, z: -20}, {x: 20, z: 0}, {x: 20, z: 20}
    ];

    for (var i = 0; i < trenchPositions.length; i++) {
      var tpos = trenchPositions[i];

      var trenchFloor = new THREE.BoxGeometry(15, 1, 2);
      var trenchMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
      var trenchFloorMesh = new THREE.Mesh(trenchFloor, trenchMat);
      trenchFloorMesh.position.set(tpos.x, -0.5, tpos.z);
      scene.add(trenchFloorMesh);
      objects.push(trenchFloorMesh);

      var trenchWallLeft = new THREE.BoxGeometry(0.5, 2, 2);
      var wallMat = new THREE.MeshPhongMaterial({ color: 0x6B5544 });
      var wallLeftMesh = new THREE.Mesh(trenchWallLeft, wallMat);
      wallLeftMesh.position.set(tpos.x - 7.5, 0.5, tpos.z);
      scene.add(wallLeftMesh);
      objects.push(wallLeftMesh);

      var trenchWallRight = new THREE.BoxGeometry(0.5, 2, 2);
      var wallRightMesh = new THREE.Mesh(trenchWallRight, wallMat);
      wallRightMesh.position.set(tpos.x + 7.5, 0.5, tpos.z);
      scene.add(wallRightMesh);
      objects.push(wallRightMesh);
    }
  }

  function createRuinedFarmhouse() {
    var farmX = -15;
    var farmZ = -10;
    var farmY = 0;

    var mainWall = new THREE.BoxGeometry(8, 6, 8);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var mainWallMesh = new THREE.Mesh(mainWall, wallMat);
    mainWallMesh.position.set(farmX, farmY + 3, farmZ);
    scene.add(mainWallMesh);
    objects.push(mainWallMesh);

    var collapsedRoof = new THREE.BoxGeometry(9, 2, 9);
    var roofMat = new THREE.MeshPhongMaterial({ color: 0x4A3A32 });
    var roofMesh = new THREE.Mesh(collapsedRoof, roofMat);
    roofMesh.position.set(farmX + 1, farmY + 6.5, farmZ + 1);
    roofMesh.rotation.z = 0.3;
    scene.add(roofMesh);
    objects.push(roofMesh);

    var chimney = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
    var chimneyMat = new THREE.MeshPhongMaterial({ color: 0x6B5544 });
    var chimneyMesh = new THREE.Mesh(chimney, chimneyMat);
    chimneyMesh.position.set(farmX - 2, farmY + 5, farmZ - 2);
    scene.add(chimneyMesh);
    objects.push(chimneyMesh);

    var doorFrame = new THREE.BoxGeometry(2, 3, 0.2);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x3A2A22 });
    var doorMesh = new THREE.Mesh(doorFrame, doorMat);
    doorMesh.position.set(farmX, farmY + 1.5, farmZ - 4.1);
    scene.add(doorMesh);
    objects.push(doorMesh);
  }

  function createAbandonedFieldHospital() {
    var hospX = 18;
    var hospZ = 5;
    var hospY = 0;

    var tentFrame = new THREE.BoxGeometry(10, 5, 10);
    var tentMat = new THREE.MeshPhongMaterial({ color: 0xA0A0A0 });
    var tentMesh = new THREE.Mesh(tentFrame, tentMat);
    tentMesh.position.set(hospX, hospY + 2.5, hospZ);
    scene.add(tentMesh);
    objects.push(tentMesh);

    var redCrossLeft = new THREE.BoxGeometry(1, 4, 0.1);
    var crossMat = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    var crossLeftMesh = new THREE.Mesh(redCrossLeft, crossMat);
    crossLeftMesh.position.set(hospX - 4, hospY + 3, hospZ - 5.1);
    scene.add(crossLeftMesh);
    objects.push(crossLeftMesh);

    var redCrossTop = new THREE.BoxGeometry(4, 1, 0.1);
    var crossTopMesh = new THREE.Mesh(redCrossTop, crossMat);
    crossTopMesh.position.set(hospX - 4, hospY + 3, hospZ - 5.1);
    scene.add(crossTopMesh);
    objects.push(crossTopMesh);

    var redCrossRight = new THREE.BoxGeometry(1, 4, 0.1);
    var crossRightMesh = new THREE.Mesh(redCrossRight, crossMat);
    crossRightMesh.position.set(hospX + 4, hospY + 3, hospZ - 5.1);
    scene.add(crossRightMesh);
    objects.push(crossRightMesh);

    var tentPole1 = new THREE.CylinderGeometry(0.3, 0.3, 5, 12);
    var poleMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
    var tentPole1Mesh = new THREE.Mesh(tentPole1, poleMat);
    tentPole1Mesh.position.set(hospX - 3, hospY + 2.5, hospZ - 3);
    scene.add(tentPole1Mesh);
    objects.push(tentPole1Mesh);

    var tentPole2 = new THREE.CylinderGeometry(0.3, 0.3, 5, 12);
    var tentPole2Mesh = new THREE.Mesh(tentPole2, poleMat);
    tentPole2Mesh.position.set(hospX + 3, hospY + 2.5, hospZ + 3);
    scene.add(tentPole2Mesh);
    objects.push(tentPole2Mesh);
  }

  function createBrokenCommunicationLines() {
    var polePositions = [
      [-30, 8, -20], [-20, 8, 0], [-10, 8, 15], [0, 8, -25],
      [10, 8, 10], [25, 8, -15]
    ];

    for (var i = 0; i < polePositions.length; i++) {
      var ppos = polePositions[i];

      var pole = new THREE.CylinderGeometry(0.4, 0.5, 8, 12);
      var poleMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
      var poleMesh = new THREE.Mesh(pole, poleMat);
      poleMesh.position.set(ppos[0], ppos[1], ppos[2]);
      scene.add(poleMesh);
      objects.push(poleMesh);

      if (i < polePositions.length - 1) {
        var nextPos = polePositions[i + 1];
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
          ppos[0], ppos[1], ppos[2],
          nextPos[0] + (Math.random() - 0.5) * 4, nextPos[1] - 2, nextPos[2] + (Math.random() - 0.5) * 4
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var wire = new THREE.LineSegments(wireGeometry, wireMat);
        scene.add(wire);
        objects.push(wire);
      }
    }
  }

  function createUnexplodedShells() {
    var shellPositions = [
      [-20, -1.5, -20], [-10, -1.3, -15], [5, -1.4, 10], [15, -1.2, -25],
      [-15, -1.5, 25], [20, -1.1, 5], [-5, -1.3, -30], [25, -1.4, 20]
    ];

    for (var i = 0; i < shellPositions.length; i++) {
      var spos = shellPositions[i];
      var shell = new THREE.CylinderGeometry(0.6, 0.6, 2.5, 12);
      var shellMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var shellMesh = new THREE.Mesh(shell, shellMat);
      shellMesh.position.set(spos[0], spos[1], spos[2]);
      shellMesh.rotation.z = (Math.random() - 0.5) * 1;
      scene.add(shellMesh);
      objects.push(shellMesh);

      var shellTip = new THREE.ConeGeometry(0.6, 1, 12);
      var tipMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var tipMesh = new THREE.Mesh(shellTip, tipMat);
      tipMesh.position.set(spos[0], spos[1] + 1.75, spos[2]);
      scene.add(tipMesh);
      objects.push(tipMesh);
    }
  }

  function createDebrisField() {
    var debrisPositions = [
      [-22, 0.3, -18], [-18, 0.2, -22], [-10, 0.4, -5], [0, 0.2, 8],
      [8, 0.3, 12], [15, 0.2, 2], [-8, 0.35, 20], [20, 0.25, -10],
      [-25, 0.3, 10], [30, 0.2, 15], [5, 0.4, -28], [-12, 0.25, -32],
      [18, 0.3, 28], [-18, 0.2, 30], [10, 0.35, 25], [-28, 0.25, -10]
    ];

    for (var i = 0; i < debrisPositions.length; i++) {
      var dpos = debrisPositions[i];
      var debrisType = i % 3;

      if (debrisType === 0) {
        var stake = new THREE.BoxGeometry(0.3, 2, 0.3);
        var stakeMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
        var stakeMesh = new THREE.Mesh(stake, stakeMat);
        stakeMesh.position.set(dpos[0], dpos[1], dpos[2]);
        stakeMesh.rotation.z = (Math.random() - 0.5) * 0.5;
        scene.add(stakeMesh);
        objects.push(stakeMesh);
      } else if (debrisType === 1) {
        var equipment = new THREE.BoxGeometry(1.5, 0.5, 1);
        var eqMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
        var eqMesh = new THREE.Mesh(equipment, eqMat);
        eqMesh.position.set(dpos[0], dpos[1], dpos[2]);
        eqMesh.rotation.y = Math.random() * Math.PI;
        scene.add(eqMesh);
        objects.push(eqMesh);
      } else {
        var wire = new THREE.BoxGeometry(0.1, 3, 0.1);
        var wireMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        var wireMesh = new THREE.Mesh(wire, wireMat);
        wireMesh.position.set(dpos[0], dpos[1] + 1, dpos[2]);
        scene.add(wireMesh);
        objects.push(wireMesh);
      }
    }
  }

  function createMachineGunNests() {
    var nestPositions = [[-30, 1, -30], [30, 1, 25], [-35, 1, 15], [35, 1, -20]];

    for (var i = 0; i < nestPositions.length; i++) {
      var npos = nestPositions[i];

      var nestBox = new THREE.BoxGeometry(4, 2, 4);
      var nestMat = new THREE.MeshPhongMaterial({ color: 0x6B5544 });
      var nestMesh = new THREE.Mesh(nestBox, nestMat);
      nestMesh.position.set(npos[0], npos[1] + 1, npos[2]);
      scene.add(nestMesh);
      objects.push(nestMesh);

      var gunBarrel = new THREE.CylinderGeometry(0.25, 0.25, 3, 12);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var barrelMesh = new THREE.Mesh(gunBarrel, barrelMat);
      barrelMesh.position.set(npos[0], npos[1] + 1.5, npos[2] + 1.5);
      barrelMesh.rotation.z = 0.2;
      scene.add(barrelMesh);
      objects.push(barrelMesh);

      var sightBox = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var sightMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var sightMesh = new THREE.Mesh(sightBox, sightMat);
      sightMesh.position.set(npos[0], npos[1] + 2, npos[2] - 0.5);
      scene.add(sightMesh);
      objects.push(sightMesh);
    }
  }

  function createBurningSupplyDepot() {
    var depotX = 0;
    var depotZ = 22;
    var depotY = 0;

    var mainBuilding = new THREE.BoxGeometry(12, 8, 10);
    var buildMat = new THREE.MeshPhongMaterial({ color: 0x5A4A42 });
    var mainBuildingMesh = new THREE.Mesh(mainBuilding, buildMat);
    mainBuildingMesh.position.set(depotX, depotY + 4, depotZ);
    scene.add(mainBuildingMesh);
    objects.push(mainBuildingMesh);

    var fireCount = 12;
    for (var f = 0; f < fireCount; f++) {
      var firePosX = depotX + (Math.random() - 0.5) * 10;
      var firePosZ = depotZ + (Math.random() - 0.5) * 8;
      var firePosY = depotY + 4 + Math.random() * 5;

      var fireGeo = new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 8, 8);
      var fireMat = new THREE.MeshPhongMaterial({
        color: 0xFF6600 + Math.floor(Math.random() * 0x003300),
        emissive: 0xFF3300,
        transparent: true,
        opacity: 0.8
      });
      var fireMesh = new THREE.Mesh(fireGeo, fireMat);
      fireMesh.position.set(firePosX, firePosY, firePosZ);
      scene.add(fireMesh);
      objects.push(fireMesh);

      fireParticles.push({
        mesh: fireMesh,
        baseX: firePosX,
        baseY: firePosY,
        baseZ: firePosZ,
        flicker: Math.random() * Math.PI * 2,
        flickerSpeed: 2 + Math.random() * 3,
        floatSpeed: 0.5 + Math.random() * 1
      });
    }

    var roof = new THREE.BoxGeometry(13, 2, 11);
    var roofMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var roofMesh = new THREE.Mesh(roof, roofMat);
    roofMesh.position.set(depotX + 0.5, depotY + 8.5, depotZ + 0.5);
    roofMesh.rotation.x = 0.15;
    scene.add(roofMesh);
    objects.push(roofMesh);

    var door = new THREE.BoxGeometry(2, 4, 0.2);
    var doorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var doorMesh = new THREE.Mesh(door, doorMat);
    doorMesh.position.set(depotX - 5, depotY + 2, depotZ - 5.1);
    scene.add(doorMesh);
    objects.push(doorMesh);
  }

  function createShellCratersWithWater() {
    var waterPositions = [
      [-15, -1.5, 35], [10, -1.3, -35], [28, -1.4, 10], [-28, -1.2, -15]
    ];

    for (var w = 0; w < waterPositions.length; w++) {
      var wpos = waterPositions[w];

      var crater = new THREE.BoxGeometry(7, 2, 7);
      var craterMat = new THREE.MeshPhongMaterial({ color: 0x3A3530 });
      var craterMesh = new THREE.Mesh(crater, craterMat);
      craterMesh.position.set(wpos[0], wpos[1], wpos[2]);
      scene.add(craterMesh);
      objects.push(craterMesh);

      var water = new THREE.BoxGeometry(6.5, 0.3, 6.5);
      var waterMat = new THREE.MeshPhongMaterial({
        color: 0x1A1A2E,
        emissive: 0x0A0A1A,
        transparent: true,
        opacity: 0.7
      });
      var waterMesh = new THREE.Mesh(water, waterMat);
      waterMesh.position.set(wpos[0], wpos[1] + 0.5, wpos[2]);
      scene.add(waterMesh);
      objects.push(waterMesh);
    }
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < smokeClouds.length; i++) {
      var smoke = smokeClouds[i];
      var driftX = Math.sin(time * smoke.driftAmount + smoke.driftPhase) * 2;
      var driftZ = Math.cos(time * smoke.driftAmount + smoke.driftPhase) * 1.5;

      smoke.mesh.position.x = smoke.baseX + driftX;
      smoke.mesh.position.z = smoke.baseZ + driftZ;
      smoke.mesh.position.y = smoke.baseY + Math.sin(time * 0.5 + i) * 0.5;

      smoke.mesh.scale.x += smoke.expandRate * delta;
      smoke.mesh.scale.y += smoke.expandRate * delta;
      smoke.mesh.scale.z += smoke.expandRate * delta;

      smoke.mesh.material.opacity = Math.max(0.3, 0.6 - (smoke.mesh.scale.x - 1) * 0.1);
    }

    for (var f = 0; f < fireParticles.length; f++) {
      var fire = fireParticles[f];

      var flicker = Math.sin(time * fire.flickerSpeed + fire.flicker);
      fire.mesh.scale.x = 1 + flicker * 0.3;
      fire.mesh.scale.y = 1 + flicker * 0.3;
      fire.mesh.scale.z = 1 + flicker * 0.3;

      fire.mesh.position.y = fire.baseY + Math.sin(time * fire.floatSpeed) * 0.5;
      fire.mesh.position.x = fire.baseX + Math.sin(time * 0.5 + f) * 0.2;
      fire.mesh.position.z = fire.baseZ + Math.cos(time * 0.5 + f) * 0.2;
    }

    if (Math.floor(time * 2) % 30 === 0 && Math.floor(time * 2) !== Math.floor((time - delta) * 2)) {
      createShellTrajectory();
    }

    if (shellTrajectory) {
      var progress = (time - shellTrajectory.startTime) / shellTrajectory.duration;
      if (progress >= 1) {
        scene.remove(shellTrajectory.mesh);
        objects = objects.filter(function(obj) { return obj !== shellTrajectory.mesh; });
        shellTrajectory = null;
      } else {
        var startX = shellTrajectory.startX;
        var startY = shellTrajectory.startY;
        var startZ = shellTrajectory.startZ;
        var endX = shellTrajectory.endX;
        var endY = shellTrajectory.endY;
        var endZ = shellTrajectory.endZ;

        var arcHeight = 15;
        var currentX = startX + (endX - startX) * progress;
        var currentY = startY + (endY - startY) * progress + Math.sin(progress * Math.PI) * arcHeight;
        var currentZ = startZ + (endZ - startZ) * progress;

        shellTrajectory.mesh.position.set(currentX, currentY, currentZ);
      }
    }
  }

  function createShellTrajectory() {
    var startX = -40 + Math.random() * 20;
    var startY = 5;
    var startZ = -40;
    var endX = -20 + Math.random() * 40;
    var endY = 2;
    var endZ = 40;

    var shellGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var shellMat = new THREE.MeshPhongMaterial({
      color: 0x444444,
      emissive: 0x222222
    });
    var shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.position.set(startX, startY, startZ);
    scene.add(shellMesh);
    objects.push(shellMesh);

    shellTrajectory = {
      mesh: shellMesh,
      startX: startX,
      startY: startY,
      startZ: startZ,
      endX: endX,
      endY: endY,
      endZ: endZ,
      startTime: time,
      duration: 3
    };
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    smokeClouds = [];
    fireParticles = [];
    shellTrajectory = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
