window.LavaField = (function() {
  'use strict';

  var meshes = [];
  var particles = [];
  var guards = [];
  var animations = {};
  var time = 0;

  var colors = {
    lava: 0xFF5500,
    obsidian: 0x1A1A1A,
    cooledLava: 0x444444,
    cultRed: 0x880000,
    fireYellow: 0xFFCC00,
    steam: 0xEEEEEE
  };

  function createLavaChannel(x, y, z, width, depth, length, scene) {
    var geometry = new THREE.BoxGeometry(width, depth, length);
    var material = new THREE.MeshStandardMaterial({
      color: colors.lava,
      emissive: colors.lava,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.4
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.lavaIntensity = 0.6;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createObsidianPlatform(x, y, z, width, height, depth, scene) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.obsidian,
      emissive: 0x000000,
      metalness: 0.8,
      roughness: 0.2
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.originalScale = { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z };
    mesh.crumbleIntensity = 0;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createVolcanicRockPillar(x, y, z, scene) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var stack1 = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var mat1 = new THREE.MeshStandardMaterial({
      color: colors.cooledLava,
      metalness: 0.6,
      roughness: 0.5
    });
    var mesh1 = new THREE.Mesh(stack1, mat1);
    mesh1.position.y = 0.4;
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;
    group.add(mesh1);

    var stack2 = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    var mesh2 = new THREE.Mesh(stack1, mat1);
    mesh2.position.y = 1.2;
    mesh2.scale.set(0.75, 0.9, 0.75);
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    group.add(mesh2);

    var stack3 = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var mesh3 = new THREE.Mesh(stack1, mat1);
    mesh3.position.y = 1.95;
    mesh3.scale.set(0.5, 0.75, 0.5);
    mesh3.castShadow = true;
    mesh3.receiveShadow = true;
    group.add(mesh3);

    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createFumaroleVent(x, y, z, scene) {
    var geometry = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 16);
    var material = new THREE.MeshStandardMaterial({
      color: colors.cooledLava,
      emissive: colors.lava,
      emissiveIntensity: 0.2,
      metalness: 0.5,
      roughness: 0.6
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.eruptionTimer = Math.random() * 3;
    mesh.eruptionCycle = 3 + Math.random() * 2;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createSteamParticles(x, y, z, count) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1 + Math.random() * 2;
      var particle = {
        x: x,
        y: y,
        z: z,
        vx: Math.cos(angle) * speed * 0.3,
        vy: 2 + Math.random() * 1,
        vz: Math.sin(angle) * speed * 0.3,
        life: 1,
        maxLife: 2 + Math.random() * 1,
        size: 0.3 + Math.random() * 0.2
      };
      particles.push(particle);
    }
  }

  function createLavaFountain(x, y, z, scene) {
    var geometry = new THREE.SphereGeometry(0.4, 8, 8);
    var material = new THREE.MeshStandardMaterial({
      color: colors.lava,
      emissive: colors.lava,
      emissiveIntensity: 0.8,
      metalness: 0.4,
      roughness: 0.3
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.fountainPhase = 0;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createRopeBeamCables(x1, y1, z1, x2, y2, z2, scene) {
    var distance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
    );
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array([
      x1, y1, z1,
      x2, y2, z2,
      x1 + 0.15, y1, z1,
      x2 + 0.15, y2, z2,
      x1 - 0.15, y1, z1,
      x2 - 0.15, y2, z2
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var material = new THREE.LineBasicMaterial({
      color: colors.cooledLava,
      linewidth: 2
    });
    var lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    meshes.push(lines);
    return lines;
  }

  function createRopeBridgePlanks(x1, y1, z1, x2, y2, z2, count, scene) {
    var dx = (x2 - x1) / count;
    var dy = (y2 - y1) / count;
    var dz = (z2 - z1) / count;

    for (var i = 0; i < count; i++) {
      var px = x1 + dx * i;
      var py = y1 + dy * i;
      var pz = z1 + dz * i;

      var geometry = new THREE.BoxGeometry(0.8, 0.1, 0.3);
      var material = new THREE.MeshStandardMaterial({
        color: colors.cooledLava,
        metalness: 0.4,
        roughness: 0.7
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.swayPhase = i * 0.3;
      mesh.originalY = py;
      scene.add(mesh);
      meshes.push(mesh);
    }
  }

  function createRitualAltar(x, y, z, scene) {
    var baseGeometry = new THREE.BoxGeometry(2, 0.3, 2);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: colors.cultRed,
      emissive: colors.cultRed,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.5
    });
    var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(x, y, z);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    meshes.push(baseMesh);

    var postGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
    var mesh = new THREE.Mesh(postGeometry, baseMaterial);
    mesh.position.set(x, y + 1.0, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);

    var topGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    var topMesh = new THREE.Mesh(topGeometry, baseMaterial);
    topMesh.position.set(x, y + 1.75, z);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    scene.add(topMesh);
    meshes.push(topMesh);

    return { base: baseMesh, post: mesh, top: topMesh };
  }

  function createSacrificialFirePit(x, y, z, scene) {
    var pitGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 16);
    var pitMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      metalness: 0.3,
      roughness: 0.8
    });
    var pitMesh = new THREE.Mesh(pitGeometry, pitMaterial);
    pitMesh.position.set(x, y, z);
    pitMesh.castShadow = true;
    pitMesh.receiveShadow = true;
    scene.add(pitMesh);
    meshes.push(pitMesh);

    var flamesGeometry = new THREE.SphereGeometry(0.6, 6, 6);
    var flamesMaterial = new THREE.MeshStandardMaterial({
      color: colors.fireYellow,
      emissive: colors.fireYellow,
      emissiveIntensity: 0.9,
      metalness: 0,
      roughness: 0.8
    });
    var flamesMesh = new THREE.Mesh(flamesGeometry, flamesMaterial);
    flamesMesh.position.set(x, y + 0.8, z);
    flamesMesh.scale.set(1, 1.5, 1);
    flamesMesh.flickerPhase = Math.random() * Math.PI * 2;
    scene.add(flamesMesh);
    meshes.push(flamesMesh);

    return { pit: pitMesh, flames: flamesMesh };
  }

  function createCultTent(x, y, z, scene) {
    var coneGeometry = new THREE.ConeGeometry(1, 2.5, 8);
    var tentMaterial = new THREE.MeshStandardMaterial({
      color: colors.cultRed,
      metalness: 0.1,
      roughness: 0.8
    });
    var tentMesh = new THREE.Mesh(coneGeometry, tentMaterial);
    tentMesh.position.set(x, y + 1.25, z);
    tentMesh.castShadow = true;
    tentMesh.receiveShadow = true;
    scene.add(tentMesh);
    meshes.push(tentMesh);

    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: colors.cooledLava,
      metalness: 0.4,
      roughness: 0.6
    });
    var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
    poleMesh.position.set(x, y + 1.25, z);
    poleMesh.castShadow = true;
    poleMesh.receiveShadow = true;
    scene.add(poleMesh);
    meshes.push(poleMesh);

    return { tent: tentMesh, pole: poleMesh };
  }

  function createCultGuard(x, y, z) {
    var guard = {
      x: x,
      y: y,
      z: z,
      vx: 0.5 + Math.random() * 0.3,
      vz: 0.5 + Math.random() * 0.3,
      patrolX1: x - 3,
      patrolX2: x + 3,
      patrolZ1: z - 2,
      patrolZ2: z + 2,
      direction: Math.random() > 0.5 ? 1 : -1,
      phaseX: 0,
      phaseZ: 0
    };
    guards.push(guard);
    return guard;
  }

  function createLavaPool(x, y, z, width, depth, scene) {
    var geometry = new THREE.BoxGeometry(width, 0.2, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.lava,
      emissive: colors.lava,
      emissiveIntensity: 0.5,
      metalness: 0.5,
      roughness: 0.3
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.ripplePhase = Math.random() * Math.PI * 2;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function init(scene, camera) {
    time = 0;
    meshes = [];
    particles = [];
    guards = [];
    animations = {};

    var lighting = new THREE.HemisphereLight(0xFF8800, 0x442200, 1.2);
    scene.add(lighting);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var ambientLight = new THREE.AmbientLight(0x664422, 0.4);
    scene.add(ambientLight);

    var floorGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: colors.cooledLava,
      metalness: 0.3,
      roughness: 0.7
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.3;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);

    createObsidianPlatform(0, 2, 0, 8, 1, 8, scene);
    createObsidianPlatform(15, 3, 5, 6, 1, 6, scene);
    createObsidianPlatform(-15, 2.5, -8, 7, 1, 7, scene);
    createObsidianPlatform(5, 4, -12, 5, 1, 5, scene);
    createObsidianPlatform(-8, 3, 12, 6, 1, 6, scene);

    createLavaChannel(0, 0.8, 8, 4, 0.4, 6, scene);
    createLavaChannel(8, 1, 5, 3.5, 0.4, 8, scene);
    createLavaChannel(-10, 0.9, -5, 5, 0.4, 5, scene);
    createLavaChannel(12, 1.1, -10, 3, 0.4, 7, scene);

    var cylinderGeometry = new THREE.CylinderGeometry(2, 3, 3, 16);
    var lavaMaterial = new THREE.MeshStandardMaterial({
      color: colors.lava,
      emissive: colors.lava,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.5
    });
    var lavaTube = new THREE.Mesh(cylinderGeometry, lavaMaterial);
    lavaTube.position.set(-20, 1, 0);
    lavaTube.castShadow = true;
    lavaTube.receiveShadow = true;
    scene.add(lavaTube);
    meshes.push(lavaTube);

    createFumaroleVent(10, 1.5, -15, scene);
    createFumaroleVent(-12, 1.8, 8, scene);
    createFumaroleVent(3, 1.2, 15, scene);

    createLavaFountain(25, 2, -5, scene);
    createLavaFountain(-25, 2, 10, scene);

    createVolcanicRockPillar(18, 1, 10, scene);
    createVolcanicRockPillar(-18, 1, -12, scene);
    createVolcanicRockPillar(22, 1, 2, scene);

    createRopeBeamCables(0, 2.5, 0, 15, 3.5, 5, scene);
    createRopeBridgePlanks(0, 2.5, 0, 15, 3.5, 5, 8, scene);

    createRopeBeamCables(-15, 2.5, -8, 5, 4, -12, scene);
    createRopeBridgePlanks(-15, 2.5, -8, 5, 4, -12, 6, scene);

    var altar = createRitualAltar(0, 0.5, -20, scene);
    animations.altar = altar;

    var firePit = createSacrificialFirePit(2, 0.5, -18, scene);
    animations.firePit = firePit;

    createCultTent(-5, 0.5, -22, scene);
    createCultTent(5, 0.5, -22, scene);
    createCultTent(-5, 0.5, -16, scene);

    createLavaPool(30, 0.6, -20, 12, 10, scene);
    createLavaPool(-30, 0.6, 15, 10, 8, scene);

    createCultGuard(-5, 1.5, -20);
    createCultGuard(5, 1.5, -20);
    createCultGuard(0, 3, 5);
    createCultGuard(15, 3.5, 5);

    camera.position.set(0, 5, 20);
    camera.lookAt(0, 2, 0);
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];

      if (mesh.lavaIntensity !== undefined) {
        var pulse = Math.sin(time * 3 + i * 0.5) * 0.3 + 0.7;
        mesh.material.emissiveIntensity = mesh.lavaIntensity * pulse;
      }

      if (mesh.crumbleIntensity !== undefined) {
        mesh.crumbleIntensity = Math.sin(time * 0.8 + i) * 0.05 + 1;
        mesh.scale.set(
          mesh.originalScale.x * mesh.crumbleIntensity,
          mesh.originalScale.y,
          mesh.originalScale.z * mesh.crumbleIntensity
        );
      }

      if (mesh.eruptionTimer !== undefined) {
        mesh.eruptionTimer -= delta;
        if (mesh.eruptionTimer <= 0) {
          createSteamParticles(mesh.position.x, mesh.position.y + 0.5, mesh.position.z, 12);
          mesh.eruptionTimer = mesh.eruptionCycle;
        }
      }

      if (mesh.fountainPhase !== undefined) {
        mesh.fountainPhase += delta * 2;
        var fountainBob = Math.sin(mesh.fountainPhase) * 0.5;
        mesh.position.y = 2 + fountainBob;
        if (Math.sin(mesh.fountainPhase) > 0.8) {
          createSteamParticles(mesh.position.x, mesh.position.y + 0.5, mesh.position.z, 3);
        }
      }

      if (mesh.swayPhase !== undefined) {
        var sway = Math.sin(time * 1.5 + mesh.swayPhase) * 0.2;
        mesh.position.y = mesh.originalY + sway;
      }

      if (mesh.ripplePhase !== undefined) {
        mesh.ripplePhase += delta * 2;
        var ripple = Math.sin(mesh.ripplePhase) * 0.05;
        mesh.position.y = mesh.position.y + ripple * 0.1;
      }
    }

    if (animations.firePit && animations.firePit.flames) {
      var flicker = Math.sin(time * 4.5) * 0.2 + 0.8;
      animations.firePit.flames.material.emissiveIntensity = flicker;
      animations.firePit.flames.scale.set(1, 1.5 + Math.sin(time * 3) * 0.3, 1);
    }

    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= 1.5 * delta;
      p.life -= delta / p.maxLife;

      if (p.life <= 0) {
        particles.splice(j, 1);
        j--;
      }
    }

    for (var k = 0; k < guards.length; k++) {
      var guard = guards[k];
      guard.phaseX += delta * guard.vx;
      guard.phaseZ += delta * guard.vz;

      guard.x = guard.patrolX1 + (guard.patrolX2 - guard.patrolX1) * (Math.sin(guard.phaseX) * 0.5 + 0.5);
      guard.z = guard.patrolZ1 + (guard.patrolZ2 - guard.patrolZ1) * (Math.sin(guard.phaseZ) * 0.5 + 0.5);
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      if (meshes[i].parent) {
        meshes[i].parent.remove(meshes[i]);
      }
    }
    meshes = [];
    particles = [];
    guards = [];
    animations = {};
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    meshes: meshes,
    particles: particles,
    guards: guards,
    time: time
  };
}());
