window.IronCitadel = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var torches = [];
  var chains = [];
  var time = 0;

  var ironMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 });
  var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.0, roughness: 0.8 });
  var torchMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300 });

  function addMesh(geometry, material, x, y, z, rx, ry, rz, sx, sy, sz) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rx || ry || rz) mesh.rotation.set(rx || 0, ry || 0, rz || 0);
    if (sx || sy || sz) mesh.scale.set(sx || 1, sy || 1, sz || 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildOuterWalls() {
    var wallGeom = new THREE.BoxGeometry(150, 25, 8);

    addMesh(wallGeom, stoneMaterial, 0, 12, -75, 0, 0, 0);
    addMesh(wallGeom, stoneMaterial, 0, 12, 75, 0, 0, 0);

    var wallGeom2 = new THREE.BoxGeometry(8, 25, 150);
    addMesh(wallGeom2, stoneMaterial, -75, 12, 0, 0, 0, 0);
    addMesh(wallGeom2, stoneMaterial, 75, 12, 0, 0, 0, 0);
  }

  function buildWatchtowers() {
    var towerGeom = new THREE.CylinderGeometry(12, 12, 40, 8);

    addMesh(towerGeom, ironMaterial, -60, 20, -60, 0, 0, 0);
    addMesh(towerGeom, ironMaterial, 60, 20, -60, 0, 0, 0);
    addMesh(towerGeom, ironMaterial, -60, 20, 60, 0, 0, 0);
    addMesh(towerGeom, ironMaterial, 60, 20, 60, 0, 0, 0);

    var roofGeom = new THREE.ConeGeometry(15, 12, 8);
    addMesh(roofGeom, ironMaterial, -60, 50, -60, 0, 0, 0);
    addMesh(roofGeom, ironMaterial, 60, 50, -60, 0, 0, 0);
    addMesh(roofGeom, ironMaterial, -60, 50, 60, 0, 0, 0);
    addMesh(roofGeom, ironMaterial, 60, 50, 60, 0, 0, 0);
  }

  function buildBattlements() {
    var battlementGeom = new THREE.BoxGeometry(8, 8, 8);
    var positions = [
      [-70, 25, -75], [-50, 25, -75], [-30, 25, -75], [-10, 25, -75],
      [10, 25, -75], [30, 25, -75], [50, 25, -75], [70, 25, -75],
      [-75, 25, -70], [-75, 25, -50], [-75, 25, -30], [-75, 25, -10],
      [-75, 25, 10], [-75, 25, 30], [-75, 25, 50], [-75, 25, 70],
      [70, 25, -70], [70, 25, -50], [70, 25, -30], [70, 25, -10],
      [70, 25, 10], [70, 25, 30], [70, 25, 50], [70, 25, 70],
      [-70, 25, 75], [-50, 25, 75], [-30, 25, 75], [-10, 25, 75],
      [10, 25, 75], [30, 25, 75], [50, 25, 75], [70, 25, 75]
    ];

    for (var i = 0; i < positions.length; i++) {
      addMesh(battlementGeom, stoneMaterial, positions[i][0], positions[i][1], positions[i][2]);
    }
  }

  function buildCentralStructure() {
    var throneRoomGeom = new THREE.BoxGeometry(50, 30, 50);
    addMesh(throneRoomGeom, ironMaterial, 0, 15, 0);

    var throneGeom = new THREE.BoxGeometry(8, 12, 8);
    addMesh(throneGeom, ironMaterial, 0, 25, 15);

    var barracksGeom = new THREE.BoxGeometry(30, 20, 35);
    addMesh(barracksGeom, stoneMaterial, -40, 10, 0);
    addMesh(barracksGeom, stoneMaterial, 40, 10, 0);
  }

  function buildArmory() {
    var armoryGeom = new THREE.BoxGeometry(25, 18, 25);
    addMesh(armoryGeom, ironMaterial, 0, 9, -35);

    var rackGeom = new THREE.BoxGeometry(4, 15, 2);
    addMesh(rackGeom, ironMaterial, -8, 12, -32);
    addMesh(rackGeom, ironMaterial, 0, 12, -32);
    addMesh(rackGeom, ironMaterial, 8, 12, -32);
  }

  function buildDungeons() {
    var dungeonGeom = new THREE.BoxGeometry(40, 15, 40);
    addMesh(dungeonGeom, stoneMaterial, 0, -8, 0);

    var cellGeom = new THREE.BoxGeometry(8, 10, 8);
    addMesh(cellGeom, stoneMaterial, -15, -5, -15);
    addMesh(cellGeom, stoneMaterial, 15, -5, -15);
    addMesh(cellGeom, stoneMaterial, -15, -5, 15);
    addMesh(cellGeom, stoneMaterial, 15, -5, 15);

    var barsGeom = new THREE.CylinderGeometry(0.4, 0.4, 10, 4);
    var barPositions = [[-15, -5, -20], [15, -5, -20], [-15, -5, 20], [15, -5, 20]];
    for (var i = 0; i < barPositions.length; i++) {
      addMesh(barsGeom, ironMaterial, barPositions[i][0], barPositions[i][1], barPositions[i][2]);
    }
  }

  function buildGates() {
    var gateFrameGeom = new THREE.BoxGeometry(20, 35, 2);
    addMesh(gateFrameGeom, ironMaterial, 0, 17, -75);

    var portcullis = new THREE.BoxGeometry(18, 30, 1);
    addMesh(portcullis, ironMaterial, 0, 17, -74.5);

    var chainGeom = new THREE.CylinderGeometry(0.3, 0.3, 25, 4);
    var chainMesh1 = addMesh(chainGeom, ironMaterial, -8, 30, -75);
    var chainMesh2 = addMesh(chainGeom, ironMaterial, 8, 30, -75);
    chains.push({ mesh: chainMesh1, offset: 0 });
    chains.push({ mesh: chainMesh2, offset: Math.PI / 2 });
  }

  function buildTorches() {
    var torchPoleGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
    var torchHeadGeom = new THREE.SphereGeometry(1.5, 8, 8);

    var positions = [
      [-65, 8, -75], [65, 8, -75], [-75, 8, -65], [75, 8, -65],
      [-65, 8, 75], [65, 8, 75], [-75, 8, 65], [75, 8, 65],
      [-30, 8, 0], [30, 8, 0], [0, 8, -30], [0, 8, 30]
    ];

    for (var i = 0; i < positions.length; i++) {
      addMesh(torchPoleGeom, ironMaterial, positions[i][0], positions[i][1], positions[i][2]);
      var torchMesh = addMesh(torchHeadGeom, torchMaterial, positions[i][0], positions[i][1] + 3.5, positions[i][2]);
      torches.push({ mesh: torchMesh, phase: Math.random() * Math.PI * 2 });
    }
  }

  function buildInteriorDetails() {
    var pillarGeom = new THREE.CylinderGeometry(3, 3, 30, 8);
    addMesh(pillarGeom, stoneMaterial, -25, 15, -15);
    addMesh(pillarGeom, stoneMaterial, 25, 15, -15);
    addMesh(pillarGeom, stoneMaterial, -25, 15, 15);
    addMesh(pillarGeom, stoneMaterial, 25, 15, 15);

    var tableGeom = new THREE.BoxGeometry(20, 2, 12);
    addMesh(tableGeom, ironMaterial, 0, 18, 10);

    var chainVertGeom = new THREE.CylinderGeometry(0.2, 0.2, 15, 3);
    var chainVert1 = addMesh(chainVertGeom, ironMaterial, -20, 28, -10);
    var chainVert2 = addMesh(chainVertGeom, ironMaterial, 20, 28, -10);
    chains.push({ mesh: chainVert1, offset: 0 });
    chains.push({ mesh: chainVert2, offset: Math.PI });
  }

  function init(inputScene, camera) {
    scene = inputScene;
    time = 0;

    buildOuterWalls();
    buildWatchtowers();
    buildBattlements();
    buildCentralStructure();
    buildArmory();
    buildDungeons();
    buildGates();
    buildTorches();
    buildInteriorDetails();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 60, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < torches.length; i++) {
      var torch = torches[i];
      var flicker = 0.8 + 0.2 * Math.sin(time * 8 + torch.phase);
      torch.mesh.material.emissiveIntensity = flicker;
      torch.mesh.scale.set(0.9 + 0.1 * Math.sin(time * 6 + torch.phase), 0.9 + 0.1 * Math.sin(time * 6 + torch.phase), 0.9 + 0.1 * Math.sin(time * 6 + torch.phase));
    }

    for (var i = 0; i < chains.length; i++) {
      var chain = chains[i];
      var sway = 0.15 * Math.sin(time * 2 + chain.offset);
      chain.mesh.rotation.z = sway;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    torches = [];
    chains = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
