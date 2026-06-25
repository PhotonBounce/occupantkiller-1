window.TundraOutpost = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var snowParticles = [];
  var radarDish = null;
  var generatorLight = null;
  var searchlight = null;
  var searchlightTarget = 0;
  var flagPole = null;
  var snowmobiles = [];
  var spetsnazEnemies = [];
  var time = 0;

  var colors = {
    snowWhite: 0xF0F4FF,
    arcticBlue: 0x88AABB,
    militaryGreen: 0x3D5A3D,
    radarGray: 0x888899,
    fuelRed: 0xCC2222,
    warningOrange: 0xFF6600,
    black: 0x000000,
    darkGray: 0x444444
  };

  function createBarracksBuilding(x, y, z, width, depth) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var bodyGeometry = new THREE.BoxGeometry(width, 4, depth);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    group.add(body);
    meshes.push(body);

    var roofGeometry = new THREE.BoxGeometry(width, 2.5, depth);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: colors.snowWhite });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5.2;
    roof.rotation.z = 0.3;
    group.add(roof);
    meshes.push(roof);

    var doorGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: colors.black });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(width / 2 - 1, 2, depth / 2 + 0.1);
    group.add(door);
    meshes.push(door);

    var windowGeometry = new THREE.BoxGeometry(1, 1, 0.1);
    var windowMaterial = new THREE.MeshLambertMaterial({ color: colors.arcticBlue });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-width / 4, 3, depth / 2 + 0.1);
    group.add(window1);
    meshes.push(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(width / 4, 3, depth / 2 + 0.1);
    group.add(window2);
    meshes.push(window2);

    return group;
  }

  function createRadarDish(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 16);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 6;
    group.add(pole);
    meshes.push(pole);

    var baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);
    meshes.push(base);

    var dishGroup = new THREE.Group();
    dishGroup.position.y = 12;

    var dishGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    var dishMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.rotation.x = 0.5;
    dishGroup.add(dish);
    meshes.push(dish);

    group.add(dishGroup);
    radarDish = dishGroup;

    return group;
  }

  function createFuelDrums(x, y, z, count) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    for (var i = 0; i < count; i++) {
      var drumGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
      var drumMaterial = new THREE.MeshLambertMaterial({ color: colors.fuelRed });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);

      var offsetX = (i % 2) * 2;
      var offsetZ = Math.floor(i / 2) * 2;
      drum.position.set(offsetX - 0.8, 1, offsetZ - 2);

      group.add(drum);
      meshes.push(drum);

      var stripGeometry = new THREE.BoxGeometry(1.6, 0.3, 0.1);
      var stripMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
      var strip = new THREE.Mesh(stripGeometry, stripMaterial);
      strip.position.set(offsetX - 0.8, 1.5, offsetZ - 2 + 0.8);
      group.add(strip);
      meshes.push(strip);
    }

    return group;
  }

  function createSnowmobile(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var bodyGeometry = new THREE.BoxGeometry(1.5, 1.2, 3.5);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    group.add(body);
    meshes.push(body);

    var cabinGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var cabinMaterial = new THREE.MeshLambertMaterial({ color: colors.arcticBlue });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.8, -0.5);
    group.add(cabin);
    meshes.push(cabin);

    for (var i = 0; i < 2; i++) {
      var skiGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
      var skiMaterial = new THREE.MeshLambertMaterial({ color: colors.snowWhite });
      var ski = new THREE.Mesh(skiGeometry, skiMaterial);
      ski.rotation.z = Math.PI / 2;
      ski.position.set((i === 0 ? -0.7 : 0.7), 0.3, 0.5);
      group.add(ski);
      meshes.push(ski);
    }

    for (var j = 0; j < 2; j++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
      var wheelMaterial = new THREE.MeshLambertMaterial({ color: colors.black });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set((j === 0 ? -0.6 : 0.6), 0.5, -1.5);
      group.add(wheel);
      meshes.push(wheel);
    }

    return group;
  }

  function createSandbagRing(x, y, z, radius, bagCount) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    for (var i = 0; i < bagCount; i++) {
      var angle = (i / bagCount) * Math.PI * 2;
      var bagX = Math.cos(angle) * radius;
      var bagZ = Math.sin(angle) * radius;

      var bagGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.4);
      var bagMaterial = new THREE.MeshLambertMaterial({ color: colors.militaryGreen });
      var bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(bagX, 0.3, bagZ);
      bag.rotation.y = angle;
      group.add(bag);
      meshes.push(bag);
    }

    return group;
  }

  function createFlagPole(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 12);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 4;
    group.add(pole);
    meshes.push(pole);

    var flagGeometry = new THREE.BoxGeometry(1.5, 1, 0.02);
    var flagMaterial = new THREE.MeshLambertMaterial({ color: colors.fuelRed });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.8, 7.2, 0);
    flagPole = flag;
    group.add(flag);
    meshes.push(flag);

    return group;
  }

  function createGeneratorBuilding(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var boxGeometry = new THREE.BoxGeometry(3, 2.5, 2);
    var boxMaterial = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 1.25;
    group.add(box);
    meshes.push(box);

    var roofGeometry = new THREE.BoxGeometry(3, 1.5, 2);
    var roofMaterial = new THREE.MeshLambertMaterial({ color: colors.snowWhite });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.2;
    roof.rotation.z = 0.25;
    group.add(roof);
    meshes.push(roof);

    var chimneyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 12);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(1, 4.5, 0);
    group.add(chimney);
    meshes.push(chimney);

    var lightGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var lightMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(0, 3.5, 1.2);
    generatorLight = light;
    group.add(light);
    meshes.push(light);

    return group;
  }

  function createSatelliteAntenna(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 6, 12);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 3;
    group.add(pole);
    meshes.push(pole);

    var armGeometry = new THREE.BoxGeometry(4, 0.3, 0.3);
    var armMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(0, 6, 0);
    group.add(arm);
    meshes.push(arm);

    var dishGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    var dishMaterial = new THREE.MeshLambertMaterial({ color: colors.arcticBlue });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(2.5, 6, 0);
    group.add(dish);
    meshes.push(dish);

    return group;
  }

  function createSnowDriftMounds() {
    var group = new THREE.Group();

    var positions = [
      { x: 15, y: 0.5, z: 20, scale: 3 },
      { x: -18, y: 0.4, z: -22, scale: 2.5 },
      { x: 20, y: 0.3, z: -15, scale: 2 },
      { x: -22, y: 0.5, z: 18, scale: 2.8 }
    ];

    positions.forEach(function(pos) {
      var driftGeometry = new THREE.SphereGeometry(pos.scale, 12, 8);
      var driftMaterial = new THREE.MeshLambertMaterial({ color: colors.snowWhite });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.position.set(pos.x, pos.y, pos.z);
      drift.scale.y = 0.4;
      group.add(drift);
      meshes.push(drift);
    });

    return group;
  }

  function createPerimeterLights() {
    var group = new THREE.Group();

    var positions = [
      { x: 25, z: 0 },
      { x: -25, z: 0 },
      { x: 0, z: 25 },
      { x: 0, z: -25 },
      { x: 18, z: 18 },
      { x: -18, z: 18 },
      { x: 18, z: -18 },
      { x: -18, z: -18 }
    ];

    positions.forEach(function(pos) {
      var poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
      var poleMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos.x, 2, pos.z);
      group.add(pole);
      meshes.push(pole);

      var lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var lightMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(pos.x, 4.2, pos.z);
      group.add(light);
      meshes.push(light);
    });

    return group;
  }

  function createHelipad() {
    var group = new THREE.Group();
    group.position.set(0, 0.05, -20);

    var padGeometry = new THREE.BoxGeometry(12, 0.1, 12);
    var padMaterial = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var pad = new THREE.Mesh(padGeometry, padMaterial);
    group.add(pad);
    meshes.push(pad);

    var markingGeometry = new THREE.BoxGeometry(8, 0.08, 2);
    var markingMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
    var marking = new THREE.Mesh(markingGeometry, markingMaterial);
    marking.position.set(0, 0.1, 0);
    group.add(marking);
    meshes.push(marking);

    var hLetterGeometry = new THREE.BoxGeometry(1.5, 0.08, 1.5);
    var hMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
    var hLetter = new THREE.Mesh(hLetterGeometry, hMaterial);
    hLetter.position.set(0, 0.12, 0);
    group.add(hLetter);
    meshes.push(hLetter);

    return group;
  }

  function createCommunicationTower(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);
    meshes.push(base);

    var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 15, 12);
    var poleMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 7.75;
    group.add(pole);
    meshes.push(pole);

    var antennaGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
    var antennaMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 15.5, 0);
    group.add(antenna);
    meshes.push(antenna);

    for (var i = 0; i < 3; i++) {
      var crossarmGeometry = new THREE.BoxGeometry(3, 0.1, 0.1);
      var crossarmMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
      var crossarm = new THREE.Mesh(crossarmGeometry, crossarmMaterial);
      crossarm.rotation.z = (i * Math.PI / 3);
      crossarm.position.y = 12 + i * 1.2;
      group.add(crossarm);
      meshes.push(crossarm);
    }

    return group;
  }

  function createSnowParticles() {
    var particleCount = 500;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      color: colors.snowWhite,
      size: 0.3,
      transparent: true,
      opacity: 0.6
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);
    snowParticles.push({
      mesh: particles,
      positions: positions,
      velocities: new Float32Array(particleCount * 3)
    });

    for (var j = 0; j < particleCount; j++) {
      snowParticles[0].velocities[j * 3] = (Math.random() - 0.5) * 0.5;
      snowParticles[0].velocities[j * 3 + 1] = -0.2 - Math.random() * 0.3;
      snowParticles[0].velocities[j * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
  }

  function createSearchlight(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    var baseMaterial = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    group.add(base);
    meshes.push(base);

    var armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 12);
    var armMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.y = 2.5;
    arm.rotation.z = 0.3;
    group.add(arm);
    meshes.push(arm);

    var headGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    var headMaterial = new THREE.MeshLambertMaterial({ color: colors.radarGray });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 4.5, 0);
    group.add(head);
    meshes.push(head);

    var bulbGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var bulbMaterial = new THREE.MeshLambertMaterial({ color: colors.warningOrange });
    var bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(0, 4.5, 0.2);
    searchlight = bulb;
    group.add(bulb);
    meshes.push(bulb);

    return group;
  }

  function updateSnowParticles(delta) {
    snowParticles.forEach(function(snowData) {
      var positions = snowData.positions;
      var velocities = snowData.velocities;
      var particleCount = positions.length / 3;

      for (var i = 0; i < particleCount; i++) {
        positions[i * 3] += velocities[i * 3] * delta * 10;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 10;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 10;

        if (positions[i * 3 + 1] < -5) {
          positions[i * 3 + 1] = 50;
        }

        if (Math.abs(positions[i * 3]) > 60) {
          positions[i * 3] = (Math.random() - 0.5) * 100;
        }

        if (Math.abs(positions[i * 3 + 2]) > 60) {
          positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
      }

      snowData.mesh.geometry.attributes.position.needsUpdate = true;
    });
  }

  function updateRadar(delta) {
    if (radarDish) {
      radarDish.rotation.y += delta * 1.2;
    }
  }

  function updateGeneratorLight(delta) {
    if (generatorLight) {
      var flicker = Math.sin(time * 8) * 0.3 + 0.7;
      generatorLight.material.emissive.setHSL(0.08, 0.8, flicker * 0.4);
    }
  }

  function updateSearchlight(delta) {
    if (searchlight) {
      searchlightTarget += delta * 2;
      var sweep = Math.sin(searchlightTarget) * 0.5;
      searchlight.material.emissive.setHSL(0.08, 0.9, 0.3 + sweep * 0.3);
    }
  }

  function updateFlagAnimation(delta) {
    if (flagPole) {
      var wave = Math.sin(time * 3) * 0.1;
      flagPole.rotation.z = wave;
      flagPole.rotation.y = Math.sin(time * 2) * 0.05;
    }
  }

  function spawnSpetsnazEnemy() {
    if (spetsnazEnemies.length < 3 && Math.random() > 0.95) {
      var spawnPoints = [
        { x: -30, z: -30 },
        { x: 30, z: -30 },
        { x: -30, z: 30 },
        { x: 30, z: 30 }
      ];

      var spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

      var enemyGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var enemyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemy.position.set(spawn.x, 0.9, spawn.z);

      scene.add(enemy);
      meshes.push(enemy);

      spetsnazEnemies.push({
        mesh: enemy,
        x: spawn.x,
        z: spawn.z,
        targetX: Math.random() * 30 - 15,
        targetZ: Math.random() * 30 - 15,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }

  function updateSpetsnazEnemies(delta) {
    spetsnazEnemies = spetsnazEnemies.filter(function(enemy) {
      var dx = enemy.targetX - enemy.x;
      var dz = enemy.targetZ - enemy.z;
      var distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 1) {
        enemy.targetX = Math.random() * 40 - 20;
        enemy.targetZ = Math.random() * 40 - 20;
      }

      var moveX = dx / distance * enemy.speed * delta;
      var moveZ = dz / distance * enemy.speed * delta;

      enemy.x += moveX;
      enemy.z += moveZ;

      enemy.mesh.position.x = enemy.x;
      enemy.mesh.position.z = enemy.z;

      var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.2;

      return enemy.x > -50 && enemy.x < 50 && enemy.z > -50 && enemy.z < 50;
    });
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    meshes = [];
    snowParticles = [];
    spetsnazEnemies = [];
    time = 0;

    var barrackGroup = new THREE.Group();
    barrackGroup.add(createBarracksBuilding(-8, 0, -5, 6, 5));
    barrackGroup.add(createBarracksBuilding(8, 0, -5, 6, 5));
    barrackGroup.add(createBarracksBuilding(0, 0, 8, 5, 4));
    scene.add(barrackGroup);

    scene.add(createRadarDish(12, 0, 12));
    scene.add(createFuelDrums(-12, 0, 8, 4));
    scene.add(createSnowmobile(-5, 0, -15));
    scene.add(createSnowmobile(5, 0, -15));
    scene.add(createSandbagRing(0, 0, 0, 28, 16));
    scene.add(createFlagPole(18, 0, -8));
    scene.add(createGeneratorBuilding(-15, 0, 0));
    scene.add(createSatelliteAntenna(15, 0, -12));
    scene.add(createSnowDriftMounds());
    scene.add(createPerimeterLights());
    scene.add(createHelipad());
    scene.add(createCommunicationTower(-18, 0, 12));
    scene.add(createSearchlight(20, 0, 15));

    createSnowParticles();
  }

  function update(delta) {
    time += delta;

    updateSnowParticles(delta);
    updateRadar(delta);
    updateGeneratorLight(delta);
    updateSearchlight(delta);
    updateFlagAnimation(delta);
    spawnSpetsnazEnemy();
    updateSpetsnazEnemies(delta);
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        mesh.material.dispose();
      }
    });
    meshes = [];

    snowParticles.forEach(function(snowData) {
      if (snowData.mesh.geometry) {
        snowData.mesh.geometry.dispose();
      }
      if (snowData.mesh.material) {
        snowData.mesh.material.dispose();
      }
      scene.remove(snowData.mesh);
    });
    snowParticles = [];

    spetsnazEnemies.forEach(function(enemy) {
      if (enemy.mesh.geometry) {
        enemy.mesh.geometry.dispose();
      }
      if (enemy.mesh.material) {
        enemy.mesh.material.dispose();
      }
      scene.remove(enemy.mesh);
    });
    spetsnazEnemies = [];

    radarDish = null;
    generatorLight = null;
    searchlight = null;
    flagPole = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
