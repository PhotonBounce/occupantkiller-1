window.CargoPlane = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var enemies = [];
  var particles = [];
  var time = 0;
  var fuselageGroup = null;
  var rampGroup = null;
  var cockpitDoor = null;
  var hydraulicRamp = null;
  var emergencyLights = [];
  var portholeMeshes = [];
  var turbulenceOffset = { x: 0, y: 0, z: 0 };
  var rampWindForce = 0;
  var spawnPoints = [];

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    enemies = [];
    particles = [];
    time = 0;

    fuselageGroup = new THREE.Group();
    rampGroup = new THREE.Group();
    scene.add(fuselageGroup);
    scene.add(rampGroup);

    buildFuselage();
    buildCargoBay();
    buildRampArea();
    buildCockpitZone();
    buildJumpSeats();
    buildFuelDrums();
    buildOverheadStructure();
    buildEmergencyExits();
    buildPortholes();
    buildHydraulicSystem();
    buildSkyBackdrop();
    initializeSpawnPoints();
  }

  function buildFuselage() {
    var fuselageGeometry = new THREE.BoxGeometry(3.5, 2.8, 25);
    var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 });
    var fuselageMesh = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselageGroup.add(fuselageMesh);
    meshes.push(fuselageMesh);

    // Port side wall
    var portWallGeometry = new THREE.BoxGeometry(0.15, 2.8, 25);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5C3A });
    var portWall = new THREE.Mesh(portWallGeometry, wallMaterial);
    portWall.position.set(-1.75, 0, 0);
    fuselageGroup.add(portWall);
    meshes.push(portWall);

    // Starboard side wall
    var starboardWall = new THREE.Mesh(portWallGeometry, wallMaterial);
    starboardWall.position.set(1.75, 0, 0);
    fuselageGroup.add(starboardWall);
    meshes.push(starboardWall);

    // Overhead bulkhead frame
    var bulkheadGeometry = new THREE.BoxGeometry(3.5, 0.2, 25);
    var bulkheadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
    var bulkhead = new THREE.Mesh(bulkheadGeometry, bulkheadMaterial);
    bulkhead.position.set(0, 1.4, 0);
    fuselageGroup.add(bulkhead);
    meshes.push(bulkhead);

    // Cabin floor
    var floorGeometry = new THREE.BoxGeometry(3.5, 0.15, 25);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -1.4, 0);
    fuselageGroup.add(floor);
    meshes.push(floor);
  }

  function buildCargoBay() {
    // Cargo pallet 1
    var palletGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.5);
    var palletMaterial = new THREE.MeshStandardMaterial({ color: 0xC8A05A });
    var pallet1 = new THREE.Mesh(palletGeometry, palletMaterial);
    pallet1.position.set(-1.0, -1.0, -5);
    fuselageGroup.add(pallet1);
    meshes.push(pallet1);

    // Cargo pallet 2
    var pallet2 = new THREE.Mesh(palletGeometry, palletMaterial);
    pallet2.position.set(1.0, -1.0, -5);
    fuselageGroup.add(pallet2);
    meshes.push(pallet2);

    // Cargo pallet 3
    var pallet3 = new THREE.Mesh(palletGeometry, palletMaterial);
    pallet3.position.set(-1.0, -1.0, 0);
    fuselageGroup.add(pallet3);
    meshes.push(pallet3);

    // Weapon crate
    var crateGeometry = new THREE.BoxGeometry(0.8, 0.7, 1.0);
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0xAA7722 });
    var weaponCrate = new THREE.Mesh(crateGeometry, crateMaterial);
    weaponCrate.position.set(0.5, -1.0, 2);
    fuselageGroup.add(weaponCrate);
    meshes.push(weaponCrate);

    // Cargo tie-down rings - visual indicators
    var ringGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8);
    var ringMaterial = new THREE.MeshStandardMaterial({ color: 0xFF2200 });
    for (var i = 0; i < 6; i++) {
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(-1.5 + i * 0.6, -1.35, -8 + i * 3);
      fuselageGroup.add(ring);
      meshes.push(ring);
    }
  }

  function buildRampArea() {
    // Loading ramp - angled down to sky
    var rampGeometry = new THREE.BoxGeometry(3.5, 0.2, 4);
    var rampMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7 });
    hydraulicRamp = new THREE.Mesh(rampGeometry, rampMaterial);
    hydraulicRamp.rotation.x = -0.3;
    hydraulicRamp.position.set(0, -1.8, 12);
    rampGroup.add(hydraulicRamp);
    meshes.push(hydraulicRamp);

    // Ramp edge lip
    var rampLipGeometry = new THREE.BoxGeometry(3.5, 0.08, 0.3);
    var rampLip = new THREE.Mesh(rampLipGeometry, rampMaterial);
    rampLip.position.set(0, -1.5, 14.5);
    rampGroup.add(rampLip);
    meshes.push(rampLip);

    // Ramp side guides (2 vertical supports)
    var guideGeometry = new THREE.BoxGeometry(0.1, 1.5, 4);
    var guideMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5C3A });
    var guideLeft = new THREE.Mesh(guideGeometry, guideMaterial);
    guideLeft.position.set(-1.7, -1.0, 12);
    rampGroup.add(guideLeft);
    meshes.push(guideLeft);

    var guideRight = new THREE.Mesh(guideGeometry, guideMaterial);
    guideRight.position.set(1.7, -1.0, 12);
    rampGroup.add(guideRight);
    meshes.push(guideRight);

    spawnPoints.push({ x: 0, y: 0.5, z: 14 });
  }

  function buildCockpitZone() {
    // Cockpit door
    var doorGeometry = new THREE.BoxGeometry(1.2, 2.0, 0.08);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, metalness: 0.8 });
    cockpitDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    cockpitDoor.position.set(0, 0, -12);
    fuselageGroup.add(cockpitDoor);
    meshes.push(cockpitDoor);

    // Cockpit window frame (porthole style)
    var windowFrameGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
    var windowFrame = new THREE.Mesh(windowFrameGeometry, frameMaterial);
    windowFrame.rotation.z = Math.PI / 2;
    windowFrame.position.set(0.5, 0.3, -12.5);
    fuselageGroup.add(windowFrame);
    meshes.push(windowFrame);

    // HUD glow emissive plane
    var hudGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.02);
    var hudMaterial = new THREE.MeshStandardMaterial({ color: 0x00CC44, emissive: 0x00AA22 });
    var hud = new THREE.Mesh(hudGeometry, hudMaterial);
    hud.position.set(-0.7, -0.3, -12.3);
    fuselageGroup.add(hud);
    meshes.push(hud);

    spawnPoints.push({ x: 0, y: 0.5, z: -10 });
  }

  function buildJumpSeats() {
    // Jump seats along port side (left)
    var seatGeometry = new THREE.BoxGeometry(0.4, 0.5, 0.5);
    var seatMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (var i = 0; i < 4; i++) {
      var seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(-1.5, -0.5, -8 + i * 4);
      fuselageGroup.add(seat);
      meshes.push(seat);
    }

    // Jump seats along starboard side (right)
    for (var i = 0; i < 4; i++) {
      var seatRight = new THREE.Mesh(seatGeometry, seatMaterial);
      seatRight.position.set(1.5, -0.5, -8 + i * 4);
      fuselageGroup.add(seatRight);
      meshes.push(seatRight);
    }
  }

  function buildFuelDrums() {
    var drumGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 12);
    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0xFF2200 });

    // Drum 1
    var drum1 = new THREE.Mesh(drumGeometry, drumMaterial);
    drum1.position.set(-1.4, -0.8, -3);
    fuselageGroup.add(drum1);
    meshes.push(drum1);

    // Drum 2
    var drum2 = new THREE.Mesh(drumGeometry, drumMaterial);
    drum2.position.set(1.4, -0.8, -3);
    fuselageGroup.add(drum2);
    meshes.push(drum2);

    // Drum 3
    var drum3 = new THREE.Mesh(drumGeometry, drumMaterial);
    drum3.position.set(-1.4, -0.8, 4);
    fuselageGroup.add(drum3);
    meshes.push(drum3);
  }

  function buildOverheadStructure() {
    // Overhead cable tray (netting support)
    var trayGeometry = new THREE.BoxGeometry(3.2, 0.08, 20);
    var trayMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var tray = new THREE.Mesh(trayGeometry, trayMaterial);
    tray.position.set(0, 1.2, 0);
    fuselageGroup.add(tray);
    meshes.push(tray);

    // Hydraulic line runs (cylindrical pipes)
    var pipeGeometry = new THREE.CylinderGeometry(0.06, 0.06, 18, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x4A5C3A });
    var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-1.2, 0.8, 0);
    fuselageGroup.add(pipe1);
    meshes.push(pipe1);

    var pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.position.set(1.2, 0.8, 0);
    fuselageGroup.add(pipe2);
    meshes.push(pipe2);
  }

  function buildEmergencyExits() {
    // Emergency exit door 1 (port)
    var exitGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.08);
    var exitMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
    var exit1 = new THREE.Mesh(exitGeometry, exitMaterial);
    exit1.position.set(-1.7, 0, 6);
    fuselageGroup.add(exit1);
    meshes.push(exit1);

    // Emergency exit door 2 (starboard)
    var exit2 = new THREE.Mesh(exitGeometry, exitMaterial);
    exit2.position.set(1.7, 0, 6);
    fuselageGroup.add(exit2);
    meshes.push(exit2);

    // Emergency light above exit 1
    var lightGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.02);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
    var light1 = new THREE.Mesh(lightGeometry, lightMaterial);
    light1.position.set(-1.7, 0.8, 6);
    fuselageGroup.add(light1);
    meshes.push(light1);
    emergencyLights.push(light1);

    var light2 = new THREE.Mesh(lightGeometry, lightMaterial);
    light2.position.set(1.7, 0.8, 6);
    fuselageGroup.add(light2);
    meshes.push(light2);
    emergencyLights.push(light2);

    spawnPoints.push({ x: -1.7, y: 0.3, z: 6 });
    spawnPoints.push({ x: 1.7, y: 0.3, z: 6 });
  }

  function buildPortholes() {
    // Porthole windows showing engine nacelles outside
    var porthole1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1A1A4A })
    );
    porthole1.rotation.z = Math.PI / 2;
    porthole1.position.set(-1.7, 0.5, -6);
    fuselageGroup.add(porthole1);
    meshes.push(porthole1);
    portholeMeshes.push(porthole1);

    var porthole2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1A1A4A })
    );
    porthole2.rotation.z = Math.PI / 2;
    porthole2.position.set(-1.7, 0.5, 2);
    fuselageGroup.add(porthole2);
    meshes.push(porthole2);
    portholeMeshes.push(porthole2);

    var porthole3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x1A1A4A })
    );
    porthole3.rotation.z = Math.PI / 2;
    porthole3.position.set(-1.7, 0.5, 10);
    fuselageGroup.add(porthole3);
    meshes.push(porthole3);
    portholeMeshes.push(porthole3);
  }

  function buildHydraulicSystem() {
    // Hydraulic pump assembly at ramp base
    var pumpGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12);
    var pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
    var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(0, -1.2, 13);
    rampGroup.add(pump);
    meshes.push(pump);

    // Control panel with buttons
    var panelGeometry = new THREE.BoxGeometry(1.0, 0.7, 0.1);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(0, 0.5, 13.5);
    rampGroup.add(panel);
    meshes.push(panel);

    // Warning light on panel
    var warningGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    var warningMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
    var warning = new THREE.Mesh(warningGeometry, warningMaterial);
    warning.position.set(-0.25, 0.5, 13.6);
    rampGroup.add(warning);
    meshes.push(warning);
    emergencyLights.push(warning);
  }

  function buildSkyBackdrop() {
    // Exterior sky visible through ramp opening
    var skyGeometry = new THREE.BoxGeometry(4, 3, 0.1);
    var skyMaterial = new THREE.MeshStandardMaterial({ color: 0x6699CC });
    var sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.set(0, 1, 16);
    rampGroup.add(sky);
    meshes.push(sky);

    // Cloud accent (semi-transparent effect via cone)
    var cloudGeometry = new THREE.ConeGeometry(1.0, 0.5, 8);
    var cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.3 });
    var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.rotation.x = Math.PI;
    cloud.position.set(1.0, 2.0, 16.1);
    rampGroup.add(cloud);
    meshes.push(cloud);
  }

  function initializeSpawnPoints() {
    // Mid-cargo area
    spawnPoints.push({ x: 0, y: 0.5, z: -1 });
    spawnPoints.push({ x: -1.2, y: 0.5, z: 3 });
    spawnPoints.push({ x: 1.2, y: 0.5, z: 3 });
  }

  function update(delta) {
    time += delta;

    // Aircraft turbulence - subtle oscillation
    turbulenceOffset.x = Math.sin(time * 0.8) * 0.02;
    turbulenceOffset.y = Math.cos(time * 1.1) * 0.015;
    turbulenceOffset.z = Math.sin(time * 0.6 + Math.PI / 3) * 0.01;

    if (fuselageGroup) {
      fuselageGroup.position.set(turbulenceOffset.x, turbulenceOffset.y, turbulenceOffset.z);
    }

    // Ramp wind effect - sway
    rampWindForce = Math.sin(time * 1.3) * 0.08;
    if (rampGroup) {
      rampGroup.position.x = rampWindForce;
    }

    // Emergency lights strobe
    var strobePhase = Math.floor(time * 4) % 2;
    for (var i = 0; i < emergencyLights.length; i++) {
      emergencyLights[i].visible = (strobePhase === 0);
    }

    // Porthole engine glow pulse
    for (var i = 0; i < portholeMeshes.length; i++) {
      var intensity = 0.3 + Math.sin(time * 2) * 0.2;
      portholeMeshes[i].material.emissive.setHex(0x4A4A8A);
      portholeMeshes[i].material.emissiveIntensity = intensity;
    }

    // Cargo shifting animation
    if (meshes.length > 10) {
      var cargoShift = Math.sin(time * 0.7) * 0.05;
      meshes[4].position.y = -1.0 + cargoShift;
      meshes[5].position.y = -1.0 - cargoShift;
    }

    // Ramp hydraulic mechanism animation
    if (hydraulicRamp) {
      hydraulicRamp.rotation.x = -0.3 + Math.sin(time * 0.5) * 0.05;
    }

    // Simulate parachute bags deploying
    if (Math.random() < 0.02) {
      spawnParachuteBag();
    }

    // Update particles (parachute effects)
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].lifetime -= delta;
      if (particles[i].lifetime <= 0) {
        scene.remove(particles[i].mesh);
        particles.splice(i, 1);
      } else {
        particles[i].mesh.position.y -= delta * 2;
        particles[i].mesh.position.x += Math.sin(time * 2) * 0.01;
      }
    }
  }

  function spawnParachuteBag() {
    if (spawnPoints.length === 0) return;

    var spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    var bagGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    var bagMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var bag = new THREE.Mesh(bagGeometry, bagMaterial);

    bag.position.set(
      spawnPoint.x + (Math.random() - 0.5) * 0.5,
      spawnPoint.y + Math.random() * 0.5,
      spawnPoint.z + (Math.random() - 0.5) * 0.5
    );

    scene.add(bag);
    particles.push({
      mesh: bag,
      lifetime: 8 + Math.random() * 4
    });
  }

  function reset() {
    // Clear particles
    for (var i = particles.length - 1; i >= 0; i--) {
      scene.remove(particles[i].mesh);
    }
    particles = [];

    // Clear enemies
    for (var i = enemies.length - 1; i >= 0; i--) {
      scene.remove(enemies[i].mesh);
    }
    enemies = [];

    // Reset turbulence
    turbulenceOffset = { x: 0, y: 0, z: 0 };
    rampWindForce = 0;
    time = 0;

    // Reset group positions
    if (fuselageGroup) {
      fuselageGroup.position.set(0, 0, 0);
    }
    if (rampGroup) {
      rampGroup.position.set(0, 0, 0);
    }

    // Reset hydraulic ramp angle
    if (hydraulicRamp) {
      hydraulicRamp.rotation.x = -0.3;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
