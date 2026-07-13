window.VolcanoSummit = (function() {
  'use strict';

  // State
  var state = {
    enabled: true,
    scene: null,
    camera: null,
    objects: [],
    gameTime: 0,
    countdownTime: 720, // 12 minutes in seconds
    deviceDisarmed: false,
    hudNotification: null,
    hudNotificationTime: 0,
    keybindBuffer: '',
    lastKeybindTime: 0
  };

  // Animated objects for update loop
  var animatedObjects = {
    lavaGlow: null,
    fumaroles: [],
    volcanicBombs: [],
    ashParticles: [],
    deviceCountdown: null,
    groundTremor: null
  };

  // Helper: Create and track object
  function createTrackedObject(geometry, material) {
    var mesh = new THREE.Mesh(geometry, material);
    state.objects.push(mesh);
    return mesh;
  }

  // Helper: Create and track group
  function createTrackedGroup() {
    var group = new THREE.Group();
    state.objects.push(group);
    return group;
  }

  // Initialize scene
  function init(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.objects = [];
    state.gameTime = 0;
    state.countdownTime = 720;
    state.deviceDisarmed = false;
    animatedObjects.lavaGlow = null;
    animatedObjects.fumaroles = [];
    animatedObjects.volcanicBombs = [];
    animatedObjects.ashParticles = [];
    animatedObjects.deviceCountdown = null;
    animatedObjects.groundTremor = null;

    // Scene fog - heavy red-orange sulphur
    scene.fog = new THREE.FogExp2(0x8B4513, 0.006);
    scene.background = new THREE.Color(0x5A3A2A);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFF6B35, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFAA44, 0.8);
    directionalLight.position.set(50, 80, 50);
    scene.add(directionalLight);

    // Volcanic mountain base - large angled slopes
    var mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D2817,
      roughness: 0.8,
      metalness: 0.0
    });

    // North slope
    var northSlope = new THREE.Mesh(
      new THREE.BoxGeometry(100, 80, 60),
      mountainMaterial
    );
    northSlope.position.set(0, -20, -50);
    northSlope.rotation.z = 0.4;
    northSlope.castShadow = true;
    northSlope.receiveShadow = true;
    scene.add(northSlope);
    state.objects.push(northSlope);

    // South slope
    var southSlope = new THREE.Mesh(
      new THREE.BoxGeometry(100, 80, 60),
      mountainMaterial
    );
    southSlope.position.set(0, -20, 50);
    southSlope.rotation.z = -0.4;
    southSlope.castShadow = true;
    southSlope.receiveShadow = true;
    scene.add(southSlope);
    state.objects.push(southSlope);

    // East slope
    var eastSlope = new THREE.Mesh(
      new THREE.BoxGeometry(60, 80, 100),
      mountainMaterial
    );
    eastSlope.position.set(50, -20, 0);
    eastSlope.rotation.x = 0.4;
    eastSlope.castShadow = true;
    eastSlope.receiveShadow = true;
    scene.add(eastSlope);
    state.objects.push(eastSlope);

    // West slope
    var westSlope = new THREE.Mesh(
      new THREE.BoxGeometry(60, 80, 100),
      mountainMaterial
    );
    westSlope.position.set(-50, -20, 0);
    westSlope.rotation.x = -0.4;
    westSlope.castShadow = true;
    westSlope.receiveShadow = true;
    scene.add(westSlope);
    state.objects.push(westSlope);

    // Summit rim - rough box formations
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A3C2E,
      roughness: 0.9,
      metalness: 0.0
    });

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var rimX = Math.cos(angle) * 35;
      var rimZ = Math.sin(angle) * 35;

      var rimBlock = new THREE.Mesh(
        new THREE.BoxGeometry(8, 12, 8),
        rimMaterial
      );
      rimBlock.position.set(rimX, 25, rimZ);
      rimBlock.rotation.y = angle;
      rimBlock.castShadow = true;
      rimBlock.receiveShadow = true;
      scene.add(rimBlock);
      state.objects.push(rimBlock);
    }

    // Central caldera - deep cylinder depression
    var calderaDepth = 50;
    var calderaRadius = 30;

    // Caldera sides
    var calderaSideMaterial = new THREE.MeshStandardMaterial({
      color: 0x2D1B0F,
      roughness: 0.95,
      metalness: 0.0
    });

    var calderaCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(calderaRadius, calderaRadius, calderaDepth, 32),
      calderaSideMaterial
    );
    calderaCylinder.position.y = -calderaDepth / 2 - 5;
    calderaCylinder.castShadow = true;
    calderaCylinder.receiveShadow = true;
    scene.add(calderaCylinder);
    state.objects.push(calderaCylinder);

    // Caldera lava bottom - glowing orange/red
    var lavaBottomMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4500,
      emissive: 0xFF2E00,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.1
    });

    var lavaBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(calderaRadius - 2, calderaRadius - 2, 2, 32),
      lavaBottomMaterial
    );
    lavaBottom.position.y = -calderaDepth - 5;
    lavaBottom.castShadow = true;
    lavaBottom.receiveShadow = true;
    scene.add(lavaBottom);
    state.objects.push(lavaBottom);
    animatedObjects.lavaGlow = lavaBottom;

    // Lava flow channels - flat orange emissive box streams
    var lavaFlowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF5722,
      emissive: 0xFF6B35,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.0
    });

    for (var i = 0; i < 3; i++) {
      var flowAngle = (i / 3) * Math.PI * 2;
      var flowStartX = Math.cos(flowAngle) * 30;
      var flowStartZ = Math.sin(flowAngle) * 30;
      var flowEndX = Math.cos(flowAngle) * 60;
      var flowEndZ = Math.sin(flowAngle) * 60;

      var lavaFlow = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 40),
        lavaFlowMaterial
      );
      lavaFlow.position.set(
        (flowStartX + flowEndX) / 2,
        -30,
        (flowStartZ + flowEndZ) / 2
      );
      lavaFlow.rotation.y = flowAngle;
      lavaFlow.castShadow = true;
      scene.add(lavaFlow);
      state.objects.push(lavaFlow);
    }

    // Seismic device at caldera bottom
    var deviceGroupMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.4
    });

    var deviceGroup = createTrackedGroup();
    deviceGroup.position.y = -calderaDepth - 10;

    // Device main box
    var deviceMainBox = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      deviceGroupMaterial
    );
    deviceMainBox.castShadow = true;
    deviceGroup.add(deviceMainBox);

    // Device cylinder component
    var deviceCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 6, 16),
      deviceGroupMaterial
    );
    deviceCylinder.position.y = 6;
    deviceCylinder.castShadow = true;
    deviceGroup.add(deviceCylinder);

    // Device antenna
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.6
    });

    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 12, 8),
      antennaMaterial
    );
    antenna.position.y = 12;
    antenna.castShadow = true;
    deviceGroup.add(antenna);

    // Countdown indicator - red emissive
    var countdownMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.0
    });

    var countdown = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2, 4),
      countdownMaterial
    );
    countdown.position.set(0, -4, 0);
    countdown.castShadow = true;
    deviceGroup.add(countdown);
    animatedObjects.deviceCountdown = countdown;

    scene.add(deviceGroup);

    // Volcanic rock formations - irregular stacked boxes
    var rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A4A3A,
      roughness: 0.9,
      metalness: 0.0
    });

    for (var i = 0; i < 6; i++) {
      var rockX = (Math.random() - 0.5) * 80;
      var rockZ = (Math.random() - 0.5) * 80;

      var rockFormation = createTrackedGroup();
      rockFormation.position.set(rockX, -40, rockZ);

      for (var j = 0; j < 3; j++) {
        var rockBlock = new THREE.Mesh(
          new THREE.BoxGeometry(6, 6, 6),
          rockMaterial
        );
        rockBlock.position.y = j * 7;
        rockBlock.rotation.x = Math.random() * 0.3;
        rockBlock.rotation.z = Math.random() * 0.3;
        rockBlock.castShadow = true;
        rockBlock.receiveShadow = true;
        rockFormation.add(rockBlock);
      }

      scene.add(rockFormation);
    }

    // Ash drift banks - light grey box mounds
    var ashMaterial = new THREE.MeshStandardMaterial({
      color: 0xA9A9A9,
      roughness: 0.95,
      metalness: 0.0
    });

    for (var i = 0; i < 4; i++) {
      var ashX = (Math.random() - 0.5) * 100;
      var ashZ = (Math.random() - 0.5) * 100;

      var ashBank = new THREE.Mesh(
        new THREE.BoxGeometry(20, 8, 25),
        ashMaterial
      );
      ashBank.position.set(ashX, -35, ashZ);
      ashBank.castShadow = true;
      ashBank.receiveShadow = true;
      scene.add(ashBank);
      state.objects.push(ashBank);
    }

    // Fumarole vents - cylinder openings with cone steam
    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A2A,
      roughness: 0.8,
      metalness: 0.0
    });

    var steamMaterial = new THREE.MeshStandardMaterial({
      color: 0xE8E8E8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.7,
      metalness: 0.0
    });

    for (var i = 0; i < 4; i++) {
      var ventAngle = (i / 4) * Math.PI * 2;
      var ventX = Math.cos(ventAngle) * 25;
      var ventZ = Math.sin(ventAngle) * 25;

      var ventGroup = createTrackedGroup();
      ventGroup.position.set(ventX, -15, ventZ);

      // Vent opening
      var ventOpening = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 1, 16),
        ventMaterial
      );
      ventOpening.castShadow = true;
      ventGroup.add(ventOpening);

      // Steam cone
      var steamCone = new THREE.Mesh(
        new THREE.ConeGeometry(4, 10, 16),
        steamMaterial
      );
      steamCone.position.y = 6;
      steamCone.castShadow = true;
      ventGroup.add(steamCone);

      animatedObjects.fumaroles.push({ group: ventGroup, cone: steamCone });
      scene.add(ventGroup);
    }

    // Rope rappel anchor points - cylinder bolts in rock
    var boltMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.6,
      metalness: 0.7
    });

    for (var i = 0; i < 5; i++) {
      var boltAngle = (i / 5) * Math.PI * 2;
      var boltX = Math.cos(boltAngle) * 32;
      var boltZ = Math.sin(boltAngle) * 32;

      var bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 8),
        boltMaterial
      );
      bolt.position.set(boltX, 22, boltZ);
      bolt.castShadow = true;
      scene.add(bolt);
      state.objects.push(bolt);
    }

    // Supply cache - box covered in ash
    var cacheMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.85,
      metalness: 0.0
    });

    var cacheBox = new THREE.Mesh(
      new THREE.BoxGeometry(6, 5, 8),
      cacheMaterial
    );
    cacheBox.position.set(-25, -38, -30);
    cacheBox.castShadow = true;
    cacheBox.receiveShadow = true;
    scene.add(cacheBox);
    state.objects.push(cacheBox);

    var cacheAsh = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 2, 8.5),
      ashMaterial
    );
    cacheAsh.position.set(-25, -33, -30);
    cacheAsh.castShadow = true;
    scene.add(cacheAsh);
    state.objects.push(cacheAsh);

    // Volcanic bomb craters - sphere depressions
    var craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x3A2A1A,
      roughness: 0.9,
      metalness: 0.0
    });

    for (var i = 0; i < 3; i++) {
      var craterX = (Math.random() - 0.5) * 90;
      var craterZ = (Math.random() - 0.5) * 90;

      var crater = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        craterMaterial
      );
      crater.scale.y = 0.4;
      crater.position.set(craterX, -42, craterZ);
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
      state.objects.push(crater);
    }

    // Lava bomb trajectory arcs - spheres in motion path
    var bombMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4500,
      emissive: 0xFF2E00,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.1
    });

    for (var i = 0; i < 4; i++) {
      var bomb = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        bombMaterial
      );
      bomb.position.set(
        (Math.random() - 0.5) * 60,
        -20 + Math.random() * 30,
        (Math.random() - 0.5) * 60
      );
      bomb.castShadow = true;
      scene.add(bomb);
      state.objects.push(bomb);
      animatedObjects.volcanicBombs.push({
        mesh: bomb,
        startPos: bomb.position.clone(),
        startTime: Math.random() * 10,
        duration: 3 + Math.random() * 2
      });
    }

    // Research station remnant - damaged box building
    var stationMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.8,
      metalness: 0.0
    });

    var stationMain = new THREE.Mesh(
      new THREE.BoxGeometry(12, 10, 15),
      stationMaterial
    );
    stationMain.position.set(35, -30, 40);
    stationMain.castShadow = true;
    stationMain.receiveShadow = true;
    scene.add(stationMain);
    state.objects.push(stationMain);

    var stationRoof = new THREE.Mesh(
      new THREE.ConeGeometry(8, 6, 8),
      stationMaterial
    );
    stationRoof.position.set(35, -22, 40);
    stationRoof.castShadow = true;
    scene.add(stationRoof);
    state.objects.push(stationRoof);

    // Gas mask station - box + sphere
    var maskStationBox = new THREE.Mesh(
      new THREE.BoxGeometry(5, 6, 5),
      stationMaterial
    );
    maskStationBox.position.set(-35, -35, -40);
    maskStationBox.castShadow = true;
    scene.add(maskStationBox);
    state.objects.push(maskStationBox);

    var maskStationSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xC0C0C0,
        roughness: 0.5,
        metalness: 0.3
      })
    );
    maskStationSphere.position.set(-35, -27, -40);
    maskStationSphere.castShadow = true;
    scene.add(maskStationSphere);
    state.objects.push(maskStationSphere);

    // Sulphur crystals - yellow sphere clusters
    var sulphurMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.1
    });

    for (var i = 0; i < 5; i++) {
      var clusterX = (Math.random() - 0.5) * 70;
      var clusterZ = (Math.random() - 0.5) * 70;

      var clusterGroup = createTrackedGroup();
      clusterGroup.position.set(clusterX, -40, clusterZ);

      for (var j = 0; j < 4; j++) {
        var crystal = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 8, 8),
          sulphurMaterial
        );
        crystal.position.set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        );
        crystal.castShadow = true;
        clusterGroup.add(crystal);
      }

      scene.add(clusterGroup);
    }

    // Falling ash particles - sphere cluster descending
    for (var i = 0; i < 10; i++) {
      var ashParticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 4, 4),
        ashMaterial
      );
      ashParticle.position.set(
        (Math.random() - 0.5) * 100,
        Math.random() * 80 - 60,
        (Math.random() - 0.5) * 100
      );
      ashParticle.castShadow = true;
      scene.add(ashParticle);
      state.objects.push(ashParticle);
      animatedObjects.ashParticles.push({
        mesh: ashParticle,
        speed: 2 + Math.random() * 3,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    // Ground tremor reference
    animatedObjects.groundTremor = { intensity: 0, basePos: scene.position.clone() };

    // Enemy volcanologists - box figures with sphere helmets
    var enemyCount = 3;
    for (var i = 0; i < enemyCount; i++) {
      var enemyGroup = createTrackedGroup();
      enemyGroup.position.set(
        (Math.random() - 0.5) * 60,
        -35,
        (Math.random() - 0.5) * 60
      );

      // Body
      var enemyBody = new THREE.Mesh(
        new THREE.BoxGeometry(3, 6, 3),
        new THREE.MeshStandardMaterial({
          color: 0x2E5D6E,
          roughness: 0.6,
          metalness: 0.2
        })
      );
      enemyBody.castShadow = true;
      enemyGroup.add(enemyBody);

      // Helmet
      var enemyHelmet = new THREE.Mesh(
        new THREE.SphereGeometry(2, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.3,
          metalness: 0.5
        })
      );
      enemyHelmet.position.y = 4;
      enemyHelmet.castShadow = true;
      enemyGroup.add(enemyHelmet);

      scene.add(enemyGroup);
    }

    // Setup keyboard handling
    document.addEventListener('keydown', function(e) {
      handleKeyPress(e.key.toUpperCase());
    });
  }

  function handleKeyPress(key) {
    var now = Date.now();

    // Check for V+S keybind (V then S within 400ms)
    if (key === 'V') {
      state.keybindBuffer = 'V';
      state.lastKeybindTime = now;
    } else if (key === 'S' && state.keybindBuffer === 'V' && (now - state.lastKeybindTime) < 400) {
      state.enabled = !state.enabled;
      showHUDNotification(state.enabled ? 'VOLCANO SUMMIT: ENABLED' : 'VOLCANO SUMMIT: DISABLED');
      state.keybindBuffer = '';
    } else if (now - state.lastKeybindTime > 400) {
      state.keybindBuffer = '';
    }
  }

  function showHUDNotification(message) {
    state.hudNotification = message;
    state.hudNotificationTime = 3.0;
  }

  // Update loop
  function update(delta) {
    if (!state.enabled || !state.scene) {
      return;
    }

    state.gameTime += delta;
    if (state.hudNotificationTime > 0) {
      state.hudNotificationTime -= delta;
    }

    // Update countdown timer
    if (!state.deviceDisarmed) {
      state.countdownTime -= delta;
      if (state.countdownTime < 0) {
        state.countdownTime = 0;
      }
    }

    // Lava glow pulse
    if (animatedObjects.lavaGlow) {
      var glowIntensity = 0.8 + Math.sin(state.gameTime * 2) * 0.3;
      animatedObjects.lavaGlow.material.emissiveIntensity = glowIntensity;
    }

    // Fumarole steam animation
    for (var i = 0; i < animatedObjects.fumaroles.length; i++) {
      var fum = animatedObjects.fumaroles[i];
      var steamScale = 0.8 + Math.sin(state.gameTime * 1.5 + i) * 0.4;
      fum.cone.scale.y = steamScale;
    }

    // Volcanic bombs lofting
    for (var i = 0; i < animatedObjects.volcanicBombs.length; i++) {
      var bomb = animatedObjects.volcanicBombs[i];
      var elapsed = state.gameTime - bomb.startTime;
      var t = (elapsed % bomb.duration) / bomb.duration;

      if (elapsed >= 0) {
        var trajectory = Math.sin(t * Math.PI);
        bomb.mesh.position.copy(bomb.startPos);
        bomb.mesh.position.y += trajectory * 40;
        bomb.mesh.position.x += Math.cos(state.gameTime * 0.5) * 20 * trajectory;
        bomb.mesh.position.z += Math.sin(state.gameTime * 0.3) * 20 * trajectory;
      }
    }

    // Device countdown speed increase
    if (animatedObjects.deviceCountdown && !state.deviceDisarmed) {
      var countdownSpeed = 1 + (720 - state.countdownTime) / 720 * 2;
      animatedObjects.deviceCountdown.material.emissiveIntensity = 0.5 + Math.sin(state.gameTime * countdownSpeed * 3) * 0.4;
    }

    // Ash falling
    for (var i = 0; i < animatedObjects.ashParticles.length; i++) {
      var ash = animatedObjects.ashParticles[i];
      ash.mesh.position.y -= ash.speed * delta;

      // Bob movement
      ash.mesh.position.x += Math.sin(state.gameTime * 0.5 + ash.bobOffset) * 0.05;

      // Reset if too low
      if (ash.mesh.position.y < -80) {
        ash.mesh.position.y = 30;
        ash.mesh.position.x = (Math.random() - 0.5) * 100;
        ash.mesh.position.z = (Math.random() - 0.5) * 100;
      }
    }

    // Ground tremor - entire scene subtle oscillation
    if (animatedObjects.groundTremor) {
      var tremorIntensity = Math.sin(state.gameTime * 2.5) * 0.05;
      state.scene.position.y = tremorIntensity;
    }
  }

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // Reset function
  function reset() {
    // Remove all tracked objects
    for (var i = 0; i < state.objects.length; i++) {
      if (state.objects[i].parent) {
        state.objects[i].parent.remove(state.objects[i]);
      } else {
        state.scene.remove(state.objects[i]);
      }
    }

    state.objects = [];
    state.gameTime = 0;
    state.countdownTime = 720;
    state.deviceDisarmed = false;
    state.hudNotification = null;
    state.hudNotificationTime = 0;
    animatedObjects.lavaGlow = null;
    animatedObjects.fumaroles = [];
    animatedObjects.volcanicBombs = [];
    animatedObjects.ashParticles = [];
    animatedObjects.deviceCountdown = null;
    animatedObjects.groundTremor = null;

    if (state.scene) {
      state.scene.position.set(0, 0, 0);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
