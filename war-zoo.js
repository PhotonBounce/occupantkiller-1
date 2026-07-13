window.WarZoo = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];
  var animatedObjects = [];
  var elapsedTime = 0;

  var materials = {
    concrete: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.1 }),
    rust: new THREE.MeshStandardMaterial({ color: 0x6b3e2e, roughness: 0.9, metalness: 0.3 }),
    warning: new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.6, metalness: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.05 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.3 }),
    gunmetal: new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.4, metalness: 0.95 }),
    camo: new THREE.MeshStandardMaterial({ color: 0x4a6b35, roughness: 0.8, metalness: 0.1 })
  };

  function createCageStructure(posX, posZ, width, height, depth) {
    var group = new THREE.Group();

    var barGeometry = new THREE.BoxGeometry(0.3, height, 0.3);
    var barMaterial = materials.gunmetal;

    var cornerPositions = [
      [posX - width/2, posZ - depth/2],
      [posX + width/2, posZ - depth/2],
      [posX + width/2, posZ + depth/2],
      [posX - width/2, posZ + depth/2]
    ];

    for (var i = 0; i < cornerPositions.length; i++) {
      var corner = cornerPositions[i];
      var bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(corner[0], height/2, corner[1]);
      group.add(bar);

      var topBar = cornerPositions[(i + 1) % cornerPositions.length];
      var barLength = Math.sqrt(Math.pow(topBar[0] - corner[0], 2) + Math.pow(topBar[1] - corner[1], 2));
      var midX = (corner[0] + topBar[0]) / 2;
      var midZ = (corner[1] + topBar[1]) / 2;
      var angle = Math.atan2(topBar[1] - corner[1], topBar[0] - corner[0]);

      var topBeam = new THREE.Mesh(new THREE.BoxGeometry(barLength, 0.4, 0.4), barMaterial);
      topBeam.position.set(midX, height - 0.3, midZ);
      topBeam.rotation.y = angle;
      group.add(topBeam);
    }

    var baseGeometry = new THREE.BoxGeometry(width + 2, 0.5, depth + 2);
    var base = new THREE.Mesh(baseGeometry, materials.concrete);
    base.position.set(posX, 0.25, posZ);
    group.add(base);

    return group;
  }

  function createObservationTower(posX, posZ) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(6, 1, 6);
    var base = new THREE.Mesh(baseGeometry, materials.concrete);
    base.position.set(posX, 0.5, posZ);
    group.add(base);

    var columnGeometry = new THREE.CylinderGeometry(1, 1.2, 20, 8);
    var column = new THREE.Mesh(columnGeometry, materials.rust);
    column.position.set(posX, 10, posZ);
    group.add(column);

    var platformGeometry = new THREE.BoxGeometry(10, 0.6, 10);
    var platform = new THREE.Mesh(platformGeometry, materials.dark);
    platform.position.set(posX, 20, posZ);
    group.add(platform);

    var radarGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    var radar = new THREE.Mesh(radarGeometry, materials.warning);
    radar.position.set(posX, 21.5, posZ);
    radar.name = 'radar';
    animatedObjects.push({ obj: radar, type: 'rotate' });
    group.add(radar);

    var railGeometry = new THREE.BoxGeometry(10.5, 1.2, 0.4);
    var rail = new THREE.Mesh(railGeometry, materials.gunmetal);
    rail.position.set(posX, 20.6, posZ + 5);
    group.add(rail);

    return group;
  }

  function createMunitionStorage(posX, posZ) {
    var group = new THREE.Group();

    var storageGeometry = new THREE.BoxGeometry(12, 8, 12);
    var storage = new THREE.Mesh(storageGeometry, materials.dark);
    storage.position.set(posX, 4, posZ);
    group.add(storage);

    var roofGeometry = new THREE.ConeGeometry(8, 4, 8);
    var roof = new THREE.Mesh(roofGeometry, materials.rust);
    roof.position.set(posX, 8.5, posZ);
    group.add(roof);

    var doorsGeometry = new THREE.BoxGeometry(3, 6, 0.3);
    var door1 = new THREE.Mesh(doorsGeometry, materials.camo);
    door1.position.set(posX - 3, 3, posZ + 6.1);
    group.add(door1);

    var door2 = new THREE.Mesh(doorsGeometry, materials.camo);
    door2.position.set(posX + 3, 3, posZ + 6.1);
    group.add(door2);

    return group;
  }

  function createBrokenAquarium(posX, posZ) {
    var group = new THREE.Group();

    var frameGeometry = new THREE.BoxGeometry(8, 6, 1);
    var frame = new THREE.Mesh(frameGeometry, materials.gunmetal);
    frame.position.set(posX, 3, posZ);
    group.add(frame);

    var glassGeometry = new THREE.BoxGeometry(7.5, 5.5, 0.1);
    var glass1 = new THREE.Mesh(glassGeometry, materials.glass);
    glass1.position.set(posX, 3, posZ + 0.5);
    group.add(glass1);

    var glass2 = new THREE.Mesh(glassGeometry, materials.glass);
    glass2.position.set(posX, 3, posZ - 0.5);
    group.add(glass2);

    var shardGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    for (var i = 0; i < 4; i++) {
      var offsetX = (i % 2) * 2 - 1;
      var offsetY = Math.floor(i / 2) * 2 - 1;
      var shard = new THREE.Mesh(shardGeometry, materials.glass);
      shard.position.set(posX + offsetX * 2, 3 + offsetY * 1.5, posZ + 1.5);
      shard.rotation.z = Math.random() * Math.PI * 0.3;
      group.add(shard);
    }

    return group;
  }

  function createMilitaryVehicleDepot(posX, posZ) {
    var group = new THREE.Group();

    var hangarGeometry = new THREE.BoxGeometry(20, 6, 15);
    var hangar = new THREE.Mesh(hangarGeometry, materials.camo);
    hangar.position.set(posX, 3, posZ);
    group.add(hangar);

    var turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
    var turret = new THREE.Mesh(turretGeometry, materials.rust);
    turret.position.set(posX - 5, 4, posZ - 4);
    group.add(turret);

    var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
    var barrel = new THREE.Mesh(barrelGeometry, materials.gunmetal);
    barrel.position.set(posX - 5, 5, posZ - 4);
    barrel.rotation.z = Math.PI / 6;
    group.add(barrel);

    for (var i = 0; i < 3; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 16);
      var wheel1 = new THREE.Mesh(wheelGeometry, materials.dark);
      wheel1.position.set(posX + 3 + i * 4, 1.2, posZ + 4);
      wheel1.rotation.z = Math.PI / 2;
      group.add(wheel1);
    }

    return group;
  }

  function createTrapMarkers(posX, posZ) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(3, 0.1, 3);
    var base = new THREE.Mesh(baseGeometry, materials.concrete);
    base.position.set(posX, 0.05, posZ);
    group.add(base);

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var offsetX = Math.cos(angle) * 2;
      var offsetZ = Math.sin(angle) * 2;

      var tapeGeometry = new THREE.BoxGeometry(3, 0.15, 0.2);
      var tape = new THREE.Mesh(tapeGeometry, materials.warning);
      tape.position.set(posX + offsetX, 0.1, posZ + offsetZ);
      tape.rotation.y = angle;
      group.add(tape);
    }

    return group;
  }

  function createJungleVegetation(posX, posZ) {
    var group = new THREE.Group();

    var trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
    var trunk = new THREE.Mesh(trunkGeometry, materials.rust);
    trunk.position.set(posX, 6, posZ);
    animatedObjects.push({ obj: trunk, type: 'sway' });
    group.add(trunk);

    var foliageGeometry = new THREE.SphereGeometry(5, 8, 8);
    var foliage = new THREE.Mesh(foliageGeometry, materials.camo);
    foliage.position.set(posX, 13, posZ);
    animatedObjects.push({ obj: foliage, type: 'sway' });
    group.add(foliage);

    var vinesGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var offsetX = Math.cos(angle) * 2;
      var offsetZ = Math.sin(angle) * 2;

      var vine = new THREE.Mesh(vinesGeometry, materials.camo);
      vine.position.set(posX + offsetX, 8, posZ + offsetZ);
      vine.rotation.z = Math.random() * 0.3;
      animatedObjects.push({ obj: vine, type: 'sway' });
      group.add(vine);
    }

    return group;
  }

  function createDefensiveWall(posX, posZ, length) {
    var group = new THREE.Group();

    var wallGeometry = new THREE.BoxGeometry(length, 4, 0.6);
    var wall = new THREE.Mesh(wallGeometry, materials.concrete);
    wall.position.set(posX, 2, posZ);
    group.add(wall);

    var brickCount = Math.floor(length / 1.5);
    for (var i = 0; i < brickCount; i++) {
      var offsetX = (i - brickCount/2) * 1.5;
      var brickGeometry = new THREE.BoxGeometry(1.3, 0.5, 0.5);
      var brick = new THREE.Mesh(brickGeometry, materials.rust);
      brick.position.set(posX + offsetX, 3, posZ);
      group.add(brick);
    }

    return group;
  }

  function createLightFixture(posX, posY, posZ) {
    var group = new THREE.Group();

    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, posY, 6);
    var pole = new THREE.Mesh(poleGeometry, materials.gunmetal);
    pole.position.set(posX, posY/2, posZ);
    group.add(pole);

    var headGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var head = new THREE.Mesh(headGeometry, materials.dark);
    head.position.set(posX, posY - 0.5, posZ);
    animatedObjects.push({ obj: head, type: 'flicker' });
    group.add(head);

    var light = new THREE.PointLight(0xffffcc, 0.8, 30);
    light.position.set(posX, posY, posZ);
    light.name = 'flickerLight';
    animatedObjects.push({ obj: light, type: 'flicker' });
    group.add(light);
    lights.push(light);

    return group;
  }

  function createAmmoPile(posX, posZ) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(4, 0.3, 4);
    var base = new THREE.Mesh(baseGeometry, materials.concrete);
    base.position.set(posX, 0.15, posZ);
    group.add(base);

    for (var i = 0; i < 3; i++) {
      var boxGeometry = new THREE.BoxGeometry(1.2, 1.5, 1.2);
      var box = new THREE.Mesh(boxGeometry, materials.warning);
      box.position.set(posX - 1 + i * 1, 0.75 + i * 0.5, posZ);
      group.add(box);
    }

    return group;
  }

  function createRadarDish(posX, posZ) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(1, 1.5, 2, 12);
    var base = new THREE.Mesh(baseGeometry, materials.gunmetal);
    base.position.set(posX, 1, posZ);
    group.add(base);

    var dishGeometry = new THREE.SphereGeometry(2.5, 12, 8);
    var dish = new THREE.Mesh(dishGeometry, materials.warning);
    dish.scale.set(1, 0.4, 1);
    dish.position.set(posX, 3.5, posZ);
    dish.name = 'radarDish';
    animatedObjects.push({ obj: dish, type: 'rotate' });
    group.add(dish);

    return group;
  }

  function createContaminationZone(posX, posZ) {
    var group = new THREE.Group();

    var containerGeometry = new THREE.BoxGeometry(5, 3, 5);
    var container = new THREE.Mesh(containerGeometry, materials.dark);
    container.position.set(posX, 1.5, posZ);
    group.add(container);

    var warningGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var offsetX = Math.cos(angle) * 2.8;
      var offsetZ = Math.sin(angle) * 2.8;

      var sign = new THREE.Mesh(warningGeometry, materials.warning);
      sign.position.set(posX + offsetX, 2, posZ + offsetZ);
      sign.rotation.y = angle;
      group.add(sign);
    }

    return group;
  }

  function createTerrainRubble(posX, posZ) {
    var group = new THREE.Group();

    for (var i = 0; i < 5; i++) {
      var scale = 0.5 + Math.random() * 0.5;
      var debris = new THREE.Mesh(
        new THREE.BoxGeometry(2 * scale, 1.5 * scale, 2 * scale),
        materials.concrete
      );

      var randX = posX + (Math.random() - 0.5) * 6;
      var randZ = posZ + (Math.random() - 0.5) * 6;
      debris.position.set(randX, 0.75 * scale, randZ);
      debris.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      group.add(debris);
    }

    return group;
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    scene.background = new THREE.Color(0x1a4d1a);
    scene.fog = new THREE.Fog(0x1a4d1a, 100, 200);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffddaa, 0.7);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    var groundGeometry = new THREE.BoxGeometry(80, 1, 80);
    var ground = new THREE.Mesh(groundGeometry, materials.concrete);
    ground.position.set(0, -0.5, 0);
    scene.add(ground);
    objects.push(ground);

    var cageOne = createCageStructure(-20, 20, 15, 6, 12);
    scene.add(cageOne);
    objects.push(cageOne);

    var cageTwo = createCageStructure(20, 20, 15, 6, 12);
    scene.add(cageTwo);
    objects.push(cageTwo);

    var tower = createObservationTower(0, -25);
    scene.add(tower);
    objects.push(tower);

    var munitions = createMunitionStorage(-30, -10);
    scene.add(munitions);
    objects.push(munitions);

    var aquarium = createBrokenAquarium(30, -10);
    scene.add(aquarium);
    objects.push(aquarium);

    var depot = createMilitaryVehicleDepot(0, 35);
    scene.add(depot);
    objects.push(depot);

    var trapOne = createTrapMarkers(-15, 0);
    scene.add(trapOne);
    objects.push(trapOne);

    var trapTwo = createTrapMarkers(15, 5);
    scene.add(trapTwo);
    objects.push(trapTwo);

    var vegOne = createJungleVegetation(-35, 0);
    scene.add(vegOne);
    objects.push(vegOne);

    var vegTwo = createJungleVegetation(35, 10);
    scene.add(vegTwo);
    objects.push(vegTwo);

    var wallOne = createDefensiveWall(-25, 35, 20);
    scene.add(wallOne);
    objects.push(wallOne);

    var wallTwo = createDefensiveWall(25, 35, 20);
    scene.add(wallTwo);
    objects.push(wallTwo);

    var light1 = createLightFixture(-30, 15, 30);
    scene.add(light1);
    objects.push(light1);

    var light2 = createLightFixture(30, 15, -30);
    scene.add(light2);
    objects.push(light2);

    var light3 = createLightFixture(0, 18, 0);
    scene.add(light3);
    objects.push(light3);

    var ammoPile = createAmmoPile(-20, -30);
    scene.add(ammoPile);
    objects.push(ammoPile);

    var radarDish = createRadarDish(35, 30);
    scene.add(radarDish);
    objects.push(radarDish);

    var contamination = createContaminationZone(-35, -35);
    scene.add(contamination);
    objects.push(contamination);

    var rubble1 = createTerrainRubble(0, 0);
    scene.add(rubble1);
    objects.push(rubble1);

    var rubble2 = createTerrainRubble(30, 30);
    scene.add(rubble2);
    objects.push(rubble2);
  }

  function update(delta) {
    elapsedTime += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var animated = animatedObjects[i];
      var obj = animated.obj;

      if (animated.type === 'sway') {
        var swayAmount = Math.sin(elapsedTime * 0.8 + i) * 0.02;
        obj.rotation.z = swayAmount;
        obj.rotation.x = Math.sin(elapsedTime * 0.6 + i * 0.5) * 0.01;
      }
      else if (animated.type === 'rotate') {
        obj.rotation.y += 0.015;
      }
      else if (animated.type === 'flicker') {
        if (obj.isLight) {
          var flicker = 0.7 + Math.sin(elapsedTime * 3 + i) * 0.15;
          obj.intensity = flicker;
        }
        else {
          var flickerScale = 1 + Math.sin(elapsedTime * 4 + i) * 0.08;
          obj.scale.set(1, flickerScale, 1);
        }
      }
    }
  }

  function reset() {
    elapsedTime = 0;
    objects = [];
    lights = [];
    animatedObjects = [];

    if (scene) {
      var objectsToRemove = [];
      scene.traverse(function(child) {
        if (child !== scene && child.parent === scene) {
          objectsToRemove.push(child);
        }
      });

      for (var i = 0; i < objectsToRemove.length; i++) {
        scene.remove(objectsToRemove[i]);
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
