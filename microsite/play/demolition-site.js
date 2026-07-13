window.DemolitionSite = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allObjects = [];
  var state = {
    isActive: false,
    smugglersDown: 0,
    smugglersTotal: 8,
    contrabandsFound: 0,
    contrabandsTotal: 3,
    siteSecured: false,
    demolitionEventTime: 0
  };

  var keybindState = {
    lastDKey: 0,
    lastSKey: 0,
    dKeyPressed: false
  };

  var animationState = {
    wreckingBallAngle: 0,
    excavatorArmRotation: 0,
    concreteRotation: 0,
    dustCloudScale: 1,
    lightFlashPhase: 0
  };

  function createObjectTracking(object) {
    if (object) {
      allObjects.push(object);
    }
    return object;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    allObjects = [];
    state = {
      isActive: false,
      smugglersDown: 0,
      smugglersTotal: 8,
      contrabandsFound: 0,
      contrabandsTotal: 3,
      siteSecured: false,
      demolitionEventTime: 0
    };
    keybindState = {
      lastDKey: 0,
      lastSKey: 0,
      dKeyPressed: false
    };
    animationState = {
      wreckingBallAngle: 0,
      excavatorArmRotation: 0,
      concreteRotation: 0,
      dustCloudScale: 1,
      lightFlashPhase: 0
    };

    buildScene();
    setupKeybinds();
  }

  function buildScene() {
    var brownMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var greyMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var orangeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF8C00 });
    var blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var yellowMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
    var whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var redMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    var dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xC4A078,
      transparent: true,
      opacity: 0.4
    });

    createObjectTracking(createBuilding(greyMaterial, brownMaterial, blackMaterial));
    createObjectTracking(createWreckingBall(brownMaterial, greyMaterial, blackMaterial));
    createObjectTracking(createExcavator(yellowMaterial, greyMaterial, blackMaterial));
    createObjectTracking(createConstructionTrailer(redMaterial, greyMaterial));
    createObjectTracking(createScaffoldingFrame(orangeMaterial));
    createObjectTracking(createDebrisPile(brownMaterial, greyMaterial));
    createObjectTracking(createConcreteMixer(greyMaterial, orangeMaterial));
    createObjectTracking(createPortaPottyCluster(blueMaterial || orangeMaterial, blackMaterial));
    createObjectTracking(createDumpster(greyMaterial, blackMaterial));
    createObjectTracking(createCautionTapeBarrier(yellowMaterial, blackMaterial));
    createObjectTracking(createHardHatStation(orangeMaterial, whiteMaterial, yellowMaterial));
    createObjectTracking(createAirCompressor(greyMaterial, blackMaterial));
    createObjectTracking(createJackhammer(greyMaterial, blackMaterial));
    createObjectTracking(createSiteGenerator(greyMaterial, blackMaterial, orangeMaterial));
    createObjectTracking(createDustCloud(dustMaterial));
    createObjectTracking(createSafetyNet(yellowMaterial));

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    var constructionLight1 = new THREE.PointLight(0xFF8C00, 1, 80);
    constructionLight1.position.set(-40, 30, -30);
    scene.add(constructionLight1);

    var constructionLight2 = new THREE.PointLight(0xFF8C00, 1, 80);
    constructionLight2.position.set(40, 30, 30);
    scene.add(constructionLight2);
  }

  function createBuilding(greyMaterial, brownMaterial, blackMaterial) {
    var buildingGroup = new THREE.Group();

    var mainStructure = new THREE.Mesh(
      new THREE.BoxGeometry(40, 60, 30),
      greyMaterial
    );
    mainStructure.position.set(0, 30, 0);
    buildingGroup.add(mainStructure);

    var cutoutBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(15, 20, 32),
      blackMaterial
    );
    cutoutBox1.position.set(-10, 45, 0);
    buildingGroup.add(cutoutBox1);

    var cutoutBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(15, 20, 32),
      blackMaterial
    );
    cutoutBox2.position.set(10, 25, 0);
    buildingGroup.add(cutoutBox2);

    var floorBracket1 = new THREE.Mesh(
      new THREE.BoxGeometry(42, 2, 32),
      brownMaterial
    );
    floorBracket1.position.set(0, 15, 0);
    buildingGroup.add(floorBracket1);

    var floorBracket2 = new THREE.Mesh(
      new THREE.BoxGeometry(42, 2, 32),
      brownMaterial
    );
    floorBracket2.position.set(0, 40, 0);
    buildingGroup.add(floorBracket2);

    var rubbleBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      brownMaterial
    );
    rubbleBox1.position.set(-15, 58, -12);
    rubbleBox1.rotation.z = 0.3;
    buildingGroup.add(rubbleBox1);

    var rubbleBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4, 10),
      greyMaterial
    );
    rubbleBox2.position.set(12, 62, 10);
    rubbleBox2.rotation.z = -0.4;
    buildingGroup.add(rubbleBox2);

    return buildingGroup;
  }

  function createWreckingBall(brownMaterial, greyMaterial, blackMaterial) {
    var wreckingGroup = new THREE.Group();
    wreckingGroup.name = 'wreckingBall';

    var craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 50, 8),
      greyMaterial
    );
    craneBase.position.set(-50, 25, -40);
    wreckingGroup.add(craneBase);

    var craneBoom = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 80, 8),
      brownMaterial
    );
    craneBoom.position.set(-50, 52, -40);
    craneBoom.rotation.z = Math.PI / 8;
    wreckingGroup.add(craneBoom);

    var chainGeometry = new THREE.BufferGeometry();
    var chainPositions = new Float32Array([
      -30, 35, -30,
      -25, 25, -30,
      -22, 12, -30
    ]);
    chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var chainLines = new THREE.LineSegments(chainGeometry, chainMaterial);
    wreckingGroup.add(chainLines);
    wreckingGroup.chainLines = chainLines;

    var ballGeometry = new THREE.SphereGeometry(4, 16, 16);
    var ballMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    var wreckBall = new THREE.Mesh(ballGeometry, ballMaterial);
    wreckBall.position.set(-22, 12, -30);
    wreckingGroup.add(wreckBall);
    wreckingGroup.wreckBall = wreckBall;

    return wreckingGroup;
  }

  function createExcavator(yellowMaterial, greyMaterial, blackMaterial) {
    var excavatorGroup = new THREE.Group();
    excavatorGroup.name = 'excavator';

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 14),
      yellowMaterial
    );
    body.position.set(35, 4, 20);
    excavatorGroup.add(body);

    var cabin = new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 8),
      greyMaterial
    );
    cabin.position.set(35, 12, 22);
    excavatorGroup.add(cabin);

    var armBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 3, 8),
      blackMaterial
    );
    armBase.position.set(35, 8, 25);
    excavatorGroup.add(armBase);
    excavatorGroup.armBase = armBase;

    var arm = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 16, 8),
      yellowMaterial
    );
    arm.position.set(35, 15, 32);
    arm.rotation.z = -0.3;
    excavatorGroup.add(arm);
    excavatorGroup.arm = arm;

    var bucket = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 6),
      greyMaterial
    );
    bucket.position.set(38, 10, 42);
    excavatorGroup.add(bucket);
    excavatorGroup.bucket = bucket;

    return excavatorGroup;
  }

  function createConstructionTrailer(redMaterial, greyMaterial) {
    var trailerGroup = new THREE.Group();

    var trailerBody = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 18),
      redMaterial
    );
    trailerBody.position.set(50, 4, -50);
    trailerGroup.add(trailerBody);

    var trailerRoof = new THREE.Mesh(
      new THREE.BoxGeometry(13, 2, 19),
      greyMaterial
    );
    trailerRoof.position.set(50, 9, -50);
    trailerGroup.add(trailerRoof);

    var door = new THREE.Mesh(
      new THREE.BoxGeometry(6, 7, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xFF4500 })
    );
    door.position.set(44, 4, -59.3);
    trailerGroup.add(door);

    return trailerGroup;
  }

  function createScaffoldingFrame(orangeMaterial) {
    var scaffoldGroup = new THREE.Group();
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF8C00, linewidth: 2 });

    var verticalPositions = new Float32Array([
      -22, 0, -15,   -22, 70, -15,
      22, 0, -15,    22, 70, -15,
      -22, 0, 15,    -22, 70, 15,
      22, 0, 15,     22, 70, 15
    ]);
    var verticalGeom = new THREE.BufferGeometry();
    verticalGeom.setAttribute('position', new THREE.BufferAttribute(verticalPositions, 3));
    var verticalLines = new THREE.LineSegments(verticalGeom, lineMaterial);
    scaffoldGroup.add(verticalLines);

    var horizontalPositions = new Float32Array([
      -22, 20, -15,   22, 20, -15,
      -22, 40, -15,   22, 40, -15,
      -22, 60, -15,   22, 60, -15,
      -22, 20, 15,    22, 20, 15,
      -22, 40, 15,    22, 40, 15,
      -22, 60, 15,    22, 60, 15
    ]);
    var horizontalGeom = new THREE.BufferGeometry();
    horizontalGeom.setAttribute('position', new THREE.BufferAttribute(horizontalPositions, 3));
    var horizontalLines = new THREE.LineSegments(horizontalGeom, lineMaterial);
    scaffoldGroup.add(horizontalLines);

    return scaffoldGroup;
  }

  function createDebrisPile(brownMaterial, greyMaterial) {
    var debrisGroup = new THREE.Group();
    debrisGroup.name = 'debrisPile';

    var positions = [
      { x: -45, y: 0, z: 50 },
      { x: -40, y: 3, z: 48 },
      { x: -42, y: 6, z: 52 },
      { x: -48, y: 2, z: 45 },
      { x: -50, y: 4, z: 55 }
    ];

    var materials = [brownMaterial, greyMaterial, brownMaterial, greyMaterial, brownMaterial];

    for (var i = 0; i < positions.length; i++) {
      var debrisBox = new THREE.Mesh(
        new THREE.BoxGeometry(
          4 + Math.random() * 3,
          3 + Math.random() * 2,
          4 + Math.random() * 3
        ),
        materials[i]
      );
      debrisBox.position.set(positions[i].x, positions[i].y, positions[i].z);
      debrisBox.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      debrisGroup.add(debrisBox);
    }

    return debrisGroup;
  }

  function createConcreteMixer(greyMaterial, orangeMaterial) {
    var mixerGroup = new THREE.Group();
    mixerGroup.name = 'concreteMixer';

    var baseFrame = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 8),
      greyMaterial
    );
    baseFrame.position.set(-60, 2, 30);
    mixerGroup.add(baseFrame);

    var drumGeometry = new THREE.CylinderGeometry(4, 4, 8, 16);
    var drum = new THREE.Mesh(drumGeometry, orangeMaterial);
    drum.position.set(-60, 8, 30);
    drum.rotation.z = 0.3;
    mixerGroup.add(drum);
    mixerGroup.drum = drum;

    var motorBox = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 4),
      greyMaterial
    );
    motorBox.position.set(-55, 10, 30);
    mixerGroup.add(motorBox);

    return mixerGroup;
  }

  function createPortaPottyCluster(colorMaterial, blackMaterial) {
    var pottyGroup = new THREE.Group();

    var pottyPositions = [
      { x: -70, z: -30 },
      { x: -70, z: -20 },
      { x: -60, z: -30 },
      { x: -60, z: -20 }
    ];

    for (var i = 0; i < pottyPositions.length; i++) {
      var potty = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 3),
        colorMaterial
      );
      potty.position.set(pottyPositions[i].x, 2, pottyPositions[i].z);
      pottyGroup.add(potty);

      var door = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 3.5, 0.2),
        blackMaterial
      );
      door.position.set(pottyPositions[i].x, 2, pottyPositions[i].z - 1.6);
      pottyGroup.add(door);
    }

    return pottyGroup;
  }

  function createDumpster(greyMaterial, blackMaterial) {
    var dumpsterGroup = new THREE.Group();

    var mainBox = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 6),
      greyMaterial
    );
    mainBox.position.set(60, 3, 0);
    dumpsterGroup.add(mainBox);

    var lid = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.5, 6.5),
      blackMaterial
    );
    lid.position.set(60, 7, 0);
    dumpsterGroup.add(lid);

    var wheel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 2, 8),
      blackMaterial
    );
    wheel1.position.set(54, 1, -3);
    wheel1.rotation.z = Math.PI / 2;
    dumpsterGroup.add(wheel1);

    var wheel2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 2, 8),
      blackMaterial
    );
    wheel2.position.set(54, 1, 3);
    wheel2.rotation.z = Math.PI / 2;
    dumpsterGroup.add(wheel2);

    return dumpsterGroup;
  }

  function createCautionTapeBarrier(yellowMaterial, blackMaterial) {
    var barrierGroup = new THREE.Group();

    var postPositions = [
      { x: 0, z: -70 },
      { x: 20, z: -70 },
      { x: 40, z: -70 }
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 4, 8),
        blackMaterial
      );
      post.position.set(postPositions[i].x, 2, postPositions[i].z);
      barrierGroup.add(post);
    }

    var tapeGeometry = new THREE.BufferGeometry();
    var tapePositions = new Float32Array([
      0, 3, -70,      20, 3, -70,
      20, 3, -70,     40, 3, -70
    ]);
    tapeGeometry.setAttribute('position', new THREE.BufferAttribute(tapePositions, 3));
    var tapeMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 3 });
    var tapeLines = new THREE.LineSegments(tapeGeometry, tapeMaterial);
    barrierGroup.add(tapeLines);

    return barrierGroup;
  }

  function createHardHatStation(orangeMaterial, whiteMaterial, yellowMaterial) {
    var stationGroup = new THREE.Group();

    var standBox = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1, 6),
      orangeMaterial
    );
    standBox.position.set(-80, 0.5, 60);
    stationGroup.add(standBox);

    var hatPositions = [
      { x: -82, z: 60 },
      { x: -80, z: 60 },
      { x: -78, z: 60 }
    ];

    for (var i = 0; i < hatPositions.length; i++) {
      var hat = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        yellowMaterial
      );
      hat.position.set(hatPositions[i].x, 2, hatPositions[i].z);
      stationGroup.add(hat);
    }

    var signPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
      whiteMaterial
    );
    signPole.position.set(-75, 1.5, 60);
    stationGroup.add(signPole);

    return stationGroup;
  }

  function createAirCompressor(greyMaterial, blackMaterial) {
    var compressorGroup = new THREE.Group();

    var baseBox = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 4),
      greyMaterial
    );
    baseBox.position.set(70, 1, 40);
    compressorGroup.add(baseBox);

    var tank = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 6, 16),
      blackMaterial
    );
    tank.position.set(70, 6, 40);
    tank.rotation.z = Math.PI / 3;
    compressorGroup.add(tank);

    var motorBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      greyMaterial
    );
    motorBox.position.set(75, 5, 40);
    compressorGroup.add(motorBox);

    return compressorGroup;
  }

  function createJackhammer(greyMaterial, blackMaterial) {
    var jackhGroup = new THREE.Group();
    jackhGroup.name = 'jackhammer';

    var handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 5, 8),
      blackMaterial
    );
    handle.position.set(-5, 2.5, -80);
    handle.rotation.z = Math.PI / 6;
    jackhGroup.add(handle);

    var head = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 1),
      greyMaterial
    );
    head.position.set(-2, 6, -80);
    jackhGroup.add(head);

    return jackhGroup;
  }

  function createSiteGenerator(greyMaterial, blackMaterial, orangeMaterial) {
    var genGroup = new THREE.Group();
    genGroup.name = 'generator';

    var mainBox = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 7),
      greyMaterial
    );
    mainBox.position.set(80, 2, -60);
    genGroup.add(mainBox);

    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 0.5),
      blackMaterial
    );
    panel.position.set(80, 4, -56.8);
    genGroup.add(panel);

    var exhaustPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 3, 8),
      orangeMaterial
    );
    exhaustPipe.position.set(82, 6, -60);
    genGroup.add(exhaustPipe);

    return genGroup;
  }

  function createDustCloud(dustMaterial) {
    var dustGroup = new THREE.Group();
    dustGroup.name = 'dustCloud';

    var dustParticles = [];
    for (var i = 0; i < 5; i++) {
      var dustSphere = new THREE.Mesh(
        new THREE.SphereGeometry(3 + i, 8, 8),
        dustMaterial
      );
      dustSphere.position.set(-10 + i * 2, 25 + i * 3, 5 + i);
      dustGroup.add(dustSphere);
      dustParticles.push(dustSphere);
    }
    dustGroup.particles = dustParticles;

    return dustGroup;
  }

  function createSafetyNet(yellowMaterial) {
    var netGroup = new THREE.Group();
    netGroup.name = 'safetyNet';

    var netGeometry = new THREE.BufferGeometry();
    var netPositions = new Float32Array([
      -25, 35, -10,   25, 35, -10,
      -25, 50, -10,   25, 50, -10,
      -25, 35, 10,    25, 35, 10,
      -25, 50, 10,    25, 50, 10
    ]);
    netGeometry.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
    var netMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var netLines = new THREE.LineSegments(netGeometry, netMaterial);
    netGroup.add(netLines);

    return netGroup;
  }

  function setupKeybinds() {
    document.addEventListener('keydown', function(e) {
      if (e.key && e.key.toUpperCase() === 'D') {
        var now = Date.now();
        if (!keybindState.dKeyPressed) {
          keybindState.dKeyPressed = true;
          keybindState.lastDKey = now;
        }
      }
      if (e.key && e.key.toUpperCase() === 'S') {
        var now = Date.now();
        if (keybindState.dKeyPressed && (now - keybindState.lastDKey) < 400) {
          toggleDemolitionMode();
          keybindState.dKeyPressed = false;
        }
        keybindState.lastSKey = now;
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key && e.key.toUpperCase() === 'D') {
        keybindState.dKeyPressed = false;
      }
    });
  }

  function toggleDemolitionMode() {
    state.isActive = !state.isActive;
    state.demolitionEventTime = Date.now();
    triggerDemolitionEvent();
    updateHUD();
  }

  function triggerDemolitionEvent() {
    var debrisPile = findObjectByName('debrisPile');
    if (debrisPile) {
      debrisPile.children.forEach(function(child) {
        if (child.position) {
          var origX = child.position.x;
          child.userData.origX = origX;
        }
      });
    }
  }

  function findObjectByName(name) {
    for (var i = 0; i < allObjects.length; i++) {
      if (allObjects[i].name === name) {
        return allObjects[i];
      }
    }
    return null;
  }

  function update(delta) {
    if (!scene) return;

    animationState.wreckingBallAngle += delta * 0.5;
    var wreckingBall = findObjectByName('wreckingBall');
    if (wreckingBall && wreckingBall.wreckBall) {
      var swingAmount = Math.sin(animationState.wreckingBallAngle) * 15;
      wreckingBall.wreckBall.position.x = -22 + swingAmount;
      wreckingBall.wreckBall.position.z = -30 + swingAmount * 0.5;
    }

    animationState.excavatorArmRotation += delta * 0.8;
    var excavator = findObjectByName('excavator');
    if (excavator && excavator.arm) {
      excavator.arm.rotation.z = -0.3 + Math.sin(animationState.excavatorArmRotation) * 0.4;
      if (excavator.bucket) {
        excavator.bucket.position.y = 10 + Math.sin(animationState.excavatorArmRotation * 1.5) * 3;
      }
    }

    animationState.concreteRotation += delta * 2;
    var mixer = findObjectByName('concreteMixer');
    if (mixer && mixer.drum) {
      mixer.drum.rotation.x += delta * 2;
    }

    if (state.isActive) {
      animationState.dustCloudScale += delta * 0.3;
      if (animationState.dustCloudScale > 2) animationState.dustCloudScale = 2;
    } else {
      animationState.dustCloudScale = Math.max(1, animationState.dustCloudScale - delta * 0.2);
    }

    var dustCloud = findObjectByName('dustCloud');
    if (dustCloud && dustCloud.particles) {
      dustCloud.particles.forEach(function(particle) {
        particle.scale.set(animationState.dustCloudScale, animationState.dustCloudScale, animationState.dustCloudScale);
      });
    }

    animationState.lightFlashPhase += delta * 3;
    if (animationState.lightFlashPhase > Math.PI * 2) {
      animationState.lightFlashPhase = 0;
    }

    var debrisPile = findObjectByName('debrisPile');
    if (debrisPile && state.isActive) {
      var shakeIntensity = Math.sin(Date.now() * 0.005) * 0.2;
      debrisPile.children.forEach(function(child, idx) {
        if (child.userData.origX !== undefined) {
          child.position.x = child.userData.origX + shakeIntensity;
        }
      });
    }
  }

  function updateHUD() {
    var hudText = 'SMUGGLERS DOWN: ' + state.smugglersDown + '/' + state.smugglersTotal +
                  ' | CONTRABAND FOUND: ' + state.contrabandsFound + '/' + state.contrabandsTotal +
                  ' | SITE SECURED: ' + (state.siteSecured ? 'YES' : 'NO');
    var hudElement = document.getElementById('demolitionHUD');
    if (hudElement) {
      hudElement.textContent = hudText;
    }
  }

  function reset() {
    allObjects.forEach(function(obj) {
      if (scene && obj && scene.children.indexOf(obj) !== -1) {
        scene.remove(obj);
      }
    });
    allObjects = [];
    state = {
      isActive: false,
      smugglersDown: 0,
      smugglersTotal: 8,
      contrabandsFound: 0,
      contrabandsTotal: 3,
      siteSecured: false,
      demolitionEventTime: 0
    };
    animationState = {
      wreckingBallAngle: 0,
      excavatorArmRotation: 0,
      concreteRotation: 0,
      dustCloudScale: 1,
      lightFlashPhase: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
