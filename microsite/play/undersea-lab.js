window.UnderseaLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var labObjects = [];
  var enemies = [];
  var particleSystems = [];
  var animationState = {};

  var COLORS = {
    deepWater: 0x002244,
    labWhite: 0xF0F0FF,
    specimenGreen: 0x22AA44,
    reactorOrange: 0xFF8800,
    pressureRed: 0xFF2200,
    coralPink: 0xFF6699,
    darkGreen: 0x0A3A2A,
    metalGray: 0x444444
  };

  var spawnPoints = [
    { name: 'mainModule', x: 0, y: 5, z: 0 },
    { name: 'specimenLab', x: 15, y: 3, z: 10 },
    { name: 'airlock', x: -20, y: 5, z: 0 },
    { name: 'escapePod', x: 0, y: 2, z: -25 }
  ];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    labObjects = [];
    enemies = [];
    particleSystems = [];
    animationState = {
      bubblePhase: 0,
      reactorPulse: 0,
      airlockCycle: 0,
      warningFlash: 0,
      pressureWarning: false
    };

    buildMainHabitatModule();
    buildPressurizedCorridors();
    buildObservationDome();
    buildAirlockChamber();
    buildSpecimenTanks();
    buildResearchBenches();
    buildPressureMonitors();
    buildEscapePodBay();
    buildExteriorLighting();
    buildCoralFormations();
    buildReactorCore();
    buildAnchorCables();
    buildOceanFloor();
    spawnEnemies();
  }

  function buildMainHabitatModule() {
    var geometry = new THREE.CylinderGeometry(8, 8, 20, 32);
    var material = new THREE.MeshStandardMaterial({ color: COLORS.labWhite, metalness: 0.3, roughness: 0.4 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(0, 5, 0);
    mesh.name = 'mainHabitat';
    scene.add(mesh);
    labObjects.push(mesh);

    var capGeometry = new THREE.CylinderGeometry(8.2, 8.2, 0.5, 32);
    var capMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.7, roughness: 0.2 });
    var capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.rotation.z = Math.PI / 2;
    capMesh.position.set(11, 5, 0);
    scene.add(capMesh);
    labObjects.push(capMesh);

    var capMesh2 = new THREE.Mesh(capGeometry, capMaterial);
    capMesh2.rotation.z = Math.PI / 2;
    capMesh2.position.set(-11, 5, 0);
    scene.add(capMesh2);
    labObjects.push(capMesh2);
  }

  function buildPressurizedCorridors() {
    var corridorPositions = [
      { x: 15, y: 5, z: 0 },
      { x: -20, y: 5, z: 0 },
      { x: 0, y: 5, z: 15 }
    ];

    corridorPositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
      var material = new THREE.MeshStandardMaterial({ color: COLORS.labWhite, metalness: 0.2, roughness: 0.5 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(pos.x, pos.y, pos.z);
      scene.add(mesh);
      labObjects.push(mesh);

      var reinforcementGeometry = new THREE.CylinderGeometry(2.6, 2.6, 0.3, 16);
      var reinforcementMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.8 });
      var reinforcement = new THREE.Mesh(reinforcementGeometry, reinforcementMaterial);
      reinforcement.rotation.z = Math.PI / 2;
      reinforcement.position.set(pos.x + 6.5, pos.y, pos.z);
      scene.add(reinforcement);
      labObjects.push(reinforcement);
    });
  }

  function buildObservationDome() {
    var geometry = new THREE.SphereGeometry(6, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    var material = new THREE.MeshStandardMaterial({
      color: COLORS.labWhite,
      transparent: true,
      opacity: 0.25,
      metalness: 0.4,
      roughness: 0.1
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 12, 0);
    mesh.name = 'observationDome';
    scene.add(mesh);
    labObjects.push(mesh);

    var rimGeometry = new THREE.CylinderGeometry(6.2, 6.2, 0.4, 32);
    var rimMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.9 });
    var rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.position.set(0, 11.8, 0);
    scene.add(rimMesh);
    labObjects.push(rimMesh);
  }

  function buildAirlockChamber() {
    var chamberGeometry = new THREE.CylinderGeometry(3.5, 3.5, 8, 24);
    var chamberMaterial = new THREE.MeshStandardMaterial({ color: COLORS.labWhite, metalness: 0.3, roughness: 0.4 });
    var chamberMesh = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamberMesh.rotation.z = Math.PI / 2;
    chamberMesh.position.set(-20, 5, 0);
    chamberMesh.name = 'airlockChamber';
    scene.add(chamberMesh);
    labObjects.push(chamberMesh);

    var door1Geometry = new THREE.BoxGeometry(3.6, 7, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.pressureRed, metalness: 0.7, roughness: 0.3 });
    var door1 = new THREE.Mesh(door1Geometry, doorMaterial);
    door1.position.set(-24, 5, 0);
    door1.name = 'airlockDoor1';
    scene.add(door1);
    labObjects.push(door1);

    var door2 = new THREE.Mesh(door1Geometry, doorMaterial);
    door2.position.set(-16, 5, 0);
    door2.name = 'airlockDoor2';
    scene.add(door2);
    labObjects.push(door2);

    var cycleIndicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.pressureRed, emissive: COLORS.pressureRed, emissiveIntensity: 0.5 })
    );
    cycleIndicator.position.set(-20, 8, 0);
    cycleIndicator.name = 'airlockIndicator';
    scene.add(cycleIndicator);
    labObjects.push(cycleIndicator);
  }

  function buildSpecimenTanks() {
    var tankPositions = [
      { x: 15, y: 3, z: 8 },
      { x: 15, y: 3, z: 2 },
      { x: 15, y: 3, z: -4 },
      { x: 20, y: 3, z: 10 }
    ];

    tankPositions.forEach(function(pos, idx) {
      var tankGeometry = new THREE.BoxGeometry(3, 4, 3);
      var tankMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.labWhite,
        transparent: true,
        opacity: 0.4,
        metalness: 0.3,
        roughness: 0.2
      });
      var tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.position.set(pos.x, pos.y, pos.z);
      tankMesh.name = 'specimenTank' + idx;
      scene.add(tankMesh);
      labObjects.push(tankMesh);

      var creatureGeometry = new THREE.SphereGeometry(0.8, 16, 16);
      var creatureMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.specimenGreen,
        emissive: COLORS.specimenGreen,
        emissiveIntensity: 0.3
      });
      var creatureMesh = new THREE.Mesh(creatureGeometry, creatureMaterial);
      creatureMesh.position.set(pos.x, pos.y, pos.z);
      creatureMesh.name = 'creature' + idx;
      scene.add(creatureMesh);
      labObjects.push(creatureMesh);

      particleSystems.push({
        position: pos,
        speed: 0.02 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function buildResearchBenches() {
    var benchPositions = [
      { x: 5, y: 1, z: 8 },
      { x: -5, y: 1, z: 8 },
      { x: 10, y: 1, z: -8 }
    ];

    benchPositions.forEach(function(pos) {
      var benchGeometry = new THREE.BoxGeometry(6, 1, 2.5);
      var benchMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.6, roughness: 0.4 });
      var benchMesh = new THREE.Mesh(benchGeometry, benchMaterial);
      benchMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(benchMesh);
      labObjects.push(benchMesh);

      var panelGeometry = new THREE.BoxGeometry(5.5, 1.5, 0.3);
      var panelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.labWhite, metalness: 0.4, roughness: 0.5 });
      var panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
      panelMesh.position.set(pos.x, pos.y + 1.5, pos.z);
      scene.add(panelMesh);
      labObjects.push(panelMesh);
    });
  }

  function buildPressureMonitors() {
    var monitorPositions = [
      { x: 8, y: 8, z: 7 },
      { x: -8, y: 8, z: 7 },
      { x: 0, y: 8, z: -9 }
    ];

    monitorPositions.forEach(function(pos, idx) {
      var screenGeometry = new THREE.BoxGeometry(1.5, 2, 0.2);
      var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.5 });
      var screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
      screenMesh.position.set(pos.x, pos.y, pos.z);
      screenMesh.name = 'monitor' + idx;
      scene.add(screenMesh);
      labObjects.push(screenMesh);

      var lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.pressureRed,
        emissive: COLORS.pressureRed,
        emissiveIntensity: 0.7
      });
      var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.set(pos.x, pos.y + 0.6, pos.z + 0.15);
      scene.add(lightMesh);
      labObjects.push(lightMesh);
    });
  }

  function buildEscapePodBay() {
    var bayGeometry = new THREE.CylinderGeometry(4, 4, 6, 24);
    var bayMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.6, roughness: 0.4 });
    var bayMesh = new THREE.Mesh(bayGeometry, bayMaterial);
    bayMesh.position.set(0, 2, -25);
    bayMesh.name = 'escapePodBay';
    scene.add(bayMesh);
    labObjects.push(bayMesh);

    var podGeometry = new THREE.ConeGeometry(2, 5, 16);
    var podMaterial = new THREE.MeshStandardMaterial({ color: COLORS.pressureRed, metalness: 0.7, roughness: 0.3 });
    var podMesh = new THREE.Mesh(podGeometry, podMaterial);
    podMesh.position.set(0, 5, -25);
    podMesh.name = 'escapePod';
    scene.add(podMesh);
    labObjects.push(podMesh);
  }

  function buildExteriorLighting() {
    var lightPositions = [
      { x: 15, y: 12, z: 10 },
      { x: -15, y: 12, z: 10 },
      { x: 0, y: 12, z: -20 },
      { x: 10, y: 8, z: 0 }
    ];

    lightPositions.forEach(function(pos) {
      var lightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCDDFF,
        emissive: 0xCCDDFF,
        emissiveIntensity: 0.8
      });
      var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(lightMesh);
      labObjects.push(lightMesh);

      var threeLightSource = new THREE.PointLight(0xCCDDFF, 1, 30);
      threeLightSource.position.copy(lightMesh.position);
      scene.add(threeLightSource);
    });
  }

  function buildCoralFormations() {
    var coralPositions = [
      { x: 25, y: 0, z: 5 },
      { x: -25, y: 0, z: 8 },
      { x: 5, y: -3, z: 30 },
      { x: -10, y: -3, z: -30 },
      { x: 30, y: -1, z: -10 }
    ];

    coralPositions.forEach(function(pos) {
      var clusterSize = 2 + Math.floor(Math.random() * 3);
      for (var i = 0; i < clusterSize; i++) {
        var coralGeometry = new THREE.ConeGeometry(0.6, 2.5, 8);
        var coralMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.coralPink,
          metalness: 0.1,
          roughness: 0.7
        });
        var coralMesh = new THREE.Mesh(coralGeometry, coralMaterial);
        var offsetX = pos.x + (Math.random() - 0.5) * 2;
        var offsetZ = pos.z + (Math.random() - 0.5) * 2;
        coralMesh.position.set(offsetX, pos.y, offsetZ);
        coralMesh.rotation.z = Math.random() * 0.3;
        scene.add(coralMesh);
        labObjects.push(coralMesh);
      }
    });
  }

  function buildReactorCore() {
    var coreGeometry = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
    var coreMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.reactorOrange,
      emissive: COLORS.reactorOrange,
      emissiveIntensity: 0.6
    });
    var coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreMesh.position.set(-5, 3, 20);
    coreMesh.name = 'reactorCore';
    scene.add(coreMesh);
    labObjects.push(coreMesh);

    var coreBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.8 })
    );
    coreBase.position.set(-5, 0.5, 20);
    scene.add(coreBase);
    labObjects.push(coreBase);
  }

  function buildAnchorCables() {
    var cablePositions = [
      { x: 12, z: 0 },
      { x: -12, z: 0 },
      { x: 0, z: 15 },
      { x: 0, z: -20 }
    ];

    cablePositions.forEach(function(pos) {
      var cableGeometry = new THREE.CylinderGeometry(0.15, 0.15, 40, 8);
      var cableMaterial = new THREE.MeshStandardMaterial({ color: COLORS.metalGray, metalness: 0.7, roughness: 0.4 });
      var cableMesh = new THREE.Mesh(cableGeometry, cableMaterial);
      cableMesh.position.set(pos.x, 15, pos.z);
      scene.add(cableMesh);
      labObjects.push(cableMesh);
    });
  }

  function buildOceanFloor() {
    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkGreen,
      metalness: 0.1,
      roughness: 0.9
    });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.set(0, -5, 0);
    scene.add(floorMesh);
    labObjects.push(floorMesh);
  }

  function spawnEnemies() {
    var enemyPositions = [
      { x: 8, y: 3, z: 0 },
      { x: -8, y: 3, z: 0 },
      { x: 15, y: 3, z: 12 },
      { x: -20, y: 5, z: 5 }
    ];

    enemyPositions.forEach(function(pos, idx) {
      var enemyGeometry = new THREE.ConeGeometry(0.5, 1.8, 8);
      var enemyMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.specimenGreen,
        emissive: COLORS.specimenGreen,
        emissiveIntensity: 0.4
      });
      var enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemyMesh.position.set(pos.x, pos.y, pos.z);
      enemyMesh.name = 'enemy' + idx;
      scene.add(enemyMesh);
      enemies.push({
        mesh: enemyMesh,
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        patrolRadius: 8,
        patrolPhase: Math.random() * Math.PI * 2,
        speed: 0.02
      });
    });
  }

  function update(delta) {
    animationState.bubblePhase += delta * 1.5;
    animationState.reactorPulse += delta * 2;
    animationState.airlockCycle += delta * 0.8;
    animationState.warningFlash += delta * 2;

    updateBubbleEffects();
    updateReactorCore();
    updateAirlockCycle();
    updateWarningLights();
    updateEnemyPatrol();
    updatePressureWarning();
  }

  function updateBubbleEffects() {
    particleSystems.forEach(function(system, idx) {
      var bubbleOffset = Math.sin(animationState.bubblePhase + system.phase) * 0.5;
      var bubbleX = system.position.x + Math.cos(system.phase) * 0.8;
      var bubbleZ = system.position.z + Math.sin(system.phase + animationState.bubblePhase) * 0.5;

      if (idx < labObjects.length) {
        var creature = labObjects.find(function(obj) { return obj.name === 'creature' + idx; });
        if (creature) {
          creature.position.y = system.position.y + bubbleOffset;
          creature.rotation.x += 0.01;
          creature.rotation.y += 0.02;
        }
      }
    });
  }

  function updateReactorCore() {
    var reactor = labObjects.find(function(obj) { return obj.name === 'reactorCore'; });
    if (reactor) {
      var scale = 1 + Math.sin(animationState.reactorPulse) * 0.1;
      reactor.scale.set(scale, scale, scale);
      reactor.rotation.z += 0.01;
    }
  }

  function updateAirlockCycle() {
    var door1 = labObjects.find(function(obj) { return obj.name === 'airlockDoor1'; });
    var door2 = labObjects.find(function(obj) { return obj.name === 'airlockDoor2'; });
    var indicator = labObjects.find(function(obj) { return obj.name === 'airlockIndicator'; });

    if (door1 && door2) {
      var cycleProgress = (Math.sin(animationState.airlockCycle) + 1) / 2;
      door1.position.x = -24 - cycleProgress * 2;
      door2.position.x = -16 + cycleProgress * 2;
    }

    if (indicator) {
      indicator.material.emissiveIntensity = 0.3 + Math.sin(animationState.airlockCycle * 2) * 0.4;
    }
  }

  function updateWarningLights() {
    for (var i = 0; i < 3; i++) {
      var monitor = labObjects.find(function(obj) { return obj.name === 'monitor' + i; });
      if (monitor && monitor.children && monitor.children.length > 0) {
        var light = monitor.children[0];
        if (light) {
          light.material.emissiveIntensity = 0.4 + Math.sin(animationState.warningFlash) * 0.3;
        }
      }
    }
  }

  function updateEnemyPatrol() {
    enemies.forEach(function(enemy) {
      enemy.patrolPhase += enemy.speed;
      var newX = enemy.position.x + Math.cos(enemy.patrolPhase) * enemy.patrolRadius * 0.02;
      var newZ = enemy.position.z + Math.sin(enemy.patrolPhase) * enemy.patrolRadius * 0.02;
      enemy.mesh.position.set(newX, enemy.position.y, newZ);
      enemy.mesh.rotation.y = enemy.patrolPhase;
    });
  }

  function updatePressureWarning() {
    var pressureWarning = Math.sin(animationState.warningFlash * 3) > 0.5;
    animationState.pressureWarning = pressureWarning;
  }

  function reset() {
    labObjects.forEach(function(obj) {
      scene.remove(obj);
    });
    enemies.forEach(function(enemy) {
      scene.remove(enemy.mesh);
    });
    labObjects = [];
    enemies = [];
    particleSystems = [];
    animationState = {
      bubblePhase: 0,
      reactorPulse: 0,
      airlockCycle: 0,
      warningFlash: 0,
      pressureWarning: false
    };
  }

  function getSpawnPoints() {
    return spawnPoints;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints
  };
}());
