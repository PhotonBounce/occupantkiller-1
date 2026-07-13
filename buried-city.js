window.BuriedCity = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var materials = {};
  var particleSystems = [];
  var searchlights = [];
  var time = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    objects = [];
    particleSystems = [];
    searchlights = [];

    // Create materials with distinct colors
    materials.sand = new THREE.MeshStandardMaterial({ color: 0xC2A76B, roughness: 0.8, metalness: 0.1 });
    materials.stone = new THREE.MeshStandardMaterial({ color: 0x7A7A7A, roughness: 0.9, metalness: 0.0 });
    materials.rust = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85, metalness: 0.3 });
    materials.concrete = new THREE.MeshStandardMaterial({ color: 0x9E9E9E, roughness: 0.9, metalness: 0.1 });
    materials.tent = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.7, metalness: 0.0 });
    materials.metal = new THREE.MeshStandardMaterial({ color: 0x5A5A5A, roughness: 0.6, metalness: 0.8 });

    // Set up lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // SURFACE LEVEL STRUCTURES (y ~15 to 30)
    buildMainExcavationShaft();
    buildExcavationTentCluster();
    buildSandBerm1();
    buildSandBerm2();
    buildRuinedWallCluster();
    buildFountainPlaza();

    // MID-LEVEL STRUCTURES (y ~0 to 15)
    buildPartiallyBuriedMilitaryVehicle();
    buildLargeArtifactCrateCluster();
    buildUndergroundTunnelEntrance1();
    buildUndergroundTunnelEntrance2();
    buildSmallSpireRuin();
    buildBuriedCabin();

    // DEEP UNDERGROUND (y ~-20 to 0)
    buildDeepTunnelSystem();
    buildUndergroundChamber();
    buildBuriedVault();
    buildLadderShaft();

    // DYNAMIC ELEMENTS
    createSearchlightSystems();
    createSandParticleSystem();
    createDustCloudParticles();

    // Lighting elements
    addSearchlightToScene();
  }

  function buildMainExcavationShaft() {
    // Large central excavation shaft with cylindrical walls
    var shaftRadius = 12;
    var shaftHeight = 8;
    var shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 16);
    var shaftMesh = new THREE.Mesh(shaftGeometry, materials.concrete);
    shaftMesh.position.set(0, 12, 0);
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    scene.add(shaftMesh);
    objects.push(shaftMesh);

    // Ladder rungs (box segments inside shaft)
    for (var i = 0; i < 6; i++) {
      var rungY = 9 + (i * 1.2);
      var rung = new THREE.BoxGeometry(10, 0.3, 0.5);
      var rungMesh = new THREE.Mesh(rung, materials.metal);
      rungMesh.position.set(0, rungY, 0);
      rungMesh.castShadow = true;
      scene.add(rungMesh);
      objects.push(rungMesh);
    }
  }

  function buildExcavationTentCluster() {
    // Three expedition tents positioned around surface
    var tentPositions = [
      { x: -25, z: -20 },
      { x: 25, z: -15 },
      { x: -20, z: 25 }
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var pos = tentPositions[i];
      var tentBase = new THREE.BoxGeometry(6, 3, 6);
      var tentMesh = new THREE.Mesh(tentBase, materials.tent);
      tentMesh.position.set(pos.x, 16.5, pos.z);
      tentMesh.castShadow = true;
      tentMesh.receiveShadow = true;
      scene.add(tentMesh);
      objects.push(tentMesh);

      // Tent pole (cylinder)
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var poleMesh = new THREE.Mesh(poleGeom, materials.metal);
      poleMesh.position.set(pos.x, 18.5, pos.z);
      poleMesh.castShadow = true;
      scene.add(poleMesh);
      objects.push(poleMesh);
    }
  }

  function buildSandBerm1() {
    // Large sand embankment for cover
    var bermGeom = new THREE.BoxGeometry(20, 6, 8);
    var bermMesh = new THREE.Mesh(bermGeom, materials.sand);
    bermMesh.position.set(-30, 8, 10);
    bermMesh.castShadow = true;
    bermMesh.receiveShadow = true;
    scene.add(bermMesh);
    objects.push(bermMesh);

    // Top layer rounded with sphere
    var topGeom = new THREE.SphereGeometry(10, 8, 6);
    var topMesh = new THREE.Mesh(topGeom, materials.sand);
    topMesh.position.set(-30, 14, 10);
    topMesh.scale.set(1, 0.4, 0.6);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    scene.add(topMesh);
    objects.push(topMesh);
  }

  function buildSandBerm2() {
    // Second sand embankment on opposite side
    var bermGeom = new THREE.BoxGeometry(15, 5, 10);
    var bermMesh = new THREE.Mesh(bermGeom, materials.sand);
    bermMesh.position.set(35, 7, -15);
    bermMesh.castShadow = true;
    bermMesh.receiveShadow = true;
    scene.add(bermMesh);
    objects.push(bermMesh);

    // Mound cap
    var capGeom = new THREE.SphereGeometry(8, 6, 5);
    var capMesh = new THREE.Mesh(capGeom, materials.sand);
    capMesh.position.set(35, 12.5, -15);
    capMesh.scale.set(1, 0.35, 0.7);
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    scene.add(capMesh);
    objects.push(capMesh);
  }

  function buildRuinedWallCluster() {
    // Cluster of ruined walls for cover
    var wallPositions = [
      { x: -15, z: 35, w: 10, h: 4, d: 2 },
      { x: 15, z: 30, w: 8, h: 3.5, d: 2 },
      { x: 0, z: 40, w: 12, h: 3, d: 1.5 }
    ];

    for (var i = 0; i < wallPositions.length; i++) {
      var w = wallPositions[i];
      var wallGeom = new THREE.BoxGeometry(w.w, w.h, w.d);
      var wallMesh = new THREE.Mesh(wallGeom, materials.stone);
      wallMesh.position.set(w.x, w.h / 2 + 8, w.z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
      objects.push(wallMesh);
    }
  }

  function buildFountainPlaza() {
    // Circular plaza structure with fountain base
    var plazaGeom = new THREE.CylinderGeometry(14, 14, 0.5, 16);
    var plazaMesh = new THREE.Mesh(plazaGeom, materials.concrete);
    plazaMesh.position.set(0, 14.75, 0);
    plazaMesh.castShadow = true;
    plazaMesh.receiveShadow = true;
    scene.add(plazaMesh);
    objects.push(plazaMesh);

    // Central fountain basin
    var basinGeom = new THREE.CylinderGeometry(4, 5, 1.5, 12);
    var basinMesh = new THREE.Mesh(basinGeom, materials.stone);
    basinMesh.position.set(0, 16, 0);
    basinMesh.castShadow = true;
    scene.add(basinMesh);
    objects.push(basinMesh);

    // Fountain spout (cone)
    var spoutGeom = new THREE.ConeGeometry(1.5, 3, 8);
    var spoutMesh = new THREE.Mesh(spoutGeom, materials.metal);
    spoutMesh.position.set(0, 17.75, 0);
    spoutMesh.castShadow = true;
    scene.add(spoutMesh);
    objects.push(spoutMesh);
  }

  function buildPartiallyBuriedMilitaryVehicle() {
    // Military vehicle (jeep-like) mostly buried
    var bodyGeom = new THREE.BoxGeometry(3, 2, 6);
    var bodyMesh = new THREE.Mesh(bodyGeom, materials.rust);
    bodyMesh.position.set(28, 6, -35);
    bodyMesh.rotation.z = 0.15;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    scene.add(bodyMesh);
    objects.push(bodyMesh);

    // Wheels (spheres)
    for (var i = 0; i < 4; i++) {
      var wheelX = (i % 2) === 0 ? 1.8 : -1.8;
      var wheelZ = i < 2 ? -2 : 2;
      var wheelGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var wheelMesh = new THREE.Mesh(wheelGeom, materials.metal);
      wheelMesh.position.set(28 + wheelX, 5.2, -35 + wheelZ);
      wheelMesh.castShadow = true;
      scene.add(wheelMesh);
      objects.push(wheelMesh);
    }

    // Turret (cylinder on top)
    var turretGeom = new THREE.CylinderGeometry(1, 1, 1.2, 8);
    var turretMesh = new THREE.Mesh(turretGeom, materials.rust);
    turretMesh.position.set(28, 7.5, -35);
    turretMesh.castShadow = true;
    scene.add(turretMesh);
    objects.push(turretMesh);
  }

  function buildLargeArtifactCrateCluster() {
    // Stack of archaeological artifact crates
    var cratePositions = [
      { x: -35, z: 5, y: 2.5 },
      { x: -35, z: 5, y: 7.5 },
      { x: -40, z: 8, y: 2.5 },
      { x: -30, z: 3, y: 2.5 }
    ];

    for (var i = 0; i < cratePositions.length; i++) {
      var pos = cratePositions[i];
      var crateGeom = new THREE.BoxGeometry(3, 5, 3);
      var crateMesh = new THREE.Mesh(crateGeom, materials.rust);
      crateMesh.position.set(pos.x, pos.y, pos.z);
      crateMesh.castShadow = true;
      crateMesh.receiveShadow = true;
      scene.add(crateMesh);
      objects.push(crateMesh);
    }
  }

  function buildUndergroundTunnelEntrance1() {
    // Underground passage entrance with cylindrical tunnel
    var entranceGeom = new THREE.CylinderGeometry(3, 3, 2, 12);
    var entranceMesh = new THREE.Mesh(entranceGeom, materials.stone);
    entranceMesh.position.set(-20, 5, 5);
    entranceMesh.castShadow = true;
    scene.add(entranceMesh);
    objects.push(entranceMesh);

    // Tunnel extending down (cylinder rotated)
    var tunnelGeom = new THREE.CylinderGeometry(2.8, 2.8, 15, 12);
    var tunnelMesh = new THREE.Mesh(tunnelGeom, materials.concrete);
    tunnelMesh.position.set(-20, -5, 5);
    tunnelMesh.castShadow = true;
    scene.add(tunnelMesh);
    objects.push(tunnelMesh);
  }

  function buildUndergroundTunnelEntrance2() {
    // Second tunnel entrance on opposite side
    var entranceGeom = new THREE.CylinderGeometry(3, 3, 2, 12);
    var entranceMesh = new THREE.Mesh(entranceGeom, materials.stone);
    entranceMesh.position.set(20, 3, -20);
    entranceMesh.castShadow = true;
    scene.add(entranceMesh);
    objects.push(entranceMesh);

    // Connecting tunnel (cylinder)
    var tunnelGeom = new THREE.CylinderGeometry(2.8, 2.8, 12, 12);
    var tunnelMesh = new THREE.Mesh(tunnelGeom, materials.concrete);
    tunnelMesh.position.set(20, -4, -20);
    tunnelMesh.castShadow = true;
    scene.add(tunnelMesh);
    objects.push(tunnelMesh);
  }

  function buildSmallSpireRuin() {
    // Broken tower spire poking above sand
    var spireGeom = new THREE.CylinderGeometry(1.2, 1.5, 12, 8);
    var spireMesh = new THREE.Mesh(spireGeom, materials.stone);
    spireMesh.position.set(10, 6, 15);
    spireMesh.castShadow = true;
    spireMesh.receiveShadow = true;
    scene.add(spireMesh);
    objects.push(spireMesh);

    // Top cap (cone)
    var capGeom = new THREE.ConeGeometry(1.3, 2.5, 8);
    var capMesh = new THREE.Mesh(capGeom, materials.stone);
    capMesh.position.set(10, 13, 15);
    capMesh.castShadow = true;
    scene.add(capMesh);
    objects.push(capMesh);
  }

  function buildBuriedCabin() {
    // Partially submerged wooden structure
    var cabinGeom = new THREE.BoxGeometry(8, 4, 6);
    var cabinMesh = new THREE.Mesh(cabinGeom, materials.rust);
    cabinMesh.position.set(-10, 3, -25);
    cabinMesh.castShadow = true;
    cabinMesh.receiveShadow = true;
    scene.add(cabinMesh);
    objects.push(cabinMesh);

    // Roof (cone)
    var roofGeom = new THREE.ConeGeometry(5, 3, 4);
    var roofMesh = new THREE.Mesh(roofGeom, materials.rust);
    roofMesh.position.set(-10, 6.5, -25);
    roofMesh.castShadow = true;
    scene.add(roofMesh);
    objects.push(roofMesh);
  }

  function buildDeepTunnelSystem() {
    // Deep underground tunnel network
    var tunnelPositions = [
      { x: -15, z: 0 },
      { x: 15, z: 0 },
      { x: 0, z: -15 },
      { x: 0, z: 15 }
    ];

    for (var i = 0; i < tunnelPositions.length; i++) {
      var pos = tunnelPositions[i];
      var tunnelGeom = new THREE.CylinderGeometry(2.5, 2.5, 20, 10);
      var tunnelMesh = new THREE.Mesh(tunnelGeom, materials.concrete);
      tunnelMesh.position.set(pos.x, -10, pos.z);
      tunnelMesh.castShadow = true;
      scene.add(tunnelMesh);
      objects.push(tunnelMesh);
    }
  }

  function buildUndergroundChamber() {
    // Large chamber with columns
    var chamberGeom = new THREE.BoxGeometry(15, 6, 15);
    var chamberMesh = new THREE.Mesh(chamberGeom, materials.stone);
    chamberMesh.position.set(0, -17, 0);
    chamberMesh.castShadow = true;
    chamberMesh.receiveShadow = true;
    scene.add(chamberMesh);
    objects.push(chamberMesh);

    // Support columns (cylinders)
    var columnPositions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 }
    ];

    for (var i = 0; i < columnPositions.length; i++) {
      var pos = columnPositions[i];
      var colGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
      var colMesh = new THREE.Mesh(colGeom, materials.concrete);
      colMesh.position.set(pos.x, -14, pos.z);
      colMesh.castShadow = true;
      scene.add(colMesh);
      objects.push(colMesh);
    }
  }

  function buildBuriedVault() {
    // Buried vault structure with spherical door
    var vaultGeom = new THREE.BoxGeometry(8, 6, 8);
    var vaultMesh = new THREE.Mesh(vaultGeom, materials.metal);
    vaultMesh.position.set(25, -14, 25);
    vaultMesh.castShadow = true;
    scene.add(vaultMesh);
    objects.push(vaultMesh);

    // Vault door (sphere)
    var doorGeom = new THREE.SphereGeometry(3.5, 8, 8);
    var doorMesh = new THREE.Mesh(doorGeom, materials.metal);
    doorMesh.position.set(25, -14, 29.5);
    doorMesh.castShadow = true;
    scene.add(doorMesh);
    objects.push(doorMesh);
  }

  function buildLadderShaft() {
    // Vertical shaft connecting surface to underground with ladder
    var shaftGeom = new THREE.CylinderGeometry(2.5, 2.5, 30, 8);
    var shaftMesh = new THREE.Mesh(shaftGeom, materials.concrete);
    shaftMesh.position.set(-35, -5, 25);
    shaftMesh.castShadow = true;
    scene.add(shaftMesh);
    objects.push(shaftMesh);

    // Ladder rungs (box segments)
    for (var i = 0; i < 10; i++) {
      var rungY = 10 - (i * 3);
      var rungGeom = new THREE.BoxGeometry(4.5, 0.2, 0.4);
      var rungMesh = new THREE.Mesh(rungGeom, materials.metal);
      rungMesh.position.set(-35, rungY, 25);
      rungMesh.castShadow = true;
      scene.add(rungMesh);
      objects.push(rungMesh);
    }
  }

  function createSearchlightSystems() {
    // Searchlight positions around the map
    searchlights = [
      { x: -30, y: 25, z: -30, targetX: 10, targetZ: 10, angle: 0 },
      { x: 30, y: 25, z: 30, targetX: -10, targetZ: -10, angle: Math.PI },
      { x: -40, y: 20, z: 10, targetX: 20, targetZ: -20, angle: Math.PI / 2 }
    ];

    for (var i = 0; i < searchlights.length; i++) {
      var light = searchlights[i];

      // Searchlight housing (cylinder)
      var housingGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
      var housingMesh = new THREE.Mesh(housingGeom, materials.metal);
      housingMesh.position.set(light.x, light.y, light.z);
      housingMesh.castShadow = true;
      scene.add(housingMesh);
      objects.push(housingMesh);

      // Reflector dish (cone shape)
      var reflectorGeom = new THREE.ConeGeometry(2, 1.5, 12);
      var reflectorMesh = new THREE.Mesh(reflectorGeom, materials.metal);
      reflectorMesh.position.set(light.x, light.y + 1.5, light.z);
      reflectorMesh.rotation.z = Math.PI;
      reflectorMesh.castShadow = true;
      scene.add(reflectorMesh);
      objects.push(reflectorMesh);

      // Spotlight light object
      var spotlight = new THREE.SpotLight(0xFFFFFF, 0.8, 100, Math.PI / 4, 0.5, 1);
      spotlight.position.set(light.x, light.y + 1, light.z);
      spotlight.target.position.set(light.targetX, 8, light.targetZ);
      scene.add(spotlight);
      scene.add(spotlight.target);
      light.light = spotlight;
    }
  }

  function addSearchlightToScene() {
    // Create a spotlight that rotates
    var staticSpotlight = new THREE.SpotLight(0xFFFFFF, 0.6, 80, Math.PI / 5, 0.4, 1);
    staticSpotlight.position.set(0, 30, 0);
    staticSpotlight.target.position.set(0, 10, 0);
    scene.add(staticSpotlight);
    scene.add(staticSpotlight.target);
  }

  function createSandParticleSystem() {
    // Sand particle system
    var particleCount = 500;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);
    var velocities = [];

    for (var i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random() * 80 - 40;
      positions[i * 3 + 1] = Math.random() * 40 - 20;
      positions[i * 3 + 2] = Math.random() * 80 - 40;

      velocities.push({
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.1 - 0.02,
        z: (Math.random() - 0.5) * 0.05
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      color: 0xC2A76B,
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6
    });

    var particles = new THREE.Points(geometry, material);
    scene.add(particles);

    particleSystems.push({
      mesh: particles,
      velocities: velocities,
      geometry: geometry
    });
  }

  function createDustCloudParticles() {
    // Dust cloud system
    var dustCount = 300;
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(dustCount * 3);
    var velocities = [];

    for (var i = 0; i < dustCount; i++) {
      positions[i * 3] = Math.random() * 60 - 30;
      positions[i * 3 + 1] = Math.random() * 20 + 5;
      positions[i * 3 + 2] = Math.random() * 60 - 30;

      velocities.push({
        x: Math.sin(i) * 0.01,
        y: 0.001,
        z: Math.cos(i) * 0.01
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.PointsMaterial({
      color: 0xA89968,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4
    });

    var dustCloud = new THREE.Points(geometry, material);
    scene.add(dustCloud);

    particleSystems.push({
      mesh: dustCloud,
      velocities: velocities,
      geometry: geometry
    });
  }

  function update(delta) {
    time += delta;

    // Update searchlight rotations and flickering
    for (var i = 0; i < searchlights.length; i++) {
      var light = searchlights[i];
      var rotation = time * 0.5 + (i * Math.PI / 1.5);

      var targetRadius = 20;
      light.light.target.position.x = Math.cos(rotation) * targetRadius + light.x;
      light.light.target.position.z = Math.sin(rotation) * targetRadius + light.z;

      // Flickering effect
      var flicker = 0.7 + Math.sin(time * 3 + i) * 0.15 + Math.random() * 0.1;
      light.light.intensity = Math.max(0.3, Math.min(1, flicker));
    }

    // Update sand particles
    if (particleSystems.length > 0) {
      var sandSystem = particleSystems[0];
      var positions = sandSystem.geometry.attributes.position.array;

      for (var i = 0; i < sandSystem.velocities.length; i++) {
        var vel = sandSystem.velocities[i];
        positions[i * 3] += vel.x;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += vel.z;

        // Wrap around
        if (positions[i * 3] > 40) positions[i * 3] = -40;
        if (positions[i * 3] < -40) positions[i * 3] = 40;
        if (positions[i * 3 + 1] < -20) positions[i * 3 + 1] = 20;
        if (positions[i * 3 + 2] > 40) positions[i * 3 + 2] = -40;
        if (positions[i * 3 + 2] < -40) positions[i * 3 + 2] = 40;
      }

      sandSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Update dust clouds with swirling motion
    if (particleSystems.length > 1) {
      var dustSystem = particleSystems[1];
      var dustPositions = dustSystem.geometry.attributes.position.array;

      for (var i = 0; i < dustSystem.velocities.length; i++) {
        var vel = dustSystem.velocities[i];
        dustPositions[i * 3] += vel.x + Math.sin(time + i) * 0.002;
        dustPositions[i * 3 + 1] += vel.y;
        dustPositions[i * 3 + 2] += vel.z + Math.cos(time + i) * 0.002;

        // Wrap around
        if (dustPositions[i * 3] > 30) dustPositions[i * 3] = -30;
        if (dustPositions[i * 3] < -30) dustPositions[i * 3] = 30;
        if (dustPositions[i * 3 + 2] > 30) dustPositions[i * 3 + 2] = -30;
        if (dustPositions[i * 3 + 2] < -30) dustPositions[i * 3 + 2] = 30;
      }

      dustSystem.geometry.attributes.position.needsUpdate = true;
    }

    // Subtle object animations
    for (var i = 0; i < Math.min(objects.length, 3); i++) {
      if (objects[i]) {
        objects[i].rotation.y += 0.0001 * delta;
      }
    }
  }

  function reset() {
    // Clear the scene
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    for (var i = particleSystems.length - 1; i >= 0; i--) {
      scene.remove(particleSystems[i].mesh);
    }
    for (var i = searchlights.length - 1; i >= 0; i--) {
      scene.remove(searchlights[i].light);
      scene.remove(searchlights[i].light.target);
    }

    objects = [];
    particleSystems = [];
    searchlights = [];
    time = 0;

    // Reinitialize
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
