window.BlairAthollBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  function createCastle(scene) {
    // Main castle block - white-harled (off-white)
    var mainGeometry = new THREE.BoxGeometry(30, 12, 20);
    var mainMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
    var mainCastle = new THREE.Mesh(mainGeometry, mainMaterial);
    mainCastle.position.y = 6;
    mainCastle.castShadow = true;
    mainCastle.receiveShadow = true;
    scene.add(mainCastle);
    objects.push(mainCastle);

    // Corner towers (4 cylinders)
    var towerPositions = [
      [-15, 8, -10],
      [15, 8, -10],
      [-15, 8, 10],
      [15, 8, 10]
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var towerGeometry = new THREE.CylinderGeometry(3, 3, 16, 16);
      var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(towerPositions[i][0], towerPositions[i][1], towerPositions[i][2]);
      tower.castShadow = true;
      tower.receiveShadow = true;
      scene.add(tower);
      objects.push(tower);

      // Cone cap on tower
      var coneGeometry = new THREE.ConeGeometry(3, 4, 16);
      var coneMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
      var cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.set(towerPositions[i][0], towerPositions[i][1] + 10, towerPositions[i][2]);
      cone.castShadow = true;
      cone.receiveShadow = true;
      scene.add(cone);
      objects.push(cone);
    }
  }

  function createBattlements(scene) {
    // Crenellations along roof edges
    var crenelWidth = 2;
    var crenelHeight = 2;
    var crenelDepth = 2;
    var spacing = 3;
    var mainLength = 30;
    var mainWidth = 20;
    var baseY = 12;

    // Along length (x-direction)
    for (var i = 0; i < mainLength; i += spacing) {
      var crenelGeo = new THREE.BoxGeometry(crenelWidth, crenelHeight, crenelDepth);
      var crenelMat = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
      var crenel = new THREE.Mesh(crenelGeo, crenelMat);
      crenel.position.set(-15 + i, baseY + 1, -10);
      crenel.castShadow = true;
      crenel.receiveShadow = true;
      scene.add(crenel);
      objects.push(crenel);

      crenel = new THREE.Mesh(crenelGeo, crenelMat);
      crenel.position.set(-15 + i, baseY + 1, 10);
      crenel.castShadow = true;
      crenel.receiveShadow = true;
      scene.add(crenel);
      objects.push(crenel);
    }

    // Along width (z-direction)
    for (var j = 0; j < mainWidth; j += spacing) {
      var crenelGeo = new THREE.BoxGeometry(crenelWidth, crenelHeight, crenelDepth);
      var crenelMat = new THREE.MeshLambertMaterial({ color: 0xFFFFEE });
      var crenel = new THREE.Mesh(crenelGeo, crenelMat);
      crenel.position.set(-15, baseY + 1, -10 + j);
      crenel.castShadow = true;
      crenel.receiveShadow = true;
      scene.add(crenel);
      objects.push(crenel);

      crenel = new THREE.Mesh(crenelGeo, crenelMat);
      crenel.position.set(15, baseY + 1, -10 + j);
      crenel.castShadow = true;
      crenel.receiveShadow = true;
      scene.add(crenel);
      objects.push(crenel);
    }
  }

  function createCastleGroundsWall(scene) {
    // Perimeter walls - 4 walls around the castle
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });

    // North wall
    var wallGeoN = new THREE.BoxGeometry(30, 5, 1);
    var wallN = new THREE.Mesh(wallGeoN, wallMaterial);
    wallN.position.set(0, 2.5, -16);
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    scene.add(wallN);
    objects.push(wallN);

    // South wall
    var wallGeoS = new THREE.BoxGeometry(30, 5, 1);
    var wallS = new THREE.Mesh(wallGeoS, wallMaterial);
    wallS.position.set(0, 2.5, 16);
    wallS.castShadow = true;
    wallS.receiveShadow = true;
    scene.add(wallS);
    objects.push(wallS);

    // East wall
    var wallGeoE = new THREE.BoxGeometry(1, 5, 20);
    var wallE = new THREE.Mesh(wallGeoE, wallMaterial);
    wallE.position.set(16, 2.5, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    scene.add(wallE);
    objects.push(wallE);

    // West wall
    var wallGeoW = new THREE.BoxGeometry(1, 5, 20);
    var wallW = new THREE.Mesh(wallGeoW, wallMaterial);
    wallW.position.set(-16, 2.5, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    scene.add(wallW);
    objects.push(wallW);
  }

  function createParadeGround(scene) {
    // Atholl Highlanders parade ground - flat stone
    var groundGeo = new THREE.BoxGeometry(30, 0.3, 20);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = 0.15;
    ground.receiveShadow = true;
    scene.add(ground);
    objects.push(ground);
  }

  function createTentEncampment(scene) {
    // 8 military tents
    var tentMaterial = new THREE.MeshLambertMaterial({ color: 0x5C4830 });
    var tentPositions = [
      [-8, 2, -6],
      [-2, 2, -6],
      [4, 2, -6],
      [10, 2, -6],
      [-8, 2, 4],
      [-2, 2, 4],
      [4, 2, 4],
      [10, 2, 4]
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var tentGeo = new THREE.BoxGeometry(4, 3, 4);
      var tent = new THREE.Mesh(tentGeo, tentMaterial);
      tent.position.set(tentPositions[i][0], tentPositions[i][1], tentPositions[i][2]);
      tent.castShadow = true;
      tent.receiveShadow = true;
      scene.add(tent);
      objects.push(tent);
    }
  }

  function createPiperFigure(scene) {
    // Piper figure in kilt purple on plinth
    var plinthGeo = new THREE.BoxGeometry(1, 0.5, 1);
    var plinthMat = new THREE.MeshLambertMaterial({ color: 0xBBBBAA });
    var plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.set(0, 0.25, -18);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);
    objects.push(plinth);

    // Piper body in kilt purple
    var piperGeo = new THREE.BoxGeometry(1, 3, 1);
    var piperMat = new THREE.MeshLambertMaterial({ color: 0x6B3F6B });
    var piper = new THREE.Mesh(piperGeo, piperMat);
    piper.position.set(0, 2.25, -18);
    piper.castShadow = true;
    piper.receiveShadow = true;
    scene.add(piper);
    objects.push(piper);
  }

  function createFieldCannon(scene) {
    // Cannon barrel - cylinder
    var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 12);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 4;
    barrel.position.set(8, 1.5, -12);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    objects.push(barrel);

    // Cannon carriage - box
    var carriageGeo = new THREE.BoxGeometry(2, 1, 3);
    var carriageMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var carriage = new THREE.Mesh(carriageGeo, carriageMat);
    carriage.position.set(8, 0.5, -12);
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    scene.add(carriage);
    objects.push(carriage);

    // Wheels - cylinders (flat, like wheels)
    var wheelGeo = new THREE.CylinderGeometry(1, 1, 0.3, 12);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var wheelL = new THREE.Mesh(wheelGeo, wheelMat);
    wheelL.rotation.z = Math.PI / 2;
    wheelL.position.set(7, 0.5, -11);
    wheelL.castShadow = true;
    wheelL.receiveShadow = true;
    scene.add(wheelL);
    objects.push(wheelL);

    var wheelR = new THREE.Mesh(wheelGeo, wheelMat);
    wheelR.rotation.z = Math.PI / 2;
    wheelR.position.set(9, 0.5, -11);
    wheelR.castShadow = true;
    wheelR.receiveShadow = true;
    scene.add(wheelR);
    objects.push(wheelR);

    var wheelL2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheelL2.rotation.z = Math.PI / 2;
    wheelL2.position.set(7, 0.5, -13);
    wheelL2.castShadow = true;
    wheelL2.receiveShadow = true;
    scene.add(wheelL2);
    objects.push(wheelL2);

    var wheelR2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheelR2.rotation.z = Math.PI / 2;
    wheelR2.position.set(9, 0.5, -13);
    wheelR2.castShadow = true;
    wheelR2.receiveShadow = true;
    scene.add(wheelR2);
    objects.push(wheelR2);
  }

  function createGatehouse(scene) {
    // Estate gatehouse - main structure
    var gatehouseGeo = new THREE.BoxGeometry(8, 6, 6);
    var gatehousMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var gatehouse = new THREE.Mesh(gatehouseGeo, gatehousMat);
    gatehouse.position.set(-18, 3, 0);
    gatehouse.castShadow = true;
    gatehouse.receiveShadow = true;
    scene.add(gatehouse);
    objects.push(gatehouse);

    // Portcullis suggestion using LineSegments grid
    var portcullisGeo = new THREE.BufferGeometry();
    var portcullisVertices = [];
    var portcullisIndices = [];

    // Create a grid of lines for portcullis effect
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 5; j++) {
        portcullisVertices.push(-18 - 1 + (i * 1), 2 + (j * 1), 0);
      }
    }

    // Horizontal lines
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 4; col++) {
        var idx = row * 5 + col;
        portcullisIndices.push(idx, idx + 1);
      }
    }

    // Vertical lines
    for (var col = 0; col < 5; col++) {
      for (var row = 0; row < 4; row++) {
        var idx = row * 5 + col;
        portcullisIndices.push(idx, idx + 5);
      }
    }

    portcullisGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(portcullisVertices), 3));
    portcullisGeo.setIndex(new THREE.BufferAttribute(new Uint16Array(portcullisIndices), 1));

    var portcullisMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var portcullis = new THREE.LineSegments(portcullisGeo, portcullisMat);
    portcullis.position.z = -2;
    scene.add(portcullis);
    objects.push(portcullis);
  }

  function createLights(scene) {
    // Castle floodlights - warm golden
    var floodLight1 = new THREE.PointLight(0xFFEE88, 1.2, 40);
    floodLight1.position.set(-15, 15, -15);
    floodLight1.castShadow = true;
    scene.add(floodLight1);
    lights.push(floodLight1);

    var floodLight2 = new THREE.PointLight(0xFFEE88, 1.2, 40);
    floodLight2.position.set(15, 15, -15);
    floodLight2.castShadow = true;
    scene.add(floodLight2);
    lights.push(floodLight2);

    var floodLight3 = new THREE.PointLight(0xFFEE88, 1.2, 40);
    floodLight3.position.set(-15, 15, 15);
    floodLight3.castShadow = true;
    scene.add(floodLight3);
    lights.push(floodLight3);

    var floodLight4 = new THREE.PointLight(0xFFEE88, 1.2, 40);
    floodLight4.position.set(15, 15, 15);
    floodLight4.castShadow = true;
    scene.add(floodLight4);
    lights.push(floodLight4);

    // Perimeter lights - white, lower intensity
    var perimeterPositions = [
      [-20, 8, -20],
      [0, 8, -20],
      [20, 8, -20],
      [-20, 8, 0],
      [20, 8, 0],
      [-20, 8, 20],
      [0, 8, 20],
      [20, 8, 20]
    ];

    for (var i = 0; i < perimeterPositions.length; i++) {
      var periLight = new THREE.PointLight(0xFFFFFF, 0.7, 25);
      periLight.position.set(perimeterPositions[i][0], perimeterPositions[i][1], perimeterPositions[i][2]);
      scene.add(periLight);
      lights.push(periLight);
    }

    // Ambient light for overall scene
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);
    lights.push(ambientLight);
  }

  var cannonBarrel = null;

  function initialize(scene) {
    createParadeGround(scene);
    createCastleGroundsWall(scene);
    createCastle(scene);
    createBattlements(scene);
    createTentEncampment(scene);
    createPiperFigure(scene);
    createFieldCannon(scene);
    createGatehouse(scene);
    createLights(scene);

    // Find the cannon barrel for rotation
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].geometry instanceof THREE.CylinderGeometry &&
          objects[i].position.x === 8 &&
          objects[i].position.y === 1.5) {
        cannonBarrel = objects[i];
        break;
      }
    }
  }

  function update(delta) {
    // Slowly rotate the field cannon on its mount
    if (cannonBarrel) {
      cannonBarrel.rotation.y += delta * 0.3;
    }
  }

  function reset(scene) {
    // Remove all objects from scene
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects.length = 0;

    // Remove all lights from scene
    for (var j = lights.length - 1; j >= 0; j--) {
      scene.remove(lights[j]);
    }
    lights.length = 0;

    cannonBarrel = null;
  }

  return {
    initialize: initialize,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
