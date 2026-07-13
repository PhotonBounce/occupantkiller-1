window.CrystalCaves = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var animationStates = {};

  function createCrystalSpire(x, y, z) {
    var geometry = new THREE.ConeGeometry(2, 12, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x88AAFF,
      emissive: 0x88AAFF,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    var spire = new THREE.Mesh(geometry, material);
    spire.position.set(x, y, z);
    spire.castShadow = true;
    spire.receiveShadow = true;
    scene.add(spire);

    animationStates[objects.length] = { type: 'spire', mesh: spire, time: 0 };
    objects.push(spire);

    return spire;
  }

  function createStalactite(x, y, z) {
    var geometry = new THREE.ConeGeometry(1.5, 8, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0xAABBFF,
      emissive: 0xAABBFF,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.3
    });
    var stalactite = new THREE.Mesh(geometry, material);
    stalactite.position.set(x, y, z);
    stalactite.rotation.z = Math.PI;
    stalactite.castShadow = true;
    stalactite.receiveShadow = true;
    scene.add(stalactite);

    objects.push(stalactite);
    return stalactite;
  }

  function createAmethystCluster(x, y, z) {
    var geometry = new THREE.SphereGeometry(2, 16, 16);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8844AA,
      emissive: 0x8844AA,
      emissiveIntensity: 0.6,
      metalness: 0.6,
      roughness: 0.4
    });
    var amethyst = new THREE.Mesh(geometry, material);
    amethyst.position.set(x, y, z);
    amethyst.castShadow = true;
    amethyst.receiveShadow = true;
    scene.add(amethyst);

    animationStates[objects.length] = { type: 'amethyst', mesh: amethyst, time: 0 };
    objects.push(amethyst);

    return amethyst;
  }

  function createEmeraldWall(x, y, z, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: 0x224422,
      emissive: 0x00FF44,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.5
    });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    objects.push(wall);
    return wall;
  }

  function createRubyCrystal(x, y, z) {
    var geometry = new THREE.SphereGeometry(1.8, 14, 14);
    var material = new THREE.MeshStandardMaterial({
      color: 0xAA2222,
      emissive: 0xAA2222,
      emissiveIntensity: 0.7,
      metalness: 0.7,
      roughness: 0.3
    });
    var ruby = new THREE.Mesh(geometry, material);
    ruby.position.set(x, y, z);
    ruby.castShadow = true;
    ruby.receiveShadow = true;
    scene.add(ruby);

    animationStates[objects.length] = { type: 'ruby', mesh: ruby, time: 0 };
    objects.push(ruby);

    return ruby;
  }

  function createCrystalLake(x, y, z) {
    var geometry = new THREE.BoxGeometry(30, 2, 40);
    var material = new THREE.MeshStandardMaterial({
      color: 0x2244CC,
      emissive: 0x2244CC,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    var lake = new THREE.Mesh(geometry, material);
    lake.position.set(x, y, z);
    lake.castShadow = true;
    lake.receiveShadow = true;
    scene.add(lake);

    animationStates[objects.length] = { type: 'lake', mesh: lake, time: 0 };
    objects.push(lake);

    return lake;
  }

  function createCavePillar(x, y, z) {
    var geometry = new THREE.CylinderGeometry(2.5, 2.5, 10, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x99AACC,
      emissive: 0x99AACC,
      emissiveIntensity: 0.3,
      metalness: 0.6,
      roughness: 0.4
    });
    var pillar = new THREE.Mesh(geometry, material);
    pillar.position.set(x, y, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);

    objects.push(pillar);
    return pillar;
  }

  function createEnergyCore(x, y, z) {
    var geometry = new THREE.SphereGeometry(3, 20, 20);
    var material = new THREE.MeshStandardMaterial({
      color: 0xFFFFAA,
      emissive: 0xFFFFAA,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.1
    });
    var core = new THREE.Mesh(geometry, material);
    core.position.set(x, y, z);
    core.castShadow = true;
    core.receiveShadow = true;
    scene.add(core);

    animationStates[objects.length] = { type: 'core', mesh: core, time: 0 };
    objects.push(core);

    return core;
  }

  function createMiningDrill(x, y, z) {
    var drillGroup = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(4, 2, 2);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x666655,
      metalness: 0.5,
      roughness: 0.6
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    drillGroup.add(base);

    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x666655,
      metalness: 0.6,
      roughness: 0.5
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 3, 0);
    barrel.rotation.z = Math.PI / 4;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    drillGroup.add(barrel);

    drillGroup.position.set(x, y, z);
    scene.add(drillGroup);

    objects.push(drillGroup);
    return drillGroup;
  }

  function createWeaponCache(x, y, z) {
    var geometry = new THREE.BoxGeometry(3, 3, 2);
    var material = new THREE.MeshStandardMaterial({
      color: 0x884488,
      emissive: 0x884488,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    var cache = new THREE.Mesh(geometry, material);
    cache.position.set(x, y, z);
    cache.castShadow = true;
    cache.receiveShadow = true;
    scene.add(cache);

    objects.push(cache);
    return cache;
  }

  function createBioluminescentFungi(x, y, z) {
    var geometry = new THREE.SphereGeometry(1, 10, 10);
    var material = new THREE.MeshStandardMaterial({
      color: 0x00FF88,
      emissive: 0x00FF88,
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.8
    });
    var fungi = new THREE.Mesh(geometry, material);
    fungi.position.set(x, y, z);
    fungi.castShadow = true;
    fungi.receiveShadow = true;
    scene.add(fungi);

    animationStates[objects.length] = { type: 'fungi', mesh: fungi, time: 0 };
    objects.push(fungi);

    return fungi;
  }

  function createCrystalRiver(x, y, z) {
    var geometry = new THREE.BoxGeometry(6, 1, 50);
    var material = new THREE.MeshStandardMaterial({
      color: 0x0088CC,
      emissive: 0x0088CC,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    var river = new THREE.Mesh(geometry, material);
    river.position.set(x, y, z);
    river.castShadow = true;
    river.receiveShadow = true;
    scene.add(river);

    objects.push(river);
    return river;
  }

  function createArchway(x, y, z) {
    var geometry = new THREE.CylinderGeometry(5, 5, 1, 16);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8899CC,
      emissive: 0x8899CC,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.4
    });
    var archway = new THREE.Mesh(geometry, material);
    archway.position.set(x, y, z);
    archway.castShadow = true;
    archway.receiveShadow = true;
    scene.add(archway);

    objects.push(archway);
    return archway;
  }

  function createSpikeTrap(x, y, z) {
    var geometry = new THREE.ConeGeometry(3, 5, 6);
    var material = new THREE.MeshStandardMaterial({
      color: 0x99BBFF,
      emissive: 0x99BBFF,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    var spike = new THREE.Mesh(geometry, material);
    spike.position.set(x, y, z);
    spike.castShadow = true;
    spike.receiveShadow = true;
    scene.add(spike);

    objects.push(spike);
    return spike;
  }

  function createCeilingFormation(x, y, z) {
    var geometry = new THREE.BoxGeometry(8, 3, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x6B5D4F,
      emissive: 0x4A4238,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.7
    });
    var formation = new THREE.Mesh(geometry, material);
    formation.position.set(x, y, z);
    formation.castShadow = true;
    formation.receiveShadow = true;
    scene.add(formation);

    objects.push(formation);
    return formation;
  }

  function init(sceneParam, camera) {
    scene = sceneParam;
    objects = [];
    animationStates = {};

    // Add lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var pointLight1 = new THREE.PointLight(0x88AAFF, 1, 100);
    pointLight1.position.set(0, 15, 0);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0x00FF88, 0.8, 80);
    pointLight2.position.set(20, 10, 20);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    var pointLight3 = new THREE.PointLight(0xFFFFAA, 1.2, 90);
    pointLight3.position.set(-15, 20, -15);
    pointLight3.castShadow = true;
    scene.add(pointLight3);

    // Create crystal cave geometry (15+ distinct objects)
    createCrystalSpire(-10, 5, 0);
    createCrystalSpire(10, 6, -5);
    createCrystalSpire(5, 5, 15);
    createCrystalSpire(-8, 4, 20);

    createStalactite(0, 25, 0);
    createStalactite(15, 26, 10);
    createStalactite(-12, 25, -8);

    createAmethystCluster(-5, 8, -15);
    createAmethystCluster(8, 10, 5);
    createAmethystCluster(-15, 6, 10);

    createEmeraldWall(20, 8, 0, 8, 12, 2);
    createEmeraldWall(-20, 8, 0, 8, 12, 2);

    createRubyCrystal(0, 6, -20);
    createRubyCrystal(12, 7, -12);
    createRubyCrystal(-12, 6, 15);

    createCrystalLake(0, -2, 0);

    createCavePillar(8, 10, -10);
    createCavePillar(-8, 10, 10);
    createCavePillar(15, 10, 5);

    createEnergyCore(0, 15, 0);

    createMiningDrill(25, 1, 0);
    createMiningDrill(-25, 1, 0);

    createWeaponCache(18, 2, -15);
    createWeaponCache(-18, 2, 15);

    createBioluminescentFungi(10, 5, 10);
    createBioluminescentFungi(-10, 6, -10);
    createBioluminescentFungi(0, 4, 20);

    createCrystalRiver(0, 0, 0);

    createArchway(0, 12, -25);

    createSpikeTrap(20, 2, -20);
    createSpikeTrap(-20, 2, 20);

    createCeilingFormation(0, 23, 0);

    return true;
  }

  function update(delta) {
    var time = delta || 0;

    for (var key in animationStates) {
      if (animationStates.hasOwnProperty(key)) {
        var state = animationStates[key];
        state.time += time;

        switch (state.type) {
          case 'spire':
            var spireIntensity = 0.3 + 0.4 * Math.sin(state.time * 2);
            state.mesh.material.emissiveIntensity = Math.max(0.1, spireIntensity);
            break;

          case 'core':
            state.mesh.rotation.y += time * 0.5;
            var coreIntensity = 0.6 + 0.4 * Math.sin(state.time * 1.5);
            state.mesh.material.emissiveIntensity = Math.max(0.5, coreIntensity);
            break;

          case 'amethyst':
            var amethystIntensity = 0.4 + 0.3 * Math.sin(state.time * 1.8);
            state.mesh.material.emissiveIntensity = Math.max(0.2, amethystIntensity);
            break;

          case 'ruby':
            var rubyIntensity = 0.5 + 0.3 * Math.sin(state.time * 2.2);
            state.mesh.material.emissiveIntensity = Math.max(0.3, rubyIntensity);
            break;

          case 'fungi':
            var scale = 1 + 0.15 * Math.sin(state.time * 2.5);
            state.mesh.scale.y = scale;
            var fungiFxIntensity = 0.6 + 0.3 * Math.sin(state.time * 2);
            state.mesh.material.emissiveIntensity = Math.max(0.4, fungiFxIntensity);
            break;

          case 'lake':
            var lakeIntensity = 0.3 + 0.35 * Math.sin(state.time * 1.2);
            state.mesh.material.emissiveIntensity = Math.max(0.2, lakeIntensity);
            break;

          default:
            break;
        }
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animationStates = {};
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
