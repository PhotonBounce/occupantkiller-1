window.CommandPost = (function() {
  'use strict';

  var commandPostGroup = null;
  var materials = {};
  var animationState = {
    radioBeaconTime: 0,
    commsRackLED: 0,
    vehicleHeadlightFlicker: 0,
    perimeterLightSweep: 0
  };

  var createMaterials = function() {
    materials.canvasTan = new THREE.MeshPhongMaterial({ color: 0xc9b49a });
    materials.woodBrown = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
    materials.metalGray = new THREE.MeshPhongMaterial({ color: 0x555555 });
    materials.metalDark = new THREE.MeshPhongMaterial({ color: 0x333333 });
    materials.red = new THREE.MeshPhongMaterial({ color: 0xff2020 });
    materials.green = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    materials.yellow = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    materials.white = new THREE.MeshPhongMaterial({ color: 0xffffff });
    materials.sandbag = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    materials.concrete = new THREE.MeshPhongMaterial({ color: 0x777777 });
    materials.wire = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    materials.signalYellow = new THREE.MeshPhongMaterial({ color: 0xffdd00 });
  };

  var createCommandTent = function(parent) {
    var tentGroup = new THREE.Group();

    // Tent frame - four main poles
    var poleGeom = new THREE.BoxGeometry(0.3, 6, 0.3);
    var poleMat = materials.metalDark;
    var pole1 = new THREE.Mesh(poleGeom, poleMat);
    pole1.position.set(-8, 3, -8);
    tentGroup.add(pole1);

    var pole2 = new THREE.Mesh(poleGeom, poleMat);
    pole2.position.set(8, 3, -8);
    tentGroup.add(pole2);

    var pole3 = new THREE.Mesh(poleGeom, poleMat);
    pole3.position.set(-8, 3, 8);
    tentGroup.add(pole3);

    var pole4 = new THREE.Mesh(poleGeom, poleMat);
    pole4.position.set(8, 3, 8);
    tentGroup.add(pole4);

    // Tent roof - canvas sections
    var roofGeom = new THREE.BoxGeometry(16.6, 0.4, 16.6);
    var roof = new THREE.Mesh(roofGeom, materials.canvasTan);
    roof.position.set(0, 6, 0);
    roof.rotation.x = 0.1;
    tentGroup.add(roof);

    // Side canvas panels
    var sideGeom = new THREE.BoxGeometry(17, 2, 0.3);
    var side1 = new THREE.Mesh(sideGeom, materials.canvasTan);
    side1.position.set(0, 3.5, -8.3);
    tentGroup.add(side1);

    var side2 = new THREE.Mesh(sideGeom, materials.canvasTan);
    side2.position.set(0, 3.5, 8.3);
    tentGroup.add(side2);

    // Front entrance canvas
    var entranceGeom = new THREE.BoxGeometry(17, 4, 0.3);
    var entrance = new THREE.Mesh(entranceGeom, materials.canvasTan);
    entrance.position.set(0, 2, -8.3);
    entrance.position.y += 0.5;
    tentGroup.add(entrance);

    parent.add(tentGroup);
    return tentGroup;
  };

  var createMapsOperationsTable = function(parent) {
    var tableGroup = new THREE.Group();

    // Table top - large flat surface
    var topGeom = new THREE.BoxGeometry(8, 0.2, 5);
    var top = new THREE.Mesh(topGeom, materials.woodBrown);
    top.position.set(0, 1.2, 0);
    tableGroup.add(top);

    // Four table legs
    var legGeom = new THREE.BoxGeometry(0.3, 1, 0.3);
    var leg1 = new THREE.Mesh(legGeom, materials.woodBrown);
    leg1.position.set(-3.5, 0.5, -2);
    tableGroup.add(leg1);

    var leg2 = new THREE.Mesh(legGeom, materials.woodBrown);
    leg2.position.set(3.5, 0.5, -2);
    tableGroup.add(leg2);

    var leg3 = new THREE.Mesh(legGeom, materials.woodBrown);
    leg3.position.set(-3.5, 0.5, 2);
    tableGroup.add(leg3);

    var leg4 = new THREE.Mesh(legGeom, materials.woodBrown);
    leg4.position.set(3.5, 0.5, 2);
    tableGroup.add(leg4);

    // Overhead lamp post
    var postGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
    var post = new THREE.Mesh(postGeom, materials.metalGray);
    post.position.set(0, 2.5, 0);
    tableGroup.add(post);

    // Lamp head
    var lampGeom = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    var lamp = new THREE.Mesh(lampGeom, materials.metalDark);
    lamp.position.set(0, 4.8, 0);
    tableGroup.add(lamp);

    // Map sheets - stacked papers on table
    var mapGeom = new THREE.BoxGeometry(5, 0.05, 3);
    for (var i = 0; i < 3; i++) {
      var map = new THREE.Mesh(mapGeom, materials.white);
      map.position.set(-1, 1.3 + i * 0.08, 0.5);
      map.rotation.z = 0.1 * i;
      tableGroup.add(map);
    }

    tableGroup.position.set(-12, 0, 5);
    parent.add(tableGroup);
    return tableGroup;
  };

  var createCommsRacks = function(parent) {
    var rackGroup = new THREE.Group();

    // Create three communication equipment racks
    for (var r = 0; r < 3; r++) {
      var rack = new THREE.Group();

      // Main frame
      var frameGeom = new THREE.BoxGeometry(2, 4, 2);
      var frame = new THREE.Mesh(frameGeom, materials.metalGray);
      frame.position.set(0, 2, 0);
      rack.add(frame);

      // Equipment stacks - horizontal boxes
      for (var e = 0; e < 4; e++) {
        var equipGeom = new THREE.BoxGeometry(1.8, 0.6, 1.8);
        var equip = new THREE.Mesh(equipGeom, materials.metalDark);
        equip.position.set(0, 1.2 + e * 0.8, 0);
        rack.add(equip);

        // LED indicator lights
        var ledGeom = new THREE.SphereGeometry(0.15, 8, 8);
        var led = new THREE.Mesh(ledGeom, materials.green);
        led.position.set(0.6, 1.5 + e * 0.8, 0.8);
        rack.add(led);
      }

      rack.position.set(-10 + r * 5, 0, -12);
      rackGroup.add(rack);
    }

    parent.add(rackGroup);
    return rackGroup;
  };

  var createRadioMast = function(parent) {
    var mastGroup = new THREE.Group();

    // Tall central pole
    var poleGeom = new THREE.CylinderGeometry(0.25, 0.25, 12, 12);
    var pole = new THREE.Mesh(poleGeom, materials.metalDark);
    pole.position.set(0, 6, 0);
    mastGroup.add(pole);

    // Beacon light at top
    var beaconGeom = new THREE.SphereGeometry(0.4, 8, 8);
    var beacon = new THREE.Mesh(beaconGeom, materials.red);
    beacon.position.set(0, 12, 0);
    beacon.userData.isBeacon = true;
    mastGroup.add(beacon);

    // Guy wire anchor points
    var wireGeom = new THREE.BufferGeometry();
    var positions = new Float32Array([
      0, 12, 0,    -3, 2, -3,
      0, 12, 0,     3, 2, -3,
      0, 12, 0,    -3, 2,  3,
      0, 12, 0,     3, 2,  3
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var wires = new THREE.LineSegments(wireGeom, materials.wire);
    mastGroup.add(wires);

    mastGroup.position.set(15, 0, 10);
    parent.add(mastGroup);
    return mastGroup;
  };

  var createFieldTelephoneSwitchboard = function(parent) {
    var boardGroup = new THREE.Group();

    // Main panel board
    var panelGeom = new THREE.BoxGeometry(3, 2.5, 0.4);
    var panel = new THREE.Mesh(panelGeom, materials.metalGray);
    panel.position.set(0, 1.5, 0);
    boardGroup.add(panel);

    // Button grid
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 6; col++) {
        var buttonGeom = new THREE.SphereGeometry(0.2, 8, 8);
        var buttonMat = col % 3 === 0 ? materials.red : (col % 3 === 1 ? materials.yellow : materials.green);
        var button = new THREE.Mesh(buttonGeom, buttonMat);
        button.position.set(-1.2 + col * 0.4, 1.8 - row * 0.5, 0.3);
        boardGroup.add(button);
      }
    }

    // Handset hook
    var hookGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
    var hook = new THREE.Mesh(hookGeom, materials.metalDark);
    hook.position.set(1.3, 0.5, 0);
    boardGroup.add(hook);

    boardGroup.position.set(-8, 0, 15);
    parent.add(boardGroup);
    return boardGroup;
  };

  var createIntelligenceBoards = function(parent) {
    var boardsGroup = new THREE.Group();

    // Two cork/canvas boards for intelligence materials
    for (var b = 0; b < 2; b++) {
      var boardGeom = new THREE.BoxGeometry(3, 3, 0.3);
      var board = new THREE.Mesh(boardGeom, materials.sandbag);
      board.position.set(b * 4 - 2, 1.8, -10);
      boardsGroup.add(board);

      // Pinned papers
      for (var p = 0; p < 5; p++) {
        var paperGeom = new THREE.BoxGeometry(0.8, 1, 0.05);
        var paper = new THREE.Mesh(paperGeom, materials.white);
        paper.position.set(-1.2 + p * 0.6, 1.5 - p * 0.3, -9.8);
        paper.rotation.z = 0.2 * (p - 2);
        boardsGroup.add(paper);
      }
    }

    parent.add(boardsGroup);
    return boardsGroup;
  };

  var createBriefingArea = function(parent) {
    var briefingGroup = new THREE.Group();

    // Folding chairs - row of seating
    for (var c = 0; c < 5; c++) {
      var chairGroup = new THREE.Group();

      // Seat
      var seatGeom = new THREE.BoxGeometry(0.6, 0.3, 0.6);
      var seat = new THREE.Mesh(seatGeom, materials.metalDark);
      seat.position.set(0, 0.6, 0);
      chairGroup.add(seat);

      // Backrest
      var backGeom = new THREE.BoxGeometry(0.6, 0.8, 0.2);
      var back = new THREE.Mesh(backGeom, materials.metalDark);
      back.position.set(0, 1.1, -0.35);
      back.rotation.z = 0.3;
      chairGroup.add(back);

      chairGroup.position.set(-1.5 + c * 0.8, 0, 8);
      briefingGroup.add(chairGroup);
    }

    // Podium
    var podiumGeom = new THREE.BoxGeometry(1.5, 1.2, 1);
    var podium = new THREE.Mesh(podiumGeom, materials.woodBrown);
    podium.position.set(3, 0.6, 8);
    briefingGroup.add(podium);

    // Lectern top
    var lecternGeom = new THREE.BoxGeometry(1.3, 0.3, 0.8);
    var lectern = new THREE.Mesh(lecternGeom, materials.woodBrown);
    lectern.position.set(3, 1.6, 8);
    lectern.rotation.x = 0.3;
    briefingGroup.add(lectern);

    parent.add(briefingGroup);
    return briefingGroup;
  };

  var createVehiclePark = function(parent) {
    var parkGroup = new THREE.Group();

    // Jeep 1
    var jeep1 = createMilitaryVehicle(0);
    jeep1.position.set(-8, 0, -15);
    parkGroup.add(jeep1);

    // Command car
    var cmdCar = createMilitaryVehicle(1);
    cmdCar.position.set(0, 0, -15);
    parkGroup.add(cmdCar);

    // Jeep 2
    var jeep2 = createMilitaryVehicle(0);
    jeep2.position.set(8, 0, -15);
    parkGroup.add(jeep2);

    parent.add(parkGroup);
    return parkGroup;
  };

  var createMilitaryVehicle = function(type) {
    var vehicleGroup = new THREE.Group();

    // Body
    var bodyGeom = type === 0 ? new THREE.BoxGeometry(2, 1.2, 4) : new THREE.BoxGeometry(2.5, 1.5, 5);
    var body = new THREE.Mesh(bodyGeom, materials.green);
    body.position.set(0, 0.8, 0);
    vehicleGroup.add(body);

    // Cabin/windshield
    var cabinGeom = new THREE.BoxGeometry(1.8, 0.8, 1.5);
    var cabin = new THREE.Mesh(cabinGeom, materials.metalDark);
    cabin.position.set(0, 1.3, -1);
    vehicleGroup.add(cabin);

    // Four wheels
    var wheelGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    var wheelMat = materials.metalDark;

    var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(-0.8, 0.5, -1.2);
    vehicleGroup.add(wheel1);

    var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel2.rotation.z = Math.PI / 2;
    wheel2.position.set(0.8, 0.5, -1.2);
    vehicleGroup.add(wheel2);

    var wheel3 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel3.rotation.z = Math.PI / 2;
    wheel3.position.set(-0.8, 0.5, 1.2);
    vehicleGroup.add(wheel3);

    var wheel4 = new THREE.Mesh(wheelGeom, wheelMat);
    wheel4.rotation.z = Math.PI / 2;
    wheel4.position.set(0.8, 0.5, 1.2);
    vehicleGroup.add(wheel4);

    // Headlight
    var headlightGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var headlight = new THREE.Mesh(headlightGeom, materials.yellow);
    headlight.position.set(-0.6, 0.9, -2);
    headlight.userData.isHeadlight = true;
    vehicleGroup.add(headlight);

    return vehicleGroup;
  };

  var createGeneratorTrailer = function(parent) {
    var trailerGroup = new THREE.Group();

    // Trailer bed
    var bedGeom = new THREE.BoxGeometry(3, 1, 2.5);
    var bed = new THREE.Mesh(bedGeom, materials.metalGray);
    bed.position.set(0, 0.8, 0);
    trailerGroup.add(bed);

    // Generator unit (main box)
    var genGeom = new THREE.BoxGeometry(2.5, 1.5, 1.8);
    var gen = new THREE.Mesh(genGeom, materials.metalDark);
    gen.position.set(0, 1.5, 0);
    trailerGroup.add(gen);

    // Exhaust pipe
    var exhaustGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var exhaust = new THREE.Mesh(exhaustGeom, materials.metalDark);
    exhaust.position.set(1.2, 2.8, 0);
    exhaust.rotation.z = 0.2;
    trailerGroup.add(exhaust);

    // Fuel cans on side
    for (var f = 0; f < 3; f++) {
      var canGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
      var can = new THREE.Mesh(canGeom, materials.red);
      can.position.set(-1.2, 0.8 + f * 0.8, -0.8);
      trailerGroup.add(can);
    }

    // Hitch
    var hitchGeom = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    var hitch = new THREE.Mesh(hitchGeom, materials.metalGray);
    hitch.position.set(0, 0.2, -1.3);
    trailerGroup.add(hitch);

    trailerGroup.position.set(12, 0, -18);
    parent.add(trailerGroup);
    return trailerGroup;
  };

  var createPerimeterSandbagRing = function(parent) {
    var ringGroup = new THREE.Group();

    // Create circular sandbag barrier
    var bagGeom = new THREE.BoxGeometry(1.5, 0.6, 0.5);
    var segments = 24;
    var radius = 22;

    for (var i = 0; i < segments; i++) {
      var angle = (i / segments) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var bag = new THREE.Mesh(bagGeom, materials.sandbag);
      bag.position.set(x, 0.3, z);
      bag.rotation.y = angle;
      ringGroup.add(bag);
    }

    parent.add(ringGroup);
    return ringGroup;
  };

  var createGuardPostEntry = function(parent) {
    var entryGroup = new THREE.Group();

    // Barrier gate sections
    var gateGeom = new THREE.BoxGeometry(2, 1.5, 0.3);
    var gate1 = new THREE.Mesh(gateGeom, materials.metalGray);
    gate1.position.set(-1.5, 0.75, 0);
    gate1.rotation.y = 0.3;
    entryGroup.add(gate1);

    var gate2 = new THREE.Mesh(gateGeom, materials.metalGray);
    gate2.position.set(1.5, 0.75, 0);
    gate2.rotation.y = -0.3;
    entryGroup.add(gate2);

    // Guard box
    var boxGeom = new THREE.BoxGeometry(2, 2, 1.5);
    var box = new THREE.Mesh(boxGeom, materials.metalGray);
    box.position.set(0, 1, 3);
    entryGroup.add(box);

    // Window
    var windowGeom = new THREE.BoxGeometry(1.2, 0.8, 0.1);
    var window_ = new THREE.Mesh(windowGeom, materials.metalDark);
    window_.position.set(0, 1.2, 3.8);
    entryGroup.add(window_);

    entryGroup.position.set(0, 0, -25);
    parent.add(entryGroup);
    return entryGroup;
  };

  var createFieldKitchen = function(parent) {
    var kitchenGroup = new THREE.Group();

    // Stove units
    for (var s = 0; s < 2; s++) {
      var stoveGeom = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      var stove = new THREE.Mesh(stoveGeom, materials.metalGray);
      stove.position.set(-2 + s * 4, 0.6, 18);
      kitchenGroup.add(stove);

      // Cooking pot on stove
      var potGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
      var pot = new THREE.Mesh(potGeom, materials.metalDark);
      pot.position.set(-2 + s * 4, 1.5, 18);
      kitchenGroup.add(pot);
    }

    // Food prep counter
    var counterGeom = new THREE.BoxGeometry(5, 0.4, 1.2);
    var counter = new THREE.Mesh(counterGeom, materials.woodBrown);
    counter.position.set(0, 0.8, 19.5);
    kitchenGroup.add(counter);

    parent.add(kitchenGroup);
    return kitchenGroup;
  };

  var createFirstAidStation = function(parent) {
    var aidGroup = new THREE.Group();

    // Medical supply table
    var tableGeom = new THREE.BoxGeometry(2.5, 0.4, 1.5);
    var table = new THREE.Mesh(tableGeom, materials.white);
    table.position.set(0, 1, -20);
    aidGroup.add(table);

    // Table legs
    var legGeom = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    for (var l = 0; l < 4; l++) {
      var leg = new THREE.Mesh(legGeom, materials.metalGray);
      var lx = l < 2 ? -1 : 1;
      var lz = l % 2 === 0 ? -0.6 : 0.6;
      leg.position.set(lx, 0.4, -20 + lz);
      aidGroup.add(leg);
    }

    // Medical supply containers
    for (var m = 0; m < 4; m++) {
      var suppliesGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var supplies = new THREE.Mesh(suppliesGeom, materials.red);
      supplies.position.set(-0.8 + m * 0.6, 1.5, -20);
      aidGroup.add(supplies);
    }

    // Cross symbol on table
    var crossGeom = new THREE.BoxGeometry(0.4, 0.05, 1.2);
    var cross1 = new THREE.Mesh(crossGeom, materials.red);
    cross1.position.set(0, 1.1, -20);
    aidGroup.add(cross1);

    var cross2 = new THREE.Mesh(crossGeom, materials.red);
    cross2.rotation.z = Math.PI / 2;
    cross2.position.set(0, 1.1, -20);
    aidGroup.add(cross2);

    parent.add(aidGroup);
    return aidGroup;
  };

  var createWaterPoint = function(parent) {
    var waterGroup = new THREE.Group();

    // Water buffalo tank
    var tankGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
    var tank = new THREE.Mesh(tankGeom, materials.metalGray);
    tank.position.set(18, 1.2, -5);
    waterGroup.add(tank);

    // Tank support frame
    var supportGeom = new THREE.BoxGeometry(2.5, 0.3, 2.5);
    var support = new THREE.Mesh(supportGeom, materials.metalGray);
    support.position.set(18, 0.15, -5);
    waterGroup.add(support);

    // Spigot
    var spigotGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
    var spigot = new THREE.Mesh(spigotGeom, materials.metalDark);
    spigot.position.set(18.8, 0.4, -5);
    spigot.rotation.z = Math.PI / 4;
    waterGroup.add(spigot);

    parent.add(waterGroup);
    return waterGroup;
  };

  var createNightVisionEquipment = function(parent) {
    var nvGroup = new THREE.Group();

    // Night vision device stands
    for (var n = 0; n < 3; n++) {
      var standGeom = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      var stand = new THREE.Mesh(standGeom, materials.metalDark);
      stand.position.set(-8 + n * 5, 0.6, 15);
      nvGroup.add(stand);

      // Device unit on stand
      var deviceGeom = new THREE.BoxGeometry(0.8, 0.6, 1.2);
      var device = new THREE.Mesh(deviceGeom, materials.metalGray);
      device.position.set(-8 + n * 5, 1.5, 15);
      nvGroup.add(device);

      // Lens
      var lensGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var lens = new THREE.Mesh(lensGeom, materials.metalDark);
      lens.position.set(-8 + n * 5, 1.5, 15.8);
      nvGroup.add(lens);
    }

    parent.add(nvGroup);
    return nvGroup;
  };

  var createSignalFlags = function(parent) {
    var flagGroup = new THREE.Group();

    // Three flagpoles at corners
    for (var f = 0; f < 3; f++) {
      var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
      var pole = new THREE.Mesh(poleGeom, materials.metalDark);
      var px = f === 0 ? -20 : (f === 1 ? 20 : 0);
      var pz = f === 2 ? -20 : 0;
      pole.position.set(px, 2.5, pz);
      flagGroup.add(pole);

      // Flag
      var flagGeom = new THREE.BoxGeometry(2, 1.2, 0.1);
      var flag = new THREE.Mesh(flagGeom, materials.signalYellow);
      flag.position.set(px + 1.2, 4.5, pz);
      flag.rotation.z = 0.2;
      flagGroup.add(flag);
    }

    parent.add(flagGroup);
    return flagGroup;
  };

  var init = function(scene, camera) {
    commandPostGroup = new THREE.Group();

    createMaterials();

    // Build command post
    createCommandTent(commandPostGroup);
    createMapsOperationsTable(commandPostGroup);
    createCommsRacks(commandPostGroup);
    createRadioMast(commandPostGroup);
    createFieldTelephoneSwitchboard(commandPostGroup);
    createIntelligenceBoards(commandPostGroup);
    createBriefingArea(commandPostGroup);
    createVehiclePark(commandPostGroup);
    createGeneratorTrailer(commandPostGroup);
    createPerimeterSandbagRing(commandPostGroup);
    createGuardPostEntry(commandPostGroup);
    createFieldKitchen(commandPostGroup);
    createFirstAidStation(commandPostGroup);
    createWaterPoint(commandPostGroup);
    createNightVisionEquipment(commandPostGroup);
    createSignalFlags(commandPostGroup);

    scene.add(commandPostGroup);

    // Reset animation state
    animationState.radioBeaconTime = 0;
    animationState.commsRackLED = 0;
    animationState.vehicleHeadlightFlicker = 0;
    animationState.perimeterLightSweep = 0;
  };

  var update = function(delta) {
    if (!commandPostGroup) return;

    // Radio mast beacon blink
    animationState.radioBeaconTime += delta;
    var beaconPeriod = 1.2;
    var beaconPhase = animationState.radioBeaconTime % beaconPeriod;
    commandPostGroup.traverse(function(obj) {
      if (obj.userData && obj.userData.isBeacon) {
        var intensity = beaconPhase < 0.5 ? 1.0 : 0.2;
        obj.material.emissive.setHSL(0, 1, intensity * 0.3);
      }
    });

    // Comms rack LED cycling
    animationState.commsRackLED += delta * 2;
    var ledColors = [0x00ff00, 0xffff00, 0xff2020];
    var ledIndex = Math.floor((animationState.commsRackLED % 3));
    var colorPhase = (animationState.commsRackLED % 3) - ledIndex;

    commandPostGroup.traverse(function(obj) {
      if (obj.geometry && obj.geometry.type === 'SphereGeometry') {
        if (obj.position.z < -10 && Math.abs(obj.position.x) < 6) {
          var nextColor = ledColors[(ledIndex + 1) % 3];
          var blend = colorPhase;
          obj.material.color.setHex(ledColors[ledIndex]);
        }
      }
    });

    // Vehicle headlight flicker
    animationState.vehicleHeadlightFlicker += delta * 3;
    var headlightFlicker = Math.sin(animationState.vehicleHeadlightFlicker * Math.PI * 0.7) * 0.5 + 0.5;
    commandPostGroup.traverse(function(obj) {
      if (obj.userData && obj.userData.isHeadlight) {
        obj.material.emissive.setHSL(0.15, 1, headlightFlicker * 0.5);
      }
    });

    // Perimeter light sweep
    animationState.perimeterLightSweep += delta * 0.3;
    var sweepAngle = (animationState.perimeterLightSweep % (Math.PI * 2));
  };

  var reset = function() {
    if (commandPostGroup && commandPostGroup.parent) {
      commandPostGroup.parent.remove(commandPostGroup);
    }
    commandPostGroup = null;
    animationState = {
      radioBeaconTime: 0,
      commsRackLED: 0,
      vehicleHeadlightFlicker: 0,
      perimeterLightSweep: 0
    };
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
