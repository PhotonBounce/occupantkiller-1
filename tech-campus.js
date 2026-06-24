var window = window || {};

window.TechCampus = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var drones = [];
  var serverRacks = [];
  var hudElement = null;
  var gameState = {
    researchCores: 0,
    maxCores: 4,
    agentsDown: 0,
    dronesActive: 3,
    score: 0
  };
  var elapsedTime = 0;
  var lastTKeyTime = 0;
  var lastCKeyTime = 0;
  var hudVisible = true;
  var lights = [];
  var serverLights = [];
  var fountainGroup = null;

  function createGlassOfficeBuilding() {
    var group = new THREE.Group();

    // Main structure - large box building
    var buildingGeometry = new THREE.BoxGeometry(8, 12, 6);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCDDEE,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x001122,
      emissiveIntensity: 0.1
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 6;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Glass panels - emissive blue-white color
    var panelGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x00BBFF,
      emissive: 0x0099DD,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.1
    });

    // Create grid of glass panels on front
    for (var i = 0; i < 12; i++) {
      for (var j = 0; j < 18; j++) {
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(
          -3.5 + (j * 0.6),
          1 + (i * 0.8),
          3.05
        );
        panel.castShadow = true;
        panel.receiveShadow = true;
        group.add(panel);
      }
    }

    // Top roof platform - flat box
    var roofGeometry = new THREE.BoxGeometry(9, 0.5, 7);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 12.25;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    return group;
  }

  function createCampusPlaza() {
    var group = new THREE.Group();

    // Flat ground
    var groundGeometry = new THREE.BoxGeometry(30, 0.3, 25);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.8
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = 0;
    ground.receiveShadow = true;
    group.add(ground);

    // Decorative abstract sculpture - boxes and spheres
    var sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(0, 0.5, 0);

    var boxGeo1 = new THREE.BoxGeometry(1.5, 3, 0.8);
    var boxMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x4488FF,
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.5
    });
    var box1 = new THREE.Mesh(boxGeo1, boxMat);
    box1.position.set(0, 1.5, 0);
    box1.castShadow = true;
    box1.receiveShadow = true;
    sculptureGroup.add(box1);

    var sphereGeo = new THREE.SphereGeometry(0.7, 16, 16);
    var sphereMat = new THREE.MeshStandardMaterial({
      color: 0xEEEEEE,
      emissive: 0x6699FF,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3
    });
    var sphere1 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere1.position.set(-1.2, 3, 0);
    sphere1.castShadow = true;
    sphere1.receiveShadow = true;
    sculptureGroup.add(sphere1);

    var sphere2 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere2.position.set(1.2, 3, 0);
    sphere2.castShadow = true;
    sphere2.receiveShadow = true;
    sculptureGroup.add(sphere2);

    var boxGeo2 = new THREE.BoxGeometry(0.6, 2, 1.2);
    var box2 = new THREE.Mesh(boxGeo2, boxMat);
    box2.position.set(-2, 1, 1);
    box2.rotation.y = Math.PI / 6;
    box2.castShadow = true;
    box2.receiveShadow = true;
    sculptureGroup.add(box2);

    var boxGeo3 = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    var box3 = new THREE.Mesh(boxGeo3, boxMat);
    box3.position.set(2.5, 0.8, -1);
    box3.castShadow = true;
    box3.receiveShadow = true;
    sculptureGroup.add(box3);

    group.add(sculptureGroup);
    return group;
  }

  function createServerRoom() {
    var group = new THREE.Group();

    // Dense rows of server racks
    var rackWidth = 0.5;
    var rackDepth = 1.5;
    var rackHeight = 2;
    var rackSpacing = 0.2;

    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      metalness: 0.8,
      roughness: 0.3
    });

    var rackCount = 0;
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var rackGeometry = new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth);
        var rack = new THREE.Mesh(rackGeometry, rackMaterial);
        rack.position.set(
          -2.5 + (col * (rackWidth + rackSpacing)),
          rackHeight / 2,
          -3 + (row * (rackDepth + rackSpacing))
        );
        rack.castShadow = true;
        rack.receiveShadow = true;
        group.add(rack);

        // Add blinking lights on each rack
        for (var i = 0; i < 3; i++) {
          var lightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
          var lightMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.8
          });
          var light = new THREE.Mesh(lightGeometry, lightMaterial);
          light.position.set(
            -2.5 + (col * (rackWidth + rackSpacing)) - 0.15,
            rackHeight * 0.3 + (i * 0.4),
            -3 + (row * (rackDepth + rackSpacing))
          );
          group.add(light);

          serverLights.push({
            mesh: light,
            blinkPhase: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 3
          });
        }

        rackCount++;
      }
    }

    return group;
  }

  function createLobbyReception() {
    var group = new THREE.Group();

    // Floor tiles
    var tileGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    var tileMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDDDDD,
      roughness: 0.7
    });

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 5; j++) {
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(-1.5 + (i * 0.7), 0.05, -1.2 + (j * 0.7));
        tile.receiveShadow = true;
        group.add(tile);
      }
    }

    // Curved reception desk - made with box segments arranged in arc
    var deskBoxGeo = new THREE.BoxGeometry(0.5, 1.2, 0.4);
    var deskMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.5,
      roughness: 0.5
    });

    for (var k = 0; k < 5; k++) {
      var angle = (k / 4) * Math.PI;
      var deskBox = new THREE.Mesh(deskBoxGeo, deskMaterial);
      deskBox.position.set(
        Math.cos(angle) * 1.5,
        0.6,
        Math.sin(angle) * 1.5
      );
      deskBox.rotation.y = angle;
      deskBox.castShadow = true;
      deskBox.receiveShadow = true;
      group.add(deskBox);
    }

    // Reception top counter
    var counterGeo = new THREE.BoxGeometry(3.5, 0.15, 0.8);
    var counterMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4
    });
    var counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 1.15, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    return group;
  }

  function createSecurityDrone() {
    var group = new THREE.Group();

    // Main body - small box
    var bodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      metalness: 0.7,
      roughness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Four rotors - cylinders
    var rotorGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8);
    var rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });

    var rotorPositions = [
      [-0.15, 0.15, -0.15],
      [0.15, 0.15, -0.15],
      [-0.15, 0.15, 0.15],
      [0.15, 0.15, 0.15]
    ];

    var rotors = [];
    rotorPositions.forEach(function(pos) {
      var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      rotor.position.set(pos[0], pos[1], pos[2]);
      rotor.rotation.x = Math.PI / 2;
      rotor.castShadow = true;
      rotor.receiveShadow = true;
      group.add(rotor);
      rotors.push(rotor);
    });

    // Camera lens - small emissive sphere
    var lensGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    var lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099FF,
      emissive: 0x0099FF,
      emissiveIntensity: 0.7
    });
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(0, -0.15, 0.25);
    group.add(lens);

    group.droneData = {
      position: new THREE.Vector3(10, 3, 10),
      waypoints: [
        new THREE.Vector3(10, 3, 10),
        new THREE.Vector3(-10, 3, 10),
        new THREE.Vector3(-10, 3, -10),
        new THREE.Vector3(10, 3, -10)
      ],
      currentWaypoint: 0,
      speed: 0.03,
      rotorSpeed: 0,
      rotors: rotors
    };

    group.position.copy(group.droneData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    return group;
  }

  function createBikeRacks() {
    var group = new THREE.Group();

    // Bike racks - frames made from cylinders
    var frameGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.4
    });

    for (var i = 0; i < 3; i++) {
      // Vertical post
      var post = new THREE.Mesh(frameGeometry, frameMaterial);
      post.position.set(-8 + (i * 2), 0.6, 8);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);

      // Horizontal bar
      var barGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6);
      var bar = new THREE.Mesh(barGeometry, frameMaterial);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(-8 + (i * 2), 1, 8);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);
    }

    return group;
  }

  function createSolarPanelArrays() {
    var group = new THREE.Group();

    // Solar panels - flat angled boxes on rooftop
    var panelGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0044AA,
      emissive: 0x002288,
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.4
    });

    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(
          -5 + (i * 2),
          13,
          -4 + (j * 2)
        );
        panel.rotation.x = Math.PI / 6; // 30 degree tilt
        panel.castShadow = true;
        panel.receiveShadow = true;
        group.add(panel);
      }
    }

    return group;
  }

  function createCampusFountain() {
    var group = new THREE.Group();

    // Base platform
    var baseGeometry = new THREE.BoxGeometry(3, 0.3, 3);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.8
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Central cylinder column
    var columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      metalness: 0.7,
      roughness: 0.3
    });
    var column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.y = 0.75;
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);

    // Water sphere at top
    var waterGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4499FF,
      emissive: 0x2277FF,
      emissiveIntensity: 0.4,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7
    });
    var waterSphere = new THREE.Mesh(waterGeometry, waterMaterial);
    waterSphere.position.y = 1.8;
    group.add(waterSphere);

    // Water arcs - cylinder curves for flowing water effect
    var arcGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6);
    var arcMaterial = new THREE.MeshStandardMaterial({
      color: 0x3388FF,
      emissive: 0x1166DD,
      emissiveIntensity: 0.5
    });

    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var arc = new THREE.Mesh(arcGeometry, arcMaterial);
      arc.position.set(
        Math.cos(angle) * 0.8,
        1.2,
        Math.sin(angle) * 0.8
      );
      arc.rotation.z = angle + Math.PI / 4;
      group.add(arc);
    }

    group.fountainData = { waterPhase: 0 };
    return group;
  }

  function createCorporateAgent() {
    var group = new THREE.Group();

    // Body - sleek box figure in black turtleneck
    var bodyGeometry = new THREE.BoxGeometry(0.4, 1, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      roughness: 0.9,
      metalness: 0.1
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head - small sphere
    var headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.7
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Legs - two small boxes
    var legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
    var legMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      roughness: 0.8
    });

    var leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-0.1, 0.25, 0);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    group.add(leg1);

    var leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(0.1, 0.25, 0);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    group.add(leg2);

    group.enemyData = {
      position: new THREE.Vector3(Math.random() * 15 - 7.5, 0, Math.random() * 15 - 7.5),
      speed: 0.015 + Math.random() * 0.01,
      health: 100,
      patrolZ: Math.random() * 20 - 10
    };
    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    return group;
  }

  function createPMCGuard() {
    var group = new THREE.Group();

    // Larger body than agent
    var bodyGeometry = new THREE.BoxGeometry(0.45, 1.1, 0.35);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head
    var headGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x996633,
      roughness: 0.8
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.15;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Tactical vest - darker box on body
    var vestGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.4);
    var vestMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    });
    var vest = new THREE.Mesh(vestGeometry, vestMaterial);
    vest.position.set(0, 0.5, 0.05);
    group.add(vest);

    // Weapon - cylinder extending from body
    var weaponGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
    var weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.5
    });
    var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.rotation.z = Math.PI / 2;
    weapon.position.set(0.25, 0.7, 0);
    weapon.castShadow = true;
    weapon.receiveShadow = true;
    group.add(weapon);

    group.enemyData = {
      position: new THREE.Vector3(Math.random() * 18 - 9, 0, Math.random() * 18 - 9),
      speed: 0.01 + Math.random() * 0.008,
      health: 150,
      patrolX: Math.random() * 25 - 12.5
    };
    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    return group;
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'tech-campus-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00DDFF; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 20, 40, 0.8); padding: 12px; ' +
                                  'border: 2px solid #00DDFF; z-index: 100; ' +
                                  'text-shadow: 0 0 5px #00DDFF; letter-spacing: 2px;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'TECH CAMPUS INFILTRATION\n' +
                  '━━━━━━━━━━━━━━━━━━━━━━━\n' +
                  'AI RESEARCH CORES: ' + gameState.researchCores + '/' + gameState.maxCores + '\n' +
                  'AGENTS DOWN: ' + gameState.agentsDown + '\n' +
                  'SECURITY DRONES ACTIVE: ' + gameState.dronesActive + '\n' +
                  'SCORE: ' + gameState.score;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 't') {
        lastTKeyTime = now;
      }

      if (event.key.toLowerCase() === 'c') {
        if (now - lastTKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ACTIVE' : 'HUD: DISABLED';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00DDFF; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 20, 40, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 3px solid #00DDFF; pointer-events: none; ' +
                                'text-shadow: 0 0 10px #00DDFF;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 800);
        }
        lastCKeyTime = now;
      }
    });
  }

  function updateDronePatrol(delta) {
    drones.forEach(function(drone) {
      var data = drone.droneData;

      // Move toward current waypoint
      var target = data.waypoints[data.currentWaypoint];
      var direction = new THREE.Vector3().subVectors(target, data.position).normalize();

      data.position.add(direction.multiplyScalar(data.speed));

      // Check if reached waypoint
      if (data.position.distanceTo(target) < 0.5) {
        data.currentWaypoint = (data.currentWaypoint + 1) % data.waypoints.length;
      }

      drone.position.copy(data.position);

      // Rotate rotors
      data.rotorSpeed += 0.3;
      data.rotors.forEach(function(rotor) {
        rotor.rotation.x += data.rotorSpeed * 0.01;
      });
    });
  }

  function updateServerLights(delta) {
    serverLights.forEach(function(light) {
      light.blinkPhase += delta * light.speed;
      var intensity = Math.sin(light.blinkPhase) * 0.5 + 0.5;
      light.mesh.material.emissiveIntensity = intensity * 0.8;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;

      // Simple patrol behavior
      if (data.patrolZ !== undefined) {
        data.position.z += data.speed;
        if (data.position.z > 10) {
          data.position.z = -10;
        }
      }

      if (data.patrolX !== undefined) {
        data.position.x += data.speed;
        if (data.position.x > 12.5) {
          data.position.x = -12.5;
        }
      }

      enemy.position.copy(data.position);
    });
  }

  function updateFountain(delta) {
    if (!fountainGroup) return;

    var data = fountainGroup.fountainData;
    data.waterPhase += delta;

    fountainGroup.children.forEach(function(child) {
      if (child.geometry instanceof THREE.SphereGeometry) {
        // Pulsate water sphere
        var scale = 1 + Math.sin(data.waterPhase * 2) * 0.2;
        child.scale.set(scale, scale, scale);
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene - corporate tech colors
    scene.background = new THREE.Color(0xF0F4F8);
    scene.fog = new THREE.FogExp2(0xE0E8F0, 0.08);

    // Lighting - bright modern corporate space
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    directionalLight.position.set(15, 15, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Campus ground with plaza
    var plaza = createCampusPlaza();
    plaza.position.set(0, 0, 0);
    scene.add(plaza);
    sceneObjects.push(plaza);

    // Office building 1
    var building1 = createGlassOfficeBuilding();
    building1.position.set(-12, 0, -12);
    scene.add(building1);
    sceneObjects.push(building1);

    // Office building 2
    var building2 = createGlassOfficeBuilding();
    building2.position.set(12, 0, -12);
    scene.add(building2);
    sceneObjects.push(building2);

    // Server room
    var serverRoom = createServerRoom();
    serverRoom.position.set(0, 0, 10);
    scene.add(serverRoom);
    sceneObjects.push(serverRoom);

    // Lobby reception
    var lobby = createLobbyReception();
    lobby.position.set(-8, 0, -3);
    scene.add(lobby);
    sceneObjects.push(lobby);

    // Bike racks
    var bikeRacks = createBikeRacks();
    bikeRacks.position.set(8, 0, 8);
    scene.add(bikeRacks);
    sceneObjects.push(bikeRacks);

    // Solar panels on building rooftops
    var solarPanels = createSolarPanelArrays();
    solarPanels.position.set(-12, 0, -12);
    scene.add(solarPanels);
    sceneObjects.push(solarPanels);

    // Campus fountain
    fountainGroup = createCampusFountain();
    fountainGroup.position.set(0, 0, -8);
    scene.add(fountainGroup);
    sceneObjects.push(fountainGroup);

    // Security drones
    for (var i = 0; i < 3; i++) {
      var drone = createSecurityDrone();
      drone.position.set(
        -10 + (i * 10),
        3,
        -10 + (i * 10)
      );
      drone.droneData.position = drone.position.clone();
      scene.add(drone);
      sceneObjects.push(drone);
      drones.push(drone);
    }

    // Enemy agents - corporate spies
    for (var j = 0; j < 3; j++) {
      var agent = createCorporateAgent();
      agent.position.set(
        Math.random() * 12 - 6,
        0,
        Math.random() * 12 - 6
      );
      agent.enemyData.position = agent.position.clone();
      scene.add(agent);
      sceneObjects.push(agent);
      enemies.push(agent);
    }

    // PMC guards
    for (var k = 0; k < 2; k++) {
      var guard = createPMCGuard();
      guard.position.set(
        Math.random() * 15 - 7.5,
        0,
        Math.random() * 15 - 7.5
      );
      guard.enemyData.position = guard.position.clone();
      scene.add(guard);
      sceneObjects.push(guard);
      enemies.push(guard);
    }

    // Setup HUD and controls
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateDronePatrol(delta);
    updateServerLights(delta);
    updateEnemies(delta);
    updateFountain(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      if (scene) {
        scene.remove(obj);
      }

      // Recursively dispose geometries and materials
      function disposeNode(node) {
        if (node.geometry) {
          node.geometry.dispose();
        }
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(function(mat) { mat.dispose(); });
          } else {
            node.material.dispose();
          }
        }
        if (node.children) {
          node.children.forEach(function(child) { disposeNode(child); });
        }
      }

      disposeNode(obj);
    });

    // Remove lights
    lights.forEach(function(light) {
      if (scene) {
        scene.remove(light);
      }
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    drones = [];
    serverLights = [];
    lights = [];
    fountainGroup = null;
    gameState.researchCores = 0;
    gameState.agentsDown = 0;
    gameState.dronesActive = 3;
    gameState.score = 0;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
