window.NuclearBunker = (function() {
  'use strict';

  var sceneObjects = [];
  var keybindState = { n: false, b: false, lastNTime: 0 };
  var launchCountdown = 600; // 10 minutes in seconds
  var accessCodesDestroyed = 0;
  var generalLocated = false;
  var isActive = false;
  var materials = {};
  var meshes = {};
  var lights = {};

  var init = function(scene, camera) {
    isActive = true;
    sceneObjects = [];
    launchCountdown = 600;
    accessCodesDestroyed = 0;
    generalLocated = false;
    keybindState = { n: false, b: false, lastNTime: 0 };

    // Create materials
    var concreteGrey = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var metalGrey = new THREE.MeshStandardMaterial({ color: 0x696969, metalness: 0.7 });
    var darkSteel = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 });
    var emissiveGreen = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.6 });
    var emissiveRed = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff3300, emissiveIntensity: 0.6 });
    var soldierOliveDrab = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    var consoleBlack = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });

    materials.concrete = concreteGrey;
    materials.metal = metalGrey;
    materials.darkSteel = darkSteel;
    materials.emissiveGreen = emissiveGreen;
    materials.emissiveRed = emissiveRed;
    materials.soldierOliveDrab = soldierOliveDrab;
    materials.consoleBlack = consoleBlack;

    // Ambient and lighting for cold war bunker
    scene.background = new THREE.Color(0x1a1a1a);

    var ambientLight = new THREE.AmbientLight(0xccccff, 0.4);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    // Fluorescent lighting flicker effect
    var mainLight = new THREE.DirectionalLight(0xf0f0ff, 0.7);
    mainLight.position.set(0, 15, 0);
    scene.add(mainLight);
    sceneObjects.push(mainLight);
    lights.main = mainLight;

    var spotLight = new THREE.SpotLight(0xccccff, 0.8);
    spotLight.position.set(10, 12, 10);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    sceneObjects.push(spotLight);
    lights.spot = spotLight;

    // BLAST DOOR - massive box, slowly opening
    var blastDoorGeom = new THREE.BoxGeometry(12, 20, 1.5);
    var blastDoor = new THREE.Mesh(blastDoorGeom, materials.darkSteel);
    blastDoor.position.set(0, 10, -30);
    blastDoor.userData.isBlastDoor = true;
    scene.add(blastDoor);
    sceneObjects.push(blastDoor);
    meshes.blastDoor = blastDoor;

    // Blast door frame
    var doorFrameGeom = new THREE.BoxGeometry(12.8, 21, 0.8);
    var doorFrame = new THREE.Mesh(doorFrameGeom, materials.concrete);
    doorFrame.position.set(0, 10, -30.5);
    scene.add(doorFrame);
    sceneObjects.push(doorFrame);

    // LAUNCH CONTROL CONSOLE - wide box with emissive buttons
    var consoleGeom = new THREE.BoxGeometry(8, 3, 2);
    var console = new THREE.Mesh(consoleGeom, materials.consoleBlack);
    console.position.set(0, 2, 15);
    console.userData.isConsole = true;
    scene.add(console);
    sceneObjects.push(console);
    meshes.console = console;

    // Console buttons (emissive)
    var buttonGeom = new THREE.BoxGeometry(0.5, 0.4, 0.3);
    for (var i = 0; i < 6; i++) {
      var button = new THREE.Mesh(buttonGeom, materials.emissiveGreen);
      button.position.set(-2.5 + i * 1, 2.5, 15.2);
      scene.add(button);
      sceneObjects.push(button);
    }

    // ICBM MISSILE in silo - long cylinder with conical nose
    var missileBodyGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 16);
    var missileBody = new THREE.Mesh(missileBodyGeom, materials.metalGrey);
    missileBody.position.set(-15, 0, 0);
    missileBody.userData.isMissile = true;
    missileBody.userData.baseY = 0;
    scene.add(missileBody);
    sceneObjects.push(missileBody);
    meshes.missile = missileBody;

    // Missile nose cone
    var noseGeom = new THREE.ConeGeometry(0.8, 4, 16);
    var noseCone = new THREE.Mesh(noseGeom, materials.emissiveRed);
    noseCone.position.set(-15, 10, 0);
    scene.add(noseCone);
    sceneObjects.push(noseCone);
    meshes.noseCone = noseCone;

    // Silo walls
    var siloGeom = new THREE.CylinderGeometry(3, 3, 40, 8);
    var silo = new THREE.Mesh(siloGeom, materials.concrete);
    silo.position.set(-15, 0, 0);
    scene.add(silo);
    sceneObjects.push(silo);

    // STATUS BOARD - large flat box with emissive grid of lights
    var boardGeom = new THREE.BoxGeometry(10, 6, 0.5);
    var statusBoard = new THREE.Mesh(boardGeom, materials.consoleBlack);
    statusBoard.position.set(20, 8, 0);
    statusBoard.userData.isStatusBoard = true;
    scene.add(statusBoard);
    sceneObjects.push(statusBoard);
    meshes.statusBoard = statusBoard;

    // Status board lights grid
    var lightGeom = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 8; col++) {
        var light = new THREE.Mesh(lightGeom, materials.emissiveGreen);
        light.position.set(16 + col * 0.5, 5 + row * 0.5, 0.3);
        light.userData.blinkPhase = Math.random() * Math.PI * 2;
        scene.add(light);
        sceneObjects.push(light);
      }
    }

    // BUNKER CORRIDOR SECTIONS - box tunnels
    for (var c = 0; c < 5; c++) {
      var corridorGeom = new THREE.BoxGeometry(8, 4, 15);
      var corridor = new THREE.Mesh(corridorGeom, materials.concrete);
      corridor.position.set(-20 + c * 18, 2, -10);
      scene.add(corridor);
      sceneObjects.push(corridor);
    }

    // MAP TABLE - flat box with emissive overlay
    var mapGeom = new THREE.BoxGeometry(6, 0.5, 6);
    var mapTable = new THREE.Mesh(mapGeom, materials.metalGrey);
    mapTable.position.set(-20, 1.5, -20);
    mapTable.userData.isMapTable = true;
    scene.add(mapTable);
    sceneObjects.push(mapTable);

    // Map grid overlay
    var mapOverlayGeom = new THREE.BoxGeometry(5.8, 0.1, 5.8);
    var mapOverlay = new THREE.Mesh(mapOverlayGeom, materials.emissiveGreen);
    mapOverlay.position.set(-20, 2, -20);
    scene.add(mapOverlay);
    sceneObjects.push(mapOverlay);

    // RETRO COMPUTER RACKS - box arrays with blinking emissive lights
    for (var rack = 0; rack < 3; rack++) {
      var rackGeom = new THREE.BoxGeometry(2, 8, 1);
      var computerRack = new THREE.Mesh(rackGeom, materials.darkSteel);
      computerRack.position.set(10 + rack * 3, 4, -25);
      scene.add(computerRack);
      sceneObjects.push(computerRack);

      // Blinking lights on each rack
      for (var light_i = 0; light_i < 8; light_i++) {
        var rackLightGeom = new THREE.BoxGeometry(0.2, 0.2, 0.1);
        var rackLight = new THREE.Mesh(rackLightGeom, materials.emissiveGreen);
        rackLight.position.set(10 + rack * 3, 0.5 + light_i * 0.9, -24.5);
        rackLight.userData.blinkPhase = Math.random() * Math.PI * 2;
        rackLight.userData.blinkSpeed = 2 + Math.random() * 3;
        scene.add(rackLight);
        sceneObjects.push(rackLight);
      }
    }

    // ENEMIES: Rogue soldiers (olive drab box figures)
    for (var soldier = 0; soldier < 4; soldier++) {
      var soldierBodyGeom = new THREE.BoxGeometry(0.8, 2, 0.6);
      var soldierBody = new THREE.Mesh(soldierBodyGeom, materials.soldierOliveDrab);
      soldierBody.position.set(-10 + soldier * 8, 1, 5 + soldier * 3);
      soldierBody.userData.isSoldier = true;
      soldierBody.userData.health = 50;
      scene.add(soldierBody);
      sceneObjects.push(soldierBody);

      // Soldier head
      var headGeom = new THREE.BoxGeometry(0.6, 0.7, 0.6);
      var head = new THREE.Mesh(headGeom, materials.soldierOliveDrab);
      head.position.set(-10 + soldier * 8, 2.5, 5 + soldier * 3);
      scene.add(head);
      sceneObjects.push(head);

      // Soldier gun
      var gunGeom = new THREE.BoxGeometry(0.2, 0.3, 1.2);
      var gun = new THREE.Mesh(gunGeom, materials.darkSteel);
      gun.position.set(-10 + soldier * 8, 1.5, 6 + soldier * 3);
      scene.add(gun);
      sceneObjects.push(gun);
    }

    // GENERAL BOSS - larger figure at console
    var generalBodyGeom = new THREE.BoxGeometry(1.2, 2.5, 0.8);
    var generalBody = new THREE.Mesh(generalBodyGeom, new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
    generalBody.position.set(0, 1.3, 12);
    generalBody.userData.isGeneral = true;
    generalBody.userData.health = 200;
    scene.add(generalBody);
    sceneObjects.push(generalBody);

    // General head
    var generalHeadGeom = new THREE.BoxGeometry(0.8, 1, 0.8);
    var generalHead = new THREE.Mesh(generalHeadGeom, new THREE.MeshStandardMaterial({ color: 0xa0522d }));
    generalHead.position.set(0, 3, 12);
    scene.add(generalHead);
    sceneObjects.push(generalHead);

    // General uniform badge
    var badgeGeom = new THREE.BoxGeometry(0.3, 0.3, 0.1);
    var badge = new THREE.Mesh(badgeGeom, materials.emissiveRed);
    badge.position.set(0.3, 1.8, 12.4);
    scene.add(badge);
    sceneObjects.push(badge);

    generalLocated = true;

    // Listen for keybinds
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  };

  var handleKeyDown = function(event) {
    var key = event.key.toLowerCase();
    if (key === 'n') {
      keybindState.n = true;
      keybindState.lastNTime = Date.now();
    }
    if (key === 'b' && keybindState.n && (Date.now() - keybindState.lastNTime < 400)) {
      toggleNuclearBunker();
    }
  };

  var handleKeyUp = function(event) {
    var key = event.key.toLowerCase();
    if (key === 'n') {
      keybindState.n = false;
    }
  };

  var toggleNuclearBunker = function() {
    isActive = !isActive;
    var message = isActive ? 'NUCLEAR BUNKER ACTIVATED' : 'NUCLEAR BUNKER DEACTIVATED';
    if (window.HUD && window.HUD.showNotification) {
      window.HUD.showNotification(message);
    }
  };

  var update = function(delta) {
    if (!isActive) return;

    // Countdown timer
    if (launchCountdown > 0) {
      launchCountdown -= delta;
      if (launchCountdown < 0) launchCountdown = 0;
    }

    // Blast door slowly opens as time runs out
    if (meshes.blastDoor) {
      var openAmount = Math.max(0, 1 - (launchCountdown / 600));
      meshes.blastDoor.position.z = -30 + openAmount * 8;
      meshes.blastDoor.rotation.y = openAmount * Math.PI / 4;
    }

    // ICBM missile rises as launch approaches
    if (meshes.missile && meshes.noseCone) {
      var riseAmount = (1 - (launchCountdown / 600)) * 12;
      meshes.missile.position.y = riseAmount;
      meshes.noseCone.position.y = 10 + riseAmount;
    }

    // Fluorescent light flicker
    if (lights.main) {
      lights.main.intensity = 0.65 + Math.sin(Date.now() * 0.003) * 0.1;
    }

    // Update blinking lights on computer racks and status board
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.userData && obj.userData.blinkPhase !== undefined) {
        var blink = Math.sin((Date.now() * 0.001 + obj.userData.blinkPhase) * (obj.userData.blinkSpeed || 2));
        obj.material.emissiveIntensity = 0.3 + blink * 0.4;
      }
    }

    // Rotate console slightly for visual effect
    if (meshes.console) {
      meshes.console.rotation.z = Math.sin(Date.now() * 0.0005) * 0.02;
    }

    // Rotate map table slightly
    if (meshes.statusBoard) {
      meshes.statusBoard.rotation.z = Math.sin(Date.now() * 0.0003) * 0.03;
    }
  };

  var reset = function() {
    isActive = false;
    launchCountdown = 600;
    accessCodesDestroyed = 0;
    generalLocated = false;
    keybindState = { n: false, b: false, lastNTime: 0 };

    // Remove all scene objects
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (obj && obj.parent) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            for (var m = 0; m < obj.material.length; m++) {
              obj.material[m].dispose();
            }
          } else {
            obj.material.dispose();
          }
        }
        obj.parent.remove(obj);
      }
    }

    sceneObjects = [];
    meshes = {};
    materials = {};
    lights = {};

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
  };

  var getHUDInfo = function() {
    var minutes = Math.floor(launchCountdown / 60);
    var seconds = Math.floor(launchCountdown % 60);
    var countdownStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

    return {
      launchCountdown: countdownStr,
      accessCodesDestroyed: accessCodesDestroyed,
      generalLocated: generalLocated ? 'YES' : 'NO'
    };
  };

  return {
    init: init,
    update: update,
    reset: reset,
    getHUDInfo: getHUDInfo
  };
}());
