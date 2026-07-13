window.HighwayChase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var vehicles = [];
  var time = 0;

  var colors = {
    asphalt: 0x333333,
    grass: 0x2d5016,
    concrete: 0x888888,
    military: 0x4a6741,
    chrome: 0xcccccc,
    orange: 0xff9900,
    red: 0xdd0000,
    white: 0xffffff,
    black: 0x000000,
    yellow: 0xffff00,
    green: 0x00cc00
  };

  function createRoadSection(x, y, z, length) {
    var geometry = new THREE.BoxGeometry(20, 0.2, length);
    var material = new THREE.MeshStandardMaterial({ color: colors.asphalt });
    var road = new THREE.Mesh(geometry, material);
    road.position.set(x, y, z);
    road.receiveShadow = true;
    scene.add(road);
    objects.push(road);
    return road;
  }

  function createCrashBarrier(x, y, z, length) {
    var geometry = new THREE.BoxGeometry(0.5, 1.2, length);
    var material = new THREE.MeshStandardMaterial({ color: colors.yellow });
    var barrier = new THREE.Mesh(geometry, material);
    barrier.position.set(x, y, z);
    barrier.receiveShadow = true;
    scene.add(barrier);
    objects.push(barrier);
    return barrier;
  }

  function createLaneDivider(x, y, z) {
    var geometry = new THREE.BoxGeometry(0.3, 0.05, 2);
    var material = new THREE.MeshStandardMaterial({ color: colors.white });
    var divider = new THREE.Mesh(geometry, material);
    divider.position.set(x, y, z);
    scene.add(divider);
    objects.push(divider);
    return divider;
  }

  function createHighwaySign(x, y, z, text) {
    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: colors.chrome });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y, z);
    pole.castShadow = true;
    scene.add(pole);
    objects.push(pole);

    var panelGeometry = new THREE.BoxGeometry(3, 2, 0.2);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: colors.orange });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y + 3, z);
    panel.castShadow = true;
    scene.add(panel);
    objects.push(panel);

    return { pole: pole, panel: panel };
  }

  function createGunTruck(x, y, z) {
    var truck = {
      group: new THREE.Group(),
      wheels: [],
      turret: null,
      position: new THREE.Vector3(x, y, z),
      speed: 0
    };

    var bodyGeometry = new THREE.BoxGeometry(2.5, 2, 6);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    truck.group.add(body);

    var cabGeometry = new THREE.BoxGeometry(2, 1.8, 2);
    var cabMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 2, -1.5);
    cab.castShadow = true;
    truck.group.add(cab);

    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: colors.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      var offsetX = (i < 2) ? -1 : 1;
      var offsetZ = (i % 2 === 0) ? -1.5 : 1.5;
      wheel.position.set(offsetX, 0.6, offsetZ);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      truck.group.add(wheel);
      truck.wheels.push(wheel);
    }

    var turretBaseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.y = 3;
    turretBase.castShadow = true;
    truck.group.add(turretBase);

    var gunMountGeometry = new THREE.BoxGeometry(0.4, 1.5, 3);
    var gunMaterial = new THREE.MeshStandardMaterial({ color: colors.chrome });
    var gunMount = new THREE.Mesh(gunMountGeometry, gunMaterial);
    gunMount.position.set(0, 3.5, 0);
    gunMount.castShadow = true;
    truck.group.add(gunMount);
    truck.turret = gunMount;

    truck.group.position.copy(truck.position);
    scene.add(truck.group);
    objects.push(truck.group);
    vehicles.push(truck);

    return truck;
  }

  function createArmoredSUV(x, y, z) {
    var suv = {
      group: new THREE.Group(),
      position: new THREE.Vector3(x, y, z),
      speed: 0
    };

    var bodyGeometry = new THREE.BoxGeometry(2, 2.2, 4.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.3;
    body.castShadow = true;
    suv.group.add(body);

    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.45, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: colors.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      var offsetX = (i < 2) ? -1.2 : 1.2;
      var offsetZ = (i % 2 === 0) ? -1.2 : 1.2;
      wheel.position.set(offsetX, 0.7, offsetZ);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      suv.group.add(wheel);
    }

    var windowGeometry = new THREE.BoxGeometry(1.8, 1, 0.3);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(0, 1.8, -0.8);
    suv.group.add(window1);

    suv.group.position.copy(suv.position);
    scene.add(suv.group);
    objects.push(suv.group);
    vehicles.push(suv);

    return suv;
  }

  function createMotorcycle(x, y, z) {
    var bike = {
      group: new THREE.Group(),
      position: new THREE.Vector3(x, y, z),
      speed: 0
    };

    var frameGeometry = new THREE.BoxGeometry(0.8, 1.2, 2.2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: colors.black });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.8;
    frame.castShadow = true;
    bike.group.add(frame);

    for (var i = 0; i < 2; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: colors.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      var offsetZ = (i === 0) ? -0.8 : 0.8;
      wheel.position.set(0, 0.4, offsetZ);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      bike.group.add(wheel);
    }

    var riderGeometry = new THREE.BoxGeometry(0.6, 1, 0.4);
    var riderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var rider = new THREE.Mesh(riderGeometry, riderMaterial);
    rider.position.set(0, 1.8, -0.2);
    rider.castShadow = true;
    bike.group.add(rider);

    bike.group.position.copy(bike.position);
    scene.add(bike.group);
    objects.push(bike.group);
    vehicles.push(bike);

    return bike;
  }

  function createFuelTanker(x, y, z) {
    var tanker = {
      group: new THREE.Group(),
      position: new THREE.Vector3(x, y, z),
      speed: 0
    };

    var truckBodyGeometry = new THREE.BoxGeometry(2, 2, 4);
    var truckMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var truckBody = new THREE.Mesh(truckBodyGeometry, truckMaterial);
    truckBody.position.y = 1.2;
    truckBody.castShadow = true;
    tanker.group.add(truckBody);

    var tankGeometry = new THREE.CylinderGeometry(1.5, 1.5, 5, 12);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0xcc9900 });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(0, 1.5, 0);
    tank.rotation.z = Math.PI / 2;
    tank.castShadow = true;
    tanker.group.add(tank);

    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: colors.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      var offsetX = (i < 2) ? -1.2 : 1.2;
      var offsetZ = (i % 2 === 0) ? -1.2 : 1.2;
      wheel.position.set(offsetX, 0.6, offsetZ);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      tanker.group.add(wheel);
    }

    tanker.group.position.copy(tanker.position);
    scene.add(tanker.group);
    objects.push(tanker.group);
    vehicles.push(tanker);

    return tanker;
  }

  function createOverpass(x, y, z) {
    var spanGeometry = new THREE.BoxGeometry(25, 0.5, 8);
    var spanMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
    var span = new THREE.Mesh(spanGeometry, spanMaterial);
    span.position.set(x, y + 6, z);
    span.receiveShadow = true;
    scene.add(span);
    objects.push(span);

    for (var i = 0; i < 4; i++) {
      var pillarGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
      var pillarMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);

      var offsetX = (i < 2) ? -10 : 10;
      var offsetZ = (i % 2 === 0) ? -3 : 3;
      pillar.position.set(x + offsetX, y + 3, z + offsetZ);
      pillar.castShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    }
  }

  function createRestStop(x, y, z) {
    var buildingGeometry = new THREE.BoxGeometry(6, 3, 5);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, y + 2, z);
    building.castShadow = true;
    scene.add(building);
    objects.push(building);

    var roofGeometry = new THREE.ConeGeometry(5, 1.5, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6347 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, y + 4.5, z);
    roof.castShadow = true;
    scene.add(roof);
    objects.push(roof);

    var parkingGeometry = new THREE.BoxGeometry(12, 0.1, 10);
    var parkingMaterial = new THREE.MeshStandardMaterial({ color: colors.asphalt });
    var parking = new THREE.Mesh(parkingGeometry, parkingMaterial);
    parking.position.set(x, y + 0.05, z + 8);
    parking.receiveShadow = true;
    scene.add(parking);
    objects.push(parking);
  }

  function createHelicopter(x, y, z) {
    var heli = {
      group: new THREE.Group(),
      position: new THREE.Vector3(x, y, z),
      rotor: null,
      angle: 0
    };

    var bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    heli.group.add(body);

    var cabGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var cabMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 2, -0.5);
    cab.scale.set(1, 0.8, 1);
    cab.castShadow = true;
    heli.group.add(cab);

    var rotorDiskGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: colors.chrome });
    var rotorDisk = new THREE.Mesh(rotorDiskGeometry, rotorMaterial);
    rotorDisk.position.y = 2.5;
    heli.group.add(rotorDisk);

    var blade1Geometry = new THREE.BoxGeometry(0.2, 0.05, 5);
    var bladeMaterial = new THREE.MeshStandardMaterial({ color: colors.chrome });
    var blade1 = new THREE.Mesh(blade1Geometry, bladeMaterial);
    blade1.position.set(0, 2.5, 0);
    heli.group.add(blade1);
    heli.rotor = blade1;

    var blade2Geometry = new THREE.BoxGeometry(5, 0.05, 0.2);
    var blade2 = new THREE.Mesh(blade2Geometry, bladeMaterial);
    blade2.position.set(0, 2.5, 0);
    heli.group.add(blade2);

    var tailBoomGeometry = new THREE.BoxGeometry(0.3, 0.3, 2);
    var tailMaterial = new THREE.MeshStandardMaterial({ color: colors.military });
    var tailBoom = new THREE.Mesh(tailBoomGeometry, tailMaterial);
    tailBoom.position.set(0, 0.5, 2.5);
    tailBoom.castShadow = true;
    heli.group.add(tailBoom);

    heli.group.position.copy(heli.position);
    scene.add(heli.group);
    objects.push(heli.group);

    return heli;
  }

  function createBillboard(x, y, z, text) {
    var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: colors.chrome });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y, z);
    pole.castShadow = true;
    scene.add(pole);
    objects.push(pole);

    var boardGeometry = new THREE.BoxGeometry(6, 4, 0.3);
    var boardMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    var board = new THREE.Mesh(boardGeometry, boardMaterial);
    board.position.set(x, y + 4, z);
    board.castShadow = true;
    scene.add(board);
    objects.push(board);

    return { pole: pole, board: board };
  }

  function createSkidMark(x, y, z) {
    var geometry = new THREE.BoxGeometry(1.5, 0.05, 3);
    var material = new THREE.MeshStandardMaterial({ color: colors.black });
    var mark = new THREE.Mesh(geometry, material);
    mark.position.set(x, y + 0.1, z);
    scene.add(mark);
    objects.push(mark);
    return mark;
  }

  function createCommunicationLight(x, y, z) {
    var light = {
      mesh: null,
      blink: 0
    };

    var geometry = new THREE.SphereGeometry(0.3, 8, 8);
    var material = new THREE.MeshStandardMaterial({
      color: colors.red,
      emissive: colors.red,
      emissiveIntensity: 0.5
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    objects.push(mesh);

    light.mesh = mesh;
    return light;
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    vehicles = [];
    time = 0;

    // Road sections
    createRoadSection(0, 0, 0, 100);
    createRoadSection(-8, 0, 0, 100);
    createRoadSection(8, 0, 0, 100);
    createRoadSection(-16, 0, 0, 100);
    createRoadSection(16, 0, 0, 100);

    // Crash barriers on edges
    createCrashBarrier(-20, 0.5, 0, 150);
    createCrashBarrier(20, 0.5, 0, 150);

    // Lane dividers
    for (var i = 0; i < 50; i++) {
      createLaneDivider(-8, 0.1, i * 4 - 100);
      createLaneDivider(0, 0.1, i * 4 - 100);
      createLaneDivider(8, 0.1, i * 4 - 100);
    }

    // Grass areas
    var grassGeometry = new THREE.BoxGeometry(60, 0.2, 200);
    var grassMaterial = new THREE.MeshStandardMaterial({ color: colors.grass });
    var grass1 = new THREE.Mesh(grassGeometry, grassMaterial);
    grass1.position.set(-30, -0.1, 0);
    scene.add(grass1);
    objects.push(grass1);

    var grass2 = new THREE.Mesh(grassGeometry, grassMaterial);
    grass2.position.set(30, -0.1, 0);
    scene.add(grass2);
    objects.push(grass2);

    // Highway signs
    createHighwaySign(-25, 1, -40, 'SPEED 65');
    createHighwaySign(25, 1, 20, 'EXIT 42');
    createHighwaySign(-25, 1, 60, 'REST STOP');

    // Billboards
    createBillboard(-28, 0, -80, 'MILITARY ZONE');
    createBillboard(28, 0, 40, 'WARNING');

    // Gun trucks convoy
    createGunTruck(-8, 0, 20);
    createGunTruck(-8, 0, 45);
    createGunTruck(-8, 0, 70);

    // Armored SUVs
    createArmoredSUV(0, 0, 15);
    createArmoredSUV(8, 0, 35);

    // Motorcycles
    createMotorcycle(0, 0, 55);
    createMotorcycle(8, 0, 65);

    // Fuel tanker
    createFuelTanker(-16, 0, 30);

    // Overpass
    createOverpass(0, 0, -50);

    // Rest stop
    createRestStop(-30, 0, 0);

    // Helicopter
    createHelicopter(5, 15, 10);

    // Skid marks
    createSkidMark(-6, 0, 10);
    createSkidMark(-4, 0, 35);
    createSkidMark(2, 0, 50);

    // Communication lights on trucks
    createCommunicationLight(-7.5, 3, 20);
    createCommunicationLight(-7.5, 3, 45);
    createCommunicationLight(-7.5, 3, 70);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 30, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var fogColor = 0x87ceeb;
    scene.fog = new THREE.Fog(fogColor, 200, 500);
    scene.background = new THREE.Color(fogColor);
  };

  var update = function(delta) {
    time += delta;

    // Move vehicles forward
    for (var i = 0; i < vehicles.length; i++) {
      var vehicle = vehicles[i];
      vehicle.position.z += 0.3;
      vehicle.group.position.copy(vehicle.position);

      // Rotate wheels
      if (vehicle.wheels) {
        for (var w = 0; w < vehicle.wheels.length; w++) {
          vehicle.wheels[w].rotation.x += 0.05;
        }
      }

      // Track turrets toward center
      if (vehicle.turret) {
        var lookAtTarget = new THREE.Vector3(0, 3.5, vehicle.position.z + 20);
        vehicle.turret.lookAt(lookAtTarget);
      }
    }

    // Helicopter circling
    for (var j = 0; j < objects.length; j++) {
      var obj = objects[j];
      if (obj.userData && obj.userData.isHelicopter) {
        var heliData = obj.userData;
        heliData.angle += 0.02;
        var radius = 30;
        obj.position.x = 5 + Math.cos(heliData.angle) * radius;
        obj.position.z = 10 + Math.sin(heliData.angle) * radius;

        if (heliData.rotor) {
          heliData.rotor.rotation.y += 0.3;
        }
      }
    }

    // Billboard flapping
    for (var k = 0; k < objects.length; k++) {
      var billObj = objects[k];
      if (billObj.userData && billObj.userData.isBillboard) {
        billObj.rotation.z = Math.sin(time * 2) * 0.1;
      }
    }

    // Communication light blinking
    for (var l = 0; l < objects.length; l++) {
      var lightObj = objects[l];
      if (lightObj.userData && lightObj.userData.isCommLight) {
        var blink = Math.floor(time * 3) % 2;
        lightObj.material.emissiveIntensity = blink ? 1 : 0.2;
      }
    }
  };

  var reset = function() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    vehicles = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
