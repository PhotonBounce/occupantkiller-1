window.HarborDefense = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];

  function createDockPier(scene) {
    var group = new THREE.Group();
    var plankGeometry = new THREE.BoxGeometry(60, 1, 6);
    var plankMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914 });

    for (var i = 0; i < 5; i++) {
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.set(0, 0.5 + i * 1.2, i * 8);
      group.add(plank);
    }

    scene.add(group);
    objects.push(group);
    return group;
  }

  function createLighthouse(scene) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(8, 10, 2, 32);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    group.add(base);

    var towerGeometry = new THREE.CylinderGeometry(6, 6, 50, 32);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 26;
    group.add(tower);

    var beaconGeometry = new THREE.CylinderGeometry(5, 5, 8, 32);
    var beaconMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.y = 55;
    group.add(beacon);

    var lightGeometry = new THREE.SphereGeometry(4, 16, 16);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFF8800 });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 58;
    group.add(light);
    beacon.userData.beaconLight = light;

    group.position.set(-80, 0, -100);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: beacon, type: 'beacon' });
    return group;
  }

  function createNavalPatrolBoat(scene, x, z) {
    var group = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(12, 4, 30, 1, 1, 1);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x2E4A2E });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 2;
    group.add(hull);

    var superstructureGeometry = new THREE.BoxGeometry(8, 6, 12);
    var superstructureMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial);
    superstructure.position.set(0, 6, -5);
    group.add(superstructure);

    var turretGeometry = new THREE.CylinderGeometry(2, 2, 1, 16);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x2E4A2E });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.set(0, 8, -8);
    group.add(turret);
    turret.userData.gunTurret = true;

    var gunGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
    var gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.rotation.z = Math.PI / 2;
    gun.position.set(5, 8, -8);
    group.add(gun);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: turret, type: 'turret' });
    return group;
  }

  function createDefenseTurret(scene, x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(5, 6, 3, 32);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.5;
    group.add(base);

    var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 20, 16);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 6;
    barrel.position.set(8, 5, 0);
    group.add(barrel);
    barrel.userData.turretBarrel = true;

    var mountGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
    var mountMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var mount = new THREE.Mesh(mountGeometry, mountMaterial);
    mount.position.y = 3;
    group.add(mount);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: barrel, type: 'defense' });
    return group;
  }

  function createFuelDepot(scene, x, z) {
    var group = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var tankGeometry = new THREE.CylinderGeometry(6, 6, 16, 32);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0xAA3333 });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(i * 14 - 20, 8, 0);
      group.add(tank);
    }

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createCargoCrane(scene, x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(8, 2, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x886644 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    group.add(base);

    var pillarGeometry = new THREE.CylinderGeometry(2, 2, 40, 16);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x886644 });
    var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 21;
    group.add(pillar);

    var armGeometry = new THREE.BoxGeometry(50, 2, 3);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x886644 });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(20, 41, 0);
    group.add(arm);

    var cableGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var cable = new THREE.Mesh(cableGeometry, cableMaterial);
    cable.position.set(35, 25, 0);
    group.add(cable);
    cable.userData.cableHook = true;

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: cable, type: 'cable' });
    return group;
  }

  function createAmmoBunker(scene, x, z) {
    var group = new THREE.Group();

    var roofGeometry = new THREE.BoxGeometry(16, 2, 20);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 8;
    group.add(roof);

    var wallGeometry = new THREE.BoxGeometry(16, 6, 20);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 3;
    group.add(wall);

    var doorGeometry = new THREE.BoxGeometry(4, 5, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-2, 3.5, 10.25);
    group.add(door);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createGuardTower(scene, x, z) {
    var group = new THREE.Group();

    var leg1Geometry = new THREE.BoxGeometry(1.5, 25, 1.5);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var leg1 = new THREE.Mesh(leg1Geometry, legMaterial);
    leg1.position.set(-3, 12.5, -3);
    group.add(leg1);

    var leg2 = new THREE.Mesh(leg1Geometry, legMaterial);
    leg2.position.set(3, 12.5, -3);
    group.add(leg2);

    var leg3 = new THREE.Mesh(leg1Geometry, legMaterial);
    leg3.position.set(-3, 12.5, 3);
    group.add(leg3);

    var leg4 = new THREE.Mesh(leg1Geometry, legMaterial);
    leg4.position.set(3, 12.5, 3);
    group.add(leg4);

    var platformGeometry = new THREE.BoxGeometry(10, 2, 10);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x775555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 26;
    group.add(platform);

    var railGeometry = new THREE.BoxGeometry(10, 1.5, 0.3);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(0, 27.5, 5.15);
    group.add(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(0, 27.5, -5.15);
    group.add(rail2);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createSeaMine(scene, x, z) {
    var group = new THREE.Group();

    var coreGeometry = new THREE.SphereGeometry(3, 12, 12);
    var coreMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    core.userData.mineBob = true;

    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i;
      var spikeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
      var spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

      spike.position.set(
        Math.cos(angle) * 4,
        Math.sin(angle) * 4,
        Math.sin(angle * 2) * 3
      );
      spike.lookAt(core.position);
      group.add(spike);
    }

    group.position.set(x, 2, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: core, type: 'mine' });
    return group;
  }

  function createRadarDish(scene, x, z) {
    var group = new THREE.Group();

    var poleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 30, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 15;
    group.add(pole);

    var dishGeometry = new THREE.BoxGeometry(18, 1, 18);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = 32;
    group.add(dish);
    dish.userData.radarDish = true;

    var bossGeometry = new THREE.CylinderGeometry(2, 2, 2, 16);
    var bossMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var boss = new THREE.Mesh(bossGeometry, bossMaterial);
    boss.position.y = 32;
    group.add(boss);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: dish, type: 'radar' });
    return group;
  }

  function createSandbagWall(scene, x, z) {
    var group = new THREE.Group();

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 3; j++) {
        var bagGeometry = new THREE.BoxGeometry(2, 1, 1.5);
        var bagMaterial = new THREE.MeshStandardMaterial({ color: 0xC2A060 });
        var bag = new THREE.Mesh(bagGeometry, bagMaterial);
        bag.position.set(i * 2.2 - 5.5, 0.5 + j * 1, 0);
        group.add(bag);
      }
    }

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createShipWreckage(scene, x, z) {
    var group = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(20, 8, 40);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.rotation.z = Math.PI / 12;
    hull.position.y = 3;
    group.add(hull);

    var section1Geometry = new THREE.BoxGeometry(8, 5, 15);
    var sectionMaterial = new THREE.MeshStandardMaterial({ color: 0x3A3A3A });
    var section1 = new THREE.Mesh(section1Geometry, sectionMaterial);
    section1.position.set(-8, 4, -10);
    section1.rotation.z = Math.PI / 8;
    group.add(section1);

    var section2Geometry = new THREE.BoxGeometry(6, 4, 12);
    var section2 = new THREE.Mesh(section2Geometry, sectionMaterial);
    section2.position.set(10, 2, 15);
    section2.rotation.z = -Math.PI / 6;
    group.add(section2);

    var mast = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 25, 8), new THREE.MeshStandardMaterial({ color: 0x8B6914 }));
    mast.position.set(0, 16, 0);
    mast.rotation.z = Math.PI / 4;
    group.add(mast);

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    return group;
  }

  function createFlareStation(scene, x, z) {
    var group = new THREE.Group();

    var baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    group.add(base);

    var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 12);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 8;
    group.add(pole);

    var flareGeometry = new THREE.SphereGeometry(1.5, 12, 12);
    var flareMaterial = new THREE.MeshStandardMaterial({ color: 0xFF2200, emissive: 0xFF2200 });
    var flare = new THREE.Mesh(flareGeometry, flareMaterial);
    flare.position.y = 14;
    group.add(flare);
    flare.userData.flareLight = true;

    group.position.set(x, 0, z);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: flare, type: 'flare' });
    return group;
  }

  function createWaterSurface(scene) {
    var group = new THREE.Group();

    var waterGeometry = new THREE.BoxGeometry(200, 1, 200);
    var waterMaterial = new THREE.MeshStandardMaterial({ color: 0x1E90FF, roughness: 0.4 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, -1, 0);
    group.add(water);
    water.userData.waterSurface = true;

    group.position.set(0, 0, 0);
    scene.add(group);
    objects.push(group);
    animatedObjects.push({ obj: water, type: 'water' });
    return group;
  }

  function init(scene, camera) {
    createDockPier(scene);
    createLighthouse(scene);
    createNavalPatrolBoat(scene, 30, -50);
    createNavalPatrolBoat(scene, -40, -60);
    createDefenseTurret(scene, 50, 20);
    createDefenseTurret(scene, -50, 30);
    createFuelDepot(scene, 70, 0);
    createCargoCrane(scene, -60, 50);
    createAmmoBunker(scene, 0, 80);
    createGuardTower(scene, 45, 70);
    createGuardTower(scene, -45, 75);
    createSeaMine(scene, 20, -100);
    createSeaMine(scene, -20, -120);
    createRadarDish(scene, -80, 40);
    createSandbagWall(scene, 60, 60);
    createShipWreckage(scene, 0, -80);
    createFlareStation(scene, 35, -30);
    createWaterSurface(scene);
  }

  function update(delta) {
    var i;

    for (i = 0; i < animatedObjects.length; i++) {
      var item = animatedObjects[i];

      if (item.type === 'beacon') {
        item.obj.rotation.y += delta * 2;
      } else if (item.type === 'turret') {
        item.obj.rotation.z += Math.sin(Date.now() * 0.0005) * delta * 0.5;
      } else if (item.type === 'defense') {
        var angle = Math.sin(Date.now() * 0.0003) * 0.3;
        item.obj.rotation.z = Math.PI / 6 + angle;
      } else if (item.type === 'cable') {
        item.obj.scale.y = 1 + Math.sin(Date.now() * 0.0008) * 0.1;
      } else if (item.type === 'radar') {
        item.obj.rotation.y += delta * 1.5;
      } else if (item.type === 'mine') {
        var bobOffset = Math.sin(Date.now() * 0.0006) * 0.8;
        item.obj.parent.position.y = 2 + bobOffset;
      } else if (item.type === 'flare') {
        var flareIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.7;
        item.obj.material.emissiveIntensity = flareIntensity;
      } else if (item.type === 'water') {
        var waterScale = 1 + Math.sin(Date.now() * 0.0004) * 0.02;
        item.obj.scale.set(waterScale, 1, waterScale);
      }
    }
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      objects[i].parent.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
