window.DustValley = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var particles = [];
  var dustSwirl = null;
  var sandDustParticles = null;
  var time = 0;
  var lightFlicker = [];

  var COLOR_SAND = 0xC2A574;
  var COLOR_RUST = 0x8B4513;
  var COLOR_DARK_SAND = 0x9B7E47;
  var COLOR_METAL = 0x555555;
  var COLOR_CONCRETE = 0x888888;
  var COLOR_BLOOD = 0xA83232;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    lights = [];
    particles = [];
    time = 0;
    lightFlicker = [];

    // Set scene fog for atmospheric effect
    scene.fog = new THREE.Fog(0xD4A574, 40, 200);
    scene.background = new THREE.Color(0xE8D4B8);

    // Ambient light for base illumination
    var ambientLight = new THREE.AmbientLight(0xFFD699, 0.6);
    scene.add(ambientLight);

    // Main sun-like directional light
    var sunLight = new THREE.DirectionalLight(0xFFF9E6, 0.8);
    sunLight.position.set(60, 80, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 300;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    scene.add(sunLight);
    lights.push(sunLight);

    // Flicker lights at sniper positions and camps
    var flickerLight1 = new THREE.PointLight(0xFF6B35, 0.5, 40);
    flickerLight1.position.set(-25, 15, 20);
    scene.add(flickerLight1);
    lights.push(flickerLight1);
    lightFlicker.push({ light: flickerLight1, intensity: 0.5, phase: 0 });

    var flickerLight2 = new THREE.PointLight(0xFF6B35, 0.4, 35);
    flickerLight2.position.set(30, 10, -30);
    scene.add(flickerLight2);
    lights.push(flickerLight2);
    lightFlicker.push({ light: flickerLight2, intensity: 0.4, phase: Math.PI / 3 });

    var flickerLight3 = new THREE.PointLight(0xFFD700, 0.3, 30);
    flickerLight3.position.set(10, 8, 35);
    scene.add(flickerLight3);
    lights.push(flickerLight3);
    lightFlicker.push({ light: flickerLight3, intensity: 0.3, phase: (2 * Math.PI) / 3 });

    // Ground plane (sand base)
    var groundGeom = new THREE.BoxGeometry(80, 2, 80);
    var groundMat = new THREE.MeshStandardMaterial({ color: COLOR_SAND, roughness: 0.9 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, -1, 0);
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    // SANDSTONE ARCHES (crumbling canyon walls)
    createArchWall(-35, 0, 0, 0xFF8C00);
    createArchWall(35, 0, -10, 0xDAA520);

    // OIL RIGS (rusted industrial structures)
    createOilRig(-30, 0, -30);
    createOilRig(25, 0, 25);

    // PIPELINE NETWORKS
    createPipelineSection(0, 5, -20);
    createPipelineSection(15, 3, 10);
    createPipelineSection(-20, 4, 30);

    // SAND DUNES
    createSandDune(-40, 0, 40, 15, 8);
    createSandDune(40, 0, -40, 12, 6);
    createSandDune(20, 0, -30, 10, 5);

    // MILITARY VEHICLES IN SAND
    createStruckVehicle(-15, 0, 15);
    createStruckVehicle(20, 0, -25);

    // IED CRATERS
    createCrater(-10, 0.5, -10, 8);
    createCrater(28, 0.5, 15, 6);

    // SANDBAG BARRIERS (sniper positions)
    createSandbagWall(-25, 0, 25, 20, 1.5);
    createSandbagWall(30, 0, 20, 15, 1.2);
    createSandbagWall(-5, 0, -35, 18, 1.3);

    // BEDOUIN CAMP REMNANTS
    createCampTent(10, 0, 20);
    createCampTent(-30, 0, 10);

    // CRATES AND COVER OBJECTS
    createCratePile(0, 0, 0, 3);
    createCratePile(-35, 0, 15, 2);
    createCratePile(35, 0, -20, 2);
    createCratePile(15, 0, -20, 2);

    // RUSTED FENCE LINE
    createRustedFence(-40, 2, 10, 50);
    createRustedFence(35, 2, -35, 40);

    // BURIED RUINS (stacked stones)
    createBuriedRuins(0, 0, 35);
    createBuriedRuins(-20, 0, -25);

    // WATCH TOWER
    createWatchTower(38, 0, 35);

    // HIGH GROUND RIDGE
    createRidge(-38, 5, -35, 25, 3);

    // Initialize dust and sand particle system
    initDustParticles();
  }

  function createArchWall(x, y, z, color) {
    // Main arch cylinder
    var archGeom = new THREE.CylinderGeometry(12, 12, 3, 16);
    var archMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
    var arch = new THREE.Mesh(archGeom, archMat);
    arch.position.set(x, y + 15, z);
    arch.castShadow = true;
    arch.receiveShadow = true;
    scene.add(arch);
    meshes.push(arch);

    // Crumbling blocks on arch
    for (var i = 0; i < 4; i++) {
      var blockGeom = new THREE.BoxGeometry(3, 3, 3);
      var blockMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.85 });
      var block = new THREE.Mesh(blockGeom, blockMat);
      block.position.set(x + (i - 1.5) * 4, y + 18 + Math.random() * 2, z + Math.random() * 3);
      block.rotation.z = Math.random() * 0.3;
      block.castShadow = true;
      block.receiveShadow = true;
      scene.add(block);
      meshes.push(block);
    }

    // Support pillar
    var pillarGeom = new THREE.BoxGeometry(4, 20, 4);
    var pillarMat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_SAND, roughness: 0.9 });
    var pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(x + 8, y + 10, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
    meshes.push(pillar);
  }

  function createOilRig(x, y, z) {
    // Main derrick tower (vertical cylinder)
    var towerGeom = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
    var towerMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.9 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(x, y + 20, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);

    // Cross braces (cylinders)
    for (var i = 0; i < 3; i++) {
      var braceGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
      var braceMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.95 });
      var brace = new THREE.Mesh(braceGeom, braceMat);
      brace.position.set(x + 8, y + 10 + i * 10, z);
      brace.rotation.z = Math.PI / 4;
      brace.castShadow = true;
      brace.receiveShadow = true;
      scene.add(brace);
      meshes.push(brace);
    }

    // Platform at top
    var platformGeom = new THREE.BoxGeometry(10, 1, 10);
    var platformMat = new THREE.MeshStandardMaterial({ color: COLOR_METAL, roughness: 0.7 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(x, y + 40, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    meshes.push(platform);

    // Base foundation
    var baseGeom = new THREE.BoxGeometry(18, 2, 18);
    var baseMat = new THREE.MeshStandardMaterial({ color: COLOR_CONCRETE, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x, y + 0.5, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    meshes.push(base);
  }

  function createPipelineSection(x, y, z) {
    var segmentLength = 15;
    for (var i = 0; i < 2; i++) {
      var pipeGeom = new THREE.CylinderGeometry(0.6, 0.6, segmentLength, 12);
      var pipeMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.85 });
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(x + i * 6, y, z);
      pipe.rotation.z = Math.PI / 2.5;
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      meshes.push(pipe);

      // Coupling joints
      var jointGeom = new THREE.SphereGeometry(1, 8, 8);
      var jointMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
      var joint = new THREE.Mesh(jointGeom, jointMat);
      joint.position.set(x + i * 6 + 8, y + 5, z + 3);
      joint.castShadow = true;
      joint.receiveShadow = true;
      scene.add(joint);
      meshes.push(joint);
    }
  }

  function createSandDune(x, y, z, width, height) {
    var duneGeom = new THREE.ConeGeometry(width, height, 12);
    var duneMat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_SAND, roughness: 0.95 });
    var dune = new THREE.Mesh(duneGeom, duneMat);
    dune.position.set(x, y + height / 2, z);
    dune.castShadow = true;
    dune.receiveShadow = true;
    scene.add(dune);
    meshes.push(dune);
  }

  function createStruckVehicle(x, y, z) {
    // Vehicle body (main box)
    var bodyGeom = new THREE.BoxGeometry(8, 4, 3);
    var bodyMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.9 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(x, y + 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    // Cabin (smaller box on top)
    var cabinGeom = new THREE.BoxGeometry(4, 2.5, 3);
    var cabinMat = new THREE.MeshStandardMaterial({ color: 0x704020, roughness: 0.85 });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(x - 1.5, y + 4.5, z);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    meshes.push(cabin);

    // Wheels (spheres)
    for (var i = 0; i < 2; i++) {
      var wheelGeom = new THREE.SphereGeometry(1.2, 12, 12);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(x - 2 + i * 4, y + 1.2, z - 2);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      scene.add(wheel);
      meshes.push(wheel);

      var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
      wheel2.position.set(x - 2 + i * 4, y + 1.2, z + 2);
      wheel2.castShadow = true;
      wheel2.receiveShadow = true;
      scene.add(wheel2);
      meshes.push(wheel2);
    }

    // Gun turret
    var turretGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 10);
    var turretMat = new THREE.MeshStandardMaterial({ color: COLOR_METAL, roughness: 0.75 });
    var turret = new THREE.Mesh(turretGeom, turretMat);
    turret.position.set(x, y + 5, z);
    turret.castShadow = true;
    turret.receiveShadow = true;
    scene.add(turret);
    meshes.push(turret);
  }

  function createCrater(x, y, z, radius) {
    // Crater depression (inverse cone)
    var craterGeom = new THREE.ConeGeometry(radius, 3, 16);
    var craterMat = new THREE.MeshStandardMaterial({ color: 0x6B5444, roughness: 0.95 });
    var crater = new THREE.Mesh(craterGeom, craterMat);
    crater.position.set(x, y, z);
    crater.scale.set(1, -0.5, 1);
    crater.castShadow = true;
    crater.receiveShadow = true;
    scene.add(crater);
    meshes.push(crater);

    // Raised rim
    var rimGeom = new THREE.CylinderGeometry(radius + 1, radius, 0.8, 16);
    var rimMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
    var rim = new THREE.Mesh(rimGeom, rimMat);
    rim.position.set(x, y + 0.8, z);
    rim.castShadow = true;
    rim.receiveShadow = true;
    scene.add(rim);
    meshes.push(rim);

    // Scattered rocks (small spheres)
    for (var i = 0; i < 3; i++) {
      var rockGeom = new THREE.SphereGeometry(0.5, 6, 6);
      var rockMat = new THREE.MeshStandardMaterial({ color: COLOR_BLOOD, roughness: 0.95 });
      var rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(x + (Math.random() - 0.5) * radius * 2, y + 0.5, z + (Math.random() - 0.5) * radius * 2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      meshes.push(rock);
    }
  }

  function createSandbagWall(x, y, z, length, height) {
    var bagWidth = 2;
    var bagCount = Math.floor(length / bagWidth);
    for (var i = 0; i < bagCount; i++) {
      var bagGeom = new THREE.BoxGeometry(bagWidth, height, 1.5);
      var bagMat = new THREE.MeshStandardMaterial({ color: COLOR_SAND, roughness: 0.95 });
      var bag = new THREE.Mesh(bagGeom, bagMat);
      bag.position.set(x - length / 2 + i * bagWidth + 1, y + height / 2, z);
      bag.castShadow = true;
      bag.receiveShadow = true;
      scene.add(bag);
      meshes.push(bag);
    }

    // Second layer offset
    for (var j = 0; j < Math.floor(bagCount * 0.7); j++) {
      var bag2Geom = new THREE.BoxGeometry(bagWidth, height * 0.8, 1.5);
      var bag2Mat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_SAND, roughness: 0.95 });
      var bag2 = new THREE.Mesh(bag2Geom, bag2Mat);
      bag2.position.set(x - length / 2 + j * bagWidth * 1.4 + 2, y + height * 1.5, z);
      bag2.castShadow = true;
      bag2.receiveShadow = true;
      scene.add(bag2);
      meshes.push(bag2);
    }
  }

  function createCampTent(x, y, z) {
    // Tent canvas (cone)
    var tentGeom = new THREE.ConeGeometry(4, 5, 8);
    var tentMat = new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.8 });
    var tent = new THREE.Mesh(tentGeom, tentMat);
    tent.position.set(x, y + 2.5, z);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    meshes.push(tent);

    // Center pole (cylinder)
    var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
    var poleMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.8 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(x, y + 2.5, z);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    meshes.push(pole);

    // Guy lines (line segments)
    var lineGeom = new THREE.BufferGeometry();
    var positions = new Float32Array([
      x, y + 5, z,
      x - 3, y + 0.5, z - 2,
      x, y + 5, z,
      x + 3, y + 0.5, z + 2,
      x, y + 5, z,
      x - 2, y + 0.5, z + 3
    ]);
    lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x555555 });
    var lines = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lines);
    meshes.push(lines);

    // Camp supply box
    var boxGeom = new THREE.BoxGeometry(2, 1.5, 2);
    var boxMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.9 });
    var box = new THREE.Mesh(boxGeom, boxMat);
    box.position.set(x + 3, y + 0.75, z - 2);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    meshes.push(box);
  }

  function createCratePile(x, y, z, stackHeight) {
    var crateSize = 1.5;
    for (var layer = 0; layer < stackHeight; layer++) {
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 2; j++) {
          var crateGeom = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
          var crateMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85 });
          var crate = new THREE.Mesh(crateGeom, crateMat);
          crate.position.set(x - crateSize / 2 + i * crateSize, y + layer * crateSize + crateSize / 2, z - crateSize / 2 + j * crateSize);
          crate.castShadow = true;
          crate.receiveShadow = true;
          scene.add(crate);
          meshes.push(crate);
        }
      }
    }
  }

  function createRustedFence(x, y, z, length) {
    var postSpacing = 4;
    var postCount = Math.floor(length / postSpacing);
    for (var i = 0; i < postCount; i++) {
      // Fence post
      var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
      var postMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.9 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(x, y, z + i * postSpacing);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      meshes.push(post);

      // Horizontal rail
      if (i < postCount - 1) {
        var railGeom = new THREE.CylinderGeometry(0.15, 0.15, postSpacing, 6);
        var railMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.95 });
        var rail = new THREE.Mesh(railGeom, railMat);
        rail.position.set(x, y + 1, z + i * postSpacing + postSpacing / 2);
        rail.rotation.z = Math.PI / 2;
        rail.castShadow = true;
        rail.receiveShadow = true;
        scene.add(rail);
        meshes.push(rail);
      }
    }
  }

  function createBuriedRuins(x, y, z) {
    var stoneSize = 1.2;
    var ruinHeight = 3;
    for (var layer = 0; layer < ruinHeight; layer++) {
      for (var i = 0; i < 3; i++) {
        var stoneGeom = new THREE.BoxGeometry(stoneSize, stoneSize * 0.6, stoneSize);
        var stoneMat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_SAND, roughness: 0.95 });
        var stone = new THREE.Mesh(stoneGeom, stoneMat);
        stone.position.set(x - stoneSize + i * stoneSize, y + layer * stoneSize * 0.5, z + (layer % 2) * 0.5);
        stone.rotation.x = (Math.random() - 0.5) * 0.2;
        stone.rotation.z = (Math.random() - 0.5) * 0.2;
        stone.castShadow = true;
        stone.receiveShadow = true;
        scene.add(stone);
        meshes.push(stone);
      }
    }
  }

  function createWatchTower(x, y, z) {
    // Tower base
    var baseGeom = new THREE.CylinderGeometry(6, 6, 2, 12);
    var baseMat = new THREE.MeshStandardMaterial({ color: COLOR_CONCRETE, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(x, y + 1, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    meshes.push(base);

    // Tower shaft
    var shaftGeom = new THREE.CylinderGeometry(5, 5, 20, 12);
    var shaftMat = new THREE.MeshStandardMaterial({ color: COLOR_METAL, roughness: 0.75 });
    var shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.position.set(x, y + 11, z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    scene.add(shaft);
    meshes.push(shaft);

    // Tower top observation deck
    var deckGeom = new THREE.CylinderGeometry(6, 6, 1, 12);
    var deckMat = new THREE.MeshStandardMaterial({ color: COLOR_RUST, roughness: 0.8 });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(x, y + 21, z);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    meshes.push(deck);

    // Railing posts (spheres)
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var railGeom = new THREE.SphereGeometry(0.5, 6, 6);
      var railMat = new THREE.MeshStandardMaterial({ color: COLOR_METAL, roughness: 0.7 });
      var rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(x + Math.cos(angle) * 6, y + 22, z + Math.sin(angle) * 6);
      rail.castShadow = true;
      rail.receiveShadow = true;
      scene.add(rail);
      meshes.push(rail);
    }
  }

  function createRidge(x, y, z, length, height) {
    var ridgeGeom = new THREE.BoxGeometry(length, height, 8);
    var ridgeMat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_SAND, roughness: 0.9 });
    var ridge = new THREE.Mesh(ridgeGeom, ridgeMat);
    ridge.position.set(x, y + height / 2, z);
    ridge.castShadow = true;
    ridge.receiveShadow = true;
    scene.add(ridge);
    meshes.push(ridge);

    // Add rocks on top
    for (var i = 0; i < 4; i++) {
      var rockGeom = new THREE.BoxGeometry(2, 1.5, 2);
      var rockMat = new THREE.MeshStandardMaterial({ color: 0x6B5444, roughness: 0.95 });
      var rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.set(x - length / 3 + i * 5, y + height + 1, z);
      rock.rotation.x = (Math.random() - 0.5) * 0.3;
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      meshes.push(rock);
    }
  }

  function initDustParticles() {
    var particleCount = 1000;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    var velocities = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = Math.random() * 0.1 - 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.PointsMaterial({ color: 0xD4A574, size: 0.3, opacity: 0.4 });
    sandDustParticles = new THREE.Points(geometry, material);
    sandDustParticles.userData.velocities = velocities;
    scene.add(sandDustParticles);
  }

  function update(delta) {
    if (!scene || !camera) return;

    time += delta;

    // Update dust particle swirls
    if (sandDustParticles) {
      var positions = sandDustParticles.geometry.attributes.position.array;
      var velocities = sandDustParticles.userData.velocities;

      for (var i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Swirl effect
        var swirlInfluence = Math.sin(time * 0.5 + positions[i] * 0.05) * 0.02;
        velocities[i] += swirlInfluence;

        // Wrap around bounds
        if (positions[i] > 50) positions[i] = -50;
        if (positions[i] < -50) positions[i] = 50;
        if (positions[i + 2] > 50) positions[i + 2] = -50;
        if (positions[i + 2] < -50) positions[i + 2] = 50;

        // Keep particles in reasonable height
        if (positions[i + 1] > 40) positions[i + 1] = 0;
        if (positions[i + 1] < 0) positions[i + 1] = 40;
      }

      sandDustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update flickering lights
    for (var j = 0; j < lightFlicker.length; j++) {
      var flicker = lightFlicker[j];
      var flickerAmount = Math.sin(time * 3 + flicker.phase) * 0.3 + 0.7;
      flicker.light.intensity = flicker.intensity * flickerAmount;
    }
  }

  function reset() {
    // Clear all meshes
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].geometry) meshes[i].geometry.dispose();
      if (meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var j = 0; j < meshes[i].material.length; j++) {
            meshes[i].material[j].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
      scene.remove(meshes[i]);
    }

    // Clear particles
    if (sandDustParticles) {
      sandDustParticles.geometry.dispose();
      sandDustParticles.material.dispose();
      scene.remove(sandDustParticles);
      sandDustParticles = null;
    }

    // Clear lights
    for (var k = 0; k < lights.length; k++) {
      scene.remove(lights[k]);
    }

    meshes = [];
    lights = [];
    lightFlicker = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
