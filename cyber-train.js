window.CyberTrain = (function() {
  'use strict';

  var scene, camera;
  var trainGroup, trainCars = [];
  var cityGroup, buildings = [];
  var railGroup, railSegments;
  var effectsGroup;
  var speedBlurLines = [];
  var arcSparks = [];
  var turrets = [];
  var billboards = [];
  var damageHoles = [];
  var elapsedTime = 0;
  var trainSpeed = 0;
  var maxTrainSpeed = 150;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    trainGroup = new THREE.Group();
    cityGroup = new THREE.Group();
    railGroup = new THREE.Group();
    effectsGroup = new THREE.Group();

    scene.add(trainGroup);
    scene.add(cityGroup);
    scene.add(railGroup);
    scene.add(effectsGroup);

    buildTrainCars();
    buildRailTrack();
    buildCityBackdrop();
    buildSpeedBlur();
    buildSecurityTurrets();
    buildEmergencyBrake();
    buildDamageZones();

    return true;
  }

  function buildTrainCars() {
    var carWidth = 15;
    var carHeight = 12;
    var carDepth = 25;
    var carSpacing = 0.5;

    for (var i = 0; i < 6; i++) {
      var carGeom = new THREE.BoxGeometry(carWidth, carHeight, carDepth);
      var carMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.8,
        roughness: 0.2
      });
      var carMesh = new THREE.Mesh(carGeom, carMat);
      carMesh.position.z = i * (carDepth + carSpacing);
      carMesh.castShadow = true;
      carMesh.receiveShadow = true;
      trainGroup.add(carMesh);
      trainCars.push(carMesh);

      // Add car coupling
      if (i < 5) {
        var couplingGeom = new THREE.BoxGeometry(3, 2, 4);
        var couplingMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f });
        var coupling = new THREE.Mesh(couplingGeom, couplingMat);
        coupling.position.z = i * (carDepth + carSpacing) + carDepth / 2 + 2;
        coupling.position.y = -carHeight / 2;
        trainGroup.add(coupling);
      }

      // Add windows
      for (var j = 0; j < 4; j++) {
        var windowGeom = new THREE.BoxGeometry(2, 2, 0.3);
        var windowMat = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0088ff,
          metalness: 0.9
        });
        var window = new THREE.Mesh(windowGeom, windowMat);
        window.position.x = -5 + j * 3.5;
        window.position.y = 2;
        window.position.z = i * (carDepth + carSpacing);
        trainGroup.add(window);
      }

      // Add roof hatch
      var hatchGeom = new THREE.BoxGeometry(4, 0.5, 3);
      var hatchMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var hatch = new THREE.Mesh(hatchGeom, hatchMat);
      hatch.position.y = carHeight / 2 + 0.3;
      hatch.position.z = i * (carDepth + carSpacing);
      trainGroup.add(hatch);

      // Add interior seats
      for (var k = 0; k < 3; k++) {
        var seatGeom = new THREE.BoxGeometry(2, 1, 2);
        var seatMat = new THREE.MeshStandardMaterial({ color: 0xff1744 });
        var seat = new THREE.Mesh(seatGeom, seatMat);
        seat.position.x = -6 + k * 6;
        seat.position.y = -4;
        seat.position.z = i * (carDepth + carSpacing);
        trainGroup.add(seat);
      }

      // Add floor markings
      var markGeom = new THREE.BoxGeometry(12, 0.1, 2);
      var markMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0x888800 });
      var marking = new THREE.Mesh(markGeom, markMat);
      marking.position.y = -carHeight / 2 - 0.1;
      marking.position.z = i * (carDepth + carSpacing);
      trainGroup.add(marking);
    }
  }

  function buildRailTrack() {
    var railPositions = [];
    var trackLength = 200;
    var trackSpacing = 5;

    for (var i = 0; i < trackLength; i += trackSpacing) {
      railPositions.push(-8, -25, i);
      railPositions.push(8, -25, i);
    }

    var railGeom = new THREE.BufferGeometry();
    railGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(railPositions), 3));
    var railMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    railSegments = new THREE.LineSegments(railGeom, railMat);
    railGroup.add(railSegments);

    // Add magnetic field glow (blue mist spheres)
    for (var j = 0; j < 10; j++) {
      var glowGeom = new THREE.SphereGeometry(6, 8, 8);
      var glowMat = new THREE.MeshStandardMaterial({
        color: 0x0088ff,
        emissive: 0x0055ff,
        transparent: true,
        opacity: 0.2,
        metalness: 0.5
      });
      var glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.y = -25;
      glow.position.z = j * 20;
      railGroup.add(glow);
    }
  }

  function buildCityBackdrop() {
    for (var i = 0; i < 12; i++) {
      var buildingHeight = 40 + Math.random() * 60;
      var buildingWidth = 25 + Math.random() * 15;
      var buildingGeom = new THREE.BoxGeometry(buildingWidth, buildingHeight, 20);
      var buildingMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6, 0.7, 0.3),
        metalness: 0.6,
        roughness: 0.4
      });
      var building = new THREE.Mesh(buildingGeom, buildingMat);

      var xPos = (i % 2 === 0 ? -60 : 60) + Math.random() * 20;
      building.position.x = xPos;
      building.position.y = buildingHeight / 2;
      building.position.z = (Math.floor(i / 2) - 3) * 60;

      cityGroup.add(building);
      buildings.push({
        mesh: building,
        baseZ: building.position.z,
        originalY: buildingHeight / 2
      });

      // Add neon billboards to buildings
      for (var j = 0; j < 2; j++) {
        var boardGeom = new THREE.BoxGeometry(buildingWidth - 2, 8, 1);
        var boardMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.9, 0.5),
          emissive: new THREE.Color().setHSL(Math.random(), 1, 0.6),
          metalness: 0.8
        });
        var board = new THREE.Mesh(boardGeom, boardMat);
        board.position.x = xPos;
        board.position.y = buildingHeight * 0.3 + j * 15;
        board.position.z = (Math.floor(i / 2) - 3) * 60 + 11;
        cityGroup.add(board);
        billboards.push({
          mesh: board,
          originalColor: boardMat.color.getHex(),
          originalEmissive: boardMat.emissive.getHex()
        });
      }
    }
  }

  function buildSpeedBlur() {
    var blurCount = 20;
    for (var i = 0; i < blurCount; i++) {
      var positions = [
        -30, 5, -10 - i * 8,
        30, 5, -10 - i * 8
      ];
      var geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      var mat = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 1 });
      var line = new THREE.LineSegments(geom, mat);
      effectsGroup.add(line);
      speedBlurLines.push({
        mesh: line,
        baseZ: -10 - i * 8
      });
    }
  }

  function buildSecurityTurrets() {
    for (var i = 0; i < 6; i++) {
      var turretBaseGeom = new THREE.CylinderGeometry(2, 3, 1, 8);
      var turretMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var turretBase = new THREE.Mesh(turretBaseGeom, turretMat);
      turretBase.position.y = 12;
      turretBase.position.z = i * 26;

      var barrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 6);
      var barrel = new THREE.Mesh(barrelGeom, turretMat);
      barrel.position.y = 14;
      barrel.position.z = i * 26;
      barrel.rotation.x = 0.3;

      trainGroup.add(turretBase);
      trainGroup.add(barrel);
      turrets.push({
        base: turretBase,
        barrel: barrel,
        angle: 0
      });
    }
  }

  function buildEmergencyBrake() {
    var leverGeom = new THREE.BoxGeometry(1, 6, 1);
    var leverMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var lever = new THREE.Mesh(leverGeom, leverMat);
    lever.position.set(-12, 0, 75);
    trainGroup.add(lever);

    var warnLightGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var warnMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var warnLight = new THREE.Mesh(warnLightGeom, warnMat);
    warnLight.position.set(-12, 8, 75);
    trainGroup.add(warnLight);
  }

  function buildDamageZones() {
    for (var i = 0; i < 3; i++) {
      var dent = new THREE.BoxGeometry(3, 4, 0.5);
      var dentMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var dentMesh = new THREE.Mesh(dent, dentMat);
      dentMesh.position.set(-7 - i * 8, 2, 25 + i * 30);
      trainGroup.add(dentMesh);
      damageHoles.push(dentMesh);
    }
  }

  function update(delta) {
    elapsedTime += delta;

    // Accelerate train
    trainSpeed = Math.min(trainSpeed + delta * 20, maxTrainSpeed);

    // Animate city rushing past
    for (var i = 0; i < buildings.length; i++) {
      var building = buildings[i];
      building.mesh.position.z += trainSpeed * delta;

      // Reset building position when far behind
      if (building.mesh.position.z > 100) {
        building.mesh.position.z = -500;
      }
    }

    // Animate billboards flickering
    for (var j = 0; j < billboards.length; j++) {
      var billboard = billboards[j];
      if (Math.random() > 0.95) {
        billboard.mesh.material.emissive.setHex(
          new THREE.Color().setHSL(Math.random(), 1, 0.3).getHex()
        );
      }
    }

    // Animate speed blur
    for (var k = 0; k < speedBlurLines.length; k++) {
      var blur = speedBlurLines[k];
      blur.mesh.position.z = blur.baseZ + (trainSpeed * elapsedTime * 0.5) % 200;
    }

    // Electric arc sparks under train
    if (Math.random() > 0.7) {
      createArcSpark();
    }

    // Update arc sparks
    for (var s = arcSparks.length - 1; s >= 0; s--) {
      arcSparks[s].life -= delta;
      if (arcSparks[s].life <= 0) {
        effectsGroup.remove(arcSparks[s].mesh);
        arcSparks.splice(s, 1);
      }
    }

    // Turret scanning
    for (var t = 0; t < turrets.length; t++) {
      var turret = turrets[t];
      turret.angle += delta * 2;
      turret.barrel.rotation.y = turret.angle;
    }

    // Animate emergency brake pulsing
    var warnLight = trainGroup.children.find(function(child) {
      return child.geometry && child.geometry.type === 'SphereGeometry' &&
             child.position.y === 8;
    });
    if (warnLight) {
      warnLight.material.emissive.setHex(
        Math.sin(elapsedTime * 3) > 0 ? 0xff0000 : 0x660000
      );
    }

    // Subtle rail glow pulsing
    if (railSegments) {
      railSegments.material.opacity = 0.5 + Math.sin(elapsedTime * 2) * 0.3;
    }

    // Camera shake with speed
    var shakeAmount = trainSpeed / maxTrainSpeed * 0.05;
    camera.position.x = Math.sin(elapsedTime * 4) * shakeAmount;
    camera.position.y = 2 + Math.cos(elapsedTime * 3) * shakeAmount;
  }

  function createArcSpark() {
    var sparkPositions = [
      -6 + Math.random() * 12, -26, Math.random() * 150,
      -6 + Math.random() * 12, -25, Math.random() * 150
    ];
    var sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkPositions), 3));
    var sparkMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    var sparkLine = new THREE.LineSegments(sparkGeom, sparkMat);
    effectsGroup.add(sparkLine);

    arcSparks.push({
      mesh: sparkLine,
      life: 0.2
    });
  }

  function reset() {
    elapsedTime = 0;
    trainSpeed = 0;

    for (var i = 0; i < buildings.length; i++) {
      buildings[i].mesh.position.z = buildings[i].baseZ;
    }

    for (var j = 0; j < speedBlurLines.length; j++) {
      speedBlurLines[j].mesh.position.z = speedBlurLines[j].baseZ;
    }

    for (var k = arcSparks.length - 1; k >= 0; k--) {
      effectsGroup.remove(arcSparks[k].mesh);
    }
    arcSparks = [];

    for (var t = 0; t < turrets.length; t++) {
      turrets[t].angle = 0;
      turrets[t].barrel.rotation.y = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
