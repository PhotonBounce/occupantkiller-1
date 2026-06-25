window.ChemLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var guards = [];
  var vessels = [];
  var barrels = [];
  var fans = [];
  var lights = [];
  var alarmActive = false;
  var alarmIntensity = 0;
  var gasVents = [];
  var computerScreens = [];

  var COLORS = {
    labWhite: 0xF8F8F8,
    chemYellow: 0xCCCC00,
    hazmatOrange: 0xFF6600,
    steel: 0x778899,
    dangerRed: 0xFF2200,
    toxicGreen: 0x44CC44,
    darkGray: 0x333333,
    lightGray: 0xCCCCCC,
    black: 0x000000,
    blue: 0x0066FF
  };

  var SPAWN_POINTS = [
    { pos: new THREE.Vector3(-30, 1.5, 0), name: 'corridor_junction_1' },
    { pos: new THREE.Vector3(30, 1.5, 0), name: 'reaction_room' },
    { pos: new THREE.Vector3(0, 1.5, -40), name: 'storage_room' },
    { pos: new THREE.Vector3(0, 1.5, 40), name: 'airlock_entry' },
    { pos: new THREE.Vector3(-20, 1.5, 20), name: 'control_room' }
  ];

  function init(s, c) {
    scene = s;
    camera = c;
    meshes = [];
    guards = [];
    vessels = [];
    barrels = [];
    fans = [];
    lights = [];
    gasVents = [];
    computerScreens = [];
    alarmActive = false;
    alarmIntensity = 0;

    buildLabStructure();
    buildCorridors();
    buildFumeHoods();
    buildReactionVessels();
    buildStorageRoom();
    buildVentilationSystem();
    buildAirlockEntry();
    buildComputerStations();
    buildAutoclave();
    buildEmergencyShower();
    buildBiohazardContainers();
    buildPowerPanel();
    buildCentrifuges();
    buildLighting();
    spawnGuards();
  }

  function buildLabStructure() {
    var floorGeo = new THREE.BoxGeometry(100, 0.5, 100);
    var floorMat = new THREE.MeshStandardMaterial({ color: COLORS.labWhite });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.push(floor);

    var ceilingGeo = new THREE.BoxGeometry(100, 0.5, 100);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 8;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    meshes.push(ceiling);

    var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 0.5), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    wallNorth.position.set(0, 4, -50);
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    meshes.push(wallNorth);

    var wallSouth = new THREE.Mesh(new THREE.BoxGeometry(100, 8, 0.5), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    wallSouth.position.set(0, 4, 50);
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    meshes.push(wallSouth);

    var wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 100), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    wallWest.position.set(-50, 4, 0);
    wallWest.receiveShadow = true;
    scene.add(wallWest);
    meshes.push(wallWest);

    var wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 100), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    wallEast.position.set(50, 4, 0);
    wallEast.receiveShadow = true;
    scene.add(wallEast);
    meshes.push(wallEast);
  }

  function buildCorridors() {
    var corridor1 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.01, 8), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    corridor1.position.set(0, 0.5, 0);
    corridor1.receiveShadow = true;
    scene.add(corridor1);
    meshes.push(corridor1);

    var corridor2 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.01, 80), new THREE.MeshStandardMaterial({ color: COLORS.labWhite }));
    corridor2.position.set(0, 0.5, 0);
    corridor2.receiveShadow = true;
    scene.add(corridor2);
    meshes.push(corridor2);

    var stripe1 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: COLORS.dangerRed }));
    stripe1.position.set(0, 0.51, 2);
    scene.add(stripe1);
    meshes.push(stripe1);

    var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: COLORS.dangerRed }));
    stripe2.position.set(0, 0.51, -2);
    scene.add(stripe2);
    meshes.push(stripe2);
  }

  function buildFumeHoods() {
    for (var i = 0; i < 3; i++) {
      var x = -30 + i * 30;
      var hoodFrame = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 4), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
      hoodFrame.position.set(x, 2, 25);
      hoodFrame.receiveShadow = true;
      scene.add(hoodFrame);
      meshes.push(hoodFrame);

      var hoodGlass = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.5, 0.05), new THREE.MeshStandardMaterial({ color: COLORS.blue, transparent: true, opacity: 0.3 }));
      hoodGlass.position.set(x, 2.5, 25.2);
      scene.add(hoodGlass);
      meshes.push(hoodGlass);

      var workTop = new THREE.Mesh(new THREE.BoxGeometry(11, 0.3, 3.5), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
      workTop.position.set(x, 1.2, 25);
      workTop.receiveShadow = true;
      scene.add(workTop);
      meshes.push(workTop);

      var ledge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 3.5), new THREE.MeshStandardMaterial({ color: COLORS.chemYellow }));
      ledge.position.set(x + 5.5, 1.5, 25);
      scene.add(ledge);
      meshes.push(ledge);
    }
  }

  function buildReactionVessels() {
    for (var i = 0; i < 4; i++) {
      var x = -15 + i * 10;
      var z = 0;
      var vesselGeo = new THREE.CylinderGeometry(2, 2, 4, 32);
      var vesselMat = new THREE.MeshStandardMaterial({ color: COLORS.toxicGreen, metalness: 0.6, roughness: 0.4 });
      var vessel = new THREE.Mesh(vesselGeo, vesselMat);
      vessel.position.set(x, 3, z);
      vessel.castShadow = true;
      vessel.receiveShadow = true;
      scene.add(vessel);
      meshes.push(vessel);
      vessels.push({ mesh: vessel, originalScale: 1.0, time: Math.random() * Math.PI * 2 });

      var pipesGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
      var pipesMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
      var pipes = new THREE.Mesh(pipesGeo, pipesMat);
      pipes.position.set(x + 2.5, 3.5, z);
      pipes.rotation.z = Math.PI / 4;
      scene.add(pipes);
      meshes.push(pipes);

      var capGeo = new THREE.SphereGeometry(2.2, 32, 32);
      var capMat = new THREE.MeshStandardMaterial({ color: COLORS.hazmatOrange });
      var cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, 5.2, z);
      cap.scale.y = 0.3;
      scene.add(cap);
      meshes.push(cap);

      gasVents.push({ pos: new THREE.Vector3(x, 5.5, z), intensity: 0 });
    }
  }

  function buildStorageRoom() {
    var storageWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 15), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
    storageWall.position.set(-35, 3, -30);
    scene.add(storageWall);
    meshes.push(storageWall);

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 5; col++) {
        var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.8, 32);
        var barrelMat = new THREE.MeshStandardMaterial({ color: COLORS.chemYellow, metalness: 0.7 });
        var barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(-35 + (col - 2) * 3, 1 + row * 2.5, -30);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
        meshes.push(barrel);
        barrels.push({ mesh: barrel, venting: false, ventTime: 0 });

        var labelGeo = new THREE.BoxGeometry(1.5, 0.3, 0.01);
        var labelMat = new THREE.MeshStandardMaterial({ color: COLORS.dangerRed });
        var label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(-35 + (col - 2) * 3, 2, -30.4);
        scene.add(label);
        meshes.push(label);
      }
    }
  }

  function buildVentilationSystem() {
    var ductH = new THREE.Mesh(new THREE.BoxGeometry(90, 1.5, 8), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
    ductH.position.set(0, 7, 0);
    ductH.receiveShadow = true;
    scene.add(ductH);
    meshes.push(ductH);

    var ductV = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 90), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
    ductV.position.set(0, 7, 0);
    ductV.receiveShadow = true;
    scene.add(ductV);
    meshes.push(ductV);

    for (var i = 0; i < 4; i++) {
      var fanGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
      var fanMat = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.8 });
      var fan = new THREE.Mesh(fanGeo, fanMat);
      var x = (i - 1.5) * 25;
      fan.position.set(x, 7.5, 0);
      scene.add(fan);
      meshes.push(fan);
      fans.push({ mesh: fan, rotation: 0 });

      var bladeGeo = new THREE.BoxGeometry(2.2, 0.1, 0.6);
      var bladeMat = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
      var blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(x, 7.5, 0);
      scene.add(blade);
      meshes.push(blade);
      fans.push({ mesh: blade, rotation: 0 });
    }

    var grille = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 0.3), new THREE.MeshStandardMaterial({ color: COLORS.darkGray }));
    grille.position.set(0, 4, 35);
    scene.add(grille);
    meshes.push(grille);
  }

  function buildAirlockEntry() {
    var airlockDoor = new THREE.Mesh(new THREE.BoxGeometry(6, 7, 0.3), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
    airlockDoor.position.set(0, 3.5, -45);
    airlockDoor.receiveShadow = true;
    scene.add(airlockDoor);
    meshes.push(airlockDoor);

    var airlockFrame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 7.5, 0.5), new THREE.MeshStandardMaterial({ color: COLORS.hazmatOrange }));
    airlockFrame.position.set(0, 3.5, -45.2);
    scene.add(airlockFrame);
    meshes.push(airlockFrame);

    var doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32), new THREE.MeshStandardMaterial({ color: COLORS.darkGray }));
    doorHandle.position.set(2.5, 3.5, -44.5);
    doorHandle.rotation.z = Math.PI / 2;
    scene.add(doorHandle);
    meshes.push(doorHandle);

    var window1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.blue, transparent: true, opacity: 0.4 }));
    window1.position.set(-1.5, 4.5, -44.8);
    scene.add(window1);
    meshes.push(window1);

    var window2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.blue, transparent: true, opacity: 0.4 }));
    window2.position.set(1.5, 4.5, -44.8);
    scene.add(window2);
    meshes.push(window2);
  }

  function buildComputerStations() {
    for (var i = 0; i < 2; i++) {
      var x = -20 + i * 40;
      var deskGeo = new THREE.BoxGeometry(6, 0.5, 3);
      var deskMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
      var desk = new THREE.Mesh(deskGeo, deskMat);
      desk.position.set(x, 1.5, 30);
      desk.receiveShadow = true;
      scene.add(desk);
      meshes.push(desk);

      var monitorGeo = new THREE.BoxGeometry(4, 2.5, 0.3);
      var monitorMat = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(x, 3.5, 30.2);
      scene.add(monitor);
      meshes.push(monitor);
      computerScreens.push({ mesh: monitor, dataOffset: Math.random() * 100 });

      var screenGeo = new THREE.BoxGeometry(3.8, 2.3, 0.05);
      var screenMat = new THREE.MeshStandardMaterial({ color: COLORS.toxicGreen, emissive: COLORS.toxicGreen, emissiveIntensity: 0.3 });
      var screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(x, 3.5, 30.35);
      scene.add(screen);
      meshes.push(screen);
      computerScreens.push({ mesh: screen, dataOffset: Math.random() * 100 });

      var keyboardGeo = new THREE.BoxGeometry(5, 0.3, 1.5);
      var keyboardMat = new THREE.MeshStandardMaterial({ color: COLORS.black });
      var keyboard = new THREE.Mesh(keyboardGeo, keyboardMat);
      keyboard.position.set(x, 1.8, 30 - 1.5);
      scene.add(keyboard);
      meshes.push(keyboard);
    }
  }

  function buildAutoclave() {
    var autoclaveGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 32);
    var autoclaveMat = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.8 });
    var autoclave = new THREE.Mesh(autoclaveGeo, autoclaveMat);
    autoclave.position.set(35, 2, -20);
    autoclave.rotation.z = Math.PI / 2;
    autoclave.castShadow = true;
    autoclave.receiveShadow = true;
    scene.add(autoclave);
    meshes.push(autoclave);

    var doorGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.3, 32);
    var doorMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(35, 2, -20.8);
    scene.add(door);
    meshes.push(door);

    var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 32);
    var wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(34, 2.5, -20.8);
    scene.add(wheel);
    meshes.push(wheel);
  }

  function buildEmergencyShower() {
    var pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 4, 16);
    var pipeMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(-30, 2, -25);
    scene.add(pipe);
    meshes.push(pipe);

    var headGeo = new THREE.SphereGeometry(0.4, 32, 32);
    var headMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(-30, 4.5, -25);
    scene.add(head);
    meshes.push(head);

    var nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
    var nozzleMat = new THREE.MeshStandardMaterial({ color: COLORS.blue });
    for (var i = 0; i < 8; i++) {
      var nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
      var angle = (i / 8) * Math.PI * 2;
      nozzle.position.set(-30 + Math.cos(angle) * 0.35, 4.2, -25 + Math.sin(angle) * 0.35);
      nozzle.rotation.z = angle;
      scene.add(nozzle);
      meshes.push(nozzle);
    }

    var baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32);
    var baseMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(-30, 0.3, -25);
    scene.add(base);
    meshes.push(base);
  }

  function buildBiohazardContainers() {
    for (var i = 0; i < 4; i++) {
      var containerGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
      var containerMat = new THREE.MeshStandardMaterial({ color: COLORS.dangerRed });
      var container = new THREE.Mesh(containerGeo, containerMat);
      var x = 35 - i * 4;
      container.position.set(x, 1.5, -40);
      container.castShadow = true;
      container.receiveShadow = true;
      scene.add(container);
      meshes.push(container);

      var symbolGeo = new THREE.BoxGeometry(0.8, 1, 0.05);
      var symbolMat = new THREE.MeshStandardMaterial({ color: COLORS.black });
      var symbol = new THREE.Mesh(symbolGeo, symbolMat);
      symbol.position.set(x, 1.8, 0.8);
      scene.add(symbol);
      meshes.push(symbol);

      var lidGeo = new THREE.BoxGeometry(1.6, 0.3, 1.6);
      var lidMat = new THREE.MeshStandardMaterial({ color: COLORS.black });
      var lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set(x, 2.6, -40);
      scene.add(lid);
      meshes.push(lid);
    }
  }

  function buildPowerPanel() {
    var panelGeo = new THREE.BoxGeometry(3, 2.5, 0.3);
    var panelMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(40, 3.5, 15);
    scene.add(panel);
    meshes.push(panel);

    for (var i = 0; i < 6; i++) {
      var switchGeo = new THREE.BoxGeometry(0.5, 0.4, 0.2);
      var switchMat = new THREE.MeshStandardMaterial({ color: i < 4 ? COLORS.toxicGreen : COLORS.dangerRed });
      var switchMesh = new THREE.Mesh(switchGeo, switchMat);
      var row = Math.floor(i / 3);
      var col = i % 3;
      switchMesh.position.set(40 - 0.8 + col * 0.8, 4.2 - row * 0.7, 15.2);
      scene.add(switchMesh);
      meshes.push(switchMesh);
    }

    var displayGeo = new THREE.BoxGeometry(2.8, 0.6, 0.1);
    var displayMat = new THREE.MeshStandardMaterial({ color: COLORS.black, emissive: COLORS.toxicGreen, emissiveIntensity: 0.5 });
    var display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(40, 2.5, 15.2);
    scene.add(display);
    meshes.push(display);
  }

  function buildCentrifuges() {
    for (var i = 0; i < 2; i++) {
      var x = 20 + i * 15;
      var baseGeo = new THREE.BoxGeometry(3, 0.5, 3);
      var baseMat = new THREE.MeshStandardMaterial({ color: COLORS.steel });
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(x, 1.5, -15);
      base.receiveShadow = true;
      scene.add(base);
      meshes.push(base);

      var cylinderGeo = new THREE.CylinderGeometry(1, 1, 1.5, 32);
      var cylinderMat = new THREE.MeshStandardMaterial({ color: COLORS.hazmatOrange });
      var cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
      cylinder.position.set(x, 2.5, -15);
      cylinder.castShadow = true;
      scene.add(cylinder);
      meshes.push(cylinder);
      fans.push({ mesh: cylinder, rotation: 0 });

      var rotor = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: COLORS.steel }));
      rotor.position.set(x, 2.5, -15);
      scene.add(rotor);
      meshes.push(rotor);
      fans.push({ mesh: rotor, rotation: 0 });
    }
  }

  function buildLighting() {
    for (var i = 0; i < 8; i++) {
      var lightGeo = new THREE.BoxGeometry(3, 0.2, 3);
      var lightMat = new THREE.MeshStandardMaterial({ color: COLORS.white, emissive: 0xFFFFFF, emissiveIntensity: 0.8 });
      var lightMesh = new THREE.Mesh(lightGeo, lightMat);
      var x = -40 + i * 20;
      lightMesh.position.set(x, 7.8, 0);
      scene.add(lightMesh);
      meshes.push(lightMesh);
      lights.push({ mesh: lightMesh, intensity: 1.0, flicker: Math.random() * 0.3 });
    }
  }

  function spawnGuards() {
    for (var i = 0; i < 3; i++) {
      var bodyGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
      var bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.hazmatOrange });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.copy(SPAWN_POINTS[i % SPAWN_POINTS.length].pos);
      body.castShadow = true;
      scene.add(body);
      meshes.push(body);

      var headGeo = new THREE.SphereGeometry(0.3, 32, 32);
      var headMat = new THREE.MeshStandardMaterial({ color: COLORS.hazmatOrange });
      var head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(body.position);
      head.position.y += 1.2;
      scene.add(head);
      meshes.push(head);

      var gunGeo = new THREE.BoxGeometry(0.15, 0.5, 2);
      var gunMat = new THREE.MeshStandardMaterial({ color: COLORS.black });
      var gun = new THREE.Mesh(gunGeo, gunMat);
      gun.position.copy(body.position);
      gun.position.z += 1;
      scene.add(gun);
      meshes.push(gun);

      guards.push({
        body: body,
        head: head,
        gun: gun,
        time: Math.random() * Math.PI * 2,
        radius: 5 + Math.random() * 5,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }

  function update(delta) {
    if (!scene) return;

    updateReactionVessels(delta);
    updateVentilationFans(delta);
    updateBarrels(delta);
    updateLights(delta);
    updateGuards(delta);
    updateComputerScreens(delta);
    updateAlarm(delta);
  }

  function updateReactionVessels(delta) {
    for (var i = 0; i < vessels.length; i++) {
      var v = vessels[i];
      v.time += delta * 1.5;
      var scale = 1.0 + Math.sin(v.time) * 0.05;
      v.mesh.scale.y = scale;

      if (gasVents[i]) {
        gasVents[i].intensity = Math.max(0, (Math.sin(v.time) + 1) / 2);
      }
    }
  }

  function updateVentilationFans(delta) {
    for (var i = 0; i < fans.length; i++) {
      fans[i].rotation += delta * 3;
      fans[i].mesh.rotation.y = fans[i].rotation;
    }
  }

  function updateBarrels(delta) {
    for (var i = 0; i < barrels.length; i++) {
      var b = barrels[i];
      if (Math.random() < 0.02) {
        b.venting = true;
        b.ventTime = 0.5;
      }
      if (b.venting) {
        b.ventTime -= delta;
        var tilt = Math.sin(Date.now() * 0.01 + i) * 0.05;
        b.mesh.rotation.z = tilt;
        if (b.ventTime <= 0) {
          b.venting = false;
          b.mesh.rotation.z = 0;
        }
      }
    }
  }

  function updateLights(delta) {
    for (var i = 0; i < lights.length; i++) {
      var l = lights[i];
      l.flicker += delta * 2;
      var flicker = Math.sin(l.flicker) * 0.15 + 0.85;
      if (alarmActive) {
        flicker *= (0.5 + alarmIntensity * 0.5);
      }
      l.mesh.material.emissiveIntensity = Math.max(0.1, flicker);
    }
  }

  function updateGuards(delta) {
    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      g.time += delta * g.speed;
      var x = Math.cos(g.time) * g.radius;
      var z = Math.sin(g.time) * g.radius;
      var startPos = SPAWN_POINTS[i % SPAWN_POINTS.length].pos;
      g.body.position.set(startPos.x + x, startPos.y, startPos.z + z);
      g.head.position.copy(g.body.position);
      g.head.position.y += 1.2;
      g.gun.position.copy(g.body.position);
      g.gun.position.z += 1;
      g.gun.rotation.y = g.time;
    }
  }

  function updateComputerScreens(delta) {
    for (var i = 0; i < computerScreens.length; i++) {
      var cs = computerScreens[i];
      cs.dataOffset += delta * 5;
      if (cs.dataOffset > 200) cs.dataOffset = 0;
      var intensity = 0.3 + Math.sin(cs.dataOffset * 0.05) * 0.2;
      cs.mesh.material.emissiveIntensity = intensity;
    }
  }

  function updateAlarm(delta) {
    if (Math.random() < 0.001) {
      alarmActive = !alarmActive;
    }
    if (alarmActive) {
      alarmIntensity = (alarmIntensity + delta * 2) % 1;
    } else {
      alarmIntensity = Math.max(0, alarmIntensity - delta);
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    guards = [];
    vessels = [];
    barrels = [];
    fans = [];
    lights = [];
    gasVents = [];
    computerScreens = [];
    alarmActive = false;
    alarmIntensity = 0;

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return SPAWN_POINTS; }
  };
}());
