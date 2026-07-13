window.BankRobbery = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var objects = [];
  var robbers = [];
  var hostages = [];
  var policeTactical = [];
  var vaultDoor, chandelier, teargasSmoke, timebomb, cctvCameras = [];
  var animationId;
  var hudCanvas, hudContext;
  var hostagesSecured = 0;
  var robbersDown = 0;
  var vaultBreached = false;
  var keyState = {};
  var lastBKeyTime = 0;
  var hudVisible = false;

  function init(containerElement) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    var width = window.innerWidth;
    var height = window.innerHeight;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerElement.appendChild(renderer.domElement);
    canvas = renderer.domElement;

    setupLighting();
    createMarbleFloor();
    createBankCounter();
    createVaultDoor();
    createRobbers();
    createHostages();
    createPoliceTactical();
    createMoneyBags();
    createSecurityDesk();
    createATMRow();
    createChandelier();
    createMarblePillars();
    createBrokenWindow();
    createTeargasCanister();
    createPoliceBarricade();
    createTimebomb();
    createDyePackBurst();
    createCCTVCameras();

    setupHUD();
    setupKeyboardInput();
    setupWindowResize();

    animate();
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xff4444, 0.6, 30);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);
  }

  function createMarbleFloor() {
    var geometry = new THREE.BoxGeometry(50, 0.5, 50);
    var material = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      metalness: 0.1,
      roughness: 0.2
    });
    var floor = new THREE.Mesh(geometry, material);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function createBankCounter() {
    var counterGeometry = new THREE.BoxGeometry(20, 1.2, 2);
    var counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(-5, 0.6, -8);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);
    objects.push(counter);

    var glassPositions = [];
    for (var i = 0; i < 5; i++) {
      glassPositions.push(-10 + i * 5, 0.6, -7.8);
      glassPositions.push(-10 + i * 5, 2.2, -7.8);
    }
    var glassGeometry = new THREE.BufferGeometry();
    glassGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(glassPositions), 3));
    var glassMaterial = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });
    var glassPartitions = new THREE.LineSegments(glassGeometry, glassMaterial);
    scene.add(glassPartitions);
    objects.push(glassPartitions);
  }

  function createVaultDoor() {
    var geometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    var material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x666666
    });
    vaultDoor = new THREE.Mesh(geometry, material);
    vaultDoor.position.set(0, 2, 8);
    vaultDoor.castShadow = true;
    vaultDoor.receiveShadow = true;
    scene.add(vaultDoor);
    objects.push(vaultDoor);
  }

  function createRobbers() {
    var robberCount = 5;
    for (var i = 0; i < robberCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      var headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.9;

      var weaponGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.1);
      var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.3, 0.3, 0);

      var group = new THREE.Group();
      group.add(body);
      group.add(head);
      group.add(weapon);

      var xPos = -6 + i * 3;
      var zPos = -5 + Math.sin(i) * 3;
      group.position.set(xPos, 0, zPos);
      group.castShadow = true;

      scene.add(group);
      robbers.push(group);
      objects.push(group);
    }
  }

  function createHostages() {
    var hostageCount = 6;
    for (var i = 0; i < hostageCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.0, 0.35);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.75;

      var group = new THREE.Group();
      group.add(body);
      group.add(head);
      group.position.y = -0.2;

      var xPos = 2 + i * 2;
      var zPos = -2 + Math.cos(i * 0.7) * 2;
      group.position.set(xPos, group.position.y, zPos);
      group.castShadow = true;

      scene.add(group);
      hostages.push(group);
      objects.push(group);
    }
  }

  function createPoliceTactical() {
    var policeCount = 3;
    for (var i = 0; i < policeCount; i++) {
      var bodyGeometry = new THREE.BoxGeometry(0.65, 1.3, 0.45);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x001a4d });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);

      var headGeometry = new THREE.SphereGeometry(0.32, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.0;

      var helmetGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      var helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.y = 1.05;

      var group = new THREE.Group();
      group.add(body);
      group.add(head);
      group.add(helmet);

      var xPos = -15 + i * 3;
      group.position.set(xPos, 0, -18);
      group.castShadow = true;

      scene.add(group);
      policeTactical.push(group);
      objects.push(group);
    }
  }

  function createMoneyBags() {
    var bagCount = 8;
    for (var i = 0; i < bagCount; i++) {
      var geometry = new THREE.BoxGeometry(0.8, 0.6, 0.4);
      var material = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        metalness: 0.1,
        roughness: 0.8
      });
      var bag = new THREE.Mesh(geometry, material);

      var col = i % 4;
      var row = Math.floor(i / 4);
      bag.position.set(-2 + col * 1.2, 0.4 + row * 0.8, 5);
      bag.castShadow = true;

      scene.add(bag);
      objects.push(bag);
    }
  }

  function createSecurityDesk() {
    var deskGeometry = new THREE.BoxGeometry(3, 1.0, 1.5);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(-12, 0.5, 2);
    desk.castShadow = true;
    scene.add(desk);
    objects.push(desk);

    var monitorGeometry = new THREE.BoxGeometry(1.2, 0.7, 0.1);
    var monitorMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x00ff00
    });
    var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(-12, 1.3, 0.5);
    monitor.castShadow = true;
    scene.add(monitor);
    objects.push(monitor);
  }

  function createATMRow() {
    for (var i = 0; i < 4; i++) {
      var atmGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var atmMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var atm = new THREE.Mesh(atmGeometry, atmMaterial);

      var screenGeometry = new THREE.BoxGeometry(0.6, 1.0, 0.05);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x001a00,
        emissive: 0x00cc00
      });
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.z = 0.3;
      atm.add(screen);

      atm.position.set(6 + i * 2, 0.9, -5);
      atm.castShadow = true;
      scene.add(atm);
      objects.push(atm);
    }
  }

  function createChandelier() {
    var centerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 16);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      metalness: 0.8,
      roughness: 0.2
    });
    var center = new THREE.Mesh(centerGeometry, metalMaterial);
    center.position.y = 10;

    var lightGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xffff00
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 9.2;
    center.add(light);

    var chandelier_light = new THREE.PointLight(0xffffcc, 1.2, 40);
    chandelier_light.position.y = 9.5;
    center.add(chandelier_light);

    chandelier = center;
    scene.add(chandelier);
    objects.push(chandelier);
  }

  function createMarblePillars() {
    var pillarCount = 6;
    var pillarPositions = [
      [-8, 0, -12],
      [8, 0, -12],
      [-8, 0, 6],
      [8, 0, 6],
      [-15, 0, 0],
      [15, 0, 0]
    ];

    for (var i = 0; i < pillarCount; i++) {
      var geometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
      var material = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        metalness: 0.05,
        roughness: 0.3
      });
      var pillar = new THREE.Mesh(geometry, material);
      pillar.position.set(
        pillarPositions[i][0],
        pillarPositions[i][1] + 4,
        pillarPositions[i][2]
      );
      pillar.castShadow = true;
      scene.add(pillar);
      objects.push(pillar);
    }
  }

  function createBrokenWindow() {
    var framePositions = [];
    var frameSize = 8;
    var frameX = -20;
    for (var i = 0; i < 5; i++) {
      framePositions.push(frameX, 4 - i * 2, -15);
      framePositions.push(frameX + frameSize, 4 - i * 2, -15);
    }
    for (var j = 0; j < 6; j++) {
      framePositions.push(frameX + j * frameSize / 5, 4, -15);
      framePositions.push(frameX + j * frameSize / 5, -6, -15);
    }

    var frameGeometry = new THREE.BufferGeometry();
    frameGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(framePositions), 3));
    var frameMaterial = new THREE.LineBasicMaterial({ color: 0xff6666, linewidth: 2 });
    var frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    scene.add(frame);
    objects.push(frame);
  }

  function createTeargasCanister() {
    var canisterGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16);
    var canisterMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var canister = new THREE.Mesh(canisterGeometry, canisterMaterial);
    canister.position.set(-10, 1.2, -3);
    canister.castShadow = true;
    scene.add(canister);
    objects.push(canister);

    var smokeGeometry = new THREE.SphereGeometry(2, 16, 16);
    var smokeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x999999,
      transparent: true,
      opacity: 0.3
    });
    teargasSmoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    teargasSmoke.position.set(-10, 2, -3);
    scene.add(teargasSmoke);
    objects.push(teargasSmoke);
  }

  function createPoliceBarricade() {
    var vehicleGeometry = new THREE.BoxGeometry(3, 1.5, 2);
    var vehicleMaterial = new THREE.MeshStandardMaterial({ color: 0x0055aa });
    var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
    vehicle.position.set(-25, 0.75, -15);
    vehicle.castShadow = true;
    scene.add(vehicle);
    objects.push(vehicle);

    var barricadePositions = [];
    for (var i = 0; i < 4; i++) {
      barricadePositions.push(-22 + i * 3, 0, -18);
      barricadePositions.push(-22 + i * 3, 1.2, -18);
    }
    var barricadeGeometry = new THREE.BufferGeometry();
    barricadeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barricadePositions), 3));
    var barricadeMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    var barricadeTape = new THREE.LineSegments(barricadeGeometry, barricadeMaterial);
    scene.add(barricadeTape);
    objects.push(barricadeTape);
  }

  function createTimebomb() {
    var bombGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var bombMaterial = new THREE.MeshStandardMaterial({
      color: 0x220000,
      emissive: 0xff0000
    });
    timebomb = new THREE.Mesh(bombGeometry, bombMaterial);
    timebomb.position.set(0, 3, 8);
    timebomb.castShadow = true;
    scene.add(timebomb);
    objects.push(timebomb);
  }

  function createDyePackBurst() {
    var dyeGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    var dyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xcc0000
    });
    var dyePack = new THREE.Mesh(dyeGeometry, dyeMaterial);
    dyePack.position.set(2, 2, 8);
    scene.add(dyePack);
    objects.push(dyePack);
  }

  function createCCTVCameras() {
    var positions = [
      [-15, 8, -10],
      [15, 8, -10],
      [-15, 8, 8],
      [15, 8, 8]
    ];

    for (var i = 0; i < positions.length; i++) {
      var mountGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
      var mountMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(positions[i][0], positions[i][1] - 1.2, positions[i][2]);

      var cameraGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.4);
      var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var camera_body = new THREE.Mesh(cameraGeometry, cameraMaterial);

      var lensGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      var lensMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        emissive: 0x444444
      });
      var lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.position.z = 0.25;
      camera_body.add(lens);

      var group = new THREE.Group();
      group.add(mount);
      group.add(camera_body);
      group.position.y = positions[i][1];
      group.position.x = positions[i][0];
      group.position.z = positions[i][2];

      scene.add(group);
      cctvCameras.push(group);
      objects.push(group);
    }
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);
    hudContext = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!hudVisible) {
      hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
      return;
    }

    hudContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudContext.fillStyle = '#ffffff';
    hudContext.font = 'bold 24px Arial';
    hudContext.fillText('BANK HEIST IN PROGRESS', 20, 60);

    hudContext.font = '18px Arial';
    hudContext.fillStyle = '#ffaa00';
    hudContext.fillText('HOSTAGES SECURED: ' + hostagesSecured + '/6', 20, 120);
    hudContext.fillText('ROBBERS DOWN: ' + robbersDown + '/5', 20, 160);
    var vaultStatus = vaultBreached ? 'YES' : 'NO';
    hudContext.fillText('VAULT BREACHED: ' + vaultStatus, 20, 200);
  }

  function setupKeyboardInput() {
    document.addEventListener('keydown', function(event) {
      var key = event.key.toUpperCase();
      keyState[key] = true;

      if (key === 'B') {
        var currentTime = Date.now();
        if (currentTime - lastBKeyTime < 400) {
          hudVisible = !hudVisible;
          lastBKeyTime = 0;
        } else {
          lastBKeyTime = currentTime;
        }
      }
    });

    document.addEventListener('keyup', function(event) {
      var key = event.key.toUpperCase();
      keyState[key] = false;
    });
  }

  function setupWindowResize() {
    window.addEventListener('resize', function() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      hudCanvas.width = width;
      hudCanvas.height = height;
    });
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
  }

  function update() {
    if (vaultDoor) {
      vaultDoor.rotation.z += 0.002;
    }

    if (chandelier) {
      chandelier.rotation.z = Math.sin(Date.now() * 0.0005) * 0.3;
    }

    robbers.forEach(function(robber, index) {
      robber.position.x += Math.sin(Date.now() * 0.001 + index) * 0.005;
      robber.rotation.y += 0.01;
    });

    if (teargasSmoke) {
      teargasSmoke.scale.x = 1 + Math.sin(Date.now() * 0.002) * 0.3;
      teargasSmoke.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.3;
      teargasSmoke.scale.z = 1 + Math.sin(Date.now() * 0.002) * 0.3;
    }

    if (timebomb) {
      timebomb.rotation.x += 0.02;
      timebomb.material.emissive.setHex(Math.sin(Date.now() * 0.005) > 0 ? 0xff0000 : 0x990000);
    }

    cctvCameras.forEach(function(camera_group, index) {
      var child = camera_group.children[1];
      if (child) {
        child.rotation.y = Math.sin(Date.now() * 0.001 + index * 0.5) * 0.5;
      }
    });

    updateHUD();
  }

  function reset() {
    if (hudCanvas && hudCanvas.parentElement) {
      hudCanvas.parentElement.removeChild(hudCanvas);
    }

    objects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    if (renderer) {
      renderer.dispose();
    }

    scene = null;
    camera = null;
    renderer = null;
    objects = [];
    robbers = [];
    hostages = [];
    policeTactical = [];
    cctvCameras = [];
    vaultDoor = null;
    chandelier = null;
    teargasSmoke = null;
    timebomb = null;

    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
