window.DamAssault = (function() {
  'use strict';

  var scene, camera;
  var sceneObjects = [];
  var commandos = [];
  var particles = [];
  var powerLineWires = [];
  var gameState = {
    chargesDisarmed: 0,
    commandosDown: 0,
    damIntegrity: 100,
    hudVisible: true
  };
  var keybindBuffer = [];
  var lastKeyTime = 0;

  function createDamWall() {
    var geometry = new THREE.BoxGeometry(300, 200, 20);
    var material = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.1
    });
    var damWall = new THREE.Mesh(geometry, material);
    damWall.position.set(0, 0, 0);
    damWall.castShadow = true;
    damWall.receiveShadow = true;
    scene.add(damWall);
    sceneObjects.push(damWall);
    return damWall;
  }

  function createReservoir() {
    var geometry = new THREE.BoxGeometry(400, 150, 400);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1e5a8e,
      roughness: 0.3,
      metalness: 0.0,
      transparent: true,
      opacity: 0.6
    });
    var reservoir = new THREE.Mesh(geometry, material);
    reservoir.position.set(0, 150, -150);
    reservoir.castShadow = true;
    reservoir.receiveShadow = true;
    scene.add(reservoir);
    sceneObjects.push(reservoir);
    return reservoir;
  }

  function createSpillwayChannels() {
    var geometry = new THREE.BoxGeometry(80, 30, 200);
    var material = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.7,
      metalness: 0.2
    });

    var spillway = new THREE.Mesh(geometry, material);
    spillway.position.set(-100, -50, 50);
    spillway.rotation.z = Math.PI / 8;
    spillway.castShadow = true;
    spillway.receiveShadow = true;
    scene.add(spillway);
    sceneObjects.push(spillway);

    var spillway2 = new THREE.Mesh(geometry, material);
    spillway2.position.set(100, -50, 50);
    spillway2.rotation.z = -Math.PI / 8;
    spillway2.castShadow = true;
    spillway2.receiveShadow = true;
    scene.add(spillway2);
    sceneObjects.push(spillway2);

    return [spillway, spillway2];
  }

  function createTurbineHall() {
    var geometry = new THREE.BoxGeometry(120, 100, 150);
    var material = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8,
      metalness: 0.3
    });
    var turbineHall = new THREE.Mesh(geometry, material);
    turbineHall.position.set(0, -80, 200);
    turbineHall.castShadow = true;
    turbineHall.receiveShadow = true;
    scene.add(turbineHall);
    sceneObjects.push(turbineHall);

    var turbineGeometry = new THREE.CylinderGeometry(20, 20, 80, 16);
    var turbineMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.7
    });

    var turbine1 = new THREE.Mesh(turbineGeometry, turbineMaterial);
    turbine1.position.set(-30, -80, 150);
    turbine1.rotation.z = Math.PI / 2;
    turbine1.castShadow = true;
    turbine1.receiveShadow = true;
    scene.add(turbine1);
    sceneObjects.push(turbine1);

    var turbine2 = new THREE.Mesh(turbineGeometry, turbineMaterial);
    turbine2.position.set(30, -80, 150);
    turbine2.rotation.z = Math.PI / 2;
    turbine2.castShadow = true;
    turbine2.receiveShadow = true;
    scene.add(turbine2);
    sceneObjects.push(turbine2);

    return [turbine1, turbine2];
  }

  function createPowerTransmissionLines() {
    var towersGeometry = new THREE.CylinderGeometry(8, 10, 180, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.6
    });

    var tower1 = new THREE.Mesh(towersGeometry, towerMaterial);
    tower1.position.set(-150, 50, 100);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    scene.add(tower1);
    sceneObjects.push(tower1);

    var tower2 = new THREE.Mesh(towersGeometry, towerMaterial);
    tower2.position.set(150, 50, 100);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    scene.add(tower2);
    sceneObjects.push(tower2);

    var points = [
      new THREE.Vector3(-145, 80, 100),
      new THREE.Vector3(0, 85, 100),
      new THREE.Vector3(145, 80, 100)
    ];
    var wireGeometry = new THREE.BufferGeometry().setFromPoints(points);
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    var powerLine = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(powerLine);
    sceneObjects.push(powerLine);

    powerLineWires.push({
      line: powerLine,
      originalPoints: points.map(function(p) { return p.clone(); }),
      time: 0
    });

    return [tower1, tower2, powerLine];
  }

  function createControlRoom() {
    var geometry = new THREE.BoxGeometry(50, 40, 60);
    var material = new THREE.MeshStandardMaterial({
      color: 0x453a3a,
      roughness: 0.7,
      metalness: 0.2
    });
    var controlRoom = new THREE.Mesh(geometry, material);
    controlRoom.position.set(-80, -60, 150);
    controlRoom.castShadow = true;
    controlRoom.receiveShadow = true;
    scene.add(controlRoom);
    sceneObjects.push(controlRoom);

    var windowGeometry = new THREE.BoxGeometry(12, 8, 2);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.1,
      metalness: 0.3
    });

    for (var i = 0; i < 3; i++) {
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-55 + i * 15, -45, 180);
      window.castShadow = true;
      window.receiveShadow = true;
      scene.add(window);
      sceneObjects.push(window);
    }

    return controlRoom;
  }

  function createBoatDock() {
    var geometry = new THREE.BoxGeometry(100, 8, 50);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.8,
      metalness: 0.1
    });
    var dock = new THREE.Mesh(geometry, material);
    dock.position.set(-150, 80, -180);
    dock.castShadow = true;
    dock.receiveShadow = true;
    scene.add(dock);
    sceneObjects.push(dock);
    return dock;
  }

  function createEnvironment() {
    var fogColor = 0xb0c4de;
    scene.fog = new THREE.Fog(fogColor, 800, 1200);
    scene.background = new THREE.Color(0x87ceeb);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 300);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    directionalLight.shadow.camera.far = 2000;
    scene.add(directionalLight);

    var gorgeGeometry = new THREE.BoxGeometry(600, 300, 500);
    var gorgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x665544,
      roughness: 0.9,
      metalness: 0.0
    });
    var gorgeWalls = [];

    var gorgeLeft = new THREE.Mesh(gorgeGeometry, gorgeMaterial);
    gorgeLeft.position.set(-250, -50, 0);
    gorgeLeft.castShadow = true;
    gorgeLeft.receiveShadow = true;
    scene.add(gorgeLeft);
    sceneObjects.push(gorgeLeft);
    gorgeWalls.push(gorgeLeft);

    var gorgeRight = new THREE.Mesh(gorgeGeometry, gorgeMaterial);
    gorgeRight.position.set(250, -50, 0);
    gorgeRight.castShadow = true;
    gorgeRight.receiveShadow = true;
    scene.add(gorgeRight);
    sceneObjects.push(gorgeRight);
    gorgeWalls.push(gorgeRight);
  }

  function createCommando() {
    var groupGeometry = new THREE.BoxGeometry(8, 24, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.7,
      metalness: 0.1
    });

    var body = new THREE.Mesh(groupGeometry, material);
    body.position.set(0, 0, 0);
    body.castShadow = true;
    body.receiveShadow = true;

    var headGeometry = new THREE.SphereGeometry(5, 8, 8);
    var head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 18, 0);
    head.castShadow = true;
    head.receiveShadow = true;

    var group = new THREE.Group();
    group.add(body);
    group.add(head);

    var startX = (Math.random() - 0.5) * 200;
    group.position.set(startX, 80, -100);
    group.userData.velocity = new THREE.Vector3(0, -30, Math.random() * 20 - 10);
    group.userData.rappelTime = 0;
    group.userData.maxRappelTime = 8 + Math.random() * 4;
    group.userData.alive = true;

    scene.add(group);
    sceneObjects.push(group);
    commandos.push(group);

    return group;
  }

  function updateCommandos(delta) {
    for (var i = commandos.length - 1; i >= 0; i--) {
      var commando = commandos[i];
      if (!commando.userData.alive) continue;

      commando.userData.rappelTime += delta;
      commando.position.y -= 40 * delta;
      commando.position.x += commando.userData.velocity.x * 0.1 * delta;

      if (commando.position.y < -150) {
        commando.userData.alive = false;
        gameState.damIntegrity = Math.max(0, gameState.damIntegrity - 20);
      }
    }
  }

  function createSpillingWater() {
    var particleGeometry = new THREE.SphereGeometry(2, 4, 4);
    var particleMaterial = new THREE.MeshStandardMaterial({
      color: 0x4da6ff,
      roughness: 0.4,
      metalness: 0.0,
      transparent: true,
      opacity: 0.7
    });

    for (var i = 0; i < 20; i++) {
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 120,
        -30 + Math.random() * 20,
        50 + Math.random() * 80
      );
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        -80 - Math.random() * 40,
        (Math.random() - 0.5) * 20
      );
      particle.userData.life = 0;
      particle.userData.maxLife = 3 + Math.random() * 2;

      scene.add(particle);
      sceneObjects.push(particle);
      particles.push(particle);
    }
  }

  function updateWaterParticles(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var particle = particles[i];
      particle.userData.life += delta;

      particle.position.add(
        particle.userData.velocity.clone().multiplyScalar(delta)
      );

      particle.userData.velocity.y -= 20 * delta;

      if (particle.userData.life > particle.userData.maxLife) {
        scene.remove(particle);
        particles.splice(i, 1);
      }
    }
  }

  function updatePowerLineWires(delta) {
    for (var i = 0; i < powerLineWires.length; i++) {
      var wireData = powerLineWires[i];
      wireData.time += delta;

      var points = [];
      for (var j = 0; j < wireData.originalPoints.length; j++) {
        var orig = wireData.originalPoints[j];
        var sway = Math.sin(wireData.time * 2 + j) * 5;
        var point = orig.clone();
        point.y += sway;
        point.x += Math.cos(wireData.time * 1.5 + j) * 3;
        points.push(point);
      }

      wireData.line.geometry.dispose();
      wireData.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    }
  }

  function updateTurbines(delta) {
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.geometry instanceof THREE.CylinderGeometry && obj.rotation.z === Math.PI / 2) {
        obj.rotation.z += 3 * delta;
      }
    }
  }

  function setupKeybinds() {
    document.addEventListener('keydown', function(event) {
      var key = event.key.toUpperCase();
      var now = Date.now();

      if (now - lastKeyTime > 400) {
        keybindBuffer = [];
      }
      lastKeyTime = now;

      keybindBuffer.push(key);

      if (keybindBuffer.length > 2) {
        keybindBuffer.shift();
      }

      if (keybindBuffer.length === 2 && keybindBuffer[0] === 'D' && keybindBuffer[1] === 'A') {
        gameState.hudVisible = !gameState.hudVisible;
        keybindBuffer = [];

        if (gameState.hudVisible) {
          console.log('HUD ENABLED');
        } else {
          console.log('HUD DISABLED');
        }
      }
    });
  }

  function drawHUD() {
    if (!gameState.hudVisible) return;

    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    var context = canvas.getContext('2d');

    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#ffffff';
    context.font = 'bold 24px Arial';
    context.fillText('CHARGES DISARMED: ' + gameState.chargesDisarmed + '/5', 20, 50);
    context.fillText('COMMANDOS DOWN: ' + gameState.commandosDown, 20, 100);
    context.fillText('DAM INTEGRITY: ' + gameState.damIntegrity + '%', 20, 150);

    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    sceneObjects = [];
    commandos = [];
    particles = [];
    powerLineWires = [];
    gameState = {
      chargesDisarmed: 0,
      commandosDown: 0,
      damIntegrity: 100,
      hudVisible: true
    };
    keybindBuffer = [];
    lastKeyTime = 0;

    createEnvironment();
    createDamWall();
    createReservoir();
    createSpillwayChannels();
    createTurbineHall();
    createPowerTransmissionLines();
    createControlRoom();
    createBoatDock();
    createSpillingWater();

    for (var i = 0; i < 3; i++) {
      createCommando();
    }

    setupKeybinds();
  }

  function update(delta) {
    if (delta > 0.1) delta = 0.1;

    updateCommandos(delta);
    updateWaterParticles(delta);
    updatePowerLineWires(delta);
    updateTurbines(delta);

    if (Math.random() < 0.02) {
      if (particles.length < 30) {
        createSpillingWater();
      }
    }
  }

  function reset() {
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      scene.remove(sceneObjects[i]);
    }

    sceneObjects = [];
    commandos = [];
    particles = [];
    powerLineWires = [];
    keybindBuffer = [];
    lastKeyTime = 0;

    gameState = {
      chargesDisarmed: 0,
      commandosDown: 0,
      damIntegrity: 100,
      hudVisible: true
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getGameState: function() { return gameState; }
  };
}());
