window.SniperRidge = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var environmentObjects = [];
  var ropeLines = [];

  function buildRocks() {
    var rockPositions = [
      { x: -15, y: 8, z: -20, sx: 4, sy: 6, sz: 3 },
      { x: 10, y: 5, z: -25, sx: 5, sy: 4, sz: 4 },
      { x: -8, y: 12, z: -15, sx: 3, sy: 5, sz: 2 },
      { x: 20, y: 10, z: -30, sx: 6, sy: 7, sz: 3 },
      { x: 0, y: 3, z: -35, sx: 8, sy: 3, sz: 5 }
    ];
    var materialRock = new THREE.MeshPhongMaterial({ color: 0x8B8680 });
    for (var i = 0; i < rockPositions.length; i++) {
      var pos = rockPositions[i];
      var geometry = new THREE.BoxGeometry(pos.sx, pos.sy, pos.sz);
      var mesh = new THREE.Mesh(geometry, materialRock);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      environmentObjects.push(mesh);
    }
  }

  function buildValley() {
    var geometry = new THREE.BoxGeometry(80, 20, 60);
    var material = new THREE.MeshPhongMaterial({ color: 0x4A4A2A });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -15, 20);
    mesh.receiveShadow = true;
    scene.add(mesh);
    environmentObjects.push(mesh);
  }

  function buildGhillie() {
    var ghilliePositions = [
      { x: -12, y: 2, z: -10 },
      { x: 8, y: 3, z: -5 },
      { x: 25, y: 2, z: -28 }
    ];
    var materialGhillie = new THREE.MeshPhongMaterial({ color: 0x5A6B3A });
    for (var i = 0; i < ghilliePositions.length; i++) {
      var pos = ghilliePositions[i];
      for (var j = 0; j < 3; j++) {
        var offsetX = (Math.random() - 0.5) * 4;
        var offsetZ = (Math.random() - 0.5) * 4;
        var geometry = new THREE.SphereGeometry(0.8, 8, 8);
        var mesh = new THREE.Mesh(geometry, materialGhillie);
        mesh.position.set(pos.x + offsetX, pos.y + j * 1.2, pos.z + offsetZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        environmentObjects.push(mesh);
      }
    }
  }

  function buildTreeTrunks() {
    var trunkPositions = [
      { x: -25, y: 4, z: -18, rot: 0.3 },
      { x: 18, y: 3, z: -22, rot: -0.25 },
      { x: -5, y: 2, z: -12, rot: 0.2 }
    ];
    var materialWood = new THREE.MeshPhongMaterial({ color: 0x654321 });
    for (var i = 0; i < trunkPositions.length; i++) {
      var pos = trunkPositions[i];
      var geometry = new THREE.CylinderGeometry(0.4, 0.5, 8, 16);
      var mesh = new THREE.Mesh(geometry, materialWood);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.rotation.z = pos.rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      environmentObjects.push(mesh);
    }
  }

  function buildSpottingScopes() {
    var scopePositions = [
      { x: -18, y: 6, z: -8 },
      { x: 15, y: 8, z: -20 }
    ];
    var materialScope = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var materialTripod = new THREE.MeshPhongMaterial({ color: 0x555555 });
    for (var i = 0; i < scopePositions.length; i++) {
      var pos = scopePositions[i];
      var scopeGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
      var scopeMesh = new THREE.Mesh(scopeGeom, materialScope);
      scopeMesh.position.set(pos.x, pos.y + 1, pos.z);
      scopeMesh.rotation.z = 0.2;
      scopeMesh.castShadow = true;
      scene.add(scopeMesh);
      environmentObjects.push(scopeMesh);
      var tripodGeom = new THREE.BoxGeometry(2.5, 0.3, 2.5);
      var tripodMesh = new THREE.Mesh(tripodGeom, materialTripod);
      tripodMesh.position.set(pos.x, pos.y, pos.z);
      tripodMesh.castShadow = true;
      tripodMesh.receiveShadow = true;
      scene.add(tripodMesh);
      environmentObjects.push(tripodMesh);
    }
  }

  function buildAmmunitionCache() {
    var cacheX = 12;
    var cacheY = 1;
    var cacheZ = 5;
    var materialBox = new THREE.MeshPhongMaterial({ color: 0x2A2A1A });
    var boxGeom = new THREE.BoxGeometry(3, 2, 2);
    var boxMesh = new THREE.Mesh(boxGeom, materialBox);
    boxMesh.position.set(cacheX, cacheY, cacheZ);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);
    environmentObjects.push(boxMesh);
    var materialShells = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    for (var i = 0; i < 8; i++) {
      var offsetX = (Math.random() - 0.5) * 3;
      var offsetZ = (Math.random() - 0.5) * 2;
      var shellGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8);
      var shellMesh = new THREE.Mesh(shellGeom, materialShells);
      shellMesh.position.set(cacheX + offsetX, cacheY + 1.5, cacheZ + offsetZ);
      shellMesh.castShadow = true;
      scene.add(shellMesh);
      environmentObjects.push(shellMesh);
    }
  }

  function buildRappelAnchors() {
    var anchorPositions = [
      { x: -20, z: -35 },
      { x: 15, z: -32 }
    ];
    var materialMetal = new THREE.MeshPhongMaterial({ color: 0x888888 });
    for (var i = 0; i < anchorPositions.length; i++) {
      var pos = anchorPositions[i];
      var anchorGeom = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      var anchorMesh = new THREE.Mesh(anchorGeom, materialMetal);
      anchorMesh.position.set(pos.x, 12, pos.z);
      anchorMesh.castShadow = true;
      scene.add(anchorMesh);
      environmentObjects.push(anchorMesh);
      var points = [
        new THREE.Vector3(pos.x, 12, pos.z),
        new THREE.Vector3(pos.x - 3, 0, pos.z + 5)
      ];
      var ropeGeom = new THREE.BufferGeometry().setFromPoints(points);
      var ropeMat = new THREE.LineBasicMaterial({ color: 0xBB9966 });
      var ropeSegments = new THREE.LineSegments(ropeGeom, ropeMat);
      scene.add(ropeSegments);
      ropeLines.push(ropeSegments);
      var points2 = [
        new THREE.Vector3(pos.x, 12, pos.z),
        new THREE.Vector3(pos.x + 3, 0, pos.z + 5)
      ];
      var ropeGeom2 = new THREE.BufferGeometry().setFromPoints(points2);
      var ropeSegments2 = new THREE.LineSegments(ropeGeom2, ropeMat);
      scene.add(ropeSegments2);
      ropeLines.push(ropeSegments2);
    }
  }

  function buildRadioTower() {
    var towerX = 0;
    var towerZ = -40;
    var mastGeom = new THREE.CylinderGeometry(0.2, 0.25, 25, 12);
    var mastMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var mastMesh = new THREE.Mesh(mastGeom, mastMat);
    mastMesh.position.set(towerX, 10, towerZ);
    mastMesh.castShadow = true;
    scene.add(mastMesh);
    environmentObjects.push(mastMesh);
    var aerialPositions = [
      { x: towerX + 1.5, y: 20, z: towerZ - 1.5 },
      { x: towerX - 1.5, y: 20, z: towerZ + 1.5 },
      { x: towerX + 1, y: 15, z: towerZ }
    ];
    var aerialMat = new THREE.LineBasicMaterial({ color: 0xFF6600 });
    for (var i = 0; i < aerialPositions.length; i++) {
      var pos = aerialPositions[i];
      var points = [
        new THREE.Vector3(towerX, 12, towerZ),
        new THREE.Vector3(pos.x, pos.y, pos.z)
      ];
      var aerialGeom = new THREE.BufferGeometry().setFromPoints(points);
      var aerialSegments = new THREE.LineSegments(aerialGeom, aerialMat);
      scene.add(aerialSegments);
      ropeLines.push(aerialSegments);
    }
  }

  function buildTerrainBase() {
    var baseGeom = new THREE.BoxGeometry(150, 2, 100);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x7A6E4B });
    var baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(0, -18, 10);
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    environmentObjects.push(baseMesh);
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    environmentObjects = [];
    ropeLines = [];
    buildTerrainBase();
    buildValley();
    buildRocks();
    buildGhillie();
    buildTreeTrunks();
    buildSpottingScopes();
    buildAmmunitionCache();
    buildRappelAnchors();
    buildRadioTower();
  }

  function update(delta) {
    for (var i = 0; i < environmentObjects.length; i++) {
      if (environmentObjects[i].userData.oscillate) {
        environmentObjects[i].position.y += Math.sin(Date.now() * 0.001) * 0.01;
      }
    }
  }

  function reset() {
    for (var i = 0; i < environmentObjects.length; i++) {
      scene.remove(environmentObjects[i]);
    }
    for (var i = 0; i < ropeLines.length; i++) {
      scene.remove(ropeLines[i]);
    }
    environmentObjects = [];
    ropeLines = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
