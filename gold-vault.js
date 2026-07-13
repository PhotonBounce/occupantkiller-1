window.GoldVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var guards = [];
  var lasers = [];
  var hudOverlay = null;
  var hudVisible = true;
  var lastKeyPressTime = 0;
  var gPressed = false;
  var alarmsTriggered = false;
  var alarmStartTime = 0;

  var gameState = {
    goldStacks: 0,
    guardsDefeated: 0,
    alarmsActive: false
  };

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    guards = [];
    lasers = [];

    // Vault chamber floor
    var floorGeometry = new THREE.BoxGeometry(50, 1, 40);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // Vault main door - massive cylinder
    var doorGeometry = new THREE.CylinderGeometry(8, 8, 2, 32);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0x222222
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-20, 2, 0);
    door.rotation.z = Math.PI / 2;
    door.castShadow = true;
    scene.add(door);
    objects.push(door);

    // Secondary blast door left half
    var blastDoor1Geometry = new THREE.BoxGeometry(8, 6, 0.5);
    var blastMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      metalness: 0.9,
      roughness: 0.1
    });
    var blastDoor1 = new THREE.Mesh(blastDoor1Geometry, blastMaterial);
    blastDoor1.position.set(-10, 2, -8);
    blastDoor1.castShadow = true;
    scene.add(blastDoor1);
    objects.push(blastDoor1);

    // Secondary blast door right half
    var blastDoor2 = new THREE.Mesh(blastDoor1Geometry, blastMaterial);
    blastDoor2.position.set(-10, 2, 8);
    blastDoor2.castShadow = true;
    scene.add(blastDoor2);
    objects.push(blastDoor2);

    // Gold bar stacks - 12 stacks arranged in rows
    for (var i = 0; i < 12; i++) {
      var goldGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
      var goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.2,
        emissive: 0x666600
      });
      var goldStack = new THREE.Mesh(goldGeometry, goldMaterial);

      var col = i % 4;
      var row = Math.floor(i / 4);
      goldStack.position.set(5 + col * 4, 1, -12 + row * 6);
      goldStack.castShadow = true;
      scene.add(goldStack);
      objects.push(goldStack);
    }

    // Safety deposit box wall
    var boxWallGeometry = new THREE.BoxGeometry(15, 8, 1);
    var boxWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });
    var boxWall = new THREE.Mesh(boxWallGeometry, boxWallMaterial);
    boxWall.position.set(20, 3, -15);
    boxWall.castShadow = true;
    scene.add(boxWall);
    objects.push(boxWall);

    // Laser tripwire grid
    var laserGeometry = new THREE.BufferGeometry();
    var laserPositions = [];
    for (var x = -15; x <= 15; x += 5) {
      laserPositions.push(x, 2, -10);
      laserPositions.push(x, 2, 10);
    }
    for (var z = -10; z <= 10; z += 5) {
      laserPositions.push(-15, 2, z);
      laserPositions.push(15, 2, z);
    }
    laserGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(laserPositions), 3));
    var laserMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      linewidth: 2
    });
    var laserLines = new THREE.LineSegments(laserGeometry, laserMaterial);
    scene.add(laserLines);
    objects.push(laserLines);
    lasers.push({ object: laserLines, material: laserMaterial, baseEmissive: 0xff0000 });

    // Security keypad
    var keypadGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.1);
    var keypadMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2
    });
    var keypad = new THREE.Mesh(keypadGeometry, keypadMaterial);
    keypad.position.set(-18, 2, -18);
    keypad.castShadow = true;
    scene.add(keypad);
    objects.push(keypad);

    // Security keypad screen (emissive green)
    var screenGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.02);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x001a00,
      emissive: 0x00ff00,
      metalness: 0.5
    });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-18, 2, -17.95);
    scene.add(screen);
    objects.push(screen);

    // Armed vault guards - 4 guards
    for (var g = 0; g < 4; g++) {
      var guardGroup = new THREE.Group();

      // Guard body
      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var guardMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.4
      });
      var body = new THREE.Mesh(bodyGeometry, guardMaterial);
      body.castShadow = true;
      guardGroup.add(body);

      // Guard head
      var headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        metalness: 0.3,
        roughness: 0.7
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.2;
      head.castShadow = true;
      guardGroup.add(head);

      guardGroup.position.set(-8 + g * 6, 0, 12);
      scene.add(guardGroup);
      objects.push(guardGroup);
      guards.push({
        object: guardGroup,
        x: guardGroup.position.x,
        z: guardGroup.position.z,
        direction: 1,
        distance: 8
      });
    }

    // Surveillance camera
    var cameraBodyGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6);
    var cameraMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.3
    });
    var cameraBody = new THREE.Mesh(cameraBodyGeometry, cameraMaterial);
    cameraBody.castShadow = true;

    var lensGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    var lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0.9,
      roughness: 0.1
    });
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.z = 0.35;
    cameraBody.add(lens);

    var cameraPoleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 16);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.6,
      roughness: 0.4
    });
    var cameraPole = new THREE.Mesh(cameraPoleGeometry, poleMaterial);
    cameraPole.position.set(22, 1.5, 15);
    cameraPole.castShadow = true;
    scene.add(cameraPole);
    objects.push(cameraPole);

    cameraBody.position.set(22, 3, 15);
    scene.add(cameraBody);
    objects.push(cameraBody);

    // Emergency power generator
    var genBodyGeometry = new THREE.BoxGeometry(2, 2, 2);
    var genMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.5,
      roughness: 0.5
    });
    var genBody = new THREE.Mesh(genBodyGeometry, genMaterial);
    genBody.position.set(28, 1, -12);
    genBody.castShadow = true;
    scene.add(genBody);
    objects.push(genBody);

    var exhaustGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 16);
    var exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.4,
      roughness: 0.6
    });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(28, 2.5, -12);
    exhaust.castShadow = true;
    scene.add(exhaust);
    objects.push(exhaust);

    // Ventilation duct
    var ventGeometry = new THREE.CylinderGeometry(1, 1, 50, 32);
    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      metalness: 0.6,
      roughness: 0.4
    });
    var ventDuct = new THREE.Mesh(ventGeometry, ventMaterial);
    ventDuct.rotation.z = Math.PI / 2;
    ventDuct.position.y = 9;
    ventDuct.castShadow = true;
    scene.add(ventDuct);
    objects.push(ventDuct);

    // Banker hostage
    var hostageGroupGeometry = new THREE.BoxGeometry(0.5, 1.6, 0.3);
    var hostageMaterial = new THREE.MeshStandardMaterial({
      color: 0x4169e1,
      metalness: 0.2,
      roughness: 0.8
    });
    var hostageBody = new THREE.Mesh(hostageGroupGeometry, hostageMaterial);
    hostageBody.castShadow = true;

    var hostageHeadGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    var headColor = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      metalness: 0.1,
      roughness: 0.9
    });
    var hostageHead = new THREE.Mesh(hostageHeadGeometry, headColor);
    hostageHead.position.y = 1.1;
    hostageHead.castShadow = true;
    hostageBody.add(hostageHead);

    hostageBody.position.set(5, 0, -20);
    scene.add(hostageBody);
    objects.push(hostageBody);

    // Drill equipment
    var drillRigGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
    var drillMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.5,
      roughness: 0.5
    });
    var drillRig = new THREE.Mesh(drillRigGeometry, drillMaterial);
    drillRig.position.set(22, 1, -18);
    drillRig.castShadow = true;
    scene.add(drillRig);
    objects.push(drillRig);

    var drillBitGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
    var drillBitMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      metalness: 0.8,
      roughness: 0.2
    });
    var drillBit = new THREE.Mesh(drillBitGeometry, drillBitMaterial);
    drillBit.position.set(22, 2, -18);
    drillBit.castShadow = true;
    scene.add(drillBit);
    objects.push(drillBit);

    // Duffel bags of gold
    for (var b = 0; b < 3; b++) {
      var bagGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
      var bagMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.7,
        roughness: 0.4
      });
      var bag = new THREE.Mesh(bagGeometry, bagMaterial);
      bag.position.set(12 + b * 2, 0.3, 8);
      bag.castShadow = true;
      scene.add(bag);
      objects.push(bag);
    }

    // Vault floor safe
    var safeGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    var safeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.2
    });
    var safe = new THREE.Mesh(safeGeometry, safeMaterial);
    safe.position.set(0, -0.3, 0);
    safe.castShadow = true;
    scene.add(safe);
    objects.push(safe);

    // Safe lid
    var lidGeometry = new THREE.BoxGeometry(1.2, 0.2, 1.2);
    var lidMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.8,
      roughness: 0.2
    });
    var lid = new THREE.Mesh(lidGeometry, lidMaterial);
    lid.position.set(0, 0.5, 0);
    lid.castShadow = true;
    scene.add(lid);
    objects.push(lid);

    // Alarm panel
    var alarmPanelGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    var alarmMaterial = new THREE.MeshStandardMaterial({
      color: 0x330000,
      metalness: 0.6,
      roughness: 0.4,
      emissive: 0x660000
    });
    var alarmPanel = new THREE.Mesh(alarmPanelGeometry, alarmMaterial);
    alarmPanel.position.set(25, 2, 18);
    alarmPanel.castShadow = true;
    scene.add(alarmPanel);
    objects.push(alarmPanel);

    // Escape tunnel entrance
    var tunnelGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var tunnelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.3,
      roughness: 0.7
    });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(-25, 1, 0);
    tunnel.castShadow = true;
    scene.add(tunnel);
    objects.push(tunnel);

    // Create HUD overlay
    createHUD();

    // Setup keyboard listeners
    setupKeyboardListeners();
  }

  function createHUD() {
    if (hudOverlay) {
      document.body.removeChild(hudOverlay);
    }

    hudOverlay = document.createElement('div');
    hudOverlay.id = 'gold-vault-hud';
    hudOverlay.style.cssText = 'position: fixed; top: 20px; left: 20px; font-family: monospace; font-size: 14px; color: #00ff00; text-shadow: 0 0 10px #00ff00; background: rgba(0,0,0,0.7); padding: 10px; border: 2px solid #00ff00; z-index: 1000;';

    var content = 'GOLD SECURED: ' + gameState.goldStacks + '/12 STACKS\n';
    content += 'VAULT ALARMS: ' + (gameState.alarmsActive ? 'ACTIVE' : 'DORMANT') + '\n';
    content += 'GUARDS DOWN: ' + gameState.guardsDefeated + '/4';

    hudOverlay.textContent = content;
    document.body.appendChild(hudOverlay);
  }

  function setupKeyboardListeners() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key === 'g' || event.key === 'G') {
        gPressed = true;
        lastKeyPressTime = now;
      } else if ((event.key === 'v' || event.key === 'V') && gPressed && now - lastKeyPressTime < 400) {
        hudVisible = !hudVisible;
        if (hudOverlay) {
          hudOverlay.style.display = hudVisible ? 'block' : 'none';
        }
        gPressed = false;
      } else {
        if (now - lastKeyPressTime > 400) {
          gPressed = false;
        }
      }
    });
  }

  function update(delta) {
    // Patrol guards
    for (var i = 0; i < guards.length; i++) {
      var guard = guards[i];
      guard.object.position.x += guard.direction * delta * 3;

      if (Math.abs(guard.object.position.x - guard.x) > guard.distance) {
        guard.direction *= -1;
      }
    }

    // Pulse laser intensity
    for (var l = 0; l < lasers.length; l++) {
      var laser = lasers[l];
      var pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
      laser.material.emissive.setHex(Math.floor(0xff0000 * pulse));
    }

    // Alarm panel strobe when triggered
    if (alarmsTriggered) {
      var alarmPulse = Math.floor((Date.now() - alarmStartTime) / 100) % 2;
      var alarmColor = alarmPulse === 0 ? 0xff0000 : 0x660000;
      if (objects.length > 0) {
        for (var o = 0; o < objects.length; o++) {
          if (objects[o].material && objects[o].material.emissive && objects[o].userData && objects[o].userData.isAlarmPanel) {
            objects[o].material.emissive.setHex(alarmColor);
          }
        }
      }
    }

    // Vault door rotation
    if (objects.length > 1) {
      objects[1].rotation.y += delta * 0.3;
    }

    // Drill rig rotation
    if (objects.length > 22) {
      for (var d = 0; d < objects.length; d++) {
        if (objects[d].userData && objects[d].userData.isDrillBit) {
          objects[d].rotation.x += delta * 5;
        }
      }
    }
  }

  function reset() {
    // Clear scene
    for (var i = objects.length - 1; i >= 0; i--) {
      if (objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var m = 0; m < objects[i].material.length; m++) {
            objects[i].material[m].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }
    objects = [];
    guards = [];
    lasers = [];

    // Clear HUD
    if (hudOverlay && hudOverlay.parentNode) {
      document.body.removeChild(hudOverlay);
    }
    hudOverlay = null;

    // Reset game state
    gameState.goldStacks = 0;
    gameState.guardsDefeated = 0;
    gameState.alarmsActive = false;
    alarmsTriggered = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
