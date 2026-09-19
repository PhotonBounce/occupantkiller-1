window.DeathMarch = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene, camera, renderer, canvas2d, ctx2d;
  var sceneObjects = [];
  var animationState = {
    prisonersAlive: 8,
    guardsNeutralized: 0,
    escapeWindowOpen: true,
    hudVisible: false,
    time: 0,
    lastKeyPress: [],
    keyPressTime: 0
  };

  function init(container) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    // Three.js scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a6fa5); // Winter sky blue
    scene.fog = new THREE.Fog(0x4a6fa5, 200, 500);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 3, -50);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Canvas HUD setup
    canvas2d = document.createElement('canvas');
    canvas2d.width = 400;
    canvas2d.height = 120;
    canvas2d.style.position = 'absolute';
    canvas2d.style.top = '20px';
    canvas2d.style.left = '20px';
    canvas2d.style.display = 'none';
    canvas2d.style.fontFamily = 'monospace';
    canvas2d.style.zIndex = '100';
    document.body.appendChild(canvas2d);
    ctx2d = canvas2d.getContext('2d');

    // Build scene
    createSnowRoad();
    createWinterTrees();
    createPrisonerColumn();
    createGuardSoldiers();
    createPrisonCampGate();
    createGuardVehicle();
    createMachineGunNest();
    createAmbushFighters();
    createFallenTree();
    createAbandonedFarmhouse();
    createGuardWatchtower();
    createSnowDrifts();
    createSignpost();
    createBonfire();
    createBarbedWireFence();
    createSearchlight();
    createCrowSilhouettes();

    // Input handling
    document.addEventListener('keydown', function(e) {
      var char = e.key.toUpperCase();
      if (char === 'D' || char === 'M') {
        var now = Date.now();
        if (animationState.keyPressTime > 0 && now - animationState.keyPressTime < 400) {
          if ((animationState.lastKeyPress[0] === 'D' && char === 'M') ||
              (animationState.lastKeyPress[0] === 'M' && char === 'D')) {
            animationState.hudVisible = !animationState.hudVisible;
          }
        }
        animationState.lastKeyPress = [char];
        animationState.keyPressTime = now;
      }
    });

    // Window resize
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  function createSnowRoad() {
    var roadGeometry = new THREE.BoxGeometry(20, 0.2, 200);
    var roadMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0d0d0,
      roughness: 0.7,
      metalness: 0
    });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.castShadow = true;
    road.receiveShadow = true;
    road.position.z = -60;
    scene.add(road);
    sceneObjects.push(road);
  }

  function createWinterTrees() {
    var positions = [
      { x: -25, z: -20 }, { x: 25, z: -20 },
      { x: -30, z: -50 }, { x: 30, z: -50 },
      { x: -28, z: -80 }, { x: 28, z: -80 },
      { x: -32, z: -110 }, { x: 32, z: -110 },
      { x: -26, z: -140 }, { x: 26, z: -140 }
    ];

    positions.forEach(function(pos) {
      // Trunk
      var trunkGeometry = new THREE.BoxGeometry(0.8, 12, 0.8);
      var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      trunk.position.set(pos.x, 6, pos.z);
      scene.add(trunk);
      sceneObjects.push(trunk);

      // Snow canopy (cone-like, using box approximation)
      var canopyGeometry = new THREE.BoxGeometry(8, 10, 8);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.8
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      canopy.position.set(pos.x, 12, pos.z);
      scene.add(canopy);
      sceneObjects.push(canopy);
    });
  }

  function createPrisonerColumn() {
    var spacing = 2.5;
    for (var i = 0; i < 8; i++) {
      var group = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = 0.9;
      group.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xc9a876 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.set(0, 2.6, 0);
      group.add(head);

      group.position.set(-8 + i * spacing, 0, -10 - i * 0.5);
      group.userData = { type: 'prisoner', index: i };
      scene.add(group);
      sceneObjects.push(group);
    }
  }

  function createGuardSoldiers() {
    var positions = [
      { x: -12, z: -15 },
      { x: -10, z: -30 },
      { x: 12, z: -20 },
      { x: 11, z: -35 },
      { x: -13, z: -50 },
      { x: 13, z: -55 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.7, 1.9, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = 0.95;
      group.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xb89968 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.set(0, 2.6, 0);
      group.add(head);

      // Rifle (simple box)
      var rifleGeometry = new THREE.BoxGeometry(0.15, 1.5, 0.1);
      var rifleMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
      rifle.castShadow = true;
      rifle.position.set(0.4, 1.5, 0);
      group.add(rifle);

      group.position.set(pos.x, 0, pos.z);
      group.userData = { type: 'guard', index: positions.indexOf(pos) };
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createPrisonCampGate() {
    // Left pillar
    var pillarGeometry = new THREE.BoxGeometry(1.5, 6, 1.5);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
    var pillarLeft = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarLeft.castShadow = true;
    pillarLeft.position.set(-8, 3, 50);
    scene.add(pillarLeft);
    sceneObjects.push(pillarLeft);

    // Right pillar
    var pillarRight = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillarRight.castShadow = true;
    pillarRight.position.set(8, 3, 50);
    scene.add(pillarRight);
    sceneObjects.push(pillarRight);

    // Wire between pillars
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -8, 5.5, 50,
      8, 5.5, 50,
      -7, 4.5, 50,
      7, 4.5, 50
    ]);
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x8a6a4a, linewidth: 3 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    sceneObjects.push(wire);
  }

  function createGuardVehicle() {
    var group = new THREE.Group();

    // Truck body
    var bodyGeometry = new THREE.BoxGeometry(3, 2, 6);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 1.2;
    group.add(body);

    // Front cabin
    var cabinGeometry = new THREE.BoxGeometry(2.5, 1.5, 2);
    var cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
    cabin.castShadow = true;
    cabin.position.set(0, 1.2, 2.5);
    group.add(cabin);

    // Wheels
    for (var i = 0; i < 4; i++) {
      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.castShadow = true;
      wheel.rotation.z = Math.PI / 2;
      var xOffset = i < 2 ? -1.2 : 1.2;
      var zOffset = i % 2 === 0 ? -1.5 : 1.5;
      wheel.position.set(xOffset, 0.8, zOffset);
      group.add(wheel);
    }

    group.position.set(0, 0, -25);
    group.userData = { type: 'vehicle' };
    scene.add(group);
    sceneObjects.push(group);
  }

  function createMachineGunNest() {
    // Sandbag wall
    var sandbagGeometry = new THREE.BoxGeometry(6, 1.5, 1.5);
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x9a8a7a });
    var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
    sandbag.castShadow = true;
    sandbag.receiveShadow = true;
    sandbag.position.set(0, 0.75, -150);
    scene.add(sandbag);
    sceneObjects.push(sandbag);

    // Gun barrel (cylinder)
    var gunGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
    var gunMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.castShadow = true;
    gun.rotation.z = Math.PI / 4;
    gun.position.set(0, 1.5, -150);
    scene.add(gun);
    sceneObjects.push(gun);

    // Gun mount
    var mountGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var mount = new THREE.Mesh(mountGeometry, gunMaterial);
    mount.castShadow = true;
    mount.position.set(0, 1.2, -150);
    scene.add(mount);
    sceneObjects.push(mount);
  }

  function createAmbushFighters() {
    var positions = [
      { x: -25, z: -100 },
      { x: 25, z: -120 },
      { x: -28, z: -140 },
      { x: 28, z: -160 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.7, 1.7, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a3a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 0.85;
      group.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xa87a5a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.set(0, 2.3, 0);
      group.add(head);

      group.position.set(pos.x, 0, pos.z);
      group.userData = { type: 'ambush', index: positions.indexOf(pos) };
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createFallenTree() {
    var trunkGeometry = new THREE.CylinderGeometry(0.6, 0.6, 25, 16);
    var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.rotation.z = Math.PI / 2.2;
    trunk.position.set(-2, 1.5, -85);
    scene.add(trunk);
    sceneObjects.push(trunk);
  }

  function createAbandonedFarmhouse() {
    var group = new THREE.Group();

    // Main building
    var buildingGeometry = new THREE.BoxGeometry(8, 6, 10);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x7a6a5a });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.castShadow = true;
    building.receiveShadow = true;
    building.position.y = 3;
    group.add(building);

    // Blown out window (dark box)
    var windowGeometry = new THREE.BoxGeometry(2, 2, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-2, 4, 5.1);
    group.add(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(2, 4, 5.1);
    group.add(window2);

    // Roof (angled boxes as simplification)
    var roofGeometry = new THREE.BoxGeometry(9, 2, 10.5);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    roof.position.set(0, 6.5, 0);
    roof.rotation.z = 0.15;
    group.add(roof);

    group.position.set(30, 0, -100);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createGuardWatchtower() {
    // Base platform
    var baseGeometry = new THREE.BoxGeometry(4, 0.5, 4);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.set(-35, 0.25, -70);
    scene.add(base);
    sceneObjects.push(base);

    // Support legs (cylinders)
    for (var i = 0; i < 4; i++) {
      var legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 12);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.castShadow = true;
      var xOffset = i < 2 ? -1.5 : 1.5;
      var zOffset = i % 2 === 0 ? -1.5 : 1.5;
      leg.position.set(xOffset - 35, 4, zOffset - 70);
      scene.add(leg);
      sceneObjects.push(leg);
    }

    // Cabin top
    var cabinGeometry = new THREE.BoxGeometry(3, 2, 3);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a6a });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.position.set(-35, 9, -70);
    scene.add(cabin);
    sceneObjects.push(cabin);
  }

  function createSnowDrifts() {
    var driftPositions = [
      { x: -15, z: -30 },
      { x: 18, z: -60 },
      { x: -20, z: -90 },
      { x: 22, z: -130 }
    ];

    driftPositions.forEach(function(pos) {
      var driftGeometry = new THREE.BoxGeometry(6, 1.5, 8);
      var driftMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        roughness: 0.9
      });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.castShadow = true;
      drift.receiveShadow = true;
      drift.position.set(pos.x, 0.75, pos.z);
      drift.rotation.z = (Math.random() - 0.5) * 0.3;
      scene.add(drift);
      sceneObjects.push(drift);
    });
  }

  function createSignpost() {
    // Post
    var postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 12);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.castShadow = true;
    post.receiveShadow = true;
    post.position.set(-40, 2, -50);
    scene.add(post);
    sceneObjects.push(post);

    // Sign
    var signGeometry = new THREE.BoxGeometry(3, 1.5, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a6a });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.castShadow = true;
    sign.position.set(-40, 3.5, -50);
    scene.add(sign);
    sceneObjects.push(sign);

    // Arrow (LineSegments)
    var arrowGeometry = new THREE.BufferGeometry();
    var arrowPositions = new Float32Array([
      -41, 3.5, -50,
      -39, 3.5, -50,
      -39, 3.5, -50,
      -38.5, 3.8, -50,
      -39, 3.5, -50,
      -38.5, 3.2, -50
    ]);
    arrowGeometry.setAttribute('position', new THREE.BufferAttribute(arrowPositions, 3));
    var arrowMaterial = new THREE.LineBasicMaterial({ color: 0x1a1a1a, linewidth: 2 });
    var arrow = new THREE.LineSegments(arrowGeometry, arrowMaterial);
    scene.add(arrow);
    sceneObjects.push(arrow);
  }

  function createBonfire() {
    // Fire pit
    var pitGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var pitMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    var pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.castShadow = true;
    pit.receiveShadow = true;
    pit.position.set(35, 0.25, -40);
    scene.add(pit);
    sceneObjects.push(pit);

    // Flame (emissive sphere)
    var flameGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    var flameMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      emissive: 0xff4500,
      emissiveIntensity: 0.8,
      roughness: 0.4
    });
    var flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.set(35, 1.5, -40);
    scene.add(flame);
    flame.userData = { type: 'bonfire', originalEmissive: 0xff4500 };
    sceneObjects.push(flame);
  }

  function createBarbedWireFence() {
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];

    // Vertical posts with wire strands
    for (var i = 0; i < 30; i++) {
      var z = -10 - i * 6;
      wirePositions.push(-18, 0.2, z);
      wirePositions.push(-18, 2, z);
      wirePositions.push(-18, 2, z);
      wirePositions.push(-18 + 0.3, 1.8, z - 0.5);
      if (i < 29) {
        wirePositions.push(-18, 1, z);
        wirePositions.push(-18, 1, z - 6);
      }
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x6a5a4a, linewidth: 1 });
    var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wire);
    sceneObjects.push(wire);
  }

  function createSearchlight() {
    var group = new THREE.Group();

    // Housing
    var housingGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
    var housingMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.castShadow = true;
    housing.position.set(0, 2.5, -25);
    group.add(housing);

    // Light sphere (emissive)
    var lightGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xffff00,
      emissiveIntensity: 0.6,
      roughness: 0.3
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(0, 3.2, -25);
    group.add(light);
    light.userData = { type: 'searchlight' };

    group.userData = { type: 'searchlight-group' };
    scene.add(group);
    sceneObjects.push(group);
  }

  function createCrowSilhouettes() {
    var crowPositions = [
      { x: -20, y: 30, z: -80 },
      { x: 15, y: 35, z: -120 },
      { x: -30, y: 28, z: -160 },
      { x: 25, y: 32, z: -100 }
    ];

    crowPositions.forEach(function(pos) {
      var crowGeometry = new THREE.BufferGeometry();
      var crowVertices = new Float32Array([
        0, 0, 0,      // center
        -0.3, 0.5, 0, // left wing
        0.3, 0.5, 0   // right wing
      ]);
      crowGeometry.setAttribute('position', new THREE.BufferAttribute(crowVertices, 3));
      var indices = [0, 1, 0, 2];
      crowGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

      var crowMaterial = new THREE.LineBasicMaterial({ color: 0x1a1a1a, linewidth: 1 });
      var crow = new THREE.LineSegments(crowGeometry, crowMaterial);
      crow.position.set(pos.x, pos.y, pos.z);
      scene.add(crow);
      sceneObjects.push(crow);
    });
  }

  function update(deltaTime) {
    animationState.time += deltaTime;

    // Prisoner column shuffling
    sceneObjects.forEach(function(obj) {
      if (obj.userData && obj.userData.type === 'prisoner') {
        var wobble = Math.sin(animationState.time * 3 + obj.userData.index * 0.3) * 0.1;
        obj.position.z = -10 - obj.userData.index * 0.5 - animationState.time * 0.5 + wobble;
        obj.rotation.x = Math.sin(animationState.time * 2 + obj.userData.index * 0.2) * 0.05;
      }
      if (obj.userData && obj.userData.type === 'guard') {
        obj.position.z -= animationState.time * 0.5 * 0.1;
        obj.rotation.x = Math.sin(animationState.time * 1.5 + obj.userData.index * 0.3) * 0.03;
      }
      if (obj.userData && obj.userData.type === 'vehicle') {
        obj.position.z = -25 - animationState.time * 0.3;
        obj.children.forEach(function(child) {
          if (child.geometry && child.geometry.type === 'CylinderGeometry') {
            child.rotation.x += 0.05;
          }
        });
      }
      if (obj.userData && obj.userData.type === 'ambush') {
        var bobble = Math.sin(animationState.time * 2 + obj.userData.index * 0.5) * 0.08;
        obj.position.y = bobble * 0.3;
      }
      if (obj.userData && obj.userData.type === 'bonfire') {
        var flicker = 0.6 + Math.sin(animationState.time * 5) * 0.2;
        obj.material.emissiveIntensity = flicker;
      }
      if (obj.userData && obj.userData.type === 'searchlight-group') {
        obj.rotation.y = Math.sin(animationState.time * 1.2) * Math.PI / 3;
      }
    });

    // Tree canopy sway
    sceneObjects.forEach(function(obj) {
      if (obj.userData && obj.position.y > 10 && obj.scale.x > 5) {
        var sway = Math.sin(animationState.time * 0.8) * 0.05;
        obj.rotation.z = sway;
      }
    });

    // Update HUD if visible
    if (animationState.hudVisible) {
      ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx2d.fillRect(0, 0, canvas2d.width, canvas2d.height);
      ctx2d.fillStyle = '#00ff00';
      ctx2d.font = '16px monospace';
      ctx2d.fillText('PRISONERS ALIVE: ' + animationState.prisonersAlive + '/8', 10, 30);
      ctx2d.fillText('GUARDS NEUTRALIZED: ' + animationState.guardsNeutralized + '/6', 10, 60);
      ctx2d.fillText('ESCAPE WINDOW: ' + (animationState.escapeWindowOpen ? 'OPEN' : 'CLOSED'), 10, 90);
    }

    if (renderer) renderer.render(scene, camera);
  }

  function reset() {
    // Clear scene
    sceneObjects.forEach(function(obj) {
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
    sceneObjects = [];
    scene.clear();

    // Reset state
    animationState.time = 0;
    animationState.prisonersAlive = 8;
    animationState.guardsNeutralized = 0;
    animationState.escapeWindowOpen = true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
