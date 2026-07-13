window.EchoStation = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var cables = [];
  var stalactites = [];

  function buildWalls() {
    var wallGeom = new THREE.CylinderGeometry(25, 25, 12, 32);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    var wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.y = 6;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
    meshes.push(wallMesh);

    var foamGeom = new THREE.BoxGeometry(48, 10, 1);
    var foamMat = new THREE.MeshStandardMaterial({ color: 0x4a3f35, roughness: 0.9, emissive: 0x111111 });
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var foamMesh = new THREE.Mesh(foamGeom, foamMat);
      foamMesh.position.x = Math.cos(angle) * 25.5;
      foamMesh.position.z = Math.sin(angle) * 25.5;
      foamMesh.position.y = 6;
      foamMesh.rotation.y = angle;
      foamMesh.receiveShadow = true;
      scene.add(foamMesh);
      meshes.push(foamMesh);
    }
  }

  function buildMicrophoneArrays() {
    var sphereGeom = new THREE.SphereGeometry(8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
    var micMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.7, roughness: 0.3 });

    var positions = [
      [-12, 2, -12],
      [12, 2, -12],
      [-12, 2, 12],
      [12, 2, 12],
      [0, 1, 0]
    ];

    positions.forEach(function(pos) {
      var sphereMesh = new THREE.Mesh(sphereGeom, micMat);
      sphereMesh.position.set(pos[0], pos[1], pos[2]);
      sphereMesh.scale.set(0.8, 0.6, 0.8);
      sphereMesh.castShadow = true;
      sphereMesh.receiveShadow = true;
      scene.add(sphereMesh);
      meshes.push(sphereMesh);
    });
  }

  function buildRecordingBanks() {
    var rackGeom = new THREE.BoxGeometry(3, 6, 2);
    var rackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.5, roughness: 0.4 });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var rackMesh = new THREE.Mesh(rackGeom, rackMat);
      rackMesh.position.x = Math.cos(angle) * 20;
      rackMesh.position.z = Math.sin(angle) * 20;
      rackMesh.position.y = 3;
      rackMesh.rotation.y = angle;
      rackMesh.castShadow = true;
      rackMesh.receiveShadow = true;
      scene.add(rackMesh);
      meshes.push(rackMesh);

      var reelGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 24);
      var reelMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 });
      for (var j = 0; j < 3; j++) {
        var reelMesh = new THREE.Mesh(reelGeom, reelMat);
        reelMesh.position.x = Math.cos(angle) * 20 + 0.5;
        reelMesh.position.z = Math.sin(angle) * 20;
        reelMesh.position.y = 2 + j * 2;
        reelMesh.castShadow = true;
        scene.add(reelMesh);
        meshes.push(reelMesh);
      }
    }
  }

  function buildBlastDoors() {
    var doorGeom = new THREE.CylinderGeometry(6, 6, 0.8, 8);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 });

    var doorPositions = [
      [0, 6, -24],
      [0, 6, 24]
    ];

    doorPositions.forEach(function(pos) {
      var doorMesh = new THREE.Mesh(doorGeom, doorMat);
      doorMesh.position.set(pos[0], pos[1], pos[2]);
      doorMesh.castShadow = true;
      doorMesh.receiveShadow = true;
      scene.add(doorMesh);
      meshes.push(doorMesh);
    });
  }

  function buildCables() {
    var cableMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 });

    for (var i = 0; i < 8; i++) {
      var points = [];
      var startX = Math.cos((i / 8) * Math.PI * 2) * 22;
      var startZ = Math.sin((i / 8) * Math.PI * 2) * 22;

      points.push(new THREE.Vector3(startX, 11, startZ));
      points.push(new THREE.Vector3(startX * 0.7, 9, startZ * 0.7));
      points.push(new THREE.Vector3(0, 8, 0));
      points.push(new THREE.Vector3(startX * -0.5, 9, startZ * -0.5));

      var geom = new THREE.BufferGeometry().setFromPoints(points);
      var cable = new THREE.LineSegments(geom, cableMat);
      scene.add(cable);
      cables.push(cable);
    }
  }

  function buildStalactites() {
    var staleMat = new THREE.MeshStandardMaterial({ color: 0x5a5a4a, roughness: 0.8 });

    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var radiusDist = 15 + Math.sin(i * 0.7) * 5;
      var baseX = Math.cos(angle) * radiusDist;
      var baseZ = Math.sin(angle) * radiusDist;

      for (var j = 0; j < 3; j++) {
        var coneGeom = new THREE.ConeGeometry(0.6 - j * 0.15, 2.5 - j * 0.8, 8);
        var coneMesh = new THREE.Mesh(coneGeom, staleMat);
        coneMesh.position.set(baseX + Math.random() * 1.5 - 0.75, 11.5 - j * 1.2, baseZ + Math.random() * 1.5 - 0.75);
        coneMesh.rotation.z = Math.random() * 0.2 - 0.1;
        coneMesh.castShadow = true;
        scene.add(coneMesh);
        stalactites.push(coneMesh);
      }
    }
  }

  function buildFloor() {
    var floorGeom = new THREE.CylinderGeometry(26, 26, 0.5, 32);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95 });
    var floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.y = -0.25;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);
    meshes.push(floorMesh);

    var waterGeom = new THREE.CylinderGeometry(26, 26, 0.3, 32);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x0d1a2e, metalness: 0.3, roughness: 0.4, emissive: 0x001a33 });
    var waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.y = 0.15;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    meshes.push(waterMesh);
  }

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    meshes = [];
    cables = [];
    stalactites = [];

    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 60, 100);

    var light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(20, 15, 20);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.far = 100;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x4a5a7a, 0.4);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffaa00, 0.8, 40);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    buildFloor();
    buildWalls();
    buildMicrophoneArrays();
    buildRecordingBanks();
    buildBlastDoors();
    buildCables();
    buildStalactites();
  }

  function update(delta) {
    stalactites.forEach(function(stale, index) {
      stale.position.y += Math.sin(Date.now() * 0.0002 + index * 0.5) * delta * 0.1;
    });

    cables.forEach(function(cable, index) {
      cable.rotation.z += delta * 0.05;
    });

    meshes.forEach(function(mesh) {
      if (mesh.material.emissive) {
        var pulse = Math.sin(Date.now() * 0.002) * 0.15 + 0.15;
        mesh.material.emissive.setHex(parseInt('111111', 16));
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
    });
    cables.forEach(function(cable) {
      scene.remove(cable);
      if (cable.geometry) cable.geometry.dispose();
      if (cable.material) cable.material.dispose();
    });
    stalactites.forEach(function(stale) {
      scene.remove(stale);
      if (stale.geometry) stale.geometry.dispose();
      if (stale.material) stale.material.dispose();
    });
    meshes = [];
    cables = [];
    stalactites = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
