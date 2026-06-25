window.SpaceDock = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var dockingRing = null;
  var repairDrones = [];
  var driftingCargo = [];
  var shieldEmitters = [];
  var escapePods = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Set scene background to deep space void
    scene.background = new THREE.Color(0x000a1a);
    scene.fog = new THREE.FogExp2(0x000a1a, 0.0008);

    // Star field beyond windows
    createStarField();

    // Main docking station structures
    createDockingBay();
    createRepairCranes();
    createFuelDepot();
    createCommandBridge();
    createRotatingRing();
    createEscapePods();
    createEnergyShieldEmitters();
    createMagneticTracks();

    // Dynamic elements
    createRepairDrones();
    createDriftingCargo();
  };

  var createStarField = function() {
    var starGeometry = new THREE.BufferGeometry();
    var starCount = 2000;
    var positions = new Float32Array(starCount * 3);

    for (var i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4000;
      positions[i + 1] = (Math.random() - 0.5) * 4000;
      positions[i + 2] = (Math.random() - 0.5) * 4000;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    var stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  };

  var createDockingBay = function() {
    // Main hangar structure - massive hollow box
    var hangarGeo = new THREE.BoxGeometry(500, 300, 800);
    var hangarMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7, roughness: 0.3 });
    var hangar = new THREE.Mesh(hangarGeo, hangarMat);
    hangar.position.set(0, 150, 0);
    scene.add(hangar);

    // Fighter aircraft docked
    createFighter(-150, 100, -200);
    createFighter(150, 100, -100);
    createFighter(0, 100, 100);

    // Docking gantry arm
    var gantryBaseGeo = new THREE.CylinderGeometry(40, 40, 20, 32);
    var gantryMat = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.8, roughness: 0.2 });
    var gantryBase = new THREE.Mesh(gantryBaseGeo, gantryMat);
    gantryBase.position.set(0, 280, 350);
    scene.add(gantryBase);

    var gantryArmGeo = new THREE.BoxGeometry(80, 30, 400);
    var gantryArm = new THREE.Mesh(gantryArmGeo, gantryMat);
    gantryArm.position.set(0, 280, 100);
    scene.add(gantryArm);
  };

  var createFighter = function(x, y, z) {
    var fuselageGeo = new THREE.BoxGeometry(25, 15, 60);
    var fighterMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.9, roughness: 0.1 });
    var fuselage = new THREE.Mesh(fuselageGeo, fighterMat);
    fuselage.position.set(x, y, z);
    scene.add(fuselage);

    // Cockpit cone
    var cockpitGeo = new THREE.ConeGeometry(8, 25, 8);
    var cockpitMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.7 });
    var cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(x, y + 5, z + 35);
    cockpit.rotation.z = Math.PI;
    scene.add(cockpit);

    // Engines
    createEngine(x - 10, y - 5, z - 20);
    createEngine(x + 10, y - 5, z - 20);
  };

  var createEngine = function(x, y, z) {
    var engineGeo = new THREE.CylinderGeometry(5, 6, 15, 16);
    var engineMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });
    var engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(x, y, z);
    engine.rotation.z = Math.PI / 2;
    scene.add(engine);
  };

  var createRepairCranes = function() {
    // Crane 1
    createCrane(-200, 200, -300);
    // Crane 2
    createCrane(200, 200, -200);
  };

  var createCrane = function(x, y, z) {
    // Main boom
    var boomGeo = new THREE.BoxGeometry(40, 40, 250);
    var craneMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });
    var boom = new THREE.Mesh(boomGeo, craneMat);
    boom.position.set(x, y, z + 100);
    scene.add(boom);

    // Claw apparatus
    var clawBaseGeo = new THREE.CylinderGeometry(25, 25, 20, 16);
    var clawBase = new THREE.Mesh(clawBaseGeo, craneMat);
    clawBase.position.set(x, y - 40, z + 250);
    scene.add(clawBase);

    // Claw fingers
    createClawFinger(x - 15, y - 50, z + 250);
    createClawFinger(x + 15, y - 50, z + 250);
  };

  var createClawFinger = function(x, y, z) {
    var fingerGeo = new THREE.BoxGeometry(8, 8, 30);
    var fingerMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8 });
    var finger = new THREE.Mesh(fingerGeo, fingerMat);
    finger.position.set(x, y, z);
    scene.add(finger);
  };

  var createFuelDepot = function() {
    // Tank 1
    var tank1Geo = new THREE.SphereGeometry(60, 32, 32);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0x2a4a8a, metalness: 0.7, roughness: 0.3 });
    var tank1 = new THREE.Mesh(tank1Geo, tankMat);
    tank1.position.set(-300, 120, 400);
    scene.add(tank1);

    // Tank 2
    var tank2 = new THREE.Mesh(tank1Geo, tankMat);
    tank2.position.set(300, 120, 400);
    scene.add(tank2);

    // Tank 3
    var tank3 = new THREE.Mesh(tank1Geo, tankMat);
    tank3.position.set(0, 120, 500);
    scene.add(tank3);

    // Connecting pipes
    createPipe(-300, 120, 400, 0, 120, 500);
    createPipe(300, 120, 400, 0, 120, 500);

    // Distribution pipes to hangar
    createPipe(0, 150, 500, 0, 150, 200);
  };

  var createPipe = function(x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    var pipeGeo = new THREE.CylinderGeometry(12, 12, length, 16);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x666677, metalness: 0.6, roughness: 0.3 });
    var pipe = new THREE.Mesh(pipeGeo, pipeMat);

    pipe.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

    var axis = new THREE.Vector3(0, 1, 0);
    var targetAxis = new THREE.Vector3(dx, dy, dz).normalize();
    var quat = new THREE.Quaternion();
    quat.setFromUnitVectors(axis, targetAxis);
    pipe.quaternion.copy(quat);

    scene.add(pipe);
  };

  var createCommandBridge = function() {
    // Platform
    var platformGeo = new THREE.BoxGeometry(200, 30, 150);
    var platformMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.7, roughness: 0.2 });
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, 350, -350);
    scene.add(platform);

    // Support pillars
    var pillarGeo = new THREE.CylinderGeometry(25, 25, 300, 16);
    var pillarMat = new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.6, roughness: 0.3 });

    var pillar1 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar1.position.set(-80, 150, -350);
    scene.add(pillar1);

    var pillar2 = new THREE.Mesh(pillarGeo, pillarMat);
    pillar2.position.set(80, 150, -350);
    scene.add(pillar2);

    // Window frames
    createWindowFrame(-80, 360, -300);
    createWindowFrame(80, 360, -300);
    createWindowFrame(0, 360, -280);
  };

  var createWindowFrame = function(x, y, z) {
    var frameGeo = new THREE.BoxGeometry(60, 60, 2);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.8 });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(x, y, z);
    scene.add(frame);

    // Glass pane (transparent)
    var glassMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, transparent: true, opacity: 0.1, metalness: 0.3 });
    var glass = new THREE.Mesh(frameGeo, glassMat);
    glass.position.set(x, y, z - 2);
    scene.add(glass);
  };

  var createRotatingRing = function() {
    var ringGeo = new THREE.CylinderGeometry(600, 600, 80, 64);
    var ringMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.7, roughness: 0.3 });
    dockingRing = new THREE.Mesh(ringGeo, ringMat);
    dockingRing.position.set(0, 0, 0);
    scene.add(dockingRing);

    // Radial support spokes
    for (var i = 0; i < 8; i++) {
      var angle = (Math.PI * 2 / 8) * i;
      var spokeX = Math.cos(angle) * 300;
      var spokeZ = Math.sin(angle) * 300;

      var spokeGeo = new THREE.BoxGeometry(20, 40, 600);
      var spokeMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.6 });
      var spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.position.set(spokeX, 0, spokeZ);
      spoke.rotation.y = angle;
      scene.add(spoke);
    }
  };

  var createEscapePods = function() {
    for (var i = 0; i < 12; i++) {
      var podX = -280 + (i % 4) * 40;
      var podY = 200 - Math.floor(i / 4) * 50;
      var podZ = 350;

      var podGeo = new THREE.CylinderGeometry(12, 15, 40, 16);
      var podMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.8, roughness: 0.2 });
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(podX, podY, podZ);
      scene.add(pod);

      // Heat shield cap
      var shieldGeo = new THREE.ConeGeometry(14, 15, 16);
      var shieldMat = new THREE.MeshStandardMaterial({ color: 0x660000, metalness: 0.7 });
      var shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(podX, podY + 30, podZ);
      scene.add(shield);

      escapePods.push(pod);
    }
  };

  var createEnergyShieldEmitters = function() {
    // Emitter 1
    createShieldEmitter(-200, 180, 300);
    // Emitter 2
    createShieldEmitter(200, 180, 300);
    // Emitter 3
    createShieldEmitter(0, 100, 320);
  };

  var createShieldEmitter = function(x, y, z) {
    var emitterGeo = new THREE.CylinderGeometry(15, 18, 40, 16);
    var emitterMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, metalness: 0.9, roughness: 0.1 });
    var emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.position.set(x, y, z);
    scene.add(emitter);

    // Shield sphere (pulsing glow)
    var shieldGeo = new THREE.SphereGeometry(100, 16, 16);
    var shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x0055ff,
      transparent: true,
      opacity: 0.15,
      metalness: 0.4
    });
    var shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(x, y, z);
    scene.add(shield);

    shieldEmitters.push({ emitter: emitter, shield: shield, pulse: 0 });
  };

  var createMagneticTracks = function() {
    // Main cargo track
    var trackPoints = [];
    trackPoints.push(new THREE.Vector3(-300, 50, -200));
    trackPoints.push(new THREE.Vector3(-300, 50, 200));
    trackPoints.push(new THREE.Vector3(0, 50, 300));
    trackPoints.push(new THREE.Vector3(300, 50, 200));
    trackPoints.push(new THREE.Vector3(300, 50, -200));

    for (var i = 0; i < trackPoints.length - 1; i++) {
      var start = trackPoints[i];
      var end = trackPoints[i + 1];
      createTrackSegment(start.x, start.y, start.z, end.x, end.y, end.z);
    }
  };

  var createTrackSegment = function(x1, y1, z1, x2, y2, z2) {
    var points = [
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2, y2, z2)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    var line = new THREE.LineSegments(geometry, material);
    scene.add(line);
  };

  var createRepairDrones = function() {
    for (var i = 0; i < 4; i++) {
      var droneX = -150 + i * 100;
      var droneY = 250 + Math.sin(i) * 50;
      var droneZ = 0;

      var droneGeo = new THREE.BoxGeometry(20, 20, 20);
      var droneMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, metalness: 0.8, roughness: 0.2 });
      var drone = new THREE.Mesh(droneGeo, droneMat);
      drone.position.set(droneX, droneY, droneZ);

      // Manipulator arm
      var armGeo = new THREE.CylinderGeometry(4, 4, 30, 8);
      var armMat = new THREE.MeshStandardMaterial({ color: 0x00cc00, metalness: 0.7 });
      var arm = new THREE.Mesh(armGeo, armMat);
      arm.position.set(droneX + 20, droneY, droneZ);
      arm.rotation.z = Math.PI / 4;
      scene.add(arm);

      scene.add(drone);
      repairDrones.push({ body: drone, arm: arm, time: 0 });
    }
  };

  var createDriftingCargo = function() {
    for (var i = 0; i < 6; i++) {
      var cargoGeo = new THREE.BoxGeometry(
        30 + Math.random() * 20,
        30 + Math.random() * 20,
        30 + Math.random() * 20
      );
      var cargoMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        metalness: 0.6,
        roughness: 0.4
      });
      var cargo = new THREE.Mesh(cargoGeo, cargoMat);
      cargo.position.set(
        (Math.random() - 0.5) * 400,
        100 + Math.random() * 150,
        (Math.random() - 0.5) * 300
      );
      cargo.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(cargo);

      driftingCargo.push({
        mesh: cargo,
        driftX: (Math.random() - 0.5) * 0.5,
        driftY: (Math.random() - 0.5) * 0.5,
        driftZ: (Math.random() - 0.5) * 0.5,
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
        rotZ: (Math.random() - 0.5) * 0.02
      });
    }
  };

  var update = function(delta) {
    // Rotate main docking ring for gravity simulation
    if (dockingRing) {
      dockingRing.rotation.y += delta * 0.1;
    }

    // Animate repair drones
    for (var i = 0; i < repairDrones.length; i++) {
      var drone = repairDrones[i];
      drone.time += delta;
      drone.body.position.y = 250 + Math.sin(drone.time) * 40;
      drone.arm.rotation.z = Math.PI / 4 + Math.sin(drone.time * 2) * 0.5;
    }

    // Animate drifting cargo
    for (var j = 0; j < driftingCargo.length; j++) {
      var cargo = driftingCargo[j];
      cargo.mesh.position.x += cargo.driftX;
      cargo.mesh.position.y += cargo.driftY;
      cargo.mesh.position.z += cargo.driftZ;
      cargo.mesh.rotation.x += cargo.rotX;
      cargo.mesh.rotation.y += cargo.rotY;
      cargo.mesh.rotation.z += cargo.rotZ;

      // Bounce off boundaries
      if (Math.abs(cargo.mesh.position.x) > 250) cargo.driftX *= -1;
      if (Math.abs(cargo.mesh.position.y) > 200 || cargo.mesh.position.y < 50) cargo.driftY *= -1;
      if (Math.abs(cargo.mesh.position.z) > 250) cargo.driftZ *= -1;
    }

    // Pulse shield emitters
    for (var k = 0; k < shieldEmitters.length; k++) {
      var shieldData = shieldEmitters[k];
      shieldData.pulse += delta;
      var pulseVal = 0.15 + Math.sin(shieldData.pulse * 3) * 0.05;
      shieldData.shield.material.opacity = pulseVal;
      shieldData.emitter.rotation.y += delta * 0.5;
    }

    // Pulse escape pod warning lights
    for (var p = 0; p < escapePods.length; p++) {
      var pod = escapePods[p];
      var pulse = Math.sin(update.globalTime * 4 + p) * 0.3 + 0.7;
      pod.material.emissive = new THREE.Color().setHSL(0, 1, pulse * 0.3);
    }

    update.globalTime = (update.globalTime || 0) + delta;
  };

  var reset = function() {
    // Reset animation timers
    update.globalTime = 0;
    for (var i = 0; i < repairDrones.length; i++) {
      repairDrones[i].time = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };

}());
