window.PlagueSwamp = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environmentMeshes = [];
  var toxicGases = [];
  var animatedTrees = [];
  var rotationOffsets = [];

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    environmentMeshes = [];
    toxicGases = [];
    animatedTrees = [];
    rotationOffsets = [];

    scene.background = new THREE.Color(0x1a3a2a);
    scene.fog = new THREE.Fog(0x2d5a4a, 30, 120);

    buildWater();
    buildTrees();
    buildOutposts();
    buildBarrels();
    buildGasMasks();
    buildToxicClouds();
  }

  function buildWater() {
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4d3a,
      roughness: 0.6,
      metalness: 0.1
    });

    var channelGeometry = new THREE.CylinderGeometry(18, 16, 0.5, 32);
    var waterChannel = new THREE.Mesh(channelGeometry, waterMaterial);
    waterChannel.position.set(0, -0.25, 0);
    waterChannel.rotation.z = Math.PI * 0.15;
    scene.add(waterChannel);
    environmentMeshes.push(waterChannel);

    var poolGeometry = new THREE.CylinderGeometry(12, 10, 0.4, 24);
    var pool1 = new THREE.Mesh(poolGeometry, waterMaterial);
    pool1.position.set(25, -0.2, 15);
    scene.add(pool1);
    environmentMeshes.push(pool1);

    var pool2 = new THREE.Mesh(poolGeometry, waterMaterial);
    pool2.position.set(-20, -0.2, -25);
    scene.add(pool2);
    environmentMeshes.push(pool2);
  }

  function buildTrees() {
    var treePositions = [
      [-15, 0, 10],
      [12, 0, 18],
      [-8, 0, -22],
      [20, 0, -5],
      [-25, 0, 0],
      [5, 0, 28],
      [18, 0, 12]
    ];

    treePositions.forEach(function(pos, idx) {
      buildSingleTree(pos[0], pos[1], pos[2], idx);
    });
  }

  function buildSingleTree(x, y, z, idx) {
    var trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });

    var trunkGeometry = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 4, z);
    trunk.castShadow = true;
    scene.add(trunk);
    environmentMeshes.push(trunk);

    var foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d2618,
      roughness: 0.7,
      emissive: 0x1a4d2a,
      emissiveIntensity: 0.2
    });

    var foliageGeometry = new THREE.SphereGeometry(3.5, 6, 6);
    var foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, y + 8, z);
    foliage.scale.y = 1.3;
    foliage.castShadow = true;
    scene.add(foliage);
    environmentMeshes.push(foliage);
    animatedTrees.push(foliage);
    rotationOffsets.push(idx * 0.5);
  }

  function buildOutposts() {
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d2d2d,
      roughness: 0.9,
      metalness: 0.3
    });

    var postPositions = [
      [18, 0, 25],
      [-22, 0, 8],
      [10, 0, -18]
    ];

    postPositions.forEach(function(pos) {
      var baseGeometry = new THREE.CylinderGeometry(3, 3.5, 0.8, 12);
      var base = new THREE.Mesh(baseGeometry, platformMaterial);
      base.position.set(pos[0], pos[1] + 0.4, pos[2]);
      scene.add(base);
      environmentMeshes.push(base);

      for (var i = 0; i < 4; i++) {
        var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
        var stilts = new THREE.Mesh(postGeometry, platformMaterial);
        var angle = (Math.PI * 2 * i) / 4;
        stilts.position.set(
          pos[0] + Math.cos(angle) * 2.5,
          pos[1] + 3,
          pos[2] + Math.sin(angle) * 2.5
        );
        scene.add(stilts);
        environmentMeshes.push(stilts);
      }

      var roofGeometry = new THREE.ConeGeometry(2.8, 1.5, 12);
      var roof = new THREE.Mesh(roofGeometry, platformMaterial);
      roof.position.set(pos[0], pos[1] + 6.2, pos[2]);
      scene.add(roof);
      environmentMeshes.push(roof);
    });
  }

  function buildBarrels() {
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d3a1a,
      roughness: 0.7,
      metalness: 0.5
    });

    var barrelPositions = [
      [8, 0, 10],
      [-15, 0, 5],
      [22, 0, -8],
      [-5, 0, -15],
      [14, 0, 20]
    ];

    barrelPositions.forEach(function(pos) {
      var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 10);
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set(pos[0], pos[1] + 1.25, pos[2]);
      barrel.rotation.y = Math.random() * Math.PI;
      scene.add(barrel);
      environmentMeshes.push(barrel);

      var leakMaterial = new THREE.MeshStandardMaterial({
        color: 0x7fff00,
        emissive: 0x7fff00,
        emissiveIntensity: 0.6,
        roughness: 0.3
      });

      var leakGeometry = new THREE.SphereGeometry(0.4, 4, 4);
      var leak = new THREE.Mesh(leakGeometry, leakMaterial);
      leak.position.set(pos[0] + 1.3, pos[1] + 0.8, pos[2]);
      scene.add(leak);
      environmentMeshes.push(leak);
    });
  }

  function buildGasMasks() {
    var maskMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.6
    });

    var maskPositions = [
      [-12, 6.5, 8],
      [15, 6.5, 20],
      [-20, 6.5, -5],
      [8, 6.5, -18]
    ];

    maskPositions.forEach(function(pos) {
      var faceGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var face = new THREE.Mesh(faceGeometry, maskMaterial);
      face.position.set(pos[0], pos[1], pos[2]);
      face.scale.z = 0.7;
      scene.add(face);
      environmentMeshes.push(face);

      for (var i = 0; i < 2; i++) {
        var lensGeometry = new THREE.SphereGeometry(0.35, 6, 6);
        var lensMaterial = new THREE.MeshStandardMaterial({
          color: 0x1a1a3a,
          metalness: 0.9,
          roughness: 0.2
        });
        var lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(
          pos[0] + (i === 0 ? -0.35 : 0.35),
          pos[1],
          pos[2] - 0.4
        );
        scene.add(lens);
        environmentMeshes.push(lens);
      }

      var tubeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6);
      var tube = new THREE.Mesh(tubeGeometry, maskMaterial);
      tube.position.set(pos[0], pos[1] - 0.5, pos[2]);
      tube.rotation.z = Math.PI * 0.3;
      scene.add(tube);
      environmentMeshes.push(tube);
    });
  }

  function buildToxicClouds() {
    var cloudPositions = [
      [10, 2, -10],
      [-18, 1.5, 15],
      [25, 2.5, 5]
    ];

    cloudPositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var cloudMaterial = new THREE.MeshStandardMaterial({
          color: 0xaaff00,
          emissive: 0x7fff00,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.4,
          roughness: 0.6
        });

        var cloudGeometry = new THREE.SphereGeometry(2 + i, 4, 4);
        var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
          pos[0] + Math.random() * 2 - 1,
          pos[1] + i * 1.2,
          pos[2] + Math.random() * 2 - 1
        );
        scene.add(cloud);
        toxicGases.push({
          mesh: cloud,
          baseY: cloud.position.y,
          speed: 0.5 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2
        });
      }
    });
  }

  function update(delta) {
    animatedTrees.forEach(function(tree, idx) {
      var time = Date.now() * 0.001;
      var offset = rotationOffsets[idx];
      tree.rotation.x = Math.sin(time * 0.5 + offset) * 0.08;
      tree.rotation.z = Math.cos(time * 0.4 + offset) * 0.06;
    });

    toxicGases.forEach(function(gas) {
      gas.phase += delta;
      gas.mesh.position.y = gas.baseY + Math.sin(gas.phase * gas.speed) * 0.5;
      gas.mesh.rotation.x += delta * 0.3;
      gas.mesh.rotation.y += delta * 0.2;
    });
  }

  function reset() {
    environmentMeshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) { mat.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });

    toxicGases.forEach(function(gas) {
      scene.remove(gas.mesh);
      if (gas.mesh.geometry) gas.mesh.geometry.dispose();
      if (gas.mesh.material) gas.mesh.material.dispose();
    });

    environmentMeshes = [];
    toxicGases = [];
    animatedTrees = [];
    rotationOffsets = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
