window.TyphoonDeck = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var gameState = {
    timeElapsed: 0,
    crewNeutralized: 0,
    totalCrew: 12,
    missileTubes: 20,
    launchCountdown: 900,
    gameActive: true,
    hudVisible: false
  };

  var keybindBuffer = [];
  var lastKeyTime = 0;

  // Initialize the scene with Soviet Typhoon-class submarine FPS game
  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    sceneObjects = [];
    gameState.timeElapsed = 0;
    gameState.crewNeutralized = 0;
    gameState.launchCountdown = 900;
    gameState.gameActive = true;
    gameState.hudVisible = false;

    // Set up atmosphere
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 150);
    scene.background = new THREE.Color(0x0f0f1e);

    // Storm cloud overhead
    var cloudGeometry = new THREE.BoxGeometry(200, 15, 200);
    var cloudMaterial = new THREE.MeshBasicMaterial({ color: 0x2a2a3a });
    var stormCloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    stormCloud.position.y = 80;
    stormCloud.position.z = -50;
    scene.add(stormCloud);
    sceneObjects.push(stormCloud);

    // Ocean floor reference
    var oceanGeometry = new THREE.BoxGeometry(300, 5, 300);
    var oceanMaterial = new THREE.MeshBasicMaterial({ color: 0x0a1a2e });
    var ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
    ocean.position.y = -30;
    scene.add(ocean);
    sceneObjects.push(ocean);

    // Main submarine hull - massive elongated box, half-submerged
    var hullGeometry = new THREE.BoxGeometry(120, 25, 30);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, metalness: 0.7, roughness: 0.3 });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 0;
    hull.position.z = 0;
    hull.userData.animationPhase = 0;
    scene.add(hull);
    sceneObjects.push(hull);

    // Conning tower / sail - tall box structure
    var towerGeometry = new THREE.BoxGeometry(18, 40, 15);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, metalness: 0.6, roughness: 0.4 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 22;
    tower.position.z = 0;
    scene.add(tower);
    sceneObjects.push(tower);

    // Periscope mast - thin cylinder extending up
    var periscopeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 50, 16);
    var periscopeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.8, roughness: 0.2 });
    var periscope = new THREE.Mesh(periscopeGeometry, periscopeMaterial);
    periscope.position.y = 45;
    periscope.position.z = 0;
    scene.add(periscope);
    sceneObjects.push(periscope);

    // Missile tube hatches - cylinder openings in rows of 20
    var hatchSpacing = 5;
    var hatchStartX = -55;
    for (var i = 0; i < 20; i++) {
      var xPos = hatchStartX + (i % 10) * hatchSpacing;
      var zPos = (i < 10) ? -8 : 8;

      var hatchGeometry = new THREE.CylinderGeometry(2, 2, 2, 32);
      var hatchMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.5, roughness: 0.5 });
      var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
      hatch.position.set(xPos, 8, zPos);
      hatch.userData.hatchIndex = i;
      hatch.userData.isOpen = false;
      hatch.userData.openAnimation = 0;
      scene.add(hatch);
      sceneObjects.push(hatch);
    }

    // Deck guns - cylinder barrels on box mounts
    for (var g = 0; g < 2; g++) {
      var gunMountGeometry = new THREE.BoxGeometry(4, 3, 4);
      var gunMountMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.6, roughness: 0.4 });
      var gunMount = new THREE.Mesh(gunMountGeometry, gunMountMaterial);
      gunMount.position.set((g === 0 ? -35 : 35), 5, -10);
      scene.add(gunMount);
      sceneObjects.push(gunMount);

      var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 12, 16);
      var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.9, roughness: 0.1 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.position.set((g === 0 ? -35 : 35), 8, -10);
      barrel.rotation.z = Math.PI / 6;
      scene.add(barrel);
      sceneObjects.push(barrel);
    }

    // Navigation lights - small spheres with emissive red/green
    var redLightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    var redLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var redLight = new THREE.Mesh(redLightGeometry, redLightMaterial);
    redLight.position.set(-45, 15, 12);
    redLight.userData.emissiveState = 1;
    scene.add(redLight);
    sceneObjects.push(redLight);

    var greenLightGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    var greenLightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var greenLight = new THREE.Mesh(greenLightGeometry, greenLightMaterial);
    greenLight.position.set(45, 15, 12);
    greenLight.userData.emissiveState = 0;
    scene.add(greenLight);
    sceneObjects.push(greenLight);

    // Emergency buoy - sphere
    var buoyGeometry = new THREE.SphereGeometry(2, 16, 16);
    var buoyMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.4, roughness: 0.6 });
    var buoy = new THREE.Mesh(buoyGeometry, buoyMaterial);
    buoy.position.set(50, 5, 25);
    scene.add(buoy);
    sceneObjects.push(buoy);

    // Ballast vent grates - flat boxes with LineSegments grid
    for (var v = 0; v < 4; v++) {
      var grateGeometry = new THREE.BoxGeometry(8, 0.3, 8);
      var grateMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.7, roughness: 0.3 });
      var grate = new THREE.Mesh(grateGeometry, grateMaterial);
      var vxPos = (v % 2 === 0 ? -30 : 30);
      var vzPos = (v < 2 ? -15 : 15);
      grate.position.set(vxPos, 6, vzPos);
      scene.add(grate);
      sceneObjects.push(grate);

      // Line grid on grate
      var grateLines = new THREE.LineSegments();
      var grateLineGeometry = new THREE.BufferGeometry();
      var grateLinePositions = [];
      for (var gx = -3; gx <= 3; gx++) {
        grateLinePositions.push(gx * 1.5, 0, -4, gx * 1.5, 0, 4);
      }
      for (var gz = -3; gz <= 3; gz++) {
        grateLinePositions.push(-4, 0, gz * 1.5, 4, 0, gz * 1.5);
      }
      grateLineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(grateLinePositions), 3));
      var grateLineMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
      var gridLines = new THREE.LineSegments(grateLineGeometry, grateLineMaterial);
      gridLines.position.copy(grate.position);
      scene.add(gridLines);
      sceneObjects.push(gridLines);
    }

    // Access ladder rungs to conning tower - LineSegments
    var ladderLines = new THREE.LineSegments();
    var ladderGeometry = new THREE.BufferGeometry();
    var ladderPositions = [];
    for (var r = 0; r < 8; r++) {
      var rY = 10 + r * 3;
      ladderPositions.push(-2, rY, 8, 2, rY, 8);
    }
    ladderPositions.push(-2, 10, 8, -2, 35, 8);
    ladderPositions.push(2, 10, 8, 2, 35, 8);
    ladderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ladderPositions), 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    ladder.position.set(0, 0, 0);
    scene.add(ladder);
    sceneObjects.push(ladder);

    // Mooring bollards - short cylinders
    for (var b = 0; b < 4; b++) {
      var bollardGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
      var bollardMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, metalness: 0.5, roughness: 0.5 });
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      var bxPos = (b < 2 ? -55 : 55);
      var bzPos = (b % 2 === 0 ? -12 : 12);
      bollard.position.set(bxPos, 7, bzPos);
      scene.add(bollard);
      sceneObjects.push(bollard);
    }

    // Torpedo tube doors on bow - box panels with cylinder holes
    for (var t = 0; t < 6; t++) {
      var doorGeometry = new THREE.BoxGeometry(3, 3, 0.5);
      var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.6, roughness: 0.4 });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      var txPos = -50 + (t % 3) * 4;
      var tyPos = 2 + Math.floor(t / 3) * 4;
      door.position.set(txPos, tyPos, -14);
      scene.add(door);
      sceneObjects.push(door);

      var torpedoHoleGeometry = new THREE.CylinderGeometry(1, 1, 1, 16);
      var torpedoHoleMaterial = new THREE.MeshBasicMaterial({ color: 0x0a0a1a });
      var torpedoHole = new THREE.Mesh(torpedoHoleGeometry, torpedoHoleMaterial);
      torpedoHole.position.set(txPos, tyPos, -13.5);
      torpedoHole.rotation.z = Math.PI / 2;
      scene.add(torpedoHole);
      sceneObjects.push(torpedoHole);
    }

    // Wave spray particles - white sphere clusters at deck edge
    var sprayCount = 12;
    for (var s = 0; s < sprayCount; s++) {
      var sprayGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var sprayMaterial = new THREE.MeshBasicMaterial({ color: 0xccccff });
      var spray = new THREE.Mesh(sprayGeometry, sprayMaterial);
      var sAngle = (s / sprayCount) * Math.PI * 2;
      spray.position.set(Math.cos(sAngle) * 65, 5, Math.sin(sAngle) * 35);
      spray.userData.sprayIndex = s;
      spray.userData.verticalOffset = 0;
      scene.add(spray);
      sceneObjects.push(spray);
    }

    // Searchlight - cylinder + cone sweeping
    var searchlightBaseGeometry = new THREE.CylinderGeometry(1, 1, 1, 16);
    var searchlightBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, metalness: 0.6, roughness: 0.4 });
    var searchlightBase = new THREE.Mesh(searchlightBaseGeometry, searchlightBaseMaterial);
    searchlightBase.position.set(-40, 20, -12);
    scene.add(searchlightBase);
    sceneObjects.push(searchlightBase);

    var searchlightGeometry = new THREE.ConeGeometry(3, 15, 16);
    var searchlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99 });
    var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
    searchlight.position.set(-40, 20, -12);
    searchlight.userData.searchlightSweep = 0;
    scene.add(searchlight);
    sceneObjects.push(searchlight);

    // Radio antenna array - thin cylinders + LineSegments wires
    for (var a = 0; a < 3; a++) {
      var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
      var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.8, roughness: 0.2 });
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      var axPos = -8 + a * 8;
      antenna.position.set(axPos, 50, 5);
      scene.add(antenna);
      sceneObjects.push(antenna);
    }

    // Antenna wires - LineSegments
    var antennaWireLines = new THREE.LineSegments();
    var antennaWireGeometry = new THREE.BufferGeometry();
    var antennaWirePositions = [];
    antennaWirePositions.push(-8, 50, 5, 0, 30, 10);
    antennaWirePositions.push(0, 50, 5, -8, 30, 10);
    antennaWirePositions.push(0, 50, 5, 8, 30, 10);
    antennaWirePositions.push(8, 50, 5, 0, 30, 10);
    antennaWireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(antennaWirePositions), 3));
    var antennaWireMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
    var antennaWires = new THREE.LineSegments(antennaWireGeometry, antennaWireMaterial);
    scene.add(antennaWires);
    sceneObjects.push(antennaWires);

    // Enemy crew figures - box figures with caps (simplified)
    var crewPositions = [
      { x: -20, z: 5 }, { x: -10, z: 8 }, { x: 0, z: 10 }, { x: 10, z: 8 },
      { x: 20, z: 5 }, { x: -30, z: -5 }, { x: -15, z: -8 }, { x: 5, z: -10 },
      { x: 25, z: -7 }, { x: 35, z: 0 }, { x: -40, z: 10 }, { x: 40, z: -8 }
    ];

    for (var c = 0; c < crewPositions.length; c++) {
      var crewBodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
      var crewBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.2, roughness: 0.8 });
      var crewBody = new THREE.Mesh(crewBodyGeometry, crewBodyMaterial);
      crewBody.position.set(crewPositions[c].x, 5, crewPositions[c].z);
      crewBody.userData.crewIndex = c;
      crewBody.userData.isNeutralized = false;
      scene.add(crewBody);
      sceneObjects.push(crewBody);

      var capGeometry = new THREE.SphereGeometry(0.6, 16, 16);
      var capMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.9 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(crewPositions[c].x, 6.5, crewPositions[c].z);
      scene.add(cap);
      sceneObjects.push(cap);
    }

    // Set up keybind listener
    setupKeybinds();
  }

  function setupKeybinds() {
    if (typeof window !== 'undefined' && window.document) {
      document.addEventListener('keydown', function(event) {
        if (event.key.toUpperCase() === 'T' || event.key.toUpperCase() === 'D') {
          var currentTime = Date.now();
          keybindBuffer.push(event.key.toUpperCase());
          lastKeyTime = currentTime;

          if (keybindBuffer.length > 2) {
            keybindBuffer.shift();
          }

          if (keybindBuffer.length === 2 &&
              keybindBuffer[0] === 'T' && keybindBuffer[1] === 'D' &&
              currentTime - lastKeyTime < 400) {
            gameState.hudVisible = !gameState.hudVisible;
            showHUDNotification('HUD ' + (gameState.hudVisible ? 'ENABLED' : 'DISABLED'));
            keybindBuffer = [];
          }
        }
      });
    }
  }

  function showHUDNotification(message) {
    if (typeof window !== 'undefined' && window.document) {
      var notification = document.getElementById('typhoon-hud-notification');
      if (!notification) {
        notification = document.createElement('div');
        notification.id = 'typhoon-hud-notification';
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #1a1a2e; color: #00ff00; padding: 10px 15px; border: 2px solid #00ff00; font-family: monospace; z-index: 1000; font-size: 12px;';
        document.body.appendChild(notification);
      }
      notification.textContent = message;
      notification.style.display = 'block';
      setTimeout(function() {
        notification.style.display = 'none';
      }, 2000);
    }
  }

  function updateHUD() {
    if (!gameState.hudVisible) return;

    var hudElement = document.getElementById('typhoon-hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'typhoon-hud';
      hudElement.style.cssText = 'position: fixed; top: 60px; left: 20px; background: rgba(26, 26, 46, 0.9); color: #00ff00; padding: 15px; border: 2px solid #00ff00; font-family: monospace; z-index: 999; font-size: 12px; line-height: 1.6;';
      document.body.appendChild(hudElement);
    }

    var minutes = Math.floor(gameState.launchCountdown / 60);
    var seconds = gameState.launchCountdown % 60;
    var countdownStr = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

    hudElement.innerHTML = 'MISSILE TUBES: ' + gameState.missileTubes + ' ARMED<br>' +
                          'LAUNCH COUNTDOWN: T-' + countdownStr + '<br>' +
                          'CREW NEUTRALIZED: ' + gameState.crewNeutralized + '/' + gameState.totalCrew;
  }

  function update(delta) {
    if (!scene || !camera) return;

    gameState.timeElapsed += delta;
    if (gameState.launchCountdown > 0) {
      gameState.launchCountdown -= delta;
    }

    // Update submarine hull - rocks slowly in storm (pitch/roll)
    var hullObject = sceneObjects[2];
    if (hullObject) {
      hullObject.userData.animationPhase = (hullObject.userData.animationPhase + delta * 0.3) % (Math.PI * 2);
      hullObject.rotation.x = Math.sin(hullObject.userData.animationPhase) * 0.08;
      hullObject.rotation.z = Math.cos(hullObject.userData.animationPhase) * 0.08;
    }

    // Update missile hatches - cycle open/close
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj.userData && typeof obj.userData.hatchIndex !== 'undefined') {
        var hatchPhase = gameState.timeElapsed * 2 + obj.userData.hatchIndex * 0.15;
        obj.userData.openAnimation = (Math.sin(hatchPhase) + 1) / 2;
        obj.scale.y = 0.5 + obj.userData.openAnimation * 1.5;
        obj.userData.isOpen = obj.userData.openAnimation > 0.5;
      }
    }

    // Update storm waves - rise and fall along hull
    for (var s = 0; s < sceneObjects.length; s++) {
      var sprayObj = sceneObjects[s];
      if (sprayObj.userData && typeof sprayObj.userData.sprayIndex !== 'undefined') {
        var sprayPhase = gameState.timeElapsed * 1.5 + sprayObj.userData.sprayIndex * 0.3;
        sprayObj.userData.verticalOffset = Math.sin(sprayPhase) * 3;
        sprayObj.position.y = 5 + sprayObj.userData.verticalOffset;
      }
    }

    // Update searchlight - sweeps
    for (var sl = 0; sl < sceneObjects.length; sl++) {
      var searchObj = sceneObjects[sl];
      if (searchObj.userData && typeof searchObj.userData.searchlightSweep !== 'undefined') {
        searchObj.userData.searchlightSweep = (gameState.timeElapsed * 1.2) % (Math.PI * 2);
        searchObj.rotation.y = Math.sin(searchObj.userData.searchlightSweep) * 0.8;
      }
    }

    // Update navigation lights - blink alternating red/green
    var redLight = null;
    var greenLight = null;
    for (var nl = 0; nl < sceneObjects.length; nl++) {
      if (sceneObjects[nl].userData && typeof sceneObjects[nl].userData.emissiveState !== 'undefined') {
        if (sceneObjects[nl].material.color.getHex() === 0xff0000) {
          redLight = sceneObjects[nl];
        } else if (sceneObjects[nl].material.color.getHex() === 0x00ff00) {
          greenLight = sceneObjects[nl];
        }
      }
    }

    var blinkPhase = Math.floor(gameState.timeElapsed * 2) % 2;
    if (redLight) {
      redLight.material.opacity = blinkPhase === 0 ? 1 : 0.3;
    }
    if (greenLight) {
      greenLight.material.opacity = blinkPhase === 1 ? 1 : 0.3;
    }

    updateHUD();
  }

  function reset() {
    if (!scene) return;

    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];

    gameState.timeElapsed = 0;
    gameState.crewNeutralized = 0;
    gameState.launchCountdown = 900;
    gameState.gameActive = true;
    gameState.hudVisible = false;
    keybindBuffer = [];

    var hudElement = document.getElementById('typhoon-hud');
    if (hudElement) {
      hudElement.style.display = 'none';
    }
  }

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
