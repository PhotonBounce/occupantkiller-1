window.ScrapyardSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var cranePosition = 0;
  var craneDirection = 1;
  var glowPulse = 0;
  var dustParticles = [];
  var rustParts = [];
  var initialState = {};

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    cranePosition = 0;
    craneDirection = 1;
    glowPulse = 0;
    dustParticles = [];
    rustParts = [];

    buildScrapyard();
  }

  function buildScrapyard() {
    var groundGeometry = new THREE.BoxGeometry(500, 1, 500);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.9,
      metalness: 0.1
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -5;
    ground.receiveShadow = true;
    scene.add(ground);

    buildTankRow(0, 0, 80);
    buildTankRow(150, 0, 80);
    buildTankRow(-150, 0, 80);

    buildAircraftFuselageRow(0, 50, 60);
    buildAircraftFuselageRow(120, 50, 60);

    buildArtilleryGunLine(0, 100, 70);
    buildArtilleryGunLine(-180, 100, 70);

    buildTruckGraveyard(80, 150, 50);
    buildHelicopterAirframes(-80, 150, 50);

    buildArmoredCarHulls(0, -100, 40);

    buildNavalGunMount(180, 0, 0);

    buildMissileLauncher(-180, 50, 0);

    buildMaintenancePit(0, 200, 0);

    buildWorkshopBuilding(0, 250, 100);

    buildPartsBins(-100, 180, 50);

    buildFuelDrumStacks(200, 0, 100);

    buildCraneBridge();

    buildPerimeter();

    buildFightingPositions();

    buildSniperPost(150, 200, 100);

    buildArmoredShields();

    createGlowLight();
    createDustDevil();
  }

  function buildTankRow(offsetX, offsetY, length) {
    var tankCount = Math.floor(length / 40);
    for (var i = 0; i < tankCount; i++) {
      var x = offsetX + i * 40;
      var y = offsetY;
      buildTankHulk(x, y);
    }
  }

  function buildTankHulk(x, y) {
    var bodyGeometry = new THREE.BoxGeometry(8, 4, 12);
    var rustMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3a2a,
      roughness: 0.95,
      metalness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, rustMaterial);
    body.position.set(x, y + 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);

    var turretGeometry = new THREE.CylinderGeometry(3, 3.2, 3, 16);
    var turret = new THREE.Mesh(turretGeometry, rustMaterial);
    turret.position.set(x, y + 5.5, 0);
    turret.castShadow = true;
    scene.add(turret);

    var barrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var barrel = new THREE.Mesh(barrelGeometry, rustMaterial);
    barrel.rotation.z = 0.1;
    barrel.position.set(x + 4, y + 5.5, 0);
    barrel.castShadow = true;
    scene.add(barrel);

    rustParts.push({ mesh: body, wobblePhase: Math.random() * Math.PI * 2 });
    rustParts.push({ mesh: turret, wobblePhase: Math.random() * Math.PI * 2 });
  }

  function buildAircraftFuselageRow(offsetX, offsetY, length) {
    var planeCount = Math.floor(length / 35);
    for (var i = 0; i < planeCount; i++) {
      var x = offsetX + i * 35;
      var z = offsetY;
      buildAircraftFuselage(x, z);
    }
  }

  function buildAircraftFuselage(x, z) {
    var fuselageGeometry = new THREE.BoxGeometry(3, 3, 16);
    var planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      roughness: 0.8,
      metalness: 0.4
    });
    var fuselage = new THREE.Mesh(fuselageGeometry, planeMaterial);
    fuselage.position.set(x, 1.5, z);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);

    var wingStubGeometry = new THREE.BoxGeometry(12, 0.5, 2);
    var wingL = new THREE.Mesh(wingStubGeometry, planeMaterial);
    wingL.position.set(x - 6, 1.5, z);
    wingL.castShadow = true;
    scene.add(wingL);

    var wingR = new THREE.Mesh(wingStubGeometry, planeMaterial);
    wingR.position.set(x + 6, 1.5, z);
    wingR.castShadow = true;
    scene.add(wingR);

    var cockpitGeometry = new THREE.BoxGeometry(2, 2, 3);
    var cockpit = new THREE.Mesh(cockpitGeometry, planeMaterial);
    cockpit.position.set(x, 2.5, z + 6);
    cockpit.castShadow = true;
    scene.add(cockpit);
  }

  function buildArtilleryGunLine(offsetX, offsetY, length) {
    var gunCount = Math.floor(length / 30);
    for (var i = 0; i < gunCount; i++) {
      var x = offsetX + i * 30;
      var z = offsetY;
      buildArtilleryGun(x, z);
    }
  }

  function buildArtilleryGun(x, z) {
    var carriageGeometry = new THREE.BoxGeometry(6, 2, 8);
    var gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.85,
      metalness: 0.5
    });
    var carriage = new THREE.Mesh(carriageGeometry, gunMaterial);
    carriage.position.set(x, 1, z);
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    scene.add(carriage);

    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.7, 10, 8);
    var barrel = new THREE.Mesh(barrelGeometry, gunMaterial);
    barrel.rotation.z = -0.3;
    barrel.position.set(x, 3, z + 2);
    barrel.castShadow = true;
    scene.add(barrel);

    var breechGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
    var breech = new THREE.Mesh(breechGeometry, gunMaterial);
    breech.position.set(x, 2.2, z - 1);
    breech.castShadow = true;
    scene.add(breech);

    rustParts.push({ mesh: carriage, wobblePhase: Math.random() * Math.PI * 2 });
  }

  function buildTruckGraveyard(offsetX, offsetY, length) {
    var truckCount = 4;
    for (var i = 0; i < truckCount; i++) {
      var x = offsetX + i * 25;
      var z = offsetY;
      buildTruckHulk(x, z);
    }
  }

  function buildTruckHulk(x, z) {
    var cabGeometry = new THREE.BoxGeometry(4, 3, 3);
    var truckMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a2a,
      roughness: 0.9,
      metalness: 0.2
    });
    var cab = new THREE.Mesh(cabGeometry, truckMaterial);
    cab.position.set(x - 3, 1.5, z);
    cab.castShadow = true;
    cab.receiveShadow = true;
    scene.add(cab);

    var bedGeometry = new THREE.BoxGeometry(8, 2.5, 3);
    var bed = new THREE.Mesh(bedGeometry, truckMaterial);
    bed.position.set(x + 2, 1.25, z);
    bed.castShadow = true;
    scene.add(bed);

    var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12);
    for (var w = 0; w < 6; w++) {
      var wheel = new THREE.Mesh(wheelGeometry, truckMaterial);
      var wheelX = x - 2 + w * 2.5;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 1.2, z - 2);
      wheel.castShadow = true;
      scene.add(wheel);
    }
  }

  function buildHelicopterAirframes(offsetX, offsetY, length) {
    var heliCount = 3;
    for (var i = 0; i < heliCount; i++) {
      var x = offsetX + i * 35;
      var z = offsetY;
      buildHelicopterFrame(x, z);
    }
  }

  function buildHelicopterFrame(x, z) {
    var fuselageGeometry = new THREE.BoxGeometry(4, 4, 10);
    var heliMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3a4a,
      roughness: 0.88,
      metalness: 0.35
    });
    var fuselage = new THREE.Mesh(fuselageGeometry, heliMaterial);
    fuselage.position.set(x, 2, z);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);

    var rotorMastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var rotorMast = new THREE.Mesh(rotorMastGeometry, heliMaterial);
    rotorMast.position.set(x, 5, z);
    rotorMast.castShadow = true;
    scene.add(rotorMast);

    var rotorBladeGeometry = new THREE.BoxGeometry(18, 0.3, 2);
    var rotorBlade = new THREE.Mesh(rotorBladeGeometry, heliMaterial);
    rotorBlade.position.set(x, 5.5, z);
    rotorBlade.castShadow = true;
    scene.add(rotorBlade);

    var landingGearGeometry = new THREE.BoxGeometry(0.5, 3, 0.5);
    for (var g = 0; g < 4; g++) {
      var gear = new THREE.Mesh(landingGearGeometry, heliMaterial);
      var gearX = x + (g < 2 ? -2 : 2);
      var gearZ = z + (g % 2 === 0 ? -3 : 3);
      gear.position.set(gearX, 0.5, gearZ);
      gear.castShadow = true;
      scene.add(gear);
    }
  }

  function buildArmoredCarHulls(offsetX, offsetY, spacing) {
    var carCount = 5;
    for (var i = 0; i < carCount; i++) {
      var x = offsetX + i * spacing;
      var z = offsetY;
      buildArmoredCar(x, z);
    }
  }

  function buildArmoredCar(x, z) {
    var hullGeometry = new THREE.BoxGeometry(6, 3, 4);
    var armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.7,
      metalness: 0.6
    });
    var hull = new THREE.Mesh(hullGeometry, armorMaterial);
    hull.position.set(x, 1.5, z);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);

    var gunPortGeometry = new THREE.BoxGeometry(2, 1.5, 0.4);
    var gunPort = new THREE.Mesh(gunPortGeometry, armorMaterial);
    gunPort.position.set(x, 2, z + 1.8);
    gunPort.castShadow = true;
    scene.add(gunPort);

    rustParts.push({ mesh: hull, wobblePhase: Math.random() * Math.PI * 2 });
  }

  function buildNavalGunMount(offsetX, offsetY, offsetZ) {
    var pedestalGeometry = new THREE.BoxGeometry(8, 3, 8);
    var gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.85,
      metalness: 0.5
    });
    var pedestal = new THREE.Mesh(pedestalGeometry, gunMaterial);
    pedestal.position.set(offsetX, 1.5, offsetZ);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.1, 12, 12);
    var barrelL = new THREE.Mesh(barrelGeometry, gunMaterial);
    barrelL.rotation.z = -0.2;
    barrelL.position.set(offsetX - 2.5, 4, offsetZ);
    barrelL.castShadow = true;
    scene.add(barrelL);

    var barrelR = new THREE.Mesh(barrelGeometry, gunMaterial);
    barrelR.rotation.z = -0.2;
    barrelR.position.set(offsetX + 2.5, 4, offsetZ);
    barrelR.castShadow = true;
    scene.add(barrelR);

    var rotationRingGeometry = new THREE.CylinderGeometry(5, 5, 1.5, 24);
    var rotationRing = new THREE.Mesh(rotationRingGeometry, gunMaterial);
    rotationRing.position.set(offsetX, 3, offsetZ);
    rotationRing.castShadow = true;
    scene.add(rotationRing);
  }

  function buildMissileLauncher(offsetX, offsetY, offsetZ) {
    var frameGeometry = new THREE.BoxGeometry(10, 4, 6);
    var launcherMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a2a,
      roughness: 0.9,
      metalness: 0.25
    });
    var frame = new THREE.Mesh(frameGeometry, launcherMaterial);
    frame.position.set(offsetX, 2, offsetZ);
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);

    var tubeCount = 4;
    for (var t = 0; t < tubeCount; t++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
      var tube = new THREE.Mesh(tubeGeometry, launcherMaterial);
      var tubeX = offsetX - 2.5 + t * 1.7;
      var tubeZ = offsetZ - 1;
      tube.rotation.x = 0.3;
      tube.position.set(tubeX, 3.5, tubeZ);
      tube.castShadow = true;
      scene.add(tube);
    }

    var radarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
    var radar = new THREE.Mesh(radarGeometry, launcherMaterial);
    radar.position.set(offsetX, 5, offsetZ + 3);
    radar.castShadow = true;
    scene.add(radar);
  }

  function buildMaintenancePit(offsetX, offsetY, offsetZ) {
    var pitGeometry = new THREE.BoxGeometry(30, 4, 20);
    var pitMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.95,
      metalness: 0.1
    });
    var pit = new THREE.Mesh(pitGeometry, pitMaterial);
    pit.position.set(offsetX, -2, offsetZ);
    pit.receiveShadow = true;
    scene.add(pit);

    var edgeGeometry = new THREE.BoxGeometry(30, 0.5, 20);
    var edge = new THREE.Mesh(edgeGeometry, pitMaterial);
    edge.position.set(offsetX, 2, offsetZ);
    edge.castShadow = true;
    scene.add(edge);

    for (var s = 0; s < 4; s++) {
      var supportGeometry = new THREE.BoxGeometry(2, 4, 2);
      var support = new THREE.Mesh(supportGeometry, pitMaterial);
      var supportX = offsetX + (s % 2 === 0 ? -12 : 12);
      var supportZ = offsetZ + (s < 2 ? -8 : 8);
      support.position.set(supportX, 0, supportZ);
      support.castShadow = true;
      scene.add(support);
    }
  }

  function buildWorkshopBuilding(offsetX, offsetY, offsetZ) {
    var wallsGeometry = new THREE.BoxGeometry(40, 8, 30);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      roughness: 0.85,
      metalness: 0.15
    });
    var walls = new THREE.Mesh(wallsGeometry, wallMaterial);
    walls.position.set(offsetX, 4, offsetZ);
    walls.castShadow = true;
    walls.receiveShadow = true;
    scene.add(walls);

    var roofGeometry = new THREE.BoxGeometry(42, 1, 32);
    var roof = new THREE.Mesh(roofGeometry, wallMaterial);
    roof.position.set(offsetX, 8.5, offsetZ);
    roof.castShadow = true;
    scene.add(roof);

    var doorGeometry = new THREE.BoxGeometry(12, 6, 1);
    var doorL = new THREE.Mesh(doorGeometry, wallMaterial);
    doorL.position.set(offsetX - 8, 3, offsetZ - 15.5);
    doorL.castShadow = true;
    scene.add(doorL);

    var doorR = new THREE.Mesh(doorGeometry, wallMaterial);
    doorR.position.set(offsetX + 8, 3, offsetZ - 15.5);
    doorR.castShadow = true;
    scene.add(doorR);

    var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    for (var w = 0; w < 6; w++) {
      var window = new THREE.Mesh(windowGeometry, wallMaterial);
      window.position.set(offsetX - 15 + w * 6, 5, offsetZ - 15.5);
      window.castShadow = true;
      scene.add(window);
    }
  }

  function buildPartsBins(offsetX, offsetY, offsetZ) {
    var shelfGeometry = new THREE.BoxGeometry(40, 12, 8);
    var binMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8,
      metalness: 0.3
    });
    var shelf = new THREE.Mesh(shelfGeometry, binMaterial);
    shelf.position.set(offsetX, 6, offsetZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);

    var binCount = 12;
    for (var b = 0; b < binCount; b++) {
      var binGeometry = new THREE.BoxGeometry(3, 2.5, 2);
      var bin = new THREE.Mesh(binGeometry, binMaterial);
      var binX = offsetX - 18 + b * 3.5;
      var binZ = offsetZ;
      var binY = 2 + Math.floor(b / 6) * 3;
      bin.position.set(binX, binY, binZ);
      bin.castShadow = true;
      scene.add(bin);
    }

    var supportGeometry = new THREE.BoxGeometry(2, 14, 2);
    var supportL = new THREE.Mesh(supportGeometry, binMaterial);
    supportL.position.set(offsetX - 18, 7, offsetZ);
    supportL.castShadow = true;
    scene.add(supportL);

    var supportR = new THREE.Mesh(supportGeometry, binMaterial);
    supportR.position.set(offsetX + 18, 7, offsetZ);
    supportR.castShadow = true;
    scene.add(supportR);
  }

  function buildFuelDrumStacks(offsetX, offsetY, offsetZ) {
    var drumCount = 12;
    for (var d = 0; d < drumCount; d++) {
      var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2.5, 12);
      var drumMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a2a1a,
        roughness: 0.9,
        metalness: 0.4
      });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      var drumX = offsetX + d % 4 * 3.5 - 5;
      var drumZ = offsetZ + Math.floor(d / 4) * 3.5 - 3;
      var drumY = 1.25 + Math.floor(d / 8) * 2.5;
      drum.position.set(drumX, drumY, drumZ);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
    }
  }

  function buildCraneBridge() {
    var beamGeometry = new THREE.BoxGeometry(300, 1.5, 2);
    var craneMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.6
    });
    var beam = new THREE.Mesh(beamGeometry, craneMaterial);
    beam.position.set(0, 25, 50);
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);

    var supportGeometry = new THREE.BoxGeometry(3, 25, 3);
    var supportL = new THREE.Mesh(supportGeometry, craneMaterial);
    supportL.position.set(-145, 12.5, 50);
    supportL.castShadow = true;
    scene.add(supportL);

    var supportR = new THREE.Mesh(supportGeometry, craneMaterial);
    supportR.position.set(145, 12.5, 50);
    supportR.castShadow = true;
    scene.add(supportR);

    var hoistGeometry = new THREE.BoxGeometry(2, 12, 2);
    var hoist = new THREE.Mesh(hoistGeometry, craneMaterial);
    hoist.position.set(0, 15, 50);
    hoist.castShadow = true;
    hoist.userData.isHoist = true;
    scene.add(hoist);

    var cablePoints = [
      new THREE.Vector3(-140, 25, 50),
      new THREE.Vector3(-140, 15, 50),
      new THREE.Vector3(0, 12, 50),
      new THREE.Vector3(140, 15, 50),
      new THREE.Vector3(140, 25, 50)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cables);
  }

  function buildPerimeter() {
    var postCount = 24;
    var radius = 250;
    for (var p = 0; p < postCount; p++) {
      var angle = (p / postCount) * Math.PI * 2;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius;

      var postGeometry = new THREE.BoxGeometry(0.8, 6, 0.8);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.9,
        metalness: 0.2
      });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, 3, z);
      post.castShadow = true;
      scene.add(post);

      if (p < postCount - 1) {
        var wirePoints = [
          new THREE.Vector3(x, 4, z),
          new THREE.Vector3(Math.cos(angle + Math.PI * 2 / postCount) * radius, 4, Math.sin(angle + Math.PI * 2 / postCount) * radius)
        ];
        var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
      }
    }
  }

  function buildFightingPositions() {
    var posCount = 8;
    for (var fp = 0; fp < posCount; fp++) {
      var angle = (fp / posCount) * Math.PI * 2;
      var x = Math.cos(angle) * 120;
      var z = Math.sin(angle) * 120;

      var sandbagGeometry = new THREE.BoxGeometry(4, 1.5, 2);
      var sandbagMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a4a,
        roughness: 0.95,
        metalness: 0.05
      });
      var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbag.position.set(x, 0.75, z);
      sandbag.castShadow = true;
      sandbag.receiveShadow = true;
      scene.add(sandbag);

      var sandbagBack = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbagBack.position.set(x, 0.75, z + 2);
      sandbagBack.castShadow = true;
      scene.add(sandbagBack);
    }
  }

  function buildSniperPost(offsetX, offsetY, offsetZ) {
    var platformGeometry = new THREE.BoxGeometry(6, 1, 6);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      roughness: 0.85,
      metalness: 0.3
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(offsetX, offsetY, offsetZ);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);

    var railingGeometry = new THREE.BoxGeometry(6, 1.2, 0.4);
    for (var r = 0; r < 4; r++) {
      var railing = new THREE.Mesh(railingGeometry, platformMaterial);
      if (r === 0) railing.position.set(offsetX, offsetY + 1, offsetZ - 2.8);
      else if (r === 1) railing.position.set(offsetX, offsetY + 1, offsetZ + 2.8);
      else if (r === 2) railing.geometry = new THREE.BoxGeometry(0.4, 1.2, 6);
      else if (r === 2) railing.position.set(offsetX - 2.8, offsetY + 1, offsetZ);
      else railing.position.set(offsetX + 2.8, offsetY + 1, offsetZ);
      railing.castShadow = true;
      scene.add(railing);
    }
  }

  function buildArmoredShields() {
    var shieldCount = 10;
    for (var sh = 0; sh < shieldCount; sh++) {
      var shieldGeometry = new THREE.BoxGeometry(8, 3, 0.5);
      var shieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.7
      });
      var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      var angle = (sh / shieldCount) * Math.PI * 2;
      var x = Math.cos(angle) * 80;
      var z = Math.sin(angle) * 80;
      shield.rotation.y = angle;
      shield.position.set(x, 1.5, z);
      shield.castShadow = true;
      scene.add(shield);
    }
  }

  function createGlowLight() {
    var glowGeometry = new THREE.SphereGeometry(3, 16, 16);
    var glowMaterial = new THREE.MeshBasicMaterial({ color: 0xff6633 });
    var glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    glowSphere.position.set(200, 40, 200);
    glowSphere.userData.isGlow = true;
    scene.add(glowSphere);

    var glowLight = new THREE.PointLight(0xff6633, 1.5, 300);
    glowLight.position.copy(glowSphere.position);
    glowLight.castShadow = true;
    scene.add(glowLight);
  }

  function createDustDevil() {
    var dustCount = 50;
    for (var d = 0; d < dustCount; d++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        opacity: 0.6,
        transparent: true,
        roughness: 0.95,
        metalness: 0.1
      });
      var particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(100, 5 + Math.random() * 20, 100);
      particle.userData.dustPhase = Math.random() * Math.PI * 2;
      particle.userData.dustRadius = Math.random() * 15 + 5;
      particle.userData.dustHeight = Math.random() * 30;
      dustParticles.push(particle);
      scene.add(particle);
    }
  }

  function update(delta) {
    cranePosition += craneDirection * delta * 20;
    if (cranePosition > 140) craneDirection = -1;
    if (cranePosition < -140) craneDirection = 1;

    var hoists = scene.children.filter(function(child) {
      return child.userData && child.userData.isHoist;
    });
    hoists.forEach(function(hoist) {
      hoist.position.x = cranePosition;
    });

    glowPulse += delta * 2;
    var glows = scene.children.filter(function(child) {
      return child.userData && child.userData.isGlow;
    });
    glows.forEach(function(glow) {
      var scale = 1 + Math.sin(glowPulse) * 0.3;
      glow.scale.set(scale, scale, scale);
    });

    dustParticles.forEach(function(particle, index) {
      var phase = particle.userData.dustPhase + glowPulse * 0.5;
      var radius = particle.userData.dustRadius;
      particle.position.x = 100 + Math.cos(phase) * radius;
      particle.position.z = 100 + Math.sin(phase) * radius;
      particle.position.y = particle.userData.dustHeight + Math.sin(glowPulse + index) * 3;
    });

    rustParts.forEach(function(rustPart) {
      var wobble = Math.sin(glowPulse * 3 + rustPart.wobblePhase) * 0.02;
      rustPart.mesh.rotation.z = wobble;
    });
  }

  function reset() {
    cranePosition = 0;
    craneDirection = 1;
    glowPulse = 0;
    dustParticles.forEach(function(particle) {
      particle.position.set(100, 5 + Math.random() * 20, 100);
    });
    rustParts.forEach(function(rustPart) {
      rustPart.mesh.rotation.z = 0;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
