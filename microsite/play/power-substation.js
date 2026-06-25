window.PowerSubstation = (function() {
  'use strict';

  // Private state
  var scene = null;
  var camera = null;
  var allObjects = [];
  var lastPKeyTime = 0;
  var hudVisible = true;
  var sabotageCount = 0;
  var blackoutRisk = 12;
  var gridSecure = true;
  var animationTime = 0;

  // Initialize the power substation module
  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    allObjects = [];
    sabotageCount = 0;
    blackoutRisk = 12;
    gridSecure = true;
    animationTime = 0;

    // Set up fog for industrial atmosphere
    scene.fog = new THREE.Fog(0x444444, 300, 800);
    scene.background = new THREE.Color(0x333333);

    // Build all substation elements
    buildPowerTransformers();
    buildHighVoltageSwitchYard();
    buildCircuitBreakerArrays();
    buildTransmissionTowers();
    buildPowerCableSpans();
    buildControlBuilding();
    buildPerimeterFence();
    buildLightningArrestors();
    buildCapacitorBank();
    buildBusBarStructures();
    buildRelayProtectionPanels();
    buildEmergencyDiesel();
    buildOilContainmentBerm();
    buildCoolingRadiators();
    buildSecurityCameraPoles();

    // Add basic ground plane
    var groundGeometry = new THREE.BoxGeometry(400, 1, 400);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);
    allObjects.push(ground);

    // Set up ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light with shadows
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 150, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Keybinding for P+S toggle
    document.addEventListener('keydown', handleKeyDown);

    createHUD();
  };

  var buildPowerTransformers = function() {
    // Create large power transformers with cooling fins and insulators
    var positions = [
      { x: -80, z: -60 },
      { x: 80, z: -60 },
      { x: -80, z: 60 },
      { x: 80, z: 60 }
    ];

    positions.forEach(function(pos) {
      // Main transformer body (large box)
      var bodyGeometry = new THREE.BoxGeometry(35, 50, 35);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.6,
        roughness: 0.4
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 25, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      allObjects.push(body);

      // Cooling fins (cylinders)
      for (var i = 0; i < 4; i++) {
        var finGeometry = new THREE.CylinderGeometry(4, 4, 45, 8);
        var finMaterial = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.5,
          roughness: 0.5
        });
        var fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(pos.x - 12 + i * 8, 25, pos.z);
        fin.rotation.z = Math.PI / 2;
        fin.castShadow = true;
        scene.add(fin);
        allObjects.push(fin);
      }

      // Bushing insulators on top (cylinders)
      for (var j = 0; j < 3; j++) {
        var bushingGeometry = new THREE.CylinderGeometry(3, 3, 15, 8);
        var bushingMaterial = new THREE.MeshStandardMaterial({
          color: 0xddaa00,
          metalness: 0.3,
          roughness: 0.6
        });
        var bushing = new THREE.Mesh(bushingGeometry, bushingMaterial);
        bushing.position.set(pos.x - 10 + j * 10, 60, pos.z);
        bushing.castShadow = true;
        scene.add(bushing);
        allObjects.push(bushing);
      }

      // Store reference for animation
      body.isTransformer = true;
    });
  };

  var buildHighVoltageSwitchYard = function() {
    // Flat box ground area for switch yard
    var yardGeometry = new THREE.BoxGeometry(200, 2, 150);
    var yardMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.4
    });
    var yard = new THREE.Mesh(yardGeometry, yardMaterial);
    yard.position.set(0, -5, 0);
    yard.receiveShadow = true;
    scene.add(yard);
    allObjects.push(yard);
  };

  var buildCircuitBreakerArrays = function() {
    // Box frames with cylinder breakers
    var positions = [
      { x: -60, z: 80 },
      { x: 60, z: 80 }
    ];

    positions.forEach(function(pos) {
      // Main frame box
      var frameGeometry = new THREE.BoxGeometry(30, 40, 20);
      var frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x777777,
        metalness: 0.7
      });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, 20, pos.z);
      frame.castShadow = true;
      scene.add(frame);
      allObjects.push(frame);

      // Cylinder breakers
      for (var i = 0; i < 6; i++) {
        var breakerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
        var breakerMaterial = new THREE.MeshStandardMaterial({
          color: 0x1111ff,
          metalness: 0.6,
          emissive: 0x0000aa,
          emissiveIntensity: 0.3
        });
        var breaker = new THREE.Mesh(breakerGeometry, breakerMaterial);
        breaker.position.set(
          pos.x - 10 + (i % 3) * 10,
          25 + Math.floor(i / 3) * 12,
          pos.z
        );
        breaker.castShadow = true;
        scene.add(breaker);
        allObjects.push(breaker);
      }
    });
  };

  var buildTransmissionTowers = function() {
    // Tall LineSegments framework towers
    var positions = [
      { x: -150, z: -150 },
      { x: 150, z: -150 },
      { x: -150, z: 150 },
      { x: 150, z: 150 }
    ];

    positions.forEach(function(pos) {
      var points = [];
      var height = 120;

      // Create lattice tower structure
      points.push(new THREE.Vector3(pos.x - 8, 0, pos.z - 8));
      points.push(new THREE.Vector3(pos.x - 8, height, pos.z - 8));
      points.push(new THREE.Vector3(pos.x + 8, 0, pos.z - 8));
      points.push(new THREE.Vector3(pos.x + 8, height, pos.z - 8));
      points.push(new THREE.Vector3(pos.x + 8, 0, pos.z + 8));
      points.push(new THREE.Vector3(pos.x + 8, height, pos.z + 8));
      points.push(new THREE.Vector3(pos.x - 8, 0, pos.z + 8));
      points.push(new THREE.Vector3(pos.x - 8, height, pos.z + 8));

      // Add cross braces
      var diagonalLines = [
        [0, 3], [2, 1], [4, 7], [6, 5],
        [0, 5], [2, 7], [4, 1], [6, 3]
      ];

      var geometry = new THREE.BufferGeometry();
      var positions = [];

      diagonalLines.forEach(function(line) {
        positions.push(points[line[0]].x, points[line[0]].y, points[line[0]].z);
        positions.push(points[line[1]].x, points[line[1]].y, points[line[1]].z);
      });

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

      var material = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
      var tower = new THREE.LineSegments(geometry, material);
      scene.add(tower);
      allObjects.push(tower);
    });
  };

  var buildPowerCableSpans = function() {
    // LineSegments between towers for cables
    var startPos = { x: -150, z: -150 };
    var endPos = { x: 150, z: -150 };

    var saggingAmount = 20;
    var segments = 10;

    var points = [];
    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var x = startPos.x + (endPos.x - startPos.x) * t;
      var z = startPos.z;
      var y = 100 + Math.sin(t * Math.PI) * saggingAmount;
      points.push(new THREE.Vector3(x, y, z));
    }

    for (var j = 1; j <= 3; j++) {
      var geometry = new THREE.BufferGeometry();
      var posArray = [];

      points.forEach(function(p, idx) {
        if (idx < points.length - 1) {
          posArray.push(p.x, p.y + j * 3, p.z);
          posArray.push(points[idx + 1].x, points[idx + 1].y + j * 3, points[idx + 1].z);
        }
      });

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArray), 3));
      var material = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1.5 });
      var cable = new THREE.LineSegments(geometry, material);
      cable.isCable = true;
      cable.cableOffset = j * 3;
      scene.add(cable);
      allObjects.push(cable);
    }
  };

  var buildControlBuilding = function() {
    // Box building with large window panels
    var buildingGeometry = new THREE.BoxGeometry(50, 35, 40);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.3
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-120, 17.5, 0);
    building.castShadow = true;
    scene.add(building);
    allObjects.push(building);

    // Large window panels
    var windowGeometry = new THREE.BoxGeometry(15, 10, 1);
    for (var i = 0; i < 4; i++) {
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x0099ff,
        metalness: 0.9,
        emissive: 0x0066ff,
        emissiveIntensity: 0.5
      });
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        -120,
        15 + (i % 2) * 12,
        20 + (i >= 2 ? 1 : -1)
      );
      window.isControlWindow = true;
      scene.add(window);
      allObjects.push(window);
    }
  };

  var buildPerimeterFence = function() {
    // LineSegments with cylinder posts and razor wire boxes
    var fencePositions = [
      { start: { x: -200, z: -200 }, end: { x: 200, z: -200 } },
      { start: { x: 200, z: -200 }, end: { x: 200, z: 200 } },
      { start: { x: 200, z: 200 }, end: { x: -200, z: 200 } },
      { start: { x: -200, z: 200 }, end: { x: -200, z: -200 } }
    ];

    fencePositions.forEach(function(fence) {
      var start = fence.start;
      var end = fence.end;
      var distance = Math.hypot(end.x - start.x, end.z - start.z);
      var postCount = Math.floor(distance / 40) + 1;

      for (var i = 0; i <= postCount; i++) {
        var t = postCount > 0 ? i / postCount : 0;
        var x = start.x + (end.x - start.x) * t;
        var z = start.z + (end.z - start.z) * t;

        // Cylinder post
        var postGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
        var postMaterial = new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.7
        });
        var post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, 7.5, z);
        post.castShadow = true;
        scene.add(post);
        allObjects.push(post);

        // Razor wire box on top
        var razorGeometry = new THREE.BoxGeometry(4, 2, 4);
        var razorMaterial = new THREE.MeshStandardMaterial({
          color: 0xcc0000,
          metalness: 0.8,
          emissive: 0x660000,
          emissiveIntensity: 0.2
        });
        var razor = new THREE.Mesh(razorGeometry, razorMaterial);
        razor.position.set(x, 16, z);
        razor.castShadow = true;
        scene.add(razor);
        allObjects.push(razor);
      }

      // Fence line (LineSegments)
      var fenceGeometry = new THREE.BufferGeometry();
      var fencePoints = [];
      for (var j = 0; j <= postCount; j++) {
        var t = postCount > 0 ? j / postCount : 0;
        var px = start.x + (end.x - start.x) * t;
        var pz = start.z + (end.z - start.z) * t;
        fencePoints.push(px, 8, pz);
        if (j < postCount) {
          fencePoints.push(px, 8, pz);
        }
      }
      fenceGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints), 3));
      var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
      var fenceLine = new THREE.LineSegments(fenceGeometry, fenceMaterial);
      scene.add(fenceLine);
      allObjects.push(fenceLine);
    });
  };

  var buildLightningArrestors = function() {
    // Tall thin cylinders with glow at tips
    var positions = [
      { x: -40, z: -90 },
      { x: 40, z: -90 },
      { x: -40, z: 90 },
      { x: 40, z: 90 }
    ];

    positions.forEach(function(pos) {
      var baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 30, 6);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.6
      });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 15, pos.z);
      base.castShadow = true;
      scene.add(base);
      allObjects.push(base);

      // Glowing tip
      var tipGeometry = new THREE.SphereGeometry(2, 8, 8);
      var tipMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        metalness: 0.3,
        emissive: 0x0099ff,
        emissiveIntensity: 0.6
      });
      var tip = new THREE.Mesh(tipGeometry, tipMaterial);
      tip.position.set(pos.x, 35, pos.z);
      tip.isArrestor = true;
      scene.add(tip);
      allObjects.push(tip);
    });
  };

  var buildCapacitorBank = function() {
    // Box frames with cylinder capacitors in rows
    var positions = [
      { x: -70, z: -30 },
      { x: 70, z: -30 }
    ];

    positions.forEach(function(pos) {
      for (var row = 0; row < 2; row++) {
        var frameGeometry = new THREE.BoxGeometry(25, 30, 15);
        var frameMaterial = new THREE.MeshStandardMaterial({
          color: 0x888888,
          metalness: 0.5
        });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(pos.x, 15 + row * 35, pos.z);
        frame.castShadow = true;
        scene.add(frame);
        allObjects.push(frame);

        // Cylinders as capacitors
        for (var i = 0; i < 4; i++) {
          var capGeometry = new THREE.CylinderGeometry(2.5, 2.5, 15, 8);
          var capMaterial = new THREE.MeshStandardMaterial({
            color: 0x00aa00,
            metalness: 0.4,
            emissive: 0x005500,
            emissiveIntensity: 0.3
          });
          var cap = new THREE.Mesh(capGeometry, capMaterial);
          cap.position.set(
            pos.x - 7 + i * 5,
            20 + row * 35,
            pos.z
          );
          cap.castShadow = true;
          scene.add(cap);
          allObjects.push(cap);
        }
      }
    });
  };

  var buildBusBarStructures = function() {
    // Box + LineSegments connections
    var positions = [
      { x: -30, z: 30 },
      { x: 30, z: 30 }
    ];

    positions.forEach(function(pos) {
      var boxGeometry = new THREE.BoxGeometry(15, 3, 25);
      var boxMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.8
      });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos.x, 5, pos.z);
      box.castShadow = true;
      scene.add(box);
      allObjects.push(box);

      // Connection lines
      var connGeometry = new THREE.BufferGeometry();
      var connPoints = [
        pos.x, 5, pos.z - 10,
        pos.x, 5, pos.z + 10,
        pos.x - 7, 5, pos.z - 10,
        pos.x + 7, 5, pos.z - 10,
        pos.x - 7, 5, pos.z + 10,
        pos.x + 7, 5, pos.z + 10
      ];
      connGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connPoints), 3));
      var connMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 });
      var connections = new THREE.LineSegments(connGeometry, connMaterial);
      scene.add(connections);
      allObjects.push(connections);
    });
  };

  var buildRelayProtectionPanels = function() {
    // Box cabinets
    var positions = [
      { x: -100, z: 30 },
      { x: -60, z: 30 },
      { x: 60, z: 30 },
      { x: 100, z: 30 }
    ];

    positions.forEach(function(pos) {
      var panelGeometry = new THREE.BoxGeometry(15, 25, 10);
      var panelMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.6
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, 12.5, pos.z);
      panel.castShadow = true;
      scene.add(panel);
      allObjects.push(panel);

      // Status lights on panel
      for (var i = 0; i < 6; i++) {
        var lightGeometry = new THREE.SphereGeometry(1, 8, 8);
        var lightMaterial = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          metalness: 0.3,
          emissive: 0x990000,
          emissiveIntensity: 0.4
        });
        var light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(
          pos.x - 5 + (i % 3) * 5,
          15 + Math.floor(i / 3) * 5,
          pos.z + 5
        );
        light.isStatusLight = true;
        scene.add(light);
        allObjects.push(light);
      }
    });
  };

  var buildEmergencyDiesel = function() {
    // Box building
    var dieselGeometry = new THREE.BoxGeometry(40, 25, 30);
    var dieselMaterial = new THREE.MeshStandardMaterial({
      color: 0x666633,
      metalness: 0.4
    });
    var diesel = new THREE.Mesh(dieselGeometry, dieselMaterial);
    diesel.position.set(120, 12.5, 0);
    diesel.castShadow = true;
    diesel.isDiesel = true;
    scene.add(diesel);
    allObjects.push(diesel);
  };

  var buildOilContainmentBerm = function() {
    // Box border around transformers
    var bermGeometry = new THREE.BoxGeometry(180, 1, 180);
    var bermMaterial = new THREE.MeshStandardMaterial({
      color: 0x663300,
      metalness: 0.2
    });
    var berm = new THREE.Mesh(bermGeometry, bermMaterial);
    berm.position.set(0, -8, 0);
    berm.receiveShadow = true;
    scene.add(berm);
    allObjects.push(berm);
  };

  var buildCoolingRadiators = function() {
    // Flat box radiators
    var positions = [
      { x: -50, z: -50 },
      { x: 50, z: -50 },
      { x: -50, z: 50 },
      { x: 50, z: 50 }
    ];

    positions.forEach(function(pos) {
      var radiatorGeometry = new THREE.BoxGeometry(20, 2, 30);
      var radiatorMaterial = new THREE.MeshStandardMaterial({
        color: 0x999999,
        metalness: 0.6
      });
      var radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial);
      radiator.position.set(pos.x, 1, pos.z);
      radiator.castShadow = true;
      scene.add(radiator);
      allObjects.push(radiator);

      // Cooling fins (small cylinders)
      for (var i = 0; i < 3; i++) {
        var finGeometry = new THREE.CylinderGeometry(1.5, 1.5, 28, 6);
        var finMaterial = new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.5
        });
        var fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.set(pos.x - 5 + i * 5, 1, pos.z);
        fin.rotation.z = Math.PI / 2;
        fin.castShadow = true;
        scene.add(fin);
        allObjects.push(fin);
      }
    });
  };

  var buildSecurityCameraPoles = function() {
    // Cylinder + box camera
    var positions = [
      { x: -180, z: -180 },
      { x: 180, z: -180 },
      { x: -180, z: 180 },
      { x: 180, z: 180 }
    ];

    positions.forEach(function(pos) {
      var poleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7
      });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos.x, 12.5, pos.z);
      pole.castShadow = true;
      scene.add(pole);
      allObjects.push(pole);

      // Camera box
      var cameraGeometry = new THREE.BoxGeometry(4, 3, 6);
      var cameraMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.8
      });
      var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
      camera.position.set(pos.x, 26, pos.z);
      camera.castShadow = true;
      camera.isCamera = true;
      scene.add(camera);
      allObjects.push(camera);

      // Camera lens
      var lensGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      var lensMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066cc,
        metalness: 0.9,
        emissive: 0x003399,
        emissiveIntensity: 0.4
      });
      var lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.position.set(pos.x, 26, pos.z + 3.5);
      scene.add(lens);
      allObjects.push(lens);
    });
  };

  var handleKeyDown = function(event) {
    if (event.key === 'p' || event.key === 'P') {
      var now = Date.now();
      if (now - lastPKeyTime < 400) {
        // P pressed twice within 400ms, check for S
        document.addEventListener('keydown', handleSKeyAfterP);
        lastPKeyTime = 0;
      } else {
        lastPKeyTime = now;
      }
    }
  };

  var handleSKeyAfterP = function(event) {
    if (event.key === 's' || event.key === 'S') {
      hudVisible = !hudVisible;
      updateHUDVisibility();
      document.removeEventListener('keydown', handleSKeyAfterP);
    } else {
      document.removeEventListener('keydown', handleSKeyAfterP);
    }
  };

  var createHUD = function() {
    var hudElement = document.getElementById('power-substation-hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'power-substation-hud';
      hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 14px; z-index: 1000; text-shadow: 0 0 10px #00ff00;';
      document.body.appendChild(hudElement);
    }
  };

  var updateHUDVisibility = function() {
    var hudElement = document.getElementById('power-substation-hud');
    if (hudElement) {
      hudElement.style.display = hudVisible ? 'block' : 'none';
    }
  };

  var updateHUD = function() {
    var hudElement = document.getElementById('power-substation-hud');
    if (hudElement && hudVisible) {
      var gridStatus = gridSecure ? 'YES' : 'CRITICAL';
      var gridColor = gridSecure ? '#00ff00' : '#ff0000';
      hudElement.innerHTML = 'TRANSFORMERS SABOTAGED: ' + sabotageCount + '/4<br>BLACKOUT RISK: ' + blackoutRisk + '%<br><span style="color: ' + gridColor + '">GRID SECURE: ' + gridStatus + '</span>';
    }
  };

  // Update animation state
  var update = function(delta) {
    animationTime += delta;

    // Animate transformers with subtle vibration and emissive pulse
    scene.children.forEach(function(obj) {
      if (obj.isTransformer) {
        obj.position.y += Math.sin(animationTime * 3) * 0.01;
        obj.material.emissiveIntensity = 0.1 + Math.sin(animationTime * 2) * 0.05;
      }
    });

    // Animate lightning arrestor tips with glow
    scene.children.forEach(function(obj) {
      if (obj.isArrestor) {
        obj.material.emissiveIntensity = 0.4 + Math.sin(animationTime * 4) * 0.2;
        obj.scale.set(
          1 + Math.sin(animationTime * 2) * 0.1,
          1 + Math.sin(animationTime * 2) * 0.1,
          1 + Math.sin(animationTime * 2) * 0.1
        );
      }
    });

    // Animate cable sag and sway
    scene.children.forEach(function(obj) {
      if (obj.isCable) {
        obj.position.z += Math.sin(animationTime * 1.5) * 0.5;
      }
    });

    // Animate control building window flicker
    scene.children.forEach(function(obj) {
      if (obj.isControlWindow) {
        obj.material.emissiveIntensity = 0.3 + Math.random() * 0.3;
      }
    });

    // Animate status lights strobe
    scene.children.forEach(function(obj) {
      if (obj.isStatusLight) {
        obj.material.emissiveIntensity = 0.2 + Math.sin(animationTime * 5) * 0.2;
      }
    });

    // Animate diesel generator
    scene.children.forEach(function(obj) {
      if (obj.isDiesel) {
        var intensity = gridSecure ? 0.1 : 0.5 + Math.sin(animationTime * 4) * 0.2;
        obj.material.color.setHex(gridSecure ? 0x666633 : 0x990000);
      }
    });

    // Update HUD
    updateHUD();

    // Simulate cyber-attack progression
    if (animationTime > 5) {
      blackoutRisk = Math.min(100, 12 + sabotageCount * 20);
      if (sabotageCount >= 2) {
        gridSecure = false;
      }
    }
  };

  // Reset the scene
  var reset = function() {
    // Remove all added objects
    allObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    allObjects = [];
    sabotageCount = 0;
    blackoutRisk = 12;
    gridSecure = true;
    animationTime = 0;
    document.removeEventListener('keydown', handleKeyDown);
    var hudElement = document.getElementById('power-substation-hud');
    if (hudElement) {
      hudElement.remove();
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
