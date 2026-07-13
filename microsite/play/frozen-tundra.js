window.FrozenTundra = (function() {
  'use strict';

  var sceneObjects = [];
  var particles = [];
  var snowmobileObj = null;
  var snowmobilePos = { x: 0, z: 0 };
  var snowmobileDirection = 1;
  var capturedCount = 0;
  var kmTracked = 0.0;
  var hudElement = null;
  var isActive = false;
  var keybindBuffer = [];
  var keybindTimeout = null;
  var scene = null;
  var camera = null;

  var KEYBIND_SEQUENCE = ['f', 't'];
  var KEYBIND_TIMEOUT = 400;

  function createGulagOutpost() {
    var geometry = new THREE.BoxGeometry(8, 6, 10);
    var material = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var building = new THREE.Mesh(geometry, material);
    building.position.set(-20, 3, -40);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    sceneObjects.push(building);

    var roofGeometry = new THREE.BoxGeometry(9, 1, 11);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-20, 6.5, -40);
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);
    sceneObjects.push(roof);
  }

  function createFrozenLake() {
    var geometry = new THREE.BoxGeometry(60, 1, 80);
    var material = new THREE.MeshPhongMaterial({ color: 0xb8e0f0 });
    var lake = new THREE.Mesh(geometry, material);
    lake.position.set(0, -1, 0);
    lake.receiveShadow = true;
    scene.add(lake);
    sceneObjects.push(lake);
  }

  function createBirchTree(x, z) {
    var trunkGeometry = new THREE.CylinderGeometry(0.8, 1.0, 12, 8);
    var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 });
    var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 6, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);
    sceneObjects.push(trunk);

    var canopyGeometry = new THREE.SphereGeometry(5, 8, 8);
    var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0xe8e8e8 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(x, 14, z);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    scene.add(canopy);
    sceneObjects.push(canopy);
  }

  function createSnowmobile() {
    var bodyGeometry = new THREE.BoxGeometry(2, 1.5, 4);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    var skiGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
    var skiMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var skiLeft = new THREE.Mesh(skiGeometry, skiMaterial);
    skiLeft.rotation.z = Math.PI / 2;
    skiLeft.position.set(-1.2, 0.5, -1.5);
    skiLeft.castShadow = true;
    skiLeft.receiveShadow = true;
    scene.add(skiLeft);
    sceneObjects.push(skiLeft);

    var skiRight = new THREE.Mesh(skiGeometry, skiMaterial);
    skiRight.rotation.z = Math.PI / 2;
    skiRight.position.set(1.2, 0.5, -1.5);
    skiRight.castShadow = true;
    skiRight.receiveShadow = true;
    scene.add(skiRight);
    sceneObjects.push(skiRight);

    snowmobileObj = {
      body: body,
      skiLeft: skiLeft,
      skiRight: skiRight
    };
  }

  function createPrisonerBarracks() {
    var geometry = new THREE.BoxGeometry(20, 4, 8);
    var material = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var barracks = new THREE.Mesh(geometry, material);
    barracks.position.set(30, 2, 10);
    barracks.castShadow = true;
    barracks.receiveShadow = true;
    scene.add(barracks);
    sceneObjects.push(barracks);
  }

  function createWatchtowerSkeleton() {
    var legGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
    var legMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });

    var leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(-2, 7.5, -2);
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    scene.add(leg1);
    sceneObjects.push(leg1);

    var leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(2, 7.5, -2);
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    scene.add(leg2);
    sceneObjects.push(leg2);

    var leg3 = new THREE.Mesh(legGeometry, legMaterial);
    leg3.position.set(-2, 7.5, 2);
    leg3.castShadow = true;
    leg3.receiveShadow = true;
    scene.add(leg3);
    sceneObjects.push(leg3);

    var leg4 = new THREE.Mesh(legGeometry, legMaterial);
    leg4.position.set(2, 7.5, 2);
    leg4.castShadow = true;
    leg4.receiveShadow = true;
    scene.add(leg4);
    sceneObjects.push(leg4);

    var platformGeometry = new THREE.BoxGeometry(5, 1, 5);
    var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 15, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);
  }

  function createBarbedWireFence() {
    var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
    var postMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    for (var i = 0; i < 6; i++) {
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(-15 + i * 8, 2, 20);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      sceneObjects.push(post);

      if (i < 5) {
        var wirePoints = [
          new THREE.Vector3(-15 + i * 8, 3, 20),
          new THREE.Vector3(-15 + (i + 1) * 8, 3, 20)
        ];
        var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
        sceneObjects.push(wire);
      }
    }
  }

  function createWarCriminal(x, z) {
    var bodyGeometry = new THREE.BoxGeometry(1, 2.5, 0.6);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1.25, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 3, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push(head);
  }

  function createArmedEscort(x, z) {
    var bodyGeometry = new THREE.BoxGeometry(1.2, 2.8, 0.7);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, 1.4, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    var headGeometry = new THREE.SphereGeometry(0.55, 8, 8);
    var headMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 3.2, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push(head);

    var gunGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var gunMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    var gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(x + 0.7, 2.5, z);
    gun.castShadow = true;
    gun.receiveShadow = true;
    scene.add(gun);
    sceneObjects.push(gun);
  }

  function createBlizzardParticles() {
    var particleGeometry = new THREE.SphereGeometry(0.15, 4, 4);
    var particleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    for (var i = 0; i < 100; i++) {
      var particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
      particle.position.set(
        Math.random() * 200 - 100,
        Math.random() * 60 - 10,
        Math.random() * 200 - 100
      );
      particle.scale.set(0.5, 0.5, 0.5);
      scene.add(particle);
      sceneObjects.push(particle);

      particles.push({
        mesh: particle,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 2
        }
      });
    }
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'frozen-tundra-hud';
    hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #ffffff; font-family: monospace; font-size: 14px; z-index: 100; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); line-height: 1.6;';
    hudElement.innerHTML = 'FUGITIVES CAPTURED: 0/3<br>KILOMETERS TRACKED: 0.0<br>TEMPERATURE: -40°C';
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML = 'FUGITIVES CAPTURED: ' + capturedCount + '/3<br>KILOMETERS TRACKED: ' + kmTracked.toFixed(1) + '<br>TEMPERATURE: -40°C';
    }
  }

  function createNotification(message) {
    var notif = document.createElement('div');
    notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: #ffffff; padding: 20px 40px; border-radius: 8px; font-family: monospace; font-size: 18px; z-index: 1000; text-align: center;';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(function() {
      document.body.removeChild(notif);
    }, 1500);
  }

  function handleKeybind(key) {
    keybindBuffer.push(key.toLowerCase());

    if (keybindTimeout) {
      clearTimeout(keybindTimeout);
    }

    keybindTimeout = setTimeout(function() {
      keybindBuffer = [];
    }, KEYBIND_TIMEOUT);

    if (keybindBuffer.length === KEYBIND_SEQUENCE.length) {
      var matches = true;
      for (var i = 0; i < KEYBIND_SEQUENCE.length; i++) {
        if (keybindBuffer[i] !== KEYBIND_SEQUENCE[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        isActive = !isActive;
        keybindBuffer = [];
        clearTimeout(keybindTimeout);
        createNotification(isActive ? 'FROZEN TUNDRA ACTIVATED' : 'FROZEN TUNDRA DEACTIVATED');
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    isActive = true;
    capturedCount = 0;
    kmTracked = 0.0;
    sceneObjects = [];
    particles = [];

    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.Fog(0xffffff, 100, 300);

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(50, 100, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);
    sceneObjects.push(light);

    var ambientLight = new THREE.AmbientLight(0x7799bb, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    createFrozenLake();
    createGulagOutpost();
    createBirchTree(-35, -30);
    createBirchTree(-15, -50);
    createBirchTree(10, -40);
    createBirchTree(40, 30);
    createSnowmobile();
    createPrisonerBarracks();
    createWatchtowerSkeleton();
    createBarbedWireFence();
    createWarCriminal(-25, -20);
    createWarCriminal(15, 15);
    createWarCriminal(35, -30);
    createArmedEscort(-30, -25);
    createArmedEscort(10, 20);
    createBlizzardParticles();

    createHUD();

    document.addEventListener('keydown', function(e) {
      handleKeybind(e.key);
    });

    createNotification('FROZEN TUNDRA ACTIVATED');
  }

  function update(delta) {
    if (!isActive) return;

    if (snowmobileObj) {
      snowmobilePos.x += snowmobileDirection * delta * 3;

      if (snowmobilePos.x > 25) {
        snowmobileDirection = -1;
      } else if (snowmobilePos.x < -25) {
        snowmobileDirection = 1;
      }

      snowmobileObj.body.position.x = snowmobilePos.x;
      snowmobileObj.skiLeft.position.x = snowmobilePos.x - 1.2;
      snowmobileObj.skiRight.position.x = snowmobilePos.x + 1.2;
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.mesh.position.x += p.velocity.x * delta;
      p.mesh.position.y += p.velocity.y * delta;
      p.mesh.position.z += p.velocity.z * delta;

      if (p.mesh.position.x > 100) p.mesh.position.x = -100;
      if (p.mesh.position.x < -100) p.mesh.position.x = 100;
      if (p.mesh.position.y > 40) p.mesh.position.y = -20;
      if (p.mesh.position.y < -20) p.mesh.position.y = 40;
      if (p.mesh.position.z > 100) p.mesh.position.z = -100;
      if (p.mesh.position.z < -100) p.mesh.position.z = 100;
    }

    kmTracked += delta * 0.5;
    updateHUD();
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    particles = [];
    snowmobileObj = null;
    snowmobilePos = { x: 0, z: 0 };
    snowmobileDirection = 1;
    capturedCount = 0;
    kmTracked = 0.0;
    isActive = false;

    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', function(e) {
      handleKeybind(e.key);
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
