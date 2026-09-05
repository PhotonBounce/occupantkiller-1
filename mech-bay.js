window.MechBay = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene;
  var camera;
  var renderer;
  var gantryX = 0;
  var gantryDirection = 1;
  var diagnosticFlicker = 0;
  var mechHeadAngle = 0;

  var init = function(canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 200);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 5, 20);
    camera.lookAt(40, 10, 40);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    createLights();
    createFloor();
    createPits();
    createWalls();
    createGantryCrane();
    createMechOne();
    createMechTwo();
    createWeaponRacks();
    createDiagnosticPanels();
    createPowerConduits();
    createToolStorage();
    createTestingRange();
    createMechGraveyard();
    createLadders();

    window.addEventListener('resize', onWindowResize);

    return { scene: scene, camera: camera, renderer: renderer };
  };

  var createLights = function() {
    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.5);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(30, 40, 30);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.left = -80;
    mainLight.shadow.camera.right = 80;
    mainLight.shadow.camera.top = 80;
    mainLight.shadow.camera.bottom = -80;
    mainLight.shadow.camera.far = 200;
    scene.add(mainLight);

    var spotLight1 = new THREE.SpotLight(0xff6600, 0.6, 50, Math.PI / 4, 0.5, 1);
    spotLight1.position.set(15, 25, 25);
    spotLight1.target.position.set(20, 0, 20);
    scene.add(spotLight1);

    var spotLight2 = new THREE.SpotLight(0x00ccff, 0.4, 40, Math.PI / 5, 0.4, 1);
    spotLight2.position.set(60, 20, 60);
    spotLight2.target.position.set(50, 0, 50);
    scene.add(spotLight2);
  };

  var createFloor = function() {
    var floorGeometry = new THREE.BoxGeometry(80, 2, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8, metalness: 0.2 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -1;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);

    var gridLines = [];
    for (var i = 0; i <= 8; i++) {
      var x = i * 10 - 40;
      gridLines.push(new THREE.Vector3(x, 0.1, -40));
      gridLines.push(new THREE.Vector3(x, 0.1, 40));
    }
    for (var j = 0; j <= 8; j++) {
      var z = j * 10 - 40;
      gridLines.push(new THREE.Vector3(-40, 0.1, z));
      gridLines.push(new THREE.Vector3(40, 0.1, z));
    }
    var gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridLines.flatMap(v => [v.x, v.y, v.z])), 3));
    var gridMaterial = new THREE.LineBasicMaterial({ color: 0x444466, linewidth: 1 });
    var gridLines2 = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(gridLines2);
  };

  var createPits = function() {
    var pit1 = new THREE.BoxGeometry(15, 4, 10);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.1 });
    var pitMesh1 = new THREE.Mesh(pit1, pitMaterial);
    pitMesh1.position.set(15, -3, 15);
    pitMesh1.castShadow = true;
    pitMesh1.receiveShadow = true;
    scene.add(pitMesh1);

    var pit2 = new THREE.BoxGeometry(15, 4, 10);
    var pitMesh2 = new THREE.Mesh(pit2, pitMaterial);
    pitMesh2.position.set(65, -3, 15);
    pitMesh2.castShadow = true;
    pitMesh2.receiveShadow = true;
    scene.add(pitMesh2);

    var pitEdge = new THREE.BoxGeometry(80, 0.5, 80);
    var edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x444466, roughness: 0.7, metalness: 0.3 });
    var edge = new THREE.Mesh(pitEdge, edgeMaterial);
    edge.position.y = 0;
    edge.castShadow = true;
    scene.add(edge);
  };

  var createWalls = function() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.8, metalness: 0.15 });

    var northWall = new THREE.BoxGeometry(80, 35, 2);
    var northMesh = new THREE.Mesh(northWall, wallMaterial);
    northMesh.position.set(0, 15, -40);
    northMesh.castShadow = true;
    northMesh.receiveShadow = true;
    scene.add(northMesh);

    var southWall = new THREE.BoxGeometry(80, 35, 2);
    var southMesh = new THREE.Mesh(southWall, wallMaterial);
    southMesh.position.set(0, 15, 40);
    southMesh.castShadow = true;
    southMesh.receiveShadow = true;
    scene.add(southMesh);

    var westWall = new THREE.BoxGeometry(2, 35, 80);
    var westMesh = new THREE.Mesh(westWall, wallMaterial);
    westMesh.position.set(-40, 15, 0);
    westMesh.castShadow = true;
    westMesh.receiveShadow = true;
    scene.add(westMesh);

    var eastWall = new THREE.BoxGeometry(2, 35, 80);
    var eastMesh = new THREE.Mesh(eastWall, wallMaterial);
    eastMesh.position.set(40, 15, 0);
    eastMesh.castShadow = true;
    eastMesh.receiveShadow = true;
    scene.add(eastMesh);
  };

  var createGantryCrane = function() {
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900, roughness: 0.6, metalness: 0.7 });

    var railNorth = new THREE.BoxGeometry(70, 1, 1);
    var railN = new THREE.Mesh(railNorth, beamMaterial);
    railN.position.set(10, 32, -30);
    railN.castShadow = true;
    scene.add(railN);

    var railSouth = new THREE.BoxGeometry(70, 1, 1);
    var railS = new THREE.Mesh(railSouth, beamMaterial);
    railS.position.set(10, 32, 30);
    railS.castShadow = true;
    scene.add(railS);

    var crossBeam = new THREE.BoxGeometry(2, 1, 60);
    var crossMesh = new THREE.Mesh(crossBeam, beamMaterial);
    crossMesh.position.set(gantryX, 32, 0);
    crossMesh.castShadow = true;
    crossMesh.userData.isGantry = true;
    scene.add(crossMesh);

    var hoist = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
    var hoistMaterial = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.5, metalness: 0.8 });
    var hoistMesh = new THREE.Mesh(hoist, hoistMaterial);
    hoistMesh.position.set(gantryX, 24, 0);
    hoistMesh.castShadow = true;
    hoistMesh.userData.isGantry = true;
    scene.add(hoistMesh);

    var hook = new THREE.SphereGeometry(0.8, 8, 8);
    var hookMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.4, metalness: 0.9 });
    var hookMesh = new THREE.Mesh(hook, hookMaterial);
    hookMesh.position.set(gantryX, 16, 0);
    hookMesh.castShadow = true;
    hookMesh.userData.isGantry = true;
    scene.add(hookMesh);
  };

  var createMechOne = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.5, metalness: 0.8 });

    var footL = new THREE.BoxGeometry(2, 1, 3);
    var footLMesh = new THREE.Mesh(footL, metalMaterial);
    footLMesh.position.set(20, 0, 20);
    footLMesh.castShadow = true;
    scene.add(footLMesh);

    var legL = new THREE.CylinderGeometry(1.2, 1.2, 8, 6);
    var legLMesh = new THREE.Mesh(legL, metalMaterial);
    legLMesh.position.set(20, 4, 20);
    legLMesh.castShadow = true;
    scene.add(legLMesh);

    var footR = new THREE.BoxGeometry(2, 1, 3);
    var footRMesh = new THREE.Mesh(footR, metalMaterial);
    footRMesh.position.set(26, 0, 20);
    footRMesh.castShadow = true;
    scene.add(footRMesh);

    var legR = new THREE.CylinderGeometry(1.2, 1.2, 8, 6);
    var legRMesh = new THREE.Mesh(legR, metalMaterial);
    legRMesh.position.set(26, 4, 20);
    legRMesh.castShadow = true;
    scene.add(legRMesh);

    var torso = new THREE.BoxGeometry(5, 12, 4);
    var torsoMesh = new THREE.Mesh(torso, metalMaterial);
    torsoMesh.position.set(23, 12, 20);
    torsoMesh.castShadow = true;
    scene.add(torsoMesh);

    var armL = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var armLMesh = new THREE.Mesh(armL, metalMaterial);
    armLMesh.position.set(18, 14, 20);
    armLMesh.rotation.z = 0.3;
    armLMesh.castShadow = true;
    scene.add(armLMesh);

    var armR = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var armRMesh = new THREE.Mesh(armR, metalMaterial);
    armRMesh.position.set(28, 14, 20);
    armRMesh.rotation.z = -0.3;
    armRMesh.castShadow = true;
    scene.add(armRMesh);

    var head = new THREE.BoxGeometry(3, 4, 3);
    var headMesh = new THREE.Mesh(head, metalMaterial);
    headMesh.position.set(23, 20, 20);
    headMesh.castShadow = true;
    headMesh.userData.isMechHead = true;
    scene.add(headMesh);

    var visor = new THREE.SphereGeometry(1, 8, 8);
    var visorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8, metalness: 0.9 });
    var visorMesh = new THREE.Mesh(visor, visorMaterial);
    visorMesh.position.set(23.5, 21, 22);
    visorMesh.castShadow = true;
    scene.add(visorMesh);

    var cannon = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
    var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.7 });
    var cannonMesh = new THREE.Mesh(cannon, cannonMaterial);
    cannonMesh.position.set(19, 15, 20);
    cannonMesh.rotation.z = 0.2;
    cannonMesh.castShadow = true;
    scene.add(cannonMesh);
  };

  var createMechTwo = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x2222aa, roughness: 0.5, metalness: 0.8 });

    var footL = new THREE.BoxGeometry(2, 1, 3);
    var footLMesh = new THREE.Mesh(footL, metalMaterial);
    footLMesh.position.set(55, 0, 60);
    footLMesh.castShadow = true;
    scene.add(footLMesh);

    var legL = new THREE.CylinderGeometry(1.2, 1.2, 8, 6);
    var legLMesh = new THREE.Mesh(legL, metalMaterial);
    legLMesh.position.set(55, 4, 60);
    legLMesh.castShadow = true;
    scene.add(legLMesh);

    var footR = new THREE.BoxGeometry(2, 1, 3);
    var footRMesh = new THREE.Mesh(footR, metalMaterial);
    footRMesh.position.set(61, 0, 60);
    footRMesh.castShadow = true;
    scene.add(footRMesh);

    var legR = new THREE.CylinderGeometry(1.2, 1.2, 8, 6);
    var legRMesh = new THREE.Mesh(legR, metalMaterial);
    legRMesh.position.set(61, 4, 60);
    legRMesh.castShadow = true;
    scene.add(legRMesh);

    var torso = new THREE.BoxGeometry(5, 12, 4);
    var torsoMesh = new THREE.Mesh(torso, metalMaterial);
    torsoMesh.position.set(58, 12, 60);
    torsoMesh.castShadow = true;
    scene.add(torsoMesh);

    var armL = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var armLMesh = new THREE.Mesh(armL, metalMaterial);
    armLMesh.position.set(53, 14, 60);
    armLMesh.rotation.z = 0.3;
    armLMesh.castShadow = true;
    scene.add(armLMesh);

    var armR = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var armRMesh = new THREE.Mesh(armR, metalMaterial);
    armRMesh.position.set(63, 14, 60);
    armRMesh.rotation.z = -0.3;
    armRMesh.castShadow = true;
    scene.add(armRMesh);

    var head = new THREE.BoxGeometry(3, 4, 3);
    var headMesh = new THREE.Mesh(head, metalMaterial);
    headMesh.position.set(58, 20, 60);
    headMesh.castShadow = true;
    headMesh.userData.isMechHead = true;
    scene.add(headMesh);

    var visor = new THREE.SphereGeometry(1, 8, 8);
    var visorMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8, metalness: 0.9 });
    var visorMesh = new THREE.Mesh(visor, visorMaterial);
    visorMesh.position.set(58.5, 21, 62);
    visorMesh.castShadow = true;
    scene.add(visorMesh);

    var cannon = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
    var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.7 });
    var cannonMesh = new THREE.Mesh(cannon, cannonMaterial);
    cannonMesh.position.set(54, 15, 60);
    cannonMesh.rotation.z = 0.2;
    cannonMesh.castShadow = true;
    scene.add(cannonMesh);
  };

  var createWeaponRacks = function() {
    var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7, metalness: 0.6 });
    var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.8 });

    var rack1 = new THREE.BoxGeometry(12, 15, 2);
    var rackMesh1 = new THREE.Mesh(rack1, rackMaterial);
    rackMesh1.position.set(-25, 10, 50);
    rackMesh1.castShadow = true;
    scene.add(rackMesh1);

    for (var i = 0; i < 3; i++) {
      var weapon = new THREE.CylinderGeometry(0.4, 0.4, 5, 5);
      var weaponMesh = new THREE.Mesh(weapon, weaponMaterial);
      weaponMesh.position.set(-25 + i * 3, 12 + i * 2, 51);
      weaponMesh.rotation.z = 0.5;
      weaponMesh.castShadow = true;
      scene.add(weaponMesh);
    }

    var rack2 = new THREE.BoxGeometry(12, 15, 2);
    var rackMesh2 = new THREE.Mesh(rack2, rackMaterial);
    rackMesh2.position.set(30, 10, -38);
    rackMesh2.castShadow = true;
    scene.add(rackMesh2);

    for (var j = 0; j < 3; j++) {
      var weaponB = new THREE.CylinderGeometry(0.4, 0.4, 5, 5);
      var weaponBMesh = new THREE.Mesh(weaponB, weaponMaterial);
      weaponBMesh.position.set(30 + j * 3, 12 + j * 2, -39);
      weaponBMesh.rotation.z = 0.5;
      weaponBMesh.castShadow = true;
      scene.add(weaponBMesh);
    }
  };

  var createDiagnosticPanels = function() {
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.3 });
    var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 });

    var panel1 = new THREE.BoxGeometry(8, 10, 0.5);
    var panelMesh1 = new THREE.Mesh(panel1, panelMaterial);
    panelMesh1.position.set(-36, 12, 0);
    panelMesh1.castShadow = true;
    panelMesh1.userData.isDiagnostic = true;
    scene.add(panelMesh1);

    var screen1 = new THREE.BoxGeometry(6, 6, 0.2);
    var screenMesh1 = new THREE.Mesh(screen1, screenMaterial);
    screenMesh1.position.set(-36, 13, 0.3);
    screenMesh1.userData.isDiagnosticScreen = true;
    scene.add(screenMesh1);

    var panel2 = new THREE.BoxGeometry(8, 10, 0.5);
    var panelMesh2 = new THREE.Mesh(panel2, panelMaterial);
    panelMesh2.position.set(36, 12, 0);
    panelMesh2.castShadow = true;
    panelMesh2.userData.isDiagnostic = true;
    scene.add(panelMesh2);

    var screen2 = new THREE.BoxGeometry(6, 6, 0.2);
    var screenMesh2 = new THREE.Mesh(screen2, screenMaterial);
    screenMesh2.position.set(36, 13, 0.3);
    screenMesh2.userData.isDiagnosticScreen = true;
    scene.add(screenMesh2);
  };

  var createPowerConduits = function() {
    var conduitMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, metalness: 0.7 });

    var conduit1 = new THREE.BoxGeometry(2, 1, 60);
    var conduitMesh1 = new THREE.Mesh(conduit1, conduitMaterial);
    conduitMesh1.position.set(-35, 28, 0);
    conduitMesh1.castShadow = true;
    scene.add(conduitMesh1);

    var conduit2 = new THREE.BoxGeometry(60, 1, 2);
    var conduitMesh2 = new THREE.Mesh(conduit2, conduitMaterial);
    conduitMesh2.position.set(0, 28, 35);
    conduitMesh2.castShadow = true;
    scene.add(conduitMesh2);

    var conduit3 = new THREE.BoxGeometry(2, 25, 1);
    var conduitMesh3 = new THREE.Mesh(conduit3, conduitMaterial);
    conduitMesh3.position.set(35, 12, -35);
    conduitMesh3.castShadow = true;
    scene.add(conduitMesh3);
  };

  var createToolStorage = function() {
    var storageMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8, metalness: 0.3 });

    var shelf1 = new THREE.BoxGeometry(15, 1, 4);
    var shelfMesh1 = new THREE.Mesh(shelf1, storageMaterial);
    shelfMesh1.position.set(-25, 8, -35);
    shelfMesh1.castShadow = true;
    scene.add(shelfMesh1);

    var shelf2 = new THREE.BoxGeometry(15, 1, 4);
    var shelfMesh2 = new THREE.Mesh(shelf2, storageMaterial);
    shelfMesh2.position.set(-25, 16, -35);
    shelfMesh2.castShadow = true;
    scene.add(shelfMesh2);

    var shelf3 = new THREE.BoxGeometry(15, 1, 4);
    var shelfMesh3 = new THREE.Mesh(shelf3, storageMaterial);
    shelfMesh3.position.set(-25, 24, -35);
    shelfMesh3.castShadow = true;
    scene.add(shelfMesh3);

    for (var k = 0; k < 4; k++) {
      var tool = new THREE.BoxGeometry(2, 0.5, 2);
      var toolMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.8 });
      var toolMesh = new THREE.Mesh(tool, toolMaterial);
      toolMesh.position.set(-28 + k * 3, 8.5, -35);
      toolMesh.castShadow = true;
      scene.add(toolMesh);
    }
  };

  var createTestingRange = function() {
    var targetMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6, metalness: 0.5 });
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9, metalness: 0.1 });

    var backWall = new THREE.BoxGeometry(25, 30, 2);
    var backWallMesh = new THREE.Mesh(backWall, wallMaterial);
    backWallMesh.position.set(70, 15, -20);
    backWallMesh.castShadow = true;
    scene.add(backWallMesh);

    var target1 = new THREE.SphereGeometry(1.5, 8, 8);
    var targetMesh1 = new THREE.Mesh(target1, targetMaterial);
    targetMesh1.position.set(70, 15, -20);
    targetMesh1.castShadow = true;
    scene.add(targetMesh1);

    var target2 = new THREE.BoxGeometry(2, 3, 1);
    var targetMesh2 = new THREE.Mesh(target2, targetMaterial);
    targetMesh2.position.set(70, 8, -20);
    targetMesh2.castShadow = true;
    scene.add(targetMesh2);

    var target3 = new THREE.ConeGeometry(1.5, 3, 6);
    var targetMesh3 = new THREE.Mesh(target3, targetMaterial);
    targetMesh3.position.set(70, 22, -20);
    targetMesh3.castShadow = true;
    scene.add(targetMesh3);
  };

  var createMechGraveyard = function() {
    var scrapMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.3 });

    var wreck1 = new THREE.BoxGeometry(4, 6, 3);
    var wreckMesh1 = new THREE.Mesh(wreck1, scrapMaterial);
    wreckMesh1.position.set(65, 2, 40);
    wreckMesh1.rotation.z = 0.5;
    wreckMesh1.castShadow = true;
    scene.add(wreckMesh1);

    var wreck2 = new THREE.CylinderGeometry(1.5, 1.5, 5, 6);
    var wreckMesh2 = new THREE.Mesh(wreck2, scrapMaterial);
    wreckMesh2.position.set(70, 2, 45);
    wreckMesh2.rotation.x = 0.7;
    wreckMesh2.castShadow = true;
    scene.add(wreckMesh2);

    var wreck3 = new THREE.BoxGeometry(3, 4, 2);
    var wreckMesh3 = new THREE.Mesh(wreck3, scrapMaterial);
    wreckMesh3.position.set(60, 1, 50);
    wreckMesh3.rotation.z = -0.6;
    wreckMesh3.castShadow = true;
    scene.add(wreckMesh3);

    var wreck4 = new THREE.SphereGeometry(1.2, 6, 6);
    var wreckMesh4 = new THREE.Mesh(wreck4, scrapMaterial);
    wreckMesh4.position.set(75, 1, 40);
    wreckMesh4.castShadow = true;
    scene.add(wreckMesh4);
  };

  var createLadders = function() {
    var ladderMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6, metalness: 0.8 });

    var rung1 = new THREE.BoxGeometry(1, 0.3, 1);
    for (var m = 0; m < 6; m++) {
      var rungMesh = new THREE.Mesh(rung1, ladderMaterial);
      rungMesh.position.set(18, 2 + m * 1.5, 24);
      rungMesh.castShadow = true;
      scene.add(rungMesh);
    }

    var sideL = new THREE.BoxGeometry(0.2, 10, 0.2);
    var sideLMesh = new THREE.Mesh(sideL, ladderMaterial);
    sideLMesh.position.set(16.5, 6, 24);
    sideLMesh.castShadow = true;
    scene.add(sideLMesh);

    var sideR = new THREE.BoxGeometry(0.2, 10, 0.2);
    var sideRMesh = new THREE.Mesh(sideR, ladderMaterial);
    sideRMesh.position.set(19.5, 6, 24);
    sideRMesh.castShadow = true;
    scene.add(sideRMesh);
  };

  var update = function(deltaTime) {
    gantryX += gantryDirection * 0.15;
    if (gantryX > 40 || gantryX < -10) {
      gantryDirection *= -1;
    }

    var objects = scene.children;
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.userData.isGantry) {
        obj.position.x = gantryX;
      }
      if (obj.userData.isMechHead) {
        mechHeadAngle += 0.02;
        obj.rotation.y = Math.sin(mechHeadAngle) * 0.3;
      }
      if (obj.userData.isDiagnosticScreen) {
        diagnosticFlicker += 0.08;
        var flicker = Math.sin(diagnosticFlicker) > 0 ? 0.5 : 0.8;
        obj.material.emissiveIntensity = flicker;
      }
    }
  };

  var reset = function() {
    gantryX = 0;
    gantryDirection = 1;
    diagnosticFlicker = 0;
    mechHeadAngle = 0;

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    createLights();
    createFloor();
    createPits();
    createWalls();
    createGantryCrane();
    createMechOne();
    createMechTwo();
    createWeaponRacks();
    createDiagnosticPanels();
    createPowerConduits();
    createToolStorage();
    createTestingRange();
    createMechGraveyard();
    createLadders();
  };

  var onWindowResize = function() {
    if (camera && renderer) {
      var width = window.innerWidth;
      var height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
