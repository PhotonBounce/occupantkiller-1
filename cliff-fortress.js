var window = window || {};

window.CliffFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animationState = {
    cauldronPulse: 0,
    trebuchetAngle: 0,
    drawbridgeHeight: 0,
    torchFlicker: 0,
    windSway: 0,
    oilDrip: 0
  };
  var cauldronMesh = null;
  var cauldronMaterial = null;
  var trebuchetArm = null;
  var drawbridgeMesh = null;
  var cliffRocks = [];
  var torchLights = [];

  function createCliffRockFace() {
    // Tall irregular cliff face made of stacked boxes
    var cliffGroup = new THREE.Group();
    var cliffMaterial = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.9 });

    // Main cliff face - tall and irregular
    var baseRockGeometry = new THREE.BoxGeometry(25, 40, 8);
    var baseRock = new THREE.Mesh(baseRockGeometry, cliffMaterial);
    baseRock.position.set(0, 10, -15);
    baseRock.castShadow = true;
    baseRock.receiveShadow = true;
    cliffGroup.add(baseRock);
    cliffRocks.push(baseRock);

    // Irregular outcropping rocks
    var outcroppingPositions = [
      { x: -8, y: 20, z: -18, w: 4, h: 8, d: 6 },
      { x: 10, y: 25, z: -16, w: 5, h: 10, d: 5 },
      { x: -12, y: 15, z: -14, w: 3, h: 6, d: 4 },
      { x: 6, y: 18, z: -17, w: 4, h: 7, d: 5 }
    ];

    outcroppingPositions.forEach(function(pos) {
      var rockGeometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var rock = new THREE.Mesh(rockGeometry, cliffMaterial);
      rock.position.set(pos.x, pos.y, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      cliffGroup.add(rock);
      cliffRocks.push(rock);
    });

    // Ravine shadow below
    var ravineGeometry = new THREE.BoxGeometry(30, 50, 10);
    var ravineMaterial = new THREE.MeshStandardMaterial({ color: 0x1144AA, emissive: 0x001122 });
    var ravine = new THREE.Mesh(ravineGeometry, ravineMaterial);
    ravine.position.set(0, -20, -8);
    ravine.castShadow = true;
    ravine.receiveShadow = true;
    cliffGroup.add(ravine);
    sceneObjects.push(ravine);

    scene.add(cliffGroup);
    sceneObjects.push(cliffGroup);
  }

  function createFortressWalls() {
    var wallGroup = new THREE.Group();
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });

    // Main fortress wall on cliff edge
    var mainWallGeometry = new THREE.BoxGeometry(20, 8, 1);
    var mainWall = new THREE.Mesh(mainWallGeometry, wallMaterial);
    mainWall.position.set(0, 15, 5);
    mainWall.castShadow = true;
    mainWall.receiveShadow = true;
    wallGroup.add(mainWall);

    // Left wing wall
    var leftWallGeometry = new THREE.BoxGeometry(1, 8, 12);
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-10, 15, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    wallGroup.add(leftWall);

    // Right wing wall
    var rightWallGeometry = new THREE.BoxGeometry(1, 8, 12);
    var rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(10, 15, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    wallGroup.add(rightWall);

    // Parapet walk (crenellations)
    var crenellationMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    for (var i = -8; i <= 8; i += 2) {
      var crenGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
      var cren = new THREE.Mesh(crenGeometry, crenellationMaterial);
      cren.position.set(i, 19, 5);
      cren.castShadow = true;
      cren.receiveShadow = true;
      wallGroup.add(cren);
    }

    scene.add(wallGroup);
    sceneObjects.push(wallGroup);
  }

  function createBastions() {
    // Corner bastions - cylinders
    var bastionMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85 });

    var bastionPositions = [
      { x: -10, z: 5 },
      { x: 10, z: 5 },
      { x: -10, z: -8 },
      { x: 10, z: -8 }
    ];

    bastionPositions.forEach(function(pos) {
      var bastionGeometry = new THREE.CylinderGeometry(1.5, 1.8, 10, 16);
      var bastion = new THREE.Mesh(bastionGeometry, bastionMaterial);
      bastion.position.set(pos.x, 14, pos.z);
      bastion.castShadow = true;
      bastion.receiveShadow = true;
      scene.add(bastion);
      sceneObjects.push(bastion);

      // Bastion top (cone cap)
      var topGeometry = new THREE.ConeGeometry(1.5, 2, 16);
      var topMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(pos.x, 20, pos.z);
      top.castShadow = true;
      top.receiveShadow = true;
      scene.add(top);
      sceneObjects.push(top);
    });
  }

  function createDrawbridge() {
    var drawbridgeGroup = new THREE.Group();
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });

    // Drawbridge deck
    var bridgeGeometry = new THREE.BoxGeometry(12, 0.5, 6);
    drawbridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    drawbridgeMesh.position.set(0, 8, -2);
    drawbridgeMesh.castShadow = true;
    drawbridgeMesh.receiveShadow = true;
    drawbridgeGroup.add(drawbridgeMesh);

    // Bridge support chains/ropes
    var chainGeometry = new THREE.BoxGeometry(0.1, 5, 0.1);
    var chainMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });

    var chainPositions = [
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: -5, z: -5 },
      { x: 5, z: -5 }
    ];

    chainPositions.forEach(function(pos) {
      var chain = new THREE.Mesh(chainGeometry, chainMaterial);
      chain.position.set(pos.x, 10, pos.z);
      chain.castShadow = true;
      chain.receiveShadow = true;
      drawbridgeGroup.add(chain);
    });

    scene.add(drawbridgeGroup);
    sceneObjects.push(drawbridgeGroup);
  }

  function createCavePassages() {
    var caveMaterial = new THREE.MeshStandardMaterial({ color: 0x553322, roughness: 0.95 });

    // Main cave entrance
    var caveGeometry = new THREE.BoxGeometry(4, 4, 2);
    var cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.position.set(-8, 8, -10);
    cave.castShadow = true;
    cave.receiveShadow = true;
    scene.add(cave);
    sceneObjects.push(cave);

    // Secondary cave passage
    var cave2Geometry = new THREE.BoxGeometry(3, 3.5, 2);
    var cave2 = new THREE.Mesh(cave2Geometry, caveMaterial);
    cave2.position.set(9, 6, -12);
    cave2.castShadow = true;
    cave2.receiveShadow = true;
    scene.add(cave2);
    sceneObjects.push(cave2);

    // Cave torch lights inside
    var torchLight1 = new THREE.PointLight(0xFF6600, 0.5, 10);
    torchLight1.position.set(-8, 8, -8);
    torchLight1.castShadow = true;
    scene.add(torchLight1);
    torchLights.push({ light: torchLight1, intensity: 0.5 });

    var torchLight2 = new THREE.PointLight(0xFF6600, 0.5, 10);
    torchLight2.position.set(9, 6, -10);
    torchLight2.castShadow = true;
    scene.add(torchLight2);
    torchLights.push({ light: torchLight2, intensity: 0.5 });
  }

  function createCliffFaceHandholds() {
    // Climbing path of handholds on cliff face
    var handholeMaterial = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.8 });

    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 3; j++) {
        var holdGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.8);
        var hold = new THREE.Mesh(holdGeometry, handholeMaterial);
        hold.position.set(-10 + j * 3, 3 + i * 2.5, -20);
        hold.castShadow = true;
        hold.receiveShadow = true;
        scene.add(hold);
        sceneObjects.push(hold);
      }
    }
  }

  function createBoilingOilCauldron() {
    var cauldronGroup = new THREE.Group();

    // Cauldron body (cylinder)
    var cauldronGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 16);
    cauldronMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF8800,
      emissive: 0xFF8800,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.8
    });
    cauldronMesh = new THREE.Mesh(cauldronGeometry, cauldronMaterial);
    cauldronMesh.position.set(5, 16, 4);
    cauldronMesh.castShadow = true;
    cauldronMesh.receiveShadow = true;
    cauldronGroup.add(cauldronMesh);

    // Cauldron rim
    var rimGeometry = new THREE.CylinderGeometry(1.3, 1.3, 0.3, 16);
    var rimMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(5, 17.5, 4);
    rim.castShadow = true;
    rim.receiveShadow = true;
    cauldronGroup.add(rim);

    // Support chain
    var supportGeometry = new THREE.BoxGeometry(0.15, 3, 0.15);
    var supportMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(5, 18, 4);
    support.castShadow = true;
    support.receiveShadow = true;
    cauldronGroup.add(support);

    // Oil drip emitter particles (small glowing spheres)
    for (var i = 0; i < 3; i++) {
      var dripGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      var dripMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        emissive: 0xFF6600,
        emissiveIntensity: 0.5
      });
      var drip = new THREE.Mesh(dripGeometry, dripMaterial);
      drip.position.set(4 + i * 0.5, 15.5, 4);
      cauldronGroup.add(drip);
    }

    scene.add(cauldronGroup);
    sceneObjects.push(cauldronGroup);
  }

  function createTrebuchet() {
    var trebuchetGroup = new THREE.Group();
    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.85 });
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });

    // Base frame
    var baseGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    var base = new THREE.Mesh(baseGeometry, woodMaterial);
    base.position.set(-5, 12, 8);
    base.castShadow = true;
    base.receiveShadow = true;
    trebuchetGroup.add(base);

    // Support beams
    var beamGeometry = new THREE.BoxGeometry(0.3, 4, 0.3);
    var beamPositions = [
      { x: -1.5, z: -1.5 },
      { x: -1.5, z: 1.5 },
      { x: 1.5, z: -1.5 },
      { x: 1.5, z: 1.5 }
    ];

    beamPositions.forEach(function(pos) {
      var beam = new THREE.Mesh(beamGeometry, woodMaterial);
      beam.position.set(pos.x - 5, 14, pos.z + 8);
      beam.castShadow = true;
      beam.receiveShadow = true;
      trebuchetGroup.add(beam);
    });

    // Trebuchet arm (rotating)
    var armGeometry = new THREE.BoxGeometry(0.4, 4, 0.4);
    trebuchetArm = new THREE.Mesh(armGeometry, woodMaterial);
    trebuchetArm.position.set(-5, 14, 8);
    trebuchetArm.castShadow = true;
    trebuchetArm.receiveShadow = true;
    trebuchetGroup.add(trebuchetArm);

    // Counterweight (sphere)
    var counterweightGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    var counterweight = new THREE.Mesh(counterweightGeometry, metalMaterial);
    counterweight.position.set(-5, 12, 8);
    counterweight.castShadow = true;
    counterweight.receiveShadow = true;
    trebuchetGroup.add(counterweight);

    // Sling attachment point
    var slingGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var sling = new THREE.Mesh(slingGeometry, metalMaterial);
    sling.position.set(-5, 18, 8);
    sling.castShadow = true;
    sling.receiveShadow = true;
    trebuchetGroup.add(sling);

    scene.add(trebuchetGroup);
    sceneObjects.push(trebuchetGroup);
  }

  function createHiddenArmory() {
    var armoryGroup = new THREE.Group();
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });

    // Armory chamber carved into cliff
    var armoryGeometry = new THREE.BoxGeometry(6, 5, 8);
    var armory = new THREE.Mesh(armoryGeometry, stoneMaterial);
    armory.position.set(0, 8, -20);
    armory.castShadow = true;
    armory.receiveShadow = true;
    armoryGroup.add(armory);

    // Weapon racks (shelves)
    var shelfGeometry = new THREE.BoxGeometry(5, 0.3, 2);
    var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });

    for (var i = 0; i < 3; i++) {
      var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelf.position.set(0, 6 + i * 1.3, -18);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      armoryGroup.add(shelf);
    }

    // Weapon indicators (small boxes on shelves)
    var weaponGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

    for (var j = 0; j < 3; j++) {
      for (var k = 0; k < 4; k++) {
        var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(-2 + k * 1.2, 6.5 + j * 1.3, -18);
        weapon.castShadow = true;
        weapon.receiveShadow = true;
        armoryGroup.add(weapon);
      }
    }

    scene.add(armoryGroup);
    sceneObjects.push(armoryGroup);
  }

  function createArrowSlits() {
    // Arrow slit windows in fortress walls
    var slitMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x222222 });

    var slitPositions = [
      { x: -6, y: 16, z: 5 },
      { x: -2, y: 16, z: 5 },
      { x: 2, y: 16, z: 5 },
      { x: 6, y: 16, z: 5 },
      { x: -10, y: 16, z: -3 },
      { x: 10, y: 16, z: -3 }
    ];

    slitPositions.forEach(function(pos) {
      var slitGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.5);
      var slit = new THREE.Mesh(slitGeometry, slitMaterial);
      slit.position.set(pos.x, pos.y, pos.z);
      slit.castShadow = true;
      slit.receiveShadow = true;
      scene.add(slit);
      sceneObjects.push(slit);
    });
  }

  function createMurderHoles() {
    // Murder holes in parapet floor
    var holeGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
    var holeMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x1a1a1a });

    var holePositions = [
      { x: -8, y: 19.1, z: 5 },
      { x: 0, y: 19.1, z: 5 },
      { x: 8, y: 19.1, z: 5 }
    ];

    holePositions.forEach(function(pos) {
      var hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(pos.x, pos.y, pos.z);
      hole.castShadow = true;
      hole.receiveShadow = true;
      scene.add(hole);
      sceneObjects.push(hole);
    });
  }

  function createWallDecorations() {
    // Banner/flag elements, torches on walls
    var torchGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    var torchMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    var wallTorchPositions = [
      { x: -8, y: 17, z: 5 },
      { x: 0, y: 17, z: 5 },
      { x: 8, y: 17, z: 5 }
    ];

    wallTorchPositions.forEach(function(pos) {
      var torch = new THREE.Mesh(torchGeometry, torchMaterial);
      torch.position.set(pos.x, pos.y, pos.z);
      torch.castShadow = true;
      torch.receiveShadow = true;
      scene.add(torch);
      sceneObjects.push(torch);

      // Torch flame light
      var flameLight = new THREE.PointLight(0xFF8800, 0.4, 8);
      flameLight.position.set(pos.x, pos.y + 0.6, pos.z + 0.2);
      flameLight.castShadow = true;
      scene.add(flameLight);
      torchLights.push({ light: flameLight, intensity: 0.4 });
    });
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    torchLights = [];
    cliffRocks = [];

    // Create all fortress elements
    createCliffRockFace();
    createFortressWalls();
    createBastions();
    createDrawbridge();
    createCavePassages();
    createCliffFaceHandholds();
    createBoilingOilCauldron();
    createTrebuchet();
    createHiddenArmory();
    createArrowSlits();
    createMurderHoles();
    createWallDecorations();

    // Add ambient light for cliff textures
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    return {
      objectCount: sceneObjects.length,
      torchLightCount: torchLights.length
    };
  }

  function update(delta) {
    // Cauldron oil bubbling - emissive pulse
    animationState.cauldronPulse += delta * 2;
    if (cauldronMaterial && cauldronMesh) {
      var pulse = 0.2 + Math.sin(animationState.cauldronPulse) * 0.2;
      cauldronMaterial.emissiveIntensity = pulse;
      // Scale cauldron slightly for boiling effect
      cauldronMesh.scale.y = 1 + Math.sin(animationState.cauldronPulse * 0.5) * 0.05;
    }

    // Trebuchet arm slowly rotating (cocking)
    if (trebuchetArm) {
      animationState.trebuchetAngle += delta * 0.3;
      var cockAngle = Math.sin(animationState.trebuchetAngle) * 0.3;
      trebuchetArm.rotation.z = cockAngle;
    }

    // Drawbridge raising and lowering
    if (drawbridgeMesh) {
      animationState.drawbridgeHeight += delta * 0.5;
      var bridgeAngle = Math.sin(animationState.drawbridgeHeight) * 0.4;
      drawbridgeMesh.rotation.z = bridgeAngle;
      drawbridgeMesh.position.y = 8 + Math.sin(animationState.drawbridgeHeight * 0.5) * 1;
    }

    // Torch flicker animation
    if (torchLights.length > 0) {
      animationState.torchFlicker += delta * 4;
      torchLights.forEach(function(torchData) {
        var flicker = torchData.intensity * (0.8 + Math.sin(animationState.torchFlicker + Math.random()) * 0.2);
        torchData.light.intensity = flicker;
      });
    }

    // Wind sway - subtle rock movement
    if (cliffRocks.length > 0) {
      animationState.windSway += delta * 0.5;
      cliffRocks.forEach(function(rock) {
        var swayAmount = Math.sin(animationState.windSway) * 0.02;
        rock.rotation.z = swayAmount;
      });
    }

    // Oil drip particles effect
    animationState.oilDrip += delta;
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
      scene.remove(obj);
    });

    // Clean up lights
    torchLights.forEach(function(torchData) {
      scene.remove(torchData.light);
    });

    sceneObjects = [];
    torchLights = [];
    cliffRocks = [];
    cauldronMesh = null;
    cauldronMaterial = null;
    trebuchetArm = null;
    drawbridgeMesh = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
