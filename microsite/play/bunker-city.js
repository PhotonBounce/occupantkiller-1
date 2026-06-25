window.BunkerCity = (function() {
  'use strict';

  var scene;
  var objects = [];
  var rotatingGenerators = [];

  function buildWalls(position, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.copy(position);
    scene.add(wall);
    objects.push(wall);
    return wall;
  }

  function buildBlastDoor(position, width, height) {
    var frame = new THREE.Group();
    var thickness = 0.5;
    var frameColor = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });

    var topBar = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, thickness), frameColor);
    topBar.position.y = height / 2;
    frame.add(topBar);

    var bottomBar = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, thickness), frameColor);
    bottomBar.position.y = -height / 2;
    frame.add(bottomBar);

    var leftBar = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), frameColor);
    leftBar.position.x = -width / 2;
    frame.add(leftBar);

    var rightBar = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), frameColor);
    rightBar.position.x = width / 2;
    frame.add(rightBar);

    frame.position.copy(position);
    scene.add(frame);
    objects.push(frame);
    return frame;
  }

  function buildCommandCenter(position) {
    var hub = new THREE.Group();
    var floorGeometry = new THREE.BoxGeometry(20, 0.5, 20);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, metalness: 0.4, roughness: 0.6 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -5;
    hub.add(floor);

    var wallsMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.5 });
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var wallX = Math.cos(angle) * 10;
      var wallZ = Math.sin(angle) * 10;
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 8), wallsMaterial);
      wall.position.set(wallX, 0, wallZ);
      hub.add(wall);
    }

    for (var j = 0; j < 3; j++) {
      var consoleBank = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.5), new THREE.MeshStandardMaterial({ color: 0x1a5f1a, emissive: 0x00ff00, emissiveIntensity: 0.3 }));
      consoleBank.position.set(-6 + j * 6, 0.5, 0);
      hub.add(consoleBank);
    }

    hub.position.copy(position);
    scene.add(hub);
    objects.push(hub);
    return hub;
  }

  function buildSleepingQuarters(position) {
    var quarters = new THREE.Group();
    var bunksPerStack = 3;
    var bunksWide = 2;

    for (var x = 0; x < bunksWide; x++) {
      for (var z = 0; z < bunksWide; z++) {
        for (var y = 0; y < bunksPerStack; y++) {
          var bunk = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.7, roughness: 0.3 })
          );
          bunk.position.set(-2 + x * 3, -2 + y * 1.5, -2 + z * 3);
          quarters.add(bunk);
        }
      }
    }

    quarters.position.copy(position);
    scene.add(quarters);
    objects.push(quarters);
    return quarters;
  }

  function buildGeneratorRoom(position) {
    var room = new THREE.Group();

    var generator = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8800, metalness: 0.8, roughness: 0.2 })
    );
    generator.position.y = 1.5;
    room.add(generator);

    var housing = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 })
    );
    housing.position.y = 2;
    room.add(housing);

    var pipes = [];
    for (var i = 0; i < 2; i++) {
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
      );
      pipe.position.x = -1.5 + i * 3;
      pipe.position.y = 3;
      room.add(pipe);
      pipes.push(pipe);
    }

    rotatingGenerators.push(generator);
    room.position.copy(position);
    scene.add(room);
    objects.push(room);
    return room;
  }

  function buildWaterTanks(position) {
    var tanks = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.5, 3),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 })
      );
      platform.position.x = -4 + i * 4;
      platform.position.y = 1;
      tanks.add(platform);

      var tank = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 3, 16),
        new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.8 })
      );
      tank.position.x = -4 + i * 4;
      tank.position.y = 3.5;
      tanks.add(tank);
    }

    tanks.position.copy(position);
    scene.add(tanks);
    objects.push(tanks);
    return tanks;
  }

  function buildStairwell(position) {
    var stairwell = new THREE.Group();

    var enclosure = new THREE.Mesh(
      new THREE.BoxGeometry(2, 8, 2),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 })
    );
    stairwell.add(enclosure);

    var stepCount = 16;
    var stepHeight = 8 / stepCount;
    for (var i = 0; i < stepCount; i++) {
      var step = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, stepHeight * 0.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 })
      );
      step.position.y = -4 + i * stepHeight;
      step.position.z = 0.6;
      stairwell.add(step);

      var stepOutline = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-0.9, stepHeight * 0.25, 0.2),
          new THREE.Vector3(0.9, stepHeight * 0.25, 0.2)
        ]),
        new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
      );
      stepOutline.position.y = -4 + i * stepHeight;
      stepOutline.position.z = 0.6;
      stairwell.add(stepOutline);
    }

    stairwell.position.copy(position);
    scene.add(stairwell);
    objects.push(stairwell);
    return stairwell;
  }

  function buildVentilation(position) {
    var vents = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 })
      );
      shaft.position.x = -2 + i * 1.5;
      shaft.position.y = 5;
      vents.add(shaft);
    }

    vents.position.copy(position);
    scene.add(vents);
    objects.push(vents);
    return vents;
  }

  function buildArmory(position) {
    var armory = new THREE.Group();

    var floorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.6 })
    );
    floorPlate.position.y = -3;
    armory.add(floorPlate);

    for (var x = 0; x < 3; x++) {
      for (var z = 0; z < 2; z++) {
        var rack = new THREE.Mesh(
          new THREE.BoxGeometry(1, 3, 1),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 })
        );
        rack.position.set(-4 + x * 4, 0, -2 + z * 4);
        armory.add(rack);

        for (var b = 0; b < 6; b++) {
          var barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 })
          );
          barrel.rotation.z = Math.PI / 2;
          barrel.position.set(-4 + x * 4, -1.5 + b * 0.5, -2 + z * 4);
          armory.add(barrel);
        }
      }
    }

    armory.position.copy(position);
    scene.add(armory);
    objects.push(armory);
    return armory;
  }

  function init(initScene, initCamera) {
    scene = initScene;

    buildWalls(new THREE.Vector3(0, 0, 0), 30, 4, 60);
    buildWalls(new THREE.Vector3(0, 0, -30), 30, 4, 0.5);
    buildWalls(new THREE.Vector3(0, 0, 30), 30, 4, 0.5);
    buildWalls(new THREE.Vector3(-15, 0, 0), 0.5, 4, 60);
    buildWalls(new THREE.Vector3(15, 0, 0), 0.5, 4, 60);

    buildBlastDoor(new THREE.Vector3(-7.5, 0, -15), 4, 3);
    buildBlastDoor(new THREE.Vector3(7.5, 0, -15), 4, 3);

    buildCommandCenter(new THREE.Vector3(0, 0, -50));
    buildSleepingQuarters(new THREE.Vector3(-20, 0, 10));
    buildGeneratorRoom(new THREE.Vector3(20, 0, 10));
    buildWaterTanks(new THREE.Vector3(0, 0, 20));
    buildStairwell(new THREE.Vector3(-12, 0, 40));
    buildVentilation(new THREE.Vector3(0, 3.5, 0));
    buildArmory(new THREE.Vector3(0, 0, -70));
  }

  function update(delta) {
    for (var i = 0; i < rotatingGenerators.length; i++) {
      rotatingGenerators[i].rotation.y += delta * 1.5;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    rotatingGenerators = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
