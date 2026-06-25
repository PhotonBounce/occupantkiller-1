window.ShippingLane = (function() {
  'use strict';

  var shipGroup;
  var radarArm;
  var craneArm;
  var seaGroup;
  var radarRotation = 0;
  var shipRollAngle = 0;
  var shipRollSpeed = 0.5;
  var shipRollAmount = 0.03;
  var waveTime = 0;
  var craneSwayAngle = 0;
  var craneSwaySpeed = 1.2;

  function createBoxGeometry(w, h, d, color, x, y, z) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createCylinderGeometry(rTop, rBot, h, segs, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createSphereGeometry(radius, color, x, y, z) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    return line;
  }

  function createShipHull() {
    var hullGroup = new THREE.Group();

    // Port hull side (left)
    var portHull = createBoxGeometry(2, 8, 40, 0x1a1a2e, -8, -2, 0);
    portHull.castShadow = true;
    hullGroup.add(portHull);

    // Starboard hull side (right)
    var starboardHull = createBoxGeometry(2, 8, 40, 0x1a1a2e, 8, -2, 0);
    starboardHull.castShadow = true;
    hullGroup.add(starboardHull);

    // Keel
    var keel = createBoxGeometry(14, 1, 40, 0x0d0d1a, 0, -5, 0);
    hullGroup.add(keel);

    return hullGroup;
  }

  function createMainDeck() {
    // Main deck - vast flat surface
    var mainDeck = createBoxGeometry(20, 0.5, 50, 0x4a4a5e, 0, 2.5, 0);
    mainDeck.receiveShadow = true;
    return mainDeck;
  }

  function createContainers() {
    var containerGroup = new THREE.Group();

    var colors = [0xff4444, 0x2211cc, 0x44aa44, 0xffaa00, 0x11ccff];
    var colorIdx = 0;

    // Three rows of containers - port, center, starboard
    var rows = [
      { x: -6, z: -15 },
      { x: 0, z: -15 },
      { x: 6, z: -15 }
    ];

    rows.forEach(function(row) {
      for (var i = 0; i < 4; i++) {
        var containerZ = row.z + i * 12;
        var container = createBoxGeometry(3, 3, 5, colors[colorIdx % colors.length], row.x, 4, containerZ);
        container.castShadow = true;
        containerGroup.add(container);

        // Second level containers on some stacks
        if (i % 2 === 0) {
          var containerTop = createBoxGeometry(3, 3, 5, colors[(colorIdx + 1) % colors.length], row.x, 7.5, containerZ);
          containerTop.castShadow = true;
          containerGroup.add(containerTop);
        }
        colorIdx++;
      }
    });

    return containerGroup;
  }

  function createBridgeSuperstructure() {
    var bridgeGroup = new THREE.Group();

    // Bridge tower main structure
    var bridgeTower = createBoxGeometry(6, 10, 8, 0x333344, 0, 8, 18);
    bridgeGroup.add(bridgeTower);

    // Navigation wing port
    var wingPort = createBoxGeometry(3, 2.5, 6, 0x444455, -5, 9, 18);
    bridgeGroup.add(wingPort);

    // Navigation wing starboard
    var wingStarboard = createBoxGeometry(3, 2.5, 6, 0x444455, 5, 9, 18);
    bridgeGroup.add(wingStarboard);

    // Wheelhouse windows (box approximation)
    var window1 = createBoxGeometry(4, 2, 0.3, 0x6699ff, 0, 9.5, 22);
    bridgeGroup.add(window1);

    var window2 = createBoxGeometry(2, 1.5, 0.3, 0x6699ff, -4.5, 10, 18);
    bridgeGroup.add(window2);

    var window3 = createBoxGeometry(2, 1.5, 0.3, 0x6699ff, 4.5, 10, 18);
    bridgeGroup.add(window3);

    return bridgeGroup;
  }

  function createRadarMast() {
    var radarGroup = new THREE.Group();

    // Radar mast pole
    var mastPole = createCylinderGeometry(0.15, 0.15, 12, 8, 0xcccccc, 0, 14, 18);
    radarGroup.add(mastPole);

    // Create radar arm (rotating)
    radarArm = new THREE.Group();

    var radarDome = createCylinderGeometry(1.2, 1.2, 0.8, 16, 0xff6600, 0, 0, 0);
    radarArm.add(radarDome);

    var radarBracket = createBoxGeometry(0.3, 2, 2, 0xaaaaaa, 0, -1.2, 0);
    radarArm.add(radarBracket);

    radarArm.position.set(0, 14, 18);
    radarGroup.add(radarArm);

    return radarGroup;
  }

  function createRadioAntennaArray() {
    var antennaGroup = new THREE.Group();

    // Three antenna masts
    for (var i = 0; i < 3; i++) {
      var antennaMast = createCylinderGeometry(0.1, 0.1, 8, 6, 0xaaaaaa, -3 + i * 3, 13, 15);
      antennaGroup.add(antennaMast);
    }

    // Radio wires between masts
    var wirePoints = [
      -3, 13, 15,  0, 13, 15,
      0, 13, 15,   3, 13, 15,
      -3, 13.5, 15, 0, 14, 15,
      0, 14, 15,   3, 13.5, 15
    ];
    var wireLines = createLineSegments(wirePoints, 0x666666);
    antennaGroup.add(wireLines);

    return antennaGroup;
  }

  function createLifeboatStations() {
    var lifebootGroup = new THREE.Group();

    // Port lifeboat station
    var lifeBoatPort = createBoxGeometry(3, 2, 4, 0xff8800, -9, 3.5, 10);
    lifebootGroup.add(lifeBoatPort);

    // Davit arm port (crane arm for lifeboat)
    var davitPortArm = createCylinderGeometry(0.2, 0.2, 4, 8, 0xcccccc, -9, 6, 10);
    davitPortArm.rotation.z = Math.PI / 4;
    lifebootGroup.add(davitPortArm);

    // Davit support port
    var davitSupportPort = createCylinderGeometry(0.3, 0.3, 3, 8, 0x999999, -9, 4.5, 8);
    lifebootGroup.add(davitSupportPort);

    // Starboard lifeboat station
    var lifeBoatStar = createBoxGeometry(3, 2, 4, 0xff8800, 9, 3.5, 10);
    lifebootGroup.add(lifeBoatStar);

    // Davit arm starboard
    var davitStarArm = createCylinderGeometry(0.2, 0.2, 4, 8, 0xcccccc, 9, 6, 10);
    davitStarArm.rotation.z = -Math.PI / 4;
    lifebootGroup.add(davitStarArm);

    // Davit support starboard
    var davitSupportStar = createCylinderGeometry(0.3, 0.3, 3, 8, 0x999999, 9, 4.5, 8);
    lifebootGroup.add(davitSupportStar);

    return lifebootGroup;
  }

  function createAnchorChain() {
    var chainGroup = new THREE.Group();

    // Anchor chain line
    var chainPoints = [];
    for (var i = 0; i <= 8; i++) {
      chainPoints.push(-7 + i * 0.5, 1, -22);
      chainPoints.push(-7 + (i + 0.5) * 0.5, 0.5, -22);
    }
    var chainLine = createLineSegments(chainPoints, 0x666666);
    chainGroup.add(chainLine);

    // Chain links (spheres)
    for (var j = 0; j < 6; j++) {
      var link = createSphereGeometry(0.3, 0x888888, -7 + j * 1.5, 0.5, -22);
      chainGroup.add(link);
    }

    // Anchor
    var anchorFluke1 = createBoxGeometry(0.3, 3, 0.2, 0x444444, -8, -1.5, -22);
    chainGroup.add(anchorFluke1);

    var anchorFluke2 = createBoxGeometry(0.3, 3, 0.2, 0x444444, -6, -1.5, -22);
    chainGroup.add(anchorFluke2);

    var anchorShank = createCylinderGeometry(0.25, 0.25, 2, 6, 0x555555, -7, -2, -22);
    chainGroup.add(anchorShank);

    return chainGroup;
  }

  function createGangwayLadders() {
    var ladderGroup = new THREE.Group();

    // Port side gangway ladder
    var portSidePoints = [
      -9, 2.5, 5,  -9, -1, 3,
      -8.5, 2.5, 5,  -8.5, -1, 3
    ];
    var portLadder = createLineSegments(portSidePoints, 0xaaaaaa);
    ladderGroup.add(portLadder);

    // Port rungs
    for (var i = 0; i < 5; i++) {
      var rungY = 2.5 - i * 0.7;
      var portRungPoints = [
        -9, rungY, 5,  -8.5, rungY, 5
      ];
      var portRung = createLineSegments(portRungPoints, 0xaaaaaa);
      ladderGroup.add(portRung);
    }

    // Starboard side gangway ladder
    var starSidePoints = [
      9, 2.5, 5,  9, -1, 3,
      8.5, 2.5, 5,  8.5, -1, 3
    ];
    var starLadder = createLineSegments(starSidePoints, 0xaaaaaa);
    ladderGroup.add(starLadder);

    // Starboard rungs
    for (var j = 0; j < 5; j++) {
      var rungYStar = 2.5 - j * 0.7;
      var starRungPoints = [
        9, rungYStar, 5,  8.5, rungYStar, 5
      ];
      var starRung = createLineSegments(starRungPoints, 0xaaaaaa);
      ladderGroup.add(starRung);
    }

    return ladderGroup;
  }

  function createEngineRoomHatch() {
    var hatchGroup = new THREE.Group();

    // Heavy engine room cover
    var hatchCover = createBoxGeometry(4, 0.5, 6, 0x444444, 0, 2.5, -20);
    hatchCover.castShadow = true;
    hatchGroup.add(hatchCover);

    // Hatch latches
    var latch1 = createBoxGeometry(0.3, 0.8, 0.5, 0x666666, -1.5, 3, -20);
    hatchGroup.add(latch1);

    var latch2 = createBoxGeometry(0.3, 0.8, 0.5, 0x666666, 1.5, 3, -20);
    hatchGroup.add(latch2);

    // Hatch frame ring
    var framePoints = [
      -2, 2.8, -23,  2, 2.8, -23,
      2, 2.8, -23,   2, 2.8, -17,
      2, 2.8, -17,   -2, 2.8, -17,
      -2, 2.8, -17,  -2, 2.8, -23
    ];
    var frameRing = createLineSegments(framePoints, 0xcccccc);
    hatchGroup.add(frameRing);

    return hatchGroup;
  }

  function createVentilationFunnels() {
    var funnelGroup = new THREE.Group();

    // Main engine funnel (large smokestack)
    var mainFunnel = createCylinderGeometry(1.5, 1.5, 15, 12, 0x222222, 2, 8, -18);
    mainFunnel.castShadow = true;
    funnelGroup.add(mainFunnel);

    // Funnel bands
    for (var i = 0; i < 3; i++) {
      var band = createCylinderGeometry(1.6, 1.6, 0.4, 12, 0xff0000, 2, 5 + i * 4, -18);
      funnelGroup.add(band);
    }

    // Auxiliary vent
    var auxVent = createCylinderGeometry(0.8, 0.8, 8, 8, 0x333333, -2, 5, -15);
    funnelGroup.add(auxVent);

    return funnelGroup;
  }

  function createDeckCrane() {
    var craneGroup = new THREE.Group();

    // Crane base pedestal
    var craneBase = createCylinderGeometry(1, 1, 2, 12, 0xcccccc, -8, 3, -8);
    craneGroup.add(craneBase);

    // Crane column
    var craneColumn = createCylinderGeometry(0.4, 0.4, 6, 8, 0xbbbbbb, -8, 5, -8);
    craneGroup.add(craneColumn);

    // Create rotating crane arm
    craneArm = new THREE.Group();

    // Jib arm
    var jibArm = createBoxGeometry(10, 0.6, 0.6, 0xaaaaaa, 0, 0, 0);
    craneArm.add(jibArm);

    // Hook block
    var hookBlock = createBoxGeometry(0.8, 1.5, 0.8, 0x666666, 3, -2, 0);
    craneArm.add(hookBlock);

    // Cable (line segments)
    var cablePoints = [
      3, -2, 0,  3, -4, 0
    ];
    var cable = createLineSegments(cablePoints, 0x444444);
    craneArm.add(cable);

    craneArm.position.set(-8, 9, -8);
    craneGroup.add(craneArm);

    return craneGroup;
  }

  function createHawsepipe() {
    var hawseGroup = new THREE.Group();

    // Hawsepipe (anchor chain guide tube)
    var hawse = createCylinderGeometry(0.8, 0.8, 3, 12, 0x555555, -7, 0.5, -23);
    hawse.castShadow = true;
    hawseGroup.add(hawse);

    // Hawse flange
    var flange = createCylinderGeometry(1.2, 0.8, 0.3, 12, 0x666666, -7, 1.8, -23);
    hawseGroup.add(flange);

    return hawseGroup;
  }

  function createMooringBitts() {
    var bittsGroup = new THREE.Group();

    // Port bitts (mooring bollards)
    var bitt1 = createBoxGeometry(0.5, 1.5, 0.5, 0x444444, -9, 2.8, 25);
    bittsGroup.add(bitt1);

    var bitt2 = createBoxGeometry(0.5, 1.5, 0.5, 0x444444, -7, 2.8, 25);
    bittsGroup.add(bitt2);

    // Starboard bitts
    var bitt3 = createBoxGeometry(0.5, 1.5, 0.5, 0x444444, 9, 2.8, 25);
    bittsGroup.add(bitt3);

    var bitt4 = createBoxGeometry(0.5, 1.5, 0.5, 0x444444, 7, 2.8, 25);
    bittsGroup.add(bitt4);

    return bittsGroup;
  }

  function createWaterTightDoors() {
    var doorGroup = new THREE.Group();

    // Main watertight door
    var mainDoor = createBoxGeometry(2.5, 3, 0.3, 0x333333, 0, 2, -30);
    mainDoor.castShadow = true;
    doorGroup.add(mainDoor);

    // Door frame
    var framePoints = [
      -1.3, 0.5, -30,  1.3, 0.5, -30,
      1.3, 0.5, -30,   1.3, 3.5, -30,
      1.3, 3.5, -30,   -1.3, 3.5, -30,
      -1.3, 3.5, -30,  -1.3, 0.5, -30
    ];
    var doorFrame = createLineSegments(framePoints, 0xffff00);
    doorGroup.add(doorFrame);

    // Auxiliary door starboard
    var auxDoor = createBoxGeometry(1.8, 2.5, 0.3, 0x333333, 8, 2.5, -5);
    doorGroup.add(auxDoor);

    return doorGroup;
  }

  function createSeaSurface() {
    var seaGroup = new THREE.Group();

    // Ocean surface - large boxes to simulate rolling sea
    var seaColor = 0x1a4d7a;

    // Multiple sea sections for wave effect
    for (var x = -40; x <= 40; x += 20) {
      for (var z = -60; z <= 60; z += 20) {
        var seaSection = createBoxGeometry(20, 0.5, 20, seaColor, x, -6, z);
        seaSection.receiveShadow = true;
        seaGroup.add(seaSection);
      }
    }

    // Horizon sky - distant water
    var horizon = createBoxGeometry(150, 30, 80, 0x2b5a8a, 0, 12, -60);
    seaGroup.add(horizon);

    return seaGroup;
  }

  function createRiggingLines() {
    var riggingGroup = new THREE.Group();

    // Standing rigging from mast
    var riggingPoints = [
      0, 14, 18,  -8, 2.5, 0,
      0, 14, 18,  8, 2.5, 0,
      0, 14, 18,  -8, 2.5, -30,
      0, 14, 18,  8, 2.5, -30
    ];
    var rigging = createLineSegments(riggingPoints, 0xcccccc);
    riggingGroup.add(rigging);

    return riggingGroup;
  }

  function createLifeRingStation() {
    var ringGroup = new THREE.Group();

    // Life ring (donut approximation using sphere)
    var ring = createSphereGeometry(1, 0xff0000, -9, 4.5, -10);
    ring.scale.set(1.8, 0.4, 1.8);
    ringGroup.add(ring);

    // Life ring support pole
    var ringPole = createCylinderGeometry(0.2, 0.2, 2.5, 8, 0xcccccc, -9, 3.5, -10);
    ringGroup.add(ringPole);

    // Life ring cabinet
    var cabinet = createBoxGeometry(1.2, 1.5, 0.6, 0xff4444, -9, 3.2, -12);
    ringGroup.add(cabinet);

    return ringGroup;
  }

  function createDeckGrating() {
    var gratingGroup = new THREE.Group();

    // Deck grating sections (ridged floor)
    for (var i = 0; i < 4; i++) {
      var grateZ = -8 + i * 10;
      var grating = createBoxGeometry(16, 0.3, 8, 0x5a5a6e, 0, 2.7, grateZ);
      grating.receiveShadow = true;
      gratingGroup.add(grating);
    }

    return gratingGroup;
  }

  function createFlareLocker() {
    var lockerGroup = new THREE.Group();

    // Flare cabinet - red locker
    var flareLocker = createBoxGeometry(1.5, 2, 1, 0xdd0000, 7, 3, -25);
    flareLocker.castShadow = true;
    lockerGroup.add(flareLocker);

    // Locker door frame
    var doorFramePoints = [
      6.2, 2, -25,  7.8, 2, -25,
      7.8, 2, -25,  7.8, 4, -25,
      7.8, 4, -25,  6.2, 4, -25,
      6.2, 4, -25,  6.2, 2, -25
    ];
    var doorFrame = createLineSegments(doorFramePoints, 0xffff00);
    lockerGroup.add(doorFrame);

    // Handle
    var handle = createCylinderGeometry(0.1, 0.1, 0.6, 6, 0xffff00, 7.8, 3, -24.5);
    lockerGroup.add(handle);

    return lockerGroup;
  }

  function init(scene, camera) {
    // Main ship group for roll animation
    shipGroup = new THREE.Group();

    // Build ship components
    var hull = createShipHull();
    shipGroup.add(hull);

    var mainDeck = createMainDeck();
    shipGroup.add(mainDeck);

    var containers = createContainers();
    shipGroup.add(containers);

    var bridge = createBridgeSuperstructure();
    shipGroup.add(bridge);

    var radar = createRadarMast();
    shipGroup.add(radar);

    var antennas = createRadioAntennaArray();
    shipGroup.add(antennas);

    var lifeboats = createLifeboatStations();
    shipGroup.add(lifeboats);

    var anchor = createAnchorChain();
    shipGroup.add(anchor);

    var ladders = createGangwayLadders();
    shipGroup.add(ladders);

    var hatch = createEngineRoomHatch();
    shipGroup.add(hatch);

    var funnels = createVentilationFunnels();
    shipGroup.add(funnels);

    var crane = createDeckCrane();
    shipGroup.add(crane);

    var hawse = createHawsepipe();
    shipGroup.add(hawse);

    var bitts = createMooringBitts();
    shipGroup.add(bitts);

    var doors = createWaterTightDoors();
    shipGroup.add(doors);

    var rigging = createRiggingLines();
    shipGroup.add(rigging);

    var lifeRing = createLifeRingStation();
    shipGroup.add(lifeRing);

    var grating = createDeckGrating();
    shipGroup.add(grating);

    var flare = createFlareLocker();
    shipGroup.add(flare);

    scene.add(shipGroup);

    // Add sea surface
    seaGroup = createSeaSurface();
    scene.add(seaGroup);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 25, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x1a4d7a, 0.4);
    scene.add(hemisphereLight);
  }

  function update(delta) {
    if (!shipGroup) return;

    // Ship gentle roll animation
    shipRollAngle += shipRollSpeed * delta;
    shipGroup.rotation.z = Math.sin(shipRollAngle) * shipRollAmount;

    // Radar arm continuous spin
    if (radarArm) {
      radarRotation += 2 * delta;
      radarArm.rotation.y = radarRotation;
    }

    // Crane pendulum sway
    if (craneArm) {
      craneSwayAngle += craneSwaySpeed * delta;
      craneArm.rotation.z = Math.sin(craneSwayAngle) * 0.15;
    }

    // Sea wave shimmer
    if (seaGroup) {
      waveTime += delta;
      var waveOffset = Math.sin(waveTime * 0.8) * 0.2;
      var children = seaGroup.children;
      for (var i = 0; i < Math.min(children.length, 36); i++) {
        children[i].position.y = -6 + waveOffset * Math.sin(i * 0.5);
      }
    }
  }

  function reset() {
    radarRotation = 0;
    shipRollAngle = 0;
    waveTime = 0;
    craneSwayAngle = 0;

    if (radarArm) {
      radarArm.rotation.set(0, 0, 0);
    }

    if (craneArm) {
      craneArm.rotation.set(0, 0, 0);
    }

    if (shipGroup) {
      shipGroup.rotation.set(0, 0, 0);
    }

    if (seaGroup) {
      var children = seaGroup.children;
      for (var i = 0; i < Math.min(children.length, 36); i++) {
        children[i].position.y = -6;
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
