window.CombatHospital = (function() {
  'use strict';

  var scene, camera;
  var hudElement;
  var gameState = {
    casualties: 6,
    medicsActive: 4,
    medevacStatus: 'INBOUND',
    time: 0,
    helicopter: null,
    mortarImpact: null,
    medics: [],
    soldiers: [],
    ivDrips: [],
    generator: null
  };

  var lastHKeyTime = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Build all 16+ scene elements
    buildFieldHospitalGround();
    buildMainSurgicalTent();
    buildRecoveryWardTent();
    buildWoundedSoldiers();
    buildMedicFigures();
    buildArmedEscortSoldiers();
    buildMedevacHelicopter();
    buildMortarCraters();
    buildMedicalSupplyPallets();
    buildTriageArea();
    buildGenerator();
    buildFieldOperatingTable();
    buildBloodTransfusionRacks();
    buildMortarBlastEffect();
    buildDefibrillatorCart();
    buildPerimeterSandbagWall();

    createHUD();
    setupKeyboardControls();
  }

  function buildFieldHospitalGround() {
    var groundGeometry = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMaterial = new THREE.MeshPhongMaterial({ color: 0xc8a060 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function buildMainSurgicalTent() {
    // Tent body
    var tentGeometry = new THREE.BoxGeometry(30, 5, 20);
    var tentMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(-30, 2.5, -50);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);

    // Red cross on roof
    var crossVertical = new THREE.BoxGeometry(0.5, 8, 0.5);
    var crossMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var crossV = new THREE.Mesh(crossVertical, crossMaterial);
    crossV.position.set(-30, 6, -50);
    scene.add(crossV);

    var crossHorizontal = new THREE.BoxGeometry(8, 0.5, 0.5);
    var crossH = new THREE.Mesh(crossHorizontal, crossMaterial);
    crossH.position.set(-30, 6, -50);
    scene.add(crossH);
  }

  function buildRecoveryWardTent() {
    var tentGeometry = new THREE.BoxGeometry(25, 4, 18);
    var tentMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(30, 2, 40);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);

    // Red cross marker
    var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 0.5), new THREE.MeshPhongMaterial({ color: 0xff0000 }));
    crossV.position.set(30, 5, 40);
    scene.add(crossV);
  }

  function buildWoundedSoldiers() {
    var positions = [
      { pos: [-50, 0.5, -40], rot: 0 },
      { pos: [-40, 0.5, -45], rot: 0.3 },
      { pos: [-35, 0.5, -35], rot: -0.2 },
      { pos: [10, 0.5, 50], rot: 0.1 },
      { pos: [20, 0.5, 48], rot: -0.1 },
      { pos: [25, 0.5, 55], rot: 0.2 }
    ];

    positions.forEach(function(p, idx) {
      var bodyGeometry = new THREE.BoxGeometry(1.5, 0.3, 4);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(p.pos[0], p.pos[1], p.pos[2]);
      body.rotation.z = p.rot;
      body.castShadow = true;
      scene.add(body);

      // Stretcher under soldier
      var stretcherGeometry = new THREE.BoxGeometry(2, 0.1, 4.5);
      var stretcherMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
      var stretcher = new THREE.Mesh(stretcherGeometry, stretcherMaterial);
      stretcher.position.set(p.pos[0], p.pos[1] - 0.3, p.pos[2]);
      scene.add(stretcher);

      gameState.soldiers.push(body);
    });
  }

  function buildMedicFigures() {
    var positions = [
      [-45, 0, -40],
      [-35, 0, -50],
      [15, 0, 50],
      [28, 0, 45]
    ];

    positions.forEach(function(pos) {
      // Body
      var bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos[0], pos[1] + 0.75, pos[2]);
      body.castShadow = true;
      scene.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcb9a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos[0], pos[1] + 1.7, pos[2]);
      scene.add(head);

      // Red cross armband
      var armbandGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.2);
      var armbandMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      var armband = new THREE.Mesh(armbandGeometry, armbandMaterial);
      armband.position.set(pos[0], pos[1] + 0.9, pos[2] + 0.4);
      scene.add(armband);

      gameState.medics.push(body);
    });
  }

  function buildArmedEscortSoldiers() {
    var positions = [
      [-80, 0, 0],
      [80, 0, 0],
      [0, 0, -100]
    ];

    positions.forEach(function(pos) {
      // Body (camouflage color)
      var bodyGeometry = new THREE.BoxGeometry(1, 1.8, 0.5);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x556b2f });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos[0], pos[1] + 0.9, pos[2]);
      body.castShadow = true;
      scene.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcb9a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos[0], pos[1] + 1.9, pos[2]);
      scene.add(head);

      // Rifle (thin box)
      var rifleGeometry = new THREE.BoxGeometry(0.15, 0.15, 2);
      var rifleMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
      var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
      rifle.position.set(pos[0] + 0.6, pos[1] + 1.2, pos[2] - 0.5);
      rifle.rotation.z = Math.PI / 4;
      scene.add(rifle);
    });
  }

  function buildMedevacHelicopter() {
    var helicopterGroup = new THREE.Group();
    helicopterGroup.position.set(0, 60, 50);

    // Body
    var bodyGeometry = new THREE.BoxGeometry(4, 3, 8);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    helicopterGroup.add(body);

    // Red cross marking on body
    var crossGeometry = new THREE.BoxGeometry(2, 0.2, 2);
    var crossMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var cross = new THREE.Mesh(crossGeometry, crossMaterial);
    cross.position.set(0, 1.5, 0);
    helicopterGroup.add(cross);

    // Rotor disc
    var rotorGeometry = new THREE.BoxGeometry(15, 0.2, 2);
    var rotorMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor.position.set(0, 1.5, 0);
    rotor.name = 'rotor';
    helicopterGroup.add(rotor);

    // Landing skids
    var skidGeometry = new THREE.BoxGeometry(0.2, 2, 8);
    var skidMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var skid = new THREE.Mesh(skidGeometry, skidMaterial);
    skid.position.set(0, -1.5, 0);
    helicopterGroup.add(skid);

    scene.add(helicopterGroup);
    gameState.helicopter = helicopterGroup;
  }

  function buildMortarCraters() {
    var positions = [
      [-70, 0.05, 70],
      [60, 0.05, -80],
      [-20, 0.05, -120]
    ];

    positions.forEach(function(pos) {
      var craterGeometry = new THREE.BoxGeometry(12, 0.1, 12);
      var craterMaterial = new THREE.MeshPhongMaterial({ color: 0x3d3d3d });
      var crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.position.set(pos[0], pos[1], pos[2]);
      scene.add(crater);
    });
  }

  function buildMedicalSupplyPallets() {
    var positions = [
      [-60, 0, -30],
      [-50, 0, -25],
      [-40, 0, -35],
      [50, 0, 60],
      [55, 0, 65],
      [45, 0, 70],
      [-10, 0, 80],
      [10, 0, 85]
    ];

    positions.forEach(function(pos) {
      var palletGeometry = new THREE.BoxGeometry(2, 2, 2);
      var palletMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
      var pallet = new THREE.Mesh(palletGeometry, palletMaterial);
      pallet.position.set(pos[0], pos[1] + 1, pos[2]);
      pallet.castShadow = true;
      scene.add(pallet);

      // Red cross marking
      var markGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
      var markMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      var mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.set(pos[0], pos[1] + 2.1, pos[2]);
      scene.add(mark);
    });
  }

  function buildTriageArea() {
    var flags = [
      { color: 0xff0000, label: 'Critical' },
      { color: 0xffff00, label: 'Urgent' },
      { color: 0x00ff00, label: 'Stable' }
    ];

    flags.forEach(function(flag, idx) {
      // Flag pole
      var poleGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
      var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(-80 + idx * 15, 1.5, 80);
      scene.add(pole);

      // Flag
      var flagGeometry = new THREE.BoxGeometry(2, 1, 0.1);
      var flagMaterial = new THREE.MeshPhongMaterial({ color: flag.color });
      var flagMesh = new THREE.Mesh(flagGeometry, flagMaterial);
      flagMesh.position.set(-80 + idx * 15 + 1.2, 2.5, 80);
      scene.add(flagMesh);
    });
  }

  function buildGenerator() {
    // Main generator box
    var genGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
    var genMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    var generator = new THREE.Mesh(genGeometry, genMaterial);
    generator.position.set(-70, 1, 30);
    generator.castShadow = true;
    generator.name = 'generator';
    scene.add(generator);

    // Exhaust cylinder
    var exhaustGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    var exhaustMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(-70, 3.5, 30);
    scene.add(exhaust);

    gameState.generator = generator;
  }

  function buildFieldOperatingTable() {
    // Table surface
    var tableGeometry = new THREE.BoxGeometry(4, 0.3, 2);
    var tableMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(-30, 1.5, -35);
    table.castShadow = true;
    scene.add(table);

    // Overhead light
    var lightGeometry = new THREE.BoxGeometry(3, 0.3, 3);
    var lightMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff99,
      emissive: 0xffff66,
      emissiveIntensity: 0.8
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(-30, 4, -35);
    scene.add(light);

    // Support arm
    var armGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
    var armMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(-32, 2.75, -35);
    scene.add(arm);
  }

  function buildBloodTransfusionRacks() {
    var positions = [
      [-50, 0, -35],
      [-45, 0, -45],
      [20, 0, 50],
      [30, 0, 55]
    ];

    positions.forEach(function(pos) {
      // Pole
      var poleGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
      var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos[0], pos[1] + 1.5, pos[2]);
      scene.add(pole);

      // IV bag
      var bagGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
      var bagMaterial = new THREE.MeshPhongMaterial({ color: 0xff6b6b });
      var bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(pos[0], pos[1] + 3.2, pos[2]);
      bag.name = 'ivBag_' + positions.indexOf(pos);
      scene.add(bag);

      gameState.ivDrips.push(bag);
    });
  }

  function buildMortarBlastEffect() {
    var blastGroup = new THREE.Group();
    blastGroup.position.set(60, 2, -80);
    blastGroup.name = 'mortarImpact';

    for (var i = 0; i < 4; i++) {
      var smokeGeometry = new THREE.BoxGeometry(3 + i, 3 + i, 3 + i);
      var smokeMaterial = new THREE.MeshPhongMaterial({
        color: 0xff8800,
        emissive: 0xff6600,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.6 - i * 0.1
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(0, i, 0);
      blastGroup.add(smoke);
    }

    scene.add(blastGroup);
    gameState.mortarImpact = blastGroup;
  }

  function buildDefibrillatorCart() {
    // Cart body
    var cartGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var cartMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var cart = new THREE.Mesh(cartGeometry, cartMaterial);
    cart.position.set(-25, 0.5, -45);
    cart.castShadow = true;
    scene.add(cart);

    // Equipment box on top
    var equipGeometry = new THREE.BoxGeometry(1, 0.6, 0.8);
    var equipMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var equip = new THREE.Mesh(equipGeometry, equipMaterial);
    equip.position.set(-25, 1.8, -45);
    scene.add(equip);

    // Defibrillator display (small bright box)
    var displayGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.1);
    var displayMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      emissiveIntensity: 0.8
    });
    var display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.set(-25, 2.2, -44.5);
    scene.add(display);
  }

  function buildPerimeterSandbagWall() {
    var positions = [
      [-100, 0, -100],
      [-100, 0, 100],
      [100, 0, -100],
      [100, 0, 100],
      [-100, 0, 0],
      [100, 0, 0],
      [0, 0, -100],
      [0, 0, 100]
    ];

    positions.forEach(function(pos) {
      // Stack of sandbags
      for (var y = 0; y < 2; y++) {
        var bagGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
        var bagMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
        var bag = new THREE.Mesh(bagGeometry, bagMaterial);
        bag.position.set(pos[0], pos[1] + 0.4 + y * 0.8, pos[2]);
        bag.castShadow = true;
        scene.add(bag);
      }
    });
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'absolute';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '100';
    hudElement.style.whiteSpace = 'pre';
    hudElement.id = 'combatHospitalHUD';
    updateHUD();
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.textContent = 'CASUALTIES: ' + gameState.casualties + '\n' +
                               'MEDICS ACTIVE: ' + gameState.medicsActive + '\n' +
                               'MEDEVAC: ' + gameState.medevacStatus;
    }
  }

  function setupKeyboardControls() {
    document.addEventListener('keydown', function(event) {
      if (event.key === 'h' || event.key === 'H') {
        var now = Date.now();
        if (now - lastHKeyTime < 400) {
          toggleHUD();
          lastHKeyTime = 0;
        } else {
          lastHKeyTime = now;
        }
      }
    });
  }

  function toggleHUD() {
    if (hudElement) {
      hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  function update(delta) {
    gameState.time += delta;

    // Helicopter descends and rotor slows
    if (gameState.helicopter) {
      gameState.helicopter.position.y = Math.max(8, 60 - gameState.time * 5);
      var rotor = gameState.helicopter.children.find(function(c) { return c.name === 'rotor'; });
      if (rotor) {
        rotor.rotation.z -= (10 - gameState.time) * delta;
      }
    }

    // Medics move between patients
    gameState.medics.forEach(function(medic, idx) {
      medic.position.x += Math.sin(gameState.time + idx) * 0.01;
      medic.position.z += Math.cos(gameState.time + idx) * 0.01;
    });

    // Mortar impact effect pulses
    if (gameState.mortarImpact) {
      var pulseFactor = 1 + Math.sin(gameState.time * 4) * 0.2;
      gameState.mortarImpact.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }

    // Generator vibrates
    if (gameState.generator) {
      gameState.generator.position.x += Math.sin(gameState.time * 8) * 0.002;
      gameState.generator.position.y += Math.sin(gameState.time * 12) * 0.001;
    }

    // IV drip bags oscillate
    gameState.ivDrips.forEach(function(bag, idx) {
      bag.position.y += Math.sin(gameState.time * 3 + idx) * 0.002;
    });
  }

  function reset() {
    gameState.time = 0;
    gameState.casualties = 6;
    gameState.medicsActive = 4;
    gameState.medevacStatus = 'INBOUND';

    if (gameState.helicopter) {
      gameState.helicopter.position.y = 60;
      var rotor = gameState.helicopter.children.find(function(c) { return c.name === 'rotor'; });
      if (rotor) {
        rotor.rotation.z = 0;
      }
    }

    gameState.medics.forEach(function(medic) {
      medic.position.x = medic.userData.startX || medic.position.x;
      medic.position.z = medic.userData.startZ || medic.position.z;
    });

    if (gameState.mortarImpact) {
      gameState.mortarImpact.scale.set(1, 1, 1);
    }

    if (gameState.generator) {
      gameState.generator.position.x = -70;
      gameState.generator.position.y = 1;
    }

    gameState.ivDrips.forEach(function(bag) {
      bag.position.y = bag.userData.startY || bag.position.y;
    });

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
