window.BridgeBattle = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var soldiers = [];
  var boats = [];
  var time = 0;
  var hudElement;
  var bridgeDrawSection;
  var helicopterSpotlight;
  var lastKeyPressTime = {};

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    time = 0;
    objects = [];
    soldiers = [];
    boats = [];

    // 1. River base - large deep blue box (400×2×400) below bridge level
    var riverGeometry = new THREE.BoxGeometry(400, 2, 400);
    var riverMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4d7a });
    var river = new THREE.Mesh(riverGeometry, riverMaterial);
    river.position.y = -1;
    river.receiveShadow = true;
    scene.add(river);
    objects.push(river);

    // 2. Bridge deck - gray concrete flat box (80×0.8×16) spanning the river
    var bridgeGeometry = new THREE.BoxGeometry(80, 0.8, 16);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.y = 10;
    bridge.receiveShadow = true;
    bridge.castShadow = true;
    scene.add(bridge);
    objects.push(bridge);

    // 3. Bridge towers - 2 massive steel towers (4×30×4 dark gray boxes)
    var towerGeometry = new THREE.BoxGeometry(4, 30, 4);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.3 });

    var towerEast = new THREE.Mesh(towerGeometry, towerMaterial);
    towerEast.position.set(42, 15, 0);
    towerEast.castShadow = true;
    towerEast.receiveShadow = true;
    scene.add(towerEast);
    objects.push(towerEast);

    var towerWest = new THREE.Mesh(towerGeometry, towerMaterial);
    towerWest.position.set(-42, 15, 0);
    towerWest.castShadow = true;
    towerWest.receiveShadow = true;
    scene.add(towerWest);
    objects.push(towerWest);

    // 4. Bridge cables - diagonal thin box struts from towers to deck edges
    var cableGeometry = new THREE.BoxGeometry(0.3, 0.3, 25);
    var cableMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });

    for (var i = 0; i < 4; i++) {
      var cable = new THREE.Mesh(cableGeometry, cableMaterial);
      cable.position.set(i < 2 ? 42 : -42, 20, -8 + (i % 2) * 16);
      cable.rotation.z = (i < 2 ? 0.4 : -0.4);
      cable.castShadow = true;
      scene.add(cable);
      objects.push(cable);
    }

    // 5. Bridge control house - small box building on tower with windows
    var controlGeometry = new THREE.BoxGeometry(6, 8, 5);
    var controlMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var controlHouse = new THREE.Mesh(controlGeometry, controlMaterial);
    controlHouse.position.set(42, 28, 0);
    controlHouse.castShadow = true;
    controlHouse.receiveShadow = true;
    scene.add(controlHouse);
    objects.push(controlHouse);

    // Window on control house
    var windowGeometry = new THREE.BoxGeometry(0.2, 2, 2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x333333 });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(42.5, 29, 1.5);
    scene.add(window1);
    objects.push(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(42.5, 29, -1.5);
    scene.add(window2);
    objects.push(window2);

    // 6. 4 enemy soldiers on east side - red team colors
    var enemySoldiers = createSoldiers(true);
    soldiers = soldiers.concat(enemySoldiers);

    // 7. 4 friendly soldiers on west side - blue team colors
    var friendlySoldiers = createSoldiers(false);
    soldiers = soldiers.concat(friendlySoldiers);

    // 8. 2 armored APCs - blocky vehicle with turrets + wheels
    createAPC(true);  // East APC
    createAPC(false); // West APC

    // 9. 2 river patrol boats - white hull boxes + cabin + antenna
    createPatrolBoat(true);  // East boat
    createPatrolBoat(false); // West boat

    // 10. Bridge section that can raise
    bridgeDrawSection = createDrawBridgeSection();

    // 11. Road barriers - orange/white striped
    createBarriers();

    // 12. Destroyed vehicle wreck - burned black box + flame emissive spheres
    createWreck();

    // 13. Bridge lamp posts - thin poles + emissive yellow sphere lamps
    for (var i = -40; i <= 40; i += 10) {
      createLampPost(i, 10.8, -8);
      createLampPost(i, 10.8, 8);
    }

    // 14. Rope/chain guard rails - thin long box rails
    var railGeometry = new THREE.BoxGeometry(80, 0.3, 0.3);
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

    var railNorth = new THREE.Mesh(railGeometry, railMaterial);
    railNorth.position.set(0, 11.5, 8.5);
    railNorth.castShadow = true;
    scene.add(railNorth);
    objects.push(railNorth);

    var railSouth = new THREE.Mesh(railGeometry, railMaterial);
    railSouth.position.set(0, 11.5, -8.5);
    railSouth.castShadow = true;
    scene.add(railSouth);
    objects.push(railSouth);

    // 15. River banks - muddy brown flat box shores
    var bankGeometry = new THREE.BoxGeometry(100, 0.5, 50);
    var bankMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5d4f });

    var bankNorth = new THREE.Mesh(bankGeometry, bankMaterial);
    bankNorth.position.set(0, 1, 25);
    bankNorth.receiveShadow = true;
    scene.add(bankNorth);
    objects.push(bankNorth);

    var bankSouth = new THREE.Mesh(bankGeometry, bankMaterial);
    bankSouth.position.set(0, 1, -25);
    bankSouth.receiveShadow = true;
    scene.add(bankSouth);
    objects.push(bankSouth);

    // 16. Helicopter spotlight - overhead emissive cone sweeping
    helicopterSpotlight = createHelicopterSpotlight();

    // Create HUD
    createHUD();

    // Set up keyboard event listener for HUD toggle (H then B)
    document.addEventListener('keydown', handleKeyPress);
  }

  function createSoldiers(isEast) {
    var soldierArray = [];
    var xOffset = isEast ? 50 : -50;
    var color = isEast ? 0xff3333 : 0x3333ff;

    for (var i = 0; i < 4; i++) {
      var zOffset = -5 + (i * 3);
      var soldierGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      soldierGroup.add(body);

      // Head
      var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.2;
      head.castShadow = true;
      soldierGroup.add(head);

      // Weapon (thin box)
      var weaponGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
      var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.5, 0.5, 0);
      weapon.rotation.z = 0.3;
      weapon.castShadow = true;
      soldierGroup.add(weapon);

      soldierGroup.position.set(xOffset, 5, zOffset);
      scene.add(soldierGroup);
      objects.push(soldierGroup);
      soldierArray.push({
        group: soldierGroup,
        isEast: isEast,
        bobOffset: Math.random() * Math.PI * 2
      });
    }

    return soldierArray;
  }

  function createAPC(isEast) {
    var xOffset = isEast ? 60 : -60;
    var apcGroup = new THREE.Group();

    // Hull
    var hullGeometry = new THREE.BoxGeometry(8, 4, 5);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    apcGroup.add(hull);

    // Turret on top
    var turretGeometry = new THREE.BoxGeometry(3, 2, 3);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 2.5;
    turret.castShadow = true;
    apcGroup.add(turret);

    // Gun barrel
    var barrelGeometry = new THREE.BoxGeometry(0.4, 0.4, 4);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 2.8, 2.5);
    barrel.castShadow = true;
    apcGroup.add(barrel);

    // Wheels (6 wheels)
    var wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 16);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    var wheelPositions = [
      [-3, -2, -1.5], [-3, -2, 1.5],
      [0, -2, -1.5], [0, -2, 1.5],
      [3, -2, -1.5], [3, -2, 1.5]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      apcGroup.add(wheel);
    });

    apcGroup.position.set(xOffset, 5, 0);
    scene.add(apcGroup);
    objects.push(apcGroup);
  }

  function createPatrolBoat(isEast) {
    var zOffset = isEast ? -15 : 15;
    var boatGroup = new THREE.Group();

    // Hull
    var hullGeometry = new THREE.BoxGeometry(12, 2, 4);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    boatGroup.add(hull);

    // Cabin
    var cabinGeometry = new THREE.BoxGeometry(4, 3, 3);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.y = 2.5;
    cabin.castShadow = true;
    boatGroup.add(cabin);

    // Antenna
    var antennaGeometry = new THREE.BoxGeometry(0.2, 5, 0.2);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(2, 5.5, 0);
    antenna.castShadow = true;
    boatGroup.add(antenna);

    boatGroup.position.set(0, 1, zOffset);
    scene.add(boatGroup);
    objects.push(boatGroup);
    boats.push({
      group: boatGroup,
      isEast: isEast,
      startZ: zOffset
    });
  }

  function createDrawBridgeSection() {
    var drawGroup = new THREE.Group();

    var drawGeometry = new THREE.BoxGeometry(80, 0.8, 8);
    var drawMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var drawMesh = new THREE.Mesh(drawGeometry, drawMaterial);
    drawMesh.castShadow = true;
    drawMesh.receiveShadow = true;
    drawGroup.add(drawMesh);

    drawGroup.position.set(0, 10, 0);
    drawGroup.userData.maxRotation = Math.PI / 3;
    drawGroup.userData.rotationSpeed = 0.3;
    scene.add(drawGroup);
    objects.push(drawGroup);

    return drawGroup;
  }

  function createBarriers() {
    var barrierPositions = [
      [-30, 10, -9],
      [-20, 10, -9],
      [20, 10, 9],
      [30, 10, 9]
    ];

    barrierPositions.forEach(function(pos) {
      var barrierGroup = new THREE.Group();

      // Orange/white striped pattern
      var stripe1Geometry = new THREE.BoxGeometry(3, 1.5, 0.5);
      var stripe1Material = new THREE.MeshStandardMaterial({ color: 0xff8800 });
      var stripe1 = new THREE.Mesh(stripe1Geometry, stripe1Material);
      stripe1.castShadow = true;
      barrierGroup.add(stripe1);

      var stripe2Geometry = new THREE.BoxGeometry(3, 0.8, 0.5);
      var stripe2Material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var stripe2 = new THREE.Mesh(stripe2Geometry, stripe2Material);
      stripe2.position.y = 0.6;
      stripe2.castShadow = true;
      barrierGroup.add(stripe2);

      barrierGroup.position.set(pos[0], pos[1], pos[2]);
      scene.add(barrierGroup);
      objects.push(barrierGroup);
    });
  }

  function createWreck() {
    var wreckGroup = new THREE.Group();

    // Burned hull
    var hullGeometry = new THREE.BoxGeometry(6, 3, 4);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    wreckGroup.add(hull);

    // Flames - emissive spheres
    var flamePositions = [
      [-2, 2.5, 0],
      [0, 3, 0],
      [2, 2.5, 0]
    ];

    flamePositions.forEach(function(pos) {
      var flameGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var flameMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff4400,
        emissiveIntensity: 0.8
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(pos[0], pos[1], pos[2]);
      wreckGroup.add(flame);
    });

    wreckGroup.position.set(-60, 5, 15);
    scene.add(wreckGroup);
    objects.push(wreckGroup);
  }

  function createLampPost(x, y, z) {
    var lampGroup = new THREE.Group();

    // Pole
    var poleGeometry = new THREE.BoxGeometry(0.2, 3, 0.2);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.castShadow = true;
    lampGroup.add(pole);

    // Lamp - emissive yellow sphere
    var lampGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var lampMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.9
    });
    var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.y = 1.8;
    lamp.userData.baseIntensity = 0.9;
    lamp.userData.flickerOffset = Math.random() * Math.PI * 2;
    lampGroup.add(lamp);

    lampGroup.position.set(x, y, z);
    scene.add(lampGroup);
    objects.push(lampGroup);
  }

  function createHelicopterSpotlight() {
    var spotlightGroup = new THREE.Group();

    // Cone shape (tall thin box)
    var coneGeometry = new THREE.BoxGeometry(30, 50, 30);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xcccc00,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.1
    });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 20;
    spotlightGroup.add(cone);

    spotlightGroup.position.set(0, 40, -50);
    scene.add(spotlightGroup);
    objects.push(spotlightGroup);

    return spotlightGroup;
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '16px';
    hudElement.style.color = '#00ff00';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px 15px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.whiteSpace = 'nowrap';
    hudElement.innerHTML = 'BRIDGE STATUS: LOWERED<br>EAST FORCES: 4<br>WEST FORCES: 4';
    document.body.appendChild(hudElement);
  }

  function handleKeyPress(event) {
    var key = event.key.toUpperCase();
    var now = Date.now();

    if (key === 'H') {
      lastKeyPressTime['H'] = now;
    } else if (key === 'B' && lastKeyPressTime['H']) {
      var timeSinceH = now - lastKeyPressTime['H'];
      if (timeSinceH < 400) {
        toggleHUD();
        lastKeyPressTime['H'] = null;
      }
    } else {
      lastKeyPressTime['H'] = null;
    }
  }

  function toggleHUD() {
    if (hudElement) {
      hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  function update(delta) {
    time += delta;

    // Animate draw bridge section - rotation
    if (bridgeDrawSection) {
      var maxRot = bridgeDrawSection.userData.maxRotation;
      var rotSpeed = bridgeDrawSection.userData.rotationSpeed;
      var liftPhase = Math.sin(time * rotSpeed) * 0.5 + 0.5; // 0 to 1
      bridgeDrawSection.rotation.z = liftPhase * maxRot;
    }

    // Animate patrol boats - drift under bridge
    boats.forEach(function(boat) {
      var direction = boat.isEast ? -1 : 1;
      boat.group.position.z = boat.startZ + Math.sin(time * 0.5) * 3 * direction;
      boat.group.rotation.y = Math.sin(time * 0.3) * 0.2;
    });

    // Animate soldiers - subtle bob
    soldiers.forEach(function(soldier) {
      soldier.group.position.y = 5 + Math.sin(time * 2 + soldier.bobOffset) * 0.3;
    });

    // Animate helicopter spotlight - sweep X-axis
    if (helicopterSpotlight) {
      helicopterSpotlight.position.x = Math.sin(time * 0.5) * 60;
    }

    // Animate lamp posts - flicker
    objects.forEach(function(obj) {
      if (obj.children) {
        obj.children.forEach(function(child) {
          if (child.userData.baseIntensity !== undefined) {
            var flicker = 0.8 + Math.sin(time * 5 + child.userData.flickerOffset) * 0.2;
            child.material.emissiveIntensity = child.userData.baseIntensity * flicker;
          }
        });
      }
    });
  }

  function reset() {
    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Dispose all geometry and materials
    objects.forEach(function(obj) {
      if (obj.children) {
        obj.children.forEach(function(child) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function(mat) { mat.dispose(); });
            } else {
              child.material.dispose();
            }
          }
        });
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    // Clear arrays
    objects = [];
    soldiers = [];
    boats = [];
    bridgeDrawSection = null;
    helicopterSpotlight = null;

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyPress);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
