window.UndergroundMarket = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lanterns = [];
  var waterDrops = [];
  var enforcers = [];
  var spotlights = [];
  var vats = [];
  var screens = [];
  var generator = null;
  var spawnPoints = [];
  var time = 0;
  var materials = {};

  function createMaterials() {
    materials.concrete = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.1,
      roughness: 0.8
    });

    materials.rust = new THREE.MeshStandardMaterial({
      color: 0x663333,
      metalness: 0.5,
      roughness: 0.7
    });

    materials.dimYellow = new THREE.MeshStandardMaterial({
      color: 0xcc9933,
      metalness: 0.3,
      roughness: 0.6,
      emissive: 0x663300
    });

    materials.darkGray = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.2,
      roughness: 0.9
    });

    materials.metalGray = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.3
    });

    materials.darkRed = new THREE.MeshStandardMaterial({
      color: 0x660000,
      metalness: 0.4,
      roughness: 0.6
    });

    materials.brass = new THREE.MeshStandardMaterial({
      color: 0xaa7722,
      metalness: 0.7,
      roughness: 0.4
    });

    materials.screenGlow = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.2,
      roughness: 0.5,
      emissive: 0x00aa00
    });

    materials.water = new THREE.MeshStandardMaterial({
      color: 0x224466,
      metalness: 0.6,
      roughness: 0.1
    });
  }

  function createWalls(x, y, z, width, height, depth) {
    var wallGeom = new THREE.BoxGeometry(width, height, depth);
    var wall = new THREE.Mesh(wallGeom, materials.concrete);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    meshes.push(wall);
    return wall;
  }

  function createLantern(x, y, z) {
    var sphereGeom = new THREE.SphereGeometry(0.4, 16, 16);
    var lantern = new THREE.Mesh(sphereGeom, materials.dimYellow);
    lantern.position.set(x, y, z);
    lantern.castShadow = true;
    lantern.originalIntensity = 2.5;
    scene.add(lantern);
    meshes.push(lantern);
    lanterns.push({
      mesh: lantern,
      baseIntensity: 2.5,
      x: x,
      y: y,
      z: z,
      phase: Math.random() * Math.PI * 2
    });
    return lantern;
  }

  function createMarketStall(x, y, z) {
    var tableGeom = new THREE.BoxGeometry(3, 1, 2);
    var table = new THREE.Mesh(tableGeom, materials.metalGray);
    table.position.set(x, y, z);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    meshes.push(table);

    var shelfGeom = new THREE.BoxGeometry(3, 2.5, 0.5);
    var shelf = new THREE.Mesh(shelfGeom, materials.darkGray);
    shelf.position.set(x, y + 2.5, z - 1.5);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);
    meshes.push(shelf);
  }

  function createCrate(x, y, z, w, h, d) {
    var crateGeom = new THREE.BoxGeometry(w, h, d);
    var crate = new THREE.Mesh(crateGeom, materials.darkRed);
    crate.position.set(x, y, z);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
    meshes.push(crate);
    return crate;
  }

  function createDocumentForgeryStation(x, y, z) {
    var deskGeom = new THREE.BoxGeometry(2.5, 0.8, 1.5);
    var desk = new THREE.Mesh(deskGeom, materials.metalGray);
    desk.position.set(x, y, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);
    meshes.push(desk);

    var equipGeom = new THREE.BoxGeometry(1.2, 1.2, 0.6);
    var equip = new THREE.Mesh(equipGeom, materials.darkGray);
    equip.position.set(x + 1.5, y + 1.2, z - 0.5);
    equip.castShadow = true;
    equip.receiveShadow = true;
    scene.add(equip);
    meshes.push(equip);

    var lampGeom = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    var lamp = new THREE.Mesh(lampGeom, materials.brass);
    lamp.position.set(x, y + 1.2, z);
    lamp.castShadow = true;
    scene.add(lamp);
    meshes.push(lamp);
  }

  function createWeaponsCache(x, y, z) {
    var rackGeom = new THREE.BoxGeometry(2, 3, 0.8);
    var rack = new THREE.Mesh(rackGeom, materials.metalGray);
    rack.position.set(x, y + 1.5, z);
    rack.castShadow = true;
    rack.receiveShadow = true;
    scene.add(rack);
    meshes.push(rack);

    for (var i = 0; i < 4; i++) {
      var gunGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8);
      var gun = new THREE.Mesh(gunGeom, materials.darkGray);
      gun.position.set(x - 0.6 + i * 0.4, y + 1.5 + i * 0.3, z + 0.5);
      gun.rotation.z = Math.PI * 0.3;
      gun.castShadow = true;
      scene.add(gun);
      meshes.push(gun);
    }

    var ammoBoxGeom = new THREE.BoxGeometry(1.5, 0.8, 1);
    var ammoBox = new THREE.Mesh(ammoBoxGeom, materials.darkRed);
    ammoBox.position.set(x, y + 0.4, z + 1.2);
    ammoBox.castShadow = true;
    scene.add(ammoBox);
    meshes.push(ammoBox);
  }

  function createDrugLab(x, y, z) {
    for (var i = 0; i < 3; i++) {
      var vatGeom = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 16);
      var vat = new THREE.Mesh(vatGeom, materials.metalGray);
      vat.position.set(x - 2 + i * 2, y + 0.75, z);
      vat.castShadow = true;
      vat.receiveShadow = true;
      scene.add(vat);
      meshes.push(vat);
      vats.push({
        mesh: vat,
        phase: Math.random() * Math.PI * 2,
        baseScale: 1
      });
    }

    var benchGeom = new THREE.BoxGeometry(5, 0.8, 1.2);
    var bench = new THREE.Mesh(benchGeom, materials.darkGray);
    bench.position.set(x, y, z - 2);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);
    meshes.push(bench);

    for (var j = 0; j < 4; j++) {
      var apparatusGeom = new THREE.BoxGeometry(0.6, 0.9, 0.5);
      var apparatus = new THREE.Mesh(apparatusGeom, materials.brass);
      apparatus.position.set(x - 1.5 + j * 1.2, y + 1, z - 2);
      apparatus.castShadow = true;
      scene.add(apparatus);
      meshes.push(apparatus);
    }
  }

  function createGuardStation(x, y, z) {
    var stationGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
    var station = new THREE.Mesh(stationGeom, materials.darkGray);
    station.position.set(x, y + 1.25, z);
    station.castShadow = true;
    station.receiveShadow = true;
    scene.add(station);
    meshes.push(station);

    var seatGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var seat = new THREE.Mesh(seatGeom, materials.darkRed);
    seat.position.set(x, y + 0.8, z);
    seat.castShadow = true;
    scene.add(seat);
    meshes.push(seat);

    var weaponGeom = new THREE.CylinderGeometry(0.08, 0.08, 1, 8);
    var weapon = new THREE.Mesh(weaponGeom, materials.metalGray);
    weapon.position.set(x + 0.8, y + 1.5, z);
    weapon.rotation.z = Math.PI * 0.2;
    weapon.castShadow = true;
    scene.add(weapon);
    meshes.push(weapon);
  }

  function createSurveillanceScreen(x, y, z) {
    var panelGeom = new THREE.BoxGeometry(1.5, 2, 0.2);
    var panel = new THREE.Mesh(panelGeom, materials.screenGlow);
    panel.position.set(x, y, z);
    panel.castShadow = true;
    scene.add(panel);
    meshes.push(panel);
    screens.push({
      mesh: panel,
      frame: 0,
      frameMax: 60
    });

    var standGeom = new THREE.BoxGeometry(1.5, 0.3, 0.5);
    var stand = new THREE.Mesh(standGeom, materials.metalGray);
    stand.position.set(x, y - 1.2, z);
    stand.castShadow = true;
    scene.add(stand);
    meshes.push(stand);
  }

  function createWaterDrop(x, y, z) {
    var dropGeom = new THREE.SphereGeometry(0.08, 8, 8);
    var drop = new THREE.Mesh(dropGeom, materials.water);
    drop.position.set(x, y, z);
    drop.castShadow = true;
    scene.add(drop);
    meshes.push(drop);
    waterDrops.push({
      mesh: drop,
      startY: y,
      fallSpeed: 2 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
      resetHeight: 0.5
    });
    return drop;
  }

  function createGeneratorRoom(x, y, z) {
    var generatorGeom = new THREE.BoxGeometry(1.5, 2, 1.5);
    generator = new THREE.Mesh(generatorGeom, materials.rust);
    generator.position.set(x, y + 1, z);
    generator.castShadow = true;
    generator.receiveShadow = true;
    generator.pulsePhase = 0;
    generator.baseIntensity = 1.5;
    scene.add(generator);
    meshes.push(generator);

    var exhaustGeom = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    var exhaust = new THREE.Mesh(exhaustGeom, materials.darkGray);
    exhaust.position.set(x + 1, y + 2.5, z);
    exhaust.castShadow = true;
    scene.add(exhaust);
    meshes.push(exhaust);

    var baseGeom = new THREE.BoxGeometry(2.5, 0.5, 2);
    var base = new THREE.Mesh(baseGeom, materials.metalGray);
    base.position.set(x, y, z);
    base.castShadow = true;
    scene.add(base);
    meshes.push(base);
  }

  function createCageCells(x, y, z) {
    var barGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var bar = new THREE.Mesh(barGeom, materials.metalGray);
        bar.position.set(x - 1.5 + i * 1, y + 1.25, z - 1.5 + j * 1);
        bar.castShadow = true;
        scene.add(bar);
        meshes.push(bar);
      }
    }

    var cellGeom = new THREE.BoxGeometry(3, 0.3, 3);
    var floor = new THREE.Mesh(cellGeom, materials.darkGray);
    floor.position.set(x, y, z);
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);
  }

  function createEscapeTunnel(x, y, z) {
    var length = 15;
    createWalls(x, y + 2, z, 2.5, 3, length);
    createWalls(x - 1.5, y, z, 0.3, 5, length);
    createWalls(x + 1.5, y, z, 0.3, 5, length);

    var floorGeom = new THREE.BoxGeometry(2.5, 0.3, length);
    var floor = new THREE.Mesh(floorGeom, materials.concrete);
    floor.position.set(x, y - 0.15, z);
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);
  }

  function createSpotlight(x, y, z, targetX, targetY, targetZ) {
    var lampGeom = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    var lamp = new THREE.Mesh(lampGeom, materials.brass);
    lamp.position.set(x, y, z);
    lamp.castShadow = true;
    scene.add(lamp);
    meshes.push(lamp);

    spotlights.push({
      lamp: lamp,
      x: x,
      y: y,
      z: z,
      targetX: targetX,
      targetY: targetY,
      targetZ: targetZ,
      angle: 0,
      speed: 1.5
    });
  }

  function createEnforcer(x, y, z, pathPoints) {
    var bodyGeom = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    var body = new THREE.Mesh(bodyGeom, materials.darkGray);
    body.position.set(x, y + 0.9, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    var headGeom = new THREE.SphereGeometry(0.3, 8, 8);
    var head = new THREE.Mesh(headGeom, materials.rust);
    head.position.set(x, y + 2.1, z);
    head.castShadow = true;
    scene.add(head);
    meshes.push(head);

    enforcers.push({
      body: body,
      head: head,
      x: x,
      y: y,
      z: z,
      pathPoints: pathPoints,
      pathIndex: 0,
      speed: 1.2
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lanterns = [];
    waterDrops = [];
    enforcers = [];
    spotlights = [];
    vats = [];
    screens = [];
    time = 0;

    createMaterials();

    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x666666, 0.6);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    createWalls(0, 2.5, 0, 20, 5, 25);
    createWalls(-3, 2.5, 0, 1, 5, 25);
    createWalls(3, 2.5, 0, 1, 5, 25);

    createMarketStall(-5, 0, -8);
    createMarketStall(5, 0, -8);
    createMarketStall(-5, 0, 2);
    createMarketStall(5, 0, 2);
    createMarketStall(0, 0, -12);

    createCrate(-7, 0.5, 5, 1.5, 2, 1.5);
    createCrate(-7, 0.5, 7, 1.5, 2, 1.5);
    createCrate(7, 0.5, 5, 1.5, 2, 1.5);
    createCrate(7, 0.5, 7, 1.5, 2, 1.5);

    createDocumentForgeryStation(-2, 0, 8);
    createWeaponsCache(4, 0, 10);
    createDrugLab(-5, 0, -2);
    createGuardStation(0, 0, -6);
    createGuardStation(8, 0, -3);

    createLantern(-6, 4, -10);
    createLantern(-6, 4, 0);
    createLantern(-6, 4, 8);
    createLantern(6, 4, -10);
    createLantern(6, 4, 0);
    createLantern(6, 4, 8);
    createLantern(0, 4, -12);
    createLantern(0, 4, 10);

    createSurveillanceScreen(-3.5, 3.5, -11);
    createSurveillanceScreen(3.5, 3.5, -11);

    createCageCells(-8, 0, -15);
    createGeneratorRoom(6, 0, -8);

    createEscapeTunnel(0, 0, 15);

    for (var i = 0; i < 4; i++) {
      createWaterDrop(-5, 4.8, -5 + i * 5);
      createWaterDrop(5, 4.8, -5 + i * 5);
    }

    createSpotlight(-4, 3, -10, -4, 1, -10);
    createSpotlight(4, 3, -10, 4, 1, -10);
    createSpotlight(0, 3, 8, 0, 1, 8);

    var enforcerPath1 = [{x: -6, z: -8}, {x: -6, z: 8}, {x: 6, z: 8}, {x: 6, z: -8}];
    var enforcerPath2 = [{x: -3, z: 0}, {x: 3, z: 0}];
    var enforcerPath3 = [{x: 0, z: -10}, {x: 0, z: 6}];

    createEnforcer(-6, 0, -8, enforcerPath1);
    createEnforcer(-3, 0, 0, enforcerPath2);
    createEnforcer(0, 0, -10, enforcerPath3);

    spawnPoints = [
      {x: -7, y: 1.5, z: -12},
      {x: 7, y: 1.5, z: -12},
      {x: -8, y: 1.5, z: 10},
      {x: 8, y: 1.5, z: 10},
      {x: 0, y: 1.5, z: 15}
    ];
  }

  function updateLanterns(delta) {
    for (var i = 0; i < lanterns.length; i++) {
      var lantern = lanterns[i];
      lantern.phase += delta * 2;
      var intensity = lantern.baseIntensity + Math.sin(lantern.phase) * 0.4;
      lantern.mesh.material.emissiveIntensity = intensity / 3;
    }
  }

  function updateWaterDrops(delta) {
    for (var i = 0; i < waterDrops.length; i++) {
      var drop = waterDrops[i];
      drop.mesh.position.y -= drop.fallSpeed * delta;

      if (drop.mesh.position.y < drop.resetHeight) {
        drop.mesh.position.y = drop.startY;
      }
    }
  }

  function updateEnforcers(delta) {
    for (var i = 0; i < enforcers.length; i++) {
      var enforcer = enforcers[i];
      var path = enforcer.pathPoints;
      var currentTarget = path[enforcer.pathIndex];

      var dx = currentTarget.x - enforcer.x;
      var dz = currentTarget.z - enforcer.z;
      var distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 0.5) {
        enforcer.pathIndex = (enforcer.pathIndex + 1) % path.length;
        currentTarget = path[enforcer.pathIndex];
      }

      var direction = Math.atan2(dz, dx);
      enforcer.x += Math.cos(direction) * enforcer.speed * delta;
      enforcer.z += Math.sin(direction) * enforcer.speed * delta;

      enforcer.body.position.x = enforcer.x;
      enforcer.body.position.z = enforcer.z;
      enforcer.head.position.x = enforcer.x;
      enforcer.head.position.z = enforcer.z;
    }
  }

  function updateSpotlights(delta) {
    for (var i = 0; i < spotlights.length; i++) {
      var spotlight = spotlights[i];
      spotlight.angle += spotlight.speed * delta;

      var radius = 2;
      var offsetX = Math.cos(spotlight.angle) * radius;
      var offsetZ = Math.sin(spotlight.angle) * radius;

      spotlight.lamp.position.x = spotlight.targetX + offsetX;
      spotlight.lamp.position.z = spotlight.targetZ + offsetZ;
    }
  }

  function updateVats(delta) {
    for (var i = 0; i < vats.length; i++) {
      var vat = vats[i];
      vat.phase += delta * 1.5;
      var scale = vat.baseScale + Math.sin(vat.phase) * 0.05;
      vat.mesh.scale.y = scale;
    }
  }

  function updateScreens(delta) {
    for (var i = 0; i < screens.length; i++) {
      var screen = screens[i];
      screen.frame += delta * 30;
      if (screen.frame > screen.frameMax) {
        screen.frame = 0;
      }

      var flicker = Math.random() > 0.7 ? 0.8 : 1;
      screen.mesh.material.emissiveIntensity = (0.5 + Math.sin(screen.frame / 10) * 0.3) * flicker;
    }
  }

  function updateGenerator(delta) {
    if (generator) {
      generator.pulsePhase += delta * 1.2;
      var pulse = 1 + Math.sin(generator.pulsePhase) * 0.1;
      generator.scale.set(pulse, pulse, pulse);
      generator.material.emissiveIntensity = (Math.sin(generator.pulsePhase) * 0.5 + 0.5) * 0.2;
    }
  }

  function update(delta) {
    time += delta;
    updateLanterns(delta);
    updateWaterDrops(delta);
    updateEnforcers(delta);
    updateSpotlights(delta);
    updateVats(delta);
    updateScreens(delta);
    updateGenerator(delta);
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    lanterns = [];
    waterDrops = [];
    enforcers = [];
    spotlights = [];
    vats = [];
    screens = [];
    generator = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() {
      return spawnPoints;
    }
  };
}());
