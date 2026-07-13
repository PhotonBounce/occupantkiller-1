window.TidalBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var waveBlocks = [];
  var sprayParticles = [];
  var radarDome = null;
  var fogHorn = null;
  var craneArm = null;
  var diveTime = 0;
  var waveOffset = 0;

  var init = function(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    waveBlocks = [];
    sprayParticles = [];
    diveTime = 0;
    waveOffset = 0;

    // Sea surface - animated wave blocks
    createSeaSurface();

    // Massive stilt pillars
    createStilts();

    // Platform decks at different heights
    createPlatformDecks();

    // Wave spray at stilt bases
    createWaveSpray();

    // Naval operations center
    createNavalCenter();

    // Helicopter pad
    createHelicopterPad();

    // Weapon emplacements
    createWeaponEmplacements();

    // Ship docking arm
    createDockingArm();

    // Life raft stations
    createLifeRaftStations();

    // Diving bell suspended from crane
    createDivingBell();

    // Fog horn tower
    createFogHorn();
  };

  var createSeaSurface = function() {
    var seaGeometry = new THREE.BoxGeometry(80, 2, 80);
    var seaMaterial = new THREE.MeshPhongMaterial({
      color: 0x0066cc,
      shininess: 100,
      wireframe: false
    });
    var seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
    seaMesh.position.y = -30;
    seaMesh.userData.baseY = -30;
    scene.add(seaMesh);
    objects.push(seaMesh);

    // Create multiple wave blocks for animation
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var x = Math.cos(angle) * 40;
      var z = Math.sin(angle) * 40;

      var waveGeo = new THREE.BoxGeometry(8, 1.5, 8);
      var waveMat = new THREE.MeshPhongMaterial({
        color: 0x0088ff,
        shininess: 80
      });
      var waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.position.set(x, -28, z);
      waveMesh.userData.baseY = -28;
      waveMesh.userData.phase = angle;
      waveMesh.userData.frequency = 1.5 + (i * 0.1);
      scene.add(waveMesh);
      waveBlocks.push(waveMesh);
    }
  };

  var createStilts = function() {
    // Four main stilt pillars at corners
    var stiltPositions = [
      { x: 30, z: 30 },
      { x: -30, z: 30 },
      { x: 30, z: -30 },
      { x: -30, z: -30 }
    ];

    for (var i = 0; i < stiltPositions.length; i++) {
      var pos = stiltPositions[i];
      var stiltGeo = new THREE.CylinderGeometry(3, 3.5, 80, 16);
      var stiltMat = new THREE.MeshPhongMaterial({
        color: 0x444444,
        shininess: 30
      });
      var stilt = new THREE.Mesh(stiltGeo, stiltMat);
      stilt.position.set(pos.x, -30, pos.z);
      scene.add(stilt);
      objects.push(stilt);

      // Barnacle texture rings on stilts
      for (var j = 0; j < 5; j++) {
        var barnacleGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.5, 16);
        var barnMat = new THREE.MeshPhongMaterial({ color: 0x553333 });
        var barnacle = new THREE.Mesh(barnacleGeo, barnMat);
        barnacle.position.set(pos.x, -20 + j * 12, pos.z);
        scene.add(barnacle);
        objects.push(barnacle);
      }
    }

    // Additional central support pillars
    for (var k = 0; k < 2; k++) {
      var centerStiltGeo = new THREE.CylinderGeometry(2.5, 2.8, 80, 14);
      var centerStiltMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var centerStilt = new THREE.Mesh(centerStiltGeo, centerStiltMat);
      centerStilt.position.set(k * 20 - 10, -30, 0);
      scene.add(centerStilt);
      objects.push(centerStilt);
    }
  };

  var createPlatformDecks = function() {
    // Main platform deck
    var mainDeckGeo = new THREE.BoxGeometry(70, 2, 70);
    var deckMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      shininess: 20
    });
    var mainDeck = new THREE.Mesh(mainDeckGeo, deckMat);
    mainDeck.position.y = 5;
    scene.add(mainDeck);
    objects.push(mainDeck);

    // Upper command deck
    var upperDeckGeo = new THREE.BoxGeometry(50, 1.5, 40);
    var upperDeck = new THREE.Mesh(upperDeckGeo, deckMat);
    upperDeck.position.set(0, 20, 5);
    scene.add(upperDeck);
    objects.push(upperDeck);

    // Lower equipment deck
    var lowerDeckGeo = new THREE.BoxGeometry(60, 1.5, 50);
    var lowerDeck = new THREE.Mesh(lowerDeckGeo, deckMat);
    lowerDeck.position.set(-5, -8, -5);
    scene.add(lowerDeck);
    objects.push(lowerDeck);

    // Railing barriers
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var railX = Math.cos(angle) * 38;
      var railZ = Math.sin(angle) * 38;

      var railGeo = new THREE.BoxGeometry(6, 1.2, 0.3);
      var railMat = new THREE.MeshPhongMaterial({ color: 0xaa7700 });
      var rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(railX, 6.5, railZ);
      rail.rotation.z = angle;
      scene.add(rail);
      objects.push(rail);
    }
  };

  var createWaveSpray = function() {
    // Create reusable spray particles
    for (var i = 0; i < 40; i++) {
      var sprayGeo = new THREE.SphereGeometry(0.4, 4, 4);
      var sprayMat = new THREE.MeshPhongMaterial({
        color: 0xccddff,
        emissive: 0x6699ff,
        shininess: 100
      });
      var sprayDrop = new THREE.Mesh(sprayGeo, sprayMat);
      sprayDrop.position.set(
        Math.random() * 60 - 30,
        -25,
        Math.random() * 60 - 30
      );
      sprayDrop.userData.active = false;
      sprayDrop.userData.velocity = new THREE.Vector3(0, 0, 0);
      sprayDrop.userData.lifetime = 0;
      scene.add(sprayDrop);
      sprayParticles.push(sprayDrop);
    }
  };

  var createNavalCenter = function() {
    // Main command center building
    var centerGeo = new THREE.BoxGeometry(20, 15, 20);
    var centerMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 25
    });
    var centerBuilding = new THREE.Mesh(centerGeo, centerMat);
    centerBuilding.position.set(0, 22, -15);
    scene.add(centerBuilding);
    objects.push(centerBuilding);

    // Antenna mast
    var antennaGeo = new THREE.CylinderGeometry(0.4, 0.4, 25, 8);
    var antennaMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(6, 32, -15);
    scene.add(antenna);
    objects.push(antenna);

    // Radar dome
    var radarGeo = new THREE.SphereGeometry(4, 16, 12);
    var radarMat = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      shininess: 60,
      emissive: 0x330000
    });
    radarDome = new THREE.Mesh(radarGeo, radarMat);
    radarDome.position.set(0, 25, -15);
    radarDome.userData.rotationSpeed = 2.0;
    scene.add(radarDome);
    objects.push(radarDome);

    // Windows on command center
    for (var i = 0; i < 3; i++) {
      var windowGeo = new THREE.BoxGeometry(3, 2, 0.2);
      var windowMat = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        emissive: 0x002244
      });
      var window = new THREE.Mesh(windowGeo, windowMat);
      window.position.set(-6 + i * 6, 26, -9.9);
      scene.add(window);
      objects.push(window);
    }
  };

  var createHelicopterPad = function() {
    // Helicopter landing pad
    var padGeo = new THREE.BoxGeometry(25, 0.8, 25);
    var padMat = new THREE.MeshPhongMaterial({
      color: 0xffaa00,
      shininess: 40
    });
    var pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(30, 8, 20);
    scene.add(pad);
    objects.push(pad);

    // H markings using LineSegments
    var hLineGeo = new THREE.BufferGeometry();
    var hVertices = new Float32Array([
      -8, 1, 0,   -8, -1, 0,
      -4, 1, 0,   -4, -1, 0,
      -8, 0, 0,   -4, 0, 0,
      4, 1, 0,    4, -1, 0,
      8, 1, 0,    8, -1, 0,
      4, 0, 0,    8, 0, 0
    ]);
    hLineGeo.setAttribute('position', new THREE.BufferAttribute(hVertices, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 });
    var hMarking = new THREE.LineSegments(hLineGeo, lineMat);
    hMarking.position.set(30, 9, 20);
    scene.add(hMarking);
    objects.push(hMarking);

    // Landing lights - SphereGeometry glow
    var lightGeo = new THREE.SphereGeometry(0.6, 8, 8);
    var lightMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var landingLight = new THREE.Mesh(lightGeo, lightMat);
    landingLight.position.set(30, 9.5, 20);
    landingLight.userData.blinkPhase = 0;
    scene.add(landingLight);
    objects.push(landingLight);
  };

  var createWeaponEmplacements = function() {
    // Gun platform
    var gunPlatGeo = new THREE.BoxGeometry(12, 1, 12);
    var gunMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var gunPlat = new THREE.Mesh(gunPlatGeo, gunMat);
    gunPlat.position.set(-35, 10, 0);
    scene.add(gunPlat);
    objects.push(gunPlat);

    // Cannon barrels
    for (var i = 0; i < 2; i++) {
      var barrelGeo = new THREE.CylinderGeometry(0.8, 0.7, 12, 12);
      var barrelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(-35 + (i * 3 - 1.5), 11.5, 0);
      barrel.rotation.z = 0.3;
      scene.add(barrel);
      objects.push(barrel);
    }

    // Targeting radar dome
    var targetRadarGeo = new THREE.SphereGeometry(2.5, 12, 10);
    var targetRadarMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
    var targetRadar = new THREE.Mesh(targetRadarGeo, targetRadarMat);
    targetRadar.position.set(-35, 13, 0);
    scene.add(targetRadar);
    objects.push(targetRadar);
  };

  var createDockingArm = function() {
    // Crane base pedestal
    var basePedGeo = new THREE.BoxGeometry(6, 3, 6);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var basePed = new THREE.Mesh(basePedGeo, baseMat);
    basePed.position.set(-25, 8, -25);
    scene.add(basePed);
    objects.push(basePed);

    // Extending crane arm
    var armGeo = new THREE.BoxGeometry(35, 1.5, 2);
    var armMat = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
    craneArm = new THREE.Mesh(armGeo, armMat);
    craneArm.position.set(-7, 11.5, -25);
    craneArm.userData.baseX = -7;
    craneArm.userData.extensionAmount = 0;
    scene.add(craneArm);
    objects.push(craneArm);

    // Winch drum
    var winchGeo = new THREE.CylinderGeometry(2.2, 2.2, 4, 16);
    var winchMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
    var winch = new THREE.Mesh(winchGeo, winchMat);
    winch.position.set(-25, 10, -25);
    winch.rotation.z = 0;
    winch.userData.rotationSpeed = 0.3;
    scene.add(winch);
    objects.push(winch);

    // Hook attachment point
    var hookGeo = new THREE.SphereGeometry(0.5, 8, 8);
    var hookMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(10, 9, -25);
    scene.add(hook);
    objects.push(hook);
  };

  var createLifeRaftStations = function() {
    // Orange emergency containers
    var positions = [
      { x: 20, y: 6.5, z: 25 },
      { x: -20, y: 6.5, z: 25 },
      { x: 25, y: 6.5, z: -20 },
      { x: -25, y: 6.5, z: -20 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var raftGeo = new THREE.BoxGeometry(4, 3, 4);
      var raftMat = new THREE.MeshPhongMaterial({
        color: 0xff6600,
        shininess: 50
      });
      var raft = new THREE.Mesh(raftGeo, raftMat);
      raft.position.set(pos.x, pos.y, pos.z);
      scene.add(raft);
      objects.push(raft);

      // Mounting bracket
      var bracketGeo = new THREE.BoxGeometry(1, 2, 1);
      var bracketMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
      var bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(pos.x, pos.y - 2.5, pos.z);
      scene.add(bracket);
      objects.push(bracket);
    }
  };

  var createDivingBell = function() {
    // Pressure vessel - CylinderGeometry
    var bellGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
    var bellMat = new THREE.MeshPhongMaterial({
      color: 0xcc6600,
      shininess: 70
    });
    var divingBell = new THREE.Mesh(bellGeo, bellMat);
    divingBell.position.set(15, -5, -15);
    divingBell.userData.baseY = -5;
    scene.add(divingBell);
    objects.push(divingBell);

    // Suspension cables using LineSegments
    var cableGeo = new THREE.BufferGeometry();
    var cableVertices = new Float32Array([
      15, -5, -15,  10, 12, -25,
      15, -5, -15,  20, 12, -25
    ]);
    cableGeo.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));
    var cableMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeo, cableMat);
    scene.add(cables);
    objects.push(cables);

    // Viewing port - SphereGeometry
    var portGeo = new THREE.SphereGeometry(1.2, 8, 8);
    var portMat = new THREE.MeshPhongMaterial({
      color: 0x0099ff,
      emissive: 0x003366
    });
    var viewPort = new THREE.Mesh(portGeo, portMat);
    viewPort.position.set(15, -3, -15);
    scene.add(viewPort);
    objects.push(viewPort);
  };

  var createFogHorn = function() {
    // Horn tower base
    var towerGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 10);
    var towerMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(35, 5, 0);
    scene.add(tower);
    objects.push(tower);

    // Fog horn cylinder
    fogHorn = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 5, 12),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    fogHorn.position.set(35, 16, 0);
    fogHorn.userData.blinkPhase = 0;
    scene.add(fogHorn);
    objects.push(fogHorn);

    // Horn opening - ConeGeometry pointing outward
    var hornGeo = new THREE.ConeGeometry(1.8, 3, 12);
    var hornMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var horn = new THREE.Mesh(hornGeo, hornMat);
    horn.position.set(35, 14, 0);
    horn.rotation.x = -Math.PI / 2;
    scene.add(horn);
    objects.push(horn);

    // Warning beacon light
    var beaconGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(35, 20, 0);
    beacon.userData.blinkPhase = 0;
    scene.add(beacon);
    objects.push(beacon);
  };

  var update = function(delta) {
    if (!scene) return;

    diveTime += delta;
    waveOffset += delta * 0.5;

    // Animate wave blocks rising and falling in ocean pattern
    for (var i = 0; i < waveBlocks.length; i++) {
      var block = waveBlocks[i];
      var waveHeight = Math.sin(waveOffset + block.userData.phase) * 3 +
                       Math.sin(waveOffset * block.userData.frequency) * 2;
      block.position.y = block.userData.baseY + waveHeight;
      block.rotation.z = Math.sin(waveOffset + block.userData.phase) * 0.2;
    }

    // Update spray particles
    for (var j = 0; j < sprayParticles.length; j++) {
      var spray = sprayParticles[j];

      if (spray.userData.active) {
        spray.userData.lifetime -= delta;
        spray.position.add(spray.userData.velocity);
        spray.userData.velocity.y -= 15 * delta; // gravity

        if (spray.userData.lifetime <= 0) {
          spray.userData.active = false;
          spray.position.y = -25;
        }
      }

      // Randomly spawn new spray
      if (!spray.userData.active && Math.random() < 0.1) {
        spray.userData.active = true;
        spray.userData.lifetime = 1.5;
        spray.position.set(
          Math.random() * 60 - 30,
          -25,
          Math.random() * 60 - 30
        );
        spray.userData.velocity.set(
          (Math.random() - 0.5) * 8,
          Math.random() * 12 + 8,
          (Math.random() - 0.5) * 8
        );
      }
    }

    // Radar rotation
    if (radarDome) {
      radarDome.rotation.y += delta * radarDome.userData.rotationSpeed;
    }

    // Crane arm extension/retraction
    if (craneArm) {
      var armOscillation = Math.sin(diveTime * 0.4) * 8;
      craneArm.scale.x = 1 + (armOscillation / 35) * 0.3;
      craneArm.position.x = craneArm.userData.baseX + armOscillation * 0.5;
    }

    // Winch rotation - find and update
    for (var k = 0; k < objects.length; k++) {
      var obj = objects[k];
      if (obj.userData.rotationSpeed !== undefined) {
        obj.rotation.z += delta * obj.userData.rotationSpeed;
      }
    }

    // Diving bell subtle bobbing
    for (var m = 0; m < objects.length; m++) {
      var item = objects[m];
      if (item.userData.baseY !== undefined && item.userData.baseY === -5) {
        item.position.y = item.userData.baseY + Math.sin(diveTime * 0.8) * 0.5;
      }
    }

    // Fog horn and beacon blinking
    if (fogHorn) {
      fogHorn.userData.blinkPhase += delta;
      var hornIntensity = Math.sin(fogHorn.userData.blinkPhase * 4) > 0 ? 1 : 0;
      fogHorn.material.emissive.setHex(hornIntensity > 0.5 ? 0xff6600 : 0x000000);
    }

    // Landing light blink
    for (var n = 0; n < objects.length; n++) {
      var beacon = objects[n];
      if (beacon.userData.blinkPhase !== undefined && beacon.material.emissive) {
        beacon.userData.blinkPhase += delta * 3;
        var blinkIntensity = Math.sin(beacon.userData.blinkPhase) > 0 ? 1 : 0;
        if (blinkIntensity > 0) {
          beacon.material.color.setHex(0xff0000);
        } else {
          beacon.material.color.setHex(0x330000);
        }
      }
    }
  };

  var reset = function() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
      for (var j = waveBlocks.length - 1; j >= 0; j--) {
        scene.remove(waveBlocks[j]);
      }
      for (var k = sprayParticles.length - 1; k >= 0; k--) {
        scene.remove(sprayParticles[k]);
      }
    }

    objects = [];
    waveBlocks = [];
    sprayParticles = [];
    radarDome = null;
    fogHorn = null;
    craneArm = null;
    diveTime = 0;
    waveOffset = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
