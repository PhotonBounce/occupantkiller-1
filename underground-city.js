var window = window || {};

window.UndergroundCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var elapsedTime = 0;
  var mushrooms = [];
  var riverSurface = null;
  var waterfall = null;
  var torchLights = [];
  var marketLanterns = [];
  var glowWorms = [];
  var ceilingMoss = [];

  function createCavernCeiling() {
    var group = new THREE.Group();

    // Large dark flat box overhead
    var ceilingGeometry = new THREE.BoxGeometry(80, 3, 80);
    var ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x221133,
      roughness: 0.9,
      metalness: 0.1
    });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 35;
    ceiling.receiveShadow = true;
    group.add(ceiling);

    return group;
  }

  function createCarvedStoneBuilding() {
    var group = new THREE.Group();

    // Main building facade - carved stone texture effect
    var buildingGeometry = new THREE.BoxGeometry(8, 10, 5);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x443344,
      roughness: 0.8,
      metalness: 0.05
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 5;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Glowing windows - emissive purple
    var windowGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xAA66FF,
      emissive: 0xAA66FF,
      emissiveIntensity: 0.8,
      metalness: 0.3
    });

    // Create grid of glowing windows
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 6; j++) {
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          -3 + (j * 1.2),
          1.5 + (i * 1.3),
          2.6
        );
        window.castShadow = true;
        group.add(window);
      }
    }

    // Carved archway entrance
    var archGeometry = new THREE.BoxGeometry(3, 4, 0.5);
    var archMaterial = new THREE.MeshStandardMaterial({
      color: 0x332233,
      roughness: 0.85
    });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(0, 2, -2.5);
    arch.castShadow = true;
    group.add(arch);

    return group;
  }

  function createUndergroundRiver() {
    // Long flat blue surface representing river
    var riverGeometry = new THREE.BoxGeometry(60, 0.5, 8);
    var riverMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444AA,
      emissive: 0x2222FF,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.3
    });
    var river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.position.set(0, 1, 0);
    river.receiveShadow = true;

    riverSurface = {
      mesh: river,
      phase: 0
    };

    return river;
  }

  function createStalactiteLights() {
    var group = new THREE.Group();

    // Hanging cylinders with emissive tips - bioluminescent stalactites
    for (var i = 0; i < 8; i++) {
      var stalactiteGroup = new THREE.Group();

      // Main cylinder (hanging down from ceiling)
      var cylGeometry = new THREE.CylinderGeometry(0.3, 0.2, 4, 8);
      var cylMaterial = new THREE.MeshStandardMaterial({
        color: 0x444455,
        roughness: 0.7
      });
      var cyl = new THREE.Mesh(cylGeometry, cylMaterial);
      cyl.position.y = 0;
      cyl.castShadow = true;
      stalactiteGroup.add(cyl);

      // Emissive glowing tip at bottom
      var tipGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var tipMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF88,
        emissive: 0x00FF88,
        emissiveIntensity: 0.9
      });
      var tip = new THREE.Mesh(tipGeometry, tipMaterial);
      tip.position.y = -2.2;
      stalactiteGroup.add(tip);

      // Position around cavern
      var angle = (i / 8) * Math.PI * 2;
      stalactiteGroup.position.set(
        Math.cos(angle) * 20,
        32,
        Math.sin(angle) * 20
      );

      group.add(stalactiteGroup);

      glowWorms.push({
        mesh: tip,
        phase: Math.random() * Math.PI * 2,
        speed: 1 + Math.random() * 2
      });
    }

    return group;
  }

  function createMushroomForest() {
    var group = new THREE.Group();

    // Glowing mushrooms with cylinder stems and sphere caps
    for (var i = 0; i < 12; i++) {
      var mushroomGroup = new THREE.Group();

      // Stem - thin cylinder
      var stemGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.5, 8);
      var stemMaterial = new THREE.MeshStandardMaterial({
        color: 0x663366,
        roughness: 0.6
      });
      var stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.y = 1.2;
      stem.castShadow = true;
      mushroomGroup.add(stem);

      // Cap - glowing sphere on top
      var capGeometry = new THREE.SphereGeometry(1.2, 8, 8);
      var capMaterial = new THREE.MeshStandardMaterial({
        color: 0xAA66FF,
        emissive: 0xAA66FF,
        emissiveIntensity: 0.7,
        metalness: 0.2
      });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.y = 2.8;
      mushroomGroup.add(cap);

      // Random placement in "forest"
      mushroomGroup.position.set(
        Math.random() * 30 - 15,
        0.1,
        Math.random() * 20 - 10
      );
      mushroomGroup.castShadow = true;
      mushroomGroup.receiveShadow = true;

      group.add(mushroomGroup);

      mushrooms.push({
        mesh: cap,
        phase: Math.random() * Math.PI * 2,
        baseIntensity: 0.6 + Math.random() * 0.2
      });
    }

    return group;
  }

  function createStoneBridge() {
    var group = new THREE.Group();

    // Bridge deck - large flat box over river
    var deckGeometry = new THREE.BoxGeometry(12, 0.8, 4);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x554455,
      roughness: 0.85
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 2, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Support pillars - cylinders
    var pillarGeometry = new THREE.CylinderGeometry(0.8, 1, 3, 8);
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x443344,
      roughness: 0.8
    });

    for (var i = 0; i < 3; i++) {
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(-4 + (i * 4), 1, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
    }

    // Railing - small boxes along sides
    var railGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    var railMaterial = new THREE.MeshStandardMaterial({
      color: 0x664466
    });

    for (var j = 0; j < 10; j++) {
      var rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(-5.5 + (j * 1.2), 2.8, 2);
      rail.castShadow = true;
      group.add(rail);
    }

    return group;
  }

  function createMarketStallCluster() {
    var group = new THREE.Group();

    // Multiple market stalls
    for (var s = 0; s < 6; s++) {
      var stallGroup = new THREE.Group();

      // Main stall structure - box
      var stallGeometry = new THREE.BoxGeometry(2.5, 2, 1.5);
      var stallMaterial = new THREE.MeshStandardMaterial({
        color: 0x664433,
        roughness: 0.8
      });
      var stall = new THREE.Mesh(stallGeometry, stallMaterial);
      stall.position.y = 1;
      stall.castShadow = true;
      stall.receiveShadow = true;
      stallGroup.add(stall);

      // Canopy roof - smaller box on top
      var canopyGeometry = new THREE.BoxGeometry(3, 0.3, 2);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x554444
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.y = 2.15;
      canopy.castShadow = true;
      stallGroup.add(canopy);

      // Glowing lantern - hanging sphere
      var lanternGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var lanternMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        emissive: 0xFF8800,
        emissiveIntensity: 0.7
      });
      var lantern = new THREE.Mesh(lanternGeometry, lanternMaterial);
      lantern.position.set(0, 2.5, 0);
      stallGroup.add(lantern);

      // Position in cluster
      stallGroup.position.set(
        -6 + (s % 3) * 3,
        0.1,
        8 + Math.floor(s / 3) * 2.5
      );
      stallGroup.castShadow = true;

      group.add(stallGroup);

      marketLanterns.push({
        mesh: lantern,
        phase: Math.random() * Math.PI * 2,
        startPos: lantern.position.clone()
      });
    }

    return group;
  }

  function createUndergroundWell() {
    var group = new THREE.Group();

    // Well opening - cylinder
    var wellGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 8);
    var wellMaterial = new THREE.MeshStandardMaterial({
      color: 0x443344,
      roughness: 0.8
    });
    var well = new THREE.Mesh(wellGeometry, wellMaterial);
    well.position.y = 0.15;
    well.castShadow = true;
    group.add(well);

    // Well shaft - dark cylinder going down
    var shaftGeometry = new THREE.CylinderGeometry(1.4, 1.4, 8, 8);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x221122,
      roughness: 0.95
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = -4;
    shaft.receiveShadow = true;
    group.add(shaft);

    // Water glow at bottom - emissive sphere
    var waterGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444AA,
      emissive: 0x2222FF,
      emissiveIntensity: 0.6
    });
    var waterGlow = new THREE.Mesh(waterGeometry, waterMaterial);
    waterGlow.position.y = -7.5;
    group.add(waterGlow);

    return group;
  }

  function createTorchLitAlley() {
    var group = new THREE.Group();

    // Alley walls - two large boxes on sides
    var wallGeometry = new THREE.BoxGeometry(1, 6, 20);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x443344,
      roughness: 0.85
    });

    var wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
    wallLeft.position.set(-6, 3, 0);
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    group.add(wallLeft);

    var wallRight = new THREE.Mesh(wallGeometry, wallMaterial);
    wallRight.position.set(6, 3, 0);
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    group.add(wallRight);

    // Wall behind
    var wallBack = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1), wallMaterial);
    wallBack.position.set(0, 3, -10);
    wallBack.castShadow = true;
    group.add(wallBack);

    // Torches - emissive orange spheres on walls
    var torchGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var torchMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF8800,
      emissiveIntensity: 0.8
    });

    for (var i = 0; i < 5; i++) {
      var torch1 = new THREE.Mesh(torchGeometry, torchMaterial);
      torch1.position.set(-5.5, 2 + (i * 1.2), -10 + (i * 4));
      group.add(torch1);

      torchLights.push({
        mesh: torch1,
        phase: Math.random() * Math.PI * 2,
        speed: 3 + Math.random() * 2
      });

      var torch2 = new THREE.Mesh(torchGeometry, torchMaterial);
      torch2.position.set(5.5, 2 + (i * 1.2), -10 + (i * 4));
      group.add(torch2);

      torchLights.push({
        mesh: torch2,
        phase: Math.random() * Math.PI * 2,
        speed: 3 + Math.random() * 2
      });
    }

    return group;
  }

  function createBuildingWithGlowingWindows() {
    var group = new THREE.Group();

    // Main building structure
    var buildingGeometry = new THREE.BoxGeometry(6, 8, 4);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x332233,
      roughness: 0.8
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = 4;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // Glowing window grid - bioluminescent green
    var windowGeometry = new THREE.BoxGeometry(0.5, 0.7, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF88,
      emissive: 0x00FF88,
      emissiveIntensity: 0.85
    });

    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 4; j++) {
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(
          -2.5 + (j * 1.8),
          1.5 + (i * 1.5),
          2.1
        );
        group.add(window);
      }
    }

    // Door frame
    var doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x221122
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1.2, 2.1);
    door.castShadow = true;
    group.add(door);

    return group;
  }

  function createCaveMossPatch() {
    var group = new THREE.Group();

    // Hanging moss patches - small spheres from ceiling
    var mossGeometry = new THREE.SphereGeometry(0.8, 8, 8);
    var mossMaterial = new THREE.MeshStandardMaterial({
      color: 0x335533,
      emissive: 0x225522,
      emissiveIntensity: 0.3
    });

    for (var i = 0; i < 6; i++) {
      var moss = new THREE.Mesh(mossGeometry, mossMaterial);
      moss.position.set(
        Math.random() * 40 - 20,
        34,
        Math.random() * 40 - 20
      );
      group.add(moss);

      ceilingMoss.push({
        mesh: moss,
        phase: Math.random() * Math.PI * 2
      });
    }

    return group;
  }

  function createUndergroundWaterfall() {
    var group = new THREE.Group();

    // Waterfall structure - vertical cascade of boxes
    var waterfallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3366FF,
      emissive: 0x1144DD,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });

    // Main waterfall surface - tall thin box
    var fallGeometry = new THREE.BoxGeometry(3, 12, 0.5);
    var fall = new THREE.Mesh(fallGeometry, waterfallMaterial);
    fall.position.set(0, 6, 0);
    fall.receiveShadow = true;
    group.add(fall);

    // Water spray particles - small spheres
    for (var i = 0; i < 8; i++) {
      var sprayGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var spray = new THREE.Mesh(sprayGeometry, waterfallMaterial);
      spray.position.set(
        Math.random() * 2 - 1,
        12 - (i * 1.5),
        Math.random() * 0.8 - 0.4
      );
      group.add(spray);
    }

    // Water pool at bottom
    var poolGeometry = new THREE.BoxGeometry(4, 0.3, 3);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444AA,
      emissive: 0x2222FF,
      emissiveIntensity: 0.4
    });
    var pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.y = 0.15;
    pool.receiveShadow = true;
    group.add(pool);

    waterfall = {
      mesh: fall,
      phase: 0
    };

    return group;
  }

  function createCarvedArchways() {
    var group = new THREE.Group();

    // Series of archways - cone shapes and boxes combined
    for (var i = 0; i < 4; i++) {
      var archGroup = new THREE.Group();

      // Arch frame - vertical posts
      var postGeometry = new THREE.BoxGeometry(0.5, 5, 0.5);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: 0x443344,
        roughness: 0.8
      });

      var postLeft = new THREE.Mesh(postGeometry, postMaterial);
      postLeft.position.set(-2, 2.5, 0);
      postLeft.castShadow = true;
      archGroup.add(postLeft);

      var postRight = new THREE.Mesh(postGeometry, postMaterial);
      postRight.position.set(2, 2.5, 0);
      postRight.castShadow = true;
      archGroup.add(postRight);

      // Arch top - cone shape
      var archGeometry = new THREE.ConeGeometry(2.2, 1.5, 8);
      var archMaterial = new THREE.MeshStandardMaterial({
        color: 0x554455,
        roughness: 0.75
      });
      var arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(0, 4.8, 0);
      arch.castShadow = true;
      archGroup.add(arch);

      // Position archways in sequence
      archGroup.position.set(0, 0, -15 + (i * 8));
      group.add(archGroup);
    }

    return group;
  }

  function updateRiverShimmer(delta) {
    if (!riverSurface) return;

    riverSurface.phase += delta * 1.5;

    // Subtle oscillation in emissive intensity
    var shimmer = Math.sin(riverSurface.phase) * 0.15 + 0.4;
    riverSurface.mesh.material.emissiveIntensity = shimmer;
  }

  function updateMushroomPulse(delta) {
    mushrooms.forEach(function(mushroom) {
      mushroom.phase += delta * 1.2;
      var pulse = Math.sin(mushroom.phase) * 0.3 + mushroom.baseIntensity;
      mushroom.mesh.material.emissiveIntensity = pulse;
    });
  }

  function updateWaterfallFlow(delta) {
    if (!waterfall) return;

    waterfall.phase += delta * 2;

    // Animate waterfall flow by shifting Y position
    var flowOffset = (waterfall.phase % 3) * 0.3;
    waterfall.mesh.position.y = 6 + Math.sin(waterfall.phase * 1.5) * 0.2;
  }

  function updateTorchFlicker(delta) {
    torchLights.forEach(function(torch) {
      torch.phase += delta * torch.speed;
      var flicker = Math.sin(torch.phase) * 0.2 + 0.6;
      torch.mesh.material.emissiveIntensity = flicker;
    });
  }

  function updateMarketLanternSway(delta) {
    marketLanterns.forEach(function(lantern) {
      lantern.phase += delta * 0.8;

      // Gentle swaying motion
      var sway = Math.sin(lantern.phase) * 0.15;
      lantern.mesh.position.x = lantern.startPos.x + sway;
      lantern.mesh.position.z = lantern.startPos.z + Math.cos(lantern.phase) * 0.1;
    });
  }

  function updateCeilingGlowWorms(delta) {
    glowWorms.forEach(function(worm) {
      worm.phase += delta * worm.speed;
      var glow = Math.sin(worm.phase) * 0.4 + 0.5;
      worm.mesh.material.emissiveIntensity = glow;
    });
  }

  function updateCeilingMoss(delta) {
    ceilingMoss.forEach(function(moss) {
      moss.phase += delta * 0.5;
      var mossglow = Math.sin(moss.phase) * 0.2 + 0.3;
      moss.mesh.material.emissiveIntensity = mossglow;
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Set up underground cavern atmosphere
    scene.background = new THREE.Color(0x0A0605);
    scene.fog = new THREE.FogExp2(0x1a0f15, 0.04);

    // Ambient light - dim underground cave lighting
    var ambientLight = new THREE.AmbientLight(0x332244, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Directional light from bioluminescent sources
    var directionalLight = new THREE.DirectionalLight(0x00FF88, 0.4);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    scene.add(directionalLight);
    lights.push(directionalLight);

    // Point light from torch area - warm orange glow
    var pointLight = new THREE.PointLight(0xFF8800, 0.5);
    pointLight.position.set(0, 2, 15);
    scene.add(pointLight);
    lights.push(pointLight);

    // Cavern ceiling
    var ceiling = createCavernCeiling();
    scene.add(ceiling);
    sceneObjects.push(ceiling);

    // Underground river
    var river = createUndergroundRiver();
    scene.add(river);
    sceneObjects.push(river);

    // Stone buildings in cavern walls (2 buildings)
    var building1 = createCarvedStoneBuilding();
    building1.position.set(-18, 0, 10);
    scene.add(building1);
    sceneObjects.push(building1);

    var building2 = createCarvedStoneBuilding();
    building2.position.set(18, 0, -10);
    scene.add(building2);
    sceneObjects.push(building2);

    // Stalactite city lights
    var stalactites = createStalactiteLights();
    scene.add(stalactites);
    sceneObjects.push(stalactites);

    // Mushroom forest
    var mushrooms = createMushroomForest();
    scene.add(mushrooms);
    sceneObjects.push(mushrooms);

    // Stone bridge over river
    var bridge = createStoneBridge();
    bridge.position.set(0, 0, 0);
    scene.add(bridge);
    sceneObjects.push(bridge);

    // Market stall cluster
    var market = createMarketStallCluster();
    market.position.set(-15, 0, -12);
    scene.add(market);
    sceneObjects.push(market);

    // Underground well
    var well = createUndergroundWell();
    well.position.set(12, 0, -15);
    scene.add(well);
    sceneObjects.push(well);

    // Torch-lit alley walls
    var alley = createTorchLitAlley();
    alley.position.set(0, 0, -25);
    scene.add(alley);
    sceneObjects.push(alley);

    // Building with glowing windows
    var glowBuilding = createBuildingWithGlowingWindows();
    glowBuilding.position.set(-20, 0, -18);
    scene.add(glowBuilding);
    sceneObjects.push(glowBuilding);

    // Cave moss patches on ceiling
    var mosses = createCaveMossPatch();
    scene.add(mosses);
    sceneObjects.push(mosses);

    // Underground waterfall
    var falls = createUndergroundWaterfall();
    falls.position.set(20, 0, -20);
    scene.add(falls);
    sceneObjects.push(falls);

    // Carved archways
    var archways = createCarvedArchways();
    archways.position.set(-10, 0, 0);
    scene.add(archways);
    sceneObjects.push(archways);
  }

  function update(delta) {
    elapsedTime += delta;

    updateRiverShimmer(delta);
    updateMushroomPulse(delta);
    updateWaterfallFlow(delta);
    updateTorchFlicker(delta);
    updateMarketLanternSway(delta);
    updateCeilingGlowWorms(delta);
    updateCeilingMoss(delta);
  }

  function reset() {
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

    // Reset state
    sceneObjects = [];
    mushrooms = [];
    torchLights = [];
    marketLanterns = [];
    glowWorms = [];
    ceilingMoss = [];
    lights = [];
    riverSurface = null;
    waterfall = null;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
