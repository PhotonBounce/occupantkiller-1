window.MansionHeist = (function() {
  'use strict';

  var scene, camera;
  var guardMeshes = [];
  var thiefMeshes = [];
  var sensorLasers = [];
  var cameraMeshes = [];
  var dogMeshes = [];
  var helicopterBlade = null;
  var heistState = {
    guardsNeutralized: 0,
    vaultReached: false,
    exfilReady: false,
    elapsedTime: 0
  };
  var hudElement = null;
  var hKeyPressed = false;
  var mKeyPressed = false;
  var lastHKeyTime = 0;
  var lastMKeyTime = 0;

  function createMaterials() {
    var materials = {
      grass: new THREE.MeshLambertMaterial({ color: 0x1a5c1a }),
      mansion: new THREE.MeshStandardMaterial({ color: 0xf5f0e0, metalness: 0.1, roughness: 0.6 }),
      guardUniform: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
      thief: new THREE.MeshLambertMaterial({ color: 0x0a0a0a }),
      poolWater: new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x003366, metalness: 0.8, roughness: 0.2 }),
      hedge: new THREE.MeshLambertMaterial({ color: 0x2d6b2d }),
      concrete: new THREE.MeshLambertMaterial({ color: 0x666666 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 }),
      laserRed: new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff3333 }),
      vaultGlow: new THREE.MeshBasicMaterial({ color: 0xffaa00, emissive: 0xff8800 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xccddff, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.6 }),
      artwork: new THREE.MeshBasicMaterial({ color: 0xffcc00, emissive: 0xff9900 }),
      trophy: new THREE.MeshBasicMaterial({ color: 0xffdd00, emissive: 0xffaa00 }),
      car: new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.95, roughness: 0.1 }),
      helicopter: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
    };
    return materials;
  }

  function createGrounds(materials) {
    var groundGeometry = new THREE.BoxGeometry(400, 0.3, 400);
    var ground = new THREE.Mesh(groundGeometry, materials.grass);
    ground.position.set(0, 0, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    var poolDeckGeometry = new THREE.BoxGeometry(50, 0.15, 40);
    var poolDeck = new THREE.Mesh(poolDeckGeometry, materials.concrete);
    poolDeck.position.set(80, 0.15, -60);
    poolDeck.receiveShadow = true;
    scene.add(poolDeck);
  }

  function createMansionBuilding(materials) {
    var mainBuildingGeometry = new THREE.BoxGeometry(40, 18, 30);
    var mainBuilding = new THREE.Mesh(mainBuildingGeometry, materials.mansion);
    mainBuilding.position.set(0, 9, 0);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    scene.add(mainBuilding);

    var roofGeometry = new THREE.BoxGeometry(42, 1, 32);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.5, roughness: 0.7 });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 18.5, 0);
    roof.castShadow = true;
    scene.add(roof);

    var skylightGeometry = new THREE.BoxGeometry(8, 0.5, 6);
    var skylight = new THREE.Mesh(skylightGeometry, materials.glass);
    skylight.position.set(-5, 19, 8);
    scene.add(skylight);
  }

  function createEntrance(materials) {
    var leftColumnGeometry = new THREE.BoxGeometry(2, 6, 2);
    var leftColumn = new THREE.Mesh(leftColumnGeometry, materials.mansion);
    leftColumn.position.set(-8, 3, 15.5);
    leftColumn.castShadow = true;
    scene.add(leftColumn);

    var rightColumnGeometry = new THREE.BoxGeometry(2, 6, 2);
    var rightColumn = new THREE.Mesh(rightColumnGeometry, materials.mansion);
    rightColumn.position.set(8, 3, 15.5);
    rightColumn.castShadow = true;
    scene.add(rightColumn);

    var midLeftColumnGeometry = new THREE.BoxGeometry(2, 6, 2);
    var midLeftColumn = new THREE.Mesh(midLeftColumnGeometry, materials.mansion);
    midLeftColumn.position.set(-4, 3, 15.5);
    midLeftColumn.castShadow = true;
    scene.add(midLeftColumn);

    var midRightColumnGeometry = new THREE.BoxGeometry(2, 6, 2);
    var midRightColumn = new THREE.Mesh(midRightColumnGeometry, materials.mansion);
    midRightColumn.position.set(4, 3, 15.5);
    midRightColumn.castShadow = true;
    scene.add(midRightColumn);

    var doorGeometry = new THREE.BoxGeometry(4, 4, 0.5);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 2, 15.8);
    scene.add(door);
  }

  function createSwimmingPool(materials) {
    var poolGeometry = new THREE.BoxGeometry(35, 2, 25);
    var pool = new THREE.Mesh(poolGeometry, materials.poolWater);
    pool.position.set(80, 0.5, -60);
    pool.castShadow = true;
    scene.add(pool);
  }

  function createHedges(materials) {
    var hedgePositions = [
      [-40, 0.8, -40],
      [-40, 0.8, 0],
      [-40, 0.8, 40],
      [40, 0.8, -40],
      [40, 0.8, 0],
      [40, 0.8, 40],
      [0, 0.8, -50],
      [0, 0.8, 50]
    ];

    for (var i = 0; i < hedgePositions.length; i++) {
      var hedgeGeometry = new THREE.BoxGeometry(15, 3, 4);
      var hedge = new THREE.Mesh(hedgeGeometry, materials.hedge);
      hedge.position.set(hedgePositions[i][0], hedgePositions[i][1], hedgePositions[i][2]);
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      scene.add(hedge);
    }
  }

  function createSecurityGuards(materials) {
    var guardStartPositions = [
      [-60, 0.7, 0],
      [60, 0.7, 0],
      [0, 0.7, -60],
      [0, 0.7, 60],
      [-30, 0.7, 30],
      [30, 0.7, 30],
      [-30, 0.7, -30],
      [30, 0.7, -30]
    ];

    for (var i = 0; i < guardStartPositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
      var body = new THREE.Mesh(bodyGeometry, materials.guardUniform);
      body.position.set(guardStartPositions[i][0], guardStartPositions[i][1] + 1.5, guardStartPositions[i][2]);
      body.castShadow = true;
      scene.add(body);

      var headGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      var head = new THREE.Mesh(headGeometry, materials.guardUniform);
      head.position.set(guardStartPositions[i][0], guardStartPositions[i][1] + 3.3, guardStartPositions[i][2]);
      head.castShadow = true;
      scene.add(head);

      var earpiece = new THREE.SphereGeometry(0.15, 6, 6);
      var earpieceMesh = new THREE.Mesh(earpiece, materials.metal);
      earpieceMesh.position.set(guardStartPositions[i][0] + 0.5, guardStartPositions[i][1] + 3.2, guardStartPositions[i][2]);
      scene.add(earpieceMesh);

      guardMeshes.push({
        body: body,
        head: head,
        startPos: guardStartPositions[i],
        patrolTime: Math.random() * 6.28,
        patrolRadius: 15 + Math.random() * 10
      });
    }
  }

  function createThiefTeam(materials) {
    var thiefPositions = [
      [-8, 19, 5],
      [-4, 19, 5],
      [4, 19, 5],
      [8, 19, 5]
    ];

    for (var i = 0; i < thiefPositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.8);
      var body = new THREE.Mesh(bodyGeometry, materials.thief);
      body.position.set(thiefPositions[i][0], thiefPositions[i][1], thiefPositions[i][2]);
      body.castShadow = true;
      scene.add(body);

      var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      var head = new THREE.Mesh(headGeometry, materials.thief);
      head.position.set(thiefPositions[i][0], thiefPositions[i][1] + 1.5, thiefPositions[i][2]);
      head.castShadow = true;
      scene.add(head);

      var wireGeometry = new THREE.BoxGeometry(0.1, 15, 0.1);
      var wire = new THREE.Mesh(wireGeometry, materials.metal);
      wire.position.set(thiefPositions[i][0], thiefPositions[i][1] - 7.5, thiefPositions[i][2]);
      scene.add(wire);

      thiefMeshes.push({
        body: body,
        head: head,
        wire: wire,
        startY: thiefPositions[i][1],
        descentTime: 0,
        descentSpeed: 0.3
      });
    }
  }

  function createHelicopter(materials) {
    var bodyGeometry = new THREE.BoxGeometry(6, 2, 8);
    var helicopterBody = new THREE.Mesh(bodyGeometry, materials.helicopter);
    helicopterBody.position.set(0, 20.5, 0);
    helicopterBody.castShadow = true;
    scene.add(helicopterBody);

    var cabinGeometry = new THREE.BoxGeometry(3, 1.5, 3);
    var cabin = new THREE.Mesh(cabinGeometry, materials.helicopter);
    cabin.position.set(0, 21.5, 0);
    cabin.castShadow = true;
    scene.add(cabin);

    var bladeGeometry = new THREE.BoxGeometry(12, 0.2, 1);
    helicopterBlade = new THREE.Mesh(bladeGeometry, materials.metal);
    helicopterBlade.position.set(0, 22.5, 0);
    helicopterBlade.castShadow = true;
    scene.add(helicopterBlade);

    var rotorHubGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 8);
    var rotorHub = new THREE.Mesh(rotorHubGeometry, materials.metal);
    rotorHub.position.set(0, 22.5, 0);
    scene.add(rotorHub);
  }

  function createMotionSensors(materials) {
    var sensorPositions = [
      [-50, 0.3, 0],
      [50, 0.3, 0],
      [0, 0.3, -50],
      [0, 0.3, 50]
    ];

    for (var i = 0; i < sensorPositions.length; i++) {
      var poleGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
      var pole = new THREE.Mesh(poleGeometry, materials.metal);
      pole.position.set(sensorPositions[i][0], sensorPositions[i][1] + 1, sensorPositions[i][2]);
      pole.castShadow = true;
      scene.add(pole);

      if (i < sensorPositions.length - 1) {
        var targetPos = sensorPositions[(i + 1) % sensorPositions.length];
        var distance = Math.sqrt(
          Math.pow(targetPos[0] - sensorPositions[i][0], 2) +
          Math.pow(targetPos[2] - sensorPositions[i][2], 2)
        );
        var laserGeometry = new THREE.BoxGeometry(0.1, 0.1, distance);
        var laser = new THREE.Mesh(laserGeometry, materials.laserRed);
        laser.position.set(
          (sensorPositions[i][0] + targetPos[0]) / 2,
          sensorPositions[i][1] + 1,
          (sensorPositions[i][2] + targetPos[2]) / 2
        );
        laser.rotation.y = Math.atan2(targetPos[2] - sensorPositions[i][2], targetPos[0] - sensorPositions[i][0]);
        scene.add(laser);

        sensorLasers.push({
          mesh: laser,
          intensity: 1.0,
          pulseTime: 0
        });
      }
    }
  }

  function createVaultEntrance(materials) {
    var hatchGeometry = new THREE.BoxGeometry(4, 0.2, 3);
    var hatch = new THREE.Mesh(hatchGeometry, materials.vaultGlow);
    hatch.position.set(0, 0.1, -40);
    scene.add(hatch);

    var vaultEdgeGeometry = new THREE.BoxGeometry(4.5, 0.3, 3.5);
    var vaultEdge = new THREE.Mesh(vaultEdgeGeometry, materials.vaultGlow);
    vaultEdge.position.set(0, 0.15, -40);
    scene.add(vaultEdge);
  }

  function createArtwork(materials) {
    var artworkPositions = [
      [-10, 5, 14.9],
      [10, 5, 14.9],
      [0, 8, 14.9]
    ];

    for (var i = 0; i < artworkPositions.length; i++) {
      var artGeometry = new THREE.BoxGeometry(3, 4, 0.3);
      var art = new THREE.Mesh(artGeometry, materials.artwork);
      art.position.set(artworkPositions[i][0], artworkPositions[i][1], artworkPositions[i][2]);
      scene.add(art);
    }
  }

  function createSecurityCameras(materials) {
    var cameraPositions = [
      [-20, 15, 14.9],
      [20, 15, 14.9],
      [-20, 15, -14.9],
      [20, 15, -14.9]
    ];

    for (var i = 0; i < cameraPositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(1, 1, 1.5);
      var cameraBody = new THREE.Mesh(bodyGeometry, materials.metal);
      cameraBody.position.set(cameraPositions[i][0], cameraPositions[i][1], cameraPositions[i][2]);
      scene.add(cameraBody);

      var lensGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
      var lens = new THREE.Mesh(lensGeometry, materials.glass);
      lens.position.set(cameraPositions[i][0], cameraPositions[i][1], cameraPositions[i][2] + 0.8);
      scene.add(lens);

      cameraMeshes.push({
        body: cameraBody,
        lens: lens,
        panAngle: 0,
        panSpeed: 2,
        panRange: 1.2
      });
    }
  }

  function createGuardDogs(materials) {
    var dogPositions = [
      [-50, 0.5, 30],
      [50, 0.5, 30]
    ];

    for (var i = 0; i < dogPositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.5);
      var dogBody = new THREE.Mesh(bodyGeometry, materials.guardUniform);
      dogBody.position.set(dogPositions[i][0], dogPositions[i][1] + 0.4, dogPositions[i][2]);
      dogBody.castShadow = true;
      scene.add(dogBody);

      var headGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.8);
      var dogHead = new THREE.Mesh(headGeometry, materials.guardUniform);
      dogHead.position.set(dogPositions[i][0], dogPositions[i][1] + 0.9, dogPositions[i][2] + 1.2);
      dogHead.castShadow = true;
      scene.add(dogHead);

      var tailGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
      var tail = new THREE.Mesh(tailGeometry, materials.guardUniform);
      tail.position.set(dogPositions[i][0], dogPositions[i][1] + 0.4, dogPositions[i][2] - 1.5);
      tail.castShadow = true;
      scene.add(tail);

      var leashGeometry = new THREE.BoxGeometry(0.05, 0.05, 20);
      var leash = new THREE.Mesh(leashGeometry, materials.metal);
      leash.position.set(dogPositions[i][0] + 10, dogPositions[i][1] + 1, dogPositions[i][2]);
      scene.add(leash);

      dogMeshes.push({
        body: dogBody,
        head: dogHead,
        tail: tail,
        startPos: dogPositions[i],
        paceTime: 0,
        paceDistance: 8
      });
    }
  }

  function createGarage(materials) {
    var garageGeometry = new THREE.BoxGeometry(25, 6, 15);
    var garage = new THREE.Mesh(garageGeometry, materials.concrete);
    garage.position.set(-80, 3, 0);
    garage.castShadow = true;
    garage.receiveShadow = true;
    scene.add(garage);

    var carPositions = [
      [-85, 1.2, -5],
      [-75, 1.2, -5],
      [-85, 1.2, 5],
      [-75, 1.2, 5]
    ];

    for (var i = 0; i < carPositions.length; i++) {
      var carGeometry = new THREE.BoxGeometry(3.5, 1.2, 7);
      var car = new THREE.Mesh(carGeometry, materials.car);
      car.position.set(carPositions[i][0], carPositions[i][1], carPositions[i][2]);
      car.castShadow = true;
      scene.add(car);

      var windowGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.5);
      var window = new THREE.Mesh(windowGeometry, materials.glass);
      window.position.set(carPositions[i][0], carPositions[i][1] + 0.4, carPositions[i][2]);
      scene.add(window);
    }
  }

  function createTrophyRoom(materials) {
    var shelfGeometry = new THREE.BoxGeometry(15, 0.4, 10);
    var shelf1 = new THREE.Mesh(shelfGeometry, materials.metal);
    shelf1.position.set(60, 3, 0);
    scene.add(shelf1);

    var shelf2 = new THREE.Mesh(shelfGeometry, materials.metal);
    shelf2.position.set(60, 6, 0);
    scene.add(shelf2);

    var shelf3 = new THREE.Mesh(shelfGeometry, materials.metal);
    shelf3.position.set(60, 9, 0);
    scene.add(shelf3);

    var trophyPositions = [
      [55, 3.8, -3],
      [65, 3.8, -3],
      [55, 6.8, 0],
      [65, 6.8, 0],
      [60, 9.8, 3]
    ];

    for (var i = 0; i < trophyPositions.length; i++) {
      var trophyGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8);
      var trophy = new THREE.Mesh(trophyGeometry, materials.trophy);
      trophy.position.set(trophyPositions[i][0], trophyPositions[i][1], trophyPositions[i][2]);
      scene.add(trophy);
    }

    var windowGeometry = new THREE.BoxGeometry(12, 8, 0.3);
    var trophyWindow = new THREE.Mesh(windowGeometry, materials.glass);
    trophyWindow.position.set(67.5, 6, 5);
    scene.add(trophyWindow);
  }

  function updateGuardPatrols(delta) {
    for (var i = 0; i < guardMeshes.length; i++) {
      var guard = guardMeshes[i];
      guard.patrolTime += delta * 0.3;

      var angle = guard.patrolTime;
      var newX = guard.startPos[0] + Math.cos(angle) * guard.patrolRadius;
      var newZ = guard.startPos[2] + Math.sin(angle) * guard.patrolRadius;

      guard.body.position.set(newX, guard.startPos[1] + 1.5, newZ);
      guard.head.position.set(newX, guard.startPos[1] + 3.3, newZ);
    }
  }

  function updateThiefDescent(delta) {
    for (var i = 0; i < thiefMeshes.length; i++) {
      var thief = thiefMeshes[i];
      thief.descentTime += delta;

      var descentAmount = thief.descentTime * thief.descentSpeed;
      var newY = thief.startY - descentAmount;

      if (newY < 2) {
        newY = 2;
      }

      thief.body.position.y = newY;
      thief.head.position.y = newY + 1.5;
      thief.wire.position.y = newY - 7.5;
    }
  }

  function updateMotionSensorLasers(delta) {
    for (var i = 0; i < sensorLasers.length; i++) {
      var sensor = sensorLasers[i];
      sensor.pulseTime += delta * 2;
      sensor.intensity = 0.5 + 0.5 * Math.sin(sensor.pulseTime);
      sensor.mesh.material.emissive.setHex(Math.floor(0xff3333 * sensor.intensity));
    }
  }

  function updateCameras(delta) {
    for (var i = 0; i < cameraMeshes.length; i++) {
      var cam = cameraMeshes[i];
      cam.panAngle += delta * cam.panSpeed;

      var panOffset = Math.sin(cam.panAngle) * cam.panRange;
      cam.lens.rotation.y = panOffset;
    }
  }

  function updateDogs(delta) {
    for (var i = 0; i < dogMeshes.length; i++) {
      var dog = dogMeshes[i];
      dog.paceTime += delta * 0.4;

      var paceOffset = Math.sin(dog.paceTime) * dog.paceDistance;
      dog.body.position.x = dog.startPos[0] + paceOffset;
      dog.head.position.x = dog.startPos[0] + paceOffset;
      dog.tail.position.x = dog.startPos[0] + paceOffset;

      dog.tail.rotation.z = Math.sin(dog.paceTime * 2) * 0.3;
    }
  }

  function updateHelicopter(delta) {
    if (helicopterBlade) {
      helicopterBlade.rotation.z += delta * 15;
    }
  }

  function updateHUD() {
    if (hudElement) {
      var vaultText = heistState.vaultReached ? 'YES' : 'NO';
      var exfilText = heistState.exfilReady ? 'YES' : 'NO';
      hudElement.innerHTML = 'GUARDS NEUTRALIZED: ' + heistState.guardsNeutralized + '/8<br>' +
                             'VAULT REACHED: ' + vaultText + '<br>' +
                             'EXFIL READY: ' + exfilText;
    }
  }

  function handleKeyDown(event) {
    var currentTime = Date.now();

    if (event.key === 'h' || event.key === 'H') {
      if (hKeyPressed) {
        if (currentTime - lastHKeyTime < 400) {
          if (mKeyPressed && currentTime - lastMKeyTime < 400) {
            toggleHeistState();
          }
        }
      }
      hKeyPressed = true;
      lastHKeyTime = currentTime;
    }

    if (event.key === 'm' || event.key === 'M') {
      if (mKeyPressed) {
        if (currentTime - lastMKeyTime < 400) {
          if (hKeyPressed && currentTime - lastHKeyTime < 400) {
            toggleHeistState();
          }
        }
      }
      mKeyPressed = true;
      lastMKeyTime = currentTime;
    }
  }

  function handleKeyUp(event) {
    if (event.key === 'h' || event.key === 'H') {
      hKeyPressed = false;
    }
    if (event.key === 'm' || event.key === 'M') {
      mKeyPressed = false;
    }
  }

  function toggleHeistState() {
    heistState.guardsNeutralized = (heistState.guardsNeutralized + 1) % 9;
    if (heistState.guardsNeutralized === 0) {
      heistState.vaultReached = !heistState.vaultReached;
      if (heistState.vaultReached) {
        heistState.exfilReady = true;
      } else {
        heistState.exfilReady = false;
      }
    }
    updateHUD();
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.fontSize = '16px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.color = '#00ff00';
    hudElement.style.textShadow = '0 0 10px #00ff00';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '1000';
    document.body.appendChild(hudElement);
    updateHUD();
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    var materials = createMaterials();

    createGrounds(materials);
    createMansionBuilding(materials);
    createEntrance(materials);
    createSwimmingPool(materials);
    createHedges(materials);
    createSecurityGuards(materials);
    createThiefTeam(materials);
    createHelicopter(materials);
    createMotionSensors(materials);
    createVaultEntrance(materials);
    createArtwork(materials);
    createSecurityCameras(materials);
    createGuardDogs(materials);
    createGarage(materials);
    createTrophyRoom(materials);

    createHUD();

    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xffaa00, 1, 150);
    pointLight.position.set(0, 20, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
  }

  function update(delta) {
    heistState.elapsedTime += delta;

    updateGuardPatrols(delta);
    updateThiefDescent(delta);
    updateMotionSensorLasers(delta);
    updateCameras(delta);
    updateDogs(delta);
    updateHelicopter(delta);
  }

  function reset() {
    heistState.guardsNeutralized = 0;
    heistState.vaultReached = false;
    heistState.exfilReady = false;
    heistState.elapsedTime = 0;

    for (var i = 0; i < guardMeshes.length; i++) {
      var guard = guardMeshes[i];
      guard.patrolTime = 0;
      guard.body.position.set(guard.startPos[0], guard.startPos[1] + 1.5, guard.startPos[2]);
      guard.head.position.set(guard.startPos[0], guard.startPos[1] + 3.3, guard.startPos[2]);
    }

    for (var j = 0; j < thiefMeshes.length; j++) {
      var thief = thiefMeshes[j];
      thief.descentTime = 0;
      thief.body.position.y = thief.startY;
      thief.head.position.y = thief.startY + 1.5;
    }

    if (helicopterBlade) {
      helicopterBlade.rotation.z = 0;
    }

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
