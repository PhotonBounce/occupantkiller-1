window.BankVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var vaultDoorAngle = 0;
  var vaultDoorTarget = 0;
  var vaultDoorMaxAngle = Math.PI / 2;
  var timeElapsed = 0;
  var terroristPatrols = [];
  var hostages = [];
  var alarmFlashing = false;
  var alarmPhase = 0;

  function createMarbleColumn(x, y, z) {
    var geometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
    var material = new THREE.MeshStandardMaterial({ color: 0xF8F8F0, metalness: 0.3, roughness: 0.7 });
    var column = new THREE.Mesh(geometry, material);
    column.position.set(x, y + 2, z);
    scene.add(column);
    objects.push(column);
    return column;
  }

  function createTellerCounter(x, y, z) {
    var geometry = new THREE.BoxGeometry(3, 1, 0.8);
    var material = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.2, roughness: 0.8 });
    var counter = new THREE.Mesh(geometry, material);
    counter.position.set(x, y, z);
    scene.add(counter);
    objects.push(counter);
    return counter;
  }

  function createVaultDoor() {
    var frameGeometry = new THREE.BoxGeometry(0.5, 3, 3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x778899, metalness: 0.8, roughness: 0.2 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(0, 1.5, -12);
    scene.add(frame);
    objects.push(frame);

    var doorGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x556B7F, metalness: 0.9, roughness: 0.1 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.rotation.z = Math.PI / 2;
    door.position.set(0.3, 1.5, -12);
    scene.add(door);
    objects.push(door);

    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.15 });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0.3, 1.5, -13);
    scene.add(wheel);
    objects.push(wheel);

    return { door: door, frame: frame, wheel: wheel };
  }

  function createSafeDepositBoxes(startX, startZ) {
    var boxGroup = [];
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 4; j++) {
        var geometry = new THREE.BoxGeometry(0.6, 0.6, 0.5);
        var material = new THREE.MeshStandardMaterial({ color: 0x778899, metalness: 0.7, roughness: 0.3 });
        var box = new THREE.Mesh(geometry, material);
        box.position.set(startX + i * 0.8, 1.5 + j * 0.8, startZ);
        scene.add(box);
        objects.push(box);
        boxGroup.push(box);
      }
    }
    return boxGroup;
  }

  function createSecurityMonitor(x, y, z) {
    var screenGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.1);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2, emissive: 0x003300 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(x, y, z);
    scene.add(screen);
    objects.push(screen);

    var bezelGeometry = new THREE.BoxGeometry(1.3, 0.9, 0.05);
    var bezelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
    var bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.set(x, y, z - 0.08);
    scene.add(bezel);
    objects.push(bezel);

    return { screen: screen, bezel: bezel };
  }

  function createATM(x, y, z) {
    var bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    scene.add(body);
    objects.push(body);

    var screenGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.02);
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x003333, metalness: 0.6, emissive: 0x00FF00 });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(x, y + 0.3, z - 0.22);
    scene.add(screen);
    objects.push(screen);

    return { body: body, screen: screen };
  }

  function createMoneyBag(x, y, z) {
    var bagGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var bagMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, metalness: 0.1, roughness: 0.9 });
    var bag = new THREE.Mesh(bagGeometry, bagMaterial);
    bag.scale.set(1, 1.3, 0.8);
    bag.position.set(x, y, z);
    scene.add(bag);
    objects.push(bag);

    var strapeGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.4);
    var strapMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6B00, metalness: 0.05, roughness: 0.95 });
    var strap = new THREE.Mesh(strapeGeometry, strapMaterial);
    strap.position.set(x, y, z);
    scene.add(strap);
    objects.push(strap);

    return { bag: bag, strap: strap };
  }

  function createHostage(x, y, z) {
    var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    var skinMaterial = new THREE.MeshStandardMaterial({ color: 0xE8B89F, metalness: 0, roughness: 0.9 });
    var head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.set(x, y + 0.8, z);
    scene.add(head);
    objects.push(head);

    var bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
    var clothMaterial = new THREE.MeshStandardMaterial({ color: 0x1a5c7a, metalness: 0.1, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeometry, clothMaterial);
    body.position.set(x, y + 0.2, z);
    scene.add(body);
    objects.push(body);

    return { head: head, body: body, x: x, y: y, z: z };
  }

  function createCeiling() {
    var ceilingGeometry = new THREE.BoxGeometry(20, 0.2, 20);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, metalness: 0.4, roughness: 0.6 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 6, 0);
    scene.add(ceiling);
    objects.push(ceiling);
    return ceiling;
  }

  function createWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, metalness: 0.1, roughness: 0.8 });

    var northWallGeometry = new THREE.BoxGeometry(20, 6, 0.3);
    var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, 3, -10);
    scene.add(northWall);
    objects.push(northWall);

    var southWallGeometry = new THREE.BoxGeometry(20, 6, 0.3);
    var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, 3, 10);
    scene.add(southWall);
    objects.push(southWall);

    var westWallGeometry = new THREE.BoxGeometry(0.3, 6, 20);
    var westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-10, 3, 0);
    scene.add(westWall);
    objects.push(westWall);

    var eastWallGeometry = new THREE.BoxGeometry(0.3, 6, 20);
    var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(10, 3, 0);
    scene.add(eastWall);
    objects.push(eastWall);
  }

  function createFloor() {
    var floorGeometry = new THREE.BoxGeometry(20, 0.2, 20);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000, metalness: 0.2, roughness: 0.7 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0, 0);
    scene.add(floor);
    objects.push(floor);
    return floor;
  }

  function createSecurityRoom() {
    var roomGeometry = new THREE.BoxGeometry(5, 4, 4);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.3, roughness: 0.7 });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(8, 2, 7);
    scene.add(room);
    objects.push(room);

    var monitor1 = createSecurityMonitor(6.5, 4, 8);
    var monitor2 = createSecurityMonitor(9.5, 4, 8);
    var monitor3 = createSecurityMonitor(8, 4, 5.5);

    var deskGeometry = new THREE.BoxGeometry(3, 0.8, 2);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, metalness: 0.3, roughness: 0.7 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(8, 1.5, 6);
    scene.add(desk);
    objects.push(desk);

    return { room: room, desk: desk, monitors: [monitor1, monitor2, monitor3] };
  }

  function createBlastWindow(x, y, z) {
    var glassGeometry = new THREE.BoxGeometry(2, 2, 0.05);
    var glassMaterial = new THREE.MeshStandardMaterial({ color: 0xB0E0E6, metalness: 0.5, roughness: 0.2, transparent: true, opacity: 0.6 });
    var glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(x, y, z);
    scene.add(glass);
    objects.push(glass);

    var frameGeometry = new THREE.BoxGeometry(2.1, 2.1, 0.15);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z - 0.1);
    scene.add(frame);
    objects.push(frame);

    return { glass: glass, frame: frame };
  }

  function createStaircase(x, y, z) {
    var stairWidth = 0.1;
    for (var i = 0; i < 8; i++) {
      var stepGeometry = new THREE.BoxGeometry(2, stairWidth, 1.5);
      var stepMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.4, roughness: 0.6 });
      var step = new THREE.Mesh(stepGeometry, stepMaterial);
      step.position.set(x, y + (i * stairWidth), z - (i * 0.8));
      scene.add(step);
      objects.push(step);
    }
  }

  function createAlarmStrobe() {
    var strobeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    var strobeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, metalness: 0.6 });
    var strobe = new THREE.Mesh(strobeGeometry, strobeMaterial);
    strobe.position.set(-8, 5.5, -8);
    scene.add(strobe);
    objects.push(strobe);
    return strobe;
  }

  function createTerroristPatrol(x, z) {
    var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0, roughness: 0.9 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 0.8, z);
    scene.add(head);
    objects.push(head);

    var bodyGeometry = new THREE.BoxGeometry(0.45, 0.9, 0.35);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.2, roughness: 0.7 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 0.2, z);
    scene.add(body);
    objects.push(body);

    var gunGeometry = new THREE.BoxGeometry(0.2, 0.4, 1.5);
    var gunMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    var gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(x + 0.3, 0.5, z - 0.8);
    scene.add(gun);
    objects.push(gun);

    return { head: head, body: body, gun: gun, x: x, z: z, angle: 0 };
  }

  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    objects = [];
    terroristPatrols = [];
    hostages = [];
    vaultDoorAngle = 0;
    vaultDoorTarget = 0;

    createFloor();
    createWalls();
    createCeiling();

    createMarbleColumn(-6, 0, -4);
    createMarbleColumn(6, 0, -4);
    createMarbleColumn(-6, 0, 4);
    createMarbleColumn(6, 0, 4);

    createTellerCounter(-5, 1.5, 0);
    createTellerCounter(0, 1.5, 0);
    createTellerCounter(5, 1.5, 0);

    var vaultDoor = createVaultDoor();

    createSafeDepositBoxes(-6, -8);

    createSecurityRoom();

    createATM(-9, 2, -3);
    createATM(-9, 2, 3);

    createMoneyBag(-1, 0.5, -12);
    createMoneyBag(0, 0.5, -12);
    createMoneyBag(1, 0.5, -12);
    createMoneyBag(0, 0.5, -13);

    createBlastWindow(9, 3, -6);
    createBlastWindow(9, 3, 6);

    createStaircase(-2, 0, -15);

    var strobe = createAlarmStrobe();

    hostages.push(createHostage(-3, 0, 3));
    hostages.push(createHostage(2, 0, 5));
    hostages.push(createHostage(4, 0, -2));

    terroristPatrols.push(createTerroristPatrol(-4, 0));
    terroristPatrols.push(createTerroristPatrol(5, -5));

    var lights = {
      vaultDoor: vaultDoor,
      strobe: strobe
    };

    return lights;
  };

  var update = function(delta) {
    timeElapsed += delta;

    for (var i = 0; i < terroristPatrols.length; i++) {
      var patrol = terroristPatrols[i];
      patrol.angle += delta * 0.5;
      var patrolRadius = 3;
      var newX = patrol.x + Math.cos(patrol.angle) * patrolRadius;
      var newZ = patrol.z + Math.sin(patrol.angle) * patrolRadius;
      patrol.head.position.x = newX;
      patrol.head.position.z = newZ;
      patrol.body.position.x = newX;
      patrol.body.position.z = newZ;
      patrol.gun.position.x = newX + 0.3;
      patrol.gun.position.z = newZ - 0.8;
    }

    for (var j = 0; j < hostages.length; j++) {
      var hostage = hostages[j];
      var tremor = Math.sin(timeElapsed * 2) * 0.05;
      hostage.head.position.y = hostage.y + 0.8 + tremor;
      hostage.body.position.y = hostage.y + 0.2 + tremor;
    }

    alarmPhase = Math.floor((timeElapsed * 4) % 2);
    alarmFlashing = (alarmPhase === 0);

    for (var k = 0; k < objects.length; k++) {
      var obj = objects[k];
      if (obj.geometry && obj.geometry instanceof THREE.SphereGeometry) {
        if (obj.material && obj.material.emissive && obj.material.color.getHex() === 0xFF0000) {
          if (alarmFlashing) {
            obj.material.emissive.setHex(0xFF0000);
            obj.material.color.setHex(0xFF0000);
          } else {
            obj.material.emissive.setHex(0x990000);
            obj.material.color.setHex(0x990000);
          }
        }
      }
    }

    if (vaultDoorAngle < vaultDoorTarget) {
      vaultDoorAngle += delta * 0.3;
      if (vaultDoorAngle > vaultDoorTarget) {
        vaultDoorAngle = vaultDoorTarget;
      }
    }

    for (var m = 0; m < objects.length; m++) {
      var obj = objects[m];
      if (obj.geometry && obj.geometry instanceof THREE.CylinderGeometry) {
        if (obj.position.z < -12.5 && obj.position.z > -13.5) {
          obj.rotation.y = vaultDoorAngle;
        }
      }
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    terroristPatrols = [];
    hostages = [];
    vaultDoorAngle = 0;
    vaultDoorTarget = 0;
    timeElapsed = 0;
    alarmFlashing = false;
    alarmPhase = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
