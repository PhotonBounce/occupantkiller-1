window.CraterBase = (function() {
  'use strict';

  var craterObjects = [];
  var energyParticles = [];
  var radarDishes = [];
  var turrets = [];
  var pylons = [];
  var alienArtifact = null;
  var containmentField = null;
  var spawnPoints = [];
  var scene = null;

  var colors = {
    alienEnergy: 0x00FFCC,
    craterRock: 0x5C4A2A,
    metalBase: 0x445566,
    energyBlue: 0x0088FF,
    dangerOrange: 0xFF6600,
    alienGreen: 0x44FF44
  };

  function createCraterRim() {
    var rimGroup = new THREE.Group();
    var rimSegments = 12;
    var rimRadius = 400;
    var rimHeight = 80;
    var segmentAngle = (Math.PI * 2) / rimSegments;

    for (var i = 0; i < rimSegments; i++) {
      var angle = i * segmentAngle;
      var x = Math.cos(angle) * rimRadius;
      var z = Math.sin(angle) * rimRadius;

      var rimGeometry = new THREE.BoxGeometry(100, rimHeight, 40);
      var rimMaterial = new THREE.MeshPhongMaterial({ color: colors.craterRock });
      var rimSegment = new THREE.Mesh(rimGeometry, rimMaterial);

      rimSegment.position.set(x, 0, z);
      rimSegment.rotation.y = angle;
      rimGroup.add(rimSegment);
      craterObjects.push(rimSegment);

      var spawnGeometry = new THREE.BoxGeometry(30, 5, 30);
      var spawnMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var spawnPlatform = new THREE.Mesh(spawnGeometry, spawnMaterial);
      spawnPlatform.position.set(x, rimHeight / 2 + 10, z);
      rimGroup.add(spawnPlatform);
      spawnPoints.push({ position: spawnPlatform.position.clone(), radius: 20 });
    }

    return rimGroup;
  }

  function createCraterFloor() {
    var floorGeometry = new THREE.CylinderGeometry(300, 280, 2, 32);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: colors.craterRock });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -120;
    floor.receiveShadow = true;
    craterObjects.push(floor);
    return floor;
  }

  function createResearchLabBuildings() {
    var labsGroup = new THREE.Group();

    var labPositions = [
      { x: -150, z: -100, label: 'Lab-A' },
      { x: 150, z: -100, label: 'Lab-B' },
      { x: -150, z: 100, label: 'Lab-C' },
      { x: 150, z: 100, label: 'Lab-D' }
    ];

    labPositions.forEach(function(pos) {
      var labGeometry = new THREE.BoxGeometry(60, 50, 60);
      var labMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var lab = new THREE.Mesh(labGeometry, labMaterial);
      lab.position.set(pos.x, -80, pos.z);
      labsGroup.add(lab);
      craterObjects.push(lab);

      var doorGeometry = new THREE.BoxGeometry(20, 35, 1);
      var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x00AA00 });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(pos.x, -80, pos.z + 31);
      labsGroup.add(door);
      craterObjects.push(door);

      var windowGeometry = new THREE.BoxGeometry(15, 15, 0.5);
      var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x0088FF });
      for (var w = 0; w < 4; w++) {
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(pos.x - 15 + w * 12, -70, pos.z - 31);
        labsGroup.add(window);
        craterObjects.push(window);
      }

      spawnPoints.push({ position: new THREE.Vector3(pos.x, -60, pos.z), radius: 15 });
    });

    return labsGroup;
  }

  function createEnergyPylons() {
    var pylonsGroup = new THREE.Group();
    var pylonCount = 6;
    var pylonRadius = 200;

    for (var i = 0; i < pylonCount; i++) {
      var angle = (i / pylonCount) * Math.PI * 2;
      var x = Math.cos(angle) * pylonRadius;
      var z = Math.sin(angle) * pylonRadius;

      var baseGeometry = new THREE.BoxGeometry(30, 10, 30);
      var baseMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(x, -115, z);
      pylonsGroup.add(base);
      craterObjects.push(base);

      var pylonGeometry = new THREE.CylinderGeometry(15, 15, 100, 8);
      var pylonMaterial = new THREE.MeshPhongMaterial({
        color: colors.energyBlue,
        emissive: colors.energyBlue,
        emissiveIntensity: 0.5
      });
      var pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
      pylon.position.set(x, -50, z);
      pylon.castShadow = true;
      pylonsGroup.add(pylon);
      craterObjects.push(pylon);
      pylons.push({ mesh: pylon, angle: 0, speed: 0.5 });

      var light = new THREE.PointLight(colors.energyBlue, 0.8, 150);
      light.position.set(x, -50, z);
      pylonsGroup.add(light);

      var capGeometry = new THREE.SphereGeometry(18, 16, 16);
      var capMaterial = new THREE.MeshPhongMaterial({
        color: colors.alienEnergy,
        emissive: colors.alienEnergy,
        emissiveIntensity: 0.8
      });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(x, 20, z);
      pylonsGroup.add(cap);
      craterObjects.push(cap);
    }

    return pylonsGroup;
  }

  function createAlienArtifact() {
    var artifactGroup = new THREE.Group();

    var coreGeometry = new THREE.SphereGeometry(35, 32, 32);
    var coreMaterial = new THREE.MeshPhongMaterial({
      color: colors.alienEnergy,
      emissive: colors.alienEnergy,
      emissiveIntensity: 1.0,
      shininess: 100
    });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.y = -50;
    core.castShadow = true;
    artifactGroup.add(core);
    craterObjects.push(core);
    alienArtifact = { mesh: core, rotation: 0 };

    var coreLight = new THREE.PointLight(colors.alienEnergy, 2.0, 300);
    coreLight.position.set(0, -50, 0);
    artifactGroup.add(coreLight);

    var orbitCount = 3;
    for (var i = 0; i < orbitCount; i++) {
      var orbitRadius = 60 + i * 30;
      var orbitGeometry = new THREE.TorusGeometry(orbitRadius, 5, 16, 100);
      var orbitMaterial = new THREE.MeshPhongMaterial({ color: colors.alienGreen });
      var orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.position.y = -50;
      orbit.rotation.x = Math.PI / 4 + i * 0.3;
      artifactGroup.add(orbit);
      craterObjects.push(orbit);
    }

    var emanationGeometry = new THREE.SphereGeometry(100, 16, 16);
    var emanationMaterial = new THREE.MeshBasicMaterial({
      color: colors.alienEnergy,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });
    var emanation = new THREE.Mesh(emanationGeometry, emanationMaterial);
    emanation.position.y = -50;
    artifactGroup.add(emanation);
    craterObjects.push(emanation);
    containmentField = { mesh: emanation, pulse: 0 };

    return artifactGroup;
  }

  function createContainmentFieldEmitters() {
    var emittersGroup = new THREE.Group();
    var emitterCount = 8;

    for (var i = 0; i < emitterCount; i++) {
      var angle = (i / emitterCount) * Math.PI * 2;
      var radius = 150;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var emitterGeometry = new THREE.BoxGeometry(15, 40, 15);
      var emitterMaterial = new THREE.MeshPhongMaterial({ color: colors.dangerOrange });
      var emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
      emitter.position.set(x, -60, z);
      emittersGroup.add(emitter);
      craterObjects.push(emitter);

      var lightEmitter = new THREE.PointLight(colors.dangerOrange, 0.6, 100);
      lightEmitter.position.set(x, -60, z);
      emittersGroup.add(lightEmitter);
    }

    return emittersGroup;
  }

  function createUndergroundTunnels() {
    var tunnelsGroup = new THREE.Group();

    var tunnelStartPositions = [
      { x: -200, z: -150, direction: 1 },
      { x: 200, z: -150, direction: 1 },
      { x: -200, z: 150, direction: -1 },
      { x: 200, z: 150, direction: -1 }
    ];

    tunnelStartPositions.forEach(function(start) {
      var tunnelLength = 300;
      var tunnelGeometry = new THREE.BoxGeometry(60, 50, tunnelLength);
      var tunnelMaterial = new THREE.MeshPhongMaterial({ color: 0x2A2A2A });
      var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
      tunnel.position.set(start.x, -140, start.z + (tunnelLength / 2) * start.direction);
      tunnelsGroup.add(tunnel);
      craterObjects.push(tunnel);

      var entranceGeometry = new THREE.BoxGeometry(60, 50, 5);
      var entranceMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
      entrance.position.set(start.x, -140, start.z);
      tunnelsGroup.add(entrance);
      craterObjects.push(entrance);

      spawnPoints.push({ position: entrance.position.clone(), radius: 20 });
    });

    return tunnelsGroup;
  }

  function createRadarDishes() {
    var radarGroup = new THREE.Group();
    var radarPositions = [
      { x: -250, z: -250 },
      { x: 250, z: -250 },
      { x: -250, z: 250 },
      { x: 250, z: 250 }
    ];

    radarPositions.forEach(function(pos) {
      var poleGeometry = new THREE.CylinderGeometry(8, 8, 80, 8);
      var poleMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos.x, 20, pos.z);
      radarGroup.add(pole);
      craterObjects.push(pole);

      var dishGeometry = new THREE.CylinderGeometry(40, 40, 3, 32);
      var dishMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.set(pos.x, 70, pos.z);
      dish.castShadow = true;
      radarGroup.add(dish);
      craterObjects.push(dish);
      radarDishes.push({ mesh: dish, angle: 0 });
    });

    return radarGroup;
  }

  function createDefenseTurrets() {
    var turretsGroup = new THREE.Group();
    var turretPositions = [
      { x: -300, z: 0 },
      { x: 300, z: 0 },
      { x: 0, z: -300 },
      { x: 0, z: 300 }
    ];

    turretPositions.forEach(function(pos) {
      var baseGeometry = new THREE.CylinderGeometry(20, 20, 15, 16);
      var baseMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var turretBase = new THREE.Mesh(baseGeometry, baseMaterial);
      turretBase.position.set(pos.x, -100, pos.z);
      turretsGroup.add(turretBase);
      craterObjects.push(turretBase);

      var barrelGeometry = new THREE.CylinderGeometry(8, 8, 50, 8);
      var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(pos.x, -85, pos.z);
      barrel.rotation.z = Math.PI / 6;
      turretsGroup.add(barrel);
      craterObjects.push(barrel);

      var headGeometry = new THREE.SphereGeometry(15, 16, 16);
      var headMaterial = new THREE.MeshPhongMaterial({ color: colors.dangerOrange });
      var turretHead = new THREE.Mesh(headGeometry, headMaterial);
      turretHead.position.set(pos.x, -85, pos.z);
      turretsGroup.add(turretHead);
      craterObjects.push(turretHead);

      turrets.push({ base: turretBase, head: turretHead, barrel: barrel, angle: 0, targetAngle: 0 });
    });

    return turretsGroup;
  }

  function createPowerGenerators() {
    var generatorsGroup = new THREE.Group();

    var generatorPositions = [
      { x: -100, z: -200 },
      { x: 100, z: -200 },
      { x: -100, z: 200 },
      { x: 100, z: 200 }
    ];

    generatorPositions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(50, 60, 50);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, -85, pos.z);
      generatorsGroup.add(body);
      craterObjects.push(body);

      for (var j = 0; j < 3; j++) {
        var ventGeometry = new THREE.BoxGeometry(40, 8, 40);
        var ventMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
        var vent = new THREE.Mesh(ventGeometry, ventMaterial);
        vent.position.set(pos.x, -85 + (j * 20) - 20, pos.z);
        generatorsGroup.add(vent);
        craterObjects.push(vent);
      }

      var exhaustGeometry = new THREE.CylinderGeometry(12, 12, 60, 8);
      var exhaustMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
      exhaust.position.set(pos.x + 30, -55, pos.z);
      generatorsGroup.add(exhaust);
      craterObjects.push(exhaust);

      var lightGen = new THREE.PointLight(colors.metalBase, 0.3, 100);
      lightGen.position.set(pos.x, -55, pos.z);
      generatorsGroup.add(lightGen);
    });

    return generatorsGroup;
  }

  function createAirlockDoors() {
    var airlockGroup = new THREE.Group();

    var airlockPositions = [
      { x: -50, z: -300 },
      { x: 50, z: -300 },
      { x: -50, z: 300 },
      { x: 50, z: 300 }
    ];

    airlockPositions.forEach(function(pos) {
      var frameGeometry = new THREE.BoxGeometry(50, 70, 10);
      var frameMaterial = new THREE.MeshPhongMaterial({ color: colors.metalBase });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, -80, pos.z);
      airlockGroup.add(frame);
      craterObjects.push(frame);

      var doorGeometry = new THREE.BoxGeometry(42, 62, 2);
      var doorMaterial = new THREE.MeshPhongMaterial({ color: colors.dangerOrange });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(pos.x, -80, pos.z + 5);
      airlockGroup.add(door);
      craterObjects.push(door);

      var sealGeometry = new THREE.TorusGeometry(30, 2, 8, 100);
      var sealMaterial = new THREE.MeshPhongMaterial({
        color: colors.energyBlue,
        emissive: colors.energyBlue,
        emissiveIntensity: 0.5
      });
      var seal = new THREE.Mesh(sealGeometry, sealMaterial);
      seal.position.set(pos.x, -80, pos.z + 6);
      airlockGroup.add(seal);
      craterObjects.push(seal);
    });

    return airlockGroup;
  }

  function createEnergyDischargeParticles() {
    for (var i = 0; i < 50; i++) {
      var particleGeometry = new THREE.SphereGeometry(2, 8, 8);
      var particleMaterial = new THREE.MeshPhongMaterial({
        color: colors.alienEnergy,
        emissive: colors.alienEnergy,
        emissiveIntensity: 0.8
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);

      var angle = Math.random() * Math.PI * 2;
      var elevation = Math.random() * Math.PI;
      var distance = Math.random() * 200 + 100;

      particle.position.x = Math.sin(elevation) * Math.cos(angle) * distance;
      particle.position.y = -50 + Math.cos(elevation) * distance;
      particle.position.z = Math.sin(elevation) * Math.sin(angle) * distance;

      energyParticles.push({
        mesh: particle,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 - 0.5,
        vz: (Math.random() - 0.5) * 2,
        life: Math.random() * 2 + 1,
        maxLife: Math.random() * 2 + 1
      });
    }
  }

  function updateEnergyParticles(delta) {
    for (var i = energyParticles.length - 1; i >= 0; i--) {
      var particle = energyParticles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        energyParticles.splice(i, 1);
      } else {
        particle.mesh.position.x += particle.vx * delta * 30;
        particle.mesh.position.y += particle.vy * delta * 30;
        particle.mesh.position.z += particle.vz * delta * 30;

        var alpha = particle.life / particle.maxLife;
        particle.mesh.material.opacity = alpha;
        particle.mesh.scale.set(alpha, alpha, alpha);
      }
    }

    if (Math.random() < 0.3) {
      var newParticleGeometry = new THREE.SphereGeometry(2, 8, 8);
      var newParticleMaterial = new THREE.MeshPhongMaterial({
        color: colors.alienEnergy,
        emissive: colors.alienEnergy,
        emissiveIntensity: 0.8,
        transparent: true
      });
      var newParticle = new THREE.Mesh(newParticleGeometry, newParticleMaterial);

      var angle = Math.random() * Math.PI * 2;
      var elevation = Math.random() * Math.PI;
      var distance = Math.random() * 150 + 80;

      newParticle.position.x = Math.sin(elevation) * Math.cos(angle) * distance;
      newParticle.position.y = -50 + Math.cos(elevation) * distance;
      newParticle.position.z = Math.sin(elevation) * Math.sin(angle) * distance;

      scene.add(newParticle);
      energyParticles.push({
        mesh: newParticle,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 - 0.5,
        vz: (Math.random() - 0.5) * 2,
        life: Math.random() * 2 + 1,
        maxLife: Math.random() * 2 + 1
      });
    }
  }

  function updatePylons(delta) {
    pylons.forEach(function(pylon) {
      pylon.angle += pylon.speed * delta;
      pylon.mesh.rotation.y = pylon.angle;

      var pulseIntensity = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
      pylon.mesh.material.emissiveIntensity = pulseIntensity;
    });
  }

  function updateRadarDishes(delta) {
    radarDishes.forEach(function(radar, index) {
      radar.angle += 0.5 * delta;
      if (radar.angle > Math.PI * 2) radar.angle -= Math.PI * 2;
      radar.mesh.rotation.y = radar.angle;
    });
  }

  function updateTurrets(delta) {
    turrets.forEach(function(turret, index) {
      var targetAngle = (Math.sin(Date.now() * 0.0005 + index) + 1) * Math.PI;
      turret.angle += (targetAngle - turret.angle) * 0.05;
      turret.head.rotation.y = turret.angle;
      turret.barrel.rotation.z = Math.PI / 6 + Math.sin(Date.now() * 0.003) * 0.3;
    });
  }

  function updateAlienArtifact(delta) {
    if (alienArtifact) {
      alienArtifact.rotation += delta * 0.3;
      alienArtifact.mesh.rotation.x += delta * 0.2;
      alienArtifact.mesh.rotation.y += delta * 0.3;
      alienArtifact.mesh.rotation.z += delta * 0.1;

      var pulseScale = Math.sin(Date.now() * 0.003) * 0.1 + 0.95;
      alienArtifact.mesh.scale.set(pulseScale, pulseScale, pulseScale);
    }

    if (containmentField) {
      containmentField.pulse += delta * 2;
      var fieldScale = Math.sin(containmentField.pulse) * 0.2 + 1.0;
      containmentField.mesh.scale.set(fieldScale, fieldScale, fieldScale);
    }
  }

  var init = function(initialScene, camera) {
    scene = initialScene;
    craterObjects = [];
    energyParticles = [];
    radarDishes = [];
    turrets = [];
    pylons = [];
    spawnPoints = [];

    var crater = createCraterRim();
    scene.add(crater);

    var floor = createCraterFloor();
    scene.add(floor);

    var labs = createResearchLabBuildings();
    scene.add(labs);

    var pylonsGroup = createEnergyPylons();
    scene.add(pylonsGroup);

    var artifact = createAlienArtifact();
    scene.add(artifact);

    var fieldEmitters = createContainmentFieldEmitters();
    scene.add(fieldEmitters);

    var tunnels = createUndergroundTunnels();
    scene.add(tunnels);

    var radars = createRadarDishes();
    scene.add(radars);

    var turretGroup = createDefenseTurrets();
    scene.add(turretGroup);

    var generators = createPowerGenerators();
    scene.add(generators);

    var airlocks = createAirlockDoors();
    scene.add(airlocks);

    createEnergyDischargeParticles();

    energyParticles.forEach(function(particle) {
      scene.add(particle.mesh);
    });

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(300, 200, 300);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
  };

  var update = function(delta) {
    updateEnergyParticles(delta);
    updatePylons(delta);
    updateRadarDishes(delta);
    updateTurrets(delta);
    updateAlienArtifact(delta);
  };

  var reset = function() {
    craterObjects.forEach(function(obj) {
      scene.remove(obj);
    });
    energyParticles.forEach(function(particle) {
      scene.remove(particle.mesh);
    });
    craterObjects = [];
    energyParticles = [];
    radarDishes = [];
    turrets = [];
    pylons = [];
    spawnPoints = [];
    alienArtifact = null;
    containmentField = null;
  };

  var getSpawnPoints = function() {
    return spawnPoints;
  };

  var getEnemyPositions = function() {
    var positions = [];
    radarDishes.forEach(function(radar) {
      positions.push(radar.mesh.position.clone());
    });
    turrets.forEach(function(turret) {
      positions.push(turret.head.position.clone());
    });
    return positions;
  };

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints,
    getEnemyPositions: getEnemyPositions
  };
}());
