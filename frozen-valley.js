window.FrozenValley = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var blizzardParticles = [];
  var crackLights = [];
  var stationLights = [];
  var time = 0;

  var materials = {};

  function initMaterials() {
    materials.iceWhite = new THREE.MeshStandardMaterial({ color: 0xF0FFFF, metalness: 0.6, roughness: 0.3 });
    materials.iceBlue = new THREE.MeshStandardMaterial({ color: 0x4A90E2, metalness: 0.7, roughness: 0.2 });
    materials.deepGlacierBlue = new THREE.MeshStandardMaterial({ color: 0x1E3A8A, metalness: 0.8, roughness: 0.1 });
    materials.darkCrevasse = new THREE.MeshStandardMaterial({ color: 0x0A0E27, metalness: 0.4, roughness: 0.9 });
    materials.snow = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.2, roughness: 0.8 });
    materials.researchYellow = new THREE.MeshStandardMaterial({ color: 0xFFB819, metalness: 0.3, roughness: 0.6 });
    materials.researchOrange = new THREE.MeshStandardMaterial({ color: 0xFF8C00, metalness: 0.3, roughness: 0.6 });
    materials.steelGray = new THREE.MeshStandardMaterial({ color: 0xA9A9A9, metalness: 0.7, roughness: 0.3 });
    materials.snowParticle = new THREE.MeshStandardMaterial({ color: 0xE8F4F8, metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.8 });
  }

  function addObject(mesh) {
    objects.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createGlacierWalls() {
    // Left glacier wall
    var leftWallGeo = new THREE.BoxGeometry(8, 25, 80);
    var leftWall = new THREE.Mesh(leftWallGeo, materials.deepGlacierBlue);
    leftWall.position.set(-36, 12.5, 0);
    addObject(leftWall);

    // Right glacier wall
    var rightWallGeo = new THREE.BoxGeometry(8, 25, 80);
    var rightWall = new THREE.Mesh(rightWallGeo, materials.deepGlacierBlue);
    rightWall.position.set(36, 12.5, 0);
    addObject(rightWall);

    // Back glacier wall
    var backWallGeo = new THREE.BoxGeometry(80, 25, 8);
    var backWall = new THREE.Mesh(backWallGeo, materials.deepGlacierBlue);
    backWall.position.set(0, 12.5, -36);
    addObject(backWall);

    // Front glacier wall
    var frontWallGeo = new THREE.BoxGeometry(80, 25, 8);
    var frontWall = new THREE.Mesh(frontWallGeo, materials.deepGlacierBlue);
    frontWall.position.set(0, 12.5, 36);
    addObject(frontWall);
  }

  function createFrozenRiver() {
    // Main river surface - wide white-gray ice
    var riverGeo = new THREE.BoxGeometry(16, 0.5, 80);
    var river = new THREE.Mesh(riverGeo, materials.snow);
    river.position.set(0, 0.25, 0);
    addObject(river);

    // River depth layer (darker blue)
    var riverDepthGeo = new THREE.BoxGeometry(16, 3, 80);
    var riverDepth = new THREE.Mesh(riverDepthGeo, materials.iceBlue);
    riverDepth.position.set(0, -1.5, 0);
    addObject(riverDepth);
  }

  function createIcePressureRidges() {
    // Diagonal ice sheet 1
    var ridge1Geo = new THREE.BoxGeometry(12, 8, 2);
    var ridge1 = new THREE.Mesh(ridge1Geo, materials.iceWhite);
    ridge1.position.set(-8, 4, -20);
    ridge1.rotation.z = Math.PI / 6;
    addObject(ridge1);

    // Diagonal ice sheet 2
    var ridge2Geo = new THREE.BoxGeometry(12, 8, 2);
    var ridge2 = new THREE.Mesh(ridge2Geo, materials.iceBlue);
    ridge2.position.set(10, 5, 15);
    ridge2.rotation.z = -Math.PI / 5;
    addObject(ridge2);

    // Diagonal ice sheet 3
    var ridge3Geo = new THREE.BoxGeometry(10, 6, 2);
    var ridge3 = new THREE.Mesh(ridge3Geo, materials.iceWhite);
    ridge3.position.set(-5, 3, 25);
    ridge3.rotation.z = Math.PI / 7;
    addObject(ridge3);

    // Diagonal ice sheet 4
    var ridge4Geo = new THREE.BoxGeometry(14, 7, 2);
    var ridge4 = new THREE.Mesh(ridge4Geo, materials.iceBlue);
    ridge4.position.set(12, 4, -10);
    ridge4.rotation.z = Math.PI / 4;
    addObject(ridge4);

    // Diagonal ice sheet 5
    var ridge5Geo = new THREE.BoxGeometry(11, 6, 2);
    var ridge5 = new THREE.Mesh(ridge5Geo, materials.iceWhite);
    ridge5.position.set(-12, 3, 0);
    ridge5.rotation.z = -Math.PI / 6;
    addObject(ridge5);
  }

  function createCrevassFields() {
    // Crevasse 1
    var crev1Geo = new THREE.BoxGeometry(1.5, 8, 6);
    var crev1 = new THREE.Mesh(crev1Geo, materials.darkCrevasse);
    crev1.position.set(-4, 3.5, -15);
    addObject(crev1);

    // Crevasse 2
    var crev2Geo = new THREE.BoxGeometry(1.2, 10, 5);
    var crev2 = new THREE.Mesh(crev2Geo, materials.darkCrevasse);
    crev2.position.set(6, 4.5, -8);
    addObject(crev2);

    // Crevasse 3
    var crev3Geo = new THREE.BoxGeometry(1.8, 7, 7);
    var crev3 = new THREE.Mesh(crev3Geo, materials.darkCrevasse);
    crev3.position.set(-8, 3.25, 10);
    addObject(crev3);

    // Crevasse 4
    var crev4Geo = new THREE.BoxGeometry(1.3, 9, 6);
    var crev4 = new THREE.Mesh(crev4Geo, materials.darkCrevasse);
    crev4.position.set(10, 4.25, 22);
    addObject(crev4);

    // Crevasse 5
    var crev5Geo = new THREE.BoxGeometry(1.6, 8, 5);
    var crev5 = new THREE.Mesh(crev5Geo, materials.darkCrevasse);
    crev5.position.set(-6, 3.75, 5);
    addObject(crev5);

    // Crevasse 6
    var crev6Geo = new THREE.BoxGeometry(1.4, 7.5, 6);
    var crev6 = new THREE.Mesh(crev6Geo, materials.darkCrevasse);
    crev6.position.set(8, 3.5, -25);
    addObject(crev6);
  }

  function createIceCaves() {
    // Cave entrance 1 on left wall
    var cave1FrameGeo = new THREE.BoxGeometry(4, 5, 2);
    var cave1Frame = new THREE.Mesh(cave1FrameGeo, materials.iceBlue);
    cave1Frame.position.set(-34, 8, -20);
    addObject(cave1Frame);

    var cave1InteriorGeo = new THREE.BoxGeometry(3.5, 4.5, 3);
    var cave1Interior = new THREE.Mesh(cave1InteriorGeo, materials.deepGlacierBlue);
    cave1Interior.position.set(-32, 8, -20);
    addObject(cave1Interior);

    // Cave entrance 2 on left wall
    var cave2FrameGeo = new THREE.BoxGeometry(4, 4.5, 2);
    var cave2Frame = new THREE.Mesh(cave2FrameGeo, materials.iceBlue);
    cave2Frame.position.set(-34, 6, 15);
    addObject(cave2Frame);

    var cave2InteriorGeo = new THREE.BoxGeometry(3.5, 4, 3);
    var cave2Interior = new THREE.Mesh(cave2InteriorGeo, materials.deepGlacierBlue);
    cave2Interior.position.set(-32, 6, 15);
    addObject(cave2Interior);

    // Cave entrance 3 on right wall
    var cave3FrameGeo = new THREE.BoxGeometry(4, 5.5, 2);
    var cave3Frame = new THREE.Mesh(cave3FrameGeo, materials.iceBlue);
    cave3Frame.position.set(34, 9, 5);
    addObject(cave3Frame);

    var cave3InteriorGeo = new THREE.BoxGeometry(3.5, 5, 3);
    var cave3Interior = new THREE.Mesh(cave3InteriorGeo, materials.deepGlacierBlue);
    cave3Interior.position.set(32, 9, 5);
    addObject(cave3Interior);

    // Ice crystal formations in caves
    var crystal1Geo = new THREE.ConeGeometry(0.5, 2, 6);
    var crystal1 = new THREE.Mesh(crystal1Geo, materials.iceWhite);
    crystal1.position.set(-32, 5, -20);
    addObject(crystal1);

    var crystal2Geo = new THREE.ConeGeometry(0.4, 1.8, 6);
    var crystal2 = new THREE.Mesh(crystal2Geo, materials.iceWhite);
    crystal2.position.set(-32, 3, 15);
    addObject(crystal2);

    var crystal3Geo = new THREE.ConeGeometry(0.6, 2.2, 6);
    var crystal3 = new THREE.Mesh(crystal3Geo, materials.iceWhite);
    crystal3.position.set(32, 8, 5);
    addObject(crystal3);
  }

  function createPolarResearchStation() {
    // Module 1 - main structure
    var mod1Geo = new THREE.BoxGeometry(8, 4, 6);
    var mod1 = new THREE.Mesh(mod1Geo, materials.researchYellow);
    mod1.position.set(-10, 2, -30);
    addObject(mod1);

    // Module 2 - attached
    var mod2Geo = new THREE.BoxGeometry(6, 4, 5);
    var mod2 = new THREE.Mesh(mod2Geo, materials.researchOrange);
    mod2.position.set(-2, 2, -30);
    addObject(mod2);

    // Module 3 - laboratory extension
    var mod3Geo = new THREE.BoxGeometry(5, 3.5, 4);
    var mod3 = new THREE.Mesh(mod3Geo, materials.researchYellow);
    mod3.position.set(4, 1.75, -27);
    addObject(mod3);

    // Connector tube
    var connectorGeo = new THREE.BoxGeometry(2, 3, 3);
    var connector = new THREE.Mesh(connectorGeo, materials.steelGray);
    connector.position.set(-6, 2, -28);
    addObject(connector);

    // Snow covering modules
    var snowCover1Geo = new THREE.BoxGeometry(8, 1.5, 6);
    var snowCover1 = new THREE.Mesh(snowCover1Geo, materials.snow);
    snowCover1.position.set(-10, 4.75, -30);
    addObject(snowCover1);

    var snowCover2Geo = new THREE.BoxGeometry(6, 1.2, 5);
    var snowCover2 = new THREE.Mesh(snowCover2Geo, materials.snow);
    snowCover2.position.set(-2, 4.6, -30);
    addObject(snowCover2);

    // Station windows (will flicker)
    var window1Geo = new THREE.BoxGeometry(1.5, 1, 0.2);
    var window1 = new THREE.Mesh(window1Geo, new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 1 }));
    window1.position.set(-13, 2.5, -27.9);
    addObject(window1);
    stationLights.push(window1);

    var window2Geo = new THREE.BoxGeometry(1.5, 1, 0.2);
    var window2 = new THREE.Mesh(window2Geo, new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 1 }));
    window2.position.set(-7, 2.5, -27.9);
    addObject(window2);
    stationLights.push(window2);

    var window3Geo = new THREE.BoxGeometry(1.5, 1, 0.2);
    var window3 = new THREE.Mesh(window3Geo, new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 1 }));
    window3.position.set(0, 1.8, -27.8);
    addObject(window3);
    stationLights.push(window3);

    var window4Geo = new THREE.BoxGeometry(1.5, 1, 0.2);
    var window4 = new THREE.Mesh(window4Geo, new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00, emissiveIntensity: 1 }));
    window4.position.set(6, 1.8, -25.8);
    addObject(window4);
    stationLights.push(window4);

    // Antenna structure
    var antennaBaseGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
    var antennaBase = new THREE.Mesh(antennaBaseGeo, materials.steelGray);
    antennaBase.position.set(-10, 5, -25);
    addObject(antennaBase);

    var antennaDishGeo = new THREE.ConeGeometry(1.2, 0.5, 16);
    var antennaDish = new THREE.Mesh(antennaDishGeo, materials.steelGray);
    antennaDish.position.set(-10, 7.5, -25);
    addObject(antennaDish);
  }

  function createSnowcatVehicles() {
    // Snowcat 1
    var cat1BodyGeo = new THREE.BoxGeometry(3, 2, 5);
    var cat1Body = new THREE.Mesh(cat1BodyGeo, materials.researchOrange);
    cat1Body.position.set(-20, 1, -35);
    addObject(cat1Body);

    var cat1WheelFrontGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var cat1WheelFront = new THREE.Mesh(cat1WheelFrontGeo, materials.steelGray);
    cat1WheelFront.position.set(-21.5, 0.6, -33);
    cat1WheelFront.rotation.z = Math.PI / 2;
    addObject(cat1WheelFront);

    var cat1WheelRearGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var cat1WheelRear = new THREE.Mesh(cat1WheelRearGeo, materials.steelGray);
    cat1WheelRear.position.set(-21.5, 0.6, -37);
    cat1WheelRear.rotation.z = Math.PI / 2;
    addObject(cat1WheelRear);

    var cat1TrackFrontGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
    var cat1TrackFront = new THREE.Mesh(cat1TrackFrontGeo, materials.steelGray);
    cat1TrackFront.position.set(-20, 0.3, -33);
    addObject(cat1TrackFront);

    var cat1TrackRearGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
    var cat1TrackRear = new THREE.Mesh(cat1TrackRearGeo, materials.steelGray);
    cat1TrackRear.position.set(-20, 0.3, -37);
    addObject(cat1TrackRear);

    // Snowcat 2
    var cat2BodyGeo = new THREE.BoxGeometry(3, 2, 5);
    var cat2Body = new THREE.Mesh(cat2BodyGeo, materials.researchYellow);
    cat2Body.position.set(15, 1, 28);
    addObject(cat2Body);

    var cat2WheelFrontGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var cat2WheelFront = new THREE.Mesh(cat2WheelFrontGeo, materials.steelGray);
    cat2WheelFront.position.set(13.5, 0.6, 30);
    cat2WheelFront.rotation.z = Math.PI / 2;
    addObject(cat2WheelFront);

    var cat2WheelRearGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var cat2WheelRear = new THREE.Mesh(cat2WheelRearGeo, materials.steelGray);
    cat2WheelRear.position.set(13.5, 0.6, 26);
    cat2WheelRear.rotation.z = Math.PI / 2;
    addObject(cat2WheelRear);

    var cat2TrackFrontGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
    var cat2TrackFront = new THREE.Mesh(cat2TrackFrontGeo, materials.steelGray);
    cat2TrackFront.position.set(15, 0.3, 30);
    addObject(cat2TrackFront);

    var cat2TrackRearGeo = new THREE.BoxGeometry(4, 0.3, 1.5);
    var cat2TrackRear = new THREE.Mesh(cat2TrackRearGeo, materials.steelGray);
    cat2TrackRear.position.set(15, 0.3, 26);
    addObject(cat2TrackRear);
  }

  function createIceClimbingAnchors() {
    // Anchor 1 on left wall
    var anchor1BoltGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var anchor1Bolt = new THREE.Mesh(anchor1BoltGeo, materials.steelGray);
    anchor1Bolt.position.set(-32, 15, -25);
    addObject(anchor1Bolt);

    var anchor1RopeGeo = new THREE.BufferGeometry();
    var anchor1RopePositions = new Float32Array([
      -32, 15, -25,
      -30, 12, -20
    ]);
    anchor1RopeGeo.setAttribute('position', new THREE.BufferAttribute(anchor1RopePositions, 3));
    var anchor1Rope = new THREE.LineSegments(anchor1RopeGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 }));
    addObject(anchor1Rope);

    // Anchor 2 on left wall
    var anchor2BoltGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var anchor2Bolt = new THREE.Mesh(anchor2BoltGeo, materials.steelGray);
    anchor2Bolt.position.set(-32, 12, 10);
    addObject(anchor2Bolt);

    var anchor2RopeGeo = new THREE.BufferGeometry();
    var anchor2RopePositions = new Float32Array([
      -32, 12, 10,
      -28, 8, 15
    ]);
    anchor2RopeGeo.setAttribute('position', new THREE.BufferAttribute(anchor2RopePositions, 3));
    var anchor2Rope = new THREE.LineSegments(anchor2RopeGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 }));
    addObject(anchor2Rope);

    // Anchor 3 on right wall
    var anchor3BoltGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var anchor3Bolt = new THREE.Mesh(anchor3BoltGeo, materials.steelGray);
    anchor3Bolt.position.set(32, 14, -10);
    addObject(anchor3Bolt);

    var anchor3RopeGeo = new THREE.BufferGeometry();
    var anchor3RopePositions = new Float32Array([
      32, 14, -10,
      28, 10, -5
    ]);
    anchor3RopeGeo.setAttribute('position', new THREE.BufferAttribute(anchor3RopePositions, 3));
    var anchor3Rope = new THREE.LineSegments(anchor3RopeGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 }));
    addObject(anchor3Rope);

    // Anchor 4 on right wall
    var anchor4BoltGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    var anchor4Bolt = new THREE.Mesh(anchor4BoltGeo, materials.steelGray);
    anchor4Bolt.position.set(32, 11, 20);
    addObject(anchor4Bolt);

    var anchor4RopeGeo = new THREE.BufferGeometry();
    var anchor4RopePositions = new Float32Array([
      32, 11, 20,
      30, 7, 25
    ]);
    anchor4RopeGeo.setAttribute('position', new THREE.BufferAttribute(anchor4RopePositions, 3));
    var anchor4Rope = new THREE.LineSegments(anchor4RopeGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 }));
    addObject(anchor4Rope);
  }

  function createFrozenWaterfall() {
    // Main waterfall column
    var waterfallGeo = new THREE.BoxGeometry(6, 20, 2);
    var waterfall = new THREE.Mesh(waterfallGeo, materials.iceBlue);
    waterfall.position.set(-35, 12, -35);
    waterfall.rotation.z = -0.2;
    addObject(waterfall);

    // Icy ridge accent
    var ridgeGeo = new THREE.BoxGeometry(5, 19, 1.5);
    var ridge = new THREE.Mesh(ridgeGeo, materials.iceWhite);
    ridge.position.set(-35.5, 12, -34.5);
    ridge.rotation.z = -0.2;
    addObject(ridge);

    // Frozen spray at base
    var sprayBaseGeo = new THREE.BoxGeometry(8, 3, 3);
    var sprayBase = new THREE.Mesh(sprayBaseGeo, materials.snow);
    sprayBase.position.set(-35, 2, -35);
    addObject(sprayBase);

    // Icicle formations
    for (var i = 0; i < 5; i++) {
      var icicleGeo = new THREE.ConeGeometry(0.3, 2, 6);
      var icicle = new THREE.Mesh(icicleGeo, materials.iceWhite);
      icicle.position.set(-35 + (i - 2) * 1.2, 0.5 + i * 0.3, -35);
      addObject(icicle);
    }
  }

  function createSnowBridge() {
    // Main arch structure
    var bridgeMainGeo = new THREE.BoxGeometry(10, 4, 2.5);
    var bridgeMain = new THREE.Mesh(bridgeMainGeo, materials.snow);
    bridgeMain.position.set(20, 3, 5);
    bridgeMain.rotation.z = 0.15;
    addObject(bridgeMain);

    // Support column left
    var supportLeftGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
    var supportLeft = new THREE.Mesh(supportLeftGeo, materials.snow);
    supportLeft.position.set(15, 2, 5);
    addObject(supportLeft);

    // Support column right
    var supportRightGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
    var supportRight = new THREE.Mesh(supportRightGeo, materials.snow);
    supportRight.position.set(25, 2, 5);
    addObject(supportRight);

    // Crevasse opening below
    var crevasseBelowGeo = new THREE.BoxGeometry(8, 6, 1);
    var crevasseBlow = new THREE.Mesh(crevasseBelowGeo, materials.darkCrevasse);
    crevasseBlow.position.set(20, -2, 5);
    addObject(crevasseBlow);
  }

  function createSupplyCache() {
    // Crate 1
    var crate1Geo = new THREE.BoxGeometry(2, 2, 2);
    var crate1 = new THREE.Mesh(crate1Geo, materials.researchYellow);
    crate1.position.set(30, 8, -20);
    addObject(crate1);

    // Crate 2
    var crate2Geo = new THREE.BoxGeometry(2, 2, 2);
    var crate2 = new THREE.Mesh(crate2Geo, materials.researchOrange);
    crate2.position.set(33, 8, -20);
    addObject(crate2);

    // Crate 3
    var crate3Geo = new THREE.BoxGeometry(2, 2, 2);
    var crate3 = new THREE.Mesh(crate3Geo, materials.researchYellow);
    crate3.position.set(31.5, 11, -20);
    addObject(crate3);

    // Ice wall embedding
    var embedWallGeo = new THREE.BoxGeometry(6, 6, 2);
    var embedWall = new THREE.Mesh(embedWallGeo, materials.deepGlacierBlue);
    embedWall.position.set(31.5, 9, -19.5);
    addObject(embedWall);
  }

  function createBlizzardParticles() {
    for (var i = 0; i < 60; i++) {
      var particleGeo = new THREE.SphereGeometry(0.15, 4, 4);
      var particle = new THREE.Mesh(particleGeo, materials.snowParticle);

      particle.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() * 30) + 5,
        (Math.random() - 0.5) * 80
      );

      particle.velocity = {
        x: (Math.random() - 0.5) * 3,
        y: -2 - Math.random() * 2,
        z: (Math.random() - 0.5) * 3
      };

      addObject(particle);
      blizzardParticles.push(particle);
    }
  }

  function createIcebbergsFrozenLake() {
    // Iceberg 1
    var berg1Geo = new THREE.BoxGeometry(8, 6, 8);
    var berg1 = new THREE.Mesh(berg1Geo, materials.iceBlue);
    berg1.position.set(25, 3, -5);
    berg1.rotation.x = 0.3;
    berg1.rotation.z = 0.2;
    addObject(berg1);

    // Iceberg 2
    var berg2Geo = new THREE.BoxGeometry(6, 5, 6);
    var berg2 = new THREE.Mesh(berg2Geo, materials.iceWhite);
    berg2.position.set(15, 2.5, 10);
    berg2.rotation.x = -0.2;
    berg2.rotation.z = 0.4;
    addObject(berg2);

    // Iceberg 3
    var berg3Geo = new THREE.BoxGeometry(7, 5.5, 7);
    var berg3 = new THREE.Mesh(berg3Geo, materials.iceBlue);
    berg3.position.set(30, 2.8, 15);
    berg3.rotation.x = 0.25;
    berg3.rotation.z = -0.3;
    addObject(berg3);

    // Iceberg 4
    var berg4Geo = new THREE.BoxGeometry(5, 4, 5);
    var berg4 = new THREE.Mesh(berg4Geo, materials.iceWhite);
    berg4.position.set(20, 2, 25);
    berg4.rotation.x = -0.15;
    berg4.rotation.z = 0.25;
    addObject(berg4);

    // Iceberg 5
    var berg5Geo = new THREE.BoxGeometry(9, 6, 9);
    var berg5 = new THREE.Mesh(berg5Geo, materials.deepGlacierBlue);
    berg5.position.set(10, 3.5, 5);
    berg5.rotation.x = 0.35;
    berg5.rotation.z = -0.2;
    addObject(berg5);
  }

  function createCrackLights() {
    // Light 1 in crevasse area
    var light1Geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var light1Material = new THREE.MeshStandardMaterial({ color: 0x4A90E2, emissive: 0x4A90E2, emissiveIntensity: 0.5 });
    var light1 = new THREE.Mesh(light1Geo, light1Material);
    light1.position.set(-4, 3.5, -15);
    addObject(light1);
    crackLights.push({ mesh: light1, intensity: 0.5 });

    // Light 2 in crevasse area
    var light2Geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var light2Material = new THREE.MeshStandardMaterial({ color: 0x4A90E2, emissive: 0x4A90E2, emissiveIntensity: 0.5 });
    var light2 = new THREE.Mesh(light2Geo, light2Material);
    light2.position.set(6, 4.5, -8);
    addObject(light2);
    crackLights.push({ mesh: light2, intensity: 0.5 });

    // Light 3 in crevasse area
    var light3Geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var light3Material = new THREE.MeshStandardMaterial({ color: 0x4A90E2, emissive: 0x4A90E2, emissiveIntensity: 0.5 });
    var light3 = new THREE.Mesh(light3Geo, light3Material);
    light3.position.set(-8, 3.25, 10);
    addObject(light3);
    crackLights.push({ mesh: light3, intensity: 0.5 });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    blizzardParticles = [];
    crackLights = [];
    stationLights = [];
    time = 0;

    initMaterials();

    createGlacierWalls();
    createFrozenRiver();
    createIcePressureRidges();
    createCrevassFields();
    createIceCaves();
    createPolarResearchStation();
    createSnowcatVehicles();
    createIceClimbingAnchors();
    createFrozenWaterfall();
    createSnowBridge();
    createSupplyCache();
    createBlizzardParticles();
    createIcebbergsFrozenLake();
    createCrackLights();

    // Add ambient light for ice visibility
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    // Add directional light for glacier shadows
    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
  }

  function update(delta) {
    time += delta;

    // Animate blizzard particles
    for (var i = 0; i < blizzardParticles.length; i++) {
      var particle = blizzardParticles[i];
      particle.position.x += particle.velocity.x * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += particle.velocity.z * delta;

      // Wrap around world bounds
      if (particle.position.y < -10) {
        particle.position.y = 35;
        particle.position.x = (Math.random() - 0.5) * 80;
        particle.position.z = (Math.random() - 0.5) * 80;
      }

      if (Math.abs(particle.position.x) > 45) {
        particle.position.x = -particle.position.x;
      }

      if (Math.abs(particle.position.z) > 45) {
        particle.position.z = -particle.position.z;
      }
    }

    // Glacier crack light pulsing
    for (var j = 0; j < crackLights.length; j++) {
      var crackLight = crackLights[j];
      crackLight.intensity = 0.3 + 0.4 * Math.sin(time * 2);
      crackLight.mesh.material.emissiveIntensity = crackLight.intensity;
    }

    // Station window flickering
    for (var k = 0; k < stationLights.length; k++) {
      var stationLight = stationLights[k];
      var flicker = Math.random();
      stationLight.material.emissiveIntensity = flicker > 0.8 ? 0.3 : 1;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    blizzardParticles = [];
    crackLights = [];
    stationLights = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
