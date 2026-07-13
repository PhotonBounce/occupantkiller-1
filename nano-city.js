window.NanoCity = (function() {
  'use strict';

  var scene, camera, objects, particles;
  var redCells, whiteCells, turrets, pathways, dnaHelix;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    particles = [];

    buildRedCellBuildings();
    buildWhiteCellTanks();
    buildMitochondriaPowerStations();
    buildAntibodyTurrets();
    buildNeuralPathways();
    buildDNAHelix();
    buildEnvironment();
  }

  function buildRedCellBuildings() {
    redCells = [];
    var positions = [
      [-30, 5, -40], [0, 5, -50], [30, 5, -40],
      [-25, 5, 0], [25, 5, 0],
      [-30, 5, 40], [0, 5, 50], [30, 5, 40]
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(8, 8, 3, 32);
      var material = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        metalness: 0.6,
        roughness: 0.4
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      redCells.push(mesh);
      objects.push(mesh);
    });
  }

  function buildWhiteCellTanks() {
    whiteCells = [];
    var positions = [
      [-15, 3, -20], [15, 3, -20],
      [-15, 3, 20], [15, 3, 20]
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.SphereGeometry(6, 16, 16);
      var material = new THREE.MeshStandardMaterial({
        color: 0xffffdd,
        metalness: 0.5,
        roughness: 0.5
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      whiteCells.push(mesh);
      objects.push(mesh);
    });
  }

  function buildMitochondriaPowerStations() {
    var positions = [
      [-40, 8, 0], [40, 8, 0],
      [0, 8, -45], [0, 8, 45]
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(10, 12, 10);
      var material = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.7,
        roughness: 0.3
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    });
  }

  function buildAntibodyTurrets() {
    turrets = [];
    var positions = [
      [-45, 12, -45], [45, 12, -45],
      [-45, 12, 45], [45, 12, 45]
    ];

    positions.forEach(function(pos) {
      var baseGeo = new THREE.CylinderGeometry(3, 4, 2, 16);
      var baseMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        metalness: 0.8,
        roughness: 0.2
      });
      var baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(pos[0], pos[1], pos[2]);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      scene.add(baseMesh);

      var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
      var barrelMat = new THREE.MeshStandardMaterial({
        color: 0x00aa55,
        metalness: 0.9,
        roughness: 0.1
      });
      var barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
      barrelMesh.position.set(pos[0], pos[1] + 4, pos[2]);
      barrelMesh.rotation.z = Math.PI / 6;
      barrelMesh.castShadow = true;
      scene.add(barrelMesh);

      turrets.push({
        base: baseMesh,
        barrel: barrelMesh,
        angle: 0
      });
      objects.push(baseMesh);
    });
  }

  function buildNeuralPathways() {
    pathways = [];
    var roadPairs = [
      [[-50, 1, 0], [50, 1, 0]],
      [[0, 1, -60], [0, 1, 60]],
      [[-40, 1, -40], [40, 1, 40]],
      [[-40, 1, 40], [40, 1, -40]]
    ];

    roadPairs.forEach(function(pair) {
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array([
        pair[0][0], pair[0][1], pair[0][2],
        pair[1][0], pair[1][1], pair[1][2]
      ]);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      var material = new THREE.LineBasicMaterial({
        color: 0x00ccff,
        linewidth: 3
      });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      pathways.push(line);
    });
  }

  function buildDNAHelix() {
    dnaHelix = [];
    var geometry = new THREE.BoxGeometry(2, 2, 2);
    var material = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      metalness: 0.6,
      roughness: 0.4
    });

    for (var i = 0; i < 12; i++) {
      var mesh = new THREE.Mesh(geometry, material);
      var angle = (i / 12) * Math.PI * 4;
      var height = i * 3;
      mesh.position.set(
        Math.cos(angle) * 8,
        height - 18,
        Math.sin(angle) * 8
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      dnaHelix.push(mesh);
      objects.push(mesh);
    }
  }

  function buildEnvironment() {
    var groundGeo = new THREE.BoxGeometry(120, 1, 120);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a2a,
      metalness: 0.3,
      roughness: 0.7
    });
    var groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -1;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    var skyGeo = new THREE.SphereGeometry(200, 32, 32);
    var skyMat = new THREE.MeshBasicMaterial({
      color: 0x001a33,
      side: THREE.BackSide
    });
    var skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    redCells.forEach(function(cell) {
      cell.rotation.y += delta * 0.3;
    });

    whiteCells.forEach(function(cell) {
      cell.position.y += Math.sin(time + cell.position.x * 0.02) * 0.015;
    });

    turrets.forEach(function(turret) {
      turret.angle += delta * 1.2;
      turret.barrel.rotation.z = Math.sin(time * 2) * 0.5;
    });

    dnaHelix.forEach(function(box, index) {
      box.rotation.x += delta * 0.2;
      box.rotation.y += delta * 0.3;
    });

    pathways.forEach(function(pathway) {
      pathway.material.color.setHSL(
        0.55 + Math.sin(time * 2) * 0.1,
        1,
        0.5
      );
    });
  }

  function reset() {
    scene.clear();
    redCells = [];
    whiteCells = [];
    turrets = [];
    pathways = [];
    dnaHelix = [];
    objects = [];
    particles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
