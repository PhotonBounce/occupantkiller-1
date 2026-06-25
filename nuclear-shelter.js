window.NuclearShelter = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var shelterGroup = null;
  var generatorVibration = 0;
  var waterTankPulse = 0;
  var emergencyLightPhase = 0;
  var chapelCandleFlicker = [];

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    shelterGroup = new THREE.Group();
    scene.add(shelterGroup);

    // Set concrete bunker atmosphere
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x2a2a2a, 150, 400);

    // Build shelter structure
    buildBlastDoor();
    buildDecontaminationAirlock();
    buildDormitoryHall();
    buildWaterStorageTanks();
    buildFoodStorageVault();
    buildMedicalBay();
    buildRadiationMonitoringStation();
    buildDieselGeneratorRoom();
    buildAirFiltrationPlant();
    buildChildrensPlayArea();
    buildCommunityKitchen();
    buildChapelCorner();
    buildCommandCenter();
    buildRepairWorkshop();
    buildEmergencyExitTube();
    buildWaterRecyclingPlant();

    // Initialize flicker states
    chapelCandleFlicker = [];
    for (var i = 0; i < 6; i++) {
      chapelCandleFlicker.push(Math.random());
    }
  }

  function buildBlastDoor() {
    var doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, -80);

    // Massive outer door (reinforced steel)
    var outerDoorGeom = new THREE.BoxGeometry(12, 15, 1.5);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.3 });
    var outerDoor = new THREE.Mesh(outerDoorGeom, steelMaterial);
    outerDoor.position.z = -0.75;
    doorGroup.add(outerDoor);

    // Frame bolts (12 massive bolts)
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 2; j++) {
        var boltGeom = new THREE.BoxGeometry(0.8, 0.8, 0.6);
        var boltMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 });
        var bolt = new THREE.Mesh(boltGeom, boltMaterial);
        bolt.position.set(-4.5 + i * 1.8, -5.5 + j * 11, 0.5);
        doorGroup.add(bolt);
      }
    }

    // Inner reinforcement plate
    var innerPlateGeom = new THREE.BoxGeometry(11, 14, 0.8);
    var innerPlate = new THREE.Mesh(innerPlateGeom, steelMaterial);
    innerPlate.position.z = 1.2;
    doorGroup.add(innerPlate);

    shelterGroup.add(doorGroup);
  }

  function buildDecontaminationAirlock() {
    var airlockGroup = new THREE.Group();
    airlockGroup.position.set(0, 0, -50);

    // Outer decon room
    var outerRoomGeom = new THREE.BoxGeometry(10, 8, 8);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var outerRoom = new THREE.Mesh(outerRoomGeom, concreteMaterial);
    outerRoom.position.set(-15, 0, 0);
    airlockGroup.add(outerRoom);

    // Inner decon room
    var innerRoomGeom = new THREE.BoxGeometry(10, 8, 8);
    var innerRoom = new THREE.Mesh(innerRoomGeom, concreteMaterial);
    innerRoom.position.set(15, 0, 0);
    airlockGroup.add(innerRoom);

    // Decon shower heads (CylinderGeometry)
    for (var i = 0; i < 4; i++) {
      var showerHeadGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
      var metalMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 });
      var showerHead = new THREE.Mesh(showerHeadGeom, metalMaterial);
      showerHead.position.set(-15 + i * 3 - 4.5, 3.8, -3);
      airlockGroup.add(showerHead);
    }

    // Heavy airlock doors
    var doorGeom = new THREE.BoxGeometry(3.5, 8, 0.4);
    var door1 = new THREE.Mesh(doorGeom, steelMaterial);
    door1.position.set(-8, 0, -3.8);
    airlockGroup.add(door1);

    var door2 = new THREE.Mesh(doorGeom, steelMaterial);
    door2.position.set(8, 0, -3.8);
    airlockGroup.add(door2);

    shelterGroup.add(airlockGroup);
  }

  function buildDormitoryHall() {
    var dormGroup = new THREE.Group();
    dormGroup.position.set(0, 0, 0);

    // Main dormitory room (long concrete hall)
    var hallGeom = new THREE.BoxGeometry(35, 12, 40);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var hall = new THREE.Mesh(hallGeom, concreteMaterial);
    hall.position.y = 6;
    dormGroup.add(hall);

    // Triple-tier bunk rows (3 rows of bunks, 4 sections each)
    for (var row = 0; row < 3; row++) {
      for (var section = 0; section < 4; section++) {
        var xPos = -10 + section * 7;
        var zPos = -12 + row * 12;

        // Bunk frame
        var frameGeom = new THREE.BoxGeometry(2, 6.5, 2);
        var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
        var frame = new THREE.Mesh(frameGeom, metalMaterial);
        frame.position.set(xPos, 3.25, zPos);
        dormGroup.add(frame);

        // Three mattresses per frame
        for (var tier = 0; tier < 3; tier++) {
          var mattressGeom = new THREE.BoxGeometry(2.2, 0.3, 1.8);
          var fabricMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.8 });
          var mattress = new THREE.Mesh(mattressGeom, fabricMaterial);
          mattress.position.set(xPos, 1.2 + tier * 2.1, zPos);
          dormGroup.add(mattress);
        }
      }
    }

    shelterGroup.add(dormGroup);
  }

  function buildWaterStorageTanks() {
    var tankGroup = new THREE.Group();
    tankGroup.position.set(-35, 0, 20);

    // Two large cylindrical water tanks
    for (var i = 0; i < 2; i++) {
      var tankGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
      var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x6a7a8a, metalness: 0.5 });
      var tank = new THREE.Mesh(tankGeom, metalMaterial);
      tank.position.set(i * 12, 7, 0);
      tankGroup.add(tank);

      // Water level indicator (pulsing SphereGeometry)
      var indicatorGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var indicatorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
      var indicator = new THREE.Mesh(indicatorGeom, indicatorMaterial);
      indicator.position.set(i * 12, 3, 4.2);
      indicator.userData.originalScale = 0.4;
      indicator.userData.isWaterIndicator = true;
      tankGroup.add(indicator);

      // Support legs
      for (var j = 0; j < 4; j++) {
        var legGeom = new THREE.BoxGeometry(0.5, 8, 0.5);
        var leg = new THREE.Mesh(legGeom, metalMaterial);
        leg.position.set(i * 12 + (j % 2 === 0 ? 3 : -3), 4, (j < 2 ? 3 : -3));
        tankGroup.add(leg);
      }
    }

    shelterGroup.add(tankGroup);
  }

  function buildFoodStorageVault() {
    var vaultGroup = new THREE.Group();
    vaultGroup.position.set(35, 0, -30);

    // Reinforced vault room
    var vaultRoomGeom = new THREE.BoxGeometry(12, 10, 16);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });
    var vaultRoom = new THREE.Mesh(vaultRoomGeom, concreteMaterial);
    vaultRoom.position.y = 5;
    vaultGroup.add(vaultRoom);

    // Heavy vault door
    var doorGeom = new THREE.BoxGeometry(5, 10, 0.6);
    var steelMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.85 });
    var door = new THREE.Mesh(doorGeom, steelMaterial);
    door.position.set(0, 5, -8.2);
    vaultGroup.add(door);

    // Storage shelves (6 shelves, 3 columns)
    for (var col = 0; col < 3; col++) {
      for (var shelf = 0; shelf < 6; shelf++) {
        var shelfGeom = new THREE.BoxGeometry(3, 0.3, 6);
        var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4 });
        var shelfMesh = new THREE.Mesh(shelfGeom, shelfMaterial);
        shelfMesh.position.set(-4 + col * 4.5, 1.5 + shelf * 1.5, 0);
        vaultGroup.add(shelfMesh);

        // Crates on shelf
        for (var c = 0; c < 2; c++) {
          var crateGeom = new THREE.BoxGeometry(1.2, 0.8, 1.2);
          var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a3a, roughness: 0.8 });
          var crate = new THREE.Mesh(crateGeom, crateMaterial);
          crate.position.set(-3 + col * 4.5 + c * 1.5, 2.2 + shelf * 1.5, 0);
          vaultGroup.add(crate);
        }
      }
    }

    shelterGroup.add(vaultGroup);
  }

  function buildMedicalBay() {
    var medGroup = new THREE.Group();
    medGroup.position.set(-25, 0, 40);

    // Medical bay room
    var bayGeom = new THREE.BoxGeometry(16, 10, 14);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var bay = new THREE.Mesh(bayGeom, concreteMaterial);
    bay.position.y = 5;
    medGroup.add(bay);

    // Hospital beds (4 beds with frames)
    for (var i = 0; i < 4; i++) {
      var bedFrameGeom = new THREE.BoxGeometry(2, 1, 3);
      var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
      var bedFrame = new THREE.Mesh(bedFrameGeom, metalMaterial);
      bedFrame.position.set(-6 + i * 5, 0.5, -4);
      medGroup.add(bedFrame);

      // Mattress
      var mattressGeom = new THREE.BoxGeometry(2.1, 0.3, 3.1);
      var whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
      var mattress = new THREE.Mesh(mattressGeom, whiteMaterial);
      mattress.position.set(-6 + i * 5, 1.3, -4);
      medGroup.add(mattress);
    }

    // Oxygen tanks (CylinderGeometry, 6 tanks)
    for (var j = 0; j < 6; j++) {
      var tankGeom = new THREE.CylinderGeometry(0.4, 0.4, 2.2, 12);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x1a6a1a, metalness: 0.7 });
      var tank = new THREE.Mesh(tankGeom, tankMaterial);
      tank.position.set(5 + (j % 3) * 1.5, 1.1, -3 + Math.floor(j / 3) * 2);
      medGroup.add(tank);
    }

    // Supply cabinet
    var cabinetGeom = new THREE.BoxGeometry(3, 4, 2);
    var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.4 });
    var cabinet = new THREE.Mesh(cabinetGeom, cabinetMaterial);
    cabinet.position.set(7, 2, 5);
    medGroup.add(cabinet);

    shelterGroup.add(medGroup);
  }

  function buildRadiationMonitoringStation() {
    var monitorGroup = new THREE.Group();
    monitorGroup.position.set(25, 0, 40);

    // Monitoring station room
    var stationGeom = new THREE.BoxGeometry(12, 10, 10);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var station = new THREE.Mesh(stationGeom, concreteMaterial);
    station.position.y = 5;
    monitorGroup.add(station);

    // Control desk
    var deskGeom = new THREE.BoxGeometry(6, 0.8, 2);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
    var desk = new THREE.Mesh(deskGeom, metalMaterial);
    desk.position.set(0, 1, -3);
    monitorGroup.add(desk);

    // Geiger counter (SphereGeometry with pulsing glow)
    var counterGeom = new THREE.SphereGeometry(0.6, 12, 12);
    var counterMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xaa3300 });
    var counter = new THREE.Mesh(counterGeom, counterMaterial);
    counter.position.set(-2, 2.2, -3);
    counter.userData.isGeigerCounter = true;
    monitorGroup.add(counter);

    // Monitor screens (BoxGeometry)
    for (var i = 0; i < 3; i++) {
      var screenGeom = new THREE.BoxGeometry(2.5, 1.8, 0.3);
      var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x003300 });
      var screen = new THREE.Mesh(screenGeom, screenMaterial);
      screen.position.set(-2 + i * 2.5, 2.8, -3.5);
      monitorGroup.add(screen);
    }

    shelterGroup.add(monitorGroup);
  }

  function buildDieselGeneratorRoom() {
    var genGroup = new THREE.Group();
    genGroup.position.set(-20, 0, -50);

    // Generator room
    var roomGeom = new THREE.BoxGeometry(18, 12, 16);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 6;
    genGroup.add(room);

    // Two large diesel engines (BoxGeometry)
    for (var i = 0; i < 2; i++) {
      var engineGeom = new THREE.BoxGeometry(5, 4, 6);
      var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.7 });
      var engine = new THREE.Mesh(engineGeom, metalMaterial);
      engine.position.set(-6 + i * 14, 2, 0);
      engine.userData.isGenerator = true;
      genGroup.add(engine);

      // Engine cylinders (CylinderGeometry)
      for (var c = 0; c < 4; c++) {
        var cylGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
        var cyl = new THREE.Mesh(cylGeom, metalMaterial);
        cyl.position.set(-6 + i * 14 - 1.5 + c * 1, 4.5, 0);
        genGroup.add(cyl);
      }
    }

    // Fuel tanks (large CylinderGeometry)
    for (var f = 0; f < 2; f++) {
      var fuelGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
      var fuelMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a1a, metalness: 0.6 });
      var fuelTank = new THREE.Mesh(fuelGeom, fuelMaterial);
      fuelTank.position.set(6 + f * 6, 3, -6);
      genGroup.add(fuelTank);
    }

    // Exhaust pipes (CylinderGeometry vertical)
    for (var e = 0; e < 2; e++) {
      var exhaustGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
      var exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8 });
      var exhaust = new THREE.Mesh(exhaustGeom, exhaustMaterial);
      exhaust.position.set(-6 + e * 14, 8, 7);
      genGroup.add(exhaust);
    }

    shelterGroup.add(genGroup);
  }

  function buildAirFiltrationPlant() {
    var filterGroup = new THREE.Group();
    filterGroup.position.set(20, 0, -50);

    // Filter room
    var roomGeom = new THREE.BoxGeometry(16, 12, 14);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.95 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 6;
    filterGroup.add(room);

    // Large filtration unit (BoxGeometry)
    var unitGeom = new THREE.BoxGeometry(8, 10, 8);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.6 });
    var unit = new THREE.Mesh(unitGeom, metalMaterial);
    unit.position.set(0, 5, 0);
    filterGroup.add(unit);

    // Filter stacks (CylinderGeometry, 6 large vertical cylinders)
    for (var i = 0; i < 6; i++) {
      var filterGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
      var filterMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5 });
      var filter = new THREE.Mesh(filterGeom, filterMaterial);
      filter.position.set(-3 + (i % 3) * 3, 4, -2 + Math.floor(i / 3) * 4);
      filterGroup.add(filter);
    }

    // Air inlet duct (BoxGeometry)
    var inletGeom = new THREE.BoxGeometry(3, 3, 2);
    var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, metalness: 0.5 });
    var inlet = new THREE.Mesh(inletGeom, ductMaterial);
    inlet.position.set(-7, 7, 0);
    filterGroup.add(inlet);

    // Air outlet duct
    var outlet = new THREE.Mesh(inletGeom, ductMaterial);
    outlet.position.set(7, 7, 0);
    filterGroup.add(outlet);

    shelterGroup.add(filterGroup);
  }

  function buildChildrensPlayArea() {
    var playGroup = new THREE.Group();
    playGroup.position.set(-40, 0, 0);

    // Play room
    var roomGeom = new THREE.BoxGeometry(12, 8, 12);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 4;
    playGroup.add(room);

    // Colorful low tables (BoxGeometry)
    var colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3];
    for (var i = 0; i < 4; i++) {
      var tableGeom = new THREE.BoxGeometry(2.5, 1, 2.5);
      var tableMaterial = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.7 });
      var table = new THREE.Mesh(tableGeom, tableMaterial);
      table.position.set(-3 + (i % 2) * 6, 0.5, -3 + Math.floor(i / 2) * 6);
      playGroup.add(table);
    }

    // Play shapes (ConeGeometry)
    for (var s = 0; s < 6; s++) {
      var coneGeom = new THREE.ConeGeometry(0.8, 2, 8);
      var coneMaterial = new THREE.MeshStandardMaterial({ color: colors[s % 4], roughness: 0.7 });
      var cone = new THREE.Mesh(coneGeom, coneMaterial);
      cone.position.set(-4 + s * 1.8, 1, 2);
      playGroup.add(cone);
    }

    shelterGroup.add(playGroup);
  }

  function buildCommunityKitchen() {
    var kitchenGroup = new THREE.Group();
    kitchenGroup.position.set(40, 0, 0);

    // Kitchen room
    var roomGeom = new THREE.BoxGeometry(14, 9, 12);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 4.5;
    kitchenGroup.add(room);

    // Counters (BoxGeometry, 3 counters)
    for (var i = 0; i < 3; i++) {
      var counterGeom = new THREE.BoxGeometry(4, 1, 2);
      var counterMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
      var counter = new THREE.Mesh(counterGeom, counterMaterial);
      counter.position.set(-4 + i * 4, 1, -4);
      kitchenGroup.add(counter);
    }

    // Large cooking pots (CylinderGeometry)
    for (var p = 0; p < 8; p++) {
      var potGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12);
      var potMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
      var pot = new THREE.Mesh(potGeom, potMaterial);
      pot.position.set(-4 + (p % 4) * 2.5, 2.2, -4 + Math.floor(p / 4) * 1.5);
      kitchenGroup.add(pot);
    }

    shelterGroup.add(kitchenGroup);
  }

  function buildChapelCorner() {
    var chapelGroup = new THREE.Group();
    chapelGroup.position.set(0, 0, 60);

    // Chapel room
    var roomGeom = new THREE.BoxGeometry(10, 10, 8);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 5;
    chapelGroup.add(room);

    // Altar (BoxGeometry platform)
    var altarGeom = new THREE.BoxGeometry(4, 1, 3);
    var altarMaterial = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 });
    var altar = new THREE.Mesh(altarGeom, altarMaterial);
    altar.position.set(0, 1, -2.5);
    chapelGroup.add(altar);

    // Altar cross (BoxGeometry)
    var crossVertGeom = new THREE.BoxGeometry(0.3, 3, 0.3);
    var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa77, metalness: 0.6 });
    var crossVert = new THREE.Mesh(crossVertGeom, crossMaterial);
    crossVert.position.set(0, 3, -2.5);
    chapelGroup.add(crossVert);

    var crossHorizGeom = new THREE.BoxGeometry(2, 0.3, 0.3);
    var crossHoriz = new THREE.Mesh(crossHorizGeom, crossMaterial);
    crossHoriz.position.set(0, 2, -2.5);
    chapelGroup.add(crossHoriz);

    // Candles (6 candles with CylinderGeometry and flicker data)
    for (var i = 0; i < 6; i++) {
      var candleGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
      var candleMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa44, emissive: 0xff7700 });
      var candle = new THREE.Mesh(candleGeom, candleMaterial);
      candle.position.set(-2 + i * 0.8, 2.5, -2.5);
      candle.userData.isCandleFlame = true;
      candle.userData.candleIndex = i;
      chapelGroup.add(candle);
    }

    shelterGroup.add(chapelGroup);
  }

  function buildCommandCenter() {
    var cmdGroup = new THREE.Group();
    cmdGroup.position.set(35, 0, 20);

    // Command center room
    var roomGeom = new THREE.BoxGeometry(14, 9, 12);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 4.5;
    cmdGroup.add(room);

    // Command desks (BoxGeometry, 3 desks)
    for (var i = 0; i < 3; i++) {
      var deskGeom = new THREE.BoxGeometry(3, 0.8, 2);
      var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
      var desk = new THREE.Mesh(deskGeom, deskMaterial);
      desk.position.set(-4 + i * 4, 1, 0);
      cmdGroup.add(desk);
    }

    // Communication equipment (SphereGeometry)
    for (var c = 0; c < 6; c++) {
      var commGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var commMaterial = new THREE.MeshStandardMaterial({ color: 0x1a6a1a, emissive: 0x00aa00 });
      var comm = new THREE.Mesh(commGeom, commMaterial);
      comm.position.set(-5 + c * 2, 2.5, 3);
      cmdGroup.add(comm);
    }

    shelterGroup.add(cmdGroup);
  }

  function buildRepairWorkshop() {
    var workshopGroup = new THREE.Group();
    workshopGroup.position.set(-35, 0, 20);

    // Workshop room
    var roomGeom = new THREE.BoxGeometry(12, 10, 14);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 5;
    workshopGroup.add(room);

    // Workbenches (BoxGeometry, 3 benches)
    for (var i = 0; i < 3; i++) {
      var benchGeom = new THREE.BoxGeometry(3.5, 0.8, 2);
      var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.8 });
      var bench = new THREE.Mesh(benchGeom, benchMaterial);
      bench.position.set(-3 + i * 4, 1, 0);
      workshopGroup.add(bench);
    }

    // Tools (small BoxGeometry scattered)
    for (var t = 0; t < 12; t++) {
      var toolGeom = new THREE.BoxGeometry(0.3, 0.15, 0.8);
      var toolMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa77, metalness: 0.7 });
      var tool = new THREE.Mesh(toolGeom, toolMaterial);
      tool.position.set(-4 + (t % 6) * 1.4, 2, -3 + Math.floor(t / 6) * 2);
      workshopGroup.add(tool);
    }

    shelterGroup.add(workshopGroup);
  }

  function buildEmergencyExitTube() {
    var exitGroup = new THREE.Group();
    exitGroup.position.set(50, 0, -20);

    // Vertical emergency shaft (large CylinderGeometry)
    var shaftGeom = new THREE.CylinderGeometry(3, 3, 60, 16);
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.6 });
    var shaft = new THREE.Mesh(shaftGeom, metalMaterial);
    shaft.position.y = 30;
    exitGroup.add(shaft);

    // Vertical ladder (LineSegments for rungs)
    var ladderGeom = new THREE.BufferGeometry();
    var positions = [];
    for (var rung = 0; rung < 40; rung++) {
      var yPos = -28 + rung * 1.5;
      positions.push(-2.5, yPos, 0, 2.5, yPos, 0);
    }
    ladderGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeom, ladderMaterial);
    exitGroup.add(ladder);

    shelterGroup.add(exitGroup);
  }

  function buildWaterRecyclingPlant() {
    var recycleGroup = new THREE.Group();
    recycleGroup.position.set(0, 0, -60);

    // Recycling plant room
    var roomGeom = new THREE.BoxGeometry(16, 10, 12);
    var concreteMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var room = new THREE.Mesh(roomGeom, concreteMaterial);
    room.position.y = 5;
    recycleGroup.add(room);

    // Processing tanks (BoxGeometry)
    for (var i = 0; i < 3; i++) {
      var tankGeom = new THREE.BoxGeometry(3.5, 4, 3);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6a7a, metalness: 0.5 });
      var tank = new THREE.Mesh(tankGeom, tankMaterial);
      tank.position.set(-5 + i * 5, 2, -3);
      recycleGroup.add(tank);
    }

    // Piping system (CylinderGeometry pipes)
    for (var p = 0; p < 8; p++) {
      var pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
      var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x5a7a8a, metalness: 0.6 });
      var pipe = new THREE.Mesh(pipeGeom, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-4 + p * 2, 3.5, 3);
      recycleGroup.add(pipe);
    }

    // Circulation pump (CylinderGeometry)
    var pumpGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 12);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a4a, metalness: 0.7 });
    var pump = new THREE.Mesh(pumpGeom, pumpMaterial);
    pump.position.set(6, 2, 0);
    recycleGroup.add(pump);

    shelterGroup.add(recycleGroup);
  }

  function update(delta) {
    if (!shelterGroup) return;

    // Generator vibration effect
    generatorVibration += delta * 5;
    var vibrationAmount = Math.sin(generatorVibration) * 0.08;
    shelterGroup.position.x = vibrationAmount;

    // Water tank pulse
    waterTankPulse += delta * 2;
    shelterGroup.children.forEach(function(child) {
      if (child.position.x === -35) {
        child.children.forEach(function(grandchild) {
          if (grandchild.userData.isWaterIndicator) {
            var pulseScale = 1 + Math.sin(waterTankPulse) * 0.15;
            grandchild.scale.set(pulseScale, pulseScale, pulseScale);
          }
        });
      }
    });

    // Emergency light blink
    emergencyLightPhase += delta * 3;
    var lightIntensity = (Math.sin(emergencyLightPhase) + 1) * 0.5;
    if (scene.children.length > 0) {
      scene.background.r = 0.1 + lightIntensity * 0.05;
      scene.background.g = 0.1 + lightIntensity * 0.02;
      scene.background.b = 0.1 + lightIntensity * 0.05;
    }

    // Chapel candle flicker
    shelterGroup.children.forEach(function(child) {
      if (child.position.z === 60) {
        child.children.forEach(function(grandchild) {
          if (grandchild.userData.isCandleFlame) {
            var idx = grandchild.userData.candleIndex;
            chapelCandleFlicker[idx] += (Math.random() - 0.5) * 0.1;
            chapelCandleFlicker[idx] = Math.max(0.5, Math.min(1.5, chapelCandleFlicker[idx]));
            grandchild.scale.y = chapelCandleFlicker[idx];
            grandchild.position.y = 2.5 + (1 - chapelCandleFlicker[idx]) * 0.15;
          }
        });
      }
    });
  }

  function reset() {
    if (shelterGroup) {
      scene.remove(shelterGroup);
    }
    generatorVibration = 0;
    waterTankPulse = 0;
    emergencyLightPhase = 0;
    chapelCandleFlicker = [];
    shelterGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
