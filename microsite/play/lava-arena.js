window.LavaArena = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var arenaObjects = [];

  function createMaterial(color, emissive, metalness, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.3 : 0,
      metalness: metalness !== undefined ? metalness : 0.3,
      roughness: roughness !== undefined ? roughness : 0.7
    });
  }

  function addToArena(mesh) {
    arenaObjects.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    arenaObjects = [];

    var lavaMaterial = createMaterial(0xFF4500, 0xFF6347, 0.6, 0.4);
    var stoneMaterial = createMaterial(0x2F2F2F, 0x1A1A1A, 0.2, 0.8);
    var spectatorMaterial = createMaterial(0x808080, 0x404040, 0.1, 0.9);
    var torchFireMaterial = createMaterial(0xFFAA00, 0xFF8800, 0.5, 0.3);

    // === LAVA SEA FLOOR ===
    var lavaFloorGeom = new THREE.BoxGeometry(100, 2, 100);
    var lavaFloor = new THREE.Mesh(lavaFloorGeom, lavaMaterial);
    lavaFloor.position.set(0, -1, 0);
    lavaFloor.userData.isLavaFloor = true;
    addToArena(lavaFloor);

    // === CENTRAL MEGA-PLATFORM ===
    var megaPlatformGeom = new THREE.BoxGeometry(20, 1, 20);
    var megaPlatform = new THREE.Mesh(megaPlatformGeom, stoneMaterial);
    megaPlatform.position.set(0, 10, 0);
    megaPlatform.userData.isPlatform = true;
    addToArena(megaPlatform);

    // === SURROUNDING COMBAT PLATFORMS ===
    var platformConfig = [
      { x: 25, y: 8, z: 0, w: 12, h: 1, d: 12 },
      { x: -25, y: 8, z: 0, w: 12, h: 1, d: 12 },
      { x: 0, y: 7, z: 25, w: 12, h: 1, d: 12 },
      { x: 0, y: 7, z: -25, w: 12, h: 1, d: 12 },
      { x: 18, y: 12, z: 18, w: 10, h: 1, d: 10 },
      { x: -18, y: 12, z: 18, w: 10, h: 1, d: 10 },
      { x: 18, y: 12, z: -18, w: 10, h: 1, d: 10 },
      { x: -18, y: 12, z: -18, w: 10, h: 1, d: 10 },
      { x: 30, y: 15, z: 15, w: 8, h: 1, d: 8 },
      { x: -30, y: 15, z: 15, w: 8, h: 1, d: 8 },
      { x: 30, y: 15, z: -15, w: 8, h: 1, d: 8 },
      { x: -30, y: 15, z: -15, w: 8, h: 1, d: 8 },
      { x: 20, y: 9, z: -20, w: 10, h: 1, d: 10 },
      { x: -20, y: 9, z: 20, w: 10, h: 1, d: 10 }
    ];

    for (var i = 0; i < platformConfig.length; i++) {
      var cfg = platformConfig[i];
      var geom = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      var mesh = new THREE.Mesh(geom, stoneMaterial);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.userData.isPlatform = true;
      addToArena(mesh);
    }

    // === PLATFORM BRIDGES (narrow walkways) ===
    var bridgeConfig = [
      { x: 12.5, y: 10, z: 0, w: 5, d: 1 },
      { x: -12.5, y: 10, z: 0, w: 5, d: 1 },
      { x: 0, y: 8.5, z: 12.5, w: 1, d: 5 },
      { x: 0, y: 8.5, z: -12.5, w: 1, d: 5 },
      { x: 21.5, y: 10, z: 9, w: 7, d: 1 },
      { x: -21.5, y: 10, z: 9, w: 7, d: 1 },
      { x: 21.5, y: 10, z: -9, w: 7, d: 1 },
      { x: -21.5, y: 10, z: -9, w: 7, d: 1 },
      { x: 9, y: 11, z: 21.5, w: 1, d: 7 },
      { x: -9, y: 11, z: 21.5, w: 1, d: 7 },
      { x: 9, y: 11, z: -21.5, w: 1, d: 7 },
      { x: -9, y: 11, z: -21.5, w: 1, d: 7 }
    ];

    for (var i = 0; i < bridgeConfig.length; i++) {
      var br = bridgeConfig[i];
      var geom = new THREE.BoxGeometry(br.w, 0.5, br.d);
      var mesh = new THREE.Mesh(geom, stoneMaterial);
      mesh.position.set(br.x, br.y, br.z);
      addToArena(mesh);
    }

    // === LAVA GEYSERS (erupting columns) ===
    var geyserConfig = [
      { x: 15, y: 5, z: 15, r: 1.5, h: 8 },
      { x: -15, y: 5, z: 15, r: 1.5, h: 8 },
      { x: 15, y: 5, z: -15, r: 1.5, h: 8 },
      { x: -15, y: 5, z: -15, r: 1.5, h: 8 },
      { x: 30, y: 3, z: 0, r: 2, h: 10 },
      { x: -30, y: 3, z: 0, r: 2, h: 10 },
      { x: 0, y: 3, z: 30, r: 2, h: 10 },
      { x: 0, y: 3, z: -30, r: 2, h: 10 },
      { x: 20, y: 4, z: 20, r: 1.2, h: 7 },
      { x: -20, y: 4, z: -20, r: 1.2, h: 7 }
    ];

    for (var i = 0; i < geyserConfig.length; i++) {
      var g = geyserConfig[i];
      var geom = new THREE.CylinderGeometry(g.r, g.r, g.h, 8);
      var mesh = new THREE.Mesh(geom, lavaMaterial);
      mesh.position.set(g.x, g.y + g.h / 2, g.z);
      mesh.userData.isGeyser = true;
      mesh.userData.originalY = g.y + g.h / 2;
      mesh.userData.baseHeight = g.h;
      mesh.userData.frequency = 2 + Math.random() * 1.5;
      addToArena(mesh);
    }

    // === SPECTATOR STANDS (tiered seating) ===
    var spectatorHeights = [5, 8, 11, 14];
    var spectatorX = [-35, 35];
    var standIndex = 0;

    for (var sx = 0; sx < spectatorX.length; sx++) {
      for (var sh = 0; sh < spectatorHeights.length; sh++) {
        var h = spectatorHeights[sh];
        var geom = new THREE.BoxGeometry(8, 1, 30);
        var mesh = new THREE.Mesh(geom, spectatorMaterial);
        mesh.position.set(spectatorX[sx], h, 0);
        addToArena(mesh);
        standIndex++;
      }
    }

    // Add back spectator stands (z-axis)
    for (var sh = 0; sh < spectatorHeights.length; sh++) {
      var h = spectatorHeights[sh];
      var geom = new THREE.BoxGeometry(30, 1, 8);
      var mesh = new THREE.Mesh(geom, spectatorMaterial);
      mesh.position.set(0, h, 35);
      addToArena(mesh);
    }

    // === ROCK WALL BACKDROP (cliff walls) ===
    var wallConfig = [
      { x: 40, y: 18, z: 0, w: 2, h: 36, d: 80 },
      { x: -40, y: 18, z: 0, w: 2, h: 36, d: 80 },
      { x: 0, y: 18, z: 40, w: 80, h: 36, d: 2 },
      { x: 0, y: 18, z: -40, w: 80, h: 36, d: 2 }
    ];

    for (var i = 0; i < wallConfig.length; i++) {
      var w = wallConfig[i];
      var geom = new THREE.BoxGeometry(w.w, w.h, w.d);
      var mesh = new THREE.Mesh(geom, stoneMaterial);
      mesh.position.set(w.x, w.y, w.z);
      addToArena(mesh);
    }

    // === LAVA WATERFALL (cascade from cliff) ===
    var waterfallX = 38;
    var waterfallZ = 38;
    for (var wf = 0; wf < 6; wf++) {
      var wyStart = 25 - wf * 3;
      var geom = new THREE.BoxGeometry(0.5, 4, 0.5);
      var mesh = new THREE.Mesh(geom, lavaMaterial);
      mesh.position.set(waterfallX, wyStart, waterfallZ);
      mesh.userData.isWaterfall = true;
      addToArena(mesh);
    }

    // === ARENA GATES (entry gates) ===
    var gateConfig = [
      { x: 0, y: 8, z: -38, rx: 0 },
      { x: 0, y: 8, z: 38, rx: 0 },
      { x: 38, y: 8, z: 0, rx: 0 },
      { x: -38, y: 8, z: 0, rx: 0 }
    ];

    for (var i = 0; i < gateConfig.length; i++) {
      var g = gateConfig[i];
      var geom = new THREE.BoxGeometry(6, 10, 0.5);
      var mesh = new THREE.Mesh(geom, stoneMaterial);
      mesh.position.set(g.x, g.y, g.z);
      mesh.rotation.y = g.rx;
      addToArena(mesh);
    }

    // === WEAPON DROP PLATFORMS ===
    var weaponDropConfig = [
      { x: 28, y: 11, z: 28 },
      { x: -28, y: 11, z: 28 },
      { x: 28, y: 11, z: -28 },
      { x: -28, y: 11, z: -28 },
      { x: 35, y: 13, z: 0 },
      { x: -35, y: 13, z: 0 },
      { x: 0, y: 13, z: 35 },
      { x: 0, y: 13, z: -35 }
    ];

    for (var i = 0; i < weaponDropConfig.length; i++) {
      var w = weaponDropConfig[i];
      var geom = new THREE.BoxGeometry(4, 0.8, 4);
      var mesh = new THREE.Mesh(geom, createMaterial(0xFFD700, 0xFFAA00, 0.7, 0.3));
      mesh.position.set(w.x, w.y, w.z);
      mesh.userData.isWeaponDrop = true;
      addToArena(mesh);
    }

    // === LAVA BOMB IMPACT CRATERS (SphereGeometry) ===
    var impactConfig = [
      { x: 8, y: 5.5, z: 8, r: 2 },
      { x: -8, y: 5.5, z: 8, r: 2 },
      { x: 8, y: 5.5, z: -8, r: 2 },
      { x: -8, y: 5.5, z: -8, r: 2 },
      { x: 22, y: 6, z: 0, r: 2.5 },
      { x: -22, y: 6, z: 0, r: 2.5 },
      { x: 0, y: 6, z: 22, r: 2.5 },
      { x: 0, y: 6, z: -22, r: 2.5 }
    ];

    for (var i = 0; i < impactConfig.length; i++) {
      var imp = impactConfig[i];
      var geom = new THREE.SphereGeometry(imp.r, 12, 8);
      var mesh = new THREE.Mesh(geom, createMaterial(0xFF3300, 0xFF6600, 0.5, 0.4));
      mesh.position.set(imp.x, imp.y, imp.z);
      mesh.scale.y = 0.4;
      mesh.userData.isImpactCrater = true;
      addToArena(mesh);
    }

    // === FIRE TORNADO (rotating cylinder at arena edge) ===
    var tornadoGeom = new THREE.CylinderGeometry(4, 5, 18, 12);
    var tornadoMesh = new THREE.Mesh(tornadoGeom, createMaterial(0xFF6600, 0xFF8800, 0.6, 0.3));
    tornadoMesh.position.set(38, 9, -38);
    tornadoMesh.userData.isTornado = true;
    tornadoMesh.userData.rotation = 0;
    addToArena(tornadoMesh);

    // === VICTORY TORCH PILLARS (tall cylinder poles with sphere fire) ===
    var torchConfig = [
      { x: 35, z: 35 },
      { x: -35, z: 35 },
      { x: 35, z: -35 },
      { x: -35, z: -35 },
      { x: 40, z: 0 },
      { x: -40, z: 0 },
      { x: 0, z: 40 },
      { x: 0, z: -40 }
    ];

    for (var i = 0; i < torchConfig.length; i++) {
      var t = torchConfig[i];

      // Pillar (cylinder)
      var pillarGeom = new THREE.CylinderGeometry(1, 1.2, 16, 8);
      var pillarMesh = new THREE.Mesh(pillarGeom, stoneMaterial);
      pillarMesh.position.set(t.x, 8, t.z);
      addToArena(pillarMesh);

      // Fire top (sphere)
      var fireGeom = new THREE.SphereGeometry(2, 10, 10);
      var fireMesh = new THREE.Mesh(fireGeom, torchFireMaterial);
      fireMesh.position.set(t.x, 17, t.z);
      fireMesh.userData.isTorchFire = true;
      fireMesh.userData.originalScale = 2;
      fireMesh.userData.flickerPhase = Math.random() * Math.PI * 2;
      addToArena(fireMesh);
    }

    // === ADDITIONAL PLATFORM STRUCTURES ===
    // Cone-shaped rock formations
    for (var rc = 0; rc < 6; rc++) {
      var angle = (rc / 6) * Math.PI * 2;
      var cx = Math.cos(angle) * 32;
      var cz = Math.sin(angle) * 32;
      var coneGeom = new THREE.ConeGeometry(3, 8, 8);
      var coneMesh = new THREE.Mesh(coneGeom, stoneMaterial);
      coneMesh.position.set(cx, 4, cz);
      addToArena(coneMesh);
    }

    // Ring of small platforms around center
    for (var rp = 0; rp < 8; rp++) {
      var angle = (rp / 8) * Math.PI * 2;
      var rpx = Math.cos(angle) * 26;
      var rpz = Math.sin(angle) * 26;
      var rpy = 8 + Math.sin(rp) * 1.5;
      var rpGeom = new THREE.BoxGeometry(5, 0.8, 5);
      var rpMesh = new THREE.Mesh(rpGeom, stoneMaterial);
      rpMesh.position.set(rpx, rpy, rpz);
      rpMesh.userData.isPlatform = true;
      addToArena(rpMesh);
    }

    // Small elevated jump pads
    for (var jp = 0; jp < 6; jp++) {
      var jangle = (jp / 6) * Math.PI * 2;
      var jpx = Math.cos(jangle) * 18;
      var jpz = Math.sin(jangle) * 18;
      var jpGeom = new THREE.BoxGeometry(3, 0.6, 3);
      var jpMesh = new THREE.Mesh(jpGeom, createMaterial(0x00AA00, 0x00FF00, 0.5, 0.4));
      jpMesh.position.set(jpx, 14, jpz);
      jpMesh.userData.isJumpPad = true;
      addToArena(jpMesh);
    }

    return arenaObjects.length;
  }

  function update(delta) {
    var time = performance.now() * 0.001;

    for (var i = 0; i < arenaObjects.length; i++) {
      var obj = arenaObjects[i];

      // Lava floor pulsing
      if (obj.userData.isLavaFloor) {
        var pulse = 1 + Math.sin(time * 2) * 0.05;
        obj.scale.y = pulse;
      }

      // Geysers erupting (height oscillation)
      if (obj.userData.isGeyser) {
        var freq = obj.userData.frequency;
        var baseHeight = obj.userData.baseHeight;
        var eruptionAmount = Math.sin(time * freq) * 0.5;
        if (eruptionAmount > 0) {
          obj.scale.y = 1 + eruptionAmount * 2;
          obj.position.y = obj.userData.originalY + eruptionAmount * baseHeight * 0.3;
        } else {
          obj.scale.y = 1;
          obj.position.y = obj.userData.originalY;
        }
      }

      // Fire tornado rotating
      if (obj.userData.isTornado) {
        obj.rotation.y += delta * 3;
        obj.userData.rotation = obj.rotation.y;
      }

      // Torch fires flickering
      if (obj.userData.isTorchFire) {
        var flicker = 0.9 + Math.sin(time * 8 + obj.userData.flickerPhase) * 0.15;
        var originalScale = obj.userData.originalScale;
        obj.scale.set(flicker, flicker, flicker);
        obj.material.emissiveIntensity = 0.4 + flicker * 0.2;
      }
    }
  }

  function reset() {
    for (var i = 0; i < arenaObjects.length; i++) {
      scene.remove(arenaObjects[i]);
      if (arenaObjects[i].geometry) {
        arenaObjects[i].geometry.dispose();
      }
      if (arenaObjects[i].material) {
        if (Array.isArray(arenaObjects[i].material)) {
          for (var m = 0; m < arenaObjects[i].material.length; m++) {
            arenaObjects[i].material[m].dispose();
          }
        } else {
          arenaObjects[i].material.dispose();
        }
      }
    }
    arenaObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
