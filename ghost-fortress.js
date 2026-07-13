window.GhostFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var structures = [];
  var ghostLights = [];
  var mistParticles = [];
  var time = 0;
  var fogWisps = [];

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;

    // Scene setup
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x1a2d4d, 40, 120);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x2d5a3d, 0.3);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0x4a7c59, 0.4);
    directionalLight.position.set(30, 25, 20);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Ground
    var groundGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    structures.push(ground);

    // Main fortress walls
    createWallSegment(-30, 2, 0, 20, 4, 1);
    createWallSegment(30, 2, 0, 20, 4, 1);
    createWallSegment(0, 2, -30, 1, 4, 20);
    createWallSegment(0, 2, 30, 1, 4, 20);

    // Corner towers
    createTower(-25, 8, -25);
    createTower(25, 8, -25);
    createTower(-25, 8, 25);
    createTower(25, 8, 25);

    // Collapsed tower in center
    createCollapsedTower(0, 0, 0);

    // Fallen columns (cover objects)
    createFallenColumn(-15, 0, -10, 0.3, 8, 0.3);
    createFallenColumn(15, 0, 10, 0.3, 8, 0.3);
    createFallenColumn(-20, 0, 15, 0.25, 6, 0.25);

    // Catwalks
    createCatwalk(-20, 5, -20);
    createCatwalk(20, 5, 20);

    // Drawbridge remains
    createDrawbridgeRemains(-10, 1, 0);

    // Rubble piles
    createRubblePile(-15, 0.5, 20);
    createRubblePile(18, 0.5, -18);
    createRubblePile(25, 0.5, 0);

    // Cannon remains
    createCannon(-22, 2, -15);
    createCannon(22, 2, 15);

    // Iron gate remnants
    createGateSegment(-2, 3, -28);
    createGateSegment(2, 3, -28);

    // Catacomb entrance
    createCatacombEntrance(0, 0, -32);

    // Ghost lights
    createGhostLights();

    // Mist particles
    createMistParticles();

    // Fog wisps
    createFogWisps();

    return {
      structures: structures,
      ghostLights: ghostLights,
      mistParticles: mistParticles,
      fogWisps: fogWisps
    };
  }

  function createWallSegment(x, y, z, width, height, depth) {
    var wallGeometry = new THREE.BoxGeometry(width, height, depth);
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4d5c4d });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    structures.push(wall);
  }

  function createTower(x, y, z) {
    // Main cylinder tower
    var towerGeometry = new THREE.CylinderGeometry(3, 3.5, y, 8);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(x, y / 2, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    scene.add(tower);
    structures.push(tower);

    // Damaged crenellations
    var creneGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
    var creneMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });

    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var creneX = x + Math.cos(angle) * 3.2;
      var creneZ = z + Math.sin(angle) * 3.2;
      var crene = new THREE.Mesh(creneGeometry, creneMaterial);
      crene.position.set(creneX, y + 1, creneZ);
      crene.castShadow = true;
      scene.add(crene);
      structures.push(crene);
    }
  }

  function createCollapsedTower(x, y, z) {
    // Multiple broken cylinder pieces
    var piece1Geometry = new THREE.CylinderGeometry(2.5, 2.8, 3, 8);
    var pieceMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
    var piece1 = new THREE.Mesh(piece1Geometry, pieceMaterial);
    piece1.position.set(x - 2, y + 1.5, z + 1);
    piece1.rotation.z = 0.3;
    piece1.castShadow = true;
    scene.add(piece1);
    structures.push(piece1);

    var piece2Geometry = new THREE.CylinderGeometry(2.2, 2.5, 2.5, 8);
    var piece2 = new THREE.Mesh(piece2Geometry, pieceMaterial);
    piece2.position.set(x + 3, y + 0.8, z - 2);
    piece2.rotation.z = -0.4;
    piece2.castShadow = true;
    scene.add(piece2);
    structures.push(piece2);

    var piece3Geometry = new THREE.CylinderGeometry(1.8, 2.2, 2, 8);
    var piece3 = new THREE.Mesh(piece3Geometry, pieceMaterial);
    piece3.position.set(x, y + 0.5, z - 3);
    piece3.rotation.z = 0.5;
    piece3.castShadow = true;
    scene.add(piece3);
    structures.push(piece3);
  }

  function createFallenColumn(x, y, z, width, length, depth) {
    var colGeometry = new THREE.CylinderGeometry(width, width, length, 6);
    var colMaterial = new THREE.MeshLambertMaterial({ color: 0x6d7d6d });
    var column = new THREE.Mesh(colGeometry, colMaterial);
    column.position.set(x, y + length / 2, z);
    column.rotation.z = Math.PI / 2.2;
    column.castShadow = true;
    column.receiveShadow = true;
    scene.add(column);
    structures.push(column);
  }

  function createCatwalk(x, y, z) {
    // Catwalk platform
    var catGeometry = new THREE.BoxGeometry(8, 0.4, 3);
    var catMaterial = new THREE.MeshLambertMaterial({ color: 0x5a7a5a });
    var catwalk = new THREE.Mesh(catGeometry, catMaterial);
    catwalk.position.set(x, y, z);
    catwalk.castShadow = true;
    catwalk.receiveShadow = true;
    scene.add(catwalk);
    structures.push(catwalk);

    // Railing posts
    for (var i = -3; i <= 3; i++) {
      var railGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 4);
      var railMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
      var rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(x + i * 1.5, y + 1, z + 1.2);
      rail.castShadow = true;
      scene.add(rail);
      structures.push(rail);
    }
  }

  function createDrawbridgeRemains(x, y, z) {
    var bridgeGeometry = new THREE.BoxGeometry(6, 0.5, 3);
    var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5d3d });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(x, y + 2, z);
    bridge.rotation.z = 0.3;
    bridge.castShadow = true;
    scene.add(bridge);
    structures.push(bridge);

    // Chain remnants
    var chainGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 4);
    var chainMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });

    var chain1 = new THREE.Mesh(chainGeometry, chainMaterial);
    chain1.position.set(x - 2.5, y + 3, z);
    chain1.castShadow = true;
    scene.add(chain1);
    structures.push(chain1);

    var chain2 = new THREE.Mesh(chainGeometry, chainMaterial);
    chain2.position.set(x + 2.5, y + 3, z);
    chain2.castShadow = true;
    scene.add(chain2);
    structures.push(chain2);
  }

  function createRubblePile(x, y, z) {
    var rubbleCount = 4 + Math.floor(Math.random() * 3);
    for (var i = 0; i < rubbleCount; i++) {
      var size = 0.5 + Math.random() * 0.8;
      var rubbleGeometry = new THREE.BoxGeometry(size, size * 0.6, size * 0.9);
      var rubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
      var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
      rubble.position.set(
        x + (Math.random() - 0.5) * 3,
        y + i * 0.6 + Math.random() * 0.3,
        z + (Math.random() - 0.5) * 3
      );
      rubble.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      structures.push(rubble);
    }
  }

  function createCannon(x, y, z) {
    // Cannon barrel (cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.35, 4, 6);
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
    var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
    barrel.position.set(x, y + 1, z);
    barrel.rotation.z = 0.2;
    barrel.castShadow = true;
    scene.add(barrel);
    structures.push(barrel);

    // Cannon base (sphere)
    var baseGeometry = new THREE.SphereGeometry(0.8, 6, 6);
    var base = new THREE.Mesh(baseGeometry, metalMaterial);
    base.position.set(x, y, z);
    base.castShadow = true;
    scene.add(base);
    structures.push(base);

    // Wheel
    var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8);
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
    var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x - 1.2, y - 0.5, z);
    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    scene.add(wheel);
    structures.push(wheel);
  }

  function createGateSegment(x, y, z) {
    var gateGeometry = new THREE.BoxGeometry(1, 5, 0.2);
    var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(x, y, z);
    gate.castShadow = true;
    scene.add(gate);
    structures.push(gate);

    // Decorative spikes
    var spikeGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
    var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });

    for (var i = 0; i < 8; i++) {
      var spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spike.position.set(x, y + 1 + i * 0.5, z - 0.15);
      spike.castShadow = true;
      scene.add(spike);
      structures.push(spike);
    }
  }

  function createCatacombEntrance(x, y, z) {
    // Arched entrance structure using cone and box
    var archGeometry = new THREE.ConeGeometry(3, 5, 6);
    var archMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(x, y + 2.5, z);
    arch.castShadow = true;
    scene.add(arch);
    structures.push(arch);

    // Door frame
    var frameGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.3);
    var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y + 1.5, z - 0.2);
    frame.castShadow = true;
    scene.add(frame);
    structures.push(frame);

    // Door opening (darker)
    var doorGeometry = new THREE.BoxGeometry(2.2, 3.2, 0.1);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y + 1.5, z - 0.3);
    scene.add(door);
    structures.push(door);
  }

  function createGhostLights() {
    var lightPositions = [
      [-20, 4, -20],
      [20, 5, 20],
      [-15, 3, 15],
      [15, 6, -15],
      [0, 7, -25],
      [-25, 3, 10],
      [25, 4, -10]
    ];

    for (var i = 0; i < lightPositions.length; i++) {
      var pos = lightPositions[i];
      var light = {
        position: new THREE.Vector3(pos[0], pos[1], pos[2]),
        intensity: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        object: null,
        glow: null
      };

      // Create visible light sphere
      var sphereGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x4dff4d });
      var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.copy(light.position);
      scene.add(sphere);
      light.object = sphere;

      // Create glow effect
      var glowGeometry = new THREE.SphereGeometry(1.5, 4, 4);
      var glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x4dff4d,
        transparent: true,
        opacity: 0.15
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(light.position);
      scene.add(glow);
      light.glow = glow;

      ghostLights.push(light);
    }
  }

  function createMistParticles() {
    var particleCount = 300;
    var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var material = new THREE.MeshBasicMaterial({
      color: 0x2d5a4d,
      transparent: true,
      opacity: 0.1
    });

    for (var i = 0; i < particleCount; i++) {
      var particle = new THREE.Mesh(geometry, material.clone());
      particle.position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 15,
        (Math.random() - 0.5) * 80
      );
      particle.scale.set(
        1 + Math.random() * 2,
        0.5 + Math.random(),
        1 + Math.random() * 2
      );
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.1,
        (Math.random() - 0.5) * 0.5
      );
      particle.life = Math.random();
      scene.add(particle);
      mistParticles.push(particle);
    }
  }

  function createFogWisps() {
    var wispCount = 12;

    for (var i = 0; i < wispCount; i++) {
      var wisp = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 80,
          2 + Math.random() * 8,
          (Math.random() - 0.5) * 80
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.3
        ),
        scale: 2 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
        objects: []
      };

      // Create wisp with multiple spheres
      for (var j = 0; j < 5; j++) {
        var sphereGeometry = new THREE.SphereGeometry(0.4, 4, 4);
        var sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0x3d6d5d,
          transparent: true,
          opacity: 0.08
        });
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
          wisp.position.x + (Math.random() - 0.5) * 2,
          wisp.position.y + (Math.random() - 0.5) * 2,
          wisp.position.z + (Math.random() - 0.5) * 2
        );
        scene.add(sphere);
        wisp.objects.push(sphere);
      }

      fogWisps.push(wisp);
    }
  }

  function update(delta) {
    time += delta;

    // Update ghost lights
    for (var i = 0; i < ghostLights.length; i++) {
      var light = ghostLights[i];
      light.phase += light.speed * delta;
      light.intensity = 0.3 + Math.sin(light.phase) * 0.4;

      if (light.object) {
        light.object.material.opacity = light.intensity;
      }
      if (light.glow) {
        light.glow.material.opacity = light.intensity * 0.15;
      }

      // Slight bob motion
      light.object.position.y = light.position.y + Math.sin(time * light.speed) * 0.5;
    }

    // Update mist particles
    for (var j = 0; j < mistParticles.length; j++) {
      var particle = mistParticles[j];
      particle.position.add(particle.velocity);

      // Wrap around
      if (particle.position.x > 50) particle.position.x = -50;
      if (particle.position.x < -50) particle.position.x = 50;
      if (particle.position.z > 50) particle.position.z = -50;
      if (particle.position.z < -50) particle.position.z = 50;

      // Vertical cycling
      if (particle.position.y > 20) particle.position.y = 0;

      // Opacity variation
      particle.material.opacity = 0.05 + Math.sin(time + particle.life) * 0.05;
    }

    // Update fog wisps
    for (var k = 0; k < fogWisps.length; k++) {
      var wisp = fogWisps[k];
      wisp.phase += 0.3 * delta;

      wisp.position.add(wisp.velocity);

      // Wrap around
      if (wisp.position.x > 50) wisp.position.x = -50;
      if (wisp.position.x < -50) wisp.position.x = 50;
      if (wisp.position.z > 50) wisp.position.z = -50;
      if (wisp.position.z < -50) wisp.position.z = 50;
      if (wisp.position.y > 20) wisp.position.y = 2;
      if (wisp.position.y < 2) wisp.position.y = 15;

      // Update wisp objects
      for (var m = 0; m < wisp.objects.length; m++) {
        var obj = wisp.objects[m];
        obj.position.x = wisp.position.x + Math.sin(wisp.phase + m) * wisp.scale;
        obj.position.y = wisp.position.y + Math.cos(wisp.phase + m * 0.5) * wisp.scale * 0.5;
        obj.position.z = wisp.position.z + Math.cos(wisp.phase + m * 0.7) * wisp.scale;

        obj.material.opacity = 0.06 + Math.sin(time * 0.5 + m) * 0.03;
      }
    }
  }

  function reset() {
    time = 0;

    // Reset ghost lights
    for (var i = 0; i < ghostLights.length; i++) {
      ghostLights[i].phase = Math.random() * Math.PI * 2;
    }

    // Reset particles
    for (var j = 0; j < mistParticles.length; j++) {
      mistParticles[j].position.set(
        (Math.random() - 0.5) * 80,
        Math.random() * 15,
        (Math.random() - 0.5) * 80
      );
    }

    // Reset wisps
    for (var k = 0; k < fogWisps.length; k++) {
      fogWisps[k].position.set(
        (Math.random() - 0.5) * 80,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 80
      );
      fogWisps[k].phase = Math.random() * Math.PI * 2;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
