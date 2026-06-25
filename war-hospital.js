window.WarHospital = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameObjects = [];
  var helicopterRotor = null;
  var bloodBankLights = [];
  var generatorLight = null;
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    gameObjects = [];
    bloodBankLights = [];
    time = 0;

    createMainHospitalBuilding();
    createTriageArea();
    createOperatingRoom();
    createBloodBank();
    createAmbulances();
    createHelicopterPad();
    createBombDamage();
    createGeneratorBuilding();
    createPerimeter();
    createPharmacy();
    createWoundedSoldiers();
  }

  function createMainHospitalBuilding() {
    var buildingGeom = new THREE.BoxGeometry(40, 35, 30);
    var buildingMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var building = new THREE.Mesh(buildingGeom, buildingMat);
    building.position.set(0, 17.5, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    gameObjects.push(building);

    // Red cross markings on front
    var crossHorizGeom = new THREE.BoxGeometry(8, 2, 0.5);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var crossH = new THREE.Mesh(crossHorizGeom, redMat);
    crossH.position.set(0, 28, 15.5);
    scene.add(crossH);
    gameObjects.push(crossH);

    var crossVertGeom = new THREE.BoxGeometry(2, 8, 0.5);
    var crossV = new THREE.Mesh(crossVertGeom, redMat);
    crossV.position.set(0, 28, 15.5);
    scene.add(crossV);
    gameObjects.push(crossV);

    // Interior walls creating corridors
    var wallMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    var wall1Geom = new THREE.BoxGeometry(2, 30, 25);
    var wall1 = new THREE.Mesh(wall1Geom, wallMat);
    wall1.position.set(-12, 15, 0);
    scene.add(wall1);
    gameObjects.push(wall1);

    var wall2Geom = new THREE.BoxGeometry(2, 30, 25);
    var wall2 = new THREE.Mesh(wall2Geom, wallMat);
    wall2.position.set(12, 15, 0);
    scene.add(wall2);
    gameObjects.push(wall2);
  }

  function createTriageArea() {
    // Tent structures around hospital
    var tentPositions = [
      { x: -35, z: 10 },
      { x: -35, z: -10 },
      { x: 35, z: 10 },
      { x: 35, z: -10 }
    ];

    var tentMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
    tentPositions.forEach(function(pos) {
      var tentGeom = new THREE.BoxGeometry(8, 6, 6);
      var tent = new THREE.Mesh(tentGeom, tentMat);
      tent.position.set(pos.x, 3, pos.z);
      tent.castShadow = true;
      tent.receiveShadow = true;
      scene.add(tent);
      gameObjects.push(tent);

      // Stretcher patients as BoxGeometry
      var stretcher = new THREE.BoxGeometry(2, 1, 4);
      var stretcherMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
      var patient = new THREE.Mesh(stretcher, stretcherMat);
      patient.position.set(pos.x, 1, pos.z);
      scene.add(patient);
      gameObjects.push(patient);
    });
  }

  function createOperatingRoom() {
    // Operating room building
    var orGeom = new THREE.BoxGeometry(12, 12, 10);
    var orMat = new THREE.MeshLambertMaterial({ color: 0xe6f2ff });
    var operatingRoom = new THREE.Mesh(orGeom, orMat);
    operatingRoom.position.set(-25, 6, 20);
    operatingRoom.castShadow = true;
    operatingRoom.receiveShadow = true;
    scene.add(operatingRoom);
    gameObjects.push(operatingRoom);

    // Surgical table
    var tableGeom = new THREE.BoxGeometry(3, 2, 2);
    var tableMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
    var table = new THREE.Mesh(tableGeom, tableMat);
    table.position.set(-25, 3, 20);
    scene.add(table);
    gameObjects.push(table);

    // Overhead surgical light
    var lightGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var lightMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
    var overheadLight = new THREE.Mesh(lightGeom, lightMat);
    overheadLight.position.set(-25, 11, 20);
    scene.add(overheadLight);
    gameObjects.push(overheadLight);

    // Equipment trolleys
    for (var i = 0; i < 3; i++) {
      var trolleyGeom = new THREE.BoxGeometry(2, 3, 1.5);
      var trolleyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var trolley = new THREE.Mesh(trolleyGeom, trolleyMat);
      trolley.position.set(-20 + i * 3, 1.5, 20);
      scene.add(trolley);
      gameObjects.push(trolley);
    }
  }

  function createBloodBank() {
    // Blood bank refrigerator building
    var bankGeom = new THREE.BoxGeometry(10, 8, 8);
    var bankMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var bloodBank = new THREE.Mesh(bankGeom, bankMat);
    bloodBank.position.set(25, 4, 15);
    bloodBank.castShadow = true;
    bloodBank.receiveShadow = true;
    scene.add(bloodBank);
    gameObjects.push(bloodBank);

    // Red indicator lights on blood bank refrigerators
    var lightPositions = [
      { x: 20, z: 12 },
      { x: 25, z: 12 },
      { x: 30, z: 12 },
      { x: 20, z: 18 },
      { x: 25, z: 18 },
      { x: 30, z: 18 }
    ];

    var lightMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    lightPositions.forEach(function(pos) {
      var indGeom = new THREE.SphereGeometry(0.5, 16, 16);
      var indicator = new THREE.Mesh(indGeom, lightMat);
      indicator.position.set(pos.x, 7.5, pos.z);
      scene.add(indicator);
      bloodBankLights.push(indicator);
      gameObjects.push(indicator);
    });
  }

  function createAmbulances() {
    // Two ambulance vehicles outside hospital
    var ambulancePositions = [
      { x: -30, z: -25 },
      { x: 30, z: -25 }
    ];

    var ambMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    ambulancePositions.forEach(function(pos) {
      // Main body
      var bodyGeom = new THREE.BoxGeometry(8, 5, 3);
      var body = new THREE.Mesh(bodyGeom, ambMat);
      body.position.set(pos.x, 2.5, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      gameObjects.push(body);

      // Red cross on ambulance
      var redCrossH = new THREE.BoxGeometry(3, 1, 0.2);
      var redMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      var crH = new THREE.Mesh(redCrossH, redMat);
      crH.position.set(pos.x, 4.5, pos.z + 1.5);
      scene.add(crH);
      gameObjects.push(crH);

      var redCrossV = new THREE.BoxGeometry(1, 3, 0.2);
      var crV = new THREE.Mesh(redCrossV, redMat);
      crV.position.set(pos.x, 4.5, pos.z + 1.5);
      scene.add(crV);
      gameObjects.push(crV);

      // Rear doors (open BoxGeometry)
      var doorGeom = new THREE.BoxGeometry(4, 4, 0.3);
      var doorMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
      var leftDoor = new THREE.Mesh(doorGeom, doorMat);
      leftDoor.position.set(pos.x - 2, 2.5, pos.z + 3.3);
      scene.add(leftDoor);
      gameObjects.push(leftDoor);

      var rightDoor = new THREE.Mesh(doorGeom, doorMat);
      rightDoor.position.set(pos.x + 2, 2.5, pos.z + 3.3);
      scene.add(rightDoor);
      gameObjects.push(rightDoor);
    });
  }

  function createHelicopterPad() {
    // Helipad platform
    var padGeom = new THREE.BoxGeometry(20, 1, 20);
    var padMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var helipad = new THREE.Mesh(padGeom, padMat);
    helipad.position.set(0, 35, -40);
    scene.add(helipad);
    gameObjects.push(helipad);

    // White cross on helipad
    var whiteH = new THREE.BoxGeometry(6, 1, 0.2);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var padCrossH = new THREE.Mesh(whiteH, whiteMat);
    padCrossH.position.set(0, 35.5, -40);
    scene.add(padCrossH);
    gameObjects.push(padCrossH);

    var whiteV = new THREE.BoxGeometry(1, 6, 0.2);
    var padCrossV = new THREE.Mesh(whiteV, whiteMat);
    padCrossV.position.set(0, 35.5, -40);
    scene.add(padCrossV);
    gameObjects.push(padCrossV);

    // Helicopter body
    var heliBodyGeom = new THREE.BoxGeometry(6, 3, 4);
    var heliMat = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
    var heliBody = new THREE.Mesh(heliBodyGeom, heliMat);
    heliBody.position.set(0, 40, -40);
    heliBody.castShadow = true;
    heliBody.receiveShadow = true;
    scene.add(heliBody);
    gameObjects.push(heliBody);

    // Helicopter rotor (animated)
    var rotorGeom = new THREE.CylinderGeometry(8, 8, 0.2, 32);
    var rotorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    helicopterRotor = new THREE.Mesh(rotorGeom, rotorMat);
    helicopterRotor.position.set(0, 43.5, -40);
    scene.add(helicopterRotor);
    gameObjects.push(helicopterRotor);

    // Helicopter cross marking
    var heliCrossH = new THREE.BoxGeometry(3, 0.5, 0.2);
    var heliRedMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var hcrH = new THREE.Mesh(heliCrossH, heliRedMat);
    hcrH.position.set(0, 39, -40);
    scene.add(hcrH);
    gameObjects.push(hcrH);

    var heliCrossV = new THREE.BoxGeometry(0.5, 3, 0.2);
    var hcrV = new THREE.Mesh(heliCrossV, heliRedMat);
    hcrV.position.set(0, 39, -40);
    scene.add(hcrV);
    gameObjects.push(hcrV);
  }

  function createBombDamage() {
    // Collapsed wing rubble
    var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var rubblePositions = [
      { x: -50, y: 5, z: 5, sx: 8, sy: 10, sz: 6 },
      { x: -45, y: 3, z: 10, sx: 6, sy: 6, sz: 8 },
      { x: -55, y: 2, z: 0, sx: 10, sy: 4, sz: 7 },
      { x: -48, y: 8, z: 15, sx: 5, sy: 8, sz: 5 }
    ];

    rubblePositions.forEach(function(pos) {
      var rubbleGeom = new THREE.BoxGeometry(pos.sx, pos.sy, pos.sz);
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.position.set(pos.x, pos.y, pos.z);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
      gameObjects.push(rubble);
    });

    // Exposed interior wall
    var exposedWall = new THREE.BoxGeometry(12, 25, 2);
    var exposedMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var wallExposed = new THREE.Mesh(exposedWall, exposedMat);
    wallExposed.position.set(-52, 12, 5);
    scene.add(wallExposed);
    gameObjects.push(wallExposed);
  }

  function createGeneratorBuilding() {
    // Generator building
    var genBuildGeom = new THREE.BoxGeometry(6, 6, 6);
    var genMat = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
    var genBuilding = new THREE.Mesh(genBuildGeom, genMat);
    genBuilding.position.set(-40, 3, 30);
    genBuilding.castShadow = true;
    genBuilding.receiveShadow = true;
    scene.add(genBuilding);
    gameObjects.push(genBuilding);

    // Generator cylinder unit
    var genCylGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    var genCylMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var genCyl = new THREE.Mesh(genCylGeom, genCylMat);
    genCyl.position.set(-40, 3, 30);
    scene.add(genCyl);
    gameObjects.push(genCyl);

    // Status light (animated)
    var statusGeom = new THREE.SphereGeometry(0.4, 16, 16);
    var statusMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    generatorLight = new THREE.Mesh(statusGeom, statusMat);
    generatorLight.position.set(-40, 5.5, 30);
    scene.add(generatorLight);
    gameObjects.push(generatorLight);
  }

  function createPerimeter() {
    // Sandbag walls around hospital perimeter
    var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xcc9966 });

    // North wall
    var northWallGeom = new THREE.BoxGeometry(80, 2, 2);
    var northWall = new THREE.Mesh(northWallGeom, sandbagMat);
    northWall.position.set(0, 1, -60);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    gameObjects.push(northWall);

    // South wall
    var southWallGeom = new THREE.BoxGeometry(80, 2, 2);
    var southWall = new THREE.Mesh(southWallGeom, sandbagMat);
    southWall.position.set(0, 1, 60);
    scene.add(southWall);
    gameObjects.push(southWall);

    // East wall
    var eastWallGeom = new THREE.BoxGeometry(2, 2, 120);
    var eastWall = new THREE.Mesh(eastWallGeom, sandbagMat);
    eastWall.position.set(60, 1, 0);
    scene.add(eastWall);
    gameObjects.push(eastWall);

    // West wall
    var westWallGeom = new THREE.BoxGeometry(2, 2, 120);
    var westWall = new THREE.Mesh(westWallGeom, sandbagMat);
    westWall.position.set(-60, 1, 0);
    scene.add(westWall);
    gameObjects.push(westWall);

    // Armed checkpoint at entrance
    var checkpointGeom = new THREE.BoxGeometry(6, 3, 4);
    var checkpointMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var checkpoint = new THREE.Mesh(checkpointGeom, checkpointMat);
    checkpoint.position.set(0, 1.5, -55);
    checkpoint.castShadow = true;
    checkpoint.receiveShadow = true;
    scene.add(checkpoint);
    gameObjects.push(checkpoint);

    // Guard tower at checkpoint
    var towerGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(-5, 4, -58);
    scene.add(tower);
    gameObjects.push(tower);

    // Guard tower roof
    var roofGeom = new THREE.ConeGeometry(2, 1.5, 16);
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(-5, 8.7, -58);
    scene.add(roof);
    gameObjects.push(roof);
  }

  function createPharmacy() {
    // Pharmacy stockroom building
    var pharmGeom = new THREE.BoxGeometry(10, 8, 8);
    var pharmMat = new THREE.MeshLambertMaterial({ color: 0xffffcc });
    var pharmacy = new THREE.Mesh(pharmGeom, pharmMat);
    pharmacy.position.set(25, 4, -20);
    pharmacy.castShadow = true;
    pharmacy.receiveShadow = true;
    scene.add(pharmacy);
    gameObjects.push(pharmacy);

    // Shelves with supply boxes
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var boxGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var supplyBox = new THREE.Mesh(boxGeom, shelfMat);
        supplyBox.position.set(20 + i * 2, 2 + j * 2, -20);
        scene.add(supplyBox);
        gameObjects.push(supplyBox);
      }
    }
  }

  function createWoundedSoldiers() {
    // Wounded soldiers on stretchers as obstacles
    var soldierPositions = [
      { x: -10, z: -5 },
      { x: 5, z: -15 },
      { x: -15, z: 10 },
      { x: 10, z: 5 },
      { x: 0, z: -8 }
    ];

    var soldierMat = new THREE.MeshLambertMaterial({ color: 0xaa6633 });
    soldierPositions.forEach(function(pos) {
      // Stretcher
      var stretGeom = new THREE.BoxGeometry(2, 1, 4);
      var stretcher = new THREE.Mesh(stretGeom, soldierMat);
      stretcher.position.set(pos.x, 0.5, pos.z);
      scene.add(stretcher);
      gameObjects.push(stretcher);

      // Soldier body
      var bodyGeom = new THREE.BoxGeometry(1.5, 1.5, 3);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 1.5, pos.z);
      scene.add(body);
      gameObjects.push(body);

      // Head
      var headGeom = new THREE.SphereGeometry(0.4, 16, 16);
      var headMat = new THREE.MeshLambertMaterial({ color: 0xddaa99 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x, 2.7, pos.z + 1.5);
      scene.add(head);
      gameObjects.push(head);
    });
  }

  function update(delta) {
    time += delta;

    // Animate helicopter rotor
    if (helicopterRotor) {
      helicopterRotor.rotation.z += 0.3;
    }

    // Animate blood bank indicator lights (blinking)
    var blinkAlpha = 0.5 + 0.5 * Math.sin(time * 3);
    bloodBankLights.forEach(function(light) {
      light.material.opacity = blinkAlpha;
    });

    // Animate generator status light (pulsing green/yellow)
    if (generatorLight) {
      var intensity = 0.6 + 0.4 * Math.sin(time * 2);
      generatorLight.material.color.setHSL(0.3, 1, intensity);
    }
  }

  function reset() {
    gameObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });
    gameObjects = [];
    bloodBankLights = [];
    helicopterRotor = null;
    generatorLight = null;
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
