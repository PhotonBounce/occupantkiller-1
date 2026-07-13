window.WarSubmarine = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var gameObjects = [];
  var submarine = null;
  var radarSpinner = null;
  var periscopeRotator = null;
  var waveTime = 0;

  function createMaterial(color, roughness, metalness) {
    var material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness || 0.8,
      metalness: metalness || 0.3
    });
    return material;
  }

  function addToScene(object) {
    sceneRef.add(object);
    gameObjects.push(object);
    return object;
  }

  function createSubmarine() {
    var submarineGroup = new THREE.Group();

    // Main hull: series of tapered BoxGeometry sections
    var hullFront = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 6),
      createMaterial(0x2c3e50, 0.7, 0.2)
    );
    hullFront.position.set(-25, -2, 0);
    submarineGroup.add(hullFront);

    var hullFrontMid = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 8),
      createMaterial(0x34495e, 0.7, 0.2)
    );
    hullFrontMid.position.set(-10, -2, 0);
    submarineGroup.add(hullFrontMid);

    var hullMid = new THREE.Mesh(
      new THREE.BoxGeometry(30, 10, 10),
      createMaterial(0x2c3e50, 0.7, 0.2)
    );
    hullMid.position.set(5, -2, 0);
    submarineGroup.add(hullMid);

    var hullAftMid = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 8),
      createMaterial(0x34495e, 0.7, 0.2)
    );
    hullAftMid.position.set(25, -2, 0);
    submarineGroup.add(hullAftMid);

    var hullAft = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 6),
      createMaterial(0x2c3e50, 0.7, 0.2)
    );
    hullAft.position.set(35, -2, 0);
    submarineGroup.add(hullAft);

    // Conning tower (sail)
    var sail = new THREE.Mesh(
      new THREE.BoxGeometry(6, 16, 6),
      createMaterial(0x1a252f, 0.8, 0.25)
    );
    sail.position.set(0, 10, 0);
    submarineGroup.add(sail);

    // Periscope on sail
    var periscopeBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2, 12),
      createMaterial(0x505050, 0.6, 0.4)
    );
    periscopeBase.position.set(0, 15, 0);
    submarineGroup.add(periscopeBase);

    var periscopeTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 4, 12),
      createMaterial(0x404040, 0.5, 0.5)
    );
    periscopeTube.position.set(0, 18, 0);
    submarineGroup.add(periscopeTube);

    var periscopeTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      createMaterial(0x1a1a1a, 0.4, 0.6)
    );
    periscopeTop.position.set(0, 21, 0);
    submarineGroup.add(periscopeTop);

    // Store reference for rotation animation
    periscopeRotator = periscopeBase;

    // Deck gun
    var gunBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 3),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    gunBase.position.set(-15, 3, 0);
    submarineGroup.add(gunBase);

    var gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 8, 16),
      createMaterial(0x1a1a1a, 0.5, 0.6)
    );
    gunBarrel.rotation.z = Math.PI / 2;
    gunBarrel.position.set(-15, 5, 0);
    submarineGroup.add(gunBarrel);

    var gunBreech = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      createMaterial(0x404040, 0.6, 0.4)
    );
    gunBreech.position.set(-16, 5, 0);
    submarineGroup.add(gunBreech);

    // Torpedo tubes at bow
    for (var i = 0; i < 4; i++) {
      var offset = (i - 1.5) * 1.5;
      var tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 4, 16),
        createMaterial(0x1a1a1a, 0.6, 0.5)
      );
      tube.rotation.z = Math.PI / 2;
      tube.position.set(-27, 0 + offset, 2 + offset);
      submarineGroup.add(tube);
    }

    // Torpedo tubes at stern
    for (var j = 0; j < 2; j++) {
      var offsetStern = (j - 0.5) * 1.5;
      var tubeStern = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 4, 16),
        createMaterial(0x1a1a1a, 0.6, 0.5)
      );
      tubeStern.rotation.z = Math.PI / 2;
      tubeStern.position.set(37, offsetStern, 2 + offsetStern);
      submarineGroup.add(tubeStern);
    }

    // Ballast tanks along sides
    var ballastLeft = new THREE.Mesh(
      new THREE.BoxGeometry(45, 2, 4),
      createMaterial(0x3d5a6c, 0.7, 0.25)
    );
    ballastLeft.position.set(5, -7, -8);
    submarineGroup.add(ballastLeft);

    var ballastRight = new THREE.Mesh(
      new THREE.BoxGeometry(45, 2, 4),
      createMaterial(0x3d5a6c, 0.7, 0.25)
    );
    ballastRight.position.set(5, -7, 8);
    submarineGroup.add(ballastRight);

    // Radar mast
    var radarMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 12, 0.8),
      createMaterial(0x505050, 0.7, 0.3)
    );
    radarMast.position.set(-5, 20, -3);
    submarineGroup.add(radarMast);

    // Radar spinner with antenna array
    var radarDish = new THREE.Group();
    for (var r = 0; r < 8; r++) {
      var angle = (r / 8) * Math.PI * 2;
      var antenna = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 0.3),
        createMaterial(0x1a1a1a, 0.5, 0.6)
      );
      antenna.position.set(
        Math.cos(angle) * 2,
        0,
        Math.sin(angle) * 2
      );
      antenna.rotation.z = 0.4;
      radarDish.add(antenna);
    }
    radarDish.position.set(-5, 24, -3);
    submarineGroup.add(radarDish);
    radarSpinner = radarDish;

    // Depth charges on deck
    for (var d = 0; d < 4; d++) {
      var chargeRack = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        createMaterial(0x505050, 0.8, 0.3)
      );
      chargeRack.position.set(15 + d * 2.5, 4, -7);
      submarineGroup.add(chargeRack);

      var charge = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1.2, 1.8, 16),
        createMaterial(0x8b4513, 0.8, 0.2)
      );
      charge.position.set(15 + d * 2.5, 4.5, -7);
      submarineGroup.add(charge);
    }

    // Depth charges starboard
    for (var ds = 0; ds < 4; ds++) {
      var chargeRackS = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        createMaterial(0x505050, 0.8, 0.3)
      );
      chargeRackS.position.set(15 + ds * 2.5, 4, 7);
      submarineGroup.add(chargeRackS);

      var chargeS = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1.2, 1.8, 16),
        createMaterial(0x8b4513, 0.8, 0.2)
      );
      chargeS.position.set(15 + ds * 2.5, 4.5, 7);
      submarineGroup.add(chargeS);
    }

    // Escape hatches
    for (var h = 0; h < 3; h++) {
      var hatchPosX = -10 + h * 20;
      var hatchCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16),
        createMaterial(0x2c3e50, 0.8, 0.3)
      );
      hatchCylinder.position.set(hatchPosX, 3, 0);
      submarineGroup.add(hatchCylinder);

      var hatchLid = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.4, 3.2),
        createMaterial(0x1a1a1a, 0.7, 0.4)
      );
      hatchLid.position.set(hatchPosX, 3.5, 0);
      submarineGroup.add(hatchLid);
    }

    return submarineGroup;
  }

  function createOceanWater() {
    var waterGroup = new THREE.Group();

    // Water surface
    var waterSurface = new THREE.Mesh(
      new THREE.BoxGeometry(200, 0.5, 200),
      createMaterial(0x1a4d6d, 0.5, 0.1)
    );
    waterSurface.position.set(0, 15, 0);
    waterGroup.add(waterSurface);

    // Surrounding water columns
    var waterBack = new THREE.Mesh(
      new THREE.BoxGeometry(200, 40, 80),
      createMaterial(0x0d2d47, 0.6, 0.05)
    );
    waterBack.position.set(0, -5, -60);
    waterGroup.add(waterBack);

    var waterFront = new THREE.Mesh(
      new THREE.BoxGeometry(200, 40, 80),
      createMaterial(0x0d2d47, 0.6, 0.05)
    );
    waterFront.position.set(0, -5, 60);
    waterGroup.add(waterFront);

    var waterLeft = new THREE.Mesh(
      new THREE.BoxGeometry(80, 40, 200),
      createMaterial(0x0d2d47, 0.6, 0.05)
    );
    waterLeft.position.set(-70, -5, 0);
    waterGroup.add(waterLeft);

    var waterRight = new THREE.Mesh(
      new THREE.BoxGeometry(80, 40, 200),
      createMaterial(0x0d2d47, 0.6, 0.05)
    );
    waterRight.position.set(70, -5, 0);
    waterGroup.add(waterRight);

    return waterGroup;
  }

  function createTorpedoRoom() {
    var torpedoRoom = new THREE.Group();

    // Room walls
    var roomBack = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    roomBack.position.set(-20, -5, -6);
    torpedoRoom.add(roomBack);

    var roomFront = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    roomFront.position.set(-20, -5, 6);
    torpedoRoom.add(roomFront);

    var roomLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 12),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    roomLeft.position.set(-26, -5, 0);
    torpedoRoom.add(roomLeft);

    var roomRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 12),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    roomRight.position.set(-14, -5, 0);
    torpedoRoom.add(roomRight);

    var roomFloor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.5, 12),
      createMaterial(0x1a1a1a, 0.8, 0.4)
    );
    roomFloor.position.set(-20, -9, 0);
    torpedoRoom.add(roomFloor);

    // Torpedo racks
    for (var tr = 0; tr < 6; tr++) {
      var rackFrame = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 0.8),
        createMaterial(0x505050, 0.8, 0.4)
      );
      rackFrame.position.set(-20, -6 + tr * 1.3, 0);
      torpedoRoom.add(rackFrame);

      // Torpedoes on rack
      for (var t = 0; t < 2; t++) {
        var torpedo = new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.5, 8, 16),
          createMaterial(0x505050, 0.7, 0.5)
        );
        torpedo.rotation.z = Math.PI / 2;
        torpedo.position.set(-20, -6 + tr * 1.3, -2.5 + t * 5);
        torpedoRoom.add(torpedo);
      }
    }

    // Loading mechanism (CylinderGeometry)
    var loader = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 3, 12),
      createMaterial(0x404040, 0.7, 0.5)
    );
    loader.rotation.z = Math.PI / 2;
    loader.position.set(-20, -1, 0);
    torpedoRoom.add(loader);

    return torpedoRoom;
  }

  function createEngineRoom() {
    var engineRoom = new THREE.Group();

    // Room walls
    var engBack = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    engBack.position.set(20, -5, -6);
    engineRoom.add(engBack);

    var engFront = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    engFront.position.set(20, -5, 6);
    engineRoom.add(engFront);

    var engLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 12),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    engLeft.position.set(13, -5, 0);
    engineRoom.add(engLeft);

    var engRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 12),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    engRight.position.set(27, -5, 0);
    engineRoom.add(engRight);

    var engFloor = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.5, 12),
      createMaterial(0x1a1a1a, 0.8, 0.4)
    );
    engFloor.position.set(20, -9, 0);
    engineRoom.add(engFloor);

    // Main diesel engines
    var engine1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 6, 16),
      createMaterial(0x505050, 0.8, 0.4)
    );
    engine1.position.set(15, -3, -3);
    engineRoom.add(engine1);

    var engine2 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 6, 16),
      createMaterial(0x505050, 0.8, 0.4)
    );
    engine2.position.set(25, -3, -3);
    engineRoom.add(engine2);

    var engine3 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 6, 16),
      createMaterial(0x505050, 0.8, 0.4)
    );
    engine3.position.set(15, -3, 3);
    engineRoom.add(engine3);

    var engine4 = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 6, 16),
      createMaterial(0x505050, 0.8, 0.4)
    );
    engine4.position.set(25, -3, 3);
    engineRoom.add(engine4);

    // Pipes
    for (var p = 0; p < 8; p++) {
      var pipeX = 12 + (p % 4) * 4;
      var pipeY = -2 + Math.floor(p / 4) * 2;
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 16, 12),
        createMaterial(0x8b4513, 0.7, 0.3)
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(20, pipeY, pipeX - 20);
      engineRoom.add(pipe);
    }

    // Reactor/Battery chamber
    var reactor = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 4),
      createMaterial(0x1a3a52, 0.8, 0.3)
    );
    reactor.position.set(20, -3, 0);
    engineRoom.add(reactor);

    return engineRoom;
  }

  function createControlRoom() {
    var controlRoom = new THREE.Group();

    // Room walls
    var ctrlBack = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    ctrlBack.position.set(0, -5, -5.5);
    controlRoom.add(ctrlBack);

    var ctrlFront = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    ctrlFront.position.set(0, -5, 5.5);
    controlRoom.add(ctrlFront);

    var ctrlLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 11),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    ctrlLeft.position.set(-5.5, -5, 0);
    controlRoom.add(ctrlLeft);

    var ctrlRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 11),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    ctrlRight.position.set(5.5, -5, 0);
    controlRoom.add(ctrlRight);

    var ctrlFloor = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.5, 11),
      createMaterial(0x1a1a1a, 0.8, 0.4)
    );
    ctrlFloor.position.set(0, -9, 0);
    controlRoom.add(ctrlFloor);

    // Periscope housing
    var periscopeHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 4, 12),
      createMaterial(0x404040, 0.6, 0.5)
    );
    periscopeHousing.position.set(0, -2, 0);
    controlRoom.add(periscopeHousing);

    // Control panels - port side
    for (var cp = 0; cp < 3; cp++) {
      var panelPort = new THREE.Mesh(
        new THREE.BoxGeometry(2, 4, 0.4),
        createMaterial(0x1a3a52, 0.6, 0.4)
      );
      panelPort.position.set(-4, -4 + cp * 2, -4.5);
      controlRoom.add(panelPort);

      // Gauges on panel
      for (var g = 0; g < 4; g++) {
        var gauge = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
          createMaterial(0x00ff00, 0.3, 0.7)
        );
        gauge.position.set(-4 + (g % 2) * 0.8, -5 + cp * 2 + Math.floor(g / 2) * 0.8, -4.3);
        controlRoom.add(gauge);
      }
    }

    // Control panels - starboard side
    for (var cps = 0; cps < 3; cps++) {
      var panelStarboard = new THREE.Mesh(
        new THREE.BoxGeometry(2, 4, 0.4),
        createMaterial(0x1a3a52, 0.6, 0.4)
      );
      panelStarboard.position.set(4, -4 + cps * 2, -4.5);
      controlRoom.add(panelStarboard);

      // Gauges on panel
      for (var gs = 0; gs < 4; gs++) {
        var gaugeS = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8),
          createMaterial(0x00ff00, 0.3, 0.7)
        );
        gaugeS.position.set(4 + (gs % 2) * 0.8 - 0.4, -5 + cps * 2 + Math.floor(gs / 2) * 0.8, -4.3);
        controlRoom.add(gaugeS);
      }
    }

    // Helm station
    var helmBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 2),
      createMaterial(0x505050, 0.8, 0.4)
    );
    helmBase.position.set(0, -7, 4);
    controlRoom.add(helmBase);

    var wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.3, 16),
      createMaterial(0x1a1a1a, 0.7, 0.5)
    );
    wheel.position.set(0, -5.5, 4);
    controlRoom.add(wheel);

    return controlRoom;
  }

  function createCrewQuarters() {
    var crewQuarters = new THREE.Group();

    // Room walls
    var crewBack = new THREE.Mesh(
      new THREE.BoxGeometry(8, 7, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    crewBack.position.set(-15, -5, -4);
    crewQuarters.add(crewBack);

    var crewFront = new THREE.Mesh(
      new THREE.BoxGeometry(8, 7, 0.5),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    crewFront.position.set(-15, -5, 4);
    crewQuarters.add(crewFront);

    var crewLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 7, 8),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    crewLeft.position.set(-19.5, -5, 0);
    crewQuarters.add(crewLeft);

    var crewRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 7, 8),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    crewRight.position.set(-10.5, -5, 0);
    crewQuarters.add(crewRight);

    var crewFloor = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 8),
      createMaterial(0x1a1a1a, 0.8, 0.4)
    );
    crewFloor.position.set(-15, -8, 0);
    crewQuarters.add(crewFloor);

    var crewCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 8),
      createMaterial(0x2c3e50, 0.8, 0.3)
    );
    crewCeiling.position.set(-15, -2, 0);
    crewQuarters.add(crewCeiling);

    // Bunk beds stacked in narrow passage
    for (var b = 0; b < 4; b++) {
      var bunksPerLevel = 2;
      for (var bl = 0; bl < bunksPerLevel; bl++) {
        var bunkFrame = new THREE.Mesh(
          new THREE.BoxGeometry(3, 0.8, 2),
          createMaterial(0x505050, 0.7, 0.3)
        );
        bunkFrame.position.set(-18 + bl * 6, -5 + b * 1.2, 0);
        crewQuarters.add(bunkFrame);

        var bunkMattress = new THREE.Mesh(
          new THREE.BoxGeometry(2.8, 0.3, 1.8),
          createMaterial(0x8b4513, 0.8, 0.2)
        );
        bunkMattress.position.set(-18 + bl * 6, -4.5 + b * 1.2, 0);
        crewQuarters.add(bunkMattress);
      }
    }

    // Wall-mounted lockers
    for (var l = 0; l < 4; l++) {
      var locker = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 0.8),
        createMaterial(0x3d5a6c, 0.7, 0.3)
      );
      locker.position.set(-19, -6 + l * 1.8, 0);
      crewQuarters.add(locker);
    }

    return crewQuarters;
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    gameObjects = [];

    // Create all submarine components
    submarine = createSubmarine();
    addToScene(submarine);

    var waterGroup = createOceanWater();
    addToScene(waterGroup);

    var torpedoRoom = createTorpedoRoom();
    addToScene(torpedoRoom);

    var engineRoom = createEngineRoom();
    addToScene(engineRoom);

    var controlRoom = createControlRoom();
    addToScene(controlRoom);

    var crewQuarters = createCrewQuarters();
    addToScene(crewQuarters);

    // Camera positioned inside submarine
    camera.position.set(0, -2, 0);
    camera.lookAt(0, -2, 1);

    return {
      submarine: submarine,
      radarSpinner: radarSpinner,
      periscopeRotator: periscopeRotator
    };
  }

  function update(delta) {
    if (!submarine) return;

    // Gentle rocking motion on waves
    waveTime += delta;
    var rockAmount = Math.sin(waveTime * 0.3) * 0.15;
    var pitchAmount = Math.cos(waveTime * 0.25) * 0.08;

    submarine.position.y = rockAmount;
    submarine.rotation.z = rockAmount * 0.1;
    submarine.rotation.x = pitchAmount * 0.1;

    // Periscope rotation
    if (periscopeRotator) {
      periscopeRotator.rotation.y += delta * 0.5;
    }

    // Radar spinning
    if (radarSpinner) {
      radarSpinner.rotation.y += delta * 1.5;
    }
  }

  function reset() {
    // Clean up all objects
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      var obj = gameObjects[i];
      if (obj && obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj && obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj && obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    gameObjects = [];
    submarine = null;
    radarSpinner = null;
    periscopeRotator = null;
    waveTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
