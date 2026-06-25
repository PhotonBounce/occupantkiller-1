window.JungleRuin = (function() {
  'use strict';

  var scene, camera;
  var vineMeshes = [];
  var fireflyMeshes = [];
  var gemMeshes = [];
  var rootMeshes = [];
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0x4a7c59, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 40, 20);
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    var hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x2d5016, 0.5);
    scene.add(hemisphereLight);

    // Crumbling stone structures - ruins base
    buildRuinsBase();

    // Stepped pyramid structure
    buildPyramid();

    // Massive tree trunks with canopy
    buildTrees();

    // Tree roots breaking through walls
    buildTreeRoots();

    // Stone guardian statue
    buildGuardianStatue();

    // Hidden passage entrance
    buildHiddenPassage();

    // Overgrown courtyard
    buildCourtyard();

    // Underground treasure chamber
    buildTreasureChambel();

    // Jaguar silhouettes on branches
    buildJaguars();

    // Hanging vines (LineSegments)
    buildHangingVines();

    // Firefly/butterfly particles
    buildFireflies();

    // Fog for atmosphere
    scene.fog = new THREE.FogExp2(0x4a7c59, 0.08);
    scene.background = new THREE.Color(0x4a7c59);
  }

  function buildRuinsBase() {
    var ruinPositions = [
      { x: -15, y: 2, z: -10, w: 8, h: 4, d: 6 },
      { x: 10, y: 2, z: 5, w: 7, h: 5, d: 8 },
      { x: -5, y: 3, z: 15, w: 10, h: 6, d: 5 },
      { x: 18, y: 1.5, z: -15, w: 6, h: 3, d: 7 },
      { x: -20, y: 2, z: 8, w: 5, h: 4, d: 9 }
    ];

    var mossyColors = [0x6b8e6f, 0x7a9d7e, 0x5d7a60, 0x718c74, 0x658970];
    var colorIdx = 0;

    ruinPositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var material = new THREE.MeshStandardMaterial({
        color: mossyColors[colorIdx % mossyColors.length],
        roughness: 0.8,
        metalness: 0.1
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.x = (Math.random() - 0.5) * 0.3;
      mesh.rotation.z = (Math.random() - 0.5) * 0.2;
      scene.add(mesh);
      colorIdx++;
    });
  }

  function buildPyramid() {
    var baseSize = 20;
    var baseHeight = 1.5;
    var levels = 5;

    for (var i = 0; i < levels; i++) {
      var size = baseSize - (i * 3.5);
      if (size < 1) size = 1;

      var geometry = new THREE.BoxGeometry(size, baseHeight, size);
      var material = new THREE.MeshStandardMaterial({
        color: 0x8b8680,
        roughness: 0.9,
        metalness: 0
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = i * baseHeight + 1;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Partial collapse effect
      if (i > 2 && Math.random() > 0.5) {
        mesh.rotation.z = (Math.random() - 0.5) * 0.4;
      }

      scene.add(mesh);
    }

    // Collapsed section
    var collapseGeo = new THREE.BoxGeometry(8, 2, 4);
    var collapseMat = new THREE.MeshStandardMaterial({ color: 0x7a7569, roughness: 0.85 });
    var collapseMesh = new THREE.Mesh(collapseGeo, collapseMat);
    collapseMesh.position.set(-8, 5, 0);
    collapseMesh.rotation.z = 0.6;
    collapseMesh.castShadow = true;
    scene.add(collapseMesh);
  }

  function buildTrees() {
    var treePositions = [
      { x: 25, y: 0, z: -20, height: 35, canopyRadius: 12 },
      { x: -30, y: 0, z: 10, height: 38, canopyRadius: 14 },
      { x: 8, y: 0, z: 35, height: 30, canopyRadius: 10 },
      { x: -15, y: 0, z: -30, height: 33, canopyRadius: 11 }
    ];

    treePositions.forEach(function(pos) {
      // Tree trunk
      var trunkGeo = new THREE.CylinderGeometry(1.5, 2.5, pos.height, 8);
      var trunkMat = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.9,
        metalness: 0
      });
      var trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
      trunkMesh.position.set(pos.x, pos.height / 2, pos.z);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      scene.add(trunkMesh);

      // Canopy clusters
      var clusterCount = 4;
      for (var i = 0; i < clusterCount; i++) {
        var angle = (i / clusterCount) * Math.PI * 2;
        var offsetX = Math.cos(angle) * (pos.canopyRadius * 0.7);
        var offsetZ = Math.sin(angle) * (pos.canopyRadius * 0.7);
        var offsetY = pos.height - 8 + Math.sin(angle * 2) * 3;

        var canopyGeo = new THREE.SphereGeometry(pos.canopyRadius * 0.8, 6, 6);
        var canopyMat = new THREE.MeshStandardMaterial({
          color: 0x2d5016,
          roughness: 0.7,
          metalness: 0
        });
        var canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
        canopyMesh.position.set(pos.x + offsetX, offsetY, pos.z + offsetZ);
        canopyMesh.castShadow = true;
        canopyMesh.receiveShadow = true;
        scene.add(canopyMesh);
      }
    });
  }

  function buildTreeRoots() {
    var rootSets = [
      { x: -10, y: 1, z: 5, rootX: 25, rootZ: -20 },
      { x: 5, y: 1, z: -8, rootX: -30, rootZ: 10 },
      { x: -18, y: 0.5, z: 18, rootX: 8, rootZ: 35 }
    ];

    rootSets.forEach(function(set) {
      var rootCount = 5;
      for (var i = 0; i < rootCount; i++) {
        var angle = (i / rootCount) * Math.PI * 2;
        var dirX = Math.cos(angle);
        var dirZ = Math.sin(angle);

        var rootGeo = new THREE.CylinderGeometry(0.8, 1.2, 6, 6);
        var rootMat = new THREE.MeshStandardMaterial({
          color: 0x5a4a3a,
          roughness: 0.8,
          metalness: 0
        });
        var rootMesh = new THREE.Mesh(rootGeo, rootMat);
        rootMesh.position.set(set.x + dirX * 3, set.y + 3, set.z + dirZ * 3);
        rootMesh.rotation.z = Math.atan2(dirZ, dirX) + Math.PI / 2;
        rootMesh.castShadow = true;
        rootMesh.receiveShadow = true;
        scene.add(rootMesh);
        rootMeshes.push(rootMesh);
      }
    });
  }

  function buildGuardianStatue() {
    // Head
    var headGeo = new THREE.BoxGeometry(2, 3, 1.5);
    var stoneMat = new THREE.MeshStandardMaterial({
      color: 0x9e9891,
      roughness: 0.85,
      metalness: 0.05
    });
    var headMesh = new THREE.Mesh(headGeo, stoneMat);
    headMesh.position.set(-25, 6, -25);
    headMesh.castShadow = true;
    scene.add(headMesh);

    // Body
    var bodyGeo = new THREE.BoxGeometry(2.5, 5, 2);
    var bodyMesh = new THREE.Mesh(bodyGeo, stoneMat);
    bodyMesh.position.set(-25, 3.5, -25);
    bodyMesh.castShadow = true;
    scene.add(bodyMesh);

    // Arms
    for (var i = -1; i <= 1; i += 2) {
      var armGeo = new THREE.BoxGeometry(0.8, 3, 0.8);
      var armMesh = new THREE.Mesh(armGeo, stoneMat);
      armMesh.position.set(-25 + i * 2, 3, -25);
      armMesh.castShadow = true;
      scene.add(armMesh);
    }

    // Weapon (spear) - cylinder
    var spearGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 6);
    var spearMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    var spearMesh = new THREE.Mesh(spearGeo, spearMat);
    spearMesh.position.set(-22, 5, -25);
    spearMesh.rotation.z = 0.3;
    spearMesh.castShadow = true;
    scene.add(spearMesh);

    // Spear head (cone)
    var spearHeadGeo = new THREE.ConeGeometry(0.4, 1.5, 6);
    var spearHeadMesh = new THREE.Mesh(spearHeadGeo, spearMat);
    spearHeadMesh.position.set(-22, 9, -25);
    spearHeadMesh.rotation.z = 0.3;
    spearHeadMesh.castShadow = true;
    scene.add(spearHeadMesh);
  }

  function buildHiddenPassage() {
    // Tunnel entrance hidden in ruins
    var tunnelGeo = new THREE.BoxGeometry(3, 3.5, 2);
    var darkMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.9,
      metalness: 0
    });
    var tunnelMesh = new THREE.Mesh(tunnelGeo, darkMat);
    tunnelMesh.position.set(15, 2, 25);
    tunnelMesh.castShadow = true;
    scene.add(tunnelMesh);

    // Vine curtain (LineSegments)
    var vineGeometry = new THREE.BufferGeometry();
    var vinePositions = [];
    var vineCount = 12;
    var vineHeight = 3.5;

    for (var i = 0; i < vineCount; i++) {
      var xOffset = -1.5 + (i / vineCount) * 3;
      vinePositions.push(15 + xOffset, 3.5, 25);
      vinePositions.push(15 + xOffset + (Math.random() - 0.5) * 0.3, 0, 25);
    }

    vineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vinePositions), 3));
    var vineMat = new THREE.LineBasicMaterial({ color: 0x4a6b4a, linewidth: 2 });
    var vineCurtain = new THREE.LineSegments(vineGeometry, vineMat);
    scene.add(vineCurtain);
    vineMeshes.push(vineCurtain);
  }

  function buildCourtyard() {
    // Cracked stone floor tiles
    var tileSize = 2;
    var gridSize = 10;

    for (var x = -gridSize; x < gridSize; x += tileSize) {
      for (var z = -gridSize; z < gridSize; z += tileSize) {
        var tileGeo = new THREE.BoxGeometry(tileSize * 0.9, 0.3, tileSize * 0.9);
        var crackColor = Math.random() > 0.8 ? 0x5a5a5a : 0x7a7a7a;
        var tileMat = new THREE.MeshStandardMaterial({
          color: crackColor,
          roughness: 0.85,
          metalness: 0
        });
        var tileMesh = new THREE.Mesh(tileGeo, tileMat);
        tileMesh.position.set(x, 0.15, z);
        tileMesh.receiveShadow = true;
        scene.add(tileMesh);

        // Plants sprouting from cracks
        if (Math.random() > 0.7) {
          var plantGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 4);
          var plantMat = new THREE.MeshStandardMaterial({
            color: 0x5d7a60,
            roughness: 0.7
          });
          var plantMesh = new THREE.Mesh(plantGeo, plantMat);
          plantMesh.position.set(x, 0.75, z);
          plantMesh.castShadow = true;
          scene.add(plantMesh);
        }
      }
    }
  }

  function buildTreasureChambel() {
    // Underground chamber walls
    var chamberGeo = new THREE.BoxGeometry(12, 6, 12);
    var chamberMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9,
      metalness: 0
    });
    var chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
    chamberMesh.position.set(0, -5, 0);
    chamberMesh.castShadow = true;
    scene.add(chamberMesh);

    // Glowing gems
    var gemPositions = [
      { x: -3, y: -3, z: -3 },
      { x: 3, y: -3, z: -3 },
      { x: 0, y: -4, z: 3 },
      { x: -2, y: -2, z: 0 },
      { x: 2, y: -2, z: 0 }
    ];

    gemPositions.forEach(function(pos) {
      var gemGeo = new THREE.SphereGeometry(0.6, 12, 12);
      var gemMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
      });
      var gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.position.set(pos.x, pos.y, pos.z);
      gemMesh.castShadow = true;
      scene.add(gemMesh);
      gemMeshes.push({ mesh: gemMesh, baseIntensity: 0.5 });
    });

    // Gold pile under gems
    var goldGeo = new THREE.ConeGeometry(2, 1, 8);
    var goldMat = new THREE.MeshStandardMaterial({
      color: 0xdaa520,
      roughness: 0.6,
      metalness: 0.6,
      emissive: 0xaa8800,
      emissiveIntensity: 0.2
    });
    var goldMesh = new THREE.Mesh(goldGeo, goldMat);
    goldMesh.position.set(0, -3.5, 0);
    goldMesh.castShadow = true;
    scene.add(goldMesh);
  }

  function buildJaguars() {
    var jaguarPositions = [
      { x: 30, y: 15, z: -15 },
      { x: -35, y: 18, z: 5 },
      { x: 10, y: 12, z: 40 }
    ];

    jaguarPositions.forEach(function(pos) {
      // Body
      var bodyGeo = new THREE.BoxGeometry(1.5, 1, 3);
      var jaguarMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.7,
        metalness: 0
      });
      var bodyMesh = new THREE.Mesh(bodyGeo, jaguarMat);
      bodyMesh.position.set(pos.x, pos.y, pos.z);
      bodyMesh.castShadow = true;
      scene.add(bodyMesh);

      // Head
      var headGeo = new THREE.SphereGeometry(0.6, 6, 6);
      var headMesh = new THREE.Mesh(headGeo, jaguarMat);
      headMesh.position.set(pos.x, pos.y + 0.3, pos.z + 1.5);
      headMesh.castShadow = true;
      scene.add(headMesh);

      // Tail
      var tailGeo = new THREE.CylinderGeometry(0.25, 0.15, 2, 4);
      var tailMesh = new THREE.Mesh(tailGeo, jaguarMat);
      tailMesh.position.set(pos.x, pos.y - 0.3, pos.z - 1.5);
      tailMesh.rotation.z = 0.4;
      tailMesh.castShadow = true;
      scene.add(tailMesh);

      // Spot markings (small spheres)
      for (var i = 0; i < 3; i++) {
        var spotGeo = new THREE.SphereGeometry(0.25, 4, 4);
        var spotMat = new THREE.MeshStandardMaterial({
          color: 0x2a1a0a,
          roughness: 0.8
        });
        var spotMesh = new THREE.Mesh(spotGeo, spotMat);
        spotMesh.position.set(pos.x + (Math.random() - 0.5), pos.y + Math.random(), pos.z + (Math.random() - 0.5) * 2);
        scene.add(spotMesh);
      }
    });
  }

  function buildHangingVines() {
    var vineStartPositions = [
      { x: 30, z: -20 },
      { x: -30, z: 10 },
      { x: 8, z: 35 },
      { x: -15, z: -30 },
      { x: 0, z: 0 }
    ];

    vineStartPositions.forEach(function(start) {
      var vineGeometry = new THREE.BufferGeometry();
      var positions = [];
      var segments = 20;

      for (var i = 0; i <= segments; i++) {
        var progress = i / segments;
        var yPos = 30 - progress * 30;
        var swayAmount = Math.sin(progress * Math.PI) * 2;
        var xPos = start.x + swayAmount;
        var zPos = start.z + Math.cos(progress * Math.PI) * 1;

        positions.push(xPos, yPos, zPos);
      }

      vineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      var vineMat = new THREE.LineBasicMaterial({ color: 0x4a6b4a, linewidth: 1 });
      var vineMesh = new THREE.LineSegments(vineGeometry, vineMat);
      scene.add(vineMesh);
      vineMeshes.push(vineMesh);
    });
  }

  function buildFireflies() {
    var fireflySpherePositions = [];
    var fireflyCount = 40;

    for (var i = 0; i < fireflyCount; i++) {
      var x = (Math.random() - 0.5) * 60;
      var y = Math.random() * 30 + 5;
      var z = (Math.random() - 0.5) * 60;

      var ffGeo = new THREE.SphereGeometry(0.15, 4, 4);
      var ffMat = new THREE.MeshStandardMaterial({
        color: 0xffff99,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0xffff00,
        emissiveIntensity: 0.8
      });
      var ffMesh = new THREE.Mesh(ffGeo, ffMat);
      ffMesh.position.set(x, y, z);
      scene.add(ffMesh);

      fireflyMeshes.push({
        mesh: ffMesh,
        startPos: { x: x, y: y, z: z },
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function update(delta) {
    time += delta;

    // Sway hanging vines
    vineMeshes.forEach(function(vine, idx) {
      var positions = vine.geometry.attributes.position.array;
      var segments = (positions.length / 3) - 1;

      for (var i = 0; i <= segments; i++) {
        var progress = i / segments;
        var sway = Math.sin(time * 0.8 + idx) * 0.5 * (1 - progress);
        var basePos = vine.userData.basePositions ? vine.userData.basePositions[i * 3] : positions[i * 3];
        positions[i * 3] += sway * delta;
      }

      vine.geometry.attributes.position.needsUpdate = true;
    });

    // Animate fireflies drifting
    fireflyMeshes.forEach(function(ff) {
      var drift = Math.sin(time + ff.phase) * 2;
      var driftUp = Math.cos(time * 0.5 + ff.phase) * 1.5;
      var driftZ = Math.sin(time * 0.7 + ff.phase) * 2;

      ff.mesh.position.x = ff.startPos.x + drift;
      ff.mesh.position.y = ff.startPos.y + driftUp;
      ff.mesh.position.z = ff.startPos.z + driftZ;

      // Pulse glow
      var glowPulse = 0.5 + Math.sin(time * 3 + ff.phase) * 0.4;
      ff.mesh.material.emissiveIntensity = glowPulse;
    });

    // Gem glow pulse
    gemMeshes.forEach(function(gem, idx) {
      var pulseSin = Math.sin(time * 1.2 + idx) * 0.3;
      gem.mesh.material.emissiveIntensity = gem.baseIntensity + pulseSin;
      gem.mesh.rotation.x += 0.01;
      gem.mesh.rotation.y += 0.015;
    });

    // Root creep animation
    rootMeshes.forEach(function(root, idx) {
      var creep = Math.sin(time * 0.3 + idx) * 0.3;
      root.position.y += creep * delta * 0.1;
    });
  }

  function reset() {
    time = 0;
    vineMeshes.forEach(function(vine) {
      if (vine.geometry) vine.geometry.dispose();
      if (vine.material) vine.material.dispose();
    });
    vineMeshes = [];

    fireflyMeshes = [];
    gemMeshes = [];
    rootMeshes = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
