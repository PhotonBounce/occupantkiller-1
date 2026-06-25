window.WaterfallAmbush = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var spawnPoints = [];
  var waterfall = null;
  var mistParticles = [];
  var fireflies = [];
  var vines = [];
  var guerrillaHides = [];
  var leafCanopy = null;
  var steppingStones = [];
  var updateState = {
    waterfallOffset: 0,
    mistPhase: 0,
    fireflySway: 0,
    leafSway: 0,
    stonePhase: 0
  };

  var COLOR_JUNGLE_DARK = 0x1A4A1A;
  var COLOR_STONE = 0x6B6B5B;
  var COLOR_WATER = 0x2A6A8A;
  var COLOR_MIST = 0xE8F0F8;
  var COLOR_MOSS = 0x3A6A3A;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    mistParticles = [];
    fireflies = [];
    vines = [];
    guerrillaHides = [];
    steppingStones = [];
    spawnPoints = [];

    createCliffFace();
    createWaterfall();
    createMistSpray();
    createPlungePool();
    createCaveBehindWaterfall();
    createJungleTrees();
    createDenseUndergrowth();
    createAncientStoneRuins();
    createVineRopes();
    createSteppingStones();
    createGuerrillaHides();
    createLogBridge();
    createFireflyOrbs();
    createRopeLadder();

    setupSpawnPoints();
  }

  function createCliffFace() {
    var cliffGeometry = new THREE.BoxGeometry(50, 80, 12);
    var cliffMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_STONE,
      roughness: 0.8,
      metalness: 0.1
    });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(-35, 20, 0);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    meshes.push(cliff);

    // Cliff face cracks and texture detail
    var crackGeometry = new THREE.BoxGeometry(30, 60, 1);
    var crackMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A3A,
      roughness: 0.9
    });
    var cracks = new THREE.Mesh(crackGeometry, crackMaterial);
    cracks.position.set(-35, 20, 5);
    scene.add(cracks);
    meshes.push(cracks);
  }

  function createWaterfall() {
    var waterfallGeometry = new THREE.BoxGeometry(12, 60, 8);
    var waterfallMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_WATER,
      transparent: true,
      opacity: 0.7,
      roughness: 0.3,
      metalness: 0.2
    });
    waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
    waterfall.position.set(-35, 10, 5);
    waterfall.castShadow = true;
    waterfall.receiveShadow = true;
    scene.add(waterfall);
    meshes.push(waterfall);

    // Waterfall spray edge
    var sprayGeometry = new THREE.BoxGeometry(14, 60, 1);
    var sprayMaterial = new THREE.MeshStandardMaterial({
      color: 0xA8D8E8,
      transparent: true,
      opacity: 0.4,
      emissive: 0x4A8AA8,
      emissiveIntensity: 0.2
    });
    var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
    spray.position.set(-35, 10, 10);
    scene.add(spray);
    meshes.push(spray);
  }

  function createMistSpray() {
    for (var i = 0; i < 15; i++) {
      var mistGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 1, 8, 8);
      var mistMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_MIST,
        transparent: true,
        opacity: 0.3,
        emissive: 0xCCDDEE,
        emissiveIntensity: 0.1
      });
      var mist = new THREE.Mesh(mistGeometry, mistMaterial);
      mist.position.set(
        -35 + (Math.random() - 0.5) * 20,
        5 + Math.random() * 8,
        5 + (Math.random() - 0.5) * 8
      );
      mist.scale.set(1, 1, 1);
      mist.receiveShadow = true;
      scene.add(mist);
      mistParticles.push({
        mesh: mist,
        baseScale: mist.scale.clone(),
        baseOpacity: 0.3,
        phase: Math.random() * Math.PI * 2
      });
      meshes.push(mist);
    }
  }

  function createPlungePool() {
    var poolGeometry = new THREE.BoxGeometry(40, 3, 35);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A4A6A,
      roughness: 0.4,
      metalness: 0.3
    });
    var pool = new THREE.Mesh(poolGeometry, poolMaterial);
    pool.position.set(-20, -5, 10);
    pool.receiveShadow = true;
    scene.add(pool);
    meshes.push(pool);

    // Pool surface ripple (subtle detail)
    var rippleGeometry = new THREE.BoxGeometry(40, 0.5, 35);
    var rippleMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_WATER,
      transparent: true,
      opacity: 0.5,
      emissive: 0x2A7A9A,
      emissiveIntensity: 0.1
    });
    var ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.set(-20, -3, 10);
    scene.add(ripple);
    meshes.push(ripple);
  }

  function createCaveBehindWaterfall() {
    // Cave entrance hollow
    var caveGeometry = new THREE.BoxGeometry(10, 12, 6);
    var caveMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A1A,
      roughness: 0.9,
      metalness: 0
    });
    var cave = new THREE.Mesh(caveGeometry, caveMaterial);
    cave.position.set(-35, 5, -8);
    cave.receiveShadow = true;
    scene.add(cave);
    meshes.push(cave);

    // Weapon crate 1
    var crate1Geometry = new THREE.BoxGeometry(2, 2, 2);
    var crateMaterial = new THREE.MeshStandardMaterial({
      color: 0x6B5A3D,
      roughness: 0.8
    });
    var crate1 = new THREE.Mesh(crate1Geometry, crateMaterial);
    crate1.position.set(-38, 2, -8);
    crate1.castShadow = true;
    scene.add(crate1);
    meshes.push(crate1);

    // Weapon crate 2
    var crate2 = new THREE.Mesh(crate1Geometry, crateMaterial);
    crate2.position.set(-32, 2, -8);
    crate2.castShadow = true;
    scene.add(crate2);
    meshes.push(crate2);

    // Cave depth detail
    var caveDepthGeometry = new THREE.BoxGeometry(8, 10, 4);
    var caveDepthMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A0A,
      roughness: 0.95
    });
    var caveDepth = new THREE.Mesh(caveDepthGeometry, caveDepthMaterial);
    caveDepth.position.set(-35, 5, -15);
    scene.add(caveDepth);
    meshes.push(caveDepth);
  }

  function createJungleTrees() {
    var treePositions = [
      { x: 10, z: -20 },
      { x: 25, z: -15 },
      { x: -10, z: 25 },
      { x: 5, z: 35 },
      { x: 30, z: 20 },
      { x: -20, z: 10 }
    ];

    treePositions.forEach(function(pos) {
      // Tree trunk
      var trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A3A2A,
        roughness: 0.8
      });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 8, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      meshes.push(trunk);

      // Tree canopy using cone
      var canopyGeometry = new THREE.ConeGeometry(6, 15, 8);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_JUNGLE_DARK,
        roughness: 0.7
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(pos.x, 20, pos.z);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      scene.add(canopy);
      meshes.push(canopy);

      // Additional canopy layer
      var canopy2Geometry = new THREE.ConeGeometry(5, 12, 8);
      var canopy2 = new THREE.Mesh(canopy2Geometry, canopyMaterial);
      canopy2.position.set(pos.x, 25, pos.z);
      canopy2.castShadow = true;
      scene.add(canopy2);
      meshes.push(canopy2);
    });
  }

  function createDenseUndergrowth() {
    var bushPositions = [
      { x: 15, z: 5 },
      { x: -15, z: 15 },
      { x: 20, z: -10 },
      { x: -5, z: 30 },
      { x: 35, z: 5 },
      { x: -25, z: 20 },
      { x: 10, z: 28 },
      { x: 28, z: 32 },
      { x: -20, z: 5 }
    ];

    bushPositions.forEach(function(pos) {
      var bushGeometry = new THREE.SphereGeometry(2.5 + Math.random() * 1.5, 8, 8);
      var bushMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_MOSS,
        roughness: 0.8
      });
      var bush = new THREE.Mesh(bushGeometry, bushMaterial);
      bush.position.set(pos.x, 1.5, pos.z);
      bush.scale.set(1, 0.8, 1);
      bush.castShadow = true;
      bush.receiveShadow = true;
      scene.add(bush);
      meshes.push(bush);
    });
  }

  function createAncientStoneRuins() {
    var ruinPositions = [
      { x: -45, z: 25, sx: 3, sy: 4, sz: 3 },
      { x: -40, z: 28, sx: 2, sy: 5, sz: 2 },
      { x: 35, z: 15, sx: 4, sy: 3, sz: 4 },
      { x: 38, z: 20, sx: 2, sy: 6, sz: 2 },
      { x: -10, z: 40, sx: 3, sy: 4, sz: 3 },
      { x: 5, z: 38, sx: 2, sy: 5, sz: 2 }
    ];

    ruinPositions.forEach(function(ruin) {
      var ruinGeometry = new THREE.BoxGeometry(ruin.sx, ruin.sy, ruin.sz);
      var ruinMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_STONE,
        roughness: 0.9,
        emissive: COLOR_MOSS,
        emissiveIntensity: 0.15
      });
      var ruinMesh = new THREE.Mesh(ruinGeometry, ruinMaterial);
      ruinMesh.position.set(ruin.x, ruin.sy / 2, ruin.z);
      ruinMesh.rotation.z = (Math.random() - 0.5) * 0.3;
      ruinMesh.castShadow = true;
      ruinMesh.receiveShadow = true;
      scene.add(ruinMesh);
      meshes.push(ruinMesh);
    });
  }

  function createVineRopes() {
    var vinePositions = [
      { x: -40, z: 0 },
      { x: -30, z: 2 },
      { x: -28, z: -2 },
      { x: -45, z: -5 }
    ];

    vinePositions.forEach(function(pos) {
      var points = [];
      points.push(new THREE.Vector3(pos.x, 50, pos.z));
      points.push(new THREE.Vector3(pos.x + 2, 30, pos.z + 1));
      points.push(new THREE.Vector3(pos.x - 1, 10, pos.z - 1));
      points.push(new THREE.Vector3(pos.x + 1, 0, pos.z + 0.5));

      var vineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      var vineMaterial = new THREE.LineBasicMaterial({
        color: COLOR_MOSS,
        linewidth: 2
      });
      var vine = new THREE.LineSegments(vineGeometry, vineMaterial);
      scene.add(vine);
      vines.push({
        mesh: vine,
        points: points,
        basePoints: points.map(function(p) { return p.clone(); })
      });
      meshes.push(vine);
    });
  }

  function createSteppingStones() {
    var stonePositions = [
      { x: -30, z: 5 },
      { x: -20, z: 8 },
      { x: -10, z: 10 },
      { x: 0, z: 12 },
      { x: 10, z: 10 }
    ];

    stonePositions.forEach(function(pos) {
      var stoneGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
      var stoneMaterial = new THREE.MeshStandardMaterial({
        color: COLOR_STONE,
        roughness: 0.8
      });
      var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      stone.position.set(pos.x, -4.5, pos.z);
      stone.castShadow = true;
      stone.receiveShadow = true;
      scene.add(stone);
      steppingStones.push({
        mesh: stone,
        baseY: -4.5,
        phase: Math.random() * Math.PI * 2
      });
      meshes.push(stone);
    });
  }

  function createGuerrillaHides() {
    var hidePositions = [
      { x: 20, z: -18 },
      { x: -15, z: 22 },
      { x: 32, z: 28 },
      { x: -25, z: 5 },
      { x: 8, z: 35 }
    ];

    hidePositions.forEach(function(pos) {
      var hideGeometry = new THREE.BoxGeometry(3, 2.5, 3);
      var hideMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A5A2A,
        roughness: 0.85
      });
      var hide = new THREE.Mesh(hideGeometry, hideMaterial);
      hide.position.set(pos.x, 1.5, pos.z);
      hide.rotation.y = Math.random() * Math.PI;
      hide.castShadow = true;
      hide.receiveShadow = true;
      scene.add(hide);
      guerrillaHides.push({
        mesh: hide,
        baseX: pos.x,
        baseZ: pos.z,
        phase: Math.random() * Math.PI * 2
      });
      meshes.push(hide);
    });
  }

  function createLogBridge() {
    // Main bridge logs
    for (var i = 0; i < 3; i++) {
      var logGeometry = new THREE.BoxGeometry(20, 0.6, 1);
      var logMaterial = new THREE.MeshStandardMaterial({
        color: 0x5A4A3A,
        roughness: 0.85
      });
      var log = new THREE.Mesh(logGeometry, logMaterial);
      log.position.set(5, 8 + (i * 0.8), 22);
      log.rotation.z = (i - 1) * 0.1;
      log.castShadow = true;
      log.receiveShadow = true;
      scene.add(log);
      meshes.push(log);
    }

    // Bridge railings
    for (var j = 0; j < 2; j++) {
      var railGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20, 6);
      var railMaterial = new THREE.MeshStandardMaterial({
        color: 0x6A5A4A,
        roughness: 0.8
      });
      var rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(5, 9.5 + (j * 1.2), 23.5);
      rail.castShadow = true;
      scene.add(rail);
      meshes.push(rail);
    }
  }

  function createFireflyOrbs() {
    for (var i = 0; i < 12; i++) {
      var firefllyGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var firefllyMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      var firefly = new THREE.Mesh(firefllyGeometry, firefllyMaterial);
      firefly.position.set(
        (Math.random() - 0.5) * 60,
        5 + Math.random() * 25,
        (Math.random() - 0.5) * 40
      );
      scene.add(firefly);
      fireflies.push({
        mesh: firefly,
        baseX: firefly.position.x,
        baseY: firefly.position.y,
        baseZ: firefly.position.z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.3
      });
      meshes.push(firefly);
    }
  }

  function createRopeLadder() {
    // Rope ladder on cliff face
    var ladderX = -50;
    var ladderBaseZ = -5;
    var rungs = 8;

    // Side ropes
    for (var side = 0; side < 2; side++) {
      var sideZ = ladderBaseZ + (side * 2 - 0.5);
      var ropePoints = [];
      for (var h = 0; h <= rungs; h++) {
        ropePoints.push(new THREE.Vector3(ladderX, 50 - (h * 5), sideZ));
      }
      var ropeGeometry = new THREE.BufferGeometry().setFromPoints(ropePoints);
      var ropeMaterial = new THREE.LineBasicMaterial({
        color: 0x8B7355,
        linewidth: 2
      });
      var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
      scene.add(rope);
      meshes.push(rope);
    }

    // Ladder rungs
    for (var r = 0; r < rungs; r++) {
      var rungGeometry = new THREE.BoxGeometry(2, 0.2, 0.8);
      var rungMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.8
      });
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(ladderX, 50 - (r * 5), ladderBaseZ + 0.75);
      rung.castShadow = true;
      scene.add(rung);
      meshes.push(rung);
    }
  }

  function setupSpawnPoints() {
    spawnPoints = [
      { x: 25, y: 2, z: -20 },
      { x: -15, y: 2, z: 28 },
      { x: -35, y: 8, z: -8 },
      { x: 35, y: 2, z: 18 },
      { x: 5, y: 2, z: 38 }
    ];
  }

  function update(delta) {
    if (!scene) return;

    updateState.waterfallOffset += delta * 2;
    updateState.mistPhase += delta;
    updateState.fireflySway += delta * 0.5;
    updateState.leafSway += delta * 0.7;
    updateState.stonePhase += delta;

    // Waterfall flowing animation
    if (waterfall) {
      waterfall.position.y = 10 + Math.sin(updateState.waterfallOffset) * 0.3;
      waterfall.material.opacity = 0.65 + Math.sin(updateState.waterfallOffset * 1.5) * 0.1;
    }

    // Mist particle animations
    mistParticles.forEach(function(mist) {
      var scale = mist.baseScale.x + Math.sin(updateState.mistPhase + mist.phase) * 0.15;
      mist.mesh.scale.set(scale, scale, scale);
      mist.mesh.material.opacity = mist.baseOpacity + Math.sin(updateState.mistPhase * 1.5 + mist.phase) * 0.1;
    });

    // Firefly drifting and glowing
    fireflies.forEach(function(firefly) {
      firefly.mesh.position.x = firefly.baseX + Math.sin(updateState.fireflySway * firefly.speed) * 3;
      firefly.mesh.position.y = firefly.baseY + Math.cos(updateState.fireflySway * firefly.speed * 0.7) * 2;
      firefly.mesh.position.z = firefly.baseZ + Math.sin(updateState.fireflySway * firefly.speed * 0.5) * 3;
      firefly.mesh.material.emissiveIntensity = 0.5 + Math.sin(updateState.fireflySway * 3) * 0.3;
    });

    // Vine swaying
    vines.forEach(function(vine) {
      var sway = Math.sin(updateState.leafSway) * 0.5;
      var positions = vine.mesh.geometry.attributes.position.array;
      for (var i = 0; i < vine.basePoints.length; i++) {
        positions[i * 3] = vine.basePoints[i].x + sway;
        positions[i * 3 + 1] = vine.basePoints[i].y;
        positions[i * 3 + 2] = vine.basePoints[i].z + Math.cos(updateState.leafSway * 0.7) * 0.3;
      }
      vine.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // Stepping stones bobbing
    steppingStones.forEach(function(stone) {
      var bob = Math.sin(updateState.stonePhase + stone.phase) * 0.15;
      stone.mesh.position.y = stone.baseY + bob;
    });

    // Guerrilla hide slight movement
    guerrillaHides.forEach(function(hide) {
      var drift = Math.sin(updateState.leafSway * 0.5 + hide.phase) * 0.2;
      hide.mesh.position.x = hide.baseX + drift;
    });
  }

  function reset() {
    if (scene) {
      meshes.forEach(function(mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(function(m) { m.dispose(); });
          } else {
            mesh.material.dispose();
          }
        }
        scene.remove(mesh);
      });
    }
    meshes = [];
    mistParticles = [];
    fireflies = [];
    vines = [];
    guerrillaHides = [];
    steppingStones = [];
    spawnPoints = [];
    waterfall = null;
    leafCanopy = null;
    updateState = {
      waterfallOffset: 0,
      mistPhase: 0,
      fireflySway: 0,
      leafSway: 0,
      stonePhase: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
