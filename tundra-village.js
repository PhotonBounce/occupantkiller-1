window.TundraVillage = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var enemies = [];
  var villagers = [];
  var gameState = {
    villagersFreed: 0,
    totalVillagers: 8,
    militiaDown: 0,
    totalMilitia: 10,
    churchSecured: false,
    isActive: false,
    lastKeyTime: 0,
    lastKey: ''
  };

  var hudElements = {
    villagerCount: null,
    militiaCount: null,
    churchStatus: null
  };

  function createIzbaHouse(x, z, scale) {
    var group = new THREE.Group();

    var wallGeometry = new THREE.BoxGeometry(4 * scale, 3 * scale, 5 * scale);
    var woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.8,
      metalness: 0.0
    });
    var walls = new THREE.Mesh(wallGeometry, woodMaterial);
    walls.position.y = 1.5 * scale;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    var roofGeometry = new THREE.BoxGeometry(4.5 * scale, 2.5 * scale, 5.5 * scale);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3728,
      roughness: 0.7,
      metalness: 0.0
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.z = 0.3;
    roof.position.y = 4 * scale;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    var doorGeometry = new THREE.BoxGeometry(1.2 * scale, 2 * scale, 0.3 * scale);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3E2723,
      roughness: 0.9,
      metalness: 0.0
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 1 * scale, 2.7 * scale);
    door.castShadow = true;
    group.add(door);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createCommunalWell(x, z) {
    var group = new THREE.Group();

    var shaftGeometry = new THREE.CylinderGeometry(1, 1, 4, 16);
    var stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.8,
      metalness: 0.1
    });
    var shaft = new THREE.Mesh(shaftGeometry, stoneMaterial);
    shaft.position.y = 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    var roofGeometry = new THREE.BoxGeometry(2.5, 1.2, 2.5);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.8,
      metalness: 0.0
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.8;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    var bucketGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12);
    var bucketMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.2
    });
    var bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
    bucket.position.set(1.2, 3.5, 0);
    bucket.castShadow = true;
    group.add(bucket);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createOrthodoxChurch(x, z) {
    var group = new THREE.Group();

    var buildingGeometry = new THREE.BoxGeometry(6, 5, 6);
    var brickMaterial = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.85,
      metalness: 0.0
    });
    var building = new THREE.Mesh(buildingGeometry, brickMaterial);
    building.position.y = 2.5;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    var baseGeometry = new THREE.CylinderGeometry(2, 2.2, 1.5, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xCD853F,
      roughness: 0.8,
      metalness: 0.0
    });
    var domeBase = new THREE.Mesh(baseGeometry, baseMaterial);
    domeBase.position.y = 6;
    domeBase.castShadow = true;
    domeBase.receiveShadow = true;
    group.add(domeBase);

    var onionDomeGeometry = new THREE.SphereGeometry(1.8, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.4,
      metalness: 0.5,
      emissive: 0x8B7500,
      emissiveIntensity: 0.2
    });
    var onionDome = new THREE.Mesh(onionDomeGeometry, domeMaterial);
    onionDome.position.y = 7.2;
    onionDome.castShadow = true;
    onionDome.receiveShadow = true;
    group.add(onionDome);

    var crossGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      roughness: 0.3,
      metalness: 0.8
    });
    var cross = new THREE.Mesh(crossGeometry, metalMaterial);
    cross.position.set(0, 9.2, 0);
    cross.castShadow = true;
    group.add(cross);

    var crossArm = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.2, 0.2),
      metalMaterial
    );
    crossArm.position.set(0, 8.8, 0);
    crossArm.castShadow = true;
    group.add(crossArm);

    var bellGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    var bellMaterial = new THREE.MeshStandardMaterial({
      color: 0xB8860B,
      roughness: 0.3,
      metalness: 0.7
    });
    var bell = new THREE.Mesh(bellGeometry, bellMaterial);
    bell.position.set(0, 5.5, 0);
    bell.castShadow = true;
    bell.receiveShadow = true;
    group.add(bell);

    var bellPendulum = { object: bell, baseY: 5.5, amplitude: 0.15, time: 0 };
    animatedObjects.push(bellPendulum);
    group.churchSecured = false;

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFencePosts(startX, startZ, count, spacing) {
    var group = new THREE.Group();

    var postMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.85,
      metalness: 0.0
    });

    for (var i = 0; i < count; i++) {
      var postGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2.5, 8);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(startX + i * spacing, 1.25, startZ);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);

      if (i < count - 1) {
        var plankGeometry = new THREE.BoxGeometry(spacing - 0.5, 0.15, 0.15);
        var plankMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B6F47,
          roughness: 0.8,
          metalness: 0.0
        });
        var plank = new THREE.Mesh(plankGeometry, plankMaterial);
        plank.position.set(startX + i * spacing + spacing * 0.5, 1.5, startZ);
        plank.castShadow = true;
        plank.receiveShadow = true;
        group.add(plank);
      }
    }

    group.position.set(0, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createVegetationMound(x, z) {
    var group = new THREE.Group();

    var moundGeometry = new THREE.BoxGeometry(3, 1.5, 3);
    var earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7765,
      roughness: 0.9,
      metalness: 0.0
    });
    var mound = new THREE.Mesh(moundGeometry, earthMaterial);
    mound.position.y = 0.75;
    mound.scale.y = 0.6;
    mound.castShadow = true;
    mound.receiveShadow = true;
    group.add(mound);

    var coverGeometry = new THREE.BoxGeometry(3.2, 0.3, 3.2);
    var coverMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969,
      roughness: 0.95,
      metalness: 0.0
    });
    var cover = new THREE.Mesh(coverGeometry, coverMaterial);
    cover.position.y = 1.5;
    cover.castShadow = true;
    cover.receiveShadow = true;
    group.add(cover);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createCheckpoint(x, z) {
    var group = new THREE.Group();

    var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 12);
    var metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.5,
      metalness: 0.8
    });
    var post = new THREE.Mesh(postGeometry, metalMaterial);
    post.position.y = 1.5;
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);

    var barrierGeometry = new THREE.BoxGeometry(4, 0.8, 0.4);
    var barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B35,
      roughness: 0.6,
      metalness: 0.3
    });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(0, 2.5, 0);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);

    var armAnimation = {
      object: barrier,
      baseY: 2.5,
      raiseY: 3.5,
      time: 0,
      isRaised: false
    };
    animatedObjects.push(armAnimation);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFrozenPond(x, z) {
    var group = new THREE.Group();

    var pondGeometry = new THREE.BoxGeometry(10, 0.2, 8);
    var iceMaterial = new THREE.MeshStandardMaterial({
      color: 0xB0E0E6,
      roughness: 0.2,
      metalness: 0.3,
      emissive: 0xE0F4FF,
      emissiveIntensity: 0.15
    });
    var pond = new THREE.Mesh(pondGeometry, iceMaterial);
    pond.position.y = 0.1;
    pond.receiveShadow = true;
    group.add(pond);

    group.position.set(x, 0, z);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createBlizzardSnow() {
    var group = new THREE.Group();
    var particleCount = 200;

    var positionArray = new Float32Array(particleCount * 3);
    for (var i = 0; i < particleCount; i++) {
      positionArray[i * 3] = (Math.random() - 0.5) * 80;
      positionArray[i * 3 + 1] = Math.random() * 40;
      positionArray[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));

    var material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });

    var particles = new THREE.Points(geometry, material);
    group.add(particles);

    var snowAnimation = {
      particles: particles,
      velocities: []
    };

    for (var i = 0; i < particleCount; i++) {
      snowAnimation.velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: -0.01 - Math.random() * 0.01,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    animatedObjects.push(snowAnimation);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEnvironment() {
    var skyGeometry = new THREE.SphereGeometry(200, 32, 32);
    var skyMaterial = new THREE.MeshBasicMaterial({
      color: 0xD3D3D3,
      side: THREE.BackSide
    });
    var sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
    sceneObjects.push(sky);

    var groundGeometry = new THREE.BoxGeometry(150, 0.5, 150);
    var snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xF0F8FF,
      roughness: 0.95,
      metalness: 0.0
    });
    var ground = new THREE.Mesh(groundGeometry, snowMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);

    scene.fog = new THREE.Fog(0xD3D3D3, 60, 120);
    scene.background = new THREE.Color(0xD3D3D3);
  }

  function createLighting() {
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -80;
    directionalLight.shadow.camera.right = 80;
    directionalLight.shadow.camera.top = 80;
    directionalLight.shadow.camera.bottom = -80;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);
  }

  function createEnemy(x, z, type) {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    var uniformMaterial = new THREE.MeshStandardMaterial({
      color: 0x2F4F4F,
      roughness: 0.7,
      metalness: 0.0
    });
    var body = new THREE.Mesh(bodyGeometry, uniformMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var legGeometry = new THREE.BoxGeometry(0.35, 1, 0.35);
    var leg1 = new THREE.Mesh(legGeometry, uniformMaterial);
    leg1.position.set(-0.2, 0.5, 0);
    leg1.castShadow = true;
    group.add(leg1);

    var leg2 = new THREE.Mesh(legGeometry, uniformMaterial);
    leg2.position.set(0.2, 0.5, 0);
    leg2.castShadow = true;
    group.add(leg2);

    var headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x8D5524,
      roughness: 0.6,
      metalness: 0.0
    });
    var head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 2.0;
    head.castShadow = true;
    group.add(head);

    if (type === 'cone') {
      var helmetGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
      var helmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A4A4A,
        roughness: 0.8,
        metalness: 0.2
      });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.set(0, 2.5, 0);
      helmet.castShadow = true;
      group.add(helmet);
    } else if (type === 'flat') {
      var flatHelmetGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      var flatHelmetMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A3A3A,
        roughness: 0.8,
        metalness: 0.3
      });
      var flatHelmet = new THREE.Mesh(flatHelmetGeometry, flatHelmetMaterial);
      flatHelmet.position.set(0, 2.45, 0);
      flatHelmet.castShadow = true;
      group.add(flatHelmet);
    }

    group.position.set(x, 0, z);
    group.health = 1;
    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function createVillager(x, z) {
    var group = new THREE.Group();

    var bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.5);
    var clothMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.0
    });
    var body = new THREE.Mesh(bodyGeometry, clothMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xC19A6B,
      roughness: 0.6,
      metalness: 0.0
    });
    var head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    group.position.set(x, 0, z);
    group.isFreed = false;
    scene.add(group);
    sceneObjects.push(group);
    villagers.push(group);
    return group;
  }

  function createHUD() {
    if (hudElements.villagerCount) {
      return;
    }

    var hudContainer = document.createElement('div');
    hudContainer.id = 'tundra-hud';
    hudContainer.style.position = 'fixed';
    hudContainer.style.top = '20px';
    hudContainer.style.left = '20px';
    hudContainer.style.color = '#FFFFFF';
    hudContainer.style.fontFamily = 'monospace';
    hudContainer.style.fontSize = '16px';
    hudContainer.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';
    hudContainer.style.zIndex = '1000';
    hudContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    hudContainer.style.padding = '15px';
    hudContainer.style.borderRadius = '5px';
    hudContainer.style.minWidth = '250px';

    var villagerDiv = document.createElement('div');
    villagerDiv.style.marginBottom = '10px';
    villagerDiv.innerHTML = 'VILLAGERS FREED: 0/8';
    hudElements.villagerCount = villagerDiv;
    hudContainer.appendChild(villagerDiv);

    var militiaDiv = document.createElement('div');
    militiaDiv.style.marginBottom = '10px';
    militiaDiv.innerHTML = 'MILITIA DOWN: 0/10';
    hudElements.militiaCount = militiaDiv;
    hudContainer.appendChild(militiaDiv);

    var churchDiv = document.createElement('div');
    churchDiv.style.marginBottom = '10px';
    churchDiv.style.color = '#FF6B6B';
    churchDiv.innerHTML = 'CHURCH SECURED: NO';
    hudElements.churchStatus = churchDiv;
    hudContainer.appendChild(churchDiv);

    var notificationDiv = document.createElement('div');
    notificationDiv.id = 'tundra-notification';
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.bottom = '20px';
    notificationDiv.style.left = '20px';
    notificationDiv.style.color = '#FFFFFF';
    notificationDiv.style.fontFamily = 'monospace';
    notificationDiv.style.fontSize = '14px';
    notificationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    notificationDiv.style.padding = '10px 15px';
    notificationDiv.style.borderRadius = '3px';
    notificationDiv.style.zIndex = '999';
    notificationDiv.innerHTML = 'TUNDRA VILLAGE (Press T+V to toggle)';
    document.body.appendChild(notificationDiv);

    document.body.appendChild(hudContainer);
  }

  function updateHUD() {
    if (hudElements.villagerCount) {
      hudElements.villagerCount.innerHTML = 'VILLAGERS FREED: ' + gameState.villagersFreed + '/' + gameState.totalVillagers;
      hudElements.militiaCount.innerHTML = 'MILITIA DOWN: ' + gameState.militiaDown + '/' + gameState.totalMilitia;
      hudElements.churchStatus.innerHTML = 'CHURCH SECURED: ' + (gameState.churchSecured ? 'YES' : 'NO');
      hudElements.churchStatus.style.color = gameState.churchSecured ? '#6BFF6B' : '#FF6B6B';
    }
  }

  function showNotification(text) {
    var notif = document.getElementById('tundra-notification');
    if (notif) {
      notif.innerHTML = text;
      notif.style.opacity = '1';
      if (notif.fadeTimeout) {
        clearTimeout(notif.fadeTimeout);
      }
      notif.fadeTimeout = setTimeout(function() {
        notif.style.opacity = '0.5';
      }, 3000);
    }
  }

  function handleKeyDown(event) {
    var currentTime = Date.now();
    var timeSinceLastKey = currentTime - gameState.lastKeyTime;

    if (event.key === 't' || event.key === 'T') {
      gameState.lastKey = 't';
      gameState.lastKeyTime = currentTime;
    } else if ((event.key === 'v' || event.key === 'V') && gameState.lastKey === 't' && timeSinceLastKey < 400) {
      gameState.isActive = !gameState.isActive;
      var message = gameState.isActive ? 'TUNDRA VILLAGE ACTIVATED' : 'TUNDRA VILLAGE DEACTIVATED';
      showNotification(message);
      gameState.lastKey = '';
    } else {
      if (timeSinceLastKey > 400) {
        gameState.lastKey = event.key === 't' || event.key === 'T' ? 't' : '';
        gameState.lastKeyTime = currentTime;
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    createEnvironment();
    createLighting();

    createIzbaHouse(-15, -20, 1);
    createIzbaHouse(10, -15, 1);
    createIzbaHouse(-8, 10, 1);
    createIzbaHouse(12, 8, 1);

    createCommunalWell(0, 0);
    createOrthodoxChurch(25, -15);
    createFencePosts(-30, 30, 8, 8);
    createVegetationMound(-20, 20);
    createCheckpoint(30, 15);
    createFrozenPond(-5, -35);

    createBlizzardSnow();

    createEnemy(-12, 5, 'cone');
    createEnemy(8, 15, 'flat');
    createEnemy(-18, -10, 'cone');
    createEnemy(5, -25, 'flat');
    createEnemy(20, 10, 'cone');
    createEnemy(-25, 0, 'flat');
    createEnemy(15, -8, 'cone');
    createEnemy(-10, 20, 'flat');
    createEnemy(22, 25, 'cone');
    createEnemy(0, -30, 'flat');

    createVillager(-15, -15);
    createVillager(8, -8);
    createVillager(-20, 15);
    createVillager(18, 12);
    createVillager(-5, 25);
    createVillager(25, 5);
    createVillager(-30, 28);
    createVillager(35, 18);

    createHUD();
    gameState.isActive = true;
    showNotification('TUNDRA VILLAGE INITIALIZED (Press T+V to toggle)');

    document.addEventListener('keydown', handleKeyDown);
  }

  function updateSnowParticles(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.particles) {
        var positions = obj.particles.geometry.attributes.position.array;
        var velocities = obj.velocities;

        for (var j = 0; j < velocities.length; j++) {
          positions[j * 3] += velocities[j].x;
          positions[j * 3 + 1] += velocities[j].y;
          positions[j * 3 + 2] += velocities[j].z;

          if (positions[j * 3 + 1] < -40) {
            positions[j * 3 + 1] = 40;
          }

          if (positions[j * 3] > 40) {
            positions[j * 3] = -40;
          } else if (positions[j * 3] < -40) {
            positions[j * 3] = 40;
          }

          if (positions[j * 3 + 2] > 40) {
            positions[j * 3 + 2] = -40;
          } else if (positions[j * 3 + 2] < -40) {
            positions[j * 3 + 2] = 40;
          }
        }

        obj.particles.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  function updateAnimations(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.baseY !== undefined && obj.amplitude !== undefined) {
        obj.time += delta;
        obj.object.position.y = obj.baseY + Math.sin(obj.time * 2) * obj.amplitude;
      } else if (obj.baseY !== undefined && obj.raiseY !== undefined) {
        obj.time += delta * 0.5;
        if (obj.time > 2) {
          obj.isRaised = !obj.isRaised;
          obj.time = 0;
        }
        var targetY = obj.isRaised ? obj.raiseY : obj.baseY;
        obj.object.position.y += (targetY - obj.object.position.y) * 0.1;
      }
    }

    updateSnowParticles(delta);
  }

  function update(delta) {
    if (!gameState.isActive) {
      return;
    }

    updateAnimations(delta);
    updateHUD();
  }

  function reset() {
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (scene) {
        scene.remove(obj);
      }
    }

    sceneObjects = [];
    animatedObjects = [];
    enemies = [];
    villagers = [];

    gameState.villagersFreed = 0;
    gameState.militiaDown = 0;
    gameState.churchSecured = false;
    gameState.isActive = false;

    var hudContainer = document.getElementById('tundra-hud');
    if (hudContainer) {
      hudContainer.parentNode.removeChild(hudContainer);
    }

    hudElements.villagerCount = null;
    hudElements.militiaCount = null;
    hudElements.churchStatus = null;

    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
