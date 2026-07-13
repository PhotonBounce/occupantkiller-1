window.AirshipRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var enemyShips = [];
  var state = {
    altitude: 3200,
    gasRuptured: 0,
    admiralCaptured: false,
    time: 0
  };
  var keybindState = {
    lastKeyA: -500,
    lastKeyR: -500,
    active: true
  };
  var hudElement = null;

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    enemyShips = [];
    state = {
      altitude: 3200,
      gasRuptured: 0,
      admiralCaptured: false,
      time: 0
    };
    keybindState = {
      lastKeyA: -500,
      lastKeyR: -500,
      active: true
    };

    // Sky and atmosphere
    scene.fog = new THREE.Fog(0xb0e0ff, 1000, 10000);
    scene.background = new THREE.Color(0xb0e0ff);

    // Cloud layer below
    var cloudGeom = new THREE.BoxGeometry(2000, 50, 2000);
    var cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
    var cloudLayer = new THREE.Mesh(cloudGeom, cloudMat);
    cloudLayer.position.y = -800;
    scene.add(cloudLayer);
    objects.push(cloudLayer);

    // Create massive zeppelin airship
    createAirship();

    // Setup HUD
    setupHUD();

    // Setup keybinding
    setupKeybinding();
  }

  function createAirship() {
    var airshipGroup = new THREE.Group();
    airshipGroup.name = 'airship';
    airshipGroup.position.set(0, 500, 0);

    // Massive zeppelin envelope (huge elongated sphere)
    var envelopeGeom = new THREE.SphereGeometry(120, 32, 32);
    envelopeGeom.scale(1, 2.5, 1);
    var envelopeMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 100 });
    var envelope = new THREE.Mesh(envelopeGeom, envelopeMat);
    envelope.castShadow = true;
    envelope.receiveShadow = true;
    airshipGroup.add(envelope);
    objects.push(envelope);

    // Observation deck (flat box on top)
    var obsGeom = new THREE.BoxGeometry(150, 20, 100);
    var obsMat = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var obsDeck = new THREE.Mesh(obsGeom, obsMat);
    obsDeck.position.set(0, 140, 0);
    obsDeck.castShadow = true;
    airshipGroup.add(obsDeck);
    objects.push(obsDeck);

    // Mooring mast at bow
    var mastGeom = new THREE.CylinderGeometry(8, 8, 250, 16);
    var mastMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(0, 200, 130);
    mast.castShadow = true;
    airshipGroup.add(mast);
    objects.push(mast);

    // Mooring cables (LineSegments)
    var cableGeom = new THREE.BufferGeometry();
    var cablePositions = new Float32Array([
      0, 200, 130,
      -80, 50, 130,
      0, 200, 130,
      80, 50, 130,
      0, 200, 130,
      0, 50, 160,
      0, 200, 130,
      0, 50, 100
    ]);
    cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    var cableMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeom, cableMat);
    airshipGroup.add(cables);
    objects.push(cables);

    // Create multiple gondola cabins (elongated box structures hanging below)
    createGondola(-80, -150, -40, '1');
    createGondola(0, -150, 0, '2');
    createGondola(80, -150, 40, '3');

    // Create engine nacelles (cylinder engine pods on wing struts)
    createEngineNacelle(-140, -60, 0);
    createEngineNacelle(140, -60, 0);

    // Create propeller discs (cylinder + thin box blades)
    createPropeller(-140, -60, -80);
    createPropeller(140, -60, 80);

    // Gun turret emplacements (cylinder base + box gun)
    createGunTurret(-100, 100, 0);
    createGunTurret(100, 100, 0);
    createGunTurret(0, 80, -120);

    // Hydrogen gas cell venting (cylinder vents along envelope)
    createGasVent(-60, 100, 0);
    createGasVent(60, 100, 0);
    createGasVent(0, 110, -60);

    // Crew compartment windows (box frames with small box glass panes)
    createWindow(-100, 0, -80);
    createWindow(100, 0, 80);
    createWindow(-50, 20, 100);
    createWindow(50, 20, 100);

    // Navigation/helm station (box console room)
    var helmGeom = new THREE.BoxGeometry(60, 40, 40);
    var helmMat = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
    var helm = new THREE.Mesh(helmGeom, helmMat);
    helm.position.set(0, 120, -100);
    helm.castShadow = true;
    airshipGroup.add(helm);
    objects.push(helm);

    // Cargo bay (large open box area)
    var cargoGeom = new THREE.BoxGeometry(200, 80, 150);
    var cargoMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var cargo = new THREE.Mesh(cargoGeom, cargoMat);
    cargo.position.set(0, -80, 20);
    cargo.castShadow = true;
    airshipGroup.add(cargo);
    objects.push(cargo);

    // Antenna array (thin cylinders + LineSegments wires)
    createAntenna(0, 160, 0);
    createAntenna(-50, 150, 40);
    createAntenna(50, 150, -40);

    // Searchlight platforms (cylinder + cone beams)
    createSearchlight(-120, 60, -80);
    createSearchlight(120, 60, 80);

    // Fuel tank cylinders (large cylinder storage)
    createFuelTank(-50, -100, 60);
    createFuelTank(50, -100, -60);

    // Rope ladder dangling from gondola (LineSegments)
    createRopeLadder(0, -230, 0);

    scene.add(airshipGroup);
    objects.push(airshipGroup);

    // Create enemies
    createEnemies(airshipGroup);
  }

  function createGondola(x, y, z, id) {
    var gondolaGroup = new THREE.Group();
    gondolaGroup.position.set(x, y, z);

    var gondGeom = new THREE.BoxGeometry(80, 60, 50);
    var gondMat = new THREE.MeshPhongMaterial({ color: 0x3d3d3d });
    var gondola = new THREE.Mesh(gondGeom, gondMat);
    gondola.castShadow = true;
    gondolaGroup.add(gondola);

    // Window on gondola
    var windowGeom = new THREE.BoxGeometry(20, 15, 3);
    var windowMat = new THREE.MeshPhongMaterial({ color: 0x87ceeb });
    var window_ = new THREE.Mesh(windowGeom, windowMat);
    window_.position.set(0, 10, 26);
    gondolaGroup.add(window_);

    scene.add(gondolaGroup);
    objects.push(gondolaGroup);
  }

  function createEngineNacelle(x, y, z) {
    var nacelleGroup = new THREE.Group();
    nacelleGroup.position.set(x, y, z);

    var nacelleGeom = new THREE.CylinderGeometry(35, 35, 90, 16);
    var nacelleMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var nacelle = new THREE.Mesh(nacelleGeom, nacelleMat);
    nacelle.rotation.z = Math.PI / 2;
    nacelle.castShadow = true;
    nacelleGroup.add(nacelle);

    // Engine intake ring
    var intakeGeom = new THREE.CylinderGeometry(40, 35, 10, 16);
    var intakeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var intake = new THREE.Mesh(intakeGeom, intakeMat);
    intake.rotation.z = Math.PI / 2;
    intake.position.set(-50, 0, 0);
    nacelleGroup.add(intake);

    scene.add(nacelleGroup);
    objects.push(nacelleGroup);
  }

  function createPropeller(x, y, z) {
    var propGroup = new THREE.Group();
    propGroup.position.set(x, y, z);
    propGroup.name = 'propeller_' + x;

    // Hub cylinder
    var hubGeom = new THREE.CylinderGeometry(12, 12, 8, 16);
    var hubMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var hub = new THREE.Mesh(hubGeom, hubMat);
    hub.rotation.z = Math.PI / 2;
    propGroup.add(hub);

    // Propeller blades (two thin boxes forming an X)
    var bladeGeom = new THREE.BoxGeometry(100, 8, 3);
    var bladeMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

    var blade1 = new THREE.Mesh(bladeGeom, bladeMat);
    blade1.position.set(0, 0, 0);
    blade1.rotation.z = 0;
    propGroup.add(blade1);

    var blade2 = new THREE.Mesh(bladeGeom, bladeMat);
    blade2.position.set(0, 0, 0);
    blade2.rotation.z = Math.PI / 2;
    propGroup.add(blade2);

    scene.add(propGroup);
    objects.push(propGroup);
  }

  function createGunTurret(x, y, z) {
    var turretGroup = new THREE.Group();
    turretGroup.position.set(x, y, z);
    turretGroup.name = 'turret_' + x + '_' + z;

    // Turret base
    var baseGeom = new THREE.CylinderGeometry(30, 40, 20, 16);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    turretGroup.add(base);

    // Gun barrel (box)
    var barrelGeom = new THREE.BoxGeometry(15, 12, 60);
    var barrelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.position.set(0, 15, 0);
    barrel.castShadow = true;
    turretGroup.add(barrel);

    // Gun mount ring
    var ringGeom = new THREE.CylinderGeometry(35, 35, 4, 16);
    var ringMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(0, 10, 0);
    turretGroup.add(ring);

    scene.add(turretGroup);
    objects.push(turretGroup);
  }

  function createGasVent(x, y, z) {
    var ventGeom = new THREE.CylinderGeometry(15, 15, 30, 8);
    var ventMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var vent = new THREE.Mesh(ventGeom, ventMat);
    vent.position.set(x, y, z);
    vent.castShadow = true;
    scene.add(vent);
    objects.push(vent);
  }

  function createWindow(x, y, z) {
    var frameGeom = new THREE.BoxGeometry(25, 20, 4);
    var frameMat = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(x, y, z);
    scene.add(frame);
    objects.push(frame);

    var glassGeom = new THREE.BoxGeometry(15, 12, 2);
    var glassMat = new THREE.MeshPhongMaterial({ color: 0x4a90e2, opacity: 0.6, transparent: true });
    var glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.set(x, y, z + 2);
    scene.add(glass);
    objects.push(glass);
  }

  function createAntenna(x, y, z) {
    var antennaGeom = new THREE.CylinderGeometry(3, 3, 80, 8);
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(x, y, z);
    antenna.castShadow = true;
    scene.add(antenna);
    objects.push(antenna);

    // Antenna guy-wires (LineSegments)
    var wireGeom = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      x, y + 40, z,
      x - 40, y - 20, z - 30,
      x, y + 40, z,
      x + 40, y - 20, z + 30,
      x, y + 40, z,
      x, y - 20, z - 40
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 });
    var wires = new THREE.LineSegments(wireGeom, wireMat);
    scene.add(wires);
    objects.push(wires);
  }

  function createSearchlight(x, y, z) {
    var lightGroup = new THREE.Group();
    lightGroup.position.set(x, y, z);
    lightGroup.name = 'searchlight_' + x;

    var baseGeom = new THREE.CylinderGeometry(20, 25, 15, 16);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    lightGroup.add(base);

    var coneGeom = new THREE.ConeGeometry(30, 50, 16);
    var coneMat = new THREE.MeshPhongMaterial({ color: 0xffff99, opacity: 0.3, transparent: true });
    var cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(0, 30, 0);
    lightGroup.add(cone);

    scene.add(lightGroup);
    objects.push(lightGroup);
  }

  function createFuelTank(x, y, z) {
    var tankGeom = new THREE.CylinderGeometry(50, 50, 120, 16);
    var tankMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(x, y, z);
    tank.castShadow = true;
    scene.add(tank);
    objects.push(tank);

    // Tank straps (thin boxes)
    var strapGeom = new THREE.BoxGeometry(110, 3, 3);
    var strapMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var strap1 = new THREE.Mesh(strapGeom, strapMat);
    strap1.position.set(x, y - 30, z);
    scene.add(strap1);
    objects.push(strap1);

    var strap2 = new THREE.Mesh(strapGeom, strapMat);
    strap2.position.set(x, y + 30, z);
    scene.add(strap2);
    objects.push(strap2);
  }

  function createRopeLadder(x, y, z) {
    var ladderGeom = new THREE.BufferGeometry();
    var rungs = [];
    for (var i = 0; i < 10; i++) {
      var rungY = y + (i * 15);
      rungs.push(
        x - 15, rungY, z,
        x + 15, rungY, z
      );
    }
    var ladderPositions = new Float32Array(rungs);
    ladderGeom.setAttribute('position', new THREE.BufferAttribute(ladderPositions, 3));
    var ladderMat = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeom, ladderMat);
    scene.add(ladder);
    objects.push(ladder);

    // Vertical ropes
    var vertGeom = new THREE.BufferGeometry();
    var vertPositions = new Float32Array([
      x - 15, y, z,
      x - 15, y + 150, z,
      x + 15, y, z,
      x + 15, y + 150, z
    ]);
    vertGeom.setAttribute('position', new THREE.BufferAttribute(vertPositions, 3));
    var vertMat = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
    var verts = new THREE.LineSegments(vertGeom, vertMat);
    scene.add(verts);
    objects.push(verts);
  }

  function createEnemies(airshipGroup) {
    // Crew members (box figures with brass buttons)
    createCrewMember(-60, 80, 0, 'crew1');
    createCrewMember(60, 80, 0, 'crew2');
    createCrewMember(0, 100, -80, 'crew3');
    createCrewMember(-30, -150, 20, 'crew4');
    createCrewMember(30, -150, -20, 'crew5');

    // Admiral on observation deck
    createAdmiral(0, 160, 0);
  }

  function createCrewMember(x, y, z, id) {
    var crewGroup = new THREE.Group();
    crewGroup.position.set(x, y, z);
    crewGroup.name = id;

    // Body
    var bodyGeom = new THREE.BoxGeometry(12, 35, 12);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x3d3d3d });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    crewGroup.add(body);

    // Head
    var headGeom = new THREE.SphereGeometry(8, 16, 16);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 25, 0);
    head.castShadow = true;
    crewGroup.add(head);

    // Brass buttons on chest
    var buttonGeom = new THREE.SphereGeometry(2, 8, 8);
    var buttonMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 100 });
    for (var i = 0; i < 3; i++) {
      var button = new THREE.Mesh(buttonGeom, buttonMat);
      button.position.set(0, 10 - i * 8, 8);
      crewGroup.add(button);
    }

    scene.add(crewGroup);
    objects.push(crewGroup);
    enemyShips.push({ group: crewGroup, type: 'crew', health: 20 });
  }

  function createAdmiral(x, y, z) {
    var admiralGroup = new THREE.Group();
    admiralGroup.position.set(x, y, z);
    admiralGroup.name = 'admiral';

    // Body (larger)
    var bodyGeom = new THREE.BoxGeometry(16, 45, 14);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    admiralGroup.add(body);

    // Head
    var headGeom = new THREE.SphereGeometry(10, 16, 16);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xd4a574 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 30, 0);
    head.castShadow = true;
    admiralGroup.add(head);

    // Admiral's hat (box)
    var hatGeom = new THREE.BoxGeometry(22, 6, 16);
    var hatMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var hat = new THREE.Mesh(hatGeom, hatMat);
    hat.position.set(0, 37, 0);
    admiralGroup.add(hat);

    // Brass rank insignia
    var insigniaGeom = new THREE.SphereGeometry(3, 8, 8);
    var insigniaMat = new THREE.MeshPhongMaterial({ color: 0xffd700, shininess: 100 });
    var insignia = new THREE.Mesh(insigniaGeom, insigniaMat);
    insignia.position.set(0, 27, 10);
    admiralGroup.add(insignia);

    scene.add(admiralGroup);
    objects.push(admiralGroup);
    enemyShips.push({ group: admiralGroup, type: 'admiral', health: 100 });
  }

  function setupHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'airship-hud';
    hudElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 14px; z-index: 1000; text-shadow: 0 0 10px #00ff00;';
    hudElement.innerHTML = '' +
      'ALTITUDE: 3200m<br>' +
      'GAS CELLS RUPTURED: 0/4<br>' +
      'ADMIRAL CAPTURED: NO<br>' +
      '<span style="color: #ffff00; font-size: 12px; margin-top: 10px; display: block;">Keybind: A+R (toggle)</span>';
    document.body.appendChild(hudElement);
  }

  function setupKeybinding() {
    document.addEventListener('keydown', function(e) {
      var currentTime = performance.now();

      if (e.key.toLowerCase() === 'a') {
        keybindState.lastKeyA = currentTime;
      } else if (e.key.toLowerCase() === 'r') {
        if (currentTime - keybindState.lastKeyA < 400) {
          keybindState.active = !keybindState.active;
          var msg = keybindState.active ? 'AIRSHIP RAID: ACTIVE' : 'AIRSHIP RAID: INACTIVE';
          showHUDNotification(msg);
        }
        keybindState.lastKeyR = currentTime;
      }
    });
  }

  function showHUDNotification(message) {
    var notif = document.createElement('div');
    notif.style.cssText = 'position: fixed; top: 200px; left: 20px; color: #ffff00; font-family: monospace; font-size: 16px; z-index: 1001; text-shadow: 0 0 10px #ffff00;';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(function() {
      document.body.removeChild(notif);
    }, 2000);
  }

  function update(delta) {
    if (!keybindState.active || !scene) return;

    state.time += delta;

    // Find airship group
    var airship = scene.getObjectByName('airship');
    if (airship) {
      // Slow circular drift pattern
      var radius = 200;
      var speed = 0.1;
      airship.position.x = radius * Math.cos(state.time * speed);
      airship.position.z = radius * Math.sin(state.time * speed);

      // Gentle pitch
      airship.rotation.z = Math.sin(state.time * 0.3) * 0.05;

      // Propeller spin
      var prop1 = scene.getObjectByName('propeller_-140');
      var prop2 = scene.getObjectByName('propeller_140');
      if (prop1) prop1.rotation.x += 0.3;
      if (prop2) prop2.rotation.x += 0.3;

      // Searchlight sweep
      var light1 = scene.getObjectByName('searchlight_-120');
      var light2 = scene.getObjectByName('searchlight_120');
      if (light1) light1.rotation.y = Math.sin(state.time * 0.5) * 0.8;
      if (light2) light2.rotation.y = Math.sin(state.time * 0.5 + Math.PI) * 0.8;

      // Gun turret tracking (slight random movement)
      var turretNames = ['turret_-100_0', 'turret_100_0', 'turret_0_-120'];
      turretNames.forEach(function(name) {
        var turret = scene.getObjectByName(name);
        if (turret) {
          turret.rotation.y += Math.sin(state.time * 0.2 + Math.random()) * 0.02;
          turret.rotation.x += Math.cos(state.time * 0.15 + Math.random()) * 0.01;
        }
      });
    }

    // Update HUD
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML = '' +
        'ALTITUDE: ' + state.altitude + 'm<br>' +
        'GAS CELLS RUPTURED: ' + state.gasRuptured + '/4<br>' +
        'ADMIRAL CAPTURED: ' + (state.admiralCaptured ? 'YES' : 'NO') + '<br>' +
        '<span style="color: #ffff00; font-size: 12px; margin-top: 10px; display: block;">Keybind: A+R (toggle)</span>';
    }
  }

  function reset() {
    // Remove all scene objects
    objects.forEach(function(obj) {
      if (scene && scene.children.indexOf(obj) > -1) {
        scene.remove(obj);
      }
    });
    objects = [];
    enemyShips = [];
    state = {
      altitude: 3200,
      gasRuptured: 0,
      admiralCaptured: false,
      time: 0
    };

    // Remove HUD
    if (hudElement && document.body.contains(hudElement)) {
      document.body.removeChild(hudElement);
    }
    hudElement = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
