window.ToxicWasteland = (function() {
  'use strict';

  var state = {
    isActive: false,
    scene: null,
    camera: null,
    sceneObjects: [],
    lastKeyTimes: {},
    radiation: 45,
    samplesCollected: 0,
    mutantsKilled: 0,
    hudElement: null,
    elapsedTime: 0
  };

  var KEYBIND_SEQUENCE = ['t', 'w'];
  var KEYBIND_TIMEOUT = 400;
  var RADIATION_INCREASE_RATE = 0.1;
  var MAX_RADIATION = 200;

  function createRadiationWarningSign() {
    var geometry = new THREE.BoxGeometry(1, 1.5, 0.1);
    var material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    var sign = new THREE.Mesh(geometry, material);
    sign.position.y = 0.75;
    return sign;
  }

  function createRuinedFactory() {
    var factory = new THREE.Group();

    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.2
    });

    var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 1), wallMaterial);
    wallNorth.position.set(0, 4, -10);
    factory.add(wallNorth);

    var holeGeometry = new THREE.BoxGeometry(3, 3, 1.5);
    var holeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9
    });
    var hole1 = new THREE.Mesh(holeGeometry, holeMaterial);
    hole1.position.set(-5, 5, -9.5);
    factory.add(hole1);

    var hole2 = new THREE.Mesh(holeGeometry, holeMaterial);
    hole2.position.set(5, 5, -9.5);
    factory.add(hole2);

    var wallEast = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 15), wallMaterial);
    wallEast.position.set(10, 4, 0);
    factory.add(wallEast);

    var wallWest = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 15), wallMaterial);
    wallWest.position.set(-10, 4, 0);
    factory.add(wallWest);

    var roofChunk1 = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 6), wallMaterial);
    roofChunk1.position.set(-6, 8, -3);
    roofChunk1.rotation.z = 0.3;
    factory.add(roofChunk1);

    var roofChunk2 = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 6), wallMaterial);
    roofChunk2.position.set(6, 8, 3);
    roofChunk2.rotation.z = -0.3;
    factory.add(roofChunk2);

    return factory;
  }

  function createCoolingTowerRemnants() {
    var tower = new THREE.Group();

    var cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.3
    });

    var towerBase = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 15, 16),
      cylinderMaterial
    );
    towerBase.position.set(0, 7.5, 0);
    tower.add(towerBase);

    var towerTop = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 4, 8, 16),
      cylinderMaterial
    );
    towerTop.position.set(0, 19, 0);
    tower.add(towerTop);

    var crackMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9
    });

    var crack1 = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 0.5), crackMaterial);
    crack1.position.set(7, 7.5, 0);
    crack1.rotation.z = 0.2;
    tower.add(crack1);

    var crack2 = new THREE.Mesh(new THREE.BoxGeometry(2, 15, 0.5), crackMaterial);
    crack2.position.set(-7, 7.5, 0);
    crack2.rotation.z = -0.2;
    tower.add(crack2);

    return tower;
  }

  function createToxicWasteDrums() {
    var drums = new THREE.Group();

    var drumPositions = [
      { x: -15, z: 15 },
      { x: -10, z: 18 },
      { x: -5, z: 20 },
      { x: 5, z: -15 },
      { x: 15, z: -20 },
      { x: 12, z: -10 }
    ];

    drumPositions.forEach(function(pos) {
      var drumGeometry = new THREE.CylinderGeometry(1, 1, 2, 12);
      var drumMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF00,
        emissive: 0x00FF00,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.4
      });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(pos.x, 1, pos.z);
      drum.userData.drumIndex = drums.children.length;
      drum.userData.isGlowingObject = true;
      drums.add(drum);

      var bandMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        metalness: 0.9,
        roughness: 0.2
      });
      var band = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.3, 12), bandMaterial);
      band.position.set(pos.x, 2, pos.z);
      drums.add(band);
    });

    return drums;
  }

  function createDeadTrees() {
    var trees = new THREE.Group();

    var treePositions = [
      { x: 20, z: 20 },
      { x: -20, z: -20 },
      { x: 25, z: -15 },
      { x: -25, z: 15 },
      { x: 18, z: -22 }
    ];

    var trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8
    });

    treePositions.forEach(function(pos) {
      var trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 4, pos.z);
      trunk.castShadow = true;
      trees.add(trunk);

      var branchMaterial = new THREE.MeshStandardMaterial({
        color: 0x332211,
        roughness: 0.9
      });

      for (var i = 0; i < 3; i++) {
        var branch = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.1, 3, 6),
          branchMaterial
        );
        branch.position.set(pos.x + Math.cos(i * Math.PI * 0.7) * 2, 5 + i, pos.z + Math.sin(i * Math.PI * 0.7) * 2);
        branch.rotation.z = 0.5 + i * 0.3;
        trees.add(branch);
      }
    });

    return trees;
  }

  function createAbandonedVehicles() {
    var vehicles = new THREE.Group();

    var positions = [
      { x: -30, z: 5 },
      { x: 30, z: -10 },
      { x: -35, z: -25 }
    ];

    var carBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      roughness: 0.7,
      metalness: 0.6
    });

    positions.forEach(function(pos) {
      var body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4.5), carBodyMaterial);
      body.position.set(pos.x, 0.75, pos.z);
      body.rotation.y = Math.random() * Math.PI * 2;
      vehicles.add(body);

      var cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0x440000,
        roughness: 0.8,
        metalness: 0.4
      });
      var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 2), cabinMaterial);
      cabin.position.set(pos.x, 1.5, pos.z - 0.5);
      vehicles.add(cabin);

      var wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.7,
        roughness: 0.3
      });

      for (var i = 0; i < 4; i++) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16),
          wheelMaterial
        );
        var xOffset = (i % 2 === 0) ? -1.1 : 1.1;
        var zOffset = (i < 2) ? -1.5 : 1.5;
        wheel.position.set(pos.x + xOffset, 0.5, pos.z + zOffset);
        wheel.rotation.z = Math.PI * 0.5;
        vehicles.add(wheel);
      }
    });

    return vehicles;
  }

  function createCraters() {
    var craters = new THREE.Group();

    var craterPositions = [
      { x: -40, z: 30 },
      { x: 40, z: -30 },
      { x: -45, z: -35 },
      { x: 45, z: 35 }
    ];

    var craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    });

    craterPositions.forEach(function(pos) {
      var crater = new THREE.Mesh(
        new THREE.ConeGeometry(8, 5, 24),
        craterMaterial
      );
      crater.position.set(pos.x, -1, pos.z);
      crater.scale.y = -1;
      craters.add(crater);

      var rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.8
      });
      var rim = new THREE.Mesh(
        new THREE.CylinderGeometry(8.2, 8.2, 0.5, 24),
        rimMaterial
      );
      rim.position.set(pos.x, 0, pos.z);
      craters.add(rim);
    });

    return craters;
  }

  function createParticleEffect() {
    var particles = new THREE.Group();

    for (var i = 0; i < 50; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.15, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        emissive: 0x555555,
        emissiveIntensity: 0.3,
        roughness: 0.7
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 50,
        (Math.random() - 0.5) * 100
      );
      particle.userData.initialY = particle.position.y;
      particle.userData.velocity = 0.5 + Math.random() * 1.5;
      particles.add(particle);
    }

    return particles;
  }

  function createMutantScavenger(x, z) {
    var group = new THREE.Group();

    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x444433,
      roughness: 0.7,
      metalness: 0.1
    });

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), bodyMaterial);
    body.position.y = 0.6;
    group.add(body);

    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x555544,
      roughness: 0.6
    });
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMaterial);
    head.position.y = 1.3;
    group.add(head);

    var limbMaterial = new THREE.MeshStandardMaterial({
      color: 0x333322,
      roughness: 0.75
    });

    var armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), limbMaterial);
    armLeft.position.set(-0.5, 0.8, 0);
    group.add(armLeft);

    var armRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), limbMaterial);
    armRight.position.set(0.5, 0.8, 0);
    group.add(armRight);

    var legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), limbMaterial);
    legLeft.position.set(-0.3, 0.2, 0);
    group.add(legLeft);

    var legRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), limbMaterial);
    legRight.position.set(0.3, 0.2, 0);
    group.add(legRight);

    group.position.set(x, 0, z);
    group.userData.health = 3;
    group.userData.enemyType = 'scavenger';
    group.userData.speed = 8;
    group.userData.walkCycle = 0;

    return group;
  }

  function createHazmatSoldier(x, z) {
    var group = new THREE.Group();

    var suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AA00,
      emissive: 0x005500,
      emissiveIntensity: 0.3,
      roughness: 0.5,
      metalness: 0.4
    });

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.3, 0.5), suitMaterial);
    body.position.y = 0.65;
    group.add(body);

    var helmMaterial = new THREE.MeshStandardMaterial({
      color: 0x00DD00,
      emissive: 0x00AA00,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.6
    });
    var helm = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), helmMaterial);
    helm.position.y = 1.4;
    group.add(helm);

    var glassVisor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), new THREE.MeshStandardMaterial({
      color: 0x00FFFF,
      transparent: true,
      opacity: 0.7,
      metalness: 0.9,
      roughness: 0.1
    }));
    glassVisor.position.set(0, 1.4, 0.25);
    group.add(glassVisor);

    var armLeftMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AA00,
      roughness: 0.6
    });
    var armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), armLeftMaterial);
    armLeft.position.set(-0.6, 0.8, 0);
    group.add(armLeft);

    var armRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), armLeftMaterial);
    armRight.position.set(0.6, 0.8, 0);
    group.add(armRight);

    var legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), armLeftMaterial);
    legLeft.position.set(-0.3, 0.2, 0);
    group.add(legLeft);

    var legRight = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), armLeftMaterial);
    legRight.position.set(0.3, 0.2, 0);
    group.add(legRight);

    group.position.set(x, 0, z);
    group.userData.health = 5;
    group.userData.enemyType = 'hazmat';
    group.userData.speed = 6;
    group.userData.walkCycle = 0;

    return group;
  }

  function createToxicFog() {
    var fogGeometry = new THREE.BoxGeometry(200, 40, 200);
    var fogMaterial = new THREE.MeshBasicMaterial({
      color: 0xCCFF00,
      transparent: true,
      opacity: 0.08
    });
    var fog = new THREE.Mesh(fogGeometry, fogMaterial);
    fog.position.y = 20;
    return fog;
  }

  function updateToxicGlow(delta) {
    state.elapsedTime += delta;

    state.sceneObjects.forEach(function(obj) {
      if (obj.userData && obj.userData.isGlowingObject) {
        var glowIntensity = 0.4 + Math.sin(state.elapsedTime * 3) * 0.3;
        obj.material.emissiveIntensity = glowIntensity;
      }
    });
  }

  function updateParticles(delta) {
    state.sceneObjects.forEach(function(obj) {
      if (obj.userData && obj.userData.velocity !== undefined) {
        obj.position.y += obj.userData.velocity * delta;
        if (obj.position.y > obj.userData.initialY + 30) {
          obj.position.y = obj.userData.initialY - 10;
        }
      }
    });
  }

  function updateRadiation(delta) {
    if (state.isActive) {
      state.radiation = Math.min(state.radiation + RADIATION_INCREASE_RATE * delta, MAX_RADIATION);
    }
  }

  function updateHUD() {
    if (state.hudElement) {
      state.hudElement.innerHTML =
        'RADIATION: ' + Math.floor(state.radiation) + ' rem<br/>' +
        'SAMPLES COLLECTED: ' + state.samplesCollected + '/4<br/>' +
        'MUTANTS KILLED: ' + state.mutantsKilled;
    }
  }

  function createOrUpdateHUD() {
    if (!state.hudElement) {
      state.hudElement = document.createElement('div');
      state.hudElement.id = 'toxic-wasteland-hud';
      state.hudElement.style.cssText =
        'position: fixed; top: 20px; left: 20px; color: #CCFF00; ' +
        'font-family: monospace; font-size: 14px; ' +
        'background: rgba(0, 0, 0, 0.7); padding: 10px; ' +
        'border: 2px solid #CCFF00; z-index: 100; ' +
        'text-shadow: 0 0 5px #CCFF00;';
      document.body.appendChild(state.hudElement);
    }
    updateHUD();
  }

  function handleKeyDown(event) {
    var key = event.key.toLowerCase();

    if (KEYBIND_SEQUENCE.indexOf(key) !== -1) {
      var now = Date.now();
      var lastTime = state.lastKeyTimes[key] || 0;
      state.lastKeyTimes[key] = now;

      var checkSequence = true;
      var currentIndex = 0;

      for (var i = 0; i < KEYBIND_SEQUENCE.length; i++) {
        var k = KEYBIND_SEQUENCE[i];
        var kTime = state.lastKeyTimes[k] || 0;
        if (kTime === 0 || (now - kTime > KEYBIND_TIMEOUT)) {
          checkSequence = false;
          break;
        }
      }

      if (checkSequence) {
        state.isActive = !state.isActive;
        if (state.hudElement) {
          state.hudElement.style.display = state.isActive ? 'block' : 'none';
        }
        state.lastKeyTimes = {};
      }
    }
  }

  var init = function(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.sceneObjects = [];
    state.isActive = false;
    state.radiation = 45;
    state.samplesCollected = 0;
    state.mutantsKilled = 0;
    state.elapsedTime = 0;

    document.addEventListener('keydown', handleKeyDown);

    createOrUpdateHUD();

    var factory = createRuinedFactory();
    state.scene.add(factory);
    state.sceneObjects.push(factory);

    var tower = createCoolingTowerRemnants();
    tower.position.set(30, 0, 30);
    state.scene.add(tower);
    state.sceneObjects.push(tower);

    var drums = createToxicWasteDrums();
    state.scene.add(drums);
    drums.children.forEach(function(child) {
      state.sceneObjects.push(child);
    });

    var trees = createDeadTrees();
    state.scene.add(trees);
    state.sceneObjects.push(trees);

    var vehicles = createAbandonedVehicles();
    state.scene.add(vehicles);
    state.sceneObjects.push(vehicles);

    var craters = createCraters();
    state.scene.add(craters);
    state.sceneObjects.push(craters);

    for (var i = 0; i < 4; i++) {
      var sign = createRadiationWarningSign();
      sign.position.set(-35 + i * 20, 0, -35);
      state.scene.add(sign);
      state.sceneObjects.push(sign);
    }

    var particles = createParticleEffect();
    state.scene.add(particles);
    particles.children.forEach(function(child) {
      state.sceneObjects.push(child);
    });

    var fog = createToxicFog();
    state.scene.add(fog);
    state.sceneObjects.push(fog);

    var enemy1 = createMutantScavenger(-25, -25);
    state.scene.add(enemy1);
    state.sceneObjects.push(enemy1);

    var enemy2 = createHazmatSoldier(25, 25);
    state.scene.add(enemy2);
    state.sceneObjects.push(enemy2);

    var enemy3 = createMutantScavenger(35, -35);
    state.scene.add(enemy3);
    state.sceneObjects.push(enemy3);

    var lightAmbient = new THREE.AmbientLight(0xCCFF00, 0.6);
    state.scene.add(lightAmbient);
    state.sceneObjects.push(lightAmbient);

    var lightDirectional = new THREE.DirectionalLight(0xCCFF00, 0.8);
    lightDirectional.position.set(50, 50, 50);
    state.scene.add(lightDirectional);
    state.sceneObjects.push(lightDirectional);
  };

  var update = function(delta) {
    updateRadiation(delta);
    updateToxicGlow(delta);
    updateParticles(delta);
    updateHUD();

    state.sceneObjects.forEach(function(obj) {
      if (obj.userData && obj.userData.enemyType) {
        obj.userData.walkCycle += delta * 4;
        var armLeft = obj.children[2];
        var armRight = obj.children[3];
        if (armLeft) {
          armLeft.rotation.x = Math.sin(obj.userData.walkCycle) * 0.4;
        }
        if (armRight) {
          armRight.rotation.x = Math.sin(obj.userData.walkCycle + Math.PI) * 0.4;
        }
      }
    });
  };

  var reset = function() {
    state.sceneObjects.forEach(function(obj) {
      if (state.scene && state.scene.children.indexOf(obj) !== -1) {
        state.scene.remove(obj);
      }
    });

    state.sceneObjects = [];
    state.isActive = false;
    state.radiation = 45;
    state.samplesCollected = 0;
    state.mutantsKilled = 0;
    state.elapsedTime = 0;

    if (state.hudElement && state.hudElement.parentNode) {
      state.hudElement.parentNode.removeChild(state.hudElement);
      state.hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyDown);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
