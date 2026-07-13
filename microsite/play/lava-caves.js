window.LavaCaves = (function() {
  'use strict';

  var sceneObjects = [];
  var glowingPools = [];
  var geysers = [];
  var smokeParticles = [];
  var crystals = [];
  var animationTime = 0;

  var init = function(scene, camera) {
    // Clear any existing objects
    reset();
    animationTime = 0;

    // Cavern floor - dark stone base
    var floorGeometry = new THREE.BoxGeometry(150, 2, 150);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.9, metalness: 0.1 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -1;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Cavern ceiling with stalactite formations
    var ceilingGeometry = new THREE.BoxGeometry(150, 3, 150);
    var ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x0d0a08, roughness: 0.95, metalness: 0.05 });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = 40;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    sceneObjects.push(ceiling);

    // Stalactite formations - cone shapes hanging from ceiling
    var stalactitePositions = [
      { x: -40, z: -40 }, { x: -20, z: -50 }, { x: 0, z: -45 },
      { x: 30, z: -40 }, { x: 50, z: -48 }, { x: -50, z: 0 },
      { x: 40, z: 20 }, { x: -30, z: 30 }, { x: 20, z: 40 }
    ];

    stalactitePositions.forEach(function(pos) {
      var stalactiteGeometry = new THREE.ConeGeometry(3, 8, 8);
      var stalactiteMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.8, metalness: 0.2 });
      var stalactite = new THREE.Mesh(stalactiteGeometry, stalactiteMaterial);
      stalactite.position.set(pos.x, 30, pos.z);
      stalactite.castShadow = true;
      stalactite.receiveShadow = true;
      scene.add(stalactite);
      sceneObjects.push(stalactite);
    });

    // Lava river - flowing through center using spheres
    var lavaColor = 0xff6600;
    var lavaPositions = [
      { x: 0, z: -30 }, { x: 5, z: 0 }, { x: -8, z: 30 }, { x: 10, z: 50 }
    ];

    lavaPositions.forEach(function(pos) {
      var lavaGeometry = new THREE.SphereGeometry(8, 16, 12);
      var lavaMaterial = new THREE.MeshStandardMaterial({
        color: lavaColor,
        emissive: 0xff4400,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.3
      });
      var lavaPool = new THREE.Mesh(lavaGeometry, lavaMaterial);
      lavaPool.position.set(pos.x, 0.5, pos.z);
      lavaPool.scale.set(1, 0.3, 1);
      lavaPool.castShadow = true;
      lavaPool.receiveShadow = true;
      scene.add(lavaPool);
      sceneObjects.push(lavaPool);
      glowingPools.push({ mesh: lavaPool, baseIntensity: 0.6, time: Math.random() * Math.PI * 2 });
    });

    // Stone bridges crossing lava
    var bridgePositions = [
      { x: 0, z: -20 }, { x: 0, z: 25 }
    ];

    bridgePositions.forEach(function(pos) {
      var bridgeGeometry = new THREE.BoxGeometry(25, 1.5, 4);
      var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3f35, roughness: 0.85, metalness: 0.15 });
      var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
      bridge.position.set(pos.x, 0.8, pos.z);
      bridge.castShadow = true;
      bridge.receiveShadow = true;
      scene.add(bridge);
      sceneObjects.push(bridge);
    });

    // Gas vents/geysers - cylinders with animated eruptions
    var geyserPositions = [
      { x: -60, z: -50 }, { x: 60, z: -40 }, { x: -50, z: 50 }, { x: 50, z: 55 }
    ];

    geyserPositions.forEach(function(pos) {
      var ventGeometry = new THREE.CylinderGeometry(4, 5, 0.5, 12);
      var ventMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.9, metalness: 0.1 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos.x, 0.2, pos.z);
      vent.castShadow = true;
      vent.receiveShadow = true;
      scene.add(vent);
      sceneObjects.push(vent);
      geysers.push({ basePos: pos, time: Math.random() * Math.PI * 2, particles: [] });
    });

    // Crystal formations - rotating spheres with glow
    var crystalPositions = [
      { x: -70, z: -60, color: 0x00ff88 }, { x: 70, z: -50, color: 0xff00ff },
      { x: -65, z: 60, color: 0x00ddff }, { x: 65, z: 60, color: 0xffdd00 },
      { x: 0, z: -70, color: 0x88ff00 }, { x: 0, z: 75, color: 0xff0088 }
    ];

    crystalPositions.forEach(function(pos) {
      var crystalGeometry = new THREE.SphereGeometry(5, 12, 8);
      var crystalMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        emissive: pos.color,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.7,
        wireframe: false
      });
      var crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
      crystal.position.set(pos.x, 15, pos.z);
      crystal.castShadow = true;
      crystal.receiveShadow = true;
      scene.add(crystal);
      sceneObjects.push(crystal);
      crystals.push({ mesh: crystal, baseColor: pos.color });
    });

    // Weapon crates stacked near lava walls
    var cratePositions = [
      { x: -45, z: -65 }, { x: -45, z: -58 }, { x: -45, z: -51 },
      { x: 45, z: 65 }, { x: 45, z: 58 }
    ];

    cratePositions.forEach(function(pos) {
      var crateGeometry = new THREE.BoxGeometry(6, 6, 6);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.7, metalness: 0.1 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos.x, 3, pos.z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      sceneObjects.push(crate);
    });

    // Obsidian spire pillars
    var spirePositions = [
      { x: -30, z: 0 }, { x: 30, z: 0 }, { x: 0, z: -40 }, { x: 0, z: 40 }
    ];

    spirePositions.forEach(function(pos) {
      var spireGeometry = new THREE.ConeGeometry(4, 20, 6);
      var spireMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.4 });
      var spire = new THREE.Mesh(spireGeometry, spireMaterial);
      spire.position.set(pos.x, 10, pos.z);
      spire.castShadow = true;
      spire.receiveShadow = true;
      scene.add(spire);
      sceneObjects.push(spire);
    });

    // Magma falls - cylindrical water-fall effect using cylinders
    var fallGeometry = new THREE.CylinderGeometry(6, 5, 25, 8);
    var fallMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc3300,
      emissive: 0xaa2200,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      metalness: 0.2
    });
    var magmaFall = new THREE.Mesh(fallGeometry, fallMaterial);
    magmaFall.position.set(-75, 15, -70);
    magmaFall.castShadow = true;
    magmaFall.receiveShadow = true;
    scene.add(magmaFall);
    sceneObjects.push(magmaFall);

    // Collapsed tunnel opening - box with partial obstruction
    var tunnelGeometry = new THREE.BoxGeometry(20, 15, 30);
    var tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.9, metalness: 0.05 });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(70, 8, 0);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    scene.add(tunnel);
    sceneObjects.push(tunnel);

    // Collapsed rubble - spheres to represent rocks
    var rubblePositions = [
      { x: 70, z: -15 }, { x: 75, z: -10 }, { x: 68, z: 10 }, { x: 72, z: 5 }
    ];

    rubblePositions.forEach(function(pos) {
      var rubbleGeometry = new THREE.SphereGeometry(3, 8, 8);
      var rubbleMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.8, metalness: 0.1 });
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(pos.x, 5, pos.z);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      sceneObjects.push(rubble);
    });

    // Smoke/haze particles - represented as semi-transparent spheres
    var smokeBasePositions = [
      { x: 0, z: 25 }, { x: -60, z: -50 }, { x: 60, z: -40 }
    ];

    smokeBasePositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var smokeGeometry = new THREE.SphereGeometry(8, 8, 8);
        var smokeMaterial = new THREE.MeshStandardMaterial({
          color: 0x666666,
          transparent: true,
          opacity: 0.2,
          emissive: 0x444444,
          emissiveIntensity: 0.1
        });
        var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smoke.position.set(pos.x + (Math.random() - 0.5) * 10, 10 + i * 8, pos.z + (Math.random() - 0.5) * 10);
        scene.add(smoke);
        sceneObjects.push(smoke);
        smokeParticles.push({
          mesh: smoke,
          basePos: { x: smoke.position.x, y: smoke.position.y, z: smoke.position.z },
          time: Math.random() * Math.PI * 2,
          driftSpeed: 0.3 + Math.random() * 0.2
        });
      }
    });

    // Ambient lighting for lava glow
    var ambientLight = new THREE.AmbientLight(0x663322, 0.4);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    // Point lights for lava and crystal glow
    var lavaLights = [
      { x: 0, z: -30, color: 0xff6600 },
      { x: 5, z: 0, color: 0xff7722 },
      { x: -8, z: 30, color: 0xff5500 },
      { x: 10, z: 50, color: 0xff6600 }
    ];

    lavaLights.forEach(function(light) {
      var pointLight = new THREE.PointLight(light.color, 0.8, 40);
      pointLight.position.set(light.x, 5, light.z);
      pointLight.castShadow = true;
      scene.add(pointLight);
      sceneObjects.push(pointLight);
    });
  };

  var update = function(delta) {
    animationTime += delta;

    // Pulse glowing lava pools
    glowingPools.forEach(function(pool) {
      pool.time += delta;
      var pulse = 0.4 + 0.4 * Math.sin(pool.time * 2);
      pool.mesh.material.emissiveIntensity = pool.baseIntensity * pulse;
      pool.mesh.scale.y = 0.3 * (0.8 + 0.4 * Math.sin(pool.time * 1.5));
    });

    // Animate geysers with eruption cycles
    geysers.forEach(function(geyser) {
      geyser.time += delta;
      var eruptionPhase = Math.sin(geyser.time * 1.2);
      if (eruptionPhase > 0.7) {
        // Eruption phase - create upward movement
        var particleCount = Math.floor(eruptionPhase * 5);
        for (var i = geyser.particles.length; i < particleCount; i++) {
          var particleGeometry = new THREE.SphereGeometry(0.8, 4, 4);
          var particleMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa44,
            emissive: 0xff6600,
            emissiveIntensity: 0.7
          });
          var particle = new THREE.Mesh(particleGeometry, particleMaterial);
          particle.position.set(
            geyser.basePos.x + (Math.random() - 0.5) * 3,
            1,
            geyser.basePos.z + (Math.random() - 0.5) * 3
          );
          geyser.particles.push({
            mesh: particle,
            velocityY: 15 + Math.random() * 10,
            life: 2
          });
        }
      }

      // Update existing particles
      for (var j = geyser.particles.length - 1; j >= 0; j--) {
        var p = geyser.particles[j];
        p.life -= delta;
        if (p.life <= 0) {
          geyser.particles.splice(j, 1);
        } else {
          p.mesh.position.y += p.velocityY * delta;
          p.velocityY -= 9.8 * delta; // gravity
        }
      }
    });

    // Drift smoke particles upward
    smokeParticles.forEach(function(smoke) {
      smoke.time += delta;
      smoke.mesh.position.y += smoke.driftSpeed * delta;
      smoke.mesh.position.x += Math.sin(smoke.time * 0.5) * 0.5 * delta;
      smoke.mesh.position.z += Math.cos(smoke.time * 0.7) * 0.5 * delta;

      // Fade and reset
      if (smoke.mesh.position.y > smoke.basePos.y + 30) {
        smoke.mesh.position.set(smoke.basePos.x, smoke.basePos.y, smoke.basePos.z);
        smoke.time = 0;
      }
    });

    // Rotate crystals slowly
    crystals.forEach(function(crystal) {
      crystal.mesh.rotation.x += 0.3 * delta;
      crystal.mesh.rotation.y += 0.5 * delta;
      crystal.mesh.rotation.z += 0.2 * delta;

      // Pulsing glow
      var glowPulse = 0.4 + 0.3 * Math.sin(animationTime * 2 + Math.random() * Math.PI);
      crystal.mesh.material.emissiveIntensity = glowPulse;
    });
  };

  var reset = function() {
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });
    sceneObjects = [];
    glowingPools = [];
    geysers = [];
    smokeParticles = [];
    crystals = [];
    animationTime = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
