window.GhostTownSiege = (function() {
  'use strict';

  var scene, camera, renderer;
  var tumbleweeds = [];
  var sandParticles = [];
  var cartelFigures = [];
  var deaAgents = [];
  var deaVehicles = [];
  var sunset;
  var bellTower;
  var churchBell;
  var hudOverlay;
  var hudUpdateTime = 0;
  var hudVisible = true;
  var lastHKeyTime = 0;
  var lastGKeyTime = 0;
  var hPressed = false;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Set scene background to desert sky
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0xccaa88, 150, 500);

    createDirtRoad();
    createSaloon();
    createChurch();
    createJail();
    createBank();
    createCartelFigures();
    createDEAAgents();
    createDEAVehicles();
    createTumbleweed();
    createWaterTower();
    createHitchingPosts();
    createOverturnedWagon();
    createHangingNoose();
    createSunsetAtmosphere();
    createSandParticles();
    createTelegraphPole();
    createHUD();

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    document.addEventListener('keydown', handleKeyDown);
  }

  function createDirtRoad() {
    var roadGeometry = new THREE.BoxGeometry(8, 0.2, 100);
    var roadMaterial = new THREE.MeshStandardMaterial({
      color: 0xb08040,
      roughness: 0.8,
      metalness: 0.0
    });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.receiveShadow = true;
    road.castShadow = true;
    road.position.z = 0;
    scene.add(road);
  }

  function createSaloon() {
    // Main saloon building
    var saloonGeometry = new THREE.BoxGeometry(12, 8, 10);
    var saloonMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
      metalness: 0.0
    });
    var saloon = new THREE.Mesh(saloonGeometry, saloonMaterial);
    saloon.castShadow = true;
    saloon.receiveShadow = true;
    saloon.position.set(-20, 4, -15);
    scene.add(saloon);

    // Covered porch
    var porchGeometry = new THREE.BoxGeometry(14, 3, 4);
    var porch = new THREE.Mesh(porchGeometry, saloonMaterial);
    porch.castShadow = true;
    porch.receiveShadow = true;
    porch.position.set(-20, 1.5, -22);
    scene.add(porch);

    // Signpost
    var signpostGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    var signpostMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8
    });
    var signpost = new THREE.Mesh(signpostGeometry, signpostMaterial);
    signpost.castShadow = true;
    signpost.position.set(-27, 2, -20);
    scene.add(signpost);

    var signGeometry = new THREE.BoxGeometry(3, 2, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5
    });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.castShadow = true;
    sign.position.set(-27, 4, -20);
    scene.add(sign);
  }

  function createChurch() {
    // Church nave
    var naveGeometry = new THREE.BoxGeometry(10, 8, 14);
    var churchMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.75,
      metalness: 0.0
    });
    var nave = new THREE.Mesh(naveGeometry, churchMaterial);
    nave.castShadow = true;
    nave.receiveShadow = true;
    nave.position.set(25, 4, -10);
    scene.add(nave);

    // Bell tower
    bellTower = new THREE.Group();
    var towerGeometry = new THREE.BoxGeometry(4, 16, 4);
    var tower = new THREE.Mesh(towerGeometry, churchMaterial);
    tower.castShadow = true;
    tower.position.y = 8;
    bellTower.add(tower);
    bellTower.position.set(25, 0, 0);
    scene.add(bellTower);

    // Bell
    var bellGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.8
    });
    churchBell = new THREE.Mesh(bellGeometry, bellMaterial);
    churchBell.castShadow = true;
    churchBell.position.set(0, 15, 0);
    bellTower.add(churchBell);

    // Cross on top
    var crossVertGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    var crossMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.5
    });
    var crossVert = new THREE.Mesh(crossVertGeometry, crossMaterial);
    crossVert.castShadow = true;
    crossVert.position.set(0, 18, 0);
    bellTower.add(crossVert);

    var crossHorzGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
    var crossHorz = new THREE.Mesh(crossHorzGeometry, crossMaterial);
    crossHorz.castShadow = true;
    crossHorz.position.set(0, 18.5, 0);
    bellTower.add(crossHorz);
  }

  function createJail() {
    // Jail building
    var jailGeometry = new THREE.BoxGeometry(8, 6, 10);
    var jailMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.0
    });
    var jail = new THREE.Mesh(jailGeometry, jailMaterial);
    jail.castShadow = true;
    jail.receiveShadow = true;
    jail.position.set(0, 3, 25);
    scene.add(jail);

    // Barred window boxes
    var barGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    var barMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9
    });

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.castShadow = true;
        bar.position.set(-3 + i * 2, 2 + j * 1.5, 5.05);
        scene.add(bar);
      }
    }
  }

  function createBank() {
    // Bank building
    var bankGeometry = new THREE.BoxGeometry(14, 8, 12);
    var bankMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0a080,
      roughness: 0.7,
      metalness: 0.0
    });
    var bank = new THREE.Mesh(bankGeometry, bankMaterial);
    bank.castShadow = true;
    bank.receiveShadow = true;
    bank.position.set(-35, 4, 10);
    scene.add(bank);

    // Broken vault door
    var vaultDoorGeometry = new THREE.BoxGeometry(3, 4, 0.5);
    var vaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 1.0,
      roughness: 0.2
    });
    var vaultDoor = new THREE.Mesh(vaultDoorGeometry, vaultMaterial);
    vaultDoor.castShadow = true;
    vaultDoor.rotation.z = 0.5;
    vaultDoor.position.set(-39, 3, 16.5);
    scene.add(vaultDoor);
  }

  function createCartelFigures() {
    var cartelColors = [0xff0000, 0xff3300, 0xcc0000];

    // Figure positions in doorways and windows
    var positions = [
      {x: -20, y: 4.5, z: -20},
      {x: 25, y: 4.5, z: -4},
      {x: 0, y: 3, z: 30},
      {x: -35, y: 4.5, z: 15},
      {x: -45, y: 3, z: 5},
      {x: 15, y: 2, z: -5}
    ];

    for (var i = 0; i < 6; i++) {
      var figureGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: cartelColors[i % 3],
        roughness: 0.6
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 1;
      figureGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.5
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.y = 2.2;
      figureGroup.add(head);

      figureGroup.position.copy(positions[i]);
      cartelFigures.push({
        group: figureGroup,
        time: Math.random() * 10
      });
      scene.add(figureGroup);
    }
  }

  function createDEAAgents() {
    var agentPositions = [
      {x: -15, z: 40},
      {x: -5, z: 45},
      {x: 5, z: 42},
      {x: 15, z: 48}
    ];

    for (var i = 0; i < 4; i++) {
      var agentGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.9, 2, 0.7);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a4d7a,
        roughness: 0.6
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 1;
      agentGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.5, 0.7, 0.5);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0xffdbac,
        roughness: 0.5
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.y = 2.1;
      agentGroup.add(head);

      // Tactical vest
      var vestGeometry = new THREE.BoxGeometry(1.1, 1.5, 0.3);
      var vestMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d5a8c,
        roughness: 0.7
      });
      var vest = new THREE.Mesh(vestGeometry, vestMaterial);
      vest.castShadow = true;
      vest.position.y = 1;
      vest.position.z = -0.2;
      agentGroup.add(vest);

      agentGroup.position.set(agentPositions[i].x, 1, agentPositions[i].z);
      deaAgents.push({
        group: agentGroup,
        startZ: agentPositions[i].z
      });
      scene.add(agentGroup);
    }
  }

  function createDEAVehicles() {
    var vehiclePositions = [
      {x: -35, z: 60},
      {x: 20, z: 65}
    ];

    for (var i = 0; i < 2; i++) {
      var vehicleGroup = new THREE.Group();

      // Main body
      var bodyGeometry = new THREE.BoxGeometry(2.5, 1.5, 5);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.4,
        metalness: 0.6
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.y = 0.75;
      vehicleGroup.add(body);

      // Cabin
      var cabinGeometry = new THREE.BoxGeometry(2.3, 1.2, 2);
      var cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
      cabin.castShadow = true;
      cabin.position.y = 1.8;
      cabin.position.z = -1;
      vehicleGroup.add(cabin);

      // Roof lights
      var lightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.3);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.8
      });
      var light1 = new THREE.Mesh(lightGeometry, lightMaterial);
      light1.position.set(-0.6, 2.4, -0.5);
      vehicleGroup.add(light1);

      var light2 = new THREE.Mesh(lightGeometry, lightMaterial);
      light2.position.set(0.6, 2.4, -0.5);
      vehicleGroup.add(light2);

      // Wheels
      var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.8
      });

      var wheelPositions = [
        {x: -1, z: -1.5},
        {x: 1, z: -1.5},
        {x: -1, z: 1.5},
        {x: 1, z: 1.5}
      ];

      for (var j = 0; j < 4; j++) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.castShadow = true;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelPositions[j].x, 0.5, wheelPositions[j].z);
        vehicleGroup.add(wheel);
      }

      vehicleGroup.position.set(vehiclePositions[i].x, 0, vehiclePositions[i].z);
      deaVehicles.push({
        group: vehicleGroup,
        startZ: vehiclePositions[i].z
      });
      scene.add(vehicleGroup);
    }
  }

  function createTumbleweed() {
    // Create tumbleweed as cluster of thin boxes
    for (var t = 0; t < 2; t++) {
      var tumbleweeedGroup = new THREE.Group();

      for (var i = 0; i < 8; i++) {
        var angle = (i / 8) * Math.PI * 2;
        var boxGeometry = new THREE.BoxGeometry(0.3, 3, 0.2);
        var boxMaterial = new THREE.MeshStandardMaterial({
          color: 0xaa8844,
          roughness: 0.9
        });
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.position.x = Math.cos(angle) * 2;
        box.position.z = Math.sin(angle) * 2;
        box.rotation.z = angle;
        tumbleweeedGroup.add(box);
      }

      tumbleweeedGroup.position.set(-30, 1, -50 + t * 30);
      tumbleweeds.push({
        group: tumbleweeedGroup,
        position: -50 + t * 30,
        rotation: 0
      });
      scene.add(tumbleweeedGroup);
    }
  }

  function createWaterTower() {
    var group = new THREE.Group();

    // Tower post
    var postGeometry = new THREE.BoxGeometry(0.5, 12, 0.5);
    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8
    });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.castShadow = true;
    post.position.y = 6;
    group.add(post);

    // Support legs
    var legGeometry = new THREE.BoxGeometry(0.3, 10, 0.3);
    var leg1 = new THREE.Mesh(legGeometry, postMaterial);
    leg1.castShadow = true;
    leg1.position.set(2, 5, 0);
    leg1.rotation.z = 0.3;
    group.add(leg1);

    var leg2 = new THREE.Mesh(legGeometry, postMaterial);
    leg2.castShadow = true;
    leg2.position.set(-2, 5, 0);
    leg2.rotation.z = -0.3;
    group.add(leg2);

    // Conical cap
    var capGeometry = new THREE.BoxGeometry(3, 2, 3);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.castShadow = true;
    cap.position.y = 13;
    group.add(cap);

    // Tank body (cylinder as stacked boxes)
    var tankGeometry = new THREE.BoxGeometry(4, 3, 4);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.5,
      metalness: 0.6
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.castShadow = true;
    tank.position.y = 10;
    group.add(tank);

    group.position.set(50, 0, 0);
    scene.add(group);
  }

  function createHitchingPosts() {
    for (var i = 0; i < 3; i++) {
      // Post
      var postGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.8
      });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.castShadow = true;
      post.position.set(-50 + i * 20, 1.5, 0);
      scene.add(post);

      // Rope line
      if (i < 2) {
        var ropeGeometry = new THREE.BoxGeometry(20, 0.1, 0.1);
        var ropeMaterial = new THREE.MeshStandardMaterial({
          color: 0x8b6914,
          roughness: 0.9
        });
        var rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.castShadow = true;
        rope.position.set(-40 + i * 20, 2.5, 0);
        scene.add(rope);
      }
    }
  }

  function createOverturnedWagon() {
    var group = new THREE.Group();

    // Wagon body
    var bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.rotation.z = Math.PI / 4;
    body.position.y = 1.5;
    group.add(body);

    // Wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      roughness: 0.8
    });

    var wheels = [
      {x: -1.5, z: -1.5, visible: true},
      {x: 1.5, z: -1.5, visible: false},
      {x: -1.5, z: 1.5, visible: true},
      {x: 1.5, z: 1.5, visible: false}
    ];

    for (var i = 0; i < 4; i++) {
      if (wheels[i].visible) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.castShadow = true;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheels[i].x, 0.8, wheels[i].z);
        group.add(wheel);
      }
    }

    group.position.set(-60, 0, -20);
    scene.add(group);
  }

  function createHangingNoose() {
    var group = new THREE.Group();

    // Rope from beam
    var ropeGeometry = new THREE.BoxGeometry(0.1, 4, 0.1);
    var ropeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9
    });
    var rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.castShadow = true;
    rope.position.y = -2;
    group.add(rope);

    // Loop shape (approximated with boxes)
    var loopGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.5);
    var loop = new THREE.Mesh(loopGeometry, ropeMaterial);
    loop.castShadow = true;
    loop.position.y = -4.5;
    group.add(loop);

    group.position.set(-20, 8, -25);
    scene.add(group);
  }

  function createSunsetAtmosphere() {
    var sunsetGeometry = new THREE.BoxGeometry(300, 150, 0.1);
    var sunsetMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4400,
      emissive: 0xff4400,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    sunset = new THREE.Mesh(sunsetGeometry, sunsetMaterial);
    sunset.position.set(0, 60, -200);
    scene.add(sunset);
  }

  function createSandParticles() {
    for (var i = 0; i < 15; i++) {
      var particleGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xd4a574,
        roughness: 0.9
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.castShadow = true;
      particle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 10,
        (Math.random() - 0.5) * 100
      );
      sandParticles.push({
        mesh: particle,
        time: Math.random() * 20
      });
      scene.add(particle);
    }
  }

  function createTelegraphPole() {
    var group = new THREE.Group();

    // Main pole
    var poleGeometry = new THREE.BoxGeometry(0.3, 14, 0.3);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.8
    });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.castShadow = true;
    pole.position.y = 7;
    group.add(pole);

    // Crossbar
    var crossbarGeometry = new THREE.BoxGeometry(4, 0.3, 0.3);
    var crossbar = new THREE.Mesh(crossbarGeometry, poleMaterial);
    crossbar.castShadow = true;
    crossbar.position.y = 12;
    group.add(crossbar);

    // Wire to next pole
    var wireGeometry = new THREE.BoxGeometry(30, 0.1, 0.1);
    var wireMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7
    });
    var wire = new THREE.Mesh(wireGeometry, wireMaterial);
    wire.castShadow = true;
    wire.position.set(15, 11.5, 0);
    group.add(wire);

    group.position.set(-80, 0, 30);
    scene.add(group);
  }

  function createHUD() {
    var hudDiv = document.createElement('div');
    hudDiv.id = 'ghost-town-hud';
    hudDiv.style.position = 'fixed';
    hudDiv.style.top = '20px';
    hudDiv.style.left = '20px';
    hudDiv.style.color = '#00ff00';
    hudDiv.style.fontFamily = 'monospace';
    hudDiv.style.fontSize = '14px';
    hudDiv.style.fontWeight = 'bold';
    hudDiv.style.textShadow = '0 0 10px #00ff00';
    hudDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    hudDiv.style.padding = '10px';
    hudDiv.style.border = '2px solid #00ff00';
    hudDiv.style.zIndex = '1000';
    hudDiv.innerHTML = 'CARTEL TARGETS: 6<br>DEA ADVANCE: 30%<br>TOWN SECURE: NO';
    document.body.appendChild(hudDiv);
    hudOverlay = hudDiv;
  }

  function handleKeyDown(event) {
    if (event.key === 'h' || event.key === 'H') {
      var now = Date.now();
      if (now - lastHKeyTime > 400) {
        hPressed = false;
      }
      hPressed = true;
      lastHKeyTime = now;
    }

    if (event.key === 'g' || event.key === 'G') {
      if (hPressed && Date.now() - lastHKeyTime < 400) {
        hudVisible = !hudVisible;
        if (hudOverlay) {
          hudOverlay.style.display = hudVisible ? 'block' : 'none';
        }
      }
      lastGKeyTime = Date.now();
    }
  }

  function update(delta) {
    // Update tumbleweeds
    for (var i = 0; i < tumbleweeds.length; i++) {
      var tw = tumbleweeds[i];
      tw.position += delta * 5;
      tw.rotation += delta * 3;
      tw.group.position.z = tw.position;
      tw.group.rotation.y += delta * 3;

      if (tw.position > 50) {
        tw.position = -80;
      }
    }

    // Update sand particles
    for (var i = 0; i < sandParticles.length; i++) {
      var sp = sandParticles[i];
      sp.time += delta;
      sp.mesh.position.x += Math.sin(sp.time * 0.5) * delta * 2;
      sp.mesh.position.y = Math.sin(sp.time * 0.3) * 2 + 5;
      sp.mesh.position.z += delta * 3;

      if (sp.mesh.position.z > 100) {
        sp.mesh.position.z = -100;
      }
    }

    // Update cartel figures - sway and bob
    for (var i = 0; i < cartelFigures.length; i++) {
      var cf = cartelFigures[i];
      cf.time += delta;
      cf.group.position.y += Math.sin(cf.time * 1.5) * delta * 0.5;
      cf.group.rotation.y = Math.sin(cf.time * 0.8) * 0.2;
    }

    // Update DEA agents - advance down road
    for (var i = 0; i < deaAgents.length; i++) {
      var da = deaAgents[i];
      da.startZ -= delta * 8;
      da.group.position.z = da.startZ;

      if (da.startZ < -50) {
        da.startZ = 70;
      }
    }

    // Update DEA vehicles - advance
    for (var i = 0; i < deaVehicles.length; i++) {
      var dv = deaVehicles[i];
      dv.startZ -= delta * 6;
      dv.group.position.z = dv.startZ;

      if (dv.startZ < -50) {
        dv.startZ = 80;
      }
    }

    // Update church bell - swing
    if (churchBell) {
      churchBell.rotation.z = Math.sin(Date.now() * 0.002) * 0.4;
    }

    // Update sunset color shift
    if (sunset) {
      var hue = (Date.now() * 0.0001) % 1;
      sunset.material.color.setHSL(hue * 0.1, 1, 0.5);
      sunset.material.emissive.setHSL(hue * 0.1, 1, 0.3);
    }

    // Update HUD
    hudUpdateTime += delta;
    if (hudUpdateTime > 0.5) {
      var advance = Math.floor((Date.now() % 5000) / 5000 * 100);
      if (hudOverlay) {
        hudOverlay.innerHTML = 'CARTEL TARGETS: ' + (6 - Math.floor(advance / 20)) +
                              '<br>DEA ADVANCE: ' + advance + '%' +
                              '<br>TOWN SECURE: ' + (advance > 80 ? 'YES' : 'NO');
      }
      hudUpdateTime = 0;
    }
  }

  function reset() {
    if (hudOverlay) {
      hudOverlay.remove();
    }
    document.removeEventListener('keydown', handleKeyDown);

    // Remove all scene objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    tumbleweeds = [];
    sandParticles = [];
    cartelFigures = [];
    deaAgents = [];
    deaVehicles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
