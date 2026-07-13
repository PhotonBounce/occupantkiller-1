window.LaserGrid = (function() {
  'use strict';

  // Scene objects cache
  var scene;
  var camera;
  var renderer;
  var objects = [];
  var laserBeams = [];
  var motionSensors = [];
  var pressurePlates = [];
  var securityGuards = [];
  var laserEmitters = [];
  var securityCameras = [];
  var time = 0;
  var hudCanvas;
  var hudContext;
  var hudTexture;
  var hudEnabled = true;
  var keyPressHistory = [];
  var lastKeyPressTime = 0;

  function createLaserGridScene(sceneObj, cameraObj, rendererObj) {
    scene = sceneObj;
    camera = cameraObj;
    renderer = rendererObj;
    objects = [];
    laserBeams = [];
    motionSensors = [];
    pressurePlates = [];
    securityGuards = [];
    laserEmitters = [];
    securityCameras = [];

    // 1. Polished floor - large flat box, marble white
    var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -5;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // 2. Ceiling - flat box overhead, dark
    var ceilingGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3, roughness: 0.8 });
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.y = 35;
    scene.add(ceiling);
    objects.push(ceiling);

    // 3. Laser emitter units - 12 total on wall mounts
    for (var i = 0; i < 12; i++) {
      var emitterGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var emitterMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.5, metalness: 0.8 });
      var emitter = new THREE.Mesh(emitterGeom, emitterMat);

      var angle = (i / 12) * Math.PI * 2;
      var radius = 35;
      emitter.position.x = Math.cos(angle) * radius;
      emitter.position.z = Math.sin(angle) * radius;
      emitter.position.y = 15 + Math.random() * 10;
      emitter.castShadow = true;

      scene.add(emitter);
      objects.push(emitter);
      laserEmitters.push(emitter);
    }

    // 4. Laser beams - LineSegments in grid pattern, emissive red
    var laserMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3, emissive: 0xff0000 });

    // Create crisscross laser grid
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 6; j++) {
        var x = -20 + i * 8;
        var z = -20 + j * 8;
        var y = 5 + (i + j) * 2;

        var points1 = [
          new THREE.Vector3(x, y, z),
          new THREE.Vector3(x + 6, y + 3, z + 6)
        ];
        var geom1 = new THREE.BufferGeometry().setFromPoints(points1);
        var beam1 = new THREE.LineSegments(geom1, laserMat);
        scene.add(beam1);
        objects.push(beam1);
        laserBeams.push(beam1);

        var points2 = [
          new THREE.Vector3(x + 6, y + 3, z),
          new THREE.Vector3(x, y, z + 6)
        ];
        var geom2 = new THREE.BufferGeometry().setFromPoints(points2);
        var beam2 = new THREE.LineSegments(geom2, laserMat);
        scene.add(beam2);
        objects.push(beam2);
        laserBeams.push(beam2);
      }
    }

    // 5. Laser beam reflectors - small box mirrors at angles
    for (var i = 0; i < 8; i++) {
      var reflectorGeom = new THREE.BoxGeometry(0.8, 0.8, 3);
      var reflectorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
      var reflector = new THREE.Mesh(reflectorGeom, reflectorMat);

      reflector.position.x = -25 + i * 7;
      reflector.position.y = 8;
      reflector.position.z = -15;
      reflector.rotation.y = Math.PI / 4;
      reflector.castShadow = true;

      scene.add(reflector);
      objects.push(reflector);
    }

    // 6. Motion sensor units - 6 on cylinder poles
    for (var i = 0; i < 6; i++) {
      var angle = (i / 6) * Math.PI * 2;
      var radius = 28;
      var poleX = Math.cos(angle) * radius;
      var poleZ = Math.sin(angle) * radius;

      // Pole
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
      var poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(poleX, 6, poleZ);
      pole.castShadow = true;
      scene.add(pole);
      objects.push(pole);

      // Sensor box on top
      var sensorGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var sensorMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.3 });
      var sensor = new THREE.Mesh(sensorGeom, sensorMat);
      sensor.position.set(poleX, 12, poleZ);
      sensor.castShadow = true;
      scene.add(sensor);
      objects.push(sensor);
      motionSensors.push(sensor);
    }

    // 7. Pressure plate tiles - flat boxes in floor, emissive when active
    for (var i = 0; i < 10; i++) {
      var plateGeom = new THREE.BoxGeometry(3, 0.3, 3);
      var plateMat = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0x444444, emissiveIntensity: 0 });
      var plate = new THREE.Mesh(plateGeom, plateMat);

      plate.position.x = -30 + i * 7;
      plate.position.y = -4.85;
      plate.position.z = 0;
      plate.castShadow = true;
      plate.isActive = false;
      plate.pulseTime = Math.random() * Math.PI * 2;

      scene.add(plate);
      objects.push(plate);
      pressurePlates.push(plate);
    }

    // 8. Central vault door - massive box door, chrome emissive
    var vaultGeom = new THREE.BoxGeometry(8, 15, 1.5);
    var vaultMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, emissive: 0x555555, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1 });
    var vault = new THREE.Mesh(vaultGeom, vaultMat);
    vault.position.set(0, 7.5, -30);
    vault.castShadow = true;
    scene.add(vault);
    objects.push(vault);

    // 9. Security camera network - box cameras + cylinder mounts, 4x
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var camX = Math.cos(angle) * 32;
      var camZ = Math.sin(angle) * 32;

      // Mount bracket (cylinder)
      var bracketGeom = new THREE.CylinderGeometry(0.25, 0.25, 2, 6);
      var bracketMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.position.set(camX, 30, camZ);
      scene.add(bracket);
      objects.push(bracket);

      // Camera box
      var camGeom = new THREE.BoxGeometry(1.2, 0.8, 1.5);
      var camMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
      var camera_obj = new THREE.Mesh(camGeom, camMat);
      camera_obj.position.set(camX, 30.5, camZ);
      camera_obj.castShadow = true;
      camera_obj.panAngle = 0;
      scene.add(camera_obj);
      objects.push(camera_obj);
      securityCameras.push(camera_obj);
    }

    // 10. Control panel - box console with emissive screen
    var panelGeom = new THREE.BoxGeometry(4, 5, 1.5);
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6 });
    var panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.set(30, 7.5, 25);
    panel.rotation.y = -Math.PI / 6;
    panel.castShadow = true;
    scene.add(panel);
    objects.push(panel);

    // Screen
    var screenGeom = new THREE.BoxGeometry(3, 3, 0.3);
    var screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(30, 8.5, 25.8);
    scene.add(screen);
    objects.push(screen);

    // 11. Art piece display - box pedestal + emissive sphere artifact
    var pedestalGeom = new THREE.BoxGeometry(4, 3, 4);
    var pedestalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.4 });
    var pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
    pedestal.position.set(0, 1.5, 15);
    pedestal.castShadow = true;
    scene.add(pedestal);
    objects.push(pedestal);

    var artifactGeom = new THREE.SphereGeometry(1.5, 32, 32);
    var artifactMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.7 });
    var artifact = new THREE.Mesh(artifactGeom, artifactMat);
    artifact.position.set(0, 5, 15);
    artifact.castShadow = true;
    scene.add(artifact);
    objects.push(artifact);

    // 12. Wall display frames - box frames with emissive flat contents
    for (var i = 0; i < 4; i++) {
      var frameGeom = new THREE.BoxGeometry(3, 3, 0.5);
      var frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.2 });
      var frame = new THREE.Mesh(frameGeom, frameMat);

      frame.position.x = -30 + i * 20;
      frame.position.y = 20;
      frame.position.z = -28;
      frame.castShadow = true;
      scene.add(frame);
      objects.push(frame);

      // Content inside frame
      var contentGeom = new THREE.BoxGeometry(2.8, 2.8, 0.1);
      var contentMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 0.5 });
      var content = new THREE.Mesh(contentGeom, contentMat);
      content.position.x = frame.position.x;
      content.position.y = frame.position.y;
      content.position.z = frame.position.z + 0.3;
      scene.add(content);
      objects.push(content);
    }

    // 13. Thief figure - dark box+sphere, crouching
    var thiefBodyGeom = new THREE.BoxGeometry(1, 2, 1);
    var thiefMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.3 });
    var thiefBody = new THREE.Mesh(thiefBodyGeom, thiefMat);
    thiefBody.position.set(15, 3, 10);
    thiefBody.castShadow = true;
    scene.add(thiefBody);
    objects.push(thiefBody);

    var thiefHeadGeom = new THREE.SphereGeometry(0.6, 16, 16);
    var thiefHead = new THREE.Mesh(thiefHeadGeom, thiefMat);
    thiefHead.position.set(15, 4.5, 10);
    thiefHead.castShadow = true;
    scene.add(thiefHead);
    objects.push(thiefHead);

    // 14. Security guard patrol - box+sphere, armed, 3 guards
    for (var i = 0; i < 3; i++) {
      var guardBodyGeom = new THREE.BoxGeometry(1.2, 3, 0.8);
      var guardMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.4 });
      var guardBody = new THREE.Mesh(guardBodyGeom, guardMat);
      guardBody.position.set(-20 + i * 15, 4.5, -20);
      guardBody.castShadow = true;
      guardBody.patrolPos = i;
      scene.add(guardBody);
      objects.push(guardBody);
      securityGuards.push(guardBody);

      var guardHeadGeom = new THREE.SphereGeometry(0.7, 16, 16);
      var guardHead = new THREE.Mesh(guardHeadGeom, guardMat);
      guardHead.position.set(guardBody.position.x, 6, guardBody.position.z);
      guardHead.castShadow = true;
      scene.add(guardHead);
      objects.push(guardHead);
    }

    // 15. Smoke grenade effect - semi-transparent grey sphere expanding
    var smokeGeom = new THREE.SphereGeometry(2, 16, 16);
    var smokeMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.4 });
    var smoke = new THREE.Mesh(smokeGeom, smokeMat);
    smoke.position.set(10, 5, 0);
    smoke.scale.set(0.1, 0.1, 0.1);
    scene.add(smoke);
    objects.push(smoke);

    // 16. Emergency strobe light - emissive white sphere, ceiling mounted
    var strobeGeom = new THREE.SphereGeometry(0.8, 16, 16);
    var strobeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
    var strobe = new THREE.Mesh(strobeGeom, strobeMat);
    strobe.position.set(0, 34, 0);
    scene.add(strobe);
    objects.push(strobe);

    // 17. Backup power unit - box with emissive indicator lights
    var powerGeom = new THREE.BoxGeometry(2, 3, 2);
    var powerMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5 });
    var powerUnit = new THREE.Mesh(powerGeom, powerMat);
    powerUnit.position.set(-30, 5, -25);
    powerUnit.castShadow = true;
    scene.add(powerUnit);
    objects.push(powerUnit);

    // Power indicator lights
    for (var i = 0; i < 3; i++) {
      var lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var lightMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
      var light_ind = new THREE.Mesh(lightGeom, lightMat);
      light_ind.position.set(-30 + (i - 1) * 1, 6 + i * 0.5, -24);
      scene.add(light_ind);
      objects.push(light_ind);
    }

    // Setup HUD canvas
    setupHUD();

    // Setup keyboard listener for HUD toggle
    window.addEventListener('keydown', handleKeyDown);
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 128;
    hudContext = hudCanvas.getContext('2d');

    hudTexture = new THREE.CanvasTexture(hudCanvas);
    hudTexture.magFilter = THREE.LinearFilter;
    hudTexture.minFilter = THREE.LinearFilter;

    var hudGeom = new THREE.PlaneGeometry(12, 3);
    var hudMat = new THREE.MeshBasicMaterial({ map: hudTexture });
    var hudMesh = new THREE.Mesh(hudGeom, hudMat);
    hudMesh.position.set(0, 25, -35);
    scene.add(hudMesh);
    objects.push(hudMesh);
  }

  function updateHUD() {
    if (!hudEnabled) {
      hudContext.fillStyle = 'rgba(0, 0, 0, 1)';
      hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
      hudTexture.needsUpdate = true;
      return;
    }

    hudContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudContext.fillStyle = '#00ff00';
    hudContext.font = 'bold 28px monospace';
    hudContext.fillText('LASER GRID: ACTIVE', 20, 45);

    hudContext.fillStyle = '#ffff00';
    hudContext.font = '20px monospace';
    hudContext.fillText('MOTION SENSORS: 6 ARMED', 20, 85);

    hudContext.fillStyle = '#ff6600';
    hudContext.font = '20px monospace';
    hudContext.fillText('VAULT STATUS: LOCKED', 20, 110);

    hudTexture.needsUpdate = true;
  }

  function handleKeyDown(event) {
    var now = Date.now();

    // Check for L+G keybind (L then G within 400ms)
    if (event.key.toLowerCase() === 'l') {
      keyPressHistory.push('l');
      lastKeyPressTime = now;
    } else if (event.key.toLowerCase() === 'g') {
      if (keyPressHistory.length > 0 && keyPressHistory[keyPressHistory.length - 1] === 'l' && (now - lastKeyPressTime) < 400) {
        hudEnabled = !hudEnabled;
        keyPressHistory = [];
      } else {
        keyPressHistory = ['g'];
        lastKeyPressTime = now;
      }
    } else {
      keyPressHistory = [];
    }

    // Clear old history
    if (now - lastKeyPressTime > 400) {
      keyPressHistory = [];
    }
  }

  function update(deltaTime) {
    time += deltaTime;

    // Animate laser emitters - rotate to shift beam positions
    for (var i = 0; i < laserEmitters.length; i++) {
      laserEmitters[i].rotation.y += deltaTime * 0.3;
      laserEmitters[i].rotation.z += deltaTime * 0.2;
    }

    // Animate pressure plates - pulse when active
    for (var i = 0; i < pressurePlates.length; i++) {
      pressurePlates[i].pulseTime += deltaTime * 2;
      var pulse = Math.sin(pressurePlates[i].pulseTime) * 0.5 + 0.5;
      pressurePlates[i].material.emissiveIntensity = pulse * 0.5;
    }

    // Animate security cameras - pan back and forth
    for (var i = 0; i < securityCameras.length; i++) {
      var pan = Math.sin(time * 0.8 + i) * 0.4;
      securityCameras[i].rotation.y = pan;
    }

    // Animate security guards - patrol between displays
    for (var i = 0; i < securityGuards.length; i++) {
      var baseX = -20 + i * 15;
      var patrolOffset = Math.sin(time * 0.5 + i * 2) * 8;
      securityGuards[i].position.x = baseX + patrolOffset;
    }

    // Animate thief - crouching/moving toward vault
    var thiefObjects = objects.filter(function(obj) {
      return obj.position &&
             obj.position.x !== undefined &&
             obj.position.y < 5 &&
             obj.position.x > 10 &&
             obj.position.x < 20;
    });
    if (thiefObjects.length > 0) {
      var thiefBody = thiefObjects[0];
      thiefBody.position.z += Math.sin(time * 0.3) * 0.05;
      thiefBody.rotation.x = Math.sin(time * 0.4) * 0.1;
    }

    // Animate smoke grenade - expand
    var smokeObj = objects[objects.length - 6];
    if (smokeObj && smokeObj.position.x === 10) {
      var scale = 0.1 + time * 0.3;
      if (scale < 3) {
        smokeObj.scale.set(scale, scale, scale);
      }
    }

    // Animate strobe light - flash
    var strobeObj = objects[objects.length - 4];
    if (strobeObj) {
      var strobeIntensity = Math.abs(Math.sin(time * 6)) > 0.7 ? 0.8 : 0.1;
      strobeObj.material.emissiveIntensity = strobeIntensity;
    }

    // Update HUD
    updateHUD();
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
      scene.remove(objects[i]);
    }

    // Clear arrays
    objects = [];
    laserBeams = [];
    motionSensors = [];
    pressurePlates = [];
    securityGuards = [];
    laserEmitters = [];
    securityCameras = [];

    // Remove keyboard listener
    window.removeEventListener('keydown', handleKeyDown);

    // Dispose textures
    if (hudTexture) {
      hudTexture.dispose();
    }
  }

  return {
    init: function(sceneObj, cameraObj, rendererObj) {
      createLaserGridScene(sceneObj, cameraObj, rendererObj);
    },
    update: function(deltaTime) {
      update(deltaTime);
    },
    reset: function() {
      reset();
    }
  };
}());
