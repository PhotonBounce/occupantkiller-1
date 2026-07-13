var window = window || {};

window.ChemFactory = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    chemicalLevel: 75,
    tanksSecured: 0,
    drainsClosed: 0,
    maxTanks: 5,
    maxDrains: 4,
    explosionCount: 0
  };
  var productionVats = [];
  var mixingAgitator = null;
  var blastDoor = null;
  var warningLights = [];
  var elapsedTime = 0;
  var hudVisible = true;
  var lastAKeyTime = 0;
  var lastMKeyTime = 0;

  function createProductionVat(x, z, scale) {
    var group = new THREE.Group();

    // Main vat cylinder
    var vatGeometry = new THREE.CylinderGeometry(1.2 * scale, 1 * scale, 3 * scale, 16);
    var vatMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    var vat = new THREE.Mesh(vatGeometry, vatMaterial);
    vat.position.y = 1.5 * scale;
    vat.castShadow = true;
    vat.receiveShadow = true;
    group.add(vat);

    // Toxic chemical inside (emissive glowing green)
    var chemicalGeometry = new THREE.CylinderGeometry(1.1 * scale, 0.95 * scale, 2.5 * scale, 16);
    var chemicalMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF44,
      emissive: 0x00FF44,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.6
    });
    var chemical = new THREE.Mesh(chemicalGeometry, chemicalMaterial);
    chemical.position.y = 1.5 * scale;
    group.add(chemical);

    // Vat cap/lid
    var lidGeometry = new THREE.CylinderGeometry(1.25 * scale, 1.2 * scale, 0.3 * scale, 16);
    var lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.3
    });
    var lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.y = 3.2 * scale;
    lid.castShadow = true;
    lid.receiveShadow = true;
    group.add(lid);

    // Support legs (cylinders)
    var legGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 1 * scale, 8);
    var legMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.6,
      roughness: 0.4
    });

    var legPositions = [
      [-0.8 * scale, 0, -0.8 * scale],
      [0.8 * scale, 0, -0.8 * scale],
      [-0.8 * scale, 0, 0.8 * scale],
      [0.8 * scale, 0, 0.8 * scale]
    ];

    legPositions.forEach(function(legPos) {
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(legPos[0], legPos[1], legPos[2]);
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    });

    group.position.set(x, 0, z);
    group.vatData = {
      chemical: chemical,
      chemicalBaseScale: 1,
      bubbleIntensity: 0.5,
      bubblePhase: Math.random() * Math.PI * 2
    };

    scene.add(group);
    sceneObjects.push(group);
    productionVats.push(group);
    return group;
  }

  function createPipeNetwork() {
    // Connecting pipes between vats
    var pipePositions = [
      { start: [-6, 2, -3], end: [-2, 2, -3] },
      { start: [-2, 2, -3], end: [2, 2, -3] },
      { start: [2, 2, -3], end: [6, 2, -3] },
      { start: [-6, 2, 3], end: [-2, 2, 3] },
      { start: [2, 2, 3], end: [6, 2, 3] },
      { start: [-2, 2, -3], end: [-2, 2, 3] },
      { start: [2, 2, -3], end: [2, 2, 3] }
    ];

    pipePositions.forEach(function(pipePos) {
      var start = new THREE.Vector3(pipePos.start[0], pipePos.start[1], pipePos.start[2]);
      var end = new THREE.Vector3(pipePos.end[0], pipePos.end[1], pipePos.end[2]);
      var direction = end.clone().sub(start);
      var length = direction.length();

      var pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, length, 8);
      var pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.7,
        roughness: 0.3
      });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);

      var midpoint = start.clone().add(end).multiplyScalar(0.5);
      pipe.position.copy(midpoint);

      pipe.lookAt(end);
      pipe.rotation.x = Math.PI / 2;

      pipe.castShadow = true;
      pipe.receiveShadow = true;

      scene.add(pipe);
      sceneObjects.push(pipe);
    });
  }

  function createMixingAgitator(x, z) {
    var group = new THREE.Group();

    // Agitator shaft (central cylinder)
    var shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.2
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = 1.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Stirring blades (boxes at angles)
    var bladeGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.3);
    var bladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.7,
      roughness: 0.3
    });

    var bladePositions = [
      { y: 0.5, rotation: 0 },
      { y: 1.5, rotation: Math.PI / 2 },
      { y: 2.5, rotation: Math.PI }
    ];

    bladePositions.forEach(function(bladePos) {
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.y = bladePos.y;
      blade.rotation.y = bladePos.rotation;
      blade.castShadow = true;
      blade.receiveShadow = true;
      group.add(blade);
    });

    group.position.set(x, 0, z);
    group.agitatorData = {
      rotation: 0,
      speed: 0.08
    };

    scene.add(group);
    sceneObjects.push(group);
    mixingAgitator = group;
    return group;
  }

  function createHazmatLockers() {
    // Yellow-green hazmat suit storage lockers
    var lockerGeometry = new THREE.BoxGeometry(1, 2, 0.5);
    var lockerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      metalness: 0.6,
      roughness: 0.4
    });

    var lockerPositions = [
      [-8, 1, 6],
      [-6, 1, 6],
      [-4, 1, 6],
      [-8, 1, 7.5],
      [-6, 1, 7.5]
    ];

    lockerPositions.forEach(function(pos) {
      var locker = new THREE.Mesh(lockerGeometry, lockerMaterial);
      locker.position.set(pos[0], pos[1], pos[2]);
      locker.castShadow = true;
      locker.receiveShadow = true;
      scene.add(locker);
      sceneObjects.push(locker);
    });
  }

  function createChemicalDrums() {
    // Stacked chemical drums
    var drumGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 8);
    var drumMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      metalness: 0.5,
      roughness: 0.5
    });

    var drumPositions = [
      [6, 0.5, 6], [6.5, 0.5, 6], [7, 0.5, 6],
      [6, 1.5, 6.3], [6.5, 1.5, 6.3],
      [6.25, 2.5, 6.15]
    ];

    drumPositions.forEach(function(pos) {
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(pos[0], pos[1], pos[2]);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
      sceneObjects.push(drum);
    });
  }

  function createBlastDoor(x, z) {
    var group = new THREE.Group();

    // Door frame
    var frameGeometry = new THREE.BoxGeometry(2.5, 3, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = -0.2;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Door panel (thick metal, sliding)
    var doorGeometry = new THREE.BoxGeometry(2.3, 2.8, 0.4);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.1
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.z = 0;
    door.castShadow = true;
    door.receiveShadow = true;
    group.add(door);

    // Door handle (cylinder)
    var handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    var handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.7,
      roughness: 0.3
    });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(1, 0, 0.3);
    group.add(handle);

    group.position.set(x, 1.5, z);
    group.doorData = {
      isOpen: false,
      slideAmount: 0,
      slideDuration: 3,
      slideTimer: 0
    };

    scene.add(group);
    sceneObjects.push(group);
    blastDoor = group;
    return group;
  }

  function createControlRoom() {
    var group = new THREE.Group();

    // Window frame
    var windowFrameGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    var frame = new THREE.Mesh(windowFrameGeometry, frameMaterial);
    frame.position.z = 0;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Glass panel
    var glassGeometry = new THREE.BoxGeometry(1.4, 1.4, 0.05);
    var glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x6699FF,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.6
    });
    var glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.z = 0.15;
    group.add(glass);

    // Control panel (box below window)
    var panelGeometry = new THREE.BoxGeometry(1.6, 0.8, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.7,
      roughness: 0.3
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = -1.2;
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    group.position.set(-8, 2, -8);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createWarningLights() {
    // Red warning beacon lights
    var lightPositions = [
      [-8, 4, -8],
      [0, 4, -8],
      [8, 4, -8],
      [-8, 4, 8],
      [8, 4, 8]
    ];

    lightPositions.forEach(function(pos) {
      var light = new THREE.PointLight(0xFF0000, 1, 20);
      light.position.set(pos[0], pos[1], pos[2]);
      light.castShadow = true;
      scene.add(light);
      warningLights.push({
        light: light,
        baseIntensity: 1,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function createVentilationTower() {
    var group = new THREE.Group();

    // Tower base (tall cylinder)
    var towerGeometry = new THREE.CylinderGeometry(0.6, 0.8, 3, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.3
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 1.5;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Vent outlet (cylinder at top)
    var ventGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.8,
      roughness: 0.2
    });
    var vent = new THREE.Mesh(ventGeometry, ventMaterial);
    vent.position.y = 3.2;
    vent.castShadow = true;
    vent.receiveShadow = true;
    group.add(vent);

    // Exhaust fan (spinning blades)
    var fanGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.1, 8);
    var fanMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.7,
      roughness: 0.3
    });
    var fan = new THREE.Mesh(fanGeometry, fanMaterial);
    fan.position.y = 3.35;
    group.add(fan);

    group.position.set(10, 0, -10);
    group.ventData = {
      fanRotation: 0,
      spinSpeed: 0.12
    };

    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEmergencyShower() {
    var group = new THREE.Group();

    // Shower pole (cylinder)
    var poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.25;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    // Shower head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      metalness: 0.7,
      roughness: 0.3
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.6;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Base (box)
    var baseGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    group.position.set(-10, 0, 8);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFloorDrains() {
    // Floor drains (depressions)
    var drainGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.1, 8);
    var drainMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.5,
      roughness: 0.5
    });

    var drainPositions = [
      [-5, 0.05, -5],
      [5, 0.05, -5],
      [-5, 0.05, 5],
      [5, 0.05, 5]
    ];

    drainPositions.forEach(function(pos) {
      var drain = new THREE.Mesh(drainGeometry, drainMaterial);
      drain.position.set(pos[0], pos[1], pos[2]);
      drain.castShadow = true;
      drain.receiveShadow = true;
      scene.add(drain);
      sceneObjects.push(drain);
    });
  }

  function createCatwalkBridge() {
    var group = new THREE.Group();

    // Main walkway (box)
    var walkGeometry = new THREE.BoxGeometry(2, 0.3, 6);
    var walkMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.7,
      roughness: 0.3
    });
    var walk = new THREE.Mesh(walkGeometry, walkMaterial);
    walk.position.y = 2.5;
    walk.castShadow = true;
    walk.receiveShadow = true;
    group.add(walk);

    // Railing supports (cylinders)
    var supportGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    var supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.3
    });

    var supportPositions = [
      [-0.8, 2.2, -2],
      [0.8, 2.2, -2],
      [-0.8, 2.2, 0],
      [0.8, 2.2, 0],
      [-0.8, 2.2, 2],
      [0.8, 2.2, 2]
    ];

    supportPositions.forEach(function(pos) {
      var support = new THREE.Mesh(supportGeometry, supportMaterial);
      support.position.set(pos[0], pos[1], pos[2]);
      support.castShadow = true;
      support.receiveShadow = true;
      group.add(support);
    });

    // Railing (line segments)
    var railGeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -1, 3, -3, 1, 3, -3,
      1, 3, -3, 1, 3, 3,
      1, 3, 3, -1, 3, 3,
      -1, 3, 3, -1, 3, -3
    ]);
    railGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var railMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    var rail = new THREE.LineSegments(railGeometry, railMaterial);
    group.add(rail);

    group.position.set(0, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createWarningPlacards() {
    // Warning signs/placards
    var placard1Geometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    var placard1Material = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      metalness: 0.6,
      roughness: 0.4
    });
    var placard1 = new THREE.Mesh(placard1Geometry, placard1Material);
    placard1.position.set(-8.5, 1.5, 0);
    placard1.rotation.y = Math.PI / 2;
    placard1.castShadow = true;
    placard1.receiveShadow = true;
    scene.add(placard1);
    sceneObjects.push(placard1);

    var placard2Geometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    var placard2Material = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      metalness: 0.6,
      roughness: 0.4
    });
    var placard2 = new THREE.Mesh(placard2Geometry, placard2Material);
    placard2.position.set(8.5, 1.5, 0);
    placard2.rotation.y = Math.PI / 2;
    placard2.castShadow = true;
    placard2.receiveShadow = true;
    scene.add(placard2);
    sceneObjects.push(placard2);
  }

  function createChemicalEnemy() {
    var group = new THREE.Group();

    // Body (hazmat-suited figure, box)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.22, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      roughness: 0.7
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Respirator (small sphere on face)
    var respGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    var respMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.9
    });
    var resp = new THREE.Mesh(respGeometry, respMaterial);
    resp.position.set(0, 1.35, 0.25);
    group.add(resp);

    group.enemyData = {
      position: new THREE.Vector3(Math.random() * 14 - 7, 1, Math.random() * 14 - 7),
      speed: 0.03 + Math.random() * 0.02,
      health: 100
    };
    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function updateProductionVats(delta) {
    productionVats.forEach(function(vat) {
      var data = vat.vatData;
      var bubble = Math.sin(elapsedTime * 2 + data.bubblePhase) * 0.15 + 1;
      data.chemical.scale.y = bubble;

      var chemicalChild = vat.children[1];
      if (chemicalChild) {
        chemicalChild.scale.y = bubble;
      }

      var intensity = 0.5 + Math.sin(elapsedTime * 1.5 + data.bubblePhase) * 0.2;
      var matChild = vat.children[1];
      if (matChild && matChild.material) {
        matChild.material.emissiveIntensity = intensity;
      }
    });
  }

  function updateMixingAgitator(delta) {
    if (!mixingAgitator) return;

    var data = mixingAgitator.agitatorData;
    data.rotation += data.speed;

    mixingAgitator.children.forEach(function(child) {
      if (child instanceof THREE.Mesh && child !== mixingAgitator.children[0]) {
        child.rotation.y = data.rotation;
      }
    });
  }

  function updateWarningLights(delta) {
    warningLights.forEach(function(warning) {
      var intensity = Math.sin(elapsedTime * 3 + warning.phase) * 0.5 + 0.6;
      warning.light.intensity = warning.baseIntensity * intensity;
    });
  }

  function updateBlastDoor(delta) {
    if (!blastDoor) return;

    var data = blastDoor.doorData;
    if (data.slideTimer > 0) {
      data.slideTimer -= delta;
      var progress = 1 - (data.slideTimer / data.slideDuration);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      var slideDir = data.isOpen ? 1 : -1;
      data.slideAmount = progress * 2.5 * slideDir;

      blastDoor.children.forEach(function(child) {
        if (child instanceof THREE.Mesh && child !== blastDoor.children[0]) {
          child.position.x = data.slideAmount;
        }
      });
    }
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;
      data.position.x += (Math.sin(elapsedTime * 0.8 + data.position.x) * data.speed);
      data.position.z += data.speed * 0.5;

      if (data.position.x > 9) data.position.x = -9;
      if (data.position.x < -9) data.position.x = 9;
      if (data.position.z > 9) data.position.z = -9;
      if (data.position.z < -9) data.position.z = 9;

      enemy.position.copy(data.position);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'CHEMICAL CONTAINMENT FACILITY\n' +
                  'CHEMICAL LEVEL: ' + gameState.chemicalLevel + '%\n' +
                  'VATS SECURED: ' + gameState.tanksSecured + '/' + gameState.maxTanks + '\n' +
                  'DRAINS CLOSED: ' + gameState.drainsClosed + '/' + gameState.maxDrains + '\n' +
                  'EXPLOSIONS: ' + gameState.explosionCount;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'chem-factory-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF44; ' +
                                  'font-family: monospace; font-size: 13px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 12px; border: 2px solid #00FF44; ' +
                                  'z-index: 100; text-shadow: 0 0 8px #00FF44;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'A') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'm' || event.key.toLowerCase() === 'M') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF44; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #00FF44; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastMKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.06);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x505050, 1);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(12, 15, 12);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create facility floor (large base)
    var floorGeometry = new THREE.BoxGeometry(20, 0.5, 20);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x334422,
      roughness: 0.8
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Create facility walls
    var wallHeight = 5;
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x334422,
      roughness: 0.7
    });

    var wallGeometry1 = new THREE.BoxGeometry(20, wallHeight, 0.5);
    var wall1 = new THREE.Mesh(wallGeometry1, wallMaterial);
    wall1.position.set(0, wallHeight / 2, 10);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    sceneObjects.push(wall1);

    var wall2 = new THREE.Mesh(wallGeometry1, wallMaterial);
    wall2.position.set(0, wallHeight / 2, -10);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    sceneObjects.push(wall2);

    var wallGeometry2 = new THREE.BoxGeometry(0.5, wallHeight, 20);
    var wall3 = new THREE.Mesh(wallGeometry2, wallMaterial);
    wall3.position.set(10, wallHeight / 2, 0);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    scene.add(wall3);
    sceneObjects.push(wall3);

    var wall4 = new THREE.Mesh(wallGeometry2, wallMaterial);
    wall4.position.set(-10, wallHeight / 2, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    scene.add(wall4);
    sceneObjects.push(wall4);

    // Create production facility elements
    createProductionVat(-6, -3, 1);
    createProductionVat(-2, -3, 1);
    createProductionVat(2, -3, 1);
    createProductionVat(6, -3, 1);
    createProductionVat(0, 3, 1.2);

    createPipeNetwork();
    createMixingAgitator(0, 3.5);
    createHazmatLockers();
    createChemicalDrums();
    createBlastDoor(-9.75, 0);
    createControlRoom();
    createWarningLights();
    createVentilationTower();
    createEmergencyShower();
    createFloorDrains();
    createCatwalkBridge();
    createWarningPlacards();

    // Create enemies
    for (var i = 0; i < 3; i++) {
      createChemicalEnemy();
    }

    // Setup HUD and input
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateProductionVats(delta);
    updateMixingAgitator(delta);
    updateWarningLights(delta);
    updateBlastDoor(delta);
    updateEnemies(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    // Remove lights
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    warningLights = [];
    productionVats = [];
    mixingAgitator = null;
    blastDoor = null;
    gameState.tanksSecured = 0;
    gameState.drainsClosed = 0;
    gameState.explosionCount = 0;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
