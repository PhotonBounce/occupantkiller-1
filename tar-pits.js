window.TarPits = (function() {
  'use strict';

  var scene = null;
  var tarObjects = [];
  var flameObjects = [];
  var animationTime = 0;

  var init = function(sceneRef, camera) {
    scene = sceneRef;
    tarObjects = [];
    flameObjects = [];

    buildTarPools();
    buildSkeletons();
    buildBoardwalks();
    buildRigs();
    buildMethaneVents();
    buildFortifications();
  };

  var buildTarPools = function() {
    var tarMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.1
    });

    var positions = [
      { x: -15, z: -10 },
      { x: 10, z: 5 },
      { x: -5, z: 15 },
      { x: 20, z: -20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var radius = 8 + Math.random() * 6;
      var geometry = new THREE.CylinderGeometry(radius, radius, 0.5, 32);
      var tar = new THREE.Mesh(geometry, tarMaterial);
      tar.position.set(pos.x, 0.25, pos.z);
      tar.rotation.x = -Math.PI / 2;
      tar.scale.z = 0.1;
      scene.add(tar);
      tarObjects.push(tar);
    }
  };

  var buildSkeletons = function() {
    var boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xccaa88,
      roughness: 0.8,
      metalness: 0.0
    });

    var skeletonPositions = [
      { x: -12, z: -8 },
      { x: 12, z: 8 },
      { x: 5, z: -15 }
    ];

    for (var i = 0; i < skeletonPositions.length; i++) {
      var pos = skeletonPositions[i];
      var ribcage = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 5, 16),
        boneMaterial
      );
      ribcage.position.set(pos.x, 2, pos.z);
      scene.add(ribcage);
      tarObjects.push(ribcage);

      var skull = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        boneMaterial
      );
      skull.position.set(pos.x, 6, pos.z);
      scene.add(skull);
      tarObjects.push(skull);

      var limbGeom = new THREE.CylinderGeometry(0.4, 0.3, 6, 8);
      var limb = new THREE.Mesh(limbGeom, boneMaterial);
      limb.position.set(pos.x - 3, 1, pos.z);
      limb.rotation.z = 0.3;
      scene.add(limb);
      tarObjects.push(limb);
    }
  };

  var buildBoardwalks = function() {
    var woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.9,
      metalness: 0.0
    });

    var boardPositions = [
      { x: 0, z: -25 },
      { x: -25, z: 0 },
      { x: 15, z: 20 }
    ];

    for (var i = 0; i < boardPositions.length; i++) {
      var pos = boardPositions[i];
      var boardGeom = new THREE.BoxGeometry(30, 1, 2);
      var board = new THREE.Mesh(boardGeom, woodMaterial);
      board.position.set(pos.x, 1.5, pos.z);
      scene.add(board);
      tarObjects.push(board);

      var railGeom = new THREE.BoxGeometry(30, 1.5, 0.3);
      var rail = new THREE.Mesh(railGeom, woodMaterial);
      rail.position.set(pos.x, 3, pos.z + 1.2);
      scene.add(rail);
      tarObjects.push(rail);
    }
  };

  var buildRigs = function() {
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.4,
      metalness: 0.8
    });

    var rigPositions = [
      { x: -20, z: 20 },
      { x: 25, z: -15 }
    ];

    for (var i = 0; i < rigPositions.length; i++) {
      var pos = rigPositions[i];

      var baseGeom = new THREE.BoxGeometry(8, 1, 8);
      var base = new THREE.Mesh(baseGeom, metalMaterial);
      base.position.set(pos.x, 0.5, pos.z);
      scene.add(base);
      tarObjects.push(base);

      var towerGeom = new THREE.CylinderGeometry(1.5, 2, 18, 12);
      var tower = new THREE.Mesh(towerGeom, metalMaterial);
      tower.position.set(pos.x, 9, pos.z);
      scene.add(tower);
      tarObjects.push(tower);

      var armGeom = new THREE.BoxGeometry(12, 1, 1);
      var arm = new THREE.Mesh(armGeom, metalMaterial);
      arm.position.set(pos.x + 6, 14, pos.z);
      arm.rotation.z = 0.2;
      scene.add(arm);
      tarObjects.push(arm);
    }
  };

  var buildMethaneVents = function() {
    var ventPositions = [
      { x: -8, z: -5 },
      { x: 6, z: 10 },
      { x: -18, z: 12 }
    ];

    for (var i = 0; i < ventPositions.length; i++) {
      var pos = ventPositions[i];

      var pipeGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
      var pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.6
      });
      var pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
      pipe.position.set(pos.x, 2, pos.z);
      scene.add(pipe);
      tarObjects.push(pipe);

      var flameGeom = new THREE.ConeGeometry(0.6, 3, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0x0066ff,
        emissive: 0x0044ff,
        emissiveIntensity: 1.0,
        roughness: 1.0
      });
      var flame = new THREE.Mesh(flameGeom, flameMaterial);
      flame.position.set(pos.x, 5, pos.z);
      flame.userData.baseY = 5;
      flame.userData.intensity = Math.random();
      scene.add(flame);
      flameObjects.push(flame);
      tarObjects.push(flame);
    }
  };

  var buildFortifications = function() {
    var fortMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.85,
      metalness: 0.1
    });

    var wallPositions = [
      { x: -30, z: -5, w: 15, d: 1 },
      { x: 30, z: 10, w: 12, d: 1 },
      { x: 0, z: 30, w: 1, d: 18 }
    ];

    for (var i = 0; i < wallPositions.length; i++) {
      var pos = wallPositions[i];
      var wallGeom = new THREE.BoxGeometry(pos.w, 4, pos.d);
      var wall = new THREE.Mesh(wallGeom, fortMaterial);
      wall.position.set(pos.x, 2, pos.z);
      scene.add(wall);
      tarObjects.push(wall);

      var roofGeom = new THREE.ConeGeometry(pos.w / 2 + 1, 2, 6);
      var roof = new THREE.Mesh(roofGeom, fortMaterial);
      roof.position.set(pos.x, 5, pos.z);
      scene.add(roof);
      tarObjects.push(roof);
    }
  };

  var update = function(delta) {
    animationTime += delta;

    for (var i = 0; i < flameObjects.length; i++) {
      var flame = flameObjects[i];
      var wave = Math.sin(animationTime * 3 + flame.userData.intensity * 6.28) * 0.5;
      flame.position.y = flame.userData.baseY + wave * 0.8;
      flame.scale.y = 1 + wave * 0.3;

      var flicker = Math.sin(animationTime * 8 + flame.userData.intensity * 10) * 0.3 + 0.7;
      flame.material.emissiveIntensity = flicker;
    }

    for (var j = 0; j < tarObjects.length; j++) {
      if (tarObjects[j].geometry instanceof THREE.CylinderGeometry &&
          tarObjects[j].scale.z < 0.2) {
        var bubble = Math.sin(animationTime * 2 + j * 0.5) * 0.02;
        tarObjects[j].position.y = 0.25 + bubble;
      }
    }
  };

  var reset = function() {
    for (var i = tarObjects.length - 1; i >= 0; i--) {
      scene.remove(tarObjects[i]);
    }
    tarObjects = [];
    flameObjects = [];
    animationTime = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
