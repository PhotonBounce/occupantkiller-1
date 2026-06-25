window.LavaCave = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var animatedObjects = [];
  var time = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    animatedObjects = [];
    time = 0;

    createCaveWalls();
    createLavaRiver();
    createLavaWaterfalls();
    createObsidianSpires();
    createCrystalClusters();
    createStalactites();
    createStalagmites();
    createEnemyStronghold();
    createRopeBridges();
    createGlowingMushrooms();
    createSulfurVents();
    createLavaBubbles();
  };

  var createCaveWalls = function() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });

    var positions = [
      { x: -50, y: 0, z: -50, w: 80, h: 40, d: 80 },
      { x: 50, y: 0, z: -50, w: 80, h: 40, d: 80 },
      { x: -50, y: 0, z: 50, w: 80, h: 40, d: 80 },
      { x: 50, y: 0, z: 50, w: 80, h: 40, d: 80 },
      { x: 0, y: 35, z: 0, w: 180, h: 20, d: 180 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var mesh = new THREE.Mesh(geometry, wallMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }

    var irregularWalls = [];
    for (var i = 0; i < 15; i++) {
      var w = Math.random() * 30 + 10;
      var h = Math.random() * 25 + 10;
      var d = Math.random() * 30 + 10;
      var x = (Math.random() - 0.5) * 150;
      var y = Math.random() * 20;
      var z = (Math.random() - 0.5) * 150;
      irregularWalls.push({ x: x, y: y, z: z, w: w, h: h, d: d });
    }

    for (var i = 0; i < irregularWalls.length; i++) {
      var iw = irregularWalls[i];
      var geometry = new THREE.BoxGeometry(iw.w, iw.h, iw.d);
      var darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      var mesh = new THREE.Mesh(geometry, darkMaterial);
      mesh.position.set(iw.x, iw.y, iw.z);
      mesh.rotation.set((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  };

  var createLavaRiver = function() {
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      roughness: 0.4,
      metalness: 0.2
    });

    var riverSegments = [
      { x: -30, y: 0.5, z: -40, w: 15, h: 1, d: 60 },
      { x: -10, y: 0.5, z: -20, w: 15, h: 1, d: 40 },
      { x: 10, y: 0.5, z: 0, w: 15, h: 1, d: 50 },
      { x: 30, y: 0.5, z: 30, w: 15, h: 1, d: 40 }
    ];

    for (var i = 0; i < riverSegments.length; i++) {
      var seg = riverSegments[i];
      var geometry = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
      var mesh = new THREE.Mesh(geometry, lavaMaterial);
      mesh.position.set(seg.x, seg.y, seg.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
      animatedObjects.push({ type: 'lava', mesh: mesh, baseEmissive: 0xff6600 });
    }
  };

  var createLavaWaterfalls = function() {
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4500,
      emissive: 0xff5500,
      roughness: 0.3
    });

    var waterfallPositions = [
      { x: -40, y: 25, z: 40, w: 8, h: 30, d: 8 },
      { x: 40, y: 25, z: -40, w: 8, h: 30, d: 8 }
    ];

    for (var i = 0; i < waterfallPositions.length; i++) {
      var pos = waterfallPositions[i];
      var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      var mesh = new THREE.Mesh(geometry, lavaMaterial);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
      animatedObjects.push({ type: 'waterfall', mesh: mesh, baseEmissive: 0xff5500 });
    }
  };

  var createObsidianSpires = function() {
    var obsidianMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.3, metalness: 0.4 });

    var spirePositions = [
      { x: -25, z: 25, r: 3, h: 35 },
      { x: 0, z: 35, r: 2.5, h: 40 },
      { x: 25, z: 20, r: 3.5, h: 32 },
      { x: -35, z: -20, r: 2, h: 38 },
      { x: 35, z: -15, r: 3, h: 36 }
    ];

    for (var i = 0; i < spirePositions.length; i++) {
      var pos = spirePositions[i];
      var geometry = new THREE.CylinderGeometry(pos.r, pos.r * 1.2, pos.h, 8);
      var mesh = new THREE.Mesh(geometry, obsidianMaterial);
      mesh.position.set(pos.x, pos.h / 2, pos.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  };

  var createCrystalClusters = function() {
    var crystalMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x6600ff, emissive: 0x4400cc, roughness: 0.2, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0044cc, roughness: 0.2, metalness: 0.3 })
    ];

    var clusterPositions = [
      { x: -30, z: -30 },
      { x: 20, z: -25 },
      { x: -10, z: 35 },
      { x: 30, z: 10 }
    ];

    for (var i = 0; i < clusterPositions.length; i++) {
      var clust = clusterPositions[i];
      for (var j = 0; j < 4; j++) {
        var ox = (Math.random() - 0.5) * 8;
        var oz = (Math.random() - 0.5) * 8;
        var h = Math.random() * 5 + 5;
        var matIdx = j % crystalMaterials.length;
        var geometry = new THREE.ConeGeometry(1.2, h, 6);
        var mesh = new THREE.Mesh(geometry, crystalMaterials[matIdx]);
        mesh.position.set(clust.x + ox, h / 2, clust.z + oz);
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshes.push(mesh);
      }
    }
  };

  var createStalactites = function() {
    var stalactiteMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 });

    for (var i = 0; i < 12; i++) {
      var x = (Math.random() - 0.5) * 140;
      var z = (Math.random() - 0.5) * 140;
      var h = Math.random() * 8 + 6;
      var r = Math.random() * 1.5 + 0.8;
      var geometry = new THREE.ConeGeometry(r, h, 8);
      var mesh = new THREE.Mesh(geometry, stalactiteMaterial);
      mesh.position.set(x, 35 - h / 2, z);
      mesh.rotation.z = Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  };

  var createStalagmites = function() {
    var stalagmiteMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 });

    for (var i = 0; i < 12; i++) {
      var x = (Math.random() - 0.5) * 140;
      var z = (Math.random() - 0.5) * 140;
      var h = Math.random() * 8 + 5;
      var r = Math.random() * 1.5 + 0.8;
      var geometry = new THREE.ConeGeometry(r, h, 8);
      var mesh = new THREE.Mesh(geometry, stalagmiteMaterial);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshes.push(mesh);
    }
  };

  var createEnemyStronghold = function() {
    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var gunportMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    var baseGeometry = new THREE.BoxGeometry(50, 25, 40);
    var baseMesh = new THREE.Mesh(baseGeometry, stoneMaterial);
    baseMesh.position.set(-70, 12, -70);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    meshes.push(baseMesh);

    var towerPositions = [
      { x: -85, y: 30, z: -85 },
      { x: -55, y: 30, z: -85 },
      { x: -85, y: 30, z: -55 },
      { x: -55, y: 30, z: -55 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var tpos = towerPositions[i];
      var towerGeometry = new THREE.CylinderGeometry(4, 5, 20, 8);
      var towerMesh = new THREE.Mesh(towerGeometry, stoneMaterial);
      towerMesh.position.set(tpos.x, tpos.y, tpos.z);
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      scene.add(towerMesh);
      meshes.push(towerMesh);
    }

    var gunportPositions = [
      { x: -70, y: 15, z: -95 },
      { x: -70, y: 25, z: -95 },
      { x: -70, y: 15, z: -45 }
    ];

    for (var i = 0; i < gunportPositions.length; i++) {
      var gppos = gunportPositions[i];
      var gpGeometry = new THREE.BoxGeometry(3, 3, 1);
      var gpMesh = new THREE.Mesh(gpGeometry, gunportMaterial);
      gpMesh.position.set(gppos.x, gppos.y, gppos.z);
      scene.add(gpMesh);
      meshes.push(gpMesh);
    }

    var ladderPositions = [
      { x: -75, z: -75 },
      { x: -65, z: -65 }
    ];

    for (var i = 0; i < ladderPositions.length; i++) {
      var lpos = ladderPositions[i];
      var rungCount = 8;
      for (var j = 0; j < rungCount; j++) {
        var p1 = new THREE.Vector3(lpos.x - 1.5, j * 2.5, lpos.z);
        var p2 = new THREE.Vector3(lpos.x + 1.5, j * 2.5, lpos.z);
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]), 3));
        var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x888888 }));
        scene.add(line);
        meshes.push(line);
      }
    }
  };

  var createRopeBridges = function() {
    var plankMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.7 });

    var bridgeData = [
      { x: 0, z: -15, length: 30 },
      { x: -20, z: 15, length: 25 }
    ];

    for (var i = 0; i < bridgeData.length; i++) {
      var bd = bridgeData[i];
      var plankGeometry = new THREE.BoxGeometry(bd.length, 0.5, 3);
      var plankMesh = new THREE.Mesh(plankGeometry, plankMaterial);
      plankMesh.position.set(bd.x, 8, bd.z);
      plankMesh.castShadow = true;
      plankMesh.receiveShadow = true;
      scene.add(plankMesh);
      meshes.push(plankMesh);

      for (var r = 0; r < 2; r++) {
        var ropeX = bd.x - bd.length / 2 + 1 + r * (bd.length - 2);
        var p1 = new THREE.Vector3(ropeX, 8, -3);
        var p2 = new THREE.Vector3(ropeX, 15, -3);
        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]), 3));
        var rope = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xcc9966 }));
        scene.add(rope);
        meshes.push(rope);
      }
    }
  };

  var createGlowingMushrooms = function() {
    var mushroomColors = [0xff00ff, 0x00ffff, 0xffff00, 0xff8800];
    var mushrooms = [];

    for (var i = 0; i < 10; i++) {
      var x = (Math.random() - 0.5) * 120;
      var z = (Math.random() - 0.5) * 120;
      var colorIdx = i % mushroomColors.length;
      var color = mushroomColors[colorIdx];

      var stemGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 6);
      var stemMaterial = new THREE.MeshStandardMaterial({ color: 0x664400 });
      var stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(x, 1, z);
      stem.castShadow = true;
      stem.receiveShadow = true;
      scene.add(stem);
      meshes.push(stem);

      var capGeometry = new THREE.SphereGeometry(1.2, 8, 6);
      var capMaterial = new THREE.MeshStandardMaterial({ color: color, emissive: color, roughness: 0.4 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(x, 2.5, z);
      cap.scale.y = 0.6;
      cap.castShadow = true;
      cap.receiveShadow = true;
      scene.add(cap);
      meshes.push(cap);

      mushrooms.push({ cap: cap, stem: stem, color: color, baseIntensity: 1.0 });
    }

    for (var i = 0; i < mushrooms.length; i++) {
      animatedObjects.push({ type: 'mushroom', mushroom: mushrooms[i] });
    }
  };

  var createSulfurVents = function() {
    var ventPositions = [
      { x: -20, z: 20 },
      { x: 15, z: -25 },
      { x: -35, z: -10 }
    ];

    for (var i = 0; i < ventPositions.length; i++) {
      var vpos = ventPositions[i];
      var ventGeometry = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
      var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(vpos.x, 0.25, vpos.z);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      meshes.push(vent);

      var gasPuffs = [];
      for (var j = 0; j < 5; j++) {
        var gasGeometry = new THREE.SphereGeometry(0.5, 4, 4);
        var gasMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, transparent: true, opacity: 0.4 });
        var puff = new THREE.Mesh(gasGeometry, gasMaterial);
        puff.position.set(vpos.x, 1, vpos.z);
        scene.add(puff);
        meshes.push(puff);
        gasPuffs.push(puff);
      }

      animatedObjects.push({ type: 'vent', puffs: gasPuffs, baseX: vpos.x, baseZ: vpos.z });
    }
  };

  var createLavaBubbles = function() {
    var bubbles = [];
    for (var i = 0; i < 8; i++) {
      var x = (Math.random() - 0.5) * 50 - 30;
      var z = (Math.random() - 0.5) * 50;
      var size = Math.random() * 0.6 + 0.3;

      var geometry = new THREE.SphereGeometry(size, 6, 6);
      var material = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff4400, transparent: true, opacity: 0.6 });
      var bubble = new THREE.Mesh(geometry, material);
      bubble.position.set(x, 0.5, z);
      scene.add(bubble);
      meshes.push(bubble);
      bubbles.push({ mesh: bubble, baseX: x, baseZ: z, size: size, riseSpeed: Math.random() * 8 + 4, lifeTime: 0 });
    }

    animatedObjects.push({ type: 'bubbles', bubbles: bubbles });
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.type === 'lava') {
        var pulse = Math.sin(time * 2) * 0.3 + 0.7;
        obj.mesh.material.emissive.setHex(Math.round(obj.baseEmissive * pulse));
      }
      else if (obj.type === 'waterfall') {
        var wpulse = Math.sin(time * 1.5) * 0.2 + 0.8;
        obj.mesh.material.emissive.setHex(Math.round(obj.baseEmissive * wpulse));
      }
      else if (obj.type === 'mushroom') {
        var mushroom = obj.mushroom;
        var capPulse = Math.sin(time * 3) * 0.4 + 0.9;
        var hue = new THREE.Color().setHex(mushroom.color);
        mushroom.cap.material.emissive.copy(hue);
        mushroom.cap.material.emissive.multiplyScalar(capPulse);
        mushroom.cap.scale.y = 0.6 + Math.sin(time * 2) * 0.08;
      }
      else if (obj.type === 'vent') {
        for (var j = 0; j < obj.puffs.length; j++) {
          var puff = obj.puffs[j];
          var phase = (j / obj.puffs.length) * Math.PI * 2;
          puff.position.x = obj.baseX + Math.sin(time * 2 + phase) * 1.5;
          puff.position.y = 1 + Math.sin(time * 1.5 + phase + j) * 0.8;
          puff.position.z = obj.baseZ + Math.cos(time * 2 + phase) * 1.5;
          puff.scale.x = puff.scale.y = puff.scale.z = 0.8 + Math.sin(time * 2.5 + phase) * 0.3;
        }
      }
      else if (obj.type === 'bubbles') {
        for (var j = 0; j < obj.bubbles.length; j++) {
          var bubble = obj.bubbles[j];
          bubble.lifeTime += delta;

          if (bubble.lifeTime > 3) {
            bubble.mesh.position.set(bubble.baseX + (Math.random() - 0.5) * 20, 0.5, bubble.baseZ + (Math.random() - 0.5) * 20);
            bubble.lifeTime = 0;
          }

          bubble.mesh.position.y = 0.5 + bubble.lifeTime * bubble.riseSpeed;
          var wobble = Math.sin(time * 3 + j) * 0.3;
          bubble.mesh.position.x = bubble.baseX + wobble;
        }
      }
    }
  };

  var reset = function() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    animatedObjects = [];
    time = 0;

    if (scene && camera) {
      init(scene, camera);
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
