window.AvalanchePass = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var geometry, material, mesh;

  function addMesh(geom, mat, x, y, z, sx, sy, sz, rx, ry, rz) {
    var m = new THREE.Mesh(geom, mat);
    m.position.set(x, y, z);
    if (sx || sy || sz) m.scale.set(sx || 1, sy || 1, sz || 1);
    if (rx || ry || rz) {
      if (rx) m.rotation.x = rx;
      if (ry) m.rotation.y = ry;
      if (rz) m.rotation.z = rz;
    }
    scene.add(m);
    meshes.push(m);
    return m;
  }

  function buildCliffWalls() {
    var cliffMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 });
    addMesh(new THREE.BoxGeometry(40, 60, 8), cliffMat, -50, 20, 0, 1, 1, 1);
    addMesh(new THREE.BoxGeometry(40, 60, 8), cliffMat, 50, 20, 0, 1, 1, 1);
    addMesh(new THREE.BoxGeometry(60, 50, 8), cliffMat, 0, 15, -45, 1, 1, 1);
  }

  function buildAvalancheDebris() {
    var snowMat = new THREE.MeshStandardMaterial({ color: 0xfffacd, roughness: 0.8 });
    var rockMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.9 });

    var positions = [
      [0, 2, 0, 8, 5, 6], [15, 3, 5, 6, 4, 7], [-12, 2, 8, 7, 3, 8],
      [25, 1, -10, 5, 5, 5], [-20, 2, -8, 8, 4, 6], [8, 1, 15, 6, 3, 7]
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      if (i % 2 === 0) {
        addMesh(new THREE.BoxGeometry(p[3], p[4], p[5]), snowMat, p[0], p[1], p[2]);
      } else {
        addMesh(new THREE.SphereGeometry(p[3] * 0.8, 6, 6), rockMat, p[0], p[1], p[2]);
      }
    }
  }

  function buildBuriedVehicles() {
    var metalMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8 });
    addMesh(new THREE.BoxGeometry(12, 6, 20), metalMat, -28, 3, 12, 1, 1, 1, 0.3, 0, 0);
    addMesh(new THREE.BoxGeometry(14, 5, 18), metalMat, 22, 2, 10, 1, 1, 1, -0.25, 0, 0);
    addMesh(new THREE.CylinderGeometry(3, 3, 8, 8), metalMat, -28, 1.5, 20);
    addMesh(new THREE.CylinderGeometry(3, 3, 8, 8), metalMat, 22, 1.5, 18);
  }

  function buildDefenseWalls() {
    var defenseMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.6 });
    addMesh(new THREE.BoxGeometry(30, 12, 4), defenseMat, 0, 8, 25, 1, 1, 1, 0.2, 0, 0);
    addMesh(new THREE.BoxGeometry(20, 10, 4), defenseMat, -35, 6, 20, 1, 1, 1, -0.15, 0, 0);
    addMesh(new THREE.BoxGeometry(20, 10, 4), defenseMat, 35, 6, 22, 1, 1, 1, 0.15, 0, 0);
  }

  function buildCableCarStation() {
    var terminalMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.6 });

    addMesh(new THREE.BoxGeometry(18, 12, 16), terminalMat, 0, 10, -30);
    addMesh(new THREE.CylinderGeometry(2, 2, 35, 8), towerMat, -12, 20, -28);
    addMesh(new THREE.CylinderGeometry(2, 2, 35, 8), towerMat, 12, 20, -28);

    var cableMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var cableGeom = new THREE.BufferGeometry();
    var points = [
      new THREE.Vector3(-12, 35, -28),
      new THREE.Vector3(12, 35, -28),
      new THREE.Vector3(0, 25, 0)
    ];
    cableGeom.setFromPoints(points);
    var cable = new THREE.LineSegments(cableGeom, cableMat);
    scene.add(cable);
    meshes.push(cable);

    var cableGeom2 = new THREE.BufferGeometry();
    var points2 = [
      new THREE.Vector3(-10, 33, -26),
      new THREE.Vector3(10, 33, -26),
      new THREE.Vector3(0, 23, 2)
    ];
    cableGeom2.setFromPoints(points2);
    var cable2 = new THREE.LineSegments(cableGeom2, cableMat);
    scene.add(cable2);
    meshes.push(cable2);
  }

  function buildGuardPosts() {
    var postMat = new THREE.MeshStandardMaterial({ color: 0xd3d3d3, roughness: 0.8 });
    addMesh(new THREE.BoxGeometry(6, 10, 6), postMat, -40, 8, 35);
    addMesh(new THREE.BoxGeometry(6, 10, 6), postMat, 40, 8, 35);
    addMesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 6), postMat, -40, 10, 35);
    addMesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 6), postMat, 40, 10, 35);
  }

  function buildMountainPeaks() {
    var peakMat = new THREE.MeshStandardMaterial({ color: 0xa9a9a9, roughness: 0.85 });
    var snowCapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });

    var peakX = -60;
    var peakZ = -80;
    var levels = [
      [60, 40, 30], [48, 32, 24], [36, 24, 18], [24, 16, 12], [12, 8, 6]
    ];
    var yOffset = 0;

    for (var i = 0; i < levels.length; i++) {
      var w = levels[i][0];
      var h = levels[i][1];
      var d = levels[i][2];
      addMesh(new THREE.BoxGeometry(w, h, d), peakMat, peakX, yOffset + h/2, peakZ);
      addMesh(new THREE.ConeGeometry(w * 0.6, 20, 8), snowCapMat, peakX, yOffset + h + 10, peakZ);
      yOffset += h;
    }
  }

  function buildTerrain() {
    var groundMat = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.9 });
    addMesh(new THREE.BoxGeometry(200, 2, 200), groundMat, 0, -1, 0);
  }

  function buildLights() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(40, 50, 30);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    var pointLight = new THREE.PointLight(0xadd8e6, 0.5);
    pointLight.position.set(-30, 25, 20);
    scene.add(pointLight);
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];

    buildTerrain();
    buildCliffWalls();
    buildAvalancheDebris();
    buildBuriedVehicles();
    buildDefenseWalls();
    buildCableCarStation();
    buildGuardPosts();
    buildMountainPeaks();
    buildLights();
  };

  var update = function(delta) {
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].userData.rotating) {
        meshes[i].rotation.y += delta * 0.3;
      }
    }
  };

  var reset = function() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
