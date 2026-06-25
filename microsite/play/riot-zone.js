window.RiotZone = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = {
    fires: [],
    gasCloud: null,
    waterCannon: null,
    shieldWall: null,
    crowdBarricade: null
  };
  var fireTimers = {};
  var gasCloudTimer = 0;
  var waterCannonTimer = 0;
  var shieldWallTimer = 0;

  function createStreetIntersection() {
    var geometry = new THREE.BoxGeometry(120, 0.5, 120);
    var material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var street = new THREE.Mesh(geometry, material);
    street.position.y = -2;
    street.receiveShadow = true;
    scene.add(street);

    var crackGeometry = new THREE.BoxGeometry(30, 0.01, 80);
    var crackMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var crack1 = new THREE.Mesh(crackGeometry, crackMaterial);
    crack1.position.y = -1.5;
    scene.add(crack1);

    var crack2Geometry = new THREE.BoxGeometry(80, 0.01, 20);
    var crack2 = new THREE.Mesh(crack2Geometry, crackMaterial);
    crack2.position.y = -1.5;
    crack2.rotation.z = Math.PI / 6;
    scene.add(crack2);
  }

  function createBurningBus() {
    var busBodyGeometry = new THREE.BoxGeometry(12, 8, 30);
    var busMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    var busBody = new THREE.Mesh(busBodyGeometry, busMaterial);
    busBody.position.set(-50, 4, 0);
    busBody.rotation.z = 0.4;
    busBody.castShadow = true;
    busBody.receiveShadow = true;
    scene.add(busBody);

    var wheelGeometry = new THREE.CylinderGeometry(2.5, 2.5, 1, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(-50 + (i % 2 ? 4 : -4), 2, (i < 2 ? -10 : 10));
      wheel.rotation.y = Math.PI / 2;
      scene.add(wheel);
    }

    var fireGeometry = new THREE.SphereGeometry(3, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff3300,
      emissiveIntensity: 1.0
    });
    var fire1 = new THREE.Mesh(fireGeometry, fireMaterial);
    fire1.position.set(-50, 10, -8);
    fire1.scale.set(1.5, 2, 1.5);
    fire1.castShadow = true;
    scene.add(fire1);
    objects.fires.push({ mesh: fire1, intensity: 1.0 });
    fireTimers[fire1.uuid] = 0;

    var fire2 = new THREE.Mesh(fireGeometry, fireMaterial);
    fire2.position.set(-50, 10, 8);
    fire2.scale.set(1.5, 2, 1.5);
    scene.add(fire2);
    objects.fires.push({ mesh: fire2, intensity: 1.0 });
    fireTimers[fire2.uuid] = 0.3;

    var fire3 = new THREE.Mesh(fireGeometry, fireMaterial);
    fire3.position.set(-50, 14, 0);
    fire3.scale.set(2, 2.5, 2);
    scene.add(fire3);
    objects.fires.push({ mesh: fire3, intensity: 1.0 });
    fireTimers[fire3.uuid] = 0.15;
  }

  function createPoliceRiotLine() {
    var offsetX = 40;
    var rowLength = 8;
    var spacing = 6;

    for (var i = 0; i < rowLength; i++) {
      var shieldGeometry = new THREE.BoxGeometry(2.5, 4.5, 0.3);
      var shieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a3a52,
        transparent: true,
        opacity: 0.7,
        metalness: 0.6
      });
      var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.set(offsetX + i * spacing - rowLength * spacing / 2, 3, 50);
      shield.castShadow = true;
      scene.add(shield);
    }

    var officerGeometry = new THREE.BoxGeometry(1.2, 3, 1);
    var officerMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    for (var j = 0; j < rowLength; j++) {
      var officer = new THREE.Mesh(officerGeometry, officerMaterial);
      officer.position.set(offsetX + j * spacing - rowLength * spacing / 2, 1.5, 48);
      officer.castShadow = true;
      scene.add(officer);
    }

    objects.shieldWall = {
      shields: [],
      baseX: offsetX
    };
  }

  function createWaterCannonTruck() {
    var truckBodyGeometry = new THREE.BoxGeometry(6, 5, 14);
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    var truckBody = new THREE.Mesh(truckBodyGeometry, truckMaterial);
    truckBody.position.set(35, 2.5, -40);
    truckBody.castShadow = true;
    scene.add(truckBody);

    var cabGeometry = new THREE.BoxGeometry(5, 4, 4);
    var cab = new THREE.Mesh(cabGeometry, truckMaterial);
    cab.position.set(35, 2.5, -45);
    scene.add(cab);

    var cannonGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
    var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.position.set(35, 5, -38);
    cannon.rotation.z = Math.PI / 3;
    cannon.castShadow = true;
    scene.add(cannon);

    var wheelGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.8, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(35 + (i % 2 ? 2 : -2), 1.8, -40 + (i < 2 ? -6 : 6));
      wheel.rotation.x = Math.PI / 2;
      scene.add(wheel);
    }

    objects.waterCannon = {
      nozzle: cannon,
      position: new THREE.Vector3(35, 5, -38),
      particles: []
    };
  }

  function createCrowdBarricade() {
    var carGeometry = new THREE.BoxGeometry(8, 3.5, 4);
    var carMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    var car1 = new THREE.Mesh(carGeometry, carMaterial);
    car1.position.set(-30, 2, -30);
    car1.rotation.z = 0.3;
    car1.castShadow = true;
    scene.add(car1);

    var car2 = new THREE.Mesh(carGeometry, carMaterial);
    car2.position.set(-22, 2, -28);
    car2.rotation.z = -0.25;
    scene.add(car2);

    var debrisGeometry = new THREE.BoxGeometry(4, 2, 6);
    var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x664400 });
    var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris.position.set(-26, 1.5, -35);
    debris.rotation.z = 0.6;
    scene.add(debris);

    objects.crowdBarricade = { mesh: car1 };
  }

  function createLootedStorefront() {
    var buildingGeometry = new THREE.BoxGeometry(20, 12, 6);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-50, 6, 30);
    building.castShadow = true;
    scene.add(building);

    var windowGeometry = new THREE.BoxGeometry(18, 8, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(-50, 5, 33);
    scene.add(window);

    var glassShardGeometry = new THREE.BoxGeometry(0.8, 0.5, 1.2);
    var glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.5,
      metalness: 0.3
    });
    for (var i = 0; i < 12; i++) {
      var shard = new THREE.Mesh(glassShardGeometry, glassMaterial);
      shard.position.set(-50 + (Math.random() - 0.5) * 15, 2 + Math.random() * 2, 30 + Math.random() * 4);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(shard);
    }

    var goodGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    var goodMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    for (var j = 0; j < 8; j++) {
      var good = new THREE.Mesh(goodGeometry, goodMaterial);
      good.position.set(-50 + (Math.random() - 0.5) * 12, 0.8 + Math.random() * 1, 25 + Math.random() * 8);
      scene.add(good);
    }
  }

  function createBurningDumpster() {
    var dumpsterGeometry = new THREE.CylinderGeometry(2, 2.2, 3.5, 16);
    var dumpsterMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var dumpster = new THREE.Mesh(dumpsterGeometry, dumpsterMaterial);
    dumpster.position.set(20, 1.75, -50);
    dumpster.castShadow = true;
    scene.add(dumpster);

    var fireGeometry = new THREE.SphereGeometry(2, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 1.0
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(20, 5, -50);
    fire.scale.set(1.8, 2.2, 1.8);
    scene.add(fire);
    objects.fires.push({ mesh: fire, intensity: 1.0 });
    fireTimers[fire.uuid] = 0.5;
  }

  function createTearGasCanister() {
    var canisterGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8);
    var canisterMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (var i = 0; i < 5; i++) {
      var canister = new THREE.Mesh(canisterGeometry, canisterMaterial);
      canister.position.set(-20 + i * 8, 0.6, 35 + (Math.random() - 0.5) * 4);
      scene.add(canister);
    }
  }

  function createBrokenGlassScatter() {
    var glassGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.8);
    var glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x5599ff,
      transparent: true,
      opacity: 0.6
    });
    for (var i = 0; i < 20; i++) {
      var glass = new THREE.Mesh(glassGeometry, glassMaterial);
      glass.position.set((Math.random() - 0.5) * 60, 0.2, (Math.random() - 0.5) * 60);
      glass.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(glass);
    }
  }

  function createGraffitiWalls() {
    var wallGeometry = new THREE.BoxGeometry(25, 10, 0.4);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(-60, 5, 50);
    scene.add(wall1);

    var splashGeometry = new THREE.BoxGeometry(20, 8, 0.1);
    var splashMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var splash1 = new THREE.Mesh(splashGeometry, splashMaterial);
    splash1.position.set(-60, 5, 50.1);
    scene.add(splash1);

    var splash2Material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    var splash2 = new THREE.Mesh(splashGeometry, splash2Material);
    splash2.position.set(-60, 2, 50.2);
    scene.add(splash2);

    var wall2Geometry = new THREE.BoxGeometry(22, 9, 0.4);
    var wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(55, 4.5, 0);
    scene.add(wall2);

    var splash3Material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    var splash3 = new THREE.Mesh(splashGeometry, splash3Material);
    splash3.position.set(55, 4.5, 0.2);
    scene.add(splash3);
  }

  function createTrafficLightPole() {
    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(60, 4, 30);
    pole.rotation.z = 0.5;
    pole.castShadow = true;
    scene.add(pole);

    var lightGeometry = new THREE.BoxGeometry(1.5, 4.5, 1);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(62, 7, 30);
    scene.add(light);
  }

  function createProtestSigns() {
    var signGeometry = new THREE.BoxGeometry(6, 8, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    for (var i = 0; i < 3; i++) {
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(-35 + i * 12, 5, 55);
      sign.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(sign);
    }
  }

  function createMolotovFireSpot() {
    var fireGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff2200,
      emissiveIntensity: 0.9
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(0, 2.5, -60);
    fire.scale.set(2, 1.5, 2);
    scene.add(fire);
    objects.fires.push({ mesh: fire, intensity: 1.0 });
    fireTimers[fire.uuid] = 0.7;

    var bottleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var bottleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
    bottle.position.set(0, 1.5, -60);
    scene.add(bottle);
  }

  function createPoliceAPC() {
    var bodyGeometry = new THREE.BoxGeometry(6, 4.5, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2a3a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(50, 2.25, 40);
    body.castShadow = true;
    scene.add(body);

    var turretGeometry = new THREE.BoxGeometry(3.5, 2.5, 3.5);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x0a1a2a });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(50, 4.5, 40);
    scene.add(turret);

    var cannonGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    var cannon = new THREE.Mesh(cannonGeometry, bodyMaterial);
    cannon.position.set(50, 4.5, 44);
    cannon.rotation.x = Math.PI / 6;
    scene.add(cannon);

    var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(50 + (i % 2 ? 2 : -2), 1.5, 40 + (i < 2 ? -4 : 4));
      wheel.rotation.z = Math.PI / 2;
      scene.add(wheel);
    }
  }

  function createCrowdControlWire() {
    var wireGeometry = new THREE.BufferGeometry();
    var positions = new Float32Array([
      -40, 2.5, 40,
      -40, 2.5, 50,
      30, 2.5, 40,
      30, 2.5, 50,
      -40, 4.5, 40,
      -40, 4.5, 50
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
  }

  function createGasCloudWisps() {
    var cloudGeometry = new THREE.SphereGeometry(4, 8, 8);
    var cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(-20, 3, 45);
    scene.add(cloud);
    objects.gasCloud = cloud;
  }

  function createConcreteBarriers() {
    var barrierGeometry = new THREE.BoxGeometry(4, 1.8, 2.5);
    var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    for (var i = 0; i < 6; i++) {
      var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(-60 + i * 20, 0.9, 0);
      barrier.castShadow = true;
      scene.add(barrier);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    createStreetIntersection();
    createBurningBus();
    createPoliceRiotLine();
    createWaterCannonTruck();
    createCrowdBarricade();
    createLootedStorefront();
    createBurningDumpster();
    createTearGasCanister();
    createBrokenGlassScatter();
    createGraffitiWalls();
    createTrafficLightPole();
    createProtestSigns();
    createMolotovFireSpot();
    createPoliceAPC();
    createCrowdControlWire();
    createGasCloudWisps();
    createConcreteBarriers();
  }

  function update(delta) {
    if (!scene) return;

    for (var i = 0; i < objects.fires.length; i++) {
      var fire = objects.fires[i];
      var uuid = fire.mesh.uuid;
      fireTimers[uuid] = (fireTimers[uuid] || 0) + delta;

      var flicker = Math.sin(fireTimers[uuid] * 8) * 0.15 + 0.85;
      var baseScale = 1;
      if (fire.mesh.position.z < -40) baseScale = 2;
      else if (fire.mesh.position.z > 20) baseScale = 1.5;

      fire.mesh.scale.x = baseScale * 1.5 * flicker;
      fire.mesh.scale.y = baseScale * 2 * flicker;
      fire.mesh.scale.z = baseScale * 1.5 * flicker;

      var colorFlicker = Math.sin(fireTimers[uuid] * 12) * 0.2 + 0.8;
      fire.mesh.material.emissiveIntensity = colorFlicker;
    }

    if (objects.gasCloud) {
      gasCloudTimer += delta;
      var cloudDrift = Math.sin(gasCloudTimer * 0.5) * 2;
      objects.gasCloud.position.x = -20 + cloudDrift;
      objects.gasCloud.position.y = 3 + Math.sin(gasCloudTimer * 0.3) * 0.5;
      var cloudExpand = 1 + Math.sin(gasCloudTimer * 0.4) * 0.2;
      objects.gasCloud.scale.set(cloudExpand, cloudExpand, cloudExpand);
    }

    if (objects.waterCannon) {
      waterCannonTimer += delta;
      if (waterCannonTimer > 0.1) {
        var spray = {
          x: objects.waterCannon.position.x + Math.cos(waterCannonTimer * 3) * 1,
          y: objects.waterCannon.position.y + Math.sin(waterCannonTimer * 2.5),
          z: objects.waterCannon.position.z + 2 + Math.sin(waterCannonTimer * 2) * 0.5
        };
      }
    }

    if (objects.shieldWall) {
      shieldWallTimer += delta;
      var advance = Math.sin(shieldWallTimer * 0.3) * 0.5;
      if (scene.children) {
        for (var j = 0; j < scene.children.length; j++) {
          var child = scene.children[j];
          if (child.geometry && child.geometry instanceof THREE.BoxGeometry &&
              Math.abs(child.position.z - 50) < 0.1 &&
              Math.abs(child.position.x - objects.shieldWall.baseX) < 40) {
            child.position.z = 50 - advance;
          }
        }
      }
    }
  }

  function reset() {
    fireTimers = {};
    gasCloudTimer = 0;
    waterCannonTimer = 0;
    shieldWallTimer = 0;
    for (var i = 0; i < objects.fires.length; i++) {
      objects.fires[i].mesh.scale.set(1, 1, 1);
    }
    if (objects.gasCloud) {
      objects.gasCloud.position.set(-20, 3, 45);
      objects.gasCloud.scale.set(1, 1, 1);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
