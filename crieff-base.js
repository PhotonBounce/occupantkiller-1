window.CrieffBase = (function() { 'use strict';

  var objects = [];
  var lights = [];
  var searchlightSphere = null;
  var searchlightAngle = 0;

  function createTownSquareBarricade(scene) {
    var material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var geometry = new THREE.BoxGeometry(30, 0.3, 30);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var distance = 14;
      var x = Math.cos(angle) * distance;
      var z = Math.sin(angle) * distance;
      var barrierGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
      var barrier = new THREE.Mesh(barrierGeo, barrierMaterial);
      barrier.position.set(x, 0.75, z);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      scene.add(barrier);
      objects.push(barrier);
    }
  }

  function createMarketCross(scene) {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

    var plinthGeo = new THREE.BoxGeometry(2, 0.6, 2);
    var plinth = new THREE.Mesh(plinthGeo, stoneMaterial);
    plinth.position.set(0, 0.3, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);
    objects.push(plinth);

    var pillarGeo = new THREE.BoxGeometry(1, 8, 1);
    var pillar = new THREE.Mesh(pillarGeo, stoneMaterial);
    pillar.position.set(0, 4.3, 0);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
    objects.push(pillar);

    var crossHorGeo = new THREE.BoxGeometry(3, 0.4, 0.4);
    var crossHor = new THREE.Mesh(crossHorGeo, stoneMaterial);
    crossHor.position.set(0, 8.5, 0);
    crossHor.castShadow = true;
    crossHor.receiveShadow = true;
    scene.add(crossHor);
    objects.push(crossHor);

    var crossVerGeo = new THREE.BoxGeometry(0.4, 2, 0.4);
    var crossVer = new THREE.Mesh(crossVerGeo, stoneMaterial);
    crossVer.position.set(0, 8.5, 0);
    crossVer.castShadow = true;
    crossVer.receiveShadow = true;
    scene.add(crossVer);
    objects.push(crossVer);
  }

  function createHighlandHotel(scene) {
    var victorianMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });

    var mainGeo = new THREE.BoxGeometry(22, 10, 16);
    var main = new THREE.Mesh(mainGeo, victorianMaterial);
    main.position.set(0, 5, -20);
    main.castShadow = true;
    main.receiveShadow = true;
    scene.add(main);
    objects.push(main);

    var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var turretPositions = [
      [11, 0, -8],
      [11, 0, -32],
      [-11, 0, -8],
      [-11, 0, -32]
    ];

    for (var i = 0; i < turretPositions.length; i++) {
      var pos = turretPositions[i];
      var turretGeo = new THREE.CylinderGeometry(2, 2, 14, 16);
      var turret = new THREE.Mesh(turretGeo, turretMaterial);
      turret.position.set(pos[0], 7, pos[2]);
      turret.castShadow = true;
      turret.receiveShadow = true;
      scene.add(turret);
      objects.push(turret);

      var capGeo = new THREE.ConeGeometry(2.2, 2.5, 16);
      var cap = new THREE.Mesh(capGeo, turretMaterial);
      cap.position.set(pos[0], 14.5, pos[2]);
      cap.castShadow = true;
      cap.receiveShadow = true;
      scene.add(cap);
      objects.push(cap);
    }
  }

  function createMilitaryVehicleDepot(scene) {
    var oliveMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5240 });

    var depotGeo = new THREE.BoxGeometry(20, 5, 15);
    var depot = new THREE.Mesh(depotGeo, oliveMaterial);
    depot.position.set(-18, 2.5, 10);
    depot.castShadow = true;
    depot.receiveShadow = true;
    scene.add(depot);
    objects.push(depot);

    var vehicleOutlineGeo = new THREE.BoxGeometry(3.5, 2, 7);
    var vehiclePositions = [
      [-20, 2.8, 8],
      [-20, 2.8, 15],
      [-16, 2.8, 8],
      [-16, 2.8, 15]
    ];

    var darkOliveMaterial = new THREE.MeshLambertMaterial({ color: 0x3a4230 });
    for (var i = 0; i < vehiclePositions.length; i++) {
      var pos = vehiclePositions[i];
      var vehicle = new THREE.Mesh(vehicleOutlineGeo, darkOliveMaterial);
      vehicle.position.set(pos[0], pos[1], pos[2]);
      vehicle.castShadow = true;
      vehicle.receiveShadow = true;
      scene.add(vehicle);
      objects.push(vehicle);
    }
  }

  function createDrummondCastle(scene) {
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x998877 });

    var towerGeo = new THREE.BoxGeometry(8, 16, 8);
    var tower = new THREE.Mesh(towerGeo, stoneMaterial);
    tower.position.set(25, 8, -15);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    var decorMaterial = new THREE.MeshLambertMaterial({ color: 0x776655 });
    var decorPositions = [
      [27.5, 15, -15],
      [22.5, 15, -15],
      [25, 15, -12.5],
      [25, 15, -17.5]
    ];

    for (var i = 0; i < decorPositions.length; i++) {
      var pos = decorPositions[i];
      var decorGeo = new THREE.BoxGeometry(1.2, 2, 1.2);
      var decor = new THREE.Mesh(decorGeo, decorMaterial);
      decor.position.set(pos[0], pos[1], pos[2]);
      decor.castShadow = true;
      decor.receiveShadow = true;
      scene.add(decor);
      objects.push(decor);
    }
  }

  function createArtilleryPark(scene) {
    var oliveMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });
    var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333322 });

    var howitzerPositions = [
      [-25, 0, -5],
      [-25, 0, 0],
      [-25, 0, 5]
    ];

    for (var i = 0; i < howitzerPositions.length; i++) {
      var pos = howitzerPositions[i];

      var bodyGeo = new THREE.BoxGeometry(2.5, 1.5, 4);
      var body = new THREE.Mesh(bodyGeo, oliveMaterial);
      body.position.set(pos[0], 0.75, pos[1]);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      var barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
      var barrel = new THREE.Mesh(barrelGeo, barrelMaterial);
      barrel.rotation.z = Math.PI / 6;
      barrel.position.set(pos[0], 1.2, pos[1]);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      scene.add(barrel);
      objects.push(barrel);
    }
  }

  function createCarBarricade(scene) {
    var carColors = [0x556677, 0x445566, 0x667788, 0x445577];
    var carPositions = [
      [-8, 0, 25],
      [-2, 0, 25],
      [4, 0, 25],
      [10, 0, 25]
    ];

    for (var i = 0; i < carPositions.length; i++) {
      var pos = carPositions[i];
      var carMaterial = new THREE.MeshLambertMaterial({ color: carColors[i] });
      var carGeo = new THREE.BoxGeometry(3, 1.5, 1.5);
      var car = new THREE.Mesh(carGeo, carMaterial);
      car.position.set(pos[0], pos[1] + 0.75, pos[2]);
      car.castShadow = true;
      car.receiveShadow = true;
      scene.add(car);
      objects.push(car);
    }
  }

  function createAmbientLighting(scene) {
    var ambientLight = new THREE.AmbientLight(0xFFCC88, 0.7);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  function createFloodlights(scene) {
    var floodlightPositions = [
      [15, 12, -8],
      [15, 12, -32],
      [-15, 12, -8],
      [-15, 12, -32]
    ];

    for (var i = 0; i < floodlightPositions.length; i++) {
      var pos = floodlightPositions[i];
      var light = new THREE.PointLight(0xFFFFFF, 1.0, 50);
      light.position.set(pos[0], pos[1], pos[2]);
      light.castShadow = true;
      scene.add(light);
      lights.push(light);
    }
  }

  function createSearchlight(scene) {
    var searchlightMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF99 });
    var searchlightGeo = new THREE.SphereGeometry(0.5, 8, 8);
    searchlightSphere = new THREE.Mesh(searchlightGeo, searchlightMaterial);
    searchlightSphere.position.set(0, 15, 0);
    searchlightSphere.castShadow = true;
    searchlightSphere.receiveShadow = true;
    scene.add(searchlightSphere);
    objects.push(searchlightSphere);
  }

  function update(delta) {
    if (searchlightSphere) {
      searchlightAngle += delta * 0.3;
      var radius = 15;
      searchlightSphere.position.x = Math.cos(searchlightAngle) * radius;
      searchlightSphere.position.z = Math.sin(searchlightAngle) * radius;
      searchlightSphere.position.y = 15 + Math.sin(searchlightAngle * 2) * 2;
    }
  }

  function reset(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    searchlightSphere = null;
    searchlightAngle = 0;
  }

  function init(scene) {
    createTownSquareBarricade(scene);
    createMarketCross(scene);
    createHighlandHotel(scene);
    createMilitaryVehicleDepot(scene);
    createDrummondCastle(scene);
    createArtilleryPark(scene);
    createCarBarricade(scene);
    createAmbientLighting(scene);
    createFloodlights(scene);
    createSearchlight(scene);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };

}());
