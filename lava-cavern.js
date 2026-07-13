var window = window || {};

window.LavaCavern = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    lavaBridgesCrossed: 0,
    maxBridges: 5,
    enemiesVaporized: 0,
    maxEnemies: 12,
    cavernTemp: 850
  };
  var lavaRiver = null;
  var gasVents = [];
  var floatingRocks = [];
  var elapsedTime = 0;
  var hudVisible = true;

  function createLavaRiver() {
    // Long flat emissive orange-red lava river
    var riverGeometry = new THREE.BoxGeometry(8, 0.8, 45);
    var riverMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.2
    });
    lavaRiver = new THREE.Mesh(riverGeometry, riverMaterial);
    lavaRiver.position.set(0, 0.4, 0);
    lavaRiver.castShadow = true;
    lavaRiver.receiveShadow = true;
    scene.add(lavaRiver);
    sceneObjects.push(lavaRiver);
    lavaRiver.lavaData = { pulseTime: 0, baseIntensity: 0.6, pulseAmount: 0.4 };
  }

  function createBasaltColumns() {
    // Dark basalt rock columns (cylinders)
    var positions = [
      [-15, 0, -15], [-8, 0, -8], [8, 0, -10], [15, 0, -5],
      [-12, 0, 5], [10, 0, 8], [-10, 0, 15], [12, 0, 18]
    ];

    positions.forEach(function(pos) {
      var columnGeometry = new THREE.CylinderGeometry(1.2, 1.5, 8, 12);
      var columnMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos[0], 4, pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      sceneObjects.push(column);
    });
  }

  function createRopeBridges() {
    // Rope bridges spanning over lava
    var positions = [
      [-12, 3.5, -20],
      [8, 3.5, -8],
      [-5, 3.5, 8],
      [10, 3.5, 15]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main bridge deck (narrow dark box)
      var deckGeometry = new THREE.BoxGeometry(1.5, 0.3, 6);
      var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.8 });
      var deck = new THREE.Mesh(deckGeometry, deckMaterial);
      deck.position.y = 0;
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);

      // Support cables (thin boxes at sides)
      var cableGeometry = new THREE.BoxGeometry(0.1, 4, 6);
      var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });

      var cable1 = new THREE.Mesh(cableGeometry, cableMaterial);
      cable1.position.set(-0.8, 2, 0);
      cable1.castShadow = true;
      cable1.receiveShadow = true;
      group.add(cable1);

      var cable2 = new THREE.Mesh(cableGeometry, cableMaterial);
      cable2.position.set(0.8, 2, 0);
      cable2.castShadow = true;
      cable2.receiveShadow = true;
      group.add(cable2);

      group.position.set(pos[0], pos[1], pos[2]);
      group.bridgeData = { swayTime: Math.random() * Math.PI * 2, swayAmount: 0.15 };
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createMagmaPools() {
    // Glowing circular magma pools
    var positions = [
      [-18, 0.2, 10],
      [14, 0.2, -12],
      [-6, 0.2, 25],
      [16, 0.2, 20]
    ];

    positions.forEach(function(pos) {
      var poolGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
      var poolMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        emissive: 0xFF8800,
        emissiveIntensity: 0.8,
        roughness: 0.5
      });
      var pool = new THREE.Mesh(poolGeometry, poolMaterial);
      pool.position.set(pos[0], pos[1], pos[2]);
      pool.castShadow = true;
      pool.receiveShadow = true;
      scene.add(pool);
      sceneObjects.push(pool);
    });
  }

  function createGasVents() {
    // Volcanic gas vent chimneys
    var positions = [
      [-20, 0, -8],
      [5, 0, -15],
      [18, 0, 5],
      [-8, 0, 18]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Vent chimney (thin cylinder)
      var ventGeometry = new THREE.CylinderGeometry(0.4, 0.6, 5, 12);
      var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.85 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.y = 2.5;
      vent.castShadow = true;
      vent.receiveShadow = true;
      group.add(vent);

      // Glow sphere at top
      var glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      var glowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF6600,
        emissiveIntensity: 0.4
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 5.2;
      glow.castShadow = true;
      glow.receiveShadow = true;
      group.add(glow);

      group.position.set(pos[0], pos[1], pos[2]);
      group.ventData = { eruptTime: 0, eruptCycle: 3, scaleBase: 1 };
      scene.add(group);
      sceneObjects.push(group);
      gasVents.push(group);
    });
  }

  function createStalactites() {
    // Hanging stalactites (inverted cones)
    var positions = [
      [-14, 18, 0],
      [6, 18, -12],
      [14, 18, 8],
      [-8, 18, 16]
    ];

    positions.forEach(function(pos) {
      var stalactiteGeometry = new THREE.ConeGeometry(0.5, 3, 8);
      var stalactiteMaterial = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.9 });
      var stalactite = new THREE.Mesh(stalactiteGeometry, stalactiteMaterial);
      stalactite.position.set(pos[0], pos[1], pos[2]);
      stalactite.rotation.z = Math.PI;
      stalactite.castShadow = true;
      stalactite.receiveShadow = true;
      scene.add(stalactite);
      sceneObjects.push(stalactite);
    });
  }

  function createStagmites() {
    // Upright stalagmites (cones)
    var positions = [
      [-12, 0, 8],
      [10, 0, -8],
      [16, 0, 12],
      [-6, 0, -18]
    ];

    positions.forEach(function(pos) {
      var stalagmiteGeometry = new THREE.ConeGeometry(0.6, 3.5, 8);
      var stalagmiteMaterial = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.9 });
      var stalagmite = new THREE.Mesh(stalagmiteGeometry, stalagmiteMaterial);
      stalagmite.position.set(pos[0], 1.75, pos[2]);
      stalagmite.castShadow = true;
      stalagmite.receiveShadow = true;
      scene.add(stalagmite);
      sceneObjects.push(stalagmite);
    });
  }

  function createAncientPillars() {
    // Stone pillars from ruins
    var positions = [
      [-18, 0, 12],
      [15, 0, -15],
      [-5, 0, -22]
    ];

    positions.forEach(function(pos) {
      var pillarGeometry = new THREE.CylinderGeometry(0.8, 1, 6, 8);
      var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85 });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos[0], 3, pos[2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      sceneObjects.push(pillar);
    });
  }

  function createObsidianWalls() {
    // Dark obsidian wall panels (cooling zones)
    var positions = [
      [-20, 3, -5],
      [18, 3, 10]
    ];

    positions.forEach(function(pos) {
      var wallGeometry = new THREE.BoxGeometry(2, 6, 0.3);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        roughness: 0.7,
        metalness: 0.3
      });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      sceneObjects.push(wall);
    });
  }

  function createLavaWaterfall() {
    // Narrow lava waterfall (thin box)
    var waterfallGeometry = new THREE.BoxGeometry(1.5, 6, 0.4);
    var waterfallMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF5500,
      emissive: 0xFF5500,
      emissiveIntensity: 0.7,
      roughness: 0.3
    });
    var waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
    waterfall.position.set(-18, 5, 22);
    waterfall.castShadow = true;
    waterfall.receiveShadow = true;
    scene.add(waterfall);
    sceneObjects.push(waterfall);
  }

  function createEnemyFortifications() {
    // Stone walls for enemy defense
    var positions = [
      [12, 2.5, 6],
      [-14, 2.5, -10]
    ];

    positions.forEach(function(pos) {
      var fortGeometry = new THREE.BoxGeometry(4, 5, 0.5);
      var fortMaterial = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.8 });
      var fortification = new THREE.Mesh(fortGeometry, fortMaterial);
      fortification.position.set(pos[0], pos[1], pos[2]);
      fortification.castShadow = true;
      fortification.receiveShadow = true;
      scene.add(fortification);
      sceneObjects.push(fortification);

      // Add gun ports (small boxes)
      for (var i = 0; i < 3; i++) {
        var portGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.2);
        var portMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.95 });
        var port = new THREE.Mesh(portGeometry, portMaterial);
        port.position.set(pos[0] - 1.2 + i * 1.2, pos[1] + 1.5, pos[2] - 0.3);
        port.castShadow = true;
        scene.add(port);
        sceneObjects.push(port);
      }
    });
  }

  function createPressureGauges() {
    // Instruments on walls (small boxes with emissive lights)
    var positions = [
      [-15, 5, -3],
      [10, 5, 12],
      [-8, 5, -15]
    ];

    positions.forEach(function(pos) {
      var gaugeGeometry = new THREE.BoxGeometry(0.6, 1, 0.3);
      var gaugeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFCC00,
        emissive: 0xFFCC00,
        emissiveIntensity: 0.6,
        roughness: 0.5
      });
      var gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
      gauge.position.set(pos[0], pos[1], pos[2]);
      gauge.castShadow = true;
      gauge.receiveShadow = true;
      scene.add(gauge);
      sceneObjects.push(gauge);
    });
  }

  function createFloatingLavaRocks() {
    // Floating rocks that bob in lava
    for (var i = 0; i < 8; i++) {
      var rockGeometry = new THREE.BoxGeometry(
        0.6 + Math.random() * 0.4,
        0.5 + Math.random() * 0.3,
        0.5 + Math.random() * 0.4
      );
      var rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x663300,
        roughness: 0.9
      });
      var rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        Math.random() * 6 - 3,
        0.8,
        Math.random() * 40 - 20
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      sceneObjects.push(rock);
      floatingRocks.push({
        mesh: rock,
        bobTime: Math.random() * Math.PI * 2,
        bobAmplitude: 0.3 + Math.random() * 0.2,
        bobSpeed: 2 + Math.random() * 1
      });
    }
  }

  function createEnemies() {
    // Magma creatures and enemy units
    var positions = [
      [-10, 0, -8],
      [8, 0, 5],
      [-5, 0, 12],
      [12, 0, -12],
      [0, 0, -18],
      [-15, 0, 8],
      [10, 0, 18],
      [5, 0, -5],
      [-12, 0, 15],
      [14, 0, 8],
      [-8, 0, -15],
      [2, 0, 10]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body (hot orange-red box)
      var bodyGeometry = new THREE.BoxGeometry(0.7, 1.6, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        roughness: 0.7
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.8;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head (dark sphere)
      var headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x440000,
        roughness: 0.8
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2;
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

  function createCavernFloor() {
    // Dark rocky cavern floor
    var floorGeometry = new THREE.BoxGeometry(50, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      roughness: 0.95
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function createCavernCeiling() {
    // Cavern ceiling
    var ceilingGeometry = new THREE.BoxGeometry(50, 1, 50);
    var ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0D0D0D,
      roughness: 0.95
    });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 19.5;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    sceneObjects.push(ceiling);
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'LAVA CAVERN INFILTRATION\n' +
                  'BRIDGES CROSSED: ' + gameState.lavaBridgesCrossed + '/' + gameState.maxBridges + '\n' +
                  'ENEMIES VAPORIZED: ' + gameState.enemiesVaporized + '/' + gameState.maxEnemies + '\n' +
                  'CAVERN TEMP: ' + gameState.cavernTemp + '°C';
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    if (event.key === 'a' || event.key === 'A') {
      event.cavernAKey = true;
    }
    if (event.key === 'o' || event.key === 'O') {
      if (event.cavernAKey) {
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
    floatingRocks = [];
    gasVents = [];
    elapsedTime = 0;
    gameState = {
      lavaBridgesCrossed: 0,
      maxBridges: 5,
      enemiesVaporized: 0,
      maxEnemies: 12,
      cavernTemp: 850
    };

    // Deep cavern atmosphere - dark with lava glow
    scene.background = new THREE.Color(0x0F0A08);
    scene.fog = new THREE.Fog(0x1A0F0A, 60, 100);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFF5500, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFAA44, 0.6);
    directionalLight.position.set(15, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all objects
    createCavernFloor();
    createCavernCeiling();
    createLavaRiver();
    createBasaltColumns();
    createRopeBridges();
    createMagmaPools();
    createGasVents();
    createStalactites();
    createStagmites();
    createAncientPillars();
    createObsidianWalls();
    createLavaWaterfall();
    createEnemyFortifications();
    createPressureGauges();
    createFloatingLavaRocks();
    createEnemies();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'lava-cavern-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#FF6600';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(255,102,0,0.7)';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    // Key listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Lava surface pulsing
    if (lavaRiver) {
      lavaRiver.lavaData.pulseTime += delta;
      var pulseIntensity = lavaRiver.lavaData.baseIntensity +
        Math.sin(lavaRiver.lavaData.pulseTime * 2) * lavaRiver.lavaData.pulseAmount;
      lavaRiver.material.emissiveIntensity = pulseIntensity;
    }

    // Gas vents erupting
    gasVents.forEach(function(vent) {
      vent.ventData.eruptTime += delta;
      var eruptPhase = (vent.ventData.eruptTime % vent.ventData.eruptCycle) / vent.ventData.eruptCycle;
      var eruptScale = vent.ventData.scaleBase + Math.sin(eruptPhase * Math.PI) * 0.5;
      vent.children[1].scale.set(eruptScale, eruptScale, eruptScale);
    });

    // Bridges swaying
    sceneObjects.forEach(function(obj) {
      if (obj.bridgeData) {
        obj.bridgeData.swayTime += delta;
        var swayAngle = Math.sin(obj.bridgeData.swayTime * 1.5) * obj.bridgeData.swayAmount;
        obj.rotation.z = swayAngle;
      }
    });

    // Floating lava rocks bobbing
    floatingRocks.forEach(function(rock) {
      rock.bobTime += delta * rock.bobSpeed;
      var bobOffset = Math.sin(rock.bobTime) * rock.bobAmplitude;
      rock.mesh.position.y = 0.8 + bobOffset;
    });

    // Random progress
    if (Math.random() < 0.008) {
      if (gameState.lavaBridgesCrossed < gameState.maxBridges) {
        gameState.lavaBridgesCrossed += 1;
      }
    }

    if (Math.random() < 0.012) {
      if (gameState.enemiesVaporized < gameState.maxEnemies) {
        gameState.enemiesVaporized += 1;
      }
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove enemies
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });

    sceneObjects = [];
    enemies = [];
    floatingRocks = [];
    gasVents = [];
    lavaRiver = null;
    elapsedTime = 0;
    gameState = {
      lavaBridgesCrossed: 0,
      maxBridges: 5,
      enemiesVaporized: 0,
      maxEnemies: 12,
      cavernTemp: 850
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
