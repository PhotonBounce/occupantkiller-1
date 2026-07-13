window.FortressPrison = (function() {
  'use strict';

  var sceneObjects = [];
  var gameState = {
    prisonerFreed: 0,
    guardsNeutralized: 0,
    extractionReached: false,
    isActive: false,
    lastKeypressTime: 0,
    fPressed: false
  };

  var animationState = {
    portcullisHeight: 0,
    portcullisMoving: false,
    portcullisDirection: 1,
    guardPatrolProgress: 0,
    watchtowerRotation: 0,
    camerasPan: [0, 0],
    vanRock: 0,
    floodlightSweep: 0
  };

  var scene;
  var camera;
  var hudElement;

  function createMesh(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    sceneObjects.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createLine(geometry, material) {
    var line = new THREE.LineSegments(geometry, material);
    sceneObjects.push(line);
    scene.add(line);
    return line;
  }

  function createOuterWall() {
    var wallThickness = 2;
    var wallHeight = 12;
    var perimeter = 80;

    var wallGeometry = new THREE.BoxGeometry(perimeter, wallHeight, wallThickness);
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      metalness: 0.1
    });

    var northWall = createMesh(wallGeometry, stoneMaterial);
    northWall.position.z = -perimeter / 2;

    var southWall = createMesh(wallGeometry, stoneMaterial);
    southWall.position.z = perimeter / 2;

    var eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, perimeter);
    var eastWall = createMesh(eastWallGeometry, stoneMaterial);
    eastWall.position.x = perimeter / 2;

    var westWall = createMesh(eastWallGeometry, stoneMaterial);
    westWall.position.x = -perimeter / 2;
  }

  function createCornerTowers() {
    var towerHeight = 14;
    var towerRadius = 3;

    var corners = [
      { x: 38, z: -38 },
      { x: 38, z: 38 },
      { x: -38, z: -38 },
      { x: -38, z: 38 }
    ];

    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      metalness: 0.1
    });

    corners.forEach(function(corner) {
      var cylinderGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 8);
      var tower = createMesh(cylinderGeometry, stoneMaterial);
      tower.position.set(corner.x, towerHeight / 2, corner.z);

      var crenelGeometry = new THREE.BoxGeometry(towerRadius * 2, 1.5, towerRadius * 2);
      var creneaux = createMesh(crenelGeometry, stoneMaterial);
      creneaux.position.set(corner.x, towerHeight + 0.75, corner.z);
    });
  }

  function createGatehouse() {
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      metalness: 0.1
    });

    var archGeometry = new THREE.BoxGeometry(8, 10, 3);
    var gatehouse = createMesh(archGeometry, stoneMaterial);
    gatehouse.position.set(0, 5, -41);

    var portcullisGeometry = new THREE.BufferGeometry();
    var positions = [];
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 8; j++) {
        positions.push(-4 + (i * 2), 10 - (j * 1.5), 0);
      }
    }
    portcullisGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    createLine(portcullisGeometry, lineMaterial);
  }

  function createInnerPrisonBlock() {
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.7,
      metalness: 0.05
    });

    var cellBlock1Geometry = new THREE.BoxGeometry(20, 8, 4);
    var cellBlock1 = createMesh(cellBlock1Geometry, stoneMaterial);
    cellBlock1.position.set(-12, 4, -8);

    var cellBlock2Geometry = new THREE.BoxGeometry(20, 8, 4);
    var cellBlock2 = createMesh(cellBlock2Geometry, stoneMaterial);
    cellBlock2.position.set(-12, 4, 8);

    var cellBlock3Geometry = new THREE.BoxGeometry(4, 8, 16);
    var cellBlock3 = createMesh(cellBlock3Geometry, stoneMaterial);
    cellBlock3.position.set(12, 4, 0);
  }

  function createExerciseYard() {
    var groundGeometry = new THREE.BoxGeometry(50, 0.2, 50);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.9,
      metalness: 0
    });
    createMesh(groundGeometry, groundMaterial);
  }

  function createWatchtower() {
    var platformGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.9
    });
    var platform = createMesh(platformGeometry, metalMaterial);
    platform.position.set(20, 10, 15);

    var legGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 6);
    var leg1 = createMesh(legGeometry, metalMaterial);
    leg1.position.set(20, 5, 15);

    var searchlightGeometry = new THREE.CylinderGeometry(1, 1.2, 2, 16);
    var searchlight = createMesh(searchlightGeometry, new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: 0x444444,
      metalness: 0.8
    }));
    searchlight.position.set(20, 11.5, 15);
  }

  function createRazorWire() {
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];

    var segments = 100;
    var radius = 38;
    var height = 10;
    var turns = 8;

    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2 * turns;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;
      var y = (i / segments) * height + 8;
      wirePositions.push(x, y, z);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 });
    createLine(wireGeometry, wireMaterial);
  }

  function createCCTVCameras() {
    var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.9
    });

    var cameraPositions = [
      { x: -30, z: -30 },
      { x: 30, z: -30 },
      { x: 30, z: 30 },
      { x: -30, z: 30 }
    ];

    cameraPositions.forEach(function(pos) {
      var pole = createMesh(poleGeometry, metalMaterial);
      pole.position.set(pos.x, 4, pos.z);

      var cameraGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
      var cameraMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x111111,
        metalness: 0.95
      });
      var cameraBody = createMesh(cameraGeometry, cameraMaterial);
      cameraBody.position.set(pos.x, 8.5, pos.z);
    });
  }

  function createControlRoom() {
    var buildingGeometry = new THREE.BoxGeometry(10, 6, 8);
    var concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.8,
      metalness: 0.1
    });
    var controlRoom = createMesh(buildingGeometry, concreteMaterial);
    controlRoom.position.set(-18, 3, 25);

    var screenGeometry = new THREE.BoxGeometry(8, 4, 0.3);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x001100,
      emissive: 0x00ff00,
      metalness: 0.8
    });
    var screen = createMesh(screenGeometry, screenMaterial);
    screen.position.set(-18, 4, 29);
  }

  function createArmory() {
    var buildingGeometry = new THREE.BoxGeometry(6, 5, 5);
    var concreteMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.8,
      metalness: 0.1
    });
    var armory = createMesh(buildingGeometry, concreteMaterial);
    armory.position.set(25, 2.5, -20);

    var doorGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9
    });
    var door = createMesh(doorGeometry, doorMaterial);
    door.position.set(25, 2, -22.5);
  }

  function createDrawbridge() {
    var bridgeGeometry = new THREE.BoxGeometry(10, 0.5, 6);
    var woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.9,
      metalness: 0.05
    });
    var drawbridge = createMesh(bridgeGeometry, woodMaterial);
    drawbridge.position.set(0, 0.25, -45);
  }

  function createSolitaryKeep() {
    var keepGeometry = new THREE.BoxGeometry(8, 12, 8);
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.85,
      metalness: 0.05
    });
    var keep = createMesh(keepGeometry, stoneMaterial);
    keep.position.set(0, 6, 20);
  }

  function createFloodlights() {
    var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.9
    });

    var floodPositions = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: 35, z: 35 },
      { x: -35, z: 35 }
    ];

    floodPositions.forEach(function(pos) {
      var pole = createMesh(poleGeometry, metalMaterial);
      pole.position.set(pos.x, 6, pos.z);

      var lampGeometry = new THREE.BoxGeometry(2, 1.5, 2);
      var lampMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        emissive: 0x4499ff,
        metalness: 0.7
      });
      var lamp = createMesh(lampGeometry, lampMaterial);
      lamp.position.set(pos.x, 12.5, pos.z);
    });
  }

  function createPrisonVan() {
    var vanGeometry = new THREE.BoxGeometry(4, 3, 8);
    var vanMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.3
    });
    var van = createMesh(vanGeometry, vanMaterial);
    van.position.set(-20, 1.5, 0);
  }

  function createFlagpole() {
    var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.9
    });
    var pole = createMesh(poleGeometry, metalMaterial);
    pole.position.set(15, 5, -25);

    var flagGeometry = new THREE.BoxGeometry(3, 2, 0.1);
    var flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.5,
      metalness: 0
    });
    var flag = createMesh(flagGeometry, flagMaterial);
    flag.position.set(16.5, 8, -25);
  }

  function createGuards() {
    var guardPositions = [
      { x: -15, z: -20 },
      { x: 15, z: -20 },
      { x: 15, z: 20 },
      { x: -15, z: 20 }
    ];

    var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    var guardMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.2
    });

    guardPositions.forEach(function(pos) {
      var body = createMesh(bodyGeometry, guardMaterial);
      body.position.set(pos.x, 1, pos.z);

      var shieldGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.2);
      var shieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6,
        metalness: 0.8
      });
      var shield = createMesh(shieldGeometry, shieldMaterial);
      shield.position.set(pos.x + 0.5, 1, pos.z);
    });
  }

  function createWarden() {
    var bodyGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.9);
    var wardenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.3
    });
    var warden = createMesh(bodyGeometry, wardenMaterial);
    warden.position.set(0, 1.1, -35);

    var hatGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.2);
    var hatMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8,
      metalness: 0.1
    });
    var hat = createMesh(hatGeometry, hatMaterial);
    hat.position.set(0, 2.5, -35);
  }

  function createLights() {
    var ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);

    var spotLight1 = new THREE.SpotLight(0x4499ff, 1.5, 100, Math.PI / 6, 0.5, 1);
    spotLight1.position.set(-35, 12, -35);
    scene.add(spotLight1);

    var spotLight2 = new THREE.SpotLight(0x4499ff, 1.5, 100, Math.PI / 6, 0.5, 1);
    spotLight2.position.set(35, 12, 35);
    scene.add(spotLight2);
  }

  function createFog() {
    scene.fog = new THREE.Fog(0x333333, 150, 250);
    scene.background = new THREE.Color(0x1a1a1a);
  }

  function updateHUD() {
    var text = 'PRISONERS FREED: ' + gameState.prisonerFreed + '/4\n' +
               'GUARDS NEUTRALIZED: ' + gameState.guardsNeutralized + '\n' +
               'EXTRACTION POINT: ' + (gameState.extractionReached ? 'YES' : 'NO') + '\n' +
               'STATUS: ' + (gameState.isActive ? 'ACTIVE' : 'INACTIVE');

    if (hudElement) {
      hudElement.textContent = text;
    }
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.style.position = 'fixed';
      hudElement.style.top = '10px';
      hudElement.style.right = '10px';
      hudElement.style.color = '#00ff00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      hudElement.style.padding = '10px';
      hudElement.style.border = '1px solid #00ff00';
      hudElement.style.zIndex = '1000';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;

    createExerciseYard();
    createOuterWall();
    createCornerTowers();
    createGatehouse();
    createInnerPrisonBlock();
    createWatchtower();
    createRazorWire();
    createCCTVCameras();
    createControlRoom();
    createArmory();
    createDrawbridge();
    createSolitaryKeep();
    createFloodlights();
    createPrisonVan();
    createFlagpole();
    createGuards();
    createWarden();
    createLights();
    createFog();
    createHUD();

    document.addEventListener('keydown', handleKeyPress);
  }

  function handleKeyPress(event) {
    if (event.key === 'f' || event.key === 'F') {
      var now = Date.now();
      if (now - gameState.lastKeypressTime < 400 && gameState.fPressed) {
        gameState.isActive = !gameState.isActive;
        updateHUD();
        if (gameState.isActive) {
          console.log('[FortressPrison] Module activated');
        } else {
          console.log('[FortressPrison] Module deactivated');
        }
        gameState.fPressed = false;
        gameState.lastKeypressTime = 0;
      } else {
        gameState.fPressed = true;
        gameState.lastKeypressTime = now;
      }
    }
    if (event.key === 'p' || event.key === 'P') {
      if (gameState.fPressed && Date.now() - gameState.lastKeypressTime < 400) {
        gameState.isActive = !gameState.isActive;
        updateHUD();
        if (gameState.isActive) {
          console.log('[FortressPrison] Module activated');
        } else {
          console.log('[FortressPrison] Module deactivated');
        }
        gameState.fPressed = false;
        gameState.lastKeypressTime = 0;
      }
    }
  }

  function update(delta) {
    if (!gameState.isActive) {
      return;
    }

    animationState.portcullisHeight += animationState.portcullisDirection * delta * 3;
    if (animationState.portcullisHeight >= 1) {
      animationState.portcullisHeight = 1;
      animationState.portcullisDirection = -1;
    } else if (animationState.portcullisHeight <= 0) {
      animationState.portcullisHeight = 0;
      animationState.portcullisDirection = 1;
    }

    animationState.guardPatrolProgress += delta * 0.1;
    if (animationState.guardPatrolProgress > 1) {
      animationState.guardPatrolProgress = 0;
    }

    animationState.watchtowerRotation += delta * 0.5;
    if (animationState.watchtowerRotation > Math.PI * 2) {
      animationState.watchtowerRotation = 0;
    }

    animationState.camerasPan[0] += delta * 1.5;
    if (animationState.camerasPan[0] > Math.PI * 2) {
      animationState.camerasPan[0] = 0;
    }

    animationState.vanRock += delta * 2;
    if (animationState.vanRock > Math.PI * 2) {
      animationState.vanRock = 0;
    }

    animationState.floodlightSweep += delta * 0.8;
    if (animationState.floodlightSweep > Math.PI * 2) {
      animationState.floodlightSweep = 0;
    }
  }

  function reset() {
    gameState.prisonerFreed = 0;
    gameState.guardsNeutralized = 0;
    gameState.extractionReached = false;
    gameState.isActive = false;

    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyPress);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
