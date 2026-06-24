window.SwampOutpost = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var enemies = [];
  var caches = [];
  var lastKeyTime = null;
  var lastKeyChar = null;
  var enabled = true;
  var enemiesKilled = 0;
  var cachesDestroyed = 0;
  var hudElement = null;
  var time = 0;

  var init = function(sc, cam) {
    scene = sc;
    camera = cam;
    objects = [];
    enemies = [];
    caches = [];
    enemiesKilled = 0;
    cachesDestroyed = 0;
    time = 0;

    // Setup keybinding
    document.addEventListener('keydown', handleKeyPress);

    // Setup HUD
    var hudDiv = document.createElement('div');
    hudDiv.id = 'outpost-hud';
    hudDiv.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 14px; text-shadow: 0 0 10px #00ff00; z-index: 100;';
    hudDiv.innerHTML = 'OUTPOST CLEARED: NO<br>MILITIA DOWN: 0/15<br>CACHE DESTROYED: 0/3<br>STATUS: ON';
    document.body.appendChild(hudDiv);
    hudElement = hudDiv;

    // Scene setup
    scene.fog = new THREE.Fog(0x1a3a1a, 50, 150);
    scene.background = new THREE.Color(0x0a1f0a);

    // Swamp water surface
    var waterGeom = new THREE.BoxGeometry(200, 0.5, 200);
    var waterMat = new THREE.MeshStandardMaterial({ color: 0x0d3d0d, roughness: 0.8 });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = -5;
    water.userData.isWater = true;
    scene.add(water);
    objects.push(water);

    // Main stilted platform
    var platformGeom = new THREE.BoxGeometry(30, 1, 25);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(0, 8, 0);
    scene.add(platform);
    objects.push(platform);

    // Platform stilts
    var stiltGeom = new THREE.CylinderGeometry(0.5, 0.6, 14, 8);
    var stiltMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.95 });
    var positions = [[-12, 0, -10], [12, 0, -10], [-12, 0, 10], [12, 0, 10]];
    for (var i = 0; i < positions.length; i++) {
      var stilt = new THREE.Mesh(stiltGeom, stiltMat);
      stilt.position.set(positions[i][0], 0, positions[i][2]);
      scene.add(stilt);
      objects.push(stilt);
    }

    // Second platform (connected)
    var platform2Geom = new THREE.BoxGeometry(25, 1, 20);
    var platform2 = new THREE.Mesh(platform2Geom, platformMat);
    platform2.position.set(35, 7, -15);
    scene.add(platform2);
    objects.push(platform2);

    // Stilts for second platform
    var stiltPos2 = [[-10, 0, -8], [10, 0, -8], [-10, 0, 8], [10, 0, 8]];
    for (var j = 0; j < stiltPos2.length; j++) {
      var s2 = new THREE.Mesh(stiltGeom, stiltMat);
      s2.position.set(35 + stiltPos2[j][0], 0, -15 + stiltPos2[j][1]);
      scene.add(s2);
      objects.push(s2);
    }

    // Rope bridge (planks + rope railings)
    var bridgeGeom = new THREE.BoxGeometry(3, 0.3, 20);
    var bridgeMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.85 });
    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(17, 8, -8);
    bridge.rotation.z = 0.15;
    scene.add(bridge);
    objects.push(bridge);

    // Bridge rope railings using LineSegments
    var ropeGeom = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      15, 8.5, -8, 19, 7.5, -8,
      15, 8.5, 12, 19, 7.5, 12
    ]);
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
    var ropes = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(ropes);
    objects.push(ropes);

    // Weapon cache shed
    var shedGeom = new THREE.BoxGeometry(12, 8, 10);
    var shedMat = new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.9 });
    var shed = new THREE.Mesh(shedGeom, shedMat);
    shed.position.set(-25, 9, 20);
    scene.add(shed);
    objects.push(shed);
    caches.push(shed);

    // Corrugated roof
    var roofGeom = new THREE.BoxGeometry(13, 1, 11);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x6b5d52, roughness: 0.85, emissive: 0x0a0a0a });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(-25, 12.5, 20);
    scene.add(roof);
    objects.push(roof);

    // Ammo crates (stacked)
    for (var c = 0; c < 6; c++) {
      var crateGeom = new THREE.BoxGeometry(2, 2, 2);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0x3d3d2d, roughness: 0.9 });
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(-25 + (c % 3) * 3, 10 + Math.floor(c / 3) * 2, 12);
      scene.add(crate);
      objects.push(crate);
      caches.push(crate);
    }

    // Fire pit
    var fireGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 0.7,
      roughness: 0.8
    });
    var firePit = new THREE.Mesh(fireGeom, fireMat);
    firePit.position.set(10, 8.2, -20);
    firePit.userData.fireEmissive = 0.7;
    scene.add(firePit);
    objects.push(firePit);

    // Ash base under fire
    var ashGeom = new THREE.BoxGeometry(4, 0.3, 4);
    var ashMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.95 });
    var ashBase = new THREE.Mesh(ashGeom, ashMat);
    ashBase.position.set(10, 8, -20);
    scene.add(ashBase);
    objects.push(ashBase);

    // Mosquito net canopy (LineSegments mesh)
    var netGeom = new THREE.BufferGeometry();
    var netPts = new Float32Array([
      -5, 10, -5, 5, 10, -5,
      5, 10, -5, 5, 10, 5,
      5, 10, 5, -5, 10, 5,
      -5, 10, 5, -5, 10, -5,
      -5, 9, -5, 5, 9, 5,
      5, 9, -5, -5, 9, 5
    ]);
    netGeom.setAttribute('position', new THREE.BufferAttribute(netPts, 3));
    var netMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 1 });
    var netMesh = new THREE.LineSegments(netGeom, netMat);
    netMesh.position.set(-40, 0, -10);
    scene.add(netMesh);
    objects.push(netMesh);

    // Tree stumps
    var stumpGeom = new THREE.CylinderGeometry(2, 2.5, 2, 8);
    var stumpMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.95 });
    var stumpPoss = [[-50, 8.2, -30], [50, 8.2, 40], [-45, 8.2, 20], [40, 8.2, -40]];
    for (var st = 0; st < stumpPoss.length; st++) {
      var stump = new THREE.Mesh(stumpGeom, stumpMat);
      stump.position.set(stumpPoss[st][0], stumpPoss[st][1], stumpPoss[st][2]);
      scene.add(stump);
      objects.push(stump);
    }

    // Submerged vehicle wreck
    var wreckGeom = new THREE.BoxGeometry(8, 2, 4);
    var wreckMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });
    var wreck = new THREE.Mesh(wreckGeom, wreckMat);
    wreck.position.set(-30, -3, 50);
    scene.add(wreck);
    objects.push(wreck);

    // Sniper perch in tree (tall cylinder trunk + platform)
    var trunkGeom = new THREE.CylinderGeometry(1.5, 2, 30, 8);
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.96 });
    var trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.set(50, 0, 50);
    scene.add(trunk);
    objects.push(trunk);

    var perchGeom = new THREE.BoxGeometry(6, 0.5, 6);
    var perchMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
    var perch = new THREE.Mesh(perchGeom, perchMat);
    perch.position.set(50, 25, 50);
    scene.add(perch);
    objects.push(perch);

    // Communications antenna
    var antGeom = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
    var antMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var antenna = new THREE.Mesh(antGeom, antMat);
    antenna.position.set(20, 20, -35);
    scene.add(antenna);
    objects.push(antenna);

    // Oil drum cluster
    var drumGeom = new THREE.CylinderGeometry(1, 1, 3, 8);
    var drumMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
    for (var d = 0; d < 4; d++) {
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.set(-15 + (d % 2) * 2.5, 8.5, 5 + Math.floor(d / 2) * 2.5);
      scene.add(drum);
      objects.push(drum);
    }

    // Wooden dock pier
    var dockGeom = new THREE.BoxGeometry(20, 0.5, 3);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.88 });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(-60, -4.7, 0);
    scene.add(dock);
    objects.push(dock);

    // Dugout canoe
    var canoeGeom = new THREE.BoxGeometry(8, 1, 2);
    var canoeMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.9 });
    var canoe = new THREE.Mesh(canoeGeom, canoeMat);
    canoe.position.set(-50, -4, 15);
    canoe.userData.canoeY = -4;
    scene.add(canoe);
    objects.push(canoe);

    // Outboard motor boat
    var boatHullGeom = new THREE.BoxGeometry(6, 1.5, 2.5);
    var boatHullMat = new THREE.MeshStandardMaterial({ color: 0x4a4a6a, roughness: 0.85 });
    var boatHull = new THREE.Mesh(boatHullGeom, boatHullMat);
    boatHull.position.set(30, -4.2, 30);
    boatHull.userData.boatY = -4.2;
    scene.add(boatHull);
    objects.push(boatHull);

    var motorGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 6);
    var motorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    var motor = new THREE.Mesh(motorGeom, motorMat);
    motor.position.set(32, -2, 30);
    scene.add(motor);
    objects.push(motor);

    // Alligator silhouette in water
    var gatorGeom = new THREE.BoxGeometry(5, 0.4, 1);
    var gatorMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.92 });
    var gator = new THREE.Mesh(gatorGeom, gatorMat);
    gator.position.set(20, -4.7, 60);
    scene.add(gator);
    objects.push(gator);

    // Enemies (militia)
    var militiaPositions = [
      [0, 9, 5], [5, 9, -5], [-5, 9, 0], [35, 8, -10], [35, 8, -20],
      [-25, 10, 20], [10, 8.5, -20], [50, 26, 50], [-40, 10, -10], [30, -3.5, 30],
      [-50, -3.8, 15], [-60, -4, 0], [20, 8.5, -35]
    ];
    for (var e = 0; e < 13; e++) {
      var enemyGeom = new THREE.BoxGeometry(0.6, 2, 0.4);
      var enemyMat = new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: 0.8 });
      var enemy = new THREE.Mesh(enemyGeom, enemyMat);
      enemy.position.set(militiaPositions[e][0], militiaPositions[e][1], militiaPositions[e][2]);
      enemy.userData.isEnemy = true;
      enemy.userData.alive = true;
      scene.add(enemy);
      enemies.push(enemy);
      objects.push(enemy);
    }

    // Fireflies (small floating sphere points)
    var ffyGeom = new THREE.BufferGeometry();
    var ffyPositions = [];
    for (var ff = 0; ff < 20; ff++) {
      ffyPositions.push(
        (Math.random() - 0.5) * 100,
        5 + Math.random() * 30,
        (Math.random() - 0.5) * 100
      );
    }
    ffyGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ffyPositions), 3));
    var ffyMat = new THREE.PointsMaterial({ color: 0xffff00, size: 0.3 });
    var fireflies = new THREE.Points(ffyGeom, ffyMat);
    fireflies.userData.isFirefly = true;
    fireflies.userData.ffyOffsets = [];
    for (var ffo = 0; ffo < 20; ffo++) {
      fireflies.userData.ffyOffsets.push(Math.random() * Math.PI * 2);
    }
    scene.add(fireflies);
    objects.push(fireflies);
  };

  var update = function(delta) {
    if (!enabled || !scene) return;

    time += delta;

    // Water ripples (scale oscillation)
    var waterObj = objects.find(function(o) { return o.userData.isWater; });
    if (waterObj) {
      waterObj.scale.y = 0.95 + Math.sin(time * 2) * 0.05;
    }

    // Boat bobs on water
    var boatHull = objects.find(function(o) { return o.userData.boatY !== undefined; });
    if (boatHull) {
      boatHull.position.y = boatHull.userData.boatY + Math.sin(time * 1.5) * 0.3;
    }

    // Canoe rocks gently
    var canoe = objects.find(function(o) { return o.userData.canoeY !== undefined; });
    if (canoe) {
      canoe.position.y = canoe.userData.canoeY + Math.sin(time * 1.2) * 0.25;
      canoe.rotation.z = Math.sin(time * 0.8) * 0.1;
    }

    // Fire crackles (emissive intensity pulse)
    var fire = objects.find(function(o) { return o.userData.fireEmissive !== undefined; });
    if (fire && fire.material) {
      var pulse = 0.7 + Math.sin(time * 3) * 0.2 + Math.sin(time * 7) * 0.15;
      fire.material.emissiveIntensity = Math.max(0.3, Math.min(1, pulse));
    }

    // Fog drifts (density oscillates)
    if (scene.fog) {
      var baseFar = 150;
      scene.fog.far = baseFar + Math.sin(time * 0.5) * 15;
    }

    // Fireflies float and blink
    var fireflies = objects.find(function(o) { return o.userData.isFirefly; });
    if (fireflies && fireflies.geometry.attributes.position) {
      var positions = fireflies.geometry.attributes.position.array;
      for (var ffi = 0; ffi < positions.length / 3; ffi++) {
        positions[ffi * 3 + 1] += Math.sin(time * 0.3 + fireflies.userData.ffyOffsets[ffi]) * 0.05;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;
      fireflies.material.opacity = 0.6 + Math.sin(time * 4 + fireflies.userData.ffyOffsets[0]) * 0.4;
    }
  };

  var reset = function() {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var m = 0; m < objects[i].material.length; m++) {
            objects[i].material[m].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }
    objects = [];
    enemies = [];
    caches = [];
    enemiesKilled = 0;
    cachesDestroyed = 0;
    time = 0;

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyPress);
  };

  var handleKeyPress = function(e) {
    var now = Date.now();
    var key = e.key ? e.key.toUpperCase() : String.fromCharCode(e.keyCode).toUpperCase();

    if (key === 'S') {
      lastKeyTime = now;
      lastKeyChar = 'S';
    } else if (key === 'O' && lastKeyChar === 'S' && (now - lastKeyTime) < 400) {
      enabled = !enabled;
      updateHUD();
      lastKeyChar = null;
      lastKeyTime = null;
    }
  };

  var updateHUD = function() {
    if (hudElement) {
      var cleared = (enemiesKilled >= 15 && cachesDestroyed >= 3) ? 'YES' : 'NO';
      var status = enabled ? 'ON' : 'OFF';
      hudElement.innerHTML = 'OUTPOST CLEARED: ' + cleared + '<br>' +
                             'MILITIA DOWN: ' + enemiesKilled + '/15<br>' +
                             'CACHE DESTROYED: ' + cachesDestroyed + '/3<br>' +
                             'STATUS: ' + status;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
