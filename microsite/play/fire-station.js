window.FireStation = (function() {
  'use strict';

  var meshes = [];
  var lights = [];
  var animatedObjects = [];
  var scene = null;
  var camera = null;

  var colors = {
    fireRed: 0xCC2200,
    silver: 0xCCCCCC,
    gearYellow: 0xFFCC00,
    stationGray: 0x888888,
    dispatchBlue: 0x003399,
    concrete: 0x777777,
    white: 0xFFFFFF,
    black: 0x000000
  };

  function createFireTruck(posX, posY, posZ) {
    var truckGroup = new THREE.Group();

    // Main body
    var bodyGeom = new THREE.BoxGeometry(2.5, 1.8, 8);
    var bodyMat = new THREE.MeshPhongMaterial({ color: colors.fireRed });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.2;
    truckGroup.add(body);

    // Cabin
    var cabinGeom = new THREE.BoxGeometry(2.3, 1.5, 2);
    var cabinMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 1.2, -2.5);
    truckGroup.add(cabin);

    // Wheels
    var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    var wheelMat = new THREE.MeshPhongMaterial({ color: colors.black });

    var positions = [
      [-1.2, 0.6, -1.5],
      [1.2, 0.6, -1.5],
      [-1.2, 0.6, 1],
      [1.2, 0.6, 1],
      [-1.2, 0.6, 3],
      [1.2, 0.6, 3]
    ];

    positions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      truckGroup.add(wheel);
    });

    // Ladder on top
    var ladderGeom = new THREE.BoxGeometry(0.2, 4, 0.2);
    var ladderMat = new THREE.MeshPhongMaterial({ color: colors.silver });
    var ladderLeft = new THREE.Mesh(ladderGeom, ladderMat);
    ladderLeft.position.set(-1.1, 3, 0);
    truckGroup.add(ladderLeft);

    var ladderRight = new THREE.Mesh(ladderGeom, ladderMat);
    ladderRight.position.set(1.1, 3, 0);
    truckGroup.add(ladderRight);

    // Rungs
    for (var i = 0; i < 6; i++) {
      var rungGeom = new THREE.BoxGeometry(2.4, 0.15, 0.15);
      var rungMat = new THREE.MeshPhongMaterial({ color: colors.silver });
      var rung = new THREE.Mesh(rungGeom, rungMat);
      rung.position.set(0, 1.5 + (i * 0.5), 0);
      truckGroup.add(rung);
    }

    // Siren light on top
    var sirenGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    var sirenMat = new THREE.MeshPhongMaterial({ color: colors.fireRed, emissive: colors.fireRed });
    var siren = new THREE.Mesh(sirenGeom, sirenMat);
    siren.position.set(0, 4.5, 0);
    siren.userData.isSiren = true;
    truckGroup.add(siren);

    truckGroup.position.set(posX, posY, posZ);
    scene.add(truckGroup);
    meshes.push(body, cabin, siren);
    animatedObjects.push({ object: siren, type: 'siren' });

    return truckGroup;
  }

  function createHoseTower(posX, posY, posZ) {
    var towerGroup = new THREE.Group();

    // Main tower cylinder
    var mainGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 16);
    var mainMat = new THREE.MeshPhongMaterial({ color: colors.stationGray });
    var main = new THREE.Mesh(mainGeom, mainMat);
    main.position.y = 6;
    towerGroup.add(main);

    // Top platform
    var platformGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var platformMat = new THREE.MeshPhongMaterial({ color: colors.concrete });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = 12.5;
    towerGroup.add(platform);

    // Hose reel - spinning part
    var reelGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var reelMat = new THREE.MeshPhongMaterial({ color: colors.silver });
    var reel = new THREE.Mesh(reelGeom, reelMat);
    reel.position.set(0, 10, 0);
    reel.rotation.z = Math.PI / 2;
    reel.userData.isReel = true;
    towerGroup.add(reel);
    animatedObjects.push({ object: reel, type: 'reel' });

    // Support struts
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var strutGeom = new THREE.BoxGeometry(0.15, 8, 0.15);
      var strutMat = new THREE.MeshPhongMaterial({ color: colors.stationGray });
      var strut = new THREE.Mesh(strutGeom, strutMat);
      strut.position.set(Math.cos(angle) * 1.5, 4, Math.sin(angle) * 1.5);
      strut.rotation.z = angle;
      towerGroup.add(strut);
    }

    towerGroup.position.set(posX, posY, posZ);
    scene.add(towerGroup);
    meshes.push(main, platform, reel);

    return towerGroup;
  }

  function createDispatchCenter(posX, posY, posZ) {
    var dispatchGroup = new THREE.Group();

    // Main room
    var roomGeom = new THREE.BoxGeometry(5, 3.5, 4);
    var roomMat = new THREE.MeshPhongMaterial({ color: colors.dispatchBlue, side: THREE.BackSide });
    var room = new THREE.Mesh(roomGeom, roomMat);
    room.position.y = 1.75;
    dispatchGroup.add(room);

    // Dispatch desk
    var deskGeom = new THREE.BoxGeometry(4, 0.8, 2);
    var deskMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var desk = new THREE.Mesh(deskGeom, deskMat);
    desk.position.set(0, 0.8, 0);
    dispatchGroup.add(desk);

    // Radio equipment - stacked boxes
    for (var i = 0; i < 3; i++) {
      var radioGeom = new THREE.BoxGeometry(0.6, 0.5, 0.8);
      var radioMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var radio = new THREE.Mesh(radioGeom, radioMat);
      radio.position.set(-1.5 + (i * 0.9), 1.2 + (i * 0.5), 0);
      radio.userData.isRadio = true;
      dispatchGroup.add(radio);
      animatedObjects.push({ object: radio, type: 'radio', index: i });
    }

    // Status lights on wall
    for (var j = 0; j < 5; j++) {
      var lightGeom = new THREE.SphereGeometry(0.15, 8, 8);
      var lightMat = new THREE.MeshPhongMaterial({ color: colors.gearYellow, emissive: colors.gearYellow });
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(-1.8 + (j * 0.7), 2.8, -1.9);
      light.userData.isStatusLight = true;
      dispatchGroup.add(light);
      animatedObjects.push({ object: light, type: 'status', index: j });
    }

    dispatchGroup.position.set(posX, posY, posZ);
    scene.add(dispatchGroup);
    meshes.push(room, desk);

    return dispatchGroup;
  }

  function createGearLockers(posX, posY, posZ) {
    var lockerGroup = new THREE.Group();

    // Create 8 lockers in 2 rows
    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 4; col++) {
        var lockerGeom = new THREE.BoxGeometry(1, 2.2, 0.8);
        var lockerMat = new THREE.MeshPhongMaterial({ color: colors.gearYellow });
        var locker = new THREE.Mesh(lockerGeom, lockerMat);
        locker.position.set(-4.5 + (col * 2.5), 1.1, -3 + (row * 2));
        lockerGroup.add(locker);
        meshes.push(locker);

        // Door handle
        var handleGeom = new THREE.BoxGeometry(0.08, 0.4, 0.15);
        var handleMat = new THREE.MeshPhongMaterial({ color: colors.silver });
        var handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.set(-4.5 + (col * 2.5) + 0.35, 1.1, 0.45);
        lockerGroup.add(handle);
      }
    }

    lockerGroup.position.set(posX, posY, posZ);
    scene.add(lockerGroup);

    return lockerGroup;
  }

  function createFitnessRoom(posX, posY, posZ) {
    var fitnessGroup = new THREE.Group();

    // Treadmills - 3 boxes
    for (var i = 0; i < 3; i++) {
      var treadGeom = new THREE.BoxGeometry(1, 0.4, 2.2);
      var treadMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var tread = new THREE.Mesh(treadGeom, treadMat);
      tread.position.set(-3 + (i * 2.5), 0.2, 0);
      fitnessGroup.add(tread);
      meshes.push(tread);
    }

    // Weight rack
    var rackGeom = new THREE.BoxGeometry(2, 3, 1);
    var rackMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var rack = new THREE.Mesh(rackGeom, rackMat);
    rack.position.set(4, 1.5, 0);
    fitnessGroup.add(rack);
    meshes.push(rack);

    fitnessGroup.position.set(posX, posY, posZ);
    scene.add(fitnessGroup);

    return fitnessGroup;
  }

  function createKitchenRoom(posX, posY, posZ) {
    var kitchenGroup = new THREE.Group();

    // Stove
    var stoveGeom = new THREE.BoxGeometry(1.5, 1.2, 0.8);
    var stoveMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var stove = new THREE.Mesh(stoveGeom, stoveMat);
    stove.position.set(-3, 0.6, 0);
    kitchenGroup.add(stove);
    meshes.push(stove);

    // Refrigerator
    var fridgeGeom = new THREE.BoxGeometry(1, 2, 0.8);
    var fridgeMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var fridge = new THREE.Mesh(fridgeGeom, fridgeMat);
    fridge.position.set(-1, 1, 0);
    kitchenGroup.add(fridge);
    meshes.push(fridge);

    // Table
    var tableTopGeom = new THREE.BoxGeometry(3, 0.1, 2);
    var tableTopMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    var tableTop = new THREE.Mesh(tableTopGeom, tableTopMat);
    tableTop.position.set(2, 0.8, 0);
    kitchenGroup.add(tableTop);
    meshes.push(tableTop);

    // Table legs
    for (var i = 0; i < 4; i++) {
      var legGeom = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var legMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var leg = new THREE.Mesh(legGeom, legMat);
      var xOffset = i < 2 ? -1.2 : 1.2;
      var zOffset = i % 2 === 0 ? -0.8 : 0.8;
      leg.position.set(2 + xOffset, 0.4, zOffset);
      kitchenGroup.add(leg);
    }

    kitchenGroup.position.set(posX, posY, posZ);
    scene.add(kitchenGroup);

    return kitchenGroup;
  }

  function createPoleShaft(posX, posY, posZ) {
    var poleGroup = new THREE.Group();

    // Pole - vertical cylinder
    var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
    var poleMat = new THREE.MeshPhongMaterial({ color: colors.silver });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = 4;
    poleGroup.add(pole);
    meshes.push(pole);

    // Platform top
    var topPlatformGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12);
    var topPlatformMat = new THREE.MeshPhongMaterial({ color: colors.concrete });
    var topPlatform = new THREE.Mesh(topPlatformGeom, topPlatformMat);
    topPlatform.position.y = 8.2;
    poleGroup.add(topPlatform);
    meshes.push(topPlatform);

    // Ground landing
    var landingGeom = new THREE.CylinderGeometry(1, 1, 0.2, 12);
    var landingMat = new THREE.MeshPhongMaterial({ color: colors.concrete });
    var landing = new THREE.Mesh(landingGeom, landingMat);
    landing.position.y = 0.1;
    poleGroup.add(landing);
    meshes.push(landing);

    poleGroup.position.set(posX, posY, posZ);
    scene.add(poleGroup);

    return poleGroup;
  }

  function createBunkRoom(posX, posY, posZ) {
    var bunkGroup = new THREE.Group();

    // Create 4 bunk beds
    for (var i = 0; i < 4; i++) {
      // Bottom bunk
      var bottomGeom = new THREE.BoxGeometry(1.2, 0.3, 2.5);
      var bottomMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
      var bottom = new THREE.Mesh(bottomGeom, bottomMat);
      bottom.position.set(-4 + (i * 2.5), 0.4, 0);
      bunkGroup.add(bottom);
      meshes.push(bottom);

      // Top bunk
      var topGeom = new THREE.BoxGeometry(1.2, 0.3, 2.5);
      var topMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
      var top = new THREE.Mesh(topGeom, topMat);
      top.position.set(-4 + (i * 2.5), 1.8, 0);
      bunkGroup.add(top);
      meshes.push(top);

      // Ladder
      var ladderLeftGeom = new THREE.BoxGeometry(0.1, 1.4, 0.1);
      var ladderLeftMat = new THREE.MeshPhongMaterial({ color: colors.silver });
      var ladderLeft = new THREE.Mesh(ladderLeftGeom, ladderLeftMat);
      ladderLeft.position.set(-4.3 + (i * 2.5), 1.1, 0);
      bunkGroup.add(ladderLeft);
    }

    bunkGroup.position.set(posX, posY, posZ);
    scene.add(bunkGroup);

    return bunkGroup;
  }

  function createMainBay(posX, posY, posZ) {
    var bayGroup = new THREE.Group();

    // Floor
    var floorGeom = new THREE.BoxGeometry(20, 0.5, 25);
    var floorMat = new THREE.MeshPhongMaterial({ color: colors.concrete });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = 0;
    bayGroup.add(floor);
    meshes.push(floor);

    // Walls
    var wallMat = new THREE.MeshPhongMaterial({ color: colors.stationGray });

    // Back wall
    var backGeom = new THREE.BoxGeometry(20, 8, 0.5);
    var back = new THREE.Mesh(backGeom, wallMat);
    back.position.set(0, 4, -12.25);
    bayGroup.add(back);
    meshes.push(back);

    // Side walls
    var sideGeom = new THREE.BoxGeometry(0.5, 8, 25);
    var leftSide = new THREE.Mesh(sideGeom, wallMat);
    leftSide.position.set(-10.25, 4, 0);
    bayGroup.add(leftSide);
    meshes.push(leftSide);

    var rightSide = new THREE.Mesh(sideGeom, wallMat);
    rightSide.position.set(10.25, 4, 0);
    bayGroup.add(rightSide);
    meshes.push(rightSide);

    // Ceiling
    var ceilingGeom = new THREE.BoxGeometry(20, 0.3, 25);
    var ceilingMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.y = 8;
    bayGroup.add(ceiling);
    meshes.push(ceiling);

    // Support columns
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var colGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        var colMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
        var col = new THREE.Mesh(colGeom, colMat);
        col.position.set(-6 + (i * 6), 4, -8 + (j * 16));
        bayGroup.add(col);
        meshes.push(col);
      }
    }

    bayGroup.position.set(posX, posY, posZ);
    scene.add(bayGroup);

    return bayGroup;
  }

  function createExteriorStreet(posX, posY, posZ) {
    var streetGroup = new THREE.Group();

    // Road surface
    var roadGeom = new THREE.BoxGeometry(30, 0.1, 40);
    var roadMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var road = new THREE.Mesh(roadGeom, roadMat);
    road.position.y = 0;
    streetGroup.add(road);
    meshes.push(road);

    // Sidewalk
    var sidewalkGeom = new THREE.BoxGeometry(15, 0.08, 40);
    var sidewalkMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    var sidewalk = new THREE.Mesh(sidewalkGeom, sidewalkMat);
    sidewalk.position.set(10, 0.05, 0);
    streetGroup.add(sidewalk);
    meshes.push(sidewalk);

    // Barricade trucks
    createFireTruck(-8, 0, -12);
    createFireTruck(8, 0, -8);
    createFireTruck(-5, 0, 5);

    streetGroup.position.set(posX, posY, posZ);
    scene.add(streetGroup);

    return streetGroup;
  }

  function createFloodLights(posX, posY, posZ) {
    var lightsGroup = new THREE.Group();

    // Create 4 corner flood lights
    var corners = [
      [-12, 10, -15],
      [12, 10, -15],
      [-12, 10, 15],
      [12, 10, 15]
    ];

    corners.forEach(function(corner, idx) {
      var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
      var postMat = new THREE.MeshPhongMaterial({ color: colors.stationGray });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(corner[0], corner[1], corner[2]);
      lightsGroup.add(post);
      meshes.push(post);

      // Light fixture
      var fixtureGeom = new THREE.BoxGeometry(1.2, 0.8, 0.5);
      var fixtureMat = new THREE.MeshPhongMaterial({ color: colors.silver });
      var fixture = new THREE.Mesh(fixtureGeom, fixtureMat);
      fixture.position.set(corner[0], corner[1] + 0.5, corner[2]);
      fixture.userData.isFloodLight = true;
      lightsGroup.add(fixture);
      animatedObjects.push({ object: fixture, type: 'floodlight', index: idx });
    });

    lightsGroup.position.set(posX, posY, posZ);
    scene.add(lightsGroup);

    return lightsGroup;
  }

  function createWaterHoseReels(posX, posY, posZ) {
    var reelsGroup = new THREE.Group();

    // Create 3 wall-mounted hose reels
    for (var i = 0; i < 3; i++) {
      // Mount bracket
      var bracketGeom = new THREE.BoxGeometry(0.8, 0.4, 0.3);
      var bracketMat = new THREE.MeshPhongMaterial({ color: colors.silver });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.position.set(-6 + (i * 6), 2.5, 0);
      reelsGroup.add(bracket);
      meshes.push(bracket);

      // Hose reel
      var hoseGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 12);
      var hoseMat = new THREE.MeshPhongMaterial({ color: 0xCC6600 });
      var hose = new THREE.Mesh(hoseGeom, hoseMat);
      hose.position.set(-6 + (i * 6), 2.5, 0);
      hose.rotation.y = Math.PI / 2;
      hose.userData.isHoseReel = true;
      reelsGroup.add(hose);
      animatedObjects.push({ object: hose, type: 'hosereel', index: i });
    }

    reelsGroup.position.set(posX, posY, posZ);
    scene.add(reelsGroup);

    return reelsGroup;
  }

  function init(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    meshes = [];
    lights = [];
    animatedObjects = [];

    // Create main bay structure
    createMainBay(0, 0, 0);

    // Add equipment and rooms inside
    createDispatchCenter(-6, 5, 6);
    createGearLockers(6, 0, -4);
    createFitnessRoom(-8, 0, -8);
    createKitchenRoom(8, 0, -6);
    createPoleShaft(0, 0, 8);
    createBunkRoom(0, 7, -8);

    // Hose tower exterior
    createHoseTower(-15, 0, 0);

    // Exterior street and barricade
    createExteriorStreet(0, 0, -25);

    // Lights and reels
    createFloodLights(0, 0, 0);
    createWaterHoseReels(-10, 0, 8);

    // Add ambient light
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Add directional light
    var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    dirLight.position.set(20, 15, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);
    lights.push(dirLight);

    // Add some point lights for effect
    var pointLight = new THREE.PointLight(0xFF6600, 1, 50);
    pointLight.position.set(-15, 5, 0);
    scene.add(pointLight);
    lights.push(pointLight);

    return {
      meshes: meshes,
      lights: lights,
      animatedObjects: animatedObjects
    };
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    animatedObjects.forEach(function(item) {
      if (item.type === 'siren') {
        // Strobing red/white effect
        var intensity = (Math.sin(time * 8) + 1) / 2;
        item.object.material.emissive.setHex(intensity > 0.5 ? colors.fireRed : colors.white);
      } else if (item.type === 'radio') {
        // Blinking status lights
        var blinkRate = (item.index + 1) * 0.8;
        var shouldBlink = Math.sin(time * blinkRate) > 0.3;
        item.object.visible = shouldBlink;
      } else if (item.type === 'status') {
        // Dispatch status lights cycling
        var cycleTime = (time * 2 + item.index) % 1;
        var brightness = Math.sin(cycleTime * Math.PI);
        item.object.material.emissive.setHex(colors.gearYellow);
        item.object.material.emissiveIntensity = brightness;
      } else if (item.type === 'reel') {
        // Slow spinning reel
        item.object.rotation.x += delta * 0.3;
      } else if (item.type === 'floodlight') {
        // Sweeping flood lights
        var sweepAngle = (time * 0.5 + item.index * (Math.PI / 2)) % (Math.PI * 2);
        item.object.rotation.y = sweepAngle;
      } else if (item.type === 'hosereel') {
        // Spinning hose reels
        item.object.rotation.x += delta * 0.5;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });

    lights.forEach(function(light) {
      scene.remove(light);
    });

    animatedObjects = [];
    meshes = [];
    lights = [];

    // Remove all children from scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
