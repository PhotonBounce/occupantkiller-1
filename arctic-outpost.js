var window = window || {};

window.ArcticOutpost = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    sectorsCleared: 0,
    maxSectors: 4,
    spetsnazDown: 0,
    maxSpetsnaz: 10,
    temperature: -55
  };
  var radarDome = null;
  var flagPole = null;
  var blizzardParticles = [];
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastOKeyTime = 0;
  var hudVisible = true;

  function createHabitatPods() {
    // Main modular habitat complex
    var pod1Geometry = new THREE.BoxGeometry(3, 3, 4);
    var pod1Material = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.6 });
    var pod1 = new THREE.Mesh(pod1Geometry, pod1Material);
    pod1.position.set(-8, 1.5, -5);
    pod1.castShadow = true;
    pod1.receiveShadow = true;
    scene.add(pod1);
    sceneObjects.push(pod1);

    var pod2Geometry = new THREE.BoxGeometry(3, 3, 4);
    var pod2Material = new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.6 });
    var pod2 = new THREE.Mesh(pod2Geometry, pod2Material);
    pod2.position.set(-8, 1.5, 3);
    pod2.castShadow = true;
    pod2.receiveShadow = true;
    scene.add(pod2);
    sceneObjects.push(pod2);

    var pod3Geometry = new THREE.BoxGeometry(3, 3, 4);
    var pod3Material = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.6 });
    var pod3 = new THREE.Mesh(pod3Geometry, pod3Material);
    pod3.position.set(0, 1.5, -5);
    pod3.castShadow = true;
    pod3.receiveShadow = true;
    scene.add(pod3);
    sceneObjects.push(pod3);

    var pod4Geometry = new THREE.BoxGeometry(3, 3, 4);
    var pod4Material = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.6 });
    var pod4 = new THREE.Mesh(pod4Geometry, pod4Material);
    pod4.position.set(0, 1.5, 3);
    pod4.castShadow = true;
    pod4.receiveShadow = true;
    scene.add(pod4);
    sceneObjects.push(pod4);

    // Connecting corridors
    var corridorGeometry = new THREE.BoxGeometry(1, 2.5, 2);
    var corridorMaterial = new THREE.MeshStandardMaterial({ color: 0xD0D0D0, roughness: 0.7 });

    var corridor1 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor1.position.set(-4, 1.25, -5);
    corridor1.castShadow = true;
    corridor1.receiveShadow = true;
    scene.add(corridor1);
    sceneObjects.push(corridor1);

    var corridor2 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor2.position.set(-4, 1.25, 3);
    corridor2.castShadow = true;
    corridor2.receiveShadow = true;
    scene.add(corridor2);
    sceneObjects.push(corridor2);

    var corridor3 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor3.position.set(-8, 1.25, -0.5);
    corridor3.rotation.z = Math.PI / 2;
    corridor3.castShadow = true;
    corridor3.receiveShadow = true;
    scene.add(corridor3);
    sceneObjects.push(corridor3);
  }

  function createIceRunway() {
    // Large flat white ice runway
    var runwayGeometry = new THREE.BoxGeometry(15, 0.3, 40);
    var runwayMaterial = new THREE.MeshStandardMaterial({ color: 0xF8F8FF, roughness: 0.8 });
    var runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.position.set(12, 0.15, 0);
    runway.castShadow = true;
    runway.receiveShadow = true;
    scene.add(runway);
    sceneObjects.push(runway);

    // Runway markings (thin lines)
    var lineGeometry = new THREE.BoxGeometry(0.2, 0.05, 40);
    var lineMaterial = new THREE.MeshStandardMaterial({ color: 0xA0A0A0, roughness: 0.9 });
    var line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.position.set(8, 0.2, 0);
    scene.add(line1);
    sceneObjects.push(line1);

    var line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.position.set(16, 0.2, 0);
    scene.add(line2);
    sceneObjects.push(line2);
  }

  function createWeatherStation() {
    // Tall mast (cylinder)
    var mastGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.3 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(6, 4, 8);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    sceneObjects.push(mast);

    // Instrument boxes at top
    var instGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    var instMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });

    var inst1 = new THREE.Mesh(instGeometry, instMaterial);
    inst1.position.set(5, 8.5, 8);
    inst1.castShadow = true;
    inst1.receiveShadow = true;
    scene.add(inst1);
    sceneObjects.push(inst1);

    var inst2 = new THREE.Mesh(instGeometry, instMaterial);
    inst2.position.set(7, 8.5, 8);
    inst2.castShadow = true;
    inst2.receiveShadow = true;
    scene.add(inst2);
    sceneObjects.push(inst2);

    var inst3 = new THREE.Mesh(instGeometry, instMaterial);
    inst3.position.set(6, 8.5, 6.5);
    inst3.castShadow = true;
    inst3.receiveShadow = true;
    scene.add(inst3);
    sceneObjects.push(inst3);
  }

  function createRadarDome() {
    // Large sphere radar dome on box base
    var baseGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(-15, 0.25, 8);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    sceneObjects.push(base);

    // Large radar dome
    var domeGeometry = new THREE.SphereGeometry(2.5, 32, 32);
    var domeMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCC00, metalness: 0.6, roughness: 0.4 });
    radarDome = new THREE.Mesh(domeGeometry, domeMaterial);
    radarDome.position.set(-15, 2.8, 8);
    radarDome.castShadow = true;
    radarDome.receiveShadow = true;
    scene.add(radarDome);
    sceneObjects.push(radarDome);
    radarDome.radarData = { rotationSpeed: 0.5 };
  }

  function createFuelStorageTanks() {
    // Large cylinders for fuel storage
    var tankGeometry = new THREE.CylinderGeometry(1, 1, 3, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4500, roughness: 0.7 });

    var tank1 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank1.position.set(-5, 1.5, 12);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);
    sceneObjects.push(tank1);

    var tank2 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank2.position.set(-2, 1.5, 12);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
    sceneObjects.push(tank2);

    var tank3 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank3.position.set(1, 1.5, 12);
    tank3.castShadow = true;
    tank3.receiveShadow = true;
    scene.add(tank3);
    sceneObjects.push(tank3);

    // Support frame for tanks
    var frameGeometry = new THREE.BoxGeometry(8, 0.3, 2);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-2, 0.15, 12);
    scene.add(frame);
    sceneObjects.push(frame);
  }

  function createSnowcat() {
    var group = new THREE.Group();

    // Main body
    var bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin
    var cabinGeometry = new THREE.BoxGeometry(1.8, 1.2, 1.8);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.3, -0.5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Tracks (flat boxes on sides)
    var trackGeometry = new THREE.BoxGeometry(0.5, 0.6, 4);
    var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    var track1 = new THREE.Mesh(trackGeometry, trackMaterial);
    track1.position.set(-1.2, 0.3, 0);
    track1.castShadow = true;
    track1.receiveShadow = true;
    group.add(track1);

    var track2 = new THREE.Mesh(trackGeometry, trackMaterial);
    track2.position.set(1.2, 0.3, 0);
    track2.castShadow = true;
    track2.receiveShadow = true;
    group.add(track2);

    group.position.set(8, 0, -15);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFlagPole() {
    var group = new THREE.Group();

    // Pole (cylinder)
    var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 5, 12);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Russian flag (red emissive flat box)
    var flagGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.1);
    var flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.8,
      roughness: 0.5
    });
    flagPole = new THREE.Mesh(flagGeometry, flagMaterial);
    flagPole.position.set(0.7, 4.2, 0);
    flagPole.castShadow = true;
    flagPole.receiveShadow = true;
    group.add(flagPole);
    flagPole.flagData = { waveTime: 0, waveAmplitude: 0.3 };

    group.position.set(-20, 0, 15);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createBlizzardParticles() {
    // Snow/blizzard particles (spheres)
    var particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    var particleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0x999999, roughness: 0.9 });

    for (var i = 0; i < 150; i++) {
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        Math.random() * 60 - 30,
        Math.random() * 20 + 5,
        Math.random() * 60 - 30
      );
      particle.scale.set(0.3, 0.3, 0.3);
      particle.castShadow = true;
      particle.receiveShadow = true;
      scene.add(particle);
      sceneObjects.push(particle);
      blizzardParticles.push({
        mesh: particle,
        vx: Math.random() * 0.5 - 0.25,
        vy: -0.3 - Math.random() * 0.2,
        vz: Math.random() * 0.5 - 0.25
      });
    }
  }

  function createEnemies() {
    // Russian Spetsnaz soldiers (white box figures)
    var positions = [
      [-5, 0, -12],
      [2, 0, -10],
      [10, 0, -5],
      [-15, 0, 5],
      [5, 0, 8],
      [-10, 0, 12],
      [12, 0, 12],
      [0, 0, 15],
      [-20, 0, 10],
      [15, 0, -8]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body (white box)
      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head (white sphere)
      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xF0F0F0, roughness: 0.7 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(pos[0], pos[1], pos[2]);
      group.enemyData = { health: 100, active: true, patrolPos: pos };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    });
  }

  function createTerrain() {
    // Snow-covered ground
    var groundGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0xE8E8FF, roughness: 0.95 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);

    // Some snow drifts (boxes)
    for (var i = 0; i < 8; i++) {
      var driftGeometry = new THREE.BoxGeometry(
        4 + Math.random() * 3,
        0.5 + Math.random() * 1,
        6 + Math.random() * 4
      );
      var driftMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5FF, roughness: 0.95 });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.position.set(
        Math.random() * 80 - 40,
        0.25,
        Math.random() * 80 - 40
      );
      drift.rotation.y = Math.random() * Math.PI;
      drift.receiveShadow = true;
      scene.add(drift);
      sceneObjects.push(drift);
    }
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'OUTPOST SECTORS CLEARED: ' + gameState.sectorsCleared + '/' + gameState.maxSectors + '\n' +
                  'SPETSNAZ DOWN: ' + gameState.spetsnazDown + '/' + gameState.maxSpetsnaz + '\n' +
                  'TEMPERATURE: ' + gameState.temperature + '°C';
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    var now = Date.now();
    if (event.key === 'a' || event.key === 'A') {
      lastAKeyTime = now;
    }
    if (event.key === 'o' || event.key === 'O') {
      lastOKeyTime = now;
      if (now - lastAKeyTime < 400) {
        hudVisible = !hudVisible;
        if (hudElement) {
          hudElement.style.display = hudVisible ? 'block' : 'none';
        }
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    enemies = [];
    blizzardParticles = [];
    elapsedTime = 0;
    gameState = {
      sectorsCleared: 0,
      maxSectors: 4,
      spetsnazDown: 0,
      maxSpetsnaz: 10,
      temperature: -55
    };

    // Arctic white-out atmosphere
    scene.background = new THREE.Color(0xD0E8F2);
    scene.fog = new THREE.Fog(0xD0E8F2, 80, 120);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xB0C4DE, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all objects
    createTerrain();
    createHabitatPods();
    createIceRunway();
    createWeatherStation();
    createRadarDome();
    createFuelStorageTanks();
    createSnowcat();
    createFlagPole();
    createBlizzardParticles();
    createEnemies();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'arctic-outpost-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,0,0.5)';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    // Key listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Update blizzard particles
    blizzardParticles.forEach(function(p) {
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;

      // Wrap around
      if (p.mesh.position.x > 35) p.mesh.position.x = -35;
      if (p.mesh.position.x < -35) p.mesh.position.x = 35;
      if (p.mesh.position.y < 2) p.mesh.position.y = 25;
      if (p.mesh.position.z > 35) p.mesh.position.z = -35;
      if (p.mesh.position.z < -35) p.mesh.position.z = 35;
    });

    // Rotate radar dome
    if (radarDome) {
      radarDome.rotation.y += 0.01;
    }

    // Wave flag
    if (flagPole) {
      flagPole.flagData.waveTime += delta;
      var waveOffset = Math.sin(flagPole.flagData.waveTime * 3) * flagPole.flagData.waveAmplitude;
      flagPole.rotation.z = waveOffset;
    }

    // Randomly clear sectors and defeat enemies
    if (Math.random() < 0.01) {
      if (gameState.sectorsCleared < gameState.maxSectors) {
        gameState.sectorsCleared += 1;
      }
    }

    if (Math.random() < 0.015) {
      if (gameState.spetsnazDown < gameState.maxSpetsnaz) {
        gameState.spetsnazDown += 1;
      }
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove blizzard particles
    blizzardParticles.forEach(function(p) {
      scene.remove(p.mesh);
    });

    // Remove enemies
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });

    sceneObjects = [];
    blizzardParticles = [];
    enemies = [];
    radarDome = null;
    flagPole = null;
    elapsedTime = 0;
    gameState = {
      sectorsCleared: 0,
      maxSectors: 4,
      spetsnazDown: 0,
      maxSpetsnaz: 10,
      temperature: -55
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
