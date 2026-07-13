window.SunkenShip = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var shipGroup = null;
  var seabed = null;
  var bubbleStreams = [];
  var fishSchools = [];
  var corals = [];
  var biolumPatches = [];
  var time = 0;

  function init(s, c) {
    scene = s;
    camera = c;
    time = 0;
    bubbleStreams = [];
    fishSchools = [];
    corals = [];
    biolumPatches = [];

    // Create main ship group
    shipGroup = new THREE.Group();
    scene.add(shipGroup);

    // Seabed - sandy dark floor
    var seabedGeometry = new THREE.BoxGeometry(300, 2, 400);
    var seabedMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a35,
      shininess: 10
    });
    seabed = new THREE.Mesh(seabedGeometry, seabedMaterial);
    seabed.position.y = -80;
    seabed.receiveShadow = true;
    shipGroup.add(seabed);

    // Create tilted hull main body (30 degrees)
    var hullGeometry = new THREE.BoxGeometry(50, 120, 180);
    var hullMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      shininess: 20
    });
    var hullBody = new THREE.Mesh(hullGeometry, hullMaterial);
    hullBody.position.set(0, -20, 0);
    hullBody.rotation.z = THREE.MathUtils.degToRad(30);
    hullBody.castShadow = true;
    hullBody.receiveShadow = true;
    shipGroup.add(hullBody);

    // Hull plates detail (outer plates)
    var platesCount = 8;
    for (var i = 0; i < platesCount; i++) {
      var plateGeometry = new THREE.BoxGeometry(52, 12, 180);
      var plateMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 15
      });
      var plate = new THREE.Mesh(plateGeometry, plateMaterial);
      plate.position.set(0, -15 + i * 15, 0);
      plate.rotation.z = THREE.MathUtils.degToRad(30);
      plate.scale.z = 0.98;
      shipGroup.add(plate);
    }

    // Gun turret - main tower structure
    var turretBaseGeometry = new THREE.BoxGeometry(25, 30, 25);
    var turretMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 25
    });
    var turretBase = new THREE.Mesh(turretBaseGeometry, turretMaterial);
    turretBase.position.set(-20, 50, -60);
    turretBase.rotation.z = THREE.MathUtils.degToRad(30);
    turretBase.castShadow = true;
    shipGroup.add(turretBase);

    // Gun barrel - main cannon
    var barrelGeometry = new THREE.CylinderGeometry(3, 3, 80, 16);
    var barrelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 30
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(-20, 65, -40);
    barrel.rotation.x = THREE.MathUtils.degToRad(15);
    barrel.rotation.z = THREE.MathUtils.degToRad(30);
    barrel.castShadow = true;
    shipGroup.add(barrel);

    // Bridge tower
    var bridgeGeometry = new THREE.BoxGeometry(20, 50, 20);
    var bridgeMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 20
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(15, 40, -80);
    bridge.rotation.z = THREE.MathUtils.degToRad(30);
    bridge.castShadow = true;
    shipGroup.add(bridge);

    // Flooded corridor sections (translucent blue water overlay)
    var corridorGeometry = new THREE.BoxGeometry(12, 8, 60);
    var corridorMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a5a,
      shininess: 50,
      transparent: true,
      opacity: 0.4
    });
    var corridor1 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor1.position.set(-8, 10, -40);
    corridor1.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(corridor1);

    var corridor2 = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor2.position.set(8, 10, 20);
    corridor2.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(corridor2);

    // Captain's cabin
    var cabinGeometry = new THREE.BoxGeometry(15, 12, 18);
    var cabinMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a4a3a,
      shininess: 15
    });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(10, 25, 50);
    cabin.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(cabin);

    // Captain's desk
    var deskGeometry = new THREE.BoxGeometry(8, 3, 12);
    var deskMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a3a2a,
      shininess: 10
    });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(12, 30, 52);
    desk.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(desk);

    // Scattered papers (small boxes)
    for (var p = 0; p < 5; p++) {
      var paperGeometry = new THREE.BoxGeometry(2, 0.2, 2.5);
      var paperMaterial = new THREE.MeshPhongMaterial({
        color: 0xccaa88,
        shininess: 5
      });
      var paper = new THREE.Mesh(paperGeometry, paperMaterial);
      paper.position.set(8 + Math.random() * 6, 32 + Math.random() * 2, 48 + Math.random() * 6);
      paper.rotation.z = THREE.MathUtils.degToRad(30 + Math.random() * 20);
      shipGroup.add(paper);
    }

    // Chart room
    var chartRoomGeometry = new THREE.BoxGeometry(14, 11, 16);
    var chartMaterial = new THREE.MeshPhongMaterial({
      color: 0x5a5a4a,
      shininess: 12
    });
    var chartRoom = new THREE.Mesh(chartRoomGeometry, chartMaterial);
    chartRoom.position.set(-12, 22, 60);
    chartRoom.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(chartRoom);

    // Navigation table
    var tableGeometry = new THREE.BoxGeometry(10, 2, 12);
    var tableMatl = new THREE.MeshPhongMaterial({
      color: 0x3a3a2a,
      shininess: 8
    });
    var table = new THREE.Mesh(tableGeometry, tableMatl);
    table.position.set(-12, 27, 62);
    table.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(table);

    // Radio room
    var radioRoomGeometry = new THREE.BoxGeometry(13, 10, 15);
    var radioMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a,
      shininess: 15
    });
    var radioRoom = new THREE.Mesh(radioRoomGeometry, radioMaterial);
    radioRoom.position.set(0, 15, -50);
    radioRoom.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(radioRoom);

    // Engine room with turbine housings
    var engineRoomGeometry = new THREE.BoxGeometry(40, 25, 50);
    var engineMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 20
    });
    var engineRoom = new THREE.Mesh(engineRoomGeometry, engineMaterial);
    engineRoom.position.set(0, -10, 80);
    engineRoom.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(engineRoom);

    // Turbine housings (cylinders)
    for (var t = 0; t < 3; t++) {
      var turbineGeometry = new THREE.CylinderGeometry(8, 8, 35, 16);
      var turbineMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a2a2a,
        shininess: 25
      });
      var turbine = new THREE.Mesh(turbineGeometry, turbineMaterial);
      turbine.position.set(-12 + t * 12, -5, 85);
      turbine.rotation.z = THREE.MathUtils.degToRad(30);
      turbine.rotation.x = THREE.MathUtils.degToRad(15);
      shipGroup.add(turbine);
    }

    // Torpedo tubes
    for (var tt = 0; tt < 4; tt++) {
      var tubeGeometry = new THREE.CylinderGeometry(4, 4, 60, 12);
      var tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        shininess: 28
      });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(-25 + tt * 12, 5, -20);
      tube.rotation.z = THREE.MathUtils.degToRad(30);
      tube.rotation.x = THREE.MathUtils.degToRad(-10 + tt * 5);
      shipGroup.add(tube);
    }

    // Propeller with hub and blades
    var hubGeometry = new THREE.CylinderGeometry(5, 5, 8, 16);
    var hubMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      shininess: 30
    });
    var hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(5, -35, 150);
    hub.rotation.x = Math.PI / 2;
    shipGroup.add(hub);

    // Propeller blades
    for (var b = 0; b < 4; b++) {
      var bladeGeometry = new THREE.BoxGeometry(3, 35, 2);
      var bladeMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a2a2a,
        shininess: 25
      });
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(5, -35, 150);
      blade.rotation.x = Math.PI / 2;
      blade.rotation.z = (b * Math.PI / 2);
      blade.userData.isBladeOriginal = true;
      blade.userData.bladeIndex = b;
      shipGroup.add(blade);
    }

    // Cargo hold
    var cargoHoldGeometry = new THREE.BoxGeometry(35, 20, 45);
    var cargoMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 15
    });
    var cargoHold = new THREE.Mesh(cargoHoldGeometry, cargoMaterial);
    cargoHold.position.set(0, -5, 0);
    cargoHold.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(cargoHold);

    // Cargo crates
    for (var cr = 0; cr < 6; cr++) {
      var crateGeometry = new THREE.BoxGeometry(6, 6, 8);
      var crateMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a3a2a,
        shininess: 10
      });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(-8 + Math.random() * 16, -2 + Math.random() * 4, -10 + cr * 8);
      crate.rotation.z = THREE.MathUtils.degToRad(30);
      crate.rotation.y = Math.random() * Math.PI;
      shipGroup.add(crate);
    }

    // Depth charge rack
    var rackGeometry = new THREE.BoxGeometry(8, 30, 6);
    var rackMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a2a2a,
      shininess: 20
    });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(-28, 15, -30);
    rack.rotation.z = THREE.MathUtils.degToRad(30);
    shipGroup.add(rack);

    // Depth charge drums
    for (var dc = 0; dc < 4; dc++) {
      var drumGeometry = new THREE.CylinderGeometry(2.5, 2.5, 5, 12);
      var drumMaterial = new THREE.MeshPhongMaterial({
        color: 0x8a5a2a,
        shininess: 12
      });
      var drum = new THREE.Mesh(drumGeometry, drumMaterial);
      drum.position.set(-28, 5 + dc * 6, -30);
      drum.rotation.z = THREE.MathUtils.degToRad(30);
      shipGroup.add(drum);
    }

    // Anchor chain on seabed
    createAnchorChain();

    // Coral growth on hull (SphereGeometry clusters)
    createCorals();

    // Fish schools (swarm particles)
    createFishSchools();

    // Bioluminescent patches
    createBiolumPatches();

    // Bubble streams
    createBubbleStreams();
  }

  function createAnchorChain() {
    var chainMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a4a4a,
      shininess: 20
    });

    var chainLength = 60;
    var linkSize = 2;
    var linksCount = Math.floor(chainLength / linkSize);

    for (var i = 0; i < linksCount; i++) {
      var linkGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var link = new THREE.Mesh(linkGeometry, chainMaterial);
      link.position.set(-60, -78 + i * 1.5, -100);
      link.scale.set(1, 1.5, 1);
      shipGroup.add(link);
    }

    // Anchor itself
    var anchorGeometry = new THREE.BoxGeometry(8, 12, 4);
    var anchorMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      shininess: 25
    });
    var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
    anchor.position.set(-60, -100, -100);
    shipGroup.add(anchor);
  }

  function createCorals() {
    var coralPositions = [
      { x: -20, y: -15, z: -50 },
      { x: 15, y: -20, z: -60 },
      { x: 10, y: 20, z: 40 },
      { x: -15, y: 35, z: 60 },
      { x: 25, y: 10, z: 80 },
      { x: -30, y: -10, z: 100 }
    ];

    coralPositions.forEach(function(pos) {
      var coralGroup = new THREE.Group();
      coralGroup.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z));
      coralGroup.userData.originalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);

      for (var i = 0; i < 4; i++) {
        var coralGeometry = new THREE.SphereGeometry(1.5 + i * 0.8, 6, 6);
        var coralMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(0.15 + Math.random() * 0.15, 0.8, 0.4),
          shininess: 10
        });
        var coral = new THREE.Mesh(coralGeometry, coralMaterial);
        coral.position.y = i * 1.2;
        coral.userData.swayAmplitude = 0.3;
        coral.userData.swayPhase = Math.random() * Math.PI * 2;
        coralGroup.add(coral);
      }

      shipGroup.add(coralGroup);
      corals.push(coralGroup);
    });
  }

  function createFishSchools() {
    for (var school = 0; school < 3; school++) {
      var schoolGroup = new THREE.Group();
      schoolGroup.position.set(-40 + school * 40, 30 - school * 20, school * 30);
      schoolGroup.userData.centerX = schoolGroup.position.x;
      schoolGroup.userData.centerY = schoolGroup.position.y;
      schoolGroup.userData.centerZ = schoolGroup.position.z;
      schoolGroup.userData.time = Math.random() * Math.PI * 2;

      for (var f = 0; f < 12; f++) {
        var fishGeometry = new THREE.SphereGeometry(0.6, 6, 6);
        var fishMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.8, 0.5),
          shininess: 40
        });
        var fish = new THREE.Mesh(fishGeometry, fishMaterial);
        fish.scale.set(1.5, 0.8, 1);
        fish.userData.angle = (f / 12) * Math.PI * 2;
        fish.userData.radius = 8 + Math.random() * 4;
        schoolGroup.add(fish);
      }

      shipGroup.add(schoolGroup);
      fishSchools.push(schoolGroup);
    }
  }

  function createBiolumPatches() {
    var patchPositions = [
      { x: 0, y: 35, z: -70 },
      { x: -25, y: 20, z: 30 },
      { x: 20, y: 10, z: 70 },
      { x: -10, y: 0, z: -40 },
      { x: 15, y: 15, z: 50 }
    ];

    patchPositions.forEach(function(pos) {
      var patchGeometry = new THREE.SphereGeometry(2, 8, 8);
      var patchMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88
      });
      var patch = new THREE.Mesh(patchGeometry, patchMaterial);
      patch.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z));
      patch.userData.originalIntensity = 0.6;
      patch.userData.pulsePhase = Math.random() * Math.PI * 2;
      shipGroup.add(patch);
      biolumPatches.push(patch);
    });
  }

  function createBubbleStreams() {
    var streamPositions = [
      { x: 5, y: 30 },
      { x: -8, y: 25 },
      { x: 12, y: 40 },
      { x: -15, y: 20 },
      { x: 20, y: 35 }
    ];

    streamPositions.forEach(function(pos) {
      var stream = {
        position: new THREE.Vector3(pos.x, pos.y, 0),
        bubbles: []
      };

      for (var b = 0; b < 8; b++) {
        var bubbleGeometry = new THREE.SphereGeometry(0.3, 6, 6);
        var bubbleMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaddff,
          transparent: true,
          opacity: 0.5
        });
        var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
        bubble.position.copy(stream.position);
        bubble.userData.baseX = pos.x;
        bubble.userData.baseZ = 0;
        bubble.userData.offset = b * 0.5;
        bubble.userData.active = true;
        shipGroup.add(bubble);
        stream.bubbles.push(bubble);
      }

      bubbleStreams.push(stream);
    });
  }

  function update(delta) {
    time += delta;

    // Update bubble streams - rise and dissolve
    bubbleStreams.forEach(function(stream) {
      stream.bubbles.forEach(function(bubble) {
        if (!bubble.userData.active) return;

        var age = (time + bubble.userData.offset) % 4;
        bubble.position.y = bubble.userData.baseY + age * 15;
        bubble.position.x = bubble.userData.baseX + Math.sin(time + bubble.userData.offset) * 2;
        bubble.userData.opacity = Math.max(0, 0.6 - age * 0.15);
        bubble.material.opacity = bubble.userData.opacity;

        if (age > 3.8) {
          bubble.userData.active = false;
        }
      });
    });

    // Update fish school swarm pattern
    fishSchools.forEach(function(school) {
      school.userData.time += delta * 0.5;
      school.children.forEach(function(fish) {
        var angle = fish.userData.angle + school.userData.time;
        fish.position.x = Math.cos(angle) * fish.userData.radius;
        fish.position.y = Math.sin(angle * 0.7) * fish.userData.radius * 0.5;
        fish.position.z = Math.sin(angle * 1.3) * fish.userData.radius;
        fish.rotation.y = angle;
      });
    });

    // Update coral gentle sway
    corals.forEach(function(coral) {
      coral.children.forEach(function(coralPart, idx) {
        var swayAmount = Math.sin(time * 0.4 + coralPart.userData.swayPhase + idx) * coralPart.userData.swayAmplitude;
        coralPart.position.x = swayAmount;
        coralPart.rotation.z = swayAmount * 0.2;
      });
    });

    // Update bioluminescence pulse
    biolumPatches.forEach(function(patch) {
      var pulseFactor = Math.sin(time * 1.2 + patch.userData.pulsePhase) * 0.4 + 0.6;
      patch.material.emissive.setHSL(0.35, 1, pulseFactor * 0.5);
      patch.scale.set(1, 1, 1).multiplyScalar(0.8 + pulseFactor * 0.4);
    });

    // Update propeller rotation
    shipGroup.children.forEach(function(child) {
      if (child.userData.isBladeOriginal) {
        child.rotation.z = (child.userData.bladeIndex * Math.PI / 2) + time * 2;
      }
    });
  }

  function reset() {
    time = 0;
    if (shipGroup) {
      scene.remove(shipGroup);
    }
    bubbleStreams = [];
    fishSchools = [];
    corals = [];
    biolumPatches = [];
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
