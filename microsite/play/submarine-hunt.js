var window = window || {};

window.SubmarineHunt = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var gameState = {
    depth: 500,
    pressure: 120,
    torpedoesLoaded: 4,
    reactorTemp: 180,
    sonarActive: true
  };

  var turbineGroup = null;
  var sonarScreenGroup = null;
  var reactorLightGroup = null;
  var waterGroup = null;
  var periscopeGroup = null;
  var tubeIndicators = [];
  var elapsedTime = 0;

  function createSubmarineHull() {
    // Main pressure hull - elongated cylinder
    var hullGeometry = new THREE.CylinderGeometry(3, 3, 25, 32);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.6,
      roughness: 0.4
    });
    var hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.rotation.z = Math.PI / 2;
    hullMesh.position.set(0, 0, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    scene.add(hullMesh);
    sceneObjects.push(hullMesh);
  }

  function createPressureHullRibs() {
    // Ring frames every 3 units along the hull
    for (var i = -12; i <= 12; i += 3) {
      var ribGeometry = new THREE.TorusGeometry(3.1, 0.2, 16, 32);
      var ribMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.8,
        roughness: 0.2
      });
      var ribMesh = new THREE.Mesh(ribGeometry, ribMaterial);
      ribMesh.rotation.y = Math.PI / 2;
      ribMesh.position.set(i, 0, 0);
      ribMesh.castShadow = true;
      ribMesh.receiveShadow = true;
      scene.add(ribMesh);
      sceneObjects.push(ribMesh);
    }
  }

  function createTorpedoTubes() {
    // 4 horizontal torpedo tubes in bow (front of submarine)
    var tubePositions = [
      [0.8, 1.2, -13],
      [0.8, -1.2, -13],
      [-0.8, 1.2, -13],
      [-0.8, -1.2, -13]
    ];

    tubePositions.forEach(function(pos, idx) {
      var tubeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 4, 16);
      var tubeMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.7,
        roughness: 0.3
      });
      var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tubeMesh.rotation.z = Math.PI / 2;
      tubeMesh.position.set(pos[0], pos[1], pos[2]);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      scene.add(tubeMesh);
      sceneObjects.push(tubeMesh);

      // Tube door caps
      var capGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
      var capMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
      });
      var capMesh = new THREE.Mesh(capGeometry, capMaterial);
      capMesh.rotation.z = Math.PI / 2;
      capMesh.position.set(pos[0], pos[1], pos[2] - 2.1);
      capMesh.castShadow = true;
      capMesh.receiveShadow = true;
      scene.add(capMesh);
      sceneObjects.push(capMesh);

      // Indicator light for each tube
      var indicatorGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var indicatorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.5
      });
      var indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicatorMesh.position.set(pos[0] + 0.8, pos[1], pos[2] - 0.5);
      scene.add(indicatorMesh);
      sceneObjects.push(indicatorMesh);
      tubeIndicators.push({ mesh: indicatorMesh, isLoaded: true });
    });
  }

  function createTorpedoLoadingRack() {
    // Torpedo loading rack with torpedoes
    var rackGeometry = new THREE.BoxGeometry(3.5, 1.5, 1.2);
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0x444455,
      metalness: 0.7,
      roughness: 0.4
    });
    var rackMesh = new THREE.Mesh(rackGeometry, rackMaterial);
    rackMesh.position.set(0, -2.5, -8);
    rackMesh.castShadow = true;
    rackMesh.receiveShadow = true;
    scene.add(rackMesh);
    sceneObjects.push(rackMesh);

    // Torpedoes on rack (4 cylinders)
    var torpedoPositions = [
      [-1, -2, -8],
      [-0.3, -2, -8],
      [0.4, -2, -8],
      [1.1, -2, -8]
    ];

    torpedoPositions.forEach(function(pos) {
      var torpedoGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3.5, 16);
      var torpedoMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
      });
      var torpedoMesh = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
      torpedoMesh.rotation.z = Math.PI / 2;
      torpedoMesh.position.set(pos[0], pos[1], pos[2]);
      torpedoMesh.castShadow = true;
      torpedoMesh.receiveShadow = true;
      scene.add(torpedoMesh);
      sceneObjects.push(torpedoMesh);

      // Torpedo cone nose
      var noseGeometry = new THREE.ConeGeometry(0.25, 0.8, 16);
      var noseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.1
      });
      var noseMesh = new THREE.Mesh(noseGeometry, noseMaterial);
      noseMesh.rotation.z = Math.PI / 2;
      noseMesh.position.set(pos[0] + 1.95, pos[1], pos[2]);
      noseMesh.castShadow = true;
      noseMesh.receiveShadow = true;
      scene.add(noseMesh);
      sceneObjects.push(noseMesh);
    });
  }

  function createEngineTurbine() {
    // Large engine turbine with spinning fan blades
    turbineGroup = new THREE.Group();

    // Main turbine cylinder
    var turbineGeometry = new THREE.CylinderGeometry(1.8, 1.8, 4, 32);
    var turbineMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.3
    });
    var turbineMesh = new THREE.Mesh(turbineGeometry, turbineMaterial);
    turbineMesh.rotation.z = Math.PI / 2;
    turbineMesh.castShadow = true;
    turbineMesh.receiveShadow = true;
    turbineGroup.add(turbineMesh);

    // Fan blades (4 blades using box geometry)
    for (var i = 0; i < 4; i++) {
      var bladeGeometry = new THREE.BoxGeometry(0.3, 2.2, 0.8);
      var bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.8,
        roughness: 0.2
      });
      var bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
      bladeMesh.rotation.x = (i * Math.PI / 2);
      bladeMesh.castShadow = true;
      bladeMesh.receiveShadow = true;
      turbineGroup.add(bladeMesh);
    }

    // Turbine shaft (thin cylinder through center)
    var shaftGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 16);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
    var shaftMesh = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaftMesh.rotation.z = Math.PI / 2;
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    turbineGroup.add(shaftMesh);

    turbineGroup.position.set(0, 0, 6);
    turbineGroup.turbineData = { rotationSpeed: 0.05 };
    scene.add(turbineGroup);
    sceneObjects.push(turbineGroup);
  }

  function createReactorRoom() {
    // Reactor cylinder with warning lights
    var reactorGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 32);
    var reactorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.6,
      roughness: 0.4
    });
    var reactorMesh = new THREE.Mesh(reactorGeometry, reactorMaterial);
    reactorMesh.position.set(0, 2.5, 2);
    reactorMesh.castShadow = true;
    reactorMesh.receiveShadow = true;
    scene.add(reactorMesh);
    sceneObjects.push(reactorMesh);

    // Reactor core (glowing sphere inside)
    var coreGeometry = new THREE.SphereGeometry(0.7, 16, 16);
    var coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: 0x00FF00,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.5
    });
    var coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreMesh.position.set(0, 2.5, 2);
    coreMesh.castShadow = true;
    coreMesh.receiveShadow = true;
    scene.add(coreMesh);
    sceneObjects.push(coreMesh);

    // Warning lights around reactor (3 red lights)
    reactorLightGroup = new THREE.Group();
    var warningPositions = [
      [-1.5, 3, 2],
      [0, 4, 2],
      [1.5, 3, 2]
    ];

    warningPositions.forEach(function(pos) {
      var warningGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var warningMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF4400,
        emissive: 0xFF4400,
        emissiveIntensity: 0.3
      });
      var warningMesh = new THREE.Mesh(warningGeometry, warningMaterial);
      warningMesh.position.set(pos[0], pos[1], pos[2]);
      reactorLightGroup.add(warningMesh);
    });

    scene.add(reactorLightGroup);
    sceneObjects.push(reactorLightGroup);
  }

  function createSonarRoom() {
    // Sonar control room with screens
    var controlBoxGeometry = new THREE.BoxGeometry(4.5, 2, 1.2);
    var controlBoxMaterial = new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.8,
      roughness: 0.3
    });
    var controlBoxMesh = new THREE.Mesh(controlBoxGeometry, controlBoxMaterial);
    controlBoxMesh.position.set(0, 1.5, -4);
    controlBoxMesh.castShadow = true;
    controlBoxMesh.receiveShadow = true;
    scene.add(controlBoxMesh);
    sceneObjects.push(controlBoxMesh);

    // Sonar screens (3 display boxes)
    sonarScreenGroup = new THREE.Group();
    var screenPositions = [
      [-1.3, 1.5, -3.2],
      [0, 1.5, -3.2],
      [1.3, 1.5, -3.2]
    ];

    screenPositions.forEach(function(pos) {
      var screenGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.2);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x00FF88,
        emissiveIntensity: 0.4,
        metalness: 0.5,
        roughness: 0.3
      });
      var screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
      screenMesh.position.set(pos[0], pos[1], pos[2]);
      sonarScreenGroup.add(screenMesh);

      // Screen glow (add a small point light)
      var screenLight = new THREE.PointLight(0x00FF88, 0.8, 5);
      screenLight.position.set(pos[0], pos[1], pos[2] + 0.5);
      sonarScreenGroup.add(screenLight);
    });

    scene.add(sonarScreenGroup);
    sceneObjects.push(sonarScreenGroup);
  }

  function createPeriscope() {
    // Periscope column with optics
    periscopeGroup = new THREE.Group();

    // Main periscope tube (thin cylinder)
    var tubeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
    var tubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
    var tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    periscopeGroup.add(tubeMesh);

    // Periscope head (optics - box at top)
    var headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.9,
      roughness: 0.05
    });
    var headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.set(0, 2.2, 0);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    periscopeGroup.add(headMesh);

    // Eyepiece at bottom
    var eyepieceGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    var eyepieceMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.1
    });
    var eyepieceMesh = new THREE.Mesh(eyepieceGeometry, eyepieceMaterial);
    eyepieceMesh.position.set(0, -2, 0);
    eyepieceMesh.castShadow = true;
    eyepieceMesh.receiveShadow = true;
    periscopeGroup.add(eyepieceMesh);

    periscopeGroup.position.set(-3, 1.5, -1);
    periscopeGroup.periscopeData = { rotationSpeed: 0.01, maxRotation: Math.PI / 6 };
    scene.add(periscopeGroup);
    sceneObjects.push(periscopeGroup);
  }

  function createNavigationChart() {
    // Navigation chart table
    var tableGeometry = new THREE.BoxGeometry(3, 0.8, 2);
    var tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.7
    });
    var tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
    tableMesh.position.set(-4, 0.5, 5);
    tableMesh.castShadow = true;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);
    sceneObjects.push(tableMesh);

    // Chart on table (glowing plane)
    var chartGeometry = new THREE.BoxGeometry(2.8, 0.1, 1.8);
    var chartMaterial = new THREE.MeshStandardMaterial({
      color: 0x003300,
      emissive: 0x00AA00,
      emissiveIntensity: 0.3,
      metalness: 0.3,
      roughness: 0.5
    });
    var chartMesh = new THREE.Mesh(chartGeometry, chartMaterial);
    chartMesh.position.set(-4, 1, 5);
    chartMesh.castShadow = true;
    chartMesh.receiveShadow = true;
    scene.add(chartMesh);
    sceneObjects.push(chartMesh);
  }

  function createElectricalPanel() {
    // Electrical panel with switches
    var panelGeometry = new THREE.BoxGeometry(2.5, 3, 0.4);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.4
    });
    var panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.position.set(4, 1.5, -8);
    panelMesh.castShadow = true;
    panelMesh.receiveShadow = true;
    scene.add(panelMesh);
    sceneObjects.push(panelMesh);

    // Switch indicators (small boxes in grid)
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 4; j++) {
        var switchGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.15);
        var switchColor = (i + j) % 2 === 0 ? 0xFF3300 : 0x33FF00;
        var switchMaterial = new THREE.MeshStandardMaterial({
          color: switchColor,
          emissive: switchColor,
          emissiveIntensity: 0.3,
          metalness: 0.5,
          roughness: 0.3
        });
        var switchMesh = new THREE.Mesh(switchGeometry, switchMaterial);
        switchMesh.position.set(
          4 - 0.8 + (j * 0.55),
          2.5 - (i * 0.7),
          -7.7
        );
        scene.add(switchMesh);
        sceneObjects.push(switchMesh);
      }
    }
  }

  function createLadder() {
    // Ladder between decks (vertical structure with rungs)
    var ladderGeometry = new THREE.BoxGeometry(0.6, 4, 0.2);
    var ladderMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      metalness: 0.8,
      roughness: 0.2
    });

    // Two vertical rails
    var rail1 = new THREE.Mesh(ladderGeometry, ladderMaterial);
    rail1.position.set(3.5, 0, 10);
    rail1.castShadow = true;
    rail1.receiveShadow = true;
    scene.add(rail1);
    sceneObjects.push(rail1);

    var rail2 = new THREE.Mesh(ladderGeometry, ladderMaterial);
    rail2.position.set(4.3, 0, 10);
    rail2.castShadow = true;
    rail2.receiveShadow = true;
    scene.add(rail2);
    sceneObjects.push(rail2);

    // Rungs (horizontal bars)
    var rungGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 16);
    var rungMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });

    for (var i = 0; i < 6; i++) {
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(3.9, 1.8 - (i * 0.8), 10);
      rung.castShadow = true;
      rung.receiveShadow = true;
      scene.add(rung);
      sceneObjects.push(rung);
    }
  }

  function createEscapePod() {
    // Escape pod (sphere)
    var podGeometry = new THREE.SphereGeometry(0.9, 16, 16);
    var podMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFCC00,
      metalness: 0.7,
      roughness: 0.3
    });
    var podMesh = new THREE.Mesh(podGeometry, podMaterial);
    podMesh.position.set(-4.5, 2, 8);
    podMesh.castShadow = true;
    podMesh.receiveShadow = true;
    scene.add(podMesh);
    sceneObjects.push(podMesh);

    // Pod hatch ring
    var hatchGeometry = new THREE.TorusGeometry(0.95, 0.15, 16, 32);
    var hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFDD00,
      metalness: 0.8,
      roughness: 0.2
    });
    var hatchMesh = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatchMesh.rotation.x = Math.PI / 4;
    hatchMesh.position.set(-4.5, 2, 8);
    hatchMesh.castShadow = true;
    hatchMesh.receiveShadow = true;
    scene.add(hatchMesh);
    sceneObjects.push(hatchMesh);
  }

  function createFloodedSection() {
    // Flooded section with blue water plane
    waterGroup = new THREE.Group();

    var waterGeometry = new THREE.BoxGeometry(8, 1.5, 8);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488AA,
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.4
    });
    var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.set(0, -2.5, 12);
    waterMesh.castShadow = true;
    waterMesh.receiveShadow = true;
    waterGroup.add(waterMesh);

    // Water surface ripples (using multiple offset planes)
    var rippleGeometry = new THREE.BoxGeometry(8, 0.1, 8);
    var rippleMaterial = new THREE.MeshStandardMaterial({
      color: 0x66AADD,
      metalness: 0.4,
      roughness: 0.5,
      transparent: true,
      opacity: 0.3
    });
    var rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
    rippleMesh.position.set(0, -1.5, 12);
    waterGroup.add(rippleMesh);

    waterGroup.waterData = { slosheSpeed: 0.02, scale: 1.0 };
    scene.add(waterGroup);
    sceneObjects.push(waterGroup);
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    elapsedTime = 0;

    // Create all submarine components (20+ objects as required)
    createSubmarineHull();          // 1
    createPressureHullRibs();       // 8 ribs (sections)
    createTorpedoTubes();           // 4 tubes + caps + indicators = 12 objects
    createTorpedoLoadingRack();     // 1 rack + 4 torpedoes + 4 nose cones = 9 objects
    createEngineTurbine();          // 1 group with turbine + blades + shaft
    createReactorRoom();            // 1 reactor + 1 core + 1 light group
    createSonarRoom();              // 1 control box + 1 screen group with 3 screens + lights
    createPeriscope();              // 1 periscope group
    createNavigationChart();        // 1 table + 1 chart = 2 objects
    createElectricalPanel();        // 1 panel + 12 switches = 13 objects
    createLadder();                 // 2 rails + 6 rungs = 8 objects
    createEscapePod();              // 1 pod + 1 hatch = 2 objects
    createFloodedSection();         // 1 water group with 2 meshes

    return {
      depth: gameState.depth,
      pressure: gameState.pressure,
      torpedoesLoaded: gameState.torpedoesLoaded,
      reactorTemp: gameState.reactorTemp,
      sonarActive: gameState.sonarActive
    };
  }

  function update(delta) {
    if (!scene) return;

    elapsedTime += delta;

    // Turbine spinning
    if (turbineGroup) {
      turbineGroup.children.forEach(function(child, idx) {
        if (idx > 0 && idx < 5) {
          // Fan blades (skip first which is cylinder, and last which is shaft)
          child.rotation.y += turbineGroup.turbineData.rotationSpeed;
        }
      });
      // Rotate the shaft as well
      turbineGroup.rotation.y += turbineGroup.turbineData.rotationSpeed * 0.1;
    }

    // Sonar pings - pulse effect on screens
    if (sonarScreenGroup) {
      var pingIntensity = 0.3 + 0.3 * Math.sin(elapsedTime * 2);
      sonarScreenGroup.children.forEach(function(child) {
        if (child.isMesh && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = pingIntensity;
        } else if (child.isLight) {
          child.intensity = 0.8 + 0.4 * Math.sin(elapsedTime * 2);
        }
      });
    }

    // Reactor warning light blinking
    if (reactorLightGroup) {
      var blinkFactor = Math.sin(elapsedTime * 3) > 0 ? 1 : 0.2;
      reactorLightGroup.children.forEach(function(child) {
        if (child.material) {
          child.material.emissiveIntensity = 0.3 * blinkFactor;
        }
      });
    }

    // Torpedo tube indicator light cycling
    tubeIndicators.forEach(function(indicator, idx) {
      var cyclePhase = (elapsedTime * 2 + idx * Math.PI / 2) % (Math.PI * 2);
      indicator.mesh.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(cyclePhase);
    });

    // Water sloshing (scale oscillation)
    if (waterGroup) {
      var sloshAmount = 0.05 * Math.sin(elapsedTime * waterGroup.waterData.slosheSpeed);
      waterGroup.scale.y = 1 + sloshAmount;
      waterGroup.children[0].material.opacity = 0.4 + 0.1 * Math.sin(elapsedTime * 1.5);
    }

    // Periscope slowly rotating
    if (periscopeGroup) {
      var rotateAmount = periscopeGroup.periscopeData.maxRotation * Math.sin(elapsedTime * periscopeGroup.periscopeData.rotationSpeed);
      periscopeGroup.rotation.y = rotateAmount;
    }

    // Update game state based on time (simulating depth/pressure changes)
    gameState.depth = 500 + 20 * Math.sin(elapsedTime * 0.3);
    gameState.pressure = 120 + 5 * Math.sin(elapsedTime * 0.2);
    gameState.reactorTemp = 180 + 15 * Math.sin(elapsedTime * 0.25);
  }

  function reset() {
    // Clean up all scene objects
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });
    sceneObjects = [];
    tubeIndicators = [];
    turbineGroup = null;
    sonarScreenGroup = null;
    reactorLightGroup = null;
    waterGroup = null;
    periscopeGroup = null;
    elapsedTime = 0;
    scene = null;
    camera = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
