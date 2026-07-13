window.QuarantineZone = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var hazmatLights = [];
  var hazmatSigns = [];
  var deconNozzles = [];
  var hazmatFans = [];
  var mist = [];
  var barricadeLights = [];
  var startTime = 0;

  var materials = {
    barrier: new THREE.MeshStandardMaterial({ color: 0xFF6600, metalness: 0.6, roughness: 0.4 }),
    biohazard: new THREE.MeshStandardMaterial({ color: 0xFFCC00, metalness: 0.5, roughness: 0.5 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.2 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.1, roughness: 0.9 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.3, roughness: 0.7 }),
    darkPlastic: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.2, roughness: 0.8 }),
    tent: new THREE.MeshStandardMaterial({ color: 0x88FF88, metalness: 0.2, roughness: 0.8 }),
    medical: new THREE.MeshStandardMaterial({ color: 0xFF0000, metalness: 0.4, roughness: 0.6 }),
    mist: new THREE.MeshStandardMaterial({ color: 0xAAFFAA, metalness: 0.0, roughness: 1.0, transparent: true, opacity: 0.3 })
  };

  function createBarricadeLine() {
    var barricadeGroup = new THREE.Group();
    var barrierCount = 8;
    var spacing = 15;

    for (var i = 0; i < barrierCount; i++) {
      var barrierGeom = new THREE.BoxGeometry(2, 2, 0.3);
      var barrier = new THREE.Mesh(barrierGeom, materials.barrier);
      barrier.position.set(i * spacing - 50, 1, 0);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      barricadeGroup.add(barrier);
      objects.push(barrier);

      var tapeGeom = new THREE.BufferGeometry();
      var tapePoints = [
        new THREE.Vector3(-1.5, 2.5, 0),
        new THREE.Vector3(1.5, 2.5, 0),
        new THREE.Vector3(-1.5, -0.5, 0),
        new THREE.Vector3(1.5, -0.5, 0)
      ];
      tapeGeom.setFromPoints(tapePoints);
      var tapeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 });
      var tape = new THREE.LineSegments(tapeGeom, tapeMaterial);
      tape.position.set(i * spacing - 50, 1, 0.2);
      barricadeGroup.add(tape);
    }

    scene.add(barricadeGroup);
  }

  function createDecontaminationCorridor() {
    var deconGroup = new THREE.Group();
    var corridorLength = 40;
    var corridorWidth = 8;
    var corridorHeight = 4;

    var floorGeom = new THREE.BoxGeometry(corridorWidth, 0.2, corridorLength);
    var floor = new THREE.Mesh(floorGeom, materials.concrete);
    floor.position.set(0, 0.1, 30);
    floor.castShadow = true;
    floor.receiveShadow = true;
    deconGroup.add(floor);
    objects.push(floor);

    var wallGeom = new THREE.BoxGeometry(corridorWidth, corridorHeight, 0.3);
    var leftWall = new THREE.Mesh(wallGeom, materials.plastic);
    leftWall.position.set(-corridorWidth / 2 - 0.15, corridorHeight / 2, 30);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    deconGroup.add(leftWall);
    objects.push(leftWall);

    var rightWall = new THREE.Mesh(wallGeom, materials.plastic);
    rightWall.position.set(corridorWidth / 2 + 0.15, corridorHeight / 2, 30);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    deconGroup.add(rightWall);
    objects.push(rightWall);

    scene.add(deconGroup);
  }

  function createShowerStation() {
    var stationGroup = new THREE.Group();
    var stationX = -15;
    var stationZ = 40;

    var platformGeom = new THREE.BoxGeometry(6, 0.3, 6);
    var platform = new THREE.Mesh(platformGeom, materials.concrete);
    platform.position.set(stationX, 0.15, stationZ);
    platform.castShadow = true;
    platform.receiveShadow = true;
    stationGroup.add(platform);
    objects.push(platform);

    for (var i = 0; i < 4; i++) {
      var nozzleBaseGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
      var nozzleBase = new THREE.Mesh(nozzleBaseGeom, materials.metal);
      var offsetX = (i % 2) * 3 - 1.5;
      var offsetZ = Math.floor(i / 2) * 3 - 1.5;
      nozzleBase.position.set(stationX + offsetX, 2.5, stationZ + offsetZ);
      nozzleBase.castShadow = true;
      nozzleBase.receiveShadow = true;
      stationGroup.add(nozzleBase);
      objects.push(nozzleBase);

      var nozzleHeadGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var nozzleHead = new THREE.Mesh(nozzleHeadGeom, materials.metal);
      nozzleHead.position.set(stationX + offsetX, 2.8, stationZ + offsetZ);
      nozzleHead.castShadow = true;
      nozzleHead.receiveShadow = true;
      stationGroup.add(nozzleHead);
      deconNozzles.push({ mesh: nozzleHead, baseX: offsetX, baseZ: offsetZ });
    }

    scene.add(stationGroup);
  }

  function createHazmatTent() {
    var tentGroup = new THREE.Group();
    var tentX = 20;
    var tentZ = 35;

    var tentRoofGeom = new THREE.BoxGeometry(8, 0.2, 10);
    var tentRoof = new THREE.Mesh(tentRoofGeom, materials.tent);
    tentRoof.position.set(tentX, 3.5, tentZ);
    tentRoof.castShadow = true;
    tentRoof.receiveShadow = true;
    tentGroup.add(tentRoof);
    objects.push(tentRoof);

    var tentWallGeom = new THREE.BoxGeometry(8, 3, 0.2);
    for (var i = 0; i < 2; i++) {
      var wall = new THREE.Mesh(tentWallGeom, materials.tent);
      wall.position.set(tentX, 1.5, tentZ + (i === 0 ? 5 : -5));
      wall.castShadow = true;
      wall.receiveShadow = true;
      tentGroup.add(wall);
      objects.push(wall);
    }

    scene.add(tentGroup);
  }

  function createSealedBuilding() {
    var buildingGroup = new THREE.Group();
    var buildingX = 35;
    var buildingZ = 25;

    var buildingGeom = new THREE.BoxGeometry(12, 15, 10);
    var building = new THREE.Mesh(buildingGeom, materials.concrete);
    building.position.set(buildingX, 7.5, buildingZ);
    building.castShadow = true;
    building.receiveShadow = true;
    buildingGroup.add(building);
    objects.push(building);

    var windowCount = 8;
    for (var i = 0; i < windowCount; i++) {
      var sealGeom = new THREE.BoxGeometry(1.5, 1.5, 0.3);
      var seal = new THREE.Mesh(sealGeom, materials.plastic);
      var xOffset = (i % 2) * 4 - 2;
      var yOffset = Math.floor(i / 2) * 3.5 + 1;
      seal.position.set(buildingX - 6.2, yOffset, buildingZ + xOffset);
      seal.castShadow = true;
      seal.receiveShadow = true;
      buildingGroup.add(seal);
      objects.push(seal);
    }

    scene.add(buildingGroup);
  }

  function createAbandonedCars() {
    var carsGroup = new THREE.Group();
    var positions = [
      { x: -30, z: 15 },
      { x: -25, z: 12 },
      { x: 10, z: 20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var carBodyGeom = new THREE.BoxGeometry(2.5, 1.5, 5);
      var carBody = new THREE.Mesh(carBodyGeom, materials.metal);
      carBody.position.set(positions[i].x, 0.75, positions[i].z);
      carBody.rotation.y = Math.random() * Math.PI;
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      carsGroup.add(carBody);
      objects.push(carBody);

      var wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
      for (var j = 0; j < 4; j++) {
        var wheel = new THREE.Mesh(wheelGeom, materials.darkPlastic);
        var wheelX = (j % 2) * 2 - 1;
        var wheelZ = Math.floor(j / 2) * 4 - 2;
        wheel.position.set(positions[i].x + wheelX, 0.5, positions[i].z + wheelZ);
        wheel.rotation.z = Math.PI / 2;
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        carsGroup.add(wheel);
      }
    }

    scene.add(carsGroup);
  }

  function createOverturnedFurniture() {
    var furnitureGroup = new THREE.Group();
    var furnitureCount = 6;

    for (var i = 0; i < furnitureCount; i++) {
      var furniGeom = new THREE.BoxGeometry(2, 1, 1.5);
      var furniture = new THREE.Mesh(furniGeom, materials.darkPlastic);
      furniture.position.set(-40 + i * 12, 0.5, 5 + Math.random() * 5);
      furniture.rotation.z = Math.random() * 0.5;
      furniture.rotation.x = Math.random() * 0.3;
      furniture.castShadow = true;
      furniture.receiveShadow = true;
      furnitureGroup.add(furniture);
      objects.push(furniture);
    }

    scene.add(furnitureGroup);
  }

  function createBiohazardBarrels() {
    var barrelsGroup = new THREE.Group();
    var barrelPositions = [
      { x: -20, z: 10 },
      { x: -18, z: 11 },
      { x: 15, z: 8 },
      { x: 17, z: 9 }
    ];

    for (var i = 0; i < barrelPositions.length; i++) {
      var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
      var barrelMat = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        metalness: 0.3,
        roughness: 0.6
      });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.position.set(barrelPositions[i].x, 0.75, barrelPositions[i].z);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      barrelsGroup.add(barrel);
      objects.push(barrel);

      var stripGeom = new THREE.BoxGeometry(1.3, 0.15, 0.05);
      var stripMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
      for (var j = 0; j < 3; j++) {
        var strip = new THREE.Mesh(stripGeom, stripMat);
        strip.position.set(barrelPositions[i].x, 0.3 + j * 0.5, barrelPositions[i].z + 0.6);
        strip.castShadow = true;
        strip.receiveShadow = true;
        barrelsGroup.add(strip);
      }
    }

    scene.add(barrelsGroup);
  }

  function createMedicalObservationPosts() {
    var postsGroup = new THREE.Group();
    var postPositions = [
      { x: -10, z: 45 },
      { x: 25, z: 50 }
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var platformGeom = new THREE.BoxGeometry(4, 0.3, 4);
      var platform = new THREE.Mesh(platformGeom, materials.metal);
      platform.position.set(postPositions[i].x, 3, postPositions[i].z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      postsGroup.add(platform);
      objects.push(platform);

      var railGeom = new THREE.BoxGeometry(0.1, 1, 4);
      var rail = new THREE.Mesh(railGeom, materials.metal);
      rail.position.set(postPositions[i].x + 2, 3.5, postPositions[i].z);
      rail.castShadow = true;
      rail.receiveShadow = true;
      postsGroup.add(rail);
      objects.push(rail);
    }

    scene.add(postsGroup);
  }

  function createIsolationPods() {
    var podsGroup = new THREE.Group();
    var podCount = 4;

    for (var i = 0; i < podCount; i++) {
      var podGeom = new THREE.BoxGeometry(2, 2.5, 3);
      var podMat = new THREE.MeshStandardMaterial({
        color: 0x00CC99,
        metalness: 0.5,
        roughness: 0.5,
        transparent: true,
        opacity: 0.7
      });
      var pod = new THREE.Mesh(podGeom, podMat);
      pod.position.set(-35 + i * 5, 1.25, 50);
      pod.castShadow = true;
      pod.receiveShadow = true;
      podsGroup.add(pod);
      objects.push(pod);

      var doorGeom = new THREE.BoxGeometry(1.8, 2.3, 0.1);
      var door = new THREE.Mesh(doorGeom, materials.plastic);
      door.position.set(-35 + i * 5, 1.25, 51.5);
      door.castShadow = true;
      door.receiveShadow = true;
      podsGroup.add(door);
    }

    scene.add(podsGroup);
  }

  function createHospitalTent() {
    var hospitalGroup = new THREE.Group();
    var hospitalX = 0;
    var hospitalZ = 60;

    var tentGeom = new THREE.BoxGeometry(15, 6, 12);
    var tent = new THREE.Mesh(tentGeom, materials.tent);
    tent.position.set(hospitalX, 3, hospitalZ);
    tent.castShadow = true;
    tent.receiveShadow = true;
    hospitalGroup.add(tent);
    objects.push(tent);

    var roofGeom = new THREE.BoxGeometry(15.5, 0.3, 12.5);
    var roof = new THREE.Mesh(roofGeom, materials.tent);
    roof.position.set(hospitalX, 6.2, hospitalZ);
    roof.castShadow = true;
    roof.receiveShadow = true;
    hospitalGroup.add(roof);
    objects.push(roof);

    var crossGeom = new THREE.BoxGeometry(0.4, 2, 0.4);
    var crossH = new THREE.Mesh(crossGeom, materials.medical);
    crossH.position.set(hospitalX + 6, 7.2, hospitalZ + 5);
    crossH.castShadow = true;
    crossH.receiveShadow = true;
    hospitalGroup.add(crossH);

    var crossV = new THREE.Mesh(crossGeom, materials.medical);
    crossV.rotation.z = Math.PI / 2;
    crossV.position.set(hospitalX + 6, 7.2, hospitalZ + 5);
    crossV.castShadow = true;
    crossV.receiveShadow = true;
    hospitalGroup.add(crossV);

    scene.add(hospitalGroup);
  }

  function createBodyBagArea() {
    var bagGroup = new THREE.Group();
    var bagX = -45;
    var bagZ = 55;

    for (var i = 0; i < 5; i++) {
      var bagGeom = new THREE.BoxGeometry(1, 0.5, 2);
      var bag = new THREE.Mesh(bagGeom, materials.darkPlastic);
      bag.position.set(bagX + i * 2.2, 0.25, bagZ);
      bag.castShadow = true;
      bag.receiveShadow = true;
      bagGroup.add(bag);
      objects.push(bag);
    }

    scene.add(bagGroup);
  }

  function createPPEStorage() {
    var storageGroup = new THREE.Group();
    var storageX = 40;
    var storageZ = 55;

    var shelfGeom = new THREE.BoxGeometry(6, 4, 1.5);
    var shelf = new THREE.Mesh(shelfGeom, materials.metal);
    shelf.position.set(storageX, 2, storageZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    storageGroup.add(shelf);
    objects.push(shelf);

    var containerGeom = new THREE.BoxGeometry(1, 1, 1);
    for (var i = 0; i < 12; i++) {
      var container = new THREE.Mesh(containerGeom, materials.plastic);
      var offsetX = (i % 3) * 1.8 - 2.7;
      var offsetY = Math.floor(i / 3) * 1.2;
      container.position.set(storageX + offsetX, 1.2 + offsetY, storageZ);
      container.castShadow = true;
      container.receiveShadow = true;
      storageGroup.add(container);
      objects.push(container);
    }

    scene.add(storageGroup);
  }

  function createSprayDeconVehicle() {
    var vehicleGroup = new THREE.Group();
    var vehicleX = -50;
    var vehicleZ = 30;

    var cabGeom = new THREE.BoxGeometry(2.5, 2.5, 4);
    var cab = new THREE.Mesh(cabGeom, materials.metal);
    cab.position.set(vehicleX + 2, 1.25, vehicleZ);
    cab.castShadow = true;
    cab.receiveShadow = true;
    vehicleGroup.add(cab);
    objects.push(cab);

    var tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
    var tank = new THREE.Mesh(tankGeom, materials.metal);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(vehicleX - 3, 1.5, vehicleZ);
    tank.castShadow = true;
    tank.receiveShadow = true;
    vehicleGroup.add(tank);
    objects.push(tank);

    var wheelGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16);
    var wheelPositions = [
      { x: 1, z: -1.5 }, { x: 1, z: 1.5 },
      { x: -4, z: -1.5 }, { x: -4, z: 1.5 }
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wheel = new THREE.Mesh(wheelGeom, materials.darkPlastic);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(vehicleX + wheelPositions[i].x, 0.7, vehicleZ + wheelPositions[i].z);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      vehicleGroup.add(wheel);
    }

    scene.add(vehicleGroup);
  }

  function createHazmatSignTowers() {
    var towersGroup = new THREE.Group();
    var towerPositions = [
      { x: -40, z: 0 },
      { x: 40, z: 0 },
      { x: 0, z: -40 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var postGeom = new THREE.BoxGeometry(0.3, 5, 0.3);
      var post = new THREE.Mesh(postGeom, materials.metal);
      post.position.set(towerPositions[i].x, 2.5, towerPositions[i].z);
      post.castShadow = true;
      post.receiveShadow = true;
      towersGroup.add(post);
      objects.push(post);

      var lightGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var lightMat = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5
      });
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(towerPositions[i].x, 5.2, towerPositions[i].z);
      light.castShadow = true;
      light.receiveShadow = true;
      towersGroup.add(light);
      hazmatSigns.push({ mesh: light, material: lightMat });
    }

    scene.add(towersGroup);
  }

  function createHelicopterLanding() {
    var padGroup = new THREE.Group();
    var padX = -60;
    var padZ = 60;

    var padGeom = new THREE.BoxGeometry(20, 0.2, 20);
    var padMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var pad = new THREE.Mesh(padGeom, padMat);
    pad.position.set(padX, 0.1, padZ);
    pad.castShadow = true;
    pad.receiveShadow = true;
    padGroup.add(pad);
    objects.push(pad);

    var markerGeom = new THREE.BoxGeometry(0.5, 0.1, 15);
    var markerMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var markerH = new THREE.Mesh(markerGeom, markerMat);
    markerH.position.set(padX, 0.15, padZ);
    markerH.castShadow = true;
    markerH.receiveShadow = true;
    padGroup.add(markerH);

    var markerV = new THREE.Mesh(markerGeom, markerMat);
    markerV.rotation.y = Math.PI / 2;
    markerV.position.set(padX, 0.15, padZ);
    markerV.castShadow = true;
    markerV.receiveShadow = true;
    padGroup.add(markerV);

    scene.add(padGroup);
  }

  function createNegativePressureRoom() {
    var roomGroup = new THREE.Group();
    var roomX = 50;
    var roomZ = 35;

    var roomGeom = new THREE.BoxGeometry(5, 4, 5);
    var room = new THREE.Mesh(roomGeom, materials.plastic);
    room.position.set(roomX, 2, roomZ);
    room.castShadow = true;
    room.receiveShadow = true;
    roomGroup.add(room);
    objects.push(room);

    var fanGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var fanMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var fan = new THREE.Mesh(fanGeom, fanMat);
    fan.rotation.x = Math.PI / 2;
    fan.position.set(roomX, 4.2, roomZ);
    fan.castShadow = true;
    fan.receiveShadow = true;
    roomGroup.add(fan);
    hazmatFans.push({ mesh: fan, speed: 0.02 });

    var exhaustGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var exhaust = new THREE.Mesh(exhaustGeom, materials.metal);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(roomX, 5, roomZ);
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    roomGroup.add(exhaust);
    objects.push(exhaust);

    scene.add(roomGroup);
  }

  function createGreenZoneCheckpoint() {
    var checkpointGroup = new THREE.Group();
    var checkpointX = -60;
    var checkpointZ = 0;

    var scannerGeom = new THREE.BoxGeometry(3, 2.5, 0.5);
    var scannerMat = new THREE.MeshStandardMaterial({
      color: 0x00DD00,
      metalness: 0.6,
      roughness: 0.4
    });
    var scanner = new THREE.Mesh(scannerGeom, scannerMat);
    scanner.position.set(checkpointX, 1.25, checkpointZ);
    scanner.castShadow = true;
    scanner.receiveShadow = true;
    checkpointGroup.add(scanner);
    objects.push(scanner);

    var screenGeom = new THREE.BoxGeometry(2, 1.5, 0.1);
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
      emissiveIntensity: 0.3
    });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(checkpointX, 1.8, checkpointZ - 0.3);
    screen.castShadow = true;
    screen.receiveShadow = true;
    checkpointGroup.add(screen);

    scene.add(checkpointGroup);
  }

  function createMistParticles() {
    var mistGroup = new THREE.Group();
    var particleCount = 20;

    for (var i = 0; i < particleCount; i++) {
      var particleGeom = new THREE.SphereGeometry(0.15, 4, 4);
      var particle = new THREE.Mesh(particleGeom, materials.mist);
      particle.position.set(
        -20 + Math.random() * 10,
        2.5 + Math.random() * 0.5,
        40 + Math.random() * 3
      );
      mistGroup.add(particle);
      mist.push({
        mesh: particle,
        vx: (Math.random() - 0.5) * 0.02,
        vy: Math.random() * 0.01,
        startX: particle.position.x,
        startY: particle.position.y,
        startZ: particle.position.z,
        time: Math.random() * Math.PI * 2
      });
    }

    scene.add(mistGroup);
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    lights = [];
    hazmatLights = [];
    hazmatSigns = [];
    deconNozzles = [];
    hazmatFans = [];
    mist = [];
    barricadeLights = [];
    startTime = Date.now();

    createBarricadeLine();
    createDecontaminationCorridor();
    createShowerStation();
    createHazmatTent();
    createSealedBuilding();
    createAbandonedCars();
    createOverturnedFurniture();
    createBiohazardBarrels();
    createMedicalObservationPosts();
    createIsolationPods();
    createHospitalTent();
    createBodyBagArea();
    createPPEStorage();
    createSprayDeconVehicle();
    createHazmatSignTowers();
    createHelicopterLanding();
    createNegativePressureRoom();
    createGreenZoneCheckpoint();
    createMistParticles();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var hazmatLight = new THREE.PointLight(0xFF0000, 0.8, 100);
    hazmatLight.position.set(0, 10, 40);
    hazmatLight.castShadow = true;
    scene.add(hazmatLight);
    lights.push(hazmatLight);

    var checkpointLight = new THREE.PointLight(0x00DD00, 0.6, 80);
    checkpointLight.position.set(-60, 8, 0);
    checkpointLight.castShadow = true;
    scene.add(checkpointLight);
    lights.push(checkpointLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 40, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    lights.push(directionalLight);
  }

  function update(delta) {
    var elapsed = (Date.now() - startTime) * 0.001;

    for (var i = 0; i < hazmatSigns.length; i++) {
      var sign = hazmatSigns[i];
      var intensity = 0.3 + Math.sin(elapsed * 3) * 0.3;
      sign.material.emissiveIntensity = intensity;
    }

    for (var i = 0; i < deconNozzles.length; i++) {
      var nozzle = deconNozzles[i];
      nozzle.mesh.position.y = 2.8 + Math.sin(elapsed * 2) * 0.1;
    }

    for (var i = 0; i < hazmatFans.length; i++) {
      var fan = hazmatFans[i];
      fan.mesh.rotation.y += fan.speed;
    }

    for (var i = 0; i < mist.length; i++) {
      var particle = mist[i];
      particle.mesh.position.x += particle.vx;
      particle.mesh.position.y += particle.vy;
      particle.time += delta;
      if (particle.time > Math.PI * 2) {
        particle.time = 0;
        particle.mesh.position.x = particle.startX;
        particle.mesh.position.y = particle.startY;
      }
      particle.mesh.position.z = particle.startZ + Math.sin(particle.time) * 0.5;
    }

    if (lights.length > 1) {
      var barricadeIntensity = 0.5 + Math.sin(elapsed * 2.5) * 0.3;
      lights[1].intensity = barricadeIntensity;
    }
  }

  function reset() {
    startTime = Date.now();
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    objects = [];
    lights = [];
    hazmatLights = [];
    hazmatSigns = [];
    deconNozzles = [];
    hazmatFans = [];
    mist = [];
    barricadeLights = [];
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
