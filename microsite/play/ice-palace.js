var window = window || {};

window.IcePalace = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatingObjects = [];
  var particleSystems = [];
  var elapsedTime = 0;

  // Color palette
  var COLOR_ICE_BLUE = 0xAADDFF;
  var COLOR_CRYSTAL_WHITE = 0xEEFFFF;
  var COLOR_FROZEN_SHADOW = 0x6688AA;
  var COLOR_SNOW_WHITE = 0xFFFFFF;
  var COLOR_GOLD_GLOW = 0xFFD700;

  function createOuterWalls() {
    // Translucent ice palace outer walls
    var wallGeometry = new THREE.BoxGeometry(40, 20, 40);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_ICE_BLUE,
      metalness: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6
    });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, 10, 0);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    sceneObjects.push(wall);

    // Add edge details to walls with LineSegments
    var edgeGeometry = new THREE.BufferGeometry();
    var edgePositions = [
      -20, 0, -20, -20, 20, -20,
      20, 0, -20, 20, 20, -20,
      -20, 0, 20, -20, 20, 20,
      20, 0, 20, 20, 20, 20,
      -20, 0, -20, 20, 0, -20,
      -20, 0, 20, 20, 0, 20,
      -20, 20, -20, 20, 20, -20,
      -20, 20, 20, 20, 20, 20
    ];
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgePositions), 3));
    var edgeMaterial = new THREE.LineBasicMaterial({ color: COLOR_CRYSTAL_WHITE, linewidth: 2 });
    var edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.set(0, 10, 0);
    scene.add(edges);
    sceneObjects.push(edges);
  }

  function createSpireTowers() {
    // Four tall crystal spire towers at corners
    var corners = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 18 },
      { x: 18, z: 18 }
    ];

    corners.forEach(function(corner) {
      // Main spire cylinder
      var spireGeometry = new THREE.CylinderGeometry(2, 3, 25, 8);
      var spireMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_FROZEN_SHADOW,
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0x3366AA,
        emissiveIntensity: 0.3
      });
      var spire = new THREE.Mesh(spireGeometry, spireMaterial);
      spire.position.set(corner.x, 12.5, corner.z);
      spire.castShadow = true;
      spire.receiveShadow = true;
      scene.add(spire);
      sceneObjects.push(spire);

      // Cone tip on spire
      var coneGeometry = new THREE.ConeGeometry(2, 6, 8);
      var coneMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_CRYSTAL_WHITE,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0x88BBFF,
        emissiveIntensity: 0.4
      });
      var cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(corner.x, 25, corner.z);
      cone.castShadow = true;
      cone.receiveShadow = true;
      scene.add(cone);
      sceneObjects.push(cone);
      animatingObjects.push({ object: cone, type: 'spireGlint', startY: 25 });
    });
  }

  function createThroneRoom() {
    // Throne room dais
    var daisGeometry = new THREE.BoxGeometry(12, 1, 12);
    var daisMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_FROZEN_SHADOW,
      metalness: 0.4,
      roughness: 0.5
    });
    var dais = new THREE.Mesh(daisGeometry, daisMaterial);
    dais.position.set(0, 0.5, 15);
    dais.castShadow = true;
    dais.receiveShadow = true;
    scene.add(dais);
    sceneObjects.push(dais);

    // Throne structure - stacked boxes
    var throneBaseGeometry = new THREE.BoxGeometry(4, 1, 4);
    var throneMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_GOLD_GLOW,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.6
    });
    var throneBase = new THREE.Mesh(throneBaseGeometry, throneMaterial);
    throneBase.position.set(0, 1.5, 15);
    throneBase.castShadow = true;
    throneBase.receiveShadow = true;
    scene.add(throneBase);
    sceneObjects.push(throneBase);
    animatingObjects.push({ object: throneBase, type: 'thronePulse', intensity: 0.6 });

    var throneBackGeometry = new THREE.BoxGeometry(4, 3, 1);
    var throneBack = new THREE.Mesh(throneBackGeometry, throneMaterial);
    throneBack.position.set(0, 3, 15.5);
    throneBack.castShadow = true;
    throneBack.receiveShadow = true;
    scene.add(throneBack);
    sceneObjects.push(throneBack);
    animatingObjects.push({ object: throneBack, type: 'thronePulse', intensity: 0.6 });

    var throneArmGeometry = new THREE.BoxGeometry(0.8, 2, 4);
    var leftArm = new THREE.Mesh(throneArmGeometry, throneMaterial);
    leftArm.position.set(-2.2, 2.5, 15);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    scene.add(leftArm);
    sceneObjects.push(leftArm);

    var rightArm = new THREE.Mesh(throneArmGeometry, throneMaterial);
    rightArm.position.set(2.2, 2.5, 15);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    scene.add(rightArm);
    sceneObjects.push(rightArm);
  }

  function createIceMirrorPanels() {
    // Reflective ice mirror panels lining the gallery
    var mirrorPositions = [
      { x: -15, z: 0 },
      { x: -15, z: 8 },
      { x: -15, z: -8 },
      { x: 15, z: 0 },
      { x: 15, z: 8 },
      { x: 15, z: -8 },
      { x: 0, z: -15 },
      { x: 8, z: -15 },
      { x: -8, z: -15 }
    ];

    mirrorPositions.forEach(function(pos) {
      var mirrorGeometry = new THREE.BoxGeometry(1, 10, 8);
      var mirrorMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_ICE_BLUE,
        metalness: 0.9,
        roughness: 0.05,
        emissive: 0x5588DD,
        emissiveIntensity: 0.3
      });
      var mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
      mirror.position.set(pos.x, 5, pos.z);
      mirror.castShadow = true;
      mirror.receiveShadow = true;
      scene.add(mirror);
      sceneObjects.push(mirror);
      animatingObjects.push({ object: mirror, type: 'mirrorShimmer', intensity: 0.3 });
    });
  }

  function createCrystalChandeliers() {
    // Crystal chandeliers hanging from ceiling
    var chandelierPositions = [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: -8, z: 8 },
      { x: 8, z: 8 },
      { x: 0, z: 0 }
    ];

    chandelierPositions.forEach(function(pos) {
      // Main crystal sphere
      var crystalGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      var crystalMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_CRYSTAL_WHITE,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0xAAEEFF,
        emissiveIntensity: 0.5
      });
      var crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(pos.x, 18, pos.z);
      crystal.castShadow = true;
      crystal.receiveShadow = true;
      scene.add(crystal);
      sceneObjects.push(crystal);
      animatingObjects.push({ object: crystal, type: 'chandelier', intensity: 0.5 });

      // Hanging crystal cylinders
      for (var i = 0; i < 4; i++) {
        var angle = (Math.PI * 2 / 4) * i;
        var hangX = pos.x + Math.cos(angle) * 1.2;
        var hangZ = pos.z + Math.sin(angle) * 1.2;

        var hangGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
        var hangMaterial = new THREE.MeshStandardMaterial({
          color: COLOR_CRYSTAL_WHITE,
          metalness: 0.9,
          roughness: 0.05,
          emissive: 0x88CCFF,
          emissiveIntensity: 0.4
        });
        var hang = new THREE.Mesh(hangGeometry, hangMaterial);
        hang.position.set(hangX, 16.5, hangZ);
        hang.castShadow = true;
        hang.receiveShadow = true;
        scene.add(hang);
        sceneObjects.push(hang);
        animatingObjects.push({ object: hang, type: 'chandelier', intensity: 0.4, offset: i });
      }
    });
  }

  function createFrozenPrisonerBlocks() {
    // Transparent ice blocks with frozen prisoners inside
    var prisonerPositions = [
      { x: -10, z: -5 },
      { x: -10, z: 5 },
      { x: 10, z: -5 },
      { x: 10, z: 5 },
      { x: -5, z: -10 },
      { x: 5, z: -10 }
    ];

    prisonerPositions.forEach(function(pos) {
      // Ice block
      var iceBlockGeometry = new THREE.BoxGeometry(2.5, 4, 2.5);
      var iceBlockMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_ICE_BLUE,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.7,
        emissive: 0x3366BB,
        emissiveIntensity: 0.4
      });
      var iceBlock = new THREE.Mesh(iceBlockGeometry, iceBlockMaterial);
      iceBlock.position.set(pos.x, 2, pos.z);
      iceBlock.castShadow = true;
      iceBlock.receiveShadow = true;
      scene.add(iceBlock);
      sceneObjects.push(iceBlock);
      animatingObjects.push({ object: iceBlock, type: 'prisonerGlow', intensity: 0.5 });

      // Humanoid shape inside (small cylinders and spheres)
      var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.2,
        roughness: 0.6
      });
      var head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(pos.x, 3.2, pos.z);
      scene.add(head);
      sceneObjects.push(head);

      var bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 6);
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 2, pos.z);
      scene.add(body);
      sceneObjects.push(body);
    });
  }

  function createCourtyard() {
    // Courtyard floor with ice tiles
    var tileSize = 2;
    for (var x = -15; x < 15; x += tileSize) {
      for (var z = -15; z < 15; z += tileSize) {
        var tileGeometry = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
        var tileMaterial = new THREE.MeshStandardMaterial({
          color: (x + z) % 4 === 0 ? COLOR_SNOW_WHITE : COLOR_ICE_BLUE,
          metalness: 0.5,
          roughness: 0.6
        });
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x + tileSize / 2, 0, z + tileSize / 2);
        tile.receiveShadow = true;
        scene.add(tile);
        sceneObjects.push(tile);
      }
    }
  }

  function createArchways() {
    // Entrance arch frames
    var archPositions = [
      { x: -20, z: 0, rotY: Math.PI / 2 },
      { x: 20, z: 0, rotY: Math.PI / 2 },
      { x: 0, z: -20, rotY: 0 }
    ];

    archPositions.forEach(function(pos) {
      // Arch base
      var archGeometry = new THREE.CylinderGeometry(3, 3, 1, 12, 1, true);
      var archMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_FROZEN_SHADOW,
        metalness: 0.4,
        roughness: 0.5
      });
      var arch = new THREE.Mesh(archGeometry, archMaterial);
      arch.position.set(pos.x, 6, pos.z);
      arch.rotation.z = Math.PI / 2;
      arch.castShadow = true;
      arch.receiveShadow = true;
      scene.add(arch);
      sceneObjects.push(arch);

      // Left column
      var colGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
      var colMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_FROZEN_SHADOW,
        metalness: 0.5,
        roughness: 0.4
      });
      var leftCol = new THREE.Mesh(colGeometry, colMaterial);
      leftCol.position.set(pos.x - 3, 4, pos.z);
      leftCol.castShadow = true;
      leftCol.receiveShadow = true;
      scene.add(leftCol);
      sceneObjects.push(leftCol);

      // Right column
      var rightCol = new THREE.Mesh(colGeometry, colMaterial);
      rightCol.position.set(pos.x + 3, 4, pos.z);
      rightCol.castShadow = true;
      rightCol.receiveShadow = true;
      scene.add(rightCol);
      sceneObjects.push(rightCol);
    });
  }

  function createSnowDrifts() {
    // Snow drift mounds around the perimeter
    var driftPositions = [
      { x: -22, z: 5 }, { x: -22, z: -5 },
      { x: 22, z: 5 }, { x: 22, z: -5 },
      { x: 5, z: -22 }, { x: -5, z: -22 }
    ];

    driftPositions.forEach(function(pos) {
      var driftGeometry = new THREE.SphereGeometry(2.5, 8, 6);
      var driftMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_SNOW_WHITE,
        metalness: 0.1,
        roughness: 0.8
      });
      var drift = new THREE.Mesh(driftGeometry, driftMaterial);
      drift.scale.set(1, 0.5, 1.5);
      drift.position.set(pos.x, 1.2, pos.z);
      drift.castShadow = true;
      drift.receiveShadow = true;
      scene.add(drift);
      sceneObjects.push(drift);
    });
  }

  function createIceColumnPillars() {
    // Ice column pillars supporting the structure
    var pillarPositions = [
      { x: -10, z: 0 }, { x: 10, z: 0 },
      { x: 0, z: -10 }, { x: 0, z: 10 },
      { x: -6, z: -6 }, { x: 6, z: 6 }
    ];

    pillarPositions.forEach(function(pos) {
      var pillarGeometry = new THREE.CylinderGeometry(1.2, 1.5, 15, 8);
      var pillarMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_ICE_BLUE,
        metalness: 0.6,
        roughness: 0.3,
        emissive: 0x4477CC,
        emissiveIntensity: 0.2
      });
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 7.5, pos.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);
      sceneObjects.push(pillar);
    });
  }

  function createFrozenFountain() {
    // Frozen fountain centerpiece
    var fountainBaseGeometry = new THREE.CylinderGeometry(3, 3.5, 1.5, 16);
    var fountainMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_FROZEN_SHADOW,
      metalness: 0.4,
      roughness: 0.5
    });
    var fountainBase = new THREE.Mesh(fountainBaseGeometry, fountainMaterial);
    fountainBase.position.set(0, 0.75, -10);
    fountainBase.castShadow = true;
    fountainBase.receiveShadow = true;
    scene.add(fountainBase);
    sceneObjects.push(fountainBase);

    // Central fountain column
    var fountainColGeometry = new THREE.CylinderGeometry(0.8, 1.2, 4, 12);
    var fountainColMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_CRYSTAL_WHITE,
      metalness: 0.8,
      roughness: 0.1,
      emissive: 0x88DDFF,
      emissiveIntensity: 0.4
    });
    var fountainCol = new THREE.Mesh(fountainColGeometry, fountainColMaterial);
    fountainCol.position.set(0, 2.75, -10);
    fountainCol.castShadow = true;
    fountainCol.receiveShadow = true;
    scene.add(fountainCol);
    sceneObjects.push(fountainCol);
    animatingObjects.push({ object: fountainCol, type: 'fountainGlow', intensity: 0.5 });

    // Fountain basin
    var basinGeometry = new THREE.CylinderGeometry(2.2, 2.8, 0.8, 16);
    var basinMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_ICE_BLUE,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8
    });
    var basin = new THREE.Mesh(basinGeometry, basinMaterial);
    basin.position.set(0, 1.4, -10);
    basin.castShadow = true;
    basin.receiveShadow = true;
    scene.add(basin);
    sceneObjects.push(basin);
  }

  function createTreasureRoom() {
    // Treasure room with ice-encased gold
    var treasureChestGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
    var treasureMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_GOLD_GLOW,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xFFDD00,
      emissiveIntensity: 0.7
    });
    var treasureChest = new THREE.Mesh(treasureChestGeometry, treasureMaterial);
    treasureChest.position.set(-12, 1.5, -12);
    treasureChest.castShadow = true;
    treasureChest.receiveShadow = true;
    scene.add(treasureChest);
    sceneObjects.push(treasureChest);
    animatingObjects.push({ object: treasureChest, type: 'treasureGlow', intensity: 0.7 });

    // Ice encasement around treasure
    var encaseGeometry = new THREE.BoxGeometry(3, 2.5, 2.5);
    var encaseMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_ICE_BLUE,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6
    });
    var encase = new THREE.Mesh(encaseGeometry, encaseMaterial);
    encase.position.set(-12, 1.5, -12);
    encase.castShadow = true;
    encase.receiveShadow = true;
    scene.add(encase);
    sceneObjects.push(encase);

    // Gold coins scattered
    for (var i = 0; i < 5; i++) {
      var coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
      var coinMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_GOLD_GLOW,
        metalness: 0.9,
        roughness: 0.1
      });
      var coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(-12 + (i - 2) * 0.5, 0.3 + Math.sin(i) * 0.2, -12);
      coin.rotation.x = Math.PI / 4;
      coin.castShadow = true;
      coin.receiveShadow = true;
      scene.add(coin);
      sceneObjects.push(coin);
    }
  }

  function createGuardPostTurrets() {
    // Guard post turrets with ice cannons
    var turretPositions = [
      { x: -15, z: 15 },
      { x: 15, z: 15 },
      { x: 15, z: -15 }
    ];

    turretPositions.forEach(function(pos) {
      // Turret base
      var turretBaseGeometry = new THREE.CylinderGeometry(1.5, 2, 2, 8);
      var turretMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_FROZEN_SHADOW,
        metalness: 0.5,
        roughness: 0.4
      });
      var turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
      turretBase.position.set(pos.x, 2, pos.z);
      turretBase.castShadow = true;
      turretBase.receiveShadow = true;
      scene.add(turretBase);
      sceneObjects.push(turretBase);

      // Cannon barrel
      var cannonGeometry = new THREE.CylinderGeometry(0.4, 0.45, 3, 8);
      var cannonMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
      });
      var cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
      cannon.position.set(pos.x, 3.5, pos.z);
      cannon.rotation.z = Math.PI / 6;
      cannon.castShadow = true;
      cannon.receiveShadow = true;
      scene.add(cannon);
      sceneObjects.push(cannon);

      // Cannon ball
      var ballGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.9,
        roughness: 0.1
      });
      var ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.set(pos.x + 1.5, 4.2, pos.z);
      ball.castShadow = true;
      ball.receiveShadow = true;
      scene.add(ball);
      sceneObjects.push(ball);
    });
  }

  function createBlizzardParticles() {
    // Create particle system for swirling snow
    for (var i = 0; i < 40; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_SNOW_WHITE,
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0xDDEEFF,
        emissiveIntensity: 0.2
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 50,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 50
      );
      particle.castShadow = false;
      particle.receiveShadow = false;
      scene.add(particle);
      particleSystems.push({
        mesh: particle,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.5,
        originalY: particle.position.y
      });
    }
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    animatingObjects = [];
    particleSystems = [];
    elapsedTime = 0;

    createOuterWalls();
    createSpireTowers();
    createThroneRoom();
    createIceMirrorPanels();
    createCrystalChandeliers();
    createFrozenPrisonerBlocks();
    createCourtyard();
    createArchways();
    createSnowDrifts();
    createIceColumnPillars();
    createFrozenFountain();
    createTreasureRoom();
    createGuardPostTurrets();
    createBlizzardParticles();
  }

  function updateChandelierRotation(obj, delta) {
    obj.object.rotation.y += delta * 0.3;
    obj.object.position.y += Math.sin(elapsedTime + (obj.offset || 0)) * 0.02;
  }

  function updateMirrorShimmer(obj, delta) {
    var shimmer = 0.3 + Math.sin(elapsedTime * 2) * 0.15;
    obj.object.material.emissiveIntensity = shimmer;
    obj.object.material.opacity = 0.5 + Math.sin(elapsedTime * 1.5) * 0.1;
  }

  function updatePrisonerGlow(obj, delta) {
    var glow = 0.4 + Math.sin(elapsedTime * 1.2) * 0.2;
    obj.object.material.emissiveIntensity = glow;
  }

  function updateThronePulse(obj, delta) {
    var pulse = 0.6 + Math.sin(elapsedTime * 0.8) * 0.3;
    obj.object.material.emissiveIntensity = pulse;
  }

  function updateSpireGlint(obj, delta) {
    var glint = 0.3 + Math.sin(elapsedTime * 1.5 + obj.object.position.x) * 0.2;
    obj.object.material.emissiveIntensity = glint;
    obj.object.scale.y = 1 + Math.sin(elapsedTime * 0.5) * 0.05;
  }

  function updateFountainGlow(obj, delta) {
    var glow = 0.4 + Math.sin(elapsedTime * 2) * 0.3;
    obj.object.material.emissiveIntensity = glow;
  }

  function updateTreasureGlow(obj, delta) {
    var glow = 0.7 + Math.sin(elapsedTime * 3) * 0.3;
    obj.object.material.emissiveIntensity = glow;
  }

  function updateParticles(delta) {
    for (var i = 0; i < particleSystems.length; i++) {
      var p = particleSystems[i];
      p.mesh.position.x += p.vx;
      p.mesh.position.y += p.vy;
      p.mesh.position.z += p.vz;

      if (p.mesh.position.y < 0) {
        p.mesh.position.y = 25;
        p.mesh.position.x = (Math.random() - 0.5) * 50;
        p.mesh.position.z = (Math.random() - 0.5) * 50;
      }

      p.mesh.rotation.x += 0.01;
      p.mesh.rotation.z += 0.015;
    }
  }

  function update(delta) {
    elapsedTime += delta;

    for (var i = 0; i < animatingObjects.length; i++) {
      var obj = animatingObjects[i];
      switch (obj.type) {
        case 'chandelier':
          updateChandelierRotation(obj, delta);
          break;
        case 'mirrorShimmer':
          updateMirrorShimmer(obj, delta);
          break;
        case 'prisonerGlow':
          updatePrisonerGlow(obj, delta);
          break;
        case 'thronePulse':
          updateThronePulse(obj, delta);
          break;
        case 'spireGlint':
          updateSpireGlint(obj, delta);
          break;
        case 'fountainGlow':
          updateFountainGlow(obj, delta);
          break;
        case 'treasureGlow':
          updateTreasureGlow(obj, delta);
          break;
      }
    }

    updateParticles(delta);
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    for (var j = 0; j < particleSystems.length; j++) {
      scene.remove(particleSystems[j].mesh);
    }
    sceneObjects = [];
    animatingObjects = [];
    particleSystems = [];
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
