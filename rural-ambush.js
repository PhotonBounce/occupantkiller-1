window.RuralAmbush = (function() {
  'use strict';

  var scene, camera;
  var gameObjects = [];
  var ambushers = [];
  var vehicles = [];
  var environmentObjects = [];

  var colors = {
    farmhouseWhite: 0xF5F5F0,
    barnRed: 0x8B2222,
    cornfieldYellow: 0xCCBB44,
    roadGray: 0x555555,
    dirtBrown: 0x8B6914,
    fenceWood: 0xAA8855,
    skyBlue: 0x87CEEB,
    grassGreen: 0x3D7C3D
  };

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    gameObjects = [];
    ambushers = [];
    vehicles = [];
    environmentObjects = [];

    createTerrain();
    createRoadCrossroads();
    createFarmhouse();
    createBarn();
    createCornfield();
    createIrrigationDitch();
    createConvoyVehicles();
    createFenceLines();
    createGrainSilo();
    createFarmEquipment();
    createHaystack();
    createStoneWall();
    createScarecrow();
    createAmbushers();
  }

  function createTerrain() {
    var terrainGeometry = new THREE.BoxGeometry(500, 1, 500);
    var terrainMaterial = new THREE.MeshLambertMaterial({ color: colors.grassGreen });
    var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -0.5;
    terrain.receiveShadow = true;
    scene.add(terrain);
    environmentObjects.push(terrain);
  }

  function createRoadCrossroads() {
    var roadWidth = 40;
    var roadLength = 300;

    var horizontalRoad = new THREE.BoxGeometry(roadLength, 0.2, roadWidth);
    var roadMaterial = new THREE.MeshLambertMaterial({ color: colors.roadGray });
    var hRoad = new THREE.Mesh(horizontalRoad, roadMaterial);
    hRoad.position.set(0, 0, 0);
    hRoad.receiveShadow = true;
    scene.add(hRoad);
    environmentObjects.push(hRoad);

    var verticalRoad = new THREE.BoxGeometry(roadWidth, 0.2, roadLength);
    var vRoad = new THREE.Mesh(verticalRoad, roadMaterial);
    vRoad.position.set(0, 0, 0);
    vRoad.receiveShadow = true;
    scene.add(vRoad);
    environmentObjects.push(vRoad);

    var centerMarking = new THREE.BoxGeometry(roadLength - 20, 0.01, 1);
    var markingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    var centerLine = new THREE.Mesh(centerMarking, markingMaterial);
    centerLine.position.set(0, 0.15, 0);
    scene.add(centerLine);
    environmentObjects.push(centerLine);
  }

  function createFarmhouse() {
    var houseGeometry = new THREE.BoxGeometry(30, 25, 25);
    var houseMaterial = new THREE.MeshLambertMaterial({ color: colors.farmhouseWhite });
    var house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(80, 12.5, 100);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);
    gameObjects.push(house);

    var roofGeometry = new THREE.BoxGeometry(32, 15, 27);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(80, 32.5, 100);
    roof.rotation.z = 0.3;
    roof.castShadow = true;
    scene.add(roof);
    gameObjects.push(roof);

    var doorGeometry = new THREE.BoxGeometry(8, 18, 0.5);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(80, 9, 37.5);
    door.castShadow = true;
    scene.add(door);
    gameObjects.push(door);

    var windowGeometry = new THREE.BoxGeometry(6, 6, 0.3);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
    for (var i = 0; i < 4; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(60 + i * 15, 20, 37.6);
      window.castShadow = true;
      scene.add(window);
      gameObjects.push(window);
    }
  }

  function createBarn() {
    var barnGeometry = new THREE.BoxGeometry(60, 30, 40);
    var barnMaterial = new THREE.MeshLambertMaterial({ color: colors.barnRed });
    var barn = new THREE.Mesh(barnGeometry, barnMaterial);
    barn.position.set(-100, 15, 120);
    barn.castShadow = true;
    barn.receiveShadow = true;
    scene.add(barn);
    gameObjects.push(barn);

    var roofRadius = 22;
    var roofGeometry = new THREE.CylinderGeometry(roofRadius, roofRadius, 62, 32, 1);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-100, 45, 120);
    roof.rotation.z = Math.PI / 2;
    roof.castShadow = true;
    scene.add(roof);
    gameObjects.push(roof);

    var doorGeometry = new THREE.BoxGeometry(15, 25, 0.5);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-100, 12.5, 139.75);
    door.castShadow = true;
    scene.add(door);
    gameObjects.push(door);

    var loftWindowGeometry = new THREE.BoxGeometry(8, 8, 0.3);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
    var loftWindow = new THREE.Mesh(loftWindowGeometry, windowMaterial);
    loftWindow.position.set(-100, 35, 139.8);
    loftWindow.castShadow = true;
    scene.add(loftWindow);
    gameObjects.push(loftWindow);
  }

  function createCornfield() {
    var stalkRadius = 0.3;
    var stalkHeight = 15;
    var gridSpacing = 3;
    var fieldSize = 80;

    for (var x = -fieldSize / 2; x < fieldSize / 2; x += gridSpacing) {
      for (var z = -fieldSize / 2; z < fieldSize / 2; z += gridSpacing) {
        var stalkGeometry = new THREE.CylinderGeometry(stalkRadius, stalkRadius, stalkHeight, 8);
        var stalkMaterial = new THREE.MeshLambertMaterial({ color: colors.cornfieldYellow });
        var stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
        stalk.position.set(150 + x, stalkHeight / 2, -120 + z);
        stalk.castShadow = true;
        stalk.receiveShadow = true;
        scene.add(stalk);
        environmentObjects.push(stalk);
        stalk.userData.swayPhase = Math.random() * Math.PI * 2;
      }
    }
  }

  function createIrrigationDitch() {
    var ditchGeometry = new THREE.BoxGeometry(150, 8, 6);
    var ditchMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    var ditch = new THREE.Mesh(ditchGeometry, ditchMaterial);
    ditch.position.set(-150, -1, 60);
    ditch.castShadow = true;
    ditch.receiveShadow = true;
    scene.add(ditch);
    gameObjects.push(ditch);

    var waterGeometry = new THREE.BoxGeometry(148, 0.5, 4);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4A90E2, transparent: true, opacity: 0.6 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(-150, 3.5, 60);
    water.receiveShadow = true;
    scene.add(water);
    environmentObjects.push(water);
  }

  function createConvoyVehicles() {
    var truck1Geometry = new THREE.BoxGeometry(12, 10, 25);
    var truckMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    var truck1 = new THREE.Mesh(truck1Geometry, truckMaterial);
    truck1.position.set(-60, 5, 0);
    truck1.castShadow = true;
    truck1.receiveShadow = true;
    scene.add(truck1);
    vehicles.push(truck1);

    var wheel1Geometry = new THREE.CylinderGeometry(3, 3, 2, 16);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheel1Geometry, wheelMaterial);
      wheel.position.set(-60 + (i < 2 ? -6 : 6), 3.5, (i % 2 === 0 ? -8 : 8));
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      scene.add(wheel);
      vehicles.push(wheel);
    }

    var smokingTruckGeometry = new THREE.BoxGeometry(14, 12, 30);
    var burnedMaterial = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var truck2 = new THREE.Mesh(smokingTruckGeometry, burnedMaterial);
    truck2.position.set(40, 6, -5);
    truck2.castShadow = true;
    truck2.receiveShadow = true;
    scene.add(truck2);
    vehicles.push(truck2);

    var jeepGeometry = new THREE.BoxGeometry(8, 8, 16);
    var jeepMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
    var jeep = new THREE.Mesh(jeepGeometry, jeepMaterial);
    jeep.position.set(20, 4, 15);
    jeep.castShadow = true;
    jeep.receiveShadow = true;
    scene.add(jeep);
    vehicles.push(jeep);

    var wheel2Geometry = new THREE.CylinderGeometry(2, 2, 1.5, 16);
    for (var j = 0; j < 4; j++) {
      var wheel2 = new THREE.Mesh(wheel2Geometry, wheelMaterial);
      wheel2.position.set(20 + (j < 2 ? -4 : 4), 2.5, (j % 2 === 0 ? -6 : 6));
      wheel2.rotation.z = Math.PI / 2;
      wheel2.castShadow = true;
      scene.add(wheel2);
      vehicles.push(wheel2);
    }
  }

  function createFenceLines() {
    var fenceLength = 200;
    var postSpacing = 10;
    var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 12);
    var postMaterial = new THREE.MeshLambertMaterial({ color: colors.fenceWood });

    for (var i = 0; i < fenceLength; i += postSpacing) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(-200 + i, 4, -150);
      post.castShadow = true;
      scene.add(post);
      gameObjects.push(post);

      if (i < fenceLength - postSpacing) {
        var railGeometry = new THREE.BoxGeometry(postSpacing, 1, 0.5);
        var rail = new THREE.Mesh(railGeometry, postMaterial);
        rail.position.set(-195 + i, 6, -150);
        rail.castShadow = true;
        scene.add(rail);
        gameObjects.push(rail);
      }
    }
  }

  function createGrainSilo() {
    var siloGeometry = new THREE.CylinderGeometry(12, 12, 50, 32);
    var siloMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
    var silo = new THREE.Mesh(siloGeometry, siloMaterial);
    silo.position.set(-180, 25, -80);
    silo.castShadow = true;
    silo.receiveShadow = true;
    scene.add(silo);
    gameObjects.push(silo);

    var capGeometry = new THREE.ConeGeometry(13, 10, 32);
    var capMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.set(-180, 55, -80);
    cap.castShadow = true;
    scene.add(cap);
    gameObjects.push(cap);
  }

  function createFarmEquipment() {
    var tractorBodyGeometry = new THREE.BoxGeometry(6, 6, 12);
    var tractorMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var tractorBody = new THREE.Mesh(tractorBodyGeometry, tractorMaterial);
    tractorBody.position.set(100, 3, -150);
    tractorBody.castShadow = true;
    scene.add(tractorBody);
    gameObjects.push(tractorBody);

    var rearWheelGeometry = new THREE.CylinderGeometry(4, 4, 2, 16);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    var rearWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
    rearWheel.position.set(100, 4, -140);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.castShadow = true;
    scene.add(rearWheel);
    gameObjects.push(rearWheel);

    var frontWheelGeometry = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
    var frontWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
    frontWheel.position.set(100, 2.5, -158);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.castShadow = true;
    scene.add(frontWheel);
    gameObjects.push(frontWheel);

    var cabGeometry = new THREE.BoxGeometry(4, 4, 4);
    var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(100, 6, -156);
    cab.castShadow = true;
    scene.add(cab);
    gameObjects.push(cab);
  }

  function createHaystack() {
    var haystackGeometry = new THREE.BoxGeometry(25, 18, 20);
    var haystackMaterial = new THREE.MeshLambertMaterial({ color: 0xD4A574 });
    var haystack = new THREE.Mesh(haystackGeometry, haystackMaterial);
    haystack.position.set(-220, 9, 40);
    haystack.rotation.z = 0.2;
    haystack.castShadow = true;
    haystack.receiveShadow = true;
    scene.add(haystack);
    gameObjects.push(haystack);
  }

  function createStoneWall() {
    var wallGeometry = new THREE.BoxGeometry(200, 4, 1);
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var wall = new THREE.Mesh(wallGeometry, stoneMaterial);
    wall.position.set(0, 2, -200);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    gameObjects.push(wall);
  }

  function createScarecrow() {
    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 12);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(200, 10, -100);
    pole.castShadow = true;
    scene.add(pole);
    gameObjects.push(pole);

    var torsoGeometry = new THREE.BoxGeometry(3, 4, 1.5);
    var torsoMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
    var torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(200, 14, -100);
    torso.castShadow = true;
    scene.add(torso);
    gameObjects.push(torso);

    var armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var armMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(197, 14, -100);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    scene.add(leftArm);
    gameObjects.push(leftArm);

    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(203, 14, -100);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    scene.add(rightArm);
    gameObjects.push(rightArm);

    var headGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var headMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(200, 18, -100);
    head.castShadow = true;
    scene.add(head);
    gameObjects.push(head);

    pole.userData.rotationSpeed = 0.5;
  }

  function createAmbushers() {
    var positions = [
      { x: 120, y: 15, z: 100 },
      { x: 180, y: 8, z: 130 },
      { x: 140, y: 20, z: -120 },
      { x: -140, y: 20, z: 100 },
      { x: -100, y: 40, z: 120 },
      { x: -200, y: 5, z: 60 },
      { x: 200, y: 5, z: -100 },
      { x: 160, y: 10, z: 160 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var bodyGeometry = new THREE.BoxGeometry(2, 4, 1.5);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, pos.y, pos.z);
      body.castShadow = true;
      scene.add(body);
      ambushers.push({
        mesh: body,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        health: 100,
        movementPhase: Math.random() * Math.PI * 2
      });

      var headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos.x, pos.y + 2.5, pos.z);
      head.castShadow = true;
      scene.add(head);
      ambushers[i].head = head;
    }
  }

  function update(delta) {
    if (!scene) return;

    for (var i = 0; i < gameObjects.length; i++) {
      var obj = gameObjects[i];
      if (obj.userData.swayPhase !== undefined) {
        obj.userData.swayPhase += delta * 2;
        var sway = Math.sin(obj.userData.swayPhase) * 0.05;
        obj.rotation.z = sway;
      }

      if (obj.userData.rotationSpeed !== undefined) {
        obj.rotation.y += obj.userData.rotationSpeed * delta;
      }

      if (obj.position.x === -100 && obj.position.y === 45) {
        var doorSwing = Math.sin(Date.now() * 0.001) * 0.3;
        obj.rotation.y = doorSwing;
      }
    }

    for (var j = 0; j < ambushers.length; j++) {
      var ambusher = ambushers[j];
      ambusher.movementPhase += delta;
      var patrolDistance = 20;
      var movementOffset = Math.sin(ambusher.movementPhase * 0.5) * patrolDistance;
      ambusher.mesh.position.x = ambusher.position.x + movementOffset;
      if (ambusher.head) {
        ambusher.head.position.x = ambusher.position.x + movementOffset;
      }

      var lookDir = new THREE.Vector3(0, 0, 0);
      lookDir.sub(ambusher.position);
      ambusher.mesh.lookAt(ambusher.position.clone().add(lookDir));
    }

    var siloPosition = new THREE.Vector3(-180, 25, -80);
    for (var k = 0; k < environmentObjects.length; k++) {
      var envObj = environmentObjects[k];
      if (envObj.position.distanceTo(siloPosition) < 15) {
        var smokeOpacity = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
        if (envObj.material && envObj.material.opacity !== undefined) {
          envObj.material.opacity = smokeOpacity;
        }
      }
    }
  }

  function reset() {
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      scene.remove(gameObjects[i]);
    }
    for (var j = ambushers.length - 1; j >= 0; j--) {
      scene.remove(ambushers[j].mesh);
      if (ambushers[j].head) {
        scene.remove(ambushers[j].head);
      }
    }
    for (var k = vehicles.length - 1; k >= 0; k--) {
      scene.remove(vehicles[k]);
    }
    for (var l = environmentObjects.length - 1; l >= 0; l--) {
      scene.remove(environmentObjects[l]);
    }

    gameObjects = [];
    ambushers = [];
    vehicles = [];
    environmentObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
