window.SatelliteBase = (function() {
  'use strict';

  var state = {
    mainBuilding: null,
    dishes: [],
    uplinkTower: null,
    signalRoom: null,
    vault: null,
    satelliteDisplay: null,
    radarDomes: [],
    generators: [],
    fence: null,
    weatherStation: null,
    siloCovers: [],
    quarters: null,
    briefingTheater: null,
    group: null,
    spawnPoints: [],
    time: 0
  };

  function init(scene, camera) {
    state.group = new THREE.Group();
    scene.add(state.group);

    var baseY = 0;
    var facilityX = 0;
    var facilityZ = 0;

    // Main operations building - large gray facility
    var mainBuildingGeom = new THREE.BoxGeometry(80, 45, 100);
    var mainBuildingMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.3, roughness: 0.7 });
    state.mainBuilding = new THREE.Mesh(mainBuildingGeom, mainBuildingMat);
    state.mainBuilding.position.set(facilityX, baseY + 22.5, facilityZ);
    state.group.add(state.mainBuilding);

    // Roof antenna arrays on main building
    for (var i = 0; i < 4; i++) {
      var antGeom = new THREE.BoxGeometry(6, 15, 4);
      var antMat = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.8, roughness: 0.3 });
      var antenna = new THREE.Mesh(antGeom, antMat);
      antenna.position.set(
        facilityX - 30 + i * 20,
        baseY + 48,
        facilityZ + 35
      );
      state.group.add(antenna);
    }

    // Dish array field - 5 large satellite dishes
    var dishFieldX = -150;
    var dishFieldZ = 80;
    for (var d = 0; d < 5; d++) {
      var dishSize = 25 + d * 3;
      var dishX = dishFieldX + d * 60;
      var dishZ = dishFieldZ + Math.sin(d * 0.8) * 40;

      // Dish base cylinder
      var baseGeom = new THREE.CylinderGeometry(8, 10, 4, 32);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.4, roughness: 0.6 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.set(dishX, baseY + 2, dishZ);
      state.group.add(base);

      // Dish support arm
      var armGeom = new THREE.BoxGeometry(4, 25, 4);
      var armMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.5 });
      var arm = new THREE.Mesh(armGeom, armMat);
      arm.position.set(dishX, baseY + 15, dishZ);
      state.group.add(arm);

      // Dish panels (using box geometry for flat surface)
      var panelGeom = new THREE.BoxGeometry(dishSize, dishSize * 0.7, 2);
      var panelMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 });
      var panel = new THREE.Mesh(panelGeom, panelMat);
      panel.position.set(dishX, baseY + 30, dishZ);
      panel.rotation.x = -0.3 + d * 0.1;
      state.group.add(panel);

      state.dishes.push({
        base: base,
        arm: arm,
        panel: panel,
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.3
      });
    }

    // Uplink tower - steel lattice frame with transmitter
    var towerX = 120;
    var towerZ = -80;

    // Tower base
    var towerBaseGeom = new THREE.BoxGeometry(12, 8, 12);
    var towerBaseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
    var towerBase = new THREE.Mesh(towerBaseGeom, towerBaseMat);
    towerBase.position.set(towerX, baseY + 4, towerZ);
    state.group.add(towerBase);

    // Tower structure - vertical columns
    var latticeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
    for (var c = 0; c < 4; c++) {
      var colGeom = new THREE.BoxGeometry(2, 120, 2);
      var col = new THREE.Mesh(colGeom, latticeMat);
      col.position.set(
        towerX - 4 + (c % 2) * 8,
        baseY + 65,
        towerZ - 4 + Math.floor(c / 2) * 8
      );
      state.group.add(col);
    }

    // Transmitter on tower top
    var transmitterGeom = new THREE.CylinderGeometry(6, 6, 20, 32);
    var transmitterMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });
    var transmitter = new THREE.Mesh(transmitterGeom, transmitterMat);
    transmitter.position.set(towerX, baseY + 135, towerZ);
    state.group.add(transmitter);

    state.uplinkTower = {
      base: towerBase,
      transmitter: transmitter,
      angle: 0,
      pulseIntensity: 0
    };

    // Signal analysis room - white box with blue monitors
    var signalX = 40;
    var signalZ = -120;
    var roomGeom = new THREE.BoxGeometry(60, 35, 45);
    var roomMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 0.2, roughness: 0.8 });
    var room = new THREE.Mesh(roomGeom, roomMat);
    room.position.set(signalX, baseY + 17.5, signalZ);
    state.group.add(room);

    // Monitor screens on wall
    var monitorMat = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0055aa, metalness: 0.1, roughness: 0.9 });
    for (var m = 0; m < 6; m++) {
      var screenGeom = new THREE.BoxGeometry(14, 20, 1);
      var screen = new THREE.Mesh(screenGeom, monitorMat);
      screen.position.set(
        signalX - 20 + (m % 3) * 20,
        baseY + 15 + Math.floor(m / 3) * 22,
        signalZ + 22.5
      );
      state.group.add(screen);
    }

    // Cable arrays with LineSegments
    var cableMat = new THREE.LineBasicMaterial({ color: 0x0088ff, linewidth: 2 });
    for (var cb = 0; cb < 3; cb++) {
      var cablePoints = [];
      cablePoints.push(new THREE.Vector3(signalX - 25, baseY + 5, signalZ + 20 + cb * 5));
      cablePoints.push(new THREE.Vector3(signalX + 25, baseY + 25, signalZ + 20 + cb * 5));
      var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
      var cables = new THREE.LineSegments(cableGeom, cableMat);
      state.group.add(cables);
    }

    state.signalRoom = {
      room: room,
      screens: [],
      cycleState: 0
    };

    // Communication vault - white box with heavy red door
    var vaultX = -80;
    var vaultZ = 30;
    var vaultGeom = new THREE.BoxGeometry(40, 40, 35);
    var vaultMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.3, roughness: 0.7 });
    var vaultBody = new THREE.Mesh(vaultGeom, vaultMat);
    vaultBody.position.set(vaultX, baseY + 20, vaultZ);
    state.group.add(vaultBody);

    // Heavy classified door
    var doorGeom = new THREE.BoxGeometry(18, 35, 3);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.6, roughness: 0.4 });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(vaultX + 11, baseY + 20, vaultZ + 17.5);
    state.group.add(door);

    // Server racks inside vault representation
    for (var sr = 0; sr < 3; sr++) {
      var rackGeom = new THREE.BoxGeometry(8, 28, 6);
      var rackMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.4, roughness: 0.6 });
      var rack = new THREE.Mesh(rackGeom, rackMat);
      rack.position.set(vaultX - 12 + sr * 10, baseY + 20, vaultZ - 10);
      state.group.add(rack);
    }

    state.vault = {
      body: vaultBody,
      door: door,
      angle: 0
    };

    // Satellite model display - solar panels + cylinder body
    var satDispX = 60;
    var satDispZ = 60;
    var satBodyGeom = new THREE.CylinderGeometry(6, 6, 18, 32);
    var satBodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    var satBody = new THREE.Mesh(satBodyGeom, satBodyMat);
    satBody.position.set(satDispX, baseY + 25, satDispZ);
    state.group.add(satBody);

    // Solar panels
    var panelMat2 = new THREE.MeshStandardMaterial({ color: 0x0066ff, metalness: 0.8, roughness: 0.2 });
    for (var sp = 0; sp < 2; sp++) {
      var solPanelGeom = new THREE.BoxGeometry(12, 3, 18);
      var solPanel = new THREE.Mesh(solPanelGeom, panelMat2);
      solPanel.position.set(satDispX - 8 + sp * 16, baseY + 25, satDispZ);
      solPanel.rotation.z = 0.3;
      state.group.add(solPanel);
    }

    state.satelliteDisplay = {
      body: satBody,
      angle: 0
    };

    // Radar warning receivers - cyan domes on facility roof
    var radarMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, metalness: 0.5, roughness: 0.5 });
    for (var r = 0; r < 3; r++) {
      var radarGeom = new THREE.CylinderGeometry(7, 7, 3, 32);
      var radar = new THREE.Mesh(radarGeom, radarMat);
      radar.position.set(
        facilityX - 20 + r * 20,
        baseY + 50,
        facilityZ - 40
      );
      state.group.add(radar);
      state.radarDomes.push({
        dome: radar,
        angle: Math.random() * Math.PI * 2
      });
    }

    // Generator compound
    var genX = -120;
    var genZ = -60;
    for (var g = 0; g < 2; g++) {
      var genGeom = new THREE.BoxGeometry(30, 30, 25);
      var genMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.4, roughness: 0.6 });
      var gen = new THREE.Mesh(genGeom, genMat);
      gen.position.set(genX + g * 40, baseY + 15, genZ);
      state.group.add(gen);

      // Exhaust cylinder
      var exhaustGeom = new THREE.CylinderGeometry(4, 4, 25, 32);
      var exhaustMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.3, roughness: 0.7 });
      var exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
      exhaust.position.set(genX + 5 + g * 40, baseY + 22.5, genZ);
      state.group.add(exhaust);

      state.generators.push({
        body: gen,
        exhaust: exhaust,
        vibration: 0
      });
    }

    // Security perimeter fence (simplified)
    var fencePoints = [
      new THREE.Vector3(-200, baseY + 8, -150),
      new THREE.Vector3(200, baseY + 8, -150),
      new THREE.Vector3(200, baseY + 8, 150),
      new THREE.Vector3(-200, baseY + 8, 150),
      new THREE.Vector3(-200, baseY + 8, -150)
    ];
    var fenceMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 3 });
    var fenceGeom = new THREE.BufferGeometry().setFromPoints(fencePoints);
    var fence = new THREE.LineSegments(fenceGeom, fenceMat);
    state.group.add(fence);

    // Fence posts
    for (var fp = 0; fp < 12; fp++) {
      var angle = (fp / 12) * Math.PI * 2;
      var px = Math.cos(angle) * 200;
      var pz = Math.sin(angle) * 150;
      var postGeom = new THREE.CylinderGeometry(2, 2, 16, 16);
      var postMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(px, baseY + 8, pz);
      state.group.add(post);
    }

    state.fence = fence;

    // Weather monitoring station
    var weatherX = -140;
    var weatherZ = 120;
    var weatherMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.4, roughness: 0.6 });

    // Main mast
    var mastGeom = new THREE.CylinderGeometry(2, 2, 40, 16);
    var mast = new THREE.Mesh(mastGeom, weatherMat);
    mast.position.set(weatherX, baseY + 20, weatherZ);
    state.group.add(mast);

    // Instruments on mast
    for (var wi = 0; wi < 4; wi++) {
      var instGeom = new THREE.BoxGeometry(6, 6, 6);
      var inst = new THREE.Mesh(instGeom, weatherMat);
      inst.position.set(weatherX + 8, baseY + 10 + wi * 8, weatherZ);
      state.group.add(inst);
    }

    state.weatherStation = {
      mast: mast,
      angle: 0
    };

    // Anti-satellite weapon silo cover
    var siloX = 140;
    var siloZ = 80;
    var siloBaseGeom = new THREE.BoxGeometry(50, 8, 50);
    var siloBaseMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
    var siloBase = new THREE.Mesh(siloBaseGeom, siloBaseMat);
    siloBase.position.set(siloX, baseY + 4, siloZ);
    state.group.add(siloBase);

    // Retractable panel covers
    for (var sp2 = 0; sp2 < 2; sp2++) {
      var panelGeom2 = new THREE.BoxGeometry(24, 15, 20);
      var panelMat2 = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.6, roughness: 0.4 });
      var panel2 = new THREE.Mesh(panelGeom2, panelMat2);
      panel2.position.set(siloX - 15 + sp2 * 30, baseY + 12, siloZ);
      state.group.add(panel2);
      state.siloCovers.push({
        panel: panel2,
        openState: 0
      });
    }

    // Personnel quarters - dormitory
    var quartersX = 100;
    var quartersZ = -100;
    var quartersGeom = new THREE.BoxGeometry(70, 30, 50);
    var quartersMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.2, roughness: 0.8 });
    var quarters = new THREE.Mesh(quartersGeom, quartersMat);
    quarters.position.set(quartersX, baseY + 15, quartersZ);
    state.group.add(quarters);

    // Windows on quarters
    var windowMat = new THREE.MeshStandardMaterial({ color: 0xffff99, emissive: 0xffaa00, metalness: 0.1, roughness: 0.9 });
    for (var qw = 0; qw < 8; qw++) {
      var windowGeom = new THREE.BoxGeometry(8, 10, 1);
      var window = new THREE.Mesh(windowGeom, windowMat);
      window.position.set(
        quartersX - 25 + (qw % 4) * 16,
        baseY + 10 + Math.floor(qw / 4) * 15,
        quartersZ + 25
      );
      state.group.add(window);
    }

    state.quarters = quarters;

    // Briefing theater - tiered seating structure
    var briefX = -60;
    var briefZ = -40;
    var briefMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.2, roughness: 0.8 });

    // Main theater box
    var briefGeom = new THREE.BoxGeometry(50, 35, 55);
    var briefRoom = new THREE.Mesh(briefGeom, briefMat);
    briefRoom.position.set(briefX, baseY + 17.5, briefZ);
    state.group.add(briefRoom);

    // Tiered seating representation
    for (var ts = 0; ts < 3; ts++) {
      var seatGeom = new THREE.BoxGeometry(45, 8, 15);
      var seat = new THREE.Mesh(seatGeom, briefMat);
      seat.position.set(briefX, baseY + 5 + ts * 10, briefZ - 15 + ts * 10);
      state.group.add(seat);
    }

    // Screen at front
    var screenGeom2 = new THREE.BoxGeometry(40, 18, 2);
    var screenMat2 = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x333333, metalness: 0.2, roughness: 0.9 });
    var screen2 = new THREE.Mesh(screenGeom2, screenMat2);
    screen2.position.set(briefX, baseY + 25, briefZ + 27);
    state.group.add(screen2);

    state.briefingTheater = briefRoom;

    // Define spawn points
    state.spawnPoints = [
      { pos: new THREE.Vector3(0, baseY + 35, -80), dir: new THREE.Vector3(0, 0, 1) },  // entrance near operations
      { pos: new THREE.Vector3(-150, baseY + 35, 80), dir: new THREE.Vector3(1, 0, 0) }, // dish array
      { pos: new THREE.Vector3(120, baseY + 140, -80), dir: new THREE.Vector3(0, -1, 0) }, // uplink tower top
      { pos: new THREE.Vector3(-80, baseY + 35, 30), dir: new THREE.Vector3(1, 0, 0) },  // vault
      { pos: new THREE.Vector3(40, baseY + 35, -120), dir: new THREE.Vector3(0, 0, 1) }  // signal room
    ];

    state.time = 0;
  }

  function update(delta) {
    if (!state.group) return;

    state.time += delta;

    // Dish tracking and rotation
    for (var i = 0; i < state.dishes.length; i++) {
      var dish = state.dishes[i];
      dish.angle += dish.speed * delta;
      dish.panel.rotation.y = dish.angle;
      dish.arm.rotation.z = Math.sin(state.time * 0.5 + i) * 0.2 - 0.3;
    }

    // Uplink tower signal pulsing
    if (state.uplinkTower) {
      state.uplinkTower.pulseIntensity = Math.abs(Math.sin(state.time * 2)) * 0.5;
      state.uplinkTower.transmitter.scale.z = 1 + state.uplinkTower.pulseIntensity * 0.3;
    }

    // Radar domes rotating
    for (var r = 0; r < state.radarDomes.length; r++) {
      var radar = state.radarDomes[r];
      radar.angle += 0.5 * delta;
      radar.dome.rotation.y = radar.angle;
    }

    // Satellite display rotation
    if (state.satelliteDisplay) {
      state.satelliteDisplay.angle += 0.8 * delta;
      state.satelliteDisplay.body.rotation.y = state.satelliteDisplay.angle;
    }

    // Generator vibration
    for (var g = 0; g < state.generators.length; g++) {
      var gen = state.generators[g];
      gen.vibration = Math.sin(state.time * 8) * 0.08;
      gen.body.position.y += gen.vibration;
      gen.exhaust.rotation.z += 0.3 * delta;
    }

    // Anti-sat silo panels opening/closing
    for (var s = 0; s < state.siloCovers.length; s++) {
      var silo = state.siloCovers[s];
      var openAmount = Math.abs(Math.sin(state.time * 0.3)) * 0.5;
      silo.panel.position.y = 12 + openAmount * 10 * (s === 0 ? 1 : -1);
    }

    // Weather station rotation
    if (state.weatherStation) {
      state.weatherStation.angle += 0.3 * delta;
      state.weatherStation.mast.rotation.z = Math.sin(state.time * 0.4) * 0.1;
    }

    // Signal room data cycling
    if (state.signalRoom) {
      state.signalRoom.cycleState = (state.signalRoom.cycleState + delta * 0.5) % 3;
    }

    // Vault door slight movement
    if (state.vault) {
      state.vault.door.rotation.z = Math.sin(state.time * 0.2) * 0.05;
    }
  }

  function reset() {
    if (state.group) {
      while (state.group.children.length > 0) {
        state.group.remove(state.group.children[0]);
      }
    }
    state.mainBuilding = null;
    state.dishes = [];
    state.uplinkTower = null;
    state.signalRoom = null;
    state.vault = null;
    state.satelliteDisplay = null;
    state.radarDomes = [];
    state.generators = [];
    state.fence = null;
    state.weatherStation = null;
    state.siloCovers = [];
    state.quarters = null;
    state.briefingTheater = null;
    state.spawnPoints = [];
    state.time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
