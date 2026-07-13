window.UndergroundArena = (function() {
  'use strict';

  var scene, camera, renderer;
  var fighters = [];
  var crowdMembers = [];
  var lights = [];
  var undergroundArenaObjects = [];
  var hudCanvas, hudCtx;
  var roundNumber = 3;
  var maxRounds = 5;
  var criminalsArrested = 0;
  var evidenceSecured = false;
  var keysPressed = [];
  var hudVisible = true;
  var lastKeyTime = 0;

  function init(container) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // HUD Canvas
    createHUD();

    // Build scene objects
    createBasementFloor();
    createOctagonCage();
    createFighter1();
    createFighter2();
    createCornerStool();
    createReferee();
    createCrowdSpectators();
    createBettingTable();
    createCrimeBossVIP();
    createVIPBodyguards();
    createIndustrialLighting();
    createCoolers();
    createSecurityDoor();
    createCCTVMonitors();
    createHiddenCop();
    createConcretePillars();
    createBloodStains();

    // Ambient light
    var ambientLight = new THREE.AmbientLight(0x444444, 0.6);
    scene.add(ambientLight);

    // Key event listeners
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();
  }

  function createHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
  }

  function drawHUD() {
    if (!hudVisible) return;

    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    hudCtx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    hudCtx.font = 'bold 24px Arial';
    hudCtx.textAlign = 'left';

    var y = 30;
    hudCtx.fillText('ROUND: ' + roundNumber + ' OF ' + maxRounds, 20, y);
    y += 40;
    hudCtx.fillText('CRIMINALS ARRESTED: ' + criminalsArrested + '/3', 20, y);
    y += 40;
    hudCtx.fillText('EVIDENCE SECURED: ' + (evidenceSecured ? 'YES' : 'NO'), 20, y);
  }

  function onKeyDown(event) {
    var now = Date.now();
    if (now - lastKeyTime > 400) {
      keysPressed = [];
    }
    lastKeyTime = now;

    if (event.key.toUpperCase() === 'U') {
      keysPressed.push('U');
    } else if (event.key.toUpperCase() === 'A' && keysPressed[keysPressed.length - 1] === 'U') {
      keysPressed.push('A');
      if (keysPressed[keysPressed.length - 2] === 'U') {
        hudVisible = !hudVisible;
        keysPressed = [];
      }
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
  }

  function createBasementFloor() {
    var floorGeometry = new THREE.BoxGeometry(50, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.1 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    undergroundArenaObjects.push(floor);
  }

  function createOctagonCage() {
    var cageRadius = 8;
    var cageHeight = 4;
    var panelHeight = 2;

    // 8 panels forming octagon
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var nextAngle = ((i + 1) / 8) * Math.PI * 2;

      var x1 = Math.cos(angle) * cageRadius;
      var z1 = Math.sin(angle) * cageRadius;
      var x2 = Math.cos(nextAngle) * cageRadius;
      var z2 = Math.sin(nextAngle) * cageRadius;

      // Create chain-link fence panels using LineSegments
      var points = [];
      points.push(new THREE.Vector3(x1, 0, z1));
      points.push(new THREE.Vector3(x2, 0, z2));
      points.push(new THREE.Vector3(x2, panelHeight, z2));
      points.push(new THREE.Vector3(x1, panelHeight, z1));
      points.push(new THREE.Vector3(x1, 0, z1));

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      undergroundArenaObjects.push(line);

      // Add cross pattern for chain-link effect
      var diagonalPoints = [
        new THREE.Vector3(x1, 0, z1),
        new THREE.Vector3(x2, panelHeight, z2),
        new THREE.Vector3(x2, 0, z2),
        new THREE.Vector3(x1, panelHeight, z1)
      ];
      var diagGeometry = new THREE.BufferGeometry().setFromPoints(diagonalPoints);
      var diagLine = new THREE.LineSegments(diagGeometry, material);
      scene.add(diagLine);
      undergroundArenaObjects.push(diagLine);
    }
  }

  function createFighter1() {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xffcccc, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);

    // Red shorts (box)
    var shortsGeom = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    var shortsMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
    var shorts = new THREE.Mesh(shortsGeom, shortsMat);
    shorts.position.y = 0.15;
    shorts.castShadow = true;
    group.add(shorts);

    group.position.set(-3, 0, 0);
    group.userData.velocityX = 0.05;
    group.userData.velocityZ = 0.02;
    group.userData.time = 0;
    scene.add(group);
    fighters.push(group);
    undergroundArenaObjects.push(group);
  }

  function createFighter2() {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xccccff, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.5;
    head.castShadow = true;
    group.add(head);

    // Blue shorts (box)
    var shortsGeom = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    var shortsMat = new THREE.MeshStandardMaterial({ color: 0x0000cc, roughness: 0.5 });
    var shorts = new THREE.Mesh(shortsGeom, shortsMat);
    shorts.position.y = 0.15;
    shorts.castShadow = true;
    group.add(shorts);

    group.position.set(3, 0, 0);
    group.userData.velocityX = -0.05;
    group.userData.velocityZ = -0.02;
    group.userData.time = 0;
    scene.add(group);
    fighters.push(group);
    undergroundArenaObjects.push(group);
  }

  function createCornerStool() {
    var group = new THREE.Group();

    // Seat (box)
    var seatGeom = new THREE.BoxGeometry(0.4, 0.1, 0.4);
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
    var seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.y = 0.3;
    seat.castShadow = true;
    group.add(seat);

    // Legs (4 boxes)
    for (var i = 0; i < 4; i++) {
      var legGeom = new THREE.BoxGeometry(0.05, 0.3, 0.05);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.6 });
      var leg = new THREE.Mesh(legGeom, legMat);
      var offsetX = (i % 2) * 0.15 - 0.075;
      var offsetZ = Math.floor(i / 2) * 0.15 - 0.075;
      leg.position.set(offsetX, 0.15, offsetZ);
      leg.castShadow = true;
      group.add(leg);
    }

    group.position.set(-7, 0, -7);
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createReferee() {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(0.4, 1, 0.25);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(0.15, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.2;
    head.castShadow = true;
    group.add(head);

    group.position.set(0, 0, -5);
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createCrowdSpectators() {
    var crowdRadius = 12;
    var crowdCount = 24;

    for (var i = 0; i < crowdCount; i++) {
      var angle = (i / crowdCount) * Math.PI * 2;
      var x = Math.cos(angle) * crowdRadius;
      var z = Math.sin(angle) * crowdRadius;

      var crowdGroup = new THREE.Group();

      // Body
      var bodyGeom = new THREE.BoxGeometry(0.3, 0.7, 0.2);
      var colors = [0xff6666, 0x66ff66, 0x6666ff, 0xffff66];
      var bodyMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.6 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.35;
      body.castShadow = true;
      crowdGroup.add(body);

      // Head
      var headGeom = new THREE.SphereGeometry(0.12, 12, 12);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 0.9;
      head.castShadow = true;
      crowdGroup.add(head);

      crowdGroup.position.set(x, 0, z);
      crowdGroup.userData.time = Math.random() * Math.PI * 2;
      crowdGroup.userData.amplitude = 0.3;
      scene.add(crowdGroup);
      crowdMembers.push(crowdGroup);
      undergroundArenaObjects.push(crowdGroup);
    }
  }

  function createBettingTable() {
    var group = new THREE.Group();

    // Table top (box)
    var tableGeom = new THREE.BoxGeometry(3, 0.1, 2);
    var tableMat = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.7 });
    var table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = 0.5;
    table.castShadow = true;
    group.add(table);

    // Table legs (4 boxes)
    for (var i = 0; i < 4; i++) {
      var legGeom = new THREE.BoxGeometry(0.1, 0.5, 0.1);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x1a3d0a, roughness: 0.6 });
      var leg = new THREE.Mesh(legGeom, legMat);
      var offsetX = (i % 2) * 1.4 - 0.7;
      var offsetZ = Math.floor(i / 2) * 0.9 - 0.45;
      leg.position.set(offsetX, 0.25, offsetZ);
      leg.castShadow = true;
      group.add(leg);
    }

    // Cash stacks (5 boxes)
    for (var j = 0; j < 5; j++) {
      var stackGeom = new THREE.BoxGeometry(0.3, 0.2, 0.2);
      var stackMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, metalness: 0.3 });
      var stack = new THREE.Mesh(stackGeom, stackMat);
      stack.position.set(-0.6 + j * 0.3, 0.6, 0);
      stack.castShadow = true;
      stack.userData.baseY = 0.6;
      group.add(stack);
    }

    group.position.set(-10, 0, 5);
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createCrimeBossVIP() {
    var group = new THREE.Group();

    // Platform (box)
    var platformGeom = new THREE.BoxGeometry(2, 0.3, 2);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = 0.8;
    platform.castShadow = true;
    group.add(platform);

    // Throne seat (box)
    var throneGeom = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    var throneMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.6 });
    var throne = new THREE.Mesh(throneGeom, throneMat);
    throne.position.y = 1.3;
    throne.castShadow = true;
    group.add(throne);

    // Boss body (box)
    var bossBodyGeom = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    var bossBodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    var bossBody = new THREE.Mesh(bossBodyGeom, bossBodyMat);
    bossBody.position.y = 1.8;
    bossBody.castShadow = true;
    group.add(bossBody);

    // Boss head (sphere)
    var bossHeadGeom = new THREE.SphereGeometry(0.2, 16, 16);
    var bossHeadMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
    var bossHead = new THREE.Mesh(bossHeadGeom, bossHeadMat);
    bossHead.position.y = 2.6;
    bossHead.castShadow = true;
    bossHead.userData.baseY = 2.6;
    group.add(bossHead);

    group.position.set(0, 0, -12);
    group.userData.time = 0;
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createVIPBodyguards() {
    for (var i = 0; i < 2; i++) {
      var group = new THREE.Group();

      // Body (larger box)
      var bodyGeom = new THREE.BoxGeometry(0.6, 1.5, 0.4);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.75;
      body.castShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeom = new THREE.SphereGeometry(0.2, 16, 16);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 1.8;
      head.castShadow = true;
      group.add(head);

      group.position.set((i * 2 - 0.5) * 2, 0, -10);
      scene.add(group);
      undergroundArenaObjects.push(group);
    }
  }

  function createIndustrialLighting() {
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var x = Math.cos(angle) * 10;
      var z = Math.sin(angle) * 10;

      var group = new THREE.Group();

      // Pole (cylinder)
      var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
      var poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = 1.5;
      pole.castShadow = true;
      group.add(pole);

      // Light sphere (emissive)
      var lightGeom = new THREE.SphereGeometry(0.3, 16, 16);
      var lightMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 0.8 });
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.y = 3.2;
      light.userData.baseColor = 0xffaa00;
      light.userData.time = Math.random() * Math.PI * 2;
      group.add(light);

      // Three.js point light for illumination
      var pointLight = new THREE.PointLight(0xffaa00, 1.5, 30);
      pointLight.position.set(x, 3.2, z);
      pointLight.castShadow = true;
      scene.add(pointLight);
      lights.push(pointLight);

      group.position.set(x, 0, z);
      scene.add(group);
      undergroundArenaObjects.push(group);
    }
  }

  function createCoolers() {
    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      // Cooler box
      var coolerGeom = new THREE.BoxGeometry(0.8, 0.6, 0.6);
      var coolerMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });
      var cooler = new THREE.Mesh(coolerGeom, coolerMat);
      cooler.position.y = 0.3;
      cooler.castShadow = true;
      group.add(cooler);

      // Cans (cylinders)
      for (var j = 0; j < 3; j++) {
        var canGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
        var canMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8 });
        var can = new THREE.Mesh(canGeom, canMat);
        can.position.set(-0.2 + j * 0.2, 0.6, 0);
        can.castShadow = true;
        group.add(can);
      }

      group.position.set(-15 + i * 4, 0, 0);
      scene.add(group);
      undergroundArenaObjects.push(group);
    }
  }

  function createSecurityDoor() {
    var group = new THREE.Group();

    // Door frame (box)
    var frameGeom = new THREE.BoxGeometry(1, 2, 0.1);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // Door bars (LineSegments)
    var barPoints = [];
    for (var row = 0; row < 5; row++) {
      var y = -1 + (row / 4) * 2;
      barPoints.push(new THREE.Vector3(-0.4, y, 0.05));
      barPoints.push(new THREE.Vector3(0.4, y, 0.05));
    }
    for (var col = 0; col < 5; col++) {
      var x = -0.4 + (col / 4) * 0.8;
      barPoints.push(new THREE.Vector3(x, -1, 0.05));
      barPoints.push(new THREE.Vector3(x, 1, 0.05));
    }
    var barGeom = new THREE.BufferGeometry().setFromPoints(barPoints);
    var barMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
    var bars = new THREE.LineSegments(barGeom, barMat);
    group.add(bars);

    group.position.set(18, 0, 0);
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createCCTVMonitors() {
    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      // Screen (box)
      var screenGeom = new THREE.BoxGeometry(0.8, 0.6, 0.1);
      var screenMat = new THREE.MeshStandardMaterial({ color: 0x001a00, emissive: 0x003300, emissiveIntensity: 0.5 });
      var screen = new THREE.Mesh(screenGeom, screenMat);
      screen.castShadow = true;
      group.add(screen);

      // Screen glow
      var glowGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var glowMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.3 });
      var glow = new THREE.Mesh(glowGeom, glowMat);
      glow.scale.set(2, 1.5, 0.5);
      glow.position.z = 0.1;
      group.add(glow);

      group.position.set(10 + i * 1.5, 2, -18);
      scene.add(group);
      undergroundArenaObjects.push(group);
    }
  }

  function createHiddenCop() {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(0.45, 1, 0.3);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x333366, roughness: 0.5 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(0.15, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.2;
    head.castShadow = true;
    group.add(head);

    group.position.set(14, 0, 10);
    group.userData.targetX = 20;
    group.userData.speed = 0.02;
    scene.add(group);
    undergroundArenaObjects.push(group);
  }

  function createConcretePillars() {
    for (var i = 0; i < 4; i++) {
      var x = (i % 2) * 14 - 7;
      var z = Math.floor(i / 2) * 14 - 7;

      var pillarGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 16);
      var pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
      var pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(x, 2, z);
      pillar.castShadow = true;
      scene.add(pillar);
      undergroundArenaObjects.push(pillar);
    }
  }

  function createBloodStains() {
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var radius = 3;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var stainGeom = new THREE.BoxGeometry(0.5, 0.01, 0.5);
      var stainMat = new THREE.MeshStandardMaterial({ color: 0x330000, roughness: 0.9 });
      var stain = new THREE.Mesh(stainGeom, stainMat);
      stain.position.set(x, 0.01, z);
      scene.add(stain);
      undergroundArenaObjects.push(stain);
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    var time = Date.now() * 0.001;

    // Animate fighters
    for (var i = 0; i < fighters.length; i++) {
      var fighter = fighters[i];
      fighter.userData.time += 0.02;
      fighter.position.x += Math.sin(fighter.userData.time) * 0.02;
      fighter.position.z += Math.cos(fighter.userData.time * 0.7) * 0.01;
      fighter.rotation.y = Math.atan2(fighter.position.z, fighter.position.x);
    }

    // Animate crowd (sway and bob)
    for (var j = 0; j < crowdMembers.length; j++) {
      var member = crowdMembers[j];
      member.userData.time += 0.03;
      member.position.y = Math.sin(member.userData.time) * 0.15;
      member.rotation.z = Math.sin(member.userData.time * 0.5) * 0.1;
    }

    // Animate overhead lights (flicker)
    for (var k = 0; k < lights.length; k++) {
      var light = lights[k];
      var flicker = 0.8 + Math.sin(time * 3 + k) * 0.2;
      light.intensity = 1.5 * flicker;
    }

    // Animate light mesh flicker
    scene.traverse(function(obj) {
      if (obj.userData.baseColor) {
        var flicker = 0.8 + Math.sin(time * 3) * 0.2;
        obj.material.emissiveIntensity = 0.8 * flicker;
      }
    });

    // Animate crime boss (raise fist on periodic hit)
    scene.traverse(function(obj) {
      if (obj.userData.baseY !== undefined && obj.parent) {
        var hitTime = Math.sin(time * 2) * 0.3;
        if (hitTime > 0.2) {
          obj.position.y = obj.userData.baseY + 0.2;
        } else {
          obj.position.y = obj.userData.baseY;
        }
      }
    });

    // Animate betting money (oscillate)
    scene.traverse(function(obj) {
      if (obj.material && obj.material.color && obj.material.color.getHex && obj.material.color.getHex() === 0x00aa00) {
        if (obj.userData.baseY !== undefined) {
          obj.position.y = obj.userData.baseY + Math.sin(time * 2) * 0.1;
        }
      }
    });

    // Animate hidden cop (creep toward exit)
    scene.traverse(function(obj) {
      if (obj.userData.targetX !== undefined) {
        if (obj.position.x < obj.userData.targetX) {
          obj.position.x += obj.userData.speed;
        }
      }
    });

    drawHUD();
    renderer.render(scene, camera);
  }

  function update(deltaTime) {
    // Update function for external game loop integration
    animate();
  }

  function reset() {
    // Dispose all geometries and materials
    scene.traverse(function(obj) {
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

    // Clear arrays
    fighters = [];
    crowdMembers = [];
    lights = [];
    undergroundArenaObjects = [];

    // Remove HUD
    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    // Remove event listeners
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onWindowResize);

    // Dispose renderer
    if (renderer && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer.dispose();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
