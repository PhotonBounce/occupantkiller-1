window.SewerEscape = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var objects = [];
  var animations = [];
  var hudCanvas, hudCtx;
  var gameState = {
    distanceToExit: 87,
    policeDistance: 15,
    obstaclesCleared: 0,
    maxObstacles: 4,
    time: 0,
    hudVisible: true,
    lastKeyTime: 0,
    sKeyPressed: false
  };

  function init(containerElement) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 200, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 2, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    containerElement.appendChild(renderer.domElement);

    // Lights
    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    var mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(0, 30, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    scene.add(mainLight);

    var pointLight = new THREE.PointLight(0x88ff88, 0.3, 100);
    pointLight.position.set(0, 15, 50);
    scene.add(pointLight);

    // Build scene objects
    buildSewerTunnel();
    buildSewageChannel();
    buildWalkwayGrating();
    buildSupportArches();
    buildMaintenanceLadder();
    buildJunctionChamber();
    buildPipeManifold();
    buildEscapeFugitive();
    buildPoliceOfficer();
    buildPoliceDog();
    buildWaterPumpStation();
    buildCollapsedSection();
    buildEmergencyExitManhole();
    buildFloodGate();
    buildRatSwarm();

    // HUD Canvas
    setupHUD();

    // Input handling
    setupInput();

    // Render loop
    animate();
  }

  function buildSewerTunnel() {
    // Floor
    var floorGeo = new THREE.BoxGeometry(12, 0.5, 200);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.3, roughness: 0.8 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    floor.position.y = 0;
    floor.position.z = 0;
    scene.add(floor);
    objects.push(floor);

    // Left wall (curved approximation using tall box)
    var leftWallGeo = new THREE.BoxGeometry(2, 12, 200);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.9 });
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.receiveShadow = true;
    leftWall.position.x = -6;
    leftWall.position.y = 6;
    scene.add(leftWall);
    objects.push(leftWall);

    // Right wall (curved approximation using tall box)
    var rightWall = new THREE.Mesh(leftWallGeo, wallMat);
    rightWall.receiveShadow = true;
    rightWall.position.x = 6;
    rightWall.position.y = 6;
    scene.add(rightWall);
    objects.push(rightWall);

    // Ceiling (curved approximation)
    var ceilingGeo = new THREE.BoxGeometry(12, 2, 200);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.9 });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.receiveShadow = true;
    ceiling.position.y = 12;
    scene.add(ceiling);
    objects.push(ceiling);
  }

  function buildSewageChannel() {
    var sewageGeo = new THREE.BoxGeometry(4, 1, 200);
    var sewageMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a2a,
      emissive: 0x2a4a1a,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.7
    });
    var sewage = new THREE.Mesh(sewageGeo, sewageMat);
    sewage.receiveShadow = true;
    sewage.position.x = 0;
    sewage.position.y = 0.7;
    sewage.position.z = 0;
    sewage.userData.baseY = 0.7;
    sewage.userData.isAnimated = true;
    scene.add(sewage);
    objects.push(sewage);
    animations.push({
      object: sewage,
      type: 'sewageFlow',
      amplitude: 0.05,
      frequency: 2,
      property: 'positionY'
    });
  }

  function buildWalkwayGrating() {
    var grating = new THREE.LineSegments();
    var material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var geometry = new THREE.BufferGeometry();
    var positions = [];

    // Grid lines over sewage
    for (var i = -3; i <= 3; i += 1.5) {
      positions.push(i, 1.8, -100);
      positions.push(i, 1.8, 100);
    }
    for (var j = -100; j <= 100; j += 10) {
      positions.push(-3, 1.8, j);
      positions.push(3, 1.8, j);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    grating.geometry = geometry;
    grating.material = material;
    scene.add(grating);
    objects.push(grating);
  }

  function buildSupportArches() {
    // Support arch 1
    var arch1Geo = new THREE.BoxGeometry(10, 0.8, 2);
    var archMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.4, roughness: 0.6 });
    var arch1 = new THREE.Mesh(arch1Geo, archMat);
    arch1.receiveShadow = true;
    arch1.position.set(0, 10, -40);
    scene.add(arch1);
    objects.push(arch1);

    // Support arch 2
    var arch2 = new THREE.Mesh(arch1Geo, archMat);
    arch2.receiveShadow = true;
    arch2.position.set(0, 10, 40);
    scene.add(arch2);
    objects.push(arch2);
  }

  function buildMaintenanceLadder() {
    var ladder = new THREE.LineSegments();
    var material = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 3 });
    var geometry = new THREE.BufferGeometry();
    var positions = [];

    // Vertical rails
    positions.push(-5.5, 1, 80);
    positions.push(-5.5, 11, 80);
    positions.push(-4.5, 1, 80);
    positions.push(-4.5, 11, 80);

    // Horizontal rungs
    for (var i = 1; i <= 11; i += 1) {
      positions.push(-5.5, i, 80);
      positions.push(-4.5, i, 80);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    ladder.geometry = geometry;
    ladder.material = material;
    scene.add(ladder);
    objects.push(ladder);
  }

  function buildJunctionChamber() {
    var junctionGeo = new THREE.BoxGeometry(16, 8, 8);
    var junctionMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.2, roughness: 0.8 });
    var junction = new THREE.Mesh(junctionGeo, junctionMat);
    junction.receiveShadow = true;
    junction.position.set(0, 4, -80);
    scene.add(junction);
    objects.push(junction);
  }

  function buildPipeManifold() {
    // Central pipe
    var pipe1Geo = new THREE.CylinderGeometry(1, 1, 15, 16);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
    var pipe1 = new THREE.Mesh(pipe1Geo, pipeMat);
    pipe1.castShadow = true;
    pipe1.receiveShadow = true;
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 6, 60);
    scene.add(pipe1);
    objects.push(pipe1);

    // Branch pipe 1
    var pipe2 = new THREE.Mesh(pipe1Geo, pipeMat);
    pipe2.castShadow = true;
    pipe2.receiveShadow = true;
    pipe2.rotation.x = Math.PI / 2;
    pipe2.position.set(-4, 6, 60);
    scene.add(pipe2);
    objects.push(pipe2);

    // Branch pipe 2
    var pipe3 = new THREE.Mesh(pipe1Geo, pipeMat);
    pipe3.castShadow = true;
    pipe3.receiveShadow = true;
    pipe3.rotation.x = Math.PI / 2;
    pipe3.position.set(4, 6, 60);
    scene.add(pipe3);
    objects.push(pipe3);
  }

  function buildEscapeFugitive() {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.6, 0.6);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa6644, metalness: 0.1, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.8;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xcc9966, metalness: 0.1, roughness: 0.8 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 2.3;
    group.add(head);

    group.position.set(0, 0, -60);
    group.userData.baseZ = -60;
    group.userData.isAnimated = true;
    scene.add(group);
    objects.push(group);
    animations.push({
      object: group,
      type: 'fugitiveRun',
      speed: 2,
      property: 'positionZ'
    });
  }

  function buildPoliceOfficer() {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a3a6a, metalness: 0.1, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.9;
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xcc8844, metalness: 0.1, roughness: 0.8 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 2.4;
    group.add(head);

    group.position.set(0, 0, -45);
    group.userData.baseZ = -45;
    group.userData.targetZ = -60;
    group.userData.isAnimated = true;
    scene.add(group);
    objects.push(group);
    animations.push({
      object: group,
      type: 'policePursuit',
      speed: 1.2,
      property: 'positionZ'
    });
  }

  function buildPoliceDog() {
    var group = new THREE.Group();

    // Body (low cylinder-like box)
    var bodyGeo = new THREE.BoxGeometry(1.2, 0.6, 1.8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.1, roughness: 0.8 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.3;
    group.add(body);

    // Head (small box)
    var headGeo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.1, roughness: 0.8 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.set(0, 0.5, 1);
    group.add(head);

    // Legs (4 cylinders)
    var legGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.1, roughness: 0.8 });
    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.castShadow = true;
      leg.receiveShadow = true;
      var offsetX = (i < 2) ? -0.4 : 0.4;
      var offsetZ = (i % 2 === 0) ? -0.5 : 0.5;
      leg.position.set(offsetX, 0.15, offsetZ);
      group.add(leg);
    }

    group.position.set(0.5, 0, -35);
    group.userData.baseZ = -35;
    group.userData.isAnimated = true;
    scene.add(group);
    objects.push(group);
    animations.push({
      object: group,
      type: 'dogChase',
      speed: 1.5,
      property: 'positionZ'
    });
  }

  function buildWaterPumpStation() {
    var group = new THREE.Group();

    // Building box
    var buildingGeo = new THREE.BoxGeometry(3, 3, 4);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.2, roughness: 0.8 });
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.castShadow = true;
    building.receiveShadow = true;
    building.position.y = 1.5;
    group.add(building);

    // Pump (large cylinder)
    var pumpGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
    var pumpMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
    var pump = new THREE.Mesh(pumpGeo, pumpMat);
    pump.castShadow = true;
    pump.receiveShadow = true;
    pump.position.set(0, 3, 0);
    pump.userData.baseY = 3;
    pump.userData.isAnimated = true;
    group.add(pump);
    animations.push({
      object: pump,
      type: 'pumpVibrate',
      amplitude: 0.1,
      frequency: 8,
      property: 'positionY'
    });

    group.position.set(0, 0, 120);
    scene.add(group);
    objects.push(group);
  }

  function buildCollapsedSection() {
    // Rubble pile (multiple boxes)
    for (var i = 0; i < 8; i++) {
      var rubbleGeo = new THREE.BoxGeometry(
        1 + Math.random(),
        0.8 + Math.random() * 0.5,
        1 + Math.random()
      );
      var rubbleMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        metalness: 0.1,
        roughness: 0.9
      });
      var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      rubble.position.set(
        (Math.random() - 0.5) * 8,
        0.5 + i * 0.3,
        -10 + i * 0.4
      );
      rubble.rotation.set(Math.random(), Math.random(), Math.random());
      scene.add(rubble);
      objects.push(rubble);
    }
  }

  function buildEmergencyExitManhole() {
    // Opening (cylinder)
    var manholeGeo = new THREE.CylinderGeometry(2, 2, 0.5, 16);
    var manholeMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      emissive: 0xffff88,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.7
    });
    var manhole = new THREE.Mesh(manholeGeo, manholeMat);
    manhole.receiveShadow = true;
    manhole.position.set(0, 13, -120);
    manhole.userData.baseIntensity = 0.3;
    manhole.userData.isAnimated = true;
    scene.add(manhole);
    objects.push(manhole);
    animations.push({
      object: manhole.material,
      type: 'lightShaftPulse',
      minIntensity: 0.2,
      maxIntensity: 0.5,
      frequency: 3,
      property: 'emissiveIntensity'
    });

    // Light shaft (tall emissive box from above)
    var shaftGeo = new THREE.BoxGeometry(4, 30, 4);
    var shaftMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.2,
      metalness: 0,
      roughness: 1
    });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.receiveShadow = true;
    shaft.position.set(0, 20, -120);
    shaft.userData.baseIntensity = 0.2;
    shaft.userData.isAnimated = true;
    scene.add(shaft);
    objects.push(shaft);
    animations.push({
      object: shaft.material,
      type: 'shaftPulse',
      minIntensity: 0.1,
      maxIntensity: 0.3,
      frequency: 2.5,
      property: 'emissiveIntensity'
    });
  }

  function buildFloodGate() {
    var gateGeo = new THREE.BoxGeometry(10, 6, 0.8);
    var gateMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, metalness: 0.4, roughness: 0.6 });
    var gate = new THREE.Mesh(gateGeo, gateMat);
    gate.castShadow = true;
    gate.receiveShadow = true;
    gate.position.set(0, 3, 100);
    gate.userData.baseY = 3;
    gate.userData.isAnimated = true;
    scene.add(gate);
    objects.push(gate);
    animations.push({
      object: gate,
      type: 'floodGateLower',
      speed: 0.05,
      minY: 0.5,
      property: 'positionY'
    });
  }

  function buildRatSwarm() {
    var swarmGroup = new THREE.Group();
    swarmGroup.userData.baseX = -2;
    swarmGroup.userData.baseY = 1;
    swarmGroup.userData.baseZ = 20;

    for (var i = 0; i < 12; i++) {
      var ratGroup = new THREE.Group();

      // Body (small sphere)
      var bodyGeo = new THREE.SphereGeometry(0.15, 6, 6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x664433, metalness: 0.1, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      ratGroup.add(body);

      // Head (small box)
      var headGeo = new THREE.BoxGeometry(0.1, 0.1, 0.15);
      var headMat = new THREE.MeshStandardMaterial({ color: 0x554433, metalness: 0.1, roughness: 0.8 });
      var head = new THREE.Mesh(headGeo, headMat);
      head.castShadow = true;
      head.position.z = 0.25;
      ratGroup.add(head);

      var offsetX = (Math.random() - 0.5) * 4;
      var offsetY = Math.random() * 1;
      var offsetZ = (Math.random() - 0.5) * 4;
      ratGroup.position.set(offsetX, offsetY, offsetZ);
      ratGroup.userData.index = i;
      ratGroup.userData.basePos = { x: offsetX, y: offsetY, z: offsetZ };
      swarmGroup.add(ratGroup);
    }

    swarmGroup.userData.isAnimated = true;
    swarmGroup.position.set(-2, 1, 20);
    scene.add(swarmGroup);
    objects.push(swarmGroup);
    animations.push({
      object: swarmGroup,
      type: 'ratScurry',
      speed: 3,
      property: 'swarmPosition'
    });
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!gameState.hudVisible) return;

    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
    hudCtx.fillStyle = '#ffffff';
    hudCtx.font = 'bold 24px monospace';
    hudCtx.textAlign = 'left';

    var topMargin = 40;
    var lineHeight = 35;
    var leftMargin = 20;

    hudCtx.fillText('DISTANCE TO EXIT: ' + Math.max(0, Math.ceil(gameState.distanceToExit)) + 'm', leftMargin, topMargin);
    hudCtx.fillText('POLICE DISTANCE: ' + Math.max(0, Math.ceil(gameState.policeDistance)) + 'm', leftMargin, topMargin + lineHeight);
    hudCtx.fillText('OBSTACLES CLEARED: ' + gameState.obstaclesCleared + '/' + gameState.maxObstacles, leftMargin, topMargin + lineHeight * 2);

    // Hint
    hudCtx.font = '14px monospace';
    hudCtx.fillStyle = '#888888';
    hudCtx.fillText('[S then E to toggle HUD]', leftMargin, hudCanvas.height - 20);
  }

  function setupInput() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 's') {
        gameState.sKeyPressed = true;
        gameState.lastKeyTime = now;
      }

      if (event.key.toLowerCase() === 'e' && gameState.sKeyPressed) {
        if (now - gameState.lastKeyTime < 400) {
          gameState.hudVisible = !gameState.hudVisible;
          gameState.sKeyPressed = false;
        }
      }
    });

    document.addEventListener('keyup', function(event) {
      if (event.key.toLowerCase() === 's') {
        if (Date.now() - gameState.lastKeyTime > 400) {
          gameState.sKeyPressed = false;
        }
      }
    });

    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      hudCanvas.width = window.innerWidth;
      hudCanvas.height = window.innerHeight;
    });
  }

  function animate() {
    requestAnimationFrame(animate);

    gameState.time += 0.016;

    // Update animations
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];

      if (anim.type === 'sewageFlow') {
        var sewageOffsetY = Math.sin(gameState.time * anim.frequency) * anim.amplitude;
        anim.object.position.y = anim.object.userData.baseY + sewageOffsetY;
      } else if (anim.type === 'fugitiveRun') {
        anim.object.position.z = anim.object.userData.baseZ + gameState.time * anim.speed;
        gameState.distanceToExit = 87 - gameState.time * 0.5;
      } else if (anim.type === 'policePursuit') {
        var targetZ = anim.object.userData.baseZ + gameState.time * 1.5;
        anim.object.position.z += (targetZ - anim.object.position.z) * 0.02;
        gameState.policeDistance = Math.max(0, 15 - gameState.time * 0.3);
      } else if (anim.type === 'dogChase') {
        anim.object.position.z = anim.object.userData.baseZ + gameState.time * anim.speed;
      } else if (anim.type === 'pumpVibrate') {
        var vibrateY = Math.sin(gameState.time * anim.frequency) * anim.amplitude;
        anim.object.position.y = anim.object.userData.baseY + vibrateY;
      } else if (anim.type === 'lightShaftPulse') {
        var pulse = Math.sin(gameState.time * anim.frequency) * 0.15 + 0.35;
        anim.object.emissiveIntensity = pulse;
      } else if (anim.type === 'shaftPulse') {
        var shaftPulse = Math.sin(gameState.time * anim.frequency + 0.5) * 0.1 + 0.2;
        anim.object.emissiveIntensity = shaftPulse;
      } else if (anim.type === 'floodGateLower') {
        if (anim.object.position.y > anim.minY) {
          anim.object.position.y -= anim.speed;
        }
      } else if (anim.type === 'ratScurry') {
        var parent = anim.object;
        var children = parent.children;
        for (var j = 0; j < children.length; j++) {
          var rat = children[j];
          if (rat.userData.basePos) {
            var offsetX = Math.sin(gameState.time * anim.speed + rat.userData.index * 0.5) * 0.8;
            var offsetZ = Math.cos(gameState.time * anim.speed + rat.userData.index * 0.3) * 0.8;
            rat.position.x = rat.userData.basePos.x + offsetX;
            rat.position.z = rat.userData.basePos.z + offsetZ;
          }
        }
      }
    }

    // Camera follow
    var fugitivePos = objects.find(function(o) { return o.userData.isAnimated && o.children && o.children.length > 1; });
    if (fugitivePos) {
      var targetX = fugitivePos.position.x;
      var targetY = fugitivePos.position.y + 5;
      var targetZ = fugitivePos.position.z + 20;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.position.z += (targetZ - camera.position.z) * 0.05;
      camera.lookAt(fugitivePos.position.x, fugitivePos.position.y + 1, fugitivePos.position.z);
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  function update(deltaTime) {
    // Called externally for custom updates
  }

  function reset() {
    // Dispose of all resources
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    objects = [];
    animations = [];
    if (scene) {
      scene.clear();
      scene = null;
    }
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }
    gameState = {
      distanceToExit: 87,
      policeDistance: 15,
      obstaclesCleared: 0,
      maxObstacles: 4,
      time: 0,
      hudVisible: true,
      lastKeyTime: 0,
      sKeyPressed: false
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
