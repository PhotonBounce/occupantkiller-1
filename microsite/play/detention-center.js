window.DetentionCenter = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var mainBuilding = null;
  var cellBlocks = [];
  var guardTowers = [];
  var fenceSegments = [];
  var searchlights = [];
  var guards = [];
  var doors = [];
  var alarmLight = null;
  var exerciseYard = null;
  var controlRoom = null;
  var patrolPaths = [];
  var helicopterSpotlight = null;
  var time = 0;

  function createCellBlock() {
    var blockGroup = new THREE.Group();
    var mainWall = new THREE.Mesh(
      new THREE.BoxGeometry(60, 40, 4),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    mainWall.position.set(0, 20, 0);
    blockGroup.add(mainWall);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 6; col++) {
        var cellX = -25 + col * 10;
        var cellY = 5 + row * 8;
        createCell(blockGroup, cellX, cellY);
      }
    }

    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(65, 45, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x5C5C5C })
    );
    floor.position.set(0, 0.25, 0);
    blockGroup.add(floor);

    return blockGroup;
  }

  function createCell(parent, x, y) {
    var cellGroup = new THREE.Group();
    cellGroup.position.set(x, y, 0);

    var cellWall = new THREE.Mesh(
      new THREE.BoxGeometry(9, 7, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    cellWall.position.z = -0.5;
    cellGroup.add(cellWall);

    for (var i = 0; i < 8; i++) {
      var barX = -4 + i * 1.1;
      var barMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 7, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      barMesh.position.x = barX;
      barMesh.position.y = 0;
      barMesh.position.z = 0;
      cellGroup.add(barMesh);
    }

    for (var j = 0; j < 7; j++) {
      var barY = -3 + j * 1;
      var crossBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 9, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      crossBar.rotation.z = Math.PI / 2;
      crossBar.position.x = 0;
      crossBar.position.y = barY;
      crossBar.position.z = 0;
      cellGroup.add(crossBar);
    }

    parent.add(cellGroup);
  }

  function createGuardTower(x, z) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(x, 0, z);

    var towerBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 25, 8),
      new THREE.MeshStandardMaterial({ color: 0x8B7355 })
    );
    towerBase.position.y = 12.5;
    towerGroup.add(towerBase);

    var towerTop = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3, 10),
      new THREE.MeshStandardMaterial({ color: 0xA0826D })
    );
    towerTop.position.y = 27;
    towerGroup.add(towerTop);

    var searchlight = new THREE.SpotLight(0xFFFFFF, 1, 150, Math.PI / 6, 1, 1);
    searchlight.position.set(0, 28, 0);
    searchlight.target.position.set(0, 0, 0);
    towerGroup.add(searchlight);
    towerGroup.add(searchlight.target);
    searchlights.push({
      light: searchlight,
      angle: 0,
      baseX: x,
      baseZ: z
    });

    var railing = new THREE.LineSegments(
      createTowerRailingGeometry(),
      new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 })
    );
    railing.position.y = 26;
    towerGroup.add(railing);

    return towerGroup;
  }

  function createTowerRailingGeometry() {
    var points = [];
    var radius = 5;
    var segments = 12;
    for (var i = 0; i <= segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, 0, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  function createFenceSection(x, z, isCorner) {
    var fenceGroup = new THREE.Group();
    fenceGroup.position.set(x, 0, z);

    var fencePost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 20, 12),
      new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    fencePost.position.y = 10;
    fenceGroup.add(fencePost);

    var wireStart = -5;
    for (var level = 0; level < 4; level++) {
      var wireY = 5 + level * 4;
      var wireGeom = new THREE.BufferGeometry();
      var wirePoints = [
        new THREE.Vector3(wireStart, wireY, 0),
        new THREE.Vector3(wireStart + 10, wireY, 0)
      ];
      wireGeom.setFromPoints(wirePoints);
      var wireMesh = new THREE.LineSegments(
        wireGeom,
        new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 1 })
      );
      fenceGroup.add(wireMesh);
    }

    if (!isCorner) {
      var razorWire = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.3, 4),
        new THREE.MeshStandardMaterial({ color: 0xFF3300 })
      );
      razorWire.position.y = 19.5;
      fenceGroup.add(razorWire);
    }

    return fenceGroup;
  }

  function createControlRoom() {
    var roomGroup = new THREE.Group();
    roomGroup.position.set(-50, 0, -50);

    var roomWalls = new THREE.Mesh(
      new THREE.BoxGeometry(20, 15, 20),
      new THREE.MeshStandardMaterial({ color: 0x8B8680 })
    );
    roomWalls.position.y = 7.5;
    roomGroup.add(roomWalls);

    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x5C5C5C })
    );
    floor.position.y = 0.25;
    roomGroup.add(floor);

    for (var i = 0; i < 4; i++) {
      var windowX = -8 + i * 5;
      var windowGlass = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x87CEEB,
          transparent: true,
          opacity: 0.3
        })
      );
      windowGlass.position.set(windowX, 10, 10);
      roomGroup.add(windowGlass);
    }

    controlRoom = roomGroup;
    return roomGroup;
  }

  function createExerciseYard() {
    var yardGroup = new THREE.Group();
    yardGroup.position.set(30, 0, 0);

    var yardFloor = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 40),
      new THREE.MeshStandardMaterial({ color: 0x7A7A7A })
    );
    yardFloor.position.y = 0.25;
    yardGroup.add(yardFloor);

    var wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(52, 12, 1),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    wallNorth.position.set(0, 6, -20);
    yardGroup.add(wallNorth);

    var wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(52, 12, 1),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    wallSouth.position.set(0, 6, 20);
    yardGroup.add(wallSouth);

    var wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(1, 12, 40),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    wallEast.position.set(25, 6, 0);
    yardGroup.add(wallEast);

    exerciseYard = yardGroup;
    return yardGroup;
  }

  function createGuard(x, y, z) {
    var guardGroup = new THREE.Group();
    guardGroup.position.set(x, y, z);

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2F4F2F })
    );
    body.position.y = 1.25;
    guardGroup.add(body);

    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xD2B48C })
    );
    head.position.y = 3;
    guardGroup.add(head);

    var rifle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.8, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    rifle.position.set(0.5, 2, 0);
    rifle.rotation.z = Math.PI / 6;
    guardGroup.add(rifle);

    guards.push({
      group: guardGroup,
      position: new THREE.Vector3(x, y, z),
      direction: 0,
      speed: 0.5,
      pathIndex: 0,
      angle: 0
    });

    return guardGroup;
  }

  function createDoor(x, y, z, isOpen) {
    var doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);

    var doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    doorGroup.add(doorFrame);

    var doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 3.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    doorPanel.position.z = 0.15;
    doorGroup.add(doorPanel);

    var lockMechanism = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    );
    lockMechanism.rotation.z = Math.PI / 2;
    lockMechanism.position.set(1.2, 1, 0.25);
    doorGroup.add(lockMechanism);

    doors.push({
      group: doorGroup,
      panel: doorPanel,
      lock: lockMechanism,
      isOpen: isOpen,
      angle: 0,
      targetAngle: isOpen ? Math.PI / 2 : 0
    });

    return doorGroup;
  }

  function createAlarmSystem() {
    var alarmGroup = new THREE.Group();
    alarmGroup.position.set(0, 18, 0);

    alarmLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xFF3300,
        emissive: 0xFF3300,
        emissiveIntensity: 0.5
      })
    );
    alarmGroup.add(alarmLight);

    var speaker = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    speaker.position.y = -1;
    alarmGroup.add(speaker);

    return alarmGroup;
  }

  function createHelicopterSpotlight() {
    var helicopterGroup = new THREE.Group();
    helicopterGroup.position.set(0, 60, 0);

    var fuselage = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 10),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    helicopterGroup.add(fuselage);

    var rotorBlade = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    rotorBlade.position.y = 2;
    helicopterGroup.add(rotorBlade);

    var spotlight = new THREE.SpotLight(0xFFFF99, 1.5, 200, Math.PI / 4, 1, 1);
    spotlight.position.set(0, 1, -1);
    spotlight.target.position.set(0, 0, 0);
    helicopterGroup.add(spotlight);
    helicopterGroup.add(spotlight.target);

    helicopterSpotlight = {
      group: helicopterGroup,
      spotlight: spotlight,
      rotorBlade: rotorBlade,
      angle: 0
    };

    return helicopterGroup;
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    time = 0;

    var mainBuildingGroup = createCellBlock();
    mainBuildingGroup.position.set(-10, 0, 0);
    scene.add(mainBuildingGroup);
    mainBuilding = mainBuildingGroup;

    var tower1 = createGuardTower(-40, -40);
    scene.add(tower1);
    guardTowers.push(tower1);

    var tower2 = createGuardTower(40, -40);
    scene.add(tower2);
    guardTowers.push(tower2);

    var tower3 = createGuardTower(-40, 40);
    scene.add(tower3);
    guardTowers.push(tower3);

    var tower4 = createGuardTower(40, 40);
    scene.add(tower4);
    guardTowers.push(tower4);

    for (var x = -45; x < 50; x += 12) {
      var fence1 = createFenceSection(x, -50, false);
      scene.add(fence1);
      fenceSegments.push(fence1);

      var fence2 = createFenceSection(x, 50, false);
      scene.add(fence2);
      fenceSegments.push(fence2);
    }

    for (var z = -45; z < 50; z += 12) {
      var fence3 = createFenceSection(-50, z, false);
      scene.add(fence3);
      fenceSegments.push(fence3);

      var fence4 = createFenceSection(50, z, false);
      scene.add(fence4);
      fenceSegments.push(fence4);
    }

    var controlRoomGroup = createControlRoom();
    scene.add(controlRoomGroup);

    var exerciseYardGroup = createExerciseYard();
    scene.add(exerciseYardGroup);

    var door1 = createDoor(-15, 0, 5, false);
    scene.add(door1);

    var door2 = createDoor(15, 0, -5, false);
    scene.add(door2);

    var door3 = createDoor(-50, 0, -48, false);
    scene.add(door3);

    var alarmSystem = createAlarmSystem();
    mainBuildingGroup.add(alarmSystem);

    var helicopterGroup = createHelicopterSpotlight();
    scene.add(helicopterGroup);

    var guard1 = createGuard(-20, 1, 0);
    scene.add(guard1);

    var guard2 = createGuard(0, 1, 15);
    scene.add(guard2);

    var guard3 = createGuard(30, 1, 10);
    scene.add(guard3);

    patrolPaths.push([
      new THREE.Vector3(-20, 1, -20),
      new THREE.Vector3(-20, 1, 20),
      new THREE.Vector3(20, 1, 20),
      new THREE.Vector3(20, 1, -20)
    ]);

    patrolPaths.push([
      new THREE.Vector3(30, 1, 0),
      new THREE.Vector3(30, 1, 30),
      new THREE.Vector3(50, 1, 30)
    ]);

    patrolPaths.push([
      new THREE.Vector3(-40, 1, 0),
      new THREE.Vector3(-40, 1, 30),
      new THREE.Vector3(-20, 1, 30)
    ]);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 40, 50);
    scene.add(directionalLight);
  };

  var update = function(delta) {
    time += delta;

    if (searchlights.length > 0) {
      for (var i = 0; i < searchlights.length; i++) {
        var sl = searchlights[i];
        sl.angle += 0.005 * (i % 2 === 0 ? 1 : -1);
        sl.light.position.x = sl.baseX + Math.sin(sl.angle) * 20;
        sl.light.position.z = sl.baseZ + Math.cos(sl.angle) * 20;
        sl.light.target.position.set(sl.baseX, 0, sl.baseZ);
      }
    }

    for (var g = 0; g < guards.length; g++) {
      var guard = guards[g];
      var path = patrolPaths[g % patrolPaths.length];
      var nextWaypoint = path[guard.pathIndex];

      var direction = new THREE.Vector3().subVectors(nextWaypoint, guard.position);
      if (direction.length() < 1) {
        guard.pathIndex = (guard.pathIndex + 1) % path.length;
      } else {
        direction.normalize();
        guard.position.addScaledVector(direction, guard.speed * delta);
        guard.group.position.copy(guard.position);
        guard.angle = Math.atan2(direction.x, direction.z);
        guard.group.rotation.y = guard.angle;
      }
    }

    for (var d = 0; d < doors.length; d++) {
      var door = doors[d];
      if (Math.abs(door.angle - door.targetAngle) > 0.01) {
        var angleStep = 1.5 * delta;
        if (door.angle < door.targetAngle) {
          door.angle = Math.min(door.angle + angleStep, door.targetAngle);
        } else {
          door.angle = Math.max(door.angle - angleStep, door.targetAngle);
        }
        door.panel.rotation.y = door.angle;
      }
    }

    if (alarmLight) {
      var alarmIntensity = 0.3 + Math.sin(time * 4) * 0.3;
      alarmLight.material.emissiveIntensity = alarmIntensity;
    }

    if (helicopterSpotlight) {
      helicopterSpotlight.angle += 0.0015;
      helicopterSpotlight.group.position.x = Math.sin(helicopterSpotlight.angle) * 30;
      helicopterSpotlight.group.position.z = Math.cos(helicopterSpotlight.angle) * 30;
      helicopterSpotlight.rotorBlade.rotation.z += 0.15;
    }
  };

  var reset = function() {
    if (scene) {
      if (mainBuilding) {
        scene.remove(mainBuilding);
      }
      for (var i = 0; i < guardTowers.length; i++) {
        scene.remove(guardTowers[i]);
      }
      for (var j = 0; j < fenceSegments.length; j++) {
        scene.remove(fenceSegments[j]);
      }
      for (var k = 0; k < doors.length; k++) {
        scene.remove(doors[k].group);
      }
      if (controlRoom) {
        scene.remove(controlRoom);
      }
      if (exerciseYard) {
        scene.remove(exerciseYard);
      }
      for (var m = 0; m < guards.length; m++) {
        scene.remove(guards[m].group);
      }
      if (helicopterSpotlight) {
        scene.remove(helicopterSpotlight.group);
      }
    }

    cellBlocks = [];
    guardTowers = [];
    fenceSegments = [];
    searchlights = [];
    guards = [];
    doors = [];
    alarmLight = null;
    exerciseYard = null;
    controlRoom = null;
    patrolPaths = [];
    helicopterSpotlight = null;
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
