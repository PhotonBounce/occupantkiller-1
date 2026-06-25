window.FuelDepot = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var objects = [];
  var materials = [];
  var meshes = [];
  var guards = [];
  var saboteurs = [];
  var tankerTruck = null;
  var gaugeIndicators = [];
  var fireSuppressionNozzles = [];
  var incendiaryDevice = null;
  var fuelSpill = null;
  var emergencyFlare = null;
  var hudCanvas = null;
  var hudTexture = null;
  var hudMesh = null;
  var hudVisible = true;
  var keyPressLog = [];
  var lastKeyTime = 0;
  var tankState = { secured: 0, total: 3 };
  var saboteursDown = 0;
  var fireRisk = 'LOW';
  var tankerLoadingPhase = 0;
  var time = 0;

  function init(sceneRef, cameraRef, rendererRef, canvasRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    canvas = canvasRef;

    buildDepotScene();
    setupHUD();
    setupEventListeners();
  }

  function buildDepotScene() {
    // 1. Depot ground (huge flat box, tarmac grey)
    var groundGeom = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -5;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    // 2. Fuel storage tank #1 (large cylinder, white)
    var tank1Geom = new THREE.CylinderGeometry(15, 15, 35, 32);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 });
    var tank1 = new THREE.Mesh(tank1Geom, tankMat);
    tank1.position.set(-40, 5, -30);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);
    meshes.push(tank1);

    // Gauge indicator for tank 1
    var gauge1Geom = new THREE.BoxGeometry(2, 20, 1);
    var gaugeMat = new THREE.MeshStandardMaterial({ color: 0xFF6600, emissive: 0xFF6600 });
    var gauge1 = new THREE.Mesh(gauge1Geom, gaugeMat);
    gauge1.position.set(-40, 20, -15);
    scene.add(gauge1);
    meshes.push(gauge1);
    gaugeIndicators.push({ mesh: gauge1, baseScale: 1 });

    // 3. Fuel storage tank #2 (large cylinder, slightly different position)
    var tank2Geom = new THREE.CylinderGeometry(15, 15, 35, 32);
    var tank2 = new THREE.Mesh(tank2Geom, tankMat);
    tank2.position.set(0, 5, -35);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
    meshes.push(tank2);

    // Gauge indicator for tank 2
    var gauge2Geom = new THREE.BoxGeometry(2, 20, 1);
    var gauge2 = new THREE.Mesh(gauge2Geom, gaugeMat);
    gauge2.position.set(0, 20, -18);
    scene.add(gauge2);
    meshes.push(gauge2);
    gaugeIndicators.push({ mesh: gauge2, baseScale: 1 });

    // 4. Fuel storage tank #3 (cylinder, slightly smaller)
    var tank3Geom = new THREE.CylinderGeometry(12, 12, 28, 32);
    var tank3 = new THREE.Mesh(tank3Geom, tankMat);
    tank3.position.set(45, 3, -32);
    tank3.castShadow = true;
    tank3.receiveShadow = true;
    scene.add(tank3);
    meshes.push(tank3);

    // Gauge indicator for tank 3
    var gauge3Geom = new THREE.BoxGeometry(2, 18, 1);
    var gauge3 = new THREE.Mesh(gauge3Geom, gaugeMat);
    gauge3.position.set(45, 18, -16);
    scene.add(gauge3);
    meshes.push(gauge3);
    gaugeIndicators.push({ mesh: gauge3, baseScale: 1 });

    // 5. Pumping station building (box with cylinder pump units)
    var pumpBuildingGeom = new THREE.BoxGeometry(20, 18, 15);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.5 });
    var pumpBuilding = new THREE.Mesh(pumpBuildingGeom, buildingMat);
    pumpBuilding.position.set(-60, 2, 10);
    pumpBuilding.castShadow = true;
    pumpBuilding.receiveShadow = true;
    scene.add(pumpBuilding);
    meshes.push(pumpBuilding);

    // Pump units (cylinders)
    for (var i = 0; i < 3; i++) {
      var pumpGeom = new THREE.CylinderGeometry(3, 3, 12, 16);
      var pumpMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
      var pump = new THREE.Mesh(pumpGeom, pumpMat);
      pump.position.set(-65 + i * 8, 12, 10);
      pump.castShadow = true;
      pump.receiveShadow = true;
      scene.add(pump);
      meshes.push(pump);
    }

    // 6. Pipeline network (interconnected CylinderGeometry pipes)
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 });

    // Horizontal pipe from pump to tanks
    var pipe1Geom = new THREE.CylinderGeometry(1.5, 1.5, 80, 16);
    var pipe1 = new THREE.Mesh(pipe1Geom, pipeMat);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-20, 12, 0);
    pipe1.castShadow = true;
    pipe1.receiveShadow = true;
    scene.add(pipe1);
    meshes.push(pipe1);

    // Vertical pipes to tanks
    for (var i = 0; i < 3; i++) {
      var pipeVertGeom = new THREE.CylinderGeometry(1.2, 1.2, 20, 16);
      var pipeVert = new THREE.Mesh(pipeVertGeom, pipeMat);
      pipeVert.position.set(-40 + i * 45, 3, -20);
      pipeVert.castShadow = true;
      pipeVert.receiveShadow = true;
      scene.add(pipeVert);
      meshes.push(pipeVert);
    }

    // 7. Loading gantry (box frame structure)
    var gantryVertGeom = new THREE.BoxGeometry(2, 30, 2);
    var gantryMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });

    var gantryLeft = new THREE.Mesh(gantryVertGeom, gantryMat);
    gantryLeft.position.set(-85, 8, 40);
    gantryLeft.castShadow = true;
    gantryLeft.receiveShadow = true;
    scene.add(gantryLeft);
    meshes.push(gantryLeft);

    var gantryRight = new THREE.Mesh(gantryVertGeom, gantryMat);
    gantryRight.position.set(-55, 8, 40);
    gantryRight.castShadow = true;
    gantryRight.receiveShadow = true;
    scene.add(gantryRight);
    meshes.push(gantryRight);

    var gantryTopGeom = new THREE.BoxGeometry(30, 2, 2);
    var gantryTop = new THREE.Mesh(gantryTopGeom, gantryMat);
    gantryTop.position.set(-70, 23, 40);
    gantryTop.castShadow = true;
    gantryTop.receiveShadow = true;
    scene.add(gantryTop);
    meshes.push(gantryTop);

    // 8. Tanker truck (box cab + cylinder tank trailer)
    var cabGeom = new THREE.BoxGeometry(6, 8, 10);
    var cabMat = new THREE.MeshStandardMaterial({ color: 0xFF3333, roughness: 0.4 });
    var cab = new THREE.Mesh(cabGeom, cabMat);
    cab.position.set(-70, 2, 60);
    cab.castShadow = true;
    cab.receiveShadow = true;
    scene.add(cab);
    meshes.push(cab);

    var trailerGeom = new THREE.CylinderGeometry(6, 6, 20, 32);
    var trailerMat = new THREE.MeshStandardMaterial({ color: 0xFF5555, roughness: 0.4 });
    var trailer = new THREE.Mesh(trailerGeom, trailerMat);
    trailer.rotation.z = Math.PI / 2;
    trailer.position.set(-45, 5, 60);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    scene.add(trailer);
    meshes.push(trailer);

    tankerTruck = {
      cab: cab,
      trailer: trailer,
      phase: 0,
      pathPoints: [
        new THREE.Vector3(-70, 2, 60),
        new THREE.Vector3(-60, 2, 40),
        new THREE.Vector3(-50, 2, 0),
        new THREE.Vector3(-40, 2, -20),
        new THREE.Vector3(-70, 2, 60)
      ]
    };

    // 9. Control room (box building with LineSegments antenna)
    var ctrlGeom = new THREE.BoxGeometry(12, 10, 12);
    var ctrlMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
    var ctrlRoom = new THREE.Mesh(ctrlGeom, ctrlMat);
    ctrlRoom.position.set(70, 2, -20);
    ctrlRoom.castShadow = true;
    ctrlRoom.receiveShadow = true;
    scene.add(ctrlRoom);
    meshes.push(ctrlRoom);

    // Antenna (LineSegments)
    var antennaGeom = new THREE.BufferGeometry();
    antennaGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      76, 15, -20, 76, 25, -20
    ]), 3));
    var antennaLine = new THREE.LineSegments(antennaGeom, new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 }));
    scene.add(antennaLine);
    meshes.push(antennaLine);

    // 10. Fire suppression system (cylinder nozzles on box manifold)
    var manifoldGeom = new THREE.BoxGeometry(10, 2, 10);
    var manifoldMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    var manifold = new THREE.Mesh(manifoldGeom, manifoldMat);
    manifold.position.set(0, 0, 50);
    manifold.castShadow = true;
    manifold.receiveShadow = true;
    scene.add(manifold);
    meshes.push(manifold);

    // Nozzles (small cylinders)
    for (var i = 0; i < 4; i++) {
      var nozzleGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
      var nozzleMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6 });
      var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(-3 + i * 2, 2, 50);
      scene.add(nozzle);
      meshes.push(nozzle);
      fireSuppressionNozzles.push({ mesh: nozzle, baseRotation: nozzle.rotation.clone() });
    }

    // 11. Perimeter wall (low box walls all sides)
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.7 });

    var wallNorthGeom = new THREE.BoxGeometry(250, 4, 2);
    var wallNorth = new THREE.Mesh(wallNorthGeom, wallMat);
    wallNorth.position.set(0, 0, -105);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    meshes.push(wallNorth);

    var wallSouthGeom = new THREE.BoxGeometry(250, 4, 2);
    var wallSouth = new THREE.Mesh(wallSouthGeom, wallMat);
    wallSouth.position.set(0, 0, 105);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    meshes.push(wallSouth);

    var wallEastGeom = new THREE.BoxGeometry(2, 4, 210);
    var wallEast = new THREE.Mesh(wallEastGeom, wallMat);
    wallEast.position.set(125, 0, 0);
    wallEast.castShadow = true;
    wallEast.receiveShadow = true;
    scene.add(wallEast);
    meshes.push(wallEast);

    var wallWestGeom = new THREE.BoxGeometry(2, 4, 210);
    var wallWest = new THREE.Mesh(wallWestGeom, wallMat);
    wallWest.position.set(-125, 0, 0);
    wallWest.castShadow = true;
    wallWest.receiveShadow = true;
    scene.add(wallWest);
    meshes.push(wallWest);

    // 12. Guard booth (box at entrance)
    var boothGeom = new THREE.BoxGeometry(6, 8, 6);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(120, 2, 0);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);
    meshes.push(booth);

    // 13. Security guards (box+sphere, 5 guards)
    for (var i = 0; i < 5; i++) {
      var guardBody = createCharacter(
        -100 + i * 25,
        0,
        80,
        0x0066CC,
        'guard'
      );
      guards.push(guardBody);
    }

    // 14. Saboteur figures (dark clothing box+sphere, 4 saboteurs)
    for (var i = 0; i < 4; i++) {
      var sabBody = createCharacter(
        50 + i * 20,
        0,
        -60,
        0x1A1A1A,
        'saboteur'
      );
      saboteurs.push(sabBody);
    }

    // 15. Incendiary device (emissive red box planted at tank base)
    var incGeom = new THREE.BoxGeometry(3, 3, 3);
    var incMat = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5
    });
    incendiaryDevice = new THREE.Mesh(incGeom, incMat);
    incendiaryDevice.position.set(-40, 1, -30);
    incendiaryDevice.castShadow = true;
    incendiaryDevice.receiveShadow = true;
    scene.add(incendiaryDevice);
    meshes.push(incendiaryDevice);

    // 16. Fuel spill puddle (flat box, orange-yellow emissive)
    var spillGeom = new THREE.BoxGeometry(15, 0.2, 12);
    var spillMat = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      emissive: 0xFF8800,
      emissiveIntensity: 0.4
    });
    fuelSpill = new THREE.Mesh(spillGeom, spillMat);
    fuelSpill.position.set(-60, 0.5, 25);
    fuelSpill.receiveShadow = true;
    scene.add(fuelSpill);
    meshes.push(fuelSpill);

    // 17. Emergency flare (emissive sphere on cylinder, strobing)
    var flareBaseGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 12);
    var flareMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var flareBase = new THREE.Mesh(flareBaseGeom, flareMat);
    flareBase.position.set(85, 8, 70);
    scene.add(flareBase);
    meshes.push(flareBase);

    var flareGeom = new THREE.SphereGeometry(2, 16, 16);
    var flareMat2 = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFCC00,
      emissiveIntensity: 0.8
    });
    emergencyFlare = new THREE.Mesh(flareGeom, flareMat2);
    emergencyFlare.position.set(85, 12, 70);
    emergencyFlare.castShadow = true;
    emergencyFlare.receiveShadow = true;
    scene.add(emergencyFlare);
    meshes.push(emergencyFlare);

    materials.push(groundMat, tankMat, gaugeMat, buildingMat, pipeMat, gantryMat,
                   cabMat, trailerMat, ctrlMat, manifoldMat, nozzleMat, wallMat,
                   boothMat, incMat, spillMat, flareMat, flareMat2);
  }

  function createCharacter(x, y, z, color, type) {
    var bodyGeom = new THREE.BoxGeometry(2, 4, 2);
    var bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(x, y + 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    var headGeom = new THREE.SphereGeometry(1, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xFFCCA0, roughness: 0.5 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(x, y + 5, z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);

    return {
      body: body,
      head: head,
      x: x,
      z: z,
      type: type,
      targetX: type === 'guard' ? 30 : -30,
      targetZ: type === 'guard' ? -30 : 30
    };
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 256;

    var ctx = hudCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TANKS SECURED: 0/3', 20, 50);
    ctx.fillText('SABOTEURS DOWN: 0/4', 20, 100);
    ctx.fillText('FIRE RISK: LOW', 20, 150);
    ctx.fillText('Press F+D for HUD', 20, 200);

    hudTexture = new THREE.CanvasTexture(hudCanvas);
    var hudGeom = new THREE.PlaneGeometry(20, 10);
    var hudMat = new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true });
    hudMesh = new THREE.Mesh(hudGeom, hudMat);
    hudMesh.position.set(0, 35, -50);
    scene.add(hudMesh);
    meshes.push(hudMesh);
  }

  function updateHUD() {
    var ctx = hudCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('TANKS SECURED: ' + tankState.secured + '/' + tankState.total, 20, 50);
    ctx.fillText('SABOTEURS DOWN: ' + saboteursDown + '/4', 20, 100);
    ctx.fillText('FIRE RISK: ' + fireRisk, 20, 150);
    ctx.fillText('Press F+D for HUD', 20, 200);

    hudTexture.needsUpdate = true;
  }

  function setupEventListeners() {
    document.addEventListener('keydown', function(e) {
      var now = Date.now();
      if (now - lastKeyTime > 400) {
        keyPressLog = [];
      }
      lastKeyTime = now;

      var keyChar = e.key.toUpperCase();
      if (keyChar === 'F' || keyChar === 'D') {
        keyPressLog.push(keyChar);
      }

      if (keyPressLog.length >= 2) {
        if (keyPressLog[keyPressLog.length - 2] === 'F' &&
            keyPressLog[keyPressLog.length - 1] === 'D') {
          hudVisible = !hudVisible;
          if (hudMesh) {
            hudMesh.visible = hudVisible;
          }
          keyPressLog = [];
        }
      }
    });
  }

  function update(deltaTime) {
    time += deltaTime;

    // Gauge indicators pulse
    for (var i = 0; i < gaugeIndicators.length; i++) {
      var indicator = gaugeIndicators[i];
      var pulse = 1 + 0.3 * Math.sin(time * 3);
      indicator.mesh.scale.y = pulse;
    }

    // Fuel spill emissive pulses
    if (fuelSpill) {
      fuelSpill.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(time * 2);
    }

    // Incendiary device blinks urgently
    if (incendiaryDevice) {
      incendiaryDevice.material.emissiveIntensity = 0.3 + 0.4 * Math.sin(time * 6);
    }

    // Emergency flare strobes
    if (emergencyFlare) {
      var strobeIntensity = Math.sin(time * 5) > 0 ? 1 : 0.2;
      emergencyFlare.material.emissiveIntensity = strobeIntensity;
    }

    // Tanker truck drives loading circuit
    if (tankerTruck) {
      tankerLoadingPhase = (tankerLoadingPhase + deltaTime * 0.08) % 1;
      var segmentCount = tankerTruck.pathPoints.length - 1;
      var segment = Math.floor(tankerLoadingPhase * segmentCount);
      var localT = (tankerLoadingPhase * segmentCount) - segment;

      var p1 = tankerTruck.pathPoints[segment];
      var p2 = tankerTruck.pathPoints[(segment + 1) % tankerTruck.pathPoints.length];

      tankerTruck.cab.position.lerpVectors(p1, p2, localT);
      tankerTruck.trailer.position.copy(tankerTruck.cab.position);
      tankerTruck.trailer.position.x -= 15;
    }

    // Guards move toward saboteurs
    for (var i = 0; i < guards.length; i++) {
      guards[i].body.position.x += (guards[i].targetX - guards[i].body.position.x) * deltaTime * 0.1;
      guards[i].body.position.z += (guards[i].targetZ - guards[i].body.position.z) * deltaTime * 0.1;
      guards[i].head.position.copy(guards[i].body.position);
      guards[i].head.position.y += 3;
    }

    // Saboteurs move toward guards
    for (var i = 0; i < saboteurs.length; i++) {
      saboteurs[i].body.position.x += (saboteurs[i].targetX - saboteurs[i].body.position.x) * deltaTime * 0.1;
      saboteurs[i].body.position.z += (saboteurs[i].targetZ - saboteurs[i].body.position.z) * deltaTime * 0.1;
      saboteurs[i].head.position.copy(saboteurs[i].body.position);
      saboteurs[i].head.position.y += 3;
    }

    // Fire suppression nozzles rotate if triggered
    for (var i = 0; i < fireSuppressionNozzles.length; i++) {
      var nozzle = fireSuppressionNozzles[i];
      nozzle.mesh.rotation.y += deltaTime * 0.5;
    }

    updateHUD();
  }

  function reset() {
    // Dispose geometries
    for (var i = 0; i < meshes.length; i++) {
      if (meshes[i].geometry) {
        meshes[i].geometry.dispose();
      }
      if (meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var j = 0; j < meshes[i].material.length; j++) {
            meshes[i].material[j].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
    }

    // Dispose materials
    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }

    // Dispose textures
    if (hudTexture) {
      hudTexture.dispose();
    }

    // Remove from scene
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }

    // Clear arrays
    meshes = [];
    materials = [];
    objects = [];
    guards = [];
    saboteurs = [];
    gaugeIndicators = [];
    fireSuppressionNozzles = [];
    keyPressLog = [];

    // Reset state
    tankState = { secured: 0, total: 3 };
    saboteursDown = 0;
    fireRisk = 'LOW';
    tankerTruck = null;
    incendiaryDevice = null;
    fuelSpill = null;
    emergencyFlare = null;
    hudMesh = null;
    hudTexture = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
