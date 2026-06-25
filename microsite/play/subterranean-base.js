window.SubterraneanBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var trainPosition = 0;
  var fanRotation = 0;
  var elevatorPosition = 0;
  var blastDoorLeft = 0;
  var blastDoorRight = 0;
  var ripplePhase = 0;
  var meshes = [];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    trainPosition = 0;
    fanRotation = 0;
    elevatorPosition = 0;
    blastDoorLeft = 0;
    blastDoorRight = 0;
    ripplePhase = 0;

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x1a1a2e, 100, 500);

    createMainCavern();
    createMissileSilos();
    createRailTrack();
    createBarracks();
    createUndergroundLake();
    createCommandCenter();
    createVentilationSystem();
    createWaterTreatment();
    createAmmunitionElevator();
    createBlastDoors();
    createPowerCables();
    createLighting();
  }

  function createMainCavern() {
    var cavernWidth = 300;
    var cavernHeight = 150;
    var cavernDepth = 600;

    var cavern = new THREE.Mesh(
      new THREE.BoxGeometry(cavernWidth, cavernHeight, cavernDepth),
      new THREE.MeshPhongMaterial({ color: 0x3a3a4a, side: THREE.BackSide })
    );
    cavern.position.set(0, 0, 0);
    scene.add(cavern);
    meshes.push(cavern);

    var supportColumns = [];
    var columnRadius = 8;
    var columnHeight = cavernHeight;
    var cols = 4;
    var rows = 6;
    var spacingX = cavernWidth / (cols + 1);
    var spacingZ = cavernDepth / (rows + 1);

    for (var i = 1; i <= cols; i++) {
      for (var j = 1; j <= rows; j++) {
        var column = new THREE.Mesh(
          new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 12),
          new THREE.MeshPhongMaterial({ color: 0x4a5a6a, shininess: 20 })
        );
        column.position.set(-cavernWidth / 2 + spacingX * i, 0, -cavernDepth / 2 + spacingZ * j);
        scene.add(column);
        meshes.push(column);
      }
    }
  }

  function createMissileSilos() {
    var sloCount = 5;
    var sloSpacing = 80;
    var siloRadius = 12;
    var siloDepth = 200;
    var missileHeight = 120;
    var missileRadius = 4;
    var coneHeight = 30;

    for (var i = 0; i < sloCount; i++) {
      var xPos = -150 + i * sloSpacing;

      var silo = new THREE.Mesh(
        new THREE.CylinderGeometry(siloRadius, siloRadius, siloDepth, 16),
        new THREE.MeshPhongMaterial({ color: 0x2a3a4a, shininess: 10 })
      );
      silo.position.set(xPos, -50, -150);
      scene.add(silo);
      meshes.push(silo);

      var missileBody = new THREE.Mesh(
        new THREE.CylinderGeometry(missileRadius, missileRadius, missileHeight, 8),
        new THREE.MeshPhongMaterial({ color: 0x1a4a6a })
      );
      missileBody.position.set(xPos, 30, -150);
      scene.add(missileBody);
      meshes.push(missileBody);

      var missileHead = new THREE.Mesh(
        new THREE.ConeGeometry(missileRadius, coneHeight, 8),
        new THREE.MeshPhongMaterial({ color: 0x0a3a5a })
      );
      missileHead.position.set(xPos, 30 + missileHeight / 2 + coneHeight / 2, -150);
      scene.add(missileHead);
      meshes.push(missileHead);
    }
  }

  function createRailTrack() {
    var trackLength = 400;
    var sleeperspacing = 10;
    var sleepersCount = Math.floor(trackLength / sleeperspacing);
    var trackWidth = 50;

    for (var i = 0; i < sleepersCount; i++) {
      var zPos = -200 + (i * sleeperspacing);
      var sleeper = new THREE.Mesh(
        new THREE.BoxGeometry(trackWidth, 3, 8),
        new THREE.MeshPhongMaterial({ color: 0x4a2a1a })
      );
      sleeper.position.set(0, -65, zPos);
      scene.add(sleeper);
      meshes.push(sleeper);
    }

    var railLeft = new THREE.BufferGeometry();
    var railRightPoints = [];
    for (var i = 0; i < sleepersCount; i++) {
      var zPos = -200 + (i * sleeperspacing);
      railRightPoints.push(new THREE.Vector3(-18, -62, zPos));
      railRightPoints.push(new THREE.Vector3(-18, -62, zPos + sleeperspacing * 0.5));
    }
    railLeft.setFromPoints(railRightPoints);
    var railLeftLine = new THREE.LineSegments(
      railLeft,
      new THREE.LineBasicMaterial({ color: 0x8a6a4a, linewidth: 2 })
    );
    scene.add(railLeftLine);
    meshes.push(railLeftLine);

    var railRight = new THREE.BufferGeometry();
    var railLeftPoints = [];
    for (var i = 0; i < sleepersCount; i++) {
      var zPos = -200 + (i * sleeperspacing);
      railLeftPoints.push(new THREE.Vector3(18, -62, zPos));
      railLeftPoints.push(new THREE.Vector3(18, -62, zPos + sleeperspacing * 0.5));
    }
    railRight.setFromPoints(railLeftPoints);
    var railRightLine = new THREE.LineSegments(
      railRight,
      new THREE.LineBasicMaterial({ color: 0x8a6a4a, linewidth: 2 })
    );
    scene.add(railRightLine);
    meshes.push(railRightLine);

    var trainCars = 3;
    for (var car = 0; car < trainCars; car++) {
      var trainCar = new THREE.Mesh(
        new THREE.BoxGeometry(35, 30, 50),
        new THREE.MeshPhongMaterial({ color: 0x1a2a3a, shininess: 30 })
      );
      trainCar.position.set(0, -50, 150 - car * 60);
      trainCar.userData.carIndex = car;
      scene.add(trainCar);
      meshes.push(trainCar);
    }
  }

  function createBarracks() {
    var bunksPerRow = 4;
    var bunkRows = 3;
    var bunkSpacing = 60;
    var startX = -100;
    var startZ = 50;

    for (var row = 0; row < bunkRows; row++) {
      for (var col = 0; col < bunksPerRow; col++) {
        var xPos = startX + col * bunkSpacing;
        var zPos = startZ + row * bunkSpacing;

        var bunk = new THREE.Mesh(
          new THREE.BoxGeometry(40, 60, 25),
          new THREE.MeshPhongMaterial({ color: 0x4a4a5a })
        );
        bunk.position.set(xPos, -20, zPos);
        scene.add(bunk);
        meshes.push(bunk);

        var locker = new THREE.Mesh(
          new THREE.BoxGeometry(12, 40, 15),
          new THREE.MeshPhongMaterial({ color: 0x3a4a5a })
        );
        locker.position.set(xPos + 30, 5, zPos);
        scene.add(locker);
        meshes.push(locker);
      }
    }

    var messHallLength = 150;
    var messHallWidth = 80;
    var messHall = new THREE.Mesh(
      new THREE.BoxGeometry(messHallWidth, 50, messHallLength),
      new THREE.MeshPhongMaterial({ color: 0x3a5a6a })
    );
    messHall.position.set(0, -25, -250);
    scene.add(messHall);
    meshes.push(messHall);

    var tablesPerRow = 5;
    var tableRows = 3;
    for (var row = 0; row < tableRows; row++) {
      for (var col = 0; col < tablesPerRow; col++) {
        var table = new THREE.Mesh(
          new THREE.BoxGeometry(20, 2, 30),
          new THREE.MeshPhongMaterial({ color: 0x5a4a3a })
        );
        table.position.set(-60 + col * 30, -8, -280 + row * 40);
        scene.add(table);
        meshes.push(table);
      }
    }
  }

  function createUndergroundLake() {
    var lakeWidth = 200;
    var lakeDepth = 150;
    var lakeX = 150;
    var lakeZ = 100;

    var lake = new THREE.Mesh(
      new THREE.BoxGeometry(lakeWidth, 2, lakeDepth),
      new THREE.MeshPhongMaterial({ color: 0x1a3a5a, emissive: 0x0a1a2a })
    );
    lake.position.set(lakeX, -75, lakeZ);
    scene.add(lake);
    meshes.push(lake);

    var waterWalls = 4;
    var lakeSides = [
      { pos: [lakeX, -50, lakeZ - lakeDepth / 2], size: [lakeWidth, 50, 2] },
      { pos: [lakeX, -50, lakeZ + lakeDepth / 2], size: [lakeWidth, 50, 2] },
      { pos: [lakeX - lakeWidth / 2, -50, lakeZ], size: [2, 50, lakeDepth] },
      { pos: [lakeX + lakeWidth / 2, -50, lakeZ], size: [2, 50, lakeDepth] }
    ];

    lakeSides.forEach(function(side) {
      var wall = new THREE.Mesh(
        new THREE.BoxGeometry(side.size[0], side.size[1], side.size[2]),
        new THREE.MeshPhongMaterial({ color: 0x2a3a4a })
      );
      wall.position.set(side.pos[0], side.pos[1], side.pos[2]);
      scene.add(wall);
      meshes.push(wall);
    });
  }

  function createCommandCenter() {
    var platformLength = 100;
    var platformWidth = 80;
    var platformHeight = 3;

    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(platformWidth, platformHeight, platformLength),
      new THREE.MeshPhongMaterial({ color: 0x4a5a6a })
    );
    platform.position.set(-120, 30, 0);
    scene.add(platform);
    meshes.push(platform);

    var screenCount = 6;
    for (var i = 0; i < screenCount; i++) {
      var angle = (i / screenCount) * Math.PI * 2;
      var radius = 25;
      var xPos = -120 + Math.cos(angle) * radius;
      var zPos = Math.sin(angle) * radius;

      var screen = new THREE.Mesh(
        new THREE.BoxGeometry(15, 25, 2),
        new THREE.MeshPhongMaterial({ color: 0x0a3a5a, emissive: 0x1a5aaa })
      );
      screen.position.set(xPos, 45, zPos);
      screen.rotation.y = angle;
      scene.add(screen);
      meshes.push(screen);
    }

    var antennaCount = 4;
    for (var i = 0; i < antennaCount; i++) {
      var antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 50, 8),
        new THREE.MeshPhongMaterial({ color: 0x8a6a4a })
      );
      antenna.position.set(-140 + i * 20, 55, 0);
      scene.add(antenna);
      meshes.push(antenna);
    }
  }

  function createVentilationSystem() {
    var ventCount = 3;
    var ventRadius = 15;
    var ventLength = 200;

    for (var i = 0; i < ventCount; i++) {
      var yPos = 50 + i * 30;

      var vent = new THREE.Mesh(
        new THREE.CylinderGeometry(ventRadius, ventRadius, ventLength, 12),
        new THREE.MeshPhongMaterial({ color: 0x3a4a5a })
      );
      vent.rotation.z = Math.PI / 2;
      vent.position.set(0, yPos, 0);
      scene.add(vent);
      meshes.push(vent);

      var fanBlades = 4;
      for (var blade = 0; blade < fanBlades; blade++) {
        var bladeAngle = (blade / fanBlades) * Math.PI * 2;
        var bladeMesh = new THREE.Mesh(
          new THREE.BoxGeometry(3, 30, 8),
          new THREE.MeshPhongMaterial({ color: 0x2a3a4a })
        );
        bladeMesh.position.set(140, yPos, 0);
        bladeMesh.rotation.z = bladeAngle;
        bladeMesh.userData.type = 'fanBlade';
        bladeMesh.userData.ventIndex = i;
        scene.add(bladeMesh);
        meshes.push(bladeMesh);
      }
    }
  }

  function createWaterTreatment() {
    var tankCount = 5;
    var tankRadius = 10;
    var tankHeight = 40;
    var spacing = 50;

    for (var i = 0; i < tankCount; i++) {
      var xPos = -100 + i * spacing;

      var tank = new THREE.Mesh(
        new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 16),
        new THREE.MeshPhongMaterial({ color: 0x3a4a5a })
      );
      tank.position.set(xPos, -30, -350);
      scene.add(tank);
      meshes.push(tank);

      var pipeRadius = 2;
      var pipeLength = 30;
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 8),
        new THREE.MeshPhongMaterial({ color: 0x5a6a7a })
      );
      pipe.rotation.z = Math.PI / 4;
      pipe.position.set(xPos, -5, -350);
      scene.add(pipe);
      meshes.push(pipe);
    }

    var motorRadius = 6;
    var motorHeight = 15;
    var motor = new THREE.Mesh(
      new THREE.CylinderGeometry(motorRadius, motorRadius, motorHeight, 12),
      new THREE.MeshPhongMaterial({ color: 0x4a3a2a })
    );
    motor.position.set(80, -20, -350);
    scene.add(motor);
    meshes.push(motor);
  }

  function createAmmunitionElevator() {
    var shaftWidth = 30;
    var shaftHeight = 150;
    var shaftDepth = 30;

    var shaft = new THREE.Mesh(
      new THREE.BoxGeometry(shaftWidth + 4, shaftHeight, shaftDepth + 4),
      new THREE.MeshPhongMaterial({ color: 0x2a3a4a })
    );
    shaft.position.set(140, 0, -250);
    scene.add(shaft);
    meshes.push(shaft);

    var elevator = new THREE.Mesh(
      new THREE.BoxGeometry(shaftWidth, 15, shaftDepth),
      new THREE.MeshPhongMaterial({ color: 0x4a5a6a })
    );
    elevator.position.set(140, 0, -250);
    elevator.userData.type = 'elevator';
    scene.add(elevator);
    meshes.push(elevator);

    var cableRadius = 1;
    var cableLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(cableRadius, cableRadius, shaftHeight, 6),
      new THREE.MeshPhongMaterial({ color: 0x5a6a7a })
    );
    cableLeft.position.set(130, 0, -250);
    scene.add(cableLeft);
    meshes.push(cableLeft);

    var cableRight = new THREE.Mesh(
      new THREE.CylinderGeometry(cableRadius, cableRadius, shaftHeight, 6),
      new THREE.MeshPhongMaterial({ color: 0x5a6a7a })
    );
    cableRight.position.set(150, 0, -250);
    scene.add(cableRight);
    meshes.push(cableRight);
  }

  function createBlastDoors() {
    var doorWidth = 60;
    var doorHeight = 100;
    var doorThickness = 5;
    var doorZ = -280;

    var leftDoor = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      new THREE.MeshPhongMaterial({ color: 0x2a2a3a })
    );
    leftDoor.position.set(-40, 0, doorZ);
    leftDoor.userData.type = 'blastDoorLeft';
    scene.add(leftDoor);
    meshes.push(leftDoor);

    var rightDoor = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
      new THREE.MeshPhongMaterial({ color: 0x2a2a3a })
    );
    rightDoor.position.set(40, 0, doorZ);
    rightDoor.userData.type = 'blastDoorRight';
    scene.add(rightDoor);
    meshes.push(rightDoor);

    var doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(130, 110, 3),
      new THREE.MeshPhongMaterial({ color: 0x1a1a2a })
    );
    doorFrame.position.set(0, 0, doorZ + 2);
    scene.add(doorFrame);
    meshes.push(doorFrame);
  }

  function createPowerCables() {
    var cablePoints = [
      new THREE.Vector3(-80, 60, -150),
      new THREE.Vector3(-40, 65, -100),
      new THREE.Vector3(0, 68, -50),
      new THREE.Vector3(40, 65, 0),
      new THREE.Vector3(80, 60, 50)
    ];

    var cableGeom = new THREE.BufferGeometry();
    cableGeom.setFromPoints(cablePoints);
    var cableLine = new THREE.LineSegments(
      cableGeom,
      new THREE.LineBasicMaterial({ color: 0x8a6a3a, linewidth: 1.5 })
    );
    scene.add(cableLine);
    meshes.push(cableLine);

    var junctionCount = cablePoints.length;
    for (var i = 0; i < junctionCount; i++) {
      var junction = new THREE.Mesh(
        new THREE.SphereGeometry(3, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xaa8a5a })
      );
      junction.position.copy(cablePoints[i]);
      scene.add(junction);
      meshes.push(junction);
    }
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0x4a5a6a, 0.6);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(100, 100, 100);
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    var emergencyLight1 = new THREE.PointLight(0xaa3a2a, 0.5, 200);
    emergencyLight1.position.set(-120, 20, 100);
    scene.add(emergencyLight1);

    var emergencyLight2 = new THREE.PointLight(0xaa3a2a, 0.5, 200);
    emergencyLight2.position.set(120, 20, -100);
    scene.add(emergencyLight2);

    var dataScreenLight = new THREE.PointLight(0x1a5aaa, 0.4, 150);
    dataScreenLight.position.set(-120, 45, 0);
    scene.add(dataScreenLight);
  }

  function update(delta) {
    trainPosition += delta * 15;
    if (trainPosition > 400) {
      trainPosition = -200;
    }

    fanRotation += delta * 8;

    elevatorPosition = Math.sin(Date.now() * 0.0005) * 60;

    var doorCycle = (Date.now() * 0.0008) % (Math.PI * 2);
    blastDoorLeft = Math.max(0, Math.sin(doorCycle) * 70);
    blastDoorRight = Math.max(0, Math.sin(doorCycle) * 70);

    ripplePhase += delta * 2;

    meshes.forEach(function(mesh) {
      if (mesh.userData.carIndex !== undefined) {
        mesh.position.z = 150 - mesh.userData.carIndex * 60 + trainPosition;
      }

      if (mesh.userData.type === 'fanBlade') {
        mesh.rotation.z = fanRotation;
      }

      if (mesh.userData.type === 'elevator') {
        mesh.position.y = elevatorPosition;
      }

      if (mesh.userData.type === 'blastDoorLeft') {
        mesh.position.x = -40 - blastDoorLeft;
      }

      if (mesh.userData.type === 'blastDoorRight') {
        mesh.position.x = 40 + blastDoorRight;
      }
    });
  }

  function reset() {
    trainPosition = 0;
    fanRotation = 0;
    elevatorPosition = 0;
    blastDoorLeft = 0;
    blastDoorRight = 0;
    ripplePhase = 0;

    meshes.forEach(function(mesh) {
      scene.remove(mesh);
    });
    meshes = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
