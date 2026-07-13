window.AcidMine = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var acidPoolMesh;
  var ventilationFans = [];
  var corrisionLights = [];
  var trackSegments = [];
  var time = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    ventilationFans = [];
    corrisionLights = [];
    trackSegments = [];
    time = 0;

    createTerrain();
    createShaftStructure();
    createAcidPool();
    createMiningEquipment();
    createSupportBeams();
    createNeutralizationTanks();
    createWarningBarriers();
    createEmergencyPumpStation();
    createRailTracks();
    createVentilationSystem();
    createScatteredHazmatGear();
    createCorrisionLighting();
    createRubbleAndDebris();
  }

  function createTerrain() {
    var groundGeometry = new THREE.BoxGeometry(80, 2, 80);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4423, roughness: 0.8, metalness: 0.1 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    var dirtPit1 = new THREE.Mesh(new THREE.BoxGeometry(25, 3, 20), new THREE.MeshStandardMaterial({ color: 0x4A2F1A, roughness: 0.9 }));
    dirtPit1.position.set(-15, -3, 10);
    dirtPit1.castShadow = true;
    dirtPit1.receiveShadow = true;
    scene.add(dirtPit1);
    meshes.push(dirtPit1);

    var dirtPit2 = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 25), new THREE.MeshStandardMaterial({ color: 0x3D2415, roughness: 0.9 }));
    dirtPit2.position.set(20, -2, -15);
    dirtPit2.castShadow = true;
    dirtPit2.receiveShadow = true;
    scene.add(dirtPit2);
    meshes.push(dirtPit2);
  }

  function createShaftStructure() {
    var shaftWallGeometry = new THREE.BoxGeometry(18, 35, 18);
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.3 });
    var shaftWall = new THREE.Mesh(shaftWallGeometry, shaftMaterial);
    shaftWall.position.set(0, -15, 0);
    shaftWall.castShadow = true;
    shaftWall.receiveShadow = true;
    scene.add(shaftWall);
    meshes.push(shaftWall);

    var shaftOpening = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    shaftOpening.position.set(0, 1, 0);
    shaftOpening.castShadow = true;
    scene.add(shaftOpening);
    meshes.push(shaftOpening);

    var rimBeam1 = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 1), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
    rimBeam1.position.set(0, 2.5, 10);
    rimBeam1.castShadow = true;
    scene.add(rimBeam1);
    meshes.push(rimBeam1);

    var rimBeam2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 20), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
    rimBeam2.position.set(10, 2.5, 0);
    rimBeam2.castShadow = true;
    scene.add(rimBeam2);
    meshes.push(rimBeam2);

    var rimBeam3 = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 1), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
    rimBeam3.position.set(0, 2.5, -10);
    rimBeam3.castShadow = true;
    scene.add(rimBeam3);
    meshes.push(rimBeam3);

    var rimBeam4 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 20), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
    rimBeam4.position.set(-10, 2.5, 0);
    rimBeam4.castShadow = true;
    scene.add(rimBeam4);
    meshes.push(rimBeam4);
  }

  function createAcidPool() {
    var poolGeometry = new THREE.SphereGeometry(14, 32, 16);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00AA00,
      roughness: 0.2,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7
    });
    acidPoolMesh = new THREE.Mesh(poolGeometry, poolMaterial);
    acidPoolMesh.position.set(0, -32, 0);
    acidPoolMesh.scale.set(1, 0.6, 1);
    acidPoolMesh.castShadow = true;
    acidPoolMesh.receiveShadow = true;
    scene.add(acidPoolMesh);
    meshes.push(acidPoolMesh);

    var poolSurfaceGeometry = new THREE.SphereGeometry(13.8, 32, 8);
    var poolSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x44FF44,
      emissive: 0x00FF00,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.5
    });
    var poolSurface = new THREE.Mesh(poolSurfaceGeometry, poolSurfaceMaterial);
    poolSurface.position.set(0, -25, 0);
    poolSurface.scale.set(1, 0.1, 1);
    scene.add(poolSurface);
    meshes.push(poolSurface);
  }

  function createMiningEquipment() {
    var pulleyGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8, roughness: 0.3 });
    var pulley = new THREE.Mesh(pulleyGeometry, metalMaterial);
    pulley.position.set(-25, 8, 0);
    pulley.castShadow = true;
    scene.add(pulley);
    meshes.push(pulley);

    var cableGuide = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 15), metalMaterial);
    cableGuide.position.set(-25, 0, 0);
    cableGuide.castShadow = true;
    scene.add(cableGuide);
    meshes.push(cableGuide);

    var hoistBucket = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3), new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 }));
    hoistBucket.position.set(-25, -10, 0);
    hoistBucket.castShadow = true;
    scene.add(hoistBucket);
    meshes.push(hoistBucket);

    var conveyorBase = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 3), metalMaterial);
    conveyorBase.position.set(10, 2, 15);
    conveyorBase.castShadow = true;
    scene.add(conveyorBase);
    meshes.push(conveyorBase);

    var conveyorRoll1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12), metalMaterial);
    conveyorRoll1.position.set(10, 2.8, 15);
    conveyorRoll1.rotation.z = Math.PI / 2;
    conveyorRoll1.castShadow = true;
    scene.add(conveyorRoll1);
    meshes.push(conveyorRoll1);

    var conveyorRoll2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12), metalMaterial);
    conveyorRoll2.position.set(10, 1.2, 15);
    conveyorRoll2.rotation.z = Math.PI / 2;
    conveyorRoll2.castShadow = true;
    scene.add(conveyorRoll2);
    meshes.push(conveyorRoll2);
  }

  function createSupportBeams() {
    var verticalBeam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 25), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 }));
    verticalBeam1.position.set(-8, -5, -8);
    verticalBeam1.castShadow = true;
    scene.add(verticalBeam1);
    meshes.push(verticalBeam1);

    var verticalBeam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 25), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 }));
    verticalBeam2.position.set(8, -5, -8);
    verticalBeam2.castShadow = true;
    scene.add(verticalBeam2);
    meshes.push(verticalBeam2);

    var verticalBeam3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 25), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 }));
    verticalBeam3.position.set(-8, -5, 8);
    verticalBeam3.castShadow = true;
    scene.add(verticalBeam3);
    meshes.push(verticalBeam3);

    var verticalBeam4 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 25), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 }));
    verticalBeam4.position.set(8, -5, 8);
    verticalBeam4.castShadow = true;
    scene.add(verticalBeam4);
    meshes.push(verticalBeam4);

    var horizontalBeam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.6, roughness: 0.4 }));
    horizontalBeam1.position.set(0, 5, 0);
    horizontalBeam1.rotation.z = Math.PI / 2;
    horizontalBeam1.castShadow = true;
    scene.add(horizontalBeam1);
    meshes.push(horizontalBeam1);

    var horizontalBeam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.6, roughness: 0.4 }));
    horizontalBeam2.position.set(0, 5, 0);
    horizontalBeam2.rotation.x = Math.PI / 2;
    horizontalBeam2.castShadow = true;
    scene.add(horizontalBeam2);
    meshes.push(horizontalBeam2);
  }

  function createNeutralizationTanks() {
    var tank1Geometry = new THREE.CylinderGeometry(3.5, 3.5, 8, 8);
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x9C7E3A, roughness: 0.8, metalness: 0.4 });
    var tank1 = new THREE.Mesh(tank1Geometry, tankMaterial);
    tank1.position.set(-20, 3, -20);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);
    meshes.push(tank1);

    var tankCap1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2, 8), tankMaterial);
    tankCap1.position.set(-20, 7, -20);
    tankCap1.castShadow = true;
    scene.add(tankCap1);
    meshes.push(tankCap1);

    var tank2 = new THREE.Mesh(tank1Geometry, tankMaterial);
    tank2.position.set(-20, 3, 25);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
    meshes.push(tank2);

    var tankCap2 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2, 8), tankMaterial);
    tankCap2.position.set(-20, 7, 25);
    tankCap2.castShadow = true;
    scene.add(tankCap2);
    meshes.push(tankCap2);

    var pipeConnector = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 45), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 }));
    pipeConnector.position.set(-20, 3, 2.5);
    pipeConnector.rotation.z = Math.PI / 2;
    pipeConnector.castShadow = true;
    scene.add(pipeConnector);
    meshes.push(pipeConnector);
  }

  function createWarningBarriers() {
    var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.6, metalness: 0.3 });
    var barrierFrame1 = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 0.3), barrierMaterial);
    barrierFrame1.position.set(15, 1.5, -25);
    barrierFrame1.castShadow = true;
    scene.add(barrierFrame1);
    meshes.push(barrierFrame1);

    var barrierFrame2 = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 0.3), barrierMaterial);
    barrierFrame2.position.set(25, 1.5, -25);
    barrierFrame2.castShadow = true;
    scene.add(barrierFrame2);
    meshes.push(barrierFrame2);

    var barrierChain = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 0.2), barrierMaterial);
    barrierChain.position.set(20, 2.8, -25);
    barrierChain.castShadow = true;
    scene.add(barrierChain);
    meshes.push(barrierChain);

    var warningSign = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 }));
    warningSign.position.set(20, 4, -25);
    warningSign.castShadow = true;
    scene.add(warningSign);
    meshes.push(warningSign);

    var barrierFrame3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 1), barrierMaterial);
    barrierFrame3.position.set(30, 1.25, 20);
    barrierFrame3.castShadow = true;
    scene.add(barrierFrame3);
    meshes.push(barrierFrame3);

    var barrierFrame4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 1), barrierMaterial);
    barrierFrame4.position.set(30, 1.25, 32);
    barrierFrame4.castShadow = true;
    scene.add(barrierFrame4);
    meshes.push(barrierFrame4);
  }

  function createEmergencyPumpStation() {
    var pumpBodyGeometry = new THREE.CylinderGeometry(2, 2.5, 6, 8);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7, metalness: 0.5 });
    var pumpBody = new THREE.Mesh(pumpBodyGeometry, pumpMaterial);
    pumpBody.position.set(28, 3, -10);
    pumpBody.castShadow = true;
    pumpBody.receiveShadow = true;
    scene.add(pumpBody);
    meshes.push(pumpBody);

    var pumpMotor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 }));
    pumpMotor.position.set(28, 7, -10);
    pumpMotor.castShadow = true;
    scene.add(pumpMotor);
    meshes.push(pumpMotor);

    var intakePipe = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 20), new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 }));
    intakePipe.position.set(28, -10, -10);
    intakePipe.castShadow = true;
    scene.add(intakePipe);
    meshes.push(intakePipe);

    var outflowPipe = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 15), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6 }));
    outflowPipe.position.set(28, 10, 10);
    outflowPipe.rotation.z = Math.PI / 4;
    outflowPipe.castShadow = true;
    scene.add(outflowPipe);
    meshes.push(outflowPipe);

    var controlPanel = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.5), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    controlPanel.position.set(30, 5, -10);
    controlPanel.castShadow = true;
    scene.add(controlPanel);
    meshes.push(controlPanel);
  }

  function createRailTracks() {
    var railGeometry = new THREE.BoxGeometry(1, 0.4, 30);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.7 });
    var rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(-3, 0.2, 0);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    scene.add(rail1);
    meshes.push(rail1);
    trackSegments.push(rail1);

    var rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(3, 0.2, 0);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    scene.add(rail2);
    meshes.push(rail2);
    trackSegments.push(rail2);

    for (var i = 0; i < 15; i++) {
      var tieGeometry = new THREE.BoxGeometry(8, 0.3, 1.2);
      var tie = new THREE.Mesh(tieGeometry, railMaterial);
      tie.position.set(0, 0.5, -14 + i * 2);
      tie.castShadow = true;
      scene.add(tie);
      meshes.push(tie);
    }
  }

  function createVentilationSystem() {
    var ductGeometry = new THREE.BoxGeometry(4, 4, 8);
    var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.6 });
    var duct = new THREE.Mesh(ductGeometry, ductMaterial);
    duct.position.set(-30, 15, 0);
    duct.castShadow = true;
    duct.receiveShadow = true;
    scene.add(duct);
    meshes.push(duct);

    var fan1Geometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 8);
    var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });
    var fan1 = new THREE.Mesh(fan1Geometry, fanMaterial);
    fan1.position.set(-30, 17, 0);
    fan1.rotation.x = Math.PI / 2;
    fan1.castShadow = true;
    scene.add(fan1);
    meshes.push(fan1);
    ventilationFans.push(fan1);

    var fan2 = new THREE.Mesh(fan1Geometry, fanMaterial);
    fan2.position.set(30, 18, 10);
    fan2.rotation.x = Math.PI / 2;
    fan2.castShadow = true;
    scene.add(fan2);
    meshes.push(fan2);
    ventilationFans.push(fan2);

    var ductExit = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, 2), ductMaterial);
    ductExit.position.set(30, 18, 10);
    ductExit.castShadow = true;
    scene.add(ductExit);
    meshes.push(ductExit);
  }

  function createScatteredHazmatGear() {
    var helmetGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var hazmatMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00, emissive: 0x005500, roughness: 0.4, metalness: 0.3 });
    var helmet1 = new THREE.Mesh(helmetGeometry, hazmatMaterial);
    helmet1.position.set(15, 1, 20);
    helmet1.castShadow = true;
    scene.add(helmet1);
    meshes.push(helmet1);

    var suitGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
    var suit1 = new THREE.Mesh(suitGeometry, hazmatMaterial);
    suit1.position.set(18, 2, 22);
    suit1.castShadow = true;
    scene.add(suit1);
    meshes.push(suit1);

    var gauntlet1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 1.5), hazmatMaterial);
    gauntlet1.position.set(20, 1.2, 18);
    gauntlet1.castShadow = true;
    scene.add(gauntlet1);
    meshes.push(gauntlet1);

    var helmet2 = new THREE.Mesh(helmetGeometry, hazmatMaterial);
    helmet2.position.set(-25, 1, 10);
    helmet2.castShadow = true;
    scene.add(helmet2);
    meshes.push(helmet2);

    var gloveGeometry = new THREE.SphereGeometry(0.6, 6, 6);
    var glove1 = new THREE.Mesh(gloveGeometry, hazmatMaterial);
    glove1.position.set(-28, 0.8, 8);
    glove1.castShadow = true;
    scene.add(glove1);
    meshes.push(glove1);
  }

  function createCorrisionLighting() {
    var light1 = new THREE.PointLight(0xFF6600, 1.5, 30);
    light1.position.set(0, 5, 0);
    light1.castShadow = true;
    scene.add(light1);
    corrisionLights.push(light1);

    var light2 = new THREE.PointLight(0xFF6600, 1.2, 25);
    light2.position.set(-25, 4, 0);
    light2.castShadow = true;
    scene.add(light2);
    corrisionLights.push(light2);

    var light3 = new THREE.PointLight(0x00FF00, 2, 40);
    light3.position.set(0, -28, 0);
    light3.castShadow = true;
    scene.add(light3);
    corrisionLights.push(light3);

    var ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
  }

  function createRubbleAndDebris() {
    var debrisGeometry = new THREE.BoxGeometry(1.5, 1, 2);
    var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, metalness: 0.2 });

    var debris1 = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris1.position.set(10, 0.5, -25);
    debris1.rotation.z = 0.3;
    debris1.castShadow = true;
    scene.add(debris1);
    meshes.push(debris1);

    var debris2 = new THREE.Mesh(debrisGeometry, debrisMaterial);
    debris2.position.set(-15, 0.7, 15);
    debris2.rotation.z = -0.5;
    debris2.castShadow = true;
    scene.add(debris2);
    meshes.push(debris2);

    var brokenMetal = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 1.5), debrisMaterial);
    brokenMetal.position.set(5, 0.3, -20);
    brokenMetal.rotation.y = 1.2;
    brokenMetal.castShadow = true;
    scene.add(brokenMetal);
    meshes.push(brokenMetal);

    var brokenMetal2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1), debrisMaterial);
    brokenMetal2.position.set(-10, 0.2, -10);
    brokenMetal2.rotation.y = -0.8;
    brokenMetal2.castShadow = true;
    scene.add(brokenMetal2);
    meshes.push(brokenMetal2);
  }

  function update(delta) {
    time += delta;

    if (acidPoolMesh) {
      acidPoolMesh.position.y = -32 + Math.sin(time * 1.5) * 0.5;
      acidPoolMesh.scale.y = 0.6 + Math.sin(time * 2) * 0.08;
    }

    for (var i = 0; i < ventilationFans.length; i++) {
      ventilationFans[i].rotation.y += delta * 3;
    }

    for (var j = 0; j < corrisionLights.length; j++) {
      var flicker = Math.sin(time * 4.5 + j) * 0.3 + 0.7;
      corrisionLights[j].intensity = corrisionLights[j].intensity * 0.7 + flicker * 0.3;
    }

    for (var k = 0; k < trackSegments.length; k++) {
      trackSegments[k].rotation.z = Math.sin(time * 0.8) * 0.02;
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    ventilationFans = [];
    corrisionLights = [];
    trackSegments = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
