window.MissileSiloB = (function() {
  'use strict';

  var siloScene = null;
  var countdownTime = 300;
  var countdownElapsed = 0;
  var elapsedGameTime = 0;
  var meshObjects = [];
  var pulseLights = [];
  var strobeLights = [];
  var elevatorPosition = 0;
  var elevatorLevel = 0;
  var countdownTicking = false;

  var SILO_RADIUS = 25;
  var SILO_HEIGHT = 120;
  var MISSILE_HEIGHT = 45;

  var COLORS = {
    sovietGray: 0x4A5A4A,
    militaryGreen: 0x2D5016,
    launchRed: 0xFF2200,
    countdownOrange: 0xFF8800,
    abortGreen: 0x00DD00,
    darkMetal: 0x1A1A1A,
    steelGray: 0x808080,
    warningYellow: 0xFFDD00
  };

  var spawnPoints = [
    { position: new THREE.Vector3(0, 50, 0), name: 'Level B-1' },
    { position: new THREE.Vector3(18, 20, 0), name: 'Level B-2' },
    { position: new THREE.Vector3(-18, -10, 0), name: 'Level B-3' },
    { position: new THREE.Vector3(0, -35, 0), name: 'Level B-4 Control Room' },
    { position: new THREE.Vector3(-22, -5, 15), name: 'Elevator Shaft' }
  ];

  function createMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
    if (scale) mesh.scale.copy(scale);
    siloScene.add(mesh);
    meshObjects.push(mesh);
    return mesh;
  }

  function createSiloShaft() {
    var outerWallGeometry = new THREE.CylinderGeometry(SILO_RADIUS, SILO_RADIUS, SILO_HEIGHT, 32, 8);
    var outerWallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.sovietGray, metalness: 0.7, roughness: 0.5 });
    var outerWall = createMesh(outerWallGeometry, outerWallMaterial, new THREE.Vector3(0, 0, 0));
    outerWall.castShadow = true;
    outerWall.receiveShadow = true;

    var innerWallGeometry = new THREE.CylinderGeometry(SILO_RADIUS - 2, SILO_RADIUS - 2, SILO_HEIGHT, 32, 8);
    var innerWallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkMetal, metalness: 0.8, roughness: 0.4 });
    var innerWall = createMesh(innerWallGeometry, innerWallMaterial, new THREE.Vector3(0, 0, 0));
    innerWall.castShadow = true;

    var levelHeights = [50, 20, -10, -35];
    for (var i = 0; i < levelHeights.length; i++) {
      var ledgeGeometry = new THREE.BoxGeometry(SILO_RADIUS * 2 - 5, 1.5, SILO_RADIUS * 2 - 5);
      var ledgeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.6, roughness: 0.5 });
      createMesh(ledgeGeometry, ledgeMaterial, new THREE.Vector3(0, levelHeights[i], 0));
    }
  }

  function createMissile() {
    var missilePos = new THREE.Vector3(0, -25, 0);

    var bodyGeometry = new THREE.CylinderGeometry(3.5, 3.5, MISSILE_HEIGHT, 16, 8);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.launchRed, metalness: 0.9, roughness: 0.3 });
    var missileBody = createMesh(bodyGeometry, bodyMaterial, missilePos);
    missileBody.castShadow = true;
    missileBody.receiveShadow = true;

    var noseGeometry = new THREE.ConeGeometry(3.5, 12, 16);
    var noseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.launchRed, metalness: 0.85, roughness: 0.4 });
    var noseCone = createMesh(noseGeometry, noseMaterial, new THREE.Vector3(0, missilePos.y + MISSILE_HEIGHT / 2 + 6, 0));
    noseCone.castShadow = true;

    var finGeometry = new THREE.BoxGeometry(0.8, 8, 4);
    var finMaterial = new THREE.MeshStandardMaterial({ color: COLORS.countdownOrange, metalness: 0.7, roughness: 0.5 });
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var finX = Math.cos(angle) * 4;
      var finZ = Math.sin(angle) * 4;
      createMesh(finGeometry, finMaterial, new THREE.Vector3(finX, missilePos.y - 15, finZ));
    }

    var exhaustGeometry = new THREE.CylinderGeometry(2.5, 3, 4, 12, 4);
    var exhaustMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkMetal, metalness: 0.8, roughness: 0.3 });
    createMesh(exhaustGeometry, exhaustMaterial, new THREE.Vector3(0, missilePos.y - MISSILE_HEIGHT / 2 - 2, 0));
  }

  function createLaunchCradle() {
    var armGeometry = new THREE.BoxGeometry(3, 2, SILO_RADIUS - 8);
    var armMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.75, roughness: 0.4 });

    var armLeft = createMesh(armGeometry, armMaterial, new THREE.Vector3(-8, -27, 0));
    armLeft.castShadow = true;
    armLeft.receiveShadow = true;

    var armRight = createMesh(armGeometry, armMaterial, new THREE.Vector3(8, -27, 0));
    armRight.castShadow = true;

    var baseGeometry = new THREE.BoxGeometry(SILO_RADIUS * 2 - 10, 3, SILO_RADIUS * 2 - 10);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.sovietGray, metalness: 0.7, roughness: 0.5 });
    var launchBase = createMesh(baseGeometry, baseMaterial, new THREE.Vector3(0, -32, 0));
    launchBase.castShadow = true;
    launchBase.receiveShadow = true;
  }

  function createBlastDeflector() {
    var deflectorGeometry = new THREE.BoxGeometry(SILO_RADIUS * 2.5, 2, SILO_RADIUS * 2.5);
    var deflectorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.launchRed, metalness: 0.8, roughness: 0.4 });
    var deflector = createMesh(deflectorGeometry, deflectorMaterial, new THREE.Vector3(0, -58, 0));
    deflector.rotation.z = 0.2;
    deflector.castShadow = true;
    deflector.receiveShadow = true;
  }

  function createElevatorShaft() {
    var cageGeometry = new THREE.BoxGeometry(4, 6, 4);
    var cageMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.7, roughness: 0.5, wireframe: false });
    var elevatorCage = createMesh(cageGeometry, cageMaterial, new THREE.Vector3(SILO_RADIUS - 8, 0, SILO_RADIUS - 8));
    elevatorCage.castShadow = true;
    elevatorCage.receiveShadow = true;

    var cableGeometry = new THREE.BufferGeometry();
    var cablePositions = new Float32Array([
      SILO_RADIUS - 8, SILO_HEIGHT / 2, SILO_RADIUS - 8,
      SILO_RADIUS - 8, -SILO_HEIGHT / 2, SILO_RADIUS - 8
    ]);
    cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: COLORS.steelGray, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    siloScene.add(cable);
    meshObjects.push(cable);
  }

  function createControlRooms() {
    var roomLevels = [
      { pos: new THREE.Vector3(15, 50, -12), name: 'B-1' },
      { pos: new THREE.Vector3(-15, 20, -12), name: 'B-2' },
      { pos: new THREE.Vector3(15, -10, -12), name: 'B-3' },
      { pos: new THREE.Vector3(-15, -35, -12), name: 'B-4 ABORT' }
    ];

    for (var i = 0; i < roomLevels.length; i++) {
      var roomGeometry = new THREE.BoxGeometry(10, 8, 12);
      var color = (i === 3) ? COLORS.abortGreen : COLORS.militaryGreen;
      var roomMaterial = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.6 });
      var room = createMesh(roomGeometry, roomMaterial, roomLevels[i].pos);
      room.castShadow = true;
      room.receiveShadow = true;

      if (i === 3) {
        pulseLights.push({ mesh: room, light: true });
      }
    }
  }

  function createLaunchControlPanels() {
    var panelLocations = [
      new THREE.Vector3(18, 50, -18),
      new THREE.Vector3(-18, 20, -18),
      new THREE.Vector3(18, -10, -18),
      new THREE.Vector3(-18, -35, -18)
    ];

    for (var i = 0; i < panelLocations.length; i++) {
      var consoleGeometry = new THREE.BoxGeometry(5, 7, 2);
      var consoleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.6, roughness: 0.5 });
      var console = createMesh(consoleGeometry, consoleMaterial, panelLocations[i]);
      console.castShadow = true;
      console.receiveShadow = true;

      var buttonGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var buttonMaterial = new THREE.MeshStandardMaterial({ color: COLORS.launchRed, metalness: 0.8, roughness: 0.3, emissive: COLORS.launchRed, emissiveIntensity: 0.3 });
      for (var j = 0; j < 6; j++) {
        var bx = (j % 3 - 1) * 1.2;
        var by = (Math.floor(j / 3) - 0.5) * 1.2;
        var buttonPos = panelLocations[i].clone().add(new THREE.Vector3(bx, by, -1.5));
        var button = createMesh(buttonGeometry, buttonMaterial, buttonPos);
        button.castShadow = true;
        pulseLights.push({ mesh: button, light: true });
      }
    }
  }

  function createCountdownDisplay() {
    var displayGeometry = new THREE.BoxGeometry(8, 6, 1);
    var displayMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkMetal, metalness: 0.7, roughness: 0.5 });
    var display = createMesh(displayGeometry, displayMaterial, new THREE.Vector3(0, 60, -SILO_RADIUS + 3));
    display.castShadow = true;

    var alarmLightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var alarmMaterial = new THREE.MeshStandardMaterial({ color: COLORS.launchRed, metalness: 0.8, roughness: 0.2, emissive: COLORS.launchRed, emissiveIntensity: 0.5 });
    for (var i = 0; i < 4; i++) {
      var ax = (i % 2 - 0.5) * 3;
      var ay = (Math.floor(i / 2) - 0.5) * 2;
      var alarmPos = new THREE.Vector3(ax, 60 + ay, -SILO_RADIUS + 2);
      var alarm = createMesh(alarmLightGeometry, alarmMaterial, alarmPos);
      alarm.castShadow = true;
      strobeLights.push({ mesh: alarm, material: alarmMaterial });
    }
  }

  function createAbortPanel() {
    var abortGeometry = new THREE.BoxGeometry(6, 5, 2);
    var abortMaterial = new THREE.MeshStandardMaterial({ color: COLORS.abortGreen, metalness: 0.7, roughness: 0.4, emissive: COLORS.abortGreen, emissiveIntensity: 0.4 });
    var abortPanel = createMesh(abortGeometry, abortMaterial, new THREE.Vector3(-18, -35, -18));
    abortPanel.castShadow = true;
    pulseLights.push({ mesh: abortPanel, light: true });

    var abortButtonGeometry = new THREE.SphereGeometry(0.6, 12, 12);
    var abortButtonMaterial = new THREE.MeshStandardMaterial({ color: COLORS.abortGreen, metalness: 0.9, roughness: 0.2, emissive: COLORS.abortGreen, emissiveIntensity: 0.6 });
    var abortButton = createMesh(abortButtonGeometry, abortButtonMaterial, new THREE.Vector3(-18, -35, -19));
    abortButton.castShadow = true;
    pulseLights.push({ mesh: abortButton, light: true });
  }

  function createBlastDoor() {
    var doorGeometry = new THREE.BoxGeometry(12, 15, 1.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkMetal, metalness: 0.85, roughness: 0.3 });
    var blastDoor = createMesh(doorGeometry, doorMaterial, new THREE.Vector3(SILO_RADIUS - 3, -5, 0));
    blastDoor.castShadow = true;
    blastDoor.receiveShadow = true;

    var hingeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8, 2);
    var hingeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.8, roughness: 0.4 });
    for (var i = 0; i < 3; i++) {
      var hinge = createMesh(hingeGeometry, hingeMaterial, new THREE.Vector3(SILO_RADIUS - 3, -10 + i * 5, 0));
      hinge.castShadow = true;
    }
  }

  function createFuelLines() {
    var manifoldPositions = [
      new THREE.Vector3(-12, -25, 8),
      new THREE.Vector3(12, -25, 8)
    ];

    for (var i = 0; i < manifoldPositions.length; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8, 4);
      var pipeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.countdownOrange, metalness: 0.7, roughness: 0.5 });
      var pipe = createMesh(pipeGeometry, pipeMaterial, manifoldPositions[i]);
      pipe.castShadow = true;
      pipe.receiveShadow = true;

      var manifoldGeometry = new THREE.BoxGeometry(3, 4, 3);
      var manifoldMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.75, roughness: 0.4 });
      var manifold = createMesh(manifoldGeometry, manifoldMaterial, manifoldPositions[i].clone().add(new THREE.Vector3(0, 5, 0)));
      manifold.castShadow = true;
      manifold.receiveShadow = true;
    }
  }

  function createSiloCap() {
    var capGeometry = new THREE.BoxGeometry(SILO_RADIUS * 2 - 5, 3, SILO_RADIUS * 2 - 5);
    var capMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkMetal, metalness: 0.8, roughness: 0.3 });
    var cap = createMesh(capGeometry, capMaterial, new THREE.Vector3(0, SILO_HEIGHT / 2 - 2, 0));
    cap.castShadow = true;
    cap.receiveShadow = true;

    var panelGeometry = new THREE.BoxGeometry((SILO_RADIUS - 3) * 2, 1.5, 4);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.countdownOrange, metalness: 0.7, roughness: 0.5 });
    createMesh(panelGeometry, panelMaterial, new THREE.Vector3(0, SILO_HEIGHT / 2 + 1, 0));
  }

  function createEmergencyLights() {
    var stripPositions = [
      new THREE.Vector3(SILO_RADIUS - 2, 40, 0),
      new THREE.Vector3(SILO_RADIUS - 2, 10, 0),
      new THREE.Vector3(SILO_RADIUS - 2, -20, 0),
      new THREE.Vector3(-SILO_RADIUS + 2, 30, 0),
      new THREE.Vector3(-SILO_RADIUS + 2, 0, 0),
      new THREE.Vector3(-SILO_RADIUS + 2, -30, 0)
    ];

    for (var i = 0; i < stripPositions.length; i++) {
      var ledPositions = [];
      for (var j = 0; j < 8; j++) {
        var offset = j * 1.5 - 5.25;
        ledPositions.push(stripPositions[i].x, stripPositions[i].y + offset, stripPositions[i].z);
        ledPositions.push(stripPositions[i].x, stripPositions[i].y + offset + 0.8, stripPositions[i].z);
      }
      var ledGeometry = new THREE.BufferGeometry();
      ledGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ledPositions), 3));
      var ledMaterial = new THREE.LineBasicMaterial({ color: COLORS.launchRed, linewidth: 3 });
      var ledStrip = new THREE.LineSegments(ledGeometry, ledMaterial);
      siloScene.add(ledStrip);
      meshObjects.push(ledStrip);
      strobeLights.push({ mesh: ledStrip, material: ledMaterial });
    }
  }

  function init(scene, camera) {
    siloScene = scene;
    meshObjects = [];
    pulseLights = [];
    strobeLights = [];
    countdownElapsed = 0;
    elevatorPosition = 0;
    elevatorLevel = 0;
    countdownTicking = true;

    createSiloShaft();
    createMissile();
    createLaunchCradle();
    createBlastDeflector();
    createElevatorShaft();
    createControlRooms();
    createLaunchControlPanels();
    createCountdownDisplay();
    createAbortPanel();
    createBlastDoor();
    createFuelLines();
    createSiloCap();
    createEmergencyLights();

    return spawnPoints;
  }

  function update(delta) {
    if (countdownTicking) {
      countdownElapsed += delta;
    }
    elapsedGameTime += delta;

    var pulseIntensity = Math.abs(Math.sin(elapsedGameTime * 2)) * 0.5 + 0.3;
    for (var i = 0; i < pulseLights.length; i++) {
      if (pulseLights[i].mesh.material && pulseLights[i].mesh.material.emissiveIntensity !== undefined) {
        pulseLights[i].mesh.material.emissiveIntensity = pulseIntensity;
      }
    }

    var strobeIntensity = Math.abs(Math.sin(elapsedGameTime * 5)) > 0.5 ? 0.8 : 0.1;
    for (var j = 0; j < strobeLights.length; j++) {
      if (strobeLights[j].material && strobeLights[j].material.linewidth !== undefined) {
        strobeLights[j].material.linewidth = strobeIntensity * 4;
      }
    }

    var elevatorMoveDistance = (elapsedGameTime % 8) - 4;
    for (var k = 0; k < meshObjects.length; k++) {
      if (meshObjects[k].geometry instanceof THREE.BoxGeometry) {
        if (meshObjects[k].position.x > SILO_RADIUS - 10 && meshObjects[k].position.x < SILO_RADIUS - 6) {
          if (meshObjects[k].position.y > -5 && meshObjects[k].position.y < 5) {
            meshObjects[k].position.y += elevatorMoveDistance * delta * 0.5;
          }
        }
      }
    }

    var missileRotation = Math.sin(elapsedGameTime * 0.3) * 0.05;
    for (var m = 0; m < meshObjects.length; m++) {
      if (meshObjects[m].position.y < -20 && meshObjects[m].position.y > -35) {
        if (Math.abs(meshObjects[m].position.x) < 5) {
          meshObjects[m].rotation.z += missileRotation * delta;
        }
      }
    }
  }

  function reset() {
    for (var i = meshObjects.length - 1; i >= 0; i--) {
      siloScene.remove(meshObjects[i]);
    }
    meshObjects = [];
    pulseLights = [];
    strobeLights = [];
    countdownElapsed = 0;
    elapsedGameTime = 0;
    elevatorPosition = 0;
    elevatorLevel = 0;
    countdownTicking = false;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getCountdownTime: function() { return countdownTime - countdownElapsed; },
    getMeshCount: function() { return meshObjects.length; }
  };
}());
