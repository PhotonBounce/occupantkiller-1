window.CyberYacht = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var enemies = [];
  var animationTime = 0;
  var keyBindingBuffer = '';
  var keyBindingTimeout = null;
  var hudVisible = true;
  var cyberNodesDown = 0;
  var crewNeutralized = 0;
  var dealerCaptured = false;

  var hudElement = null;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    enemies = [];
    animationTime = 0;
    cyberNodesDown = 0;
    crewNeutralized = 0;
    dealerCaptured = false;

    // Create superyacht hull - large white elongated box
    var hullGeom = new THREE.BoxGeometry(30, 8, 80);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.4 });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(0, 0, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    objects.push(hull);

    // Main deck - flat white box with teak-colored strips
    var deckGeom = new THREE.BoxGeometry(32, 0.5, 82);
    var deckMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, metalness: 0.2, roughness: 0.5 });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(0, 4.5, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    objects.push(deck);

    // Teak strips on deck
    for (var i = 0; i < 5; i++) {
      var teakGeom = new THREE.BoxGeometry(32, 0.1, 6);
      var teakMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.1, roughness: 0.6 });
      var teak = new THREE.Mesh(teakGeom, teakMat);
      teak.position.set(0, 4.55, -30 + i * 15);
      teak.castShadow = true;
      scene.add(teak);
      objects.push(teak);
    }

    // Aft sundeck helipad - flat box with LineSegments H-pattern
    var helipadGeom = new THREE.BoxGeometry(20, 0.2, 20);
    var helipadMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4, roughness: 0.3 });
    var helipad = new THREE.Mesh(helipadGeom, helipadMat);
    helipad.position.set(0, 5, -35);
    helipad.castShadow = true;
    helipad.receiveShadow = true;
    scene.add(helipad);
    objects.push(helipad);

    // Helipad H markings
    var helipadLines = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([
        -8, 5.2, -35, 8, 5.2, -35,
        0, 5.2, -27, 0, 5.2, -43,
        -8, 5.2, -35, -8, 5.2, -35
      ]), 3)),
      new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
    );
    scene.add(helipadLines);
    objects.push(helipadLines);

    // Helicopter on helipad
    var heliBodyGeom = new THREE.BoxGeometry(6, 2, 8);
    var heliMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.3 });
    var heliBody = new THREE.Mesh(heliBodyGeom, heliMat);
    heliBody.position.set(0, 6.5, -35);
    heliBody.castShadow = true;
    scene.add(heliBody);
    objects.push(heliBody);

    // Helicopter rotor (will spin)
    var rotorGeom = new THREE.BoxGeometry(0.3, 0.2, 12);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.3 });
    var rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.set(0, 8.5, -35);
    rotor.castShadow = true;
    rotor.userData.isRotor = true;
    scene.add(rotor);
    objects.push(rotor);

    // Flybridge level - elevated box structure
    var flybridgeGeom = new THREE.BoxGeometry(24, 3, 16);
    var flybridgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.4 });
    var flybridge = new THREE.Mesh(flybridgeGeom, flybridgeMat);
    flybridge.position.set(0, 10, 15);
    flybridge.castShadow = true;
    flybridge.receiveShadow = true;
    scene.add(flybridge);
    objects.push(flybridge);

    // Captain's bridge - box with large window panels
    var bridgeGeom = new THREE.BoxGeometry(20, 4, 12);
    var bridgeMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, metalness: 0.3, roughness: 0.5 });
    var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
    bridge.position.set(0, 13, 25);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    objects.push(bridge);

    // Bridge windows
    var windowGeom = new THREE.BoxGeometry(18, 3, 0.5);
    var windowMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.6 });
    var window1 = new THREE.Mesh(windowGeom, windowMat);
    window1.position.set(0, 14, 31.5);
    scene.add(window1);
    objects.push(window1);

    // Satellite communication array - sphere dome + cylinder dish
    var domeGeom = new THREE.SphereGeometry(4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
    var domeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3 });
    var dome = new THREE.Mesh(domeGeom, domeMat);
    dome.position.set(0, 16, -5);
    dome.castShadow = true;
    dome.receiveShadow = true;
    dome.userData.isDome = true;
    scene.add(dome);
    objects.push(dome);

    // Dish antenna (will rotate)
    var dishGeom = new THREE.ConeGeometry(3, 1, 32);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.6, roughness: 0.2 });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(5, 18, -5);
    dish.rotation.x = Math.PI * 0.3;
    dish.castShadow = true;
    dish.userData.isDish = true;
    scene.add(dish);
    objects.push(dish);

    // Server room below deck - visible through hatch, dense box racks
    var serverRoomGeom = new THREE.BoxGeometry(28, 3, 20);
    var serverRoomMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x00ff00, emissiveIntensity: 0.3, metalness: 0.7, roughness: 0.2 });
    var serverRoom = new THREE.Mesh(serverRoomGeom, serverRoomMat);
    serverRoom.position.set(0, -2, 0);
    serverRoom.castShadow = true;
    serverRoom.userData.isServerRoom = true;
    scene.add(serverRoom);
    objects.push(serverRoom);

    // Server racks detail
    for (var j = 0; j < 6; j++) {
      var rackGeom = new THREE.BoxGeometry(2, 2.5, 3);
      var rackMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xff0000, emissiveIntensity: 0.2, metalness: 0.8 });
      var rack = new THREE.Mesh(rackGeom, rackMat);
      rack.position.set(-10 + j * 4, -2.5, 2);
      rack.castShadow = true;
      rack.userData.isRack = true;
      scene.add(rack);
      objects.push(rack);
    }

    // Luxury lounge interior - box sofas, box bar
    var sofaGeom = new THREE.BoxGeometry(8, 1.5, 4);
    var sofaMat = new THREE.MeshStandardMaterial({ color: 0x2f4f4f, metalness: 0.1, roughness: 0.6 });
    var sofa1 = new THREE.Mesh(sofaGeom, sofaMat);
    sofa1.position.set(-8, 2.5, 8);
    sofa1.castShadow = true;
    scene.add(sofa1);
    objects.push(sofa1);

    var sofa2 = new THREE.Mesh(sofaGeom, sofaMat);
    sofa2.position.set(8, 2.5, 8);
    sofa2.castShadow = true;
    scene.add(sofa2);
    objects.push(sofa2);

    // Bar counter
    var barGeom = new THREE.BoxGeometry(10, 1, 3);
    var barMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.3, roughness: 0.4 });
    var bar = new THREE.Mesh(barGeom, barMat);
    bar.position.set(0, 2, -8);
    bar.castShadow = true;
    scene.add(bar);
    objects.push(bar);

    // Swimming pool - flat cyan box recessed in deck
    var poolGeom = new THREE.BoxGeometry(12, 1, 18);
    var poolMat = new THREE.MeshStandardMaterial({ color: 0x00bfff, metalness: 0.4, roughness: 0.2, transparent: true, opacity: 0.8 });
    var pool = new THREE.Mesh(poolGeom, poolMat);
    pool.position.set(0, 4.5, -20);
    pool.castShadow = true;
    pool.userData.isPool = true;
    scene.add(pool);
    objects.push(pool);

    // Tender boat in davits - small box boat on cylinder crane
    var tenderGeom = new THREE.BoxGeometry(4, 2, 6);
    var tenderMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.4, roughness: 0.3 });
    var tender = new THREE.Mesh(tenderGeom, tenderMat);
    tender.position.set(-12, 7, -45);
    tender.castShadow = true;
    scene.add(tender);
    objects.push(tender);

    // Crane arm
    var craneGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var craneMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.3 });
    var crane = new THREE.Mesh(craneGeom, craneMat);
    crane.position.set(-12, 7, -45);
    crane.rotation.z = Math.PI * 0.3;
    crane.castShadow = true;
    scene.add(crane);
    objects.push(crane);

    // Jet ski on platform
    var jetskiGeom = new THREE.BoxGeometry(2.5, 1.5, 4.5);
    var jetskiMat = new THREE.MeshStandardMaterial({ color: 0xff6347, metalness: 0.6, roughness: 0.2 });
    var jetski = new THREE.Mesh(jetskiGeom, jetskiMat);
    jetski.position.set(12, 5.5, -45);
    jetski.castShadow = true;
    scene.add(jetski);
    objects.push(jetski);

    // Bow pulpit - narrow box extending forward
    var pulpitGeom = new THREE.BoxGeometry(2, 1, 12);
    var pulpitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.3 });
    var pulpit = new THREE.Mesh(pulpitGeom, pulpitMat);
    pulpit.position.set(0, 5, 42);
    pulpit.castShadow = true;
    scene.add(pulpit);
    objects.push(pulpit);

    // Radar mast - tall cylinder + rotating dish
    var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 20, 8);
    var mastMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.3 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(2, 8, 30);
    mast.castShadow = true;
    scene.add(mast);
    objects.push(mast);

    // Radar dish (will rotate)
    var radarGeom = new THREE.ConeGeometry(2.5, 0.8, 32);
    var radarMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.2 });
    var radar = new THREE.Mesh(radarGeom, radarMat);
    radar.position.set(2, 18, 30);
    radar.userData.isRadar = true;
    radar.castShadow = true;
    scene.add(radar);
    objects.push(radar);

    // Anchor windlass - cylinder at bow
    var windlassGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
    var windlassMat = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.7, roughness: 0.3 });
    var windlass = new THREE.Mesh(windlassGeom, windlassMat);
    windlass.position.set(0, 5.2, 38);
    windlass.castShadow = true;
    scene.add(windlass);
    objects.push(windlass);

    // Wake trail - white box strip behind stern
    var wakeGeom = new THREE.BoxGeometry(2, 0.1, 100);
    var wakeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    var wake = new THREE.Mesh(wakeGeom, wakeMat);
    wake.position.set(0, 0.1, -60);
    wake.userData.isWake = true;
    scene.add(wake);
    objects.push(wake);

    // Mooring lines (LineSegments)
    var mooringPoints = new Float32Array([
      -15, 5.5, 35, -30, 0, 40,
      15, 5.5, 35, 30, 0, 40,
      -15, 5.5, -40, -30, 0, -50,
      15, 5.5, -40, 30, 0, -50
    ]);
    var mooringGeom = new THREE.BufferGeometry();
    mooringGeom.setAttribute('position', new THREE.BufferAttribute(mooringPoints, 3));
    var mooringLines = new THREE.LineSegments(
      mooringGeom,
      new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 })
    );
    scene.add(mooringLines);
    objects.push(mooringLines);

    // Create enemies - private security in black
    var securityCount = 6;
    for (var k = 0; k < securityCount; k++) {
      var secGeom = new THREE.BoxGeometry(1, 2.5, 0.8);
      var secMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });
      var security = new THREE.Mesh(secGeom, secMat);
      security.position.set(-10 + k * 4, 6, 5 + Math.random() * 10);
      security.castShadow = true;
      security.userData.isEnemy = true;
      security.userData.type = 'security';
      scene.add(security);
      enemies.push(security);
      objects.push(security);
    }

    // Hired hackers at consoles
    var hackerCount = 4;
    for (var h = 0; h < hackerCount; h++) {
      var hackerGeom = new THREE.BoxGeometry(0.8, 2, 0.8);
      var hackerMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, metalness: 0.3, roughness: 0.6 });
      var hacker = new THREE.Mesh(hackerGeom, hackerMat);
      hacker.position.set(-8 + h * 5, 2, -5);
      hacker.castShadow = true;
      hacker.userData.isEnemy = true;
      hacker.userData.type = 'hacker';
      scene.add(hacker);
      enemies.push(hacker);
      objects.push(hacker);

      // Console desk
      var consoleGeom = new THREE.BoxGeometry(2, 1, 1.5);
      var consoleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x0066ff, emissiveIntensity: 0.3, metalness: 0.6 });
      var console = new THREE.Mesh(consoleGeom, consoleMat);
      console.position.set(-8 + h * 5, 1.5, -5);
      console.castShadow = true;
      scene.add(console);
      objects.push(console);
    }

    // Boss - arms dealer on flybridge
    var bossGeom = new THREE.BoxGeometry(1.2, 2.8, 1);
    var bossMat = new THREE.MeshStandardMaterial({ color: 0x4d0000, metalness: 0.2, roughness: 0.7 });
    var boss = new THREE.Mesh(bossGeom, bossMat);
    boss.position.set(0, 12, 15);
    boss.castShadow = true;
    boss.userData.isEnemy = true;
    boss.userData.isBoss = true;
    boss.userData.type = 'boss';
    scene.add(boss);
    enemies.push(boss);
    objects.push(boss);

    // Create HUD
    createHUD();

    // Set up key binding listener
    document.addEventListener('keydown', handleKeyBinding);

    return {
      scene: scene,
      enemies: enemies,
      objects: objects
    };
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'cyber-yacht-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.textShadow = '0 0 10px #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.minWidth = '250px';

    updateHUD();

    if (hudVisible) {
      document.body.appendChild(hudElement);
    }
  }

  function updateHUD() {
    if (hudElement) {
      var statusText = '';
      statusText += 'CYBER NODES DOWN: ' + cyberNodesDown + '/6\n';
      statusText += 'CREW NEUTRALIZED: ' + crewNeutralized + '/12\n';
      statusText += 'DEALER CAPTURED: ' + (dealerCaptured ? 'YES' : 'NO') + '\n';
      statusText += '---\n';
      statusText += '[C+Y] Toggle HUD';

      hudElement.textContent = statusText;
    }
  }

  function handleKeyBinding(event) {
    var key = event.key.toUpperCase();

    if (key === 'C') {
      keyBindingBuffer = 'C';
      clearTimeout(keyBindingTimeout);
      keyBindingTimeout = setTimeout(function() {
        keyBindingBuffer = '';
      }, 400);
    } else if (key === 'Y' && keyBindingBuffer === 'C') {
      keyBindingBuffer = '';
      clearTimeout(keyBindingTimeout);
      toggleHUD();
    } else if (key !== 'C') {
      keyBindingBuffer = '';
    }
  }

  function toggleHUD() {
    hudVisible = !hudVisible;

    if (hudElement) {
      if (hudVisible) {
        if (!document.body.contains(hudElement)) {
          document.body.appendChild(hudElement);
        }
        hudElement.style.opacity = '1';
      } else {
        hudElement.style.opacity = '0.2';
      }
    }
  }

  function update(delta) {
    animationTime += delta;

    // Gentle yacht roll on ocean swell
    if (scene && scene.children.length > 0) {
      var rollAmount = Math.sin(animationTime * 0.5) * 0.02;
      var pitchAmount = Math.cos(animationTime * 0.4) * 0.015;

      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        if (obj && !obj.userData.isRotor && !obj.userData.isDish && !obj.userData.isRadar) {
          if (!obj.userData.originalRotation) {
            obj.userData.originalRotation = {
              x: obj.rotation.x,
              y: obj.rotation.y,
              z: obj.rotation.z
            };
          }
          obj.rotation.x = obj.userData.originalRotation.x + pitchAmount;
          obj.rotation.z = obj.userData.originalRotation.z + rollAmount;
        }
      }
    }

    // Satellite dish tracks and rotates
    for (var j = 0; j < objects.length; j++) {
      var obj = objects[j];
      if (obj && obj.userData.isDish) {
        obj.rotation.y += delta * 0.8;
        obj.rotation.z = Math.cos(animationTime * 0.3) * 0.5 + 0.3;
      }
    }

    // Radar spins
    for (var k = 0; k < objects.length; k++) {
      var obj = objects[k];
      if (obj && obj.userData.isRadar) {
        obj.rotation.y += delta * 1.5;
      }
    }

    // Server room lights pulse
    for (var m = 0; m < objects.length; m++) {
      var obj = objects[m];
      if (obj && obj.userData.isServerRoom) {
        var pulse = Math.sin(animationTime * 2) * 0.2 + 0.3;
        if (obj.material) {
          obj.material.emissiveIntensity = pulse;
        }
      }
      if (obj && obj.userData.isRack) {
        var rackPulse = Math.sin(animationTime * 3 + obj.position.x) * 0.15 + 0.25;
        if (obj.material) {
          obj.material.emissiveIntensity = rackPulse;
        }
      }
    }

    // Pool water shimmers
    for (var p = 0; p < objects.length; p++) {
      var obj = objects[p];
      if (obj && obj.userData.isPool) {
        obj.position.y = 4.5 + Math.sin(animationTime * 1.5) * 0.05;
        if (obj.material) {
          obj.material.opacity = 0.7 + Math.sin(animationTime * 2) * 0.1;
        }
      }
    }

    // Helicopter rotor spins
    for (var r = 0; r < objects.length; r++) {
      var obj = objects[r];
      if (obj && obj.userData.isRotor) {
        obj.rotation.y += delta * 5;
      }
    }

    updateHUD();
  }

  function reset() {
    // Remove all objects from scene
    for (var i = objects.length - 1; i >= 0; i--) {
      if (objects[i] && objects[i].parent) {
        objects[i].parent.remove(objects[i]);
      }
    }

    // Remove HUD
    if (hudElement && document.body.contains(hudElement)) {
      document.body.removeChild(hudElement);
    }

    // Remove key binding listener
    document.removeEventListener('keydown', handleKeyBinding);

    // Clear arrays
    objects = [];
    enemies = [];
    animationTime = 0;
    cyberNodesDown = 0;
    crewNeutralized = 0;
    dealerCaptured = false;
    hudElement = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
