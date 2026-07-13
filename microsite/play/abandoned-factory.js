var window = window || {};

window.AbandonedFactory = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var hudElement = null;
  var elapsedTime = 0;
  var gameState = {
    areasSecured: 0,
    maxAreas: 6,
    enemiesDisabled: 0,
    chemicalReactorStatus: 'CRITICAL'
  };
  var skylightPulsePhase = 0;
  var chemicalVats = [];
  var enemyPanels = [];
  var toxicDrums = [];
  var lastHKeyTime = 0;
  var hudVisible = true;

  function createRustedFactoryWalls() {
    // Main exterior walls - brownish rust color
    var wallGeometry = new THREE.BoxGeometry(40, 8, 0.5);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x886633,
      roughness: 0.9,
      metalness: 0.3
    });

    // Front wall
    var frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, 4, -20);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    scene.add(frontWall);
    sceneObjects.push(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 4, 20);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    sceneObjects.push(backWall);

    // Left wall
    var leftWallGeometry = new THREE.BoxGeometry(0.5, 8, 40);
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-20, 4, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    sceneObjects.push(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(20, 4, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    sceneObjects.push(rightWall);
  }

  function createCollapsedFloorHoles() {
    // Dark gaps in factory floor showing destruction
    var holeGeometry = new THREE.BoxGeometry(6, 0.5, 5);
    var holeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95,
      metalness: 0.1
    });

    var holePositions = [
      { x: -10, z: -10 },
      { x: 8, z: -8 },
      { x: -12, z: 5 },
      { x: 10, z: 8 },
      { x: 0, z: 15 }
    ];

    holePositions.forEach(function(pos) {
      var hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(pos.x, -0.5, pos.z);
      hole.castShadow = true;
      hole.receiveShadow = true;
      scene.add(hole);
      sceneObjects.push(hole);
    });
  }

  function createBrokenSkylights() {
    // Skylight frames with glass fragments - broken windows with light shafts
    var frameGeometry = new THREE.BoxGeometry(5, 0.3, 5);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.4
    });

    var skylightPositions = [
      { x: -14, y: 8, z: -12 },
      { x: 6, y: 8, z: -5 },
      { x: -8, y: 8, z: 10 },
      { x: 12, y: 8, z: 5 }
    ];

    skylightPositions.forEach(function(pos) {
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos.x, pos.y, pos.z);
      frame.castShadow = true;
      frame.receiveShadow = true;
      scene.add(frame);
      sceneObjects.push(frame);

      // Glass fragments (LineSegments)
      var fragmentGeometry = new THREE.BufferGeometry();
      var vertices = new Float32Array([
        -2, 0.5, -2,
        2, 0.5, 2,
        -2, 0.5, 2,
        2, 0.5, -2,
        -1, 0.5, -1,
        1, 0.5, 1,
        -1.5, 0.5, 1.5,
        1.5, 0.5, -1.5
      ]);
      fragmentGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      var fragmentMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 });
      var fragments = new THREE.LineSegments(fragmentGeometry, fragmentMaterial);
      fragments.position.copy(frame.position);
      scene.add(fragments);
      sceneObjects.push(fragments);
    });
  }

  function createChemicalVats() {
    // Cylinders with glowing murky liquid - toxic chemical reaction
    var vatGeometry = new THREE.CylinderGeometry(2, 2, 3, 16);
    var vatMaterial = new THREE.MeshStandardMaterial({
      color: 0x00AA44,
      emissive: 0x00AA44,
      emissiveIntensity: 0.6,
      roughness: 0.5,
      metalness: 0.3
    });

    var vatPositions = [
      { x: -15, y: 2, z: -8 },
      { x: 14, y: 2, z: -12 },
      { x: -8, y: 2, z: 12 }
    ];

    vatPositions.forEach(function(pos) {
      var vat = new THREE.Mesh(vatGeometry, vatMaterial);
      vat.position.set(pos.x, pos.y, pos.z);
      vat.castShadow = true;
      vat.receiveShadow = true;
      scene.add(vat);
      sceneObjects.push(vat);

      // Liquid surface (sphere with reduced height for visual effect)
      var liquidGeometry = new THREE.SphereGeometry(1.95, 16, 8);
      var liquidMaterial = new THREE.MeshStandardMaterial({
        color: 0x00DD55,
        emissive: 0x00DD55,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.2
      });
      var liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
      liquid.position.set(pos.x, pos.y + 1.3, pos.z);
      liquid.scale.set(1, 0.4, 1);
      liquid.castShadow = true;
      scene.add(liquid);
      sceneObjects.push(liquid);

      chemicalVats.push({
        vat: vat,
        liquid: liquid,
        baseIntensity: 0.6,
        bubblePhase: Math.random() * Math.PI * 2
      });
    });
  }

  function createFloodedBasementWater() {
    // Water surface in basement area - reflective appearance
    var waterGeometry = new THREE.BoxGeometry(40, 0.1, 40);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a4a,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0x0a1a2a,
      emissiveIntensity: 0.3
    });

    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, -3, 0);
    water.receiveShadow = true;
    scene.add(water);
    sceneObjects.push(water);
  }

  function createRustedMachineryHulks() {
    // Large rusted industrial machinery pieces
    var machineGeometry = new THREE.BoxGeometry(4, 5, 3);
    var machineMaterial = new THREE.MeshStandardMaterial({
      color: 0x664422,
      roughness: 0.95,
      metalness: 0.2
    });

    var machinePositions = [
      { x: -16, y: 3, z: -15 },
      { x: 16, y: 3, z: -10 },
      { x: -12, y: 3, z: 8 },
      { x: 10, y: 3, z: 12 }
    ];

    machinePositions.forEach(function(pos) {
      var machine = new THREE.Mesh(machineGeometry, machineMaterial);
      machine.position.set(pos.x, pos.y, pos.z);
      machine.castShadow = true;
      machine.receiveShadow = true;
      scene.add(machine);
      sceneObjects.push(machine);
    });
  }

  function createEnemyRetrofitPanels() {
    // Enemy equipment - electrical panels with blinking lights
    var panelGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.5
    });

    var panelPositions = [
      { x: -18, y: 2, z: -5 },
      { x: 18, y: 2, z: 8 },
      { x: -6, y: 2, z: 18 }
    ];

    panelPositions.forEach(function(pos) {
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, pos.y, pos.z);
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);
      sceneObjects.push(panel);

      // Indicator lights on panel
      var lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.9
      });

      for (var i = 0; i < 3; i++) {
        var light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(pos.x - 0.3, pos.y + 0.5 + (i * 0.4), pos.z + 0.2);
        scene.add(light);
        sceneObjects.push(light);

        enemyPanels.push({
          indicator: light,
          baseColor: 0xFF0000,
          blinkPhase: Math.random() * Math.PI * 2 + (i * 0.5)
        });
      }
    });
  }

  function createSquatterCampDebris() {
    // Cardboard box clusters - homeless squatter areas
    var boxGeometry = new THREE.BoxGeometry(1, 1, 1.2);
    var boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.95,
      metalness: 0.0
    });

    var debrisPositions = [
      { x: -14, y: 0.5, z: 0 },
      { x: 12, y: 0.5, z: -8 },
      { x: -8, y: 0.5, z: 18 },
      { x: 6, y: 0.5, z: 5 }
    ];

    debrisPositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(
          pos.x + (i * 0.5 - 0.5),
          pos.y + (i * 0.3),
          pos.z + (Math.random() - 0.5)
        );
        box.rotation.z = Math.random() * 0.3;
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        sceneObjects.push(box);
      }
    });
  }

  function createExposedGirderBeams() {
    // Metal support beams - structural skeleton
    var beamGeometry = new THREE.BoxGeometry(0.4, 10, 0.4);
    var beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8,
      metalness: 0.6
    });

    var beamPositions = [
      { x: -15, z: -12 },
      { x: 15, z: -12 },
      { x: -15, z: 12 },
      { x: 15, z: 12 },
      { x: 0, z: 0 }
    ];

    beamPositions.forEach(function(pos) {
      var beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(pos.x, 5, pos.z);
      beam.castShadow = true;
      beam.receiveShadow = true;
      scene.add(beam);
      sceneObjects.push(beam);
    });

    // Horizontal cross-beams
    var crossGeometry = new THREE.BoxGeometry(35, 0.3, 0.3);
    var crossBeam = new THREE.Mesh(crossGeometry, beamMaterial);
    crossBeam.position.set(0, 8, 0);
    crossBeam.castShadow = true;
    crossBeam.receiveShadow = true;
    scene.add(crossBeam);
    sceneObjects.push(crossBeam);
  }

  function createToxicDrumBarrels() {
    // Toxic barrels with glowing hazard markings
    var drumGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
    var drumMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      roughness: 0.7,
      metalness: 0.4
    });

    var drumPositions = [
      { x: -18, y: 0.75, z: 12 },
      { x: 14, y: 0.75, z: 10 },
      { x: 0, y: 0.75, z: -18 },
      { x: -6, y: 0.75, z: -10 }
    ];

    drumPositions.forEach(function(pos) {
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(pos.x, pos.y, pos.z);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
      sceneObjects.push(drum);

      // Hazard glow
      var glowGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var glowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        emissive: 0xFF8800,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.3
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(drum.position);
      scene.add(glow);
      sceneObjects.push(glow);

      toxicDrums.push({
        drum: drum,
        glow: glow,
        baseIntensity: 0.5,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });
  }

  function createCrumblingBrickColumn() {
    // Large structural column with visible decay
    var columnGeometry = new THREE.CylinderGeometry(1.5, 1.8, 8, 8);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x775533,
      roughness: 0.95,
      metalness: 0.1
    });

    var column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(8, 4, -12);
    column.castShadow = true;
    column.receiveShadow = true;
    scene.add(column);
    sceneObjects.push(column);

    // Crumbling bricks (scattered boxes)
    var brickGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.4);
    var brickMaterial = new THREE.MeshStandardMaterial({
      color: 0x664433,
      roughness: 0.9
    });

    for (var i = 0; i < 6; i++) {
      var brick = new THREE.Mesh(brickGeometry, brickMaterial);
      brick.position.set(
        8 + (Math.random() - 0.5) * 2,
        4 + Math.random() * 0.5,
        -12 + (Math.random() - 0.5) * 2
      );
      brick.rotation.z = Math.random() * Math.PI;
      brick.castShadow = true;
      brick.receiveShadow = true;
      scene.add(brick);
      sceneObjects.push(brick);
    }
  }

  function createOverheadCraneRusted() {
    // Large rusted crane - stuck in place
    var craneGeometry = new THREE.BoxGeometry(20, 0.8, 0.4);
    var craneMaterial = new THREE.MeshStandardMaterial({
      color: 0x664422,
      roughness: 0.95,
      metalness: 0.2
    });

    var craneBeam = new THREE.Mesh(craneGeometry, craneMaterial);
    craneBeam.position.set(0, 7.5, 5);
    craneBeam.castShadow = true;
    craneBeam.receiveShadow = true;
    scene.add(craneBeam);
    sceneObjects.push(craneBeam);

    // Crane hook and cable
    var hookGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    var hookMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.3
    });

    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(-8, 5.5, 5);
    hook.castShadow = true;
    hook.receiveShadow = true;
    scene.add(hook);
    sceneObjects.push(hook);
  }

  function createEmergencyExitSigns() {
    // Exit signs with faded paint
    var signGeometry = new THREE.BoxGeometry(2, 1, 0.2);
    var signMaterial = new THREE.MeshStandardMaterial({
      color: 0x004400,
      emissive: 0x003300,
      emissiveIntensity: 0.2,
      roughness: 0.7
    });

    var signPositions = [
      { x: -19.5, y: 3, z: -10 },
      { x: 19.5, y: 3, z: 10 }
    ];

    signPositions.forEach(function(pos) {
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(pos.x, pos.y, pos.z);
      sign.castShadow = true;
      scene.add(sign);
      sceneObjects.push(sign);
    });
  }

  function createChainLinkPartitions() {
    // Interior chain-link fencing - dividing sections
    var fenceGeometry = new THREE.BoxGeometry(12, 3, 0.1);
    var fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      metalness: 0.5
    });

    var fencePositions = [
      { x: 0, y: 1.5, z: 5 },
      { x: -10, y: 1.5, z: 0 },
      { x: 10, y: 1.5, z: -8 }
    ];

    fencePositions.forEach(function(pos) {
      var fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
      fence.position.set(pos.x, pos.y, pos.z);
      fence.castShadow = true;
      fence.receiveShadow = true;
      scene.add(fence);
      sceneObjects.push(fence);
    });
  }

  function createFloor() {
    // Factory floor
    var floorGeometry = new THREE.BoxGeometry(40, 0.1, 40);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.95,
      metalness: 0.1
    });

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function updateSkylightShaftLight(delta) {
    skylightPulsePhase += delta * 0.5;
    var pulse = Math.sin(skylightPulsePhase) * 0.3 + 0.7;

    lights.forEach(function(lightData) {
      if (lightData.type === 'skylight') {
        lightData.light.intensity = lightData.baseIntensity * pulse;
      }
    });
  }

  function updateChemicalVatBubbles(delta) {
    chemicalVats.forEach(function(vatData) {
      var bubbleIntensity = Math.sin(elapsedTime * 1.5 + vatData.bubblePhase) * 0.2 + 0.6;
      vatData.vat.material.emissiveIntensity = bubbleIntensity;
      vatData.liquid.material.emissiveIntensity = bubbleIntensity + 0.2;

      // Gentle vertical bob
      vatData.liquid.position.y += Math.sin(elapsedTime * 0.8 + vatData.bubblePhase) * 0.001;
    });
  }

  function updateBasementWaterRipples(delta) {
    sceneObjects.forEach(function(obj) {
      if (obj.geometry instanceof THREE.BoxGeometry) {
        if (obj.position.y === -3 && obj.material.color.getHex() === 0x1a3a4a) {
          obj.position.y = -3 + Math.sin(elapsedTime * 0.6) * 0.05;
        }
      }
    });
  }

  function updateEnemyEquipmentLights(delta) {
    enemyPanels.forEach(function(panelData) {
      var blink = Math.sin(elapsedTime * 3 + panelData.blinkPhase) * 0.5 + 0.5;
      panelData.indicator.material.emissiveIntensity = blink * 0.9;
    });
  }

  function updateToxicDrumGlow(delta) {
    toxicDrums.forEach(function(drumData) {
      var pulse = Math.sin(elapsedTime * 1.2 + drumData.pulsePhase) * 0.3 + 0.5;
      drumData.glow.material.emissiveIntensity = pulse;
    });
  }

  function updateDebrisParticles(delta) {
    // Dust falling effect from ceiling
    sceneObjects.forEach(function(obj) {
      if (obj.geometry instanceof THREE.BoxGeometry && obj.material.color.getHex() === 0x8B7355) {
        obj.position.y += Math.sin(elapsedTime * 0.4 + obj.position.x) * 0.0001;
      }
    });
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'abandoned-factory-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #FFFF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #FFFF00; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #FFFF00;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'FACTORY SECURE LEVEL: ' + gameState.areasSecured + '/' + gameState.maxAreas + '\n' +
                  'HOSTILE UNITS DISABLED: ' + gameState.enemiesDisabled + '\n' +
                  'REACTOR STATUS: ' + gameState.chemicalReactorStatus + '\n' +
                  '[ H ] TOGGLE HUD';

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'h') {
        if (now - lastHKeyTime > 300) {
          hudVisible = !hudVisible;
          lastHKeyTime = now;
        }
      }
    });
  }

  function createLighting() {
    // Ambient light
    var ambientLight = new THREE.AmbientLight(0x666666, 0.8);
    scene.add(ambientLight);
    lights.push({ light: ambientLight, type: 'ambient' });

    // Directional light (sun through broken skylights)
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    lights.push({ light: directionalLight, type: 'directional' });

    // Skylight shaft lights
    var skylightPositions = [
      { x: -14, z: -12 },
      { x: 6, z: -5 },
      { x: -8, z: 10 },
      { x: 12, z: 5 }
    ];

    skylightPositions.forEach(function(pos) {
      var skylightLight = new THREE.PointLight(0xFFFF88, 0.7, 25);
      skylightLight.position.set(pos.x, 6, pos.z);
      skylightLight.castShadow = true;
      scene.add(skylightLight);
      lights.push({ light: skylightLight, type: 'skylight', baseIntensity: 0.7 });
    });

    // Vat glow lights
    chemicalVats.forEach(function(vat) {
      var vatLight = new THREE.PointLight(0x00AA44, 0.6, 15);
      vatLight.position.copy(vat.vat.position);
      scene.add(vatLight);
      lights.push({ light: vatLight, type: 'vat' });
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04);

    // Create all factory structures
    createFloor();
    createRustedFactoryWalls();
    createCollapsedFloorHoles();
    createBrokenSkylights();
    createChemicalVats();
    createFloodedBasementWater();
    createRustedMachineryHulks();
    createEnemyRetrofitPanels();
    createSquatterCampDebris();
    createExposedGirderBeams();
    createToxicDrumBarrels();
    createCrumblingBrickColumn();
    createOverheadCraneRusted();
    createEmergencyExitSigns();
    createChainLinkPartitions();

    // Setup lighting
    createLighting();

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    // Update all animated elements
    updateSkylightShaftLight(delta);
    updateChemicalVatBubbles(delta);
    updateBasementWaterRipples(delta);
    updateEnemyEquipmentLights(delta);
    updateToxicDrumGlow(delta);
    updateDebrisParticles(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    lights.forEach(function(lightData) {
      scene.remove(lightData.light);
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    lights = [];
    chemicalVats = [];
    enemyPanels = [];
    toxicDrums = [];
    gameState.areasSecured = 0;
    gameState.enemiesDisabled = 0;
    elapsedTime = 0;
    skylightPulsePhase = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
