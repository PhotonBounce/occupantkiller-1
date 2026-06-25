window.TacticalHub = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var tacticHubGroup = null;
  var screenMaterials = [];
  var indicatorLights = [];
  var commsArray = null;
  var displayWallScreens = [];
  var droneConsoles = [];
  var overheadLights = [];
  var firstAidLight = null;
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    time = 0;

    if (tacticHubGroup) {
      scene.remove(tacticHubGroup);
    }

    tacticHubGroup = new THREE.Group();
    scene.add(tacticHubGroup);

    // Warehouse Shell
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });

    // Floor
    var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var floor = new THREE.Mesh(floorGeom, floorMaterial);
    floor.position.y = -0.25;
    tacticHubGroup.add(floor);

    // North wall
    var northWallGeom = new THREE.BoxGeometry(80, 12, 0.5);
    var northWall = new THREE.Mesh(northWallGeom, wallMaterial);
    northWall.position.z = -40;
    northWall.position.y = 6;
    tacticHubGroup.add(northWall);

    // South wall
    var southWallGeom = new THREE.BoxGeometry(80, 12, 0.5);
    var southWall = new THREE.Mesh(southWallGeom, wallMaterial);
    southWall.position.z = 40;
    southWall.position.y = 6;
    tacticHubGroup.add(southWall);

    // East wall
    var eastWallGeom = new THREE.BoxGeometry(0.5, 12, 80);
    var eastWall = new THREE.Mesh(eastWallGeom, wallMaterial);
    eastWall.position.x = 40;
    eastWall.position.y = 6;
    tacticHubGroup.add(eastWall);

    // West wall
    var westWallGeom = new THREE.BoxGeometry(0.5, 12, 80);
    var westWall = new THREE.Mesh(westWallGeom, wallMaterial);
    westWall.position.x = -40;
    westWall.position.y = 6;
    tacticHubGroup.add(westWall);

    // Roof
    var roofGeom = new THREE.BoxGeometry(80, 0.5, 80);
    var roof = new THREE.Mesh(roofGeom, roofMaterial);
    roof.position.y = 12;
    tacticHubGroup.add(roof);

    // Tactical Display Wall (North side)
    buildTacticalDisplayWall();

    // Mission Planning Table
    buildMissionPlanningTable();

    // Drone Control Consoles
    buildDroneControlConsoles();

    // Satellite Comms Array on Roof
    buildSatelliteCommsArray();

    // Power Generator Corner
    buildPowerGenerator();

    // Briefing Area
    buildBriefingArea();

    // Supply Staging Area
    buildSupplyStaging();

    // Defensive Sandbag Perimeter
    buildSandbagPerimeter();

    // Guard Post Kiosks
    buildGuardPostKiosks();

    // Vehicle Bay with HMMWVs
    buildVehicleBay();

    // Whiteboard Walls
    buildWhiteboardWalls();

    // Overhead Lighting Strips
    buildOverheadLighting();

    // First Aid Station
    buildFirstAidStation();

    // Communications Rack
    buildCommunicationsRack();

    // Cable Management Floor Trays
    buildCableManagement();
  }

  function buildTacticalDisplayWall() {
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.5 });
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.3,
      roughness: 0.1
    });

    // Wall backing
    var backingGeom = new THREE.BoxGeometry(28, 8, 0.5);
    var backing = new THREE.Mesh(backingGeom, wallMaterial);
    backing.position.set(-25, 6, -39.75);
    tacticHubGroup.add(backing);

    // Tactical display screens (3x2 grid)
    var screenWidth = 4;
    var screenHeight = 3;
    var screenDepth = 0.2;
    var spacing = 0.5;

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var screenGeom = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth);
        var screenMat = screenMaterial.clone();
        screenMaterials.push(screenMat);
        var screen = new THREE.Mesh(screenGeom, screenMat);

        var xPos = -25 + (i * (screenWidth + spacing)) - screenWidth;
        var yPos = 8 + (1 - j) * (screenHeight + spacing) - screenHeight / 2;
        screen.position.set(xPos, yPos, -39);

        displayWallScreens.push(screen);
        tacticHubGroup.add(screen);

        // Indicator lights on each screen
        var lightGeom = new THREE.SphereGeometry(0.3, 8, 8);
        var lightMat = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          emissive: 0xff0000,
          emissiveIntensity: 0.5
        });
        var light = new THREE.Mesh(lightGeom, lightMat);
        light.position.set(xPos + 1.5, yPos + 1.2, -38);
        indicatorLights.push({ mesh: light, material: lightMat, phase: i * 0.5 + j * 0.3 });
        tacticHubGroup.add(light);
      }
    }
  }

  function buildMissionPlanningTable() {
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });
    var topMaterial = new THREE.MeshStandardMaterial({ color: 0xccccaa, roughness: 0.4 });

    // Table base
    var baseGeom = new THREE.BoxGeometry(12, 0.8, 12);
    var base = new THREE.Mesh(baseGeom, tableMaterial);
    base.position.set(0, 1.2, 0);
    tacticHubGroup.add(base);

    // Table top (with map surface)
    var topGeom = new THREE.BoxGeometry(12, 0.3, 12);
    var top = new THREE.Mesh(topGeom, topMaterial);
    top.position.set(0, 2, 0);
    tacticHubGroup.add(top);

    // Overhead lamp
    var lampPoleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
    var lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    var lampPole = new THREE.Mesh(lampPoleGeom, lampPoleMat);
    lampPole.position.set(0, 3.5, 0);
    tacticHubGroup.add(lampPole);

    // Lamp head
    var lampHeadGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
    var lampHeadMat = new THREE.MeshStandardMaterial({
      color: 0xffff99,
      emissive: 0xffff99,
      emissiveIntensity: 0.4
    });
    var lampHead = new THREE.Mesh(lampHeadGeom, lampHeadMat);
    lampHead.position.set(0, 5, 0);
    overheadLights.push({ mesh: lampHead, material: lampHeadMat });
    tacticHubGroup.add(lampHead);
  }

  function buildDroneControlConsoles() {
    var consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.6 });
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.3,
      roughness: 0.1
    });

    var positions = [
      { x: -15, z: 10 },
      { x: -15, z: 20 },
      { x: 15, z: 10 },
      { x: 15, z: 20 }
    ];

    positions.forEach(function(pos) {
      // Desk
      var deskGeom = new THREE.BoxGeometry(3, 0.8, 2);
      var desk = new THREE.Mesh(deskGeom, consoleMaterial);
      desk.position.set(pos.x, 1.2, pos.z);
      tacticHubGroup.add(desk);

      // Screen on desk
      var screenGeom = new THREE.BoxGeometry(2.5, 2, 0.2);
      var screenMatClone = screenMat.clone();
      screenMaterials.push(screenMatClone);
      var screen = new THREE.Mesh(screenGeom, screenMatClone);
      screen.position.set(pos.x, 3.5, pos.z);
      droneConsoles.push(screen);
      tacticHubGroup.add(screen);

      // Keyboard area
      var keyboardGeom = new THREE.BoxGeometry(2.5, 0.3, 1.5);
      var keyboardMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
      var keyboard = new THREE.Mesh(keyboardGeom, keyboardMat);
      keyboard.position.set(pos.x, 1.4, pos.z + 1.2);
      tacticHubGroup.add(keyboard);
    });
  }

  function buildSatelliteCommsArray() {
    var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.3, metalness: 0.8 });
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });

    // Mast
    var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 16);
    var mast = new THREE.Mesh(mastGeom, mastMaterial);
    mast.position.set(-30, 12.5, -30);
    tacticHubGroup.add(mast);

    // Dish mount
    var mountGeom = new THREE.BoxGeometry(3, 0.3, 3);
    var mount = new THREE.Mesh(mountGeom, mastMaterial);
    mount.position.set(-30, 14.5, -30);
    tacticHubGroup.add(mount);

    // Dish (curved surface approximated with 2 box)
    var dishGeom = new THREE.BoxGeometry(3.5, 0.5, 3.5);
    var dish = new THREE.Mesh(dishGeom, dishMaterial);
    dish.position.set(-30, 15.2, -30);
    dish.rotation.x = 0.3;
    commsArray = dish;
    tacticHubGroup.add(dish);

    // Dish rotation mechanism (added object for reference)
    var mechGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 16);
    var mech = new THREE.Mesh(mechGeom, mastMaterial);
    mech.position.set(-30, 15.8, -30);
    tacticHubGroup.add(mech);
  }

  function buildPowerGenerator() {
    var genMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // Generator body
    var bodyGeom = new THREE.BoxGeometry(2.5, 1.5, 2.5);
    var body = new THREE.Mesh(bodyGeom, genMaterial);
    body.position.set(35, 1.2, -35);
    tacticHubGroup.add(body);

    // Exhaust pipe
    var exhaustGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    var exhaust = new THREE.Mesh(exhaustGeom, exhaustMaterial);
    exhaust.position.set(35, 2.5, -35);
    tacticHubGroup.add(exhaust);

    // Fuel tank
    var tankGeom = new THREE.BoxGeometry(1.5, 1, 1.5);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.7 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(37, 0.8, -35);
    tacticHubGroup.add(tank);
  }

  function buildBriefingArea() {
    var chairMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var podiumMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.5 });

    // Seating arrangement (semi-circle)
    var chairPositions = [
      { x: -8, z: -25 },
      { x: -4, z: -26 },
      { x: 0, z: -26.5 },
      { x: 4, z: -26 },
      { x: 8, z: -25 },
      { x: -8, z: -20 },
      { x: 8, z: -20 }
    ];

    chairPositions.forEach(function(pos) {
      var chairGeom = new THREE.BoxGeometry(0.8, 1, 0.8);
      var chair = new THREE.Mesh(chairGeom, chairMaterial);
      chair.position.set(pos.x, 0.8, pos.z);
      tacticHubGroup.add(chair);
    });

    // Podium
    var podiumBaseGeom = new THREE.BoxGeometry(2, 1, 1.5);
    var podiumBase = new THREE.Mesh(podiumBaseGeom, podiumMaterial);
    podiumBase.position.set(0, 0.8, -15);
    tacticHubGroup.add(podiumBase);

    // Podium top
    var podiumTopGeom = new THREE.BoxGeometry(2.2, 0.3, 1.7);
    var podiumTop = new THREE.Mesh(podiumTopGeom, podiumMaterial);
    podiumTop.position.set(0, 1.8, -15);
    tacticHubGroup.add(podiumTop);
  }

  function buildSupplyStaging() {
    var palletMaterial = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 });
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 });

    // Pallets with crates
    var palletPositions = [
      { x: -28, z: -15 },
      { x: -28, z: -8 },
      { x: -22, z: -15 },
      { x: -22, z: -8 }
    ];

    palletPositions.forEach(function(pos) {
      // Pallet
      var palletGeom = new THREE.BoxGeometry(2, 0.4, 2);
      var pallet = new THREE.Mesh(palletGeom, palletMaterial);
      pallet.position.set(pos.x, 0.3, pos.z);
      tacticHubGroup.add(pallet);

      // Crate stack
      var crateGeom = new THREE.BoxGeometry(1.8, 1.5, 1.8);
      var crate = new THREE.Mesh(crateGeom, crateMaterial);
      crate.position.set(pos.x, 1.4, pos.z);
      tacticHubGroup.add(crate);

      // Second crate
      var crate2 = new THREE.Mesh(crateGeom, crateMaterial);
      crate2.position.set(pos.x, 3, pos.z);
      tacticHubGroup.add(crate2);
    });
  }

  function buildSandbagPerimeter() {
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0xa0826d, roughness: 0.9 });

    // Defensive positions at corners
    var corners = [
      { x: -35, z: -35 },
      { x: 35, z: -35 },
      { x: -35, z: 35 },
      { x: 35, z: 35 }
    ];

    corners.forEach(function(corner) {
      for (var i = 0; i < 4; i++) {
        var bagGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        var bag = new THREE.Mesh(bagGeom, sandbagMaterial);
        bag.position.set(corner.x + i * 0.9, 0.6, corner.z);
        tacticHubGroup.add(bag);
      }
    });
  }

  function buildGuardPostKiosks() {
    var kioskMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.6 });
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 0.25,
      roughness: 0.1
    });

    var kioskPositions = [
      { x: -38, z: 0 },
      { x: 38, z: 0 }
    ];

    kioskPositions.forEach(function(pos) {
      var baseGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var base = new THREE.Mesh(baseGeom, kioskMaterial);
      base.position.set(pos.x, 0.8, pos.z);
      tacticHubGroup.add(base);

      // Monitor
      var monitorGeom = new THREE.BoxGeometry(1, 1.2, 0.2);
      var screenMatClone = screenMat.clone();
      screenMaterials.push(screenMatClone);
      var monitor = new THREE.Mesh(monitorGeom, screenMatClone);
      monitor.position.set(pos.x, 1.8, pos.z);
      tacticHubGroup.add(monitor);
    });
  }

  function buildVehicleBay() {
    var vehicleMaterial = new THREE.MeshStandardMaterial({ color: 0x556633, roughness: 0.7 });
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.3, roughness: 0.1 });

    // Vehicle positions
    var vehiclePositions = [
      { x: -15, z: 30 },
      { x: 0, z: 30 },
      { x: 15, z: 30 }
    ];

    vehiclePositions.forEach(function(pos) {
      // Vehicle body (HMMWV approximation)
      var bodyGeom = new THREE.BoxGeometry(2, 1.8, 4);
      var body = new THREE.Mesh(bodyGeom, vehicleMaterial);
      body.position.set(pos.x, 1, pos.z);
      tacticHubGroup.add(body);

      // Cabin section
      var cabinGeom = new THREE.BoxGeometry(1.8, 1.2, 1.5);
      var cabin = new THREE.Mesh(cabinGeom, vehicleMaterial);
      cabin.position.set(pos.x, 1.5, pos.z - 0.8);
      tacticHubGroup.add(cabin);

      // Windows
      var windowGeom = new THREE.BoxGeometry(1.4, 0.6, 0.2);
      var window1 = new THREE.Mesh(windowGeom, windowMaterial);
      window1.position.set(pos.x, 1.5, pos.z - 1.2);
      tacticHubGroup.add(window1);
    });
  }

  function buildWhiteboardWalls() {
    var boardMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.5 });

    // East wall boards
    var boardGeom = new THREE.BoxGeometry(6, 3, 0.1);
    var positions = [
      { x: 39.75, z: -15 },
      { x: 39.75, z: 5 },
      { x: 39.75, z: 25 }
    ];

    positions.forEach(function(pos) {
      var board = new THREE.Mesh(boardGeom, boardMaterial);
      board.position.set(pos.x, 5.5, pos.z);
      tacticHubGroup.add(board);
    });
  }

  function buildOverheadLighting() {
    var stripMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });

    // Lighting strips
    var stripPositions = [
      { x: -20, z: 0 },
      { x: 0, z: 0 },
      { x: 20, z: 0 },
      { x: -20, z: 20 },
      { x: 0, z: 20 },
      { x: 20, z: 20 },
      { x: -20, z: -20 },
      { x: 0, z: -20 },
      { x: 20, z: -20 }
    ];

    stripPositions.forEach(function(pos) {
      var stripGeom = new THREE.BoxGeometry(3, 0.2, 0.2);
      var strip = new THREE.Mesh(stripGeom, stripMaterial);
      strip.position.set(pos.x, 11, pos.z);
      overheadLights.push({ mesh: strip, material: stripMaterial });
      tacticHubGroup.add(strip);
    });
  }

  function buildFirstAidStation() {
    var cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.6 });
    var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Cabinet
    var cabinetGeom = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    var cabinet = new THREE.Mesh(cabinetGeom, cabinetMaterial);
    cabinet.position.set(32, 1.5, 10);
    tacticHubGroup.add(cabinet);

    // Support pole
    var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.2, 16);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(32, 1.8, 10);
    tacticHubGroup.add(pole);

    // Red cross indicator
    var crossGeom = new THREE.SphereGeometry(0.4, 16, 16);
    var cross = new THREE.Mesh(crossGeom, crossMaterial);
    cross.position.set(32, 2.8, 10);
    firstAidLight = cross;
    tacticHubGroup.add(cross);
  }

  function buildCommunicationsRack() {
    var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    var indicatorMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.4 });

    // Rack frame
    var rackGeom = new THREE.BoxGeometry(1.5, 5, 1.5);
    var rack = new THREE.Mesh(rackGeom, rackMaterial);
    rack.position.set(-32, 2.8, 25);
    tacticHubGroup.add(rack);

    // Equipment modules
    for (var i = 0; i < 6; i++) {
      var moduleGeom = new THREE.BoxGeometry(1.3, 0.6, 1.3);
      var moduleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
      var module = new THREE.Mesh(moduleGeom, moduleMat);
      module.position.set(-32, 0.5 + i * 0.8, 25);
      tacticHubGroup.add(module);

      // Status indicators
      var indicatorGeom = new THREE.SphereGeometry(0.15, 8, 8);
      var indicator = new THREE.Mesh(indicatorGeom, indicatorMat);
      indicator.position.set(-31, 0.7 + i * 0.8, 25);
      indicatorLights.push({ mesh: indicator, material: indicatorMat, phase: i * 0.3 });
      tacticHubGroup.add(indicator);
    }
  }

  function buildCableManagement() {
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });

    // Cable runs
    var runPositions = [
      [new THREE.Vector3(-20, 0.1, 0), new THREE.Vector3(-20, 0.1, 20)],
      [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0, 0.1, 20)],
      [new THREE.Vector3(20, 0.1, 0), new THREE.Vector3(20, 0.1, 20)],
      [new THREE.Vector3(-20, 0.1, -20), new THREE.Vector3(20, 0.1, -20)]
    ];

    runPositions.forEach(function(positions) {
      var geometry = new THREE.BufferGeometry();
      geometry.setFromPoints(positions);
      var line = new THREE.LineSegments(geometry, cableMaterial);
      tacticHubGroup.add(line);
    });
  }

  function update(delta) {
    time += delta;

    // Pulsing tactical display screens
    screenMaterials.forEach(function(material) {
      var pulse = 0.2 + 0.2 * Math.sin(time * 2);
      material.emissiveIntensity = pulse;
    });

    // Rotating roof comms dish
    if (commsArray) {
      commsArray.rotation.y += delta * 0.3;
    }

    // Indicator light sequences
    indicatorLights.forEach(function(light) {
      var intensity = 0.3 + 0.4 * Math.sin(time * 3 + light.phase);
      light.material.emissiveIntensity = intensity;
    });

    // Overhead light pulsing
    overheadLights.forEach(function(light, index) {
      var pulse = 0.4 + 0.3 * Math.sin(time * 1.5 + index * 0.5);
      light.material.emissiveIntensity = pulse;
    });

    // First aid light gentle pulse
    if (firstAidLight && firstAidLight.material) {
      var pulse = 0.5 + 0.3 * Math.sin(time * 2.5);
      firstAidLight.material.emissiveIntensity = pulse;
    }

    // Drone console screen animation
    droneConsoles.forEach(function(console, index) {
      if (console.material) {
        var pulse = 0.25 + 0.25 * Math.sin(time * 2.5 + index);
        console.material.emissiveIntensity = pulse;
      }
    });
  }

  function reset() {
    time = 0;
    screenMaterials = [];
    indicatorLights = [];
    displayWallScreens = [];
    droneConsoles = [];
    overheadLights = [];
    firstAidLight = null;
    commsArray = null;

    if (tacticHubGroup && scene) {
      scene.remove(tacticHubGroup);
      tacticHubGroup = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
