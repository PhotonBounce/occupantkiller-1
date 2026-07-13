window.FloatingFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var time = 0;
  var sceneObjects = [];
  var enemies = [];
  var crystals = [];
  var state = {
    crystalsDestroyed: 0,
    fortressFalling: false,
    warlordDefeated: false,
    hudVisible: true
  };

  var lastFKeyTime = 0;
  var fKeyPressed = false;

  function createFortressBase() {
    var geometry = new THREE.BoxGeometry(100, 8, 100);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8B8680,
      roughness: 0.7,
      metalness: 0.1
    });
    var base = new THREE.Mesh(geometry, material);
    base.position.y = 0;
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    sceneObjects.push(base);
    return base;
  }

  function createFortressWalls() {
    var walls = [];
    var height = 25;
    var thickness = 4;
    var size = 95;

    // North wall
    var geo1 = new THREE.BoxGeometry(size, height, thickness);
    var wall1 = new THREE.Mesh(geo1, new THREE.MeshStandardMaterial({
      color: 0x9E9B91,
      roughness: 0.8
    }));
    wall1.position.set(0, 12, -size / 2);
    wall1.castShadow = true;
    scene.add(wall1);
    sceneObjects.push(wall1);
    walls.push(wall1);

    // South wall
    var geo2 = new THREE.BoxGeometry(size, height, thickness);
    var wall2 = new THREE.Mesh(geo2, new THREE.MeshStandardMaterial({
      color: 0x9E9B91,
      roughness: 0.8
    }));
    wall2.position.set(0, 12, size / 2);
    wall2.castShadow = true;
    scene.add(wall2);
    sceneObjects.push(wall2);
    walls.push(wall2);

    // East wall
    var geo3 = new THREE.BoxGeometry(thickness, height, size);
    var wall3 = new THREE.Mesh(geo3, new THREE.MeshStandardMaterial({
      color: 0x9E9B91,
      roughness: 0.8
    }));
    wall3.position.set(size / 2, 12, 0);
    wall3.castShadow = true;
    scene.add(wall3);
    sceneObjects.push(wall3);
    walls.push(wall3);

    // West wall
    var geo4 = new THREE.BoxGeometry(thickness, height, size);
    var wall4 = new THREE.Mesh(geo4, new THREE.MeshStandardMaterial({
      color: 0x9E9B91,
      roughness: 0.8
    }));
    wall4.position.set(-size / 2, 12, 0);
    wall4.castShadow = true;
    scene.add(wall4);
    sceneObjects.push(wall4);
    walls.push(wall4);

    // Battlements (crenellations)
    for (var i = -40; i <= 40; i += 15) {
      var battlement = new THREE.Mesh(
        new THREE.BoxGeometry(8, 8, 3),
        new THREE.MeshStandardMaterial({ color: 0xA9A5A0 })
      );
      battlement.position.set(i, 28, -47);
      battlement.castShadow = true;
      scene.add(battlement);
      sceneObjects.push(battlement);

      var battlement2 = new THREE.Mesh(
        new THREE.BoxGeometry(8, 8, 3),
        new THREE.MeshStandardMaterial({ color: 0xA9A5A0 })
      );
      battlement2.position.set(i, 28, 47);
      battlement2.castShadow = true;
      scene.add(battlement2);
      sceneObjects.push(battlement2);
    }

    return walls;
  }

  function createCentralKeep() {
    var keepBase = new THREE.Mesh(
      new THREE.BoxGeometry(30, 35, 30),
      new THREE.MeshStandardMaterial({
        color: 0x8B8680,
        roughness: 0.8
      })
    );
    keepBase.position.set(0, 17.5, 0);
    keepBase.castShadow = true;
    scene.add(keepBase);
    sceneObjects.push(keepBase);

    var keepRoof = new THREE.Mesh(
      new THREE.ConeGeometry(18, 15, 8),
      new THREE.MeshStandardMaterial({
        color: 0x4A4A4A,
        roughness: 0.7
      })
    );
    keepRoof.position.set(0, 43, 0);
    keepRoof.castShadow = true;
    scene.add(keepRoof);
    sceneObjects.push(keepRoof);

    return keepBase;
  }

  function createAntiGravityCrystals() {
    var positions = [
      [-35, 15, -35],
      [35, 15, -35],
      [-35, 15, 35],
      [35, 15, 35]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var pylon = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 12, 8),
        new THREE.MeshStandardMaterial({
          color: 0x6B7280,
          roughness: 0.6
        })
      );
      pylon.position.set(pos[0], pos[1] + 6, pos[2]);
      pylon.castShadow = true;
      scene.add(pylon);
      sceneObjects.push(pylon);

      var crystal = new THREE.Mesh(
        new THREE.SphereGeometry(4, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0x00FF88,
          emissive: 0x00FF88,
          emissiveIntensity: 0.6,
          metalness: 0.8
        })
      );
      crystal.position.set(pos[0], pos[1] + 18, pos[2]);
      crystal.castShadow = true;
      scene.add(crystal);
      sceneObjects.push(crystal);

      crystals.push({
        mesh: crystal,
        pylon: pylon,
        position: pos,
        destroyed: false
      });
    }
  }

  function createDrawbridge() {
    var bridgeBase = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2, 12),
      new THREE.MeshStandardMaterial({
        color: 0x5C4033,
        roughness: 0.9
      })
    );
    bridgeBase.position.set(0, 5, 50);
    bridgeBase.castShadow = true;
    scene.add(bridgeBase);
    sceneObjects.push(bridgeBase);

    // Chains (lines)
    var chainGeom = new THREE.BufferGeometry();
    var chainPoints = [
      new THREE.Vector3(-10, 5, 50),
      new THREE.Vector3(-10, 15, 50),
      new THREE.Vector3(10, 5, 50),
      new THREE.Vector3(10, 15, 50)
    ];
    chainGeom.setFromPoints(chainPoints);
    var chainLine = new THREE.LineSegments(
      chainGeom,
      new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 3 })
    );
    scene.add(chainLine);
    sceneObjects.push(chainLine);

    return bridgeBase;
  }

  function createObservationBalconies() {
    var positions = [
      [0, 15, -45],
      [0, 15, 45],
      [-45, 15, 0],
      [45, 15, 0]
    ];

    for (var i = 0; i < positions.length; i++) {
      var balcony = new THREE.Mesh(
        new THREE.BoxGeometry(12, 2, 8),
        new THREE.MeshStandardMaterial({
          color: 0x8B7355,
          roughness: 0.8
        })
      );
      balcony.position.set(positions[i][0], positions[i][1], positions[i][2]);
      balcony.castShadow = true;
      scene.add(balcony);
      sceneObjects.push(balcony);
    }
  }

  function createCloudLayer() {
    var cloudLayer = new THREE.Mesh(
      new THREE.BoxGeometry(200, 4, 200),
      new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
    );
    cloudLayer.position.y = -25;
    cloudLayer.receiveShadow = true;
    scene.add(cloudLayer);
    sceneObjects.push(cloudLayer);
    return cloudLayer;
  }

  function createCannonEmplacements() {
    var positions = [
      [-40, 12, -40],
      [40, 12, -40],
      [-40, 12, 40],
      [40, 12, 40]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var cannonBase = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x4A4A4A })
      );
      cannonBase.position.set(pos[0], pos[1], pos[2]);
      cannonBase.castShadow = true;
      scene.add(cannonBase);
      sceneObjects.push(cannonBase);

      var cannonBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2C2C2C })
      );
      cannonBarrel.rotation.z = Math.PI / 6;
      cannonBarrel.position.set(pos[0], pos[1] + 3, pos[2]);
      cannonBarrel.castShadow = true;
      scene.add(cannonBarrel);
      sceneObjects.push(cannonBarrel);
    }
  }

  function createGargoyles() {
    var positions = [
      [-47, 28, -47],
      [47, 28, -47],
      [-47, 28, 47],
      [47, 28, 47]
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      var plinth = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x7B7B7B })
      );
      plinth.position.set(pos[0], pos[1] - 4, pos[2]);
      plinth.castShadow = true;
      scene.add(plinth);
      sceneObjects.push(plinth);

      var body = new THREE.Mesh(
        new THREE.BoxGeometry(5, 8, 4),
        new THREE.MeshStandardMaterial({ color: 0x6B6B6B })
      );
      body.position.set(pos[0], pos[1] + 2, pos[2]);
      body.castShadow = true;
      scene.add(body);
      sceneObjects.push(body);

      var wingLeft = new THREE.Mesh(
        new THREE.BoxGeometry(2, 6, 3),
        new THREE.MeshStandardMaterial({ color: 0x5A5A5A })
      );
      wingLeft.position.set(pos[0] - 4, pos[1] + 2, pos[2]);
      wingLeft.castShadow = true;
      scene.add(wingLeft);
      sceneObjects.push(wingLeft);

      var wingRight = new THREE.Mesh(
        new THREE.BoxGeometry(2, 6, 3),
        new THREE.MeshStandardMaterial({ color: 0x5A5A5A })
      );
      wingRight.position.set(pos[0] + 4, pos[1] + 2, pos[2]);
      wingRight.castShadow = true;
      scene.add(wingRight);
      sceneObjects.push(wingRight);
    }
  }

  function createWizardSpire() {
    var spire = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 3, 50, 8),
      new THREE.MeshStandardMaterial({
        color: 0x5A4A6B,
        roughness: 0.7,
        metalness: 0.2
      })
    );
    spire.position.set(0, 35, 0);
    spire.castShadow = true;
    scene.add(spire);
    sceneObjects.push(spire);

    var spireTop = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xFF00FF,
        emissive: 0xFF00FF,
        emissiveIntensity: 0.8,
        metalness: 0.9
      })
    );
    spireTop.position.set(0, 65, 0);
    spireTop.castShadow = true;
    scene.add(spireTop);
    sceneObjects.push(spireTop);

    return { spire: spire, top: spireTop };
  }

  function createPortcullis() {
    var portcullisGeom = new THREE.BufferGeometry();
    var portcullisPoints = [];

    for (var i = -8; i <= 8; i += 2) {
      portcullisPoints.push(new THREE.Vector3(i, 20, 48));
      portcullisPoints.push(new THREE.Vector3(i, 0, 48));
    }

    portcullisGeom.setFromPoints(portcullisPoints);
    var portcullis = new THREE.LineSegments(
      portcullisGeom,
      new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 })
    );
    scene.add(portcullis);
    sceneObjects.push(portcullis);

    return portcullis;
  }

  function createCatapult() {
    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x8B6F47 })
    );
    frame.position.set(-30, 8, -30);
    frame.castShadow = true;
    scene.add(frame);
    sceneObjects.push(frame);

    var arm = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 15, 6),
      new THREE.MeshStandardMaterial({ color: 0x6B5637 })
    );
    arm.position.set(-30, 11, -30);
    arm.rotation.z = -0.3;
    arm.castShadow = true;
    scene.add(arm);
    sceneObjects.push(arm);

    return { frame: frame, arm: arm };
  }

  function createMagicCircle() {
    var circleGeom = new THREE.BufferGeometry();
    var circlePoints = [];

    for (var i = 0; i <= 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(
        Math.cos(angle) * 15,
        0.1,
        Math.sin(angle) * 15
      ));
    }

    circleGeom.setFromPoints(circlePoints);
    var pentagon = new THREE.LineLoop(
      circleGeom,
      new THREE.LineBasicMaterial({ color: 0xFFAA00, linewidth: 2 })
    );
    pentagon.position.set(0, 0.5, 0);
    scene.add(pentagon);
    sceneObjects.push(pentagon);

    var innerCircleGeom = new THREE.BufferGeometry();
    var innerPoints = [];
    for (var j = 0; j < 32; j++) {
      var a = (j / 32) * Math.PI * 2;
      innerPoints.push(new THREE.Vector3(
        Math.cos(a) * 10,
        0.1,
        Math.sin(a) * 10
      ));
    }
    innerCircleGeom.setFromPoints(innerPoints);
    var innerCircle = new THREE.LineLoop(
      innerCircleGeom,
      new THREE.LineBasicMaterial({ color: 0xFFAA00, linewidth: 2 })
    );
    innerCircle.position.set(0, 0.5, 0);
    scene.add(innerCircle);
    sceneObjects.push(innerCircle);

    return pentagon;
  }

  function createWarBalloon() {
    var envelope = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xFF6B6B,
        metalness: 0.3
      })
    );
    envelope.position.set(0, 50, -60);
    envelope.castShadow = true;
    scene.add(envelope);
    sceneObjects.push(envelope);

    var basket = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      new THREE.MeshStandardMaterial({
        color: 0x8B7355
      })
    );
    basket.position.set(0, 32, -60);
    basket.castShadow = true;
    scene.add(basket);
    sceneObjects.push(basket);

    return { envelope: envelope, basket: basket };
  }

  function createFountain() {
    var base = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x7B7B7B })
    );
    base.position.set(0, 1.5, 0);
    base.castShadow = true;
    scene.add(base);
    sceneObjects.push(base);

    var bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 7, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0x6B6B6B })
    );
    bowl.position.set(0, 5, 0);
    bowl.castShadow = true;
    scene.add(bowl);
    sceneObjects.push(bowl);

    var waterSpout = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x4488FF,
        transparent: true,
        opacity: 0.6
      })
    );
    waterSpout.position.set(0, 7, 0);
    waterSpout.castShadow = true;
    scene.add(waterSpout);
    sceneObjects.push(waterSpout);

    return { base: base, bowl: bowl, water: waterSpout };
  }

  function createEnemies() {
    // Armored knights
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var x = Math.cos(angle) * 35;
      var z = Math.sin(angle) * 35;

      var knight = new THREE.Mesh(
        new THREE.BoxGeometry(3, 8, 3),
        new THREE.MeshStandardMaterial({
          color: 0xAA8844,
          roughness: 0.6
        })
      );
      knight.position.set(x, 8, z);
      knight.castShadow = true;
      scene.add(knight);
      sceneObjects.push(knight);

      enemies.push({
        mesh: knight,
        type: 'knight',
        health: 3
      });
    }

    // Mage guards
    for (var j = 0; j < 2; j++) {
      var angle2 = (j / 2) * Math.PI * 2 + Math.PI / 4;
      var x2 = Math.cos(angle2) * 30;
      var z2 = Math.sin(angle2) * 30;

      var mageBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 7, 2.5),
        new THREE.MeshStandardMaterial({
          color: 0x5555AA,
          roughness: 0.7
        })
      );
      mageBody.position.set(x2, 7, z2);
      mageBody.castShadow = true;
      scene.add(mageBody);
      sceneObjects.push(mageBody);

      var mageHat = new THREE.Mesh(
        new THREE.ConeGeometry(2, 5, 8),
        new THREE.MeshStandardMaterial({
          color: 0x3333AA
        })
      );
      mageHat.position.set(x2, 13, z2);
      mageHat.castShadow = true;
      scene.add(mageHat);
      sceneObjects.push(mageHat);

      enemies.push({
        mesh: mageBody,
        type: 'mage',
        health: 2
      });
    }
  }

  function createHUD() {
    if (!document.getElementById('floating-fortress-hud')) {
      var hud = document.createElement('div');
      hud.id = 'floating-fortress-hud';
      hud.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF88; font-family: monospace; font-size: 14px; z-index: 100; text-shadow: 0 0 10px #00FF88;';
      hud.innerHTML = 'CRYSTALS DESTROYED: 0/4<br>FORTRESS FALLING: NO<br>WARLORD DEFEATED: NO';
      document.body.appendChild(hud);
    }
  }

  function updateHUD() {
    var hud = document.getElementById('floating-fortress-hud');
    if (hud) {
      hud.innerHTML = 'CRYSTALS DESTROYED: ' + state.crystalsDestroyed + '/4<br>FORTRESS FALLING: ' + (state.fortressFalling ? 'YES' : 'NO') + '<br>WARLORD DEFEATED: ' + (state.warlordDefeated ? 'YES' : 'NO');
    }
  }

  function toggleHUD() {
    state.hudVisible = !state.hudVisible;
    var hud = document.getElementById('floating-fortress-hud');
    if (hud) {
      hud.style.display = state.hudVisible ? 'block' : 'none';
    }

    // Show temporary notification
    var notification = document.createElement('div');
    notification.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #FFAA00; font-family: monospace; font-size: 20px; z-index: 101; text-shadow: 0 0 10px #FFAA00;';
    notification.innerHTML = 'HUD ' + (state.hudVisible ? 'ON' : 'OFF');
    document.body.appendChild(notification);
    setTimeout(function() {
      document.body.removeChild(notification);
    }, 1000);
  }

  function handleKeyDown(event) {
    if (event.key === 'f' || event.key === 'F') {
      var now = Date.now();
      if (fKeyPressed && (now - lastFKeyTime < 400)) {
        toggleHUD();
        fKeyPressed = false;
      } else {
        lastFKeyTime = now;
        fKeyPressed = true;
      }
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    time = 0;
    sceneObjects = [];
    enemies = [];
    crystals = [];
    state = {
      crystalsDestroyed: 0,
      fortressFalling: false,
      warlordDefeated: false,
      hudVisible: true
    };

    // Create fortress structure
    createFortressBase();
    createFortressWalls();
    createCentralKeep();
    createAntiGravityCrystals();
    createDrawbridge();
    createObservationBalconies();
    createCloudLayer();
    createCannonEmplacements();
    createGargoyles();
    createWizardSpire();
    createPortcullis();
    createCatapult();
    createMagicCircle();
    createWarBalloon();
    createFountain();

    // Create enemies
    createEnemies();

    // Setup HUD
    createHUD();
    updateHUD();

    // Setup keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    // Setup scene environment
    scene.fog = new THREE.Fog(0xB0D0FF, 150, 300);
    scene.background = new THREE.Color(0x87CEEB);
  }

  function update(delta) {
    time += delta;

    // Animate anti-gravity crystals
    for (var i = 0; i < crystals.length; i++) {
      var crystal = crystals[i];
      if (!crystal.destroyed) {
        crystal.mesh.rotation.x += 0.02;
        crystal.mesh.rotation.y += 0.03;
        crystal.mesh.scale.x = 1 + Math.sin(time * 3) * 0.1;
        crystal.mesh.scale.y = 1 + Math.sin(time * 3) * 0.1;
        crystal.mesh.scale.z = 1 + Math.sin(time * 3) * 0.1;
      }
    }

    // Fortress orbital drift
    var orbitRadius = 2;
    var orbitX = Math.sin(time * 0.1) * orbitRadius;
    var orbitZ = Math.cos(time * 0.1) * orbitRadius;

    for (var j = 0; j < sceneObjects.length; j++) {
      sceneObjects[j].position.x += orbitX * 0.001;
      sceneObjects[j].position.z += orbitZ * 0.001;
    }

    // War balloon sway
    if (sceneObjects.length > 0) {
      var balloonIdx = sceneObjects.length - 3;
      if (balloonIdx >= 0 && balloonIdx < sceneObjects.length) {
        var sway = Math.sin(time * 1.5) * 3;
        sceneObjects[balloonIdx].position.y += sway * 0.001;
      }
    }

    // Magic circle rotation
    var circleObjs = [];
    for (var k = 0; k < sceneObjects.length; k++) {
      if (sceneObjects[k].type === 'LineLoop') {
        circleObjs.push(sceneObjects[k]);
      }
    }

    for (var m = 0; m < circleObjs.length; m++) {
      circleObjs[m].rotation.y += 0.02;
    }

    // Enemy patrol
    for (var n = 0; n < enemies.length; n++) {
      var enemy = enemies[n];
      enemy.mesh.position.x += Math.sin(time * 0.5 + n) * 0.05;
      enemy.mesh.position.z += Math.cos(time * 0.5 + n) * 0.05;
    }

    // Catapult arm swing
    var catapultFound = false;
    for (var p = 0; p < sceneObjects.length; p++) {
      if (sceneObjects[p].geometry instanceof THREE.CylinderGeometry && sceneObjects[p].position.x === -30) {
        sceneObjects[p].rotation.z = -0.3 + Math.sin(time * 0.8) * 0.4;
        catapultFound = true;
      }
    }

    updateHUD();
  }

  function reset() {
    time = 0;
    state = {
      crystalsDestroyed: 0,
      fortressFalling: false,
      warlordDefeated: false,
      hudVisible: true
    };

    // Remove all scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }

    sceneObjects = [];
    enemies = [];
    crystals = [];

    // Remove HUD
    var hud = document.getElementById('floating-fortress-hud');
    if (hud) {
      document.body.removeChild(hud);
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
