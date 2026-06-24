var window = window || {};

window.BridgeAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var gameState = {
    bridgeProgress: 0,
    enemiesDown: 0,
    gameActive: true,
    moduleActive: false,
    lastKeyPress: null,
    hudElement: null
  };

  var animationState = {
    riverFlow: 0,
    tracerFires: [],
    bridgeSway: 0,
    smokeParticles: []
  };

  var keyboardState = {};

  function createBridge() {
    var bridgeGroup = new THREE.Group();

    var deckGeometry = new THREE.BoxGeometry(2, 0.5, 80);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.3,
      roughness: 0.8
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0;
    bridgeGroup.add(deck);
    sceneObjects.push(deck);

    var towerLeftGeometry = new THREE.BoxGeometry(1.5, 30, 1.5);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.2,
      roughness: 0.9
    });
    var towerLeft = new THREE.Mesh(towerLeftGeometry, towerMaterial);
    towerLeft.position.set(-15, 15, -35);
    bridgeGroup.add(towerLeft);
    sceneObjects.push(towerLeft);

    var towerRight = new THREE.Mesh(towerLeftGeometry, towerMaterial);
    towerRight.position.set(15, 15, -35);
    bridgeGroup.add(towerRight);
    sceneObjects.push(towerRight);

    var towerLeftFar = new THREE.Mesh(towerLeftGeometry, towerMaterial);
    towerLeftFar.position.set(-15, 15, 35);
    bridgeGroup.add(towerLeftFar);
    sceneObjects.push(towerLeftFar);

    var towerRightFar = new THREE.Mesh(towerLeftGeometry, towerMaterial);
    towerRightFar.position.set(15, 15, 35);
    bridgeGroup.add(towerRightFar);
    sceneObjects.push(towerRightFar);

    var cablePoints = [
      new THREE.Vector3(-15, 15, -35),
      new THREE.Vector3(-20, 5, -25),
      new THREE.Vector3(-20, 5, 0),
      new THREE.Vector3(-20, 5, 25),
      new THREE.Vector3(-15, 15, 35)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var cableLeft = new THREE.LineSegments(cableGeometry, cableMaterial);
    bridgeGroup.add(cableLeft);
    sceneObjects.push(cableLeft);

    var cablePointsRight = [
      new THREE.Vector3(15, 15, -35),
      new THREE.Vector3(20, 5, -25),
      new THREE.Vector3(20, 5, 0),
      new THREE.Vector3(20, 5, 25),
      new THREE.Vector3(15, 15, 35)
    ];
    var cableGeometryRight = new THREE.BufferGeometry().setFromPoints(cablePointsRight);
    var cableRight = new THREE.LineSegments(cableGeometryRight, cableMaterial);
    bridgeGroup.add(cableRight);
    sceneObjects.push(cableRight);

    var railLeftGeometry = new THREE.BoxGeometry(0.2, 1.5, 80);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.4,
      roughness: 0.7
    });
    var railLeft = new THREE.Mesh(railLeftGeometry, railMaterial);
    railLeft.position.set(-1.5, 1.5, 0);
    bridgeGroup.add(railLeft);
    sceneObjects.push(railLeft);

    var railRight = new THREE.Mesh(railLeftGeometry, railMaterial);
    railRight.position.set(1.5, 1.5, 0);
    bridgeGroup.add(railRight);
    sceneObjects.push(railRight);

    bridgeGroup.userData.sway = 0;
    bridgeGroup.userData.originalPosition = bridgeGroup.position.clone();

    scene.add(bridgeGroup);
    sceneObjects.push(bridgeGroup);
    return bridgeGroup;
  }

  function createGorge() {
    var gorgeGroup = new THREE.Group();

    var canyonLeftGeometry = new THREE.BoxGeometry(15, 40, 100);
    var canyonMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0,
      roughness: 1
    });
    var canyonLeft = new THREE.Mesh(canyonLeftGeometry, canyonMaterial);
    canyonLeft.position.set(-25, -20, 0);
    gorgeGroup.add(canyonLeft);
    sceneObjects.push(canyonLeft);

    var canyonRight = new THREE.Mesh(canyonLeftGeometry, canyonMaterial);
    canyonRight.position.set(25, -20, 0);
    gorgeGroup.add(canyonRight);
    sceneObjects.push(canyonRight);

    var riverGeometry = new THREE.BoxGeometry(50, 2, 100);
    var riverMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066aa,
      metalness: 0.8,
      roughness: 0.4,
      emissive: 0x003366,
      emissiveIntensity: 0.5
    });
    var river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.position.y = -42;
    river.userData.riverMaterial = riverMaterial;
    gorgeGroup.add(river);
    sceneObjects.push(river);

    scene.add(gorgeGroup);
    sceneObjects.push(gorgeGroup);
    return gorgeGroup;
  }

  function createEnemyFortification() {
    var fortGroup = new THREE.Group();

    var bunkerGeometry = new THREE.BoxGeometry(4, 3, 2);
    var bunkerMaterial = new THREE.MeshStandardMaterial({
      color: 0x554422,
      metalness: 0.1,
      roughness: 0.95
    });

    var bunker1 = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker1.position.set(-8, 1, 38);
    fortGroup.add(bunker1);
    sceneObjects.push(bunker1);

    var bunker2 = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker2.position.set(8, 1, 38);
    fortGroup.add(bunker2);
    sceneObjects.push(bunker2);

    var parapet1Geometry = new THREE.BoxGeometry(3, 1.5, 0.4);
    var parapesMaterial = new THREE.MeshStandardMaterial({
      color: 0x332211,
      metalness: 0.05,
      roughness: 0.95
    });

    var parapet1 = new THREE.Mesh(parapet1Geometry, parapesMaterial);
    parapet1.position.set(-8, 2, 37);
    fortGroup.add(parapet1);
    sceneObjects.push(parapet1);

    var parapet2 = new THREE.Mesh(parapet1Geometry, parapesMaterial);
    parapet2.position.set(8, 2, 37);
    fortGroup.add(parapet2);
    sceneObjects.push(parapet2);

    var gunnerGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.6);
    var gunnerMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      metalness: 0,
      roughness: 0.8
    });

    var gunner1 = new THREE.Mesh(gunnerGeometry, gunnerMaterial);
    gunner1.position.set(-10, 2, 37.5);
    fortGroup.add(gunner1);
    sceneObjects.push(gunner1);

    var gunner2 = new THREE.Mesh(gunnerGeometry, gunnerMaterial);
    gunner2.position.set(10, 2, 37.5);
    fortGroup.add(gunner2);
    sceneObjects.push(gunner2);

    scene.add(fortGroup);
    sceneObjects.push(fortGroup);
    return fortGroup;
  }

  function createVehicleWreckage() {
    var wreckageGroup = new THREE.Group();

    var vehicle1Geometry = new THREE.BoxGeometry(3, 2, 6);
    var wreckageMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.8
    });

    var vehicle1 = new THREE.Mesh(vehicle1Geometry, wreckageMaterial);
    vehicle1.position.set(-5, 0.5, -20);
    vehicle1.rotation.z = 0.2;
    wreckageGroup.add(vehicle1);
    sceneObjects.push(vehicle1);

    var vehicle2 = new THREE.Mesh(vehicle1Geometry, wreckageMaterial);
    vehicle2.position.set(6, 0.5, -5);
    vehicle2.rotation.z = -0.15;
    wreckageGroup.add(vehicle2);
    sceneObjects.push(vehicle2);

    scene.add(wreckageGroup);
    sceneObjects.push(wreckageGroup);
    return wreckageGroup;
  }

  function createTracerFire() {
    var tracerGroup = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var tracerGeometry = new THREE.SphereGeometry(0.15, 4, 4);
      var tracerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 1.5,
        metalness: 0.5,
        roughness: 0.4
      });
      var tracer = new THREE.Mesh(tracerGeometry, tracerMaterial);
      tracer.position.set(
        Math.random() * 20 - 10,
        2,
        38 + Math.random() * 2
      );

      var tracerData = {
        mesh: tracer,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 25,
          Math.random() * 5 - 2,
          -Math.random() * 35 - 25
        ),
        lifetime: 3
      };

      animationState.tracerFires.push(tracerData);
      tracerGroup.add(tracer);
      sceneObjects.push(tracer);
    }

    scene.add(tracerGroup);
    sceneObjects.push(tracerGroup);
    return tracerGroup;
  }

  function createSmokeClouds() {
    var smokeGroup = new THREE.Group();

    for (var i = 0; i < 15; i++) {
      var smokeGeometry = new THREE.SphereGeometry(3 + Math.random() * 4, 4, 4);
      var smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        emissive: 0x444444,
        emissiveIntensity: 0.3,
        metalness: 0,
        roughness: 0.95,
        transparent: true,
        opacity: 0.5
      });
      var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smoke.position.set(
        Math.random() * 30 - 15,
        5 + Math.random() * 10,
        -30 + Math.random() * 40
      );

      var smokeData = {
        mesh: smoke,
        floatSpeed: Math.random() * 2 + 1,
        swayAmount: Math.random() * 0.5 + 0.5,
        age: Math.random() * 2
      };

      animationState.smokeParticles.push(smokeData);
      smokeGroup.add(smoke);
      sceneObjects.push(smoke);
    }

    scene.add(smokeGroup);
    sceneObjects.push(smokeGroup);
    return smokeGroup;
  }

  function createHUD() {
    if (gameState.hudElement) {
      document.body.removeChild(gameState.hudElement);
    }

    var hud = document.createElement('div');
    hud.id = 'bridge-assault-hud';
    hud.style.position = 'fixed';
    hud.style.top = '10px';
    hud.style.left = '10px';
    hud.style.color = '#00ff00';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '14px';
    hud.style.zIndex = '1000';
    hud.style.textShadow = '0 0 10px #00ff00';
    hud.style.pointerEvents = 'none';

    hud.innerHTML = '' +
      'BRIDGE ADVANCE: 0%<br>' +
      'ENEMIES DOWN: 0<br>' +
      'OBJECTIVES: REACH FAR END<br>' +
      '<br>' +
      '<span style="color: #ffff00;">Press B+A (B then A within 400ms) to toggle module</span>';

    document.body.appendChild(hud);
    gameState.hudElement = hud;
  }

  function updateHUD() {
    if (!gameState.hudElement) return;

    var progress = Math.min(100, Math.floor(gameState.bridgeProgress * 100));
    var moduleStatus = gameState.moduleActive ? 'ACTIVE' : 'INACTIVE';

    gameState.hudElement.innerHTML = '' +
      'BRIDGE ADVANCE: ' + progress + '%<br>' +
      'ENEMIES DOWN: ' + gameState.enemiesDown + '<br>' +
      'OBJECTIVES: REACH FAR END<br>' +
      'MODULE: <span style="color: ' + (gameState.moduleActive ? '#00ff00' : '#ff0000') + ';">' + moduleStatus + '</span><br>' +
      '<br>' +
      '<span style="color: #ffff00;">Press B+A (B then A within 400ms) to toggle module</span>';
  }

  function handleKeyDown(event) {
    keyboardState[event.key.toUpperCase()] = true;

    if (event.key.toUpperCase() === 'B') {
      var now = Date.now();
      if (gameState.lastKeyPress && now - gameState.lastKeyPress < 400) {
        var wasActive = gameState.moduleActive;
        gameState.moduleActive = !gameState.moduleActive;
        console.log('Bridge Assault module toggled: ' + (gameState.moduleActive ? 'ON' : 'OFF'));
        updateHUD();
        gameState.lastKeyPress = null;
      } else {
        gameState.lastKeyPress = now;
      }
    }

    if (event.key.toUpperCase() === 'A') {
      if (gameState.lastKeyPress && (Date.now() - gameState.lastKeyPress) < 400) {
        var wasActive = gameState.moduleActive;
        gameState.moduleActive = !gameState.moduleActive;
        console.log('Bridge Assault module toggled: ' + (gameState.moduleActive ? 'ON' : 'OFF'));
        updateHUD();
        gameState.lastKeyPress = null;
      }
    }
  }

  function handleKeyUp(event) {
    keyboardState[event.key.toUpperCase()] = false;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    gameState.gameActive = true;
    gameState.moduleActive = true;
    gameState.bridgeProgress = 0;
    gameState.enemiesDown = 0;
    sceneObjects = [];
    animationState.tracerFires = [];
    animationState.smokeParticles = [];
    animationState.riverFlow = 0;
    animationState.bridgeSway = 0;

    scene.fog = new THREE.Fog(0x8a7a5a, 80, 200);
    scene.background = new THREE.Color(0x3a3a4a);

    createBridge();
    createGorge();
    createEnemyFortification();
    createVehicleWreckage();
    createTracerFire();
    createSmokeClouds();

    createHUD();

    if (!window.bridgeAssaultKeyHandler) {
      window.bridgeAssaultKeyHandler = true;
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
    }

    console.log('Bridge Assault initialized');
  }

  function update(delta) {
    if (!scene || !gameState.gameActive || !gameState.moduleActive) {
      return;
    }

    animationState.riverFlow += delta * 0.5;
    animationState.bridgeSway += delta;

    var bridgeGroup = sceneObjects.find(function(obj) {
      return obj.userData && obj.userData.sway !== undefined;
    });

    if (bridgeGroup) {
      var swayAmount = Math.sin(animationState.bridgeSway) * 0.08;
      bridgeGroup.position.y = swayAmount;
    }

    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.userData && obj.userData.riverMaterial) {
        var intensity = 0.3 + Math.sin(animationState.riverFlow) * 0.2;
        obj.userData.riverMaterial.emissiveIntensity = intensity;
      }
    }

    for (var i = animationState.tracerFires.length - 1; i >= 0; i--) {
      var tracer = animationState.tracerFires[i];
      tracer.mesh.position.add(tracer.velocity.clone().multiplyScalar(delta));
      tracer.lifetime -= delta;

      if (tracer.lifetime <= 0) {
        scene.remove(tracer.mesh);
        animationState.tracerFires.splice(i, 1);
      }
    }

    for (var i = 0; i < animationState.smokeParticles.length; i++) {
      var smoke = animationState.smokeParticles[i];
      smoke.age += delta;
      smoke.mesh.position.y += smoke.floatSpeed * delta;
      smoke.mesh.position.x += Math.sin(smoke.age * smoke.swayAmount) * delta;
      smoke.mesh.scale.x = 1 + smoke.age * 0.3;
      smoke.mesh.scale.y = 1 + smoke.age * 0.3;
      smoke.mesh.scale.z = 1 + smoke.age * 0.3;
      smoke.mesh.material.opacity = Math.max(0, 0.5 - smoke.age * 0.1);
    }

    if (keyboardState['W'] || keyboardState['ARROWUP']) {
      gameState.bridgeProgress += delta * 0.1;
      if (gameState.bridgeProgress > 1) {
        gameState.bridgeProgress = 1;
      }
    }

    if (keyboardState['SPACE']) {
      gameState.enemiesDown += 1;
      keyboardState['SPACE'] = false;
    }

    if (animationState.tracerFires.length < 5 && Math.random() < 0.3) {
      createTracerFire();
    }

    updateHUD();
  }

  function reset() {
    gameState.gameActive = false;
    gameState.moduleActive = false;

    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }

    sceneObjects = [];
    animationState.tracerFires = [];
    animationState.smokeParticles = [];

    if (gameState.hudElement && gameState.hudElement.parentNode) {
      document.body.removeChild(gameState.hudElement);
      gameState.hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    window.bridgeAssaultKeyHandler = false;

    console.log('Bridge Assault reset');
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
