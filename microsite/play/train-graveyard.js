window.TrainGraveyard = (function() {
  'use strict';

  var sceneObjects = [];
  var keybindSequence = [];
  var keybindTimeout = null;
  var isVisible = true;
  var dustDevilAngle = 0;
  var heatPulseValue = 0;
  var tumbleWeedAngle = 0;
  var signalArmAngle = 0;
  var exchangeTimer = 0;
  var convoyPosition = 0;
  var dealersCaptured = 0;
  var weaponsSeized = 0;
  var convoyStop = false;

  var hudElement = null;
  var scene = null;
  var camera = null;
  var dustDevil = null;
  var tumbleweed = null;
  var signalArm = null;
  var exchangeDealers = [];
  var convoyVehicle = null;

  function createObject(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
    if (scale) mesh.scale.copy(scale);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function createLine(points, color) {
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: color });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
    sceneObjects.push(line);
    return line;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    sceneObjects = [];
    dealersCaptured = 0;
    weaponsSeized = 0;
    convoyStop = false;
    exchangeTimer = 0;
    convoyPosition = 0;
    dustDevilAngle = 0;
    heatPulseValue = 0;
    tumbleWeedAngle = 0;
    signalArmAngle = 0;
    exchangeDealers = [];

    scene.fog = new THREE.Fog(0xD4A574, 100, 300);
    scene.background = new THREE.Color(0xE8B88E);

    var sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xC9A86F,
      roughness: 0.9,
      metalness: 0.0
    });
    createObject(
      new THREE.BoxGeometry(500, 2, 500),
      sandMaterial,
      new THREE.Vector3(0, -1, 0),
      null,
      null
    );

    var rustMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.6
    });

    var rustLight = new THREE.MeshStandardMaterial({
      color: 0xA0522D,
      roughness: 0.8,
      metalness: 0.4
    });

    // Locomotive 1
    createObject(
      new THREE.BoxGeometry(15, 8, 5),
      rustMaterial,
      new THREE.Vector3(-40, 5, -60),
      null,
      null
    );
    createObject(
      new THREE.CylinderGeometry(4, 4, 20, 16),
      rustMaterial,
      new THREE.Vector3(-40, 7, -60),
      null,
      null
    );
    createObject(
      new THREE.CylinderGeometry(3, 3, 4, 16),
      rustLight,
      new THREE.Vector3(-40, 14, -50),
      null,
      null
    );
    createObject(
      new THREE.BoxGeometry(8, 6, 4),
      rustMaterial,
      new THREE.Vector3(-20, 5, -60),
      null,
      null
    );

    // Locomotive 2
    createObject(
      new THREE.BoxGeometry(15, 8, 5),
      rustMaterial,
      new THREE.Vector3(50, 5, 20),
      new THREE.Euler(0, Math.PI / 6, 0),
      null
    );
    createObject(
      new THREE.CylinderGeometry(4, 4, 20, 16),
      rustMaterial,
      new THREE.Vector3(50, 7, 20),
      new THREE.Euler(0, Math.PI / 6, 0),
      null
    );
    createObject(
      new THREE.CylinderGeometry(3, 3, 4, 16),
      rustLight,
      new THREE.Vector3(50, 14, 30),
      new THREE.Euler(0, Math.PI / 6, 0),
      null
    );

    // Freight car rows
    for (var i = 0; i < 4; i++) {
      var xOffset = -30 + i * 25;
      createObject(
        new THREE.BoxGeometry(12, 7, 3),
        rustMaterial,
        new THREE.Vector3(xOffset, 4, 80 + i * 3),
        new THREE.Euler(0, Math.PI / 12, 0),
        null
      );
    }

    // Overturned tanker car
    createObject(
      new THREE.CylinderGeometry(5, 5, 25, 16),
      rustMaterial,
      new THREE.Vector3(30, 6, -40),
      new THREE.Euler(Math.PI / 2.5, 0, 0),
      null
    );

    // Half-buried tender car
    createObject(
      new THREE.BoxGeometry(10, 8, 4),
      rustMaterial,
      new THREE.Vector3(-70, 2, 40),
      null,
      null
    );

    // Maintenance shed ruins
    var shed1 = createObject(
      new THREE.BoxGeometry(20, 12, 1),
      rustMaterial,
      new THREE.Vector3(60, 6, 60),
      null,
      null
    );
    var shed2 = createObject(
      new THREE.BoxGeometry(1, 12, 15),
      rustMaterial,
      new THREE.Vector3(50, 6, 70),
      null,
      null
    );
    var shed3 = createObject(
      new THREE.BoxGeometry(20, 8, 1),
      rustMaterial,
      new THREE.Vector3(60, 3, 80),
      null,
      null
    );

    // Rail tracks
    for (var t = 0; t < 10; t++) {
      createObject(
        new THREE.BoxGeometry(200, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x444444 }),
        new THREE.Vector3(0, 0.5, -100 + t * 20),
        null,
        null
      );
    }

    // Track ties using LineSegments
    for (var tie = 0; tie < 15; tie++) {
      var tiePoints = [
        new THREE.Vector3(-100, 0.6, -100 + tie * 13.3),
        new THREE.Vector3(100, 0.6, -100 + tie * 13.3)
      ];
      createLine(tiePoints, 0x333333);
    }

    // Signal post
    createObject(
      new THREE.CylinderGeometry(0.8, 0.8, 25, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 }),
      new THREE.Vector3(-80, 12.5, -80),
      null,
      null
    );
    signalArm = createObject(
      new THREE.BoxGeometry(8, 1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x666666 }),
      new THREE.Vector3(-80, 22, -80),
      null,
      null
    );

    // Water tower ruin
    createObject(
      new THREE.CylinderGeometry(6, 6, 3, 16),
      rustMaterial,
      new THREE.Vector3(80, 8, -100),
      null,
      null
    );
    createObject(
      new THREE.BoxGeometry(2, 15, 2),
      rustMaterial,
      new THREE.Vector3(75, 12, -95),
      null,
      null
    );
    createObject(
      new THREE.BoxGeometry(2, 15, 2),
      rustMaterial,
      new THREE.Vector3(85, 12, -105),
      null,
      null
    );

    // Turntable remnant
    createObject(
      new THREE.CylinderGeometry(12, 12, 1, 32),
      new THREE.MeshStandardMaterial({ color: 0x663333 }),
      new THREE.Vector3(0, 0.8, 0),
      null,
      null
    );

    // Scrap metal pile
    for (var s = 0; s < 8; s++) {
      var scrapX = -20 + Math.random() * 10;
      var scrapZ = -20 + Math.random() * 10;
      var scrapSize = 1 + Math.random() * 2;
      createObject(
        new THREE.BoxGeometry(scrapSize, scrapSize, scrapSize),
        rustMaterial,
        new THREE.Vector3(scrapX, 1 + s * 0.8, scrapZ),
        new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
        null
      );
    }

    // Abandoned station platform
    createObject(
      new THREE.BoxGeometry(25, 1, 12),
      new THREE.MeshStandardMaterial({ color: 0x8B7355 }),
      new THREE.Vector3(-50, 1, -20),
      null,
      null
    );

    // Arms dealer SUV convoy
    convoyVehicle = createObject(
      new THREE.BoxGeometry(6, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
      new THREE.Vector3(-100, 3, 0),
      null,
      null
    );

    // Additional convoy vehicles
    createObject(
      new THREE.BoxGeometry(6, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
      new THREE.Vector3(-85, 3, 0),
      null,
      null
    );
    createObject(
      new THREE.BoxGeometry(6, 4, 3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
      new THREE.Vector3(-70, 3, 0),
      null,
      null
    );

    // Weapon crates stack
    for (var c = 0; c < 5; c++) {
      var crateX = 20;
      var crateY = 1 + c * 2;
      var crateZ = 50 + (c % 2) * 3;
      createObject(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x2D5016 }),
        new THREE.Vector3(crateX, crateY, crateZ),
        null,
        null
      );
    }

    // Dust devil
    dustDevil = createObject(
      new THREE.CylinderGeometry(3, 4, 15, 16),
      new THREE.MeshStandardMaterial({
        color: 0xD4A574,
        opacity: 0.3,
        transparent: true
      }),
      new THREE.Vector3(40, 10, -50),
      null,
      null
    );

    // Tumbleweed
    tumbleweed = createObject(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.9
      }),
      new THREE.Vector3(0, 2, 50),
      null,
      null
    );

    // Enemy figures (dealers)
    for (var d = 0; d < 3; d++) {
      var dealerBox = createObject(
        new THREE.BoxGeometry(1, 3, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x444444 }),
        new THREE.Vector3(-40 + d * 30, 1.5, 40),
        null,
        null
      );
      exchangeDealers.push({
        mesh: dealerBox,
        startX: -40 + d * 30,
        targetX: 20,
        moveProgress: 0
      });
    }

    // Setup HUD
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'train-graveyard-hud';
      hudElement.style.cssText = 'position:fixed;top:20px;left:20px;color:#FF6600;font-family:monospace;font-size:14px;z-index:1000;background:rgba(0,0,0,0.7);padding:10px;border:2px solid #FF6600;display:none;';
      document.body.appendChild(hudElement);
    }

    setupKeybind();
    updateHUD();
  }

  function setupKeybind() {
    document.addEventListener('keydown', function(e) {
      if (e.key.toLowerCase() === 't') {
        keybindSequence.push('T');
        if (keybindSequence.length > 1) {
          keybindSequence.shift();
        }
        if (keybindTimeout) clearTimeout(keybindTimeout);
        keybindTimeout = setTimeout(function() {
          keybindSequence = [];
        }, 400);
      }
      if (e.key.toLowerCase() === 'g' && keybindSequence.length > 0 && keybindSequence[0] === 'T') {
        toggleVisibility();
        keybindSequence = [];
      }
    });
  }

  function toggleVisibility() {
    isVisible = !isVisible;
    if (hudElement) {
      hudElement.style.display = isVisible ? 'block' : 'none';
    }
    if (isVisible) {
      console.log('Train Graveyard HUD: ON');
    } else {
      console.log('Train Graveyard HUD: OFF');
    }
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML = 'DEALERS CAPTURED: ' + dealersCaptured + '/3<br>' +
                             'WEAPONS SEIZED: ' + weaponsSeized + '/5 CRATES<br>' +
                             'CONVOY STOPPED: ' + (convoyStop ? 'YES' : 'NO');
    }
  }

  function update(delta) {
    if (!scene) return;

    // Dust devil animation: spin and oscillate scale
    dustDevilAngle += delta * 2;
    dustDevil.rotation.y = dustDevilAngle;
    var dustScale = 0.8 + Math.sin(dustDevilAngle * 0.5) * 0.3;
    dustDevil.scale.set(dustScale, dustScale, dustScale);

    // Heat shimmer: pulse emissive
    heatPulseValue += delta * 1.5;
    var heatIntensity = Math.sin(heatPulseValue) * 0.05;

    // Tumbleweed rolling
    tumbleWeedAngle += delta * 3;
    tumbleweed.rotation.x = tumbleWeedAngle;
    tumbleweed.rotation.z = tumbleWeedAngle * 0.6;
    tumbleweed.position.z = 50 + Math.sin(tumbleWeedAngle * 0.3) * 20;
    tumbleweed.position.x = Math.cos(tumbleWeedAngle * 0.3) * 15;

    // Signal arm swinging
    signalArmAngle += delta * 0.8;
    signalArm.rotation.z = Math.sin(signalArmAngle) * 0.4;

    // Exchange meeting: dealers walk toward each other
    exchangeTimer += delta;
    if (exchangeTimer > 2) {
      for (var i = 0; i < exchangeDealers.length; i++) {
        exchangeDealers[i].moveProgress += delta * 0.15;
        if (exchangeDealers[i].moveProgress > 1) {
          exchangeDealers[i].moveProgress = 1;
        }
        var interpX = exchangeDealers[i].startX + (exchangeDealers[i].targetX - exchangeDealers[i].startX) * exchangeDealers[i].moveProgress;
        exchangeDealers[i].mesh.position.x = interpX;
      }
    }

    // Convoy driving slowly
    convoyPosition += delta * 0.5;
    if (convoyVehicle && convoyPosition < 100) {
      convoyVehicle.position.x = -100 + convoyPosition;
    }

    updateHUD();
  }

  function reset() {
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
      if (sceneObjects[i].geometry) sceneObjects[i].geometry.dispose();
      if (sceneObjects[i].material) {
        if (Array.isArray(sceneObjects[i].material)) {
          for (var m = 0; m < sceneObjects[i].material.length; m++) {
            sceneObjects[i].material[m].dispose();
          }
        } else {
          sceneObjects[i].material.dispose();
        }
      }
    }
    sceneObjects = [];
    exchangeDealers = [];
    dustDevil = null;
    tumbleweed = null;
    signalArm = null;
    convoyVehicle = null;
    dealersCaptured = 0;
    weaponsSeized = 0;
    convoyStop = false;
    exchangeTimer = 0;
    convoyPosition = 0;
    if (hudElement) hudElement.style.display = 'none';
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
