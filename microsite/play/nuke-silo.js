window.NukeSilo = (function() {
  'use strict';

  var silo = {
    meshes: [],
    lights: [],
    guards: [],
    state: {
      launchCountdown: 120,
      doorsOpen: false,
      missileArmored: true,
      elevatorHeight: 0
    },
    colors: {
      steelGray: 0x4A4A4A,
      alertRed: 0xFF0000,
      warningYellow: 0xFFDD00,
      missileWhite: 0xF0F0F0,
      screenGreen: 0x00FF44,
      darkGray: 0x1A1A1A
    }
  };

  function init(scene, camera) {
    silo.meshes = [];
    silo.lights = [];
    silo.guards = [];

    camera.position.set(0, 5, 15);
    camera.lookAt(0, 5, 0);

    // Main silo shaft - cylindrical walls
    var siloGeometry = new THREE.CylinderGeometry(40, 40, 100, 32, 16, true);
    var siloMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.8,
      roughness: 0.6
    });
    var siloWalls = new THREE.Mesh(siloGeometry, siloMaterial);
    siloWalls.position.y = 0;
    siloWalls.castShadow = true;
    siloWalls.receiveShadow = true;
    scene.add(siloWalls);
    silo.meshes.push(siloWalls);

    // Floor platform - BoxGeometry with very small depth
    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.darkGray,
      metalness: 0.7,
      roughness: 0.4
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -45;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    silo.meshes.push(floor);

    // Ceiling platform
    var ceilingGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial);
    ceiling.position.y = 45;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    silo.meshes.push(ceiling);

    // Central ICBM missile - large cylinder
    var missileBodyGeometry = new THREE.CylinderGeometry(3, 3, 60, 16);
    var missileMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.missileWhite,
      metalness: 0.9,
      roughness: 0.3
    });
    var missileBody = new THREE.Mesh(missileBodyGeometry, missileMaterial);
    missileBody.position.set(0, 0, 0);
    missileBody.castShadow = true;
    missileBody.receiveShadow = true;
    scene.add(missileBody);
    silo.meshes.push(missileBody);

    // Missile nosecone - cone geometry
    var noseconeGeometry = new THREE.ConeGeometry(3, 12, 16);
    var nosecone = new THREE.Mesh(noseconeGeometry, missileMaterial);
    nosecone.position.set(0, 36, 0);
    nosecone.castShadow = true;
    nosecone.receiveShadow = true;
    scene.add(nosecone);
    silo.meshes.push(nosecone);

    // Missile base thruster - cone inverted
    var thrusterGeometry = new THREE.ConeGeometry(4, 8, 16);
    var thrusterMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      metalness: 0.6,
      roughness: 0.5
    });
    var thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    thruster.position.set(0, -34, 0);
    thruster.rotation.z = Math.PI;
    thruster.castShadow = true;
    thruster.receiveShadow = true;
    scene.add(thruster);
    silo.meshes.push(thruster);

    // Launch control console 1 - left side
    var consoleGeometry = new THREE.BoxGeometry(6, 8, 4);
    var consoleMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.6,
      roughness: 0.7
    });
    var console1 = new THREE.Mesh(consoleGeometry, consoleMaterial);
    console1.position.set(-18, 0, -15);
    console1.castShadow = true;
    console1.receiveShadow = true;
    scene.add(console1);
    silo.meshes.push(console1);

    // Console screen panel 1 - glass effect
    var screenGeometry = new THREE.BoxGeometry(5.5, 5, 0.3);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.screenGreen,
      metalness: 0.1,
      roughness: 0.2,
      emissive: silo.colors.screenGreen,
      emissiveIntensity: 0.3
    });
    var screen1 = new THREE.Mesh(screenGeometry, screenMaterial);
    screen1.position.set(-18, 2, -13);
    screen1.castShadow = true;
    screen1.receiveShadow = true;
    scene.add(screen1);
    silo.meshes.push(screen1);

    // Launch control console 2 - right side
    var console2 = new THREE.Mesh(consoleGeometry, consoleMaterial);
    console2.position.set(18, 0, -15);
    console2.castShadow = true;
    console2.receiveShadow = true;
    scene.add(console2);
    silo.meshes.push(console2);

    // Console screen panel 2
    var screen2 = new THREE.Mesh(screenGeometry, screenMaterial);
    screen2.position.set(18, 2, -13);
    screen2.castShadow = true;
    screen2.receiveShadow = true;
    scene.add(screen2);
    silo.meshes.push(screen2);

    // Emergency console - front center
    var emergencyGeometry = new THREE.BoxGeometry(8, 6, 3);
    var emergencyMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.alertRed,
      metalness: 0.5,
      roughness: 0.6
    });
    var emergencyConsole = new THREE.Mesh(emergencyGeometry, emergencyMaterial);
    emergencyConsole.position.set(0, -2, -20);
    emergencyConsole.castShadow = true;
    emergencyConsole.receiveShadow = true;
    scene.add(emergencyConsole);
    silo.meshes.push(emergencyConsole);

    // Blast door 1 - sliding left
    var doorGeometry = new THREE.BoxGeometry(8, 12, 1.5);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.85,
      roughness: 0.4
    });
    var blastDoor1 = new THREE.Mesh(doorGeometry, doorMaterial);
    blastDoor1.position.set(-20, 0, 25);
    blastDoor1.castShadow = true;
    blastDoor1.receiveShadow = true;
    blastDoor1.userData.initialX = -20;
    scene.add(blastDoor1);
    silo.meshes.push(blastDoor1);

    // Blast door 2 - sliding right
    var blastDoor2 = new THREE.Mesh(doorGeometry, doorMaterial);
    blastDoor2.position.set(20, 0, 25);
    blastDoor2.castShadow = true;
    blastDoor2.receiveShadow = true;
    blastDoor2.userData.initialX = 20;
    scene.add(blastDoor2);
    silo.meshes.push(blastDoor2);

    // Catwalk structure 1 - upper left
    var catwalkGeometry = new THREE.BoxGeometry(12, 0.4, 6);
    var catwalkMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.7,
      roughness: 0.5
    });
    var catwalk1 = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk1.position.set(-18, 15, -8);
    catwalk1.castShadow = true;
    catwalk1.receiveShadow = true;
    scene.add(catwalk1);
    silo.meshes.push(catwalk1);

    // Catwalk support pillar 1
    var pillarGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
    var pillarMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.6,
      roughness: 0.6
    });
    var pillar1 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar1.position.set(-18, 5, -8);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;
    scene.add(pillar1);
    silo.meshes.push(pillar1);

    // Catwalk structure 2 - upper right
    var catwalk2 = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk2.position.set(18, 15, -8);
    catwalk2.castShadow = true;
    catwalk2.receiveShadow = true;
    scene.add(catwalk2);
    silo.meshes.push(catwalk2);

    // Catwalk support pillar 2
    var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar2.position.set(18, 5, -8);
    pillar2.castShadow = true;
    pillar2.receiveShadow = true;
    scene.add(pillar2);
    silo.meshes.push(pillar2);

    // Elevator shaft - cylindrical
    var elevatorGeometry = new THREE.CylinderGeometry(3.5, 3.5, 80, 16);
    var elevatorMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.darkGray,
      metalness: 0.5,
      roughness: 0.7
    });
    var elevatorShaft = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevatorShaft.position.set(-28, 0, -25);
    elevatorShaft.castShadow = true;
    elevatorShaft.receiveShadow = true;
    scene.add(elevatorShaft);
    silo.meshes.push(elevatorShaft);

    // Elevator car - platform
    var elevatorCarGeometry = new THREE.BoxGeometry(6, 3, 6);
    var elevatorCarMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.5
    });
    var elevatorCar = new THREE.Mesh(elevatorCarGeometry, elevatorCarMaterial);
    elevatorCar.position.set(-28, 0, -25);
    elevatorCar.castShadow = true;
    elevatorCar.receiveShadow = true;
    elevatorCar.userData.baseY = 0;
    scene.add(elevatorCar);
    silo.meshes.push(elevatorCar);

    // Warning light 1 - top left
    var lightGeometry = new THREE.SphereGeometry(1.2, 8, 8);
    var warningLightMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.alertRed,
      metalness: 0.3,
      roughness: 0.4,
      emissive: silo.colors.alertRed,
      emissiveIntensity: 0.5
    });
    var warningLight1 = new THREE.Mesh(lightGeometry, warningLightMaterial);
    warningLight1.position.set(-35, 38, 0);
    warningLight1.castShadow = true;
    warningLight1.receiveShadow = true;
    warningLight1.userData.blinkState = false;
    scene.add(warningLight1);
    silo.meshes.push(warningLight1);

    // Warning light 2 - top right
    var warningLight2 = new THREE.Mesh(lightGeometry, warningLightMaterial);
    warningLight2.position.set(35, 38, 0);
    warningLight2.castShadow = true;
    warningLight2.receiveShadow = true;
    warningLight2.userData.blinkState = false;
    scene.add(warningLight2);
    silo.meshes.push(warningLight2);

    // Warning light 3 - bottom
    var warningLight3 = new THREE.Mesh(lightGeometry, warningLightMaterial);
    warningLight3.position.set(0, -38, 30);
    warningLight3.castShadow = true;
    warningLight3.receiveShadow = true;
    warningLight3.userData.blinkState = false;
    scene.add(warningLight3);
    silo.meshes.push(warningLight3);

    // Countdown display - BoxGeometry screen
    var countdownGeometry = new THREE.BoxGeometry(6, 4, 0.5);
    var countdownMaterial = new THREE.MeshStandardMaterial({
      color: 0x001100,
      metalness: 0.2,
      roughness: 0.3,
      emissive: silo.colors.screenGreen,
      emissiveIntensity: 0.4
    });
    var countdownDisplay = new THREE.Mesh(countdownGeometry, countdownMaterial);
    countdownDisplay.position.set(0, 20, -35);
    countdownDisplay.castShadow = true;
    countdownDisplay.receiveShadow = true;
    countdownDisplay.userData.countdown = 120;
    scene.add(countdownDisplay);
    silo.meshes.push(countdownDisplay);

    // Missile exhaust glow sphere - pulsing effect
    var exhaustGeometry = new THREE.SphereGeometry(2, 8, 8);
    var exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0xFF6600,
      emissiveIntensity: 0.6
    });
    var exhaustGlow = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustGlow.position.set(0, -30, 0);
    exhaustGlow.castShadow = true;
    exhaustGlow.receiveShadow = true;
    exhaustGlow.userData.pulseTime = 0;
    scene.add(exhaustGlow);
    silo.meshes.push(exhaustGlow);

    // Corridor wall segment 1 - left
    var corridorGeometry = new THREE.BoxGeometry(4, 10, 40);
    var corridorMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.5,
      roughness: 0.7
    });
    var corridor1 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor1.position.set(-22, 0, 20);
    corridor1.castShadow = true;
    corridor1.receiveShadow = true;
    scene.add(corridor1);
    silo.meshes.push(corridor1);

    // Corridor wall segment 2 - right
    var corridor2 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor2.position.set(22, 0, 20);
    corridor2.castShadow = true;
    corridor2.receiveShadow = true;
    scene.add(corridor2);
    silo.meshes.push(corridor2);

    // Reinforced door frame 1
    var doorFrameGeometry = new THREE.BoxGeometry(0.8, 10, 0.8);
    var doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.steelGray,
      metalness: 0.8,
      roughness: 0.4
    });
    var doorFrame1 = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame1.position.set(-20, 0, 5);
    doorFrame1.castShadow = true;
    doorFrame1.receiveShadow = true;
    scene.add(doorFrame1);
    silo.meshes.push(doorFrame1);

    // Reinforced door frame 2
    var doorFrame2 = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame2.position.set(20, 0, 5);
    doorFrame2.castShadow = true;
    doorFrame2.receiveShadow = true;
    scene.add(doorFrame2);
    silo.meshes.push(doorFrame2);

    // Warning stripe panel 1 - horizontal stripe pattern
    var stripeGeometry = new THREE.BoxGeometry(8, 1.5, 0.3);
    var stripeMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.warningYellow,
      metalness: 0.3,
      roughness: 0.6
    });
    var stripe1 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe1.position.set(-20, 20, 30);
    stripe1.castShadow = true;
    stripe1.receiveShadow = true;
    scene.add(stripe1);
    silo.meshes.push(stripe1);

    // Warning stripe panel 2
    var stripe2 = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe2.position.set(20, 20, 30);
    stripe2.castShadow = true;
    stripe2.receiveShadow = true;
    scene.add(stripe2);
    silo.meshes.push(stripe2);

    // Radiation warning sign - box indicator
    var warningGeometry = new THREE.BoxGeometry(2, 2, 0.3);
    var warningMaterial = new THREE.MeshStandardMaterial({
      color: silo.colors.warningYellow,
      metalness: 0.2,
      roughness: 0.5
    });
    var warningSign = new THREE.Mesh(warningGeometry, warningMaterial);
    warningSign.position.set(0, 35, -20);
    warningSign.castShadow = true;
    warningSign.receiveShadow = true;
    scene.add(warningSign);
    silo.meshes.push(warningSign);

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    silo.lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;
    scene.add(directionalLight);
    silo.lights.push(directionalLight);

    var redLight = new THREE.PointLight(silo.colors.alertRed, 0.5, 50);
    redLight.position.set(-35, 30, 0);
    scene.add(redLight);
    silo.lights.push(redLight);

    var greenLight = new THREE.PointLight(silo.colors.screenGreen, 0.6, 30);
    greenLight.position.set(0, 22, -33);
    scene.add(greenLight);
    silo.lights.push(greenLight);

    // Initialize guard spawn points
    silo.guardSpawns = [
      { pos: new THREE.Vector3(-18, 0, -15), name: 'console_left' },
      { pos: new THREE.Vector3(18, 0, -15), name: 'console_right' },
      { pos: new THREE.Vector3(-18, 15, -8), name: 'catwalk_left' },
      { pos: new THREE.Vector3(18, 15, -8), name: 'catwalk_right' },
      { pos: new THREE.Vector3(0, 0, 30), name: 'corridor_center' },
      { pos: new THREE.Vector3(-25, 0, 20), name: 'corridor_left' },
      { pos: new THREE.Vector3(25, 0, 20), name: 'corridor_right' },
      { pos: new THREE.Vector3(0, 5, -25), name: 'emergency_post' }
    ];
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    // Update countdown timer
    silo.state.launchCountdown = Math.max(0, 120 - (time % 120));

    // Strobe warning lights
    var blinkCycle = Math.sin(time * 4) > 0;
    for (var i = 0; i < silo.meshes.length; i++) {
      var mesh = silo.meshes[i];

      if (mesh.userData && mesh.userData.blinkState !== undefined) {
        if (blinkCycle) {
          mesh.material.emissiveIntensity = 0.8;
        } else {
          mesh.material.emissiveIntensity = 0.2;
        }
      }

      // Pulse exhaust glow
      if (mesh.userData && mesh.userData.pulseTime !== undefined) {
        var pulse = 0.5 + Math.sin(time * 3) * 0.3;
        mesh.material.emissiveIntensity = pulse;
        var scale = 0.9 + Math.sin(time * 2.5) * 0.15;
        mesh.scale.set(scale, scale, scale);
      }

      // Animate elevator
      if (mesh.userData && mesh.userData.baseY !== undefined) {
        var elevatorPhase = (time * 0.3) % 2;
        if (elevatorPhase < 1) {
          mesh.position.y = mesh.userData.baseY + elevatorPhase * 20;
        } else {
          mesh.position.y = mesh.userData.baseY + (2 - elevatorPhase) * 20;
        }
      }

      // Animate sliding doors
      if (mesh.userData && mesh.userData.initialX !== undefined) {
        var doorPhase = Math.sin(time * 0.5) * 0.5 + 0.5;
        if (mesh.userData.initialX < 0) {
          mesh.position.x = mesh.userData.initialX - doorPhase * 8;
        } else {
          mesh.position.x = mesh.userData.initialX + doorPhase * 8;
        }
      }
    }

    // Update countdown display material
    for (var j = 0; j < silo.meshes.length; j++) {
      if (silo.meshes[j].userData && silo.meshes[j].userData.countdown !== undefined) {
        var intensity = 0.3 + Math.sin(time * 2) * 0.2;
        silo.meshes[j].material.emissiveIntensity = intensity;
      }
    }

    // Spawn guards periodically
    if (Math.floor(time * 10) % 40 === 0 && silo.guards.length < 8) {
      var spawnIdx = Math.floor(Math.random() * silo.guardSpawns.length);
      var spawn = silo.guardSpawns[spawnIdx];
      silo.guards.push({
        pos: spawn.pos.clone(),
        spawnPoint: spawn.name,
        active: true
      });
    }
  }

  function reset() {
    for (var i = silo.meshes.length - 1; i >= 0; i--) {
      if (silo.meshes[i].parent) {
        silo.meshes[i].parent.remove(silo.meshes[i]);
      }
    }
    for (var j = silo.lights.length - 1; j >= 0; j--) {
      if (silo.lights[j].parent) {
        silo.lights[j].parent.remove(silo.lights[j]);
      }
    }
    silo.meshes = [];
    silo.lights = [];
    silo.guards = [];
    silo.state.launchCountdown = 120;
    silo.state.doorsOpen = false;
    silo.state.missileArmored = true;
    silo.state.elevatorHeight = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    state: silo.state,
    guardSpawns: silo.guardSpawns
  };
}());
