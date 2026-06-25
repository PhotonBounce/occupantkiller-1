window.LavaCore = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var materials = {};
  var rotatingParts = [];
  var pulsatingParts = [];

  function createMaterials() {
    materials.lava = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      emissiveIntensity: 0.8,
      metalness: 0.3,
      roughness: 0.2
    });

    materials.obsidian = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.3
    });

    materials.steel = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.8,
      roughness: 0.2
    });

    materials.heatShield = new THREE.MeshStandardMaterial({
      color: 0x333300,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.4
    });

    materials.pod = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });
  }

  function buildLavaChannel() {
    var geometry = new THREE.BoxGeometry(40, 2, 30);
    var mesh = new THREE.Mesh(geometry, materials.lava);
    mesh.position.set(0, 0, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    pulsatingParts.push(mesh);
  }

  function buildWallPillars() {
    var positions = [
      [-20, 0, -15],
      [20, 0, -15],
      [-20, 0, 15],
      [20, 0, 15],
      [-15, 0, 0],
      [15, 0, 0]
    ];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(4, 35, 4);
      var mesh = new THREE.Mesh(geometry, materials.obsidian);
      mesh.position.set(pos[0], pos[1] + 17, pos[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    });
  }

  function buildResearchPlatforms() {
    var platformPositions = [
      [-12, 8, -8],
      [12, 8, -8],
      [0, 10, 8]
    ];

    platformPositions.forEach(function(pos) {
      var platformGeo = new THREE.BoxGeometry(8, 1, 6);
      var platform = new THREE.Mesh(platformGeo, materials.steel);
      platform.position.set(pos[0], pos[1], pos[2]);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      meshes.push(platform);

      var supportGeo = new THREE.CylinderGeometry(0.8, 0.8, pos[1], 8);
      var support = new THREE.Mesh(supportGeo, materials.steel);
      support.position.set(pos[0], pos[1] / 2, pos[2]);
      support.castShadow = true;
      scene.add(support);
      meshes.push(support);
    });
  }

  function buildCoolingTower() {
    var cylinderGeo = new THREE.CylinderGeometry(3, 3.5, 20, 16);
    var tower = new THREE.Mesh(cylinderGeo, materials.steel);
    tower.position.set(0, 10, -18);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    meshes.push(tower);
    rotatingParts.push(tower);

    for (var i = 0; i < 4; i++) {
      var ventGeo = new THREE.BoxGeometry(0.5, 4, 2);
      var vent = new THREE.Mesh(ventGeo, materials.heatShield);
      var angle = (i / 4) * Math.PI * 2;
      vent.position.set(
        Math.cos(angle) * 3.2,
        15,
        -18 + Math.sin(angle) * 3.2
      );
      vent.castShadow = true;
      scene.add(vent);
      meshes.push(vent);
    }
  }

  function buildHeatShield() {
    var geometry = new THREE.BoxGeometry(18, 8, 1);
    var shield = new THREE.Mesh(geometry, materials.heatShield);
    shield.position.set(0, 12, 20);
    shield.castShadow = true;
    shield.receiveShadow = true;
    scene.add(shield);
    meshes.push(shield);
    pulsatingParts.push(shield);
  }

  function buildDrillingRig() {
    var housingGeo = new THREE.BoxGeometry(5, 6, 5);
    var housing = new THREE.Mesh(housingGeo, materials.steel);
    housing.position.set(-18, 8, -12);
    housing.castShadow = true;
    housing.receiveShadow = true;
    scene.add(housing);
    meshes.push(housing);

    var bitGeo = new THREE.CylinderGeometry(1.2, 0.8, 4, 8);
    var bit = new THREE.Mesh(bitGeo, materials.obsidian);
    bit.position.set(-18, 2, -12);
    bit.castShadow = true;
    scene.add(bit);
    meshes.push(bit);
    rotatingParts.push(bit);
  }

  function buildEscapePods() {
    var podPositions = [
      [-10, 22, 0],
      [0, 24, 0],
      [10, 22, 0]
    ];

    podPositions.forEach(function(pos, index) {
      var podGeo = new THREE.SphereGeometry(1.2, 8, 8);
      var pod = new THREE.Mesh(podGeo, materials.pod);
      pod.position.set(pos[0], pos[1], pos[2]);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      meshes.push(pod);

      var railGeo = new THREE.BufferGeometry();
      var railPoints = [
        new THREE.Vector3(pos[0], pos[1], pos[2] - 5),
        new THREE.Vector3(pos[0], pos[1] - 15, pos[2] + 8)
      ];
      railGeo.setFromPoints(railPoints);
      var railLine = new THREE.LineSegments(railGeo, new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 }));
      scene.add(railLine);
      meshes.push(railLine);
    });
  }

  function buildCommandCenter() {
    var baseGeo = new THREE.BoxGeometry(12, 2, 12);
    var base = new THREE.Mesh(baseGeo, materials.steel);
    base.position.set(0, 30, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    meshes.push(base);

    var superstructureGeo = new THREE.CylinderGeometry(4, 4.5, 6, 12);
    var superstructure = new THREE.Mesh(superstructureGeo, materials.steel);
    superstructure.position.set(0, 34, 0);
    superstructure.castShadow = true;
    superstructure.receiveShadow = true;
    scene.add(superstructure);
    meshes.push(superstructure);
  }

  function buildSurroundingRock() {
    var rockPositions = [
      [-30, 10, -25, 8, 30, 8],
      [30, 10, -25, 8, 30, 8],
      [-30, 10, 25, 8, 30, 8],
      [30, 10, 25, 8, 30, 8]
    ];

    rockPositions.forEach(function(params) {
      var geometry = new THREE.BoxGeometry(params[3], params[4], params[5]);
      var mesh = new THREE.Mesh(geometry, materials.obsidian);
      mesh.position.set(params[0], params[1], params[2]);
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    rotatingParts = [];
    pulsatingParts = [];

    createMaterials();
    buildLavaChannel();
    buildWallPillars();
    buildResearchPlatforms();
    buildCoolingTower();
    buildHeatShield();
    buildDrillingRig();
    buildEscapePods();
    buildCommandCenter();
    buildSurroundingRock();

    var light = new THREE.PointLight(0xff6600, 2, 100);
    light.position.set(0, 5, 0);
    light.castShadow = true;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x444444, 0.6);
    scene.add(ambientLight);
  }

  function update(delta) {
    rotatingParts.forEach(function(part) {
      part.rotation.y += delta * 0.5;
    });

    pulsatingParts.forEach(function(part) {
      var pulse = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
      if (part.material && part.material.emissiveIntensity !== undefined) {
        part.material.emissiveIntensity = pulse;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    meshes = [];
    rotatingParts = [];
    pulsatingParts = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
