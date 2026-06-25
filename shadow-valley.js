window.ShadowValley = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var meshes = [];
  var animations = [];
  var time = 0;

  // Helper to create and track a mesh
  function addMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
    if (scale) mesh.scale.copy(scale);
    sceneRef.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  // Helper to create and track a line segments object
  function addLineSegments(geometry, material, position, rotation, scale) {
    var line = new THREE.LineSegments(geometry, material);
    if (position) line.position.copy(position);
    if (rotation) line.rotation.copy(rotation);
    if (scale) line.scale.copy(scale);
    sceneRef.add(line);
    meshes.push(line);
    return line;
  }

  function createValleyTerrain() {
    // Dark valley floor
    var floorGeo = new THREE.BoxGeometry(80, 2, 80);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8, metalness: 0.1 });
    addMesh(floorGeo, floorMat, new THREE.Vector3(0, -5, 0));

    // Left valley slope
    var leftSlopeGeo = new THREE.BoxGeometry(8, 30, 80);
    var slopeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0 });
    addMesh(leftSlopeGeo, slopeMat, new THREE.Vector3(-38, 5, 0), new THREE.Euler(0, 0, 0.3));

    // Right valley slope
    var rightSlopeGeo = new THREE.BoxGeometry(8, 30, 80);
    addMesh(rightSlopeGeo, slopeMat, new THREE.Vector3(38, 5, 0), new THREE.Euler(0, 0, -0.3));

    // Back valley wall
    var backWallGeo = new THREE.BoxGeometry(80, 25, 8);
    addMesh(backWallGeo, slopeMat, new THREE.Vector3(0, 5, -38));

    // Front valley wall
    var frontWallGeo = new THREE.BoxGeometry(80, 25, 8);
    addMesh(frontWallGeo, slopeMat, new THREE.Vector3(0, 5, 38));
  }

  function createTwistedDarkTrees() {
    // Tree positions scattered throughout valley
    var treePositions = [
      [-20, 0, -20], [-15, 0, -10], [-25, 0, 5], [-10, 0, 15],
      [20, 0, -25], [15, 0, -5], [25, 0, 10], [10, 0, 25],
      [-30, 0, 25], [30, 0, -15], [-5, 0, -30], [5, 0, 30],
      [0, 0, -20], [-35, 0, -5], [35, 0, 5]
    ];

    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x0d0d1a, roughness: 0.95, metalness: 0 });
    var branchMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9, metalness: 0 });

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];
      var trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
      var trunk = addMesh(trunkGeo, trunkMat, new THREE.Vector3(pos[0], pos[1] + 4, pos[2]));
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;

      // Angular branches
      for (var j = 0; j < 3; j++) {
        var branchGeo = new THREE.BoxGeometry(0.6, 3, 0.6);
        var branchAngle = (j / 3) * Math.PI * 2;
        var branchX = pos[0] + Math.cos(branchAngle) * 2;
        var branchZ = pos[2] + Math.sin(branchAngle) * 2;
        var branch = addMesh(branchGeo, branchMat, new THREE.Vector3(branchX, pos[1] + 6, branchZ));
        branch.rotation.x = (Math.random() - 0.5) * 0.3;
        branch.rotation.z = (Math.random() - 0.5) * 0.3;
      }
    }
  }

  function createShadowMist() {
    var mistMat = new THREE.MeshStandardMaterial({
      color: 0x2a1a4a,
      roughness: 0.7,
      metalness: 0,
      transparent: true,
      opacity: 0.25
    });

    var mistPositions = [];
    for (var x = -35; x <= 35; x += 7) {
      for (var z = -35; z <= 35; z += 7) {
        mistPositions.push([x + (Math.random() - 0.5) * 3, -2, z + (Math.random() - 0.5) * 3]);
      }
    }

    for (var i = 0; i < mistPositions.length; i++) {
      var pos = mistPositions[i];
      var size = 3 + Math.random() * 2;
      var mistGeo = new THREE.SphereGeometry(size, 8, 8);
      var mist = addMesh(mistGeo, mistMat, new THREE.Vector3(pos[0], pos[1], pos[2]));
      animations.push({
        object: mist,
        type: 'drift',
        speed: 0.5 + Math.random() * 0.5,
        amplitude: 2 + Math.random() * 2,
        startX: pos[0],
        startY: pos[1],
        startZ: pos[2]
      });
    }
  }

  function createAncientRuins() {
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x252530, roughness: 0.85, metalness: 0.1 });

    var ruinPositions = [
      [-25, 0, 15], [20, 0, -20], [-10, 0, 25], [30, 0, 15],
      [-35, 0, -10], [15, 0, 10], [-15, 0, -25], [25, 0, 25]
    ];

    for (var i = 0; i < ruinPositions.length; i++) {
      var pos = ruinPositions[i];
      // Collapsed stone blocks
      var blockCount = 2 + Math.floor(Math.random() * 3);
      for (var j = 0; j < blockCount; j++) {
        var blockGeo = new THREE.BoxGeometry(
          2 + Math.random() * 3,
          1 + Math.random() * 2,
          2 + Math.random() * 3
        );
        var block = addMesh(blockGeo, stoneMat,
          new THREE.Vector3(pos[0] + (Math.random() - 0.5) * 5, pos[1] + j * 1.5, pos[2] + (Math.random() - 0.5) * 5)
        );
        block.rotation.x = (Math.random() - 0.5) * 0.4;
        block.rotation.y = Math.random() * Math.PI;
        block.rotation.z = (Math.random() - 0.5) * 0.4;
      }
    }
  }

  function createShadowCreatureLairs() {
    var caveMat = new THREE.MeshStandardMaterial({ color: 0x0a0a15, roughness: 0.9, metalness: 0 });

    var lairPositions = [
      [-40, 5, -25], [-40, 5, 0], [-40, 5, 25],
      [40, 5, -25], [40, 5, 0], [40, 5, 25]
    ];

    for (var i = 0; i < lairPositions.length; i++) {
      var pos = lairPositions[i];
      var caveGeo = new THREE.BoxGeometry(8, 6, 5);
      var cave = addMesh(caveGeo, caveMat, new THREE.Vector3(pos[0], pos[1], pos[2]));
      cave.castShadow = true;
      cave.receiveShadow = true;
    }
  }

  function createCursedObelisks() {
    var obMat = new THREE.MeshStandardMaterial({ color: 0x0f0f1a, roughness: 0.8, metalness: 0.3 });
    var runeMat = new THREE.MeshStandardMaterial({
      color: 0x7a3a9a,
      roughness: 0.5,
      metalness: 0.6,
      emissive: 0x5a1a7a,
      emissiveIntensity: 0.5
    });

    var obeliskPositions = [
      [-20, 0, 0], [20, 0, 0], [0, 0, -20], [0, 0, 20],
      [-15, 0, -15], [15, 0, -15], [-15, 0, 15], [15, 0, 15]
    ];

    for (var i = 0; i < obeliskPositions.length; i++) {
      var pos = obeliskPositions[i];
      var obGeo = new THREE.CylinderGeometry(1, 1.5, 12, 8);
      var obelisk = addMesh(obGeo, obMat, new THREE.Vector3(pos[0], pos[1] + 6, pos[2]));

      // Glowing runes
      for (var j = 0; j < 3; j++) {
        var runeGeo = new THREE.SphereGeometry(0.6, 8, 8);
        var rune = addMesh(runeGeo, runeMat, new THREE.Vector3(pos[0], pos[1] + 3 + j * 2.5, pos[2]));
        animations.push({
          object: rune,
          type: 'glow',
          speed: 1 + Math.random() * 0.5
        });
      }
    }
  }

  function createDarkEnergyNexus() {
    var nexusMat = new THREE.MeshStandardMaterial({
      color: 0x1a0a3a,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x4a1a6a,
      emissiveIntensity: 0.8
    });

    var nexusGeo = new THREE.SphereGeometry(5, 32, 32);
    var nexus = addMesh(nexusGeo, nexusMat, new THREE.Vector3(0, 2, 0));
    nexus.castShadow = true;

    animations.push({
      object: nexus,
      type: 'nexus',
      speed: 0.5
    });
  }

  function createBoneField() {
    var boneMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.1 });

    var bonePositions = [];
    for (var x = -30; x <= 30; x += 6) {
      for (var z = -30; z <= 30; z += 6) {
        if (Math.sqrt(x * x + z * z) > 8) { // Avoid center nexus
          bonePositions.push([x + (Math.random() - 0.5) * 4, -3, z + (Math.random() - 0.5) * 4]);
        }
      }
    }

    for (var i = 0; i < bonePositions.length; i++) {
      var pos = bonePositions[i];
      var boneGeo = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6);
      addMesh(boneGeo, boneMat, new THREE.Vector3(pos[0], pos[1], pos[2]));
    }
  }

  function createShadowWarriorCamp() {
    var tentMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0 });
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0x4a1a5a,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0x6a2a7a,
      emissiveIntensity: 0.7
    });

    var campPositions = [
      [-22, 0, -22], [-22, 0, -10], [-10, 0, -22], [-10, 0, -10]
    ];

    for (var i = 0; i < campPositions.length; i++) {
      var pos = campPositions[i];
      // Tent structure
      var tentGeo = new THREE.BoxGeometry(3, 4, 3);
      var tent = addMesh(tentGeo, tentMat, new THREE.Vector3(pos[0], pos[1] + 2, pos[2]));
      tent.rotation.y = Math.random() * Math.PI;

      // Fire pit
      var fireGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var fire = addMesh(fireGeo, fireMat, new THREE.Vector3(pos[0], pos[1] + 0.5, pos[2] + 2));
      animations.push({
        object: fire,
        type: 'fire',
        speed: 2
      });
    }
  }

  function createVoidRifts() {
    var voidMat = new THREE.LineBasicMaterial({ color: 0x1a0a3a, linewidth: 2 });

    var riftPositions = [
      [-30, 10, -30], [30, 10, -30], [-30, 10, 30], [30, 10, 30],
      [0, 10, -40], [0, 10, 40], [-40, 10, 0], [40, 10, 0]
    ];

    for (var i = 0; i < riftPositions.length; i++) {
      var pos = riftPositions[i];
      var riftGeo = new THREE.BufferGeometry();
      var verts = [];
      var size = 4;
      for (var j = 0; j < 16; j++) {
        var angle = (j / 16) * Math.PI * 2;
        var x = Math.cos(angle) * size;
        var y = Math.sin(angle) * size * 0.5;
        var z = Math.sin(angle * 0.5) * size * 0.3;
        verts.push(pos[0] + x, pos[1] + y, pos[2] + z);
        verts.push(pos[0] + x * 0.8, pos[1] + y * 0.8, pos[2] + z * 0.8);
      }
      riftGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
      var rift = addLineSegments(riftGeo, voidMat, new THREE.Vector3(0, 0, 0));
      animations.push({
        object: rift,
        type: 'rift',
        speed: 1.5
      });
    }
  }

  function createDeadForest() {
    var deadTreeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0 });

    var forestX = 25;
    var forestZ = -25;
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = forestX + Math.cos(angle) * 8;
      var z = forestZ + Math.sin(angle) * 8;
      var treeGeo = new THREE.CylinderGeometry(0.5, 0.8, 10, 5);
      var tree = addMesh(treeGeo, deadTreeMat, new THREE.Vector3(x, 5, z));
      tree.rotation.z = (Math.random() - 0.5) * 0.15;
    }
  }

  function createCursedShrine() {
    var altarMat = new THREE.MeshStandardMaterial({ color: 0x2a0a1a, roughness: 0.85, metalness: 0.2 });
    var offeringMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0x3a1a4a,
      emissiveIntensity: 0.3
    });

    var shrineX = -25;
    var shrineZ = 25;

    // Altar base
    var altarGeo = new THREE.BoxGeometry(6, 3, 6);
    addMesh(altarGeo, altarMat, new THREE.Vector3(shrineX, 1.5, shrineZ));

    // Altar top
    var topGeo = new THREE.BoxGeometry(5, 1, 5);
    addMesh(topGeo, altarMat, new THREE.Vector3(shrineX, 3.5, shrineZ));

    // Dark offerings
    for (var i = 0; i < 4; i++) {
      var offeringGeo = new THREE.SphereGeometry(0.8, 8, 8);
      var offering = addMesh(offeringGeo, offeringMat,
        new THREE.Vector3(shrineX + (i - 1.5) * 1.5, 4.2, shrineZ)
      );
      animations.push({
        object: offering,
        type: 'float',
        speed: 0.8 + Math.random() * 0.3,
        amplitude: 0.5
      });
    }
  }

  function createShadowPortals() {
    var portalMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a2a,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x3a0a5a,
      emissiveIntensity: 0.6
    });

    var portalPositions = [
      [-38, 10, -20], [-38, 10, 20], [38, 10, -20], [38, 10, 20]
    ];

    for (var i = 0; i < portalPositions.length; i++) {
      var pos = portalPositions[i];
      var portalGeo = new THREE.SphereGeometry(2.5, 16, 16);
      var portal = addMesh(portalGeo, portalMat, new THREE.Vector3(pos[0], pos[1], pos[2]));
      animations.push({
        object: portal,
        type: 'portal',
        speed: 1.2
      });
    }
  }

  // Count geometry objects created
  function getObjectCount() {
    return meshes.length;
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    meshes = [];
    animations = [];
    time = 0;

    createValleyTerrain();
    createTwistedDarkTrees();
    createShadowMist();
    createAncientRuins();
    createShadowCreatureLairs();
    createCursedObelisks();
    createDarkEnergyNexus();
    createBoneField();
    createShadowWarriorCamp();
    createVoidRifts();
    createDeadForest();
    createCursedShrine();
    createShadowPortals();

    return getObjectCount();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];
      var obj = anim.object;

      if (anim.type === 'drift') {
        // Shadow mist drifting motion
        obj.position.x = anim.startX + Math.sin(time * anim.speed + i) * anim.amplitude;
        obj.position.z = anim.startZ + Math.cos(time * anim.speed * 0.7 + i * 0.5) * anim.amplitude * 0.7;
      }
      else if (anim.type === 'nexus') {
        // Dark energy nexus pulsing and rotating
        var scale = 1 + Math.sin(time * anim.speed) * 0.15;
        obj.scale.set(scale, scale, scale);
        obj.rotation.y += delta * 0.3;
        obj.rotation.x += delta * 0.15;
      }
      else if (anim.type === 'glow') {
        // Obelisk runes glowing
        var intensity = 0.5 + Math.sin(time * anim.speed * 2) * 0.5;
        obj.material.emissiveIntensity = intensity;
      }
      else if (anim.type === 'rift') {
        // Void rifts shimmering
        var shimmer = 0.5 + Math.sin(time * anim.speed * 1.5) * 0.5;
        obj.material.opacity = shimmer;
      }
      else if (anim.type === 'fire') {
        // Fire flickering
        var flicker = 0.6 + Math.sin(time * anim.speed * 3 + i) * 0.4;
        obj.material.emissiveIntensity = flicker;
        obj.scale.set(1 + Math.sin(time * anim.speed * 2 + i * 0.5) * 0.1,
                      1 + Math.sin(time * anim.speed * 2 + i * 0.5) * 0.1,
                      1 + Math.sin(time * anim.speed * 2 + i * 0.5) * 0.1);
      }
      else if (anim.type === 'float') {
        // Floating motion
        obj.position.y += Math.sin(time * anim.speed + i) * delta * 0.5;
      }
      else if (anim.type === 'portal') {
        // Portal pulsing and rotating
        var pulseScale = 1 + Math.sin(time * anim.speed * 2) * 0.2;
        obj.scale.set(pulseScale, pulseScale, pulseScale);
        obj.rotation.z += delta * 0.4;
        obj.rotation.x += delta * 0.2;
      }
    }
  }

  function reset() {
    // Remove all meshes from scene
    for (var i = meshes.length - 1; i >= 0; i--) {
      sceneRef.remove(meshes[i]);
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
    }
    meshes = [];
    animations = [];
    time = 0;
    sceneRef = null;
    cameraRef = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
