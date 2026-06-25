window.ArtMuseum = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var enemies = [];
  var lasers = [];
  var lights = [];
  var time = 0;

  var MARBLE = 0xF5F5F0;
  var GOLD = 0xD4AF37;
  var ARTIFACT_BROWN = 0x8B6914;
  var SECURITY_RED = 0xFF2200;
  var SPOTLIGHT = 0xFFF8DC;
  var GALLERY_GRAY = 0xAAAAAA;

  function createBox(x, y, z, w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCylinder(x, y, z, r, h, color) {
    var geo = new THREE.CylinderGeometry(r, r, h, 16);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createSphere(x, y, z, r, color) {
    var geo = new THREE.SphereGeometry(r, 16, 16);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCone(x, y, z, r, h, color) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geo, mat);
    scene.add(line);
    meshes.push(line);
    return line;
  }

  function buildMuseumEnvironment() {
    // Grand entrance hall floor
    createBox(0, -0.5, 0, 50, 1, 60, MARBLE);

    // High ceiling
    createBox(0, 30, 0, 50, 1, 60, 0xE8E8E0);

    // Marble columns (8 total)
    createCylinder(-15, 5, -20, 1.5, 20, MARBLE);
    createCylinder(15, 5, -20, 1.5, 20, MARBLE);
    createCylinder(-15, 5, 20, 1.5, 20, MARBLE);
    createCylinder(15, 5, 20, 1.5, 20, MARBLE);
    createCylinder(-25, 5, 0, 1.5, 20, MARBLE);
    createCylinder(25, 5, 0, 1.5, 20, MARBLE);
    createCylinder(0, 5, -28, 1.5, 20, MARBLE);
    createCylinder(0, 5, 28, 1.5, 20, MARBLE);

    // Bust sculptures on pedestals
    var bust1 = createBox(-10, 3, -15, 2, 2, 2, GALLERY_GRAY);
    createSphere(-10, 6, -15, 0.8, 0xD3D3D3);

    var bust2 = createBox(10, 3, 15, 2, 2, 2, GALLERY_GRAY);
    createSphere(10, 6, 15, 0.8, 0xD3D3D3);

    var bust3 = createBox(-20, 3, 10, 2, 2, 2, GALLERY_GRAY);
    createSphere(-20, 6, 10, 0.8, 0xD3D3D3);

    var bust4 = createBox(20, 3, -10, 2, 2, 2, GALLERY_GRAY);
    createSphere(20, 6, -10, 0.8, 0xD3D3D3);

    // Art pedestals with artifact sculptures
    createBox(-18, 2, 0, 2.5, 0.8, 2.5, GALLERY_GRAY);
    createSphere(-18, 4, 0, 1.2, ARTIFACT_BROWN);

    createBox(18, 2, -5, 2.5, 0.8, 2.5, GALLERY_GRAY);
    createSphere(18, 4, -5, 1.2, ARTIFACT_BROWN);

    createBox(0, 2, -22, 2.5, 0.8, 2.5, GALLERY_GRAY);
    createSphere(0, 4, -22, 1.2, ARTIFACT_BROWN);

    createBox(-8, 2, 20, 2.5, 0.8, 2.5, GALLERY_GRAY);
    createSphere(-8, 4, 20, 1.2, ARTIFACT_BROWN);

    // Display cases with glass (BoxGeometry with thin walls)
    createBox(-25, 1, 20, 4, 5, 3, 0xE0F0FF);
    createBox(-25, 1, 20, 3.8, 4.8, 2.8, 0xE0F0FF);

    createBox(22, 1, -18, 4, 5, 3, 0xE0F0FF);
    createBox(22, 1, -18, 3.8, 4.8, 2.8, 0xE0F0FF);

    // Wall-mounted canvas frames (thin BoxGeometry)
    createBox(-24, 10, -29.5, 6, 8, 0.2, GOLD);
    createBox(-24, 10, -29.3, 5.5, 7.5, 0.01, 0x8B4513);

    createBox(24, 10, 29.5, 6, 8, 0.2, GOLD);
    createBox(24, 10, 29.3, 5.5, 7.5, 0.01, 0x4B0082);

    createBox(-0.1, 12, 29.5, 7, 6, 0.2, GOLD);
    createBox(-0.1, 12, 29.3, 6.5, 5.5, 0.01, 0xFF6347);

    // Skylight ceiling panels
    createBox(-12, 29.8, -20, 8, 0.3, 8, 0xADD8E6);
    createBox(12, 29.8, 20, 8, 0.3, 8, 0xADD8E6);

    // Security desk
    createBox(-22, 1, -25, 5, 2, 3, 0x2F4F4F);
    createBox(-22, 3, -25, 4.5, 1.5, 2.5, SECURITY_RED);

    // Emergency exit doors
    createBox(24, 5, 25, 2, 6, 0.3, SECURITY_RED);
    createBox(-24, 5, -25, 2, 6, 0.3, SECURITY_RED);

    // Staircase
    createBox(20, 1, 10, 4, 0.5, 12, MARBLE);
    createBox(20, 2.5, 5, 4, 0.5, 12, MARBLE);
    createBox(20, 4, 0, 4, 0.5, 12, MARBLE);

    // Wall sections
    createBox(-24.5, 8, 0, 1, 16, 60, 0xCCCCCC);
    createBox(24.5, 8, 0, 1, 16, 60, 0xCCCCCC);
    createBox(0, 8, -29.5, 50, 16, 1, 0xCCCCCC);
    createBox(0, 8, 29.5, 50, 16, 1, 0xCCCCCC);

    // Gallery room dividers (partial walls)
    createBox(-8, 6, -10, 1, 12, 15, 0xDDDDDD);
    createBox(8, 6, 10, 1, 12, 15, 0xDDDDDD);

    // Spotlight fixtures on ceiling
    createCone(0, 28, 0, 0.5, 2, SPOTLIGHT);
    createCone(-15, 28, -15, 0.5, 2, SPOTLIGHT);
    createCone(15, 28, 15, 0.5, 2, SPOTLIGHT);
  }

  function createLaserAlarm(x1, y1, z1, x2, y2, z2) {
    var laser = {
      p1: [x1, y1, z1],
      p2: [x2, y2, z2],
      active: true,
      triggered: false,
      lines: null
    };

    var points = [x1, y1, z1, x2, y2, z2];
    laser.lines = createLineSegments(points, SECURITY_RED);
    laser.lines.userData.alarm = true;

    lasers.push(laser);
    return laser;
  }

  function initializeEnemies() {
    var spawnPoints = [
      { x: -15, y: 2, z: -20 },
      { x: 15, y: 2, z: 20 },
      { x: -20, y: 2, z: 10 },
      { x: 20, y: 2, z: -10 },
      { x: 0, y: 2, z: -22 },
      { x: -8, y: 2, z: 20 }
    ];

    spawnPoints.forEach(function(sp) {
      var enemy = {
        x: sp.x,
        y: sp.y,
        z: sp.z,
        vx: (Math.random() - 0.5) * 3,
        vz: (Math.random() - 0.5) * 3,
        mesh: createBox(sp.x, sp.y, sp.z, 1, 2, 1, SECURITY_RED),
        health: 100,
        patrolDir: Math.random()
      };
      enemies.push(enemy);
    });
  }

  function createEmergencyLights() {
    var positions = [
      [-20, 25, -20],
      [20, 25, 20],
      [-20, 25, 20],
      [20, 25, -20],
      [0, 25, 0]
    ];

    positions.forEach(function(pos) {
      var light = new THREE.PointLight(SECURITY_RED, 0.5, 30);
      light.position.set(pos[0], pos[1], pos[2]);
      light.castShadow = true;
      scene.add(light);
      lights.push({
        light: light,
        intensity: 0,
        maxIntensity: 1.5,
        pulseSpeed: 8
      });
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    enemies = [];
    lasers = [];
    lights = [];
    time = 0;

    // Add ambient light
    var ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Add main lights
    var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Warm spotlight
    var spotlight = new THREE.SpotLight(SPOTLIGHT, 1, 100, Math.PI / 4, 0.5, 1);
    spotlight.position.set(-15, 20, -20);
    spotlight.castShadow = true;
    scene.add(spotlight);

    // Build environment
    buildMuseumEnvironment();

    // Create laser alarms at strategic points
    createLaserAlarm(-15, 3, -20, -15, 4, -20);
    createLaserAlarm(15, 3, 20, 15, 4, 20);
    createLaserAlarm(0, 3, -22, 2, 5, -22);
    createLaserAlarm(-18, 2, 0, -18, 5, 0);

    // Emergency lights
    createEmergencyLights();

    // Enemies patrol
    initializeEnemies();
  }

  function updateLasers(delta) {
    lasers.forEach(function(laser) {
      if (!laser.lines) return;

      var pulse = Math.sin(time * 4) * 0.5 + 0.5;
      var color = new THREE.Color(SECURITY_RED);
      color.multiplyScalar(pulse + 0.3);

      laser.lines.material.color = color;
      laser.lines.material.linewidth = 1 + pulse * 2;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      // Patrol behavior with boundaries
      enemy.x += enemy.vx * delta;
      enemy.z += enemy.vz * delta;

      // Bounce off walls
      if (Math.abs(enemy.x) > 22) {
        enemy.vx *= -1;
        enemy.x = Math.max(-22, Math.min(22, enemy.x));
      }
      if (Math.abs(enemy.z) > 28) {
        enemy.vz *= -1;
        enemy.z = Math.max(-28, Math.min(28, enemy.z));
      }

      // Update mesh position
      if (enemy.mesh) {
        enemy.mesh.position.x = enemy.x;
        enemy.mesh.position.z = enemy.z;

        // Rotation for directional appearance
        enemy.mesh.rotation.y += delta * 0.5;
      }
    });
  }

  function updateEmergencyLights(delta) {
    lights.forEach(function(lightObj) {
      var light = lightObj.light;
      lightObj.intensity += delta * lightObj.pulseSpeed;

      var pulse = Math.sin(lightObj.intensity) * 0.5 + 0.5;
      light.intensity = pulse * lightObj.maxIntensity;

      // Flash effect
      light.color.setHex(SECURITY_RED);
    });
  }

  function updateArtifacts(delta) {
    // Make artifacts slowly rotate and bob
    meshes.forEach(function(mesh) {
      if (mesh.userData && mesh.userData.isArtifact) {
        mesh.rotation.y += delta * 0.3;
        mesh.position.y += Math.sin(time * 2) * 0.01;
      }
    });
  }

  function update(delta) {
    if (!scene) return;

    time += delta;

    updateLasers(delta);
    updateEnemies(delta);
    updateEmergencyLights(delta);
    updateArtifacts(delta);

    // Occasional alarm trigger effects
    if (Math.sin(time * 2) > 0.95) {
      lasers.forEach(function(laser) {
        if (laser.lines) {
          laser.lines.material.linewidth = 4;
        }
      });
    }

    // Cycle through scene for destructible effects
    meshes.forEach(function(mesh) {
      if (mesh.userData && mesh.userData.damaged) {
        mesh.material.color.multiplyScalar(0.95);
      }
    });
  }

  function reset() {
    if (scene) {
      meshes.forEach(function(mesh) {
        scene.remove(mesh);
      });
      lights.forEach(function(lightObj) {
        scene.remove(lightObj.light);
      });
    }

    meshes = [];
    enemies = [];
    lasers = [];
    lights = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
