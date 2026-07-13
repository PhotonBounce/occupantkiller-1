window.CheckpointAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var enemies = [];
  var spawnPoints = [];
  var alarmActive = false;
  var alarmTimer = 0;
  var searchlightAngle = 0;
  var floodlightFlicker = 0;
  var vehicleHeadlightFlicker = 0;
  var lastSpawnTime = 0;
  var spawnInterval = 3;

  var colors = {
    concreteGray: 0x808080,
    sandbagTan: 0xC8A05A,
    metalDark: 0x333333,
    warningYellow: 0xFFCC00,
    redAlert: 0xFF2200,
    darkGreen: 0x1a3a1a,
    rustRed: 0x8B3A1F,
    skyBlue: 0x87CEEB,
    white: 0xFFFFFF,
    orange: 0xFFA500
  };

  function addMesh(geometry, material, x, y, z, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (scale) {
      mesh.scale.set(scale.x || 1, scale.y || 1, scale.z || 1);
    }
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createConcreteWall(x, y, z, width, height, depth) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: colors.concreteGray,
      roughness: 0.8,
      metalness: 0.1
    });
    return addMesh(geometry, material, x, y, z);
  }

  function createSandbagBarrier(x, y, z, length, height) {
    var geometry = new THREE.BoxGeometry(length, height, 0.5);
    var material = new THREE.MeshStandardMaterial({
      color: colors.sandbagTan,
      roughness: 0.9,
      metalness: 0
    });
    return addMesh(geometry, material, x, y, z);
  }

  function createGuardTower(x, y, z) {
    var base = createConcreteWall(x, y, z, 4, 0.5, 4);
    var column = createConcreteWall(x, y + 3, z, 1.5, 6, 1.5);
    var platform = createConcreteWall(x, y + 6.5, z, 3, 0.5, 3);
    var railing1 = createConcreteWall(x + 1.7, y + 7.2, z, 0.3, 1.5, 3);
    var railing2 = createConcreteWall(x - 1.7, y + 7.2, z, 0.3, 1.5, 3);
    var railing3 = createConcreteWall(x, y + 7.2, z + 1.7, 3, 1.5, 0.3);
    var railing4 = createConcreteWall(x, y + 7.2, z - 1.7, 3, 1.5, 0.3);
    var roof = createConcreteWall(x, y + 7.7, z, 3.2, 0.3, 3.2);

    return {
      base: base,
      column: column,
      platform: platform,
      position: { x: x, y: y, z: z }
    };
  }

  function createArmoredVehicle(x, y, z) {
    var chassis = createConcreteWall(x, y, z, 6, 2.5, 3);
    chassis.material = new THREE.MeshStandardMaterial({
      color: colors.metalDark,
      roughness: 0.4,
      metalness: 0.8
    });

    var cab = createConcreteWall(x - 1.5, y + 1.5, z, 2.5, 2, 2.5);
    cab.material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.5,
      metalness: 0.7
    });

    var turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16),
      new THREE.MeshStandardMaterial({
        color: colors.metalDark,
        roughness: 0.4,
        metalness: 0.8
      })
    );
    turret.position.set(x, y + 2.3, z);
    turret.castShadow = true;
    scene.add(turret);
    meshes.push(turret);

    var headlight1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: colors.white,
        emissive: colors.white,
        emissiveIntensity: 0.3
      })
    );
    headlight1.position.set(x - 2.8, y + 1, z + 1.2);
    scene.add(headlight1);
    meshes.push(headlight1);

    var headlight2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshStandardMaterial({
        color: colors.white,
        emissive: colors.white,
        emissiveIntensity: 0.3
      })
    );
    headlight2.position.set(x - 2.8, y + 1, z - 1.2);
    scene.add(headlight2);
    meshes.push(headlight2);

    return {
      chassis: chassis,
      cab: cab,
      turret: turret,
      headlight1: headlight1,
      headlight2: headlight2,
      position: { x: x, y: y, z: z }
    };
  }

  function createRazorWireBarrier(x, y, z, length) {
    var posts = [];
    for (var i = 0; i < 5; i++) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2, 8),
        new THREE.MeshStandardMaterial({
          color: colors.metalDark,
          roughness: 0.3,
          metalness: 0.9
        })
      );
      post.position.set(x + (i - 2) * (length / 4), y + 1, z);
      scene.add(post);
      meshes.push(post);
      posts.push(post);
    }

    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];
    for (var j = 0; j < 5; j++) {
      wirePositions.push(x + (j - 2) * (length / 4), y + 0.8, z);
      wirePositions.push(x + (j - 2) * (length / 4), y + 1.8, z);
    }
    wireGeometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(wirePositions), 3
    ));
    var wireMaterial = new THREE.LineBasicMaterial({ color: colors.warningYellow });
    var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireLines);
    meshes.push(wireLines);

    return { posts: posts, wireLines: wireLines };
  }

  function createSearchlight(x, y, z) {
    var post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 3, 12),
      new THREE.MeshStandardMaterial({
        color: colors.metalDark,
        roughness: 0.4,
        metalness: 0.8
      })
    );
    post.position.set(x, y, z);
    scene.add(post);
    meshes.push(post);

    var searchlightHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16),
      new THREE.MeshStandardMaterial({
        color: colors.warningYellow,
        roughness: 0.3,
        metalness: 0.7,
        emissive: colors.orange,
        emissiveIntensity: 0.2
      })
    );
    searchlightHead.position.set(x, y + 1.8, z);
    scene.add(searchlightHead);
    meshes.push(searchlightHead);

    var searchlightLight = new THREE.SpotLight(
      colors.warningYellow,
      2,
      50,
      Math.PI / 6,
      0.5,
      1.5
    );
    searchlightLight.position.set(x, y + 2.3, z);
    searchlightLight.target.position.set(x + 20, y + 1, z);
    scene.add(searchlightLight);
    scene.add(searchlightLight.target);
    lights.push(searchlightLight);

    return {
      post: post,
      head: searchlightHead,
      light: searchlightLight,
      position: { x: x, y: y, z: z },
      angle: 0
    };
  }

  function createFloodlight(x, y, z) {
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.35, 4, 12),
      new THREE.MeshStandardMaterial({
        color: colors.metalDark,
        roughness: 0.5,
        metalness: 0.7
      })
    );
    pole.position.set(x, y, z);
    scene.add(pole);
    meshes.push(pole);

    var fixture = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.4),
      new THREE.MeshStandardMaterial({
        color: colors.metalDark,
        roughness: 0.4,
        metalness: 0.8
      })
    );
    fixture.position.set(x, y + 2.2, z);
    scene.add(fixture);
    meshes.push(fixture);

    var floodlightLight = new THREE.PointLight(colors.white, 1.5, 40);
    floodlightLight.position.set(x, y + 2.2, z);
    scene.add(floodlightLight);
    lights.push(floodlightLight);

    return {
      pole: pole,
      fixture: fixture,
      light: floodlightLight,
      position: { x: x, y: y, z: z }
    };
  }

  function createBoomGate(x, y, z) {
    var base = createConcreteWall(x, y, z, 2, 1, 2);
    var gateArm = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 0.3),
      new THREE.MeshStandardMaterial({
        color: colors.warningYellow,
        roughness: 0.4,
        metalness: 0.6
      })
    );
    gateArm.position.set(x + 4, y + 1.2, z);
    scene.add(gateArm);
    meshes.push(gateArm);

    var counterweight = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.8, 0.5),
      new THREE.MeshStandardMaterial({
        color: colors.redAlert,
        roughness: 0.5,
        metalness: 0.7
      })
    );
    counterweight.position.set(x - 2, y + 1.2, z);
    scene.add(counterweight);
    meshes.push(counterweight);

    return {
      base: base,
      gateArm: gateArm,
      counterweight: counterweight,
      position: { x: x, y: y, z: z },
      angle: 0
    };
  }

  function createFlagPole(x, y, z, color) {
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 5, 12),
      new THREE.MeshStandardMaterial({
        color: colors.metalDark,
        roughness: 0.4,
        metalness: 0.8
      })
    );
    pole.position.set(x, y, z);
    scene.add(pole);
    meshes.push(pole);

    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 0.05),
      new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.6,
        metalness: 0.2
      })
    );
    flag.position.set(x + 1, y + 1.8, z);
    scene.add(flag);
    meshes.push(flag);

    return { pole: pole, flag: flag };
  }

  function createBlastWall(x, y, z) {
    var main = createConcreteWall(x, y, z, 3, 3, 0.5);
    var reinforcement1 = createConcreteWall(x + 0.2, y, z + 0.3, 0.3, 3.2, 0.8);
    var reinforcement2 = createConcreteWall(x - 0.2, y, z + 0.3, 0.3, 3.2, 0.8);

    return { main: main, r1: reinforcement1, r2: reinforcement2 };
  }

  function createBunker(x, y, z) {
    var roof = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16),
      new THREE.MeshStandardMaterial({
        color: colors.concreteGray,
        roughness: 0.8,
        metalness: 0.1
      })
    );
    roof.position.set(x, y + 1.8, z);
    scene.add(roof);
    meshes.push(roof);

    var wall1 = createConcreteWall(x + 2.5, y + 0.8, z, 0.4, 1.6, 2.5);
    var wall2 = createConcreteWall(x - 2.5, y + 0.8, z, 0.4, 1.6, 2.5);
    var wall3 = createConcreteWall(x, y + 0.8, z + 2.5, 5, 1.6, 0.4);

    var entrance = createConcreteWall(x, y + 0.8, z - 2.5, 1.5, 1.6, 0.4);

    spawnPoints.push({ x: x, y: y + 0.5, z: z, type: 'bunker' });

    return { roof: roof, w1: wall1, w2: wall2, w3: wall3, entrance: entrance };
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    lights = [];
    enemies = [];
    spawnPoints = [];
    alarmActive = false;
    searchlightAngle = 0;
    floodlightFlicker = 0;
    vehicleHeadlightFlicker = 0;
    lastSpawnTime = 0;

    // Ground
    var groundGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      roughness: 0.9,
      metalness: 0
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    // Main checkpoint entrance with boom gate
    createBoomGate(0, 0, 0);

    // Blast walls flanking the gate
    createBlastWall(8, 0, 5);
    createBlastWall(8, 0, -5);
    createBlastWall(-8, 0, 5);
    createBlastWall(-8, 0, -5);

    // Sandbag barriers behind walls
    createSandbagBarrier(10, 0.5, 8, 6, 1);
    createSandbagBarrier(10, 0.5, -8, 6, 1);
    createSandbagBarrier(-10, 0.5, 8, 6, 1);
    createSandbagBarrier(-10, 0.5, -8, 6, 1);

    // Guard towers at corners
    var tower1 = createGuardTower(15, 0, 15);
    var tower2 = createGuardTower(15, 0, -15);
    var tower3 = createGuardTower(-15, 0, 15);
    var tower4 = createGuardTower(-15, 0, -15);

    spawnPoints.push({ x: 15, y: 7.5, z: 15, type: 'tower' });
    spawnPoints.push({ x: 15, y: 7.5, z: -15, type: 'tower' });
    spawnPoints.push({ x: -15, y: 7.5, z: 15, type: 'tower' });
    spawnPoints.push({ x: -15, y: 7.5, z: -15, type: 'tower' });

    // Razor wire barriers
    createRazorWireBarrier(0, 0, 12, 8);
    createRazorWireBarrier(0, 0, -12, 8);
    createRazorWireBarrier(12, 0, 0, 8);
    createRazorWireBarrier(-12, 0, 0, 8);

    // Armored vehicles blocking approach
    var vehicle1 = createArmoredVehicle(5, 0, 8);
    var vehicle2 = createArmoredVehicle(5, 0, -8);
    var vehicle3 = createArmoredVehicle(-5, 0, 8);

    spawnPoints.push({ x: 8, y: 1.5, z: 8, type: 'ground' });
    spawnPoints.push({ x: 8, y: 1.5, z: -8, type: 'ground' });
    spawnPoints.push({ x: -8, y: 1.5, z: 8, type: 'ground' });

    // Searchlights
    var searchlight1 = createSearchlight(20, 0, 20);
    var searchlight2 = createSearchlight(20, 0, -20);
    var searchlight3 = createSearchlight(-20, 0, 20);

    lights.push({
      isSearchlight: true,
      object: searchlight1
    });
    lights.push({
      isSearchlight: true,
      object: searchlight2
    });
    lights.push({
      isSearchlight: true,
      object: searchlight3
    });

    // Floodlights on poles
    var flood1 = createFloodlight(18, 0, 0);
    var flood2 = createFloodlight(-18, 0, 0);
    var flood3 = createFloodlight(0, 0, 18);

    lights.push({
      isFloodlight: true,
      object: flood1
    });
    lights.push({
      isFloodlight: true,
      object: flood2
    });
    lights.push({
      isFloodlight: true,
      object: flood3
    });

    // Bunkers for defensive positions
    var bunker1 = createBunker(12, 0, 8);
    var bunker2 = createBunker(-12, 0, -8);
    var bunker3 = createBunker(8, 0, -12);

    // Flag poles
    createFlagPole(25, 0, 25, colors.redAlert);
    createFlagPole(-25, 0, -25, colors.darkGreen);
    createFlagPole(25, 0, -25, colors.warningYellow);

    // Additional concrete barriers
    createConcreteWall(0, 0, 20, 20, 3, 0.5);
    createConcreteWall(0, 0, -20, 20, 3, 0.5);

    // Add ambient light
    var ambientLight = new THREE.AmbientLight(colors.white, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Add directional light for shadows
    var dirLight = new THREE.DirectionalLight(colors.white, 0.8);
    dirLight.position.set(30, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    lights.push(dirLight);
  }

  function update(delta) {
    // Rotate searchlights
    for (var i = 0; i < lights.length; i++) {
      if (lights[i].isSearchlight) {
        var searchlight = lights[i].object;
        searchlight.angle += delta * 0.5;
        var radius = 15;
        var newX = searchlight.position.x + Math.cos(searchlight.angle) * radius;
        var newZ = searchlight.position.z + Math.sin(searchlight.angle) * radius;
        searchlight.light.target.position.set(newX, 2, newZ);
      }
    }

    // Flicker floodlights
    floodlightFlicker += delta;
    if (floodlightFlicker > 0.1) {
      floodlightFlicker = 0;
      for (var j = 0; j < lights.length; j++) {
        if (lights[j].isFloodlight) {
          var intensity = 1.5 + (Math.random() - 0.5) * 0.3;
          lights[j].object.light.intensity = intensity;
        }
      }
    }

    // Vehicle headlight flicker effect
    vehicleHeadlightFlicker += delta;
    if (vehicleHeadlightFlicker > 0.15) {
      vehicleHeadlightFlicker = 0;
      for (var k = 0; k < meshes.length; k++) {
        if (meshes[k].geometry && meshes[k].geometry.type === 'SphereGeometry') {
          var intensity = 0.3 + (Math.random() - 0.5) * 0.2;
          if (meshes[k].material && meshes[k].material.emissiveIntensity !== undefined) {
            meshes[k].material.emissiveIntensity = Math.max(0.1, intensity);
          }
        }
      }
    }

    // Spawn enemies periodically
    lastSpawnTime += delta;
    if (lastSpawnTime > spawnInterval && spawnPoints.length > 0) {
      lastSpawnTime = 0;
      var spawnIndex = Math.floor(Math.random() * spawnPoints.length);
      var spawn = spawnPoints[spawnIndex];
      enemies.push({
        position: { x: spawn.x, y: spawn.y, z: spawn.z },
        health: 100,
        type: spawn.type
      });
    }

    // Update alarm state
    if (alarmActive) {
      alarmTimer += delta;
      if (alarmTimer > 0.3) {
        alarmTimer = 0;
      }
    }
  }

  function reset() {
    // Remove all meshes
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];

    // Remove all lights
    for (var j = lights.length - 1; j >= 0; j--) {
      if (lights[j].parent) {
        scene.remove(lights[j]);
      }
    }
    lights = [];

    // Clear enemies and spawn points
    enemies = [];
    spawnPoints = [];

    // Reset state
    alarmActive = false;
    alarmTimer = 0;
    searchlightAngle = 0;
    floodlightFlicker = 0;
    vehicleHeadlightFlicker = 0;
    lastSpawnTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
