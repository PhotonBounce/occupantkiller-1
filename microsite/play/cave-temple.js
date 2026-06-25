window.CaveTemple = (function() {
  'use strict';

  var scene, camera;
  var caveObjects = [];
  var torches = [];
  var idolGlow = null;

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8,
      metalness: 0.1
    });

    var positions = [
      { x: -25, y: 5, z: -30, w: 12, h: 20, d: 8 },
      { x: 25, y: 5, z: -30, w: 12, h: 20, d: 8 },
      { x: -35, y: 5, z: 0, w: 8, h: 20, d: 40 },
      { x: 35, y: 5, z: 0, w: 8, h: 20, d: 40 },
      { x: 0, y: 8, z: 25, w: 50, h: 15, d: 10 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var mesh = new THREE.Mesh(geometry, wallMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      caveObjects.push(mesh);
    }
  }

  function buildEntrance() {
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.7,
      metalness: 0.05
    });

    var capitalMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6,
      metalness: 0.1
    });

    var positions = [
      { x: -8, z: -35 },
      { x: 8, z: -35 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var columnGeo = new THREE.CylinderGeometry(2, 2, 12, 8);
      var column = new THREE.Mesh(columnGeo, columnMaterial);
      column.position.set(pos.x, 6, pos.z);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      caveObjects.push(column);

      var capitalGeo = new THREE.BoxGeometry(5, 1.5, 5);
      var capital = new THREE.Mesh(capitalGeo, capitalMaterial);
      capital.position.set(pos.x, 13, pos.z);
      capital.castShadow = true;
      capital.receiveShadow = true;
      scene.add(capital);
      caveObjects.push(capital);
    }
  }

  function buildAltar() {
    var altarMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.5,
      metalness: 0.2
    });

    var altarGeo = new THREE.BoxGeometry(6, 3, 6);
    var altar = new THREE.Mesh(altarGeo, altarMaterial);
    altar.position.set(0, 1.5, 15);
    altar.castShadow = true;
    altar.receiveShadow = true;
    scene.add(altar);
    caveObjects.push(altar);

    var idolMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.2
    });

    var idolGeo = new THREE.SphereGeometry(1.2, 16, 16);
    idolGlow = new THREE.Mesh(idolGeo, idolMaterial);
    idolGlow.position.set(0, 5, 15);
    idolGlow.castShadow = true;
    scene.add(idolGlow);
    caveObjects.push(idolGlow);
  }

  function buildStalactites() {
    var stalactiteMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b6b6b,
      roughness: 0.8,
      metalness: 0.05
    });

    var stalactitePositions = [
      { x: -15, z: -10, h: 8 },
      { x: 15, z: -10, h: 9 },
      { x: -20, z: 5, h: 7 },
      { x: 20, z: 5, h: 8 },
      { x: 0, z: 15, h: 10 },
      { x: -10, z: 20, h: 6 }
    ];

    for (var i = 0; i < stalactitePositions.length; i++) {
      var pos = stalactitePositions[i];
      var geo = new THREE.ConeGeometry(0.8, pos.h, 8);
      var mesh = new THREE.Mesh(geo, stalactiteMaterial);
      mesh.position.set(pos.x, 22 - pos.h / 2, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      caveObjects.push(mesh);
    }
  }

  function buildTorches() {
    var torchPositions = [
      { x: -30, z: -20 },
      { x: 30, z: -20 },
      { x: -32, z: 10 },
      { x: 32, z: 10 }
    ];

    for (var i = 0; i < torchPositions.length; i++) {
      var pos = torchPositions[i];

      var torchGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
      var torchMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.7
      });
      var torch = new THREE.Mesh(torchGeo, torchMaterial);
      torch.position.set(pos.x, 8, pos.z);
      torch.castShadow = true;
      torch.receiveShadow = true;
      scene.add(torch);
      caveObjects.push(torch);

      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6B00,
        emissive: 0xFF4500,
        emissiveIntensity: 0.8,
        metalness: 0,
        roughness: 0.3
      });

      var flameGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var flame = new THREE.Mesh(flameGeo, flameMaterial);
      flame.position.set(pos.x, 10, pos.z);
      flame.userData.baseY = 10;
      scene.add(flame);
      torches.push(flame);
      caveObjects.push(flame);
    }
  }

  function buildWeaponCaches() {
    var alcoveMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.75
    });

    var cratePositions = [
      { x: -28, z: -15 },
      { x: 28, z: -15 },
      { x: -30, z: 25 },
      { x: 30, z: 25 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var pos = cratePositions[i];

      var alcoveGeo = new THREE.BoxGeometry(4, 5, 3);
      var alcove = new THREE.Mesh(alcoveGeo, alcoveMaterial);
      alcove.position.set(pos.x, 3, pos.z);
      alcove.castShadow = true;
      alcove.receiveShadow = true;
      scene.add(alcove);
      caveObjects.push(alcove);

      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.1
      });

      for (var j = 0; j < 2; j++) {
        var crateGeo = new THREE.BoxGeometry(2, 1.5, 2);
        var crate = new THREE.Mesh(crateGeo, crateMaterial);
        crate.position.set(pos.x, 2 + (j * 1.8), pos.z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);
        caveObjects.push(crate);
      }
    }
  }

  function buildRiver() {
    var riverMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4d7a,
      emissive: 0x0066cc,
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.2
    });

    var riverGeo = new THREE.BoxGeometry(6, 0.3, 45);
    var river = new THREE.Mesh(riverGeo, riverMaterial);
    river.position.set(0, 0.15, 5);
    river.receiveShadow = true;
    scene.add(river);
    caveObjects.push(river);
  }

  function buildSteps() {
    var stepMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.7,
      metalness: 0.05
    });

    for (var i = 0; i < 5; i++) {
      var stepGeo = new THREE.BoxGeometry(8, 0.6, 1.5);
      var step = new THREE.Mesh(stepGeo, stepMaterial);
      step.position.set(0, 0.3 + (i * 0.8), -32 + (i * 1.5));
      step.castShadow = true;
      step.receiveShadow = true;
      scene.add(step);
      caveObjects.push(step);
    }
  }

  function buildSkulls() {
    var skullMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8E8E8,
      roughness: 0.6,
      metalness: 0.1
    });

    var skullPositions = [
      { x: -8, y: 10, z: -35 },
      { x: 8, y: 10, z: -35 }
    ];

    for (var i = 0; i < skullPositions.length; i++) {
      var pos = skullPositions[i];
      var skullGeo = new THREE.SphereGeometry(0.7, 8, 8);
      var skull = new THREE.Mesh(skullGeo, skullMaterial);
      skull.position.set(pos.x, pos.y, pos.z);
      skull.castShadow = true;
      skull.receiveShadow = true;
      scene.add(skull);
      caveObjects.push(skull);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildWalls();
    buildEntrance();
    buildAltar();
    buildStalactites();
    buildTorches();
    buildWeaponCaches();
    buildRiver();
    buildSteps();
    buildSkulls();

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function update(delta) {
    for (var i = 0; i < torches.length; i++) {
      var torch = torches[i];
      torch.position.y = torch.userData.baseY + Math.sin(Date.now() * 0.003 + i) * 0.3;
      torch.scale.set(
        1 + Math.sin(Date.now() * 0.004 + i * 0.5) * 0.1,
        1 + Math.sin(Date.now() * 0.004 + i * 0.5) * 0.1,
        1 + Math.sin(Date.now() * 0.004 + i * 0.5) * 0.1
      );
    }

    if (idolGlow) {
      idolGlow.rotation.y += delta * 0.3;
      idolGlow.position.y = 5 + Math.sin(Date.now() * 0.002) * 0.4;
    }
  }

  function reset() {
    for (var i = caveObjects.length - 1; i >= 0; i--) {
      scene.remove(caveObjects[i]);
    }
    caveObjects = [];
    torches = [];
    idolGlow = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
