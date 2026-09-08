window.VolcanoLair = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene, camera, renderer, canvas;
  var objects = [];
  var lavaChannels = [];
  var lavaBubbles = [];
  var guards = [];
  var hudCanvas, hudCtx;
  var gameState = { henchmenDown: 0, launchCodeObtained: false, selfDestructArmed: false };
  var keyPressTimings = { v: null, l: null };
  var radarDish, rocket, countdown, scientist;
  var camera1, camera2, cameraActive = 'camera1';

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 300, 1500);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 80, 150);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xff8844, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var lavaGlow = new THREE.PointLight(0xff4400, 1.5, 300);
    lavaGlow.position.set(0, 30, 0);
    scene.add(lavaGlow);

    buildVolcanoInterior();
    buildLavaChannels();
    buildControlRoom();
    buildDoomsdayConsole();
    buildRocketSilo();
    buildCatwalkBridges();
    buildCoolingTower();
    buildComputerBanks();
    buildHenchmenGuards();
    buildScientist();
    buildRadarDish();
    buildCountdownClock();
    buildWeaponRacks();
    buildEscapeSubmarine();
    buildLavaBubbles();
    buildSelfDestructPanel();

    setupHUD();
    setupKeyboardInput();

    window.addEventListener('resize', onWindowResize);
    animate();
  }

  function buildVolcanoInterior() {
    var geometry = new THREE.BoxGeometry(400, 300, 400);
    var material = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
    var wall1 = new THREE.Mesh(geometry, material);
    wall1.position.set(0, 0, 0);
    wall1.scale.set(1, 2, 1);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    objects.push(wall1);

    // Rock formations - angled walls
    for (var i = 0; i < 4; i++) {
      var rockGeo = new THREE.BoxGeometry(150, 250, 30);
      var rockMat = new THREE.MeshStandardMaterial({ color: 0x5a4838, roughness: 0.9 });
      var rock = new THREE.Mesh(rockGeo, rockMat);
      var angle = (i / 4) * Math.PI * 2;
      rock.position.x = Math.cos(angle) * 180;
      rock.position.z = Math.sin(angle) * 180;
      rock.position.y = 50;
      rock.rotation.z = angle + Math.PI / 6;
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      objects.push(rock);
    }

    // Cavern ceiling
    var ceilingGeo = new THREE.BoxGeometry(450, 50, 450);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x3a2f28 });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 200;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    objects.push(ceiling);
  }

  function buildLavaChannels() {
    // Channel 1 - Long lava flow
    var lavaGeo1 = new THREE.BoxGeometry(80, 20, 200);
    var lavaMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 1.2,
      roughness: 0.3
    });
    var lava1 = new THREE.Mesh(lavaGeo1, lavaMat);
    lava1.position.set(-60, 15, 0);
    lava1.castShadow = true;
    lava1.receiveShadow = true;
    scene.add(lava1);
    lavaChannels.push({ mesh: lava1, material: lavaMat, baseIntensity: 1.2 });
    objects.push(lava1);

    // Channel 2 - Crossing channel
    var lavaGeo2 = new THREE.BoxGeometry(200, 20, 80);
    var lava2 = new THREE.Mesh(lavaGeo2, lavaMat.clone());
    lava2.position.set(0, 15, -60);
    lava2.castShadow = true;
    lava2.receiveShadow = true;
    scene.add(lava2);
    lavaChannels.push({ mesh: lava2, material: lava2.material, baseIntensity: 1.2 });
    objects.push(lava2);
  }

  function buildControlRoom() {
    var platformGeo = new THREE.BoxGeometry(200, 15, 150);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 100, 80);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    objects.push(platform);
  }

  function buildDoomsdayConsole() {
    // Main console box
    var consoleGeo = new THREE.BoxGeometry(80, 50, 60);
    var consoleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    var consoleMesh = new THREE.Mesh(consoleGeo, consoleMat);
    consoleMesh.position.set(0, 130, 70);
    consoleMesh.castShadow = true;
    consoleMesh.receiveShadow = true;
    scene.add(consoleMesh);
    objects.push(consoleMesh);

    // Emissive screen panels
    for (var i = 0; i < 3; i++) {
      var screenGeo = new THREE.BoxGeometry(20, 30, 2);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8
      });
      var screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(-30 + i * 30, 140, 90);
      scene.add(screen);
      objects.push(screen);
    }
  }

  function buildRocketSilo() {
    // Silo opening - large cylinder cut into floor
    var siloGeo = new THREE.CylinderGeometry(40, 40, 30, 32);
    var siloMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
    var silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.set(100, 20, -100);
    silo.castShadow = true;
    silo.receiveShadow = true;
    scene.add(silo);
    objects.push(silo);

    // Rocket
    var rocketGeo = new THREE.CylinderGeometry(15, 15, 80, 16);
    var rocketMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.9 });
    rocket = new THREE.Mesh(rocketGeo, rocketMat);
    rocket.position.set(100, 60, -100);
    rocket.castShadow = true;
    scene.add(rocket);
    objects.push(rocket);

    // Rocket tip cone
    var noseCone = new THREE.ConeGeometry(15, 30, 16);
    var noseMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var nose = new THREE.Mesh(noseCone, noseMat);
    nose.position.set(100, 125, -100);
    nose.castShadow = true;
    scene.add(nose);
    objects.push(nose);
  }

  function buildCatwalkBridges() {
    // Two catwalks over lava channels using LineSegments
    var points1 = [];
    for (var x = -80; x <= 80; x += 20) {
      points1.push(new THREE.Vector3(x, 50, -50));
      points1.push(new THREE.Vector3(x, 50, -45));
    }
    var geometry1 = new THREE.BufferGeometry().setFromPoints(points1);
    var material1 = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var catwalk1 = new THREE.LineSegments(geometry1, material1);
    scene.add(catwalk1);
    objects.push(catwalk1);

    // Catwalk 2
    var points2 = [];
    for (var z = -80; z <= 80; z += 20) {
      points2.push(new THREE.Vector3(60, 50, z));
      points2.push(new THREE.Vector3(65, 50, z));
    }
    var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
    var catwalk2 = new THREE.LineSegments(geometry2, material1);
    scene.add(catwalk2);
    objects.push(catwalk2);
  }

  function buildCoolingTower() {
    // Tower cylinder
    var towerGeo = new THREE.CylinderGeometry(50, 60, 120, 16);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-120, 60, 100);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    objects.push(tower);

    // Steam emissive sphere
    var steamGeo = new THREE.SphereGeometry(45, 16, 16);
    var steamMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x888888,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.4
    });
    var steam = new THREE.Mesh(steamGeo, steamMat);
    steam.position.set(-120, 140, 100);
    scene.add(steam);
    objects.push(steam);
  }

  function buildComputerBanks() {
    // Rows of computer boxes with emissive blue screens
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var bankGeo = new THREE.BoxGeometry(40, 60, 40);
        var bankMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        var bank = new THREE.Mesh(bankGeo, bankMat);
        bank.position.set(-150 + i * 50, 100, -120 + j * 50);
        bank.castShadow = true;
        bank.receiveShadow = true;
        scene.add(bank);
        objects.push(bank);

        // Emissive screen
        var screenGeo = new THREE.BoxGeometry(35, 40, 2);
        var screenMat = new THREE.MeshStandardMaterial({
          color: 0x0088ff,
          emissive: 0x0088ff,
          emissiveIntensity: 0.7
        });
        var screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(-150 + i * 50, 105, -140 + j * 50);
        scene.add(screen);
        objects.push(screen);
      }
    }
  }

  function buildHenchmenGuards() {
    var positions = [
      { x: -80, z: 20 },
      { x: 80, z: 20 },
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: 0, z: 100 },
      { x: 0, z: -120 }
    ];

    positions.forEach(function(pos) {
      var bodyGeo = new THREE.BoxGeometry(20, 40, 15);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(pos.x, 40, pos.z);
      body.castShadow = true;
      scene.add(body);
      objects.push(body);

      // Head
      var headGeo = new THREE.SphereGeometry(10, 16, 16);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.set(pos.x, 75, pos.z);
      head.castShadow = true;
      scene.add(head);
      objects.push(head);

      guards.push({ body: body, head: head, x: pos.x, z: pos.z, time: Math.random() * 10 });
    });
  }

  function buildScientist() {
    // Body - white coat
    var coatGeo = new THREE.BoxGeometry(18, 50, 12);
    var coatMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.set(0, 110, 60);
    coat.castShadow = true;
    scene.add(coat);
    objects.push(coat);

    // Head
    var headGeo = new THREE.SphereGeometry(12, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    scientist = new THREE.Mesh(headGeo, headMat);
    scientist.position.set(0, 150, 60);
    scientist.castShadow = true;
    scene.add(scientist);
    objects.push(scientist);
  }

  function buildRadarDish() {
    // Pedestal
    var pedestalGeo = new THREE.CylinderGeometry(15, 20, 40, 16);
    var pedestalMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
    var pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(150, 40, -80);
    pedestal.castShadow = true;
    scene.add(pedestal);
    objects.push(pedestal);

    // Dish - flat box
    var dishGeo = new THREE.BoxGeometry(60, 5, 60);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, metalness: 0.8 });
    radarDish = new THREE.Mesh(dishGeo, dishMat);
    radarDish.position.set(150, 100, -80);
    radarDish.castShadow = true;
    scene.add(radarDish);
    objects.push(radarDish);
  }

  function buildCountdownClock() {
    // Clock face
    var clockGeo = new THREE.BoxGeometry(80, 80, 10);
    var clockMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    countdown = new THREE.Mesh(clockGeo, clockMat);
    countdown.position.set(-150, 150, 0);
    countdown.castShadow = true;
    scene.add(countdown);
    objects.push(countdown);

    // Numbers as line segments forming numbers around the clock
    var points = [];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      var x = -150 + Math.cos(angle) * 35;
      var z = Math.sin(angle) * 35;
      points.push(new THREE.Vector3(x, 150, z));
      points.push(new THREE.Vector3(x, 160, z));
    }
    var numbersGeo = new THREE.BufferGeometry().setFromPoints(points);
    var numbersMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    var numbers = new THREE.LineSegments(numbersGeo, numbersMat);
    scene.add(numbers);
    objects.push(numbers);
  }

  function buildWeaponRacks() {
    // Weapon rack rows
    for (var i = 0; i < 2; i++) {
      var rackGeo = new THREE.BoxGeometry(100, 80, 30);
      var rackMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
      var rack = new THREE.Mesh(rackGeo, rackMat);
      rack.position.set(120, 80, -40 + i * 60);
      rack.castShadow = true;
      rack.receiveShadow = true;
      scene.add(rack);
      objects.push(rack);

      // Weapons on rack
      for (var j = 0; j < 4; j++) {
        var weaponGeo = new THREE.BoxGeometry(15, 60, 8);
        var weaponMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
        var weapon = new THREE.Mesh(weaponGeo, weaponMat);
        weapon.position.set(100 + j * 20, 110, -40 + i * 60);
        weapon.rotation.z = 0.3;
        weapon.castShadow = true;
        scene.add(weapon);
        objects.push(weapon);
      }
    }
  }

  function buildEscapeSubmarine() {
    // Dock - underwater platform
    var dockGeo = new THREE.BoxGeometry(180, 20, 100);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
    var dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(0, -30, -200);
    dock.castShadow = true;
    scene.add(dock);
    objects.push(dock);

    // Submarine hull
    var hullGeo = new THREE.CylinderGeometry(35, 35, 100, 16);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, metalness: 0.7 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.rotation.z = Math.PI / 2;
    hull.position.set(0, -20, -200);
    hull.castShadow = true;
    scene.add(hull);
    objects.push(hull);

    // Conning tower
    var towerGeo = new THREE.BoxGeometry(30, 40, 30);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(-20, 10, -200);
    tower.castShadow = true;
    scene.add(tower);
    objects.push(tower);
  }

  function buildLavaBubbles() {
    for (var i = 0; i < 8; i++) {
      var bubbleGeo = new THREE.SphereGeometry(8, 8, 8);
      var bubbleMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff4400,
        emissiveIntensity: 1.0
      });
      var bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(-100 + Math.random() * 200, 30, -100 + Math.random() * 200);
      scene.add(bubble);
      lavaBubbles.push({ mesh: bubble, y0: bubble.position.y, speed: 0.5 + Math.random() * 0.5 });
      objects.push(bubble);
    }
  }

  function buildSelfDestructPanel() {
    // Panel box
    var panelGeo = new THREE.BoxGeometry(60, 80, 20);
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    var panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(-140, 120, -160);
    panel.castShadow = true;
    scene.add(panel);
    objects.push(panel);

    // Red button
    var buttonGeo = new THREE.SphereGeometry(12, 16, 16);
    var buttonMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    var button = new THREE.Mesh(buttonGeo, buttonMat);
    button.position.set(-140, 140, -150);
    button.castShadow = true;
    scene.add(button);
    objects.push(button);
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.zIndex = '10';
    hudCanvas.style.fontFamily = 'monospace';
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');

    updateHUD();
  }

  function updateHUD() {
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    hudCtx.fillStyle = '#00ff00';
    hudCtx.font = 'bold 20px monospace';

    var line1 = gameState.selfDestructArmed ? 'SELF-DESTRUCT: ARMED' : 'SELF-DESTRUCT: DISARMED';
    var line2 = 'HENCHMEN DOWN: ' + gameState.henchmenDown + '/6';
    var line3 = gameState.launchCodeObtained ? 'LAUNCH CODE: OBTAINED' : 'LAUNCH CODE: NOT OBTAINED';

    hudCtx.fillText(line1, 20, 40);
    hudCtx.fillText(line2, 20, 70);
    hudCtx.fillText(line3, 20, 100);

    if (!gameState.hudVisible) {
      hudCtx.fillStyle = '#888888';
      hudCtx.font = 'bold 14px monospace';
      hudCtx.fillText('Press V then L to toggle HUD', 20, 130);
    }
  }

  function setupKeyboardInput() {
    document.addEventListener('keydown', function(e) {
      var key = e.key.toLowerCase();

      if (key === 'v') {
        keyPressTimings.v = Date.now();
      } else if (key === 'l') {
        if (keyPressTimings.v && Date.now() - keyPressTimings.v < 400) {
          gameState.hudVisible = !gameState.hudVisible;
          if (!gameState.hudVisible) {
            hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
          } else {
            updateHUD();
          }
        }
        keyPressTimings.l = null;
      }
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    // Lava channel pulsing
    var time = Date.now() * 0.001;
    lavaChannels.forEach(function(channel) {
      var pulse = 0.8 + Math.sin(time * 2) * 0.4;
      channel.material.emissiveIntensity = channel.baseIntensity * pulse;
    });

    // Lava bubbles rising and popping
    lavaBubbles.forEach(function(bubble) {
      bubble.mesh.position.y += bubble.speed;
      if (bubble.mesh.position.y > 100) {
        bubble.mesh.position.y = bubble.y0;
      }
    });

    // Rocket slowly rising
    if (rocket) {
      rocket.position.y = 60 + Math.sin(time * 0.5) * 15;
    }

    // Radar dish rotating
    if (radarDish) {
      radarDish.rotation.z += 0.01;
    }

    // Countdown clock pulsing
    if (countdown) {
      var scale = 1 + Math.sin(time * 3) * 0.05;
      countdown.scale.set(scale, scale, 1);
    }

    // Guards patrolling
    guards.forEach(function(guard) {
      guard.time += 0.016;
      var offset = Math.sin(guard.time) * 30;
      guard.body.position.x = guard.x + offset;
      guard.head.position.x = guard.x + offset;
    });

    if (renderer) renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    updateHUD();
  }

  function reset() {
    // Dispose all geometries and materials
    objects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    if (renderer && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    scene.clear();
    objects = [];
    lavaChannels = [];
    lavaBubbles = [];
    guards = [];
    renderer.dispose();
  }

  return {
    init: init,
    update: animate,
    reset: reset
  };
}());
