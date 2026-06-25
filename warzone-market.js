window.WarzoneMarket = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var materials = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    materials = [];

    buildMarketFloor();
    buildBuildingWalls();
    buildMarketStalls();
    buildMerchandise();
    buildFountain();
    buildSandbags();
    buildCableWires();
    buildMinaretTower();
    applyBulletDamage();
  }

  function buildMarketFloor() {
    var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.8,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.25;
    scene.add(floor);
    meshes.push(floor);
    materials.push(floorMat);
  }

  function buildBuildingWalls() {
    var positions = [
      {x: -30, z: 0, width: 15, height: 12, depth: 40},
      {x: 30, z: 0, width: 15, height: 12, depth: 40},
      {x: 0, z: -30, width: 40, height: 12, depth: 15},
      {x: 0, z: 30, width: 40, height: 12, depth: 15}
    ];

    positions.forEach(function(pos) {
      var geom = new THREE.BoxGeometry(pos.width, pos.height, pos.depth);
      var mat = new THREE.MeshStandardMaterial({
        color: 0xA0826D,
        roughness: 0.9,
        metalness: 0.05
      });
      var wall = new THREE.Mesh(geom, mat);
      wall.position.set(pos.x, pos.height / 2, pos.z);
      scene.add(wall);
      meshes.push(wall);
      materials.push(mat);
    });
  }

  function buildMarketStalls() {
    var stallPositions = [
      {x: -15, z: -10},
      {x: -15, z: 10},
      {x: 15, z: -10},
      {x: 15, z: 10},
      {x: 0, z: -15},
      {x: 0, z: 15}
    ];

    stallPositions.forEach(function(pos) {
      buildStall(pos.x, pos.z);
    });
  }

  function buildStall(x, z) {
    var frameGeom = new THREE.BoxGeometry(5, 0.3, 5);
    var frameMat = new THREE.MeshStandardMaterial({color: 0x654321});
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(x, 1.5, z);
    scene.add(frame);
    meshes.push(frame);

    var roofGeom = new THREE.BoxGeometry(6, 0.2, 6);
    var roofMat = new THREE.MeshStandardMaterial({color: 0xDC143C});
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(x, 3.2, z);
    roof.rotation.z = 0.3;
    scene.add(roof);
    meshes.push(roof);
    materials.push(roofMat);

    var postGeom = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    var postMat = new THREE.MeshStandardMaterial({color: 0x4A4A4A});
    [-2, -2, 2, 2].forEach(function(dx, idx) {
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(x + (idx < 2 ? dx : 2), 1, z + (idx % 2 === 0 ? -2 : 2));
      scene.add(post);
      meshes.push(post);
    });
  }

  function buildMerchandise() {
    var merchandisePoints = [
      {x: -20, z: -15}, {x: -18, z: 5}, {x: 8, z: -20},
      {x: 12, z: 18}, {x: -5, z: 0}, {x: 22, z: 10}
    ];

    merchandisePoints.forEach(function(pt) {
      for (var i = 0; i < 3; i++) {
        var boxGeom = new THREE.BoxGeometry(2, 1.5 + i * 0.5, 2);
        var colors = [0xFF6347, 0xFFD700, 0x32CD32, 0x4169E1];
        var boxMat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          roughness: 0.7
        });
        var box = new THREE.Mesh(boxGeom, boxMat);
        box.position.set(pt.x + i * 0.8, 0.75 + i * 0.8, pt.z + i * 1.2);
        scene.add(box);
        meshes.push(box);
        materials.push(boxMat);
      }
    });
  }

  function buildFountain() {
    var baseGeom = new THREE.CylinderGeometry(4, 5, 1, 16);
    var baseMat = new THREE.MeshStandardMaterial({color: 0xB0C4DE});
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.5;
    scene.add(base);
    meshes.push(base);

    var waterGeom = new THREE.SphereGeometry(3, 16, 16);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x00BFFF,
      emissive: 0x00BFFF,
      emissiveIntensity: 0.4,
      metalness: 0.9,
      roughness: 0.1
    });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = 2;
    scene.add(water);
    meshes.push(water);
    materials.push(waterMat);
  }

  function buildSandbags() {
    var sandbagRows = [
      {x: -8, z: 0, count: 6},
      {x: 8, z: 0, count: 6}
    ];

    sandbagRows.forEach(function(row) {
      for (var i = 0; i < row.count; i++) {
        var bagGeom = new THREE.BoxGeometry(1.5, 0.8, 1.2);
        var bagMat = new THREE.MeshStandardMaterial({color: 0x8B7500});
        var bag = new THREE.Mesh(bagGeom, bagMat);
        bag.position.set(row.x, 0.4, row.z + i * 1.5 - row.count);
        scene.add(bag);
        meshes.push(bag);
      }
    });
  }

  function buildCableWires() {
    var points = [
      new THREE.Vector3(-25, 6, -25),
      new THREE.Vector3(25, 5.5, -25),
      new THREE.Vector3(25, 5.5, 25),
      new THREE.Vector3(-25, 6, 25),
      new THREE.Vector3(-25, 6, -25)
    ];

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({color: 0x333333, linewidth: 2});
    var cables = new THREE.LineSegments(geometry, material);
    scene.add(cables);
    meshes.push(cables);
  }

  function buildMinaretTower() {
    var baseGeom = new THREE.CylinderGeometry(1.5, 2, 8, 12);
    var baseMat = new THREE.MeshStandardMaterial({color: 0xA0826D});
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(45, 4, 40);
    scene.add(base);
    meshes.push(base);

    var shaftGeom = new THREE.CylinderGeometry(0.8, 1, 15, 12);
    var shaft = new THREE.Mesh(shaftGeom, baseMat);
    shaft.position.set(45, 13, 40);
    scene.add(shaft);
    meshes.push(shaft);

    var capGeom = new THREE.ConeGeometry(1.2, 3, 12);
    var capMat = new THREE.MeshStandardMaterial({color: 0xDC143C});
    var cap = new THREE.Mesh(capGeom, capMat);
    cap.position.set(45, 22, 40);
    scene.add(cap);
    meshes.push(cap);
    materials.push(capMat);
  }

  function applyBulletDamage() {
    var craterCount = 15;
    for (var i = 0; i < craterCount; i++) {
      var craterGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var craterMat = new THREE.MeshStandardMaterial({
        color: 0x2F4F4F,
        roughness: 0.95,
        metalness: 0.3
      });
      var crater = new THREE.Mesh(craterGeom, craterMat);
      var randomWall = Math.floor(Math.random() * 4);
      var positions = [
        {x: -30, z: Math.random() * 40 - 20},
        {x: 30, z: Math.random() * 40 - 20},
        {x: Math.random() * 40 - 20, z: -30},
        {x: Math.random() * 40 - 20, z: 30}
      ];
      var pos = positions[randomWall];
      crater.position.set(pos.x, 4 + Math.random() * 4, pos.z);
      scene.add(crater);
      meshes.push(crater);
    }
  }

  function update(delta) {
    if (meshes.length === 0) return;

    meshes.forEach(function(mesh, idx) {
      if (idx === meshes.length - 2) {
        mesh.rotation.y += delta * 0.5;
      }
    });

    materials.forEach(function(mat) {
      if (mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.001) * 0.2;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
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
    materials = [];
    meshes = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
