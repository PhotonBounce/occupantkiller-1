window.AmberRuins = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var torches = [];
  var dustParticles = [];
  var banners = [];
  var structures = [];
  var gameTime = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    gameTime = 0;
    torches = [];
    dustParticles = [];
    banners = [];
    structures = [];

    buildAmbientLighting();
    buildAmphitheater();
    buildArchway();
    buildColumns();
    buildCatacombs();
    buildTents();
    buildSandbags();
    buildWalls();
    buildAqueduct();
    buildTrenches();
    buildTorches();
    buildDustParticles();
    buildBanners();
  }

  function buildAmbientLighting() {
    var ambientLight = new THREE.AmbientLight(0xffb366, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffd699, 0.8);
    directionalLight.position.set(40, 60, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var hemisphereLight = new THREE.HemisphereLight(0xffaa44, 0x664422, 0.4);
    scene.add(hemisphereLight);
  }

  function buildAmphitheater() {
    var tierMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0876b,
      roughness: 0.8,
      metalness: 0.1
    });

    var tierHeight = 2;
    var tierDepth = 6;

    for (var i = 0; i < 5; i++) {
      var tierGeometry = new THREE.BoxGeometry(40, tierHeight, tierDepth);
      var tierMesh = new THREE.Mesh(tierGeometry, tierMaterial);
      tierMesh.position.set(0, i * tierHeight, -30 + (i * tierDepth));
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      scene.add(tierMesh);
      structures.push(tierMesh);
    }

    var arenaFloorGeometry = new THREE.BoxGeometry(50, 0.5, 40);
    var arenaFloorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.0
    });
    var arenaFloor = new THREE.Mesh(arenaFloorGeometry, arenaFloorMaterial);
    arenaFloor.position.set(0, 0, 0);
    arenaFloor.castShadow = true;
    arenaFloor.receiveShadow = true;
    scene.add(arenaFloor);
    structures.push(arenaFloor);
  }

  function buildArchway() {
    var archMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8956b,
      roughness: 0.75,
      metalness: 0.05
    });

    var leftPillar = new THREE.BoxGeometry(3, 12, 3);
    var leftPillarMesh = new THREE.Mesh(leftPillar, archMaterial);
    leftPillarMesh.position.set(-10, 6, 30);
    leftPillarMesh.castShadow = true;
    leftPillarMesh.receiveShadow = true;
    scene.add(leftPillarMesh);
    structures.push(leftPillarMesh);

    var rightPillar = new THREE.BoxGeometry(3, 12, 3);
    var rightPillarMesh = new THREE.Mesh(rightPillar, archMaterial);
    rightPillarMesh.position.set(10, 6, 30);
    rightPillarMesh.castShadow = true;
    rightPillarMesh.receiveShadow = true;
    scene.add(rightPillarMesh);
    structures.push(rightPillarMesh);

    var archSpan = new THREE.BoxGeometry(20, 2, 3);
    var archSpanMesh = new THREE.Mesh(archSpan, archMaterial);
    archSpanMesh.position.set(0, 11, 30);
    archSpanMesh.castShadow = true;
    archSpanMesh.receiveShadow = true;
    scene.add(archSpanMesh);
    structures.push(archSpanMesh);

    var collapsedArchGeometry = new THREE.BoxGeometry(4, 3, 25);
    var collapsedArchMaterial = new THREE.MeshStandardMaterial({
      color: 0x9a7a5f,
      roughness: 0.85,
      metalness: 0.02
    });
    var collapsedArch = new THREE.Mesh(collapsedArchGeometry, collapsedArchMaterial);
    collapsedArch.position.set(12, 4, 20);
    collapsedArch.rotation.z = 0.3;
    collapsedArch.castShadow = true;
    collapsedArch.receiveShadow = true;
    scene.add(collapsedArch);
    structures.push(collapsedArch);
  }

  function buildColumns() {
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9b89f,
      roughness: 0.7,
      metalness: 0.08
    });

    var columnPositions = [
      [-25, 0, -15],
      [-15, 0, -10],
      [-5, 0, -8],
      [5, 0, -10],
      [15, 0, -12],
      [25, 0, -15],
      [-20, 0, 5],
      [-8, 0, 8],
      [8, 0, 8],
      [20, 0, 5]
    ];

    for (var i = 0; i < columnPositions.length; i++) {
      var columnGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
      var columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
      columnMesh.position.set(columnPositions[i][0], columnPositions[i][1] + 4, columnPositions[i][2]);
      columnMesh.castShadow = true;
      columnMesh.receiveShadow = true;
      scene.add(columnMesh);
      structures.push(columnMesh);

      var drumGeometry = new THREE.CylinderGeometry(1.4, 1.2, 1.5, 8);
      var drumMesh = new THREE.Mesh(drumGeometry, columnMaterial);
      drumMesh.position.set(columnPositions[i][0], columnPositions[i][1] + 1, columnPositions[i][2]);
      drumMesh.castShadow = true;
      drumMesh.receiveShadow = true;
      scene.add(drumMesh);
      structures.push(drumMesh);
    }

    var fallenColumnGeometry = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
    var fallenColumnMaterial = new THREE.MeshStandardMaterial({
      color: 0xb59a7f,
      roughness: 0.8,
      metalness: 0.05
    });
    var fallenColumn = new THREE.Mesh(fallenColumnGeometry, fallenColumnMaterial);
    fallenColumn.position.set(0, 1, -20);
    fallenColumn.rotation.z = Math.PI / 2;
    fallenColumn.castShadow = true;
    fallenColumn.receiveShadow = true;
    scene.add(fallenColumn);
    structures.push(fallenColumn);
  }

  function buildCatacombs() {
    var catacombWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b5a48,
      roughness: 0.9,
      metalness: 0.0
    });

    var catacombEntranceGeometry = new THREE.BoxGeometry(8, 6, 1);
    var catacombEntrance = new THREE.Mesh(catacombEntranceGeometry, catacombWallMaterial);
    catacombEntrance.position.set(-35, 3, 15);
    catacombEntrance.castShadow = true;
    catacombEntrance.receiveShadow = true;
    scene.add(catacombEntrance);
    structures.push(catacombEntrance);

    var catacombWall1Geometry = new THREE.BoxGeometry(1, 6, 12);
    var catacombWall1 = new THREE.Mesh(catacombWall1Geometry, catacombWallMaterial);
    catacombWall1.position.set(-39, 3, 10);
    catacombWall1.castShadow = true;
    catacombWall1.receiveShadow = true;
    scene.add(catacombWall1);
    structures.push(catacombWall1);

    var catacombWall2Geometry = new THREE.BoxGeometry(1, 6, 12);
    var catacombWall2 = new THREE.Mesh(catacombWall2Geometry, catacombWallMaterial);
    catacombWall2.position.set(-31, 3, 10);
    catacombWall2.castShadow = true;
    catacombWall2.receiveShadow = true;
    scene.add(catacombWall2);
    structures.push(catacombWall2);

    var catacombBackWallGeometry = new THREE.BoxGeometry(8, 6, 1);
    var catacombBackWall = new THREE.Mesh(catacombBackWallGeometry, catacombWallMaterial);
    catacombBackWall.position.set(-35, 3, 4);
    catacombBackWall.castShadow = true;
    catacombBackWall.receiveShadow = true;
    scene.add(catacombBackWall);
    structures.push(catacombBackWall);
  }

  function buildTents() {
    var tentMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.6,
      metalness: 0.1
    });

    var tentPositions = [
      [30, 0, -20],
      [35, 0, -10],
      [28, 0, 0]
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var tentGeometry = new THREE.ConeGeometry(4, 6, 4);
      var tentMesh = new THREE.Mesh(tentGeometry, tentMaterial);
      tentMesh.position.set(tentPositions[i][0], tentPositions[i][1] + 3, tentPositions[i][2]);
      tentMesh.castShadow = true;
      tentMesh.receiveShadow = true;
      scene.add(tentMesh);
      structures.push(tentMesh);
    }
  }

  function buildSandbags() {
    var sandbagMaterial = new THREE.MeshStandardMaterial({
      color: 0x9d8b6f,
      roughness: 0.85,
      metalness: 0.02
    });

    var sandbagPositions = [
      [15, 0, 10],
      [14, 0, 11],
      [13, 0, 10],
      [-15, 0, 15],
      [-14, 0, 16],
      [-13, 0, 15],
      [0, 3, 20],
      [1, 3, 20],
      [-1, 3, 20]
    ];

    for (var i = 0; i < sandbagPositions.length; i++) {
      var sandbagGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.5);
      var sandbagMesh = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbagMesh.position.set(sandbagPositions[i][0], sandbagPositions[i][1] + 0.4, sandbagPositions[i][2]);
      sandbagMesh.castShadow = true;
      sandbagMesh.receiveShadow = true;
      scene.add(sandbagMesh);
      structures.push(sandbagMesh);
    }
  }

  function buildWalls() {
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x9a8873,
      roughness: 0.8,
      metalness: 0.03
    });

    var wall1Geometry = new THREE.BoxGeometry(1, 5, 30);
    var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
    wall1.position.set(-38, 2.5, 0);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    scene.add(wall1);
    structures.push(wall1);

    var wall2Geometry = new THREE.BoxGeometry(1, 5, 30);
    var wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
    wall2.position.set(38, 2.5, 0);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    scene.add(wall2);
    structures.push(wall2);

    var wallFragmentGeometry = new THREE.BoxGeometry(8, 3, 1);
    var wallFragment = new THREE.Mesh(wallFragmentGeometry, wallMaterial);
    wallFragment.position.set(-20, 1.5, -35);
    wallFragment.rotation.y = 0.4;
    wallFragment.castShadow = true;
    wallFragment.receiveShadow = true;
    scene.add(wallFragment);
    structures.push(wallFragment);
  }

  function buildAqueduct() {
    var aqueductMaterial = new THREE.MeshStandardMaterial({
      color: 0xaa9077,
      roughness: 0.75,
      metalness: 0.06
    });

    var aqueductBase1Geometry = new THREE.BoxGeometry(2, 1, 20);
    var aqueductBase1 = new THREE.Mesh(aqueductBase1Geometry, aqueductMaterial);
    aqueductBase1.position.set(-3, 8, 5);
    aqueductBase1.castShadow = true;
    aqueductBase1.receiveShadow = true;
    scene.add(aqueductBase1);
    structures.push(aqueductBase1);

    var aqueductBase2Geometry = new THREE.BoxGeometry(2, 1, 20);
    var aqueductBase2 = new THREE.Mesh(aqueductBase2Geometry, aqueductMaterial);
    aqueductBase2.position.set(3, 8, 5);
    aqueductBase2.castShadow = true;
    aqueductBase2.receiveShadow = true;
    scene.add(aqueductBase2);
    structures.push(aqueductBase2);

    var aqueductArch1Geometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
    var aqueductArch1 = new THREE.Mesh(aqueductArch1Geometry, aqueductMaterial);
    aqueductArch1.position.set(-3, 9, -8);
    aqueductArch1.rotation.z = Math.PI / 2;
    aqueductArch1.castShadow = true;
    aqueductArch1.receiveShadow = true;
    scene.add(aqueductArch1);
    structures.push(aqueductArch1);

    var aqueductArch2Geometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
    var aqueductArch2 = new THREE.Mesh(aqueductArch2Geometry, aqueductMaterial);
    aqueductArch2.position.set(3, 9, -8);
    aqueductArch2.rotation.z = Math.PI / 2;
    aqueductArch2.castShadow = true;
    aqueductArch2.receiveShadow = true;
    scene.add(aqueductArch2);
    structures.push(aqueductArch2);
  }

  function buildTrenches() {
    var trenchLineMaterial = new THREE.LineBasicMaterial({
      color: 0x6b5a48,
      linewidth: 2
    });

    var trench1Points = [
      new THREE.Vector3(-20, 0.1, -25),
      new THREE.Vector3(-20, 0.1, 15)
    ];
    var trench1Geometry = new THREE.BufferGeometry().setFromPoints(trench1Points);
    var trench1 = new THREE.LineSegments(trench1Geometry, trenchLineMaterial);
    scene.add(trench1);

    var trench2Points = [
      new THREE.Vector3(20, 0.1, -25),
      new THREE.Vector3(20, 0.1, 15)
    ];
    var trench2Geometry = new THREE.BufferGeometry().setFromPoints(trench2Points);
    var trench2 = new THREE.LineSegments(trench2Geometry, trenchLineMaterial);
    scene.add(trench2);
  }

  function buildTorches() {
    var torchPositions = [
      [-30, 2, 15],
      [-25, 2, 20],
      [-20, 2, 10],
      [0, 5, -25],
      [25, 2, 15],
      [30, 2, 10],
      [-35, 4, 8],
      [35, 4, 8]
    ];

    for (var i = 0; i < torchPositions.length; i++) {
      var torchLight = new THREE.PointLight(0xffaa44, 1.5, 25);
      torchLight.position.set(torchPositions[i][0], torchPositions[i][1], torchPositions[i][2]);
      torchLight.castShadow = true;
      scene.add(torchLight);
      torches.push({
        light: torchLight,
        baseIntensity: 1.5,
        flickerPhase: Math.random() * Math.PI * 2
      });

      var torchStickGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
      var torchStickMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.9,
        metalness: 0.0
      });
      var torchStick = new THREE.Mesh(torchStickGeometry, torchStickMaterial);
      torchStick.position.set(torchPositions[i][0], torchPositions[i][1] - 1.5, torchPositions[i][2]);
      torchStick.castShadow = true;
      torchStick.receiveShadow = true;
      scene.add(torchStick);
    }
  }

  function buildDustParticles() {
    var dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xddaa66,
      transparent: true,
      opacity: 0.3,
      emissive: 0xffaa44,
      emissiveIntensity: 0.4
    });

    for (var i = 0; i < 30; i++) {
      var dustGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 4, 4);
      var dustParticle = new THREE.Mesh(dustGeometry, dustMaterial);
      dustParticle.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 15,
        (Math.random() - 0.5) * 80
      );
      scene.add(dustParticle);
      dustParticles.push({
        mesh: dustParticle,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.5,
        baseY: dustParticle.position.y,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function buildBanners() {
    var bannerPositions = [
      [-10, 8, 30],
      [10, 8, 30],
      [30, 6, -20]
    ];

    for (var i = 0; i < bannerPositions.length; i++) {
      var bannerMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc7722,
        emissive: 0xffaa44,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.0
      });

      var bannerGeometry = new THREE.BoxGeometry(4, 3, 0.2);
      var bannerMesh = new THREE.Mesh(bannerGeometry, bannerMaterial);
      bannerMesh.position.set(bannerPositions[i][0], bannerPositions[i][1], bannerPositions[i][2]);
      bannerMesh.castShadow = true;
      bannerMesh.receiveShadow = true;
      scene.add(bannerMesh);
      banners.push({
        mesh: bannerMesh,
        baseY: bannerMesh.position.y,
        baseRotation: bannerMesh.rotation.z,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function updateTorchFlicker(delta) {
    for (var i = 0; i < torches.length; i++) {
      var torch = torches[i];
      torch.flickerPhase += delta * 4;
      var flicker = 0.8 + 0.2 * Math.sin(torch.flickerPhase) + 0.15 * Math.sin(torch.flickerPhase * 1.3);
      torch.light.intensity = torch.baseIntensity * flicker;
    }
  }

  function updateDustParticles(delta) {
    for (var i = 0; i < dustParticles.length; i++) {
      var dust = dustParticles[i];
      dust.phase += delta * 0.8;

      dust.mesh.position.x += dust.vx * delta;
      dust.mesh.position.z += dust.vz * delta;
      dust.mesh.position.y = dust.baseY + Math.sin(dust.phase) * 1.5;

      if (dust.mesh.position.x > 45) {
        dust.mesh.position.x = -45;
      }
      if (dust.mesh.position.x < -45) {
        dust.mesh.position.x = 45;
      }
      if (dust.mesh.position.z > 45) {
        dust.mesh.position.z = -45;
      }
      if (dust.mesh.position.z < -45) {
        dust.mesh.position.z = 45;
      }
    }
  }

  function updateBanners(delta) {
    for (var i = 0; i < banners.length; i++) {
      var banner = banners[i];
      banner.phase += delta * 1.5;
      banner.mesh.position.y = banner.baseY + Math.sin(banner.phase * 0.8) * 0.4;
      banner.mesh.rotation.z = banner.baseRotation + Math.sin(banner.phase) * 0.15;
    }
  }

  function update(delta) {
    gameTime += delta;
    updateTorchFlicker(delta);
    updateDustParticles(delta);
    updateBanners(delta);
  }

  function reset() {
    if (scene) {
      for (var i = structures.length - 1; i >= 0; i--) {
        scene.remove(structures[i]);
      }
      for (var j = torches.length - 1; j >= 0; j--) {
        scene.remove(torches[j].light);
      }
      for (var k = dustParticles.length - 1; k >= 0; k--) {
        scene.remove(dustParticles[k].mesh);
      }
      for (var m = banners.length - 1; m >= 0; m--) {
        scene.remove(banners[m].mesh);
      }
    }
    structures = [];
    torches = [];
    dustParticles = [];
    banners = [];
    gameTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
