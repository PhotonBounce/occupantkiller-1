window.AshRuins = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var ashObjects = [];
  var ashParticles = [];
  var fumaroleVents = [];
  var artifacts = [];
  var tents = [];

  var init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    scene.background = new THREE.Color(0x4a4a4a);
    scene.fog = new THREE.Fog(0x4a4a4a, 150, 300);

    // Ground - ash-covered terrain
    var groundGeometry = new THREE.BoxGeometry(80, 2, 80);
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    ashObjects.push(ground);

    // Create multiple ash coverage layers for depth
    for (var i = 0; i < 8; i++) {
      var ashLayerGeometry = new THREE.BoxGeometry(75 + i * 2, 0.3, 75 + i * 2);
      var ashLayerMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a + (i * 0x050505) });
      var ashLayer = new THREE.Mesh(ashLayerGeometry, ashLayerMaterial);
      ashLayer.position.y = -0.8 + (i * 0.15);
      scene.add(ashLayer);
      ashObjects.push(ashLayer);
    }

    // Buried building outlines - partially protruding walls
    createBuriedBuildings();

    // Excavated ruins sections - cleared ancient stone
    createExcavatedRuins();

    // Ancient columns - half-buried and tilted
    createAncientColumns();

    // Ash drifts - mounds in corners and against structures
    createAshDrifts();

    // Temple courtyard - exposed tiles
    createTempleCourtyard();

    // Burial mounds - large dome shapes
    createBurialMounds();

    // Archaeological dig grid
    createArchaeologicalDig();

    // Preserved artifacts - glowing spheres
    createArtifacts();

    // Petrified trees
    createPetrifiedTrees();

    // Fumarole vents with steam
    createFumaroleVents();

    // Military research camp - tents
    createMilitaryCamp();

    // Ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
  };

  var createBuriedBuildings = function() {
    // Northern section - large buried structure
    var wall1Geometry = new THREE.BoxGeometry(25, 12, 3);
    var buriedMaterial = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
    var wall1 = new THREE.Mesh(wall1Geometry, buriedMaterial);
    wall1.position.set(-15, 3, -25);
    wall1.castShadow = true;
    scene.add(wall1);
    ashObjects.push(wall1);

    // Eastern buried building
    var wall2Geometry = new THREE.BoxGeometry(3, 10, 20);
    var wall2 = new THREE.Mesh(wall2Geometry, buriedMaterial);
    wall2.position.set(28, 2, 0);
    wall2.castShadow = true;
    scene.add(wall2);
    ashObjects.push(wall2);

    // Southern structure
    var wall3Geometry = new THREE.BoxGeometry(20, 8, 3);
    var wall3 = new THREE.Mesh(wall3Geometry, buriedMaterial);
    wall3.position.set(5, 1.5, 30);
    wall3.castShadow = true;
    scene.add(wall3);
    ashObjects.push(wall3);

    // Western structure
    var wall4Geometry = new THREE.BoxGeometry(3, 9, 18);
    var wall4 = new THREE.Mesh(wall4Geometry, buriedMaterial);
    wall4.position.set(-32, 2, -5);
    wall4.castShadow = true;
    scene.add(wall4);
    ashObjects.push(wall4);

    // Scattered wall fragments
    for (var i = 0; i < 6; i++) {
      var fragmentGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 4,
        3 + Math.random() * 5,
        2 + Math.random() * 4
      );
      var fragment = new THREE.Mesh(fragmentGeometry, buriedMaterial);
      var angle = (i / 6) * Math.PI * 2;
      fragment.position.x = Math.cos(angle) * (20 + Math.random() * 10);
      fragment.position.y = 1 + Math.random() * 2;
      fragment.position.z = Math.sin(angle) * (20 + Math.random() * 10);
      fragment.rotation.x = Math.random() * 0.3;
      fragment.rotation.z = Math.random() * 0.3;
      fragment.castShadow = true;
      scene.add(fragment);
      ashObjects.push(fragment);
    }
  };

  var createExcavatedRuins = function() {
    // Central excavated courtyard area
    var courtyardGeometry = new THREE.BoxGeometry(25, 0.5, 25);
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
    var courtyard = new THREE.Mesh(courtyardGeometry, stoneMaterial);
    courtyard.position.set(-5, 0, 5);
    scene.add(courtyard);
    ashObjects.push(courtyard);

    // Excavated stone blocks in grid pattern
    for (var x = -10; x <= 10; x += 5) {
      for (var z = -5; z <= 15; z += 5) {
        if ((x + z) % 2 === 0) {
          var blockGeometry = new THREE.BoxGeometry(4, 0.8, 4);
          var block = new THREE.Mesh(blockGeometry, stoneMaterial);
          block.position.set(-5 + x, 0.3, 5 + z);
          scene.add(block);
          ashObjects.push(block);
        }
      }
    }

    // Exposed foundation walls
    var foundationGeometry = new THREE.BoxGeometry(20, 3, 3);
    var foundationMaterial = new THREE.MeshLambertMaterial({ color: 0x7a6b52 });
    var foundation1 = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation1.position.set(-5, 1, 5);
    scene.add(foundation1);
    ashObjects.push(foundation1);

    var foundation2Geometry = new THREE.BoxGeometry(3, 3, 20);
    var foundation2 = new THREE.Mesh(foundation2Geometry, foundationMaterial);
    foundation2.position.set(5, 1, 5);
    scene.add(foundation2);
    ashObjects.push(foundation2);
  };

  var createAncientColumns = function() {
    // Tilted columns half-buried in ash
    var columnPositions = [
      { x: -20, z: -15, tilt: 0.15 },
      { x: -10, z: -20, tilt: 0.2 },
      { x: 0, z: -18, tilt: 0.1 },
      { x: 15, z: -22, tilt: 0.25 },
      { x: -25, z: 10, tilt: 0.18 },
      { x: -18, z: 25, tilt: 0.22 },
      { x: 10, z: 20, tilt: 0.12 },
      { x: 25, z: 15, tilt: 0.2 },
      { x: 20, z: -10, tilt: 0.16 },
      { x: -5, z: 0, tilt: 0.08 }
    ];

    var columnMaterial = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });

    for (var i = 0; i < columnPositions.length; i++) {
      var pos = columnPositions[i];
      var columnGeometry = new THREE.CylinderGeometry(1.2, 1.2, 15, 16);
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos.x, 4, pos.z);
      column.rotation.z = pos.tilt;
      column.castShadow = true;
      scene.add(column);
      ashObjects.push(column);
    }
  };

  var createAshDrifts = function() {
    // Large ash drifts in corners and against walls
    var driftPositions = [
      { x: -35, z: -35, sx: 12, sz: 12, h: 8 },
      { x: 35, z: -35, sx: 12, sz: 12, h: 8 },
      { x: -35, z: 35, sx: 12, sz: 12, h: 8 },
      { x: 35, z: 35, sx: 12, sz: 12, h: 8 },
      { x: -35, z: 0, sx: 8, sz: 15, h: 6 },
      { x: 35, z: 0, sx: 8, sz: 15, h: 6 },
      { x: 0, z: -35, sx: 15, sz: 8, h: 6 },
      { x: 0, z: 35, sx: 15, sz: 8, h: 6 }
    ];

    var driftMaterial = new THREE.MeshLambertMaterial({ color: 0x7d7d7d });

    for (var i = 0; i < driftPositions.length; i++) {
      var drift = driftPositions[i];
      var driftGeometry = new THREE.BoxGeometry(drift.sx, drift.h, drift.sz);
      var driftMesh = new THREE.Mesh(driftGeometry, driftMaterial);
      driftMesh.position.set(drift.x, drift.h / 2 - 1, drift.z);
      driftMesh.castShadow = true;
      scene.add(driftMesh);
      ashObjects.push(driftMesh);
    }
  };

  var createTempleCourtyard = function() {
    // Central temple courtyard with exposed tiles
    var courtyardTileGeometry = new THREE.BoxGeometry(20, 0.3, 20);
    var courtlyardMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7d6b });
    var courtlyardTile = new THREE.Mesh(courtyardTileGeometry, courtlyardMaterial);
    courtlyardTile.position.set(0, 0, 0);
    scene.add(courtlyardTile);
    ashObjects.push(courtlyardTile);

    // Individual tile blocks
    for (var x = -9; x <= 9; x += 3) {
      for (var z = -9; z <= 9; z += 3) {
        if ((Math.abs(x) + Math.abs(z)) % 6 !== 0) {
          var tileGeometry = new THREE.BoxGeometry(2.8, 0.4, 2.8);
          var tileMaterial = new THREE.MeshLambertMaterial({ color: 0x8a7c6a });
          var tile = new THREE.Mesh(tileGeometry, tileMaterial);
          tile.position.set(x, 0.2, z);
          scene.add(tile);
          ashObjects.push(tile);
        }
      }
    }

    // Central temple platform
    var platformGeometry = new THREE.BoxGeometry(8, 2, 8);
    var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x9a8b79 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 1, 0);
    platform.castShadow = true;
    scene.add(platform);
    ashObjects.push(platform);
  };

  var createBurialMounds = function() {
    // Large dome-shaped burial mounds
    var moundPositions = [
      { x: -28, z: -28, r: 8, h: 10 },
      { x: 28, z: 28, r: 8, h: 10 },
      { x: -28, z: 28, r: 6, h: 8 },
      { x: 28, z: -28, r: 6, h: 8 },
      { x: 0, z: -40, r: 5, h: 6 },
      { x: -40, z: 0, r: 5, h: 6 },
      { x: 0, z: 40, r: 5, h: 6 },
      { x: 40, z: 0, r: 5, h: 6 }
    ];

    var moundMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });

    for (var i = 0; i < moundPositions.length; i++) {
      var mound = moundPositions[i];
      var moundGeometry = new THREE.BoxGeometry(mound.r * 2, mound.h, mound.r * 2);
      var moundMesh = new THREE.Mesh(moundGeometry, moundMaterial);
      moundMesh.position.set(mound.x, mound.h / 2 - 1, mound.z);
      moundMesh.scale.y = 0.7;
      moundMesh.castShadow = true;
      scene.add(moundMesh);
      ashObjects.push(moundMesh);
    }
  };

  var createArchaeologicalDig = function() {
    // Excavation grid with tools
    var gridBaseGeometry = new THREE.BoxGeometry(18, 0.3, 18);
    var gridMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7b69 });
    var gridBase = new THREE.Mesh(gridBaseGeometry, gridMaterial);
    gridBase.position.set(15, 0.1, -15);
    scene.add(gridBase);
    ashObjects.push(gridBase);

    // Grid lines (using BoxGeometry)
    for (var i = 0; i <= 6; i++) {
      // Vertical lines
      var vLineGeometry = new THREE.BoxGeometry(0.3, 0.5, 18);
      var vLine = new THREE.Mesh(vLineGeometry, new THREE.MeshLambertMaterial({ color: 0x5a4a3a }));
      vLine.position.set(15 - 9 + (i * 3), 0.25, -15);
      scene.add(vLine);
      ashObjects.push(vLine);

      // Horizontal lines
      var hLineGeometry = new THREE.BoxGeometry(18, 0.5, 0.3);
      var hLine = new THREE.Mesh(hLineGeometry, new THREE.MeshLambertMaterial({ color: 0x5a4a3a }));
      hLine.position.set(15, 0.25, -15 - 9 + (i * 3));
      scene.add(hLine);
      ashObjects.push(hLine);
    }

    // Excavation tools - pickaxes and shovels
    var toolPositions = [
      { x: 8, z: -20, type: 'pickaxe' },
      { x: 22, z: -12, type: 'shovel' },
      { x: 18, z: -22, type: 'pickaxe' },
      { x: 10, z: -10, type: 'shovel' }
    ];

    for (var i = 0; i < toolPositions.length; i++) {
      var tool = toolPositions[i];
      if (tool.type === 'pickaxe') {
        // Pickaxe handle
        var handleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
        var handleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(tool.x, 2, tool.z);
        handle.rotation.z = 0.3;
        handle.castShadow = true;
        scene.add(handle);
        ashObjects.push(handle);

        // Pickaxe blade
        var bladeGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.2);
        var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
        var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(tool.x + 0.3, 4.2, tool.z);
        blade.castShadow = true;
        scene.add(blade);
        ashObjects.push(blade);
      } else {
        // Shovel handle
        var sHandleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 8);
        var sHandleMaterial = new THREE.MeshLambertMaterial({ color: 0xa0825a });
        var sHandle = new THREE.Mesh(sHandleGeometry, sHandleMaterial);
        sHandle.position.set(tool.x, 1.8, tool.z);
        sHandle.rotation.z = 0.25;
        sHandle.castShadow = true;
        scene.add(sHandle);
        ashObjects.push(sHandle);

        // Shovel blade
        var sBlade = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.1, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        sBlade.position.set(tool.x, 3.8, tool.z);
        sBlade.castShadow = true;
        scene.add(sBlade);
        ashObjects.push(sBlade);
      }
    }
  };

  var createArtifacts = function() {
    // Preserved artifacts - glowing spheres in excavated areas
    var artifactPositions = [
      { x: -5, z: 5, color: 0x00ff88 },
      { x: 5, z: 10, color: 0x00ccff },
      { x: -8, z: 8, color: 0xff8800 },
      { x: 0, z: 0, color: 0xffff00 },
      { x: -10, z: 0, color: 0xff00ff },
      { x: 8, z: 12, color: 0x00ffff },
      { x: -12, z: -5, color: 0xff6600 },
      { x: 10, z: -8, color: 0x00ff00 }
    ];

    for (var i = 0; i < artifactPositions.length; i++) {
      var artif = artifactPositions[i];
      var artifactGeometry = new THREE.SphereGeometry(0.6, 16, 16);
      var artifactMaterial = new THREE.MeshStandardMaterial({
        color: artif.color,
        emissive: artif.color,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2
      });
      var artifact = new THREE.Mesh(artifactGeometry, artifactMaterial);
      artifact.position.set(artif.x, 0.8, artif.z);
      artifact.castShadow = true;
      scene.add(artifact);
      artifacts.push({
        mesh: artifact,
        initialY: artifact.position.y,
        color: artif.color
      });
      ashObjects.push(artifact);
    }
  };

  var createPetrifiedTrees = function() {
    // Petrified tree trunks frozen in ash
    var treePositions = [
      { x: -32, z: 15, h: 14 },
      { x: 32, z: -20, h: 12 },
      { x: -15, z: 35, h: 13 },
      { x: 20, z: 30, h: 11 },
      { x: -38, z: -10, h: 12 },
      { x: 25, z: -35, h: 14 }
    ];

    var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });

    for (var i = 0; i < treePositions.length; i++) {
      var tree = treePositions[i];
      var trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, tree.h, 8);
      var trunk = new THREE.Mesh(trunkGeometry, treeMaterial);
      trunk.position.set(tree.x, tree.h / 2 - 0.5, tree.z);
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      trunk.castShadow = true;
      scene.add(trunk);
      ashObjects.push(trunk);

      // Tree branches (smaller cylinders)
      for (var b = 0; b < 3; b++) {
        var branchGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        var branch = new THREE.Mesh(branchGeometry, treeMaterial);
        branch.position.set(
          tree.x + Math.cos(b * Math.PI * 2 / 3) * 1.5,
          tree.h - 2 - (b * 2),
          tree.z + Math.sin(b * Math.PI * 2 / 3) * 1.5
        );
        branch.rotation.z = Math.PI / 4;
        branch.castShadow = true;
        scene.add(branch);
        ashObjects.push(branch);
      }
    }
  };

  var createFumaroleVents = function() {
    // Fumarole vents in ground with steam puffs
    var ventPositions = [
      { x: 15, z: 15 },
      { x: -20, z: -25 },
      { x: 30, z: 10 },
      { x: -25, z: 20 }
    ];

    for (var i = 0; i < ventPositions.length; i++) {
      var vent = ventPositions[i];

      // Vent opening
      var ventGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.5, 12);
      var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
      var ventMesh = new THREE.Mesh(ventGeometry, ventMaterial);
      ventMesh.position.set(vent.x, 0, vent.z);
      ventMesh.castShadow = true;
      scene.add(ventMesh);
      ashObjects.push(ventMesh);

      // Steam puffs (spheres)
      for (var s = 0; s < 5; s++) {
        var puffGeometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.4, 8, 8);
        var puffMaterial = new THREE.MeshLambertMaterial({
          color: 0xcccccc,
          transparent: true,
          opacity: 0.4
        });
        var puff = new THREE.Mesh(puffGeometry, puffMaterial);
        puff.position.set(
          vent.x + (Math.random() - 0.5) * 2,
          2 + Math.random() * 3,
          vent.z + (Math.random() - 0.5) * 2
        );
        scene.add(puff);
        fumaroleVents.push({
          mesh: puff,
          startX: puff.position.x,
          startY: puff.position.y,
          startZ: puff.position.z,
          velocity: 0.5 + Math.random() * 1,
          life: 0,
          maxLife: 4 + Math.random() * 2
        });
        ashObjects.push(puff);
      }
    }
  };

  var createMilitaryCamp = function() {
    // Military research camp with tents
    var tentPositions = [
      { x: -15, z: -35 },
      { x: -5, z: -35 },
      { x: 5, z: -35 },
      { x: 15, z: -35 },
      { x: 35, z: 20 },
      { x: 38, z: 15 }
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var tentPos = tentPositions[i];

      // Tent base
      var tentBaseGeometry = new THREE.BoxGeometry(5, 0.2, 5);
      var tentBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
      var tentBase = new THREE.Mesh(tentBaseGeometry, tentBaseMaterial);
      tentBase.position.set(tentPos.x, 0, tentPos.z);
      scene.add(tentBase);
      ashObjects.push(tentBase);

      // Tent frame (cone-like from boxes)
      var tentFrameGeometry = new THREE.ConeGeometry(2.5, 3.5, 8);
      var tentFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
      var tentFrame = new THREE.Mesh(tentFrameGeometry, tentFrameMaterial);
      tentFrame.position.set(tentPos.x, 1.8, tentPos.z);
      tentFrame.castShadow = true;
      scene.add(tentFrame);
      tents.push(tentFrame);
      ashObjects.push(tentFrame);

      // Tent support poles
      for (var p = 0; p < 2; p++) {
        var poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 6);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(
          tentPos.x + (p === 0 ? -1.2 : 1.2),
          1.3,
          tentPos.z
        );
        pole.castShadow = true;
        scene.add(pole);
        ashObjects.push(pole);
      }

      // Supply boxes near tents
      for (var b = 0; b < 2; b++) {
        var boxGeometry = new THREE.BoxGeometry(1.2, 1, 0.8);
        var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var supplBox = new THREE.Mesh(boxGeometry, boxMaterial);
        supplBox.position.set(
          tentPos.x + 3 + (b * 1.5),
          0.5,
          tentPos.z + 2
        );
        supplBox.castShadow = true;
        scene.add(supplBox);
        ashObjects.push(supplBox);
      }
    }
  };

  var update = function(delta) {
    // Animate ash particles drifting down
    for (var i = 0; i < ashParticles.length; i++) {
      var particle = ashParticles[i];
      particle.mesh.position.y -= particle.velocity * delta;
      particle.mesh.position.x += Math.sin(particle.mesh.position.y * 0.5) * delta * 0.3;
      particle.mesh.position.z += Math.cos(particle.mesh.position.y * 0.3) * delta * 0.3;

      if (particle.mesh.position.y < -5) {
        particle.mesh.position.y = 35;
        particle.mesh.position.x = (Math.random() - 0.5) * 80;
        particle.mesh.position.z = (Math.random() - 0.5) * 80;
      }
    }

    // Animate fumarole steam puffs
    for (var i = 0; i < fumaroleVents.length; i++) {
      var puff = fumaroleVents[i];
      puff.life += delta;

      puff.mesh.position.y += puff.velocity * delta;
      puff.mesh.position.x += Math.sin(puff.life * 2) * delta * 0.5;
      puff.mesh.position.z += Math.cos(puff.life * 1.5) * delta * 0.5;

      var lifeRatio = puff.life / puff.maxLife;
      puff.mesh.material.opacity = 0.4 * (1 - lifeRatio);
      puff.mesh.scale.set(1 + lifeRatio * 0.5, 1 + lifeRatio * 0.5, 1 + lifeRatio * 0.5);

      if (puff.life >= puff.maxLife) {
        puff.life = 0;
        puff.mesh.position.y = puff.startY;
        puff.mesh.position.x = puff.startX + (Math.random() - 0.5) * 2;
        puff.mesh.position.z = puff.startZ + (Math.random() - 0.5) * 2;
        puff.mesh.scale.set(1, 1, 1);
        puff.mesh.material.opacity = 0.4;
      }
    }

    // Animate artifact glow pulsing
    for (var i = 0; i < artifacts.length; i++) {
      var artifact = artifacts[i];
      var pulse = Math.sin(Date.now() * 0.001 + i) * 0.3 + 0.7;
      artifact.mesh.position.y = artifact.initialY + Math.sin(Date.now() * 0.0008 + i) * 0.3;
      artifact.mesh.material.emissiveIntensity = pulse;
      artifact.mesh.scale.set(1 + pulse * 0.1, 1 + pulse * 0.1, 1 + pulse * 0.1);
    }

    // Slight sway for tent frames
    for (var i = 0; i < tents.length; i++) {
      var tent = tents[i];
      tent.rotation.x = Math.sin(Date.now() * 0.0005 + i) * 0.02;
      tent.rotation.z = Math.cos(Date.now() * 0.0004 + i) * 0.02;
    }
  };

  var reset = function() {
    for (var i = 0; i < ashObjects.length; i++) {
      scene.remove(ashObjects[i]);
    }
    ashObjects = [];
    ashParticles = [];
    fumaroleVents = [];
    artifacts = [];
    tents = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
