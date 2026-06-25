window.DesertFort = (function() {
  'use strict';

  var scene, camera;
  var fortMeshes = [];
  var shimmerSpheres = [];

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0xC4956B, roughness: 0.8, metalness: 0.1 });
    var wall1Geom = new THREE.BoxGeometry(50, 8, 2);
    var wall1 = new THREE.Mesh(wall1Geom, wallMaterial);
    wall1.position.set(-15, 4, -20);
    scene.add(wall1);
    fortMeshes.push(wall1);

    var wall2Geom = new THREE.BoxGeometry(2, 8, 30);
    var wall2 = new THREE.Mesh(wall2Geom, wallMaterial);
    wall2.position.set(-40, 4, 0);
    scene.add(wall2);
    fortMeshes.push(wall2);

    var wall3 = new THREE.Mesh(wall2Geom, wallMaterial);
    wall3.position.set(10, 4, 0);
    scene.add(wall3);
    fortMeshes.push(wall3);

    var wall4Geom = new THREE.BoxGeometry(50, 8, 2);
    var wall4 = new THREE.Mesh(wall4Geom, wallMaterial);
    wall4.position.set(-15, 4, 15);
    scene.add(wall4);
    fortMeshes.push(wall4);
  }

  function buildCrenellations() {
    var crenlMaterial = new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.7, metalness: 0.05 });
    var positions = [[-35, 9, 0], [0, 9, -18], [0, 9, 12], [-15, 9, -20], [-15, 9, 15]];
    positions.forEach(function(pos) {
      for (var i = 0; i < 4; i++) {
        var crenGeom = new THREE.BoxGeometry(2.5, 2, 2.5);
        var cren = new THREE.Mesh(crenGeom, crenlMaterial);
        cren.position.set(pos[0] + i * 4, pos[1], pos[2]);
        scene.add(cren);
        fortMeshes.push(cren);
      }
    });
  }

  function buildWatchtowers() {
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0xA0827D, roughness: 0.6, metalness: 0.2 });
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x556B7F, roughness: 0.4, metalness: 0.7 });
    var towers = [[-38, 0, -18], [-38, 0, 18], [8, 0, -18], [8, 0, 18]];

    towers.forEach(function(pos) {
      var towerGeom = new THREE.CylinderGeometry(3, 3, 10, 16);
      var tower = new THREE.Mesh(towerGeom, towerMaterial);
      tower.position.set(pos[0], pos[1] + 5, pos[2]);
      scene.add(tower);
      fortMeshes.push(tower);

      var roofGeom = new THREE.ConeGeometry(3.5, 3, 16);
      var roof = new THREE.Mesh(roofGeom, roofMaterial);
      roof.position.set(pos[0], pos[1] + 12, pos[2]);
      scene.add(roof);
      fortMeshes.push(roof);
    });
  }

  function buildGateway() {
    var archMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.9, metalness: 0.05 });
    var archLeft = new THREE.BoxGeometry(2, 8, 3);
    var pillarL = new THREE.Mesh(archLeft, archMaterial);
    pillarL.position.set(-8, 4, -20.5);
    scene.add(pillarL);
    fortMeshes.push(pillarL);

    var pillarR = new THREE.Mesh(archLeft, archMaterial);
    pillarR.position.set(-2, 4, -20.5);
    scene.add(pillarR);
    fortMeshes.push(pillarR);

    var archTop = new THREE.BoxGeometry(8, 1.5, 3);
    var arch = new THREE.Mesh(archTop, archMaterial);
    arch.position.set(-5, 8.5, -20.5);
    scene.add(arch);
    fortMeshes.push(arch);
  }

  function buildSandbags() {
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85, metalness: 0 });
    var positions = [[-35, 1, -5], [-35, 1, 5], [5, 1, -10], [5, 1, 8]];

    positions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var bagGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var bag = new THREE.Mesh(bagGeom, sandbagMaterial);
        bag.position.set(pos[0] + i * 2.5, pos[1] + i * 1.2, pos[2]);
        scene.add(bag);
        fortMeshes.push(bag);
      }
    });
  }

  function buildArtillery() {
    var gunMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.3, metalness: 0.9 });
    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7, metalness: 0.1 });
    var guns = [[-25, 2, -15], [-25, 2, 10]];

    guns.forEach(function(pos) {
      var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
      var barrel = new THREE.Mesh(barrelGeom, gunMaterial);
      barrel.rotation.z = 0.3;
      barrel.position.set(pos[0], pos[1] + 1, pos[2]);
      scene.add(barrel);
      fortMeshes.push(barrel);

      var carriageGeom = new THREE.BoxGeometry(2, 1.2, 2);
      var carriage = new THREE.Mesh(carriageGeom, woodMaterial);
      carriage.position.set(pos[0], pos[1], pos[2]);
      scene.add(carriage);
      fortMeshes.push(carriage);
    });
  }

  function buildFlagpole() {
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7765, roughness: 0.4, metalness: 0.6 });
    var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    var pole = new THREE.Mesh(poleGeom, poleMaterial);
    pole.position.set(-5, 7.5, 18);
    scene.add(pole);
    fortMeshes.push(pole);

    var flagMat = new THREE.LineBasicMaterial({ color: 0xFF4500, linewidth: 2 });
    var flagPoints = [
      new THREE.Vector3(-4, 15, 18),
      new THREE.Vector3(0, 13, 18),
      new THREE.Vector3(-4, 11, 18),
      new THREE.Vector3(-4, 15, 18)
    ];
    var flagGeom = new THREE.BufferGeometry().setFromPoints(flagPoints);
    var flag = new THREE.LineSegments(flagGeom, flagMat);
    scene.add(flag);
    fortMeshes.push(flag);
  }

  function buildCamelPosts() {
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.7, metalness: 0.2 });
    var posts = [[20, 0, -10], [20, 0, 5]];

    posts.forEach(function(pos) {
      var postGeom = new THREE.CylinderGeometry(0.5, 0.7, 2, 8);
      var post = new THREE.Mesh(postGeom, postMaterial);
      post.position.set(pos[0], pos[1] + 1, pos[2]);
      scene.add(post);
      fortMeshes.push(post);

      var ringGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 10);
    });
  }

  function buildShimmer() {
    var shimmerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.1 });
    var positions = [[-30, 0.5, 5], [-10, 0.5, -15], [0, 0.5, 8]];

    positions.forEach(function(pos) {
      var shimmerGeom = new THREE.SphereGeometry(2, 16, 16);
      var shimmer = new THREE.Mesh(shimmerGeom, shimmerMat);
      shimmer.position.set(pos[0], pos[1], pos[2]);
      scene.add(shimmer);
      shimmerSpheres.push(shimmer);
    });
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    fortMeshes = [];
    shimmerSpheres = [];

    buildWalls();
    buildCrenellations();
    buildWatchtowers();
    buildGateway();
    buildSandbags();
    buildArtillery();
    buildFlagpole();
    buildCamelPosts();
    buildShimmer();
  }

  function update(delta) {
    shimmerSpheres.forEach(function(shimmer, idx) {
      shimmer.position.y = 0.5 + Math.sin(shimmer.position.x * 0.1 + delta * 2) * 0.3;
      shimmer.scale.x = 1 + Math.sin(delta * 1.5 + idx) * 0.2;
      shimmer.scale.y = 1 + Math.cos(delta * 1.5 + idx) * 0.2;
      shimmer.scale.z = 1 + Math.sin(delta * 1.5 + idx) * 0.2;
    });
  }

  function reset() {
    fortMeshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    shimmerSpheres.forEach(function(shimmer) {
      scene.remove(shimmer);
      if (shimmer.geometry) shimmer.geometry.dispose();
      if (shimmer.material) shimmer.material.dispose();
    });
    fortMeshes = [];
    shimmerSpheres = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
