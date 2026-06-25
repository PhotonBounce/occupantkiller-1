window.IceCave = (function() {
  'use strict';

  // Color scheme for glacial ice cave
  var COLORS = {
    glacialBlue: 0x88CCEE,
    deepIce: 0x224466,
    crystalWhite: 0xFFFFFF,
    algaeCyan: 0x00AA88,
    shadowVoid: 0x111111,
    darkBlue: 0x1A3A4A,
    paleBlue: 0xBBDDEE,
    iceGray: 0xAABBCC
  };

  var scene = null;
  var camera = null;
  var meshes = [];
  var animationState = {
    time: 0,
    dripPosition: 0,
    crystalRotation: 0,
    fireGlow: 0,
    lightBlink: 0,
    riverShimmer: 0
  };

  var spawnPoints = [];

  function createBoxMesh(width, height, depth, color, emissive, emissiveIntensity) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.3,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createCylinderMesh(radiusTop, radiusBottom, height, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.5,
      roughness: 0.4
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createConeMesh(radius, height, color) {
    var geometry = new THREE.ConeGeometry(radius, height, 6);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.4,
      roughness: 0.5
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createSphereMesh(radius, color, emissive, emissiveIntensity) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    return line;
  }

  function addMesh(mesh) {
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    animationState = {
      time: 0,
      dripPosition: 0,
      crystalRotation: 0,
      fireGlow: 0,
      lightBlink: 0,
      riverShimmer: 0
    };
    spawnPoints = [];

    // Main ice cave chamber walls
    var caveWall1 = createBoxMesh(100, 80, 20, COLORS.glacialBlue, 0x4488BB, 0.1);
    caveWall1.position.set(-50, 0, 0);
    addMesh(caveWall1);

    var caveWall2 = createBoxMesh(100, 80, 20, COLORS.deepIce, 0x224466, 0.05);
    caveWall2.position.set(50, 0, 0);
    addMesh(caveWall2);

    var caveWall3 = createBoxMesh(20, 80, 100, COLORS.glacialBlue, 0x4488BB, 0.08);
    caveWall3.position.set(0, 0, -50);
    addMesh(caveWall3);

    var caveWall4 = createBoxMesh(20, 80, 100, COLORS.deepIce, 0x224466, 0.05);
    caveWall4.position.set(0, 0, 50);
    addMesh(caveWall4);

    // Ice floor sections
    var iceFloor1 = createBoxMesh(100, 2, 100, COLORS.paleBlue, 0x8899CC, 0.03);
    iceFloor1.position.set(0, -40, 0);
    addMesh(iceFloor1);

    var iceFloor2 = createBoxMesh(50, 1, 40, COLORS.iceGray, 0x6677AA, 0.02);
    iceFloor2.position.set(-30, -39, -30);
    addMesh(iceFloor2);

    // Ice stalactites hanging from ceiling
    var stalactite1 = createConeMesh(3, 15, COLORS.crystalWhite);
    stalactite1.position.set(-20, 35, -15);
    addMesh(stalactite1);

    var stalactite2 = createConeMesh(2.5, 12, COLORS.glacialBlue);
    stalactite2.position.set(10, 37, 10);
    addMesh(stalactite2);

    var stalactite3 = createConeMesh(2, 10, COLORS.crystalWhite);
    stalactite3.position.set(35, 36, -5);
    addMesh(stalactite3);

    var stalactite4 = createConeMesh(3, 14, COLORS.glacialBlue);
    stalactite4.position.set(-35, 38, 20);
    addMesh(stalactite4);

    // Ice stalagmites rising from floor
    var stalagmite1 = createConeMesh(4, 18, COLORS.crystalWhite);
    stalagmite1.position.set(-15, -22, 10);
    stalagmite1.rotation.z = Math.PI;
    addMesh(stalagmite1);

    var stalagmite2 = createConeMesh(3, 14, COLORS.glacialBlue);
    stalagmite2.position.set(25, -26, -20);
    stalagmite2.rotation.z = Math.PI;
    addMesh(stalagmite2);

    var stalagmite3 = createConeMesh(2.5, 11, COLORS.iceGray);
    stalagmite3.position.set(40, -28, 15);
    stalagmite3.rotation.z = Math.PI;
    addMesh(stalagmite3);

    // Underground frozen river - dark blue ice strip
    var frozenRiver = createBoxMesh(15, 2, 80, COLORS.darkBlue, 0x1A5A7A, 0.15);
    frozenRiver.position.set(0, -39, 0);
    addMesh(frozenRiver);

    // Rope bridge across crevasse
    var bridgePlank1 = createBoxMesh(8, 1, 4, COLORS.iceGray, 0x666688, 0.02);
    bridgePlank1.position.set(-10, -20, 30);
    addMesh(bridgePlank1);

    var bridgePlank2 = createBoxMesh(8, 1, 4, COLORS.iceGray, 0x666688, 0.02);
    bridgePlank2.position.set(0, -20, 30);
    addMesh(bridgePlank2);

    var bridgePlank3 = createBoxMesh(8, 1, 4, COLORS.iceGray, 0x666688, 0.02);
    bridgePlank3.position.set(10, -20, 30);
    addMesh(bridgePlank3);

    // Bridge rope lines
    var ropeLeft = createLineSegments([
      -12, -15, 25, -12, 5, 25,
      -12, 5, 25, -12, 5, 35
    ], 0xBBAACC);
    addMesh(ropeLeft);

    var ropeRight = createLineSegments([
      12, -15, 25, 12, 5, 25,
      12, 5, 25, 12, 5, 35
    ], 0xBBAACC);
    addMesh(ropeRight);

    // Ice crystal formations cluster
    var crystal1 = createBoxMesh(3, 12, 2, COLORS.crystalWhite, 0xCCEEFF, 0.25);
    crystal1.position.set(-35, -10, -35);
    crystal1.rotation.z = 0.4;
    addMesh(crystal1);

    var crystal2 = createBoxMesh(2, 10, 3, COLORS.glacialBlue, 0x88CCFF, 0.2);
    crystal2.position.set(-32, -5, -37);
    crystal2.rotation.z = -0.5;
    addMesh(crystal2);

    var crystal3 = createBoxMesh(2.5, 11, 2.5, COLORS.crystalWhite, 0xDDEEFF, 0.22);
    crystal3.position.set(-38, -8, -32);
    crystal3.rotation.z = 0.3;
    addMesh(crystal3);

    var crystal4 = createBoxMesh(3, 13, 2, COLORS.glacialBlue, 0x88CCFF, 0.2);
    crystal4.position.set(-30, -12, -35);
    crystal4.rotation.z = -0.6;
    addMesh(crystal4);

    // Smuggler base camp - tent structures
    var tent1 = createBoxMesh(12, 10, 12, COLORS.iceGray, 0x668899, 0.1);
    tent1.position.set(30, -25, -40);
    addMesh(tent1);

    var tent2 = createBoxMesh(10, 8, 10, COLORS.glacialBlue, 0x4488BB, 0.08);
    tent2.position.set(45, -27, -35);
    addMesh(tent2);

    // Base camp crates
    var crate1 = createBoxMesh(6, 6, 6, COLORS.darkBlue, 0x223344, 0.05);
    crate1.position.set(35, -28, -50);
    addMesh(crate1);

    var crate2 = createBoxMesh(5, 5, 5, COLORS.deepIce, 0x112233, 0.04);
    crate2.position.set(50, -30, -45);
    addMesh(crate2);

    var crate3 = createBoxMesh(6, 6, 6, COLORS.darkBlue, 0x223344, 0.05);
    crate3.position.set(25, -30, -55);
    addMesh(crate3);

    // Base camp fire - emissive sphere for warmth glow
    var campFire = createSphereMesh(3, COLORS.algaeCyan, COLORS.algaeCyan, 1.2);
    campFire.position.set(37, -22, -42);
    addMesh(campFire);

    // Ice climbing wall with anchor lines
    var climbWall = createBoxMesh(15, 40, 2, COLORS.glacialBlue, 0x4488BB, 0.08);
    climbWall.position.set(-45, 0, -35);
    addMesh(climbWall);

    var anchorLine1 = createLineSegments([
      -50, 15, -35, -40, -5, -35
    ], 0xFFAA00);
    addMesh(anchorLine1);

    var anchorLine2 = createLineSegments([
      -45, 15, -35, -35, -8, -35
    ], 0xFFAA00);
    addMesh(anchorLine2);

    // Melting drip pools
    var pool1 = createBoxMesh(8, 0.5, 8, COLORS.paleBlue, 0x5599DD, 0.1);
    pool1.position.set(-25, -37, 25);
    addMesh(pool1);

    // Water drip spheres (will animate)
    var drip1 = createSphereMesh(0.8, COLORS.glacialBlue, 0x4488BB, 0.3);
    drip1.position.set(-25, 30, 25);
    drip1.userData.isAnimated = true;
    drip1.userData.maxHeight = 30;
    drip1.userData.minHeight = -37;
    addMesh(drip1);

    var drip2 = createSphereMesh(0.7, COLORS.glacialBlue, 0x4488BB, 0.25);
    drip2.position.set(10, 32, 15);
    drip2.userData.isAnimated = true;
    drip2.userData.maxHeight = 32;
    drip2.userData.minHeight = -37;
    addMesh(drip2);

    // Luminescent algae patches - pulsing glow spheres
    var algae1 = createSphereMesh(4, COLORS.algaeCyan, COLORS.algaeCyan, 0.8);
    algae1.position.set(-40, -30, 40);
    algae1.userData.isAlgae = true;
    addMesh(algae1);

    var algae2 = createSphereMesh(3, COLORS.algaeCyan, COLORS.algaeCyan, 0.7);
    algae2.position.set(30, -32, 45);
    algae2.userData.isAlgae = true;
    addMesh(algae2);

    // Emergency lighting string with bulbs
    var lightBulb1 = createSphereMesh(1.5, 0xFFFFCC, 0xFFFFCC, 0.9);
    lightBulb1.position.set(-30, 35, 0);
    lightBulb1.userData.isLight = true;
    addMesh(lightBulb1);

    var lightBulb2 = createSphereMesh(1.5, 0xFFFFCC, 0xFFFFCC, 0.8);
    lightBulb2.position.set(0, 37, 0);
    lightBulb2.userData.isLight = true;
    addMesh(lightBulb2);

    var lightBulb3 = createSphereMesh(1.5, 0xFFFFCC, 0xFFFFCC, 0.7);
    lightBulb3.position.set(30, 36, 0);
    lightBulb3.userData.isLight = true;
    addMesh(lightBulb3);

    var lightString = createLineSegments([
      -30, 35, 0, 0, 37, 0, 0, 37, 0, 30, 36, 0
    ], 0x666666);
    addMesh(lightString);

    // Crevasse void - dark gap
    var crevasse = createBoxMesh(20, 60, 1, COLORS.shadowVoid, 0x000000, 0);
    crevasse.position.set(0, -20, -45);
    addMesh(crevasse);

    // Supply cache wrapped in ice
    var supplyCache = createBoxMesh(8, 8, 8, COLORS.deepIce, 0x224466, 0.08);
    supplyCache.position.set(35, -28, 45);
    addMesh(supplyCache);

    var cacheFrost1 = createBoxMesh(10, 10, 10, COLORS.crystalWhite, 0xBBDDEE, 0.15);
    cacheFrost1.position.set(35.5, -27.5, 45.5);
    addMesh(cacheFrost1);

    // Spawn points at key locations
    spawnPoints = [
      { position: { x: -35, y: -35, z: 0 }, name: 'entrance' },
      { position: { x: 0, y: -35, z: 0 }, name: 'river_crossing' },
      { position: { x: -35, y: -20, z: -35 }, name: 'crystal_chamber' },
      { position: { x: 37, y: -25, z: -42 }, name: 'base_camp' },
      { position: { x: 0, y: -25, z: -45 }, name: 'exit_crevasse' }
    ];
  }

  function update(delta) {
    animationState.time += delta;

    // Animate ice drips falling
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.userData.isAnimated) {
        var cycleTime = Math.sin(animationState.time * 1.2 + i) * 0.5 + 0.5;
        mesh.position.y = mesh.userData.maxHeight - (mesh.userData.maxHeight - mesh.userData.minHeight) * cycleTime;
      }

      // Luminescent algae pulsing
      if (mesh.userData.isAlgae) {
        var pulseFactor = Math.sin(animationState.time * 2.5 + i) * 0.3 + 0.7;
        mesh.material.emissiveIntensity = pulseFactor;
      }

      // Emergency lights blinking sequentially
      if (mesh.userData.isLight) {
        var lightIndex = meshes.indexOf(mesh);
        var blinkCycle = Math.sin(animationState.time * 3 + lightIndex * 1.5) * 0.5 + 0.5;
        mesh.material.emissiveIntensity = blinkCycle > 0.3 ? 1.0 : 0.3;
      }
    }

    // Crystal formations slowly rotating to catch light
    for (var j = 0; j < meshes.length; j++) {
      var m = meshes[j];
      if (m.geometry instanceof THREE.BoxGeometry && m.position.x < -25 && m.position.z < -30) {
        if (!m.userData.rotationInitialized) {
          m.userData.rotationInitialized = true;
          m.userData.rotationAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize();
        }
        var rotSpeed = 0.15;
        m.rotateOnWorldAxis(m.userData.rotationAxis, rotSpeed * delta);
      }
    }

    // Base camp fire glowing pulsing
    for (var k = 0; k < meshes.length; k++) {
      var fireMesh = meshes[k];
      if (fireMesh.position.x > 35 && fireMesh.position.x < 40 &&
          fireMesh.position.y > -25 && fireMesh.position.y < -20) {
        if (fireMesh.geometry instanceof THREE.SphereGeometry && fireMesh.material.emissive.getHex() === COLORS.algaeCyan) {
          var fireGlow = Math.sin(animationState.time * 1.8) * 0.4 + 0.8;
          fireMesh.material.emissiveIntensity = fireGlow;
          break;
        }
      }
    }

    // Rope bridge slight sway
    for (var p = 0; p < meshes.length; p++) {
      var plank = meshes[p];
      if (plank.geometry instanceof THREE.BoxGeometry &&
          plank.position.y > -25 && plank.position.y < -15 &&
          plank.position.z > 25 && plank.position.z < 35) {
        plank.rotation.z = Math.sin(animationState.time * 0.8) * 0.02;
      }
    }

    // Frozen river surface shimmering effect
    for (var r = 0; r < meshes.length; r++) {
      var river = meshes[r];
      if (river.position.x === 0 && river.position.y === -39 && river.position.z === 0) {
        if (river.geometry instanceof THREE.BoxGeometry) {
          var shimmer = Math.sin(animationState.time * 2.2) * 0.08 + 0.15;
          river.material.emissiveIntensity = shimmer;
          break;
        }
      }
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    spawnPoints = [];
    animationState = {
      time: 0,
      dripPosition: 0,
      crystalRotation: 0,
      fireGlow: 0,
      lightBlink: 0,
      riverShimmer: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshCount: function() { return meshes.length; }
  };
}());
